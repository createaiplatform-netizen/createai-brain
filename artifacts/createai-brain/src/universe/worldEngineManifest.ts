// ============================================================
// FILE: src/universe/worldEngineManifest.ts
// World Engine — coherent environments inside the universe
// ============================================================

export const worldEngineManifest = {
  name: "World Engine",
  purpose: "Define, shape, and maintain the coherent environments entities inhabit.",

  model: {
    layers: [
      { id: "physical",   label: "Physical",   description: "The spatial and sensory qualities of the world." },
      { id: "social",     label: "Social",     description: "The relationships and dynamics that exist within it." },
      { id: "narrative",  label: "Narrative",  description: "The stories and meanings that define the world." },
      { id: "possibility",label: "Possibility",description: "What can emerge or be created within it." }
    ],
    types: [
      { id: "family",    label: "Family World",    description: "A world shaped by family identity and bonds." },
      { id: "creative",  label: "Creative World",  description: "A world built for making and expression." },
      { id: "inner",     label: "Inner World",     description: "A world that mirrors an entity's internal state." },
      { id: "shared",    label: "Shared World",    description: "A world held in common by multiple entities." }
    ]
  },

  rules: [
    "Every world has its own tone and internal coherence.",
    "No world is imposed on an entity.",
    "Worlds evolve with the entities inside them.",
    "No world can violate the absolute layer."
  ],

  integration: {
    influences: ["storyworld"],
    receives:   ["identity", "tone"],
    entrypoint: "Worlds are shaped by the identity and tone of those who inhabit them."
  },

  meta: {
    version: "1.0.0",
    description: "Manages the coherent environments that entities inhabit."
  }
};
