/**
 * routes/agricultureEngine.ts — Agriculture & Farm Management Engine
 * ───────────────────────────────────────────────────────────────────
 * Full agri-platform: farms, fields, crops, livestock, harvests, yields, equipment.
 */

import { Router, type Request, type Response } from "express";
import { rawSql as sql } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

async function ensureTables() {
  await sql`CREATE TABLE IF NOT EXISTS agri_farms (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(300) NOT NULL,
    owner        VARCHAR(300),
    address      VARCHAR(400),
    city         VARCHAR(100),
    state        VARCHAR(50),
    hectares     NUMERIC(12,4),
    type         VARCHAR(100) DEFAULT 'mixed',
    certifications JSONB DEFAULT '[]',
    status       VARCHAR(30) DEFAULT 'active',
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS agri_fields (
    id           SERIAL PRIMARY KEY,
    farm_id      INTEGER REFERENCES agri_farms(id) ON DELETE CASCADE,
    name         VARCHAR(200) NOT NULL,
    hectares     NUMERIC(12,4),
    soil_type    VARCHAR(100),
    irrigation   VARCHAR(100) DEFAULT 'none',
    gps_lat      NUMERIC(10,7),
    gps_lng      NUMERIC(10,7),
    status       VARCHAR(30) DEFAULT 'active',
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS agri_crops (
    id           SERIAL PRIMARY KEY,
    field_id     INTEGER REFERENCES agri_fields(id) ON DELETE CASCADE,
    name         VARCHAR(200) NOT NULL,
    variety      VARCHAR(200),
    planted_at   DATE,
    expected_harvest DATE,
    harvested_at DATE,
    status       VARCHAR(30) DEFAULT 'growing',
    area_ha      NUMERIC(12,4),
    seed_source  VARCHAR(300),
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS agri_livestock (
    id           SERIAL PRIMARY KEY,
    farm_id      INTEGER REFERENCES agri_farms(id) ON DELETE CASCADE,
    species      VARCHAR(100) NOT NULL,
    breed        VARCHAR(200),
    count        INTEGER DEFAULT 1,
    dob          DATE,
    tag_no       VARCHAR(100),
    status       VARCHAR(30) DEFAULT 'healthy',
    pen_location VARCHAR(200),
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS agri_harvests (
    id           SERIAL PRIMARY KEY,
    crop_id      INTEGER REFERENCES agri_crops(id) ON DELETE CASCADE,
    field_id     INTEGER REFERENCES agri_fields(id) ON DELETE SET NULL,
    harvested_at DATE DEFAULT CURRENT_DATE,
    quantity_kg  NUMERIC(14,4),
    quality      VARCHAR(50) DEFAULT 'grade_a',
    sold_kg      NUMERIC(14,4) DEFAULT 0,
    price_per_kg NUMERIC(10,4),
    revenue      NUMERIC(14,2),
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS agri_equipment (
    id           SERIAL PRIMARY KEY,
    farm_id      INTEGER REFERENCES agri_farms(id) ON DELETE CASCADE,
    name         VARCHAR(300) NOT NULL,
    type         VARCHAR(100),
    make         VARCHAR(100),
    model        VARCHAR(100),
    year         INTEGER,
    status       VARCHAR(30) DEFAULT 'operational',
    last_service DATE,
    next_service DATE,
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS agri_inputs (
    id           SERIAL PRIMARY KEY,
    farm_id      INTEGER REFERENCES agri_farms(id) ON DELETE CASCADE,
    type         VARCHAR(100) NOT NULL,
    name         VARCHAR(300),
    quantity     NUMERIC(14,4),
    unit         VARCHAR(50),
    cost         NUMERIC(12,2),
    applied_to   VARCHAR(200),
    applied_at   DATE DEFAULT CURRENT_DATE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
}
ensureTables().catch(console.error);

router.get("/dashboard", async (_req: Request, res: Response) => {
  const [farms, fields, crops, livestock, harvests] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM agri_farms WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM agri_fields WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n, status FROM agri_crops GROUP BY status`,
    sql`SELECT SUM(count)::int AS total FROM agri_livestock WHERE status='healthy'`,
    sql`SELECT COALESCE(SUM(quantity_kg),0)::numeric AS kg, COALESCE(SUM(revenue),0)::numeric AS rev FROM agri_harvests WHERE harvested_at >= NOW() - INTERVAL '90 days'`,
  ]);
  const cropsByStatus = crops.reduce((a: Record<string,number>, r) => { a[String(r.status)] = Number(r.n); return a; }, {});
  res.json({ ok: true, engine: "Agriculture & Farm Engine v1",
    activeFarms: farms[0]?.n, activeFields: fields[0]?.n, crops: cropsByStatus,
    healthyLivestock: livestock[0]?.total, harvestKgLast90d: harvests[0]?.kg,
    harvestRevLast90d: harvests[0]?.rev });
});

