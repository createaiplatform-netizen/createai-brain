// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM CONTEXT STORE — Shared intelligence layer.
//
// This is the memory and learning substrate of the entire platform.
// Every engine run writes here; every subsequent engine run reads from here.
// This enables cross-app intelligence, context sharing, and safe rollback.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OutputRecord {
  engineId:   string;
  engineName: string;
  topic:      string;
  text:       string;
  ts:         number;
}

export interface SessionContext {
  projectId?:  string;
  projectName?: string;
  industry?:   string;
  tone?:       string;
  domain?:     string;
  keywords:    string[];
}

export interface InsightRecord {
  key:    string;
  value:  string;
  source: string;
  ts:     number;
}

export interface ContextStoreState {
  recentOutputs:  Record<string, OutputRecord[]>;
  rollbackStacks: Record<string, OutputRecord[]>;
  sessionCtx:     SessionContext;
  insights:       InsightRecord[];
  totalRuns:      number;
  enginesUsed:    string[];
}

type Listener = () => void;

// ─── Singleton store class ────────────────────────────────────────────────────

class PlatformContextStore {
  private state: ContextStoreState = {
    recentOutputs:  {},
    rollbackStacks: {},
    sessionCtx:     { keywords: [] },
    insights:       [],
    totalRuns:      0,
    enginesUsed:    [],
  };

  private listeners = new Set<Listener>();

  private notify() {
    this.listeners.forEach(l => l());
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  getState(): ContextStoreState {
    return this.state;
  }

  // ── Record a completed engine output ────────────────────────────────────────

  recordOutput(engineId: string, engineName: string, topic: string, text: string): void {
    if (!text.trim() || text.length < 20) return;

    const record: OutputRecord = { engineId, engineName, topic, text, ts: Date.now() };
    const prev = this.state.recentOutputs[engineId] ?? [];

    // Push the current most-recent to the rollback stack before overwriting
    if (prev.length > 0) {
      const stack = this.state.rollbackStacks[engineId] ?? [];
      this.state.rollbackStacks[engineId] = [...stack, prev[0]].slice(-8);
    }

    this.state.recentOutputs[engineId] = [record, ...prev].slice(0, 5);
    this.state.totalRuns = this.state.totalRuns + 1;

    if (!this.state.enginesUsed.includes(engineId)) {
      this.state.enginesUsed = [...this.state.enginesUsed, engineId];
    }

    // Auto-extract keywords from topic for session-level learning
    const words = topic
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 4 && !STOP_WORDS.has(w));

    const merged = [...new Set([...this.state.sessionCtx.keywords, ...words.slice(0, 5)])].slice(-30);
    this.state.sessionCtx = { ...this.state.sessionCtx, keywords: merged };

    this.notify();
  }

  // ── Build context string to inject into next engine run ─────────────────────

  buildContextFor(engineId: string): string {
    const { recentOutputs, sessionCtx, insights } = this.state;
    const parts: string[] = [];

    // Session-level context
    const ctxLines: string[] = [];
    if (sessionCtx.industry) ctxLines.push(`Industry: ${sessionCtx.industry}`);
    if (sessionCtx.tone)     ctxLines.push(`Tone: ${sessionCtx.tone}`);
    if (sessionCtx.domain)   ctxLines.push(`Domain: ${sessionCtx.domain}`);
    if (sessionCtx.projectName) ctxLines.push(`Active project: ${sessionCtx.projectName}`);
    if (sessionCtx.keywords.length > 0) ctxLines.push(`Session themes: ${sessionCtx.keywords.slice(-10).join(", ")}`);
    if (ctxLines.length > 0) parts.push(`[Session context]\n${ctxLines.join(" | ")}`);

    // Recent platform insights
    if (insights.length > 0) {
      const recent = insights.slice(-3).map(i => `${i.key}: ${i.value}`).join(" | ");
      parts.push(`[Platform insights] ${recent}`);
    }

    // Cross-engine recent outputs (related engines, not self)
    const crossEngineContext = Object.entries(recentOutputs)
      .filter(([id]) => id !== engineId)
      .sort(([, a], [, b]) => (b[0]?.ts ?? 0) - (a[0]?.ts ?? 0))
      .slice(0, 2)
      .map(([, records]) => {
        const r = records[0];
        if (!r) return null;
        const preview = r.text.slice(0, 250).replace(/\n+/g, " ").trim();
        return `[Prior output — ${r.engineName} on "${r.topic.slice(0, 60)}"]: ${preview}…`;
      })
      .filter(Boolean) as string[];

    if (crossEngineContext.length > 0) {
      parts.push(crossEngineContext.join("\n"));
    }

    return parts.join("\n\n");
  }

