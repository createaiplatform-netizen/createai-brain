// ─── Project Intelligence Engine ─────────────────────────────────────────────
// Detects project type from a description and loads the right template.
// Extends and complements the CreationStore's classifyIntent (for SaaS/creative).

import { ProjectType, getTemplate, ProjectTemplate } from "./TemplateLibrary";

// ─── Detection keywords per type ─────────────────────────────────────────────
const KEYWORD_MAP: Record<ProjectType, string[]> = {
  "movie":             ["movie", "film", "cinema", "animation", "cartoon", "tv show", "episode", "screenplay", "script", "scene", "director", "plot", "logline", "trailer", "actor", "animated"],
  "comic":             ["comic", "manga", "graphic novel", "panel", "superhero", "webcomic", "issue", "character arc", "illustration", "sequential art"],
  "game":              ["game", "gaming", "rpg", "puzzle", "strategy game", "simulation game", "player", "level", "quest", "achievement", "leaderboard", "gameplay", "indie game", "gamer"],
  "training":          ["training", "course", "lesson", "learning", "lms", "module", "curriculum", "student", "teacher", "quiz", "assessment", "e-learning", "certification", "educational", "academy"],
  "brochure":          ["brochure", "pamphlet", "leaflet", "print", "flyer", "handout", "tri-fold"],
  "landing-page":      ["landing page", "squeeze page", "opt-in page", "lead capture", "conversion page"],
  "marketing":         ["marketing system", "funnel", "email sequence", "campaign", "ad copy", "social media content", "lead generation", "advertising", "nurture", "content calendar"],
  "product-launch":    ["product launch", "launch plan", "go-to-market", "launch strategy", "press release", "announcement", "beta launch", "gtm"],
  "app-saas":          ["saas", "platform", "software", "app", "application", "crm", "erp", "lms", "ehr", "emr", "system", "tool", "suite", "engine", "module", "api", "portal", "hub", "workspace", "subscription"],
  "website":           ["website", "site", "web presence", "homepage", "multi-page site", "company website"],
  "presentation-deck": ["presentation", "slide deck", "pitch deck", "keynote", "slides", "powerpoint", "deck", "investor pitch", "board presentation"],
  "workflow-map":      ["workflow", "process map", "process flow", "flowchart", "sop", "standard operating procedure", "workflow map", "process diagram", "bpmn", "swimlane"],
  "user-journey":      ["user journey", "customer journey", "journey map", "experience map", "ux flow", "touchpoints", "persona journey", "service blueprint"],
  "ip-bible":          ["ip bible", "story universe", "world building", "lore", "canon", "story bible", "tv bible", "franchise bible", "fictional world", "universe guide"],
  "dashboard-concept": ["dashboard", "analytics dashboard", "kpi dashboard", "data visualization", "reporting dashboard", "admin dashboard", "metrics dashboard", "bi dashboard"],
  "internal-tool":     ["internal tool", "admin panel", "back office", "staff tool", "ops tool", "internal system", "management tool", "admin interface", "internal app"],
  "knowledge-base":    ["knowledge base", "help center", "documentation", "docs", "kb", "wiki", "help docs", "user guide", "technical documentation", "support docs"],
  "roadmap-doc":       ["roadmap", "product roadmap", "strategic plan", "strategic roadmap", "now next later", "okr", "objectives", "milestones", "quarterly plan", "annual plan"],
  "custom":            [],
};

// ─── Domain safety mapping ────────────────────────────────────────────────────
export interface SafetyConfig {
  domain: string;
  demoOnly: boolean;
  warningNote: string | null;
  requiresExpertReview: boolean;
}

const DOMAIN_SAFETY: { keywords: string[]; config: SafetyConfig }[] = [
  {
    keywords: ["health", "medical", "clinical", "patient", "ehr", "emr", "doctor", "nurse", "hospital", "pharmacy", "dental", "therapy"],
    config: { domain: "Healthcare", demoOnly: true, warningNote: "Healthcare content is mock/demo only. No real clinical, diagnostic, or treatment decisions. Requires qualified medical experts for real implementation.", requiresExpertReview: true },
  },
  {
    keywords: ["legal", "law", "attorney", "contract", "compliance", "regulation", "court", "litigation"],
    config: { domain: "Legal", demoOnly: true, warningNote: "Legal content is structural and mock only. Not legal advice. Requires qualified legal professionals for real use.", requiresExpertReview: true },
  },
  {
    keywords: ["finance", "financial", "banking", "investment", "trading", "tax", "payroll", "insurance", "lending", "mortgage", "credit"],
    config: { domain: "Finance", demoOnly: true, warningNote: "Financial content is mock only. Not financial advice. Requires qualified financial professionals for real implementation.", requiresExpertReview: true },
  },
  {
    keywords: ["pharmacy", "drug", "medication", "prescription", "dosage", "pharmaceutical"],
    config: { domain: "Pharmaceutical", demoOnly: true, warningNote: "Pharmaceutical content is mock only. No real medical or drug information. Requires qualified experts.", requiresExpertReview: true },
  },
];

