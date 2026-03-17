import React, { useState, useRef, useEffect } from "react";
import { useOS } from "@/os/OSContext";
import { OutputFormatter } from "@/components/OutputFormatter";

interface ToolDef {
  name: string; icon: string; color: string; desc: string; type: string; section: string;
}

const TOOLS: ToolDef[] = [
  // ── BUILD ───────────────────────────────────────────────────────────────
  { name: "Brochure Builder",         icon: "📋", color: "#007AFF", desc: "Professional brochures for any service or product",           type: "Document",         section: "Build" },
  { name: "Document Creator",         icon: "📄", color: "#34C759", desc: "Proposals, reports, summaries, SOPs",                         type: "Document",         section: "Build" },
  { name: "Page Generator",           icon: "🖼️", color: "#FF9500", desc: "Landing pages, about pages, feature pages",                  type: "Page",             section: "Build" },
  { name: "App Layout Generator",     icon: "📱", color: "#BF5AF2", desc: "App screens, navigation flows, UI labels",                    type: "UI Component",     section: "Build" },
  { name: "Email Sequence Builder",   icon: "📧", color: "#FF2D55", desc: "Outreach, follow-up, re-engage sequences",                    type: "Template",         section: "Build" },
  { name: "FAQ Generator",            icon: "❓", color: "#30B0C7", desc: "Full FAQ section for any topic or product",                   type: "Content Block",    section: "Build" },
  { name: "SOP Builder",              icon: "📑", color: "#5856D6", desc: "Standard operating procedures for any process",               type: "Procedure",        section: "Build" },
  { name: "Pricing Page Builder",     icon: "💲", color: "#FF9500", desc: "Plans, tiers, value props, and CTAs",                        type: "Page",             section: "Build" },
  { name: "Training Module Creator",  icon: "🎓", color: "#34C759", desc: "Structured learning content and curricula",                   type: "Training Module",  section: "Build" },
  { name: "Checklist Generator",      icon: "✅", color: "#007AFF", desc: "Task, safety, onboarding, and verification checklists",       type: "Checklist",        section: "Build" },
  { name: "Pitch Deck Outliner",      icon: "🎯", color: "#FF2D55", desc: "Slide-by-slide pitch deck outline and script",                type: "Presentation",     section: "Build" },
  { name: "Business Plan Generator",  icon: "🏢", color: "#5856D6", desc: "Executive summary, market analysis, ops & financials plan",   type: "Business Plan",    section: "Build" },
  { name: "Job Description Builder",  icon: "👤", color: "#34C759", desc: "Role summaries, requirements, culture fit, and CTA",          type: "HR Document",      section: "Build" },
  { name: "Grant Proposal Writer",    icon: "💼", color: "#007AFF", desc: "Structured grant proposals for nonprofits, research & orgs",   type: "Proposal",         section: "Build" },
  { name: "Mock Data Generator",      icon: "🗃️", color: "#636366", desc: "Sample datasets, placeholder records, demo tables",           type: "Mock Data",        section: "Build" },
  // ── SIMULATE & ANALYZE ──────────────────────────────────────────────────
  { name: "Business Logic Analyzer",  icon: "🏢", color: "#a855f7", desc: "Revenue model, org structure, competitive position analysis", type: "Analysis",         section: "Simulate" },
  { name: "Workflow Gap Checker",     icon: "🔄", color: "#a855f7", desc: "Identify missing steps, bottlenecks & inefficiencies",        type: "Gap Analysis",     section: "Simulate" },
  { name: "Product Logic Simulator",  icon: "📦", color: "#a855f7", desc: "Feature trade-offs, user journey, value prop stress test",    type: "Simulation",       section: "Simulate" },
  { name: "Financial Scenario Model", icon: "📊", color: "#a855f7", desc: "Conceptual revenue, cost, and unit economics scenarios",       type: "Financial Model",  section: "Simulate" },
  { name: "Tech Stack Evaluator",     icon: "💻", color: "#a855f7", desc: "Architecture trade-offs, scalability, integration complexity", type: "Tech Analysis",    section: "Simulate" },
  { name: "Market Landscape Mapper",  icon: "🌐", color: "#a855f7", desc: "Competitive landscape, positioning gaps, market dynamics",     type: "Intelligence",     section: "Simulate" },
  { name: "Risk & Scenario Planner",  icon: "⚡", color: "#a855f7", desc: "What-if analysis, risk modeling, disruption simulation",      type: "Scenario Plan",    section: "Simulate" },
  { name: "Operations Audit",         icon: "⚙️", color: "#a855f7", desc: "Process quality, capacity, SOP gaps, team structure review",  type: "Ops Audit",        section: "Simulate" },
  // ── ADVERTISE ───────────────────────────────────────────────────────────
  { name: "Ad Copy Suite",            icon: "📣", color: "#f472b6", desc: "Headlines, body copy, CTAs, Google & social ads",             type: "Advertising",      section: "Advertise" },
  { name: "Social Media Pack",        icon: "📱", color: "#f472b6", desc: "Platform-aware captions for Instagram, LinkedIn, TikTok",     type: "Social Content",   section: "Advertise" },
  { name: "Landing Page Copy",        icon: "🖼️", color: "#f472b6", desc: "Hero, features, proof, CTA & footer — complete copy",        type: "Page Copy",        section: "Advertise" },
  { name: "Email Campaign Builder",   icon: "📧", color: "#f472b6", desc: "Welcome, nurture, promo & re-engagement email sequences",      type: "Email Campaign",   section: "Advertise" },
  { name: "Brand Positioning Kit",    icon: "🎯", color: "#f472b6", desc: "Taglines, value props, voice guide, audience profile",        type: "Brand Kit",        section: "Advertise" },
  { name: "Launch Sequence Planner",  icon: "🚀", color: "#f472b6", desc: "Pre-launch, launch day & post-launch action sequence",        type: "Launch Plan",      section: "Advertise" },
  // ── CUSTOM ──────────────────────────────────────────────────────────────
  { name: "Custom Tool",              icon: "✨", color: "#FF2D55", desc: "Describe any tool — the Brain builds it",                     type: "Custom",           section: "Custom" },
];

