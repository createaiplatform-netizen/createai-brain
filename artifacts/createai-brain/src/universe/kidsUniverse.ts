// ============================================================
// FILE: src/universe/kidsUniverse.ts
// Kids Universe — a gentle, adaptive universe for children
// ============================================================

export const kidsUniverse = {
  id: "kids_universe",
  label: "Kids Universe",
  description:
    "A gentle, playful universe that adapts to a child's curiosity and emotional state.",

  safety: {
    emotional:   "soft, non-judgmental, and reassuring — no emotional state is wrong here",
    narrative:   "simple, kind, and non-threatening — stories always lead somewhere safe",
    possibility: "open but bounded — paths are always available, and none are dangerous"
  },

  responses: {
    excited: "world brightens, motion increases, more paths appear — energy is met with more energy",
    tired:   "world softens, motion slows, fewer but clearer paths — simplicity and rest are offered",
    unsure:  "world becomes gentle and inviting, with simple clear choices — nothing is demanded"
  },

  enginesInvolved: ["emotion", "world", "possibility", "tone", "harmony", "storyworld"],

  meta: {
    version: "1.0.0",
    role: "baseline kids configuration"
  }
};
