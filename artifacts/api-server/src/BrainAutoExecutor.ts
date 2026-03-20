/**
 * Infinite Brain Auto-Executor
 * Fully autonomous execution + family notifications.
 *
 * Set BRAIN_AUTO_START=true in env to trigger on server startup.
 *
 * Task execution flow:
 *   1. executeInfinitely() wraps the task in a 9,999-retry loop with CoreEngine validation.
 *   2. On successful completion, notifyFamilyEvent() alerts all 10 family members via email + SMS.
 *   3. Each task runs in sequence — all output is logged with [AutoExecutor] prefix.
 */

import { executeInfinitely }   from "./engine/InfinityExecutor.js";
import { notifyFamilyEvent }   from "./utils/notifications.js";
import { createDocumentary }   from "./tasks/createDocumentary.js";
import { generateReport }      from "./tasks/generateReport.js";
import { runVerification }     from "./services/verificationRunner.js";

// ─── Task wrapper ─────────────────────────────────────────────────────────────

async function autoExecuteTask<T = unknown>(
  taskFn:    () => Promise<T>,
  taskLabel: string,
): Promise<T> {
  console.log(`[AutoExecutor] Starting task: ${taskLabel}`);

  const result = await executeInfinitely(taskFn, {
    notifyOnCompletion: false, // custom notifications handled below
    taskLabel,
  });

  console.log(`[AutoExecutor] Task "${taskLabel}" completed — notifying family…`);

  await notifyFamilyEvent({
    subject: `Brain Task Complete: ${taskLabel}`,
    message: [
      `The Brain has successfully completed the task: "${taskLabel}".`,
      ``,
      `Result summary: ${JSON.stringify(
        typeof result === "object" && result !== null
          ? {
              complete:    (result as Record<string, unknown>).complete,
              completedAt: (result as Record<string, unknown>).completedAt,
              taskType:    (result as Record<string, unknown>).taskType,
            }
          : result,
        null,
        2,
      )}`,
      ``,
      `View your live Brain dashboard to see full output.`,
      ``,
      `— Your Brain`,
    ].join("\n"),
  });

  return result;
}

// ─── Startup sequence ─────────────────────────────────────────────────────────

/**
 * startupAutoExecutor — run all configured tasks in sequence.
 * Add or remove tasks here. Each one is retried infinitely until CoreEngine
 * validation passes.
 */
export async function startupAutoExecutor(): Promise<void> {
  console.log("[AutoExecutor] Starting full Brain auto-execution sequence…");

  await autoExecuteTask(
    () => createDocumentary("15h", "movie-style", "full-universe knowledge"),
    "15h Movie-Style Documentary",
  );

  await autoExecuteTask(
    () => generateReport("infinite-learning-summary"),
    "Infinite Learning Summary Report",
  );

  // ── 6-step verification after all tasks complete ───────────────────────
  console.log("[AutoExecutor] Running full verification sequence…");
  const report = await runVerification();
  console.log(`[AutoExecutor] Verification complete — allPassed:${report.allPassed} · ${report.totalMs}ms`);

  console.log("[AutoExecutor] ✓ All tasks executed successfully.");
}
