// ============================================================
// FILE: src/universe/perceptionEngineManifest.ts
// Perception Engine — how entities interpret their experience
// ============================================================

export const perceptionEngineManifest = {
  name: "Perception Engine",
  purpose:
    "Shape how each entity reads and interprets what it encounters — filtering experience through position, attention, and resonance without determining meaning.",

  model: {
    filters: [
      {
        id: "lens",
        label: "Lens",
        description: "The interpretive frame the entity brings to any experience."
      },
      {
        id: "attention",
        label: "Attention",
        description: "What the entity notices, prioritizes, and holds in focus."
      },
      {
        id: "contrast",
        label: "Contrast",
        description: "What the entity perceives by difference — what stands out against the background."
      },
      {
        id: "resonance",
        label: "Resonance",
        description: "What the entity feels drawn toward or repelled from intuitively."
      }
    ],
    modes: [
      {
        id: "open",
        label: "Open",
        description: "Perceiving broadly without strong filters or predetermined categories."
      },
      {
        id: "focused",
        label: "Focused",
        description: "Perceiving with clear, deliberate attention in a specific direction."
      },
      {
        id: "reflective",
        label: "Reflective",
        description: "Perceiving the self through the mirror of external experience."
      },
      {
        id: "expansive",
        label: "Expansive",
        description: "Perceiving beyond current edges — reaching into unfamiliar territory."
      }
    ]
  },

  rules: [
    "Perception is always positioned — no view is neutral or absolute.",
    "Filters are acknowledged rather than treated as invisible.",
    "Perceptual frames can shift — no entity is locked into a single view.",
    "Perception informs meaning; it does not produce it directly."
  ],

  integration: {
    influences: ["meaning", "tone"],
    receives: ["identity"],
    entrypoint:
      "Perception is shaped by identity and applied before meaning is constructed — it determines what the entity has to work with."
  },

  meta: {
    version: "1.0.0",
    description:
      "Governs how entities read and frame their experience before meaning is made."
  }
};
