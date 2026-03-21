import { Router, type Request, type Response } from "express";
import { revenueIntel } from "../services/domainEngines2.js";

const router = Router();

// ─── GET /api/revenue-intel/dashboard ────────────────────────────────────────
// Full HTML dashboard — fetches live stats, snapshot, cohorts, trend

router.get("/dashboard", (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Revenue Intelligence — CreateAI Brain</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#020617;--s1:#0d1526;--s2:#111827;--s3:#1e293b;--s4:#243044;
          --line:#1e293b;--line2:#2d3748;
          --t1:#e2e8f0;--t2:#94a3b8;--t3:#64748b;--t4:#475569;
          --ind:#6366f1;--ind2:#818cf8;--em:#10b981;--am:#f59e0b;--re:#f87171;
          --cyan:#22d3ee;--pur:#a78bfa;}
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
    .status-dot{width:7px;height:7px;background:var(--em);border-radius:50%;flex-shrink:0}
    .status-txt{font-size:.65rem;color:var(--t4)}
    .wrap{max-width:1280px;margin:0 auto;padding:32px 24px}
    .page-hero{margin-bottom:32px}
    .page-title{font-size:1.6rem;font-weight:900;letter-spacing:-.04em;margin-bottom:4px}
    .page-title span{color:var(--ind2)}
    .page-sub{font-size:.85rem;color:var(--t3);max-width:600px}
    .loading{text-align:center;padding:64px;color:var(--t4)}
    .spinner{display:inline-block;width:22px;height:22px;border:2px solid var(--s3);border-top-color:var(--ind);border-radius:50%;animation:spin .8s linear infinite;vertical-align:middle;margin-right:8px}
    @keyframes spin{to{transform:rotate(360deg)}}
    .error-state{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:14px;padding:16px 20px;color:var(--re);font-size:.82rem;margin-bottom:24px}
    .section{margin-bottom:32px}
    .section-title{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--t4);margin-bottom:14px;display:flex;align-items:center;gap:8px}
    .section-title::after{content:'';flex:1;height:1px;background:var(--line)}
    .kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
    .kpi{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:18px 20px;transition:border-color .2s}
    .kpi:hover{border-color:var(--ind)}
    .kpi-icon{font-size:1.2rem;margin-bottom:8px}
    .kpi-lbl{font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--t4);margin-bottom:6px}
    .kpi-val{font-size:1.6rem;font-weight:900;letter-spacing:-.04em}
    .kpi-val.green{color:#34d399}
    .kpi-val.amber{color:#fbbf24}
    .kpi-val.blue{color:var(--cyan)}
    .kpi-val.purple{color:var(--pur)}
    .kpi-val.red{color:var(--re)}
    .kpi-sub{font-size:.66rem;color:var(--t4);margin-top:4px}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px}
    .panel{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:22px;transition:border-color .2s}
    .panel:hover{border-color:rgba(99,102,241,.3)}
    .panel-title{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--t4);margin-bottom:18px}
    .snapshot-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .snap-row{background:var(--s3);border-radius:10px;padding:12px 16px}
    .snap-lbl{font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:4px}
    .snap-val{font-size:1.1rem;font-weight:800;letter-spacing:-.02em;color:var(--t2)}
    .cohort-table{width:100%;border-collapse:collapse;font-size:.78rem}
    .cohort-table th{font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:var(--t4);text-align:left;padding:6px 8px;border-bottom:1px solid var(--line2)}
    .cohort-table td{padding:8px;border-bottom:1px solid var(--line);color:var(--t2)}
    .cohort-table tr:last-child td{border-bottom:none}
    .empty-state{text-align:center;padding:32px;color:var(--t4);font-size:.82rem;font-style:italic}
    .post-hint{background:var(--s3);border:1px dashed var(--line2);border-radius:10px;padding:14px 18px;margin-top:12px;font-size:.72rem;color:var(--t3)}
    .post-hint code{background:rgba(99,102,241,.12);color:var(--ind2);border-radius:4px;padding:2px 6px;font-family:monospace;font-size:.68rem}
    .engine-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);border-radius:99px;padding:4px 12px;font-size:.65rem;font-weight:700;color:var(--ind2);margin-bottom:20px}
    .trend-wrap{height:90px;display:flex;align-items:flex-end;gap:3px;overflow:hidden}
    .tbar{flex:1;background:rgba(99,102,241,.45);border-radius:3px 3px 0 0;min-height:3px;transition:.15s}
    .tbar:hover{background:rgba(99,102,241,.85)}
    .last-up{font-size:.65rem;color:var(--t4);text-align:right;margin-top:14px}
    .json-link{display:inline-flex;align-items:center;gap:5px;font-size:.7rem;font-weight:600;color:var(--t3);border:1px solid var(--line2);border-radius:8px;padding:5px 12px;transition:.15s}
    .json-link:hover{color:var(--ind2);border-color:var(--ind)}
    footer{border-top:1px solid var(--line);padding:20px 24px;text-align:center;font-size:.68rem;color:var(--t4);margin-top:24px}
    @media(max-width:768px){.two-col{grid-template-columns:1fr}.snapshot-grid{grid-template-columns:1fr}.wrap{padding:20px 16px}.kpi-grid{grid-template-columns:repeat(2,1fr)}}
  </style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="hdr" role="banner">
  <div class="hdr-inner">
    <a class="logo" href="/hub">CreateAI <span>Brain</span></a>
    <span class="hdr-badge">Revenue Intelligence</span>
    <nav class="hdr-links" aria-label="Navigation">
      <a href="/hub">Hub</a>
      <a href="/pulse">PULSE</a>
      <a href="/vault">Vault</a>
      <a href="/api/analytics/dashboard">Analytics</a>
    </nav>
    <div style="display:flex;align-items:center;gap:6px;margin-left:12px">
      <div class="status-dot" id="status-dot"></div>
      <span class="status-txt" id="status-txt">Loading…</span>
    </div>
  </div>
