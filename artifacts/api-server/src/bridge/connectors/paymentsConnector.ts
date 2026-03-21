/**
 * bridge/connectors/paymentsConnector.ts — Payments Connector (Stripe)
 *
 * The ONLY file that directly calls the Stripe API on behalf of the bridge.
 * All internal engines must go through universalBridgeEngine.ts, not this file.
 *
 * Functions:
 *   createCheckoutSession(request) — Stripe PaymentIntent
 *   triggerPayout(request)        — Stripe Payout to bank
 *   getBalance(request)           — Stripe Balance retrieve
 *
 * Status: ACTIVE (Stripe connector via Replit — test mode)
 * To go live: replace test key with sk_live_* and enroll in Stripe Connect
 */

import { getUncachableStripeClient } from "../../services/integrations/stripeClient.js";
import type { BridgeRequest, BridgeResponse, BridgeStatus } from "../types.js";
import { randomUUID }               from "crypto";
import { OWNER_AUTHORIZATION_MANIFEST as _OAM } from "../../security/ownerAuthorizationManifest.js";

// ─── Owner Authorization ───────────────────────────────────────────────────────
console.log(`[Bridge:Payments] 🔐 Owner authorization confirmed — ${_OAM.owner} (${_OAM.ownerId}) · approvesAllConnectors:${_OAM.approvesAllConnectors}`);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ok(action: BridgeRequest["type"], data: Record<string, unknown>): BridgeResponse {
  return {
    requestId:    randomUUID(),
    connectorKey: "payments",
    action,
    status:       "SUCCESS",
    data,
    ts:           new Date().toISOString(),
  };
}

function fail(action: BridgeRequest["type"], error: string): BridgeResponse {
  return {
    requestId:    randomUUID(),
    connectorKey: "payments",
    action,
    status:       "FAILURE",
    error,
    ts:           new Date().toISOString(),
  };
}

// ─── createCheckoutSession ────────────────────────────────────────────────────

export async function createCheckoutSession(req: BridgeRequest): Promise<BridgeResponse> {
  const { amount, currency = "usd", productName = "Product", userId = "", productId = "" } = req.payload as {
    amount:      number;
    currency?:   string;
    productName?: string;
    userId?:     string;
    productId?:  string;
  };

  try {
    const stripe = await getUncachableStripeClient();
    const intent = await stripe.paymentIntents.create({
      amount:   Math.round(amount),
      currency: String(currency),
      metadata: {
        productId:   String(productId),
        productName: String(productName),
        user:        String(userId),
        source:      "universalBridgeEngine",
      },
      automatic_payment_methods: { enabled: true },
    });

    console.log(
      `[Bridge:Payments] ✅ PaymentIntent created — ${intent.id} · ` +
      `$${(amount / 100).toFixed(2)} ${String(currency).toUpperCase()} · user:${userId}`
    );

    return ok(req.type, {
      intentId:     intent.id,
      clientSecret: intent.client_secret ?? "",
      amount,
      currency:     String(currency),
    });

  } catch (err) {
    const msg = (err as Error).message;
    console.warn(`[Bridge:Payments] ⚠️ createCheckoutSession failed — ${msg}`);
    return fail(req.type, msg);
  }
}

// ─── triggerPayout ────────────────────────────────────────────────────────────

export async function triggerPayout(req: BridgeRequest): Promise<BridgeResponse> {
  const {
    amountUsd,
    method = "standard",
    destination = "",
    stripeAccount = "",
    description  = "CreateAI Brain payout",
    metadata     = {},
  } = req.payload as {
    amountUsd:      number;
    method?:        "standard" | "instant";
    destination?:   string;
    stripeAccount?: string;
    description?:   string;
    metadata?:      Record<string, string>;
  };

  try {
    const stripe = await getUncachableStripeClient();

    const params: Parameters<typeof stripe.payouts.create>[0] = {
      amount:               Math.floor(amountUsd * 100),
      currency:             "usd",
      method:               method as "standard" | "instant",
      statement_descriptor: "AI Platform Earnings",
      description,
      metadata: { ...metadata, source: "universalBridgeEngine" },
      ...(destination ? { destination } : {}),
    };

    const options: Parameters<typeof stripe.payouts.create>[1] = stripeAccount
      ? { stripeAccount }
      : {};

    const payout = await stripe.payouts.create(params, options);

    console.log(
      `[Bridge:Payments] ✅ Payout created — ${payout.id} · ` +
      `$${amountUsd.toFixed(2)} · method:${method}`
    );

    return ok(req.type, {
      payoutId:   payout.id,
      amountUsd,
      method,
      status:     payout.status,
      arrivalDate: String(payout.arrival_date),
    });

  } catch (err) {
    const msg = (err as Error).message;
    console.warn(`[Bridge:Payments] ⚠️ triggerPayout failed — ${msg}`);
    return fail(req.type, msg);
  }
}

// ─── getBalance ───────────────────────────────────────────────────────────────

export async function getBalance(req: BridgeRequest): Promise<BridgeResponse> {
  try {
    const stripe  = await getUncachableStripeClient();
    const balance = await stripe.balance.retrieve();

    const available = balance.available.reduce((sum, b) => sum + b.amount, 0);
    const pending   = balance.pending.reduce((sum, b) => sum + b.amount, 0);

    return ok(req.type, {
      availableCents: available,
      pendingCents:   pending,
      availableUsd:   (available / 100).toFixed(2),
      pendingUsd:     (pending   / 100).toFixed(2),
    });

  } catch (err) {
    const msg = (err as Error).message;
    console.warn(`[Bridge:Payments] ⚠️ getBalance failed — ${msg}`);
    return fail(req.type, msg);
  }
}
