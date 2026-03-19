// ─── HIPAA Immutable Audit Log Middleware ────────────────────────────────────
//
// Uses the existing `auditLogs` table (lib/db/src/schema/enterprise.ts) which
// already has indexes, outcome tracking, tenant support, and userAgent capture.
//
// HIPAA reference: 45 CFR §164.312(b) — Audit Controls
//   "Implement hardware, software, and/or procedural mechanisms that record and
//    examine activity in information systems that contain or use ePHI."
//
// Usage:
//   import { audit } from "../middlewares/auditLogger";
//
//   router.post("/:projectId/chat",
//     audit("send_project_chat", "project_chat", r => r.params.projectId),
//     async (req, res) => { ... }
//   );
//
// Design rules:
//   - Always calls next() immediately — never slows the main request.
//   - DB write is fire-and-forget (void). Failures log to console, never throw.
//   - action       — descriptive verb phrase  e.g. "send_project_chat"
//   - resourceType — noun                     e.g. "project_chat"
//   - getResourceId — extracts the ID from the request
// ─────────────────────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from "express";
import { db, auditLogs }                        from "@workspace/db";

// Express params can be string | string[] in some configurations
type RawId = string | string[] | undefined;
type GetId  = (req: Request) => RawId;

const DEFAULT_GET_ID: GetId = (req) =>
  req.params.id ?? req.params.projectId ?? req.params.fileId ?? "unknown";

function coerceId(raw: RawId): string {
  if (Array.isArray(raw)) return raw[0] ?? "unknown";
  return raw ?? "unknown";
}

export function audit(
  action:        string,
  resourceType:  string,
  getResourceId: GetId = DEFAULT_GET_ID,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Capture actual HTTP outcome after the response is sent — never block
    res.on("finish", () => {
      const outcome: "success" | "failure" = res.statusCode < 400 ? "success" : "failure";
      void writeAuditEntry(req, action, resourceType, getResourceId, outcome).catch(err =>
        console.error("[audit] write failed (non-blocking):", err),
      );
    });
    next();
  };
}

async function writeAuditEntry(
  req:           Request,
  action:        string,
  resourceType:  string,
  getResourceId: GetId,
  outcome:       "success" | "failure" = "success",
): Promise<void> {
  const user        = req.user as { id?: string; email?: string } | undefined;
  const userId      = user?.id      ?? null;
  const userEmail   = user?.email   ?? null;
  const resourceId  = coerceId(getResourceId(req));
  const ipAddress   = coerceId(
    req.headers["x-forwarded-for"] as RawId ?? req.socket?.remoteAddress,
  );
  const userAgent   = req.headers["user-agent"] ?? null;

  await db.insert(auditLogs).values({
    userId,
    userEmail,
    action,
    resource:     `${resourceType}:${resourceId}`,
    resourceType,
    outcome,
    ipAddress,
    userAgent,
    metadata:     buildMeta(req),
  });
}

// Collect lightweight contextual metadata (no PHI content — IDs and types only)
function buildMeta(req: Request): Record<string, unknown> {
  const meta: Record<string, unknown> = {
    method: req.method,
    path:   req.path,
  };

  // Safe non-PHI fields only
  if (req.body?.industry)     meta.industry     = req.body.industry;
  if (req.body?.projectType)  meta.projectType  = req.body.projectType;
  if (req.body?.domain)       meta.domain       = req.body.domain;
  if (req.body?.model)        meta.model        = req.body.model;

  return meta;
}
