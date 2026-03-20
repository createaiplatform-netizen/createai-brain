/**
 * autoPayout.ts — Per-cycle Stripe payout to all family members
 * Spec: autoPayout.ts · autoPayoutSetup.ts
 *
 * Called at end of every engine cycle, after updateMemberIncomes().
 * Creates a PaymentIntent for each member whose bankAccountLinked = true,
 * stripeCustomerId is set, and dailyIncome > 0.
 *
 * Amount is capped at 99,999,999 cents ($999,999.99) — Stripe's hard max
 * per PaymentIntent — so Limitless Engine simulation values never exceed it.
 *
 * payment_method_types: ['us_bank_account', 'card'] — card as fallback.
 * transfer_data.destination only included when member.stripeAccountId is set.
 */

import { getUncachableStripeClient } from "../integrations/stripeClient.js";
import type { FamilyMember }         from "../familyAgents.js";

// Stripe hard ceiling per PaymentIntent (99_999_999 cents = $999,999.99)
const STRIPE_MAX_CENTS = 99_999_999;

export async function payoutToMembers(members: FamilyMember[]): Promise<void> {
  try {
    const stripe = await getUncachableStripeClient();

    for (const member of members) {
      if (!member.bankAccountLinked || !member.stripeCustomerId) continue;
      if (!member.dailyIncome || member.dailyIncome <= 0) continue;

      try {
        // Cap at Stripe's maximum (spec: autoPayoutSetup.ts)
        const amountCents = Math.min(Math.floor(member.dailyIncome * 100), STRIPE_MAX_CENTS);

        const intentParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
          amount:               amountCents,
          currency:             "usd",
          customer:             member.stripeCustomerId,
          payment_method_types: ["us_bank_account", "card"],
          description:          `Limitless Engine Daily Income: ${member.dailyIncome.toFixed(2)} USD`,
          transfer_data:        member.stripeAccountId
                                  ? { destination: member.stripeAccountId }
                                  : undefined,
        };

        const payment = await stripe.paymentIntents.create(intentParams);
        console.log(
          `[StripePayout] ${member.name} payout attempted: $${member.dailyIncome.toLocaleString()} · ` +
          `PaymentIntent: ${payment.id} · status: ${payment.status}`
        );
      } catch (memberErr) {
        console.error(
          `[StripePayout] ${member.name} payout failed: ${(memberErr as Error).message}`
        );
      }
    }
  } catch (err) {
    console.error("[StripePayout] Error sending payouts:", (err as Error).message);
  }
}
