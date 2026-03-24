// ─── useFamilyTheme ───────────────────────────────────────────────────────────
// Returns the active FamilyTheme for the current user.
// If preview mode is active, returns the preview theme instead of the real theme.
// This is purely visual — no auth changes, no data mutations.

import { useState, useEffect } from "react";
import { type FamilyTheme, getTheme, DEFAULT_FAMILY_THEME } from "@/lib/familyThemes";
import { getActivePreviewThemeId, isPreviewActive } from "@/lib/themePreview";

export interface UseFamilyThemeResult {
  theme: FamilyTheme;
  isPreview: boolean;
  previewThemeId: string | null;
}

export function useFamilyTheme(userThemeId?: string | null): UseFamilyThemeResult {
  const [previewId, setPreviewId] = useState<string | null>(() => getActivePreviewThemeId());
  const [preview, setPreview] = useState<boolean>(() => isPreviewActive());

  // Poll localStorage for preview changes (handles URL-driven preview activation)
  useEffect(() => {
    function sync() {
      const id = getActivePreviewThemeId();
      setPreviewId(id);
      setPreview(id !== null);
    }
    sync();
    const interval = setInterval(sync, 500);
    return () => clearInterval(interval);
  }, []);

  const activeId = previewId ?? userThemeId ?? null;
  const theme = activeId ? getTheme(activeId) : DEFAULT_FAMILY_THEME;

  return { theme, isPreview: preview, previewThemeId: previewId };
}
