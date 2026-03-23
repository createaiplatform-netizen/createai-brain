/**
 * routes/insuranceEngine.ts — Insurance Management Engine
 * ────────────────────────────────────────────────────────
 * Full insurance platform: policies, claims, clients, agents, coverage, underwriting.
 */

import { Router, type Request, type Response } from "express";
import { rawSql as sql } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

async function ensureTables() {
  await sql`CREATE TABLE IF NOT EXISTS ins_clients (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(300) NOT NULL,
    email        VARCHAR(255),
    phone        VARCHAR(50),
    dob          DATE,
    address      VARCHAR(400),
    client_type  VARCHAR(50) DEFAULT 'individual',
    risk_score   NUMERIC(5,2) DEFAULT 5.0,
    status       VARCHAR(30) DEFAULT 'active',
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ins_agents (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(300) NOT NULL,
    email         VARCHAR(255),
    phone         VARCHAR(50),
    license_no    VARCHAR(100),
    license_exp   DATE,
    specialties   JSONB DEFAULT '[]',
    commission_pct NUMERIC(5,2) DEFAULT 10.0,
    status        VARCHAR(30) DEFAULT 'active',
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ins_policies (
    id            SERIAL PRIMARY KEY,
    policy_no     VARCHAR(100) UNIQUE DEFAULT 'POL-' || LPAD(FLOOR(RANDOM()*9999999)::TEXT, 7, '0'),
    client_id     INTEGER REFERENCES ins_clients(id) ON DELETE SET NULL,
    agent_id      INTEGER REFERENCES ins_agents(id) ON DELETE SET NULL,
    type          VARCHAR(100) NOT NULL,
    subtype       VARCHAR(100),
    status        VARCHAR(30) DEFAULT 'active',
    premium       NUMERIC(12,2) NOT NULL,
    frequency     VARCHAR(30) DEFAULT 'monthly',
    coverage_amt  NUMERIC(14,2),
    deductible    NUMERIC(12,2),
    start_date    DATE,
    end_date      DATE,
    auto_renew    BOOLEAN DEFAULT TRUE,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ins_claims (
    id            SERIAL PRIMARY KEY,
    claim_no      VARCHAR(100) UNIQUE DEFAULT 'CLM-' || LPAD(FLOOR(RANDOM()*9999999)::TEXT, 7, '0'),
    policy_id     INTEGER REFERENCES ins_policies(id) ON DELETE SET NULL,
    client_id     INTEGER REFERENCES ins_clients(id) ON DELETE SET NULL,
    type          VARCHAR(100),
    description   TEXT NOT NULL,
    incident_date DATE,
    amount_claimed NUMERIC(14,2),
    amount_settled NUMERIC(14,2),
    status        VARCHAR(30) DEFAULT 'submitted',
    adjuster      VARCHAR(300),
    filed_at      TIMESTAMPTZ DEFAULT NOW(),
    settled_at    TIMESTAMPTZ,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ins_payments (
    id           SERIAL PRIMARY KEY,
    policy_id    INTEGER REFERENCES ins_policies(id) ON DELETE CASCADE,
    amount       NUMERIC(12,2) NOT NULL,
    method       VARCHAR(50) DEFAULT 'ach',
    status       VARCHAR(30) DEFAULT 'paid',
    period_from  DATE,
    period_to    DATE,
    paid_at      TIMESTAMPTZ DEFAULT NOW(),
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
}
ensureTables().catch(console.error);

router.get("/dashboard", async (_req: Request, res: Response) => {
  const [clients, policies, claims, premium, pay] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM ins_clients WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n, status FROM ins_policies GROUP BY status`,
    sql`SELECT COUNT(*)::int AS n, status FROM ins_claims WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY status`,
    sql`SELECT COALESCE(SUM(premium),0)::numeric AS t FROM ins_policies WHERE status='active'`,
    sql`SELECT COALESCE(SUM(amount),0)::numeric AS t FROM ins_payments WHERE paid_at >= NOW() - INTERVAL '30 days'`,
  ]);
  const policiesByStatus = policies.reduce((a: Record<string,number>, r) => { a[String(r.status)] = Number(r.n); return a; }, {});
  const claimsByStatus   = claims.reduce((a: Record<string,number>, r) => { a[String(r.status)] = Number(r.n); return a; }, {});
  res.json({ ok: true, engine: "Insurance Management Engine v1",
    activeClients: clients[0]?.n, policies: policiesByStatus, claims: claimsByStatus,
    totalActivePremium: premium[0]?.t, premiumCollectedLast30d: pay[0]?.t });
});

