/**
 * optIn.ts — Universal Public Opt-In API
 * ────────────────────────────────────────
 * Allows ANY external system to opt in/out of GlobalPulse broadcasts
 * without authentication. No Replit session required.
 *
 * POST   /api/opt-in           → subscribe a webhook endpoint to GlobalPulse
 * DELETE /api/opt-in           → unsubscribe by endpointUrl
 * GET    /api/opt-in/info      → public info about what subscribers receive
 *
 * Rate-limited to prevent abuse. endpointUrl must be HTTPS.
 * Consent is recorded with IP + timestamp on every registration.
 */

import { Router, type Request, type Response } from "express";
import {
  registerSubscriber,
  unregisterSubscriber,
  type PulseSubscriberType,
} from "../services/externalPulse.js";
import { getCanonicalBaseUrl } from "../utils/publicUrl.js";
import rateLimit from "express-rate-limit";

const router = Router();

const optInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      20,
  message:  { ok: false, error: "Too many opt-in requests — try again in 15 minutes" },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── POST /api/opt-in — subscribe ─────────────────────────────────────────────

router.post("/", optInLimiter, async (req: Request, res: Response) => {
  const { label, endpointUrl, secret, type } = req.body as {
    label?:       string;
    endpointUrl?: string;
    secret?:      string;
    type?:        string;
  };

  if (!endpointUrl) {
    res.status(400).json({ ok: false, error: "endpointUrl is required" });
    return;
  }
  if (!endpointUrl.startsWith("https://")) {
    res.status(400).json({ ok: false, error: "endpointUrl must use HTTPS" });
    return;
  }

  const validTypes: PulseSubscriberType[] = ["webhook", "app_client", "mesh_relay", "browser_hook"];
  const subType = (validTypes.includes(type as PulseSubscriberType) ? type : "webhook") as PulseSubscriberType;

  try {
    const sub = await registerSubscriber({
      label:       label ?? endpointUrl,
      type:        subType,
      endpointUrl,
      secret:      secret ?? undefined,
      meta: {
        optInSource: "public_api",
        ip:          req.ip,
        ts:          new Date().toISOString(),
        consent:     true,
      },
    });
    res.status(201).json({
      ok:      true,
      message: "Subscribed to GlobalPulse broadcasts",
      id:      sub.id,
      label:   sub.label,
      type:    sub.type,
      info:    getCanonicalBaseUrl() + "/api/opt-in/info",
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── DELETE /api/opt-in — unsubscribe ─────────────────────────────────────────

router.delete("/", optInLimiter, async (req: Request, res: Response) => {
  const { endpointUrl } = req.body as { endpointUrl?: string };
  if (!endpointUrl) {
    res.status(400).json({ ok: false, error: "endpointUrl is required" });
    return;
  }
  try {
    await unregisterSubscriber(endpointUrl);
    res.json({ ok: true, message: "Unsubscribed from GlobalPulse broadcasts", endpointUrl });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── GET /api/opt-in/info — public subscriber info ────────────────────────────

router.get("/info", (_req: Request, res: Response) => {
  const base = getCanonicalBaseUrl();
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({
    ok:      true,
    title:   "CreateAI Brain — GlobalPulse Opt-In",
    description: "Subscribe your webhook to receive real-time platform broadcasts.",
    events: [
      "platform.new_user",
      "onboarding_complete",
      "project_created",
      "app_open",
      "invite_sent",
      "feature_discovered",
      "output_saved",
      "subscription_created",
      "milestone_reached",
      "registry.refresh",
      "surface_published",
    ],
    endpoints: {
      subscribe:   { method: "POST",   url: base + "/api/opt-in",      body: { endpointUrl: "https://your.server/webhook", label: "My App", secret: "optional" } },
      unsubscribe: { method: "DELETE", url: base + "/api/opt-in",      body: { endpointUrl: "https://your.server/webhook" } },
      sseStream:   { method: "GET",    url: base + "/api/global-pulse/stream", note: "Server-Sent Events — no auth required" },
      rssFeed:     { method: "GET",    url: base + "/api/global-pulse/feed.xml" },
      discovery:   { method: "GET",    url: base + "/api/discovery/surfaces" },
      selfMap:     { method: "GET",    url: base + "/api/platform/self-map" },
    },
    privacy: "endpointUrl and IP are stored for delivery. No personal data is required. Unsubscribe at any time.",
    rateLimit: "20 requests per 15 minutes per IP",
  });
});

export default router;
