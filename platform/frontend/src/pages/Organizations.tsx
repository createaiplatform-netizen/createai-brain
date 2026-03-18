import { useEffect, useState } from "react";
import type { AuthUser } from "../components/AuthForm";
import { config } from "../config";

interface Org {
  id:        string;
  name:      string;
  slug:      string;
  userCount: number;
  createdAt: string;
}

interface Props { user: AuthUser }

export function Organizations({ user }: Props) {
  const [orgs,    setOrgs]    = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch(`${config.apiBase}/organizations`, { credentials: "include" })
      .then((r) => r.json() as Promise<{ organizations: Org[]; error?: string }>)
      .then((d) => {
        if (d.error) setError(d.error);
        else setOrgs(d.organizations ?? []);
      })
      .catch(() => setError("Could not reach the server."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={styles.heading}>Organizations</h1>
      <p style={styles.sub}>Facilities and tenants registered on this platform.</p>

      <div style={styles.section}>
        {loading ? (
          <div style={styles.empty}>Loading…</div>
        ) : error ? (
          <div style={styles.error}>{error}</div>
        ) : orgs.length === 0 ? (
          <div style={styles.empty}>No organizations found.</div>
        ) : (
          <div style={styles.list}>
            {orgs.map((o) => (
              <div key={o.id} style={styles.row}>
                <div style={styles.orgIcon}>🏢</div>
                <div style={styles.orgInfo}>
                  <div style={styles.orgName}>{o.name}</div>
                  <div style={styles.orgMeta}>
                    {o.slug} &middot; {o.userCount} user{o.userCount !== 1 ? "s" : ""} &middot; Created {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {user.organizationId === o.id && (
                  <span style={styles.currentChip}>Current</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading:     { fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 4 },
  sub:         { fontSize: 13, color: "#64748b", marginBottom: 24 },
  section:     { background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: 24 },
  list:        { display: "flex", flexDirection: "column", gap: 2 },
  row:         { display: "flex", alignItems: "center", gap: 14, padding: "12px 8px", borderBottom: "1px solid rgba(0,0,0,0.05)" },
  orgIcon:     { fontSize: 24, flexShrink: 0 },
  orgInfo:     { flex: 1, minWidth: 0 },
  orgName:     { fontSize: 14, fontWeight: 600, color: "#0f172a" },
  orgMeta:     { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  currentChip: { fontSize: 10, fontWeight: 700, background: "#ede9fe", color: "#7c3aed", borderRadius: 4, padding: "2px 7px", textTransform: "uppercase", flexShrink: 0 },
  empty:       { color: "#94a3b8", fontSize: 14, padding: "24px 0", textAlign: "center" },
  error:       { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#dc2626", fontSize: 13, padding: "8px 12px" },
};
