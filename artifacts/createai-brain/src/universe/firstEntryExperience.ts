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
      description: "Being noticed by the universe — the entity is seen before anything else happens.",
      engines: ["identity", "perception", "context"]
    },
    {
      id: "attunement",
      description: "Tone and emotion are gently set — the universe orients to how the entity feels right now.",
      engines: ["emotion", "tone", "harmony"]
    },
    {
      id: "orientation",
      description: "Time, place, and world are introduced — the entity learns where and when it is.",
      engines: ["time", "world", "continuity"]
    },
    {
      id: "invitation",
      description: "Possibility is opened without pressure — the entity sees what is available, not what is expected.",
      engines: ["possibility", "choice", "expansion"]
    }
  ],

  usesExperienceLoop: true,

  meta: {
    version: "1.0.0",
    role: "baseline onboarding into the universe"
  }
};
