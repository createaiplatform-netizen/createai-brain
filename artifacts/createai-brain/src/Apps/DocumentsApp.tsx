import React, { useState } from "react";
import { BrainGen } from "@/engine/BrainGen";
import { OutputFormatter } from "@/components/OutputFormatter";

const DOCS = [
  { name: "Healthcare – Mock Workflow Overview", type: "Document", project: "Healthcare Legal Safe", size: "2 pages", icon: "📄" },
  { name: "Operations – Role Structure",         type: "Report",   project: "Operations Builder",  size: "3 pages", icon: "📋" },
  { name: "Marketing – Brand Voice Guide",       type: "Brand Kit",project: "Marketing Hub",       size: "4 pages", icon: "🎨" },
  { name: "Monetary – Plans & Tiers Overview",   type: "Pricing",  project: "Monetary Legal Safe", size: "1 page",  icon: "💳" },
  { name: "People – Onboarding Checklist",       type: "Form",     project: "Admin",               size: "1 page",  icon: "✅" },
];

const DOC_CONTENT: Record<string, { sections: { title: string; body: string }[] }> = {
  "Healthcare – Mock Workflow Overview": { sections: [
    { title: "Purpose", body: "This document outlines the conceptual workflow for a healthcare management system. All content is mock and non-clinical. No real patient data is referenced." },
    { title: "Patient Intake Flow (Mock)", body: "1. Patient registration form completed\n2. Insurance verification (mock)\n3. Triage assessment by nurse (mock)\n4. Physician review and orders placed (mock)\n5. Discharge summary generated (mock)" },
    { title: "Key Roles (Mock)", body: "• Front Desk Coordinator — handles intake\n• Triage Nurse — initial assessment\n• Attending Physician — orders and notes\n• Care Coordinator — follow-up scheduling" },
    { title: "Next Steps", body: "Consult qualified healthcare professionals, obtain legal agreements, and configure real EHR integrations before any clinical use." },
  ]},
  "Operations – Role Structure": { sections: [
    { title: "Overview", body: "Structural overview of the Operations Builder role hierarchy. All content is mock." },
    { title: "Roles", body: "• Founder — full platform access\n• Admin — operational control\n• Creator — content and tools\n• Viewer — read-only access" },
    { title: "Responsibilities (Mock)", body: "Each role has scoped access to tools, projects, and engines as defined by the RBAC security layer." },
  ]},
  "Marketing – Brand Voice Guide": { sections: [
    { title: "Brand Voice", body: "Calm. Clear. Empowering. Non-judgmental. Sara's tone is the platform's tone." },
    { title: "Tone Guidelines", body: "• Never overwhelming\n• Never shaming\n• Always positive\n• Always offering a way forward\n• Preserve every idea" },
    { title: "Usage", body: "Apply this voice to all generated documents, marketing copy, social content, and AI assistant responses." },
  ]},
  "Monetary – Plans & Tiers Overview": { sections: [
    { title: "Plans (Mock)", body: "Starter: $29/mo · Creator: $79/mo · Enterprise: Custom" },
    { title: "Revenue Share", body: "Default: 25% platform share. Adjustable by Founder, including 0%." },
    { title: "Note", body: "All pricing is mock. No real transactions are processed." },
  ]},
  "People – Onboarding Checklist": { sections: [
    { title: "Onboarding Steps (Mock)", body: "☐ Welcome email sent (via mailto)\n☐ Account created (future — LIVE mode)\n☐ Role assigned\n☐ First project scaffolded\n☐ AI Chat introduced\n☐ Help & Guidance reviewed" },
    { title: "Notes", body: "All steps are conceptual. Real onboarding requires authentication and LIVE mode configuration." },
  ]},
};

interface UserDoc {
  name: string; type: string; project: string; size: string; icon: string; generatedContent?: string;
}

