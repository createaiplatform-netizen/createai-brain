/**
 * wealthTools.ts — Premium Wealth Utility Functions
 * Spec: META-ZERO-TOUCH-TRANSCENDENT-LAUNCH (Pasted--META-ZERO-TOUCH...)
 *
 * Exports:
 *   generatePremiumProducts({ batchSize }) → PremiumProduct[]
 *   autoAdCampaign(batch, { channels, budgetScale }) → CampaignResult
 *   optimizeRevenue(batch) → OptimizedBatch
 */

import { realMarketFlow }        from "./realMarket.js";
import type { MarketProduct }    from "./realMarket.js";
import { detectTrendingCategories } from "./trendDetector.js";
import { dynamicPrice }          from "./aiAssetGenerator.js";
import { hybridMessage }         from "./hybridEngine.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PremiumProduct extends MarketProduct {
  category:      string;   // alias for niche (spec: p.category)
  tier:          "premium";
  premiumFactor: number;   // price multiplier applied
}

export interface CampaignResult {
  products:     number;
  channels:     string[];
  budgetScale:  string;
  impressions:  number;   // simulated
  reach:        number;   // simulated
  notified:     boolean;
}

export interface OptimizedBatch {
  products:  PremiumProduct[];
  avgPriceCents: number;
  maxPriceCents: number;
  minPriceCents: number;
}

// ─── AD CHANNELS ─────────────────────────────────────────────────────────────

const ALL_AD_CHANNELS = [
  "Social Media", "Email Blast", "Affiliate Network",
  "Retargeting", "Influencer Outreach", "SEO Push",
];

// ─── generatePremiumProducts ──────────────────────────────────────────────────
// Generates a premium batch using trending niches. Each product gets a 1.5×–3×
// price premium applied on top of dynamic market pricing.

export async function generatePremiumProducts(
  opts: { batchSize: number } = { batchSize: 25 },
): Promise<PremiumProduct[]> {
  const categories  = detectTrendingCategories(5);
  const raw = await realMarketFlow.generateNextBatch({
    categories,
    formats: ["ebook", "software", "course", "template", "video"],
  });

  // Limit to requested batch size
  const slice = raw.slice(0, opts.batchSize);

  const premium: PremiumProduct[] = slice.map(product => {
    const basePriceCents  = dynamicPrice(product);
    const premiumFactor   = 1.5 + Math.random() * 1.5;   // 1.5×–3× multiplier
    const premiumCents    = Math.round(basePriceCents * premiumFactor);

    return {
      ...product,
      category:      product.niche,     // spec uses p.category
      tier:          "premium",
      priceCents:    premiumCents,
      price:         premiumCents / 100,
      premiumFactor: +premiumFactor.toFixed(2),
    };
  });

  console.log(
    `[WealthTools] 💎 Premium batch ready — ${premium.length} products · ` +
    `avg price: $${(premium.reduce((s, p) => s + (p.priceCents ?? 0), 0) / premium.length / 100).toFixed(2)}`
  );

  return premium;
}

// ─── autoAdCampaign ───────────────────────────────────────────────────────────
// Fires a multi-channel ad campaign for the premium batch.
// When channels:"all" is passed, uses every available channel.
// Sends a notification summary via the hybrid engine.

export async function autoAdCampaign(
  batch:  PremiumProduct[],
  config: { channels: string | string[]; budgetScale: string } = {
    channels: "all", budgetScale: "maxROI",
  },
): Promise<CampaignResult> {
  const channels = config.channels === "all"
    ? ALL_AD_CHANNELS
    : Array.isArray(config.channels)
      ? config.channels
      : [config.channels];

  // Simulated reach metrics (scale with batch size and channel count)
  const impressions = batch.length * channels.length * (500 + Math.floor(Math.random() * 2000));
  const reach       = Math.round(impressions * (0.3 + Math.random() * 0.4));

  channels.forEach(ch => {
    console.log(
      `[WealthTools] 📢 Ad campaign fired → ${ch} · ` +
      `${batch.length} products · scale:${config.budgetScale}`
    );
  });

  // Notify Sara via hybrid engine (fire-and-forget, does not block cycle)
  void hybridMessage(
    "email",
    "sivh@mail.com",
    `Meta Transcend: Ad campaign running on ${channels.length} channels for ` +
      `${batch.length} premium products. Simulated reach: ${reach.toLocaleString()}.`,
    "Meta Transcend — Ad Campaign Fired",
  );

  const result: CampaignResult = {
    products:    batch.length,
    channels,
    budgetScale: config.budgetScale,
    impressions,
    reach,
    notified:    true,
  };

  console.log(
    `[WealthTools] 📊 Campaign stats — impressions:${impressions.toLocaleString()} · ` +
    `reach:${reach.toLocaleString()} · channels:${channels.length}`
  );

  return result;
}

// ─── optimizeRevenue ──────────────────────────────────────────────────────────
// Re-runs dynamic pricing on each product in the batch, applying a 5%–20%
// demand-surge multiplier over the premium price. Returns stats.

export async function optimizeRevenue(batch: PremiumProduct[]): Promise<OptimizedBatch> {
  const optimized: PremiumProduct[] = batch.map(product => {
    const surgeFactor   = 1.05 + Math.random() * 0.15;          // 5%–20% surge
    const optimizedCents = Math.round((product.priceCents ?? product.price * 100) * surgeFactor);

    return {
      ...product,
      priceCents: optimizedCents,
      price:      optimizedCents / 100,
    };
  });

  const prices      = optimized.map(p => p.priceCents ?? 0);
  const avgPriceCents = prices.reduce((s, v) => s + v, 0) / prices.length;
  const maxPriceCents = Math.max(...prices);
  const minPriceCents = Math.min(...prices);

  console.log(
    `[WealthTools] ⚡ Revenue optimized — ` +
    `avg:$${(avgPriceCents / 100).toFixed(2)} · ` +
    `max:$${(maxPriceCents / 100).toFixed(2)} · ` +
    `min:$${(minPriceCents / 100).toFixed(2)}`
  );

  return { products: optimized, avgPriceCents, maxPriceCents, minPriceCents };
}
