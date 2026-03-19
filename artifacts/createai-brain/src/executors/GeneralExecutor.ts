// ═══════════════════════════════════════════════════════════════════════════
// GENERAL EXECUTOR — Catch-all executor for all domains not handled by a
// specialized executor: operations, finance, hr, education, security,
// sustainability, research, universal, meta-agent, intelligence, data,
// platform, workflow, integration, product, and anything unrecognized.
// Must always be last in the executor priority chain.
// ═══════════════════════════════════════════════════════════════════════════

import type { EngineCategory } from "@/engine/CapabilityEngine";
import type { DomainExecutor, ExecutorRunOpts } from "./shared";
import { dispatchEngineStream } from "./shared";

export class GeneralExecutor implements DomainExecutor {
  readonly domain = "general";

  canHandle(_engineId: string, _category: EngineCategory): boolean {
    return true;
  }

  execute(opts: ExecutorRunOpts): void {
    dispatchEngineStream(opts);
  }
}
