import app from "./app";
import { bootstrapServices }     from "./container/bootstrap";
import { expandPlatform }        from "./services/expansionEngine";
import { finalizeConfiguration } from "./services/systemConfigurator";
import { brainEngine }           from "./engine/BrainEnforcementEngine.js";
import { notifyFamily }          from "./utils/notifications.js";
import {
  initFamilyAgents,
  ensureStripeCustomers,
  ensureStripeConnectedAccounts,
  attachPrimaryBankAccount,
} from "./services/familyAgents.js";
import { openFloodgates } from "./floodgates.js";

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
    await ensureStripeConnectedAccounts();
    await attachPrimaryBankAccount();
    initFamilyAgents();

    openFloodgates();
  })();
});
