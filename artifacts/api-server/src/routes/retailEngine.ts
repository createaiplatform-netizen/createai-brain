/**
 * routes/retailEngine.ts — Retail & Commerce Engine
 * ─────────────────────────────────────────────────────
 * Full retail management: products, inventory, categories, POS, promotions.
 *
 * Routes:
 *   GET  /api/retail/dashboard
 *   CRUD /api/retail/products
 *   CRUD /api/retail/categories
 *   GET  /api/retail/inventory       PUT  /api/retail/inventory/:product_id
 *   POST /api/retail/pos/transaction
 *   GET  /api/retail/pos/transactions
 *   GET  /api/retail/promotions      POST /api/retail/promotions
 *   GET  /api/retail/stats
 */

import { Router, type Request, type Response } from "express";
import { sql }         from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS retail_categories (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(200) NOT NULL,
      slug        VARCHAR(200) UNIQUE,
      parent_id   INTEGER REFERENCES retail_categories(id) ON DELETE SET NULL,
      description TEXT,
      status      VARCHAR(30) DEFAULT 'active',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS retail_products (
      id            SERIAL PRIMARY KEY,
      sku           VARCHAR(100) UNIQUE,
      name          VARCHAR(300) NOT NULL,
      description   TEXT,
      category_id   INTEGER REFERENCES retail_categories(id) ON DELETE SET NULL,
      price         NUMERIC(12,2) NOT NULL DEFAULT 0,
      cost          NUMERIC(12,2),
      unit          VARCHAR(50) DEFAULT 'each',
      barcode       VARCHAR(100),
      status        VARCHAR(30) DEFAULT 'active',
      taxable       BOOLEAN DEFAULT TRUE,
      image_url     TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS retail_inventory (
      id           SERIAL PRIMARY KEY,
      product_id   INTEGER REFERENCES retail_products(id) ON DELETE CASCADE UNIQUE,
      qty_on_hand  NUMERIC(12,2) DEFAULT 0,
      qty_reserved NUMERIC(12,2) DEFAULT 0,
      reorder_at   NUMERIC(12,2) DEFAULT 10,
      reorder_qty  NUMERIC(12,2) DEFAULT 50,
      location     VARCHAR(200),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS retail_transactions (
      id             SERIAL PRIMARY KEY,
      receipt_no     VARCHAR(100) UNIQUE DEFAULT 'RCP-' || LPAD(FLOOR(RANDOM()*9999999)::TEXT, 7, '0'),
      cashier        VARCHAR(200),
      subtotal       NUMERIC(12,2) DEFAULT 0,
      tax            NUMERIC(12,2) DEFAULT 0,
      discount       NUMERIC(12,2) DEFAULT 0,
      total          NUMERIC(12,2) DEFAULT 0,
      payment_method VARCHAR(50) DEFAULT 'cash',
      status         VARCHAR(30) DEFAULT 'completed',
      items          JSONB DEFAULT '[]',
      customer_name  VARCHAR(200),
      customer_email VARCHAR(255),
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS retail_promotions (
      id             SERIAL PRIMARY KEY,
      name           VARCHAR(300) NOT NULL,
      type           VARCHAR(50)  DEFAULT 'percentage',
      value          NUMERIC(10,2),
      min_purchase   NUMERIC(12,2),
      applies_to     VARCHAR(50)  DEFAULT 'all',
      category_id    INTEGER REFERENCES retail_categories(id) ON DELETE SET NULL,
      product_id     INTEGER REFERENCES retail_products(id) ON DELETE SET NULL,
      code           VARCHAR(100),
      starts_at      TIMESTAMPTZ,
      ends_at        TIMESTAMPTZ,
      status         VARCHAR(30) DEFAULT 'active',
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
ensureTables().catch(console.error);

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
router.get("/dashboard", async (_req: Request, res: Response) => {
  const [prod, inv, txn, rev, promo] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM retail_products WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS low FROM retail_inventory WHERE qty_on_hand <= reorder_at`,
    sql`SELECT COUNT(*)::int AS n FROM retail_transactions WHERE created_at >= NOW() - INTERVAL '24 hours'`,
    sql`SELECT COALESCE(SUM(total),0)::numeric AS r FROM retail_transactions WHERE created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*)::int AS n FROM retail_promotions WHERE status='active'`,
  ]);
  res.json({ ok: true, engine: "Retail & Commerce Engine v1",
    activeProducts: prod[0]?.n, lowStockAlerts: inv[0]?.low,
    transactionsToday: txn[0]?.n, revenueLastMonth: rev[0]?.r,
    activePromotions: promo[0]?.n });
});

// ── CATEGORIES ────────────────────────────────────────────────────────────────
router.get("/categories", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT c.*, COUNT(p.id)::int AS product_count
    FROM retail_categories c LEFT JOIN retail_products p ON p.category_id = c.id
    GROUP BY c.id ORDER BY c.name`;
  res.json({ ok: true, categories: rows, count: rows.length });
});
router.post("/categories", requireAuth, async (req: Request, res: Response) => {
  const { name, description, parent_id } = req.body as Record<string,unknown>;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const slug = String(name).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const [row] = await sql`INSERT INTO retail_categories (name, slug, description, parent_id)
    VALUES (${name}, ${slug}, ${description??null}, ${parent_id??null}) RETURNING *`;
  res.status(201).json({ ok: true, category: row });
});
router.delete("/categories/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM retail_categories WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
router.get("/products", async (req: Request, res: Response) => {
  const { category_id, status, q } = req.query as Record<string,string>;
  const rows = await sql`SELECT p.*, c.name AS category_name,
    COALESCE(i.qty_on_hand, 0) AS qty_on_hand, COALESCE(i.reorder_at, 10) AS reorder_at
    FROM retail_products p
    LEFT JOIN retail_categories c ON c.id = p.category_id
    LEFT JOIN retail_inventory i ON i.product_id = p.id
    WHERE (${ category_id || null }::text IS NULL OR p.category_id = ${ category_id }::int)
      AND (${ status || null }::text IS NULL OR p.status = ${ status })
      AND (${ q || null }::text IS NULL OR p.name ILIKE ${'%' + (q||'') + '%'})
    ORDER BY p.name`;
  res.json({ ok: true, products: rows, count: rows.length });
});
router.post("/products", requireAuth, async (req: Request, res: Response) => {
  const { sku, name, description, category_id, price, cost, unit, barcode, taxable, image_url } = req.body as Record<string,unknown>;
  if (!name || price === undefined) { res.status(400).json({ error: "name and price are required" }); return; }
  const [row] = await sql`INSERT INTO retail_products (sku, name, description, category_id, price, cost, unit, barcode, taxable, image_url)
    VALUES (${sku??null}, ${name}, ${description??null}, ${category_id??null}, ${price}, ${cost??null}, ${unit??'each'}, ${barcode??null}, ${taxable??true}, ${image_url??null})
    RETURNING *`;
  await sql`INSERT INTO retail_inventory (product_id) VALUES (${row.id}) ON CONFLICT (product_id) DO NOTHING`;
  res.status(201).json({ ok: true, product: row });
});
router.get("/products/:id", async (req: Request, res: Response) => {
  const [row] = await sql`SELECT p.*, c.name AS category_name,
    COALESCE(i.qty_on_hand, 0) AS qty_on_hand FROM retail_products p
    LEFT JOIN retail_categories c ON c.id = p.category_id
    LEFT JOIN retail_inventory i ON i.product_id = p.id
    WHERE p.id = ${req.params.id}`;
  if (!row) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ ok: true, product: row });
});
router.put("/products/:id", requireAuth, async (req: Request, res: Response) => {
  const { name, description, price, cost, status, barcode } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE retail_products SET
    name = COALESCE(${name??null}, name),
    description = COALESCE(${description??null}, description),
    price = COALESCE(${price??null}, price),
    cost = COALESCE(${cost??null}, cost),
    status = COALESCE(${status??null}, status),
    barcode = COALESCE(${barcode??null}, barcode)
    WHERE id = ${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ ok: true, product: row });
});
router.delete("/products/:id", requireAuth, async (req: Request, res: Response) => {
  await sql`DELETE FROM retail_products WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

// ── INVENTORY ─────────────────────────────────────────────────────────────────
router.get("/inventory", async (req: Request, res: Response) => {
  const { low_stock } = req.query as Record<string,string>;
  const rows = await sql`SELECT i.*, p.name AS product_name, p.sku, p.barcode FROM retail_inventory i
    JOIN retail_products p ON p.id = i.product_id
    WHERE (${low_stock || null}::text IS NULL OR i.qty_on_hand <= i.reorder_at)
    ORDER BY i.qty_on_hand ASC`;
  res.json({ ok: true, inventory: rows, count: rows.length });
});
router.put("/inventory/:product_id", requireAuth, async (req: Request, res: Response) => {
  const { qty_on_hand, qty_reserved, reorder_at, reorder_qty, location } = req.body as Record<string,unknown>;
  const [row] = await sql`UPDATE retail_inventory SET
    qty_on_hand  = COALESCE(${qty_on_hand??null}, qty_on_hand),
    qty_reserved = COALESCE(${qty_reserved??null}, qty_reserved),
    reorder_at   = COALESCE(${reorder_at??null}, reorder_at),
    reorder_qty  = COALESCE(${reorder_qty??null}, reorder_qty),
    location     = COALESCE(${location??null}, location),
    updated_at   = NOW()
    WHERE product_id = ${req.params.product_id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Inventory record not found" }); return; }
  res.json({ ok: true, inventory: row });
});

// ── POS TRANSACTIONS ──────────────────────────────────────────────────────────
router.post("/pos/transaction", requireAuth, async (req: Request, res: Response) => {
  const { cashier, items, payment_method, discount, customer_name, customer_email } = req.body as {
    cashier?: string; items?: { product_id: number; qty: number; price: number }[];
    payment_method?: string; discount?: number; customer_name?: string; customer_email?: string;
  };
  if (!items || items.length === 0) { res.status(400).json({ error: "items are required" }); return; }
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax      = subtotal * 0.08;
  const disc     = Number(discount ?? 0);
  const total    = subtotal + tax - disc;
  const [row] = await sql`INSERT INTO retail_transactions
    (cashier, subtotal, tax, discount, total, payment_method, items, customer_name, customer_email)
    VALUES (${cashier??null}, ${subtotal}, ${tax}, ${disc}, ${total}, ${payment_method??'cash'},
            ${JSON.stringify(items)}, ${customer_name??null}, ${customer_email??null})
    RETURNING *`;
  for (const item of items) {
    await sql`UPDATE retail_inventory SET qty_on_hand = qty_on_hand - ${item.qty}
      WHERE product_id = ${item.product_id}`.catch(() => {});
  }
  res.status(201).json({ ok: true, transaction: row });
});
router.get("/pos/transactions", async (req: Request, res: Response) => {
  const { limit = "50" } = req.query as Record<string,string>;
  const rows = await sql`SELECT * FROM retail_transactions ORDER BY created_at DESC LIMIT ${parseInt(limit)}`;
  res.json({ ok: true, transactions: rows, count: rows.length });
});

// ── PROMOTIONS ────────────────────────────────────────────────────────────────
router.get("/promotions", async (_req: Request, res: Response) => {
  const rows = await sql`SELECT * FROM retail_promotions ORDER BY created_at DESC`;
  res.json({ ok: true, promotions: rows, count: rows.length });
});
router.post("/promotions", requireAuth, async (req: Request, res: Response) => {
  const { name, type, value, code, starts_at, ends_at, min_purchase, applies_to } = req.body as Record<string,unknown>;
  if (!name || value === undefined) { res.status(400).json({ error: "name and value required" }); return; }
  const [row] = await sql`INSERT INTO retail_promotions (name, type, value, code, starts_at, ends_at, min_purchase, applies_to)
    VALUES (${name}, ${type??'percentage'}, ${value}, ${code??null}, ${starts_at??null}, ${ends_at??null}, ${min_purchase??null}, ${applies_to??'all'})
    RETURNING *`;
  res.status(201).json({ ok: true, promotion: row });
});
router.put("/promotions/:id/toggle", requireAuth, async (req: Request, res: Response) => {
  const [row] = await sql`UPDATE retail_promotions SET status = CASE WHEN status='active' THEN 'inactive' ELSE 'active' END
    WHERE id = ${req.params.id} RETURNING *`;
  if (!row) { res.status(404).json({ error: "Promotion not found" }); return; }
  res.json({ ok: true, promotion: row });
});

// ── STATS ─────────────────────────────────────────────────────────────────────
router.get("/stats", async (_req: Request, res: Response) => {
  const [prod, txn, rev, low] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM retail_products WHERE status='active'`,
    sql`SELECT COUNT(*)::int AS n FROM retail_transactions WHERE created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COALESCE(SUM(total),0)::numeric AS r FROM retail_transactions WHERE created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*)::int AS n FROM retail_inventory WHERE qty_on_hand <= reorder_at`,
  ]);
  res.json({ ok: true, activeProducts: prod[0]?.n, transactionsLast30d: txn[0]?.n,
    revenueLast30d: rev[0]?.r, lowStockAlerts: low[0]?.n });
});

export default router;
