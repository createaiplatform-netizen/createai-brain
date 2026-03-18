import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

// ─── Config ───────────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Cookie helper ────────────────────────────────────────────────────────────

function setSessionCookie(res: Response, sessionId: string): void {
  res.cookie("sid", sessionId, {
    httpOnly: true,
    signed: true,                              // HMAC-verified with SESSION_SECRET
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

// ─── POST /auth/register ──────────────────────────────────────────────────────
// Creates a new user account and immediately logs them in.
//
// Body: { email: string, password: string, name?: string }
//
// Future: Validate password strength (min length, complexity).
// Future: Send a verification email before activating the account.
// Future: Rate-limit registration per IP to prevent spam.
// Future: Support an invite token that pre-assigns organizationId and role.

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
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
    // Check for existing user
    const existing = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with that email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userId = uuidv4();

    await query(
      `INSERT INTO users (id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, 'member')`,
      [userId, email.toLowerCase().trim(), passwordHash, name?.trim() ?? null]
    );

    // Create session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await query(
      `INSERT INTO sessions (id, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [sessionId, userId, expiresAt]
    );

    setSessionCookie(res, sessionId);

    res.status(201).json({
      user: {
        id:    userId,
        email: email.toLowerCase().trim(),
        name:  name?.trim() ?? null,
        role:  "member",
      },
    });
  } catch (err) {
    console.error("[auth] Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
// Verifies email + password and creates a new session.
//
// Body: { email: string, password: string }
//
// Future: Rate-limit failed attempts per email (lock after N failures).
// Future: Log failed login attempts for security audit trail.
// Future: Support MFA check here before creating the session.

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password) {
    res.status(400).json({ error: "email and password are required." });
    return;
  }

  try {
    const rows = await query<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      organization_id: string | null;
      password_hash: string;
    }>(
      `SELECT id, email, name, role, organization_id, password_hash
       FROM users
       WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    // Use a constant-time comparison path even on "user not found" to prevent
    // timing attacks that would reveal which emails are registered.
    const user = rows[0];
    const hashToCompare = user?.password_hash ?? "$2b$12$invalidhashpadding000000000000000000000000000000000000000";
    const valid = await bcrypt.compare(password, hashToCompare);

    if (!user || !valid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Invalidate any existing sessions for this user before creating a new one.
    // Optional: remove this to allow concurrent sessions on multiple devices.
    // await query("DELETE FROM sessions WHERE user_id = $1", [user.id]);

    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await query(
      `INSERT INTO sessions (id, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [sessionId, user.id, expiresAt]
    );

    setSessionCookie(res, sessionId);

    res.json({
      user: {
        id:             user.id,
        email:          user.email,
        name:           user.name,
        role:           user.role,
        organizationId: user.organization_id,
      },
    });
  } catch (err) {
    console.error("[auth] Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
// Deletes the session row and clears the cookie.

router.post("/logout", async (req: Request, res: Response): Promise<void> => {
  const sid = req.signedCookies?.sid as string | false | undefined;

  if (sid) {
    await query("DELETE FROM sessions WHERE id = $1", [sid]).catch(() => {});
  }

  res.clearCookie("sid", { path: "/" });
  res.json({ success: true });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
// Returns the currently authenticated user.
// Returns null (not 401) when not logged in — the frontend uses this to
// determine the initial auth state without triggering an error.

router.get("/me", requireAuth, (req: Request, res: Response): void => {
  res.json({ user: req.user ?? null });
});

export default router;
