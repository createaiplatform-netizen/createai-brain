import { Router, type IRouter } from "express";
import adminRouter     from "./admin";
import webhooksRouter  from "./webhooks";
import ssoRouter       from "./sso";
import systemRouter    from "./system";
import healthRouter from "./health";
import authRouter from "./auth";
import openaiRouter from "./openai";
import projectsRouter from "./projects";
import brainstormRouter from "./brainstorm";
import projectChatRouter from "./projectChat";
import userRouter from "./user";
import activityRouter from "./activity";
import conversationsRouter from "./conversations";
import integrationsRouter from "./integrations";
import peopleRouter from "./people";
import notificationsRouter from "./notifications";
import documentsRouter from "./documents";
import tasksRouter from "./tasks";
import membersRouter from "./project_members";
import tractionRouter from "./traction";
import metricsRouter from "./metrics";
import opportunitiesRouter from "./opportunities";
import leadCycleRouter from "./lead-cycle";
import legalRouter from "./legal";
import healthcareRouter from "./healthcare";
import staffingRouter from "./staffing";
import imaginationRouter from "./imagination";
import loreforgeRouter from "./loreforge";
import narratororosRouter from "./narratoros";
import civilizationforgeRouter from "./civilizationforge";
import ecologyforgeRouter from "./ecologyforge";
import soundscapeRouter from "./soundscape";
import timelineforgeRouter from "./timelineforge";
import mythweaveRouter from "./mythweave";
import languageforgeRouter from "./languageforge";
import magicsystemRouter from "./magicsystem";
import urbanworldRouter from "./urbanworld";
import warloreRouter from "./warlore";
import characterforgeRouter from "./characterforge";
import techforgeRouter from "./techforge";
import visualworldRouter from "./visualworld";
import religionforgeRouter from "./religionforge";
import cosmologyforgeRouter from "./cosmologyforge";
import gameworldRouter from "./gameworld";
import adaptersRouter from "./adapters";
import publicRouter from "./public";
import securityRouter from "./security";
import financeRouter from "./finance";
import educationRouter from "./education";
import operationsRouter from "./operations";
import sustainabilityRouter from "./sustainability";
import hrRouter from "./hr";
import legalaiRouter from "./legalai";
import productdesignRouter from "./productdesign";
import researchlabRouter from "./researchlab";
import connectRouter from "./connect";
import smartFhirSandboxRouter from "./smart-fhir-sandbox";
import memoryRouter from "./memory";
import aiRouter from "./ai";
import dashboardRouter from "./dashboard";
import brainRouter       from "./brain";
import modulesRouter     from "./modules";
import marketplaceRouter from "./marketplace";
import stripeRouter      from "./stripe";
import systemHealthRouter from "./systemHealth";
import aboveTranscendRouter from "./aboveTranscend";
import { accessMiddleware } from "../security/FullLockdown.js";
import projectDocumentsRouter from "./projectDocuments";
import invitesRouter       from "./invites";
import subscriptionsRouter from "./subscriptions";
import fileVersionsRouter  from "./fileVersions";
import movieRouter         from "./movieGenerate";
import renderRouter        from "./renderEngine";
import generateRouter      from "./generate";
import realMarketRouter    from "./realMarket.js";
import hybridRouter        from "./hybrid.js";
import wealthRouter        from "./wealth.js";
import auditRouter         from "./audit.js";
import metaRouter          from "./meta.js";
import maximizerRouter     from "./maximizer.js";
import enforcerRouter     from "./enforcer.js";
import ultimateRouter          from "./ultimate.js";
import ultraInteractionRouter  from "./ultraInteraction.js";
import payoutRouter             from "./payout.js";
import bridgeRouter             from "./bridge.js";
import modesRouter              from "./modes.js";
import creationEnginesRouter    from "./creationEngines.js";
import semanticStoreRouter        from "./semanticStore.js";
import semanticWebhooksRouter     from "./semanticWebhooks.js";
import semanticAnalyticsRouter    from "./semanticAnalytics.js";
import semanticAffiliateRouter    from "./semanticAffiliate.js";
import semanticSEORouter          from "./semanticSEO.js";
import semanticContentRouter      from "./semanticContent.js";
import semanticPortalRouter       from "./semanticPortal.js";
import semanticSubscriptionRouter from "./semanticSubscription.js";
import semanticLaunchRouter       from "./semanticLaunch.js";
import omniBridgeRouter         from "./omniBridge.js";
import orchestratorRouter       from "./orchestrator.js";
import advertisingRouter        from "./advertising.js";
import magiclinkRouter          from "./magiclink.js";
import invoicePaymentsRouter    from "./invoicePayments.js";
import studioExtendedRouter     from "./studioExtended.js";
import percentageEngineRouter   from "./percentageEngine.js";
import maxActivationRouter      from "./maxActivation.js";
import credentialsBridgeRouter  from "./credentialsBridge.js";
import campaignManagerRouter    from "./campaignManager.js";
import referralRouter           from "./referral.js";
import leadsRouter              from "./leads.js";
import growthAnalyticsRouter    from "./growthAnalytics.js";
import platformIdentityRouter   from "./platformIdentity.js";
import selfHostRouter           from "./selfHost.js";
import platformReportRouter     from "./platformReport.js";
import healthMonitorRouter      from "./healthMonitor.js";
import internalTotpRouter       from "./internalTotp.js";
import contactIntelligenceRouter  from "./contactIntelligence.js";
import transactionLedgerRouter    from "./transactionLedger.js";
import orderFlowRouter            from "./orderFlow.js";
import caseResolutionRouter       from "./caseResolution.js";
import contentPipelineRouter      from "./contentPipeline.js";
import insightEngineRouter        from "./insightEngine.js";
import agreementFlowRouter        from "./agreementFlow.js";
import growthPathRouter           from "./growthPath.js";
import assetFlowRouter            from "./assetFlow.js";
import engagementMapRouter        from "./engagementMap.js";
import domainCompleteRouter       from "./domainComplete.js";
import globalUnifierRouter        from "./globalUnifier.js";
import projectCommandRouter       from "./projectCommand.js";
import partnerNetworkRouter       from "./partnerNetwork.js";
import eventBookingRouter         from "./eventBooking.js";
import educationEngineRouter      from "./educationEngine.js";
import socialCommandRouter        from "./socialCommand.js";
import supplyChainRouter          from "./supplyChain.js";
import franchiseHubRouter         from "./franchiseHub.js";
import brandVaultRouter           from "./brandVault.js";
import revenueIntelRouter         from "./revenueIntel.js";
import aiStrategyRouter           from "./aiStrategy.js";
import { storeSubmissionRouter }  from "./storeSubmission.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/openai", openaiRouter);
router.use("/projects", projectsRouter);
router.use("/projects", tasksRouter);
router.use("/projects", membersRouter);
router.use("/brainstorm", brainstormRouter);
router.use("/project-chat", projectChatRouter);
router.use("/user", userRouter);
router.use("/activity", activityRouter);
router.use("/conversations", conversationsRouter);
router.use("/integrations", integrationsRouter);
router.use("/people", peopleRouter);
router.use("/notifications", notificationsRouter);
router.use("/documents", documentsRouter);
router.use("/traction", tractionRouter);
router.use("/metrics",  metricsRouter);
router.use("/opportunities", opportunitiesRouter);
router.use("/lead-cycle",   leadCycleRouter);
router.use("/imagination",        imaginationRouter);
router.use("/loreforge",          loreforgeRouter);
router.use("/narratoros",         narratororosRouter);
router.use("/civilizationforge",  civilizationforgeRouter);
router.use("/ecologyforge",       ecologyforgeRouter);
router.use("/soundscape",         soundscapeRouter);
router.use("/timelineforge",      timelineforgeRouter);
router.use("/mythweave",          mythweaveRouter);
router.use("/languageforge",      languageforgeRouter);
router.use("/magicsystem",        magicsystemRouter);
router.use("/urbanworld",         urbanworldRouter);
router.use("/warlore",            warloreRouter);
router.use("/characterforge",     characterforgeRouter);
router.use("/techforge",          techforgeRouter);
router.use("/visualworld",        visualworldRouter);
router.use("/religionforge",      religionforgeRouter);
router.use("/cosmologyforge",     cosmologyforgeRouter);
router.use("/gameworld",          gameworldRouter);
router.use("/legal",              legalRouter);
router.use("/health",             healthcareRouter);
router.use("/staffing",           staffingRouter);

