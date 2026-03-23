/**
 * GlobalPulse — systemRouter
 * Mounted at /api/system
 *
 * GET  /api/system/nodes            — all platform nodes (electric + mesh + sandbox)
 * POST /api/system/alert-test       — send alert to a node; returns device results
 * POST /api/system/global-alert-log — persist a full GlobalPulse run report
 * GET  /api/system/pulse-history    — last N pulse run summaries
 *
 * Legacy EBS sandbox mode (no body) still supported on /alert-test.
 */

import { Router, type Request, type Response } from "express";
import { getAllNodes }         from "../services/nodesService.js";
import { runAlertTestForNode } from "../services/alertTestService.js";
import { saveGlobalAlertLog, getPulseHistory } from "../services/globalAlertLogService.js";
import { queueMessage, processQueue } from "../services/ventonWay.js";
import { queueNetJob }                from "../services/electricNetWay.js";
import { queueJob as queueENWJob }    from "../services/everythingNetWay.js";
import { rawSql }                     from "@workspace/db";
import webpush                         from "web-push";

const router = Router();

const TEST_NODE   = "TEST_NODE";
const TEST_MARKER = "SYSTEM_ALERT_TEST";

function isAdmin(req: Request): boolean {
  if (!req.user) return false;
  const role = (req.user as { role?: string }).role ?? "user";
  return ["admin", "founder"].includes(role);
}

function initVapid(): boolean {
  const pub  = process.env["VAPID_PUBLIC_KEY"];
  const priv = process.env["VAPID_PRIVATE_KEY"];
  const subj = process.env["VAPID_SUBJECT"] ?? "mailto:admin@createai.digital";
  if (!pub || !priv) return false;
  try { webpush.setVapidDetails(subj, pub, priv); return true; }
  catch { return false; }
}

// ── GET /api/system/nodes ─────────────────────────────────────────────────────

