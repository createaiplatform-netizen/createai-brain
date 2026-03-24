// ============================================================
// FILE: src/universe/presenceExpansionLayer.ts
// ============================================================

export function presenceExpand(state: any) {
  return { ...state, presence: "felt" };
}
