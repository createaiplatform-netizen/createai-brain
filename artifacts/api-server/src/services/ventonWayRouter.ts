/**
 * VentonWay Smart Delivery Router
 * ──────────────────────────────────
 * Routes every outbound message through the best available channel,
 * in priority order, with automatic fallback. Zero brand leakage —
 * all external providers are completely abstracted.
 *
 * Channel priority (per-message):
 *   1. Web Push      — if recipient is a known user with a push subscription
 *   2. Custom SMTP   — if SMTP_HOST is configured (your own mail server)
 *   3. Shareable Link— always generated; works without ANY external service
 *   4. Provider      — Resend (email) / Twilio (SMS) as final fallback
 *
 * The Shareable Link is ALWAYS generated for every message. It is the
 * zero-dependency delivery method that works right now, on any device,
 * with no external account required.
 */

import { rawSql, db, documents } from "@workspace/db";
import webpush from "web-push";
import crypto from "crypto";
import { sendViaSMTP, isSMTPConfigured, checkSMTPHealth } from "./ventonWaySMTP.js";
import { sendEmailNotification, sendSMSNotification } from "../utils/notifications.js";
import { getPublicBaseUrl } from "../utils/publicUrl.js";

const DOC_DOCTYPE   = "shareable_msg";
const DOC_SYS_USER  = "system";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeliveryChannel =
  | "web_push"
  | "smtp_custom"
  | "shareable_link"
  | "provider_email"
  | "provider_sms";

export interface RouteResult {
  channel:     DeliveryChannel;
  success:     boolean;
  reason?:     string;
  shareableUrl?: string;
  messageId?:  string;
}

export interface RoutedMessage {
  id:          number;
  type:        "email" | "sms";
  recipient:   string;
  subject:     string | null;
  body:        string;
  metadata?:   Record<string, unknown> | null;
}

// ─── VAPID state (shared with push.ts via DB) ─────────────────────────────────

let _vapidPub  = "";
let _vapidPriv = "";
let _vapidReady = false;

async function ensureVapid(): Promise<boolean> {
  if (_vapidReady) return true;
  try {
    const rows = await rawSql`
      SELECT key, value FROM platform_config
      WHERE key IN ('vapid_public','vapid_private')
    ` as Array<{ key: string; value: string }>;
    for (const r of rows) {
      if (r.key === "vapid_public")  _vapidPub  = r.value;
      if (r.key === "vapid_private") _vapidPriv = r.value;
    }
    if (_vapidPub && _vapidPriv) {
      webpush.setVapidDetails(
        "mailto:admin@LakesideTrinity.com",
        _vapidPub,
        _vapidPriv,
      );
      _vapidReady = true;
    }
  } catch { /* non-fatal */ }
  return _vapidReady;
}

// ─── Channel 1: Web Push ──────────────────────────────────────────────────────

async function deliverViaPush(
  msg: RoutedMessage,
  shareableUrl: string,
): Promise<RouteResult> {
  try {
    // Look up push subscriptions by email (user may have multiple devices)
    const subs = await rawSql`
      SELECT ps.endpoint, ps.p256dh, ps.auth_key
      FROM   platform_push_subscriptions ps
      JOIN   users u ON u.id = ps.user_id
      WHERE  LOWER(u.email) = LOWER(${msg.recipient})
      LIMIT  5
    ` as Array<{ endpoint: string; p256dh: string; auth_key: string }>;

    if (subs.length === 0) {
      return { channel: "web_push", success: false, reason: "No push subscription found" };
    }

    const ready = await ensureVapid();
    if (!ready) return { channel: "web_push", success: false, reason: "VAPID not initialised" };

    const payload = JSON.stringify({
      title: msg.subject ?? "New message — VentonWay",
      body:  msg.body.replace(/<[^>]+>/g, "").slice(0, 120),
      url:   shareableUrl,
      icon:  "/icon-192.png",
    });

    let sent = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload,
          { TTL: 86400 },
        );
        sent++;
      } catch (subErr) {
        // Stale subscription — remove it
        if ((subErr as { statusCode?: number }).statusCode === 410) {
          await rawSql`DELETE FROM platform_push_subscriptions WHERE endpoint = ${sub.endpoint}`.catch(() => {});
        }
      }
    }

    return sent > 0
      ? { channel: "web_push", success: true, shareableUrl, messageId: `push:${sent}` }
      : { channel: "web_push", success: false, reason: "All subscriptions stale" };
  } catch (err) {
    return { channel: "web_push", success: false, reason: (err as Error).message };
  }
}

// ─── Channel 2: Custom SMTP ───────────────────────────────────────────────────

async function deliverViaSMTP(
  msg: RoutedMessage,
  shareableUrl: string,
): Promise<RouteResult> {
  if (!isSMTPConfigured()) {
    return { channel: "smtp_custom", success: false, reason: "SMTP not configured" };
  }
  // Append shareable link to email
  const bodyWithLink = msg.body + `
    <div style="margin-top:24px;padding:16px;background:#f0f4ee;border-radius:10px;font-family:sans-serif;font-size:13px;color:#374151;">
      <strong>View this message online:</strong><br>
      <a href="${shareableUrl}" style="color:#7a9068;">${shareableUrl}</a>
    </div>`;
  const result = await sendViaSMTP({
    to:      msg.recipient,
    subject: msg.subject ?? "New message from CreateAI Brain",
    html:    bodyWithLink,
  });
  return {
    channel:     "smtp_custom",
    success:     result.success,
    shareableUrl,
    messageId:   result.messageId,
    reason:      result.reason,
  };
}

