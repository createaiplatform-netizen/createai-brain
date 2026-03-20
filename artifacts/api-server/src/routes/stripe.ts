/**
 * routes/stripe.ts
 * ----------------
 * Real Stripe API endpoints — no simulation, every call goes to stripe.com
 *
 * POST /api/integrations/stripe/connect        — validate + store key
 * GET  /api/integrations/stripe/status         — is key stored + valid?
 * POST /api/integrations/stripe/customer       — create a customer
 * POST /api/integrations/stripe/payment-intent — create a PaymentIntent
 * GET  /api/integrations/stripe/payments       — list recent PaymentIntents
 * GET  /api/integrations/stripe/customers      — list recent Customers
 */

import { Router, type Request, type Response } from "express";
import { saveMemory, loadMemory } from "../services/memoryService.js";
import {
  validateStripeKey,
  createCustomer,
  createPaymentIntent,
  listPayments,
  listCustomers,
  STRIPE_META,
} from "../services/integrations/stripeService.js";

const router = Router();

const KEY_NAME = "integration:stripe:apikey";

/** Resolve the API key: user's stored key → STRIPE_SECRET_KEY env → none */
async function resolveKey(userId: string): Promise<string | null> {
  return (await loadMemory(userId, KEY_NAME)) ?? process.env.STRIPE_SECRET_KEY ?? null;
}

// ─── POST /connect ────────────────────────────────────────────────────────────
router.post("/connect", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { apiKey } = req.body as { apiKey?: string };

  if (!apiKey) {
    res.status(400).json({ ok: false, error: "apiKey is required" });
    return;
  }
  if (!apiKey.startsWith("sk_")) {
    res.status(400).json({
      ok: false,
      error: "Stripe API key must start with sk_test_ (test) or sk_live_ (production)",
    });
    return;
  }

  const validation = await validateStripeKey(apiKey);
  if (!validation.ok) {
    res.status(400).json({ ok: false, error: `Stripe rejected the key: ${validation.error}` });
    return;
  }

  await saveMemory(req.user.id, KEY_NAME, apiKey);
  res.json({
    ok:      true,
    message: "Stripe connected — key validated and stored encrypted",
    mode:    apiKey.startsWith("sk_live_") ? "live" : "test",
    ...STRIPE_META,
  });
});

// ─── GET /status ──────────────────────────────────────────────────────────────
router.get("/status", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const key = await resolveKey(req.user.id);

  if (!key) {
    res.json({ ok: true, connected: false, source: "none", ...STRIPE_META });
    return;
  }

  const validation = await validateStripeKey(key);
  res.json({
    ok:        true,
    connected: validation.ok,
    source:    (await loadMemory(req.user.id, KEY_NAME)) ? "stored" : "env",
    mode:      key.startsWith("sk_live_") ? "live" : "test",
    ...STRIPE_META,
  });
});

// ─── POST /customer ───────────────────────────────────────────────────────────
router.post("/customer", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const key = await resolveKey(req.user.id);
  if (!key) {
    res.status(400).json({ ok: false, error: "Stripe not connected. POST /api/integrations/stripe/connect first." });
    return;
  }

  const { name, email } = req.body as { name?: string; email?: string };
  if (!name || !email) {
    res.status(400).json({ ok: false, error: "name and email are required" });
    return;
  }

  try {
    const customer = await createCustomer(key, name, email);
    res.json({ ok: true, customer, ...STRIPE_META });
  } catch (err: unknown) {
    res.status(400).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /payment-intent ─────────────────────────────────────────────────────
router.post("/payment-intent", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const key = await resolveKey(req.user.id);
  if (!key) {
    res.status(400).json({ ok: false, error: "Stripe not connected. POST /api/integrations/stripe/connect first." });
    return;
  }

  const { amount, currency = "usd" } = req.body as { amount?: number; currency?: string };
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ ok: false, error: "amount (in cents, e.g. 1000 = $10.00) is required" });
    return;
  }

  try {
    const intent = await createPaymentIntent(key, Number(amount), currency);
    res.json({ ok: true, paymentIntent: intent, ...STRIPE_META });
  } catch (err: unknown) {
    res.status(400).json({ ok: false, error: (err as Error).message });
  }
});

// ─── GET /payments ────────────────────────────────────────────────────────────
router.get("/payments", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const key = await resolveKey(req.user.id);
  if (!key) {
    res.status(400).json({ ok: false, error: "Stripe not connected." });
    return;
  }

  try {
    const payments = await listPayments(key);
    res.json({ ok: true, payments, count: payments.length, ...STRIPE_META });
  } catch (err: unknown) {
    res.status(400).json({ ok: false, error: (err as Error).message });
  }
});

// ─── GET /customers ───────────────────────────────────────────────────────────
router.get("/customers", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const key = await resolveKey(req.user.id);
  if (!key) {
    res.status(400).json({ ok: false, error: "Stripe not connected." });
    return;
  }

  try {
    const customers = await listCustomers(key);
    res.json({ ok: true, customers, count: customers.length, ...STRIPE_META });
  } catch (err: unknown) {
    res.status(400).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
