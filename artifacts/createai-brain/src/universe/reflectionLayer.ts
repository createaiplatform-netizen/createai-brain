// ============================================================
// FILE: src/universe/reflectionLayer.ts
// Reflection Layer — symbolic mirror for adults
// No diagnosis. No advice. Only symbolic mirroring.
// ============================================================

export const reflectionLayer = {
  id: "reflection_layer",
  label: "Reflection Layer",
  description:
    "A symbolic mirror that reflects tone, patterns, and movement without judgment.",

  inputs: {
    recentMoments:   "A list of symbolic moments.",
    emotionalTrend:  "A summary of emotional tone over time.",
    narrativeThemes: "Recurring symbolic story patterns."
  },

  reflections: [
    {
      id: "tone_reflection",
      description: "How the world has been feeling lately."
    },
    {
      id: "pattern_reflection",
      description: "Patterns that seem to be emerging."
    },
    {
      id: "possibility_reflection",
      description: "Where things appear to be opening."
    },
    {
      id: "harmony_reflection",
      description: "Where alignment or friction is present."
    }
  ],

  enginesInvolved: ["reflection", "meaning", "pattern", "alignment", "continuity"],

  meta: {
    version: "1.0.0",
    role: "baseline symbolic mirror"
  }
};
