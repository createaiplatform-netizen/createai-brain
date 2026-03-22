/**
 * selfHost.ts — Internal Hosting API
 *
 * Mounted at /api by app.ts — paths become /api/self-host/...
 *
 *   GET  /api/self-host/status          — full hosting status
 *   GET  /api/self-host/url-map         — full createai:// URL map
 *   GET  /api/self-host/zones           — all createai:// zones
 *   GET  /api/self-host/resolve?npa=... — resolve a createai:// address
 *   POST /api/self-host/build           — trigger frontend build (admin)
 *   POST /api/self-host/serve           — mount built frontend (admin)
 *   POST /api/self-host/publish         — snapshot current build (admin)
 *   GET  /api/self-host/proof           — current platform proof token
 *   POST /api/self-host/verify          — verify a submitted proof token
 */

import { Router, type Request, type Response } from "express";
import { verifyAdminCookie }    from "../middlewares/adminAuth.js";
import { getStatus, buildFrontend, mountFrontend, publishSnapshot } from "../engines/selfHostEngine.js";
import { resolveNPA, getFullUrlMap, getAllZones }  from "../utils/internalRouter.js";
import { generatePlatformProof, verifyProofSignature, getStripeVerificationClaim } from "../engines/verificationEngine.js";
import { resolveNexusIdentity } from "../config/nexusIdentityResolver.js";

// Lazily import Express app reference — done via module-level singleton
import type { Express } from "express";
let _app: Express | null = null;
export function registerApp(app: Express) { _app = app; }

const router = Router();

router.get("/self-host/status", (_req: Request, res: Response) => {
  res.json(getStatus());
});

router.get("/self-host/url-map", (_req: Request, res: Response) => {
  res.json({
    schema:      "createai://",
    description: "NEXUS internal URL addressing — maps createai:// handles to runtime routes",
    routes:      getFullUrlMap(),
    zones:       getAllZones(),
    totalRoutes: getFullUrlMap().length,
  });
});

router.get("/self-host/zones", (_req: Request, res: Response) => {
  res.json(getAllZones());
});

router.get("/self-host/resolve", (req: Request, res: Response) => {
  const npa = String(req.query["npa"] ?? "");
  if (!npa) { res.status(400).json({ error: "?npa= required" }); return; }
  const id   = resolveNexusIdentity();
  const result = resolveNPA(npa, id.liveUrl);
  res.json(result);
});

router.get("/self-host/proof", (_req: Request, res: Response) => {
  res.json(generatePlatformProof());
});

router.get("/self-host/stripe-claim", (_req: Request, res: Response) => {
  res.json(getStripeVerificationClaim());
});

router.post("/self-host/verify", (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const result = verifyProofSignature(body);
  res.json(result);
});

router.post("/self-host/build", verifyAdminCookie, (_req: Request, res: Response) => {
  res.json({ ok: true, message: "Build triggered in background", note: "Check /api/self-host/status for progress." });
  setImmediate(() => {
    buildFrontend();
  });
});

router.post("/self-host/serve", verifyAdminCookie, (_req: Request, res: Response) => {
  if (!_app) { res.status(500).json({ error: "App reference not registered" }); return; }
  mountFrontend(_app);
  res.json({ ok: true, message: "Frontend mounted — API server now serves full app" });
});

router.post("/self-host/publish", verifyAdminCookie, (_req: Request, res: Response) => {
  const snap = publishSnapshot();
  if (!snap.ok) { res.status(400).json({ ok: false, error: "No dist/ found. Run build first." }); return; }
  res.json({ ok: true, version: snap.version, path: snap.path, message: "Snapshot saved at " + snap.path });
});