</header>

<main id="main" class="wrap">
  <div class="page-hero">
    <h1 class="page-title">Revenue <span>Intelligence</span></h1>
    <p class="page-sub">Cohort analysis, LTV tracking, churn rate, MRR/ARR snapshots, and net revenue retention — all in one view. Real data only.</p>
  </div>

  <div id="error-banner" class="error-state" style="display:none" role="alert" aria-live="assertive"></div>
  <div id="loading" class="loading"><span class="spinner"></span> Fetching revenue data…</div>

  <div id="content" style="display:none">

    <div class="section">
      <div class="section-title">Live KPIs</div>
      <div class="kpi-grid" id="kpi-grid" role="list" aria-label="Revenue KPIs"></div>
    </div>

    <div class="two-col section">
      <div class="panel">
        <div class="panel-title">Latest Snapshot</div>
        <div id="latest-snap"></div>
        <div class="post-hint">Record a snapshot via <code>POST /api/revenue-intel/snapshot</code> with <code>{"mrr":…,"arr":…,"ltv":…,"churnRate":…}</code></div>
      </div>
      <div class="panel">
        <div class="panel-title">30-Day Trend (Snapshots)</div>
        <div class="trend-wrap" id="trend-chart"></div>
        <div id="trend-empty" class="empty-state" style="display:none">No trend data yet — add snapshots over time to see a trend.</div>
      </div>
    </div>

    <div class="section">
      <div class="panel" style="grid-column:1/-1">
        <div class="panel-title">Customer Cohorts</div>
        <div id="cohorts-wrap"></div>
        <div class="post-hint">Add cohorts via <code>POST /api/revenue-intel/cohort</code> with <code>{"name":…,"users":…,"ltv":…,"retentionRate":…}</code></div>
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <a class="json-link" href="/api/revenue-intel">JSON: Full stats</a>
      <a class="json-link" href="/api/revenue-intel/stats">JSON: Stats only</a>
      <a class="json-link" href="/api/revenue-intel/latest">JSON: Latest snapshot</a>
      <a class="json-link" href="/api/revenue-intel/cohorts">JSON: Cohorts</a>
      <a class="json-link" href="/api/revenue-intel/trend">JSON: Trend (30d)</a>
    </div>
    <div class="last-up" id="last-up"></div>
  </div>
</main>
<footer role="contentinfo">CreateAI Brain · Revenue Intelligence Engine v1.0 · Internal Use Only</footer>

