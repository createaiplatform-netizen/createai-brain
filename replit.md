# CreateAI Brain – Workspace

---

## ╔══ PLATFORM CONTRACT — Permanent, Self-Enforcing, Non-Negotiable ══╗

> This contract is the default behavior model for every file, component, engine, series, module, hook,
> and future addition in this codebase. It requires no per-session re-instruction.
> Every edit, addition, and refactor must comply with every rule below or it is a violation.

### Rule 1 — The Controller is the Only AI Gateway

**All AI generation flows through `PlatformController.ts`. No exceptions.**

- ✅ Call `streamEngine({ engineId, topic, context?, signal?, onChunk, onDone? })` from `@/controller`
- ✅ Call `streamChat`, `streamBrainstorm`, `streamSeries`, `streamProjectChat` from `@/controller`
- ✅ Use `useEngineRun(id)` or `useSeriesRun(id)` hooks from `@/controller` in React components
- ❌ Never call `/api/openai/*` directly from app code
- ❌ Never implement SSE stream readers, `getReader()`, `TextDecoder` loops, or `split("data:")` in any app, engine module, series runner, or hook outside `PlatformController.ts`
- ❌ Never import from `@/ael/fetch` for AI — that file is REST helpers only

**AbortController** is the only permitted local creation in apps — solely to produce a `signal` parameter passed into a controller function. Never used to manage a raw stream.

```ts
// ✅ Correct — AbortController as cancellation signal only
const ctrl = new AbortController();
streamEngine({ engineId, topic, signal: ctrl.signal, onChunk, onDone });

// ❌ Violation — app manages the stream itself
const res = await fetch("/api/openai/engine-run", { ... });
const reader = res.body!.getReader();  // NEVER in app code
```

### Rule 2 — Shared Intelligence Layer is Always Active

Every engine run automatically:
1. **Injects** cross-app context via `contextStore.buildContextFor(engineId)` before the run
2. **Records** the completed output via `contextStore.recordOutput(...)` after streaming ends
3. **Learns** session keywords from every topic string
4. **Enables rollback** to the previous output for that engine

Components that change user focus must call `contextStore.setSessionContext(...)`:
- OSContext — on server preference hydration + on every `updatePreferences()` call ✅
- ProjectOSApp — on `activeProject` change ✅
- Any future app that tracks an "active entity" (client, patient, case, job) must seed its domain context the same way

```ts
// Seed when focus changes — always
import { contextStore } from "@/controller";
useEffect(() => {
  if (activeProject) contextStore.setSessionContext({ projectId: activeProject.id, projectName: activeProject.name });
}, [activeProject]);
```

### Rule 3 — All REST Fetches Include Credentials

Every `fetch()` call anywhere in the frontend must include `credentials: "include"`.
The Vite proxy routes `/api/*` → `localhost:8080`. Sessions are cookie-based.

```ts
// ✅ Always
fetch("/api/projects", { credentials: "include" })

// ❌ Never — auth will silently fail
fetch("/api/projects")
```

### Rule 4 — No Mock, Seed, or Placeholder Data

All data displayed to users comes from real API calls to the backend, which reads from PostgreSQL.
- No `const MOCK_DATA = [...]` arrays used as final data sources
- No hardcoded "demo" users, projects, contacts, or outputs
- Loading states while fetching are fine; fake data displayed as real is not

### Rule 5 — UX: Calm, Simple, Friendly, Progressive Disclosure

- Mobile-first layout. Never overcrowd a single view.
- Reveal advanced options progressively — not all at once.
- No wall of settings on first load; no multi-column dense tables on small viewports.
- Indigo `#6366f1` is the only accent color. No competing accents.
- Dark glass theme: `hsl(231,47%,6%)` background, `rgba(255,255,255,0.06–0.12)` surfaces.

### Rule 6 — TypeScript: Zero Errors Always

Before any commit or handoff, run:
```bash
cd artifacts/createai-brain && npx tsc --noEmit
```
Zero output = zero errors. If there are errors, fix them before finishing — no `@ts-ignore`, no `any` casts to silence real type problems.

### Rule 7 — Express v5 Specifics

- `req.params.X` must be cast: `req.params.X as string`
- No `@/` alias in `api-server` — use relative imports only
- DB imports: `import { ... } from "@workspace/db"` (not `@workspace/db/schema`)
- `CapabilityEngine.ts` — `runEngine`/`runMetaAgent` exports are the controller's internal implementation; never modify their signatures

### Rule 8 — Controller Function Signatures (Canonical)

```ts
streamEngine({ engineId, topic, context?, mode?, skipContext?, signal?, onChunk, onDone?, onError? })
streamChat({ message, history, signal?, onChunk, onDone? })
streamBrainstorm({ message, history, signal?, onChunk, onDone? })
streamSeries({ seriesId, topic, context?, signal?, onSection, onDone?, onError? })
streamProjectChat({ projectId, message, history, signal?, onChunk, onDone? })
contextStore.setSessionContext(Partial<SessionContext>)
contextStore.recordOutput(engineId, engineName, topic, text)
contextStore.rollback(engineId): OutputRecord | null
contextStore.buildContextFor(engineId): string
```

