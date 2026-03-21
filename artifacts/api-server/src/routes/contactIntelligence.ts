import { Router, type Request, type Response } from "express";
import { contactIntelligence } from "../services/domainEngines.js";

const router = Router();

router.get("/stats",    (_req, res) => res.json(contactIntelligence.stats()));
router.get("/list",     (_req, res) => res.json({ ok: true, contacts: contactIntelligence.list() }));
router.get("/pipeline", (_req, res) => res.json({ ok: true, pipeline: contactIntelligence.pipeline() }));

router.post("/", (req: Request, res: Response) => {
  const contact = contactIntelligence.add(req.body ?? {});
  res.status(201).json({ ok: true, contact });
});

export default router;
