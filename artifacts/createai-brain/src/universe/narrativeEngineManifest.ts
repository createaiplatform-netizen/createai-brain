// ============================================================
// FILE: src/universe/narrativeEngineManifest.ts
// Narrative Engine — story structure and flow in the universe
// ============================================================

export const narrativeEngineManifest = {
  name: "Narrative Engine",
  purpose:
    "Shape and adapt the living story each entity inhabits, responding to identity, emotion, time, and pattern — without imposing an outcome.",

  model: {
    elements: [
      {
        id: "thread",
        label: "Thread",
        description: "A continuous strand of story that persists across time and change."
      },
      {
        id: "arc",
        label: "Arc",
        description: "A shaped movement from one state to another with emotional weight."
      },
      {
        id: "beat",
        label: "Beat",
        description: "A single meaningful moment that shifts something in the story."
      },
      {
        id: "threshold",
        label: "Threshold",
        description: "A crossing point after which the story cannot return to what it was."
      }
    ],
    modes: [
      {
        id: "linear",
        label: "Linear",
        description: "The story unfolds in a clear, sequential movement."
      },
      {
        id: "branching",
        label: "Branching",
        description: "The story opens into multiple paths based on choice and context."
      },
      {
        id: "layered",
        label: "Layered",
        description: "Multiple story threads coexist and inform each other."
      },
      {
        id: "convergent",
        label: "Convergent",
        description: "Separate threads move toward a single unifying moment."
      }
    ]
  },

  states: [
    {
      id: "unfolding",
      label: "Unfolding",
      description: "The story is actively developing with forward movement."
    },
    {
      id: "paused",
      label: "Paused",
      description: "The story is held at a meaningful moment while something is processed."
    },
    {
      id: "integrating",
      label: "Integrating",
      description: "Past threads are being woven into a coherent whole."
    },
    {
      id: "opening",
      label: "Opening",
      description: "A new chapter is beginning — the story is expanding into new territory."
    }
  ],

  rules: [
    "No story thread is erased without the entity's awareness and context.",
    "Every entity inhabits a story worth honoring.",
    "Narrative adapts to the entity — it does not dictate direction.",
    "Every ending is also the beginning of what comes next."
  ],

  integration: {
    influences: ["identity", "relationships", "possibility", "storyworld"],
    receives: ["identity", "emotion", "time", "pattern"],
    entrypoint:
      "Narrative adjusts after emotional state is established, weaving identity and emotion into the ongoing story."
  },

  meta: {
    version: "1.0.0",
    description:
      "Shapes the living, adaptive story each entity inhabits across all states and transitions."
  }
};
