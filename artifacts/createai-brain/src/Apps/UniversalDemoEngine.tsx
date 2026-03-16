import React, { useState, useRef, useCallback } from "react";
import { OutputFormatter } from "@/components/OutputFormatter";

// ─── Types ─────────────────────────────────────────────────────────────────
type Mode = "demo" | "test" | "simulation";
type Layer = "surface" | "explore" | "deep";
type Action =
  | "overview" | "entities" | "workflows" | "documents"
  | "metrics" | "scenarios" | "problems" | "drill" | "what-if" | "branch";
type ExploreTab = "overview" | "entities" | "workflows" | "documents"
  | "metrics" | "scenarios" | "problems";

interface DomainContext {
  role: string;
  orgType: string;
  constraints: string;
}

interface HistoryEntry {
  layer: Layer;
  tab?: ExploreTab;
  target?: string;
  streamText?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────
const POPULAR_DOMAINS = [
  { icon: "🏥", label: "Healthcare Clinic" },
  { icon: "🏗️", label: "Construction Firm" },
  { icon: "🏦", label: "Fintech Startup" },
  { icon: "🎓", label: "School District" },
  { icon: "⚖️", label: "Law Firm" },
  { icon: "🏪", label: "Retail Chain" },
  { icon: "🚚", label: "Logistics Company" },
  { icon: "🏛️", label: "Government Agency" },
  { icon: "🎨", label: "Creative Agency" },
  { icon: "🌱", label: "Non-Profit Org" },
  { icon: "🏭", label: "Manufacturing Plant" },
  { icon: "💼", label: "HR Department" },
  { icon: "🏨", label: "Hotel & Hospitality" },
  { icon: "🔒", label: "Cybersecurity Team" },
  { icon: "🌾", label: "Agriculture & Food" },
  { icon: "🎮", label: "Game Studio" },
  { icon: "⚡", label: "Energy & Utilities" },
  { icon: "🧪", label: "Research & Science" },
];

const MODE_COLORS: Record<Mode, { bg: string; border: string; text: string; pulse: string }> = {
  demo:       { bg: "rgba(99,102,241,0.14)",  border: "rgba(99,102,241,0.32)",  text: "#a5b4fc", pulse: "#6366f1" },
  test:       { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.28)",   text: "#86efac", pulse: "#22c55e" },
  simulation: { bg: "rgba(168,85,247,0.14)",  border: "rgba(168,85,247,0.30)",  text: "#d8b4fe", pulse: "#a855f7" },
};

const MODE_META: Record<Mode, { icon: string; label: string; desc: string }> = {
  demo:       { icon: "🎬", label: "Demo",       desc: "Safe · Guided · 30-second clarity" },
  test:       { icon: "🔬", label: "Test",        desc: "Your context · Real constraints" },
  simulation: { icon: "⚡", label: "Simulation",  desc: "Stress test · Failures · Edge cases" },
};

const EXPLORE_TABS: { id: ExploreTab; icon: string; label: string }[] = [
  { id: "overview",  icon: "🗺️",  label: "Overview" },
  { id: "entities",  icon: "👥",  label: "Entities" },
  { id: "workflows", icon: "⚙️", label: "Workflows" },
  { id: "documents", icon: "📄",  label: "Documents" },
  { id: "metrics",   icon: "📊",  label: "Metrics" },
  { id: "scenarios", icon: "🌐",  label: "Scenarios" },
  { id: "problems",  icon: "⚠️", label: "Problems" },
];

// ─── Streaming helper ───────────────────────────────────────────────────────
async function streamUniversalDemo(
  payload: Record<string, unknown>,
  onChunk: (text: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/openai/universal-demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok || !res.body) throw new Error("Request failed");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value, { stream: true }).split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6);
      if (!raw || raw === "[DONE]") continue;
      try {
        const d = JSON.parse(raw);
        if (d.content) { acc += d.content; onChunk(acc); }
      } catch { /* skip */ }
    }
  }
}

