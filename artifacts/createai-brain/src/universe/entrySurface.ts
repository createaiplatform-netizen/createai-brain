// ============================================================
// FILE: src/universe/entrySurface.ts
// Entry Surface — bridges and routes an external event into the OS
// ============================================================

import { universalBridge }       from "./universalBridge";
import { resolveInternalDomain } from "./internalRouter";

export function entrySurface(externalEvent: any) {
  const bridged = universalBridge(externalEvent || {});
  const domain  = resolveInternalDomain({ role: bridged.identity });

  return {
    ...bridged,
    domain,
    firstMomentId:     "first_moment",
    firstWorldId:      "first_world",
    entryExperienceId: "first_entry"
  };
}
