// ═══════════════════════════════════════════════════════════════════════════
// engineSelector.ts
// Selects and ranks engines for a given capability + context.
// Factors: relevance, success rate (from feedbackStore), dependencies, domain.
// Supports fallback engines.
// ═══════════════════════════════════════════════════════════════════════════

import {
  type Capability,
  type EngineCapabilityProfile,
  getEnginesByCapability,
  ENGINE_REGISTRY,
} from "./capabilityRegistry";
import { getEngineSuccessRate } from "./feedbackStore";

export interface RankedEngine {
  engineId:    string;
  label:       string;
  score:       number;          // 0–1 composite score
  successRate: number;          // historical success rate
  relevance:   number;          // capability + context match 0–1
  isFallback:  boolean;
  requiresAI:  boolean;
}

export interface EngineSelection {
  primary:   RankedEngine[];
  fallbacks: RankedEngine[];
}

// ── Domain boost mapping ──────────────────────────────────────────────────

function domainBoost(engine: EngineCapabilityProfile, context: Record<string, unknown>): number {
  const ctxDomain = String(context.domain ?? "").toLowerCase();
  if (!ctxDomain) return 0;
  return engine.domain.toLowerCase() === ctxDomain ? 0.15 : 0;
}

// ── Context relevance scoring ─────────────────────────────────────────────

function contextRelevance(
  engine: EngineCapabilityProfile,
  capability: Capability,
  context: Record<string, unknown>,
): number {
  let score = 0;

  // Direct capability match
  if (engine.capabilities[0] === capability) score += 0.5;
  else if (engine.capabilities.includes(capability)) score += 0.3;

  // Input overlap
  const ctxKeys = Object.keys(context).map(k => k.toLowerCase());
  const inputMatches = engine.inputs.filter(inp =>
    ctxKeys.some(k => k.includes(inp) || inp.includes(k)),
  ).length;
  score += Math.min(0.3, inputMatches * 0.1);

  // Domain match boost
  score += domainBoost(engine, context);

  return Math.min(1, score);
}

// ── Main selector ─────────────────────────────────────────────────────────

export async function selectEngines(
  capability: Capability,
  context: Record<string, unknown>,
): Promise<EngineSelection> {
  const candidates = getEnginesByCapability(capability);

  const scored: RankedEngine[] = await Promise.all(
    candidates.map(async eng => {
      const successRate = await getEngineSuccessRate(eng.engineId);
      const relevance   = contextRelevance(eng, capability, context);
      // Weighted composite: 40% success rate, 40% relevance, 20% priority bias
      const priorityBias = 1 - (eng.priority - 1) * 0.1;
      const score = (successRate * 0.4) + (relevance * 0.4) + (priorityBias * 0.2);
      return {
        engineId:    eng.engineId,
        label:       eng.label,
        score,
        successRate,
        relevance,
        isFallback:  false,
        requiresAI:  eng.requiresAI,
      };
    }),
  );

  scored.sort((a, b) => b.score - a.score);

  const primary   = scored.slice(0, 2).map(e => ({ ...e, isFallback: false }));
  const fallbacks = scored.slice(2, 4).map(e => ({ ...e, isFallback: true }));

  // If no candidates found, add a generic fallback
  if (!primary.length) {
    const generic = ENGINE_REGISTRY.find(e => e.engineId === "strategy-engine");
    if (generic) {
      primary.push({
        engineId:    generic.engineId,
        label:       generic.label,
        score:       0.5,
        successRate: 1.0,
        relevance:   0.3,
        isFallback:  false,
        requiresAI:  true,
      });
    }
  }

  return { primary, fallbacks };
}

export async function selectPrimaryEngine(
  capability: Capability,
  context: Record<string, unknown>,
): Promise<RankedEngine | null> {
  const { primary } = await selectEngines(capability, context);
  return primary[0] ?? null;
}

export async function selectFallbackEngine(
  capability: Capability,
  context: Record<string, unknown>,
  excludeEngineIds: string[] = [],
): Promise<RankedEngine | null> {
  const { primary, fallbacks } = await selectEngines(capability, context);
  const all = [...primary, ...fallbacks].filter(
    e => !excludeEngineIds.includes(e.engineId),
  );
  return all[0] ?? null;
}
