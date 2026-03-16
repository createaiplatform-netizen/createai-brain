// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL CONNECTION LAYER + INTERNAL COMPLETENESS PASS
// Points 19 + 20 of the Universal Creative System.
// INTERNAL · FICTIONAL · DEMO-ONLY · NON-OPERATIONAL.
//
// The Connection Layer links Story + Character + World + Mechanics + Workflow
// into a single unified "Connected Project." The Completeness Pass reviews
// every project for missing structural elements and fills gaps automatically.
//
// All project structures, connections, and completeness results are entirely
// fictional and created for demo purposes only.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Types ────────────────────────────────────────────────────────────────

export type ProjectFormat =
  | "movie" | "tv-series" | "video-game" | "comic" | "novel"
  | "training-module" | "simulation" | "interactive-story" | "documentary"
  | "world-bible" | "game-comic" | "cross-media";

export type ConnectionStatus = "complete" | "partial" | "missing";

export interface ProjectElement {
  type:        "story" | "character" | "world" | "mechanics" | "workflow" | "creative" | "custom";
  label:       string;
  summary:     string;
  status:      ConnectionStatus;
  linkedIds:   string[];
  completeness: number;
}

export interface CompletenessIssue {
  severity:    "critical" | "major" | "minor";
  element:     string;
  description: string;
  suggestion:  string;
  autoFixed:   boolean;
}

export interface CompletenessReport {
  overallScore:  number;
  issues:        CompletenessIssue[];
  autoFixes:     string[];
  recommendation: string;
  readyToExport: boolean;
}

export interface ConnectionThread {
  from:        string;
  to:          string;
  type:        "character-world" | "story-world" | "mechanics-story" | "workflow-story" | "character-story" | "custom";
  description: string;
  strength:    "strong" | "medium" | "weak";
}

export interface ConnectedProject {
  id:            string;
  title:         string;
  format:        ProjectFormat;
  logline:       string;
  elements:      ProjectElement[];
  threads:       ConnectionThread[];
  completeness:  CompletenessReport;
  internalNotes: string[];
  exportPackage: string[];
  safetyNote:    string;
  createdAt:     string;
}

// ─── Format templates ──────────────────────────────────────────────────────

const FORMAT_REQUIREMENTS: Record<ProjectFormat, { required: ProjectElement["type"][]; optional: ProjectElement["type"][] }> = {
  "movie":           { required: ["story", "character", "world"],              optional: ["mechanics", "workflow"] },
  "tv-series":       { required: ["story", "character", "world"],              optional: ["mechanics", "workflow"] },
  "video-game":      { required: ["story", "character", "world", "mechanics"], optional: ["workflow"] },
  "comic":           { required: ["story", "character", "world"],              optional: ["mechanics"] },
  "novel":           { required: ["story", "character", "world"],              optional: [] },
  "training-module": { required: ["story", "workflow"],                        optional: ["character", "mechanics"] },
  "simulation":      { required: ["mechanics", "workflow", "world"],           optional: ["story", "character"] },
  "interactive-story": { required: ["story", "character", "world", "mechanics"], optional: ["workflow"] },
  "documentary":     { required: ["story", "world"],                           optional: ["character", "workflow"] },
  "world-bible":     { required: ["world", "character"],                       optional: ["story", "mechanics"] },
  "game-comic":      { required: ["story", "character", "world", "mechanics"], optional: ["workflow"] },
  "cross-media":     { required: ["story", "character", "world", "mechanics", "workflow"], optional: [] },
};