export function DocumentsApp() {
  const [selected, setSelected] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Document");
  const [newCreated, setNewCreated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [userDocs, setUserDocs] = useState<UserDoc[]>([]);

  if (showNew) {
    if (newCreated) {
      return (
        <div className="p-6 space-y-5 text-center animate-scale-in">
          <div className="py-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl animate-float" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.20)" }}>
              ✅
            </div>
            <h2 className="text-[20px] font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>Document Ready</h2>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed max-w-xs mx-auto">
              "{newName}" has been created with structured content — ready to view, edit, or export.
            </p>
          </div>
          <button
            onClick={() => { setShowNew(false); setNewName(""); setNewCreated(false); }}
            className="text-white text-[14px] font-semibold px-6 py-3 rounded-xl btn-primary transition-all"
          >
            ← Back to Documents
          </button>
        </div>
      );
    }
    return (
      <div className="p-6 space-y-5 animate-fade-up">
        <button onClick={() => setShowNew(false)}
          className="flex items-center gap-1 text-[13px] font-medium hover:opacity-70 transition-opacity"
          style={{ color: "#818cf8" }}>
          <span className="text-[18px] font-light">‹</span> Documents
        </button>
        <div>
          <h2 className="text-[20px] font-bold text-foreground" style={{ letterSpacing: "-0.03em" }}>New Document</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">The Brain will generate real structured content instantly.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-2">Document Name</label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Q2 Operations Summary"
              className="w-full rounded-xl px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none transition-all input-premium"
              style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}
              autoFocus
            />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-2">Document Type</label>
            <div className="grid grid-cols-3 gap-2">
              {["Document", "Report", "Checklist", "Form", "Template", "Guide"].map(t => (
                <button key={t} onClick={() => setNewType(t)}
                  className="py-2 rounded-xl text-[12px] font-semibold transition-all duration-150"
                  style={
                    newType === t
                      ? { background: "linear-gradient(135deg, #6366f1 0%, #5457d8 100%)", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.30)" }
                      : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                  onMouseEnter={e => { if (newType !== t) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)"; }}
                  onMouseLeave={e => { if (newType !== t) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              if (!newName.trim()) return;
              setGenerating(true);
              setTimeout(() => {
                const gen = BrainGen.generateDocument(newName, newType);
                setUserDocs(prev => [...prev, {
                  name: newName, type: newType, project: "My Workspace", size: "AI-generated", icon: "📄",
                  generatedContent: gen.content,
                }]);
                setGenerating(false);
                setNewCreated(true);
              }, 700);
            }}
            disabled={!newName.trim() || generating}
            className="w-full text-white text-[14px] font-semibold py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 btn-primary transition-all"
          >
            {generating
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Generating with Brain…</span></>
              : <><span>🧠</span><span>Generate with Brain</span></>
            }
          </button>
          <p className="text-[11px] text-muted-foreground/60 text-center">Structured content is generated instantly · Not for real-world use</p>
        </div>
      </div>
    );
  }

  if (selected) {
    const allDocs: UserDoc[] = [...DOCS, ...userDocs];
    const doc = allDocs.find(d => d.name === selected)!;
    const predefined = DOC_CONTENT[selected];
    const sectionText = predefined
      ? predefined.sections.map(s => `## ${s.title}\n\n${s.body}`).join("\n\n")
      : (doc as UserDoc).generatedContent ?? "Content not yet generated. Click Edit to add content.";

    if (editMode) {
      return (
        <div className="p-6 space-y-5 animate-fade-up">
          <div className="flex items-center gap-3">
            <button onClick={() => { setEditMode(false); setEditedContent(""); }}
              className="flex items-center gap-1 text-[13px] font-medium hover:opacity-70 transition-opacity"
              style={{ color: "#818cf8" }}>
              <span className="text-[18px] font-light">‹</span> View
            </button>
            <h2 className="text-[15px] font-bold text-foreground flex-1 truncate">{doc.name}</h2>
          </div>
          <p className="text-[11px] text-muted-foreground/70">Editing content — changes are session-only and not saved permanently.</p>
          <textarea
            value={editedContent || sectionText}
            onChange={e => setEditedContent(e.target.value)}
            className="w-full rounded-xl p-4 text-[12px] text-foreground font-mono resize-none outline-none transition-all leading-relaxed input-premium"
            style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}
            rows={16}
          />
          <button onClick={() => setEditMode(false)}
            className="w-full text-white text-[14px] font-semibold py-3 rounded-xl btn-primary transition-all">
            Save Changes (Session)
          </button>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-5 animate-fade-up">
        <button onClick={() => setSelected(null)}
          className="flex items-center gap-1 text-[13px] font-medium hover:opacity-70 transition-opacity"
          style={{ color: "#818cf8" }}>
          <span className="text-[18px] font-light">‹</span> Documents
        </button>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.20)" }}>
            {doc.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>{doc.name}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">{doc.type} · {doc.project} · {doc.size}</p>
          </div>
        </div>

        <div className="rounded-2xl p-5 max-h-[55vh] overflow-y-auto" style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {predefined
            ? <div className="space-y-4">
                {predefined.sections.map((s, i) => (
                  <div key={i} className={i < predefined.sections.length - 1 ? "pb-4" : ""} style={i < predefined.sections.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.07)" } : {}}>
                    <h3 className="font-semibold text-[14px] text-foreground mb-1.5">{s.title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</p>
                  </div>
                ))}
              </div>
            : <OutputFormatter content={editedContent || sectionText} />
          }
        </div>

        <div className="flex gap-2">
          <button onClick={() => setEditMode(true)}
            className="flex-1 text-white text-[13px] font-semibold py-2.5 rounded-xl btn-primary transition-all">
            Edit
          </button>
          <button onClick={() => {
              const text = editedContent || sectionText;
              const full = `${doc.name}\n${"=".repeat(doc.name.length)}\n${doc.type} · ${doc.project}\n\n${text}\n\n---\nGenerated by CreateAI Brain · Internal use only.`;
              const blob = new Blob([full], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url;
              a.download = `${doc.name.replace(/\s+/g, "_")}.txt`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex-1 text-[13px] font-semibold py-2.5 rounded-xl transition-all"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)")}
          >
            ↓ Export .txt
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center">Generated by CreateAI Brain · Internal use only</p>
      </div>
    );
  }

  const allDocs: UserDoc[] = [...DOCS, ...userDocs];
  return (
    <div className="p-6 space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground" style={{ letterSpacing: "-0.03em" }}>Documents</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">{allDocs.length} files · all generated by Brain</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="text-white text-[12px] font-semibold px-4 py-2 rounded-xl btn-primary transition-all"
        >
          + New
        </button>
      </div>
      <div className="space-y-2">
        {allDocs.map((doc, i) => (
          <button key={doc.name} onClick={() => setSelected(doc.name)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left group card-interactive animate-fade-up delay-${Math.min(i * 60, 400)}`}
            style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200" style={{ background: "rgba(99,102,241,0.10)" }}>
              {doc.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] text-foreground truncate">{doc.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{doc.type} · {doc.project}</p>
            </div>
            <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">{doc.size}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
