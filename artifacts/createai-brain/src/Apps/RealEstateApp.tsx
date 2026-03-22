import { useState, useEffect, useCallback } from "react";

type Listing = { id: number; property_id: number; address: string; city: string; bedrooms: number; bathrooms: number; list_price: number; list_type: string; status: string; days_on_market: number; agent_name: string };
type Stats   = { activeProperties: number; listings: Record<string,number>; closedLast30d: number; commissionLast30d: number; newLeads: number };

export default function RealEstateApp() {
  const [tab, setTab]       = useState<"listings"|"leads"|"agents">("listings");
  const [listings, setL]    = useState<Listing[]>([]);
  const [stats, setStats]   = useState<Stats | null>(null);
  const [propForm, setPF]   = useState({ address: "", city: "", state: "", type: "residential", bedrooms: "", bathrooms: "", sqft: "" });
  const [listForm, setLF]   = useState({ property_id: "", list_price: "", list_type: "sale" });
  const [leadForm, setLeadF] = useState({ name: "", email: "", phone: "", intent: "buy", budget_min: "", budget_max: "" });
  const [msg, setMsg]       = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, s] = await Promise.all([
        fetch("/api/real-estate/listings", { credentials: "include" }).then(r => r.json()),
        fetch("/api/real-estate/stats",    { credentials: "include" }).then(r => r.json()),
      ]);
      setL(l.listings ?? []);
      setStats(s);
    } catch { notify("Failed to load data"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addProperty = async () => {
    if (!propForm.address) { notify("Address required"); return; }
    const r = await fetch("/api/real-estate/properties", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...propForm, bedrooms: propForm.bedrooms ? parseInt(propForm.bedrooms) : undefined, sqft: propForm.sqft ? parseFloat(propForm.sqft) : undefined }) });
    if (r.ok) {
      const d = await r.json();
      notify(`✓ Property #${d.property?.id} added — now create a listing for it`);
      setPF({ address: "", city: "", state: "", type: "residential", bedrooms: "", bathrooms: "", sqft: "" });
    } else { notify("Error adding property"); }
  };

  const addListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listForm.property_id || !listForm.list_price) { notify("Property ID and price required"); return; }
    const r = await fetch("/api/real-estate/listings", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property_id: parseInt(listForm.property_id), list_price: parseFloat(listForm.list_price), list_type: listForm.list_type }) });
    if (r.ok) { notify("✓ Listing created"); setLF({ property_id: "", list_price: "", list_type: "sale" }); load(); }
    else { notify("Error creating listing"); }
  };

  const addLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name) { notify("Name required"); return; }
    const r = await fetch("/api/real-estate/leads", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...leadForm, budget_min: leadForm.budget_min ? parseFloat(leadForm.budget_min) : undefined, budget_max: leadForm.budget_max ? parseFloat(leadForm.budget_max) : undefined }) });
    if (r.ok) { notify("✓ Lead captured"); setLeadF({ name: "", email: "", phone: "", intent: "buy", budget_min: "", budget_max: "" }); }
    else { notify("Error capturing lead"); }
  };

  const statusColor = (s: string) => ({ active: "#22c55e", pending: "#f59e0b", sold: "#6366f1", expired: "#ef4444", withdrawn: "#94a3b8" }[s] ?? "#94a3b8");

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f1f5f9", fontFamily: "Inter,sans-serif", padding: "24px" }}>
      <a href="#main" style={{ position: "absolute", left: -9999 }}>Skip to content</a>
      <div aria-live="polite" style={{ position: "fixed", top: 16, right: 16, background: msg ? "#6366f1" : "transparent", color: "#fff", padding: msg ? "10px 18px" : 0, borderRadius: 8, fontSize: 14, zIndex: 999, transition: "all .2s" }}>{msg}</div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏠</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Real Estate Engine</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Properties · Listings · Agents · Transactions · Leads</p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Active Properties", value: stats.activeProperties },
              { label: "Active Listings", value: stats.listings?.active ?? 0 },
              { label: "Closed Last 30d", value: stats.closedLast30d },
              { label: "Commission Last 30d", value: stats.commissionLast30d != null ? `$${Number(stats.commissionLast30d).toFixed(0)}` : "—" },
              { label: "New Leads", value: stats.newLeads },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>{s.value ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["listings","leads","agents"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? "#6366f1" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <main id="main">
          {tab === "listings" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>Step 1: Add Property</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[["address","Address *"], ["city","City"], ["state","State"]].map(([k, lbl]) => (
                      <div key={k}>
                        <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>{lbl}</label>
                        <input value={(propForm as Record<string,string>)[k]} onChange={e => setPF(f => ({ ...f, [k]: e.target.value }))}
                          style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "7px 10px", color: "#f1f5f9", fontSize: 13, boxSizing: "border-box" }} />
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 8 }}>
                      {[["bedrooms","Beds"], ["sqft","Sqft"]].map(([k, lbl]) => (
                        <div key={k} style={{ flex: 1 }}>
                          <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>{lbl}</label>
                          <input type="number" value={(propForm as Record<string,string>)[k]} onChange={e => setPF(f => ({ ...f, [k]: e.target.value }))}
                            style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "7px 10px", color: "#f1f5f9", fontSize: 13, boxSizing: "border-box" }} />
                        </div>
                      ))}
                    </div>
                    <button onClick={addProperty} style={{ padding: "8px", background: "#334155", border: "none", borderRadius: 8, color: "#f1f5f9", fontWeight: 600, cursor: "pointer" }}>Add Property</button>
                  </div>
                </div>
                <form onSubmit={addListing} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>Step 2: Create Listing</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>Property ID *</label>
                      <input type="number" value={listForm.property_id} onChange={e => setLF(f => ({ ...f, property_id: e.target.value }))}
                        style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "7px 10px", color: "#f1f5f9", fontSize: 13, boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>List Price *</label>
                      <input type="number" value={listForm.list_price} onChange={e => setLF(f => ({ ...f, list_price: e.target.value }))}
                        style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "7px 10px", color: "#f1f5f9", fontSize: 13, boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>Type</label>
                      <select value={listForm.list_type} onChange={e => setLF(f => ({ ...f, list_type: e.target.value }))}
                        style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "7px 10px", color: "#f1f5f9", fontSize: 13, boxSizing: "border-box" }}>
                        <option value="sale">For Sale</option><option value="rent">For Rent</option><option value="lease">Lease</option>
                      </select>
                    </div>
                    <button type="submit" style={{ padding: "8px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Create Listing</button>
                  </div>
                </form>
              </div>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Address","City","Beds","Price","Type","Days","Status","Agent"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : listings.length === 0 ? <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No listings yet</td></tr>
                    : listings.map(l => (
                      <tr key={l.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{l.address}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{l.city || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{l.bedrooms ?? "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#6366f1", fontWeight: 700 }}>${Number(l.list_price).toLocaleString()}</td>
                        <td style={{ padding: "12px 16px" }}>{l.list_type}</td>
                        <td style={{ padding: "12px 16px", color: Number(l.days_on_market) > 60 ? "#f59e0b" : "#94a3b8" }}>{l.days_on_market}d</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: statusColor(l.status) + "22", color: statusColor(l.status), padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>{l.status}</span></td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{l.agent_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === "leads" && (
            <form onSubmit={addLead} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Capture Buyer/Renter Lead</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[["name","Name *"], ["email","Email"], ["phone","Phone"]].map(([k, lbl]) => (
                  <div key={k}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(leadForm as Record<string,string>)[k]} onChange={e => setLeadF(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                ))}
                {[["budget_min","Min Budget"], ["budget_max","Max Budget"]].map(([k, lbl]) => (
                  <div key={k}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input type="number" value={(leadForm as Record<string,string>)[k]} onChange={e => setLeadF(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Intent</label>
                  <select value={leadForm.intent} onChange={e => setLeadF(f => ({ ...f, intent: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14, boxSizing: "border-box" }}>
                    <option value="buy">Buy</option><option value="rent">Rent</option><option value="lease">Lease</option><option value="invest">Invest</option>
                  </select>
                </div>
              </div>
              <button type="submit" style={{ marginTop: 16, padding: "10px 24px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Capture Lead</button>
            </form>
          )}
          {tab === "agents" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👔</div>
              <div style={{ fontSize: 16 }}>Agent Management</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>POST /api/real-estate/agents · GET /api/real-estate/agents</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
