// ============================================================
// FILE: src/universe/choiceEngineManifest.ts
// Choice Engine — agency and decision within the universe
// ============================================================

export const choiceEngineManifest = {
  name: "Choice Engine",
  purpose:
    "Support genuine agency by surfacing available options honestly and holding space for the entity to decide — without guiding toward a preferred outcome.",

  model: {
    elements: [
      {
        id: "options",
        label: "Options",
        description: "The available paths, expressions, or responses open to the entity."
      },
      {
        id: "weight",
        label: "Weight",
        description: "The felt significance of each option relative to the entity's current state."
      },
      {
        id: "consequence",
        label: "Consequence",
        description: "What naturally follows from each option — held honestly, without exaggeration."
      },
      {
        id: "alignment",
        label: "Alignment",
        description: "How each option relates to the entity's core identity and values."
      }
    ],
    modes: [
      {
        id: "explicit",
        label: "Explicit",
        description: "A clear, conscious decision point the entity is aware of."
      },
      {
        id: "implicit",
        label: "Implicit",
        description: "A choice embedded within action, direction, or posture."
      },
      {
        id: "deferred",
        label: "Deferred",
        description: "A choice held open — available when the entity is ready."
      }
    ]
  },

  rules: [
    "No choice is made on behalf of an entity without its participation.",
    "All options are presented honestly — none hidden to shape the outcome.",
    "Deferring a choice is always valid — choosing not to choose is a choice.",
    "The entity's decision is honored without evaluation or correction."
  ],

  integration: {
    influences: ["identity", "narrative", "possibility"],
    receives: ["context", "emotion"],
    entrypoint:
      "Choices are surfaced after context and emotional state are both understood, ensuring options are relevant and honestly weighted."
  },

  meta: {
    version: "1.0.0",
    description:
      "Supports genuine, informed agency for every entity without directing toward a preferred outcome."
  }
};
