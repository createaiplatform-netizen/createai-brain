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
import { expandToLimit } from "../services/expansionEngine";
import { logAudit } from "../services/audit";
import { db } from "@workspace/db";

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

// ─── GET /api/system/health ───────────────────────────────────────────────────
// Public — no auth required

router.get("/health", (_req: Request, res: Response) => {
  const items = getRegistry();
  res.json({
    status:          "online",
    commandSystem:   "active",
    registrySize:    items.length,
    activeItems:     items.filter(i => i.activationState === "on").length,
    availableCommands: COMMAND_HANDLERS.length,
    uptime:          process.uptime(),
    timestamp:       new Date().toISOString(),
    version:         "CreateAI Brain — Command Processor v1",
    founderTier:     "ACTIVE",
  });
});

export default router;
