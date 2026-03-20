/**
 * assetGenerator.ts — generateProductAssets(product)
 * Spec: zeroTouchSuperLaunch (Pasted--ZERO-TOUCH...)
 *
 * Generates rich, market-ready assets for each AI product:
 *   - tagline:       punchy one-liner
 *   - keyBenefits:   3 value propositions
 *   - tags:          SEO + marketplace tags
 *   - seoTitle:      optimized page title
 *   - callToAction:  CTA button copy
 *   - marketingBlurb: short paragraph for listings
 *
 * No external API calls — template engine generates deterministic,
 * high-quality copy from niche and price context.
 */

import type { MarketProduct } from "./realMarket.js";

export interface ProductAssets {
  tagline:        string;
  keyBenefits:    string[];
  tags:           string[];
  seoTitle:       string;
  callToAction:   string;
  marketingBlurb: string;
}

// ─── Template Libraries ──────────────────────────────────────────────────────

const TAGLINES = [
  (niche: string) => `The AI that does ${niche} for you — automatically.`,
  (niche: string) => `${niche}: smarter, faster, and fully automated.`,
  (niche: string) => `Unlock the power of AI for ${niche} in seconds.`,
  (niche: string) => `Your 24/7 autonomous ${niche} engine.`,
  (niche: string) => `${niche} without the manual work. Ever.`,
  (niche: string) => `The zero-touch ${niche} solution you've been waiting for.`,
];

const BENEFITS = [
  (niche: string) => [
    `Save 10+ hours per week on ${niche} tasks`,
    `AI-generated outputs that match professional quality`,
    `Runs continuously with zero manual input required`,
  ],
  (niche: string) => [
    `Fully automated ${niche} workflow, end to end`,
    `Built on cutting-edge AI models — always improving`,
    `Start in minutes, scale to any volume instantly`,
  ],
  (niche: string) => [
    `Handles 100% of your ${niche} pipeline autonomously`,
    `Smart optimization engine adapts to your results`,
    `Integrates with your existing tools seamlessly`,
  ],
];

const CTAS = [
  "Get Started Now",
  "Launch Your AI",
  "Start Automating",
  "Claim Your Access",
  "Activate AI Mode",
  "Deploy Instantly",
];

// ─── Generator ───────────────────────────────────────────────────────────────

export async function generateProductAssets(product: MarketProduct): Promise<ProductAssets> {
  const { niche, name, price } = product;

  // Deterministic selection based on product ID hash
  const hash = product.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const taglineFn  = TAGLINES[hash % TAGLINES.length]!;
  const benefitsFn = BENEFITS[hash % BENEFITS.length]!;
  const cta        = CTAS[hash % CTAS.length]!;

  const tagline     = taglineFn(niche);
  const keyBenefits = benefitsFn(niche);

  const tags = [
    niche.toLowerCase().replace(/\s+/g, "-"),
    "ai-automation",
    "no-code",
    "productivity",
    "createai",
    `${price < 20 ? "affordable" : price < 30 ? "mid-tier" : "premium"}`,
    niche.split(" ")[0]?.toLowerCase() ?? "ai",
  ];

  const seoTitle = `${name} | AI-Powered ${niche} Tool — CreateAI Brain`;

  const marketingBlurb =
    `${tagline} Our ${name} uses advanced AI to handle every aspect of ${niche} ` +
    `automatically — so you can focus on what matters. ${keyBenefits[0]}. ` +
    `No setup required, no expertise needed. Just results.`;

  return { tagline, keyBenefits, tags, seoTitle, callToAction: cta, marketingBlurb };
}
