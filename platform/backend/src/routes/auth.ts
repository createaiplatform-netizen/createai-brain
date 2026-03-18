import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

// ─── Config ───────────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS      = 12;
const SESSION_TTL_MS     = 7 * 24 * 60 * 60 * 1000;   // 7 days absolute max
const MFA_PENDING_TTL_MS = 5 * 60 * 1000;              // 5 min to complete MFA
const APP_NAME           = process.env.APP_NAME ?? "Universal Platform";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function setSessionCookie(res: Response, sessionId: string): void {
  res.cookie("sid", sessionId, {
    httpOnly: true,
    signed: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

async function createSession(userId: string): Promise<string> {
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await query(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`,
    [sessionId, userId, expiresAt]
  );
  return sessionId;
}

async function writeAuditLog(params: {
  userId?: string;
  userEmail?: string;
  orgId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  await query(
    `INSERT INTO audit_log (user_id, user_email, org_id, action, resource, resource_id, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      params.userId ?? null,
      params.userEmail ?? null,
      params.orgId ?? null,
      params.action,
      params.resource,
      params.resourceId ?? null,
      params.ip ?? null,
      params.userAgent ?? null,
    ]
  ).catch((err) => console.error("[audit] Write failed:", err));
}

// ─── POST /auth/setup ─────────────────────────────────────────────────────────
// First-run setup: creates the platform's first admin user.
// Only works when zero users exist in the database — returns 403 thereafter.
// This is the safe alternative to hard-coding credentials or seeding scripts.

router.post("/setup", async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, organizationName } = req.body as {
    email?: string;
    password?: string;
    name?: string;
    organizationName?: string;
  };

  if (!email?.trim() || !password || !organizationName?.trim()) {
    res.status(400).json({
      error: "email, password, and organizationName are required.",
    });
    return;
  }

  if (password.length < 12) {
    res.status(400).json({
      error: "Admin password must be at least 12 characters.",
    });
    return;
  }

  try {
    // Only allow setup when no users exist
    const existing = await query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM users"
    );
    if (parseInt(existing[0]?.count ?? "0", 10) > 0) {
      res.status(403).json({
        error: "Setup has already been completed. Use /auth/register to create additional users.",
      });
      return;
    }

    // Create the organization
    const orgId = uuidv4();
    const baseSlug = slugify(organizationName.trim());
    const orgSlug = `${baseSlug}-${orgId.slice(0, 6)}`;
    await query(
      `INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)`,
      [orgId, organizationName.trim(), orgSlug]
    );

    // Create the admin user
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await query(
      `INSERT INTO users (id, email, password_hash, name, role, organization_id)
       VALUES ($1, $2, $3, $4, 'admin', $5)`,
      [userId, email.toLowerCase().trim(), passwordHash, name?.trim() ?? null, orgId]
    );

    const sessionId = await createSession(userId);
    setSessionCookie(res, sessionId);

    await writeAuditLog({
      userId, userEmail: email.toLowerCase().trim(), orgId,
      action: "SETUP", resource: "system",
    });

    res.status(201).json({
      message: "Platform setup complete. You are now signed in as the platform admin.",
      user: {
        id:             userId,
        email:          email.toLowerCase().trim(),
        name:           name?.trim() ?? null,
        role:           "admin",
        organizationId: orgId,
      },
      organization: { id: orgId, name: organizationName.trim(), slug: orgSlug },
    });
  } catch (err) {
    console.error("[auth] Setup error:", err);
    res.status(500).json({ error: "Setup failed. Please try again." });
  }
});

