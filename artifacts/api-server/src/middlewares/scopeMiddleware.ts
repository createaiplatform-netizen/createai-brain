// ═══════════════════════════════════════════════════════════════════════════
// SCOPE MIDDLEWARE — Attaches a per-request RequestScope to req.__scope.
//
// Must run AFTER authMiddleware so req.user is already populated.
// Each request receives:
//   • req.__scope.requestId — UUID for end-to-end tracing
//   • req.__scope.userId    — from req.user?.id (undefined if unauthenticated)
//   • req.__scope.logger    — RequestLogger pre-bound with requestId + userId
//   • req.__scope.get(tok)  — lazy access to any container-registered singleton
//
// Mount order in app.ts:
//   app.use(authMiddleware);
//   app.use(scopeMiddleware);   ← here
//   app.use("/api", router);
// ═══════════════════════════════════════════════════════════════════════════

import crypto                    from "crypto";
import { type Request, type Response, type NextFunction } from "express";
import { container }             from "../container";
import type { RequestScope }     from "../container/types";

// ─── Express namespace augmentation ──────────────────────────────────────────
// Adds __scope to every Request. Declared here so importing this middleware
// is sufficient — no separate .d.ts file needed.

declare global {
  namespace Express {
    interface Request {
      __scope?: RequestScope;
    }
  }
}

export function scopeMiddleware(
  req:  Request,
  _res: Response,
  next: NextFunction,
): void {
  const requestId = crypto.randomUUID();
  req.__scope     = container.createRequestScope(requestId, req.user?.id);
  next();
}
