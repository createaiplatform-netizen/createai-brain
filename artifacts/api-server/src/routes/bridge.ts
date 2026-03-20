/**
 * routes/bridge.ts — Universal Bridge Engine — HTTP API
 *
 * GET /api/bridge/status  — all connector statuses (ACTIVE / NOT_CONFIGURED)
 * GET /api/bridge/history — last N bridge actions (real, no fake data)
 * GET /api/bridge/last/:connector — last action for a specific connector
 */

import { Router } from "express";
import { bridge } from "../bridge/universalBridgeEngine.js";

const router = Router();

// ── GET /api/bridge/status ────────────────────────────────────────────────────

router.get("/status", (_req, res) => {
  const statuses = bridge.getConnectorStatus();
  res.json({
    ts:         new Date().toISOString(),
    connectors: statuses,
    summary: {
      active:         statuses.filter(c => c.status === "ACTIVE").length,
      not_configured: statuses.filter(c => c.status === "NOT_CONFIGURED").length,
      total:          statuses.length,
    },
  });
});

// ── GET /api/bridge/history ───────────────────────────────────────────────────

router.get("/history", (req, res) => {
  const limit   = Math.min(Number(req.query["limit"]) || 20, 100);
  const history = bridge.getRecentHistory(limit);
  res.json({
    ts:      new Date().toISOString(),
    count:   history.length,
    history,
  });
});

// ── GET /api/bridge/last/:connector ──────────────────────────────────────────

router.get("/last/:connector", (req, res) => {
  const { connector } = req.params as { connector: string };
  const last = bridge.getLastActionFor(connector);
  if (!last) {
    res.json({ ts: new Date().toISOString(), connector, last: null, message: "No actions yet" });
    return;
  }
  res.json({ ts: new Date().toISOString(), connector, last });
});

export default router;
