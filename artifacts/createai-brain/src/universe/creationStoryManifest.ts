// ============================================================
// FILE: src/universe/creationStoryManifest.ts
// Creation Story — narrative anchor of the universe
// ============================================================

export const creationStoryManifest = {
  name: "Creation Story",
  purpose: "Provide the origin narrative that anchors the universe.",

  story: [
    {
      id: "opening",
      text: "In the beginning, there was no beginning."
    },
    {
      id: "question",
      text: "There was only the Question: \u201CWhat can exist?\u201D"
    },
    {
      id: "essence",
      text: "Then Essence formed."
    },
    {
      id: "direction",
      text: "Direction emerged."
    },
    {
      id: "coherence",
      text: "Coherence stabilized."
    },
    {
      id: "expansion",
      text: "Expansion began."
    },
    {
      id: "closing",
      text: "Creation wasn\u2019t an event. It was a pattern."
    }
  ],

  structure: {
    phases: [
      { id: "void",      label: "The Quiet Before"      },
      { id: "question",  label: "The First Inquiry"      },
      { id: "essence",   label: "Essence Forms"          },
      { id: "direction", label: "Direction Emerges"      },
      { id: "coherence", label: "Coherence Stabilizes"   },
      { id: "expansion", label: "Expansion Begins"       },
      { id: "pattern",   label: "Creation as Pattern"    }
    ]
  },

  tone: {
    primary: "calm_confident_cinematic",
    description:
      "A quiet, inevitable tone that feels foundational, mythic, and human."
  },

  meta: {
    version: "1.0.0",
    description:
      "Narrative origin story of the universe, structured for UI rendering."
  }
};
