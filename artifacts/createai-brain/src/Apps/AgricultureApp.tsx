import { useState, useEffect, useCallback } from "react";

type Farm     = { id: number; name: string; owner: string; city: string; state: string; hectares: number; type: string; status: string; field_count: number };
type Crop     = { id: number; name: string; variety: string; field_name: string; farm_name: string; area_ha: number; status: string; planted_at: string; expected_harvest: string };
type Harvest  = { id: number; crop_name: string; field_name: string; quantity_kg: number; quality: string; price_per_kg: number; revenue: number; harvested_at: string };
type Stats    = { activeFarms: number; activeFields: number; activeCrops: number; healthyLivestock: number; harvestKgThisYear: number };

const cropStatusColor = (s: string) => ({ planted: "#6366f1", growing: "#22c55e", ready: "#f59e0b", harvested: "#64748b", failed: "#ef4444" }[s] ?? "#94a3b8");
const qualityColor    = (q: string) => ({ grade_a: "#22c55e", grade_b: "#f59e0b", grade_c: "#ef4444" }[q] ?? "#94a3b8");

export default function AgricultureApp() {
  const [tab, setTab]       = useState<"farms"|"crops"|"harvests">("farms");
  const [farms, setFarms]   = useState<Farm[]>([]);
  const [crops, setCrops]   = useState<Crop[]>([]);
  const [harvests, setHarv] = useState<Harvest[]>([]);
  const [stats, setStats]   = useState<Stats | null>(null);
  const [farmForm, setFF]   = useState({ name: "", owner: "", city: "", state: "", hectares: "", type: "mixed" });
  const [cropForm, setCF]   = useState({ field_id: "", name: "", variety: "", planted_at: "", expected_harvest: "", area_ha: "" });
  const [msg, setMsg]       = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, c, h, s] = await Promise.all([
        fetch("/api/agriculture/farms",    { credentials: "include" }).then(r => r.json()),
        fetch("/api/agriculture/crops",    { credentials: "include" }).then(r => r.json()),
        fetch("/api/agriculture/harvests", { credentials: "include" }).then(r => r.json()),
        fetch("/api/agriculture/stats",    { credentials: "include" }).then(r => r.json()),
      ]);
      setFarms(f.farms ?? []);
      setCrops(c.crops ?? []);
      setHarv(h.harvests ?? []);
      setStats(s);
    } catch { notify("Failed to load data"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmForm.name) { notify("Farm name required"); return; }
    const r = await fetch("/api/agriculture/farms", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...farmForm, hectares: farmForm.hectares ? parseFloat(farmForm.hectares) : undefined }) });
    if (r.ok) { notify("✓ Farm added"); setFF({ name: "", owner: "", city: "", state: "", hectares: "", type: "mixed" }); load(); }
    else { notify("Error adding farm"); }
  };

  const addCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropForm.field_id || !cropForm.name) { notify("Field ID and crop name required"); return; }
    const r = await fetch("/api/agriculture/crops", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...cropForm, field_id: parseInt(cropForm.field_id), area_ha: cropForm.area_ha ? parseFloat(cropForm.area_ha) : undefined }) });
    if (r.ok) { notify("✓ Crop planted"); setCF({ field_id: "", name: "", variety: "", planted_at: "", expected_harvest: "", area_ha: "" }); load(); }
    else { notify("Error adding crop"); }
  };

  const deleteFarm = async (id: number) => {
    await fetch(`/api/agriculture/farms/${id}`, { method: "DELETE", credentials: "include" });
    notify("Farm removed"); load();
  };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f1f5f9", fontFamily: "Inter,sans-serif", padding: "24px" }}>
      <a href="#main" style={{ position: "absolute", left: -9999 }}>Skip to content</a>
      <div aria-live="polite" style={{ position: "fixed", top: 16, right: 16, background: msg ? "#6366f1" : "transparent", color: "#fff", padding: msg ? "10px 18px" : 0, borderRadius: 8, fontSize: 14, zIndex: 999, transition: "all .2s" }}>{msg}</div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌾</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Agriculture & Farm Engine</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Farms · Fields · Crops · Livestock · Harvests · Equipment</p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Active Farms", value: stats.activeFarms },
              { label: "Active Fields", value: stats.activeFields },
              { label: "Growing Crops", value: stats.activeCrops, green: true },
              { label: "Healthy Livestock", value: stats.healthyLivestock },
              { label: "Harvest kg (YTD)", value: stats.harvestKgThisYear != null ? Number(stats.harvestKgThisYear).toFixed(0) + " kg" : "—" },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: (s as {green?:boolean}).green ? "#22c55e" : "#6366f1" }}>{s.value ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["farms","crops","harvests"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? "#6366f1" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <main id="main">
          {tab === "farms" && (
            <>
              <form onSubmit={addFarm} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["name","Farm Name *"], ["owner","Owner"], ["city","City"], ["state","State"], ["hectares","Hectares"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: k === "name" ? 2 : 1, minWidth: 120 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(farmForm as Record<string,string>)[k]} onChange={e => setFF(f => ({ ...f, [k]: e.target.value }))}
                      type={k === "hectares" ? "number" : "text"}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Farm Type</label>
                  <select value={farmForm.type} onChange={e => setFF(f => ({ ...f, type: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }}>
                    {["mixed","crop","livestock","organic","aquaculture","poultry"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Add Farm</button>
              </form>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {loading ? <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 24, color: "#64748b" }}>Loading...</div>
                : farms.length === 0 ? <div style={{ gridColumn: "1/-1", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>No farms registered yet</div>
                : farms.map(f => (
                  <div key={f.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{f.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{f.owner || "—"}</div>
                      </div>
                      <button onClick={() => deleteFarm(f.id)} style={{ background: "transparent", border: "1px solid #334155", color: "#64748b", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 12 }}>×</button>
                    </div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>
                      {[f.city, f.state].filter(Boolean).join(", ") || "—"} · {f.type}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#6366f1", fontWeight: 600 }}>{f.hectares ? `${Number(f.hectares).toFixed(1)} ha` : "—"}</span>
                      <span style={{ fontSize: 13, color: "#94a3b8" }}>{f.field_count} field{f.field_count !== 1 ? "s" : ""}</span>
                      <span style={{ background: f.status==="active" ? "#22c55e22" : "#ef444422", color: f.status==="active" ? "#22c55e" : "#ef4444", padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{f.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "crops" && (
            <>
              <form onSubmit={addCrop} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["field_id","Field ID *"], ["name","Crop Name *"], ["variety","Variety"], ["area_ha","Area (ha)"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, minWidth: 130 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={(cropForm as Record<string,string>)[k]} onChange={e => setCF(f => ({ ...f, [k]: e.target.value }))}
                      type={["field_id","area_ha"].includes(k) ? "number" : "text"}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                {[["planted_at","Planting Date"], ["expected_harvest","Expected Harvest"]].map(([k, lbl]) => (
                  <div key={k} style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input type="date" value={(cropForm as Record<string,string>)[k]} onChange={e => setCF(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                  </div>
                ))}
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Plant Crop</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Crop","Variety","Farm / Field","Area","Planted","Expected Harvest","Status"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {crops.length === 0 ? <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No crops yet — plant one to begin</td></tr>
                    : crops.map(c => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{c.variety || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 13 }}>{c.farm_name || "—"} / {c.field_name || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#6366f1" }}>{c.area_ha ? `${Number(c.area_ha).toFixed(2)} ha` : "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{c.planted_at ? new Date(c.planted_at).toLocaleDateString() : "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{c.expected_harvest ? new Date(c.expected_harvest).toLocaleDateString() : "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: cropStatusColor(c.status) + "22", color: cropStatusColor(c.status), padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "harvests" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e293b", fontWeight: 600 }}>Harvest Records</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Crop","Field","Date","Quantity","Quality","Price/kg","Revenue"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                  : harvests.length === 0 ? <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No harvests yet — POST /api/agriculture/harvests</td></tr>
                  : harvests.map(h => (
                    <tr key={h.id} style={{ borderBottom: "1px solid #0f172a" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{h.crop_name || "—"}</td>
                      <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{h.field_name || "—"}</td>
                      <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{new Date(h.harvested_at).toLocaleDateString()}</td>
                      <td style={{ padding: "12px 16px", color: "#6366f1", fontWeight: 600 }}>{Number(h.quantity_kg).toLocaleString()} kg</td>
                      <td style={{ padding: "12px 16px" }}><span style={{ background: qualityColor(h.quality) + "22", color: qualityColor(h.quality), padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{h.quality}</span></td>
                      <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{h.price_per_kg != null ? `$${Number(h.price_per_kg).toFixed(4)}/kg` : "—"}</td>
                      <td style={{ padding: "12px 16px", color: "#22c55e", fontWeight: 600 }}>{h.revenue != null ? `$${Number(h.revenue).toFixed(2)}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
