/**
 * enforcer.ts — Full Platform 100% Enforcement Routes
 * Spec: FULL-PLATFORM-100-ENFORCEMENT
 *
 * GET  /api/enforcer/stats  — cumulative enforcement statistics
 * POST /api/enforcer/run    — trigger one enforcement cycle on demand
 */

import { Router }                                from "express";
import { getEnforcerStats, enforce100Percent }   from "../services/platform100Enforcer.js";

const router = Router();

// GET /api/enforcer/stats
router.get("/stats", (_req, res) => {
  res.json(getEnforcerStats());
});

// POST /api/enforcer/run
router.post("/run", async (_req, res) => {
  try {
    await enforce100Percent();
    res.json({ ok: true, stats: getEnforcerStats() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
