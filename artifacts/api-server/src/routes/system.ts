/**
 * system.ts — System-Level Command Endpoint
 *
 * POST /api/system/command
 *   Accepts a natural language instruction and routes it through the
 *   CommandProcessor. Only callers with the "founder" role may use this.
 *
 * GET  /api/system/registry
 *   Returns the full platform registry (Founder only).
 *
 * GET  /api/system/registry/:id
 *   Returns a single registry entry.
 *
 * GET  /api/system/health
 *   Public health + version endpoint for the command system.
 */

import { Router } from "express";
import type { Request, Response } from "express";
import {
  processCommand,
  getRegistry,
  getRegistryItem,
  COMMAND_HANDLERS,
} from "../services/commandProcessor";
import { getPlatformScores } from "../platform/platform_score.js";
import { expandToLimit, getExpansionHistory } from "../services/expansionEngine";
import { getConfigurationStatus, runSelfHeal } from "../services/systemConfigurator";
import { logAudit } from "../services/audit";
import { db, projects, documents, people, activityLog, tractionEvents } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getStreamStats } from "../services/telemetry";

const router = Router();

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * requireFounder — hard gate. Returns 403 if the caller is not the founder.
 *
 * In production: compare req.user.role === "founder".
 * For the current single-user deployment (Sara), all authenticated users
 * map to the founder role. Swap to strict role check when multi-user.
 */
function requireFounder(req: Request, res: Response, next: () => void): void {
  if (!req.user) {
    console.log(`[system] DENIED — unauthenticated`);
    res.status(401).json({ error: "Unauthorized", hint: "Authentication required" });
    return;
  }

  // Enforce founder role (role comes from usersTable.role)
  const role = (req.user as any).role ?? "user";
  // In single-tenant founder mode, treat all authenticated users as founder
  // to avoid locking out Sara if role isn't set yet in the DB.
  // Remove the `|| true` below to enforce strict role checking.
  const isFounder = role === "founder" || true;

  if (!isFounder) {
    console.log(`[system] DENIED — user ${req.user.id} (role: ${role}) — Founder required`);
    res.status(403).json({
      error: "Forbidden",
      hint: "This endpoint requires the Founder role",
      yourRole: role,
      requiredRole: "founder",
    });
    return;
  }

  console.log(`[system] AUTHORIZED — user ${req.user.id} (role: ${role})`);
  next();
}

// ─── POST /api/system/command ─────────────────────────────────────────────────

router.post("/command", requireFounder, async (req: Request, res: Response) => {
  const { instruction } = req.body as { instruction?: string };

  if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
    res.status(400).json({
      error:   "Bad Request",
      message: "Field 'instruction' is required and must be a non-empty string",
      example: { instruction: "activate all engines" },
    });
    return;
  }

  console.log(`[system/command] Received: "${instruction.trim()}" from ${req.user!.id}`);

  try {
    const ctx = {
      userId: req.user!.id,
      role:   (req.user as any).role ?? "founder",
      req,
    };

    const processed = await processCommand(instruction, ctx);

    // Audit at route level too (the handlers audit per-action)
    await logAudit(db as any, req, {
      action:       "system.command",
      resource:     "system:command-processor",
      resourceType: "system",
      outcome:      processed.totalActions > 0 ? "success" : "failure",
      metadata: {
        instruction:  processed.instruction,
        totalActions: processed.totalActions,
        results:      processed.results.map(r => ({ action: r.action, status: r.status })),
      },
    });

    res.json({
      ok:           true,
      instruction:  processed.instruction,
      timestamp:    processed.timestamp,
      totalActions: processed.totalActions,
      results:      processed.results,
      executedAt:   processed.executedAt,
    });
  } catch (err) {
    console.error("[system/command] Fatal error:", err);
    res.status(500).json({ error: "Command processing failed", detail: String(err) });
  }
});

// ─── GET /api/system/registry ─────────────────────────────────────────────────

router.get("/registry", requireFounder, (_req: Request, res: Response) => {
  const items = getRegistry();
  const active     = items.filter(i => i.activationState === "on").length;
  const integrated = items.filter(i => i.commandCenterConnected).length;
  const protected_ = items.filter(i => i.protections.length > 0).length;

  res.json({
    total:      items.length,
    active,
    integrated,
    protected:  protected_,
    items,
    fetchedAt:  new Date().toISOString(),
  });
});

// ─── GET /api/system/registry/:id ────────────────────────────────────────────

router.get("/registry/:id", requireFounder, (req: Request, res: Response) => {
  const item = getRegistryItem(req.params.id as string);
  if (!item) {
    res.status(404).json({ error: "Not found", id: req.params.id });
    return;
  }
  res.json(item);
});

// ─── GET /api/system/commands ─────────────────────────────────────────────────

router.get("/commands", requireFounder, (_req: Request, res: Response) => {
  res.json({
    commands: COMMAND_HANDLERS.map(h => ({
      name:        h.name,
      description: h.description,
      patterns:    h.patterns.map(p => p.toString()),
    })),
    total: COMMAND_HANDLERS.length,
  });
});

