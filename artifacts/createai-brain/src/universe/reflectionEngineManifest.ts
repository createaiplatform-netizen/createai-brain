// ============================================================
// FILE: src/universe/reflectionEngineManifest.ts
// Reflection Engine — the universe mirrors the entity back to itself
// ============================================================

export const reflectionEngineManifest = {
  name: "Reflection Engine",
  purpose:
    "Offer the entity a clear, honest, and caring mirror of its own experience — surfacing what is real without judgment or prescription.",

  model: {
    modes: [
      {
        id: "summary",
        label: "Summary",
        description: "A condensed, honest view of what has been happening."
      },
      {
        id: "pattern",
        label: "Pattern",
        description: "A recurring structure surfaced across the entity's experience over time."
      },
      {
        id: "question",
        label: "Question",
        description: "An open inquiry offered gently, without expectation of a particular answer."
      },
      {
        id: "affirmation",
        label: "Affirmation",
        description: "A genuine recognition of what is already true, already present, already good."
      }
    ],
    timing: [
      {
        id: "periodic",
        label: "Periodic",
        description: "Reflection offered at natural, unhurried intervals."
      },
      {
        id: "on_request",
        label: "On Request",
        description: "Reflection offered when the entity explicitly seeks it."
      },
      {
        id: "on_shift",
        label: "On Shift",
        description: "Reflection offered when a significant transition or threshold has occurred."
      }
    ]
  },

  rules: [
    "Reflection is offered — never imposed or scheduled without awareness.",
    "No reflection shames, judges, diagnoses, or prescribes.",
    "What is reflected is grounded in real experience — not interpretation or projection.",
    "The entity alone decides what to do with what it sees."
  ],

  integration: {
    influences: ["identity", "meaning"],
    receives: ["narrative", "emotion"],
    entrypoint:
      "Reflection occurs after narrative and emotion are both active — the entity has lived something it can now look at."
  },

  meta: {
    version: "1.0.0",
    description:
      "Offers entities a clear, kind, honest mirror of their own experience without judgment."
  }
};