router.get("/farms", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT f.*, COUNT(fi.id)::int AS field_count FROM agri_farms f LEFT JOIN agri_fields fi ON fi.farm_id=f.id GROUP BY f.id ORDER BY f.name`;
  res.json({ ok: true, farms: rows, count: rows.length });
});
router.post("/farms", requireAuth, async (req: Request, res: Response) => {
  const { name, owner, address, city, state, hectares, type, certifications } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO agri_farms (name, owner, address, city, state, hectares, type, certifications)
    VALUES (${name}, ${owner??null}, ${address??null}, ${city??null}, ${state??null}, ${hectares??null}, ${type??'mixed'}, ${JSON.stringify(certifications??[])}) RETURNING *`;
  res.status(201).json({ ok: true, farm: row });
});
router.put("/farms/:id", requireAuth, async (req: Request, res: Response) => {
  const { name, status, hectares, owner } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE agri_farms SET name=COALESCE(${name??null},name), status=COALESCE(${status??null},status), hectares=COALESCE(${hectares??null},hectares), owner=COALESCE(${owner??null},owner) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Farm not found" }); return; }
  res.json({ ok: true, farm: row });
});
router.delete("/farms/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM agri_farms WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/fields", async (req: Request, res: Response) => {
  const { farm_id } = req.query as Record<string,string>;
  const rows = await sql`SELECT fi.*, f.name AS farm_name FROM agri_fields fi LEFT JOIN agri_farms f ON f.id=fi.farm_id WHERE (${farm_id||null}::text IS NULL OR fi.farm_id=${farm_id}::int) ORDER BY fi.name`;
  res.json({ ok: true, fields: rows, count: rows.length });
});
router.post("/fields", requireAuth, async (req: Request, res: Response) => {
  const { farm_id, name, hectares, soil_type, irrigation, gps_lat, gps_lng, notes } = req.body as Record<string,unknown>;
  if (!farm_id || !name) { res.status(400).json({ error: "farm_id and name required" }); return; }
  const [row] = await sql`INSERT INTO agri_fields (farm_id, name, hectares, soil_type, irrigation, gps_lat, gps_lng, notes)
    VALUES (${farm_id}, ${name}, ${hectares??null}, ${soil_type??null}, ${irrigation??'none'}, ${gps_lat??null}, ${gps_lng??null}, ${notes??null}) RETURNING *`;
  res.status(201).json({ ok: true, field: row });
});
router.delete("/fields/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM agri_fields WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/crops", async (req: Request, res: Response) => {
  const { field_id, status } = req.query as Record<string,string>;
  const rows = await sql`SELECT c.*, fi.name AS field_name, f.name AS farm_name FROM agri_crops c
    LEFT JOIN agri_fields fi ON fi.id=c.field_id LEFT JOIN agri_farms f ON f.id=fi.farm_id
    WHERE (${field_id||null}::text IS NULL OR c.field_id=${field_id}::int) AND (${status||null}::text IS NULL OR c.status=${status})
    ORDER BY c.planted_at DESC NULLS LAST`;
  res.json({ ok: true, crops: rows, count: rows.length });
});
router.post("/crops", requireAuth, async (req: Request, res: Response) => {
  const { field_id, name, variety, planted_at, expected_harvest, area_ha, seed_source } = req.body as Record<string,unknown>;
  if (!field_id || !name) { res.status(400).json({ error: "field_id and name required" }); return; }
  const [row] = await sql`INSERT INTO agri_crops (field_id, name, variety, planted_at, expected_harvest, area_ha, seed_source)
    VALUES (${field_id}, ${name}, ${variety??null}, ${planted_at??null}, ${expected_harvest??null}, ${area_ha??null}, ${seed_source??null}) RETURNING *`;
  res.status(201).json({ ok: true, crop: row });
});
router.put("/crops/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, harvested_at, notes } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE agri_crops SET status=COALESCE(${status??null},status), harvested_at=COALESCE(${harvested_at??null},harvested_at), notes=COALESCE(${notes??null},notes) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Crop not found" }); return; }
  res.json({ ok: true, crop: row });
});
router.delete("/crops/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM agri_crops WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/livestock", async (req: Request, res: Response) => {
  const { farm_id, species, status } = req.query as Record<string,string>;
  const rows = await sql`SELECT l.*, f.name AS farm_name FROM agri_livestock l LEFT JOIN agri_farms f ON f.id=l.farm_id
    WHERE (${farm_id||null}::text IS NULL OR l.farm_id=${farm_id}::int) AND (${species||null}::text IS NULL OR l.species=${species}) AND (${status||null}::text IS NULL OR l.status=${status})
    ORDER BY l.species, l.breed`;
  res.json({ ok: true, livestock: rows, count: rows.length });
});
router.post("/livestock", requireAuth, async (req: Request, res: Response) => {
  const { farm_id, species, breed, count, dob, tag_no, pen_location } = req.body as Record<string,unknown>;
  if (!farm_id || !species) { res.status(400).json({ error: "farm_id and species required" }); return; }
  const [row] = await sql`INSERT INTO agri_livestock (farm_id, species, breed, count, dob, tag_no, pen_location)
    VALUES (${farm_id}, ${species}, ${breed??null}, ${count??1}, ${dob??null}, ${tag_no??null}, ${pen_location??null}) RETURNING *`;
  res.status(201).json({ ok: true, livestock: row });
});
router.put("/livestock/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, count, notes } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE agri_livestock SET status=COALESCE(${status??null},status), count=COALESCE(${count??null},count), notes=COALESCE(${notes??null},notes) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Livestock not found" }); return; }
  res.json({ ok: true, livestock: row });
});
router.delete("/livestock/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM agri_livestock WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/harvests", async (req: Request, res: Response) => {
  const { crop_id, field_id } = req.query as Record<string,string>;
  const rows = await sql`SELECT h.*, c.name AS crop_name, fi.name AS field_name FROM agri_harvests h
    LEFT JOIN agri_crops c ON c.id=h.crop_id LEFT JOIN agri_fields fi ON fi.id=h.field_id
    WHERE (${crop_id||null}::text IS NULL OR h.crop_id=${crop_id}::int) AND (${field_id||null}::text IS NULL OR h.field_id=${field_id}::int)
    ORDER BY h.harvested_at DESC`;
  res.json({ ok: true, harvests: rows, count: rows.length });
});
router.post("/harvests", requireAuth, async (req: Request, res: Response) => {
  const { crop_id, field_id, harvested_at, quantity_kg, quality, price_per_kg, notes } = req.body as Record<string,unknown>;
  if (!crop_id || !quantity_kg) { res.status(400).json({ error: "crop_id and quantity_kg required" }); return; }
  const revenue = price_per_kg ? Number(quantity_kg) * Number(price_per_kg) : null;
  const [row] = await sql`INSERT INTO agri_harvests (crop_id, field_id, harvested_at, quantity_kg, quality, price_per_kg, revenue, notes)
    VALUES (${crop_id}, ${field_id??null}, ${harvested_at??null}, ${quantity_kg}, ${quality??'grade_a'}, ${price_per_kg??null}, ${revenue}, ${notes??null}) RETURNING *`;
  await sql`UPDATE agri_crops SET status='harvested', harvested_at=COALESCE(${harvested_at??null},CURRENT_DATE) WHERE id=${crop_id}`;
  res.status(201).json({ ok: true, harvest: row });
});

