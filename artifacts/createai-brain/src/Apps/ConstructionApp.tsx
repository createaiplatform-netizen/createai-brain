import { useState, useEffect, useCallback } from "react";

type Project = { id: number; name: string; address: string; type: string; status: string; budget: number; spent: number; manager: string; start_date: string; end_date: string };
type Stats   = { projects: Record<string,number>; pendingBids: number; activeContracts: number; pendingInspections: number; openPunchItems: number };

const statusColor = (s: string) => ({ planning: "#64748b", bidding: "#6366f1", active: "#22c55e", on_hold: "#f59e0b", completed: "#94a3b8", cancelled: "#ef4444" }[s] ?? "#94a3b8");

export default function ConstructionApp() {
  const [tab, setTab]     = useState<"projects"|"bids"|"inspections">("projects");
  const [projects, setP]  = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [form, setForm]   = useState({ name: "", address: "", city: "", type: "commercial", owner_name: "", budget: "", manager: "" });
  const [msg, setMsg]     = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        fetch("/api/construction/projects",   { credentials: "include" }).then(r => r.json()),
        fetch("/api/construction/stats",      { credentials: "include" }).then(r => r.json()),
      ]);
      setP(p.projects ?? []);
      setStats(s);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { notify("Project name required"); return; }
    const r = await fetch("/api/construction/projects", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, budget: form.budget ? parseFloat(form.budget) : undefined }) });
    if (r.ok) { notify("✓ Project created"); setForm({ name: "", address: "", city: "", type: "commercial", owner_name: "", budget: "", manager: "" }); load(); }
    else { notify("Error creating project"); }
  };

  const deleteProject = async (id: number) => {
    await fetch(`/api/construction/projects/${id}`, { method: "DELETE", credentials: "include" });
    notify("Project removed"); load();
  };

  const budgetUsed = (p: Project) => p.budget ? Math.round(Number(p.spent ?? 0) / Number(p.budget) * 100) : null;

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f1f5f9", fontFamily: "Inter,sans-serif", padding: "24px" }}>
      <a href="#main" style={{ position: "absolute", left: -9999 }}>Skip to content</a>
      <div aria-live="polite" style={{ position: "fixed", top: 16, right: 16, background: msg ? "#6366f1" : "transparent", color: "#fff", padding: msg ? "10px 18px" : 0, borderRadius: 8, fontSize: 14, zIndex: 999, transition: "all .2s" }}>{msg}</div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏗️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Construction Management Engine</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Projects · Bids · Contracts · Inspections · Punch List</p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Active Projects", value: stats.projects?.active ?? 0 },
              { label: "In Bidding", value: stats.projects?.bidding ?? 0 },
              { label: "Pending Bids", value: stats.pendingBids },
              { label: "Pending Inspections", value: stats.pendingInspections, warn: (stats.pendingInspections ?? 0) > 0 },
              { label: "Open Punch Items", value: stats.openPunchItems, warn: (stats.openPunchItems ?? 0) > 0 },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: `1px solid ${(s as {warn?:boolean}).warn ? "#f59e0b44" : "#1e293b"}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: (s as {warn?:boolean}).warn ? "#f59e0b" : "#6366f1" }}>{s.value ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["projects","bids","inspections"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? "#6366f1" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <main id="main">
          {tab === "projects" && (
            <>
              <form onSubmit={addProject} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["name","Project Name *"], ["address","Address"], ["city","City"], ["owner_name","Owner"], ["budget","Budget ($)"], ["manager","Manager"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: k === "name" ? 3 : 1, minWidth: 130 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(form as Record<string,string>)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      type={k === "budget" ? "number" : "text"}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <div style={{ flex: 1, minWidth: 130 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }}>
                    {["commercial","residential","industrial","infrastructure","renovation"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Create Project</button>
              </form>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {loading ? <div style={{ textAlign: "center", padding: 24, color: "#64748b" }}>Loading...</div>
                : projects.length === 0 ? <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>No projects yet</div>
                : projects.map(p => {
                  const pct = budgetUsed(p);
                  return (
                    <div key={p.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{p.name}</div>
                          <div style={{ fontSize: 13, color: "#94a3b8" }}>{p.address || p.city ? `${p.address || ""}${p.city ? `, ${p.city}` : ""}` : "—"} · {p.type}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ background: statusColor(p.status) + "22", color: statusColor(p.status), padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>{p.status}</span>
                          <button onClick={() => deleteProject(p.id)} style={{ background: "transparent", border: "1px solid #334155", color: "#64748b", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>×</button>
                        </div>
                      </div>
                      {p.budget && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                            <span>Budget: ${Number(p.budget).toLocaleString()}</span>
                            <span>Spent: ${Number(p.spent ?? 0).toLocaleString()} {pct != null ? `(${pct}%)` : ""}</span>
                          </div>
                          <div style={{ height: 4, background: "#334155", borderRadius: 2 }}>
                            <div style={{ height: "100%", width: `${Math.min(pct ?? 0, 100)}%`, background: (pct ?? 0) > 90 ? "#ef4444" : "#6366f1", borderRadius: 2, transition: "width .3s" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {tab === "bids" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16 }}>Bid Management System</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>POST /api/construction/bids · PUT /api/construction/bids/:id/award</div>
            </div>
          )}
          {tab === "inspections" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 16 }}>Inspection Scheduling & Results</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>POST /api/construction/inspections · PUT /api/construction/inspections/:id/result</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
