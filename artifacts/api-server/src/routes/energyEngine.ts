/**
 * routes/energyEngine.ts — Energy & Utilities Management Engine
 * ─────────────────────────────────────────────────────────────────
 * Full energy management: sites, meters, readings, alerts, billing, sustainability.
 */

import { Router, type Request, type Response } from "express";
import { rawSql as sql } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

async function ensureTables() {
  await sql`CREATE TABLE IF NOT EXISTS energy_sites (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(300) NOT NULL,
    address     VARCHAR(400),
    city        VARCHAR(100),
    type        VARCHAR(100) DEFAULT 'commercial',
    tariff      VARCHAR(100),
    status      VARCHAR(30) DEFAULT 'active',
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS energy_meters (
    id          SERIAL PRIMARY KEY,
    site_id     INTEGER REFERENCES energy_sites(id) ON DELETE CASCADE,
    meter_no    VARCHAR(100) UNIQUE,
    type        VARCHAR(50) DEFAULT 'electricity',
    unit        VARCHAR(20) DEFAULT 'kWh',
    status      VARCHAR(30) DEFAULT 'active',
    installed   DATE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS energy_readings (
    id          SERIAL PRIMARY KEY,
    meter_id    INTEGER REFERENCES energy_meters(id) ON DELETE CASCADE,
    reading     NUMERIC(14,4) NOT NULL,
    read_at     TIMESTAMPTZ DEFAULT NOW(),
    consumption NUMERIC(14,4),
    source      VARCHAR(50) DEFAULT 'manual',
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS energy_alerts (
    id          SERIAL PRIMARY KEY,
    site_id     INTEGER REFERENCES energy_sites(id) ON DELETE CASCADE,
    meter_id    INTEGER REFERENCES energy_meters(id) ON DELETE SET NULL,
    type        VARCHAR(100) DEFAULT 'threshold_exceeded',
    severity    VARCHAR(30) DEFAULT 'warning',
    message     TEXT,
    resolved    BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS energy_bills (
    id          SERIAL PRIMARY KEY,
    site_id     INTEGER REFERENCES energy_sites(id) ON DELETE CASCADE,
    period_from DATE,
    period_to   DATE,
    consumption NUMERIC(14,4),
    unit        VARCHAR(20) DEFAULT 'kWh',
    amount      NUMERIC(12,2),
    status      VARCHAR(30) DEFAULT 'unpaid',
    due_date    DATE,
    paid_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`;
}
ensureTables().catch(console.error);

