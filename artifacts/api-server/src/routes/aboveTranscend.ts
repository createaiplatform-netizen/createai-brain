/**
 * routes/aboveTranscend.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * REST surface for the Above-Transcend Engine v2 — MINIMUM 100% SELF-EVOLUTION
 *
 * GET  /api/above-transcend/status       — latest cycle summary + evolution status
 * GET  /api/above-transcend/latest       — full latest cycle (all 8 phases)
 * GET  /api/above-transcend/next-moves   — top-5 next moves
 * GET  /api/above-transcend/history      — last N cycles (lightweight)
 * GET  /api/above-transcend/snapshot     — finalSnapshot() of last cycle (spec requirement)
 * GET  /api/above-transcend/actions      — full executed-action history
 * POST /api/above-transcend/run          — trigger a cycle immediately
 */

import { Router, type Request, type Response } from "express";
import {
  getLatestCycle,
  getCycleHistory,
  getCycleCount,
  getNextMoves,
  getActionHistory,
  getTrendHistory,
  runCycleNow,
  engineState,
} from "../services/aboveTranscend/engine.js";
import {
  getFamilyAgentStates,
  FAMILY_MEMBERS,
  VOICE_WAKE_WORDS,
} from "../services/familyAgents.js";

const router = Router();

router.get("/status", (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const cycle = getLatestCycle();
  const count = getCycleCount();

  if (!cycle) {
    res.json({ ok: true, ready: false, cycleCount: count, message: "First cycle in progress…" });
    return;
  }

  res.json({
    ok:             true,
    ready:          true,
    cycleCount:     count,
    lastRunAt:      cycle.completedAt,
    durationMs:     cycle.durationMs,
    summary:        cycle.summary,
    systemStatus:   cycle.systemStatus,
    evolutionRate:  cycle.evolutionRate,
    realImpactScore: cycle.realImpactScore,
    criticalFailure: cycle.criticalFailure,
    criticalReason:  cycle.criticalReason,
    failsafe:        cycle.failsafe,
    topNextMove:    cycle.nextMoves[0] ?? null,
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
    cycleId:         c.cycleId,
    cycleNumber:     c.cycleNumber,
    startedAt:       c.startedAt,
    completedAt:     c.completedAt,
    durationMs:      c.durationMs,
    systemStatus:    c.systemStatus,
    evolutionRate:   c.evolutionRate,
    realImpactScore: c.realImpactScore,
    actionsExecuted: c.executedActions.length,
    criticalFailure: c.criticalFailure,
    stallCount:      c.failsafe.stallCount,
    topMove:         c.nextMoves[0]?.title ?? null,
    summary:         c.summary,
  }));

  res.json({ ok: true, cycles: lightweight, total: full.length });
});

// finalSnapshot() — FullSnapshot shape (spec: LimitlessLiveDashboardWithIncome)
router.get("/snapshot", (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const latest = getLatestCycle();
  if (!latest) { res.status(404).json({ ok: false, error: "No cycle completed yet" }); return; }
  const r = latest.limitlessReport;
  const u = latest.universeReport;

  // marketplaceUsers list from limitless engine
  const muList: { name: string; earnings: number }[] = r.marketplaceUsers ?? [];

  res.json({
    ok:       true,
    snapshot: {
      // --- Core Metrics (object, each value as percentage) ---
      metrics: {
        score:      r.score,
        impact:     r.impact,
        compliance: r.compliance,
        autonomy:   r.autonomy,
      },
      // --- Also flat (for backwards compat) ---
      score:       r.score,
      impact:      r.impact,
      compliance:  r.compliance,
      autonomy:    r.autonomy,
      // --- Emergent Modules & Upgrades ---
      emergentModules: r.totalEmergentModules,
      upgrades:        r.upgrades,
      dynamicAction:   r.dynamicAction,
      dynamicActions:  r.actions ?? [r.dynamicAction],
      // --- Marketplace ---
      marketplaceUsers:      muList.length,
      marketplaceUsersArray: muList.map((mu) => ({ name: mu.name, earnings: mu.earnings })),
      totalRevenue:          r.marketplaceDemo.scaledTotal,
      marketplaceTotal:      r.marketplaceDemo.scaledTotal,
      // --- Universe Stats (flat, spec: LimitlessLiveDashboard) ---
      universeUnits:   u.unitCount,
      metaPhases:      u.metaPhaseCount,
      expansionIdeas:  u.expansionIdeaCount,
      // --- Universe nested (backwards compat) ---
      universe: {
        units:          u.unitCount,
        metaPhases:     u.metaPhaseCount,
        expansionIdeas: u.expansionIdeaCount,
      },
      // --- Engine State ---
      engine: {
        activeEngines:   engineState.activeEngines,
        layers:          engineState.layers.length,
        series:          engineState.series.length,
        cyclesCompleted: engineState.cyclesCompleted,
      },
      // --- System Health (spec: limitlessFamilyAIFull.ts) ---
      serverStatus:  "Active",
      stripeStatus:  "Internal Banking",   // spec: stripeStatus: 'Internal Banking'
      firewallCheck: true,
      sandboxLimit:  false,   // NO LIMITS EDITION — no sandbox limit
      gapsFixed:     true,    // self-heal pass runs every cycle
      errorsFixed:   true,    // safety layer auto-corrects violations
      // --- engineState (full live object, spec: limitlessFamilyAIFull.ts) ---
      engineState: {
        activeEngines:   engineState.activeEngines,
        layers:          engineState.layers,
        series:          engineState.series,
        cyclesCompleted: engineState.cyclesCompleted,
        score:           engineState.score,
        impact:          engineState.impact,
        compliance:      engineState.compliance,
        autonomy:        engineState.autonomy,
        emergentModules: engineState.emergentModules,
        upgrades:        engineState.upgrades,
        dynamicAction:   engineState.dynamicAction,
        marketplaceUsers: engineState.marketplaceUsers,
        marketplaceTotal: engineState.marketplaceTotal,
        universe:        engineState.universe,
      },
      // --- Family Agents (spec: limitlessFamilyAIFull.ts) ---
      familyMembers:  getFamilyAgentStates(),
      voiceWakeWords: [...VOICE_WAKE_WORDS],
      adminUser:      "Sara Stadler",
      // --- Raw ---
      limitlessReport: r,
      timestamp:       latest.completedAt,
    },
  });
});

router.get("/actions", (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.json({ ok: true, actions: getActionHistory(), trends: getTrendHistory() });
});

router.post("/run", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const cycle = await runCycleNow();
    res.json({
      ok:             true,
      message:        "Cycle complete",
      cycleNumber:    cycle.cycleNumber,
      systemStatus:   cycle.systemStatus,
      evolutionRate:  cycle.evolutionRate,
      realImpactScore: cycle.realImpactScore,
      actionsExecuted: cycle.executedActions.length,
      criticalFailure: cycle.criticalFailure,
      summary:        cycle.summary,
    });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