// ─── GET /api/self-host/dashboard — HTML platform identity & hosting surface ──
router.get("/self-host/dashboard", (_req: Request, res: Response) => {
  const status = getStatus();
  const identity = resolveNexusIdentity();
  const zones  = getAllZones();
  const urlMap = getFullUrlMap();
  const proof  = generatePlatformProof();

  const zoneCount  = Array.isArray(zones) ? zones.length : Object.keys(zones).length;
  const routeCount = Array.isArray(urlMap) ? urlMap.length : 0;

  const zoneRows = (Array.isArray(zones) ? zones : Object.values(zones)).slice(0, 20).map((z: unknown) => {
    const zone = z as Record<string, string | number | boolean>;
    return `<div class="zone-row">
      <div class="zone-name">${zone["name"] ?? zone["zone"] ?? zone["id"] ?? "Zone"}</div>
      <div class="zone-desc">${zone["description"] ?? zone["type"] ?? ""}</div>
    </div>`;
  }).join("") || `<div class="empty-msg">No zones registered</div>`;

  const statusColor  = status.engineActive ? "#34d399" : "#f87171";
  const distColor    = status.distExists   ? "#34d399" : "#64748b";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Platform Identity — CreateAI Brain</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#020617;--s2:#111827;--s3:#1e293b;--line:#1e293b;
          --t1:#e2e8f0;--t2:#94a3b8;--t3:#64748b;--t4:#475569;--ind:#6366f1;--ind2:#818cf8;--g:#34d399;}
    html,body{background:var(--bg);color:var(--t1);font-family:'Inter',-apple-system,sans-serif;font-size:14px;min-height:100vh;-webkit-font-smoothing:antialiased}
    a{color:var(--ind2);text-decoration:none}
    .skip-link{position:absolute;top:-100px;left:1rem;background:var(--ind);color:#fff;padding:.4rem 1rem;border-radius:6px;font-weight:700;z-index:999;transition:top .2s}.skip-link:focus{top:1rem}
    .hdr{border-bottom:1px solid var(--line);padding:0 24px;background:rgba(2,6,23,.97);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
    .hdr-inner{max-width:1100px;margin:0 auto;height:52px;display:flex;align-items:center;gap:14px}
    .logo{font-size:.95rem;font-weight:900;letter-spacing:-.03em}.logo span{color:var(--ind2)}
    .bdg{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;background:rgba(99,102,241,.15);color:var(--ind2);border:1px solid rgba(99,102,241,.3);border-radius:99px;padding:3px 10px}
    .hdr-links{margin-left:auto;display:flex;gap:16px}.hdr-links a{color:var(--t3);font-size:.78rem;font-weight:600;transition:color .15s}.hdr-links a:hover{color:var(--t1)}
    .wrap{max-width:1100px;margin:0 auto;padding:32px 24px}
    .hero{margin-bottom:28px}.hero h1{font-size:1.6rem;font-weight:900;letter-spacing:-.04em;margin-bottom:4px}.hero h1 span{color:var(--ind2)}.hero p{font-size:.85rem;color:var(--t3)}
    .kpi-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:24px}
    .kpi{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:16px 20px}
    .kpi-lbl{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--t4);margin-bottom:6px}
    .kpi-val{font-size:1rem;font-weight:900;color:var(--ind2);word-break:break-all}
    .kpi.green .kpi-val{color:var(--g)}.kpi.muted .kpi-val{color:var(--t3);font-size:.82rem}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px}
    .panel{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:22px}
    .panel-title{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--t4);margin-bottom:14px}
    .id-row{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:.8rem;align-items:flex-start}
    .id-row:last-child{border-bottom:none}
    .id-key{color:var(--t4);font-weight:700;min-width:120px;flex-shrink:0}
    .id-val{color:var(--t2);word-break:break-all}
    .zone-row{display:flex;gap:12px;padding:8px 0;border-bottom:1px solid var(--line);font-size:.8rem}
    .zone-row:last-child{border-bottom:none}
    .zone-name{font-weight:700;color:var(--ind2);min-width:100px;flex-shrink:0}
    .zone-desc{color:var(--t3)}
    .proof-box{background:var(--s3);border-radius:10px;padding:14px;margin-top:10px;font-size:.72rem;color:var(--t3);word-break:break-all;font-family:monospace;line-height:1.5}
    .status-chip{display:inline-flex;align-items:center;gap:6px;font-size:.72rem;font-weight:700;border-radius:99px;padding:4px 12px}
    .empty-msg{color:var(--t4);font-size:.78rem;font-style:italic;padding:8px 0}
    footer{border-top:1px solid var(--line);padding:20px 24px;text-align:center;font-size:.68rem;color:var(--t4);margin-top:24px}
    @media(max-width:768px){.two-col{grid-template-columns:1fr}.wrap{padding:20px 16px}}
  </style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="hdr" role="banner">
  <div class="hdr-inner">
    <a class="logo" href="/hub">CreateAI <span>Brain</span></a>
    <span class="bdg">Platform Identity</span>
    <nav class="hdr-links" aria-label="Navigation">
      <a href="/hub">Hub</a>
      <a href="/api/self-host/status">JSON</a>
    </nav>
  </div>
