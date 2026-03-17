// ─── Founder Tier — Platform Registry & Auto-Wire Engine ───────────────────
// Sara Stadler — Founder access only

export const FOUNDER_LS_KEY = "createai-founder-tier-v1";

export interface FounderTierState {
  active: boolean;
  activatedAt: string | null;
  founderName: string;
  buildVersion: string;
}

export function loadFounderState(): FounderTierState {
  try {
    const raw = localStorage.getItem(FOUNDER_LS_KEY);
    if (raw) return JSON.parse(raw) as FounderTierState;
  } catch {}
  return { active: true, activatedAt: new Date().toISOString(), founderName: "Sara Stadler", buildVersion: "Founder-1.0" };
}

export function saveFounderState(state: FounderTierState) {
  try { localStorage.setItem(FOUNDER_LS_KEY, JSON.stringify(state)); } catch {}
}

// ─── Platform Systems Registry ─────────────────────────────────────────────
export const PLATFORM_SYSTEMS = [
  { id: "core-os",         label: "Core OS",             icon: "💎", status: "online" as const },
  { id: "ai-engine",       label: "AI Engine",           icon: "🤖", status: "online" as const },
  { id: "brain-hub",       label: "Brain Hub",           icon: "⚡", status: "online" as const },
  { id: "command-center",  label: "Command Center",      icon: "🎛️", status: "online" as const },
  { id: "routing-layer",   label: "Intent Router",       icon: "🔀", status: "online" as const },
  { id: "data-layer",      label: "Data Layer (DB)",     icon: "🗄️", status: "online" as const },
  { id: "api-gateway",     label: "API Gateway",         icon: "🔌", status: "online" as const },
  { id: "engine-registry", label: "Engine Registry",     icon: "🏗️", status: "online" as const },
  { id: "auto-wire",       label: "Auto-Wire System",    icon: "🔗", status: "online" as const },
  { id: "protect-layer",   label: "Replication Guard",   icon: "🛡️", status: "online" as const },
  { id: "msg-relay",       label: "Message Relay",       icon: "📨", status: "online" as const },
  { id: "workflow-engine", label: "Workflow Engine",     icon: "⚙️", status: "online" as const },
  { id: "series-runner",   label: "Series Runner",       icon: "▶️", status: "online" as const },
  { id: "meta-agents",     label: "Meta-Agents (7)",     icon: "🦾", status: "online" as const },
  { id: "health-os",       label: "HealthOS Platform",   icon: "🏥", status: "online" as const },
  { id: "staffing-os",     label: "StaffingOS Platform", icon: "👔", status: "online" as const },
  { id: "legal-pm",        label: "LegalPM Platform",    icon: "⚖️", status: "online" as const },
  { id: "responsive-ui",   label: "Responsive UI Layer", icon: "📱", status: "online" as const },
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

// ─── Messaging Auto-Send (Founder Tier) ────────────────────────────────────
export interface OutboundMessage {
  to: string;
  channel: "internal" | "email" | "text";
  body: string;
  sentAt: string;
  status: "sent" | "queued";
}

export function parseMessageIntent(input: string): OutboundMessage | null {
  const lower = input.toLowerCase();
  const hasSend  = /\b(send|text|email|message|msg)\b/.test(lower);
  if (!hasSend) return null;

  const toMatch = input.match(/(?:to|@)\s+([A-Za-z][A-Za-z\s]+?)(?:\s+(?:that|saying|:|\"))/i);
  const to = toMatch?.[1]?.trim() ?? "Team";

  const bodyMatch = input.match(/(?:that|saying|:\s*|")(.+)$/i);
  const body = bodyMatch?.[1]?.trim() ?? input;

  const channel: OutboundMessage["channel"] =
    lower.includes("email") ? "email" :
    lower.includes("text")  ? "text"  : "internal";

  return { to, channel, body, sentAt: new Date().toISOString(), status: "sent" };
}

// ─── Platform Stats ─────────────────────────────────────────────────────────
export const PLATFORM_STATS = [
  { label: "Apps",         value: "122",    icon: "📱", color: "#6366f1" },
  { label: "Engines",      value: "100+",   icon: "⚡", color: "#8b5cf6" },
  { label: "DB Tables",    value: "25+",    icon: "🗄️", color: "#06b6d4" },
  { label: "Platforms",    value: "3",      icon: "🏗️", color: "#10b981" },
  { label: "Meta-Agents",  value: "7",      icon: "🦾", color: "#f59e0b" },
  { label: "Series",       value: "12+",    icon: "▶️", color: "#ef4444" },
  { label: "Systems",      value: "18",     icon: "💎", color: "#0ea5e9" },
  { label: "Protection",   value: "ACTIVE", icon: "🛡️", color: "#22c55e" },
];
