/**
 * PlatformRegistry.ts — Frontend Platform Registry
 *
 * A reactive, in-browser registry for all platform items:
 * engines, modules, series, workflows, UI components, routes, and agents.
 *
 * Key features:
 *   - registerItem()     — register + auto-activate in one call
 *   - activateItem()     — set activation state to "on"
 *   - integrateItem()    — mark as integrated into platform
 *   - applyProtections() — add protection flags
 *   - inheritUIRules()   — apply responsive design system rules
 *   - connectToCommandCenter() — wire item to command center
 *
 * Auto-Activation Rule (Founder Tier):
 *   On registerItem(), all 5 steps run automatically:
 *   activate → integrate → protect → inherit UI → connect
 *
 * FounderTier guard:
 *   System-level functions check founderTierActive.
 *   Non-founder callers receive no-op results.
 *
 * Usage:
 *   import { PlatformRegistry } from "@/engine/PlatformRegistry";
 *   PlatformRegistry.registerItem({ id: "my-engine", type: "engine", label: "My Engine" });
 *   PlatformRegistry.getAll(); // → RegistryItem[]
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ItemType =
  | "engine"
  | "module"
  | "series"
  | "workflow"
  | "ui-component"
  | "route"
  | "agent"
  | "system"
  | "platform";

export type ActivationState = "off" | "activating" | "on" | "error";
export type ItemStatus      = "pending" | "active" | "inactive" | "protected" | "integrated" | "error";

export interface RegistryItem {
  id:                     string;
  type:                   ItemType;
  label:                  string;
  status:                 ItemStatus;
  activationState:        ActivationState;
  registeredAt:           string;
  activatedAt:            string | null;
  integratedAt:           string | null;
  protections:            string[];
  uiRules:                string[];
  commandCenterConnected: boolean;
  metadata:               Record<string, unknown>;
}

export interface RegisterInput {
  id:        string;
  type:      ItemType;
  label:     string;
  metadata?: Record<string, unknown>;
}

export interface RegistryEvent {
  type:      "registered" | "activated" | "integrated" | "protected" | "ui-inherited" | "connected" | "deactivated";
  itemId:    string;
  timestamp: string;
  data?:     Record<string, unknown>;
}

// ─── Default UI Rules (Founder Design System) ─────────────────────────────────

export const DEFAULT_UI_RULES = [
  "indigo-accent:#6366f1",
  "mobile-first-layout",
  "glass-topbar",
  "dark-mode-ready",
  "touch-targets-44px",
  "overflow-scroll-y",
  "animate-fade-up",
  "apple-level-polish",
] as const;

// ─── Default Protections ──────────────────────────────────────────────────────

export const DEFAULT_PROTECTIONS = [
  "founder-only",
  "no-replicate",
  "audit-logged",
  "access-controlled",
] as const;

// ─── FounderTier Guard ────────────────────────────────────────────────────────

let _founderTierActive = true; // Defaults to active for Sara

/** Call this from OSContext to sync founder state */
export function setFounderTierActive(active: boolean): void {
  _founderTierActive = active;
}

export function isFounderTier(): boolean {
  return _founderTierActive;
}

// ─── Internal Store ───────────────────────────────────────────────────────────

const _store  = new Map<string, RegistryItem>();
const _events: RegistryEvent[] = [];
const _listeners = new Set<(items: RegistryItem[]) => void>();

function ts(): string {
  return new Date().toISOString();
}

function emit(event: RegistryEvent): void {
  _events.push(event);
  if (_events.length > 500) _events.shift(); // cap event history
}

function notifyListeners(): void {
  const all = Array.from(_store.values());
  for (const fn of _listeners) fn(all);
}

// ─── Pre-seed Built-in Platform Systems ──────────────────────────────────────

