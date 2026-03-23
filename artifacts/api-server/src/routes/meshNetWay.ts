/**
 * MeshNetWay Engine — API Routes
 * Mounted under /api/mesh-net-way
 * Admin/founder access only.
 */

import { Router, type Request, type Response } from "express";
import {
  getMeshNodes,
  addMeshNode,
  updateMeshNodeStatus,
  getMeshStats,
} from "../services/meshNetWay.js";

const router = Router();

function isAdmin(req: Request): boolean {
  if (!req.user) return false;
  const role = (req.user as { role?: string }).role ?? "user";
  return ["admin", "founder"].includes(role);
}

// ── GET /api/mesh-net-way/status ─────────────────────────────────────────────

router.get("/status", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const [nodes, stats] = await Promise.all([getMeshNodes(), getMeshStats()]);
    res.json({ ok: true, nodes, stats });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── POST /api/mesh-net-way/nodes ─────────────────────────────────────────────

router.post("/nodes", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { node_name, location, bandwidth_mbps } = req.body as {
      node_name: string; location?: string; bandwidth_mbps?: number;
    };
    if (!node_name) {
      res.status(400).json({ ok: false, error: "node_name is required" });
      return;
    }
    const node = await addMeshNode({ node_name, location, bandwidth_mbps });
    res.json({ ok: true, node });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── PATCH /api/mesh-net-way/nodes/:id/status ─────────────────────────────────

router.patch("/nodes/:id/status", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const id     = Number(String(req.params["id"]));
    const status = String((req.body as { status?: string }).status ?? "inactive");
    await updateMeshNodeStatus(id, status);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
