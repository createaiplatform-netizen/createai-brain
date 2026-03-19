// ═══════════════════════════════════════════════════════════════════════════
// EXPANSION GUARD — Session-scoped AI engine safety layer.
//
// Position in the call chain:
//   PlatformController → Executor.execute() → ExpansionGuard.run()
//                      → Executor Logic (safeOpts + __guard) → dispatchEngineStream()
//
// Guards against:
//   • Runaway call depth    (GUARD_MAX_DEPTH)
//   • Infinite recursion    (GUARD_MAX_RECURSION)
//   • Token budget overrun  (GUARD_TOKEN_BUDGET)
//
// Contract:
//   • Runtime-agnostic — zero frontend/UI imports, no DOM or React coupling
//   • Works in browser (Vite/ESM) and Node.js (≥14.17) without modification
//   • Never throws — all limit breaches surface through opts.onError()
//   • Injects __guard context into safeOpts for downstream traceability
//   • Emits optional lifecycle hooks (onStart/onSuccess/onError/onBlocked)
//   • Session-scoped state (resets on page reload or expansionGuard.reset())
//   • Zero external dependencies
// ═══════════════════════════════════════════════════════════════════════════

import type { ExecutorRunOpts, GuardContext } from "@/executors/shared";

// ─── Guard limits ─────────────────────────────────────────────────────────────

export interface GuardLimits {
  maxDepth:       number;   // max simultaneous call depth             default: 4
  maxTokens:      number;   // approximate token budget per call       default: 12 000
  maxRecursion:   number;   // max times the same engine may recurse   default: 2
  allowRecursion: boolean;  // if false, any recursion is blocked      default: false
}

const DEFAULT_LIMITS: GuardLimits = {
  maxDepth:       4,
  maxTokens:      12_000,
  maxRecursion:   2,
  allowRecursion: false,
};

// ─── Execution trace ──────────────────────────────────────────────────────────

export interface TraceEntry {
  executionId:  string;
  engineId:     string;
  depth:        number;
  startedAt:    number;
  tokenEst:     number;
  status:       "running" | "done" | "blocked";
  blockReason?: string;
}

// ─── Lifecycle hooks ──────────────────────────────────────────────────────────
// Optional callbacks fired at each lifecycle stage of an execution.
// All hooks receive a GuardEvent — never throw from a hook (errors are swallowed).

export interface GuardEvent {
  executionId:        string;
  engineId:           string;
  depth:              number;
  tokenUsage:         number;
  trace:              Array<{ engineId: string; depth: number; status: string; startedAt: number }>;
  timestamp:          number;
  blockReason?:       string;
  parentExecutionId?: string;
}

export interface GuardHooks {
  /** Fired immediately before executorLogic is called (all checks passed). */
  onStart?:   (event: GuardEvent) => void;
  /** Fired when the execution completes successfully (onDone callback). */
  onSuccess?: (event: GuardEvent) => void;
  /** Fired when the execution produces an error (onError callback). */
  onError?:   (event: GuardEvent) => void;
  /** Fired when any safety limit blocks execution (before onError is called). */
  onBlocked?: (event: GuardEvent) => void;
}

// ─── Event emitter (zero external deps) ─────────────────────────────────────

type TraceListener = (trace: TraceEntry[]) => void;

const _listeners = new Set<TraceListener>();

function _emit(): void {
  const snapshot = _trace.slice();
  _listeners.forEach(fn => {
    try { fn(snapshot); } catch { /* subscriber errors must not propagate */ }
  });
}

// ─── Guard session state ──────────────────────────────────────────────────────

let _depth = 0;
const _recursionMap    = new Map<string, number>();  // engineId → active call count
const _executionStack  = new Array<string>();         // executionId stack (top = current)
const _trace: TraceEntry[] = [];                      // rolling log, capped at 50

// ─── Generic token estimator ─────────────────────────────────────────────────

