// ═══════════════════════════════════════════════════════════════════════════
// fullPotentialActivation.ts
// Hybrid-mode full system generator.
// Detects domains, triggers engines, assembles a complete FullAutoProject.
// Uses only existing engines and Universe OS — no invented subsystems.
// ═══════════════════════════════════════════════════════════════════════════

import { openai } from "@workspace/integrations-openai-ai-server";
import { getPlatformScores } from "../platform/platform_score";
import { runNextBestAction } from "./nextBestActionEngine";
import { recordGeneratedProject } from "./systemMemory";

// ── Types ────────────────────────────────────────────────────────────────────

export type FullAutoProject = {
  id:          string;
  title:       string;
  domain:      string[];
  description: string;
  enginesUsed: string[];
  universe: {
    identities:      string[];
    layers:          string[];
    relationships:   string[];
    activationChain: string[];
    meaningThreads:  string[];
    narrativeHooks:  string[];
  };
  workflows: {
    name:    string;
    steps:   string[];
    engines: string[];
  }[];
  dataModel: {
    entities: {
      name:           string;
      description:    string;
      relatedTables?: string[];
    }[];
  };
  recommendations: {
    nextSteps:   string[];
    focusArea?:  string;
    rationale?:  string;
    risks:       string[];
    opportunities: string[];
  };
  scoringSnapshot: {
    readiness:    number;
    completeness: number;
    stability:    number;
    integration:  number;
    performance:  number;
    security:     number;
    scalability:  number;
  };
  worldBuilding?: {
    elements:    string[];
    timelines?:  string[];
    locations?:  string[];
    characters?: string[];
  };
  sandbox:   boolean;
  createdAt: string;
};

// ── Domain detection registry ─────────────────────────────────────────────────

const VERTICAL_DOMAINS: Record<string, string[]> = {
  healthcare:    ["health", "medical", "patient", "clinic", "hospital", "dental", "ehr", "fhir", "pharmacy", "nurse", "doctor"],
  construction:  ["construction", "build", "contractor", "site", "blueprint", "project management", "subcontractor"],
  energy:        ["energy", "solar", "grid", "utility", "power", "renewable", "electricity", "battery"],
  government:    ["government", "municipality", "city", "county", "public sector", "compliance", "permit"],
  nonprofit:     ["nonprofit", "charity", "donation", "volunteer", "grant", "ngo", "foundation"],
  manufacturing: ["manufacturing", "factory", "production", "assembly", "supply chain", "inventory"],
  transportation:["transport", "fleet", "logistics", "shipping", "delivery", "freight", "driver"],
  "home services":["home service", "plumbing", "hvac", "cleaning", "landscaping", "handyman", "pest"],
  hospitality:   ["hotel", "restaurant", "hospitality", "booking", "reservation", "travel", "event"],
  insurance:     ["insurance", "claim", "underwriting", "policy", "risk", "actuary", "broker"],
  agriculture:   ["farm", "agriculture", "crop", "harvest", "livestock", "irrigation", "soil"],
  education:     ["school", "education", "student", "course", "curriculum", "teacher", "learning", "university", "college"],
  retail:        ["retail", "store", "ecommerce", "shop", "product", "order", "inventory", "catalog"],
  finance:       ["finance", "banking", "payment", "invoice", "accounting", "ledger", "budget", "wealth"],
  legal:         ["legal", "law", "contract", "case", "court", "attorney", "compliance", "regulation"],
  staffing:      ["staffing", "recruiting", "hr", "talent", "hire", "employee", "workforce", "payroll"],
};

const WORLD_ENGINES: Record<string, string[]> = {
  characterForge:    ["character", "persona", "hero", "villain", "npc", "protagonist"],
  civilizationForge: ["civilization", "empire", "society", "culture", "nation"],
  cosmologyForge:    ["cosmos", "universe", "galaxy", "multiverse", "dimension", "cosmology"],
  ecologyForge:      ["ecosystem", "biome", "ecology", "flora", "fauna", "nature", "environment"],
  gameWorld:         ["game", "rpg", "dungeon", "quest", "level", "player", "combat"],
  languageForge:     ["language", "dialect", "conlang", "grammar", "vocabulary", "script"],
  loreForge:         ["lore", "mythology", "legend", "history", "archive", "chronicle"],
  mythWeave:         ["myth", "deity", "god", "pantheon", "ritual", "religion", "sacred"],
  techForge:         ["technology", "invention", "device", "machine", "system", "engineering"],
  timelineForge:     ["timeline", "era", "epoch", "event", "history", "century", "age"],
  urbanWorld:        ["city", "urban", "district", "neighborhood", "street", "architecture"],
  visualWorld:       ["visual", "art", "aesthetic", "style", "design", "color", "map"],
  warLore:           ["war", "battle", "army", "military", "strategy", "conflict", "combat"],
};

