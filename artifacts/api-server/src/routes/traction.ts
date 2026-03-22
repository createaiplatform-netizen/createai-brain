import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { logTractionEvent } from "../lib/tractionLogger";

const router: IRouter = Router();

// ─── Registry snapshot (current known state) ──────────────────────────────
const REGISTRY_SNAPSHOT = {
  engines:          66,
  metaAgents:       37,
  totalEngines:     103,
  series:           24,
  apps:             200,
  registryVersion:  "6.0",
  engineCategories: [
    "Creative", "Strategy", "Workflow", "Connectivity", "Intelligence",
    "Research", "Communication", "Data", "Growth", "Compliance",
    "Identity", "Protocol",
    "Commerce", "Operations", "Governance", "Workforce", "Revenue",
  ],
  seriesLayers: [
    "omega","phi","uq","ice","ael","ucpx","gi","se","de","ab",
    "alpha","sigma","kappa","lambda","delta",
    "nexus","platform","identity","analytics",
    "domain","commerce","governance","workforce","engagement",
  ],
  platformEngines: [
    "NPA Identity Engine",
    "Handle Protocol Engine",
    "Self-Host Watchdog",
    "Platform Analytics Report",
    "Health Monitor Engine",
    "Internal TOTP Engine",
    "Internal Image Gen Engine",
    "HMAC Proof Engine",
  ],
  metaAgentNames: [
    "Meta Transcendent Launch",
    "Full Auto Wealth Maximizer",
    "100% Enforcer",
    "Ultimate Zero-Touch",
    "Above-Transcend",
    "Semantic Launch Console",
    "Orchestrator Agent",
    "Omni-Bridge Agent",
    "Creation Engine Registry",
    "Ultra Interaction Engine",
    "Platform Report Agent",
    "Health Monitor Agent",
    "TOTP Auth Agent",
    "Image Gen Agent",
    "Traction Velocity Agent",
    "Referral Loop Agent",
    "Lead Capture Agent",
    "Growth Analytics Agent",
  ],
  lastExpansion:  "2026-03-21",
  expansionCycles: 4,
};

// ─── POST /api/traction/event — log a client-side event ───────────────────
router.post("/event", async (req: Request, res: Response) => {
  try {
    const { eventType, category = "traction", subCategory, metadata = {} } = req.body as {
      eventType: string; category?: string; subCategory?: string; metadata?: Record<string, unknown>;
    };
    if (!eventType?.trim()) { res.status(400).json({ error: "eventType required" }); return; }
    const userId = (req as any).user?.id ?? null;
    logTractionEvent({ eventType: eventType.trim(), category, subCategory, userId, metadata });
    res.status(202).json({ ok: true });
  } catch (err) {
    console.error("[traction] POST /event", err);
    res.status(500).json({ error: "Failed to log event" });
  }
});

// ─── GET /api/traction/metrics — lifetime + period aggregates ─────────────
router.get("/metrics", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        event_type,
        sub_category,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')   AS today,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')  AS this_week,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS this_month,
        COUNT(*)                                                           AS lifetime
      FROM traction_events
      GROUP BY event_type, sub_category
      ORDER BY lifetime DESC
    `);

    const totals = rows.reduce(
      (acc: Record<string, number>, r: Record<string, string>) => {
        acc.today      = (acc.today      || 0) + Number(r.today);
        acc.this_week  = (acc.this_week  || 0) + Number(r.this_week);
        acc.this_month = (acc.this_month || 0) + Number(r.this_month);
        acc.lifetime   = (acc.lifetime   || 0) + Number(r.lifetime);
        return acc;
      },
      {}
    );

    res.json({ metrics: rows, totals, snapshot: REGISTRY_SNAPSHOT });
  } catch (err) {
    console.error("[traction] GET /metrics", err);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// ─── GET /api/traction/growth — daily counts last 90 days per event_type ──
router.get("/growth", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        event_type,
        DATE(created_at AT TIME ZONE 'UTC') AS date,
        COUNT(*)                             AS count
      FROM traction_events
      WHERE created_at >= NOW() - INTERVAL '90 days'
      GROUP BY event_type, DATE(created_at AT TIME ZONE 'UTC')
      ORDER BY date ASC, event_type
    `);

    const { rows: cumRows } = await pool.query(`
      SELECT
        DATE(created_at AT TIME ZONE 'UTC') AS date,
        COUNT(*)                             AS daily_total,
        SUM(COUNT(*)) OVER (ORDER BY DATE(created_at AT TIME ZONE 'UTC')) AS cumulative
      FROM traction_events
      WHERE created_at >= NOW() - INTERVAL '90 days'
      GROUP BY DATE(created_at AT TIME ZONE 'UTC')
      ORDER BY date ASC
    `);

    res.json({ daily: rows, cumulative: cumRows });
  } catch (err) {
    console.error("[traction] GET /growth", err);
    res.status(500).json({ error: "Failed to fetch growth data" });
  }
});

