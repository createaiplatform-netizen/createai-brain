// ============================================================
// FILE: src/universe/perceptionEngineManifest.ts
// Perception Engine — how entities interpret their experience
// ============================================================

export const perceptionEngineManifest = {
  name: "Perception Engine",
  purpose: "Define how entities read, filter, and interpret what they encounter.",

  model: {
    filters: [
      { id: "lens",      label: "Lens",      description: "The interpretive frame an entity brings." },
      { id: "attention", label: "Attention", description: "What the entity notices and prioritizes." },
      { id: "contrast",  label: "Contrast",  description: "What the entity notices by difference." },
      { id: "resonance", label: "Resonance", description: "What the entity feels drawn toward." }
    ],
    modes: [
      { id: "open",      label: "Open",      description: "Perceiving broadly without strong filters." },
      { id: "focused",   label: "Focused",   description: "Perceiving narrowly with clear attention." },
      { id: "reflective",label: "Reflective",description: "Perceiving the self through external experience." },
      { id: "expansive", label: "Expansive", description: "Perceiving beyond current boundaries." }
    ]
  },

  rules: [
    "Perception is always from a positioned perspective.",
    "No perception is treated as absolute truth.",
    "Filters can shift — entities are not locked into a view.",
    "Perception informs meaning, not the other way around."
  ],

  integration: {
    influences: ["meaning", "tone"],
    receives:   ["identity"],
    entrypoint: "Perception shapes how meaning is constructed."
  },

  meta: {
    version: "1.0.0",
    description: "Governs how entities interpret and frame their experience."
  }
};
