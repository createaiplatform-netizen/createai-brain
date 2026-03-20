/**
 * universalBridgeEngine.ts — Universal Bridge Engine (Central Router)
 *
 * The ONLY entry point for internal engines to reach external systems.
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
 *   if (response.status === "SUCCESS") { ... }
 *   else if (response.status === "NOT_CONFIGURED") { ... log + fall back ... }
 *   else { ... handle FAILURE ... }
 *
 * Rules:
 *   - Internal engines NEVER import connector files directly.
 *   - All external I/O routes through this file.
 *   - No fake data is ever introduced here.
 *   - Every request and response is logged + stored in history.
 */

import { randomUUID }         from "crypto";
import type {
  BridgeRequest,
  BridgeResponse,
  BridgeHistoryEntry,
  BridgeActionType,
}                             from "./types.js";
import { getAllConnectorStatuses } from "./bridgeConfig.js";

// ── Connector imports ─────────────────────────────────────────────────────────
import * as Payments    from "./connectors/paymentsConnector.js";
import * as Ads         from "./connectors/adsConnector.js";
import * as SMS         from "./connectors/smsConnector.js";
import * as Email       from "./connectors/emailConnector.js";
import * as Marketplace from "./connectors/marketplaceConnector.js";

// ─── History ──────────────────────────────────────────────────────────────────

const MAX_HISTORY = 100;
const _history: BridgeHistoryEntry[] = [];

function _addToHistory(entry: BridgeHistoryEntry): void {
  _history.unshift(entry);
  if (_history.length > MAX_HISTORY) _history.splice(MAX_HISTORY);
}

// ─── Router ───────────────────────────────────────────────────────────────────

async function route(req: BridgeRequest): Promise<BridgeResponse> {
  const requestId = randomUUID();
  const ts        = new Date().toISOString();

  console.log(
    `[UniversalBridge] → ${req.type} · source:${req.metadata?.source ?? "unknown"} · requestId:${requestId}`
  );

  let response: BridgeResponse;

  try {
    response = await _dispatch(req);
  } catch (err) {
    // Unhandled error in a connector — always return FAILURE, never throw
    const msg = (err as Error).message;
    console.error(`[UniversalBridge] ❌ Unhandled connector error for ${req.type}: ${msg}`);
    response = {
      requestId,
      connectorKey: _connectorKeyForAction(req.type),
      action:       req.type,
      status:       "FAILURE",
      error:        msg,
      ts,
    };
  }

  // Stamp the requestId if the connector didn't set one
  response.requestId = response.requestId || requestId;

  console.log(
    `[UniversalBridge] ← ${response.status} · ${req.type} · ` +
    `${response.error ? `error:${response.error}` : "ok"}`
  );

  _addToHistory({ ...response, request: req });
  return response;
}

// ─── Action dispatcher ────────────────────────────────────────────────────────

async function _dispatch(req: BridgeRequest): Promise<BridgeResponse> {
  switch (req.type) {
    // Payments
    case "PAYMENT_CREATE_CHECKOUT":  return Payments.createCheckoutSession(req);
    case "PAYMENT_TRIGGER_PAYOUT":   return Payments.triggerPayout(req);
    case "PAYMENT_GET_BALANCE":      return Payments.getBalance(req);

    // Ads
    case "ADS_CREATE_CAMPAIGN":      return Ads.createAdCampaign(req);
    case "ADS_PAUSE_CAMPAIGN":       return Ads.pauseCampaign(req);
    case "ADS_GET_STATS":            return Ads.getCampaignStats(req);

    // SMS
    case "SMS_SEND":                 return SMS.sendSMS(req);
    case "SMS_GET_DELIVERY_STATUS":  return SMS.getDeliveryStatus(req);

    // Email
    case "EMAIL_SEND":               return Email.sendEmail(req);
    case "EMAIL_GET_STATUS":         return Email.getEmailStatus(req);

    // Marketplace
    case "MARKETPLACE_PUBLISH_PRODUCT":   return Marketplace.publishProduct(req);
    case "MARKETPLACE_UPDATE_INVENTORY":  return Marketplace.updateInventory(req);
    case "MARKETPLACE_GET_ORDERS":        return Marketplace.getOrders(req);

    default: {
      const unknown = req.type as string;
      console.warn(`[UniversalBridge] Unknown action type: ${unknown}`);
      return {
        requestId:    randomUUID(),
        connectorKey: "payments",
        action:       req.type as BridgeActionType,
        status:       "FAILURE",
        error:        `Unknown bridge action type: ${unknown}`,
        ts:           new Date().toISOString(),
      };
    }
  }
}

// ─── Connector key resolver ───────────────────────────────────────────────────

function _connectorKeyForAction(type: BridgeActionType): BridgeResponse["connectorKey"] {
  if (type.startsWith("PAYMENT_"))     return "payments";
  if (type.startsWith("ADS_"))         return "ads";
  if (type.startsWith("SMS_"))         return "sms";
  if (type.startsWith("EMAIL_"))       return "email";
  if (type.startsWith("MARKETPLACE_")) return "marketplace";
  return "payments";
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const bridge = {
  route,
  getHistory:          () => [..._history],
  getRecentHistory:    (n = 20) => _history.slice(0, n),
  getConnectorStatus:  getAllConnectorStatuses,
  getLastActionFor:    (connector: string) =>
    _history.find(h => h.connectorKey === connector) ?? null,
};

// ─── Standalone function export (for convenience) ─────────────────────────────
export const routeBridge = route;
