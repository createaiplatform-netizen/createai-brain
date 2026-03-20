/**
 * routes/stripe.ts — Stripe API endpoints
 * ----------------------------------------
 * All keys come from the Replit Stripe connector.
 * No manual key management. Every client is uncachable (fresh per-request).
 *
 * Integration: Stripe connector (ccfg_stripe_01K611P4YQR0SZM11XFRQJC44Y)
 *
 * GET  /api/integrations/stripe/status         — probe live connection
 * GET  /api/integrations/stripe/balance        — fetch Stripe balance
 * POST /api/integrations/stripe/customer       — create a Stripe customer
 * GET  /api/integrations/stripe/customers      — list recent customers
 * POST /api/integrations/stripe/payment-intent — create a PaymentIntent
 * GET  /api/integrations/stripe/payments       — list recent PaymentIntents
 * POST /api/integrations/stripe/checkout       — create a live Checkout session (spec: liveCheckout.ts)
 */

import { Router, type Request, type Response } from "express";
import { probeStripeConnection, getStripePublishableKey, getUncachableStripeClient } from "../services/integrations/stripeClient.js";
import { getFamilyMembers } from "../services/familyAgents.js";
import {
  createCustomer,
  listCustomers,
  createPaymentIntent,
  listPayments,
  getBalance,
  STRIPE_META,
} from "../services/integrations/stripeService.js";

const router = Router();

// ─── GET /status ──────────────────────────────────────────────────────────────
router.get("/status", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const probe = await probeStripeConnection();
    let publishableKey: string | null = null;
    if (probe.ok) {
      try { publishableKey = await getStripePublishableKey(); } catch { /* ignore */ }
    }
    res.json({ ...probe, publishableKey, ...STRIPE_META });
  } catch (err: unknown) {
    res.json({ ok: false, error: (err as Error).message, ...STRIPE_META });
  }
});

// ─── GET /balance ─────────────────────────────────────────────────────────────
router.get("/balance", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const balance = await getBalance();
    res.json({ ok: true, balance, ...STRIPE_META });
  } catch (err: unknown) {
    res.status(400).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /customer ───────────────────────────────────────────────────────────
router.post("/customer", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { name, email } = req.body as { name?: string; email?: string };
  if (!name || !email) {
    res.status(400).json({ ok: false, error: "name and email are required" });
    return;
  }
  try {
    const customer = await createCustomer(name, email);
    res.json({ ok: true, customer, ...STRIPE_META });
  } catch (err: unknown) {
    res.status(400).json({ ok: false, error: (err as Error).message });
  }
});

// ─── GET /customers ───────────────────────────────────────────────────────────
router.get("/customers", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const customers = await listCustomers();
    res.json({ ok: true, customers, count: customers.length, ...STRIPE_META });
  } catch (err: unknown) {
    res.status(400).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /payment-intent ─────────────────────────────────────────────────────
router.post("/payment-intent", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { amount, currency = "usd" } = req.body as { amount?: number; currency?: string };
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ ok: false, error: "amount (in cents, e.g. 1000 = $10.00) is required" });
    return;
  }
  try {
    const intent = await createPaymentIntent(Number(amount), currency);
    res.json({ ok: true, paymentIntent: intent, ...STRIPE_META });
  } catch (err: unknown) {
    res.status(400).json({ ok: false, error: (err as Error).message });
  }
});

// ─── GET /payments ────────────────────────────────────────────────────────────
router.get("/payments", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const payments = await listPayments();
    res.json({ ok: true, payments, count: payments.length, ...STRIPE_META });
  } catch (err: unknown) {
    res.status(400).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /checkout ───────────────────────────────────────────────────────────
// Creates a live Stripe Checkout Session for a FamilyMember.
// Spec: liveCheckout.ts
//
// Body: { memberId?: string, amount?: number, productName?: string }
//   memberId    — FamilyMember UUID; defaults to Sara (first member) if omitted
//   amount      — price in cents (default 1000 = $10.00)
//   productName — line-item label (default "CreateAI Digital Service Access")
//
// Returns: { ok: true, url: "https://checkout.stripe.com/..." }
router.post("/checkout", async (req: Request, res: Response) => {
  const {
    memberId,
    amount      = 1000,
    productName = "CreateAI Digital Service Access",
  } = req.body as { memberId?: string; amount?: number; productName?: string };

  try {
    const stripe  = await getUncachableStripeClient();
    const members = getFamilyMembers();

    // Resolve member — fall back to first member (Sara) if no ID given
    const member = memberId
      ? members.find(m => m.id === memberId)
      : members[0];

    if (!member || !member.stripeCustomerId) {
      res.status(404).json({ ok: false, error: "Stripe customer not found for this member." });
      return;
    }

    // Build success/cancel URLs using the live Replit dev domain
    const domain = process.env["REPLIT_DEV_DOMAIN"]
      ? `https://${process.env["REPLIT_DEV_DOMAIN"]}`
      : "https://createai.repl.co";

    const session = await stripe.checkout.sessions.create({
      mode:                 "payment",
      customer:             member.stripeCustomerId,
      payment_method_types: ["card", "us_bank_account"],
      line_items: [{
        price_data: {
          currency:     "usd",
          product_data: { name: productName },
          unit_amount:  Math.max(50, Math.floor(Number(amount))), // Stripe minimum 50 cents
        },
        quantity: 1,
      }],
      success_url: `${domain}/createai-brain/createai-digital?checkout=success`,
      cancel_url:  `${domain}/createai-brain/createai-digital?checkout=cancel`,
      metadata: {
        memberId:   member.id,
        memberName: member.name,
        source:     "createai-digital",
      },
    });

    console.log(
      `[Checkout] Session created for ${member.name} · ` +
      `$${(Number(amount) / 100).toFixed(2)} · ${session.id}`
    );

    res.json({ ok: true, url: session.url, sessionId: session.id, ...STRIPE_META });
  } catch (err: unknown) {
    console.error("[Checkout] Error:", (err as Error).message);
    res.status(400).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
