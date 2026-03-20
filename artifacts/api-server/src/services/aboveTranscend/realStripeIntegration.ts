/**
 * realStripeIntegration.ts — Poll real Stripe PaymentIntents and allocate
 * succeeded amounts to FamilyAgent income buckets.
 * Spec: realStripeIntegration.ts
 *
 * On each engine cycle-end (and every 2 minutes as backup):
 *  1. Lists the 100 most recent PaymentIntents from Stripe
 *  2. Filters to those with status "succeeded" AND metadata.allocated != "true"
 *  3. Splits each payment's amount equally among all FamilyMembers
 *  4. Updates each member's dailyIncome / monthlyIncome / cumulativeIncome
 *  5. Marks the PaymentIntent as allocated via metadata so it isn't double-counted
 *  6. Triggers payoutToMembers() immediately so the newly allocated income is paid out
 *
 * NOTE: stripe.paymentIntents.list() does not accept `status` as a server-side
 * filter — the SDK requires client-side filtering, which is done below.
 */

import { getUncachableStripeClient } from "../integrations/stripeClient.js";
import { getFamilyMembers }          from "../familyAgents.js";
import { engineState }               from "./engine.js";
import { payoutToMembers }           from "./autoPayout.js";

const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes — backup polling interval

async function allocateRealPayments(): Promise<void> {
  try {
    const stripe  = await getUncachableStripeClient();
    const members = getFamilyMembers();

    if (members.length === 0) return;

    // Fetch the 100 most recent PaymentIntents (Stripe max per page)
    const { data: intents } = await stripe.paymentIntents.list({ limit: 100 });

    // Filter client-side: succeeded + not yet allocated
    const unallocated = intents.filter(
      pi => pi.status === "succeeded" && pi.metadata?.["allocated"] !== "true"
    );

    if (unallocated.length === 0) return;

    for (const pi of unallocated) {
      const amountPerMember = Math.floor(pi.amount / members.length); // cents
      const incomePerMember = amountPerMember / 100;                   // dollars

      for (const member of members) {
        member.dailyIncome      = incomePerMember;
        member.monthlyIncome    = incomePerMember * 30;
        member.cumulativeIncome = (member.cumulativeIncome ?? 0) + incomePerMember;
      }

      // Mark as allocated so this PaymentIntent is never processed again
      await stripe.paymentIntents.update(pi.id, {
        metadata: { allocated: "true" },
      });

      console.log(
        `[RealPayments] Allocated PI ${pi.id} ($${(pi.amount / 100).toLocaleString()}) ` +
        `→ ${members.length} members · $${incomePerMember.toLocaleString()} each`
      );
    }

    // Trigger immediate payout for the newly allocated income
    payoutToMembers(members).catch(err =>
      console.error("[RealPayments] payout error:", (err as Error).message)
    );

    console.log(`[RealPayments] Allocated ${unallocated.length} payment(s) to FamilyAgents`);
  } catch (err) {
    console.error("[RealPayments]", (err as Error).message);
  }
}

/**
 * initRealStripeIntegration — call once at boot.
 * Registers allocateRealPayments on the engine cycle-end hook AND
 * starts a 2-minute interval as a backup polling fallback.
 */
export function initRealStripeIntegration(): void {
  // Primary trigger: run after every engine cycle completes
  engineState.onCycleEnd(() => {
    allocateRealPayments().catch(err =>
      console.error("[RealPayments] cycle-end error:", (err as Error).message)
    );
  });

  // Backup: independent 2-minute poll in case the engine cycle is paused
  setInterval(() => {
    allocateRealPayments().catch(err =>
      console.error("[RealPayments] interval error:", (err as Error).message)
    );
  }, POLL_INTERVAL_MS);

  console.log("[RealStripeIntegration] Live allocation module active");
}
