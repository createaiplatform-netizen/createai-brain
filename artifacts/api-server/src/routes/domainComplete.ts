/**
 * domainComplete.ts — Master Domain Completion Status
 *
 * GET /api/domains/status       — all 25 domain-equivalent areas + completion
 * GET /api/domains/:id/stats    — individual domain engine stats
 * GET /api/domains/gaps         — any remaining gaps
 * GET /api/domains/coverage     — worldwide coverage summary
 *
 * Also exposes secondary domain engines not in individual route files:
 * - Value Exchange (banking-equivalent)
 * - Risk Coverage (insurance-equivalent)
 * - Property Flow (real estate-equivalent)
 * - Workforce Pipeline (talent acquisition-equivalent)
 * - Performance Review (performance management-equivalent)
 * - Campaign Intelligence (marketing automation-equivalent)
 * - Regulatory Map (compliance-equivalent)
 * - Fiscal Intelligence (FP&A-equivalent)
 * - Recurring Revenue (subscription billing-equivalent)
 */

import { Router, type Request, type Response } from "express";
import {
  getAllDomainStatuses,
  valueExchange,
  riskCoverage,
  propertyFlow,
  workforcePipeline,
  performanceReview,
  campaignIntelligence,
  regulatoryMap,
  fiscalIntelligence,
  recurringRevenue,
} from "../services/domainEngines.js";

const router = Router();

// ─── Master Domain Status ─────────────────────────────────────────────────────

router.get("/status", (_req: Request, res: Response) => {
  const domains = getAllDomainStatuses();
  const complete = domains.filter(d => d.status === "complete").length;
  const totalEndpoints = domains.reduce((s, d) => s + d.endpointCount, 0);

  res.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    coverage: {
      totalDomains:        domains.length,
      completeDomains:     complete,
      completionRate:      Math.round((complete / domains.length) * 100),
      totalEndpoints,
      worldwideCoverage:   complete >= domains.length ? "100%" : `${Math.round((complete / domains.length) * 100)}%`,
      gaps:                domains.filter(d => d.status !== "complete").length,
      status:              complete >= domains.length ? "COMPLETE — No gaps" : "IN PROGRESS",
    },
    domains,
  });
});

router.get("/gaps", (_req: Request, res: Response) => {
  const domains = getAllDomainStatuses();
  const gaps = domains.filter(d => d.status !== "complete");
  res.json({
    ok: true,
    gapCount: gaps.length,
    gaps,
    message: gaps.length === 0
      ? "All 25 industry-equivalent domains are complete. No gaps detected."
      : `${gaps.length} domain(s) require attention.`,
  });
});

router.get("/coverage", (_req: Request, res: Response) => {
  const domains = getAllDomainStatuses();
  const complete = domains.filter(d => d.status === "complete").length;

  res.json({
    ok: true,
    worldwideDomainCoverage: {
      financial:   ["Value Exchange", "Transaction Ledger", "Fiscal Intelligence", "Recurring Revenue", "Order Flow"],
      operations:  ["Asset Flow", "Order Flow", "Case Resolution", "Content Pipeline", "Agreement Flow"],
      intelligence:["Insight Engine", "Engagement Map", "Campaign Intelligence", "Contact Intelligence", "Performance Review"],
      workforce:   ["Workforce Pipeline", "Growth Path", "Performance Review", "StaffingOS"],
      risk:        ["Risk Coverage", "Regulatory Map", "Agreement Flow"],
      industry:    ["HealthOS", "LegalPM", "StaffingOS", "Real Market Engine", "Semantic Store", "Advertising Hub"],
      protocol:    ["NPA Identity", "Handle Protocol", "Self-Host Engine", "TOTP Engine", "Health Monitor"],
    },
    summary: {
      totalDomains: domains.length,
      complete,
      partial: domains.filter(d => d.status === "partial").length,
      completionRate: `${Math.round((complete / domains.length) * 100)}%`,
      industryEquivalents: domains.map(d => d.industryEquivalent),
    },
  });
});

// ─── Individual domain engine stats (secondary domains) ──────────────────────

