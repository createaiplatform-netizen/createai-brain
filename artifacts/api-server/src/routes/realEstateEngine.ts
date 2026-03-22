/**
 * routes/realEstateEngine.ts — Real Estate Management Engine
 * ──────────────────────────────────────────────────────────────
 * Full real estate: properties, listings, agents, transactions, valuations, leads.
 */

import { Router, type Request, type Response } from "express";
import { sql }         from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

async function ensureTables() {
  await sql`CREATE TABLE IF NOT EXISTS re_properties (
    id           SERIAL PRIMARY KEY,
    address      VARCHAR(400) NOT NULL,
    city         VARCHAR(100),
    state        VARCHAR(50),
    zip          VARCHAR(20),
    type         VARCHAR(100) DEFAULT 'residential',
    subtype      VARCHAR(100),
    bedrooms     INTEGER,
    bathrooms    NUMERIC(4,1),
    sqft         NUMERIC(12,2),
    lot_sqft     NUMERIC(12,2),
    year_built   INTEGER,
    description  TEXT,
    amenities    JSONB DEFAULT '[]',
    status       VARCHAR(30) DEFAULT 'active',
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS re_listings (
    id            SERIAL PRIMARY KEY,
    property_id   INTEGER REFERENCES re_properties(id) ON DELETE CASCADE,
    agent_id      INTEGER,
    list_price    NUMERIC(14,2) NOT NULL,
    list_type     VARCHAR(50) DEFAULT 'sale',
    status        VARCHAR(30) DEFAULT 'active',
    listed_at     TIMESTAMPTZ DEFAULT NOW(),
    expires_at    TIMESTAMPTZ,
    days_on_market INTEGER,
    open_house    JSONB DEFAULT '[]',
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS re_agents (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(300) NOT NULL,
    email        VARCHAR(255),
    phone        VARCHAR(50),
    license_no   VARCHAR(100),
    agency       VARCHAR(300),
    specialties  JSONB DEFAULT '[]',
    rating       NUMERIC(3,2) DEFAULT 5.0,
    status       VARCHAR(30) DEFAULT 'active',
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS re_transactions (
    id              SERIAL PRIMARY KEY,
    property_id     INTEGER REFERENCES re_properties(id) ON DELETE SET NULL,
    listing_id      INTEGER REFERENCES re_listings(id) ON DELETE SET NULL,
    buyer_name      VARCHAR(300),
    buyer_email     VARCHAR(255),
    seller_name     VARCHAR(300),
    agent_id        INTEGER REFERENCES re_agents(id) ON DELETE SET NULL,
    sale_price      NUMERIC(14,2),
    commission_pct  NUMERIC(5,2) DEFAULT 3.0,
    commission_amt  NUMERIC(12,2),
    close_date      DATE,
    status          VARCHAR(30) DEFAULT 'pending',
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS re_valuations (
    id          SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES re_properties(id) ON DELETE CASCADE,
    value       NUMERIC(14,2) NOT NULL,
    method      VARCHAR(100) DEFAULT 'comparative_market_analysis',
    appraiser   VARCHAR(300),
    notes       TEXT,
    valued_at   TIMESTAMPTZ DEFAULT NOW(),
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS re_leads (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(300) NOT NULL,
    email         VARCHAR(255),
    phone         VARCHAR(50),
    intent        VARCHAR(50) DEFAULT 'buy',
    budget_min    NUMERIC(14,2),
    budget_max    NUMERIC(14,2),
    preferred_area VARCHAR(300),
    bedrooms_min  INTEGER,
    status        VARCHAR(30) DEFAULT 'new',
    assigned_to   INTEGER REFERENCES re_agents(id) ON DELETE SET NULL,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`;
}
ensureTables().catch(console.error);

