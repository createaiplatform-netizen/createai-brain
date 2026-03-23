/**
 * ElectricNetWay Engine — API Routes
 * Mounted under /api/electric-net-way
 * Admin/founder access only.
 */

import { Router, type Request, type Response } from "express";
import {
  processQueue,
  getStatus,
  getLogs,
  retryJob,
  queueNetJob,
  type NetJobCategory,
} from "../services/electricNetWay.js";

const router = Router();

function isAdmin(req: Request): boolean {
  if (!req.user) return false;
  const role = (req.user as { role?: string }).role ?? "user";
  return ["admin", "founder"].includes(role);
}

// ── GET /api/electric-net-way/status ─────────────────────────────────────────

router.get("/status", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const stats = await getStatus();
    res.json({ ok: true, stats });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── GET /api/electric-net-way/logs ───────────────────────────────────────────

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

// ── POST /api/electric-net-way/trigger ───────────────────────────────────────

router.post("/trigger", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const result = await processQueue();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── POST /api/electric-net-way/retry/:id ─────────────────────────────────────

router.post("/retry/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    await retryJob(Number(String(req.params["id"])));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── POST /api/electric-net-way/queue-job ─────────────────────────────────────

router.post("/queue-job", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { category, type, target, payload } = req.body as {
      category: NetJobCategory; type: string; target: string;
      payload?: Record<string, unknown>;
    };
    if (!category || !type || !target) {
      res.status(400).json({ ok: false, error: "category, type, and target are required" });
      return;
    }
    const job = await queueNetJob({ category, type, target, payload });
    res.json({ ok: true, job });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
