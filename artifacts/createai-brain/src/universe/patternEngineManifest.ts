// ============================================================
// FILE: src/universe/patternEngineManifest.ts
// Pattern Engine — recurring structures across entities and time
// ============================================================

export const patternEngineManifest = {
  name: "Pattern Engine",
  purpose:
    "Surface recurring structures in identity, story, and experience — offering them as insight without prescribing how the entity should respond.",

  model: {
    types: [
      {
        id: "cycle",
        label: "Cycle",
        description: "A pattern that recurs across time, with variation at each return."
      },
      {
        id: "signature",
        label: "Signature",
        description: "A distinctive, recurring pattern unique to a specific entity."
      },
      {
        id: "theme",
        label: "Theme",
        description: "A pattern of meaning that appears across different contexts and forms."
      },
      {
        id: "rhythm",
        label: "Rhythm",
        description: "A pattern defined by felt cadence, timing, or pace."
      }
    ],
    qualities: [
      {
        id: "visible",
        label: "Visible",
        description: "The entity already recognizes this pattern in its experience."
      },
      {
        id: "emerging",
        label: "Emerging",
        description: "The pattern is forming and becoming legible for the first time."
      },
      {
        id: "latent",
        label: "Latent",
        description: "The pattern exists but has not yet been noticed or named."
      }
    ]
  },

  rules: [
    "Patterns are descriptive — they name what is, not what must be.",
    "No pattern constrains an entity's future direction.",
    "Surfacing a pattern opens choice; it does not close it.",
    "Patterns across time are the most meaningful and the most gently offered."
  ],

  integration: {
    influences: ["narrative", "possibility"],
    receives: ["identity", "continuity"],
    entrypoint:
      "Patterns are surfaced from continuity and identity, then offered to narrative and possibility as generative context."
  },

  meta: {
    version: "1.0.0",
    description:
      "Recognizes and surfaces recurring structures across identity and story as open insight."
  }
};
