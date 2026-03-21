/**
 * protocolGateway.ts
 * ──────────────────
 * NEXUS Handle Protocol Gateway — three public-facing mechanisms that let
 * the platform be reached via a handle rather than a raw URL:
 *
 *   GET /h/:handle               — permanent handle redirect
 *   GET /npa-gateway?q=<url>     — web+npa:// protocol handler callback
 *   GET /api/platform-card       — portable self-resolving HTML card generator
 *   GET /api/platform-card/raw   — returns the card as downloadable file
 *
 * The Portable Card is the core invention: a ~3KB standalone HTML file that
 * anyone can host anywhere for free (GitHub Pages, Netlify, Cloudflare Pages,
 * a USB drive). On load it fetches the current live URL from the platform
 * identity endpoint and redirects there — so every hosted copy is a permanent,
 * self-updating entry point to the platform regardless of where it is hosted.
 */

import { Router, Request, Response } from "express";
import { getPublicBaseUrl } from "../utils/publicUrl.js";
import { IDENTITY } from "../config/identity.js";

const router = Router();

// ── Portable card HTML generator ─────────────────────────────────────────────
function generateCard(liveUrl: string): string {
  const name    = IDENTITY.platformName;
  const handle  = IDENTITY.handle;
  const legal   = IDENTITY.legalEntity;
  const npa     = IDENTITY.npa;
  const tagline = "AI-Powered Operations Platform";
  const identityEndpoint = `${liveUrl}/api/platform-identity`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} — ${handle}</title>
<meta name="description" content="${tagline} by ${legal}">
<meta property="og:title" content="${name}">
<meta property="og:description" content="${tagline} by ${legal}">
<meta name="theme-color" content="#6366f1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#020617;color:#f1f5f9;-webkit-font-smoothing:antialiased}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.card{max-width:440px;width:100%;text-align:center}
.logo{width:64px;height:64px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 24px;box-shadow:0 0 40px rgba(99,102,241,.35)}
h1{font-size:1.8rem;font-weight:700;background:linear-gradient(135deg,#a5b4fc,#c4b5fd);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}
.tag{font-size:.9rem;color:#94a3b8;margin-bottom:32px}
.handle{display:inline-flex;align-items:center;gap:8px;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:10px 16px;font-family:'Courier New',monospace;font-size:.85rem;color:#6366f1;margin-bottom:32px}
.spinner{width:36px;height:36px;border:3px solid #1e293b;border-top:3px solid #6366f1;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
.status{font-size:.8rem;color:#64748b;margin-bottom:24px}
.fallback{font-size:.75rem;color:#475569}
.fallback a{color:#6366f1;text-decoration:none}
.legal{margin-top:40px;font-size:.7rem;color:#334155}
</style>
</head>
<body>
<div class="card">
  <div class="logo">⚡</div>
  <h1>${name}</h1>
  <p class="tag">${tagline}</p>
  <div class="handle">
    <span style="color:#64748b">npa://</span>${handle}
  </div>
  <div class="spinner" id="sp"></div>
  <p class="status" id="st">Resolving platform address…</p>
  <p class="fallback">Not redirected? <a href="${liveUrl}" id="fl">Open platform directly</a></p>
  <p class="legal">${legal} · ${npa}</p>
</div>
<script>
(function(){
  var cached="${liveUrl}";
  var endpoint="${identityEndpoint}";
  function go(url){
    document.getElementById("st").textContent="Redirecting…";
    document.getElementById("fl").href=url;
    window.location.replace(url);
  }
  var xhr=new XMLHttpRequest();
  xhr.open("GET",endpoint,true);
  xhr.timeout=4000;
  xhr.onload=function(){
    try{
      var d=JSON.parse(xhr.responseText);
      go(d.liveUrl||d.platformUrl||cached);
    }catch(e){go(cached);}
  };
  xhr.onerror=function(){go(cached);};
  xhr.ontimeout=function(){go(cached);};
  try{xhr.send();}catch(e){go(cached);}
  setTimeout(function(){go(cached);},5000);
})();
</script>
</body>
</html>`;
}

// ── Open-CORS helper for public resolution endpoints ──────────────────────────
function publicCors(res: Response): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
}

// ── GET /h/:handle  — permanent handle redirect ───────────────────────────────
router.get("/h/:handle", (req: Request, res: Response) => {
  const handle = String(req.params["handle"] ?? "").toLowerCase();
  const canonical = IDENTITY.handle.toLowerCase();

  if (handle !== canonical) {
    return res.status(404).json({ error: "Unknown handle", handle });
  }

  const path = String(req.query["path"] ?? "");
  const liveUrl = getPublicBaseUrl();
  const dest = path
    ? `${liveUrl}${path.startsWith("/") ? "" : "/"}${path}`
    : liveUrl;

  publicCors(res);
  return res.redirect(302, dest);
});

// ── GET /npa-gateway — web+npa:// protocol handler callback ──────────────────
// Browsers send: /npa-gateway?q=web+npa://CreateAIDigital/optional/path
router.get("/npa-gateway", (req: Request, res: Response) => {
  const q = String(req.query["q"] ?? "");
  const liveUrl = getPublicBaseUrl();

  if (!q) {
    publicCors(res);
    return res.redirect(302, liveUrl);
  }

  // Strip scheme: web+npa://Handle/path → Handle/path
  const cleaned = q.replace(/^web\+npa:\/\//i, "");
  const slashIdx = cleaned.indexOf("/");
  const path = slashIdx >= 0 ? cleaned.slice(slashIdx) : "";

  const dest = path ? `${liveUrl}${path}` : liveUrl;
  publicCors(res);
  return res.redirect(302, dest);
});

// ── GET /api/platform-card — browser preview of the portable card ─────────────
router.get("/api/platform-card", (req: Request, res: Response) => {
  const liveUrl = getPublicBaseUrl();
  const html = generateCard(liveUrl);

  publicCors(res);

  const download = req.query["download"] === "1";
  if (download) {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${IDENTITY.handle.toLowerCase()}-card.html"`
    );
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// ── GET /api/platform-card/meta — JSON metadata about the card system ─────────
router.get("/api/platform-card/meta", (_req: Request, res: Response) => {
  const liveUrl = getPublicBaseUrl();
  publicCors(res);
  res.json({
    system: "NEXUS Handle Protocol",
    version: "1.0",
    handle: IDENTITY.handle,
    npa: IDENTITY.npa,
    protocol: `web+npa://${IDENTITY.handle}`,
    handleRedirect: `${liveUrl}/h/${IDENTITY.handle.toLowerCase()}`,
    protocolGateway: `${liveUrl}/npa-gateway?q=web+npa://${IDENTITY.handle}`,
    portableCard: `${liveUrl}/api/platform-card`,
    portableCardDownload: `${liveUrl}/api/platform-card?download=1`,
    liveUrl,
    description:
      "The Portable Card is a self-resolving ~3KB HTML file. Host it on any free static platform (GitHub Pages, Netlify, Cloudflare Pages) and it becomes a permanent, self-updating entry point that always routes to the current live platform URL.",
  });
});

export default router;
