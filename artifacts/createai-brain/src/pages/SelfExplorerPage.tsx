import React, { useEffect, useState } from "react";

const BASE = "/api/universe-data";

const SELF_LAYERS = [
  { key: "ineffable",    label: "Ineffable Layer",       path: `${BASE}/self/ineffable`,        source: "self/ineffableLayerManifest.ts" },
  { key: "generating",   label: "Self-Generating Layer", path: `${BASE}/self/self-generating`,  source: "self/selfGeneratingLayerManifest.ts" },
  { key: "transcendental", label: "Transcendental Layer",path: `${BASE}/self/transcendental`,   source: "self/transcendentalLayerManifest.ts" },
];

function LayerPanel({ label, path, source }: { label: string; path: string; source: string }) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(path)
      .then(r => r.ok ? r.json() : { error: r.status })
      .then(setData)
      .finally(() => setLoading(false));
  }, [path]);

  return (
    <div style={{
      background: "#0d1020",
      border: "1px solid #3a1e5a",
      borderRadius: "8px",
      padding: "1.25rem",
      marginBottom: "1.5rem",
    }}>
      <div style={{ color: "#c4a8d4", fontSize: "0.9rem", fontWeight: "bold", marginBottom: "2px" }}>{label}</div>
      <div style={{ color: "#6a4a8a", fontSize: "0.7rem", marginBottom: "12px" }}>{source} &rarr; GET {path}</div>
      {loading ? (
        <p style={{ color: "#c4a8d4", fontSize: "0.8rem" }}>Loading&hellip;</p>
      ) : (
        <pre style={{
          overflow: "auto",
          fontSize: "0.73rem",
          color: "#F5F3EE",
          maxHeight: "280px",
          margin: 0,
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function SelfExplorerPage() {
  return (
    <div style={{ background: "#0A0F1F", minHeight: "100vh", color: "#F5F3EE", fontFamily: "monospace", padding: "2rem" }}>
      <h1 style={{ color: "#c4a8d4", fontSize: "1.3rem", margin: "0 0 0.25rem" }}>Self Explorer</h1>
      <p style={{ color: "#8a6aaa", fontSize: "0.8rem", margin: "0 0 2rem" }}>
        {SELF_LAYERS.length} self layer files &mdash; all connected
      </p>
      {SELF_LAYERS.map(layer => (
        <LayerPanel key={layer.key} label={layer.label} path={layer.path} source={layer.source} />
      ))}
    </div>
  );
}
