// ═══════════════════════════════════════════════════════════════════════════
// OPPORTUNITY APP — OpportunityEngine Frontend
// Opportunity discovery, scoring, pipeline management, and AI scanning.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  OPPORTUNITY_TYPES, OPPORTUNITY_STATUSES, OPPORTUNITY_PRIORITIES, OPPORTUNITY_CONFIDENCE,
  getTypeColor, getTypeIcon, getStatusColor, getStatusBg, getPriorityColor,
  getConfidenceColor, getScoreColor, getScoreLabel, PIPELINE_COLUMNS,
  filterOpportunities, DEFAULT_FILTERS, type OpportunityFilters, runOpportunityScan,
} from "@/engine/OpportunityEngine";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Opportunity {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  score: number | null;
  market: string | null;
  estimatedValue: string | null;
  confidence: string | null;
  source: string | null;
  aiInsight: string | null;
  notes: string | null;
  tags: string | null;
  dueDate: string | null;
  assignedTo: string | null;
  projectId: string | null;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  won: number;
  inProgress: number;
  newCount: number;
  validated: number;
  avgScore: number;
  starred: number;
  highPriority: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

type View = "dashboard" | "list" | "pipeline" | "scanner" | "create" | "detail";

// ─── Design tokens ─────────────────────────────────────────────────────────

const INDIGO  = "#6366f1";
const SURFACE = "rgba(255,255,255,0.85)";
const BORDER  = "rgba(0,0,0,0.07)";

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, sub }: {
  icon: string; label: string; value: string | number; color: string; sub?: string;
}) {
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 16, padding: "18px 20px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}15`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 17,
        }}>{icon}</div>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.04em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ─── Score Badge ────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number | null }) {
  const s = score ?? 0;
  const color = getScoreColor(s);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: `${color}15`, border: `1px solid ${color}33`,
      borderRadius: 8, padding: "3px 10px",
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: color, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff",
      }}>{s}</div>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{getScoreLabel(s)}</span>
    </div>
  );
}

// ─── Opportunity Card ───────────────────────────────────────────────────────

