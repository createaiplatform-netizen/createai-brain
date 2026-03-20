/**
 * realMarket.ts — REST API for the Real Market AI engine
 * Spec: realStripeSetup.ts (Pasted-import-Stripe...)
 *
 * GET  /api/real-market/products          — last 20 products (no auth — public store)
 * GET  /api/real-market/stats             — engine stats
 * POST /api/real-market/checkout/:id      — open Stripe checkout for a product
 */

import { Router, type Request, type Response } from "express";
import {
  getProducts,
  getProduct,
  getEngineStats,
  recordView,
  recordSale,
} from "../services/realMarket.js";
import { getUncachableStripeClient } from "../services/integrations/stripeClient.js";

const router = Router();

// ─── GET /products ───────────────────────────────────────────────────────────
router.get("/products", (_req: Request, res: Response) => {
  res.json(getProducts(20));
});

// ─── GET /stats ──────────────────────────────────────────────────────────────
router.get("/stats", (_req: Request, res: Response) => {
  res.json(getEngineStats());
});

// ─── GET /product/:id ────────────────────────────────────────────────────────
router.get("/product/:id", (req: Request, res: Response) => {
  const product = getProduct(req.params["id"] ?? "");
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  recordView(product.id);
  res.json(product);
});

// ─── POST /checkout/:id ──────────────────────────────────────────────────────
// Creates a real Stripe Checkout session for the product.
// On success, Stripe redirects to /createai-digital?checkout=success.
// On cancel, redirects to /createai-digital?checkout=cancel.
router.post("/checkout/:id", async (req: Request, res: Response) => {
  const product = getProduct(req.params["id"] ?? "");
  if (!product) { res.status(404).json({ ok: false, error: "Product not found" }); return; }

  try {
    recordView(product.id); // count the checkout attempt as a view

    const stripe = await getUncachableStripeClient();

    const domain = process.env["REPLIT_DEV_DOMAIN"]
      ? `https://${process.env["REPLIT_DEV_DOMAIN"]}`
      : "https://createai.repl.co";

    const session = await stripe.checkout.sessions.create({
      mode:                 "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency:     "usd",
          product_data: {
            name:        product.name,
            description: product.description,
          },
          unit_amount: product.price * 100, // dollars → cents
        },
        quantity: 1,
      }],
      success_url: `${domain}/createai-brain/real-market?checkout=success&pid=${product.id}`,
      cancel_url:  `${domain}/createai-brain/real-market?checkout=cancel`,
      metadata: {
        productId: product.id,
        niche:     product.niche,
        source:    "createai-real-market",
      },
    });

    console.log(
      `[RealMarket] Checkout session for "${product.name}" · ` +
      `$${product.price} · ${session.id}`
    );

    res.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[RealMarket] Checkout error:", (err as Error).message);
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /sale/:id ──────────────────────────────────────────────────────────
// Called by a Stripe webhook or from the success redirect to record a sale.
router.post("/sale/:id", (req: Request, res: Response) => {
  const product = getProduct(req.params["id"] ?? "");
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  recordSale(product.id);
  res.json({ ok: true, sales: product.sales });
});

export default router;