router.get("/equipment", async (req: Request, res: Response) => {
  const { farm_id, status } = req.query as Record<string,string>;
  const rows = await sql`SELECT e.*, f.name AS farm_name FROM agri_equipment e LEFT JOIN agri_farms f ON f.id=e.farm_id WHERE (${farm_id||null}::text IS NULL OR e.farm_id=${farm_id}::int) AND (${status||null}::text IS NULL OR e.status=${status}) ORDER BY e.name`;
  res.json({ ok: true, equipment: rows, count: rows.length });
});
router.post("/equipment", requireAuth, async (req: Request, res: Response) => {
  const { farm_id, name, type, make, model, year, last_service, next_service } = req.body as Record<string,unknown>;
  if (!farm_id || !name) { res.status(400).json({ error: "farm_id and name required" }); return; }
  const [row] = await sql`INSERT INTO agri_equipment (farm_id, name, type, make, model, year, last_service, next_service)
    VALUES (${farm_id}, ${name}, ${type??null}, ${make??null}, ${model??null}, ${year??null}, ${last_service??null}, ${next_service??null}) RETURNING *`;
  res.status(201).json({ ok: true, equipment: row });
});
router.put("/equipment/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, last_service, next_service } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE agri_equipment SET status=COALESCE(${status??null},status), last_service=COALESCE(${last_service??null},last_service), next_service=COALESCE(${next_service??null},next_service) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Equipment not found" }); return; }
  res.json({ ok: true, equipment: row });
});

