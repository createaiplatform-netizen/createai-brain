/**
 * domainComplete.ts — Master Domain Completion Status
 *
 * GET /api/domains/status       — all 25 domain-equivalent areas + completion
 * GET /api/domains/:id/stats    — individual domain engine stats
 * GET /api/domains/gaps         — any remaining gaps
 * GET /api/domains/coverage     — worldwide coverage summary
 *
 * Also exposes secondary domain engines not in individual route files:
 * - Value Exchange (banking-equivalent)
 * - Risk Coverage (insurance-equivalent)
 * - Property Flow (real estate-equivalent)
 * - Workforce Pipeline (talent acquisition-equivalent)
 * - Performance Review (performance management-equivalent)
 * - Campaign Intelligence (marketing automation-equivalent)
 * - Regulatory Map (compliance-equivalent)
 * - Fiscal Intelligence (FP&A-equivalent)
 * - Recurring Revenue (subscription billing-equivalent)
 */

import { Router, type Request, type Response } from "express";
import {
  getAllDomainStatuses,
  valueExchange,
  riskCoverage,
  propertyFlow,
  workforcePipeline,
  performanceReview,
  campaignIntelligence,
  regulatoryMap,
  fiscalIntelligence,
  recurringRevenue,
} from "../services/domainEngines.js";

const router = Router();

// ─── Master Domain Status ─────────────────────────────────────────────────────

router.get("/status", (_req: Request, res: Response) => {
  const domains = getAllDomainStatuses();
  const complete = domains.filter(d => d.status === "complete").length;
  const totalEndpoints = domains.reduce((s, d) => s + d.endpointCount, 0);

  res.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    coverage: {
      totalDomains:        domains.length,
      completeDomains:     complete,
      completionRate:      Math.round((complete / domains.length) * 100),
      totalEndpoints,
      worldwideCoverage:   complete >= domains.length ? "100%" : `${Math.round((complete / domains.length) * 100)}%`,
      gaps:                domains.filter(d => d.status !== "complete").length,
      status:              complete >= domains.length ? "COMPLETE — No gaps" : "IN PROGRESS",
    },
    domains,
  });
});

router.get("/gaps", (_req: Request, res: Response) => {
  const domains = getAllDomainStatuses();
  const gaps = domains.filter(d => d.status !== "complete");
  res.json({
    ok: true,
    gapCount: gaps.length,
    gaps,
    message: gaps.length === 0
      ? "All 25 industry-equivalent domains are complete. No gaps detected."
      : `${gaps.length} domain(s) require attention.`,
  });
});

router.get("/coverage", (_req: Request, res: Response) => {
  const domains = getAllDomainStatuses();
  const complete = domains.filter(d => d.status === "complete").length;

  res.json({
    ok: true,
    worldwideDomainCoverage: {
      financial:   ["Value Exchange", "Transaction Ledger", "Fiscal Intelligence", "Recurring Revenue", "Order Flow"],
      operations:  ["Asset Flow", "Order Flow", "Case Resolution", "Content Pipeline", "Agreement Flow"],
      intelligence:["Insight Engine", "Engagement Map", "Campaign Intelligence", "Contact Intelligence", "Performance Review"],
      workforce:   ["Workforce Pipeline", "Growth Path", "Performance Review", "StaffingOS"],
      risk:        ["Risk Coverage", "Regulatory Map", "Agreement Flow"],
      industry:    ["HealthOS", "LegalPM", "StaffingOS", "Real Market Engine", "Semantic Store", "Advertising Hub"],
      protocol:    ["NPA Identity", "Handle Protocol", "Self-Host Engine", "TOTP Engine", "Health Monitor"],
    },
    summary: {
      totalDomains: domains.length,
      complete,
      partial: domains.filter(d => d.status === "partial").length,
      completionRate: `${Math.round((complete / domains.length) * 100)}%`,
      industryEquivalents: domains.map(d => d.industryEquivalent),
    },
  });
});

// ─── Individual domain engine stats (secondary domains) ──────────────────────

