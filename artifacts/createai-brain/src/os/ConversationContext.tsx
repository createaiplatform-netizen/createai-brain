// ═══════════════════════════════════════════════════════════════════════════
// CONVERSATION CONTEXT — wraps entire OS
// All conversations are INTERNAL, MOCK, DEMO-ONLY.
// ═══════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  ConversationEngine,
  ConversationMessage,
  TestSession,
  IntentType,
  DetectedIntent,
} from "@/engine/ConversationEngine";
import { useInteraction } from "./InteractionContext";
import { UniversalView, DemoStatus } from "@/engine/InteractionEngine";
import { triggerInviteOpen } from "@/engine/InviteGeneratorBridge";

interface ConversationCtx {
  history:     ConversationMessage[];
  testSession: TestSession;
  lastIntent:  IntentType | null;
  isOpen:      boolean;
  isExpanded:  boolean;
  unread:      number;
  setOpen:     (open: boolean) => void;
  setExpanded: (exp: boolean)  => void;
  send:        (text: string)  => DetectedIntent;
  clear:       ()              => void;
  refresh:     ()              => void;
}

const Ctx = createContext<ConversationCtx | null>(null);

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const interaction = useInteraction();
  const [history,     setHistory]     = useState<ConversationMessage[]>(() => ConversationEngine.getHistory());
  const [testSession, setTestSession] = useState<TestSession>(() => ConversationEngine.getTestSession());
  const [lastIntent,  setLastIntent]  = useState<IntentType | null>(null);
  const [isOpen,      setOpen]        = useState(false);
  const [isExpanded,  setExpanded]    = useState(false);
  const [unread,      setUnread]      = useState(0);

  const refresh = useCallback(() => {
    setHistory(ConversationEngine.getHistory());
    setTestSession(ConversationEngine.getTestSession());
    setLastIntent(ConversationEngine.getLastIntent());
  }, []);

  const send = useCallback((text: string): DetectedIntent => {
    const result = ConversationEngine.process(text);
    const { intent, resetState } = result;

    // Apply state updates triggered by the conversation
    if (intent.stateUpdate) {
      if (intent.stateUpdate.currentRole)       interaction.setRole(intent.stateUpdate.currentRole);
      if (intent.stateUpdate.currentDepartment) interaction.setDepartment(intent.stateUpdate.currentDepartment);
      if (intent.stateUpdate.currentAgency)     interaction.setAgency(intent.stateUpdate.currentAgency);
      if (intent.stateUpdate.currentState)      interaction.setState(intent.stateUpdate.currentState);
      if (intent.stateUpdate.currentVendor)     interaction.setVendor(intent.stateUpdate.currentVendor);
      // Universal Everything Engine fields
      if (intent.stateUpdate.currentIndustry)   interaction.setIndustry(intent.stateUpdate.currentIndustry);
      if (intent.stateUpdate.currentCountry)    interaction.setCountry(intent.stateUpdate.currentCountry);
      if (intent.stateUpdate.currentDomain)     interaction.setDomain(intent.stateUpdate.currentDomain);
      if (intent.stateUpdate.currentMode)       interaction.setMode(intent.stateUpdate.currentMode);
      if (intent.stateUpdate.currentScenario)   interaction.setScenario(intent.stateUpdate.currentScenario);
    }

    // Navigate if needed
    if (intent.screen) {
      interaction.setView(intent.screen as UniversalView);
    }

    // Reset
    if (resetState) {
      interaction.reset();
    }

    // Open Invite Generator popup if intent matches
    if (intent.intent === "generate-invite") {
      setTimeout(triggerInviteOpen, 300);
    }

    // Log action
    interaction.dispatch(`CONVO:${intent.intent.toUpperCase()}`, text.slice(0, 60));

    refresh();

    if (!isOpen) setUnread(n => n + 1);

    return intent;
  }, [interaction, isOpen, refresh]);

  const clear = useCallback(() => {
    ConversationEngine.clearHistory();
    refresh();
    setUnread(0);
  }, [refresh]);

  const handleOpen = useCallback((open: boolean) => {
    setOpen(open);
    if (open) setUnread(0);
  }, []);

  return (
    <Ctx.Provider value={{
      history, testSession, lastIntent, isOpen, isExpanded, unread,
      setOpen: handleOpen, setExpanded, send, clear, refresh,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useConversation(): ConversationCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConversation must be used inside ConversationProvider");
  return ctx;
}
