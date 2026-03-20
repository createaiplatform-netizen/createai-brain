/**
 * ultimate.ts — Ultimate Zero-Touch Transcendent Launch Routes
 * Spec: ULTIMATE-ZERO-TOUCH-TRANSCENDENT-LAUNCH
 *
 * GET  /api/ultimate/stats  — cumulative cycle statistics
 * POST /api/ultimate/run    — trigger one cycle on demand
 */

import { Router }                              from "express";
import { getUltimateStats, runUltimateCycle }  from "../services/ultimateTranscend.js";

const router = Router();

// GET /api/ultimate/stats
router.get("/stats", (_req, res) => {
  res.json(getUltimateStats());
});

// POST /api/ultimate/run
router.post("/run", async (_req, res) => {
  try {
    await runUltimateCycle();
    res.json({ ok: true, stats: getUltimateStats() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
