/**
 * routes/modes.ts — Platform Mode Spectrum API
 *
 * GET /api/modes          — full mode registry (all 25 modes)
 * GET /api/modes/stats    — summary stats by layer
 * GET /api/modes/layer/:layer — modes for a specific layer
 * GET /api/modes/active   — only active modes
 */

import { Router, type Request, type Response } from "express";
import {
  getAllModes,
  getModesByLayer,
  getActiveModes,
  getModeStats,
  type ModeLayer,
} from "../services/modeRegistry.js";

const router = Router();

const VALID_LAYERS: ModeLayer[] = ["BASE", "PLATFORM", "TRANSCENDENT", "INFINITE", "BEYOND"];

router.get("/", (_req: Request, res: Response) => {
  res.json({
    ok:    true,
    modes: getAllModes(),
    stats: getModeStats(),
  });
});

router.get("/stats", (_req: Request, res: Response) => {
  res.json({ ok: true, ...getModeStats() });
});

router.get("/active", (_req: Request, res: Response) => {
  const modes = getActiveModes();
  res.json({ ok: true, modes, count: modes.length });
});

router.get("/layer/:layer", (req: Request, res: Response) => {
  const layer = (req.params["layer"] ?? "").toUpperCase() as ModeLayer;
  if (!VALID_LAYERS.includes(layer)) {
    res.status(400).json({ ok: false, error: `Unknown layer. Valid: ${VALID_LAYERS.join(", ")}` });
    return;
  }
  const modes = getModesByLayer(layer);
  res.json({ ok: true, layer, modes, count: modes.length });
});

export default router;
