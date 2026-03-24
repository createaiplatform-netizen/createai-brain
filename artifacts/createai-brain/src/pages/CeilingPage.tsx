import React, { useEffect, useState } from "react";

const SECTIONS = [
  {
    key: "continuum",
    label: "Continuum",
    endpoints: [
      { label: "Continuum",          path: "/api/universe-data/continuum" },
      { label: "Registry",           path: "/api/universe-data/continuum/registry" },
      { label: "Relations",          path: "/api/universe-data/continuum/relations" },
      { label: "Channels",           path: "/api/universe-data/continuum/channels" },
      { label: "Inspector",          path: "/api/universe-data/continuum/inspect" },
    ],
    color: "#E8C77A",
    summary: "The Continuum binds all subsystems into a unified relational structure.",
  },
  {
    key: "universe-os",
    label: "Universe OS",
    endpoints: [
      { label: "Master Manifest",    path: "/api/universe-data/master-manifest" },
      { label: "Page Manifest",      path: "/api/universe-data/page-manifest" },
      { label: "Experience Layer",   path: "/api/universe-data/experience-layer" },
      { label: "Creation Story",     path: "/api/universe-data/creation-story" },
      { label: "Connectivity Map",   path: "/api/universe-data/connectivity-map" },
    ],
    color: "#d4b87a",
    summary: "The Universe OS orchestrates all 22 engines and defines the experience loop.",
  },
  {
    key: "reality",
    label: "Reality",
    endpoints: [
      { label: "Absolute Layer",     path: "/api/universe-data/reality/absolute-layer" },
      { label: "Activation Map",     path: "/api/universe-data/reality/activation-map" },
      { label: "Orchestrator",       path: "/api/universe-data/reality/orchestrator" },
      { label: "Reality Stack",      path: "/api/universe-data/reality/stack" },
      { label: "Universe Index",     path: "/api/universe-data/reality/index" },
    ],
    color: "#8ab4d4",
    summary: "The Reality layer defines the laws, fabrics, and orchestration of existence.",
  },
  {
    key: "self",
    label: "Self",
    endpoints: [
      { label: "Ineffable Layer",    path: "/api/universe-data/self/ineffable" },
      { label: "Self-Generating",    path: "/api/universe-data/self/self-generating" },
      { label: "Transcendental",     path: "/api/universe-data/self/transcendental" },
    ],
    color: "#c4a8d4",
    summary: "The Self layer holds the conditions that allow universes and identities to arise.",
  },
  {
    key: "family",
    label: "Family",
    endpoints: [
      { label: "Family Universe",    path: "/api/universe-data/family-universe" },
      { label: "Kids Universe",      path: "/api/universe-data/kids-universe" },
      { label: "First World",        path: "/api/universe-data/first-world" },
      { label: "First Moment",       path: "/api/universe-data/first-moment" },
      { label: "First Entry",        path: "/api/universe-data/first-entry-experience" },
    ],
    color: "#9CAF88",
    summary: "The Family layer configures the worlds, moments, and entry experiences for family members.",
  },
  {
    key: "public",
    label: "Public",
    endpoints: [
      { label: "Master Manifest",    path: "/api/universe-data/master-manifest" },
      { label: "Creation Story",     path: "/api/universe-data/creation-story" },
      { label: "Reality Stack",      path: "/api/universe-data/reality/stack" },
      { label: "Transcendental",     path: "/api/universe-data/self/transcendental" },
    ],
    color: "#88b4a0",
    summary: "The Public surface exposes read-only, unauthenticated data from all layers.",
  },
  {
    key: "all-systems",
    label: "All Systems",
    endpoints: [
      { label: "Continuum",          path: "/api/universe-data/continuum" },
      { label: "Experience Layer",   path: "/api/universe-data/experience-layer" },
      { label: "Reality Stack",      path: "/api/universe-data/reality/stack" },
      { label: "Self-Generating",    path: "/api/universe-data/self/self-generating" },
      { label: "Family Universe",    path: "/api/universe-data/family-universe" },
    ],
    color: "#b4a888",
    summary: "All Systems is the unified ceiling view across every connected layer and file.",
  },
];

function SectionPanel({ section }: { section: typeof SECTIONS[0] }) {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let done = 0;
    const results: Record<string, unknown> = {};
    section.endpoints.forEach(ep => {
      fetch(ep.path)
        .then(r => r.ok ? r.json() : { error: r.status })
        .then(json => {
          results[ep.label] = json;
          done++;
          if (done === section.endpoints.length) {
            setData(results);
            setLoading(false);
          }
        })
        .catch(() => {
          results[ep.label] = { error: "fetch failed" };
          done++;
          if (done === section.endpoints.length) {
            setData(results);
            setLoading(false);
          }
        });
    });
  }, [section.key]);

  return (
    <div style={{
      background: "#0d1520",
      border: `1px solid ${section.color}33`,
      borderRadius: "8px",
      padding: "1.5rem",
    }}>
      <div style={{ color: section.color, fontSize: "0.8rem", fontWeight: "bold", marginBottom: "6px" }}>{section.summary}</div>
      {loading ? (
        <p style={{ color: "#555", fontSize: "0.78rem" }}>Loading {section.endpoints.length} endpoints&hellip;</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.75rem" }}>
          {section.endpoints.map(ep => (
            <div key={ep.label} style={{
              background: "#0a1018",
              border: "1px solid #1e2e1e",
              borderRadius: "5px",
              padding: "0.6rem 0.75rem",
              minWidth: "160px",
              flex: "1 1 160px",
            }}>
              <div style={{ color: section.color, fontSize: "0.7rem", fontWeight: "bold", marginBottom: "4px" }}>{ep.label}</div>
              <pre style={{
                fontSize: "0.65rem",
                color: "#9CAF88",
                overflow: "hidden",
                maxHeight: "80px",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}>
                {data[ep.label] !== undefined
                  ? JSON.stringify(data[ep.label], null, 2).slice(0, 220)
                  : "\u2014"}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CeilingPage() {
  const [selected, setSelected] = useState<string>(SECTIONS[0].key);
  const section = SECTIONS.find(s => s.key === selected)!;

  return (
    <div style={{ background: "#0A0F1F", minHeight: "100vh", color: "#F5F3EE", fontFamily: "monospace", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "1.25rem 2rem", borderBottom: "1px solid #1e2e1e" }}>
        <h1 style={{ color: "#E8C77A", fontSize: "1.3rem", margin: 0 }}>Ceiling</h1>
        <p style={{ color: "#9CAF88", fontSize: "0.78rem", margin: "0.2rem 0 0" }}>
          Conceptual ceiling layer &mdash; {SECTIONS.length} domains &mdash; 25 connected endpoints
        </p>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <nav style={{ width: "180px", borderRight: "1px solid #1e2e1e", padding: "1rem 0.75rem", flexShrink: 0 }}>
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setSelected(s.key)}
              style={{
                display: "block",
                width: "100%",
                background: selected === s.key ? "#1a2a1a" : "transparent",
                border: selected === s.key ? `1px solid ${s.color}` : "1px solid transparent",
                color: selected === s.key ? s.color : "#666",
                padding: "7px 10px",
                borderRadius: "5px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "0.8rem",
                marginBottom: "4px",
              }}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
          <div style={{ color: section.color, fontSize: "1rem", fontWeight: "bold", marginBottom: "1rem" }}>
            {section.label}
          </div>
          <SectionPanel key={section.key} section={section} />
        </main>
      </div>
    </div>
  );
}
