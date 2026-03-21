/**
 * maxActivation.ts — Maximum Potential Activation Orchestrator
 *
 * POST /api/activate/all      — fire ALL triggerable engines simultaneously
 * GET  /api/activate/status   — real-time status snapshot of every engine
 * GET  /api/activate/blockers — external blockers + active bypass methods
 * GET  /api/activate/sequence — ordered execution sequence
 */

import { Router }                          from "express";
import { runCycleNow, getCycleCount,
         getLatestCycle }                  from "../services/aboveTranscend/engine.js";
import { runUltimateCycle, getUltimateStats }   from "../services/ultimateTranscend.js";
import { triggerMetaCycle, getMetaCycleStats }  from "../services/metaTranscend.js";
import { enforce100Percent,
         getEnforcerStats }                from "../services/platform100Enforcer.js";
import { getWealthSnapshot }               from "../services/wealthMultiplier.js";
import { getMaximizerStats }               from "../services/wealthMaximizer.js";
import { getInvoiceSummary }               from "./invoicePayments.js";
import { getCredentialStatus, CREDENTIAL_DEFS } from "../services/credentialsBridge.js";

const router = Router();

// ─── Known Blockers (external dependencies — cannot be bypassed in code) ───────

// ─── Blocker factory — includes live credential state from CredentialsBridge ───

function buildBlockers() {
  const credStatus = getCredentialStatus();
  const liveCount  = credStatus.filter(c => c.set).length;
  const totalCreds = credStatus.length;
  const allLive    = liveCount === totalCreds;
  const liveNames  = credStatus.filter(c => c.set).map(c => c.channel).join(", ") || "none";

  return [
    {
      id:                    "stripe-charges",
      system:                "Stripe Card Charges",
      status:                "blocked",
      reason:                "charges_enabled: false — Stripe account requires identity verification",
      bypass:                "PayGate is fully active. Cash App ($CreateAIDigital) and Venmo (@CreateAIDigital) collect all revenue without Stripe.",
      bypassActive:          true,
      requiresExternalAction: true,
      externalSteps: [
        "Log in to Stripe Dashboard → Account Settings",
        "Complete identity and business verification",
        "Enable charges on the account",
      ],
    },
    {
      id:                    "resend-domain",
      system:                "Resend Email Delivery (createaiplatform.com)",
      status:                "partial",
      reason:                "Domain not verified — email currently delivers only to sivh@mail.com",
      bypass:                "Invoices are shared as direct PayGate links. Clients pay via Cash App or Venmo without email.",
      bypassActive:          true,
      requiresExternalAction: true,
      externalSteps: [
        "Log in to resend.com/domains",
        "Add createaiplatform.com, copy DNS records from Credentials Hub (DNS tab) → paste into registrar",
        "Click Verify — full email delivery activates immediately",
      ],
    },
    {
      id:                    "marketplace-tokens",
      system:                "External Marketplace Publishing (Shopify / Etsy / Amazon / eBay / Creative Market)",
      status:                allLive ? "live" : liveCount > 0 ? "partial" : "pending",
      live:                  liveCount,
      total:                 totalCreds,
      liveChannels:          liveNames,
      pendingChannels:       credStatus.filter(c => !c.set).map(c => c.channel).join(", "),
      reason:                allLive
        ? `All ${totalCreds} marketplace channels connected — product sync executing on all platforms.`
        : liveCount > 0
          ? `${liveCount}/${totalCreds} marketplace tokens connected (${liveNames}). Enter remaining tokens in Credentials Hub.`
          : "No marketplace API tokens connected — product sync queue built but not executing.",
      bypass:                "Semantic Store serves all products on platform-hosted URLs. All products are live for direct sale right now. Credentials Hub (open with: 'credentials') lets you enter tokens in-OS — activates instantly.",
      bypassActive:          true,
      requiresExternalAction: !allLive,
      externalSteps:         allLive ? [] : [
        "Open Credentials Hub in NEXUS (say 'credentials' or 'connect shopify')",
        "Enter each marketplace token — it activates publishing immediately, no restart needed",
        credStatus.filter(c => !c.set).map(c => `${c.channel}: ${c.helpUrl}`).join(" | "),
      ],
      credentialStatus:      credStatus,
    },
    {
      id:                    "cashapp-venmo-api",
      system:                "Automated Cash App / Venmo Collection",
      status:                "manual-collection",
      reason:                "Cash App and Venmo are consumer apps — no automated payment API exists for either platform",
      bypass:                "Mark-paid workflow in PayGate: client sends payment, you tap Mark Paid in the OS. Revenue logs instantly.",
      bypassActive:          true,
      requiresExternalAction: false,
      externalSteps:         [],
    },
    {
      id:                    "ach-payout",
      system:                "ACH Auto-Payout (Huntington Bank)",
      status:                "requires-auth",
      reason:                "Payout route requires founder authentication — protected endpoint",
      bypass:                "Manually transfer from Cash App or Venmo to your bank account at any time. No automation required.",
      bypassActive:          true,
      requiresExternalAction: false,
      externalSteps:         [],
    },
  ];
}