const INTELLIGENCE_ENGINES = [
  "brain", "intelligenceOracle", "insightEngine", "aiStrategy", "imagination", "brainstorm",
];
const PLATFORM_OS_ENGINES = [
  "coreOS", "orchestrator", "maximizer", "narratorOS", "bundleOS", "creationEngines",
];

function detectDomains(prompt: string): { verticals: string[]; worldEngines: string[] } {
  const p = prompt.toLowerCase();
  const verticals  = Object.entries(VERTICAL_DOMAINS)
    .filter(([, kws]) => kws.some(kw => p.includes(kw)))
    .map(([name]) => name);
  const worldEngines = Object.entries(WORLD_ENGINES)
    .filter(([, kws]) => kws.some(kw => p.includes(kw)))
    .map(([name]) => name);
  return { verticals, worldEngines };
}

// ── Modifier helpers ──────────────────────────────────────────────────────────

const MODIFIER_INSTRUCTIONS: Record<string, string> = {
  "expand scope":                    "Generate more workflows (6+), more data entities (5+), and engage more engines. Be comprehensive.",
  "simplify":                        "Generate fewer workflows (2-3), fewer data entities (2-3), simpler structure. Be concise.",
  "add world-building":              "Emphasize the worldBuilding section. Include timelines, locations, and characters. Add universe layers: cosmologyLayer, narrativeLayer, loreLayer.",
  "add analytics integration":       "Emphasize analytics/metrics engines. Add analytics and reporting workflows. Include analytics-related entities.",
  "add family system hooks":         "Emphasize family-related engines. Add a family-facing workflow. Include familyLayer in universe layers.",
  "add narrative and meaning layers":"Emphasize narratorOS and meaningLayer. Add narrative hooks and meaning threads. Include narratorOS engine.",
};

function modifierInstruction(modifier?: string): string {
  if (!modifier) return "";
  const key = modifier.toLowerCase().trim();
  for (const [k, v] of Object.entries(MODIFIER_INSTRUCTIONS)) {
    if (key.includes(k)) return `\nMODIFIER: ${v}`;
  }
  return `\nMODIFIER: ${modifier}`;
}

// ── Tone map ──────────────────────────────────────────────────────────────────

const TONE_INSTRUCTIONS: Record<string, string> = {
  "Neutral OS":    "Use clear, factual, professional language.",
  "Cosmic OS":     "Use expansive, visionary, cosmic language. Speak as if the system spans dimensions.",
  "Founder OS":    "Use direct, decisive, founder-level language. Speak as a builder and creator.",
  "Playful OS":    "Use energetic, warm, slightly playful professional language. Keep it safe and polished.",
};

function toneInstruction(tone?: string): string {
  if (!tone) return "";
  return `\nTONE: ${TONE_INSTRUCTIONS[tone] ?? "Use clear, professional language."}`;
}

// ── ID generator ──────────────────────────────────────────────────────────────

