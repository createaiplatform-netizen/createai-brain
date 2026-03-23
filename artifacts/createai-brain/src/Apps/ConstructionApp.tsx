import { useState, useEffect, useCallback } from "react";

type Project    = { id: number; name: string; address: string; city?: string; type: string; status: string; budget: number; spent: number; manager: string; start_date: string; end_date: string };
type Bid        = { id: number; project_name: string; bidder: string; bidder_email: string; amount: number; status: string; valid_until: string; notes: string };
type Inspection = { id: number; project_name: string; type: string; inspector: string; agency: string; result: string; scheduled_at: string; completed_at: string };
type Stats      = { projects: Record<string,number>; pendingBids: number; activeContracts: number; pendingInspections: number; openPunchItems: number };

const statusColor = (s: string) => ({ planning: "#64748b", bidding: "#6366f1", active: "#22c55e", on_hold: "#f59e0b", completed: "#94a3b8", cancelled: "#ef4444" }[s] ?? "#94a3b8");
const bidColor    = (s: string) => ({ submitted: "#6366f1", awarded: "#22c55e", rejected: "#ef4444", withdrawn: "#64748b" }[s] ?? "#94a3b8");
const inspColor   = (s: string) => ({ passed: "#22c55e", failed: "#ef4444", conditional: "#f59e0b", pending: "#6366f1" }[s] ?? "#94a3b8");

