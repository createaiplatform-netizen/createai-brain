// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM CONTROLLER — Single unified system controller.
// Every engine, module, series, image, export, and output type flows here.
// ═══════════════════════════════════════════════════════════════════════════

import {
  ALL_ENGINES,
  ALL_SERIES,
  runEngine    as _runEngine,
  runMetaAgent as _runMetaAgent,
  saveEngineOutput,
  getEngine,
  getSeries,
  getEnginesByCategory,
  type EngineDefinition,
  type SeriesDefinition,
  type EngineCategory,
} from "@/engine/CapabilityEngine";
import { parseBodyToSchema, documentToPlainText, type DocumentSchema } from "@/engines";
import { contextStore } from "@/store/platformContextStore";

// ─── Session-level prompt deduplication cache (ac-001) ────────────────────────
// Prevents redundant AI calls for identical engine + topic + context within 60 s.
// Cache is module-scoped and clears on page reload. Never stored to disk.
const _sessionCache = new Map<string, { result: string; ts: number }>();
const _SESSION_TTL = 60_000;

function _cacheKey(id: string, topic: string, ctx?: string): string {
  return `${id}\x00${topic.slice(0, 120)}\x00${(ctx ?? "").slice(0, 80)}`;
}

function _cacheGet(key: string): string | null {
  const e = _sessionCache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > _SESSION_TTL) { _sessionCache.delete(key); return null; }
  return e.result;
}

function _cacheSet(key: string, result: string): void {
  if (_sessionCache.size >= 200) {
    const oldest = _sessionCache.keys().next().value;
    if (oldest) _sessionCache.delete(oldest);
  }
  _sessionCache.set(key, { result, ts: Date.now() });
}

export function clearSessionCache(): void { _sessionCache.clear(); }

// ─── Context compression pipeline (ac-003) ────────────────────────────────────
// Strips extension noise + deduplicates scaffold file names before AI dispatch.
// Reduces scaffold context tokens by ~40–60 % with zero signal loss.
export function compressScaffoldContext(files: string[]): string[] {
  const seen = new Set<string>();
  return files
    .map(f => f.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 80))
    .filter(f => f.length > 0 && !seen.has(f) && seen.add(f));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EngineRunHandle {
  abort: () => void;
}

export interface EngineRunRequest {
  engineId: string;
  topic:    string;
  context?: string;
  mode?:    string;
  agentId?: string;
  onChunk:  (text: string) => void;
  onDone?:  (finalText: string) => void;
  onError?: (err: string) => void;
}

export interface SeriesRunRequest {
  seriesId:          string;
  topic:             string;
  context?:          string;
  onSectionStart?:   (engineId: string, index: number) => void;
  onChunk?:          (text: string, engineId: string, index: number) => void;
  onSectionDone?:    (engineId: string, index: number, text: string) => void;
  onDone?:           (sections: { engineId: string; text: string }[]) => void;
  onError?:          (err: string) => void;
}

export interface OutputMeta {
  engineId?:   string;
  engineName?: string;
  title?:      string;
  docType?:    string;
  author?:     string;
}

export interface ProcessedOutput {
  raw:       string;
  document:  DocumentSchema;
  plainText: string;
}

export interface SaveOutputOpts {
  engineId:   string;
  engineName: string;
  title:      string;
  content:    string;
  projectId?: string;
}

export interface ActivityEntry {
  engineId:    string;
  engineName:  string;
  topic:       string;
  timestamp:   number;
  outputLength: number;
  savedId?:    string | null;
}

export interface ImageGenOpts {
  quality?: "standard" | "hd";
  size?:    "1024x1024" | "1792x1024" | "1024x1792";
}

// ─── Intent → Engine routing table ───────────────────────────────────────────

const INTENT_ROUTE_MAP: Record<string, string> = {
  strategy:        "UniversalStrategyEngine",
  strategic:       "UniversalStrategyEngine",
  roadmap:         "UniversalStrategyEngine",
  positioning:     "UniversalStrategyEngine",
  competitive:     "CompetitiveIntelEngine",
  market:          "MarketOpportunityEngine",
  story:           "UniversalStoryEngine",
  narrative:       "UniversalStoryEngine",
  character:       "UniversalStoryEngine",
  worldbuilding:   "UniversalStoryEngine",
  creative:        "UniversalCreativeEngine",
  script:          "UniversalCreativeEngine",
  podcast:         "UniversalCreativeEngine",
  video:           "UniversalCreativeEngine",
  image:           "UniversalCreativeEngine",
  course:          "CourseDesignEngine",
  education:       "CourseDesignEngine",
  lesson:          "CourseDesignEngine",
  curriculum:      "CourseDesignEngine",
  workflow:        "UniversalWorkflowEngine",
  process:         "UniversalWorkflowEngine",
  automation:      "UniversalWorkflowEngine",
  compliance:      "ComplianceAuditEngine",
  regulatory:      "RegulatoryEngine",
  hipaa:           "RegulatoryEngine",
  gdpr:            "RegulatoryEngine",
  audit:           "ComplianceAuditEngine",
  content:         "ContentGenerationEngine",
  marketing:       "MarketingEngine",
  campaign:        "MarketingEngine",
  brand:           "BrandStrategyEngine",
  branding:        "BrandStrategyEngine",
  data:            "DataEngine",
  analytics:       "DataEngine",
  dashboard:       "DataEngine",
  security:        "SENTINEL",
  risk:            "SENTINEL",
  threat:          "SENTINEL",
  legal:           "LegalAIEngine",
  contract:        "LegalAIEngine",
  agreement:       "LegalAIEngine",
  research:        "ResearchEngine",
  study:           "ResearchEngine",
  literature:      "ResearchEngine",
  financial:       "FinancialModelEngine",
  finance:         "FinancialModelEngine",
  budget:          "FinancialModelEngine",
  investment:      "InvestorOutreachEngine",
  pitch:           "InvestorOutreachEngine",
  hr:              "HRPolicyEngine",
  hiring:          "RecruitmentEngine",
  recruitment:     "RecruitmentEngine",
  performance:     "PerformanceMgmtEngine",
  design:          "DesignSprintEngine",
  sprint:          "DesignSprintEngine",
  prototype:       "PrototypingEngine",
  product:         "ProductDesignEngine",
  trend:           "TrendsAnalysisEngine",
  foresight:       "ForesightEngine",
  expansion:       "InfiniteExpansionEngine",
  idea:            "InfiniteExpansionEngine",
  brainstorm:      "InfiniteExpansionEngine",
  integration:     "IntegrationEngine",
  connect:         "UniversalConnectionEngine",
  connection:      "UniversalConnectionEngine",
  health:          "HealthcareEngine",
  medical:         "HealthcareEngine",
  clinical:        "HealthcareEngine",
  sustainability:  "SustainabilityEngine",
  green:           "SustainabilityEngine",
  climate:         "SustainabilityEngine",
  scale:           "ScalingEngine",
  scaling:         "ScalingEngine",
  infrastructure:  "ScalingEngine",
  accessibility:   "AccessibilityEngine",
  wcag:            "AccessibilityEngine",
  ada:             "AccessibilityEngine",
  code:            "ScalingEngine",
  app:             "InfiniteExpansionEngine",
};

