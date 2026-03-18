import { useEffect, useState } from "react";
import type { AuthUser } from "../components/AuthForm";
import { config } from "../config";

interface UserRow {
  id:          string;
  email:       string;
  name:        string | null;
  role:        string;
  isActive:    boolean;
  mfaEnabled:  boolean;
  lastLoginAt: string | null;
  createdAt:   string;
}

interface Props { user: AuthUser }

export function Users({ user }: Props) {
  const [users,   setUsers]   = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch(`${config.apiBase}/users`, { credentials: "include" })
      .then((r) => r.json() as Promise<{ users: UserRow[]; error?: string }>)
      .then((d) => {
        if (d.error) setError(d.error);
        else setUsers(d.users ?? []);
      })
      .catch(() => setError("Could not reach the server."))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = user.role === "admin" || user.role === "super_admin";

  return (
    <div>
      <h1 style={styles.heading}>Users</h1>
      <p style={styles.sub}>
        {isAdmin
          ? "All users in your organization."
          : "Your user account."}
      </p>

      <div style={styles.section}>
        {loading ? (
          <div style={styles.empty}>Loading…</div>
        ) : error ? (
          <div style={styles.error}>{error}</div>
        ) : users.length === 0 ? (
          <div style={styles.empty}>No users found.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["Name / Email", "Role", "MFA", "Active", "Last login", "Created"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.nameCell}>{u.name ?? "—"}</div>
                    <div style={styles.emailCell}>{u.email}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.chip, background: u.role === "admin" ? "#ede9fe" : "#f1f5f9",
                                   color: u.role === "admin" ? "#7c3aed" : "#64748b" }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ color: u.mfaEnabled ? "#10b981" : "#cbd5e1", fontWeight: 600, fontSize: 13 }}>
                      {u.mfaEnabled ? "✓ On" : "○ Off"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ color: u.isActive ? "#10b981" : "#ef4444", fontSize: 13 }}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.meta}>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.meta}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading:   { fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 4 },
  sub:       { fontSize: 13, color: "#64748b", marginBottom: 24 },
  section:   { background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: 24, overflowX: "auto" },
  table:     { width: "100%", borderCollapse: "collapse" },
  th:        { textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", padding: "0 12px 12px" },
  tr:        { borderBottom: "1px solid rgba(0,0,0,0.05)" },
  td:        { padding: "12px", verticalAlign: "middle" },
  nameCell:  { fontSize: 13, fontWeight: 600, color: "#0f172a" },
  emailCell: { fontSize: 12, color: "#64748b" },
  chip:      { fontSize: 11, fontWeight: 700, borderRadius: 4, padding: "2px 7px", textTransform: "uppercase" },
  meta:      { fontSize: 12, color: "#94a3b8" },
  empty:     { color: "#94a3b8", fontSize: 14, padding: "24px 0", textAlign: "center" },
  error:     { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#dc2626", fontSize: 13, padding: "8px 12px" },
};