export default function ConstructionApp() {
  const [tab, setTab]       = useState<"projects"|"bids"|"inspections">("projects");
  const [projects, setP]    = useState<Project[]>([]);
  const [bids, setBids]     = useState<Bid[]>([]);
  const [inspections, setIn] = useState<Inspection[]>([]);
  const [stats, setStats]   = useState<Stats | null>(null);
  const [projForm, setProjForm] = useState({ name: "", address: "", city: "", type: "commercial", owner_name: "", budget: "", manager: "" });
  const [bidForm, setBidForm]   = useState({ project_id: "", bidder: "", bidder_email: "", amount: "", valid_until: "", notes: "" });
  const [inpForm, setInpForm]   = useState({ project_id: "", type: "", inspector: "", agency: "", scheduled_at: "" });
  const [resultForm, setResultForm] = useState<{ id: number | null; result: string; notes: string }>({ id: null, result: "passed", notes: "" });
  const [msg, setMsg]       = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, b, i] = await Promise.all([
        fetch("/api/construction/projects",    { credentials: "include" }).then(r => r.json()),
        fetch("/api/construction/stats",       { credentials: "include" }).then(r => r.json()),
        fetch("/api/construction/bids",        { credentials: "include" }).then(r => r.json()),
        fetch("/api/construction/inspections", { credentials: "include" }).then(r => r.json()),
      ]);
      setP(p.projects ?? []);
      setStats(s);
      setBids(b.bids ?? []);
      setIn(i.inspections ?? []);
    } catch { notify("Failed to load data"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projForm.name) { notify("Project name required"); return; }
    const r = await fetch("/api/construction/projects", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...projForm, budget: projForm.budget ? parseFloat(projForm.budget) : undefined }) });
    if (r.ok) { notify("✓ Project created"); setProjForm({ name: "", address: "", city: "", type: "commercial", owner_name: "", budget: "", manager: "" }); load(); }
    else { notify("Error creating project"); }
  };

  const deleteProject = async (id: number) => {
    await fetch(`/api/construction/projects/${id}`, { method: "DELETE", credentials: "include" });
    notify("Project removed"); load();
  };

  const addBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidForm.project_id || !bidForm.bidder || !bidForm.amount) { notify("Project, bidder, and amount required"); return; }
    const r = await fetch("/api/construction/bids", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...bidForm, project_id: parseInt(bidForm.project_id), amount: parseFloat(bidForm.amount) }) });
    if (r.ok) { notify("✓ Bid submitted"); setBidForm({ project_id: "", bidder: "", bidder_email: "", amount: "", valid_until: "", notes: "" }); load(); }
    else { notify("Error submitting bid"); }
  };

  const awardBid = async (id: number) => {
    const r = await fetch(`/api/construction/bids/${id}/award`, { method: "PUT", credentials: "include" });
    if (r.ok) { notify("✓ Bid awarded"); load(); } else { notify("Error awarding bid"); }
  };

  const scheduleInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inpForm.project_id || !inpForm.type) { notify("Project and inspection type required"); return; }
    const r = await fetch("/api/construction/inspections", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...inpForm, project_id: parseInt(inpForm.project_id) }) });
    if (r.ok) { notify("✓ Inspection scheduled"); setInpForm({ project_id: "", type: "", inspector: "", agency: "", scheduled_at: "" }); load(); }
    else { notify("Error scheduling inspection"); }
  };

  const logResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultForm.id) { notify("Select an inspection"); return; }
    const r = await fetch(`/api/construction/inspections/${resultForm.id}/result`, { method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: resultForm.result, notes: resultForm.notes }) });
    if (r.ok) { notify("✓ Result logged"); setResultForm({ id: null, result: "passed", notes: "" }); load(); }
    else { notify("Error logging result"); }
  };

  const budgetUsed = (p: Project) => p.budget ? Math.round(Number(p.spent ?? 0) / Number(p.budget) * 100) : null;

  const inp = { background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14, width: "100%" } as const;

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
                {([["name","Project Name *"], ["address","Address"], ["city","City"], ["owner_name","Owner"], ["budget","Budget ($)"], ["manager","Manager"]] as [string,string][]).map(([k, lbl]) => (
                  <div key={k} style={{ flex: k === "name" ? 3 : 1, minWidth: 130 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(projForm as Record<string,string>)[k]} onChange={e => setProjForm(f => ({ ...f, [k]: e.target.value }))} type={k === "budget" ? "number" : "text"} style={inp} />
                  </div>
                ))}
                <div style={{ flex: 1, minWidth: 130 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Type</label>
                  <select value={projForm.type} onChange={e => setProjForm(f => ({ ...f, type: e.target.value }))} style={inp}>
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
            <>
              <form onSubmit={addBid} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 2, minWidth: 180 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Project *</label>
                  <select value={bidForm.project_id} onChange={e => setBidForm(f => ({ ...f, project_id: e.target.value }))} style={inp}>
                    <option value="">Select project…</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {([["bidder","Bidder *"], ["bidder_email","Email"], ["amount","Amount ($) *"], ["valid_until","Valid Until"]] as [string,string][]).map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, minWidth: 120 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(bidForm as Record<string,string>)[k]} onChange={e => setBidForm(f => ({ ...f, [k]: e.target.value }))} type={k === "amount" ? "number" : k === "valid_until" ? "date" : "text"} step={k === "amount" ? "0.01" : undefined} style={inp} />
                  </div>
                ))}
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Submit Bid</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Project","Bidder","Amount","Valid Until","Status",""].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : bids.length === 0 ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No bids yet</td></tr>
                    : bids.map(b => (
                      <tr key={b.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{b.project_name || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{b.bidder}</td>
                        <td style={{ padding: "12px 16px", color: "#22c55e", fontWeight: 600 }}>${Number(b.amount).toLocaleString()}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>{b.valid_until ? new Date(b.valid_until).toLocaleDateString() : "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: bidColor(b.status) + "22", color: bidColor(b.status), padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{b.status}</span></td>
                        <td style={{ padding: "12px 16px" }}>
                          {b.status === "submitted" && <button onClick={() => awardBid(b.id)} style={{ background: "#22c55e22", border: "1px solid #22c55e", color: "#22c55e", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Award</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "inspections" && (
            <>
              <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                <form onSubmit={scheduleInspection} style={{ flex: 1, minWidth: 320, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>Schedule Inspection</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Project *</label>
                      <select value={inpForm.project_id} onChange={e => setInpForm(f => ({ ...f, project_id: e.target.value }))} style={inp}>
                        <option value="">Select project…</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Type *</label>
                      <select value={inpForm.type} onChange={e => setInpForm(f => ({ ...f, type: e.target.value }))} style={inp}>
                        <option value="">Select type…</option>
                        {["foundation","framing","electrical","plumbing","mechanical","final","fire_safety","structural"].map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                      </select>
                    </div>
                    {([["inspector","Inspector"], ["agency","Agency"]] as [string,string][]).map(([k, lbl]) => (
                      <div key={k}>
                        <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                        <input value={(inpForm as Record<string,string>)[k]} onChange={e => setInpForm(f => ({ ...f, [k]: e.target.value }))} style={inp} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Scheduled At</label>
                      <input type="datetime-local" value={inpForm.scheduled_at} onChange={e => setInpForm(f => ({ ...f, scheduled_at: e.target.value }))} style={inp} />
                    </div>
                    <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Schedule</button>
                  </div>
                </form>
                <form onSubmit={logResult} style={{ flex: 1, minWidth: 280, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>Log Inspection Result</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Inspection *</label>
                      <select value={resultForm.id ?? ""} onChange={e => setResultForm(f => ({ ...f, id: e.target.value ? parseInt(e.target.value) : null }))} style={inp}>
                        <option value="">Select inspection…</option>
                        {inspections.filter(i => i.result === "pending").map(i => <option key={i.id} value={i.id}>{i.project_name} — {i.type}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Result *</label>
                      <select value={resultForm.result} onChange={e => setResultForm(f => ({ ...f, result: e.target.value }))} style={inp}>
                        {["passed","failed","conditional"].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Notes</label>
                      <input value={resultForm.notes} onChange={e => setResultForm(f => ({ ...f, notes: e.target.value }))} style={inp} />
                    </div>
                    <button type="submit" style={{ padding: "8px 20px", background: "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Log Result</button>
                  </div>
                </form>
              </div>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Project","Type","Inspector","Agency","Scheduled","Result"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : inspections.length === 0 ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No inspections yet</td></tr>
                    : inspections.map(i => (
                      <tr key={i.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{i.project_name || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{(i.type ?? "").replace(/_/g," ")}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{i.inspector || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>{i.agency || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>{i.scheduled_at ? new Date(i.scheduled_at).toLocaleString() : "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: inspColor(i.result) + "22", color: inspColor(i.result), padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{i.result}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
