/**
 * routes/constructionEngine.ts — Construction Project Management Engine
 * ───────────────────────────────────────────────────────────────────────
 * Full construction: projects, bids, contracts, inspections, subcontractors, punch-lists.
 */

import { Router, type Request, type Response } from "express";
import { sql }         from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

async function ensureTables() {
  await sql`CREATE TABLE IF NOT EXISTS con_projects (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(400) NOT NULL,
    address        VARCHAR(400),
    city           VARCHAR(100),
    type           VARCHAR(100) DEFAULT 'commercial',
    status         VARCHAR(30)  DEFAULT 'planning',
    owner_name     VARCHAR(300),
    owner_email    VARCHAR(255),
    manager        VARCHAR(300),
    budget         NUMERIC(14,2),
    spent          NUMERIC(14,2) DEFAULT 0,
    start_date     DATE,
    end_date       DATE,
    sqft           NUMERIC(12,2),
    description    TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS con_bids (
    id             SERIAL PRIMARY KEY,
    project_id     INTEGER REFERENCES con_projects(id) ON DELETE CASCADE,
    bidder         VARCHAR(300) NOT NULL,
    bidder_email   VARCHAR(255),
    amount         NUMERIC(14,2),
    status         VARCHAR(30) DEFAULT 'submitted',
    submitted_at   TIMESTAMPTZ DEFAULT NOW(),
    valid_until    DATE,
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS con_contracts (
    id             SERIAL PRIMARY KEY,
    project_id     INTEGER REFERENCES con_projects(id) ON DELETE CASCADE,
    contractor     VARCHAR(300) NOT NULL,
    contractor_email VARCHAR(255),
    type           VARCHAR(100) DEFAULT 'general',
    value          NUMERIC(14,2),
    paid           NUMERIC(14,2) DEFAULT 0,
    status         VARCHAR(30) DEFAULT 'draft',
    signed_at      DATE,
    start_date     DATE,
    end_date       DATE,
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS con_inspections (
    id             SERIAL PRIMARY KEY,
    project_id     INTEGER REFERENCES con_projects(id) ON DELETE CASCADE,
    type           VARCHAR(200) NOT NULL,
    inspector      VARCHAR(300),
    agency         VARCHAR(300),
    result         VARCHAR(30) DEFAULT 'pending',
    scheduled_at   TIMESTAMPTZ,
    completed_at   TIMESTAMPTZ,
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS con_subcontractors (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(300) NOT NULL,
    email          VARCHAR(255),
    phone          VARCHAR(50),
    trade          VARCHAR(200),
    license_no     VARCHAR(100),
    insurance_exp  DATE,
    rating         NUMERIC(3,2) DEFAULT 5.0,
    status         VARCHAR(30) DEFAULT 'active',
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS con_punch_items (
    id             SERIAL PRIMARY KEY,
    project_id     INTEGER REFERENCES con_projects(id) ON DELETE CASCADE,
    description    TEXT NOT NULL,
    location       VARCHAR(300),
    assigned_to    VARCHAR(300),
    priority       VARCHAR(30) DEFAULT 'normal',
    status         VARCHAR(30) DEFAULT 'open',
    due_date       DATE,
    resolved_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )`;
}
ensureTables().catch(console.error);