function _estimateTokens(payload: unknown): number {
  try {
    const str = typeof payload === "string" ? payload : JSON.stringify(payload) ?? "";
    return Math.ceil(str.length / 4);
  } catch {
    return 0;
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _pushTrace(entry: TraceEntry): void {
  _trace.unshift(entry);
  if (_trace.length > 50) _trace.splice(50);
  _emit();
}

function _release(engineId: string, entry: TraceEntry): void {
  _depth = Math.max(0, _depth - 1);
  const count = _recursionMap.get(engineId) ?? 1;
  if (count <= 1) _recursionMap.delete(engineId);
  else            _recursionMap.set(engineId, count - 1);
  _executionStack.pop();
  entry.status = "done";
  _emit();
}

function _fireHook(
  fn:    ((event: GuardEvent) => void) | undefined,
  event: GuardEvent,
): void {
  if (!fn) return;
  try { fn(event); } catch { /* hook errors must never surface */ }
}

function _buildEvent(
  executionId:        string,
  engineId:           string,
  depth:              number,
  tokenUsage:         number,
  parentExecutionId?: string,
  blockReason?:       string,
): GuardEvent {
  return {
    executionId,
    engineId,
    depth,
    tokenUsage,
    trace: _trace.slice(0, 10).map(t => ({
      engineId:  t.engineId,
      depth:     t.depth,
      status:    t.status,
      startedAt: t.startedAt,
    })),
    timestamp:  Date.now(),
    ...(parentExecutionId ? { parentExecutionId } : {}),
    ...(blockReason       ? { blockReason }       : {}),
  };
}

// ─── Expansion Guard singleton ────────────────────────────────────────────────

export const expansionGuard = {

  /**
   * run — The single gated entry point for all domain executor logic.
   *
   * Checks all safety limits. If any limit is breached, fires hooks.onBlocked()
   * then calls opts.onError() — executorLogic is never invoked. If all checks
   * pass, fires hooks.onStart(), injects __guard into safeOpts, calls
   * executorLogic(safeOpts), and fires hooks.onSuccess / hooks.onError on
   * completion.
   *
   * @param engineId       Engine being executed (for recursion tracking)
   * @param opts           Original ExecutorRunOpts from the executor
   * @param executorLogic  The actual executor body — receives safeOpts + __guard
   * @param limits         Optional per-engine limit overrides
   * @param hooks          Optional lifecycle callbacks (never throw from them)
   */
  run(
    engineId:      string,
    opts:          ExecutorRunOpts,
    executorLogic: (safeOpts: ExecutorRunOpts) => void,
    limits:        Partial<GuardLimits> = {},
    hooks:         GuardHooks          = {},
  ): void {
    const L            = { ...DEFAULT_LIMITS, ...limits };
    const executionId  = crypto.randomUUID();
    const tokenEst     = _estimateTokens({ topic: opts.topic, context: opts.context });
    const currentDepth = _depth;
    const parentExecutionId = _executionStack.at(-1);

    // ── Depth check ─────────────────────────────────────────────────────────
    if (currentDepth >= L.maxDepth) {
      const blockReason = `GUARD_MAX_DEPTH: depth=${currentDepth} ≥ limit=${L.maxDepth}`;
      _pushTrace({
        executionId, engineId, depth: currentDepth, startedAt: Date.now(),
        tokenEst, status: "blocked", blockReason,
      });
      _fireHook(hooks.onBlocked, _buildEvent(executionId, engineId, currentDepth, tokenEst, parentExecutionId, blockReason));
      opts.onError(
        `[ExpansionGuard] GUARD_MAX_DEPTH — "${engineId}" blocked: ` +
        `call depth ${currentDepth} reached limit ${L.maxDepth}. ` +
        `Reduce chained engine calls or increase maxDepth for this engine.`
      );
      return;
    }

    // ── Recursion check ──────────────────────────────────────────────────────
    const recursionCount = _recursionMap.get(engineId) ?? 0;
    if (!L.allowRecursion && recursionCount > 0) {
      const blockReason = `GUARD_MAX_RECURSION: "${engineId}" already active, allowRecursion=false`;
      _pushTrace({
        executionId, engineId, depth: currentDepth, startedAt: Date.now(),
        tokenEst, status: "blocked", blockReason,
      });
      _fireHook(hooks.onBlocked, _buildEvent(executionId, engineId, currentDepth, tokenEst, parentExecutionId, blockReason));
      opts.onError(
        `[ExpansionGuard] GUARD_MAX_RECURSION — "${engineId}" is already active in ` +
        `the call stack and recursion is disabled for this engine.`
      );
      return;
    }
    if (L.allowRecursion && recursionCount >= L.maxRecursion) {
      const blockReason = `GUARD_MAX_RECURSION: count=${recursionCount} ≥ maxRecursion=${L.maxRecursion}`;
      _pushTrace({
        executionId, engineId, depth: currentDepth, startedAt: Date.now(),
        tokenEst, status: "blocked", blockReason,
      });
      _fireHook(hooks.onBlocked, _buildEvent(executionId, engineId, currentDepth, tokenEst, parentExecutionId, blockReason));
      opts.onError(
        `[ExpansionGuard] GUARD_MAX_RECURSION — "${engineId}" has recursed ` +
        `${recursionCount} times, exceeding limit ${L.maxRecursion}.`
      );
      return;
    }

    // ── Token budget check ───────────────────────────────────────────────────
    if (tokenEst > L.maxTokens) {
      const blockReason = `GUARD_TOKEN_BUDGET: ~${tokenEst} tokens > limit=${L.maxTokens}`;
      _pushTrace({
        executionId, engineId, depth: currentDepth, startedAt: Date.now(),
        tokenEst, status: "blocked", blockReason,
      });
      _fireHook(hooks.onBlocked, _buildEvent(executionId, engineId, currentDepth, tokenEst, parentExecutionId, blockReason));
      opts.onError(
        `[ExpansionGuard] GUARD_TOKEN_BUDGET — "${engineId}" input estimated ~${tokenEst} ` +
        `tokens exceeds limit ${L.maxTokens}. Reduce topic or context length.`
      );
      return;
    }

    // ── All checks passed — register execution ───────────────────────────────
    const entry: TraceEntry = {
      executionId, engineId, depth: currentDepth, startedAt: Date.now(),
      tokenEst, status: "running",
    };
    _pushTrace(entry);

    _depth++;
    _recursionMap.set(engineId, recursionCount + 1);
    _executionStack.push(executionId);

    // ── Build __guard context — injected into safeOpts ───────────────────────
    const guardCtx: GuardContext = {
      executionId,
      depth:        currentDepth,
      trace:        _trace.slice(0, 10).map(t => ({
        engineId:  t.engineId,
        depth:     t.depth,
        status:    t.status,
        startedAt: t.startedAt,
      })),
      tokenUsage:   tokenEst,
      parentExecutionId,
    };

    // ── Fire onStart hook ────────────────────────────────────────────────────
    _fireHook(hooks.onStart, _buildEvent(executionId, engineId, currentDepth, tokenEst, parentExecutionId));

    // ── Build safeOpts — patched callbacks + injected __guard ────────────────
    const safeOpts: ExecutorRunOpts = {
      ...opts,
      __guard: guardCtx,
      onDone: () => {
        _release(engineId, entry);
        _fireHook(hooks.onSuccess, _buildEvent(executionId, engineId, currentDepth, tokenEst, parentExecutionId));
        opts.onDone();
      },
      onError: (err: string) => {
        _release(engineId, entry);
        _fireHook(hooks.onError, _buildEvent(executionId, engineId, currentDepth, tokenEst, parentExecutionId));
        opts.onError(err);
      },
    };

    try {
      executorLogic(safeOpts);
    } catch (err) {
      _release(engineId, entry);
      _fireHook(hooks.onError, _buildEvent(executionId, engineId, currentDepth, tokenEst, parentExecutionId));
      opts.onError(`[ExpansionGuard] Uncaught executor error in "${engineId}": ${String(err)}`);
    }
  },

  /** getTrace — Snapshot of the rolling execution log (newest first, max 50). */
  getTrace(): TraceEntry[] {
    return _trace.slice();
  },

  /** getDepth — Current live call depth. */
  getDepth(): number {
    return _depth;
  },

  /** subscribe — Register a listener for trace updates. Returns unsubscribe fn. */
  subscribe(fn: TraceListener): () => void {
    _listeners.add(fn);
    fn(_trace.slice());
    return () => _listeners.delete(fn);
  },

  /** reset — Clears all session guard state. Call on logout or hard reset. */
  reset(): void {
    _depth = 0;
    _recursionMap.clear();
    _executionStack.length = 0;
    _trace.length = 0;
    _emit();
  },
};
