/**
 * MeshNetWay Engine — Service Layer
 * Internal mesh/internet node registry and bandwidth tracking.
 */

import { rawSql } from "@workspace/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MeshNode {
  id:             number;
  node_name:      string;
  location:       string;
  bandwidth_mbps: number;
  status:         string;
  last_update:    string;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initMeshNetWay(): Promise<void> {
  await rawSql`
    CREATE TABLE IF NOT EXISTS platform_mesh_nodes (
      id             SERIAL PRIMARY KEY,
      node_name      TEXT    NOT NULL,
      location       TEXT    NOT NULL DEFAULT '',
      bandwidth_mbps FLOAT   NOT NULL DEFAULT 0,
      status         TEXT    NOT NULL DEFAULT 'inactive',
      last_update    TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("[MeshNetWay] Mesh nodes table ready.");
}

// ─── Nodes ────────────────────────────────────────────────────────────────────

export async function getMeshNodes(): Promise<MeshNode[]> {
  const rows = (await rawSql`
    SELECT * FROM platform_mesh_nodes ORDER BY last_update DESC
  `) as Array<Record<string, unknown>>;
  return rows as unknown as MeshNode[];
}

export async function addMeshNode(node: {
  node_name: string; location?: string; bandwidth_mbps?: number;
}): Promise<MeshNode> {
  const rows = (await rawSql`
    INSERT INTO platform_mesh_nodes (node_name, location, bandwidth_mbps)
    VALUES (${node.node_name}, ${node.location ?? ""}, ${node.bandwidth_mbps ?? 0})
    RETURNING *
  `) as Array<Record<string, unknown>>;
  return rows[0] as unknown as MeshNode;
}

export async function updateMeshNodeStatus(id: number, status: string): Promise<void> {
  await rawSql`
    UPDATE platform_mesh_nodes
    SET status = ${status}, last_update = NOW()
    WHERE id = ${id}
  `;
}

export async function getMeshStats(): Promise<{
  total: number; active: number; totalBandwidthMbps: number;
}> {
  const rows = (await rawSql`
    SELECT
      COUNT(*)::int                                          AS total,
      COUNT(*) FILTER (WHERE status = 'active')::int        AS active,
      COALESCE(SUM(bandwidth_mbps), 0)::float               AS total_bandwidth_mbps
    FROM platform_mesh_nodes
  `) as Array<Record<string, string>>;
  const r = rows[0];
  return {
    total:              Number(r?.total ?? 0),
    active:             Number(r?.active ?? 0),
    totalBandwidthMbps: Number(r?.total_bandwidth_mbps ?? 0),
  };
}
