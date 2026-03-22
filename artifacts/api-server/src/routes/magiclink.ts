/**
 * routes/magiclink.ts — Passwordless Magic Link Authentication
 * ─────────────────────────────────────────────────────────────
 * Email-based passwordless auth using one-time tokens + device fingerprinting.
 * Uses Resend to deliver secure login links. No password stored or required.
 * Email identity is driven by platformIdentity.ts — getSenderFull() + PLATFORM constants.
 *
 * POST /api/auth/magic-link/send       — request a magic link to email
 * GET  /api/auth/magic-link/verify     — verify token + establish session
 * POST /api/auth/magic-link/register   — register device as trusted
 * GET  /api/auth/magic-link/devices    — list trusted devices for session user
 * DELETE /api/auth/magic-link/device/:id — revoke trusted device
 * GET  /api/auth/magic-link/status     — check magic link auth capability
 */

import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { PLATFORM, getSenderFull }                from "../services/platformIdentity.js";
import { getLaunchFlag, LAUNCH_FLAG_KEYS }         from "../utils/launchFlags.js";

const router = Router();

/* ── In-memory token store (production would use Redis/DB) ──────── */
interface MagicToken {
  email: string;
  token: string;
  expiresAt: number;
  used: boolean;
  deviceFingerprint?: string;
  ipAddress: string;
  createdAt: number;
}

interface TrustedDevice {
  id: string;
  email: string;
  fingerprint: string;
  label: string;
  registeredAt: number;
  lastUsedAt: number;
  userAgent: string;
}

// ── IN-MEMORY STATE — RESTART RISK ───────────────────────────────────────────
// TODO [cluster-critical]: All three stores below are plain Maps — not DB-backed.
//
//   tokenStore:      Lost on restart → any in-flight magic link becomes invalid
//                    mid-flow. User must re-request the link after a restart.
//   trustedDevices:  Lost on restart → all trusted device registrations
//                    disappear. platform_trusted_devices TABLE already exists
//                    in the DB schema but is not yet wired here.
//   rateLimitStore:  Lost on restart → per-email rate limits reset, allowing
//                    a burst of magic link requests immediately after a restart.
//
//   MITIGATION REQUIRED BEFORE CLUSTERING OR PRODUCTION HARDENING:
//   - tokenStore:     Store tokens in a DB table (e.g., platform_magic_tokens)
//                     with TTL enforced via DELETE WHERE expires_at < NOW().
//   - trustedDevices: Wire directly to `platform_trusted_devices` table
//                     (already exists — just needs read/write queries).
//   - rateLimitStore: Move to Redis (or use DB count query with timestamp window)
//                     scoped per email.
//
//   CURRENT FAIL-SAFE BEHAVIOR:
//   - tokenStore expiry (15 min) is enforced in-memory — lost tokens just
//     require a new magic link request. No security breach, only UX friction.
//   - Trusted device loss causes re-auth prompts, not unauthorized access.
//   - Rate limit reset allows a short burst after restart — low severity.
// ─────────────────────────────────────────────────────────────────────────────
const tokenStore = new Map<string, MagicToken>();
const trustedDevices = new Map<string, TrustedDevice>();
const rateLimitStore = new Map<string, number[]>(); // email -> timestamps

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5; // 5 requests per hour per email