// ─── Setup Screen ───────────────────────────────────────────────────────────
function SetupScreen({
  onLaunch,
}: {
  onLaunch: (domain: string, ctx: DomainContext, mode: Mode) => void;
}) {
  const [input, setInput] = useState("");
  const [ctx, setCtx] = useState<DomainContext>({ role: "", orgType: "", constraints: "" });
  const [mode, setMode] = useState<Mode>("demo");

  const launch = () => {
    if (!input.trim()) return;
    onLaunch(input.trim(), ctx, mode);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-5 py-8 w-full space-y-7">

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#a5b4fc" }}>
            ✦ Universal Engine · Infinite Depth · Zero Dead Ends
          </div>
          <h1 className="text-2xl font-bold text-white">Demo + Test + Simulation</h1>
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(148,163,184,0.75)" }}>
            Works for every industry. Adapts to any role. Always another layer to explore.
          </p>
        </div>

        {/* Domain input */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(148,163,184,0.55)" }}>
            What domain or industry?
          </label>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && launch()}
              placeholder="Any industry, department, team, workflow, product... anything"
              className="flex-1 bg-transparent text-white text-[14px] px-4 py-3 rounded-2xl outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.28)" }}
              autoFocus
            />
            <button
              onClick={launch}
              disabled={!input.trim()}
              className="px-5 py-3 rounded-2xl text-white font-bold text-[13px] transition-all disabled:opacity-35 flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
            >
              Launch →
            </button>
          </div>
        </div>

        {/* Popular domains grid */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(148,163,184,0.55)" }}>
            Popular starting points
          </label>
          <div className="grid grid-cols-3 gap-2">
            {POPULAR_DOMAINS.map(d => (
              <button
                key={d.label}
                onClick={() => setInput(d.label)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-[12px] font-medium transition-all"
                style={{
                  background: input === d.label ? "rgba(99,102,241,0.14)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${input === d.label ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)"}`,
                  color: input === d.label ? "#a5b4fc" : "#64748b",
                }}
              >
                <span>{d.icon}</span>
                <span className="truncate">{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(148,163,184,0.55)" }}>
            Starting mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["demo", "test", "simulation"] as Mode[]).map(m => {
              const meta = MODE_META[m];
              const c = MODE_COLORS[m];
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all text-center"
                  style={{
                    background: active ? c.bg : "rgba(255,255,255,0.025)",
                    border: `1px solid ${active ? c.border : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  <span className="text-xl">{meta.icon}</span>
                  <span className="text-[12px] font-semibold" style={{ color: active ? c.text : "#64748b" }}>{meta.label}</span>
                  <span className="text-[10px] leading-snug" style={{ color: "rgba(148,163,184,0.5)" }}>{meta.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Context builder */}
        <details className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <summary className="px-4 py-3 text-[12px] font-semibold cursor-pointer select-none" style={{ color: "rgba(148,163,184,0.65)" }}>
            ⚙️ Optional: add your context for deeper results
          </summary>
          <div className="px-4 pb-4 pt-2 space-y-3">
            {[
              { key: "role",        label: "Your role",    placeholder: "e.g. clinic manager, head of IT, founder, department lead..." },
              { key: "orgType",     label: "Org type",     placeholder: "e.g. 50-person startup, large enterprise, government, nonprofit..." },
              { key: "constraints", label: "Constraints",  placeholder: "e.g. limited budget, compliance-heavy, remote team, legacy systems..." },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-[11px]" style={{ color: "rgba(148,163,184,0.5)" }}>{f.label}</label>
                <input
                  value={ctx[f.key as keyof DomainContext]}
                  onChange={e => setCtx(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-transparent text-white text-[13px] px-3 py-2 rounded-xl outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
            ))}
          </div>
        </details>

      </div>
    </div>
  );
}

// ─── Engine Screen ──────────────────────────────────────────────────────────
function EngineScreen({
  domain,
  ctx,
  initialMode,
  onReset,
}: {
  domain: string;
  ctx: DomainContext;
  initialMode: Mode;
  onReset: () => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [layer, setLayer] = useState<Layer>("surface");
  const [exploreTab, setExploreTab] = useState<ExploreTab>("overview");
  const [deepTarget, setDeepTarget] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [contentCache, setContentCache] = useState<Record<string, string>>({});
  const [whatIfInput, setWhatIfInput] = useState("");
  const [showWhatIf, setShowWhatIf] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const mc = MODE_COLORS[mode];

  const cacheKey = useCallback(
    (action: string, target?: string) => `${domain}||${mode}||${action}||${target ?? ""}`,
    [domain, mode],
  );

  const generate = useCallback(async (
    action: Action,
    target?: string,
    whatIf?: string,
  ) => {
    const key = whatIf ? `whatif||${whatIf}` : cacheKey(action, target);
    if (contentCache[key] && !whatIf) {
      setStreamText(contentCache[key]);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    setStreamText("");
    let finalText = "";
    try {
      await streamUniversalDemo(
        {
          domain,
          mode,
          layer,
          action,
          context: ctx,
          target,
          whatIf,
          history: history.map(h => `${h.layer}:${h.target ?? h.tab ?? ""}`).slice(-6),
        },
        t => { finalText = t; setStreamText(t); },
        controller.signal,
      );
      setContentCache(prev => ({ ...prev, [key]: finalText }));
    } catch (e: any) {
      if (e.name !== "AbortError") setStreamText("[Generation error — please try again]");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [domain, mode, layer, ctx, history, contentCache, cacheKey]);

  const pushHistory = useCallback((entry: HistoryEntry) => {
    setHistory(h => [...h.slice(-19), entry]);
  }, []);

  const goSurface = useCallback(() => {
    setLayer("surface");
    generate("overview");
  }, [generate]);

  const goExplore = useCallback((tab: ExploreTab) => {
    pushHistory({ layer, tab: exploreTab, target: deepTarget, streamText });
    setLayer("explore");
    setExploreTab(tab);
    generate(tab as Action);
  }, [layer, exploreTab, deepTarget, streamText, pushHistory, generate]);

  const goDeep = useCallback((target: string) => {
    pushHistory({ layer, tab: exploreTab, target: deepTarget, streamText });
    setDeepTarget(target);
    setLayer("deep");
    generate("drill", target);
  }, [layer, exploreTab, deepTarget, streamText, pushHistory, generate]);

  const goBack = useCallback(() => {
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    if (!prev) { setLayer("surface"); generate("overview"); return; }
    setLayer(prev.layer);
    if (prev.streamText) setStreamText(prev.streamText);
    if (prev.layer === "explore" && prev.tab) {
      setExploreTab(prev.tab);
      if (!prev.streamText) generate(prev.tab as Action);
    }
    if (prev.layer === "deep" && prev.target) {
      setDeepTarget(prev.target);
      if (!prev.streamText) generate("drill", prev.target);
    }
  }, [history, generate]);

  const goDeeper = useCallback(() => {
    generate("drill", `${deepTarget} — next level deeper: sub-components, hidden complexity, edge cases, and expansion paths`);
  }, [generate, deepTarget]);

  const runWhatIf = useCallback(() => {
    if (!whatIfInput.trim()) return;
    generate("what-if", deepTarget || domain, whatIfInput.trim());
    setShowWhatIf(false);
    setWhatIfInput("");
  }, [generate, whatIfInput, deepTarget, domain]);

  const runBranch = useCallback(() => {
    generate("branch", deepTarget || domain);
  }, [generate, deepTarget, domain]);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setContentCache({});
    const act: Action = layer === "surface" ? "overview" : layer === "explore" ? exploreTab as Action : "drill";
    setTimeout(() => generate(act, layer === "deep" ? deepTarget : undefined), 50);
  }, [layer, exploreTab, deepTarget, generate]);

  // Auto-load surface overview on mount
  const loadedRef = useRef(false);
  if (!loadedRef.current) {
    loadedRef.current = true;
    setTimeout(() => generate("overview"), 80);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3 space-y-2.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Domain + mode row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: mc.bg, border: `1px solid ${mc.border}` }}>
              {MODE_META[mode].icon}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-white truncate">{domain}</div>
              {(ctx.role || ctx.orgType) && (
                <div className="text-[10px] truncate" style={{ color: "rgba(148,163,184,0.5)" }}>
                  {[ctx.role, ctx.orgType].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          </div>

          {/* Mode pills */}
          <div className="flex gap-1 flex-shrink-0">
            {(["demo", "test", "simulation"] as Mode[]).map(m => {
              const c = MODE_COLORS[m];
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: active ? c.bg : "transparent",
                    border: `1px solid ${active ? c.border : "rgba(255,255,255,0.08)"}`,
                    color: active ? c.text : "#475569",
                  }}
                >
                  {MODE_META[m].icon} {MODE_META[m].label}
                </button>
              );
            })}
          </div>

          <button
            onClick={onReset}
            className="text-[10px] px-2 transition-colors flex-shrink-0"
            style={{ color: "rgba(148,163,184,0.4)" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#94a3b8")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(148,163,184,0.4)")}
          >
            ← New Domain
          </button>
        </div>

        {/* Layer tabs */}
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] transition-all mr-1 flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              ← Back
            </button>
          )}
          {(["surface", "explore", "deep"] as Layer[]).map(l => {
            const icons = { surface: "⬡", explore: "◈", deep: "◉" };
            const labels = { surface: "Surface", explore: "Explore", deep: "Deep" };
            return (
              <button
                key={l}
                onClick={() => {
                  if (l === "surface") goSurface();
                  else if (l === "explore") {
                    if (layer !== "explore") goExplore(exploreTab);
                  } else if (l === "deep" && deepTarget) {
                    setLayer("deep"); generate("drill", deepTarget);
                  }
                }}
                disabled={l === "deep" && !deepTarget}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all disabled:opacity-25"
                style={{
                  background: layer === l ? mc.bg : "transparent",
                  border: `1px solid ${layer === l ? mc.border : "rgba(255,255,255,0.07)"}`,
                  color: layer === l ? mc.text : "#475569",
                }}
              >
                {icons[l]} {labels[l]}
              </button>
            );
          })}

          {layer === "deep" && deepTarget && (
            <span className="text-[10px] ml-1.5 truncate max-w-[160px]"
              style={{ color: "rgba(148,163,184,0.45)" }}>
              → {deepTarget}
            </span>
          )}
        </div>

        {/* Explore sub-tabs */}
        {layer === "explore" && (
          <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {EXPLORE_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { setExploreTab(t.id); generate(t.id as Action); }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap"
                style={{
                  background: exploreTab === t.id ? "rgba(99,102,241,0.14)" : "transparent",
                  border: `1px solid ${exploreTab === t.id ? "rgba(99,102,241,0.30)" : "rgba(255,255,255,0.07)"}`,
                  color: exploreTab === t.id ? "#a5b4fc" : "#475569",
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {streaming && !streamText && (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: mc.bg, border: `1px solid ${mc.border}` }}>
              <div className="w-5 h-5 border-2 rounded-full animate-spin"
                style={{ borderColor: mc.text, borderTopColor: "transparent" }} />
            </div>
            <p className="text-[13px]" style={{ color: "rgba(148,163,184,0.6)" }}>
              {mode === "demo" ? "Generating overview…" : mode === "test" ? "Adapting to your context…" : "Running simulation…"}
            </p>
            <p className="text-[11px]" style={{ color: "rgba(148,163,184,0.35)" }}>
              All content is illustrative · Conceptual demo data
            </p>
          </div>
        )}

        {streamText && (
          <div className="rounded-2xl p-5 space-y-1"
            style={{ background: "rgba(10,14,36,0.80)", border: `1px solid ${mc.border}` }}>
            <OutputFormatter content={streamText} />
            {streaming && (
              <span className="inline-block w-2 h-4 rounded-sm animate-pulse align-middle ml-0.5"
                style={{ background: mc.text }} />
            )}
          </div>
        )}

        {!streaming && !streamText && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="text-4xl opacity-30">⬡</div>
            <p className="text-[13px]" style={{ color: "rgba(148,163,184,0.4)" }}>Select a layer to begin exploration</p>
          </div>
        )}
      </div>

      {/* ── Action bar ── */}
      {!streaming && (
        <div className="flex-shrink-0 px-4 pb-4 pt-2 space-y-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>

          {/* What If input */}
          {showWhatIf && (
            <div className="flex gap-2">
              <input
                value={whatIfInput}
                onChange={e => setWhatIfInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && runWhatIf()}
                placeholder="What if… volume triples, a regulation changes, key person leaves, budget cut by 40%..."
                className="flex-1 bg-transparent text-white text-[13px] px-3 py-2 rounded-xl outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.28)" }}
                autoFocus
              />
              <button
                onClick={runWhatIf}
                className="px-4 py-2 rounded-xl text-[12px] font-bold text-white flex-shrink-0"
                style={{ background: "rgba(168,85,247,0.75)" }}
              >Run</button>
              <button
                onClick={() => setShowWhatIf(false)}
                className="px-3 py-2 rounded-xl text-[12px] flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.05)", color: "#64748b" }}
              >✕</button>
            </div>
          )}

          {/* Primary actions */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Surface layer actions */}
            {layer === "surface" && streamText && (
              <button
                onClick={() => goExplore("overview")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold text-white transition-all"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                Explore ↓
              </button>
            )}

            {/* Explore layer actions */}
            {layer === "explore" && (
              <>
                <button
                  onClick={() => generate(exploreTab as Action)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
                  style={{ background: mc.bg, border: `1px solid ${mc.border}`, color: mc.text }}
                >
                  ↻ Regenerate
                </button>
                {streamText && (
                  <button
                    onClick={() => {
                      const heading = streamText.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim()
                        || streamText.match(/\*\*([^*]+)\*\*/)?.[1]?.trim()
                        || exploreTab;
                      goDeep(heading);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#94a3b8" }}
                  >
                    ◉ Drill In
                  </button>
                )}
              </>
            )}

            {/* Deep layer actions */}
            {layer === "deep" && (
              <>
                <button
                  onClick={goDeeper}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold text-white transition-all"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                >
                  ↓ Go Deeper
                </button>
                <button
                  onClick={runBranch}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
                  style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.28)", color: "#86efac" }}
                >
                  ↗ Branch
                </button>
              </>
            )}

            {/* What If — always visible */}
            <button
              onClick={() => setShowWhatIf(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
              style={{
                background: showWhatIf ? "rgba(168,85,247,0.18)" : "rgba(168,85,247,0.10)",
                border: "1px solid rgba(168,85,247,0.25)",
                color: "#d8b4fe",
              }}
            >
              💭 What If…
            </button>

            {/* Stress test shortcut when not in simulation mode */}
            {mode !== "simulation" && streamText && (
              <button
                onClick={() => switchMode("simulation")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569" }}
              >
                ⚡ Stress Test
              </button>
            )}

            <div className="flex-1" />
            <span className="text-[10px]" style={{ color: "rgba(148,163,184,0.30)" }}>
              {MODE_META[mode].icon} {MODE_META[mode].label} · Conceptual · Always another layer
            </span>
          </div>

          {/* Explore quick-launch buttons when on surface */}
          {layer === "surface" && streamText && (
            <div className="flex gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-semibold self-center mr-1" style={{ color: "rgba(148,163,184,0.40)" }}>
                Jump to:
              </span>
              {EXPLORE_TABS.filter(t => t.id !== "overview").map(t => (
                <button
                  key={t.id}
                  onClick={() => goExplore(t.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#64748b" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.30)";
                    (e.currentTarget as HTMLElement).style.color = "#a5b4fc";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLElement).style.color = "#64748b";
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Export ────────────────────────────────────────────────────────────
export function UniversalDemoEngine() {
  const [phase, setPhase] = useState<"setup" | "running">("setup");
  const [domain, setDomain] = useState("");
  const [ctx, setCtx] = useState<DomainContext>({ role: "", orgType: "", constraints: "" });
  const [mode, setMode] = useState<Mode>("demo");

  const handleLaunch = (d: string, c: DomainContext, m: Mode) => {
    setDomain(d);
    setCtx(c);
    setMode(m);
    setPhase("running");
  };

  const handleReset = () => {
    setPhase("setup");
    setDomain("");
  };

  if (phase === "setup") {
    return <SetupScreen onLaunch={handleLaunch} />;
  }

  return (
    <EngineScreen
      key={domain}
      domain={domain}
      ctx={ctx}
      initialMode={mode}
      onReset={handleReset}
    />
  );
}
