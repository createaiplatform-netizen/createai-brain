import { useState, useEffect, useCallback } from "react";

type Room        = { id: number; room_number: string; type: string; floor: number; rate_per_night: number; status: string; property_name: string };
type Reservation = { id: number; booking_ref: string; guest_name: string; room_number: string; check_in: string; check_out: string; status: string; total: number };
type Stats       = { activeProperties: number; rooms: Record<string,number>; occupancyRate: number; currentGuests: number; pendingHousekeeping: number };

const statusColor = (s: string) => ({ available: "#22c55e", reserved: "#6366f1", occupied: "#f59e0b", cleaning: "#94a3b8", maintenance: "#ef4444" }[s] ?? "#94a3b8");
const resColor    = (s: string) => ({ confirmed: "#6366f1", checked_in: "#22c55e", checked_out: "#64748b", cancelled: "#ef4444" }[s] ?? "#94a3b8");

export default function HospitalityApp() {
  const [tab, setTab]   = useState<"rooms"|"reservations"|"housekeeping">("rooms");
  const [rooms, setR]   = useState<Room[]>([]);
  const [res, setRes]   = useState<Reservation[]>([]);
  const [stats, setS]   = useState<Stats | null>(null);
  const [msg, setMsg]   = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, rv, s] = await Promise.all([
        fetch("/api/hospitality/rooms",        { credentials: "include" }).then(r => r.json()),
        fetch("/api/hospitality/reservations", { credentials: "include" }).then(r => r.json()),
        fetch("/api/hospitality/stats",        { credentials: "include" }).then(r => r.json()),
      ]);
      setR(rv_rooms => r.rooms ?? []);
      setRes(rv.reservations ?? []);
      setS(s);
    } finally { setLoading(false); }
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
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <main id="main">
          {tab === "rooms" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Room #","Property","Type","Floor","Rate/Night","Status"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                  : rooms.length === 0 ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No rooms yet — POST /api/hospitality/rooms to add</td></tr>
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
          )}
          {tab === "reservations" && (
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
          )}
          {tab === "housekeeping" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🧹</div>
              <div style={{ fontSize: 16 }}>Housekeeping Management</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>GET /api/hospitality/housekeeping · PUT /api/hospitality/housekeeping/:id/complete</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
