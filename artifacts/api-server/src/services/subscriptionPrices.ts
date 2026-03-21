/**
 * services/subscriptionPrices.ts
 * ──────────────────────────────
 * Creates and caches Stripe recurring prices for the three subscription tiers.
 * On first call, creates the Stripe Product + Price if they don't exist in the DB.
 * Subsequent calls return cached values from the platform_stripe_prices table.
 */

import { getUncachableStripeClient } from "./integrations/stripeClient.js";
import { getStripePrices, saveStripePrice } from "../lib/db.js";

export interface TierDefinition {
  id:          string;
  name:        string;
  description: string;
  monthlyUSD:  number;   // cents
}

export const SUBSCRIPTION_TIERS: TierDefinition[] = [
  {
    id:          "solo",
    name:        "CreateAI Brain — Solo",
    description: "Individual operators replacing their core SaaS stack with AI-native capabilities.",
    monthlyUSD:  2900,
  },
  {
    id:          "business",
    name:        "CreateAI Brain — Business",
    description: "Small businesses eliminating their entire SaaS stack with 13 AI-native capabilities.",
    monthlyUSD:  7900,
  },
  {
    id:          "enterprise",
    name:        "CreateAI Brain — Enterprise",
    description: "Multi-location operators with white-label rights and full API access.",
    monthlyUSD:  29900,
  },
];

let _prices: Record<string, { priceId: string; productId: string; amount: number }> | null = null;
let _loading = false;
let _loadPromise: Promise<void> | null = null;

export async function getOrCreateSubscriptionPrices(): Promise<Record<string, { priceId: string; productId: string; amount: number }>> {
  if (_prices) return _prices;
  if (_loadPromise) { await _loadPromise; return _prices ?? {}; }

  _loadPromise = _ensurePrices();
  await _loadPromise;
  return _prices ?? {};
}

async function _ensurePrices(): Promise<void> {
  if (_loading) return;
  _loading = true;
  try {
    // Try to load from DB first
    const stored = await getStripePrices();
    const allTiersPresent = SUBSCRIPTION_TIERS.every(t => stored[t.id]);

    if (allTiersPresent) {
      _prices = stored;
      console.log("[Subscriptions] Loaded prices from DB:", Object.keys(_prices).join(", "));
      return;
    }

    // Create missing tiers in Stripe
    const stripe = await getUncachableStripeClient();
    const result = { ...stored };

    for (const tier of SUBSCRIPTION_TIERS) {
      if (result[tier.id]) continue;

      console.log("[Subscriptions] Creating Stripe product + price for:", tier.id);

      const product = await stripe.products.create({
        name: tier.name,
        description: tier.description,
        metadata: { platform: "createai-brain", tier: tier.id },
      });

      const price = await stripe.prices.create({
        product:    product.id,
        unit_amount: tier.monthlyUSD,
        currency:   "usd",
        recurring:  { interval: "month" },
        metadata:   { platform: "createai-brain", tier: tier.id },
      });

      result[tier.id] = { priceId: price.id, productId: product.id, amount: tier.monthlyUSD };
      await saveStripePrice(tier.id, price.id, product.id, tier.monthlyUSD);
      console.log("[Subscriptions] Created price:", price.id, "for tier:", tier.id);
    }

    _prices = result;
  } catch (err) {
    console.error("[Subscriptions] Failed to ensure prices:", err instanceof Error ? err.message : String(err));
    _prices = {};
  } finally {
    _loading = false;
  }
}

// Force cache refresh (call after webhook events change subscription state)
export function invalidatePriceCache(): void {
  _prices = null;
  _loadPromise = null;
}
