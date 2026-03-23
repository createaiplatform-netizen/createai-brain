// ═══════════════════════════════════════════════════════════════════════════
// useVaultInsights — real-time analytics computed from OutputVaultService.
// Zero network calls. Returns memoized stats, updates on vault changes.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from "react";
import { vaultGetAll, type VaultEntry } from "@/services/OutputVaultService";

export interface VaultInsights {
  total:           number;
  pinned:          number;
  totalWords:      number;
  uniqueEngines:   number;
  todayCount:      number;
  weekCount:       number;
  topEngine:       { id: string; name: string; count: number } | null;
  peakHour:        number | null;   // 0-23
  avgWordsPerEntry: number;
  recentEntries:   VaultEntry[];    // last 5
  velocity:        number;          // outputs per day over past 7 days
  trend:           "up" | "flat" | "down";
}

const DAY_MS  = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

function compute(entries: VaultEntry[]): VaultInsights {
  const now   = Date.now();
  const today = entries.filter(e => now - e.createdAt < DAY_MS);
  const week  = entries.filter(e => now - e.createdAt < WEEK_MS);

  // Engine frequency map
  const engineMap = new Map<string, { name: string; count: number }>();
  for (const e of entries) {
    const cur = engineMap.get(e.engineId);
    if (cur) cur.count++;
    else engineMap.set(e.engineId, { name: e.engineName, count: 1 });
  }
  let topEngine: VaultInsights["topEngine"] = null;
  let topCount = 0;
  for (const [id, val] of engineMap) {
    if (val.count > topCount) { topCount = val.count; topEngine = { id, name: val.name, count: val.count }; }
  }

  // Peak hour (0-23) based on all entries
  const hourBuckets = new Array<number>(24).fill(0);
  for (const e of entries) {
    const h = new Date(e.createdAt).getHours();
    hourBuckets[h]++;
  }
  const maxHourVal = Math.max(...hourBuckets);
  const peakHour   = maxHourVal > 0 ? hourBuckets.indexOf(maxHourVal) : null;

  // Velocity: avg outputs/day over past 7 days (avoid division by zero)
  const velocity = week.length / 7;

  // Trend: compare this week to prior week
  const prevWeek = entries.filter(e => now - e.createdAt >= WEEK_MS && now - e.createdAt < 2 * WEEK_MS);
  const trend: VaultInsights["trend"] =
    week.length > prevWeek.length + 2 ? "up"
    : week.length < prevWeek.length - 2 ? "down"
    : "flat";

  const totalWords = entries.reduce((s, e) => s + e.wordCount, 0);

  return {
    total:           entries.length,
    pinned:          entries.filter(e => e.pinned).length,
    totalWords,
    uniqueEngines:   engineMap.size,
    todayCount:      today.length,
    weekCount:       week.length,
    topEngine,
    peakHour,
    avgWordsPerEntry: entries.length > 0 ? Math.round(totalWords / entries.length) : 0,
    recentEntries:   entries.slice(0, 5),
    velocity:        Math.round(velocity * 10) / 10,
    trend,
  };
}

const EMPTY: VaultInsights = {
  total: 0, pinned: 0, totalWords: 0, uniqueEngines: 0,
  todayCount: 0, weekCount: 0, topEngine: null, peakHour: null,
  avgWordsPerEntry: 0, recentEntries: [], velocity: 0, trend: "flat",
};

export function useVaultInsights(): VaultInsights {
  const [entries, setEntries] = useState<VaultEntry[]>(() => vaultGetAll());

  useEffect(() => {
    const sync = () => setEntries(vaultGetAll());
    window.addEventListener("cai:vault-changed", sync);
    // Also poll every 30s to pick up writes from other windows
    const timer = setInterval(sync, 30_000);
    return () => { window.removeEventListener("cai:vault-changed", sync); clearInterval(timer); };
  }, []);

  return useMemo(() => (entries.length === 0 ? EMPTY : compute(entries)), [entries]);
}
