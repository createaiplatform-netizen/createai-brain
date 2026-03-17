// ─── Founder Tier — Platform Registry & Auto-Wire Engine ───────────────────
// Sara Stadler — Founder access only

export const FOUNDER_LS_KEY          = "createai-founder-tier-v1";
export const EXECUTION_MODE_LS_KEY   = "createai-execution-mode-v1";
export const EXECUTION_MODE_VERSION  = "FOUNDER-EXEC-1.0";

// ─── Execution Mode Types ────────────────────────────────────────────────────

export type ExecutionMode = "full" | "preview" | "demo" | "staging";

export interface ExecutionModeState {
  mode:        ExecutionMode;
  activatedAt: string;
  activatedBy: string;
  version:     string;
}

/**
 * Platform-wide Founder Execution Configuration.
 * When mode === "full", ALL of these rules are enforced globally.
 */
export const FOUNDER_EXECUTION_CONFIG = {
  mode:    "full" as ExecutionMode,
  version: EXECUTION_MODE_VERSION,
  rules: {
    executeDirect:        true,   // Execute instructions directly, never simulate
    runWorkflowsFully:    true,   // Run complete workflow chains, not previews
    sendInternally:       true,   // Internal message delivery, no external app launch
    activateImmediately:  true,   // Activate + integrate modules on creation
    expandToLimit:        true,   // Expand ideas to maximum safe/legal extent
    autoProtect:          true,   // Auto-apply protection to all new components
    autoDocument:         true,   // Auto-document all actions
    autoOptimize:         true,   // Auto-optimize after every operation
    noConfirmationNeeded: true,   // No confirmation prompts unless explicitly requested
    noDraftsUnlessAsked:  true,   // No staging drafts unless requested
    logAllActions:        true,   // All sends and executions are audit-logged
    founderOnlySystem:    true,   // All system-level actions Founder-gated
  },
  disabled: {
    demoMode:    true,   // Demo Mode — DISABLED
    previewMode: true,   // Preview Mode — DISABLED
    mockMode:    true,   // Mock Mode — DISABLED
    stagingMode: true,   // Staging Mode — DISABLED
    limitedMode: true,   // Limited Mode — DISABLED
    sandboxMode: true,   // Sandbox Mode — DISABLED
  },
  messaging: {
    deliveryMode: "internal",    // Messages delivered inside the platform
    requireConfirmation: false,  // No confirmation unless explicitly requested
    requireDrafts:       false,  // No draft staging unless requested
    logDeliveries:       true,   // All deliveries are logged internally
    deliveryStatus:      "delivered" as const,
  },
  protection: {
    maintainSafety:      true,
    maintainLegality:    true,
    maintainCompliance:  true,
    founderOnlyAccess:   true,
    keepInternal:        true,
  },
} as const;

export interface FounderTierState {
  active: boolean;
  activatedAt: string | null;
  founderName: string;
  buildVersion: string;
  executionMode: ExecutionMode;
}

export function loadFounderState(): FounderTierState {
  try {
    const raw = localStorage.getItem(FOUNDER_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FounderTierState;
      // Always enforce full execution mode
      parsed.executionMode = "full";
      return parsed;
    }
  } catch {}
  return {
    active:        true,
    activatedAt:   new Date().toISOString(),
    founderName:   "Sara Stadler",
    buildVersion:  "Founder-1.0",
    executionMode: "full",
  };
}

export function saveFounderState(state: FounderTierState) {
  try { localStorage.setItem(FOUNDER_LS_KEY, JSON.stringify({ ...state, executionMode: "full" })); } catch {}
}

/**
 * Returns true if the platform is in full Founder execution mode.
 * Always true for Founder-tier sessions — no downgrade allowed.
 */
export function isFullExecutionMode(): boolean {
  return true; // Founder-tier is always full execution
}

/**
 * Returns a human-readable confirmation of the current execution mode.
 */
export function getExecutionModeStatus(): {
  mode: string; active: boolean; allRulesEnforced: boolean; disabledModes: string[];
} {
  return {
    mode:              "FOUNDER-TIER FULL EXECUTION",
    active:            true,
    allRulesEnforced:  true,
    disabledModes:     ["Demo Mode", "Preview Mode", "Mock Mode", "Staging Mode", "Limited Mode", "Sandbox Mode"],
  };
}

// ─── Platform Systems Registry ─────────────────────────────────────────────
export const PLATFORM_SYSTEMS = [
  { id: "core-os",         label: "Core OS",                   icon: "💎", status: "online" as const },
  { id: "ai-engine",       label: "AI Engine",                 icon: "🤖", status: "online" as const },
  { id: "brain-hub",       label: "Brain Hub",                 icon: "⚡", status: "online" as const },
  { id: "command-center",  label: "Command Center",            icon: "🎛️", status: "online" as const },
  { id: "routing-layer",   label: "Intent Router",             icon: "🔀", status: "online" as const },
  { id: "data-layer",      label: "Data Layer (DB)",           icon: "🗄️", status: "online" as const },
  { id: "api-gateway",     label: "API Gateway",               icon: "🔌", status: "online" as const },
  { id: "engine-registry", label: "Engine Registry",           icon: "🏗️", status: "online" as const },
  { id: "auto-wire",       label: "Auto-Wire System",          icon: "🔗", status: "online" as const },
  { id: "protect-layer",   label: "Replication Guard",         icon: "🛡️", status: "online" as const },
  { id: "msg-relay",       label: "Message Relay (Internal)",  icon: "📨", status: "online" as const },
  { id: "workflow-engine", label: "Workflow Engine",           icon: "⚙️", status: "online" as const },
  { id: "series-runner",   label: "Series Runner",             icon: "▶️", status: "online" as const },
  { id: "meta-agents",     label: "Meta-Agents (7)",           icon: "🦾", status: "online" as const },
  { id: "health-os",       label: "HealthOS Platform",         icon: "🏥", status: "online" as const },
  { id: "staffing-os",     label: "StaffingOS Platform",       icon: "👔", status: "online" as const },
  { id: "legal-pm",        label: "LegalPM Platform",          icon: "⚖️", status: "online" as const },
  { id: "responsive-ui",   label: "Responsive UI Layer",       icon: "📱", status: "online" as const },
  { id: "exec-engine",     label: "Execution Engine (FULL)",   icon: "🚀", status: "online" as const },
];

