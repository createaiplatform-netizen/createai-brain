/**
 * payout.ts — Huntington ACH Payout Routes
 * Spec: pushFundsToHuntington
 *
 * GET  /api/payout/stats   — current payout cycle stats
 * POST /api/payout/trigger — trigger an immediate payout attempt
 */

import { Router }               from "express";
import { getPayoutStats, pushFundsToHuntington } from "../services/payoutService.js";

const router = Router();

// GET /api/payout/stats
router.get("/stats", (_req, res) => {
  res.json(getPayoutStats());
});

// POST /api/payout/trigger — manual on-demand payout push
router.post("/trigger", async (_req, res) => {
  try {
    await pushFundsToHuntington();
    res.json({ triggered: true, stats: getPayoutStats() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
