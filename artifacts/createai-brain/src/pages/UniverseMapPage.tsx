// ═══════════════════════════════════════════════════════════════════════════
// UniverseMapPage.tsx
// Visual map of universe engines, layers, reality stack, self layer,
// family universe, and experience layer.
// Data from existing /api/universe-data/* endpoints.
// No new logic — only visualization.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

// ── Types ────────────────────────────────────────────────────────────────────

interface UniverseEngine {
  id?: string;
  name?: string;
  label?: string;
  type?: string;
  description?: string;
  status?: string;
  [key: string]: unknown;
}

interface RealityLayer {
  id?: string;
  name?: string;
  label?: string;
  description?: string;
  [key: string]: unknown;
}

// ── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchUniverse<T>(path: string): Promise<T | null> {
  try {
    const res = await apiRequest("GET", path);
    return await res.json() as T;
  } catch { return null; }
}

// ── Engine card ───────────────────────────────────────────────────────────────

function EngineCard({ item, color }: { item: UniverseEngine; color: string }) {
  const name = item.name ?? item.label ?? item.id ?? "Unknown";
  const desc = typeof item.description === "string" ? item.description : "";
  return (
    <div style={{
      background: `${color}10`, border: `1px solid ${color}28`,
      borderRadius: 10, padding: "12px 14px",
      display: "flex", flexDirection: "column", gap: 5,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: "-0.01em" }}>{name}</div>
      {desc && (
        <div style={{
          fontSize: 11, color: "#64748b", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{desc}</div>
      )}
      {item.status && (
        <div style={{ fontSize: 9, fontWeight: 700, color: item.status === "active" ? "#22c55e" : "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {String(item.status)}
        </div>
      )}
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function MapSection({ title, icon, color, children }: {
  title: string; icon: string; color: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 24 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "transparent", border: "none", cursor: "pointer",
          padding: 0, marginBottom: open ? 14 : 0, width: "100%", textAlign: "left",
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h2 style={{ fontSize: 14, fontWeight: 800, color, margin: 0, flex: 1, letterSpacing: "-0.02em" }}>
          {title}
        </h2>
        <span style={{ fontSize: 12, color: "#475569" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && children}
    </div>
  );
}

// ── Chip list ─────────────────────────────────────────────────────────────────

function ChipList({ items, color }: { items: unknown[]; color: string }) {
  const labels = items.map(i =>
    typeof i === "string" ? i
      : typeof i === "object" && i !== null
        ? ((i as Record<string, unknown>).name ?? (i as Record<string, unknown>).label ?? (i as Record<string, unknown>).id ?? JSON.stringify(i))
        : String(i)
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {labels.map((l, idx) => (
        <span key={idx} style={{
          fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 7,
          background: `${color}14`, color, border: `1px solid ${color}28`,
        }}>{String(l)}</span>
      ))}
      {labels.length === 0 && <span style={{ fontSize: 12, color: "#475569" }}>No data</span>}
    </div>
  );
}

// ── Activation chain ──────────────────────────────────────────────────────────

function ActivationChain({ steps }: { steps: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 7,
            background: "rgba(99,102,241,0.12)", color: "#a5b4fc",
            border: "1px solid rgba(99,102,241,0.25)",
          }}>{s}</span>
          {i < steps.length - 1 && <span style={{ color: "#475569", fontSize: 14 }}>→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UniverseMapPage() {
  const [continuum,   setContinuum]   = useState<{ engines?: UniverseEngine[]; layers?: RealityLayer[]; activationChain?: string[] } | null>(null);
  const [manifest,    setManifest]    = useState<Record<string, unknown> | null>(null);
  const [reality,     setReality]     = useState<{ stack?: RealityLayer[] } | null>(null);
  const [selfData,    setSelfData]    = useState<Record<string, unknown> | null>(null);
  const [familyUni,   setFamilyUni]   = useState<Record<string, unknown> | null>(null);
  const [expLayer,    setExpLayer]    = useState<Record<string, unknown> | null>(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [c, m, r, s, f, e] = await Promise.all([
        fetchUniverse<typeof continuum>("/api/universe-data/continuum"),
        fetchUniverse<typeof manifest>("/api/universe-data/master-manifest"),
        fetchUniverse<typeof reality>("/api/universe-data/reality/stack"),
        fetchUniverse<typeof selfData>("/api/universe-data/self"),
        fetchUniverse<typeof familyUni>("/api/universe-data/family-universe"),
        fetchUniverse<typeof expLayer>("/api/universe-data/experience-layer"),
      ]);
      setContinuum(c);
      setManifest(m);
      setReality(r);
      setSelfData(s);
      setFamilyUni(f);
      setExpLayer(e);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{
      minHeight: "100%", background: "#050A18", color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "28px 24px 60px",
    }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>🌌</span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", margin: 0, letterSpacing: "-0.03em" }}>
              Universe Map
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            Visual overview of all Universe OS engines, layers, reality stack, self layer, family universe, and experience layer.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{
              width: 40, height: 40, border: "3px solid rgba(124,58,237,0.2)",
              borderTop: "3px solid #7c3aed", borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 0.9s linear infinite",
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ color: "#94a3b8", fontSize: 13 }}>Loading universe data\u2026</p>
          </div>
        ) : (
          <>
            {/* Continuum — engines */}
            <MapSection title="Universe Engines (Continuum)" icon="⚙️" color="#7c3aed">
              {continuum?.engines && continuum.engines.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {continuum.engines.map((e, i) => <EngineCard key={i} item={e} color="#7c3aed" />)}
                </div>
              ) : (
                <ChipList items={Object.keys(manifest ?? {})} color="#7c3aed" />
              )}
            </MapSection>

            {/* Activation Chain */}
            {continuum?.activationChain && continuum.activationChain.length > 0 && (
              <MapSection title="Activation Chain" icon="⚡" color="#6366f1">
                <ActivationChain steps={continuum.activationChain} />
              </MapSection>
            )}

            {/* Universe Layers */}
            <MapSection title="Universe Layers" icon="🔢" color="#0284c7">
              <ChipList
                items={continuum?.layers?.length ? continuum.layers : (
                  Array.isArray((manifest as Record<string, unknown>)?.layers)
                    ? ((manifest as Record<string, unknown>).layers as unknown[])
                    : []
                )}
                color="#0284c7"
              />
            </MapSection>

            {/* Reality Stack */}
            <MapSection title="Reality Stack" icon="🏗️" color="#059669">
              {reality?.stack && reality.stack.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {reality.stack.map((layer, i) => <EngineCard key={i} item={layer as UniverseEngine} color="#059669" />)}
                </div>
              ) : (
                <ChipList items={Object.keys(reality ?? {})} color="#059669" />
              )}
            </MapSection>

            {/* Self Layer */}
            <MapSection title="Self Layer" icon="🧬" color="#e8c77a">
              {selfData ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(selfData).slice(0, 20).map(([k, v]) => (
                    <div key={k} style={{
                      background: "rgba(232,199,122,0.10)", border: "1px solid rgba(232,199,122,0.25)",
                      borderRadius: 9, padding: "8px 12px", minWidth: 120,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#e8c77a", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
                      <div style={{ fontSize: 11, color: "#cbd5e1", wordBreak: "break-word" }}>
                        {typeof v === "object" ? JSON.stringify(v).slice(0, 60) : String(v).slice(0, 60)}
                      </div>
                    </div>
                  ))}
                  {Object.keys(selfData).length === 0 && <span style={{ color: "#475569", fontSize: 12 }}>No self data</span>}
                </div>
              ) : <span style={{ color: "#475569", fontSize: 12 }}>Not available</span>}
            </MapSection>

            {/* Family Universe */}
            <MapSection title="Family Universe" icon="👨‍👩‍👧" color="#ec4899">
              {familyUni ? (
                <ChipList items={Object.keys(familyUni)} color="#ec4899" />
              ) : <span style={{ color: "#475569", fontSize: 12 }}>Not available</span>}
            </MapSection>

            {/* Experience Layer */}
            <MapSection title="Experience Layer" icon="🌟" color="#f59e0b">
              {expLayer ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(expLayer).slice(0, 12).map(([k, v]) => (
                    <div key={k} style={{
                      background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.25)",
                      borderRadius: 9, padding: "8px 12px",
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
                      <div style={{ fontSize: 11, color: "#cbd5e1" }}>
                        {typeof v === "object" ? JSON.stringify(v).slice(0, 50) : String(v).slice(0, 80)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <span style={{ color: "#475569", fontSize: 12 }}>Not available</span>}
            </MapSection>
          </>
        )}
      </div>
    </div>
  );
}
