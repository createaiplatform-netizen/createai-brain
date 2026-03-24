import { useState, useCallback } from "react";

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

// ── Types ─────────────────────────────────────────────────────────────────────

export type StepSource = "template" | "cache" | "deterministic" | "ai";

export interface StepResult {
  stepIndex:    number;
  description:  string;
  capability:   string;
  engineUsed:   string;
  success:      boolean;
  output:       string;
  source:       StepSource;
  durationMs:   number;
  retried:      boolean;
  fallbackUsed: boolean;
}

export interface PlanStep {
  stepIndex:   number;
  description: string;
  capability:  string;
  canParallel: boolean;
  required:    boolean;
}

export interface ExecutionPlan {
  planId:     string;
  totalSteps: number;
  source:     "deterministic" | "ai-assisted";
  steps:      PlanStep[];
}

export interface OutcomeResponse {
  outcomeId:   string;
  goal:        string;
  success:     boolean;
  summary:     string;
  totalMs:     number;
  aiCallCount: number;
  tokensSaved: number;
  enginesUsed: string[];
  plan:        ExecutionPlan;
  results:     StepResult[];
}

export type AESStatus = "idle" | "loading" | "success" | "error";

interface AESState {
  status:  AESStatus;
  result:  OutcomeResponse | null;
  error:   string | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAutonomousExecution() {
  const [state, setState] = useState<AESState>({
    status: "idle",
    result: null,
    error:  null,
  });

  const execute = useCallback(async (
    goal: string,
    context: Record<string, string> = {},
  ): Promise<void> => {
    setState({ status: "loading", result: null, error: null });

    try {
      const res = await fetch(`${BASE}/api/outcome/execute`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ goal: goal.trim(), context }),
      });

      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const json = await res.json();
          if (json?.error) msg = json.error;
        } catch (_) {}
        setState({ status: "error", result: null, error: msg });
        return;
      }

      const data: OutcomeResponse = await res.json();
      setState({ status: "success", result: data, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setState({ status: "error", result: null, error: msg });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", result: null, error: null });
  }, []);

  return { ...state, execute, reset };
}