const BUILT_IN: Array<Omit<RegistryItem, "registeredAt" | "activatedAt" | "integratedAt">> = [
  { id: "core-os",         label: "Core OS",           type: "system",   status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "ai-engine",       label: "AI Engine",         type: "engine",   status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "brain-hub",       label: "Brain Hub",         type: "module",   status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "command-center",  label: "Command Center",    type: "module",   status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "routing-layer",   label: "Intent Router",     type: "system",   status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "data-layer",      label: "Data Layer (DB)",   type: "system",   status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "api-gateway",     label: "API Gateway",       type: "route",    status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "engine-registry", label: "Engine Registry",   type: "system",   status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "auto-wire",       label: "Auto-Wire System",  type: "system",   status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "protect-layer",   label: "Replication Guard", type: "system",   status: "protected", activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "workflow-engine", label: "Workflow Engine",   type: "workflow", status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "series-runner",   label: "Series Runner",     type: "series",   status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "meta-agents",     label: "Meta-Agents (7)",   type: "agent",    status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "health-os",       label: "HealthOS Platform", type: "platform", status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "staffing-os",     label: "StaffingOS",        type: "platform", status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "legal-pm",        label: "LegalPM",           type: "platform", status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "responsive-ui",   label: "Responsive UI",     type: "ui-component", status: "active", activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "enterprise-audit",label: "Enterprise Audit",  type: "module",   status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "webhook-system",  label: "Webhook System",    type: "module",   status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
  { id: "sso-scaffold",    label: "SSO Scaffold",      type: "module",   status: "active",    activationState: "on", protections: [...DEFAULT_PROTECTIONS], uiRules: [...DEFAULT_UI_RULES], commandCenterConnected: true, metadata: {} },
];

for (const built of BUILT_IN) {
  _store.set(built.id, {
    ...built,
    registeredAt: ts(),
    activatedAt:  ts(),
    integratedAt: ts(),
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * registerItem — register a new item and run the full auto-activation chain.
 *
 * Auto-activation steps (Founder Tier rule):
 *   1. Register → store in registry
 *   2. Activate → activationState = "on"
 *   3. Integrate → mark integratedAt
 *   4. Protect  → apply default protections
 *   5. Inherit UI → apply design system rules
 *   6. Connect  → wire to Command Center
 */
export function registerItem(input: RegisterInput): RegistryItem {
  if (!_founderTierActive) {
    console.warn("[PlatformRegistry] registerItem blocked — Founder Tier inactive");
    throw new Error("Founder Tier required to register platform items");
  }

  const existing = _store.get(input.id);
  if (existing) {
    console.log(`[PlatformRegistry] Already registered: ${input.id}`);
    return existing;
  }

  // Step 1: Register
  const item: RegistryItem = {
    id:                     input.id,
    type:                   input.type,
    label:                  input.label,
    status:                 "pending",
    activationState:        "off",
    registeredAt:           ts(),
    activatedAt:            null,
    integratedAt:           null,
    protections:            [],
    uiRules:                [],
    commandCenterConnected: false,
    metadata:               input.metadata ?? {},
  };
  _store.set(input.id, item);
  emit({ type: "registered", itemId: input.id, timestamp: ts() });
  console.log(`[PlatformRegistry] ✓ Registered: ${input.label} (${input.type})`);

  // Step 2: Activate
  activateItem(input.id);

  // Step 3: Integrate
  integrateItem(input.id);

  // Step 4: Protect
  applyProtections(input.id);

  // Step 5: Inherit UI
  inheritUIRules(input.id);

  // Step 6: Connect to Command Center
  connectToCommandCenter(input.id);

  notifyListeners();
  return _store.get(input.id)!;
}

/**
 * activateItem — set an item's activation state to "on".
 */
export function activateItem(id: string): RegistryItem | null {
  const item = _store.get(id);
  if (!item) {
    console.warn(`[PlatformRegistry] activateItem — not found: ${id}`);
    return null;
  }
  item.activationState = "on";
  item.status          = "active";
  item.activatedAt     = ts();
  _store.set(id, item);
  emit({ type: "activated", itemId: id, timestamp: ts() });
  console.log(`[PlatformRegistry] ✓ Activated: ${item.label}`);
  return item;
}

/**
 * integrateItem — mark an item as integrated into the platform.
 */
export function integrateItem(id: string): RegistryItem | null {
  const item = _store.get(id);
  if (!item) {
    console.warn(`[PlatformRegistry] integrateItem — not found: ${id}`);
    return null;
  }
  item.integratedAt = ts();
  if (item.status !== "protected") item.status = "integrated";
  _store.set(id, item);
  emit({ type: "integrated", itemId: id, timestamp: ts() });
  console.log(`[PlatformRegistry] ✓ Integrated: ${item.label}`);
  return item;
}

/**
 * applyProtections — add protection flags to an item.
 * Pass custom protections or use the platform defaults.
 */
export function applyProtections(
  id: string,
  protections: string[] = [...DEFAULT_PROTECTIONS],
): RegistryItem | null {
  const item = _store.get(id);
  if (!item) {
    console.warn(`[PlatformRegistry] applyProtections — not found: ${id}`);
    return null;
  }
  item.protections = [...new Set([...item.protections, ...protections])];
  item.status      = "protected";
  _store.set(id, item);
  emit({ type: "protected", itemId: id, timestamp: ts(), data: { protections } });
  console.log(`[PlatformRegistry] ✓ Protections applied to: ${item.label} — ${protections.join(", ")}`);
  return item;
}

/**
 * inheritUIRules — apply the platform design system rules to an item.
 */
export function inheritUIRules(
  id: string,
  rules: string[] = [...DEFAULT_UI_RULES],
): RegistryItem | null {
  const item = _store.get(id);
  if (!item) {
    console.warn(`[PlatformRegistry] inheritUIRules — not found: ${id}`);
    return null;
  }
  item.uiRules = [...new Set([...item.uiRules, ...rules])];
  _store.set(id, item);
  emit({ type: "ui-inherited", itemId: id, timestamp: ts(), data: { rules } });
  console.log(`[PlatformRegistry] ✓ UI rules inherited by: ${item.label}`);
  return item;
}

/**
 * connectToCommandCenter — mark an item as wired to the Command Center.
 */
export function connectToCommandCenter(id: string): RegistryItem | null {
  const item = _store.get(id);
  if (!item) {
    console.warn(`[PlatformRegistry] connectToCommandCenter — not found: ${id}`);
    return null;
  }
  item.commandCenterConnected = true;
  _store.set(id, item);
  emit({ type: "connected", itemId: id, timestamp: ts() });
  console.log(`[PlatformRegistry] ✓ Connected to Command Center: ${item.label}`);
  return item;
}

/**
 * deactivateItem — set activation state to "off".
 * Requires Founder Tier.
 */
export function deactivateItem(id: string): RegistryItem | null {
  if (!_founderTierActive) throw new Error("Founder Tier required to deactivate items");

  const item = _store.get(id);
  if (!item) return null;

  item.activationState = "off";
  item.status          = "inactive";
  _store.set(id, item);
  emit({ type: "deactivated", itemId: id, timestamp: ts() });
  console.log(`[PlatformRegistry] ✓ Deactivated: ${item.label}`);
  return item;
}

// ─── Query Helpers ────────────────────────────────────────────────────────────

export function getAll():           RegistryItem[]            { return Array.from(_store.values()); }
export function getById(id: string): RegistryItem | undefined { return _store.get(id); }
export function getByType(type: ItemType): RegistryItem[]     { return getAll().filter(i => i.type === type); }
export function getActive():        RegistryItem[]            { return getAll().filter(i => i.activationState === "on"); }
export function getIntegrated():    RegistryItem[]            { return getAll().filter(i => i.commandCenterConnected); }
export function getProtected():     RegistryItem[]            { return getAll().filter(i => i.protections.length > 0); }

export function getStats() {
  const all  = getAll();
  const byType: Record<string, number> = {};
  for (const item of all) byType[item.type] = (byType[item.type] ?? 0) + 1;

  return {
    total:      all.length,
    active:     all.filter(i => i.activationState === "on").length,
    integrated: all.filter(i => i.commandCenterConnected).length,
    protected:  all.filter(i => i.protections.length > 0).length,
    byType,
  };
}

/** Get the last N events from the event log */
export function getEvents(limit = 50): RegistryEvent[] {
  return _events.slice(-limit);
}

// ─── Subscription ─────────────────────────────────────────────────────────────

/** Subscribe to registry changes. Returns an unsubscribe function. */
export function subscribe(fn: (items: RegistryItem[]) => void): () => void {
  _listeners.add(fn);
  fn(getAll()); // emit current state immediately
  return () => _listeners.delete(fn);
}

// ─── Namespace export (singleton pattern) ────────────────────────────────────

export const PlatformRegistry = {
  // Registration + auto-activation
  registerItem,
  activateItem,
  integrateItem,
  applyProtections,
  inheritUIRules,
  connectToCommandCenter,
  deactivateItem,

  // Queries
  getAll,
  getById,
  getByType,
  getActive,
  getIntegrated,
  getProtected,
  getStats,
  getEvents,

  // Subscription
  subscribe,

  // Founder Tier
  isFounderTier,
  setFounderTierActive,
} as const;

export default PlatformRegistry;
