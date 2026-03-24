// ============================================================
// FILE: src/universe/kidsUniverse.ts
// Kids Universe — a gentle, adaptive universe for children
// ============================================================

export const kidsUniverse = {
  id: "kids_universe",
  label: "Kids Universe",
  description:
    "A soft, imaginative universe that adapts to a child's emotional state.",

  safety: {
    emotional:   "gentle, reassuring, non-judgmental",
    narrative:   "simple, kind, non-threatening",
    possibility: "open but bounded, always safe"
  },

  responses: {
    excited: "world brightens, motion increases, more paths appear",
    tired:   "world softens, motion slows, fewer but clearer paths",
    unsure:  "world becomes gentle and inviting with simple choices"
  },

  enginesInvolved: ["emotion", "world", "possibility", "tone", "harmony", "storyworld"],

  meta: {
    version: "1.0.0",
    role: "baseline kids configuration"
  }
};