// ─── App → Engine registry ────────────────────────────────────────────────────

export interface AppEngineConfig {
  primaryEngines:  string[];
  primarySeries?:  string[];
  category:        EngineCategory;
  outputType:      "document" | "form" | "stream" | "structured" | "image" | "code";
}

export const APP_ENGINE_REGISTRY: Record<string, AppEngineConfig> = {
  braingen:       { primaryEngines: ["UniversalCreativeEngine", "ContentGenerationEngine", "UniversalStoryEngine"],         primarySeries: ["QuantumCreativity"],       category: "creative",      outputType: "document" },
  brainhub:       { primaryEngines: ["InfiniteExpansionEngine", "NEXUS", "SENTINEL"],                                       primarySeries: ["Ω-Series", "ICE-Series"],  category: "universal",     outputType: "document" },
  strategist:     { primaryEngines: ["UniversalStrategyEngine", "CompetitiveIntelEngine", "MarketOpportunityEngine"],       primarySeries: ["Ω-Series"],               category: "intelligence",  outputType: "document" },
  marketing:      { primaryEngines: ["MarketingEngine", "ContentGenerationEngine", "BrandStrategyEngine"],                  category: "creative",      outputType: "document" },
  legal:          { primaryEngines: ["LegalAIEngine", "ComplianceAuditEngine", "RegulatoryEngine"],                         category: "legal",         outputType: "document" },
  documents:      { primaryEngines: ["UniversalCreativeEngine", "ContentGenerationEngine"],                                 category: "universal",     outputType: "document" },
  family:         { primaryEngines: ["UniversalStoryEngine", "UniversalCreativeEngine"],                                    category: "creative",      outputType: "document" },
  research:       { primaryEngines: ["ResearchEngine", "DataEngine", "TrendsAnalysisEngine"],                               primarySeries: ["InsightDeliverySeries"],   category: "research",      outputType: "document" },
  finance:        { primaryEngines: ["FinancialModelEngine", "InvestorOutreachEngine"],                                     category: "finance",       outputType: "document" },
  hr:             { primaryEngines: ["HRPolicyEngine", "RecruitmentEngine", "PerformanceMgmtEngine"],                       category: "hr",            outputType: "document" },
  admin:          { primaryEngines: ["UniversalWorkflowEngine", "ComplianceAuditEngine"],                                   category: "operations",    outputType: "document" },
  creator:        { primaryEngines: ["UniversalCreativeEngine", "ContentGenerationEngine"],                                 primarySeries: ["QuantumCreativity"],       category: "creative",      outputType: "document" },
  healthcare:     { primaryEngines: ["HealthcareEngine", "RegulatoryEngine", "ComplianceAuditEngine"],                      category: "healthcare",    outputType: "document" },
  education:      { primaryEngines: ["CourseDesignEngine", "VirtualClassroomEngine", "TeacherToolsEngine"],                 primarySeries: ["StudentSuccessSeries"],    category: "education",     outputType: "document" },
  security:       { primaryEngines: ["SENTINEL", "ComplianceAuditEngine"],                                                  category: "security",      outputType: "document" },
  sustainability: { primaryEngines: ["SustainabilityEngine"],                                                               category: "sustainability", outputType: "document" },
  imagination:    { primaryEngines: ["UniversalStoryEngine", "UniversalCreativeEngine"],                                    primarySeries: ["QuantumCreativity"],       category: "imagination",   outputType: "document" },
  product:        { primaryEngines: ["ProductDesignEngine", "DesignSprintEngine", "PrototypingEngine"],                     category: "product",       outputType: "document" },

  // ── OS & Platform ─────────────────────────────────────────────────────────
  chat:            { primaryEngines: ["ConversationEngine", "InteractionEngine", "PULSE"],                                  category: "universal",     outputType: "document" },
  projects:        { primaryEngines: ["ProjectIntelligence", "UniversalWorkflowEngine", "BackendBlueprintEngine"],          primarySeries: ["ab"],     category: "operations",    outputType: "document" },
  tools:           { primaryEngines: ["UniversalWorkflowEngine", "AutomationEngine", "DataModelEngine"],                    category: "operations",    outputType: "document" },
  people:          { primaryEngines: ["HRPolicyEngine", "RecruitmentEngine", "CommunicationEngine"],                        category: "hr",            outputType: "document" },
  notifications:   { primaryEngines: ["InteractionEngine", "PULSE", "ConversationEngine"],                                  category: "universal",     outputType: "document" },
  integration:     { primaryEngines: ["IntegrationEngine", "BackendBlueprintEngine", "NEXUS"],                              primarySeries: ["chi"],    category: "operations",    outputType: "document" },
  monetization:    { primaryEngines: ["MonetizationEngine", "PricingEngine", "GrowthEngine"],                               primarySeries: ["rho"],    category: "finance",       outputType: "document" },
  simulation:      { primaryEngines: ["InfiniteExpansionEngine", "ORACLE", "UniversalStrategyEngine"],                      primarySeries: ["xi"],     category: "universal",     outputType: "document" },
  universal:       { primaryEngines: ["InfiniteExpansionEngine", "ORACLE", "FORGE", "NEXUS"],                               primarySeries: ["omega"],  category: "universal",     outputType: "document" },

  // ── Business & Strategy ───────────────────────────────────────────────────
  business:        { primaryEngines: ["UniversalStrategyEngine", "MarketResearchEngine", "FinancialModelEngine"],           primarySeries: ["omega"],  category: "operations",    outputType: "document" },
  entity:          { primaryEngines: ["CorpGovernEngine", "LegalAIEngine", "EquityStructureEngine"],                        category: "legal",         outputType: "document" },
  bizcreator:      { primaryEngines: ["BackendBlueprintEngine", "UniversalStrategyEngine", "MarketResearchEngine"],         primarySeries: ["ab"],     category: "operations",    outputType: "document" },
  bizdev:          { primaryEngines: ["PartnershipEngine", "OpportunityEngine", "UniversalStrategyEngine"],                 primarySeries: ["psi"],    category: "operations",    outputType: "document" },
  projbuilder:     { primaryEngines: ["ProjectIntelligence", "BackendBlueprintEngine", "UniversalWorkflowEngine"],          primarySeries: ["ab"],     category: "operations",    outputType: "document" },
  projos:          { primaryEngines: ["ProjectIntelligence", "UniversalWorkflowEngine", "DeliverableEngine"],               primarySeries: ["ab"],     category: "operations",    outputType: "document" },
  opportunity:     { primaryEngines: ["OpportunityEngine", "MarketResearchEngine", "UniversalStrategyEngine"],              primarySeries: ["opportunity"], category: "operations", outputType: "document" },
  leadCycle:       { primaryEngines: ["OpportunityEngine", "ContentStrategyEngine", "DeliverableEngine"],                   primarySeries: ["psi"],    category: "operations",    outputType: "document" },
  traction:        { primaryEngines: ["GrowthEngine", "AnalyticsEngine", "MonetizationEngine"],                             primarySeries: ["gamma"],  category: "operations",    outputType: "document" },
  commandcenter:   { primaryEngines: ["InfiniteExpansionEngine", "NEXUS", "SENTINEL", "ORACLE"],                            primarySeries: ["xi"],     category: "universal",     outputType: "document" },

  // ── Research & Intelligence ───────────────────────────────────────────────
  researchhub:     { primaryEngines: ["ResearchEngine", "TrendsAnalysisEngine", "DataModelEngine"],                         primarySeries: ["ResFoundationSeries"], category: "research", outputType: "document" },
  learningcenter:  { primaryEngines: ["CourseDesignEngine", "InstructionalEngine", "AdaptiveLearningEngine"],               primarySeries: ["LearningDesignSeries"], category: "education", outputType: "document" },
  personastudio:   { primaryEngines: ["PersonaEngine", "CommunicationEngine", "MarketResearchEngine"],                      category: "operations",      outputType: "document" },
  datastudio:      { primaryEngines: ["DataModelEngine", "DataSchemaEngine", "VECTOR"],                                     primarySeries: ["delta"],  category: "research",      outputType: "document" },
  pricingstudio:   { primaryEngines: ["PricingEngine", "MonetizationEngine", "UnitEconomicsEngine"],                        category: "finance",       outputType: "document" },

  // ── Creative Writing ──────────────────────────────────────────────────────
  scriptwriter:    { primaryEngines: ["UniversalStoryEngine", "NarratorEngine", "ContentGenerationEngine"],                 primarySeries: ["imag"],   category: "creative",      outputType: "document" },
  comicscript:     { primaryEngines: ["ComicPlotEngine", "CharacterEngine", "WorldbuildingEngine"],                         primarySeries: ["imag"],   category: "creative",      outputType: "document" },
  poemforge:       { primaryEngines: ["UniversalCreativeEngine", "ContentGenerationEngine", "PULSE"],                       category: "creative",      outputType: "document" },
  essaywriter:     { primaryEngines: ["UniversalCreativeEngine", "ContentGenerationEngine", "CritiqueEngine"],              category: "creative",      outputType: "document" },
  blogwriter:      { primaryEngines: ["ContentGenerationEngine", "ContentStrategyEngine", "BrandStrategyEngine"],           primarySeries: ["tau"],    category: "creative",      outputType: "document" },
  copywriter:      { primaryEngines: ["ContentGenerationEngine", "BrandStrategyEngine", "PULSE"],                           primarySeries: ["tau"],    category: "creative",      outputType: "document" },
  storyboarder:    { primaryEngines: ["UniversalStoryEngine", "CharacterEngine", "WorldbuildingEngine"],                    primarySeries: ["imag"],   category: "creative",      outputType: "document" },
  speechwriter:    { primaryEngines: ["ContentGenerationEngine", "CommunicationEngine", "PULSE"],                           category: "creative",      outputType: "document" },
  bookplanner:     { primaryEngines: ["UniversalStoryEngine", "ContentGenerationEngine", "CharacterEngine"],                primarySeries: ["imag"],   category: "creative",      outputType: "document" },
  technicalwriter: { primaryEngines: ["ContentGenerationEngine", "BackendBlueprintEngine", "TemplateLibrary"],              primarySeries: ["de"],     category: "creative",      outputType: "document" },
  contentcalendar: { primaryEngines: ["ContentStrategyEngine", "ContentGenerationEngine", "MarketingEngine"],               primarySeries: ["tau"],    category: "creative",      outputType: "document" },
  lyricswriter:    { primaryEngines: ["UniversalCreativeEngine", "ContentGenerationEngine", "PULSE"],                       category: "creative",      outputType: "document" },
  songstructure:   { primaryEngines: ["UniversalCreativeEngine", "ContentGenerationEngine"],                                category: "creative",      outputType: "document" },
  podcastplanner:  { primaryEngines: ["ContentStrategyEngine", "ContentGenerationEngine", "CommunicationEngine"],           category: "creative",      outputType: "document" },
  sounddesigner:   { primaryEngines: ["UniversalCreativeEngine", "ContentGenerationEngine"],                                category: "creative",      outputType: "document" },

  // ── Business Documents ────────────────────────────────────────────────────
  reportbuilder:   { primaryEngines: ["ContentGenerationEngine", "TemplateLibrary", "DeliverableEngine"],                   primarySeries: ["de"],     category: "operations",      outputType: "document" },
  proposalbuilder: { primaryEngines: ["UniversalStrategyEngine", "ContentGenerationEngine", "DeliverableEngine"],           primarySeries: ["de"],     category: "operations",      outputType: "document" },
  emailcomposer:   { primaryEngines: ["ContentGenerationEngine", "CommunicationEngine", "PULSE"],                           category: "operations",      outputType: "document" },
  meetingplanner:  { primaryEngines: ["UniversalWorkflowEngine", "ContentGenerationEngine", "TemplateLibrary"],             category: "operations",    outputType: "document" },
  presentbuilder:  { primaryEngines: ["ContentGenerationEngine", "DeliverableEngine", "TemplateLibrary"],                   primarySeries: ["de"],     category: "operations",      outputType: "document" },
  budgetplanner:   { primaryEngines: ["BudgetingEngine", "FinancialModelEngine", "CashFlowEngine"],                         primarySeries: ["FinFoundationSeries"], category: "finance", outputType: "document" },
  perfreviewer:    { primaryEngines: ["PerformanceMgmtEngine", "HRPolicyEngine", "ContentGenerationEngine"],                category: "hr",            outputType: "document" },
  contractdraft:   { primaryEngines: ["ContractIntelEngine", "LegalAIEngine", "TemplateLibrary"],                           primarySeries: ["ContractLegalSeries"], category: "legal", outputType: "document" },
  hiringassist:    { primaryEngines: ["RecruitmentEngine", "HRPolicyEngine", "ContentGenerationEngine"],                    primarySeries: ["TalentLifecycleSeries"], category: "hr", outputType: "document" },
  legaldrafter:    { primaryEngines: ["LegalAIEngine", "ContractIntelEngine", "RegulatoryEngine"],                          primarySeries: ["ContractLegalSeries"], category: "legal", outputType: "document" },
  ipprotection:    { primaryEngines: ["IPPortfolioEngine", "LegalAIEngine", "ComplianceAuditEngine"],                       primarySeries: ["CorporateLegalSeries"], category: "legal", outputType: "document" },
  privacypolicy:   { primaryEngines: ["PrivacyDesignEngine", "RegulatoryEngine", "ComplianceAuditEngine"],                  primarySeries: ["PrivacyCompSeries"], category: "legal", outputType: "document" },
  devplanner:      { primaryEngines: ["ProjectIntelligence", "BackendBlueprintEngine", "UniversalWorkflowEngine"],          primarySeries: ["ab"],     category: "operations",    outputType: "document" },

  // ── World & Universe Building ─────────────────────────────────────────────
  alienspecies:    { primaryEngines: ["CreatureEngine", "WorldbuildingEngine", "UniversalCreativeEngine"],                  primarySeries: ["quest"],  category: "creative",      outputType: "document" },
  planetbuilder:   { primaryEngines: ["WorldbuildingEngine", "CosmologyEngine", "UniversalCreativeEngine"],                 primarySeries: ["arcane"], category: "creative",      outputType: "document" },
  futurecivilization: { primaryEngines: ["WorldbuildingEngine", "CivilizationEngine", "FutureTechFictionEngine"],           primarySeries: ["arcane"], category: "creative",      outputType: "document" },
  monsterforge:    { primaryEngines: ["CreatureEngine", "WorldbuildingEngine", "AdventureEngine"],                          primarySeries: ["quest"],  category: "creative",      outputType: "document" },
  artifactforge:   { primaryEngines: ["RelicEngine", "WorldbuildingEngine", "LoreEngine"],                                  primarySeries: ["lore"],   category: "creative",      outputType: "document" },
  dimensionbuilder:{ primaryEngines: ["WorldbuildingEngine", "CosmologyEngine", "DreamscapeEngine"],                        primarySeries: ["dreamscape"], category: "creative",  outputType: "document" },
  dystopia:        { primaryEngines: ["WorldbuildingEngine", "CivilizationEngine", "UniversalStoryEngine"],                 primarySeries: ["imag"],   category: "creative",      outputType: "document" },
  utopia:          { primaryEngines: ["WorldbuildingEngine", "CivilizationEngine", "UniversalStoryEngine"],                 primarySeries: ["imag"],   category: "creative",      outputType: "document" },
  ancientcivilization: { primaryEngines: ["AncientHistoryEngine", "CivilizationEngine", "LoreEngine"],                     primarySeries: ["lore"],   category: "creative",      outputType: "document" },
  characterforge:  { primaryEngines: ["CharacterEngine", "WorldbuildingEngine", "UniversalStoryEngine"],                    primarySeries: ["imag"],   category: "creative",      outputType: "document" },
  dungeonbuilder:  { primaryEngines: ["AdventureEngine", "WorldbuildingEngine", "CreatureEngine"],                          primarySeries: ["quest"],  category: "creative",      outputType: "document" },
  questdesigner:   { primaryEngines: ["AdventureEngine", "WorldbuildingEngine", "CharacterEngine"],                         primarySeries: ["quest"],  category: "creative",      outputType: "document" },
  npccreator:      { primaryEngines: ["CharacterEngine", "WorldbuildingEngine", "ConversationEngine"],                      primarySeries: ["imag"],   category: "creative",      outputType: "document" },
  itemforge:       { primaryEngines: ["RelicEngine", "WorldbuildingEngine", "UniversalCreativeEngine"],                     primarySeries: ["lore"],   category: "creative",      outputType: "document" },
  gamenarrative:   { primaryEngines: ["UniversalStoryEngine", "CharacterEngine", "AdventureEngine"],                        primarySeries: ["quest"],  category: "creative",      outputType: "document" },
  balancedesigner: { primaryEngines: ["GameIdeaEngine", "UniversalStrategyEngine", "DataModelEngine"],                      primarySeries: ["fiction-tech"], category: "creative", outputType: "document" },

  // ── Forge Apps ────────────────────────────────────────────────────────────
  imaginationlab:  { primaryEngines: ["UniversalStoryEngine", "CharacterEngine", "WorldbuildingEngine"],                    primarySeries: ["imag", "quest"], category: "creative", outputType: "document" },
  loreforge:       { primaryEngines: ["LoreEngine", "MythologyEngine", "AncientHistoryEngine"],                             primarySeries: ["mythos", "lore"], category: "creative", outputType: "document" },
  narratoros:      { primaryEngines: ["NarratorEngine", "UniversalStoryEngine", "CharacterEngine"],                         primarySeries: ["imag"],   category: "creative",      outputType: "document" },
  civilizationforge: { primaryEngines: ["CivilizationEngine", "WorldbuildingEngine", "AncientHistoryEngine"],               primarySeries: ["mythos"], category: "creative",      outputType: "document" },
  ecologyforge:    { primaryEngines: ["EcologyEngine", "BiodiversityEngine", "WorldbuildingEngine"],                        category: "creative",      outputType: "document" },
  soundscape:      { primaryEngines: ["SoundscapeEngine", "UniversalCreativeEngine"],                                       category: "creative",      outputType: "document" },
  timelineforge:   { primaryEngines: ["TimelineEngine", "AncientHistoryEngine", "WorldbuildingEngine"],                     primarySeries: ["lore"],   category: "creative",      outputType: "document" },
  mythweave:       { primaryEngines: ["MythologyEngine", "ReligionEngine", "LoreEngine"],                                   primarySeries: ["mythos"], category: "creative",      outputType: "document" },
  languageforge:   { primaryEngines: ["LanguageForgeEngine", "WorldbuildingEngine", "CivilizationEngine"],                  primarySeries: ["language"], category: "creative",    outputType: "document" },
  magicsystem:     { primaryEngines: ["MagicSystemEngine", "WorldbuildingEngine", "LoreEngine"],                            primarySeries: ["arcane"], category: "creative",      outputType: "document" },
  urbanworld:      { primaryEngines: ["UrbanWorldEngine", "CivilizationEngine", "WorldbuildingEngine"],                     primarySeries: ["mythos"], category: "creative",      outputType: "document" },
  warlore:         { primaryEngines: ["WarloreEngine", "CivilizationEngine", "AncientHistoryEngine"],                       primarySeries: ["faction"], category: "creative",     outputType: "document" },
  techforge:       { primaryEngines: ["TechForgeEngine", "BackendBlueprintEngine", "UniversalStrategyEngine"],              primarySeries: ["ab"],     category: "creative",      outputType: "document" },
  visualworld:     { primaryEngines: ["VisualWorldEngine", "WorldbuildingEngine", "UniversalCreativeEngine"],               primarySeries: ["dreamscape"], category: "creative",  outputType: "document" },
  religionforge:   { primaryEngines: ["ReligionForgeEngine", "MythologyEngine", "CivilizationEngine"],                      primarySeries: ["mythos"], category: "creative",      outputType: "document" },
  cosmologyforge:  { primaryEngines: ["CosmologyForgeEngine", "WorldbuildingEngine", "MythologyEngine"],                    primarySeries: ["mythos"], category: "creative",      outputType: "document" },
  gameworld:       { primaryEngines: ["GameWorldEngine", "WorldbuildingEngine", "AdventureEngine"],                         primarySeries: ["quest"],  category: "creative",      outputType: "document" },
  artcritique:     { primaryEngines: ["CritiqueEngine", "UniversalCreativeEngine", "ContentGenerationEngine"],              category: "creative",      outputType: "document" },
  filmanalysis:    { primaryEngines: ["CritiqueEngine", "NarratorEngine", "UniversalStoryEngine"],                          category: "creative",      outputType: "document" },
  culturalexplorer:{ primaryEngines: ["CivilizationEngine", "WorldbuildingEngine", "ResearchEngine"],                       category: "creative",      outputType: "document" },


  // ── Learning & Research ───────────────────────────────────────────────────
  researchassist:  { primaryEngines: ["ResearchEngine", "CritiqueEngine", "DataModelEngine"],                               primarySeries: ["ResFoundationSeries"], category: "research", outputType: "document" },
  conceptexplainer:{ primaryEngines: ["InstructionalEngine", "ContentGenerationEngine", "MENTOR"],                          category: "education",     outputType: "document" },
  debateprep:      { primaryEngines: ["CritiqueEngine", "ResearchEngine", "ContentGenerationEngine"],                       category: "research",      outputType: "document" },
  criticalthinking:{ primaryEngines: ["CritiqueEngine", "ResearchEngine", "MENTOR"],                                        category: "research",      outputType: "document" },
  philosophyexplorer:{ primaryEngines: ["ResearchEngine", "ContentGenerationEngine", "CritiqueEngine"],                    category: "research",      outputType: "document" },
  studyplanner:    { primaryEngines: ["CurriculumDesignEngine", "InstructionalEngine", "AdaptiveLearningEngine"],           primarySeries: ["LearningDesignSeries"], category: "education", outputType: "document" },
  scienceexplainer:{ primaryEngines: ["ResearchEngine", "InstructionalEngine", "ContentGenerationEngine"],                  category: "education",     outputType: "document" },
  mathsolver:      { primaryEngines: ["DataModelEngine", "InstructionalEngine", "ContentGenerationEngine"],                 category: "education",     outputType: "document" },
  lessonplanner:   { primaryEngines: ["CurriculumDesignEngine", "InstructionalEngine", "TeacherToolsEngine"],               primarySeries: ["LearningDesignSeries"], category: "education", outputType: "document" },
  curriculumdesigner:{ primaryEngines: ["CurriculumDesignEngine", "InstructionalEngine", "LMSArchEngine"],                  primarySeries: ["EdTechPlatSeries"], category: "education", outputType: "document" },

  // ── Lifestyle & Personal ──────────────────────────────────────────────────
  journal:         { primaryEngines: ["PULSE", "ContentGenerationEngine", "UniversalCreativeEngine"],                       category: "creative",      outputType: "document" },
  goalplanner:     { primaryEngines: ["UniversalWorkflowEngine", "UniversalStrategyEngine", "PULSE"],                       category: "operations",    outputType: "document" },
  travelplanner:   { primaryEngines: ["ContentGenerationEngine", "ResearchEngine", "PULSE"],                                category: "creative",      outputType: "document" },
  recipecreator:   { primaryEngines: ["ContentGenerationEngine", "UniversalCreativeEngine"],                                category: "creative",      outputType: "document" },
  fitnesscoach:    { primaryEngines: ["WellnessEngine", "ContentGenerationEngine", "PULSE"],                                category: "creative",      outputType: "document" },
  meditationguide: { primaryEngines: ["PULSE", "ContentGenerationEngine", "UniversalCreativeEngine"],                       category: "creative",      outputType: "document" },
  financeadvisor:  { primaryEngines: ["FinancialModelEngine", "UnitEconomicsEngine", "CashFlowEngine"],                     primarySeries: ["FinFoundationSeries"], category: "finance", outputType: "document" },
  relationshipcoach:{ primaryEngines: ["PULSE", "CommunicationEngine", "ContentGenerationEngine"],                          category: "creative",      outputType: "document" },
  healthcoach:     { primaryEngines: ["WellnessEngine", "ContentGenerationEngine", "PULSE"],                                category: "healthcare",    outputType: "document" },
  mentalhealth:    { primaryEngines: ["WellnessEngine", "PULSE", "ContentGenerationEngine"],                                category: "healthcare",    outputType: "document" },
  nutritionplanner:{ primaryEngines: ["WellnessEngine", "ContentGenerationEngine"],                                         category: "healthcare",    outputType: "document" },
  sleepcoach:      { primaryEngines: ["WellnessEngine", "PULSE", "ContentGenerationEngine"],                                category: "healthcare",    outputType: "document" },
  parentingguide:  { primaryEngines: ["PULSE", "ContentGenerationEngine", "InstructionalEngine"],                           category: "creative",      outputType: "document" },

  // ── Music & Audio ─────────────────────────────────────────────────────────
  musictheory:     { primaryEngines: ["UniversalCreativeEngine", "ContentGenerationEngine", "InstructionalEngine"],         category: "creative",      outputType: "document" },

  // ── Systems & Dev Tools ───────────────────────────────────────────────────
  codereviewer:    { primaryEngines: ["BackendBlueprintEngine", "CritiqueEngine", "SecureSDLCEngine"],                      category: "operations",    outputType: "document" },
  systemdesigner:  { primaryEngines: ["BackendBlueprintEngine", "DataModelEngine", "ARCHITECT"],                            primarySeries: ["sigma"],  category: "operations",    outputType: "document" },
  promptengineer:  { primaryEngines: ["ContentGenerationEngine", "InteractionEngine", "ORACLE"],                            category: "operations",    outputType: "document" },
  datastoryteller: { primaryEngines: ["DataModelEngine", "ContentGenerationEngine", "VECTOR"],                              primarySeries: ["delta"],  category: "research",      outputType: "document" },

  // ── Platform / System ─────────────────────────────────────────────────────
  ucpx:            { primaryEngines: ["InfiniteExpansionEngine", "ORACLE", "FORGE", "NEXUS", "SENTINEL"],                   primarySeries: ["xi", "omega"],  category: "universal",   outputType: "document" },
  universalDemo:   { primaryEngines: ["InteractionEngine", "IntegrationEngine", "UniversalWorkflowEngine"],                  primarySeries: ["ice"],          category: "universal",   outputType: "document" },
  genericEngine:   { primaryEngines: ["ContentGenerationEngine", "UniversalStrategyEngine", "ResearchEngine", "ORACLE"],    primarySeries: ["omega"],        category: "universal",   outputType: "document" },
  metricsPanel:    { primaryEngines: ["AnalyticsEngine", "VECTOR", "DataModelEngine"],                                      primarySeries: ["iota"],   category: "universal",     outputType: "document" },
  integrationDashboard: { primaryEngines: ["IntegrationEngine", "BackendBlueprintEngine", "NEXUS"],                        primarySeries: ["chi"],    category: "operations",    outputType: "document" },
};

