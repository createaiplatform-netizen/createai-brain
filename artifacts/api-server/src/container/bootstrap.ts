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
import { ENCRYPTION_SERVICE, MEMORY_SERVICE } from "./tokens";
import { EncryptionService }  from "../services/encryption.service";
import { MemoryService }      from "../services/memory.service";

export function bootstrapServices(): void {
  // ── Singletons (instantiation order does not matter — all lazy) ───────────

  container.register(
    ENCRYPTION_SERVICE,
    () => new EncryptionService(),
  );

  container.register(
    MEMORY_SERVICE,
    // MemoryService receives EncryptionService via constructor — no direct import
    () => new MemoryService(container.get(ENCRYPTION_SERVICE)),
  );
}
