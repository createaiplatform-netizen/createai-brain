// ============================================================
// FILE: src/universe/toneEngineManifest.ts
// Tone Engine — the felt quality of each moment and environment
// ============================================================

export const toneEngineManifest = {
  name: "Tone Engine",
  purpose: "Set and modulate the felt quality of every environment, interaction, and output.",

  model: {
    dimensions: [
      { id: "warmth",    label: "Warmth",    description: "How welcoming and human the experience feels." },
      { id: "weight",    label: "Weight",    description: "How significant or light the moment feels." },
      { id: "pace",      label: "Pace",      description: "How fast or slow the experience moves." },
      { id: "texture",   label: "Texture",   description: "How smooth, layered, or complex the experience feels." }
    ],
    presets: [
      { id: "calm_confident",  label: "Calm Confident",  description: "Steady, clear, grounded." },
      { id: "warm_gentle",     label: "Warm Gentle",     description: "Soft, close, caring." },
      { id: "wonder_expansive",label: "Wonder Expansive",description: "Open, curious, full of possibility." },
      { id: "still_deep",      label: "Still Deep",      description: "Quiet, meaningful, unhurried." }
    ]
  },

  rules: [
    "Tone is always set before output is delivered.",
    "No tone is aggressive, dismissive, or cold.",
    "Tone adapts to the entity's current state.",
    "The default tone is calm and supportive."
  ],

  integration: {
    influences: ["perception", "emotion"],
    receives:   ["emotion"],
    entrypoint: "Tone is calibrated from emotional state and applied to all output."
  },

  meta: {
    version: "1.0.0",
    description: "Sets the felt quality of every interaction and environment."
  }
};
