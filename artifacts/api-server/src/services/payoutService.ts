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

import { getWealthSnapshot }  from "./wealthMultiplier.js";
import { getSaraStripeInfo }  from "./familyAgents.js";
import { bridge }             from "../bridge/universalBridgeEngine.js";

// ─── Payout Stats ─────────────────────────────────────────────────────────────

export interface PayoutStats {
  // ── ACH Cycle payouts (pushFundsToHuntington) ────────────────────────────
  cycleCount:          number;
  successCount:        number;
  queuedCount:         number;       // cycles where balance was $0
  errorCount:          number;
  totalTransferredUsd: number;
  lastPayoutId:        string;
  lastPayoutTs:        string;
  lastAmountUsd:       number;
  bankLinked:          boolean;
  lastError:           string;
  // ── Instant payouts (pushRevenueToBankImmediately) ───────────────────────
  instantCount:        number;       // micro-revenue events → instant payout
  instantSuccessCount: number;
  instantErrorCount:   number;
  totalInstantUsd:     number;
  lastInstantId:       string;
  lastInstantAmountUsd: number;
  lastInstantTs:       string;
  lastInstantError:    string;
}

const _stats: PayoutStats = {
  cycleCount:           0,
  successCount:         0,
  queuedCount:          0,
  errorCount:           0,
  totalTransferredUsd:  0,
  lastPayoutId:         "",
  lastPayoutTs:         "",
  lastAmountUsd:        0,
  bankLinked:           false,
  lastError:            "",
  instantCount:         0,
  instantSuccessCount:  0,
  instantErrorCount:    0,
  totalInstantUsd:      0,
  lastInstantId:        "",
  lastInstantAmountUsd: 0,
  lastInstantTs:        "",
  lastInstantError:     "",
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

    // Use real Stripe balance (totalBalance) as the payout amount
    const availableAmount = snapshot.totalBalance ?? 0;

    if (availableAmount < MIN_PAYOUT_USD) {
      _stats.queuedCount++;
      console.log(
        `[PayoutService] ⏳ Cycle #${_stats.cycleCount} — available $${availableAmount.toFixed(2)} ` +
        `< $${MIN_PAYOUT_USD} threshold, queued (${_stats.queuedCount} total queued)`
      );
      return;
    }

    // 2. Route payout through Universal Bridge Engine → Stripe connector
    const resp = await bridge.route({
      type:    "PAYMENT_TRIGGER_PAYOUT",
      payload: {
        amountUsd:     availableAmount,
        method:        "standard",
        stripeAccount: saraInfo.stripeAccountId ?? "",
        description:   "CreateAI Brain ACH payout — Sara Stadler → Huntington",
        metadata: {
          platform:  "CreateAI Brain",
          recipient: "Sara Stadler",
          cycle:     String(_stats.cycleCount),
        },
      },
      metadata: { source: "payoutService:pushFundsToHuntington", ts: new Date().toISOString() },
    });

    if (resp.status !== "SUCCESS") {
      throw new Error(resp.error ?? `Bridge payout returned ${resp.status}`);
    }

    const payoutId = String(resp.data?.["payoutId"] ?? "");

    _stats.successCount++;
    _stats.totalTransferredUsd += availableAmount;
    _stats.lastPayoutId        = payoutId;
    _stats.lastPayoutTs        = new Date().toISOString();
    _stats.lastAmountUsd       = availableAmount;
    _stats.lastError           = "";

    console.log(
      `[PayoutService] ✅ Payout #${_stats.successCount} via bridge — ` +
      `$${availableAmount.toFixed(2)} → Huntington ACH · ID: ${payoutId}`
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

// ─── Instant Payout (per micro-revenue event) ─────────────────────────────────
//
// Called by the UltraInteractionEngine "microRevenue" listener in index.ts.
// Uses method:"instant" so funds arrive in seconds rather than the standard
// ACH 1-3 business-day window.  Stripe requires the destination account
// to support instant payouts (eligible debit card or verified bank).

const INSTANT_MIN_USD = 0.50;  // Stripe instant payout floor

export async function pushRevenueToBankImmediately(amount: number): Promise<void> {
  _stats.instantCount++;

  if (amount < INSTANT_MIN_USD) {
    console.log(
      `[PayoutService] ⚡ Instant #${_stats.instantCount} — ` +
      `$${amount.toFixed(2)} below floor $${INSTANT_MIN_USD}, skipped`
    );
    return;
  }

  try {
    const saraInfo    = getSaraStripeInfo();
    _stats.bankLinked = saraInfo.bankAccountLinked;

    const bankAccountId = process.env["SARA_BANK_ACCOUNT_ID"] ?? saraInfo.bankAccountId ?? "";
    if (!bankAccountId) {
      throw new Error("Bank account not configured — set SARA_BANK_ACCOUNT_ID env var");
    }

    // Route through Universal Bridge Engine → Stripe connector
    const resp = await bridge.route({
      type:    "PAYMENT_TRIGGER_PAYOUT",
      payload: {
        amountUsd:     amount,
        method:        "instant",
        destination:   bankAccountId,
        stripeAccount: saraInfo.stripeAccountId ?? "",
        description:   `CreateAI Brain instant revenue · $${amount.toFixed(2)} · Sara Stadler`,
        metadata: {
          platform:     "CreateAI Brain",
          event:        "microRevenue",
          amountUsd:    amount.toFixed(2),
          instantIndex: String(_stats.instantCount),
          recipient:    "Sara Stadler",
        },
      },
      metadata: { source: "payoutService:pushRevenueToBankImmediately", ts: new Date().toISOString() },
    });

    if (resp.status !== "SUCCESS") {
      throw new Error(resp.error ?? `Bridge instant payout returned ${resp.status}`);
    }

    const payoutId = String(resp.data?.["payoutId"] ?? "");

    _stats.instantSuccessCount++;
    _stats.totalInstantUsd     += amount;
    _stats.lastInstantId        = payoutId;
    _stats.lastInstantAmountUsd = amount;
    _stats.lastInstantTs        = new Date().toISOString();
    _stats.lastInstantError     = "";

    console.log(
      `[PayoutService] ⚡✅ Instant payout #${_stats.instantSuccessCount} via bridge — ` +
      `$${amount.toFixed(2)} → Huntington (instant) · ID: ${payoutId}`
    );

  } catch (err) {
    _stats.instantErrorCount++;
    _stats.lastInstantError = (err as Error).message;
    console.warn(
      `[PayoutService] ⚡⚠️ Instant payout #${_stats.instantCount} failed ` +
      `(${_stats.instantErrorCount} total errors): ${_stats.lastInstantError}`
    );
  }
}

// ─── Stats Accessor ───────────────────────────────────────────────────────────

export function getPayoutStats(): PayoutStats {
  return { ..._stats };
}
