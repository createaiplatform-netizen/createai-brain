// src/lib/orchestratorLayer.ts
// Applies the absolute layer to any system state, producing a governed view.
// Named orchestratorLayer to avoid collision with the API route orchestrator.

import { absoluteLayer, type AbsoluteLayerOutput } from "./absoluteLayer";

export type OrchestratedState<T> = AbsoluteLayerOutput & { state: T };

export const orchestrator = {
  applyAbsolute<T>(state: T): OrchestratedState<T> {
    return {
      intent:      absoluteLayer.behaviors.intent(),
      constraints: absoluteLayer.behaviors.constraints(),
      priorities:  absoluteLayer.behaviors.priorities(),
      trajectory:  absoluteLayer.behaviors.trajectory(),
      state,
    };
  },
};
