import app from "./app";
import { expandPlatform } from "./services/expansionEngine";

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

  // Run boot expansion in background — pre-populates the registry with
  // all 13 expansion layers applied to the CreateAI Brain platform idea.
  // Non-blocking: server is fully live before the expansion completes.
  void expandPlatform();
});
