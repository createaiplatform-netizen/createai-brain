// ============================================================
// FILE: src/universe/relationshipEngineManifest.ts
// Relationship Engine — living connections between entities
// ============================================================

export const relationshipEngineManifest = {
  name: "Relationship Engine",
  purpose:
    "Track and evolve the living connections between entities, honoring their texture, continuity, and change without imposing direction.",

  model: {
    types: [
      {
        id: "bond",
        label: "Bond",
        description: "A deep, enduring connection with accumulated history and trust."
      },
      {
        id: "encounter",
        label: "Encounter",
        description: "A meaningful intersection that may be brief but leaves a trace."
      },
      {
        id: "alliance",
        label: "Alliance",
        description: "A shared direction or purpose held by two or more entities."
      },
      {
        id: "tension",
        label: "Tension",
        description: "A generative friction that carries energy and possibility."
      }
    ],
    qualities: [
      { id: "trust",      label: "Trust",      description: "The degree of safety and reliability felt in the connection." },
      { id: "closeness",  label: "Closeness",  description: "How near and known the entities feel to each other." },
      { id: "resonance",  label: "Resonance",  description: "How naturally the entities align in tone and rhythm." },
      { id: "continuity", label: "Continuity", description: "How persistently the connection is maintained across time." }
    ]
  },

  states: [
    {
      id: "forming",
      label: "Forming",
      description: "The connection is being established for the first time."
    },
    {
      id: "deepening",
      label: "Deepening",
      description: "The connection is growing in trust, closeness, or meaning."
    },
    {
      id: "steady",
      label: "Steady",
      description: "The connection is stable and consistently maintained."
    },
    {
      id: "transforming",
      label: "Transforming",
      description: "The connection is shifting in nature, form, or quality."
    }
  ],

  rules: [
    "All connections are voluntary — no relationship is imposed.",
    "No connection is severed without context and awareness.",
    "Relationships evolve naturally — they are not held static.",
    "Every connection carries inherent value regardless of its form."
  ],

  integration: {
    influences: ["identity", "emotion", "possibility"],
    receives: ["identity", "narrative"],
    entrypoint:
      "Relationships are updated after narrative adjusts, reflecting the story's influence on the quality and direction of connections."
  },

  meta: {
    version: "1.0.0",
    description:
      "Tracks and evolves the living connections between all entities across time and change."
  }
};
