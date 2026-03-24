// ═══════════════════════════════════════════════════════════════════════════
// nextBestActionEngine.ts
// Analyses a FullAutoProject + live platform scores and returns structured
// recommendations. Uses only existing engine references — no invented systems.
// ═══════════════════════════════════════════════════════════════════════════

import type { PlatformScores } from "../platform/platform_score";

// ── Minimal type-only import to avoid circular deps ──────────────────────────
export interface FullAutoProjectLite {
  domain:          string[];
  workflows:       { name: string; engines: string[] }[];
  dataModel:       { entities: { name: string }[] };
  scoringSnapshot: PlatformScores;
  universe: {
    layers:   string[];
    identities: string[];
  };
  enginesUsed: string[];
}

export interface NextBestActionResult {
  nextSteps:  string[];
  focusArea:  string;
  rationale:  string;
}

// ── Focus-area logic ─────────────────────────────────────────────────────────

const SCORE_LABELS: Record<keyof PlatformScores, string> = {
  readiness:    "System Readiness",
  completeness: "Completeness",
  stability:    "Stability",
  integration:  "Integration",
  performance:  "Performance",
  security:     "Security",
  scalability:  "Scalability",
};

function lowestDimension(scores: PlatformScores): keyof PlatformScores {
  const keys = Object.keys(SCORE_LABELS) as (keyof PlatformScores)[];
  return keys.reduce((prev, cur) => (scores[cur] < scores[prev] ? cur : prev), keys[0]);
}

// ── Domain → recommended capability map ──────────────────────────────────────

const DOMAIN_STEPS: Record<string, string[]> = {
  healthcare:     ["Connect the intake workflow to the FHIR sandbox endpoint.", "Activate the healthcare compliance layer before going live."],
  construction:   ["Wire the project timeline to the supply-chain engine.", "Enable equipment tracking in the data model."],
  energy:         ["Link the energy analytics engine to real-time grid data.", "Add sustainability scoring to the workflow chain."],
  nonprofit:      ["Enable donor management workflows.", "Connect the grant-tracking entity to the reporting engine."],
  education:      ["Activate the student-lifecycle workflows.", "Connect curriculum data to the analytics engine."],
  manufacturing:  ["Enable the supply-chain tracking workflow.", "Add quality-control checkpoints to the data model."],
  transportation: ["Wire fleet logistics to the routing engine.", "Enable real-time GPS event ingestion."],
  agriculture:    ["Connect crop-tracking to the ecology engine.", "Enable seasonal scheduling in the timeline workflow."],
  hospitality:    ["Activate booking and reservation workflows.", "Connect the loyalty engine to the guest data model."],
  insurance:      ["Enable claims-processing workflows.", "Connect the risk-scoring engine to the data model."],
  government:     ["Activate the compliance and audit trail engines.", "Enable the secure portal for citizen-facing workflows."],
  "home services":["Enable scheduling and dispatch workflows.", "Add the customer-review entity to the data model."],
  cosmology:      ["Run the cosmology engine to expand universe context.", "Link timeline entities to the lore manifests."],
  lore:           ["Activate loreforge to generate lore archives.", "Connect narrative hooks to the storytelling OS."],
  game:           ["Wire the game-world engine to character and location entities.", "Enable the event-bus for in-game action routing."],
};

function domainSteps(domains: string[]): string[] {
  const steps: string[] = [];
  for (const d of domains) {
    const key = d.toLowerCase();
    for (const [k, v] of Object.entries(DOMAIN_STEPS)) {
      if (key.includes(k)) { steps.push(...v); break; }
    }
    if (steps.length >= 4) break;
  }
  return steps;
}

// ── Universal next steps ─────────────────────────────────────────────────────

function universalSteps(project: FullAutoProjectLite, weakDim: keyof PlatformScores): string[] {
  const out: string[] = [];

  if (weakDim === "integration") {
    out.push("Connect this system to the analytics engine to capture live usage metrics.");
    out.push("Register the project with the platform event bus for cross-engine routing.");
  } else if (weakDim === "stability") {
    out.push("Run a self-heal cycle to close any open configuration gaps.");
    out.push("Enable health-monitor polling on all active workflows.");
  } else if (weakDim === "security") {
    out.push("Review all data entities for missing access-control annotations.");
    out.push("Enable the audit-log engine on every write operation.");
  } else if (weakDim === "scalability") {
    out.push("Profile the highest-traffic workflow and add caching where applicable.");
    out.push("Activate the expansion engine to pre-allocate headroom for growth.");
  } else if (weakDim === "performance") {
    out.push("Enable query caching on the most accessed data entities.");
    out.push("Move heavy computation into background job queues.");
  } else {
    out.push("Run the platform-100 enforcer to validate all required capabilities.");
    out.push("Review the activation chain and activate any paused layers.");
  }

  // Workflow-specific
  if (project.workflows.length > 0) {
    out.push(`Activate the \u201C${project.workflows[0].name}\u201D workflow first \u2014 it is the highest-priority entry point.`);
  }

  // Universe
  if (project.universe.layers.includes("familyLayer") || project.enginesUsed.includes("familyAgents")) {
    out.push("Add a family-facing surface so family members can interact with this project.");
  }

  if (project.universe.layers.includes("meaningLayer")) {
    out.push("Refine the narrative and meaning layers to improve user experience coherence.");
  }

  return out;
}

// ── Main export ──────────────────────────────────────────────────────────────

export function runNextBestAction(
  project: FullAutoProjectLite,
  scores:  PlatformScores,
): NextBestActionResult {
  const weakDim   = lowestDimension(scores);
  const focusArea = SCORE_LABELS[weakDim];

  const domainSpecific = domainSteps(project.domain);
  const universal      = universalSteps(project, weakDim);

  const nextSteps = [...domainSpecific, ...universal].slice(0, 5);

  const rationale =
    `The current platform ${focusArea.toLowerCase()} score of ${scores[weakDim]} is the lowest ` +
    `across the seven dimensions. Focusing on ${focusArea.toLowerCase()} will produce the highest ` +
    `compound lift across all other scores and bring this project to launch readiness fastest.`;

  return { nextSteps, focusArea, rationale };
}
