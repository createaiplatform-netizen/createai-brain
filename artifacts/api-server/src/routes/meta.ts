/**
 * meta.ts — Meta-Transcendent Launch Routes
 * Spec: META-ZERO-TOUCH-TRANSCENDENT-LAUNCH
 *
 * GET  /api/meta/stats  — cumulative meta-cycle statistics
 * POST /api/meta/cycle  — trigger a single meta-cycle on demand
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

// POST /api/meta/cycle
// Triggers a single on-demand meta-cycle and returns the results.
router.post("/cycle", async (_req, res) => {
  try {
    const premiumBatch = await generatePremiumProducts({ batchSize: 25 });
    const campaign     = await autoAdCampaign(premiumBatch, { channels: "all", budgetScale: "maxROI" });
    const optimized    = await optimizeRevenue(premiumBatch);
    const categories   = [...new Set(premiumBatch.map(p => p.category))];
    await globalTranscend({ categories, batchSize: premiumBatch.length });

    res.json({
      products:       premiumBatch.length,
      reach:          campaign.reach,
      impressions:    campaign.impressions,
      avgPriceCents:  optimized.avgPriceCents,
      avgPrice:       `$${(optimized.avgPriceCents / 100).toFixed(2)}`,
      categories,
      transcendFired: true,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
