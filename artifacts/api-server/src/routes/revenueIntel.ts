import { Router, type Request, type Response } from "express";
import { revenueIntel } from "../services/domainEngines2.js";

const router = Router();

router.get("/",        (_req, res) => res.json({ ok: true, ...revenueIntel.stats(), latest: revenueIntel.latestSnapshot(), cohorts: revenueIntel.cohorts() }));
router.get("/stats",   (_req, res) => res.json({ ok: true, ...revenueIntel.stats() }));
router.get("/latest",  (_req, res) => res.json({ ok: true, snapshot: revenueIntel.latestSnapshot() }));
router.get("/trend",   (req: Request, res: Response) => res.json({ ok: true, trend: revenueIntel.trend(Number(req.query["days"] ?? 30)) }));
router.get("/cohorts", (_req, res) => res.json({ ok: true, cohorts: revenueIntel.cohorts() }));

router.post("/snapshot", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, snapshot: revenueIntel.snapshot(req.body ?? {}) });
});

router.post("/cohort", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, cohort: revenueIntel.addCohort(req.body ?? {}) });
});

export default router;
