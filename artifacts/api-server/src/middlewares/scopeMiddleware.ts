// ═══════════════════════════════════════════════════════════════════════════
// SCOPE MIDDLEWARE — Attaches a per-request RequestScope to req.__scope.
//
// Must run AFTER authMiddleware so req.user is already populated.
// Each request receives:
//   • req.__scope.requestId    — server-generated UUID for tracing
//   • req.__scope.userId       — from req.user?.id (undefined if unauthenticated)
//   • req.__scope.executionId  — propagated from "x-execution-id" header (optional)
//   • req.__scope.startedAt    — unix ms timestamp at scope creation
//   • req.__scope.logger       — RequestLogger pre-bound with requestId + userId
//   • req.__scope.get(tok)     — lazy access to any container-registered singleton
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
  const requestId  = crypto.randomUUID();
  const startedAt  = Date.now();

  // Propagate executionId from the frontend if present — safe optional handling
  const rawExecId  = req.headers["x-execution-id"];
  const executionId = typeof rawExecId === "string" && rawExecId.trim()
    ? rawExecId.trim()
    : undefined;

  req.__scope = container.createRequestScope(requestId, req.user?.id, executionId, startedAt);
  next();
}