router.get("/dashboard", async (_req: Request, res: Response) => {
  const [proj, bids, contr, insp, punch] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n, status FROM con_projects GROUP BY status`,
    sql`SELECT COUNT(*)::int AS n FROM con_bids WHERE status='submitted'`,
    sql`SELECT COUNT(*)::int AS n FROM con_contracts WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM con_inspections WHERE result='pending'`,
    sql`SELECT COUNT(*)::int AS n FROM con_punch_items WHERE status='open'`,
  ]);
  const projByStatus = proj.reduce((a: Record<string,number>, r) => { a[String(r.status)] = Number(r.n); return a; }, {});
  res.json({ ok: true, engine: "Construction Management Engine v1",
    projects: projByStatus, pendingBids: bids[0]?.n, activeContracts: contr[0]?.n,
    pendingInspections: insp[0]?.n, openPunchItems: punch[0]?.n });
});

router.get("/projects", async (req: Request, res: Response) => {
  const { status, type } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM con_projects WHERE (${status||null}::text IS NULL OR status=${status}) AND (${type||null}::text IS NULL OR type=${type}) ORDER BY created_at DESC`;
  res.json({ ok: true, projects: rows, count: rows.length });
});
router.post("/projects", requireAuth, async (req: Request, res: Response) => {
  const { name, address, city, type, owner_name, owner_email, manager, budget, start_date, end_date, sqft, description } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO con_projects (name, address, city, type, owner_name, owner_email, manager, budget, start_date, end_date, sqft, description)
    VALUES (${name}, ${address??null}, ${city??null}, ${type??'commercial'}, ${owner_name??null}, ${owner_email??null}, ${manager??null}, ${budget??null}, ${start_date??null}, ${end_date??null}, ${sqft??null}, ${description??null}) RETURNING *`;
  res.status(201).json({ ok: true, project: row });
});
router.get("/projects/:id", async (req: Request, res: Response) => {
  const [p] = await sql`SELECT * FROM con_projects WHERE id=${req.params.id}`;
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }
  const [bids, contracts, inspections, punch] = await Promise.all([
    sql`SELECT * FROM con_bids WHERE project_id=${req.params.id} ORDER BY submitted_at DESC`,
    sql`SELECT * FROM con_contracts WHERE project_id=${req.params.id}`,
    sql`SELECT * FROM con_inspections WHERE project_id=${req.params.id} ORDER BY scheduled_at DESC NULLS LAST`,
    sql`SELECT * FROM con_punch_items WHERE project_id=${req.params.id} AND status='open' ORDER BY priority DESC`,
  ]);
  res.json({ ok: true, project: p, bids, contracts, inspections, openPunchItems: punch });
});
router.put("/projects/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, spent, end_date, notes } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE con_projects SET status=COALESCE(${status??null},status), spent=COALESCE(${spent??null},spent), end_date=COALESCE(${end_date??null},end_date) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Project not found" }); return; }
  res.json({ ok: true, project: row });
});
router.delete("/projects/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM con_projects WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/bids", async (req: Request, res: Response) => {
  const { project_id, status } = req.query as Record<string,string>;
  const rows = await sql`SELECT b.*, p.name AS project_name FROM con_bids b
    LEFT JOIN con_projects p ON p.id=b.project_id
    WHERE (${project_id||null}::text IS NULL OR b.project_id=${project_id}::int)
      AND (${status||null}::text IS NULL OR b.status=${status}) ORDER BY b.submitted_at DESC`;
  res.json({ ok: true, bids: rows, count: rows.length });
});
router.post("/bids", requireAuth, async (req: Request, res: Response) => {
  const { project_id, bidder, bidder_email, amount, valid_until, notes } = req.body as Record<string,unknown>;
  if (!project_id || !bidder || !amount) { res.status(400).json({ error: "project_id, bidder, amount required" }); return; }
  const [row] = await sql`INSERT INTO con_bids (project_id, bidder, bidder_email, amount, valid_until, notes)
    VALUES (${project_id}, ${bidder}, ${bidder_email??null}, ${amount}, ${valid_until??null}, ${notes??null}) RETURNING *`;
  res.status(201).json({ ok: true, bid: row });
});
router.put("/bids/:id/award", requireAuth, async (req: Request, res: Response) => {
  const [row] = await sql`UPDATE con_bids SET status='awarded' WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Bid not found" }); return; }
  res.json({ ok: true, bid: row });
});

router.get("/contracts", async (req: Request, res: Response) => {
  const { project_id, status } = req.query as Record<string,string>;
  const rows = await sql`SELECT c.*, p.name AS project_name FROM con_contracts c
    LEFT JOIN con_projects p ON p.id=c.project_id
    WHERE (${project_id||null}::text IS NULL OR c.project_id=${project_id}::int)
      AND (${status||null}::text IS NULL OR c.status=${status}) ORDER BY c.created_at DESC`;
  res.json({ ok: true, contracts: rows, count: rows.length });
});
router.post("/contracts", requireAuth, async (req: Request, res: Response) => {
  const { project_id, contractor, contractor_email, type, value, start_date, end_date } = req.body as Record<string,unknown>;
  if (!project_id || !contractor || !value) { res.status(400).json({ error: "project_id, contractor, value required" }); return; }
  const [row] = await sql`INSERT INTO con_contracts (project_id, contractor, contractor_email, type, value, start_date, end_date)
    VALUES (${project_id}, ${contractor}, ${contractor_email??null}, ${type??'general'}, ${value}, ${start_date??null}, ${end_date??null}) RETURNING *`;
  res.status(201).json({ ok: true, contract: row });
});
router.put("/contracts/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, paid } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE con_contracts SET status=COALESCE(${status??null},status), paid=COALESCE(${paid??null},paid) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Contract not found" }); return; }
  res.json({ ok: true, contract: row });
});

