// ============================================================
// FILE: src/universe/integrationLoop.ts
// Integration Loop — combines activation and presence into one pass
// ============================================================

import { activate } from "./activationLayer";
import { presence } from "./presenceLayer";

export function integrationLoop(event: any) {
  const activation = activate(event || {});
  const heartbeat  = presence();
  return { activation, heartbeat };
}