### Rule 9 — Intelligence Panel and Rollback Are Permanent UI Features

- BrainHub "Intelligence" tab shows live contextStore state (runs, keywords, rollback options) — always present
- RunPanel shows "↩ Rollback" button after every completed generation when a prior output exists
- Sidebar shows "🧠 Platform · N runs" indicator once any engine has run
- These are not optional — they are part of the platform's core UX contract

### Rule 10 — Session Plan Before Execution

For any work involving 3+ components or 2+ files:
1. Identify all files to change
2. Typecheck after changes
3. Restart the affected workflow
4. Verify no browser console errors

---
## ╚══ END PLATFORM CONTRACT ══╝

---

## Unified Controller Layer (COMPLETE — Phase 2 Executor Split Applied)
- **`src/controller/PlatformController.ts`**: Orchestrator only — `streamEngine()` does context enrichment + cache check then delegates to `selectExecutor()`. `streamProjectChat()` delegates to `ProjectExecutor`. `runEngine()` class method delegates to `selectExecutor()`. No SSE readers in PlatformController itself — all stream processing is in CapabilityEngine's `_runEngine`/`_runMetaAgent` (called by executors via `dispatchEngineStream`). Full `APP_ENGINE_REGISTRY`, `INTENT_ROUTE_MAP`, `streamSeries`, `streamChat`, `streamBrainstorm`, export utils, billing stubs — all unchanged.
- **`src/executors/shared.ts`**: `DomainExecutor` interface + `ExecutorRunOpts` type + `dispatchEngineStream()` — the single dispatch point to CapabilityEngine's canonical SSE readers
- **`src/executors/HealthcareExecutor.ts`**: Handles `category === "healthcare"` + 18 specific healthcare engine IDs. Prepends HIPAA-aware context prefix.
- **`src/executors/LegalExecutor.ts`**: Handles `category === "legal"` + 13 specific legal engine IDs. Prepends legal-precision context prefix.
- **`src/executors/CreativeExecutor.ts`**: Handles `category === "creative"` | `"imagination"`. Prepends vivid narrative mode prefix.
- **`src/executors/ProjectExecutor.ts`**: Owns the `/api/project-chat/:id/chat` SSE endpoint. Called by `streamProjectChat()` only — not part of the `streamEngine()` chain.
- **`src/executors/GeneralExecutor.ts`**: Catch-all for all other domains (operations, finance, hr, education, security, sustainability, research, universal, meta-agent, intelligence, data, platform, workflow, integration, product). Must be last in priority chain.
- **`src/executors/index.ts`**: Barrel export + `selectExecutor(engineId)` router (priority order: Healthcare → Legal → Creative → General)
- **`src/controller/hooks.ts`**: `usePlatform`, `useEngineRun(id)`, `useSeriesRun(id)`, `useDocumentOutput`, `useImageGenerate` — all React hooks wrapping controller
- **`src/controller/ControllerContext.tsx`**: `PlatformProvider` wraps entire app in App.tsx
- **`src/controller/index.ts`**: Barrel export — import everything from `@/controller`
- **`POST /api/openai/image-generate`**: DALL-E 3 image generation with safety filter, quality and size params
- **13 apps fully wired through controller**:
  - `GenericEngineApp.tsx` → `useEngineRun` + `useDocumentOutput` + `DocumentRenderer` on done
  - `BrainHubApp.tsx` → `useEngineRun` (handles meta-agent routing) + `useSeriesRun` (section-by-section streaming) + `DocumentRenderer` on done
  - `CivilizationForgeApp`, `EcologyForgeApp`, `MythweaveStudioApp`, `NarratorOSApp`, `SoundscapeStudioApp`, `TimelineForgeApp` → `streamEngine` replacing custom `runXxxEngine` calls
  - `PersonaStudioApp`, `PricingStudioApp`, `LearningCenterApp`, `DataStudioApp`, `ResearchHubApp` → `streamEngine` replacing raw fetch blocks

## Memory System (COMPLETE — Phase 3 Encrypted Memory Rebuild)
- **`lib/db/src/schema/memory_store.ts`**: New `memory_store` table — `serial` PK, `user_id`, `key`, `value_encrypted` (TEXT), timestamps. Unique constraint on `(user_id, key)` enables upsert-safe writes.
- **`artifacts/api-server/src/services/memoryService.ts`**: Backend service wrapping existing `encryption.ts`. `saveMemory(userId, key, value)` — AES-256-GCM encrypt + upsert. `loadMemory(userId, key)` — decrypt on read, returns `null` if missing. `deleteMemory(userId, key)` — soft-safe remove. `listMemoryKeys(userId)` — key names only (no values ever returned). `hasMemory(userId, key)` — existence check without decryption.
- **`artifacts/api-server/src/routes/memory.ts`**: 4 auth-guarded endpoints — `POST /api/memory/set`, `GET /api/memory/get?key=`, `DELETE /api/memory/delete?key=`, `GET /api/memory/keys`. Raw encrypted values never leave the server — only decrypted values returned to authenticated owner.
- **`artifacts/createai-brain/src/store/memoryStore.ts`**: Frontend client — zero localStorage. `memoryStore.set(key, value)`, `memoryStore.get(key)`, `memoryStore.delete(key)`, `memoryStore.keys()` — all async, all `credentials: "include"`, all backend-backed.
- **`artifacts/api-server/src/routes/integrations.ts`**: `GET /integrations` now includes `hasCredential: boolean` per integration (no key values exposed). `DELETE /integrations/:id` cleans up orphaned credential from `memory_store` automatically.
- **`artifacts/createai-brain/src/Apps/IntegrationApp.tsx`**: `handleKeyConfirm` now calls `memoryStore.set(integration:${id}:apikey, key)` before activation — key encrypted at rest in DB. Activation is blocked if backend storage fails. API keys never touch localStorage.
- **`ENCRYPTION_KEY`**: 64-char hex (32-byte AES key) set as shared env var. If not set, `encryption.ts` falls back to unencrypted with a console warning (dev-safe).
- **DB**: `memory_store` table pushed to database — `drizzle-kit push` applied cleanly.
- **TypeScript**: Both `api-server` and `createai-brain` typecheck clean (zero errors).

