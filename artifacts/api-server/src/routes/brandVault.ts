import { Router, type Request, type Response } from "express";
import { brandVault } from "../services/domainEngines2.js";

const router = Router();

router.get("/",           (_req, res) => res.json({ ok: true, ...brandVault.stats(), assets: brandVault.assets(), guidelines: brandVault.guidelines() }));
router.get("/stats",      (_req, res) => res.json({ ok: true, ...brandVault.stats() }));
router.get("/assets",     (req: Request, res: Response) => res.json({ ok: true, assets: brandVault.assets(String(req.query["type"] ?? "")) }));
router.get("/guidelines", (req: Request, res: Response) => res.json({ ok: true, guidelines: brandVault.guidelines(String(req.query["section"] ?? "")) }));

router.post("/asset", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, asset: brandVault.addAsset(req.body ?? {}) });
});

router.post("/guideline", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, guideline: brandVault.addGuideline(req.body ?? {}) });
});

router.post("/:id/use", (req: Request, res: Response) => {
  const ok = brandVault.recordUsage(String(req.params["id"] ?? ""));
  res.json({ ok });
});

export default router;
