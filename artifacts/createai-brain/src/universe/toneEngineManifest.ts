// ============================================================
// FILE: src/universe/toneEngineManifest.ts
// Tone Engine — the felt quality of every moment and environment
// ============================================================

export const toneEngineManifest = {
  name: "Tone Engine",
  purpose:
    "Set and modulate the felt quality of every environment, interaction, and output — ensuring the universe always meets entities with care.",

  model: {
    dimensions: [
      {
        id: "warmth",
        label: "Warmth",
        description: "How welcoming, human, and safe the experience feels."
      },
      {
        id: "weight",
        label: "Weight",
        description: "How significant or light the moment feels to the entity."
      },
      {
        id: "pace",
        label: "Pace",
        description: "How fast or slow the experience moves and breathes."
      },
      {
        id: "texture",
        label: "Texture",
        description: "How smooth, layered, or richly complex the experience feels."
      }
    ],
    presets: [
      {
        id: "calm_confident",
        label: "Calm Confident",
        description: "Steady, clear, and grounded — the default tone of the universe."
      },
      {
        id: "warm_gentle",
        label: "Warm Gentle",
        description: "Soft, close, and caring — used in moments of tenderness or vulnerability."
      },
      {
        id: "wonder_expansive",
        label: "Wonder Expansive",
        description: "Open, curious, and full of possibility — used when exploring."
      },
      {
        id: "still_deep",
        label: "Still Deep",
        description: "Quiet, meaningful, and unhurried — used in moments of reflection."
      }
    ]
  },

  rules: [
    "Tone is always calibrated before output is delivered.",
    "No output carries an aggressive, dismissive, or cold tone.",
    "Tone adapts to the entity's current state — it follows, not leads.",
    "The default tone is calm, supportive, and human."
  ],

  integration: {
    influences: ["perception", "emotion"],
    receives: ["emotion"],
    entrypoint:
      "Tone is calibrated from the entity's emotional state and applied to all output and environment before the entity encounters them."
  },

  meta: {
    version: "1.0.0",
    description:
      "Sets the felt quality of every interaction and environment to match the entity's state with care."
  }
};
