import { Router, type Request, type Response } from "express";
import { agreementFlow } from "../services/domainEngines.js";

const router = Router();

router.get("/stats",  (_req, res) => res.json(agreementFlow.stats()));
router.get("/list",   (req: Request, res: Response) => res.json({ ok: true, agreements: agreementFlow.list(String(req.query["status"] ?? "")) }));
router.get("/active", (_req, res) => res.json({ ok: true, agreements: agreementFlow.list("active") }));

router.post("/", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, agreement: agreementFlow.create(req.body ?? {}) });
});

router.patch("/:id/advance", (req: Request, res: Response) => {
  const { status } = req.body as { status: string };
  const ok = agreementFlow.advance(String(req.params["id"] ?? ""), status as any);
  res.json({ ok, message: ok ? `Advanced to ${status}` : "Not found" });
});

export default router;
