/**
 * EverythingNetWay Engine — API Routes
 * Mounted under /api/everything-net-way
 * Admin/founder access only.
 */

import { Router, type Request, type Response } from "express";
import {
  processQueue,
  getFullStatus,
  getLogs,
  retryJob,
  queueJob,
  type ENWLayer,
} from "../services/everythingNetWay.js";

const router = Router();

function isAdmin(req: Request): boolean {
  if (!req.user) return false;
  const role = (req.user as { role?: string }).role ?? "user";
  return ["admin", "founder"].includes(role);
}

// ── GET /api/everything-net-way/status ───────────────────────────────────────

router.get("/status", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const status = await getFullStatus();
    res.json({ ok: true, ...status });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── GET /api/everything-net-way/logs ─────────────────────────────────────────

router.get("/logs", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const limit  = Math.min(Number(req.query["limit"]  ?? 50), 200);
    const offset = Number(req.query["offset"] ?? 0);
    const logs   = await getLogs(limit, offset);
    res.json({ ok: true, logs });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── POST /api/everything-net-way/trigger ─────────────────────────────────────

router.post("/trigger", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const result = await processQueue();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── POST /api/everything-net-way/retry/:id ───────────────────────────────────

router.post("/retry/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    await retryJob(Number(String(req.params["id"])));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── POST /api/everything-net-way/queue-job ───────────────────────────────────

router.post("/queue-job", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { type, layer, payload } = req.body as {
      type: string; layer: ENWLayer; payload?: Record<string, unknown>;
    };
    if (!type || !layer) {
      res.status(400).json({ ok: false, error: "type and layer are required" });
      return;
    }
    const job = await queueJob({ type, layer, payload });
    res.json({ ok: true, job });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
