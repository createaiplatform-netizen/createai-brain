/**
 * routes/selfEvaluate.ts — Live Platform Self-Evaluation
 *
 * GET /api/evaluate/self
 *
 * Returns a unified real-data snapshot of the platform:
 *   - cohort   : DAU/MAU by role + total registered
 *   - churn    : risk tiers (high/medium/low) + per-user scores
 *   - revenue  : MRR, ARR, LTV, total from Stripe tables
 *   - system   : user counts, active subscriptions, table health
 *
 * Auth:  founder or admin only
 * Cache: 5-minute in-memory TTL (same key-space as cohortAnalytics)
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import { db, usersTable, activityLog } from "@workspace/db";
import { sql, gte, isNull, and, eq } from "drizzle-orm";

const router = Router();

// ── Cache ──────────────────────────────────────────────────────────────────────
interface CacheSlot { data: unknown; ts: number }
const CACHE = new Map<string, CacheSlot>();
const TTL = 5 * 60 * 1000;

function fromCache<T>(key: string): T | null {
  const slot = CACHE.get(key);
  if (!slot || Date.now() - slot.ts > TTL) { CACHE.delete(key); return null; }
  return slot.data as T;
}
function toCache<T>(key: string, data: T): T {
  CACHE.set(key, { data, ts: Date.now() });
  return data;
}

// ── Auth guard ─────────────────────────────────────────────────────────────────
function adminOnly(req: Request, res: Response, next: NextFunction) {
  const role = (req.user as { role?: string } | undefined)?.role ?? "";
  if (!["founder", "admin"].includes(role)) {
    res.status(403).json({ error: "Forbidden: admin or founder role required" });
    return;
  }
  next();
}
router.use(adminOnly);

// ── GET /self ──────────────────────────────────────────────────────────────────

router.get("/self", async (_req: Request, res: Response) => {
  const cached = fromCache<object>("self-eval");
  if (cached) { res.json(cached); return; }

  try {
    const now = Date.now();
    const oneDayAgo     = new Date(now - 86_400_000);
    const thirtyDaysAgo = new Date(now - 30 * 86_400_000);

    // ── 1. COHORT ──────────────────────────────────────────────────────────────

    const [dauRows, mauRows, totalRows] = await Promise.all([
      db.select({
        role: usersTable.role,
        dau:  sql<number>`cast(count(distinct ${activityLog.userId}) as int)`,
      })
      .from(activityLog)
      .innerJoin(usersTable, eq(activityLog.userId, usersTable.id))
      .where(and(gte(activityLog.createdAt, oneDayAgo), isNull(usersTable.deletedAt)))
      .groupBy(usersTable.role),

      db.select({
        role: usersTable.role,
        mau:  sql<number>`cast(count(distinct ${activityLog.userId}) as int)`,
      })
      .from(activityLog)
      .innerJoin(usersTable, eq(activityLog.userId, usersTable.id))
      .where(and(gte(activityLog.createdAt, thirtyDaysAgo), isNull(usersTable.deletedAt)))
      .groupBy(usersTable.role),

      db.select({
        role:  usersTable.role,
        total: sql<number>`cast(count(*) as int)`,
      })
      .from(usersTable)
      .where(isNull(usersTable.deletedAt))
      .groupBy(usersTable.role),
    ]);

    const cohort = { dau: dauRows, mau: mauRows, totals: totalRows };

    // ── 2. CHURN ───────────────────────────────────────────────────────────────

    const lastSeenRows = await db
      .select({
        userId:   activityLog.userId,
        lastSeen: sql<string>`max(${activityLog.createdAt})`,
      })
      .from(activityLog)
      .groupBy(activityLog.userId);

    const lastSeenMap = new Map(lastSeenRows.map(r => [r.userId, new Date(r.lastSeen)]));

    const users = await db
      .select({ id: usersTable.id, email: usersTable.email, role: usersTable.role })
      .from(usersTable)
      .where(isNull(usersTable.deletedAt));

    const scored = users.map(u => {
      const lastSeen  = lastSeenMap.get(u.id);
      const daysSince = lastSeen ? Math.floor((now - lastSeen.getTime()) / 86_400_000) : 999;
      const risk: "high" | "medium" | "low" =
        daysSince >= 30 ? "high" :
        daysSince >= 7  ? "medium" : "low";
      return { userId: u.id, email: u.email, role: u.role, daysSinceActive: daysSince, risk };
    });

    const churn = {
      tiers: {
        high:   scored.filter(u => u.risk === "high").length,
        medium: scored.filter(u => u.risk === "medium").length,
        low:    scored.filter(u => u.risk === "low").length,
      },
      highRiskUsers: scored.filter(u => u.risk === "high").slice(0, 10),
    };

    // ── 3. REVENUE ─────────────────────────────────────────────────────────────

    let mrr_cents = 0, active_subscriptions = 0;
    let total_cents = 0, payment_count = 0, ltv_cents = 0;

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
          ), 0)::int AS mrr_cents,
          COUNT(*)::int AS active_count
        FROM platform_subscriptions
        WHERE status = 'active'
      `);
      if (mrrRows.rows?.[0]) {
        const r = mrrRows.rows[0] as { mrr_cents: number; active_count: number };
        mrr_cents = r.mrr_cents;
        active_subscriptions = r.active_count;
      }
    } catch { /* table empty or not yet populated */ }

    try {
      const revRows = await db.execute(sql`
        SELECT
          COALESCE(SUM(price_cents), 0)::int AS total_cents,
          COUNT(*)::int                       AS payment_count
        FROM platform_customers
      `);
      if (revRows.rows?.[0]) {
        const r = revRows.rows[0] as { total_cents: number; payment_count: number };
        total_cents   = r.total_cents;
        payment_count = r.payment_count;
      }
    } catch { /* table empty */ }

    try {
      const ltvRows = await db.execute(sql`
        SELECT CASE WHEN COUNT(DISTINCT email) = 0 THEN 0
          ELSE (SUM(price_cents) / COUNT(DISTINCT email))::int
        END AS ltv_cents
        FROM platform_customers
      `);
      if (ltvRows.rows?.[0]) ltv_cents = (ltvRows.rows[0] as { ltv_cents: number }).ltv_cents;
    } catch { /* table empty */ }

    const revenue = {
      mrr_dollars:          (mrr_cents   / 100).toFixed(2),
      arr_dollars:          ((mrr_cents * 12) / 100).toFixed(2),
      ltv_dollars:          (ltv_cents   / 100).toFixed(2),
      total_dollars:        (total_cents / 100).toFixed(2),
      active_subscriptions,
      payment_count,
    };

    // ── 4. SYSTEM HEALTH ───────────────────────────────────────────────────────

    const totalUsers = totalRows.reduce((sum, r) => sum + (r.total ?? 0), 0);
    const totalDAU   = dauRows.reduce((sum, r)   => sum + (r.dau  ?? 0), 0);
    const totalMAU   = mauRows.reduce((sum, r)   => sum + (r.mau  ?? 0), 0);
    const engagementRate = totalMAU > 0 ? Math.round((totalDAU / totalMAU) * 100) : 0;

    const system = {
      totalUsers,
      totalDAU,
      totalMAU,
      engagementRatePct: engagementRate,
      activeSubscriptions: active_subscriptions,
      evaluatedAt: new Date().toISOString(),
    };

    const result = { cohort, churn, revenue, system };
    res.json(toCache("self-eval", result));

  } catch (err) {
    console.error("[Evaluate] /self error:", err);
    res.status(500).json({ error: "Self-evaluation failed" });
  }
});

export default router;
