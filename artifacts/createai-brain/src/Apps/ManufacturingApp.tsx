import { useState, useEffect, useCallback } from "react";

type WorkOrder = { id: number; wo_number: string; product_sku: string; quantity: number; status: string; priority: string; machine_name: string; scheduled_at: string };
type Machine   = { id: number; name: string; type: string; status: string; location: string };
type Stats     = { activeProducts: number; ordersCompletedLast30d: number; qualityPassRate: number | null; activeMachines: number };

const statusColor = (s: string) => ({ planned: "#64748b", in_progress: "#6366f1", completed: "#22c55e", cancelled: "#ef4444" }[s] ?? "#94a3b8");
const priorityColor = (p: string) => ({ low: "#64748b", normal: "#6366f1", high: "#f59e0b", urgent: "#ef4444" }[p] ?? "#94a3b8");

export default function ManufacturingApp() {
  const [tab, setTab]       = useState<"work-orders"|"machines"|"quality">("work-orders");
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [machines, setMach] = useState<Machine[]>([]);
  const [stats, setStats]   = useState<Stats | null>(null);
  const [form, setForm]     = useState({ product_sku: "", quantity: "", priority: "normal" });
  const [machForm, setMF]   = useState({ name: "", type: "", location: "" });
  const [msg, setMsg]       = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wo, m, s] = await Promise.all([
        fetch("/api/manufacturing/work-orders", { credentials: "include" }).then(r => r.json()),
        fetch("/api/manufacturing/machines",    { credentials: "include" }).then(r => r.json()),
        fetch("/api/manufacturing/stats",       { credentials: "include" }).then(r => r.json()),
      ]);
      setOrders(wo.workOrders ?? []);
      setMach(m.machines ?? []);
      setStats(s);
    } catch { notify("Failed to load data"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createWO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_sku || !form.quantity) { notify("SKU and quantity required"); return; }
    const r = await fetch("/api/manufacturing/work-orders", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, quantity: Number(form.quantity) }) });
    if (r.ok) { notify("✓ Work order created"); setForm({ product_sku: "", quantity: "", priority: "normal" }); load(); }
    else { notify("Error creating work order"); }
  };

  const startWO = async (id: number) => {
    const r = await fetch(`/api/manufacturing/work-orders/${id}/start`, { method: "POST", credentials: "include" });
    if (r.ok) { notify("Work order started"); load(); } else { notify("Cannot start — may not be in planned state"); }
  };

  const completeWO = async (id: number) => {
    const r = await fetch(`/api/manufacturing/work-orders/${id}/complete`, { method: "POST", credentials: "include" });
    if (r.ok) { notify("✓ Work order completed"); load(); } else { notify("Cannot complete — must be in progress"); }
  };

  const addMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machForm.name) { notify("Machine name required"); return; }
    const r = await fetch("/api/manufacturing/machines", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(machForm) });
    if (r.ok) { notify("✓ Machine added"); setMF({ name: "", type: "", location: "" }); load(); }
    else { notify("Error adding machine"); }
  };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f1f5f9", fontFamily: "Inter,sans-serif", padding: "24px" }}>
      <a href="#main" style={{ position: "absolute", left: -9999 }}>Skip to content</a>
      <div aria-live="polite" style={{ position: "fixed", top: 16, right: 16, background: msg ? "#6366f1" : "transparent", color: "#fff", padding: msg ? "10px 18px" : 0, borderRadius: 8, fontSize: 14, zIndex: 999, transition: "all .2s" }}>{msg}</div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏭</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Manufacturing Operations Engine</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>BOM · Work Orders · Quality Control · Machines</p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Active Products", value: stats.activeProducts },
              { label: "Completed Last 30d", value: stats.ordersCompletedLast30d },
              { label: "Quality Pass Rate", value: stats.qualityPassRate != null ? `${stats.qualityPassRate}%` : "—" },
              { label: "Active Machines", value: stats.activeMachines },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>{s.value ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["work-orders","machines","quality"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? "#6366f1" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8" }}>
              {t === "work-orders" ? "Work Orders" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <main id="main">
          {tab === "work-orders" && (
            <>
              <form onSubmit={createWO} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 2, minWidth: 160 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Product SKU *</label>
                  <input value={form.product_sku} onChange={e => setForm(f => ({ ...f, product_sku: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Quantity *</label>
                  <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }}>
                    {["low","normal","high","urgent"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Create WO</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["WO #","SKU","Qty","Priority","Status","Machine","Actions"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : orders.length === 0 ? <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No work orders yet</td></tr>
                    : orders.map(o => (
                      <tr key={o.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12 }}>{o.wo_number}</td>
                        <td style={{ padding: "12px 16px" }}>{o.product_sku}</td>
                        <td style={{ padding: "12px 16px", color: "#6366f1", fontWeight: 600 }}>{o.quantity}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: priorityColor(o.priority) + "22", color: priorityColor(o.priority), padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>{o.priority}</span></td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: statusColor(o.status) + "22", color: statusColor(o.status), padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>{o.status}</span></td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{o.machine_name || "—"}</td>
                        <td style={{ padding: "12px 16px", display: "flex", gap: 6 }}>
                          {o.status === "planned" && <button onClick={() => startWO(o.id)} style={{ background: "#6366f122", border: "1px solid #6366f1", color: "#6366f1", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Start</button>}
                          {o.status === "in_progress" && <button onClick={() => completeWO(o.id)} style={{ background: "#22c55e22", border: "1px solid #22c55e", color: "#22c55e", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Complete</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === "machines" && (
            <>
              <form onSubmit={addMachine} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["name","Machine Name *"], ["type","Type"], ["location","Location"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(machForm as Record<string,string>)[k]} onChange={e => setMF(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Add Machine</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Name","Type","Location","Status"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {machines.length === 0 ? <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No machines yet</td></tr>
                    : machines.map(m => (
                      <tr key={m.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{m.name}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{m.type || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{m.location || "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: m.status==="active" ? "#22c55e22" : "#ef444422", color: m.status==="active" ? "#22c55e" : "#ef4444", padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{m.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === "quality" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔬</div>
              <div style={{ fontSize: 16 }}>Quality Control System</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>POST /api/manufacturing/quality-checks · GET /api/manufacturing/quality-checks?result=fail</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
