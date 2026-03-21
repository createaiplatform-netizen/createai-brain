/**
 * semantic/registry.ts
 * --------------------
 * The Semantic Product Registry.
 *
 * Pulls live products from Stripe and maps them to SemanticProduct objects.
 * Cached in memory with a configurable refresh interval.
 * Products created by the ZeroTouch engine are automatically indexed.
 */

import type { SemanticProduct } from "./types.js";
import { getUncachableStripeClient } from "../services/integrations/stripeClient.js";

let _registry: SemanticProduct[] = [];
let _lastRefresh = 0;
const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// ── Format-based value pricing (display-only "retail" tier vs member price) ──
const FORMAT_VALUE_CENTS: Record<string, number> = {
  software:  4900,
  plugin:    4400,
  course:    4900,
  "3D":      3400,
  video:     2900,
  audiobook: 2400,
  ebook:     1900,
  template:  1700,
  graphic:   1400,
  photo:     1200,
  music:      900,
  digital:   2200,
};

// ── Category mapping from product name keywords ───────────────────────────────
const CATEGORY_KEYWORDS: Array<[string[], string]> = [
  [["writing", "writer", "copy", "blog", "content", "script", "story"], "Writing & Content"],
  [["study", "learn", "training", "education", "course", "tutor", "quiz"], "Education & Training"],
  [["productivity", "organizer", "planner", "schedule", "task", "time", "workflow"], "Productivity"],
  [["business", "finance", "invoice", "budget", "accounting", "sales", "revenue"], "Business & Finance"],
  [["marketing", "social", "brand", "seo", "email", "campaign", "funnel"], "Marketing"],
  [["interview", "resume", "career", "job", "hire", "portfolio"], "Career & HR"],
  [["health", "fitness", "wellness", "meditation", "mental", "diet", "exercise"], "Health & Wellness"],
  [["research", "data", "analysis", "report", "insight", "survey"], "Research & Analytics"],
  [["design", "graphic", "visual", "art", "creative", "photo", "image", "3d"], "Creative & Design"],
  [["music", "audio", "sound", "podcast", "voice", "video", "media"], "Media & Audio"],
  [["code", "software", "plugin", "app", "tool", "tech", "automation", "ai"], "AI & Technology"],
];

function extractCategory(title: string, meta: Record<string, string>): string {
  if (meta["category"] && meta["category"] !== "Digital Products") return meta["category"];
  const lower = title.toLowerCase();
  for (const [keywords, category] of CATEGORY_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return category;
  }
  return "Digital Products";
}

function extractProductFamily(title: string): string {
  // "AI Solution: Smart Life Organizer (ebook)" → "smart-life-organizer"
  const colonPart = title.includes(":") ? title.split(":").slice(1).join(":").trim() : title;
  const withoutFormat = colonPart.replace(/\s*\([^)]+\)\s*$/, "").trim();
  return slugify(withoutFormat);
}

function extractFormat(name: string, meta: Record<string, string>): string {
  if (meta["format"]) return meta["format"];
  const match = name.match(/\(([^)]+)\)$/);
  if (match) return match[1];
  return "digital";
}

function extractTags(meta: Record<string, string>, title: string, format: string, category: string): string[] {
  if (meta["tags"]) return meta["tags"].split(",").map(t => t.trim()).filter(Boolean);
  const family = extractProductFamily(title);
  const lower = title.toLowerCase();
  const tags: string[] = [];
  // product family slug
  if (family && family.length > 2) tags.push(family);
  // format
  if (format && format !== "digital") tags.push(format);
  // category-derived tag
  const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (catSlug && catSlug !== "digital-products") tags.push(catSlug);
  // keyword-derived tags
  const keywordMap: Record<string, string> = {
    "ai": "ai-powered", "automation": "automation", "productivity": "productivity",
    "writing": "writing", "business": "business", "marketing": "marketing",
    "social": "social-media", "finance": "finance", "career": "career",
    "design": "design", "health": "health", "research": "research",
    "training": "training", "music": "music", "video": "video",
  };
  for (const [kw, tag] of Object.entries(keywordMap)) {
    if (lower.includes(kw) && !tags.includes(tag)) { tags.push(tag); if (tags.length >= 6) break; }
  }
  // always include brand
  if (!tags.includes("createai")) tags.push("createai");
  return tags.slice(0, 6);
}