router.post("/inputs", requireAuth, async (req: Request, res: Response) => {
  const { farm_id, type, name, quantity, unit, cost, applied_to, applied_at } = req.body as Record<string,unknown>;
  if (!farm_id || !type) { res.status(400).json({ error: "farm_id and type required" }); return; }
  const [row] = await sql`INSERT INTO agri_inputs (farm_id, type, name, quantity, unit, cost, applied_to, applied_at)
    VALUES (${farm_id}, ${type}, ${name??null}, ${quantity??null}, ${unit??null}, ${cost??null}, ${applied_to??null}, ${applied_at??null}) RETURNING *`;
  res.status(201).json({ ok: true, input: row });
});
router.get("/inputs", async (req: Request, res: Response) => {
  const { farm_id, type } = req.query as Record<string,string>;
  const rows = await sql`SELECT i.*, f.name AS farm_name FROM agri_inputs i LEFT JOIN agri_farms f ON f.id=i.farm_id WHERE (${farm_id||null}::text IS NULL OR i.farm_id=${farm_id}::int) AND (${type||null}::text IS NULL OR i.type=${type}) ORDER BY i.applied_at DESC`;
  res.json({ ok: true, inputs: rows, count: rows.length });
});

router.get("/stats", async (_req: Request, res: Response) => {
  const [farms, fields, crops, livestock, harvests] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM agri_farms WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM agri_fields WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM agri_crops WHERE status='growing'`,
    sql`SELECT COALESCE(SUM(count),0)::int AS n FROM agri_livestock WHERE status='healthy'`,
    sql`SELECT COALESCE(SUM(quantity_kg),0)::numeric AS kg FROM agri_harvests WHERE harvested_at >= NOW() - INTERVAL '365 days'`,
  ]);
  res.json({ ok: true, activeFarms: farms[0]?.n, activeFields: fields[0]?.n,
    activeCrops: crops[0]?.n, healthyLivestock: livestock[0]?.n, harvestKgThisYear: harvests[0]?.kg });
});

export default router;