router.get("/dashboard", async (_req: Request, res: Response) => {
  const [props, listings, txns, rev, leads] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM re_properties WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n, status FROM re_listings GROUP BY status`,
    sql`SELECT COUNT(*)::int AS n FROM re_transactions WHERE status='closed' AND created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COALESCE(SUM(commission_amt),0)::numeric AS r FROM re_transactions WHERE status='closed' AND created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*)::int AS n FROM re_leads WHERE status='new'`,
  ]);
  const listingsByStatus = listings.reduce((a: Record<string,number>, r) => { a[String(r.status)] = Number(r.n); return a; }, {});
  res.json({ ok: true, engine: "Real Estate Engine v1",
    activeProperties: props[0]?.n, listings: listingsByStatus,
    closedLast30d: txns[0]?.n, commissionLast30d: rev[0]?.r, newLeads: leads[0]?.n });
});

router.get("/properties", async (req: Request, res: Response) => {
  const { type, status, city, q } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM re_properties
    WHERE (${type||null}::text IS NULL OR type=${type})
      AND (${status||null}::text IS NULL OR status=${status})
      AND (${city||null}::text IS NULL OR city ILIKE ${'%'+(city||'')+'%'})
      AND (${q||null}::text IS NULL OR address ILIKE ${'%'+(q||'')+'%'})
    ORDER BY created_at DESC`;
  res.json({ ok: true, properties: rows, count: rows.length });
});
router.post("/properties", requireAuth, async (req: Request, res: Response) => {
  const { address, city, state, zip, type, subtype, bedrooms, bathrooms, sqft, lot_sqft, year_built, description } = req.body as Record<string,unknown>;
  if (!address) { res.status(400).json({ error: "address required" }); return; }
  const [row] = await sql`INSERT INTO re_properties (address, city, state, zip, type, subtype, bedrooms, bathrooms, sqft, lot_sqft, year_built, description)
    VALUES (${address}, ${city??null}, ${state??null}, ${zip??null}, ${type??'residential'}, ${subtype??null}, ${bedrooms??null}, ${bathrooms??null}, ${sqft??null}, ${lot_sqft??null}, ${year_built??null}, ${description??null}) RETURNING *`;
  res.status(201).json({ ok: true, property: row });
});
router.get("/properties/:id", async (req: Request, res: Response) => {
  const [prop] = await sql`SELECT * FROM re_properties WHERE id=${req.params.id}`;
  if (!prop) { res.status(404).json({ error: "Property not found" }); return; }
  const [valuation] = await sql`SELECT * FROM re_valuations WHERE property_id=${req.params.id} ORDER BY valued_at DESC LIMIT 1`;
  const listings    = await sql`SELECT * FROM re_listings WHERE property_id=${req.params.id} ORDER BY listed_at DESC`;
  res.json({ ok: true, property: prop, latestValuation: valuation ?? null, listings });
});
router.put("/properties/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, description } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE re_properties SET status=COALESCE(${status??null},status), description=COALESCE(${description??null},description) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Property not found" }); return; }
  res.json({ ok: true, property: row });
});
router.delete("/properties/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM re_properties WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.get("/listings", async (req: Request, res: Response) => {
  const { status, type } = req.query as Record<string,string>;
  const rows = await sql`SELECT l.*, p.address, p.city, p.bedrooms, p.bathrooms, p.sqft, a.name AS agent_name FROM re_listings l
    LEFT JOIN re_properties p ON p.id = l.property_id
    LEFT JOIN re_agents a ON a.id = l.agent_id
    WHERE (${status||null}::text IS NULL OR l.status=${status})
      AND (${type||null}::text IS NULL OR l.list_type=${type})
    ORDER BY l.listed_at DESC`;
  res.json({ ok: true, listings: rows, count: rows.length });
});
router.post("/listings", requireAuth, async (req: Request, res: Response) => {
  const { property_id, agent_id, list_price, list_type, expires_at } = req.body as Record<string,unknown>;
  if (!property_id || !list_price) { res.status(400).json({ error: "property_id and list_price required" }); return; }
  const [row] = await sql`INSERT INTO re_listings (property_id, agent_id, list_price, list_type, expires_at)
    VALUES (${property_id}, ${agent_id??null}, ${list_price}, ${list_type??'sale'}, ${expires_at??null}) RETURNING *`;
  res.status(201).json({ ok: true, listing: row });
});
router.put("/listings/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, list_price } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE re_listings SET status=COALESCE(${status??null},status), list_price=COALESCE(${list_price??null},list_price) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Listing not found" }); return; }
  res.json({ ok: true, listing: row });
});

router.get("/agents", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT a.*, COUNT(t.id)::int AS deals_closed FROM re_agents a
    LEFT JOIN re_transactions t ON t.agent_id=a.id AND t.status='closed'
    GROUP BY a.id ORDER BY a.name`;
  res.json({ ok: true, agents: rows, count: rows.length });
});
router.post("/agents", requireAuth, async (req: Request, res: Response) => {
  const { name, email, phone, license_no, agency } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO re_agents (name, email, phone, license_no, agency)
    VALUES (${name}, ${email??null}, ${phone??null}, ${license_no??null}, ${agency??null}) RETURNING *`;
  res.status(201).json({ ok: true, agent: row });
});

