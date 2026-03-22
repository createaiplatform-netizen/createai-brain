import { useState, useEffect, useCallback } from "react";

type Vehicle = { id: number; make: string; model: string; plate: string; status: string; type: string };
type Driver  = { id: number; name: string; phone: string; status: string; rating: number };
type Stats   = { totalVehicles: number; activeDrivers: number; totalShipments: number; deliveredShipments: number; warehouses: number };

export default function FleetLogisticsApp() {
  const [tab, setTab]       = useState<"vehicles"|"drivers"|"shipments">("vehicles");
  const [vehicles, setV]    = useState<Vehicle[]>([]);
  const [drivers, setD]     = useState<Driver[]>([]);
  const [stats, setStats]   = useState<Stats | null>(null);
  const [form, setForm]     = useState({ make: "", model: "", plate: "", type: "truck" });
  const [dForm, setDF]      = useState({ name: "", phone: "", license_no: "", license_class: "Class A" });
  const [msg, setMsg]       = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vs, ds, st] = await Promise.all([
        fetch("/api/fleet/vehicles", { credentials: "include" }).then(r => r.json()),
        fetch("/api/fleet/drivers",  { credentials: "include" }).then(r => r.json()),
        fetch("/api/fleet/stats",    { credentials: "include" }).then(r => r.json()),
      ]);
      setV(vs.vehicles ?? []);
      setD(ds.drivers  ?? []);
      setStats(st);
    } catch { notify("Failed to load data"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make || !form.model) { notify("Make and model required"); return; }
    const r = await fetch("/api/fleet/vehicles", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) { notify("Vehicle added"); setForm({ make: "", model: "", plate: "", type: "truck" }); load(); }
    else { notify("Error adding vehicle"); }
  };

  const addDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dForm.name) { notify("Name required"); return; }
    const r = await fetch("/api/fleet/drivers", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(dForm) });
    if (r.ok) { notify("Driver added"); setDF({ name: "", phone: "", license_no: "", license_class: "Class A" }); load(); }
    else { notify("Error adding driver"); }
  };

  const deleteVehicle = async (id: number) => {
    await fetch(`/api/fleet/vehicles/${id}`, { method: "DELETE", credentials: "include" });
    notify("Vehicle removed"); load();
  };

  const statusColor = (s: string) => ({ available: "#22c55e", en_route: "#6366f1", maintenance: "#f59e0b", inactive: "#ef4444" }[s] ?? "#94a3b8");

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f1f5f9", fontFamily: "Inter,sans-serif", padding: "24px" }}>
      <a href="#main" style={{ position: "absolute", left: -9999 }}>Skip to content</a>
      <div aria-live="polite" style={{ position: "fixed", top: 16, right: 16, background: msg ? "#6366f1" : "transparent", color: "#fff", padding: msg ? "10px 18px" : 0, borderRadius: 8, fontSize: 14, transition: "all .2s", zIndex: 999 }}>{msg}</div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚛</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Fleet & Logistics Engine</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Vehicles · Drivers · Shipments · Warehouses</p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Vehicles", value: stats.totalVehicles },
              { label: "Active Drivers", value: stats.activeDrivers },
              { label: "Total Shipments", value: stats.totalShipments },
              { label: "Delivered", value: stats.deliveredShipments },
              { label: "Warehouses", value: stats.warehouses },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>{s.value ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["vehicles","drivers","shipments"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? "#6366f1" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <main id="main">
          {tab === "vehicles" && (
            <>
              <form onSubmit={addVehicle} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["make","Make *"], ["model","Model *"], ["plate","Plate"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, minWidth: 120 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(form as Record<string,string>)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }}>
                    {["truck","van","sedan","suv","motorcycle"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Add Vehicle</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1e293b" }}>
                      {["Make", "Model", "Plate", "Type", "Status", ""].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : vehicles.length === 0 ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No vehicles yet</td></tr>
                    : vehicles.map(v => (
                      <tr key={v.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px" }}>{v.make}</td>
                        <td style={{ padding: "12px 16px" }}>{v.model}</td>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>{v.plate || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{v.type}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: statusColor(v.status) + "22", color: statusColor(v.status), padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{v.status}</span></td>
                        <td style={{ padding: "12px 16px" }}><button onClick={() => deleteVehicle(v.id)} style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "drivers" && (
            <>
              <form onSubmit={addDriver} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["name","Name *"], ["phone","Phone"], ["license_no","License No"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, minWidth: 140 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(dForm as Record<string,string>)[k]} onChange={e => setDF(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Add Driver</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Name","Phone","Status","Rating"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {drivers.length === 0 ? <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No drivers yet</td></tr>
                    : drivers.map(d => (
                      <tr key={d.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{d.name}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{d.phone || "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: d.status==="active" ? "#22c55e22" : "#ef444422", color: d.status==="active" ? "#22c55e" : "#ef4444", padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{d.status}</span></td>
                        <td style={{ padding: "12px 16px", color: "#f59e0b" }}>{"★".repeat(Math.round(d.rating))} {d.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "shipments" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
              <div style={{ fontSize: 16 }}>Shipment management available via API</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>POST /api/fleet/shipments to create shipments</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
