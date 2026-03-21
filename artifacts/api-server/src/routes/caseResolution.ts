import { Router, type Request, type Response } from "express";
import { caseResolution } from "../services/domainEngines.js";

const router = Router();

router.get("/stats",    (_req, res) => res.json(caseResolution.stats()));
router.get("/list",     (req: Request, res: Response) => res.json({ ok: true, cases: caseResolution.list(String(req.query["status"] ?? "")) || caseResolution.list() }));
router.get("/sla",      (_req, res) => res.json({ ok: true, ...caseResolution.slaStatus() }));

router.post("/", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, case: caseResolution.create(req.body ?? {}) });
});

router.patch("/:id/resolve", (req: Request, res: Response) => {
  const ok = caseResolution.resolve(String(req.params["id"] ?? ""));
  res.json({ ok, message: ok ? "Case resolved" : "Case not found" });
});

export default router;
