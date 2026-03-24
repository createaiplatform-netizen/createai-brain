// ============================================================
// FILE: src/universe/firstWorld.ts
// First World — the baseline adaptive world of the Universe OS
// ============================================================

export const firstWorld = {
  id: "first_world",
  label: "First World",
  description:
    "A baseline world that responds to identity, emotion, and context.",

  visualTone: {
    palette:  "deep blue-black with soft gold warmth at the edges — space that holds light",
    motion:   "slow and breathing — like something gently expanding and settling",
    density:  "spacious but not empty — present, with room to move"
  },

  bindings: {
    identity:  "The world takes its shape from who enters — each identity leaves a different light.",
    emotion:   "Emotional tone changes the world's texture — calm makes it still, wonder opens it, grief softens it.",
    context:   "Situational context determines which layers of the world are foregrounded — what is relevant becomes visible.",
    narrative: "As the story shifts, the world shifts — new threads open new regions, resolved arcs settle into familiar ground."
  },

  poweredBy: ["identity", "emotion", "context", "narrative", "world", "possibility"],

  meta: {
    version: "1.0.0",
    role: "baseline adaptive world"
  }
};
