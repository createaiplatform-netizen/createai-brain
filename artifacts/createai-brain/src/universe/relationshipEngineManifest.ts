// ============================================================
// FILE: src/universe/relationshipEngineManifest.ts
// Relationship Engine — connections between entities
// ============================================================

export const relationshipEngineManifest = {
  name: "Relationship Engine",
  purpose: "Track, shape, and evolve the living connections between entities.",

  model: {
    types: [
      { id: "bond",        label: "Bond",        description: "A deep, stable, long-term connection." },
      { id: "encounter",   label: "Encounter",   description: "A meaningful but brief intersection." },
      { id: "alliance",    label: "Alliance",    description: "A shared purpose or direction." },
      { id: "tension",     label: "Tension",     description: "A generative friction between entities." }
    ],
    qualities: [
      { id: "trust",      label: "Trust"      },
      { id: "closeness",  label: "Closeness"  },
      { id: "resonance",  label: "Resonance"  },
      { id: "continuity", label: "Continuity" }
    ]
  },

  states: [
    { id: "forming",     label: "Forming",     description: "Connection is being established." },
    { id: "deepening",   label: "Deepening",   description: "Connection is growing stronger." },
    { id: "steady",      label: "Steady",      description: "Connection is stable and consistent." },
    { id: "transforming",label: "Transforming",description: "Connection is shifting into a new form." }
  ],

  rules: [
    "All relationships are voluntary and non-coercive.",
    "No connection is severed without context.",
    "Relationships evolve — they are not fixed.",
    "Every connection has inherent value."
  ],

  integration: {
    influences: ["identity", "emotion", "possibility"],
    receives:   ["identity", "narrative"],
    entrypoint: "Relationships update after narrative adjusts."
  },

  meta: {
    version: "1.0.0",
    description: "Manages connections and their evolution between all entities."
  }
};
