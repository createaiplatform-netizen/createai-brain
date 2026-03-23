/**
 * VentonWay Messaging Engine — Service Layer
 * Internal messaging orchestration: queue, process, retry, log.
 * All external delivery providers are fully abstracted.
 */

import { rawSql } from "@workspace/db";
import { routeAndDeliver } from "./ventonWayRouter.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageType = "email" | "sms";
export type MessageStatus = "pending" | "sent" | "failed" | "retrying";

export interface QueuedMessage {
  id:          number;
  type:        MessageType;
  recipient:   string;
  subject:     string | null;
  body:        string;
  status:      MessageStatus;
  attempts:    number;
  maxAttempts: number;
  result:      string | null;
  scheduledAt: string;
  sentAt:      string | null;
  createdAt:   string;
  updatedAt:   string;
  metadata:    Record<string, unknown> | null;
}

export interface VentonWayStatus {
  engine:        "online" | "degraded" | "offline";
  emailProvider: "configured" | "setup_required";
  smsProvider:   "configured" | "setup_required";
  queue: {
    pending: number;
    sent:    number;
    failed:  number;
    total:   number;
  };
  lastProcessed: string | null;
}

// ─── DB Init ──────────────────────────────────────────────────────────────────

export async function initVentonWay(): Promise<void> {
  await rawSql`
    CREATE TABLE IF NOT EXISTS platform_venton_way_queue (
      id           SERIAL PRIMARY KEY,
      type         TEXT        NOT NULL CHECK (type IN ('email','sms')),
      recipient    TEXT        NOT NULL,
      subject      TEXT,
      body         TEXT        NOT NULL DEFAULT '',
      status       TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','sent','failed','retrying')),
      attempts     INTEGER     NOT NULL DEFAULT 0,
      max_attempts INTEGER     NOT NULL DEFAULT 3,
      result       TEXT,
      metadata     JSONB,
      scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at      TIMESTAMPTZ,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await rawSql`
    CREATE INDEX IF NOT EXISTS idx_venton_way_status
      ON platform_venton_way_queue (status, scheduled_at)
  `;
}

// ─── Queue a message ──────────────────────────────────────────────────────────

export async function queueMessage(params: {
  type:       MessageType;
  recipient:  string;
  subject?:   string;
  body:       string;
  metadata?:  Record<string, unknown>;
  scheduledAt?: Date;
}): Promise<{ id: number }> {
  const rows = await rawSql`
    INSERT INTO platform_venton_way_queue
      (type, recipient, subject, body, metadata, scheduled_at)
    VALUES (
      ${params.type},
      ${params.recipient},
      ${params.subject ?? null},
      ${params.body},
      ${params.metadata ? JSON.stringify(params.metadata) : null},
      ${params.scheduledAt?.toISOString() ?? new Date().toISOString()}
    )
    RETURNING id
  `;
  return { id: (rows[0] as { id: number }).id };
}

// ─── Process pending queue ────────────────────────────────────────────────────

export async function processQueue(): Promise<{
  processed: number;
  sent:      number;
  failed:    number;
}> {
  const rows = await rawSql`
    SELECT id, type, recipient, subject, body, attempts, max_attempts
    FROM   platform_venton_way_queue
    WHERE  status IN ('pending','retrying')
    AND    scheduled_at <= NOW()
    ORDER  BY scheduled_at ASC
    LIMIT  50
  ` as Array<{
    id: number; type: string; recipient: string;
    subject: string | null; body: string;
    attempts: number; max_attempts: number;
  }>;

  let sent = 0;
  let failed = 0;

  for (const msg of rows) {
    await rawSql`
      UPDATE platform_venton_way_queue
      SET    status = 'retrying', attempts = attempts + 1, updated_at = NOW()
      WHERE  id = ${msg.id}
    `;

    try {
      let success = false;
      let resultText = "";

      if (msg.type === "email") {
        const res = await sendEmailNotification(
          [msg.recipient],
          msg.subject ?? "Message from CreateAI",
          msg.body,
        );
        const item = res.results[0];
        success = item?.success ?? false;
        resultText = item?.success
          ? `Delivered via email provider`
          : (item?.reason ?? "Unknown error");
      } else {
        const res = await sendSMSNotification([msg.recipient], msg.body);
        const item = res.results[0];
        success = item?.success ?? false;
        resultText = item?.success
          ? `Delivered via SMS provider`
          : (item?.reason ?? "Unknown error");
      }

      if (success) {
        await rawSql`
          UPDATE platform_venton_way_queue
          SET    status = 'sent', result = ${resultText},
                 sent_at = NOW(), updated_at = NOW()
          WHERE  id = ${msg.id}
        `;
        sent++;
      } else {
        const newStatus = msg.attempts + 1 >= msg.max_attempts ? "failed" : "retrying";
        await rawSql`
          UPDATE platform_venton_way_queue
          SET    status = ${newStatus}, result = ${resultText}, updated_at = NOW()
          WHERE  id = ${msg.id}
        `;
        if (newStatus === "failed") failed++;
      }
    } catch (err) {
      const errText = (err as Error).message;
      const newStatus = msg.attempts + 1 >= msg.max_attempts ? "failed" : "retrying";
      await rawSql`
        UPDATE platform_venton_way_queue
        SET    status = ${newStatus}, result = ${"Error: " + errText}, updated_at = NOW()
        WHERE  id = ${msg.id}
      `;
      if (newStatus === "failed") failed++;
    }
  }

  return { processed: rows.length, sent, failed };
}

// ─── Retry a specific failed message ─────────────────────────────────────────

export async function retryMessage(id: number): Promise<void> {
  await rawSql`
    UPDATE platform_venton_way_queue
    SET    status = 'pending', attempts = 0, result = NULL,
           scheduled_at = NOW(), updated_at = NOW()
    WHERE  id = ${id}
    AND    status = 'failed'
  `;
}

// ─── System status ────────────────────────────────────────────────────────────

export async function getVentonWayStatus(): Promise<VentonWayStatus> {
  const counts = await rawSql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending' OR status = 'retrying') AS pending,
      COUNT(*) FILTER (WHERE status = 'sent')   AS sent,
      COUNT(*) FILTER (WHERE status = 'failed') AS failed,
      COUNT(*)                                   AS total
    FROM platform_venton_way_queue
  ` as Array<{ pending: string; sent: string; failed: string; total: string }>;

  const lastRow = await rawSql`
    SELECT updated_at FROM platform_venton_way_queue
    WHERE  status = 'sent'
    ORDER  BY updated_at DESC
    LIMIT  1
  ` as Array<{ updated_at: string }>;

  const emailConfigured = !!(
    process.env["RESEND_API_KEY"] &&
    process.env["RESEND_API_KEY"].startsWith("re_")
  );
  const smsConfigured = !!(
    process.env["TWILIO_SID"] &&
    process.env["TWILIO_SID"].startsWith("AC") &&
    process.env["TWILIO_AUTH_TOKEN"]
  );

  const q = counts[0] ?? { pending: "0", sent: "0", failed: "0", total: "0" };

  return {
    engine:        emailConfigured || smsConfigured ? "online" : "degraded",
    emailProvider: emailConfigured ? "configured" : "setup_required",
    smsProvider:   smsConfigured   ? "configured" : "setup_required",
    queue: {
      pending: parseInt(q.pending),
      sent:    parseInt(q.sent),
      failed:  parseInt(q.failed),
      total:   parseInt(q.total),
    },
    lastProcessed: lastRow[0]?.updated_at ?? null,
  };
}

