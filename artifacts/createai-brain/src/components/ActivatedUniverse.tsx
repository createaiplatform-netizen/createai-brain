// src/components/ActivatedUniverse.tsx
import React, { useEffect, useState } from 'react';
import {
  createEntity,
  buildEntityView,
  type EntityKind,
  type EntityView,
} from '../lib/entityEngine';

type ActivatedUniverseProps = {
  seed: string;
  kind?: EntityKind;
};

export const ActivatedUniverse: React.FC<ActivatedUniverseProps> = ({ seed, kind = 'unknown' }) => {
  const entity = createEntity(seed, kind);
  const view: EntityView = buildEntityView(entity);

  const { identity, theme, universe, mood, story, suggestions } = view;

  const bg      = theme.theme.background ?? '#05060a';
  const primary = theme.theme.primary;
  const accent  = theme.theme.accent;
  const text    = theme.theme.text ?? '#ffffff';

  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 20); return () => clearTimeout(t); }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '24px',
        background: `radial-gradient(circle at top, ${accent}22, ${bg})`,
        color: text,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.45s ease',
      }}
    >
      {/* Identity + Theme */}
      <header
        style={{
          borderRadius: 16,
          padding: 16,
          marginBottom: 24,
          background: `${primary}33`,
          border: `1px solid ${primary}88`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 32, padding: 8, borderRadius: 12, background: `${accent}22` }}>
            {identity.emoji}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              {identity.label} <span style={{ opacity: 0.7 }}>· {entity.kind}</span>
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              Tone: {identity.tone} · Mood: {mood.tone} ({Math.round(mood.intensity * 100)}%)
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Universe layout: {universe.layout} · Modules: {universe.modules.join(', ')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.08 }}>
          <span style={{ padding: '4px 8px', borderRadius: 999, border: `1px solid ${accent}88`, background: `${accent}22` }}>
            Seed: {entity.seed}
          </span>
          <span style={{ padding: '4px 8px', borderRadius: 999, border: `1px solid ${primary}66`, background: `${primary}22` }}>
            Universe ID: {entity.id}
          </span>
        </div>
      </header>

      {/* Grid: Story · Suggestions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.5fr)', gap: 16 }}>

        {/* Story / Timeline */}
        <section
          style={{
            borderRadius: 16,
            padding: 16,
            background: '#00000055',
            border: `1px solid ${primary}55`,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Story Arc</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>{story.title}</div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.08, opacity: 0.7, marginBottom: 8 }}>
            Phase: {story.phase}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{story.summary}</div>
          <div style={{ marginTop: 16, fontSize: 11, opacity: 0.7, borderTop: '1px solid #ffffff22', paddingTop: 8 }}>
            Timeline will render here (events, milestones, turning points) once wired to real data.
          </div>
        </section>

        {/* Suggestions / Possibility */}
        <section
          style={{
            borderRadius: 16,
            padding: 16,
            background: '#00000055',
            border: `1px solid ${accent}55`,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Universe Suggestions</div>
          {suggestions.map((s) => (
            <div
              key={s.id}
              style={{
                marginBottom: 8,
                padding: 8,
                borderRadius: 10,
                background: '#ffffff08',
                border: '1px solid #ffffff22',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</div>
              {s.details && (
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{s.details}</div>
              )}
              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.08 }}>
                Kind: {s.kind}
              </div>
            </div>
          ))}
          {suggestions.length === 0 && (
            <div style={{ fontSize: 13, opacity: 0.5 }}>No suggestions yet.</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ActivatedUniverse;
