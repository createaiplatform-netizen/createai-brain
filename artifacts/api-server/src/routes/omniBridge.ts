/**
 * omniBridge.ts — Omni-Bridge Routes
 *
 * GET /api/omni-bridge              — full unified snapshot of all 7 dimensions
 * GET /api/omni-bridge/health       — lightweight health ping
 * GET /api/omni-bridge/dimension/:id — single dimension detail
 *
 * Public — read-only registry data, no auth required.
 */

import { Router }               from "express";
import { getOmniBridgeSnapshot } from "../services/omniBridge.js";
import type { DimensionId }      from "../services/omniBridge.js";

const router = Router();

const DIMENSION_IDS: DimensionId[] = [
  "head", "body", "soul", "brain", "universe", "inside", "outside",
];

// ── GET /api/omni-bridge ───────────────────────────────────────────────────────

router.get("/", (_req, res) => {
  try {
    const snapshot = getOmniBridgeSnapshot();
    res.json(snapshot);
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── GET /api/omni-bridge/health ────────────────────────────────────────────────

router.get("/health", (_req, res) => {
  try {
    const { ok, healthScore, liveMode, activeSystems, totalSystems, summary } =
      getOmniBridgeSnapshot();
    res.json({ ok, healthScore, liveMode, activeSystems, totalSystems, summary });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── GET /api/omni-bridge/dimension/:id ────────────────────────────────────────

router.get("/dimension/:id", (req, res) => {
  const { id } = req.params;

  if (!DIMENSION_IDS.includes(id as DimensionId)) {
    res.status(404).json({ ok: false, error: `Dimension '${id}' not found` });
    return;
  }

  try {
    const snapshot  = getOmniBridgeSnapshot();
    const dimension = snapshot.dimensions.find(d => d.id === id);
    res.json({ ok: true, liveMode: snapshot.liveMode, dimension });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
