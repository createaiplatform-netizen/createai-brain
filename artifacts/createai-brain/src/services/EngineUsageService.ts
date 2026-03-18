// ═══════════════════════════════════════════════════════════════════════════
// EngineUsageService — tracks run counts per engine in localStorage.
// Dispatches "cai:usage-changed" so any listener can re-render.
// ═══════════════════════════════════════════════════════════════════════════

const LS_KEY = "cai_engine_usage";

function readMap(): Record<string, number> {
  try {
    const r = localStorage.getItem(LS_KEY);
    return r ? (JSON.parse(r) as Record<string, number>) : {};
  } catch { return {}; }
}

function writeMap(m: Record<string, number>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(m)); } catch { /* quota */ }
  window.dispatchEvent(new CustomEvent("cai:usage-changed"));
}

/** Increment run count for an engine. */
export function usageIncrement(engineId: string): void {
  const m = readMap();
  m[engineId] = (m[engineId] ?? 0) + 1;
  writeMap(m);
}

/** Get run count for a specific engine. */
export function usageGet(engineId: string): number {
  return readMap()[engineId] ?? 0;
}

/** Get all usage data sorted by count descending. */
export function usageGetAll(): Array<{ id: string; count: number }> {
  const m = readMap();
  return Object.entries(m)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}

/** Get top N most-run engines. */
export function usageGetTop(n: number): Array<{ id: string; count: number }> {
  return usageGetAll().slice(0, n);
}

/** Total runs across all engines. */
export function usageTotalRuns(): number {
  return Object.values(readMap()).reduce((a, b) => a + b, 0);
}

/** Clear all usage data. */
export function usageClear(): void {
  localStorage.removeItem(LS_KEY);
  window.dispatchEvent(new CustomEvent("cai:usage-changed"));
}
