import { useState, useEffect, useCallback } from "react";

type Room        = { id: number; room_number: string; type: string; floor: number; rate_per_night: number; status: string; property_name: string };
type Reservation = { id: number; booking_ref: string; guest_name: string; room_number: string; check_in: string; check_out: string; status: string; total: number };
type HKTask      = { id: number; room_number: string; property_name: string; type: string; priority: string; status: string; assigned_to: string; due_at: string };
type Stats       = { activeProperties: number; rooms: Record<string,number>; occupancyRate: number; currentGuests: number; pendingHousekeeping: number };

const statusColor = (s: string) => ({ available: "#22c55e", reserved: "#6366f1", occupied: "#f59e0b", cleaning: "#94a3b8", maintenance: "#ef4444" }[s] ?? "#94a3b8");
const resColor    = (s: string) => ({ confirmed: "#6366f1", checked_in: "#22c55e", checked_out: "#64748b", cancelled: "#ef4444" }[s] ?? "#94a3b8");
const priColor    = (p: string) => ({ high: "#ef4444", medium: "#f59e0b", low: "#64748b" }[p] ?? "#94a3b8");

export default function HospitalityApp() {
  const [tab, setTab]       = useState<"rooms"|"reservations"|"housekeeping">("rooms");
  const [rooms, setR]       = useState<Room[]>([]);
  const [res, setRes]       = useState<Reservation[]>([]);
  const [hkTasks, setHK]   = useState<HKTask[]>([]);
  const [stats, setS]       = useState<Stats | null>(null);
  const [msg, setMsg]       = useState("");
  const [loading, setLoading] = useState(false);

  const [roomForm, setRoomForm]   = useState({ room_number: "", type: "standard", floor: "", rate_per_night: "", property_id: "" });
  const [resForm,  setResForm]    = useState({ guest_id: "", room_id: "", check_in: "", check_out: "" });

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, rv, s, hk] = await Promise.all([
        fetch("/api/hospitality/rooms",        { credentials: "include" }).then(r => r.json()),
        fetch("/api/hospitality/reservations", { credentials: "include" }).then(r => r.json()),
        fetch("/api/hospitality/stats",        { credentials: "include" }).then(r => r.json()),
        fetch("/api/hospitality/housekeeping", { credentials: "include" }).then(r => r.json()),
      ]);
      setR(r.rooms ?? []);
      setRes(rv.reservations ?? []);
      setS(s);
      setHK(hk.tasks ?? []);
    } catch { notify("Failed to load data"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const checkIn = async (id: number) => {
    const r = await fetch(`/api/hospitality/reservations/${id}/check-in`, { method: "POST", credentials: "include" });
    if (r.ok) { notify("✓ Guest checked in"); load(); } else { notify("Check-in failed"); }
  };
  const checkOut = async (id: number) => {
    const r = await fetch(`/api/hospitality/reservations/${id}/check-out`, { method: "POST", credentials: "include" });
    if (r.ok) { notify("✓ Guest checked out, housekeeping task created"); load(); } else { notify("Check-out failed"); }
  };
  const markComplete = async (id: number) => {
    const r = await fetch(`/api/hospitality/housekeeping/${id}/complete`, { method: "PUT", credentials: "include" });
    if (r.ok) { notify("✓ Task marked complete"); load(); } else { notify("Failed to update task"); }
  };
  const addRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.room_number || !roomForm.rate_per_night || !roomForm.property_id) { notify("Property ID, room number, and rate required"); return; }
    const r = await fetch("/api/hospitality/rooms", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...roomForm, floor: roomForm.floor ? parseInt(roomForm.floor) : null, rate_per_night: parseFloat(roomForm.rate_per_night), property_id: parseInt(roomForm.property_id) }) });
    if (r.ok) { notify("✓ Room added"); setRoomForm({ room_number: "", type: "standard", floor: "", rate_per_night: "", property_id: "" }); load(); }
    else { const d = await r.json(); notify(d.error ?? "Error adding room"); }
  };
  const createReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resForm.guest_id || !resForm.room_id || !resForm.check_in || !resForm.check_out) { notify("All reservation fields required"); return; }
    const r = await fetch("/api/hospitality/reservations", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_id: parseInt(resForm.guest_id), room_id: parseInt(resForm.room_id), check_in: resForm.check_in, check_out: resForm.check_out }) });
    if (r.ok) { notify("✓ Reservation created"); setResForm({ guest_id: "", room_id: "", check_in: "", check_out: "" }); load(); }
    else { const d = await r.json(); notify(d.error ?? "Error creating reservation"); }
  };

  const inp = { background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14, width: "100%" } as const;

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f1f5f9", fontFamily: "Inter,sans-serif", padding: "24px" }}>
      <a href="#main" style={{ position: "absolute", left: -9999 }}>Skip to content</a>
      <div aria-live="polite" style={{ position: "fixed", top: 16, right: 16, background: msg ? "#6366f1" : "transparent", color: "#fff", padding: msg ? "10px 18px" : 0, borderRadius: 8, fontSize: 14, zIndex: 999, transition: "all .2s" }}>{msg}</div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏨</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Hospitality PMS Engine</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Properties · Rooms · Reservations · Housekeeping</p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Properties", value: stats.activeProperties },
              { label: "Occupancy Rate", value: `${stats.occupancyRate ?? 0}%`, highlight: true },
              { label: "Current Guests", value: stats.currentGuests },
              { label: "Available Rooms", value: stats.rooms?.available ?? 0 },
              { label: "Pending HK Tasks", value: stats.pendingHousekeeping, warn: (stats.pendingHousekeeping ?? 0) > 0 },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: `1px solid ${(s as {warn?:boolean}).warn ? "#f59e0b44" : "#1e293b"}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: (s as {highlight?:boolean}).highlight ? "#22c55e" : "#6366f1" }}>{s.value ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["rooms","reservations","housekeeping"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? "#6366f1" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}{t === "housekeeping" && hkTasks.filter(h => h.status === "pending").length > 0 ? ` (${hkTasks.filter(h => h.status === "pending").length})` : ""}
            </button>
          ))}
        </div>

        <main id="main">
          {tab === "rooms" && (
            <>
              <form onSubmit={addRoom} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {([["property_id","Property ID *"], ["room_number","Room # *"], ["floor","Floor"], ["rate_per_night","Rate/Night *"]] as [string,string][]).map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, minWidth: 120 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(roomForm as Record<string,string>)[k]} onChange={e => setRoomForm(f => ({ ...f, [k]: e.target.value }))} type={["floor","rate_per_night","property_id"].includes(k) ? "number" : "text"} step={k === "rate_per_night" ? "0.01" : undefined} style={inp} />
                  </div>
                ))}
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Type</label>
                  <select value={roomForm.type} onChange={e => setRoomForm(f => ({ ...f, type: e.target.value }))} style={inp}>
                    {["standard","deluxe","suite","penthouse","studio"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Add Room</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Room #","Property","Type","Floor","Rate/Night","Status"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : rooms.length === 0 ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No rooms yet — add one above</td></tr>
                    : rooms.map(r => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#6366f1" }}>{r.room_number}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{r.property_name || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{r.type}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{r.floor ?? "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#6366f1", fontWeight: 600 }}>${Number(r.rate_per_night).toFixed(2)}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: statusColor(r.status) + "22", color: statusColor(r.status), padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "reservations" && (
            <>
              <form onSubmit={createReservation} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {([["guest_id","Guest ID *"], ["room_id","Room ID *"]] as [string,string][]).map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, minWidth: 120 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input type="number" value={(resForm as Record<string,string>)[k]} onChange={e => setResForm(f => ({ ...f, [k]: e.target.value }))} style={inp} />
                  </div>
                ))}
                {([["check_in","Check-In *"], ["check_out","Check-Out *"]] as [string,string][]).map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, minWidth: 140 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input type="date" value={(resForm as Record<string,string>)[k]} onChange={e => setResForm(f => ({ ...f, [k]: e.target.value }))} style={inp} />
                  </div>
                ))}
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Create Reservation</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Booking Ref","Guest","Room","Check-In","Check-Out","Status","Total","Actions"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {res.length === 0 ? <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No reservations yet</td></tr>
                    : res.map(r => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12 }}>{r.booking_ref}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{r.guest_name || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#6366f1" }}>{r.room_number || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{r.check_in ? new Date(r.check_in).toLocaleDateString() : "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{r.check_out ? new Date(r.check_out).toLocaleDateString() : "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: resColor(r.status) + "22", color: resColor(r.status), padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>{r.status}</span></td>
                        <td style={{ padding: "12px 16px", color: "#22c55e", fontWeight: 600 }}>${Number(r.total ?? 0).toFixed(2)}</td>
                        <td style={{ padding: "12px 16px", display: "flex", gap: 6 }}>
                          {r.status === "confirmed" && <button onClick={() => checkIn(r.id)} style={{ background: "#6366f122", border: "1px solid #6366f1", color: "#6366f1", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Check In</button>}
                          {r.status === "checked_in" && <button onClick={() => checkOut(r.id)} style={{ background: "#22c55e22", border: "1px solid #22c55e", color: "#22c55e", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Check Out</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "housekeeping" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {loading ? <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</div>
              : hkTasks.length === 0 ? (
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#22c55e" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                  <div>No pending housekeeping tasks</div>
                </div>
              ) : hkTasks.map(h => (
                <div key={h.id} style={{ background: "#0f172a", border: `1px solid ${priColor(h.priority)}33`, borderRadius: 12, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: "#6366f1", fontSize: 14 }}>{h.room_number || "—"}</span>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>{h.property_name || ""}</span>
                      <span style={{ background: priColor(h.priority) + "22", color: priColor(h.priority), padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{h.priority}</span>
                    </div>
                    <div style={{ fontSize: 13, textTransform: "capitalize" }}>{(h.type ?? "").replace(/_/g, " ")}</div>
                    {h.assigned_to && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Assigned: {h.assigned_to}</div>}
                    {h.due_at && <div style={{ fontSize: 12, color: "#64748b" }}>Due: {new Date(h.due_at).toLocaleString()}</div>}
                  </div>
                  {h.status === "pending" && (
                    <button onClick={() => markComplete(h.id)} style={{ background: "#22c55e22", border: "1px solid #22c55e", color: "#22c55e", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>Mark Complete</button>
                  )}
                  {h.status !== "pending" && (
                    <span style={{ background: "#22c55e22", color: "#22c55e", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>{h.status}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
