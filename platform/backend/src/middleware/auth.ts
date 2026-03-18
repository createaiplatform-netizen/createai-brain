import { type Request, type Response, type NextFunction } from "express";
import { query } from "../db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  organizationId: string | null;
  mfaEnabled?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionId?: string;
      clientIp?: string;
    }
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

// Inactivity timeout: sessions idle longer than this are rejected.
// Configurable via SESSION_INACTIVITY_MINUTES (default: 30 min).
// Set to 0 to disable inactivity checks (not recommended in healthcare).
const INACTIVITY_MINUTES = parseInt(
  process.env.SESSION_INACTIVITY_MINUTES ?? "30",
  10
);
const INACTIVITY_MS = INACTIVITY_MINUTES > 0 ? INACTIVITY_MINUTES * 60 * 1000 : null;

// How often we write last_active_at to the DB (max once per interval).
// Reduces write load on high-traffic paths; still tracks inactivity precisely.
const TOUCH_INTERVAL_MS = 60 * 1000; // once per minute

// ─── loadUser ─────────────────────────────────────────────────────────────────
// Reads the signed session cookie, verifies the session, enforces inactivity,
// and attaches req.user on every request.
//
// Future: Cache lookups in Redis to reduce DB round-trips under high load.
// Future: Emit HIPAA audit log entry per authenticated request.

export async function loadUser(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  // Extract real client IP (works behind Caddy / nginx reverse proxy)
  const forwarded = req.headers["x-forwarded-for"];
  req.clientIp =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim()) ??
    req.socket.remoteAddress ??
    "unknown";

  const sid = req.signedCookies?.sid as string | false | undefined;

  if (!sid) {
    next();
    return;
  }

  try {
    const rows = await query<{
      session_id:     string;
      user_id:        string;
      email:          string;
      name:           string | null;
      role:           string;
      organization_id: string | null;
      expires_at:     Date;
      last_active_at: Date;
      mfa_enabled:    boolean | null;
    }>(
      `SELECT
         s.id              AS session_id,
         u.id              AS user_id,
         u.email,
         u.name,
         u.role,
         u.organization_id,
         s.expires_at,
         s.last_active_at,
         m.enabled         AS mfa_enabled
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN user_mfa m ON m.user_id = u.id
       WHERE s.id = $1
         AND s.expires_at > NOW()
         AND u.is_active = true`,
      [sid]
    );

    if (rows.length === 0) {
      next();
      return;
    }

    const row = rows[0];

    // ── Inactivity check ─────────────────────────────────────────────────────
    if (INACTIVITY_MS !== null) {
      const idleMs = Date.now() - new Date(row.last_active_at).getTime();
      if (idleMs > INACTIVITY_MS) {
        // Session has been idle too long — invalidate it server-side.
        await query("DELETE FROM sessions WHERE id = $1", [sid]).catch(() => {});
        console.info(`[auth] Session ${sid.slice(0, 8)}… expired by inactivity (${Math.round(idleMs / 60000)} min idle)`);
        next();
        return;
      }
    }

    req.user = {
      id:             row.user_id,
      email:          row.email,
      name:           row.name,
      role:           row.role,
      organizationId: row.organization_id,
      mfaEnabled:     row.mfa_enabled ?? false,
    };
    req.sessionId = row.session_id;

    // ── Touch last_active_at (rate-limited to avoid per-request writes) ──────
    const lastActive = new Date(row.last_active_at).getTime();
    if (Date.now() - lastActive > TOUCH_INTERVAL_MS) {
      query(
        "UPDATE sessions SET last_active_at = NOW() WHERE id = $1",
        [sid]
      ).catch(() => {});
    }
  } catch (err) {
    console.error("[auth] Session lookup error:", err);
  }

  next();
}

// ─── requireAuth ──────────────────────────────────────────────────────────────

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  next();
}

// ─── requireRole ──────────────────────────────────────────────────────────────
// Usage: router.get("/admin-only", requireAuth, requireRole("admin"), handler)

export function requireRole(...roles: string[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions." });
      return;
    }
    next();
  };
}
