/**
 * GlobalPulse — Platform-Wide Alert Orchestrator
 *
 * GET  /api/system/nodes          — all platform nodes (electric + mesh), each with device list
 * POST /api/system/alert-test     — send alert to one node (or TEST_NODE sandbox), return device latencies
 * POST /api/task/:id              — run a platform-wide task by numeric ID with retry contract
 * POST /api/global-alert-log      — persist a full GlobalPulse report
 *
 * Also retains original:
 * POST /api/system/alert-test     — full EBS-style system test (no body = sandbox mode)
 */

import { Router, type Request, type Response } from "express";
import { rawSql } from "@workspace/db";
import { queueMessage, processQueue }  from "../services/ventonWay.js";
import { queueNetJob }                 from "../services/electricNetWay.js";
import { queueJob as queueENWJob }     from "../services/everythingNetWay.js";
import { getElectricNodes }            from "../services/electricNetWay.js";
import { getMeshNodes }                from "../services/meshNetWay.js";
import webpush                          from "web-push";

const router = Router();

const TEST_NODE   = "TEST_NODE";
const TEST_MARKER = "SYSTEM_ALERT_TEST";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

async function ensurePulseLogTable(): Promise<void> {
  await rawSql`
    CREATE TABLE IF NOT EXISTS platform_global_pulse_log (
      id          SERIAL PRIMARY KEY,
      run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      nodes_tested INT         NOT NULL DEFAULT 0,
      tasks_run    INT         NOT NULL DEFAULT 0,
      success_rate NUMERIC(5,2),
      report      JSONB        NOT NULL DEFAULT '{}'::jsonb
    )
  `;
}

// ─── GET /api/system/nodes ────────────────────────────────────────────────────
// Returns unified node list: electric grid nodes + mesh internet nodes.
// Each node carries its push-subscribed device list.

router.get("/nodes", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  try {
    const [electric, mesh, subs] = await Promise.all([
      getElectricNodes(),
      getMeshNodes(),
      rawSql`SELECT id, user_id, endpoint FROM platform_push_subscriptions` as
        Promise<Array<Record<string, string>>>,
    ]);

    // Build a simple device list from push subscriptions (shared across all nodes)
    const devices = (subs as Array<Record<string, string>>).map(s => ({
      id:       String(s["id"]),
      userId:   String(s["user_id"]),
      endpoint: (s["endpoint"] as string).slice(0, 60) + "…",
    }));

    const nodes = [
      ...electric.map(n => ({
        id:       `electric:${n.id}`,
        name:     n.node_name,
        type:     "electric",
        status:   n.status,
        location: n.location,
        devices,
      })),
      ...mesh.map(n => ({
        id:       `mesh:${n.id}`,
        name:     n.node_name,
        type:     "mesh",
        status:   n.status,
        location: n.location,
        devices,
      })),
    ];

    // Always include the TEST_NODE sandbox
    nodes.unshift({
      id:       TEST_NODE,
      name:     "Sandbox Test Node",
      type:     "sandbox",
      status:   "active",
      location: "virtual",
      devices,
    });

    res.json({ ok: true, count: nodes.length, nodes });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /api/system/alert-test ─────────────────────────────────────────────
// Two modes:
//   • GlobalPulse mode — body has { testNode, production, payload }
//     → sends alert to the specified node, returns { ok, nodeId, devices, durationMs }
//   • Sandbox mode (no body / no testNode)
//     → full EBS system-test: VentonWay + Electric + ENW + Web Push, self-cleans

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
  if (body.testNode) {
    const start       = Date.now();
    const nodeId      = body.testNode;
    const alertTitle  = body.payload?.title   ?? "CreateAI Brain — Platform Alert";
    const alertBody   = body.payload?.message ?? "Platform-wide alert from GlobalPulse.";
    const priority    = body.payload?.priority ?? "high";
    const actions     = body.payload?.actions  ?? [];
    const timestamp   = new Date().toISOString();

    const alertPayload = { nodeId, timestamp, title: alertTitle, message: alertBody, priority, actions };

    // Queue alert in EverythingNetWay for this node
    try {
      await queueENWJob({ type: "GLOBAL_PULSE_ALERT", layer: "messaging", payload: alertPayload });
    } catch { /* non-fatal */ }

    // Fire push notifications and collect device latencies
    const vapidReady = initVapid();
    const deviceResults: Array<{ id: string; received: boolean; latencyMs: number | null }> = [];

    if (vapidReady) {
      const subs = (await rawSql`
        SELECT id, endpoint, p256dh, auth_key, user_id
        FROM platform_push_subscriptions
      `) as Array<Record<string, string>>;

      for (const sub of subs) {
        const devStart = Date.now();
        try {
          await webpush.sendNotification(
            {
              endpoint: sub["endpoint"],
              keys: { p256dh: sub["p256dh"], auth: sub["auth_key"] },
            },
            JSON.stringify({
              title:     `🔔 ${alertTitle}`,
              body:      alertBody,
              tag:       `cai-pulse-${nodeId}`,
              priority,
              timestamp,
              actions,
            }),
          );
          deviceResults.push({ id: String(sub["id"]), received: true,  latencyMs: Date.now() - devStart });
        } catch {
          deviceResults.push({ id: String(sub["id"]), received: false, latencyMs: null });
        }
      }
    }

    const received = deviceResults.filter(d => d.received).length;
    const durationMs = Date.now() - start;

    res.json({
      ok:          true,
      nodeId,
      production:  body.production ?? false,
      timestamp,
      durationMs,
      devicesReached: received,
      devicesTotal:   deviceResults.length,
      devices:        deviceResults,
    });
    return;
  }

  // ── Sandbox / EBS mode (no testNode) ─────────────────────────────────────
  const timestamp = new Date().toISOString();
  const testPayload = {
    event_type: "TEST_ALERT",
    timestamp,
    message:    "Full-system test alert. No action required.",
    node_id:    TEST_NODE,
    marker:     TEST_MARKER,
  };

  const log: string[] = [];
  const results: Record<string, unknown> = {};

  try {
    const vMsg = await queueMessage({
      type:      "email",
      recipient: "admin@LakesideTrinity.com",
      subject:   `[TEST ALERT] ${timestamp}`,
      body:      `Full-system EBS-style alert test.\n\nPayload:\n${JSON.stringify(testPayload, null, 2)}`,
      metadata:  testPayload,
    });
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
      await rawSql`DELETE FROM platform_venton_way_queue   WHERE metadata::jsonb->>'marker' = ${TEST_MARKER}`;
      await rawSql`DELETE FROM platform_electric_net_way_queue WHERE target = ${TEST_NODE} AND type = 'TEST_ALERT'`;
      await rawSql`DELETE FROM platform_everything_queue   WHERE payload::jsonb->>'marker' = ${TEST_MARKER}`;
      console.log("[AlertTest] ✅ Test node and events cleared.");
    } catch (err) { console.error("[AlertTest] Cleanup error:", (err as Error).message); }
  }, 5000);

  res.json({ ok: true, timestamp, log, results });
});

