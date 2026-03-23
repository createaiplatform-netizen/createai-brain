/**
 * ebs/outboundWebhookEngine.ts — Queued outbound webhook dispatcher
 *
 * Persists every outbound webhook call to DB before sending.
 * Retries with exponential backoff on failure (up to 5 attempts).
 * Promotes to DLQ after max attempts.
 * Designed to be driven by a setInterval scheduler in index.ts.
 *
 * Table: platform_ebs_outbound_webhooks
 * Backoff: 1m → 5m → 30m → 2h → 8h
 */

import { rawSql as sql } from "@workspace/db";
import { createHmac }    from "crypto";
import { addToDLQ }      from "./deadLetterQueue.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WebhookStatus = "pending" | "sent" | "retrying" | "failed";

export interface OutboundWebhook {
  id:              number;
  hook_id:         string;
  url:             string;
  event_type:      string;
  payload:         Record<string, unknown>;
  secret:          string | null;
  status:          WebhookStatus;
  attempts:        number;
  max_attempts:    number;
  next_retry_at:   string;
  last_error:      string | null;
  response_code:   number | null;
  correlation_id:  string | null;
  idempotency_key: string | null;
  created_at:      string;
  sent_at:         string | null;
}

export interface EnqueueWebhookParams {
  url:              string;
  event_type:       string;
  payload:          Record<string, unknown>;
  secret?:          string;
  max_attempts?:    number;
  correlation_id?:  string;
  idempotency_key?: string;
}

export interface ProcessResult {
  processed: number;
  sent:      number;
  retrying:  number;
  failed:    number;
}

