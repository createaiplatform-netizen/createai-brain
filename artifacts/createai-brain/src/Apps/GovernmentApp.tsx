import { useState, useEffect, useCallback } from "react";

type Permit  = { id: number; permit_no: string; citizen_name: string; type: string; status: string; fee: number; fee_paid: boolean; submitted_at: string };
type Request = { id: number; request_no: string; citizen_name: string; service_name: string; status: string; priority: string; submitted_at: string };
type Stats   = { registeredCitizens: number; permits: Record<string,number>; openServiceRequests: number; activeForms: number; nonCompliantEntities: number };

const statusColor = (s: string) => ({
  submitted: "#6366f1", under_review: "#f59e0b", approved: "#22c55e", rejected: "#ef4444",
  received: "#6366f1", in_progress: "#f59e0b", resolved: "#22c55e", closed: "#64748b"
}[s] ?? "#94a3b8");

export default function GovernmentApp() {
  const [tab, setTab]     = useState<"permits"|"services"|"citizens">("permits");
  const [permits, setP]   = useState<Permit[]>([]);
  const [requests, setR]  = useState<Request[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [permForm, setPF] = useState({ type: "", description: "", address: "", fee: "" });
  const [citForm, setCF]  = useState({ first_name: "", last_name: "", email: "", phone: "", gov_id: "" });
  const [msg, setMsg]     = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, r, s] = await Promise.all([
        fetch("/api/government/permits",          { credentials: "include" }).then(r => r.json()),
        fetch("/api/government/service-requests", { credentials: "include" }).then(r => r.json()),
        fetch("/api/government/stats",            { credentials: "include" }).then(r => r.json()),
      ]);
      setP(p.permits ?? []);
      setR(r.requests ?? []);
      setStats(s);
    } catch { notify("Failed to load data"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitPermit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permForm.type) { notify("Permit type required"); return; }
    const r = await fetch("/api/government/permits", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...permForm, fee: permForm.fee ? parseFloat(permForm.fee) : undefined }) });
    if (r.ok) { notify("✓ Permit application submitted"); setPF({ type: "", description: "", address: "", fee: "" }); load(); }
    else { notify("Error submitting permit"); }
  };

  const approvePermit = async (id: number) => {
    const r = await fetch(`/api/government/permits/${id}/approve`, { method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (r.ok) { notify("✓ Permit approved"); load(); } else { notify("Error approving permit"); }
  };

  const rejectPermit = async (id: number) => {
    const r = await fetch(`/api/government/permits/${id}/reject`, { method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: "Does not meet requirements" }) });
    if (r.ok) { notify("Permit rejected"); load(); } else { notify("Error rejecting permit"); }
  };

  const addCitizen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citForm.first_name || !citForm.last_name) { notify("First and last name required"); return; }
    const r = await fetch("/api/government/citizens", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(citForm) });
    if (r.ok) { notify("✓ Citizen registered"); setCF({ first_name: "", last_name: "", email: "", phone: "", gov_id: "" }); load(); }
    else { notify("Error registering citizen"); }
  };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f1f5f9", fontFamily: "Inter,sans-serif", padding: "24px" }}>
      <a href="#main" style={{ position: "absolute", left: -9999 }}>Skip to content</a>
      <div aria-live="polite" style={{ position: "fixed", top: 16, right: 16, background: msg ? "#6366f1" : "transparent", color: "#fff", padding: msg ? "10px 18px" : 0, borderRadius: 8, fontSize: 14, zIndex: 999, transition: "all .2s" }}>{msg}</div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏛️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Government Services Engine</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Permits · Citizens · Services · Forms · Compliance</p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Registered Citizens", value: stats.registeredCitizens },
              { label: "Submitted Permits", value: stats.permits?.submitted ?? 0 },
              { label: "Approved Permits", value: stats.permits?.approved ?? 0, green: true },
              { label: "Open Service Reqs", value: stats.openServiceRequests, warn: (stats.openServiceRequests ?? 0) > 0 },
              { label: "Non-Compliant", value: stats.nonCompliantEntities, warn: (stats.nonCompliantEntities ?? 0) > 0 },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: `1px solid ${(s as {warn?:boolean}).warn ? "#f59e0b44" : "#1e293b"}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: (s as {green?:boolean,warn?:boolean}).green ? "#22c55e" : (s as {warn?:boolean}).warn ? "#f59e0b" : "#6366f1" }}>{s.value ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["permits","services","citizens"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? "#6366f1" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <main id="main">
          {tab === "permits" && (
            <>
              <form onSubmit={submitPermit} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["type","Permit Type *"], ["description","Description"], ["address","Property Address"], ["fee","Application Fee ($)"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: k === "description" ? 3 : 1, minWidth: 140 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(permForm as Record<string,string>)[k]} onChange={e => setPF(f => ({ ...f, [k]: e.target.value }))}
                      type={k === "fee" ? "number" : "text"}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Submit Permit</button>
              </form>

              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Permit #","Type","Citizen","Fee","Status","Submitted","Actions"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : permits.length === 0 ? <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No permit applications yet</td></tr>
                    : permits.map(p => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12 }}>{p.permit_no}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{p.type}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{p.citizen_name || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#6366f1" }}>{p.fee != null ? `$${Number(p.fee).toFixed(2)}` : "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: statusColor(p.status) + "22", color: statusColor(p.status), padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>{p.status}</span></td>
                        <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>{new Date(p.submitted_at).toLocaleDateString()}</td>
                        <td style={{ padding: "12px 16px", display: "flex", gap: 6 }}>
                          {p.status === "submitted" && <>
                            <button onClick={() => approvePermit(p.id)} style={{ background: "#22c55e22", border: "1px solid #22c55e", color: "#22c55e", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Approve</button>
                            <button onClick={() => rejectPermit(p.id)} style={{ background: "#ef444422", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Reject</button>
                          </>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "services" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e293b", fontWeight: 600 }}>Open Service Requests</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Request #","Service","Citizen","Priority","Status","Submitted"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {requests.length === 0 ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No service requests yet</td></tr>
                  : requests.map(r => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #0f172a" }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12 }}>{r.request_no}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{r.service_name || "—"}</td>
                      <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{r.citizen_name || "—"}</td>
                      <td style={{ padding: "12px 16px" }}><span style={{ background: r.priority === "high" ? "#ef444422" : "#f59e0b22", color: r.priority === "high" ? "#ef4444" : "#f59e0b", padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>{r.priority}</span></td>
                      <td style={{ padding: "12px 16px" }}><span style={{ background: statusColor(r.status) + "22", color: statusColor(r.status), padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>{r.status}</span></td>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>{new Date(r.submitted_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "citizens" && (
            <form onSubmit={addCitizen} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Register New Citizen</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[["first_name","First Name *"], ["last_name","Last Name *"], ["email","Email"], ["phone","Phone"], ["gov_id","Government ID"]].map(([k, lbl]) => (
                  <div key={k}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(citForm as Record<string,string>)[k]} onChange={e => setCF(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <button type="submit" style={{ marginTop: 16, padding: "10px 24px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Register Citizen</button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
