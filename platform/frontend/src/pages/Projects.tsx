import { useEffect, useState } from "react";
import type { AuthUser } from "../components/AuthForm";
import { config } from "../config";

interface Project {
  id:        string;
  name:      string;
  type:      string;
  status:    string;
  createdAt: string;
}

interface Props { user: AuthUser }

export function Projects({ user }: Props) {
  const [projects,    setProjects]    = useState<Project[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [newName,     setNewName]     = useState("");
  const [creating,    setCreating]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    fetch(`${config.apiBase}/projects`, { credentials: "include" })
      .then((r) => r.json() as Promise<{ projects: Project[] }>)
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res  = await fetch(`${config.apiBase}/projects`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ name: newName.trim(), type: "general" }),
      });
      const data = await res.json() as { project?: Project; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to create project."); return; }
      if (data.project) {
        setProjects((p) => [data.project!, ...p]);
        setNewName("");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setCreating(false);
    }
  }

  const typeColors: Record<string, string> = {
    care_plan:   "#10b981", compliance: "#6366f1",
    operational: "#f59e0b", training:   "#0ea5e9",
    general:     "#64748b",
  };

  return (
    <div>
      <h1 style={styles.heading}>Projects</h1>
      <p style={styles.sub}>Signed in as <strong>{user.email}</strong></p>

      <div style={styles.section}>
        <form onSubmit={createProject} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="New project name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button style={styles.btn} type="submit" disabled={creating || !newName.trim()}>
            {creating ? "Creating…" : "+ Add Project"}
          </button>
        </form>
        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.empty}>Loading…</div>
        ) : projects.length === 0 ? (
          <div style={styles.empty}>No projects yet. Create your first one above.</div>
        ) : (
          <div style={styles.grid}>
            {projects.map((p) => {
              const color = typeColors[p.type] ?? "#94a3b8";
              return (
                <div key={p.id} style={styles.card}>
                  <div style={{ ...styles.accent, background: color }} />
                  <div style={styles.cardBody}>
                    <div style={styles.cardType}>{p.type.replace("_", " ")}</div>
                    <div style={styles.cardName}>{p.name}</div>
                    <div style={styles.cardMeta}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 4 },
  sub:     { fontSize: 13, color: "#64748b", marginBottom: 24 },
  section: { background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: 24 },
  form:    { display: "flex", gap: 10, marginBottom: 20 },
  input:   { flex: 1, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 7, padding: "8px 12px", fontSize: 14, outline: "none", color: "#0f172a" },
  btn:     { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  error:   { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#dc2626", fontSize: 13, padding: "8px 12px", marginBottom: 16 },
  grid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 },
  card:    { border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10, overflow: "hidden", background: "#ffffff" },
  accent:  { height: 4, width: "100%" },
  cardBody:{ padding: "14px 16px" },
  cardType:{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#94a3b8", marginBottom: 4 },
  cardName:{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 6 },
  cardMeta:{ fontSize: 12, color: "#94a3b8" },
  empty:   { color: "#94a3b8", fontSize: 14, padding: "24px 0", textAlign: "center" },
};
