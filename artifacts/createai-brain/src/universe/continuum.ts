// The Continuum — the top system of the platform.
// Purely declarative. No imports, no side effects, no activation.

export type ContinuumDomain = {
  name:        string;
  description: string;
  governs:     string[];
};

export const CONTINUUM: ContinuumDomain = {
  name: "The Continuum",
  description:
    "The top system that governs existence, connection, expression, and evolution across all layers of the platform.",
  governs: [
    "Identity Engine",
    "Universe Engine",
    "Relationship Engine",
    "Time Engine",
    "Emotion Engine",
    "Narrative Engine",
    "Ecosystem Engine",
    "Possibility Engine",
    "Internal Networks",
    "Internal Messaging",
    "All Subsystems"
  ]
};

// Returns the top system definition.
// No logic, no activation — just a clean, safe, declarative root.
export function getContinuum() {
  return CONTINUUM;
}
