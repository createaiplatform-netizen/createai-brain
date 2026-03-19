// ═══════════════════════════════════════════════════════════════════════════
// EXECUTOR SHARED — Types, interface, and dispatch utility shared by all
// domain executors. Extracted from PlatformController to eliminate duplication
// between the module-level streamEngine() and the class runEngine() method.
//
// RULE: No executor implements its own SSE reader. All domain executors call
// dispatchEngineStream(), which delegates to the canonical _runEngine /
// _runMetaAgent SSE readers in CapabilityEngine.ts.
// ═══════════════════════════════════════════════════════════════════════════

import {
  runEngine    as _runEngine,
  runMetaAgent as _runMetaAgent,
  getEngine,
  type EngineCategory,
} from "@/engine/CapabilityEngine";

// ─── Executor contract ───────────────────────────────────────────────────────

export interface ExecutorRunOpts {
  engineId: string;
  topic:    string;
  context?: string;
  mode?:    string;
  signal?:  AbortSignal;
  onChunk:  (text: string) => void;
  onDone:   () => void;
  onError:  (err: string) => void;
}

export interface DomainExecutor {
  readonly domain: string;
  canHandle(engineId: string, category: EngineCategory): boolean;
  execute(opts: ExecutorRunOpts): void;
}

// ─── Engine / meta-agent dispatch ────────────────────────────────────────────
// The single canonical point where executor calls reach the AI layer.
// Selects _runEngine or _runMetaAgent based on engine category.

export function dispatchEngineStream(opts: ExecutorRunOpts): void {
  const engine     = getEngine(opts.engineId);
  const engineName = engine?.name ?? opts.engineId;

  if (engine?.category === "meta-agent") {
    _runMetaAgent({
      agentId: opts.engineId,
      task:    opts.topic,
      context: opts.context || undefined,
      onChunk: opts.onChunk,
      onDone:  opts.onDone,
      onError: opts.onError,
    });
  } else {
    _runEngine({
      engineId:   opts.engineId,
      engineName,
      topic:      opts.topic,
      context:    opts.context || undefined,
      mode:       opts.mode,
      signal:     opts.signal,
      onChunk:    opts.onChunk,
      onDone:     opts.onDone,
      onError:    opts.onError,
    });
  }
}