// ─── Module-level streaming function (usable outside React) ──────────────────
// Every app, module, and engine that needs to run AI should call this.

export async function streamEngine(opts: {
  engineId:       string;
  topic:          string;
  context?:       string;
  mode?:          string;
  signal?:        AbortSignal;
  skipContext?:   boolean;
  skipCache?:     boolean;
  onChunk:        (text: string) => void;
  onDone?:        (fullText: string) => void;
  onError?:       (err: string) => void;
}): Promise<void> {
  const engine = getEngine(opts.engineId);
  const engineName = engine?.name ?? opts.engineId;
  let accumulated = "";

  // ── Shared-context injection ─────────────────────────────────────────────
  let enrichedContext = opts.context ?? "";
  if (!opts.skipContext) {
    const sharedCtx = contextStore.buildContextFor(opts.engineId);
    if (sharedCtx) {
      enrichedContext = enrichedContext
        ? `${enrichedContext}\n\n${sharedCtx}`
        : sharedCtx;
    }
  }

  // ── Session-level dedup cache (ac-001) ───────────────────────────────────
  if (!opts.skipCache) {
    const cacheKey = _cacheKey(opts.engineId, opts.topic, enrichedContext);
    const cached = _cacheGet(cacheKey);
    if (cached) {
      opts.onChunk(cached);
      if (accumulated === "") accumulated = cached;
      contextStore.recordOutput(opts.engineId, engineName, opts.topic, cached);
      opts.onDone?.(cached);
      return;
    }
    // We need to cache after completion — store the key for closure below
    const _finalCacheKey = cacheKey;
    return new Promise<void>((resolve) => {
      const handleChunk = (t: string) => { accumulated += t; opts.onChunk(t); };
      const handleDone  = () => {
        if (accumulated) {
          contextStore.recordOutput(opts.engineId, engineName, opts.topic, accumulated);
          _cacheSet(_finalCacheKey, accumulated);
        }
        opts.onDone?.(accumulated);
        resolve();
      };
      const handleError = (e: string) => { opts.onError?.(e); resolve(); };

      if (engine?.category === "meta-agent") {
        _runMetaAgent({
          agentId: opts.engineId,
          task:    opts.topic,
          context: enrichedContext || undefined,
          onChunk: handleChunk,
          onDone:  handleDone,
          onError: handleError,
        });
      } else {
        _runEngine({
          engineId:   opts.engineId,
          engineName,
          topic:      opts.topic,
          context:    enrichedContext || undefined,
          mode:       opts.mode,
          signal:     opts.signal,
          onChunk:    handleChunk,
          onDone:     handleDone,
          onError:    handleError,
        });
      }
    });
  }

  return new Promise<void>((resolve) => {
    const handleChunk = (t: string) => { accumulated += t; opts.onChunk(t); };
    const handleDone  = () => {
      // ── Record output in shared context store ────────────────────────────
      if (accumulated) {
        contextStore.recordOutput(opts.engineId, engineName, opts.topic, accumulated);
      }
      opts.onDone?.(accumulated);
      resolve();
    };
    const handleError = (e: string) => { opts.onError?.(e); resolve(); };

    if (engine?.category === "meta-agent") {
      _runMetaAgent({
        agentId: opts.engineId,
        task:    opts.topic,
        context: enrichedContext || undefined,
        onChunk: handleChunk,
        onDone:  handleDone,
        onError: handleError,
      });
    } else {
      _runEngine({
        engineId:   opts.engineId,
        engineName,
        topic:      opts.topic,
        context:    enrichedContext || undefined,
        mode:       opts.mode,
        signal:     opts.signal,
        onChunk:    handleChunk,
        onDone:     handleDone,
        onError:    handleError,
      });
    }
  });
}

