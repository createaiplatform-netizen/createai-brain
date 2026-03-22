import { useState, useEffect, useCallback } from "react";

type Policy = { id: number; policy_no: string; client_name: string; type: string; premium: number; frequency: string; coverage_amt: number; status: string; start_date: string; end_date: string; agent_name: string };
type Claim  = { id: number; claim_no: string; client_name: string; policy_no: string; type: string; description: string; amount_claimed: number; amount_settled: number; status: string; filed_at: string };
type Stats  = { activeClients: number; activePolicies: number; openClaims: number; premiumLast30d: number; policies: Record<string,number> };

const policyStatusColor = (s: string) => ({ active: "#22c55e", inactive: "#64748b", expired: "#ef4444", cancelled: "#ef4444", pending: "#f59e0b" }[s] ?? "#94a3b8");
const claimStatusColor  = (s: string) => ({ submitted: "#6366f1", under_review: "#f59e0b", approved: "#22c55e", settled: "#22c55e", rejected: "#ef4444", closed: "#64748b" }[s] ?? "#94a3b8");

export default function InsuranceApp() {
  const [tab, setTab]     = useState<"policies"|"claims"|"clients">("policies");
  const [policies, setPol] = useState<Policy[]>([]);
  const [claims, setCl]   = useState<Claim[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [polForm, setPF]  = useState({ client_id: "", type: "auto", premium: "", frequency: "monthly", coverage_amt: "", deductible: "" });
  const [claimForm, setCF] = useState({ policy_id: "", description: "", amount_claimed: "", type: "", incident_date: "" });
  const [msg, setMsg]     = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, s] = await Promise.all([
        fetch("/api/insurance/policies", { credentials: "include" }).then(r => r.json()),
        fetch("/api/insurance/claims",   { credentials: "include" }).then(r => r.json()),
        fetch("/api/insurance/stats",    { credentials: "include" }).then(r => r.json()),
      ]);
      setPol(p.policies ?? []);
      setCl(c.claims   ?? []);
      setStats(s);
    } catch { notify("Failed to load data"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!polForm.client_id || !polForm.type || !polForm.premium) { notify("Client ID, type, and premium required"); return; }
    const r = await fetch("/api/insurance/policies", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...polForm, client_id: parseInt(polForm.client_id), premium: parseFloat(polForm.premium), coverage_amt: polForm.coverage_amt ? parseFloat(polForm.coverage_amt) : undefined, deductible: polForm.deductible ? parseFloat(polForm.deductible) : undefined }) });
    if (r.ok) { notify("✓ Policy created"); setPF({ client_id: "", type: "auto", premium: "", frequency: "monthly", coverage_amt: "", deductible: "" }); load(); }
    else { notify("Error creating policy"); }
  };

  const fileClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimForm.policy_id || !claimForm.description) { notify("Policy ID and description required"); return; }
    const r = await fetch("/api/insurance/claims", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...claimForm, policy_id: parseInt(claimForm.policy_id), amount_claimed: claimForm.amount_claimed ? parseFloat(claimForm.amount_claimed) : undefined }) });
    if (r.ok) { notify("✓ Claim filed"); setCF({ policy_id: "", description: "", amount_claimed: "", type: "", incident_date: "" }); load(); }
    else { notify("Error filing claim"); }
  };

  const settleClaim = async (id: number) => {
    const r = await fetch(`/api/insurance/claims/${id}`, { method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "settled", amount_settled: 0 }) });
    if (r.ok) { notify("Claim settled"); load(); } else { notify("Error settling claim"); }
  };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f1f5f9", fontFamily: "Inter,sans-serif", padding: "24px" }}>
      <a href="#main" style={{ position: "absolute", left: -9999 }}>Skip to content</a>
      <div aria-live="polite" style={{ position: "fixed", top: 16, right: 16, background: msg ? "#6366f1" : "transparent", color: "#fff", padding: msg ? "10px 18px" : 0, borderRadius: 8, fontSize: 14, zIndex: 999, transition: "all .2s" }}>{msg}</div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛡️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Insurance Management Engine</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Policies · Claims · Clients · Agents · Underwriting</p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Active Clients", value: stats.activeClients },
              { label: "Active Policies", value: stats.activePolicies, green: true },
              { label: "Open Claims", value: stats.openClaims, warn: (stats.openClaims ?? 0) > 0 },
              { label: "Premium Last 30d", value: stats.premiumLast30d != null ? `$${Number(stats.premiumLast30d).toFixed(2)}` : "—" },
              { label: "Pending Policies", value: stats.policies?.pending ?? 0 },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: `1px solid ${(s as {warn?:boolean}).warn ? "#f59e0b44" : "#1e293b"}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: (s as {green?:boolean}).green ? "#22c55e" : (s as {warn?:boolean}).warn ? "#f59e0b" : "#6366f1" }}>{s.value ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["policies","claims","clients"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? "#6366f1" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <main id="main">
          {tab === "policies" && (
            <>
              <form onSubmit={createPolicy} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["client_id","Client ID *"], ["premium","Premium ($) *"], ["coverage_amt","Coverage ($)"], ["deductible","Deductible ($)"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, minWidth: 130 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input type="number" value={(polForm as Record<string,string>)[k]} onChange={e => setPF(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Type</label>
                  <select value={polForm.type} onChange={e => setPF(f => ({ ...f, type: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }}>
                    {["auto","home","life","health","commercial","liability","property"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Frequency</label>
                  <select value={polForm.frequency} onChange={e => setPF(f => ({ ...f, frequency: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }}>
                    {["monthly","quarterly","semi_annual","annual"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Create Policy</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Policy #","Client","Type","Premium","Frequency","Coverage","Status","Agent"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : policies.length === 0 ? <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No policies yet</td></tr>
                    : policies.map(p => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11 }}>{p.policy_no}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{p.client_name || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{p.type}</td>
                        <td style={{ padding: "12px 16px", color: "#6366f1", fontWeight: 600 }}>${Number(p.premium).toFixed(2)}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{p.frequency}</td>
                        <td style={{ padding: "12px 16px" }}>{p.coverage_amt != null ? `$${Number(p.coverage_amt).toLocaleString()}` : "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: policyStatusColor(p.status) + "22", color: policyStatusColor(p.status), padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>{p.status}</span></td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{p.agent_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "claims" && (
            <>
              <form onSubmit={fileClaim} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["policy_id","Policy ID *"], ["type","Claim Type"], ["amount_claimed","Amount Claimed ($)"], ["incident_date","Incident Date"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, minWidth: 140 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input type={k === "policy_id" || k === "amount_claimed" ? "number" : k === "incident_date" ? "date" : "text"} value={(claimForm as Record<string,string>)[k]} onChange={e => setCF(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <div style={{ flex: 3, minWidth: 200 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Description *</label>
                  <input value={claimForm.description} onChange={e => setCF(f => ({ ...f, description: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                </div>
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>File Claim</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Claim #","Policy","Type","Amount Claimed","Settled","Status","Filed","Actions"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {claims.length === 0 ? <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No claims yet</td></tr>
                    : claims.map(c => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11 }}>{c.claim_no}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{c.policy_no || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{c.type || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#f59e0b" }}>{c.amount_claimed != null ? `$${Number(c.amount_claimed).toLocaleString()}` : "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#22c55e" }}>{c.amount_settled != null ? `$${Number(c.amount_settled).toLocaleString()}` : "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: claimStatusColor(c.status) + "22", color: claimStatusColor(c.status), padding: "3px 8px", borderRadius: 20, fontSize: 11 }}>{c.status}</span></td>
                        <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>{new Date(c.filed_at).toLocaleDateString()}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {["submitted","under_review","approved"].includes(c.status) && <button onClick={() => settleClaim(c.id)} style={{ background: "#22c55e22", border: "1px solid #22c55e", color: "#22c55e", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>Settle</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "clients" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <div style={{ fontSize: 16 }}>Client Management</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>POST /api/insurance/clients · GET /api/insurance/clients/:id (returns policies + claims)</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
