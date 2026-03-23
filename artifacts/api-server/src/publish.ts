/**
 * publish.ts — Platform publish + GlobalPulse trigger
 *
 * Run after deploying a new version to notify all nodes,
 * queue platform tasks, and persist the run report.
 *
 * Usage:
 *   BASE_URL=http://localhost:8080 npx tsx src/publish.ts
 */

import { runGlobalPulse } from "./runGlobalPulse.js";

async function deployNewVersion(): Promise<void> {
  // Replit handles the actual deployment process.
  // Add any post-deploy steps here (cache busting, CDN purge, etc.)
  console.log("Deploy step complete — platform is live.");
}

async function publishPlatform() {
  try {
    // --- your existing publish logic ---
    await deployNewVersion();

    // --- trigger GlobalPulse immediately after publish ---
    console.log("Publishing complete — triggering full GlobalPulse alert...");
    await runGlobalPulse();
    console.log("GlobalPulse alert complete. All nodes notified, tasks queued, report persisted.");
  } catch (err) {
    console.error("Publish or GlobalPulse failed:", err);
  }
}

publishPlatform();
