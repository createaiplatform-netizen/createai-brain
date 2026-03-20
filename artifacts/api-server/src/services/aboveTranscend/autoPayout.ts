/**
 * autoPayout.ts — Per-cycle Stripe payout to all family members
 * Spec: autoPayout.ts
 *
 * Called at end of every engine cycle, after updateMemberIncomes().
 * Creates a PaymentIntent (us_bank_account) for each member whose
 * bankAccountLinked = true, stripeCustomerId is set, and dailyIncome > 0.
 *
 * transfer_data.destination is included only when member.stripeAccountId
 * is set (Stripe Connect). Without it the intent is a charge to the
 * customer's saved payment method, not a Connect payout.
 */

import { getUncachableStripeClient } from "../integrations/stripeClient.js";
import type { FamilyMember }         from "../familyAgents.js";

export async function payoutToMembers(members: FamilyMember[]): Promise<void> {
  try {
    const stripe = await getUncachableStripeClient();

    for (const member of members) {
      if (!member.bankAccountLinked || !member.stripeCustomerId) continue;

      const amountCents = Math.round(member.dailyIncome * 100);
      if (amountCents <= 0) continue;

      try {
        const intentParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
          amount:               amountCents,
          currency:             "usd",
          customer:             member.stripeCustomerId,
          payment_method_types: ["us_bank_account"],
          description:          `Limitless Engine Daily Income: ${member.dailyIncome.toFixed(2)} USD`,
          confirm:              true,
          ...(member.stripeAccountId
            ? { transfer_data: { destination: member.stripeAccountId } }
            : {}),
        };

        const payment = await stripe.paymentIntents.create(intentParams);
        console.log(
          `[StripePayout] ${member.name} → $${member.dailyIncome.toFixed(2)} · ` +
          `PaymentIntent: ${payment.id} · status: ${payment.status}`
        );
      } catch (memberErr) {
        // Log per-member failures but continue processing other members
        console.warn(
          `[StripePayout] ${member.name} payout skipped — ` +
          `${(memberErr as Error).message}`
        );
      }
    }
  } catch (err) {
    console.error("[StripePayout] Error sending payouts:", (err as Error).message);
  }
}