// ─── Module-level series runner (usable outside React) ───────────────────────

export async function streamSeries(opts: {
  seriesId:         string;
  topic:            string;
  context?:         string;
  signal?:          AbortSignal;
  onSectionStart?:  (engineId: string, index: number) => void;
  onChunk?:         (text: string) => void;
  onSectionEnd?:    (engineId: string) => void;
  onDone?:          () => void;
  onError?:         (err: string) => void;
}): Promise<void> {
  try {
    const resp = await fetch("/api/openai/series-run", {
      method:      "POST",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({ seriesId: opts.seriesId, topic: opts.topic, context: opts.context }),
      signal:      opts.signal,
    });
    if (!resp.ok || !resp.body) { opts.onError?.(`Series returned ${resp.status}`); return; }
    const reader  = resp.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split("\n")) {
        if (!line.startsWith("data:")) continue;
        try {
          const p = JSON.parse(line.slice(5).trim()) as { type?: string; content?: string; engineId?: string; sectionIndex?: number; done?: boolean };
          if (p.type === "section-start" && p.engineId) opts.onSectionStart?.(p.engineId, p.sectionIndex ?? 0);
          if (p.content) opts.onChunk?.(p.content);
          if (p.type === "section-end" && p.engineId) opts.onSectionEnd?.(p.engineId);
          if (p.done) { opts.onDone?.(); return; }
        } catch { /* skip malformed */ }
      }
    }
    opts.onDone?.();
  } catch (err) {
    if ((err as Error).name !== "AbortError") opts.onError?.((err as Error).message);
  }
}

