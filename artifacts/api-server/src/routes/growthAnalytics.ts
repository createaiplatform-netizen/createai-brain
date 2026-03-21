/**
 * routes/growthAnalytics.ts — Internal Analytics Engine
 *
 * Replaces Google Analytics entirely. Zero external dependencies.
 * All data stored in your own PostgreSQL database.
 *
 * POST /api/analytics/pageview — public, fire-and-forget pixel
 * GET  /api/analytics/overview — admin: full growth dashboard data
 * GET  /api/analytics/by-industry — traffic broken down by landing page
 * GET  /api/analytics/by-source — traffic by UTM source
 */

import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { pageViews, leads, referrals } from "@workspace/db/schema";
import { desc, sql, gte, eq } from "drizzle-orm";

const router = Router();

// ─── POST /api/analytics/pageview ────────────────────────────────────────────
// Public — fire from SEO landing pages. No auth required.

router.post("/pageview", async (req: Request, res: Response) => {
  const { path, industry, refCode, utmSource, utmMedium, utmCampaign, sessionId, referrer } =
    req.body as {
      path?: string; industry?: string; refCode?: string;
      utmSource?: string; utmMedium?: string; utmCampaign?: string;
      sessionId?: string; referrer?: string;
    };

  if (!path) { res.json({ ok: true }); return; }

  try {
    await db.insert(pageViews).values({
      path:        String(path).slice(0, 500),
      industry:    industry ?? null,
      refCode:     refCode ?? null,
      utmSource:   utmSource ?? null,
      utmMedium:   utmMedium ?? null,
      utmCampaign: utmCampaign ?? null,
      sessionId:   sessionId ?? null,
      referrer:    referrer ? String(referrer).slice(0, 500) : null,
    });
  } catch (err) {
    console.error("[Analytics] pageview error:", err instanceof Error ? err.message : String(err));
  }

  res.json({ ok: true });
});

// ─── GET /api/analytics/overview ─────────────────────────────────────────────

router.get("/overview", async (_req: Request, res: Response) => {
  const now = Date.now();
  const day  = 86_400_000;

  const [totalViews]    = await db.select({ count: sql<number>`count(*)::int` }).from(pageViews);
  const [todayViews]    = await db.select({ count: sql<number>`count(*)::int` }).from(pageViews).where(gte(pageViews.createdAt, new Date(now - day)));
  const [weekViews]     = await db.select({ count: sql<number>`count(*)::int` }).from(pageViews).where(gte(pageViews.createdAt, new Date(now - 7 * day)));
  const [totalLeads]    = await db.select({ count: sql<number>`count(*)::int` }).from(leads);
  const [todayLeads]    = await db.select({ count: sql<number>`count(*)::int` }).from(leads).where(gte(leads.createdAt, new Date(now - day)));
  const [weekLeads]     = await db.select({ count: sql<number>`count(*)::int` }).from(leads).where(gte(leads.createdAt, new Date(now - 7 * day)));
  const [totalReferrers] = await db.select({ count: sql<number>`count(*)::int`, clicks: sql<number>`sum(click_count)::int`, converts: sql<number>`sum(convert_count)::int` }).from(referrals);

  const dailyViews = await db
    .select({
      date: sql<string>`date_trunc('day', ${pageViews.createdAt})::date::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, new Date(now - 30 * day)))
    .groupBy(sql`date_trunc('day', ${pageViews.createdAt})`)
    .orderBy(sql`date_trunc('day', ${pageViews.createdAt})`);

  const dailyLeads = await db
    .select({
      date: sql<string>`date_trunc('day', ${leads.createdAt})::date::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(leads)
    .where(gte(leads.createdAt, new Date(now - 30 * day)))
    .groupBy(sql`date_trunc('day', ${leads.createdAt})`)
    .orderBy(sql`date_trunc('day', ${leads.createdAt})`);

  const topPages = await db
    .select({ path: pageViews.path, count: sql<number>`count(*)::int` })
    .from(pageViews)
    .where(gte(pageViews.createdAt, new Date(now - 7 * day)))
    .groupBy(pageViews.path)
    .orderBy(desc(sql<number>`count(*)`))
    .limit(10);

  const topSources = await db
    .select({ source: pageViews.utmSource, count: sql<number>`count(*)::int` })
    .from(pageViews)
    .where(gte(pageViews.createdAt, new Date(now - 7 * day)))
    .groupBy(pageViews.utmSource)
    .orderBy(desc(sql<number>`count(*)`))
    .limit(10);

  res.json({
    ok: true,
    pageViews: {
      total: totalViews?.count ?? 0,
      today: todayViews?.count ?? 0,
      week:  weekViews?.count ?? 0,
    },
    leads: {
      total: totalLeads?.count ?? 0,
      today: todayLeads?.count ?? 0,
      week:  weekLeads?.count ?? 0,
    },
    referrals: {
      totalReferrers: totalReferrers?.count ?? 0,
      totalClicks:    totalReferrers?.clicks ?? 0,
      totalConverts:  totalReferrers?.converts ?? 0,
    },
    charts: {
      dailyViews,
      dailyLeads,
      topPages,
      topSources: topSources.map(s => ({ source: s.source ?? "direct", count: s.count })),
    },
  });
});

// ─── GET /api/analytics/by-industry ──────────────────────────────────────────

router.get("/by-industry", async (_req: Request, res: Response) => {
  const views = await db
    .select({ industry: pageViews.industry, count: sql<number>`count(*)::int` })
    .from(pageViews)
    .where(gte(pageViews.createdAt, new Date(Date.now() - 30 * 86_400_000)))
    .groupBy(pageViews.industry)
    .orderBy(desc(sql<number>`count(*)`));

  const leadsData = await db
    .select({ industry: leads.industry, count: sql<number>`count(*)::int` })
    .from(leads)
    .groupBy(leads.industry)
    .orderBy(desc(sql<number>`count(*)`));

  res.json({ ok: true, views, leads: leadsData });
});

export default router;
