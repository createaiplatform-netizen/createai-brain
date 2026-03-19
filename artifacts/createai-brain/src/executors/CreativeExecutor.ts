// ═══════════════════════════════════════════════════════════════════════════
// CREATIVE EXECUTOR — Handles all creative and imagination AI calls.
// Covers storytelling, worldbuilding, forge apps, narrative, and art domains.
// Enables vivid, unconstrained, world-building language mode.
// ═══════════════════════════════════════════════════════════════════════════

import type { EngineCategory } from "@/engine/CapabilityEngine";
import type { DomainExecutor, ExecutorRunOpts } from "./shared";
import { dispatchEngineStream } from "./shared";

const DOMAIN_PREFIX =
  "Domain: Creative. Embrace imaginative, vivid, and world-building language. " +
  "Prioritize narrative depth, originality, sensory detail, and internal consistency. " +
  "Generate rich, expansive, publication-quality creative content.";

export class CreativeExecutor implements DomainExecutor {
  readonly domain = "creative";

  canHandle(_engineId: string, category: EngineCategory): boolean {
    return category === "creative" || category === "imagination";
  }

  execute(opts: ExecutorRunOpts): void {
    const context = opts.context
      ? `${DOMAIN_PREFIX}\n\n${opts.context}`
      : DOMAIN_PREFIX;
    dispatchEngineStream({ ...opts, context });
  }
}
