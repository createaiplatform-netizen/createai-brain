// ═══════════════════════════════════════════════════════════════════════════
// OUTPUT FLOW — Engine resolution and context builder for the AI call.
// Maps every app label to the most appropriate CreateAI engine, then
// builds the enriched context string passed to streamEngine().
// ═══════════════════════════════════════════════════════════════════════════

// ─── Label → Engine mapping ───────────────────────────────────────────────────
// Priority order: exact match → keyword match → category match → fallback

const LABEL_ENGINE: Record<string, string> = {
  // ── Workflow / automation ──────────────────────────────────────────────
  "Workflow Builder":     "UniversalWorkflowEngine",
  "Workflow RPA":         "UniversalWorkflowEngine",
  "Automation Center":    "UniversalWorkflowEngine",
  "Trigger Manager":      "UniversalWorkflowEngine",
  "Batch Processor":      "UniversalWorkflowEngine",

  // ── Strategy / business ────────────────────────────────────────────────
  "Business Strategist":  "UniversalStrategyEngine",
  "Business Creation":    "UniversalStrategyEngine",
  "Business Entity":      "UniversalStrategyEngine",
  "Biz Dev":              "UniversalStrategyEngine",
  "Biz Universe":         "UniversalStrategyEngine",
  "BizDev":               "UniversalStrategyEngine",
  "Startup Planner":      "UniversalStrategyEngine",
  "Market Research":      "MarketResearchEngine",
  "Competitive Product":  "MarketResearchEngine",
  "Feature Prioritizer":  "UniversalStrategyEngine",
  "Product Design":       "UniversalStrategyEngine",
  "Go-To-Market":         "UniversalStrategyEngine",

  // ── Writing & content ──────────────────────────────────────────────────
  "Blog Writer":          "UniversalCreativeEngine",
  "Copywriter":           "UniversalCreativeEngine",
  "Email Composer":       "UniversalCreativeEngine",
  "Speechwriter":         "UniversalCreativeEngine",
  "Essay Writer":         "UniversalCreativeEngine",
  "Technical Writer":     "UniversalCreativeEngine",
  "Content Calendar":     "UniversalCreativeEngine",
  "Script Writer":        "UniversalCreativeEngine",
  "Storyboarder":         "UniversalStoryEngine",
  "Scriptwriter":         "UniversalStoryEngine",

  // ── Creative / world-building ──────────────────────────────────────────
  "Book Planner":         "UniversalStoryEngine",
  "Game Narrative Studio":"UniversalStoryEngine",
  "Comic Script Studio":  "UniversalStoryEngine",
  "Game World Studio":    "UniversalGameEngine",
  "Dungeon Builder":      "UniversalGameEngine",
  "Balance Designer":     "UniversalGameEngine",
  "Imagination Lab":      "InfiniteExpansionEngine",
  "Dimension Builder":    "InfiniteExpansionEngine",

  // ── Research & analysis ────────────────────────────────────────────────
  "Research Lab":         "ResearchEngine",
  "User Research":        "ResearchEngine",
  "Insight Synthesis":    "ResearchEngine",
  "Data Storyteller":     "ResearchEngine",
  "Hypothesis Builder":   "ResearchEngine",
  "Experiment Design":    "ExperimentDesignEngine",
  "Ethnographic Research":"ResearchEngine",
  "Critical Thinking Coach":"CritiqueEngine",

  // ── Operations ─────────────────────────────────────────────────────────
  "Command Center":       "UniversalWorkflowEngine",
  "Operations":           "UniversalWorkflowEngine",
  "Field Ops":            "UniversalWorkflowEngine",
  "Facilities OS":        "UniversalWorkflowEngine",
  "Supply Chain OS":      "UniversalWorkflowEngine",
  "Vendor OS":            "UniversalWorkflowEngine",
  "Workspace OS":         "UniversalWorkflowEngine",
  "Change Management":    "UniversalWorkflowEngine",
  "Capacity Planner":     "UniversalStrategyEngine",
  "Dev Planner":          "BackendBlueprintEngine",

  // ── Finance ────────────────────────────────────────────────────────────
  "Financial Modeler":    "UniversalStrategyEngine",
  "Budget Builder":       "UniversalStrategyEngine",
  "Budget Planner":       "UniversalStrategyEngine",
  "Cash Flow Planner":    "UniversalStrategyEngine",
  "FP&A Dashboard":       "UniversalStrategyEngine",
  "Unit Economics":       "UniversalStrategyEngine",
  "Treasury Manager":     "UniversalStrategyEngine",
  "Cap Table":            "UniversalStrategyEngine",
  "Finance Advisor":      "UniversalStrategyEngine",
  "Tax Strategy":         "UniversalStrategyEngine",
  "Debt Structure":       "UniversalStrategyEngine",
  "Insurance Planner":    "UniversalStrategyEngine",
  "Equity Planner":       "UniversalStrategyEngine",
  "Fundraising Studio":   "UniversalStrategyEngine",

  // ── HR & people ────────────────────────────────────────────────────────
  "Hiring Assistant":     "PersonaEngine",
  "Talent Acquisition":   "PersonaEngine",
  "Talent Pipeline":      "PersonaEngine",
  "Workforce Planner":    "UniversalStrategyEngine",
  "Succession Planner":   "UniversalStrategyEngine",
  "HR Analytics":         "UniversalStrategyEngine",
  "HR Compliance":        "RegulatoryEngine",
  "HRIS Designer":        "BackendBlueprintEngine",
  "Comp Benchmark":       "UniversalStrategyEngine",
  "Employee Experience":  "FeedbackEngine",
  "Engagement Survey":    "FeedbackEngine",
  "Employer Branding":    "UniversalCreativeEngine",
  "DEI Studio":           "UniversalStrategyEngine",

  // ── Legal & compliance ─────────────────────────────────────────────────
  "Contract Drafter":     "TemplateLibrary",
  "Due Diligence":        "UniversalStrategyEngine",
  "Compliance Mapping":   "RegulatoryEngine",
  "Audit Prep":           "RegulatoryEngine",
  "Regulatory":           "RegulatoryEngine",
  "Trade Compliance":     "RegulatoryEngine",
  "Corporate Governance": "RegulatoryEngine",
  "Legal AI":             "TemplateLibrary",

  // ── Tech & engineering ─────────────────────────────────────────────────
  "System Designer":      "BackendBlueprintEngine",
  "Database Studio":      "BackendBlueprintEngine",
  "API Playground":       "BackendBlueprintEngine",
  "Code Reviewer":        "BackendBlueprintEngine",
  "ADR Studio":           "BackendBlueprintEngine",
  "Data Pipeline":        "BackendBlueprintEngine",
  "Data Transformer":     "BackendBlueprintEngine",
  "Data Studio":          "BackendBlueprintEngine",
  "Data Collection":      "BackendBlueprintEngine",
  "Tech Forge":           "BackendBlueprintEngine",
  "Cloud Security":       "BackendBlueprintEngine",
  "App Security":         "BackendBlueprintEngine",
  "Encryption Planner":   "BackendBlueprintEngine",
  "Endpoint Security":    "BackendBlueprintEngine",
  "Zero Trust":           "BackendBlueprintEngine",
  "CVE Tracker":          "BackendBlueprintEngine",
  "Threat Model":         "BackendBlueprintEngine",
  "Vulnerability Scanner":"BackendBlueprintEngine",
  "Cyber Resilience":     "BackendBlueprintEngine",
  "Incident Response":    "BackendBlueprintEngine",
  "IAM Studio":           "BackendBlueprintEngine",
  "FHIR Builder":         "BackendBlueprintEngine",
  "EHR Integration":      "BackendBlueprintEngine",
  "Healthcare API":       "BackendBlueprintEngine",
  "Integration":          "IntegrationEngine",
  "Webhook Manager":      "IntegrationEngine",

  // ── Education ──────────────────────────────────────────────────────────
  "Curriculum Designer":  "LearningEngine",
  "Instructional Design": "LearningEngine",
  "Assessment Builder":   "LearningEngine",
  "Course Builder":       "LearningEngine",
  "Adaptive Learning":    "LearningEngine",
  "Teacher Toolbox":      "LearningEngine",
  "Study Planner":        "LearningEngine",
  "Game Learning":        "LearningEngine",
  "Credential Builder":   "LearningEngine",
  "Continuing Education": "LearningEngine",
  "Virtual Classroom":    "LearningEngine",
  "Ed Tech Stack":        "LearningEngine",
  "Higher Edu OS":        "LearningEngine",
  "Student Engagement":   "FeedbackEngine",

  // ── Healthcare ─────────────────────────────────────────────────────────
  "Care Coordination":    "UniversalWorkflowEngine",
  "Clinical Decision":    "RegulatoryEngine",
  "Clinical Trial":       "ResearchEngine",
  "Clinical Workflow":    "UniversalWorkflowEngine",
  "Health Analytics":     "UniversalStrategyEngine",
  "Health Billing":       "TemplateLibrary",
  "Healthcare Compliance":"RegulatoryEngine",
  "HIPAA Dashboard":      "RegulatoryEngine",
  "Health Data Governance":"RegulatoryEngine",
  "Telehealth Builder":   "BackendBlueprintEngine",
  "Home Health OS":       "UniversalWorkflowEngine",
  "Health Coach":         "UniversalCreativeEngine",

  // ── Marketing ──────────────────────────────────────────────────────────
  "Marketing":            "UniversalCreativeEngine",
  "Traction Dashboard":   "UniversalStrategyEngine",
  "Trends Sentinel":      "MarketResearchEngine",
  "Dashboard Builder":    "ExportEngine",

  // ── Sustainability ─────────────────────────────────────────────────────
  "ESG Reporter":         "ExportEngine",
  "Carbon Tracker":       "UniversalStrategyEngine",
  "Sustainability":       "UniversalStrategyEngine",
  "Green Building":       "UniversalStrategyEngine",
  "Green Finance":        "UniversalStrategyEngine",
  "Circular Economy":     "UniversalStrategyEngine",
  "Environmental OS":     "UniversalStrategyEngine",
  "Climate Risk":         "UniversalStrategyEngine",
  "Waste Tracker":        "UniversalStrategyEngine",
  "Water Stewardship":    "UniversalStrategyEngine",

  // ── Personal ───────────────────────────────────────────────────────────
  "Travel Planner":       "UniversalCreativeEngine",
  "Fitness Coach":        "UniversalCreativeEngine",
  "Goal Planner":         "UniversalStrategyEngine",
  "Wellness Program":     "UniversalCreativeEngine",
  "Meal Planner":         "UniversalCreativeEngine",

  // ── Design ─────────────────────────────────────────────────────────────
  "Design System Builder":"ThemeEngine",
  "Design Sprint":        "ThemeEngine",
  "Widget Builder":       "ThemeEngine",
  "Theme":                "ThemeEngine",
  "Art Critique Studio":  "CritiqueEngine",
  "Usability Test":       "FeedbackEngine",
  "User Story Mapper":    "UniversalStrategyEngine",

  // ── Output / export ────────────────────────────────────────────────────
  "Export":               "ExportEngine",
  "Finance Report":       "ExportEngine",
  "Report Builder":       "ExportEngine",

  // ── Crypto / web3 ──────────────────────────────────────────────────────
  "Crypto Tokenomics":    "UniversalStrategyEngine",

  // ── Grant writing ──────────────────────────────────────────────────────
  "Grant Writer":         "UniversalCreativeEngine",
  "Nonprofit":            "UniversalStrategyEngine",
};