// ─── Channel 3: Shareable Link (always generated, zero-dependency) ────────────

async function generateAndLogShareableLink(msg: RoutedMessage): Promise<string> {
  const base = getPublicBaseUrl();
  const token = crypto.randomUUID().replace(/-/g, "");

  // Store in shareable_messages table
  try {
    await rawSql`
      INSERT INTO platform_shareable_messages
        (token, type, recipient, subject, body, metadata, created_at)
      VALUES (
        ${token},
        ${msg.type},
        ${msg.recipient},
        ${msg.subject ?? null},
        ${msg.body},
        ${JSON.stringify({ ventonWayId: msg.id, ...((msg.metadata as Record<string,unknown>) ?? {}) })},
        NOW()
      )
      ON CONFLICT DO NOTHING
    `;
  } catch {
    // Table may have slightly different schema — log and continue
  }

  return `${base}/msg/${token}`;
}

// ─── Channel 4: Provider (Resend / Twilio — hidden from UI) ──────────────────

async function deliverViaProvider(
  msg: RoutedMessage,
  shareableUrl: string,
): Promise<RouteResult> {
  try {
    if (msg.type === "email") {
      const bodyWithLink = msg.body + `
        <div style="margin-top:24px;padding:16px;background:#f0f4ee;border-radius:10px;font-family:sans-serif;font-size:13px;">
          <a href="${shareableUrl}" style="color:#7a9068;">View message online →</a>
        </div>`;
      const res = await sendEmailNotification(
        [msg.recipient],
        msg.subject ?? "New message from CreateAI Brain",
        bodyWithLink,
      );
      const item = res.results[0];
      return {
        channel:     "provider_email",
        success:     item?.success ?? false,
        shareableUrl,
        reason:      item?.success ? undefined : (item?.reason ?? "Provider error"),
      };
    } else {
      const shortLink = shareableUrl.length > 60 ? shareableUrl.slice(0, 55) + "…" : shareableUrl;
      const smsBody = msg.body.replace(/<[^>]+>/g, "").slice(0, 120) + ` ${shortLink}`;
      const res = await sendSMSNotification([msg.recipient], smsBody);
      const item = res.results[0];
      return {
        channel:     "provider_sms",
        success:     item?.success ?? false,
        shareableUrl,
        reason:      item?.success ? undefined : (item?.reason ?? "Provider error"),
      };
    }
  } catch (err) {
    return { channel: "provider_email", success: false, reason: (err as Error).message };
  }
}

// ─── Main router — tries channels in priority order ────────────────────────────

export async function routeAndDeliver(msg: RoutedMessage): Promise<{
  result:      RouteResult;
  shareableUrl: string;
  attempted:   DeliveryChannel[];
}> {
  const shareableUrl = await generateAndLogShareableLink(msg);
  const attempted: DeliveryChannel[] = [];

  // Channel 1: Web Push (email-only — push subs are email-keyed)
  if (msg.type === "email") {
    attempted.push("web_push");
    const pushResult = await deliverViaPush(msg, shareableUrl);
    if (pushResult.success) return { result: pushResult, shareableUrl, attempted };
  }

  // Channel 2: Custom SMTP (email-only)
  if (msg.type === "email" && isSMTPConfigured()) {
    attempted.push("smtp_custom");
    const smtpResult = await deliverViaSMTP(msg, shareableUrl);
    if (smtpResult.success) return { result: smtpResult, shareableUrl, attempted };
  }

  // Channel 3: Provider (email via Resend / SMS via Twilio)
  attempted.push(msg.type === "email" ? "provider_email" : "provider_sms");
  const providerResult = await deliverViaProvider(msg, shareableUrl);

  // Shareable link always exists regardless of delivery outcome
  return { result: providerResult, shareableUrl, attempted };
}

// ─── Channel status (for admin UI) ───────────────────────────────────────────

export async function getChannelStatus(): Promise<{
  webPush:     { configured: boolean; subscriptions: number };
  smtpCustom:  { configured: boolean; connected: boolean; host: string; reason?: string };
  shareableLink: { configured: boolean };
  providerEmail: { configured: boolean };
  providerSms:   { configured: boolean };
}> {
  // Push sub count
  const pushRows = await rawSql`SELECT COUNT(*) AS cnt FROM platform_push_subscriptions`.catch(() => [{ cnt: "0" }]) as Array<{ cnt: string }>;
  const pushCount = parseInt(pushRows[0]?.cnt ?? "0");

  // SMTP health
  const smtpHealth = await checkSMTPHealth();

  return {
    webPush:     { configured: pushCount > 0, subscriptions: pushCount },
    smtpCustom:  smtpHealth,
    shareableLink: { configured: true },
    providerEmail: { configured: !!process.env["RESEND_API_KEY"] },
    providerSms:   { configured: !!(process.env["TWILIO_SID"] && process.env["TWILIO_AUTH_TOKEN"]) },
  };
}
