import React, { useState } from "react";
import { useOS } from "@/os/OSContext";

type OsMode = "DEMO" | "TEST" | "LIVE";

const AUDIT_LOG = [
  { time: "9:41 AM", entry: "Sara logged in — DEMO mode" },
  { time: "9:43 AM", entry: "New project created: Healthcare Legal Safe" },
  { time: "9:51 AM", entry: "System prompt updated: Main Brain" },
  { time: "10:02 AM", entry: "Invite prepared for: jake@example.com" },
  { time: "10:15 AM", entry: "Universal Creation Engine: Document generated" },
  { time: "10:22 AM", entry: "Monetization Engine: Cycle 1 complete — 5 opportunities" },
];

const SECTIONS = [
  { id: "projects", label: "All Projects",   value: "6",      icon: "📁", desc: "View, edit, or archive any project" },
  { id: "users",    label: "All Users",       value: "3",      icon: "👥", desc: "Manage access, roles, and permissions" },
  { id: "engines",  label: "Engines",         value: "30+",    icon: "⚙️", desc: "All engines loaded and connected" },
  { id: "security", label: "Security",        value: "Active", icon: "🔒", desc: "RBAC, invite-only, audit log" },
  { id: "safety",   label: "Safety Shell",    value: "ON",     icon: "🛡️", desc: "Global error prevention active" },
  { id: "audit",    label: "Audit Log",       value: `${AUDIT_LOG.length}`, icon: "📋", desc: "Recent activity log" },
];

const ENGINE_LIST = [
  "Unified Experience Engine", "Ω-Series (Meta-Creation)", "Φ-Series (Continuous Improvement)",
  "Potential & Possibility Engine", "Fun & Engagement Engine", "UI/UX Override Engine",
  "Opportunity Engine", "Guided Interaction Engine", "Submit Engine",
  "Document Engine", "UQ-Series (Universal Question)", "ICE-Series (Intelligent Context)",
  "AEL-Series (Adaptive Expansion)", "Session Engine", "Staging Engine",
  "Fail-Safe Engine", "Self-Check Engine", "Security & Access (RBAC)",
  "Dashboard Engine", "Domain Engine", "Role Engine",
  "Scenario Engine", "Comparison Engine", "Infinite Expansion Engine",
  "Avatar Customization Engine", "Scene & Setting Engine", "Group Memory Engine",
  "Buddy-Style Interaction", "Account-Based Memory", "User Onboarding Engine",
];

const USER_LIST = [
  { name: "Sara Stadler", role: "Founder", status: "Active", access: "All" },
  { name: "Jake S.",      role: "Creator", status: "Invited", access: "Limited" },
  { name: "Maria L.",     role: "Viewer",  status: "Active", access: "Read-only" },
];

