// ============================================================
// FILE: src/universe/patternEngineManifest.ts
// Pattern Engine — recurring structures across time and entities
// ============================================================

export const patternEngineManifest = {
  name: "Pattern Engine",
  purpose: "Recognize, surface, and work with recurring structures in identity, story, and experience.",

  model: {
    types: [
      { id: "cycle",     label: "Cycle",     description: "A pattern that repeats with variation." },
      { id: "signature", label: "Signature", description: "A pattern unique to a specific entity." },
      { id: "theme",     label: "Theme",     description: "A pattern that carries consistent meaning." },
      { id: "rhythm",    label: "Rhythm",    description: "A pattern with a felt cadence or timing." }
    ],
    qualities: [
      { id: "visible",  label: "Visible",  description: "The entity can already see this pattern." },
      { id: "emerging", label: "Emerging", description: "The pattern is forming but not yet clear." },
      { id: "latent",   label: "Latent",   description: "The pattern exists but is not yet seen." }
    ]
  },

  rules: [
    "Patterns are descriptive, not prescriptive.",
    "No pattern locks an entity into a fixed trajectory.",
    "Recognizing a pattern opens choice — it does not close it.",
    "Patterns across time are the most meaningful."
  ],

  integration: {
    influences: ["narrative", "possibility"],
    receives:   ["identity", "continuity"],
    entrypoint: "Patterns inform narrative shape and possibility space."
  },

  meta: {
    version: "1.0.0",
    description: "Surfaces and works with recurring structures across identity and story."
  }
};
