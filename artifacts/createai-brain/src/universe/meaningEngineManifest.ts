// ============================================================
// FILE: src/universe/meaningEngineManifest.ts
// Meaning Engine — how experience becomes significant
// ============================================================

export const meaningEngineManifest = {
  name: "Meaning Engine",
  purpose:
    "Transform raw experience into interpreted significance — allowing entities to construct meaning from what they perceive, without imposing what that meaning should be.",

  model: {
    layers: [
      {
        id: "event",
        label: "Event",
        description: "Something that occurred — a fact in the world."
      },
      {
        id: "experience",
        label: "Experience",
        description: "How the event was felt and registered by the entity."
      },
      {
        id: "significance",
        label: "Significance",
        description: "Why the event matters — what it means to the entity in context."
      },
      {
        id: "integration",
        label: "Integration",
        description: "How the event becomes part of the entity's ongoing story and identity."
      }
    ],
    types: [
      {
        id: "personal",
        label: "Personal",
        description: "Meaning held within a single entity's private experience."
      },
      {
        id: "relational",
        label: "Relational",
        description: "Meaning that arises within or through a connection."
      },
      {
        id: "universal",
        label: "Universal",
        description: "Meaning that resonates across entities and contexts."
      },
      {
        id: "generational",
        label: "Generational",
        description: "Meaning that spans time and is passed forward."
      }
    ]
  },

  rules: [
    "Meaning is constructed by the entity — it is never delivered or assigned.",
    "No meaning is imposed on an experience from outside.",
    "Significance can deepen, shift, or be released as time passes.",
    "All experience carries the potential for meaning, whether or not it is yet found."
  ],

  integration: {
    influences: ["narrative", "alignment"],
    receives: ["identity", "perception"],
    entrypoint:
      "Meaning is constructed from the intersection of identity and perception — it emerges after the entity has both a frame and something to apply it to."
  },

  meta: {
    version: "1.0.0",
    description:
      "Transforms experience into significance, allowing entities to construct their own meaning."
  }
};
