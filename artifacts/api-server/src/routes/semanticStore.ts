/**
 * routes/semanticStore.ts
 * -----------------------
 * The Semantic Product Layer — REST API
 *
 * GET  /api/semantic/products               — list all products (JSON)
 * GET  /api/semantic/products/:id           — get one product (JSON)
 * POST /api/semantic/products/refresh       — force registry refresh
 * GET  /api/semantic/signals                — demand signal surface
 * GET  /api/semantic/store                  — hosted store index (HTML)
 * GET  /api/semantic/store/:id              — hosted product page (HTML)
 * GET  /api/semantic/checkout/:id           — Stripe checkout redirect
 * GET  /api/semantic/export/shopify.csv     — Shopify import CSV
 * GET  /api/semantic/export/woocommerce.csv — WooCommerce import CSV
 * GET  /api/semantic/export/google-shopping.xml — Google Shopping feed
 * GET  /api/semantic/export/amazon.txt      — Amazon flat file feed
 * GET  /api/semantic/export/catalog.json   — Platform-native catalog JSON
 * GET  /api/semantic/status                 — registry health check
 */

import { Router, type Request, type Response } from "express";
import {
  getRegistry,
  getFromRegistry,
  refreshRegistry,
  getRegistrySnapshot,
} from "../semantic/registry.js";
import {
  toShopifyCSV,
  toWooCommerceCSV,
  toGoogleShoppingXML,
  toAmazonFeed,
  toHostedPageHTML,
  toStoreIndexHTML,
  deriveDemandSignals,
} from "../semantic/transforms.js";
import { getUncachableStripeClient } from "../services/integrations/stripeClient.js";
import { getCustomerStats } from "../semantic/customerStore.js";
import { trackView, getViewCount, getAllViewCounts } from "../semantic/viewStore.js";

const router = Router();

const STORE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : "http://localhost:8080";

// ── GET /status ───────────────────────────────────────────────────────────────
router.get("/status", (_req: Request, res: Response) => {
  const snap = getRegistrySnapshot();
  res.json({ ok: true, semanticLayer: "active", ...snap });
});

// ── GET /products ─────────────────────────────────────────────────────────────
router.get("/products", async (_req: Request, res: Response) => {
  try {
    const products = await getRegistry();
    const crmStats = getCustomerStats();
    const allViews = getAllViewCounts();
    const productsWithViews = products.map(p => ({
      ...p,
      views: getViewCount(p.id),
    }));
    res.json({
      ok: true,
      count: products.length,
      crmStats,
      views: Object.fromEntries(allViews),
      products: productsWithViews,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /products/:id ─────────────────────────────────────────────────────────
router.get("/products/:id", async (req: Request, res: Response) => {
  try {
    await getRegistry();
    const product = getFromRegistry(String(req.params["id"] ?? ""));
    if (!product) { res.status(404).json({ ok: false, error: "Product not found" }); return; }
    res.json({ ok: true, product });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── POST /products/refresh ────────────────────────────────────────────────────
router.post("/products/refresh", async (_req: Request, res: Response) => {
  try {
    const count = await refreshRegistry();
    const products = await getRegistry(false);
    res.json({ ok: true, message: "Registry refreshed", count, products: products.slice(0, 5) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /signals ──────────────────────────────────────────────────────────────
router.get("/signals", async (_req: Request, res: Response) => {
  try {
    const products = await getRegistry();
    const signals = deriveDemandSignals(products);
    res.json({ ok: true, signals, generatedAt: new Date().toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /store — hosted store index ──────────────────────────────────────────
router.get("/store", async (_req: Request, res: Response) => {
  try {
    const products = await getRegistry();
    const html = toStoreIndexHTML(products, STORE_URL);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).send(`<h1>Store error</h1><pre>${msg}</pre>`);
  }
});

// ── GET /store/:id — individual hosted product page ───────────────────────────
router.get("/store/:id", async (req: Request, res: Response) => {
  try {
    await getRegistry();
    const product = getFromRegistry(String(req.params["id"] ?? ""));
    if (!product) { res.status(404).send("<h1>Product not found</h1>"); return; }
    trackView(product.id);
    const success = req.query["success"] === "1";
    const checkoutUrl = `${STORE_URL}/api/semantic/checkout/${product.id}`;

    // ── Compute related products (tag similarity scoring) ──────────────────
    const allProducts = await getRegistry();
    const productTags = new Set(product.tags);
    const related = allProducts
      .filter(r => r.id !== product.id)
      .map(r => ({
        product: r,
        score: r.tags.filter(t => productTags.has(t)).length
          + (r.format === product.format ? 0.5 : 0)
          + (r.category === product.category ? 1 : 0),
      }))
      .filter(r => r.score >= 1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(r => r.product);

    const html = toHostedPageHTML(product, checkoutUrl, success, related);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).send(`<h1>Page error</h1><pre>${msg}</pre>`);
  }
});

// ── GET /checkout/:id — Stripe checkout session → redirect ────────────────────
router.get("/checkout/:id", async (req: Request, res: Response) => {
  try {
    await getRegistry();
    const product = getFromRegistry(String(req.params["id"] ?? ""));
    if (!product) { res.status(404).json({ ok: false, error: "Product not found" }); return; }
    if (!product.stripePriceId) {
      res.status(400).json({ ok: false, error: "No Stripe price configured for this product" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: product.stripePriceId, quantity: 1 }],
      success_url: `${STORE_URL}/api/semantic/store/${product.id}?success=1`,
      cancel_url: `${STORE_URL}/api/semantic/store/${product.id}`,
      metadata: {
        semanticProductId: product.id,
        productTitle: product.title,
        format: product.format,
        channel: "hosted-page",
      },
    });

    if (session.url) {
      res.redirect(303, session.url);
    } else {
      res.status(500).json({ ok: false, error: "Stripe returned no checkout URL" });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /export/shopify.csv ────────────────────────────────────────────────────
router.get("/export/shopify.csv", async (_req: Request, res: Response) => {
  try {
    const products = await getRegistry();
    const csv = toShopifyCSV(products);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="shopify-products-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /export/woocommerce.csv ───────────────────────────────────────────────
router.get("/export/woocommerce.csv", async (_req: Request, res: Response) => {
  try {
    const products = await getRegistry();
    const csv = toWooCommerceCSV(products);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="woocommerce-products-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /export/google-shopping.xml ──────────────────────────────────────────
router.get("/export/google-shopping.xml", async (_req: Request, res: Response) => {
  try {
    const products = await getRegistry();
    const xml = toGoogleShoppingXML(products, STORE_URL);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="google-shopping-feed-${Date.now()}.xml"`);
    res.send(xml);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /export/amazon.txt ────────────────────────────────────────────────────
router.get("/export/amazon.txt", async (_req: Request, res: Response) => {
  try {
    const products = await getRegistry();
    const feed = toAmazonFeed(products);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="amazon-feed-${Date.now()}.txt"`);
    res.send(feed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /export/catalog.json ──────────────────────────────────────────────────
router.get("/export/catalog.json", async (_req: Request, res: Response) => {
  try {
    const products = await getRegistry();
    res.setHeader("Content-Disposition", `attachment; filename="product-catalog-${Date.now()}.json"`);
    res.json({
      generated: new Date().toISOString(),
      platform: "CreateAI Brain",
      version: "1.0",
      schema: "SemanticProductCatalog",
      count: products.length,
      channels: ["stripe", "hostedPage", "shopifyCsv", "woocommerceCsv", "googleShopping", "amazonFeed"],
      products,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

export default router;