// Aggregate index routes — fronted fetch() calls these root paths
router.get("/value-exchange",              (_req, res) => res.json({ ok: true, ...valueExchange.stats(), balances: valueExchange.balances() }));
router.get("/risk-coverage",               (_req, res) => res.json({ ok: true, ...riskCoverage.stats() }));
router.get("/property-flow",               (_req, res) => res.json({ ok: true, ...propertyFlow.stats() }));
router.get("/workforce-pipeline",          (_req, res) => res.json({ ok: true, ...workforcePipeline.stats(), candidates: [] }));
router.get("/perf-review",                 (_req, res) => res.json({ ok: true, ...performanceReview.stats(), reviews: [] }));
router.get("/campaign-intelligence",       (_req, res) => res.json({ ok: true, ...campaignIntelligence.stats(), campaigns: [] }));
router.get("/regulatory-map",              (_req, res) => res.json({ ok: true, ...regulatoryMap.stats(), regulations: regulatoryMap.list() }));
router.get("/fiscal-intelligence",         (_req, res) => res.json({ ok: true, ...fiscalIntelligence.stats() }));
router.get("/recurring-revenue",           (_req, res) => res.json({ ok: true, ...recurringRevenue.stats(), plans: recurringRevenue.plans(), mrr: recurringRevenue.mrr(), arr: recurringRevenue.arr() }));

router.get("/value-exchange/stats",        (_req, res) => res.json({ ok: true, ...valueExchange.stats() }));
router.get("/value-exchange/balances",     (_req, res) => res.json({ ok: true, balances: valueExchange.balances() }));
router.post("/value-exchange/transfer",    (req: Request, res: Response) => {
  const { from, to, amount, memo, currency } = req.body as { from: string; to: string; amount: number; memo: string; currency?: string };
  if (!from || !to || !amount) { res.status(400).json({ error: "from, to, amount required" }); return; }
  res.status(201).json({ ok: true, transfer: valueExchange.transfer(from, to, amount, memo ?? "", currency) });
});

router.get("/risk-coverage/stats",         (_req, res) => res.json({ ok: true, ...riskCoverage.stats() }));
router.post("/risk-coverage/assess",       (req: Request, res: Response) => {
  const { entityId, entityType, factors } = req.body as { entityId: string; entityType: string; factors: string[] };
  if (!entityId) { res.status(400).json({ error: "entityId required" }); return; }
  res.status(201).json({ ok: true, assessment: riskCoverage.assess(entityId, entityType ?? "entity", factors ?? []) });
});

router.get("/property-flow/stats",         (_req, res) => res.json({ ok: true, ...propertyFlow.stats() }));
router.post("/property-flow",              (req: Request, res: Response) => res.status(201).json({ ok: true, property: propertyFlow.list(req.body ?? {}) }));

router.get("/workforce-pipeline/stats",    (_req, res) => res.json({ ok: true, ...workforcePipeline.stats() }));
router.post("/workforce-pipeline",         (req: Request, res: Response) => res.status(201).json({ ok: true, candidate: workforcePipeline.add(req.body ?? {}) }));

router.get("/performance-review/stats",    (_req, res) => res.json({ ok: true, ...performanceReview.stats() }));

router.get("/campaign-intelligence/stats", (_req, res) => res.json({ ok: true, ...campaignIntelligence.stats() }));
router.post("/campaign-intelligence",      (req: Request, res: Response) => res.status(201).json({ ok: true, campaign: campaignIntelligence.create(req.body ?? {}) }));

router.get("/regulatory-map/stats",        (_req, res) => res.json({ ok: true, ...regulatoryMap.stats() }));
router.get("/regulatory-map/list",         (_req, res) => res.json({ ok: true, regulations: regulatoryMap.list() }));

router.get("/fiscal-intelligence/stats",   (_req, res) => res.json({ ok: true, ...fiscalIntelligence.stats() }));

router.get("/recurring-revenue/stats",     (_req, res) => res.json({ ok: true, ...recurringRevenue.stats() }));
router.get("/recurring-revenue/plans",     (_req, res) => res.json({ ok: true, plans: recurringRevenue.plans() }));
router.get("/recurring-revenue/mrr",       (_req, res) => res.json({ ok: true, mrr: recurringRevenue.mrr(), arr: recurringRevenue.arr() }));
router.post("/recurring-revenue/subscribe",(req: Request, res: Response) => {
  const { customerId, planName, cycle } = req.body as { customerId: string; planName: string; cycle?: "monthly" | "quarterly" | "annual" };
  if (!customerId || !planName) { res.status(400).json({ error: "customerId and planName required" }); return; }
  res.status(201).json({ ok: true, subscription: recurringRevenue.subscribe(customerId, planName, cycle) });
});

