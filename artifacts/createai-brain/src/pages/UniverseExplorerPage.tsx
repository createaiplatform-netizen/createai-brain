import React, { useEffect, useState } from "react";

const UNIVERSE_ENDPOINTS = [
  { key: "connectivity-map",        label: "Connectivity Map",           path: "/api/universe-data/connectivity-map",          group: "universe" },
  { key: "continuum",               label: "Continuum",                  path: "/api/universe-data/continuum",                 group: "universe" },
  { key: "continuum-registry",      label: "Continuum Registry",         path: "/api/universe-data/continuum/registry",        group: "universe" },
  { key: "continuum-relations",     label: "Continuum Relations",        path: "/api/universe-data/continuum/relations",       group: "universe" },
  { key: "continuum-channels",      label: "Continuum Channels",         path: "/api/universe-data/continuum/channels",        group: "universe" },
  { key: "continuum-channels-alt",  label: "Continuum Channels (alt)",   path: "/api/universe-data/continuum-channels",        group: "universe" },
  { key: "continuum-relations-alt", label: "Continuum Relations (alt)",  path: "/api/universe-data/continuum-relations",       group: "universe" },
  { key: "continuum-inspect",       label: "Continuum Inspect",          path: "/api/universe-data/continuum/inspect",         group: "universe" },
  { key: "creation-story",          label: "Creation Story Manifest",    path: "/api/universe-data/creation-story",            group: "universe" },
  { key: "experience-layer",        label: "Experience Layer",           path: "/api/universe-data/experience-layer",          group: "universe" },
  { key: "family-universe",         label: "Family Universe",            path: "/api/universe-data/family-universe",           group: "family"   },
  { key: "first-entry-experience",  label: "First Entry Experience",     path: "/api/universe-data/first-entry-experience",    group: "family"   },
  { key: "first-moment",            label: "First Moment",               path: "/api/universe-data/first-moment",              group: "family"   },
  { key: "first-world",             label: "First World",                path: "/api/universe-data/first-world",               group: "family"   },
  { key: "kids-universe",           label: "Kids Universe",              path: "/api/universe-data/kids-universe",             group: "family"   },
  { key: "master-manifest",         label: "Universe OS Master Manifest",path: "/api/universe-data/master-manifest",           group: "universe" },
  { key: "page-manifest",           label: "Universe Page Manifest",     path: "/api/universe-data/page-manifest",             group: "universe" },
  { key: "reality-absolute",        label: "Absolute Layer",             path: "/api/universe-data/reality/absolute-layer",    group: "reality"  },
  { key: "reality-activation",      label: "Activation Map",             path: "/api/universe-data/reality/activation-map",    group: "reality"  },
  { key: "reality-orchestrator",    label: "Orchestrator Layer",         path: "/api/universe-data/reality/orchestrator",      group: "reality"  },
  { key: "reality-stack",           label: "Reality Stack",              path: "/api/universe-data/reality/stack",             group: "reality"  },
  { key: "reality-index",           label: "Universe Index",             path: "/api/universe-data/reality/index",             group: "reality"  },
  { key: "self-ineffable",          label: "Ineffable Layer",            path: "/api/universe-data/self/ineffable",            group: "self"     },
  { key: "self-generating",         label: "Self-Generating Layer",      path: "/api/universe-data/self/self-generating",      group: "self"     },
  { key: "self-transcendental",     label: "Transcendental Layer",       path: "/api/universe-data/self/transcendental",       group: "self"     },
];

const GROUP_LABELS: Record<string, string> = {
  universe: "Universe OS",
  family:   "Family Universe",
  reality:  "Reality Layer",
  self:     "Self Layer",
};

const GROUP_COLORS: Record<string, string> = {
  universe: "#E8C77A",
  family:   "#9CAF88",
  reality:  "#8ab4d4",
  self:     "#c4a8d4",
};

export default function UniverseExplorerPage() {
  const [selected, setSelected] = useState<string>(UNIVERSE_ENDPOINTS[0].key);
  const [cache, setCache] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);

  const ep = UNIVERSE_ENDPOINTS.find(e => e.key === selected);

  useEffect(() => {
    if (!ep) return;
    if (cache[selected] !== undefined) return;
    setLoading(true);
    fetch(ep.path)
      .then(r => r.ok ? r.json() : { error: r.status })
      .then(json => setCache(prev => ({ ...prev, [selected]: json })))
      .finally(() => setLoading(false));
  }, [selected]);

  const groups = ["universe", "family", "reality", "self"];

  return (
    <div style={{ background: "#0A0F1F", minHeight: "100vh", color: "#F5F3EE", fontFamily: "monospace", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "1.25rem 2rem", borderBottom: "1px solid #1e2e1e" }}>
        <h1 style={{ color: "#E8C77A", fontSize: "1.3rem", margin: 0 }}>Universe Explorer</h1>
        <p style={{ color: "#9CAF88", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
          {UNIVERSE_ENDPOINTS.length} connected files &mdash; 4 layers
        </p>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <nav style={{ width: "260px", borderRight: "1px solid #1e2e1e", padding: "1rem", overflowY: "auto" }}>
          {groups.map(group => (
            <div key={group} style={{ marginBottom: "1rem" }}>
              <div style={{ color: GROUP_COLORS[group], fontSize: "0.7rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                {GROUP_LABELS[group]}
              </div>
              {UNIVERSE_ENDPOINTS.filter(e => e.group === group).map(ep => (
                <button
                  key={ep.key}
                  onClick={() => setSelected(ep.key)}
                  style={{
                    display: "block",
                    width: "100%",
                    background: selected === ep.key ? "#1a2a1a" : "transparent",
                    border: selected === ep.key ? `1px solid ${GROUP_COLORS[group]}` : "1px solid transparent",
                    color: selected === ep.key ? GROUP_COLORS[group] : "#9CAF88",
                    padding: "5px 8px",
                    borderRadius: "4px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "0.76rem",
                    marginBottom: "2px",
                  }}
                >
                  {ep.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
          {ep && (
            <>
              <div style={{ color: GROUP_COLORS[ep.group], fontSize: "0.85rem", marginBottom: "0.25rem", fontWeight: "bold" }}>{ep.label}</div>
              <div style={{ color: "#555", fontSize: "0.75rem", marginBottom: "1rem" }}>GET {ep.path}</div>
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
              fontSize: "0.75rem",
              color: "#F5F3EE",
              maxHeight: "calc(100vh - 180px)",
            }}>
              {JSON.stringify(cache[selected], null, 2)}
            </pre>
          )}
        </main>
      </div>
    </div>
  );
}
