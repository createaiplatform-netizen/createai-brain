// ============================================================
// FILE: src/universe/circulationLayer.ts
// ============================================================

import { integrationLoop } from "./integrationLoop";

export function circulate(event: any) {
  return integrationLoop(event);
}
