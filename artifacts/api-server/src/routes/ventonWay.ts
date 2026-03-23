/**
 * VentonWay Messaging Engine — API Routes
 * Mounted under /api/venton-way
 * Admin/founder access only (except nothing is exposed publicly)
 */

import { Router, type Request, type Response } from "express";
import {
  getVentonWayStatus,
  getVentonWayLogs,
  processQueue,
  retryMessage,
  queueMessage,
} from "../services/ventonWay.js";

const router = Router();

function isAdmin(req: Request): boolean {
  if (!req.user) return false;
  const role = (req.user as { role?: string }).role ?? "user";
  return ["admin", "founder"].includes(role);
}

// ── GET /api/venton-way/status ────────────────────────────────────────────────
router.get("/status", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const status = await getVentonWayStatus();
    res.json({ ok: true, ...status });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── GET /api/venton-way/logs ──────────────────────────────────────────────────
router.get("/logs", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const limit  = Math.min(parseInt(String(req.query["limit"]  ?? "50")),  200);
    const offset = parseInt(String(req.query["offset"] ?? "0"));
    const logs = await getVentonWayLogs(limit, offset);
    res.json({ ok: true, logs, count: logs.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── POST /api/venton-way/trigger ──────────────────────────────────────────────
router.post("/trigger", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const result = await processQueue();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── POST /api/venton-way/retry/:id ───────────────────────────────────────────
router.post("/retry/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const id = parseInt(req.params["id"] ?? "0");
    if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
    await retryMessage(id);
    res.json({ ok: true, message: "Message queued for retry" });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── POST /api/venton-way/send-test ───────────────────────────────────────────
router.post("/send-test", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { type = "email", recipient, subject, body } = req.body as {
      type?: "email" | "sms";
      recipient?: string;
      subject?: string;
      body?: string;
    };
    if (!recipient || !body) {
      res.status(400).json({ error: "recipient and body are required" });
      return;
    }
    const queued = await queueMessage({ type, recipient, subject, body, metadata: { source: "test" } });
    const result = await processQueue();
    res.json({ ok: true, queued, processed: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
