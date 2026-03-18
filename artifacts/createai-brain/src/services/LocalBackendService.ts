// ═══════════════════════════════════════════════════════════════════════════
// LocalBackendService — unified client for the local JSON-file backend.
//
// All calls route through the Vite proxy: /local/* → localhost:3001
// Write-through cache: every successful response is stored in localStorage.
// On cold start, the cache is rehydrated instantly from localStorage so the
// UI never stares at a blank screen waiting for the server.
// When the local backend is offline, cached data is served transparently.
// ═══════════════════════════════════════════════════════════════════════════

const BASE = "/local";
const LS_PREFIX = "cai_local_";
const CACHE_TTL_MS = 60_000; // 1 minute in-memory cache freshness

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LocalUser {
  id: string;
  name: string;
  email: string | null;
  role: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LocalProject {
  id: string;
  name: string;
  description: string;
  userId: string | null;
  status: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LocalSettings {
  [key: string]: unknown;
}

export interface LocalDocument {
  id: string;
  title: string;
  content?: string;
  type: string;
  userId: string | null;
  projectId: string | null;
  tags: string[];
  isPinned: boolean;
  isTemplate: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LocalChatSession {
  id: string;
  title: string;
  userId: string | null;
  appId: string | null;
  messages: LocalMessage[];
  messageCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LocalMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface LocalImage {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  url: string | null;
  hasData: boolean;
  data?: string;
  userId: string | null;
  projectId: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SyncStatus {
  online: boolean;
  lastChecked: number;
  lastSyncAt: number | null;
}

// ── In-memory cache ────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const memCache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): T | null {
  const entry = memCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { memCache.delete(key); return null; }
  return entry.data;
}

function cacheSet<T>(key: string, data: T): void {
  memCache.set(key, { data, ts: Date.now() });
}

function cacheInvalidate(prefix: string): void {
  for (const key of memCache.keys()) {
    if (key.startsWith(prefix)) memCache.delete(key);
  }
}

// ── localStorage persistence ───────────────────────────────────────────────────

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

function lsSet<T>(key: string, data: T): void {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(data)); } catch { /* quota exceeded */ }
}

function lsDel(key: string): void {
  try { localStorage.removeItem(LS_PREFIX + key); } catch { /* ignore */ }
}

// ── Core fetch with fallback ────────────────────────────────────────────────────

let _online = true;
let _lastChecked = 0;

export function getSyncStatus(): SyncStatus {
  return {
    online:     _online,
    lastChecked: _lastChecked,
    lastSyncAt: lsGet<number>("last_sync_at"),
  };
}

async function localFetch<T>(
  path: string,
  options: RequestInit = {},
  cacheKey?: string,
): Promise<T> {
  // Serve from memory cache on GET when fresh
  if (!options.method || options.method === "GET") {
    const ck = cacheKey ?? path;
    const mem = cacheGet<T>(ck);
    if (mem !== null) return mem;
  }

  try {
    const res = await fetch(BASE + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });

    _online = true;
    _lastChecked = Date.now();
    lsSet<number>("last_sync_at", Date.now());

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
    }

    const data = await res.json() as T;

    // Write-through: persist to localStorage and memory cache
    const ck = cacheKey ?? path;
    lsSet<T>(ck, data);
    if (!options.method || options.method === "GET") cacheSet<T>(ck, data);

    return data;
  } catch (err) {
    _online = false;
    _lastChecked = Date.now();

    // Fallback: return cached localStorage data if available
    const ck = cacheKey ?? path;
    const cached = lsGet<T>(ck);
    if (cached !== null) return cached;

    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════

export const LocalUsers = {
  list: (): Promise<{ users: LocalUser[]; total: number }> =>
    localFetch("/users", {}, "users_list"),

  get: (id: string): Promise<{ user: LocalUser }> =>
    localFetch(`/users/${id}`, {}, `user_${id}`),

  create: async (data: { name: string; email?: string; role?: string; settings?: Record<string, unknown> }): Promise<{ user: LocalUser }> => {
    const res = await localFetch<{ user: LocalUser }>("/users", {
      method: "POST", body: JSON.stringify(data),
    });
    cacheInvalidate("users_list");
    lsSet("users_list", null);
    lsSet(`user_${res.user.id}`, res);
    lsSet("current_user_id", res.user.id);
    return res;
  },

  update: async (id: string, patch: Partial<LocalUser>): Promise<{ user: LocalUser }> => {
    const res = await localFetch<{ user: LocalUser }>(`/users/${id}`, {
      method: "PUT", body: JSON.stringify(patch),
    });
    cacheInvalidate("users_list");
    cacheSet(`user_${id}`, res);
    lsSet(`user_${id}`, res);
    return res;
  },

  delete: async (id: string): Promise<{ deleted: boolean }> => {
    const res = await localFetch<{ deleted: boolean }>(`/users/${id}`, { method: "DELETE" });
    cacheInvalidate("users_list");
    cacheInvalidate(`user_${id}`);
    lsDel(`user_${id}`);
    return res;
  },

  // Get or create the session-local user (identity continuity)
  resolveCurrentUser: async (displayName?: string, email?: string): Promise<LocalUser | null> => {
    try {
      const savedId = lsGet<string>("current_user_id");
      if (savedId) {
        try {
          const { user } = await LocalUsers.get(savedId);
          return user;
        } catch { /* user may have been deleted — fall through to create */ }
      }
      if (!displayName) return null;
      const { user } = await LocalUsers.create({ name: displayName, email, role: "user" });
      lsSet("current_user_id", user.id);
      return user;
    } catch { return null; }
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════════════════════

export const LocalProjects = {
  list: (filters?: { userId?: string; status?: string }): Promise<{ projects: LocalProject[]; total: number }> => {
    const qs = new URLSearchParams(filters as Record<string, string> ?? {}).toString();
    return localFetch(`/projects${qs ? `?${qs}` : ""}`, {}, "projects_list");
  },

  get: (id: string): Promise<{ project: LocalProject }> =>
    localFetch(`/projects/${id}`, {}, `project_${id}`),

  create: async (data: { name: string; description?: string; userId?: string; status?: string; tags?: string[] }): Promise<{ project: LocalProject }> => {
    const res = await localFetch<{ project: LocalProject }>("/projects", {
      method: "POST", body: JSON.stringify(data),
    });
    cacheInvalidate("projects_list");
    lsSet(`project_${res.project.id}`, res);
    return res;
  },

  update: async (id: string, patch: Partial<LocalProject>): Promise<{ project: LocalProject }> => {
    const res = await localFetch<{ project: LocalProject }>(`/projects/${id}`, {
      method: "PUT", body: JSON.stringify(patch),
    });
    cacheInvalidate("projects_list");
    cacheSet(`project_${id}`, res);
    lsSet(`project_${id}`, res);
    return res;
  },

  delete: async (id: string): Promise<{ deleted: boolean }> => {
    const res = await localFetch<{ deleted: boolean }>(`/projects/${id}`, { method: "DELETE" });
    cacheInvalidate("projects_list");
    cacheInvalidate(`project_${id}`);
    lsDel(`project_${id}`);
    return res;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

export const LocalSettingsService = {
  getAll: (): Promise<{ settings: LocalSettings }> =>
    localFetch("/settings", {}, "settings_all"),

  get: (key: string): Promise<{ key: string; value: unknown }> =>
    localFetch(`/settings/${key}`, {}, `setting_${key}`),

  setAll: async (patch: LocalSettings): Promise<{ settings: LocalSettings }> => {
    const res = await localFetch<{ settings: LocalSettings }>("/settings", {
      method: "PUT", body: JSON.stringify(patch),
    });
    cacheInvalidate("settings");
    lsSet("settings_all", res);
    return res;
  },

  set: async (key: string, value: unknown): Promise<{ key: string; value: unknown }> => {
    const res = await localFetch<{ key: string; value: unknown }>(`/settings/${key}`, {
      method: "PUT", body: JSON.stringify({ value }),
    });
    cacheInvalidate("settings");
    return res;
  },

  delete: async (key: string): Promise<{ deleted: boolean }> => {
    const res = await localFetch<{ deleted: boolean }>(`/settings/${key}`, { method: "DELETE" });
    cacheInvalidate("settings");
    return res;
  },

  // Fast synchronous read from localStorage (no network) — for instant UI hydration
  getCached: (): LocalSettings => {
    const cached = lsGet<{ settings: LocalSettings }>("settings_all");
    return cached?.settings ?? {};
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════

export const LocalDocuments = {
  list: (filters?: { userId?: string; projectId?: string; type?: string }): Promise<{ documents: LocalDocument[]; total: number }> => {
    const qs = new URLSearchParams(filters as Record<string, string> ?? {}).toString();
    return localFetch(`/documents${qs ? `?${qs}` : ""}`, {}, "documents_list");
  },

  get: (id: string): Promise<{ document: LocalDocument }> =>
    localFetch(`/documents/${id}`, {}, `doc_${id}`),

  create: async (data: {
    title: string; content?: string; type?: string;
    userId?: string; projectId?: string; tags?: string[]; isPinned?: boolean;
  }): Promise<{ document: LocalDocument }> => {
    const res = await localFetch<{ document: LocalDocument }>("/documents", {
      method: "POST", body: JSON.stringify(data),
    });
    cacheInvalidate("documents_list");
    lsSet(`doc_${res.document.id}`, res);
    return res;
  },

  update: async (id: string, patch: Partial<LocalDocument>): Promise<{ document: LocalDocument }> => {
    const res = await localFetch<{ document: LocalDocument }>(`/documents/${id}`, {
      method: "PUT", body: JSON.stringify(patch),
    });
    cacheInvalidate("documents_list");
    cacheSet(`doc_${id}`, res);
    lsSet(`doc_${id}`, res);
    return res;
  },

  delete: async (id: string): Promise<{ deleted: boolean }> => {
    const res = await localFetch<{ deleted: boolean }>(`/documents/${id}`, { method: "DELETE" });
    cacheInvalidate("documents_list");
    cacheInvalidate(`doc_${id}`);
    lsDel(`doc_${id}`);
    return res;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CHAT
// ═══════════════════════════════════════════════════════════════════════════

export const LocalChat = {
  listSessions: (filters?: { userId?: string }): Promise<{ sessions: LocalChatSession[]; total: number }> => {
    const qs = new URLSearchParams(filters as Record<string, string> ?? {}).toString();
    return localFetch(`/chat${qs ? `?${qs}` : ""}`, {}, "chat_sessions");
  },

  getSession: (id: string): Promise<{ session: LocalChatSession }> =>
    localFetch(`/chat/${id}`, {}, `chat_${id}`),

  createSession: async (data: { title?: string; userId?: string; appId?: string }): Promise<{ session: LocalChatSession }> => {
    const res = await localFetch<{ session: LocalChatSession }>("/chat", {
      method: "POST", body: JSON.stringify(data),
    });
    cacheInvalidate("chat_sessions");
    lsSet(`chat_${res.session.id}`, res);
    return res;
  },

  addMessage: async (sessionId: string, message: { role: string; content: string; metadata?: Record<string, unknown> }): Promise<{ message: LocalMessage }> => {
    const res = await localFetch<{ message: LocalMessage }>(`/chat/${sessionId}/messages`, {
      method: "POST", body: JSON.stringify(message),
    });
    cacheInvalidate(`chat_${sessionId}`);
    return res;
  },

  updateSession: async (id: string, patch: { title?: string; metadata?: Record<string, unknown> }): Promise<{ session: LocalChatSession }> => {
    const res = await localFetch<{ session: LocalChatSession }>(`/chat/${id}`, {
      method: "PUT", body: JSON.stringify(patch),
    });
    cacheInvalidate(`chat_${id}`);
    cacheInvalidate("chat_sessions");
    return res;
  },

  deleteSession: async (id: string): Promise<{ deleted: boolean }> => {
    const res = await localFetch<{ deleted: boolean }>(`/chat/${id}`, { method: "DELETE" });
    cacheInvalidate(`chat_${id}`);
    cacheInvalidate("chat_sessions");
    lsDel(`chat_${id}`);
    return res;
  },

  deleteMessage: async (sessionId: string, msgId: string): Promise<{ deleted: boolean }> => {
    const res = await localFetch<{ deleted: boolean }>(`/chat/${sessionId}/messages/${msgId}`, { method: "DELETE" });
    cacheInvalidate(`chat_${sessionId}`);
    return res;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// IMAGES
// ═══════════════════════════════════════════════════════════════════════════

export const LocalImages = {
  list: (filters?: { userId?: string; projectId?: string }): Promise<{ images: LocalImage[]; total: number }> => {
    const qs = new URLSearchParams(filters as Record<string, string> ?? {}).toString();
    return localFetch(`/images${qs ? `?${qs}` : ""}`, {}, "images_list");
  },

  get: (id: string): Promise<{ image: LocalImage }> =>
    localFetch(`/images/${id}`, {}, `image_${id}`),

  getData: (id: string): Promise<{ id: string; data: string; mimeType: string }> =>
    localFetch(`/images/${id}/data`, {}, `image_data_${id}`),

  create: async (data: {
    name?: string; data?: string; url?: string; mimeType?: string;
    userId?: string; projectId?: string; tags?: string[];
  }): Promise<{ image: LocalImage }> => {
    const res = await localFetch<{ image: LocalImage }>("/images", {
      method: "POST", body: JSON.stringify(data),
    });
    cacheInvalidate("images_list");
    lsSet(`image_${res.image.id}`, res);
    return res;
  },

  update: async (id: string, patch: Partial<LocalImage>): Promise<{ image: LocalImage }> => {
    const res = await localFetch<{ image: LocalImage }>(`/images/${id}`, {
      method: "PUT", body: JSON.stringify(patch),
    });
    cacheInvalidate("images_list");
    cacheSet(`image_${id}`, res);
    return res;
  },

  delete: async (id: string): Promise<{ deleted: boolean }> => {
    const res = await localFetch<{ deleted: boolean }>(`/images/${id}`, { method: "DELETE" });
    cacheInvalidate("images_list");
    cacheInvalidate(`image_${id}`);
    lsDel(`image_${id}`);
    return res;
  },

  // Convert a File object to base64 and upload to local backend
  uploadFile: async (file: File, meta?: { userId?: string; projectId?: string; tags?: string[] }): Promise<{ image: LocalImage }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const res = await LocalImages.create({
            name: file.name, data: base64, mimeType: file.type, ...meta,
          });
          resolve(res);
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(file);
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

export async function checkLocalBackendHealth(): Promise<{ online: boolean; version?: string; counts?: Record<string, number> }> {
  try {
    const res = await fetch("/local/health", { signal: AbortSignal.timeout(2000) });
    if (!res.ok) { _online = false; return { online: false }; }
    const data = await res.json() as { version?: string };
    _online = true;
    _lastChecked = Date.now();
    const info = await fetch("/local/storage-info", { signal: AbortSignal.timeout(2000) });
    const infoData = info.ok ? await info.json() as { counts?: Record<string, number> } : {};
    return { online: true, version: data.version, counts: infoData.counts };
  } catch {
    _online = false;
    _lastChecked = Date.now();
    return { online: false };
  }
}
