import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { logTractionEvent } from "../lib/tractionLogger";

const router: IRouter = Router();

// ─── Registry snapshot (current known state) ──────────────────────────────
const REGISTRY_SNAPSHOT = {
  engines:          47,
  metaAgents:       18,
  totalEngines:     65,
  series:           19,
  apps:             150,
  registryVersion:  "5.0",
  engineCategories: [
    "Creative", "Strategy", "Workflow", "Connectivity", "Intelligence",
    "Research", "Communication", "Data", "Growth", "Compliance",
    "Identity", "Protocol",
  ],
  seriesLayers: [
    "omega","phi","uq","ice","ael","ucpx","gi","se","de","ab",
    "alpha","sigma","kappa","lambda","delta",
    "nexus","platform","identity","analytics",
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

export default router;
