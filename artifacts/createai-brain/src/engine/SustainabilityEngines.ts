// SUSTAINABILITY ENGINE MODULE — CreateAI Brain
// Provides system prompt and series definitions for the sustainability suite.
import { ALL_ENGINES } from "./CapabilityEngine";

export const SUSTAINABILITY_ENGINE_IDS = [
  "ESGFrameworkEngine",
  "CarbonFootprintEngine",
  "NetZeroEngine",
  "CircularEconomyEngine",
  "RenewableEnergyEngine",
  "SustainableSupplyEngine",
  "WaterMgmtEngine",
  "BiodiversityEngine",
  "SocialImpactEngine",
  "GreenFinanceEngine",
  "LCAEngine",
  "ClimateRiskEngine",
  "ESGReportingEngine",
  "SDGEngine",
  "EnvComplianceEngine",
  "GreenBuildingEngine"
];

export function getSustainabilityEngines() {
  return ALL_ENGINES.filter(e => e.category === "sustainability");
}

export const SUSTAINABILITY_ICON = "🌿";
export const SUSTAINABILITY_COLOR = "#10B981";