const FORMAT_DESCRIPTIONS: Record<ProjectFormat, string> = {
  "movie":             "Feature-length cinematic project linking story, characters, and world into a coherent screenplay structure.",
  "tv-series":         "Multi-episode serialized narrative with character arcs, world-building, and seasonal structure.",
  "video-game":        "Interactive game project linking narrative, playable characters, world design, and mechanics into a game design document.",
  "comic":             "Sequential art project with visual storytelling, character designs, world layouts, and panel breakdowns.",
  "novel":             "Long-form prose narrative with detailed character psychology, world exposition, and three-act structure.",
  "training-module":   "Instructional project linking workflow steps, learning objectives, and scenario simulations.",
  "simulation":        "Interactive scenario-based system with branching mechanics, world state, and outcome tracking.",
  "interactive-story": "Player-driven narrative with branching choices, character relationships, world exploration, and consequence mechanics.",
  "documentary":       "Non-fiction narrative structure connecting real-world framing (fictional) with story arc and factual world context.",
  "world-bible":       "Master reference document for a fictional world: factions, history, characters, and rules.",
  "game-comic":        "Cross-media property existing simultaneously as a game and comic — shared world, characters, and lore.",
  "cross-media":       "Universe-level property spanning all formats — unified characters, world, story, mechanics, and workflows.",
};

// ─── Connection thread templates ───────────────────────────────────────────

function buildThreads(elements: ProjectElement[]): ConnectionThread[] {
  const threads: ConnectionThread[] = [];
  const types = elements.map(e => e.type);

  if (types.includes("character") && types.includes("world")) {
    threads.push({
      from: "Characters", to: "World",
      type: "character-world",
      description: "Characters are grounded in the world — their origins, allegiances, and conflicts map directly to regional factions and historical events.",
      strength: "strong",
    });
  }
  if (types.includes("story") && types.includes("world")) {
    threads.push({
      from: "Story", to: "World",
      type: "story-world",
      description: "The narrative arc is shaped by the world's political structure, ecological constraints, and cultural norms — these create the antagonist forces and narrative stakes.",
      strength: "strong",
    });
  }
  if (types.includes("character") && types.includes("story")) {
    threads.push({
      from: "Characters", to: "Story",
      type: "character-story",
      description: "Each character's arc is embedded in the story's three-act structure — their growth mirrors the narrative's thematic progression.",
      strength: "strong",
    });
  }
  if (types.includes("mechanics") && types.includes("story")) {
    threads.push({
      from: "Mechanics", to: "Story",
      type: "mechanics-story",
      description: "Core gameplay mechanics reflect the thematic content of the story — the player experiences the protagonist's arc through interactive systems.",
      strength: "medium",
    });
  }
  if (types.includes("workflow") && types.includes("story")) {
    threads.push({
      from: "Workflow", to: "Story",
      type: "workflow-story",
      description: "The workflow structure provides a procedural backbone for the narrative — each workflow step maps to a story beat or scene transition.",
      strength: "medium",
    });
  }
  if (types.includes("mechanics") && types.includes("world")) {
    threads.push({
      from: "Mechanics", to: "World",
      type: "custom",
      description: "The world's physics, ecology, and factions directly inform the mechanics — exploration, resource availability, and faction relationships are all mechanical systems.",
      strength: "medium",
    });
  }
  return threads;
}

// ─── Completeness pass ─────────────────────────────────────────────────────