// ── Enterprise Suite Routes ───────────────────────────────────────────────────
router.use("/security",           securityRouter);
router.use("/finance",            financeRouter);
router.use("/education",          educationRouter);
router.use("/operations",         operationsRouter);
router.use("/sustainability",     sustainabilityRouter);
router.use("/hr",                 hrRouter);
router.use("/legal-ai",           legalaiRouter);
router.use("/product-design",     productdesignRouter);
router.use("/research-lab",       researchlabRouter);
router.use("/connect",            connectRouter);
router.use("/integrations/smart-fhir-sandbox", smartFhirSandboxRouter);

// ── Public demo routes (no auth required) ────────────────────────────────────
router.use("/public",             publicRouter);

// ── Enterprise routes ────────────────────────────────────────────────────────
router.use("/adapters",           adaptersRouter);
router.use("/admin",              adminRouter);
router.use("/webhooks",           webhooksRouter);
router.use("/auth/sso",           ssoRouter);

// ── Encrypted memory store ───────────────────────────────────────────────────
router.use("/memory",             memoryRouter);

// ── AI integration endpoints ─────────────────────────────────────────────────
router.use("/ai",                 aiRouter);

// ── Project Intelligence (lifecycle + document generation) ───────────────────
router.use("/project-documents",  projectDocumentsRouter);

