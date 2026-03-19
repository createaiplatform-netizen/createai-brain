// ═══════════════════════════════════════════════════════════════════════════
// ANOMALY DETECTOR — Risk scoring and flag generation per execution.
//
// Analyzes a completed ExecutionRecord against thresholds and recent history
// from ExecutionStore. Returns a riskScore (0–1) and a list of string flags.
//
// Flags (all additive):
//   HIGH_TOKEN_USAGE     — tokenUsage > 8 000
//   DEEP_RECURSION       — depth ≥ 3
//   HIGH_COST            — costEstimate > $0.05
//   EXECUTION_BLOCKED    — status === "blocked"
//   REPEATED_FAILURE     — ≥3 error records for the same engineId in recent window
//
// riskScore = sum of per-flag contributions, capped at 1.0.
//
// Constructor receives ExecutionStore — no direct import of the store module.
// ═══════════════════════════════════════════════════════════════════════════

import type { ExecutionStore, ExecutionRecord } from "./ExecutionStore";

// ─── Anomaly result ───────────────────────────────────────────────────────────

export interface AnomalyResult {
  /** Aggregate risk score: 0 (safe) – 1 (critical). */
  riskScore: number;

  /** Human-readable flags that contributed to the risk score. */
  flags: string[];
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  HIGH_TOKEN_USAGE:     8_000,
  HIGH_DEPTH:           3,
  HIGH_COST_USD:        0.05,
  REPEATED_FAILURE_WIN: 20,  // how many recent records to scan
  REPEATED_FAILURE_MIN: 3,   // min failures in window to trigger flag
} as const;

// Per-flag risk contribution (must sum ≤ 1 when all flags fire)
const RISK_WEIGHTS: Record<string, number> = {
  HIGH_TOKEN_USAGE:  0.20,
  DEEP_RECURSION:    0.25,
  HIGH_COST:         0.20,
  EXECUTION_BLOCKED: 0.15,
  REPEATED_FAILURE:  0.40,
};

// ─── AnomalyDetector ─────────────────────────────────────────────────────────

export class AnomalyDetector {
  constructor(private readonly store: ExecutionStore) {}

  /**
   * analyze — score one execution record.
   *
   * @param record        The completed (or blocked) execution to score
   * @param recentWindow  How many recent store records to scan for patterns
   *                      (default: THRESHOLDS.REPEATED_FAILURE_WIN)
   */
  analyze(
    record:       ExecutionRecord,
    recentWindow: number = THRESHOLDS.REPEATED_FAILURE_WIN,
  ): AnomalyResult {
    const flags: string[] = [];

    // ── Static checks ───────────────────────────────────────────────────────
    if (record.tokenUsage > THRESHOLDS.HIGH_TOKEN_USAGE) {
      flags.push("HIGH_TOKEN_USAGE");
    }
    if (record.depth >= THRESHOLDS.HIGH_DEPTH) {
      flags.push("DEEP_RECURSION");
    }
    if ((record.costEstimate ?? 0) > THRESHOLDS.HIGH_COST_USD) {
      flags.push("HIGH_COST");
    }
    if (record.status === "blocked") {
      flags.push("EXECUTION_BLOCKED");
    }

    // ── History-based pattern check ─────────────────────────────────────────
    const recent   = this.store.list().slice(0, recentWindow);
    const failures = recent.filter(
      r => r.engineId === record.engineId && r.status === "error",
    ).length;
    if (failures >= THRESHOLDS.REPEATED_FAILURE_MIN) {
      flags.push("REPEATED_FAILURE");
    }

    // ── Aggregate risk score ────────────────────────────────────────────────
    const riskScore = Math.min(
      1,
      flags.reduce((acc, flag) => acc + (RISK_WEIGHTS[flag] ?? 0), 0),
    );

    return { riskScore: +riskScore.toFixed(4), flags };
  }
}
