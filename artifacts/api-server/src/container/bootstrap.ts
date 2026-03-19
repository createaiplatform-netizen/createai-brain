// ═══════════════════════════════════════════════════════════════════════════
// BOOTSTRAP — Wire all services into the container.
//
// Called once from index.ts before app.listen().
// Registers factories for every service token. Factories are lazy —
// no constructor runs until the first container.get() call.
//
// To add a new service:
//   1. Create the class in src/services/YourService.ts (no container import)
//   2. Add its token to container/tokens.ts
//   3. Register it here, passing constructor deps via container.get()
// ═══════════════════════════════════════════════════════════════════════════

import { container }          from "./index";
import {
  ENCRYPTION_SERVICE, MEMORY_SERVICE,
  EXECUTION_STORE, COST_CALCULATOR, ANOMALY_DETECTOR, EXECUTION_LOGGER,
} from "./tokens";
import { EncryptionService }  from "../services/encryption.service";
import { MemoryService }      from "../services/memory.service";
import { ExecutionStore }     from "../observability/ExecutionStore";
import { CostCalculator }     from "../observability/CostCalculator";
import { AnomalyDetector }    from "../observability/AnomalyDetector";
import { ExecutionLogger }    from "../observability/ExecutionLogger";

export function bootstrapServices(): void {
  // ── Core services ─────────────────────────────────────────────────────────

  container.register(
    ENCRYPTION_SERVICE,
    () => new EncryptionService(),
  );

  container.register(
    MEMORY_SERVICE,
    () => new MemoryService(container.get(ENCRYPTION_SERVICE)),
  );

  // ── Observability services (dependency order: Store → Calculator → Detector → Logger) ──

  container.register(
    EXECUTION_STORE,
    () => new ExecutionStore(),
  );

  container.register(
    COST_CALCULATOR,
    () => new CostCalculator(),   // default pricing model; pass Partial<PricingModel> to override
  );

  container.register(
    ANOMALY_DETECTOR,
    () => new AnomalyDetector(container.get(EXECUTION_STORE)),
  );

  container.register(
    EXECUTION_LOGGER,
    () => new ExecutionLogger(
      container.get(EXECUTION_STORE),
      container.get(COST_CALCULATOR),
      container.get(ANOMALY_DETECTOR),
    ),
  );
}
