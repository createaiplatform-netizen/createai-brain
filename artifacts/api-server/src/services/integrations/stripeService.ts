/**
 * services/integrations/stripeService.ts
 * ----------------------------------------
 * Real Stripe operations — uses Replit connector for credentials.
 * No API key parameters. No caching. Every call gets a fresh client.
 *
 * Integration: Stripe connector (ccfg_stripe_01K611P4YQR0SZM11XFRQJC44Y)
 */

import type Stripe from "stripe";
import { getUncachableStripeClient } from "./stripeClient.js";

export const STRIPE_META = {
  provider: "stripe",
  tier:     "real",
  isReal:   true,
} as const;

// ─── Customers ────────────────────────────────────────────────────────────────

export async function createCustomer(name: string, email: string): Promise<Stripe.Customer> {
  const stripe = await getUncachableStripeClient();
  return stripe.customers.create({ name, email });
}

export async function listCustomers(): Promise<Stripe.Customer[]> {
  const stripe = await getUncachableStripeClient();
  const result = await stripe.customers.list({ limit: 20 });
  return result.data as Stripe.Customer[];
}

// ─── PaymentIntents ───────────────────────────────────────────────────────────

export async function createPaymentIntent(
  amount:   number,
  currency: string = "usd",
): Promise<Stripe.PaymentIntent> {
  const stripe = await getUncachableStripeClient();
  return stripe.paymentIntents.create({
    amount,
    currency,
    automatic_payment_methods: { enabled: true },
  });
}

export async function listPayments(): Promise<Stripe.PaymentIntent[]> {
  const stripe = await getUncachableStripeClient();
  const result = await stripe.paymentIntents.list({ limit: 20 });
  return result.data;
}

// ─── Balance ──────────────────────────────────────────────────────────────────

export async function getBalance(): Promise<Stripe.Balance> {
  const stripe = await getUncachableStripeClient();
  return stripe.balance.retrieve();
}
