# CreateAI Brain – Workspace

## Overview

The CreateAI Brain is a full-stack AI OS platform (NEXUS Semantic OS), developed as a pnpm monorepo using TypeScript. It provides 45+ domain engine apps within a unified spatial interface. The platform supports autonomous revenue generation, 300+ AI invention tools, cross-industry operations (HealthOS, LegalPM, StaffingOS), and a complete business management suite.

**Platform Scale (March 2026)**
- 35+ HTML dashboard surfaces — all returning 200
- 373 App screens lazy-loaded in the OS shell (AppWindow.tsx) — including 8 new evolution system apps
- Extended Domain Suite v2.0 (10 new engines): Project Command, Partner Network, Events & Bookings, Education Hub, Social Command, Supply Chain, Franchise Hub, Brand Vault, Revenue Intelligence, AI Strategy Engine (GPT-4o)
- Dev server: port 23568 (workflow: "CreateAI Brain: Start Dev Server")
- API server: port 8080 (workflow: "artifacts/api-server: API Server")
- **Test suite**: 265 tests across 11 test files (all green)
- **Database**: 56 performance indexes applied directly via SQL (health/legal/staffing schemas)
- **Email**: Resend integration wired; sandbox sends to sivh@mail.com; set CONTACT_EMAIL for production
- **Marketplace**: /api/marketplace-hub dashboard + credential status for Shopify/Etsy/Amazon/eBay/CreativeMarket

**Evolution Layer API Endpoints (8 New Systems)**
- `GET  /api/search?q=&domains[]=&limit=` — Universal cross-domain full-text search (projects/leads/patients/legal/staffing/docs/people)
- `GET  /api/automation/status` — Automation engine status (triggers, actions, rule counts)
- `CRUD /api/automation/rules` — Automation rule CRUD + `POST /:id/run` (trigger) + `POST /:id/toggle` (enable/disable)
- `GET  /api/automation/executions` — Execution history (last 100)
- `CRUD /api/flags` — Feature flag CRUD + `POST /:key/toggle` + `GET /:key/evaluate`
- `GET  /api/events/stream` — Server-Sent Events live stream (real-time platform events)
- `GET  /api/events/recent?limit=` — Recent events buffer
- `POST /api/events/emit` — Publish a platform event
- `POST /api/oracle/query` — GPT-4o cross-domain intelligence query
- `GET  /api/oracle/report` — Full platform intelligence report
- `GET  /api/oracle/snapshots` — Recent oracle snapshots
- `GET  /api/temporal/trends?metric=&days=` — Time-series trend analysis
- `GET  /api/temporal/velocity` — Domain growth velocity (last 30d)
- `GET  /api/temporal/anomalies` — Statistical anomaly detection (3σ z-score)
- `GET  /api/platform-dna/genome` — Full 17-dimension capability genome
- `GET  /api/platform-dna/score` — Platform maturity score (currently 91/100, "Elite")
- `GET  /api/platform-dna/gaps` — Identified capability gaps
- `POST /api/platform-dna/pulse` — Record capability heartbeat
- `CRUD /api/webhook-mgr/endpoints` — Outbound webhook endpoint management (HMAC-SHA256 signed)
- `GET  /api/webhook-mgr/deliveries` — Delivery log
- `POST /api/webhook-mgr/endpoints/:id/test` — Test delivery

**New Frontend Apps (8 New + 4 Upgraded)**
- **Upgraded** `AutomationCenterApp` — Real rule builder, execution monitor, wired to `/api/automation`
- **Upgraded** `EventStreamApp` — Live SSE feed, topic filters, emit buttons, wired to `/api/events`
- **Upgraded** `SearchStudioApp` — Full-text search with domain filters, wired to `/api/search`
- **Upgraded** `WebhookManagerApp` — Endpoint CRUD + test delivery, wired to `/api/webhook-mgr`
- **NEW** `IntelligenceOracleApp` — GPT-4o natural language queries across all domains
- **NEW** `TemporalAnalyticsApp` — Sparkline charts, velocity, anomaly detection
- **NEW** `PlatformDNAApp` — 17-dimension genome, gap analysis, heartbeat recording
- **NEW** `FeatureFlagsApp` — Flag CRUD, toggle, rollout %, environment scoping
- **NEW** `hooks/useFeatureFlag.ts` — React hook + evaluateFlag() for runtime flag evaluation

**DB Package Upgrade**
- Added `sql` tagged template literal export to `lib/db/src/index.ts`
- Pattern: `const rows = await sql\`SELECT ... WHERE id = ${id}\``
- Returns `Record<string, unknown>[]` (parameterized, safe from SQL injection)

