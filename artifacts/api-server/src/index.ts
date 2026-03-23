import app from "./app";
import { bootstrapServices }     from "./container/bootstrap";
import { expandPlatform }        from "./services/expansionEngine";
import { finalizeConfiguration } from "./services/systemConfigurator";
import { brainEngine }           from "./engine/BrainEnforcementEngine.js";
import { notifyFamily }          from "./utils/notifications.js";
import { initVentonWay }        from "./services/ventonWay.js";
import { initEmailScheduler }    from "./semantic/emailScheduler.js";
import {
  initFamilyAgents,
  ensureStripeCustomers,
  ensureStripeConnectedAccounts,
  attachPrimaryBankAccount,
} from "./services/familyAgents.js";
import { openFloodgates } from "./floodgates.js";

// ─── Global error handlers — prevent server crash on unhandled async errors ───

process.on("uncaughtException", (err) => {
  console.error("[Process] Uncaught exception — server continues:", err?.message ?? err);
});

process.on("unhandledRejection", (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error("[Process] Unhandled promise rejection — server continues:", msg);
});

// ─── Bootstrap DI before server binds ────────────────────────────────────────

bootstrapServices();

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);

  void (async () => {
    try { await initVentonWay(); }
    catch (err) { console.error("[Startup] initVentonWay failed — continuing:", (err as Error).message); }

    try { await expandPlatform(); }
    catch (err) { console.error("[Startup] expandPlatform failed — continuing:", (err as Error).message); }

    try { await finalizeConfiguration(); }
    catch (err) { console.error("[Startup] finalizeConfiguration failed — continuing:", (err as Error).message); }

    try { brainEngine.start(); }
    catch (err) { console.error("[Startup] brainEngine.start failed — continuing:", (err as Error).message); }

    if (process.env.BRAIN_NOTIFY_ON_START === "true") {
      try { await notifyFamily(); }
      catch (err) { console.error("[Startup] notifyFamily failed — continuing:", (err as Error).message); }
    } else {
      console.log("[Brain:notify] Startup notifications skipped (set BRAIN_NOTIFY_ON_START=true to enable)");
    }

    try { await ensureStripeCustomers(); }
    catch (err) { console.error("[Startup] ensureStripeCustomers failed — continuing:", (err as Error).message); }

    try { await ensureStripeConnectedAccounts(); }
    catch (err) { console.error("[Startup] ensureStripeConnectedAccounts failed — continuing:", (err as Error).message); }

    try { await attachPrimaryBankAccount(); }
    catch (err) { console.error("[Startup] attachPrimaryBankAccount failed — continuing:", (err as Error).message); }

    try { initFamilyAgents(); }
    catch (err) { console.error("[Startup] initFamilyAgents failed — continuing:", (err as Error).message); }

    openFloodgates();

    try { await initEmailScheduler(); }
    catch (err) { console.error("[Startup] initEmailScheduler failed — continuing:", (err as Error).message); }
  })();
});
