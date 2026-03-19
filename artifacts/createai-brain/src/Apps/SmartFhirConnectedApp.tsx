/**
 * SMART-on-FHIR Sandbox — Connected Confirmation Page
 *
 * Shown after the user successfully authorizes via the SMART Health IT public sandbox.
 * Displays the connection status and allows the user to test-fetch live FHIR data.
 *
 * This is test data only — no real PHI. Public SMART-on-FHIR sandbox.
 * Architecture is identical to what would be used for Epic/MyChart production.
 */

import React, { useEffect, useState } from "react";

interface FhirTestResult {
  ok:       boolean;
  sandbox:  string;
  endpoint: string;
  data:     unknown;
}

function JsonViewer({ value }: { value: unknown }) {
  const lines = JSON.stringify(value, null, 2).split("\n");

  // Simple syntax highlighting via spans
  const colorize = (line: string): React.ReactNode => {
    const keyMatch   = line.match(/^(\s*)"([^"]+)":\s/);
    const strMatch   = line.match(/:\s(".*")([,]?)$/);
    const numMatch   = line.match(/:\s(\d+\.?\d*)([,]?)$/);
    const boolMatch  = line.match(/:\s(true|false|null)([,]?)$/);

    if (keyMatch) {
      const indent   = keyMatch[1];
      const key      = keyMatch[2];
      const rest     = line.slice(keyMatch[0].length - 1);
      return (
        <span>
          {indent}<span style={{ color: "#7c3aed" }}>&quot;{key}&quot;</span>:{rest}
        </span>
      );
    }
    if (strMatch)  return <span>{line.replace(strMatch[1], `<span style="color:#16a34a">${strMatch[1]}</span>`)}</span>;
    if (numMatch)  return <span style={{ color: "#0284c7" }}>{line}</span>;
    if (boolMatch) return <span style={{ color: "#ea580c" }}>{line}</span>;
    return <span>{line}</span>;
  };

  return (
    <div style={{
      background:   "#0f172a",
      borderRadius: 12,
      padding:      "16px 20px",
      overflow:     "auto",
      maxHeight:    480,
      fontFamily:   "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      fontSize:     12,
      lineHeight:   1.7,
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{ color: "#e2e8f0", whiteSpace: "pre" }}>
          <span style={{ color: "#475569", userSelect: "none", marginRight: 12 }}>
            {String(i + 1).padStart(3, " ")}
          </span>
          {colorize(line)}
        </div>
      ))}
    </div>
  );
}

