import type { AuthUser } from "../components/AuthForm";
import type { ApiStatus } from "../App";
import { Link } from "react-router-dom";

interface Props {
  user:      AuthUser;
  apiStatus: ApiStatus | null;
}

export function Dashboard({ user, apiStatus }: Props) {
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  const cards = [
    { label: "Projects",      icon: "📁", to: "/projects",     desc: "Manage your facility projects" },
    { label: "Patients",      icon: "🏥", to: "/patients",     desc: "Clinical records (synthetic data)" },
    ...(isAdmin ? [
      { label: "Users",         icon: "👤", to: "/users",         desc: "Manage staff accounts" },
      { label: "Organizations", icon: "🏢", to: "/organizations", desc: "Facility & org settings" },
      { label: "Integrations",  icon: "🔌", to: "/integrations",  desc: "EHR / FHIR / HL7 connectors" },
      { label: "Audit Log",     icon: "📋", to: "/audit",          desc: "HIPAA access & activity log" },
    ] : []),
  ];

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p style={styles.sub}>
            {user.email} &middot;{" "}
            <span style={styles.roleChip}>{user.role}</span>
            {user.organizationId && (
              <span style={{ marginLeft: 8, fontSize: 12, color: "#94a3b8" }}>
                org: {user.organizationId.slice(0, 8)}…
              </span>
            )}
          </p>
        </div>

        {/* API status */}
        {apiStatus && (
          <div style={{
            ...styles.statusBadge,
            borderColor: apiStatus.status === "ok" ? "#10b981" : "#f59e0b",
            color:       apiStatus.status === "ok" ? "#10b981" : "#f59e0b",
          }}>
            <span style={{
              ...styles.dot,
              background: apiStatus.status === "ok" ? "#10b981" : "#f59e0b",
            }} />
            API {apiStatus.status}
            {apiStatus.services?.database && ` · DB ${apiStatus.services.database}`}
          </div>
        )}
      </div>

      {/* Notice: clinical data */}
      <div style={styles.notice}>
        <span style={styles.noticeIcon}>ℹ️</span>
        <span>
          <strong>HIPAA notice:</strong> Clinical tables are schema-only scaffolding.
          No real PHI may be stored until a BAA is signed and encryption is in place.
          Use synthetic test data only.
        </span>
      </div>

      {/* Quick-access cards */}
      <div style={styles.grid}>
        {cards.map((card) => (
          <Link key={card.to} to={card.to} style={styles.card}>
            <div style={styles.cardIcon}>{card.icon}</div>
            <div style={styles.cardLabel}>{card.label}</div>
            <div style={styles.cardDesc}>{card.desc}</div>
          </Link>
        ))}
      </div>

      {/* Security baseline status */}
      <div style={styles.section}>
        <h2 style={styles.sectionHeading}>Security Baseline</h2>
        <div style={styles.checkList}>
          {[
            { label: "HTTPS / TLS (Caddy)",        done: true  },
            { label: "Signed session cookies",      done: true  },
            { label: "Inactivity timeout (30 min)", done: true  },
            { label: "Helmet security headers",     done: true  },
            { label: "Rate limiting (auth routes)", done: true  },
            { label: "Audit log infrastructure",    done: true  },
            { label: "MFA (TOTP) available",        done: true  },
            { label: "Non-root Docker user",        done: true  },
            { label: "Column-level PHI encryption", done: false },
            { label: "Row-level security (RLS)",    done: false },
            { label: "BAA in place",                done: false },
            { label: "Risk analysis complete",      done: false },
          ].map((item) => (
            <div key={item.label} style={styles.checkRow}>
              <span style={{ color: item.done ? "#10b981" : "#cbd5e1", fontSize: 16 }}>
                {item.done ? "✓" : "○"}
              </span>
              <span style={{ color: item.done ? "#0f172a" : "#94a3b8", fontSize: 13 }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 20,
  },
  heading: { fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" },
  sub:     { fontSize: 13, color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 6 },
  roleChip: {
    fontSize: 10, fontWeight: 700, background: "#f1f5f9", color: "#4f46e5",
    borderRadius: 4, padding: "2px 6px", textTransform: "uppercase",
  },
  statusBadge: {
    display: "flex", alignItems: "center", gap: 6, fontSize: 12,
    border: "1px solid", borderRadius: 6, padding: "5px 10px", background: "#fff", flexShrink: 0,
  },
  dot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  notice: {
    background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8,
    padding: "10px 14px", marginBottom: 24, fontSize: 13, color: "#1e40af",
    display: "flex", alignItems: "flex-start", gap: 8,
  },
  noticeIcon: { flexShrink: 0, fontSize: 15 },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 14, marginBottom: 28,
  },
  card: {
    background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12,
    padding: "20px 18px", textDecoration: "none",
    display: "flex", flexDirection: "column", gap: 6,
    transition: "box-shadow 0.15s",
  },
  cardIcon:  { fontSize: 24, marginBottom: 4 },
  cardLabel: { fontSize: 14, fontWeight: 600, color: "#0f172a" },
  cardDesc:  { fontSize: 12, color: "#64748b" },
  section: {
    background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)",
    borderRadius: 12, padding: "20px 24px",
  },
  sectionHeading: { fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 },
  checkList: { display: "flex", flexDirection: "column", gap: 10 },
  checkRow:  { display: "flex", alignItems: "center", gap: 10 },
};
