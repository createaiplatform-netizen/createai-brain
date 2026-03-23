/**
 * routes/hospitalityEngine.ts — Hospitality & Property Management Engine
 * ─────────────────────────────────────────────────────────────────────────
 * Full PMS: properties, rooms, reservations, guests, housekeeping, billing.
 *
 * Routes:
 *   GET  /api/hospitality/dashboard
 *   CRUD /api/hospitality/properties
 *   CRUD /api/hospitality/rooms
 *   CRUD /api/hospitality/guests
 *   CRUD /api/hospitality/reservations
 *   POST /api/hospitality/reservations/:id/check-in
 *   POST /api/hospitality/reservations/:id/check-out
 *   GET  /api/hospitality/housekeeping   POST /api/hospitality/housekeeping
 *   PUT  /api/hospitality/housekeeping/:id/complete
 *   GET  /api/hospitality/stats
 */

import { Router, type Request, type Response } from "express";
import { rawSql as sql } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS hosp_properties (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(300) NOT NULL,
      address     VARCHAR(400),
      city        VARCHAR(100),
      country     VARCHAR(100) DEFAULT 'US',
      phone       VARCHAR(50),
      email       VARCHAR(255),
      stars       INTEGER,
      amenities   JSONB DEFAULT '[]',
      status      VARCHAR(30) DEFAULT 'active',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS hosp_rooms (
      id            SERIAL PRIMARY KEY,
      property_id   INTEGER REFERENCES hosp_properties(id) ON DELETE CASCADE,
      room_number   VARCHAR(20) NOT NULL,
      type          VARCHAR(100) DEFAULT 'standard',
      floor         INTEGER,
      capacity      INTEGER DEFAULT 2,
      rate_per_night NUMERIC(10,2) NOT NULL DEFAULT 100,
      status        VARCHAR(30) DEFAULT 'available',
      amenities     JSONB DEFAULT '[]',
      notes         TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(property_id, room_number)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS hosp_guests (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(300) NOT NULL,
      email         VARCHAR(255),
      phone         VARCHAR(50),
      id_type       VARCHAR(50),
      id_number     VARCHAR(100),
      nationality   VARCHAR(100),
      dob           DATE,
      loyalty_tier  VARCHAR(30) DEFAULT 'standard',
      loyalty_pts   INTEGER DEFAULT 0,
      notes         TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS hosp_reservations (
      id            SERIAL PRIMARY KEY,
      booking_ref   VARCHAR(100) UNIQUE DEFAULT 'BK-' || LPAD(FLOOR(RANDOM()*9999999)::TEXT, 7, '0'),
      guest_id      INTEGER REFERENCES hosp_guests(id) ON DELETE SET NULL,
      room_id       INTEGER REFERENCES hosp_rooms(id) ON DELETE SET NULL,
      check_in      DATE NOT NULL,
      check_out     DATE NOT NULL,
      nights        INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,
      adults        INTEGER DEFAULT 1,
      children      INTEGER DEFAULT 0,
      status        VARCHAR(30) DEFAULT 'confirmed',
      rate          NUMERIC(10,2),
      total         NUMERIC(12,2),
      payment_status VARCHAR(30) DEFAULT 'pending',
      special_req   TEXT,
      checked_in_at  TIMESTAMPTZ,
      checked_out_at TIMESTAMPTZ,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS hosp_housekeeping (
      id           SERIAL PRIMARY KEY,
      room_id      INTEGER REFERENCES hosp_rooms(id) ON DELETE CASCADE,
      type         VARCHAR(50) DEFAULT 'daily_clean',
      status       VARCHAR(30) DEFAULT 'pending',
      assigned_to  VARCHAR(200),
      priority     VARCHAR(30) DEFAULT 'normal',
      notes        TEXT,
      due_at       TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
ensureTables().catch(console.error);

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
router.get("/dashboard", async (_req: Request, res: Response) => {
  const [props, rooms, res_, occ, hk] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM hosp_properties WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n, status FROM hosp_rooms GROUP BY status`,
    sql`SELECT COUNT(*)::int AS n, status FROM hosp_reservations WHERE check_in <= NOW()::date AND check_out > NOW()::date GROUP BY status`,
    sql`SELECT ROUND(100.0 * COUNT(CASE WHEN status='occupied' THEN 1 END) / GREATEST(COUNT(*),1))::int AS pct FROM hosp_rooms`,
    sql`SELECT COUNT(*)::int AS n FROM hosp_housekeeping WHERE status='pending'`,
  ]);
  const roomsByStatus = rooms.reduce((a: Record<string,number>, r) => { a[String(r.status)] = Number(r.n); return a; }, {});
  const checkedIn     = res_.find(r => r.status === 'checked_in')?.n ?? 0;
  res.json({ ok: true, engine: "Hospitality PMS Engine v1",
    activeProperties: props[0]?.n, rooms: roomsByStatus,
    occupancyRate: occ[0]?.pct, currentGuests: checkedIn,
    pendingHousekeeping: hk[0]?.n });
});

// ── PROPERTIES ────────────────────────────────────────────────────────────────
router.get("/properties", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT p.*, COUNT(r.id)::int AS room_count
    FROM hosp_properties p LEFT JOIN hosp_rooms r ON r.property_id = p.id
    GROUP BY p.id ORDER BY p.name`;
  res.json({ ok: true, properties: rows, count: rows.length });
});
router.post("/properties", requireAuth, async (req: Request, res: Response) => {
  const { name, address, city, country, phone, email, stars, amenities } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [row] = await sql`INSERT INTO hosp_properties (name, address, city, country, phone, email, stars, amenities)
    VALUES (${name}, ${address??null}, ${city??null}, ${country??'US'}, ${phone??null}, ${email??null}, ${stars??null}, ${JSON.stringify(amenities??[])})
    RETURNING *`;
  res.status(201).json({ ok: true, property: row });
});
router.put("/properties/:id", requireAuth, async (req: Request, res: Response) => {
  const { name, phone, email, status } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE hosp_properties SET
    name = COALESCE(${name??null}, name),
    phone = COALESCE(${phone??null}, phone),
    email = COALESCE(${email??null}, email),
    status = COALESCE(${status??null}, status)
    WHERE id = ${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Property not found" }); return; }
  res.json({ ok: true, property: row });
});
router.delete("/properties/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM hosp_properties WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

// ── ROOMS ─────────────────────────────────────────────────────────────────────
router.get("/rooms", async (req: Request, res: Response) => {
  const { property_id, status, type } = req.query as Record<string,string>;
  const rows = await sql`SELECT r.*, p.name AS property_name FROM hosp_rooms r
    LEFT JOIN hosp_properties p ON p.id = r.property_id
    WHERE (${property_id||null}::text IS NULL OR r.property_id = ${property_id}::int)
      AND (${status||null}::text IS NULL OR r.status = ${status})
      AND (${type||null}::text IS NULL OR r.type = ${type})
    ORDER BY r.room_number`;
  res.json({ ok: true, rooms: rows, count: rows.length });
});
router.post("/rooms", requireAuth, async (req: Request, res: Response) => {
  const { property_id, room_number, type, floor, capacity, rate_per_night, amenities } = req.body as Record<string,unknown>;
  if (!property_id || !room_number || !rate_per_night) { res.status(400).json({ error: "property_id, room_number, rate_per_night required" }); return; }
  const [row] = await sql`INSERT INTO hosp_rooms (property_id, room_number, type, floor, capacity, rate_per_night, amenities)
    VALUES (${property_id}, ${room_number}, ${type??'standard'}, ${floor??null}, ${capacity??2}, ${rate_per_night}, ${JSON.stringify(amenities??[])})
    RETURNING *`;
  res.status(201).json({ ok: true, room: row });
});
router.put("/rooms/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, rate_per_night, notes } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE hosp_rooms SET
    status = COALESCE(${status??null}, status),
    rate_per_night = COALESCE(${rate_per_night??null}, rate_per_night),
    notes = COALESCE(${notes??null}, notes)
    WHERE id = ${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Room not found" }); return; }
  res.json({ ok: true, room: row });
});
router.delete("/rooms/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM hosp_rooms WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

// ── GUESTS ────────────────────────────────────────────────────────────────────
router.get("/guests", async (req: Request, res: Response) => {
  const { q } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM hosp_guests
    WHERE (${q||null}::text IS NULL OR name ILIKE ${'%'+(q||'')+'%'} OR email ILIKE ${'%'+(q||'')+'%'})
    ORDER BY name`;
  res.json({ ok: true, guests: rows, count: rows.length });
});
router.post("/guests", requireAuth, async (req: Request, res: Response) => {
  const { name, email, phone, id_type, id_number, nationality, dob } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [row] = await sql`INSERT INTO hosp_guests (name, email, phone, id_type, id_number, nationality, dob)
    VALUES (${name}, ${email??null}, ${phone??null}, ${id_type??null}, ${id_number??null}, ${nationality??null}, ${dob??null})
    RETURNING *`;
  res.status(201).json({ ok: true, guest: row });
});
router.put("/guests/:id", requireAuth, async (req: Request, res: Response) => {
  const { loyalty_tier, loyalty_pts, notes } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE hosp_guests SET
    loyalty_tier = COALESCE(${loyalty_tier??null}, loyalty_tier),
    loyalty_pts  = COALESCE(${loyalty_pts??null}, loyalty_pts),
    notes = COALESCE(${notes??null}, notes)
    WHERE id = ${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Guest not found" }); return; }
  res.json({ ok: true, guest: row });
});
router.delete("/guests/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM hosp_guests WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

// ── RESERVATIONS ──────────────────────────────────────────────────────────────
router.get("/reservations", async (req: Request, res: Response) => {
  const { status, from, to } = req.query as Record<string,string>;
  const rows = await sql`SELECT r.*, g.name AS guest_name, g.email AS guest_email,
    rm.room_number, rm.type AS room_type, p.name AS property_name
    FROM hosp_reservations r
    LEFT JOIN hosp_guests g ON g.id = r.guest_id
    LEFT JOIN hosp_rooms rm ON rm.id = r.room_id
    LEFT JOIN hosp_properties p ON p.id = rm.property_id
    WHERE (${status||null}::text IS NULL OR r.status = ${status})
      AND (${from||null}::text IS NULL OR r.check_in >= ${from}::date)
      AND (${to||null}::text IS NULL OR r.check_out <= ${to}::date)
    ORDER BY r.check_in DESC`;
  res.json({ ok: true, reservations: rows, count: rows.length });
});
router.post("/reservations", requireAuth, async (req: Request, res: Response) => {
  const { guest_id, room_id, check_in, check_out, adults, children, special_req } = req.body as Record<string,unknown>;
  if (!guest_id || !room_id || !check_in || !check_out) { res.status(400).json({ error: "guest_id, room_id, check_in, check_out required" }); return; }
  const [roomRow] = await sql`SELECT rate_per_night FROM hosp_rooms WHERE id = ${room_id}`;
  const nights = Math.max(1, Math.round((new Date(String(check_out)).getTime() - new Date(String(check_in)).getTime()) / 86400000));
  const rate   = roomRow?.rate_per_night ?? 100;
  const total  = Number(rate) * nights;
  const [row]  = await sql`INSERT INTO hosp_reservations (guest_id, room_id, check_in, check_out, adults, children, rate, total, special_req)
    VALUES (${guest_id}, ${room_id}, ${check_in}, ${check_out}, ${adults??1}, ${children??0}, ${rate}, ${total}, ${special_req??null})
    RETURNING *`;
  await sql`UPDATE hosp_rooms SET status = 'reserved' WHERE id = ${room_id}`;
  res.status(201).json({ ok: true, reservation: row });
});
router.post("/reservations/:id/check-in", requireAuth, async (req: Request, res: Response) => {
  const [r] = await sql`UPDATE hosp_reservations SET status = 'checked_in', checked_in_at = NOW()
    WHERE id = ${req.params.id} RETURNING room_id`;
  if (!r) { res.status(404).json({ error: "Reservation not found" }); return; }
  await sql`UPDATE hosp_rooms SET status = 'occupied' WHERE id = ${r.room_id}`;
  res.json({ ok: true, message: "Guest checked in" });
});
router.post("/reservations/:id/check-out", requireAuth, async (req: Request, res: Response) => {
  const [r] = await sql`UPDATE hosp_reservations SET status = 'checked_out', checked_out_at = NOW(), payment_status = 'paid'
    WHERE id = ${req.params.id} RETURNING room_id`;
  if (!r) { res.status(404).json({ error: "Reservation not found" }); return; }
  await sql`UPDATE hosp_rooms SET status = 'cleaning' WHERE id = ${r.room_id}`;
  await sql`INSERT INTO hosp_housekeeping (room_id, type, priority) VALUES (${r.room_id}, 'checkout_clean', 'high')`;
  res.json({ ok: true, message: "Guest checked out, housekeeping task created" });
});
router.delete("/reservations/:id", requireAuth, async (req: Request, res: Response) => {
  const [r] = await sql`DELETE FROM hosp_reservations WHERE id = ${req.params.id} RETURNING room_id`;
  if (r?.room_id) { await sql`UPDATE hosp_rooms SET status = 'available' WHERE id = ${r.room_id}`; }
  res.json({ ok: true });
});

// ── HOUSEKEEPING ──────────────────────────────────────────────────────────────
router.get("/housekeeping", async (req: Request, res: Response) => {
  const { status } = req.query as Record<string,string>;
  const rows = await sql`SELECT h.*, r.room_number, p.name AS property_name
    FROM hosp_housekeeping h
    LEFT JOIN hosp_rooms r ON r.id = h.room_id
    LEFT JOIN hosp_properties p ON p.id = r.property_id
    WHERE (${status||null}::text IS NULL OR h.status = ${status})
    ORDER BY h.priority DESC, h.due_at ASC`;
  res.json({ ok: true, tasks: rows, count: rows.length });
});
router.post("/housekeeping", requireAuth, async (req: Request, res: Response) => {
  const { room_id, type, assigned_to, priority, notes, due_at } = req.body as Record<string,unknown>;
  if (!room_id) { res.status(400).json({ error: "room_id required" }); return; }
  const [row] = await sql`INSERT INTO hosp_housekeeping (room_id, type, assigned_to, priority, notes, due_at)
    VALUES (${room_id}, ${type??'daily_clean'}, ${assigned_to??null}, ${priority??'normal'}, ${notes??null}, ${due_at??null})
    RETURNING *`;
  res.status(201).json({ ok: true, task: row });
});
router.put("/housekeeping/:id/complete", requireAuth, async (req: Request, res: Response) => {
  const [h] = await sql`UPDATE hosp_housekeeping SET status = 'completed', completed_at = NOW()
    WHERE id = ${req.params.id} RETURNING room_id`;
  if (!h) { res.status(404).json({ error: "Task not found" }); return; }
  await sql`UPDATE hosp_rooms SET status = 'available' WHERE id = ${h.room_id}`;
  res.json({ ok: true, message: "Housekeeping complete, room set to available" });
});

// ── STATS ─────────────────────────────────────────────────────────────────────
router.get("/stats", async (_req: Request, res: Response) => {
  const [occ, rev, guests, res_] = await Promise.all([
    sql`SELECT ROUND(100.0 * COUNT(CASE WHEN status='occupied' THEN 1 END) / GREATEST(COUNT(*),1))::int AS pct FROM hosp_rooms`,
    sql`SELECT COALESCE(SUM(total),0)::numeric AS r FROM hosp_reservations WHERE status='checked_out' AND created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*)::int AS n FROM hosp_guests`,
    sql`SELECT COUNT(*)::int AS n FROM hosp_reservations WHERE status = 'confirmed'`,
  ]);
  res.json({ ok: true, occupancyRate: occ[0]?.pct, revenueLast30d: rev[0]?.r,
    totalGuests: guests[0]?.n, upcomingReservations: res_[0]?.n });
});

export default router;
