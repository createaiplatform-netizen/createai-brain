import { useState, useEffect, useCallback } from "react";

type Product     = { id: number; sku: string; name: string; price: number; qty_on_hand: number; category_name: string; status: string };
type InventoryRow = { product_id: number; product_name: string; sku: string; qty_on_hand: number; qty_reserved: number; reorder_at: number; location: string };
type Transaction = { id: number; receipt_no: string; cashier: string; customer_name: string; subtotal: number; tax: number; total: number; payment_method: string; created_at: string };
type Stats       = { activeProducts: number; lowStockAlerts: number; transactionsToday: number; revenueLastMonth: number; activePromotions: number };

export default function RetailEngineApp() {
  const [tab, setTab]         = useState<"products"|"inventory"|"pos">("products");
  const [products, setProds]  = useState<Product[]>([]);
  const [inventory, setInv]   = useState<InventoryRow[]>([]);
  const [transactions, setTxn] = useState<Transaction[]>([]);
  const [stats, setStats]     = useState<Stats | null>(null);
  const [prodForm, setProdForm] = useState({ name: "", sku: "", price: "", category_id: "" });
  const [adjForm, setAdjForm]  = useState<{ product_id: number | null; qty: string }>({ product_id: null, qty: "" });
  const [saleForm, setSaleForm] = useState({ product_id: "", qty: "1", price: "", cashier: "", payment_method: "cash" });
  const [msg, setMsg]          = useState("");
  const [loading, setLoading]  = useState(false);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, inv, txn] = await Promise.all([
        fetch("/api/retail/products",         { credentials: "include" }).then(r => r.json()),
        fetch("/api/retail/stats",            { credentials: "include" }).then(r => r.json()),
        fetch("/api/retail/inventory",        { credentials: "include" }).then(r => r.json()),
        fetch("/api/retail/pos/transactions", { credentials: "include" }).then(r => r.json()),
      ]);
      setProds(p.products ?? []);
      setStats(s);
      setInv(inv.inventory ?? []);
      setTxn(txn.transactions ?? []);
    } catch { notify("Failed to load data"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.price) { notify("Name and price required"); return; }
    const r = await fetch("/api/retail/products", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...prodForm, price: parseFloat(prodForm.price) }) });
    if (r.ok) { notify("✓ Product added"); setProdForm({ name: "", sku: "", price: "", category_id: "" }); load(); }
    else { notify("Error adding product"); }
  };

  const deleteProduct = async (id: number) => {
    await fetch(`/api/retail/products/${id}`, { method: "DELETE", credentials: "include" });
    notify("Product removed"); load();
  };

  const adjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjForm.product_id || !adjForm.qty) { notify("Select a product and enter quantity"); return; }
    const r = await fetch(`/api/retail/inventory/${adjForm.product_id}`, { method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty_on_hand: parseInt(adjForm.qty) }) });
    if (r.ok) { notify("✓ Stock updated"); setAdjForm({ product_id: null, qty: "" }); load(); }
    else { notify("Error updating stock"); }
  };

  const processSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.product_id || !saleForm.price) { notify("Product and price required"); return; }
    const r = await fetch("/api/retail/pos/transaction", { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cashier: saleForm.cashier || "POS",
        payment_method: saleForm.payment_method,
        items: [{ product_id: parseInt(saleForm.product_id), qty: parseInt(saleForm.qty || "1"), price: parseFloat(saleForm.price) }],
      }) });
    if (r.ok) { notify("✓ Sale processed"); setSaleForm({ product_id: "", qty: "1", price: "", cashier: "", payment_method: "cash" }); load(); }
    else { notify("Error processing sale"); }
  };

  const inp = { background: "#020617", border: "1px solid #334155", borderRadius: 6, padding: "8px 10px", color: "#f1f5f9", fontSize: 14, width: "100%" } as const;

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
                  <input value={prodForm.name} onChange={e => setProdForm(f => ({ ...f, name: e.target.value }))} style={inp} />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>SKU</label>
                  <input value={prodForm.sku} onChange={e => setProdForm(f => ({ ...f, sku: e.target.value }))} style={inp} />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Price *</label>
                  <input type="number" step="0.01" value={prodForm.price} onChange={e => setProdForm(f => ({ ...f, price: e.target.value }))} style={inp} />
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
            <>
              <form onSubmit={adjustStock} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 2, minWidth: 200 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Product *</label>
                  <select value={adjForm.product_id ?? ""} onChange={e => setAdjForm(f => ({ ...f, product_id: e.target.value ? parseInt(e.target.value) : null }))} style={inp}>
                    <option value="">Select product…</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku || "no SKU"})</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>New Qty on Hand *</label>
                  <input type="number" value={adjForm.qty} onChange={e => setAdjForm(f => ({ ...f, qty: e.target.value }))} style={inp} />
                </div>
                <button type="submit" style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Update Stock</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["SKU","Product","On Hand","Reserved","Reorder At","Location"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : inventory.length === 0 ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No inventory records yet</td></tr>
                    : inventory.map(i => (
                      <tr key={i.product_id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{i.sku || "—"}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{i.product_name}</td>
                        <td style={{ padding: "12px 16px", color: Number(i.qty_on_hand) <= Number(i.reorder_at) ? "#f59e0b" : "#22c55e", fontWeight: 600 }}>{i.qty_on_hand ?? 0}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{i.qty_reserved ?? 0}</td>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>{i.reorder_at ?? "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{i.location || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "pos" && (
            <>
              <form onSubmit={processSale} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 2, minWidth: 200 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Product *</label>
                  <select value={saleForm.product_id} onChange={e => setSaleForm(f => ({ ...f, product_id: e.target.value }))} style={inp}>
                    <option value="">Select product…</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} — ${Number(p.price).toFixed(2)}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 80 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Qty *</label>
                  <input type="number" min="1" value={saleForm.qty} onChange={e => setSaleForm(f => ({ ...f, qty: e.target.value }))} style={inp} />
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Unit Price *</label>
                  <input type="number" step="0.01" value={saleForm.price} onChange={e => setSaleForm(f => ({ ...f, price: e.target.value }))} style={inp} />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Payment</label>
                  <select value={saleForm.payment_method} onChange={e => setSaleForm(f => ({ ...f, payment_method: e.target.value }))} style={inp}>
                    {["cash","card","mobile","check"].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Cashier</label>
                  <input value={saleForm.cashier} onChange={e => setSaleForm(f => ({ ...f, cashier: e.target.value }))} style={inp} />
                </div>
                <button type="submit" style={{ padding: "8px 20px", background: "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Process Sale</button>
              </form>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr style={{ borderBottom: "1px solid #1e293b" }}>{["Receipt #","Cashier","Customer","Subtotal","Tax","Total","Payment","Date"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 12 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
                    : transactions.length === 0 ? <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>No transactions yet</td></tr>
                    : transactions.map(t => (
                      <tr key={t.id} style={{ borderBottom: "1px solid #0f172a" }}>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{t.receipt_no}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{t.cashier || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>{t.customer_name || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>${Number(t.subtotal).toFixed(2)}</td>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>${Number(t.tax).toFixed(2)}</td>
                        <td style={{ padding: "12px 16px", color: "#22c55e", fontWeight: 600 }}>${Number(t.total).toFixed(2)}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ background: "#6366f122", color: "#6366f1", padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{t.payment_method}</span></td>
                        <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
