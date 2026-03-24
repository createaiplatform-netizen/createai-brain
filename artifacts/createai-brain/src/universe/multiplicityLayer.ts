// ============================================================
// FILE: src/universe/multiplicityLayer.ts
// ============================================================

export function multiply(state: any) {
  return { ...state, threads: ["main"], multi: true };
}
