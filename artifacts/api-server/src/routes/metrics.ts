/**
 * /api/metrics — real metrics backend using the `metrics` table.
 *
 * POST /api/metrics                — insert a metric record (Drizzle ORM)
 * GET  /api/metrics/summary        — counts grouped by type (daily/weekly/monthly/lifetime)
 * GET  /api/metrics/curves         — time-series for 30d daily, 12w weekly, 12mo monthly
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, metrics } from "@workspace/db";

const router: IRouter = Router();

// ─── POST /api/metrics ────────────────────────────────────────────────────────
// Body: { type: string, projectId?: string, metadata?: object }
// Inserts one row into the `metrics` table using Drizzle ORM.
router.post("/", async (req: Request, res: Response) => {
  try {
    const { type, projectId, metadata = {} } = req.body as {
      type: string;
      projectId?: string;
      metadata?: Record<string, unknown>;
    };

    if (!type?.trim()) {
      res.status(400).json({ error: "type is required" });
      return;
    }

    const [inserted] = await db
      .insert(metrics)
      .values({
        type:      type.trim(),
        projectId: projectId ?? null,
        metadata,
      })
      .returning({ id: metrics.id, type: metrics.type, timestamp: metrics.timestamp });

    res.status(201).json({ ok: true, metric: inserted });
  } catch (err) {
    console.error("[metrics] POST /", err);
    res.status(500).json({ error: "Failed to record metric" });
  }
});

// ─── GET /api/metrics/summary ─────────────────────────────────────────────────
// Returns aggregated counts per type: daily (1d), weekly (7d), monthly (30d), lifetime.
router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        type,
        COUNT(*) FILTER (WHERE "timestamp" >= NOW() - INTERVAL '1 day')   AS daily,
        COUNT(*) FILTER (WHERE "timestamp" >= NOW() - INTERVAL '7 days')  AS weekly,
        COUNT(*) FILTER (WHERE "timestamp" >= NOW() - INTERVAL '30 days') AS monthly,
        COUNT(*)                                                           AS lifetime
      FROM metrics
      GROUP BY type
      ORDER BY lifetime DESC
    `);

    const summary = rows.map((r: any) => ({
      type:     r.type,
      daily:    Number(r.daily),
      weekly:   Number(r.weekly),
      monthly:  Number(r.monthly),
      lifetime: Number(r.lifetime),
    }));

    const totals = summary.reduce(
      (acc, r) => ({
        daily:    acc.daily    + r.daily,
        weekly:   acc.weekly   + r.weekly,
        monthly:  acc.monthly  + r.monthly,
        lifetime: acc.lifetime + r.lifetime,
      }),
      { daily: 0, weekly: 0, monthly: 0, lifetime: 0 }
    );

    res.json({ summary, totals });
  } catch (err) {
    console.error("[metrics] GET /summary", err);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

// ─── GET /api/metrics/curves ──────────────────────────────────────────────────
// Returns time-series data:
//   daily   — counts per day for the last 30 days
//   weekly  — counts per week for the last 12 weeks
//   monthly — counts per month for the last 12 months
router.get("/curves", async (_req: Request, res: Response) => {
  try {
    const { rows: daily } = await pool.query(`
      SELECT
        DATE("timestamp" AT TIME ZONE 'UTC') AS date,
        type,
        COUNT(*)                             AS count
      FROM metrics
      WHERE "timestamp" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE("timestamp" AT TIME ZONE 'UTC'), type
      ORDER BY date ASC, type
    `);

    const { rows: weekly } = await pool.query(`
      SELECT
        DATE_TRUNC('week', "timestamp" AT TIME ZONE 'UTC') AS week_start,
        type,
        COUNT(*)                                           AS count
      FROM metrics
      WHERE "timestamp" >= NOW() - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', "timestamp" AT TIME ZONE 'UTC'), type
      ORDER BY week_start ASC, type
    `);

    const { rows: monthly } = await pool.query(`
      SELECT
        DATE_TRUNC('month', "timestamp" AT TIME ZONE 'UTC') AS month_start,
        type,
        COUNT(*)                                            AS count
      FROM metrics
      WHERE "timestamp" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "timestamp" AT TIME ZONE 'UTC'), type
      ORDER BY month_start ASC, type
    `);

    res.json({
      daily:   daily.map((r: any) => ({ date: r.date, type: r.type, count: Number(r.count) })),
      weekly:  weekly.map((r: any) => ({ weekStart: r.week_start, type: r.type, count: Number(r.count) })),
      monthly: monthly.map((r: any) => ({ monthStart: r.month_start, type: r.type, count: Number(r.count) })),
    });
  } catch (err) {
    console.error("[metrics] GET /curves", err);
    res.status(500).json({ error: "Failed to fetch curves" });
  }
});

export default router;
