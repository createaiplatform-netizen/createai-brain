import React, { useEffect, useState } from "react";

const FAMILY_ENDPOINTS = [
  { key: "family-universe",        label: "Family Universe",         path: "/api/universe-data/family-universe",          source: "universe/familyUniverse.ts" },
  { key: "kids-universe",          label: "Kids Universe",           path: "/api/universe-data/kids-universe",            source: "universe/kidsUniverse.ts" },
  { key: "first-world",            label: "First World",             path: "/api/universe-data/first-world",              source: "universe/firstWorld.ts" },
  { key: "first-moment",           label: "First Moment",            path: "/api/universe-data/first-moment",             source: "universe/firstMoment.ts" },
  { key: "first-entry-experience", label: "First Entry Experience",  path: "/api/universe-data/first-entry-experience",   source: "universe/firstEntryExperience.ts" },
];

function FamilyPanel({ label, path, source }: { label: string; path: string; source: string }) {
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
      background: "#0d1a0d",
      border: "1px solid #2a4a2a",
      borderRadius: "8px",
      padding: "1.25rem",
      marginBottom: "1.5rem",
    }}>
      <div style={{ color: "#9CAF88", fontSize: "0.9rem", fontWeight: "bold", marginBottom: "2px" }}>{label}</div>
      <div style={{ color: "#3a5a3a", fontSize: "0.7rem", marginBottom: "12px" }}>{source} &rarr; GET {path}</div>
      {loading ? (
        <p style={{ color: "#9CAF88", fontSize: "0.8rem" }}>Loading&hellip;</p>
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

export default function FamilyModePage() {
  return (
    <div style={{ background: "#0A0F1F", minHeight: "100vh", color: "#F5F3EE", fontFamily: "monospace", padding: "2rem" }}>
      <h1 style={{ color: "#9CAF88", fontSize: "1.3rem", margin: "0 0 0.25rem" }}>Family Mode</h1>
      <p style={{ color: "#5a7a5a", fontSize: "0.8rem", margin: "0 0 2rem" }}>
        {FAMILY_ENDPOINTS.length} family configuration files &mdash; all connected
      </p>
      {FAMILY_ENDPOINTS.map(ep => (
        <FamilyPanel key={ep.key} label={ep.label} path={ep.path} source={ep.source} />
      ))}
    </div>
  );
}
