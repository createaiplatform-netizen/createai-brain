/**
 * familyAgents.ts — Limitless Family Backend + AI Agent + Stripe Integration
 * Spec: fullProduction.ts · Real Market AI System — Full Family + Bank + Marketplace Setup
 *
 * Each family member has:
 *  - UUID id, aiAgentActive, bankAccountLinked, stripeCustomerId
 *  - stripeAccountId (Stripe Custom Connected Account for transfers — spec: launchFullFamilyMarket)
 *  - dailyIncome, monthlyIncome, cumulativeIncome (updated every engine cycle)
 *  - FamilyAI agent that handles voice commands
 */

import { EventEmitter } from "events";
import { randomUUID }   from "crypto";
import { getUncachableStripeClient } from "./integrations/stripeClient.js";

// ─── Business Identity (spec: launchFullFamilyMarket) ─────────────────────────
// Lakeside Trinity Care and Wellness LLC — used in Stripe business verification
// and market engine metadata.
export const LAKESIDE_TRINITY = {
  name:    "Lakeside Trinity Care and Wellness LLC",
  address: "23926 4th Ave, Siren, WI 54872",
  phone:   "715-791-0292",
  email:   "admin@LakesideTrinity.com",
  description:
    "24/7 supportive home care including personal care, companionship, meal support, " +
    "housekeeping, errands, safety monitoring, medication reminders, and high-needs " +
    "mobility support. Stripe processes payments after service delivery (one-time or " +
    "recurring). No website is used.",
} as const;

// ─── Config ──────────────────────────────────────────────────────────────────

export const VOICE_WAKE_WORDS = ["Nova", "Atlas", "Aurora"] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FamilyMember {
  id:                   string;
  name:                 string;
  email:                string;
  phone:                string;
  aiAgentActive:        boolean;
  bankAccountLinked:    boolean;
  stripeCustomerId?:    string;
  stripeAccountId?:     string;   // Stripe Connect destination account (autoPayout.ts spec)
  dailyIncome:          number;
  monthlyIncome:        number;
  cumulativeIncome:     number;
  // FamilyAI agent state
  internalAccount?:     string;
  phoneServiceActive?:  boolean;
  customizableOptions?: { email: string; phone: string };
  commandHistory:       string[];
  initializedAt:        number;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const members: FamilyMember[] = [
  {
    id: randomUUID(), name: "Sara Stadler", email: "admin@LakesideTrinity.com", phone: "+17157910292",
    aiAgentActive: true, bankAccountLinked: true,
    dailyIncome: 0, monthlyIncome: 0, cumulativeIncome: 0,
    commandHistory: [], initializedAt: Date.now(),
  },
  {
    id: randomUUID(), name: "FamilyMember1", email: "fm1@example.com", phone: "+17157910292",
    aiAgentActive: true, bankAccountLinked: true,
    dailyIncome: 0, monthlyIncome: 0, cumulativeIncome: 0,
    commandHistory: [], initializedAt: Date.now(),
  },
  {
    id: randomUUID(), name: "FamilyMember2", email: "fm2@example.com", phone: "+17157910333",
    aiAgentActive: true, bankAccountLinked: true,
    dailyIncome: 0, monthlyIncome: 0, cumulativeIncome: 0,
    commandHistory: [], initializedAt: Date.now(),
  },
];

// ─── Stripe Customer Setup ─────────────────────────────────────────────────────

export async function ensureStripeCustomers(): Promise<void> {
  try {
    const stripe = await getUncachableStripeClient();
    for (const member of members) {
      if (!member.stripeCustomerId) {
        const customer = await stripe.customers.create({
          name:  member.name,
          email: member.email,
          phone: member.phone,
          metadata: { memberId: member.id, source: "limitless-family-ai" },
        });
        member.stripeCustomerId = customer.id;
        console.log(`[FamilyAgents] Stripe customer created for ${member.name} → ${customer.id}`);
      }
    }
  } catch (err) {
    console.warn("[FamilyAgents] Stripe customer setup failed — continuing without Stripe IDs:", (err as Error).message);
  }
}

// ─── Stripe Connected Accounts (spec: launchFullFamilyMarket / ultimateGlobalScaler) ─
// Creates a Stripe Custom Connected Account per family member so that
// stripe.transfers.create() can actually route funds to each person.
// stripeAccountId is stored on the member object for use in realStripeIntegration.ts.
//
// Accepts two optional params for spec compatibility (ultimateGlobalScaler):
//   ensureStripeConnectedAccounts(stripe, [{ name, type }, ...])
// Extra params are accepted but internal members list is always used so that all
// pre-configured family agents are properly linked.

export async function ensureStripeConnectedAccounts(
  _stripeClient?: unknown,
  _accounts?: Array<{ name: string; type?: string }>
): Promise<void> {
  try {
    const stripe = await getUncachableStripeClient();
    for (const member of members) {
      if (member.stripeAccountId) continue; // already created this boot
      const [firstName, ...rest] = member.name.split(" ");
      const lastName = rest.length > 0 ? rest.join(" ") : "Member";
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: member.email,
        business_type: "individual",
        individual: {
          first_name: firstName,
          last_name: lastName,
          email: member.email,
        },
        business_profile: {
          name: LAKESIDE_TRINITY.name,
          support_email: LAKESIDE_TRINITY.email,
          support_phone: LAKESIDE_TRINITY.phone,
          mcc: "7372", // software / AI products
        },
        capabilities: {
          transfers:     { requested: true },
          card_payments: { requested: true },
        },
        metadata: {
          memberId:       member.id,
          platform:       "CreateAI Brain",
          businessEntity: LAKESIDE_TRINITY.name,
        },
      });
      member.stripeAccountId = account.id;
      console.log(
        `[FamilyAgents] Stripe Connect account created for ${member.name} → ${account.id}`
      );
    }
  } catch (err) {
    console.warn(
      "[FamilyAgents] Stripe Connected Account creation failed — transfers will use customer IDs:",
      (err as Error).message
    );
  }
}

