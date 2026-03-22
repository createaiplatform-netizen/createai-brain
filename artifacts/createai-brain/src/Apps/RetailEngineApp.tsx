import { useState, useEffect, useCallback } from "react";

type Product = { id: number; sku: string; name: string; price: number; qty_on_hand: number; category_name: string; status: string };
type Stats   = { activeProducts: number; lowStockAlerts: number; transactionsToday: number; revenueLastMonth: number; activePromotions: number };

export default function RetailEngineApp() {
  const [tab, setTab]       = useState<"products"|"inventory"|"pos">("products");
  const [products, setProds] = useState<Product[]>([]);
  const [stats, setStats]   = useState<Stats | null>(null);
  const [form, setForm]     = useState({ name: "", sku: "", price: "", category_id: "" });
  const [msg, setMsg]       = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        fetch("/api/retail/products", { credentials: "include" }).then(r => r.json()),
        fetch("/api/retail/stats",    { credentials: "include" }).then(r => r.json()),
      ]);
      setProds(p.products ?? []);
      setStats(s);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) { notify("Name and price required"); return; }
    const r = await fetch("/api/retail/products", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: parseFloat(form.price) }) });
    if (r.ok) { notify("✓ Product added"); setForm({ name: "", sku: "", price: "", category_id: "" }); load(); }
    else { notify("Error adding product"); }
  };

  const deleteProduct = async (id: number) => {
    await fetch(`/api/retail/products/${id}`, { method: "DELETE", credentials: "include" });
    notify("Product removed"); load();
  };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f1f5f9", fontFamily: "Inter,sans-serif", padding: "24px" }}>
      <a href="#main" style={{ position: "absolute", left: -9999 }}>Skip to content</a>
      <div aria-live="polite" style={{ position: "fixed", top: 16, right: 16, background: msg ? "#6366f1" : "transparent", color: "#fff", padding: msg ? "10px 18px" : 0, borderRadius: 8, fontSize: 14, zIndex: 999, transition: "all .2s" }}>{msg}</div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛍️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Retail & Commerce Engine</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Products · Inventory · POS · Promotions</p>
          </div>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Active Products", value: stats.activeProducts },
              { label: "Low Stock Alerts", value: stats.lowStockAlerts, warn: (stats.lowStockAlerts ?? 0) > 0 },
              { label: "Txns Today", value: stats.transactionsToday },
              { label: "Rev Last 30d", value: stats.revenueLastMonth != null ? `$${Number(stats.revenueLastMonth).toFixed(2)}` : "—" },
              { label: "Active Promos", value: stats.activePromotions },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f172a", border: `1px solid ${(s as {warn?:boolean}).warn ? "#f59e0b44" : "#1e293b"}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: (s as {warn?:boolean}).warn ? "#f59e0b" : "#6366f1" }}>{s.value ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["products","inventory","pos"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? "#6366f1" : "#1e293b", color: tab === t ? "#fff" : "#94a3b8" }}>
              {t === "pos" ? "POS" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <main id="main">
          {tab === "products" && (
            <>
              <form onSubmit={addProduct} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 2, minWidth: 180 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Product Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>SKU</label>
                  <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Price *</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    style={{ width: "100%", background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14 }} />
                </div>
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Add Product</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["SKU","Name","Category","Price","Stock","Status",""].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : products.length === 0 ? <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No products yet</td></tr>
                    : products.map(p => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{p.sku || "—"}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{p.category_name || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#6366f1", fontWeight: 600 }}>${Number(p.price).toFixed(2)}</td>
                        <td style={{ padding: "12px 16px", color: Number(p.qty_on_hand) <= 10 ? "#f59e0b" : "#22c55e" }}>{p.qty_on_hand ?? 0}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: p.status==="active" ? "#22c55e22" : "#ef444422", color: p.status==="active" ? "#22c55e" : "#ef4444", padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{p.status}</span></td>
                        <td style={{ padding: "12px 16px" }}><button onClick={() => deleteProduct(p.id)} style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === "inventory" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
              <div style={{ fontSize: 16 }}>Inventory management via API</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>GET /api/retail/inventory?low_stock=true · PUT /api/retail/inventory/:product_id</div>
            </div>
          )}
          {tab === "pos" && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
              <div style={{ fontSize: 16 }}>Point of Sale system available via API</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>POST /api/retail/pos/transaction · GET /api/retail/pos/transactions</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
