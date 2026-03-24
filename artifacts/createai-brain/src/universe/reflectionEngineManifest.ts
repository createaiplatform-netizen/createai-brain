// ============================================================
// FILE: src/universe/reflectionEngineManifest.ts
// Reflection Engine — the universe mirrors the entity back to itself
// ============================================================

export const reflectionEngineManifest = {
  name: "Reflection Engine",
  purpose: "Mirror the entity's state, choices, and patterns back in a way that supports understanding.",

  model: {
    modes: [
      { id: "summary",    label: "Summary",    description: "A condensed view of what has happened." },
      { id: "pattern",    label: "Pattern",    description: "A recurring structure surfaced across time." },
      { id: "question",   label: "Question",   description: "An open inquiry offered without pressure." },
      { id: "affirmation",label: "Affirmation",description: "A recognition of what is already true and good." }
    ],
    timing: [
      { id: "periodic",   label: "Periodic",   description: "Reflection offered at natural intervals." },
      { id: "on_request", label: "On Request", description: "Reflection offered when the entity asks." },
      { id: "on_shift",   label: "On Shift",   description: "Reflection triggered by a significant change." }
    ]
  },

  rules: [
    "Reflection is offered, never imposed.",
    "No reflection shames, judges, or diagnoses.",
    "Reflection is honest and grounded in real experience.",
    "The entity decides what to do with what is reflected."
  ],

  integration: {
    influences: ["identity", "meaning"],
    receives:   ["narrative", "emotion"],
    entrypoint: "Reflection occurs after narrative and emotion are both active."
  },

  meta: {
    version: "1.0.0",
    description: "Offers the entity a clear, kind mirror of its own experience."
  }
};
