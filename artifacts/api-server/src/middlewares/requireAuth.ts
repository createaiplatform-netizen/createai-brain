/**
 * middlewares/requireAuth.ts — Shared authentication guard
 * ─────────────────────────────────────────────────────────
 * Reusable Express middleware that returns 401 if the request
 * is not authenticated via the OIDC session.
 */

import type { Request, Response, NextFunction } from "express";

/**
 * Express middleware: requires a valid authenticated session.
 * Returns 401 JSON if not authenticated; calls next() if authenticated.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized", code: "AUTH_REQUIRED" });
    return;
  }
  next();
}

/**
 * Helper used inside route handlers (non-middleware pattern).
 * Returns the userId string if authenticated, or sends 401 and returns null.
 */
export function requireAuthHelper(req: Request, res: Response): string | null {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized", code: "AUTH_REQUIRED" });
    return null;
  }
  return (req.user as { id?: string; claims?: { sub?: string } } | undefined)?.id
    ?? (req.user as { id?: string; claims?: { sub?: string } } | undefined)?.claims?.sub
    ?? "unknown";
}