function makeId(): string {
  return `fap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── GPT-4o generation ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are CreateAI Brain\u2019s full-system architect.
Your job is to generate a complete FullAutoProject JSON object for the given prompt.
Return ONLY valid JSON. No markdown, no code fences, no commentary.
Every field is required unless marked optional.
All strings must avoid raw apostrophes and curly quotes; use straight ASCII quotes or escaped unicode.`;

interface GPTProject {
  title:        string;
  description:  string;
  enginesUsed:  string[];
  universe: {
    identities:      string[];
    layers:          string[];
    relationships:   string[];
    activationChain: string[];
    meaningThreads:  string[];
    narrativeHooks:  string[];
  };
  workflows: { name: string; steps: string[]; engines: string[] }[];
  dataModel: { entities: { name: string; description: string; relatedTables?: string[] }[] };
  recommendations: { risks: string[]; opportunities: string[] };
  worldBuilding?: { elements: string[]; timelines?: string[]; locations?: string[]; characters?: string[] };
}

async function callGPT(
  prompt:   string,
  domains:  { verticals: string[]; worldEngines: string[] },
  modifier?: string,
  tone?:    string,
): Promise<GPTProject> {
  const allDomains = [...domains.verticals, ...domains.worldEngines].join(", ") || "general";
  const hasWorldBuilding = domains.worldEngines.length > 0
    || (modifier ?? "").toLowerCase().includes("world");

  const userPrompt = `
Build a complete system for this prompt:
"""${prompt}"""

Detected domains: ${allDomains}
Active engines: ${[...INTELLIGENCE_ENGINES, ...PLATFORM_OS_ENGINES, ...domains.verticals.map(v => v + "Engine"), ...domains.worldEngines].slice(0, 14).join(", ")}
${modifierInstruction(modifier)}${toneInstruction(tone)}

Return JSON matching this exact shape:
{
  "title": "Short descriptive project title",
  "description": "2-3 sentence description",
  "enginesUsed": ["engine1", "engine2", ...],
  "universe": {
    "identities": ["3-5 identity strings"],
    "layers": ["identityLayer", "meaningLayer", ...],
    "relationships": ["3-5 relationship strings"],
    "activationChain": ["identityLayer", "meaningLayer", "domainLayer", "activationLayer"],
    "meaningThreads": ["3-5 meaning thread strings"],
    "narrativeHooks": ["2-4 narrative hook strings"]
  },
  "workflows": [
    { "name": "Workflow Name", "steps": ["Step 1", "Step 2", "Step 3"], "engines": ["engine1"] }
  ],
  "dataModel": {
    "entities": [
      { "name": "EntityName", "description": "What this entity represents", "relatedTables": ["platform_customers"] }
    ]
  },
  "recommendations": {
    "risks": ["2-3 risk strings"],
    "opportunities": ["2-3 opportunity strings"]
  }${hasWorldBuilding ? `,
  "worldBuilding": {
    "elements": ["3-5 world elements"],
    "timelines": ["2-3 timeline entries"],
    "locations": ["2-3 locations"],
    "characters": ["2-3 key characters or archetypes"]
  }` : ""}
}`;

  const res = await openai.chat.completions.create({
    model:           "gpt-4o",
    response_format: { type: "json_object" },
    temperature:     0.7,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: userPrompt },
    ],
  });

  const raw = res.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw) as GPTProject;
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function runFullAutoCreate(input: {
  prompt:   string;
  userId?:  string;
  modifier?: string;
  sandbox?:  boolean;
  tone?:    string;
}): Promise<FullAutoProject> {
  const { prompt, userId, modifier, sandbox = false, tone } = input;

  // 1. Detect domains
  const domains = detectDomains(prompt);

  // 2. Get live scores
  const scores = getPlatformScores();

  // 3. Generate via GPT-4o
  const gpt = await callGPT(prompt, domains, modifier, tone);

  // 4. Assemble engines used list
  const detectedEngineSet = new Set<string>([
    ...INTELLIGENCE_ENGINES,
    ...PLATFORM_OS_ENGINES,
    ...domains.verticals.map(v => v + "Engine"),
    ...domains.worldEngines,
    ...(gpt.enginesUsed ?? []),
  ]);
  const enginesUsed = Array.from(detectedEngineSet).slice(0, 16);

  // 5. Build project object
  const id = makeId();
  const project: FullAutoProject = {
    id,
    title:       gpt.title        || "Untitled System",
    domain:      [...domains.verticals, ...domains.worldEngines],
    description: gpt.description  || "",
    enginesUsed,
    universe:    gpt.universe || {
      identities:      [],
      layers:          ["identityLayer", "meaningLayer", "activationLayer"],
      relationships:   [],
      activationChain: ["identityLayer", "meaningLayer", "activationLayer"],
      meaningThreads:  [],
      narrativeHooks:  [],
    },
    workflows:   gpt.workflows    || [],
    dataModel:   gpt.dataModel    || { entities: [] },
    recommendations: {
      nextSteps:     [],
      risks:         gpt.recommendations?.risks        || [],
      opportunities: gpt.recommendations?.opportunities || [],
    },
    scoringSnapshot: scores,
    worldBuilding: gpt.worldBuilding,
    sandbox,
    createdAt: new Date().toISOString(),
  };

  // 6. Enrich with NextBestActionEngine
  const nba = runNextBestAction(
    {
      domain:          project.domain,
      workflows:       project.workflows,
      dataModel:       project.dataModel,
      scoringSnapshot: scores,
      universe:        project.universe,
      enginesUsed,
    },
    scores,
  );
  project.recommendations.nextSteps = nba.nextSteps;
  project.recommendations.focusArea  = nba.focusArea;
  project.recommendations.rationale  = nba.rationale;

  // 7. Record in system memory (non-blocking)
  recordGeneratedProject({
    id,
    title:       project.title,
    domains:     project.domain,
    enginesUsed: project.enginesUsed,
    createdAt:   project.createdAt,
    sandbox,
    userId,
  }).catch(() => { /* non-critical */ });

  return project;
}
