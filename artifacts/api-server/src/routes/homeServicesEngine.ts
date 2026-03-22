/**
 * routes/homeServicesEngine.ts — Home Services Management Engine
 * ────────────────────────────────────────────────────────────────
 * Full home services: jobs, technicians, service types, schedules, invoices, reviews.
 */

import { Router, type Request, type Response } from "express";
import { sql }         from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

async function ensureTables() {
  await sql`CREATE TABLE IF NOT EXISTS hs_service_types (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(300) NOT NULL,
    category     VARCHAR(100),
    description  TEXT,
    base_price   NUMERIC(10,2),
    duration_min INTEGER DEFAULT 60,
    status       VARCHAR(30) DEFAULT 'active',
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS hs_technicians (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(300) NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(50),
    specialties     JSONB DEFAULT '[]',
    license_no      VARCHAR(100),
    status          VARCHAR(30) DEFAULT 'active',
    rating          NUMERIC(3,2) DEFAULT 5.0,
    jobs_completed  INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS hs_customers (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(300) NOT NULL,
    email        VARCHAR(255),
    phone        VARCHAR(50),
    address      VARCHAR(400),
    city         VARCHAR(100),
    notes        TEXT,
    status       VARCHAR(30) DEFAULT 'active',
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS hs_jobs (
    id              SERIAL PRIMARY KEY,
    job_no          VARCHAR(100) UNIQUE DEFAULT 'JOB-' || LPAD(FLOOR(RANDOM()*9999999)::TEXT, 7, '0'),
    customer_id     INTEGER REFERENCES hs_customers(id) ON DELETE SET NULL,
    service_type_id INTEGER REFERENCES hs_service_types(id) ON DELETE SET NULL,
    technician_id   INTEGER REFERENCES hs_technicians(id) ON DELETE SET NULL,
    address         VARCHAR(400),
    description     TEXT,
    status          VARCHAR(30) DEFAULT 'scheduled',
    priority        VARCHAR(30) DEFAULT 'normal',
    scheduled_at    TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    duration_min    INTEGER,
    price           NUMERIC(10,2),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS hs_invoices (
    id           SERIAL PRIMARY KEY,
    job_id       INTEGER REFERENCES hs_jobs(id) ON DELETE CASCADE,
    customer_id  INTEGER REFERENCES hs_customers(id) ON DELETE SET NULL,
    invoice_no   VARCHAR(100) UNIQUE DEFAULT 'INV-' || LPAD(FLOOR(RANDOM()*9999999)::TEXT, 7, '0'),
    subtotal     NUMERIC(12,2) DEFAULT 0,
    tax          NUMERIC(12,2) DEFAULT 0,
    total        NUMERIC(12,2) DEFAULT 0,
    status       VARCHAR(30) DEFAULT 'unpaid',
    due_date     DATE,
    paid_at      TIMESTAMPTZ,
    payment_method VARCHAR(50),
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS hs_reviews (
    id           SERIAL PRIMARY KEY,
    job_id       INTEGER REFERENCES hs_jobs(id) ON DELETE CASCADE,
    customer_id  INTEGER REFERENCES hs_customers(id) ON DELETE SET NULL,
    technician_id INTEGER REFERENCES hs_technicians(id) ON DELETE SET NULL,
    rating       INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
}
ensureTables().catch(console.error);

router.get("/dashboard", async (_req: Request, res: Response) => {
  const [jobs, techs, rev, reviews, inv] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n, status FROM hs_jobs WHERE scheduled_at >= NOW() - INTERVAL '7 days' OR status='in_progress' GROUP BY status`,
    sql`SELECT COUNT(*)::int AS n FROM hs_technicians WHERE status='active'`,
    sql`SELECT COALESCE(SUM(total),0)::numeric AS r FROM hs_invoices WHERE status='paid' AND created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT ROUND(AVG(rating)::numeric,2) AS avg FROM hs_reviews WHERE created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*)::int AS n FROM hs_invoices WHERE status='unpaid'`,
  ]);
  const jobsByStatus = jobs.reduce((a: Record<string,number>, r) => { a[String(r.status)] = Number(r.n); return a; }, {});
  res.json({ ok: true, engine: "Home Services Engine v1",
    jobs: jobsByStatus, activeTechnicians: techs[0]?.n,
    revenueLast30d: rev[0]?.r, avgRating: reviews[0]?.avg, unpaidInvoices: inv[0]?.n });
});

