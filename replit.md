# Workspace

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

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