// Aggregate index routes — fronted fetch() calls these root paths
router.get("/value-exchange",              (_req, res) => res.json({ ok: true, ...valueExchange.stats(), balances: valueExchange.balances() }));
router.get("/risk-coverage",               (_req, res) => res.json({ ok: true, ...riskCoverage.stats() }));
router.get("/property-flow",               (_req, res) => res.json({ ok: true, ...propertyFlow.stats() }));
router.get("/workforce-pipeline",          (_req, res) => res.json({ ok: true, ...workforcePipeline.stats(), candidates: [] }));
router.get("/perf-review",                 (_req, res) => res.json({ ok: true, ...performanceReview.stats(), reviews: [] }));
router.get("/campaign-intelligence",       (_req, res) => res.json({ ok: true, ...campaignIntelligence.stats(), campaigns: [] }));
router.get("/regulatory-map",              (_req, res) => res.json({ ok: true, ...regulatoryMap.stats(), regulations: regulatoryMap.list() }));
router.get("/fiscal-intelligence",         (_req, res) => res.json({ ok: true, ...fiscalIntelligence.stats() }));
router.get("/recurring-revenue",           (_req, res) => res.json({ ok: true, ...recurringRevenue.stats(), plans: recurringRevenue.plans(), mrr: recurringRevenue.mrr(), arr: recurringRevenue.arr() }));

router.get("/value-exchange/stats",        (_req, res) => res.json({ ok: true, ...valueExchange.stats() }));
router.get("/value-exchange/balances",     (_req, res) => res.json({ ok: true, balances: valueExchange.balances() }));
router.post("/value-exchange/transfer",    (req: Request, res: Response) => {
  const { from, to, amount, memo, currency } = req.body as { from: string; to: string; amount: number; memo: string; currency?: string };
  if (!from || !to || !amount) { res.status(400).json({ error: "from, to, amount required" }); return; }
  res.status(201).json({ ok: true, transfer: valueExchange.transfer(from, to, amount, memo ?? "", currency) });
});

router.get("/risk-coverage/stats",         (_req, res) => res.json({ ok: true, ...riskCoverage.stats() }));
router.post("/risk-coverage/assess",       (req: Request, res: Response) => {
  const { entityId, entityType, factors } = req.body as { entityId: string; entityType: string; factors: string[] };
  if (!entityId) { res.status(400).json({ error: "entityId required" }); return; }
  res.status(201).json({ ok: true, assessment: riskCoverage.assess(entityId, entityType ?? "entity", factors ?? []) });
});

router.get("/property-flow/stats",         (_req, res) => res.json({ ok: true, ...propertyFlow.stats() }));
router.post("/property-flow",              (req: Request, res: Response) => res.status(201).json({ ok: true, property: propertyFlow.list(req.body ?? {}) }));

router.get("/workforce-pipeline/stats",    (_req, res) => res.json({ ok: true, ...workforcePipeline.stats() }));
router.post("/workforce-pipeline",         (req: Request, res: Response) => res.status(201).json({ ok: true, candidate: workforcePipeline.add(req.body ?? {}) }));

router.get("/performance-review/stats",    (_req, res) => res.json({ ok: true, ...performanceReview.stats() }));

router.get("/campaign-intelligence/stats", (_req, res) => res.json({ ok: true, ...campaignIntelligence.stats() }));
router.post("/campaign-intelligence",      (req: Request, res: Response) => res.status(201).json({ ok: true, campaign: campaignIntelligence.create(req.body ?? {}) }));

router.get("/regulatory-map/stats",        (_req, res) => res.json({ ok: true, ...regulatoryMap.stats() }));
router.get("/regulatory-map/list",         (_req, res) => res.json({ ok: true, regulations: regulatoryMap.list() }));

router.get("/fiscal-intelligence/stats",   (_req, res) => res.json({ ok: true, ...fiscalIntelligence.stats() }));

router.get("/recurring-revenue/stats",     (_req, res) => res.json({ ok: true, ...recurringRevenue.stats() }));
router.get("/recurring-revenue/plans",     (_req, res) => res.json({ ok: true, plans: recurringRevenue.plans() }));
router.get("/recurring-revenue/mrr",       (_req, res) => res.json({ ok: true, mrr: recurringRevenue.mrr(), arr: recurringRevenue.arr() }));
router.post("/recurring-revenue/subscribe",(req: Request, res: Response) => {
  const { customerId, planName, cycle } = req.body as { customerId: string; planName: string; cycle?: "monthly" | "quarterly" | "annual" };
  if (!customerId || !planName) { res.status(400).json({ error: "customerId and planName required" }); return; }
  res.status(201).json({ ok: true, subscription: recurringRevenue.subscribe(customerId, planName, cycle) });
});

export default router;
