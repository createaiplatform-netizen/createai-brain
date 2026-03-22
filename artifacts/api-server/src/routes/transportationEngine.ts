/**
 * routes/transportationEngine.ts — Transportation & Fleet Operations Engine
 * ──────────────────────────────────────────────────────────────────────────
 * Full transportation management: vehicles, drivers, trips, routes, fuel, maintenance.
 */

import { Router, type Request, type Response } from "express";
import { sql }         from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

async function ensureTables() {
  await sql`CREATE TABLE IF NOT EXISTS trans_vehicles (
    id           SERIAL PRIMARY KEY,
    vin          VARCHAR(50) UNIQUE,
    plate        VARCHAR(30),
    make         VARCHAR(100),
    model        VARCHAR(100),
    year         INTEGER,
    type         VARCHAR(50) DEFAULT 'sedan',
    status       VARCHAR(30) DEFAULT 'available',
    capacity     INTEGER DEFAULT 4,
    fuel_type    VARCHAR(30) DEFAULT 'gasoline',
    odometer_km  NUMERIC(12,2) DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS trans_drivers (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(300) NOT NULL,
    email          VARCHAR(255),
    phone          VARCHAR(50),
    license_no     VARCHAR(100),
    license_class  VARCHAR(20),
    license_expiry DATE,
    status         VARCHAR(30) DEFAULT 'active',
    rating         NUMERIC(3,2) DEFAULT 5.0,
    trips_completed INTEGER DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS trans_trips (
    id             SERIAL PRIMARY KEY,
    trip_no        VARCHAR(100) UNIQUE DEFAULT 'TRIP-' || LPAD(FLOOR(RANDOM()*999999)::TEXT, 6, '0'),
    vehicle_id     INTEGER REFERENCES trans_vehicles(id) ON DELETE SET NULL,
    driver_id      INTEGER REFERENCES trans_drivers(id) ON DELETE SET NULL,
    origin         VARCHAR(400),
    destination    VARCHAR(400),
    distance_km    NUMERIC(12,2),
    passenger_name VARCHAR(300),
    passenger_phone VARCHAR(50),
    fare           NUMERIC(10,2),
    status         VARCHAR(30) DEFAULT 'scheduled',
    scheduled_at   TIMESTAMPTZ,
    started_at     TIMESTAMPTZ,
    completed_at   TIMESTAMPTZ,
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS trans_fuel_logs (
    id          SERIAL PRIMARY KEY,
    vehicle_id  INTEGER REFERENCES trans_vehicles(id) ON DELETE CASCADE,
    liters      NUMERIC(10,2),
    cost        NUMERIC(10,2),
    odometer    NUMERIC(12,2),
    station     VARCHAR(300),
    logged_at   TIMESTAMPTZ DEFAULT NOW(),
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS trans_maintenance (
    id          SERIAL PRIMARY KEY,
    vehicle_id  INTEGER REFERENCES trans_vehicles(id) ON DELETE CASCADE,
    type        VARCHAR(100),
    description TEXT,
    cost        NUMERIC(10,2),
    date        DATE DEFAULT CURRENT_DATE,
    next_due    DATE,
    technician  VARCHAR(200),
    status      VARCHAR(30) DEFAULT 'completed',
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`;
}
ensureTables().catch(console.error);

