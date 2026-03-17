# CreateAI Brain – Workspace

## Real Data Platform (COMPLETE — No mock/demo data anywhere)

### DB Tables (18 total — all pushed to PostgreSQL)
- `users` — auth + NDA state
- `sessions` — session KV store
- `projects` — user-scoped projects (`status`: active/archived, `archivedAt`)
- `project_folders` + `project_files` — full file tree under projects
- `project_tasks` — NEW: task board items per project (status: todo/in-progress/done, priority, assignedTo, dueAt)
- `project_members` — NEW: project collaboration roles (viewer/editor/owner)
- `brainstorm_sessions` + `brainstorm_messages` — BrainGen sessions
- `conversations` — chat sessions (userId, appId, title, createdAt, updatedAt)
- `messages` — per-conversation messages (conversationId, role, content)
- `project_chat_messages` — project-specific chat history
- `activity_log` — universal activity feed (userId, action, label, icon, appId, projectId)
- `integrations` — user-registered integrations (name, type, category, status, isEnabled, configJson)
- `people` — contact registry (userId, name, email, phone, role, department, status, notes, addedAt)
- `notifications` — NEW: system/app notifications (userId, type, title, body, read, appId, projectId, actionUrl)
- `documents` — NEW: standalone documents (userId, projectId, title, body, docType, tags, isPinned, isTemplate)
- `opportunities` — opportunity tracking (userId, title, type, status, priority, score 0-100, market, estimatedValue, confidence, source, aiInsight, tags, isStarred)
- `imagination_sessions` — NEW: ImaginationLab creative session persistence (userId, engineId, engineName, topic, output, title, tags, isStarred)

### Real API Routes (all auth-protected, 401 if unauthenticated)
- `GET/POST /api/activity` — activity feed CRUD (supports `?limit=N`)
- `GET/POST /api/conversations`, `GET/POST /:id/messages`, `DELETE /:id` — chat persistence
- `GET/POST/PUT/DELETE /api/integrations` — integration registry
- `GET/PUT /api/user/me` — user profile
- `GET/POST/PUT/DELETE /api/projects` + files/folders endpoints — full ProjectOS
- `PUT /api/projects/:id/status` — archive/restore project (`{ status: "active"|"archived" }`)
- `GET/POST/PUT/DELETE /api/people` — full people/contact CRUD
- `POST /api/openai/engine-run` — run ANY engine with real streaming AI (engineId, topic, context → SSE stream)
- `POST /api/openai/meta-agent` — activate any of 6 Meta-Agents (ORACLE/FORGE/NEXUS/SENTINEL/PULSE/VECTOR) with real AI
- `POST /api/openai/brain-gen-ai` — BrainGen real AI content generator (type, topic, platform, tone → SSE stream)
- `GET/POST/PUT/DELETE /api/notifications` — notification center (+ `/read-all`, `/:id/read`)
- `GET/POST/PUT/DELETE /api/documents` — standalone document registry (pin, template support)
- `GET/POST/PUT/DELETE /api/projects/:id/tasks` — per-project task CRUD
- `GET/POST/PUT/DELETE /api/projects/:id/members` — project team management (roles: viewer/editor/owner)
- `GET /api/opportunities` — list all user opportunities
- `GET /api/opportunities/stats` — aggregate stats (total, won, in-progress, avg score, by type/status)
- `GET/PUT/DELETE /api/opportunities/:id` — opportunity CRUD
- `POST /api/opportunities` — create opportunity with type/status/priority/score/market/value/confidence/source/aiInsight/tags
- `POST /api/openai/engine-run (OpportunityEngine)` — AI scan + score opportunities (SSE stream)
- `POST /api/openai/series-run (opportunity)` — OPP-Series: OpportunityEngine + MarketResearchEngine + UniversalStrategyEngine
- `GET/POST/PUT/DELETE /api/imagination` — ImaginationLab session CRUD (save/load/star creative outputs)
- `POST /api/openai/engine-run (11 imagination engines)` — StoryEngine, CharacterEngine, WorldbuildingEngine, CreatureEngine, SuperpowerEngine, AdventureEngine, ComicPlotEngine, GameIdeaEngine, FutureTechFictionEngine, BlueprintFictionEngine, QuestEngine
- `POST /api/openai/series-run (imag)` — IMAG-Series: StoryEngine + CharacterEngine + WorldbuildingEngine
- `POST /api/openai/series-run (quest)` — QUEST-Series: CreatureEngine + SuperpowerEngine + AdventureEngine
- `POST /api/openai/series-run (fiction-tech)` — FICTION-TECH-Series: GameIdeaEngine + FutureTechFictionEngine + BlueprintFictionEngine

### Safety & Compliance Layer (server-side, ACTIVE)
- **Content Safety Filter** (`contentSafetyCheck()`) — applied to `/api/openai/engine-run`, `/api/openai/meta-agent`, `/api/openai/brain-gen-ai` before any AI call; blocks CBRN weapons, CSAM, targeted violence, malware creation, fraud/deception with structured 400 error response (`error: "content_policy_violation"`)
- **Compliance Disclaimer Injector** (`injectComplianceDisclaimer()`) — auto-appends regulated-industry notices to system prompts based on keyword detection: healthcare (HIPAA, clinical disclaimers), legal (attorney disclaimer), financial (investment disclaimer)
- Second layer: GPT-5.2 model's own safety training always active
- All generator app routes (`/chat`, `/generate`, `/simulate`, etc.) covered by model-layer safety

### Project Lifecycle (COMPLETE)
- `status` field added to projects API response (`buildProjectResponse`)
- `PUT /api/projects/:id/status` — archive/restore (already existed)
- **ProjectsApp** updated: Active/Archived toggle tabs, Archive button on each project card, Restore button on archived projects
- **ProjectOSApp** already had full archive/restore with `apiSetProjectStatus`, toggle, filtered lists

