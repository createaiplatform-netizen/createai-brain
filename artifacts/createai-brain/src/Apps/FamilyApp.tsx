import React, { useState } from "react";
import { useOS } from "@/os/OSContext";
import { BrainGen } from "@/engine/BrainGen";

type FamilyView = "home" | "projects" | "apps" | "documents" | "help";

const HELP_TIPS = [
  { q: "How do I start?", a: "Tap the AI Chat app from the Home screen. Ask it anything — it knows you and your platform." },
  { q: "Where are my files?", a: "Open the Documents app from the sidebar or Home screen. All your files are listed there by project." },
  { q: "How do I invite someone?", a: "Go to the People app and tap + Invite. Paste in their name, email, or phone and tap Parse Contacts." },
  { q: "What does Demo mode mean?", a: "Demo mode is a safe simulation — nothing is real, nothing is sent, and nothing can break. It's your playground." },
  { q: "Can I create documents?", a: "Yes! Tap Create Anything from the Home screen or sidebar. Choose your type, describe what you want, and the Brain builds it." },
];

const FAMILY_PROJECTS = [
  { name: "My Workspace", icon: "🏡", desc: "Your personal home base", status: "Active" },
  { name: "Family Shared", icon: "👨‍👩‍👧", desc: "Shared family projects", status: "Active" },
];

const FAMILY_APPS = [
  { name: "AI Chat",   icon: "💬", desc: "Talk to the Brain",    appId: "chat"      },
  { name: "Documents", icon: "📄", desc: "Your files",           appId: "documents" },
  { name: "People",    icon: "👥", desc: "Contacts & invites",   appId: "people"    },
  { name: "Create",    icon: "✨", desc: "Make anything",        appId: "creator"   },
];

const FAMILY_DOCS = [
  { name: "Welcome Guide", type: "Guide", icon: "📖" },
  { name: "Family Notes",  type: "Notes", icon: "📝" },
  { name: "Getting Started Checklist", type: "Checklist", icon: "✅" },
];

