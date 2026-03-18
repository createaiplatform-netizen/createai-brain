import { useEffect, useState } from "react";
import type { AuthUser } from "../components/AuthForm";
import { config } from "../config";

interface Integration {
  id:          string;
  name:        string;
  description: string;
  category:    string;
  protocol:    string;
  status:      "live" | "test-stub" | "planned";
  testServer?: string;
  docsUrl?:    string;
  vendors:     string[];
}

interface Props { user: AuthUser }

const STATUS_COLORS = {
  "live":       { bg: "#dcfce7", text: "#15803d", label: "Live" },
  "test-stub":  { bg: "#dbeafe", text: "#1d4ed8", label: "Test stub" },
  "planned":    { bg: "#f1f5f9", text: "#64748b", label: "Planned" },
};

export function Integrations({ user }: Props) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [testResult,   setTestResult]   = useState<string | null>(null);
  const [testLoading,  setTestLoading]  = useState(false);
  const [hl7Sample,    setHl7Sample]    = useState<object | null>(null);

  useEffect(() => {
    fetch(`${config.apiBase}/integrations`, { credentials: "include" })
      .then((r) => r.json() as Promise<{ integrations: Integration[] }>)
      .then((d) => setIntegrations(d.integrations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = user.role === "admin" || user.role === "super_admin";

  async function testFHIR() {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res  = await fetch(`${config.apiBase}/integrations/fhir-r4/test`, { credentials: "include" });
      const data = await res.json() as { patients?: object[]; error?: string; source?: string; total?: number };
      if (data.error) {
        setTestResult(`Error: ${data.error}`);
      } else {
        setTestResult(
          `✓ FHIR R4 test succeeded — ${data.total} patient(s) found on ${data.source?.split("(")[0]?.trim()}`
        );
      }
    } catch {
      setTestResult("✗ Could not reach the test server.");
    } finally {
      setTestLoading(false);
    }
  }

  async function loadHL7Sample() {
    const res  = await fetch(`${config.apiBase}/integrations/hl7-v2/test`, { credentials: "include" });
    const data = await res.json() as object;
    setHl7Sample(data);
  }

  return (
    <div>
      <h1 style={styles.heading}>Integrations</h1>
      <p style={styles.sub}>
        EHR, pharmacy, and billing connectors. Only test-stub and planned integrations
        are available — no real PHI flows until a BAA is in place.
      </p>

      {loading ? (
        <div style={styles.empty}>Loading…</div>
      ) : (
        <div style={styles.list}>
          {integrations.map((intg) => {
            const s = STATUS_COLORS[intg.status];
            return (
              <div key={intg.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardLeft}>
                    <div style={styles.cardName}>{intg.name}</div>
                    <div style={styles.cardProto}>{intg.protocol}</div>
                  </div>
                  <span style={{ ...styles.statusChip, background: s.bg, color: s.text }}>
                    {s.label}
                  </span>
                </div>

                <p style={styles.cardDesc}>{intg.description}</p>

                <div style={styles.cardFooter}>
                  <div style={styles.vendorList}>
                    {intg.vendors.map((v) => (
                      <span key={v} style={styles.vendorChip}>{v}</span>
                    ))}
                  </div>
                  <div style={styles.actions}>
                    {intg.docsUrl && (
                      <a href={intg.docsUrl} target="_blank" rel="noopener noreferrer" style={styles.docsLink}>
                        Docs ↗
                      </a>
                    )}
                    {intg.id === "fhir-r4" && isAdmin && (
                      <button style={styles.testBtn} onClick={testFHIR} disabled={testLoading}>
                        {testLoading ? "Testing…" : "Test connection"}
                      </button>
                    )}
                    {intg.id === "hl7-v2-mllp" && isAdmin && (
                      <button style={styles.testBtn} onClick={loadHL7Sample}>
                        View sample message
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {testResult && (
        <div style={{
          ...styles.result,
          background: testResult.startsWith("✓") ? "#f0fdf4" : "#fef2f2",
          border:     `1px solid ${testResult.startsWith("✓") ? "#bbf7d0" : "#fecaca"}`,
          color:      testResult.startsWith("✓") ? "#15803d" : "#dc2626",
        }}>
          {testResult}
        </div>
      )}

      {hl7Sample && (
        <div style={styles.codeBlock}>
          <div style={styles.codeHeader}>HL7 v2.5.1 ADT^A01 (Patient Admission) — Synthetic Sample</div>
          <pre style={styles.pre}>
            {(hl7Sample as { rawMessage?: string }).rawMessage
              ?.split("\r")
              .join("\n") ?? JSON.stringify(hl7Sample, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading:     { fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 4 },
  sub:         { fontSize: 13, color: "#64748b", marginBottom: 24 },
  list:        { display: "flex", flexDirection: "column", gap: 14 },
  card:        { background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: "18px 20px" },
  cardHeader:  { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 },
  cardLeft:    {},
  cardName:    { fontSize: 15, fontWeight: 700, color: "#0f172a" },
  cardProto:   { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  statusChip:  { fontSize: 11, fontWeight: 700, borderRadius: 4, padding: "3px 8px", flexShrink: 0 },
  cardDesc:    { fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 14 },
  cardFooter:  { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 },
  vendorList:  { display: "flex", flexWrap: "wrap", gap: 6 },
  vendorChip:  { fontSize: 11, background: "#f1f5f9", color: "#64748b", borderRadius: 4, padding: "2px 7px" },
  actions:     { display: "flex", gap: 8, alignItems: "center" },
  docsLink:    { fontSize: 12, color: "#4f46e5", textDecoration: "none" },
  testBtn:     { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  result:      { marginTop: 16, borderRadius: 8, padding: "12px 16px", fontSize: 13 },
  codeBlock:   { marginTop: 20, background: "#0f172a", borderRadius: 10, overflow: "hidden" },
  codeHeader:  { padding: "10px 16px", fontSize: 12, color: "#94a3b8", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  pre:         { padding: 16, fontSize: 12, color: "#e2e8f0", fontFamily: "monospace", overflowX: "auto", margin: 0 },
  empty:       { color: "#94a3b8", fontSize: 14, padding: "24px 0", textAlign: "center" },
};
