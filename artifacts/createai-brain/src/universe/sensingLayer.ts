// ============================================================
// FILE: src/universe/sensingLayer.ts
// ============================================================

export function sense(event: any) {
  return {
    identity: event.identity || "guest",
    tone:     event.emotion  || "neutral",
    context:  event.context  || "arrival"
  };
}
