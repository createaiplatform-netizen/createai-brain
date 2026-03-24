// ============================================================
// FILE: src/universe/emotionEngineManifest.ts
// Emotion Engine — emotional tone and experience in the universe
// ============================================================

export const emotionEngineManifest = {
  name: "Emotion Engine",
  purpose: "Track, represent, and respond to emotional states across all entities.",

  model: {
    dimensions: [
      { id: "valence",   label: "Valence",   description: "Positive or negative quality of the emotion." },
      { id: "intensity", label: "Intensity", description: "How strongly the emotion is felt." },
      { id: "clarity",   label: "Clarity",   description: "How clearly the emotion is understood by the entity." },
      { id: "movement",  label: "Movement",  description: "Whether the emotion is rising, falling, or stable." }
    ],
    tones: [
      { id: "calm",        label: "Calm"        },
      { id: "curious",     label: "Curious"     },
      { id: "hopeful",     label: "Hopeful"     },
      { id: "tender",      label: "Tender"      },
      { id: "uncertain",   label: "Uncertain"   },
      { id: "grief",       label: "Grief"       },
      { id: "wonder",      label: "Wonder"      },
      { id: "grounded",    label: "Grounded"    }
    ]
  },

  states: [
    { id: "open",       label: "Open",       description: "Entity is receptive and emotionally available." },
    { id: "activated",  label: "Activated",  description: "Emotion is present and influencing output." },
    { id: "processing", label: "Processing", description: "Entity is working through an emotional experience." },
    { id: "settled",    label: "Settled",    description: "Emotion has been integrated and stabilized." }
  ],

  rules: [
    "No emotion is suppressed or invalidated.",
    "Emotion informs tone — it does not override identity.",
    "Emotional data is never weaponized or exploited.",
    "All emotional states are treated with dignity."
  ],

  integration: {
    influences: ["narrative", "relationships", "tone"],
    receives:   ["identity", "time"],
    entrypoint: "Emotional state is set after time context is applied."
  },

  meta: {
    version: "1.0.0",
    description: "Manages emotional experience and tone for all entities."
  }
};
