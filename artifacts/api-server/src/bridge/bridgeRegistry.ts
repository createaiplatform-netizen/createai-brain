/**
 * bridge/bridgeRegistry.ts — Universal Bridge Engine — Auto-Scaling Registry
 *
 * The single source of truth for all registered connectors and their action handlers.
 *
 * How it works:
 *   1. Each connector calls bridgeRegistry.register() at module load time.
 *   2. The Universal Bridge Engine queries the registry for every incoming request.
 *   3. To add a new connector: create the connector file, call register() — done.
 *      No changes to the engine, no changes to routes, no changes to existing connectors.
 *
 * Usage (from a new connector file):
 *   import { bridgeRegistry } from "../bridgeRegistry.js";
 *   bridgeRegistry.register({ key: "crm", label: "CRM (HubSpot)", ... });
 *
 * The registry never invents connectors — it only accepts explicit registrations.
 * If no handler is found for an action, the engine returns a clean FAILURE response.
 */

import type { BridgeConnectorKey, BridgeActionType, ConnectorRegistration } from "./types.js";

// ─── Registry class ───────────────────────────────────────────────────────────

class BridgeRegistryClass {
  private _connectors = new Map<string, ConnectorRegistration>();
  private _actionIndex = new Map<string, string>(); // action → connectorKey

  // ── Register a connector ────────────────────────────────────────────────────

  register(entry: ConnectorRegistration): void {
    this._connectors.set(entry.key, entry);

    // Index all action handlers for fast lookup
    for (const action of entry.handlers.keys()) {
      this._actionIndex.set(action, entry.key);
    }

    console.log(
      `[BridgeRegistry] ✅ ${entry.key} · ${entry.status} · ` +
      `${entry.handlers.size} action(s)`
    );
  }

  // ── Resolve action → connector key ─────────────────────────────────────────

  resolveKey(action: string): BridgeConnectorKey | "unknown" {
    // First: check explicit action index
    const indexed = this._actionIndex.get(action);
    if (indexed) return indexed as BridgeConnectorKey;

    // Fallback: prefix-based resolution (for future connectors not yet registered)
    if (action.startsWith("PAYMENT_"))     return "payments";
    if (action.startsWith("ADS_"))         return "ads";
    if (action.startsWith("SMS_"))         return "sms";
    if (action.startsWith("EMAIL_"))       return "email";
    if (action.startsWith("MARKETPLACE_")) return "marketplace";
    if (action.startsWith("IDENTITY_"))    return "identity";
    if (action.startsWith("WEBHOOK_"))     return "webhook";
    return "unknown";
  }

  // ── Get handler for an action ───────────────────────────────────────────────

  getHandler(action: BridgeActionType | string) {
    const key = this.resolveKey(action);
    if (key === "unknown") return undefined;
    return this._connectors.get(key)?.handlers.get(action as BridgeActionType);
  }

  // ── Connector queries ───────────────────────────────────────────────────────

  getConnector(key: string): ConnectorRegistration | undefined {
    return this._connectors.get(key);
  }

  getAllConnectors(): ConnectorRegistration[] {
    return [...this._connectors.values()];
  }

  getStatusSummary() {
    const all    = this.getAllConnectors();
    const active = all.filter(c => c.status === "ACTIVE").length;
    return {
      total:          all.length,
      active,
      not_configured: all.length - active,
      connectors:     all.map(c => ({
        key:          c.key,
        label:        c.label,
        status:       c.status,
        note:         c.note,
        activateWith: c.activateWith,
        actionCount:  c.handlers.size,
      })),
    };
  }

  // ── Future-proofing: add a single action route to an existing connector ─────

  addActionRoute(
    connectorKey: string,
    action:       BridgeActionType,
    handler:      ConnectorRegistration["handlers"] extends Map<infer K, infer V> ? V : never,
  ): void {
    const entry = this._connectors.get(connectorKey);
    if (!entry) {
      console.warn(`[BridgeRegistry] Cannot add route — connector "${connectorKey}" not registered`);
      return;
    }
    entry.handlers.set(action, handler);
    this._actionIndex.set(action, connectorKey);
    console.log(`[BridgeRegistry] ➕ Route added: ${connectorKey}:${action}`);
  }
}

export const bridgeRegistry = new BridgeRegistryClass();
