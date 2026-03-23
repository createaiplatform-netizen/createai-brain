/**
 * routes/manufacturingEngine.ts — Manufacturing Operations Engine
 * ─────────────────────────────────────────────────────────────────
 * Full manufacturing: products, BOM, work orders, quality control, machines.
 *
 * Routes:
 *   GET  /api/manufacturing/dashboard
 *   CRUD /api/manufacturing/products
 *   CRUD /api/manufacturing/bom               (Bill of Materials)
 *   CRUD /api/manufacturing/work-orders
 *   POST /api/manufacturing/work-orders/:id/start
 *   POST /api/manufacturing/work-orders/:id/complete
 *   CRUD /api/manufacturing/quality-checks
 *   CRUD /api/manufacturing/machines
 *   GET  /api/manufacturing/stats
 */

import { Router, type Request, type Response } from "express";
import { rawSql as sql } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS mfg_products (
      id           SERIAL PRIMARY KEY,
      sku          VARCHAR(100) UNIQUE,
      name         VARCHAR(300) NOT NULL,
      description  TEXT,
      unit         VARCHAR(50) DEFAULT 'unit',
      category     VARCHAR(100),
      lead_time_d  INTEGER DEFAULT 1,
      status       VARCHAR(30) DEFAULT 'active',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS mfg_bom (
      id             SERIAL PRIMARY KEY,
      parent_sku     VARCHAR(100) NOT NULL,
      component_sku  VARCHAR(100) NOT NULL,
      quantity       NUMERIC(12,4) NOT NULL DEFAULT 1,
      unit           VARCHAR(50) DEFAULT 'unit',
      notes          TEXT,
      created_at     TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(parent_sku, component_sku)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS mfg_work_orders (
      id             SERIAL PRIMARY KEY,
      wo_number      VARCHAR(100) UNIQUE DEFAULT 'WO-' || LPAD(FLOOR(RANDOM()*999999)::TEXT, 6, '0'),
      product_sku    VARCHAR(100) NOT NULL,
      quantity       NUMERIC(12,4) NOT NULL DEFAULT 1,
      status         VARCHAR(50)  DEFAULT 'planned',
      priority       VARCHAR(30)  DEFAULT 'normal',
      machine_id     INTEGER,
      operator       VARCHAR(200),
      scheduled_at   TIMESTAMPTZ,
      started_at     TIMESTAMPTZ,
      completed_at   TIMESTAMPTZ,
      notes          TEXT,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS mfg_quality_checks (
      id            SERIAL PRIMARY KEY,
      work_order_id INTEGER REFERENCES mfg_work_orders(id) ON DELETE SET NULL,
      product_sku   VARCHAR(100),
      inspector     VARCHAR(200),
      result        VARCHAR(30) DEFAULT 'pending',
      defects_found INTEGER DEFAULT 0,
      notes         TEXT,
      checked_at    TIMESTAMPTZ DEFAULT NOW(),
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS mfg_machines (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(200) NOT NULL,
      type          VARCHAR(100),
      location      VARCHAR(200),
      status        VARCHAR(30) DEFAULT 'active',
      capacity_hr   NUMERIC(10,2),
      last_service  DATE,
      next_service  DATE,
      operator      VARCHAR(200),
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
ensureTables().catch(console.error);

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
router.get("/dashboard", async (_req: Request, res: Response) => {
  const [prod, wo, qc, mach, fail] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM mfg_products WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n, status FROM mfg_work_orders GROUP BY status`,
    sql`SELECT COUNT(*)::int AS n FROM mfg_quality_checks WHERE checked_at >= NOW() - INTERVAL '7 days'`,
    sql`SELECT COUNT(*)::int AS n FROM mfg_machines WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM mfg_quality_checks WHERE result='fail' AND checked_at >= NOW() - INTERVAL '30 days'`,
  ]);
  const workOrders = wo.reduce((a: Record<string,number>, r: Record<string, unknown>) => { a[String(r["status"])] = Number(r["n"]); return a; }, {});
  res.json({ ok: true, engine: "Manufacturing Operations Engine v1",
    activeProducts: prod[0]?.n, workOrders, qualityChecksWeek: qc[0]?.n,
    activeMachines: mach[0]?.n, failuresLast30d: fail[0]?.n });
});

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
router.get("/products", async (req: Request, res: Response) => {
  const { status, q } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM mfg_products
    WHERE (${status||null}::text IS NULL OR status = ${status})
      AND (${q||null}::text IS NULL OR name ILIKE ${'%'+(q||'')+'%'})
    ORDER BY name`;
  res.json({ ok: true, products: rows, count: rows.length });
});
router.post("/products", requireAuth, async (req: Request, res: Response) => {
  const { sku, name, description, unit, category, lead_time_d } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [row] = await sql`INSERT INTO mfg_products (sku, name, description, unit, category, lead_time_d)
    VALUES (${sku??null}, ${name}, ${description??null}, ${unit??'unit'}, ${category??null}, ${lead_time_d??1})
    RETURNING *`;
  res.status(201).json({ ok: true, product: row });
});
router.put("/products/:id", requireAuth, async (req: Request, res: Response) => {
  const { name, description, status, lead_time_d } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE mfg_products SET
    name = COALESCE(${name??null}, name),
    description = COALESCE(${description??null}, description),
    status = COALESCE(${status??null}, status),
    lead_time_d = COALESCE(${lead_time_d??null}, lead_time_d)
    WHERE id = ${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ ok: true, product: row });
});
router.delete("/products/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM mfg_products WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

// ── BOM ───────────────────────────────────────────────────────────────────────
router.get("/bom", async (req: Request, res: Response) => {
  const { parent_sku } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM mfg_bom
    WHERE (${parent_sku||null}::text IS NULL OR parent_sku = ${parent_sku})
    ORDER BY parent_sku, component_sku`;
  res.json({ ok: true, bom: rows, count: rows.length });
});
router.post("/bom", requireAuth, async (req: Request, res: Response) => {
  const { parent_sku, component_sku, quantity, unit, notes } = req.body as Record<string,unknown>;
  if (!parent_sku || !component_sku || !quantity) { res.status(400).json({ error: "parent_sku, component_sku, quantity required" }); return; }
  const [row] = await sql`INSERT INTO mfg_bom (parent_sku, component_sku, quantity, unit, notes)
    VALUES (${parent_sku}, ${component_sku}, ${quantity}, ${unit??'unit'}, ${notes??null})
    ON CONFLICT (parent_sku, component_sku) DO UPDATE SET quantity = ${quantity}, notes = ${notes??null}
    RETURNING *`;
  res.status(201).json({ ok: true, bom_item: row });
});
router.delete("/bom/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM mfg_bom WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

// ── WORK ORDERS ───────────────────────────────────────────────────────────────
router.get("/work-orders", async (req: Request, res: Response) => {
  const { status, priority } = req.query as Record<string,string>;
  const rows = await sql`SELECT wo.*, m.name AS machine_name FROM mfg_work_orders wo
    LEFT JOIN mfg_machines m ON m.id = wo.machine_id
    WHERE (${status||null}::text IS NULL OR wo.status = ${status})
      AND (${priority||null}::text IS NULL OR wo.priority = ${priority})
    ORDER BY wo.created_at DESC`;
  res.json({ ok: true, workOrders: rows, count: rows.length });
});
router.post("/work-orders", requireAuth, async (req: Request, res: Response) => {
  const { product_sku, quantity, priority, machine_id, operator, scheduled_at, notes } = req.body as Record<string,unknown>;
  if (!product_sku || !quantity) { res.status(400).json({ error: "product_sku and quantity required" }); return; }
  const [row] = await sql`INSERT INTO mfg_work_orders (product_sku, quantity, priority, machine_id, operator, scheduled_at, notes)
    VALUES (${product_sku}, ${quantity}, ${priority??'normal'}, ${machine_id??null}, ${operator??null}, ${scheduled_at??null}, ${notes??null})
    RETURNING *`;
  res.status(201).json({ ok: true, workOrder: row });
});
router.post("/work-orders/:id/start", requireAuth, async (req: Request, res: Response) => {
  const [row] = await sql`UPDATE mfg_work_orders SET status = 'in_progress', started_at = NOW()
    WHERE id = ${req.params.id} AND status = 'planned' RETURNING *`;
  if (!row) { res.status(400).json({ error: "Work order not found or already started" }); return; }
  res.json({ ok: true, workOrder: row });
});
router.post("/work-orders/:id/complete", requireAuth, async (req: Request, res: Response) => {
  const [row] = await sql`UPDATE mfg_work_orders SET status = 'completed', completed_at = NOW()
    WHERE id = ${req.params.id} AND status = 'in_progress' RETURNING *`;
  if (!row) { res.status(400).json({ error: "Work order not in progress" }); return; }
  res.json({ ok: true, workOrder: row });
});
router.delete("/work-orders/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM mfg_work_orders WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

// ── QUALITY CHECKS ────────────────────────────────────────────────────────────
router.get("/quality-checks", async (req: Request, res: Response) => {
  const { result, work_order_id } = req.query as Record<string,string>;
  const rows = await sql`SELECT qc.*, wo.wo_number FROM mfg_quality_checks qc
    LEFT JOIN mfg_work_orders wo ON wo.id = qc.work_order_id
    WHERE (${result||null}::text IS NULL OR qc.result = ${result})
      AND (${work_order_id||null}::text IS NULL OR qc.work_order_id = ${work_order_id}::int)
    ORDER BY qc.checked_at DESC`;
  res.json({ ok: true, qualityChecks: rows, count: rows.length });
});
router.post("/quality-checks", requireAuth, async (req: Request, res: Response) => {
  const { work_order_id, product_sku, inspector, result, defects_found, notes } = req.body as Record<string,unknown>;
  if (!product_sku || !result) { res.status(400).json({ error: "product_sku and result required" }); return; }
  const [row] = await sql`INSERT INTO mfg_quality_checks (work_order_id, product_sku, inspector, result, defects_found, notes)
    VALUES (${work_order_id??null}, ${product_sku}, ${inspector??null}, ${result}, ${defects_found??0}, ${notes??null})
    RETURNING *`;
  res.status(201).json({ ok: true, qualityCheck: row });
});

// ── MACHINES ──────────────────────────────────────────────────────────────────
router.get("/machines", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT * FROM mfg_machines ORDER BY name`;
  res.json({ ok: true, machines: rows, count: rows.length });
});
router.post("/machines", requireAuth, async (req: Request, res: Response) => {
  const { name, type, location, capacity_hr, operator, last_service, next_service } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [row] = await sql`INSERT INTO mfg_machines (name, type, location, capacity_hr, operator, last_service, next_service)
    VALUES (${name}, ${type??null}, ${location??null}, ${capacity_hr??null}, ${operator??null}, ${last_service??null}, ${next_service??null})
    RETURNING *`;
  res.status(201).json({ ok: true, machine: row });
});
router.put("/machines/:id", requireAuth, async (req: Request, res: Response) => {
  const { status, operator, last_service, next_service } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE mfg_machines SET
    status = COALESCE(${status??null}, status),
    operator = COALESCE(${operator??null}, operator),
    last_service = COALESCE(${last_service??null}, last_service),
    next_service = COALESCE(${next_service??null}, next_service)
    WHERE id = ${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Machine not found" }); return; }
  res.json({ ok: true, machine: row });
});
router.delete("/machines/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM mfg_machines WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

// ── STATS ─────────────────────────────────────────────────────────────────────
router.get("/stats", async (_req: Request, res: Response) => {
  const [prod, wo_done, qc_pass, qc_fail, mach] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM mfg_products WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM mfg_work_orders WHERE status='completed' AND completed_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*)::int AS n FROM mfg_quality_checks WHERE result='pass' AND checked_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*)::int AS n FROM mfg_quality_checks WHERE result='fail' AND checked_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*)::int AS n FROM mfg_machines WHERE status='active'`,
  ]);
  const passRate = (Number(qc_pass[0]?.n) + Number(qc_fail[0]?.n)) > 0
    ? Math.round(Number(qc_pass[0]?.n) / (Number(qc_pass[0]?.n) + Number(qc_fail[0]?.n)) * 100)
    : null;
  res.json({ ok: true, activeProducts: prod[0]?.n, ordersCompletedLast30d: wo_done[0]?.n,
    qualityPassRate: passRate, activeMachines: mach[0]?.n });
});

export default router;
