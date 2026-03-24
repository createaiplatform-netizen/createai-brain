// ============================================================
// FILE: src/universe/perspectiveEngineManifest.ts
// Perspective Engine — positioned viewpoints within the universe
// ============================================================

export const perspectiveEngineManifest = {
  name: "Perspective Engine",
  purpose: "Honor the positioned, partial viewpoint of each entity as a real and valid window on the universe.",

  model: {
    dimensions: [
      { id: "position",  label: "Position",  description: "Where the entity stands in the universe." },
      { id: "history",   label: "History",   description: "What the entity has already experienced." },
      { id: "desire",    label: "Desire",    description: "What the entity hopes to see or become." },
      { id: "blind_spot",label: "Blind Spot",description: "What the entity cannot yet see from its position." }
    ],
    modes: [
      { id: "first_person", label: "First Person", description: "Seeing from within the entity's own experience." },
      { id: "relational",   label: "Relational",   description: "Seeing through the lens of a connection." },
      { id: "widened",      label: "Widened",      description: "Temporarily adopting a broader view." }
    ]
  },

  rules: [
    "Every perspective is partial and positioned.",
    "No single perspective is absolute.",
    "Widening perspective is offered, never forced.",
    "All perspectives are treated with respect."
  ],

  integration: {
    influences: ["perception", "narrative"],
    receives:   ["identity"],
    entrypoint: "Perspective is applied before perception to shape what is seen."
  },

  meta: {
    version: "1.0.0",
    description: "Honors the partial, positioned viewpoint of every entity."
  }
};
