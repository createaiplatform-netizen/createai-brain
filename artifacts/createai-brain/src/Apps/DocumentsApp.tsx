import React, { useState } from "react";

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

export function DocumentsApp() {
  const [selected, setSelected] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Document");
  const [newCreated, setNewCreated] = useState(false);
  const [userDocs, setUserDocs] = useState<typeof DOCS>([]);

  if (showNew) {
    if (newCreated) {
      return (
        <div className="p-6 space-y-5 text-center">
          <div className="py-6">
            <p className="text-4xl mb-3">✅</p>
            <h2 className="text-xl font-bold text-foreground">Document Created</h2>
            <p className="text-[13px] text-muted-foreground mt-1">"{newName}" is ready with mock content.</p>
          </div>
          <button onClick={() => { setShowNew(false); setNewName(""); setNewCreated(false); }}
            className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90">
            ← Back to Documents
          </button>
        </div>
      );
    }
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setShowNew(false)} className="text-primary text-sm font-medium">‹ Documents</button>
        <h2 className="text-xl font-bold text-foreground">New Document</h2>
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-1.5">Document Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Q2 Operations Summary"
              className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-1.5">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {["Document", "Report", "Checklist", "Form", "Template", "Guide"].map(t => (
                <button key={t} onClick={() => setNewType(t)}
                  className={`py-2 rounded-xl text-[12px] font-semibold border transition-all ${newType === t ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => {
            if (!newName.trim()) return;
            setUserDocs(prev => [...prev, { name: newName, type: newType, project: "My Workspace", size: "1 page", icon: "📄" }]);
            setNewCreated(true);
          }} disabled={!newName.trim()}
            className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-40">
            Create Document (Mock)
          </button>
          <p className="text-[11px] text-muted-foreground text-center">Documents are created with mock scaffold content. Use Create Anything app for AI-generated content.</p>
        </div>
      </div>
    );
  }

  if (selected) {
    const allDocs = [...DOCS, ...userDocs];
    const doc = allDocs.find(d => d.name === selected)!;
    const content = DOC_CONTENT[selected] ?? { sections: [
      { title: "Overview", body: "This document contains mock structural content for your reference." },
      { title: "Content", body: "Add your real content here in Edit mode." },
    ]};

    if (editMode) {
      return (
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => { setEditMode(false); setEditedContent(""); }} className="text-primary text-sm font-medium">‹ View</button>
            <h2 className="text-lg font-bold text-foreground flex-1 truncate">{doc.name}</h2>
          </div>
          <p className="text-[11px] text-muted-foreground">Editing mock content — changes are session-only.</p>
          <textarea
            value={editedContent || content.sections.map(s => `## ${s.title}\n${s.body}`).join("\n\n")}
            onChange={e => setEditedContent(e.target.value)}
            className="w-full bg-background border border-border/50 rounded-xl p-3 text-[12px] text-foreground font-mono resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            rows={14}
          />
          <button onClick={() => setEditMode(false)}
            className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90">
            Save Changes (Session)
          </button>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setSelected(null)} className="text-primary text-sm font-medium">‹ Documents</button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{doc.icon}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate">{doc.name}</h2>
            <p className="text-[12px] text-muted-foreground">{doc.type} · {doc.project} · {doc.size}</p>
          </div>
        </div>
        <div className="bg-background border border-border/50 rounded-2xl p-5 space-y-4">
          {content.sections.map((s, i) => (
            <div key={i} className={i < content.sections.length - 1 ? "border-b border-border/30 pb-4" : ""}>
              <h3 className="font-semibold text-[15px] text-foreground">{s.title}</h3>
              <p className="text-[13px] text-muted-foreground mt-1 whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditMode(true)}
            className="flex-1 bg-primary text-white text-sm font-medium py-2.5 rounded-xl hover:opacity-90 transition-colors">
            Edit
          </button>
          <button onClick={() => {
              const text = (editedContent || content.sections.map(s => `## ${s.title}\n${s.body}`).join("\n\n"));
              const full = `${doc.name}\n${"=".repeat(doc.name.length)}\n${doc.type} · ${doc.project}\n\n${text}\n\n---\nExported from CreateAI Brain · All content is mock and structural only.`;
              const blob = new Blob([full], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url;
              a.download = `${doc.name.replace(/\s+/g, "_")}.txt`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex-1 bg-muted text-foreground text-sm font-medium py-2.5 rounded-xl hover:bg-muted/80 transition-colors">
            ↓ Export .txt
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">All content is mock and structural only.</p>
      </div>
    );
  }

  const allDocs = [...DOCS, ...userDocs];
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Documents</h2>
        <button onClick={() => setShowNew(true)}
          className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
          + New
        </button>
      </div>
      <div className="space-y-2">
        {allDocs.map(doc => (
          <button key={doc.name} onClick={() => setSelected(doc.name)}
            className="w-full flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left">
            <span className="text-2xl flex-shrink-0">{doc.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] text-foreground truncate">{doc.name}</p>
              <p className="text-[11px] text-muted-foreground">{doc.type} · {doc.project}</p>
            </div>
            <span className="text-[11px] text-muted-foreground flex-shrink-0">{doc.size}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
