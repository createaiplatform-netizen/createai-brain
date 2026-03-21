/**
 * bridge/bridgeConfig.ts — Universal Bridge Engine — Connector Configuration
 *
 * Defines which connectors are ACTIVE vs NOT_CONFIGURED.
 * Reads real environment variables — never invents credentials.
 *
 * To activate a connector:
 *   Payments    — Stripe connector active via Replit (ccfg_stripe_01K611P4YQR0SZM11XFRQJC44Y)
 *   SMS         — Set TWILIO_AUTH_TOKEN + TWILIO_SID + TWILIO_PHONE
 *   Email       — Set RESEND_API_KEY
 *   Ads         — Set META_ACCESS_TOKEN or GOOGLE_ADS_DEVELOPER_TOKEN or TIKTOK_ADS_ACCESS_TOKEN
 *   Marketplace — Set marketplace OAuth tokens (SHOPIFY_ACCESS_TOKEN, ETSY_API_KEY, etc.)
 *   Identity    — Active automatically (Replit Auth OIDC always configured)
 *   Webhook     — Active automatically (outbound HTTP always available)
 */

import type { BridgeConnectorKey } from "./types.js";

export interface ConnectorConfig {
  key:          BridgeConnectorKey;
  label:        string;
  status:       "ACTIVE" | "NOT_CONFIGURED";
  note?:        string;
  activateWith: string[];
}

// ─── Config map ───────────────────────────────────────────────────────────────

export const BRIDGE_CONFIG: Record<BridgeConnectorKey, ConnectorConfig> = {

  payments: {
    key:          "payments",
    label:        "Payments (Stripe)",
    status:       "ACTIVE",
    note:         "Stripe connector active via Replit (ccfg_stripe_01K611P4YQR0SZM11XFRQJC44Y). " +
                  "Currently in TEST MODE. Stripe Connect enrollment required for bank payouts.",
    activateWith: ["STRIPE_SECRET_KEY (sk_live_*)"],
  },

  ads: {
    key:          "ads",
    label:        "Ads (Meta / Google / TikTok)",
    status:       _hasAdsCredentials() ? "ACTIVE" : "NOT_CONFIGURED",
    note:         "No ad credentials detected. Add META_ACCESS_TOKEN, " +
                  "GOOGLE_ADS_DEVELOPER_TOKEN, or TIKTOK_ADS_ACCESS_TOKEN to activate.",
    activateWith: ["META_ACCESS_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN", "TIKTOK_ADS_ACCESS_TOKEN"],
  },

  sms: {
    key:          "sms",
    label:        "SMS (Twilio)",
    status:       _hasTwilioCredentials() ? "ACTIVE" : "NOT_CONFIGURED",
    note:         _hasTwilioCredentials()
                    ? "Twilio credentials present. Phone: +18863304895."
                    : "Set TWILIO_AUTH_TOKEN + TWILIO_SID to activate.",
    activateWith: ["TWILIO_AUTH_TOKEN", "TWILIO_SID", "TWILIO_PHONE"],
  },

  email: {
    key:          "email",
    label:        "Email (Resend)",
    status:       _hasResendCredentials() ? "ACTIVE" : "NOT_CONFIGURED",
    note:         _hasResendCredentials()
                    ? "Resend API key present. Domain verification needed to send beyond sivh@mail.com."
                    : "Set RESEND_API_KEY to activate.",
    activateWith: ["RESEND_API_KEY"],
  },

  marketplace: {
    key:          "marketplace",
    label:        "Marketplace (Shopify / Etsy / Amazon / eBay / WooCommerce)",
    status:       _hasMarketplaceCredentials() ? "ACTIVE" : "NOT_CONFIGURED",
    note:         "No marketplace OAuth tokens detected. " +
                  "Products are recorded locally until credentials are added.",
    activateWith: [
      "SHOPIFY_ACCESS_TOKEN + SHOPIFY_STORE_DOMAIN",
      "ETSY_API_KEY + ETSY_SHOP_ID",
      "AMAZON_MWS_AUTH_TOKEN",
      "EBAY_OAUTH_TOKEN",
      "WOO_CONSUMER_KEY + WOO_CONSUMER_SECRET",
    ],
  },

  identity: {
    key:          "identity",
    label:        "Identity (Replit Auth / OAuth / OIDC)",
    status:       "ACTIVE",
    note:         "Replit OIDC Auth active. Full OAuth 2.0 + PKCE flow configured. " +
                  "Supports session creation, token exchange, and verification.",
    activateWith: [],
  },

  webhook: {
    key:          "webhook",
    label:        "Webhooks (Outbound / Inbound)",
    status:       "ACTIVE",
    note:         "Outbound webhook dispatch always available. " +
                  "Inbound signature verification supported for Stripe, Twilio, and custom HMAC.",
    activateWith: [],
  },

};

// ─── Credential probes ────────────────────────────────────────────────────────

function _hasAdsCredentials(): boolean {
  return !!(
    process.env["META_ACCESS_TOKEN"] ||
    process.env["GOOGLE_ADS_DEVELOPER_TOKEN"] ||
    process.env["TIKTOK_ADS_ACCESS_TOKEN"]
  );
}

function _hasTwilioCredentials(): boolean {
  return !!(process.env["TWILIO_AUTH_TOKEN"] && process.env["TWILIO_SID"]);
}

function _hasResendCredentials(): boolean {
  return !!process.env["RESEND_API_KEY"];
}

function _hasMarketplaceCredentials(): boolean {
  return !!(
    process.env["SHOPIFY_ACCESS_TOKEN"] ||
    process.env["ETSY_API_KEY"] ||
    process.env["AMAZON_MWS_AUTH_TOKEN"] ||
    process.env["EBAY_OAUTH_TOKEN"] ||
    process.env["WOO_CONSUMER_KEY"]
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isConnectorActive(key: BridgeConnectorKey): boolean {
  return BRIDGE_CONFIG[key].status === "ACTIVE";
}

export function getAllConnectorStatuses(): ConnectorConfig[] {
  return Object.values(BRIDGE_CONFIG);
}
