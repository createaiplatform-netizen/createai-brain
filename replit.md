# CreateAI Brain – Workspace

## Overview

The CreateAI Brain is a full-stack AI OS platform, developed as a pnpm monorepo using TypeScript. It aims to provide a comprehensive suite of AI-powered applications and tools within a unified, multi-sensory spatial interface. The platform supports a wide range of functionalities, including content generation, project management, communication, and specialized applications for various industries.

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


## Semantic Product Layer (Model 4) — Core Architecture

The foundational distribution architecture. Products are channel-agnostic objects; every marketplace is an equal-weight output transform.

- **Core Files**:
  - `artifacts/api-server/src/semantic/types.ts` — `SemanticProduct` interface, `ChannelStatus`, `DemandSignal`
  - `artifacts/api-server/src/semantic/transforms.ts` — Pure transform functions: `toShopifyCSV`, `toWooCommerceCSV`, `toGoogleShoppingXML`, `toAmazonFeed`, `toHostedPageHTML`, `toStoreIndexHTML`, `deriveDemandSignals`
  - `artifacts/api-server/src/semantic/registry.ts` — Stripe-backed in-memory registry, 5-min TTL, auto-refreshes from live Stripe products
  - `artifacts/api-server/src/routes/semanticStore.ts` — All semantic API routes

- **API Routes** (all under `/api/semantic/`):
  - `GET /status` — registry health check
  - `GET /products` — list all 100+ products as SemanticProduct objects
  - `GET /products/:id` — single product lookup
  - `POST /products/refresh` — force Stripe re-sync
  - `GET /signals` — demand intelligence: top formats, tags, categories, catalog maturity
  - `GET /store` — hosted store index (HTML, publicly accessible)
  - `GET /store/:id` — individual product page (HTML, Stripe checkout button)
  - `GET /checkout/:id` — creates Stripe checkout session → redirects
  - `GET /export/shopify.csv` — Shopify import CSV (all products)
  - `GET /export/woocommerce.csv` — WooCommerce CSV
  - `GET /export/google-shopping.xml` — Google Merchant Center RSS 2.0 feed
  - `GET /export/amazon.txt` — Amazon flat file feed
  - `GET /export/catalog.json` — Platform-native JSON catalog

- **Frontend**: `artifacts/createai-brain/src/pages/SemanticStorePage.tsx` at `/semantic-store` — shows catalog intelligence, export panel, product registry grid with channel readiness indicators
- **Navigation**: "Semantic Store" link added to all 7 OS nav bars (Analytics, Billing, Data, Evolution, Global, Settings, Team pages)
- **Live State**: 100 products indexed, $1,938 catalog value, 6 active channels, maturity: "scaling"

