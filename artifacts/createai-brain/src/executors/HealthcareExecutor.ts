// ═══════════════════════════════════════════════════════════════════════════
// HEALTHCARE EXECUTOR — Handles all healthcare, clinical, and patient-care
// AI calls. Prepends a HIPAA-aware context prefix before dispatch.
// ═══════════════════════════════════════════════════════════════════════════

import type { EngineCategory } from "@/engine/CapabilityEngine";
import type { DomainExecutor, ExecutorRunOpts } from "./shared";
import { dispatchEngineStream } from "./shared";

const HEALTHCARE_ENGINE_IDS = new Set([
  "HealthcareEngine", "EHRIntegrationEngine", "ClinicalWorkflowEngine",
  "PatientEngagementEngine", "HealthcareComplianceEngine", "TelehealthEngine",
  "ClinicalTrialEngine", "MedicalCodingEngine", "PopulationHealthEngine",
  "CareCoordinationEngine", "FHIREngine", "ClinicalDecisionEngine",
  "HealthDataEngine", "MedicalDeviceEngine", "MentalHealthEngine",
  "HealthAnalyticsEngine", "HealthBillingEngine", "HomeHealthEngine",
]);

const DOMAIN_PREFIX =
  "Domain: Healthcare. Apply HIPAA-compliant language, clinical accuracy, " +
  "and patient-safety standards. Use evidence-based frameworks and cite " +
  "applicable regulations (HIPAA, HITECH, CMS) where relevant.";

export class HealthcareExecutor implements DomainExecutor {
  readonly domain = "healthcare";

  canHandle(engineId: string, category: EngineCategory): boolean {
    return category === "healthcare" || HEALTHCARE_ENGINE_IDS.has(engineId);
  }

  execute(opts: ExecutorRunOpts): void {
    const context = opts.context
      ? `${DOMAIN_PREFIX}\n\n${opts.context}`
      : DOMAIN_PREFIX;
    dispatchEngineStream({ ...opts, context });
  }
}
