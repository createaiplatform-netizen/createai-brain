/**
 * bridge/types.ts — Universal Bridge Engine — Shared Types
 *
 * BridgeRequest  — neutral format sent by internal engines
 * BridgeResponse — consistent response from any connector
 *
 * Internal engines never import connector code directly.
 * They only import these types and universalBridgeEngine.ts.
 *
 * To add a new connector:
 *   1. Add new action types to BridgeActionType (e.g. "CRM_CREATE_CONTACT")
 *   2. Add new key to BridgeConnectorKey (e.g. "crm")
 *   3. Create connectors/crmConnector.ts
 *   4. Register in bridgeRegistry.ts
 *   No other files need to change.
 */

// ─── Action Types ─────────────────────────────────────────────────────────────

export type BridgeActionType =
  // Payments (Stripe)
  | "PAYMENT_CREATE_CHECKOUT"
  | "PAYMENT_TRIGGER_PAYOUT"
  | "PAYMENT_GET_BALANCE"
  | "PAYMENT_CREATE_CUSTOMER"
  | "PAYMENT_CREATE_SUBSCRIPTION"
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
  | "MARKETPLACE_GET_ORDERS"
  // Identity (OAuth / SSO / OIDC)
  | "IDENTITY_AUTHORIZE"
  | "IDENTITY_EXCHANGE_TOKEN"
  | "IDENTITY_VERIFY_TOKEN"
  | "IDENTITY_CREATE_SESSION"
  | "IDENTITY_REVOKE_TOKEN"
  // Webhooks (outbound event dispatch + signature verification)
  | "WEBHOOK_DISPATCH"
  | "WEBHOOK_VERIFY_SIGNATURE"
  | "WEBHOOK_SUBSCRIBE";

export type BridgeConnectorKey =
  | "payments"
  | "ads"
  | "sms"
  | "email"
  | "marketplace"
  | "identity"
  | "webhook";

export type BridgeStatus = "SUCCESS" | "FAILURE" | "NOT_CONFIGURED";

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

// ─── Registry types ───────────────────────────────────────────────────────────

export type ConnectorHandler = (req: BridgeRequest) => Promise<BridgeResponse>;

export interface ConnectorRegistration {
  key:          BridgeConnectorKey;
  label:        string;
  status:       "ACTIVE" | "NOT_CONFIGURED";
  note?:        string;
  activateWith: string[];
  handlers:     Map<BridgeActionType, ConnectorHandler>;
}