router.get("/transactions", async (req: Request, res: Response) => {
  const { status } = req.query as Record<string,string>;
  const rows = await sql`SELECT t.*, p.address, a.name AS agent_name FROM re_transactions t
    LEFT JOIN re_properties p ON p.id=t.property_id
    LEFT JOIN re_agents a ON a.id=t.agent_id
    WHERE (${status||null}::text IS NULL OR t.status=${status})
    ORDER BY t.created_at DESC`;
  res.json({ ok: true, transactions: rows, count: rows.length });
});
router.post("/transactions", requireAuth, async (req: Request, res: Response) => {
  const { property_id, listing_id, buyer_name, buyer_email, seller_name, agent_id, sale_price, commission_pct, close_date } = req.body as Record<string,unknown>;
  if (!property_id || !sale_price) { res.status(400).json({ error: "property_id and sale_price required" }); return; }
  const commission_amt = Number(sale_price) * Number(commission_pct ?? 3) / 100;
  const [row] = await sql`INSERT INTO re_transactions (property_id, listing_id, buyer_name, buyer_email, seller_name, agent_id, sale_price, commission_pct, commission_amt, close_date)
    VALUES (${property_id}, ${listing_id??null}, ${buyer_name??null}, ${buyer_email??null}, ${seller_name??null}, ${agent_id??null}, ${sale_price}, ${commission_pct??3}, ${commission_amt}, ${close_date??null}) RETURNING *`;
  res.status(201).json({ ok: true, transaction: row });
});
router.put("/transactions/:id/close", requireAuth, async (req: Request, res: Response) => {
  const { close_date } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE re_transactions SET status='closed', close_date=COALESCE(${close_date??null},CURRENT_DATE) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Transaction not found" }); return; }
  res.json({ ok: true, transaction: row });
});

router.get("/valuations", async (req: Request, res: Response) => {
  const { property_id } = req.query as Record<string,string>;
  const rows = await sql`SELECT v.*, p.address FROM re_valuations v
    LEFT JOIN re_properties p ON p.id=v.property_id
    WHERE (${property_id||null}::text IS NULL OR v.property_id=${property_id}::int)
    ORDER BY v.valued_at DESC`;
  res.json({ ok: true, valuations: rows, count: rows.length });
});
router.post("/valuations", requireAuth, async (req: Request, res: Response) => {
  const { property_id, value, method, appraiser, notes } = req.body as Record<string,unknown>;
  if (!property_id || !value) { res.status(400).json({ error: "property_id and value required" }); return; }
  const [row] = await sql`INSERT INTO re_valuations (property_id, value, method, appraiser, notes)
    VALUES (${property_id}, ${value}, ${method??'comparative_market_analysis'}, ${appraiser??null}, ${notes??null}) RETURNING *`;
  res.status(201).json({ ok: true, valuation: row });
});

router.get("/leads", async (req: Request, res: Response) => {
  const { status, intent } = req.query as Record<string,string>;
  const rows = await sql`SELECT l.*, a.name AS agent_name FROM re_leads l
    LEFT JOIN re_agents a ON a.id=l.assigned_to
    WHERE (${status||null}::text IS NULL OR l.status=${status})
      AND (${intent||null}::text IS NULL OR l.intent=${intent})
    ORDER BY l.created_at DESC`;
  res.json({ ok: true, leads: rows, count: rows.length });
});
router.post("/leads", async (req: Request, res: Response) => {
  const { name, email, phone, intent, budget_min, budget_max, preferred_area, bedrooms_min } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await sql`INSERT INTO re_leads (name, email, phone, intent, budget_min, budget_max, preferred_area, bedrooms_min)
    VALUES (${name}, ${email??null}, ${phone??null}, ${intent??'buy'}, ${budget_min??null}, ${budget_max??null}, ${preferred_area??null}, ${bedrooms_min??null}) RETURNING *`;
  res.status(201).json({ ok: true, lead: row });
});
router.put("/leads/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, assigned_to, notes } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE re_leads SET status=COALESCE(${status??null},status), assigned_to=COALESCE(${assigned_to??null},assigned_to), notes=COALESCE(${notes??null},notes) WHERE id=${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Lead not found" }); return; }
  res.json({ ok: true, lead: row });
});

router.get("/stats", async (_req: Request, res: Response) => {
  const [props, agents, txns, rev, leads] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM re_properties WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM re_agents WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM re_transactions WHERE status='closed'`,
    sql`SELECT COALESCE(SUM(commission_amt),0)::numeric AS r FROM re_transactions WHERE status='closed'`,
    sql`SELECT COUNT(*)::int AS n FROM re_leads`,
  ]);
  res.json({ ok: true, activeProperties: props[0]?.n, activeAgents: agents[0]?.n,
    closedTransactions: txns[0]?.n, totalCommissions: rev[0]?.r, totalLeads: leads[0]?.n });
});

export default router;