  // ── Rollback: restore previous output for an engine ─────────────────────────

  rollback(engineId: string): OutputRecord | null {
    const stack = this.state.rollbackStacks[engineId] ?? [];
    if (stack.length === 0) return null;

    const prev = stack[stack.length - 1];
    this.state.rollbackStacks[engineId] = stack.slice(0, -1);

    // Restore it as the leading recent output
    const current = this.state.recentOutputs[engineId] ?? [];
    this.state.recentOutputs[engineId] = [prev, ...current].slice(0, 5);

    this.notify();
    return prev;
  }

  canRollback(engineId: string): boolean {
    return (this.state.rollbackStacks[engineId]?.length ?? 0) > 0;
  }

  // ── Session context ──────────────────────────────────────────────────────────

  setSessionContext(ctx: Partial<SessionContext>): void {
    this.state.sessionCtx = { ...this.state.sessionCtx, ...ctx };
    this.notify();
  }

  // ── Manual insight recording ─────────────────────────────────────────────────

  addInsight(key: string, value: string, source: string): void {
    const idx = this.state.insights.findIndex(i => i.key === key);
    if (idx >= 0) {
      this.state.insights[idx] = { key, value, source, ts: Date.now() };
    } else {
      this.state.insights = [...this.state.insights, { key, value, source, ts: Date.now() }].slice(-50);
    }
    this.notify();
  }

  getRecentFor(engineId: string, limit = 3): OutputRecord[] {
    return (this.state.recentOutputs[engineId] ?? []).slice(0, limit);
  }

  clear(): void {
    this.state = {
      recentOutputs:  {},
      rollbackStacks: {},
      sessionCtx:     { keywords: [] },
      insights:       [],
      totalRuns:      0,
      enginesUsed:    [],
    };
    this.notify();
  }
}

// ─── Common English stop-words to exclude from keyword learning ───────────────

const STOP_WORDS = new Set([
  "about", "above", "after", "again", "along", "already", "also", "although",
  "always", "another", "based", "before", "being", "between", "build", "built",
  "could", "doing", "during", "every", "first", "focus", "following", "found",
  "generate", "given", "having", "include", "including", "information", "into",
  "itself", "large", "later", "learn", "level", "light", "likely", "little",
  "local", "lower", "major", "makes", "making", "might", "model", "module",
  "needs", "never", "noted", "other", "output", "overall", "place", "platform",
  "provide", "range", "reach", "right", "scope", "share", "should", "since",
  "small", "start", "state", "still", "such", "system", "tasks", "their",
  "there", "these", "think", "those", "through", "under", "using", "value",
  "various", "where", "which", "while", "would", "write", "years",
]);

// ─── Global singleton ─────────────────────────────────────────────────────────

export const contextStore = new PlatformContextStore();

// ─── React hook ───────────────────────────────────────────────────────────────

export function useContextStore(): PlatformContextStore {
  const [, rerender] = useState(0);
  useEffect(() => contextStore.subscribe(() => rerender(n => n + 1)), []);
  return contextStore;
}

// ─── Convenience re-exports ───────────────────────────────────────────────────

export type { PlatformContextStore };
