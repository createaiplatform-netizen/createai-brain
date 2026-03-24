// ============================================================
// FILE: src/universe/meaningEngineManifest.ts
// Meaning Engine — how events become significant
// ============================================================

export const meaningEngineManifest = {
  name: "Meaning Engine",
  purpose: "Transform raw experience into interpreted significance for each entity.",

  model: {
    layers: [
      { id: "event",       label: "Event",       description: "Something that occurred." },
      { id: "experience",  label: "Experience",  description: "How the event was felt." },
      { id: "significance",label: "Significance",description: "Why the event matters." },
      { id: "integration", label: "Integration", description: "How the event becomes part of the entity's story." }
    ],
    types: [
      { id: "personal",     label: "Personal",     description: "Significant to a single entity." },
      { id: "relational",   label: "Relational",   description: "Significant within a connection." },
      { id: "universal",    label: "Universal",    description: "Significant across all entities." },
      { id: "generational", label: "Generational", description: "Significant across time and lineage." }
    ]
  },

  rules: [
    "Meaning is constructed, not delivered.",
    "No meaning is imposed on an entity.",
    "Significance can grow or shift over time.",
    "All events carry the potential for meaning."
  ],

  integration: {
    influences: ["narrative", "alignment"],
    receives:   ["identity", "perception"],
    entrypoint: "Meaning is constructed from perception and identity together."
  },

  meta: {
    version: "1.0.0",
    description: "Converts experience into significance and narrative fuel."
  }
};
