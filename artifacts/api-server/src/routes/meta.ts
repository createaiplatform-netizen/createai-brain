/**
 * meta.ts — Meta-Transcendent Launch Routes
 * Spec: META-ZERO-TOUCH-TRANSCENDENT-LAUNCH
 *
 * GET  /api/meta/stats  — cumulative real meta-cycle statistics
 * POST /api/meta/cycle  — trigger a single meta-cycle on demand
 *
 * No projections endpoint. No simulated financial estimates.
 */

import { Router }                                          from "express";
import { getMetaCycleStats }                               from "../services/metaTranscend.js";
import { generatePremiumProducts, autoAdCampaign, optimizeRevenue } from "../services/wealthTools.js";
import { globalTranscend }                                 from "../services/realMarket.js";

const router = Router();

// GET /api/meta/stats
router.get("/stats", (_req, res) => {
  res.json(getMetaCycleStats());
});

// POST /api/meta/cycle — on-demand meta-cycle trigger
router.post("/cycle", async (_req, res) => {
  try {
    const premiumBatch = await generatePremiumProducts({ batchSize: 25 });
    const categories   = [...new Set(premiumBatch.map(p => p.category))];
    await autoAdCampaign(premiumBatch, { channels: "all", budgetScale: "maxROI" });
    await optimizeRevenue(premiumBatch);
    await globalTranscend({ categories, batchSize: premiumBatch.length });

    res.json({
      products:       premiumBatch.length,
      categories,
      transcendFired: true,
    });
  } catch (err) {
    console.error("[meta] /cycle error:", (err as Error).message);
    res.status(500).json({ error: "Meta cycle failed." });
  }
});

export default router;