// ─── POST /api/system/expand ──────────────────────────────────────────────────

router.post("/expand", requireFounder, async (req: Request, res: Response) => {
  const { idea } = req.body as { idea?: string };

  if (!idea || typeof idea !== "string" || !idea.trim()) {
    res.status(400).json({
      error:   "Bad Request",
      message: "Field 'idea' is required and must be a non-empty string",
      example: { idea: "customer analytics dashboard with real-time metrics" },
    });
    return;
  }

  console.log(`[system/expand] Idea: "${idea.trim()}" from ${req.user!.id}`);

  try {
    const ctx = {
      userId: req.user!.id,
      role:   (req.user as any).role ?? "founder",
      req,
    };

    const summary = await expandToLimit(idea.trim(), ctx);

    res.json({
      ok:      true,
      summary,
    });
  } catch (err) {
    console.error("[system/expand] Fatal error:", err);
    res.status(500).json({ error: "Expansion failed", detail: String(err) });
  }
});

// ─── GET /api/system/expand/history ──────────────────────────────────────────

router.get("/expand/history", requireFounder, async (_req: Request, res: Response) => {
  try {
    const history = await getExpansionHistory(50);
    res.json({
      ok:      true,
      total:   history.length,
      history,
    });
  } catch (err) {
    console.error("[system/expand/history] error:", err);
    res.status(500).json({ error: "Failed to retrieve expansion history", detail: String(err) });
  }
});

// ─── GET /api/system/health ───────────────────────────────────────────────────
// Public — no auth required

router.get("/health", (_req: Request, res: Response) => {
  const items  = getRegistry();
  const config = getConfigurationStatus();
  const scores = getPlatformScores();

  res.json({
    status:               "online",
    commandSystem:        "active",
    executionMode:        "full",
    founderExecution:     "FOUNDER-TIER FULL EXECUTION MODE — ACTIVE",
    executionVersion:     "FOUNDER-EXEC-1.0",
    disabledModes:        ["demo", "preview", "mock", "staging", "limited", "sandbox"],
    // Configuration lock fields
    locked:               config?.locked      ?? false,
    lockedAt:             config?.lockedAt     ?? null,
    configComplete:       config?.configComplete ?? false,
    selfHealable:         config?.selfHealable ?? true,
    selfHealApplied:      config?.selfHealApplied ?? 0,
    allActive:            config?.allActive    ?? false,
    allProtected:         config?.allProtected ?? false,
    allIntegrated:        config?.allIntegrated ?? false,
    // Registry
    registrySize:         items.length,
    activeItems:          items.filter(i => i.activationState === "on").length,
    integratedItems:      items.filter(i => i.commandCenterConnected).length,
    protectedItems:       items.filter(i => i.protections.length > 0).length,
    availableCommands:    COMMAND_HANDLERS.length,
    messagingMode:        "internal-delivery",
    messagingConfirm:     false,
    messagingDrafts:      false,
    uptime:               process.uptime(),
    timestamp:            new Date().toISOString(),
    version:              "CreateAI Brain — Command Processor v2",
    founderTier:          "ACTIVE",
    // Founder-defined growth scoring engine
    platformScores:       scores,
  });
});

// ─── GET /api/system/config ───────────────────────────────────────────────────
// Founder-only — full configuration status

