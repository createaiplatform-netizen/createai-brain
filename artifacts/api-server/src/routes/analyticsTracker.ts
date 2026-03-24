/**
 * routes/analyticsTracker.ts — Route view + click tracking
 * ─────────────────────────────────────────────────────────
 * POST /api/analytics/track   — Record a view or click event
 * GET  /api/analytics/summary — Total views, clicks, top routes
 * GET  /api/analytics/routes  — Views + clicks grouped by route
 * GET  /api/analytics/clicks  — Clicks grouped by route + metadata label
 *
 * Table is bootstrapped automatically on first load via CREATE TABLE IF NOT EXISTS.
 */

import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router = Router();

// ─── Bootstrap table (safe — IF NOT EXISTS, never drops anything) ─────────────

pool.query(`
  CREATE TABLE IF NOT EXISTS route_analytics (
    id          SERIAL PRIMARY KEY,
    timestamp   BIGINT  NOT NULL,
    route       TEXT    NOT NULL,
    event_type  TEXT    NOT NULL,
    metadata    JSONB,
    user_id     TEXT
  );
  CREATE INDEX IF NOT EXISTS ae_route_idx      ON route_analytics (route);
  CREATE INDEX IF NOT EXISTS ae_event_type_idx ON route_analytics (event_type);
  CREATE INDEX IF NOT EXISTS ae_timestamp_idx  ON route_analytics (timestamp);
  CREATE INDEX IF NOT EXISTS ae_user_id_idx    ON route_analytics (user_id);
`).catch((err: unknown) => {
  console.error("[analyticsTracker] bootstrap error:", err);
});

// ─── POST /api/analytics/track ────────────────────────────────────────────────

router.post("/track", async (req: Request, res: Response) => {
  const { route, event_type, metadata, user_id } = req.body || {};

  if (!route || !event_type || !["view", "click"].includes(event_type)) {
    res.status(400).json({ error: "Invalid analytics payload" });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO route_analytics (timestamp, route, event_type, metadata, user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [Date.now(), route, event_type, metadata ? JSON.stringify(metadata) : null, user_id ?? null]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[analyticsTracker] insert error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── GET /api/analytics/summary ───────────────────────────────────────────────

router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const [views, clicks, routes] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM route_analytics WHERE event_type = 'view'`),
      pool.query(`SELECT COUNT(*) AS count FROM route_analytics WHERE event_type = 'click'`),
      pool.query(`
        SELECT route,
               SUM(CASE WHEN event_type = 'view'  THEN 1 ELSE 0 END) AS views,
               SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS clicks
        FROM route_analytics
        GROUP BY route
        ORDER BY views DESC
        LIMIT 20
      `),
    ]);

    res.json({
      totalViews:  Number(views.rows[0]?.count  ?? 0),
      totalClicks: Number(clicks.rows[0]?.count ?? 0),
      topRoutes:   routes.rows,
    });
  } catch (err) {
    console.error("[analyticsTracker] summary error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── GET /api/analytics/routes ────────────────────────────────────────────────

router.get("/routes", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT route,
             SUM(CASE WHEN event_type = 'view'  THEN 1 ELSE 0 END) AS views,
             SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS clicks
      FROM route_analytics
      GROUP BY route
      ORDER BY views DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("[analyticsTracker] routes error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── GET /api/analytics/clicks ────────────────────────────────────────────────

router.get("/clicks", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT route,
             metadata,
             COUNT(*) AS clicks
      FROM route_analytics
      WHERE event_type = 'click'
      GROUP BY route, metadata
      ORDER BY clicks DESC
    `);

    const parsed = result.rows.map((row) => ({
      route:    row.route,
      clicks:   Number(row.clicks),
      metadata: row.metadata ?? null,
    }));

    res.json(parsed);
  } catch (err) {
    console.error("[analyticsTracker] clicks error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
