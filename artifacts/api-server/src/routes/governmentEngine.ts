/**
 * routes/governmentEngine.ts — Government Services & Citizen Management Engine
 * ────────────────────────────────────────────────────────────────────────────
 * Full gov platform: permits, citizens, services, forms, compliance, public records.
 */

import { Router, type Request, type Response } from "express";
import { sql }         from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

async function ensureTables() {
  await sql`CREATE TABLE IF NOT EXISTS gov_citizens (
    id            SERIAL PRIMARY KEY,
    first_name    VARCHAR(200) NOT NULL,
    last_name     VARCHAR(200) NOT NULL,
    email         VARCHAR(255),
    phone         VARCHAR(50),
    address       VARCHAR(400),
    city          VARCHAR(100),
    dob           DATE,
    gov_id        VARCHAR(100) UNIQUE,
    status        VARCHAR(30) DEFAULT 'active',
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS gov_permits (
    id            SERIAL PRIMARY KEY,
    permit_no     VARCHAR(100) UNIQUE DEFAULT 'PRM-' || LPAD(FLOOR(RANDOM()*9999999)::TEXT, 7, '0'),
    citizen_id    INTEGER REFERENCES gov_citizens(id) ON DELETE SET NULL,
    type          VARCHAR(200) NOT NULL,
    description   TEXT,
    address       VARCHAR(400),
    status        VARCHAR(30) DEFAULT 'submitted',
    fee           NUMERIC(10,2),
    fee_paid      BOOLEAN DEFAULT FALSE,
    submitted_at  TIMESTAMPTZ DEFAULT NOW(),
    approved_at   TIMESTAMPTZ,
    expires_at    DATE,
    reviewer      VARCHAR(300),
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS gov_services (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(300) NOT NULL,
    category      VARCHAR(100),
    description   TEXT,
    fee           NUMERIC(10,2) DEFAULT 0,
    processing_d  INTEGER DEFAULT 5,
    department    VARCHAR(300),
    status        VARCHAR(30) DEFAULT 'active',
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS gov_service_requests (
    id            SERIAL PRIMARY KEY,
    request_no    VARCHAR(100) UNIQUE DEFAULT 'SRQ-' || LPAD(FLOOR(RANDOM()*9999999)::TEXT, 7, '0'),
    citizen_id    INTEGER REFERENCES gov_citizens(id) ON DELETE SET NULL,
    service_id    INTEGER REFERENCES gov_services(id) ON DELETE SET NULL,
    status        VARCHAR(30) DEFAULT 'received',
    priority      VARCHAR(30) DEFAULT 'normal',
    assigned_to   VARCHAR(300),
    notes         TEXT,
    submitted_at  TIMESTAMPTZ DEFAULT NOW(),
    resolved_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS gov_forms (
    id            SERIAL PRIMARY KEY,
    form_no       VARCHAR(100) UNIQUE,
    title         VARCHAR(400) NOT NULL,
    department    VARCHAR(300),
    category      VARCHAR(100),
    fields        JSONB DEFAULT '[]',
    status        VARCHAR(30) DEFAULT 'active',
    version       VARCHAR(20) DEFAULT '1.0',
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS gov_compliance_records (
    id            SERIAL PRIMARY KEY,
    entity_name   VARCHAR(300),
    entity_type   VARCHAR(100),
    regulation    VARCHAR(400),
    status        VARCHAR(30) DEFAULT 'compliant',
    review_date   DATE DEFAULT CURRENT_DATE,
    next_review   DATE,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`;
}
ensureTables().catch(console.error);

