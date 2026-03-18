import React, { useState, useRef, useEffect } from "react";
import { StandaloneLayout, StandaloneMode } from "./StandaloneLayout";
import { streamEngine } from "@/controller";

interface GenericProductProps {
  projectId: string;
  name: string;
  icon: string;
  color: string;
  industry: string;
}

// ─── Generate contextual content from industry/name ───────────────────────
function buildContent(name: string, industry: string) {
  const isFinance    = industry === "Finance";
  const isMarketing  = industry === "Marketing";
  const isOperations = industry === "Operations";
  const isHealthcare = industry === "Healthcare";

  const stats = isFinance
    ? [{ l: "Total Revenue",  v: "$2.4M",  i: "💰", c: "#34C759" }, { l: "Active Accounts", v: "1,248", i: "👤", c: "#007AFF" }, { l: "Pending Txns",   v: "34",     i: "⏳", c: "#FF9500" }, { l: "Risk Score",     v: "Low",    i: "🛡️", c: "#34C759" }]
    : isMarketing
    ? [{ l: "Campaigns",   v: "12 Active", i: "📣", c: "#FF2D55" }, { l: "Leads",         v: "3,891", i: "📊", c: "#007AFF" }, { l: "Conversions",   v: "6.8%",   i: "🎯", c: "#34C759" }, { l: "Reach",         v: "42K",    i: "🌐", c: "#FF9500" }]
    : isOperations
    ? [{ l: "Open Tasks",  v: "47",     i: "🗂️", c: "#FF9500" }, { l: "Completed",    v: "312",    i: "✅", c: "#34C759" }, { l: "Team Members", v: "18",     i: "👥", c: "#007AFF" }, { l: "Efficiency",   v: "91%",    i: "⚡", c: "#5856D6" }]
    : [{ l: "Projects",   v: "6",      i: "📁", c: "#007AFF" }, { l: "Tasks Done",   v: "241",    i: "✅", c: "#34C759" }, { l: "AI Outputs",   v: "89",     i: "🤖", c: "#5856D6" }, { l: "Team",         v: "9",      i: "👥", c: "#FF9500" }];

  const workflows = isFinance
    ? [
        { name: "Account Onboarding",  icon: "🏦", steps: ["Identity Verification", "KYC Documentation", "Account Setup", "Initial Review", "Activation"] },
        { name: "Transaction Review",  icon: "🔍", steps: ["Transaction Flagged", "Analyst Review", "Risk Assessment", "Approval or Escalation", "Log & Close"] },
        { name: "Report Generation",   icon: "📊", steps: ["Select Date Range", "Pull Data", "AI Summary Draft", "Compliance Review", "Export & Distribute"] },
      ]
    : isMarketing
    ? [
        { name: "Campaign Launch",     icon: "🚀", steps: ["Brief & Strategy", "Creative Development", "Review & Approval", "Channel Setup", "Launch & Monitor"] },
        { name: "Lead Nurture Flow",   icon: "🎯", steps: ["Lead Captured", "Segment & Score", "Email Sequence Triggered", "Sales Handoff", "CRM Updated"] },
        { name: "Content Calendar",    icon: "📅", steps: ["Topic Research", "Brief Creation", "Content Draft", "Review & Edit", "Schedule & Publish"] },
      ]
    : isOperations
    ? [
        { name: "Task Assignment",     icon: "📋", steps: ["Task Created", "Priority Set", "Assignee Selected", "Deadline Confirmed", "In Progress → Done"] },
        { name: "Quality Review",      icon: "✅", steps: ["Work Submitted", "First Review", "Revision Round", "Final Approval", "Archive & Log"] },
        { name: "Resource Planning",   icon: "🗓️", steps: ["Capacity Review", "Demand Forecast", "Allocation Plan", "Team Confirmation", "Execute & Track"] },
      ]
    : [
        { name: "Project Kickoff",     icon: "🚀", steps: ["Define Scope", "Assign Team", "Set Milestones", "Tooling Setup", "First Sprint"] },
        { name: "Content Generation",  icon: "✨", steps: ["Brief Input", "AI Draft", "Review & Edit", "Approve", "Publish or Export"] },
        { name: "Review & Approval",   icon: "✅", steps: ["Submit Work", "Peer Review", "Manager Approval", "Final Check", "Delivered"] },
      ];

  const docs = [
    { name: `${name} Overview`,             type: "Guide",     icon: "📖", pages: 4 },
    { name: "Onboarding Checklist",          type: "Checklist", icon: "✅", pages: 2 },
    { name: "Workflow Reference Guide",      type: "Reference", icon: "🗂️", pages: 5 },
    { name: "Settings & Configuration",     type: "Manual",    icon: "⚙️", pages: 3 },
    { name: `${industry} Best Practices`,   type: "Best Practice", icon: "⭐", pages: 4 },
    { name: "Data Privacy Notice (Mock)",   type: "Policy",    icon: "🔒", pages: 2 },
  ];

  const features = [
    { icon: "🤖", title: "AI-Powered Automation",  desc: `Intelligent workflows tailored for ${industry} operations. Structured and non-operational.` },
    { icon: "📊", title: "Real-Time Dashboards",   desc: "Live stats, activity feeds, and KPI tracking — all simulated in Demo/Test mode." },
    { icon: "📋", title: "Full Workflow Engine",    desc: `End-to-end ${industry.toLowerCase()} workflows with step-by-step guided flows.` },
    { icon: "📄", title: "Document Suite",          desc: "Generate, preview, and download structured documents instantly." },
    { icon: "🌐", title: "Team Collaboration",      desc: "Assign roles, share documents, and manage approvals — all mock." },
    { icon: "🔒", title: "Safe & Expandable",       desc: "Runs in Demo/Test mode. LIVE mode requires real integrations and expert review." },
  ];

  return { stats, workflows, docs, features };
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function GenericDashboard({ name, industry, color, mode }: { name: string; industry: string; color: string; mode: StandaloneMode }) {
  const { stats } = buildContent(name, industry);
  const activity = [
    `Latest workflow completed — ${new Date().toLocaleTimeString()}`,
    "3 new items added to the queue",
    "AI Assistant session logged",
    "Document export triggered",
    "Settings updated — Demo mode confirmed",
  ];
  return (
    <div className="p-5 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">{mode} Mode · All data is mock · {name}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.l} className="bg-background rounded-2xl border border-border/50 p-4 text-center shadow-sm">
            <p className="text-2xl mb-1">{s.i}</p>
            <p className="text-2xl font-bold" style={{ color: s.c }}>{s.v}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-background rounded-2xl border border-border/50 p-4">
          <h3 className="font-semibold text-[14px] text-foreground mb-3">Activity Feed</h3>
          <div className="space-y-2">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p className="text-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-background rounded-2xl border border-border/50 p-4 space-y-3">
          <h3 className="font-semibold text-[14px] text-foreground">Quick Actions</h3>
          {["Start New Workflow", "Generate Document", "Ask AI Assistant", "View Reports"].map(a => (
            <button key={a} className="w-full text-left text-[13px] py-2.5 px-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors text-foreground font-medium flex items-center justify-between">
              <span>{a}</span><span className="text-muted-foreground">→</span>
            </button>
          ))}
        </div>
      </div>
      <div className={`rounded-2xl p-4 border ${mode === "Demo" ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
        <p className={`text-[12px] font-semibold ${mode === "Demo" ? "text-blue-700" : "text-orange-700"}`}>
          {mode === "Demo" ? `🧭 Demo Mode — Safe simulation of ${name}. Switch to Test Mode to explore freely.` : `🧪 Test Mode — Sandbox active for ${name}. All interactions are simulated.`}
        </p>
      </div>
    </div>
  );
}

// ─── Workflows ───────────────────────────────────────────────────────────────
function GenericWorkflows({ name, industry }: { name: string; industry: string }) {
  const { workflows } = buildContent(name, industry);
  const [active, setActive] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);

  const wf = active !== null ? workflows[active] : null;

  if (wf) {
    return (
      <div className="p-5 md:p-6 space-y-5 max-w-2xl mx-auto">
        <button onClick={() => { setActive(null); setStep(0); setDone([]); }} className="text-primary text-sm font-medium">‹ Workflows</button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{wf.icon}</span>
          <h2 className="text-xl font-bold text-foreground">{wf.name}</h2>
        </div>
        <div className="flex gap-1">
          {wf.steps.map((_, i) => <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i < step || done.includes(i) ? "bg-primary" : "bg-muted"}`} />)}
        </div>
        {step < wf.steps.length ? (
          <div className="bg-background rounded-2xl border border-border/50 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">{step + 1}</div>
              <h3 className="font-bold text-[15px] text-foreground">{wf.steps[step]}</h3>
            </div>
            <p className="text-[13px] text-muted-foreground">Complete this step: verify inputs, confirm with team members (mock), and proceed to the next stage. All actions are simulated — no real changes made.</p>
            <div className="flex gap-2">
              <button onClick={() => { setDone(p => [...p, step]); setStep(s => s + 1); }}
                className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90">
                Complete: {wf.steps[step]} →
              </button>
              {step > 0 && <button onClick={() => setStep(s => s - 1)} className="px-4 border border-border/50 rounded-xl text-muted-foreground hover:bg-muted text-sm">← Back</button>}
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
            <p className="text-3xl">✅</p>
            <h3 className="font-bold text-foreground text-lg">{wf.name} — Complete</h3>
            <p className="text-[13px] text-muted-foreground">All {wf.steps.length} steps completed in simulation. No real actions taken.</p>
            <button onClick={() => { setStep(0); setDone([]); }} className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90">Run Again</button>
          </div>
        )}
        <div className="space-y-1.5">
          {wf.steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl border ${i === step && step < wf.steps.length ? "bg-primary/5 border-primary/20" : done.includes(i) ? "bg-green-50 border-green-200" : "bg-muted/20 border-transparent"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${done.includes(i) ? "bg-green-500 text-white" : i === step ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                {done.includes(i) ? "✓" : i + 1}
              </div>
              <p className={`text-[12px] ${i === step ? "text-foreground font-semibold" : done.includes(i) ? "text-green-700" : "text-muted-foreground"}`}>{s}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-5 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Workflows</h2>
      <div className="space-y-3">
        {workflows.map((w, i) => (
          <button key={i} onClick={() => setActive(i)}
            className="w-full flex items-center gap-4 p-5 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left group">
            <span className="text-3xl">{w.icon}</span>
            <div className="flex-1">
              <p className="font-bold text-[14px] text-foreground">{w.name}</p>
              <p className="text-[12px] text-muted-foreground">{w.steps.length} steps: {w.steps.join(" → ")}</p>
            </div>
            <span className="text-primary text-sm font-semibold">Start →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Documents ───────────────────────────────────────────────────────────────
function GenericDocuments({ name, industry, productName }: { name: string; industry: string; productName: string }) {
  const { docs } = buildContent(name, industry);

  const download = (doc: typeof docs[0]) => {
    const content = `${doc.name.toUpperCase()}\n${"=".repeat(doc.name.length)}\n\nProduct: ${productName}\nType: ${doc.type} · Pages: ${doc.pages}\nStatus: MOCK — Non-operational, structural only\n\nSECTION 1 — PURPOSE\n${"—".repeat(40)}\nThis document outlines the conceptual framework for ${doc.name} within the ${productName} system. All content is mock. Intended as a scaffold for qualified implementation.\n\nSECTION 2 — COMPONENTS (MOCK)\n${"—".repeat(40)}\n• Element A — Primary structural framework\n• Element B — Supporting workflow layer\n• Element C — Verification and approval gate\n• Element D — Audit and documentation trail\n\nSECTION 3 — WORKFLOW STEPS (MOCK)\n${"—".repeat(40)}\n1. Initiation — request or trigger\n2. Processing — core action taken\n3. Verification — review and approval\n4. Completion — outcome recorded\n5. Archive — stored for compliance reference\n\nDISCLAIMER\n${"—".repeat(40)}\nGenerated by CreateAI Brain in DEMO mode.\nMOCK CONTENT ONLY — Not operational.\nConsult qualified professionals before real use.\n\nGenerated: ${new Date().toLocaleString()}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_MOCK.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Documents</h2>
      <div className="space-y-2">
        {docs.map((doc, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-background rounded-2xl border border-border/50">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">{doc.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] text-foreground truncate">{doc.name}</p>
              <p className="text-[11px] text-muted-foreground">{doc.type} · {doc.pages} pages · Mock</p>
            </div>
            <button onClick={() => download(doc)} className="text-[11px] bg-primary/10 text-primary font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors flex-shrink-0">⬇</button>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">All documents are mock. Not operational. Download as .txt placeholder file.</p>
    </div>
  );
}

// ─── Marketing ───────────────────────────────────────────────────────────────
function GenericMarketing({ name, industry, icon, color, features }: { name: string; industry: string; icon: string; color: string; features: { icon: string; title: string; desc: string }[] }) {
  const [tab, setTab] = useState<"landing"|"features"|"pricing">("landing");
  return (
    <div className="p-5 md:p-6 space-y-5 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Marketing Pages</h2>
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {(["landing", "features", "pricing"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold capitalize ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>{t}</button>
        ))}
      </div>
      {tab === "landing" && (
        <div className="space-y-4">
          <div className="rounded-2xl p-8 text-center space-y-3 border" style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)`, borderColor: `${color}30` }}>
            <p className="text-4xl">{icon}</p>
            <h1 className="text-2xl font-bold text-foreground">{name}</h1>
            <p className="text-[14px] text-muted-foreground">A fully simulated {industry} platform — built by CreateAI Brain. Demonstrating what structured, AI-assisted {industry.toLowerCase()} operations could look like.</p>
            <div className="flex gap-2 justify-center">
              <button className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90">Request Demo (Mock)</button>
              <button className="border border-border/50 text-muted-foreground px-5 py-2 rounded-xl text-sm font-semibold hover:bg-muted">Learn More</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {["Full AI workflow engine", "Step-by-step guided flows", "Document generation & export", "Multi-mode: Demo, Test, Live", "Multilingual support", "Zero-setup demo experience"].map(f => (
              <div key={f} className="flex items-center gap-2 p-2.5 bg-background rounded-xl border border-border/50">
                <span className="text-green-500 font-bold">✓</span>
                <p className="text-[12px] text-foreground">{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "features" && (
        <div className="grid md:grid-cols-2 gap-3">
          {features.map(f => (
            <div key={f.title} className="bg-background rounded-2xl border border-border/50 p-4 space-y-1.5">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-bold text-[14px] text-foreground">{f.title}</h3>
              <p className="text-[12px] text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      )}
      {tab === "pricing" && (
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { name: "Demo", price: "Free",    note: "For presentations", features: ["Full demo mode", "Mock data", "AI assistant", "Doc downloads"] },
            { name: "Team", price: "$199/mo", note: "Per workspace (mock)", features: ["5 users", "Test mode", "Custom workflows", "Support"] },
            { name: "Enterprise", price: "Custom", note: "For large teams (mock)", features: ["Unlimited users", "White-label", "Live mode ready", "Dedicated support"] },
          ].map((p, i) => (
            <div key={p.name} className={`bg-background rounded-2xl border p-4 space-y-3 ${i === 1 ? "border-primary/30 shadow-sm" : "border-border/50"}`}>
              {i === 1 && <span className="text-[10px] bg-primary text-white font-bold px-2 py-0.5 rounded-full">Popular</span>}
              <div>
                <p className="font-bold text-[15px] text-foreground">{p.name}</p>
                <p className="text-2xl font-bold text-primary">{p.price}</p>
                <p className="text-[10px] text-muted-foreground">{p.note}</p>
              </div>
              {p.features.map(f => <p key={f} className="text-[12px] text-foreground flex items-center gap-2"><span className="text-green-500">✓</span>{f}</p>)}
              <button className="w-full py-2 rounded-xl text-[12px] font-semibold bg-primary/10 text-primary hover:bg-primary/20">Get Started (Mock)</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI Assistant ─────────────────────────────────────────────────────────────
interface Msg { role: "user"|"assistant"|"system"; content: string; }

function GenericAI({ name, industry }: { name: string; industry: string }) {
  const [messages, setMessages] = useState<Msg[]>([{
    role: "system",
    content: `🤖 ${name} AI Assistant (DEMO)\n\nI'm your AI assistant for the ${name} platform — specialized for ${industry} workflows.\n\nAll my responses are structural mock content — not real ${industry.toLowerCase()} advice. I can help you explore workflows, explain features, and demonstrate AI-assisted operations.\n\nHow can I help?`,
  }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [buf, setBuf] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, buf]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || streaming) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setStreaming(true); setBuf("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      let acc = "";
      await streamEngine({
        engineId: "BrainGen",
        topic:    `[${name} AI Assistant — ${industry} — Demo Mode]\n\nUser: "${q}"\n\nRespond as a ${industry} platform assistant. Clearly label yourself as AI. Provide helpful, structural, non-operational guidance. Stay focused on ${industry.toLowerCase()} workflows and platform features. Keep it practical and concise.`,
        signal:   ctrl.signal,
        onChunk:  (t) => { acc += t; setBuf(acc); },
        onDone:   (full) => setMessages(prev => [...prev, { role: "assistant", content: full }]),
        onError:  () => setMessages(prev => [...prev, { role: "assistant", content: "[Error — please retry.]" }]),
      });
    } catch (err: any) {
      if (err.name !== "AbortError") setMessages(prev => [...prev, { role: "assistant", content: "[Error — please retry.]" }]);
    } finally { setStreaming(false); setBuf(""); abortRef.current = null; }
  };

  const QUICK = [`Explain ${industry} workflows`, "What can I build with this?", "How does the AI work?", "Show me the key features"];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none px-4 py-2 border-b border-border/30">
        <p className="text-[13px] font-semibold text-foreground">{name} AI <span className="text-[10px] text-muted-foreground font-normal ml-1">· Demo · Not real {industry.toLowerCase()} advice</span></p>
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          {QUICK.map(q => <button key={q} onClick={() => send(q)} disabled={streaming} className="text-[10px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full hover:bg-muted/80 disabled:opacity-40 transition-colors">{q}</button>)}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role !== "user" && <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2 mt-0.5">🤖</div>}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-white rounded-br-sm" : msg.role === "system" ? "bg-muted/50 border border-border/40" : "bg-background border border-border/50"}`}>
              <pre className="text-[12px] whitespace-pre-wrap leading-relaxed font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}
        {streaming && buf && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2">🤖</div>
            <div className="max-w-[80%] bg-background border border-border/50 rounded-2xl px-4 py-3">
              <pre className="text-[12px] text-foreground whitespace-pre-wrap font-sans leading-relaxed">{buf}<span className="inline-block w-2 h-3 bg-primary/60 animate-pulse ml-0.5 align-middle" /></pre>
            </div>
          </div>
        )}
        {streaming && !buf && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs flex-shrink-0 mr-2">🤖</div>
            <div className="bg-background border border-border/50 rounded-2xl px-4 py-3 flex gap-1">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex-none p-3 border-t border-border/50 bg-background/80">
        <form onSubmit={e => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-full pl-4 pr-1.5 py-1.5">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder={`Ask about ${industry} workflows…`}
            className="flex-1 bg-transparent border-none outline-none text-[14px] placeholder:text-muted-foreground" disabled={streaming} />
          <button type="submit" disabled={!input.trim() || streaming}
            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Toggle Setting ───────────────────────────────────────────────────────────
function GToggle({ label, desc, defaultOn = false }: { label: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border/50">
      <div>
        <p className="font-semibold text-[13px] text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <button onClick={() => setOn(v => !v)} className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${on ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────
function GenericSettings({ mode, onModeChange }: { mode: StandaloneMode; onModeChange: (m: StandaloneMode) => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="p-5 md:p-6 space-y-5 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Settings</h2>
      <div className="bg-background rounded-2xl border border-border/50 p-5 space-y-3">
        <h3 className="font-semibold text-[14px] text-foreground">System Mode</h3>
        <div className="grid grid-cols-3 gap-2">
          {(["Demo", "Test", "Live"] as StandaloneMode[]).map(m => (
            <button key={m} onClick={() => m !== "Live" && onModeChange(m)}
              className={`py-2.5 rounded-xl text-[12px] font-bold ${mode === m ? { Demo: "bg-green-100 text-green-700", Test: "bg-orange-100 text-orange-700", Live: "bg-gray-100 text-gray-400" }[m] : "bg-muted text-muted-foreground"}`}>
              {m === "Live" ? "🔒 Live" : m}
            </button>
          ))}
        </div>
      </div>
      <GToggle label="AI Assistant"  desc="Enable AI assistance throughout the product" defaultOn />
      <GToggle label="Demo Tooltips" desc="Show guided tooltips in Demo mode" defaultOn />
      <GToggle label="Notifications" desc="Show mock in-app notifications" />
      <GToggle label="Audit Logging" desc="Log all actions for review (mock)" />
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
        className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90">
        {saved ? "✓ Saved" : "Save Settings"}
      </button>
    </div>
  );
}

// ─── Main Generic Product ─────────────────────────────────────────────────────
export function GenericProduct({ projectId, name, icon, color, industry }: GenericProductProps) {
  const [section, setSection] = useState("dashboard");
  const [mode, setMode] = useState<StandaloneMode>("Demo");
  const { features } = buildContent(name, industry);

  const NAV = [
    { id: "dashboard",  label: "Dashboard",    icon: "🏠" },
    { id: "workflows",  label: "Workflows",    icon: "🔄" },
    { id: "documents",  label: "Documents",    icon: "📄" },
    { id: "marketing",  label: "Marketing",    icon: "📣" },
    { id: "ai",         label: "AI Assistant", icon: "🤖" },
    { id: "settings",   label: "Settings",     icon: "⚙️" },
  ];

  return (
    <StandaloneLayout
      productName={name}
      productIcon={icon}
      productColor={color}
      navItems={NAV}
      activeSection={section}
      onSectionChange={setSection}
      mode={mode}
      onModeChange={setMode}
      disclaimer={`${name} · ${industry} Platform · All content is mock and non-operational · Powered by CreateAI Brain`}
    >
      <div className={section === "ai" ? "h-full flex flex-col" : ""}>
        {section === "dashboard"  && <GenericDashboard name={name} industry={industry} color={color} mode={mode} />}
        {section === "workflows"  && <GenericWorkflows name={name} industry={industry} />}
        {section === "documents"  && <GenericDocuments name={name} industry={industry} productName={name} />}
        {section === "marketing"  && <GenericMarketing name={name} industry={industry} icon={icon} color={color} features={features} />}
        {section === "ai"         && <GenericAI name={name} industry={industry} />}
        {section === "settings"   && <GenericSettings mode={mode} onModeChange={setMode} />}
      </div>
    </StandaloneLayout>
  );
}
