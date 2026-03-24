// src/pages/ThemePreviewPage.tsx (Wouter)

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { enableThemePreview, disableThemePreview, getPreviewThemeId } from '../lib/themePreview';
import type { FamilyThemeId } from '../lib/familyThemes';
import FamilyUniversePage from './universe/FamilyUniversePage';

type ThemePreviewPageProps = {
  params: { themeId: string };
};

export default function ThemePreviewPage({ params }: ThemePreviewPageProps) {
  const [, navigate] = useLocation();
  const themeId = params.themeId as FamilyThemeId;

  useEffect(() => {
    if (!themeId) {
      disableThemePreview();
      navigate('/family-hub', { replace: true } as never);
      return;
    }

    enableThemePreview(themeId);

    return () => {
      const current = getPreviewThemeId();
      if (current === themeId) disableThemePreview();
    };
  }, [themeId, navigate]);

  const exit = () => {
    disableThemePreview();
    navigate('/family-hub');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: '#111827',
          color: '#F9FAFB',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 14,
        }}
      >
        <span>
          Preview Mode — Theme: <strong>{themeId}</strong>
        </span>
        <button
          onClick={exit}
          style={{
            background: '#EF4444',
            color: '#F9FAFB',
            border: 'none',
            borderRadius: 4,
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          Exit Preview
        </button>
      </div>

      <div style={{ paddingTop: 40 }}>
        <FamilyUniversePage />
      </div>
    </div>
  );
}
