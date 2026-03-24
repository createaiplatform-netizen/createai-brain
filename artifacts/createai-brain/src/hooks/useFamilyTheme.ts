// File: src/hooks/useFamilyTheme.ts

import { useEffect, useState } from 'react';
import { getFamilyTheme, type FamilyTheme, type FamilyThemeId } from '../lib/familyThemes';
import { getPreviewThemeId } from '../lib/themePreview';
import { buildUniversalTheme } from '../lib/universalThemeEngine';

type UseFamilyThemeOptions = {
  userThemeId?: FamilyThemeId | null;
  userSeed?: string | null; // any stable identifier: userId, email hash, etc.
};

export function useFamilyTheme(options: UseFamilyThemeOptions = {}): FamilyTheme {
  const { userThemeId, userSeed } = options;

  const computeTheme = (): FamilyTheme => {
    const previewId = typeof window !== 'undefined' ? getPreviewThemeId() : null;

    // 1) Preview theme overrides everything
    if (previewId) {
      return getFamilyTheme(previewId);
    }

    // 2) Explicit family themeId (Nathan, Nolan, etc.)
    if (userThemeId) {
      return getFamilyTheme(userThemeId);
    }

    // 3) Universal theme for everyone else
    if (userSeed) {
      return buildUniversalTheme(userSeed);
    }

    // 4) Fallback to default
    return getFamilyTheme(null);
  };

  const [theme, setTheme] = useState<FamilyTheme>(() => computeTheme());

  useEffect(() => {
    setTheme(computeTheme());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userThemeId, userSeed]);

  return theme;
}
