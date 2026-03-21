import { Router, type Request, type Response } from "express";
import { projectCommand } from "../services/domainEngines2.js";

const router = Router();

router.get("/",          (_req, res) => res.json({ ok: true, ...projectCommand.stats(), projects: projectCommand.list() }));
router.get("/stats",     (_req, res) => res.json({ ok: true, ...projectCommand.stats() }));
router.get("/list",      (_req, res) => res.json({ ok: true, projects: projectCommand.list() }));
router.get("/tasks",     (req: Request, res: Response) => res.json({ ok: true, tasks: projectCommand.tasks(String(req.query["projectId"] ?? "")) }));

router.post("/", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, project: projectCommand.create(req.body ?? {}) });
});

router.post("/task", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, task: projectCommand.addTask(req.body ?? {}) });
});

router.patch("/:id/status", (req: Request, res: Response) => {
  const { status } = req.body as { status: string };
  const ok = projectCommand.updateStatus(String(req.params["id"] ?? ""), status as any);
  res.json({ ok, message: ok ? `Updated to ${status}` : "Project not found" });
});

export default router;
