import { Router, type Request, type Response } from "express";
import { orderFlow } from "../services/domainEngines.js";

const router = Router();

router.get("/",         (_req, res) => res.json({ ok: true, ...orderFlow.stats(), orders: orderFlow.list() }));
router.get("/stats",    (_req, res) => res.json(orderFlow.stats()));
router.get("/list",     (_req, res) => res.json({ ok: true, orders: orderFlow.list() }));
router.get("/by-status",(_req, res) => res.json({ ok: true, byStatus: orderFlow.byStatus() }));

router.post("/", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, order: orderFlow.create(req.body ?? {}) });
});

router.patch("/:id/status", (req: Request, res: Response) => {
  const { status } = req.body as { status: string };
  const ok = orderFlow.updateStatus(String(req.params["id"] ?? ""), status);
  res.json({ ok, message: ok ? `Updated to ${status}` : "Order not found" });
});

export default router;