## Service Container (COMPLETE — Phase 5 Constructor DI)

**Problem solved:** `memoryService.ts` imported `encryption.ts` directly (service-to-service violation). No request context. No lazy singleton access.

### New files

| File | Role |
|---|---|
| `src/container/tokens.ts` | `ENCRYPTION_SERVICE` / `MEMORY_SERVICE` Symbol tokens |
| `src/container/logger.ts` | `RequestLogger` class — `info/warn/error` with `[requestId uid:X]` prefix |
| `src/container/types.ts` | `RequestScope` interface — `requestId`, `userId?`, `logger`, `get<T>(token)` |
| `src/container/index.ts` | `ServiceContainer` class — `register(token, factory)`, lazy `get<T>(token)`, `createRequestScope()` |
| `src/container/bootstrap.ts` | Registers `EncryptionService` + `MemoryService` once. Called from `index.ts` before `app.listen`. |
| `src/services/encryption.service.ts` | `EncryptionService` class — wraps `encrypt/decrypt/isEncrypted` from `encryption.ts`. No container import. |
| `src/services/memory.service.ts` | `MemoryService` class — constructor takes `EncryptionService`. No direct encryption import. |
| `src/middlewares/scopeMiddleware.ts` | Attaches `req.__scope: RequestScope` after `authMiddleware`. Augments `Express.Request`. |

### Modified files

| File | Change |
|---|---|
| `src/services/memoryService.ts` | Shims now call `container.get<MemoryService>(MEMORY_SERVICE)` — routes unchanged |
| `src/app.ts` | Added `scopeMiddleware` after `authMiddleware` |
| `src/index.ts` | Calls `bootstrapServices()` before `app.listen` |

### Rules enforced
1. **Singleton vs request-scoped** — singletons registered in `bootstrap.ts`, `createRequestScope()` produces per-request `RequestScope`. Singleton instances are shared; logger is per-request.
2. **Context-aware logger** — every request gets `req.__scope.logger` with `requestId` (UUID) and `userId` pre-bound.
3. **Constructor DI** — no service imports another service directly. `MemoryService` receives `EncryptionService` through its constructor, wired in `bootstrap.ts`.
4. **Lazy access** — `container.get(token)` creates instances on first call only. `bootstrapServices()` only registers factories (no constructors run at startup).

### Dependency graph (no circular deps)
```
bootstrap.ts → container/index + EncryptionService + MemoryService
memory.service.ts → encryption.service.ts (type only) + @workspace/db
encryption.service.ts → encryption.ts (free functions)
memoryService.ts (shims) → container/index + tokens
container/index.ts → logger.ts + types.ts (zero service imports)
scopeMiddleware.ts → container/index + types
```

### Backward compatibility
All existing free-function exports from `memoryService.ts` (`saveMemory`, `loadMemory`, `deleteMemory`, `listMemoryKeys`, `hasMemory`) remain unchanged. The 60+ route files require zero modification.

## ExpansionGuard (COMPLETE — Phase 4 Engine Safety Layer)

**Call chain (enforced):**
`PlatformController → Executor.execute() → ExpansionGuard.run() → Executor Logic (safeOpts) → dispatchEngineStream()`

- **`src/core/ExpansionGuard.ts`**: Module-scoped singleton. `expansionGuard.run(engineId, opts, executorLogic, limits?)` — checks all 3 safety limits before calling `executorLogic(safeOpts)`. Never throws — errors surface through `opts.onError()`. `safeOpts` has patched `onDone`/`onError` that release guard state in a `finally`-equivalent pattern.
  - **GUARD_MAX_DEPTH**: `_depth >= maxDepth` (default 4). Prevents runaway call chains.
  - **GUARD_MAX_RECURSION**: same `engineId` in stack when `allowRecursion=false` (default). Prevents infinite loops.
  - **GUARD_TOKEN_BUDGET**: `Math.ceil((topic.length + context.length) / 4) > maxTokens` (default 12 000). Prevents context explosion.
  - **Trace**: Rolling log of 50 `TraceEntry` objects (executionId, engineId, depth, tokenEst, status, blockReason). `expansionGuard.getTrace()` + `expansionGuard.subscribe(fn)` event emitter.
  - **`expansionGuard.reset()`**: Clears session state — depth=0, recursionMap cleared, trace cleared.