router.get("/clients", async (req: Request, res: Response) => {
  const { q, status } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM ins_clients WHERE (${status||null}::text IS NULL OR status=${status}) AND (${q||null}::text IS NULL OR name ILIKE ${'%'+(q||'')+'%'} OR email ILIKE ${'%'+(q||'')+'%'}) ORDER BY name`;
  res.json({ ok: true, clients: rows, count: rows.length });
});
router.post("/clients", requireAuth, async (req: Request, res: Response) => {
  const { name, email, phone, dob, address, client_type } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO ins_clients (name, email, phone, dob, address, client_type)
    VALUES (${name}, ${email??null}, ${phone??null}, ${dob??null}, ${address??null}, ${client_type??'individual'}) RETURNING *`;
  res.status(201).json({ ok: true, client: row });
});
router.get("/clients/:id", async (req: Request, res: Response) => {
  const [c] = await sql`SELECT * FROM ins_clients WHERE id=${req.params.id}`;
  if (!c) { res.status(404).json({ error: "Client not found" }); return; }
  const policies = await sql`SELECT * FROM ins_policies WHERE client_id=${req.params.id} ORDER BY created_at DESC`;
  const claims   = await sql`SELECT * FROM ins_claims WHERE client_id=${req.params.id} ORDER BY filed_at DESC`;
  res.json({ ok: true, client: c, policies, claims });
});
router.put("/clients/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, risk_score, notes } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE ins_clients SET status=COALESCE(${status??null},status), risk_score=COALESCE(${risk_score??null},risk_score) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Client not found" }); return; }
  res.json({ ok: true, client: row });
});
router.delete("/clients/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM ins_clients WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/agents", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT a.*, COUNT(p.id)::int AS policy_count FROM ins_agents a
    LEFT JOIN ins_policies p ON p.agent_id=a.id AND p.status='active'
    GROUP BY a.id ORDER BY a.name`;
  res.json({ ok: true, agents: rows, count: rows.length });
});
router.post("/agents", requireAuth, async (req: Request, res: Response) => {
  const { name, email, phone, license_no, license_exp, specialties, commission_pct } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO ins_agents (name, email, phone, license_no, license_exp, specialties, commission_pct)
    VALUES (${name}, ${email??null}, ${phone??null}, ${license_no??null}, ${license_exp??null}, ${JSON.stringify(specialties??[])}, ${commission_pct??10}) RETURNING *`;
  res.status(201).json({ ok: true, agent: row });
});

