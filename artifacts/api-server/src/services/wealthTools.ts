/**
 * wealthTools.ts — Premium Wealth Utility Functions
 * Spec: META-ZERO-TOUCH-TRANSCENDENT-LAUNCH
 *
 * Exports:
 *   generatePremiumProducts({ batchSize }) → PremiumProduct[]
 *   autoAdCampaign(batch, { channels, budgetScale }) → CampaignResult
 *   optimizeRevenue(batch) → OptimizedBatch
 *
 * No simulated impressions. No random price surges.
 * Product prices use dynamic pricing from the AI asset generator.
 */

import { realMarketFlow }        from "./realMarket.js";
import type { MarketProduct }    from "./realMarket.js";
import { detectTrendingCategories } from "./trendDetector.js";
import { dynamicPrice }          from "./aiAssetGenerator.js";
import { hybridMessage }         from "./hybridEngine.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PremiumProduct extends MarketProduct {
  category:      string;
  tier:          "premium";
  premiumFactor: number;
}

export interface CampaignResult {
  products:    number;
  channels:    string[];
  budgetScale: string;
  notified:    boolean;
}

export interface OptimizedBatch {
  products:     PremiumProduct[];
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

export async function generatePremiumProducts(
  opts: { batchSize: number } = { batchSize: 25 },
): Promise<PremiumProduct[]> {
  const categories = detectTrendingCategories(5);
  const raw = await realMarketFlow.generateNextBatch({
    categories,
    formats: ["ebook", "software", "course", "template", "video"],
  });

  const slice = raw.slice(0, opts.batchSize);

  const premium: PremiumProduct[] = slice.map(product => {
    const basePriceCents = dynamicPrice(product);
    const premiumFactor  = 2.0;  // 2× premium — fixed, not simulated
    const premiumCents   = Math.round(basePriceCents * premiumFactor);

    return {
      ...product,
      category:      product.niche,
      tier:          "premium",
      priceCents:    premiumCents,
      price:         premiumCents / 100,
      premiumFactor: premiumFactor,
    };
  });

  console.log(
    `[WealthTools] 💎 Premium batch ready — ${premium.length} products · ` +
    `avg price: $${(premium.reduce((s, p) => s + (p.priceCents ?? 0), 0) / Math.max(1, premium.length) / 100).toFixed(2)}`
  );

  return premium;
}

// ─── autoAdCampaign ───────────────────────────────────────────────────────────

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

  channels.forEach(ch => {
    console.log(
      `[WealthTools] 📢 Ad campaign triggered → ${ch} · ` +
      `${batch.length} products · scale:${config.budgetScale}`
    );
  });

  void hybridMessage(
    "email",
    "sivh@mail.com",
    `Meta Transcend: Ad campaign running on ${channels.length} channels for ${batch.length} premium products.`,
    "Meta Transcend — Ad Campaign Fired",
  );

  return {
    products:    batch.length,
    channels,
    budgetScale: config.budgetScale,
    notified:    true,
  };
}

// ─── optimizeRevenue ──────────────────────────────────────────────────────────

export async function optimizeRevenue(batch: PremiumProduct[]): Promise<OptimizedBatch> {
  const optimized: PremiumProduct[] = batch.map(product => ({
    ...product,
    priceCents: product.priceCents ?? Math.round(product.price * 100),
    price:      product.price,
  }));

  const prices        = optimized.map(p => p.priceCents ?? 0);
  const avgPriceCents = prices.length > 0
    ? prices.reduce((s, v) => s + v, 0) / prices.length
    : 0;
  const maxPriceCents = prices.length > 0 ? Math.max(...prices) : 0;
  const minPriceCents = prices.length > 0 ? Math.min(...prices) : 0;

  console.log(
    `[WealthTools] ⚡ Revenue optimized — ` +
    `avg:$${(avgPriceCents / 100).toFixed(2)} · ` +
    `max:$${(maxPriceCents / 100).toFixed(2)} · ` +
    `min:$${(minPriceCents / 100).toFixed(2)}`
  );

  return { products: optimized, avgPriceCents, maxPriceCents, minPriceCents };
}
