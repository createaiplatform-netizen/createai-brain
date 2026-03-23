/**
 * routes/nonprofitEngine.ts — Nonprofit Management Engine
 * ──────────────────────────────────────────────────────────
 * Full nonprofit: donors, donations, grants, volunteers, programs, impact.
 */

import { Router, type Request, type Response } from "express";
import { rawSql as sql } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

async function ensureTables() {
  await sql`CREATE TABLE IF NOT EXISTS npo_donors (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(300) NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(50),
    type            VARCHAR(50) DEFAULT 'individual',
    tier            VARCHAR(30) DEFAULT 'standard',
    total_given     NUMERIC(14,2) DEFAULT 0,
    first_gift      DATE,
    last_gift       DATE,
    address         VARCHAR(400),
    notes           TEXT,
    status          VARCHAR(30) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS npo_donations (
    id          SERIAL PRIMARY KEY,
    donor_id    INTEGER REFERENCES npo_donors(id) ON DELETE SET NULL,
    amount      NUMERIC(12,2) NOT NULL,
    currency    VARCHAR(10) DEFAULT 'USD',
    method      VARCHAR(50) DEFAULT 'check',
    campaign    VARCHAR(300),
    program_id  INTEGER,
    is_recurring BOOLEAN DEFAULT FALSE,
    receipt_no  VARCHAR(100) UNIQUE DEFAULT 'RCP-' || LPAD(FLOOR(RANDOM()*9999999)::TEXT, 7, '0'),
    donated_at  TIMESTAMPTZ DEFAULT NOW(),
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS npo_grants (
    id            SERIAL PRIMARY KEY,
    funder        VARCHAR(300) NOT NULL,
    title         VARCHAR(400) NOT NULL,
    amount        NUMERIC(14,2),
    status        VARCHAR(50) DEFAULT 'applied',
    applied_at    DATE,
    awarded_at    DATE,
    start_date    DATE,
    end_date      DATE,
    reporter      VARCHAR(200),
    report_due    DATE,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS npo_volunteers (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(300) NOT NULL,
    email        VARCHAR(255),
    phone        VARCHAR(50),
    skills       JSONB DEFAULT '[]',
    availability VARCHAR(200),
    status       VARCHAR(30) DEFAULT 'active',
    hours_total  NUMERIC(10,2) DEFAULT 0,
    joined_at    DATE DEFAULT CURRENT_DATE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS npo_programs (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(300) NOT NULL,
    description  TEXT,
    category     VARCHAR(100),
    budget       NUMERIC(14,2),
    spent        NUMERIC(14,2) DEFAULT 0,
    status       VARCHAR(30) DEFAULT 'active',
    start_date   DATE,
    end_date     DATE,
    manager      VARCHAR(200),
    beneficiaries INTEGER DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS npo_volunteer_hours (
    id            SERIAL PRIMARY KEY,
    volunteer_id  INTEGER REFERENCES npo_volunteers(id) ON DELETE CASCADE,
    program_id    INTEGER REFERENCES npo_programs(id) ON DELETE SET NULL,
    hours         NUMERIC(6,2),
    activity      VARCHAR(300),
    logged_at     DATE DEFAULT CURRENT_DATE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`;
}
ensureTables().catch(console.error);