router.get("/dashboard", async (_req: Request, res: Response) => {
  const [sites, meters, alerts, cons, bills] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM energy_sites WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM energy_meters WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM energy_alerts WHERE resolved=FALSE`,
    sql`SELECT COALESCE(SUM(consumption),0)::numeric AS t FROM energy_readings WHERE read_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COALESCE(SUM(amount),0)::numeric AS t FROM energy_bills WHERE status='unpaid'`,
  ]);
  res.json({ ok: true, engine: "Energy & Utilities Engine v1",
    activeSites: sites[0]?.n, activeMeters: meters[0]?.n, unresolvedAlerts: alerts[0]?.n,
    consumptionLast30d: cons[0]?.t, unpaidBillsTotal: bills[0]?.t });
});

router.get("/sites", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT s.*, COUNT(m.id)::int AS meter_count FROM energy_sites s
    LEFT JOIN energy_meters m ON m.site_id = s.id GROUP BY s.id ORDER BY s.name`;
  res.json({ ok: true, sites: rows, count: rows.length });
});
router.post("/sites", requireAuth, async (req: Request, res: Response) => {
  const { name, address, city, type, tariff } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO energy_sites (name, address, city, type, tariff) VALUES (${name}, ${address??null}, ${city??null}, ${type??'commercial'}, ${tariff??null}) RETURNING *`;
  res.status(201).json({ ok: true, site: row });
});
router.put("/sites/:id", requireAuth, async (req: Request, res: Response) => {
  const { name, tariff, status } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE energy_sites SET name=COALESCE(${name??null},name), tariff=COALESCE(${tariff??null},tariff), status=COALESCE(${status??null},status) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Site not found" }); return; }
  res.json({ ok: true, site: row });
});
router.delete("/sites/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM energy_sites WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/meters", async (req: Request, res: Response) => {
  const { site_id, type } = req.query as Record<string,string>;
  const rows = await sql`SELECT m.*, s.name AS site_name FROM energy_meters m
    LEFT JOIN energy_sites s ON s.id = m.site_id
    WHERE (${site_id||null}::text IS NULL OR m.site_id=${site_id}::int)
      AND (${type||null}::text IS NULL OR m.type=${type}) ORDER BY m.meter_no`;
  res.json({ ok: true, meters: rows, count: rows.length });
});
router.post("/meters", requireAuth, async (req: Request, res: Response) => {
  const { site_id, meter_no, type, unit, installed } = req.body as Record<string,unknown>;
  if (!site_id) { res.status(400).json({ error: "site_id required" }); return; }
  const [row] = await sql`INSERT INTO energy_meters (site_id, meter_no, type, unit, installed) VALUES (${site_id}, ${meter_no??null}, ${type??'electricity'}, ${unit??'kWh'}, ${installed??null}) RETURNING *`;
  res.status(201).json({ ok: true, meter: row });
});
router.delete("/meters/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM energy_meters WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/readings", async (req: Request, res: Response) => {
  const { meter_id, days = "30" } = req.query as Record<string,string>;
  const rows = await sql`SELECT r.*, m.meter_no, m.unit FROM energy_readings r
    LEFT JOIN energy_meters m ON m.id = r.meter_id
    WHERE (${meter_id||null}::text IS NULL OR r.meter_id=${meter_id}::int)
      AND r.read_at >= NOW() - INTERVAL '1 day' * ${parseInt(days)}
    ORDER BY r.read_at DESC`;
  res.json({ ok: true, readings: rows, count: rows.length });
});
router.post("/readings", requireAuth, async (req: Request, res: Response) => {
  const { meter_id, reading, read_at, source } = req.body as Record<string,unknown>;
  if (!meter_id || reading === undefined) { res.status(400).json({ error: "meter_id and reading required" }); return; }
  const [prev] = await sql`SELECT reading FROM energy_readings WHERE meter_id=${meter_id} ORDER BY read_at DESC LIMIT 1`;
  const consumption = prev ? Number(reading) - Number(prev.reading) : null;
  const [row] = await sql`INSERT INTO energy_readings (meter_id, reading, read_at, consumption, source)
    VALUES (${meter_id}, ${reading}, ${read_at??null}, ${consumption}, ${source??'manual'}) RETURNING *`;
  res.status(201).json({ ok: true, reading: row });
});

router.get("/alerts", async (req: Request, res: Response) => {
  const { resolved } = req.query as Record<string,string>;
  const rows = await sql`SELECT a.*, s.name AS site_name FROM energy_alerts a
    LEFT JOIN energy_sites s ON s.id = a.site_id
    WHERE (${resolved||null}::text IS NULL OR a.resolved = (${resolved}='true'))
    ORDER BY a.created_at DESC`;
  res.json({ ok: true, alerts: rows, count: rows.length });
});
router.post("/alerts", requireAuth, async (req: Request, res: Response) => {
  const { site_id, meter_id, type, severity, message } = req.body as Record<string,unknown>;
  if (!site_id || !message) { res.status(400).json({ error: "site_id and message required" }); return; }
  const [row] = await sql`INSERT INTO energy_alerts (site_id, meter_id, type, severity, message) VALUES (${site_id}, ${meter_id??null}, ${type??'threshold_exceeded'}, ${severity??'warning'}, ${message}) RETURNING *`;
  res.status(201).json({ ok: true, alert: row });
});
router.put("/alerts/:id/resolve", requireAuth, async (req: Request, res: Response) => {
  const [row] = await sql`UPDATE energy_alerts SET resolved=TRUE WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Alert not found" }); return; }
  res.json({ ok: true, alert: row });
});

router.get("/bills", async (req: Request, res: Response) => {
  const { site_id, status } = req.query as Record<string,string>;
  const rows = await sql`SELECT b.*, s.name AS site_name FROM energy_bills b
    LEFT JOIN energy_sites s ON s.id = b.site_id
    WHERE (${site_id||null}::text IS NULL OR b.site_id=${site_id}::int)
      AND (${status||null}::text IS NULL OR b.status=${status})
    ORDER BY b.period_from DESC`;
  res.json({ ok: true, bills: rows, count: rows.length });
});
router.post("/bills", requireAuth, async (req: Request, res: Response) => {
  const { site_id, period_from, period_to, consumption, amount, due_date } = req.body as Record<string,unknown>;
  if (!site_id || !amount) { res.status(400).json({ error: "site_id and amount required" }); return; }
  const [row] = await sql`INSERT INTO energy_bills (site_id, period_from, period_to, consumption, amount, due_date) VALUES (${site_id}, ${period_from??null}, ${period_to??null}, ${consumption??null}, ${amount}, ${due_date??null}) RETURNING *`;
  res.status(201).json({ ok: true, bill: row });
});
router.put("/bills/:id/pay", requireAuth, async (req: Request, res: Response) => {
  const [row] = await sql`UPDATE energy_bills SET status='paid', paid_at=NOW() WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Bill not found" }); return; }
  res.json({ ok: true, bill: row });
});

router.get("/stats", async (_req: Request, res: Response) => {
  const [sites, meters, cons, cost, alerts] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM energy_sites WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM energy_meters WHERE status='active'`,
    sql`SELECT COALESCE(SUM(consumption),0)::numeric AS t FROM energy_readings WHERE read_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COALESCE(SUM(amount),0)::numeric AS t FROM energy_bills WHERE created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*)::int AS n FROM energy_alerts WHERE resolved=FALSE`,
  ]);
  res.json({ ok: true, activeSites: sites[0]?.n, activeMeters: meters[0]?.n,
    consumptionKwh: cons[0]?.t, billedLast30d: cost[0]?.t, unresolvedAlerts: alerts[0]?.n });
});

export default router;
