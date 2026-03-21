/**
 * routes/pulse.ts — PULSE Real-Time Platform Awareness Engine
 * ────────────────────────────────────────────────────────────
 * PULSE is the living heartbeat of the CreateAI Brain platform.
 * It aggregates every data signal — revenue, customers, catalog, health,
 * webhook events, AI usage — into a single unified real-time surface.
 *
 * GET /pulse         → PULSE dashboard (HTML, auto-refreshes 15s)
 * GET /pulse/json    → Raw PULSE data (JSON, used by dashboard)
 */

import { Router, type Request, type Response } from "express";
import {
  getCustomerStats,
  getRecentCustomers,
  getRevenueTimeline,
  getRecentWebhookEvents,
  getSql,
} from "../lib/db.js";
import { getRegistry } from "../semantic/registry.js";
import { getUncachableStripeClient } from "../services/integrations/stripeClient.js";
import { getPublicBaseUrl } from "../utils/publicUrl.js";

const router = Router();
const BASE     = getPublicBaseUrl();
const IS_PROD  = process.env["REPLIT_DEPLOYMENT"] === "1";
const START_MS = Date.now();

// ── JSON data endpoint ────────────────────────────────────────────────────────
router.get("/json", async (_req: Request, res: Response) => {
  const t0 = Date.now();
  const errors: string[] = [];

  const [stats, recent, timeline, webhooks, products] = await Promise.allSettled([
    getCustomerStats(),
    getRecentCustomers(10),
    getRevenueTimeline(),
    getRecentWebhookEvents(8),
    getRegistry(),
  ]);

  // Stripe balance
  let stripeBalance = 0;
  try {
    const stripe  = await getUncachableStripeClient();
    const balance = await stripe.balance.retrieve();
    stripeBalance = balance.available.reduce((s, a) => s + a.amount, 0);
  } catch (e) {
    errors.push("stripe:" + (e instanceof Error ? e.message : String(e)));
  }

  // DB ping
  let dbOk = false;
  try {
    const sql = getSql();
    await sql`SELECT 1`;
    dbOk = true;
  } catch { /* already captured */ }

  const customerStats  = stats.status === "fulfilled" ? stats.value : null;
  const recentList     = recent.status === "fulfilled" ? recent.value : [];
  const revenueData    = timeline.status === "fulfilled" ? timeline.value : [];
  const webhookData    = webhooks.status === "fulfilled" ? webhooks.value : [];
  const catalogList    = products.status === "fulfilled" ? products.value : [];

  const totalRevenueCents = customerStats?.totalRevenueCents ?? 0;
  const todayKey = new Date().toISOString().split("T")[0];
  const todayRevenue = revenueData.find(d => d.date === todayKey)?.revenue ?? 0;
  const weekRevenue = revenueData.slice(-7).reduce((s, d) => s + d.revenue, 0);

  const formatCounts = catalogList.reduce<Record<string, number>>((acc, p) => {
    acc[p.format] = (acc[p.format] ?? 0) + 1;
    return acc;
  }, {});

  res.json({
    ok:            true,
    timestamp:     new Date().toISOString(),
    uptimeSecs:    Math.round((Date.now() - START_MS) / 1000),
    latencyMs:     Date.now() - t0,
    mode:          IS_PROD ? "production" : "development",
    health: {
      db:          dbOk,
      stripe:      stripeBalance >= 0,
      overall:     dbOk ? "healthy" : "degraded",
    },
    revenue: {
      allTime:     totalRevenueCents,
      allTimeStr:  "$" + (totalRevenueCents / 100).toFixed(2),
      today:       todayRevenue,
      todayStr:    "$" + (todayRevenue / 100).toFixed(2),
      week:        weekRevenue,
      weekStr:     "$" + (weekRevenue / 100).toFixed(2),
      stripeBalance: stripeBalance,
      stripeStr:   "$" + (stripeBalance / 100).toFixed(2),
    },
    customers: {
      total:      customerStats?.totalCustomers ?? 0,
      unique:     customerStats?.uniqueEmails ?? 0,
      avgOrder:   "$" + ((customerStats?.averageOrderCents ?? 0) / 100).toFixed(2),
      topProducts: customerStats?.topProducts ?? [],
      topFormats:  customerStats?.topFormats ?? [],
      recent:     recentList.map(c => ({
        email:        c.email.replace(/(?<=.{2}).(?=.*@)/g, "*"),
        productTitle: c.productTitle,
        pricePaid:    "$" + (c.priceCents / 100).toFixed(2),
        channel:      c.channel,
        at:           c.createdAt,
      })),
    },
    catalog: {
      total:   catalogList.length,
      formats: formatCounts,
      topByPrice: catalogList
        .sort((a, b) => b.priceCents - a.priceCents)
        .slice(0, 5)
        .map(p => ({ id: p.id, title: p.title, format: p.format, price: "$" + (p.priceCents / 100).toFixed(2) })),
    },
    timeline: revenueData.slice(-14),
    webhooks: webhookData,
    errors,
  });
});