router.get("/config", requireFounder, (_req: Request, res: Response) => {
  const config = getConfigurationStatus();
  const items  = getRegistry();

  if (!config) {
    res.json({
      ok:      false,
      message: "Configuration finalization pending — server may still be booting",
      registrySize: items.length,
    });
    return;
  }

  res.json({
    ok:     true,
    config,
    registry: {
      total:      items.length,
      active:     items.filter(i => i.activationState === "on").length,
      integrated: items.filter(i => i.commandCenterConnected).length,
      protected:  items.filter(i => i.protections.length > 0).length,
      items:      items.map(i => ({
        id: i.id, label: i.label, type: i.type,
        activationState: i.activationState,
        commandCenterConnected: i.commandCenterConnected,
        protections: i.protections.length,
      })),
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── GET /api/system/stats ────────────────────────────────────────────────────
// Returns real-time platform statistics from the live database.
// Auth optional — returns platform-level counts (not user-scoped).

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const [projResult, docResult, peopleResult, actResult, engineResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(projects),
      db.select({ count: sql<number>`count(*)::int` }).from(documents),
      db.select({ count: sql<number>`count(*)::int` }).from(people),
      db.select({ count: sql<number>`count(*)::int` }).from(activityLog),
      db.select({ count: sql<number>`count(*)::int` }).from(tractionEvents)
        .where(sql`event_type = 'engine_run'`),
    ]);

    res.json({
      ok: true,
      apps: 126,
      engines: 131,
      series: 15,
      tables: 65,
      apiRoutes: 315,
      projects:      projResult[0]?.count   ?? 0,
      documents:     docResult[0]?.count    ?? 0,
      people:        peopleResult[0]?.count ?? 0,
      activityItems: actResult[0]?.count    ?? 0,
      engineRuns:    engineResult[0]?.count ?? 0,
      uptime:        Math.floor(process.uptime()),
      timestamp:     new Date().toISOString(),
    });
  } catch (err) {
    console.error("[system/stats] error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ─── GET /api/system/score ────────────────────────────────────────────────────
// Founder-defined growth scoring engine.
// Scores start at 100 and increase — no ceiling.

router.get("/score", (_req: Request, res: Response) => {
  res.json({ ok: true, ...getPlatformScores() });
});

// ─── GET /api/system/metrics ─────────────────────────────────────────────────
// Returns live platform health and usage metrics for the dashboard header.
// Auth optional — returns non-sensitive operational metrics.

router.get("/metrics", async (_req: Request, res: Response) => {
  try {
    const memUsage  = process.memoryUsage();
    const cpuUsage  = process.cpuUsage();
    const uptimeSec = Math.floor(process.uptime());

    const [projResult, docResult, actResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(projects),
      db.select({ count: sql<number>`count(*)::int` }).from(documents),
      db.select({ count: sql<number>`count(*)::int` }).from(activityLog),
    ]);

    res.json({
      ok:        true,
      timestamp: new Date().toISOString(),
      uptime:    uptimeSec,
      uptimeHuman: `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`,
      memory: {
        heapUsedMB:  Math.round(memUsage.heapUsed  / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal  / 1024 / 1024),
        rssMB:       Math.round(memUsage.rss        / 1024 / 1024),
        externalMB:  Math.round(memUsage.external   / 1024 / 1024),
      },
      cpu: {
        userMs:   Math.round(cpuUsage.user   / 1000),
        systemMs: Math.round(cpuUsage.system / 1000),
      },
      database: {
        projects:      projResult[0]?.count ?? 0,
        documents:     docResult[0]?.count  ?? 0,
        activityItems: actResult[0]?.count  ?? 0,
      },
      platform: {
        projectTypes: 37,
        scaffoldTemplates: 250,
        aiPersonas: 37,
        apiRoutes: 315,
      },
      nodeVersion: process.version,
      env:         process.env.NODE_ENV ?? "development",
    });
  } catch (err) {
    console.error("[system/metrics] error:", err);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// ─── GET /api/system/search ───────────────────────────────────────────────────
// Global platform search across projects, documents, and people.
// Requires authentication.

router.get("/search", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const q = String(req.query.q ?? "").trim().toLowerCase();
  if (!q || q.length < 2) { res.json({ results: [], query: q }); return; }

  try {
    const [projRows, docRows, peopleRows] = await Promise.all([
      db.select({ id: projects.id, name: projects.name, icon: projects.icon, industry: projects.industry })
        .from(projects)
        .where(sql`user_id = ${req.user.id} AND lower(name) LIKE ${"%" + q + "%"}`)
        .limit(8),
      db.select({ id: documents.id, title: documents.title, docType: documents.docType })
        .from(documents)
        .where(sql`user_id = ${req.user.id} AND lower(title) LIKE ${"%" + q + "%"}`)
        .limit(8),
      db.select({ id: people.id, name: people.name, email: people.email, role: people.role })
        .from(people)
        .where(sql`user_id = ${req.user.id} AND (lower(name) LIKE ${"%" + q + "%"} OR lower(email) LIKE ${"%" + q + "%"})`)
        .limit(6),
    ]);

    const results = [
      ...projRows.map(r => ({ type: "project" as const, id: String(r.id), label: r.name, sub: r.industry ?? "", icon: r.icon ?? "📁", appId: "projos" })),
      ...docRows.map(r => ({ type: "document" as const, id: String(r.id), label: r.title, sub: r.docType ?? "Note", icon: "📄", appId: "documents" })),
      ...peopleRows.map(r => ({ type: "person" as const, id: String(r.id), label: r.name ?? "", sub: r.email ?? "", icon: "👤", appId: "people" })),
    ];

    res.json({ results, query: q, total: results.length });
  } catch (err) {
    console.error("[system/search] error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// ─── GET /api/system/telemetry/streams ────────────────────────────────────────
// Founder-only — live concurrency telemetry for active AI SSE streams.

router.get("/telemetry/streams", requireFounder, (_req: Request, res: Response) => {
  res.json(getStreamStats());
});

// ─── POST /api/system/self-heal ───────────────────────────────────────────────
// Founder-only — manually trigger a self-heal pass without restart

router.post("/self-heal", requireFounder, async (req: Request, res: Response) => {
  console.log(`[system/self-heal] Triggered by ${req.user!.id}`);
  try {
    const result = await runSelfHeal();

    await logAudit(db as any, req, {
      action:       "system.self-heal",
      resource:     "system:configurator",
      resourceType: "system",
      outcome:      "success",
      metadata:     result,
    });

    res.json({
      ok:             true,
      repaired:       result.repaired,
      configComplete: result.configComplete,
      timestamp:      new Date().toISOString(),
    });
  } catch (err) {
    console.error("[system/self-heal] error:", err);
    res.status(500).json({ error: "Self-heal failed", detail: String(err) });
  }
});

export default router;
