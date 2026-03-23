import { Router, type Request, type Response } from "express";
import { transactionLedger } from "../services/domainEngines.js";

const router = Router();

router.get("/",             (_req, res) => res.json({ ok: true, ...transactionLedger.stats(), entries: (transactionLedger as unknown as Record<string, () => unknown[]>)["list"]?.() ?? [], ...transactionLedger.cashFlow() }));
router.get("/stats",         (_req, res) => res.json(transactionLedger.stats()));
router.get("/balance-sheet", (_req, res) => res.json({ ok: true, balanceSheet: transactionLedger.balanceSheet() }));
router.get("/trial-balance", (_req, res) => res.json({ ok: true, ...transactionLedger.trialBalance() }));
router.get("/cash-flow",     (_req, res) => res.json({ ok: true, ...transactionLedger.cashFlow() }));

router.post("/entry", (req: Request, res: Response) => {
  const { type, account, amount, memo, category } = req.body as { type: "credit" | "debit"; account: string; amount: number; memo: string; category: string };
  if (!type || !account || !amount) { res.status(400).json({ error: "type, account, amount required" }); return; }
  res.status(201).json({ ok: true, entry: transactionLedger.post(type, account, amount, memo ?? "", category ?? "general") });
});

export default router;
