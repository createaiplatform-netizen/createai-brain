/**
 * EverythingNetWay Engine — Service Layer
 * Unified platform-layer queue: electricity, internet, mobile, messaging, compute, sensor jobs.
 */

import { rawSql } from "@workspace/db";
import { getVentonWayStatus } from "./ventonWay.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ENWLayer =
  | "electricity"
  | "internet"
  | "mobile"
  | "messaging"
  | "compute"
  | "sensor";

export type ENWStatus = "pending" | "executing" | "completed" | "failed";

export interface ENWJob {
  id:         number;
  type:       string;
  layer:      ENWLayer;
  payload:    Record<string, unknown> | null;
  status:     ENWStatus;
  result:     string | null;
  created_at: string;
  updated_at: string;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initEverythingNetWay(): Promise<void> {
  await rawSql`
    CREATE TABLE IF NOT EXISTS platform_everything_queue (
      id         SERIAL PRIMARY KEY,
      type       TEXT    NOT NULL,
      layer      TEXT    NOT NULL DEFAULT 'messaging',
      payload    JSONB,
      status     TEXT    NOT NULL DEFAULT 'pending',
      result     TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("[EverythingNetWay] Queue table ready.");
}

// ─── Queue ────────────────────────────────────────────────────────────────────

export async function queueJob(job: {
  type:     string;
  layer:    ENWLayer;
  payload?: Record<string, unknown>;
}): Promise<ENWJob> {
  const payload = job.payload ? JSON.stringify(job.payload) : null;
  const rows = (await rawSql`
    INSERT INTO platform_everything_queue (type, layer, payload)
    VALUES (${job.type}, ${job.layer}, ${payload}::jsonb)
    RETURNING *
  `) as Array<Record<string, unknown>>;
  return rows[0] as unknown as ENWJob;
}

// ─── Process Queue ────────────────────────────────────────────────────────────

export async function processQueue(): Promise<{ processed: number; completed: number; failed: number }> {
  const rows = (await rawSql`
    SELECT * FROM platform_everything_queue
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 50
  `) as Array<Record<string, unknown>>;

  let completed = 0;
  let failed    = 0;

  for (const row of rows) {
    const job = row as unknown as ENWJob;
    try {
      await rawSql`
        UPDATE platform_everything_queue
        SET status = 'executing', updated_at = NOW()
        WHERE id = ${job.id}
      `;

      const result = `${job.layer} / ${job.type} dispatched`;
      console.log(`[EverythingNetWay] ${result}`);

      await rawSql`
        UPDATE platform_everything_queue
        SET status = 'completed', result = ${result}, updated_at = NOW()
        WHERE id = ${job.id}
      `;
      completed++;
    } catch (err) {
      const msg = (err as Error).message;
      await rawSql`
        UPDATE platform_everything_queue
        SET status = 'failed', result = ${"Error: " + msg}, updated_at = NOW()
        WHERE id = ${job.id}
      `;
      failed++;
    }
  }

  return { processed: rows.length, completed, failed };
}

// ─── Retry ────────────────────────────────────────────────────────────────────

export async function retryJob(id: number): Promise<void> {
  await rawSql`
    UPDATE platform_everything_queue
    SET status = 'pending', result = NULL, updated_at = NOW()
    WHERE id = ${id}
  `;
}

// ─── Status ───────────────────────────────────────────────────────────────────

export interface LayerStat {
  layer:  string;
  status: string;
  count:  number;
}

export async function getLayerStats(): Promise<LayerStat[]> {
  const rows = (await rawSql`
    SELECT layer, status, COUNT(*)::int AS count
    FROM platform_everything_queue
    GROUP BY layer, status
    ORDER BY layer, status
  `) as Array<Record<string, string>>;
  return rows.map(r => ({ layer: r.layer, status: r.status, count: Number(r.count) }));
}

export async function getQueueTotals(): Promise<Record<string, number>> {
  const rows = (await rawSql`
    SELECT status, COUNT(*)::int AS count
    FROM platform_everything_queue
    GROUP BY status
  `) as Array<Record<string, string>>;
  const totals: Record<string, number> = { pending: 0, executing: 0, completed: 0, failed: 0 };
  for (const r of rows) totals[r.status] = Number(r.count);
  return totals;
}

export async function getLogs(limit = 50, offset = 0): Promise<ENWJob[]> {
  const rows = (await rawSql`
    SELECT * FROM platform_everything_queue
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as Array<Record<string, unknown>>;
  return rows as unknown as ENWJob[];
}

export async function getFullStatus() {
  const [layerStats, totals, messaging] = await Promise.all([
    getLayerStats(),
    getQueueTotals(),
    getVentonWayStatus(),
  ]);
  return { layerStats, totals, messaging };
}