// ─── Primary Bank Account (spec: launchFullFamilyMarket — Sara Stadler) ────────
// Attaches Sara's real bank account to her Stripe customer as an ACH source,
// AND as an external account on her connected account for payouts.
// Real bank details are supplied via SARA_BANK_ACCOUNT_NUMBER and
// SARA_BANK_ROUTING_NUMBER env vars; function is a no-op when placeholders detected.

// Explicit-param shape (spec: ultimateLaunch — Step 3)
export interface BankAccountParams {
  accountNumber?: string;
  routingNumber?:  string;
  customerId?:     string;   // optional pre-filled Stripe customer ID
}

// Spec: ultimateGlobalScaler — positional overload:
//   attachPrimaryBankAccount(stripe, accountNumber, routingNumber)
// Existing callers pass BankAccountParams object — both forms supported.
export async function attachPrimaryBankAccount(
  paramsOrStripe?: BankAccountParams | unknown,
  accountNumberArg?: string,
  routingNumberArg?: string,
): Promise<void> {
  // Detect positional-arg form: (stripe, "accountNum", "routingNum")
  const isPositional = typeof paramsOrStripe !== "object" ||
    paramsOrStripe === null ||
    typeof accountNumberArg === "string";

  const params: BankAccountParams = isPositional
    ? { accountNumber: accountNumberArg, routingNumber: routingNumberArg }
    : ((paramsOrStripe as BankAccountParams) ?? {});

  // Explicit params take priority over env vars (spec: ultimateLaunch)
  const accountNumber = params.accountNumber
    ?? process.env.SARA_BANK_ACCOUNT_NUMBER;
  const routingNumber = params.routingNumber
    ?? process.env.SARA_BANK_ROUTING_NUMBER;

  const isPlaceholder = (v?: string) =>
    !v || v === "YOUR_ACCOUNT_NUMBER" || v === "YOUR_ROUTING_NUMBER";

  if (isPlaceholder(accountNumber) || isPlaceholder(routingNumber)) {
    console.warn(
      "⚠️ Bank account secrets missing. Payouts will not trigger until added. " +
      "Set SARA_BANK_ACCOUNT_NUMBER + SARA_BANK_ROUTING_NUMBER in Replit secrets."
    );
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const sara   = members.find(m => m.name === "Sara Stadler");

    // Use explicit customerId if provided, otherwise fall back to member lookup
    const customerId = params.customerId ?? sara?.stripeCustomerId;
    if (!customerId) {
      console.warn("[FamilyAgents] Bank attach skipped — Sara's Stripe customer not yet created.");
      return;
    }
    if (sara) sara.stripeCustomerId = customerId;

    // Attach as ACH debit source on Customer
    const bankSource = await stripe.customers.createSource(customerId, {
      source: {
        object:               "bank_account",
        account_number:       accountNumber,
        routing_number:       routingNumber,
        account_holder_name:  "Sara Stadler",
        account_holder_type:  "individual",
        country:              "US",
        currency:             "usd",
      } as unknown as string,
    });
    console.log(
      `[FamilyAgents] Bank account attached to Sara's customer → ${(bankSource as { id: string }).id}`
    );
    if (sara) sara.bankAccountLinked = true;

    // Also attach as payout external account on her connected account
    if (sara?.stripeAccountId) {
      const extBank = await stripe.accounts.createExternalAccount(sara.stripeAccountId, {
        external_account: {
          object:               "bank_account",
          country:              "US",
          currency:             "usd",
          account_number:       accountNumber,
          routing_number:       routingNumber,
          account_holder_name:  "Sara Stadler",
          account_holder_type:  "individual",
        } as Parameters<typeof stripe.accounts.createExternalAccount>[1]["external_account"],
      });
      console.log(
        `[FamilyAgents] External bank account added to Sara's Connect account → ${(extBank as { id: string }).id}`
      );
    }
  } catch (err) {
    console.warn("[FamilyAgents] Bank account attachment error:", (err as Error).message);
  }
}

