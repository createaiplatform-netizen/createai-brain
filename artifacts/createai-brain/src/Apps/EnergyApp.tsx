import { useState, useEffect, useCallback } from "react";

type Site  = { id: number; name: string; address: string; city: string; type: string; status: string; meter_count: number };
type Alert = { id: number; site_name: string; type: string; severity: string; message: string; resolved: boolean; created_at: string };
type Stats = { activeSites: number; activeMeters: number; unresolvedAlerts: number; consumptionKwh: number; billedLast30d: number };

const sevColor = (s: string) => ({ info: "#6366f1", warning: "#f59e0b", critical: "#ef4444", emergency: "#dc2626" }[s] ?? "#94a3b8");

export default function EnergyApp() {
  const [tab, setTab]     = useState<"sites"|"alerts"|"readings">("sites");
  const [sites, setSites] = useState<Site[]>([]);
  const [alerts, setAl]   = useState<Alert[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [form, setForm]   = useState({ name: "", address: "", city: "", type: "commercial", tariff: "" });
  const [msg, setMsg]     = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a, st] = await Promise.all([
        fetch("/api/energy/sites",  { credentials: "include" }).then(r => r.json()),
        fetch("/api/energy/alerts?resolved=false", { credentials: "include" }).then(r => r.json()),
        fetch("/api/energy/stats",  { credentials: "include" }).then(r => r.json()),
      ]);
      setSites(s.sites ?? []);
      setAl(a.alerts ?? []);
      setStats(st);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { notify("Site name required"); return; }
    const r = await fetch("/api/energy/sites", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) { notify("✓ Site added"); setForm({ name: "", address: "", city: "", type: "commercial", tariff: "" }); load(); }
    else { notify("Error adding site"); }
  };

  const resolveAlert = async (id: number) => {
    await fetch(`/api/energy/alerts/${id}/resolve`, { method: "PUT", credentials: "include" });
    notify("Alert resolved"); load();
  };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f1f5f9", fontFamily: "Inter,sans-serif", padding: "24px" }}>
      <a href="#main" style={{ position: "absolute", left: -9999 }}>Skip to content</a>
      <div aria-live="polite" style={{ position: "fixed", top: 16, right: 16, background: msg ? "#6366f1" : "transparent", color: "#fff", padding: msg ? "10px 18px" : 0, borderRadius: 8, fontSize: 14, zIndex: 999, transition: "all .2s" }}>{msg}</div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Energy & Utilities Engine</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Sites · Meters · Readings · Alerts · Billing</p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Active Sites", value: stats.activeSites },
              { label: "Active Meters", value: stats.activeMeters },
              { label: "Open Alerts", value: stats.unresolvedAlerts, warn: (stats.unresolvedAlerts ?? 0) > 0 },
              { label: "kWh Last 30d", value: stats.consumptionKwh != null ? Number(stats.consumptionKwh).toFixed(0) : "—" },
              { label: "Billed Last 30d", value: stats.billedLast30d != null ? `$${Number(stats.billedLast30d).toFixed(2)}` : "—" },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: `1px solid ${(s as {warn?:boolean}).warn ? "#f59e0b44" : "#1e293b"}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: (s as {warn?:boolean}).warn ? "#f59e0b" : "#6366f1" }}>{s.value ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["sites","alerts","readings"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? "#6366f1" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}{t === "alerts" && (alerts.length > 0) ? ` (${alerts.length})` : ""}
            </button>
          ))}
        </div>

        <main id="main">
          {tab === "sites" && (
            <>
              <form onSubmit={addSite} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["name","Site Name *"], ["address","Address"], ["city","City"], ["tariff","Tariff Plan"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, minWidth: 140 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(form as Record<string,string>)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }}>
                    {["commercial","residential","industrial","municipal"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Add Site</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Name","City","Type","Meters","Status"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : sites.length === 0 ? <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No energy sites yet</td></tr>
                    : sites.map(s => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{s.name}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{s.city || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{s.type}</td>
                        <td style={{ padding: "12px 16px", color: "#6366f1", fontWeight: 600 }}>{s.meter_count}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: s.status==="active" ? "#22c55e22" : "#ef444422", color: s.status==="active" ? "#22c55e" : "#ef4444", padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === "alerts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {alerts.length === 0 ? (
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#22c55e" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                  <div>No unresolved alerts</div>
                </div>
              ) : alerts.map(a => (
                <div key={a.id} style={{ background: "#0f172a", border: `1px solid ${sevColor(a.severity)}44`, borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ background: sevColor(a.severity) + "22", color: sevColor(a.severity), padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{a.severity}</span>
                      <span style={{ color: "#94a3b8", fontSize: 13 }}>{a.site_name}</span>
                    </div>
                    <div style={{ fontSize: 14 }}>{a.message}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                  <button onClick={() => resolveAlert(a.id)} style={{ background: "#22c55e22", border: "1px solid #22c55e", color: "#22c55e", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>Resolve</button>
                </div>
              ))}
            </div>
          )}
          {tab === "readings" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 16 }}>Meter Readings & Analytics</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>POST /api/energy/readings · GET /api/energy/readings?meter_id=X&days=30</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
