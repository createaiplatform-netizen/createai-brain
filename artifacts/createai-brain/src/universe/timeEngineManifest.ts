// ============================================================
// FILE: src/universe/timeEngineManifest.ts
// Time Engine — how time is experienced inside the universe
// ============================================================

export const timeEngineManifest = {
  name: "Time Engine",
  purpose:
    "Shape how time is experienced, navigated, and understood by each entity — without determining its pace or direction.",

  model: {
    scales: [
      {
        id: "moment",
        label: "Moment",
        description: "A single point of awareness — the smallest unit of lived experience."
      },
      {
        id: "phase",
        label: "Phase",
        description: "A sustained period defined by a consistent tone, direction, or quality."
      },
      {
        id: "arc",
        label: "Arc",
        description: "A shaped movement from one state to another across multiple phases."
      },
      {
        id: "generation",
        label: "Generation",
        description: "A span that exceeds a single lifetime — time as inheritance and continuity."
      }
    ],
    modes: [
      {
        id: "linear",
        label: "Linear",
        description: "Time moves forward in sequence; past informs present."
      },
      {
        id: "cyclical",
        label: "Cyclical",
        description: "Time returns with variation — patterns recur at different depths."
      },
      {
        id: "layered",
        label: "Layered",
        description: "Multiple time streams coexist without canceling each other."
      },
      {
        id: "suspended",
        label: "Suspended",
        description: "Time slows or pauses while meaning is being processed."
      }
    ]
  },

  states: [
    {
      id: "flowing",
      label: "Flowing",
      description: "Time moves naturally and is felt as continuous and unhurried."
    },
    {
      id: "compressed",
      label: "Compressed",
      description: "Time feels accelerated — significant events arrive in close succession."
    },
    {
      id: "expanded",
      label: "Expanded",
      description: "Time feels slow and full — each moment carries unusual weight."
    },
    {
      id: "anchored",
      label: "Anchored",
      description: "Time is organized around a fixed meaningful moment that orients everything else."
    }
  ],

  rules: [
    "Time accumulates — it does not erase.",
    "Past states remain accessible as context, not as constraints.",
    "No entity is forced backward or held in a moment against its nature.",
    "Future time is possibility — it carries no obligation."
  ],

  integration: {
    influences: ["emotion", "narrative", "continuity"],
    receives: ["identity"],
    entrypoint:
      "Temporal context is applied immediately after identity is recognized, shaping the pace and texture of what follows."
  },

  meta: {
    version: "1.0.0",
    description:
      "Governs how time is experienced and navigated by all entities across all scales."
  }
};
