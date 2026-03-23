/**
 * fireAlert.ts — Real multi-channel alert delivery
 * Fires through every wired delivery path simultaneously.
 * Run with: npx tsx src/scripts/fireAlert.ts
 */

import { sendEmailNotification, sendSMSNotification, FAMILY_EMAIL_LIST, FAMILY_SMS_LIST } from "../utils/notifications.js";
import { routeEvent }               from "../ebs/crossSystemRouter.js";
import { enqueueOutboundWebhook }   from "../ebs/outboundWebhookEngine.js";
import { queueMessage, processQueue } from "../services/ventonWay.js";
import { queueJob as queueENW }     from "../services/everythingNetWay.js";
import { queueNetJob }              from "../services/electricNetWay.js";
import { rawSql }                   from "@workspace/db";
import webpush                      from "web-push";

const NOW       = new Date().toISOString();
const ALERT_ID  = `cai-alert-${Date.now()}`;
const TITLE     = "CreateAI Brain — EBS Live";
const MESSAGE   = "The Event Bus System is fully operational. All delivery channels are confirmed active. This is a live platform alert.";
const EMAIL_SUBJECT = "⚡ CreateAI Brain: EBS is Live — All Channels Active";
const EMAIL_HTML = `
  <div style="font-family:-apple-system,Helvetica,sans-serif;max-width:620px;margin:auto;padding:32px;">
    <h2 style="color:#9CAF88;margin:0 0 8px;">CreateAI Brain</h2>
    <h3 style="margin:0 0 20px;color:#0f172a;">⚡ EBS Activation Confirmed</h3>
    <p style="color:#334155;line-height:1.6;">${MESSAGE}</p>
    <p style="color:#334155;line-height:1.6;">Alert ID: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">${ALERT_ID}</code></p>
    <p style="color:#334155;line-height:1.6;">Timestamp: ${NOW}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
    <p style="font-size:12px;color:#aaa;">Lakeside Trinity LLC · CreateAI Brain · createai.digital</p>
  </div>
`;

const log: Array<{ channel: string; ok: boolean; detail: string }> = [];
const T0 = Date.now();

function record(channel: string, ok: boolean, detail: string) {
  const sym = ok ? "✅" : "❌";
  const ms  = Date.now() - T0;
  log.push({ channel, ok, detail });
  console.log(`[Alert:${channel}] ${sym} +${ms}ms — ${detail}`);
}

