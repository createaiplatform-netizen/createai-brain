/**
 * ebs/eventStore.ts — Append-only global event log
 *
 * Every platform event is written here exactly once.
 * Supports filtered queries and single-event lookup for replay.
 *
 * Table: platform_ebs_event_store
 */

import { rawSql as sql } from "@workspace/db";
import { randomUUID }    from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoredEvent {
  id:              number;
  event_id:        string;
  topic:           string;
  event_type:      string;
  source:          string;
  correlation_id:  string | null;
  idempotency_key: string | null;
  payload:         Record<string, unknown>;
  created_at:      string;
}

export interface AppendEventParams {
  topic:           string;
  event_type:      string;
  source:          string;
  payload:         Record<string, unknown>;
  correlation_id?: string;
  idempotency_key?: string;
  event_id?:       string;
}

export interface EventQuery {
  topic?:      string;
  event_type?: string;
  source?:     string;
  from?:       Date;
  to?:         Date;
  limit?:      number;
  offset?:     number;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initEventStore(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS platform_ebs_event_store (
      id              SERIAL PRIMARY KEY,
      event_id        TEXT        NOT NULL UNIQUE,
      topic           TEXT        NOT NULL,
      event_type      TEXT        NOT NULL,
      source          TEXT        NOT NULL DEFAULT 'platform',
      correlation_id  TEXT,
      idempotency_key TEXT        UNIQUE,
      payload         JSONB       NOT NULL DEFAULT '{}',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_ebs_store_topic      ON platform_ebs_event_store (topic)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ebs_store_event_type ON platform_ebs_event_store (event_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ebs_store_source     ON platform_ebs_event_store (source)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ebs_store_created    ON platform_ebs_event_store (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ebs_store_corr       ON platform_ebs_event_store (correlation_id)`;
  console.log("[EBS:EventStore] ✅ ready");
}

// ─── Append ──────────────────────────────────────────────────────────────────

export async function appendEvent(params: AppendEventParams): Promise<StoredEvent> {
  const event_id        = params.event_id        ?? randomUUID();
  const correlation_id  = params.correlation_id  ?? null;
  const idempotency_key = params.idempotency_key ?? null;
  const payloadJson     = JSON.stringify(params.payload);

  const rows = await sql`
    INSERT INTO platform_ebs_event_store
      (event_id, topic, event_type, source, correlation_id, idempotency_key, payload)
    VALUES
      (${event_id}, ${params.topic}, ${params.event_type}, ${params.source},
       ${correlation_id}, ${idempotency_key}, ${payloadJson}::jsonb)
    ON CONFLICT (event_id) DO NOTHING
    RETURNING *
  `;

  if (rows.length === 0) {
    const existing = await getEventById(event_id);
    if (!existing) throw new Error(`[EBS:EventStore] appendEvent conflict — event_id:${event_id}`);
    return existing;
  }

  return rowToEvent(rows[0]);
}

// ─── Query ────────────────────────────────────────────────────────────────────

export async function getEvents(q: EventQuery = {}): Promise<StoredEvent[]> {
  const limit  = Math.min(q.limit  ?? 100, 500);
  const offset = q.offset ?? 0;

  const rows = await sql`
    SELECT * FROM platform_ebs_event_store
    WHERE  TRUE
      AND  (${q.topic      ?? null}::text IS NULL OR topic      = ${q.topic      ?? ""})
      AND  (${q.event_type ?? null}::text IS NULL OR event_type = ${q.event_type ?? ""})
      AND  (${q.source     ?? null}::text IS NULL OR source     = ${q.source     ?? ""})
      AND  (${q.from ? q.from.toISOString() : null}::timestamptz IS NULL OR created_at >= ${q.from ? q.from.toISOString() : null}::timestamptz)
      AND  (${q.to   ? q.to.toISOString()   : null}::timestamptz IS NULL OR created_at <= ${q.to   ? q.to.toISOString()   : null}::timestamptz)
    ORDER BY created_at DESC
    LIMIT  ${limit}
    OFFSET ${offset}
  `;

  return (rows as unknown[]).map(rowToEvent);
}

export async function getEventById(eventId: string): Promise<StoredEvent | null> {
  const rows = await sql`
    SELECT * FROM platform_ebs_event_store WHERE event_id = ${eventId} LIMIT 1
  `;
  return rows.length > 0 ? rowToEvent(rows[0]) : null;
}

export async function getEventStoreStats(): Promise<{
  total: number;
  byTopic: Record<string, number>;
  last24h: number;
}> {
  const [totRow] = await sql`SELECT COUNT(*)::int AS total FROM platform_ebs_event_store`;
  const [dayRow] = await sql`
    SELECT COUNT(*)::int AS total FROM platform_ebs_event_store
    WHERE created_at >= NOW() - INTERVAL '24 hours'
  `;
  const topicRows = await sql`
    SELECT topic, COUNT(*)::int AS cnt
    FROM   platform_ebs_event_store
    GROUP  BY topic
    ORDER  BY cnt DESC
  `;

  const byTopic: Record<string, number> = {};
  for (const r of topicRows as unknown as { topic: string; cnt: number }[]) {
    byTopic[r.topic] = r.cnt;
  }

  return {
    total:   Number((totRow as { total: number }).total ?? 0),
    byTopic,
    last24h: Number((dayRow as { total: number }).total ?? 0),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToEvent(r: unknown): StoredEvent {
  const row = r as Record<string, unknown>;
  return {
    id:              Number(row["id"] ?? 0),
    event_id:        String(row["event_id"] ?? ""),
    topic:           String(row["topic"] ?? ""),
    event_type:      String(row["event_type"] ?? ""),
    source:          String(row["source"] ?? ""),
    correlation_id:  row["correlation_id"] != null ? String(row["correlation_id"]) : null,
    idempotency_key: row["idempotency_key"] != null ? String(row["idempotency_key"]) : null,
    payload:         (row["payload"] as Record<string, unknown>) ?? {},
    created_at:      String(row["created_at"] ?? ""),
  };
}
