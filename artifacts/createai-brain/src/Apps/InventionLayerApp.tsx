import { useState, useEffect } from "react";

const API = "/api";

type Tool = {
  id: string; icon: string; name: string; desc: string; bypass: string;
};

const TOOL_ICONS: Record<string, string> = {
  scribe: "🩺", fleet: "🚛", energy: "⚡", property: "🏠", risk: "🛡",
  caselaw: "⚖", production: "🏭", grants: "🎁", compliance: "✅",
  sequences: "📬", fintelligence: "📈", agro: "🌾"
};

export default function InventionLayerApp() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selected, setSelected] = useState<Tool | null>(null);
  const [toolPage, setToolPage] = useState<{ html: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toolLoading, setToolLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/studio/inventions`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.tools) setTools(d.tools); })
      .catch(() => {
        setTools([
          { id: "scribe", icon: "🩺", name: "AI Clinical Scribe", desc: "Converts symptom input and consultation notes into structured SOAP notes, care plans, and patient education summaries.", bypass: "Replaces EHR clinical notes + licensing ($800–$2,000/mo)" },
          { id: "fleet", icon: "🚛", name: "AI Fleet Intelligence", desc: "Virtual fleet management via milestone reporting and AI inference. Route timelines, risk assessments, driver communications.", bypass: "Replaces GPS hardware + ELD devices ($50K+)" },
          { id: "energy", icon: "⚡", name: "AI Energy Intelligence", desc: "Meter reading analysis. Detects anomalies, forecasts consumption, identifies maintenance needs.", bypass: "Replaces SCADA + IoT sensors ($50K+)" },
          { id: "property", icon: "🏠", name: "AI Property Intelligence", desc: "Self-hosted listing database with AI-powered comp analysis, pricing recommendations, and market assessments.", bypass: "Replaces MLS/IDX access ($500+/yr)" },
          { id: "risk", icon: "🛡", name: "AI Risk Underwriter", desc: "AI-powered risk questionnaire and scoring engine. Risk profiles, premium estimates, coverage recommendations.", bypass: "Replaces actuarial databases ($10K–$100K/yr)" },
          { id: "caselaw", icon: "⚖", name: "AI Legal Research Engine", desc: "AI synthesizes legal analysis, relevant precedent frameworks, argument structures, and risk assessments.", bypass: "Replaces Westlaw + LexisNexis ($500+/mo)" },
          { id: "production", icon: "🏭", name: "AI Production Intelligence", desc: "Shift report analysis. Calculates OEE, identifies downtime patterns, generates CAPA drafts.", bypass: "Replaces MES + IoT sensors ($100K+)" },
          { id: "grants", icon: "🎁", name: "AI Grant Writer", desc: "Full grant proposal generation: needs statement, project description, evaluation plan, budget narrative.", bypass: "Replaces grant writing consultants ($5K–$15K/proposal)" },
          { id: "compliance", icon: "✅", name: "AI Compliance Pack", desc: "Industry-specific compliance framework, required policies, SOP outlines, compliance calendar, regulatory checklist.", bypass: "Replaces compliance consultants ($10K–$50K/yr)" },
          { id: "sequences", icon: "📬", name: "AI Email Sequence Builder", desc: "Multi-email drip sequence generation: full copy, subject lines, send timing, personalization variables.", bypass: "Replaces marketing automation platforms ($300–$2,000/mo)" },
          { id: "fintelligence", icon: "📈", name: "AI Financial Intelligence", desc: "Portfolio analysis, risk profiling, financial planning narratives, market synthesis from self-reported data.", bypass: "Replaces Bloomberg + actuarial models ($2,000+/mo)" },
          { id: "agro", icon: "🌾", name: "AI Agronomist", desc: "Visual observation-based crop health diagnosis, treatment plans, field management, yield forecasts.", bypass: "Replaces soil sensors + precision ag IoT ($50K+/farm)" },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  async function openTool(tool: Tool) {
    setSelected(tool);
    setToolLoading(true);
    setToolPage(null);
    try {
      const r = await fetch(`${API}/studio/${tool.id}`, { credentials: "include" });
      const html = await r.text();
      setToolPage({ html });
    } catch { setToolPage(null); }
    finally { setToolLoading(false); }
  }

  const totalBypassValue = "$500K+";

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center"><div className="text-4xl mb-4">🔬</div><div className="text-slate-400 text-sm">Loading Invention Layer…</div></div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            {selected && (
              <button onClick={() => { setSelected(null); setToolPage(null); }}
                className="text-indigo-400 text-xs mb-2 hover:text-indigo-300 flex items-center gap-1">
                ← All Invention Tools
              </button>
            )}
            <h1 className="text-xl font-black text-white tracking-tight">
              {selected ? selected.name : "Invention Layer"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {selected ? selected.bypass : `12 AI tools bypassing ${totalBypassValue} in annual software licenses`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded border border-amber-500/30">12 TOOLS</span>
            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded border border-indigo-500/30">GPT-4o POWERED</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!selected && (
          <div className="p-6 space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tools Active</div>
                <div className="text-3xl font-black text-amber-400">12</div>
                <div className="text-xs text-slate-600 mt-1">All operational</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Software Bypassed</div>
                <div className="text-3xl font-black text-indigo-400">{totalBypassValue}</div>
                <div className="text-xs text-slate-600 mt-1">Annual license value</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">AI Model</div>
                <div className="text-xl font-black text-emerald-400">GPT-4o</div>
                <div className="text-xs text-slate-600 mt-1">All 12 tools</div>
              </div>
            </div>

            <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-4">
              <div className="text-sm font-bold text-indigo-300 mb-2">The Invention Principle</div>
              <div className="text-xs text-indigo-400 leading-relaxed">
                Each invention tool replaces a system that requires expensive hardware, regulated API access, specialist credentials, or proprietary databases — with pure AI inference over structured human input. No external dependencies. No recurring license costs. Full capability from day one.
              </div>
            </div>

            {/* Tool Grid */}
            <div className="grid grid-cols-2 gap-4">
              {tools.map(tool => (
                <div key={tool.id} onClick={() => openTool(tool)}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-amber-500/40 hover:bg-slate-800 transition-all group">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{tool.icon ?? TOOL_ICONS[tool.id] ?? "🔬"}</span>
                    <div className="flex-1">
                      <div className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">{tool.name}</div>
                      <div className="text-xs text-emerald-400 mt-0.5">{tool.bypass}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed">{tool.desc}</div>
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-1 text-xs text-indigo-400 font-semibold">
                      Open Tool →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <div className="h-full">
            {toolLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-4xl mb-3">{selected.icon ?? "🔬"}</div>
                  <div className="text-slate-400 text-sm">Loading {selected.name}…</div>
                </div>
              </div>
            ) : toolPage ? (
              <iframe
                srcDoc={toolPage.html}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-forms allow-same-origin"
                title={selected.name}
              />
            ) : (
              <div className="p-6 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="text-3xl mb-3">{selected.icon}</div>
                  <div className="text-lg font-bold text-white mb-2">{selected.name}</div>
                  <div className="text-sm text-slate-400 mb-4">{selected.desc}</div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <div className="text-xs font-bold text-emerald-400 mb-1">WHAT IT REPLACES</div>
                    <div className="text-sm text-emerald-300">{selected.bypass}</div>
                  </div>
                  <div className="mt-4 text-xs text-slate-500">
                    Tool interface loaded from API. Ensure the API Server workflow is running for full interactivity.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