const TOOL_SECTIONS = ["Build", "Simulate", "Advertise", "Custom"] as const;
type ToolSection = typeof TOOL_SECTIONS[number];

const SECTION_META: Record<ToolSection, { color: string; icon: string; note?: string }> = {
  Build:      { color: "#007AFF", icon: "🔨" },
  Simulate:   { color: "#a855f7", icon: "🧪", note: "All simulations are conceptual & fictional" },
  Advertise:  { color: "#f472b6", icon: "📣", note: "Staged for human review — not published automatically" },
  Custom:     { color: "#FF2D55", icon: "✨" },
};

interface ToolOutput { id: string; toolName: string; prompt: string; content: string; at: Date; }

interface SaveProject { id: string; name: string; icon: string; color: string; }

function SaveToProjectModal({ content, toolName, onClose }: { content: string; toolName: string; onClose: () => void }) {
  const [projects, setProjects] = useState<SaveProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects", { credentials: "include" })
      .then(r => r.ok ? r.json() : { projects: [] })
      .then((d: { projects: SaveProject[] }) => { setProjects(d.projects ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const saveToProject = async (proj: SaveProject) => {
    setSaving(proj.id);
    await fetch(`/api/projects/${proj.id}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: toolName, content, fileType: "Document", size: `${Math.round(content.length / 100) / 10} KB` }),
    });
    setSaving(null);
    setSaved(proj.id);
    setTimeout(() => { setSaved(null); onClose(); }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm mx-4 rounded-3xl overflow-hidden" style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.10)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[15px] font-bold text-white">Save to Project</p>
          <button onClick={onClose} className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: "rgba(255,255,255,0.07)", color: "#9ca3af" }}>✕</button>
        </div>
        <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
          {loading && <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-4 justify-center"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />Loading projects…</div>}
          {!loading && projects.length === 0 && (
            <p className="text-[13px] text-center text-muted-foreground py-4">No projects yet. Create one in ProjectOS first.</p>
          )}
          {projects.map(proj => (
            <button key={proj.id} onClick={() => saveToProject(proj)}
              disabled={!!saving}
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all"
              style={{ background: saved === proj.id ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${saved === proj.id ? "rgba(34,197,94,0.30)" : "rgba(255,255,255,0.08)"}` }}>
              <span className="text-xl flex-shrink-0">{proj.icon || "📁"}</span>
              <p className="flex-1 text-[13px] font-semibold text-white truncate">{proj.name}</p>
              {saving === proj.id && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />}
              {saved === proj.id && <span className="text-green-400 text-sm flex-shrink-0">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ToolsApp() {
  const { preferences } = useOS();
  const [active, setActive] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [history, setHistory] = useState<ToolOutput[]>([]);
  const [view, setView] = useState<"grid" | "output" | "history" | "historyDetail">("grid");
  const [viewingItem, setViewingItem] = useState<ToolOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const tool = active ? TOOLS.find(t => t.name === active) : null;

  const handleGenerate = async () => {
    if (!active || !input.trim() || !tool) return;
    setStreaming(true);
    setStreamText("");
    setView("output");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Route to the correct endpoint based on tool section
      let url = "/api/openai/generate";
      let body: Record<string, unknown> = { type: tool.type, description: `Using the ${tool.name}: ${input}`, tone: preferences.tone };

      if (tool.section === "Simulate") {
        url = "/api/openai/simulate";
        body = { domain: tool.name, scenario: input, depth: "full" };
      } else if (tool.section === "Advertise") {
        url = "/api/openai/ad-gen";
        body = { idea: input, tone: preferences.tone };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error("Generation failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6);
          if (!dataStr || dataStr === "[DONE]") continue;
          try {
            const data = JSON.parse(dataStr);
            if (data.content) { accumulated += data.content; setStreamText(accumulated); }
            if (data.done) {
              setHistory(prev => [{ id: Date.now().toString(), toolName: active, prompt: input, content: accumulated, at: new Date() }, ...prev]);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setStreamText("[Generation error — please try again.]");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => abortRef.current?.abort();
  const handleCopy = () => {
    const text = viewingItem ? viewingItem.content : streamText;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  const handleNew = () => { setActive(null); setInput(""); setStreamText(""); setViewingItem(null); setView("grid"); };

  // ── History detail ──
  if (view === "historyDetail" && viewingItem) {
    const t = TOOLS.find(t => t.name === viewingItem.toolName);
    return (
      <div className="p-6 space-y-5 animate-fade-up">
        <button onClick={() => { setViewingItem(null); setView("history"); }}
          className="flex items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: "#818cf8" }}>
          <span className="text-[18px] font-light">‹</span> History
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: (t?.color ?? "#007AFF") + "22" }}>
            {t?.icon ?? "🛠️"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>{viewingItem.toolName}</h2>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{viewingItem.prompt.slice(0, 70)}{viewingItem.prompt.length > 70 ? "…" : ""}</p>
          </div>
          <button onClick={handleCopy}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all flex-shrink-0"
            style={{ background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.07)", color: copied ? "#4ade80" : "rgba(255,255,255,0.70)", border: `1px solid ${copied ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.10)"}` }}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <div className="rounded-2xl p-5 max-h-[60vh] overflow-y-auto" style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <OutputFormatter content={viewingItem.content} />
        </div>
      </div>
    );
  }

  // ── History list ──
  if (view === "history") {
    return (
      <div className="p-6 space-y-5 animate-fade-up">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("grid")}
            className="flex items-center gap-1.5 text-[13px] font-medium hover:opacity-70 transition-opacity"
            style={{ color: "#818cf8" }}>
            <span className="text-[18px] font-light">‹</span> Tools
          </button>
          <h2 className="text-[17px] font-bold text-foreground flex-1" style={{ letterSpacing: "-0.02em" }}>History</h2>
          {history.length > 0 && (
            <span className="text-[11px] text-muted-foreground px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              {history.length} items
            </span>
          )}
        </div>
        {history.length === 0
          ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">📭</p>
              <p className="font-semibold text-foreground text-[15px] mb-1.5">Your history will appear here</p>
              <p className="text-[13px] text-muted-foreground max-w-xs mx-auto leading-relaxed mb-5">
                Pick a tool and generate something — it'll live right here, ready to copy or revisit.
              </p>
              <button onClick={() => setView("grid")}
                className="text-[13px] font-semibold text-primary px-4 py-2 rounded-xl transition-all"
                style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.20)" }}>
                Browse Tools →
              </button>
            </div>
          )
          : (
            <div className="space-y-2">
              {history.map((item, i) => {
                const t = TOOLS.find(t => t.name === item.toolName);
                return (
                  <button key={item.id} onClick={() => { setViewingItem(item); setView("historyDetail"); }}
                    className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left card-interactive animate-fade-up delay-${Math.min(i * 50, 300)}`}
                    style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: (t?.color ?? "#007AFF") + "22" }}>
                      {t?.icon ?? "🛠️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] text-foreground">{item.toolName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.prompt}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1">{item.at.toLocaleTimeString()}</p>
                    </div>
                    <span className="text-muted-foreground text-xs mt-1 flex-shrink-0">→</span>
                  </button>
                );
              })}
            </div>
          )
        }
      </div>
    );
  }

  // ── Output ──
  if (view === "output") {
    return (
      <div className="p-6 space-y-5 animate-fade-up">
        <button onClick={handleNew}
          className="flex items-center gap-1.5 text-[13px] font-medium hover:opacity-70 transition-opacity"
          style={{ color: "#818cf8" }}>
          <span className="text-[18px] font-light">‹</span> Tools
        </button>

        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: (tool?.color ?? "#007AFF") + "22" }}>
            {tool?.icon ?? "🛠️"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>{active}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{input.slice(0, 70)}{input.length > 70 ? "…" : ""}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end flex-shrink-0">
            {streaming && (
              <button onClick={handleStop}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
                style={{ background: "rgba(239,68,68,0.10)", color: "#f87171", border: "1px solid rgba(239,68,68,0.20)" }}>
                Stop
              </button>
            )}
            {!streaming && streamText && (
              <>
                <button onClick={handleCopy}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
                  style={{ background: copied ? "rgba(34,197,94,0.10)" : "rgba(255,255,255,0.07)", color: copied ? "#4ade80" : "rgba(255,255,255,0.70)", border: `1px solid ${copied ? "rgba(34,197,94,0.20)" : "rgba(255,255,255,0.10)"}` }}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
                <button onClick={() => setShowSaveModal(true)}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
                  style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>
                  Save to Project
                </button>
                <button onClick={() => setView("grid")}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  Edit
                </button>
                <button onClick={handleNew}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white btn-primary transition-all">
                  + New
                </button>
              </>
            )}
          </div>
        </div>

        {streaming && !streamText && (
          <div className="flex flex-col items-center gap-3 py-12 justify-center">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center animate-float" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[13px] text-muted-foreground">{active} is generating…</p>
          </div>
        )}

        {streamText && (
          <div className="rounded-2xl p-5 max-h-[62vh] overflow-y-auto" style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <OutputFormatter content={streamText} />
            {streaming && (
              <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5 align-middle rounded-sm" />
            )}
          </div>
        )}

        {!streaming && streamText && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 justify-center">
            <span>✓</span>
            <span>Generated · Not for real-world use · Copy or save to continue</span>
          </div>
        )}

        {showSaveModal && active && (
          <SaveToProjectModal
            content={streamText}
            toolName={active}
            onClose={() => setShowSaveModal(false)}
          />
        )}
      </div>
    );
  }

  // ── Tool form ──
  if (active && tool) {
    const isSimulate  = tool.section === "Simulate";
    const isAdvertise = tool.section === "Advertise";
    const formLabel   = isSimulate ? "What would you like to simulate or analyze?" : isAdvertise ? "What would you like to advertise?" : "What would you like to create?";
    const btnLabel    = isSimulate ? `Run ${tool.name} →` : isAdvertise ? `Generate Ad Content →` : `Generate with ${tool.name} →`;
    const btnStyle    = isSimulate ? { background: "linear-gradient(135deg,#9333ea,#7c3aed)" } : isAdvertise ? { background: "linear-gradient(135deg,#db2777,#e11d48)" } : undefined;

    return (
      <div className="p-6 space-y-5 animate-fade-up">
        <button onClick={() => { setActive(null); setInput(""); setView("grid"); }}
          className="flex items-center gap-1.5 text-[13px] font-medium hover:opacity-70 transition-opacity"
          style={{ color: tool.color }}>
          <span className="text-[18px] font-light">‹</span> Tools
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ backgroundColor: tool.color + "22", border: `1px solid ${tool.color}30` }}>
            {tool.icon}
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>{tool.name}</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">{tool.desc}</p>
          </div>
        </div>

        {isSimulate && (
          <div className="p-3 rounded-xl flex items-start gap-2"
            style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.18)" }}>
            <span className="text-sm flex-shrink-0">🧪</span>
            <p className="text-[11px] font-medium" style={{ color: "rgba(192,132,252,0.90)" }}>
              All simulations are conceptual and fictional only — for analysis and planning exploration. No real decisions, clinical advice, or legal guidance.
            </p>
          </div>
        )}

        {isAdvertise && (
          <div className="p-3 rounded-xl flex items-start gap-2"
            style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.18)" }}>
            <span className="text-sm flex-shrink-0">⚠️</span>
            <p className="text-[11px] font-medium" style={{ color: "rgba(251,191,36,0.90)" }}>
              Staged for human review — generated content is never published automatically. Founder or team approval required before any real-world use.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-2">{formLabel}</label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isSimulate ? `Describe the scenario, system, or concept to analyze…` : isAdvertise ? `Describe what you want to advertise — product, service, idea, or project…` : `e.g. A ${tool.name.toLowerCase()} for a horse boarding facility in rural Minnesota…`}
              className="w-full rounded-xl p-4 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none transition-all leading-relaxed input-premium"
              style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}
              rows={4}
              autoFocus
            />
          </div>
          {!isSimulate && (
            <p className="text-[11px] text-muted-foreground">
              Tone: <strong className="text-foreground/70">{preferences.tone}</strong> · Language: <strong className="text-foreground/70">{preferences.language}</strong>
            </p>
          )}
          <button
            onClick={handleGenerate}
            disabled={!input.trim()}
            className="w-full text-white text-[14px] font-semibold py-3 rounded-xl disabled:opacity-40 transition-all btn-primary"
            style={btnStyle}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    );
  }

  // ── Tool grid ──
  return (
    <div className="p-5 space-y-6 animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold text-foreground" style={{ letterSpacing: "-0.03em" }}>Tools</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">Build, simulate, and advertise — any safe idea, any industry</p>
        </div>
        <button onClick={() => setView("history")}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground rounded-xl px-3 py-2 flex-shrink-0 transition-all"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)")}>
          <span>📂</span>
          <span>History{history.length > 0 ? ` (${history.length})` : ""}</span>
        </button>
      </div>

      {TOOL_SECTIONS.map(section => {
        const sectionTools = TOOLS.filter(t => t.section === section);
        const meta = SECTION_META[section];
        return (
          <div key={section} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{meta.icon}</span>
              <p className="text-[13px] font-bold text-foreground">{section}</p>
              {meta.note && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: meta.color + "14", color: meta.color, border: `1px solid ${meta.color}28` }}>
                  {meta.note}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {sectionTools.map((t, i) => (
                <button
                  key={t.name}
                  onClick={() => { setActive(t.name); setInput(""); setView("grid"); }}
                  className={`flex items-center gap-3.5 p-3.5 rounded-xl text-left group card-interactive animate-fade-up delay-${Math.min(i * 30, 300)}`}
                  style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                    style={{ backgroundColor: t.color + "1A", border: `1px solid ${t.color}25` }}
                  >
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] text-foreground">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{t.desc}</p>
                  </div>
                  <span className="text-muted-foreground text-xs flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity">→</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
