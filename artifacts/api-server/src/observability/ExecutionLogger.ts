// ═══════════════════════════════════════════════════════════════════════════
// EXECUTION LOGGER — Lifecycle-enforced execution tracking.
//
// Usage pattern — start() returns a handle; handle.complete() MUST be called:
//
//   const handle = executionLogger.start({
//     executionId, requestId, userId,
//     engineId, trace, depth, tokenUsage,
//   });
//
//   // ... service runs ...
//
//   handle.complete({ status: "success" });
//   // or
//   handle.complete({ status: "error",   errorCode: "UPSTREAM_TIMEOUT" });
//   // or
//   handle.complete({ status: "blocked", errorCode: "GUARD_MAX_DEPTH" });
//
// On complete():
//   1. durationMs computed from startedAt
//   2. CostCalculator.calculate()  → costEstimate + efficiencyScore
//   3. AnomalyDetector.analyze()   → riskScore + flags (logged to stderr if any)
//   4. ExecutionStore.save()       → record persisted
//
// Blocked executions (from ExpansionGuard) use status "blocked" and are logged
// identically to success/error records — full cost + risk scoring applied.
//
// No container import — wired through bootstrap.ts via constructor injection.
// ═══════════════════════════════════════════════════════════════════════════

import type { ExecutionStore, ExecutionRecord } from "./ExecutionStore";
import type { CostCalculator }                  from "./CostCalculator";
import type { AnomalyDetector }                 from "./AnomalyDetector";

// ─── Input types ──────────────────────────────────────────────────────────────

export interface StartInput {
  executionId: string;
  requestId:   string;
  userId?:     string;
  engineId:    string;
  /** Ordered list of engineIds representing the call chain / guard trace. */
  trace:       string[];
  depth:       number;
  tokenUsage:  number;
}

export interface CompleteInput {
  status:      "success" | "error" | "blocked";
  /** Machine-readable error or block code (e.g. "GUARD_MAX_DEPTH"). */
  errorCode?:  string;
}

// ─── Execution handle — enforces start() → complete() lifecycle ───────────────

export interface ExecutionHandle {
  /**
   * complete — finalise the execution.
   * Idempotent: subsequent calls after the first are silently ignored.
   * Must be called even when the execution is blocked by the guard.
   */
  complete(input: CompleteInput): void;
}

// ─── ExecutionLogger ─────────────────────────────────────────────────────────

export class ExecutionLogger {
  constructor(
    private readonly store:    ExecutionStore,
    private readonly costs:    CostCalculator,
    private readonly anomalies: AnomalyDetector,
  ) {}

  /**
   * start — open an execution context.
   * Captures startedAt timestamp immediately.
   * Returns an ExecutionHandle — call handle.complete() when done.
   */
  start(input: StartInput): ExecutionHandle {
    const startedAt = Date.now();
    const { executionId, requestId, userId, engineId, trace, depth, tokenUsage } = input;
    let completed = false;

    return {
      complete: (completion: CompleteInput): void => {
        if (completed) return;  // idempotent guard
        completed = true;

        const endedAt    = Date.now();
        const durationMs = endedAt - startedAt;

        // ── Cost calculation ────────────────────────────────────────────────
        const { costEstimate, efficiencyScore } =
          this.costs.calculate(engineId, tokenUsage, durationMs);

        // ── Build partial record for anomaly analysis ───────────────────────
        const partial: ExecutionRecord = {
          executionId,
          requestId,
          ...(userId ? { userId } : {}),
          engineId,
          trace,
          depth,
          tokenUsage,
          startedAt,
          endedAt,
          durationMs,
          status:    completion.status,
          ...(completion.errorCode ? { errorCode: completion.errorCode } : {}),
          costEstimate,
          efficiencyScore,
        };

        // ── Anomaly scoring ─────────────────────────────────────────────────
        const { riskScore, flags } = this.anomalies.analyze(partial);

        if (flags.length > 0) {
          console.warn(
            `[ExecutionLogger] Anomaly — engineId=${engineId} status=${completion.status}`,
            { executionId, flags, riskScore, costEstimate, durationMs },
          );
        }

        // ── Persist ─────────────────────────────────────────────────────────
        this.store.save({ ...partial, riskScore });
      },
    };
  }
}
