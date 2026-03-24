// ============================================================
// FILE: src/universe/contextEngineManifest.ts
// Context Engine — situational awareness for each moment
// ============================================================

export const contextEngineManifest = {
  name: "Context Engine",
  purpose: "Provide rich situational awareness that shapes how each moment is interpreted and responded to.",

  model: {
    layers: [
      { id: "immediate",    label: "Immediate",    description: "What is happening right now." },
      { id: "relational",   label: "Relational",   description: "Who is present and how they relate." },
      { id: "historical",   label: "Historical",   description: "What has happened before this moment." },
      { id: "intentional",  label: "Intentional",  description: "What the entity is trying to do or become." }
    ],
    modes: [
      { id: "active",     label: "Active",     description: "Context is being read and applied." },
      { id: "background", label: "Background", description: "Context is held quietly beneath the surface." },
      { id: "updating",   label: "Updating",   description: "Context is shifting due to new information." }
    ]
  },

  rules: [
    "Context is always incomplete — more is always present than known.",
    "No action is taken without reading context first.",
    "Context informs; it does not determine.",
    "Historical context is preserved without judgment."
  ],

  integration: {
    influences: ["narrative", "perception"],
    receives:   ["identity", "emotion"],
    entrypoint: "Context is assembled from identity and emotional state before choices are presented."
  },

  meta: {
    version: "1.0.0",
    description: "Provides situational awareness that shapes interpretation and response."
  }
};
