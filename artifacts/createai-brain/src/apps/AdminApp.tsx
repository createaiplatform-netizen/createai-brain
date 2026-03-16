import React from "react";

const SECTIONS = [
  { label: "All Projects", value: "6", icon: "📁", desc: "View, edit, or archive any project" },
  { label: "All Users", value: "3", icon: "👥", desc: "Manage access, roles, and permissions" },
  { label: "System Mode", value: "DEMO", icon: "🔵", desc: "Switch between Demo, Test, and Live" },
  { label: "Security", value: "Active", icon: "🔒", desc: "RBAC, invite-only, audit log (future)" },
  { label: "Engines", value: "30+", icon: "⚙️", desc: "All engines loaded and connected" },
  { label: "Safety Shell", value: "ON", icon: "🛡️", desc: "Global error prevention active" },
];

export function AdminApp() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Admin Dashboard</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Full visibility and control. Founder access only.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {SECTIONS.map(s => (
          <div key={s.label} className="p-4 bg-background rounded-2xl border border-border/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xl">{s.icon}</span>
              <span className="text-[13px] font-bold text-foreground">{s.value}</span>
            </div>
            <p className="font-semibold text-[13px] text-foreground">{s.label}</p>
            <p className="text-[11px] text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-background rounded-2xl border border-border/50 p-4 space-y-3">
        <h3 className="font-semibold text-[14px] text-foreground">Mode Switcher</h3>
        <div className="flex gap-2">
          {[
            { label: "DEMO", color: "bg-green-100 text-green-700", active: true },
            { label: "TEST", color: "bg-orange-100 text-orange-700", active: false },
            { label: "LIVE", color: "bg-gray-100 text-gray-400", active: false },
          ].map(m => (
            <button key={m.label} className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-colors ${m.active ? m.color : "bg-muted text-muted-foreground"}`}>
              {m.label} {m.label === "LIVE" && "(Future)"}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-background rounded-2xl border border-border/50 p-4">
        <h3 className="font-semibold text-[14px] text-foreground mb-3">Audit Log (Mock)</h3>
        <div className="space-y-2">
          {[
            "Sara logged in — DEMO mode — today 9:41 AM",
            "New project created: Healthcare Legal Safe",
            "System prompt updated: Main Brain",
            "Invite prepared for: jake@example.com",
          ].map((entry, i) => (
            <p key={i} className="text-[12px] text-muted-foreground font-mono border-l-2 border-border pl-3">{entry}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