// ── HTML dashboard ────────────────────────────────────────────────────────────
router.get("/", (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>PULSE — Platform Awareness — CreateAI Brain</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#020617;--s1:#0d1526;--s2:#111827;--s3:#1e293b;--s4:#243044;
      --line:#1e293b;--line2:#2d3748;
      --t1:#e2e8f0;--t2:#94a3b8;--t3:#64748b;--t4:#475569;
      --ind:#6366f1;--em:#10b981;--am:#f59e0b;--re:#f87171;
      --pu:#a855f7;
    }
    html,body{background:var(--bg);color:var(--t1);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;min-height:100vh;}
    a{color:inherit;text-decoration:none;}
    .hdr{border-bottom:1px solid var(--line);padding:0 24px;background:rgba(2,6,23,.97);position:sticky;top:0;z-index:100;}
    .hdr-inner{max-width:1300px;margin:0 auto;height:48px;display:flex;align-items:center;gap:14px;}
    .logo{font-size:1rem;font-weight:900;letter-spacing:-.03em;}
    .logo em{color:var(--pu);font-style:normal;}
    .hdr-links{margin-left:auto;display:flex;gap:16px;}
    .hdr-links a{color:var(--t3);font-size:.78rem;font-weight:600;transition:color .15s;}
    .hdr-links a:hover{color:var(--t1);}
    .mode{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;border-radius:99px;padding:3px 9px;}
    .test-mode{background:rgba(245,158,11,.12);color:#fcd34d;border:1px solid rgba(245,158,11,.22);}
    .live-mode{background:rgba(16,185,129,.12);color:#6ee7b7;border:1px solid rgba(16,185,129,.22);}
    .pulse-dot{width:8px;height:8px;border-radius:50%;background:var(--pu);animation:pulse-anim 2s infinite;}
    @keyframes pulse-anim{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
    .wrap{max-width:1300px;margin:0 auto;padding:28px 24px;}
    .page-head{display:flex;align-items:baseline;gap:12px;margin-bottom:6px;}
    .page-title{font-size:1.4rem;font-weight:900;letter-spacing:-.04em;}
    .page-title em{color:var(--pu);font-style:normal;}
    .page-sub{font-size:.82rem;color:var(--t3);margin-bottom:28px;}
    .refresh-info{font-size:.72rem;color:var(--t4);}
    .kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:28px;}
    .kpi{background:var(--s2);border:1px solid var(--line);border-radius:12px;padding:16px 18px;}
    .kpi-label{font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:var(--t4);margin-bottom:6px;}
    .kpi-val{font-size:1.6rem;font-weight:900;letter-spacing:-.04em;}
    .kpi-sub{font-size:.7rem;color:var(--t3);margin-top:3px;}
    .kpi.rev .kpi-val{color:#34d399;}
    .kpi.cust .kpi-val{color:#818cf8;}
    .kpi.cat .kpi-val{color:var(--pu);}
    .kpi.health .kpi-val{color:var(--em);}
    .kpi.warn .kpi-val{color:var(--am);}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
    .panel{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:20px;}
    .panel-title{font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:var(--t4);margin-bottom:14px;display:flex;align-items:center;gap:8px;}
    .panel-title .cnt{background:var(--s3);border-radius:99px;padding:1px 8px;color:var(--t2);font-size:.65rem;}
    .row-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:.78rem;}
    .row-item:last-child{border-bottom:none;}
    .ri-main{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
    .ri-badge{font-size:.62rem;font-weight:800;border-radius:6px;padding:2px 7px;background:var(--s3);color:var(--t2);white-space:nowrap;}
    .ri-val{font-size:.82rem;font-weight:700;color:#34d399;white-space:nowrap;}
    .ri-sub{font-size:.68rem;color:var(--t4);}
    .empty-state{color:var(--t4);font-size:.78rem;text-align:center;padding:24px;font-style:italic;}
    .bar-chart{display:flex;align-items:flex-end;gap:4px;height:80px;margin-top:8px;}
    .bar{flex:1;background:rgba(99,102,241,.4);border-radius:3px 3px 0 0;min-height:2px;transition:background .15s;position:relative;}
    .bar:hover{background:rgba(99,102,241,.7);}
    .fmt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;}
    .fmt-chip{background:var(--s3);border:1px solid var(--line2);border-radius:8px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;}
    .fmt-name{font-size:.72rem;font-weight:700;color:var(--t2);text-transform:capitalize;}
    .fmt-cnt{font-size:.8rem;font-weight:900;color:var(--t1);}
    .evt-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
    .evt-ok{background:var(--em);}
    .evt-fail{background:var(--re);}
    .health-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    .h-item{background:var(--s3);border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:8px;}
    .h-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
    .h-ok{background:var(--em);}
    .h-fail{background:var(--re);}
    .h-lbl{font-size:.75rem;color:var(--t2);}
    .three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px;}
    .last-updated{font-size:.68rem;color:var(--t4);margin-top:16px;text-align:right;}
    @media(max-width:900px){.two-col,.three-col{grid-template-columns:1fr;}.kpi-grid{grid-template-columns:repeat(2,1fr);}}
    @media(max-width:480px){.kpi-grid{grid-template-columns:1fr 1fr;}.kpi-val{font-size:1.3rem;}}
  </style>
</head>
<body>
<header class="hdr">
  <div class="hdr-inner">
    <div class="pulse-dot"></div>
    <a class="logo" href="${BASE}/pulse"><em>PULSE</em> — Platform Awareness</a>
    <span class="mode ${IS_PROD ? "live-mode" : "test-mode"}">${IS_PROD ? "⚡ Live" : "🧪 Test"}</span>
    <div class="hdr-links">
      <a href="${BASE}/hub">Hub</a>
      <a href="${BASE}/studio">Studio</a>
      <a href="${BASE}/status">Status</a>
      <a href="${BASE}/vault">Vault</a>
      <a href="${BASE}/admin/logout">Logout</a>
    </div>
  </div>
</header>

<div class="wrap">
  <div class="page-head">
    <div class="page-title"><em>PULSE</em></div>
    <span class="refresh-info" id="refresh-info">Refreshing every 15s</span>
  </div>
  <div class="page-sub">Live platform intelligence — customers, revenue, catalog, and system health in one view.</div>

  <div class="kpi-grid" id="kpi-grid">
    <div class="kpi rev"><div class="kpi-label">All-Time Revenue</div><div class="kpi-val" id="kpi-alltime">—</div><div class="kpi-sub">gross from Stripe</div></div>
    <div class="kpi rev"><div class="kpi-label">This Week</div><div class="kpi-val" id="kpi-week">—</div><div class="kpi-sub">last 7 days</div></div>
    <div class="kpi rev"><div class="kpi-label">Today</div><div class="kpi-val" id="kpi-today">—</div><div class="kpi-sub">orders today</div></div>
    <div class="kpi cust"><div class="kpi-label">Total Customers</div><div class="kpi-val" id="kpi-cust">—</div><div class="kpi-sub" id="kpi-unique">unique emails</div></div>
    <div class="kpi cust"><div class="kpi-label">Avg Order</div><div class="kpi-val" id="kpi-avg">—</div><div class="kpi-sub">per transaction</div></div>
    <div class="kpi cat"><div class="kpi-label">Catalog</div><div class="kpi-val" id="kpi-cat">—</div><div class="kpi-sub">live products</div></div>
    <div class="kpi health"><div class="kpi-label">Platform Health</div><div class="kpi-val" id="kpi-health">—</div><div class="kpi-sub" id="kpi-uptime">uptime</div></div>
    <div class="kpi"><div class="kpi-label">Stripe Balance</div><div class="kpi-val" id="kpi-stripe" style="color:#a78bfa;">—</div><div class="kpi-sub">available payout</div></div>
  </div>

  <div class="two-col">
    <div class="panel">
      <div class="panel-title">Revenue — Last 14 Days <span class="cnt" id="timeline-cnt">0 days</span></div>
      <div class="bar-chart" id="bar-chart"></div>
    </div>
    <div class="panel">
      <div class="panel-title">Recent Customers <span class="cnt" id="cust-cnt">0</span></div>
      <div id="recent-cust"><div class="empty-state">No customers yet — purchases will appear here.</div></div>
    </div>
  </div>

  <div class="three-col">
    <div class="panel">
      <div class="panel-title">Top Products</div>
      <div id="top-products"><div class="empty-state">No sales data yet.</div></div>
    </div>
    <div class="panel">
      <div class="panel-title">Catalog by Format</div>
      <div id="format-grid" class="fmt-grid"></div>
    </div>
    <div class="panel">
      <div class="panel-title">Recent Webhook Events <span class="cnt" id="evt-cnt">0</span></div>
      <div id="webhook-list"><div class="empty-state">No webhook events yet.</div></div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-title">System Health</div>
    <div class="health-grid" id="health-grid"></div>
  </div>

  <div class="last-updated" id="last-updated">Last updated: —</div>
</div>

<script>
var REFRESH_MS = 15000;
var timer = null;

async function fetchPulse() {
  try {
    var resp = await fetch('/pulse/json');
    var d = await resp.json();
    if (!d.ok) return;
    render(d);
    document.getElementById('last-updated').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
  } catch(e) {
    document.getElementById('last-updated').textContent = 'Refresh failed: ' + e.message;
  }
}

function fmt(s) { return s != null ? s : '\u2014'; }

function render(d) {
  // KPIs
  setText('kpi-alltime', d.revenue.allTimeStr);
  setText('kpi-week', d.revenue.weekStr);
  setText('kpi-today', d.revenue.todayStr);
  setText('kpi-cust', d.customers.total);
  setText('kpi-unique', d.customers.unique + ' unique emails');
  setText('kpi-avg', d.customers.avgOrder);
  setText('kpi-cat', d.catalog.total);
  setText('kpi-health', d.health.overall === 'healthy' ? '\u2713 Healthy' : '\u26a0 Degraded');
  document.getElementById('kpi-health').style.color = d.health.overall === 'healthy' ? '#34d399' : '#f87171';
  setText('kpi-uptime', formatUptime(d.uptimeSecs));
  setText('kpi-stripe', d.revenue.stripeStr);

  // Bar chart
  var tl = d.timeline || [];
  setText('timeline-cnt', tl.length + ' days');
  var chart = document.getElementById('bar-chart');
  if (tl.length === 0) {
    chart.innerHTML = '<div style="color:var(--t4);font-size:.75rem;align-self:center;text-align:center;width:100%;">No revenue data yet</div>';
  } else {
    var maxRev = Math.max.apply(null, tl.map(function(x){ return x.revenue; })) || 1;
    chart.innerHTML = tl.map(function(t) {
      var h = Math.max(2, Math.round((t.revenue / maxRev) * 76));
      var label = t.date ? t.date.slice(5) : '';
      return '<div class="bar" style="height:' + h + 'px;" title="' + label + ': $' + (t.revenue/100).toFixed(2) + '"></div>';
    }).join('');
  }

  // Recent customers
  var rc = d.customers.recent || [];
  setText('cust-cnt', rc.length);
  var custEl = document.getElementById('recent-cust');
  if (rc.length === 0) {
    custEl.innerHTML = '<div class="empty-state">No customers yet.</div>';
  } else {
    custEl.innerHTML = rc.map(function(c) {
      var time = c.at ? new Date(c.at).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '';
      return '<div class="row-item"><div class="ri-main"><div style="font-size:.8rem;font-weight:600;color:var(--t1);">' + c.email + '</div><div class="ri-sub">' + c.productTitle + '</div></div><div style="text-align:right;"><div class="ri-val">' + c.pricePaid + '</div><div class="ri-sub">' + time + '</div></div></div>';
    }).join('');
  }

  // Top products
  var tp = d.customers.topProducts || [];
  var tpEl = document.getElementById('top-products');
  if (tp.length === 0) {
    tpEl.innerHTML = '<div class="empty-state">No sales data yet.</div>';
  } else {
    tpEl.innerHTML = tp.map(function(p,i) {
      return '<div class="row-item"><div style="font-size:.72rem;font-weight:900;color:var(--t4);width:16px;">' + (i+1) + '</div><div class="ri-main">' + p.productTitle + '</div><div class="ri-badge">' + p.count + ' sold</div></div>';
    }).join('');
  }

  // Format grid
  var fmts = d.catalog.formats || {};
  var fmtEl = document.getElementById('format-grid');
  fmtEl.innerHTML = Object.entries(fmts).sort(function(a,b){return b[1]-a[1];}).map(function(e) {
    return '<div class="fmt-chip"><span class="fmt-name">' + e[0] + '</span><span class="fmt-cnt">' + e[1] + '</span></div>';
  }).join('');

  // Webhooks
  var wh = d.webhooks || [];
  setText('evt-cnt', wh.length);
  var whEl = document.getElementById('webhook-list');
  if (wh.length === 0) {
    whEl.innerHTML = '<div class="empty-state">No webhook events yet.</div>';
  } else {
    whEl.innerHTML = wh.map(function(e) {
      var ok = !!e.processedAt;
      var time = e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '';
      return '<div class="row-item"><div class="evt-dot ' + (ok ? 'evt-ok' : 'evt-fail') + '"></div><div class="ri-main">' + e.eventType + '</div><div class="ri-sub">' + time + '</div></div>';
    }).join('');
  }

  // Health
  var healthEl = document.getElementById('health-grid');
  healthEl.innerHTML = [
    { label: 'PostgreSQL Database', ok: d.health.db },
    { label: 'Stripe API', ok: d.health.stripe },
    { label: 'API Server', ok: true },
    { label: 'Mode: ' + d.mode, ok: true },
  ].map(function(h) {
    return '<div class="h-item"><div class="h-dot ' + (h.ok ? 'h-ok' : 'h-fail') + '"></div><div class="h-lbl">' + h.label + '</div></div>';
  }).join('');
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = String(val != null ? val : '\u2014');
}

function formatUptime(s) {
  if (!s) return '\u2014';
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s/60) + 'm ' + (s%60) + 's';
  var h = Math.floor(s/3600);
  var m = Math.floor((s%3600)/60);
  return h + 'h ' + m + 'm';
}

fetchPulse();
timer = setInterval(fetchPulse, REFRESH_MS);

var countdown = REFRESH_MS / 1000;
setInterval(function() {
  countdown--;
  if (countdown <= 0) countdown = REFRESH_MS / 1000;
  setText('refresh-info', 'Refreshing in ' + countdown + 's');
}, 1000);
</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});

export default router;
