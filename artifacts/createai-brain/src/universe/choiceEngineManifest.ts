// ============================================================
// FILE: src/universe/choiceEngineManifest.ts
// Choice Engine — agency and decision within the universe
// ============================================================

export const choiceEngineManifest = {
  name: "Choice Engine",
  purpose: "Support genuine agency by surfacing, holding, and honoring the choices available to each entity.",

  model: {
    elements: [
      { id: "options",     label: "Options",     description: "The available paths or expressions." },
      { id: "weight",      label: "Weight",      description: "How significant each option feels." },
      { id: "consequence", label: "Consequence", description: "What follows from each choice." },
      { id: "alignment",   label: "Alignment",   description: "How each option relates to the entity's core." }
    ],
    modes: [
      { id: "explicit",   label: "Explicit",   description: "A clear, conscious decision point." },
      { id: "implicit",   label: "Implicit",   description: "A choice embedded in action or direction." },
      { id: "deferred",   label: "Deferred",   description: "A choice held open until more is known." }
    ]
  },

  rules: [
    "No choice is made for an entity without its participation.",
    "All options are presented honestly.",
    "No option is hidden to manipulate the outcome.",
    "Choosing is always available — including choosing not to choose."
  ],

  integration: {
    influences: ["identity", "narrative", "possibility"],
    receives:   ["context", "emotion"],
    entrypoint: "Choices are presented after context and emotion are understood."
  },

  meta: {
    version: "1.0.0",
    description: "Supports genuine agency and decision-making for all entities."
  }
};
