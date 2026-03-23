/**
 * runGlobalPulse.ts — GlobalPulse Execution Module
 *
 * Calls service functions directly (no HTTP auth required).
 * Safe to run server-side as a standalone script or imported by publish.ts.
 *
 * Usage:
 *   npx tsx src/runGlobalPulse.ts
 */

import { getAllNodes }                          from "./services/nodesService.js";
import { runAlertTestForNode }                  from "./services/alertTestService.js";
import { runPlatformTask }                      from "./services/taskService.js";
import { saveGlobalAlertLog }                   from "./services/globalAlertLogService.js";

const MAX_RETRIES = 3;

// ─── Execute GlobalPulse ──────────────────────────────────────────────────────

export async function runGlobalPulse(): Promise<void> {
  console.log("[GlobalPulse] Starting platform-wide alert orchestration…");

  const alertPayload = {
    title:    "Global Alert",
    message:  "This is a platform-wide alert.",
    priority: "high",
    actions:  ["open_app", "view_dashboard"],
  };

  // 1. Fetch all nodes
  const nodes = await getAllNodes();
  console.log(`[GlobalPulse] ${nodes.length} node(s) found — triggering alerts in parallel…`);

  // 2. Trigger alerts for all nodes in parallel
  const alertResults = await Promise.all(
    nodes.map(async (node) => {
      const start = Date.now();
      try {
        const devices = await runAlertTestForNode(node.id, alertPayload, true);
        const reached = devices.filter(d => d.received).length;
        console.log(`[GlobalPulse] ✅ ${node.name} — ${reached}/${devices.length} device(s) reached`);
        return { nodeId: node.id, success: true, devicesReached: reached, devicesTotal: devices.length, durationMs: Date.now() - start };
      } catch (err) {
        console.warn(`[GlobalPulse] ⚠️  ${node.name} — alert failed: ${(err as Error).message}`);
        return { nodeId: node.id, success: false, devicesReached: 0, devicesTotal: 0, durationMs: Date.now() - start, error: (err as Error).message };
      }
    }),
  );
  const alertOk = alertResults.filter(r => r.success).length;
  console.log(`[GlobalPulse] Alerts complete — ${alertOk}/${nodes.length} nodes reached`);

  // 3. Run tasks A–J in parallel, each with MAX_RETRIES
  const tasks = Array.from({ length: 10 }, (_, i) => ({
    id:   i + 1,
    name: `Task ${String.fromCharCode(65 + i)}`,
  }));
  console.log("[GlobalPulse] Running 10 platform tasks with retry…");

  const taskResults = await Promise.all(
    tasks.map(async (task) => {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await runPlatformTask(task.id, { platformWide: true });
          console.log(`[GlobalPulse] ✅ ${task.name} queued (jobId: ${result.jobId})`);
          return { task: task.name, success: true, result };
        } catch (err) {
          if (attempt === MAX_RETRIES) {
            console.warn(`[GlobalPulse] ❌ ${task.name} failed after ${MAX_RETRIES} attempts: ${(err as Error).message}`);
            return { task: task.name, success: false, error: (err as Error).message };
          }
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
      return { task: task.name, success: false, error: "Max retries exceeded" };
    }),
  );
  const taskOk = taskResults.filter(r => r.success).length;
  console.log(`[GlobalPulse] Tasks complete — ${taskOk}/10 succeeded`);

  // 4. Build and persist full report
  const report = {
    timestamp:   new Date().toISOString(),
    nodesTested: nodes.length,
    alertResults,
    taskResults,
  };

  const saved = await saveGlobalAlertLog(report);
  console.log(`[GlobalPulse] ✅ Report persisted — id:${saved.id} · successRate:${saved.successRate}`);
}

// ─── Run when executed directly (not when imported) ──────────────────────────

const isMain = process.argv[1] &&
  (await import("url")).fileURLToPath(import.meta.url) === (await import("path")).resolve(process.argv[1]);

if (isMain) {
  runGlobalPulse().catch(err => {
    console.error("[GlobalPulse] Fatal error:", (err as Error).message);
    process.exit(1);
  });
}
