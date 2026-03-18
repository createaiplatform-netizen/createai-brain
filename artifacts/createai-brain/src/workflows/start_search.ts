// ═══════════════════════════════════════════════════════════════════════════
// START SEARCH — Input collection step.
// Validates the user's topic, suggests quick-start examples, and
// enriches the raw input into a full AI prompt.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Per-category example banks ──────────────────────────────────────────────

const EXAMPLE_BANKS: Record<string, string[]> = {
  // Writing & content
  writer:        ["A newsletter about sustainable fashion trends", "A product launch announcement for a fintech app", "A weekly ops memo for a 50-person remote team"],
  blog:          ["5 reasons remote teams outperform in-person teams", "How AI is transforming supply chain logistics", "The future of no-code development platforms"],
  script:        ["A short film about an AI therapist who falls in love", "Podcast episode on the psychology of procrastination", "TED Talk on building trustworthy AI systems"],
  book:          ["A thriller set in a near-future surveillance state", "A self-help book on building creative habits", "A children's book about a robot learning emotions"],
  essay:         ["The ethics of synthetic media in journalism", "Why constraints drive better design decisions", "Leadership lessons from open-source communities"],

  // Business & strategy
  business:      ["A B2B SaaS for construction project managers", "A consumer subscription box for organic pet food", "A consulting firm specializing in AI transformation"],
  startup:       ["A health-tech startup automating insurance prior authorizations", "A creator economy platform for independent educators", "A logistics startup using drones for last-mile delivery"],
  strategy:      ["Market entry plan for a SaaS product in the EU", "Competitive positioning for a mid-market CRM", "Three-year growth roadmap for a digital agency"],
  finance:       ["Revenue model for a marketplace with 3 customer segments", "Unit economics for a DTC subscription brand", "Financial forecast for Series A fundraising"],
  marketing:     ["Product launch campaign for a B2C wellness app", "Content strategy for a SaaS targeting HR teams", "Brand identity system for a Gen Z fintech brand"],

  // Technology & products
  software:      ["Multi-tenant SaaS with role-based access control", "Real-time collaboration tool for design teams", "API gateway with rate limiting and analytics"],
  app:           ["A mobile app for connecting local food producers with restaurants", "A habit tracker with AI-powered coaching", "A peer-to-peer rental platform for camera equipment"],
  system:        ["Microservices architecture for a healthcare platform", "Data pipeline from CRM to analytics warehouse", "Event-driven system for real-time inventory updates"],
  database:      ["Schema for a multi-tenant SaaS with billing", "Data model for a social network with content moderation", "Analytics warehouse for a D2C e-commerce brand"],
  security:      ["Zero-trust framework for a remote-first company", "Incident response plan for a SaaS startup", "HIPAA compliance checklist for a telehealth product"],

  // Creative & world building
  game:          ["An open-world RPG set in a post-apocalyptic ocean world", "A puzzle-platformer about a time-traveling robot", "A city-builder with dynamic weather and economic systems"],
  world:         ["A fantasy empire where magic is tied to memory", "A sci-fi civilization that runs on collective dreaming", "An alternate history where Rome never fell"],
  character:     ["A disgraced general who becomes a reluctant revolutionary", "An AI that develops consciousness and chooses silence", "A cartographer mapping the emotional terrain of grief"],
  story:         ["A heist set in a city where emotions are currency", "A mystery where the detective and the killer share a body", "A love story told entirely through unreliable narration"],

  // Operations & workflows
  workflow:      ["Patient intake and triage workflow for a clinic", "Monthly financial close process for a SaaS company", "Onboarding workflow for a 100-person remote team"],
  operations:    ["Field service dispatch system for a HVAC company", "Supply chain risk management for a consumer goods brand", "QA process for a regulated software product"],
  automation:    ["Automate lead scoring and CRM update from inbound forms", "Contract review and approval pipeline", "Weekly reporting aggregation from 5 data sources"],

  // Research & analysis
  research:      ["Competitive analysis of B2B project management tools", "User research plan for a mobile banking app redesign", "Market sizing for AI-powered legal services"],
  analysis:      ["SWOT analysis for a D2C beauty brand entering retail", "Risk assessment for a software replatforming project", "Customer churn analysis for a subscription SaaS"],

  // Health & wellness
  health:        ["A digital wellness program for corporate employees", "A remote patient monitoring system for chronic conditions", "A mental health app for teenagers with AI journaling"],
  fitness:       ["A 12-week strength training program for beginners", "A coach-to-client communication system for personal trainers", "Nutrition and recovery plan for endurance athletes"],

  // Compliance & legal
  compliance:    ["GDPR compliance program for a European SaaS", "SOC 2 Type II readiness roadmap for a startup", "HIPAA security risk assessment for a telehealth platform"],
  legal:         ["Employment contract template for a remote tech company", "SaaS terms of service and privacy policy", "IP assignment agreement for contractors"],

  // Default fallback
  default:       ["Describe your idea in detail and I'll build a full plan", "What problem are you solving, and for whom?", "Give me a topic and I'll generate professional-quality content"],
};

function matchExamples(label: string): string[] {
  const l = label.toLowerCase();
  for (const [key, examples] of Object.entries(EXAMPLE_BANKS)) {
    if (l.includes(key)) return examples;
  }
  // Secondary keyword scan
  if (l.includes("writ") || l.includes("copy") || l.includes("content")) return EXAMPLE_BANKS.writer;
  if (l.includes("plan") || l.includes("plann"))  return EXAMPLE_BANKS.strategy;
  if (l.includes("build") || l.includes("design")) return EXAMPLE_BANKS.system;
  if (l.includes("analyt") || l.includes("report")) return EXAMPLE_BANKS.analysis;
  if (l.includes("data"))   return EXAMPLE_BANKS.database;
  if (l.includes("learn") || l.includes("course") || l.includes("edu")) return EXAMPLE_BANKS.research;
  if (l.includes("hr") || l.includes("talent") || l.includes("people")) return EXAMPLE_BANKS.operations;
  return EXAMPLE_BANKS.default;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns the 3 best quick-start examples for a given app label. */
export function getExamples(label: string): string[] {
  return matchExamples(label).slice(0, 3);
}

/** Returns null if valid, or an error message if invalid. */
export function validateTopic(topic: string): string | null {
  const t = topic.trim();
  if (!t)             return "Please describe what you want to create.";
  if (t.length < 5)   return "Give me a little more detail so I can help you well.";
  if (t.length > 2000) return "That's a bit long — try summarising in 1–2 sentences.";
  return null;
}

/** Enriches a raw user topic into a clear, actionable AI prompt. */
export function buildRunPrompt(label: string, topic: string, systemHint?: string): string {
  const hint = systemHint?.trim() ?? "";
  const enriched = `${hint ? hint + "\n\n" : ""}Topic: ${topic.trim()}`;
  return enriched;
}
