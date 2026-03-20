/**
 * services/integrations/stripeService.ts
 * ---------------------------------------
 * Real Stripe integration — official SDK, real API calls, no simulation.
 *
 * All functions accept an apiKey parameter so the caller controls which
 * stored/env key is used. No keys are hardcoded here.
 */

import Stripe from "stripe";

// ─── Truth-system metadata ────────────────────────────────────────────────────

export const STRIPE_META = {
  provider: "stripe",
  tier:     "real",
  isReal:   true,
} as const;

// ─── Client factory ───────────────────────────────────────────────────────────

export function createStripeClient(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: "2025-01-27.acacia",
    typescript: true,
  });
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Makes a real call to GET /v1/balance with the supplied key.
 * Returns true only when Stripe accepts the key (200 OK).
 */
export async function validateStripeKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  if (!apiKey.startsWith("sk_")) {
    return { ok: false, error: "Key must start with sk_test_ or sk_live_" };
  }
  try {
    const stripe = createStripeClient(apiKey);
    await stripe.balance.retrieve();
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message };
  }
}

// ─── Core operations ──────────────────────────────────────────────────────────

/**
 * Create a Stripe Customer.
 * Real API call → POST https://api.stripe.com/v1/customers
 */
export async function createCustomer(
  apiKey: string,
  name:   string,
  email:  string,
): Promise<Stripe.Customer> {
  const stripe = createStripeClient(apiKey);
  return stripe.customers.create({ name, email });
}

/**
 * Create a PaymentIntent.
 * amount is in the smallest currency unit (cents for USD).
 * Real API call → POST https://api.stripe.com/v1/payment_intents
 */
export async function createPaymentIntent(
  apiKey:   string,
  amount:   number,
  currency: string = "usd",
): Promise<Stripe.PaymentIntent> {
  const stripe = createStripeClient(apiKey);
  return stripe.paymentIntents.create({
    amount,
    currency,
    automatic_payment_methods: { enabled: true },
  });
}

/**
 * List recent PaymentIntents (up to 20).
 * Real API call → GET https://api.stripe.com/v1/payment_intents
 */
export async function listPayments(apiKey: string): Promise<Stripe.PaymentIntent[]> {
  const stripe = createStripeClient(apiKey);
  const result = await stripe.paymentIntents.list({ limit: 20 });
  return result.data;
}

/**
 * List recent Customers (up to 20).
 * Real API call → GET https://api.stripe.com/v1/customers
 */
export async function listCustomers(apiKey: string): Promise<Stripe.Customer[]> {
  const stripe = createStripeClient(apiKey);
  const result = await stripe.customers.list({ limit: 20 });
  return result.data as Stripe.Customer[];
}