router.get("/dashboard", async (_req: Request, res: Response) => {
  const [cit, permits, sr, forms, comp] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM gov_citizens WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n, status FROM gov_permits GROUP BY status`,
    sql`SELECT COUNT(*)::int AS n FROM gov_service_requests WHERE status NOT IN ('resolved','closed')`,
    sql`SELECT COUNT(*)::int AS n FROM gov_forms WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM gov_compliance_records WHERE status='non_compliant'`,
  ]);
  const permitsByStatus = permits.reduce((a: Record<string,number>, r) => { a[String(r.status)] = Number(r.n); return a; }, {});
  res.json({ ok: true, engine: "Government Services Engine v1",
    registeredCitizens: cit[0]?.n, permits: permitsByStatus,
    openServiceRequests: sr[0]?.n, activeForms: forms[0]?.n, nonCompliantEntities: comp[0]?.n });
});

router.get("/citizens", async (req: Request, res: Response) => {
  const { q } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM gov_citizens WHERE (${q||null}::text IS NULL OR first_name ILIKE ${'%'+(q||'')+'%'} OR last_name ILIKE ${'%'+(q||'')+'%'} OR gov_id ILIKE ${'%'+(q||'')+'%'}) ORDER BY last_name, first_name`;
  res.json({ ok: true, citizens: rows, count: rows.length });
});
router.post("/citizens", requireAuth, async (req: Request, res: Response) => {
  const { first_name, last_name, email, phone, address, city, dob, gov_id } = req.body as Record<string,unknown>;
  if (!first_name || !last_name) { res.status(400).json({ error: "first_name and last_name required" }); return; }
  const [row] = await sql`INSERT INTO gov_citizens (first_name, last_name, email, phone, address, city, dob, gov_id)
    VALUES (${first_name}, ${last_name}, ${email??null}, ${phone??null}, ${address??null}, ${city??null}, ${dob??null}, ${gov_id??null}) RETURNING *`;
  res.status(201).json({ ok: true, citizen: row });
});
router.get("/citizens/:id", async (req: Request, res: Response) => {
  const [c] = await sql`SELECT * FROM gov_citizens WHERE id=${req.params.id}`;
  if (!c) { res.status(404).json({ error: "Citizen not found" }); return; }
  const permits = await sql`SELECT * FROM gov_permits WHERE citizen_id=${req.params.id} ORDER BY created_at DESC LIMIT 10`;
  const requests = await sql`SELECT sr.*, s.name AS service_name FROM gov_service_requests sr LEFT JOIN gov_services s ON s.id=sr.service_id WHERE sr.citizen_id=${req.params.id} ORDER BY sr.created_at DESC LIMIT 10`;
  res.json({ ok: true, citizen: c, permits, requests });
});
router.put("/citizens/:id", requireAuth, async (req: Request, res: Response) => {
  const { email, phone, address, status, notes } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE gov_citizens SET email=COALESCE(${email??null},email), phone=COALESCE(${phone??null},phone), address=COALESCE(${address??null},address), status=COALESCE(${status??null},status), notes=COALESCE(${notes??null},notes) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Citizen not found" }); return; }
  res.json({ ok: true, citizen: row });
});
router.delete("/citizens/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM gov_citizens WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/permits", async (req: Request, res: Response) => {
  const { status, type } = req.query as Record<string,string>;
  const rows = await sql`SELECT p.*, c.first_name || ' ' || c.last_name AS citizen_name FROM gov_permits p
    LEFT JOIN gov_citizens c ON c.id=p.citizen_id
    WHERE (${status||null}::text IS NULL OR p.status=${status}) AND (${type||null}::text IS NULL OR p.type=${type}) ORDER BY p.submitted_at DESC`;
  res.json({ ok: true, permits: rows, count: rows.length });
});
router.post("/permits", async (req: Request, res: Response) => {
  const { citizen_id, type, description, address, fee } = req.body as Record<string,unknown>;
  if (!type) { res.status(400).json({ error: "type required" }); return; }
  const [row] = await sql`INSERT INTO gov_permits (citizen_id, type, description, address, fee)
    VALUES (${citizen_id??null}, ${type}, ${description??null}, ${address??null}, ${fee??null}) RETURNING *`;
  res.status(201).json({ ok: true, permit: row });
});
router.put("/permits/:id/approve", requireAuth, async (req: Request, res: Response) => {
  const { reviewer, expires_at } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE gov_permits SET status='approved', approved_at=NOW(), reviewer=${reviewer??null}, expires_at=${expires_at??null} WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Permit not found" }); return; }
  res.json({ ok: true, permit: row });
});
router.put("/permits/:id/reject", requireAuth, async (req: Request, res: Response) => {
  const { notes } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE gov_permits SET status='rejected', notes=${notes??null} WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Permit not found" }); return; }
  res.json({ ok: true, permit: row });
});
router.delete("/permits/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM gov_permits WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/services", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT * FROM gov_services WHERE status='active' ORDER BY category, name`;
  res.json({ ok: true, services: rows, count: rows.length });
});
router.post("/services", requireAuth, async (req: Request, res: Response) => {
  const { name, category, description, fee, processing_d, department } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO gov_services (name, category, description, fee, processing_d, department)
    VALUES (${name}, ${category??null}, ${description??null}, ${fee??0}, ${processing_d??5}, ${department??null}) RETURNING *`;
  res.status(201).json({ ok: true, service: row });
});

