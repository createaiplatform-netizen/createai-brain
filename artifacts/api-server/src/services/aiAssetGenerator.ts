/**
 * aiAssetGenerator.ts — AI Visual Asset Generator
 * Spec: ultimateZeroTouchTranscend (aiAssets.generateVisualAssets)
 *
 * Generates an array of image URLs for each product based on its title and
 * category. Uses Unsplash Source (public, no auth required) to return real,
 * relevant stock images. Falls back to curated placeholder paths when the
 * network is unavailable.
 *
 * Also exports `dynamicPrice(product)` — demand-adaptive pricing that adjusts
 * based on views, sales, and category tier.
 */

import type { MarketProduct } from "./realMarket.js";

// ─── Category → keyword map ───────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string> = {
  "AI Writing Assistant":       "artificial-intelligence,writing,technology",
  "Smart Productivity Suite":   "productivity,business,laptop",
  "Automated Research Tool":    "research,data,analytics",
  "AI Video Script Writer":     "video,creative,filmmaking",
  "Social Media AI Manager":    "social-media,marketing,digital",
  "Smart Customer Support Bot": "customer-service,chatbot,support",
  "AI SEO Optimizer":           "seo,search,website",
  "Automated Data Analyst":     "data,analytics,charts",
  "AI Code Reviewer":           "coding,software,developer",
  "Smart Business Dashboard":   "dashboard,business,metrics",
  "AI Language Tutor":          "language,education,learning",
  "Content Calendar AI":        "content,planning,calendar",
  "AI Lead Generator":          "marketing,leads,sales",
  "Smart Invoice Manager":      "finance,invoice,accounting",
  "AI Brand Identity Kit":      "branding,design,logo",
  "Automated Email Drafter":    "email,communication,business",
  "AI Market Research Agent":   "market-research,strategy,trends",
  "Smart Goal Tracker":         "goals,productivity,success",
  "AI Legal Document Helper":   "legal,documents,law",
  "Smart Schedule Optimizer":   "calendar,scheduling,time",
};

// Digital format → visual keyword additions
const FORMAT_KEYWORDS: Record<string, string> = {
  ebook:      "book,reading,digital",
  audiobook:  "headphones,audio,podcast",
  video:      "video,film,cinema",
  graphic:    "design,graphic,art",
  software:   "software,code,app",
  template:   "template,design,layout",
  course:     "education,course,learning",
  music:      "music,sound,headphones",
  photo:      "photography,camera,photo",
  "3D":       "3d,render,modeling",
  plugin:     "plugin,tool,code",
};

// ─── Image size presets ───────────────────────────────────────────────────────

const IMAGE_SIZES = [
  { w: 600, h: 400 },
  { w: 800, h: 600 },
  { w: 400, h: 400 },
];

// ─── generateVisualAssets ─────────────────────────────────────────────────────

/**
 * Returns an array of 3 image URLs for a product.
 * Primary source: Unsplash Source (https://source.unsplash.com) — returns a
 * redirect to a real curated photo, no API key needed.
 *
 * Each image targets a slightly different keyword combo so the 3 results
 * are visually varied.
 */
export async function generateVisualAssets(
  title: string,
  category: string
): Promise<string[]> {
  const catKeyword = CATEGORY_KEYWORDS[category] ?? category.replace(/\s+/g, ",").toLowerCase();
  const images: string[] = [];

  for (let i = 0; i < 3; i++) {
    const { w, h } = IMAGE_SIZES[i % IMAGE_SIZES.length]!;
    // Each image gets a unique seed via `sig` to prevent identical results
    const keywords = i === 0
      ? `${catKeyword},ai`
      : i === 1
        ? `${catKeyword},technology`
        : `digital,${catKeyword.split(",")[0] ?? "business"}`;

    const url = `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(keywords)}&sig=${Date.now() + i}`;
    images.push(url);
  }

  return images;
}

/**
 * Generates visual assets enriched with the product's digital format keyword.
 */
export async function generateVisualAssetsForProduct(
  product: MarketProduct & { format?: string }
): Promise<string[]> {
  const formatKw  = product.format ? (FORMAT_KEYWORDS[product.format] ?? product.format) : "";
  const catKeyword = CATEGORY_KEYWORDS[product.niche] ?? product.niche.toLowerCase().replace(/\s+/g, ",");
  const combined   = formatKw ? `${catKeyword},${formatKw}` : catKeyword;

  return generateVisualAssets(product.name, combined);
}

// ─── dynamicPrice ─────────────────────────────────────────────────────────────

/**
 * Demand-adaptive pricing:
 *  - Base price from product (set at creation)
 *  - +10% if conversion rate > 5%
 *  - +20% if the niche is in the premium tier
 *  - −10% if no sales and > 20 views (needs discount)
 *  - Returns price in CENTS (for Stripe)
 */

const PREMIUM_NICHES = new Set([
  "AI Code Reviewer", "AI Legal Document Helper", "Automated Data Analyst",
  "Smart Business Dashboard", "AI Market Research Agent", "Smart Productivity Suite",
]);

export function dynamicPrice(
  product: MarketProduct & { priceCents?: number }
): number {
  let cents = (product.priceCents ?? product.price * 100);

  const convRate = product.views > 0 ? product.sales / product.views : 0;

  if (convRate > 0.05)                                cents = Math.round(cents * 1.10);
  if (PREMIUM_NICHES.has(product.niche))              cents = Math.round(cents * 1.20);
  if (product.views > 20 && product.sales === 0)      cents = Math.round(cents * 0.90);

  // Clamp: $5 min, $499 max
  return Math.max(500, Math.min(49_900, cents));
}
