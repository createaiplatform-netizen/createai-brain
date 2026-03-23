/**
 * routes/fleetLogistics.ts — Fleet & Logistics Management Engine
 * ─────────────────────────────────────────────────────────────────
 * Full fleet management: vehicles, drivers, routes, shipments, warehouses.
 *
 * Routes:
 *   GET  /api/fleet/dashboard
 *   GET  /api/fleet/vehicles          POST /api/fleet/vehicles
 *   GET  /api/fleet/vehicles/:id      PUT  /api/fleet/vehicles/:id      DELETE /api/fleet/vehicles/:id
 *   GET  /api/fleet/drivers           POST /api/fleet/drivers
 *   GET  /api/fleet/drivers/:id       PUT  /api/fleet/drivers/:id       DELETE /api/fleet/drivers/:id
 *   GET  /api/fleet/routes            POST /api/fleet/routes
 *   GET  /api/fleet/routes/:id        PUT  /api/fleet/routes/:id
 *   GET  /api/fleet/shipments         POST /api/fleet/shipments
 *   GET  /api/fleet/shipments/:id     PUT  /api/fleet/shipments/:id/status
 *   GET  /api/fleet/warehouses        POST /api/fleet/warehouses
 *   GET  /api/fleet/maintenance       POST /api/fleet/maintenance
 *   GET  /api/fleet/stats
 */

import { Router, type Request, type Response } from "express";
import { rawSql as sql } from "@workspace/db";
import { requireAuth }  from "../middlewares/requireAuth.js";

