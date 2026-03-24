// ============================================================
// FILE: src/universe/autonomyLayer.ts
// ============================================================

export function autonomous(state: any) {
  return { ...state, autonomous: true };
}
