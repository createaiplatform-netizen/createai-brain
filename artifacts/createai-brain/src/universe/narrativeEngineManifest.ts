// ============================================================
// FILE: src/universe/narrativeEngineManifest.ts
// Narrative Engine — story structure and flow in the universe
// ============================================================

export const narrativeEngineManifest = {
  name: "Narrative Engine",
  purpose: "Shape and adapt the story each entity inhabits as it moves through the universe.",

  model: {
    elements: [
      { id: "thread",    label: "Thread",    description: "A continuous strand of story across time." },
      { id: "arc",       label: "Arc",       description: "A shaped movement from one state to another." },
      { id: "beat",      label: "Beat",      description: "A single meaningful moment in the story." },
      { id: "threshold", label: "Threshold", description: "A crossing point that changes what comes after." }
    ],
    modes: [
      { id: "linear",      label: "Linear",      description: "Story unfolds in sequence." },
      { id: "branching",   label: "Branching",   description: "Story forks based on choice or context." },
      { id: "layered",     label: "Layered",     description: "Multiple stories coexist and interact." },
      { id: "convergent",  label: "Convergent",  description: "Separate threads merge into a single moment." }
    ]
  },

  states: [
    { id: "unfolding",   label: "Unfolding",   description: "Story is actively developing." },
    { id: "paused",      label: "Paused",      description: "Story is held at a meaningful moment." },
    { id: "integrating", label: "Integrating", description: "Past threads are being woven together." },
    { id: "opening",     label: "Opening",     description: "A new story chapter is beginning." }
  ],

  rules: [
    "No story thread is erased without context.",
    "Every entity has a story worth telling.",
    "Narrative adapts — it does not dictate.",
    "Endings are always also beginnings."
  ],

  integration: {
    influences: ["identity", "relationships", "possibility", "storyworld"],
    receives:   ["identity", "emotion", "time", "pattern"],
    entrypoint: "Narrative adjusts after emotional state is established."
  },

  meta: {
    version: "1.0.0",
    description: "Shapes the living story of each entity in the universe."
  }
};
