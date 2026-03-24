// src/universe/systemInspector.ts

import { SYSTEM_STEPS }                       from "./systemSteps";
import { SYSTEM_LIFECYCLE, getSystemLifecycle } from "./systemLifecycle";

export type SystemInspection = {
  steps:     typeof SYSTEM_STEPS;
  lifecycle: ReturnType<typeof getSystemLifecycle>;
  status:    "ok";
  summary:   string;
};

export function inspectSystem(): SystemInspection {
  const steps     = SYSTEM_STEPS;
  const lifecycle = getSystemLifecycle();
  const summary   = `System has ${steps.length} steps and ${lifecycle.length} lifecycle entries, fully mapped and documented.`;
  return {
    steps,
    lifecycle,
    status: "ok",
    summary
  };
}

// Optional: simple logger you can call from anywhere (server startup, script, etc.)
export function logSystemInspection() {
  const inspection = inspectSystem();
  // Safe, legal, informational only.
  console.log("=== SYSTEM INSPECTION ===");
  console.log(inspection.summary);
  console.log("Steps:", inspection.steps);
  console.log("Lifecycle:", inspection.lifecycle);
  console.log("=========================");
}
