// ═══════════════════════════════════════════════════════════════════════════
// useUniversalResume — React hook for per-app state persistence.
//
// Usage:
//   const { view, setView, resumeReady } = useViewResume("brainhub", "dashboard");
//   const { entityId, setEntityId } = useEntityResume("projos");
//   const { extra, setExtra } = useExtraResume("marketing", { sort: "date" });
//
// Every setter auto-saves to localStorage via ResumeService.
// `resumeReady` is true after the initial restore completes — use it to
// suppress flicker on first render.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import { saveResume, loadResume, type AppResumeState } from "@/services/ResumeService";

// ── Debounce helper (avoid excessive writes on rapid state changes) ────────────

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

// ── Main hook — manages view + entity + extras as one persisted unit ──────────

export interface ResumeState {
  view: string;
  entityId: string | null;
  entityName: string | null;
  filters: Record<string, unknown>;
  extra: Record<string, unknown>;
}

export interface ResumeControls {
  resumeState: ResumeState;
  resumeReady: boolean;
  setView:       (v: string) => void;
  setEntityId:   (id: string | null) => void;
  setEntityName: (name: string | null) => void;
  setFilters:    (f: Record<string, unknown>) => void;
  setExtra:      (patch: Record<string, unknown>) => void;
  clearResume:   () => void;
}

export function useUniversalResume(
  appId: string,
  defaults: Partial<ResumeState> = {},
): ResumeControls {
  const defaultState: ResumeState = {
    view:       defaults.view       ?? "home",
    entityId:   defaults.entityId   ?? null,
    entityName: defaults.entityName ?? null,
    filters:    defaults.filters    ?? {},
    extra:      defaults.extra      ?? {},
  };

  // Lazy initializer — reads localStorage synchronously on first render (zero flicker)
  const [state, setState] = useState<ResumeState>(() => {
    const saved = loadResume(appId);
    if (!saved) return defaultState;
    return {
      view:       saved.view              ?? defaultState.view,
      entityId:   saved.activeEntityId    ?? defaultState.entityId,
      entityName: saved.activeEntityName  ?? defaultState.entityName,
      filters:    (saved.filters  ?? defaultState.filters) as Record<string, unknown>,
      extra:      (saved.extra    ?? defaultState.extra)   as Record<string, unknown>,
    };
  });
  const [resumeReady, setReady] = useState(false);
  const persistedRef = useRef(state);
  persistedRef.current = state;

  // Mark ready after mount (single tick — no async needed)
  useEffect(() => { setReady(true); }, []);

  // Debounced save — persist 500ms after last change
  const debouncedState = useDebounced(state, 500);
  useEffect(() => {
    if (!resumeReady) return;
    const entry: Omit<AppResumeState, "savedAt"> = {
      view:              debouncedState.view,
      activeEntityId:    debouncedState.entityId,
      activeEntityName:  debouncedState.entityName,
      filters:           debouncedState.filters,
      extra:             debouncedState.extra,
    };
    saveResume(appId, entry);
  }, [appId, debouncedState, resumeReady]);

  const setView = useCallback((v: string) =>
    setState(prev => ({ ...prev, view: v })), []);

  const setEntityId = useCallback((id: string | null) =>
    setState(prev => ({ ...prev, entityId: id })), []);

  const setEntityName = useCallback((name: string | null) =>
    setState(prev => ({ ...prev, entityName: name })), []);

  const setFilters = useCallback((f: Record<string, unknown>) =>
    setState(prev => ({ ...prev, filters: f })), []);

  const setExtra = useCallback((patch: Record<string, unknown>) =>
    setState(prev => ({ ...prev, extra: { ...prev.extra, ...patch } })), []);

  const clearResume = useCallback(() => {
    setState(defaultState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { resumeState: state, resumeReady, setView, setEntityId, setEntityName, setFilters, setExtra, clearResume };
}

// ── Convenience: view-only resume ─────────────────────────────────────────────

export function useViewResume<V extends string>(appId: string, defaultView: V) {
  const { resumeState, resumeReady, setView } = useUniversalResume(appId, { view: defaultView });
  return {
    view:        resumeState.view as V,
    setView:     (v: V) => setView(v),
    resumeReady,
  };
}