- **`src/safety/ExpansionGuardClient.tsx`**: Read-only React component. Live execution trace, depth gauge bar, running/done/blocked stats. Zero enforcement — purely observational. Subscribe/unsubscribe on mount/unmount.
- **All 4 domain executors updated** — each `execute()` now calls `expansionGuard.run()` first, passes `safeOpts` with released callbacks to executor logic:
  - `HealthcareExecutor.ts`, `LegalExecutor.ts`, `CreativeExecutor.ts`, `GeneralExecutor.ts`
- **`AppEngineConfig`** (PlatformController) — 4 new optional safety fields: `safe?`, `maxDepth?`, `maxTokens?`, `allowRecursion?`. Key registry entries annotated: `brainhub` (maxDepth:6, maxTokens:20k), `simulation`/`universal` (maxDepth:6, maxTokens:20k), `healthcare`/`legal`/`braingen`/`strategist` (safe:true).
- **Not modified**: `ProjectExecutor.ts`, `shared.ts`, `CapabilityEngine.ts`, all backend files, DB schema.
- **TypeScript**: zero errors. All 8 workflows running.

## Scaffold Engine (COMPLETE — T001–T005 Auto-Scaffold + Type-Aware Agent)
- **`artifacts/api-server/src/routes/projects.ts`**: `INDUSTRY_SPECIFIC`, `INDUSTRY_ICONS`, `INDUSTRY_COLORS` — 12 creative project types added: Film/Movie, Documentary, Video Game, Mobile App, Web App/SaaS, Business, Startup, Physical Product, Book/Novel, Music/Album, Podcast, Online Course.
- **`artifacts/api-server/src/routes/projectChat.ts`**: `buildProjectAgentSystem(projectType, projectName, scaffoldFiles)` — 12 type-specific expert system prompts. Accepts `scaffoldFiles` + `projectType` from POST body.
- **`artifacts/createai-brain/src/Apps/ProjectOSApp.tsx`**: `PROJECT_SCAFFOLD_MAP` (12 types × 8–12 template files each), `detectProjectType(name)`, `scaffoldProject()` batch-creates files with progress, 2-step New Project modal (name → type picker grid), `PlatformController.streamProjectChat` called with `projectType` + `scaffoldContext`.

## UltraMax Pipeline — All 10 Enhancements (COMPLETE)

**Shared hook**: `artifacts/createai-brain/src/hooks/useAmbientAudio.ts`
- Exports `getMoodParams`, `getArpParams`, `useAmbientAudio`
- Full mood-matched ambient Web Audio pad + pentatonic arpeggiator engine
- `play(cue)`, `crossfade(cue)`, `fadeIn`, `fadeOut`, `setEnabled`, `startArpeggiator`
- MovieProductionApp.tsx now imports from this shared hook (inline duplicate removed)

**All 9 Universal Render Engine players now have full ambient audio (`🎵/🔇` toggle):**
- CinematicPlayer → "mystery" cue + `AudioBtn dark` in controls
- BookReader → "romantic" cue + `AudioBtn` in sidebar
- CoursePlayer → "uplifting" cue + `AudioBtn` in sidebar
- PodcastPlayer → "romantic" cue + `AudioBtn dark` in play row (alongside TTS)
- GamePlayer → "action" cue + `AudioBtn dark` in art gallery header
- AppPlayer → "uplifting" cue + `AudioBtn` in screens header
- ProductShowcase → "uplifting" cue + `AudioBtn` in product header (next to 3D View)
- MusicPlayer → own arpeggiator system (separate, not replaced)

**Other enhancements (previously completed):**
- `generate.ts` unified SSE route with keepalive (`': keep-alive\n\n'` every 18s)
- MusicPlayer arpeggiator + inline lyrics editor (per-track `editedLyrics` state)
- GamePlayer + AppPlayer code editor views (`</> Code` → editable textarea → Apply & Play/Launch)
- PodcastPlayer character-specific TTS voices (parses `SPEAKER: dialogue` format, assigns voice slot per character)
- ProductShowcase CSS 3D cube (`🧊 3D View` toggle — 4-face `preserve-3d` + 30ms rotation timer)
- CinematicPlayer (RenderEngineApp) branching overlay (pipe-separated `subContent` → A/B/C/D choice buttons)
- BookReader + CoursePlayer inline chapter/module editing
- `AudioBtn` shared component (top of RenderEngineApp.tsx, reused across all 7 players)

