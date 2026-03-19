// ═══════════════════════════════════════════════════════════════════════════
// EXECUTORS — Barrel export + domain routing.
//
// PlatformController calls selectExecutor(engineId) to route streamEngine()
// calls to the correct domain executor. ProjectExecutor is addressed directly
// by streamProjectChat() — it is not part of the streamEngine() chain.
//
// Priority order (General must be last — it is the catch-all):
//   Healthcare → Legal → Creative → General
// ═══════════════════════════════════════════════════════════════════════════

import { getEngine } from "@/engine/CapabilityEngine";
import type { DomainExecutor } from "./shared";

export { HealthcareExecutor } from "./HealthcareExecutor";
export { LegalExecutor }      from "./LegalExecutor";
export { CreativeExecutor }   from "./CreativeExecutor";
export { ProjectExecutor }    from "./ProjectExecutor";
export { GeneralExecutor }    from "./GeneralExecutor";
export type { DomainExecutor, ExecutorRunOpts } from "./shared";

import { HealthcareExecutor } from "./HealthcareExecutor";
import { LegalExecutor }      from "./LegalExecutor";
import { CreativeExecutor }   from "./CreativeExecutor";
import { GeneralExecutor }    from "./GeneralExecutor";

const EXECUTORS: DomainExecutor[] = [
  new HealthcareExecutor(),
  new LegalExecutor(),
  new CreativeExecutor(),
  new GeneralExecutor(),
];

export function selectExecutor(engineId: string): DomainExecutor {
  const engine   = getEngine(engineId);
  const category = engine?.category ?? "universal";
  return (
    EXECUTORS.find(e => e.canHandle(engineId, category)) ??
    EXECUTORS[EXECUTORS.length - 1]
  );
}