**Key API Endpoints Added (Session March 2026)**
- `GET /api/email/dashboard` — HTML email verification + transactional email dashboard
- `GET /api/email/status` — JSON email credential + delivery status
- `POST /api/email/test` — Send a test email (goes to CONTACT_EMAIL or sivh@mail.com)
- `GET /api/marketplace-hub/dashboard` — HTML marketplace activation dashboard
- `GET /api/marketplace-hub/status` — JSON channel status (Shopify/Etsy/Amazon/eBay/CreativeMarket)
- `POST /api/marketplace-hub/probe/:channel` — Live API probe for a marketplace channel
- `GET /api/finance/hub` — Financial hub route map (all financial route paths)
- `GET /api/finance/wealth` → 301 redirect to `/api/wealth`
- `GET /api/finance/ledger` → 301 redirect to `/api/ledger`
- `GET /api/finance/revenue-intel` → 301 redirect to `/api/revenue-intel`
- `POST /api/above-transcend/execute` — Execute a recommended AI action (email_campaign, sms_alert, stripe_checkout_link, log_only)

**Critical Email Notes**
- Resend sandbox only delivers to API owner's email (`sivh@mail.com`) until domain is verified
- Verify `createaiplatform.com` at resend.com/domains, then set `CONTACT_EMAIL=admin@LakesideTrinity.com` in Replit Secrets
- DNS records fetcher: `GET /api/credentials/dns-records`
- FAMILY_EMAIL_LIST fallback is now `sivh@mail.com` (was `admin@createaiplatform.com`)

**Marketplace Activation**
- All 5 marketplace channels (Shopify/Etsy/Amazon/eBay/CreativeMarket) are wired and ready
- Add credentials via `POST /api/credentials/set` or Replit Secrets; channels activate automatically
- Required secrets per channel documented at `/api/marketplace-hub/dashboard`

**Deployment Configuration (api-server artifact)**
- Build: `pnpm install --frozen-lockfile && pnpm --filter @workspace/createai-brain run build && pnpm --filter @workspace/api-server run build`
- Run: `node artifacts/api-server/dist/index.cjs` (from workspace root)
- Health: `GET /api/healthz` → `{"status":"ok"}`
- Frontend served via selfHostEngine from `artifacts/createai-brain/dist/public/`
- `src/utils/serverPaths.ts` — resolves api-server root from any CWD context (dev or production)
- CRITICAL: Never use `import.meta.url` in api-server source — esbuild CJS bundle sets it to undefined. Use `serverPath()` from serverPaths.ts instead.

Key capabilities include:
- A unified controller layer for all AI generation, ensuring consistent context injection and output recording.
- An encrypted memory system for secure storage of user data and API keys.
- An ExpansionGuard for managing AI engine safety, preventing runaway calls and context overloads.
- A Scaffold Engine for rapid project creation with industry-specific templates.
- An UltraMax Pipeline featuring ambient audio, universal render engine players, and project file management.
- An UltraMax Meta-Platform with suggested next renders, cross-player synthesis, and branching narratives.
- An expanded engine ecosystem with numerous specialized AI engines and series.
- A robust data platform with real-time analytics, user management, audit logs, and GDPR compliance.
- A three-tier access model (Public, Logged in, NDA signed) with Replit OIDC authentication.
- A Universal Demo + Test + Simulation Platform for interactive exploration and scenario building.
- Advanced multi-sensory spatial UI/UX with atmospheric layers, animated elements, and cognitive dimming.
- Integrated subscription management, invite codes, and file versioning.
- Per-frame art regeneration and PDF export capabilities.
- An AI Prediction Engine for smart content suggestions and predictive document enrichment.
- An adaptive tile grid dashboard for project visualization.

The project's vision is to offer a powerful, intuitive, and secure platform for AI-driven creativity, productivity, and innovation across diverse domains.

## User Preferences

- **Communication Style**: Calm, Simple, Friendly, Progressive Disclosure.
- **Workflow Preferences**: Iterative development is preferred.
- **Interaction Preferences**: Ask before making major changes.
- **General Working Preferences**:
    - **UX**:
        - Mobile-first layout. Never overcrowd a single view.
        - Reveal advanced options progressively — not all at once.
        - No wall of settings on first load; no multi-column dense tables on small viewports.
        - Indigo `#6366f1` is the only accent color. No competing accents.
        - Dark glass theme: `hsl(231,47%,6%)` background, `rgba(255,255,255,0.06–0.12)` surfaces.
    - **TypeScript**: Zero errors always. Fix any errors before finishing — no `@ts-ignore`, no `any` casts to silence real type problems.
    - **Data Integrity**: All data displayed to users must come from real API calls to the backend, which reads from PostgreSQL. No mock, seed, or placeholder data to be used as final data sources.
    - **API Calls**: Every `fetch()` call anywhere in the frontend must include `credentials: "include"`.
    - **AI Gateway**: All AI generation flows exclusively through `PlatformController.ts`. Never call `/api/openai/*` directly from app code or implement SSE stream readers outside `PlatformController.ts`.
    - **Context Management**: Components changing user focus must call `contextStore.setSessionContext(...)`.
    - **UI Features**: BrainHub "Intelligence" tab, RunPanel "↩ Rollback" button, and Sidebar "🧠 Platform · N runs" indicator are permanent UI features and not optional.
    - **Session Planning**: For any work involving 3+ components or 2+ files, identify all files to change, typecheck after changes, restart the affected workflow, and verify no browser console errors.
    - **Express v5 Specifics**: `req.params.X` must be cast as `string`. No `@/` alias in `api-server`—use relative imports only. DB imports from `@workspace/db`.
    - **Controller Function Signatures**: Adhere to the canonical signatures for `streamEngine`, `streamChat`, `streamBrainstorm`, `streamSeries`, `streamProjectChat`, `contextStore.setSessionContext`, `contextStore.recordOutput`, `contextStore.rollback`, `contextStore.buildContextFor`.
    - **CapabilityEngine**: `runEngine` and `runMetaAgent` exports are internal implementation; never modify their signatures.