// ─── Intelligence Result ──────────────────────────────────────────────────────
export interface IntelligenceResult {
  type: ProjectType;
  template: ProjectTemplate;
  confidence: "high" | "medium" | "low";
  domain: string;
  safety: SafetyConfig;
  detectedKeywords: string[];
  suggestedTitle: string;
  suggestedTagline: string;
}

// ─── Main Detection Function ──────────────────────────────────────────────────
export function detectProjectType(description: string): IntelligenceResult {
  const d = description.toLowerCase().trim();

  // Score each type
  const scores: Record<ProjectType, number> = {} as Record<ProjectType, number>;
  const detectedKeywords: string[] = [];

  for (const [type, keywords] of Object.entries(KEYWORD_MAP) as [ProjectType, string[]][]) {
    let score = 0;
    for (const kw of keywords) {
      if (d.includes(kw)) {
        score++;
        if (!detectedKeywords.includes(kw)) detectedKeywords.push(kw);
      }
    }
    scores[type] = score;
  }

  // Find winner
  let winner: ProjectType = "custom";
  let maxScore = 0;
  for (const [type, score] of Object.entries(scores) as [ProjectType, number][]) {
    if (score > maxScore) { maxScore = score; winner = type; }
  }

  const confidence: "high" | "medium" | "low" = maxScore >= 3 ? "high" : maxScore >= 1 ? "medium" : "low";

  // Domain detection
  let safetyConfig: SafetyConfig = {
    domain: "General",
    demoOnly: false,
    warningNote: null,
    requiresExpertReview: false,
  };

  for (const { keywords, config } of DOMAIN_SAFETY) {
    if (keywords.some(k => d.includes(k))) {
      safetyConfig = config;
      break;
    }
  }

  const template = getTemplate(winner);

  // Generate suggested title/tagline from description
  const words = description.split(" ").slice(0, 5).join(" ");
  const suggestedTitle = words.length > 3 ? words.charAt(0).toUpperCase() + words.slice(1) : description;
  const suggestedTagline = `${template.label} — ${safetyConfig.domain !== "General" ? safetyConfig.domain + " · " : ""}${template.tagline}`;

  return {
    type: winner,
    template,
    confidence,
    domain: safetyConfig.domain,
    safety: safetyConfig,
    detectedKeywords: detectedKeywords.slice(0, 6),
    suggestedTitle,
    suggestedTagline,
  };
}

// ─── Template Selector ────────────────────────────────────────────────────────
// Given a project type string from the CreationStore format, map to a ProjectType
export function mapCreationTypeToProjectType(creationType: string): ProjectType {
  const map: Record<string, ProjectType> = {
    movie:     "movie",
    comic:     "comic",
    game:      "game",
    software:  "app-saas",
    document:  "custom",
    marketing: "marketing",
    community: "custom",
    custom:    "custom",
  };
  return map[creationType] ?? "custom";
}

// ─── Project AI Helper ────────────────────────────────────────────────────────
// Per-project context-aware helper — generates suggestions based on type + content
export interface ProjectAIHelper {
  type: ProjectType;
  domain: string;
  template: ProjectTemplate;
  suggest: (sectionId: string) => string[];
  generateOutline: () => { section: string; items: string[] }[];
  safetyReminder: () => string | null;
}

export function createProjectHelper(type: ProjectType, domain: string): ProjectAIHelper {
  const template = getTemplate(type);

  return {
    type,
    domain,
    template,

    suggest(sectionId: string): string[] {
      const section = template.sections.find(s => s.id === sectionId);
      if (!section) return ["Describe the key purpose of this section", "Add supporting details and examples", "Include a clear next step or call to action"];
      return section.blocks.map(b => b.hint);
    },

    generateOutline(): { section: string; items: string[] }[] {
      return template.sections.map(section => ({
        section: section.label,
        items: section.blocks.map(b => b.label),
      }));
    },

    safetyReminder(): string | null {
      if (template.safetyNote) return template.safetyNote;
      const DOMAIN_NOTES: Record<string, string> = {
        Healthcare: "All healthcare content is mock and non-clinical. Not for real medical decisions.",
        Finance: "All financial content is illustrative and mock. Not financial advice.",
        Legal: "All legal content is structural and mock. Not legal advice.",
      };
      return DOMAIN_NOTES[domain] ?? null;
    },
  };
}