router.get("/service-requests", async (req: Request, res: Response) => {
  const { status, citizen_id } = req.query as Record<string,string>;
  const rows = await sql`SELECT sr.*, s.name AS service_name, c.first_name||' '||c.last_name AS citizen_name
    FROM gov_service_requests sr LEFT JOIN gov_services s ON s.id=sr.service_id LEFT JOIN gov_citizens c ON c.id=sr.citizen_id
    WHERE (${status||null}::text IS NULL OR sr.status=${status}) AND (${citizen_id||null}::text IS NULL OR sr.citizen_id=${citizen_id}::int)
    ORDER BY sr.submitted_at DESC`;
  res.json({ ok: true, requests: rows, count: rows.length });
});
router.post("/service-requests", async (req: Request, res: Response) => {
  const { citizen_id, service_id, notes } = req.body as Record<string,unknown>;
  if (!service_id) { res.status(400).json({ error: "service_id required" }); return; }
  const [row] = await sql`INSERT INTO gov_service_requests (citizen_id, service_id, notes)
    VALUES (${citizen_id??null}, ${service_id}, ${notes??null}) RETURNING *`;
  res.status(201).json({ ok: true, request: row });
});
router.put("/service-requests/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, assigned_to, notes } = req.body as Record<string,unknown>;
  const resolved = status === 'resolved' ? 'NOW()' : null;
  const [row] = await sql`UPDATE gov_service_requests SET status=COALESCE(${status??null},status), assigned_to=COALESCE(${assigned_to??null},assigned_to), notes=COALESCE(${notes??null},notes), resolved_at=CASE WHEN ${status}='resolved' THEN NOW() ELSE resolved_at END WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Request not found" }); return; }
  res.json({ ok: true, request: row });
});

router.get("/forms", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT id, form_no, title, department, category, status, version, created_at FROM gov_forms ORDER BY department, title`;
  res.json({ ok: true, forms: rows, count: rows.length });
});
router.post("/forms", requireAuth, async (req: Request, res: Response) => {
  const { form_no, title, department, category, fields, version } = req.body as Record<string,unknown>;
  if (!title) { res.status(400).json({ error: "title required" }); return; }
  const [row] = await sql`INSERT INTO gov_forms (form_no, title, department, category, fields, version)
    VALUES (${form_no??null}, ${title}, ${department??null}, ${category??null}, ${JSON.stringify(fields??[])}, ${version??'1.0'}) RETURNING *`;
  res.status(201).json({ ok: true, form: row });
});

router.get("/compliance", async (req: Request, res: Response) => {
  const { status } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM gov_compliance_records WHERE (${status||null}::text IS NULL OR status=${status}) ORDER BY next_review ASC NULLS LAST`;
  res.json({ ok: true, records: rows, count: rows.length });
});
router.post("/compliance", requireAuth, async (req: Request, res: Response) => {
  const { entity_name, entity_type, regulation, status, next_review, notes } = req.body as Record<string,unknown>;
  if (!entity_name || !regulation) { res.status(400).json({ error: "entity_name and regulation required" }); return; }
  const [row] = await sql`INSERT INTO gov_compliance_records (entity_name, entity_type, regulation, status, next_review, notes)
    VALUES (${entity_name}, ${entity_type??null}, ${regulation}, ${status??'compliant'}, ${next_review??null}, ${notes??null}) RETURNING *`;
  res.status(201).json({ ok: true, record: row });
});

router.get("/stats", async (_req: Request, res: Response) => {
  const [c, p_app, sr, f] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM gov_citizens WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM gov_permits WHERE status='approved' AND created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*)::int AS n FROM gov_service_requests WHERE created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*)::int AS n FROM gov_forms WHERE status='active'`,
  ]);
  res.json({ ok: true, activeCitizens: c[0]?.n, permitsApprovedLast30d: p_app[0]?.n,
    requestsLast30d: sr[0]?.n, activeForms: f[0]?.n });
});

export default router;