</header>
<main id="main" class="wrap">
  <div class="hero">
    <h1>Platform <span>Identity</span></h1>
    <p>NPA address, live URL, self-hosting engine status, internal zones, and platform proof token.</p>
  </div>

  <div class="kpi-row" role="list">
    <div class="kpi ${status.engineActive ? 'green' : ''}" role="listitem">
      <div class="kpi-lbl">Engine</div>
      <div class="kpi-val">${status.engineActive ? "Active" : "Inactive"}</div>
    </div>
    <div class="kpi ${status.distExists ? 'green' : 'muted'}" role="listitem">
      <div class="kpi-lbl">Dist Bundle</div>
      <div class="kpi-val">${status.distExists ? `${status.distSizeKb} KB` : "Not built"}</div>
    </div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">Server Port</div><div class="kpi-val">${status.serverPort}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">Zones</div><div class="kpi-val">${zoneCount}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">URL Routes</div><div class="kpi-val">${routeCount}</div></div>
  </div>

  <div class="two-col">
    <div class="panel">
      <div class="panel-title">Platform Identity</div>
      <div class="id-row"><div class="id-key">NPA Address</div><div class="id-val">${identity.npa}</div></div>
      <div class="id-row"><div class="id-key">Live URL</div><div class="id-val">${identity.liveUrl || "—"}</div></div>
      <div class="id-row"><div class="id-key">Platform</div><div class="id-val">CreateAI Brain</div></div>
      <div class="id-row"><div class="id-key">Owner</div><div class="id-val">Sara Stadler · Lakeside Trinity LLC</div></div>
      <div class="id-row"><div class="id-key">Engine Status</div>
        <div class="id-val">
          <span class="status-chip" style="color:${statusColor};background:${statusColor}14;border:1px solid ${statusColor}30">
            ${status.engineActive ? "◎ Online" : "○ Offline"}
          </span>
        </div>
      </div>
      <div class="id-row"><div class="id-key">Dist Bundle</div>
        <div class="id-val">
          <span class="status-chip" style="color:${distColor};background:${distColor}14;border:1px solid ${distColor}30">
            ${status.distExists ? `Built · ${status.distSizeKb} KB` : "Not built"}
          </span>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-title">Internal Zones (${zoneCount})</div>
      <div style="max-height:280px;overflow-y:auto">${zoneRows}</div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-title">Platform Proof Token</div>
    <div style="font-size:.78rem;color:var(--t3);margin-bottom:10px">
      HMAC-signed identity token for third-party platform verification. Submit to <code style="background:var(--s3);padding:2px 6px;border-radius:4px">/api/self-host/verify</code> to validate.
    </div>
    <div class="proof-box">${JSON.stringify(proof, null, 2).slice(0, 600)}${JSON.stringify(proof, null, 2).length > 600 ? "…" : ""}</div>
  </div>
</main>
<footer role="contentinfo">CreateAI Brain · Self-Host Engine · NPA: ${identity.npa}</footer>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.send(html);
});

export default router;