router.get("/dashboard", async (_req: Request, res: Response) => {
  const [donors, donated, grants, vols, programs] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM npo_donors WHERE status='active'`,
    sql`SELECT COALESCE(SUM(amount),0)::numeric AS t FROM npo_donations WHERE donated_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*)::int AS n, status FROM npo_grants GROUP BY status`,
    sql`SELECT COUNT(*)::int AS n FROM npo_volunteers WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM npo_programs WHERE status='active'`,
  ]);
  const grantsByStatus = grants.reduce((a: Record<string,number>, r) => { a[String(r.status)] = Number(r.n); return a; }, {});
  res.json({ ok: true, engine: "Nonprofit Management Engine v1",
    activeDonors: donors[0]?.n, donationsLast30d: donated[0]?.t,
    grants: grantsByStatus, activeVolunteers: vols[0]?.n, activePrograms: programs[0]?.n });
});

router.get("/donors", async (req: Request, res: Response) => {
  const { tier, status, q } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM npo_donors
    WHERE (${tier||null}::text IS NULL OR tier=${tier}) AND (${status||null}::text IS NULL OR status=${status})
      AND (${q||null}::text IS NULL OR name ILIKE ${'%'+(q||'')+'%'} OR email ILIKE ${'%'+(q||'')+'%'})
    ORDER BY total_given DESC`;
  res.json({ ok: true, donors: rows, count: rows.length });
});
router.post("/donors", requireAuth, async (req: Request, res: Response) => {
  const { name, email, phone, type, address, notes } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO npo_donors (name, email, phone, type, address, notes)
    VALUES (${name}, ${email??null}, ${phone??null}, ${type??'individual'}, ${address??null}, ${notes??null}) RETURNING *`;
  res.status(201).json({ ok: true, donor: row });
});
router.get("/donors/:id", async (req: Request, res: Response) => {
  const [d] = await sql`SELECT * FROM npo_donors WHERE id=${req.params.id}`;
  if (!d) { res.status(404).json({ error: "Donor not found" }); return; }
  const history = await sql`SELECT * FROM npo_donations WHERE donor_id=${req.params.id} ORDER BY donated_at DESC LIMIT 20`;
  res.json({ ok: true, donor: d, donationHistory: history });
});
router.put("/donors/:id", requireAuth, async (req: Request, res: Response) => {
  const { tier, status, notes } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE npo_donors SET tier=COALESCE(${tier??null},tier), status=COALESCE(${status??null},status), notes=COALESCE(${notes??null},notes) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Donor not found" }); return; }
  res.json({ ok: true, donor: row });
});
router.delete("/donors/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM npo_donors WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/donations", async (req: Request, res: Response) => {
  const { donor_id, campaign } = req.query as Record<string,string>;
  const rows = await sql`SELECT d.*, dn.name AS donor_name FROM npo_donations d
    LEFT JOIN npo_donors dn ON dn.id=d.donor_id
    WHERE (${donor_id||null}::text IS NULL OR d.donor_id=${donor_id}::int)
      AND (${campaign||null}::text IS NULL OR d.campaign ILIKE ${'%'+(campaign||'')+'%'})
    ORDER BY d.donated_at DESC`;
  res.json({ ok: true, donations: rows, count: rows.length });
});
router.post("/donations", requireAuth, async (req: Request, res: Response) => {
  const { donor_id, amount, method, campaign, program_id, is_recurring, notes } = req.body as Record<string,unknown>;
  if (!amount) { res.status(400).json({ error: "amount required" }); return; }
  const [row] = await sql`INSERT INTO npo_donations (donor_id, amount, method, campaign, program_id, is_recurring, notes)
    VALUES (${donor_id??null}, ${amount}, ${method??'check'}, ${campaign??null}, ${program_id??null}, ${is_recurring??false}, ${notes??null}) RETURNING *`;
  if (donor_id) {
    await sql`UPDATE npo_donors SET total_given=total_given+${amount}, last_gift=CURRENT_DATE,
      first_gift=COALESCE(first_gift, CURRENT_DATE) WHERE id=${donor_id}`;
  }
  res.status(201).json({ ok: true, donation: row });
});

router.get("/grants", async (req: Request, res: Response) => {
  const { status } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM npo_grants WHERE (${status||null}::text IS NULL OR status=${status}) ORDER BY created_at DESC`;
  res.json({ ok: true, grants: rows, count: rows.length });
});
router.post("/grants", requireAuth, async (req: Request, res: Response) => {
  const { funder, title, amount, status, applied_at, start_date, end_date, reporter, report_due } = req.body as Record<string,unknown>;
  if (!funder || !title) { res.status(400).json({ error: "funder and title required" }); return; }
  const [row] = await sql`INSERT INTO npo_grants (funder, title, amount, status, applied_at, start_date, end_date, reporter, report_due)
    VALUES (${funder}, ${title}, ${amount??null}, ${status??'applied'}, ${applied_at??null}, ${start_date??null}, ${end_date??null}, ${reporter??null}, ${report_due??null}) RETURNING *`;
  res.status(201).json({ ok: true, grant: row });
});
router.put("/grants/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, awarded_at, amount, notes } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE npo_grants SET status=COALESCE(${status??null},status), awarded_at=COALESCE(${awarded_at??null},awarded_at), amount=COALESCE(${amount??null},amount), notes=COALESCE(${notes??null},notes) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Grant not found" }); return; }
  res.json({ ok: true, grant: row });
});
router.delete("/grants/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM npo_grants WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/volunteers", async (req: Request, res: Response) => {
  const { status } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM npo_volunteers WHERE (${status||null}::text IS NULL OR status=${status}) ORDER BY name`;
  res.json({ ok: true, volunteers: rows, count: rows.length });
});
router.post("/volunteers", async (req: Request, res: Response) => {
  const { name, email, phone, skills, availability } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO npo_volunteers (name, email, phone, skills, availability)
    VALUES (${name}, ${email??null}, ${phone??null}, ${JSON.stringify(skills??[])}, ${availability??null}) RETURNING *`;
  res.status(201).json({ ok: true, volunteer: row });
});
router.post("/volunteers/:id/log-hours", requireAuth, async (req: Request, res: Response) => {
  const { hours, program_id, activity, logged_at } = req.body as Record<string,unknown>;
  if (!hours) { res.status(400).json({ error: "hours required" }); return; }
  await sql`INSERT INTO npo_volunteer_hours (volunteer_id, program_id, hours, activity, logged_at)
    VALUES (${req.params.id}, ${program_id??null}, ${hours}, ${activity??null}, ${logged_at??null})`;
  await sql`UPDATE npo_volunteers SET hours_total=hours_total+${hours} WHERE id=${req.params.id}`;
  res.json({ ok: true, message: `${hours} hours logged` });
});
router.delete("/volunteers/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM npo_volunteers WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/programs", async (req: Request, res: Response) => {
  const { status } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM npo_programs WHERE (${status||null}::text IS NULL OR status=${status}) ORDER BY name`;
  res.json({ ok: true, programs: rows, count: rows.length });
});
router.post("/programs", requireAuth, async (req: Request, res: Response) => {
  const { name, description, category, budget, start_date, end_date, manager } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO npo_programs (name, description, category, budget, start_date, end_date, manager)
    VALUES (${name}, ${description??null}, ${category??null}, ${budget??null}, ${start_date??null}, ${end_date??null}, ${manager??null}) RETURNING *`;
  res.status(201).json({ ok: true, program: row });
});
router.put("/programs/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, spent, beneficiaries } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE npo_programs SET status=COALESCE(${status??null},status), spent=COALESCE(${spent??null},spent), beneficiaries=COALESCE(${beneficiaries??null},beneficiaries) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Program not found" }); return; }
  res.json({ ok: true, program: row });
});

router.get("/stats", async (_req: Request, res: Response) => {
  const [donors, total, grants, vols, hours] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM npo_donors`,
    sql`SELECT COALESCE(SUM(amount),0)::numeric AS t FROM npo_donations`,
    sql`SELECT COUNT(*)::int AS n FROM npo_grants WHERE status='awarded'`,
    sql`SELECT COUNT(*)::int AS n FROM npo_volunteers WHERE status='active'`,
    sql`SELECT COALESCE(SUM(hours),0)::numeric AS h FROM npo_volunteer_hours`,
  ]);
  res.json({ ok: true, totalDonors: donors[0]?.n, totalRaised: total[0]?.t,
    grantsAwarded: grants[0]?.n, activeVolunteers: vols[0]?.n, totalVolunteerHours: hours[0]?.h });
});

export default router;
