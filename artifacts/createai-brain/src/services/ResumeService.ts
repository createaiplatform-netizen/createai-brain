// ═══════════════════════════════════════════════════════════════════════════
// ResumeService — Universal Resume for CreateAI Brain
//
// Saves each app's last known state to localStorage so every app restores
// exactly where the user left off across page refreshes and OS re-opens.
//
// Storage key format: cai_resume_<appId>
// ═══════════════════════════════════════════════════════════════════════════

const LS_PREFIX = "cai_resume_";
const SUMMARY_KEY = "cai_resume_summary";

export interface AppResumeState {
  view?: string;
  activeEntityId?: string | null;
  activeEntityName?: string | null;
  filters?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  savedAt: number;
}

export interface ResumeSummary {
  apps: Array<{ appId: string; view?: string; savedAt: number }>;
  totalSaved: number;
  lastActivity: number | null;
}

// ── Write ─────────────────────────────────────────────────────────────────────

export function saveResume(appId: string, state: Omit<AppResumeState, "savedAt">): void {
  try {
    const entry: AppResumeState = { ...state, savedAt: Date.now() };
    localStorage.setItem(LS_PREFIX + appId, JSON.stringify(entry));
    _updateSummary(appId, entry);
  } catch { /* quota exceeded — silently skip */ }
}

// ── Read ──────────────────────────────────────────────────────────────────────

export function loadResume(appId: string): AppResumeState | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + appId);
    return raw ? (JSON.parse(raw) as AppResumeState) : null;
  } catch { return null; }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export function clearResume(appId: string): void {
  try {
    localStorage.removeItem(LS_PREFIX + appId);
    _updateSummary(appId, null);
  } catch { /* ignore */ }
}

export function clearAllResumes(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(SUMMARY_KEY);
  } catch { /* ignore */ }
}

// ── Summary (for Intelligence panel / BrainHub) ───────────────────────────────

export function getResumeSummary(): ResumeSummary {
  try {
    const raw = localStorage.getItem(SUMMARY_KEY);
    return raw ? (JSON.parse(raw) as ResumeSummary) : _buildSummaryFromStorage();
  } catch { return { apps: [], totalSaved: 0, lastActivity: null }; }
}

function _buildSummaryFromStorage(): ResumeSummary {
  const apps: ResumeSummary["apps"] = [];
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(LS_PREFIX)) continue;
      const appId = key.slice(LS_PREFIX.length);
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const entry = JSON.parse(raw) as AppResumeState;
      apps.push({ appId, view: entry.view, savedAt: entry.savedAt });
    }
  } catch { /* ignore */ }
  apps.sort((a, b) => b.savedAt - a.savedAt);
  const lastActivity = apps.length > 0 ? apps[0].savedAt : null;
  return { apps, totalSaved: apps.length, lastActivity };
}

function _updateSummary(appId: string, entry: AppResumeState | null): void {
  try {
    const summary = _buildSummaryFromStorage();
    if (!entry) {
      summary.apps = summary.apps.filter(a => a.appId !== appId);
    } else {
      const idx = summary.apps.findIndex(a => a.appId === appId);
      const item = { appId, view: entry.view, savedAt: entry.savedAt };
      if (idx >= 0) summary.apps[idx] = item; else summary.apps.unshift(item);
    }
    summary.totalSaved = summary.apps.length;
    summary.lastActivity = summary.apps.length > 0
      ? Math.max(...summary.apps.map(a => a.savedAt))
      : null;
    localStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
  } catch { /* ignore */ }
}
