/**
 * lifecycle.ts — Lifecycle event emission API
 * ────────────────────────────────────────────
 * POST /api/lifecycle/event   → fire lifecycle event → activityLog + GlobalPulse
 * GET  /api/lifecycle/events  → list known lifecycle event types
 *
 * Enables: enable_lifecycle_triggers, on_event: publish_updates(), on_any_growth: expand()
 */

import { Router, type Request, type Response } from "express";
import { broadcastGlobalPulse } from "../services/globalPulse.js";
import { db, activityLog }      from "@workspace/db";

const router = Router();

const LIFECYCLE_EVENTS = [
  { id: "platform.new_user",       label: "New User Joined",          icon: "👤" },
  { id: "onboarding_complete",     label: "Onboarding Completed",     icon: "🚀" },
  { id: "project_created",         label: "Project Created",          icon: "📁" },
  { id: "app_open",                label: "App Opened",               icon: "✨" },
  { id: "invite_sent",             label: "Invite Sent",              icon: "🤝" },
  { id: "feature_discovered",      label: "Feature Discovered",       icon: "🔍" },
  { id: "output_saved",            label: "Output Saved",             icon: "📚" },
  { id: "subscription_created",    label: "Subscription Created",     icon: "💳" },
  { id: "milestone_reached",       label: "Platform Milestone",       icon: "🏆" },
  { id: "registry.refresh",        label: "Surface Registry Refresh", icon: "🔄" },
  { id: "surface_published",       label: "Surface Published",        icon: "🌐" },
];

// ── POST /api/lifecycle/event ─────────────────────────────────────────────────

router.post("/event", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ ok: false, error: "Authentication required" }); return; }

  const { event, label, meta } = req.body as {
    event: string;
    label?: string;
    meta?: Record<string, unknown>;
  };

  if (!event) { res.status(400).json({ ok: false, error: "event is required" }); return; }

  const known    = LIFECYCLE_EVENTS.find(e => e.id === event);
  const icon     = known?.icon ?? "⚡";
  const message  = label ?? known?.label ?? event;

  try {
    // Write to activity log
    await db.insert(activityLog).values({
      userId: req.user.id,
      action: event,
      label:  message,
      icon,
      meta:   meta ?? {},
    });

    // Broadcast via GlobalPulse — non-blocking
    broadcastGlobalPulse({
      event,
      message,
      ts:  new Date().toISOString(),
      meta: meta ?? {},
    }).catch(() => {});

    res.json({ ok: true, event, message, broadcasted: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── GET /api/lifecycle/events — list all known event types ───────────────────

router.get("/events", (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({ ok: true, count: LIFECYCLE_EVENTS.length, events: LIFECYCLE_EVENTS });
});

export default router;
