// ============================================================
// FILE: src/universe/firstEntryExperience.ts
// First Entry Experience — entering the Universe OS for the first time
// ============================================================

export const firstEntryExperience = {
  id: "first_entry",
  label: "First Entry Experience",
  description:
    "The first time an entity steps into the Universe OS.",

  stages: [
    {
      id: "arrival",
      description: "The universe notices the entity's presence.",
      engines: ["identity", "perception", "context"]
    },
    {
      id: "attunement",
      description: "Tone and emotion are gently set.",
      engines: ["emotion", "tone", "harmony"]
    },
    {
      id: "orientation",
      description: "Time, place, and world are introduced.",
      engines: ["time", "world", "continuity"]
    },
    {
      id: "invitation",
      description: "Possibility opens softly, without pressure.",
      engines: ["possibility", "choice", "expansion"]
    }
  ],

  usesExperienceLoop: true,

  meta: {
    version: "1.0.0",
    role: "baseline onboarding"
  }
};