// ─── GET /api/domains/hub ─────────────────────────────────────────────────────
// HTML overview of all domain engines — fetches live stats from each sub-route

router.get("/hub", (_req: Request, res: Response) => {
  const engines = [
    { id: "value-exchange",       label: "Value Exchange",       icon: "⚖️",  desc: "Banking-equivalent. Token balances, transfers, transaction ledger.",  color: "#34d399", url: "/api/domains/value-exchange" },
    { id: "risk-coverage",        label: "Risk Coverage",        icon: "🛡️", desc: "Insurance-equivalent. Policies, exposure, risk assessment engine.",   color: "#60a5fa", url: "/api/domains/risk-coverage" },
    { id: "property-flow",        label: "Property Flow",        icon: "🏢",  desc: "Real estate-equivalent. Asset registry, listings, valuations.",        color: "#f472b6", url: "/api/domains/property-flow" },
    { id: "workforce-pipeline",   label: "Workforce Pipeline",   icon: "👥",  desc: "Talent acquisition. Candidate tracking, pipeline stages, scoring.",   color: "#fbbf24", url: "/api/domains/workforce-pipeline" },
    { id: "perf-review",          label: "Performance Review",   icon: "📋",  desc: "Performance management. Reviews, OKRs, ratings, improvement plans.",  color: "#a78bfa", url: "/api/domains/perf-review" },
    { id: "campaign-intelligence",label: "Campaign Intelligence",icon: "📣",  desc: "Marketing automation. Campaign tracking, impressions, conversions.",   color: "#fb923c", url: "/api/domains/campaign-intelligence" },
    { id: "regulatory-map",       label: "Regulatory Map",       icon: "📜",  desc: "Compliance. Regulation registry, jurisdiction mapping, audit trails.", color: "#22d3ee", url: "/api/domains/regulatory-map" },
    { id: "fiscal-intelligence",  label: "Fiscal Intelligence",  icon: "📊",  desc: "FP&A-equivalent. Budgets, forecasts, P&L, runway, burn rate.",        color: "#4ade80", url: "/api/domains/fiscal-intelligence" },
    { id: "recurring-revenue",    label: "Recurring Revenue",    icon: "🔄",  desc: "Subscription billing. Plans, MRR, ARR, subscriber lifecycle.",         color: "#818cf8", url: "/api/domains/recurring-revenue" },
  ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Domain Engines Hub — CreateAI Brain</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#020617;--s1:#0d1526;--s2:#111827;--s3:#1e293b;--line:#1e293b;--line2:#2d3748;
          --t1:#e2e8f0;--t2:#94a3b8;--t3:#64748b;--t4:#475569;
          --ind:#6366f1;--ind2:#818cf8;}
    html,body{background:var(--bg);color:var(--t1);font-family:'Inter',-apple-system,sans-serif;font-size:14px;min-height:100vh;-webkit-font-smoothing:antialiased}
    a{color:inherit;text-decoration:none}
    .skip-link{position:absolute;top:-100px;left:1rem;background:var(--ind);color:#fff;padding:.4rem 1rem;border-radius:6px;font-weight:700;z-index:999;transition:top .2s}
    .skip-link:focus{top:1rem}
    .hdr{border-bottom:1px solid var(--line);padding:0 24px;background:rgba(2,6,23,.97);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
    .hdr-inner{max-width:1280px;margin:0 auto;height:52px;display:flex;align-items:center;gap:14px}
    .logo{font-size:.95rem;font-weight:900;letter-spacing:-.03em}
    .logo span{color:var(--ind2)}
    .hdr-badge{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;background:rgba(99,102,241,.15);color:var(--ind2);border:1px solid rgba(99,102,241,.3);border-radius:99px;padding:3px 10px}
    .hdr-links{margin-left:auto;display:flex;gap:16px}
    .hdr-links a{color:var(--t3);font-size:.78rem;font-weight:600;transition:color .15s}
    .hdr-links a:hover{color:var(--t1)}
    .wrap{max-width:1280px;margin:0 auto;padding:32px 24px}
    .hero{margin-bottom:32px}
    .hero h1{font-size:1.6rem;font-weight:900;letter-spacing:-.04em;margin-bottom:6px}
    .hero h1 span{color:var(--ind2)}
    .hero p{font-size:.85rem;color:var(--t3);max-width:640px}
    .coverage-bar{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:18px 24px;margin-bottom:28px;display:flex;gap:32px;flex-wrap:wrap;align-items:center}
    .cov-stat{text-align:center}
    .cov-val{font-size:1.8rem;font-weight:900;letter-spacing:-.04em;color:var(--ind2)}
    .cov-lbl{font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--t4)}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;margin-bottom:32px}
    .engine-card{background:var(--s2);border:1px solid var(--line);border-radius:16px;padding:20px;transition:all .2s;cursor:default}
    .engine-card:hover{border-color:rgba(99,102,241,.4);transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,.3)}
    .ec-top{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px}
    .ec-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0}
    .ec-info{flex:1;min-width:0}
    .ec-label{font-size:.92rem;font-weight:800;margin-bottom:3px}
    .ec-desc{font-size:.72rem;color:var(--t3);line-height:1.4}
    .ec-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .stat-box{background:var(--s3);border-radius:8px;padding:8px 10px}
    .stat-lbl{font-size:.55rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:3px}
    .stat-val{font-size:.9rem;font-weight:800;color:var(--t2)}
    .stat-val.loading{color:var(--t4);font-style:italic;font-weight:400}
    .ec-link{display:inline-flex;align-items:center;gap:5px;font-size:.7rem;font-weight:700;color:var(--t3);border:1px solid var(--line2);border-radius:7px;padding:5px 12px;margin-top:12px;transition:.15s}
    .ec-link:hover{color:var(--ind2);border-color:var(--ind)}
    .status-sec{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:22px;margin-bottom:24px}
    .ss-title{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--t4);margin-bottom:16px}
    .domain-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;max-height:320px;overflow-y:auto}
    .domain-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;background:var(--s3);font-size:.75rem}
    .domain-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
    .dot-complete{background:#34d399}
    .dot-partial{background:#fbbf24}
    .dot-planned{background:var(--t4)}
    .last-up{font-size:.65rem;color:var(--t4);text-align:right;margin-top:10px}
    footer{border-top:1px solid var(--line);padding:20px 24px;text-align:center;font-size:.68rem;color:var(--t4);margin-top:24px}
    @media(max-width:640px){.grid{grid-template-columns:1fr}.coverage-bar{gap:16px}.wrap{padding:20px 16px}}
  </style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="hdr" role="banner">
  <div class="hdr-inner">
    <a class="logo" href="/hub">CreateAI <span>Brain</span></a>
    <span class="hdr-badge">Domain Engines</span>
    <nav class="hdr-links" aria-label="Navigation">
      <a href="/hub">Hub</a>
      <a href="/nexus">NEXUS</a>
      <a href="/api/revenue-intel/dashboard">Revenue Intel</a>
      <a href="/api/analytics/dashboard">Analytics</a>
    </nav>
  </div>
</header>

<main id="main" class="wrap">
  <div class="hero">
    <h1>Domain <span>Engines Hub</span></h1>
    <p>All 9 secondary domain engines — banking, insurance, real estate, talent, campaigns, compliance, FP&A, subscriptions, and performance. Live stats from each engine.</p>
  </div>

  <div class="coverage-bar" id="coverage-bar">
    <div class="cov-stat"><div class="cov-val" id="cov-domains">—</div><div class="cov-lbl">Domains</div></div>
    <div class="cov-stat"><div class="cov-val" id="cov-complete">—</div><div class="cov-lbl">Complete</div></div>
    <div class="cov-stat"><div class="cov-val" id="cov-rate">—</div><div class="cov-lbl">Coverage</div></div>
    <div class="cov-stat"><div class="cov-val" id="cov-eps">—</div><div class="cov-lbl">Endpoints</div></div>
    <div class="cov-stat"><div class="cov-val" id="cov-gaps">—</div><div class="cov-lbl">Gaps</div></div>
  </div>

  <div class="grid" id="engine-grid" role="list" aria-label="Domain engines">
    ${engines.map(e => `
    <div class="engine-card" id="card-${e.id}" role="listitem">
      <div class="ec-top">
        <div class="ec-icon" style="background:${e.color}22;border:1px solid ${e.color}40">${e.icon}</div>
        <div class="ec-info">
          <div class="ec-label" style="color:${e.color}">${e.label}</div>
          <div class="ec-desc">${e.desc}</div>
        </div>
      </div>
      <div class="ec-stats" id="stats-${e.id}">
        <div class="stat-box"><div class="stat-lbl">Status</div><div class="stat-val loading" id="s1-${e.id}">…</div></div>
        <div class="stat-box"><div class="stat-lbl">Engine</div><div class="stat-val loading" id="s2-${e.id}">…</div></div>
        <div class="stat-box"><div class="stat-lbl">Records</div><div class="stat-val loading" id="s3-${e.id}">…</div></div>
      </div>
      <a class="ec-link" href="${e.url}" target="_blank" rel="noopener">View JSON ↗</a>
    </div>`).join("")}
  </div>

  <div class="status-sec">
    <div class="ss-title">All 25 Platform Domains</div>
    <div class="domain-list" id="domain-list">Loading…</div>
  </div>

  <div class="last-up" id="last-up"></div>
</main>

<footer role="contentinfo">CreateAI Brain · Domain Engines Hub · Internal Use Only</footer>

<script>
const engines=${JSON.stringify(engines)};
async function loadEngine(e){
  try{
    const r=await fetch(e.url);
    const d=await r.json();
    const eng=d.engine||d.engineVersion||'Active';
    const shortEng=eng.replace(/Engine|v\\d+\\.\\d+/gi,'').trim().slice(0,12)||'Active';
    const records=d.totalTransactions||d.totalPolicies||d.totalProperties||d.totalCandidates||
                   d.totalReviews||d.totalCampaigns||d.totalRegulations||d.totalForecasts||
                   d.totalSubscriptions||d.totalBalances||0;
    document.getElementById('s1-'+e.id).textContent='Online';
    document.getElementById('s1-'+e.id).className='stat-val';
    document.getElementById('s1-'+e.id).style.color='#34d399';
    document.getElementById('s2-'+e.id).textContent=shortEng;
    document.getElementById('s2-'+e.id).className='stat-val';
    document.getElementById('s3-'+e.id).textContent=records||'Ready';
    document.getElementById('s3-'+e.id).className='stat-val';
  }catch(err){
    document.getElementById('s1-'+e.id).textContent='Error';
    document.getElementById('s1-'+e.id).style.color='#f87171';
    document.getElementById('s2-'+e.id).textContent='—';
    document.getElementById('s3-'+e.id).textContent='—';
  }
}
async function loadCoverage(){
  try{
    const r=await fetch('/api/domains/status');
    const d=await r.json();
    const c=d.coverage||{};
    document.getElementById('cov-domains').textContent=c.totalDomains??'—';
    document.getElementById('cov-complete').textContent=c.completeDomains??'—';
    document.getElementById('cov-rate').textContent=c.worldwideCoverage??'—';
    document.getElementById('cov-eps').textContent=c.totalEndpoints??'—';
    document.getElementById('cov-gaps').textContent=c.gaps??'—';
    // Domain list
    const domains=d.domains||[];
    if(domains.length){
      document.getElementById('domain-list').innerHTML=domains.map(dom=>{
        const cls=dom.status==='complete'?'dot-complete':dom.status==='partial'?'dot-partial':'dot-planned';
        return \`<div class="domain-row"><div class="domain-dot \${cls}"></div><span>\${dom.name}</span><span style="margin-left:auto;font-size:.65rem;color:var(--t4)">\${dom.industryEquivalent||''}</span></div>\`;
      }).join('');
    }else{
      document.getElementById('domain-list').textContent='No domain data';
    }
  }catch(e){
    console.error('Coverage load failed',e);
  }
}
async function loadAll(){
  await Promise.all([loadCoverage(),...engines.map(loadEngine)]);
  document.getElementById('last-up').textContent='Last updated: '+new Date().toLocaleString();
}
loadAll();
setInterval(loadAll,120000);
</script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.send(html);
});

export default router;
