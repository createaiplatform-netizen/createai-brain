// ═══════════════════════════════════════════════════════════════════════════
// queryClient.ts — Minimal fetch utility, consistent with BASE_URL pattern.
// ═══════════════════════════════════════════════════════════════════════════

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

export async function apiRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try {
      const json = await res.json();
      if (json?.error) msg = json.error;
      else if (json?.message) msg = json.message;
    } catch (_) {}
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}