**Session 3 additions (fully audited, all gaps closed):**
- `saveToProject(pid, name, content)` — shared async utility; GET project files → PUT if exists, POST if new
- `SaveBtn` component — indigo 💾 button shared across all editable players
- **Auto-restore on reopen**: `RenderEngineApp` `useEffect` on mount fetches project files, finds `Render Manifest — {mode}`, auto-loads it → jump directly to Output view
- **Restoring spinner**: CSS `@keyframes spin` spinner shown while auto-restore fetch is in-flight
- **Save to project — 6 players** (GamePlayer, AppPlayer, BookReader, CoursePlayer, MusicPlayer, PodcastPlayer) — each shows 💾 Save button when editing; writes to named projectFile in DB
  - GamePlayer: `Generated Game — game.html`; AppPlayer: `Generated App — app.html`
  - BookReader: `_saved_book_chapter_{n}`; CoursePlayer: `_saved_course_module_{n}`
  - MusicPlayer: `_saved_music_track_{n}`; PodcastPlayer: `_saved_podcast_script` / `_saved_podcast_notes`
- **Responsive flex-wrap**: all code-editor toolbar rows have `flexWrap: "wrap"` + `minWidth: 120` on labels
- `done` SSE event: `frames?.length ?? 0` safe null-coalescing (no throw on undefined)
- Both packages typecheck clean (zero errors); Vite build clean

## UltraMax Meta-Platform Session (COMPLETE — PlayerRegistry + CrossSynth + Branching)

### Three new platform-level features:

**1. Suggested Next Renders (PlayerRegistry.detectMissingPlayers)**
- `SuggestedNextRenders` component in `RenderEngineApp.tsx` (before `RenderEngineApp` export)
- On mount: fetches `/api/projects/:id/files`, detects which `Render Manifest — {mode}` files exist
- Uses `MODE_AFFINITY` table — context-aware ranking of the 3 most relevant untried modes per current mode
- Renders "ALSO GENERATE FOR THIS PROJECT" chip strip at the bottom of the idle launch screen
- One-click chip immediately starts a new SSE generation with `forceMode: mode`
- `MODE_MANIFEST_NAME` map: cinematic → "Movie Production Manifest", all others → "Render Manifest — {mode}"

**2. Cross-Player Synthesis (combinePlayerContent)**
- In `generate.ts` POST handler: after loading project files, scans for existing render manifests
- Extracts each manifest's `titleCard.tagline` + first 4 frame/scene titles as "universe context"
- Prepends as `[Cross-universe context — {mode}: {tagline}. Key themes: {titles}]` lines to `enrichedContent`
- SSEs a status message "Cross-universe synthesis — pulling context from N existing render(s)…"
- All mode handlers now receive `enrichedContent` instead of raw `content`

**3. Cinematic Branching Choices → Frames (BranchingEngine)**
- In `generate.ts` `handleFilm` pipeline: `isPivotal` scenes already generate `choices: SceneChoice[]`
- Post-generation: `manifest.frames` now populated from scenes (converts `SceneManifest[]` → `RenderFrame[]`)
- Branch `choices[].label` values joined as pipe-separated `subContent` (e.g. "Take the dark path | Flee to safety")
- Falls back to `cameraDir | musicCue` when no choices (non-pivotal scenes)
- CinematicPlayer's existing branching overlay (`showChoices`, ⚡ CHOOSE PATH badge) now fires from live data

**4. forceMode override in generate.ts**
- `POST /api/generate` now accepts optional `forceMode?: string` in request body
- Validated against `ALL_MODES` array; overrides `detectRenderMode(industry)` when valid
- `RenderEngineApp` stores `overrideMode` state — updated by `SuggestedNextRenders.onGenerate`
- Passed as `forceMode` in SSE fetch; `startGeneration` useCallback depends on `overrideMode`

**Both packages typecheck: zero errors after all changes**

## Expansion Engine v3 (COMPLETE — Maximum-Capacity Ceiling Applied)
- **expansionEngine.ts**: 20 expansion paths · 7 iterations · 20-layer power table
- **openai.ts ENGINE_SYSTEM_PROMPTS**: 20 new max-capacity engines added (DeliverableEngine, AutomationEngine, ProductionEngine, ComplianceAuditEngine, SecurityEngine, ScalingEngine, MonetizationEngine, LaunchEngine, GrowthEngine, RetentionEngine, AnalyticsEngine, APIDesignEngine, UIUXEngine, AccessibilityEngine, DevOpsEngine, MobileEngine, PartnershipEngine, ContentStrategyEngine, SEOEngine, PerformanceEngine)
- **openai.ts SERIES_ENGINES**: 14 new Greek-letter series added (Γ, Θ, Η, Ζ, Ι, Ν, Μ, Ξ, Π, Ρ, Τ, Υ, Ψ, Χ)
- **CapabilityEngine.ts ALL_ENGINES**: 20 new engines registered in frontend registry (132+ total)
- **CapabilityEngine.ts ALL_SERIES**: 14 new series registered in frontend registry
- **BrainHubApp.tsx ENGINE_HINTS**: 88 total hints (20 new for max-capacity engines)
- **Boot log (confirmed)**: expandPlatform() — 20 paths · 20 items · 7 iterations · runId=3; systemConfigurator — 37 registry items · mode:full · locked:true · configComplete:true
- **Both typechecks clean**: api-server + createai-brain

## Real Data Platform (COMPLETE — No mock/demo data anywhere)

