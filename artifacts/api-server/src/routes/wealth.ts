/**
 * wealth.ts — Wealth Tracker Routes
 * Spec: WEALTH-MULTIPLIER-ADD-ON
 *
 * GET /api/wealth/snapshot — current real operational snapshot
 * All values are real data. No projections or simulated fields.
 */

import { Router }          from "express";
import { getWealthSnapshot } from "../services/wealthMultiplier.js";

const router = Router();

router.get("/snapshot", (_req, res) => {
  const snap = getWealthSnapshot();
  res.json({
    totalRevenue:   `$${(snap.totalRevenueCents / 100).toFixed(2)}`,
    batches:        snap.batches,
    products:       snap.products,
    marketplaces:   snap.marketplaces,
    paymentsQueued: snap.paymentsQueued,
    messagesSent:   snap.messagesSent,
    messagesQueued: snap.messagesQueued,
    cycleTs:        snap.cycleTs,
    raw: {
      totalRevenueCents: snap.totalRevenueCents,
    },
  });
});

export default router;
