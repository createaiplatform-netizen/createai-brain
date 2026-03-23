// ==================================================
// Immediate GlobalPulse Trigger — Run Right Now
// ==================================================
import { getElectricNodes, getMeshNodes } from "./src/services/nodesService.js";
import { runAlertTestForNode }             from "./src/services/alertTestService.js";
import { runPlatformTask }                 from "./src/services/taskService.js";
import { saveGlobalAlertLog }              from "./src/services/globalAlertLogService.js";

async function runImmediateGlobalPulse() {
  try {
    console.log("🟢 Fetching all nodes...");

    const electricNodes = await getElectricNodes();
    const meshNodes     = await getMeshNodes();
    const nodes         = [...electricNodes, ...meshNodes];

    console.log(`🟢 Total nodes fetched: ${nodes.length}`);

    console.log("🛎 Sending alerts to all nodes...");
    for (const node of nodes) {
      await runAlertTestForNode(String(node.id), {
        title:    "🔥 Immediate GlobalPulse Alert",
        message:  "This is a live platform-wide test firing now!",
        priority: "high",
        actions:  ["open_app", "view_dashboard"],
      }, true);
    }
    console.log(`✅ Alerts sent to all nodes.`);

    console.log("📊 Running all 10 platform-wide tasks...");
    for (let i = 1; i <= 10; i++) {
      await runPlatformTask(i.toString(), { platformWide: true });
    }
    console.log(`✅ All tasks A–J queued and executed.`);

    console.log("💾 Persisting full pulse report...");
    await saveGlobalAlertLog({ timestamp: new Date().toISOString(), nodeCount: nodes.length });
    console.log("🎉 GlobalPulse complete. All devices should have received alerts!");
  } catch (err) {
    console.error("❌ Error during immediate GlobalPulse:", err);
  }
}

// Run immediately when executed
const { fileURLToPath } = await import("url");
const { resolve }       = await import("path");
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  runImmediateGlobalPulse();
}
