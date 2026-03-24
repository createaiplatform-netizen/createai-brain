// ─── Theme Preview Engine ─────────────────────────────────────────────────────
// Non-destructive, localStorage-only preview system.
// No auth logic is bypassed. No backend data is modified.
// Preview state is ephemeral — cleared on disablePreview() or page refresh after exit.

const PREVIEW_KEY = "cai_theme_preview";

export interface ThemePreviewState {
  active: boolean;
  themeId: string;
  activatedAt: string;
}

/** Activate preview mode for a given theme ID. */
export function enablePreview(themeId: string): void {
  const state: ThemePreviewState = {
    active: true,
    themeId,
    activatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(PREVIEW_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — silently skip
  }
}

/** Deactivate preview mode and clear stored state. */
export function disablePreview(): void {
  try {
    localStorage.removeItem(PREVIEW_KEY);
  } catch {
    // silently skip
  }
}

/** Return the currently previewed theme ID, or null if not in preview mode. */
export function getActivePreviewThemeId(): string | null {
  try {
    const raw = localStorage.getItem(PREVIEW_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as ThemePreviewState;
    return state.active ? state.themeId : null;
  } catch {
    return null;
  }
}

/** Whether preview mode is currently active. */
export function isPreviewActive(): boolean {
  return getActivePreviewThemeId() !== null;
}
