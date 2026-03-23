/**
 * push.ts — Web Push Notification Routes
 * ---------------------------------------
 * GET  /api/push/vapid-key   → public VAPID key for browser subscription
 * POST /api/push/subscribe   → save a browser push subscription for current user
 * DELETE /api/push/subscribe → remove subscription for current user
 * POST /api/push/send        → (admin/founder) send push to a user or broadcast
 * POST /api/push/test        → (admin/founder) send a test push to self
 */

import { Router, type Request, type Response } from "express";
import webpush from "web-push";
import { getSql } from "../lib/db.js";

const router = Router();

// ── VAPID configuration ───────────────────────────────────────────────────────

const VAPID_PUBLIC  = process.env["VAPID_PUBLIC_KEY"]  ?? "";
const VAPID_PRIVATE = process.env["VAPID_PRIVATE_KEY"] ?? "";
const VAPID_SUBJECT = process.env["VAPID_SUBJECT"]     ?? "mailto:admin@LakesideTrinity.com";

let vapidReady = false;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
    vapidReady = true;
    console.log("[Push] VAPID keys configured ✅");
  } catch (err) {
    console.error("[Push] VAPID setup failed:", (err as Error).message);
  }
} else {
  const keys = webpush.generateVAPIDKeys();
  console.warn("[Push] VAPID keys not set. Add these to Replit Secrets:");
  console.warn(`  VAPID_PUBLIC_KEY  = ${keys.publicKey}`);
  console.warn(`  VAPID_PRIVATE_KEY = ${keys.privateKey}`);
  console.warn(`  VAPID_SUBJECT     = ${VAPID_SUBJECT}`);
}

// ── GET /api/push/vapid-key ───────────────────────────────────────────────────

router.get("/vapid-key", (_req: Request, res: Response) => {
  if (!VAPID_PUBLIC) {
    res.status(503).json({ error: "Push notifications not configured — VAPID_PUBLIC_KEY missing" });
    return;
  }
  res.json({ publicKey: VAPID_PUBLIC });
});

// ── POST /api/push/subscribe ──────────────────────────────────────────────────

router.post("/subscribe", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req.user as { id: string }).id;
  const { endpoint, keys } = req.body as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "endpoint, keys.p256dh and keys.auth are required" });
    return;
  }

  const sql = getSql();
  try {
    await sql`
      INSERT INTO platform_push_subscriptions (id, user_id, endpoint, p256dh, auth_key)
      VALUES (${'psub_' + crypto.randomUUID().replace(/-/g,'').slice(0,16)}, ${userId}, ${endpoint}, ${keys.p256dh}, ${keys.auth})
      ON CONFLICT (endpoint) DO UPDATE SET
        user_id    = EXCLUDED.user_id,
        p256dh     = EXCLUDED.p256dh,
        auth_key   = EXCLUDED.auth_key,
        updated_at = NOW()
    `;
    console.log(`[Push] Subscription saved for user ${userId}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[Push] Subscribe error:", (err as Error).message);
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

// ── DELETE /api/push/subscribe ────────────────────────────────────────────────

router.delete("/subscribe", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = (req.user as { id: string }).id;
  const { endpoint } = req.body as { endpoint?: string };

  if (!endpoint) { res.status(400).json({ error: "endpoint required" }); return; }

  const sql = getSql();
  await sql`DELETE FROM platform_push_subscriptions WHERE user_id = ${userId} AND endpoint = ${endpoint}`.catch(() => {});
  res.json({ ok: true });
});

// ── POST /api/push/send ───────────────────────────────────────────────────────

router.post("/send", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const actor = req.user as { id: string; role?: string };
  if (!["admin", "founder"].includes(actor.role ?? "")) {
    res.status(403).json({ error: "Forbidden — admin or founder role required" }); return;
  }
  if (!vapidReady) { res.status(503).json({ error: "VAPID keys not configured" }); return; }

  const { userId, title, body, url, broadcast } = req.body as {
    userId?: string; title?: string; body?: string; url?: string; broadcast?: boolean;
  };

  const sql = getSql();
  const subs = broadcast
    ? await sql`SELECT endpoint, p256dh, auth_key FROM platform_push_subscriptions`
    : await sql`SELECT endpoint, p256dh, auth_key FROM platform_push_subscriptions WHERE user_id = ${userId ?? ""}`;

  if (subs.length === 0) { res.json({ ok: true, sent: 0, note: "No subscriptions found" }); return; }

  const payload = JSON.stringify({
    title: title ?? "CreateAI Brain",
    body:  body  ?? "You have a new notification",
    url:   url   ?? "/",
    tag:   "cai-push",
  });

  let sent = 0; let failed = 0;
  await Promise.allSettled(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: String(s["endpoint"]), keys: { p256dh: String(s["p256dh"]), auth: String(s["auth_key"]) } },
        payload,
      );
      sent++;
    } catch (err) {
      failed++;
      if ((err as { statusCode?: number }).statusCode === 410) {
        await sql`DELETE FROM platform_push_subscriptions WHERE endpoint = ${String(s["endpoint"])}`.catch(() => {});
      }
    }
  }));

  console.log(`[Push] Sent ${sent} push(es), ${failed} failed`);
  res.json({ ok: true, sent, failed });
});

// ── POST /api/push/test ───────────────────────────────────────────────────────

router.post("/test", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!vapidReady) { res.status(503).json({ error: "VAPID keys not configured" }); return; }

  const userId = (req.user as { id: string }).id;
  const sql = getSql();
  const subs = await sql`SELECT endpoint, p256dh, auth_key FROM platform_push_subscriptions WHERE user_id = ${userId} LIMIT 1`;

  if (subs.length === 0) { res.json({ ok: false, note: "No subscription found for your account — enable push notifications first" }); return; }

  const s = subs[0]!;
  try {
    await webpush.sendNotification(
      { endpoint: String(s["endpoint"]), keys: { p256dh: String(s["p256dh"]), auth: String(s["auth_key"]) } },
      JSON.stringify({ title: "CreateAI Brain", body: "Push notifications are working ✅", url: "/", tag: "cai-test" }),
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
