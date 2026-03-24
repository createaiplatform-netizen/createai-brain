// ============================================================
// FILE: src/universe/storyworldEngineManifest.ts
// Storyworld Engine — the narrative-environment intersection
// ============================================================

export const storyworldEngineManifest = {
  name: "Storyworld Engine",
  purpose:
    "Create and maintain environments that are alive with story — where place, meaning, and narrative are inseparable and co-evolving.",

  model: {
    elements: [
      {
        id: "setting",
        label: "Setting",
        description: "The physical, sensory, and atmospheric qualities that make the world distinct."
      },
      {
        id: "lore",
        label: "Lore",
        description: "The accumulated stories, histories, and meanings embedded in the world."
      },
      {
        id: "inhabitants",
        label: "Inhabitants",
        description: "The entities whose presence defines the world's living character."
      },
      {
        id: "arcs",
        label: "Arcs",
        description: "The ongoing stories that animate and evolve the world over time."
      }
    ],
    types: [
      {
        id: "family_storyworld",
        label: "Family Storyworld",
        description: "A living world shaped by family bonds, memory, and evolving story."
      },
      {
        id: "creative_storyworld",
        label: "Creative Storyworld",
        description: "A world built for making — where expression and experimentation are its nature."
      },
      {
        id: "inner_storyworld",
        label: "Inner Storyworld",
        description: "The internal landscape of an entity — rendered as an inhabitable world."
      },
      {
        id: "shared_storyworld",
        label: "Shared Storyworld",
        description: "A world co-created and co-held by multiple entities in relationship."
      }
    ]
  },

  rules: [
    "A storyworld is never merely a backdrop — it is alive, responsive, and evolving.",
    "The world changes as the story and its inhabitants change.",
    "No storyworld is owned by a single entity — it is always shared, even if quietly.",
    "Every storyworld has its own coherent internal tone and logic."
  ],

  integration: {
    influences: ["narrative", "world"],
    receives: ["narrative", "possibility"],
    entrypoint:
      "Storyworld is shaped at the intersection of narrative and possibility — it gives story a place to live and possibility a ground to grow from."
  },

  meta: {
    version: "1.0.0",
    description:
      "Creates and sustains environments where story, place, and meaning are inseparably alive."
  }
};