router.get("/policies", async (req: Request, res: Response) => {
  const { client_id, agent_id, type, status } = req.query as Record<string,string>;
  const rows = await sql`SELECT p.*, c.name AS client_name, a.name AS agent_name FROM ins_policies p
    LEFT JOIN ins_clients c ON c.id=p.client_id LEFT JOIN ins_agents a ON a.id=p.agent_id
    WHERE (${client_id||null}::text IS NULL OR p.client_id=${client_id}::int)
      AND (${agent_id||null}::text IS NULL OR p.agent_id=${agent_id}::int)
      AND (${type||null}::text IS NULL OR p.type=${type})
      AND (${status||null}::text IS NULL OR p.status=${status})
    ORDER BY p.created_at DESC`;
  res.json({ ok: true, policies: rows, count: rows.length });
});
router.post("/policies", requireAuth, async (req: Request, res: Response) => {
  const { client_id, agent_id, type, subtype, premium, frequency, coverage_amt, deductible, start_date, end_date } = req.body as Record<string,unknown>;
  if (!client_id || !type || !premium) { res.status(400).json({ error: "client_id, type, premium required" }); return; }
  const [row] = await sql`INSERT INTO ins_policies (client_id, agent_id, type, subtype, premium, frequency, coverage_amt, deductible, start_date, end_date)
    VALUES (${client_id}, ${agent_id??null}, ${type}, ${subtype??null}, ${premium}, ${frequency??'monthly'}, ${coverage_amt??null}, ${deductible??null}, ${start_date??null}, ${end_date??null}) RETURNING *`;
  res.status(201).json({ ok: true, policy: row });
});
router.put("/policies/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, premium, end_date, notes } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE ins_policies SET status=COALESCE(${status??null},status), premium=COALESCE(${premium??null},premium), end_date=COALESCE(${end_date??null},end_date), notes=COALESCE(${notes??null},notes) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Policy not found" }); return; }
  res.json({ ok: true, policy: row });
});
router.delete("/policies/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM ins_policies WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/claims", async (req: Request, res: Response) => {
  const { status, policy_id, client_id } = req.query as Record<string,string>;
  const rows = await sql`SELECT cl.*, c.name AS client_name, p.policy_no FROM ins_claims cl
    LEFT JOIN ins_clients c ON c.id=cl.client_id LEFT JOIN ins_policies p ON p.id=cl.policy_id
    WHERE (${status||null}::text IS NULL OR cl.status=${status})
      AND (${policy_id||null}::text IS NULL OR cl.policy_id=${policy_id}::int)
      AND (${client_id||null}::text IS NULL OR cl.client_id=${client_id}::int)
    ORDER BY cl.filed_at DESC`;
  res.json({ ok: true, claims: rows, count: rows.length });
});
router.post("/claims", async (req: Request, res: Response) => {
  const { policy_id, client_id, type, description, incident_date, amount_claimed } = req.body as Record<string,unknown>;
  if (!policy_id || !description) { res.status(400).json({ error: "policy_id and description required" }); return; }
  const [row] = await sql`INSERT INTO ins_claims (policy_id, client_id, type, description, incident_date, amount_claimed)
    VALUES (${policy_id}, ${client_id??null}, ${type??null}, ${description}, ${incident_date??null}, ${amount_claimed??null}) RETURNING *`;
  res.status(201).json({ ok: true, claim: row });
});
router.put("/claims/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, adjuster, amount_settled, notes } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE ins_claims SET status=COALESCE(${status??null},status), adjuster=COALESCE(${adjuster??null},adjuster), amount_settled=COALESCE(${amount_settled??null},amount_settled), notes=COALESCE(${notes??null},notes), settled_at=CASE WHEN ${status}='settled' THEN NOW() ELSE settled_at END WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Claim not found" }); return; }
  res.json({ ok: true, claim: row });
});

router.post("/payments", requireAuth, async (req: Request, res: Response) => {
  const { policy_id, amount, method, period_from, period_to } = req.body as Record<string,unknown>;
  if (!policy_id || !amount) { res.status(400).json({ error: "policy_id and amount required" }); return; }
  const [row] = await sql`INSERT INTO ins_payments (policy_id, amount, method, period_from, period_to)
    VALUES (${policy_id}, ${amount}, ${method??'ach'}, ${period_from??null}, ${period_to??null}) RETURNING *`;
  res.status(201).json({ ok: true, payment: row });
});
router.get("/payments", async (req: Request, res: Response) => {
  const { policy_id } = req.query as Record<string,string>;
  const rows = await sql`SELECT ip.*, p.policy_no FROM ins_payments ip LEFT JOIN ins_policies p ON p.id=ip.policy_id WHERE (${policy_id||null}::text IS NULL OR ip.policy_id=${policy_id}::int) ORDER BY ip.paid_at DESC`;
  res.json({ ok: true, payments: rows, count: rows.length });
});

router.get("/stats", async (_req: Request, res: Response) => {
  const [pol, cli, clm, rev] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM ins_policies WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM ins_clients WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM ins_claims WHERE status NOT IN ('closed','denied')`,
    sql`SELECT COALESCE(SUM(amount),0)::numeric AS r FROM ins_payments WHERE paid_at >= NOW() - INTERVAL '30 days'`,
  ]);
  res.json({ ok: true, activePolicies: pol[0]?.n, activeClients: cli[0]?.n, openClaims: clm[0]?.n, premiumLast30d: rev[0]?.r });
});

export default router;
