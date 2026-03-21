import { Router, type Request, type Response } from "express";
import { assetFlow } from "../services/domainEngines.js";

const router = Router();

router.get("/stats",    (_req, res) => res.json(assetFlow.stats()));
router.get("/reorder",  (_req, res) => res.json({ ok: true, reorderQueue: assetFlow.reorderQueue() }));

router.post("/register", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, asset: assetFlow.register(req.body ?? {}) });
});

router.patch("/adjust", (req: Request, res: Response) => {
  const { sku, delta } = req.body as { sku: string; delta: number };
  if (!sku || delta === undefined) { res.status(400).json({ error: "sku and delta required" }); return; }
  res.json({ ok: assetFlow.adjust(sku, delta) });
});

export default router;