// ─── Module-level chat (multi-turn, usable outside React) ────────────────────

export async function streamChat(opts: {
  messages:  { role: string; content: string }[];
  workspace?: string;
  signal?:   AbortSignal;
  onChunk?:  (delta: string, accumulated: string) => void;
  onDone?:   (fullText: string) => void;
  onError?:  (err: string) => void;
}): Promise<void> {
  try {
    const response = await fetch("/api/openai/chat", {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify({ messages: opts.messages, model: "gpt-5.2", workspace: opts.workspace ?? "Main Brain" }),
      signal:      opts.signal,
    });
    if (!response.ok || !response.body) { opts.onError?.(`Chat returned ${response.status}`); return; }
    const reader      = response.body.getReader();
    const decoder     = new TextDecoder();
    let   accumulated = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") continue;
        try {
          const parsed = JSON.parse(raw);
          const delta  = parsed.choices?.[0]?.delta?.content ?? parsed.content ?? "";
          if (delta) { accumulated += delta; opts.onChunk?.(delta, accumulated); }
        } catch { /* skip */ }
      }
    }
    opts.onDone?.(accumulated);
  } catch (err) {
    if ((err as Error).name !== "AbortError") opts.onError?.((err as Error).message);
  }
}

// ─── Module-level brainstorm (session-aware, usable outside React) ────────────

