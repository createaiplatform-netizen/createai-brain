import React, { useState, useEffect, useCallback } from "react";

type Endpoint = { id: number; name: string; url: string; events: string[]; enabled: boolean; created_at: string; secret_preview?: string };
type Delivery  = { id: number; endpoint_name: string | null; event_type: string; http_status: number | null; success: boolean; duration_ms: number | null; delivered_at: string };

const S: Record<string, React.CSSProperties> = {
  root:  { background: "#020617", minHeight: "100%", color: "#e2e8f0", fontFamily: "'Inter',system-ui,sans-serif", padding: "1.5rem", overflowY: "auto" as const },
  h1:    { fontSize: "1.25rem", fontWeight: 700, color: "#a5b4fc" },
  sub:   { fontSize: ".8rem", color: "#64748b", marginTop: ".2rem" },
  grid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem", marginTop: "1.25rem" },
  card:  { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "12px", padding: "1.25rem" },
  h2:    { fontSize: ".875rem", fontWeight: 600, color: "#c7d2fe", marginBottom: "1rem" },
  btn:   { background: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", padding: ".45rem .9rem", fontSize: ".8rem", cursor: "pointer", fontWeight: 600 },
  btnSm: { background: "rgba(99,102,241,.2)", color: "#a5b4fc", border: "none", borderRadius: "6px", padding: ".25rem .6rem", fontSize: ".75rem", cursor: "pointer" },
  inp:   { background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "8px", color: "#e2e8f0", padding: ".5rem .75rem", fontSize: ".8rem", width: "100%", boxSizing: "border-box" as const },
  label: { fontSize: ".8rem", color: "#94a3b8", display: "flex", flexDirection: "column" as const, gap: ".3rem" },
  row:   { padding: ".6rem 0", borderBottom: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "flex-start", gap: ".75rem" },
  chip:  { background: "rgba(99,102,241,.15)", color: "#a5b4fc", padding: ".1em .45em", borderRadius: "4px", fontSize: ".7rem" },
  toast: { background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)", borderRadius: "8px", padding: ".65rem 1rem", marginBottom: "1rem", fontSize: ".8rem", color: "#a5b4fc" },
  empty: { textAlign: "center" as const, color: "#64748b", padding: "2rem", fontStyle: "italic", fontSize: ".8rem" },
};

export function WebhookManagerApp() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [tab,   setTab]   = useState<"endpoints"|"deliveries"|"create">("endpoints");
  const [toast, setToast] = useState("");
  const [form,  setForm]  = useState({ name: "", url: "", events: "*" });
  const [loading, setLoading] = useState(true);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const [ep, dl] = await Promise.all([
      fetch("/api/webhook-mgr/endpoints",  { credentials: "include" }).then(r => r.json()).catch(() => ({ endpoints: [] })),
      fetch("/api/webhook-mgr/deliveries", { credentials: "include" }).then(r => r.json()).catch(() => ({ deliveries: [] })),
    ]);
    setEndpoints((ep as { endpoints: Endpoint[] }).endpoints ?? []);
    setDeliveries((dl as { deliveries: Delivery[] }).deliveries ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!form.name || !form.url) { notify("Name and URL are required"); return; }
    try { new URL(form.url); } catch { notify("Invalid URL"); return; }
    notify("Creating…");
    const events = form.events.split(",").map(e => e.trim()).filter(Boolean);
    const r = await fetch("/api/webhook-mgr/endpoints", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, url: form.url, events }),
    });
    if (r.ok) { notify("Endpoint created ✓"); setTab("endpoints"); setForm({ name: "", url: "", events: "*" }); void load(); }
    else notify("Failed — auth required");
  };

  const del = async (id: number) => {
    await fetch(`/api/webhook-mgr/endpoints/${id}`, { method: "DELETE", credentials: "include" });
    void load();
  };

  const testEndpoint = async (id: number) => {
    notify("Sending test delivery…");
    const r = await fetch(`/api/webhook-mgr/endpoints/${id}/test`, { method: "POST", credentials: "include" });
    const d = await r.json() as { ok: boolean; test?: { success: boolean; status: number } };
    notify(d.ok && d.test?.success ? `Test delivered ✓ (HTTP ${d.test.status})` : `Test failed — check endpoint`);
    setTimeout(() => load(), 1000);
  };

  return (
    <div style={S.root} role="main">
      <a href="#content" style={{ position: "absolute", left: -999, top: 0 }}>Skip to main</a>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div><div style={S.h1}>🔗 Webhook Manager</div><div style={S.sub}>HMAC-SHA256 signed outbound event delivery · {endpoints.length} endpoints</div></div>
        <div style={{ display: "flex", gap: ".5rem" }}>
          {(["endpoints","deliveries","create"] as const).map(t => (
            <button key={t} style={{ ...S.btnSm, background: tab === t ? "#6366f1" : "rgba(99,102,241,.2)", color: tab === t ? "#fff" : "#a5b4fc" }}
              onClick={() => setTab(t)}>{t === "create" ? "+ Add Endpoint" : t === "deliveries" ? "Deliveries" : "Endpoints"}</button>
          ))}
        </div>
      </div>

      {toast && <div style={S.toast} aria-live="polite">{toast}</div>}

      <div id="content">
        {/* Endpoints */}
        {tab === "endpoints" && (
          <div style={S.card}>
            <div style={S.h2}>Registered Endpoints</div>
            {loading ? <div style={S.empty}>Loading…</div> :
             endpoints.length === 0 ? <div style={S.empty}>No endpoints yet. Add your first endpoint →</div> :
             endpoints.map(e => (
              <div key={e.id} style={S.row}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".85rem", fontWeight: 600 }}>{e.name}</div>
                  <div style={{ fontSize: ".73rem", color: "#64748b", marginTop: ".2rem", wordBreak: "break-all" as const }}>{e.url}</div>
                  <div style={{ display: "flex", gap: ".3rem", marginTop: ".35rem", flexWrap: "wrap" as const }}>
                    {e.events.map(ev => <span key={ev} style={S.chip}>{ev}</span>)}
                    <span style={{ ...S.chip, background: e.enabled ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.1)", color: e.enabled ? "#22c55e" : "#ef4444" }}>
                      {e.enabled ? "● Active" : "○ Off"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: ".35rem" }}>
                  <button style={S.btnSm} onClick={() => testEndpoint(e.id)}>Test</button>
                  <button style={{ ...S.btnSm, color: "#ef4444" }} onClick={() => del(e.id)} aria-label={`Delete ${e.name}`}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Deliveries */}
        {tab === "deliveries" && (
          <div style={S.card}>
            <div style={S.h2}>Delivery Log</div>
            {loading ? <div style={S.empty}>Loading…</div> :
             deliveries.length === 0 ? <div style={S.empty}>No deliveries yet. Add an endpoint and trigger an event.</div> :
             deliveries.map(d => (
              <div key={d.id} style={S.row}>
                <span style={{ background: d.success ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.1)", color: d.success ? "#22c55e" : "#ef4444", padding: ".15em .5em", borderRadius: "4px", fontSize: ".72rem", fontWeight: 600 }}>
                  {d.http_status ?? "—"}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".8rem" }}>{d.endpoint_name ?? "Unknown"} <span style={{ color: "#6366f1", fontSize: ".72rem" }}>{d.event_type}</span></div>
                  <div style={{ fontSize: ".7rem", color: "#64748b" }}>{new Date(d.delivered_at).toLocaleString()}</div>
                </div>
                {d.duration_ms != null && <span style={{ fontSize: ".72rem", color: "#64748b" }}>{d.duration_ms}ms</span>}
              </div>
            ))}
          </div>
        )}

        {/* Create */}
        {tab === "create" && (
          <div style={S.card}>
            <div style={S.h2}>Register Webhook Endpoint</div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "1rem" }}>
              <label style={S.label}>Name *<input style={S.inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., CRM Sync" /></label>
              <label style={S.label}>Endpoint URL *<input style={S.inp} value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://your-server.com/webhook" type="url" /></label>
              <label style={S.label}>
                Events (comma-separated, * for all)
                <input style={S.inp} value={form.events} onChange={e => setForm(f => ({ ...f, events: e.target.value }))} placeholder="* or lead.created, project.created" />
              </label>
              <div style={{ fontSize: ".75rem", color: "#64748b", background: "rgba(255,255,255,.04)", borderRadius: "8px", padding: ".75rem" }}>
                <strong style={{ color: "#a5b4fc" }}>Available events:</strong> lead.created, lead.updated, project.created, project.updated, patient.created, legal_client.created, candidate.created, opportunity.won, opportunity.lost, invoice.paid, subscription.created, automation.fired, ai.completed, platform.alert
              </div>
              <button style={S.btn} onClick={create}>Register Endpoint</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
