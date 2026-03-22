import { useState, useEffect, useCallback } from "react";

type Donor   = { id: number; name: string; email: string; type: string; tier: string; total_given: number; last_gift: string; status: string };
type Grant   = { id: number; funder: string; title: string; amount: number; status: string; applied_at: string; report_due: string };
type Stats   = { activeDonors: number; donationsLast30d: number; grants: Record<string,number>; activeVolunteers: number; activePrograms: number };

const tierColor  = (t: string) => ({ standard: "#64748b", silver: "#94a3b8", gold: "#f59e0b", platinum: "#6366f1", diamond: "#22c55e" }[t] ?? "#64748b");
const grantColor = (s: string) => ({ applied: "#6366f1", reviewed: "#f59e0b", awarded: "#22c55e", rejected: "#ef4444", closed: "#64748b" }[s] ?? "#94a3b8");

export default function NonprofitApp() {
  const [tab, setTab]     = useState<"donors"|"grants"|"volunteers">("donors");
  const [donors, setD]    = useState<Donor[]>([]);
  const [grants, setG]    = useState<Grant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dForm, setDF]    = useState({ name: "", email: "", phone: "", type: "individual" });
  const [donForm, setDon] = useState({ donor_id: "", amount: "", method: "check", campaign: "" });
  const [gForm, setGF]    = useState({ funder: "", title: "", amount: "", applied_at: "" });
  const [msg, setMsg]     = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, g, s] = await Promise.all([
        fetch("/api/nonprofit/donors",  { credentials: "include" }).then(r => r.json()),
        fetch("/api/nonprofit/grants",  { credentials: "include" }).then(r => r.json()),
        fetch("/api/nonprofit/stats",   { credentials: "include" }).then(r => r.json()),
      ]);
      setD(d.donors ?? []);
      setG(g.grants ?? []);
      setStats(s);
    } catch { notify("Failed to load data"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dForm.name) { notify("Name required"); return; }
    const r = await fetch("/api/nonprofit/donors", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(dForm) });
    if (r.ok) { notify("✓ Donor added"); setDF({ name: "", email: "", phone: "", type: "individual" }); load(); }
    else { notify("Error adding donor"); }
  };

  const recordDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donForm.amount) { notify("Amount required"); return; }
    const r = await fetch("/api/nonprofit/donations", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...donForm, donor_id: donForm.donor_id ? parseInt(donForm.donor_id) : undefined, amount: parseFloat(donForm.amount) }) });
    if (r.ok) { notify("✓ Donation recorded"); setDon({ donor_id: "", amount: "", method: "check", campaign: "" }); load(); }
    else { notify("Error recording donation"); }
  };

  const addGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gForm.funder || !gForm.title) { notify("Funder and title required"); return; }
    const r = await fetch("/api/nonprofit/grants", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...gForm, amount: gForm.amount ? parseFloat(gForm.amount) : undefined }) });
    if (r.ok) { notify("✓ Grant application added"); setGF({ funder: "", title: "", amount: "", applied_at: "" }); load(); }
    else { notify("Error adding grant"); }
  };

  const deleteDonor = async (id: number) => {
    await fetch(`/api/nonprofit/donors/${id}`, { method: "DELETE", credentials: "include" });
    notify("Donor removed"); load();
  };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f1f5f9", fontFamily: "Inter,sans-serif", padding: "24px" }}>
      <a href="#main" style={{ position: "absolute", left: -9999 }}>Skip to content</a>
      <div aria-live="polite" style={{ position: "fixed", top: 16, right: 16, background: msg ? "#6366f1" : "transparent", color: "#fff", padding: msg ? "10px 18px" : 0, borderRadius: 8, fontSize: 14, zIndex: 999, transition: "all .2s" }}>{msg}</div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💚</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Nonprofit Management Engine</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Donors · Donations · Grants · Volunteers · Programs</p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Active Donors", value: stats.activeDonors },
              { label: "Raised Last 30d", value: stats.donationsLast30d != null ? `$${Number(stats.donationsLast30d).toFixed(2)}` : "—", green: true },
              { label: "Grants Awarded", value: stats.grants?.awarded ?? 0 },
              { label: "Active Volunteers", value: stats.activeVolunteers },
              { label: "Active Programs", value: stats.activePrograms },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: (s as {green?:boolean}).green ? "#22c55e" : "#6366f1" }}>{s.value ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["donors","grants","volunteers"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? "#6366f1" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <main id="main">
          {tab === "donors" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <form onSubmit={addDonor} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>Add Donor</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[["name","Name *"], ["email","Email"], ["phone","Phone"]].map(([k, lbl]) => (
                      <div key={k}>
                        <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                        <input value={(dForm as Record<string,string>)[k]} onChange={e => setDF(f => ({ ...f, [k]: e.target.value }))}
                          style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14, boxSizing: "border-box" }} />
                      </div>
                    ))}
                    <button type="submit" style={{ padding: "8px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Add Donor</button>
                  </div>
                </form>
                <form onSubmit={recordDonation} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>Record Donation</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[["donor_id","Donor ID"], ["amount","Amount *"], ["campaign","Campaign"]].map(([k, lbl]) => (
                      <div key={k}>
                        <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                        <input type={k === "amount" || k === "donor_id" ? "number" : "text"} value={(donForm as Record<string,string>)[k]} onChange={e => setDon(f => ({ ...f, [k]: e.target.value }))}
                          style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14, boxSizing: "border-box" }} />
                      </div>
                    ))}
                    <button type="submit" style={{ padding: "8px", background: "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Record Donation</button>
                  </div>
                </form>
              </div>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Name","Email","Type","Tier","Total Given","Last Gift",""].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : donors.length === 0 ? <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No donors yet</td></tr>
                    : donors.map(d => (
                      <tr key={d.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{d.name}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{d.email || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{d.type}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: tierColor(d.tier) + "22", color: tierColor(d.tier), padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{d.tier}</span></td>
                        <td style={{ padding: "12px 16px", color: "#22c55e", fontWeight: 600 }}>${Number(d.total_given ?? 0).toFixed(2)}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{d.last_gift ? new Date(d.last_gift).toLocaleDateString() : "—"}</td>
                        <td style={{ padding: "12px 16px" }}><button onClick={() => deleteDonor(d.id)} style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === "grants" && (
            <>
              <form onSubmit={addGrant} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["funder","Funder *"], ["title","Title *"], ["amount","Amount"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: k === "title" ? 3 : 1, minWidth: 160 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input type={k === "amount" ? "number" : "text"} value={(gForm as Record<string,string>)[k]} onChange={e => setGF(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Add Grant</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Funder","Title","Amount","Applied","Report Due","Status"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {grants.length === 0 ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No grant applications yet</td></tr>
                    : grants.map(g => (
                      <tr key={g.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{g.funder}</td>
                        <td style={{ padding: "12px 16px" }}>{g.title}</td>
                        <td style={{ padding: "12px 16px", color: "#22c55e", fontWeight: 600 }}>{g.amount != null ? `$${Number(g.amount).toLocaleString()}` : "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{g.applied_at ? new Date(g.applied_at).toLocaleDateString() : "—"}</td>
                        <td style={{ padding: "12px 16px", color: g.report_due ? "#f59e0b" : "#94a3b8" }}>{g.report_due ? new Date(g.report_due).toLocaleDateString() : "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: grantColor(g.status) + "22", color: grantColor(g.status), padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{g.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === "volunteers" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
              <div style={{ fontSize: 16 }}>Volunteer Management System</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>POST /api/nonprofit/volunteers · POST /api/nonprofit/volunteers/:id/log-hours</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
