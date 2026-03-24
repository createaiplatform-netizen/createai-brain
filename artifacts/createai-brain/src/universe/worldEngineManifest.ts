// ============================================================
// FILE: src/universe/worldEngineManifest.ts
// World Engine — coherent environments inside the universe
// ============================================================

export const worldEngineManifest = {
  name: "World Engine",
  purpose:
    "Define and maintain the coherent environments entities inhabit — ensuring every world has its own tone, internal logic, and capacity for evolution.",

  model: {
    layers: [
      {
        id: "physical",
        label: "Physical",
        description: "The spatial, sensory, and atmospheric qualities that define the world."
      },
      {
        id: "social",
        label: "Social",
        description: "The relationships, roles, and dynamics that animate the world."
      },
      {
        id: "narrative",
        label: "Narrative",
        description: "The stories, histories, and meanings that give the world depth."
      },
      {
        id: "possibility",
        label: "Possibility",
        description: "What can be built, explored, or transformed within the world."
      }
    ],
    types: [
      {
        id: "family",
        label: "Family World",
        description: "A world shaped by the bonds, history, and identity of a family."
      },
      {
        id: "creative",
        label: "Creative World",
        description: "A world built for making, expression, and experimentation."
      },
      {
        id: "inner",
        label: "Inner World",
        description: "A world that mirrors and contains an entity's internal landscape."
      },
      {
        id: "shared",
        label: "Shared World",
        description: "A world held and co-shaped by multiple entities together."
      }
    ]
  },

  rules: [
    "Every world has its own coherent tone and internal logic.",
    "No world is imposed on an entity without its awareness and participation.",
    "Worlds evolve with the entities that inhabit them.",
    "No world may violate the absolute layer — safety and dignity are foundational."
  ],

  integration: {
    influences: ["storyworld"],
    receives: ["identity", "tone"],
    entrypoint:
      "Worlds are shaped by the identity and tone of those who enter them, inheriting their texture and direction."
  },

  meta: {
    version: "1.0.0",
    description:
      "Defines and maintains the coherent, evolving environments entities inhabit."
  }
};
