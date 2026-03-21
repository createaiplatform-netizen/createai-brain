import { Router, type Request, type Response } from "express";
import { contentPipeline } from "../services/domainEngines.js";

const router = Router();

router.get("/",         (_req, res) => res.json({ ok: true, ...contentPipeline.stats(), items: contentPipeline.calendar() }));
router.get("/stats",    (_req, res) => res.json(contentPipeline.stats()));
router.get("/calendar", (_req, res) => res.json({ ok: true, calendar: contentPipeline.calendar() }));
router.get("/list",     (_req, res) => res.json({ ok: true, content: contentPipeline.calendar() }));
router.get("/by-type",  (_req, res) => res.json({ ok: true, byType: contentPipeline.byType() }));

router.post("/", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, item: contentPipeline.create(req.body ?? {}) });
});

router.patch("/:id/publish", (req: Request, res: Response) => {
  const ok = contentPipeline.publish(String(req.params["id"] ?? ""));
  res.json({ ok, message: ok ? "Published" : "Not found" });
});

export default router;
