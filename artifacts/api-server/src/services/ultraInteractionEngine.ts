/**
 * ultraInteractionEngine.ts — UltraInteractionEngine EventEmitter Singleton
 * Spec: ULTRA-GLOBAL-ZERO-LIMIT-PLATFORM-ENGINE / pushRevenueToBankImmediately
 *
 * The route at POST /api/ultra/interaction calls
 *   UltraInteractionEngine.emit("microRevenue", { amount, type, userId })
 * after each interaction.
 *
 * Consumers (e.g. payoutService) subscribe with:
 *   UltraInteractionEngine.on("microRevenue", handler)
 *
 * This keeps the route thin and the payout logic decoupled.
 */

import { EventEmitter } from "events";

export interface MicroRevenueEvent {
  amount:   number;   // dollars, e.g. 8.84 or 12.17
  type:     string;   // interaction type from the request body
  userId?:  string;
  ts:       string;   // ISO timestamp
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

  get stats() {
    return {
      totalFired:   this._totalFired,
      totalRevenue: this._totalRevenue,
    };
  }
}

// Singleton — imported by both the route and the payout listener
export const UltraInteractionEngine = new _UltraInteractionEngine();
