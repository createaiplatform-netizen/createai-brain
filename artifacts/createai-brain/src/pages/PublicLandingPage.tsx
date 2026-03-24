import React from "react";

const SYSTEM_MAP = [
  { label: "Continuum",    href: "/continuum-dashboard", desc: "Subsystem registry, relations, channels, and inspector." },
  { label: "Universe OS",  href: "/universe-explorer",   desc: "22 engines, master manifest, experience loop." },
  { label: "Reality",      href: "/reality-explorer",    desc: "Absolute layer, orchestrator, activation map, stack." },
  { label: "Self",         href: "/self-explorer",       desc: "Ineffable, self-generating, and transcendental layers." },
  { label: "Family",       href: "/family-mode",         desc: "Family universe, kids universe, first world, first moment." },
  { label: "Public",       href: "/public-explorer",     desc: "Read-only explorer — no login required." },
  { label: "All Systems",  href: "/all-systems",         desc: "Unified ceiling view across every connected layer." },
];

const QUICK_LINKS = [
  { label: "Public Explorer",  href: "/public-explorer",  note: "No login required" },
  { label: "Universe Data",    href: "/universe-data",    note: "Authenticated" },
  { label: "All Systems",      href: "/all-systems",      note: "Authenticated" },
  { label: "Family Mode",      href: "/family-mode",      note: "Authenticated" },
];

export default function PublicLandingPage() {
  return (
    <div style={{
      background: "#0A0F1F",
      minHeight: "100vh",
      color: "#F5F3EE",
      fontFamily: "monospace",
      padding: "3rem 2rem",
      maxWidth: "900px",
      margin: "0 auto",
    }}>
      <h1 style={{ color: "#E8C77A", fontSize: "1.8rem", margin: "0 0 0.4rem" }}>CreateAI Brain</h1>
      <p style={{ color: "#9CAF88", fontSize: "0.9rem", margin: "0 0 2.5rem", lineHeight: 1.6 }}>
        A living architecture of identity, meaning, time, emotion, and possibility &mdash; woven into one coherent whole.
      </p>

      <h2 style={{ color: "#E8C77A", fontSize: "1rem", margin: "0 0 1rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        System Map
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem", marginBottom: "2.5rem" }}>
        {SYSTEM_MAP.map(item => (
          <a
            key={item.label}
            href={item.href}
            style={{
              display: "block",
              background: "#0d1520",
              border: "1px solid #1e2e1e",
              borderRadius: "8px",
              padding: "1rem 1.1rem",
              textDecoration: "none",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#9CAF88")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e2e1e")}
          >
            <div style={{ color: "#E8C77A", fontSize: "0.88rem", fontWeight: "bold", marginBottom: "4px" }}>{item.label}</div>
            <div style={{ color: "#6a8a6a", fontSize: "0.74rem", lineHeight: 1.5 }}>{item.desc}</div>
          </a>
        ))}
      </div>

      <h2 style={{ color: "#E8C77A", fontSize: "1rem", margin: "0 0 1rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Quick Links
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
        {QUICK_LINKS.map(lk => (
          <a
            key={lk.label}
            href={lk.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#0d1520",
              border: "1px solid #1e2e1e",
              borderRadius: "6px",
              padding: "0.5rem 0.9rem",
              textDecoration: "none",
              color: "#9CAF88",
              fontSize: "0.78rem",
            }}
          >
            {lk.label}
            <span style={{ color: "#3a5a3a", fontSize: "0.68rem" }}>{lk.note}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
