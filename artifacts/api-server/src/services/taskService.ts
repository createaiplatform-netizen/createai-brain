/**
 * taskService — Platform-wide task execution for GlobalPulse.
 * Maps task IDs 1–10 to named platform operations and queues them
 * as EverythingNetWay jobs, returning a structured result.
 */

import { queueJob } from "./everythingNetWay.js";

const TASK_REGISTRY: Record<number, { name: string; layer: string; description: string }> = {
  1:  { name: "Task A — Infrastructure Heartbeat",  layer: "ops",       description: "Verify all core services respond within threshold latency" },
  2:  { name: "Task B — Alert Propagation Check",   layer: "messaging",  description: "Confirm alert delivery pipeline is end-to-end operational" },
  3:  { name: "Task C — Queue Drain Verification",  layer: "ops",       description: "Ensure all pending queues are draining without stalls" },
  4:  { name: "Task D — Node Status Sync",          layer: "electric",   description: "Sync electric and mesh node status across the registry" },
  5:  { name: "Task E — Push Delivery Audit",       layer: "messaging",  description: "Audit push subscription health and remove stale endpoints" },
  6:  { name: "Task F — Mesh Latency Probe",        layer: "mesh",       description: "Measure round-trip latency across all active mesh nodes" },
  7:  { name: "Task G — Electric Grid Health",      layer: "electric",   description: "Validate electric node capacity and grid integrity" },
  8:  { name: "Task H — Semantic Index Refresh",    layer: "data",       description: "Rebuild the platform semantic index for search and routing" },
  9:  { name: "Task I — Activity Log Flush",        layer: "ops",       description: "Flush buffered activity log entries to persistent storage" },
  10: { name: "Task J — System Integrity Scan",     layer: "ops",       description: "Full integrity scan of platform tables and service registry" },
};

export interface TaskResult {
  taskId:      number;
  task:        string;
  layer:       string;
  description: string;
  jobId:       number;
  platformWide: boolean;
  status:      "queued";
  queuedAt:    string;
}

/** Queues a platform-wide task by numeric ID (1–10). */
export async function runPlatformTask(
  rawId:       string | number,
  opts:        { platformWide?: boolean } = {},
): Promise<TaskResult> {
  const taskId = parseInt(String(rawId), 10);
  if (isNaN(taskId) || taskId < 1 || taskId > 10) {
    throw new Error(`taskId must be 1–10, got: ${rawId}`);
  }

  const def        = TASK_REGISTRY[taskId]!;
  const queuedAt   = new Date().toISOString();
  const platformWide = opts.platformWide ?? false;

  const job = await queueJob({
    type:    "PLATFORM_TASK",
    layer:   def.layer,
    payload: { taskId, taskName: def.name, description: def.description, platformWide, queuedAt },
  });

  return {
    taskId,
    task:        def.name,
    layer:       def.layer,
    description: def.description,
    jobId:       job.id,
    platformWide,
    status:      "queued",
    queuedAt,
  };
}