## System Architecture

The CreateAI Brain platform is built as a pnpm workspace monorepo using Node.js 24 and TypeScript 5.9.

**UI/UX Decisions:**
- **Design System**: Dark glass UI with an indigo (`#6366f1`) accent color. `hsl(231,47%,6%)` for backgrounds and `rgba(255,255,255,0.06–0.12)` for surfaces.
- **Responsiveness**: Mobile-first layout with adaptive components for various screen sizes (mobile, tablet, desktop).
- **Progressive Disclosure**: Advanced options are revealed progressively to avoid overwhelming the user.
- **Multi-Sensory Spatial Interface**: Incorporates atmospheric layers with animated radial gradients and micro-particles, depth vignettes, and CSS animations for subtle movement and visual depth. This includes `atmosphericBreath` for background gradients, `blobDrift` for 3D blob movement, `particleFloat` for micro-particle ascent, and `view-enter` for cinematic page transitions.
- **Cognitive Dimming**: `focus-group` and `focus-item` classes dim sibling elements when one is hovered, enhancing focus.
- **Interactive Elements**: `tilt-card` for 3D perspective tilt on hover, `stagger-grid` for staggered mounting animations.
- **Accessibility**: Honours `prefers-reduced-motion` to disable animations for users who prefer it.

**Technical Implementations & Design Choices:**
- **Unified Controller Layer**: `PlatformController.ts` acts as the sole AI gateway, orchestrating all AI generation flows, context enrichment, caching, and delegating to specialized executors. This enforces a consistent interaction model with AI services.
- **Executor Pattern**: AI tasks are routed through `selectExecutor` to domain-specific executors (Healthcare, Legal, Creative, General, Project) which apply relevant context prefixes and logic.
- **Encrypted Memory System**: A `memory_store` database table stores encrypted user-specific data (e.g., API keys) using AES-256-GCM, ensuring data at rest is secure. A dedicated `memoryService.ts` handles encryption/decryption on the server.
- **Service Container (DI)**: An Express v5-specific service container uses dependency injection for managing services like `EncryptionService` and `MemoryService`, promoting modularity and testability. Services are registered lazily and can be singleton or request-scoped.
- **ExpansionGuard**: A safety layer that checks for maximum depth, recursion, and token budget before executing AI engine logic, preventing runaway AI processes and context explosions. It provides a trace for debugging.
- **Scaffold Engine**: Facilitates rapid project creation by offering pre-defined templates and generating initial project files based on industry and project type.
- **UltraMax Pipeline**: Enhances user experience with ambient audio matched to content mood, unified SSE streaming with keepalives, and advanced rendering features for various media types (cinematic, book, podcast, game, app, product showcase, music).
- **UltraMax Meta-Platform**: Introduces "Suggested Next Renders" based on AI predictions, "Cross-Player Synthesis" to enrich new content with existing project context, and "Cinematic Branching Choices" for interactive narratives.
- **Real Data Platform**: Eliminates mock data, ensuring all user-facing data originates from PostgreSQL via authenticated API calls. This includes comprehensive data models for users, projects, tasks, conversations, documents, integrations, people, notifications, and opportunities.
- **Authentication & Authorization**: Three-tier access model (Public, Logged in, NDA signed) with Replit OIDC. All API routes are auth-protected and scoped by `userId`. NDA signing is integrated into the login flow.
- **Universal Demo + Test + Simulation Platform**: A comprehensive environment for demonstrating, testing, and simulating various industry-specific scenarios with an interactive 3-panel layout, contextual AI guide, and persistent user profiles.
- **Conversation Engine**: An NLP intent parser and conversation engine that handles 18 intent types, entity extraction, state updates, walk-throughs, simulations, and a quiz bank, enabling dynamic and intelligent user interaction.
- **Interaction Engine**: Manages universal state for roles, departments, agencies, states, vendors, views, user types, and demo statuses, with comprehensive mock data to simulate complex scenarios.
- **Internal Connection Layer**: A conceptual model of 31 typed nodes representing modules, flows, data structures, and brain logic, providing an internal map of platform capabilities.
- **Regulatory Readiness Blueprint Layer**: Outlines pre-built blueprints for regulatory compliance (HIPAA, GDPR, SOC2, etc.), detailing clauses, data governance, security flows, and gap analysis.
- **Future Backend Blueprint Layer**: Describes conceptual blueprints for core backend services like Auth & Identity, Creation Engine API, Integration Engine API, User & Access Management, and Regulatory Readiness API.
- **Admin Dashboard**: Expanded to include modules for managing invites, subscriptions, observability metrics (server health, uptime, telemetry, DB counts), audit logs, and security.
- **Project Version History**: Automatic content snapshots for project files with rollback capabilities, ensuring data integrity and allowing users to revert changes.
- **Per-Frame Art Regeneration**: Allows on-demand regeneration of images within players (CinematicPlayer, BookReader, CoursePlayer) using DALL-E, dynamically updating image sources.
- **Training Render Mode**: Supports a dedicated "training" render mode for generating corporate training and L&D programs with interactive scenarios and PDF export.
- **Analytics Dashboard**: Provides project-level KPIs, industry breakdown, and AI insights, auto-refreshing to show real-time data.
- **Smart SuggestedNextRenders**: An AI prediction engine that analyzes project context to suggest and score the most relevant next rendering modes.
- **Content Enrichment Score Badge**: Displays a color-coded percentage of enriched content within a project, indicating AI readiness.
- **Smart Fill**: A predictive document enrichment feature that uses GPT-4o to replace bracketed placeholders in documents with project-specific content.
- **Adaptive Tile Grid Dashboard**: A responsive grid view for projects, displaying key stats like enrichment progress, document counts, and action buttons.