function OpportunityCard({
  opp, onSelect, onToggleStar,
}: {
  opp: Opportunity;
  onSelect: (o: Opportunity) => void;
  onToggleStar: (id: number, val: boolean) => void;
}) {
  const typeColor = getTypeColor(opp.type);
  const statusColor = getStatusColor(opp.status);

  return (
    <div
      onClick={() => onSelect(opp)}
      style={{
        background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 14, padding: "16px 18px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.04)", cursor: "pointer",
        transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 10,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 20 }}>{getTypeIcon(opp.type)}</span>
          <span style={{
            fontSize: 14, fontWeight: 700, color: "#0f172a",
            letterSpacing: "-0.01em", flex: 1, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{opp.title}</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onToggleStar(opp.id, !opp.isStarred); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, flexShrink: 0, padding: 2 }}
        >
          {opp.isStarred ? "⭐" : "☆"}
        </button>
      </div>

      {opp.description && (
        <div style={{
          fontSize: 12, color: "#64748b", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>{opp.description}</div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <span style={{
          fontSize: 10, fontWeight: 700, background: `${typeColor}15`,
          color: typeColor, borderRadius: 6, padding: "3px 8px", border: `1px solid ${typeColor}30`,
        }}>{opp.type}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, background: `${statusColor}15`,
          color: statusColor, borderRadius: 6, padding: "3px 8px", border: `1px solid ${statusColor}30`,
        }}>{opp.status}</span>
        {opp.priority === "High" || opp.priority === "Critical" ? (
          <span style={{
            fontSize: 10, fontWeight: 700, background: `${getPriorityColor(opp.priority)}15`,
            color: getPriorityColor(opp.priority), borderRadius: 6, padding: "3px 8px",
            border: `1px solid ${getPriorityColor(opp.priority)}30`,
          }}>{opp.priority}</span>
        ) : null}
        <div style={{ marginLeft: "auto" }}>
          <ScoreBadge score={opp.score} />
        </div>
      </div>

      {(opp.market || opp.estimatedValue) && (
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#94a3b8" }}>
          {opp.market && <span>🌍 {opp.market}</span>}
          {opp.estimatedValue && <span>💰 {opp.estimatedValue}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Create / Edit Form ─────────────────────────────────────────────────────

function OpportunityForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<Opportunity>;
  onSave: (data: Partial<Opportunity>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Opportunity>>({
    title: "", description: "", type: "Market", status: "New", priority: "Medium",
    confidence: "Medium", market: "", estimatedValue: "", source: "", notes: "",
    tags: "", dueDate: "", assignedTo: "",
    ...(initial ?? {}),
  });

  function set(key: keyof Opportunity, value: string | boolean | number | null) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function inputStyle() {
    return {
      width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 13,
      border: `1.5px solid ${BORDER}`, background: "#f8fafc", color: "#0f172a",
      outline: "none", boxSizing: "border-box" as const,
    };
  }

  function labelStyle() {
    return { fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" as const };
  }

  function fieldGroup(label: string, children: React.ReactNode) {
    return (
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
        <label style={labelStyle()}>{label}</label>
        {children}
      </div>
    );
  }

  function selectEl(key: keyof Opportunity, options: string[]) {
    return (
      <select
        value={String(form[key] ?? "")}
        onChange={e => set(key, e.target.value)}
        style={{ ...inputStyle(), cursor: "pointer" }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 2px" }}>
      {fieldGroup("Title *", (
        <input
          style={inputStyle()} value={form.title ?? ""} placeholder="Opportunity title"
          onChange={e => set("title", e.target.value)}
        />
      ))}
      {fieldGroup("Description", (
        <textarea
          style={{ ...inputStyle(), height: 72, resize: "vertical" as const }}
          value={form.description ?? ""} placeholder="Brief description of the opportunity"
          onChange={e => set("description", e.target.value)}
        />
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {fieldGroup("Type", selectEl("type", OPPORTUNITY_TYPES))}
        {fieldGroup("Status", selectEl("status", OPPORTUNITY_STATUSES))}
        {fieldGroup("Priority", selectEl("priority", OPPORTUNITY_PRIORITIES))}
        {fieldGroup("Confidence", selectEl("confidence", OPPORTUNITY_CONFIDENCE))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {fieldGroup("Target Market", (
          <input style={inputStyle()} value={form.market ?? ""} placeholder="e.g. Healthcare SMBs"
            onChange={e => set("market", e.target.value)} />
        ))}
        {fieldGroup("Estimated Value", (
          <input style={inputStyle()} value={form.estimatedValue ?? ""} placeholder="e.g. $50K ARR"
            onChange={e => set("estimatedValue", e.target.value)} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {fieldGroup("Source", (
          <input style={inputStyle()} value={form.source ?? ""} placeholder="How was this discovered?"
            onChange={e => set("source", e.target.value)} />
        ))}
        {fieldGroup("Assigned To", (
          <input style={inputStyle()} value={form.assignedTo ?? ""} placeholder="Team member name"
            onChange={e => set("assignedTo", e.target.value)} />
        ))}
      </div>
      {fieldGroup("Tags (comma-separated)", (
        <input style={inputStyle()} value={form.tags ?? ""} placeholder="e.g. urgent, partnership, Q2"
          onChange={e => set("tags", e.target.value)} />
      ))}
      {fieldGroup("Notes", (
        <textarea
          style={{ ...inputStyle(), height: 60, resize: "vertical" as const }}
          value={form.notes ?? ""} placeholder="Any additional notes"
          onChange={e => set("notes", e.target.value)}
        />
      ))}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
        <button onClick={onCancel}
          style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "white", cursor: "pointer", fontSize: 13, color: "#374151" }}>
          Cancel
        </button>
        <button onClick={() => onSave(form)} disabled={saving || !form.title?.trim()}
          style={{
            padding: "9px 20px", borderRadius: 10, border: "none", cursor: saving ? "not-allowed" : "pointer",
            background: saving ? "#a5b4fc" : INDIGO, color: "white", fontWeight: 700, fontSize: 13,
          }}>
          {saving ? "Saving…" : (initial?.id ? "Save Changes" : "Create Opportunity")}
        </button>
      </div>
    </div>
  );
}

// ─── Detail Panel ───────────────────────────────────────────────────────────

function DetailPanel({
  opp, onBack, onEdit, onDelete, onSaveInsight, loadingInsight,
}: {
  opp: Opportunity;
  onBack: () => void;
  onEdit: (o: Opportunity) => void;
  onDelete: (id: number) => void;
  onSaveInsight: (id: number, insight: string) => Promise<void>;
  loadingInsight: boolean;
}) {
  const [scanText, setScanText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [savingInsight, setSavingInsight] = useState(false);
  const typeColor = getTypeColor(opp.type);

  async function runScan() {
    setScanText("");
    setScanning(true);
    await runOpportunityScan({
      topic:   `${opp.title} — ${opp.type} opportunity`,
      context: [
        opp.description,
        opp.market ? `Market: ${opp.market}` : "",
        opp.estimatedValue ? `Estimated value: ${opp.estimatedValue}` : "",
        opp.notes,
      ].filter(Boolean).join("\n"),
      onChunk: text => setScanText(t => t + text),
      onDone:  () => setScanning(false),
      onError: () => setScanning(false),
    });
  }

  async function saveInsight() {
    if (!scanText.trim()) return;
    setSavingInsight(true);
    await onSaveInsight(opp.id, scanText);
    setSavingInsight(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <button onClick={onBack}
        style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: INDIGO, fontSize: 13, fontWeight: 600, padding: 0 }}>
        ‹ Back
      </button>

      {/* Header */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: `${typeColor}15`,
              border: `1px solid ${typeColor}30`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 24, flexShrink: 0,
            }}>{getTypeIcon(opp.type)}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{opp.title}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, background: `${typeColor}15`, color: typeColor, borderRadius: 6, padding: "3px 8px", border: `1px solid ${typeColor}30` }}>{opp.type}</span>
                <span style={{ fontSize: 10, fontWeight: 700, background: `${getStatusColor(opp.status)}15`, color: getStatusColor(opp.status), borderRadius: 6, padding: "3px 8px", border: `1px solid ${getStatusColor(opp.status)}30` }}>{opp.status}</span>
                <span style={{ fontSize: 10, fontWeight: 700, background: `${getPriorityColor(opp.priority)}15`, color: getPriorityColor(opp.priority), borderRadius: 6, padding: "3px 8px", border: `1px solid ${getPriorityColor(opp.priority)}30` }}>{opp.priority} Priority</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onEdit(opp)}
              style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "white", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Edit
            </button>
            <button onClick={() => onDelete(opp.id)}
              style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #fecaca", background: "#fff5f5", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#ef4444" }}>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Score + Meta */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>Opportunity Score</div>
          <ScoreBadge score={opp.score} />
        </div>
        {opp.confidence && (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>Confidence</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: getConfidenceColor(opp.confidence ?? "Medium") }}>● {opp.confidence}</span>
          </div>
        )}
        {opp.market && (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>Market</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>🌍 {opp.market}</div>
          </div>
        )}
        {opp.estimatedValue && (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>Estimated Value</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#10b981" }}>💰 {opp.estimatedValue}</div>
          </div>
        )}
      </div>

      {/* Description + Notes */}
      {opp.description && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</div>
          <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.6 }}>{opp.description}</div>
        </div>
      )}

      {opp.notes && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</div>
          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{opp.notes}</div>
        </div>
      )}

      {/* AI Insight */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            🤖 AI Insight
          </div>
          <button onClick={runScan} disabled={scanning}
            style={{
              padding: "7px 14px", borderRadius: 10, border: "none",
              background: scanning ? "#e0e7ff" : INDIGO,
              color: scanning ? INDIGO : "white", fontWeight: 700, fontSize: 12,
              cursor: scanning ? "not-allowed" : "pointer",
            }}>
            {scanning ? "⟳ Scanning…" : "Run AI Analysis"}
          </button>
        </div>

        {opp.aiInsight && !scanText && (
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{opp.aiInsight}</div>
        )}

        {scanText && (
          <div>
            <div style={{
              fontSize: 13, color: "#0f172a", lineHeight: 1.7, whiteSpace: "pre-wrap",
              background: "#f8faff", border: "1px solid #e0e7ff", borderRadius: 10, padding: 14,
              maxHeight: 360, overflowY: "auto",
            }}>{scanText}</div>
            {!scanning && (
              <button onClick={saveInsight} disabled={savingInsight}
                style={{
                  marginTop: 10, padding: "7px 16px", borderRadius: 10, border: "none",
                  background: "#10b981", color: "white", fontWeight: 700, fontSize: 12,
                  cursor: savingInsight ? "not-allowed" : "pointer",
                }}>
                {savingInsight ? "Saving…" : "💾 Save Insight"}
              </button>
            )}
          </div>
        )}

        {!opp.aiInsight && !scanText && (
          <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>
            Click "Run AI Analysis" to generate deep intelligence on this opportunity.
          </div>
        )}
      </div>

      {/* Tags */}
      {opp.tags && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {opp.tags.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
            <span key={tag} style={{
              fontSize: 11, fontWeight: 600, background: `${INDIGO}10`, color: INDIGO,
              borderRadius: 6, padding: "4px 10px", border: `1px solid ${INDIGO}25`,
            }}>#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Pipeline View ──────────────────────────────────────────────────────────

function PipelineView({
  opportunities, onSelect, onStatusChange,
}: {
  opportunities: Opportunity[];
  onSelect: (o: Opportunity) => void;
  onStatusChange: (id: number, status: string) => Promise<void>;
}) {
  return (
    <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
      {PIPELINE_COLUMNS.map(col => {
        const items = opportunities.filter(o => o.status === col.status);
        return (
          <div key={col.status} style={{
            minWidth: 220, maxWidth: 240, flexShrink: 0,
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 12px", borderRadius: 10,
              background: `${getStatusColor(col.status)}12`,
              border: `1px solid ${getStatusColor(col.status)}25`,
            }}>
              <span style={{ fontSize: 14 }}>{col.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: getStatusColor(col.status) }}>{col.label}</span>
              <span style={{
                marginLeft: "auto", fontSize: 10, fontWeight: 800,
                background: `${getStatusColor(col.status)}20`, color: getStatusColor(col.status),
                borderRadius: "50%", width: 20, height: 20, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>{items.length}</span>
            </div>
            {items.map(opp => (
              <div key={opp.id}
                onClick={() => onSelect(opp)}
                style={{
                  background: SURFACE, border: `1px solid ${BORDER}`,
                  borderRadius: 12, padding: "12px 14px", cursor: "pointer",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transition: "all 0.15s",
                  display: "flex", flexDirection: "column", gap: 7,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.09)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
              >
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{getTypeIcon(opp.type)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", lineHeight: 1.4 }}>{opp.title}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: getPriorityColor(opp.priority), fontWeight: 700 }}>
                    ● {opp.priority}
                  </span>
                  <ScoreBadge score={opp.score} />
                </div>
                {opp.estimatedValue && (
                  <div style={{ fontSize: 10, color: "#10b981", fontWeight: 600 }}>💰 {opp.estimatedValue}</div>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div style={{
                border: `2px dashed ${getStatusColor(col.status)}30`, borderRadius: 12,
                padding: "20px 10px", textAlign: "center",
                fontSize: 11, color: "#cbd5e1",
              }}>No opportunities</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── AI Scanner View ────────────────────────────────────────────────────────

function ScannerView({ onCreateFromScan }: { onCreateFromScan: (title: string, insight: string) => void }) {
  const [topic, setTopic]       = useState("");
  const [context, setContext]   = useState("");
  const [output, setOutput]     = useState("");
  const [scanning, setScanning] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  async function startScan() {
    if (!topic.trim()) return;
    setOutput("");
    setScanning(true);
    await runOpportunityScan({
      topic, context,
      onChunk: text => setOutput(t => t + text),
      onDone:  () => setScanning(false),
      onError: () => setScanning(false),
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        background: `${INDIGO}08`, border: `1px solid ${INDIGO}20`,
        borderRadius: 14, padding: "16px 18px",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: INDIGO, marginBottom: 4 }}>
          🤖 Opportunity Intelligence Scanner
        </div>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
          Describe your business, market, or domain — the OpportunityEngine will discover, score, and rank opportunities with strategic recommendations.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>What should the scanner analyze?</label>
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. Our SaaS company serves mid-market healthcare providers. We're looking for expansion opportunities in the next 12 months…"
          style={{
            padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${BORDER}`,
            background: "#f8fafc", fontSize: 13, color: "#0f172a",
            outline: "none", resize: "vertical", height: 90, lineHeight: 1.5,
          }}
        />
        <textarea
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="Additional context (optional): current team size, ARR, technology stack, competitive advantages…"
          style={{
            padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${BORDER}`,
            background: "#f8fafc", fontSize: 13, color: "#0f172a",
            outline: "none", resize: "vertical", height: 60, lineHeight: 1.5,
          }}
        />
        <button onClick={startScan} disabled={scanning || !topic.trim()}
          style={{
            alignSelf: "flex-start", padding: "11px 24px", borderRadius: 12, border: "none",
            background: scanning ? "#e0e7ff" : INDIGO,
            color: scanning ? INDIGO : "white", fontWeight: 700, fontSize: 13,
            cursor: scanning || !topic.trim() ? "not-allowed" : "pointer",
          }}>
          {scanning ? "⟳ Scanning for opportunities…" : "🔍 Scan for Opportunities"}
        </button>
      </div>

      {output && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{
            padding: "12px 16px", background: `${INDIGO}08`, borderBottom: `1px solid ${INDIGO}15`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: INDIGO }}>
              {scanning ? "⟳ Opportunity scan in progress…" : "✅ Scan complete"}
            </span>
            {!scanning && (
              <button
                onClick={() => onCreateFromScan(topic.slice(0, 60), output)}
                style={{
                  padding: "5px 12px", borderRadius: 8, border: "none",
                  background: "#10b981", color: "white", fontWeight: 700, fontSize: 11, cursor: "pointer",
                }}
              >
                + Add as Opportunity
              </button>
            )}
          </div>
          <div
            ref={outputRef}
            style={{
              padding: "16px 18px", fontSize: 13, color: "#0f172a",
              lineHeight: 1.7, whiteSpace: "pre-wrap",
              maxHeight: 480, overflowY: "auto",
            }}
          >{output}</div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard View ─────────────────────────────────────────────────────────

function DashboardView({
  stats,
  opportunities,
  onSelect,
  onCreate,
}: {
  stats: Stats | null;
  opportunities: Opportunity[];
  onSelect: (o: Opportunity) => void;
  onCreate: () => void;
}) {
  const top = [...opportunities].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
  const starred = opportunities.filter(o => o.isStarred).slice(0, 4);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        <StatCard icon="🎯" label="Total Opportunities" value={stats?.total ?? 0}          color={INDIGO}    sub="across all types" />
        <StatCard icon="🏆" label="Won"                 value={stats?.won ?? 0}             color="#10b981"   sub="closed successfully" />
        <StatCard icon="⚡" label="In Progress"          value={stats?.inProgress ?? 0}      color="#8b5cf6"   sub="actively pursuing" />
        <StatCard icon="⭐" label="Starred"              value={stats?.starred ?? 0}          color="#f59e0b"   sub="high attention" />
        <StatCard icon="📊" label="Avg Score"            value={`${stats?.avgScore ?? 0}/100`} color="#3b82f6" sub="opportunity quality" />
        <StatCard icon="🔥" label="High Priority"        value={stats?.highPriority ?? 0}    color="#ef4444"   sub="needs immediate focus" />
      </div>

      {/* Top opportunities */}
      {top.length > 0 && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>🏅 Top Opportunities by Score</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {top.map((opp, i) => (
              <div key={opp.id}
                onClick={() => onSelect(opp)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                  padding: "10px 12px", borderRadius: 10, transition: "background 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", width: 16 }}>#{i + 1}</span>
                <span style={{ fontSize: 18 }}>{getTypeIcon(opp.type)}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opp.title}</span>
                <ScoreBadge score={opp.score} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Starred */}
      {starred.length > 0 && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>⭐ Starred</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {starred.map(opp => (
              <div key={opp.id} onClick={() => onSelect(opp)} style={{
                padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                background: "#fefce8", border: "1px solid #fde68a",
                display: "flex", flexDirection: "column", gap: 5,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>{opp.title}</span>
                <span style={{ fontSize: 10, color: "#a16207" }}>{opp.type} · {opp.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {opportunities.length === 0 && (
        <div style={{
          background: SURFACE, border: `2px dashed ${BORDER}`,
          borderRadius: 16, padding: "48px 24px", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
        }}>
          <span style={{ fontSize: 48 }}>🎯</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>No opportunities yet</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
              Create your first opportunity or run the AI scanner to discover new ones
            </div>
          </div>
          <button onClick={onCreate}
            style={{
              padding: "10px 22px", borderRadius: 12, border: "none",
              background: INDIGO, color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>
            + Create First Opportunity
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────

export function OpportunityApp() {
  const [view, setView]                   = useState<View>("dashboard");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats]                 = useState<Stats | null>(null);
  const [filters, setFilters]             = useState<OpportunityFilters>(DEFAULT_FILTERS);
  const [selected, setSelected]           = useState<Opportunity | null>(null);
  const [editing, setEditing]             = useState<Opportunity | null>(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState("");

  // ── Load data ──────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oppRes, statsRes] = await Promise.all([
        fetch("/api/opportunities", { credentials: "include" }),
        fetch("/api/opportunities/stats", { credentials: "include" }),
      ]);
      if (oppRes.ok) {
        const data = await oppRes.json() as { opportunities: Opportunity[] };
        setOpportunities(data.opportunities ?? []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json() as Stats;
        setStats(data);
      }
    } catch {
      setError("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── CRUD ───────────────────────────────────────────────────────────────

  async function handleCreate(data: Partial<Opportunity>) {
    setSaving(true);
    try {
      const res = await fetch("/api/opportunities", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(data),
      });
      if (!res.ok) { setError("Failed to create"); return; }
      await load();
      setView("list");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: Partial<Opportunity>) {
    if (!editing?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/opportunities/${editing.id}`, {
        method:      "PUT",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(data),
      });
      if (!res.ok) { setError("Failed to update"); return; }
      await load();
      setEditing(null);
      setView(selected ? "detail" : "list");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this opportunity?")) return;
    await fetch(`/api/opportunities/${id}`, { method: "DELETE", credentials: "include" });
    setSelected(null);
    setView("list");
    await load();
  }

  async function handleToggleStar(id: number, val: boolean) {
    await fetch(`/api/opportunities/${id}`, {
      method:      "PUT",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({ isStarred: val }),
    });
    await load();
  }

  async function handleStatusChange(id: number, status: string) {
    await fetch(`/api/opportunities/${id}`, {
      method:      "PUT",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({ status }),
    });
    await load();
  }

  async function handleSaveInsight(id: number, aiInsight: string) {
    const res = await fetch(`/api/opportunities/${id}`, {
      method:      "PUT",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({ aiInsight }),
    });
    if (res.ok) {
      await load();
      const updated = opportunities.find(o => o.id === id);
      if (updated) setSelected({ ...updated, aiInsight });
    }
  }

  function handleCreateFromScan(title: string, insight: string) {
    setEditing({ title, aiInsight: insight } as Opportunity);
    setView("create");
  }

  // ── Filtered list ──────────────────────────────────────────────────────

  const filtered = filterOpportunities(opportunities, filters);

  // ── Tabs ───────────────────────────────────────────────────────────────

  const TABS: { id: View; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "list",      label: "List",      icon: "📋" },
    { id: "pipeline",  label: "Pipeline",  icon: "🔄" },
    { id: "scanner",   label: "AI Scanner", icon: "🤖" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────

  const isFormView   = view === "create" || (view === "detail" && editing !== null);
  const isDetailView = view === "detail" && !editing;

  return (
    <div style={{ minHeight: "100%", background: "hsl(220,20%,97%)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>
              🎯 Opportunity Engine
            </h1>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
              Discover, score, and pursue high-value opportunities with AI intelligence
            </p>
          </div>
          {view !== "create" && !editing && (
            <button
              onClick={() => { setEditing(null); setView("create"); }}
              style={{
                padding: "10px 20px", borderRadius: 12, border: "none",
                background: INDIGO, color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
              }}
            >
              + New Opportunity
            </button>
          )}
        </div>

        {/* ── Tab bar ── */}
        {!isDetailView && !isFormView && (
          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(0,0,0,0.04)", borderRadius: 12, padding: 4 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                style={{
                  flex: 1, padding: "8px 10px", borderRadius: 9, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: view === tab.id ? 700 : 500,
                  background: view === tab.id ? "white" : "transparent",
                  color: view === tab.id ? INDIGO : "#64748b",
                  boxShadow: view === tab.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 5,
                }}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, background: "#fff5f5",
            border: "1px solid #fecaca", color: "#dc2626", fontSize: 12,
            marginBottom: 14, display: "flex", justifyContent: "space-between",
          }}>
            {error}
            <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 14 }}>✕</button>
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 }}>
            Loading opportunities…
          </div>
        ) : isDetailView && selected ? (
          <DetailPanel
            opp={selected}
            onBack={() => { setSelected(null); setView("list"); }}
            onEdit={o => { setEditing(o); }}
            onDelete={handleDelete}
            onSaveInsight={handleSaveInsight}
            loadingInsight={false}
          />
        ) : view === "create" ? (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "22px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>New Opportunity</div>
            <OpportunityForm
              initial={editing ?? undefined}
              onSave={handleCreate}
              onCancel={() => { setEditing(null); setView("list"); }}
              saving={saving}
            />
          </div>
        ) : editing ? (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "22px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>Edit Opportunity</div>
            <OpportunityForm
              initial={editing}
              onSave={handleUpdate}
              onCancel={() => { setEditing(null); setView(selected ? "detail" : "list"); }}
              saving={saving}
            />
          </div>
        ) : view === "dashboard" ? (
          <DashboardView
            stats={stats}
            opportunities={opportunities}
            onSelect={o => { setSelected(o); setView("detail"); }}
            onCreate={() => setView("create")}
          />
        ) : view === "list" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Filter row */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                placeholder="Search opportunities…"
                style={{
                  flex: 1, minWidth: 180, padding: "8px 12px", borderRadius: 10,
                  border: `1.5px solid ${BORDER}`, background: "white", fontSize: 12,
                  color: "#0f172a", outline: "none",
                }}
              />
              {[
                { key: "type" as const,     opts: ["", ...OPPORTUNITY_TYPES],    label: "Type" },
                { key: "status" as const,   opts: ["", ...OPPORTUNITY_STATUSES], label: "Status" },
                { key: "priority" as const, opts: ["", ...OPPORTUNITY_PRIORITIES], label: "Priority" },
              ].map(({ key, opts, label }) => (
                <select key={key}
                  value={filters[key]}
                  onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                  style={{
                    padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${BORDER}`,
                    background: "white", fontSize: 12, color: "#374151", cursor: "pointer",
                  }}
                >
                  <option value="">{label}</option>
                  {opts.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
              {(filters.search || filters.type || filters.status || filters.priority) && (
                <button onClick={() => setFilters(DEFAULT_FILTERS)}
                  style={{ fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>
                  Clear
                </button>
              )}
            </div>

            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {filtered.length} of {opportunities.length} opportunities
            </div>

            {filtered.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "40px 20px",
                color: "#94a3b8", fontSize: 13,
                border: `2px dashed ${BORDER}`, borderRadius: 14,
              }}>
                {opportunities.length === 0
                  ? "No opportunities yet. Create one or run the AI Scanner."
                  : "No opportunities match your filters."}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {filtered.map(opp => (
                  <OpportunityCard
                    key={opp.id} opp={opp}
                    onSelect={o => { setSelected(o); setView("detail"); }}
                    onToggleStar={handleToggleStar}
                  />
                ))}
              </div>
            )}
          </div>
        ) : view === "pipeline" ? (
          <PipelineView
            opportunities={opportunities}
            onSelect={o => { setSelected(o); setView("detail"); }}
            onStatusChange={handleStatusChange}
          />
        ) : view === "scanner" ? (
          <ScannerView onCreateFromScan={handleCreateFromScan} />
        ) : null}
      </div>
    </div>
  );
}
