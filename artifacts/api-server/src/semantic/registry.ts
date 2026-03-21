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

function extractFormat(name: string, meta: Record<string, string>): string {
  if (meta["format"]) return meta["format"];
  const match = name.match(/\(([^)]+)\)$/);
  if (match) return match[1];
  return "digital";
}

function extractTags(meta: Record<string, string>, title: string): string[] {
  if (meta["tags"]) return meta["tags"].split(",").map(t => t.trim()).filter(Boolean);
  const words = title.toLowerCase().split(/\s+/);
  return words.filter(w => w.length > 3).slice(0, 5);
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
    tags: extractTags(meta, title),
    category: meta["category"] || "Digital Products",
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
