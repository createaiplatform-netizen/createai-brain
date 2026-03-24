// src/lib/themePreview.ts

import type { FamilyThemeId } from './familyThemes';

const PREVIEW_KEY = 'familyThemePreview';

export function enableThemePreview(themeId: FamilyThemeId) {
  try {
    window.localStorage.setItem(PREVIEW_KEY, themeId);
  } catch {
    // ignore
  }
}

export function disableThemePreview() {
  try {
    window.localStorage.removeItem(PREVIEW_KEY);
  } catch {
    // ignore
  }
}

export function getPreviewThemeId(): FamilyThemeId | null {
  try {
    const value = window.localStorage.getItem(PREVIEW_KEY);
    return value as FamilyThemeId | null;
  } catch {
    return null;
  }
}

export function isThemePreviewActive(): boolean {
  return getPreviewThemeId() != null;
}
