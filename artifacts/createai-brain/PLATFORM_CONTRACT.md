# CreateAI Brain — Platform Contract

> **This is the active, default behavior model for the entire platform.**
> It applies automatically to every file, component, engine, series, module, hook, and future addition.
> No per-session re-instruction is needed — every edit must comply with every rule below.

---

## Rule 1 — The Controller is the Only AI Gateway

All AI generation flows through `src/controller/PlatformController.ts`. No exceptions.

| ✅ Do | ❌ Never |
|---|---|
| `streamEngine(...)` from `@/controller` | Call `/api/openai/*` directly from app code |
| `streamChat / streamBrainstorm / streamSeries / streamProjectChat` from `@/controller` | Implement `getReader()`, `TextDecoder` loop, `split("data:")` in any app or module |
| `useEngineRun(id)` / `useSeriesRun(id)` hooks in React components | Import from `@/ael/fetch` for AI calls |
| `new AbortController()` to produce `signal:` parameter only | Use `AbortController` to manage a stream directly |

```ts
// ✅ Correct — AbortController as a cancellation handle passed to controller
const ctrl = new AbortController();
streamEngine({ engineId, topic, signal: ctrl.signal, onChunk, onDone });

// ❌ Violation — app owns the stream
const res = await fetch("/api/openai/engine-run", { ... });
const reader = res.body!.getReader(); // Never in app code
```

---

## Rule 2 — Shared Intelligence Layer is Always Active

`src/store/platformContextStore.ts` — singleton `contextStore` — is the platform's memory layer.

**PlatformController auto-wires this for every engine run:**
1. Injects cross-app context via `contextStore.buildContextFor(engineId)` before the run
2. Records the completed output via `contextStore.recordOutput(...)` after streaming ends
3. Learns session keywords from every topic string
4. Enables rollback to the previous output for that engine

**Apps must seed context when user focus changes:**
```ts
import { contextStore } from "@/controller";

// When active entity changes (project, client, patient, case, job…)
useEffect(() => {
  if (activeProject) {
    contextStore.setSessionContext({
      projectId:   activeProject.id,
      projectName: activeProject.name,
    });
  }
}, [activeProject]);
```

**Already wired:**
- `OSContext.tsx` — seeds `{ tone }` on server preference load and on every `updatePreferences()` call
- `ProjectOSApp.tsx` — seeds `{ projectId, projectName }` when active project changes

**Any new app tracking an active entity must follow the same pattern.**

---

## Rule 3 — All REST Fetches Include Credentials

```ts
// ✅ Always — sessions are cookie-based, Vite proxies /api/* → localhost:8080
fetch("/api/projects", { credentials: "include" })

// ❌ Never — auth silently fails without the session cookie
fetch("/api/projects")
```

---

## Rule 4 — No Mock or Placeholder Data

- All displayed data comes from real PostgreSQL via real API endpoints
- No `MOCK_DATA = [...]` arrays used as final data sources
- No hardcoded "demo" users, projects, contacts, or AI outputs
- Loading spinners while fetching are correct; fake data displayed as real is not

---

## Rule 5 — UX: Calm, Simple, Friendly, Progressive Disclosure

- Mobile-first layout — never overcrowd a single view
- Reveal advanced options progressively — not all at once
- Accent color: `#6366f1` indigo only — no competing accents
- Dark glass theme: `hsl(231,47%,6%)` background, `rgba(255,255,255,0.06–0.12)` surfaces
- Sara's platform: Apple-level polish, non-overwhelming, every feature earns its place

---

## Rule 6 — TypeScript: Zero Errors Always

```bash
cd artifacts/createai-brain && npx tsc --noEmit
# Zero output = zero errors. Required before any handoff.
```

No `@ts-ignore`. No `any` casts to silence real type errors.

---

## Rule 7 — Express v5 Specifics (api-server only)

- Cast params: `req.params.id as string`
- No `@/` alias in `api-server` — use relative imports
- DB imports: `import { ... } from "@workspace/db"` (not `@workspace/db/schema`)
- `CapabilityEngine.ts` — `runEngine`/`runMetaAgent` are the controller's internal implementation; never change their signatures

---

## Rule 8 — Controller Function Signatures (Canonical Reference)

```ts
// Engine streaming — auto-injects contextStore before run, auto-records after
streamEngine({
  engineId:    string;
  topic:       string;
  context?:    string;       // extra context injected before auto-context
  mode?:       string;
  skipContext?: boolean;     // true = bypass contextStore injection
  signal?:     AbortSignal;  // cancellation handle from caller's AbortController
  onChunk:     (text: string) => void;
  onDone?:     (full: string) => void;
  onError?:    (err: string) => void;
})

streamChat({ message, history, signal?, onChunk, onDone? })
streamBrainstorm({ message, history, signal?, onChunk, onDone? })
streamSeries({ seriesId, topic, context?, signal?, onSection, onDone?, onError? })
streamProjectChat({ projectId, message, history, signal?, onChunk, onDone? })

// Intelligence layer
contextStore.setSessionContext(Partial<SessionContext>)   // seed user/project context
contextStore.buildContextFor(engineId): string            // called by controller automatically
contextStore.recordOutput(engineId, engineName, topic, text): void  // called by controller automatically
contextStore.rollback(engineId): OutputRecord | null      // restore prior output
contextStore.canRollback(engineId): boolean
contextStore.addInsight(key, value, source): void         // manual insight recording
```

---

## Rule 9 — Intelligence Panel and Rollback Are Permanent UI

These are not optional features — they are part of the platform's core UX:

- **BrainHub "Intelligence" tab** — shows live contextStore state: run count, engines used, session context, keywords, rollback options, insights
- **RunPanel rollback button** — "↩ Rollback" appears after every completed engine run when a prior output exists; clicking restores the previous generation
- **Sidebar intelligence indicator** — "🧠 Platform · N runs" button appears once any engine has run; clicking opens BrainHub → Intelligence tab

---

## Rule 10 — Every Structural Change Follows This Order

1. Identify all files to change
2. Make changes
3. `npx tsc --noEmit` — zero errors required
4. Restart the affected workflow
5. Verify in browser — no console errors

---

*This contract was established and last updated: 2026-03-18*
*Owner: Sara Stadler — CreateAI Brain platform*