// ── Invite system + subscriptions + file versioning ──────────────────────────
router.use("/invites",            invitesRouter);
router.use("/subscriptions",      subscriptionsRouter);
router.use("/projects",           fileVersionsRouter);
router.use("/movie",              movieRouter);
router.use("/render",             renderRouter);
router.use("/generate",           accessMiddleware, generateRouter);
router.use("/dashboard",          accessMiddleware, dashboardRouter);
router.use("/brain",              accessMiddleware, brainRouter);
router.use("/modules",            modulesRouter);
router.use("/marketplace",        marketplaceRouter);
router.use("/integrations/stripe", stripeRouter);

// ── System Command Processor ─────────────────────────────────────────────────
router.use("/system",             systemRouter);

// ── Real health metrics (truth-only — no simulated values) ───────────────────
router.use("/system",             systemHealthRouter);

// ── Above-Transcend Engine ────────────────────────────────────────────────────
router.use("/above-transcend",    aboveTranscendRouter);

// ── Real Market AI Store (spec: realStripeSetup.ts) ───────────────────────────
router.use("/real-market",        realMarketRouter);

// ── Hybrid Multi-Rail Engine (Stripe + Resend + Twilio + internal queue) ──────
router.use("/hybrid",             hybridRouter);

// ── Wealth Multiplier Add-On (2-min autonomous cycle, growth projections) ─────
router.use("/wealth",             wealthRouter);

// ── Full Platform Audit (zero-touch snapshot across all engines) ──────────────
router.use("/audit",              auditRouter);

// ── Meta-Zero-Touch Transcendent Launch (1-min premium expansion cycle) ───────
router.use("/meta",               metaRouter);

// ── Full Auto Wealth Maximizer (2-min enforcement, min 100% growth) ───────────
router.use("/maximizer",          maximizerRouter);

// ── Full Platform 100% Enforcer (2-min all-metric enforcement cycle) ──────────
router.use("/enforcer",           enforcerRouter);

// ── Ultimate Zero-Touch Transcendent Launch (1-min, 11 formats × all niches) ──
router.use("/ultimate",           ultimateRouter);

// ── Ultra Interaction Engine (every browser event → micro-revenue + growth) ───
router.use("/ultra",              ultraInteractionRouter);

// ── Huntington ACH Payout (spec: pushFundsToHuntington) ─────────────────────
router.use("/payout",             payoutRouter);

// ── Universal Bridge Engine — connector status + action history ───────────────
router.use("/bridge",             bridgeRouter);

// ── Platform Mode Spectrum Registry (all 25 modes, 5 layers) ─────────────────
router.use("/modes",              modesRouter);

// ── Unified Creation Engine Registry (8 BASE-layer engines) ──────────────────
router.use("/engines/creation",   creationEnginesRouter);

// ── Omni-Bridge Architecture (7-dimension unified integration layer) ──────────
router.use("/omni-bridge",        omniBridgeRouter);

// ── All-Systems Execution Orchestrator ───────────────────────────────────────
router.use("/orchestrator",       orchestratorRouter);

// ── Semantic Product Layer (Model 4) — channel-agnostic product objects ───────
// Products → Shopify CSV, WooCommerce CSV, Google Shopping XML, Amazon feed,
// Stripe checkout, hosted product page — all from one source of truth.
router.use("/semantic",                 semanticStoreRouter);
// Semantic webhooks: checkout.session.completed → delivery email + CRM capture
router.use("/semantic/webhooks",        semanticWebhooksRouter);
// Semantic analytics: views, revenue, funnel, platform score, search
// All endpoints: /api/semantic/analytics/, /api/semantic/analytics/search,
//                /api/semantic/analytics/formats, /api/semantic/analytics/top-products
//                /api/semantic/analytics/platform-score
router.use("/semantic/analytics",       semanticAnalyticsRouter);
// Affiliate / referral link system
router.use("/semantic/affiliate",       semanticAffiliateRouter);
// SEO: bundle detection at /api/semantic/bundles
// (sitemap.xml + robots.txt are served at domain root via app.ts)
router.use("/semantic",                 semanticSEORouter);

