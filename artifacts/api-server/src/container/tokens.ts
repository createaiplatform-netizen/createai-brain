// ═══════════════════════════════════════════════════════════════════════════
// SERVICE TOKENS — Unique symbols used as DI keys in ServiceContainer.
//
// Using Symbols (not strings) guarantees no accidental key collisions and
// makes tokens impossible to forge from outside this module.
// ═══════════════════════════════════════════════════════════════════════════

export const ENCRYPTION_SERVICE  = Symbol("EncryptionService");
export const MEMORY_SERVICE      = Symbol("MemoryService");

// ── Observability ─────────────────────────────────────────────────────────────
export const EXECUTION_STORE     = Symbol("ExecutionStore");
export const COST_CALCULATOR     = Symbol("CostCalculator");
export const ANOMALY_DETECTOR    = Symbol("AnomalyDetector");
export const EXECUTION_LOGGER    = Symbol("ExecutionLogger");
