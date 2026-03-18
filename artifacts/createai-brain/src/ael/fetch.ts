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

// ─── AI Streaming ───────────────────────────────────────────────────────────
//
// All AI streaming now goes through the unified PlatformController.
// Use streamEngine / streamSeries / streamChat / streamBrainstorm from "@/controller".
// Direct SSE helpers have been removed to enforce controller-centric architecture.
