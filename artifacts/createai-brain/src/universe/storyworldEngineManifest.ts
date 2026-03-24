// ============================================================
// FILE: src/universe/storyworldEngineManifest.ts
// Storyworld Engine — the narrative-environment intersection
// ============================================================

export const storyworldEngineManifest = {
  name: "Storyworld Engine",
  purpose: "Create and maintain environments that are alive with story — where place and narrative are inseparable.",

  model: {
    elements: [
      { id: "setting",    label: "Setting",    description: "The physical and atmospheric qualities of the world." },
      { id: "lore",       label: "Lore",       description: "The accumulated stories and meanings of the place." },
      { id: "inhabitants",label: "Inhabitants",description: "The entities that define the world's life." },
      { id: "arcs",       label: "Arcs",       description: "The ongoing stories that animate the world." }
    ],
    types: [
      { id: "family_storyworld",   label: "Family Storyworld",   description: "The living world of a family over time." },
      { id: "creative_storyworld", label: "Creative Storyworld", description: "A world built for making and expression." },
      { id: "inner_storyworld",    label: "Inner Storyworld",    description: "The internal landscape of an entity." },
      { id: "shared_storyworld",   label: "Shared Storyworld",   description: "A world co-created by multiple entities." }
    ]
  },

  rules: [
    "A storyworld is never just a backdrop — it is alive.",
    "The world changes as the story changes.",
    "No storyworld is owned by one entity alone.",
    "Every storyworld has its own internal coherence and tone."
  ],

  integration: {
    influences: ["narrative", "world"],
    receives:   ["narrative", "possibility"],
    entrypoint: "Storyworld is shaped at the intersection of narrative and possibility."
  },

  meta: {
    version: "1.0.0",
    description: "Creates and maintains narrative-alive environments for all entities."
  }
};
