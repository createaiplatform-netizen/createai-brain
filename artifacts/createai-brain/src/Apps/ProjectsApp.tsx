import React, { useState } from "react";
import { useLocation } from "wouter";
import { useOS } from "@/os/OSContext";
import { BrainGen, generateProjectPackage, ProjectPackage, ProjectDeliverable } from "@/engine/BrainGen";
import { UNIVERSAL_MODULES } from "@/engine/InfiniteExpansionEngine";

// ─── Types ──────────────────────────────────────────────────────────────────
type Mode = "Demo" | "Test" | "Live";

const PROJECTS = [
  { name: "Healthcare System – Legal Safe", mode: "DEMO",   pages: 6, icon: "🏥", color: "#34C759", hasDemo: true,  slug: "healthcare-legal-safe" },
  { name: "Healthcare System – Mach 1",    mode: "FUTURE", pages: 5, icon: "🔬", color: "#BF5AF2", hasDemo: false, slug: "healthcare-mach1" },
  { name: "Monetary System – Legal Safe",  mode: "DEMO",   pages: 7, icon: "💳", color: "#007AFF", hasDemo: false, slug: "monetary-legal-safe" },
  { name: "Monetary System – Mach 1",      mode: "FUTURE", pages: 5, icon: "🚀", color: "#FF9500", hasDemo: false, slug: "monetary-mach1" },
  { name: "Marketing Hub",                 mode: "DEMO",   pages: 6, icon: "📣", color: "#FF2D55", hasDemo: false, slug: "marketing-hub" },
  { name: "Operations Builder",            mode: "TEST",   pages: 9, icon: "🏗️", color: "#5856D6", hasDemo: false, slug: "operations-builder" },
];

function openStandalone(slug: string) {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  window.open(`${base}/standalone/${slug}`, "_blank", "noopener");
}

const ALL_SUB_PAGES = [
  { id: "overview",   label: "Overview",    icon: "📋" },
  { id: "apps",       label: "Apps",        icon: "📱" },
  { id: "tools",      label: "Tools",       icon: "🛠️" },
  { id: "documents",  label: "Documents",   icon: "📄" },
  { id: "forms",      label: "Forms",       icon: "📝" },
  { id: "brochures",  label: "Brochures",   icon: "🗂️" },
  { id: "marketing",  label: "Marketing",   icon: "📣" },
  { id: "settings",   label: "Settings",    icon: "⚙️" },
  { id: "ai",         label: "AI Assistant",icon: "🤖" },
];

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK_PATIENTS = [
  { id: "P-001", name: "Alex M.",   age: 47, condition: "Hypertension (mock)",  room: "101-A", status: "Stable" },
  { id: "P-002", name: "Sarah K.",  age: 62, condition: "Type 2 Diabetes (mock)", room: "103-B", status: "Monitoring" },
  { id: "P-003", name: "James T.",  age: 35, condition: "Respiratory (mock)",   room: "105-A", status: "Recovering" },
];
const MOCK_VITALS: Record<string, { bp: string; hr: number; o2: number; temp: string; rr: number }> = {
  "P-001": { bp: "138/88", hr: 78,  o2: 97, temp: "98.4°F", rr: 16 },
  "P-002": { bp: "122/74", hr: 84,  o2: 95, temp: "99.1°F", rr: 18 },
  "P-003": { bp: "115/70", hr: 96,  o2: 93, temp: "100.2°F", rr: 22 },
};
const MOCK_ORDERS = [
  { id: "O-001", patient: "Alex M.",  type: "Lab",      order: "Comprehensive Metabolic Panel (mock)", status: "Pending" },
  { id: "O-002", patient: "Alex M.",  type: "Med",      order: "Lisinopril 10mg daily (mock)",         status: "Active" },
  { id: "O-003", patient: "Sarah K.", type: "Lab",      order: "HbA1c test (mock)",                    status: "Complete" },
  { id: "O-004", patient: "James T.", type: "Imaging",  order: "Chest X-Ray (mock)",                   status: "Pending" },
];
const MOCK_NOTES = [
  { id: "N-001", patient: "Alex M.",  type: "Admission",  author: "Dr. Rivera (mock)", text: "Patient presents with elevated BP readings over 3 days. No acute distress. Recommend monitoring and medication review. All content is mock and non-clinical." },
  { id: "N-002", patient: "Sarah K.", type: "Progress",   author: "Dr. Chen (mock)",   text: "Blood glucose trending down. Continue current insulin protocol. Follow-up in 72 hours. All content is mock and non-clinical." },
  { id: "N-003", patient: "James T.", type: "Progress",   author: "Dr. Patel (mock)",  text: "O2 saturation improving with supplemental oxygen. Monitor respiratory rate. All content is mock and non-clinical." },
];

