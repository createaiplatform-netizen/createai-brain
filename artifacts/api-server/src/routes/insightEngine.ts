import { Router, type Request, type Response } from "express";
import { insightEngine } from "../services/domainEngines.js";

const router = Router();

router.get("/stats",     (_req, res) => res.json(insightEngine.stats()));
router.get("/dashboard", (_req, res) => res.json({ ok: true, ...insightEngine.dashboard() }));
router.get("/kpis",      (_req, res) => res.json({ ok: true, kpis: insightEngine.dashboard().kpis }));

router.post("/kpi", (req: Request, res: Response) => {
  const { name, value, target, unit, category, trend } = req.body as { name: string; value: number; target: number; unit: string; category: string; trend?: "up" | "down" | "flat" };
  if (!name || value === undefined || target === undefined) { res.status(400).json({ error: "name, value, target required" }); return; }
  res.status(201).json({ ok: true, kpi: insightEngine.setKPI(name, value, target, unit ?? "", category ?? "General", trend) });
});

export default router;
