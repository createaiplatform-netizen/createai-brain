// src/lib/absoluteLayer.ts
// Immutable behavioral foundation — defines intent, constraints, priorities,
// and trajectory for the CreateAI system. Nothing overrides this layer.

export const absoluteLayer = {
  behaviors: {
    intent: (): string =>
      "Build a calm, human-centered creative universe for families and creators — " +
      "grounded in identity, meaning, and intentional design.",

    constraints: (): string[] => [
      "Never generate fabricated metrics, projections, or simulated revenue.",
      "FamilyBank is virtual only — no real financial transactions.",
      "Family Universe Standing Law is permanent and cannot be removed.",
      "Strict execution mode — no speculative or unasked-for features.",
      "Display '—' or 0 when no real data exists.",
    ],

    priorities: (): string[] => [
      "family",
      "identity",
      "creativity",
      "clarity",
      "calm",
    ],

    trajectory: (): string =>
      "Expand the universe with intention — one real, complete piece at a time.",
  },
};

export type AbsoluteLayerOutput = {
  intent: string;
  constraints: string[];
  priorities: string[];
  trajectory: string;
};
