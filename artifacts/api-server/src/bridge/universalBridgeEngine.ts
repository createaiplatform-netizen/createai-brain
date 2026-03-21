/**
 * universalBridgeEngine.ts — Universal Bridge Engine (Central Router)
 *
 * The ONLY entry point for internal engines to reach external systems.
 * Powered by the BridgeRegistry — auto-scaling, no hardcoded switch statements.
 *
 * Usage (from any internal engine):
 *   import { bridge } from "../bridge/universalBridgeEngine.js";
 *
 *   const response = await bridge.route({
 *     type:    "PAYMENT_CREATE_CHECKOUT",
 *     payload: { amount: 1990, currency: "usd", productName: "AI Ebook" },
 *     metadata: { source: "hybridEngine", ts: new Date().toISOString() },
 *   });
 *
 *   if (response.status === "SUCCESS")       { ... }
 *   if (response.status === "NOT_CONFIGURED"){ ... fall back gracefully ... }
 *   if (response.status === "FAILURE")       { ... log + handle error ... }
 *
 * To add a new connector:
 *   1. Create connectors/myConnector.ts
 *   2. Add entries to _initRegistry() below
 *   3. Add action types to types.ts
 *   4. Done — the engine routes automatically
 */

import { randomUUID }           from "crypto";
import type {
  BridgeRequest,
  BridgeResponse,
  BridgeHistoryEntry,
  BridgeConnectorKey,
}                               from "./types.js";
import { bridgeRegistry }       from "./bridgeRegistry.js";
import { BRIDGE_CONFIG }        from "./bridgeConfig.js";

// ── Connector imports ─────────────────────────────────────────────────────────
import * as Payments    from "./connectors/paymentsConnector.js";
import * as Ads         from "./connectors/adsConnector.js";
import * as SMS         from "./connectors/smsConnector.js";
import * as Email       from "./connectors/emailConnector.js";
import * as Marketplace from "./connectors/marketplaceConnector.js";
import * as Identity    from "./connectors/identityConnector.js";
import * as Webhook     from "./connectors/webhookConnector.js";

// ─── Registry Initialization ──────────────────────────────────────────────────
// All connectors self-register here. Adding a new connector = one new block below.

function _initRegistry(): void {
  bridgeRegistry.register({
    key:          "payments",
    label:        BRIDGE_CONFIG.payments.label,
    status:       BRIDGE_CONFIG.payments.status,
    note:         BRIDGE_CONFIG.payments.note,
    activateWith: BRIDGE_CONFIG.payments.activateWith,
    handlers:     new Map([
      ["PAYMENT_CREATE_CHECKOUT",  Payments.createCheckoutSession],
      ["PAYMENT_TRIGGER_PAYOUT",   Payments.triggerPayout],
      ["PAYMENT_GET_BALANCE",      Payments.getBalance],
      ["PAYMENT_CREATE_CUSTOMER",  Payments.createCheckoutSession],   // alias to checkout
      ["PAYMENT_CREATE_SUBSCRIPTION", Payments.createCheckoutSession], // alias to checkout
    ]),
  });

  bridgeRegistry.register({
    key:          "ads",
    label:        BRIDGE_CONFIG.ads.label,
    status:       BRIDGE_CONFIG.ads.status,
    note:         BRIDGE_CONFIG.ads.note,
    activateWith: BRIDGE_CONFIG.ads.activateWith,
    handlers:     new Map([
      ["ADS_CREATE_CAMPAIGN", Ads.createAdCampaign],
      ["ADS_PAUSE_CAMPAIGN",  Ads.pauseCampaign],
      ["ADS_GET_STATS",       Ads.getCampaignStats],
    ]),
  });

  bridgeRegistry.register({
    key:          "sms",
    label:        BRIDGE_CONFIG.sms.label,
    status:       BRIDGE_CONFIG.sms.status,
    note:         BRIDGE_CONFIG.sms.note,
    activateWith: BRIDGE_CONFIG.sms.activateWith,
    handlers:     new Map([
      ["SMS_SEND",                 SMS.sendSMS],
      ["SMS_GET_DELIVERY_STATUS",  SMS.getDeliveryStatus],
    ]),
  });

  bridgeRegistry.register({
    key:          "email",
    label:        BRIDGE_CONFIG.email.label,
    status:       BRIDGE_CONFIG.email.status,
    note:         BRIDGE_CONFIG.email.note,
    activateWith: BRIDGE_CONFIG.email.activateWith,
    handlers:     new Map([
      ["EMAIL_SEND",        Email.sendEmail],
      ["EMAIL_GET_STATUS",  Email.getEmailStatus],
    ]),
  });

  bridgeRegistry.register({
    key:          "marketplace",
    label:        BRIDGE_CONFIG.marketplace.label,
    status:       BRIDGE_CONFIG.marketplace.status,
    note:         BRIDGE_CONFIG.marketplace.note,
    activateWith: BRIDGE_CONFIG.marketplace.activateWith,
    handlers:     new Map([
      ["MARKETPLACE_PUBLISH_PRODUCT",  Marketplace.publishProduct],
      ["MARKETPLACE_UPDATE_INVENTORY", Marketplace.updateInventory],
      ["MARKETPLACE_GET_ORDERS",       Marketplace.getOrders],
    ]),
  });

  bridgeRegistry.register({
    key:          "identity",
    label:        BRIDGE_CONFIG.identity.label,
    status:       BRIDGE_CONFIG.identity.status,
    note:         BRIDGE_CONFIG.identity.note,
    activateWith: BRIDGE_CONFIG.identity.activateWith,
    handlers:     new Map([
      ["IDENTITY_AUTHORIZE",       Identity.authorize],
      ["IDENTITY_EXCHANGE_TOKEN",  Identity.exchangeToken],
      ["IDENTITY_VERIFY_TOKEN",    Identity.verifyToken],
      ["IDENTITY_CREATE_SESSION",  Identity.createSession],
      ["IDENTITY_REVOKE_TOKEN",    Identity.revokeToken],
    ]),
  });

  bridgeRegistry.register({
    key:          "webhook",
    label:        BRIDGE_CONFIG.webhook.label,
    status:       BRIDGE_CONFIG.webhook.status,
    note:         BRIDGE_CONFIG.webhook.note,
    activateWith: BRIDGE_CONFIG.webhook.activateWith,
    handlers:     new Map([
      ["WEBHOOK_DISPATCH",          Webhook.dispatchWebhook],
      ["WEBHOOK_VERIFY_SIGNATURE",  Webhook.verifySignature],
      ["WEBHOOK_SUBSCRIBE",         Webhook.subscribeToEvents],
    ]),
  });

  const summary = bridgeRegistry.getStatusSummary();
  console.log(
    `[BridgeRegistry] ✅ Auto-registered ${summary.total} connectors — ` +
    `${summary.active} ACTIVE · ${summary.not_configured} NOT_CONFIGURED`
  );
}