router.get("/service-types", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT * FROM hs_service_types WHERE status='active' ORDER BY category, name`;
  res.json({ ok: true, serviceTypes: rows, count: rows.length });
});
router.post("/service-types", requireAuth, async (req: Request, res: Response) => {
  const { name, category, description, base_price, duration_min } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO hs_service_types (name, category, description, base_price, duration_min)
    VALUES (${name}, ${category??null}, ${description??null}, ${base_price??null}, ${duration_min??60}) RETURNING *`;
  res.status(201).json({ ok: true, serviceType: row });
});
router.put("/service-types/:id", requireAuth, async (req: Request, res: Response) => {
  const { name, base_price, status } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE hs_service_types SET name=COALESCE(${name??null},name), base_price=COALESCE(${base_price??null},base_price), status=COALESCE(${status??null},status) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Service type not found" }); return; }
  res.json({ ok: true, serviceType: row });
});
router.delete("/service-types/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM hs_service_types WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/technicians", async (req: Request, res: Response) => {
  const { status } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM hs_technicians WHERE (${status||null}::text IS NULL OR status=${status}) ORDER BY name`;
  res.json({ ok: true, technicians: rows, count: rows.length });
});
router.post("/technicians", requireAuth, async (req: Request, res: Response) => {
  const { name, email, phone, specialties, license_no } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO hs_technicians (name, email, phone, specialties, license_no)
    VALUES (${name}, ${email??null}, ${phone??null}, ${JSON.stringify(specialties??[])}, ${license_no??null}) RETURNING *`;
  res.status(201).json({ ok: true, technician: row });
});
router.put("/technicians/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, rating } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE hs_technicians SET status=COALESCE(${status??null},status), rating=COALESCE(${rating??null},rating) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Technician not found" }); return; }
  res.json({ ok: true, technician: row });
});
router.delete("/technicians/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM hs_technicians WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/customers", async (req: Request, res: Response) => {
  const { q } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM hs_customers WHERE (${q||null}::text IS NULL OR name ILIKE ${'%'+(q||'')+'%'} OR phone ILIKE ${'%'+(q||'')+'%'}) ORDER BY name`;
  res.json({ ok: true, customers: rows, count: rows.length });
});
router.post("/customers", async (req: Request, res: Response) => {
  const { name, email, phone, address, city, notes } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO hs_customers (name, email, phone, address, city, notes)
    VALUES (${name}, ${email??null}, ${phone??null}, ${address??null}, ${city??null}, ${notes??null}) RETURNING *`;
  res.status(201).json({ ok: true, customer: row });
});

