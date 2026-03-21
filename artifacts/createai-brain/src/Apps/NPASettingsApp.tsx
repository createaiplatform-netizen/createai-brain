import { useState } from "react";
import { usePlatformIdentity } from "../hooks/usePlatformIdentity";
import PlatformIdBadge from "../components/PlatformIdBadge";

const CARD = {
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: 10,
  padding: "18px 20px",
  marginBottom: 16,
};

const LABEL = { color: "#475569", fontSize: 12, marginBottom: 4 };
const VALUE = { color: "#e2e8f0", fontSize: 14, wordBreak: "break-all" as const };

const H2 = { color: "#e2e8f0", fontSize: 16, fontWeight: 700, marginBottom: 4 };
const SUB = { color: "#64748b", fontSize: 13, marginBottom: 0 };

export default function NPASettingsApp() {
  const { identity, loading, sourceLabel } = usePlatformIdentity();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState("");

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshMsg("");
    try {
      const r = await fetch("/api/platform-identity/refresh", { method: "POST" });
      const d = await r.json();
      if (d.ok) setRefreshMsg("Identity re-resolved → " + d.liveUrl);
      else setRefreshMsg("Refresh failed");
    } catch {
      setRefreshMsg("Network error during refresh");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 720, color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: "#1e1b4b",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>🪪</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e2e8f0" }}>
              NEXUS Platform Address
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Internal identity system — no domain purchase required
            </p>
          </div>
        </div>
      </div>

      {/* NPA Badge */}
      <div style={{ marginBottom: 20 }}>
        <PlatformIdBadge />
      </div>

      {/* How it works */}
      <div style={{ ...CARD }}>
        <p style={H2}>How Your Identity Resolves</p>
        <p style={SUB}>
          The NPA system auto-detects the platform's live URL from the Replit runtime.
          Your canonical identity is anchored to your payment handles — not a DNS registrar.
        </p>

        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Canonical NPA" value={loading ? "…" : (identity?.npa ?? "—")} />
          <Field label="Resolution Source" value={loading ? "…" : sourceLabel} />
          <Field label="Live Domain" value={loading ? "…" : (identity?.liveDomain ?? "—")} />
          <Field label="Resolved At" value={loading ? "…" : (identity?.resolvedAt ? new Date(identity.resolvedAt).toLocaleTimeString() : "—")} />
        </div>
      </div>

      {/* Resolution chain */}
      <div style={{ ...CARD }}>
        <p style={H2}>Resolution Priority Chain</p>
        <p style={{ ...SUB, marginBottom: 14 }}>
          The system tries each source in order and uses the first available one.
        </p>
        {[
          { priority: "1", label: "BRAND_DOMAIN secret", status: identity?.domainSource === "custom" ? "active" : "not set", desc: "Set this if you ever purchase a domain. Updates the entire platform instantly." },
          { priority: "2", label: "REPLIT_DEV_DOMAIN", status: identity?.domainSource === "replit-dev" ? "active" : (identity?.domainSource === "custom" ? "skipped" : "—"), desc: "Auto-injected by Replit. Always available in dev. Used right now if highlighted." },
          { priority: "3", label: "Replit Published URL", status: identity?.domainSource === "replit-app" ? "active" : "pending publish", desc: "Available after you publish the app. Stable and permanent." },
          { priority: "4", label: "NPA Internal Fallback", status: identity?.domainSource === "npa-fallback" ? "active" : "standby", desc: "Used only if no network URL is available. Fully functional for internal operations." },
        ].map(item => (
          <div key={item.priority} style={{ display: "flex", gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: item.status === "active" ? "#312e81" : "#1e293b",
              color: item.status === "active" ? "#a5b4fc" : "#475569",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700,
            }}>{item.priority}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ color: "#e2e8f0", fontSize: 13, fontFamily: "monospace" }}>{item.label}</span>
                <span style={{
                  fontSize: 10, padding: "1px 6px", borderRadius: 4, fontWeight: 600,
                  background: item.status === "active" ? "#312e81" : "#1e293b",
                  color: item.status === "active" ? "#a5b4fc" : "#475569",
                }}>{item.status}</span>
              </div>
              <div style={{ color: "#64748b", fontSize: 12 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Email identity */}
      <div style={{ ...CARD }}>
        <p style={H2}>Email Identity (No Custom Domain Needed)</p>
        <p style={{ ...SUB, marginBottom: 14 }}>
          Outbound email uses Resend's pre-verified shared sending domain. Recipients see your brand name in the From field.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Display Name" value="CreateAI Brain | Sara Stadler" />
          <Field label="Sending Address" value={loading ? "…" : (identity?.fromEmail ?? "—")} />
          <Field label="Contact Address" value={loading ? "…" : (identity?.contactEmail ?? "—")} />
          <Field label="To upgrade" value="Set RESEND_FROM_EMAIL secret" dim />
        </div>
        <div style={{ marginTop: 14, padding: "10px 14px", background: "#020617", borderRadius: 8, fontSize: 12, color: "#64748b" }}>
          <span style={{ color: "#a5b4fc", fontFamily: "monospace" }}>From: "CreateAI Brain | Sara Stadler" &lt;{loading ? "…" : (identity?.fromEmail ?? "—")}&gt;</span>
          <br />
          <span style={{ marginTop: 4, display: "block" }}>
            This is a valid RFC 5321 email From header. No custom domain needed for delivery.
          </span>
        </div>
      </div>

      {/* Payment identity */}
      <div style={{ ...CARD }}>
        <p style={H2}>Payment Identity — Stable Across All Domains</p>
        <p style={{ ...SUB, marginBottom: 14 }}>
          Payment handles are the most stable identity the platform has. They don't change
          with domains, hosting, or DNS.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Cash App" value={identity?.cashApp ?? "$CreateAIDigital"} />
          <Field label="Venmo"    value={identity?.venmo    ?? "@CreateAIDigital"} />
        </div>
      </div>

      {/* Well-known endpoints */}
      <div style={{ ...CARD }}>
        <p style={H2}>Machine-Readable Identity Endpoints</p>
        <p style={{ ...SUB, marginBottom: 14 }}>
          These public endpoints describe the platform's identity in standard formats.
        </p>
        {[
          { path: "/.well-known/platform-id.json", desc: "Full NPA identity card (JSON)" },
          { path: "/.well-known/npa-resolve.json",  desc: "NPA → live URL resolution map" },
          { path: "/api/platform-identity",          desc: "Live resolved identity for frontend" },
        ].map(ep => (
          <div key={ep.path} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
            <a
              href={ep.path}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#818cf8", fontFamily: "monospace" }}
            >
              {ep.path}
            </a>
            <span style={{ color: "#64748b" }}>{ep.desc}</span>
          </div>
        ))}
      </div>

      {/* Limitations */}
      <div style={{ ...CARD, border: "1px solid #292524" }}>
        <p style={{ ...H2, color: "#fbbf24" }}>Limitations vs. a Real Domain</p>
        {[
          "Cannot serve a public website at a memorable URL (e.g. createai.com)",
          "Cannot send email FROM a custom address (e.g. admin@createai.com)",
          "Replit dev URL may change between sessions — use the published URL for stability",
          "Cannot register in Google Search Console without domain ownership proof",
          "Third-party embeds or OAuth apps may require a stable domain allowlist entry",
        ].map((lim, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13 }}>
            <span style={{ color: "#f59e0b", flexShrink: 0 }}>⚠</span>
            <span style={{ color: "#94a3b8" }}>{lim}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#020617", borderRadius: 8, fontSize: 12, color: "#64748b" }}>
          To remove all limitations: set <span style={{ color: "#a5b4fc", fontFamily: "monospace" }}>BRAND_DOMAIN</span> secret. One secret updates the entire platform.
        </div>
      </div>

      {/* Refresh */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            background: "#312e81", color: "#a5b4fc", border: "none",
            borderRadius: 8, padding: "10px 20px", cursor: "pointer",
            fontSize: 13, fontWeight: 600, opacity: refreshing ? 0.6 : 1,
          }}
        >
          {refreshing ? "Re-resolving…" : "Re-resolve Identity Now"}
        </button>
        {refreshMsg && <span style={{ color: "#22c55e", fontSize: 12 }}>{refreshMsg}</span>}
      </div>
    </div>
  );
}

function Field({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div>
      <div style={LABEL}>{label}</div>
      <div style={{ ...VALUE, color: dim ? "#475569" : "#e2e8f0" }}>{value}</div>
    </div>
  );
}
