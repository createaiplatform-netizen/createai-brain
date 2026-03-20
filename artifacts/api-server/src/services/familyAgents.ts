/**
 * familyAgents.ts — Limitless Family Backend + AI Agent + Stripe Integration
 * Spec: fullProduction.ts
 *
 * Each family member has:
 *  - UUID id, aiAgentActive, bankAccountLinked, stripeCustomerId
 *  - dailyIncome, monthlyIncome, cumulativeIncome (updated every engine cycle)
 *  - FamilyAI agent that handles voice commands
 */

import { EventEmitter } from "events";
import { randomUUID }   from "crypto";
import { getUncachableStripeClient } from "./integrations/stripeClient.js";

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
    id: randomUUID(), name: "Sara Stadler", email: "sivh@mail.com", phone: "+18663304895",
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
