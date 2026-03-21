import { Router, type Request, type Response } from "express";
import { supplyChain } from "../services/domainEngines2.js";

const router = Router();

router.get("/",          (_req, res) => res.json({ ok: true, ...supplyChain.stats(), vendors: supplyChain.vendors(), purchaseOrders: supplyChain.purchaseOrders() }));
router.get("/stats",     (_req, res) => res.json({ ok: true, ...supplyChain.stats() }));
router.get("/vendors",   (_req, res) => res.json({ ok: true, vendors: supplyChain.vendors() }));
router.get("/pos",       (req: Request, res: Response) => res.json({ ok: true, purchaseOrders: supplyChain.purchaseOrders(String(req.query["vendorId"] ?? "")) }));

router.post("/vendor", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, vendor: supplyChain.addVendor(req.body ?? {}) });
});

router.post("/po", (req: Request, res: Response) => {
  const { vendorId, lineItems, expectedDate } = req.body as { vendorId: string; lineItems: any[]; expectedDate: string };
  if (!vendorId || !lineItems?.length) { res.status(400).json({ error: "vendorId and lineItems required" }); return; }
  res.status(201).json({ ok: true, po: supplyChain.createPO(vendorId, lineItems, expectedDate ?? "") });
});

router.patch("/:id/status", (req: Request, res: Response) => {
  const { status } = req.body as { status: string };
  const ok = supplyChain.updatePOStatus(String(req.params["id"] ?? ""), status as any);
  res.json({ ok, message: ok ? `PO updated to ${status}` : "PO not found" });
});

export default router;
