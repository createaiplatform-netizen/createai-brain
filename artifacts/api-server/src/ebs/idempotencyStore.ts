/**
 * ebs/idempotencyStore.ts — Generic idempotency key store
 *
 * Prevents double-processing of any event across the platform.
 * Stripe webhook dedup already uses platform_webhook_events.
 * This covers all other event sources.
 *
 * Table: platform_ebs_idempotency
 */

import { rawSql as sql } from "@workspace/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IdempotencyEntry {
  id:           number;
  idem_key:     string;
  event_type:   string;
  processed_at: string;
  result_hash:  string | null;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initIdempotencyStore(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS platform_ebs_idempotency (
      id           SERIAL PRIMARY KEY,
      idem_key     TEXT        NOT NULL UNIQUE,
      event_type   TEXT        NOT NULL,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      result_hash  TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_ebs_idem_key  ON platform_ebs_idempotency (idem_key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ebs_idem_type ON platform_ebs_idempotency (event_type)`;
  console.log("[EBS:IdempotencyStore] ✅ ready");
}

// ─── Check and mark ───────────────────────────────────────────────────────────

/**
 * Returns true if the key is NEW (safe to process).
 * Returns false if the key was already seen (skip/duplicate).
 * Always atomic — uses INSERT ON CONFLICT.
 */
export async function checkAndMark(
  idemKey:    string,
  eventType:  string,
  resultHash: string | null = null
): Promise<boolean> {
  const rows = await sql`
    INSERT INTO platform_ebs_idempotency (idem_key, event_type, result_hash)
    VALUES (${idemKey}, ${eventType}, ${resultHash})
    ON CONFLICT (idem_key) DO NOTHING
    RETURNING id
  `;
  return rows.length > 0; // true = new, false = duplicate
}

export async function getEntry(idemKey: string): Promise<IdempotencyEntry | null> {
  const rows = await sql`
    SELECT * FROM platform_ebs_idempotency WHERE idem_key = ${idemKey} LIMIT 1
  `;
  if (rows.length === 0) return null;
  const r = rows[0] as Record<string, unknown>;
  return {
    id:           Number(r["id"]),
    idem_key:     String(r["idem_key"] ?? ""),
    event_type:   String(r["event_type"] ?? ""),
    processed_at: String(r["processed_at"] ?? ""),
    result_hash:  r["result_hash"] != null ? String(r["result_hash"]) : null,
  };
}

/**
 * Purge entries older than `days` days. Safe to run on a weekly schedule.
 */
export async function purgeOlderThan(days: number): Promise<number> {
  const rows = await sql`
    DELETE FROM platform_ebs_idempotency
    WHERE processed_at < NOW() - (${days} || ' days')::interval
    RETURNING id
  `;
  return rows.length;
}
