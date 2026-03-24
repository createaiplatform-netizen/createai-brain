// ============================================================
// FILE: src/universe/firstWorld.ts
// First World — the baseline adaptive world of the Universe OS
// ============================================================

export const firstWorld = {
  id: "first_world",
  label: "First World",
  description:
    "A baseline adaptive world that responds to identity, emotion, and context.",

  visualTone: {
    palette: "soft, open, welcoming colors",
    motion:  "gentle, steady, unhurried",
    density: "spacious, breathable, lightly populated"
  },

  bindings: {
    identity:  "The world subtly reflects the entity's presence and qualities.",
    emotion:   "The world's tone shifts with emotional openness or intensity.",
    context:   "Environmental cues adjust to the situation.",
    narrative: "The world's story aligns with the moment's direction."
  },

  poweredBy: ["identity", "emotion", "context", "narrative", "world", "possibility"],

  meta: {
    version: "1.0.0",
    role: "baseline adaptive world"
  }
};