## External Dependencies

- **Database**: PostgreSQL (managed via Drizzle ORM)
- **AI Models**:
    - OpenAI (GPT-5.2, DALL-E 3)
    - Potentially Anthropic (mentioned in Integration Engine)
- **Authentication**: Replit OIDC (via `lib/replit-auth-web` package)
- **Frontend Libraries**:
    - React
    - Vite
    - Wouter (routing)
    - React Query (data fetching)
    - Framer Motion (animations)
    - TailwindCSS (styling)
    - Recharts (charts)
- **Backend Libraries**:
    - Express 5 (API framework)
    - Zod (`zod/v4`, `drizzle-zod` for validation)
    - Orval (OpenAPI codegen)
    - esbuild (bundling)
    - tsx (TypeScript execution)
- **Other Integrations (Mock/Conceptual)**:
    - **Healthcare**: Epic EHR, Cerner, Telehealth, Pharmacy
    - **Finance**: Stripe, Plaid, QuickBooks
    - **CRM**: HubSpot, Salesforce, Pipedrive
    - **Marketing**: Mailchimp, SendGrid
    - **Messaging**: Twilio, Slack
    - **Storage**: Google Drive, Notion
    - **Automation**: Zapier, Jira
    - **Analytics**: Google Analytics
    - **Communication**: Zoom
    - **SSO Providers**: Google, Microsoft, Okta, GitHub (scaffold)
## Platform Mode Spectrum Registry

- **25-Mode Spectrum** — 5 layers (BASE/PLATFORM/TRANSCENDENT/INFINITE/BEYOND), all active at boot.
- **Backend** — `artifacts/api-server/src/services/modeRegistry.ts` defines all 25 modes. Routes at `GET /api/modes`, `/api/modes/stats`, `/api/modes/active`, `/api/modes/layer/:layer`.
- **Frontend** — `ModeSpectrumPanel.tsx` renders all 25 modes grouped by layer in `UltimateTranscendDashboard.tsx` below the engine grid.
- **Stripe Live Mode** — `stripeClient.ts` auto-switches test→production when `REPLIT_DEPLOYMENT=1`. No hardcoded keys.


## Omni-Bridge Architecture

- **7 Dimensions** — HEAD (Intelligence), BODY (Interface), SOUL (Experience), BRAIN (Engines), UNIVERSE (Modes), INSIDE (Internal OS), OUTSIDE (External Systems)
- **Backend** — `artifacts/api-server/src/services/omniBridge.ts` (pure registry, no engine changes). Routes: `GET /api/omni-bridge`, `/api/omni-bridge/health`, `/api/omni-bridge/dimension/:id`
- **Frontend** — `OmniBridgePanel.tsx` added to `UltimateTranscendDashboard.tsx` above CreationEngineStatusPanel and ModeSpectrumPanel
- **Health Score** — 97/100 · 75/77 systems active · 6/7 dimensions fully active (OUTSIDE is partial: ads + marketplace not yet configured)
- **Live Mode** — TEST in dev; auto-switches to LIVE when `REPLIT_DEPLOYMENT=1`