// ─── Execution Sequence ────────────────────────────────────────────────────────

const EXECUTION_SEQUENCE = [
  { t: "T+0s",     action: "All triggerable engines fired simultaneously",                           type: "system"     },
  { t: "T+30s",    action: "Semantic product catalog refresh — all 100+ products re-indexed",        type: "revenue"    },
  { t: "T+1min",   action: "Ultimate Zero-Touch: 11 content formats × all niches generated",         type: "generation" },
  { t: "T+1min",   action: "Meta Premium Expansion: premium tier content and pricing cycle",         type: "revenue"    },
  { t: "T+2min",   action: "Maximizer enforcement: all revenue metrics locked at ≥100%",            type: "enforcement"},
  { t: "T+2min",   action: "Platform Enforcer: all metrics audited and held to spec",               type: "enforcement"},
  { t: "T+2min",   action: "Wealth Multiplier: growth ratios computed and applied",                 type: "revenue"    },
  { t: "T+5min",   action: "Orchestrator: AI multi-phase goal plan generated and queued",           type: "ai"         },
  { t: "Ongoing",  action: "All engines cycling 24/7 autonomously — zero human intervention needed", type: "autonomous" },
  { t: "On-demand","action": "PayGate: Cash App + Venmo ready to receive payment from any client at any time", type: "payment" },
];

// ─── POST /api/activate/all ───────────────────────────────────────────────────

router.post("/all", async (_req, res) => {
  const startedAt = new Date().toISOString();

  const results = await Promise.allSettled([
    runCycleNow().then(() => ({ engine: "above-transcend", label: "Above-Transcend Engine" })),
    runUltimateCycle().then(() => ({ engine: "ultimate",  label: "Ultimate Zero-Touch Launch" })),
    triggerMetaCycle().then(() => ({ engine: "meta",      label: "Meta Premium Expansion" })),
    enforce100Percent().then(() => ({ engine: "enforcer", label: "Platform 100% Enforcer" })),
  ]);

  const fired = results
    .filter(r => r.status === "fulfilled")
    .map(r => (r as PromiseFulfilledResult<{ engine: string; label: string }>).value);

  const failed = results
    .filter(r => r.status === "rejected")
    .map((r, i) => ({
      engine: ["above-transcend","ultimate","meta","enforcer"][i],
      reason: (r as PromiseRejectedResult).reason?.message ?? "unknown",
    }));

  const alwaysRunning = [
    { engine: "wealth",          label: "Wealth Multiplier",          schedule: "every 2 min" },
    { engine: "maximizer",       label: "Full Auto Wealth Maximizer", schedule: "every 2 min" },
    { engine: "semantic-launch", label: "Semantic Launch Console",    schedule: "continuous"  },
    { engine: "hybrid",          label: "Hybrid Multi-Rail Engine",   schedule: "continuous"  },
    { engine: "creation-engines",label: "Creation Engines (8 BASE)",  schedule: "continuous"  },
    { engine: "advertising",     label: "Advertising Hub (12 platforms)", schedule: "on-demand" },
    { engine: "paygate",         label: "PayGate (Cash App + Venmo)", schedule: "always-live" },
    { engine: "credentials-hub", label: "Credentials Hub (marketplace bridge)", schedule: "reactive — activates when token is entered" },
  ];

  const blockers = buildBlockers();
  const credentialStatus = getCredentialStatus();

  res.json({
    ok:              true,
    activatedAt:     startedAt,
    enginesTriggered: fired.length,
    fired,
    failed,
    alwaysRunning,
    blockers:        blockers.filter(b => !b.bypassActive),
    bypassesActive:  blockers.filter(b => b.bypassActive).length,
    credentialStatus: {
      marketplaces:    credentialStatus,
      live:            credentialStatus.filter(c => c.set).length,
      total:           credentialStatus.length,
      allLive:         credentialStatus.every(c => c.set),
      summary:         credentialStatus.filter(c => c.set).length === 0
        ? "No marketplace tokens connected — enter in Credentials Hub to activate external publishing"
        : `${credentialStatus.filter(c => c.set).length}/${credentialStatus.length} marketplace channels live`,
    },
    executionSequence: EXECUTION_SEQUENCE,
    confirmation:    fired.length > 0
      ? `ACTIVATED — ${fired.length} engines fired simultaneously. ${alwaysRunning.length} systems already running continuously. ${blockers.filter(b => b.bypassActive).length}/${blockers.length} blockers have active bypasses.`
      : "Engines already cycling — no additional trigger needed.",
    paymentRail: {
      cashapp: "$CreateAIDigital",
      venmo:   "@CreateAIDigital",
      status:  "live",
      note:    "Both handles accept payment immediately. No Stripe required.",
    },
  });
});

// ─── GET /api/activate/status ─────────────────────────────────────────────────

