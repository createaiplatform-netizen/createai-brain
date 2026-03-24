// ============================================================
// FILE: src/universe/identityEngineManifest.ts
// Identity Engine — core identity system of the Universe OS
// ============================================================

export const identityEngineManifest = {
  name: "Identity Engine",
  purpose:
    "Define how entities know themselves, express themselves, and evolve inside the universe.",

  // ------------------------------------------------------------
  // 1. IDENTITY MODEL — what an entity is made of
  // ------------------------------------------------------------
  model: {
    core: [
      {
        id: "essence",
        label: "Essence",
        description: "The irreducible nature of the entity."
      },
      {
        id: "center",
        label: "Center",
        description: "What the entity orients around right now."
      },
      {
        id: "direction",
        label: "Direction",
        description: "Where the entity is heading or longing to move."
      }
    ],
    expression: [
      {
        id: "tone",
        label: "Tone",
        description: "How the entity feels to others."
      },
      {
        id: "style",
        label: "Style",
        description: "How the entity tends to act or show up."
      },
      {
        id: "signature",
        label: "Signature",
        description: "The recognizable pattern that makes it uniquely itself."
      }
    ],
    evolution: [
      {
        id: "arc",
        label: "Arc",
        description: "The long-term trajectory of change."
      },
      {
        id: "thresholds",
        label: "Thresholds",
        description: "Key moments where the entity cannot stay the same."
      },
      {
        id: "becoming",
        label: "Becoming",
        description: "How the entity grows more into itself over time."
      }
    ]
  },

  // ------------------------------------------------------------
  // 2. ENTITY TYPES — who can have an identity
  // ------------------------------------------------------------
  entityTypes: [
    {
      id: "person",
      label: "Person",
      description: "A human being with a lived, evolving story."
    },
    {
      id: "world",
      label: "World",
      description: "A coherent environment with its own tone and rules."
    },
    {
      id: "relationship",
      label: "Relationship",
      description: "A living connection between entities."
    },
    {
      id: "concept",
      label: "Concept",
      description: "An idea, pattern, or principle that shapes experience."
    }
  ],

  // ------------------------------------------------------------
  // 3. STATES — how identity feels right now
  // ------------------------------------------------------------
  states: [
    {
      id: "stable",
      label: "Stable",
      description: "Identity feels clear, grounded, and consistent."
    },
    {
      id: "searching",
      label: "Searching",
      description: "Identity is in motion, asking questions, seeking coherence."
    },
    {
      id: "expanding",
      label: "Expanding",
      description: "Identity is growing into new expressions and roles."
    },
    {
      id: "integrating",
      label: "Integrating",
      description: "Identity is weaving past, present, and future into a whole."
    }
  ],

  // ------------------------------------------------------------
  // 4. TRANSITIONS — how identity changes
  // ------------------------------------------------------------
  transitions: [
    {
      id: "question_awakens",
      from: ["stable", "searching"],
      to: "searching",
      label: "The Question Awakens",
      description:
        "The entity begins to ask: Who am I now, and who am I becoming?"
    },
    {
      id: "pattern_forms",
      from: ["searching"],
      to: "integrating",
      label: "A Pattern Forms",
      description:
        "The entity starts to see coherence in its experiences and choices."
    },
    {
      id: "expression_expands",
      from: ["integrating"],
      to: "expanding",
      label: "Expression Expands",
      description:
        "The entity steps into new expressions that match its deeper truth."
    },
    {
      id: "new_stability",
      from: ["expanding"],
      to: "stable",
      label: "New Stability",
      description:
        "The entity settles into a clearer, more aligned version of itself."
    }
  ],

  // ------------------------------------------------------------
  // 5. INTEGRATION — how this engine connects to the universe
  // ------------------------------------------------------------
  integration: {
    uses: [
      "visualSystemManifest",
      "glyphLanguageManifest",
      "creationStoryManifest"
    ],
    influences: [
      "emotionEngine",
      "narrativeEngine",
      "relationshipEngine",
      "possibilityEngine"
    ],
    entrypoint: {
      label: "Who Enters?",
      description:
        "The Identity Engine activates when an entity steps into the universe and is recognized."
    }
  },

  // ------------------------------------------------------------
  // 6. META
  // ------------------------------------------------------------
  meta: {
    version: "1.0.0",
    description:
      "Core identity system of the Universe OS, defining how entities know, express, and evolve themselves."
  }
};