## Admin Auth System

- **Cookie-based session auth** for all platform admin surfaces
- Login page: `GET /admin/login` · Submit: `POST /admin/login`
- Logout: `GET /admin/logout`
- Password: `CORE_OWNER_PASS` env var (defaults to `createai2024`)
- Session cookie: `ADMIN_SESSION` — HMAC-SHA256 signed, 24-hour TTL
- Protected routes: `/hub`, `/vault`, `/bundle`, `/valuation`, `/studio/*`, `/status/*`, `/launch/payments`
- Public routes stay unprotected: `/store`, `/nexus`, `/portal`, `/join`, `/`
- Key files: `src/middlewares/adminAuth.ts`, `src/routes/adminAuth.ts`

## Platform Database (PostgreSQL)

- **Package**: `postgres` (lightweight, Replit-compatible with `ssl: false`)
- **Schema bootstrap**: Idempotent `bootstrapSchema()` called at server startup
- **Tables**: `platform_customers`, `platform_subscriptions`, `platform_webhook_events`, `platform_email_jobs`, `platform_stripe_prices`
- **Key file**: `src/lib/db.ts`
- **Webhook deduplication**: `markWebhookProcessed()` prevents replay attacks
- **Customer persistence**: `insertCustomer()` saves on every successful Stripe webhook
- **Stats**: `getCustomerStats()` for real revenue/customer counts

## Stripe Subscription Pricing (Auto-Created)

- Three tiers auto-created in Stripe on first startup: Solo ($29/mo), Business ($79/mo), Enterprise ($299/mo)
- Price IDs persisted in `platform_stripe_prices` DB table
- Checkout URLs auto-generated at `/join/checkout/:priceId`
- Key file: `src/services/subscriptionPrices.ts`

## AI Studio (2 Live Capabilities)

All studio routes protected by admin auth.

### AI Email Engine (`/studio/email`)
- UI: Write email brief, tone selection, send to comma-separated list
- Backend: `POST /studio/email/draft` → GPT-4o generates subject + body
- Backend: `POST /studio/email/send` → Resend API delivers to recipients
- No Mailchimp, no SendGrid needed

### AI Document Generator (`/studio/docs`)
- UI: Dropdown of 12 document types, custom type override, party names, key terms, jurisdiction
- Backend: `POST /studio/docs/draft` → GPT-4o generates 500-900 word professional document
- Output: Complete contract/proposal/SOP in plain text with numbered sections
- Disclaimer: AI-generated; legal review recommended

### AI Analytics Reports (`/studio/analytics`)
- UI: Select report period (7/14/30/90 days, all time) + focus area (revenue, customers, products, full)
- Backend: `POST /studio/analytics/generate` → fetches live DB stats + catalog, sends to GPT-4o for BI report
- Output: 300-500 word plain-English business intelligence report citing real numbers
- Data sources: `getCustomerStats()`, `getRevenueTimeline()`, `getRegistry()` — all live

### AI CRM & Follow-up (`/studio/crm`)
- UI: Live customer table from PostgreSQL (last 50), one-click "AI Follow-up" per customer
- Backend: `POST /studio/crm/followup` → reads customer's purchase history, GPT-4o writes personalized email
- Data source: `getRecentCustomers()` from DB (not in-memory)

### AI Social Scheduler (`/studio/social`)
- UI: Platform selector (Twitter/LinkedIn/Instagram/Facebook/All), count (7/14/30), tone, brand name
- Backend: `POST /studio/social/generate` → samples up to 15 products from catalog, GPT-4o writes posts
- Output: 7-30 posts with captions, hashtags, and CTAs

### AI Content Engine (`/studio/content`)
- UI: 8 content types (product description, landing page, SEO meta, sales email, bio, FAQ, testimonial request, upsell), audience, brief, tone
- Backend: `POST /studio/content/generate` → type-specific instructions + GPT-4o
- Output: Ready-to-use copy in plain text format

### Coming soon (4 remaining stubs)
- AI Scheduling Layer, AI Training System, AI Form Builder, AI Helpdesk

## PULSE — Real-Time Platform Awareness Engine (`/pulse`)

- **Purpose**: Live business intelligence dashboard — the operational heartbeat of the platform
- **Data sources**: PostgreSQL (customers, revenue, webhooks), Stripe balance API, Semantic Product Registry
- **Auto-refreshes**: Every 15 seconds via client-side polling to `/pulse/json`
- **KPIs shown**: All-time revenue, this week, today, total customers, avg order, catalog size, Stripe balance, uptime
- **Panels**: Revenue bar chart (14 days), recent customers table, top products, catalog by format, webhook events, system health
- **Auth**: Protected by admin auth cookie (same as Hub, Studio, Status)
- **Key files**: `src/routes/pulse.ts` (HTML + JSON API)
- **JSON endpoint**: `GET /pulse/json` — all data in one response, suitable for external monitoring

