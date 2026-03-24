// ============================================================
// FILE: src/universe/activationLayer.ts
// Activation Layer — entry point for activating the Universe OS
// ============================================================

import { entrySurface } from "./entrySurface";

export function activate(event: any) {
  return entrySurface(event || {});
}
