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

// ─── GET /api/analytics/dashboard ────────────────────────────────────────────
// HTML dashboard — auto-fetches /api/analytics/overview for live data

router.get("/dashboard", (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Analytics Dashboard — CreateAI Brain</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#020617;--s1:#0d1526;--s2:#111827;--s3:#1e293b;--s4:#243044;
          --line:#1e293b;--line2:#2d3748;
          --t1:#e2e8f0;--t2:#94a3b8;--t3:#64748b;--t4:#475569;
          --ind:#6366f1;--ind2:#818cf8;--em:#10b981;--am:#f59e0b;--re:#f87171;}
    html,body{background:var(--bg);color:var(--t1);font-family:'Inter',-apple-system,sans-serif;font-size:14px;min-height:100vh;-webkit-font-smoothing:antialiased}
    a{color:inherit;text-decoration:none}
    .skip-link{position:absolute;top:-100px;left:1rem;background:var(--ind);color:#fff;padding:.4rem 1rem;border-radius:6px;font-weight:700;z-index:999;transition:top .2s}
    .skip-link:focus{top:1rem}
    .hdr{border-bottom:1px solid var(--line);padding:0 24px;background:rgba(2,6,23,.97);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
    .hdr-inner{max-width:1280px;margin:0 auto;height:52px;display:flex;align-items:center;gap:14px}
    .logo{font-size:.95rem;font-weight:900;letter-spacing:-.03em}
    .logo span{color:var(--ind2)}
    .hdr-badge{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;background:rgba(99,102,241,.15);color:var(--ind2);border:1px solid rgba(99,102,241,.3);border-radius:99px;padding:3px 10px}
    .hdr-links{margin-left:auto;display:flex;gap:16px;align-items:center}
    .hdr-links a{color:var(--t3);font-size:.78rem;font-weight:600;transition:color .15s}
    .hdr-links a:hover{color:var(--t1)}
    .refresh-note{font-size:.65rem;color:var(--t4)}
    .wrap{max-width:1280px;margin:0 auto;padding:32px 24px}
    .page-title{font-size:1.5rem;font-weight:900;letter-spacing:-.04em;margin-bottom:4px}
    .page-title span{color:var(--ind2)}
    .page-sub{font-size:.85rem;color:var(--t3);margin-bottom:28px}
    .loading{text-align:center;padding:48px;color:var(--t4);font-size:.88rem}
    .spinner{display:inline-block;width:20px;height:20px;border:2px solid var(--s3);border-top-color:var(--ind);border-radius:50%;animation:spin 0.8s linear infinite;margin-right:8px;vertical-align:middle}
    @keyframes spin{to{transform:rotate(360deg)}}
    .kpi-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-bottom:32px}
    .kpi{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:18px 20px}
    .kpi-lbl{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:var(--t4);margin-bottom:8px}
    .kpi-val{font-size:1.8rem;font-weight:900;letter-spacing:-.04em;color:var(--ind2)}
    .kpi-sub{font-size:.68rem;color:var(--t3);margin-top:4px}
    .kpi.green .kpi-val{color:#34d399}
    .kpi.amber .kpi-val{color:#fbbf24}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px}
    .panel{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:20px}
    .panel-title{font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--t4);margin-bottom:16px}
    .chart-wrap{height:100px;display:flex;align-items:flex-end;gap:3px;overflow:hidden}
    .bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0}
    .bar-fill{width:100%;background:rgba(99,102,241,.5);border-radius:3px 3px 0 0;min-height:2px;transition:background .15s}
    .bar-fill:hover{background:rgba(99,102,241,.85)}
    .bar-lbl{font-size:.55rem;color:var(--t4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;text-align:center}
    .row-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:.78rem}
    .row-item:last-child{border-bottom:none}
    .ri-bar{height:4px;background:var(--ind);border-radius:2px;margin-top:2px;flex-shrink:0}
    .ri-label{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .ri-cnt{font-size:.8rem;font-weight:700;color:var(--t2);white-space:nowrap;flex-shrink:0}
    .empty{color:var(--t4);font-size:.78rem;text-align:center;padding:24px;font-style:italic}
    .full-row{grid-column:1/-1}
    .error-state{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:12px;padding:16px;color:var(--re);font-size:.82rem;margin-bottom:24px}
    .last-up{font-size:.65rem;color:var(--t4);text-align:right;margin-top:12px}
    footer{border-top:1px solid var(--line);padding:20px 24px;text-align:center;font-size:.7rem;color:var(--t4)}
    @media(max-width:768px){.two-col{grid-template-columns:1fr}.kpi-row{grid-template-columns:repeat(2,1fr)}.wrap{padding:20px 16px}}
  </style>
</head>
<body>
<a class="skip-link" href="#main-content">Skip to content</a>
<header class="hdr" role="banner">
  <div class="hdr-inner">
    <a class="logo" href="/hub">CreateAI <span>Brain</span></a>
    <span class="hdr-badge">Analytics</span>
    <nav class="hdr-links" aria-label="Navigation">
      <a href="/hub">Hub</a>
      <a href="/pulse">PULSE</a>
      <a href="/api/analytics/overview">JSON</a>
      <span class="refresh-note" id="refresh-note">Loading…</span>
    </nav>
  </div>
</header>

<main id="main-content" class="wrap">
  <h1 class="page-title">Analytics <span>Dashboard</span></h1>
  <p class="page-sub">Platform growth intelligence — pageviews, leads, referrals, and traffic sources. Real data only.</p>
  <div id="error-banner" class="error-state" style="display:none" role="alert"></div>
  <div id="loading" class="loading"><span class="spinner"></span>Fetching live data…</div>
  <div id="content" style="display:none">
    <div class="kpi-row" id="kpi-row" role="list" aria-label="Key metrics"></div>
    <div class="two-col">
      <div class="panel">
        <div class="panel-title">Daily Pageviews — Last 30 Days</div>
        <div class="chart-wrap" id="chart-views"></div>
      </div>
      <div class="panel">
        <div class="panel-title">Daily Leads — Last 30 Days</div>
        <div class="chart-wrap" id="chart-leads"></div>
      </div>
      <div class="panel">
        <div class="panel-title">Top Pages — Last 7 Days</div>
        <div id="top-pages"></div>
      </div>
      <div class="panel">
        <div class="panel-title">Traffic Sources — Last 7 Days</div>
        <div id="top-sources"></div>
      </div>
    </div>
    <div class="last-up" id="last-up"></div>
  </div>
</main>

<footer class="footer" role="contentinfo">
  CreateAI Brain · Analytics Dashboard · Internal Use Only
</footer>

<script>
function fmt(n){return n>=1000?(n/1000).toFixed(1)+'k':n}
function renderKpi(label,val,sub,cls=''){
  return \`<div class="kpi \${cls}" role="listitem"><div class="kpi-lbl">\${label}</div><div class="kpi-val">\${fmt(val)}</div><div class="kpi-sub">\${sub}</div></div>\`;
}
function renderBar(items,maxVal){
  if(!items||!items.length)return'<div class="empty">No data yet</div>';
  const m=maxVal||Math.max(...items.map(i=>i.count||0))||1;
  return items.map(i=>{
    const pct=Math.max(4,Math.round((i.count/m)*100));
    const lbl=(i.date||'').slice(5)||'';
    return \`<div class="bar-col" title="\${i.date||''}: \${i.count}"><div class="bar-fill" style="height:\${pct}px"></div><div class="bar-lbl">\${lbl}</div></div>\`;
  }).join('');
}
function renderRows(items,key,countKey){
  if(!items||!items.length)return'<div class="empty">No data yet</div>';
  const m=Math.max(...items.map(i=>i[countKey]||0))||1;
  return items.map(i=>{
    const pct=Math.round((i[countKey]/m)*60);
    return \`<div class="row-item"><div class="ri-label" title="\${i[key]||''}">\${i[key]||'—'}<div class="ri-bar" style="width:\${pct}px"></div></div><span class="ri-cnt">\${fmt(i[countKey])}</span></div>\`;
  }).join('');
}
async function load(){
  try{
    const r=await fetch('/api/analytics/overview');
    if(!r.ok)throw new Error('HTTP '+r.status);
    const d=await r.json();
    document.getElementById('loading').style.display='none';
    document.getElementById('content').style.display='block';
    document.getElementById('refresh-note').textContent='Loaded '+new Date().toLocaleTimeString();
    const kpi=document.getElementById('kpi-row');
    kpi.innerHTML=[
      renderKpi('Total Pageviews',d.pageViews?.total??0,'All time'),
      renderKpi('Today',d.pageViews?.today??0,'Pageviews'),
      renderKpi('This Week',d.pageViews?.week??0,'Pageviews'),
      renderKpi('Total Leads',d.leads?.total??0,'All time','green'),
      renderKpi('Today',d.leads?.today??0,'New leads','green'),
      renderKpi('This Week',d.leads?.week??0,'New leads','green'),
      renderKpi('Referrers',d.referrals?.totalReferrers??0,'Active links','amber'),
      renderKpi('Ref Clicks',d.referrals?.totalClicks??0,'All time','amber'),
      renderKpi('Converts',d.referrals?.totalConverts??0,'Via referral','amber'),
    ].join('');
    const views=d.charts?.dailyViews||[];
    const leads_=d.charts?.dailyLeads||[];
    const mv=Math.max(...views.map(i=>i.count||0),1);
    const ml=Math.max(...leads_.map(i=>i.count||0),1);
    document.getElementById('chart-views').innerHTML=renderBar(views,mv);
    document.getElementById('chart-leads').innerHTML=renderBar(leads_,ml);
    document.getElementById('top-pages').innerHTML=renderRows(d.charts?.topPages||[],'path','count');
    document.getElementById('top-sources').innerHTML=renderRows(d.charts?.topSources||[],'source','count');
    document.getElementById('last-up').textContent='Last updated: '+new Date().toLocaleString();
  }catch(e){
    document.getElementById('loading').style.display='none';
    const eb=document.getElementById('error-banner');
    eb.textContent='Could not load analytics data: '+e.message;
    eb.style.display='block';
  }
}
load();
// Auto-refresh every 60s
setInterval(load,60000);
</script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.send(html);
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