// AI Content Generation Engine — per-product AI-generated content previews + downloads
// GET  /api/semantic/content/:productId        — generate + return full content (JSON)
// GET  /api/semantic/content/:productId/html   — styled HTML preview
// GET  /api/semantic/content/:productId/text   — plain text download
// GET  /api/semantic/content/status            — cache stats
// POST /api/semantic/content/batch             — pre-generate content for N products
router.use("/semantic/content",          semanticContentRouter);

// Customer Self-Service Portal — purchase history lookup by email
// POST /api/semantic/portal/lookup  — returns all purchases + re-download links
// GET  /api/semantic/portal/me      — portal HTML page (email gated)
// GET  /api/semantic/portal/stats   — CRM aggregate stats
router.use("/semantic/portal",           semanticPortalRouter);

// Subscription & Recurring Revenue tier
// GET /api/semantic/subscriptions          — list recurring products
// GET /api/semantic/subscriptions/plans    — membership plan definitions
// GET /api/semantic/subscriptions/landing  — membership landing page (HTML)
// GET /api/semantic/subscriptions/checkout/:priceId — Stripe subscription checkout
router.use("/semantic/subscriptions",    semanticSubscriptionRouter);

// Revenue Launch Console — fastest path from code-ready to money-in-bank
// GET  /api/semantic/launch                — Admin console (HTML): share links, checklist, delivery form
// GET  /api/semantic/launch/status         — Launch readiness (JSON)
// POST /api/semantic/launch/deliver        — Manual delivery: email + productId → CRM + content links
// GET  /api/semantic/launch/share/:id      — Clean shareable product card (OG-ready)
// GET  /api/semantic/launch/quick-links    — All 100 checkout URLs (JSON)
router.use("/semantic/launch",           semanticLaunchRouter);

// ── Percentage Engine — unified capability + financial capacity model ─────────
router.use("/system/percentages",        percentageEngineRouter);

// ── Invention Layer — 12 AI bypass tools ─────────────────────────────────────
router.use("/studio",                    studioExtendedRouter);

// ── Advertising Hub — all platform assets, ad templates, brand materials ──────
router.use("/advertising",               advertisingRouter);

// ── Magic Link Auth — passwordless email authentication ───────────────────────
router.use("/auth/magic-link",           magiclinkRouter);

// ── Invoice Payments — multi-rail payment collection (bank, wire, Zelle, etc.)
router.use("/payments/invoice",          invoicePaymentsRouter);
router.use("/payments",                  invoicePaymentsRouter);

// ── Maximum Potential Activation Orchestrator ─────────────────────────────────
router.use("/activate",                  maxActivationRouter);

// ── Credentials Bridge — in-OS token manager + Resend DNS wizard ──────────────
router.use("/credentials",               credentialsBridgeRouter);

// ── Ad Campaign Orchestrator — 12 networks, pre-built campaigns, internal ads ──
router.use("/ads",                        campaignManagerRouter);

// ── Viral Referral Loop — referral codes, clicks, conversions, leaderboard ──
router.use("/referral",                   referralRouter);

// ── Internal Lead Capture (replaces Mailchimp) ────────────────────────────────
router.use("/leads",                      leadsRouter);

// ── Internal Analytics (replaces Google Analytics) ───────────────────────────
router.use("/analytics",                  growthAnalyticsRouter);

// ── NEXUS Platform Address — internal identity, routing, NPA resolution ───────
router.use(platformIdentityRouter);

// ── Self-Host Engine — internal hosting, createai:// routing, verification ────
router.use(selfHostRouter);

// ── Unified Platform Analytics Report ────────────────────────────────────────
router.use("/platform/report", platformReportRouter);

// ── Automated Health Monitor — 16-endpoint polling, 60s interval ──────────────
router.use("/health-monitor", healthMonitorRouter);

// ── Internal TOTP Engine — RFC 6238, HMAC-SHA1, no external deps ──────────────
router.use("/totp", internalTotpRouter);

