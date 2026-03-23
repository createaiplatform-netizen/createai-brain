/**
 * globalPulse.ts — GlobalPulse REST & streaming routes
 * ------------------------------------------------------
 * GET  /api/global-pulse/stream         → public SSE stream (no auth required)
 * GET  /api/global-pulse/feed.xml       → public RSS/Atom feed (no auth)
 * GET  /api/global-pulse/status         → public status: live clients, last broadcast
 * POST /api/global-pulse/subscribe      → register a webhook endpoint (opt-in)
 * DELETE /api/global-pulse/subscribe    → remove a webhook (opt-out)
 * GET  /api/global-pulse/subscribers    → list webhooks (admin/founder)
 * POST /api/global-pulse/broadcast      → manual broadcast trigger (admin/founder)
 */

import { Router, type Request, type Response } from "express";
import {
  addSSEClient,
  getSSEClientCount,
  registerWebhook,
  unregisterWebhook,
  getWebhooks,
  getRecentBroadcasts,
  buildRSSFeed,
  broadcastGlobalPulse,
} from "../services/globalPulse.js";

const router = Router();

// ── GET /stream — public live SSE feed, no auth ──────────────────────────────

router.get("/stream", (req: Request, res: Response) => {
  res.set({
    "Content-Type":                "text/event-stream",
    "Cache-Control":               "no-cache",
    "Connection":                  "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "X-Accel-Buffering":           "no",
  });
  res.flushHeaders();

  // Send connection confirmation
  res.write(`event: connected\ndata: ${JSON.stringify({
    message: "Connected to CreateAI Brain GlobalPulse. You will receive all emergency broadcasts.",
    ts: new Date().toISOString(),
    liveClients: getSSEClientCount() + 1,
  })}\n\n`);

  // Heartbeat every 25s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch { cleanup(); }
  }, 25000);

  const cleanup = addSSEClient(res);

  req.on("close", () => { clearInterval(heartbeat); cleanup(); });
  req.on("error", () => { clearInterval(heartbeat); cleanup(); });
});

// ── GET /feed.xml — public RSS feed ──────────────────────────────────────────

router.get("/feed.xml", async (_req: Request, res: Response) => {
  try {
    const broadcasts = await getRecentBroadcasts(50);
    const baseUrl    = process.env["PUBLIC_URL"] ?? "https://createai.digital";
    const xml        = buildRSSFeed(broadcasts, baseUrl);
    res.set("Content-Type", "application/rss+xml; charset=utf-8");
    res.set("Access-Control-Allow-Origin", "*");
    res.send(xml);
  } catch (err) {
    res.status(500).send("Feed unavailable");
  }
});

// ── GET /status — public info ─────────────────────────────────────────────────

router.get("/status", async (_req: Request, res: Response) => {
  try {
    const [last] = await getRecentBroadcasts(1);
    const hooks  = await getWebhooks(true);
    res.set("Access-Control-Allow-Origin", "*");
    res.json({
      ok:            true,
      liveSSEClients: getSSEClientCount(),
      registeredWebhooks: hooks.length,
      lastBroadcast: last ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── POST /subscribe — opt-in webhook (no auth required — consent recorded) ───

router.post("/subscribe", async (req: Request, res: Response) => {
  const { label, endpointUrl, secret } = req.body as {
    label?:       string;
    endpointUrl?: string;
    secret?:      string;
  };

  if (!endpointUrl || !endpointUrl.startsWith("https://")) {
    res.status(400).json({ error: "endpointUrl must be an HTTPS URL" });
    return;
  }

  try {
    const sub = await registerWebhook({ label: label ?? endpointUrl, endpointUrl, secret });
    res.json({ ok: true, subscriber: sub });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── DELETE /subscribe — opt-out ───────────────────────────────────────────────

router.delete("/subscribe", async (req: Request, res: Response) => {
  const { endpointUrl } = req.body as { endpointUrl?: string };
  if (!endpointUrl) { res.status(400).json({ error: "endpointUrl required" }); return; }
  await unregisterWebhook(endpointUrl).catch(() => {});
  res.json({ ok: true });
});

// ── GET /subscribers — admin list ─────────────────────────────────────────────

router.get("/subscribers", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const role = (req.user as { role?: string }).role ?? "";
  if (!["admin", "founder"].includes(role)) { res.status(403).json({ error: "Forbidden" }); return; }
  const hooks = await getWebhooks(!!(req.query["active"] !== "false"));
  res.json({ ok: true, count: hooks.length, subscribers: hooks });
});

// ── POST /broadcast — manual trigger ─────────────────────────────────────────

router.post("/broadcast", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const role = (req.user as { role?: string }).role ?? "";
  if (!["admin", "founder"].includes(role)) { res.status(403).json({ error: "Forbidden" }); return; }

  const { message, eventType } = req.body as { message?: string; eventType?: string };
  try {
    const result = await broadcastGlobalPulse({
      eventType: eventType ?? "EMERGENCY_BROADCAST",
      message:   message  ?? "Emergency Broadcast — CreateAI Brain",
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
