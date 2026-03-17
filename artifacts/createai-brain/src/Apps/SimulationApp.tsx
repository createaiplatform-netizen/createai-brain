import React, { useState, useRef } from "react";
import { OutputFormatter } from "@/components/OutputFormatter";
import { UniversalDemoEngine } from "./UniversalDemoEngine";
import { SaveToProjectModal } from "@/components/SaveToProjectModal";
import { streamSSE } from "@/ael/fetch";

// ─── Simulation domains ────────────────────────────────────────────────────
const SIM_DOMAINS = [
  { id: "business",    icon: "🏢", label: "Business Logic",         desc: "Revenue models, org design, pricing, competitive positioning" },
  { id: "software",    icon: "💻", label: "Software Architecture",   desc: "Tech stack, API design, scalability, system diagrams" },
  { id: "product",     icon: "📦", label: "Product Logic",           desc: "Feature trade-offs, user journeys, value prop stress-testing" },
  { id: "financial",   icon: "📊", label: "Financial Modeling",      desc: "Unit economics, pricing scenarios, revenue projections (illustrative)" },
  { id: "operations",  icon: "⚙️", label: "Operational Analysis",   desc: "Workflow gaps, process bottlenecks, SOP quality, capacity" },
  { id: "technology",  icon: "🔬", label: "Technology Logic",        desc: "Tech adoption, integration complexity, emerging tech assessment" },
  { id: "competitive", icon: "🎯", label: "Competitive Intelligence", desc: "Market landscape, competitor strength/weakness, positioning gaps" },
  { id: "scenario",    icon: "🌐", label: "Scenario Planning",       desc: "What-if analysis, risk modeling, market disruption simulation" },
  { id: "gap",         icon: "🔍", label: "Gap Analysis",            desc: "Missing pieces in any plan, product, workflow, or strategy" },
  { id: "stress",      icon: "⚡", label: "Stress & Challenge Test", desc: "Edge cases, failure modes, assumption pressure-testing" },
  { id: "marketing",   icon: "📣", label: "Marketing Intelligence",  desc: "Channel fit, message resonance, funnel logic simulation" },
  { id: "custom",      icon: "✨", label: "Custom Domain",           desc: "Describe any simulation — the Brain runs it" },
];

// ─── Ad Gen audience options ───────────────────────────────────────────────
const AD_AUDIENCES = [
  "Small business owners", "Enterprise decision-makers", "Healthcare professionals",
  "Startup founders", "Marketing teams", "General consumers", "Non-profits",
  "Construction & trades", "Educators & students", "Tech enthusiasts", "Custom (describe below)",
];

const AD_TONES = [
  "Professional & authoritative", "Warm & conversational", "Bold & energetic",
  "Educational & clear", "Empowering & motivational", "Minimalist & precise",
];

// ─── Output Panel ─────────────────────────────────────────────────────────
function OutputPanel({
  label, icon, streaming, streamText, onNew, onCopy,
}: {
  label: string; icon: string; streaming: boolean; streamText: string;
  onNew: () => void; onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(streamText).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
    onCopy();
  };

  return (
    <div className="space-y-4 animate-fade-up">
      {showSave && (
        <SaveToProjectModal
          content={streamText}
          label={label}
          defaultFileType="Document"
          onClose={() => setShowSave(false)}
        />
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.25)" }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14px] text-foreground truncate">{label}</p>
          <p className="text-[11px] text-muted-foreground">{streaming ? "Generating…" : "Complete — review before use"}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!streaming && streamText && (
            <>
              <button onClick={handleCopy}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
                style={{ background: copied ? "rgba(34,197,94,0.10)" : "rgba(255,255,255,0.07)", color: copied ? "#4ade80" : "rgba(255,255,255,0.70)", border: `1px solid ${copied ? "rgba(34,197,94,0.20)" : "rgba(255,255,255,0.10)"}` }}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <button onClick={() => setShowSave(true)}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white transition-all"
                style={{ background: "rgba(99,102,241,0.80)" }}>
                💾 Save
              </button>
              <button onClick={onNew}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white transition-all"
                style={{ background: "rgba(168,85,247,0.80)" }}>
                + New
              </button>
            </>
          )}
        </div>
      </div>

      {streaming && !streamText && (
        <div className="flex flex-col items-center gap-3 py-14">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-float"
            style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.22)" }}>
            <div className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{ borderColor: "#a855f7", borderTopColor: "transparent" }} />
          </div>
          <p className="text-[13px] text-muted-foreground">Running simulation…</p>
          <p className="text-[11px] text-muted-foreground/50">All outputs are conceptual and fictional</p>
        </div>
      )}

      {streamText && (
        <div className="rounded-2xl p-5 max-h-[58vh] overflow-y-auto space-y-1"
          style={{ background: "rgba(14,18,42,0.75)", border: "1px solid rgba(168,85,247,0.12)" }}>
          <OutputFormatter content={streamText} />
          {streaming && <span className="inline-block w-2 h-4 rounded-sm animate-pulse align-middle ml-0.5" style={{ background: "#a855f7" }} />}
        </div>
      )}

      {!streaming && streamText && (
        <div className="flex items-center gap-2 text-[11px] justify-center" style={{ color: "rgba(168,85,247,0.60)" }}>
          <span>🧪</span>
          <span>Simulation complete · Conceptual & fictional · Review all outputs before any real-world use</span>
        </div>
      )}
    </div>
  );
}

