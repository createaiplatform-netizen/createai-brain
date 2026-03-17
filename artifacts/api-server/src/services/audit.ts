/**
 * audit.ts — Centralized Audit Logging Service
 *
 * Usage:
 *   import { logAudit } from "@/services/audit";
 *   await logAudit(db, req, { action: "project.created", resource: "project:42", outcome: "success" });
 *
 * The audit log is append-only (never update or delete rows).
 * For compliance, retain for at least 90 days.
 */

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Request } from "express";
import { auditLogs, type InsertAuditLog } from "@workspace/db";

export interface AuditPayload {
  action: string;           // e.g. "project.created" | "user.login" | "document.deleted"
  resource?: string;        // e.g. "project:42"
  resourceType?: string;    // e.g. "project"
  outcome?: "success" | "failure" | "denied";
  metadata?: Record<string, unknown>;
}

/**
 * logAudit — write one audit log entry.
 * Never throws — failures are caught and logged to stderr only.
 */
export async function logAudit(
  db: NodePgDatabase<Record<string, unknown>>,
  req: Request,
  payload: AuditPayload,
): Promise<void> {
  try {
    const entry: InsertAuditLog = {
      userId:      req.user?.id  ?? null,
      userEmail:   req.user?.email ?? null,
      role:        (req.user as any)?.role ?? "user",
      tenantId:    "default",
      action:      payload.action,
      resource:    payload.resource     ?? null,
      resourceType: payload.resourceType ?? null,
      outcome:     payload.outcome      ?? "success",
      metadata:    payload.metadata     ?? {},
      ipAddress:   req.ip ?? req.socket?.remoteAddress ?? null,
      userAgent:   req.headers["user-agent"] ?? null,
    };
    await db.insert(auditLogs).values(entry);
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err);
  }
}

/**
 * auditMiddleware — express middleware that logs every mutating request.
 * Mount after authMiddleware. Only logs POST / PUT / PATCH / DELETE.
 */
export function auditMiddleware(
  db: NodePgDatabase<Record<string, unknown>>,
) {
  return async (
    req: Request,
    _res: unknown,
    next: () => void,
  ) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const resource = req.path.replace(/^\/+/, "");
      await logAudit(db, req, {
        action: `${req.method.toLowerCase()}.${resource.split("/")[0]}`,
        resource,
        metadata: { method: req.method, path: req.path, query: req.query },
      });
    }
    next();
  };
}
