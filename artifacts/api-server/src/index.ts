import app from "./app";
import { bootstrapServices }     from "./container/bootstrap";
import { expandPlatform }        from "./services/expansionEngine";
import { finalizeConfiguration } from "./services/systemConfigurator";
import { brainEngine }           from "./engine/BrainEnforcementEngine.js";
import { notifyFamily }          from "./utils/notifications.js";
import { startupAutoExecutor }   from "./BrainAutoExecutor.js";
import { startAboveTranscendEngine }    from "./services/aboveTranscend/engine.js";
import { initFamilyAgents, ensureStripeCustomers } from "./services/familyAgents.js";
import { initRealStripeIntegration }   from "./services/aboveTranscend/realStripeIntegration.js";

// Wire all DI services before the server binds. All factories are lazy —
// nothing is instantiated here, just registered.
bootstrapServices();

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);

  // Boot sequence — runs in the background, non-blocking:
  //   1. expandPlatform()         — populates registry, persists run to DB
  //   2. finalizeConfiguration()  — self-heal, verify, lock, persist to organizations table
  //   3. brainEngine.start()      — continuous 60-second self-audit loop
  //   4. notifyFamily()           — email + SMS to all family members (if BRAIN_NOTIFY_ON_START=true)
  //   5. startupAutoExecutor()    — infinite task execution sequence (if BRAIN_AUTO_START=true)
  void (async () => {
    await expandPlatform();
    await finalizeConfiguration();
    brainEngine.start();

    if (process.env.BRAIN_NOTIFY_ON_START === "true") {
      await notifyFamily();
    } else {
      console.log("[Brain:notify] Startup notifications skipped (set BRAIN_NOTIFY_ON_START=true to enable)");
    }

    await ensureStripeCustomers();
    initFamilyAgents();
    startAboveTranscendEngine();
    initRealStripeIntegration();

    if (process.env.BRAIN_AUTO_START === "true") {
      console.log("[AutoExecutor] BRAIN_AUTO_START=true — launching auto-execution sequence…");
      startupAutoExecutor().catch(err => {
        console.error("[AutoExecutor] Fatal error during auto-execution:", err);
      });
    } else {
      console.log("[AutoExecutor] Auto-execution skipped (set BRAIN_AUTO_START=true to enable)");
    }
  })();
});