### Production Audit Completed (all apps)
- **PeopleApp** — fully rewritten with real `/api/people` (no PlatformStore)
- **DocumentsApp** — dual-tab: My Documents via `/api/documents` (create/edit/delete/pin/export) + Project Files from `/api/projects/all-files`
- **NotificationsApp** — NEW app: full notification center with mark-read, mark-all-read, delete, clear-all; registered in OSContext + AppWindow
- **MonetizationApp** — `credentials:"include"` fixed on offer funnel; `SaveToProjectModal` + Export button added to output
- **AdminApp** — real DB counts (projects, people), real audit log from `/api/activity`
- **ProjectOSApp** — archive/restore with Active/Archived toggle in sidebar; chat credentials fixed
- **All generator apps** — `credentials:"include"` on every fetch (BizDevApp, BizUniverseApp, BusinessCreationApp, BusinessEntityApp, ProjectBuilderApp, CreatorApp, MarketingApp, ToolsApp, SimulationApp)
- **ErrorBoundary** — global `<ErrorBoundary appName={label}>` wraps every app in AppWindow.tsx; shows graceful error + Reload button
- **Universal breadcrumb bar** — thin indigo-tinted bar below top header in every app showing "CreateAI Brain › {icon} {AppLabel}"
- **BrainHubApp** — NEW: full capability nerve center with all 25 engines, 6 Meta-Agents, 9 Series, real AI generation on every engine, "Save to Project" on every output, platform stats from DB; registered as "Brain Hub" in OS
- **CapabilityEngine.ts** — NEW: central engine registry with all 25 engines, 9 series definitions (Ω, Φ, UQ, ICE, AEL, UCP-X, GI, SE, DE, AB), `runEngine()`, `runMetaAgent()`, `saveEngineOutput()`, `fetchPlatformStats()` — all calling real backend APIs
- **TaskBoard in ProjectOSApp** — NEW: "📋 Tasks" view in ProjectOS with real Kanban board (To Do / In Progress / Done), add/move/delete tasks via `/api/projects/:id/tasks`, priority levels (low/medium/high) with color coding
- **22 registered apps** — all in OSContext/AppWindow/APP_LABELS/APP_ICONS/APP_COMPONENTS: chat, projects, tools, creator, people, documents, marketing, admin, family, integration, monetization, simulation, universal, business, entity, bizcreator, bizdev, projbuilder, projos, notifications, brainhub

### Universal Activity Logging
- All saves via `SaveToProjectModal` POST to `/api/activity`
- ProjectOSApp logs creates/renames/deletes to `/api/activity`
- Dashboard feeds from `/api/activity` (real recent activity) and `/api/projects` (real recent projects)

### ChatApp Persistence
- Creates a conversation in DB when first message is sent
- Persists all user + assistant messages to `/api/conversations/:id/messages`
- History panel shows past conversations, loads messages on select
- Delete individual conversations

### IntegrationApp Real Registry
- "Registry" tab: loads real integrations from `/api/integrations`
- Toggle on/off, delete — all persisted to DB
- Configure tab saves to DB after successful wizard flow

### FamilyApp Real Projects
- Loads real projects from `/api/projects` on mount
- Shows empty state if no projects yet

### SimulationApp Save to Project
- "💾 Save" button on every output panel
- SaveToProjectModal saves to chosen project + logs to activity feed

## Auth + NDA Flow (COMPLETE, FULLY LIVE)
### Three-tier access model
1. **Public (not logged in)**: Preview landing page — shows all 19 app icons, value props, "NDA required" notice, "Log in" CTA
2. **Logged in, NDA not signed**: Full NDA signing screen — scrollable legal agreement, name field, checkbox, "Sign & Unlock Access" button → `POST /api/auth/nda` → DB update + session update → instant access
3. **Logged in + NDA signed**: Full OS access — remembered forever, never asked again

### NDA implementation details
- DB: `usersTable.ndaSigned (boolean, default false)` + `usersTable.ndaSignedAt (timestamp nullable)`
- API: `POST /api/auth/nda` — auth required, updates DB + updates session in-place → returns updated user
- Frontend: `AuthGate` → `LoginScreen` → `NDAScreen` → full app (no page reload needed; `setUser()` updates React state in-place)
- `useAuth()` hook now exposes `refreshUser()` and `setUser()` for post-NDA state updates
- NDA signature stored in DB permanently — no re-signing after sign-out/sign-in

## Auth — Replit OIDC (COMPLETE, FULLY LIVE)
- **Auth package**: `lib/replit-auth-web` — `useAuth()` hook providing `{ user, isLoading, isAuthenticated, login(), logout() }`
- **API routes**: `GET /api/auth/user`, `GET /api/login`, `GET /api/callback`, `GET /api/logout`
- **DB tables**: `sessions` (KV store), `usersTable` (id, email, firstName, lastName, profileImageUrl, createdAt, updatedAt)
- **Session cookie**: `httpOnly`, `secure`, `sameSite: lax`, `path: /`
- **Auth middleware**: `authMiddleware.ts` wires `req.isAuthenticated()` + `req.user` on every request
- **All API routes guarded**: projects, brainstorm, projectChat — all require real session; data scoped by `userId`
- **Frontend auth gate**: `App.tsx` → `<AuthGate>` shows loading spinner → login screen → full OS
- **Login screen**: Dark gradient, indigo brand, 3 feature pills, "Log in to get started" button → navigates to `/api/login?returnTo=<base>`
- **Vite proxy**: `/api/*` → `http://localhost:8080` so `useAuth()` fetches + login redirects work in dev
- **PlatformStore**: default mode `"LIVE"`, no seed users — all users are real authenticated accounts
- **Dashboard greeting**: shows real user name from `useAuth()` (`firstName || email prefix`)

## Universal Demo + Test + Simulation Platform (COMPLETE)
**Entry**: SimulationApp → "✦ Universal Engine" tab → Shell

