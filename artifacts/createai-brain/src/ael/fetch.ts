/**
 * ael/fetch.ts — Typed API fetch wrappers
 *
 * Every function here:
 *  - always sends `credentials: "include"` (Vite proxy → /api/*)
 *  - always throws on non-ok status (callers handle errors at the top)
 *  - keeps the call site to a single line for common operations
 *
 * Usage:
 *   import { apiFetch, apiPost, apiPut, apiDelete, streamSSE } from "@/ael/fetch";
 */

// ─── GET ────────────────────────────────────────────────────────────────────

/**
 * GET /api/... — parse JSON, throw on non-ok.
 * @example const user = await apiFetch<User>("/api/user/me");
 */
export async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── POST ───────────────────────────────────────────────────────────────────

/**
 * POST /api/... with a JSON body — parse JSON response, throw on non-ok.
 * @example const doc = await apiPost<{ document: Doc }>("/api/documents", { title, body });
 */
export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── PUT ────────────────────────────────────────────────────────────────────

/**
 * PUT /api/... with a JSON body — parse JSON response, throw on non-ok.
 * @example const updated = await apiPut<{ user: User }>("/api/user/me", { name });
 */
export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── DELETE ─────────────────────────────────────────────────────────────────

/**
 * DELETE /api/... — expects 200/204, throws on non-ok.
 * @example await apiDelete(`/api/documents/${id}`);
 */
export async function apiDelete(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(`DELETE ${url} → ${res.status}`);
}

// ─── SSE Streaming ──────────────────────────────────────────────────────────

/**
 * POST to a Server-Sent Events endpoint, accumulate chunks, call `onChunk`
 * with the full accumulated text after each new piece arrives.
 *
 * Protocol expected from the server:
 *   data: {"content": "..."}\n\n
 *   data: {"done": true}\n\n
 *
 * `onChunk` receives the full accumulated string so far (not just the delta).
 * `onDone`  is called when `d.done === true` arrives.
 *
 * Compatible with: SimulationApp, GuidePanel streaming endpoints.
 *
 * @example
 *   await streamSSE("/api/openai/simulate", { domain, scenario }, t => setText(t), () => setDone(true), ctrl.signal);
 */
export async function streamSSE(
  url: string,
  body: Record<string, unknown>,
  onChunk: (accumulated: string) => void,
  onDone: () => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`SSE ${url} → ${res.status}`);

  const reader = res.body.getReader();
  const dec    = new TextDecoder();
  let acc      = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = dec.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6);
      if (!raw || raw === "[DONE]") continue;
      try {
        const d = JSON.parse(raw) as { content?: string; done?: boolean };
        if (d.content) { acc += d.content; onChunk(acc); }
        if (d.done)    onDone();
      } catch { /* malformed line — skip */ }
    }
  }
}
