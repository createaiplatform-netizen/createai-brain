/**
 * nodesService — Unified platform node registry.
 * Combines ElectricNetWay grid nodes and MeshNetWay internet nodes
 * into a single schema for GlobalPulse and alert orchestration.
 */

import { getElectricNodes } from "./electricNetWay.js";
import { getMeshNodes }     from "./meshNetWay.js";
import { rawSql }           from "@workspace/db";

export interface PlatformNode {
  id:       string;
  name:     string;
  type:     "electric" | "mesh" | "sandbox";
  status:   string;
  location: string;
  devices:  PlatformDevice[];
}

export interface PlatformDevice {
  id:       string;
  userId:   string;
  endpoint: string;
}

const SANDBOX_NODE_ID = "TEST_NODE";

/** Returns all platform nodes — electric + mesh + sandbox — each with their push device list. */
export async function getAllNodes(): Promise<PlatformNode[]> {
  const [electric, mesh, rawSubs] = await Promise.all([
    getElectricNodes(),
    getMeshNodes(),
    rawSql`SELECT id, user_id, endpoint FROM platform_push_subscriptions`
      as Promise<Array<Record<string, string>>>,
  ]);

  const devices: PlatformDevice[] = (rawSubs as Array<Record<string, string>>).map(s => ({
    id:       String(s["id"]),
    userId:   String(s["user_id"]),
    endpoint: (String(s["endpoint"])).slice(0, 60) + "…",
  }));

  const nodes: PlatformNode[] = [
    // Sandbox node always first
    {
      id:       SANDBOX_NODE_ID,
      name:     "Sandbox Test Node",
      type:     "sandbox",
      status:   "active",
      location: "virtual",
      devices,
    },
    ...electric.map(n => ({
      id:       `electric:${n.id}`,
      name:     n.node_name,
      type:     "electric" as const,
      status:   n.status,
      location: n.location ?? "",
      devices,
    })),
    ...mesh.map(n => ({
      id:       `mesh:${n.id}`,
      name:     n.node_name,
      type:     "mesh" as const,
      status:   n.status,
      location: n.location ?? "",
      devices,
    })),
  ];

  return nodes;
}

export { getElectricNodes, getMeshNodes };
