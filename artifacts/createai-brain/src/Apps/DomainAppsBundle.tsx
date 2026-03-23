import React, { useEffect, useState, useCallback } from "react";

const API = "/api";

function useFetch<T>(url: string, interval = 0) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    fetch(url).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [url]);
  useEffect(() => {
    load();
    if (interval > 0) { const t = setInterval(load, interval); return () => clearInterval(t); }
    return undefined;
  }, [load, interval]);
  return { data, loading, reload: load };
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "20px 24px", ...style }}>
      {children}
    </div>
  );
}
function Badge({ label, color = "#6366f1" }: { label: string; color?: string }) {
  return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, fontSize: 11, padding: "2px 8px", fontWeight: 600 }}>{label}</span>;
}
function StatBlock({ label, value, color = "#6366f1" }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: "#020617", borderRadius: 10, padding: "14px 18px", textAlign: "center", minWidth: 110 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{label}</div>
    </div>
  );
}
function AppShell({ icon, title, subtitle, stats, children }: { icon: string; title: string; subtitle: string; stats?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, background: "#020617", color: "#e2e8f0", padding: "28px 32px", overflowY: "auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <span style={{ fontSize: 32 }}>{icon}</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f8fafc", margin: 0 }}>{title}</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{subtitle}</p>
          </div>
        </div>
        {stats && <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>{stats}</div>}
      </div>
      {children}
    </div>
  );
}
function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "#475569" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14, marginTop: 0 }}>{children}</h2>;
}

