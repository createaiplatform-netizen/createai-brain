import React, { useState, useEffect, useCallback } from "react";

type Flag = { key: string; name: string; description: string | null; enabled: boolean; rollout_pct: number; environment: string; allowed_roles: string[]; updated_at: string };

const S: Record<string, React.CSSProperties> = {
  root:  { background: "#020617", minHeight: "100%", color: "#e2e8f0", fontFamily: "'Inter',system-ui,sans-serif", padding: "1.5rem", overflowY: "auto" as const },
  h1:    { fontSize: "1.25rem", fontWeight: 700, color: "#a5b4fc" },
  sub:   { fontSize: ".8rem", color: "#64748b", marginTop: ".2rem", marginBottom: "1.25rem" },
  grid:  { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.25rem" },
  stat:  { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "10px", padding: "1rem", textAlign: "center" as const },
  sn:    { fontSize: "1.5rem", fontWeight: 800, color: "#a5b4fc" },
  sl:    { fontSize: ".7rem", color: "#64748b", marginTop: ".2rem" },
  card:  { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" },
  h2:    { fontSize: ".875rem", fontWeight: 600, color: "#c7d2fe", marginBottom: "1rem" },
  row:   { display: "flex", alignItems: "center", gap: ".75rem", padding: ".7rem 0", borderBottom: "1px solid rgba(255,255,255,.05)" },
  key:   { fontSize: ".75rem", fontFamily: "monospace", background: "rgba(99,102,241,.15)", color: "#a5b4fc", padding: ".1em .45em", borderRadius: "4px" },
  badge: { padding: ".15em .55em", borderRadius: "4px", fontSize: ".72rem", fontWeight: 700 },
  btn:   { background: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", padding: ".4rem .9rem", fontSize: ".8rem", cursor: "pointer", fontWeight: 600 },
  btnSm: { background: "rgba(99,102,241,.2)", color: "#a5b4fc", border: "none", borderRadius: "6px", padding: ".25rem .6rem", fontSize: ".75rem", cursor: "pointer" },
  toggle:{ width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer", position: "relative" as const, transition: "background .2s" },
  inp:   { background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "8px", color: "#e2e8f0", padding: ".5rem .75rem", fontSize: ".8rem", width: "100%", boxSizing: "border-box" as const },
  sel:   { background: "rgba(15,23,42,1)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "8px", color: "#e2e8f0", padding: ".5rem .75rem", fontSize: ".8rem", width: "100%", boxSizing: "border-box" as const },
  label: { fontSize: ".8rem", color: "#94a3b8", display: "flex", flexDirection: "column" as const, gap: ".3rem" },
  toast: { background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)", borderRadius: "8px", padding: ".65rem 1rem", marginBottom: "1rem", fontSize: ".8rem", color: "#a5b4fc" },
};

export function FeatureFlagsApp() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [tab, setTab]     = useState<"flags"|"create">("flags");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm]   = useState({ key: "", name: "", description: "", rollout_pct: 100, environment: "all" });

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const load = useCallback(async () => {
    const r = await fetch("/api/flags", { credentials: "include" }).then(x => x.json()).catch(() => ({ flags: [] })) as { flags?: Flag[] };
    setFlags(r.flags ?? []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggle = async (key: string) => {
    const r = await fetch(`/api/flags/${key}/toggle`, { method: "POST", credentials: "include" });
    if (r.ok) void load(); else notify("Auth required to toggle flags");
  };

  const create = async () => {
    if (!form.key || !form.name) { notify("Key and name are required"); return; }
    if (!/^[a-z_]+$/.test(form.key)) { notify("Key must be lowercase letters and underscores only"); return; }
    notify("Creating…");
    const r = await fetch("/api/flags", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, enabled: false }),
    });
    if (r.ok) { notify("Flag created ✓ (starts disabled)"); setTab("flags"); setForm({ key: "", name: "", description: "", rollout_pct: 100, environment: "all" }); void load(); }
    else notify("Failed — auth required");
  };

  const del = async (key: string) => {
    await fetch(`/api/flags/${key}`, { method: "DELETE", credentials: "include" });
    void load();
  };

  const filtered = flags.filter(f => !search || f.key.includes(search) || f.name.toLowerCase().includes(search.toLowerCase()));
  const activeCount = flags.filter(f => f.enabled).length;

  return (
    <div style={S.root} role="main">
      <a href="#content" style={{ position: "absolute", left: -999, top: 0 }}>Skip to main</a>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div><div style={S.h1}>🚩 Feature Flags</div><div style={S.sub}>Runtime feature toggles · {flags.length} flags · {activeCount} active</div></div>
        <div style={{ display: "flex", gap: ".5rem" }}>
          {(["flags","create"] as const).map(t => (
            <button key={t} style={{ ...S.btnSm, background: tab === t ? "#6366f1" : "rgba(99,102,241,.2)", color: tab === t ? "#fff" : "#a5b4fc" }}
              onClick={() => setTab(t)}>{t === "create" ? "+ New Flag" : "All Flags"}</button>
          ))}
        </div>
      </div>

      {toast && <div style={S.toast} aria-live="polite">{toast}</div>}

      <div style={S.grid}>
        <div style={S.stat}><div style={S.sn}>{flags.length}</div><div style={S.sl}>Total Flags</div></div>
        <div style={S.stat}><div style={{ ...S.sn, color: "#22c55e" }}>{activeCount}</div><div style={S.sl}>Active</div></div>
        <div style={S.stat}><div style={{ ...S.sn, color: "#64748b" }}>{flags.length - activeCount}</div><div style={S.sl}>Disabled</div></div>
      </div>

      <div id="content">
        {tab === "flags" && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ ...S.h2, marginBottom: 0 }}>Flags</div>
              <input style={{ ...S.inp, width: "200px" }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" aria-label="Search flags" />
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", color: "#64748b", padding: "2rem", fontStyle: "italic", fontSize: ".8rem" }}>
                {search ? "No flags match your search." : "No flags yet. Create your first flag →"}
              </div>
            ) : filtered.map(f => (
              <div key={f.key} style={S.row}>
                <button
                  style={{ ...S.toggle, background: f.enabled ? "#6366f1" : "rgba(255,255,255,.1)" }}
                  onClick={() => toggle(f.key)} aria-checked={f.enabled} role="switch" aria-label={`Toggle ${f.name}`} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: ".4rem", alignItems: "center" }}>
                    <span style={S.key}>{f.key}</span>
                    <span style={{ fontSize: ".8rem", fontWeight: 600 }}>{f.name}</span>
                  </div>
                  {f.description && <div style={{ fontSize: ".73rem", color: "#64748b", marginTop: ".15rem" }}>{f.description}</div>}
                  <div style={{ display: "flex", gap: ".3rem", marginTop: ".3rem", flexWrap: "wrap" as const }}>
                    <span style={{ ...S.badge, background: f.enabled ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)", color: f.enabled ? "#22c55e" : "#ef4444" }}>
                      {f.enabled ? "ON" : "OFF"}
                    </span>
                    <span style={{ ...S.badge, background: "rgba(99,102,241,.12)", color: "#a5b4fc" }}>{f.rollout_pct}%</span>
                    <span style={{ ...S.badge, background: "rgba(100,116,139,.1)", color: "#64748b" }}>{f.environment}</span>
                  </div>
                </div>
                <button style={{ ...S.btnSm, color: "#ef4444" }} onClick={() => del(f.key)} aria-label={`Delete flag ${f.key}`}>✕</button>
              </div>
            ))}
          </div>
        )}

        {tab === "create" && (
          <div style={S.card}>
            <div style={S.h2}>Create Feature Flag</div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "1rem" }}>
              <label style={S.label}>Key (lowercase_underscore) *<input style={S.inp} value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/[^a-z_]/g, "_") }))} placeholder="my_feature_flag" /></label>
              <label style={S.label}>Name *<input style={S.inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Feature Flag" /></label>
              <label style={S.label}>Description<input style={S.inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" /></label>
              <label style={S.label}>Rollout %
                <input type="range" min={0} max={100} value={form.rollout_pct} onChange={e => setForm(f => ({ ...f, rollout_pct: Number(e.target.value) }))} style={{ width: "100%" }} />
                <span style={{ color: "#a5b4fc" }}>{form.rollout_pct}% of users</span>
              </label>
              <label style={S.label}>Environment
                <select style={S.sel} value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}>
                  <option value="all">All environments</option>
                  <option value="production">Production only</option>
                  <option value="development">Development only</option>
                  <option value="staging">Staging only</option>
                </select>
              </label>
              <button style={S.btn} onClick={create}>Create Flag (starts disabled)</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
