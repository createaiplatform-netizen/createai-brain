import { type Request, type Response, type NextFunction } from "express";
import { query } from "../db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  organizationId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ─── loadUser ─────────────────────────────────────────────────────────────────
// Reads the signed session cookie, looks up the session and user in the
// database, and attaches the user to req.user if the session is valid.
//
// Signed cookies are verified automatically by cookie-parser — if the
// signature is invalid, req.signedCookies.sid is false (not a string).
//
// Future: Cache session lookups in Redis to reduce DB round-trips on every
//   request at high traffic volume.
// Future: Emit an audit log entry on each authenticated request for HIPAA.
// Future: Check req.user.organizationId against the route's org param to
//   prevent cross-tenant data leaks.

export async function loadUser(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const sid = req.signedCookies?.sid as string | false | undefined;

  if (!sid) {
    next();
    return;
  }

  try {
    const rows = await query<{
      session_id: string;
      user_id: string;
      email: string;
      name: string | null;
      role: string;
      organization_id: string | null;
      expires_at: Date;
    }>(
      `SELECT
         s.id            AS session_id,
         u.id            AS user_id,
         u.email,
         u.name,
         u.role,
         u.organization_id,
         s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1
         AND s.expires_at > NOW()`,
      [sid]
    );

    if (rows.length === 0) {
      next();
      return;
    }

    const row = rows[0];
    req.user = {
      id:             row.user_id,
      email:          row.email,
      name:           row.name,
      role:           row.role,
      organizationId: row.organization_id,
    };
  } catch (err) {
    console.error("[auth] Session lookup error:", err);
  }

  next();
}

// ─── requireAuth ──────────────────────────────────────────────────────────────
// Use this on any route that must be authenticated.
// Returns 401 if req.user is not set.
//
// Usage:
//   router.get("/projects", requireAuth, handler)
//
// Future: Add requireRole("admin") variant for admin-only routes.

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
