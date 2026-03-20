/**
 * realStripeIntegration.ts — Poll real Stripe PaymentIntents and allocate
 * succeeded amounts to FamilyAgent income buckets.
 * Spec: realStripeIntegration.ts · realStripeSetup.ts
 *
 * On each engine cycle-end (and every 2 minutes as backup):
 *  1. Lists the 100 most recent PaymentIntents from Stripe
 *  2. Filters to those with status "succeeded" AND metadata.allocated != "true"
 *  3. Splits each payment's amount_received equally among all FamilyMembers
 *  4. Updates each member's dailyIncome / monthlyIncome / cumulativeIncome
 *  5. Marks the PaymentIntent as allocated via metadata so it isn't double-counted
 *  6. Creates a stripe.transfers.create() to any member with a stripeAccountId (Connect)
 *  7. Triggers payoutToMembers() immediately so the newly allocated income is paid out
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

    // Filter client-side: succeeded + not yet allocated (spec: realStripeSetup.ts)
    const unallocated = intents.filter(
      pi => pi.status === "succeeded" && pi.metadata?.["allocated"] !== "true"
    );

    if (unallocated.length === 0) return;

    for (const pi of unallocated) {
      // Use amount_received (actual settled amount) for splits (spec: realStripeSetup.ts)
      const totalReceived   = pi.amount_received > 0 ? pi.amount_received : pi.amount;
      const amountPerMember = Math.floor(totalReceived / members.length); // cents
      const incomePerMember = amountPerMember / 100;                       // dollars

      for (const member of members) {
        member.dailyIncome      = incomePerMember;
        member.monthlyIncome    = incomePerMember * 30;
        member.cumulativeIncome = (member.cumulativeIncome ?? 0) + incomePerMember;

        // Transfer to connected Stripe account if member has one (spec: realStripeSetup.ts)
        if (member.stripeAccountId && amountPerMember > 0) {
          stripe.transfers.create({
            amount:      amountPerMember,
            currency:    pi.currency,
            destination: member.stripeAccountId,
          }).then(t => {
            console.log(
              `[RealPayments] Transfer ${t.id} → ${member.name} · ` +
              `$${(amountPerMember / 100).toFixed(2)}`
            );
          }).catch(err => {
            console.warn(
              `[RealPayments] Transfer skipped for ${member.name}: ` +
              `${(err as Error).message}`
            );
          });
        }
      }

      // Mark as allocated so this PaymentIntent is never processed again
      await stripe.paymentIntents.update(pi.id, {
        metadata: { allocated: "true" },
      });

      console.log(
        `[RealPayments] Allocated PI ${pi.id} ` +
        `($${(totalReceived / 100).toLocaleString()}) ` +
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