export function FamilyApp() {
  const { openApp } = useOS();
  const [view, setView] = useState<FamilyView>("home");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<Record<string, string>>({});

  if (view === "projects") {
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setView("home")} className="text-primary text-sm font-medium">‹ Home</button>
        <h2 className="text-xl font-bold text-foreground">My Projects</h2>
        <div className="space-y-3">
          {FAMILY_PROJECTS.map(p => (
            <button key={p.name} onClick={() => openApp("projects")}
              className="w-full flex items-center gap-4 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left group">
              <span className="text-3xl group-hover:scale-110 transition-transform">{p.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-[14px] text-foreground">{p.name}</p>
                <p className="text-[12px] text-muted-foreground">{p.desc}</p>
              </div>
              <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">{p.status}</span>
            </button>
          ))}
        </div>
        <button onClick={() => openApp("projects")}
          className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
          Open Projects App →
        </button>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-[12px] text-blue-700">New projects are created from the Projects app. Ask AI Chat to help you set one up!</p>
        </div>
      </div>
    );
  }

  if (view === "apps") {
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setView("home")} className="text-primary text-sm font-medium">‹ Home</button>
        <h2 className="text-xl font-bold text-foreground">My Apps</h2>
        <div className="grid grid-cols-2 gap-3">
          {FAMILY_APPS.map(app => (
            <button key={app.name} onClick={() => openApp(app.appId as any)}
              className="flex flex-col items-center gap-2 p-5 bg-background rounded-2xl border border-border/50 text-center hover:border-primary/30 hover:shadow-sm transition-all group">
              <span className="text-3xl group-hover:scale-110 transition-transform">{app.icon}</span>
              <p className="font-semibold text-[13px] text-foreground">{app.name}</p>
              <p className="text-[11px] text-muted-foreground">{app.desc}</p>
              <span className="text-[10px] text-primary font-semibold">Open →</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground text-center">Tap any app to open it now.</p>
      </div>
    );
  }

  if (view === "documents") {
    if (openDoc) {
      const doc = FAMILY_DOCS.find(d => d.name === openDoc)!;
      const content = docContent[openDoc] ?? "";
      const handleGenerate = () => {
        const gen = BrainGen.generateDocument(doc.name, doc.type);
        setDocContent(prev => ({ ...prev, [openDoc]: gen.content }));
      };
      return (
        <div className="p-6 space-y-5">
          <button onClick={() => setOpenDoc(null)} className="text-primary text-sm font-medium">‹ My Documents</button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{doc.icon}</span>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{doc.name}</h2>
              <p className="text-[12px] text-muted-foreground">{doc.type}</p>
            </div>
          </div>
          {content
            ? <div className="bg-background border border-border/50 rounded-2xl p-5">
                <pre className="text-[12px] text-foreground whitespace-pre-wrap leading-relaxed">{content}</pre>
              </div>
            : <div className="bg-muted/30 border border-border/40 rounded-2xl p-6 text-center space-y-3">
                <p className="text-3xl">🧠</p>
                <p className="font-semibold text-foreground">Generate "{doc.name}" with Brain</p>
                <p className="text-[12px] text-muted-foreground">Tap below — the Brain creates real structured content instantly.</p>
                <button onClick={handleGenerate}
                  className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                  Generate with Brain
                </button>
              </div>
          }
          {content && (
            <button onClick={handleGenerate}
              className="w-full bg-muted border border-border/50 text-foreground text-[12px] font-semibold py-2.5 rounded-xl hover:bg-muted/80 transition-colors">
              🔄 Regenerate
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setView("home")} className="text-primary text-sm font-medium">‹ Home</button>
        <h2 className="text-xl font-bold text-foreground">My Documents</h2>
        <div className="space-y-2">
          {FAMILY_DOCS.map(doc => (
            <button key={doc.name} onClick={() => setOpenDoc(doc.name)}
              className="w-full flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left">
              <span className="text-2xl flex-shrink-0">{doc.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-[13px] text-foreground">{doc.name}</p>
                <p className="text-[11px] text-muted-foreground">{doc.type}</p>
              </div>
              <span className="text-muted-foreground text-xs">→</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view === "help") {
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setView("home")} className="text-primary text-sm font-medium">‹ Home</button>
        <h2 className="text-xl font-bold text-foreground">Help & Guidance</h2>
        <p className="text-[13px] text-muted-foreground">Tap any question to see the answer.</p>
        <div className="space-y-2">
          {HELP_TIPS.map((tip, i) => (
            <div key={i} className="bg-background rounded-2xl border border-border/50 overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left">
                <p className="font-semibold text-[13px] text-foreground">{tip.q}</p>
                <span className={`text-muted-foreground text-sm transition-transform ${openFaq === i ? "rotate-90" : ""}`}>›</span>
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4">
                  <p className="text-[13px] text-muted-foreground">{tip.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Home ──
  return (
    <div className="p-6 space-y-5">
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-3xl bg-blue-100 flex items-center justify-center text-3xl mx-auto mb-3">🏡</div>
        <h2 className="text-xl font-bold text-foreground">Welcome Home</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Here's everything that's yours.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { view: "projects"  as FamilyView, name: "My Projects",    icon: "📁", desc: "Your personal projects" },
          { view: "apps"      as FamilyView, name: "My Apps",        icon: "📱", desc: "Apps available to you" },
          { view: "documents" as FamilyView, name: "My Documents",   icon: "📄", desc: "Files you've created" },
          { view: "help"      as FamilyView, name: "Help & Guidance", icon: "💡", desc: "Getting started tips" },
        ].map(item => (
          <button key={item.name} onClick={() => setView(item.view)}
            className="flex flex-col items-center gap-2 p-5 bg-background rounded-2xl border border-border/50 text-center hover:border-primary/20 hover:shadow-sm transition-all group">
            <span className="text-3xl group-hover:scale-110 transition-transform">{item.icon}</span>
            <p className="font-semibold text-[13px] text-foreground">{item.name}</p>
            <p className="text-[11px] text-muted-foreground">{item.desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-blue-50 rounded-2xl p-4">
        <h3 className="font-semibold text-[14px] text-blue-800 mb-2">💡 Quick Tips</h3>
        <div className="space-y-2">
          {[
            "Tap any card above to explore your space",
            "Ask AI Chat any question — it knows you",
            "Your documents are always saved and ready",
            "Need help? Tap Help & Guidance above",
          ].map((tip, i) => (
            <p key={i} className="text-[12px] text-blue-700 flex items-start gap-2">
              <span className="font-bold">{i + 1}.</span><span>{tip}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
