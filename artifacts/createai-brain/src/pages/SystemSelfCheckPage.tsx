// ═══════════════════════════════════════════════════════════════════════════
// SystemSelfCheckPage.tsx
// Admin-only. Runs a comprehensive platform self-check and displays results.
// Calls POST /api/system/self-check — founder only.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface SelfCheckHealth {
  registrySize:    number;
  allActive:       boolean;
  allProtected:    boolean;
  configComplete:  boolean;
  selfHealApplied: number;
}
interface PlatformScores {
  readiness: number; completeness: number; stability: number;
  integration: number; performance: number; security: number; scalability: number;
}
interface SelfCheckResult {
  ok:             boolean;
  health:         SelfCheckHealth;
  scores:         PlatformScores;
  selfHealStatus: { repaired: number; configComplete: boolean };
  anomalies:      string[];
  recommendations:string[];
  timestamp:      string;
  error?:         string;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.round((value / 200) * 100));
  const col  = value >= 150 ? "#22c55e" : value >= 120 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#94a3b8" }}>
        <span>{label}</span><span style={{ fontWeight: 700, color: col }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function BoolDot({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: ok ? "#22c55e" : "#ef4444", marginRight: 7,
    }} />
  );
}

export default function SystemSelfCheckPage() {
  const [result,  setResult]  = useState<SelfCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiRequest("POST", "/api/system/self-check", {});
      const data = await res.json() as SelfCheckResult;
      if (!data.ok) throw new Error(data.error ?? "Self-check failed");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100%", background: "#050A18", color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "28px 24px 60px",
    }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>🛡️</span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", margin: 0, letterSpacing: "-0.03em" }}>
              System Self-Check
            </h1>
            <span style={{
              fontSize: 9, fontWeight: 700, background: "rgba(239,68,68,0.15)",
              color: "#f87171", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 5, padding: "2px 7px", letterSpacing: "0.05em",
            }}>ADMIN ONLY</span>
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            Runs a comprehensive inspection of health, scores, self-heal status, and anomalies.
          </p>
        </div>

        {/* Trigger */}
        <button
          onClick={run}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: loading ? "rgba(99,102,241,0.3)" : "#6366f1",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "11px 26px", fontSize: 13, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: 28, transition: "background 0.15s",
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
                borderTop: "2px solid #fff", borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              Running\u2026
            </>
          ) : "Run Full System Check"}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#fca5a5", marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Timestamp */}
            <div style={{ fontSize: 11, color: "#475569" }}>
              Run at {new Date(result.timestamp).toLocaleString()}
            </div>

            {/* Health Summary */}
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 12, padding: "18px 20px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                Health Summary
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {[
                  ["Registry size",    result.health.registrySize,    null],
                  ["All active",       result.health.allActive,       true],
                  ["All protected",    result.health.allProtected,    true],
                  ["Config complete",  result.health.configComplete,  true],
                  ["Self-heal repairs", result.selfHealStatus.repaired, null],
                ].map(([label, val, isBool]) => (
                  <div key={label as string} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span style={{ color: "#94a3b8" }}>{label as string}</span>
                    <span style={{ fontWeight: 700, color: "#e2e8f0" }}>
                      {isBool !== null ? (
                        <><BoolDot ok={Boolean(val)} />{Boolean(val) ? "Yes" : "No"}</>
                      ) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scores */}
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 12, padding: "18px 20px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                Platform Scores
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(result.scores).map(([k, v]) => (
                  <ScoreBar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v as number} />
                ))}
              </div>
            </div>

            {/* Anomalies */}
            <div style={{
              background: result.anomalies.length > 0 ? "rgba(239,68,68,0.07)" : "rgba(34,197,94,0.07)",
              border: `1px solid ${result.anomalies.length > 0 ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)"}`,
              borderRadius: 12, padding: "18px 20px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: result.anomalies.length > 0 ? "#f87171" : "#4ade80", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Anomalies {result.anomalies.length > 0 ? `(${result.anomalies.length})` : "— None Detected"}
              </div>
              {result.anomalies.length > 0 ? (
                <ul style={{ margin: "0 0 0 16px", padding: 0, fontSize: 12.5, color: "#fca5a5", lineHeight: 1.7 }}>
                  {result.anomalies.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              ) : (
                <div style={{ fontSize: 13, color: "#4ade80" }}>
                  All systems nominal.
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div style={{
              background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.20)",
              borderRadius: 12, padding: "18px 20px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Recommendations
              </div>
              <ul style={{ margin: "0 0 0 16px", padding: 0, fontSize: 12.5, color: "#cbd5e1", lineHeight: 1.8 }}>
                {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
