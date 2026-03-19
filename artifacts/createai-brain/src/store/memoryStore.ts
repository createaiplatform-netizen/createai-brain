// ═══════════════════════════════════════════════════════════════════════════
// MEMORY STORE — Frontend client for the encrypted backend memory service.
//
// All values are stored encrypted at rest on the server (AES-256-GCM).
// No values are stored in localStorage, sessionStorage, or in-memory JS.
// The browser never holds raw credentials beyond the lifetime of the call.
//
// Usage:
//   await memoryStore.set("integration:stripe:apikey", rawKey);
//   const key = await memoryStore.get("integration:stripe:apikey");
//   await memoryStore.delete("integration:stripe:apikey");
// ═══════════════════════════════════════════════════════════════════════════

const BASE = "/api/memory";

async function set(key: string, value: string): Promise<void> {
  const res = await fetch(`${BASE}/set`, {
    method:      "POST",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `memory.set failed (${res.status})`);
  }
}

async function get(key: string): Promise<string | null> {
  const res = await fetch(`${BASE}/get?key=${encodeURIComponent(key)}`, {
    credentials: "include",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `memory.get failed (${res.status})`);
  }
  const data = await res.json() as { value: string };
  return data.value;
}

async function del(key: string): Promise<void> {
  const res = await fetch(`${BASE}/delete?key=${encodeURIComponent(key)}`, {
    method:      "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `memory.delete failed (${res.status})`);
  }
}

async function keys(): Promise<string[]> {
  const res = await fetch(`${BASE}/keys`, { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json() as { keys: string[] };
  return data.keys ?? [];
}

export const memoryStore = { set, get, delete: del, keys };
