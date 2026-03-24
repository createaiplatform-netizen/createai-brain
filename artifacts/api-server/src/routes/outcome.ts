// ═══════════════════════════════════════════════════════════════════════════
// outcome.ts
// POST /api/outcome/execute
// Autonomous Execution System — unified goal execution endpoint.
// ═══════════════════════════════════════════════════════════════════════════

import express from "express";
import { executeOutcome } from "../services/autonomousExecution/outcomeEngine";
import { getAllEngineStats } from "../services/autonomousExecution/feedbackStore";
import { getAllCapabilities, ENGINE_REGISTRY } from "../services/autonomousExecution/capabilityRegistry";
import { getAllTemplates } from "../services/autonomousExecution/templateRegistry";
import { logAudit } from "../services/audit";
import { db } from "@workspace/db";

const router = express.Router();

// ── Auth middleware ────────────────────────────────────────────────────────

function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

// ── POST /api/outcome/execute ─────────────────────────────────────────────

router.post("/execute", requireAuth, async (req, res) => {
  const { goal, context = {} } = req.body ?? {};

  if (!goal || typeof goal !== "string" || goal.trim().length < 3) {
    res.status(400).json({ error: "goal must be a non-empty string (min 3 chars)" });
    return;
  }

  if (goal.trim().length > 2000) {
    res.status(400).json({ error: "goal must not exceed 2000 characters" });
    return;
  }

  const sanitizedContext: Record<string, unknown> = typeof context === "object" && context !== null
    ? context as Record<string, unknown>
    : {};

  console.log(`[outcome/execute] user=${req.user!.id} goal="${goal.slice(0, 80)}"`);

  try {
    const result = await executeOutcome(goal.trim(), sanitizedContext);

    // Audit log
    await logAudit(db as any, req, {
      action:       "outcome.execute",
      resource:     `outcome:${result.outcomeId}`,
      resourceType: "outcome",
      outcome:      result.success ? "success" : "failure",
      metadata: {
        goal:        goal.slice(0, 120),
        steps:       result.steps.length,
        aiCallCount: result.aiCallCount,
        enginesUsed: result.enginesUsed,
      },
    }).catch(() => {});

    res.json({
      outcomeId:    result.outcomeId,
      goal:         result.goal,
      success:      result.success,
      summary:      result.summary,
      totalMs:      result.totalMs,
      aiCallCount:  result.aiCallCount,
      tokensSaved:  result.tokensSaved,
      enginesUsed:  result.enginesUsed,
      plan: {
        planId:     result.plan.planId,
        totalSteps: result.plan.totalSteps,
        source:     result.plan.source,
        steps:      result.plan.steps.map(s => ({
          stepIndex:   s.stepIndex,
          description: s.description,
          capability:  s.capability,
          canParallel: s.canParallel,
          required:    s.required,
        })),
      },
      results: result.steps.map(s => ({
        stepIndex:    s.stepIndex,
        description:  s.description,
        capability:   s.capability,
        engineUsed:   s.engineUsed,
        success:      s.success,
        output:       s.output,
        source:       s.source,
        durationMs:   s.durationMs,
        retried:      s.retried,
        fallbackUsed: s.fallbackUsed,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[outcome/execute] Fatal error:", err);
    res.status(500).json({ error: msg });
  }
});

// ── GET /api/outcome/capabilities ────────────────────────────────────────

router.get("/capabilities", requireAuth, (_req, res) => {
  res.json({
    capabilities: getAllCapabilities(),
    engines:      ENGINE_REGISTRY.map(e => ({
      engineId:     e.engineId,
      label:        e.label,
      domain:       e.domain,
      capabilities: e.capabilities,
      requiresAI:   e.requiresAI,
      priority:     e.priority,
    })),
  });
});

// ── GET /api/outcome/templates ────────────────────────────────────────────

router.get("/templates", requireAuth, (_req, res) => {
  res.json({
    templates: getAllTemplates().map(t => ({
      id:          t.id,
      name:        t.name,
      capability:  t.capability,
      description: t.description,
      variables:   t.variables,
      outputType:  t.outputType,
    })),
    count: getAllTemplates().length,
  });
});

// ── GET /api/outcome/engine-stats ─────────────────────────────────────────

router.get("/engine-stats", requireAuth, async (_req, res) => {
  try {
    const stats = await getAllEngineStats();
    res.json({ stats, count: stats.length });
  } catch {
    res.json({ stats: [], count: 0 });
  }
});

export default router;
