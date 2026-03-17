// LEGAL ENGINE MODULE — CreateAI Brain
// Provides system prompt and series definitions for the legal suite.
import { ALL_ENGINES } from "./CapabilityEngine";

export const LEGAL_ENGINE_IDS = [
  "ContractIntelEngine",
  "LegalResearchEngine",
  "CompMappingEngine",
  "IPPortfolioEngine",
  "LegalRiskEngine",
  "CorpGovernEngine",
  "PrivacyLawEngine",
  "LaborLawEngine",
  "TradeCompEngine",
  "DueDiligenceEngine",
  "LegalOpsEngine",
  "LitigationStratEngine",
  "RegSubEngine",
  "ADRStratEngine"
];

export function getLegalEngines() {
  return ALL_ENGINES.filter(e => e.category === "legal");
}

export const LEGAL_ICON = "⚖️";
export const LEGAL_COLOR = "#06B6D4";
