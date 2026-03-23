/**
 * externalPulse.ts — ExternalPulse Layer
 * ----------------------------------------
 * Outward-facing delivery to users and devices that have explicitly opted in
 * through our own system. No external carriers, no government systems.
 *
 * Delivery method: HTTP POST to subscriber-registered endpoints (webhooks,
 * app clients, public mesh relays) — all registered and consent-recorded
 * in our DB before any message is ever sent.
 *
 * Tables:
 *   platform_external_pulse_subscribers
 *   platform_external_pulse_log
 */

import { rawSql } from "@workspace/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PulseSubscriberType =
  | "webhook"        // user-registered HTTP endpoint
  | "app_client"     // our own app installed on a user device, calling back
  | "mesh_relay"     // a public mesh node they run that we fan out to
  | "browser_hook";  // service-worker fetch listener in our web app

export interface PulseSubscriber {
  id:           number;
  user_id:      string | null;
  label:        string;
  type:         PulseSubscriberType;
  endpoint_url: string;
  secret:       string | null;
  active:       boolean;
  created_at:   string;
}

export interface PulseDeliveryResult {
  subscriberId: number;
  label:        string;
  endpoint_url: string;
  ok:           boolean;
  status?:      number;
  detail?:      string;
  durationMs:   number;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initExternalPulse(): Promise<void> {
  await rawSql`
    CREATE TABLE IF NOT EXISTS platform_external_pulse_subscribers (
      id           SERIAL PRIMARY KEY,
      user_id      TEXT,
      label        TEXT        NOT NULL DEFAULT '',
      type         TEXT        NOT NULL DEFAULT 'webhook',
      endpoint_url TEXT        NOT NULL,
      secret       TEXT,
      active       BOOLEAN     NOT NULL DEFAULT TRUE,
      consent_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (endpoint_url)
    )
  `;

  await rawSql`
    CREATE TABLE IF NOT EXISTS platform_external_pulse_log (
      id            SERIAL PRIMARY KEY,
      subscriber_id INTEGER     REFERENCES platform_external_pulse_subscribers(id) ON DELETE SET NULL,
      event_type    TEXT        NOT NULL DEFAULT 'EMERGENCY_BROADCAST',
      endpoint_url  TEXT        NOT NULL,
      ok            BOOLEAN     NOT NULL,
      http_status   INTEGER,
      response_body TEXT,
      duration_ms   INTEGER,
      fired_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log("[ExternalPulse] Tables ready ✅");
}

// ─── Register / Unregister ────────────────────────────────────────────────────

export async function registerSubscriber(params: {
  userId?:     string;
  label:       string;
  type:        PulseSubscriberType;
  endpointUrl: string;
  secret?:     string;
}): Promise<PulseSubscriber> {
  const rows = await rawSql`
    INSERT INTO platform_external_pulse_subscribers
      (user_id, label, type, endpoint_url, secret)
    VALUES
      (${params.userId ?? null}, ${params.label}, ${params.type}, ${params.endpointUrl}, ${params.secret ?? null})
    ON CONFLICT (endpoint_url) DO UPDATE SET
      user_id    = EXCLUDED.user_id,
      label      = EXCLUDED.label,
      type       = EXCLUDED.type,
      secret     = EXCLUDED.secret,
      active     = TRUE,
      updated_at = NOW()
    RETURNING *
  `;
  return rows[0] as PulseSubscriber;
}

export async function unregisterSubscriber(endpointUrl: string): Promise<void> {
  await rawSql`
    UPDATE platform_external_pulse_subscribers
    SET active = FALSE, updated_at = NOW()
    WHERE endpoint_url = ${endpointUrl}
  `;
}

export async function getSubscribers(activeOnly = true): Promise<PulseSubscriber[]> {
  if (activeOnly) {
    return (await rawSql`
      SELECT * FROM platform_external_pulse_subscribers WHERE active = TRUE ORDER BY created_at DESC
    `) as PulseSubscriber[];
  }
  return (await rawSql`
    SELECT * FROM platform_external_pulse_subscribers ORDER BY created_at DESC
  `) as PulseSubscriber[];
}

// ─── Broadcast ────────────────────────────────────────────────────────────────

export async function broadcastToSubscribers(params: {
  eventType: string;
  message:   string;
  payload?:  Record<string, unknown>;
}): Promise<{ delivered: number; failed: number; results: PulseDeliveryResult[] }> {
  const subscribers = await getSubscribers(true);
  if (subscribers.length === 0) {
    return { delivered: 0, failed: 0, results: [] };
  }

  const body = JSON.stringify({
    eventType:   params.eventType,
    message:     params.message,
    source:      "createai-brain/external-pulse",
    firedAt:     new Date().toISOString(),
    ...(params.payload ?? {}),
  });

  const results = await Promise.allSettled(
    subscribers.map(async (sub): Promise<PulseDeliveryResult> => {
      const t0 = Date.now();
      try {
        const headers: Record<string, string> = {
          "Content-Type":          "application/json",
          "X-ExternalPulse-Event": params.eventType,
          "X-ExternalPulse-Source": "createai-brain",
        };
        if (sub.secret) headers["X-ExternalPulse-Secret"] = sub.secret;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let httpStatus: number | undefined;
        let responseBody = "";

        try {
          const res = await fetch(sub.endpoint_url, {
            method:  "POST",
            headers,
            body,
            signal:  controller.signal,
          });
          httpStatus    = res.status;
          responseBody  = await res.text().catch(() => "");
        } finally {
          clearTimeout(timeout);
        }

        const ok         = (httpStatus ?? 0) >= 200 && (httpStatus ?? 0) < 300;
        const durationMs = Date.now() - t0;

        await rawSql`
          INSERT INTO platform_external_pulse_log
            (subscriber_id, event_type, endpoint_url, ok, http_status, response_body, duration_ms)
          VALUES
            (${sub.id}, ${params.eventType}, ${sub.endpoint_url}, ${ok}, ${httpStatus ?? null},
             ${responseBody.slice(0, 512)}, ${durationMs})
        `.catch(() => {});

        return { subscriberId: sub.id, label: sub.label, endpoint_url: sub.endpoint_url, ok, status: httpStatus, durationMs };
      } catch (err) {
        const durationMs = Date.now() - t0;
        const detail     = (err as Error).message;

        await rawSql`
          INSERT INTO platform_external_pulse_log
            (subscriber_id, event_type, endpoint_url, ok, response_body, duration_ms)
          VALUES
            (${sub.id}, ${params.eventType}, ${sub.endpoint_url}, FALSE, ${detail.slice(0, 512)}, ${durationMs})
        `.catch(() => {});

        return { subscriberId: sub.id, label: sub.label, endpoint_url: sub.endpoint_url, ok: false, detail, durationMs };
      }
    })
  );

  const settled: PulseDeliveryResult[] = results.map(r =>
    r.status === "fulfilled" ? r.value : { subscriberId: -1, label: "unknown", endpoint_url: "", ok: false, detail: "promise rejected", durationMs: 0 }
  );

  return {
    delivered: settled.filter(r => r.ok).length,
    failed:    settled.filter(r => !r.ok).length,
    results:   settled,
  };
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export async function getPulseLogs(limit = 50): Promise<unknown[]> {
  return rawSql`
    SELECT l.*, s.label, s.type
    FROM   platform_external_pulse_log l
    LEFT JOIN platform_external_pulse_subscribers s ON s.id = l.subscriber_id
    ORDER BY l.fired_at DESC
    LIMIT ${limit}
  `;
}