// ─── SIMULATE TAB ─────────────────────────────────────────────────────────
function SimulateTab() {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [scenario, setScenario] = useState("");
  const [context, setContext] = useState("");
  const [depth, setDepth] = useState<"quick" | "full" | "deep">("full");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [view, setView] = useState<"grid" | "form" | "output">("grid");
  const abortRef = useRef<AbortController | null>(null);

  const domain = SIM_DOMAINS.find(d => d.id === selectedDomain);

  const handleRun = async () => {
    if (!scenario.trim()) return;
    setStreaming(true);
    setStreamText("");
    setView("output");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamSSE(
        "/api/openai/simulate",
        { domain: domain?.label ?? "General", scenario, context, depth },
        t => setStreamText(t),
        () => {},
        controller.signal,
      );
    } catch (e: any) {
      if (e.name !== "AbortError") setStreamText("[Simulation error — please try again.]");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleNew = () => {
    abortRef.current?.abort();
    setSelectedDomain(null);
    setScenario("");
    setContext("");
    setDepth("full");
    setStreamText("");
    setView("grid");
  };

  if (view === "output") {
    return (
      <div className="p-5 space-y-5 animate-fade-up">
        <button onClick={handleNew}
          className="flex items-center gap-1.5 text-[13px] font-medium hover:opacity-70 transition-opacity"
          style={{ color: "#a855f7" }}>
          <span className="text-[18px] font-light">‹</span> Simulations
        </button>
        {streaming && (
          <button onClick={() => abortRef.current?.abort()}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
            style={{ background: "rgba(239,68,68,0.10)", color: "#f87171", border: "1px solid rgba(239,68,68,0.20)" }}>
            Stop
          </button>
        )}
        <OutputPanel
          label={domain?.label ?? "Custom Simulation"}
          icon={domain?.icon ?? "🧪"}
          streaming={streaming}
          streamText={streamText}
          onNew={handleNew}
          onCopy={() => {}}
        />
      </div>
    );
  }

  if (view === "form" && domain) {
    return (
      <div className="p-5 space-y-5 animate-fade-up">
        <button onClick={() => setView("grid")}
          className="flex items-center gap-1.5 text-[13px] font-medium hover:opacity-70 transition-opacity"
          style={{ color: "#a855f7" }}>
          <span className="text-[18px] font-light">‹</span> Domains
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: "rgba(168,85,247,0.14)", border: "1px solid rgba(168,85,247,0.22)" }}>
            {domain.icon}
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>{domain.label}</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">{domain.desc}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-2">What would you like to simulate?</label>
            <textarea
              value={scenario}
              onChange={e => setScenario(e.target.value)}
              placeholder={`Describe the scenario, concept, system, or plan you want to simulate…`}
              rows={4}
              autoFocus
              className="w-full rounded-xl p-4 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none leading-relaxed input-premium"
              style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-2">Additional context <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Industry, constraints, assumptions, goals, existing setup…"
              rows={2}
              className="w-full rounded-xl p-4 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none leading-relaxed input-premium"
              style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-2">Simulation depth</label>
            <div className="flex gap-2">
              {(["quick", "full", "deep"] as const).map(d => (
                <button key={d} onClick={() => setDepth(d)}
                  className="flex-1 py-2 rounded-xl text-[12px] font-semibold capitalize transition-all"
                  style={{
                    background: depth === d ? "rgba(168,85,247,0.20)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${depth === d ? "rgba(168,85,247,0.45)" : "rgba(255,255,255,0.08)"}`,
                    color: depth === d ? "#c084fc" : "rgba(255,255,255,0.55)",
                  }}>
                  {d === "quick" ? "⚡ Quick" : d === "full" ? "🧪 Full" : "🔬 Deep"}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleRun}
            disabled={!scenario.trim()}
            className="w-full text-white text-[14px] font-semibold py-3 rounded-xl disabled:opacity-40 transition-all"
            style={{ background: "linear-gradient(135deg, #9333ea, #7c3aed)" }}>
            Run Simulation →
          </button>
          <p className="text-[11px] text-center text-muted-foreground">
            All simulations are conceptual & fictional · Safe for all safe, legal topics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5 animate-fade-up">
      <div>
        <h2 className="text-[20px] font-bold text-foreground" style={{ letterSpacing: "-0.03em" }}>Universal Simulator</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">Run any simulation across any safe domain — fictional & conceptual only</p>
      </div>

      <div className="p-3 rounded-2xl" style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.15)" }}>
        <p className="text-[11px] font-medium" style={{ color: "rgba(192,132,252,0.90)" }}>
          🧪 All simulations are fictional and fully safe. No real decisions, clinical advice, or legal guidance is generated. Outputs are for creative and analytical exploration only.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {SIM_DOMAINS.map((d, i) => (
          <button key={d.id}
            onClick={() => { setSelectedDomain(d.id); setView("form"); }}
            className={`flex items-center gap-4 p-4 rounded-2xl text-left group card-interactive animate-fade-up delay-${Math.min(i * 30, 300)}`}
            style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
              style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.18)" }}>
              {d.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14px] text-foreground">{d.label}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{d.desc}</p>
            </div>
            <span className="text-muted-foreground text-xs flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── GAP ANALYSIS TAB ─────────────────────────────────────────────────────
function GapTab() {
  const [input, setInput] = useState("");
  const [gapType, setGapType] = useState("workflow");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [view, setView] = useState<"form" | "output">("form");
  const abortRef = useRef<AbortController | null>(null);

  const GAP_TYPES = [
    { id: "workflow",   label: "Workflow Gap",    icon: "🔄", desc: "Identify missing steps, bottlenecks, inefficiencies" },
    { id: "product",    label: "Product Gap",     icon: "📦", desc: "Missing features, user needs, or market fit issues" },
    { id: "business",   label: "Business Gap",    icon: "🏢", desc: "Strategy, operations, revenue, or growth gaps" },
    { id: "technical",  label: "Technical Gap",   icon: "💻", desc: "Architecture, code, security, or performance gaps" },
    { id: "financial",  label: "Financial Gap",   icon: "📊", desc: "Cost, revenue, pricing, or sustainability gaps" },
    { id: "marketing",  label: "Marketing Gap",   icon: "📣", desc: "Channel, message, audience, or funnel gaps" },
    { id: "team",       label: "Team & Org Gap",  icon: "👥", desc: "Skills, structure, capacity, or process gaps" },
    { id: "document",   label: "Document Gap",    icon: "📄", desc: "Missing sections, unclear logic, or structural gaps" },
  ];

  const handleRun = async () => {
    if (!input.trim()) return;
    setStreaming(true);
    setStreamText("");
    setView("output");
    const controller = new AbortController();
    abortRef.current = controller;
    const gt = GAP_TYPES.find(g => g.id === gapType);
    try {
      await streamSSE(
        "/api/openai/simulate",
        {
          domain: "Gap Analysis",
          scenario: `Perform a ${gt?.label ?? "Gap Analysis"} on the following:\n\n${input}`,
          context: `Focus specifically on identifying gaps, missing elements, weaknesses, and improvement opportunities. Be specific and actionable.`,
          depth: "full",
        },
        t => setStreamText(t),
        () => {},
        controller.signal,
      );
    } catch (e: any) {
      if (e.name !== "AbortError") setStreamText("[Analysis error — please try again.]");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleNew = () => {
    abortRef.current?.abort();
    setInput("");
    setStreamText("");
    setView("form");
  };

  if (view === "output") {
    return (
      <div className="p-5 space-y-5 animate-fade-up">
        <div className="flex items-center justify-between">
          <button onClick={handleNew}
            className="flex items-center gap-1.5 text-[13px] font-medium hover:opacity-70 transition-opacity"
            style={{ color: "#a855f7" }}>
            <span className="text-[18px] font-light">‹</span> Gap Analyzer
          </button>
          {streaming && (
            <button onClick={() => abortRef.current?.abort()}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: "rgba(239,68,68,0.10)", color: "#f87171", border: "1px solid rgba(239,68,68,0.20)" }}>
              Stop
            </button>
          )}
        </div>
        <OutputPanel
          label={`${GAP_TYPES.find(g => g.id === gapType)?.label ?? "Gap Analysis"} — Results`}
          icon="🔍"
          streaming={streaming}
          streamText={streamText}
          onNew={handleNew}
          onCopy={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5 animate-fade-up">
      <div>
        <h2 className="text-[20px] font-bold text-foreground" style={{ letterSpacing: "-0.03em" }}>Gap Analyzer</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">Paste any plan, product, workflow, or document — the Brain finds every gap</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-2">Gap type</label>
          <div className="grid grid-cols-2 gap-2">
            {GAP_TYPES.map(g => (
              <button key={g.id} onClick={() => setGapType(g.id)}
                className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all"
                style={{
                  background: gapType === g.id ? "rgba(168,85,247,0.16)" : "rgba(14,18,42,0.70)",
                  border: `1px solid ${gapType === g.id ? "rgba(168,85,247,0.40)" : "rgba(255,255,255,0.07)"}`,
                }}>
                <span className="text-lg">{g.icon}</span>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-foreground truncate">{g.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug line-clamp-1">{g.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-2">
            What do you want analyzed?
          </label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste your plan, workflow, product description, strategy, code architecture, document, or any concept…"
            rows={6}
            autoFocus
            className="w-full rounded-xl p-4 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none leading-relaxed input-premium"
            style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}
          />
        </div>

        <button
          onClick={handleRun}
          disabled={!input.trim()}
          className="w-full text-white text-[14px] font-semibold py-3 rounded-xl disabled:opacity-40 transition-all"
          style={{ background: "linear-gradient(135deg, #9333ea, #7c3aed)" }}>
          Analyze Gaps →
        </button>
      </div>
    </div>
  );
}

// ─── AD PACKET TAB ────────────────────────────────────────────────────────
function AdPacketTab() {
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState(AD_AUDIENCES[0]);
  const [customAudience, setCustomAudience] = useState("");
  const [adTone, setAdTone] = useState(AD_TONES[0]);
  const [industry, setIndustry] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [view, setView] = useState<"form" | "output">("form");
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setStreaming(true);
    setStreamText("");
    setView("output");
    const controller = new AbortController();
    abortRef.current = controller;
    const finalAudience = audience === "Custom (describe below)" ? customAudience : audience;
    try {
      await streamSSE(
        "/api/openai/ad-gen",
        { idea, audience: finalAudience, tone: adTone, industry },
        t => setStreamText(t),
        () => {},
        controller.signal,
      );
    } catch (e: any) {
      if (e.name !== "AbortError") setStreamText("[Generation error — please try again.]");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleNew = () => {
    abortRef.current?.abort();
    setIdea("");
    setStreamText("");
    setView("form");
  };

  if (view === "output") {
    return (
      <div className="p-5 space-y-5 animate-fade-up">
        <div className="flex items-center justify-between">
          <button onClick={handleNew}
            className="flex items-center gap-1.5 text-[13px] font-medium hover:opacity-70 transition-opacity"
            style={{ color: "#a855f7" }}>
            <span className="text-[18px] font-light">‹</span> Ad Generator
          </button>
          {streaming && (
            <button onClick={() => abortRef.current?.abort()}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: "rgba(239,68,68,0.10)", color: "#f87171", border: "1px solid rgba(239,68,68,0.20)" }}>
              Stop
            </button>
          )}
        </div>

        {/* Human approval banner */}
        {(streaming || streamText) && (
          <div className="p-3 rounded-xl flex items-start gap-2.5"
            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.20)" }}>
            <span className="text-lg flex-shrink-0">⚠️</span>
            <div>
              <p className="text-[12px] font-bold" style={{ color: "#fbbf24" }}>Human Approval Required</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                All advertising content is staged for internal review only. Do not publish, distribute, or send any of this content without explicit founder or team approval.
              </p>
            </div>
          </div>
        )}

        <OutputPanel
          label="Advertising & Marketing Packet"
          icon="📣"
          streaming={streaming}
          streamText={streamText}
          onNew={handleNew}
          onCopy={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5 animate-fade-up">
      <div>
        <h2 className="text-[20px] font-bold text-foreground" style={{ letterSpacing: "-0.03em" }}>Ad Packet Generator</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Instantly generate a complete advertising & marketing packet for any idea or project
        </p>
      </div>

      <div className="p-3 rounded-2xl flex items-start gap-2.5"
        style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.18)" }}>
        <span className="text-base flex-shrink-0">⚠️</span>
        <p className="text-[11px] font-medium" style={{ color: "rgba(251,191,36,0.85)" }}>
          All generated content is staged for human review. Never published automatically. Founder or team approval is always required before any real-world use.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-2">Idea, product, or project</label>
          <textarea
            value={idea}
            onChange={e => setIdea(e.target.value)}
            placeholder="Describe what you want to advertise — a product, service, app, event, cause, brand, or any safe idea…"
            rows={3}
            autoFocus
            className="w-full rounded-xl p-4 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none leading-relaxed input-premium"
            style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}
          />
        </div>

        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-2">Target audience</label>
          <select
            value={audience}
            onChange={e => setAudience(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-[13px] text-foreground outline-none"
            style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}>
            {AD_AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {audience === "Custom (describe below)" && (
            <input
              value={customAudience}
              onChange={e => setCustomAudience(e.target.value)}
              placeholder="Describe your specific target audience…"
              className="w-full rounded-xl px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none mt-2 input-premium"
              style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
          )}
        </div>

        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-2">Tone & voice</label>
          <div className="grid grid-cols-2 gap-2">
            {AD_TONES.map(t => (
              <button key={t} onClick={() => setAdTone(t)}
                className="py-2 px-3 rounded-xl text-[11px] font-medium text-left transition-all"
                style={{
                  background: adTone === t ? "rgba(168,85,247,0.16)" : "rgba(14,18,42,0.70)",
                  border: `1px solid ${adTone === t ? "rgba(168,85,247,0.40)" : "rgba(255,255,255,0.07)"}`,
                  color: adTone === t ? "#c084fc" : "rgba(255,255,255,0.60)",
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-2">Industry <span className="text-muted-foreground font-normal">(optional)</span></label>
          <input
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            placeholder="e.g. Healthcare, SaaS, Retail, Education, Construction…"
            className="w-full rounded-xl px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none input-premium"
            style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!idea.trim()}
          className="w-full text-white text-[14px] font-semibold py-3 rounded-xl disabled:opacity-40 transition-all"
          style={{ background: "linear-gradient(135deg, #9333ea, #7c3aed)" }}>
          Generate Full Packet →
        </button>
        <p className="text-[11px] text-center text-muted-foreground">
          Includes brand positioning, ads, social, emails, landing page, promotional materials & launch sequence
        </p>
      </div>
    </div>
  );
}

// ─── MAIN SIMULATION APP ───────────────────────────────────────────────────
const TABS = [
  { id: "universal", label: "Universal Engine", icon: "✦" },
  { id: "simulate",  label: "Simulate",         icon: "🧪" },
  { id: "gap",       label: "Gap Analyze",      icon: "🔍" },
  { id: "ads",       label: "Ad Packets",       icon: "📣" },
] as const;

type TabId = typeof TABS[number]["id"];

export function SimulationApp() {
  const [tab, setTab] = useState<TabId>("universal");

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex-shrink-0 px-4 pt-4 pb-0">
        <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto"
          style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.07)", scrollbarWidth: "none" }}>
          {TABS.map(t => {
            const isUniversal = t.id === "universal";
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[12px] font-semibold transition-all"
                style={{
                  background: active
                    ? isUniversal ? "rgba(99,102,241,0.22)" : "rgba(168,85,247,0.20)"
                    : "transparent",
                  border: active
                    ? isUniversal ? "1px solid rgba(99,102,241,0.40)" : "1px solid rgba(168,85,247,0.35)"
                    : "1px solid transparent",
                  color: active
                    ? isUniversal ? "#a5b4fc" : "#c084fc"
                    : "rgba(255,255,255,0.40)",
                }}>
                <span className="text-sm">{t.icon}</span>
                <span className="hidden sm:inline whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "universal" && <UniversalDemoEngine />}
        {tab === "simulate"  && <div className="h-full overflow-y-auto overscroll-contain"><SimulateTab /></div>}
        {tab === "gap"       && <div className="h-full overflow-y-auto overscroll-contain"><GapTab /></div>}
        {tab === "ads"       && <div className="h-full overflow-y-auto overscroll-contain"><AdPacketTab /></div>}
      </div>
    </div>
  );
}
