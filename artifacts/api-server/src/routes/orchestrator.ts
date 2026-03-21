/**
 * orchestrator.ts — All-Systems Execution Orchestrator Routes
 *
 * POST   /api/orchestrator/execute                          — submit a goal
 * GET    /api/orchestrator/history                          — all past plans
 * GET    /api/orchestrator/plan/:planId                     — single plan
 * PATCH  /api/orchestrator/plan/:planId/action/:actionId    — toggle done
 *
 * Public — no auth required (same pattern as /transcend-dashboard).
 */

import { Router }           from "express";
import {
  executeGoal,
  getPlanHistory,
  getPlanById,
  toggleActionDone,
}                           from "../services/executionOrchestrator.js";

const router = Router();

// ── POST /api/orchestrator/execute ────────────────────────────────────────────

router.post("/execute", async (req, res) => {
  const { goal } = req.body as { goal?: string };

  if (!goal || typeof goal !== "string" || goal.trim().length < 5) {
    res.status(400).json({ ok: false, error: "goal must be a non-empty string (min 5 chars)" });
    return;
  }

  try {
    const plan = await executeGoal(goal.trim());
    res.json({ ok: true, plan });
  } catch (err: unknown) {
    console.error("[Orchestrator] executeGoal failed:", (err as Error).message);
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── GET /api/orchestrator/history ─────────────────────────────────────────────

router.get("/history", (_req, res) => {
  try {
    const history = getPlanHistory().map(p => ({
      id:          p.id,
      goal:        p.goal,
      goalSummary: p.goalSummary,
      createdAt:   p.createdAt,
      universe:    p.universeContext,
      engines:     p.enginesUsed.length,
      actionsDone: [
        ...p.phases.today,
        ...p.phases.thisWeek,
        ...p.phases.thisMonth,
      ].filter(a => a.done).length,
      actionsTotal: [
        ...p.phases.today,
        ...p.phases.thisWeek,
        ...p.phases.thisMonth,
      ].length,
    }));
    res.json({ ok: true, count: history.length, history });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── GET /api/orchestrator/plan/:planId ────────────────────────────────────────

router.get("/plan/:planId", (req, res) => {
  const plan = getPlanById(req.params.planId);
  if (!plan) {
    res.status(404).json({ ok: false, error: "Plan not found" });
    return;
  }
  res.json({ ok: true, plan });
});

// ── PATCH /api/orchestrator/plan/:planId/action/:actionId ─────────────────────

router.patch("/plan/:planId/action/:actionId", (req, res) => {
  const { planId, actionId } = req.params;
  const { phase } = req.body as { phase?: string };

  if (!phase || !["today", "thisWeek", "thisMonth"].includes(phase)) {
    res.status(400).json({ ok: false, error: "phase must be 'today' | 'thisWeek' | 'thisMonth'" });
    return;
  }

  try {
    const updated = toggleActionDone(
      planId,
      phase as "today" | "thisWeek" | "thisMonth",
      actionId,
    );
    if (!updated) {
      res.status(404).json({ ok: false, error: "Plan or action not found" });
      return;
    }
    res.json({ ok: true, plan: updated });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