// ─── Delivery logs ────────────────────────────────────────────────────────────

export async function getVentonWayLogs(
  limit  = 50,
  offset = 0,
): Promise<QueuedMessage[]> {
  const rows = await rawSql`
    SELECT
      id, type, recipient, subject, body, status,
      attempts, max_attempts, result, metadata,
      scheduled_at, sent_at, created_at, updated_at
    FROM  platform_venton_way_queue
    ORDER BY created_at DESC
    LIMIT  ${limit}
    OFFSET ${offset}
  `;
  return rows.map(r => ({
    id:          (r as QueuedMessage).id,
    type:        (r as QueuedMessage).type,
    recipient:   maskRecipient(String((r as { recipient: string }).recipient)),
    subject:     (r as QueuedMessage).subject,
    body:        (r as QueuedMessage).body,
    status:      (r as QueuedMessage).status,
    attempts:    Number((r as QueuedMessage).attempts),
    maxAttempts: Number((r as { max_attempts: number }).max_attempts),
    result:      (r as QueuedMessage).result,
    scheduledAt: String((r as { scheduled_at: string }).scheduled_at),
    sentAt:      (r as { sent_at: string | null }).sent_at,
    createdAt:   String((r as { created_at: string }).created_at),
    updatedAt:   String((r as { updated_at: string }).updated_at),
    metadata:    (r as QueuedMessage).metadata,
  }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskRecipient(recipient: string): string {
  if (recipient.includes("@")) {
    const [local, domain] = recipient.split("@");
    const vis = local.slice(0, 2);
    return `${vis}***@${domain}`;
  }
  // phone
  return recipient.slice(0, 4) + "****" + recipient.slice(-2);
}
