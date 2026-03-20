/**
 * bridge/types.ts — Universal Bridge Engine — Shared Types
 *
 * BridgeRequest  — neutral format sent by internal engines
 * BridgeResponse — consistent response from any connector
 *
 * Internal engines never import connector code directly.
 * They only import these types and universalBridgeEngine.ts.
 */

// ─── Action Types ─────────────────────────────────────────────────────────────

export type BridgeActionType =
  // Payments (Stripe)
  | "PAYMENT_CREATE_CHECKOUT"
  | "PAYMENT_TRIGGER_PAYOUT"
  | "PAYMENT_GET_BALANCE"
  // Ads (Meta / Google / TikTok)
  | "ADS_CREATE_CAMPAIGN"
  | "ADS_PAUSE_CAMPAIGN"
  | "ADS_GET_STATS"
  // SMS (Twilio)
  | "SMS_SEND"
  | "SMS_GET_DELIVERY_STATUS"
  // Email (Resend / SendGrid / Mailgun)
  | "EMAIL_SEND"
  | "EMAIL_GET_STATUS"
  // Marketplace (Shopify / Etsy / Amazon / eBay / WooCommerce / CreativeMarket)
  | "MARKETPLACE_PUBLISH_PRODUCT"
  | "MARKETPLACE_UPDATE_INVENTORY"
  | "MARKETPLACE_GET_ORDERS";

export type BridgeConnectorKey = "payments" | "ads" | "sms" | "email" | "marketplace";
export type BridgeStatus       = "SUCCESS" | "FAILURE" | "NOT_CONFIGURED";

// ─── Request ──────────────────────────────────────────────────────────────────

export interface BridgeRequest {
  type:      BridgeActionType;
  payload:   Record<string, unknown>;
  metadata?: {
    source:      string;      // which internal engine sent this (e.g. "hybridEngine")
    userId?:     string;
    sessionId?:  string;
    ts:          string;      // ISO timestamp
  };
}

// ─── Response ─────────────────────────────────────────────────────────────────

export interface BridgeResponse {
  requestId:    string;
  connectorKey: BridgeConnectorKey;
  action:       BridgeActionType;
  status:       BridgeStatus;
  data?:        Record<string, unknown>;
  error?:       string;
  ts:           string;
}

// ─── History entry (stored in the bridge engine) ─────────────────────────────

export interface BridgeHistoryEntry extends BridgeResponse {
  request: BridgeRequest;
}
