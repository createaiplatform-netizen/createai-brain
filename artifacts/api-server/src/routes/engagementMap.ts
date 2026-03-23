import { Router, type Request, type Response } from "express";
import { engagementMap, type TouchpointType } from "../services/domainEngines.js";

const router = Router();

router.get("/",                (_req, res) => res.json({ ok: true, ...engagementMap.stats(), events: (engagementMap as unknown as Record<string, (...a: unknown[]) => unknown>)["events"]?.() ?? [], funnelStats: engagementMap.funnelView() }));
router.get("/stats",           (_req, res) => res.json(engagementMap.stats()));
router.get("/funnel",          (_req, res) => res.json({ ok: true, funnel: engagementMap.funnelView() }));
router.get("/journey/:contactId", (req: Request, res: Response) => res.json({ ok: true, journey: engagementMap.journey(String(req.params["contactId"] ?? "")) }));

router.post("/event", (req: Request, res: Response) => {
  const { contactId, touchpoint, channel, content, converted } = req.body as { contactId: string; touchpoint: TouchpointType; channel: string; content: string; converted?: boolean };
  if (!contactId || !touchpoint || !channel) { res.status(400).json({ error: "contactId, touchpoint, channel required" }); return; }
  res.status(201).json({ ok: true, event: engagementMap.log(contactId, touchpoint, channel, content ?? "", converted ?? false) });
});

export default router;
