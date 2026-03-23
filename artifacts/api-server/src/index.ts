import app from "./app";
import { bootstrapServices }     from "./container/bootstrap";
import { expandPlatform }        from "./services/expansionEngine";
import { finalizeConfiguration } from "./services/systemConfigurator";
import { brainEngine }           from "./engine/BrainEnforcementEngine.js";
import { notifyFamily }          from "./utils/notifications.js";
import { initVentonWay, processQueue } from "./services/ventonWay.js";
import { initElectricNetWay }  from "./services/electricNetWay.js";
import { initEverythingNetWay } from "./services/everythingNetWay.js";
import { initMeshNetWay }       from "./services/meshNetWay.js";
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
    try {
      await initVentonWay();

      // ── VentonWay queue scheduler ────────────────────────────────────────────
      // Runs every 60 seconds inside this process — no external service needed.
      // Processes pending + retrying rows whose scheduled_at <= NOW().
      // Covers day-2, day-5, and all future timed messages automatically.
      const QUEUE_INTERVAL_MS = 60_000;
      const queueTicker = setInterval(async () => {
        try {
          const result = await processQueue();
          if (result.processed > 0) {
            console.log(
              `[VentonWay:Scheduler] tick — processed:${result.processed}` +
              ` sent:${result.sent} failed:${result.failed}`
            );
          }
        } catch (tickErr) {
          console.warn("[VentonWay:Scheduler] tick error (non-fatal):", (tickErr as Error).message);
        }
      }, QUEUE_INTERVAL_MS);

      // unref() so the interval never prevents a clean process shutdown
      queueTicker.unref();

      console.log(`[VentonWay:Scheduler] ✅ started — processing queue every ${QUEUE_INTERVAL_MS / 1000}s`);
    }
    catch (err) { console.error("[Startup] initVentonWay failed — continuing:", (err as Error).message); }

    try { await initElectricNetWay(); }
    catch (err) { console.error("[Startup] initElectricNetWay failed — continuing:", (err as Error).message); }

    try { await initEverythingNetWay(); }
    catch (err) { console.error("[Startup] initEverythingNetWay failed — continuing:", (err as Error).message); }

    try { await initMeshNetWay(); }
    catch (err) { console.error("[Startup] initMeshNetWay failed — continuing:", (err as Error).message); }

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