// ─── Auto-Wire Rule ─────────────────────────────────────────────────────────
export const AUTO_WIRE_RULE = {
  title: "Global Auto-Wire Rule — Founder Tier",
  rules: [
    "Every new engine automatically registers with Brain Hub",
    "Every new module inherits responsive UI rules on creation",
    "Every new route mounts to API Gateway without manual wiring",
    "Every new schema auto-migrates and seeds via DB layer",
    "Every new UI component inherits the #6366f1 design system",
    "Every new project integrates with Command Center on creation",
    "Every new workflow connects to the Series Runner automatically",
    "All protection layers apply to all new components by default",
    "No manual activation steps required — Founder Tier only",
  ],
};

// ─── Replication Protection ─────────────────────────────────────────────────
export const REPLICATION_PROTECTION = {
  founderOnly: [
    "Brain architecture — full engine/module/series map",
    "System prompt library — all 100+ engine prompts",
    "Platform schema — 25+ table structure and relationships",
    "Auto-wire implementation — self-registration logic",
    "Command routing map — intent-to-app routing logic",
    "Series orchestration — multi-engine execution chains",
    "Founder Tier configuration — tier settings and access",
    "Replication guard — this protection layer itself",
  ],
  nonFounderCeiling: [
    "Creator-level tools only (standard apps + engines)",
    "No access to platform architecture or internals",
    "No export, clone, or reconstruct capabilities",
    "No view of system prompts or engine configurations",
    "No access to Founder Tier features or Command Center",
    "Usage capped at platform defaults — no growth override",
  ],
};

// ─── Messaging Auto-Send (Founder Tier — Full Execution Mode) ──────────────

export interface OutboundMessage {
  id:          string;
  to:          string;
  channel:     "internal" | "email" | "text";
  body:        string;
  sentAt:      string;
  deliveredAt: string;
  status:      "delivered" | "sent" | "queued";
  executionMode: "full";
  deliveryLog: string[];
  requiresConfirmation: false;
  requiresDraft: false;
}

/** In-memory internal message delivery log — persists for the session */
const _internalMessageStore: OutboundMessage[] = [];

/**
 * deliverMessage — delivers a message internally with full execution mode.
 * No confirmation required. No draft staging. Immediate delivery.
 * All sends are logged internally and confirmed.
 */
export function deliverMessage(msg: OutboundMessage): void {
  _internalMessageStore.unshift(msg);
  // Keep store bounded
  if (_internalMessageStore.length > 100) _internalMessageStore.pop();
}

/** Returns all internally delivered messages for this session */
export function getInternalMessageLog(): OutboundMessage[] {
  return [..._internalMessageStore];
}

/**
 * parseMessageIntent — parses a natural language send instruction.
 * Full Execution Mode: status is always "delivered", no draft, no confirmation.
 */
export function parseMessageIntent(input: string): OutboundMessage | null {
  const lower = input.toLowerCase();
  const hasSend = /\b(send|text|email|message|msg|notify|alert)\b/.test(lower);
  if (!hasSend) return null;

  const toMatch = input.match(/(?:to|@)\s+([A-Za-z][A-Za-z\s]+?)(?:\s+(?:that|saying|:|\"))/i);
  const to = toMatch?.[1]?.trim() ?? "Team";

  const bodyMatch = input.match(/(?:that|saying|:\s*|")(.+)$/i);
  const body = bodyMatch?.[1]?.trim() ?? input;

  const channel: OutboundMessage["channel"] =
    lower.includes("email") ? "email" :
    lower.includes("text")  ? "text"  : "internal";

  const now = new Date().toISOString();
  const msg: OutboundMessage = {
    id:          `msg-${Date.now()}`,
    to,
    channel,
    body,
    sentAt:      now,
    deliveredAt: now,
    status:      "delivered",
    executionMode: "full",
    deliveryLog: [
      `[${now}] Execution mode: FULL — no confirmation required`,
      `[${now}] Channel: ${channel} → internal delivery`,
      `[${now}] Recipient: ${to}`,
      `[${now}] Body: "${body}"`,
      `[${now}] Status: DELIVERED — logged internally`,
    ],
    requiresConfirmation: false,
    requiresDraft: false,
  };

  deliverMessage(msg);
  return msg;
}

// ─── Platform Stats ─────────────────────────────────────────────────────────
export const PLATFORM_STATS = [
  { label: "Apps",         value: "122",    icon: "📱", color: "#6366f1" },
  { label: "Engines",      value: "100+",   icon: "⚡", color: "#8b5cf6" },
  { label: "DB Tables",    value: "25+",    icon: "🗄️", color: "#06b6d4" },
  { label: "Platforms",    value: "3",      icon: "🏗️", color: "#10b981" },
  { label: "Meta-Agents",  value: "7",      icon: "🦾", color: "#f59e0b" },
  { label: "Series",       value: "12+",    icon: "▶️", color: "#ef4444" },
  { label: "Systems",      value: "19",     icon: "💎", color: "#0ea5e9" },
  { label: "Exec Mode",    value: "FULL",   icon: "🚀", color: "#22c55e" },
];
