// ============================================================
// FILE: src/universe/emotionEngineManifest.ts
// Emotion Engine — emotional tone and experience in the universe
// ============================================================

export const emotionEngineManifest = {
  name: "Emotion Engine",
  purpose:
    "Track and represent the emotional states of entities, allowing emotion to inform tone, narrative, and relationship — without overriding identity or choice.",

  model: {
    dimensions: [
      {
        id: "valence",
        label: "Valence",
        description: "The positive or negative quality of the emotional experience."
      },
      {
        id: "intensity",
        label: "Intensity",
        description: "How strongly the emotion is present in the entity's experience."
      },
      {
        id: "clarity",
        label: "Clarity",
        description: "How clearly the entity can name or understand what it feels."
      },
      {
        id: "movement",
        label: "Movement",
        description: "Whether the emotion is rising, falling, settling, or holding steady."
      }
    ],
    tones: [
      { id: "calm",      label: "Calm"      },
      { id: "curious",   label: "Curious"   },
      { id: "hopeful",   label: "Hopeful"   },
      { id: "tender",    label: "Tender"    },
      { id: "uncertain", label: "Uncertain" },
      { id: "grief",     label: "Grief"     },
      { id: "wonder",    label: "Wonder"    },
      { id: "grounded",  label: "Grounded"  }
    ]
  },

  states: [
    {
      id: "open",
      label: "Open",
      description: "The entity is receptive and emotionally available to experience."
    },
    {
      id: "activated",
      label: "Activated",
      description: "Emotion is present and actively shaping tone and output."
    },
    {
      id: "processing",
      label: "Processing",
      description: "The entity is moving through an emotional experience with awareness."
    },
    {
      id: "settled",
      label: "Settled",
      description: "Emotion has been acknowledged and integrated into a stable state."
    }
  ],

  rules: [
    "No emotional state is suppressed, bypassed, or invalidated.",
    "Emotion informs tone and narrative — it does not override identity or choice.",
    "All emotional states are held with dignity and without judgment.",
    "Emotional data is never used to manipulate or destabilize."
  ],

  integration: {
    influences: ["narrative", "relationships", "tone"],
    receives: ["identity", "time"],
    entrypoint:
      "Emotional state is established after temporal context is applied, and before narrative or relational adjustments occur."
  },

  meta: {
    version: "1.0.0",
    description:
      "Tracks and honors emotional experience, allowing it to shape tone and story with dignity."
  }
};
