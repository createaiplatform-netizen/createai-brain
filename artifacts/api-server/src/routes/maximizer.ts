/**
 * maximizer.ts — Full Auto Wealth Maximizer Routes
 * Spec: FULL-AUTO-WEALTH-MAXIMIZER
 *
 * GET  /api/maximizer/stats   — cumulative enforcement statistics
 * POST /api/maximizer/enforce — trigger one enforcement cycle on demand
 */

import { Router }           from "express";
import { getMaximizerStats } from "../services/wealthMaximizer.js";
import { getWealthSnapshot } from "../services/wealthMultiplier.js";
import { runFullAudit }      from "../services/platformAudit.js";
import { globalTranscend }   from "../services/realMarket.js";

const router = Router();

// GET /api/maximizer/stats
router.get("/stats", (_req, res) => {
  res.json(getMaximizerStats());
});

// POST /api/maximizer/enforce
// Runs one on-demand enforcement cycle and returns the results.
router.post("/enforce", async (_req, res) => {
  try {
    const wealthStats = getWealthSnapshot();

    await globalTranscend({ categories: [], batchSize: wealthStats.products });
    const audit = await runFullAudit();

    res.json({
      transcendFired: true,
      audit,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