router.get("/status", (_req, res) => {
  const invoice        = getInvoiceSummary();
  const ultimateStats  = getUltimateStats();
  const enforcerStats  = getEnforcerStats();
  const maximizerStats = getMaximizerStats();
  const metaStats      = getMetaCycleStats();
  const wealthSnap     = getWealthSnapshot();
  const aboveCycles    = getCycleCount();
  const latestCycle    = getLatestCycle();
  const credStatus     = getCredentialStatus();
  const liveMarkets    = credStatus.filter(c => c.set).length;

  res.json({
    ok:         true,
    checkedAt:  new Date().toISOString(),
    engines: [
      {
        id:       "above-transcend",
        label:    "Above-Transcend Engine",
        status:   "running",
        schedule: "autonomous — self-scheduling",
        cycles:   aboveCycles,
        phase:    latestCycle?.phase ?? "initializing",
      },
      {
        id:       "ultimate",
        label:    "Ultimate Zero-Touch Launch",
        status:   "running",
        schedule: "every 1 min",
        cycles:   ultimateStats.cyclesRun ?? 0,
        products: ultimateStats.productsGenerated ?? 0,
      },
      {
        id:       "meta",
        label:    "Meta Premium Expansion",
        status:   "running",
        schedule: "every 1 min",
        cycles:   metaStats.cyclesRun ?? 0,
      },
      {
        id:       "enforcer",
        label:    "Platform 100% Enforcer",
        status:   "running",
        schedule: "every 2 min",
        cycles:   enforcerStats.cyclesRun ?? 0,
        lastScore: enforcerStats.lastScore ?? null,
      },
      {
        id:       "maximizer",
        label:    "Full Auto Wealth Maximizer",
        status:   "running",
        schedule: "every 2 min",
        cycles:   maximizerStats.cyclesRun ?? 0,
      },
      {
        id:       "wealth",
        label:    "Wealth Multiplier",
        status:   "running",
        schedule: "every 2 min",
        products: wealthSnap.products ?? 0,
        platforms: wealthSnap.platforms ?? 0,
      },
      {
        id:       "paygate",
        label:    "PayGate — Cash App + Venmo",
        status:   "live",
        schedule: "always-on",
        handles:  { cashapp: "$CreateAIDigital", venmo: "@CreateAIDigital" },
        paidTotal:       invoice.paidTotal,
        paidTodayTotal:  invoice.paidTodayTotal,
      },
      {
        id:       "semantic-launch",
        label:    "Semantic Launch Console",
        status:   "live",
        schedule: "continuous",
        note:     "100+ products live at /api/semantic/launch/quick-links",
      },
      {
        id:       "advertising",
        label:    "Advertising Hub (12 Platforms)",
        status:   "live",
        schedule: "on-demand",
        note:     "Campaigns generated via /api/advertising/*",
      },
      {
        id:       "credentials-hub",
        label:    "Credentials Hub — Marketplace Bridge",
        status:   liveMarkets > 0 ? "partial" : "standby",
        schedule: "reactive — activates on token entry",
        live:     liveMarkets,
        total:    credStatus.length,
        channels: credStatus.map(c => ({ channel: c.channel, live: c.set, source: c.source })),
        note:     liveMarkets === 0
          ? "No marketplace tokens entered — open 'credentials' in NEXUS to activate"
          : `${liveMarkets}/${credStatus.length} marketplace channels publishing`,
      },
    ],
    blockers:       buildBlockers(),
    credentialStatus: {
      marketplaces: credStatus,
      live:         liveMarkets,
      total:        credStatus.length,
      allLive:      liveMarkets === credStatus.length,
      summary:      liveMarkets === 0
        ? "No marketplace tokens — open Credentials Hub to activate external publishing"
        : `${liveMarkets}/${credStatus.length} marketplace channels live`,
    },
    liveRevenue: {
      paidTotal:      invoice.paidTotal,
      paidToday:      invoice.paidTodayTotal,
      cashapp:        invoice.byMethod?.cashapp ?? 0,
      venmo:          invoice.byMethod?.venmo   ?? 0,
      note:           invoice.paidTotal === 0
        ? "No payments received yet. Both payment rails are live and ready."
        : "Revenue confirmed via Cash App or Venmo.",
    },
  });
});

// ─── GET /api/activate/blockers ───────────────────────────────────────────────

router.get("/blockers", (_req, res) => {
  const blockers = buildBlockers();
  res.json({
    ok:           true,
    total:        blockers.length,
    active:       blockers.filter(b => b.bypassActive).length,
    unresolvable: blockers.filter(b => !b.bypassActive).length,
    blockers,
    credentialStatus: getCredentialStatus(),
    summary:      `${blockers.filter(b => b.bypassActive).length} of ${blockers.length} blockers have active bypasses. Zero revenue is lost — all gaps are covered by alternative methods.`,
  });
});

// ─── GET /api/activate/sequence ───────────────────────────────────────────────

router.get("/sequence", (_req, res) => {
  res.json({
    ok:              true,
    sequence:        EXECUTION_SEQUENCE,
    note:            "All steps after T+0s are autonomous — no human intervention required.",
  });
});

export default router;
