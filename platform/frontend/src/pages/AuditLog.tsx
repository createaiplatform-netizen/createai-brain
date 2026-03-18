import { useEffect, useState, useCallback } from "react";
import type { AuthUser } from "../components/AuthForm";
import { config } from "../config";

interface AuditEntry {
  id:         string;
  occurredAt: string;
  userEmail:  string | null;
  action:     string;
  resource:   string;
  resourceId: string | null;
  ipAddress:  string | null;
}

interface Props { user: AuthUser }

const ACTION_COLORS: Record<string, string> = {
  LOGIN:        "#10b981",
  LOGIN_FAILED: "#ef4444",
  LOGIN_MFA:    "#10b981",
  LOGOUT:       "#64748b",
  REGISTER:     "#4f46e5",
  SETUP:        "#7c3aed",
  MFA_ENABLED:  "#0ea5e9",
  MFA_DISABLED: "#f59e0b",
  CREATE:       "#4f46e5",
  READ:         "#64748b",
  UPDATE:       "#f59e0b",
  DELETE:       "#ef4444",
};

export function AuditLog({ user }: Props) {
  const [entries,  setEntries]  = useState<AuditEntry[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [offset,   setOffset]   = useState(0);
  const [actions,  setActions]  = useState<string[]>([]);
  const [filter,   setFilter]   = useState("");
  const LIMIT = 50;

  const load = useCallback((off: number, actionFilter: string) => {
    setLoading(true);
    const params = new URLSearchParams({
      limit:  String(LIMIT),
      offset: String(off),
    });
    if (actionFilter) params.set("action", actionFilter);

    fetch(`${config.apiBase}/audit?${params}`, { credentials: "include" })
      .then((r) => r.json() as Promise<{ entries: AuditEntry[]; total: number; error?: string }>)
      .then((d) => {
        if (d.error) setError(d.error);
        else { setEntries(d.entries ?? []); setTotal(d.total ?? 0); }
      })
      .catch(() => setError("Could not load audit log."))
      .finally(() => setLoading(false));
  }, []);

  // Load action types for the filter dropdown
  useEffect(() => {
    fetch(`${config.apiBase}/audit/actions`, { credentials: "include" })
      .then((r) => r.json() as Promise<{ actions: string[] }>)
      .then((d) => setActions(d.actions ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { load(0, filter); setOffset(0); }, [filter, load]);

  function handlePage(dir: "prev" | "next") {
    const newOff = dir === "next" ? offset + LIMIT : Math.max(0, offset - LIMIT);
    setOffset(newOff);
    load(newOff, filter);
  }

  const isAdmin = user.role === "admin" || user.role === "super_admin";
  if (!isAdmin) {
    return <div style={styles.deny}>Access denied. Admin role required.</div>;
  }

  return (
    <div>
      <h1 style={styles.heading}>Audit Log</h1>
      <p style={styles.sub}>
        Append-only record of all access and activity events.
        Required for HIPAA §164.312(b) audit controls.
      </p>

      <div style={styles.toolbar}>
        <select
          style={styles.select}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <span style={styles.count}>{total.toLocaleString()} event{total !== 1 ? "s" : ""}</span>
      </div>

      <div style={styles.section}>
        {loading ? (
          <div style={styles.empty}>Loading…</div>
        ) : error ? (
          <div style={styles.error}>{error}</div>
        ) : entries.length === 0 ? (
          <div style={styles.empty}>No audit events yet. Activity will appear here after users log in and interact with the platform.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["Time", "User", "Action", "Resource", "IP"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={styles.mono}>
                      {new Date(e.occurredAt).toLocaleString()}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.email}>{e.userEmail ?? "—"}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.actionChip,
                      background: `${ACTION_COLORS[e.action] ?? "#64748b"}18`,
                      color:       ACTION_COLORS[e.action] ?? "#64748b",
                    }}>
                      {e.action}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.resource}>{e.resource}</span>
                    {e.resourceId && (
                      <span style={styles.resourceId}> {e.resourceId.slice(0, 8)}…</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.mono}>{e.ipAddress ?? "—"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div style={styles.pagination}>
            <button style={styles.pageBtn} onClick={() => handlePage("prev")} disabled={offset === 0}>
              ← Prev
            </button>
            <span style={styles.pageInfo}>
              {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
            </span>
            <button style={styles.pageBtn} onClick={() => handlePage("next")} disabled={offset + LIMIT >= total}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading:    { fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 4 },
  sub:        { fontSize: 13, color: "#64748b", marginBottom: 20 },
  toolbar:    { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  select:     { border: "1px solid rgba(0,0,0,0.12)", borderRadius: 7, padding: "7px 12px", fontSize: 13, color: "#0f172a", outline: "none", background: "#fff" },
  count:      { fontSize: 13, color: "#94a3b8", marginLeft: "auto" },
  section:    { background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: 0, overflowX: "auto" },
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", padding: "16px 14px 12px" },
  tr:         { borderBottom: "1px solid rgba(0,0,0,0.05)" },
  td:         { padding: "11px 14px", verticalAlign: "middle" },
  mono:       { fontSize: 12, fontFamily: "monospace", color: "#64748b" },
  email:      { fontSize: 13, color: "#0f172a" },
  resource:   { fontSize: 12, color: "#64748b" },
  resourceId: { fontSize: 11, color: "#94a3b8", fontFamily: "monospace" },
  actionChip: { fontSize: 11, fontWeight: 700, borderRadius: 4, padding: "2px 7px" },
  empty:      { color: "#94a3b8", fontSize: 13, padding: "32px 24px", textAlign: "center" },
  error:      { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#dc2626", fontSize: 13, padding: "12px 16px", margin: 16 },
  deny:       { color: "#ef4444", padding: 32, fontSize: 14 },
  pagination: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderTop: "1px solid rgba(0,0,0,0.05)" },
  pageBtn:    { background: "#fff", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer", color: "#334155" },
  pageInfo:   { fontSize: 13, color: "#94a3b8" },
};