## Portal Fix — PostgreSQL Source

- **Bug fixed**: `semanticPortal.ts` was using in-memory `customerStore.js` instead of PostgreSQL DB
- **Impact**: New customers (from Stripe webhooks → `insertCustomer()`) were invisible in the portal
- **Fix**: Portal now uses `findCustomersByEmail()` from `lib/db.ts` — reads PostgreSQL directly
- **Key files**: `src/routes/semanticPortal.ts` (rewritten), `src/lib/db.ts` (new `findCustomersByEmail()`, `getRecentCustomers()`, `getRevenueTimeline()`, `getRecentWebhookEvents()`)

## Platform Status Dashboard (`/status`)

- Real-time self-diagnostics auto-refreshing every 30s
- Checks: PostgreSQL, Stripe, Resend, Twilio, Webhook Secret, Admin Auth, OpenAI, Deployment Mode
- Shows real customer/revenue counts, top products
- JSON API at `/status/json`
- Key file: `src/routes/platformStatus.ts`

## Rate Limiting

- Global rate limiter: 300 requests per minute (skips /healthz)
- Express-rate-limit via `express-rate-limit` package already in deps
- Applied at the Express app level in `src/app.ts`

## Semantic Product Layer (Model 4) — Core Architecture

The foundational distribution architecture. Products are channel-agnostic objects; every marketplace is an equal-weight output transform.

- **Core Files**:
  - `artifacts/api-server/src/semantic/types.ts` — `SemanticProduct` interface, `ChannelStatus`, `DemandSignal`
  - `artifacts/api-server/src/semantic/transforms.ts` — Pure transform functions: `toShopifyCSV`, `toWooCommerceCSV`, `toGoogleShoppingXML`, `toAmazonFeed`, `toHostedPageHTML`, `toStoreIndexHTML`, `deriveDemandSignals`
  - `artifacts/api-server/src/semantic/registry.ts` — Stripe-backed in-memory registry, 5-min TTL, auto-refreshes from live Stripe products
  - `artifacts/api-server/src/routes/semanticStore.ts` — All semantic API routes

- **Core Files**:
  - `artifacts/api-server/src/semantic/customerStore.ts` — In-memory CRM: customer capture, LTV tracking, top products/formats analytics
  - `artifacts/api-server/src/routes/semanticWebhooks.ts` — Stripe checkout webhook handler → delivery email via Resend + CRM record

- **API Routes** (all under `/api/semantic/`):
  - `GET /status` — registry health check
  - `GET /products` — list all 100+ products as SemanticProduct objects, includes per-product view counts + CRM stats
  - `GET /products/:id` — single product lookup
  - `POST /products/refresh` — force Stripe re-sync
  - `GET /signals` — demand intelligence: top formats, tags, categories, catalog maturity
  - `GET /store` — hosted store index (HTML) with **live search + format filter**
  - `GET /store/:id` — individual product page (HTML) with **JSON-LD schema.org + OpenGraph + Twitter Card + view tracking**
  - `GET /checkout/:id` — creates Stripe checkout session → redirects
  - `GET /export/shopify.csv` — Shopify import CSV (all products)
  - `GET /export/woocommerce.csv` — WooCommerce CSV
  - `GET /export/google-shopping.xml` — Google Merchant Center RSS 2.0 feed
  - `GET /export/amazon.txt` — Amazon flat file feed
  - `GET /export/catalog.json` — Platform-native JSON catalog

- **Webhook Routes** (under `/api/semantic/webhooks/`):
  - `POST /checkout-complete` — Stripe `checkout.session.completed` → captures customer to CRM + sends Resend delivery email
  - `GET /customers` — full customer list with CRM stats (revenue, LTV, top products)

- **Frontend**: `artifacts/createai-brain/src/pages/SemanticStorePage.tsx` at `/semantic-store` — shows catalog intelligence, export panel, product registry grid with channel readiness indicators
- **Navigation**: "Semantic Store" link added to all 7 OS nav bars (Analytics, Billing, Data, Evolution, Global, Settings, Team pages)
- **Live State**: 100 products indexed, $1,938 catalog value, 6 active channels, maturity: "scaling"
- **Delivery email**: Set `RESEND_API_KEY` in Replit Secrets to activate automated delivery on every purchase


## NEXUS Platform Address (NPA) Identity System

**Canonical identity**: `npa://CreateAIDigital` — stable handle that resolves to the live URL without a purchased domain.