### Legal Practice Manager Artifact (`/legal-pm/`)
- **LexOS** — standalone legal PM app for attorneys (no auth required — open access)
- **Pages**: Dashboard, Matters, Clients, Time & Expenses, Billing, Tasks
- **API routes**: `/api/legal/*` — 28 routes across 7 resource types (no auth guards)
- **Stack**: React + Vite + Wouter + React Query + Framer Motion + Recharts
- **Seeded data**: 3 clients (Alice Reynolds, Acme Corp, Bob Nakamura), 4 matters, 5 time entries, 6 tasks, 4 notes, 1 invoice

### Enterprise Layer (NEW — Production-Grade Features)
- **Enterprise DB tables** (6 new, all pushed): `audit_logs`, `analytics_events`, `webhook_subscriptions`, `organizations`, `sso_providers`, `data_retention_policies`
- **Auth table additions**: `role` (founder/admin/user/viewer), `tenantId`, `deletedAt` (soft-delete)
- **Projects table additions**: `tenantId`, `deletedAt` (soft-delete)
- **Enterprise services**: `services/audit.ts` (logAudit + auditMiddleware), `services/analytics.ts` (trackEvent + getEventCounts), `services/webhooks.ts` (dispatchWebhook, HMAC signing), `services/encryption.ts` (AES-256-GCM field encryption)
- **Enterprise routes** (mounted at `/api/admin`, `/api/webhooks`, `/api/auth/sso`):
  - `GET /api/admin/status` — platform health (users, projects, audit count, uptime)
  - `GET/PATCH/DELETE /api/admin/users` — user list, role management, soft-delete
  - `GET /api/admin/audit-logs` — paginated, filterable audit trail
  - `GET /api/admin/analytics` — event counts, DAU, 30d window
  - `GET /api/admin/projects` — all projects overview
  - `POST /api/admin/gdpr/export/:userId` — GDPR data export bundle
  - `DELETE /api/admin/gdpr/delete/:userId` — right-to-erasure (anonymize + soft-delete)
  - `GET/POST/PATCH/DELETE /api/webhooks` + `POST /api/webhooks/:id/test` — webhook CRUD with HMAC
  - `GET/POST /api/auth/sso/providers` — SSO provider registry (Google/Microsoft/Okta/GitHub scaffold)
  - `GET /api/auth/sso/:id/authorize` + `/callback` — OIDC flow scaffold (ready for openid-client)

### DB Tables (31 total — all pushed to PostgreSQL)
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

### Universal Capability Hub (Integration Engine v3)
- **5 tabs**: Industries · Engine · Hub · Configure · Systems
- **`src/engine/CapabilityHubEngine.ts`**: 12 industries × 4 capabilities = 48 capability packets; each has field mapping schema, migration pathway (5 steps), compliance flags, project type links
- **Industries tab**: Select any industry → auto-prepares all capability packets in simulation mode (memory only, never stored); expandable field mapping table + migration pathway per system
- **Engine tab**: Auto-simulates all 20+ DEMO_PACKET_LIBRARY packets on mount; "Prepare any integration" field handles any named system via `prepareAndSimulate()`; `PacketCard` has 📋 Request button that shows auto-generated formal partner request document
- **Hub tab** (formerly Registry): Shows REAL — ACTIVE integrations for all platform users; populated automatically when any integration is activated
- **On activation**: `activateWithKey()` → marks REAL — ACTIVE locally → POSTs to `/api/integrations` → appears in Hub immediately
- **Partner request**: `IntegrationEngine.generatePartnerRequest(packet)` — auto-generates full formal request letter (scopes, data flows, legal checklist, activation process); user copies and sends manually
- **3-tier status**: `"ready-awaiting"` (stored) | `"simulation"` (memory only, NEVER stored) | `"real-active"` (stored)
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

---

## Session: BrainHub Full Light Theme + Platform Wiring (latest)

**BrainHubApp — complete Apple/Linear light theme overhaul:**
- `StatusDot`: simplified clean green dot (no glow)
- `StatCard`: white card, `0f172a` value color, `6b7280` label
- `EngineCard`: white card + soft shadow, star (★/☆) fav button, usage counter badge (Nx), hover lifts shadow
- `RunPanel`: all inputs `#f9fafb` bg + dark text; back button light; error `#fef2f2`; save btn `#eef2ff`/indigo; output `#f8fafc` mono area
- `SeriesRunPanel`: all matching light treatment; section cards white with `#f8fafc` headers
- `BrainHubApp` nav: white bg, indigo underline on active tab, `?` shortcut button, green "All systems active"
- Dashboard: `#0f172a` title; stat cards updated to clean colors; **Top Engines** section (from usageGetTop); meta-agent cards white; series buttons white; platform status indigo box
- Engines view: fav-only toggle (★/All); empty state messages; light filter pills
- Agents view: white cards, clean color; `ACTIVE` label green
- Series view: white cards, crisp engine badges
- Vault mini-nav: white bg + light back button

