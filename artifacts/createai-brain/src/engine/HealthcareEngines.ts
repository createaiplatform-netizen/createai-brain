// HEALTHCARE ENGINE MODULE — CreateAI Brain
// Provides system prompt and series definitions for the healthcare suite.
import { ALL_ENGINES } from "./CapabilityEngine";

export const HEALTHCARE_ENGINE_IDS = [
  "EHRIntegrationEngine",
  "ClinicalWorkflowEngine",
  "PatientEngagementEngine",
  "HealthcareComplianceEngine",
  "TelehealthEngine",
  "ClinicalTrialEngine",
  "MedicalCodingEngine",
  "PopulationHealthEngine",
  "CareCoordinationEngine",
  "FHIREngine",
  "ClinicalDecisionEngine",
  "HealthDataEngine",
  "MedicalDeviceEngine",
  "MentalHealthEngine",
  "HealthAnalyticsEngine",
  "HealthBillingEngine",
  "HomeHealthEngine"
];

export function getHealthcareEngines() {
  return ALL_ENGINES.filter(e => e.category === "healthcare");
}

export const HEALTHCARE_ICON = "🏥";
export const HEALTHCARE_COLOR = "#0EA5E9";
