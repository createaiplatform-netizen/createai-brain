import { usePlatformIdentity } from "../hooks/usePlatformIdentity";

const SOURCE_COLORS: Record<string, string> = {
  "custom":       "#22c55e",
  "replit-dev":   "#6366f1",
  "replit-app":   "#6366f1",
  "npa-fallback": "#f59e0b",
};

export default function PlatformIdBadge() {
  const { identity, loading, sourceLabel } = usePlatformIdentity();

  if (loading) {
    return (
      <div style={{ padding: "12px 16px", background: "#0f172a", borderRadius: 8, opacity: 0.5 }}>
        <span style={{ color: "#64748b", fontSize: 12 }}>Resolving platform identity…</span>
      </div>
    );
  }

  if (!identity) return null;

  const dot = SOURCE_COLORS[identity.domainSource] ?? "#6366f1";

  return (
    <div style={{
      background: "#0f172a",
      border: "1px solid #1e293b",
      borderRadius: 10,
      padding: "14px 18px",
      fontFamily: "monospace",
      fontSize: 13,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{
          background: "#1e293b",
          color: "#a5b4fc",
          borderRadius: 6,
          padding: "3px 8px",
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: "0.05em",
        }}>
          NEXUS PLATFORM ADDRESS
        </span>
        <span style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "#0f172a", border: "1px solid #1e293b",
          borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#94a3b8",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, display: "inline-block" }} />
          {sourceLabel}
        </span>
      </div>

      <div style={{ color: "#e2e8f0", marginBottom: 8, fontSize: 15, letterSpacing: "0.02em" }}>
        {identity.npa}
      </div>

      <div style={{ color: "#64748b", fontSize: 11, marginBottom: 10 }}>
        Resolves to
      </div>

      <a
        href={identity.liveUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#818cf8", textDecoration: "none", wordBreak: "break-all", fontSize: 13 }}
      >
        {identity.liveUrl}
      </a>

      <div style={{ borderTop: "1px solid #1e293b", marginTop: 12, paddingTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
        <Row label="Handle"  value={`@${identity.handle}`} />
        <Row label="Contact" value={identity.contactEmail} />
        <Row label="Email from" value={identity.fromEmail} />
        <Row label="Cash App"  value={identity.cashApp} />
        <Row label="Venmo"     value={identity.venmo} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: "#475569" }}>{label}</span>
      <span style={{ color: "#94a3b8" }}>{value}</span>
    </div>
  );
}