export async function streamBrainstorm(opts: {
  sessionId:        number;
  message:          string;
  history:          { role: string; content: string }[];
  signal:           AbortSignal;
  onChunk:          (text: string) => void;
  onProjectCreated?: (p: { id: string; name: string; industry: string; icon: string; color: string }) => void;
}): Promise<void> {
  try {
    const res = await fetch(`/api/brainstorm/sessions/${opts.sessionId}/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ message: opts.message, history: opts.history }),
      signal:  opts.signal,
    });
    if (!res.ok || !res.body) return;
    const reader = res.body.getReader();
    const dec    = new TextDecoder();
    let   acc    = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += dec.decode(value, { stream: true });
      const parts = acc.split("\n\n");
      acc = parts.pop() ?? "";
      for (const part of parts) {
        if (!part.startsWith("data: ")) continue;
        const raw = part.slice(6).trim();
        if (raw === "[DONE]") return;
        try {
          const p = JSON.parse(raw) as { content?: string; projectCreated?: { id: string; name: string; industry: string; icon: string; color: string } };
          if (p.projectCreated && opts.onProjectCreated) opts.onProjectCreated(p.projectCreated);
          else if (p.content) opts.onChunk(p.content);
        } catch { /* skip */ }
      }
    }
  } catch (err) {
    if ((err as Error).name !== "AbortError") throw err;
  }
}

// ─── Project-specific chat (session-aware, routes to dedicated endpoint) ─────

export async function streamProjectChat(opts: {
  projectId:     string;
  message:       string;
  history:       { role: "user" | "assistant"; content: string }[];
  scaffoldFiles?: string[];
  projectType?:  string;
  signal?:       AbortSignal;
  onChunk:       (text: string) => void;
  onDone?:       (fullText: string) => void;
}): Promise<void> {
  try {
    const res = await fetch(`/api/project-chat/${opts.projectId}/chat`, {
      method:      "POST",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({
        message:       opts.message,
        history:       opts.history,
        projectType:   opts.projectType,
        scaffoldFiles: opts.scaffoldFiles
          ? compressScaffoldContext(opts.scaffoldFiles)
          : undefined,
      }),
      signal:      opts.signal,
    });
    if (!res.ok || !res.body) return;
    const reader = res.body.getReader();
    const dec    = new TextDecoder();
    let acc    = "";
    let full   = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += dec.decode(value, { stream: true });
      const parts = acc.split("\n\n");
      acc = parts.pop() ?? "";
      for (const part of parts) {
        if (!part.startsWith("data: ")) continue;
        const raw = part.slice(6).trim();
        if (raw === "[DONE]") { opts.onDone?.(full); return; }
        try {
          const p = JSON.parse(raw) as { content?: string };
          if (p.content) { full += p.content; opts.onChunk(p.content); }
        } catch { /* skip malformed */ }
      }
    }
    opts.onDone?.(full);
  } catch (err) {
    if ((err as Error).name !== "AbortError") throw err;
  }
}

// ─── Export utilities (usable anywhere) ──────────────────────────────────────

export function exportToPDF(title?: string): void {
  const prev = document.title;
  if (title) document.title = title;
  window.print();
  setTimeout(() => { document.title = prev; }, 500);
}

export function exportToMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: `${filename}.md` }).click();
  URL.revokeObjectURL(url);
}

export function exportToText(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: `${filename}.txt` }).click();
  URL.revokeObjectURL(url);
}

// ─── Image generation (module-level, no instance required) ───────────────────

export async function generateImage(
  prompt: string,
  opts?: ImageGenOpts,
): Promise<{ url: string }> {
  const resp = await fetch("/api/openai/image-generate", {
    method:      "POST",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify({ prompt, quality: opts?.quality ?? "standard", size: opts?.size ?? "1024x1024" }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Image generation failed: ${resp.status}`);
  }
  return resp.json();
}

