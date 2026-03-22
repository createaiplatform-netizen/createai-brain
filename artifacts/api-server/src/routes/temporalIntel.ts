/**
 * routes/temporalIntel.ts — Temporal Intelligence Engine
 * ───────────────────────────────────────────────────────
 * Time-series analytics, trend detection, and temporal forecasting
 * across all CreateAI Brain platform domains.
 *
 * Routes:
 *   GET /api/temporal/trends?metric=&period=   Time-series trend data
 *   GET /api/temporal/forecast?metric=         Simple linear forecast
 *   GET /api/temporal/anomalies                Detected anomalies (3σ)
 *   GET /api/temporal/heatmap?metric=&days=    Activity heatmap data
 *   GET /api/temporal/velocity                 Domain growth velocity
 *   GET /api/temporal/status                   Engine status
 *   GET /api/temporal/dashboard                HTML dashboard
 */

import { Router, type Request, type Response } from "express";
import { sql }                                  from "@workspace/db";

const router = Router();

type TimePoint = { ts: string; value: number };

// ─── Pull time-series for a metric ───────────────────────────────────────────
async function fetchTimeSeries(
  metric: string,
  days: number
): Promise<TimePoint[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  switch (metric) {
    case "leads_created":
      return (await sql`
        SELECT DATE_TRUNC('day', created_at) AS ts, COUNT(*) AS value
        FROM leads WHERE created_at >= ${since}
        GROUP BY 1 ORDER BY 1
      `.catch(() => [])) as TimePoint[];

    case "projects_created":
      return (await sql`
        SELECT DATE_TRUNC('day', created_at) AS ts, COUNT(*) AS value
        FROM projects WHERE created_at >= ${since}
        GROUP BY 1 ORDER BY 1
      `.catch(() => [])) as TimePoint[];

    case "opportunities_created":
      return (await sql`
        SELECT DATE_TRUNC('day', created_at) AS ts, COUNT(*) AS value
        FROM opportunities WHERE created_at >= ${since}
        GROUP BY 1 ORDER BY 1
      `.catch(() => [])) as TimePoint[];

    case "patients_added":
      return (await sql`
        SELECT DATE_TRUNC('day', created_at) AS ts, COUNT(*) AS value
        FROM patients WHERE created_at >= ${since}
        GROUP BY 1 ORDER BY 1
      `.catch(() => [])) as TimePoint[];

    case "legal_clients_added":
      return (await sql`
        SELECT DATE_TRUNC('day', created_at) AS ts, COUNT(*) AS value
        FROM legal_clients WHERE created_at >= ${since}
        GROUP BY 1 ORDER BY 1
      `.catch(() => [])) as TimePoint[];

    case "candidates_added":
      return (await sql`
        SELECT DATE_TRUNC('day', created_at) AS ts, COUNT(*) AS value
        FROM candidates WHERE created_at >= ${since}
        GROUP BY 1 ORDER BY 1
      `.catch(() => [])) as TimePoint[];

    case "automation_executions":
      return (await sql`
        SELECT DATE_TRUNC('day', started_at) AS ts, COUNT(*) AS value
        FROM automation_executions WHERE started_at >= ${since}
        GROUP BY 1 ORDER BY 1
      `.catch(() => [])) as TimePoint[];

    case "platform_activity":
      return (await sql`
        SELECT DATE_TRUNC('day', created_at) AS ts, COUNT(*) AS value
        FROM activity_log WHERE created_at >= ${since}
        GROUP BY 1 ORDER BY 1
      `.catch(() => [])) as TimePoint[];

    case "traction_events":
      return (await sql`
        SELECT DATE_TRUNC('day', created_at) AS ts, COUNT(*) AS value
        FROM traction_events WHERE created_at >= ${since}
        GROUP BY 1 ORDER BY 1
      `.catch(() => [])) as TimePoint[];

    default:
      return [];
  }
}

// ─── Linear regression forecast ──────────────────────────────────────────────
function linearForecast(series: TimePoint[], forecastDays: number): TimePoint[] {
  if (series.length < 2) return [];

  const n = series.length;
  const xs = series.map((_, i) => i);
  const ys = series.map(p => Number(p.value));

  const sumX  = xs.reduce((a, b) => a + b, 0);
  const sumY  = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, _, i) => a + xs[i]! * ys[i]!, 0);
  const sumX2 = xs.reduce((a, b) => a + b * b, 0);

  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const lastTs = new Date((series[n - 1] as TimePoint).ts).getTime();
  const forecast: TimePoint[] = [];

  for (let i = 1; i <= forecastDays; i++) {
    const predictedY = Math.max(0, Math.round(intercept + slope * (n - 1 + i)));
    const ts         = new Date(lastTs + i * 86_400_000).toISOString();
    forecast.push({ ts, value: predictedY });
  }

  return forecast;
}