// ─── Healthcare Project ──────────────────────────────────────────────────────
function HealthcareProject({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>("Demo");
  const [tab, setTab] = useState<"patients" | "vitals" | "orders" | "notes" | "ai">("patients");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [demoStep, setDemoStep] = useState(0);
  const [noteEdit, setNoteEdit] = useState<Record<string, string>>({});
  const [aiQ, setAiQ] = useState("");
  const [aiA, setAiA] = useState<string | null>(null);
  const [lang, setLang] = useState<"EN" | "TA" | "TA-EN">("EN");

  const patient = selectedPatient ? MOCK_PATIENTS.find(p => p.id === selectedPatient) : null;

  const DEMO_STEPS = [
    "Welcome to the Healthcare Demo. This is a fully simulated environment — no real patient data.",
    "Here you can see a mock patient list. Tap any patient to view their simulated record.",
    "Each patient has mock vitals, orders, and notes — all conceptual only.",
    "Switch to Test Mode to explore freely. Live Mode is a future placeholder.",
    "All information is fictional. Always involve qualified healthcare professionals for real decisions.",
  ];

  const handleAiAsk = () => {
    if (!aiQ.trim()) return;
    setAiA(`[Mock AI Response — Structural Only]\n\nRegarding: "${aiQ}"\n\nThis is a simulated explanation generated by the CreateAI Brain for demonstration purposes. In a real clinical environment, this would provide evidence-based guidance from qualified medical literature. However, this platform is conceptual only.\n\nKey points (mock):\n• Point 1 — describes the primary clinical consideration\n• Point 2 — outlines the standard approach\n• Point 3 — identifies when to escalate to a specialist\n\nAlways consult a qualified healthcare professional for real clinical decisions.\n\n[Demo Mode — Not for clinical use]`);
  };

  const modeColor = { Demo: "bg-green-100 text-green-700", Test: "bg-orange-100 text-orange-700", Live: "bg-gray-100 text-gray-400" }[mode];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-primary text-sm font-medium">‹ Projects</button>
        <div className="flex-1" />
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${modeColor}`}>{mode} Mode</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-3xl">🏥</span>
        <div>
          <h2 className="text-lg font-bold text-foreground">Healthcare System – Legal Safe</h2>
          <p className="text-[11px] text-muted-foreground">All content is mock and non-clinical. Not for real-world use.</p>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-1.5">
        {(["Demo", "Test", "Live"] as Mode[]).map(m => (
          <button key={m}
            onClick={() => { setMode(m); setDemoStep(0); setTab("patients"); }}
            className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all ${mode === m
              ? { Demo: "bg-green-100 text-green-700", Test: "bg-orange-100 text-orange-700", Live: "bg-gray-200 text-gray-500" }[m]
              : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {m}{m === "Live" ? " (Future)" : ""}
          </button>
        ))}
      </div>

      {/* Language switcher */}
      <div className="flex gap-1.5 items-center">
        <span className="text-[11px] text-muted-foreground font-medium">Language:</span>
        {(["EN", "TA", "TA-EN"] as const).map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${lang === l ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}>
            {l === "EN" ? "English" : l === "TA" ? "Tamil" : "Tamil–English"}
          </button>
        ))}
      </div>

      {/* Live mode placeholder */}
      {mode === "Live" && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center space-y-2">
          <p className="text-2xl">🔒</p>
          <h3 className="font-bold text-foreground">Live Mode — Not Yet Active</h3>
          <p className="text-[13px] text-muted-foreground">Live mode requires real EHR API credentials, legal agreements, HIPAA compliance review, and expert configuration. This is a future placeholder only.</p>
          <button onClick={() => setMode("Demo")} className="mt-2 text-[12px] bg-primary text-white px-4 py-2 rounded-xl hover:opacity-90">Back to Demo</button>
        </div>
      )}

      {/* Demo guided steps */}
      {mode === "Demo" && demoStep < DEMO_STEPS.length && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-xl">🧭</span>
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1">Demo Guide · Step {demoStep + 1} of {DEMO_STEPS.length}</p>
              <p className="text-[13px] text-blue-800">{DEMO_STEPS[demoStep]}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDemoStep(s => Math.max(0, s - 1))} disabled={demoStep === 0}
              className="text-[12px] px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg disabled:opacity-30 hover:bg-blue-100 transition-colors">← Prev</button>
            <button onClick={() => setDemoStep(s => Math.min(DEMO_STEPS.length, s + 1))}
              className="text-[12px] px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {demoStep === DEMO_STEPS.length - 1 ? "Finish Guide" : "Next →"}
            </button>
            <button onClick={() => setDemoStep(0)} className="text-[12px] text-blue-600 ml-auto hover:underline">Restart Demo</button>
          </div>
        </div>
      )}

      {mode !== "Live" && (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
            {([
              { id: "patients", label: "Patients", icon: "👤" },
              { id: "vitals",   label: "Vitals",   icon: "📊" },
              { id: "orders",   label: "Orders",   icon: "📋" },
              { id: "notes",    label: "Notes",    icon: "📝" },
              { id: "ai",       label: "AI",       icon: "🤖" },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* ── PATIENTS ── */}
          {tab === "patients" && !patient && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Mock Patients — Simulated Only</p>
              {MOCK_PATIENTS.map(p => (
                <button key={p.id} onClick={() => setSelectedPatient(p.id)}
                  className="w-full flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">{p.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] text-foreground">{p.name} <span className="text-muted-foreground font-normal">· {p.id}</span></p>
                    <p className="text-[11px] text-muted-foreground">{p.condition} · Room {p.room}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === "Stable" ? "bg-green-100 text-green-700" : p.status === "Monitoring" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>{p.status}</span>
                </button>
              ))}
            </div>
          )}
          {tab === "patients" && patient && (
            <div className="space-y-4">
              <button onClick={() => setSelectedPatient(null)} className="text-primary text-sm font-medium">‹ All Patients</button>
              <div className="bg-background rounded-2xl border border-border/50 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">{patient.name[0]}</div>
                  <div>
                    <h3 className="font-bold text-foreground">{patient.name}</h3>
                    <p className="text-[12px] text-muted-foreground">{patient.id} · Age {patient.age} · Room {patient.room}</p>
                  </div>
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${patient.status === "Stable" ? "bg-green-100 text-green-700" : patient.status === "Monitoring" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>{patient.status}</span>
                </div>
                <div className="border-t border-border/30 pt-3 space-y-1">
                  <p className="text-[12px] text-muted-foreground"><strong>Condition (mock):</strong> {patient.condition}</p>
                  {(() => { const v = MOCK_VITALS[patient.id]; return (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[["BP", v.bp], ["HR", `${v.hr} bpm`], ["O₂", `${v.o2}%`], ["Temp", v.temp], ["RR", `${v.rr}/min`]].map(([k, val]) => (
                        <div key={k} className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">{k}</p>
                          <p className="font-bold text-[13px] text-foreground">{val}</p>
                        </div>
                      ))}
                    </div>
                  ); })()}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">All data is mock and non-clinical. Not for real-world use.</p>
            </div>
          )}

          {/* ── VITALS ── */}
          {tab === "vitals" && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Mock Vitals — All Simulated</p>
              {MOCK_PATIENTS.map(p => {
                const v = MOCK_VITALS[p.id];
                return (
                  <div key={p.id} className="bg-background rounded-2xl border border-border/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-[13px] text-foreground">{p.name} <span className="text-muted-foreground font-normal text-[11px]">· {p.room}</span></p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === "Stable" ? "bg-green-100 text-green-700" : p.status === "Monitoring" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>{p.status}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[["BP", v.bp], ["HR", `${v.hr}`], ["O₂", `${v.o2}%`], ["Temp", v.temp], ["RR", `${v.rr}`]].map(([k, val]) => (
                        <div key={k} className="bg-muted/40 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-muted-foreground font-medium">{k}</p>
                          <p className="font-bold text-[12px] text-foreground">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── ORDERS ── */}
          {tab === "orders" && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Mock Orders — All Simulated</p>
              {MOCK_ORDERS.map(o => (
                <div key={o.id} className="bg-background rounded-2xl border border-border/50 p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-lg flex-shrink-0">
                    {o.type === "Lab" ? "🧪" : o.type === "Med" ? "💊" : "🩻"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] text-foreground">{o.order}</p>
                    <p className="text-[11px] text-muted-foreground">{o.patient} · {o.type} · {o.id}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${o.status === "Active" ? "bg-green-100 text-green-700" : o.status === "Complete" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>{o.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── NOTES ── */}
          {tab === "notes" && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Mock Clinical Notes — All Simulated</p>
              {MOCK_NOTES.map(n => {
                const editing = noteEdit[n.id] !== undefined;
                return (
                  <div key={n.id} className="bg-background rounded-2xl border border-border/50 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[13px] text-foreground">{n.type} Note — {n.patient}</p>
                        <p className="text-[11px] text-muted-foreground">{n.author}</p>
                      </div>
                      <button onClick={() => setNoteEdit(e => editing ? (({ [n.id]: _, ...rest }) => rest)(e) : { ...e, [n.id]: n.text })}
                        className="text-[11px] text-primary font-semibold hover:underline flex-shrink-0">
                        {editing ? "Close" : "Edit"}
                      </button>
                    </div>
                    {editing
                      ? <textarea value={noteEdit[n.id]} onChange={ev => setNoteEdit(e => ({ ...e, [n.id]: ev.target.value }))}
                          className="w-full bg-muted/40 border border-border/40 rounded-xl p-3 text-[12px] text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono" rows={5} />
                      : <p className="text-[12px] text-muted-foreground leading-relaxed">{n.text}</p>
                    }
                  </div>
                );
              })}
            </div>
          )}

          {/* ── AI ASSISTANT ── */}
          {tab === "ai" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-[12px] text-blue-800 font-semibold">🤖 AI Healthcare Assistant (Demo)</p>
                <p className="text-[11px] text-blue-700 mt-1">This assistant clearly identifies as AI. All responses are mock and non-clinical. Always consult qualified professionals for real decisions.</p>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-foreground block mb-2">Ask a clinical question (simulated)</label>
                <textarea value={aiQ} onChange={e => setAiQ(e.target.value)}
                  placeholder="e.g. What does elevated BP with no other symptoms typically indicate in a mock scenario?"
                  className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all" rows={3} />
              </div>
              <button onClick={handleAiAsk} disabled={!aiQ.trim()}
                className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40">
                Get AI Explanation (Mock)
              </button>
              {aiA && (
                <div className="bg-muted/40 border border-border/40 rounded-2xl p-4">
                  <pre className="text-[12px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">{aiA}</pre>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── BrainProjectItems ────────────────────────────────────────────────────────
function BrainProjectItems({ label, name, mode }: { label: string; name: string; mode: string }) {
  const [items, setItems] = useState<{ title: string; content: string; generating: boolean }[]>([
    { title: `${label} Overview`, content: "", generating: false },
    { title: `${label} Details`, content: "", generating: false },
    { title: `${label} Next Steps`, content: "", generating: false },
  ]);

  const generate = (i: number) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, generating: true } : it));
    setTimeout(() => {
      const result = BrainGen.generate(`${items[i].title} for ${name} project in ${mode} mode`);
      setItems(prev => prev.map((it, idx) => idx === i ? { ...it, generating: false, content: result.content } : it));
    }, 600);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-background rounded-2xl border border-border/50 p-4 space-y-2">
          <p className="font-semibold text-[14px] text-foreground">{item.title}</p>
          {item.content
            ? <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed">{item.content.slice(0, 400)}{item.content.length > 400 ? "…" : ""}</pre>
            : <p className="text-[12px] text-muted-foreground">Tap Generate to create content for this section.</p>
          }
          <div className="flex gap-2 mt-1">
            <button onClick={() => generate(i)} disabled={item.generating}
              className="text-[11px] bg-primary/10 text-primary font-semibold px-3 py-1 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1">
              {item.generating ? <><div className="w-2.5 h-2.5 border border-primary border-t-transparent rounded-full animate-spin" /><span>Generating…</span></> : "🧠 Generate"}
            </button>
            {item.content && (
              <button onClick={() => navigator.clipboard.writeText(item.content)}
                className="text-[11px] bg-muted text-muted-foreground font-semibold px-3 py-1 rounded-lg hover:bg-muted/80 transition-colors">
                Copy
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Generic project detail ──────────────────────────────────────────────────
function GenericProjectDetail({ name, icon, color, pages, mode, onBack }: {
  name: string; icon: string; color: string; pages: number; mode: string; onBack: () => void;
}) {
  const [activeMode, setActiveMode] = useState<"Demo" | "Test" | "Live">("Demo");
  const [activePage, setActivePage] = useState<string | null>(null);

  const subPages = ALL_SUB_PAGES.slice(0, pages);

  if (activePage) {
    const pg = subPages.find(p => p.id === activePage)!;
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setActivePage(null)} className="text-primary text-sm font-medium">‹ {name.split(" – ")[0]}</button>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{pg.icon}</span>
          <h2 className="text-xl font-bold text-foreground">{pg.label}</h2>
        </div>
        <BrainProjectItems label={pg.label} name={name} mode={activeMode} />
        <p className="text-[10px] text-muted-foreground text-center">AI-powered · {activeMode} mode</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <button onClick={onBack} className="text-primary text-sm font-medium">‹ Projects</button>
      <div className="flex items-center gap-3">
        <span className="text-4xl">{icon}</span>
        <div>
          <h2 className="text-xl font-bold text-foreground">{name}</h2>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${mode === "FUTURE" ? "bg-purple-100 text-purple-700" : mode === "TEST" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>{mode}</span>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-1.5">
        {(["Demo", "Test", "Live"] as const).map(m => (
          <button key={m} onClick={() => setActiveMode(m)}
            className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all ${activeMode === m
              ? { Demo: "bg-green-100 text-green-700", Test: "bg-orange-100 text-orange-700", Live: "bg-gray-200 text-gray-500" }[m]
              : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {m}{m === "Live" ? " (Future)" : ""}
          </button>
        ))}
      </div>

      {activeMode === "Live"
        ? <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center space-y-2">
            <p className="text-xl">🔒</p>
            <p className="font-bold text-foreground">Live Mode — Not Yet Active</p>
            <p className="text-[12px] text-muted-foreground">Real connections, legal agreements, and expert configuration required.</p>
            <button onClick={() => setActiveMode("Demo")} className="text-[12px] bg-primary text-white px-4 py-2 rounded-xl hover:opacity-90 mt-2">Back to Demo</button>
          </div>
        : <>
            <div>
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pages</h3>
              <div className="grid grid-cols-3 gap-2">
                {subPages.map(pg => (
                  <button key={pg.id} onClick={() => setActivePage(pg.id)}
                    className="flex flex-col items-center gap-1.5 bg-background rounded-xl border border-border/50 p-3 hover:border-primary/20 hover:shadow-sm transition-all group">
                    <span className="text-xl group-hover:scale-110 transition-transform">{pg.icon}</span>
                    <p className="text-[11px] font-medium text-foreground text-center">{pg.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">Mock content — {activeMode} mode active</p>
          </>
      }
    </div>
  );
}

// ─── Future Project Page ─────────────────────────────────────────────────────
function FutureProjectPage({ name, icon, color, onBack, onGenerate }: {
  name: string; icon: string; color: string;
  onBack: () => void; onGenerate: () => void;
}) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { onGenerate(); }, 500);
  };

  return (
    <div className="p-6 space-y-5">
      <button onClick={onBack} className="text-primary text-sm font-medium">‹ Projects</button>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: color + "22" }}>{icon}</div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{name}</h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">NEXT GENERATION</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-5 space-y-3">
        <p className="text-[14px] font-bold text-purple-900">This project is in design phase</p>
        <p className="text-[13px] text-purple-800">The next-generation architecture isn't pre-built — it's meant to be generated fresh by the Omega Creation Engine, customized to your exact specifications.</p>
        <p className="text-[12px] text-purple-700">When you generate it, the Everything Engine will build it as a standalone product with its own URL, navigation, AI assistant, and complete workflow system.</p>
      </div>

      <div className="space-y-2">
        {[
          { label: "🤖 AI-Powered Workflows", desc: "Every section driven by real-time intelligence" },
          { label: "📊 Live Dashboard", desc: "Custom metrics, charts, and status tracking" },
          { label: "🔧 Tool Suite", desc: "15+ interactive tools built for your industry" },
          { label: "📄 Document Engine", desc: "Generate, edit, and export structured docs" },
          { label: "🎨 Design System", desc: "Full theme control — colors, fonts, layouts" },
          { label: "⚡ Packet AI", desc: "Section-by-section AI editing and Q&A" },
        ].map(f => (
          <div key={f.label} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/40">
            <span className="text-[13px] font-semibold text-foreground flex-1">{f.label}</span>
            <span className="text-[11px] text-muted-foreground">{f.desc}</span>
          </div>
        ))}
      </div>

      <button onClick={handleGenerate} disabled={generating}
        className="w-full py-3.5 rounded-xl text-white font-bold text-[14px] hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
        {generating
          ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Opening Everything Engine…</>
          : <><span>✨</span> Generate {name} Now</>
        }
      </button>
      <p className="text-[11px] text-muted-foreground text-center">The Everything Engine will open with "{name}" pre-filled as your build target.</p>
    </div>
  );
}

// ─── New Project Form ────────────────────────────────────────────────────────
function NewProjectForm({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Healthcare");
  const [created, setCreated] = useState(false);

  if (created) {
    return (
      <div className="p-6 space-y-5 text-center">
        <div className="py-6">
          <p className="text-4xl mb-3">✅</p>
          <h2 className="text-xl font-bold text-foreground">Project Created (Mock)</h2>
          <p className="text-[13px] text-muted-foreground mt-1">"{name}" is ready. All pages are pre-populated with mock content.</p>
        </div>
        <button onClick={onBack} className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity">← Back to Projects</button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <button onClick={onBack} className="text-primary text-sm font-medium">‹ Projects</button>
      <h2 className="text-xl font-bold text-foreground">New Project</h2>
      <div className="space-y-4">
        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-1.5">Project Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Client Portal v2"
            className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-1.5">Industry</label>
          <div className="grid grid-cols-3 gap-2">
            {["Healthcare", "Finance", "Education", "Construction", "Retail", "Custom"].map(ind => (
              <button key={ind} onClick={() => setIndustry(ind)}
                className={`py-2 rounded-xl text-[12px] font-semibold border transition-all ${industry === ind ? "bg-primary text-white border-primary" : "bg-background border-border/50 text-muted-foreground hover:border-primary/30"}`}>
                {ind}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => { if (name.trim()) setCreated(true); }} disabled={!name.trim()}
          className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40">
          Create Project (Mock)
        </button>
        <p className="text-[11px] text-muted-foreground text-center">Projects are created in Demo mode with mock scaffolding.</p>
      </div>
    </div>
  );
}

// ─── Auto-Create View (UCP-X Project Add-On) ─────────────────────────────────

const INDUSTRY_OPTIONS = UNIVERSAL_MODULES.map(m => ({ value: m.name, label: `${m.icon} ${m.name}` }));

function AutoCreateView({ onBack }: { onBack: () => void }) {
  const [projectName, setProjectName] = useState("");
  const [industry, setIndustry] = useState("Healthcare");
  const [objective, setObjective] = useState("");
  const [generating, setGenerating] = useState(false);
  const [pkg, setPkg] = useState<ProjectPackage | null>(null);
  const [openDeliverable, setOpenDeliverable] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function handleGenerate() {
    setGenerating(true);
    setPkg(null);
    setOpenDeliverable(null);
    setTimeout(() => {
      const result = generateProjectPackage(projectName, industry, objective);
      setPkg(result);
      setGenerating(false);
      setOpenDeliverable(result.deliverables[0].id);
    }, 1400);
  }

  function handleCopy(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const active = pkg?.deliverables.find(d => d.id === openDeliverable);

  if (pkg) {
    return (
      <div className="p-5 space-y-4">
        <button onClick={onBack} className="text-primary text-sm font-medium">‹ Projects</button>

        {/* Package header */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <div>
              <p className="font-bold text-[15px] text-foreground">{pkg.projectName}</p>
              <p className="text-[11px] text-indigo-600">{pkg.industry} · UCP-X Auto-Created · {pkg.deliverables.length} deliverables</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground italic">{pkg.objective}</p>
        </div>

        {/* Deliverable picker */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {pkg.deliverables.map(d => (
            <button key={d.id} onClick={() => setOpenDeliverable(d.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all
                ${openDeliverable === d.id ? "bg-primary text-white border-primary shadow-sm" : "bg-background border-border/40 text-muted-foreground hover:border-primary/30"}`}>
              <span>{d.icon}</span>
              <span>{d.label}</span>
            </button>
          ))}
        </div>

        {/* Active deliverable */}
        {active && (
          <div className="bg-background border border-border/50 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-muted/20">
              <p className="font-bold text-[13px] text-foreground">{active.icon} {active.label}</p>
              <button onClick={() => handleCopy(active.id, active.content)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${copied === active.id ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
                {copied === active.id ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[340px]">
              <pre className="text-[11px] text-foreground whitespace-pre-wrap leading-relaxed font-mono">{active.content}</pre>
            </div>
          </div>
        )}

        {/* Copy all / regenerate */}
        <div className="flex gap-2">
          <button onClick={() => handleCopy("all", pkg.deliverables.map(d => `=== ${d.label} ===\n${d.content}`).join("\n\n"))}
            className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold border transition-all ${copied === "all" ? "bg-green-100 text-green-700 border-green-200" : "bg-muted text-muted-foreground border-border/40 hover:bg-muted/80"}`}>
            {copied === "all" ? "✓ All Copied!" : "📋 Copy All Deliverables"}
          </button>
          <button onClick={() => { setPkg(null); }}
            className="px-4 py-2.5 rounded-xl text-[12px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
            ↺ Edit
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">All content is conceptual · Powered by UCP-X Project Auto-Creation Add-On · Additive only · Core intact</p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">
      <button onClick={onBack} className="text-primary text-sm font-medium">‹ Projects</button>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">✨ Auto-Create Project</h2>
        <p className="text-[12px] text-muted-foreground">Enter once — get a complete project package instantly. Brochure, website, app wireframe, workflow map, marketing kit, training module, and live dashboard spec.</p>
      </div>

      {/* Manifest badge */}
      <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
        <span className="text-base">⚡</span>
        <p className="text-[10px] text-indigo-700 font-semibold">UCP-X Project Auto-Creation Add-On · 7 deliverables per project · All industries · Additive only</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-1.5">Project Name</label>
          <input value={projectName} onChange={e => setProjectName(e.target.value)}
            placeholder="e.g. SmartClinic Platform, Revenue Ops Hub…"
            className="w-full bg-background border border-border/50 rounded-xl px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>

        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-1.5">Industry</label>
          <select value={industry} onChange={e => setIndustry(e.target.value)}
            className="w-full bg-background border border-border/50 rounded-xl px-3 py-2.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
            {INDUSTRY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-1.5">Project Objective <span className="text-muted-foreground font-normal">(optional)</span></label>
          <textarea value={objective} onChange={e => setObjective(e.target.value)}
            placeholder="e.g. Streamline patient intake, automate compliance reporting, replace manual invoicing…"
            rows={3}
            className="w-full bg-background border border-border/50 rounded-xl px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>

        {/* What you'll get */}
        <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
          <p className="text-[11px] font-bold text-foreground uppercase tracking-wide">What gets generated</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { icon: "🗂️", label: "Brochure / PDF" },
              { icon: "🌐", label: "Website Copy" },
              { icon: "📱", label: "App Wireframe" },
              { icon: "🔄", label: "Workflow Map" },
              { icon: "📣", label: "Marketing Kit" },
              { icon: "🎯", label: "Training Module" },
              { icon: "📊", label: "Dashboard KPIs" },
            ].map(d => (
              <div key={d.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>{d.icon}</span><span>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleGenerate} disabled={generating}
          className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 text-[14px]">
          {generating
            ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating Full Package…</>
            : <>✨ Auto-Create Full Project Package</>
          }
        </button>
      </div>
    </div>
  );
}

interface DbProject {
  id: string;
  name: string;
  industry: string;
  icon: string;
  color: string;
  created: string;
}

// ─── Main ProjectsApp ────────────────────────────────────────────────────────
export function ProjectsApp() {
  const { openApp } = useOS();
  const [, navigate] = useLocation();
  const [showNewForm, setShowNewForm] = useState(false);
  const [showAutoCreate, setShowAutoCreate] = useState(false);
  const [dbProjects, setDbProjects] = useState<DbProject[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  React.useEffect(() => {
    fetch("/api/projects")
      .then(r => r.ok ? r.json() : { projects: [] })
      .then((data: { projects: DbProject[] }) => {
        setDbProjects(data.projects ?? []);
        setLoadingDb(false);
      })
      .catch(() => setLoadingDb(false));
  }, []);

  if (showNewForm) return <NewProjectForm onBack={() => setShowNewForm(false)} />;
  if (showAutoCreate) return <AutoCreateView onBack={() => setShowAutoCreate(false)} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Projects</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowAutoCreate(true)}
            className="text-sm font-medium px-3 py-2 rounded-xl border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
            ✨ Auto-Create
          </button>
          <button onClick={() => openApp("projos" as any)}
            className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
            + New in ProjectOS
          </button>
        </div>
      </div>

      {/* ── Real DB Projects ───────────────────────────────────────── */}
      {(loadingDb || dbProjects.length > 0) && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">My Projects</p>
          {loadingDb
            ? <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-2">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading…
              </div>
            : <div className="space-y-2">
                {dbProjects.map(proj => (
                  <div key={proj.id} className="bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all overflow-hidden">
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: (proj.color || "#6366f1") + "22" }}>
                        {proj.icon || "📁"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[14px] text-foreground truncate">{proj.name}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{proj.industry} · Created {proj.created}</p>
                      </div>
                      <button
                        onClick={() => openApp("projos" as any)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                        Open in ProjectOS →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* ── Platform Demo Projects ─────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">Platform Demo Projects</p>
        <div className="space-y-3">
          {PROJECTS.map(proj => (
            <div key={proj.name} className="bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all overflow-hidden">
              <button
                onClick={() => navigate(`/project/${proj.slug}`)}
                className="w-full flex items-center gap-4 p-4 text-left">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: proj.color + "22" }}>
                  {proj.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[14px] text-foreground truncate">{proj.name}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{proj.pages} sections · Full platform page</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${proj.mode === "FUTURE" ? "bg-purple-100 text-purple-700" : proj.mode === "TEST" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                  {proj.mode}
                </span>
              </button>
              <div className="border-t border-border/30 px-4 py-2.5 flex items-center justify-between bg-muted/20">
                <p className="text-[11px] text-muted-foreground">Open as full AI-powered standalone product</p>
                <button
                  onClick={() => openStandalone(proj.slug)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
                  style={{ backgroundColor: proj.color }}>
                  <span>↗</span><span>Standalone App</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
