/**
 * ultraInteraction.ts — Ultra Global Zero-Limit Interaction Engine
 * Spec: ULTRA-GLOBAL-ZERO-LIMIT-PLATFORM-ENGINE
 *
 * POST /api/ultra/interaction
 *   Body: { type: string; userId?: string; target?: string }
 *   Applies micro-revenue, throttled meta cycle, max-growth enforcement,
 *   and returns full platform stats + projections.
 *
 * Throttling: meta cycle and transcend fire at most once per 60 s
 * regardless of how many interactions arrive, so heavy traffic never
 * floods the engine but every call still registers revenue.
 */

import { Router }            from "express";
import { applyGrowthMultiplier, getWealthSnapshot } from "../services/wealthMultiplier.js";
import { enforceMaxGrowth, getMaximizerStats }      from "../services/wealthMaximizer.js";
import { triggerMetaCycle, getMetaStats, getMetaProjections } from "../services/metaTranscend.js";
import { getMarketStats, globalTranscend }           from "../services/realMarket.js";
import { getHybridStats }                            from "../services/hybridEngine.js";
import { getAuditSnapshot }                          from "../services/platformAudit.js";

const router = Router();

// ─── Throttle state ───────────────────────────────────────────────────────────
let _lastMetaCycleTs = 0;
let _lastTranscendTs = 0;
const THROTTLE_MS = 60_000; // 1 min

// ─── POST /api/ultra/interaction ─────────────────────────────────────────────
router.post("/interaction", async (req, res) => {
  const { type = "unknown", userId, target } = req.body ?? {};

  try {
    // 1. Micro-revenue: $5–$15 per interaction, applied as growth multiplier
    const microRevenue = Math.max(5, Math.random() * 15);
    applyGrowthMultiplier(microRevenue);

    // 2. Energy credit (logged server-side, returned to client)
    const energyKwh = Math.random() * 0.2;

    const now = Date.now();

    // 3. Meta cycle — throttled to once per minute
    if (now - _lastMetaCycleTs >= THROTTLE_MS) {
      _lastMetaCycleTs = now;
      triggerMetaCycle().catch(() => {}); // fire-and-forget
    }

    // 4. Enforce 100%+ growth
    await enforceMaxGrowth();

    // 5. Global transcend — throttled to once per minute
    if (now - _lastTranscendTs >= THROTTLE_MS) {
      _lastTranscendTs = now;
      globalTranscend({
        batchSize: 1,
        event: { type, userId, target } as Record<string, unknown>,
      }).catch(() => {});
    }

    // 6. Collect full stats + projections
    const [market, hybrid, wealth, audit, meta, maximizer, projections] = await Promise.allSettled([
      getMarketStats(),
      getHybridStats(),
      getWealthSnapshot(),
      getAuditSnapshot(),
      getMetaStats(),
      getMaximizerStats(),
      getMetaProjections(),
    ]);

    const stats = {
      interactionType: type,
      userId:          userId ?? null,
      target:          target ?? null,
      microRevenue:    `$${microRevenue.toFixed(2)}`,
      energyCredit:    energyKwh.toFixed(4),
      market:          market.status    === "fulfilled" ? market.value    : null,
      hybrid:          hybrid.status    === "fulfilled" ? hybrid.value    : null,
      wealth:          wealth.status    === "fulfilled" ? wealth.value    : null,
      audit:           audit.status     === "fulfilled" ? audit.value     : null,
      meta:            meta.status      === "fulfilled" ? meta.value      : null,
      maximizer:       maximizer.status === "fulfilled" ? maximizer.value : null,
      projections:     projections.status === "fulfilled" ? projections.value : null,
    };

    console.log(
      `[UltraInteraction] ⚡ ${type} · +${microRevenue.toFixed(2)} revenue · ${energyKwh.toFixed(4)} kWh`
    );

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