function runCompletenessPass(
  format: ProjectFormat,
  elements: ProjectElement[],
  title: string,
): CompletenessReport {
  const reqs = FORMAT_REQUIREMENTS[format];
  const presentTypes = elements.map(e => e.type);
  const issues: CompletenessIssue[] = [];
  const autoFixes: string[] = [];

  for (const req of reqs.required) {
    if (!presentTypes.includes(req)) {
      issues.push({
        severity:    "critical",
        element:     req,
        description: `Missing required element: ${req}. This format (${format}) requires a ${req} component.`,
        suggestion:  `Navigate to the ${req === "story" ? "Story" : req === "character" ? "Story / Character" : req === "world" ? "Story / World" : req === "mechanics" ? "Games / Mechanics" : "Workflows"} screen and generate a ${req} to link here.`,
        autoFixed:   true,
      });
      autoFixes.push(`[AUTO-FILLED] ${req}: A placeholder ${req} structure has been generated to maintain project coherence. Replace with your generated content. [Fictional]`);
    }
  }

  for (const el of elements) {
    if (el.completeness < 60) {
      issues.push({
        severity:    "major",
        element:     el.label,
        description: `"${el.label}" has a low completeness score (${el.completeness}%). Key sections may be underdeveloped.`,
        suggestion:  `Expand the "${el.label}" element by adding more detail in its originating screen.`,
        autoFixed:   false,
      });
    }
    if (el.linkedIds.length === 0 && elements.length > 1) {
      issues.push({
        severity:    "minor",
        element:     el.label,
        description: `"${el.label}" has no explicit links to other project elements.`,
        suggestion:  `Review the Connection Threads to ensure "${el.label}" is narratively and structurally connected to at least one other element.`,
        autoFixed:   true,
      });
      autoFixes.push(`[AUTO-LINKED] "${el.label}" has been conceptually linked to the project's central narrative thread. [Fictional]`);
    }
  }

  if (elements.length === 0) {
    issues.push({
      severity:    "critical",
      element:     "Project",
      description: "No elements have been added to this project. A connected project requires at least one generated element.",
      suggestion:  "Generate a Story, Character, World, Game, or Workflow from the other engines and add it to this project.",
      autoFixed:   false,
    });
  }

  const criticalCount = issues.filter(i => i.severity === "critical" && !i.autoFixed).length;
  const majorCount    = issues.filter(i => i.severity === "major" && !i.autoFixed).length;
  const score = Math.max(0, Math.min(100,
    100
    - (criticalCount * 25)
    - (majorCount * 10)
    - (issues.filter(i => i.severity === "minor" && !i.autoFixed).length * 5)
  ));

  const recommendation =
    score >= 90 ? `"${title}" is structurally complete and internally consistent. Ready for export. [Fictional assessment]`
    : score >= 70 ? `"${title}" is mostly complete with minor gaps. Review major issues and expand underdeveloped elements. [Fictional]`
    : score >= 50 ? `"${title}" requires significant expansion. Several required elements are missing or underdeveloped. [Fictional]`
    : `"${title}" needs substantial work before it can be considered a complete fictional project. Begin by adding the required elements. [Fictional]`;

  return { overallScore: score, issues, autoFixes, recommendation, readyToExport: score >= 70 };
}

// ─── Export package builder ────────────────────────────────────────────────

function buildExportPackage(title: string, format: ProjectFormat, elements: ProjectElement[]): string[] {
  return [
    `${title} — Project Overview (fictional summary document)`,
    `${title} — Element Index (${elements.length} linked elements)`,
    ...elements.map(e => `${title} — ${e.label} (${e.type} document)`),
    `${title} — Connection Thread Map (narrative/structural links)`,
    `${title} — Completeness Report`,
    `${title} — Internal Notes`,
    `${title} — Safety Core Declaration (all content fictional/demo-only)`,
    `FORMAT: ${FORMAT_DESCRIPTIONS[format]}`,
  ];
}

// ─── Engine Class ──────────────────────────────────────────────────────────

class UniversalConnectionEngineClass {
  private projects: Map<string, ConnectedProject> = new Map();

