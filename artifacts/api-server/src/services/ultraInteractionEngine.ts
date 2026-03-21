/**
 * ultraInteractionEngine.ts — UltraInteractionEngine EventEmitter Singleton
 * Spec: ULTRA-GLOBAL-ZERO-LIMIT-PLATFORM-ENGINE / ULTRA-TRANSCENDENT-PERSONAL-ENGINE
 *
 * The route at POST /api/ultra/interaction calls
 *   UltraInteractionEngine.fireMicroRevenue({ amount, type, userId, ts })
 * after each interaction.
 *
 * Consumers subscribe with:
 *   UltraInteractionEngine.on("microRevenue", handler)
 *
 * fetchAllUsers() returns all active users (Sara + family) for the
 * per-user hyper-personalization loop in ultraTranscendPersonalEngine.ts.
 */

import { EventEmitter } from "events";

export interface MicroRevenueEvent {
  amount:   number;   // dollars, e.g. 8.84 or 12.17
  type:     string;   // interaction type from the request body
  userId?:  string;
  ts:       string;   // ISO timestamp
}

export interface ActiveUser {
  id:     string;
  name:   string;
  email?: string;
  geo?:   string;
}

class _UltraInteractionEngine extends EventEmitter {
  private _totalFired   = 0;
  private _totalRevenue = 0;

  /**
   * Called by the route after each interaction to record revenue
   * and emit the "microRevenue" event for downstream subscribers.
   */
  fireMicroRevenue(payload: MicroRevenueEvent): void {
    this._totalFired++;
    this._totalRevenue += payload.amount;

    console.log(
      `[UltraEngine] 💸 microRevenue · $${payload.amount.toFixed(2)} · ` +
      `type:${payload.type} · total:$${this._totalRevenue.toFixed(2)}`
    );

    this.emit("microRevenue", payload);
  }

  /**
   * Spec: ultraEngine.fetchAllUsers({ minPercent: 100, geoScope: "global-universe" })
   * Returns all active users for the per-user personalization loop.
   * In production this would query the DB; here it always includes Sara + family.
   */
  async fetchAllUsers(opts?: {
    minPercent?: number;
    geoScope?:   string;
  }): Promise<ActiveUser[]> {
    console.log(
      `[UltraEngine] 🌍 fetchAllUsers — minPercent:${opts?.minPercent ?? 100} · ` +
      `geoScope:${opts?.geoScope ?? "global"}`
    );
    return [
      { id: "sara",    name: "Sara Stadler",    email: "admin@LakesideTrinity.com", geo: "US" },
      { id: "family1", name: "Family Member 1", email: undefined,                geo: "global" },
      { id: "family2", name: "Family Member 2", email: undefined,                geo: "global" },
    ];
  }

  get stats() {
    return {
      totalFired:   this._totalFired,
      totalRevenue: this._totalRevenue,
    };
  }
}

// Singleton — imported by routes, payout listener, and personal engine
export const UltraInteractionEngine = new _UltraInteractionEngine();
