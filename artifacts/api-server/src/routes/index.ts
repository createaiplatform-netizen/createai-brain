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
import semanticStoreRouter      from "./semanticStore.js";
import semanticWebhooksRouter   from "./semanticWebhooks.js";
import semanticAnalyticsRouter  from "./semanticAnalytics.js";
import semanticAffiliateRouter  from "./semanticAffiliate.js";
import semanticSEORouter        from "./semanticSEO.js";
import omniBridgeRouter         from "./omniBridge.js";
import orchestratorRouter       from "./orchestrator.js";

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

export default router;
