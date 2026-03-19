// ═══════════════════════════════════════════════════════════════════════════
// useOrchestrationStream — Phase 8: Streaming orchestration React hook.
//
// Consumes POST /api/ai/orchestrate/stream via fetch + ReadableStream.
// (EventSource only supports GET; the orchestrator needs a JSON body.)
//
// Supports both execution modes:
//   flat:  run({ actions: ["project", "staffing"], params: { project: {...} } })
//   graph: runGraph({ nodeA: { action: "project", params: {...} },
//                     nodeB: { action: "project", deps: ["nodeA"], params: {...} } })
//
// Usage:
//   const { run, events, running, reset } = useOrchestrationStream();
//   await run({ actions: ["project"], params: { project: { projectName: "X" } } });
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";

// ─── Event shapes (mirror server SSE payloads) ────────────────────────────────

export interface OrchestrateStartEvent {
  type:    "start";
  node:    string;
  action:  string;
  level?:  number;
}

export interface OrchestrateDoneEvent {
  type:       "done";
  node:       string;
  action:     string;
  status:     "completed" | "failed";
  durationMs: number;
  result?:    unknown;
  error?:     string;
}

export interface OrchestrateCompleteEvent {
  type:           "complete";
  totalDurationMs: number;
  nodeCount:      number;
}

export interface OrchestrateErrorEvent {
  type:    "error";
  message: string;
}

export type OrchestrateEvent =
  | OrchestrateStartEvent
  | OrchestrateDoneEvent
  | OrchestrateCompleteEvent
  | OrchestrateErrorEvent;

// ─── Graph node type (mirrors server GraphNode) ───────────────────────────────

export interface GraphNode {
  action:  string;
  deps?:   string[];
  params?: Record<string, unknown>;
}

export type OrchestrateGraph = Record<string, GraphNode>;

// ─── Run options ──────────────────────────────────────────────────────────────

export interface FlatRunOptions {
  actions: string[];
  params?: Record<string, Record<string, unknown>>;
}

export interface GraphRunOptions {
  graph: OrchestrateGraph;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseOrchestrationStreamReturn {
  /** Start a flat sequential orchestration */
  run:      (opts: FlatRunOptions) => Promise<void>;
  /** Start a DAG graph orchestration */
  runGraph: (opts: GraphRunOptions) => Promise<void>;
  /** Ordered list of all events received so far */
  events:   OrchestrateEvent[];
  /** True while the stream is open */
  running:  boolean;
  /** Error message if the fetch itself failed (not an action failure) */
  fetchError: string | null;
  /** Clear events and error state */
  reset:    () => void;
}

export function useOrchestrationStream(): UseOrchestrationStreamReturn {
  const [events,     setEvents]     = useState<OrchestrateEvent[]>([]);
  const [running,    setRunning]    = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setEvents([]);
    setFetchError(null);
  }, []);

  const _stream = useCallback(async (body: Record<string, unknown>): Promise<void> => {
    setRunning(true);
    setEvents([]);
    setFetchError(null);

    try {
      const res = await fetch("/api/ai/orchestrate/stream", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => `HTTP ${res.status}`);
        setFetchError(msg);
        return;
      }

      if (!res.body) {
        setFetchError("No response body from server");
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by double newlines
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.startsWith("data: ") ? frame.slice(6).trim() : frame.trim();
          if (!line || line === "[DONE]") continue;

          try {
            const event = JSON.parse(line) as OrchestrateEvent;
            setEvents(prev => [...prev, event]);
          } catch {
            // Malformed frame — skip silently
          }
        }
      }
    } catch (err) {
      setFetchError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }, []);

  const run = useCallback(
    (opts: FlatRunOptions) => _stream({ actions: opts.actions, params: opts.params }),
    [_stream],
  );

  const runGraph = useCallback(
    (opts: GraphRunOptions) => _stream({ graph: opts.graph }),
    [_stream],
  );

  return { run, runGraph, events, running, fetchError, reset };
}