// ── Domain Gap Engines — 12 new industry-equivalent domain implementations ────
router.use("/crm",         contactIntelligenceRouter);
router.use("/ledger",      transactionLedgerRouter);
router.use("/orders",      orderFlowRouter);
router.use("/cases",       caseResolutionRouter);
router.use("/content",     contentPipelineRouter);
router.use("/kpi",         insightEngineRouter);
router.use("/agreements",  agreementFlowRouter);
router.use("/growth-path", growthPathRouter);
router.use("/assets",      assetFlowRouter);
router.use("/engagement",  engagementMapRouter);
router.use("/domains",     domainCompleteRouter);
router.use("/global",      globalUnifierRouter);

// ── Extended Domain Engine Suite v2.0 — 10 new industry-equivalent domains ───
router.use("/projects-cmd",   projectCommandRouter);
router.use("/partners",       partnerNetworkRouter);
router.use("/event-bookings", eventBookingRouter);
router.use("/education-hub", educationEngineRouter);
router.use("/social",        socialCommandRouter);
router.use("/supply-chain",  supplyChainRouter);
router.use("/franchise",     franchiseHubRouter);
router.use("/brand",         brandVaultRouter);
router.use("/revenue-intel", revenueIntelRouter);
router.use("/ai-strategy",   aiStrategyRouter);

// ── App Distribution & Store Submission Engine ─────────────────────────────
router.use("/store",         storeSubmissionRouter);

// ── API Documentation — Swagger UI + OpenAPI 3.0 spec ──────────────────────
import apiDocsRouter from "./apiDocs.js";
router.use("/docs",          apiDocsRouter);

// ── Observability — Error ring buffer + process metrics dashboard ─────────────
import observabilityRouter from "./observability.js";
router.use("/system/errors", observabilityRouter);

// ── Deployment Readiness Checklist ───────────────────────────────────────────
import deploymentReadinessRouter from "./deploymentReadiness.js";
router.use("/deployment",    deploymentReadinessRouter);

// ── Email Dashboard — T013: Resend domain verification + transactional email ──
import emailDashboardRouter from "./emailDashboard.js";
router.use("/email",         emailDashboardRouter);

// ── Marketplace Activation Dashboard — T012 ───────────────────────────────────
import marketplaceActivationRouter from "./marketplaceActivation.js";
router.use("/marketplace-hub", marketplaceActivationRouter);

// ── Platform Evolution Layer — 8 new intelligence systems ────────────────────
import universalSearchRouter   from "./universalSearch.js";
import automationEngineRouter  from "./automationEngine.js";
import featureFlagsRouter      from "./featureFlags.js";
import eventsStreamRouter      from "./eventsStream.js";
import intelligenceOracleRouter from "./intelligenceOracle.js";
import temporalIntelRouter     from "./temporalIntel.js";
import platformDNARouter       from "./platformDNA.js";
import outboundWebhooksRouter  from "./outboundWebhooks.js";

router.use("/search",          universalSearchRouter);
router.use("/automation",      automationEngineRouter);
router.use("/flags",           featureFlagsRouter);
router.use("/events",          eventsStreamRouter);
router.use("/oracle",          intelligenceOracleRouter);
router.use("/temporal",        temporalIntelRouter);
router.use("/platform-dna",    platformDNARouter);
router.use("/webhook-mgr",     outboundWebhooksRouter);

// ── Financial Hub Backward-Compat Redirects — T006 ───────────────────────────
// Wealth, ledger, and revenue-intel are also reachable under /finance/*
// using 301 redirects for any client still hitting the legacy paths.
import type { Request as Req, Response as Res, NextFunction as Next } from "express";
router.get("/finance/wealth",       (_r: Req, res: Res) => { res.redirect(301, "/api/wealth"); });
router.get("/finance/ledger",       (_r: Req, res: Res) => { res.redirect(301, "/api/ledger"); });
router.get("/finance/revenue-intel",(_r: Req, res: Res) => { res.redirect(301, "/api/revenue-intel"); });
// Generic /api/finance/* → /api/finance (primary finance router handles it)
// Canonical financial dashboard aggregation
router.get("/finance/hub", (req: Req, res: Res) => {
  res.json({
    ok:   true,
    note: "CreateAI Brain Financial Hub — unified financial aggregation",
    routes: {
      records:      "/api/finance/records",
      stats:        "/api/finance/stats",
      wealth:       "/api/wealth",
      ledger:       "/api/ledger",
      revenueIntel: "/api/revenue-intel",
      vault:        "/vault",
    },
    shortcuts: {
      wealthAlias:      "/api/finance/wealth → 301 → /api/wealth",
      ledgerAlias:      "/api/finance/ledger → 301 → /api/ledger",
      revenueIntAlias:  "/api/finance/revenue-intel → 301 → /api/revenue-intel",
    },
  });
});

export default router;
