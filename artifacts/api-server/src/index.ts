import app from "./app";
import { bootstrapServices }     from "./container/bootstrap";
import { expandPlatform }        from "./services/expansionEngine";
import { finalizeConfiguration } from "./services/systemConfigurator";

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
  //   1. expandPlatform()       — 13 paths × 5 iterations, populates registry, persists run to DB
  //   2. finalizeConfiguration() — self-heal, verify, lock, persist to organizations table
  void (async () => {
    await expandPlatform();
    await finalizeConfiguration();
  })();
});
