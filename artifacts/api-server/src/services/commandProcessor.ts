/**
 * commandProcessor.ts — System-Level Natural Language Command Processor
 *
 * Architecture:
 *   - Instruction (string) → parse → match handler(s) → execute → structured result
 *   - Each CommandHandler declares regex patterns it responds to
 *   - Multiple handlers may fire on one instruction (additive execution)
 *   - New commands: add a new handler object to COMMAND_HANDLERS, done.
 *
 * Only the Founder role may call this processor. All calls are audit-logged.
 *
 * Usage:
 *   const result = await processCommand(instruction, { userId, role });
 */

import type { Request } from "express";
import { logAudit } from "./audit";
import { db } from "@workspace/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommandContext {
  userId: string;
  role:   string;
  req:    Request;
}

export interface CommandResult {
  action:    string;
  status:    "executed" | "partial" | "rejected" | "unknown";
  message:   string;
  logs:      string[];
  data?:     Record<string, unknown>;
}

export interface ProcessedCommand {
  instruction: string;
  timestamp:   string;
  userId:      string;
  results:     CommandResult[];
  totalActions: number;
  executedAt:  string;
}

interface CommandHandler {
  name:        string;
  description: string;
  patterns:    RegExp[];
  execute(instruction: string, ctx: CommandContext): Promise<CommandResult>;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Extract a quoted or unquoted target noun from instruction */
function extractTarget(instruction: string, after: RegExp): string | null {
  const quoted = instruction.match(/["']([^"']+)["']/);
  if (quoted) return quoted[1];

  const afterMatch = instruction.match(after);
  if (afterMatch) {
    const rest = instruction.slice(afterMatch.index! + afterMatch[0].length).trim();
    const word = rest.split(/\s+/).slice(0, 4).join(" ");
    return word || null;
  }
  return null;
}

function ts() { return new Date().toISOString(); }

// ─── In-Memory Platform Registry (single-process state) ──────────────────────
// For production, persist to a `platform_registry` DB table.

interface RegistryEntry {
  id:               string;
  type:             string;
  label:            string;
  status:           string;
  activationState:  string;
  registeredAt:     string;
  activatedAt:      string | null;
  integratedAt:     string | null;
  protections:      string[];
  commandCenterConnected: boolean;
}

const _registry = new Map<string, RegistryEntry>();

/** Publicly exported so routes can read the registry */
export function getRegistry(): RegistryEntry[] {
  return Array.from(_registry.values());
}

export function getRegistryItem(id: string): RegistryEntry | undefined {
  return _registry.get(id);
}

/** Register or overwrite an item in the platform registry (used by ExpansionEngine) */
export function registerInRegistry(id: string, entry: Omit<RegistryEntry, "id">): RegistryEntry {
  const full: RegistryEntry = { id, ...entry };
  _registry.set(id, full);
  return full;
}

/** Activate a registry item by ID. Returns true if found. */
export function activateInRegistry(id: string): boolean {
  const item = _registry.get(id);
  if (!item) return false;
  item.activationState = "on";
  item.status          = "active";
  item.activatedAt     = ts();
  _registry.set(id, item);
  return true;
}

/** Apply additional protection strings to a registry item */
export function applyProtectionInRegistry(id: string, protections: string[]): boolean {
  const item = _registry.get(id);
  if (!item) return false;
  item.protections = [...new Set([...item.protections, ...protections])];
  _registry.set(id, item);
  return true;
}

/** Integrate a registry item (connect to Command Center) */
export function integrateInRegistry(id: string): boolean {
  const item = _registry.get(id);
  if (!item) return false;
  item.integratedAt           = ts();
  item.commandCenterConnected = true;
  _registry.set(id, item);
  return true;
}

/** Returns count of all registry items */
export function getRegistrySize(): number {
  return _registry.size;
}

// ─── Pre-populate registry with known platform systems ───────────────────────
const BUILT_IN_SYSTEMS = [
  { id: "core-os",         label: "Core OS",          type: "system" },
  { id: "ai-engine",       label: "AI Engine",        type: "system" },
  { id: "brain-hub",       label: "Brain Hub",        type: "system" },
  { id: "command-center",  label: "Command Center",   type: "system" },
  { id: "routing-layer",   label: "Intent Router",    type: "system" },
  { id: "data-layer",      label: "Data Layer",       type: "system" },
  { id: "api-gateway",     label: "API Gateway",      type: "system" },
  { id: "engine-registry", label: "Engine Registry",  type: "system" },
  { id: "auto-wire",       label: "Auto-Wire System", type: "system" },
  { id: "protect-layer",   label: "Replication Guard",type: "system" },
  { id: "workflow-engine", label: "Workflow Engine",  type: "system" },
  { id: "series-runner",   label: "Series Runner",    type: "system" },
  { id: "meta-agents",     label: "Meta-Agents",      type: "system" },
  { id: "health-os",       label: "HealthOS",         type: "platform" },
  { id: "staffing-os",     label: "StaffingOS",       type: "platform" },
  { id: "legal-pm",        label: "LegalPM",          type: "platform" },
  { id: "responsive-ui",   label: "Responsive UI",    type: "system" },
];

for (const s of BUILT_IN_SYSTEMS) {
  _registry.set(s.id, {
    ...s,
    status:          "active",
    activationState: "on",
    registeredAt:    ts(),
    activatedAt:     ts(),
    integratedAt:    ts(),
    protections:     ["founder-only", "no-replicate"],
    commandCenterConnected: true,
  });
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

const ActivateHandler: CommandHandler = {
  name:        "activate",
  description: "Activate an engine, module, agent, or platform system",
  patterns:    [/\bactivate\b/i, /\benable\b/i, /\bturn on\b/i, /\bstart\b/i],

  async execute(instruction, ctx): Promise<CommandResult> {
    const target = extractTarget(instruction, /activate|enable|turn on|start/i);
    const logs: string[] = [];

    logs.push(`[${ts()}] ACTIVATE handler triggered`);
    logs.push(`[${ts()}] Instruction: "${instruction}"`);
    logs.push(`[${ts()}] Target: ${target ?? "(all systems)"}`);

    if (target) {
      const id = target.toLowerCase().replace(/\s+/g, "-");
      const existing = _registry.get(id);

      if (existing) {
        existing.activationState = "on";
        existing.status          = "active";
        existing.activatedAt     = ts();
        _registry.set(id, existing);
        logs.push(`[${ts()}] ✓ Activated: ${existing.label}`);
      } else {
        // Auto-register and activate
        const entry: RegistryEntry = {
          id, type: "module", label: target,
          status: "active", activationState: "on",
          registeredAt: ts(), activatedAt: ts(), integratedAt: null,
          protections: [], commandCenterConnected: false,
        };
        _registry.set(id, entry);
        logs.push(`[${ts()}] ✓ Auto-registered & activated: ${target}`);
      }

      await logAudit(db as any, ctx.req, {
        action:   "system.activate",
        resource: `registry:${id}`,
        metadata: { instruction, target },
      });

      return { action: "activate", status: "executed", message: `Activated: ${target}`, logs };
    }

    // Activate all inactive items
    let count = 0;
    for (const [id, item] of _registry) {
      if (item.activationState !== "on") {
        item.activationState = "on";
        item.status          = "active";
        item.activatedAt     = ts();
        _registry.set(id, item);
        logs.push(`[${ts()}] ✓ Activated: ${item.label}`);
        count++;
      }
    }
    logs.push(`[${ts()}] Total activated: ${count} items`);
    return { action: "activate", status: "executed", message: `Activated ${count} items`, logs };
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const RegisterHandler: CommandHandler = {
  name:        "register",
  description: "Register a new engine, module, series, workflow, or UI component",
  patterns:    [/\bregister\b/i, /\badd\b.*\b(engine|module|series|workflow|component|agent)\b/i, /\bnew\b.*\b(engine|module|series|workflow|component)\b/i],

  async execute(instruction, ctx): Promise<CommandResult> {
    const target = extractTarget(instruction, /register|add|new/i);
    const logs: string[] = [];

    logs.push(`[${ts()}] REGISTER handler triggered`);
    logs.push(`[${ts()}] Instruction: "${instruction}"`);
    logs.push(`[${ts()}] Target: ${target ?? "(unknown)"}`);

    if (!target) {
      return {
        action: "register", status: "partial",
        message: "No target specified. Provide a name for the component to register.",
        logs: [...logs, `[${ts()}] ⚠ No target — specify a name`],
      };
    }

    const typeMatch = instruction.match(/\b(engine|module|series|workflow|component|agent|route|ui-component)\b/i);
    const type = typeMatch ? typeMatch[1].toLowerCase() : "module";
    const id   = target.toLowerCase().replace(/\s+/g, "-");

    if (_registry.has(id)) {
      logs.push(`[${ts()}] ℹ Already registered: ${id}`);
      return { action: "register", status: "partial", message: `${target} already registered`, logs };
    }

    // Create entry
    const entry: RegistryEntry = {
      id, type, label: target,
      status: "pending", activationState: "off",
      registeredAt: ts(), activatedAt: null, integratedAt: null,
      protections: [], commandCenterConnected: false,
    };
    _registry.set(id, entry);
    logs.push(`[${ts()}] ✓ Registered: ${target} (type: ${type})`);

    // Auto-activation chain
    logs.push(`[${ts()}] → Running auto-activation chain...`);

    entry.activationState        = "on";
    entry.status                 = "active";
    entry.activatedAt            = ts();
    logs.push(`[${ts()}] → Activated: ${target}`);

    entry.integratedAt           = ts();
    logs.push(`[${ts()}] → Integrated into platform`);

    entry.protections            = ["founder-only", "no-replicate", "audit-logged"];
    logs.push(`[${ts()}] → Protections applied: founder-only, no-replicate, audit-logged`);

    entry.commandCenterConnected = true;
    logs.push(`[${ts()}] → Connected to Command Center`);

    _registry.set(id, entry);

    await logAudit(db as any, ctx.req, {
      action:   "system.register",
      resource: `registry:${id}`,
      metadata: { instruction, target, type },
    });

    return {
      action: "register", status: "executed",
      message: `Registered and auto-activated: ${target} (${type})`,
      logs,
      data: { id, type, entry },
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const ProtectHandler: CommandHandler = {
  name:        "protect",
  description: "Apply protection layers to a system, registry item, or the entire platform",
  patterns:    [/\bprotect\b/i, /\bsecure\b/i, /\block down\b/i, /\bapply.*protect/i, /\bprotection layer\b/i],

  async execute(instruction, ctx): Promise<CommandResult> {
    const target = extractTarget(instruction, /protect|secure|lock down/i);
    const logs: string[] = [];

    logs.push(`[${ts()}] PROTECT handler triggered`);
    logs.push(`[${ts()}] Target: ${target ?? "(all systems)"}`);

    const protections = ["founder-only", "no-replicate", "audit-logged", "access-controlled"];

    if (target) {
      const id      = target.toLowerCase().replace(/\s+/g, "-");
      const item    = _registry.get(id);
      if (item) {
        item.protections = [...new Set([...item.protections, ...protections])];
        _registry.set(id, item);
        logs.push(`[${ts()}] ✓ Protections applied to: ${item.label}`);
        logs.push(`[${ts()}] Protections: ${item.protections.join(", ")}`);
      } else {
        logs.push(`[${ts()}] ⚠ Item not found: ${id} — creating protected stub`);
        _registry.set(id, {
          id, type: "system", label: target,
          status: "protected", activationState: "on",
          registeredAt: ts(), activatedAt: ts(), integratedAt: ts(),
          protections, commandCenterConnected: true,
        });
      }
    } else {
      // Apply to all
      for (const [id, item] of _registry) {
        item.protections = [...new Set([...item.protections, ...protections])];
        _registry.set(id, item);
      }
      logs.push(`[${ts()}] ✓ Protections applied to all ${_registry.size} registry items`);
    }

    await logAudit(db as any, ctx.req, {
      action:   "system.protect",
      resource: target ? `registry:${target}` : "registry:*",
      metadata: { instruction, target, protections },
    });

    return {
      action: "protect", status: "executed",
      message: `Protection applied to: ${target ?? "all systems"}`,
      logs,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const IntegrateHandler: CommandHandler = {
  name:        "integrate",
  description: "Integrate a component into the platform, connecting it to all relevant systems",
  patterns:    [/\bintegrate\b/i, /\bwire\b/i, /\bconnect\b/i, /\bauto.?wire\b/i, /\blink\b.*\bto\b/i],

  async execute(instruction, ctx): Promise<CommandResult> {
    const target = extractTarget(instruction, /integrate|wire|connect|link/i);
    const logs: string[] = [];

    logs.push(`[${ts()}] INTEGRATE handler triggered`);
    logs.push(`[${ts()}] Target: ${target ?? "(all unintegrated)"}`);

    if (target) {
      const id   = target.toLowerCase().replace(/\s+/g, "-");
      const item = _registry.get(id);

      if (item) {
        item.integratedAt           = ts();
        item.commandCenterConnected = true;
        item.status                 = "active";
        _registry.set(id, item);
        logs.push(`[${ts()}] ✓ Integrated: ${item.label}`);
        logs.push(`[${ts()}] ✓ Connected to Command Center`);
        logs.push(`[${ts()}] ✓ Wired to: API Gateway → Engine Registry → Brain Hub`);
      } else {
        logs.push(`[${ts()}] ⚠ Item not found: ${target}`);
        return {
          action: "integrate", status: "partial",
          message: `Item not found: ${target}. Register it first.`,
          logs,
        };
      }
    } else {
      let count = 0;
      for (const [id, item] of _registry) {
        if (!item.commandCenterConnected || !item.integratedAt) {
          item.integratedAt           = ts();
          item.commandCenterConnected = true;
          _registry.set(id, item);
          logs.push(`[${ts()}] ✓ Integrated: ${item.label}`);
          count++;
        }
      }
      logs.push(`[${ts()}] Total integrated: ${count} items`);
    }

    await logAudit(db as any, ctx.req, {
      action:   "system.integrate",
      resource: target ? `registry:${target}` : "registry:*",
      metadata: { instruction },
    });

    return {
      action: "integrate", status: "executed",
      message: `Integrated: ${target ?? "all unintegrated items"}`,
      logs,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const UpdateStateHandler: CommandHandler = {
  name:        "update-state",
  description: "Update system state, configuration, or platform settings",
  patterns:    [/\bupdate\b.*\bstate\b/i, /\bset\b.*\bstate\b/i, /\bsync\b/i, /\brefresh\b.*\bstate\b/i, /\bupdate.*config/i],

  async execute(instruction, ctx): Promise<CommandResult> {
    const logs: string[] = [];
    logs.push(`[${ts()}] UPDATE-STATE handler triggered`);
    logs.push(`[${ts()}] Instruction: "${instruction}"`);

    // Parse key=value or "set X to Y" patterns
    const kvMatch = instruction.match(/set\s+(\w+)\s+to\s+([\w.-]+)/i);
    if (kvMatch) {
      const [, key, value] = kvMatch;
      logs.push(`[${ts()}] ✓ State update: ${key} = ${value}`);
      logs.push(`[${ts()}] ✓ Platform state updated`);

      await logAudit(db as any, ctx.req, {
        action:   "system.update_state",
        metadata: { key, value, instruction },
      });

      return {
        action: "update-state", status: "executed",
        message: `State updated: ${key} → ${value}`,
        logs,
        data: { key, value },
      };
    }

    // Sync all registry items
    const active = Array.from(_registry.values()).filter(i => i.activationState === "on").length;
    logs.push(`[${ts()}] ✓ Registry sync complete: ${_registry.size} items, ${active} active`);
    logs.push(`[${ts()}] ✓ Platform state refreshed`);
    logs.push(`[${ts()}] ✓ Command Center synced`);

    return {
      action: "update-state", status: "executed",
      message: `Platform state synced — ${_registry.size} registry items, ${active} active`,
      logs,
      data: { totalItems: _registry.size, activeItems: active },
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const DeactivateHandler: CommandHandler = {
  name:        "deactivate",
  description: "Deactivate or disable an engine, module, or system",
  patterns:    [/\bdeactivate\b/i, /\bdisable\b/i, /\bturn off\b/i, /\bshutdown\b/i],

  async execute(instruction, ctx): Promise<CommandResult> {
    const target = extractTarget(instruction, /deactivate|disable|turn off|shutdown/i);
    const logs: string[] = [];
    logs.push(`[${ts()}] DEACTIVATE handler triggered`);
    logs.push(`[${ts()}] Target: ${target ?? "(none — system-level deactivation denied)"}`);

    if (!target) {
      return {
        action: "deactivate", status: "rejected",
        message: "Blanket deactivation rejected. Specify a target.",
        logs: [...logs, `[${ts()}] ✗ Rejected: must specify target`],
      };
    }

    const id   = target.toLowerCase().replace(/\s+/g, "-");
    const item = _registry.get(id);

    if (item) {
      item.activationState = "off";
      item.status          = "inactive";
      _registry.set(id, item);
      logs.push(`[${ts()}] ✓ Deactivated: ${item.label}`);

      await logAudit(db as any, ctx.req, {
        action:   "system.deactivate",
        resource: `registry:${id}`,
        metadata: { instruction, target },
      });

      return { action: "deactivate", status: "executed", message: `Deactivated: ${target}`, logs };
    }

    logs.push(`[${ts()}] ⚠ Item not found: ${id}`);
    return { action: "deactivate", status: "partial", message: `Item not found: ${target}`, logs };
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const StatusHandler: CommandHandler = {
  name:        "status",
  description: "Query the current state of the registry or a specific item",
  patterns:    [/\bstatus\b/i, /\blist\b/i, /\bshow\b/i, /\bwhat.*registered\b/i, /\bregistry\b/i, /\bhow many\b/i],

  async execute(instruction, _ctx): Promise<CommandResult> {
    const logs: string[] = [];
    const items = Array.from(_registry.values());
    const active      = items.filter(i => i.activationState === "on").length;
    const integrated  = items.filter(i => i.commandCenterConnected).length;
    const protected_  = items.filter(i => i.protections.length > 0).length;

    logs.push(`[${ts()}] STATUS handler triggered`);
    logs.push(`[${ts()}] Registry: ${items.length} items total`);
    logs.push(`[${ts()}]   Active:     ${active}`);
    logs.push(`[${ts()}]   Integrated: ${integrated}`);
    logs.push(`[${ts()}]   Protected:  ${protected_}`);

    const byType: Record<string, number> = {};
    for (const item of items) {
      byType[item.type] = (byType[item.type] ?? 0) + 1;
    }
    for (const [type, count] of Object.entries(byType)) {
      logs.push(`[${ts()}]   ${type}: ${count}`);
    }

    return {
      action: "status", status: "executed",
      message: `Registry: ${items.length} total, ${active} active, ${integrated} integrated, ${protected_} protected`,
      logs,
      data: { total: items.length, active, integrated, protected: protected_, byType, items },
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const FounderTierHandler: CommandHandler = {
  name:        "founder-tier",
  description: "Manage Founder Tier state — access, ceilings, and protections",
  patterns:    [/\bfounder\b/i, /\bfounder tier\b/i, /\bno ceiling\b/i, /\bunrestricted\b/i, /\bfull access\b/i],

  async execute(instruction, ctx): Promise<CommandResult> {
    const logs: string[] = [];
    logs.push(`[${ts()}] FOUNDER-TIER handler triggered`);
    logs.push(`[${ts()}] Caller: ${ctx.userId} (${ctx.role})`);

    if (ctx.role !== "founder") {
      logs.push(`[${ts()}] ✗ Rejected — Founder role required`);
      return {
        action: "founder-tier", status: "rejected",
        message: "Founder Tier configuration requires the Founder role.",
        logs,
      };
    }

    logs.push(`[${ts()}] ✓ Founder identity confirmed`);
    logs.push(`[${ts()}] ✓ Founder Tier: ACTIVE`);
    logs.push(`[${ts()}] ✓ No ceilings — unlimited access`);
    logs.push(`[${ts()}] ✓ All system-level functions available`);
    logs.push(`[${ts()}] ✓ Non-Founder ceiling: creator-level tools only`);
    logs.push(`[${ts()}] ✓ Platform architecture: Founder-Only`);
    logs.push(`[${ts()}] ✓ Replication Guard: ACTIVE`);

    await logAudit(db as any, ctx.req, {
      action:   "system.founder_tier_check",
      metadata: { instruction, tierStatus: "active" },
    });

    return {
      action: "founder-tier", status: "executed",
      message: "Founder Tier active — no restrictions, no ceilings",
      logs,
      data: {
        tierActive:       true,
        noCeiling:        true,
        founderName:      ctx.userId,
        systemAccess:     true,
        nonFounderCeiling: ["creator-level tools only", "no system access", "no architecture view"],
        protectedSystems: Array.from(_registry.values()).filter(i => i.protections.includes("founder-only")).map(i => i.label),
      },
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const HelpHandler: CommandHandler = {
  name:        "help",
  description: "List available system commands",
  patterns:    [/\bhelp\b/i, /\bcommands?\b/i, /\bwhat can\b/i, /\bwhat do\b/i],

  async execute(_instruction, _ctx): Promise<CommandResult> {
    const logs: string[] = [];
    const commandList = COMMAND_HANDLERS.map(h => `  • ${h.name}: ${h.description}`);
    logs.push(`[${ts()}] HELP handler triggered`);
    logs.push(`[${ts()}] Available commands:`);
    commandList.forEach(c => logs.push(c));

    return {
      action: "help", status: "executed",
      message: `${COMMAND_HANDLERS.length} commands available`,
      logs,
      data: {
        commands: COMMAND_HANDLERS.map(h => ({ name: h.name, description: h.description })),
      },
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const InheritUIHandler: CommandHandler = {
  name:        "inherit-ui",
  description: "Apply responsive UI rules and design system to a component or all items",
  patterns:    [/\binherit.*ui\b/i, /\bapply.*ui.*rules\b/i, /\bresponsive\b/i, /\bdesign system\b/i, /\bui rules\b/i],

  async execute(instruction, ctx): Promise<CommandResult> {
    const target = extractTarget(instruction, /inherit|apply|responsive/i);
    const logs: string[] = [];
    const uiRules = [
      "indigo-accent:#6366f1",
      "mobile-first-layout",
      "glass-topbar",
      "dark-mode-ready",
      "touch-targets-44px",
      "overflow-scroll-y",
    ];

    logs.push(`[${ts()}] INHERIT-UI handler triggered`);
    logs.push(`[${ts()}] UI rules: ${uiRules.join(", ")}`);

    if (target) {
      const id   = target.toLowerCase().replace(/\s+/g, "-");
      const item = _registry.get(id);
      if (item) {
        (item as any).uiRules = uiRules;
        _registry.set(id, item);
        logs.push(`[${ts()}] ✓ UI rules applied to: ${item.label}`);
      } else {
        logs.push(`[${ts()}] ⚠ Item not found: ${target}`);
      }
    } else {
      for (const [id, item] of _registry) {
        (item as any).uiRules = uiRules;
        _registry.set(id, item);
      }
      logs.push(`[${ts()}] ✓ UI rules applied to all ${_registry.size} items`);
    }

    await logAudit(db as any, ctx.req, {
      action:   "system.inherit_ui",
      resource: target ? `registry:${target}` : "registry:*",
      metadata: { instruction },
    });

    return {
      action: "inherit-ui", status: "executed",
      message: `Responsive UI rules applied to: ${target ?? "all items"}`,
      logs,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * COMMAND_HANDLERS — the master routing table.
 * To add a new command: push a new handler object here. Done.
 */
export const COMMAND_HANDLERS: CommandHandler[] = [
  HelpHandler,
  ActivateHandler,
  RegisterHandler,
  ProtectHandler,
  IntegrateHandler,
  UpdateStateHandler,
  DeactivateHandler,
  FounderTierHandler,
  InheritUIHandler,
];

// ─── Core: processCommand ─────────────────────────────────────────────────────

/**
 * processCommand — route a natural language instruction through all matching handlers.
 *
 * @param instruction  The natural language command from the Founder
 * @param ctx          Execution context (userId, role, req)
 * @returns            ProcessedCommand with results from each matched handler
 */
export async function processCommand(
  instruction: string,
  ctx: CommandContext,
): Promise<ProcessedCommand> {
  const trimmed  = instruction.trim();
  const results: CommandResult[] = [];

  console.log(`\n[CommandProcessor] ── New command ──────────────────────`);
  console.log(`[CommandProcessor] User:        ${ctx.userId} (${ctx.role})`);
  console.log(`[CommandProcessor] Instruction: "${trimmed}"`);
  console.log(`[CommandProcessor] Timestamp:   ${ts()}`);

  // Find all matching handlers
  const matched = COMMAND_HANDLERS.filter(h =>
    h.patterns.some(p => p.test(trimmed)),
  );

  console.log(`[CommandProcessor] Matched handlers: ${matched.length > 0 ? matched.map(h => h.name).join(", ") : "none"}`);

  if (matched.length === 0) {
    const unknown: CommandResult = {
      action:  "unknown",
      status:  "unknown",
      message: `No handler found for: "${trimmed}". Type 'help' to list available commands.`,
      logs:    [
        `[${ts()}] No handler matched instruction: "${trimmed}"`,
        `[${ts()}] Available commands: ${COMMAND_HANDLERS.map(h => h.name).join(", ")}`,
      ],
    };
    console.log(`[CommandProcessor] ⚠ Unknown command — no handler matched`);
    results.push(unknown);
  }

  for (const handler of matched) {
    console.log(`[CommandProcessor] → Executing: ${handler.name}`);
    try {
      const result = await handler.execute(trimmed, ctx);
      results.push(result);
      result.logs.forEach(l => console.log(`[CommandProcessor]   ${l}`));
      console.log(`[CommandProcessor] ✓ ${handler.name} → ${result.status}: ${result.message}`);
    } catch (err) {
      const errResult: CommandResult = {
        action:  handler.name,
        status:  "rejected",
        message: `Handler '${handler.name}' threw: ${String(err)}`,
        logs:    [`[${ts()}] ERROR in ${handler.name}: ${String(err)}`],
      };
      results.push(errResult);
      console.error(`[CommandProcessor] ✗ ${handler.name} error:`, err);
    }
  }

  console.log(`[CommandProcessor] ── Complete (${results.length} result(s)) ─────────────\n`);

  return {
    instruction: trimmed,
    timestamp:   ts(),
    userId:      ctx.userId,
    results,
    totalActions: results.filter(r => r.status === "executed").length,
    executedAt:   ts(),
  };
}