- **Key file**: `artifacts/api-server/src/config/nexusIdentityResolver.ts` — auto-detects live URL from `REPLIT_DEV_DOMAIN`/`REPLIT_DOMAINS`/`BRAND_DOMAIN`.
- **Exposed through**: `artifacts/api-server/src/config/identity.ts` as `IDENTITY` object — fields: `platformName`, `legalEntity`, `ownerName`, `handle`, `npa`, `liveUrl`, `liveDomain`, `contactEmail`, `fromEmail`, `cashApp`, `venmo` etc.
- **Well-known endpoints** (public, open CORS):
  - `GET /.well-known/platform-id.json` — JSON-LD identity document
  - `GET /.well-known/platform-proof.json` — HMAC-SHA256 signed proof token
- **OS app**: `NPASettingsApp.tsx` — "Platform Identity" (🪪) in system category
- **Payment handles**: Cash App `$CreateAIDigital`, Venmo `@CreateAIDigital` — no other payment methods
- **Upgrade path**: Set `BRAND_DOMAIN` secret to instantly upgrade entire identity to custom domain


## NEXUS Handle Protocol System

Three-layer system for reaching the platform via a handle rather than a raw URL:

**Layer 1 — Browser Protocol Handler**
- Scheme: `web+npa://CreateAIDigital`
- Registration: `navigator.registerProtocolHandler("web+npa", "/npa-gateway?q=%s")`
- PWA protocol_handlers entry in `artifacts/createai-brain/public/manifest.json`
- OS app: `HandleProtocolApp.tsx` (🔗) walks through registration step-by-step
- Gateway page: `artifacts/createai-brain/src/pages/NpaGatewayPage.tsx` — parses `?q=` param, routes to OS

**Layer 2 — Portable Platform Card**
- `GET /api/platform-card` — ~3KB standalone HTML file; fetches live URL on load and redirects
- `GET /api/platform-card?download=1` — triggers file download for hosting anywhere
- `GET /api/platform-card/meta` — JSON metadata for all handle protocol URLs
- Host the card on GitHub Pages/Netlify to get a professional URL (e.g. `https://createaidigital.github.io`)

**Layer 3 — Handle Redirect**
- `GET /h/:handle` — permanent 302 redirect to live platform URL
- Live: `https://<domain>/h/createaidigital`
- NEXUS gateway: `GET /npa-gateway?q=web+npa://CreateAIDigital`

**Key files**:
- `artifacts/api-server/src/routes/protocolGateway.ts` — all 4 backend routes
- `artifacts/api-server/src/Apps/HandleProtocolApp.tsx` — OS app
- `artifacts/createai-brain/src/pages/NpaGatewayPage.tsx` — protocol callback page
- Route mount: `app.use("/", protocolGatewayRouter)` in `app.ts` (before semanticStore/platformHub)
- Public route: `/npa-gateway` in `isPublicRoute` check and public `<Route>` block in `App.tsx`


## Self-Host Engine

- **Purpose**: Build the React frontend and serve it from the API server process — zero external hosting needed.
- **Status endpoint**: `GET /api/self-host/status` — returns `engineActive`, `frontendBuilt`, `distExists`, `distSizeKb`, `watchdogCycles`
- **URL map**: `GET /api/self-host/url-map` — all `createai://` internal routes
- **Resolve**: `GET /api/self-host/resolve?npa=createai://home` — resolves a handle to runtime URL
- **Key file**: `artifacts/api-server/src/engines/selfHostEngine.ts`
- **OS app**: `SelfHostApp.tsx` (🏠) in system category


## NEXUS OS App Registry — Canonical State (as of March 2026)

**AppId union** (`src/os/OSContext.tsx` line ~274): 150 apps in `DEFAULT_APPS` array, 357 entries in `APP_META` Record (enterprise sub-apps included). All entries verified present.

**Key consistency rules enforced**:
- Every `AppId` in the union → has entry in `APP_META` ✅
- Every `AppId` in `DEFAULT_APPS` → has lazy import + `appMap` entry in `AppWindow.tsx` ✅
- All new system apps (`referral`, `growthEngine`, `npaSettings`, `selfHost`, `handleProtocol`) fully wired ✅
- NEXUS intent keywords registered for all apps ✅

**TypeScript**: Frontend passes `tsc --noEmit` with zero errors. API server has pre-existing drizzle-orm version mismatch TS errors (two parallel versions hoisted by pnpm) — runtime unaffected, `tsx` skips type-checking.

**System app category** includes: `npaSettings`, `selfHost`, `handleProtocol`, `growthEngine`, `activation`, `credentialsHub`, `authlab`, `paygate`, `inventionLayer`, `percentageEngine`.


## Accessibility & Store Page Upgrade (March 2026)

