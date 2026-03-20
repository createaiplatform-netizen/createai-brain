/**
 * routes/aboveTranscend.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * REST surface for the Above-Transcend Engine.
 *
 * GET  /api/above-transcend/status       — latest cycle summary
 * GET  /api/above-transcend/latest       — full latest cycle (all 6 phases)
 * GET  /api/above-transcend/next-moves   — phase 5 top-5 next moves
 * GET  /api/above-transcend/history      — last N cycles (lightweight)
 * POST /api/above-transcend/run          — trigger a cycle immediately
 */

import { Router, type Request, type Response } from "express";
import {
  getLatestCycle,
  getCycleHistory,
  getCycleCount,
  getNextMoves,
  runCycleNow,
} from "../services/aboveTranscend/engine.js";

const router = Router();

router.get("/status", (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const cycle   = getLatestCycle();
  const count   = getCycleCount();

  if (!cycle) {
    res.json({ ok: true, ready: false, cycleCount: count, message: "First cycle in progress…" });
    return;
  }

  res.json({
    ok:              true,
    ready:           true,
    cycleCount:      count,
    lastRunAt:       cycle.completedAt,
    durationMs:      cycle.durationMs,
    summary:         cycle.summary,
    topNextMove:     cycle.phase5[0] ?? null,
  });
});

router.get("/latest", (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const cycle = getLatestCycle();
  if (!cycle) {
    res.json({ ok: true, ready: false, message: "First cycle still running…" });
    return;
  }
  res.json({ ok: true, cycle });
});

router.get("/next-moves", (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.json({ ok: true, moves: getNextMoves(), cycleCount: getCycleCount() });
});

router.get("/history", (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const full = getCycleHistory();
  const lightweight = full.map(c => ({
    cycleId:     c.cycleId,
    cycleNumber: c.cycleNumber,
    startedAt:   c.startedAt,
    completedAt: c.completedAt,
    durationMs:  c.durationMs,
    summary:     c.summary,
    topMove:     c.phase5[0]?.title ?? null,
  }));

  res.json({ ok: true, cycles: lightweight, total: full.length });
});

router.post("/run", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const cycle = await runCycleNow();
    res.json({ ok: true, message: "Cycle complete", cycleNumber: cycle.cycleNumber, summary: cycle.summary });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