router.get("/inspections", async (req: Request, res: Response) => {
  const { project_id, result } = req.query as Record<string,string>;
  const rows = await sql`SELECT i.*, p.name AS project_name FROM con_inspections i
    LEFT JOIN con_projects p ON p.id=i.project_id
    WHERE (${project_id||null}::text IS NULL OR i.project_id=${project_id}::int)
      AND (${result||null}::text IS NULL OR i.result=${result}) ORDER BY i.scheduled_at DESC NULLS LAST`;
  res.json({ ok: true, inspections: rows, count: rows.length });
});
router.post("/inspections", requireAuth, async (req: Request, res: Response) => {
  const { project_id, type, inspector, agency, scheduled_at } = req.body as Record<string,unknown>;
  if (!project_id || !type) { res.status(400).json({ error: "project_id and type required" }); return; }
  const [row] = await sql`INSERT INTO con_inspections (project_id, type, inspector, agency, scheduled_at)
    VALUES (${project_id}, ${type}, ${inspector??null}, ${agency??null}, ${scheduled_at??null}) RETURNING *`;
  res.status(201).json({ ok: true, inspection: row });
});
router.put("/inspections/:id/result", requireAuth, async (req: Request, res: Response) => {
  const { result, notes } = req.body as Record<string,unknown>;
  if (!result) { res.status(400).json({ error: "result required" }); return; }
  const [row] = await sql`UPDATE con_inspections SET result=${result}, completed_at=NOW(), notes=COALESCE(${notes??null},notes) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Inspection not found" }); return; }
  res.json({ ok: true, inspection: row });
});

router.get("/subcontractors", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT * FROM con_subcontractors ORDER BY name`;
  res.json({ ok: true, subcontractors: rows, count: rows.length });
});
router.post("/subcontractors", requireAuth, async (req: Request, res: Response) => {
  const { name, email, phone, trade, license_no, insurance_exp } = req.body as Record<string,unknown>;
  if (!name || !trade) { res.status(400).json({ error: "name and trade required" }); return; }
  const [row] = await sql`INSERT INTO con_subcontractors (name, email, phone, trade, license_no, insurance_exp)
    VALUES (${name}, ${email??null}, ${phone??null}, ${trade}, ${license_no??null}, ${insurance_exp??null}) RETURNING *`;
  res.status(201).json({ ok: true, subcontractor: row });
});

router.get("/punch-list", async (req: Request, res: Response) => {
  const { project_id, status } = req.query as Record<string,string>;
  const rows = await sql`SELECT pi.*, p.name AS project_name FROM con_punch_items pi
    LEFT JOIN con_projects p ON p.id=pi.project_id
    WHERE (${project_id||null}::text IS NULL OR pi.project_id=${project_id}::int)
      AND (${status||null}::text IS NULL OR pi.status=${status}) ORDER BY pi.priority DESC, pi.created_at`;
  res.json({ ok: true, items: rows, count: rows.length });
});
router.post("/punch-list", requireAuth, async (req: Request, res: Response) => {
  const { project_id, description, location, assigned_to, priority, due_date } = req.body as Record<string,unknown>;
  if (!project_id || !description) { res.status(400).json({ error: "project_id and description required" }); return; }
  const [row] = await sql`INSERT INTO con_punch_items (project_id, description, location, assigned_to, priority, due_date)
    VALUES (${project_id}, ${description}, ${location??null}, ${assigned_to??null}, ${priority??'normal'}, ${due_date??null}) RETURNING *`;
  res.status(201).json({ ok: true, item: row });
});
router.put("/punch-list/:id/resolve", requireAuth, async (req: Request, res: Response) => {
  const [row] = await sql`UPDATE con_punch_items SET status='resolved', resolved_at=NOW() WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Punch item not found" }); return; }
  res.json({ ok: true, item: row });
});

router.get("/stats", async (_req: Request, res: Response) => {
  const [p, b, c, i, punch] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM con_projects`,
    sql`SELECT COUNT(*)::int AS n FROM con_bids WHERE status='awarded'`,
    sql`SELECT COALESCE(SUM(value),0)::numeric AS t FROM con_contracts WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM con_inspections WHERE result='passed'`,
    sql`SELECT COUNT(*)::int AS n FROM con_punch_items WHERE status='open'`,
  ]);
  res.json({ ok: true, totalProjects: p[0]?.n, awardedBids: b[0]?.n,
    activeContractValue: c[0]?.t, passedInspections: i[0]?.n, openPunchItems: punch[0]?.n });
});

export default router;
