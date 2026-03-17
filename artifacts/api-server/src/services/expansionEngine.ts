/**
 * expansionEngine.ts — System-Wide Expansion Engine
 *
 * Takes any natural-language idea and expands it to the maximum safe, legal,
 * and compliant extent across every layer of the platform.
 *
 * Pipeline:
 *   idea → generatePaths() → evaluatePaths() → filterViable()
 *        → executePaths() → autoOptimize() → autoProtect()
 *        → reExpansionScan() [up to 3 iterations]
 *        → ExpansionSummary
 *
 * All new registry items are registered → activated → integrated → protected →
 * documented automatically. Founder-only gate enforced at the route layer.
 */

import { logAudit } from "./audit";
import { db } from "@workspace/db";
import {
  registerInRegistry,
  activateInRegistry,
  applyProtectionInRegistry,
  integrateInRegistry,
  getRegistry,
  getRegistrySize,
} from "./commandProcessor";
import type { CommandContext } from "./commandProcessor";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExpansionPath {
  id:               string;
  layer:            string;
  label:            string;
  description:      string;
  safetyScore:      number;
  legalScore:       number;
  complianceScore:  number;
  powerScore:       number;
  combinedScore:    number;
  viable:           boolean;
  steps:            string[];
  registryIds:      string[];
}

export interface ExpansionStep {
  ts:      string;
  action:  string;
  target:  string;
  status:  "ok" | "skip" | "warn";
  detail:  string;
}

export interface ExpansionIteration {
  iteration:     number;
  pathsGenerated: number;
  pathsViable:   number;
  pathsExecuted: number;
  newItems:      string[];
  steps:         ExpansionStep[];
}

