// FILE: src/reality/orchestratorLayer.ts
import { absoluteLayer } from "./absoluteLayer";

export const orchestratorLayer = {
  applyAbsolute<T>(state: T) {
    return {
      absolute: {
        intent:      absoluteLayer.behaviors.intent(),
        constraints: absoluteLayer.behaviors.constraints(),
        priorities:  absoluteLayer.behaviors.priorities(),
        trajectory:  absoluteLayer.behaviors.trajectory()
      },
      state
    };
  }
};
