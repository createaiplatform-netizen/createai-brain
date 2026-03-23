/**
 * ebs/deadLetterQueue.ts — Dead Letter Queue
 *
 * Messages that exhaust all retries from VentonWay or the outbound
 * webhook engine are promoted here. Admins can inspect, retry, or
 * resolve DLQ items from /api/ebs/dlq.
 *
 * Table: platform_ebs_dlq
 */

import { rawSql as sql } from "@workspace/db";
import { randomUUID }    from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DLQSource = "venton_way" | "outbound_webhooks" | "inbound_router" | "cross_system" | "manual";

export interface DLQItem {
  id:            number;
  dlq_id:        string;
  queue_source:  DLQSource;
  event_id:      string | null;
  message_type:  string;
  payload:       Record<string, unknown>;
  error_message: string;
  attempts:      number;
  created_at:    string;
  resolved_at:   string | null;
  resolved_by:   string | null;
}

export interface AddToDLQParams {
  queue_source:  DLQSource;
  event_id?:     string;
  message_type:  string;
  payload:       Record<string, unknown>;
  error_message: string;
  attempts:      number;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initDLQ(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS platform_ebs_dlq (
      id            SERIAL PRIMARY KEY,
      dlq_id        TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
      queue_source  TEXT        NOT NULL,
      event_id      TEXT,
      message_type  TEXT        NOT NULL,
      payload       JSONB       NOT NULL DEFAULT '{}',
      error_message TEXT        NOT NULL DEFAULT '',
      attempts      INTEGER     NOT NULL DEFAULT 1,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at   TIMESTAMPTZ,
      resolved_by   TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_ebs_dlq_source      ON platform_ebs_dlq (queue_source)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ebs_dlq_resolved    ON platform_ebs_dlq (resolved_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ebs_dlq_created     ON platform_ebs_dlq (created_at DESC)`;
  console.log("[EBS:DLQ] ✅ ready");
}

// ─── Add ─────────────────────────────────────────────────────────────────────

export async function addToDLQ(params: AddToDLQParams): Promise<string> {
  const dlq_id = randomUUID();
  await sql`
    INSERT INTO platform_ebs_dlq
      (dlq_id, queue_source, event_id, message_type, payload, error_message, attempts)
    VALUES
      (${dlq_id},
       ${params.queue_source},
       ${params.event_id ?? null},
       ${params.message_type},
       ${JSON.stringify(params.payload)}::jsonb,
       ${params.error_message},
       ${params.attempts})
  `;
  console.warn(
    `[EBS:DLQ] ⚠️ Promoted to DLQ — source:${params.queue_source}` +
    ` type:${params.message_type} attempts:${params.attempts} err:${params.error_message.slice(0, 80)}`
  );
  return dlq_id;
}

// ─── Query ────────────────────────────────────────────────────────────────────

export async function getDLQItems(opts: {
  source?:   DLQSource;
  resolved?: boolean;
  limit?:    number;
  offset?:   number;
} = {}): Promise<DLQItem[]> {
  const limit  = Math.min(opts.limit  ?? 50, 200);
  const offset = opts.offset ?? 0;

  let rows: unknown[];

  if (opts.source !== undefined && opts.resolved !== undefined) {
    const resolvedFilter = opts.resolved ? sql`resolved_at IS NOT NULL` : sql`resolved_at IS NULL`;
    rows = await sql`
      SELECT * FROM platform_ebs_dlq
      WHERE queue_source = ${opts.source} AND ${resolvedFilter}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (opts.source !== undefined) {
    rows = await sql`
      SELECT * FROM platform_ebs_dlq
      WHERE queue_source = ${opts.source}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (opts.resolved !== undefined) {
    const resolvedFilter = opts.resolved ? sql`resolved_at IS NOT NULL` : sql`resolved_at IS NULL`;
    rows = await sql`
      SELECT * FROM platform_ebs_dlq
      WHERE ${resolvedFilter}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    rows = await sql`
      SELECT * FROM platform_ebs_dlq
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  }

  return (rows as unknown[]).map(rowToItem);
}

export async function getDLQItemById(dlqId: string): Promise<DLQItem | null> {
  const rows = await sql`
    SELECT * FROM platform_ebs_dlq WHERE dlq_id = ${dlqId} LIMIT 1
  `;
  return rows.length > 0 ? rowToItem(rows[0]) : null;
}

// ─── Retry ────────────────────────────────────────────────────────────────────

export async function retryFromDLQ(
  dlqId:   string,
  retryFn: (item: DLQItem) => Promise<void>
): Promise<{ ok: boolean; error?: string }> {
  const item = await getDLQItemById(dlqId);
  if (!item) return { ok: false, error: "DLQ item not found" };
  if (item.resolved_at) return { ok: false, error: "Already resolved" };

  try {
    await retryFn(item);
    await sql`
      UPDATE platform_ebs_dlq
      SET resolved_at = NOW(), resolved_by = 'manual-retry'
      WHERE dlq_id = ${dlqId}
    `;
    console.log(`[EBS:DLQ] ✅ Retry succeeded — dlq_id:${dlqId}`);
    return { ok: true };
  } catch (err) {
    const msg = (err as Error).message;
    console.warn(`[EBS:DLQ] ⚠️ Retry failed — dlq_id:${dlqId} err:${msg}`);
    return { ok: false, error: msg };
  }
}

export async function resolveDLQItem(dlqId: string, resolvedBy: string): Promise<boolean> {
  const rows = await sql`
    UPDATE platform_ebs_dlq
    SET resolved_at = NOW(), resolved_by = ${resolvedBy}
    WHERE dlq_id = ${dlqId} AND resolved_at IS NULL
    RETURNING id
  `;
  return rows.length > 0;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getDLQStats(): Promise<{
  total:      number;
  pending:    number;
  resolved:   number;
  bySource:   Record<string, number>;
}> {
  const [row] = await sql`
    SELECT
      COUNT(*)::int                                            AS total,
      COUNT(*) FILTER (WHERE resolved_at IS NULL)::int        AS pending,
      COUNT(*) FILTER (WHERE resolved_at IS NOT NULL)::int    AS resolved
    FROM platform_ebs_dlq
  `;
  const srcRows = await sql`
    SELECT queue_source, COUNT(*)::int AS cnt
    FROM   platform_ebs_dlq
    WHERE  resolved_at IS NULL
    GROUP  BY queue_source
  `;
  const bySource: Record<string, number> = {};
  for (const r of srcRows as unknown as { queue_source: string; cnt: number }[]) {
    bySource[r.queue_source] = r.cnt;
  }
  const r = row as Record<string, number>;
  return { total: r["total"] ?? 0, pending: r["pending"] ?? 0, resolved: r["resolved"] ?? 0, bySource };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToItem(r: unknown): DLQItem {
  const row = r as Record<string, unknown>;
  return {
    id:            Number(row["id"] ?? 0),
    dlq_id:        String(row["dlq_id"] ?? ""),
    queue_source:  String(row["queue_source"] ?? "") as DLQSource,
    event_id:      row["event_id"] != null ? String(row["event_id"]) : null,
    message_type:  String(row["message_type"] ?? ""),
    payload:       (row["payload"] as Record<string, unknown>) ?? {},
    error_message: String(row["error_message"] ?? ""),
    attempts:      Number(row["attempts"] ?? 1),
    created_at:    String(row["created_at"] ?? ""),
    resolved_at:   row["resolved_at"] != null ? String(row["resolved_at"]) : null,
    resolved_by:   row["resolved_by"] != null ? String(row["resolved_by"]) : null,
  };
}
