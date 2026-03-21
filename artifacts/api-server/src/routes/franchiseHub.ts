import { Router, type Request, type Response } from "express";
import { franchiseHub } from "../services/domainEngines2.js";

const router = Router();

router.get("/",      (_req, res) => res.json({ ok: true, ...franchiseHub.stats(), locations: franchiseHub.list() }));
router.get("/stats", (_req, res) => res.json({ ok: true, ...franchiseHub.stats() }));
router.get("/list",  (req: Request, res: Response) => res.json({ ok: true, locations: franchiseHub.list(String(req.query["status"] ?? "")) }));

router.post("/location", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, location: franchiseHub.addLocation(req.body ?? {}) });
});

router.post("/revenue", (req: Request, res: Response) => {
  const { locationId, monthlyRevenue } = req.body as { locationId: string; monthlyRevenue: number };
  const ok = franchiseHub.reportRevenue(locationId ?? "", monthlyRevenue ?? 0);
  res.json({ ok, message: ok ? "Revenue reported" : "Location not found" });
});

router.post("/compliance", (req: Request, res: Response) => {
  const { locationId, score } = req.body as { locationId: string; score: number };
  const ok = franchiseHub.updateCompliance(locationId ?? "", score ?? 0);
  res.json({ ok, message: ok ? `Compliance score updated to ${score}` : "Location not found" });
});

export default router;