<script>
function fmt(n,prefix=''){
  if(n===null||n===undefined)return'—';
  if(typeof n!=='number')return String(n);
  if(n===0)return prefix+'0';
  return prefix+(n>=1000000?(n/1000000).toFixed(1)+'M':n>=1000?(n/1000).toFixed(1)+'k':n.toFixed(2));
}
function pct(n){return n===null||n===undefined?'—':n.toFixed(2)+'%'}
function kpi(icon,label,val,cls,sub){
  return \`<div class="kpi" role="listitem">
    <div class="kpi-icon">\${icon}</div>
    <div class="kpi-lbl">\${label}</div>
    <div class="kpi-val \${cls}">\${val}</div>
    <div class="kpi-sub">\${sub}</div>
  </div>\`;
}
async function load(){
  try{
    const [statsR,latestR,cohortsR,trendR]=await Promise.all([
      fetch('/api/revenue-intel/stats'),
      fetch('/api/revenue-intel/latest'),
      fetch('/api/revenue-intel/cohorts'),
      fetch('/api/revenue-intel/trend?days=30')
    ]);
    const [s,l,co,tr]=await Promise.all([statsR.json(),latestR.json(),cohortsR.json(),trendR.json()]);

    document.getElementById('loading').style.display='none';
    document.getElementById('content').style.display='block';
    document.getElementById('status-dot').style.background='#34d399';
    document.getElementById('status-txt').textContent='Live · '+new Date().toLocaleTimeString();

    // KPI grid
    document.getElementById('kpi-grid').innerHTML=[
      kpi('💰','MRR',fmt(s.latestMRR,'$'),'green','Monthly Recurring Revenue'),
      kpi('📅','ARR',fmt(s.latestARR,'$'),'green','Annual Recurring Revenue'),
      kpi('🎯','LTV',fmt(s.latestLTV,'$'),'blue','Customer Lifetime Value'),
      kpi('📉','Churn Rate',pct(s.latestChurnRate),'red','Latest snapshot churn'),
      kpi('🔄','NRR',pct(s.latestNRR),'purple','Net Revenue Retention'),
      kpi('📸','Snapshots',s.totalSnapshots??0,'','Total recorded'),
      kpi('👥','Cohorts',s.totalCohorts??0,'amber','Tracked cohorts'),
    ].join('');

    // Latest snapshot
    const snap=l.snapshot;
    if(snap){
      document.getElementById('latest-snap').innerHTML=\`<div class="snapshot-grid">
        <div class="snap-row"><div class="snap-lbl">MRR</div><div class="snap-val">\${fmt(snap.mrr,'$')}</div></div>
        <div class="snap-row"><div class="snap-lbl">ARR</div><div class="snap-val">\${fmt(snap.arr,'$')}</div></div>
        <div class="snap-row"><div class="snap-lbl">LTV</div><div class="snap-val">\${fmt(snap.ltv,'$')}</div></div>
        <div class="snap-row"><div class="snap-lbl">Churn</div><div class="snap-val">\${pct(snap.churnRate)}</div></div>
        <div class="snap-row"><div class="snap-lbl">NRR</div><div class="snap-val">\${pct(snap.netRevRetention)}</div></div>
        <div class="snap-row"><div class="snap-lbl">Customers</div><div class="snap-val">\${snap.customerCount??'—'}</div></div>
      </div><div style="font-size:.65rem;color:var(--t4);margin-top:10px">Recorded: \${snap.createdAt?new Date(snap.createdAt).toLocaleString():'—'}</div>\`;
    }else{
      document.getElementById('latest-snap').innerHTML='<div class="empty-state">No snapshot recorded yet.</div>';
    }

    // Trend chart
    const trend=tr.trend||[];
    if(trend.length){
      const maxMRR=Math.max(...trend.map(t=>t.mrr||0),1);
      document.getElementById('trend-chart').innerHTML=trend.map(t=>{
        const h=Math.max(4,Math.round((t.mrr/maxMRR)*88));
        return \`<div class="tbar" style="height:\${h}px" title="\${new Date(t.createdAt).toLocaleDateString()}: $\${fmt(t.mrr)}"></div>\`;
      }).join('');
    }else{
      document.getElementById('trend-chart').style.display='none';
      document.getElementById('trend-empty').style.display='block';
    }

    // Cohorts
    const cohorts=co.cohorts||[];
    if(cohorts.length){
      document.getElementById('cohorts-wrap').innerHTML=\`<table class="cohort-table" aria-label="Customer cohorts">
        <thead><tr><th>Cohort</th><th>Users</th><th>LTV</th><th>Retention</th><th>ARPU</th><th>Created</th></tr></thead>
        <tbody>\${cohorts.map(c=>\`<tr>
          <td>\${c.name||'—'}</td>
          <td>\${c.users||0}</td>
          <td>\${fmt(c.ltv,'$')}</td>
          <td>\${pct(c.retentionRate)}</td>
          <td>\${fmt(c.arpu,'$')}</td>
          <td style="color:var(--t4)">\${c.createdAt?new Date(c.createdAt).toLocaleDateString():'—'}</td>
        </tr>\`).join('')}</tbody>
      </table>\`;
    }else{
      document.getElementById('cohorts-wrap').innerHTML='<div class="empty-state">No cohorts yet.</div>';
    }

    document.getElementById('last-up').textContent='Last updated: '+new Date().toLocaleString();
  }catch(e){
    document.getElementById('loading').style.display='none';
    const eb=document.getElementById('error-banner');
    eb.textContent='Could not load revenue intelligence data: '+e.message;
    eb.style.display='block';
    document.getElementById('status-dot').style.background='#f87171';
    document.getElementById('status-txt').textContent='Error';
  }
}
load();
setInterval(load,90000);
</script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.send(html);
});

// ─── JSON endpoints ───────────────────────────────────────────────────────────

router.get("/",        (_req, res) => res.json({ ok: true, ...revenueIntel.stats(), latest: revenueIntel.latestSnapshot(), cohorts: revenueIntel.cohorts() }));
router.get("/stats",   (_req, res) => res.json({ ok: true, ...revenueIntel.stats() }));
router.get("/latest",  (_req, res) => res.json({ ok: true, snapshot: revenueIntel.latestSnapshot() }));
router.get("/trend",   (req: Request, res: Response) => res.json({ ok: true, trend: revenueIntel.trend(Number(req.query["days"] ?? 30)) }));
router.get("/cohorts", (_req, res) => res.json({ ok: true, cohorts: revenueIntel.cohorts() }));

router.post("/snapshot", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, snapshot: revenueIntel.snapshot(req.body ?? {}) });
});

router.post("/cohort", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, cohort: revenueIntel.addCohort(req.body ?? {}) });
});

export default router;