// Exponential backoff delays in minutes
const BACKOFF_MINUTES = [1, 5, 30, 120, 480];

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initOutboundWebhookEngine(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS platform_ebs_outbound_webhooks (
      id              SERIAL PRIMARY KEY,
      hook_id         TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
      url             TEXT        NOT NULL,
      event_type      TEXT        NOT NULL,
      payload         JSONB       NOT NULL DEFAULT '{}',
      secret          TEXT,
      status          TEXT        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','sent','retrying','failed')),
      attempts        INTEGER     NOT NULL DEFAULT 0,
      max_attempts    INTEGER     NOT NULL DEFAULT 5,
      next_retry_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_error      TEXT,
      response_code   INTEGER,
      correlation_id  TEXT,
      idempotency_key TEXT        UNIQUE,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at         TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_ebs_ohook_status    ON platform_ebs_outbound_webhooks (status, next_retry_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ebs_ohook_created   ON platform_ebs_outbound_webhooks (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ebs_ohook_idem      ON platform_ebs_outbound_webhooks (idempotency_key)`;
  console.log("[EBS:OutboundWebhooks] ✅ ready");
}

// ─── Enqueue ─────────────────────────────────────────────────────────────────

export async function enqueueOutboundWebhook(params: EnqueueWebhookParams): Promise<string> {
  const idemKey    = params.idempotency_key ?? null;
  const corrId     = params.correlation_id  ?? null;
  const secret     = params.secret          ?? null;
  const maxAtt     = params.max_attempts    ?? 5;

  if (idemKey) {
    const existing = await sql`
      SELECT hook_id FROM platform_ebs_outbound_webhooks WHERE idempotency_key = ${idemKey} LIMIT 1
    `;
    if (existing.length > 0) {
      return String((existing[0] as Record<string, unknown>)["hook_id"] ?? "");
    }
  }

  const rows = await sql`
    INSERT INTO platform_ebs_outbound_webhooks
      (url, event_type, payload, secret, max_attempts, correlation_id, idempotency_key)
    VALUES
      (${params.url}, ${params.event_type}, ${JSON.stringify(params.payload)}::jsonb,
       ${secret}, ${maxAtt}, ${corrId}, ${idemKey})
    RETURNING hook_id
  `;
  return String((rows[0] as Record<string, unknown>)["hook_id"] ?? "");
}

// ─── Process queue ────────────────────────────────────────────────────────────

export async function processOutboundQueue(): Promise<ProcessResult> {
  const rows = await sql`
    SELECT * FROM platform_ebs_outbound_webhooks
    WHERE  status IN ('pending', 'retrying')
    AND    next_retry_at <= NOW()
    ORDER  BY next_retry_at ASC
    LIMIT  50
  ` as unknown as OutboundWebhook[];

  let sent = 0, retrying = 0, failed = 0;

  for (const hook of rows) {
    const attempt = hook.attempts + 1;
    let ok = false;
    let responseCode: number | null = null;
    let lastError: string | null = null;

    try {
      const body    = JSON.stringify({ event: hook.event_type, data: hook.payload, attempt });
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      if (hook.secret) {
        const sig = createHmac("sha256", hook.secret).update(body).digest("hex");
        headers["X-CAI-Signature"]  = `sha256=${sig}`;
        headers["X-CAI-Event"]      = hook.event_type;
        headers["X-CAI-Hook-Id"]    = hook.hook_id;
        headers["X-CAI-Timestamp"]  = new Date().toISOString();
      }

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 10_000);

      try {
        const res = await fetch(hook.url, { method: "POST", headers, body, signal: controller.signal });
        responseCode = res.status;
        ok = res.ok;
        if (!ok) lastError = `HTTP ${res.status}`;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      lastError = (err as Error).message.slice(0, 200);
    }

    if (ok) {
      await sql`
        UPDATE platform_ebs_outbound_webhooks
        SET status = 'sent', attempts = ${attempt}, response_code = ${responseCode},
            sent_at = NOW(), last_error = NULL
        WHERE id = ${hook.id}
      `;
      sent++;
    } else {
      const exhausted = attempt >= hook.max_attempts;
      const newStatus: WebhookStatus = exhausted ? "failed" : "retrying";
      const backoffMin = BACKOFF_MINUTES[Math.min(attempt - 1, BACKOFF_MINUTES.length - 1)];
      const nextRetry  = new Date(Date.now() + backoffMin * 60_000).toISOString();

      await sql`
        UPDATE platform_ebs_outbound_webhooks
        SET status = ${newStatus}, attempts = ${attempt},
            response_code = ${responseCode}, last_error = ${lastError},
            next_retry_at = ${nextRetry}
        WHERE id = ${hook.id}
      `;

      if (exhausted) {
        failed++;
        await addToDLQ({
          queue_source:  "outbound_webhooks",
          message_type:  hook.event_type,
          payload:       { hook_id: hook.hook_id, url: hook.url, payload: hook.payload },
          error_message: lastError ?? "Max attempts reached",
          attempts:      attempt,
        }).catch(() => {});
      } else {
        retrying++;
      }
    }
  }

  return { processed: rows.length, sent, retrying, failed };
}

// ─── Query ────────────────────────────────────────────────────────────────────

export async function getOutboundQueue(opts: {
  status?: WebhookStatus;
  limit?:  number;
  offset?: number;
} = {}): Promise<OutboundWebhook[]> {
  const limit  = Math.min(opts.limit ?? 50, 200);
  const offset = opts.offset ?? 0;

  const rows = opts.status
    ? await sql`
        SELECT * FROM platform_ebs_outbound_webhooks
        WHERE status = ${opts.status}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    : await sql`
        SELECT * FROM platform_ebs_outbound_webhooks
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;

  return (rows as unknown[]).map(rowToHook);
}

export async function getOutboundStats(): Promise<Record<string, number>> {
  const rows = await sql`
    SELECT status, COUNT(*)::int AS cnt
    FROM   platform_ebs_outbound_webhooks
    GROUP  BY status
  `;
  const stats: Record<string, number> = { pending: 0, sent: 0, retrying: 0, failed: 0 };
  for (const r of rows as unknown as { status: string; cnt: number }[]) {
    stats[r.status] = r.cnt;
  }
  return stats;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToHook(r: unknown): OutboundWebhook {
  const row = r as Record<string, unknown>;
  return {
    id:              Number(row["id"] ?? 0),
    hook_id:         String(row["hook_id"] ?? ""),
    url:             String(row["url"] ?? ""),
    event_type:      String(row["event_type"] ?? ""),
    payload:         (row["payload"] as Record<string, unknown>) ?? {},
    secret:          row["secret"] != null ? String(row["secret"]) : null,
    status:          String(row["status"] ?? "pending") as WebhookStatus,
    attempts:        Number(row["attempts"] ?? 0),
    max_attempts:    Number(row["max_attempts"] ?? 5),
    next_retry_at:   String(row["next_retry_at"] ?? ""),
    last_error:      row["last_error"] != null ? String(row["last_error"]) : null,
    response_code:   row["response_code"] != null ? Number(row["response_code"]) : null,
    correlation_id:  row["correlation_id"] != null ? String(row["correlation_id"]) : null,
    idempotency_key: row["idempotency_key"] != null ? String(row["idempotency_key"]) : null,
    created_at:      String(row["created_at"] ?? ""),
    sent_at:         row["sent_at"] != null ? String(row["sent_at"]) : null,
  };
}