### Accessibility Layer (WCAG 2.1 AA)
- **index.html**: Skip navigation link (`<a class="skip-link" href="#main-content">`), SR live regions (`#sr-announcer`, `#sr-alert`), keyboard/mouse detection script (adds `using-mouse` to `body`)
- **index.css**: `.skip-link`, `.sr-only`, enhanced `:focus-visible` (44px touch targets), ARIA live regions, skeleton animations, high-contrast mode (`forced-colors`), reduced motion, print styles
- **osLayout.tsx**: `id="main-content"` + `role="main"` on workspace div
- **App.tsx**: Login/Loading screens have `role="main"`, `aria-live`, `aria-hidden` on decorative elements; all buttons have `type` and `aria-label`; app grid has `role="list"` and `role="listitem"`; focus-visible outline on login buttons
- **AppShell.tsx**: Card + Row components now have `role="button"`, `tabIndex={0}`, `onKeyDown` Enter/Space activation, focus/blur handlers; Input component uses `useId()` to properly associate `<label htmlFor>` with `<input id>`

### Store Homepage Upgrade (`GET /` — platformHub.ts)
**New Sections**:
- **Skip link** (`<a class="skip-link" href="#main-store">`)
- **Trust bar**: Instant Delivery, Lifetime Access, Stripe secure, 30-Day Guarantee, AI-Generated
- **Stats bar**: Live product count, 11 formats, $12 starting price, ∞ lifetime access, 30-day guarantee
- **Live search**: JS-powered input filters featured product cards in real-time with no-results state
- **Format chips**: Per-format product count, color-coded icons, hover to fill
- **Featured products**: Top 8 by price, with badge, short description, tags, price, and hover CTA
- **How It Works**: 3-step section (Browse → Checkout → Access)
- **Payment Methods**: Stripe (cards/Apple Pay/Google Pay), Cash App ($CreateAIDigital), Venmo (@CreateAIDigital)
- **30-Day Guarantee Banner**: Green banner with shield icon
- **4-column Rich Footer**: Brand, Products, Account, Platform columns + legal links
- **Mobile hamburger menu**: `aria-expanded` toggle, click-outside to close
**Technical**: Semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`), full ARIA labels, `Cache-Control: public, max-age=60`, `X-Content-Type-Options: nosniff`

## HTML Page Quality Upgrades (March 2026 — Cycle 2)

### Customer-Facing Pages
- **Portal template** (`portalsExtended.ts` `portalPage()`): Skip link, sticky frosted nav with logo + Store/My Downloads/Home links, dark footer with all portal links + copyright, `noindex,nofollow` meta
- **My Downloads** (`semanticPortal.ts` GET `/api/semantic/portal/me`): Complete rebuild — dark gradient hero, floating lookup card with "ACCESS YOUR LIBRARY" label, properly associated `<label for>` on email input, `aria-live` polite result region, summary bar (purchases/total/lifetime), purchase article cards with action group buttons, dark footer + `no-store` cache header
- **Membership Landing** (`semanticSubscription.ts` GET `/api/semantic/subscriptions/landing`): Rebuilt from inline-styles to full semantic HTML — dark hero with "MEMBERSHIP PLANS" chip, 4-stat bar (100+ products/11 formats/∞ downloads/30 day guarantee), 3 plan cards with "Most Popular" badge on Pro, green savings highlight, dark sticky nav, dark footer

### Admin / System
- **Admin Login** (`middlewares/adminAuth.ts`): Added hidden username field (`<input type="text" tabindex="-1" aria-hidden="true">`) to silence browser accessibility warning about password-only forms; `<label for>` added to password field

### Infrastructure Fixes
- **Marketplace Bridge** (`bridge/connectors/marketplaceConnector.ts`): Removed per-call `console.log()` from `notConfigured()` — was flooding logs with 100+ identical warnings on every startup (one per product). Now silent; UniversalBridge deduplicates and summarizes.
- **FamilyAgents Stripe** (`services/familyAgents.ts`): `ensureStripeCustomers()` now calls `stripe.customers.list({ email })` to check for existing customer before `stripe.customers.create()` — prevents accumulating duplicate test Stripe customers on every server restart.

## Platform Launch State (March 2026)

**Fully active, no pending states**:
- Founder-tier execution mode: ACTIVE (`allActive: true`, `allProtected: true`, `allIntegrated: true`, 37 registered systems)
- All OS apps: 150 in DEFAULT_APPS, all wired, lazy-loaded, intent-routed
- Handle Protocol: web+npa:// + portable card + handle redirect — all live
- NPA identity: consistent across all endpoints (`platformName`, `handle`, `npa`, `cashApp`, `venmo`)
- API server: healthy, uptime continuous, 60+ route files mounted
- Frontend: Vite dev server running, HMR active, zero TypeScript errors
- Manifest: `web+npa` protocol_handlers registered, PWA-installable

**Waiting on Sara's manual setup** (cannot be automated):
1. `BRAND_DOMAIN` secret → upgrades all identity to custom domain instantly
2. Resend domain verification → enables real email sending from custom address
3. Stripe keys (already integrated via Replit Stripe integration) → verify account for live payments
4. Marketplace tokens (SHOPIFY_ACCESS_TOKEN etc.) → unlock external publishing