router.get("/nodes", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const nodes = await getAllNodes();
    res.json({ ok: true, count: nodes.length, nodes });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── POST /api/system/alert-test ───────────────────────────────────────────────
// GlobalPulse mode: body has { testNode, production, payload }
// Sandbox mode:     no body (or no testNode) → legacy EBS full-system test

router.post("/alert-test", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  const body = req.body as {
    testNode?:   string;
    production?: boolean;
    payload?: {
      title?:    string;
      message?:  string;
      priority?: string;
      actions?:  string[];
    };
  };

  // ── GlobalPulse mode ──────────────────────────────────────────────────────
  if (body.testNode && body.payload) {
    const start      = Date.now();
    const nodeId     = body.testNode;
    const production = body.production ?? false;

    try {
      const devices = await runAlertTestForNode(nodeId, body.payload, production);
      res.json({
        ok:             true,
        nodeId,
        production,
        timestamp:      new Date().toISOString(),
        durationMs:     Date.now() - start,
        devicesReached: devices.filter(d => d.received).length,
        devicesTotal:   devices.length,
        devices,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: (err as Error).message });
    }
    return;
  }

  // ── Sandbox / EBS mode ────────────────────────────────────────────────────
  const timestamp   = new Date().toISOString();
  const testPayload = { event_type: "TEST_ALERT", timestamp, message: "Full-system test alert. No action required.", node_id: TEST_NODE, marker: TEST_MARKER };
  const log: string[] = [];
  const results: Record<string, unknown> = {};

  try {
    const vMsg = await queueMessage({ type: "email", recipient: "admin@LakesideTrinity.com", subject: `[TEST ALERT] ${timestamp}`, body: `Full-system EBS-style alert test.\n\nPayload:\n${JSON.stringify(testPayload, null, 2)}`, metadata: testPayload });
    results["ventonWay_queued"] = { id: vMsg.id };
    log.push(`✅ VentonWay message queued (id: ${vMsg.id})`);
  } catch (err) {
    results["ventonWay_queued"] = { error: (err as Error).message };
    log.push(`❌ VentonWay queue failed: ${(err as Error).message}`);
  }

  try {
    const eJob = await queueNetJob({ category: "energy", type: "TEST_ALERT", target: TEST_NODE, payload: testPayload });
    results["electric_queued"] = { id: eJob.id };
    log.push(`✅ ElectricNetWay job queued (id: ${eJob.id})`);
  } catch (err) {
    results["electric_queued"] = { error: (err as Error).message };
    log.push(`❌ ElectricNetWay queue failed: ${(err as Error).message}`);
  }

  try {
    const eJob = await queueENWJob({ type: "TEST_ALERT", layer: "messaging", payload: testPayload });
    results["everything_queued"] = { id: eJob.id };
    log.push(`✅ EverythingNetWay job queued (id: ${eJob.id})`);
  } catch (err) {
    results["everything_queued"] = { error: (err as Error).message };
    log.push(`❌ EverythingNetWay queue failed: ${(err as Error).message}`);
  }

  let pushSubs: Array<Record<string, string>> = [];
  try {
    pushSubs = (await rawSql`SELECT id, user_id, endpoint FROM platform_push_subscriptions`) as Array<Record<string, string>>;
    results["subscribed_devices"] = pushSubs.map(s => ({ id: s["id"], user_id: s["user_id"] }));
    log.push(`✅ Found ${pushSubs.length} subscribed device(s)`);
  } catch (err) {
    log.push(`❌ Push subscription list failed: ${(err as Error).message}`);
  }

  try {
    const qResult = await processQueue();
    results["queue_processed"] = qResult;
    log.push(`✅ Queue processed — ${qResult.sent} sent, ${qResult.failed} failed`);
  } catch (err) {
    results["queue_processed"] = { error: (err as Error).message };
    log.push(`❌ Queue processing failed: ${(err as Error).message}`);
  }

  const vapidReady = initVapid();
  if (!vapidReady) {
    results["push_notifications"] = { skipped: "VAPID keys not configured" };
    log.push("⚠️  Push notifications skipped — VAPID keys not set");
  } else if (pushSubs.length === 0) {
    results["push_notifications"] = { skipped: "No push subscriptions found" };
    log.push("⚠️  Push notifications skipped — no subscribed devices");
  } else {
    let pushSent = 0; let pushFailed = 0;
    const pushDetail: Array<{ userId: string; ok: boolean; error?: string }> = [];
    for (const sub of pushSubs) {
      try {
        const fullSub = (await rawSql`SELECT endpoint, p256dh, auth_key FROM platform_push_subscriptions WHERE id = ${sub["id"]}`) as Array<Record<string, string>>;
        if (!fullSub[0]) continue;
        await webpush.sendNotification(
          { endpoint: fullSub[0]["endpoint"], keys: { p256dh: fullSub[0]["p256dh"], auth: fullSub[0]["auth_key"] } },
          JSON.stringify({ title: "🔔 CreateAI Brain — System Alert Test", body: "Full-system EBS-style test. No action required.", tag: "cai-alert-test", timestamp }),
        );
        pushSent++;
        pushDetail.push({ userId: sub["user_id"], ok: true });
        log.push(`✅ Push alert sent to device (user: ${sub["user_id"]})`);
      } catch (err) {
        pushFailed++;
        pushDetail.push({ userId: sub["user_id"], ok: false, error: (err as Error).message });
        log.push(`❌ Push failed (user: ${sub["user_id"]}): ${(err as Error).message}`);
      }
    }
    results["push_notifications"] = { sent: pushSent, failed: pushFailed, detail: pushDetail };
  }

  log.push("🕐 Cleanup scheduled in 5s");
  setTimeout(async () => {
    try {
      await rawSql`DELETE FROM platform_venton_way_queue WHERE metadata::jsonb->>'marker' = ${TEST_MARKER}`;
      await rawSql`DELETE FROM platform_electric_net_way_queue WHERE target = ${TEST_NODE} AND type = 'TEST_ALERT'`;
      await rawSql`DELETE FROM platform_everything_queue WHERE payload::jsonb->>'marker' = ${TEST_MARKER}`;
      console.log("[AlertTest] ✅ Test node and events cleared.");
    } catch (err) { console.error("[AlertTest] Cleanup error:", (err as Error).message); }
  }, 5000);

  res.json({ ok: true, timestamp, log, results });
});

// ── POST /api/system/global-alert-log ────────────────────────────────────────

router.post("/global-alert-log", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const report = req.body;
  if (!report || typeof report !== "object") {
    res.status(400).json({ error: "Missing report body" });
    return;
  }
  try {
    const stored = await saveGlobalAlertLog(report);
    res.json({ success: true, ...stored });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── GET /api/system/pulse-history ─────────────────────────────────────────────

router.get("/pulse-history", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const history = await getPulseHistory(limit);
    res.json({ ok: true, count: history.length, history });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
