// ============================================================
// FILE: src/universe/timeEngineManifest.ts
// Time Engine — how time flows for entities in the universe
// ============================================================

export const timeEngineManifest = {
  name: "Time Engine",
  purpose: "Define how time is experienced, measured, and navigated by entities.",

  model: {
    scales: [
      { id: "moment",     label: "Moment",     description: "A single point of awareness." },
      { id: "phase",      label: "Phase",       description: "A sustained period with a consistent tone." },
      { id: "arc",        label: "Arc",         description: "A long movement from one state to another." },
      { id: "generation", label: "Generation",  description: "A span larger than a single lifetime or cycle." }
    ],
    modes: [
      { id: "linear",    label: "Linear",    description: "Time moves forward in sequence." },
      { id: "cyclical",  label: "Cyclical",  description: "Time returns and repeats with variation." },
      { id: "layered",   label: "Layered",   description: "Multiple time streams coexist." },
      { id: "suspended", label: "Suspended", description: "Time pauses while meaning is processed." }
    ]
  },

  states: [
    { id: "flowing",    label: "Flowing",    description: "Time moves naturally and is felt as continuous." },
    { id: "compressed", label: "Compressed", description: "Time feels accelerated; much happens quickly." },
    { id: "expanded",   label: "Expanded",   description: "Time feels slow, rich, and full of detail." },
    { id: "anchored",   label: "Anchored",   description: "Time is organized around a fixed meaningful moment." }
  ],

  rules: [
    "Time does not erase — it accumulates.",
    "Past states remain accessible as context.",
    "No entity can be forced backward in time.",
    "Future time is possibility, not obligation."
  ],

  integration: {
    influences: ["emotion", "narrative", "continuity"],
    receives:   ["identity"],
    entrypoint: "Time context is applied after identity is recognized."
  },

  meta: {
    version: "1.0.0",
    description: "Defines temporal experience for all entities in the universe."
  }
};
