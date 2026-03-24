import React, { useEffect, useState } from "react";

const ALL_ENDPOINTS = [
  // ── Universe OS ─────────────────────────────────────────────────
  { key: "connectivity-map",        label: "Connectivity Map",            path: "/api/universe-data/connectivity-map",          group: "Universe OS",        color: "#E8C77A" },
  { key: "continuum",               label: "Continuum",                   path: "/api/universe-data/continuum",                 group: "Universe OS",        color: "#E8C77A" },
  { key: "continuum-registry",      label: "Continuum Registry",          path: "/api/universe-data/continuum/registry",        group: "Universe OS",        color: "#E8C77A" },
  { key: "continuum-relations",     label: "Continuum Relations",         path: "/api/universe-data/continuum/relations",       group: "Universe OS",        color: "#E8C77A" },
  { key: "continuum-channels",      label: "Continuum Channels",          path: "/api/universe-data/continuum/channels",        group: "Universe OS",        color: "#E8C77A" },
  { key: "continuum-channels-alt",  label: "Continuum Channels (alt)",    path: "/api/universe-data/continuum-channels",        group: "Universe OS",        color: "#E8C77A" },
  { key: "continuum-relations-alt", label: "Continuum Relations (alt)",   path: "/api/universe-data/continuum-relations",       group: "Universe OS",        color: "#E8C77A" },
  { key: "continuum-inspect",       label: "Continuum Inspector Output",  path: "/api/universe-data/continuum/inspect",         group: "Universe OS",        color: "#E8C77A" },
  { key: "creation-story",          label: "Creation Story Manifest",     path: "/api/universe-data/creation-story",            group: "Universe OS",        color: "#E8C77A" },
  { key: "experience-layer",        label: "Experience Layer",            path: "/api/universe-data/experience-layer",          group: "Universe OS",        color: "#E8C77A" },
  { key: "master-manifest",         label: "Universe OS Master Manifest", path: "/api/universe-data/master-manifest",           group: "Universe OS",        color: "#E8C77A" },
  { key: "page-manifest",           label: "Universe Page Manifest",      path: "/api/universe-data/page-manifest",             group: "Universe OS",        color: "#E8C77A" },
  // ── Family Universe ─────────────────────────────────────────────
  { key: "family-universe",         label: "Family Universe",             path: "/api/universe-data/family-universe",           group: "Family Universe",    color: "#9CAF88" },
  { key: "first-entry-experience",  label: "First Entry Experience",      path: "/api/universe-data/first-entry-experience",    group: "Family Universe",    color: "#9CAF88" },
  { key: "first-moment",            label: "First Moment",                path: "/api/universe-data/first-moment",              group: "Family Universe",    color: "#9CAF88" },
  { key: "first-world",             label: "First World",                 path: "/api/universe-data/first-world",               group: "Family Universe",    color: "#9CAF88" },
  { key: "kids-universe",           label: "Kids Universe",               path: "/api/universe-data/kids-universe",             group: "Family Universe",    color: "#9CAF88" },
  // ── Reality Layer ───────────────────────────────────────────────
  { key: "reality-absolute",        label: "Absolute Layer",              path: "/api/universe-data/reality/absolute-layer",    group: "Reality Layer",      color: "#8ab4d4" },
  { key: "reality-activation",      label: "Activation Map",              path: "/api/universe-data/reality/activation-map",    group: "Reality Layer",      color: "#8ab4d4" },
  { key: "reality-orchestrator",    label: "Orchestrator Layer",          path: "/api/universe-data/reality/orchestrator",      group: "Reality Layer",      color: "#8ab4d4" },
  { key: "reality-stack",           label: "Reality Stack",               path: "/api/universe-data/reality/stack",             group: "Reality Layer",      color: "#8ab4d4" },
  { key: "reality-index",           label: "Universe Index",              path: "/api/universe-data/reality/index",             group: "Reality Layer",      color: "#8ab4d4" },
  // ── Self Layer ──────────────────────────────────────────────────
  { key: "self-ineffable",          label: "Ineffable Layer",             path: "/api/universe-data/self/ineffable",            group: "Self Layer",         color: "#c4a8d4" },
  { key: "self-generating",         label: "Self-Generating Layer",       path: "/api/universe-data/self/self-generating",      group: "Self Layer",         color: "#c4a8d4" },
  { key: "self-transcendental",     label: "Transcendental Layer",        path: "/api/universe-data/self/transcendental",       group: "Self Layer",         color: "#c4a8d4" },
];

const GROUPS = ["Universe OS", "Family Universe", "Reality Layer", "Self Layer"];

export default function AllSystemsPage() {
  const [selected, setSelected] = useState<string>(ALL_ENDPOINTS[0].key);
  const [cache, setCache]       = useState<Record<string, unknown>>({});
  const [loading, setLoading]   = useState(false);

  const ep = ALL_ENDPOINTS.find(e => e.key === selected);

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
      <header style={{ padding: "1.25rem 2rem", borderBottom: "1px solid #1e2e1e", display: "flex", alignItems: "baseline", gap: "1.5rem" }}>
        <h1 style={{ color: "#E8C77A", fontSize: "1.3rem", margin: 0 }}>All Systems Explorer</h1>
        <span style={{ color: "#9CAF88", fontSize: "0.8rem" }}>
          {ALL_ENDPOINTS.length} connected files &mdash; {GROUPS.length} layers
        </span>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <nav style={{ width: "270px", borderRight: "1px solid #1e2e1e", padding: "1rem 0.75rem", overflowY: "auto", flexShrink: 0 }}>
          {GROUPS.map(group => {
            const entries = ALL_ENDPOINTS.filter(e => e.group === group);
            const groupColor = entries[0]?.color ?? "#E8C77A";
            return (
              <div key={group} style={{ marginBottom: "1.25rem" }}>
                <div style={{
                  color: groupColor,
                  fontSize: "0.68rem",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "5px",
                  paddingLeft: "4px",
                }}>
                  {group} <span style={{ opacity: 0.5 }}>({entries.length})</span>
                </div>
                {entries.map(e => (
                  <button
                    key={e.key}
                    onClick={() => setSelected(e.key)}
                    style={{
                      display: "block",
                      width: "100%",
                      background: selected === e.key ? "#1a2a1a" : "transparent",
                      border: selected === e.key ? `1px solid ${e.color}` : "1px solid transparent",
                      color: selected === e.key ? e.color : "#8a9a8a",
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
            );
          })}
        </nav>

        {/* Detail panel */}
        <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
          {ep && (
            <>
              <div style={{ color: ep.color, fontSize: "0.9rem", fontWeight: "bold", marginBottom: "2px" }}>{ep.label}</div>
              <div style={{ color: "#444", fontSize: "0.74rem", marginBottom: "4px" }}>Group: {ep.group}</div>
              <div style={{ color: "#555", fontSize: "0.74rem", marginBottom: "1rem", fontFamily: "monospace" }}>GET {ep.path}</div>
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
              maxHeight: "calc(100vh - 180px)",
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