export default function SmartFhirConnectedApp() {
  const [connectionKey, setConnectionKey] = useState<string | null>(null);
  const [result,        setResult]        = useState<FhirTestResult | null>(null);
  const [testing,       setTesting]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [reconnect,     setReconnect]     = useState(false);

  useEffect(() => {
    const key = sessionStorage.getItem("smartFhirConnectionKey");
    setConnectionKey(key);
  }, []);

  const handleTestFetch = async () => {
    if (!connectionKey) {
      setError("No connection key found. Please reconnect.");
      setReconnect(true);
      return;
    }

    setTesting(true);
    setError(null);
    setResult(null);

    try {
      const res  = await fetch(
        `/api/integrations/smart-fhir-sandbox/test-patient?key=${encodeURIComponent(connectionKey)}`,
        { credentials: "include" }
      );
      const data = await res.json() as FhirTestResult & { error?: string; reconnect?: boolean };

      if (data.reconnect) {
        setReconnect(true);
        setError(data.error ?? "Session expired.");
      } else if (data.ok) {
        setResult(data);
      } else {
        setError(data.error ?? "FHIR fetch failed.");
      }
    } catch {
      setError("Network error — could not reach the FHIR endpoint.");
    } finally {
      setTesting(false);
    }
  };

  const handleReconnect = () => {
    sessionStorage.removeItem("smartFhirConnectionKey");
    // Navigate to the IntegrationDashboard or back to the OS
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    window.location.href = `${base}/`;
  };

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div style={{
      minHeight:      "100vh",
      background:     "#f8fafc",
      fontFamily:     "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding:        "40px 24px",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <a
            href={`${base}/`}
            style={{
              fontSize:       12,
              color:          "#6366f1",
              textDecoration: "none",
              fontWeight:     500,
            }}
          >
            ← Back to CreateAI Brain
          </a>
        </div>

        {/* Connected card */}
        <div style={{
          background:   "#ffffff",
          border:       "1px solid rgba(0,0,0,0.08)",
          borderRadius: 20,
          padding:      "32px 36px",
          marginBottom: 24,
          boxShadow:    "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          {/* Status row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
            <div style={{
              width:         48,
              height:        48,
              borderRadius:  14,
              background:    "rgba(16,185,129,0.10)",
              display:       "flex",
              alignItems:    "center",
              justifyContent:"center",
              fontSize:      24,
              flexShrink:    0,
            }}>
              🏥
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                  SMART-on-FHIR Sandbox
                </span>
                <span style={{
                  fontSize:     11,
                  fontWeight:   600,
                  color:        "#10b981",
                  background:   "rgba(16,185,129,0.10)",
                  padding:      "2px 9px",
                  borderRadius: 20,
                  border:       "1px solid rgba(16,185,129,0.20)",
                }}>
                  ● Connected
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                Successfully authorized via the public SMART Health IT sandbox.
              </div>
            </div>
          </div>

          {/* Info pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {[
              { icon: "🧪", label: "Test data only" },
              { icon: "🔒", label: "No real PHI" },
              { icon: "⚖️", label: "Legal public sandbox" },
              { icon: "🚀", label: "Epic-ready architecture" },
            ].map(p => (
              <div
                key={p.label}
                style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          5,
                  background:   "#f1f5f9",
                  borderRadius: 8,
                  padding:      "5px 10px",
                  fontSize:     11,
                  color:        "#475569",
                  fontWeight:   500,
                }}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </div>
            ))}
          </div>

          {/* Connector info */}
          <div style={{
            background:    "#f8fafc",
            border:        "1px solid rgba(0,0,0,0.06)",
            borderRadius:  12,
            padding:       "14px 16px",
            marginBottom:  24,
            fontSize:      12,
            lineHeight:    1.8,
            color:         "#475569",
          }}>
            <div><span style={{ color: "#94a3b8" }}>Sandbox:</span> SMART Health IT — <code style={{ fontSize: 11 }}>launch.smarthealthit.org</code></div>
            <div><span style={{ color: "#94a3b8" }}>FHIR version:</span> R4 (4.0.1)</div>
            <div><span style={{ color: "#94a3b8" }}>Auth flow:</span> OAuth 2.0 — authorization code + PKCE</div>
            <div><span style={{ color: "#94a3b8" }}>Scope:</span> <code style={{ fontSize: 11 }}>openid profile patient/*.read</code></div>
            <div><span style={{ color: "#94a3b8" }}>Production path:</span> Replace base URL + client_id → Epic/MyChart live</div>
          </div>

          {/* Test fetch button */}
          {!reconnect ? (
            <button
              onClick={handleTestFetch}
              disabled={testing}
              style={{
                background:    testing ? "#e2e8f0" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color:         testing ? "#94a3b8" : "#ffffff",
                border:        "none",
                borderRadius:  12,
                padding:       "12px 28px",
                fontSize:      14,
                fontWeight:    600,
                cursor:        testing ? "not-allowed" : "pointer",
                display:       "flex",
                alignItems:    "center",
                gap:           8,
              }}
            >
              {testing ? (
                <>
                  <div style={{
                    width:        16,
                    height:       16,
                    borderRadius: "50%",
                    border:       "2px solid rgba(0,0,0,0.15)",
                    borderTop:    "2px solid #94a3b8",
                    animation:    "spin 0.8s linear infinite",
                  }} />
                  Fetching from FHIR sandbox…
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Test Fetch Patient Data
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleReconnect}
              style={{
                background:    "#6366f1",
                color:         "#ffffff",
                border:        "none",
                borderRadius:  12,
                padding:       "12px 28px",
                fontSize:      14,
                fontWeight:    600,
                cursor:        "pointer",
              }}
            >
              Reconnect
            </button>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div style={{
            background:    "rgba(239,68,68,0.06)",
            border:        "1px solid rgba(239,68,68,0.20)",
            borderRadius:  12,
            padding:       "14px 18px",
            marginBottom:  24,
            fontSize:      13,
            color:         "#dc2626",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* FHIR result */}
        {result && (
          <div style={{
            background:   "#ffffff",
            border:       "1px solid rgba(0,0,0,0.08)",
            borderRadius: 20,
            padding:      "28px 32px",
            boxShadow:    "0 4px 24px rgba(0,0,0,0.06)",
          }}>
            {/* Result header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                  FHIR Patient Data Retrieved
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  Endpoint: <code>{result.endpoint}</code>
                </div>
              </div>
            </div>

            <div style={{
              fontSize:      11,
              color:         "#10b981",
              background:    "rgba(16,185,129,0.08)",
              border:        "1px solid rgba(16,185,129,0.20)",
              borderRadius:  8,
              padding:       "6px 12px",
              marginBottom:  16,
              display:       "inline-block",
            }}>
              {result.sandbox}
            </div>

            <JsonViewer value={result.data} />
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
