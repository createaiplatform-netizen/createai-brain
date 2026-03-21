/**
 * creationEngines.ts — Creation Engine Routes
 *
 * GET /api/engines/creation     — status of all 8 creation engines
 * GET /api/engines/creation/:id — single engine by ID
 *
 * Public (no auth required) — read-only registry data.
 */

import { Router } from "express";
import {
  getCreationEngineStatus,
  CREATION_ENGINE_IDS,
} from "../services/creationEngineRegistry.js";

const router = Router();

// ── GET /api/engines/creation ─────────────────────────────────────────────────

router.get("/", (_req, res) => {
  try {
    const result = getCreationEngineStatus();
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── GET /api/engines/creation/:id ─────────────────────────────────────────────

router.get("/:id", (req, res) => {
  const { id } = req.params;

  if (!CREATION_ENGINE_IDS.includes(id as typeof CREATION_ENGINE_IDS[number])) {
    res.status(404).json({ ok: false, error: `Engine '${id}' not found` });
    return;
  }

  try {
    const { engines, liveMode, checkedAt } = getCreationEngineStatus();
    const engine = engines.find(e => e.id === id);
    res.json({ ok: true, liveMode, engine, checkedAt });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
