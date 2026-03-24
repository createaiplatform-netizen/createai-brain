import React, { useEffect, useState } from "react";

const PUBLIC_ENDPOINTS = [
  { key: "connectivity-map",        label: "Connectivity Map",            path: "/api/universe-data/connectivity-map",          group: "Universe OS" },
  { key: "continuum",               label: "Continuum",                   path: "/api/universe-data/continuum",                 group: "Universe OS" },
  { key: "continuum-registry",      label: "Continuum Registry",          path: "/api/universe-data/continuum/registry",        group: "Universe OS" },
  { key: "continuum-relations",     label: "Continuum Relations",         path: "/api/universe-data/continuum/relations",       group: "Universe OS" },
  { key: "continuum-channels",      label: "Continuum Channels",          path: "/api/universe-data/continuum/channels",        group: "Universe OS" },
  { key: "creation-story",          label: "Creation Story",              path: "/api/universe-data/creation-story",            group: "Universe OS" },
  { key: "master-manifest",         label: "Universe OS Master Manifest", path: "/api/universe-data/master-manifest",           group: "Universe OS" },
  { key: "page-manifest",           label: "Universe Page Manifest",      path: "/api/universe-data/page-manifest",             group: "Universe OS" },
  { key: "family-universe",         label: "Family Universe",             path: "/api/universe-data/family-universe",           group: "Family" },
  { key: "first-moment",            label: "First Moment",                path: "/api/universe-data/first-moment",              group: "Family" },
  { key: "first-world",             label: "First World",                 path: "/api/universe-data/first-world",               group: "Family" },
  { key: "reality-stack",           label: "Reality Stack",               path: "/api/universe-data/reality/stack",             group: "Reality" },
  { key: "reality-index",           label: "Universe Index",              path: "/api/universe-data/reality/index",             group: "Reality" },
  { key: "self-ineffable",          label: "Ineffable Layer",             path: "/api/universe-data/self/ineffable",            group: "Self" },
  { key: "self-transcendental",     label: "Transcendental Layer",        path: "/api/universe-data/self/transcendental",       group: "Self" },
];

const GROUPS = ["Universe OS", "Family", "Reality", "Self"];

export default function PublicExplorerPage() {
  const [selected, setSelected] = useState<string>(PUBLIC_ENDPOINTS[0].key);
  const [cache, setCache]       = useState<Record<string, unknown>>({});
  const [loading, setLoading]   = useState(false);

  const ep = PUBLIC_ENDPOINTS.find(e => e.key === selected);

  useEffect(() => {
    if (!ep) return;
    if (cache[selected] !== undefined) return;
    setLoading(true);
    fetch(ep.path)
      .then(r => r.ok ? r.json() : { error: r.status })
      .then(json => setCache(prev => ({ ...prev, [selected]: json })))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div style={{ background: "#0A0F1F", minHeight: "100vh", color: "#F5F3EE", fontFamily: "monospace", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "1.25rem 2rem", borderBottom: "1px solid #1e2e1e" }}>
        <h1 style={{ color: "#E8C77A", fontSize: "1.3rem", margin: 0 }}>Public Explorer</h1>
        <p style={{ color: "#9CAF88", fontSize: "0.8rem", margin: "0.2rem 0 0" }}>
          Read-only &mdash; {PUBLIC_ENDPOINTS.length} endpoints &mdash; no authentication required
        </p>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <nav style={{ width: "240px", borderRight: "1px solid #1e2e1e", padding: "1rem 0.75rem", overflowY: "auto", flexShrink: 0 }}>
          {GROUPS.map(group => (
            <div key={group} style={{ marginBottom: "1rem" }}>
              <div style={{ color: "#E8C77A", fontSize: "0.68rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px", paddingLeft: "4px" }}>
                {group}
              </div>
              {PUBLIC_ENDPOINTS.filter(e => e.group === group).map(e => (
                <button
                  key={e.key}
                  onClick={() => setSelected(e.key)}
                  style={{
                    display: "block",
                    width: "100%",
                    background: selected === e.key ? "#1a2a1a" : "transparent",
                    border: selected === e.key ? "1px solid #9CAF88" : "1px solid transparent",
                    color: selected === e.key ? "#9CAF88" : "#5a7a5a",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "0.74rem",
                    marginBottom: "2px",
                  }}
                >
                  {e.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
          {ep && (
            <>
              <div style={{ color: "#E8C77A", fontSize: "0.88rem", fontWeight: "bold", marginBottom: "2px" }}>{ep.label}</div>
              <div style={{ color: "#3a5a3a", fontSize: "0.72rem", marginBottom: "4px" }}>Group: {ep.group}</div>
              <div style={{ color: "#555", fontSize: "0.72rem", marginBottom: "1rem" }}>GET {ep.path}</div>
            </>
          )}
          {loading ? (
            <p style={{ color: "#9CAF88" }}>Loading&hellip;</p>
          ) : (
            <pre style={{
              background: "#0d1520",
              border: "1px solid #1e2e1e",
              borderRadius: "6px",
              padding: "1.25rem",
              overflow: "auto",
              fontSize: "0.74rem",
              color: "#F5F3EE",
              maxHeight: "calc(100vh - 200px)",
              margin: 0,
            }}>
              {cache[selected] !== undefined ? JSON.stringify(cache[selected], null, 2) : "Select a file to view its data."}
            </pre>
          )}
        </main>
      </div>
    </div>
  );
}
