import React, { useState, useEffect, useCallback } from "react";
import { useOS } from "@/os/OSContext";
import { BrainGen } from "@/engine/BrainGen";

type FamilyView = "home" | "projects" | "apps" | "documents" | "help";

interface FamilyDoc {
  id: number;
  title: string;
  body: string;
  docType: string;
  createdAt: string;
  updatedAt?: string;
}

const HELP_TIPS = [
  { q: "How do I start?", a: "Tap the AI Chat app from the Home screen. Ask it anything — it knows you and your platform." },
  { q: "Where are my files?", a: "Open My Documents from the sidebar. All your files are loaded from the database — real and persistent." },
  { q: "How do I invite someone?", a: "Go to the People app and tap + Invite. Paste in their name, email, or phone and tap Parse Contacts." },
  { q: "What does Demo mode mean?", a: "Demo mode is a safe simulation — nothing is real, nothing is sent, and nothing can break. It's your playground." },
  { q: "Can I create documents?", a: "Yes! Open My Documents and tap Create New. The Brain builds it and saves it automatically to your library." },
];

const FAMILY_APPS = [
  { name: "AI Chat",   icon: "💬", desc: "Talk to the Brain",    appId: "chat"      },
  { name: "Documents", icon: "📄", desc: "Your files",           appId: "documents" },
  { name: "People",    icon: "👥", desc: "Contacts & invites",   appId: "people"    },
  { name: "Create",    icon: "✨", desc: "Make anything",        appId: "creator"   },
];

const DOC_TEMPLATES = [
  { name: "Welcome Guide",              type: "Guide",    icon: "📖" },
  { name: "Family Notes",               type: "Notes",    icon: "📝" },
  { name: "Getting Started Checklist",  type: "Checklist",icon: "✅" },
  { name: "Weekly Planner",             type: "Planner",  icon: "📅" },
  { name: "Ideas & Goals",              type: "Document", icon: "💡" },
];