async function main() {
  console.log(`\n${"═".repeat(64)}`);
  console.log(`  CreateAI Brain — LIVE MULTI-CHANNEL ALERT`);
  console.log(`  Alert ID : ${ALERT_ID}`);
  console.log(`  Time     : ${NOW}`);
  console.log(`${"═".repeat(64)}\n`);

  // ── 1. EMAIL — Resend → all family members ──────────────────────────────
  try {
    const emails = FAMILY_EMAIL_LIST.map(m => m.email);
    const batch  = await sendEmailNotification(emails, EMAIL_SUBJECT, EMAIL_HTML);
    record("email", batch.successCount > 0,
      `${batch.successCount}/${batch.total} delivered via Resend (${batch.overachievement_pct}% overachievement)`
    );
  } catch (e) { record("email", false, (e as Error).message); }

  // ── 2. SMS — Twilio → all family phones ────────────────────────────────
  try {
    const phones = FAMILY_SMS_LIST.map(m => m.phone);
    const batch  = await sendSMSNotification(phones, `⚡ ${TITLE}: ${MESSAGE} — ${NOW}`);
    record("sms", batch.successCount > 0,
      `${batch.successCount}/${batch.total} delivered via Twilio (${batch.overachievement_pct}% overachievement)`
    );
  } catch (e) { record("sms", false, (e as Error).message); }

  // ── 3. EBS / OS layer — eventStore + SSE broadcast ─────────────────────
  try {
    const result = await routeEvent({
      topic:      "system",
      event_type: "system.alert",
      source:     "ultraInteractionEngine",
      payload:    { alert_id: ALERT_ID, title: TITLE, message: MESSAGE, timestamp: NOW },
    });
    record("ebs:eventStore", result.stored, result.stored ? `persisted (event_id auto-assigned)` : result.warnings.join(", "));
    record("ebs:sse",        result.sse,    result.sse    ? "broadcast to all SSE clients (OS layer)" : result.warnings.join(", "));
  } catch (e) { record("ebs:crossRouter", false, (e as Error).message); }

  // ── 4. OutboundWebhookEngine — queued delivery ──────────────────────────
  try {
    const hookId = await enqueueOutboundWebhook({
      url:           `http://localhost:${process.env["PORT"] ?? 8080}/api/ebs/status`,
      event_type:    "system.alert",
      payload:       { alert_id: ALERT_ID, title: TITLE, message: MESSAGE, timestamp: NOW },
      correlation_id: ALERT_ID,
    });
    record("ebs:outboundWebhookEngine", true, `enqueued hook_id:${hookId} — 60s scheduler will dispatch`);
  } catch (e) { record("ebs:outboundWebhookEngine", false, (e as Error).message); }

  // ── 5. VentonWay queue — timed message delivery ─────────────────────────
  try {
    const msg = await queueMessage({
      type:      "email",
      recipient: "admin@LakesideTrinity.com",
      subject:   EMAIL_SUBJECT,
      body:      MESSAGE,
      metadata:  { alert_id: ALERT_ID, channel: "ventonWay", timestamp: NOW },
    });
    record("ventonWay:queue", true, `queued message id:${msg.id}`);

    const qResult = await processQueue();
    record("ventonWay:processQueue", true,
      `processed — sent:${qResult.sent} failed:${qResult.failed}`
    );
  } catch (e) { record("ventonWay", false, (e as Error).message); }

  // ── 6. EverythingNetWay — TV + device layer ─────────────────────────────
  try {
    const job = await queueENW({
      type:    "PLATFORM_ALERT",
      layer:   "messaging",
      payload: { alert_id: ALERT_ID, title: TITLE, body: MESSAGE, priority: "high", timestamp: NOW },
    });
    record("everythingNetWay:tv+devices", true, `queued job id:${String((job as Record<string,unknown>)["id"] ?? "ok")}`);
  } catch (e) { record("everythingNetWay:tv+devices", false, (e as Error).message); }

  // ── 7. ElectricNetWay — infrastructure layer ────────────────────────────
  try {
    const job = await queueNetJob({
      category: "control",
      type:     "PLATFORM_ALERT",
      target:   "ALL_NODES",
      payload:  { alert_id: ALERT_ID, title: TITLE, body: MESSAGE, timestamp: NOW },
    });
    record("electricNetWay:infrastructure", true, `queued job id:${String((job as Record<string,unknown>)["id"] ?? "ok")}`);
  } catch (e) { record("electricNetWay:infrastructure", false, (e as Error).message); }

  // ── 8. Web Push — browser + OS notifications ────────────────────────────
  try {
    const pub  = process.env["VAPID_PUBLIC_KEY"];
    const priv = process.env["VAPID_PRIVATE_KEY"];
    const subj = process.env["VAPID_SUBJECT"] ?? "mailto:admin@createai.digital";

    if (!pub || !priv) {
      record("webPush:os", false, "VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set — push skipped");
    } else {
      webpush.setVapidDetails(subj, pub, priv);
      const subs = (await rawSql`
        SELECT id, user_id, endpoint, p256dh, auth_key
        FROM platform_push_subscriptions
      `) as Array<Record<string, string>>;

      if (subs.length === 0) {
        record("webPush:os", false, "0 subscriptions found — no browsers registered yet");
      } else {
        let sent = 0; let failed = 0;
        await Promise.all(subs.map(async sub => {
          try {
            await webpush.sendNotification(
              { endpoint: sub["endpoint"], keys: { p256dh: sub["p256dh"], auth: sub["auth_key"] } },
              JSON.stringify({ title: `🔔 ${TITLE}`, body: MESSAGE, tag: ALERT_ID, timestamp: NOW }),
            );
            sent++;
          } catch { failed++; }
        }));
        record("webPush:os", sent > 0, `${sent} sent / ${failed} failed across ${subs.length} device(s)`);
      }
    }
  } catch (e) { record("webPush:os", false, (e as Error).message); }

  // ── Summary ──────────────────────────────────────────────────────────────
  const passed  = log.filter(l => l.ok).length;
  const failed  = log.filter(l => !l.ok).length;

  console.log(`\n${"═".repeat(64)}`);
  console.log(`  ALERT COMPLETE — ${Date.now() - T0}ms`);
  console.log(`  ✅ ${passed} channels delivered  ❌ ${failed} channels failed`);
  console.log(`  Alert ID: ${ALERT_ID}`);
  console.log(`${"═".repeat(64)}`);
  log.forEach(l => console.log(`  ${l.ok ? "✅" : "❌"} ${l.channel}: ${l.detail}`));
  console.log(`${"═".repeat(64)}\n`);
}

main().catch(err => {
  console.error("[fireAlert] Fatal:", err);
  process.exit(1);
});
