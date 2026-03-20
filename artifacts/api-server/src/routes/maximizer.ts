/**
 * maximizer.ts — Full Auto Wealth Maximizer Routes
 * Spec: FULL-AUTO-WEALTH-MAXIMIZER
 *
 * GET  /api/maximizer/stats  — cumulative enforcement statistics
 * POST /api/maximizer/enforce — trigger one enforcement cycle on demand
 */

import { Router }                                  from "express";
import { getMaximizerStats }                       from "../services/wealthMaximizer.js";
import { getWealthSnapshot, applyGrowthMultiplier } from "../services/wealthMultiplier.js";
import { runFullAudit }                            from "../services/platformAudit.js";
import { globalTranscend }                         from "../services/realMarket.js";

const router = Router();

// GET /api/maximizer/stats
router.get("/stats", (_req, res) => {
  res.json(getMaximizerStats());
});

// POST /api/maximizer/enforce
// Runs one on-demand enforcement cycle and returns the results.
router.post("/enforce", async (_req, res) => {
  try {
    const wealthStats   = getWealthSnapshot();
    const growthPercent = wealthStats.growthPercent;
    let boostApplied    = 0;

    if (growthPercent < 100) {
      boostApplied = +(100 - growthPercent).toFixed(4);
      applyGrowthMultiplier(boostApplied);
    }

    await globalTranscend({ categories: [], batchSize: wealthStats.products });
    const audit = await runFullAudit();

    res.json({
      previousGrowthPct: growthPercent,
      boostApplied,
      finalGrowthPct:    parseFloat(audit.growthPercent),
      transcendFired:    true,
      audit,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
