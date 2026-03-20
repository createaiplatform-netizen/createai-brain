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

export default router;
