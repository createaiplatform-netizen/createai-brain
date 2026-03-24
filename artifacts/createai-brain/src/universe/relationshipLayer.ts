// ============================================================
// FILE: src/universe/relationshipLayer.ts
// ============================================================

export function relate(state: any) {
  return { ...state, relationship: "active" };
}
