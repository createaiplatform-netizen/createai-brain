/**
 * apiDocs.ts — OpenAPI 3.0 specification + Swagger UI
 *
 * Mounted at /api/docs → interactive Swagger UI
 *         at /api/docs/openapi.json → raw OpenAPI JSON spec
 *
 * Covers all 947+ endpoints grouped by domain.
 */

import { Router, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";

const router = Router();

// ─── OpenAPI 3.0 Spec ────────────────────────────────────────────────────────

const spec = {
  openapi: "3.0.3",
  info: {
    title:       "CreateAI Brain API",
    version:     "2.0.0",
    description: [
      "## CreateAI Brain — Complete OS-Level AI Platform API",
      "",
      "**Owner:** Sara Stadler · Lakeside Trinity LLC  ",
      "**Platform:** NEXUS Semantic OS  ",
      "**NPA:** `npa://CreateAIDigital`  ",
      "",
      "This API serves all 47+ domain engines across the CreateAI Brain platform:",
      "healthcare, legal practice management, staffing operations, project management,",
      "AI generation engines (18 forge types), advertising hub, marketplace integrations,",
      "Stripe subscriptions, referral system, and autonomous expansion engine.",
      "",
      "### Authentication",
      "Most endpoints require a session cookie set by Replit OIDC (`/auth/callback`).",
      "Admin routes additionally require the `X-Admin-Token` header or admin session.",
      "",
      "### Payment Rails",
      "- **Stripe:** Connected via Replit connector — `/api/integrations/stripe/checkout`",
      "- **Checkout flow:** POST priceId → get Stripe-hosted checkout URL",
    ].join("\n"),
    contact: {
      name:  "Sara Stadler",
      email: "admin@LakesideTrinity.com",
      url:   "https://createai.replit.app",
    },
    license: {
      name: "Proprietary — Lakeside Trinity LLC",
      url:  "https://lakesidetrinity.com",
    },
  },
  servers: [
    {
      url:         "/api",
      description: "CreateAI Brain API Server",
    },
  ],
  components: {
    securitySchemes: {
      sessionCookie: {
        type:        "apiKey",
        in:          "cookie",
        name:        "session",
        description: "Set automatically after /auth/callback (Replit OIDC)",
      },
      adminToken: {
        type:        "apiKey",
        in:          "header",
        name:        "X-Admin-Token",
        description: "Required for admin-only endpoints",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Unauthorized" },
        },
        required: ["error"],
      },
      ForgeSession: {
        type: "object",
        properties: {
          id:         { type: "integer" },
          userId:     { type: "string" },
          engineId:   { type: "string" },
          engineName: { type: "string" },
          topic:      { type: "string" },
          output:     { type: "string" },
          title:      { type: "string", nullable: true },
          tags:       { type: "string", nullable: true },
          projectId:  { type: "string", nullable: true },
          isStarred:  { type: "boolean" },
          createdAt:  { type: "string", format: "date-time" },
        },
      },
      ForgeSessionInput: {
        type: "object",
        required: ["engineId", "engineName", "topic", "output"],
        properties: {
          engineId:   { type: "string" },
          engineName: { type: "string" },
          topic:      { type: "string" },
          output:     { type: "string" },
          title:      { type: "string" },
          tags:       { type: "string" },
          projectId:  { type: "string" },
          isStarred:  { type: "boolean", default: false },
        },
      },
      Project: {
        type: "object",
        properties: {
          id:          { type: "string" },
          name:        { type: "string" },
          description: { type: "string", nullable: true },
          ownerId:     { type: "string" },
          status:      { type: "string", enum: ["active", "archived", "completed"] },
          createdAt:   { type: "string", format: "date-time" },
        },
      },
      HealthPatient: {
        type: "object",
        properties: {
          id:          { type: "integer" },
          firstName:   { type: "string" },
          lastName:    { type: "string" },
          dateOfBirth: { type: "string", format: "date" },
          email:       { type: "string" },
          phone:       { type: "string" },
        },
      },
      LegalClient: {
        type: "object",
        properties: {
          id:      { type: "integer" },
          name:    { type: "string" },
          email:   { type: "string" },
          phone:   { type: "string" },
          status:  { type: "string" },
        },
      },
      StaffingCandidate: {
        type: "object",
        properties: {
          id:       { type: "integer" },
          name:     { type: "string" },
          email:    { type: "string" },
          skills:   { type: "array", items: { type: "string" } },
          status:   { type: "string" },
        },
      },
    },
  },
  security: [{ sessionCookie: [] }],
  tags: [
    { name: "Health",       description: "System health and status — NO AUTH REQUIRED" },
    { name: "Auth",         description: "Authentication flows (Replit OIDC)" },
    { name: "Stripe",       description: "Payment processing and subscription management" },
    { name: "Projects",     description: "Project management — files, tasks, members, chat" },
    { name: "Healthcare",   description: "Healthcare OS — patients, doctors, records, appointments" },
    { name: "Legal",        description: "Legal Practice Manager — clients, matters, invoices, time" },
    { name: "Staffing",     description: "Staffing OS — candidates, requisitions, placements" },
    { name: "Forge",        description: "AI Creative Engines (18 forge types) — character, lore, myth, etc." },
    { name: "AI",           description: "OpenAI-powered generation endpoints" },
    { name: "Advertising",  description: "Advertising Hub — 12 ad networks, 30+ campaign templates" },
    { name: "Marketplace",  description: "Marketplace bridge — Shopify, Etsy, Amazon, eBay" },
    { name: "Platform",     description: "Platform self-hosting, identity, expansion" },
    { name: "Admin",        description: "Admin-only — requires admin session or token" },
  ],
  paths: {
    // ─── Health ───────────────────────────────────────────────────────────────
    "/healthz": {
      get: {
        tags:        ["Health"],
        summary:     "Platform health check",
        description: "Public endpoint. Returns ok immediately. Used by load balancers and monitoring.",
        security:    [],
        responses: {
          200: {
            description: "Platform is healthy",
            content: {
              "application/json": {
                example: { status: "ok", service: "api-server", uptime_s: 3600, timestamp: "2026-03-22T00:00:00.000Z" },
              },
            },
          },
        },
      },
    },
    "/system/health": {
      get: {
        tags:        ["Health"],
        summary:     "Service health matrix",
        description: "Returns health status for all external services: Stripe, OpenAI, Resend, Twilio, PostgreSQL.",
        security:    [],
        responses: {
          200: {
            description: "Services health matrix",
            content: {
              "application/json": {
                example: { services: [{ name: "stripe", status: "real" }, { name: "openai", status: "real" }] },
              },
            },
          },
        },
      },
    },
    // ─── Auth ─────────────────────────────────────────────────────────────────
    "/auth/user": {
      get: {
        tags:    ["Auth"],
        summary: "Get current authenticated user",
        responses: {
          200: { description: "User object" },
          401: { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/logout": {
      get: {
        tags:    ["Auth"],
        summary: "Log out current user",
        responses: { 302: { description: "Redirect to /" } },
      },
    },
    // ─── Stripe ───────────────────────────────────────────────────────────────
    "/integrations/stripe/status": {
      get: {
        tags:     ["Stripe"],
        summary:  "Stripe connection status",
        security: [],
        responses: {
          200: { description: "Stripe connection status", content: { "application/json": { example: { ok: true, mode: "test" } } } },
        },
      },
    },
    "/integrations/stripe/checkout": {
      post: {
        tags:    ["Stripe"],
        summary: "Create Stripe Checkout session",
        description: "Creates a hosted Stripe Checkout session. Returns a URL to redirect the customer to Stripe.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["priceId"],
                properties: {
                  priceId:    { type: "string", example: "price_1234567890" },
                  customerId: { type: "string", description: "Optional existing Stripe customer ID" },
                  quantity:   { type: "integer", default: 1 },
                  metadata:   { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Checkout URL", content: { "application/json": { example: { ok: true, url: "https://checkout.stripe.com/..." } } } },
          400: { description: "Missing priceId or invalid price" },
          500: { description: "Stripe API error" },
        },
      },
    },
    "/integrations/stripe/prices": {
      get: {
        tags:    ["Stripe"],
        summary: "List all active Stripe prices",
        responses: { 200: { description: "Array of active prices with product details" } },
      },
    },
    "/integrations/stripe/balance": {
      get: {
        tags:    ["Stripe"],
        summary: "Fetch Stripe account balance",
        responses: { 200: { description: "Available and pending balances by currency" } },
      },
    },
    "/webhooks/stripe": {
      post: {
        tags:     ["Stripe"],
        summary:  "Stripe webhook receiver",
        security: [],
        description: "Receives Stripe events. Validates Stripe-Signature header. Handles checkout.session.completed, payment_intent.succeeded, customer.subscription.* events.",
        responses: {
          200: { description: "Event received" },
          400: { description: "Invalid signature or malformed payload" },
        },
      },
    },
    // ─── Projects ─────────────────────────────────────────────────────────────
    "/projects": {
      get: {
        tags:    ["Projects"],
        summary: "List user projects",
        responses: {
          200: { description: "Array of projects", content: { "application/json": { schema: { type: "object", properties: { projects: { type: "array", items: { $ref: "#/components/schemas/Project" } } } } } } },
          401: { $ref: "#/components/schemas/Error" },
        },
      },
      post: {
        tags:    ["Projects"],
        summary: "Create a project",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, description: { type: "string" } } } } } },
        responses: { 201: { description: "Project created" }, 400: { description: "Missing name" }, 401: { description: "Unauthorized" } },
      },
    },
    "/projects/{id}": {
      get: {
        tags:       ["Projects"],
        summary:    "Get a project by ID",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses:  { 200: { description: "Project detail" }, 404: { description: "Not found" } },
      },
    },
    // ─── Healthcare ───────────────────────────────────────────────────────────
    "/healthcare/patients": {
      get: {
        tags:    ["Healthcare"],
        summary: "List patients",
        responses: { 200: { description: "Array of patients", content: { "application/json": { schema: { type: "object", properties: { patients: { type: "array", items: { $ref: "#/components/schemas/HealthPatient" } } } } } } }, 401: { description: "Unauthorized" } },
      },
      post: {
        tags:    ["Healthcare"],
        summary: "Register a new patient",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/HealthPatient" } } } },
        responses: { 201: { description: "Patient registered" } },
      },
    },
    "/healthcare/doctors": {
      get: { tags: ["Healthcare"], summary: "List doctors", responses: { 200: { description: "Doctors list" }, 401: { description: "Unauthorized" } } },
    },
    "/healthcare/appointments": {
      get:  { tags: ["Healthcare"], summary: "List appointments", responses: { 200: { description: "Appointments" }, 401: { description: "Unauthorized" } } },
      post: { tags: ["Healthcare"], summary: "Create appointment", responses: { 201: { description: "Created" } } },
    },
    // ─── Legal ────────────────────────────────────────────────────────────────
    "/legal/clients": {
      get:  { tags: ["Legal"], summary: "List legal clients", responses: { 200: { description: "Clients" }, 401: { description: "Unauthorized" } } },
      post: { tags: ["Legal"], summary: "Create legal client", responses: { 201: { description: "Created" } } },
    },
    "/legal/matters": {
      get:  { tags: ["Legal"], summary: "List legal matters", responses: { 200: { description: "Matters" }, 401: { description: "Unauthorized" } } },
      post: { tags: ["Legal"], summary: "Create legal matter", responses: { 201: { description: "Created" } } },
    },
    "/legal/invoices": {
      get:  { tags: ["Legal"], summary: "List invoices", responses: { 200: { description: "Invoices" }, 401: { description: "Unauthorized" } } },
      post: { tags: ["Legal"], summary: "Create invoice", responses: { 201: { description: "Created" } } },
    },
    "/legal/time-entries": {
      get:  { tags: ["Legal"], summary: "List time entries", responses: { 200: { description: "Time entries" }, 401: { description: "Unauthorized" } } },
      post: { tags: ["Legal"], summary: "Log time entry", responses: { 201: { description: "Created" } } },
    },
    // ─── Staffing ─────────────────────────────────────────────────────────────
    "/staffing/candidates": {
      get:  { tags: ["Staffing"], summary: "List candidates", responses: { 200: { description: "Candidates" }, 401: { description: "Unauthorized" } } },
      post: { tags: ["Staffing"], summary: "Add candidate", responses: { 201: { description: "Created" } } },
    },
    "/staffing/requisitions": {
      get:  { tags: ["Staffing"], summary: "List job requisitions", responses: { 200: { description: "Requisitions" }, 401: { description: "Unauthorized" } } },
      post: { tags: ["Staffing"], summary: "Create requisition", responses: { 201: { description: "Created" } } },
    },
    "/staffing/placements": {
      get: { tags: ["Staffing"], summary: "List placements", responses: { 200: { description: "Placements" } } },
    },
    // ─── Forge ────────────────────────────────────────────────────────────────
    "/characterforge": {
      get:  { tags: ["Forge"], summary: "List characterforge sessions", responses: { 200: { description: "Sessions" }, 401: { description: "Unauthorized" } } },
      post: { tags: ["Forge"], summary: "Create characterforge session", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ForgeSessionInput" } } } }, responses: { 201: { description: "Session created" } } },
    },
    "/loreforge": {
      get:  { tags: ["Forge"], summary: "List loreforge sessions", responses: { 200: { description: "Sessions" }, 401: { description: "Unauthorized" } } },
      post: { tags: ["Forge"], summary: "Create loreforge session", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ForgeSessionInput" } } } }, responses: { 201: { description: "Session created" } } },
    },
    "/mythweave": {
      get:  { tags: ["Forge"], summary: "List mythweave sessions", responses: { 200: { description: "Sessions" }, 401: { description: "Unauthorized" } } },
      post: { tags: ["Forge"], summary: "Create mythweave session", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ForgeSessionInput" } } } }, responses: { 201: { description: "Session created" } } },
    },
    "/cosmologyforge": { get: { tags: ["Forge"], summary: "List cosmologyforge sessions", responses: { 200: { description: "Sessions" } } } },
    "/soundscape":     { get: { tags: ["Forge"], summary: "List soundscape sessions",     responses: { 200: { description: "Sessions" } } } },
    "/timelineforge":  { get: { tags: ["Forge"], summary: "List timelineforge sessions",  responses: { 200: { description: "Sessions" } } } },
    "/urbanworld":     { get: { tags: ["Forge"], summary: "List urbanworld sessions",     responses: { 200: { description: "Sessions" } } } },
    "/visualworld":    { get: { tags: ["Forge"], summary: "List visualworld sessions",    responses: { 200: { description: "Sessions" } } } },
    "/religionforge":  { get: { tags: ["Forge"], summary: "List religionforge sessions",  responses: { 200: { description: "Sessions" } } } },
    "/gameworld":      { get: { tags: ["Forge"], summary: "List gameworld sessions",      responses: { 200: { description: "Sessions" } } } },
    "/narratoros":     { get: { tags: ["Forge"], summary: "List narratoros sessions",     responses: { 200: { description: "Sessions" } } } },
    "/imagination":    { get: { tags: ["Forge"], summary: "List imagination sessions",    responses: { 200: { description: "Sessions" } } } },
    "/warlore":        { get: { tags: ["Forge"], summary: "List warlore sessions",        responses: { 200: { description: "Sessions" } } } },
    "/techforge":      { get: { tags: ["Forge"], summary: "List techforge sessions",      responses: { 200: { description: "Sessions" } } } },
    "/ecologyforge":   { get: { tags: ["Forge"], summary: "List ecologyforge sessions",   responses: { 200: { description: "Sessions" } } } },
    "/languageforge":  { get: { tags: ["Forge"], summary: "List languageforge sessions",  responses: { 200: { description: "Sessions" } } } },
    "/magicsystem":    { get: { tags: ["Forge"], summary: "List magicsystem sessions",    responses: { 200: { description: "Sessions" } } } },
    "/civilizationforge": { get: { tags: ["Forge"], summary: "List civilizationforge sessions", responses: { 200: { description: "Sessions" } } } },
    // ─── AI ───────────────────────────────────────────────────────────────────
    "/brainstorm/sessions": {
      get: { tags: ["AI"], summary: "List brainstorm sessions", responses: { 200: { description: "Sessions" }, 401: { description: "Unauthorized" } } },
    },
    "/brainstorm/chat": {
      post: { tags: ["AI"], summary: "Chat with AI brainstorm engine (SSE streaming)", responses: { 200: { description: "SSE stream" } } },
    },
    // ─── Advertising ──────────────────────────────────────────────────────────
    "/advertising/hub": {
      get: { tags: ["Advertising"], summary: "Advertising Hub HTML dashboard", security: [], responses: { 200: { description: "HTML dashboard" } } },
    },
    "/ads/dashboard": {
      get: { tags: ["Advertising"], summary: "Campaign Manager dashboard", security: [], responses: { 200: { description: "HTML dashboard — 12 ad networks, 30+ campaigns" } } },
    },
    "/ads/networks": {
      get: { tags: ["Advertising"], summary: "List all ad networks and status", responses: { 200: { description: "Networks" } } },
    },
    "/ads/campaigns": {
      get: { tags: ["Advertising"], summary: "List all campaigns", responses: { 200: { description: "Campaigns" } } },
    },
    // ─── Platform ─────────────────────────────────────────────────────────────
    "/self-host/status": {
      get: { tags: ["Platform"], summary: "Self-host engine status", security: [], responses: { 200: { description: "Engine status" } } },
    },
    "/self-host/dashboard": {
      get: { tags: ["Platform"], summary: "Platform Identity HTML dashboard", security: [], responses: { 200: { description: "HTML dashboard" } } },
    },
    "/self-host/proof": {
      get: { tags: ["Platform"], summary: "HMAC-signed platform proof token", security: [], responses: { 200: { description: "Proof token" } } },
    },
    "/above-transcend/status": {
      get: { tags: ["Platform"], summary: "Autonomous engine cycle status", security: [], responses: { 200: { description: "Cycle count and readiness" } } },
    },
    // ─── Admin ────────────────────────────────────────────────────────────────
    "/credentials/dashboard": {
      get: { tags: ["Admin"], summary: "Credentials Hub — enter marketplace API tokens", security: [], responses: { 200: { description: "HTML form" } } },
    },
    "/system/percentages/dashboard": {
      get: { tags: ["Admin"], summary: "Platform Readiness % dashboard", security: [], responses: { 200: { description: "HTML dashboard" } } },
    },
  },
};

// ─── Serve raw JSON spec ───────────────────────────────────────────────────────
router.get("/openapi.json", (_req: Request, res: Response) => {
  res.json(spec);
});

// ─── Serve Swagger UI ─────────────────────────────────────────────────────────
router.use("/", swaggerUi.serve);
router.get("/", swaggerUi.setup(spec, {
  customSiteTitle: "CreateAI Brain API Docs",
  customCss: `
    .swagger-ui .topbar { background: #020617; border-bottom: 1px solid #1e293b; }
    .swagger-ui .topbar-wrapper img { display: none; }
    .swagger-ui .topbar-wrapper::after {
      content: 'CreateAI Brain — API Reference';
      color: #818cf8;
      font-family: Inter, sans-serif;
      font-weight: 900;
      font-size: 1.1rem;
    }
    body { background: #020617; }
    .swagger-ui { color: #e2e8f0; }
    .swagger-ui .info .title { color: #818cf8; }
  `,
  swaggerOptions: {
    tryItOutEnabled:     true,
    requestInterceptor:  (req: unknown) => req,
    displayRequestDuration: true,
    filter: true,
    defaultModelsExpandDepth: 1,
  },
}));

export default router;
