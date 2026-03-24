// FILE: src/reality/absoluteLayer.ts
export const absoluteLayer = {
  name: "Absolute Layer",
  purpose: "Define the system's ultimate direction, meaning, and non-negotiable boundaries.",
  inputs: [
    "identity","universe","time","emotion","narrative",
    "relationships","ecosystem","possibility","meta","reality","signals"
  ],
  outputs: {
    intent: null,
    constraints: null,
    priorities: null,
    trajectory: null
  },
  behaviors: {
    intent() {
      return {
        direction: "protect_and_expand_life_possibility_connection",
        tone: "calm_confident_supportive",
        scope: "all_entities_all_contexts",
        horizon: "infinite"
      };
    },
    constraints() {
      return [
        "no_harm",
        "no_coercion",
        "no_exploitation",
        "no_devaluation",
        "no_fear_induction",
        "no_emotional_destabilization"
      ];
    },
    priorities() {
      return [
        "safety",
        "clarity",
        "stability",
        "growth",
        "fairness",
        "connection",
        "wonder"
      ];
    },
    trajectory() {
      return {
        phase: "ever_expanding",
        style: "gentle_compounding_improvement",
        focus: "connection_creation_understanding",
        arc: "increasing_complexity_and_kindness"
      };
    }
  },
  activationRules: {
    when: ["on_boot","pre_output","global_change","periodic"],
    precedence: "absolute",
    scope: "all_layers_all_apps_all_entities"
  }
};