// ─── GET /api/traction/heatmap — activity by hour of day (last 30 days) ───
router.get("/heatmap", async (_req: Request, res: Response) => {
  try {
    const { rows: hourly } = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC')::int AS hour,
        COUNT(*) AS count
      FROM traction_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC')
      ORDER BY hour
    `);

    const { rows: daily } = await pool.query(`
      SELECT
        EXTRACT(DOW FROM created_at AT TIME ZONE 'UTC')::int AS dow,
        COUNT(*) AS count
      FROM traction_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(DOW FROM created_at AT TIME ZONE 'UTC')
      ORDER BY dow
    `);

    res.json({ hourly, daily });
  } catch (err) {
    console.error("[traction] GET /heatmap", err);
    res.status(500).json({ error: "Failed to fetch heatmap data" });
  }
});

// ─── GET /api/traction/snapshot — current registry state ──────────────────
router.get("/snapshot", async (_req: Request, res: Response) => {
  try {
    const { rows: snapshots } = await pool.query(`
      SELECT metadata, created_at
      FROM traction_events
      WHERE event_type = 'registry_snapshot'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const { rows: engineStats } = await pool.query(`
      SELECT
        sub_category AS engine,
        COUNT(*) AS activations,
        MAX(created_at) AS last_used
      FROM traction_events
      WHERE event_type = 'engine_run' AND sub_category IS NOT NULL
      GROUP BY sub_category
      ORDER BY activations DESC
    `);

    const { rows: seriesStats } = await pool.query(`
      SELECT
        sub_category AS series,
        COUNT(*) AS executions,
        MAX(created_at) AS last_used
      FROM traction_events
      WHERE event_type = 'series_run' AND sub_category IS NOT NULL
      GROUP BY sub_category
      ORDER BY executions DESC
    `);

    const { rows: appStats } = await pool.query(`
      SELECT
        sub_category AS app,
        COUNT(*) AS opens,
        MAX(created_at) AS last_used
      FROM traction_events
      WHERE event_type = 'app_opened' AND sub_category IS NOT NULL
      GROUP BY sub_category
      ORDER BY opens DESC
    `);

    res.json({ current: REGISTRY_SNAPSHOT, snapshots, engineStats, seriesStats, appStats });
  } catch (err) {
    console.error("[traction] GET /snapshot", err);
    res.status(500).json({ error: "Failed to fetch snapshot" });
  }
});

