/**
 * globalPulse.ts — GlobalPulse: world-scale opt-in broadcast layer
 * -----------------------------------------------------------------
 * Three delivery mechanisms, all opt-in, all ours:
 *
 *  1. Live SSE stream  — anyone connects to GET /api/global-pulse/stream
 *                        and receives broadcasts in real-time, forever.
 *  2. Webhook registry — external users register an HTTPS endpoint;
 *                        we HTTP-POST every broadcast to it.
 *  3. RSS feed         — broadcasts are stored and served as a public
 *                        Atom feed at /api/global-pulse/feed.xml so any
 *                        feed reader in the world can subscribe.
 *
 * No Twilio. No Resend. No carriers. No government systems.
 * Only people who explicitly connect to our public endpoints receive anything.
 */

import { rawSql } from "@workspace/db";
import type { Response } from "express";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GlobalSubscriberType = "sse_client" | "webhook" | "rss_reader";

export interface GlobalSubscriber {
  id:           number;
  label:        string;
  type:         GlobalSubscriberType;
  endpoint_url: string | null;
  secret:       string | null;
  active:       boolean;
  created_at:   string;
}

export interface GlobalBroadcastRecord {
  id:         number;
  event_type: string;
  message:    string;
  fired_at:   string;
  sse_count:  number;
  hook_count: number;
}

// ─── In-process SSE client registry ─────────────────────────────────────────
// These are raw Express `res` objects — no auth, anyone who connects is added.

const sseClients = new Set<Response>();

export function addSSEClient(res: Response): () => void {
  sseClients.add(res);
  return () => sseClients.delete(res);
}

export function getSSEClientCount(): number {
  return sseClients.size;
}

function pushToSSEClients(eventType: string, data: Record<string, unknown>): number {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  let sent = 0;
  for (const res of sseClients) {
    try {
      res.write(payload);
      sent++;
    } catch {
      sseClients.delete(res);
    }
  }
  return sent;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initGlobalPulse(): Promise<void> {
  await rawSql`
    CREATE TABLE IF NOT EXISTS platform_global_pulse_webhooks (
      id           SERIAL PRIMARY KEY,
      label        TEXT        NOT NULL DEFAULT '',
      endpoint_url TEXT        NOT NULL,
      secret       TEXT,
      active       BOOLEAN     NOT NULL DEFAULT TRUE,
      consent_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (endpoint_url)
    )
  `;

  await rawSql`
    CREATE TABLE IF NOT EXISTS platform_global_pulse_broadcasts (
      id         SERIAL PRIMARY KEY,
      event_type TEXT        NOT NULL DEFAULT 'EMERGENCY_BROADCAST',
      message    TEXT        NOT NULL,
      sse_count  INTEGER     NOT NULL DEFAULT 0,
      hook_count INTEGER     NOT NULL DEFAULT 0,
      fired_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log("[GlobalPulse] Tables ready ✅");
}

// ─── Webhook opt-in / opt-out ────────────────────────────────────────────────

export async function registerWebhook(params: {
  label:       string;
  endpointUrl: string;
  secret?:     string;
}): Promise<GlobalSubscriber> {
  const rows = await rawSql`
    INSERT INTO platform_global_pulse_webhooks (label, endpoint_url, secret)
    VALUES (${params.label}, ${params.endpointUrl}, ${params.secret ?? null})
    ON CONFLICT (endpoint_url) DO UPDATE SET
      label      = EXCLUDED.label,
      secret     = EXCLUDED.secret,
      active     = TRUE,
      consent_at = NOW()
    RETURNING *
  `;
  return rows[0] as GlobalSubscriber;
}

export async function unregisterWebhook(endpointUrl: string): Promise<void> {
  await rawSql`
    UPDATE platform_global_pulse_webhooks SET active = FALSE WHERE endpoint_url = ${endpointUrl}
  `;
}

export async function getWebhooks(activeOnly = true): Promise<GlobalSubscriber[]> {
  if (activeOnly) {
    return rawSql`
      SELECT * FROM platform_global_pulse_webhooks WHERE active = TRUE ORDER BY created_at DESC
    ` as Promise<GlobalSubscriber[]>;
  }
  return rawSql`SELECT * FROM platform_global_pulse_webhooks ORDER BY created_at DESC` as Promise<GlobalSubscriber[]>;
}

// ─── RSS feed ─────────────────────────────────────────────────────────────────

export async function getRecentBroadcasts(limit = 50): Promise<GlobalBroadcastRecord[]> {
  return rawSql`
    SELECT * FROM platform_global_pulse_broadcasts ORDER BY fired_at DESC LIMIT ${limit}
  ` as Promise<GlobalBroadcastRecord[]>;
}

export function buildRSSFeed(broadcasts: GlobalBroadcastRecord[], baseUrl: string): string {
  const items = broadcasts.map(b => `
    <item>
      <title>${escapeXml(b.event_type)}</title>
      <description>${escapeXml(b.message)}</description>
      <pubDate>${new Date(b.fired_at).toUTCString()}</pubDate>
      <guid>${baseUrl}/api/global-pulse/broadcast/${b.id}</guid>
      <link>${baseUrl}/api/global-pulse/feed.xml</link>
    </item>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CreateAI Brain — GlobalPulse</title>
    <description>Live opt-in emergency broadcasts from CreateAI Brain</description>
    <link>${escapeXml(baseUrl)}</link>
    <atom:link href="${escapeXml(baseUrl)}/api/global-pulse/feed.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;
}

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Master broadcast ─────────────────────────────────────────────────────────

export async function broadcastGlobalPulse(params: {
  eventType: string;
  message:   string;
}): Promise<{ sseDelivered: number; hooksDelivered: number; hooksFailed: number }> {
  const { eventType, message } = params;
  const ts = new Date().toISOString();

  // 1. Push to all live SSE clients immediately
  const sseDelivered = pushToSSEClients(eventType, { message, ts });

  // 2. HTTP POST to all registered webhooks in parallel
  const hooks        = await getWebhooks(true);
  let hooksDelivered = 0;
  let hooksFailed    = 0;

  const body = JSON.stringify({ eventType, message, source: "createai-brain/global-pulse", firedAt: ts });

  await Promise.allSettled(hooks.map(async hook => {
    try {
      const headers: Record<string, string> = {
        "Content-Type":           "application/json",
        "X-GlobalPulse-Event":    eventType,
        "X-GlobalPulse-Source":   "createai-brain",
      };
      if (hook.secret) headers["X-GlobalPulse-Secret"] = hook.secret;

      const ctrl = new AbortController();
      const t    = setTimeout(() => ctrl.abort(), 8000);
      try {
        const res = await fetch(hook.endpoint_url!, { method: "POST", headers, body, signal: ctrl.signal });
        if (res.ok) hooksDelivered++; else hooksFailed++;
      } finally { clearTimeout(t); }
    } catch { hooksFailed++; }
  }));

  // 3. Persist to broadcast log (RSS feed source + audit)
  await rawSql`
    INSERT INTO platform_global_pulse_broadcasts (event_type, message, sse_count, hook_count)
    VALUES (${eventType}, ${message}, ${sseDelivered}, ${hooksDelivered})
  `.catch(() => {});

  return { sseDelivered, hooksDelivered, hooksFailed };
}