router.get("/dashboard", async (_req: Request, res: Response) => {
  const [v, d, t, fuel, maint] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n, status FROM trans_vehicles GROUP BY status`,
    sql`SELECT COUNT(*)::int AS n FROM trans_drivers WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n, status FROM trans_trips WHERE created_at >= NOW() - INTERVAL '24 hours' GROUP BY status`,
    sql`SELECT COALESCE(SUM(cost),0)::numeric AS t FROM trans_fuel_logs WHERE logged_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*)::int AS n FROM trans_maintenance WHERE next_due <= NOW() + INTERVAL '7 days' AND status='completed'`,
  ]);
  const vByStatus = v.reduce((a: Record<string,number>, r) => { a[String(r.status)] = Number(r.n); return a; }, {});
  const tByStatus = t.reduce((a: Record<string,number>, r) => { a[String(r.status)] = Number(r.n); return a; }, {});
  res.json({ ok: true, engine: "Transportation Operations Engine v1",
    vehicles: vByStatus, activeDrivers: d[0]?.n, tripsToday: tByStatus,
    fuelCostLast30d: fuel[0]?.t, upcomingMaintenances: maint[0]?.n });
});

router.get("/vehicles", async (req: Request, res: Response) => {
  const { status, type } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM trans_vehicles WHERE (${status||null}::text IS NULL OR status=${status}) AND (${type||null}::text IS NULL OR type=${type}) ORDER BY plate`;
  res.json({ ok: true, vehicles: rows, count: rows.length });
});
router.post("/vehicles", requireAuth, async (req: Request, res: Response) => {
  const { vin, plate, make, model, year, type, capacity, fuel_type } = req.body as Record<string,unknown>;
  if (!make || !model) { res.status(400).json({ error: "make and model required" }); return; }
  const [row] = await sql`INSERT INTO trans_vehicles (vin, plate, make, model, year, type, capacity, fuel_type)
    VALUES (${vin??null}, ${plate??null}, ${make}, ${model}, ${year??null}, ${type??'sedan'}, ${capacity??4}, ${fuel_type??'gasoline'}) RETURNING *`;
  res.status(201).json({ ok: true, vehicle: row });
});
router.put("/vehicles/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, odometer_km } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE trans_vehicles SET status=COALESCE(${status??null},status), odometer_km=COALESCE(${odometer_km??null},odometer_km) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Vehicle not found" }); return; }
  res.json({ ok: true, vehicle: row });
});
router.delete("/vehicles/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM trans_vehicles WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/drivers", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT * FROM trans_drivers ORDER BY name`;
  res.json({ ok: true, drivers: rows, count: rows.length });
});
router.post("/drivers", requireAuth, async (req: Request, res: Response) => {
  const { name, email, phone, license_no, license_class, license_expiry } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO trans_drivers (name, email, phone, license_no, license_class, license_expiry)
    VALUES (${name}, ${email??null}, ${phone??null}, ${license_no??null}, ${license_class??null}, ${license_expiry??null}) RETURNING *`;
  res.status(201).json({ ok: true, driver: row });
});
router.put("/drivers/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, rating } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE trans_drivers SET status=COALESCE(${status??null},status), rating=COALESCE(${rating??null},rating) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Driver not found" }); return; }
  res.json({ ok: true, driver: row });
});
router.delete("/drivers/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM trans_drivers WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/trips", async (req: Request, res: Response) => {
  const { status, driver_id, from, to } = req.query as Record<string,string>;
  const rows = await sql`SELECT tr.*, d.name AS driver_name, v.plate FROM trans_trips tr
    LEFT JOIN trans_drivers d ON d.id=tr.driver_id
    LEFT JOIN trans_vehicles v ON v.id=tr.vehicle_id
    WHERE (${status||null}::text IS NULL OR tr.status=${status})
      AND (${driver_id||null}::text IS NULL OR tr.driver_id=${driver_id}::int)
      AND (${from||null}::text IS NULL OR tr.scheduled_at >= ${from}::timestamptz)
    ORDER BY tr.scheduled_at DESC NULLS LAST`;
  res.json({ ok: true, trips: rows, count: rows.length });
});
router.post("/trips", requireAuth, async (req: Request, res: Response) => {
  const { vehicle_id, driver_id, origin, destination, passenger_name, passenger_phone, fare, scheduled_at } = req.body as Record<string,unknown>;
  if (!origin || !destination) { res.status(400).json({ error: "origin and destination required" }); return; }
  const [row] = await sql`INSERT INTO trans_trips (vehicle_id, driver_id, origin, destination, passenger_name, passenger_phone, fare, scheduled_at)
    VALUES (${vehicle_id??null}, ${driver_id??null}, ${origin}, ${destination}, ${passenger_name??null}, ${passenger_phone??null}, ${fare??null}, ${scheduled_at??null}) RETURNING *`;
  res.status(201).json({ ok: true, trip: row });
});
router.post("/trips/:id/start", requireAuth, async (req: Request, res: Response) => {
  const [row] = await sql`UPDATE trans_trips SET status='in_progress', started_at=NOW() WHERE id=${req.params.id} AND status='scheduled' RETURNING *`;
  if (!row) { res.status(400).json({ error: "Trip not found or not in scheduled state" }); return; }
  res.json({ ok: true, trip: row });
});
router.post("/trips/:id/complete", requireAuth, async (req: Request, res: Response) => {
  const { distance_km } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE trans_trips SET status='completed', completed_at=NOW(), distance_km=COALESCE(${distance_km??null},distance_km) WHERE id=${req.params.id} RETURNING driver_id`;
  if (!row) { res.status(400).json({ error: "Trip not found" }); return; }
  if (row.driver_id) { await sql`UPDATE trans_drivers SET trips_completed=trips_completed+1 WHERE id=${row.driver_id}`; }
  res.json({ ok: true });
});
router.delete("/trips/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM trans_trips WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/fuel-logs", async (req: Request, res: Response) => {
  const { vehicle_id } = req.query as Record<string,string>;
  const rows = await sql`SELECT f.*, v.plate FROM trans_fuel_logs f LEFT JOIN trans_vehicles v ON v.id=f.vehicle_id WHERE (${vehicle_id||null}::text IS NULL OR f.vehicle_id=${vehicle_id}::int) ORDER BY f.logged_at DESC`;
  res.json({ ok: true, fuelLogs: rows, count: rows.length });
});
router.post("/fuel-logs", requireAuth, async (req: Request, res: Response) => {
  const { vehicle_id, liters, cost, odometer, station } = req.body as Record<string,unknown>;
  if (!vehicle_id || !liters) { res.status(400).json({ error: "vehicle_id and liters required" }); return; }
  const [row] = await sql`INSERT INTO trans_fuel_logs (vehicle_id, liters, cost, odometer, station)
    VALUES (${vehicle_id}, ${liters}, ${cost??null}, ${odometer??null}, ${station??null}) RETURNING *`;
  if (odometer) { await sql`UPDATE trans_vehicles SET odometer_km=${odometer} WHERE id=${vehicle_id}`; }
  res.status(201).json({ ok: true, fuelLog: row });
});

router.get("/maintenance", async (req: Request, res: Response) => {
  const { vehicle_id } = req.query as Record<string,string>;
  const rows = await sql`SELECT m.*, v.plate FROM trans_maintenance m LEFT JOIN trans_vehicles v ON v.id=m.vehicle_id WHERE (${vehicle_id||null}::text IS NULL OR m.vehicle_id=${vehicle_id}::int) ORDER BY m.date DESC`;
  res.json({ ok: true, records: rows, count: rows.length });
});
router.post("/maintenance", requireAuth, async (req: Request, res: Response) => {
  const { vehicle_id, type, description, cost, date, next_due, technician } = req.body as Record<string,unknown>;
  if (!vehicle_id || !type) { res.status(400).json({ error: "vehicle_id and type required" }); return; }
  const [row] = await sql`INSERT INTO trans_maintenance (vehicle_id, type, description, cost, date, next_due, technician)
    VALUES (${vehicle_id}, ${type}, ${description??null}, ${cost??null}, ${date??null}, ${next_due??null}, ${technician??null}) RETURNING *`;
  res.status(201).json({ ok: true, record: row });
});

router.get("/stats", async (_req: Request, res: Response) => {
  const [v, d, t, fare, fuel] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM trans_vehicles`,
    sql`SELECT COUNT(*)::int AS n FROM trans_drivers WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM trans_trips WHERE status='completed' AND created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COALESCE(SUM(fare),0)::numeric AS r FROM trans_trips WHERE status='completed' AND created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COALESCE(SUM(cost),0)::numeric AS r FROM trans_fuel_logs WHERE logged_at >= NOW() - INTERVAL '30 days'`,
  ]);
  res.json({ ok: true, totalVehicles: v[0]?.n, activeDrivers: d[0]?.n,
    tripsLast30d: t[0]?.n, revenueLast30d: fare[0]?.r, fuelCostLast30d: fuel[0]?.r });
});

export default router;
