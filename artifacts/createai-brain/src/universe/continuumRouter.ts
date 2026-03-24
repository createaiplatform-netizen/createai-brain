// Continuum Router — declarative relationships between subsystems.
// Purely internal. No imports, no side effects, no activation.

export type ContinuumRelation = {
  from:        string;
  to:          string;
  type:        "supports" | "influences" | "extends" | "depends-on";
  description: string;
};

export const CONTINUUM_RELATIONS: ContinuumRelation[] = [
  {
    from: "identity",
    to:   "relationship",
    type: "supports",
    description: "Identity provides the foundation for all relational structures."
  },
  {
    from: "universe",
    to:   "ecosystem",
    type: "extends",
    description: "Universes define the environments that ecosystems operate within."
  },
  {
    from: "time",
    to:   "narrative",
    type: "influences",
    description: "Narrative flow is shaped by temporal structure and sequence."
  },
  {
    from: "emotion",
    to:   "narrative",
    type: "supports",
    description: "Emotion adds tone, meaning, and affective depth to narrative."
  },
  {
    from: "relationship",
    to:   "emotion",
    type: "influences",
    description: "Relational context shapes emotional expression."
  },
  {
    from: "possibility",
    to:   "universe",
    type: "extends",
    description: "Possibility defines the branching futures available within universes."
  },
  {
    from: "internal-network",
    to:   "internal-messaging",
    type: "supports",
    description: "The internal network provides routing for internal messaging."
  },
  {
    from: "ecosystem",
    to:   "relationship",
    type: "influences",
    description: "Environmental context shapes relational dynamics."
  }
];

// Returns all declared relationships.
export function getContinuumRelations() {
  return CONTINUUM_RELATIONS;
}
