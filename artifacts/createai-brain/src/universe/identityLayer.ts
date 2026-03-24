// ============================================================
// FILE: src/universe/identityLayer.ts
// ============================================================

export function identity(state: any) {
  return { ...state, identity: "universe" };
}
