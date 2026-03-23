import { Router, type Request, type Response } from "express";
import { franchiseHub } from "../services/domainEngines2.js";

const router = Router();

router.get("/",      (_req, res) => res.json({ ok: true, ...franchiseHub.stats(), locations: franchiseHub.list() }));
router.get("/stats", (_req, res) => res.json({ ok: true, ...franchiseHub.stats() }));
router.get("/list",  (req: Request, res: Response) => res.json({ ok: true, locations: franchiseHub.list(String(req.query["status"] ?? "")) }));

router.post("/location", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, location: franchiseHub.addLocation(req.body ?? {}) });
});

router.post("/revenue", (req: Request, res: Response) => {
  const { locationId, monthlyRevenue } = req.body as { locationId: string; monthlyRevenue: number };
  const ok = franchiseHub.reportRevenue(locationId ?? "", monthlyRevenue ?? 0);
  res.json({ ok, message: ok ? "Revenue reported" : "Location not found" });
});

router.post("/compliance", (req: Request, res: Response) => {
  const { locationId, score } = req.body as { locationId: string; score: number };
  const ok = franchiseHub.updateCompliance(locationId ?? "", score ?? 0);
  res.json({ ok, message: ok ? `Compliance score updated to ${score}` : "Location not found" });
});

// ─── GET /api/franchise/dashboard ─────────────────────────────────────────────
router.get("/dashboard", (_req: Request, res: Response) => {
  const stats     = franchiseHub.stats();
  const locations = franchiseHub.list();

  const statusColor: Record<string,string> = {
    open:"#34d399", pending:"#fbbf24", suspended:"#f87171", closed:"#64748b",
  };

  const locationsHtml = locations.length
    ? locations.map(l => `
        <div class="loc-card">
          <div class="loc-top">
            <div>
              <div class="loc-name">${l.name}</div>
              <div class="loc-sub">${l.city}${l.city && (l as unknown as Record<string,string>)["country"] ? ', ' : ''}${(l as unknown as Record<string,string>)["country"] ?? ""}</div>
            </div>
            <span class="loc-status" style="color:${statusColor[l.status]||"#94a3b8"};background:${statusColor[l.status]||"#94a3b8"}15;border:1px solid ${statusColor[l.status]||"#94a3b8"}30">${l.status}</span>
          </div>
          <div class="loc-stats">
            <div class="ls"><div class="ls-val">$${(l.monthlyRevenue||0).toLocaleString()}</div><div class="ls-lbl">Monthly Rev</div></div>
            <div class="ls"><div class="ls-val">${l.staff||0}</div><div class="ls-lbl">Staff</div></div>
            <div class="ls"><div class="ls-val">${l.complianceScore||0}%</div><div class="ls-lbl">Compliance</div></div>
          </div>
        </div>`).join("")
    : `<div class="empty-msg">No franchise locations yet. Add via POST /api/franchise/location</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Franchise Hub — CreateAI Brain</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#020617;--s2:#111827;--s3:#1e293b;--line:#1e293b;
          --t1:#e2e8f0;--t2:#94a3b8;--t3:#64748b;--t4:#475569;--ind:#6366f1;--ind2:#818cf8;}
    html,body{background:var(--bg);color:var(--t1);font-family:'Inter',-apple-system,sans-serif;font-size:14px;min-height:100vh;-webkit-font-smoothing:antialiased}
    a{color:inherit;text-decoration:none}
    .skip-link{position:absolute;top:-100px;left:1rem;background:var(--ind);color:#fff;padding:.4rem 1rem;border-radius:6px;font-weight:700;z-index:999;transition:top .2s}.skip-link:focus{top:1rem}
    .hdr{border-bottom:1px solid var(--line);padding:0 24px;background:rgba(2,6,23,.97);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
    .hdr-inner{max-width:1200px;margin:0 auto;height:52px;display:flex;align-items:center;gap:14px}
    .logo{font-size:.95rem;font-weight:900;letter-spacing:-.03em}.logo span{color:var(--ind2)}
    .bdg{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;background:rgba(99,102,241,.15);color:var(--ind2);border:1px solid rgba(99,102,241,.3);border-radius:99px;padding:3px 10px}
    .hdr-links{margin-left:auto;display:flex;gap:16px}.hdr-links a{color:var(--t3);font-size:.78rem;font-weight:600;transition:color .15s}.hdr-links a:hover{color:var(--t1)}
    .wrap{max-width:1200px;margin:0 auto;padding:32px 24px}
    .hero{margin-bottom:28px}.hero h1{font-size:1.6rem;font-weight:900;letter-spacing:-.04em;margin-bottom:4px}.hero h1 span{color:var(--ind2)}.hero p{font-size:.85rem;color:var(--t3)}
    .kpi-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:28px}
    .kpi{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:16px 20px}
    .kpi-lbl{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--t4);margin-bottom:6px}
    .kpi-val{font-size:1.5rem;font-weight:900;color:var(--ind2);letter-spacing:-.04em}
    .add-box{background:rgba(99,102,241,.06);border:1px dashed rgba(99,102,241,.3);border-radius:14px;padding:20px 24px;margin-bottom:24px;font-size:.82rem;color:var(--t3)}
    .add-box code{background:var(--s3);border-radius:5px;padding:2px 6px;font-size:.78rem;color:var(--ind2)}
    .locs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
    .loc-card{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:20px;transition:border-color .2s}.loc-card:hover{border-color:rgba(99,102,241,.4)}
    .loc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
    .loc-name{font-size:.92rem;font-weight:800;margin-bottom:3px}
    .loc-sub{font-size:.72rem;color:var(--t3)}
    .loc-status{font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;border-radius:99px;padding:3px 10px;white-space:nowrap}
    .loc-stats{display:flex;gap:12px}
    .ls{flex:1}.ls-val{font-size:1.1rem;font-weight:800;color:var(--t2)}.ls-lbl{font-size:.6rem;color:var(--t4);text-transform:uppercase;letter-spacing:.06em;margin-top:2px}
    .empty-msg{color:var(--t4);font-size:.8rem;font-style:italic;padding:20px}
    footer{border-top:1px solid var(--line);padding:20px 24px;text-align:center;font-size:.68rem;color:var(--t4);margin-top:24px}
    @media(max-width:640px){.locs-grid{grid-template-columns:1fr}.wrap{padding:20px 16px}}
  </style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="hdr" role="banner">
  <div class="hdr-inner">
    <a class="logo" href="/hub">CreateAI <span>Brain</span></a>
    <span class="bdg">Franchise Hub</span>
    <nav class="hdr-links" aria-label="Navigation">
      <a href="/hub">Hub</a>
      <a href="/api/franchise">JSON</a>
    </nav>
  </div>
</header>
<main id="main" class="wrap">
  <div class="hero">
    <h1>Franchise <span>Hub</span></h1>
    <p>Manage franchise locations, monthly revenue reporting, staff headcount, and compliance scores globally.</p>
  </div>
  <div class="kpi-row" role="list" aria-label="Franchise summary">
    <div class="kpi" role="listitem"><div class="kpi-lbl">Total Locations</div><div class="kpi-val">${stats.totalLocations}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">Open</div><div class="kpi-val">${stats.openLocations}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">Pending</div><div class="kpi-val">${stats.pendingLocations}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">Total Staff</div><div class="kpi-val">${stats.totalStaff}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">Monthly Revenue</div><div class="kpi-val">$${(stats.totalMonthlyRevenue||0).toLocaleString()}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">Avg Compliance</div><div class="kpi-val">${stats.avgComplianceScore}%</div></div>
  </div>
  <div class="add-box" role="note" aria-label="Add franchise location">
    Add a location: <code>POST /api/franchise/location</code> with <code>{ "name", "city", "country", "franchiseeId" }</code>
    · Report revenue: <code>POST /api/franchise/revenue</code> · Update compliance: <code>POST /api/franchise/compliance</code>
  </div>
  <div class="locs-grid" role="list" aria-label="Franchise locations">
    ${locations.length ? locationsHtml : `<div class="empty-msg">No locations yet. Use the POST endpoint above to add your first franchise location.</div>`}
  </div>
</main>
<footer role="contentinfo">CreateAI Brain · ${stats.engine} · Lakeside Trinity LLC</footer>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.send(html);
});

export default router;
