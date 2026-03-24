import React, { useEffect, useState } from "react";

const BASE = "/api/universe-data";

const REALITY_LAYERS = [
  { key: "absolute",      label: "Absolute Layer",      path: `${BASE}/reality/absolute-layer`,  source: "reality/absoluteLayer.ts" },
  { key: "activation",    label: "Activation Map",      path: `${BASE}/reality/activation-map`,  source: "reality/activationMap.ts" },
  { key: "orchestrator",  label: "Orchestrator Layer",  path: `${BASE}/reality/orchestrator`,    source: "reality/orchestratorLayer.ts" },
  { key: "stack",         label: "Reality Stack",       path: `${BASE}/reality/stack`,           source: "reality/realityStack.ts" },
  { key: "index",         label: "Universe Index",      path: `${BASE}/reality/index`,           source: "reality/universeIndex.ts" },
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
      background: "#0d1520",
      border: "1px solid #1e3a5a",
      borderRadius: "8px",
      padding: "1.25rem",
      marginBottom: "1.5rem",
    }}>
      <div style={{ color: "#8ab4d4", fontSize: "0.9rem", fontWeight: "bold", marginBottom: "2px" }}>{label}</div>
      <div style={{ color: "#3a5a7a", fontSize: "0.7rem", marginBottom: "12px" }}>{source} &rarr; GET {path}</div>
      {loading ? (
        <p style={{ color: "#8ab4d4", fontSize: "0.8rem" }}>Loading&hellip;</p>
      ) : (
        <pre style={{
          overflow: "auto",
          fontSize: "0.73rem",
          color: "#F5F3EE",
          maxHeight: "260px",
          margin: 0,
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function RealityExplorerPage() {
  return (
    <div style={{ background: "#0A0F1F", minHeight: "100vh", color: "#F5F3EE", fontFamily: "monospace", padding: "2rem" }}>
      <h1 style={{ color: "#8ab4d4", fontSize: "1.3rem", margin: "0 0 0.25rem" }}>Reality Explorer</h1>
      <p style={{ color: "#5a8aaa", fontSize: "0.8rem", margin: "0 0 2rem" }}>
        {REALITY_LAYERS.length} reality layer files &mdash; all connected
      </p>
      {REALITY_LAYERS.map(layer => (
        <LayerPanel key={layer.key} label={layer.label} path={layer.path} source={layer.source} />
      ))}
    </div>
  );
}