// ─── Keyword fallback resolver ────────────────────────────────────────────────

function resolveByKeyword(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("workflow") || l.includes("process") || l.includes("automat") || l.includes("trigger"))
    return "UniversalWorkflowEngine";
  if (l.includes("strateg") || l.includes("business") || l.includes("startup") || l.includes("market"))
    return "UniversalStrategyEngine";
  if (l.includes("writ") || l.includes("blog") || l.includes("content") || l.includes("copy") || l.includes("email"))
    return "UniversalCreativeEngine";
  if (l.includes("story") || l.includes("script") || l.includes("book") || l.includes("narrative") || l.includes("film"))
    return "UniversalStoryEngine";
  if (l.includes("game") || l.includes("dungeon") || l.includes("rpg") || l.includes("quest"))
    return "UniversalGameEngine";
  if (l.includes("research") || l.includes("insight") || l.includes("analys"))
    return "ResearchEngine";
  if (l.includes("regulat") || l.includes("complian") || l.includes("hipaa") || l.includes("legal") || l.includes("audit"))
    return "RegulatoryEngine";
  if (l.includes("backend") || l.includes("code") || l.includes("database") || l.includes("api") || l.includes("system") || l.includes("architect"))
    return "BackendBlueprintEngine";
  if (l.includes("learn") || l.includes("educat") || l.includes("course") || l.includes("train"))
    return "LearningEngine";
  if (l.includes("template") || l.includes("contract") || l.includes("draft"))
    return "TemplateLibrary";
  if (l.includes("persona") || l.includes("hiring") || l.includes("talent") || l.includes("people"))
    return "PersonaEngine";
  if (l.includes("feedback") || l.includes("survey") || l.includes("usabil"))
    return "FeedbackEngine";
  if (l.includes("theme") || l.includes("design") || l.includes("brand"))
    return "ThemeEngine";
  if (l.includes("integrat") || l.includes("connect") || l.includes("webhook"))
    return "IntegrationEngine";
  if (l.includes("export") || l.includes("report") || l.includes("dashboard"))
    return "ExportEngine";
  if (l.includes("expand") || l.includes("infinite") || l.includes("imagine") || l.includes("lab"))
    return "InfiniteExpansionEngine";
  return "BrainGen"; // universal fallback
}

/**
 * Maps an app label to the most appropriate engine ID.
 * First checks exact label match, then keyword heuristics, then BrainGen.
 */
export function resolveEngineId(label: string): string {
  if (LABEL_ENGINE[label]) return LABEL_ENGINE[label];
  return resolveByKeyword(label);
}

/**
 * Builds the context string injected alongside the user's topic.
 */
export function buildEngineContext(label: string, systemHint?: string): string {
  const lines: string[] = [];
  if (systemHint?.trim()) lines.push(systemHint.trim());
  lines.push(`You are the AI engine inside the "${label}" module of CreateAI Brain.`);
  lines.push(`Produce professional, complete, immediately usable output — not outlines or summaries unless asked.`);
  return lines.join("\n");
}
