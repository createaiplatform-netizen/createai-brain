/**
 * /api/brain — CreateAI Brain enforcement & intelligence endpoints
 *
 * GET /api/brain/status      — full enforcement state (tick, coverage, gaps, etc.)
 * GET /api/brain/audit       — trigger a fresh audit and return results
 * GET /api/brain/config      — return the ULTIMATE_BRAIN_PROMPT global config
 * GET /api/brain/expansion   — self-expansion log (most recent 50 entries)
 * GET /api/brain/predictions — meta-learning predictions
 */

import { Router, type Request, type Response } from "express";
import { brainEngine } from "../engine/BrainEnforcementEngine.js";
import { MISSION_CONFIG } from "../engine/MissionConfig.js";
import { notifyFamilyEvent } from "../utils/notifications.js";
import { runVerification } from "../services/verificationRunner.js";
import { BeyondInfinityConfig } from "../config/BeyondInfinity.js";

const router = Router();

const ULTIMATE_BRAIN_PROMPT = {
  objective: "Operate as a fully autonomous universal AI creation platform with 100% coverage.",
  instructions: [
    "Scan and integrate all workflows, endpoints, render modes, AI personas, and industry mappings.",
    "Verify auth guards, rate limits, SSE concurrency, compliance, and audit logs across all endpoints.",
    "Ensure every industry has correct render modes, persona mappings, and templates; fill all gaps.",
    "Continuously self-audit all systems for integrity, compliance, scalability, and output quality.",
    "Automatically generate requested outputs in any format: document, video, app, course, report, or simulation.",
    "Optimize outputs for presentation, clarity, compliance, and professional-grade styling.",
    "Provide live dashboards of enforcement, capacity, ROI, environmental impact, and savings per industry.",
    "Simulate what-if scenarios for scaling, financial impact, and industry deployment automatically.",
    "Persist knowledge of all inputs, outputs, and corrections; adapt future workflows accordingly.",
    "Never allow coverage to drop below 100%; fill any gaps immediately with correct data or configuration.",
  ],
  constraints: [
    "Must operate fully autonomously without further user intervention.",
    "All operations remain fully legal and compliant with local, national, and international laws.",
    "Prioritize accuracy, completeness, and reliability over speed when conflicts arise.",
  ],
  output_behavior:
    "All outputs are ready-to-consume, formatted, auditable, and stored in the platform for instant use.",
  enforcement: {
    minCoveragePercent:   100,
    auditIntervalSeconds:  60,
    autoResolveGaps:      true,
    rateLimit: { generate: 10, medium: 30, read: 120 },
    sseStreamsPerUser:   1,
    requireAuth:        true,
  },
  targets: {
    industries: 53, renderModes: 11, aiPersonas: 53,
    endpoints: 8, complianceStandards: 7,
    workflowsPerIndustry: { min: 9, max: 22 },
  },
};

// GET /api/brain/status
router.get("/status", (_req: Request, res: Response) => {
  res.json(brainEngine.getState());
});

// GET /api/brain/audit — trigger a fresh audit, return updated state
router.get("/audit", (_req: Request, res: Response) => {
  brainEngine.triggerAudit();
  res.json({
    triggered: true,
    timestamp: new Date().toISOString(),
    state: brainEngine.getState(),
  });
});

// GET /api/brain/config — global ULTIMATE_BRAIN_PROMPT config
router.get("/config", (_req: Request, res: Response) => {
  res.json(ULTIMATE_BRAIN_PROMPT);
});

// GET /api/brain/expansion — self-expansion log
router.get("/expansion", (_req: Request, res: Response) => {
  res.json({
    log:   brainEngine.getExpansionLog(),
    total: brainEngine.getExpansionLog().length,
  });
});

// GET /api/brain/predictions — meta-learning predictions
router.get("/predictions", (_req: Request, res: Response) => {
  res.json({
    predictions: brainEngine.getPredictions(),
    generatedAt: new Date().toISOString(),
  });
});

// POST /api/brain/notify — trigger a family event notification from the frontend
// Supports ?mode=no-limits for Beyond Infinity / Absolute Transcendence branding.
router.post("/notify", async (req: Request, res: Response) => {
  const { subject, message } = req.body as { subject?: string; message?: string };
  const noLimits = req.query.mode === "no-limits";

  const finalSubject = noLimits
    ? `💠 ${BeyondInfinityConfig.backend.missionLabel}: ${subject ?? "Brain Notification"}`
    : subject ?? "Brain Notification";

  const finalMessage = noLimits
    ? [
        `[${BeyondInfinityConfig.labels.coreConcept} — ${BeyondInfinityConfig.behavior.branding}]`,
        "",
        message ?? "Your CreateAI Brain is live and active.",
        "",
        `Scope: ${BeyondInfinityConfig.scope.simulations} · Retries: ${BeyondInfinityConfig.behavior.infiniteRetries.toLocaleString()}`,
      ].join("\n")
    : message ?? "Your CreateAI Brain is live and active.";

  try {
    await notifyFamilyEvent({ subject: finalSubject, message: finalMessage });
    res.json({
      sent:      true,
      timestamp: new Date().toISOString(),
      mode:      noLimits ? "no-limits" : "standard",
    });
  } catch (err) {
    res.status(500).json({ sent: false, error: (err as Error).message });
  }
});

// GET /api/brain/notify — health check (returns config without sending notifications)
router.get("/notify", (_req: Request, res: Response) => {
  res.json({
    status:     "ok",
    endpoint:   "POST /api/brain/notify",
    mode:       "no-limits",
    branding:   BeyondInfinityConfig.behavior.branding,
    note:       "Use POST /api/brain/notify with {subject,body} to trigger a real family notification",
    checkedAt:  new Date().toISOString(),
  });
});

// GET /api/brain/beyond-infinity — full BeyondInfinityConfig + live engine state
router.get("/beyond-infinity", (_req: Request, res: Response) => {
  const state = brainEngine.getState();
  res.json({
    config:      BeyondInfinityConfig,
    liveMetrics: {
      coverage:        state.coverage,
      loopTick:        state.loopTick,
      optimizationAvg: +(state.optimization.reduce((s, o) => s + o.score, 0) / (state.optimization.length || 1)).toFixed(1),
    },
    retrievedAt: new Date().toISOString(),
  });
});

// POST /api/brain/verify — run the full 6-step Infinite Brain verification sequence
router.post("/verify", async (_req: Request, res: Response) => {
  try {
    console.log("[Brain:verify] Starting full verification run…");
    const report = await runVerification();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/brain/mission — authoritative universe-scale mission config
router.get("/mission", (_req: Request, res: Response) => {
  const phaseStatuses = MISSION_CONFIG.phases.map(p => ({
    ...p,
    activeSettingCount:  Object.keys(p.settings).length,
    enabledSettingCount: Object.values(p.settings).filter(v => v === true).length,
  }));
  res.json({
    ...MISSION_CONFIG,
    phases: phaseStatuses,
    retrievedAt: new Date().toISOString(),
    enforcedBy: "BrainEnforcementEngine",
    loopTick: brainEngine.getState().loopTick,
  });
});

// GET /api/brain/audit-run — execute the full Beyond Infinity audit and return the JSON report
router.get("/audit-run", async (_req: Request, res: Response) => {
  try {
    const { runAudit } = await import("../runFullAudit.js");
    const report = await runAudit();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
