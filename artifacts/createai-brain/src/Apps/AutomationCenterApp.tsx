import React, { useState, useEffect, useCallback } from "react";

type Rule = { id: number; name: string; description: string | null; trigger: string; enabled: boolean; run_count: number; last_run_at: string | null };
type Exec = { id: number; rule_name: string | null; status: string; duration_ms: number | null; started_at: string };
type EngineStatus = { engine: string; supportedTriggers: string[]; supportedActions: string[]; rules: Record<string, number>; executions: Record<string, number> };

const S: Record<string, React.CSSProperties> = {
  root:   { background: "#020617", minHeight: "100%", color: "#e2e8f0", fontFamily: "'Inter',system-ui,sans-serif", padding: "1.5rem", overflowY: "auto" as const },
  h1:     { fontSize: "1.25rem", fontWeight: 700, color: "#a5b4fc" },
  sub:    { fontSize: ".8rem", color: "#64748b", marginTop: ".2rem" },
  grid:   { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", margin: "1.25rem 0" },
  stat:   { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "10px", padding: "1rem", textAlign: "center" as const },
  sn:     { fontSize: "1.5rem", fontWeight: 800, color: "#a5b4fc" },
  sl:     { fontSize: ".7rem", color: "#64748b", marginTop: ".2rem" },
  card:   { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" },
  h2:     { fontSize: ".875rem", fontWeight: 600, color: "#c7d2fe", marginBottom: "1rem" },
  tabs:   { display: "flex", gap: ".5rem", marginBottom: "1.25rem" },
  tab:    { background: "rgba(99,102,241,.15)", color: "#a5b4fc", border: "none", borderRadius: "8px", padding: ".4rem .9rem", fontSize: ".8rem", cursor: "pointer" },
  tabA:   { background: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", padding: ".4rem .9rem", fontSize: ".8rem", cursor: "pointer" },
  row:    { display: "flex", alignItems: "center", gap: ".75rem", padding: ".65rem 0", borderBottom: "1px solid rgba(255,255,255,.05)" },
  btn:    { background: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", padding: ".5rem 1rem", fontSize: ".8rem", cursor: "pointer", fontWeight: 600 },
  btnSm:  { background: "rgba(99,102,241,.2)", color: "#a5b4fc", border: "none", borderRadius: "6px", padding: ".25rem .6rem", fontSize: ".75rem", cursor: "pointer" },
  chip:   { background: "rgba(99,102,241,.15)", color: "#a5b4fc", padding: ".15em .5em", borderRadius: "4px", fontSize: ".72rem" },
  inp:    { background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "8px", color: "#e2e8f0", padding: ".5rem .75rem", fontSize: ".8rem", width: "100%", boxSizing: "border-box" as const },
  sel:    { background: "rgba(15,23,42,1)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "8px", color: "#e2e8f0", padding: ".5rem .75rem", fontSize: ".8rem", width: "100%", boxSizing: "border-box" as const },
  label:  { fontSize: ".8rem", color: "#94a3b8", display: "flex", flexDirection: "column" as const, gap: ".3rem" },
  empty:  { textAlign: "center" as const, color: "#64748b", padding: "2.5rem", fontStyle: "italic", fontSize: ".8rem" },
  toast:  { background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)", borderRadius: "8px", padding: ".75rem 1rem", marginBottom: "1rem", fontSize: ".8rem", color: "#a5b4fc" },
};

const STATUS_COLOR: Record<string, string> = { success: "#22c55e", partial: "#eab308", error: "#ef4444", running: "#6366f1", pending: "#94a3b8" };

export function AutomationCenterApp() {
  const [tab,     setTab]    = useState<"rules"|"history"|"create">("rules");
  const [rules,   setRules]  = useState<Rule[]>([]);
  const [execs,   setExecs]  = useState<Exec[]>([]);
  const [status,  setStatus] = useState<EngineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]  = useState("");
  const [form,    setForm]   = useState({ name: "", desc: "", trigger: "new_lead", action: "log_entry" });

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const [s, r, e] = await Promise.all([
      fetch("/api/automation/status",     { credentials: "include" }).then(x => x.json()).catch(() => null),
      fetch("/api/automation/rules",      { credentials: "include" }).then(x => x.json()).catch(() => null),
      fetch("/api/automation/executions", { credentials: "include" }).then(x => x.json()).catch(() => null),
    ]);
    setStatus(s);
    setRules(r?.rules ?? []);
    setExecs(e?.executions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggle = async (id: number) => {
    await fetch(`/api/automation/rules/${id}/toggle`, { method: "POST", credentials: "include" });
    void load();
  };

  const run = async (id: number) => {
    notify("Running rule…");
    await fetch(`/api/automation/rules/${id}/run`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" });
    notify("Rule triggered ✓");
    setTimeout(() => load(), 1500);
  };

  const del = async (id: number) => {
    await fetch(`/api/automation/rules/${id}`, { method: "DELETE", credentials: "include" });
    void load();
  };

  const create = async () => {
    if (!form.name) { notify("Name is required"); return; }
    notify("Creating…");
    const body = { name: form.name, description: form.desc, trigger: form.trigger, actions: [{ type: form.action, config: {} }] };
    const r = await fetch("/api/automation/rules", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) { notify("Created ✓"); setTab("rules"); setForm({ name: "", desc: "", trigger: "new_lead", action: "log_entry" }); void load(); }
    else notify("Failed — auth required");
  };

  const triggers = status?.supportedTriggers ?? ["new_lead","new_project","daily_schedule","manual"];
  const actions  = status?.supportedActions  ?? ["log_entry","send_email","notify_admin","webhook_call"];

  return (
    <div style={S.root} role="main">
      <a href="#content" style={{ position: "absolute", left: -999, top: 0 }}>Skip to main</a>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div><div style={S.h1}>⚡ Automation Engine</div><div style={S.sub}>Event-driven workflow automation · {rules.length} rules</div></div>
        <button style={S.btn} onClick={load}>↻ Refresh</button>
      </div>

      {toast && <div style={S.toast} role="status" aria-live="polite">{toast}</div>}

      {status && (
        <div style={S.grid}>
          <div style={S.stat}><div style={S.sn}>{status.rules["active_rules"] ?? 0}</div><div style={S.sl}>Active Rules</div></div>
          <div style={S.stat}><div style={S.sn}>{status.rules["total_rules"]  ?? 0}</div><div style={S.sl}>Total Rules</div></div>
          <div style={S.stat}><div style={{ ...S.sn, color: "#22c55e" }}>{status.executions["success_count"] ?? 0}</div><div style={S.sl}>Successes (7d)</div></div>
          <div style={S.stat}><div style={{ ...S.sn, color: "#ef4444" }}>{status.executions["error_count"]   ?? 0}</div><div style={S.sl}>Errors (7d)</div></div>
        </div>
      )}

      <div style={S.tabs}>
        {(["rules","history","create"] as const).map(t => (
          <button key={t} style={tab === t ? S.tabA : S.tab} onClick={() => setTab(t)} aria-selected={tab === t}>
            {t === "create" ? "+ Create Rule" : t === "history" ? "Execution History" : "Rules"}
          </button>
        ))}
      </div>

      <div id="content">
        {/* Rules */}
        {tab === "rules" && (
          <div style={S.card}>
            <div style={S.h2}>Automation Rules</div>
            {loading ? <div style={S.empty}>Loading…</div> : rules.length === 0 ? (
              <div style={S.empty}>No rules yet. Click "+ Create Rule" to get started.</div>
            ) : rules.map(r => (
              <div key={r.id} style={S.row}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".85rem", fontWeight: 600 }}>{r.name}</div>
                  <div style={{ display: "flex", gap: ".35rem", marginTop: ".3rem", flexWrap: "wrap" as const }}>
                    <span style={S.chip}>{r.trigger}</span>
                    <span style={{ ...S.chip, background: r.enabled ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.1)", color: r.enabled ? "#22c55e" : "#ef4444" }}>
                      {r.enabled ? "● Active" : "○ Paused"}
                    </span>
                    <span style={{ ...S.chip, color: "#64748b" }}>{r.run_count} runs</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: ".4rem" }}>
                  <button style={S.btnSm} onClick={() => run(r.id)} aria-label={`Run rule ${r.name}`}>▶</button>
                  <button style={{ ...S.btnSm, color: r.enabled ? "#fbbf24" : "#22c55e" }} onClick={() => toggle(r.id)}>{r.enabled ? "⏸" : "▶"}</button>
                  <button style={{ ...S.btnSm, color: "#ef4444" }} onClick={() => del(r.id)} aria-label={`Delete rule ${r.name}`}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {tab === "history" && (
          <div style={S.card}>
            <div style={S.h2}>Execution History</div>
            {loading ? <div style={S.empty}>Loading…</div> : execs.length === 0 ? (
              <div style={S.empty}>No executions yet. Run a rule to see history.</div>
            ) : execs.map(e => (
              <div key={e.id} style={S.row}>
                <span style={{ background: `${STATUS_COLOR[e.status] ?? "#94a3b8"}22`, color: STATUS_COLOR[e.status] ?? "#94a3b8", padding: ".15em .5em", borderRadius: "4px", fontSize: ".72rem", fontWeight: 600 }}>{e.status}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".8rem" }}>{e.rule_name ?? "Unknown rule"}</div>
                  <div style={{ fontSize: ".7rem", color: "#64748b" }}>{new Date(e.started_at).toLocaleString()}</div>
                </div>
                {e.duration_ms != null && <span style={{ fontSize: ".75rem", color: "#64748b" }}>{e.duration_ms}ms</span>}
              </div>
            ))}
          </div>
        )}

        {/* Create */}
        {tab === "create" && (
          <div style={S.card}>
            <div style={S.h2}>Create Automation Rule</div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "1rem" }}>
              <label style={S.label}>Rule Name *<input style={S.inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Welcome New Lead" /></label>
              <label style={S.label}>Description<input style={S.inp} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="Optional" /></label>
              <label style={S.label}>Trigger *
                <select style={S.sel} value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}>
                  {triggers.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label style={S.label}>Action *
                <select style={S.sel} value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}>
                  {actions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
              <button style={S.btn} onClick={create}>Create Rule</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