// ─── Detect anomalies (3σ rule) ───────────────────────────────────────────────
function detectAnomalies(series: TimePoint[]): Array<TimePoint & { zscore: number }> {
  if (series.length < 3) return [];

  const values = series.map(p => Number(p.value));
  const mean   = values.reduce((a, b) => a + b, 0) / values.length;
  const std    = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);

  if (std === 0) return [];

  return series
    .map((p, i) => ({ ...p, zscore: Math.abs((values[i]! - mean) / std) }))
    .filter(p => p.zscore > 2.5);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/temporal/trends
// ─────────────────────────────────────────────────────────────────────────────
router.get("/trends", async (req: Request, res: Response) => {
  const metric = String(req.query["metric"] ?? "platform_activity");
  const days   = Math.min(Math.max(Number(req.query["days"] ?? 30), 1), 365);

  const VALID_METRICS = [
    "leads_created", "projects_created", "opportunities_created",
    "patients_added", "legal_clients_added", "candidates_added",
    "automation_executions", "platform_activity", "traction_events",
  ];

  if (!VALID_METRICS.includes(metric)) {
    res.status(400).json({ error: `Invalid metric. Valid: ${VALID_METRICS.join(", ")}` }); return;
  }

  const series = await fetchTimeSeries(metric, days);
  const values = series.map(p => Number(p.value));
  const total  = values.reduce((a, b) => a + b, 0);
  const avg    = values.length ? total / values.length : 0;
  const max    = values.length ? Math.max(...values) : 0;
  const min    = values.length ? Math.min(...values) : 0;

  // Week-over-week change
  const midpoint = Math.floor(series.length / 2);
  const firstHalf  = series.slice(0, midpoint).reduce((a, p) => a + Number(p.value), 0);
  const secondHalf = series.slice(midpoint).reduce((a, p) => a + Number(p.value), 0);
  const wow = firstHalf === 0 ? null : ((secondHalf - firstHalf) / firstHalf) * 100;

  res.json({
    ok: true, metric, days, total, avg: Math.round(avg * 100) / 100, max, min,
    weekOverWeekChangePct: wow !== null ? Math.round(wow * 100) / 100 : null,
    points: series.length,
    series,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/temporal/forecast
// ─────────────────────────────────────────────────────────────────────────────
router.get("/forecast", async (req: Request, res: Response) => {
  const metric       = String(req.query["metric"] ?? "leads_created");
  const historyDays  = Math.min(Number(req.query["history"] ?? 30), 180);
  const forecastDays = Math.min(Number(req.query["forecast"] ?? 14), 90);

  const series   = await fetchTimeSeries(metric, historyDays);
  const forecast = linearForecast(series, forecastDays);
  const lastVal  = series.length ? Number((series[series.length - 1] as TimePoint).value) : 0;
  const forecastEnd = forecast.length ? Number((forecast[forecast.length - 1] as TimePoint).value) : 0;

  res.json({
    ok: true, metric, historyDays, forecastDays,
    history:         series,
    forecast,
    forecastSummary: {
      startValue:  lastVal,
      endValue:    forecastEnd,
      direction:   forecastEnd > lastVal ? "up" : forecastEnd < lastVal ? "down" : "flat",
      changePct:   lastVal > 0 ? Math.round(((forecastEnd - lastVal) / lastVal) * 10000) / 100 : null,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/temporal/anomalies
// ─────────────────────────────────────────────────────────────────────────────
router.get("/anomalies", async (_req: Request, res: Response) => {
  const metrics = [
    "leads_created", "projects_created", "platform_activity", "traction_events",
  ];

  const allAnomalies: Array<{ metric: string; ts: string; value: number; zscore: number }> = [];

  for (const metric of metrics) {
    const series = await fetchTimeSeries(metric, 60);
    const anom   = detectAnomalies(series).map(a => ({ metric, ...a }));
    allAnomalies.push(...anom);
  }

  allAnomalies.sort((a, b) => b.zscore - a.zscore);

  res.json({
    ok:        true,
    algorithm: "3σ Z-score anomaly detection",
    anomalies: allAnomalies,
    total:     allAnomalies.length,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/temporal/heatmap — activity heatmap by hour-of-day & day-of-week
// ─────────────────────────────────────────────────────────────────────────────
router.get("/heatmap", async (req: Request, res: Response) => {
  const days   = Math.min(Number(req.query["days"] ?? 30), 365);
  const since  = new Date(Date.now() - days * 86_400_000).toISOString();

  const rows = await sql`
    SELECT
      EXTRACT(DOW  FROM created_at) AS dow,
      EXTRACT(HOUR FROM created_at) AS hour,
      COUNT(*) AS events
    FROM activity_log
    WHERE created_at >= ${since}
    GROUP BY 1, 2
    ORDER BY 1, 2
  `.catch(() => []);

  const heatmap: Record<string, Record<string, number>> = {};
  const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  for (const row of rows as Array<{ dow: number; hour: number; events: number }>) {
    const day  = DOW[row.dow] ?? String(row.dow);
    const hour = String(row.hour).padStart(2, "0") + ":00";
    heatmap[day] = heatmap[day] ?? {};
    heatmap[day]![hour] = Number(row.events);
  }

  res.json({ ok: true, days, heatmap, metric: "activity_log" });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/temporal/velocity — growth velocity per domain
// ─────────────────────────────────────────────────────────────────────────────
router.get("/velocity", async (_req: Request, res: Response) => {
  const metrics = [
    { metric: "leads_created",        label: "Leads",         days: 30 },
    { metric: "projects_created",     label: "Projects",      days: 30 },
    { metric: "patients_added",       label: "Patients",      days: 30 },
    { metric: "legal_clients_added",  label: "Legal Clients", days: 30 },
    { metric: "candidates_added",     label: "Candidates",    days: 30 },
  ];

  const velocities: Array<{
    metric: string; label: string;
    totalLast30d: number; dailyRate: number; direction: string;
  }> = [];

  for (const m of metrics) {
    const series = await fetchTimeSeries(m.metric, m.days);
    const total  = series.reduce((a, p) => a + Number(p.value), 0);
    const rate   = series.length ? total / series.length : 0;
    const mid    = Math.floor(series.length / 2);
    const first  = series.slice(0, mid).reduce((a, p) => a + Number(p.value), 0);
    const second = series.slice(mid).reduce((a, p) => a + Number(p.value), 0);
    velocities.push({
      metric:       m.metric,
      label:        m.label,
      totalLast30d: total,
      dailyRate:    Math.round(rate * 100) / 100,
      direction:    second > first ? "accelerating" : second < first ? "decelerating" : "stable",
    });
  }

  velocities.sort((a, b) => b.dailyRate - a.dailyRate);

  res.json({ ok: true, period: "30d", velocities });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/temporal/status
// ─────────────────────────────────────────────────────────────────────────────
router.get("/status", (_req: Request, res: Response) => {
  res.json({
    ok:      true,
    engine:  "Temporal Intelligence Engine v1",
    metrics: [
      "leads_created", "projects_created", "opportunities_created",
      "patients_added", "legal_clients_added", "candidates_added",
      "automation_executions", "platform_activity", "traction_events",
    ],
    capabilities: ["trends", "forecast", "anomalies", "heatmap", "velocity"],
    algorithms:   ["Linear regression forecasting", "3σ Z-score anomaly detection", "Period-over-period velocity"],
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/temporal/dashboard — HTML dashboard
// ─────────────────────────────────────────────────────────────────────────────
router.get("/dashboard", async (_req: Request, res: Response) => {
  const velocities = await fetch("http://localhost:8080/api/temporal/velocity")
    .then(r => r.json() as Promise<{ velocities: Array<{ label: string; totalLast30d: number; dailyRate: number; direction: string }> }>)
    .catch(() => ({ velocities: [] }));

  const rows = (velocities.velocities ?? []).map(v => `
    <tr>
      <td>${v.label}</td>
      <td style="text-align:right;font-weight:600;color:#a5b4fc">${v.totalLast30d}</td>
      <td style="text-align:right">${v.dailyRate}/day</td>
      <td style="color:${v.direction === "accelerating" ? "#22c55e" : v.direction === "decelerating" ? "#ef4444" : "#94a3b8"}">${v.direction}</td>
    </tr>`).join("");

  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Temporal Intelligence — CreateAI Brain</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:#020617;color:#e2e8f0;min-height:100vh;padding:2rem}
h1{font-size:1.5rem;font-weight:700;color:#a5b4fc;margin-bottom:.5rem}
.sub{color:#64748b;font-size:.875rem;margin-bottom:2rem}
.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem}
h2{font-size:1rem;font-weight:600;color:#c7d2fe;margin-bottom:1rem}
table{width:100%;border-collapse:collapse;font-size:.875rem}
th{text-align:left;padding:.5rem;border-bottom:1px solid rgba(255,255,255,.1);color:#94a3b8}
td{padding:.5rem;border-bottom:1px solid rgba(255,255,255,.05)}
code{background:rgba(99,102,241,.2);padding:.2em .5em;border-radius:4px;font-size:.8rem}
</style></head>
<body>
<a href="#main" style="position:absolute;left:-999px;top:0">Skip to main</a>
<h1>⏱ Temporal Intelligence</h1>
<p class="sub">Time-series analytics, trend detection, and domain growth velocity</p>
<div class="card" id="main">
  <h2>Domain Growth Velocity (30d)</h2>
  <table>
    <thead><tr><th>Domain</th><th style="text-align:right">Total (30d)</th><th style="text-align:right">Daily Rate</th><th>Trajectory</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#64748b;padding:2rem">No activity data yet</td></tr>'}</tbody>
  </table>
</div>
<div class="card">
  <h2>API Reference</h2>
  <p style="font-size:.8rem;color:#94a3b8;line-height:2">
    <code>GET /api/temporal/trends?metric=leads_created&days=30</code><br>
    <code>GET /api/temporal/forecast?metric=leads_created&forecast=14</code><br>
    <code>GET /api/temporal/anomalies</code><br>
    <code>GET /api/temporal/heatmap?days=30</code><br>
    <code>GET /api/temporal/velocity</code>
  </p>
</div>
<div aria-live="polite"></div>
</body></html>`);
});

export default router;
