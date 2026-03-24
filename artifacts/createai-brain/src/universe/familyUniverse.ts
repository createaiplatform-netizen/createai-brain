// ============================================================
// FILE: src/universe/familyUniverse.ts
// Family Universe — shared symbolic universe for a family
// ============================================================

export const familyUniverse = {
  id: "family_universe",
  label: "Family Universe",
  description:
    "A shared symbolic universe with individual and collective spaces.",

  members: [
    {
      role:    "parent",
      worldId: "parent_world",
      tone:    "steady, supportive"
    },
    {
      role:    "partner",
      worldId: "partner_world",
      tone:    "warm, collaborative"
    },
    {
      role:    "child",
      worldId: "child_world",
      tone:    "curious, playful"
    }
  ],

  sharedWorld: {
    id:          "family_world",
    description: "The shared space where everyone's presence is felt.",
    influencedBy: ["relationships", "harmony", "alignment", "continuity"]
  },

  enginesInvolved: ["identity", "relationships", "world", "harmony", "continuity", "possibility"],

  meta: {
    version: "1.0.0",
    role: "baseline family configuration"
  }
};
