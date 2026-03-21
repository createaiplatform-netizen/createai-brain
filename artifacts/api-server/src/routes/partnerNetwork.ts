import { Router, type Request, type Response } from "express";
import { partnerNetwork } from "../services/domainEngines2.js";

const router = Router();

router.get("/",           (_req, res) => res.json({ ok: true, ...partnerNetwork.stats(), partners: partnerNetwork.list() }));
router.get("/stats",      (_req, res) => res.json({ ok: true, ...partnerNetwork.stats() }));
router.get("/list",       (_req, res) => res.json({ ok: true, partners: partnerNetwork.list() }));
router.get("/leaderboard",(_req, res) => res.json({ ok: true, leaderboard: partnerNetwork.leaderboard() }));
router.get("/referrals",  (req: Request, res: Response) => res.json({ ok: true, referrals: partnerNetwork.referrals(String(req.query["partnerId"] ?? "")) }));

router.post("/enroll", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, partner: partnerNetwork.enroll(req.body ?? {}) });
});

router.post("/referral", (req: Request, res: Response) => {
  const { partnerId, leadName, leadEmail, dealValue } = req.body as { partnerId: string; leadName: string; leadEmail: string; dealValue: number };
  if (!partnerId || !leadName || !leadEmail) { res.status(400).json({ error: "partnerId, leadName, leadEmail required" }); return; }
  res.status(201).json({ ok: true, referral: partnerNetwork.logReferral(partnerId, leadName, leadEmail, dealValue ?? 0) });
});

router.post("/convert", (req: Request, res: Response) => {
  const { referralId } = req.body as { referralId: string };
  const ok = partnerNetwork.convertReferral(referralId ?? "");
  res.json({ ok, message: ok ? "Referral converted to won" : "Referral not found" });
});

export default router;