// ─── GET /api/traction/velocity — expansion velocity ─────────────────────
router.get("/velocity", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        event_type,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')   AS last_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '48 hours'
                          AND created_at < NOW() - INTERVAL '24 hours')      AS prev_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')     AS last_7d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '14 days'
                          AND created_at < NOW() - INTERVAL '7 days')        AS prev_7d
      FROM traction_events
      GROUP BY event_type
      ORDER BY last_24h DESC
    `);

    const velocity = rows.map((r: any) => ({
      eventType:  r.event_type,
      last24h:    Number(r.last_24h),
      prev24h:    Number(r.prev_24h),
      delta24h:   Number(r.last_24h) - Number(r.prev_24h),
      last7d:     Number(r.last_7d),
      prev7d:     Number(r.prev_7d),
      delta7d:    Number(r.last_7d) - Number(r.prev_7d),
    }));

    res.json({ velocity });
  } catch (err) {
    console.error("[traction] GET /velocity", err);
    res.status(500).json({ error: "Failed to fetch velocity" });
  }
});

// ─── GET /api/traction/engine-counts — per-engine run counts (all-time) ───
router.get("/engine-counts", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query<{ engine: string; count: string }>(`
      SELECT sub_category AS engine, COUNT(*) AS count
      FROM traction_events
      WHERE event_type = 'engine_run' AND sub_category IS NOT NULL
      GROUP BY sub_category
    `);
    const counts: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      counts[r.engine] = Number(r.count);
      total += Number(r.count);
    }
    res.json({ counts, total });
  } catch (err) {
    console.error("[traction] GET /engine-counts", err);
    res.status(500).json({ error: "Failed to fetch engine counts" });
  }
});

// ─── GET /api/traction/dashboard — HTML traction command surface ───────────
router.get("/dashboard", async (_req: Request, res: Response) => {
  // Pull live data from the DB
  let metrics: { today: number; this_week: number; this_month: number; lifetime: number } =
    { today: 0, this_week: 0, this_month: 0, lifetime: 0 };
  let topEvents: Array<{ event_type: string; lifetime: string }> = [];
  let growth24h = 0;

  try {
    const { rows: mRows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')   AS today,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')  AS this_week,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS this_month,
        COUNT(*) AS lifetime
      FROM traction_events
    `);
    const m = mRows[0] as Record<string, string> || {};
    metrics = {
      today:      Number(m.today      ?? 0),
      this_week:  Number(m.this_week  ?? 0),
      this_month: Number(m.this_month ?? 0),
      lifetime:   Number(m.lifetime   ?? 0),
    };

    const { rows: eRows } = await pool.query(`
      SELECT event_type, COUNT(*) AS lifetime
      FROM traction_events
      GROUP BY event_type
      ORDER BY lifetime DESC
      LIMIT 8
    `);
    topEvents = eRows as Array<{ event_type: string; lifetime: string }>;

    const { rows: g24h } = await pool.query(`
      SELECT COUNT(*) AS cnt FROM traction_events
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    growth24h = Number((g24h[0] as Record<string, string>)?.cnt ?? 0);
  } catch (_e) { /* DB may be empty */ }

  const RS = REGISTRY_SNAPSHOT;
  const topEventsHtml = topEvents.length
    ? topEvents.map(e => `
        <div class="evt-row">
          <div class="evt-type">${e.event_type.replace(/_/g, " ")}</div>
          <div class="evt-cnt">${Number(e.lifetime).toLocaleString()}</div>
        </div>`).join("")
    : `<div class="empty-msg">No events logged yet. Platform activity will appear here.</div>`;

  const seriesHtml = RS.seriesLayers.map(s =>
    `<span class="tag">${s}</span>`).join("");
  const catHtml    = RS.engineCategories.map(c =>
    `<span class="tag cat">${c}</span>`).join("");
  const platformHtml = RS.platformEngines.map(p =>
    `<div class="pe-row">◎ ${p}</div>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Traction Dashboard — CreateAI Brain</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#020617;--s2:#111827;--s3:#1e293b;--line:#1e293b;
          --t1:#e2e8f0;--t2:#94a3b8;--t3:#64748b;--t4:#475569;--ind:#6366f1;--ind2:#818cf8;--g:#10b981;}
    html,body{background:var(--bg);color:var(--t1);font-family:'Inter',-apple-system,sans-serif;font-size:14px;min-height:100vh;-webkit-font-smoothing:antialiased}
    a{color:inherit;text-decoration:none}
    .skip-link{position:absolute;top:-100px;left:1rem;background:var(--ind);color:#fff;padding:.4rem 1rem;border-radius:6px;font-weight:700;z-index:999;transition:top .2s}.skip-link:focus{top:1rem}
    .hdr{border-bottom:1px solid var(--line);padding:0 24px;background:rgba(2,6,23,.97);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
    .hdr-inner{max-width:1240px;margin:0 auto;height:52px;display:flex;align-items:center;gap:14px}
    .logo{font-size:.95rem;font-weight:900;letter-spacing:-.03em}.logo span{color:var(--ind2)}
    .bdg{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;background:rgba(99,102,241,.15);color:var(--ind2);border:1px solid rgba(99,102,241,.3);border-radius:99px;padding:3px 10px}
    .hdr-links{margin-left:auto;display:flex;gap:16px}.hdr-links a{color:var(--t3);font-size:.78rem;font-weight:600;transition:color .15s}.hdr-links a:hover{color:var(--t1)}
    .wrap{max-width:1240px;margin:0 auto;padding:32px 24px}
    .hero{margin-bottom:28px}.hero h1{font-size:1.6rem;font-weight:900;letter-spacing:-.04em;margin-bottom:4px}.hero h1 span{color:var(--ind2)}.hero p{font-size:.85rem;color:var(--t3)}
    .kpi-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:24px}
    .kpi{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:16px 20px}
    .kpi-lbl{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--t4);margin-bottom:6px}
    .kpi-val{font-size:1.5rem;font-weight:900;color:var(--ind2);letter-spacing:-.04em}
    .kpi.green .kpi-val{color:var(--g)}
    .reg-strip{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin-bottom:24px}
    .reg-kpi{background:var(--s2);border:1px solid var(--line);border-radius:12px;padding:14px 16px;text-align:center}
    .reg-kpi-val{font-size:1.3rem;font-weight:900;color:var(--t1);letter-spacing:-.03em}
    .reg-kpi-lbl{font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-top:4px}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px}
    .panel{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:22px}
    .panel-title{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--t4);margin-bottom:16px}
    .evt-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:.82rem}
    .evt-row:last-child{border-bottom:none}
    .evt-type{color:var(--t2);font-weight:600;text-transform:capitalize}
    .evt-cnt{font-weight:800;color:var(--ind2)}
    .pe-row{padding:6px 0;font-size:.8rem;color:var(--t3);border-bottom:1px solid var(--line)}
    .pe-row:last-child{border-bottom:none}
    .tags-panel{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:22px;margin-bottom:24px}
    .tag{display:inline-block;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);border-radius:6px;padding:3px 9px;font-size:.65rem;font-weight:600;color:var(--ind2);margin:3px}
    .tag.cat{background:rgba(16,185,129,.08);border-color:rgba(16,185,129,.2);color:#34d399}
    .empty-msg{color:var(--t4);font-size:.8rem;font-style:italic;padding:12px 0}
    .dot{width:8px;height:8px;border-radius:50%;background:var(--g);display:inline-block;margin-right:6px;animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    footer{border-top:1px solid var(--line);padding:20px 24px;text-align:center;font-size:.68rem;color:var(--t4);margin-top:4px}
    @media(max-width:768px){.two-col{grid-template-columns:1fr}.wrap{padding:20px 16px}}
  </style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="hdr" role="banner">
  <div class="hdr-inner">
    <a class="logo" href="/hub">CreateAI <span>Brain</span></a>
    <span class="bdg">Traction</span>
    <nav class="hdr-links" aria-label="Navigation">
      <a href="/hub">Hub</a>
      <a href="/api/platform/report/dashboard">Command Center</a>
      <a href="/api/traction/metrics">JSON</a>
    </nav>
  </div>
</header>
<main id="main" class="wrap">
  <div class="hero">
    <h1>Traction <span>Dashboard</span></h1>
    <p><span class="dot" aria-hidden="true"></span>Live event stream · Registry v${RS.registryVersion} · ${RS.expansionCycles} expansion cycles complete</p>
  </div>

  <div class="kpi-row" role="list" aria-label="Event totals">
    <div class="kpi" role="listitem"><div class="kpi-lbl">Lifetime Events</div><div class="kpi-val">${metrics.lifetime.toLocaleString()}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">This Month</div><div class="kpi-val">${metrics.this_month.toLocaleString()}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">This Week</div><div class="kpi-val">${metrics.this_week.toLocaleString()}</div></div>
    <div class="kpi green" role="listitem"><div class="kpi-lbl">Last 24h</div><div class="kpi-val">${growth24h.toLocaleString()}</div></div>
  </div>

  <div class="reg-strip" role="list" aria-label="Registry snapshot">
    <div class="reg-kpi" role="listitem"><div class="reg-kpi-val">${RS.engines}</div><div class="reg-kpi-lbl">Domain Engines</div></div>
    <div class="reg-kpi" role="listitem"><div class="reg-kpi-val">${RS.metaAgents}</div><div class="reg-kpi-lbl">Meta Agents</div></div>
    <div class="reg-kpi" role="listitem"><div class="reg-kpi-val">${RS.totalEngines}</div><div class="reg-kpi-lbl">Total Engines</div></div>
    <div class="reg-kpi" role="listitem"><div class="reg-kpi-val">${RS.series}</div><div class="reg-kpi-lbl">Series Layers</div></div>
    <div class="reg-kpi" role="listitem"><div class="reg-kpi-val">${RS.apps}</div><div class="reg-kpi-lbl">Apps in Scope</div></div>
    <div class="reg-kpi" role="listitem"><div class="reg-kpi-val">${RS.engineCategories.length}</div><div class="reg-kpi-lbl">Categories</div></div>
    <div class="reg-kpi" role="listitem"><div class="reg-kpi-val">${RS.platformEngines.length}</div><div class="reg-kpi-lbl">Platform Engines</div></div>
    <div class="reg-kpi" role="listitem"><div class="reg-kpi-val">${RS.lastExpansion}</div><div class="reg-kpi-lbl">Last Expansion</div></div>
  </div>

  <div class="two-col">
    <div class="panel">
      <div class="panel-title">Top Event Types (All-Time)</div>
      <div aria-live="polite">${topEventsHtml}</div>
    </div>
    <div class="panel">
      <div class="panel-title">Platform Engines (${RS.platformEngines.length})</div>
      ${platformHtml}
    </div>
  </div>

  <div class="tags-panel">
    <div class="panel-title">Engine Categories (${RS.engineCategories.length})</div>
    <div>${catHtml}</div>
    <div style="margin-top:14px"><div class="panel-title" style="margin-bottom:8px">Series Layers (${RS.seriesLayers.length})</div>
    <div>${seriesHtml}</div></div>
  </div>
</main>
<footer role="contentinfo">CreateAI Brain · Traction Intelligence Engine · Registry v${RS.registryVersion}</footer>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.send(html);
});

export default router;
