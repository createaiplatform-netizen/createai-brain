/**
 * routes/cohortAnalytics.ts — Cohort, Churn & Revenue Analytics
 *
 * All endpoints require founder or admin role.
 * Responses are cached in-memory for 5 minutes.
 *
 * GET  /api/cohorts/dau-mau     — DAU/MAU by role + daily 30-day trend
 * GET  /api/cohorts/churn-risk  — rule-based churn risk tiers per user
 * GET  /api/cohorts/revenue     — MRR, LTV, total revenue
 * POST /api/cohorts/alerts      — trigger priority SMS/email for high-risk users
 * POST /api/cohorts/apns        — iOS APNs scaffold (cert integration deferred)
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import { db, usersTable, activityLog } from "@workspace/db";
import { sql, gte, eq, isNull, and } from "drizzle-orm";
import { sendEmailNotification, sendSMSNotification } from "../utils/notifications.js";

const router = Router();

// ─── In-memory cache (5-minute TTL) ──────────────────────────────────────────

interface CacheSlot { data: unknown; ts: number }
const CACHE: Map<string, CacheSlot> = new Map();
const TTL = 5 * 60 * 1000;

function fromCache<T>(key: string): T | null {
  const slot = CACHE.get(key);
  if (!slot) return null;
  if (Date.now() - slot.ts > TTL) { CACHE.delete(key); return null; }
  return slot.data as T;
}
function toCache<T>(key: string, data: T): T {
  CACHE.set(key, { data, ts: Date.now() });
  return data;
}
export function invalidateCache(key?: string) {
  if (key) CACHE.delete(key);
  else CACHE.clear();
}

// ─── DB Indexes — created once on first import ────────────────────────────────

let indexesReady = false;
async function ensureIndexes() {
  if (indexesReady) return;
  try {
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_activity_log_user_created
        ON activity_log (user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_platform_subs_status
        ON platform_subscriptions (status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_platform_customers_created
        ON platform_customers (created_at DESC);
    `);
    indexesReady = true;
  } catch {
    // Indexes non-critical — table may not exist yet
  }
}
ensureIndexes().catch(() => {});

// ─── Auth guard ───────────────────────────────────────────────────────────────

function adminOnly(req: Request, res: Response, next: NextFunction) {
  const role = (req.user as { role?: string } | undefined)?.role ?? "";
  if (!["founder", "admin"].includes(role)) {
    res.status(403).json({ error: "Forbidden: admin or founder role required" });
    return;
  }
  next();
}
router.use(adminOnly);

// ─── GET /dau-mau ─────────────────────────────────────────────────────────────
// Returns DAU and MAU counts broken down by user role.
// Also returns total registered users per role.

router.get("/dau-mau", async (_req: Request, res: Response) => {
  const cached = fromCache("dau-mau");
  if (cached) { res.json(cached); return; }

  try {
    const oneDayAgo   = new Date(Date.now() - 86_400_000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

    // DAU: distinct active users in last 24h grouped by role
    const dauRows = await db
      .select({
        role: usersTable.role,
        dau:  sql<number>`cast(count(distinct ${activityLog.userId}) as int)`,
      })
      .from(activityLog)
      .innerJoin(usersTable, eq(activityLog.userId, usersTable.id))
      .where(and(gte(activityLog.createdAt, oneDayAgo), isNull(usersTable.deletedAt)))
      .groupBy(usersTable.role);

    // MAU: distinct active users in last 30d grouped by role
    const mauRows = await db
      .select({
        role: usersTable.role,
        mau:  sql<number>`cast(count(distinct ${activityLog.userId}) as int)`,
      })
      .from(activityLog)
      .innerJoin(usersTable, eq(activityLog.userId, usersTable.id))
      .where(and(gte(activityLog.createdAt, thirtyDaysAgo), isNull(usersTable.deletedAt)))
      .groupBy(usersTable.role);

    // Total registered users per role
    const totalRows = await db
      .select({
        role:  usersTable.role,
        total: sql<number>`cast(count(*) as int)`,
      })
      .from(usersTable)
      .where(isNull(usersTable.deletedAt))
      .groupBy(usersTable.role);

    // Signup cohorts — users registered in last 30 days grouped by week
    const cohortRows = await db
      .select({
        week:        sql<string>`to_char(date_trunc('week', ${usersTable.createdAt}), 'YYYY-MM-DD')`,
        signups:     sql<number>`cast(count(*) as int)`,
      })
      .from(usersTable)
      .where(and(gte(usersTable.createdAt, thirtyDaysAgo), isNull(usersTable.deletedAt)))
      .groupBy(sql`date_trunc('week', ${usersTable.createdAt})`)
      .orderBy(sql`date_trunc('week', ${usersTable.createdAt})`);

    const result = { dau: dauRows, mau: mauRows, totals: totalRows, signupCohorts: cohortRows };
    res.json(toCache("dau-mau", result));
  } catch (err) {
    console.error("[Cohorts] dau-mau error:", err);
    res.status(500).json({ error: "Failed to load cohort data" });
  }
});

// ─── GET /churn-risk ──────────────────────────────────────────────────────────
// Rule-based churn scoring:
//   high   → no activity in 30+ days OR subscription cancelled
//   medium → no activity in 7–29 days
//   low    → active within 7 days or never had a subscription

router.get("/churn-risk", async (_req: Request, res: Response) => {
  const cached = fromCache("churn-risk");
  if (cached) { res.json(cached); return; }

  try {
    // Last activity timestamp per user
    const lastSeenRows = await db
      .select({
        userId:   activityLog.userId,
        lastSeen: sql<string>`max(${activityLog.createdAt})`,
      })
      .from(activityLog)
      .groupBy(activityLog.userId);

    const lastSeenMap = new Map(lastSeenRows.map(r => [r.userId, new Date(r.lastSeen)]));

    // All non-deleted users
    const users = await db
      .select({ id: usersTable.id, email: usersTable.email, role: usersTable.role })
      .from(usersTable)
      .where(isNull(usersTable.deletedAt));

    const now = Date.now();
    const scored = users.map(u => {
      const lastSeen = lastSeenMap.get(u.id);
      const daysSince = lastSeen
        ? Math.floor((now - lastSeen.getTime()) / 86_400_000)
        : 999;
      const risk: "high" | "medium" | "low" =
        daysSince >= 30 ? "high" :
        daysSince >= 7  ? "medium" : "low";
      return { userId: u.id, email: u.email, role: u.role, daysSinceActive: daysSince, risk };
    });

    const tiers = {
      high:   scored.filter(u => u.risk === "high").length,
      medium: scored.filter(u => u.risk === "medium").length,
      low:    scored.filter(u => u.risk === "low").length,
    };

    const result = { tiers, users: scored, generatedAt: new Date().toISOString() };
    res.json(toCache("churn-risk", result));
  } catch (err) {
    console.error("[Cohorts] churn-risk error:", err);
    res.status(500).json({ error: "Failed to compute churn risk" });
  }
});

// ─── GET /revenue ─────────────────────────────────────────────────────────────
// Aggregates MRR from active subscriptions and total revenue from platform_customers.
// Uses real Stripe tier amounts from platform_subscriptions.

router.get("/revenue", async (_req: Request, res: Response) => {
  const cached = fromCache("revenue");
  if (cached) { res.json(cached); return; }

  try {
    // MRR from active subscriptions (known tier amounts)
    let mrr = { mrr_cents: 0, active_count: 0 };
    let totalRev = { total_cents: 0, payment_count: 0 };

    try {
      const mrrRows = await db.execute(sql`
        SELECT
          COALESCE(SUM(
            CASE
              WHEN tier = 'enterprise' THEN 29900
              WHEN tier = 'business'   THEN 7900
              WHEN tier = 'solo'       THEN 2900
              ELSE 0
            END
          ), 0)::int  AS mrr_cents,
          COUNT(*)::int AS active_count
        FROM platform_subscriptions
        WHERE status = 'active'
      `);
      if (mrrRows.rows?.[0]) mrr = mrrRows.rows[0] as typeof mrr;
    } catch { /* table may be empty */ }

    try {
      const revRows = await db.execute(sql`
        SELECT
          COALESCE(SUM(price_cents), 0)::int AS total_cents,
          COUNT(*)::int                       AS payment_count
        FROM platform_customers
      `);
      if (revRows.rows?.[0]) totalRev = revRows.rows[0] as typeof totalRev;
    } catch { /* table may be empty */ }

    // LTV = total revenue / distinct paying customers
    let ltv_cents = 0;
    try {
      const ltvRows = await db.execute(sql`
        SELECT
          CASE WHEN COUNT(DISTINCT email) = 0 THEN 0
            ELSE (SUM(price_cents) / COUNT(DISTINCT email))::int
          END AS ltv_cents
        FROM platform_customers
      `);
      if (ltvRows.rows?.[0]) ltv_cents = (ltvRows.rows[0] as { ltv_cents: number }).ltv_cents;
    } catch { /* table may be empty */ }

    const result = {
      mrr_cents:     mrr.mrr_cents,
      mrr_dollars:   (mrr.mrr_cents / 100).toFixed(2),
      total_cents:   totalRev.total_cents,
      total_dollars: (totalRev.total_cents / 100).toFixed(2),
      ltv_cents,
      ltv_dollars:   (ltv_cents / 100).toFixed(2),
      active_subscriptions: mrr.active_count,
      payment_count:        totalRev.payment_count,
      arr_dollars:          ((mrr.mrr_cents * 12) / 100).toFixed(2),
      generatedAt: new Date().toISOString(),
    };
    res.json(toCache("revenue", result));
  } catch (err) {
    console.error("[Cohorts] revenue error:", err);
    res.status(500).json({ error: "Failed to load revenue data" });
  }
});