// Initialize on module load — happens once, before any request
_initRegistry();

// ─── History ──────────────────────────────────────────────────────────────────

const MAX_HISTORY = 100;
const _history: BridgeHistoryEntry[] = [];

function _addToHistory(entry: BridgeHistoryEntry): void {
  _history.unshift(entry);
  if (_history.length > MAX_HISTORY) _history.splice(MAX_HISTORY);
}

// ─── Core Router ──────────────────────────────────────────────────────────────

async function route(req: BridgeRequest): Promise<BridgeResponse> {
  const requestId = randomUUID();
  const ts        = new Date().toISOString();

  console.log(
    `[UniversalBridge] → ${req.type} · source:${req.metadata?.source ?? "unknown"} · requestId:${requestId}`
  );

  let response: BridgeResponse;

  try {
    response = await _dispatch(req, requestId, ts);
  } catch (err) {
    const msg = (err as Error).message;
    console.error(`[UniversalBridge] ❌ Unhandled error for ${req.type}: ${msg}`);
    const connKey = bridgeRegistry.resolveKey(req.type);
    response = {
      requestId,
      connectorKey: (connKey === "unknown" ? "payments" : connKey) as BridgeConnectorKey,
      action:       req.type,
      status:       "FAILURE",
      error:        msg,
      ts,
    };
  }

  response.requestId = response.requestId || requestId;

  console.log(
    `[UniversalBridge] ← ${response.status} · ${req.type} · ` +
    `${response.error ? `error:${response.error.slice(0, 80)}` : "ok"}`
  );

  _addToHistory({ ...response, request: req });
  return response;
}

// ─── Registry-Driven Dispatch ─────────────────────────────────────────────────
// No hardcoded switch. The registry owns all routing.

async function _dispatch(
  req:       BridgeRequest,
  requestId: string,
  ts:        string,
): Promise<BridgeResponse> {
  const handler = bridgeRegistry.getHandler(req.type);

  if (!handler) {
    const connKey = bridgeRegistry.resolveKey(req.type);
    console.warn(`[UniversalBridge] ⚠️ No handler registered for action: ${req.type}`);
    return {
      requestId,
      connectorKey: (connKey === "unknown" ? "payments" : connKey) as BridgeConnectorKey,
      action:       req.type,
      status:       "FAILURE",
      error:        `No handler registered for bridge action: ${req.type}. ` +
                    `Add a handler in universalBridgeEngine.ts → _initRegistry().`,
      ts,
    };
  }

  return handler(req);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const bridge = {
  route,

  // History
  getHistory:       () => [..._history],
  getRecentHistory: (n = 20) => _history.slice(0, n),
  getLastActionFor: (connector: string) =>
    _history.find(h => h.connectorKey === connector) ?? null,

  // Registry queries — live connector status from the registry
  getConnectorStatus: () => bridgeRegistry.getStatusSummary().connectors,
  getRegistrySummary: () => bridgeRegistry.getStatusSummary(),

  // Future-proofing: add new connector at runtime (e.g. from plugin system)
  registerConnector: bridgeRegistry.register.bind(bridgeRegistry),
};

// ─── Standalone export ────────────────────────────────────────────────────────
export const routeBridge = route;
