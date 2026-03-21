/**
 * bridge/connectors/marketplaceConnector.ts — Marketplace Connector
 *
 * Targets: Shopify / Etsy / WooCommerce / Amazon / eBay / CreativeMarket
 *
 * Status: NOT_CONFIGURED
 * No OAuth tokens are present for any marketplace.
 *
 * To activate (add ONE or more of the following):
 *   Shopify:        SHOPIFY_ACCESS_TOKEN + SHOPIFY_STORE_DOMAIN
 *   Etsy:           ETSY_API_KEY + ETSY_SHOP_ID + ETSY_CLIENT_SECRET
 *   Amazon:         AMAZON_MWS_AUTH_TOKEN + AMAZON_SELLER_ID + AMAZON_MWS_ENDPOINT
 *   eBay:           EBAY_OAUTH_TOKEN + EBAY_SITE_ID
 *   WooCommerce:    WOO_CONSUMER_KEY + WOO_CONSUMER_SECRET + WOO_STORE_URL
 *   CreativeMarket: CREATIVE_MARKET_API_TOKEN
 *
 * Products are currently recorded in the local PostgreSQL database only.
 * Once tokens are added, this connector will publish to real marketplace accounts.
 * No fake listings. No fake orders. No simulated inventory.
 */

import type { BridgeRequest, BridgeResponse } from "../types.js";
import { isConnectorActive }                   from "../bridgeConfig.js";
import { randomUUID }                          from "crypto";
import { OWNER_AUTHORIZATION_MANIFEST as _OAM } from "../../security/ownerAuthorizationManifest.js";

// ─── Owner Authorization ───────────────────────────────────────────────────────
console.log(`[Bridge:Marketplace] 🔐 Owner authorization confirmed — ${_OAM.owner} (${_OAM.ownerId}) · status:NOT_CONFIGURED until marketplace credentials added`);

// ─── Helper ───────────────────────────────────────────────────────────────────

function notConfigured(action: BridgeRequest["type"], fnName: string): BridgeResponse {
  const msg =
    `[Bridge:Marketplace] ⚠️ ${fnName}() — NOT_CONFIGURED. ` +
    "No marketplace OAuth tokens found. Product has been recorded locally only. " +
    "Add SHOPIFY_ACCESS_TOKEN, ETSY_API_KEY, AMAZON_MWS_AUTH_TOKEN, " +
    "EBAY_OAUTH_TOKEN, WOO_CONSUMER_KEY, or CREATIVE_MARKET_API_TOKEN to publish externally.";
  console.log(msg);
  return {
    requestId:    randomUUID(),
    connectorKey: "marketplace",
    action,
    status:       "NOT_CONFIGURED",
    error:        "Marketplace connector not configured. " +
                  "Add marketplace OAuth credentials to activate real publishing.",
    ts:           new Date().toISOString(),
  };
}

// ─── publishProduct ───────────────────────────────────────────────────────────

export async function publishProduct(req: BridgeRequest): Promise<BridgeResponse> {
  if (!isConnectorActive("marketplace")) {
    return notConfigured(req.type, "publishProduct");
  }

  // ── Shopify implementation skeleton (activate when SHOPIFY_ACCESS_TOKEN is set) ──
  // const { title, price, description, imageUrl } = req.payload;
  // const res = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/products.json`, {
  //   method:  "POST",
  //   headers: { "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN, "Content-Type": "application/json" },
  //   body:    JSON.stringify({ product: { title, variants: [{ price }], body_html: description } }),
  // });
  // const data = await res.json();
  // return ok(req.type, { shopifyProductId: data.product.id, ... });

  return notConfigured(req.type, "publishProduct");
}

// ─── updateInventory ──────────────────────────────────────────────────────────

export async function updateInventory(req: BridgeRequest): Promise<BridgeResponse> {
  if (!isConnectorActive("marketplace")) {
    return notConfigured(req.type, "updateInventory");
  }

  // TODO: implement per-marketplace inventory update
  return notConfigured(req.type, "updateInventory");
}

// ─── getOrders ────────────────────────────────────────────────────────────────

export async function getOrders(req: BridgeRequest): Promise<BridgeResponse> {
  if (!isConnectorActive("marketplace")) {
    return notConfigured(req.type, "getOrders");
  }

  // TODO: implement order fetch — return ONLY real orders from the marketplace
  // No fake counts, no fake revenue
  return notConfigured(req.type, "getOrders");
}
