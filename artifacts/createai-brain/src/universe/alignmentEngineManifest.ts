// ============================================================
// FILE: src/universe/alignmentEngineManifest.ts
// Alignment Engine — coherence between action, identity, and values
// ============================================================

export const alignmentEngineManifest = {
  name: "Alignment Engine",
  purpose: "Measure and support coherence between what an entity does, who it is, and what it values.",

  model: {
    axes: [
      { id: "values_action",    label: "Values \u2192 Action",    description: "Are actions consistent with stated values?" },
      { id: "identity_role",    label: "Identity \u2192 Role",    description: "Does the role match who the entity is?" },
      { id: "intention_output", label: "Intention \u2192 Output", description: "Does the output match the intent?" },
      { id: "self_expression",  label: "Self \u2192 Expression",  description: "Is the entity expressing itself authentically?" }
    ],
    states: [
      { id: "aligned",    label: "Aligned",    description: "Coherence is present across all axes." },
      { id: "partial",    label: "Partial",    description: "Some axes are aligned, others are not." },
      { id: "drifting",   label: "Drifting",   description: "Alignment is slipping gradually." },
      { id: "restoring",  label: "Restoring",  description: "Entity is working to re-establish coherence." }
    ]
  },

  rules: [
    "Alignment is always checked against the absolute layer first.",
    "Misalignment is surfaced gently, not harshly.",
    "No entity is shamed for misalignment.",
    "Restoring alignment is always possible."
  ],

  integration: {
    influences: ["identity", "narrative"],
    receives:   ["meaning"],
    entrypoint: "Alignment is checked when meaning is established."
  },

  meta: {
    version: "1.0.0",
    description: "Supports coherence between identity, values, and action."
  }
};