### Architecture
- `src/Apps/UniversalDemoEngine.tsx` — re-exports Shell as UniversalDemoEngine
- `src/platform/Shell.tsx` — 3-panel orchestrator (FiltersPanel + WorkspacePanel + GuidePanel)
- `src/platform/FiltersPanel.tsx` — left panel: industry grid, state, role, dept, orgType filters
- `src/platform/WorkspacePanel.tsx` — center: Workflows/Metrics/Entities views + DetailPanel split
- `src/platform/GuidePanel.tsx` — right: context-aware guide + streaming AI Q&A input
- `src/platform/components/` — TilesGrid, DetailPanel, MetricsStrip, ScenarioBuilder, SimulationResults, AuthModal, ProfileSetup

### Engine layer
- `src/engine/universeConfig.ts` — 14 industry configs, US states, org types, types
- `src/engine/generators.ts` — deterministic tile/metric/entity/drill/simulation generators
- `src/engine/guideEngine.ts` — contextual guide text for all modes/sections

### Key features
- **3 modes**: Demo (no login) → Test (email+NDA+profile) → Simulation (scenario builder)
- **3-panel layout**: collapsible filters + workspace + AI guide
- **Auth flow**: Test/Simulation → AuthModal → NDA → ProfileSetup → filters auto-populated
- **Profile persistence**: localStorage (cai_platform_profile, cai_platform_filters)
- **Simulation engine**: 4 sliders + scenario types → 5-tab results (impacts/metrics/depts/timeline/actions)
- **Infinite detail**: click any workflow tile → split-pane DrillContent (4 tabs: stages/docs/roles/metrics)
- **AI Guide**: streaming guide text + contextual Q&A against `/api/openai/universal-demo`
- **14 industries**: Healthcare, Legal, Finance, Education, Construction, Retail, HR, Tech, Gov, Nonprofit, Real Estate, Insurance, Manufacturing, Hospitality
- **Full Business Standard**: embedded in API system prompt + guide engine — all outputs business-grade, expert-level, industry-specific
- **Demo → Test → Activate flow**: Activate Platform CTA appears after NDA+profile, opens 3-step activation modal (overview → confirm → done)



## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `artifacts/createai-brain` (`@workspace/createai-brain`)

Full-stack AI OS platform — "CreateAI Brain" by Sara Stadler. React + Vite + Wouter + TailwindCSS.

