import React, { useState, useEffect, useRef } from "react";
import { useOS } from "@/os/OSContext";
import { useViewResume } from "@/hooks/useUniversalResume";
import { FormEngine } from "@/engines/FormEngine";
import { CreationStore } from "@/standalone/creation/CreationStore";
import { ConnectionEngine, NODE_TYPE_CFG, NodeType } from "@/engine/ConnectionEngine";
import { RegulatoryEngine } from "@/engine/RegulatoryEngine";
import { BackendBlueprintEngine } from "@/engine/BackendBlueprintEngine";

type OsMode = "DEMO" | "TEST" | "LIVE";

interface ActivityEntry { id: number; action: string; details: string; createdAt: string; }
interface PersonRecord { id: number; name: string; email: string | null; role: string; status: string; }

const SECTIONS = [
  { id: "profile",             label: "My Profile",         value: "Edit", icon: "👤", desc: "Edit your name and account info" },
  { id: "projects",            label: "All Projects",       value: "…",      icon: "📁", desc: "View, edit, or archive any project" },
  { id: "users",               label: "People",             value: "…",      icon: "👥", desc: "Manage access, roles, and permissions" },
  { id: "engines",             label: "Engines",            value: "30+",    icon: "⚙️", desc: "All engines loaded and connected" },
  { id: "security",            label: "Security",           value: "Active", icon: "🔒", desc: "RBAC, invite-only, audit log" },
  { id: "safety",              label: "Safety Shell",       value: "ON",     icon: "🛡️", desc: "Global error prevention active" },
  { id: "audit",               label: "Audit Log",          value: "…",      icon: "📋", desc: "Recent activity log" },
  { id: "debug",               label: "Debug Panel",        value: "Live",   icon: "🔬", desc: "System state, engines, localStorage" },
  { id: "connection-layer",    label: "Connection Layer",   value: "30+ nodes", icon: "🕸️", desc: "Internal module/flow/brain fabric" },
  { id: "regulatory",          label: "Regulatory Blueprints", value: "6",   icon: "📜", desc: "HIPAA, GDPR, SOC2, CMS, ADA — blueprint only" },
  { id: "backend-blueprints",  label: "Backend Blueprints", value: "5",      icon: "🏗️", desc: "API specs, data models, security patterns" },
  { id: "invites",             label: "Invite Manager",     value: "Live",   icon: "🎟️", desc: "Generate access invite codes — controls platform entry and tier" },
  { id: "subscriptions",       label: "Revenue & Tiers",    value: "Live",   icon: "💳", desc: "Manage user subscription tiers and revenue share (platform cut %)" },
  { id: "observability",       label: "Observability",      value: "Live",   icon: "📊", desc: "Live server health, memory, AI streams, telemetry — auto-refreshes every 5s" },
  { id: "reset",               label: "Reset My Space",     value: "Owner",  icon: "🔄", desc: "Archive all active projects and start fresh" },
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
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [inviteDone, setInviteDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPeople = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/people", { credentials: "include" });
      if (r.ok) { const d = await r.json(); setPeople(d.people ?? []); }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadPeople(); }, []);

  const handleInvite = async () => {
    if (!inviteName.trim()) return;
    setSaving(true);
    try {
      const r = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: inviteName.trim(), email: inviteEmail.trim() || null, role: inviteRole, status: "Invited" }),
      });
      if (r.ok) {
        await loadPeople();
        setInviteDone(true);
        setInviteName(""); setInviteEmail("");
      }
    } catch {}
    finally { setSaving(false); }
  };

  const handleRemove = async (id: number) => {
    if (!confirm("Remove this person?")) return;
    await fetch(`/api/people/${id}`, { method: "DELETE", credentials: "include" });
    await loadPeople();
  };

  const statusStyle = (status: string) => {
    if (status === "Active")  return { background: "rgba(34,197,94,0.12)", color: "#4ade80" };
    if (status === "Invited") return { background: "rgba(99,102,241,0.12)", color: "#818cf8" };
    return { background: "rgba(251,146,60,0.12)", color: "#fb923c" };
  };

  return (
    <div className="p-5 space-y-5 overflow-y-auto">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-primary text-sm font-medium">‹ Admin</button>
        <h2 className="text-[17px] font-bold text-foreground flex-1">People ({loading ? "…" : people.length})</h2>
        <button onClick={onGoToPeople}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-colors"
          style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>
          Open People App →
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-4">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      ) : people.length === 0 ? (
        <div className="text-center py-6 text-[13px] text-muted-foreground">No people added yet. Use the People app to add team members.</div>
      ) : (
        <div className="space-y-2">
          {people.map(p => (
            <div key={p.id} className="p-3 rounded-2xl border border-border/40 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>{p.name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] text-foreground">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">{p.role}{p.email ? ` · ${p.email}` : ""}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={statusStyle(p.status)}>{p.status}</span>
              <button onClick={() => handleRemove(p.id)}
                className="text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0 transition-colors"
                style={{ color: "#f87171", background: "rgba(239,68,68,0.08)" }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.14)" }}>
        <p className="font-semibold text-[13px] text-foreground">+ Quick Add Person</p>
        {inviteDone && (
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)" }}>
            <p className="text-[13px] font-semibold" style={{ color: "#4ade80" }}>✓ Person added to People!</p>
            <button onClick={() => setInviteDone(false)} className="text-[11px] text-muted-foreground mt-1">+ Add Another</button>
          </div>
        )}
        {!inviteDone && (
          <>
            <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Full Name *"
              className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
              style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)", color: "#f8fafc" }} />
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email (optional)" type="email"
              className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
              style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)", color: "#f8fafc" }} />
            <div className="flex gap-2">
              {["Member", "Creator", "Admin"].map(r => (
                <button key={r} onClick={() => setInviteRole(r)}
                  className="flex-1 text-[11px] font-semibold py-2 rounded-xl border transition-all"
                  style={inviteRole === r
                    ? { background: "rgba(99,102,241,0.20)", borderColor: "rgba(99,102,241,0.45)", color: "#818cf8" }
                    : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.50)" }}>
                  {r}
                </button>
              ))}
            </div>
            <button onClick={handleInvite} disabled={!inviteName.trim() || saving}
              className="w-full text-white text-[13px] font-semibold py-2.5 rounded-xl disabled:opacity-40 transition-all"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              {saving ? "Adding…" : "Add to People"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function AdminApp() {
  const { appRegistry, openApp, platformMode, setPlatformMode } = useOS();
  const osMode = platformMode;
  // Universal Resume — restores last active section
  const { view: _savedSection, setView: _setSavedSection } = useViewResume<string>("admin", "none");
  const [activeSection, _setActiveSection] = useState<string | null>(
    _savedSection === "none" ? null : _savedSection
  );
  const setActiveSection = (s: string | null) => {
    _setActiveSection(s);
    _setSavedSection(s ?? "none");
  };
  const [confirmLive, setConfirmLive] = useState(false);
  const [logAdded, setLogAdded] = useState(false);
  const [debugData, setDebugData] = useState<Record<string, unknown>>({});
  const [realProjects, setRealProjects] = useState<Array<{ id: string; name: string; icon: string; industry: string }>>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [peopleCount, setPeopleCount] = useState<number | null>(null);
  const [auditLog, setAuditLog] = useState<ActivityEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  // ── Profile state ──
  const [profile, setProfile]           = useState<{ firstName: string; lastName: string; email: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editFirst, setEditFirst]       = useState("");
  const [editLast, setEditLast]         = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  // ── Reset My Space state ──
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone]       = useState(false);
  const [resetError, setResetError]     = useState("");
  // ── Invite Manager state ──
  type InviteRow = { id: number; code: string; email: string | null; tier: string; platformCutPct: number; maxUses: number; usesCount: number; isRevoked: boolean; createdAt: string; expiresAt: string | null; notes: string | null };
  const [inviteList, setInviteList]         = useState<InviteRow[]>([]);
  const [inviteLoading, setInviteLoading]   = useState(false);
  const [inviteCreating, setInviteCreating] = useState(false);
  const [inviteError, setInviteError]       = useState("");
  const [inviteSuccess, setInviteSuccess]   = useState("");
  const [inviteForm, setInviteForm]         = useState({ email: "", tier: "starter", platformCutPct: 25, maxUses: 1, notes: "", expiresAt: "" });
  // ── Revenue & Tiers state ──
  type SubRow = { id: number; userId: string; tier: string; tokenBalance: number; monthlyLimit: number; platformCutPct: number; isActive: boolean; email: string | null; firstName: string | null; lastName: string | null; overriddenBy: string | null };
  const [subList, setSubList]           = useState<SubRow[]>([]);
  const [subLoading, setSubLoading]     = useState(false);
  const [subEditing, setSubEditing]     = useState<string | null>(null);
  const [subSaving, setSubSaving]       = useState(false);
  const [subError, setSubError]         = useState("");
  const [subEditForm, setSubEditForm]   = useState({ tier: "free", platformCutPct: 25, monthlyLimit: 50, notes: "" });
  // ── Redeem Access Code state (Security section) ──
  const [redeemCode, setRedeemCode]   = useState("");
  const [redeemBusy, setRedeemBusy]   = useState(false);
  const [redeemMsg, setRedeemMsg]     = useState("");
  const [redeemError, setRedeemError] = useState("");
  // ── Observability state ──
  type ObsMetrics = {
    ok: boolean; uptime: number; uptimeHuman: string;
    memory: { heapUsedMB: number; heapTotalMB: number; rssMB: number };
    cpu: { userMs: number; systemMs: number };
    database: { projects: number; documents: number; activityItems: number };
    platform: { projectTypes: number; scaffoldTemplates: number; aiPersonas: number; apiRoutes: number };
    nodeVersion: string; env: string; timestamp: string;
  };
  type ObsHealth = {
    status: string; uptime: number; registrySize: number; activeItems: number;
    configComplete: boolean; locked: boolean; selfHealApplied: number;
  };
  type ObsTelemetry = {
    activeCount: number; peakConcurrency: number; totalStarted: number;
    completedCount: number; avgDurationMs: number;
    activeStreams: Array<{ streamId: string; projectId: string; userId: string; durationMs: number }>;
    recentCompleted: Array<{ durationMs: number; completedAt: string }>;
  };
  const [obsMetrics, setObsMetrics]       = useState<ObsMetrics | null>(null);
  const [obsHealth, setObsHealth]         = useState<ObsHealth | null>(null);
  const [obsTelemetry, setObsTelemetry]   = useState<ObsTelemetry | null>(null);
  const [obsLoading, setObsLoading]       = useState(false);
  const [obsSelfHealing, setObsSelfHealing] = useState(false);
  const obsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // ── Revenue Events (audit trail) state ──
  type AuditLogRow = { id: number; userId: string; action: string; resource: string; resourceType: string; outcome: string; metadata: unknown; createdAt: string };
  const [revenueEvents, setRevenueEvents]             = useState<AuditLogRow[]>([]);
  const [revenueEventsLoading, setRevenueEventsLoading] = useState(false);
  const [revenueTab, setRevenueTab]                   = useState<"subscribers" | "events">("subscribers");

  useEffect(() => {
    fetch("/api/projects", { credentials: "include" })
      .then(r => r.ok ? r.json() : { projects: [] })
      .then(d => { setRealProjects(d.projects ?? []); })
      .catch(() => {})
      .finally(() => setProjectsLoading(false));

    fetch("/api/people", { credentials: "include" })
      .then(r => r.ok ? r.json() : { people: [] })
      .then(d => { setPeopleCount((d.people ?? []).length); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeSection !== "profile") return;
    setProfileLoading(true); setProfileSaved(false); setProfileError("");
    fetch("/api/user/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((d: { firstName?: string; lastName?: string; email?: string } | null) => {
        if (d) {
          setProfile({ firstName: d.firstName ?? "", lastName: d.lastName ?? "", email: d.email ?? "" });
          setEditFirst(d.firstName ?? "");
          setEditLast(d.lastName ?? "");
        }
      })
      .catch(() => setProfileError("Failed to load profile"))
      .finally(() => setProfileLoading(false));
  }, [activeSection]);

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

  // ── Observability: live-poll every 5s while section is active ──
  useEffect(() => {
    if (activeSection !== "observability") {
      if (obsIntervalRef.current) { clearInterval(obsIntervalRef.current); obsIntervalRef.current = null; }
      return;
    }
    let mounted = true;
    const fetchObs = async () => {
      try {
        const [mRes, hRes, tRes] = await Promise.all([
          fetch("/api/system/metrics",           { credentials: "include" }),
          fetch("/api/system/health",            { credentials: "include" }),
          fetch("/api/system/telemetry/streams", { credentials: "include" }),
        ]);
        if (mounted && mRes.ok) setObsMetrics(await mRes.json());
        if (mounted && hRes.ok) setObsHealth(await hRes.json());
        if (mounted && tRes.ok) setObsTelemetry(await tRes.json());
      } catch { /* non-fatal */ } finally { if (mounted) setObsLoading(false); }
    };
    setObsLoading(true);
    fetchObs();
    obsIntervalRef.current = setInterval(fetchObs, 5000);
    return () => {
      mounted = false;
      if (obsIntervalRef.current) { clearInterval(obsIntervalRef.current); obsIntervalRef.current = null; }
    };
  }, [activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleModeSwitch = (m: OsMode) => {
    if (m === "LIVE") { setConfirmLive(true); return; }
    setPlatformMode(m);
    setLogAdded(true);
    setTimeout(() => setLogAdded(false), 3000);
  };

  const handleResetMySpace = async () => {
    setResetLoading(true);
    setResetError("");
    try {
      const res = await fetch("/api/projects/reset-my-space", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setResetDone(true);
        setResetConfirm(false);
      } else {
        setResetError("Could not reset space. Please try again.");
      }
    } catch {
      setResetError("Network error.");
    } finally {
      setResetLoading(false);
    }
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
    if (!auditLog.length && !auditLoading) {
      setAuditLoading(true);
      fetch("/api/activity?limit=50", { credentials: "include" })
        .then(r => r.ok ? r.json() : { activities: [] })
        .then(d => { setAuditLog(d.activities ?? []); })
        .catch(() => {})
        .finally(() => setAuditLoading(false));
    }
    return (
      <div className="p-5 space-y-4">
        <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
        <h2 className="text-[18px] font-bold text-foreground">Audit Log</h2>
        {logAdded && (
          <div className="rounded-xl p-2.5 text-[12px] font-semibold" style={{ background: "rgba(34,197,94,0.10)", color: "#4ade80" }}>
            ✓ Mode switched to {osMode}
          </div>
        )}
        {auditLoading ? (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-4">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading activity…
          </div>
        ) : auditLog.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-2xl">📋</p>
            <p className="text-[13px] text-muted-foreground">No activity yet. Actions like creating projects, saving files, and adding people appear here.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 divide-y divide-border/30" style={{ background: "rgba(255,255,255,0.03)" }}>
            {auditLog.map((entry, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="text-[10px] text-muted-foreground font-mono mt-0.5 flex-shrink-0 w-16">
                  {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-foreground font-medium">{entry.action}</p>
                  {entry.details && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{entry.details}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeSection === "projects") {
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
        <h2 className="text-xl font-bold text-foreground">All Projects ({projectsLoading ? "…" : realProjects.length})</h2>
        <p className="text-[12px] text-muted-foreground">Your real projects from the database.</p>
        {projectsLoading ? (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-4">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading projects…
          </div>
        ) : realProjects.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-2xl">📁</p>
            <p className="text-[13px] text-muted-foreground">No projects yet. Create your first one in ProjectOS.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {realProjects.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/50">
                <span className="text-xl">{p.icon || "📁"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.industry}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => { setActiveSection(null); openApp("projos"); }}
          className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
          Open ProjectOS →
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
    const redeemInvite = async () => {
      if (!redeemCode.trim()) return;
      setRedeemBusy(true); setRedeemMsg(""); setRedeemError("");
      try {
        const res = await fetch("/api/invites/redeem", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: redeemCode.trim() }),
        });
        const data = await res.json() as { success?: boolean; message?: string; tier?: string; error?: string };
        if (res.ok && data.success) {
          setRedeemMsg(data.message ?? `Access upgraded to ${data.tier}!`);
          setRedeemCode("");
        } else { setRedeemError(data.error ?? "Invalid code"); }
      } catch { setRedeemError("Network error"); }
      finally { setRedeemBusy(false); }
    };

    return (
      <div className="p-6 space-y-4">
        <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
        <h2 className="text-xl font-bold text-foreground">Security</h2>
        {[
          { label: "Access Model",     value: "RBAC (Role-Based Access Control)",   status: "Active" },
          { label: "Invite System",    value: "Invite-only access with real codes",  status: "Active" },
          { label: "Session Engine",   value: "Session-scoped state management",     status: "Active" },
          { label: "Fail-Safe Engine", value: "Global error prevention + recovery",  status: "Active" },
          { label: "Self-Check Engine",value: "Validates outputs before display",    status: "Active" },
          { label: "Audit Logging",    value: "All sensitive actions logged to DB",  status: "Active" },
          { label: "File Versioning",  value: "30-version history + one-click rollback", status: "Active" },
          { label: "Revenue Auditing", value: "Platform cut overrides logged immutably", status: "Active" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50">
            <div>
              <p className="font-semibold text-[13px] text-foreground">{item.label}</p>
              <p className="text-[11px] text-muted-foreground">{item.value}</p>
            </div>
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${item.status === "Active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{item.status}</span>
          </div>
        ))}

        {/* Redeem Access Code */}
        <div className="bg-background border border-border/50 rounded-2xl p-4 space-y-3">
          <p className="text-[12px] font-bold text-foreground">Redeem Access Code</p>
          <p className="text-[11px] text-muted-foreground">Have an invite code? Enter it here to upgrade your subscription tier.</p>
          <div className="flex gap-2">
            <input
              value={redeemCode}
              onChange={e => setRedeemCode(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") redeemInvite(); }}
              placeholder="Paste your invite code…"
              className="flex-1 px-3 py-2 text-[12px] border border-border/50 rounded-xl bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            />
            <button
              onClick={redeemInvite}
              disabled={redeemBusy || !redeemCode.trim()}
              className="px-4 py-2 rounded-xl text-[12px] font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all flex-shrink-0"
            >
              {redeemBusy ? "…" : "Redeem"}
            </button>
          </div>
          {redeemMsg && <p className="text-[11px] text-green-600 font-medium">{redeemMsg}</p>}
          {redeemError && <p className="text-[11px] text-red-600">{redeemError}</p>}
        </div>
      </div>
    );
  }

  // ── Observability section ──
  if (activeSection === "observability") {
    const memPct = obsMetrics
      ? Math.round((obsMetrics.memory.heapUsedMB / obsMetrics.memory.heapTotalMB) * 100)
      : 0;

    const triggerSelfHeal = async () => {
      setObsSelfHealing(true);
      try { await fetch("/api/system/self-heal", { method: "POST", credentials: "include" }); }
      catch { /* non-fatal */ } finally { setObsSelfHealing(false); }
    };

    const Stat = ({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) => (
      <div className="bg-background border border-border/50 rounded-2xl p-4 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">{icon} {label}</div>
        <div className="text-[22px] font-bold text-foreground leading-tight">{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      </div>
    );

    return (
      <div className="p-5 space-y-5 overflow-y-auto">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
          <h2 className="text-xl font-bold text-foreground flex-1">📊 Observability</h2>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${obsHealth?.status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-[11px] font-semibold text-muted-foreground">
              {obsLoading && !obsMetrics ? "Loading…" : obsHealth?.status === "online" ? "Online" : "Checking…"}
            </span>
          </div>
        </div>

        {/* Health banner */}
        {obsHealth && (
          <div className={`rounded-2xl p-3.5 border flex items-center gap-3 ${obsHealth.status === "online" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <span className="text-xl">{obsHealth.status === "online" ? "✅" : "❌"}</span>
            <div className="flex-1">
              <p className={`text-[12px] font-bold ${obsHealth.status === "online" ? "text-green-700" : "text-red-700"}`}>
                {obsHealth.status === "online" ? "All systems operational" : `Status: ${obsHealth.status}`}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {obsHealth.registrySize} registry items · {obsHealth.activeItems} active · config {obsHealth.configComplete ? "locked ✓" : "pending"} · {obsHealth.selfHealApplied} self-heal(s) applied
              </p>
            </div>
            <button
              onClick={triggerSelfHeal}
              disabled={obsSelfHealing}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white border border-green-300 text-green-700 hover:bg-green-50 transition-all flex-shrink-0 flex items-center gap-1"
            >
              {obsSelfHealing ? <><div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />Healing…</> : "⚡ Self-Heal"}
            </button>
          </div>
        )}

        {/* Key stat grid */}
        {obsMetrics && (
          <div className="grid grid-cols-2 gap-3">
            <Stat icon="⏱" label="Uptime" value={obsMetrics.uptimeHuman} />
            <Stat icon="🧠" label="Heap Used" value={`${obsMetrics.memory.heapUsedMB} MB`} sub={`of ${obsMetrics.memory.heapTotalMB} MB total · RSS ${obsMetrics.memory.rssMB} MB`} />
            <Stat icon="⚡" label="CPU User" value={`${obsMetrics.cpu.userMs} ms`} sub={`system: ${obsMetrics.cpu.systemMs} ms`} />
            <Stat icon="🌐" label="Node" value={obsMetrics.nodeVersion} sub={obsMetrics.env} />
          </div>
        )}

        {/* Memory bar */}
        {obsMetrics && (
          <div className="bg-background border border-border/50 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-foreground">Memory — Heap</p>
              <p className="text-[11px] text-muted-foreground">{obsMetrics.memory.heapUsedMB} / {obsMetrics.memory.heapTotalMB} MB ({memPct}%)</p>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(memPct, 100)}%`,
                  background: memPct > 80 ? "linear-gradient(90deg,#f87171,#ef4444)" : memPct > 60 ? "linear-gradient(90deg,#fb923c,#f59e0b)" : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                }}
              />
            </div>
          </div>
        )}

        {/* AI Streams telemetry */}
        {obsTelemetry && (
          <div className="bg-background border border-border/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold text-foreground">AI Streams</p>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${obsTelemetry.activeCount > 0 ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                <span className="text-[11px] text-muted-foreground">{obsTelemetry.activeCount} active</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Peak Concurrent", val: obsTelemetry.peakConcurrency },
                { label: "Total Started",   val: obsTelemetry.totalStarted },
                { label: "Avg Duration",    val: obsTelemetry.avgDurationMs > 0 ? `${(obsTelemetry.avgDurationMs / 1000).toFixed(1)}s` : "—" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}>
                  <p className="text-[16px] font-bold text-foreground">{s.val}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
            {obsTelemetry.activeCount > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Now</p>
                {obsTelemetry.activeStreams.map(s => (
                  <div key={s.streamId} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.20)" }}>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                    <span className="text-[11px] font-mono text-foreground truncate flex-1">{s.streamId.slice(0, 8)}…</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{(s.durationMs / 1000).toFixed(1)}s</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground text-center py-2">No active AI streams right now</p>
            )}
            {obsTelemetry.recentCompleted.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recent Completed</p>
                {obsTelemetry.recentCompleted.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1">
                    <span className="text-[10px] text-muted-foreground">{new Date(c.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                    <span className="text-[10px] font-mono text-foreground">{(c.durationMs / 1000).toFixed(2)}s</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DB + Platform stats */}
        {obsMetrics && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background border border-border/50 rounded-2xl p-4 space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Database</p>
              {[
                ["Projects", obsMetrics.database.projects],
                ["Documents", obsMetrics.database.documents],
                ["Activity Items", obsMetrics.database.activityItems],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between items-center">
                  <span className="text-[11px] text-muted-foreground">{k}</span>
                  <span className="text-[12px] font-bold text-foreground">{v}</span>
                </div>
              ))}
            </div>
            <div className="bg-background border border-border/50 rounded-2xl p-4 space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Platform</p>
              {[
                ["Project Types",       obsMetrics.platform.projectTypes],
                ["Scaffold Templates",  obsMetrics.platform.scaffoldTemplates],
                ["AI Personas",         obsMetrics.platform.aiPersonas],
                ["API Routes",          obsMetrics.platform.apiRoutes],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between items-center">
                  <span className="text-[11px] text-muted-foreground">{k}</span>
                  <span className="text-[12px] font-bold text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">Auto-refreshes every 5 seconds · {obsMetrics?.timestamp ? new Date(obsMetrics.timestamp).toLocaleTimeString() : "—"}</p>
      </div>
    );
  }

  // ── Invite Manager section ──
  if (activeSection === "invites") {
    const loadInvites = () => {
      setInviteLoading(true);
      fetch("/api/invites", { credentials: "include" })
        .then(r => r.ok ? r.json() : { invites: [] })
        .then(d => setInviteList(d.invites ?? []))
        .catch(() => {})
        .finally(() => setInviteLoading(false));
    };

    const createInvite = async () => {
      setInviteCreating(true); setInviteError(""); setInviteSuccess("");
      try {
        const res = await fetch("/api/invites", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: inviteForm.email || undefined,
            tier: inviteForm.tier,
            platformCutPct: inviteForm.platformCutPct,
            maxUses: inviteForm.maxUses,
            notes: inviteForm.notes || undefined,
            expiresAt: inviteForm.expiresAt || undefined,
          }),
        });
        const data = await res.json() as { invite?: InviteRow; error?: string };
        if (res.ok && data.invite) {
          setInviteSuccess(`Code: ${data.invite.code}`);
          setInviteList(prev => [data.invite!, ...prev]);
          setInviteForm({ email: "", tier: "starter", platformCutPct: 25, maxUses: 1, notes: "", expiresAt: "" });
        } else { setInviteError(data.error ?? "Failed"); }
      } catch { setInviteError("Network error"); }
      finally { setInviteCreating(false); }
    };

    const revokeInvite = async (id: number) => {
      await fetch(`/api/invites/${id}`, { method: "DELETE", credentials: "include" });
      setInviteList(prev => prev.map(i => i.id === id ? { ...i, isRevoked: true } : i));
    };

    const TIER_COLORS: Record<string, string> = {
      free: "bg-gray-100 text-gray-600", starter: "bg-blue-100 text-blue-700",
      pro: "bg-indigo-100 text-indigo-700", enterprise: "bg-purple-100 text-purple-700",
      custom: "bg-orange-100 text-orange-700",
    };

    return (
      <div className="p-5 space-y-5 overflow-y-auto h-full">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
          <h2 className="text-xl font-bold text-foreground flex-1">🎟️ Invite Manager</h2>
          <button onClick={loadInvites} className="text-[11px] text-primary font-medium">Refresh</button>
        </div>

        {/* Create invite form */}
        <div className="bg-background border border-border/50 rounded-2xl p-4 space-y-3">
          <p className="text-[12px] font-bold text-foreground">Create New Invite</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] text-muted-foreground font-medium">Email (optional — leave blank for open invite)</label>
              <input value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@company.com"
                className="w-full mt-0.5 px-3 py-2 text-[12px] border border-border/50 rounded-xl bg-background text-foreground focus:outline-none focus:border-primary/40" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Tier</label>
              <select value={inviteForm.tier} onChange={e => setInviteForm(f => ({ ...f, tier: e.target.value }))}
                className="w-full mt-0.5 px-3 py-2 text-[12px] border border-border/50 rounded-xl bg-background text-foreground focus:outline-none focus:border-primary/40">
                {["free", "starter", "pro", "enterprise", "custom"].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Platform cut %</label>
              <input type="number" min={0} max={100} value={inviteForm.platformCutPct}
                onChange={e => setInviteForm(f => ({ ...f, platformCutPct: Number(e.target.value) }))}
                className="w-full mt-0.5 px-3 py-2 text-[12px] border border-border/50 rounded-xl bg-background text-foreground focus:outline-none focus:border-primary/40" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Max uses</label>
              <input type="number" min={1} max={100} value={inviteForm.maxUses}
                onChange={e => setInviteForm(f => ({ ...f, maxUses: Number(e.target.value) }))}
                className="w-full mt-0.5 px-3 py-2 text-[12px] border border-border/50 rounded-xl bg-background text-foreground focus:outline-none focus:border-primary/40" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Expires (optional)</label>
              <input type="date" value={inviteForm.expiresAt}
                onChange={e => setInviteForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full mt-0.5 px-3 py-2 text-[12px] border border-border/50 rounded-xl bg-background text-foreground focus:outline-none focus:border-primary/40" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-muted-foreground font-medium">Notes</label>
              <input value={inviteForm.notes} onChange={e => setInviteForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional internal note"
                className="w-full mt-0.5 px-3 py-2 text-[12px] border border-border/50 rounded-xl bg-background text-foreground focus:outline-none focus:border-primary/40" />
            </div>
          </div>
          {inviteError && <p className="text-[11px] text-red-600">{inviteError}</p>}
          {inviteSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-[10px] font-bold text-green-700">Invite created!</p>
              <p className="text-[12px] font-mono text-green-800 mt-1 break-all">{inviteSuccess}</p>
              <p className="text-[10px] text-green-600 mt-1">Share this code with the user — they paste it in the redeem box to upgrade their tier.</p>
            </div>
          )}
          <button onClick={createInvite} disabled={inviteCreating}
            className="w-full py-2.5 rounded-xl text-[12px] font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all">
            {inviteCreating ? "Generating…" : "Generate Invite Code"}
          </button>
        </div>

        {/* Invite list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">All Invites</p>
            {inviteList.length === 0 && !inviteLoading && (
              <button onClick={loadInvites} className="text-[10px] text-primary">Load</button>
            )}
          </div>
          {inviteLoading && <p className="text-[12px] text-muted-foreground py-2">Loading…</p>}
          {inviteList.map(inv => (
            <div key={inv.id} className={`p-3 rounded-xl border ${inv.isRevoked ? "border-border/30 opacity-40" : "border-border/50 bg-background"} space-y-1.5`}>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-foreground flex-1 truncate">{inv.code}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TIER_COLORS[inv.tier] ?? "bg-muted"}`}>{inv.tier}</span>
                {inv.isRevoked
                  ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Revoked</span>
                  : <button onClick={() => revokeInvite(inv.id)} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Revoke</button>}
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                {inv.email && <span>📧 {inv.email}</span>}
                <span>Uses: {inv.usesCount}/{inv.maxUses}</span>
                <span>Cut: {inv.platformCutPct}%</span>
                {inv.expiresAt && <span>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</span>}
              </div>
              {inv.notes && <p className="text-[10px] text-muted-foreground italic">{inv.notes}</p>}
            </div>
          ))}
          {!inviteLoading && inviteList.length === 0 && (
            <p className="text-[12px] text-muted-foreground text-center py-4">No invites yet. Create one above.</p>
          )}
        </div>
      </div>
    );
  }

  // ── Revenue & Tiers section ──
  if (activeSection === "subscriptions") {
    const loadSubs = () => {
      setSubLoading(true);
      fetch("/api/subscriptions", { credentials: "include" })
        .then(r => r.ok ? r.json() : { subscriptions: [] })
        .then(d => setSubList(d.subscriptions ?? []))
        .catch(() => {})
        .finally(() => setSubLoading(false));
    };

    const saveSub = async (userId: string) => {
      setSubSaving(true); setSubError("");
      try {
        const res = await fetch(`/api/subscriptions/${userId}`, {
          method: "PUT", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subEditForm),
        });
        const data = await res.json() as { subscription?: SubRow; error?: string };
        if (res.ok && data.subscription) {
          setSubList(prev => prev.map(s => s.userId === userId ? { ...s, ...data.subscription } : s));
          setSubEditing(null);
        } else { setSubError(data.error ?? "Failed to save"); }
      } catch { setSubError("Network error"); }
      finally { setSubSaving(false); }
    };

    const TIER_COLORS: Record<string, string> = {
      free: "bg-gray-100 text-gray-600", starter: "bg-blue-100 text-blue-700",
      pro: "bg-indigo-100 text-indigo-700", enterprise: "bg-purple-100 text-purple-700",
      custom: "bg-orange-100 text-orange-700",
    };

    const loadRevenueEvents = () => {
      if (revenueEventsLoading) return;
      setRevenueEventsLoading(true);
      fetch("/api/admin/audit-logs?limit=100", { credentials: "include" })
        .then(r => r.ok ? r.json() : { logs: [] })
        .then((d: { logs?: AuditLogRow[] }) => {
          const REVENUE_ACTIONS = ["subscription.update", "subscription.token-adjust", "invites.redeem", "invite.revoke"];
          const filtered = (d.logs ?? []).filter(l =>
            REVENUE_ACTIONS.some(a => l.action?.startsWith(a))
          );
          setRevenueEvents(filtered);
        })
        .catch(() => {})
        .finally(() => setRevenueEventsLoading(false));
    };

    return (
      <div className="p-5 space-y-5 overflow-y-auto h-full">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
          <h2 className="text-xl font-bold text-foreground flex-1">💳 Revenue & Tiers</h2>
          <button onClick={revenueTab === "subscribers" ? loadSubs : loadRevenueEvents} className="text-[11px] text-primary font-medium">Refresh</button>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.05)" }}>
          {(["subscribers", "events"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setRevenueTab(tab); if (tab === "events" && revenueEvents.length === 0) loadRevenueEvents(); if (tab === "subscribers" && subList.length === 0) loadSubs(); }}
              className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all"
              style={revenueTab === tab ? { background: "#ffffff", color: "#0f172a", boxShadow: "0 1px 3px rgba(0,0,0,0.10)" } : { color: "#64748b" }}
            >
              {tab === "subscribers" ? "👥 Subscribers" : "📋 Revenue Events"}
            </button>
          ))}
        </div>

        {revenueTab === "events" ? (
          <>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
              <p className="text-[11px] text-indigo-700 font-medium">Immutable audit trail of all revenue-affecting actions: tier overrides, token adjustments, and invite redemptions.</p>
            </div>
            {revenueEventsLoading ? (
              <div className="flex items-center justify-center py-12 gap-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-[12px] text-muted-foreground">Loading events…</span>
              </div>
            ) : revenueEvents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-[13px] font-semibold text-foreground">No revenue events yet</p>
                <p className="text-[11px] text-muted-foreground mt-1">Subscription changes, token adjustments, and invite redemptions will appear here.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/50 divide-y divide-border/30 overflow-hidden">
                {revenueEvents.map((ev, i) => {
                  const actionColor = ev.outcome === "success" ? "text-green-600" : "text-red-600";
                  return (
                    <div key={i} className="px-4 py-3 flex items-start gap-3 bg-background">
                      <span className={`text-[10px] font-bold mt-0.5 flex-shrink-0 ${actionColor}`}>
                        {ev.outcome === "success" ? "✓" : "✗"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] font-semibold text-foreground">{ev.action}</p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-muted text-muted-foreground">{ev.resourceType}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">user: {ev.userId} · {ev.resource}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                        {new Date(ev.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
        <>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-[11px] text-blue-700 font-medium">Platform cut % applies to revenue generated by each user. Default: 25%. Override per-user anytime — all changes are logged in the audit trail.</p>
        </div>

        {subList.length === 0 && !subLoading && (
          <button onClick={loadSubs}
            className="w-full py-3 rounded-2xl border border-border/50 text-[12px] text-primary font-medium hover:bg-muted/30 transition-all">
            Load Subscriptions
          </button>
        )}
        {subLoading && <p className="text-[12px] text-muted-foreground py-2">Loading…</p>}
        {subError && <p className="text-[11px] text-red-600">{subError}</p>}

        <div className="space-y-2">
          {subList.map(sub => (
            <div key={sub.userId} className="bg-background border border-border/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[12px] flex-shrink-0">
                  {(sub.firstName?.[0] ?? sub.email?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground truncate">
                    {sub.firstName || sub.lastName ? `${sub.firstName ?? ""} ${sub.lastName ?? ""}`.trim() : sub.email ?? sub.userId}
                  </p>
                  {sub.email && <p className="text-[10px] text-muted-foreground truncate">{sub.email}</p>}
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TIER_COLORS[sub.tier] ?? "bg-muted"}`}>{sub.tier}</span>
                {subEditing === sub.userId
                  ? <button onClick={() => setSubEditing(null)} className="text-[10px] text-muted-foreground">Cancel</button>
                  : <button onClick={() => { setSubEditing(sub.userId); setSubEditForm({ tier: sub.tier, platformCutPct: sub.platformCutPct, monthlyLimit: sub.monthlyLimit, notes: "" }); }} className="text-[10px] text-primary font-medium">Edit</button>}
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                {[["Tokens", sub.tokenBalance], ["Limit/mo", sub.monthlyLimit], ["Platform cut", `${sub.platformCutPct}%`]].map(([l, v]) => (
                  <div key={String(l)} className="bg-muted/40 rounded-lg py-1.5">
                    <p className="text-[12px] font-bold text-foreground">{String(v)}</p>
                    <p className="text-[9px] text-muted-foreground">{String(l)}</p>
                  </div>
                ))}
              </div>

              {sub.overriddenBy && <p className="text-[9px] text-orange-600">⚡ Cut overridden by admin</p>}

              {subEditing === sub.userId && (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Tier</label>
                      <select value={subEditForm.tier} onChange={e => setSubEditForm(f => ({ ...f, tier: e.target.value }))}
                        className="w-full mt-0.5 px-2 py-1.5 text-[11px] border border-border/50 rounded-lg bg-background text-foreground focus:outline-none focus:border-primary/40">
                        {["free", "starter", "pro", "enterprise", "custom"].map(t => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Platform cut %</label>
                      <input type="number" min={0} max={100} value={subEditForm.platformCutPct}
                        onChange={e => setSubEditForm(f => ({ ...f, platformCutPct: Number(e.target.value) }))}
                        className="w-full mt-0.5 px-2 py-1.5 text-[11px] border border-border/50 rounded-lg bg-background text-foreground focus:outline-none focus:border-primary/40" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Monthly limit</label>
                      <input type="number" min={0} value={subEditForm.monthlyLimit}
                        onChange={e => setSubEditForm(f => ({ ...f, monthlyLimit: Number(e.target.value) }))}
                        className="w-full mt-0.5 px-2 py-1.5 text-[11px] border border-border/50 rounded-lg bg-background text-foreground focus:outline-none focus:border-primary/40" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Notes</label>
                      <input value={subEditForm.notes} onChange={e => setSubEditForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Optional"
                        className="w-full mt-0.5 px-2 py-1.5 text-[11px] border border-border/50 rounded-lg bg-background text-foreground focus:outline-none focus:border-primary/40" />
                    </div>
                  </div>
                  <button onClick={() => saveSub(sub.userId)} disabled={subSaving}
                    className="w-full py-2 rounded-xl text-[11px] font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all">
                    {subSaving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          ))}
          {!subLoading && subList.length === 0 && (
            <p className="text-[12px] text-muted-foreground text-center py-6">No subscriptions found. Users appear here after redeeming an invite.</p>
          )}
        </div>
        </>
        )}
      </div>
    );
  }

  // ── Profile section ──
  if (activeSection === "profile") {
    const handleSave = async () => {
      setProfileSaving(true); setProfileError(""); setProfileSaved(false);
      try {
        const res = await fetch("/api/user/me", {
          method: "PUT", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName: editFirst.trim(), lastName: editLast.trim() }),
        });
        const data = await res.json() as { ok?: boolean; firstName?: string; lastName?: string; error?: string };
        if (res.ok && data.ok) {
          setProfile(prev => prev ? { ...prev, firstName: data.firstName ?? prev.firstName, lastName: data.lastName ?? prev.lastName } : prev);
          setProfileSaved(true);
          setTimeout(() => setProfileSaved(false), 3000);
        } else {
          setProfileError(data.error ?? "Failed to save");
        }
      } catch { setProfileError("Network error"); }
      finally { setProfileSaving(false); }
    };

    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setActiveSection(null)} className="text-primary text-sm font-medium">‹ Admin</button>
        <h2 className="text-xl font-bold text-foreground">My Profile</h2>

        {profileLoading ? (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-6">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading profile…
          </div>
        ) : (
          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4 p-4 bg-background rounded-2xl border border-border/50">
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "rgba(99,102,241,0.2)", border: "2px solid rgba(99,102,241,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 700, color: "#818cf8",
              }}>
                {(editFirst[0] ?? "?").toUpperCase()}{(editLast[0] ?? "").toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  {editFirst || "—"} {editLast}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  {profile?.email ?? "No email on file"}
                </div>
              </div>
            </div>

            {/* Edit form — powered by FormEngine */}
            <div style={{
              background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)",
              borderRadius: 12, padding: "16px",
            }}>
              <FormEngine
                schema={{
                  id: "admin-profile",
                  title: "Edit Name",
                  compact: true,
                  submitLabel: "Save Name",
                  layout: "grid",
                  fields: [
                    { id: "firstName", type: "text",  label: "First Name", placeholder: "First name", required: true, width: "half" },
                    { id: "lastName",  type: "text",  label: "Last Name",  placeholder: "Last name",  width: "half" },
                    { id: "email",     type: "email", label: "Email", description: "Read-only — managed by Replit Auth", readOnly: true, disabled: true },
                  ],
                }}
                initialValues={{ firstName: editFirst, lastName: editLast, email: profile?.email ?? "" }}
                onSubmit={async (vals) => {
                  const first = (vals.firstName as string).trim();
                  const last  = (vals.lastName  as string).trim();
                  setEditFirst(first); setEditLast(last);
                  setProfileSaving(true); setProfileError(""); setProfileSaved(false);
                  try {
                    const res = await fetch("/api/user/me", {
                      method: "PUT", credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ firstName: first, lastName: last }),
                    });
                    const data = await res.json() as { ok?: boolean; firstName?: string; lastName?: string; error?: string };
                    if (res.ok && data.ok) {
                      setProfile(prev => prev ? { ...prev, firstName: data.firstName ?? prev.firstName, lastName: data.lastName ?? prev.lastName } : prev);
                      setProfileSaved(true);
                      setTimeout(() => setProfileSaved(false), 3000);
                    } else { setProfileError(data.error ?? "Failed to save"); }
                  } catch { setProfileError("Network error"); }
                  finally { setProfileSaving(false); }
                }}
                loading={profileSaving}
                error={profileError || undefined}
                success={profileSaved ? "Profile saved successfully" : undefined}
              />
            </div>

            <div className="bg-background rounded-2xl border border-border/50 p-4 space-y-1">
              <p className="text-[11px] font-bold text-foreground">Account Info</p>
              <p className="text-[11px] text-muted-foreground">Authentication: Replit Auth (OAuth)</p>
              <p className="text-[11px] text-muted-foreground">Session: Persistent cookie-based session</p>
              <p className="text-[11px] text-muted-foreground">Role: Platform Owner</p>
            </div>
          </div>
        )}
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

  // ── Reset My Space ──
  if (activeSection === "reset") {
    return (
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          <button onClick={() => { setActiveSection(null); setResetDone(false); setResetConfirm(false); setResetError(""); }}
            className="text-primary text-sm font-medium">‹ Admin</button>
          <h2 className="text-xl font-bold text-foreground flex-1">🔄 Reset My Space</h2>
        </div>

        {resetDone ? (
          <div className="rounded-2xl p-6 text-center space-y-3" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <div className="text-4xl">✓</div>
            <p className="text-[16px] font-bold" style={{ color: "#34d399" }}>Space reset successfully.</p>
            <p className="text-[13px]" style={{ color: "#64748b" }}>All active projects have been archived. Your space is now clean and ready for a fresh start.</p>
            <button
              onClick={() => { setResetDone(false); setActiveSection(null); }}
              className="mt-2 px-5 py-2 rounded-xl text-[13px] font-semibold"
              style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.30)", color: "#34d399" }}
            >
              ← Back to Admin
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
              <p className="text-[13px] font-bold" style={{ color: "#f59e0b" }}>⚠ Owner-only action</p>
              <p className="text-[12px]" style={{ color: "#64748b" }}>
                This will archive all of your currently active projects. Archived projects are not deleted —
                they can be restored at any time from the ProjectOS Archived view.
                This does not affect other users' projects.
              </p>
            </div>

            <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[14px] font-bold text-foreground">What happens when you reset:</p>
              <ul className="space-y-2">
                {[
                  "All active projects move to your Archived folder",
                  "Files, tasks, and content inside each project are preserved",
                  "Projects can be restored from ProjectOS → Archived tab",
                  "Other users' workspaces are completely unaffected",
                  "You start fresh with a clean active project list",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "#64748b" }}>
                    <span style={{ color: "#6366f1", flexShrink: 0 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            {resetError && (
              <div className="rounded-xl p-3" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <p className="text-[12px]" style={{ color: "#f87171" }}>{resetError}</p>
              </div>
            )}

            {!resetConfirm ? (
              <button
                onClick={() => setResetConfirm(true)}
                className="w-full py-3 rounded-2xl text-[14px] font-bold"
                style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", color: "#f59e0b" }}
              >
                🔄 Reset My Space (Archive All Active Projects)
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] font-bold text-center" style={{ color: "#f87171" }}>
                  Are you sure? This will archive all your active projects.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setResetConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetMySpace}
                    disabled={resetLoading}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-bold"
                    style={{ background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171" }}
                  >
                    {resetLoading ? "Archiving…" : "Confirm Reset"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
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
        {SECTIONS.map(s => {
          let val = s.value;
          if (s.id === "projects") val = projectsLoading ? "…" : String(realProjects.length);
          if (s.id === "users") val = peopleCount === null ? "…" : String(peopleCount);
          if (s.id === "audit") val = auditLog.length > 0 ? String(auditLog.length) : "…";
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className="p-4 rounded-2xl border space-y-1 text-left transition-all group"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.30)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}>
              <div className="flex items-center justify-between">
                <span className="text-xl">{s.icon}</span>
                <span className="text-[14px] font-bold text-foreground">{val}</span>
              </div>
              <p className="font-semibold text-[13px] text-foreground">{s.label}</p>
              <p className="text-[11px] text-muted-foreground">{s.desc}</p>
              <p className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#818cf8" }}>View details →</p>
            </button>
          );
        })}
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
