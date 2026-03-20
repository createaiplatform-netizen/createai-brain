/**
 * Infinity Execution & Rule Enforcement Module
 * --------------------------------------------
 * Wraps any async task in a rule-validated retry loop, running up to
 * MAX_RETRIES times until the output passes all of Sara's defined rules.
 *
 * Rules enforced on every attempt:
 *  - safe, legal, user-friendly, compliant (HIPAA / GDPR / SOC2)
 *  - always for good, never for harm
 *  - prevents waste, maximizes efficiency
 *  - output must be 100% complete — partial = retry
 *
 * Usage:
 *   import { executeInfinitely } from "./InfinityExecutor.js";
 *
 *   const doc = await executeInfinitely(
 *     () => createDocumentary("15h", "movie-style", "full-universe knowledge"),
 *     { notifyOnCompletion: true, taskLabel: "Documentary Generator" }
 *   );
 */

import { executeTask, type BrainRules } from "./CoreEngine.js";
import { notifyFamilyEvent }            from "../utils/notifications.js";

// ─── Shared rule set ──────────────────────────────────────────────────────────

const RULES: BrainRules = {
  safety:             true,
  legality:           true,
  userFriendly:       true,
  compliance:         true,
  alwaysGood:         true,
  preventWaste:       true,
  maximizeEfficiency: true,
  mustComplete:       true,
};

// ─── Options ──────────────────────────────────────────────────────────────────

export interface InfinityOptions {
  notifyOnCompletion?: boolean; // send family notification when task succeeds
  taskLabel?:          string;  // human-readable name used in logs and notifications
  maxRetries?:         number;  // override MAX_RETRIES (default: 9999)
  retryDelayMs?:       number;  // pause between retries in ms (default: 0)
}

// ─── Core executor ────────────────────────────────────────────────────────────

export async function executeInfinitely<T = unknown>(
  task: () => T | Promise<T>,
  options: InfinityOptions = {},
): Promise<T> {
  const {
    notifyOnCompletion = false,
    taskLabel          = task.name || "unnamed-task",
    maxRetries         = 9999,
    retryDelayMs       = 0,
  } = options;

  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;

    const result = await executeTask(task as () => unknown, RULES);

    if (result.success) {
      console.log(
        `[InfinityExecutor] "${taskLabel}" succeeded on attempt ${attempt} ` +
        `(${result.durationMs}ms)`
      );

      if (notifyOnCompletion) {
        void notifyFamilyEvent({
          subject: `Brain Task Complete: ${taskLabel}`,
          message:
            `Your Brain executed "${taskLabel}" successfully on attempt ${attempt}. ` +
            `Duration: ${result.durationMs}ms.`,
        });
      }

      return result.output as T;
    }

    // Log violations and retry
    console.warn(
      `[InfinityExecutor] "${taskLabel}" attempt ${attempt} failed — ` +
      `violations: ${result.violations.join("; ")}`
    );

    if (retryDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }

  throw new Error(
    `[InfinityExecutor] "${taskLabel}" could not complete safely after ${maxRetries} attempts.`
  );
}