// ─── POST /api/task/:id ───────────────────────────────────────────────────────
// Platform-wide task execution. Queues a job in EverythingNetWay and returns.
// The GlobalPulse client handles its own MAX_RETRIES loop outside.

const TASK_NAMES: Record<number, string> = {
  1: "Task A — Infrastructure Heartbeat",
  2: "Task B — Alert Propagation Check",
  3: "Task C — Queue Drain Verification",
  4: "Task D — Node Status Sync",
  5: "Task E — Push Delivery Audit",
  6: "Task F — Mesh Latency Probe",
  7: "Task G — Electric Grid Health",
  8: "Task H — Semantic Index Refresh",
  9: "Task I — Activity Log Flush",
 10: "Task J — System Integrity Scan",
};

router.post("/task/:taskId", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  const taskId = parseInt(String(req.params["taskId"]), 10);
  if (isNaN(taskId) || taskId < 1 || taskId > 10) {
    res.status(400).json({ ok: false, error: "taskId must be 1–10" });
    return;
  }

  const taskName  = TASK_NAMES[taskId] ?? `Task ${taskId}`;
  const { platformWide } = req.body as { platformWide?: boolean };

  try {
    const job = await queueENWJob({
      type:    "PLATFORM_TASK",
      layer:   "ops",
      payload: {
        taskId,
        taskName,
        platformWide: platformWide ?? false,
        queuedAt: new Date().toISOString(),
      },
    });

    res.json({
      ok:         true,
      taskId,
      task:       taskName,
      jobId:      job.id,
      platformWide: platformWide ?? false,
      status:     "queued",
      message:    `${taskName} queued successfully`,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /api/global-alert-log ──────────────────────────────────────────────
// Persists a GlobalPulse run report to platform_global_pulse_log.

router.post("/global-alert-log", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  const report = req.body as {
    timestamp?:    string;
    nodesTested?:  number;
    alertResults?: Array<{ nodeId: string; success: boolean }>;
    tasks?:        Array<{ task: string; success: boolean }>;
  };

  try {
    await ensurePulseLogTable();

    const nodesTested  = report.nodesTested  ?? report.alertResults?.length ?? 0;
    const tasksRun     = report.tasks?.length ?? 0;
    const successNodes = (report.alertResults ?? []).filter(r => r.success).length;
    const successTasks = (report.tasks ?? []).filter(t => t.success).length;
    const totalItems   = nodesTested + tasksRun;
    const successRate  = totalItems > 0
      ? (((successNodes + successTasks) / totalItems) * 100).toFixed(2)
      : "0.00";

    await rawSql`
      INSERT INTO platform_global_pulse_log
        (nodes_tested, tasks_run, success_rate, report)
      VALUES (
        ${nodesTested},
        ${tasksRun},
        ${successRate},
        ${JSON.stringify(report)}::jsonb
      )
    `;

    console.log(`[GlobalPulse] Report stored — ${nodesTested} nodes, ${tasksRun} tasks, ${successRate}% success`);
    res.json({ ok: true, stored: true, nodesTested, tasksRun, successRate: `${successRate}%` });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
