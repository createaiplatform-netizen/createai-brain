import React from "react";

const DOCS = [
  { name: "Healthcare – Mock Workflow Overview", type: "Document", project: "Healthcare Legal Safe", size: "2 pages", icon: "📄" },
  { name: "Operations – Role Structure", type: "Report", project: "Operations Builder", size: "3 pages", icon: "📋" },
  { name: "Marketing – Brand Voice Guide", type: "Brand Kit", project: "Marketing Hub", size: "4 pages", icon: "🎨" },
  { name: "Monetary – Plans & Tiers Overview", type: "Pricing", project: "Monetary Legal Safe", size: "1 page", icon: "💳" },
  { name: "People – Onboarding Checklist", type: "Form", project: "Admin", size: "1 page", icon: "✅" },
];

export function DocumentsApp() {
  const [selected, setSelected] = React.useState<string | null>(null);

  if (selected) {
    const doc = DOCS.find(d => d.name === selected)!;
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setSelected(null)} className="text-primary text-sm font-medium">‹ Documents</button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{doc.icon}</span>
          <div>
            <h2 className="text-xl font-bold text-foreground">{doc.name}</h2>
            <p className="text-[12px] text-muted-foreground">{doc.type} · {doc.project} · {doc.size}</p>
          </div>
        </div>
        <div className="bg-background border border-border/50 rounded-2xl p-5 space-y-4">
          <div className="border-b border-border/30 pb-3">
            <h3 className="font-semibold text-[15px] text-foreground">Section 1 — Overview</h3>
            <p className="text-[13px] text-muted-foreground mt-1">This document provides a high-level structural summary of the subject. All content is mock and non-operational, intended as a scaffold for future development.</p>
          </div>
          <div className="border-b border-border/30 pb-3">
            <h3 className="font-semibold text-[15px] text-foreground">Section 2 — Key Elements</h3>
            <ul className="mt-1 space-y-1">
              {["Primary component — describes core function", "Secondary element — supporting structure", "Tertiary item — additional context"].map(item => (
                <li key={item} className="text-[13px] text-muted-foreground flex items-start gap-2"><span>•</span><span>{item}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[15px] text-foreground">Section 3 — Next Steps</h3>
            <p className="text-[13px] text-muted-foreground mt-1">Review with stakeholders, gather real data, and engage appropriate experts before implementation. This document is structural only.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 bg-primary/10 text-primary text-sm font-medium py-2.5 rounded-xl hover:bg-primary/20 transition-colors">Export (Future)</button>
          <button className="flex-1 bg-muted text-muted-foreground text-sm font-medium py-2.5 rounded-xl hover:bg-muted/80 transition-colors">Edit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Documents</h2>
        <button className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">+ New</button>
      </div>
      <div className="space-y-2">
        {DOCS.map(doc => (
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