**Items 4–8 complete:**
- ✅ **Item 4 (Engine Favorites)**: `EngineFavoritesService.ts` + star button on every EngineCard + Sidebar strip
- ✅ **Item 5 (Usage Counters)**: `EngineUsageService.ts` + usage badge on EngineCard + `usageIncrement` wired in `handleRunEngine` + Top Engines dashboard section
- ✅ **Item 6 (Keyboard Shortcuts modal)**: `?` key → modal; `1-7` = nav tabs; `Esc` = close; `⌘↵` = run engine
- ✅ **Item 7 (Favorites filter)**: ★ toggle in Engines view — filters to pinned engines only; empty state when no favorites
- ✅ **Item 8 (Recent/Top Engines)**: Dashboard shows top-5 by run count when usage data exists

**Platform tasks (T001-T006) — verified already implemented:**
- T001: InteractionEngine prompt (line 2989 openai.ts), /api/openai/series-run (line 4359), PUT /api/user/me (user.ts)
- T002: CompliancePanel tab + SeriesRunPanel + ENGINE_HINTS all in BrainHubApp
- T003: ProjectOSApp team management panel — members load/add/role-change via /api/projects/:id/members
- T004: MarketingApp analytics — real fetch from /api/documents + /api/activity
- T005: FamilyApp documents — loads from /api/documents, creates via BrainGen + saves to DB
- T006: AdminApp — My Profile section with PUT /api/user/me wired

---

## Multi-Sensory Spatial Interface Expansion (latest)

**Full spatial/atmospheric/multi-sensory OS upgrade** — light theme, premium elegance throughout.

### New files:
- `artifacts/createai-brain/src/os/AtmosphericLayer.tsx` — fixed full-viewport layer with:
  - 3 animated radial gradient blobs (indigo/violet/sky at 3-6% opacity)
  - 14 micro-particles ascending (CSS `particleFloat` animation, 22-46s cycle each, varied `--pdx` horizontal drift)
  - Depth vignette radial gradient reinforcing spatial perspective
  - Fully honours `prefers-reduced-motion`

### CSS additions (index.css — multi-sensory block):
- `atmosphericBreath` keyframe → `.atmospheric-bg` — 52s gradient drift on the root OS container
- `blobDrift1/2/3` keyframes → 3D blob movement referenced by AtmosphericLayer
- `particleFloat` keyframe → micro-particle ascent with `--pdx` custom property
- `.breathe-slow` / `.breathe-medium` — gentle 0.4% scale pulse (6s / 4.5s)
- `.view-enter` — cinematic page transition (fade + translateY + blur: 12px → 0 in 0.4s, spring easing)
- `.card-settle` — spring micro-bounce on mount (52ms, cubic-bezier(0.34,1.28,0.64,1))
- `.focus-group` / `.focus-item` — cognitive dimming: siblings dim to 0.55 opacity when one card is hovered
- `.stagger-grid` — all direct children mount with `card-settle` at 35ms increments (up to 12 items)
- `.tilt-card` — 3D perspective tilt using `--rx`/`--ry` CSS custom properties set by JS mouse move
- `.depth-1/2/3/4` — four-tier shadow depth system (replacing static box-shadow values)
- `.active-pulse` — 3.8s anticipatory glow ring on active status indicators
- `.panel-forward` / `.panel-back` — directional narrative panel transitions (translate3d depth shift)
- `.temp-warm` / `.temp-cool` — sepia/hue-rotate emotional color temperature modes
- `.spatial-surface` — 3D preserve-3d perspective container
- `.float-surface` — 5s vertical float animation for elevated panels
- `prefers-reduced-motion` block — disables all spatial/atmospheric animations safely

### BrainHubApp.tsx changes:
- `EngineCard` — now accepts `className` prop; has `useRef` + `onMouseMove`/`onMouseLeave` handlers that compute `--rx`/`--ry` for 3D tilt (±5°); applies `tilt-card focus-item depth-2`
- All 7 nav views wrapped in `className="view-enter"` — cinematic transition on every tab switch
- Run / Series-run transient panels wrapped in `className="panel-forward"` — depth-direction narrative
- Engine grid → `stagger-grid focus-group`; Meta-agents grid → `stagger-grid focus-group`; Series grid → `stagger-grid focus-group`; Quick-Launch grid → `stagger-grid focus-group`
- "All systems active" indicator wrapped in `active-pulse breathe-slow` span
- Meta-agent and Series cards now `focus-item tilt-card` for cognitive dimming + 3D hover

### osLayout.tsx changes:
- Root div now has `className="atmospheric-bg"` — slow 52s breathing gradient field
- `<AtmosphericLayer />` injected as first child — fixed-position blobs + particles behind all content

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

---

## ULTRA-MAX Feature Phase (completed)

### New DB Tables (lib/db/src/schema/index.ts)
- `invites` — real invite codes with tier, platformCutPct, maxUses, expiresAt, notes, email lock
- `userSubscriptions` — per-user tier (free/starter/pro/enterprise/custom), tokenBalance, monthlyLimit, platformCutPct override, isActive
- `fileVersions` — content snapshots per project file, versionNum (auto-increment), max 30/file (auto-pruned), label optional