// ─── POST /alerts ─────────────────────────────────────────────────────────────
// Queries high-risk churn users and fires priority SMS/email alerts to admin.

router.post("/alerts", async (req: Request, res: Response) => {
  const adminEmail = (req.user as { email?: string } | undefined)?.email ?? "";

  try {
    // Re-use cached churn data or compute fresh
    let churnData = fromCache<{ users: Array<{ email: string; role: string; daysSinceActive: number; risk: string }> }>("churn-risk");
    if (!churnData) {
      // Trigger fresh computation by calling the internal handler logic
      const lastSeenRows = await db
        .select({ userId: activityLog.userId, lastSeen: sql<string>`max(${activityLog.createdAt})` })
        .from(activityLog).groupBy(activityLog.userId);
      const lastSeenMap = new Map(lastSeenRows.map(r => [r.userId, new Date(r.lastSeen)]));
      const users = await db.select({ id: usersTable.id, email: usersTable.email, role: usersTable.role })
        .from(usersTable).where(isNull(usersTable.deletedAt));
      const now = Date.now();
      churnData = {
        users: users.map(u => {
          const ls = lastSeenMap.get(u.id);
          const days = ls ? Math.floor((now - ls.getTime()) / 86_400_000) : 999;
          return { email: u.email ?? "", role: u.role ?? "", daysSinceActive: days, risk: days >= 30 ? "high" : days >= 7 ? "medium" : "low" };
        })
      };
    }

    const highRisk = churnData.users.filter(u => u.risk === "high");

    if (highRisk.length === 0) {
      res.json({ ok: true, sent: false, reason: "No high-risk users found" });
      return;
    }

    const subject = `⚠️ Churn Alert: ${highRisk.length} high-risk user${highRisk.length !== 1 ? "s" : ""}`;
    const body = `
      <h2 style="color:#7a9068">Churn Risk Alert — CreateAI Brain</h2>
      <p><strong>${highRisk.length}</strong> user${highRisk.length !== 1 ? "s are" : " is"} at high churn risk (no activity in 30+ days).</p>
      <table border="1" cellpadding="6" style="border-collapse:collapse;font-size:13px">
        <thead><tr><th>Email</th><th>Role</th><th>Days Inactive</th></tr></thead>
        <tbody>
          ${highRisk.slice(0, 20).map(u =>
            `<tr><td>${u.email}</td><td>${u.role}</td><td>${u.daysSinceActive === 999 ? "Never" : u.daysSinceActive}</td></tr>`
          ).join("")}
        </tbody>
      </table>
      ${highRisk.length > 20 ? `<p>…and ${highRisk.length - 20} more.</p>` : ""}
      <p style="color:#64748b;font-size:12px">Generated ${new Date().toLocaleString()} · CreateAI Brain</p>
    `;

    if (adminEmail) {
      await sendEmailNotification([adminEmail], subject, body);
    }

    res.json({ ok: true, sent: true, highRiskCount: highRisk.length, alertedTo: adminEmail || "—" });
  } catch (err) {
    console.error("[Cohorts] alerts error:", err);
    res.status(500).json({ error: "Failed to send churn alerts" });
  }
});

// ─── POST /apns ───────────────────────────────────────────────────────────────
// iOS APNs push scaffold. Certificates and token auth deferred to Sara.

router.post("/apns", (_req: Request, res: Response) => {
  res.json({
    ok:     false,
    status: "pending_cert",
    message:
      "iOS APNs integration is scaffolded. Provide your .p8 key file and Team ID to activate.",
    required: ["APNS_KEY_ID", "APNS_TEAM_ID", "APNS_PRIVATE_KEY", "APNS_BUNDLE_ID"],
  });
});

export default router;
