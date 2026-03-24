// ============================================================
// FILE: src/universe/reflectionLayer.ts
// Reflection Layer — symbolic mirror for adults
// No diagnosis. No advice. Only symbolic mirroring.
// ============================================================

export const reflectionLayer = {
  id: "reflection_layer",
  label: "Reflection Layer",
  description:
    "A symbolic mirror that reflects patterns, tone, and movement without judgment.",

  inputs: {
    recentMoments:    "list of symbolic moments",
    emotionalTrend:   "summary of emotional tone over time",
    narrativeThemes:  "recurring story patterns"
  },

  reflections: [
    {
      id: "tone_reflection",
      description: "How the world has been feeling lately — the emotional texture of recent moments."
    },
    {
      id: "pattern_reflection",
      description: "Patterns that seem to be emerging — recurring themes across time and context."
    },
    {
      id: "possibility_reflection",
      description: "Where things seem to be opening up — what is becoming available that was not before."
    },
    {
      id: "harmony_reflection",
      description: "Where things feel more or less aligned — what is resonant and what carries tension."
    }
  ],

  enginesInvolved: ["reflection", "meaning", "pattern", "alignment", "continuity"],

  meta: {
    version: "1.0.0",
    role: "baseline symbolic mirror"
  }
};
