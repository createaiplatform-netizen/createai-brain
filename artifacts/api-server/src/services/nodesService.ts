/**
 * nodesService — Unified platform node registry.
 * Combines ElectricNetWay grid nodes and MeshNetWay internet nodes
 * into a single schema for GlobalPulse and alert orchestration.
 */

import { getElectricNodes as fetchElectricNodes } from "./electricNetWay.js";
import { getMeshNodes     as fetchMeshNodes }      from "./meshNetWay.js";
import { rawSql }                                  from "@workspace/db";

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

/** Returns all platform nodes — electric + mesh + sandbox — each with their push device list. */
export async function getAllNodes(): Promise<PlatformNode[]> {
  const [electric, mesh] = await Promise.all([
    fetchElectricNodes(),
    fetchMeshNodes(),
  ]);

  // Fetch push subs separately so `as` cast stays on its own line (esbuild requires it)
  const rawSubs = (await rawSql`
    SELECT id, user_id, endpoint FROM platform_push_subscriptions
  `) as Array<Record<string, string>>;

  const devices: PlatformDevice[] = rawSubs.map(s => ({
    id:       String(s["id"]),
    userId:   String(s["user_id"]),
    endpoint: String(s["endpoint"]).slice(0, 60) + "…",
  }));

  const nodes: PlatformNode[] = [
    // Sandbox node always first
    {
      id:       "TEST_NODE",
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

// Re-export the underlying getters so alertTest.ts can import from one place
export { fetchElectricNodes as getElectricNodes, fetchMeshNodes as getMeshNodes };