export function FamilyApp() {
  const { openApp } = useOS();
  const [view, setView] = useState<FamilyView>("home");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // ── Real documents ─────────────────────────────────────────────────────
  const [docs, setDocs]             = useState<FamilyDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [openDocId, setOpenDocId]   = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("Document");
  const [savingDoc, setSavingDoc]   = useState(false);

  // ── Real projects ───────────────────────────────────────────────────────
  const [realProjects, setRealProjects]     = useState<Array<{ id: string; name: string; icon: string; industry: string }>>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    fetch("/api/projects", { credentials: "include" })
      .then(r => r.ok ? r.json() : { projects: [] })
      .then((d: { projects?: typeof realProjects }) => setRealProjects(d.projects ?? []))
      .catch(() => {})
      .finally(() => setLoadingProjects(false));
  }, []);

  // Load documents when entering the documents view
  useEffect(() => {
    if (view !== "documents") return;
    setDocsLoading(true);
    fetch("/api/documents", { credentials: "include" })
      .then(r => r.ok ? r.json() : { documents: [] })
      .then((d: { documents?: FamilyDoc[] }) => setDocs(d.documents ?? []))
      .catch(() => {})
      .finally(() => setDocsLoading(false));
  }, [view]);

  // Generate and save a document via BrainGen → /api/documents
  const handleGenerate = useCallback(async (docName: string, docType: string, existingId?: number) => {
    setGenerating(true); setGenError("");
    try {
      const gen = BrainGen.generateDocument(docName, docType);
      const res = await fetch(
        existingId ? `/api/documents/${existingId}` : "/api/documents",
        {
          method: existingId ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: docName, body: gen.content, docType }),
        }
      );
      const data = await res.json() as { document?: FamilyDoc; error?: string };
      if (data.document) {
        setDocs(prev => existingId
          ? prev.map(d => d.id === existingId ? data.document! : d)
          : [data.document!, ...prev]
        );
        if (!existingId) setOpenDocId(data.document.id);
      } else {
        setGenError(data.error ?? "Failed to save document");
      }
    } catch {
      setGenError("Network error — could not save");
    } finally {
      setGenerating(false);
    }
  }, []);

  // Create a new document from the template picker
  const handleCreateNew = useCallback(async () => {
    if (!newDocName.trim()) return;
    setSavingDoc(true); setGenError("");
    await handleGenerate(newDocName.trim(), newDocType);
    setShowCreate(false);
    setNewDocName("");
    setNewDocType("Document");
    setSavingDoc(false);
  }, [newDocName, newDocType, handleGenerate]);

  // ── Projects view ─────────────────────────────────────────────────────
  if (view === "projects") {
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setView("home")} className="text-primary text-sm font-medium">‹ Home</button>
        <h2 className="text-xl font-bold text-foreground">My Projects</h2>
        {loadingProjects ? (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-4">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading your projects…
          </div>
        ) : realProjects.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-3xl">📁</p>
            <p className="text-[13px] text-muted-foreground">No projects yet. Create one from ProjectOS!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {realProjects.map(p => (
              <button key={p.id} onClick={() => openApp("projos")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:border-primary/20 hover:shadow-sm transition-all text-left group">
                <span className="text-3xl group-hover:scale-110 transition-transform">{p.icon || "📁"}</span>
                <div className="flex-1">
                  <p className="font-semibold text-[14px] text-foreground">{p.name}</p>
                  <p className="text-[12px] text-muted-foreground">{p.industry}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.10)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.22)" }}>
                  Active
                </span>
              </button>
            ))}
          </div>
        )}
        <button onClick={() => openApp("projos")}
          className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
          Open ProjectOS →
        </button>
      </div>
    );
  }

  // ── Apps view ─────────────────────────────────────────────────────────
  if (view === "apps") {
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setView("home")} className="text-primary text-sm font-medium">‹ Home</button>
        <h2 className="text-xl font-bold text-foreground">My Apps</h2>
        <div className="grid grid-cols-2 gap-3">
          {FAMILY_APPS.map(app => (
            <button key={app.name} onClick={() => openApp(app.appId as Parameters<typeof openApp>[0])}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl text-center hover:border-primary/30 hover:shadow-sm transition-all group">
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

  // ── Documents view ────────────────────────────────────────────────────
  if (view === "documents") {
    // ── Single document open ──
    const openDoc = openDocId ? docs.find(d => d.id === openDocId) ?? null : null;
    if (openDoc) {
      return (
        <div className="p-6 space-y-5">
          <button onClick={() => setOpenDocId(null)} className="text-primary text-sm font-medium">‹ My Documents</button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {DOC_TEMPLATES.find(t => t.name === openDoc.title)?.icon ?? "📄"}
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{openDoc.title}</h2>
              <p className="text-[12px] text-muted-foreground">
                {openDoc.docType} · {new Date(openDoc.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {openDoc.body
            ? (
              <div className="rounded-xl bg-white/4 border border-white/6 p-5">
                <pre className="text-[12px] text-foreground whitespace-pre-wrap leading-relaxed">{openDoc.body}</pre>
              </div>
            )
            : (
              <div className="bg-white/4 border border-white/6 rounded-2xl p-6 text-center space-y-3">
                <p className="text-3xl">🧠</p>
                <p className="font-semibold text-foreground">Generate "{openDoc.title}" with Brain</p>
                <p className="text-[12px] text-muted-foreground">The Brain creates real structured content and saves it automatically.</p>
                <button
                  onClick={() => handleGenerate(openDoc.title, openDoc.docType, openDoc.id)}
                  disabled={generating}
                  className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                  {generating ? "Generating…" : "Generate with Brain"}
                </button>
              </div>
            )
          }

          {genError && (
            <div className="text-[12px] text-red-400 bg-red-400/10 rounded-xl px-4 py-3 border border-red-400/20">
              ⚠️ {genError}
            </div>
          )}

          {openDoc.body && (
            <button
              onClick={() => handleGenerate(openDoc.title, openDoc.docType, openDoc.id)}
              disabled={generating}
              className="w-full bg-muted border border-white/8 text-foreground text-[12px] font-semibold py-2.5 rounded-xl hover:bg-muted/80 transition-colors disabled:opacity-50">
              {generating ? "⟳ Regenerating…" : "🔄 Regenerate & Overwrite"}
            </button>
          )}
        </div>
      );
    }

    // ── Document list ──
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setView("home")} className="text-primary text-sm font-medium">‹ Home</button>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary text-white text-[12px] font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
            + Create New
          </button>
        </div>
        <h2 className="text-xl font-bold text-foreground">My Documents</h2>

        {/* Create new document form */}
        {showCreate && (
          <div style={{
            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8" }}>CREATE NEW DOCUMENT</div>

            {/* Templates */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {DOC_TEMPLATES.map(t => (
                <button key={t.name} onClick={() => { setNewDocName(t.name); setNewDocType(t.type); }}
                  style={{
                    background: newDocName === t.name ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${newDocName === t.name ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 8, padding: "4px 10px", fontSize: 11, color: newDocName === t.name ? "#818cf8" : "#94a3b8",
                    cursor: "pointer",
                  }}>
                  {t.icon} {t.name}
                </button>
              ))}
            </div>

            {/* Custom name */}
            <input
              value={newDocName}
              onChange={e => setNewDocName(e.target.value)}
              placeholder="Or type a custom document name…"
              style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit",
              }}
            />

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCreateNew} disabled={savingDoc || !newDocName.trim()}
                style={{
                  background: "#6366f1", border: "none", borderRadius: 8, padding: "8px 16px",
                  color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  opacity: !newDocName.trim() || savingDoc ? 0.5 : 1,
                }}>
                {savingDoc ? "Creating…" : "🧠 Generate & Save"}
              </button>
              <button onClick={() => { setShowCreate(false); setNewDocName(""); }}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: "8px 12px",
                  color: "#94a3b8", fontSize: 13, cursor: "pointer",
                }}>
                Cancel
              </button>
            </div>

            {genError && (
              <div style={{ fontSize: 12, color: "#ff6b6b", padding: "6px 10px", background: "rgba(255,59,48,0.1)", borderRadius: 6 }}>
                ⚠️ {genError}
              </div>
            )}
          </div>
        )}

        {/* Document list from DB */}
        {docsLoading ? (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-4">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading your documents…
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-3xl">📭</p>
            <p className="font-semibold text-[14px] text-foreground">No documents yet</p>
            <p className="text-[12px] text-muted-foreground">Tap "Create New" above to generate your first document.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map(doc => {
              const template = DOC_TEMPLATES.find(t => t.name === doc.title);
              const icon = template?.icon ?? (doc.docType === "Notes" ? "📝" : doc.docType === "Guide" ? "📖" : "📄");
              return (
                <button key={doc.id} onClick={() => setOpenDocId(doc.id)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl hover:border-primary/20 hover:shadow-sm transition-all text-left">
                  <span className="text-2xl flex-shrink-0">{icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-[13px] text-foreground">{doc.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {doc.docType} · {new Date(doc.createdAt).toLocaleDateString()}
                      {doc.body ? "" : " · Not yet generated"}
                    </p>
                  </div>
                  {doc.body
                    ? <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(52,199,89,0.1)", color: "#34C759", border: "1px solid rgba(52,199,89,0.2)" }}>Ready</span>
                    : <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,149,0,0.1)", color: "#FF9500", border: "1px solid rgba(255,149,0,0.2)" }}>Empty</span>
                  }
                  <span className="text-muted-foreground text-xs">→</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Help view ─────────────────────────────────────────────────────────
  if (view === "help") {
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setView("home")} className="text-primary text-sm font-medium">‹ Home</button>
        <h2 className="text-xl font-bold text-foreground">Help & Guidance</h2>
        <p className="text-[13px] text-muted-foreground">Tap any question to see the answer.</p>
        <div className="space-y-2">
          {HELP_TIPS.map((tip, i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
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

  // ── Home ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-3">🏡</div>
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
            className="flex flex-col items-center gap-2 p-5 rounded-2xl text-center hover:border-primary/20 hover:shadow-sm transition-all group">
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
            "Documents auto-save to your personal library",
            "Need help? Tap Help & Guidance above",
          ].map((tip, i) => (
            <p key={i} className="text-[12px] text-primary/60 flex items-start gap-2">
              <span className="font-bold">{i + 1}.</span><span>{tip}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