const router = Router();

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS fleet_vehicles (
      id           SERIAL PRIMARY KEY,
      vin          VARCHAR(50) UNIQUE,
      plate        VARCHAR(30),
      make         VARCHAR(100),
      model        VARCHAR(100),
      year         INTEGER,
      type         VARCHAR(50) DEFAULT 'truck',
      status       VARCHAR(30) DEFAULT 'available',
      capacity_kg  NUMERIC(10,2),
      fuel_type    VARCHAR(30) DEFAULT 'diesel',
      mileage      INTEGER DEFAULT 0,
      last_service DATE,
      notes        TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS fleet_drivers (
      id             SERIAL PRIMARY KEY,
      name           VARCHAR(200) NOT NULL,
      email          VARCHAR(255),
      phone          VARCHAR(50),
      license_no     VARCHAR(100),
      license_class  VARCHAR(20),
      license_expiry DATE,
      status         VARCHAR(30) DEFAULT 'active',
      vehicle_id     INTEGER REFERENCES fleet_vehicles(id) ON DELETE SET NULL,
      rating         NUMERIC(3,2) DEFAULT 5.0,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS fleet_routes (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(200) NOT NULL,
      origin        VARCHAR(300) NOT NULL,
      destination   VARCHAR(300) NOT NULL,
      distance_km   NUMERIC(10,2),
      estimated_hrs NUMERIC(5,2),
      status        VARCHAR(30) DEFAULT 'active',
      driver_id     INTEGER REFERENCES fleet_drivers(id) ON DELETE SET NULL,
      vehicle_id    INTEGER REFERENCES fleet_vehicles(id) ON DELETE SET NULL,
      scheduled_at  TIMESTAMPTZ,
      completed_at  TIMESTAMPTZ,
      notes         TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS fleet_shipments (
      id            SERIAL PRIMARY KEY,
      tracking_no   VARCHAR(100) UNIQUE DEFAULT 'TRK-' || LPAD(FLOOR(RANDOM()*9999999)::TEXT, 7, '0'),
      sender        VARCHAR(200),
      recipient     VARCHAR(200),
      origin        VARCHAR(300),
      destination   VARCHAR(300),
      weight_kg     NUMERIC(10,2),
      status        VARCHAR(50) DEFAULT 'pending',
      route_id      INTEGER REFERENCES fleet_routes(id) ON DELETE SET NULL,
      vehicle_id    INTEGER REFERENCES fleet_vehicles(id) ON DELETE SET NULL,
      estimated_delivery TIMESTAMPTZ,
      delivered_at  TIMESTAMPTZ,
      notes         TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS fleet_warehouses (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(200) NOT NULL,
      address     VARCHAR(400),
      city        VARCHAR(100),
      capacity_m2 NUMERIC(10,2),
      utilization NUMERIC(5,2) DEFAULT 0,
      manager     VARCHAR(200),
      phone       VARCHAR(50),
      status      VARCHAR(30) DEFAULT 'active',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS fleet_maintenance (
      id          SERIAL PRIMARY KEY,
      vehicle_id  INTEGER REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
      type        VARCHAR(100),
      description TEXT,
      cost        NUMERIC(10,2),
      date        DATE DEFAULT CURRENT_DATE,
      next_due    DATE,
      technician  VARCHAR(200),
      status      VARCHAR(30) DEFAULT 'completed',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
ensureTables().catch(console.error);

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
router.get("/dashboard", async (_req: Request, res: Response) => {
  const [v, d, s, w, m] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n, status FROM fleet_vehicles GROUP BY status`,
    sql`SELECT COUNT(*)::int AS n, status FROM fleet_drivers   GROUP BY status`,
    sql`SELECT COUNT(*)::int AS n, status FROM fleet_shipments GROUP BY status`,
    sql`SELECT COUNT(*)::int AS n FROM fleet_warehouses WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM fleet_maintenance WHERE date >= NOW() - INTERVAL '30 days'`,
  ]);
  const vehicles   = v.reduce((a: Record<string,number>, r) => { a[String(r.status)] = Number(r.n); return a; }, {});
  const drivers    = d.reduce((a: Record<string,number>, r) => { a[String(r.status)] = Number(r.n); return a; }, {});
  const shipments  = s.reduce((a: Record<string,number>, r) => { a[String(r.status)] = Number(r.n); return a; }, {});
  res.json({ ok: true, engine: "Fleet & Logistics Engine v1", vehicles, drivers, shipments,
    activeWarehouses: Number(w[0]?.n ?? 0), maintenanceLast30d: Number(m[0]?.n ?? 0) });
});

// ── VEHICLES ──────────────────────────────────────────────────────────────────
router.get("/vehicles", async (req: Request, res: Response) => {
  const { status, type } = req.query as Record<string, string>;
  const rows = await sql`SELECT * FROM fleet_vehicles WHERE
    (${ status || null }::text IS NULL OR status = ${ status })
    AND (${ type || null }::text IS NULL OR type = ${ type })
    ORDER BY created_at DESC`;
  res.json({ ok: true, vehicles: rows, count: rows.length });
});
router.post("/vehicles", requireAuth, async (req: Request, res: Response) => {
  const { vin, plate, make, model, year, type, capacity_kg, fuel_type } = req.body as Record<string,unknown>;
  if (!make || !model) { res.status(400).json({ error: "make and model are required" }); return; }
  const [row] = await sql`
    INSERT INTO fleet_vehicles (vin, plate, make, model, year, type, capacity_kg, fuel_type)
    VALUES (${vin??null}, ${plate??null}, ${make}, ${model}, ${year??null}, ${type??'truck'}, ${capacity_kg??null}, ${fuel_type??'diesel'})
    RETURNING *`;
  res.status(201).json({ ok: true, vehicle: row });
});
router.get("/vehicles/:id", async (req: Request, res: Response) => {
  const [row] = await sql`SELECT v.*, m.date AS last_maintenance_date FROM fleet_vehicles v
    LEFT JOIN fleet_maintenance m ON m.vehicle_id = v.id ORDER BY m.date DESC LIMIT 1
    OFFSET 0` .catch(() => []);
  const [v] = await sql`SELECT * FROM fleet_vehicles WHERE id = ${req.params.id}`;
  if (!v) { res.status(404).json({ error: "Vehicle not found" }); return; }
  res.json({ ok: true, vehicle: v });
});
router.put("/vehicles/:id", requireAuth, async (req: Request, res: Response) => {
  const { plate, status, mileage, notes, last_service } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE fleet_vehicles SET
    plate = COALESCE(${plate??null}, plate),
    status = COALESCE(${status??null}, status),
    mileage = COALESCE(${mileage??null}, mileage),
    notes = COALESCE(${notes??null}, notes),
    last_service = COALESCE(${last_service??null}, last_service)
    WHERE id = ${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Vehicle not found" }); return; }
  res.json({ ok: true, vehicle: row });
});
router.delete("/vehicles/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM fleet_vehicles WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

// ── DRIVERS ───────────────────────────────────────────────────────────────────
router.get("/drivers", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT d.*, v.make, v.model, v.plate FROM fleet_drivers d
    LEFT JOIN fleet_vehicles v ON v.id = d.vehicle_id ORDER BY d.name`;
  res.json({ ok: true, drivers: rows, count: rows.length });
});
router.post("/drivers", requireAuth, async (req: Request, res: Response) => {
  const { name, email, phone, license_no, license_class, license_expiry, vehicle_id } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [row] = await sql`INSERT INTO fleet_drivers (name, email, phone, license_no, license_class, license_expiry, vehicle_id)
    VALUES (${name}, ${email??null}, ${phone??null}, ${license_no??null}, ${license_class??null}, ${license_expiry??null}, ${vehicle_id??null})
    RETURNING *`;
  res.status(201).json({ ok: true, driver: row });
});
router.put("/drivers/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, vehicle_id, rating, phone } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE fleet_drivers SET
    status = COALESCE(${status??null}, status),
    vehicle_id = COALESCE(${vehicle_id??null}, vehicle_id),
    rating = COALESCE(${rating??null}, rating),
    phone = COALESCE(${phone??null}, phone)
    WHERE id = ${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Driver not found" }); return; }
  res.json({ ok: true, driver: row });
});
router.delete("/drivers/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM fleet_drivers WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

// ── ROUTES ────────────────────────────────────────────────────────────────────
router.get("/routes", async (req: Request, res: Response) => {
  const { status } = req.query as Record<string,string>;
  const rows = await sql`SELECT r.*, d.name AS driver_name, v.plate FROM fleet_routes r
    LEFT JOIN fleet_drivers d ON d.id = r.driver_id
    LEFT JOIN fleet_vehicles v ON v.id = r.vehicle_id
    WHERE (${ status || null }::text IS NULL OR r.status = ${ status })
    ORDER BY r.scheduled_at DESC NULLS LAST`;
  res.json({ ok: true, routes: rows, count: rows.length });
});
router.post("/routes", requireAuth, async (req: Request, res: Response) => {
  const { name, origin, destination, distance_km, estimated_hrs, driver_id, vehicle_id, scheduled_at } = req.body as Record<string,unknown>;
  if (!name || !origin || !destination) { res.status(400).json({ error: "name, origin, destination required" }); return; }
  const [row] = await sql`INSERT INTO fleet_routes (name, origin, destination, distance_km, estimated_hrs, driver_id, vehicle_id, scheduled_at)
    VALUES (${name}, ${origin}, ${destination}, ${distance_km??null}, ${estimated_hrs??null}, ${driver_id??null}, ${vehicle_id??null}, ${scheduled_at??null})
    RETURNING *`;
  res.status(201).json({ ok: true, route: row });
});
router.put("/routes/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, completed_at, notes } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE fleet_routes SET
    status = COALESCE(${status??null}, status),
    completed_at = COALESCE(${completed_at??null}, completed_at),
    notes = COALESCE(${notes??null}, notes)
    WHERE id = ${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Route not found" }); return; }
  res.json({ ok: true, route: row });
});

// ── SHIPMENTS ─────────────────────────────────────────────────────────────────
router.get("/shipments", async (req: Request, res: Response) => {
  const { status } = req.query as Record<string,string>;
  const rows = await sql`SELECT s.*, r.name AS route_name, v.plate FROM fleet_shipments s
    LEFT JOIN fleet_routes r ON r.id = s.route_id
    LEFT JOIN fleet_vehicles v ON v.id = s.vehicle_id
    WHERE (${ status || null }::text IS NULL OR s.status = ${ status })
    ORDER BY s.created_at DESC`;
  res.json({ ok: true, shipments: rows, count: rows.length });
});
router.post("/shipments", requireAuth, async (req: Request, res: Response) => {
  const { sender, recipient, origin, destination, weight_kg, route_id, vehicle_id, estimated_delivery } = req.body as Record<string,unknown>;
  if (!recipient || !destination) { res.status(400).json({ error: "recipient and destination required" }); return; }
  const [row] = await sql`INSERT INTO fleet_shipments (sender, recipient, origin, destination, weight_kg, route_id, vehicle_id, estimated_delivery)
    VALUES (${sender??null}, ${recipient}, ${origin??null}, ${destination}, ${weight_kg??null}, ${route_id??null}, ${vehicle_id??null}, ${estimated_delivery??null})
    RETURNING *`;
  res.status(201).json({ ok: true, shipment: row });
});
router.put("/shipments/:id/status", requireAuth, async (req: Request, res: Response) => {
  const { status, delivered_at } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE fleet_shipments SET
    status = COALESCE(${status??null}, status),
    delivered_at = CASE WHEN ${status} = 'delivered' THEN NOW() ELSE delivered_at END
    WHERE id = ${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Shipment not found" }); return; }
  res.json({ ok: true, shipment: row });
});

// ── WAREHOUSES ────────────────────────────────────────────────────────────────
router.get("/warehouses", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT * FROM fleet_warehouses ORDER BY name`;
  res.json({ ok: true, warehouses: rows, count: rows.length });
});
router.post("/warehouses", requireAuth, async (req: Request, res: Response) => {
  const { name, address, city, capacity_m2, manager, phone } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [row] = await sql`INSERT INTO fleet_warehouses (name, address, city, capacity_m2, manager, phone)
    VALUES (${name}, ${address??null}, ${city??null}, ${capacity_m2??null}, ${manager??null}, ${phone??null})
    RETURNING *`;
  res.status(201).json({ ok: true, warehouse: row });
});

// ── MAINTENANCE ───────────────────────────────────────────────────────────────
router.get("/maintenance", async (req: Request, res: Response) => {
  const { vehicle_id } = req.query as Record<string,string>;
  const rows = await sql`SELECT m.*, v.make, v.model, v.plate FROM fleet_maintenance m
    LEFT JOIN fleet_vehicles v ON v.id = m.vehicle_id
    WHERE (${ vehicle_id || null }::text IS NULL OR m.vehicle_id = ${ vehicle_id }::int)
    ORDER BY m.date DESC`;
  res.json({ ok: true, records: rows, count: rows.length });
});
router.post("/maintenance", requireAuth, async (req: Request, res: Response) => {
  const { vehicle_id, type, description, cost, date, next_due, technician } = req.body as Record<string,unknown>;
  if (!vehicle_id || !type) { res.status(400).json({ error: "vehicle_id and type required" }); return; }
  const [row] = await sql`INSERT INTO fleet_maintenance (vehicle_id, type, description, cost, date, next_due, technician)
    VALUES (${vehicle_id}, ${type}, ${description??null}, ${cost??null}, ${date??null}, ${next_due??null}, ${technician??null})
    RETURNING *`;
  await sql`UPDATE fleet_vehicles SET last_service = ${date??new Date().toISOString().slice(0,10)} WHERE id = ${vehicle_id}`;
  res.status(201).json({ ok: true, record: row });
});

// ── STATS ─────────────────────────────────────────────────────────────────────
router.get("/stats", async (_req: Request, res: Response) => {
  const [v, d, s, del, wh] = await Promise.all([
    sql`SELECT COUNT(*)::int AS total FROM fleet_vehicles`,
    sql`SELECT COUNT(*)::int AS total FROM fleet_drivers WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS total FROM fleet_shipments`,
    sql`SELECT COUNT(*)::int AS total FROM fleet_shipments WHERE status='delivered'`,
    sql`SELECT COUNT(*)::int AS total FROM fleet_warehouses`,
  ]);
  res.json({ ok: true, totalVehicles: v[0]?.total, activeDrivers: d[0]?.total,
    totalShipments: s[0]?.total, deliveredShipments: del[0]?.total, warehouses: wh[0]?.total });
});

export default router;
