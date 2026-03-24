// ═══════════════════════════════════════════════════════════════════════════
// ProjectLibraryPage.tsx
// Lists all generated projects from system memory.
// Click a project to view its domain/engine detail.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface ProjectSummary {
  id:          string;
  title:       string;
  domains:     string[];
  enginesUsed: string[];
  createdAt:   string;
  sandbox:     boolean;
}

function Chip({ label, color = "#6366f1" }: { label: string; color?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 7px", borderRadius: 5, fontSize: 9.5, fontWeight: 600,
      background: `${color}14`, color, border: `1px solid ${color}28`,
    }}>{label}</span>
  );
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}

export default function ProjectLibraryPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<ProjectSummary | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await apiRequest("GET", "/api/system/memory/projects");
        const data = await res.json() as { ok: boolean; projects: ProjectSummary[] };
        setProjects(data.projects ?? []);
      } catch { setProjects([]); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div style={{
      minHeight: "100%", background: "#050A18", color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "28px 24px 60px",
    }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>📚</span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", margin: 0, letterSpacing: "-0.03em" }}>
              Project Library
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            All systems generated with Full Auto Create — non-personal platform memory.
          </p>
        </div>

        {/* Detail drawer */}
        {selected && (
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 14, padding: "20px 22px", marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#e2e8f0", margin: 0, letterSpacing: "-0.02em" }}>
                {selected.title}
              </h2>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "#64748b", fontSize: 18, lineHeight: 1, padding: "0 4px",
                }}
              >&times;</button>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Domains</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {selected.domains.map(d => <Chip key={d} label={d} color="#7c3aed" />)}
                  {selected.domains.length === 0 && <span style={{ fontSize: 11, color: "#475569" }}>None</span>}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Created</div>
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>{formatDate(selected.createdAt)}</div>
              </div>
              {selected.sandbox && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Mode</div>
                  <Chip label="Sandbox" color="#d97706" />
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Engines Used</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {selected.enginesUsed.map(e => <Chip key={e} label={e} color="#0284c7" />)}
                {selected.enginesUsed.length === 0 && <span style={{ fontSize: 11, color: "#475569" }}>None recorded</span>}
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{
              width: 36, height: 36, border: "3px solid rgba(99,102,241,0.2)",
              borderTop: "3px solid #6366f1", borderRadius: "50%",
              margin: "0 auto 14px",
              animation: "spin 0.9s linear infinite",
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ color: "#94a3b8", fontSize: 13 }}>Loading library\u2026</p>
          </div>
        ) : projects.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 24px",
            background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>📭</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8", margin: "0 0 8px" }}>No projects yet</h3>
            <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
              Generated projects will appear here after using Full Auto Create.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id === selected?.id ? null : p)}
                style={{
                  background: p.id === selected?.id
                    ? "rgba(99,102,241,0.08)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${p.id === selected?.id ? "rgba(99,102,241,0.28)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                  textAlign: "left", transition: "background 0.12s, border 0.12s",
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.title}
                    </span>
                    {p.sandbox && <Chip label="Sandbox" color="#d97706" />}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                    {p.domains.slice(0, 4).map(d => <Chip key={d} label={d} color="#7c3aed" />)}
                    {p.domains.length > 4 && <Chip label={`+${p.domains.length - 4}`} color="#64748b" />}
                  </div>
                  <div style={{ fontSize: 11, color: "#475569" }}>
                    {p.enginesUsed.length} engine{p.enginesUsed.length !== 1 ? "s" : ""} &middot; {formatDate(p.createdAt)}
                  </div>
                </div>
                <span style={{ fontSize: 14, color: "#475569", flexShrink: 0, marginTop: 2 }}>
                  {p.id === selected?.id ? "▲" : "▼"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