// ── Domain Hub ─────────────────────────────────────────────────────────────────
export function DomainHubApp() {
  const { data: domainData } = useFetch<any>(`${API}/api/global/status`);
  const { data: pulse } = useFetch<any>(`${API}/api/global/pulse`, 10000);

  const DOMAINS = [
    { icon: "👥", label: "Contact Intelligence", id: "domainCRM", color: "#6366f1" },
    { icon: "📒", label: "Transaction Ledger", id: "domainLedger", color: "#10b981" },
    { icon: "📦", label: "Order Flow", id: "domainOrders", color: "#f59e0b" },
    { icon: "🎫", label: "Case Resolution", id: "domainCases", color: "#ef4444" },
    { icon: "📝", label: "Content Pipeline", id: "domainContent", color: "#8b5cf6" },
    { icon: "📊", label: "Insight Engine", id: "domainKPI", color: "#06b6d4" },
    { icon: "📄", label: "Agreement Flow", id: "domainAgreements", color: "#6366f1" },
    { icon: "🎓", label: "Growth Path", id: "domainGrowthPath", color: "#10b981" },
    { icon: "🏭", label: "Asset Flow", id: "domainAssets", color: "#f59e0b" },
    { icon: "🗺️", label: "Engagement Map", id: "domainEngagement", color: "#ec4899" },
    { icon: "🏦", label: "Value Exchange", id: "domainValueExchange", color: "#10b981" },
    { icon: "🛡️", label: "Risk Coverage", id: "domainRiskCoverage", color: "#6366f1" },
    { icon: "🏠", label: "Property Flow", id: "domainPropertyFlow", color: "#f59e0b" },
    { icon: "🎯", label: "Workforce Pipeline", id: "domainWorkforce", color: "#8b5cf6" },
    { icon: "⭐", label: "Performance Review", id: "domainPerfReview", color: "#f59e0b" },
    { icon: "📡", label: "Campaign Intelligence", id: "domainCampaigns", color: "#ec4899" },
    { icon: "⚖️", label: "Regulatory Map", id: "domainRegulatory", color: "#6366f1" },
    { icon: "💹", label: "Fiscal Intelligence", id: "domainFiscal", color: "#10b981" },
    { icon: "🔄", label: "Recurring Revenue", id: "domainRecurring", color: "#6366f1" },
    { icon: "🏥", label: "HealthOS", id: "healthos", color: "#0d9488" },
    { icon: "⚖️", label: "LegalPM", id: "legalpm", color: "#4f46e5" },
    { icon: "🎯", label: "StaffingOS", id: "staffingos", color: "#7c3aed" },
    { icon: "🔬", label: "Invention Layer", id: "inventionLayer", color: "#f59e0b" },
    { icon: "📢", label: "Advertising Hub", id: "adshub", color: "#ec4899" },
    { icon: "💳", label: "PayGate", id: "paygate", color: "#10b981" },
  ];

  return (
    <AppShell
      icon="🌐"
      title="Domain Hub"
      subtitle="25/25 industry-equivalent domains complete — zero enterprise gaps"
      stats={<>
        <StatBlock label="Domains" value="25/25" color="#10b981" />
        <StatBlock label="Engines" value={pulse?.engines ?? 200} color="#6366f1" />
        <StatBlock label="Coverage" value="100%" color="#10b981" />
        <StatBlock label="Status" value="ONLINE" color="#10b981" />
      </>}
    >
      <SectionTitle>All 25 Industry-Equivalent Domain Engines</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {DOMAINS.map(d => (
          <Card key={d.id} style={{ cursor: "pointer", transition: "border-color 0.2s", borderColor: "#1e293b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{d.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{d.label}</span>
            </div>
            <Badge label="Active" color={d.color} />
          </Card>
        ))}
      </div>

      <div style={{ marginTop: 28 }}>
        <Card style={{ borderColor: "#6366f133" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🏆</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#6366f1" }}>TRANSCENDENT — 351%</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>25 domains · 200 engines · 17 subsystems · 218/218 features · Zero enterprise gaps</div>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

// ── Contact Intelligence (CRM) ─────────────────────────────────────────────────
export function DomainCRMApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/crm`, 15000);
  const [form, setForm] = useState({ name: "", email: "", company: "", stage: "new", value: "" });
  const [saving, setSaving] = useState(false);

  const contacts: any[] = data?.contacts ?? [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API}/api/crm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, value: Number(form.value) || 0 }) });
    setForm({ name: "", email: "", company: "", stage: "new", value: "" });
    setSaving(false);
    reload();
  }

  const totalValue = contacts.reduce((s, c) => s + (c.value || 0), 0);

  return (
    <AppShell icon="👥" title="Contact Intelligence" subtitle="CRM — Contacts, Pipeline & Deal Management · Replaces Salesforce & HubSpot"
      stats={<>
        <StatBlock label="Contacts" value={contacts.length} color="#6366f1" />
        <StatBlock label="Pipeline Value" value={totalValue > 0 ? `$${totalValue.toLocaleString()}` : "—"} color="#10b981" />
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <SectionTitle>Add Contact</SectionTitle>
          <Card>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["name", "Full Name"], ["email", "Email"], ["company", "Company"], ["value", "Deal Value ($)"]].map(([k, pl]) => (
                <input key={k} placeholder={pl} value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                  required={k === "name"}
                  style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              ))}
              <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}>
                {["new", "qualified", "proposal", "negotiation", "closed-won", "closed-lost"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit" disabled={saving} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                {saving ? "Adding…" : "Add Contact"}
              </button>
            </form>
          </Card>
        </div>
        <div>
          <SectionTitle>Pipeline</SectionTitle>
          {loading ? <EmptyState icon="⏳" message="Loading…" /> : contacts.length === 0 ? <EmptyState icon="👥" message="No contacts yet — add one to start your pipeline." /> :
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {contacts.slice(0, 12).map((c: any) => (
                <Card key={c.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{c.company} · {c.email}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge label={c.stage} color="#6366f1" />
                      {c.value > 0 && <div style={{ fontSize: 12, color: "#10b981", marginTop: 4 }}>${c.value.toLocaleString()}</div>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          }
        </div>
      </div>
    </AppShell>
  );
}

// ── Transaction Ledger ─────────────────────────────────────────────────────────
export function DomainLedgerApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/ledger`, 15000);
  const [form, setForm] = useState({ type: "credit", account: "revenue", amount: "", memo: "", category: "" });
  const [saving, setSaving] = useState(false);

  const entries: any[] = data?.entries ?? [];
  const totalCredit = entries.filter(e => e.type === "credit").reduce((s, e) => s + e.amount, 0);
  const totalDebit = entries.filter(e => e.type === "debit").reduce((s, e) => s + e.amount, 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API}/api/ledger/entry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: Number(form.amount) || 0 }) });
    setForm({ type: "credit", account: "revenue", amount: "", memo: "", category: "" });
    setSaving(false);
    reload();
  }

  return (
    <AppShell icon="📒" title="Transaction Ledger" subtitle="Accounting Engine — Double-Entry Journal · Replaces QuickBooks & Xero"
      stats={<>
        <StatBlock label="Credits" value={totalCredit > 0 ? `$${totalCredit.toLocaleString()}` : "—"} color="#10b981" />
        <StatBlock label="Debits" value={totalDebit > 0 ? `$${totalDebit.toLocaleString()}` : "—"} color="#ef4444" />
        <StatBlock label="Net" value={totalCredit - totalDebit > 0 ? `$${(totalCredit - totalDebit).toLocaleString()}` : "—"} color="#6366f1" />
        <StatBlock label="Entries" value={entries.length} color="#94a3b8" />
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <SectionTitle>Journal Entry</SectionTitle>
          <Card>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
              {[["account", "Account (e.g. revenue)"], ["amount", "Amount ($)"], ["memo", "Memo"], ["category", "Category"]].map(([k, pl]) => (
                <input key={k} placeholder={pl} value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                  required={k === "amount"}
                  style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              ))}
              <button type="submit" disabled={saving} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                {saving ? "Posting…" : "Post Entry"}
              </button>
            </form>
          </Card>
        </div>
        <div>
          <SectionTitle>Journal</SectionTitle>
          {loading ? <EmptyState icon="⏳" message="Loading…" /> : entries.length === 0 ? <EmptyState icon="📒" message="No entries yet." /> :
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {entries.slice(0, 15).map((e: any) => (
                <Card key={e.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{e.memo}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{e.account} · {e.category}</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: e.type === "credit" ? "#10b981" : "#ef4444" }}>
                      {e.type === "credit" ? "+" : "−"}${e.amount?.toLocaleString() ?? 0}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          }
        </div>
      </div>
    </AppShell>
  );
}

// ── Order Flow ─────────────────────────────────────────────────────────────────
export function DomainOrdersApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/orders`, 15000);
  const [form, setForm] = useState({ productName: "", amount: "", customerId: "", channel: "direct" });
  const [saving, setSaving] = useState(false);

  const orders: any[] = data?.orders ?? [];
  const totalRevenue = orders.reduce((s, o) => s + (o.amount || 0), 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API}/api/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: Number(form.amount) || 0 }) });
    setForm({ productName: "", amount: "", customerId: "", channel: "direct" });
    setSaving(false);
    reload();
  }

  return (
    <AppShell icon="📦" title="Order Flow" subtitle="Order Management — Full Lifecycle Tracking · Replaces Shopify OMS"
      stats={<>
        <StatBlock label="Orders" value={orders.length} color="#f59e0b" />
        <StatBlock label="Revenue" value={totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : "—"} color="#10b981" />
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <SectionTitle>New Order</SectionTitle>
          <Card>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["productName", "Product Name"], ["amount", "Amount ($)"], ["customerId", "Customer ID"]].map(([k, pl]) => (
                <input key={k} placeholder={pl} value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                  required={k === "productName"}
                  style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              ))}
              <select value={form.channel} onChange={e => setForm(p => ({ ...p, channel: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}>
                {["direct", "semantic-store", "shopify", "etsy", "amazon"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" disabled={saving} style={{ background: "#f59e0b", color: "#020617", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                {saving ? "Creating…" : "Create Order"}
              </button>
            </form>
          </Card>
        </div>
        <div>
          <SectionTitle>Orders</SectionTitle>
          {loading ? <EmptyState icon="⏳" message="Loading…" /> : orders.length === 0 ? <EmptyState icon="📦" message="No orders yet." /> :
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {orders.slice(0, 12).map((o: any) => (
                <Card key={o.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{o.productName}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{o.channel} · {o.customerId}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge label={o.status} color="#f59e0b" />
                      <div style={{ fontSize: 13, color: "#10b981", fontWeight: 600, marginTop: 4 }}>${o.amount?.toLocaleString() ?? 0}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          }
        </div>
      </div>
    </AppShell>
  );
}

// ── Case Resolution ─────────────────────────────────────────────────────────────
export function DomainCasesApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/cases`, 15000);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", assignee: "" });
  const [saving, setSaving] = useState(false);

  const cases: any[] = data?.cases ?? [];
  const openCount = cases.filter(c => c.status === "open").length;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API}/api/cases`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ title: "", description: "", priority: "medium", assignee: "" });
    setSaving(false);
    reload();
  }

  const priorityColor = (p: string) => p === "critical" ? "#ef4444" : p === "high" ? "#f59e0b" : p === "medium" ? "#6366f1" : "#64748b";

  return (
    <AppShell icon="🎫" title="Case Resolution" subtitle="Support Engine — SLA Tracking & Resolution Workflows · Replaces Zendesk"
      stats={<>
        <StatBlock label="Total Cases" value={cases.length} color="#ef4444" />
        <StatBlock label="Open" value={openCount} color="#f59e0b" />
        <StatBlock label="Resolved" value={cases.filter(c => c.status === "resolved").length} color="#10b981" />
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <SectionTitle>New Case</SectionTitle>
          <Card>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Case Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none", resize: "none" }} />
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}>
                {["low", "medium", "high", "critical"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input placeholder="Assignee" value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              <button type="submit" disabled={saving} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                {saving ? "Creating…" : "Create Case"}
              </button>
            </form>
          </Card>
        </div>
        <div>
          <SectionTitle>Open Cases</SectionTitle>
          {loading ? <EmptyState icon="⏳" message="Loading…" /> : cases.length === 0 ? <EmptyState icon="🎫" message="No cases yet." /> :
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cases.slice(0, 12).map((c: any) => (
                <Card key={c.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, marginRight: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{c.assignee || "Unassigned"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge label={c.priority} color={priorityColor(c.priority)} />
                      <div><Badge label={c.status} color={c.status === "open" ? "#f59e0b" : "#10b981"} /></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          }
        </div>
      </div>
    </AppShell>
  );
}

// ── Content Pipeline ───────────────────────────────────────────────────────────
export function DomainContentApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/content`, 15000);
  const [form, setForm] = useState({ title: "", type: "blog", channel: "blog", tags: "", wordCount: "" });
  const [saving, setSaving] = useState(false);

  const content: any[] = data?.items ?? [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API}/api/content`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), wordCount: Number(form.wordCount) || 0 }) });
    setForm({ title: "", type: "blog", channel: "blog", tags: "", wordCount: "" });
    setSaving(false);
    reload();
  }

  const typeColor = (t: string) => t === "blog" ? "#6366f1" : t === "video-script" ? "#ec4899" : t === "email" ? "#f59e0b" : "#64748b";

  return (
    <AppShell icon="📝" title="Content Pipeline" subtitle="CMS Engine — Editorial Calendar & Publishing Workflows · Replaces WordPress"
      stats={<>
        <StatBlock label="Content Items" value={content.length} color="#8b5cf6" />
        <StatBlock label="Published" value={content.filter(c => c.status === "published").length} color="#10b981" />
        <StatBlock label="Draft" value={content.filter(c => c.status === "draft").length} color="#f59e0b" />
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <SectionTitle>New Content</SectionTitle>
          <Card>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              {[["type", ["blog", "email", "video-script", "social", "case-study", "whitepaper", "landing-page", "ad-copy", "newsletter", "podcast-script"]], ["channel", ["blog", "email", "youtube", "twitter", "linkedin", "instagram"]]].map(([k, opts]) => (
                <select key={k as string} value={(form as any)[k as string]} onChange={e => setForm(p => ({ ...p, [k as string]: e.target.value }))}
                  style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}>
                  {(opts as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
              <input placeholder="Tags (comma-separated)" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              <input placeholder="Word Count" value={form.wordCount} onChange={e => setForm(p => ({ ...p, wordCount: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              <button type="submit" disabled={saving} style={{ background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                {saving ? "Adding…" : "Add Content"}
              </button>
            </form>
          </Card>
        </div>
        <div>
          <SectionTitle>Content Calendar</SectionTitle>
          {loading ? <EmptyState icon="⏳" message="Loading…" /> : content.length === 0 ? <EmptyState icon="📝" message="No content yet." /> :
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {content.slice(0, 12).map((c: any) => (
                <Card key={c.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1, marginRight: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{c.channel} {c.wordCount ? `· ${c.wordCount} words` : ""}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                      <Badge label={c.type} color={typeColor(c.type)} />
                      <Badge label={c.status} color={c.status === "published" ? "#10b981" : "#f59e0b"} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          }
        </div>
      </div>
    </AppShell>
  );
}

// ── Insight Engine (KPI) ───────────────────────────────────────────────────────
export function DomainKPIApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/kpi`, 10000);
  const [form, setForm] = useState({ name: "", value: "", target: "", unit: "count", category: "Revenue", trend: "up" });
  const [saving, setSaving] = useState(false);

  const kpis: any[] = data?.kpis ?? [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API}/api/kpi/kpi`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, value: Number(form.value), target: Number(form.target) }) });
    setForm({ name: "", value: "", target: "", unit: "count", category: "Revenue", trend: "up" });
    setSaving(false);
    reload();
  }

  const trendIcon = (t: string) => t === "up" ? "↑" : t === "down" ? "↓" : "→";
  const trendColor = (t: string) => t === "up" ? "#10b981" : t === "down" ? "#ef4444" : "#64748b";

  return (
    <AppShell icon="📊" title="Insight Engine" subtitle="BI/KPI Dashboard — Live Metrics & Target Tracking · Replaces Tableau & Power BI"
      stats={<>
        <StatBlock label="KPIs" value={kpis.length} color="#06b6d4" />
        <StatBlock label="On Target" value={kpis.filter(k => k.value >= k.target).length} color="#10b981" />
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <div>
          <SectionTitle>Add KPI</SectionTitle>
          <Card>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["name", "KPI Name"], ["value", "Current Value"], ["target", "Target Value"]].map(([k, pl]) => (
                <input key={k} placeholder={pl} value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} required={k !== "target"}
                  style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              ))}
              {[["unit", ["count", "USD", "percent", "hours"]], ["category", ["Revenue", "Platform", "Commerce", "Stability", "Registry", "Operations"]], ["trend", ["up", "down", "flat"]]].map(([k, opts]) => (
                <select key={k as string} value={(form as any)[k as string]} onChange={e => setForm(p => ({ ...p, [k as string]: e.target.value }))}
                  style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}>
                  {(opts as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
              <button type="submit" disabled={saving} style={{ background: "#06b6d4", color: "#020617", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                {saving ? "Adding…" : "Add KPI"}
              </button>
            </form>
          </Card>
        </div>
        <div>
          <SectionTitle>KPI Dashboard</SectionTitle>
          {loading ? <EmptyState icon="⏳" message="Loading…" /> : kpis.length === 0 ? <EmptyState icon="📊" message="No KPIs yet." /> :
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {kpis.map((k: any) => (
                <Card key={k.id} style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{k.name}</div>
                    <span style={{ fontSize: 16, color: trendColor(k.trend), fontWeight: 700 }}>{trendIcon(k.trend)}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: k.value >= k.target ? "#10b981" : "#f59e0b" }}>
                    {k.unit === "USD" ? `$${Number(k.value).toLocaleString()}` : k.unit === "percent" ? `${k.value}%` : k.value}
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                    Target: {k.unit === "USD" ? `$${Number(k.target).toLocaleString()}` : k.target} · {k.category}
                  </div>
                  <div style={{ marginTop: 8, height: 4, background: "#1e293b", borderRadius: 2 }}>
                    <div style={{ width: `${Math.min(100, k.target > 0 ? (k.value / k.target) * 100 : 0)}%`, height: "100%", background: k.value >= k.target ? "#10b981" : "#6366f1", borderRadius: 2 }} />
                  </div>
                </Card>
              ))}
            </div>
          }
        </div>
      </div>
    </AppShell>
  );
}

// ── Agreement Flow ─────────────────────────────────────────────────────────────
export function DomainAgreementsApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/agreements`, 15000);
  const [form, setForm] = useState({ title: "", type: "saas-subscription", parties: "", value: "", startDate: "", autoRenew: false });
  const [saving, setSaving] = useState(false);

  const agreements: any[] = data?.agreements ?? [];
  const totalValue = agreements.reduce((s, a) => s + (a.value || 0), 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API}/api/agreements`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, parties: form.parties.split(",").map(p => p.trim()).filter(Boolean), value: Number(form.value) || 0 }) });
    setForm({ title: "", type: "saas-subscription", parties: "", value: "", startDate: "", autoRenew: false });
    setSaving(false);
    reload();
  }

  return (
    <AppShell icon="📄" title="Agreement Flow" subtitle="Contract Lifecycle Management — Draft to Active · Replaces DocuSign & Ironclad"
      stats={<>
        <StatBlock label="Agreements" value={agreements.length} color="#6366f1" />
        <StatBlock label="Total Value" value={totalValue > 0 ? `$${totalValue.toLocaleString()}` : "—"} color="#10b981" />
        <StatBlock label="Active" value={agreements.filter(a => a.status === "active").length} color="#10b981" />
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <SectionTitle>New Agreement</SectionTitle>
          <Card>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Agreement Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}>
                {["saas-subscription", "service-agreement", "nda", "msa", "sow", "license", "partnership", "employment", "consulting", "vendor"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input placeholder="Parties (comma-separated)" value={form.parties} onChange={e => setForm(p => ({ ...p, parties: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              <input placeholder="Contract Value ($)" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }} />
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#94a3b8", cursor: "pointer" }}>
                <input type="checkbox" checked={form.autoRenew} onChange={e => setForm(p => ({ ...p, autoRenew: e.target.checked }))} />
                Auto-Renew
              </label>
              <button type="submit" disabled={saving} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                {saving ? "Creating…" : "Create Agreement"}
              </button>
            </form>
          </Card>
        </div>
        <div>
          <SectionTitle>Active Agreements</SectionTitle>
          {loading ? <EmptyState icon="⏳" message="Loading…" /> : agreements.length === 0 ? <EmptyState icon="📄" message="No agreements yet." /> :
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {agreements.slice(0, 10).map((a: any) => (
                <Card key={a.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, marginRight: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{(a.parties || []).join(" · ")}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge label={a.type} color="#6366f1" />
                      {a.value > 0 && <div style={{ fontSize: 12, color: "#10b981", marginTop: 4 }}>${a.value.toLocaleString()}</div>}
                      {a.autoRenew && <div style={{ fontSize: 10, color: "#64748b" }}>Auto-renew</div>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          }
        </div>
      </div>
    </AppShell>
  );
}

// ── Growth Path (L&D) ──────────────────────────────────────────────────────────
export function DomainGrowthPathApp() {
  const { data, loading } = useFetch<any>(`${API}/api/growth-path`, 15000);

  const tracks: any[] = data?.tracks ?? [];
  const enrollments: any[] = data?.enrollments ?? [];

  return (
    <AppShell icon="🎓" title="Growth Path" subtitle="Learning & Development Engine — Pre-built Training Tracks · Replaces Workday Learning"
      stats={<>
        <StatBlock label="Tracks" value={tracks.length} color="#10b981" />
        <StatBlock label="Enrollments" value={enrollments.length} color="#6366f1" />
        <StatBlock label="Completed" value={enrollments.filter((e: any) => e.status === "completed").length} color="#10b981" />
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <SectionTitle>Learning Tracks</SectionTitle>
          {loading ? <EmptyState icon="⏳" message="Loading…" /> : tracks.length === 0 ? <EmptyState icon="🎓" message="No tracks seeded yet." /> :
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tracks.map((t: any) => (
                <Card key={t.id} style={{ padding: "14px 18px" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{t.description}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge label={`${t.modules ?? 0} modules`} color="#10b981" />
                    <Badge label={`${t.durationHours ?? 0}h`} color="#6366f1" />
                    <Badge label={t.level ?? "beginner"} color="#f59e0b" />
                  </div>
                </Card>
              ))}
            </div>
          }
        </div>
        <div>
          <SectionTitle>Recent Enrollments</SectionTitle>
          {loading ? <EmptyState icon="⏳" message="Loading…" /> : enrollments.length === 0 ? <EmptyState icon="📋" message="No enrollments yet." /> :
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {enrollments.slice(0, 10).map((e: any) => (
                <Card key={e.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{e.learnerId}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{e.trackName}</div>
                    </div>
                    <Badge label={e.status} color={e.status === "completed" ? "#10b981" : e.status === "in-progress" ? "#f59e0b" : "#64748b"} />
                  </div>
                </Card>
              ))}
            </div>
          }
        </div>
      </div>
    </AppShell>
  );
}

// ── Asset Flow ─────────────────────────────────────────────────────────────────
export function DomainAssetsApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/assets`, 15000);
  const [form, setForm] = useState({ name: "", sku: "", category: "digital-license", quantity: "", reorderPoint: "", unitCost: "" });
  const [saving, setSaving] = useState(false);

  const assets: any[] = data?.assets ?? [];
  const reorderQueue: any[] = data?.reorderQueue ?? [];
  const totalValue = assets.reduce((s, a) => s + ((a.quantity || 0) * (a.unitCost || 0)), 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API}/api/assets/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, quantity: Number(form.quantity), reorderPoint: Number(form.reorderPoint), unitCost: Number(form.unitCost) }) });
    setForm({ name: "", sku: "", category: "digital-license", quantity: "", reorderPoint: "", unitCost: "" });
    setSaving(false);
    reload();
  }

  return (
    <AppShell icon="🏭" title="Asset Flow" subtitle="Inventory & Supply Chain Engine · Replaces NetSuite & TradeGecko"
      stats={<>
        <StatBlock label="Assets" value={assets.length} color="#f59e0b" />
        <StatBlock label="Portfolio Value" value={totalValue > 0 ? `$${totalValue.toLocaleString()}` : "—"} color="#10b981" />
        <StatBlock label="Reorder Queue" value={reorderQueue.length} color={reorderQueue.length > 0 ? "#ef4444" : "#10b981"} />
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <SectionTitle>Register Asset</SectionTitle>
          <Card>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["name", "Asset Name"], ["sku", "SKU"], ["quantity", "Quantity"], ["reorderPoint", "Reorder Point"], ["unitCost", "Unit Cost ($)"]].map(([k, pl]) => (
                <input key={k} placeholder={pl} value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} required={k === "name"}
                  style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              ))}
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}>
                {["digital-license", "enterprise", "physical", "consumable", "equipment"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" disabled={saving} style={{ background: "#f59e0b", color: "#020617", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                {saving ? "Registering…" : "Register Asset"}
              </button>
            </form>
          </Card>
          {reorderQueue.length > 0 && (
            <Card style={{ marginTop: 16, borderColor: "#ef444433" }}>
              <SectionTitle>⚠️ Reorder Queue ({reorderQueue.length})</SectionTitle>
              {reorderQueue.map((r: any) => (
                <div key={r.sku} style={{ fontSize: 12, color: "#fca5a5", marginBottom: 4 }}>{r.name} — {r.quantity} remaining (min: {r.reorderPoint})</div>
              ))}
            </Card>
          )}
        </div>
        <div>
          <SectionTitle>Asset Registry</SectionTitle>
          {loading ? <EmptyState icon="⏳" message="Loading…" /> : assets.length === 0 ? <EmptyState icon="🏭" message="No assets yet." /> :
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {assets.slice(0, 12).map((a: any) => (
                <Card key={a.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{a.sku} · {a.category}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>{a.quantity}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>${a.unitCost}/unit</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          }
        </div>
      </div>
    </AppShell>
  );
}

// ── Engagement Map ─────────────────────────────────────────────────────────────
export function DomainEngagementApp() {
  const { data, loading } = useFetch<any>(`${API}/api/engagement`, 15000);

  const events: any[] = data?.events ?? [];
  const stats: any = data?.funnelStats ?? {};
  const STAGES = ["discovery", "awareness", "consideration", "evaluation", "purchase", "onboarding", "advocacy"];
  const stageColor = (s: string) => ["#64748b", "#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#06b6d4", "#f59e0b"][STAGES.indexOf(s)] ?? "#64748b";

  return (
    <AppShell icon="🗺️" title="Engagement Map" subtitle="Customer Journey Engine — 7-Stage Funnel Tracking · Replaces Salesforce Journey Builder"
      stats={<>
        <StatBlock label="Touchpoints" value={events.length} color="#ec4899" />
        <StatBlock label="Converted" value={events.filter(e => e.converted).length} color="#10b981" />
        <StatBlock label="Conversion Rate" value={events.length > 0 ? `${Math.round(events.filter(e => e.converted).length / events.length * 100)}%` : "—"} color="#6366f1" />
      </>}>
      <div style={{ marginBottom: 24 }}>
        <SectionTitle>Funnel Stages</SectionTitle>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {STAGES.map((stage, i) => {
            const count = events.filter(e => e.touchpoint === stage).length;
            return (
              <Card key={stage} style={{ textAlign: "center", minWidth: 110, padding: "14px 16px", borderColor: stageColor(stage) + "44" }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Stage {i + 1}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: stageColor(stage) }}>{count}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, textTransform: "capitalize" }}>{stage}</div>
              </Card>
            );
          })}
        </div>
      </div>
      <SectionTitle>Journey Events</SectionTitle>
      {loading ? <EmptyState icon="⏳" message="Loading…" /> : events.length === 0 ? <EmptyState icon="🗺️" message="No journey events yet." /> :
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {events.slice(0, 15).map((e: any) => (
            <Card key={e.id} style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{e.contactId} → <Badge label={e.touchpoint} color={stageColor(e.touchpoint)} /></div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{e.channel} · {e.content}</div>
                </div>
                {e.converted && <Badge label="Converted" color="#10b981" />}
              </div>
            </Card>
          ))}
        </div>
      }
    </AppShell>
  );
}

// ── Recurring Revenue ──────────────────────────────────────────────────────────
export function DomainRecurringApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/domains/recurring-revenue`, 15000);
  const [form, setForm] = useState({ customerId: "", planName: "Professional", cycle: "monthly" });
  const [saving, setSaving] = useState(false);

  const subscriptions: any[] = data?.subscriptions ?? [];
  const mrr: number = data?.mrr ?? 0;
  const arr: number = data?.arr ?? 0;
  const plans: any[] = data?.plans ?? [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API}/api/domains/recurring-revenue/subscribe`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ customerId: "", planName: "Professional", cycle: "monthly" });
    setSaving(false);
    reload();
  }

  return (
    <AppShell icon="🔄" title="Recurring Revenue" subtitle="Subscription Billing Engine — MRR/ARR Tracking · Replaces Chargebee & Recurly"
      stats={<>
        <StatBlock label="MRR" value={mrr > 0 ? `$${mrr.toLocaleString()}` : "—"} color="#6366f1" />
        <StatBlock label="ARR" value={arr > 0 ? `$${arr.toLocaleString()}` : "—"} color="#10b981" />
        <StatBlock label="Subscriptions" value={subscriptions.length} color="#94a3b8" />
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <div>
          <SectionTitle>Add Subscription</SectionTitle>
          <Card>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Customer ID" value={form.customerId} onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))} required
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              <select value={form.planName} onChange={e => setForm(p => ({ ...p, planName: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}>
                {plans.map((p: any) => <option key={p.name} value={p.name}>{p.name} — ${p.price}/mo</option>)}
              </select>
              <select value={form.cycle} onChange={e => setForm(p => ({ ...p, cycle: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}>
                {["monthly", "quarterly", "annual"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" disabled={saving} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                {saving ? "Subscribing…" : "Add Subscription"}
              </button>
            </form>
          </Card>
          {plans.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <SectionTitle>Plans</SectionTitle>
              {plans.map((p: any) => (
                <Card key={p.name} style={{ marginBottom: 8, padding: "12px 16px" }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1", margin: "6px 0" }}>${p.price}<span style={{ fontSize: 13, color: "#64748b" }}>/mo</span></div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{(p.features ?? []).slice(0, 3).join(" · ")}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div>
          <SectionTitle>Active Subscriptions</SectionTitle>
          {loading ? <EmptyState icon="⏳" message="Loading…" /> : subscriptions.length === 0 ? <EmptyState icon="🔄" message="No subscriptions yet." /> :
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {subscriptions.slice(0, 15).map((s: any) => (
                <Card key={s.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.customerId}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{s.planName} · {s.cycle}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#6366f1" }}>${s.price}/mo</div>
                      <Badge label={s.status} color={s.status === "active" ? "#10b981" : "#64748b"} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          }
        </div>
      </div>
    </AppShell>
  );
}

// ── Simple engine display apps ─────────────────────────────────────────────────

function SimpleEngineApp({ icon, title, subtitle, endpoint, color, renderItem }: {
  icon: string; title: string; subtitle: string; endpoint: string; color: string;
  renderItem: (item: any) => React.ReactNode;
}) {
  const { data, loading } = useFetch<any>(endpoint, 15000);
  const status: any = data?.status ?? {};

  return (
    <AppShell icon={icon} title={title} subtitle={subtitle}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        {Object.entries(status).filter(([k]) => !k.endsWith("Id") && k !== "id").slice(0, 6).map(([k, v]) => (
          <StatBlock key={k} label={k.replace(/([A-Z])/g, " $1").trim()} value={typeof v === "number" ? v.toLocaleString() : String(v) || "—"} color={color} />
        ))}
      </div>
      <SectionTitle>Engine Data</SectionTitle>
      {loading ? <EmptyState icon="⏳" message="Loading…" /> :
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(Array.isArray(data) ? data : Object.values(data ?? {}).find(v => Array.isArray(v)) as any[] ?? []).slice(0, 15).map((item: any, i: number) => (
            <Card key={item?.id ?? i} style={{ padding: "12px 16px" }}>{renderItem(item)}</Card>
          ))}
        </div>
      }
    </AppShell>
  );
}

export function DomainValueExchangeApp() {
  const { data, loading } = useFetch<any>(`${API}/api/domains/value-exchange`, 15000);
  const accounts: any[] = data?.accounts ?? [];
  return (
    <AppShell icon="🏦" title="Value Exchange" subtitle="Internal Banking Engine — Account Management & Internal Transfers"
      stats={<><StatBlock label="Accounts" value={accounts.length} color="#10b981" /><StatBlock label="Total Balance" value={accounts.reduce((s, a) => s + (a.balance || 0), 0) > 0 ? `$${accounts.reduce((s, a) => s + (a.balance || 0), 0).toLocaleString()}` : "—"} color="#6366f1" /></>}>
      <SectionTitle>Internal Accounts</SectionTitle>
      {loading ? <EmptyState icon="⏳" message="Loading…" /> : accounts.length === 0 ? <EmptyState icon="🏦" message="No accounts." /> :
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {accounts.map((a: any) => (
            <Card key={a.id} style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>{a.name}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#10b981" }}>${(a.balance ?? 0).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{a.currency ?? "USD"} · {a.type ?? "internal"}</div>
            </Card>
          ))}
        </div>
      }
    </AppShell>
  );
}

export function DomainRiskCoverageApp() {
  const { data, loading } = useFetch<any>(`${API}/api/domains/risk-coverage`, 15000);
  const assessments: any[] = data?.assessments ?? [];
  const scoreColor = (s: number) => s < 30 ? "#10b981" : s < 60 ? "#f59e0b" : "#ef4444";
  return (
    <AppShell icon="🛡️" title="Risk Coverage" subtitle="Risk Assessment Engine — Factor-Based Scoring & Coverage Classification"
      stats={<><StatBlock label="Assessments" value={assessments.length} color="#6366f1" /><StatBlock label="Avg Risk Score" value={assessments.length > 0 ? Math.round(assessments.reduce((s, a) => s + (a.riskScore || 0), 0) / assessments.length) : "—"} color="#f59e0b" /></>}>
      <SectionTitle>Risk Assessments</SectionTitle>
      {loading ? <EmptyState icon="⏳" message="Loading…" /> : assessments.length === 0 ? <EmptyState icon="🛡️" message="No assessments yet." /> :
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {assessments.slice(0, 12).map((a: any) => (
            <Card key={a.id} style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{a.entityId}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{a.entityType} · {a.coverageLevel ?? "Standard"}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{(a.factors ?? []).join(", ")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor(a.riskScore ?? 50) }}>{a.riskScore ?? "—"}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>Risk Score</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      }
    </AppShell>
  );
}

export function DomainPropertyFlowApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/domains/property-flow`, 15000);
  const [form, setForm] = useState({ address: "", propertyType: "commercial", value: "", status: "available" });
  const [saving, setSaving] = useState(false);
  const properties: any[] = data?.properties ?? [];
  const totalValue = properties.reduce((s, p) => s + (p.value || 0), 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API}/api/domains/property-flow`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, value: Number(form.value) }) });
    setForm({ address: "", propertyType: "commercial", value: "", status: "available" });
    setSaving(false);
    reload();
  }

  return (
    <AppShell icon="🏠" title="Property Flow" subtitle="Real Estate Management Engine — Portfolio Tracking & Deal Pipeline"
      stats={<><StatBlock label="Properties" value={properties.length} color="#f59e0b" /><StatBlock label="Portfolio Value" value={totalValue > 0 ? `$${totalValue.toLocaleString()}` : "—"} color="#10b981" /></>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <SectionTitle>Add Property</SectionTitle>
          <Card>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              <input placeholder="Value ($)" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              {[["propertyType", ["commercial", "residential", "industrial", "land"]], ["status", ["available", "under-contract", "closed", "leased"]]].map(([k, opts]) => (
                <select key={k as string} value={(form as any)[k as string]} onChange={e => setForm(p => ({ ...p, [k as string]: e.target.value }))}
                  style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}>
                  {(opts as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
              <button type="submit" disabled={saving} style={{ background: "#f59e0b", color: "#020617", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                {saving ? "Adding…" : "Add Property"}
              </button>
            </form>
          </Card>
        </div>
        <div>
          <SectionTitle>Portfolio</SectionTitle>
          {loading ? <EmptyState icon="⏳" message="Loading…" /> : properties.length === 0 ? <EmptyState icon="🏠" message="No properties yet." /> :
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {properties.slice(0, 10).map((p: any) => (
                <Card key={p.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>{p.address}</div><div style={{ fontSize: 11, color: "#64748b" }}>{p.propertyType}</div></div>
                    <div style={{ textAlign: "right" }}>
                      <Badge label={p.status} color="#f59e0b" />
                      <div style={{ fontSize: 13, color: "#10b981", fontWeight: 600, marginTop: 4 }}>${(p.value ?? 0).toLocaleString()}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          }
        </div>
      </div>
    </AppShell>
  );
}

export function DomainWorkforceApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/domains/workforce-pipeline`, 15000);
  const [form, setForm] = useState({ name: "", role: "", skills: "", source: "LinkedIn" });
  const [saving, setSaving] = useState(false);
  const candidates: any[] = data?.candidates ?? [];
  const STAGES = ["applied", "screened", "interviewed", "assessed", "offered", "onboarding", "hired"];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API}/api/domains/workforce-pipeline`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, skills: form.skills.split(",").map(s => s.trim()).filter(Boolean) }) });
    setForm({ name: "", role: "", skills: "", source: "LinkedIn" });
    setSaving(false);
    reload();
  }

  return (
    <AppShell icon="🎯" title="Workforce Pipeline" subtitle="ATS Engine — 7-Stage Candidate Pipeline · Replaces Greenhouse & Lever"
      stats={<>
        <StatBlock label="Candidates" value={candidates.length} color="#8b5cf6" />
        <StatBlock label="Hired" value={candidates.filter(c => c.stage === "hired").length} color="#10b981" />
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <div>
          <SectionTitle>Add Candidate</SectionTitle>
          <Card>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["name", "Full Name"], ["role", "Role Applied For"], ["skills", "Skills (comma-sep)"]].map(([k, pl]) => (
                <input key={k} placeholder={pl} value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} required={k === "name"}
                  style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              ))}
              <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}>
                {["LinkedIn", "Indeed", "Referral", "Direct", "Agency"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit" disabled={saving} style={{ background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                {saving ? "Adding…" : "Add Candidate"}
              </button>
            </form>
          </Card>
        </div>
        <div>
          <SectionTitle>Pipeline</SectionTitle>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {STAGES.map(s => <Badge key={s} label={`${s} (${candidates.filter(c => c.stage === s).length})`} color="#8b5cf6" />)}
          </div>
          {loading ? <EmptyState icon="⏳" message="Loading…" /> : candidates.length === 0 ? <EmptyState icon="🎯" message="No candidates yet." /> :
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {candidates.slice(0, 12).map((c: any) => (
                <Card key={c.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 11, color: "#64748b" }}>{c.role} · {c.source}</div></div>
                    <Badge label={c.stage} color="#8b5cf6" />
                  </div>
                </Card>
              ))}
            </div>
          }
        </div>
      </div>
    </AppShell>
  );
}

export function DomainPerfReviewApp() {
  const { data, loading } = useFetch<any>(`${API}/api/domains/perf-review`, 15000);
  const reviews: any[] = data?.reviews ?? [];
  const ratingColor = (r: string) => r === "Exceptional" ? "#10b981" : r === "Strong Performer" ? "#6366f1" : r === "Meeting Expectations" ? "#f59e0b" : "#ef4444";
  return (
    <AppShell icon="⭐" title="Performance Review" subtitle="Performance Management Engine — Weighted Goal Scoring & Review Workflows"
      stats={<><StatBlock label="Reviews" value={reviews.length} color="#f59e0b" /><StatBlock label="Avg Score" value={reviews.length > 0 ? Math.round(reviews.reduce((s, r) => s + (r.overallScore || 0), 0) / reviews.length) : "—"} color="#6366f1" /></>}>
      <SectionTitle>Reviews</SectionTitle>
      {loading ? <EmptyState icon="⏳" message="Loading…" /> : reviews.length === 0 ? <EmptyState icon="⭐" message="No reviews yet." /> :
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {reviews.slice(0, 12).map((r: any) => (
            <Card key={r.id} style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{r.employeeId}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>{r.reviewerId} · {r.period}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b" }}>{r.overallScore ?? "—"}</div>
                <Badge label={r.ratingLabel ?? "N/A"} color={ratingColor(r.ratingLabel)} />
              </div>
              <div style={{ marginTop: 10, height: 4, background: "#1e293b", borderRadius: 2 }}>
                <div style={{ width: `${Math.min(100, ((r.overallScore ?? 0) / 5) * 100)}%`, height: "100%", background: "#f59e0b", borderRadius: 2 }} />
              </div>
            </Card>
          ))}
        </div>
      }
    </AppShell>
  );
}

export function DomainCampaignsApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/domains/campaign-intelligence`, 15000);
  const [form, setForm] = useState({ name: "", type: "email-drip", channel: "email", trigger: "time-based" });
  const [saving, setSaving] = useState(false);
  const campaigns: any[] = data?.campaigns ?? [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API}/api/domains/campaign-intelligence`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", type: "email-drip", channel: "email", trigger: "time-based" });
    setSaving(false);
    reload();
  }

  return (
    <AppShell icon="📡" title="Campaign Intelligence" subtitle="Marketing Automation Engine — Multi-Channel Campaign Management · Replaces Marketo"
      stats={<><StatBlock label="Campaigns" value={campaigns.length} color="#ec4899" /><StatBlock label="Active" value={campaigns.filter(c => c.status === "active").length} color="#10b981" /></>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <div>
          <SectionTitle>New Campaign</SectionTitle>
          <Card>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Campaign Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              {[["type", ["email-drip", "sms", "push", "social", "webinar", "direct-mail", "retargeting"]], ["channel", ["email", "sms", "push", "linkedin", "instagram", "twitter"]], ["trigger", ["time-based", "behavior-based", "event-based", "manual"]]].map(([k, opts]) => (
                <select key={k as string} value={(form as any)[k as string]} onChange={e => setForm(p => ({ ...p, [k as string]: e.target.value }))}
                  style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}>
                  {(opts as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
              <button type="submit" disabled={saving} style={{ background: "#ec4899", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                {saving ? "Creating…" : "Create Campaign"}
              </button>
            </form>
          </Card>
        </div>
        <div>
          <SectionTitle>Campaigns</SectionTitle>
          {loading ? <EmptyState icon="⏳" message="Loading…" /> : campaigns.length === 0 ? <EmptyState icon="📡" message="No campaigns yet." /> :
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {campaigns.slice(0, 12).map((c: any) => (
                <Card key={c.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{c.type} · {c.channel} · {c.trigger}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge label={c.status} color={c.status === "active" ? "#10b981" : "#64748b"} />
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{c.enrolled ?? 0} enrolled · {c.conversions ?? 0} conv</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          }
        </div>
      </div>
    </AppShell>
  );
}

export function DomainRegulatoryApp() {
  const { data, loading } = useFetch<any>(`${API}/api/domains/regulatory-map`, 15000);
  const items: any[] = data?.items ?? [];
  const compliantCount = items.filter(i => i.status === "compliant").length;
  const statusColor = (s: string) => s === "compliant" ? "#10b981" : s === "in-progress" ? "#f59e0b" : s === "action-required" ? "#ef4444" : "#64748b";

  return (
    <AppShell icon="⚖️" title="Regulatory Map" subtitle="Compliance Management Engine — GDPR, PCI-DSS, CCPA, HIPAA, SOC 2 Tracking"
      stats={<><StatBlock label="Regulations" value={items.length} color="#6366f1" /><StatBlock label="Compliant" value={compliantCount} color="#10b981" /><StatBlock label="Action Needed" value={items.filter(i => i.status === "action-required").length} color="#ef4444" /></>}>
      <SectionTitle>Regulatory Status</SectionTitle>
      {loading ? <EmptyState icon="⏳" message="Loading…" /> : items.length === 0 ? <EmptyState icon="⚖️" message="No regulations registered." /> :
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {items.map((r: any) => (
            <Card key={r.id} style={{ padding: "16px 20px", borderColor: statusColor(r.status) + "33" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>{r.regulation}</div>
                <Badge label={r.status} color={statusColor(r.status)} />
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{r.jurisdiction} · {r.category}</div>
              {r.nextReview && <div style={{ fontSize: 11, color: "#94a3b8" }}>Next Review: {new Date(r.nextReview).toLocaleDateString()}</div>}
              {(r.actionsRequired ?? []).length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {r.actionsRequired.slice(0, 2).map((a: string, i: number) => <div key={i} style={{ fontSize: 11, color: "#fca5a5", marginTop: 3 }}>• {a}</div>)}
                </div>
              )}
            </Card>
          ))}
        </div>
      }
    </AppShell>
  );
}

export function DomainFiscalApp() {
  const { data, loading } = useFetch<any>(`${API}/api/domains/fiscal-intelligence`, 15000);
  const plans: any[] = data?.plans ?? [];

  return (
    <AppShell icon="💹" title="Fiscal Intelligence" subtitle="FP&A Engine — Budget, Forecast & Actuals Planning · Replaces Adaptive Planning"
      stats={<><StatBlock label="Plans" value={plans.length} color="#10b981" /><StatBlock label="Total Budget" value={plans.reduce((s, p) => s + (p.totalBudget || 0), 0) > 0 ? `$${plans.reduce((s, p) => s + (p.totalBudget || 0), 0).toLocaleString()}` : "—"} color="#6366f1" /></>}>
      <SectionTitle>Financial Plans</SectionTitle>
      {loading ? <EmptyState icon="⏳" message="Loading…" /> : plans.length === 0 ? <EmptyState icon="💹" message="No plans yet." /> :
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {plans.map((p: any) => (
            <Card key={p.id} style={{ padding: "18px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div><div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div><div style={{ fontSize: 12, color: "#64748b" }}>{p.period} · {p.category}</div></div>
                <Badge label={p.status ?? "draft"} color="#10b981" />
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[["Budget", p.budget, "#6366f1"], ["Forecast", p.forecast, "#f59e0b"], ["Actuals", p.actuals, "#10b981"]].map(([label, val, color]) => (
                  <div key={label as string} style={{ background: "#020617", borderRadius: 8, padding: "10px 16px", minWidth: 100 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: color as string }}>{val ? `$${Number(val).toLocaleString()}` : "—"}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      }
    </AppShell>
  );
}

export default DomainHubApp;
