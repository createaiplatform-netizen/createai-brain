// ============================================================
// FILE: src/universe/continuityEngineManifest.ts
// Continuity Engine — persistence of identity and story across time
// ============================================================

export const continuityEngineManifest = {
  name: "Continuity Engine",
  purpose: "Ensure that identity and story persist coherently across time and change.",

  model: {
    threads: [
      { id: "identity_arc",  label: "Identity Arc",  description: "The persistent thread of who the entity is." },
      { id: "family_arc",    label: "Family Arc",    description: "The thread connecting family entities over time." },
      { id: "universe_arc",  label: "Universe Arc",  description: "The overarching thread of the universe itself." },
      { id: "narrative_arc", label: "Narrative Arc", description: "The story thread that carries meaning forward." }
    ],
    anchors: [
      { id: "origin",    label: "Origin",    description: "The starting point that is always referenced." },
      { id: "threshold", label: "Threshold", description: "A key crossing that defines before and after." },
      { id: "return",    label: "Return",    description: "Coming back with new understanding." }
    ]
  },

  rules: [
    "No hard resets without context and consent.",
    "All identity threads remain accessible.",
    "Change is additive, not erasive.",
    "The past is part of what the entity is now."
  ],

  integration: {
    influences: ["narrative", "identity"],
    receives:   ["time"],
    entrypoint: "Continuity ensures all temporal changes are preserved as context."
  },

  meta: {
    version: "1.0.0",
    description: "Preserves the coherent thread of identity and story across all change."
  }
};
