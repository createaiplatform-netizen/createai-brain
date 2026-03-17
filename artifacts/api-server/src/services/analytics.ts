/**
 * analytics.ts — Platform Analytics Event Tracker
 *
 * Usage:
 *   import { trackEvent } from "@/services/analytics";
 *   await trackEvent(db, { userId: "u1", eventType: "project.created", metadata: { projectId: 5 } });
 *
 * Standard event types (convention):
 *   user.login            user.logout
 *   project.created       project.deleted   project.archived
 *   document.created      document.deleted
 *   message.sent
 *   app.opened            engine.run
 *   webhook.triggered
 */

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Request } from "express";
import { analyticsEvents, type InsertAnalyticsEvent } from "@workspace/db";
import { count, gte, sql } from "drizzle-orm";

export interface TrackPayload {
  userId?: string | null;
  eventType: string;
  appId?: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
  tenantId?: string;
}

/**
 * trackEvent — write one analytics event.
 * Fire-and-forget — never throws.
 */
export async function trackEvent(
  db: NodePgDatabase<Record<string, unknown>>,
  payload: TrackPayload,
): Promise<void> {
  try {
    const entry: InsertAnalyticsEvent = {
      userId:    payload.userId    ?? null,
      tenantId:  payload.tenantId  ?? "default",
      eventType: payload.eventType,
      appId:     payload.appId     ?? null,
      metadata:  payload.metadata  ?? {},
      sessionId: payload.sessionId ?? null,
    };
    await db.insert(analyticsEvents).values(entry);
  } catch (err) {
    console.error("[analytics] Failed to write event:", err);
  }
}

/**
 * trackFromRequest — convenience wrapper that reads userId from req.user.
 */
export async function trackFromRequest(
  db: NodePgDatabase<Record<string, unknown>>,
  req: Request,
  eventType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await trackEvent(db, {
    userId: req.user?.id ?? null,
    eventType,
    metadata,
  });
}

/**
 * getEventCounts — summarize events over a time window.
 * Returns: { eventType, count }[] ordered by count descending.
 */
export async function getEventCounts(
  db: NodePgDatabase<Record<string, unknown>>,
  sinceDate: Date,
): Promise<{ eventType: string; total: number }[]> {
  const rows = await db
    .select({
      eventType: analyticsEvents.eventType,
      total: count(),
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, sinceDate))
    .groupBy(analyticsEvents.eventType)
    .orderBy(sql`count(*) desc`);
  return rows.map(r => ({ eventType: r.eventType, total: Number(r.total) }));
}
