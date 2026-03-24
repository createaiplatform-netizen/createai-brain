// ============================================================
// FILE: src/universe/possibilityEngineManifest.ts
// Possibility Engine — the space of what can emerge
// ============================================================

export const possibilityEngineManifest = {
  name: "Possibility Engine",
  purpose: "Open, track, and present the space of what can emerge for each entity.",

  model: {
    forms: [
      { id: "path",       label: "Path",       description: "A direction the entity can move toward." },
      { id: "expression", label: "Expression", description: "A new way of showing up or creating." },
      { id: "world",      label: "World",      description: "A new environment that can be entered or built." },
      { id: "connection", label: "Connection", description: "A relationship that can be formed." }
    ],
    qualities: [
      { id: "latent",   label: "Latent",   description: "Possible but not yet active." },
      { id: "emerging", label: "Emerging", description: "Beginning to become real." },
      { id: "open",     label: "Open",     description: "Available for choice or action." },
      { id: "realized", label: "Realized", description: "A possibility that has become actual." }
    ]
  },

  rules: [
    "Possibility is never closed without reason.",
    "No entity is told what to want.",
    "Expansion happens at the entity's own pace.",
    "All possibilities respect the absolute layer constraints."
  ],

  integration: {
    influences: ["identity", "narrative", "expansion"],
    receives:   ["identity", "relationships"],
    entrypoint: "Possibility expands after relationships update."
  },

  meta: {
    version: "1.0.0",
    description: "Defines and opens the space of emergence for each entity."
  }
};
