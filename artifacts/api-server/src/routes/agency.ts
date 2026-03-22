// ─── Agency Center API ────────────────────────────────────────────────────────
// Admin-only API for the Platform Agency Layer.
// Provides:
//   GET  /api/agency/identity   — current platform identity
//   GET  /api/agency/log        — platform_outbound_log entries
//   GET  /api/agency/stats      — aggregate outbound stats
//   POST /api/agency/test-send  — send a safe test message
//
// All routes require admin or founder role.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db";
import { PLATFORM, getSenderAddress } from "../services/platformIdentity";
import { outboundEngine } from "../services/outboundEngine";
import { requireAdminOrFounder } from "../services/safetyGuard";
import { brandHtmlWrapper } from "../services/marketingKit";

const router = Router();

// ── GET /api/agency/identity ──────────────────────────────────────────────────
// Returns the current platform identity configuration.
router.get("/identity", async (req: Request, res: Response) => {
  if (!(await requireAdminOrFounder(req, res))) return;

  res.json({
    identity: {
      displayName:      PLATFORM.displayName,
      companyName:      PLATFORM.companyName,
      senderName:       PLATFORM.senderName,
      senderEmail:      getSenderAddress(),
      supportEmail:     PLATFORM.supportEmail,
      supportUrl:       PLATFORM.supportUrl,
      publicContact:    PLATFORM.publicContact,
      domain:           PLATFORM.domain,
      phonePlaceholder: PLATFORM.phonePlaceholder,
      brandColor:       PLATFORM.brandColor,
      legalNotice:      PLATFORM.legalNotice,
    },
  });
});

// ── GET /api/agency/log ───────────────────────────────────────────────────────
// Returns recent platform_outbound_log entries with optional filters.
// Query params: limit, channel, type, status, userId
router.get("/log", async (req: Request, res: Response) => {
  if (!(await requireAdminOrFounder(req, res))) return;

  const sql   = getSql();
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const { channel, type, status, userId } = req.query as Record<string, string | undefined>;

  const rows = await sql`
    SELECT
      l.*,
      u.email AS user_email,
      u.first_name AS user_first_name
    FROM platform_outbound_log l
    LEFT JOIN users u ON u.id = l.user_id
    WHERE TRUE
      ${channel ? sql`AND l.channel = ${channel}` : sql``}
      ${type    ? sql`AND l.type    = ${type}`    : sql``}
      ${status  ? sql`AND l.status  = ${status}`  : sql``}
      ${userId  ? sql`AND l.user_id = ${userId}`  : sql``}
    ORDER BY l.timestamp DESC
    LIMIT ${limit}
  `;

  const [countRow] = await sql`SELECT COUNT(*)::int AS total FROM platform_outbound_log`;

  res.json({ log: rows, total: countRow?.["total"] ?? 0, limit });
});

// ── GET /api/agency/stats ─────────────────────────────────────────────────────
// Returns aggregate outbound stats for the Agency Center overview.
router.get("/stats", async (req: Request, res: Response) => {
  if (!(await requireAdminOrFounder(req, res))) return;

  const sql = getSql();

  const [totals] = await sql`
    SELECT
      COUNT(*)::int                                        AS total_sent,
      COUNT(*) FILTER (WHERE status = 'sent')::int        AS succeeded,
      COUNT(*) FILTER (WHERE status = 'failed')::int      AS failed,
      COUNT(*) FILTER (WHERE channel = 'email')::int      AS via_email,
      COUNT(*) FILTER (WHERE channel = 'in-app')::int     AS via_in_app,
      COUNT(*) FILTER (WHERE channel = 'notification')::int AS via_notification
    FROM platform_outbound_log
  `;

  const byType = await sql`
    SELECT type, COUNT(*)::int AS count, MAX(timestamp) AS last_sent
    FROM platform_outbound_log
    GROUP BY type ORDER BY count DESC LIMIT 20
  `;

  // Signals: counts by channel for last 24h and last 7d
  const signals24h = await sql`
    SELECT
      channel,
      COUNT(*)::int AS count,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS errors
    FROM platform_outbound_log
    WHERE timestamp > NOW() - INTERVAL '24 hours'
    GROUP BY channel ORDER BY count DESC
  `;

  const signals7d = await sql`
    SELECT
      channel,
      COUNT(*)::int AS count,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS errors
    FROM platform_outbound_log
    WHERE timestamp > NOW() - INTERVAL '7 days'
    GROUP BY channel ORDER BY count DESC
  `;

  // Recent errors with context
  const recentErrors = await sql`
    SELECT id, type, channel, error_message, timestamp
    FROM platform_outbound_log
    WHERE status = 'failed'
    ORDER BY timestamp DESC LIMIT 10
  `;

  const recent24h = await sql`
    SELECT COUNT(*)::int AS count FROM platform_outbound_log
    WHERE timestamp > NOW() - INTERVAL '24 hours'
  `;

  res.json({
    totals: {
      total:           totals?.["total_sent"]      ?? 0,
      succeeded:       totals?.["succeeded"]        ?? 0,
      failed:          totals?.["failed"]           ?? 0,
      viaEmail:        totals?.["via_email"]        ?? 0,
      viaInApp:        totals?.["via_in_app"]       ?? 0,
      viaNotification: totals?.["via_notification"] ?? 0,
    },
    last24h:     recent24h[0]?.["count"] ?? 0,
    byType,
    signals24h,
    signals7d,
    recentErrors,
  });
});

// ── POST /api/agency/test-send ────────────────────────────────────────────────
// Sends a safe test message through the outbound engine.
// Body: { channel, to, subject?, body? }
router.post("/test-send", async (req: Request, res: Response) => {
  if (!(await requireAdminOrFounder(req, res))) return;

  const { channel, to, subject, body } = req.body as {
    channel?: string;
    to?:      string;
    subject?: string;
    body?:    string;
  };

  if (!channel || !to) {
    res.status(400).json({ error: "channel and to are required" });
    return;
  }

  const ALLOWED_CHANNELS = ["email", "notification"];
  if (!ALLOWED_CHANNELS.includes(channel)) {
    res.status(400).json({ error: `Test send only supports channels: ${ALLOWED_CHANNELS.join(", ")}` });
    return;
  }

  const testBody = body ?? `Test message from the Platform Agency Center. Sent: ${new Date().toISOString()}.`;
  const testSubject = subject ?? `Test — ${PLATFORM.displayName} Agency Center`;

  const htmlBody = channel === "email"
    ? brandHtmlWrapper(`
        <p style="font-size:18px;font-weight:900;margin:0 0 12px;">Test Message</p>
        <p style="margin:0 0 20px;">${testBody}</p>
        <p style="font-size:12px;color:#6b6660;">This is a test message sent from the Admin Agency Center.</p>
      `, { title: testSubject })
    : testBody;

  const actor = req.user as { id: string };
  const result = await outboundEngine.send({
    type:     "test",
    channel:  channel as "email" | "notification",
    to,
    userId:   channel === "notification" ? to : undefined,
    role:     "admin",
    universe: "admin",
    subject:  testSubject,
    body:     htmlBody,
    metadata: { sentByAdmin: actor.id, isTest: true },
  });

  res.json({ result });
});

export default router;
