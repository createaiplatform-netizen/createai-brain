import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  vaultGetAll, vaultSearch, vaultPin, vaultDelete, vaultStats,
  type VaultEntry,
} from "@/services/OutputVaultService";
import { exportToPDF, downloadAsText, copyToClipboard } from "@/hooks/usePDFExport";

const SAGE       = "#7a9068";
const SAGE_LIGHT = "#f0f4ee";
const SAGE_DARK  = "#5a6d50";

type FilterMode = "all" | "pinned" | "today" | "week";
type SortMode   = "newest" | "oldest" | "words";

function formatDate(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const diffMs = now.getTime() - ms;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60)  return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24)   return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7)   return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtWords(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

// ─── Entry Detail Modal ───────────────────────────────────────────────────────

function EntryModal({ entry, onClose, onPin, onDelete }: {
  entry: VaultEntry;
  onClose: () => void;
  onPin:   (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(entry.text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1800); }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.60)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 680, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}>
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: SAGE, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{entry.engineName}</div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{entry.topic || entry.engineName}</h2>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{formatDate(entry.createdAt)} · {fmtWords(entry.wordCount)} words</div>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, flexShrink: 0, color: "#64748b" }}>×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "18px 20px" }}>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "#1e293b", margin: 0, whiteSpace: "pre-wrap" }}>{entry.text}</p>
        </div>

        {/* Actions */}
        <div style={{ padding: "14px 20px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={handleCopy} style={actionBtn(copied ? SAGE : undefined)}>
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
          <button onClick={() => exportToPDF(entry.topic || entry.engineName, entry.text, entry.engineName)} style={actionBtn()}>
            📄 Download PDF
          </button>
          <button onClick={() => downloadAsText(entry.topic || entry.engineName, entry.text)} style={actionBtn()}>
            📝 Download .txt
          </button>
          <button onClick={() => { onPin(entry.id, !entry.pinned); onClose(); }} style={actionBtn(entry.pinned ? "#f59e0b" : undefined)}>
            {entry.pinned ? "📌 Unpin" : "📌 Pin"}
          </button>
          <button onClick={() => { onDelete(entry.id); onClose(); }} style={{ ...actionBtn(), color: "#ef4444", background: "#fef2f2", borderColor: "#fecaca" }}>
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OutputLibraryPage() {
  const [entries, setEntries]           = useState<VaultEntry[]>([]);
  const [dbDocs, setDbDocs]             = useState<VaultEntry[]>([]);
  const [query, setQuery]               = useState("");
  const [filter, setFilter]             = useState<FilterMode>("all");
  const [sort, setSort]                 = useState<SortMode>("newest");
  const [selected, setSelected]         = useState<VaultEntry | null>(null);
  const [copiedId, setCopiedId]         = useState<string | null>(null);

  // Load from localStorage
  const reload = useCallback(() => {
    setEntries(vaultGetAll());
  }, []);

  useEffect(() => {
    reload();
    // Listen for vault changes
    const handler = () => reload();
    window.addEventListener("cai:vault-changed", handler);
    return () => window.removeEventListener("cai:vault-changed", handler);
  }, [reload]);

  // Load from /api/documents as supplement
  useEffect(() => {
    fetch("/api/documents?limit=200", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((data: { documents?: Array<{ id: string | number; title: string; content: string; type: string; createdAt: string }> } | null) => {
        if (!data?.documents) return;
        const mapped: VaultEntry[] = data.documents.map(d => ({
          id:         `db_${d.id}`,
          engineId:   d.type || "document",
          engineName: d.type || "Document",
          topic:      d.title,
          text:       d.content,
          wordCount:  d.content.split(/\s+/).filter(Boolean).length,
          pinned:     false,
          tags:       [],
          projectId:  null,
          createdAt:  new Date(d.createdAt).getTime(),
        }));
        setDbDocs(mapped);
      })
      .catch(() => {});
  }, []);

  const stats = useMemo(() => vaultStats(), [entries]);

  // Merge local + DB, deduplicate by topic+text fingerprint
  const allEntries = useMemo(() => {
    const local = entries;
    const localFingerprints = new Set(local.map(e => e.topic + ":" + e.text.slice(0, 80)));
    const unique = dbDocs.filter(d => !localFingerprints.has(d.topic + ":" + d.text.slice(0, 80)));
    return [...local, ...unique];
  }, [entries, dbDocs]);

  // Apply search
  const searched = useMemo(() => {
    if (!query.trim()) return allEntries;
    const q = query.toLowerCase();
    return allEntries.filter(e =>
      e.topic.toLowerCase().includes(q) ||
      e.engineName.toLowerCase().includes(q) ||
      e.text.toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [allEntries, query]);

  // Apply filter
  const filtered = useMemo(() => {
    const now = Date.now();
    switch (filter) {
      case "pinned": return searched.filter(e => e.pinned);
      case "today":  return searched.filter(e => now - e.createdAt < 86400000);
      case "week":   return searched.filter(e => now - e.createdAt < 604800000);
      default:       return searched;
    }
  }, [searched, filter]);

  // Apply sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "oldest": return arr.sort((a, b) => a.createdAt - b.createdAt);
      case "words":  return arr.sort((a, b) => b.wordCount - a.wordCount);
      default:       return arr.sort((a, b) => b.createdAt - a.createdAt);
    }
  }, [filtered, sort]);

  const handlePin = (id: string, pinned: boolean) => {
    if (!id.startsWith("db_")) { vaultPin(id, pinned); reload(); }
  };

  const handleDelete = (id: string) => {
    if (!id.startsWith("db_")) { vaultDelete(id); reload(); }
  };

  const handleCopy = async (e: VaultEntry) => {
    const ok = await copyToClipboard(e.text);
    if (ok) { setCopiedId(e.id); setTimeout(() => setCopiedId(null), 1600); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${SAGE} 0%, ${SAGE_DARK} 100%)`, padding: "28px 24px 22px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
          📚 Output Library
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.80)", margin: "0 0 18px" }}>
          Every AI response you've generated — saved automatically.
        </p>
        {/* Stats row */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "Total", value: allEntries.length },
            { label: "Pinned", value: stats.pinned },
            { label: "Engines", value: stats.engines },
            { label: "Words", value: fmtWords(stats.wordCount) },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 14px" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.70)", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: "16px 24px", background: "#fff", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#94a3b8" }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search outputs…"
            style={{ width: "100%", padding: "8px 10px 8px 34px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, outline: "none", color: "#0f172a", background: "#f8fafc" }}
          />
        </div>
        {/* Filters */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "pinned", "today", "week"] as FilterMode[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "7px 12px", border: "1.5px solid", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              borderColor: filter === f ? SAGE : "#e2e8f0",
              background: filter === f ? SAGE_LIGHT : "#fff",
              color: filter === f ? SAGE_DARK : "#64748b",
            }}>
              {f === "all" ? "All" : f === "pinned" ? "📌 Pinned" : f === "today" ? "Today" : "This Week"}
            </button>
          ))}
        </div>
        {/* Sort */}
        <select value={sort} onChange={e => setSort(e.target.value as SortMode)} style={{ padding: "7px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#475569", background: "#fff", cursor: "pointer" }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="words">Most words</option>
        </select>
      </div>

      {/* Grid */}
      <div style={{ padding: "20px 24px" }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
              {query || filter !== "all" ? "No results found" : "Your library is empty"}
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", maxWidth: 340, margin: "0 auto" }}>
              {query || filter !== "all"
                ? "Try a different search or filter."
                : "Every time you generate content with any AI tool, it saves here automatically."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {sorted.map(entry => (
              <div
                key={entry.id}
                style={{
                  background: "#fff", borderRadius: 16, border: "1.5px solid #f1f5f9",
                  padding: "16px 16px 12px", display: "flex", flexDirection: "column", gap: 10,
                  cursor: "pointer", transition: "all 0.15s ease",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
                onClick={() => setSelected(entry)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = SAGE; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(122,144,104,0.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#f1f5f9"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
              >
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: SAGE, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                      {entry.engineName}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {entry.topic || entry.engineName}
                    </div>
                  </div>
                  {entry.pinned && <span style={{ fontSize: 14, flexShrink: 0 }}>📌</span>}
                </div>

                {/* Preview */}
                <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                  {entry.text}
                </p>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>
                    {formatDate(entry.createdAt)} · {fmtWords(entry.wordCount)} words
                  </div>
                  <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleCopy(entry)} title="Copy" style={iconBtn(copiedId === entry.id ? SAGE : undefined)}>
                      {copiedId === entry.id ? "✓" : "📋"}
                    </button>
                    <button onClick={() => exportToPDF(entry.topic, entry.text, entry.engineName)} title="PDF" style={iconBtn()}>
                      📄
                    </button>
                    <button onClick={() => handlePin(entry.id, !entry.pinned)} title={entry.pinned ? "Unpin" : "Pin"} style={iconBtn(entry.pinned ? "#f59e0b" : undefined)}>
                      📌
                    </button>
                    <button onClick={() => { if (confirm("Delete this entry?")) handleDelete(entry.id); }} title="Delete" style={iconBtn("#ef4444")}>
                      🗑
                    </button>
                  </div>
                </div>

                {/* Tags */}
                {entry.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
                    {entry.tags.map(t => (
                      <span key={t} style={{ fontSize: 9, background: SAGE_LIGHT, color: SAGE_DARK, borderRadius: 5, padding: "2px 6px", fontWeight: 700 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <EntryModal
          entry={selected}
          onClose={() => setSelected(null)}
          onPin={(id, pinned) => { handlePin(id, pinned); setEntries(vaultGetAll()); }}
          onDelete={(id) => { handleDelete(id); setSelected(null); }}
        />
      )}
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

function actionBtn(bg?: string): React.CSSProperties {
  return {
    padding: "8px 14px", border: `1.5px solid ${bg ? bg + "40" : "#e2e8f0"}`,
    background: bg ? bg + "15" : "#f8fafc", color: bg ?? "#475569",
    borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
  };
}

function iconBtn(color?: string): React.CSSProperties {
  return {
    width: 28, height: 28, border: "none",
    background: color ? color + "15" : "#f8fafc",
    borderRadius: 7, fontSize: 13, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  };
}
