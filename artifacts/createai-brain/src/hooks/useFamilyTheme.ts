// src/hooks/useFamilyTheme.ts

import { useEffect, useState } from 'react';
import { getFamilyTheme, type FamilyTheme, type FamilyThemeId } from '../lib/familyThemes';
import { getPreviewThemeId } from '../lib/themePreview';

type UseFamilyThemeOptions = {
  userThemeId?: FamilyThemeId | null;
};

export function useFamilyTheme(options: UseFamilyThemeOptions = {}): FamilyTheme {
  const { userThemeId } = options;
  const [theme, setTheme] = useState<FamilyTheme>(() => {
    const previewId = typeof window !== 'undefined' ? getPreviewThemeId() : null;
    return getFamilyTheme(previewId ?? userThemeId ?? null);
  });

  useEffect(() => {
    const previewId = getPreviewThemeId();
    setTheme(getFamilyTheme(previewId ?? userThemeId ?? null));
  }, [userThemeId]);

  return theme;
}
