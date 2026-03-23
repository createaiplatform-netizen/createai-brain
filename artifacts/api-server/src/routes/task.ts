/**
 * taskRouter — Platform-wide task execution
 * Mounted at /api/task
 *
 * POST /api/task/:id — queue a platform-wide task by ID (1–10) with retry contract
 *
 * The MAX_RETRIES retry loop is implemented on the client (GlobalPulse).
 * Each call here is a single atomic queue operation that returns immediately.
 */

import { Router, type Request, type Response } from "express";
import { runPlatformTask } from "../services/taskService.js";

const router = Router();

function isAdmin(req: Request): boolean {
  if (!req.user) return false;
  const role = (req.user as { role?: string }).role ?? "user";
  return ["admin", "founder"].includes(role);
}

// ── POST /api/task/:id ────────────────────────────────────────────────────────

router.post("/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  const taskId = req.params["id"];
  if (!taskId) { res.status(400).json({ error: "Missing task id" }); return; }

  const { platformWide } = req.body as { platformWide?: boolean };

  try {
    const result = await runPlatformTask(taskId, { platformWide: platformWide ?? true });
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