// ─── PlatformController class ─────────────────────────────────────────────────

export class PlatformController {
  private _history: ActivityEntry[] = [];

  // ─── Registry ────────────────────────────────────────────────────────────

  readonly engines: EngineDefinition[] = ALL_ENGINES;
  readonly series:  SeriesDefinition[]  = ALL_SERIES;
  get engineCount() { return ALL_ENGINES.length; }
  get seriesCount()  { return ALL_SERIES.length; }

  getEngine(id: string):                         EngineDefinition | undefined { return getEngine(id); }
  getSeries(id: string):                         SeriesDefinition | undefined { return getSeries(id); }
  getEnginesByCategory(): Record<EngineCategory, EngineDefinition[]>           { return getEnginesByCategory(); }

  getEnginesForSeries(seriesId: string): EngineDefinition[] {
    const s = getSeries(seriesId);
    return (s?.engines ?? []).map(id => getEngine(id)).filter(Boolean) as EngineDefinition[];
  }

  getEnginesForApp(appId: string): EngineDefinition[] {
    const reg = APP_ENGINE_REGISTRY[appId];
    if (!reg) return [];
    return reg.primaryEngines.map(id => getEngine(id)).filter(Boolean) as EngineDefinition[];
  }

  getSeriesForApp(appId: string): SeriesDefinition[] {
    const reg = APP_ENGINE_REGISTRY[appId];
    if (!reg?.primarySeries) return [];
    return reg.primarySeries.map(id => getSeries(id)).filter(Boolean) as SeriesDefinition[];
  }

