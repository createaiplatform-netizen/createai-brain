import React, { useState, useEffect } from "react";
import { useOS } from "@/os/OSContext";
import { CreationStore } from "@/standalone/creation/CreationStore";
import { ConnectionEngine, NODE_TYPE_CFG, NodeType } from "@/engine/ConnectionEngine";
import { RegulatoryEngine } from "@/engine/RegulatoryEngine";
import { BackendBlueprintEngine } from "@/engine/BackendBlueprintEngine";
import { PlatformStore, PlatformUser } from "@/engine/PlatformStore";

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
  { id: "debug",    label: "Debug Panel",     value: "Live",   icon: "🔬", desc: "System state, engines, localStorage" },
  { id: "connection-layer",    label: "Connection Layer",   value: "30+ nodes", icon: "🕸️", desc: "Internal module/flow/brain fabric" },
  { id: "regulatory",          label: "Regulatory Blueprints", value: "6",     icon: "📜", desc: "HIPAA, GDPR, SOC2, CMS, ADA — blueprint only" },
  { id: "backend-blueprints",  label: "Backend Blueprints", value: "5",         icon: "🏗️", desc: "API specs, data models, security patterns" },
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

// ─── RegulatorySection component ─────────────────────────────────────────────
function RegulatorySection({ onBack }: { onBack: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const blueprints = RegulatoryEngine.getAll();
  const stats = RegulatoryEngine.getStats();

  if (selectedId) {
    const bp = RegulatoryEngine.getById(selectedId)!;
    const mappedCount  = bp.clauses.filter(c => c.mockStatus === "mapped").length;
    const partialCount = bp.clauses.filter(c => c.mockStatus === "partial").length;
    const gapCount     = bp.clauses.filter(c => c.mockStatus === "gap").length;
    return (
      <div className="p-5 space-y-4 overflow-y-auto">
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedId(null)} className="text-primary text-sm font-medium">‹ Regulatory</button>
          <h2 className="text-[16px] font-bold text-foreground flex-1 truncate">{bp.framework}</h2>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${bp.status === "blueprint-ready" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{bp.status}</span>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-[10px] text-red-700 font-bold">⚠️ {bp.disclaimer}</p>
        </div>
        <div className="bg-background border border-border/50 rounded-xl p-3 space-y-1">
          <p className="text-[11px] font-semibold text-foreground">{bp.title}</p>
          <p className="text-[11px] text-muted-foreground">{bp.summary}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([["✓ Mapped", mappedCount, "bg-green-50 border-green-200 text-green-700"],
             ["~ Partial", partialCount, "bg-yellow-50 border-yellow-200 text-yellow-700"],
             ["⚠ Gap", gapCount, "bg-red-50 border-red-200 text-red-700"]] as const).map(([l, v, cls]) => (
            <div key={l} className={`rounded-xl border p-2 text-center ${cls}`}>
              <p className="text-base font-bold">{v}</p><p className="text-[9px] font-bold">{l}</p>
            </div>
          ))}
        </div>
        {bp.clauses.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Clauses</p>
            {bp.clauses.map(c => (
              <div key={c.id} className={`rounded-xl border p-3 space-y-1 ${c.mockStatus === "mapped" ? "border-green-200 bg-green-50/40" : c.mockStatus === "gap" ? "border-red-200 bg-red-50/40" : "border-yellow-200 bg-yellow-50/40"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-muted-foreground">{c.reference}</span>
                  <p className="text-[12px] font-semibold text-foreground">{c.title}</p>
                  <span className="ml-auto text-[9px] font-bold">{c.mockStatus === "mapped" ? "✓" : c.mockStatus === "gap" ? "⚠" : "~"}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{c.description}</p>
                <p className="text-[10px] text-foreground/70 italic">Blueprint: {c.implementationNote}</p>
              </div>
            ))}
          </div>
        )}
        {bp.gapAnalysis.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Gap Analysis</p>
            <div className="bg-background border border-border/50 rounded-xl p-3 space-y-1">
              {bp.gapAnalysis.map((g, i) => <p key={i} className={`text-[11px] ${g.startsWith("⚠") ? "text-orange-700" : "text-green-700"}`}>{g}</p>)}
            </div>
          </div>
        )}
        {bp.auditTrail.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Audit Trail Spec (Mock)</p>
            {bp.auditTrail.map((a, i) => (
              <div key={i} className="bg-background border border-border/50 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-semibold text-foreground">{a.event}</p>
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold">MOCK</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Actor: {a.actor} · Retention: {a.retention}</p>
                <div className="flex flex-wrap gap-1">{a.dataLogged.map(f => <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">{f}</span>)}</div>
              </div>
            ))}
          </div>
        )}
        {bp.complianceNotes.length > 0 && (
          <div className="bg-muted/40 border border-border/30 rounded-xl p-3 space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Compliance Notes</p>
            {bp.complianceNotes.map((n, i) => <p key={i} className="text-[11px] text-muted-foreground">· {n}</p>)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-primary text-sm font-medium">‹ Admin</button>
        <h2 className="text-xl font-bold text-foreground flex-1">📜 Regulatory Blueprints</h2>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
        <p className="text-[11px] text-red-700 font-bold">⚠️ REGULATORY READINESS BLUEPRINT — Internal, Non-Operational, Not Legally Binding.</p>
        <p className="text-[10px] text-red-600 mt-1">Structural models only. No real certification, compliance authorization, or legal authority.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {([["Blueprints", stats.total], ["Ready", stats.ready], ["Draft", stats.draft]] as const).map(([l, v]) => (
          <div key={l} className="bg-background border border-border/50 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{v}</p><p className="text-[9px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {blueprints.map(bp => (
          <button key={bp.id} onClick={() => setSelectedId(bp.id)}
            className="w-full flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left">
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[13px] text-foreground">{bp.framework}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${bp.status === "blueprint-ready" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{bp.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{bp.domain} · {bp.clauses.length} clauses · {bp.gapAnalysis.filter(g => g.startsWith("⚠")).length} gaps</p>
            </div>
            <span className="text-muted-foreground text-sm">›</span>
          </button>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-[10px] text-amber-700">Real compliance requires certified legal, compliance, and security professionals.</p>
      </div>
    </div>
  );
}

// ─── BackendBlueprintsSection component ──────────────────────────────────────
const METHOD_COLOR: Record<string, string> = { GET: "bg-green-100 text-green-700", POST: "bg-blue-100 text-blue-700", PATCH: "bg-orange-100 text-orange-700", PUT: "bg-yellow-100 text-yellow-700", DELETE: "bg-red-100 text-red-700" };

function BackendBlueprintsSection({ onBack }: { onBack: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const blueprints = BackendBlueprintEngine.getAll();
  const stats = BackendBlueprintEngine.getStats();

  if (selectedId) {
    const bp = BackendBlueprintEngine.getById(selectedId)!;
    return (
      <div className="p-5 space-y-4 overflow-y-auto">
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedId(null)} className="text-primary text-sm font-medium">‹ Blueprints</button>
          <h2 className="text-[15px] font-bold text-foreground flex-1 truncate">{bp.title}</h2>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${bp.status === "blueprint-ready" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{bp.status}</span>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
          <p className="text-[10px] text-blue-700 font-bold">{bp.disclaimer}</p>
        </div>
        <p className="text-[12px] text-muted-foreground">{bp.summary}</p>
        {bp.dataModels.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Data Models</p>
            {bp.dataModels.map(m => (
              <div key={m.name} className="bg-background border border-border/50 rounded-xl p-3 space-y-2">
                <p className="font-bold text-[13px] text-foreground">{m.name}</p>
                <p className="text-[11px] text-muted-foreground">{m.description}</p>
                <div className="space-y-1">
                  {m.fields.map(f => (
                    <div key={f.name} className="flex items-start gap-2">
                      <span className="text-[10px] font-mono text-primary w-24 flex-shrink-0">{f.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground w-16 flex-shrink-0">{f.type}</span>
                      <span className="text-[10px] text-muted-foreground flex-1">{f.description}</span>
                      {f.required && <span className="text-[8px] text-red-500 flex-shrink-0">req</span>}
                    </div>
                  ))}
                </div>
                {m.indexes && <p className="text-[10px] text-muted-foreground">Indexes: {m.indexes.join(", ")}</p>}
                {m.relations && <p className="text-[10px] text-muted-foreground">Relations: {m.relations.join(", ")}</p>}
              </div>
            ))}
          </div>
        )}
        {bp.apiEndpoints.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">API Endpoints (Mock Spec)</p>
            {bp.apiEndpoints.map(ep => (
              <div key={ep.path} className="bg-background border border-border/50 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${METHOD_COLOR[ep.method] ?? "bg-muted"}`}>{ep.method}</span>
                  <span className="text-[11px] font-mono text-foreground truncate">{ep.path}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{ep.description}</p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] text-muted-foreground">Roles:</span>
                  {ep.roles.map(r => <span key={r} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{r}</span>)}
                  {ep.rateLimit && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 ml-auto">{ep.rateLimit}</span>}
                </div>
                {ep.errorCodes && ep.errorCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1">{ep.errorCodes.map(e => <span key={e.code} className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-mono">{e.code}: {e.meaning}</span>)}</div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="bg-background border border-border/50 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Security Spec</p>
          {[["Auth", bp.security.authMethod], ["Rate Limit", bp.security.rateLimiting], ["Session", bp.security.sessionTimeout], ["MFA", bp.security.mfaRequired ? "Required" : "Optional"]].map(([k, v]) => (
            <div key={String(k)} className="flex gap-2"><span className="text-[10px] text-muted-foreground w-24">{String(k)}</span><span className="text-[10px] text-foreground">{String(v)}</span></div>
          ))}
          {bp.security.notes.map((n, i) => <p key={i} className="text-[10px] text-muted-foreground">· {n}</p>)}
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Error Patterns</p>
          {bp.errorPatterns.map(e => (
            <div key={e.code} className="bg-background border border-border/50 rounded-xl p-3 space-y-0.5">
              <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-red-600 font-mono">{e.code}</span><p className="text-[12px] font-semibold text-foreground">{e.name}</p></div>
              <p className="text-[11px] text-muted-foreground">{e.description}</p>
              <p className="text-[10px] text-foreground/70">User msg: "{e.userMessage}"</p>
              <p className="text-[10px] text-blue-600">Action: {e.action}</p>
            </div>
          ))}
        </div>
        {bp.designNotes.length > 0 && (
          <div className="bg-muted/40 border border-border/30 rounded-xl p-3 space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Design Notes</p>
            {bp.designNotes.map((n, i) => <p key={i} className="text-[11px] text-muted-foreground">· {n}</p>)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-primary text-sm font-medium">‹ Admin</button>
        <h2 className="text-xl font-bold text-foreground flex-1">🏗️ Backend Blueprints</h2>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-[11px] text-blue-700 font-medium">Design-Only Spec — No real endpoints deployed. Structural starting point for real engineering teams.</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {([["Bps", stats.blueprints], ["Endpoints", stats.endpoints], ["Models", stats.dataModels], ["Ready", stats.ready]] as const).map(([l, v]) => (
          <div key={l} className="bg-background border border-border/50 rounded-xl p-2 text-center">
            <p className="text-base font-bold text-foreground">{v}</p><p className="text-[8px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {blueprints.map(bp => (
          <button key={bp.id} onClick={() => setSelectedId(bp.id)}
            className="w-full flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left">
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[13px] text-foreground">{bp.title}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${bp.status === "blueprint-ready" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{bp.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{bp.domain} · {bp.apiEndpoints.length} endpoints · {bp.dataModels.length} models</p>
            </div>
            <span className="text-muted-foreground text-sm">›</span>
          </button>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-[10px] text-amber-700">All API specs, data models, and security patterns are design documents only. Real engineering teams implement against these specs.</p>
      </div>
    </div>
  );
}

// ─── AdminUsersSection ────────────────────────────────────────────────────────
function AdminUsersSection({ onBack, onGoToPeople }: { onBack: () => void; onGoToPeople: () => void }) {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [inviteName, setInviteName]   = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState("Creator");
  const [inviteDone, setInviteDone]   = useState(false);
  const [inviteLink, setInviteLink]   = useState("");
  const [copied, setCopied]           = useState(false);

  const loadUsers = () => setUsers(PlatformStore.getUsers());
  useEffect(() => {
    loadUsers();
    window.addEventListener("cai:users-change", loadUsers);
    return () => window.removeEventListener("cai:users-change", loadUsers);
  }, []);

  const handleInvite = () => {
    if (!inviteName.trim()) return;
    PlatformStore.addUser({
      name: inviteName.trim(), email: inviteEmail.trim(), phone: "",
      role: inviteRole, tags: [], status: "Invited", createdBy: "admin",
    });
    const link = PlatformStore.generateInviteLink(inviteName);
    setInviteLink(link);
    setInviteDone(true);
    setInviteName(""); setInviteEmail("");
  };

  const handleStatusChange = (id: string, s: PlatformUser["status"]) => {
    PlatformStore.updateUserStatus(id, s);
    loadUsers();
  };

  const handleRemove = (id: string) => {
    PlatformStore.removeUser(id);
    loadUsers();
  };

  return (
    <div className="p-5 space-y-5 overflow-y-auto">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-primary text-sm font-medium">‹ Admin</button>
        <h2 className="text-xl font-bold text-foreground flex-1">Users ({users.length})</h2>
        <button onClick={onGoToPeople}
          className="text-[11px] bg-primary/10 text-primary font-semibold px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-colors">
          Open People App →
        </button>
      </div>

      {/* Live user list */}
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="bg-background border border-border/50 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">{u.name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] text-foreground">{u.name}</p>
                <p className="text-[11px] text-muted-foreground">{u.role} {u.email ? `· ${u.email}` : ""}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${u.status === "Active" ? "bg-green-100 text-green-700" : u.status === "Invited" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                {u.status}
              </span>
            </div>
            {u.name !== "Sara Stadler" && (
              <div className="flex gap-1.5">
                {(["Active", "Invited", "Pending"] as PlatformUser["status"][]).map(s => (
                  <button key={s} onClick={() => handleStatusChange(u.id, s)}
                    className={`flex-1 text-[10px] font-semibold py-1.5 rounded-lg border transition-all
                      ${u.status === s ? "bg-primary text-white border-primary" : "border-border/40 text-muted-foreground hover:border-primary/30"}`}>
                    {s}
                  </button>
                ))}
                <button onClick={() => handleRemove(u.id)}
                  className="text-[10px] font-semibold px-2 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick invite form */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-3">
        <p className="font-semibold text-[13px] text-foreground">+ Quick Invite User</p>
        {inviteDone && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
            <p className="text-green-700 font-semibold text-[12px]">✓ User invited! Here's their link:</p>
            <p className="text-[11px] font-mono text-foreground break-all bg-white rounded-lg p-2 border border-green-200">{inviteLink}</p>
            <button onClick={() => { navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="w-full text-[11px] bg-green-100 text-green-700 font-semibold py-2 rounded-xl hover:bg-green-200 transition-colors">
              {copied ? "✓ Copied Link" : "Copy Invite Link"}
            </button>
            <button onClick={() => setInviteDone(false)}
              className="w-full text-[11px] bg-muted text-muted-foreground font-semibold py-2 rounded-xl hover:bg-muted/80 transition-colors">
              + Invite Another
            </button>
          </div>
        )}
        {!inviteDone && (
          <>
            <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Full Name *"
              className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email (optional)" type="email"
              className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            <div className="flex gap-2">
              {["Creator", "Viewer", "Admin"].map(r => (
                <button key={r} onClick={() => setInviteRole(r)}
                  className={`flex-1 text-[11px] font-semibold py-2 rounded-xl border transition-all
                    ${inviteRole === r ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}>
                  {r}
                </button>
              ))}
            </div>
            <button onClick={handleInvite} disabled={!inviteName.trim()}
              className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
              Generate Invite Link
            </button>
          </>
        )}
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
        <p className="text-[11px] text-orange-700">User data is stored locally in this browser session. Real user management requires authentication and backend setup.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function AdminApp() {
  const { appRegistry, openApp, platformMode, setPlatformMode } = useOS();
  const osMode = platformMode;
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [confirmLive, setConfirmLive] = useState(false);
  const [logAdded, setLogAdded] = useState(false);
  const [debugData, setDebugData] = useState<Record<string, unknown>>({});
  const [liveUserCount, setLiveUserCount] = useState(() => PlatformStore.getUsers().length);

  useEffect(() => {
    const refresh = () => setLiveUserCount(PlatformStore.getUsers().length);
    window.addEventListener("cai:users-change", refresh);
    return () => window.removeEventListener("cai:users-change", refresh);
  }, []);

  useEffect(() => {
    if (activeSection === "debug") {
      const creations = CreationStore.getAll();
      const lsKeys: string[] = [];
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k) lsKeys.push(k); } } catch {}
      setDebugData({
        timestamp:       new Date().toISOString(),
        appMode:         osMode,
        registered_apps: appRegistry.length,
        creations_count: creations.length,
        creations_types: [...new Set(creations.map(c => c.type))],
        all_tags:        [...new Set(creations.flatMap(c => c.tags ?? []))],
        localStorage_keys: lsKeys,
        engine_modules:  ["TemplateLibrary (19 types)", "ProjectIntelligence", "ExportEngine", "ThemeEngine", "CreationStore v2", "classifyIntent", "buildPrompt", "parseSections"],
        safety_status:   "ACTIVE — all sensitive domains demo-only",
        version:         "CreateAI Brain v3 — Omega Packet Engine",
      });
    }
  }, [activeSection]);

  const handleModeSwitch = (m: OsMode) => {
    if (m === "LIVE") { setConfirmLive(true); return; }
    setPlatformMode(m);
    setLogAdded(true);
    setTimeout(() => setLogAdded(false), 3000);
  };

  // ── Section drill-downs ──

  if (activeSection === "connection-layer") {
    const stats = ConnectionEngine.getStats();
    const types = Object.keys(NODE_TYPE_CFG) as NodeType[];
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
          <h2 className="text-xl font-bold text-foreground flex-1">🕸️ Connection Layer</h2>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-[12px] text-blue-700 font-medium">Internal fabric only — all connections are structural and non-operational. {stats.active} active / {stats.blueprint} blueprint nodes.</p>
        </div>
        {/* Type filter chips */}
        <div className="grid grid-cols-4 gap-2">
          {types.map(t => {
            const cfg = NODE_TYPE_CFG[t];
            const count = stats.byType[t] ?? 0;
            return (
              <div key={t} className={`rounded-xl p-2 text-center ${cfg.bg} border border-${cfg.bg}`}>
                <p className="text-base">{cfg.icon}</p>
                <p className="text-[9px] font-bold text-foreground">{count}</p>
                <p className="text-[8px] text-muted-foreground leading-tight">{cfg.label}</p>
              </div>
            );
          })}
        </div>
        {types.map(t => {
          const nodes = ConnectionEngine.getByType(t);
          if (nodes.length === 0) return null;
          const cfg = NODE_TYPE_CFG[t];
          return (
            <div key={t} className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <span>{cfg.icon}</span>{cfg.label}s
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted">{nodes.length}</span>
              </p>
              {nodes.map(node => (
                <div key={node.id} className={`rounded-xl border p-3 space-y-1 ${node.status === "blueprint" ? "border-orange-200 bg-orange-50/50" : "border-border/50 bg-background"}`}>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[12px] text-foreground">{node.name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto ${node.status === "active" ? "bg-green-100 text-green-700" : node.status === "blueprint" ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>
                      {node.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{node.description}</p>
                  {node.links.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {node.links.map(lid => {
                        const linked = ConnectionEngine.getNode(lid);
                        if (!linked) return null;
                        const lcfg = NODE_TYPE_CFG[linked.type];
                        return <span key={lid} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">{lcfg.icon} {linked.name}</span>;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-[10px] text-amber-700">All connections are INTERNAL ONLY. Non-operational outside this system. Blueprint nodes require real engineering implementation before activation.</p>
        </div>
      </div>
    );
  }

  if (activeSection === "regulatory") {
    return <RegulatorySection onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "backend-blueprints") {
    return <BackendBlueprintsSection onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "debug") {
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
          <h2 className="text-xl font-bold text-foreground flex-1">🔬 Debug Panel</h2>
          <button onClick={() => { setActiveSection(null); setTimeout(() => setActiveSection("debug"), 50); }}
            className="text-[11px] bg-muted px-2.5 py-1.5 rounded-lg text-muted-foreground hover:bg-muted/80">⟳ Refresh</button>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-[12px] text-amber-700 font-medium">🛡️ Debug mode — read-only system state. No changes made.</p>
        </div>
        <div className="space-y-2">
          {Object.entries(debugData).map(([key, value]) => (
            <div key={key} className="bg-background border border-border/50 rounded-xl p-3.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{key.replace(/_/g, " ")}</p>
              {Array.isArray(value) ? (
                value.length > 0
                  ? <div className="flex flex-wrap gap-1">{value.map((v, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">{String(v)}</span>)}</div>
                  : <p className="text-[12px] text-muted-foreground font-mono italic">empty</p>
              ) : (
                <p className="text-[12px] text-foreground font-mono">{String(value)}</p>
              )}
            </div>
          ))}
        </div>
        <div className="bg-muted/40 border border-border/30 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground">All debug output is read-only. No data is transmitted externally. This panel is for DEMO/TEST inspection only.</p>
        </div>
      </div>
    );
  }

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
    return <AdminUsersSection onBack={() => setActiveSection(null)} onGoToPeople={() => { setActiveSection(null); openApp("people"); }} />;
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

  if (activeSection === "projects") {
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
        <h2 className="text-xl font-bold text-foreground">All Projects (6)</h2>
        <p className="text-[12px] text-muted-foreground">Overview of all registered projects in {osMode} mode.</p>
        <div className="space-y-2">
          {[
            { name: "Healthcare System – Legal Safe", mode: "DEMO",   icon: "🏥", color: "#34C759" },
            { name: "Healthcare System – Mach 1",    mode: "FUTURE", icon: "🔬", color: "#BF5AF2" },
            { name: "Monetary System – Legal Safe",  mode: "DEMO",   icon: "💳", color: "#007AFF" },
            { name: "Monetary System – Mach 1",      mode: "FUTURE", icon: "🚀", color: "#FF9500" },
            { name: "Marketing Hub",                 mode: "DEMO",   icon: "📣", color: "#FF2D55" },
            { name: "Operations Builder",            mode: "TEST",   icon: "🏗️", color: "#5856D6" },
          ].map(p => (
            <div key={p.name} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/50">
              <span className="text-xl">{p.icon}</span>
              <span className="text-[13px] text-foreground font-medium flex-1">{p.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${p.mode === "FUTURE" ? "bg-purple-100 text-purple-700" : p.mode === "TEST" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>{p.mode}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { setActiveSection(null); openApp("projects"); }}
          className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
          Open Projects App →
        </button>
      </div>
    );
  }

  if (activeSection === "safety") {
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
        <h2 className="text-xl font-bold text-foreground">Safety Shell</h2>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <p className="font-bold text-green-800 text-[14px]">Safety Shell: ACTIVE</p>
          </div>
          <p className="text-[12px] text-green-700">Global error prevention is active. All engines are within safe operating parameters.</p>
        </div>
        <div className="space-y-2">
          {[
            { name: "Fail-Safe Engine", desc: "Catches and recovers from all generation errors", status: "ON" },
            { name: "Self-Check Engine", desc: "Validates all outputs before display", status: "ON" },
            { name: "Zero-Overwhelm Mode", desc: "Reduces UI complexity on demand", status: "ON" },
            { name: "Staging Engine", desc: "Requires approval before any external action", status: "ON" },
            { name: "Legal Safety Layer", desc: "All outputs labeled mock/simulated", status: "ON" },
            { name: "RBAC Access Control", desc: "Role-based permissions enforced", status: "ON" },
          ].map(item => (
            <div key={item.name} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/50">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[12px] text-foreground">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">{item.status}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center">All safety systems are structural/mock only. Platform is in {osMode} mode.</p>
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
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
            <p className="text-3xl text-center">🟢</p>
            <h3 className="font-bold text-foreground text-lg text-center">Switch to Live Mode?</h3>
            <p className="text-[13px] text-muted-foreground text-center">Live Mode enables all platform features to operate at full capacity. Content generation, campaign staging, and invite flows become fully operational for you and all invited users.</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-[11px] text-amber-700 font-medium">⚠️ Note: Real third-party integrations, financial transactions, and clinical workflows require additional legal and technical setup before use. Content generation and invites are always safe to use in Live Mode.</p>
          </div>
          <button onClick={() => { setPlatformMode("LIVE"); setLogAdded(true); setConfirmLive(false); setTimeout(() => setLogAdded(false), 3000); }}
            className="w-full bg-green-600 text-white text-sm font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
            ✓ Activate Live Mode
          </button>
          <button onClick={() => setConfirmLive(false)}
            className="w-full bg-muted text-muted-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-muted/80 transition-colors">
            Stay in {osMode} Mode
          </button>
        </div>
      </div>
    );
  }

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
              <span className="text-[13px] font-bold text-foreground">{s.id === "projects" ? "6" : s.id === "users" ? String(liveUserCount) : s.value}</span>
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
