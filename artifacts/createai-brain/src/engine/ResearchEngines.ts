// RESEARCH ENGINE MODULE — CreateAI Brain
// Provides system prompt and series definitions for the research suite.
import { ALL_ENGINES } from "./CapabilityEngine";

export const RESEARCH_ENGINE_IDS = [
  "PrimaryResearchEngine",
  "MarketSurveyEngine",
  "CIAnalysisEngine",
  "InsightSynthEngine",
  "ExperimentDesignEngine",
  "HypothesisEngine",
  "StatisticalEngine",
  "TrendsAnalysisEngine",
  "EthnographicEngine",
  "KnowledgeMgmtEngine",
  "ForesightEngine",
  "ResearchMethodEngine"
];

export function getResearchEngines() {
  return ALL_ENGINES.filter(e => e.category === "research");
}

export const RESEARCH_ICON = "🔬";
export const RESEARCH_COLOR = "#64748B";
