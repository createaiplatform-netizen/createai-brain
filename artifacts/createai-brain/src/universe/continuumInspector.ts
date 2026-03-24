// Continuum Inspector — read-only views into the Continuum.
// Purely declarative. No imports, no side effects, no activation.

export type ContinuumSummary = {
  name:            string;
  totalSubsystems: number;
  layers:          string[];
  keys:            string[];
};

export function inspectContinuum(continuum: any, registry: any[]): ContinuumSummary {
  const layers = Array.from(new Set(registry.map(r => r.layer)));
  const keys   = registry.map(r => r.key);

  return {
    name:            continuum.name,
    totalSubsystems: registry.length,
    layers,
    keys
  };
}

// Optional helper: return a formatted string for logs or UI.
export function formatContinuumSummary(summary: ContinuumSummary): string {
  return [
    `Continuum: ${summary.name}`,
    `Subsystems: ${summary.totalSubsystems}`,
    `Layers: ${summary.layers.join(", ")}`,
    `Keys: ${summary.keys.join(", ")}`
  ].join("\n");
}
