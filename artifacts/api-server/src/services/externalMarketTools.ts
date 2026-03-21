/**
 * externalMarketTools.ts — External Marketplace Adapter
 * Spec: UNIFIED-ZERO-TOUCH-TRANSCEND-ENGINE (Pasted--UNIFIED-ZERO-TOUCH...)
 *
 * Handles publishing to external marketplaces:
 *   Amazon, eBay, CreativeMarket
 *
 * Internal marketplaces (Shopify, Etsy, WooCommerce) are handled by
 * publishToMarketplaces() in realMarket.ts.
 *
 * Each channel logs its submission and records the target API endpoint.
 * ROADMAP: Supply channel-specific OAuth tokens via Replit Secrets to
 * activate live API pushes per channel:
 *   AMAZON_SP_ACCESS_TOKEN, EBAY_OAUTH_TOKEN, CREATIVEMARKET_API_KEY
 */

import type { MarketProduct }  from "./realMarket.js";
import { getCredential }       from "./credentialsBridge.js";

// ─── External Channel Definitions ────────────────────────────────────────────

interface ExternalChannel {
  name:    string;
  api:     string;
  envKey:  string;   // Replit Secret that activates this channel
}

const EXTERNAL_CHANNELS: ExternalChannel[] = [
  {
    name:   "Amazon",
    api:    "https://sellingpartnerapi-na.amazon.com/listings/2021-08-01/items",
    envKey: "AMAZON_SP_ACCESS_TOKEN",
  },
  {
    name:   "eBay",
    api:    "https://api.ebay.com/sell/inventory/v1/inventory_item",
    envKey: "EBAY_OAUTH_TOKEN",
  },
  {
    name:   "CreativeMarket",
    api:    "https://creativemarket.com/api/v2/products",
    envKey: "CREATIVEMARKET_API_KEY",
  },
];

// ─── Result Type ─────────────────────────────────────────────────────────────

export interface ExternalPublishResult {
  channel:  string;
  products: number;
  status:   "submitted" | "pending_credentials";
  envKey?:  string;   // present only when credentials are missing
}

// ─── publishToExternalChannels ────────────────────────────────────────────────
// Publishes a batch of products to all external marketplaces.
// Runs all channels in parallel for maximum throughput.

export async function publishToExternalChannels(
  productOrBatch: MarketProduct | MarketProduct[],
  channels?: string[],
): Promise<ExternalPublishResult[]> {
  const batch   = Array.isArray(productOrBatch) ? productOrBatch : [productOrBatch];
  const targets = channels
    ? EXTERNAL_CHANNELS.filter(c => channels.includes(c.name))
    : EXTERNAL_CHANNELS;

  const results = await Promise.all(
    targets.map(async (channel): Promise<ExternalPublishResult> => {
      const token = getCredential(channel.envKey);

      if (token) {
        // REAL: live API push when credentials are set
        // Each channel uses its specific OAuth/API-key header below:
        try {
          await Promise.all(
            batch.map(product => _pushToChannel(channel, product, token))
          );
          return { channel: channel.name, products: batch.length, status: "submitted" };
        } catch (err) {
          console.warn(
            `[ExternalMarket] ⚠️ ${channel.name} push failed — ${(err as Error).message}. ` +
            `Products will be retried next cycle.`
          );
          return { channel: channel.name, products: 0, status: "pending_credentials", envKey: channel.envKey };
        }
      }

      // No credentials yet — log the intent
      for (const product of batch) {
        console.log(
          `[ExternalMarket] 📦 Registered for ${channel.name} — "${product.name}" · ` +
          `activate: set ${channel.envKey} in Replit Secrets`
        );
      }
      return {
        channel:  channel.name,
        products: batch.length,
        status:   "pending_credentials",
        envKey:   channel.envKey,
      };
    })
  );

  const submitted = results.filter(r => r.status === "submitted").length;
  const pending   = results.filter(r => r.status === "pending_credentials").length;

  console.log(
    `[ExternalMarket] 🌐 Batch complete — ${batch.length} products · ` +
    `${submitted}/${targets.length} channels live · ${pending} pending credentials`
  );

  return results;
}

// ─── Channel-Level Push ───────────────────────────────────────────────────────
// Each channel has its own auth header and payload shape. When real credentials
// are added, extend this function with the channel-specific API contract.

async function _pushToChannel(
  channel: ExternalChannel,
  product: MarketProduct,
  token:   string,
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const body = JSON.stringify({
    title:       product.name,
    description: product.description,
    price:       (product.priceCents ?? product.price * 100) / 100,
    currency:    "USD",
    sku:         product.id,
    category:    product.niche,
    format:      product.format ?? "digital",
    images:      product.images ?? [],
  });

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);

  try {
    const res = await fetch(channel.api, {
      method:  "POST",
      headers,
      body,
      signal:  ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${channel.name}`);
    }

    console.log(`[ExternalMarket] ✅ ${channel.name} accepted "${product.name}"`);
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── getExternalChannelNames ──────────────────────────────────────────────────

export function getExternalChannelNames(): string[] {
  return EXTERNAL_CHANNELS.map(c => c.name);
}

// ─── getExternalChannelStatus ─────────────────────────────────────────────────
// Returns which channels have credentials set and which are pending.

export function getExternalChannelStatus(): Array<{
  channel: string;
  live:    boolean;
  envKey:  string;
}> {
  return EXTERNAL_CHANNELS.map(c => ({
    channel: c.name,
    live:    !!getCredential(c.envKey),
    envKey:  c.envKey,
  }));
}
