import { Router, type Request, type Response } from "express";
import { brandVault } from "../services/domainEngines2.js";

const router = Router();

router.get("/",           (_req, res) => res.json({ ok: true, ...brandVault.stats(), assets: brandVault.assets(), guidelines: brandVault.guidelines() }));
router.get("/stats",      (_req, res) => res.json({ ok: true, ...brandVault.stats() }));
router.get("/assets",     (req: Request, res: Response) => res.json({ ok: true, assets: brandVault.assets(String(req.query["type"] ?? "")) }));
router.get("/guidelines", (req: Request, res: Response) => res.json({ ok: true, guidelines: brandVault.guidelines(String(req.query["section"] ?? "")) }));

router.post("/asset", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, asset: brandVault.addAsset(req.body ?? {}) });
});

router.post("/guideline", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, guideline: brandVault.addGuideline(req.body ?? {}) });
});

router.post("/:id/use", (req: Request, res: Response) => {
  const ok = brandVault.recordUsage(String(req.params["id"] ?? ""));
  res.json({ ok });
});

// ─── GET /api/brand/dashboard ─────────────────────────────────────────────────
router.get("/dashboard", (_req: Request, res: Response) => {
  const stats      = brandVault.stats();
  const assets     = brandVault.assets();
  const guidelines = brandVault.guidelines();

  const typeIcon: Record<string,string> = {
    logo:"🔵", icon:"🟣", color_palette:"🎨", "color-palette":"🎨",
    typography:"🔤", template:"📄", illustration:"🖼️",
    video:"🎥", audio:"🔊", pattern:"🔷",
  };
  const priorityColor: Record<string,string> = {
    must:"#f87171", should:"#fbbf24", may:"#34d399",
  };

  const assetsHtml = assets.map(a => `
    <div class="asset-card">
      <div class="ac-icon">${typeIcon[a.type]||"📁"}</div>
      <div class="ac-body">
        <div class="ac-name">${a.name}</div>
        <div class="ac-desc">${a.description||''}</div>
        <div class="ac-meta">
          <span class="ac-badge">${a.type}</span>
          <span class="ac-version">v${a.version}</span>
          <span class="ac-usage">${a.usageCount} uses</span>
        </div>
      </div>
    </div>`).join("") || `<div class="empty">No assets yet. Add via POST /api/brand/asset</div>`;

  const guidelinesHtml = guidelines.map(g => `
    <div class="guide-row">
      <div class="guide-pri" style="background:${priorityColor[g.priority]||"#818cf8"}20;color:${priorityColor[g.priority]||"#818cf8"};border:1px solid ${priorityColor[g.priority]||"#818cf8"}40">${g.priority}</div>
      <div class="guide-body">
        <div class="guide-section">${g.section}</div>
        <div class="guide-rule">${g.rule}</div>
        <div class="guide-ex">Example: ${g.example}</div>
      </div>
    </div>`).join("") || `<div class="empty">No guidelines yet.</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Brand Vault — CreateAI Brain</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#020617;--s2:#111827;--s3:#1e293b;--line:#1e293b;--line2:#2d3748;
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
    .identity-strip{display:flex;gap:10px;margin-bottom:28px;padding:18px 22px;background:var(--s2);border:1px solid var(--line);border-radius:14px;flex-wrap:wrap}
    .id-chip{display:flex;align-items:center;gap:8px;font-size:.82rem}
    .id-swatch{width:20px;height:20px;border-radius:4px;flex-shrink:0}
    .id-label{font-weight:700;color:var(--t2)}.id-hex{font-size:.7rem;color:var(--t4);font-family:monospace}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px}
    .panel{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:22px}
    .panel-title{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--t4);margin-bottom:16px}
    .asset-card{display:flex;gap:14px;padding:12px 0;border-bottom:1px solid var(--line)}
    .asset-card:last-child{border-bottom:none}
    .ac-icon{font-size:1.6rem;flex-shrink:0}
    .ac-name{font-size:.85rem;font-weight:700;margin-bottom:3px}
    .ac-desc{font-size:.72rem;color:var(--t3);margin-bottom:6px}
    .ac-meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .ac-badge{font-size:.6rem;font-weight:700;text-transform:uppercase;background:rgba(99,102,241,.12);color:var(--ind2);border-radius:6px;padding:2px 7px}
    .ac-version{font-size:.62rem;color:var(--t4)}.ac-usage{font-size:.62rem;color:var(--t4)}
    .guide-row{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}
    .guide-row:last-child{border-bottom:none}
    .guide-pri{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;border-radius:6px;padding:3px 9px;white-space:nowrap;height:fit-content;margin-top:2px}
    .guide-section{font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:3px}
    .guide-rule{font-size:.82rem;font-weight:600;margin-bottom:4px}
    .guide-ex{font-size:.7rem;color:var(--t3)}
    .empty{color:var(--t4);font-size:.78rem;padding:16px 0;font-style:italic}
    footer{border-top:1px solid var(--line);padding:20px 24px;text-align:center;font-size:.68rem;color:var(--t4);margin-top:24px}
    @media(max-width:768px){.two-col{grid-template-columns:1fr}.wrap{padding:20px 16px}}
  </style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="hdr" role="banner">
  <div class="hdr-inner">
    <a class="logo" href="/hub">CreateAI <span>Brain</span></a>
    <span class="bdg">Brand Vault</span>
    <nav class="hdr-links" aria-label="Navigation">
      <a href="/hub">Hub</a>
      <a href="/api/advertising/hub">Advertising Hub</a>
      <a href="/api/brand">JSON</a>
    </nav>
  </div>
</header>
<main id="main" class="wrap">
  <div class="hero">
    <h1>Brand <span>Vault</span></h1>
    <p>Brand assets, identity guidelines, color system, and typography rules for Lakeside Trinity LLC · CreateAI Brain.</p>
  </div>
  <div class="identity-strip" role="list" aria-label="Brand identity colors">
    <div class="id-chip" role="listitem">
      <div class="id-swatch" style="background:#6366f1"></div>
      <span class="id-label">Indigo</span>
      <span class="id-hex">#6366f1</span>
    </div>
    <div class="id-chip" role="listitem">
      <div class="id-swatch" style="background:#818cf8"></div>
      <span class="id-label">Indigo Light</span>
      <span class="id-hex">#818cf8</span>
    </div>
    <div class="id-chip" role="listitem">
      <div class="id-swatch" style="background:#020617;border:1px solid #1e293b"></div>
      <span class="id-label">Background</span>
      <span class="id-hex">#020617</span>
    </div>
    <div class="id-chip" role="listitem">
      <div class="id-swatch" style="background:#10b981"></div>
      <span class="id-label">Emerald</span>
      <span class="id-hex">#10b981</span>
    </div>
    <div class="id-chip" role="listitem">
      <div class="id-swatch" style="background:#f59e0b"></div>
      <span class="id-label">Amber</span>
      <span class="id-hex">#f59e0b</span>
    </div>
    <div style="margin-left:auto;font-size:.72rem;color:var(--t4)">
      ${stats.totalAssets} assets · ${stats.totalGuidelines} guidelines · ${stats.sections?.join(', ')||''}
    </div>
  </div>
  <div class="two-col">
    <div class="panel">
      <div class="panel-title">Brand Assets (${stats.totalAssets})</div>
      ${assetsHtml}
    </div>
    <div class="panel">
      <div class="panel-title">Brand Guidelines (${stats.totalGuidelines})</div>
      ${guidelinesHtml}
    </div>
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
