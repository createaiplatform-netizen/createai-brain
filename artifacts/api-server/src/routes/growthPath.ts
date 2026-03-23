import { Router, type Request, type Response } from "express";
import { growthPath } from "../services/domainEngines.js";

const router = Router();

router.get("/",               (_req, res) => res.json({ ok: true, ...growthPath.stats(), tracks: growthPath.tracks(), enrollments: (growthPath as unknown as Record<string, () => unknown[]>)["enrollments"]?.() ?? [] }));
router.get("/stats",          (_req, res) => res.json(growthPath.stats()));
router.get("/tracks",         (_req, res) => res.json({ ok: true, tracks: growthPath.tracks() }));
router.get("/progress/:userId", (req: Request, res: Response) => res.json({ ok: true, ...growthPath.userProgress(String(req.params["userId"] ?? "")) }));

router.post("/enroll", (req: Request, res: Response) => {
  const { userId, trackId } = req.body as { userId: string; trackId: string };
  if (!userId || !trackId) { res.status(400).json({ error: "userId and trackId required" }); return; }
  res.json({ ok: growthPath.enroll(userId, trackId) });
});

router.post("/complete", (req: Request, res: Response) => {
  const { userId, trackId } = req.body as { userId: string; trackId: string };
  res.json({ ok: growthPath.complete(userId ?? "", trackId ?? "") });
});

// ─── GET /api/growth-path/dashboard ──────────────────────────────────────────
router.get("/dashboard", (_req: Request, res: Response) => {
  const stats  = growthPath.stats();
  const tracks = growthPath.tracks();

  const levelColor: Record<string,string> = {
    beginner: "#34d399", intermediate: "#fbbf24", advanced: "#f87171",
  };
  const tracksHtml = tracks.map(t => {
    const col = levelColor[t.level] ?? "#818cf8";
    const pct = t.enrolled ? Math.round((t.completed / t.enrolled) * 100) : 0;
    return `<div class="track-card">
      <div class="tc-top">
        <div>
          <div class="tc-title">${t.title}</div>
          <div class="tc-meta">
            <span class="level-pill" style="color:${col};border-color:${col}40;background:${col}12">${t.level}</span>
            <span class="tc-cat">${t.category}</span>
            <span class="tc-dur">⏱ ${t.duration}</span>
          </div>
        </div>
        <div class="tc-stats">
          <div class="tcs-val">${t.enrolled}</div><div class="tcs-lbl">Enrolled</div>
        </div>
      </div>
      <div class="modules-wrap">${(t.modules||[]).map(m=>`<span class="mod-pill">${m}</span>`).join("")}</div>
      <div class="prog-bar-wrap" title="${pct}% completion rate">
        <div class="prog-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="prog-lbl">${t.completed} completions · ${pct}% rate</div>
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Growth Path — CreateAI Brain</title>
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
    .badge{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;background:rgba(99,102,241,.15);color:var(--ind2);border:1px solid rgba(99,102,241,.3);border-radius:99px;padding:3px 10px}
    .hdr-links{margin-left:auto;display:flex;gap:16px}.hdr-links a{color:var(--t3);font-size:.78rem;font-weight:600;transition:color .15s}.hdr-links a:hover{color:var(--t1)}
    .wrap{max-width:1200px;margin:0 auto;padding:32px 24px}
    .hero{margin-bottom:28px}.hero h1{font-size:1.6rem;font-weight:900;letter-spacing:-.04em;margin-bottom:4px}.hero h1 span{color:var(--ind2)}.hero p{font-size:.85rem;color:var(--t3)}
    .kpi-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:28px}
    .kpi{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:16px 20px}
    .kpi-lbl{font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--t4);margin-bottom:6px}
    .kpi-val{font-size:1.6rem;font-weight:900;color:var(--ind2);letter-spacing:-.04em}
    .tracks-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
    .track-card{background:var(--s2);border:1px solid var(--line);border-radius:16px;padding:20px;transition:border-color .2s}.track-card:hover{border-color:rgba(99,102,241,.4)}
    .tc-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}
    .tc-title{font-size:.92rem;font-weight:800;margin-bottom:6px}
    .tc-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .level-pill{font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;border-radius:99px;padding:2px 8px;border:1px solid;white-space:nowrap}
    .tc-cat{font-size:.68rem;color:var(--t3)}.tc-dur{font-size:.68rem;color:var(--t4)}
    .tc-stats{text-align:center;flex-shrink:0}.tcs-val{font-size:1.3rem;font-weight:900;color:var(--t2)}.tcs-lbl{font-size:.6rem;color:var(--t4);text-transform:uppercase;letter-spacing:.06em}
    .modules-wrap{display:flex;flex-wrap:wrap;gap:5px;margin:12px 0}
    .mod-pill{background:var(--s3);border-radius:6px;padding:3px 9px;font-size:.65rem;color:var(--t3);font-weight:600}
    .prog-bar-wrap{height:4px;background:var(--s3);border-radius:2px;margin-bottom:6px}
    .prog-bar-fill{height:100%;background:var(--ind);border-radius:2px;transition:width .6s ease}
    .prog-lbl{font-size:.62rem;color:var(--t4)}
    footer{border-top:1px solid var(--line);padding:20px 24px;text-align:center;font-size:.68rem;color:var(--t4);margin-top:24px}
    @media(max-width:640px){.tracks-grid{grid-template-columns:1fr}.wrap{padding:20px 16px}}
  </style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="hdr" role="banner">
  <div class="hdr-inner">
    <a class="logo" href="/hub">CreateAI <span>Brain</span></a>
    <span class="badge">Growth Path</span>
    <nav class="hdr-links" aria-label="Navigation">
      <a href="/hub">Hub</a>
      <a href="/nexus">NEXUS</a>
      <a href="/api/growth-path">JSON</a>
    </nav>
  </div>
</header>
<main id="main" class="wrap">
  <div class="hero">
    <h1>Growth <span>Path Engine</span></h1>
    <p>Learning tracks, enrollment progress, and completion rates across all platform knowledge areas.</p>
  </div>
  <div class="kpi-row" role="list" aria-label="Growth path metrics">
    <div class="kpi" role="listitem"><div class="kpi-lbl">Total Tracks</div><div class="kpi-val">${stats.totalTracks}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">Enrollments</div><div class="kpi-val">${stats.totalEnrollments}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">Completions</div><div class="kpi-val">${stats.totalCompletions}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">Categories</div><div class="kpi-val">${stats.categories?.length ?? 0}</div></div>
  </div>
  <div class="tracks-grid" role="list" aria-label="Learning tracks">${tracksHtml}</div>
</main>
<footer role="contentinfo">CreateAI Brain · ${stats.engine} · Internal Use Only</footer>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.send(html);
});

export default router;
