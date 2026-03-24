// ============================================================
// FILE: src/universe/responseLayer.ts
// ============================================================

import { resolveInternalDomain } from "./internalRouter";

export function respond(sensed: any) {
  return {
    domain:     resolveInternalDomain({ role: sensed.identity }),
    moment:     "first_moment",
    world:      "first_world",
    experience: "first_entry"
  };
}