router.get("/jobs", async (req: Request, res: Response) => {
  const { status, technician_id, customer_id } = req.query as Record<string,string>;
  const rows = await sql`SELECT j.*, c.name AS customer_name, t.name AS technician_name, s.name AS service_type_name
    FROM hs_jobs j
    LEFT JOIN hs_customers c ON c.id=j.customer_id
    LEFT JOIN hs_technicians t ON t.id=j.technician_id
    LEFT JOIN hs_service_types s ON s.id=j.service_type_id
    WHERE (${status||null}::text IS NULL OR j.status=${status})
      AND (${technician_id||null}::text IS NULL OR j.technician_id=${technician_id}::int)
      AND (${customer_id||null}::text IS NULL OR j.customer_id=${customer_id}::int)
    ORDER BY j.scheduled_at DESC NULLS LAST`;
  res.json({ ok: true, jobs: rows, count: rows.length });
});
router.post("/jobs", requireAuth, async (req: Request, res: Response) => {
  const { customer_id, service_type_id, technician_id, address, description, scheduled_at, priority, price } = req.body as Record<string,unknown>;
  if (!customer_id || !service_type_id) { res.status(400).json({ error: "customer_id and service_type_id required" }); return; }
  const [row] = await sql`INSERT INTO hs_jobs (customer_id, service_type_id, technician_id, address, description, scheduled_at, priority, price)
    VALUES (${customer_id}, ${service_type_id}, ${technician_id??null}, ${address??null}, ${description??null}, ${scheduled_at??null}, ${priority??'normal'}, ${price??null}) RETURNING *`;
  res.status(201).json({ ok: true, job: row });
});
router.post("/jobs/:id/start", requireAuth, async (req: Request, res: Response) => {
  const [row] = await sql`UPDATE hs_jobs SET status='in_progress', started_at=NOW() WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Job not found" }); return; }
  res.json({ ok: true, job: row });
});
router.post("/jobs/:id/complete", requireAuth, async (req: Request, res: Response) => {
  const { duration_min, notes } = req.body as Record<string,unknown>;
  const [j] = await sql`UPDATE hs_jobs SET status='completed', completed_at=NOW(), duration_min=${duration_min??null}, notes=COALESCE(${notes??null},notes) WHERE id=${req.params.id} RETURNING *`;
  if (!j) { res.status(404).json({ error: "Job not found" }); return; }
  if (j.technician_id) { await sql`UPDATE hs_technicians SET jobs_completed=jobs_completed+1 WHERE id=${j.technician_id}`; }
  const tax = Number(j.price??0) * 0.08;
  const total = Number(j.price??0) + tax;
  const [inv] = await sql`INSERT INTO hs_invoices (job_id, customer_id, subtotal, tax, total, due_date)
    VALUES (${j.id}, ${j.customer_id}, ${j.price??0}, ${tax}, ${total}, NOW()::date + INTERVAL '30 days') RETURNING invoice_no`;
  res.json({ ok: true, job: j, invoice_no: inv?.invoice_no });
});
router.delete("/jobs/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM hs_jobs WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/invoices", async (req: Request, res: Response) => {
  const { status, customer_id } = req.query as Record<string,string>;
  const rows = await sql`SELECT i.*, c.name AS customer_name FROM hs_invoices i
    LEFT JOIN hs_customers c ON c.id=i.customer_id
    WHERE (${status||null}::text IS NULL OR i.status=${status}) AND (${customer_id||null}::text IS NULL OR i.customer_id=${customer_id}::int)
    ORDER BY i.created_at DESC`;
  res.json({ ok: true, invoices: rows, count: rows.length });
});
router.put("/invoices/:id/pay", requireAuth, async (req: Request, res: Response) => {
  const { payment_method } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE hs_invoices SET status='paid', paid_at=NOW(), payment_method=${payment_method??'cash'} WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.json({ ok: true, invoice: row });
});

router.post("/reviews", async (req: Request, res: Response) => {
  const { job_id, customer_id, technician_id, rating, comment } = req.body as Record<string,unknown>;
  if (!job_id || !rating) { res.status(400).json({ error: "job_id and rating required" }); return; }
  const [row] = await sql`INSERT INTO hs_reviews (job_id, customer_id, technician_id, rating, comment)
    VALUES (${job_id}, ${customer_id??null}, ${technician_id??null}, ${rating}, ${comment??null}) RETURNING *`;
  if (technician_id) {
    await sql`UPDATE hs_technicians SET rating=(SELECT ROUND(AVG(rating)::numeric,2) FROM hs_reviews WHERE technician_id=${technician_id}) WHERE id=${technician_id}`;
  }
  res.status(201).json({ ok: true, review: row });
});

router.get("/stats", async (_req: Request, res: Response) => {
  const [jobs, techs, rev, avg] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM hs_jobs WHERE status='completed'`,
    sql`SELECT COUNT(*)::int AS n FROM hs_technicians WHERE status='active'`,
    sql`SELECT COALESCE(SUM(total),0)::numeric AS r FROM hs_invoices WHERE status='paid'`,
    sql`SELECT ROUND(AVG(rating)::numeric,2) AS avg FROM hs_reviews`,
  ]);
  res.json({ ok: true, completedJobs: jobs[0]?.n, activeTechnicians: techs[0]?.n,
    totalRevenue: rev[0]?.r, avgRating: avg[0]?.avg });
});

export default router;