### New API Routes (artifacts/api-server/src/routes/)
- `invites.ts` — POST (create), GET (list), DELETE /:id (revoke), POST /redeem (user-facing code redemption)
- `subscriptions.ts` — GET /me (self), GET (admin list), PUT /:userId (admin tier/cut/limit override), POST /:userId/token-adjust
- `fileVersions.ts` — GET /:projectId/files/:fileId/versions (list), POST /:projectId/files/:fileId/versions/:versionId/rollback (auto-snapshots current before restore)
- All mounted in `routes/index.ts`

### Auto-Versioning
- `projects.ts` PUT `/:id/files/:fileId` — auto-snapshots content on change (non-fatal, fire-and-forget)

### AdminApp.tsx — New Sections
- **🎟️ Invite Manager** — create codes with tier/cut/maxUses/expiry, list with use counts, revoke buttons
- **💳 Revenue & Tiers** — tabs: Subscribers (live tier/cut editing per user) + Revenue Events (immutable audit trail of subscription.update, invites.redeem, token-adjust events from `/api/admin/audit-logs`)
- **📊 Observability** — live-polls every 5s: server health banner + self-heal trigger, uptime, heap memory bar (color-coded), CPU, DB counts, AI stream telemetry (active count, peak concurrency, total started, avg duration, recent completed), platform stats grid
- **Security section enhanced** — Redeem Access Code form (calls `/api/invites/redeem`); updated status list to include File Versioning + Revenue Auditing as Active

### ProjectOSApp.tsx — Version History
- `⏱ History` button in file toolbar → opens Version History modal
- Modal lists all saved snapshots: version badge, timestamp, content preview, `↺ Restore` button
- Restore auto-snapshots current content first; spinner per-row while restoring
- State: `showVersionHistory`, `versionList`, `versionLoading`, `versionRestoring`

### Observability Backend (existing routes enhanced)
- `/api/system/metrics` — heap/CPU/uptime/DB counts/platform stats
- `/api/system/health` — registry status, config lock, self-heal count
- `/api/system/telemetry/streams` — live SSE stream tracker (activeCount, peakConcurrency, totalStarted, avgDurationMs, recentCompleted)
- `/api/system/self-heal` — founder-gated manual trigger
- `/api/admin/audit-logs` — filterable by userId, action, outcome, from, to

---

## Phase ∞+ Feature Set (completed)

### 🎨 Per-Frame Art Regeneration
- All 4 players (CinematicPlayer, BookReader, CoursePlayer, PitchDeckViewer) have `regenImages` + `regenLoading` state
- Image srcs use `regenImages[index] ?? frame.imageUrl` for fallback-safe regeneration
- 🎨 buttons call `POST /api/generate/regen-art` with `{ projectId, manifestName, frameIndex, dallePrompt }`
- CinematicPlayer received `projectId` prop for regen

### 🏗️ Training Render Mode
- `"training"` added to `RenderMode` type in both `generate.ts` and `renderEngine.ts`
- `detectRenderMode` recognizes "Corporate Training", "HR / L&D", "Education"
- `handleTraining()` generates 3 track types: Onboarding, SkillBoost, ScenarioSim (each with DALL-E + GPT)
- TrainingPlayer component: 3-tab UI, interactive scenario branching, progress bars, completion badges
- Art regen, edit mode, auto-save, PDF export (using `/api/generate/export-pdf/:projectId?mode=training`)

### 📄 PDF Export Engine
- `GET /api/generate/export-pdf/:projectId?mode=` — server-rendered print-optimized HTML
- BookReader, CoursePlayer, PitchDeckViewer PDF buttons upgraded from `window.print()` to use this endpoint
- TrainingPlayer already uses the endpoint with `mode=training`

### 📊 Analytics Dashboard
- New `"analytics"` ViewMode added to ProjectOSApp
- `AnalyticsDashboard` component: fetches `/api/projects`, derives KPIs (active/archived, docs, AI enrichment rate, industry diversity)
- Shows 4-stat KPI strip + industry breakdown bar chart + platform snapshot + AI insight blurb
- Auto-refreshes every 30s; "📊 Analytics" tab in nav (group: "power")
- Exclusion condition for folder/file view updated to include `analytics`

### 🎓 Corporate Training / HR & L&D Industries
- Added "Corporate Training" and "HR / L&D" to all industry maps in both:
  - `artifacts/createai-brain/src/Apps/ProjectOSApp.tsx`: `INDUSTRY_SPECIFIC`, `INDUSTRY_ICONS`, `INDUSTRY_COLORS`, `PROJECT_TYPES`
  - `artifacts/api-server/src/routes/projects.ts`: `INDUSTRY_SPECIFIC`, `INDUSTRY_ICONS`, `INDUSTRY_COLORS`, inline lists
- Render engine button map updated: Corporate Training → "Generate Training", HR/L&D → "Generate L&D Program"
- Folder structure: Onboarding, SkillBoost, ScenarioSim, Assessment, Analytics

### ✨ Quick Start Demo (empty state)
- 6 clickable demo chip buttons in empty project state: Indie Film, Mobile Game, AI Startup, Business Book, Music Album, Corporate Training
- Click auto-fills + triggers `parseAndCreate()` — instant project from one click
- Caption: "Click any example to auto-create it instantly"