**Platform:** 13 apps, 6 AI engines, 30+ tools, 12+ output types. Dark glass OS with indigo (#6366f1) accent.

**Dark Glass UI (fully applied across all 13 apps):**
- Global dark theme: `hsl(231,47%,6%)` background, `#6366f1` indigo primary throughout
- All light-mode badge classes (bg-green-100, bg-blue-100, bg-orange-100, bg-red-50) replaced with dark glass `rgba()` inline styles
- Status badges: `text-green-400` with `rgba(34,197,94,0.12)` background + `rgba(34,197,94,0.25)` border
- All apps verified: MonetizationApp, FamilyApp, DocumentsApp, ChatApp, Dashboard — fully dark glass

**Components built this session:**
- `src/os/ConversationOverlay.tsx` — dark glass AI chat overlay with streaming, animated brain avatar, pulse ring, OutputFormatter, empty orb state, typing indicator, app-context awareness
- `src/components/OutputFormatter.tsx` — fenced code blocks with copy button, info/warning/success/callout boxes, blockquote cards, italic support
- `src/components/MediaPlayer.tsx` — universal audio/video player with HTML5 APIs, progress bar, volume, skip ±10s, fullscreen, AudioTrack playlist card
- `src/os/Dashboard.tsx` — Platform Intelligence Strip: 6 engine pills (BrainGen, UCP-X, Simulate, Ad-Gen, Monetize, Streaming) + 4 stat cards (13 Apps, 30 Tools, 6 Engines, 12+ Output Types)
- `src/os/Sidebar.tsx` — Category-grouped sidebar (Core/Build/Business/System) with section headers and active indicator bars
- `src/index.css` — Cinematic CSS system: streaming-cursor, glass-overlay, neon-divider, stat-card, engine-pill, depth-ring, hover-lift, approval-banner, premium scrollbar, shimmer/glow effects, display-heading typography

**ChatApp workspaces (9 total):**
1. Main Brain · 2. Healthcare Demo · 3. Grants & Funding Explorer · 4. Business & Operations Builder
5. Marketing & Storytelling Studio · 6. CreateAI Messaging Hub · 7. Product & Launch Pad
8. Legal & Contracts Studio · 9. Creative Writing Lab
Workspace picker: scrollable dropdown with `maxHeight: min(520px, 70vh)` + styled scrollbar

**Key architecture:**
- `src/os/OSContext.tsx` — Preference Brain state, Global Brain `routeIntent()`, Infinite Expansion `appRegistry`
- `src/os/OSLayout.tsx` — Responsive 3-tier iOS-inspired layout (mobile/tablet/desktop)
- `src/os/Dashboard.tsx` — Global Brain search bar + intent routing
- `src/apps/` — 11 apps: Chat, Projects, Tools, Creator, People, Documents, Marketing, Admin, Family, Integration, Monetization
- `src/standalone/` — Standalone engines (all open in new tab)
  - `StandaloneLayout.tsx` — shared shell for all standalone products (sidebar nav, mode switcher Demo/Test/Live)
  - `HealthcareProduct.tsx` — full Healthcare standalone (8 sections + AI chat)
  - `GenericProduct.tsx` — infinite expansion engine (Finance, Marketing, Operations, etc.)
  - `creation/CreationStore.ts` — localStorage persistence for Creation Engine (`createai_creations_v1`, max 50 items)
  - `creation/CreationViewer.tsx` — universal type-adaptive standalone viewer (Movie/Comic/Software/Document/Marketing/Custom)
- `src/pages/StandalonePage.tsx` — Wouter route handler for `/standalone/:projectId`
- `src/pages/CreationPage.tsx` — Wouter route handler for `/standalone/creation/:creationId`

**Standalone URLs:**
- Projects: `/standalone/healthcare-legal-safe`, `/standalone/healthcare-mach1`, `/standalone/monetary-legal-safe`, `/standalone/monetary-mach1`, `/standalone/marketing-hub`, `/standalone/operations-builder`
- Creation Engine: `/standalone/creation/:id` where id = `{type}-{timestamp}`

**Everything Engine / Omega Creation Engine:**
- `CreatorApp.tsx` has two tabs: "⚡ Everything Engine" and "✨ Quick Generate"
- Everything Engine: Single natural-language textarea → `classifyIntent()` → Architecture Preview → SSE generation → localStorage → standalone product in new tab
- 8 creation types: movie, comic, software (SaaS), document, marketing, game, community, custom
- `classifyIntent(desc)` — keyword-based client-side intent detection → returns type, domain, modules[], patterns[], genre, style, tone
- `PATTERN_LIBRARY` — SaaS patterns (CRM, EMR, LMS...), Engines (Creation, Monetization...), Modules (Auth, Billing, Scheduling...), Domains (healthcare, finance, education, retail, creative, community, game)
- Architecture Preview Card — shows detected type, confidence, modules, patterns before building
- 10 Quick Start Templates — one-click prompts for common build types
- `buildPrompt()` generates domain+module-aware prompts for each type
- Standalone products: movie (scenes+script+characters+marketing), comic (panels+characters+marketing), software (dashboard+modules+data model+API+docs+marketing), document (full doc+ToC), marketing (landing+funnel+emails+ads), game (gameplay+story+levels+characters+economy), community (features+members+events+marketing), custom
- `parseSections()` splits on `== SECTION NAME ==` markers
- New game type has nav: Overview, Gameplay, Story & World, Levels, Characters, Economy, Marketing, AI, Downloads
- New community type has nav: Platform, Features, Members, Content, Events, Marketing, AI, Downloads
- Software type has nav: Dashboard, Features, Modules, Workflows, Data Model, Docs, Marketing, AI, Downloads

**Omega Packet Engine (CreationViewer v3):**
- `OMEGA_NAV` constant: Packet AI (packetai), Tools (tools), Design (design), AI Chat (ai), Downloads — appended to every type's nav
- `editedSections` state in CreationViewer: allows Packet AI to update sections in-memory; propagates via `editedCreation`
- `selectedTheme` / `themeColor` state: Design section calls `onThemeChange` → updates `meta.color` live
- `PacketEditor` component: Edit Sections tab (quick actions, section dropdown, instruction textarea, SSE section rewrite) + Chat tab (freeform AI chat)
- `ToolsSection`: `TOOLS_BY_TYPE` registry (5 tools for software, 4 for movie/game/community, 3 for comic/document/marketing) → each tool is a `ToolCard` that expands into a mini interactive UI
- Mini tool UIs: FormBuilderUI, WorkflowUI, DashboardConfigUI, PricingConfigUI, SceneBuilderUI, CharacterSheetUI, LevelDesignerUI, QuestPlannerUI, EconomyUI, OnboardingUI, ContentCalendarUI, HeadlineGeneratorUI, PersonaBuilderUI, OutlinerUI, ApiExplorerUI
- `DesignSection`: `DESIGN_THEMES` (4 themes per type), `FONT_PAIRS` (3 options), `LAYOUT_OPTIONS` (Minimal/Rich/Focused); clicking a theme calls `onThemeChange`
- Section editing flow: user selects section → types instruction → clicks "Update This Section" → SSE generates new content → `handleSectionUpdate()` replaces section in `editedSections` → all renderers immediately see updated content

**Project Intelligence Layer (new):**
- `src/engine/TemplateLibrary.ts` — Universal content template library. 11 `ProjectType` values: `brochure | website | landing-page | training | marketing | product-launch | game | comic | movie | app-saas | custom`. Each type exports a `ProjectTemplate` with: `navItems[]`, `sections[]` (with `TemplateSectionBlock[]`), `tourSteps[]`, `suggestedModules[]`, `layoutMode`, `color`, `gradient`, `safetyNote?`.
- `src/engine/ProjectIntelligence.ts` — Smart type detector (`detectProjectType(desc)`), domain safety map (Healthcare/Legal/Finance get `demoOnly+warningNote+requiresExpertReview`), `mapCreationTypeToProjectType()` bridges CreationStore ↔ TemplateLibrary, `createProjectHelper(type, domain)` returns per-project `ProjectAIHelper` with `suggest(sectionId)`, `generateOutline()`, `safetyReminder()`.

**Presentation Layer (new):**
- `src/components/presentation/PresentationLayout.tsx` — Shared full-page layout (NO OS chrome). Props: title, icon, gradient, sections[], activeSection, stats[], tourSteps[], onBack, topAction. Contains sticky nav bar, HeroBlock, StatsBar, section nav tabs, main content area, footer. Auto-includes AITourMode.
- `src/components/presentation/AITourMode.tsx` — Floating 🧭 Guided Tour button (bottom-right). Opens a step-through panel with progress bar, dots, prev/next navigation, dismissible. Props: `steps[]`, `productName`, `accentColor`.
- `src/components/widgets/WidgetLibrary.tsx` — Reusable safe UI building blocks: `HeroBlock`, `StatsBar`, `FeatureGrid`, `SectionContainer`, `Timeline`, `Stepper` (interactive step-through), `TabPanel`, `CardWidget`, `TestimonialBlock`, `RoadmapWidget`, `FAQWidget` (accordion), `StoryboardPanel` (comic/movie panels), `ImagePlaceholder`, `SafetyNotice`.

**Routing:**
- `/` → `OSLayout` (OS with sidebar, Dashboard, AppWindow)
- `/project/:projectId` → `ProjectPage` (standalone, uses PresentationLayout — NO OS chrome)
- `/standalone/:projectId` → `StandalonePage` → `HealthcareProduct` or `GenericProduct` (uses StandaloneLayout — opens in new tab from OS)
- `/standalone/creation/:creationId` → `CreationPage` → `CreationViewer` (uses StandaloneLayout)

**ProjectPage projects (6):**
- `healthcare-legal-safe` — green gradient, 5 tour steps, safety note, roadmap, FAQ, testimonials
- `healthcare-mach1` — purple gradient, FUTURE mode, vision platform
- `monetary-legal-safe` — blue gradient, finance demo, safety note
- `monetary-mach1` — orange gradient, FUTURE financial architecture
- `marketing-hub` — red/pink gradient, campaigns+email+ads+social
- `operations-builder` — indigo gradient, TEST mode, 34 mock workflows

**Universal Interaction + Conversation + Test Mode Engine (complete):**
- `src/engine/ConversationEngine.ts` — Full NLP intent parser + conversation + quiz engine
  - 18 intent types: switch-role, switch-agency, switch-state, switch-vendor, switch-department, switch-user-type, switch-demo-status, navigate, open-packet, walk-through, simulate, show-form, show-data, test-me, test-answer, status-check, explain, next-step, back-step, reset, help, unknown
  - 21 compiled RegExp pattern arrays — matches natural language across all intents
  - Entity extraction: auto-extracts roles/agencies/states/vendors/departments from free text
  - Screen mapping: maps every intent to the correct `UniversalView` target
  - Response templates: 2–3 per intent with variable substitution (entity, label, topic)
  - Walk-through generator: topic-aware step-by-step narrative (submission, enrollment, packet, role, full flow)
  - Simulate handler: scenario-aware fictional outcome narratives
  - Status-check: builds live session context summary
  - 12-question quiz bank covering: roles, submission-flow, agencies, demo-status, programs, vendors, packets, regulatory, workflows, states, action-log
  - `startTest(topic)`, `nextTestQuestion()`, `gradAnswer(input)`, `quizSummary()` — full quiz lifecycle
  - Grading: letter (A/B/C/D) or text matching; tracks score/totalAnswered; "You missed X" feedback + explanation
  - `process(input)` — single entry point: detects intent → extracts entity → applies state update → returns userMsg + systemMsg + intent
  - Rolling 200-entry conversation history in localStorage key `"createai_conversation_v1"`
  - `addSystemMessage(text)` — inject programmatic messages into history
- `src/os/ConversationContext.tsx` — React context
  - `ConversationProvider` sits inside `InteractionProvider` in App.tsx
  - `useConversation()` exposes: history, testSession, lastIntent, isOpen, isExpanded, unread, setOpen, setExpanded, send, clear, refresh
  - `send(text)` auto-applies detected stateUpdate to InteractionEngine and dispatches action log entry
  - Auto-navigates to the detected target screen via `interaction.setView()`
  - Unread counter increments when new system messages arrive while panel is closed
- `src/os/ConversationOverlay.tsx` — Persistent floating chat panel (every screen)
  - Lives in `osLayout.tsx` — rendered on every app and home screen, above all content
  - Collapsed: animated "🧠 Ask the Brain" pill button with unread badge
  - Expanded: 340–380px wide floating panel with: session context bar, 12 quick-action chips, message thread, disclaimer, send button, 🎤 voice input (Web Speech API)
  - Voice: holds listening state, transcribes, auto-sends
  - Expand/collapse height toggle; 🗑 clear; × close
  - Typing indicator (3-dot bounce animation)
  - `TalkScreen` in `UniversalApp.tsx` — full-screen version of conversation history + identical input bar
- `UniversalApp.tsx` updated:
  - Nav now has 11 items including "🧠 Talk / Test" screen
  - TalkScreen: gradient header, 12 quick chips in 2 rows, full message thread, voice input, quiz score badge
  - Both TalkScreen and ConversationOverlay share the same ConversationEngine and history
- `App.tsx` provider nesting: QueryClientProvider > TooltipProvider > InteractionProvider > ConversationProvider > OSProvider > Router

**Universal Interaction Engine (complete):**
- `src/engine/InteractionEngine.ts` — Universal state management + comprehensive mock data
  - 9 universal state fields: currentRole, currentDepartment, currentAgency, currentState, currentVendor, currentView, currentUserType, currentPacket, currentDemoStatus
  - Full mock data lists: 15 roles, 15 departments, 18 agencies, 51 states, 20 vendors, 15 healthcare categories, 20 provider types, 12 payer types, 16 facilities, 16 programs, 22 services, 10 user types, 8 demo statuses
  - `ActionLogEntry` — id, timestamp, action, field, previousValue, newValue, screen; rolling 200-entry log
  - `UniversalInteractionEngineClass` — setRole/setDepartment/setAgency/setState/setVendor/setView/setUserType/setPacket/setDemoStatus/dispatchAction/clearLog/reset/getStats
  - All state persisted to localStorage key `"createai_interaction_v1"`
  - All actions are INTERNAL ONLY — no real APIs, no real data, no real submissions
- `src/os/InteractionContext.tsx` — React context wrapping entire OS
  - `InteractionProvider` wraps `OSProvider` in `App.tsx` — available across all 12 apps
  - `useInteraction()` hook exposes full state + all setters
- `src/Apps/UniversalApp.tsx` — 16-screen universal dashboard (incl. Industries, Workflows, Creative, Games, Story/World)
  - Own mini-sidebar nav: Home, Dashboard, Roles, Agencies, States, Vendors, Programs, Packets, Submissions, Settings
  - Home: session summary, quick role pills, quick action buttons, recent log
  - Dashboard: 8 stat cards, full state table, action log with 200-entry history
  - Roles: all 15 roles as cards — click to activate, detail drilldown, Change Role button
  - Agencies: all 18 agencies — click to activate, detail drilldown, category badges
  - States: searchable grid of 51 states — click to set active state
  - Vendors: filter by category, 20 vendors, status badges (active/demo), detail drilldown, Send (mock)
  - Programs: filter by domain, 16 programs, Enroll (mock) + View Details flows
  - Packets: all Integration Engine packets — Open Packet → detail → Submit/Send flows
  - Submissions: demo status picker (8 statuses), 3-step Submit flow (Next/Back/Submit), log of all submissions
  - Settings: user type picker, department picker, reference data counts table, log actions, Reset with confirm
  - All flows wired: Submit, Send, Next, Back, View Details, Open Packet, Change Role, Change Agency, Change State, Change Vendor
  - Mobile-responsive: hamburger overlay nav on narrow screens
  - All screens show MockOnlyBanner — internal demo disclaimer
- App.tsx: InteractionProvider wraps OSProvider — context available in ALL apps
- OSContext.tsx: `AppId` includes "universal" and "simulation"; DEFAULT_APPS has both entries
- SimulationApp.tsx: New app with 3 tabs — Simulate (12 domains), Gap Analyze, Ad Packets (human approval required)
- BusinessCreationApp.tsx: New app "BizEngine" (🏗️) — 6-layer conceptual business design engine; left profile panel (industry, region, size, stage, focus); 6 layer tabs; per-layer AI generation + "Generate Full Plan" sequential all-layers button; progress tracker; seed framework cards shown as scaffolding; routes to `/api/openai/business-creation`
- API: `/api/openai/simulate` (universal simulation engine), `/api/openai/ad-gen` (advertising packet generator), and `/api/openai/business-creation` (Master Business Creation Engine — 6 layers × detailed structured instructions) added
- ToolsApp: Organized into 4 sections — Build (15 tools), Simulate (8 tools), Advertise (6 tools), Custom; routes to correct endpoint per section
- osLayout.tsx: `APP_COMPONENTS["universal"]` = UniversalApp

**Internal Connection Layer (complete) — `ConnectionEngine.ts`:**
- 31 typed nodes across 7 categories: module (9), flow (5), dashboard (3), data-structure (4), demo-packet (3), ui-state (4), brain-logic (4+)
- `ConnectionNode` interface: id, type, name, description, links[], status (active/ready/blueprint), metadata
- `NODE_TYPE_CFG` — icon, color, bg per type for rendering
- `ConnectionEngine.getAllNodes()`, `getByType(type)`, `getNode(id)`, `getLinked(id)`, `getStats()`
- All connections INTERNAL ONLY — non-operational outside system; blueprint nodes flagged explicitly
- Visible in Admin → 🕸️ Connection Layer (grouped by type, shows linked node chips, active/blueprint badges)

**Regulatory Readiness Blueprint Layer (complete) — `RegulatoryEngine.ts`:**
- 6 pre-built blueprints: HIPAA, GDPR, SOC2 Type II, Medicare/Medicaid Pathway (fictional structural), ADA/WCAG 2.2, FINRA/SEC (fictional structural)
- `RegulatoryBlueprint` interface: domain, framework, title, status, clauses[], dataGovernance[], accessPatterns[], securityFlows[], auditTrail[], consentFlows[], complianceNotes[], gapAnalysis[], disclaimer
- `RegulatoryClause` interface: reference (§), title, description, mockStatus (mapped/partial/gap/not-applicable), implementationNote
- `ConsentFlow` and `AuditTrailSpec` interfaces — each with mockOnly: true flag
- Every blueprint has full DISCLAIMER string: "Internal, Non-Operational, Not Legally Binding"
- Medicare/Medicaid and FINRA/SEC blueprints carry extra: "NOT affiliated with [agency]"
- `RegulatoryEngine.getAll()`, `getById(id)`, `getByDomain(domain)`, `getStats()`
- Visible in Admin → 📜 Regulatory Blueprints (list view → detail with clause table, gap analysis, audit trail spec, compliance notes)
- `RegulatorySection` is a proper React component (no hooks-in-conditional violation)

**Future Backend Blueprint Layer (complete) — `BackendBlueprintEngine.ts`:**
- 5 blueprints: Auth & Identity, Creation Engine API, Integration Engine API, User & Access Management, Regulatory Readiness API
- `BackendBlueprint` interface: dataModels[], apiEndpoints[], security SecuritySpec, loggingPatterns[], errorPatterns[], designNotes[], disclaimer
- `ApiEndpointSpec`: method, path, description, roles[], requestFields?, responseFields?, rateLimit?, exampleRequest?, exampleResponse?, errorCodes[]
- `SecuritySpec`: authMethod, tokenType, scopeModel[], sessionTimeout, mfaRequired, rateLimiting, ipAllowlist, notes[]
- `LoggingSpec`: event, level (DEBUG/INFO/WARN/ERROR), fields[], retention, alertOn?
- `ErrorPattern`: code, name, description, userMessage, action
- Total: 25 API endpoints, 8 data models across 5 blueprints
- `BackendBlueprintEngine.getAll()`, `getById(id)`, `getByDomain(domain)`, `getStats()`
- Visible in Admin → 🏗️ Backend Blueprints (list → detail with data models, endpoint table, security spec, error patterns, design notes)
- `BackendBlueprintsSection` is a proper React component (no hooks-in-conditional violation)

**Admin Dashboard expanded:**
- SECTIONS now includes: 🕸️ Connection Layer, 📜 Regulatory Blueprints, 🏗️ Backend Blueprints
- All three sections are proper React components rendered conditionally from AdminApp
- Engine list updated in debug panel to reflect 9 engine modules

**Demo-Only Mock Integration Engine (complete):**
- `src/engine/IntegrationEngine.ts` — 23 fictional demo packets across 9 categories (Healthcare: Epic EHR, Cerner, Telehealth, Pharmacy; Finance: Stripe, Plaid, QuickBooks; CRM: HubSpot, Salesforce, Pipedrive; Marketing: Mailchimp, SendGrid; Messaging: Twilio, Slack; Storage: Google Drive, Notion; Automation: Zapier, Jira; AI: OpenAI, Anthropic, Document AI; Analytics: Google Analytics; Communication: Zoom)
- `DemoPacket` interface: id, name, vendor, category, icon, color, description, features[], dataFlows[], scope[], endpoint, status, submittedAt?, connectedAt?, safetyNote, isAutoGenerated?
- `PacketStatus` lifecycle: "ready" → "pending" → "submitted" → "connected-demo"
- `ACTIVATION_PHRASES[14]` — includes "prepare everything", "load all connections", "set up the demo", "activate all", "connect everything", "submit all", "ready to demo", etc.
- `detectActivationPhrase(text)` — checks text against all 14 phrases
- `IntegrationEngine` methods: `getAllPackets()`, `updatePacket()`, `submitPacket()`, `connectPacket()`, `resetPacket()`, `prepareAll()`, `submitAll()`, `connectAll()`, `resetAll()`, `autoGenerate(name)`, `getStats(packets)`
- `autoGenerate(name)` — builds fictional demo packet on-the-fly for any requested integration name, marked `isAutoGenerated: true`
- localStorage key: `"createai_integration_packets_v1"` — only stores packets that differ from default "ready" state
- `IntegrationApp.tsx` completely rebuilt: two-tab layout ("Demo Packets" | "Configure")
  - Demo Packets tab: stats bar (Total/Pending/Submitted/Connected), activation phrase search input, "⚡ Prepare Everything" gradient button (staggered: pending → submitted → connected-demo over ~3s), "+ Auto" form for on-demand packet generation, status filter pills (All/Ready/Pending/Submitted/Connected), PacketCard components (expandable, shows features/dataFlows/scopes/mock endpoint, per-packet Submit/Connect/Reset actions, animated spinner on submit), activity log (last 50 actions), safety notice banner
  - Configure tab: existing step-by-step wizard for 4 integrations (EHR, Payment, CRM, Email) with mock credential fields
  - ALL actions are internal simulation only — no real network calls, no real connections, no real data
- Safety: every packet has `safetyNote` field explicitly stating demo-only status; healthcare/finance packets have extra-explicit disclaimers

**Engine Expansion Layer (v3):**
- `src/engine/ExportEngine.ts` — Safe local-only export stubs: `exportAsJSON(creation)` → .json, `exportAsMarkdown(creation)` → .md, `exportAsText(creation, sectionTitle?)` → .txt, `copyToClipboard(text)` → navigator.clipboard fallback. `EXPORT_OPTIONS[]` descriptor array. All filenames include `_MOCK` suffix. No network calls.
- `src/engine/ThemeEngine.ts` — Accent color palette: `ACCENT_COLORS[10]` (blue, purple, green, red, orange, teal, indigo, pink, slate, gold). `getBrandProfile(colorIdOrHex)` returns `BrandProfile` with gradient, surface tint, button/badge styles. `PRESET_THEMES[6]` bundles (Midnight/Daybreak/Executive/Creative/Growth/Fire). `applyAccentToDocument(id)` / `resetAccentOnDocument()` set CSS variable `--color-accent`.

**CreationStore v2 (updated):**
- `Creation` interface extended with: `status?: CreationStatus`, `tags?: string[]`, `collectionId?: string`, `themeColor?: string`, `snapshots?: CreationSnapshot[]`
- `CreationStore` new methods: `updateStatus`, `addTag`, `removeTag`, `setTheme`, `createSnapshot` (max 10 per item), `restoreSnapshot`, `getByStatus`, `getByCollection`, `getByTag`, `getAllTags`

**Gallery v2 (updated in CreatorApp.tsx):**
- Filter pills: All / Draft / In Progress / Complete / Archived / tag filters
- Status badge (colored pill) shown per creation
- Tags shown as `#tag` pills
- Quick action row per card: cycle status / clipboard copy / delete
- Filter by tag: click `#tagname` pill

**Downloads v2 (updated in CreationViewer.tsx DownloadsSection):**
- Export Formats grid: JSON (.json), Markdown (.md), Copy Summary (clipboard), Full Text (.txt)
- Individual Sections: up to 5 section-level .txt downloads
- All export handlers inline (no imports needed from ExportEngine)

**Admin Debug Panel (new in AdminApp.tsx):**
- Section card "🔬 Debug Panel" in Admin app
- Drill-down shows live system state: timestamp, mode, registered apps count, creations count, creation types, all tags, localStorage keys, engine modules, safety status, version string
- Read-only, no side effects

**SSE streaming:** `fetch` + `ReadableStream` only. Model: `gpt-5.2`, max_completion_tokens: 8192. API key via `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`.

**Colors:** Primary `#007AFF`, never change. All content is mock/simulation only.

**BrainGen Universal Content Engine (v1 — latest):**
- `src/engine/BrainGen.ts` — Universal instant content generator powering every app's "Generate" action
- Exports: `generateSocialPost(topic, platform, tone)`, `generateEmail(topic, emailType, tone)`, `generateAdCopy(topic, adType)`, `generateBlog(topic, length)`, `generateVideoScript(topic, format)`, `generateCampaign(goal, audience, timeline)`, `generateDocument(topic, docType)`, `generate(prompt)`, `generatePlatformWelcome(appName)`
- All generators return `GenResult { id, type, topic, label, content, createdAt }` — structured output immediately
- `BrainGen` default export is a namespace object wrapping all generators
- `generate(prompt)` delegates to `ConversationEngine.generateSmartContent(prompt)` for catch-all generation
- Social post platforms: Instagram, LinkedIn, Facebook, Twitter, TikTok, General — each has platform-specific hook styles
- Email types: Welcome, Follow-Up, Nurture, Promotional — each full template
- Campaign planner: week-by-week timeline, audience profile, content plan, success metrics

**MarketingApp — Complete Rebuild (was broken):**
- Was: completely broken (invalid React pattern, dead hook calls at component root using `useChatStream`)
- Now: full marketing platform with 5 tabs: Home, Create, Campaigns, Analytics, History
- **Home**: stat strip (reach, conversions, revenue), quick generate buttons, active campaign list, recent content, analytics link
- **Create** (GenerateView): 5 content types × platform/tone/subtype selectors → instant BrainGen output → opens ResultViewer
- **Campaigns** (CampaignView): tab between Campaign List (4 seeded campaigns with stats) and Plan a Campaign (goal+audience+timeline → BrainGen plan)
- **Analytics** (AnalyticsView): 6 stat cards, channel breakdown bar chart (Email 42%, Social 28%, Ads 18%, Organic 12%), top campaign highlight
- **History** (HistoryView): all generated items, tap to re-open ResultViewer
- **ResultViewer**: displays generated content with Copy + Save actions
- All content generated by BrainGen — no external API calls. All output is fictional/internal.

**DocumentsApp — BrainGen upgrade:**
- "New Document" → "🧠 Generate Document with Brain" — calls `BrainGen.generateDocument(name, type)` with 700ms spinner
- Generated docs show Brain-generated content in `<pre>` block (not sections)
- `UserDoc` interface extended with `generatedContent?: string`
- Export .txt works for both predefined and generated docs

**FamilyApp — BrainGen upgrade:**
- Document viewer: empty docs show "Generate with Brain" prompt state → `BrainGen.generateDocument(name, type)` on tap
- Content stored in `docContent: Record<string, string>` state — persists within session
- "🔄 Regenerate" button appears once content exists

**ProjectsApp — BrainGen upgrade:**
- Generic project items replaced with `BrainProjectItems` component
- 3 items per section: Overview, Details, Next Steps — each has "🧠 Generate" button
- Generate calls `BrainGen.generate()` with 600ms spinner; shows first 400 chars with Copy button
- No more "Item 1/2/3 (Mock)" placeholder text

**Critical notes:**
- `<Select<T>>` generic JSX syntax breaks Babel — use `SelectPills` (non-generic) instead
- Never call hooks outside React components or at module root
- `BrainGen.ts` path: `src/engine/BrainGen.ts` — import as `@/engine/BrainGen`

**UCP-X Supercharged Add-On Layer (v1 — latest):**
- Manifest: "UCP-X Supercharged Infinite Add-On" — fully additive, never overrides core
- `src/engine/InfiniteExpansionEngine.ts` — core engine for all UCP-X expansion functionality
- `src/ucpx/UCPXAgent.tsx` — floating Meta-AI agent panel, injected into osLayout globally
- Injected at: `osLayout.tsx` → `<UCPXAgent />` (renders floating ⚡ button + panel on every screen)

**6 Meta-AI Agents (META_AGENTS constant):**
- ORACLE (🔮) — Predictive Intelligence · 18-month forecasts, risk modeling, cross-temporal predictions
- FORGE (⚡) — Content & Package Builder · Infinite generation, module packaging, distribution
- NEXUS (🕸️) — Cross-Domain Integration · Workflow automation, API bridging, multi-agent collaboration
- SENTINEL (🛡️) — Risk & Compliance · Real-time checks, regulatory, quality assurance
- PULSE (💓) — Emotional & Engagement AI · Sentiment, emotional simulation, engagement optimization
- VECTOR (💎) — Revenue & Distribution · Autonomous revenue optimization, packaging, live deployment
- Each agent: id, name, role, specialty, color, icon, status (active/running/idle/complete), taskCount, lastOutput?
- `InfiniteExpansionEngine.activateAgent(id, task)` — runs agent, returns InfiniteModule, increments taskCount

**11 Core Engines (CORE_ENGINES constant):**
- Intent, Planning, Story, Character, World, Mechanics, Workflow, Data, State, Assembly, Deployment
- All shown as active (green status dots) in the UCP-X Engines tab

**InfiniteExpansionEngine singleton:**
- `generateModule(domain?, agentId?)` — generates InfiniteModule (module/insight/prediction/workflow/innovation)
- `generateCrossDomainInsight()` — returns CrossDomainInsight with fromDomain, toDomain, connection, insight, impact, confidence
- `activateAgent(id, task)` → InfiniteModule
- `expandAll()` → 5 modules across 5 domains
- `getAgents()`, `getModules()`, `getInsights()`, `getTour()`
- INSIGHT_BRIDGES[10] — hardcoded cross-domain connection pairs (Healthcare↔Marketing, Gaming↔Education, etc.)

**UCPXAgent panel (5 tabs):**
- Agents tab: 6 agent cards with status, task count, expandable + run-task form
- Engines tab: 11 core engine status list + UCP-X layer summary
- Expand tab: domain + agent + type selectors → generate module or Expand All (5 domains)
- Insights tab: Cross-domain insights generator with confidence bars, impact badges
- Tour tab: 7-step interactive guided tour (progress bar, prev/next nav, completion state)
- Result overlay: ModuleCard with content display, Copy button, back nav
- Floating trigger: bottom-right, gradient indigo→blue, ⚡ icon, green pulse dot when agents are active

**PlatformStore (src/engine/PlatformStore.ts) — Shared cross-app state layer:**
- `PlatformMode` = "DEMO" | "TEST" | "LIVE" — persisted in localStorage, accessible from every app via `useOS().platformMode`
- `PlatformUser` — id, name, email, phone, role, tags, status (Active/Invited/Pending), addedAt, createdBy
- `PlatformStore.getUsers()` — returns seed users + any added ones (from localStorage)
- `PlatformStore.addUser()` — saves to localStorage, fires `cai:users-change` event
- `PlatformStore.updateUserStatus()` — fires `cai:users-change` event
- `PlatformStore.removeUser()` — protects Sara Stadler from removal
- `PlatformStore.getMode()` / `setMode()` — fires `cai:mode-change` event (OSContext listens)
- `PlatformStore.getRecent()` / `pushRecent()` — recent activity log (last 8 items)
- `PlatformStore.generateInviteLink(name)` — generates base64-encoded invite URL
- `PlatformStore.generateInviteMessage(name, role, link)` — full personalized invite message

**Cross-app wiring (as of this session):**
- OSContext: `platformMode` state + `setPlatformMode()` — dispatches to all apps via event
- Dashboard: live mode badge (orange/blue/green dot), clickable mode menu, real recent activity from PlatformStore
- PeopleApp: reads from PlatformStore.getUsers(), saves new people, status toggles, manual add form, parse-and-save bulk invite, Brain-generated invite messages with copy+mailto+sms links
- AdminApp Users section: reads live user count and list from PlatformStore, status toggle + remove + quick invite with link generation
- AdminApp Mode Switcher: now calls OSContext.setPlatformMode() → propagates everywhere
- AdminApp Live Mode: now actually allows activating Live Mode with informational confirmation
- MonetizationApp: "Stage This Opportunity" now calls BrainGen to generate real email sequence + campaign plan + ad copy (3 parallel generators) before showing the green confirmation

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
