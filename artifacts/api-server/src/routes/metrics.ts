/**
 * /api/metrics — simplified metrics facade over the traction_events table.
 *
 * POST /api/metrics                  — insert a metric record
 * GET  /api/metrics/summary          — aggregated counts (daily/weekly/monthly/lifetime)
 * GET  /api/metrics/curves           — time-series data for charts (30d / 12w / 12mo)
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { logTractionEvent } from "../lib/tractionLogger";

const router: IRouter = Router();

// ─── POST /api/metrics ────────────────────────────────────────────────────────
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
    const userId = (req as any).user?.id ?? null;
    const meta: Record<string, unknown> = { ...metadata };
    if (projectId) meta.projectId = projectId;

    logTractionEvent({
      eventType:   type.trim(),
      category:    "traction",
      subCategory: projectId ?? undefined,
      userId,
      metadata:    meta,
    });
    res.status(202).json({ ok: true, type: type.trim() });
  } catch (err) {
    console.error("[metrics] POST /", err);
    res.status(500).json({ error: "Failed to record metric" });
  }
});

// ─── GET /api/metrics/summary ─────────────────────────────────────────────────
router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        event_type                                                                AS type,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')           AS daily,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')          AS weekly,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')         AS monthly,
        COUNT(*)                                                                  AS lifetime
      FROM traction_events
      GROUP BY event_type
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
router.get("/curves", async (_req: Request, res: Response) => {
  try {
    const { rows: daily } = await pool.query(`
      SELECT
        DATE(created_at AT TIME ZONE 'UTC')  AS date,
        event_type                            AS type,
        COUNT(*)                              AS count
      FROM traction_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at AT TIME ZONE 'UTC'), event_type
      ORDER BY date ASC, event_type
    `);

    const { rows: weekly } = await pool.query(`
      SELECT
        DATE_TRUNC('week', created_at AT TIME ZONE 'UTC') AS week_start,
        event_type                                          AS type,
        COUNT(*)                                            AS count
      FROM traction_events
      WHERE created_at >= NOW() - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', created_at AT TIME ZONE 'UTC'), event_type
      ORDER BY week_start ASC, event_type
    `);

    const { rows: monthly } = await pool.query(`
      SELECT
        DATE_TRUNC('month', created_at AT TIME ZONE 'UTC') AS month_start,
        event_type                                           AS type,
        COUNT(*)                                             AS count
      FROM traction_events
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at AT TIME ZONE 'UTC'), event_type
      ORDER BY month_start ASC, event_type
    `);

    const { rows: cumulative } = await pool.query(`
      SELECT
        DATE(created_at AT TIME ZONE 'UTC') AS date,
        COUNT(*)                             AS daily_total,
        SUM(COUNT(*)) OVER (ORDER BY DATE(created_at AT TIME ZONE 'UTC')) AS running_total
      FROM traction_events
      WHERE created_at >= NOW() - INTERVAL '90 days'
      GROUP BY DATE(created_at AT TIME ZONE 'UTC')
      ORDER BY date ASC
    `);

    res.json({
      daily:      daily.map((r: any) => ({ date: r.date, type: r.type, count: Number(r.count) })),
      weekly:     weekly.map((r: any) => ({ weekStart: r.week_start, type: r.type, count: Number(r.count) })),
      monthly:    monthly.map((r: any) => ({ monthStart: r.month_start, type: r.type, count: Number(r.count) })),
      cumulative: cumulative.map((r: any) => ({
        date:         r.date,
        dailyTotal:   Number(r.daily_total),
        runningTotal: Number(r.running_total),
      })),
    });
  } catch (err) {
    console.error("[metrics] GET /curves", err);
    res.status(500).json({ error: "Failed to fetch curves" });
  }
});

export default router;