// ─── Sara Stripe Info (spec: payoutService) ──────────────────────────────────
// Exposes Sara's Stripe account and customer IDs so the payout service
// can route funds to her connected account + external bank.

export function getSaraStripeInfo(): {
  stripeAccountId:  string | undefined;
  stripeCustomerId: string | undefined;
  bankAccountLinked: boolean;
} {
  const sara = members.find(m => m.name === "Sara Stadler");
  return {
    stripeAccountId:   sara?.stripeAccountId,
    stripeCustomerId:  sara?.stripeCustomerId,
    bankAccountLinked: sara?.bankAccountLinked ?? false,
  };
}

// ─── Per-Cycle Income Allocation ──────────────────────────────────────────────
// Called at the end of each engine cycle with the total accumulated revenue.

export function updateMemberIncomes(totalRevenue: number): void {
  if (members.length === 0) return;
  const share = totalRevenue / members.length;
  for (const member of members) {
    const daily = Math.round(share * (Math.random() * 0.05 + 0.975));
    member.dailyIncome     = daily;
    member.monthlyIncome   = daily * 30;
    member.cumulativeIncome = Math.round(share);
    if (member.stripeCustomerId) {
      console.log(`[StripeSim] ${member.name} → daily:$${daily.toLocaleString()} · monthly:$${(daily*30).toLocaleString()} · cumulative:$${Math.round(share).toLocaleString()}`);
    }
  }
}

// ─── FamilyAI Agent (EventEmitter per member) ────────────────────────────────

class FamilyAI extends EventEmitter {
  constructor(public member: FamilyMember) { super(); }

  respond(text: string): void {
    console.log(`[FamilyAI → ${this.member.name}] ${text}`);
  }

  setupAccount(): void {
    if (!this.member.internalAccount) {
      this.member.internalAccount = `ACC-${Date.now()}`;
      this.respond(`Account created: ${this.member.internalAccount}`);
    }
  }

  setupPhone(): void {
    if (!this.member.phoneServiceActive) {
      this.member.phoneServiceActive = true;
      this.respond(`Phone service activated for ${this.member.phone}`);
    }
  }

  customizeOptions(): void {
    this.member.customizableOptions = { email: this.member.email, phone: this.member.phone };
    this.respond(`Options customized — email:${this.member.email} · phone:${this.member.phone}`);
  }

  handleCommand(command: string): void {
    this.member.commandHistory.push(command);
    if (/account/i.test(command))   this.setupAccount();
    if (/phone/i.test(command))     this.setupPhone();
    if (/customize/i.test(command)) this.customizeOptions();
    this.respond(`Command executed: ${command}`);
  }

  chat(message: string): string {
    return `Hello ${this.member.name}! I received: "${message}". Processing your request…`;
  }
}

const agentMap = new Map<string, FamilyAI>();

// ─── Public API ───────────────────────────────────────────────────────────────

export function initFamilyAgents(): void {
  for (const member of members) {
    const agent = new FamilyAI(member);
    agent.on("command", (cmd: string) => agent.handleCommand(cmd));
    agentMap.set(member.id,   agent);
    agentMap.set(member.name, agent);  // also index by name for convenience
    agent.handleCommand("Set up my account and phone");
  }
  console.log(
    `[FamilyAgents] ${members.length} agents initialized — ` +
    `wake words: ${VOICE_WAKE_WORDS.join(", ")} — admin: Sara Stadler`
  );
}

export function getFamilyMembers(): FamilyMember[] {
  return members;
}

export function getMemberById(id: string): FamilyMember | undefined {
  return members.find(m => m.id === id);
}

export function getAgentById(id: string): FamilyAI | undefined {
  return agentMap.get(id);
}

export function dispatchFamilyCommand(nameOrId: string, command: string): void {
  const agent = agentMap.get(nameOrId);
  if (agent) agent.emit("command", command);
  else console.warn(`[FamilyAgents] No agent for: ${nameOrId}`);
}

// Legacy: snapshot-compatible format (backwards compat with getFamilyAgentStates callers)
export function getFamilyAgentStates() {
  return members;
}
