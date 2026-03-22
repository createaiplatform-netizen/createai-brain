import { useState, useEffect, useCallback } from "react";

type Job     = { id: number; job_no: string; customer_name: string; service_type_name: string; technician_name: string; address: string; status: string; priority: string; scheduled_at: string; price: number };
type Tech    = { id: number; name: string; phone: string; status: string; rating: number; jobs_completed: number };
type Stats   = { jobs: Record<string,number>; activeTechnicians: number; revenueLast30d: number; avgRating: number; unpaidInvoices: number };

const statusColor = (s: string) => ({ scheduled: "#6366f1", in_progress: "#f59e0b", completed: "#22c55e", cancelled: "#ef4444" }[s] ?? "#94a3b8");
const priorityColor = (p: string) => ({ low: "#64748b", normal: "#6366f1", high: "#f59e0b", urgent: "#ef4444" }[p] ?? "#94a3b8");

export default function HomeServicesApp() {
  const [tab, setTab]     = useState<"jobs"|"technicians"|"invoices">("jobs");
  const [jobs, setJobs]   = useState<Job[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobForm, setJF]  = useState({ customer_id: "", service_type_id: "", technician_id: "", address: "", description: "", priority: "normal", price: "" });
  const [techForm, setTF] = useState({ name: "", phone: "", license_no: "" });
  const [msg, setMsg]     = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [j, t, s] = await Promise.all([
        fetch("/api/home-services/jobs",        { credentials: "include" }).then(r => r.json()),
        fetch("/api/home-services/technicians", { credentials: "include" }).then(r => r.json()),
        fetch("/api/home-services/stats",       { credentials: "include" }).then(r => r.json()),
      ]);
      setJobs(j.jobs ?? []);
      setTechs(t.technicians ?? []);
      setStats(s);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.customer_id || !jobForm.service_type_id) { notify("Customer ID and service type ID required"); return; }
    const r = await fetch("/api/home-services/jobs", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...jobForm, customer_id: parseInt(jobForm.customer_id), service_type_id: parseInt(jobForm.service_type_id), technician_id: jobForm.technician_id ? parseInt(jobForm.technician_id) : undefined, price: jobForm.price ? parseFloat(jobForm.price) : undefined }) });
    if (r.ok) { notify("✓ Job scheduled"); setJF({ customer_id: "", service_type_id: "", technician_id: "", address: "", description: "", priority: "normal", price: "" }); load(); }
    else { notify("Error scheduling job"); }
  };

  const startJob = async (id: number) => {
    const r = await fetch(`/api/home-services/jobs/${id}/start`, { method: "POST", credentials: "include" });
    if (r.ok) { notify("Job started"); load(); } else { notify("Cannot start job"); }
  };
  const completeJob = async (id: number) => {
    const r = await fetch(`/api/home-services/jobs/${id}/complete`, { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ duration_min: 60 }) });
    if (r.ok) { const d = await r.json(); notify(`✓ Job complete — Invoice ${d.invoice_no ?? ""} created`); load(); }
    else { notify("Cannot complete job"); }
  };

  const addTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!techForm.name) { notify("Name required"); return; }
    const r = await fetch("/api/home-services/technicians", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(techForm) });
    if (r.ok) { notify("✓ Technician added"); setTF({ name: "", phone: "", license_no: "" }); load(); }
    else { notify("Error adding technician"); }
  };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f1f5f9", fontFamily: "Inter,sans-serif", padding: "24px" }}>
      <a href="#main" style={{ position: "absolute", left: -9999 }}>Skip to content</a>
      <div aria-live="polite" style={{ position: "fixed", top: 16, right: 16, background: msg ? "#6366f1" : "transparent", color: "#fff", padding: msg ? "10px 18px" : 0, borderRadius: 8, fontSize: 14, zIndex: 999, transition: "all .2s" }}>{msg}</div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔧</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Home Services Engine</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Jobs · Technicians · Customers · Invoices · Reviews</p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Scheduled Jobs", value: stats.jobs?.scheduled ?? 0 },
              { label: "In Progress", value: stats.jobs?.in_progress ?? 0 },
              { label: "Active Technicians", value: stats.activeTechnicians },
              { label: "Revenue Last 30d", value: stats.revenueLast30d != null ? `$${Number(stats.revenueLast30d).toFixed(2)}` : "—", green: true },
              { label: "Avg Rating", value: stats.avgRating != null ? `★ ${Number(stats.avgRating).toFixed(1)}` : "—" },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: (s as {green?:boolean}).green ? "#22c55e" : "#6366f1" }}>{s.value ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["jobs","technicians","invoices"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? "#6366f1" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <main id="main">
          {tab === "jobs" && (
            <>
              <form onSubmit={createJob} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["customer_id","Customer ID *"], ["service_type_id","Service Type ID *"], ["technician_id","Technician ID"], ["address","Address"], ["price","Price ($)"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: k === "address" ? 2 : 1, minWidth: 120 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(jobForm as Record<string,string>)[k]} onChange={e => setJF(f => ({ ...f, [k]: e.target.value }))}
                      type={["customer_id","service_type_id","technician_id","price"].includes(k) ? "number" : "text"}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Priority</label>
                  <select value={jobForm.priority} onChange={e => setJF(f => ({ ...f, priority: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }}>
                    {["low","normal","high","urgent"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Schedule Job</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Job #","Customer","Service","Technician","Priority","Price","Status","Actions"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : jobs.length === 0 ? <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No jobs yet</td></tr>
                    : jobs.map(j => (
                      <tr key={j.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11 }}>{j.job_no}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{j.customer_name || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{j.service_type_name || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{j.technician_name || "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: priorityColor(j.priority) + "22", color: priorityColor(j.priority), padding: "3px 8px", borderRadius: 20, fontSize: 11 }}>{j.priority}</span></td>
                        <td style={{ padding: "12px 16px", color: "#22c55e" }}>{j.price != null ? `$${Number(j.price).toFixed(2)}` : "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: statusColor(j.status) + "22", color: statusColor(j.status), padding: "3px 8px", borderRadius: 20, fontSize: 11 }}>{j.status}</span></td>
                        <td style={{ padding: "12px 16px", display: "flex", gap: 6 }}>
                          {j.status === "scheduled" && <button onClick={() => startJob(j.id)} style={{ background: "#f59e0b22", border: "1px solid #f59e0b", color: "#f59e0b", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>Start</button>}
                          {j.status === "in_progress" && <button onClick={() => completeJob(j.id)} style={{ background: "#22c55e22", border: "1px solid #22c55e", color: "#22c55e", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>Complete</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === "technicians" && (
            <>
              <form onSubmit={addTech} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["name","Name *"], ["phone","Phone"], ["license_no","License No"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(techForm as Record<string,string>)[k]} onChange={e => setTF(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Add Technician</button>
              </form>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {techs.length === 0 ? <div style={{ gridColumn: "1/-1", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>No technicians yet</div>
                : techs.map(t => (
                  <div key={t.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>{t.phone || "—"}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ background: t.status==="active" ? "#22c55e22" : "#ef444422", color: t.status==="active" ? "#22c55e" : "#ef4444", padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{t.status}</span>
                      <span style={{ fontSize: 13, color: "#f59e0b" }}>★ {t.rating} · {t.jobs_completed} jobs</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "invoices" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
              <div style={{ fontSize: 16 }}>Invoice Management</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>GET /api/home-services/invoices · PUT /api/home-services/invoices/:id/pay</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
