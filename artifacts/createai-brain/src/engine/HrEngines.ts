// HR ENGINE MODULE — CreateAI Brain
// Provides system prompt and series definitions for the hr suite.
import { ALL_ENGINES } from "./CapabilityEngine";

export const HR_ENGINE_IDS = [
  "TalentAcqEngine",
  "EmployeeExpEngine",
  "PerfMgmtEngine",
  "LDStrategyEngine",
  "CompBenchEngine",
  "WorkforcePlanEngine",
  "DEIEngine",
  "PeopleAnalyticsEngine",
  "SuccessionPlanEngine",
  "OrgDesignEngine",
  "EmployerBrandEngine",
  "HRCompEngine",
  "OnboardingEngine",
  "RemoteWorkEngine",
  "WellnessEngine",
  "HRISDesignEngine",
  "TalentPipeEngine"
];

export function getHrEngines() {
  return ALL_ENGINES.filter(e => e.category === "hr");
}

export const HR_ICON = "👥";
export const HR_COLOR = "#8B5CF6";
