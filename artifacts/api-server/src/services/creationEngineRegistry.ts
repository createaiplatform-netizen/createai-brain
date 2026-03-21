/**
 * creationEngineRegistry.ts — Unified Creation Engine Registry
 *
 * Surfaces the 8 core creation engines (all BASE-layer modes) as a single
 * queryable group with live-mode status attached.
 *
 * Rules:
 *  - No engine logic is modified here — this is purely additive.
 *  - Live-mode flag is derived from REPLIT_DEPLOYMENT env var (same
 *    source that stripeClient.ts uses for the production environment).
 *  - "Available" means the mode is registered and active in modeRegistry.
 */

import { getAllModes, type PlatformMode } from "./modeRegistry.js";

// ── The canonical set of 8 creation engine IDs (BASE layer) ──────────────────

export const CREATION_ENGINE_IDS = [
  "guided",
  "free",
  "hybrid",
  "app",
  "website",
  "tool",
  "end-to-end",
  "platform-inside-platform",
] as const;

export type CreationEngineId = typeof CREATION_ENGINE_IDS[number];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreationEngineStatus {
  id:          CreationEngineId;
  name:        string;
  symbol:      string;
  description: string;
  active:      boolean;
  activatedAt: string;
  liveMode:    boolean;
}

export interface CreationEngineRegistryResult {
  ok:         boolean;
  liveMode:   boolean;
  totalCount: number;
  activeCount: number;
  engines:    CreationEngineStatus[];
  checkedAt:  string;
}

// ── Core function ─────────────────────────────────────────────────────────────

/**
 * Returns the current status of all 8 creation engines.
 * Reads from modeRegistry — no external calls, no side effects.
 */
export function getCreationEngineStatus(): CreationEngineRegistryResult {
  const isLive    = process.env.REPLIT_DEPLOYMENT === "1";
  const allModes  = getAllModes();
  const modeMap   = new Map<string, PlatformMode>(allModes.map(m => [m.id, m]));

  const engines: CreationEngineStatus[] = CREATION_ENGINE_IDS.map(id => {
    const mode = modeMap.get(id);
    return {
      id,
      name:        mode?.name        ?? id,
      symbol:      mode?.symbol      ?? "⚙️",
      description: mode?.description ?? "",
      active:      mode?.active      ?? false,
      activatedAt: mode?.activatedAt ?? new Date().toISOString(),
      liveMode:    isLive,
    };
  });

  const activeCount = engines.filter(e => e.active).length;

  return {
    ok:          activeCount === engines.length,
    liveMode:    isLive,
    totalCount:  engines.length,
    activeCount,
    engines,
    checkedAt:   new Date().toISOString(),
  };
}