  create(params: {
    title:    string;
    format:   ProjectFormat;
    logline?: string;
  }): ConnectedProject {
    const { title, format, logline } = params;
    const elements: ProjectElement[] = [];
    const proj: ConnectedProject = {
      id:      `conn_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      title,
      format,
      logline: logline ?? `A ${format} project titled "${title}" — fictional, internal, demo-only.`,
      elements,
      threads:     buildThreads(elements),
      completeness: runCompletenessPass(format, elements, title),
      internalNotes: [
        `Project created: ${new Date().toLocaleString()} [demo timestamp]`,
        `Format selected: ${format} — ${FORMAT_DESCRIPTIONS[format]}`,
        "All elements, connections, and assessments are entirely fictional.",
      ],
      exportPackage: buildExportPackage(title, format, elements),
      safetyNote:    "FICTIONAL & INTERNAL ONLY. All project elements, connections, completeness assessments, and export packages are fabricated for demo purposes. No real project is being created.",
      createdAt:     new Date().toISOString(),
    };
    this.projects.set(proj.id, proj);
    return proj;
  }

  addElement(
    projectId: string,
    element: Omit<ProjectElement, "linkedIds" | "status">,
  ): ConnectedProject | null {
    const proj = this.projects.get(projectId);
    if (!proj) return null;

    const newEl: ProjectElement = {
      ...element,
      linkedIds: [],
      status: element.completeness >= 80 ? "complete" : element.completeness >= 40 ? "partial" : "missing",
    };
    proj.elements.push(newEl);

    proj.threads      = buildThreads(proj.elements);
    proj.completeness = runCompletenessPass(proj.format, proj.elements, proj.title);
    proj.exportPackage = buildExportPackage(proj.title, proj.format, proj.elements);
    proj.internalNotes.push(
      `Element added: "${element.label}" (${element.type}) — completeness ${element.completeness}% [fictional]`
    );

    this.projects.set(proj.id, proj);
    return proj;
  }

  removeElement(projectId: string, elementLabel: string): ConnectedProject | null {
    const proj = this.projects.get(projectId);
    if (!proj) return null;
    proj.elements = proj.elements.filter(e => e.label !== elementLabel);
    proj.threads      = buildThreads(proj.elements);
    proj.completeness = runCompletenessPass(proj.format, proj.elements, proj.title);
    proj.exportPackage = buildExportPackage(proj.title, proj.format, proj.elements);
    this.projects.set(proj.id, proj);
    return proj;
  }

  runCompleteness(projectId: string): CompletenessReport | null {
    const proj = this.projects.get(projectId);
    if (!proj) return null;
    proj.completeness = runCompletenessPass(proj.format, proj.elements, proj.title);
    this.projects.set(proj.id, proj);
    return proj.completeness;
  }

  getAll(): ConnectedProject[] { return [...this.projects.values()]; }
  get(id: string): ConnectedProject | undefined { return this.projects.get(id); }
  delete(id: string) { this.projects.delete(id); }

  getFormats(): { value: ProjectFormat; label: string; icon: string; desc: string }[] {
    return [
      { value: "movie",            label: "Movie",             icon: "🎬", desc: FORMAT_DESCRIPTIONS["movie"] },
      { value: "tv-series",        label: "TV Series",         icon: "📺", desc: FORMAT_DESCRIPTIONS["tv-series"] },
      { value: "video-game",       label: "Video Game",        icon: "🎮", desc: FORMAT_DESCRIPTIONS["video-game"] },
      { value: "comic",            label: "Comic",             icon: "💬", desc: FORMAT_DESCRIPTIONS["comic"] },
      { value: "novel",            label: "Novel",             icon: "📗", desc: FORMAT_DESCRIPTIONS["novel"] },
      { value: "training-module",  label: "Training Module",   icon: "🎓", desc: FORMAT_DESCRIPTIONS["training-module"] },
      { value: "simulation",       label: "Simulation",        icon: "🔬", desc: FORMAT_DESCRIPTIONS["simulation"] },
      { value: "interactive-story", label: "Interactive Story", icon: "🕹️", desc: FORMAT_DESCRIPTIONS["interactive-story"] },
      { value: "documentary",      label: "Documentary",       icon: "🎥", desc: FORMAT_DESCRIPTIONS["documentary"] },
      { value: "world-bible",      label: "World Bible",       icon: "🌍", desc: FORMAT_DESCRIPTIONS["world-bible"] },
      { value: "game-comic",       label: "Game / Comic",      icon: "⚡", desc: FORMAT_DESCRIPTIONS["game-comic"] },
      { value: "cross-media",      label: "Cross-Media Universe", icon: "🌌", desc: FORMAT_DESCRIPTIONS["cross-media"] },
    ];
  }
}

export const ConnectionEngine = new UniversalConnectionEngineClass();
