/**
 * familyAgents.ts — FamilyAI agent system
 * Spec: limitlessFamilyAIFull.ts
 *
 * Initializes one AI agent per family member at boot. Each agent:
 *  - handles voice commands (setupAccount, setupPhone, customizeOptions)
 *  - maintains per-member state (internalAccount, phoneServiceActive, commandHistory)
 *  - responds via console log (in production: Twilio/Resend)
 */

import { EventEmitter } from "events";

// ─── Config ──────────────────────────────────────────────────────────────────

export const FAMILY_MEMBERS = [
  { name: "FamilyMember1", email: "fm1@example.com", phone: "+17157910292" },
  { name: "FamilyMember2", email: "fm2@example.com", phone: "+17157910333" },
  { name: "Sara Stadler",  email: "sivh@mail.com",   phone: "+18663304895" },
] as const;

export const VOICE_WAKE_WORDS = ["Nova", "Atlas", "Aurora"] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberState {
  name:                 string;
  email:                string;
  phone:                string;
  internalAccount?:     string;
  phoneServiceActive?:  boolean;
  customizableOptions?: { email: string; phone: string };
  commandHistory:       string[];
  initializedAt:        number;
}

// ─── FamilyAI Agent ───────────────────────────────────────────────────────────

class FamilyAI extends EventEmitter {
  state: MemberState;

  constructor(member: { name: string; email: string; phone: string }) {
    super();
    this.state = { ...member, commandHistory: [], initializedAt: Date.now() };
  }

  respond(text: string): void {
    console.log(`[FamilyAI → ${this.state.name}] ${text}`);
  }

  setupAccount(): void {
    if (!this.state.internalAccount) {
      this.state.internalAccount = `ACC-${Date.now()}`;
      this.respond(`Account created: ${this.state.internalAccount}`);
    }
  }

  setupPhone(): void {
    if (!this.state.phoneServiceActive) {
      this.state.phoneServiceActive = true;
      this.respond(`Phone service activated for ${this.state.phone}`);
    }
  }

  customizeOptions(): void {
    this.state.customizableOptions = { email: this.state.email, phone: this.state.phone };
    this.respond(`Options customized — email: ${this.state.email} · phone: ${this.state.phone}`);
  }

  handleCommand(command: string): void {
    this.state.commandHistory.push(command);
    if (/account/i.test(command))   this.setupAccount();
    if (/phone/i.test(command))     this.setupPhone();
    if (/customize/i.test(command)) this.customizeOptions();
    this.respond(`Command executed: ${command}`);
  }
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const agentMap = new Map<string, FamilyAI>();

export function initFamilyAgents(): void {
  for (const member of FAMILY_MEMBERS) {
    const agent = new FamilyAI(member);
    agent.on("command", (cmd: string) => agent.handleCommand(cmd));
    agentMap.set(member.name, agent);
    // Bootstrap: run the default cold-start command for each member
    agent.handleCommand("Set up my account and phone");
  }
  console.log(
    `[FamilyAgents] ${FAMILY_MEMBERS.length} agents initialized — ` +
    `wake words: ${VOICE_WAKE_WORDS.join(", ")} — ` +
    `admin: Sara Stadler`
  );
}

export function getFamilyAgentStates(): MemberState[] {
  return [...agentMap.values()].map(a => a.state);
}

export function dispatchFamilyCommand(memberName: string, command: string): void {
  const agent = agentMap.get(memberName);
  if (agent) agent.emit("command", command);
  else console.warn(`[FamilyAgents] No agent for member: ${memberName}`);
}
