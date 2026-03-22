import { useState, useEffect, useCallback } from "react";

type Trip   = { id: number; trip_no: string; origin: string; destination: string; passenger_name: string; driver_name: string; plate: string; fare: number; status: string; scheduled_at: string };
type Driver = { id: number; name: string; phone: string; status: string; rating: number; trips_completed: number; license_class: string };
type Stats  = { totalVehicles: number; activeDrivers: number; tripsLast30d: number; revenueLast30d: number; fuelCostLast30d: number };

const statusColor = (s: string) => ({ scheduled: "#6366f1", in_progress: "#f59e0b", completed: "#22c55e", cancelled: "#ef4444" }[s] ?? "#94a3b8");

export default function TransportationApp() {
  const [tab, setTab]     = useState<"trips"|"drivers"|"fleet">("trips");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrv] = useState<Driver[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [form, setForm]   = useState({ origin: "", destination: "", passenger_name: "", passenger_phone: "", fare: "" });
  const [drvForm, setDF]  = useState({ name: "", phone: "", license_no: "", license_class: "Class B" });
  const [msg, setMsg]     = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, d, s] = await Promise.all([
        fetch("/api/transportation/trips",   { credentials: "include" }).then(r => r.json()),
        fetch("/api/transportation/drivers", { credentials: "include" }).then(r => r.json()),
        fetch("/api/transportation/stats",   { credentials: "include" }).then(r => r.json()),
      ]);
      setTrips(t.trips ?? []);
      setDrv(d.drivers ?? []);
      setStats(s);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.origin || !form.destination) { notify("Origin and destination required"); return; }
    const r = await fetch("/api/transportation/trips", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, fare: form.fare ? parseFloat(form.fare) : undefined }) });
    if (r.ok) { notify("✓ Trip scheduled"); setForm({ origin: "", destination: "", passenger_name: "", passenger_phone: "", fare: "" }); load(); }
    else { notify("Error creating trip"); }
  };

  const startTrip = async (id: number) => {
    const r = await fetch(`/api/transportation/trips/${id}/start`, { method: "POST", credentials: "include" });
    if (r.ok) { notify("Trip started"); load(); } else { notify("Cannot start trip"); }
  };
  const completeTrip = async (id: number) => {
    const r = await fetch(`/api/transportation/trips/${id}/complete`, { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (r.ok) { notify("✓ Trip completed"); load(); } else { notify("Cannot complete trip"); }
  };

  const addDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drvForm.name) { notify("Name required"); return; }
    const r = await fetch("/api/transportation/drivers", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(drvForm) });
    if (r.ok) { notify("✓ Driver added"); setDF({ name: "", phone: "", license_no: "", license_class: "Class B" }); load(); }
    else { notify("Error adding driver"); }
  };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f1f5f9", fontFamily: "Inter,sans-serif", padding: "24px" }}>
      <a href="#main" style={{ position: "absolute", left: -9999 }}>Skip to content</a>
      <div aria-live="polite" style={{ position: "fixed", top: 16, right: 16, background: msg ? "#6366f1" : "transparent", color: "#fff", padding: msg ? "10px 18px" : 0, borderRadius: 8, fontSize: 14, zIndex: 999, transition: "all .2s" }}>{msg}</div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚕</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Transportation Operations Engine</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Vehicles · Drivers · Trips · Fuel · Maintenance</p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total Vehicles", value: stats.totalVehicles },
              { label: "Active Drivers", value: stats.activeDrivers },
              { label: "Trips Last 30d", value: stats.tripsLast30d },
              { label: "Revenue Last 30d", value: stats.revenueLast30d != null ? `$${Number(stats.revenueLast30d).toFixed(2)}` : "—" },
              { label: "Fuel Cost Last 30d", value: stats.fuelCostLast30d != null ? `$${Number(stats.fuelCostLast30d).toFixed(2)}` : "—" },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>{s.value ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["trips","drivers","fleet"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? "#6366f1" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <main id="main">
          {tab === "trips" && (
            <>
              <form onSubmit={createTrip} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["origin","Origin *"], ["destination","Destination *"], ["passenger_name","Passenger Name"], ["passenger_phone","Phone"], ["fare","Fare ($)"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, minWidth: 120 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(form as Record<string,string>)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      type={k === "fare" ? "number" : "text"}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Schedule Trip</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Trip #","Origin","Destination","Passenger","Driver","Fare","Status","Actions"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : trips.length === 0 ? <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No trips yet</td></tr>
                    : trips.map(t => (
                      <tr key={t.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11 }}>{t.trip_no}</td>
                        <td style={{ padding: "12px 16px" }}>{t.origin}</td>
                        <td style={{ padding: "12px 16px" }}>{t.destination}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{t.passenger_name || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{t.driver_name || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#22c55e", fontWeight: 600 }}>{t.fare != null ? `$${Number(t.fare).toFixed(2)}` : "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: statusColor(t.status) + "22", color: statusColor(t.status), padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>{t.status}</span></td>
                        <td style={{ padding: "12px 16px", display: "flex", gap: 6 }}>
                          {t.status === "scheduled" && <button onClick={() => startTrip(t.id)} style={{ background: "#6366f122", border: "1px solid #6366f1", color: "#6366f1", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>Start</button>}
                          {t.status === "in_progress" && <button onClick={() => completeTrip(t.id)} style={{ background: "#22c55e22", border: "1px solid #22c55e", color: "#22c55e", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>Complete</button>}
                        </td>
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
                    <input value={(drvForm as Record<string,string>)[k]} onChange={e => setDF(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Add Driver</button>
              </form>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {drivers.length === 0 ? <div style={{ gridColumn: "1/-1", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>No drivers yet</div>
                : drivers.map(d => (
                  <div key={d.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>{d.phone || "—"} · {d.license_class}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ background: d.status==="active" ? "#22c55e22" : "#ef444422", color: d.status==="active" ? "#22c55e" : "#ef4444", padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{d.status}</span>
                      <span style={{ color: "#f59e0b", fontSize: 13 }}>★ {d.rating} · {d.trips_completed} trips</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "fleet" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🚗</div>
              <div style={{ fontSize: 16 }}>Vehicle Fleet Management</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>POST /api/transportation/vehicles · GET /api/transportation/fuel-logs · GET /api/transportation/maintenance</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
