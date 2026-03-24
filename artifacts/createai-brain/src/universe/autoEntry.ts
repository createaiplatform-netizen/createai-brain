// ============================================================
// FILE: src/universe/autoEntry.ts
// Auto Entry — default guest entry into the Universe OS
// ============================================================

import { entrySurface } from "./entrySurface";

export function autoEntry() {
  return entrySurface({ identity: "guest", emotion: "neutral", context: "arrival" });
}