  getAppConfig(appId: string): AppEngineConfig | null {
    return APP_ENGINE_REGISTRY[appId] ?? null;
  }

  // ─── Smart Routing ────────────────────────────────────────────────────────

  routeToEngine(intent: string, docType?: string): EngineDefinition {
    const lower = `${intent} ${docType ?? ""}`.toLowerCase();
    for (const [kw, eid] of Object.entries(INTENT_ROUTE_MAP)) {
      if (lower.includes(kw)) {
        const e = getEngine(eid);
        if (e) return e;
      }
    }
    return getEngine("InfiniteExpansionEngine") ?? ALL_ENGINES[0];
  }

  routeToSeries(intent: string): SeriesDefinition | null {
    const lower = intent.toLowerCase();
    for (const s of ALL_SERIES) {
      const words = s.name.toLowerCase().split(/\s+/);
      if (words.some(w => w.length > 3 && lower.includes(w))) return s;
    }
    return null;
  }

  // ─── Engine Run ───────────────────────────────────────────────────────────
  // Routes to meta-agent or standard engine automatically.

  runEngine(opts: EngineRunRequest): EngineRunHandle {
    let aborted     = false;
    let accumulated = "";
    const engine    = getEngine(opts.engineId);

    const handleChunk = (text: string) => {
      if (aborted) return;
      accumulated += text;
      opts.onChunk(text);
    };
    const handleDone = () => {
      if (aborted) return;
      this._history = [
        { engineId: opts.engineId, engineName: engine?.name ?? opts.engineId, topic: opts.topic, timestamp: Date.now(), outputLength: accumulated.length },
        ...this._history,
      ].slice(0, 100);
      opts.onDone?.(accumulated);
    };

    if (engine?.category === "meta-agent") {
      _runMetaAgent({
        agentId: opts.engineId,
        task:    opts.topic,
        context: opts.context,
        onChunk: handleChunk,
        onDone:  handleDone,
        onError: opts.onError,
      });
    } else {
      _runEngine({
        engineId:   opts.engineId,
        engineName: engine?.name ?? opts.engineId,
        topic:      opts.topic,
        context:    opts.context,
        mode:       opts.mode,
        agentId:    opts.agentId,
        onChunk:    handleChunk,
        onDone:     handleDone,
        onError:    opts.onError,
      });
    }

    return { abort: () => { aborted = true; } };
  }

  // ─── Series Run ───────────────────────────────────────────────────────────

  runSeries(opts: SeriesRunRequest): EngineRunHandle {
    let aborted = false;
    const sections: { engineId: string; text: string }[] = [];

    (async () => {
      try {
        const resp = await fetch("/api/openai/series-run", {
          method:      "POST",
          credentials: "include",
          headers:     { "Content-Type": "application/json" },
          body:        JSON.stringify({ seriesId: opts.seriesId, topic: opts.topic, context: opts.context }),
        });

        if (!resp.ok || !resp.body) {
          opts.onError?.(`Series returned ${resp.status}`);
          return;
        }

        const reader  = resp.body.getReader();
        const decoder = new TextDecoder();
        let currentEngineId = "";
        let currentText     = "";
        let currentIndex    = -1;

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          for (const line of decoder.decode(value).split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "section-start") {
                currentEngineId = data.engineId as string;
                currentIndex    = data.sectionIndex as number;
                currentText     = "";
                opts.onSectionStart?.(data.engineId, data.sectionIndex);
              } else if (data.type === "content") {
                currentText += data.content as string;
                opts.onChunk?.(data.content, data.engineId, data.sectionIndex);
              } else if (data.type === "section-done") {
                sections.push({ engineId: currentEngineId, text: currentText });
                opts.onSectionDone?.(currentEngineId, currentIndex, currentText);
              } else if (data.type === "series-done") {
                opts.onDone?.(sections);
              }
            } catch { /* skip malformed */ }
          }
        }
      } catch (err) {
        if (!aborted) opts.onError?.((err as Error).message);
      }
    })();

    return { abort: () => { aborted = true; } };
  }

  // ─── Output Processing ────────────────────────────────────────────────────

  processOutput(rawText: string, meta: OutputMeta = {}): ProcessedOutput {
    const document = parseBodyToSchema(rawText, {
      title:   meta.title ?? "AI Output",
      docType: meta.docType ?? meta.engineId ?? "general",
      author:  meta.author,
      tags:    [meta.engineId ?? "ai"].filter(Boolean) as string[],
    });
    return { raw: rawText, document, plainText: documentToPlainText(document) };
  }

  // ─── Save Output ──────────────────────────────────────────────────────────

  async saveOutput(opts: SaveOutputOpts): Promise<string | null> {
    const result = await saveEngineOutput(opts);
    return result ? String(result.id) : null;
  }

  // ─── Image Generation ─────────────────────────────────────────────────────

  generateImage(prompt: string, opts?: ImageGenOpts): Promise<{ url: string }> {
    return generateImage(prompt, opts);
  }

  // ─── Export Utilities ─────────────────────────────────────────────────────

  exportToPDF(title?: string):                          void { exportToPDF(title); }
  exportToMarkdown(content: string, filename: string):  void { exportToMarkdown(content, filename); }
  exportToText(content: string, filename: string):      void { exportToText(content, filename); }

  // ─── Activity ─────────────────────────────────────────────────────────────

  logActivity(entry: ActivityEntry): void {
    this._history = [entry, ...this._history].slice(0, 100);
  }

  getActivityHistory(): ActivityEntry[] {
    return this._history;
  }
}
