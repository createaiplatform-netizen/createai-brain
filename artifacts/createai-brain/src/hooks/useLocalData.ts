// ═══════════════════════════════════════════════════════════════════════════
// useLocalData — React hooks for the local JSON-file backend.
//
// Each hook follows the same pattern:
//  - Instant render from localStorage cache (no flicker)
//  - Background fetch from local backend
//  - Mutations invalidate cache and re-fetch
//  - Graceful degradation when backend is offline
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LocalUsers,    LocalProjects, LocalSettingsService,
  LocalDocuments, LocalChat,    LocalImages,
  checkLocalBackendHealth,     getSyncStatus,
  type LocalUser, type LocalProject, type LocalSettings,
  type LocalDocument, type LocalChatSession, type LocalImage,
  type LocalMessage, type SyncStatus,
} from "@/services/LocalBackendService";

// ── Generic loading state ─────────────────────────────────────────────────────

interface Loadable<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function useResource<T>(fetcher: () => Promise<T>, deps: unknown[] = []): Loadable<T> {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mountedRef.current) { setData(result); setLoading(false); }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  return { data, loading, error, refresh: load };
}

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH / SYNC STATUS
// ═══════════════════════════════════════════════════════════════════════════

export interface LocalBackendStatus {
  online:   boolean;
  checking: boolean;
  version:  string | null;
  counts:   Record<string, number> | null;
  syncStatus: SyncStatus;
  recheck: () => void;
}

export function useLocalBackendStatus(pollIntervalMs = 30_000): LocalBackendStatus {
  const [online,   setOnline]   = useState(false);
  const [checking, setChecking] = useState(true);
  const [version,  setVersion]  = useState<string | null>(null);
  const [counts,   setCounts]   = useState<Record<string, number> | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());

  const check = useCallback(async () => {
    setChecking(true);
    const result = await checkLocalBackendHealth();
    setOnline(result.online);
    setVersion(result.version ?? null);
    setCounts(result.counts ?? null);
    setSyncStatus(getSyncStatus());
    setChecking(false);
  }, []);

  useEffect(() => {
    check();
    if (pollIntervalMs <= 0) return;
    const interval = setInterval(check, pollIntervalMs);
    return () => clearInterval(interval);
  }, [check, pollIntervalMs]);

  return { online, checking, version, counts, syncStatus, recheck: check };
}

// ═══════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════

export function useLocalUsers() {
  const resource = useResource(() => LocalUsers.list());

  const create = useCallback(async (data: { name: string; email?: string; role?: string }) => {
    const res = await LocalUsers.create(data);
    resource.refresh();
    return res.user;
  }, [resource]);

  const update = useCallback(async (id: string, patch: Partial<LocalUser>) => {
    const res = await LocalUsers.update(id, patch);
    resource.refresh();
    return res.user;
  }, [resource]);

  const remove = useCallback(async (id: string) => {
    await LocalUsers.delete(id);
    resource.refresh();
  }, [resource]);

  return {
    users:   resource.data?.users ?? [],
    total:   resource.data?.total ?? 0,
    loading: resource.loading,
    error:   resource.error,
    refresh: resource.refresh,
    create, update, remove,
  };
}

export function useCurrentLocalUser(displayName?: string, email?: string) {
  const [user,    setUser]    = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LocalUsers.resolveCurrentUser(displayName, email).then(u => {
      setUser(u);
      setLoading(false);
    });
  }, [displayName, email]);

  const update = useCallback(async (patch: Partial<LocalUser>) => {
    if (!user) return;
    const res = await LocalUsers.update(user.id, patch);
    setUser(res.user);
    return res.user;
  }, [user]);

  return { user, loading, update };
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════════════════════

