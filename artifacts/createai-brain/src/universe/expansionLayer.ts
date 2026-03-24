// ============================================================
// FILE: src/universe/expansionLayer.ts
// ============================================================

export function expand(state: any) {
  return { ...state, expanded: true };
}