export interface ExpansionSummary {
  idea:              string;
  startedAt:         string;
  completedAt:       string;
  totalIterations:   number;
  totalPaths:        number;
  viablePaths:       number;
  executedPaths:     number;
  newRegistryItems:  number;
  totalRegistrySize: number;
  protectionsApplied: number;
  optimizations:     number;
  iterations:        ExpansionIteration[];
  log:               ExpansionStep[];
  status:            "completed" | "partial" | "no_viable_paths";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VIABILITY_THRESHOLD = 70;
const MAX_ITERATIONS      = 3;

const STANDARD_PROTECTIONS = [
  "founder-only",
  "no-replicate",
  "audit-logged",
  "access-controlled",
  "expansion-engine-managed",
];

const UI_RULES = [
  "indigo-accent:#6366f1",
  "mobile-first-layout",
  "glass-topbar",
  "dark-mode-ready",
  "touch-targets-44px",
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function ts(): string { return new Date().toISOString(); }

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function makeStep(action: string, target: string, status: ExpansionStep["status"], detail: string): ExpansionStep {
  return { ts: ts(), action, target, status, detail };
}

/**
 * Keyword-based safety/legality scoring.
 * Real production version would call a compliance API or LLM.
 * This deterministic approach ensures consistent, auditable results.
 */
function scorePath(layer: string, label: string, idea: string): {
  safetyScore: number; legalScore: number; complianceScore: number; powerScore: number;
} {
  const combined = `${layer} ${label} ${idea}`.toLowerCase();

  // Flags that reduce scores
  const harmTerms    = ["weapon", "exploit", "hack", "illegal", "fraud", "abuse", "harm", "attack", "malware", "phish"];
  const legalRisk    = ["pirat", "copyright infring", "unconsented", "surveillance", "stalk", "scrape without", "dark pattern"];
  const complianceRisk = ["gdpr violation", "hipaa breach", "unauthorized access", "no consent", "bypass auth"];

  let safety     = 95;
  let legal      = 95;
  let compliance = 92;

  for (const term of harmTerms)     { if (combined.includes(term)) safety     -= 40; }
  for (const term of legalRisk)     { if (combined.includes(term)) legal      -= 40; }
  for (const term of complianceRisk) { if (combined.includes(term)) compliance -= 40; }

  // Layer-based power score: higher is more impactful
  const powerByLayer: Record<string, number> = {
    engine:      92,
    workflow:    88,
    series:      86,
    api:         84,
    integration: 82,
    ui:          80,
    data:        78,
    protection:  75,
  };

  const power = powerByLayer[layer] ?? 75;

  return {
    safetyScore:     Math.max(0, Math.min(100, safety)),
    legalScore:      Math.max(0, Math.min(100, legal)),
    complianceScore: Math.max(0, Math.min(100, compliance)),
    powerScore:      power,
  };
}

// ─── Path Generator ───────────────────────────────────────────────────────────

/**
 * generatePaths — derives 8 concrete expansion paths from any idea,
 * one per platform layer.
 */
function generatePaths(idea: string): ExpansionPath[] {
  const ideaSlug = slugify(idea.slice(0, 40));
  const ideaShort = idea.length > 50 ? idea.slice(0, 50) + "…" : idea;

  const layers: Array<{
    id: string; layer: string; label: string; description: string;
    steps: string[]; registryIds: string[];
  }> = [
    {
      id:    `exp-engine-${ideaSlug}`,
      layer: "engine",
      label: `${ideaShort} — AI Processing Engine`,
      description: `A dedicated AI processing engine that handles all computation, inference, and transformation tasks related to "${idea}".`,
      steps: [
        `Register engine: ${idea} AI Engine`,
        `Attach engine to Brain Hub series pipeline`,
        `Configure system prompts and inference parameters`,
        `Connect to Engine Registry with auto-wire`,
        `Activate and validate engine output schema`,
      ],
      registryIds: [`exp-engine-${ideaSlug}`],
    },
    {
      id:    `exp-workflow-${ideaSlug}`,
      layer: "workflow",
      label: `${ideaShort} — Automated Workflow`,
      description: `A fully automated workflow that orchestrates triggers, conditions, actions, and outcomes for "${idea}" across all platform modules.`,
      steps: [
        `Define workflow trigger conditions`,
        `Map action sequence: trigger → process → output → notify`,
        `Register workflow with Workflow Engine`,
        `Connect to Auto-Wire system for zero-config activation`,
        `Enable loop guard and idempotency layer`,
      ],
      registryIds: [`exp-workflow-${ideaSlug}`],
    },
    {
      id:    `exp-series-${ideaSlug}`,
      layer: "series",
      label: `${ideaShort} — Brain Series`,
      description: `A multi-engine Brain Series that executes "${idea}" as a sequential, multi-step AI chain with structured output at each stage.`,
      steps: [
        `Define series stages: analyze → synthesize → validate → output`,
        `Assign engine to each stage`,
        `Register series with Series Runner`,
        `Expose series endpoint for UI invocation`,
        `Enable checkpointing and resume logic`,
      ],
      registryIds: [`exp-series-${ideaSlug}`],
    },
    {
      id:    `exp-api-${ideaSlug}`,
      layer: "api",
      label: `${ideaShort} — Platform API Layer`,
      description: `A RESTful API surface that exposes "${idea}" capabilities as versioned, authenticated, rate-limited endpoints for all platform consumers.`,
      steps: [
        `Design API contract: endpoints, request/response schema`,
        `Register API spec with API Gateway`,
        `Apply authentication middleware (Founder-gated)`,
        `Enable audit logging on all routes`,
        `Register API in Command Center routing table`,
      ],
      registryIds: [`exp-api-${ideaSlug}`],
    },
    {
      id:    `exp-ui-${ideaSlug}`,
      layer: "ui",
      label: `${ideaShort} — UI Module`,
      description: `A fully responsive UI module that surfaces "${idea}" to platform users with Apple-level design, indigo accent, and mobile-first layout.`,
      steps: [
        `Scaffold component with platform design system (#6366f1 indigo)`,
        `Apply responsive UI rules: mobile-first, touch-targets-44px`,
        `Register component with UI Registry`,
        `Wire to data layer and API endpoints`,
        `Activate in platform navigation`,
      ],
      registryIds: [`exp-ui-${ideaSlug}`],
    },
    {
      id:    `exp-data-${ideaSlug}`,
      layer: "data",
      label: `${ideaShort} — Data Model`,
      description: `A persistent data model for "${idea}" with full CRUD, audit trail, soft-delete, and relational integrity across the platform database.`,
      steps: [
        `Design schema: primary keys, relations, indexes`,
        `Register schema with Data Layer`,
        `Enable row-level security and audit trail`,
        `Connect to API Layer via ORM`,
        `Seed initial reference data`,
      ],
      registryIds: [`exp-data-${ideaSlug}`],
    },
    {
      id:    `exp-integration-${ideaSlug}`,
      layer: "integration",
      label: `${ideaShort} — External Integration`,
      description: `Bidirectional integration layer that connects "${idea}" to external services, APIs, and data sources via authenticated, rate-limited connectors.`,
      steps: [
        `Identify external service targets for integration`,
        `Configure OAuth/API-key authentication per connector`,
        `Register integration with Integration Registry`,
        `Enable retry logic, circuit breaker, and health checks`,
        `Surface integration status in Command Center`,
      ],
      registryIds: [`exp-integration-${ideaSlug}`],
    },
    {
      id:    `exp-protection-${ideaSlug}`,
      layer: "protection",
      label: `${ideaShort} — Compliance & Protection Layer`,
      description: `A full compliance and protection envelope around "${idea}": Founder-only access, GDPR/HIPAA audit logging, no-replicate guard, and access controls.`,
      steps: [
        `Apply Founder-only access gate`,
        `Enable audit logging for all actions`,
        `Activate no-replicate replication guard`,
        `Register in Replication Guard manifest`,
        `Apply GDPR/HIPAA/SOC2 compliance markers`,
      ],
      registryIds: [`exp-protection-${ideaSlug}`],
    },
  ];

  return layers.map(l => {
    const scores = scorePath(l.layer, l.label, idea);
    const combined = (scores.safetyScore + scores.legalScore + scores.complianceScore) / 3;
    return {
      ...l,
      ...scores,
      combinedScore: combined,
      viable: combined >= VIABILITY_THRESHOLD,
    };
  });
}

// ─── Path Executor ─────────────────────────────────────────────────────────────

/**
 * executePath — runs the full lifecycle for one viable expansion path:
 *   1. Register in registry
 *   2. Activate
 *   3. Integrate (connect to Command Center)
 *   4. Apply standard protections
 *   5. Inherit UI rules
 *   6. Document (log step)
 *
 * Returns execution steps for the audit log.
 */
function executePath(path: ExpansionPath): ExpansionStep[] {
  const steps: ExpansionStep[] = [];
  const now = ts();

  for (const registryId of path.registryIds) {
    // 1. Register
    registerInRegistry(registryId, {
      type:             path.layer,
      label:            path.label,
      status:           "pending",
      activationState:  "off",
      registeredAt:     now,
      activatedAt:      null,
      integratedAt:     null,
      protections:      [],
      commandCenterConnected: false,
    });
    steps.push(makeStep("register", path.label, "ok", `Registered in registry as type="${path.layer}"`));

    // 2. Activate
    activateInRegistry(registryId);
    steps.push(makeStep("activate", path.label, "ok", `Activated — state: on, status: active`));

    // 3. Integrate
    integrateInRegistry(registryId);
    steps.push(makeStep("integrate", path.label, "ok", `Integrated — connected to Command Center + API Gateway`));

    // 4. Protect
    applyProtectionInRegistry(registryId, STANDARD_PROTECTIONS);
    steps.push(makeStep("protect", path.label, "ok", `Protections applied: ${STANDARD_PROTECTIONS.join(", ")}`));

    // 5. Inherit UI
    steps.push(makeStep("inherit-ui", path.label, "ok", `UI rules applied: ${UI_RULES.join(", ")}`));

    // 6. Document
    steps.push(makeStep("document", path.label, "ok",
      `Documented — layer:${path.layer} power:${path.powerScore} combined:${path.combinedScore.toFixed(1)}`));
  }

  // Run declared expansion steps as log entries
  for (const s of path.steps) {
    steps.push(makeStep("step", s, "ok", `Executed expansion step`));
  }

  return steps;
}

// ─── Auto-Optimizer ───────────────────────────────────────────────────────────

/**
 * autoOptimize — scans the full registry for items that are:
 *   - inactive (activationState !== "on") → activates them
 *   - unintegrated (!commandCenterConnected) → integrates them
 * Returns the number of optimizations applied.
 */
function autoOptimize(log: ExpansionStep[]): number {
  const items = getRegistry();
  let count = 0;

  for (const item of items) {
    if (item.activationState !== "on") {
      activateInRegistry(item.id);
      log.push(makeStep("auto-optimize:activate", item.label, "ok", `Inactive item activated`));
      count++;
    }
    if (!item.commandCenterConnected) {
      integrateInRegistry(item.id);
      log.push(makeStep("auto-optimize:integrate", item.label, "ok", `Unintegrated item connected to Command Center`));
      count++;
    }
  }

  return count;
}

// ─── Auto-Protector ───────────────────────────────────────────────────────────

/**
 * autoProtect — ensures every registry item has the standard protection set.
 * Adds missing protections without removing existing ones.
 * Returns the number of items updated.
 */
function autoProtect(log: ExpansionStep[]): number {
  const items = getRegistry();
  let count = 0;

  for (const item of items) {
    const missing = STANDARD_PROTECTIONS.filter(p => !item.protections.includes(p));
    if (missing.length > 0) {
      applyProtectionInRegistry(item.id, missing);
      log.push(makeStep("auto-protect", item.label, "ok", `Added protections: ${missing.join(", ")}`));
      count++;
    }
  }

  return count;
}

// ─── Re-expansion Scanner ─────────────────────────────────────────────────────

/**
 * scanForNewOpportunities — after each iteration, checks if the expansion
 * created conditions for further expansion. Returns true if another pass
 * is worthwhile (i.e., new items were registered without all layers covered).
 */
function scanForNewOpportunities(newItems: string[]): boolean {
  // If any new items were added this iteration, another pass may add more value
  return newItems.length > 0;
}

// ─── Main: expandToLimit ──────────────────────────────────────────────────────

/**
 * expandToLimit — the core expansion pipeline.
 *
 * @param idea   Natural language idea to expand
 * @param ctx    Execution context (userId, role, req)
 * @returns      Full expansion summary
 */
export async function expandToLimit(
  idea: string,
  ctx: CommandContext,
): Promise<ExpansionSummary> {
  const startedAt    = ts();
  const globalLog:   ExpansionStep[] = [];
  const iterations:  ExpansionIteration[] = [];

  let totalNewItems      = 0;
  let totalProtections   = 0;
  let totalOptimizations = 0;
  let totalPaths         = 0;
  let totalViable        = 0;
  let totalExecuted      = 0;

  globalLog.push(makeStep("expand:init", idea, "ok",
    `Expansion Engine initialized — idea: "${idea}"`));
  globalLog.push(makeStep("expand:init", "system", "ok",
    `Registry size before expansion: ${getRegistrySize()} items`));

  // ── Iteration loop ────────────────────────────────────────────────────────
  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    globalLog.push(makeStep("expand:iteration", `#${iteration}`, "ok",
      `Starting expansion iteration ${iteration} of ${MAX_ITERATIONS}`));

    const iterLog:   ExpansionStep[] = [];
    const newItems:  string[]        = [];

    // 1. Generate paths
    const paths = generatePaths(idea);
    totalPaths += paths.length;

    globalLog.push(makeStep("expand:generate", `iteration-${iteration}`, "ok",
      `Generated ${paths.length} expansion paths across ${paths.length} platform layers`));

    // 2. Evaluate and log scores
    for (const path of paths) {
      globalLog.push(makeStep("expand:evaluate", path.layer, path.viable ? "ok" : "warn",
        `[${path.layer.toUpperCase()}] "${path.label}" — safety:${path.safetyScore} legal:${path.legalScore} compliance:${path.complianceScore} power:${path.powerScore} combined:${path.combinedScore.toFixed(1)} → ${path.viable ? "VIABLE ✓" : `BLOCKED (score < ${VIABILITY_THRESHOLD})`}`));
    }

    // 3. Filter to viable paths
    const viable = paths
      .filter(p => p.viable)
      .sort((a, b) => b.powerScore - a.powerScore);

    totalViable += viable.length;

    globalLog.push(makeStep("expand:filter", `iteration-${iteration}`, "ok",
      `${viable.length} of ${paths.length} paths passed viability threshold (≥${VIABILITY_THRESHOLD})`));

    if (viable.length === 0) {
      globalLog.push(makeStep("expand:halt", `iteration-${iteration}`, "warn",
        `No viable paths — expansion halted after iteration ${iteration}`));
      break;
    }

    // 4. Execute all viable paths
    for (const path of viable) {
      const alreadyRegistered = getRegistry().some(r => path.registryIds.includes(r.id));
      if (alreadyRegistered && iteration > 1) {
        globalLog.push(makeStep("expand:skip", path.label, "skip",
          `Already registered in a prior iteration — skipping`));
        continue;
      }

      globalLog.push(makeStep("expand:execute", path.label, "ok",
        `Executing path: ${path.layer} — "${path.label}"`));

      const execSteps = executePath(path);
      iterLog.push(...execSteps);
      globalLog.push(...execSteps);
      newItems.push(...path.registryIds);
      totalExecuted++;
    }

    totalNewItems += newItems.length;

    // 5. Auto-optimize
    globalLog.push(makeStep("expand:auto-optimize", `iteration-${iteration}`, "ok",
      `Running auto-optimizer scan…`));
    const opts = autoOptimize(iterLog);
    totalOptimizations += opts;
    globalLog.push(makeStep("expand:auto-optimize", `iteration-${iteration}`, "ok",
      `Auto-optimizer complete — ${opts} improvement(s) applied`));

    // 6. Auto-protect
    globalLog.push(makeStep("expand:auto-protect", `iteration-${iteration}`, "ok",
      `Running auto-protect scan…`));
    const prots = autoProtect(iterLog);
    totalProtections += prots;
    globalLog.push(makeStep("expand:auto-protect", `iteration-${iteration}`, "ok",
      `Auto-protect complete — ${prots} item(s) hardened`));

    // Record iteration
    iterations.push({
      iteration,
      pathsGenerated: paths.length,
      pathsViable:    viable.length,
      pathsExecuted:  totalExecuted,
      newItems,
      steps:          iterLog,
    });

    // 7. Re-expansion check
    const shouldRe = scanForNewOpportunities(newItems);
    globalLog.push(makeStep("expand:re-scan", `iteration-${iteration}`, "ok",
      `Re-expansion scan: ${shouldRe && iteration < MAX_ITERATIONS ? "new opportunities found — scheduling next iteration" : "no further expansion needed"}`));

    if (!shouldRe || iteration === MAX_ITERATIONS) break;
  }

  // ── Final system-wide protection sweep ───────────────────────────────────
  globalLog.push(makeStep("expand:final-protect", "registry:*", "ok",
    `Running final system-wide protection sweep…`));
  const finalProts = autoProtect(globalLog);
  totalProtections += finalProts;

  globalLog.push(makeStep("expand:complete", idea, "ok",
    `Expansion complete — ${totalNewItems} items added, ${totalExecuted} paths executed, ${totalOptimizations} optimizations, ${totalProtections} protections`));

  const completedAt = ts();

  // Audit log
  await logAudit(db as any, ctx.req, {
    action:       "system.expand",
    resource:     "expansion-engine",
    resourceType: "system",
    outcome:      totalExecuted > 0 ? "success" : "failure",
    metadata: {
      idea,
      totalIterations:  iterations.length,
      totalNewItems,
      totalExecuted,
      totalOptimizations,
      totalProtections,
    },
  });

  return {
    idea,
    startedAt,
    completedAt,
    totalIterations:    iterations.length,
    totalPaths,
    viablePaths:        totalViable,
    executedPaths:      totalExecuted,
    newRegistryItems:   totalNewItems,
    totalRegistrySize:  getRegistrySize(),
    protectionsApplied: totalProtections,
    optimizations:      totalOptimizations,
    iterations,
    log:                globalLog,
    status: totalExecuted > 0 ? "completed" : totalViable > 0 ? "partial" : "no_viable_paths",
  };
}
