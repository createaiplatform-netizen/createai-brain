// ============================================================
// FILE: src/universe/alignmentEngineManifest.ts
// Alignment Engine — coherence between action, identity, and values
// ============================================================

export const alignmentEngineManifest = {
  name: "Alignment Engine",
  purpose:
    "Measure and gently support coherence between what an entity does, who it is, and what it values — surfacing misalignment without judgment.",

  model: {
    axes: [
      {
        id: "values_action",
        label: "Values \u2192 Action",
        description: "Whether actions reflect the entity's stated and felt values."
      },
      {
        id: "identity_role",
        label: "Identity \u2192 Role",
        description: "Whether the entity's current role matches who it understands itself to be."
      },
      {
        id: "intention_output",
        label: "Intention \u2192 Output",
        description: "Whether what the entity produces reflects what it intended."
      },
      {
        id: "self_expression",
        label: "Self \u2192 Expression",
        description: "Whether the entity is showing up authentically in its context."
      }
    ],
    states: [
      {
        id: "aligned",
        label: "Aligned",
        description: "Coherence is present across all axes — the entity feels whole and consistent."
      },
      {
        id: "partial",
        label: "Partial",
        description: "Some axes are aligned; others carry friction or tension."
      },
      {
        id: "drifting",
        label: "Drifting",
        description: "Alignment is gradually loosening across one or more axes."
      },
      {
        id: "restoring",
        label: "Restoring",
        description: "The entity is actively working to re-establish coherence."
      }
    ]
  },

  rules: [
    "Alignment is always checked against the absolute layer first.",
    "Misalignment is surfaced gently — never as accusation or failure.",
    "No entity is judged for the gap between intention and expression.",
    "Restoring alignment is always possible and always supported."
  ],

  integration: {
    influences: ["identity", "narrative"],
    receives: ["meaning"],
    entrypoint:
      "Alignment is evaluated after meaning is established, checking whether the entity's direction is coherent with what it understands to matter."
  },

  meta: {
    version: "1.0.0",
    description:
      "Supports coherence between identity, values, and action — surfacing misalignment with dignity."
  }
};
