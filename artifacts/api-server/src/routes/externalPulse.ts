/**
 * externalPulse.ts — ExternalPulse REST API
 * ------------------------------------------
 * POST   /api/external-pulse/subscribe      → opt-in a new endpoint
 * DELETE /api/external-pulse/subscribe      → opt-out an endpoint
 * GET    /api/external-pulse/subscribers    → list subscribers (admin/founder)
 * POST   /api/external-pulse/broadcast      → manual broadcast trigger (admin/founder)
 * GET    /api/external-pulse/logs           → delivery log (admin/founder)
 */

import { Router, type Request, type Response } from "express";
import {
  registerSubscriber,
  unregisterSubscriber,
  getSubscribers,
  broadcastToSubscribers,
  getPulseLogs,
  type PulseSubscriberType,
} from "../services/externalPulse.js";

const router = Router();

// ── POST /subscribe ───────────────────────────────────────────────────────────

router.post("/subscribe", async (req: Request, res: Response) => {
  const { label, type, endpointUrl, secret } = req.body as {
    label?:       string;
    type?:        string;
    endpointUrl?: string;
    secret?:      string;
  };

  if (!endpointUrl) {
    res.status(400).json({ error: "endpointUrl is required" });
    return;
  }

  const validTypes: PulseSubscriberType[] = ["webhook", "app_client", "mesh_relay", "browser_hook"];
  const subType = (validTypes.includes(type as PulseSubscriberType) ? type : "webhook") as PulseSubscriberType;

  const userId = req.isAuthenticated() ? (req.user as { id: string }).id : undefined;

  try {
    const sub = await registerSubscriber({
      userId,
      label:       label ?? endpointUrl,
      type:        subType,
      endpointUrl,
      secret,
    });
    res.json({ ok: true, subscriber: sub });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── DELETE /subscribe ─────────────────────────────────────────────────────────

router.delete("/subscribe", async (req: Request, res: Response) => {
  const { endpointUrl } = req.body as { endpointUrl?: string };
  if (!endpointUrl) { res.status(400).json({ error: "endpointUrl is required" }); return; }

  try {
    await unregisterSubscriber(endpointUrl);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── GET /subscribers ──────────────────────────────────────────────────────────

router.get("/subscribers", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const actor = req.user as { role?: string };
  if (!["admin", "founder"].includes(actor.role ?? "")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const all = (req.query["all"] === "true");
  try {
    const rows = await getSubscribers(!all);
    res.json({ ok: true, count: rows.length, subscribers: rows });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── POST /broadcast ───────────────────────────────────────────────────────────

router.post("/broadcast", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const actor = req.user as { role?: string };
  if (!["admin", "founder"].includes(actor.role ?? "")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const { message, eventType } = req.body as { message?: string; eventType?: string };

  try {
    const result = await broadcastToSubscribers({
      eventType: eventType ?? "EMERGENCY_BROADCAST",
      message:   message ?? "Emergency Broadcast — CreateAI Brain",
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── GET /logs ─────────────────────────────────────────────────────────────────

router.get("/logs", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const actor = req.user as { role?: string };
  if (!["admin", "founder"].includes(actor.role ?? "")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const limit = Math.min(Number(req.query["limit"] ?? 50), 200);
  try {
    const rows = await getPulseLogs(limit);
    res.json({ ok: true, logs: rows });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
