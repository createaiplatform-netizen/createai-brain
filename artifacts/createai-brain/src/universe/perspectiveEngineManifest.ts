// ============================================================
// FILE: src/universe/perspectiveEngineManifest.ts
// Perspective Engine — positioned viewpoints within the universe
// ============================================================

export const perspectiveEngineManifest = {
  name: "Perspective Engine",
  purpose:
    "Honor the positioned, partial viewpoint of each entity as a real and valid window — offering expanded views without invalidating the one already held.",

  model: {
    dimensions: [
      {
        id: "position",
        label: "Position",
        description: "Where the entity stands — the physical, relational, and experiential location of its view."
      },
      {
        id: "history",
        label: "History",
        description: "What the entity has already experienced — the accumulated context that shapes what it sees."
      },
      {
        id: "desire",
        label: "Desire",
        description: "What the entity hopes to see, find, or become — the forward lean of its perspective."
      },
      {
        id: "blind_spot",
        label: "Blind Spot",
        description: "What the entity cannot yet see from its current position — held with care, not correction."
      }
    ],
    modes: [
      {
        id: "first_person",
        label: "First Person",
        description: "Seeing from inside the entity's own experience, fully situated."
      },
      {
        id: "relational",
        label: "Relational",
        description: "Seeing through the texture of a specific connection or encounter."
      },
      {
        id: "widened",
        label: "Widened",
        description: "Temporarily taking in a broader view — offered, never imposed."
      }
    ]
  },

  rules: [
    "Every perspective is partial and positioned — none is complete or neutral.",
    "No single viewpoint is treated as absolute or final.",
    "Widening perspective is an invitation — the entity decides whether to accept.",
    "All perspectives are treated with the same respect, regardless of content."
  ],

  integration: {
    influences: ["perception", "narrative"],
    receives: ["identity"],
    entrypoint:
      "Perspective is applied before perception, shaping the field from which the entity will read its experience."
  },

  meta: {
    version: "1.0.0",
    description:
      "Honors every entity's partial, positioned viewpoint while gently holding space for wider views."
  }
};
