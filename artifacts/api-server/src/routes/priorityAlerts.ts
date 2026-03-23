/**
 * priorityAlerts.ts — Priority SMS Alerts & Digest Delivery
 * ----------------------------------------------------------
 * POST /api/alerts/priority-sms  — send an immediate high-priority SMS via Twilio
 * POST /api/alerts/digest        — send a daily/weekly digest (email + optional SMS)
 *
 * Both endpoints require admin or founder role.
 */

import { Router, type Request, type Response } from "express";
import { sendSMSNotification, sendEmailNotification } from "../utils/notifications.js";
import { getSql } from "../lib/db.js";

const router = Router();

function requireAdminOrFounder(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return false; }
  const role = (req.user as { role?: string }).role ?? "";
  if (!["admin", "founder"].includes(role)) {
    res.status(403).json({ error: "Forbidden — admin or founder role required" }); return false;
  }
  return true;
}

// ── POST /api/alerts/priority-sms ─────────────────────────────────────────────
// Sends an immediate high-priority SMS to one or more phone numbers.
// Body: { phones: string[], message: string }

router.post("/priority-sms", async (req: Request, res: Response) => {
  if (!requireAdminOrFounder(req, res)) return;

  const { phones, message } = req.body as { phones?: string[]; message?: string };
  if (!Array.isArray(phones) || phones.length === 0) {
    res.status(400).json({ error: "phones[] array is required" }); return;
  }
  if (!message?.trim()) {
    res.status(400).json({ error: "message is required" }); return;
  }

  const result = await sendSMSNotification(phones, message);
  console.log(`[Alerts] Priority SMS — ${result.successCount}/${result.total} delivered`);
  res.json({ ok: true, result });
});

// ── POST /api/alerts/digest ────────────────────────────────────────────────────
// Sends a digest to a user or list of emails/phones based on role.
// Body: { emails?: string[], phones?: string[], subject?: string, body?: string, channel?: "email"|"sms"|"both" }

router.post("/digest", async (req: Request, res: Response) => {
  if (!requireAdminOrFounder(req, res)) return;

  const {
    emails  = [],
    phones  = [],
    subject = "Your CreateAI Brain Digest",
    body    = "Here is your latest activity summary from CreateAI Brain.",
    channel = "email",
  } = req.body as {
    emails?: string[];
    phones?: string[];
    subject?: string;
    body?: string;
    channel?: "email" | "sms" | "both";
  };

  const results: { channel: string; successCount: number; total: number }[] = [];

  if ((channel === "email" || channel === "both") && emails.length > 0) {
    const r = await sendEmailNotification(emails, subject, `<p>${body}</p>`);
    console.log(`[Alerts] Digest email — ${r.successCount}/${r.total} delivered`);
    results.push({ channel: "email", successCount: r.successCount, total: r.total });
  }

  if ((channel === "sms" || channel === "both") && phones.length > 0) {
    const r = await sendSMSNotification(phones, body);
    console.log(`[Alerts] Digest SMS — ${r.successCount}/${r.total} delivered`);
    results.push({ channel: "sms", successCount: r.successCount, total: r.total });
  }

  if (results.length === 0) {
    res.status(400).json({ error: "No valid recipients — provide emails[] and/or phones[] matching the channel" });
    return;
  }

  res.json({ ok: true, results });
});

// ── GET /api/alerts/recent ────────────────────────────────────────────────────
// Returns the 20 most recent high-value webhook events for the admin alert feed.

router.get("/recent", async (req: Request, res: Response) => {
  if (!requireAdminOrFounder(req, res)) return;

  const sql = getSql();
  try {
    const rows = await sql`
      SELECT event_type, payload, created_at
      FROM platform_webhook_events
      WHERE event_type IN (
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.deleted',
        'invoice.payment_failed'
      )
      ORDER BY created_at DESC
      LIMIT 20
    `;
    res.json({ ok: true, events: rows });
  } catch {
    res.json({ ok: true, events: [] });
  }
});

export default router;
