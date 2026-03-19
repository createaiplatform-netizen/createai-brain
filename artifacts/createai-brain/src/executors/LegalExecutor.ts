// ═══════════════════════════════════════════════════════════════════════════
// LEGAL EXECUTOR — Handles all legal, compliance, and regulatory AI calls.
// Prepends a legal-accuracy context prefix before dispatch.
// ═══════════════════════════════════════════════════════════════════════════

import type { EngineCategory } from "@/engine/CapabilityEngine";
import type { DomainExecutor, ExecutorRunOpts } from "./shared";
import { dispatchEngineStream } from "./shared";
import { expansionGuard } from "@/core/ExpansionGuard";

const LEGAL_ENGINE_IDS = new Set([
  "LegalAIEngine", "ContractIntelEngine", "LegalResearchEngine",
  "IPPortfolioEngine", "LegalRiskEngine", "PrivacyLawEngine",
  "LaborLawEngine", "TradeCompEngine", "LegalOpsEngine",
  "LitigationStratEngine", "RegSubEngine",
  "RegulatoryEngine", "ComplianceAuditEngine",
]);

const DOMAIN_PREFIX =
  "Domain: Legal. Outputs are for professional legal strategy and drafting. " +
  "Apply jurisdictional precision, cite applicable frameworks and statutes, " +
  "flag material risks, and note where qualified counsel review is required.";

export class LegalExecutor implements DomainExecutor {
  readonly domain = "legal";

  canHandle(engineId: string, category: EngineCategory): boolean {
    return category === "legal" || LEGAL_ENGINE_IDS.has(engineId);
  }

  execute(opts: ExecutorRunOpts): void {
    expansionGuard.run(opts.engineId, opts, (safeOpts) => {
      const context = safeOpts.context
        ? `${DOMAIN_PREFIX}\n\n${safeOpts.context}`
        : DOMAIN_PREFIX;
      dispatchEngineStream({ ...safeOpts, context });
    });
  }
}
