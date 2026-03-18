// ═══════════════════════════════════════════════════════════════════════════
// OutputVaultPanel — browse, search, pin, copy, and delete saved outputs.
// Every engine run is auto-saved here via contextStore.recordOutput().
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import {
  vaultGetAll, vaultSearch, vaultPin, vaultDelete, vaultClear, vaultStats,
  type VaultEntry,
} from "@/services/OutputVaultService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function wordPreview(text: string, maxWords = 30): string {
  const words = text.replace(/#+\s/g, "").split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.slice(0, 200);
  return words.slice(0, maxWords).join(" ") + "…";
}

// ── Entry Card ────────────────────────────────────────────────────────────────

function VaultCard({
  entry, onPin, onDelete, onExpand,
}: {
  entry: VaultEntry;
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
  onExpand: (entry: VaultEntry) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(entry.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      onClick={() => onExpand(entry)}
      style={{
        background: entry.pinned ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${entry.pinned ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 12, padding: "12px 14px", cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)"; }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor =
          entry.pinned ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)";
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 2 }}>
            {entry.engineName}
          </div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: "#e2e8f0",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {entry.topic || "(no topic)"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {/* Pin */}
          <button
            onClick={e => { e.stopPropagation(); onPin(entry.id, !entry.pinned); }}
            style={{
              background: entry.pinned ? "rgba(99,102,241,0.2)" : "transparent",
              border: "none", borderRadius: 6, padding: "3px 6px",
              cursor: "pointer", fontSize: 12, color: entry.pinned ? "#818cf8" : "#64748b",
            }}
            title={entry.pinned ? "Unpin" : "Pin"}
          >
            {entry.pinned ? "📌" : "📍"}
          </button>
          {/* Copy */}
          <button
            onClick={copy}
            style={{
              background: copied ? "rgba(52,199,89,0.15)" : "transparent",
              border: "none", borderRadius: 6, padding: "3px 6px",
              cursor: "pointer", fontSize: 11, fontWeight: 600,
              color: copied ? "#34C759" : "#64748b",
            }}
            title="Copy to clipboard"
          >
            {copied ? "✓" : "⎘"}
          </button>
          {/* Delete */}
          <button
            onClick={e => { e.stopPropagation(); onDelete(entry.id); }}
            style={{
              background: "transparent", border: "none", borderRadius: 6, padding: "3px 6px",
              cursor: "pointer", fontSize: 11, color: "#64748b",
            }}
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Preview */}
      <div style={{
        fontSize: 12, color: "#94a3b8", lineHeight: 1.5,
        overflow: "hidden", display: "-webkit-box",
        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>
        {wordPreview(entry.text)}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#475569" }}>{timeAgo(entry.createdAt)}</span>
        <span style={{ fontSize: 10, color: "#475569" }}>·</span>
        <span style={{ fontSize: 10, color: "#475569" }}>{entry.wordCount} words</span>
        {entry.tags.map(t => (
          <span key={t} style={{
            fontSize: 9, fontWeight: 700, background: "rgba(99,102,241,0.12)",
            color: "#818cf8", borderRadius: 4, padding: "1px 5px",
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ── Expanded Modal ────────────────────────────────────────────────────────────

function VaultModal({ entry, onClose }: { entry: VaultEntry; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(entry.text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0f172a", borderRadius: 16, padding: 24, maxWidth: 720, width: "100%",
          maxHeight: "80vh", display: "flex", flexDirection: "column",
          border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 4 }}>{entry.engineName}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{entry.topic}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
              {new Date(entry.createdAt).toLocaleString()} · {entry.wordCount} words
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={copy}
              style={{
                background: copied ? "rgba(52,199,89,0.15)" : "rgba(99,102,241,0.12)",
                border: "none", borderRadius: 8, padding: "6px 12px",
                cursor: "pointer", fontSize: 12, fontWeight: 700,
                color: copied ? "#34C759" : "#818cf8",
              }}
            >
              {copied ? "✓ Copied" : "Copy all"}
            </button>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8,
                padding: "6px 10px", cursor: "pointer", color: "#94a3b8", fontSize: 16,
              }}
            >✕</button>
          </div>
        </div>
        {/* Content */}
        <div style={{
          flex: 1, overflowY: "auto", fontSize: 13, color: "#cbd5e1", lineHeight: 1.7,
          whiteSpace: "pre-wrap", background: "rgba(255,255,255,0.03)",
          borderRadius: 10, padding: 16,
        }}>
          {entry.text}
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function OutputVaultPanel() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [query,   setQuery]   = useState("");
  const [filter,  setFilter]  = useState<"all" | "pinned">("all");
  const [expanded, setExpanded] = useState<VaultEntry | null>(null);
  const [stats,   setStats]   = useState({ total: 0, pinned: 0, engines: 0, wordCount: 0 });

  const refresh = useCallback(() => {
    const results = query ? vaultSearch(query) : vaultGetAll();
    setEntries(filter === "pinned" ? results.filter(e => e.pinned) : results);
    setStats(vaultStats());
  }, [query, filter]);

  useEffect(() => { refresh(); }, [refresh]);

  const handlePin = (id: string, pinned: boolean) => {
    vaultPin(id, pinned);
    refresh();
  };

  const handleDelete = (id: string) => {
    vaultDelete(id);
    if (expanded?.id === id) setExpanded(null);
    refresh();
  };

  const handleClear = () => {
    if (confirm("Clear all unpinned outputs from the vault?")) {
      vaultClear(true);
      refresh();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Stats bar */}
      <div style={{
        display: "flex", gap: 16, padding: "12px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(99,102,241,0.04)",
      }}>
        {[
          { label: "Saved",   value: stats.total },
          { label: "Pinned",  value: stats.pinned },
          { label: "Engines", value: stats.engines },
          { label: "Words",   value: stats.wordCount.toLocaleString() },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={handleClear}
          style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8, padding: "4px 10px", cursor: "pointer",
            fontSize: 11, fontWeight: 600, color: "#f87171",
          }}
        >
          Clear unpinned
        </button>
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 8, padding: "12px 24px 8px" }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search outputs, engines, topics…"
          style={{
            flex: 1, background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
            padding: "8px 12px", fontSize: 13, color: "#e2e8f0",
            outline: "none",
          }}
        />
        {(["all", "pinned"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${filter === f ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8, padding: "6px 12px", cursor: "pointer",
              fontSize: 12, fontWeight: 600,
              color: filter === f ? "#818cf8" : "#94a3b8",
            }}
          >
            {f === "all" ? "All" : "📌 Pinned"}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 24px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#475569" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗄</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Vault is empty</div>
            <div style={{ fontSize: 12 }}>Run any engine and outputs will appear here automatically.</div>
          </div>
        ) : (
          entries.map(e => (
            <VaultCard
              key={e.id}
              entry={e}
              onPin={handlePin}
              onDelete={handleDelete}
              onExpand={setExpanded}
            />
          ))
        )}
      </div>

      {/* Expanded modal */}
      {expanded && <VaultModal entry={expanded} onClose={() => setExpanded(null)} />}
    </div>
  );
}