// ─── POST /auth/register ──────────────────────────────────────────────────────
// Creates a user account, auto-creates their personal organization, and logs
// them in. Rate-limited in index.ts (5 per hour per IP).

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, organizationName } = req.body as {
    email?: string;
    password?: string;
    name?: string;
    organizationName?: string;
  };

  if (!email?.trim() || !password) {
    res.status(400).json({ error: "email and password are required." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with that email already exists." });
      return;
    }

    // Auto-create an organization for this user.
    // In a multi-tenant facility scenario, an admin would instead issue an
    // invite token that pre-assigns the user to an existing organization.
    const orgId   = uuidv4();
    const orgName = organizationName?.trim() || `${(name ?? normalizedEmail).split("@")[0]}'s Organization`;
    const baseSlug = slugify(orgName);
    const orgSlug  = `${baseSlug}-${orgId.slice(0, 6)}`;

    await query(
      `INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)`,
      [orgId, orgName, orgSlug]
    );

    const userId      = uuidv4();
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await query(
      `INSERT INTO users (id, email, password_hash, name, role, organization_id)
       VALUES ($1, $2, $3, $4, 'admin', $5)`,
      [userId, normalizedEmail, passwordHash, name?.trim() ?? null, orgId]
    );

    const sessionId = await createSession(userId);
    setSessionCookie(res, sessionId);

    await writeAuditLog({
      userId, userEmail: normalizedEmail, orgId,
      action: "REGISTER", resource: "user", resourceId: userId,
    });

    res.status(201).json({
      user: {
        id:             userId,
        email:          normalizedEmail,
        name:           name?.trim() ?? null,
        role:           "admin",
        organizationId: orgId,
        mfaEnabled:     false,
      },
      organization: { id: orgId, name: orgName, slug: orgSlug },
    });
  } catch (err) {
    console.error("[auth] Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
// Rate-limited in index.ts (10 per 15 min per IP).

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password) {
    res.status(400).json({ error: "email and password are required." });
    return;
  }

  const ip        = req.clientIp ?? "unknown";
  const userAgent = req.headers["user-agent"] ?? "unknown";

  try {
    const rows = await query<{
      id:              string;
      email:           string;
      name:            string | null;
      role:            string;
      organization_id: string | null;
      password_hash:   string;
      is_active:       boolean;
      mfa_enabled:     boolean | null;
    }>(
      `SELECT u.id, u.email, u.name, u.role, u.organization_id, u.password_hash,
              u.is_active, m.enabled AS mfa_enabled
       FROM users u
       LEFT JOIN user_mfa m ON m.user_id = u.id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    // Constant-time comparison even when user doesn't exist (prevents timing attacks)
    const user = rows[0];
    const hashToCompare = user?.password_hash ?? "$2b$12$invalidhashpadding000000000000000000000000000000000000000";
    const valid = await bcrypt.compare(password, hashToCompare);

    if (!user || !valid || !user.is_active) {
      await writeAuditLog({
        userEmail: email.toLowerCase().trim(),
        action: "LOGIN_FAILED", resource: "session", ip, userAgent,
      });
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // ── MFA required path ────────────────────────────────────────────────────
    if (user.mfa_enabled) {
      const pendingId  = uuidv4();
      const expiresAt  = new Date(Date.now() + MFA_PENDING_TTL_MS);
      await query(
        `INSERT INTO pending_mfa (id, user_id, expires_at) VALUES ($1, $2, $3)`,
        [pendingId, user.id, expiresAt]
      );
      res.json({ mfaRequired: true, mfaPendingId: pendingId });
      return;
    }

    // ── Standard login (no MFA) ──────────────────────────────────────────────
    const sessionId = await createSession(user.id);
    await query(
      "UPDATE users SET last_login_at = NOW() WHERE id = $1",
      [user.id]
    );
    setSessionCookie(res, sessionId);

    await writeAuditLog({
      userId: user.id, userEmail: user.email,
      orgId: user.organization_id ?? undefined,
      action: "LOGIN", resource: "session", resourceId: sessionId, ip, userAgent,
    });

    res.json({
      user: {
        id:             user.id,
        email:          user.email,
        name:           user.name,
        role:           user.role,
        organizationId: user.organization_id,
        mfaEnabled:     false,
      },
    });
  } catch (err) {
    console.error("[auth] Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

router.post("/logout", async (req: Request, res: Response): Promise<void> => {
  const sid = req.signedCookies?.sid as string | false | undefined;
  if (sid) {
    if (req.user) {
      await writeAuditLog({
        userId: req.user.id, userEmail: req.user.email,
        orgId: req.user.organizationId ?? undefined,
        action: "LOGOUT", resource: "session", resourceId: sid,
        ip: req.clientIp,
      });
    }
    await query("DELETE FROM sessions WHERE id = $1", [sid]).catch(() => {});
  }
  res.clearCookie("sid", { path: "/" });
  res.json({ success: true });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
// Always returns 200. Returns {user: null} when unauthenticated.
// The frontend calls this on page load to restore session state.

router.get("/me", (req: Request, res: Response): void => {
  res.json({ user: req.user ?? null });
});

// ─── POST /auth/mfa/challenge ─────────────────────────────────────────────────
// Completes the MFA login flow. Takes a pending MFA token + TOTP code.

router.post("/mfa/challenge", async (req: Request, res: Response): Promise<void> => {
  const { mfaPendingId, token } = req.body as {
    mfaPendingId?: string;
    token?: string;
  };

  if (!mfaPendingId || !token) {
    res.status(400).json({ error: "mfaPendingId and token are required." });
    return;
  }

  try {
    const pending = await query<{
      id: string; user_id: string; expires_at: Date;
    }>(
      "SELECT id, user_id, expires_at FROM pending_mfa WHERE id = $1",
      [mfaPendingId]
    );

    if (pending.length === 0 || new Date(pending[0].expires_at) < new Date()) {
      res.status(401).json({ error: "MFA session expired. Please sign in again." });
      return;
    }

    const userId = pending[0].user_id;
    const mfaRow = await query<{ totp_secret: string }>(
      "SELECT totp_secret FROM user_mfa WHERE user_id = $1 AND enabled = true",
      [userId]
    );

    if (mfaRow.length === 0) {
      res.status(401).json({ error: "MFA not configured." });
      return;
    }

    const valid = speakeasy.totp.verify({
      secret:   mfaRow[0].totp_secret,
      encoding: "base32",
      token,
      window:   1,
    });

    if (!valid) {
      res.status(401).json({ error: "Invalid verification code." });
      return;
    }

    // Delete the pending token (single-use)
    await query("DELETE FROM pending_mfa WHERE id = $1", [mfaPendingId]);

    const user = await query<{
      id: string; email: string; name: string | null;
      role: string; organization_id: string | null;
    }>(
      "SELECT id, email, name, role, organization_id FROM users WHERE id = $1",
      [userId]
    );

    const sessionId = await createSession(userId);
    await query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [userId]);
    setSessionCookie(res, sessionId);

    await writeAuditLog({
      userId, userEmail: user[0]?.email,
      orgId: user[0]?.organization_id ?? undefined,
      action: "LOGIN_MFA", resource: "session", resourceId: sessionId,
      ip: req.clientIp,
    });

    res.json({
      user: {
        id:             user[0].id,
        email:          user[0].email,
        name:           user[0].name,
        role:           user[0].role,
        organizationId: user[0].organization_id,
        mfaEnabled:     true,
      },
    });
  } catch (err) {
    console.error("[auth] MFA challenge error:", err);
    res.status(500).json({ error: "MFA verification failed." });
  }
});

// ─── POST /auth/mfa/setup ─────────────────────────────────────────────────────
// Generates a TOTP secret and returns the QR code for the authenticator app.
// The secret is stored but MFA is not enabled until /auth/mfa/confirm succeeds.

router.post("/mfa/setup", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!req.user) return;
  try {
    const secret = speakeasy.generateSecret({
      name:   `${APP_NAME} (${req.user.email})`,
      issuer: APP_NAME,
      length: 32,
    });

    // Upsert — user can restart setup if they haven't confirmed yet
    await query(
      `INSERT INTO user_mfa (user_id, totp_secret, enabled)
       VALUES ($1, $2, false)
       ON CONFLICT (user_id) DO UPDATE SET totp_secret = $2, enabled = false`,
      [req.user.id, secret.base32]
    );

    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url ?? "");

    res.json({
      secret:     secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode:     qrDataUrl,
    });
  } catch (err) {
    console.error("[auth] MFA setup error:", err);
    res.status(500).json({ error: "MFA setup failed." });
  }
});

// ─── POST /auth/mfa/confirm ───────────────────────────────────────────────────
// Verifies a TOTP code and enables MFA on the account.

router.post("/mfa/confirm", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!req.user) return;
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ error: "token is required." });
    return;
  }
  try {
    const mfaRow = await query<{ totp_secret: string }>(
      "SELECT totp_secret FROM user_mfa WHERE user_id = $1",
      [req.user.id]
    );
    if (mfaRow.length === 0) {
      res.status(400).json({ error: "Run /auth/mfa/setup first." });
      return;
    }
    const valid = speakeasy.totp.verify({
      secret:   mfaRow[0].totp_secret,
      encoding: "base32",
      token,
      window:   1,
    });
    if (!valid) {
      res.status(401).json({ error: "Invalid code. Make sure your authenticator app is synced." });
      return;
    }
    await query("UPDATE user_mfa SET enabled = true WHERE user_id = $1", [req.user.id]);
    await writeAuditLog({
      userId: req.user.id, userEmail: req.user.email,
      orgId: req.user.organizationId ?? undefined,
      action: "MFA_ENABLED", resource: "user", resourceId: req.user.id,
      ip: req.clientIp,
    });
    res.json({ success: true, message: "MFA is now active on your account." });
  } catch (err) {
    console.error("[auth] MFA confirm error:", err);
    res.status(500).json({ error: "MFA confirmation failed." });
  }
});

// ─── DELETE /auth/mfa ─────────────────────────────────────────────────────────
// Disables MFA. Requires a valid TOTP code to prevent accidental/forced removal.

router.delete("/mfa", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!req.user) return;
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ error: "token is required to disable MFA." });
    return;
  }
  try {
    const mfaRow = await query<{ totp_secret: string }>(
      "SELECT totp_secret FROM user_mfa WHERE user_id = $1 AND enabled = true",
      [req.user.id]
    );
    if (mfaRow.length === 0) {
      res.status(400).json({ error: "MFA is not currently enabled." });
      return;
    }
    const valid = speakeasy.totp.verify({
      secret: mfaRow[0].totp_secret, encoding: "base32", token, window: 1,
    });
    if (!valid) {
      res.status(401).json({ error: "Invalid code." });
      return;
    }
    await query("DELETE FROM user_mfa WHERE user_id = $1", [req.user.id]);
    await writeAuditLog({
      userId: req.user.id, userEmail: req.user.email,
      orgId: req.user.organizationId ?? undefined,
      action: "MFA_DISABLED", resource: "user", resourceId: req.user.id,
      ip: req.clientIp,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("[auth] MFA delete error:", err);
    res.status(500).json({ error: "Failed to disable MFA." });
  }
});

export default router;
