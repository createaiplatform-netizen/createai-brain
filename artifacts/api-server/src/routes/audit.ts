/**
 * audit.ts — Platform Audit Routes
 * Spec: FULL-PLATFORM-AUDIT-ZERO-TOUCH-SNAPSHOT
 *
 * GET  /api/audit/snapshot — last cached audit result (no I/O, instant)
 * POST /api/audit/run      — trigger a fresh audit synchronously, returns result
 */

import { Router }                              from "express";
import { runFullAudit, getLastAuditResult }    from "../services/platformAudit.js";

const router = Router();

// GET /api/audit/snapshot
// Returns the most recent audit result from boot or last POST /run.
router.get("/snapshot", (_req, res) => {
  const result = getLastAuditResult();
  if (!result) {
    return res.status(202).json({
      message: "Audit not yet complete — boot audit fires 3 s after startup. Try again shortly.",
    });
  }
  res.json(result);
});

// POST /api/audit/run
// Triggers a fresh synchronous audit across all three engines.
router.post("/run", async (_req, res) => {
  try {
    const result = await runFullAudit();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