function mapStripeToSemantic(
  product: { id: string; name: string; description: string | null; metadata: Record<string, string>; images: string[]; created: number; updated: number },
  price: { id: string; unit_amount: number | null } | null
): SemanticProduct {
  const meta = product.metadata || {};
  const format = extractFormat(product.name, meta);
  const title = product.name;
  const slug = slugify(title);
  const priceCents = price?.unit_amount ?? 1900;
  const category = extractCategory(title, meta);
  const tags = extractTags(meta, title, format, category);

  // Value price: what this format would retail for normally (display-only)
  const valuePriceCents = FORMAT_VALUE_CENTS[format] ?? FORMAT_VALUE_CENTS["digital"] ?? 2200;

  const description = product.description ||
    `${title} — professionally crafted AI-generated digital product for immediate download and use.`;
  const shortDescription = description.length > 120
    ? description.slice(0, 117) + "…"
    : description;

  return {
    id: product.id,
    slug,
    title,
    description,
    shortDescription,
    priceCents,
    currency: "usd",
    format,
    tags,
    category,
    coverImageUrl: product.images?.[0] || "",
    stripeProductId: product.id,
    stripePriceId: price?.id || "",
    stripePaymentLinkUrl: undefined,
    channels: {
      stripe: price?.id ? "live" : "pending",
      hostedPage: "live",
      shopifyCsv: "ready",
      woocommerceCsv: "ready",
      googleShopping: "ready",
      amazonFeed: "ready",
    },
    views: 0,
    sales: 0,
    revenueCents: 0,
    createdAt: new Date(product.created * 1000).toISOString(),
    updatedAt: new Date(product.updated * 1000).toISOString(),
    // @ts-ignore — extended field for display value pricing
    valuePriceCents,
  };
}

export async function refreshRegistry(): Promise<number> {
  try {
    const stripe = await getUncachableStripeClient();

    // Fetch all prices with their products expanded — single API call pattern
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
    });

    const seen = new Set<string>();
    const semanticProducts: SemanticProduct[] = [];

    for (const price of prices.data) {
      const product = price.product as { id: string; name: string; description: string | null; metadata: Record<string, string>; images: string[]; created: number; updated: number; deleted?: boolean } | null;
      if (!product || product.deleted) continue;
      if (seen.has(product.id)) continue;
      seen.add(product.id);

      semanticProducts.push(mapStripeToSemantic(product, {
        id: price.id,
        unit_amount: price.unit_amount,
      }));
    }

    // Sort by creation date descending (newest first)
    semanticProducts.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    _registry = semanticProducts;
    _lastRefresh = Date.now();
    console.log(`[SemanticLayer] Registry refreshed — ${_registry.length} products indexed`);
    return _registry.length;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SemanticLayer] Registry refresh failed: ${msg}`);
    return _registry.length; // return stale count on failure
  }
}

export async function getRegistry(forceRefresh = false): Promise<SemanticProduct[]> {
  const stale = Date.now() - _lastRefresh > REFRESH_MS;
  if (forceRefresh || stale || _registry.length === 0) {
    await refreshRegistry();
  }
  return _registry;
}

export function getFromRegistry(idOrSlug: string): SemanticProduct | undefined {
  return _registry.find(p => p.id === idOrSlug || p.slug === idOrSlug);
}

export function getRegistrySnapshot(): { count: number; lastRefresh: string; stale: boolean } {
  return {
    count: _registry.length,
    lastRefresh: _lastRefresh ? new Date(_lastRefresh).toISOString() : "never",
    stale: Date.now() - _lastRefresh > REFRESH_MS,
  };
}
