/**
 * wealth.ts — Wealth Multiplier Routes
 * Spec: WEALTH-MULTIPLIER-ADD-ON
 *
 * GET /api/wealth/snapshot — current wealth snapshot in JSON
 */

import { Router }          from "express";
import { getWealthSnapshot } from "../services/wealthMultiplier.js";

const router = Router();

// GET /api/wealth/snapshot
router.get("/snapshot", (_req, res) => {
  const snap = getWealthSnapshot();
  res.json({
    totalRevenue:       `$${(snap.totalRevenueCents     / 100).toFixed(2)}`,
    projectedRevenue:   `$${(snap.projectedRevenueCents / 100).toFixed(2)}`,
    growthPercent:      `${snap.growthPercent}%`,
    batches:            snap.batches,
    products:           snap.products,
    marketplaces:       snap.marketplaces,
    paymentsQueued:     snap.paymentsQueued,
    messagesSent:       snap.messagesSent,
    messagesQueued:     snap.messagesQueued,
    cycleTs:            snap.cycleTs,
    raw: {
      totalRevenueCents:     snap.totalRevenueCents,
      projectedRevenueCents: snap.projectedRevenueCents,
    },
  });
});

export default router;
