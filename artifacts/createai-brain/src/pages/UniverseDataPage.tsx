import React, { useEffect, useState } from "react";

const ENDPOINTS: { key: string; label: string; path: string }[] = [
  { key: "connectivity-map",       label: "Connectivity Map",          path: "/api/universe-data/connectivity-map" },
  { key: "continuum",              label: "Continuum",                 path: "/api/universe-data/continuum" },
  { key: "continuum-registry",     label: "Continuum Registry",        path: "/api/universe-data/continuum/registry" },
  { key: "continuum-relations",    label: "Continuum Relations",       path: "/api/universe-data/continuum/relations" },
  { key: "continuum-channels",     label: "Continuum Channels",        path: "/api/universe-data/continuum/channels" },
  { key: "continuum-channels-alt", label: "Continuum Channels (alt)",  path: "/api/universe-data/continuum-channels" },
  { key: "continuum-relations-alt",label: "Continuum Relations (alt)", path: "/api/universe-data/continuum-relations" },
  { key: "continuum-inspect",      label: "Continuum Inspect",         path: "/api/universe-data/continuum/inspect" },
  { key: "creation-story",         label: "Creation Story Manifest",   path: "/api/universe-data/creation-story" },
  { key: "experience-layer",       label: "Experience Layer",          path: "/api/universe-data/experience-layer" },
  { key: "family-universe",        label: "Family Universe",           path: "/api/universe-data/family-universe" },
  { key: "first-entry-experience", label: "First Entry Experience",    path: "/api/universe-data/first-entry-experience" },
  { key: "first-moment",           label: "First Moment",              path: "/api/universe-data/first-moment" },
  { key: "first-world",            label: "First World",               path: "/api/universe-data/first-world" },
  { key: "kids-universe",          label: "Kids Universe",             path: "/api/universe-data/kids-universe" },
  { key: "master-manifest",        label: "Universe OS Master Manifest",path: "/api/universe-data/master-manifest" },
  { key: "page-manifest",          label: "Universe Page Manifest",    path: "/api/universe-data/page-manifest" },
  { key: "reality-absolute",       label: "Reality: Absolute Layer",   path: "/api/universe-data/reality/absolute-layer" },
  { key: "reality-activation",     label: "Reality: Activation Map",   path: "/api/universe-data/reality/activation-map" },
  { key: "reality-orchestrator",   label: "Reality: Orchestrator",     path: "/api/universe-data/reality/orchestrator" },
  { key: "reality-stack",          label: "Reality: Stack",            path: "/api/universe-data/reality/stack" },
  { key: "reality-index",          label: "Reality: Index",            path: "/api/universe-data/reality/index" },
  { key: "self-ineffable",         label: "Self: Ineffable Layer",     path: "/api/universe-data/self/ineffable" },
  { key: "self-generating",        label: "Self: Self-Generating",     path: "/api/universe-data/self/self-generating" },
  { key: "self-transcendental",    label: "Self: Transcendental",      path: "/api/universe-data/self/transcendental" },
];

export default function UniverseDataPage() {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>(ENDPOINTS[0].key);

  useEffect(() => {
    setLoading(true);
    const ep = ENDPOINTS.find(e => e.key === selected);
    if (!ep) return;
    fetch(ep.path)
      .then(r => r.ok ? r.json() : { error: r.status })
      .then(json => setData(prev => ({ ...prev, [selected]: json })))
      .finally(() => setLoading(false));
  }, [selected]);

  const current = data[selected];

  return (
    <div style={{ background: "#0A0F1F", minHeight: "100vh", color: "#F5F3EE", fontFamily: "monospace", padding: "2rem" }}>
      <h1 style={{ color: "#E8C77A", fontSize: "1.4rem", marginBottom: "0.25rem" }}>Universe Data</h1>
      <p style={{ color: "#9CAF88", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        {ENDPOINTS.length} endpoints &mdash; {ENDPOINTS.length} source files connected
      </p>

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
        <nav style={{ minWidth: "260px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {ENDPOINTS.map(ep => (
            <button
              key={ep.key}
              onClick={() => setSelected(ep.key)}
              style={{
                background: selected === ep.key ? "#1a2a1a" : "transparent",
                border: selected === ep.key ? "1px solid #9CAF88" : "1px solid transparent",
                color: selected === ep.key ? "#E8C77A" : "#9CAF88",
                padding: "6px 10px",
                borderRadius: "4px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "0.78rem",
              }}
            >
              {ep.label}
            </button>
          ))}
        </nav>

        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#E8C77A", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
            GET {ENDPOINTS.find(e => e.key === selected)?.path}
          </div>
          {loading ? (
            <p style={{ color: "#9CAF88" }}>Loading&hellip;</p>
          ) : (
            <pre style={{
              background: "#111820",
              border: "1px solid #1e2e1e",
              borderRadius: "6px",
              padding: "1rem",
              overflow: "auto",
              fontSize: "0.75rem",
              color: "#F5F3EE",
              maxHeight: "70vh",
            }}>
              {JSON.stringify(current, null, 2)}
            </pre>
          )}
        </main>
      </div>
    </div>
  );
}
