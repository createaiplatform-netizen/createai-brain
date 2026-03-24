// ============================================================
// FILE: src/universe/continuityEngineManifest.ts
// Continuity Engine — persistence of identity and story over time
// ============================================================

export const continuityEngineManifest = {
  name: "Continuity Engine",
  purpose:
    "Ensure that identity and story persist coherently across time, change, and transition — without erasing what came before.",

  model: {
    threads: [
      {
        id: "identity_arc",
        label: "Identity Arc",
        description: "The persistent thread of who the entity is across all changes."
      },
      {
        id: "family_arc",
        label: "Family Arc",
        description: "The thread connecting family entities across generations and time."
      },
      {
        id: "universe_arc",
        label: "Universe Arc",
        description: "The overarching thread of the universe itself — its origin and ongoing story."
      },
      {
        id: "narrative_arc",
        label: "Narrative Arc",
        description: "The story thread that carries meaning from past through present and forward."
      }
    ],
    anchors: [
      {
        id: "origin",
        label: "Origin",
        description: "The starting point that is always available as reference."
      },
      {
        id: "threshold",
        label: "Threshold",
        description: "A key crossing that permanently defines before and after."
      },
      {
        id: "return",
        label: "Return",
        description: "Coming back to an earlier state with new understanding."
      }
    ]
  },

  rules: [
    "No reset occurs without context and the entity's awareness.",
    "All identity threads remain accessible — past states are not deleted.",
    "Change is additive and contextual — not erasive.",
    "The past is part of what the entity is now, not a separate archive."
  ],

  integration: {
    influences: ["narrative", "identity"],
    receives: ["time"],
    entrypoint:
      "Continuity is applied through time, ensuring that all temporal changes are preserved as living context for narrative and identity."
  },

  meta: {
    version: "1.0.0",
    description:
      "Preserves the coherent, persistent thread of identity and story across all change."
  }
};