export function AdminApp() {
  const [osMode, setOsMode] = useState<OsMode>("DEMO");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [confirmLive, setConfirmLive] = useState(false);
  const [logAdded, setLogAdded] = useState(false);

  const handleModeSwitch = (m: OsMode) => {
    if (m === "LIVE") { setConfirmLive(true); return; }
    setOsMode(m);
    setLogAdded(true);
    setTimeout(() => setLogAdded(false), 3000);
  };

  // ── Section drill-downs ──
  if (activeSection === "engines") {
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
        <h2 className="text-xl font-bold text-foreground">Engines ({ENGINE_LIST.length})</h2>
        <p className="text-[12px] text-muted-foreground">All engines are loaded and active in {osMode} mode.</p>
        <div className="space-y-1.5">
          {ENGINE_LIST.map((eng, i) => (
            <div key={eng} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/50">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-[12px] text-foreground flex-1">{eng}</span>
              <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeSection === "users") {
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
        <h2 className="text-xl font-bold text-foreground">Users ({USER_LIST.length})</h2>
        <p className="text-[11px] text-muted-foreground">Mock user list — structural only. RBAC enforced.</p>
        <div className="space-y-2">
          {USER_LIST.map(u => (
            <div key={u.name} className="flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">{u.name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] text-foreground">{u.name}</p>
                <p className="text-[11px] text-muted-foreground">{u.role} · {u.access}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${u.status === "Active" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{u.status}</span>
            </div>
          ))}
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
          <p className="text-[11px] text-orange-700">Real user management requires authentication setup and legal compliance. Mock only.</p>
        </div>
      </div>
    );
  }

  if (activeSection === "audit") {
    const log = logAdded
      ? [{ time: "Now", entry: `System mode switched to ${osMode}` }, ...AUDIT_LOG]
      : AUDIT_LOG;
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
        <h2 className="text-xl font-bold text-foreground">Audit Log</h2>
        <div className="bg-background rounded-2xl border border-border/50 divide-y divide-border/30">
          {log.map((entry, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5 flex-shrink-0 w-16">{entry.time}</span>
              <p className="text-[12px] text-foreground font-mono">{entry.entry}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center">Mock log — structural only</p>
      </div>
    );
  }

  if (activeSection === "security") {
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
        <h2 className="text-xl font-bold text-foreground">Security</h2>
        {[
          { label: "Access Model", value: "RBAC (Role-Based Access Control)", status: "Active" },
          { label: "Invite System", value: "Invite-only — no public registration", status: "Active" },
          { label: "Session Engine", value: "Session-scoped state management", status: "Active" },
          { label: "Fail-Safe Engine", value: "Global error prevention + recovery", status: "Active" },
          { label: "Self-Check Engine", value: "Validates outputs before display", status: "Active" },
          { label: "Audit Logging", value: "All actions logged with timestamps", status: "Mock" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50">
            <div>
              <p className="font-semibold text-[13px] text-foreground">{item.label}</p>
              <p className="text-[11px] text-muted-foreground">{item.value}</p>
            </div>
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${item.status === "Active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{item.status}</span>
          </div>
        ))}
      </div>
    );
  }

  // ── Live mode confirmation ──
  if (confirmLive) {
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setConfirmLive(false)} className="text-primary text-sm font-medium">‹ Admin</button>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center space-y-3">
          <p className="text-3xl">🔒</p>
          <h3 className="font-bold text-foreground text-lg">Live Mode — Not Yet Active</h3>
          <p className="text-[13px] text-muted-foreground">Live mode requires real integrations, legal agreements, compliance review, and expert configuration. It is a future placeholder only and cannot be activated from this interface.</p>
          <button onClick={() => setConfirmLive(false)}
            className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
            Stay in {osMode} Mode
          </button>
        </div>
      </div>
    );
  }

  const { appRegistry } = useOS();

  // ── Main Admin view ──
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Admin Dashboard</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Full visibility and control. Founder access only.</p>
      </div>

      {logAdded && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-[12px] text-green-700 font-medium">✓ Mode switched to {osMode} — logged.</p>
        </div>
      )}

      {/* Stat cards — all clickable */}
      <div className="grid grid-cols-2 gap-3">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className="p-4 bg-background rounded-2xl border border-border/50 space-y-1 text-left hover:border-primary/20 hover:shadow-sm transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xl">{s.icon}</span>
              <span className="text-[13px] font-bold text-foreground">{s.id === "projects" ? "6" : s.id === "users" ? "3" : s.value}</span>
            </div>
            <p className="font-semibold text-[13px] text-foreground">{s.label}</p>
            <p className="text-[11px] text-muted-foreground">{s.desc}</p>
            <p className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">View details →</p>
          </button>
        ))}
      </div>

      {/* Mode switcher — now with real state */}
      <div className="bg-background rounded-2xl border border-border/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[14px] text-foreground">Mode Switcher</h3>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${osMode === "DEMO" ? "bg-green-100 text-green-700" : osMode === "TEST" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-400"}`}>
            Active: {osMode}
          </span>
        </div>
        <div className="flex gap-2">
          {(["DEMO", "TEST", "LIVE"] as OsMode[]).map(m => (
            <button key={m} onClick={() => handleModeSwitch(m)}
              className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all ${osMode === m
                ? { DEMO: "bg-green-100 text-green-700", TEST: "bg-orange-100 text-orange-700", LIVE: "bg-gray-200 text-gray-500" }[m]
                : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {m}{m === "LIVE" ? " (Future)" : ""}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">LIVE mode requires expert setup and is not yet active.</p>
      </div>

      {/* Infinite Expansion Layer — App Registry */}
      <div className="bg-background rounded-2xl border border-border/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[14px] text-foreground">App Registry</h3>
          <span className="text-[11px] font-bold text-primary">{appRegistry.length} apps</span>
        </div>
        <p className="text-[11px] text-muted-foreground">Infinite Expansion Layer — new apps and engines register here automatically. Future engines plug in without code changes.</p>
        <div className="grid grid-cols-2 gap-1.5">
          {appRegistry.map(app => (
            <div key={app.id} className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg">
              <span className="text-sm">{app.icon}</span>
              <span className="text-[11px] text-foreground font-medium truncate">{app.label}</span>
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
            </div>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-[11px] text-blue-700">New engines, tools, and apps register here at launch. In LIVE mode, third-party integrations also appear here automatically.</p>
        </div>
      </div>
    </div>
  );
}