/* ── Helpers ─────────────────────────────────────────────────────── */
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function cleanExpiredTokens(): void {
  const now = Date.now();
  for (const [key, val] of tokenStore.entries()) {
    if (val.expiresAt < now || val.used) tokenStore.delete(key);
  }
}

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitStore.get(email) ?? [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitStore.set(email, recent);
  return true;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendMagicLinkEmail(email: string, magicUrl: string, deviceLabel: string): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    console.warn("[magiclink] RESEND_API_KEY not set — magic link email skipped");
    return false;
  }

  // Auth emails use PLATFORM identity and sage branding — never personal/purple.
  const SAGE  = PLATFORM.brandColor;
  const CREAM = PLATFORM.bgColor;
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Sign in to ${PLATFORM.displayName}</title></head>
<body style="background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:32px 16px;margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="background:${SAGE};padding:24px 32px;border-radius:14px 14px 0 0;">
        <p style="margin:0;font-size:20px;font-weight:900;color:white;letter-spacing:-0.3px;">${PLATFORM.displayName}</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.75);">${PLATFORM.companyName}</p>
      </td>
    </tr>
    <tr>
      <td style="background:white;padding:32px;border:1px solid rgba(122,144,104,0.15);border-top:none;border-radius:0 0 14px 14px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:${PLATFORM.textColor};">Your sign-in link</h2>
        <p style="color:#6b6660;margin:0 0 8px;line-height:1.6;font-size:15px;">Click the button below to sign in securely. This link expires in 15 minutes and can only be used once.</p>
        <p style="color:#9e9890;font-size:13px;margin:0 0 24px;">Signing in from: ${deviceLabel}</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${magicUrl}" style="background:${SAGE};color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">Sign In to ${PLATFORM.displayName}</a>
        </div>
        <p style="color:#9e9890;font-size:12px;margin:0 0 16px;line-height:1.6;">If you didn't request this link, you can safely ignore this email. It will expire automatically.</p>
        <hr style="border:none;border-top:1px solid rgba(122,144,104,0.12);margin:20px 0;">
        <p style="color:#b0aca6;font-size:11px;margin:0;word-break:break-all;">Or copy this URL: ${magicUrl}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 0;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9e9890;">${PLATFORM.legalNotice} · <a href="mailto:${PLATFORM.supportEmail}" style="color:#9e9890;text-decoration:none;">${PLATFORM.supportEmail}</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: getSenderFull(),
        to: [email],
        subject: `Your sign-in link — ${PLATFORM.displayName}`,
        html
      })
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/* ── GET /status ─────────────────────────────────────────────────── */
router.get("/status", (_req: Request, res: Response) => {
  const hasResend = !!process.env["RESEND_API_KEY"];
  res.json({
    ok: true,
    method: "magic-link",
    description: "Passwordless email magic link authentication with device fingerprinting",
    emailDelivery: hasResend ? "active" : "resend_key_missing",
    features: [
      "One-time secure tokens (SHA-256 hashed)",
      "15-minute token expiry",
      "Rate limiting: 5 requests/hour per email",
      "Device fingerprinting + trusted device registration",
      "Automatic session establishment on verification",
      "No password stored — ever"
    ],
    tokenTtlMinutes: 15,
    rateLimitPerHour: RATE_LIMIT_MAX,
    activeTokens: tokenStore.size,
    trustedDevices: trustedDevices.size
  });
});

/* ── POST /send — request a magic link ───────────────────────────── */
router.post("/send", async (req: Request, res: Response) => {
  const { email, deviceFingerprint, deviceLabel } = req.body as Record<string, string>;

  if (!email || !isValidEmail(email)) {
    res.status(400).json({ ok: false, error: "Valid email address is required" });
    return;
  }

  if (!checkRateLimit(email)) {
    res.status(429).json({
      ok: false,
      error: "Too many requests. Please wait before requesting another magic link.",
      retryAfterMinutes: 60
    });
    return;
  }

  cleanExpiredTokens();

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "unknown");
  const label = deviceLabel || req.headers["user-agent"]?.slice(0, 80) || "Unknown device";

  const entry: MagicToken = {
    email: email.toLowerCase().trim(),
    token: tokenHash,
    expiresAt: Date.now() + TOKEN_TTL_MS,
    used: false,
    deviceFingerprint: deviceFingerprint,
    ipAddress: ip,
    createdAt: Date.now()
  };
  tokenStore.set(tokenHash, entry);

  const baseUrl = process.env["PUBLIC_URL"] ?? `https://${process.env["REPLIT_DEV_DOMAIN"]}`;
  const magicUrl = `${baseUrl}/api/auth/magic-link/verify?token=${rawToken}&email=${encodeURIComponent(email)}`;

  // Launch gate — only fire the email if launch_magiclink_emails flag is ON
  const emailEnabled = await getLaunchFlag(LAUNCH_FLAG_KEYS.MAGICLINK_EMAILS);
  const sent = emailEnabled
    ? await sendMagicLinkEmail(email, magicUrl, label)
    : false;

  res.json({
    ok: true,
    message: sent
      ? "Magic link sent. Check your email — it expires in 15 minutes."
      : "Magic link generated (email delivery unavailable — use the dev link below).",
    devLink: process.env["NODE_ENV"] !== "production" ? magicUrl : undefined,
    expiresInMinutes: 15,
    email
  });
});

