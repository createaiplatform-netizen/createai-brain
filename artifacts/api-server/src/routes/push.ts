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
// Priority: env vars → DB-persisted keys → generate + persist new keys
// This ensures VAPID keys never change across restarts.

const VAPID_SUBJECT = process.env["VAPID_SUBJECT"] ?? "mailto:admin@LakesideTrinity.com";

let vapidReady = false;
let activeVapidPublic = "";

async function initVapid() {
  const sql = getSql();

  // Ensure config table exists
  await sql`
    CREATE TABLE IF NOT EXISTS platform_config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `.catch(() => {});

  let pub  = process.env["VAPID_PUBLIC_KEY"]  ?? "";
  let priv = process.env["VAPID_PRIVATE_KEY"] ?? "";

  if (!pub || !priv) {
    // Try loading from DB
    const rows = await sql`SELECT key, value FROM platform_config WHERE key IN ('vapid_public','vapid_private')`.catch(() => [] as any[]);
    for (const row of rows as { key: string; value: string }[]) {
      if (row.key === "vapid_public")  pub  = row.value;
      if (row.key === "vapid_private") priv = row.value;
    }
  }

  if (!pub || !priv) {
    // Generate a fresh stable pair and persist to DB
    const keys = webpush.generateVAPIDKeys();
    pub  = keys.publicKey;
    priv = keys.privateKey;
    await sql`
      INSERT INTO platform_config (key, value) VALUES ('vapid_public', ${pub}), ('vapid_private', ${priv})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `.catch(() => {});
    console.log("[Push] Generated new VAPID key pair and saved to DB.");
    console.log(`[Push] VAPID_PUBLIC_KEY  = ${pub}`);
    console.log(`[Push] VAPID_PRIVATE_KEY = ${priv}`);
    console.log("[Push] Save VAPID_PRIVATE_KEY to Replit Secrets to use env-based override.");
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, pub, priv);
    vapidReady = true;
    activeVapidPublic = pub;
    console.log("[Push] VAPID keys configured ✅");
  } catch (err) {
    console.error("[Push] VAPID setup failed:", (err as Error).message);
  }
}

// Fire async — routes check vapidReady before acting
initVapid().catch((err) => console.error("[Push] initVapid error:", err));

// ── GET /api/push/vapid-key ───────────────────────────────────────────────────

router.get("/vapid-key", (_req: Request, res: Response) => {
  if (!vapidReady || !activeVapidPublic) {
    res.status(503).json({ error: "Push notifications not configured — VAPID initialising, retry shortly" });
    return;
  }
  res.json({ publicKey: activeVapidPublic });
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