export function useLocalProjects(filters?: { userId?: string; status?: string }) {
  const resource = useResource(
    () => LocalProjects.list(filters),
    [filters?.userId, filters?.status],
  );

  const create = useCallback(async (data: { name: string; description?: string; userId?: string; status?: string; tags?: string[] }) => {
    const res = await LocalProjects.create(data);
    resource.refresh();
    return res.project;
  }, [resource]);

  const update = useCallback(async (id: string, patch: Partial<LocalProject>) => {
    const res = await LocalProjects.update(id, patch);
    resource.refresh();
    return res.project;
  }, [resource]);

  const remove = useCallback(async (id: string) => {
    await LocalProjects.delete(id);
    resource.refresh();
  }, [resource]);

  return {
    projects: resource.data?.projects ?? [],
    total:    resource.data?.total ?? 0,
    loading:  resource.loading,
    error:    resource.error,
    refresh:  resource.refresh,
    create, update, remove,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

export function useLocalSettings() {
  // Immediately render from cache — no loading flicker
  const [settings, setSettings] = useState<LocalSettings>(() => LocalSettingsService.getCached());
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { settings: s } = await LocalSettingsService.getAll();
      setSettings(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = useCallback(async (key: string, value: unknown) => {
    await LocalSettingsService.set(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const setAll = useCallback(async (patch: LocalSettings) => {
    const { settings: s } = await LocalSettingsService.setAll(patch);
    setSettings(s);
  }, []);

  const remove = useCallback(async (key: string) => {
    await LocalSettingsService.delete(key);
    setSettings(prev => { const next = { ...prev }; delete next[key]; return next; });
  }, []);

  return { settings, loading, error, refresh: load, set, setAll, remove };
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════

export function useLocalDocuments(filters?: { userId?: string; projectId?: string; type?: string }) {
  const resource = useResource(
    () => LocalDocuments.list(filters),
    [filters?.userId, filters?.projectId, filters?.type],
  );

  const create = useCallback(async (data: { title: string; content?: string; type?: string; userId?: string; projectId?: string; tags?: string[] }) => {
    const res = await LocalDocuments.create(data);
    resource.refresh();
    return res.document;
  }, [resource]);

  const update = useCallback(async (id: string, patch: Partial<LocalDocument>) => {
    const res = await LocalDocuments.update(id, patch);
    resource.refresh();
    return res.document;
  }, [resource]);

  const remove = useCallback(async (id: string) => {
    await LocalDocuments.delete(id);
    resource.refresh();
  }, [resource]);

  return {
    documents: resource.data?.documents ?? [],
    total:     resource.data?.total ?? 0,
    loading:   resource.loading,
    error:     resource.error,
    refresh:   resource.refresh,
    create, update, remove,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CHAT
// ═══════════════════════════════════════════════════════════════════════════

export function useLocalChatSessions(filters?: { userId?: string }) {
  const resource = useResource(
    () => LocalChat.listSessions(filters),
    [filters?.userId],
  );

  const create = useCallback(async (data: { title?: string; userId?: string; appId?: string }) => {
    const res = await LocalChat.createSession(data);
    resource.refresh();
    return res.session;
  }, [resource]);

  const update = useCallback(async (id: string, patch: { title?: string }) => {
    const res = await LocalChat.updateSession(id, patch);
    resource.refresh();
    return res.session;
  }, [resource]);

  const remove = useCallback(async (id: string) => {
    await LocalChat.deleteSession(id);
    resource.refresh();
  }, [resource]);

  return {
    sessions: resource.data?.sessions ?? [],
    total:    resource.data?.total ?? 0,
    loading:  resource.loading,
    error:    resource.error,
    refresh:  resource.refresh,
    create, update, remove,
  };
}

export function useLocalChatSession(sessionId: string | null) {
  const resource = useResource(
    () => sessionId ? LocalChat.getSession(sessionId) : Promise.resolve(null),
    [sessionId],
  );

  const addMessage = useCallback(async (message: { role: string; content: string }) => {
    if (!sessionId) return null;
    const res = await LocalChat.addMessage(sessionId, message);
    resource.refresh();
    return res.message;
  }, [sessionId, resource]);

  const deleteMessage = useCallback(async (msgId: string) => {
    if (!sessionId) return;
    await LocalChat.deleteMessage(sessionId, msgId);
    resource.refresh();
  }, [sessionId, resource]);

  return {
    session:       resource.data?.session ?? null,
    messages:      resource.data?.session?.messages ?? [] as LocalMessage[],
    loading:       resource.loading,
    error:         resource.error,
    refresh:       resource.refresh,
    addMessage,    deleteMessage,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGES
// ═══════════════════════════════════════════════════════════════════════════

export function useLocalImages(filters?: { userId?: string; projectId?: string }) {
  const resource = useResource(
    () => LocalImages.list(filters),
    [filters?.userId, filters?.projectId],
  );

  const upload = useCallback(async (file: File, meta?: { userId?: string; projectId?: string; tags?: string[] }) => {
    const res = await LocalImages.uploadFile(file, meta);
    resource.refresh();
    return res.image;
  }, [resource]);

  const create = useCallback(async (data: { name?: string; data?: string; url?: string; mimeType?: string; userId?: string }) => {
    const res = await LocalImages.create(data);
    resource.refresh();
    return res.image;
  }, [resource]);

  const update = useCallback(async (id: string, patch: Partial<LocalImage>) => {
    const res = await LocalImages.update(id, patch);
    resource.refresh();
    return res.image;
  }, [resource]);

  const remove = useCallback(async (id: string) => {
    await LocalImages.delete(id);
    resource.refresh();
  }, [resource]);

  return {
    images:  resource.data?.images ?? [],
    total:   resource.data?.total ?? 0,
    loading: resource.loading,
    error:   resource.error,
    refresh: resource.refresh,
    upload, create, update, remove,
  };
}
