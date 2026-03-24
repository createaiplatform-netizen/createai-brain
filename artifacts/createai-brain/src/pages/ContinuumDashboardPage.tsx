import React, { useEffect, useState } from "react";

const BASE = "/api/universe-data";

type Section = { key: string; label: string; path: string };

const SECTIONS: Section[] = [
  { key: "continuum",        label: "Continuum",              path: `${BASE}/continuum` },
  { key: "registry",         label: "Registry",               path: `${BASE}/continuum/registry` },
  { key: "relations",        label: "Relations",              path: `${BASE}/continuum/relations` },
  { key: "channels",         label: "Channels",               path: `${BASE}/continuum/channels` },
  { key: "inspect",          label: "Inspector Output",       path: `${BASE}/continuum/inspect` },
  { key: "channels-alt",     label: "Channels (alt source)",  path: `${BASE}/continuum-channels` },
  { key: "relations-alt",    label: "Relations (alt source)", path: `${BASE}/continuum-relations` },
];

function Panel({ label, path }: { label: string; path: string }) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(path)
      .then(r => r.ok ? r.json() : { error: r.status })
      .then(setData)
      .finally(() => setLoading(false));
  }, [path]);

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ color: "#E8C77A", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "4px" }}>{label}</div>
      <div style={{ color: "#555", fontSize: "0.72rem", marginBottom: "8px" }}>GET {path}</div>
      {loading ? (
        <p style={{ color: "#9CAF88", fontSize: "0.8rem" }}>Loading&hellip;</p>
      ) : (
        <pre style={{
          background: "#0d1520",
          border: "1px solid #1e2e1e",
          borderRadius: "6px",
          padding: "1rem",
          overflow: "auto",
          fontSize: "0.73rem",
          color: "#F5F3EE",
          maxHeight: "300px",
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function ContinuumDashboardPage() {
  return (
    <div style={{ background: "#0A0F1F", minHeight: "100vh", color: "#F5F3EE", fontFamily: "monospace", padding: "2rem" }}>
      <h1 style={{ color: "#E8C77A", fontSize: "1.3rem", margin: "0 0 0.25rem" }}>Continuum Dashboard</h1>
      <p style={{ color: "#9CAF88", fontSize: "0.8rem", margin: "0 0 2rem" }}>
        Continuum &mdash; Registry &mdash; Relations &mdash; Channels &mdash; Inspector
      </p>
      {SECTIONS.map(s => (
        <Panel key={s.key} label={s.label} path={s.path} />
      ))}
    </div>
  );
}
