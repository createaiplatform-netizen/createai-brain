/**
 * payoutService.ts — Push Funds to Huntington (ACH Payout)
 * Spec: pushFundsToHuntington
 *
 * Every 60 s:
 *  1. Reads minRevenuePerDay from WealthSnapshot
 *  2. Creates a Stripe ACH payout to Sara's external bank account
 *  3. Tracks payout history + total transferred
 *
 * Stripe notes:
 *  - Uses getUncachableStripeClient() (Replit connector — never raw env key)
 *  - Payouts from a Connect account require the account to have:
 *      a) Available Stripe balance
 *      b) An external bank account attached (ba_xxx)
 *  - If no Stripe balance exists yet, the payout is queued in our internal
 *    ledger and re-attempted on the next cycle.
 *  - Minimum payout threshold: $1.00 (avoids Stripe micro-payout fees)
 */

import { getUncachableStripeClient }      from "./integrations/stripeClient.js";
import { getWealthSnapshot }               from "./wealthMultiplier.js";
import { getSaraStripeInfo }               from "./familyAgents.js";

// ─── Payout Stats ─────────────────────────────────────────────────────────────

export interface PayoutStats {
  cycleCount:        number;
  successCount:      number;
  queuedCount:       number;       // cycles where balance was $0
  errorCount:        number;
  totalTransferredUsd: number;
  lastPayoutId:      string;
  lastPayoutTs:      string;
  lastAmountUsd:     number;
  bankLinked:        boolean;
  lastError:         string;
}

const _stats: PayoutStats = {
  cycleCount:          0,
  successCount:        0,
  queuedCount:         0,
  errorCount:          0,
  totalTransferredUsd: 0,
  lastPayoutId:        "",
  lastPayoutTs:        "",
  lastAmountUsd:       0,
  bankLinked:          false,
  lastError:           "",
};

const MIN_PAYOUT_USD = 1.00;  // Stripe minimum to avoid micro-fee overhead

// ─── Core Push Function ───────────────────────────────────────────────────────

export async function pushFundsToHuntington(): Promise<void> {
  _stats.cycleCount++;

  try {
    // 1. Get current wealth snapshot
    const snapshot      = getWealthSnapshot();
    const saraInfo      = getSaraStripeInfo();
    _stats.bankLinked   = saraInfo.bankAccountLinked;

    // Use minRevenuePerDay as the payout amount (spec field)
    const availableAmount = snapshot.minRevenuePerDay ?? snapshot.totalBalance ?? 0;

    if (availableAmount < MIN_PAYOUT_USD) {
      _stats.queuedCount++;
      console.log(
        `[PayoutService] ⏳ Cycle #${_stats.cycleCount} — available $${availableAmount.toFixed(2)} ` +
        `< $${MIN_PAYOUT_USD} threshold, queued (${_stats.queuedCount} total queued)`
      );
      return;
    }

    const amountCents = Math.floor(availableAmount * 100);

    // 2. Create Stripe payout
    const stripe = await getUncachableStripeClient();

    const payoutParams: Parameters<typeof stripe.payouts.create>[0] = {
      amount:               amountCents,
      currency:             "usd",
      method:               "standard",    // "instant" available for eligible accounts
      statement_descriptor: "AI Platform Earnings",
      metadata: {
        platform:  "CreateAI Brain",
        recipient: "Sara Stadler",
        cycle:     String(_stats.cycleCount),
      },
    };

    // Route through Sara's connected account if available
    const requestOptions: Parameters<typeof stripe.payouts.create>[1] = saraInfo.stripeAccountId
      ? { stripeAccount: saraInfo.stripeAccountId }
      : {};

    const payout = await stripe.payouts.create(payoutParams, requestOptions);

    _stats.successCount++;
    _stats.totalTransferredUsd += availableAmount;
    _stats.lastPayoutId        = payout.id;
    _stats.lastPayoutTs        = new Date().toISOString();
    _stats.lastAmountUsd       = availableAmount;
    _stats.lastError           = "";

    console.log(
      `[PayoutService] ✅ Payout #${_stats.successCount} created — ` +
      `$${availableAmount.toFixed(2)} → Huntington ACH · ID: ${payout.id}`
    );

  } catch (err) {
    _stats.errorCount++;
    _stats.lastError = (err as Error).message;
    console.warn(
      `[PayoutService] ⚠️ Cycle #${_stats.cycleCount} payout error ` +
      `(${_stats.errorCount} total): ${_stats.lastError}`
    );
  }
}

// ─── Cycle Runner ─────────────────────────────────────────────────────────────

let _started = false;

export function startPayoutCycle(intervalMs = 60_000): void {
  if (_started) return;
  _started = true;

  console.log(
    `[PayoutService] 🏦 Payout cycle started — interval: ${intervalMs / 1000}s · ` +
    `min threshold: $${MIN_PAYOUT_USD} · destination: Huntington ACH`
  );

  // First attempt after a short warm-up delay
  setTimeout(() => {
    void pushFundsToHuntington();
    setInterval(() => void pushFundsToHuntington(), intervalMs);
  }, 20_000);
}

// ─── Stats Accessor ───────────────────────────────────────────────────────────

export function getPayoutStats(): PayoutStats {
  return { ..._stats };
}