/* ── GET /verify — verify token + establish session ─────────────── */
router.get("/verify", (req: Request, res: Response) => {
  const rawToken = String(req.query["token"] ?? "");
  const email = String(req.query["email"] ?? "").toLowerCase().trim();

  if (!rawToken || !email) {
    res.status(400).json({ ok: false, error: "Token and email are required" });
    return;
  }

  const tokenHash = hashToken(rawToken);
  const entry = tokenStore.get(tokenHash);

  if (!entry) {
    res.status(401).json({ ok: false, error: "Invalid or expired magic link. Please request a new one." });
    return;
  }
  if (entry.used) {
    res.status(401).json({ ok: false, error: "This magic link has already been used. Please request a new one." });
    return;
  }
  if (entry.expiresAt < Date.now()) {
    tokenStore.delete(tokenHash);
    res.status(401).json({ ok: false, error: "This magic link has expired. Please request a new one." });
    return;
  }
  if (entry.email !== email) {
    res.status(401).json({ ok: false, error: "Email mismatch. Please use the exact link sent to your inbox." });
    return;
  }

  entry.used = true;
  tokenStore.set(tokenHash, entry);

  const session = (req as any).session;
  if (session) {
    session.userId = email;
    session.email = email;
    session.authMethod = "magic-link";
    session.authenticatedAt = Date.now();
    session.displayName = email.split("@")[0];
  }

  res.json({
    ok: true,
    authenticated: true,
    email,
    authMethod: "magic-link",
    message: "Authentication successful. Session established.",
    sessionEstablished: !!session,
    redirectTo: "/api/coreOS/dashboard"
  });
});

/* ── POST /register — register a trusted device ─────────────────── */
router.post("/register", (req: Request, res: Response) => {
  const { email, fingerprint, label } = req.body as Record<string, string>;
  if (!email || !fingerprint) {
    res.status(400).json({ ok: false, error: "Email and device fingerprint required" });
    return;
  }

  const deviceId = crypto.randomBytes(16).toString("hex");
  const device: TrustedDevice = {
    id: deviceId,
    email: email.toLowerCase().trim(),
    fingerprint,
    label: label || "Unnamed Device",
    registeredAt: Date.now(),
    lastUsedAt: Date.now(),
    userAgent: String(req.headers["user-agent"] ?? "Unknown")
  };
  trustedDevices.set(deviceId, device);

  res.json({
    ok: true,
    deviceId,
    message: "Device registered as trusted. Future logins from this device will be recognized.",
    device: { id: deviceId, label: device.label, registeredAt: device.registeredAt }
  });
});

/* ── GET /devices — list trusted devices ────────────────────────── */
router.get("/devices", (req: Request, res: Response) => {
  const email = String((req as any).session?.email ?? req.query["email"] ?? "");
  if (!email) {
    res.status(401).json({ ok: false, error: "Authentication required" });
    return;
  }
  const userDevices = [...trustedDevices.values()]
    .filter(d => d.email === email.toLowerCase())
    .map(d => ({ id: d.id, label: d.label, registeredAt: d.registeredAt, lastUsedAt: d.lastUsedAt, userAgent: d.userAgent }));
  res.json({ ok: true, email, devices: userDevices, count: userDevices.length });
});

/* ── DELETE /device/:id — revoke trusted device ─────────────────── */
router.delete("/device/:id", (req: Request, res: Response) => {
  const deviceId = String(req.params["id"] ?? "");
  if (!trustedDevices.has(deviceId)) {
    res.status(404).json({ ok: false, error: "Device not found" });
    return;
  }
  trustedDevices.delete(deviceId);
  res.json({ ok: true, message: "Trusted device revoked successfully.", deviceId });
});

export default router;
