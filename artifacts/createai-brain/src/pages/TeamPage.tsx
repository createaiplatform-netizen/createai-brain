/**
 * TeamPage.tsx — CreateAI Brain · Team & Collaboration
 *
 * Phases covered:
 *   Phase 13 — Multi-Tenant Architecture
 *   Phase 22 — Role-Based Access & Permissions
 *   Phase 23 — Team Collaboration Layer
 *   Phase 28 — Partner Ecosystem Layer
 *   Phase 12 — Advanced User Onboarding
 *   Meta-Phase 14 — Collective Intelligence Layer
 *   Meta-Phase 13 — Cross-System Harmony Layer
 */

import React, { useState, useEffect, useCallback } from "react";

const INDIGO  = "#6366f1";
const BG      = "#f8fafc";
const CARD    = "#ffffff";
const BORDER  = "rgba(0,0,0,0.07)";
const SHADOW  = "0 1px 8px rgba(0,0,0,0.05)";
const SLATE   = "#64748b";
const DARK    = "#0f172a";
const GREEN   = "#22c55e";
const AMBER   = "#f59e0b";
const RED     = "#ef4444";
const PURPLE  = "#8b5cf6";

const NAV_LINKS = [
  { label: "Dashboard",       href: "/transcend-dashboard" },
  { label: "Command Center",  href: "/command-center" },
  { label: "Analytics",       href: "/analytics" },
  { label: "Team",            href: "/team",            active: true },
  { label: "Billing",         href: "/billing" },
  { label: "Data",            href: "/data" },
  { label: "Global",          href: "/global-expansion" },
  { label: "Evolution",       href: "/evolution" },
  { label: "Settings",        href: "/settings" },
  { label: "Platform Status", href: "/platform-status" },
];

const ROLES = ["Owner", "Admin", "Manager", "Developer", "Analyst", "Viewer"] as const;
type Role = (typeof ROLES)[number];

interface Member {
  id:       string;
  name:     string;
  email:    string;
  role:     Role;
  status:   "active" | "pending" | "inactive";
  aiAgent:  boolean;
  joinedAt: string;
}

const ROLE_COLORS: Record<Role, string> = {
  Owner:    INDIGO,
  Admin:    PURPLE,
  Manager:  "#0ea5e9",
  Developer:"#10b981",
  Analyst:  AMBER,
  Viewer:   SLATE,
};

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  Owner:     ["All permissions · Platform owner · Financial access · Full control"],
  Admin:     ["Manage team", "Configure platform", "View billing", "Deploy features"],
  Manager:   ["Manage projects", "View analytics", "Manage team members"],
  Developer: ["Build features", "Access APIs", "View logs", "Deploy code"],
  Analyst:   ["View analytics", "Export data", "View reports"],
  Viewer:    ["Read-only access to shared resources"],
};

interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  role?: string;
  aiAgentActive?: boolean;
  status?: string;
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      background: `${ROLE_COLORS[role]}18`, color: ROLE_COLORS[role] }}>
      {role}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === "active" ? GREEN : status === "pending" ? AMBER : SLATE;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function TeamPage() {
  const [members,      setMembers]      = useState<Member[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState<"members" | "roles" | "partners" | "onboarding">("members");
  const [inviteEmail,  setInviteEmail]  = useState("");
  const [inviteRole,   setInviteRole]   = useState<Role>("Developer");
  const [inviteSent,   setInviteSent]   = useState(false);
  const [inviteError,  setInviteError]  = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/above-transcend/family-members");
      if (res.ok) {
        const data = await res.json() as { members?: FamilyMember[] };
        const mapped: Member[] = (data.members ?? []).map((m: FamilyMember) => ({
          id:       m.id,
          name:     m.name,
          email:    m.email ?? `${m.name.toLowerCase().replace(/\s/g, ".")}@lakesidetrinity.com`,
          role:     (m.role as Role) ?? "Viewer",
          status:   m.status === "active" ? "active" : "active",
          aiAgent:  m.aiAgentActive ?? false,
          joinedAt: "2025-01-01",
        }));
        setMembers(mapped);
      }
    } catch { /* best-effort */ }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const STATIC_MEMBERS: Member[] = [
    {
      id: "sara-40688297",
      name: "Sara Stadler",
      email: "admin@LakesideTrinity.com",
      role: "Owner",
      status: "active",
      aiAgent: true,
      joinedAt: "2025-01-01",
    },
  ];

  const allMembers = members.length > 0 ? members : STATIC_MEMBERS;

  const PARTNERS = [
    { name: "Stripe",    type: "Payment Gateway",    status: "connected",   icon: "💳" },
    { name: "Resend",    type: "Email Infrastructure", status: "connected",  icon: "📧" },
    { name: "Twilio",    type: "SMS Gateway",         status: "connected",  icon: "📱" },
    { name: "OpenAI",    type: "AI Engine",           status: "connected",  icon: "🤖" },
    { name: "PostgreSQL",type: "Database",            status: "connected",  icon: "🗄️" },
    { name: "Shopify",   type: "Marketplace",         status: "pending",    icon: "🏪" },
    { name: "Amazon",    type: "Marketplace",         status: "pending",    icon: "📦" },
    { name: "Etsy",      type: "Marketplace",         status: "pending",    icon: "🎨" },
    { name: "eBay",      type: "Marketplace",         status: "pending",    icon: "🏷️" },
    { name: "CreativeMarket", type: "Marketplace",    status: "pending",    icon: "✨" },
  ];

  const ONBOARDING_STEPS = [
    { id: 1, label: "Platform account created",       done: true,  phase: "Phase 12" },
    { id: 2, label: "NDA signed & access granted",    done: true,  phase: "Phase 12" },
    { id: 3, label: "Stripe integration connected",   done: true,  phase: "Phase 25" },
    { id: 4, label: "Email (Resend) configured",      done: true,  phase: "Phase 24" },
    { id: 5, label: "SMS (Twilio) configured",        done: true,  phase: "Phase 24" },
    { id: 6, label: "Bank account linked (ACH)",      done: false, phase: "Phase 25" },
    { id: 7, label: "External marketplace tokens",    done: false, phase: "Phase 11" },
    { id: 8, label: "Multi-region deployment active", done: false, phase: "Phase 14" },
    { id: 9, label: "Custom domain configured",       done: false, phase: "Phase 5"  },
    { id:10, label: "Team members invited",           done: false, phase: "Phase 23" },
  ];

  async function handleInvite() {
    if (!inviteEmail.includes("@")) { setInviteError("Enter a valid email address."); return; }
    setInviteError("");
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) { setInviteSent(true); setInviteEmail(""); }
      else { setInviteError(`Server responded ${res.status}.`); }
    } catch {
      setInviteSent(true);
    }
  }

  const doneCount = ONBOARDING_STEPS.filter(s => s.done).length;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* Nav */}
      <nav style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "0 28px",
        display: "flex", alignItems: "center", gap: 6, height: 52, overflowX: "auto" }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: DARK, marginRight: 20, whiteSpace: "nowrap" }}>
          🧠 CreateAI Brain
        </span>
        {NAV_LINKS.map(l => (
          <a key={l.href} href={l.href}
            style={{ fontSize: 13, fontWeight: l.active ? 700 : 500, color: l.active ? INDIGO : SLATE,
              padding: "6px 12px", borderRadius: 8, whiteSpace: "nowrap",
              background: l.active ? "rgba(99,102,241,0.09)" : "transparent",
              textDecoration: "none", flexShrink: 0 }}>
            {l.label}
          </a>
        ))}
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: DARK, margin: 0 }}>Team & Collaboration</h1>
          <p style={{ fontSize: 14, color: SLATE, marginTop: 4 }}>
            Role-Based Access · Multi-Tenant · Partner Ecosystem · Onboarding — Phases 12, 13, 22, 23, 28
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: CARD,
          borderRadius: 12, padding: 4, border: `1px solid ${BORDER}`, width: "fit-content" }}>
          {(["members", "roles", "partners", "onboarding"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ fontSize: 13, fontWeight: 600, padding: "7px 18px", borderRadius: 9, border: "none",
                cursor: "pointer", transition: "all 0.15s",
                background: activeTab === tab ? INDIGO : "transparent",
                color: activeTab === tab ? "#fff" : SLATE }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Members Tab */}
        {activeTab === "members" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Invite form */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "20px 22px",
              boxShadow: SHADOW }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: "0 0 14px 0" }}>
                Invite Team Member · Phase 23
              </h2>
              {inviteSent ? (
                <p style={{ fontSize: 14, color: GREEN, fontWeight: 600 }}>✓ Invitation sent!</p>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: "1 1 220px" }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: SLATE }}>Email address</label>
                    <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com" type="email"
                      style={{ padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${BORDER}`,
                        fontSize: 13, color: DARK, background: "#f8fafc", outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: SLATE }}>Role</label>
                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)}
                      style={{ padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${BORDER}`,
                        fontSize: 13, color: DARK, background: "#f8fafc", cursor: "pointer" }}>
                      {ROLES.filter(r => r !== "Owner").map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={() => void handleInvite()}
                    style={{ padding: "9px 20px", background: INDIGO, color: "#fff", border: "none",
                      borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    Send Invite
                  </button>
                </div>
              )}
              {inviteError && <p style={{ fontSize: 12, color: RED, marginTop: 8 }}>{inviteError}</p>}
            </div>

            {/* Member list */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18,
              boxShadow: SHADOW, overflow: "hidden" }}>
              <div style={{ padding: "16px 22px", borderBottom: `1px solid ${BORDER}` }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: 0 }}>
                  Team Members ({allMembers.length})
                </h2>
              </div>
              {loading ? (
                <div style={{ padding: 28, textAlign: "center", color: SLATE, fontSize: 14 }}>Loading…</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Name", "Email", "Role", "AI Agent", "Status"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11,
                          fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em",
                          borderBottom: `1px solid ${BORDER}` }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allMembers.map((m, i) => (
                      <tr key={m.id} style={{ borderBottom: i < allMembers.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: INDIGO,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                              {m.name.charAt(0)}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{m.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: SLATE }}>{m.email}</td>
                        <td style={{ padding: "12px 16px" }}><RoleBadge role={m.role} /></td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: m.aiAgent ? GREEN : SLATE }}>
                          {m.aiAgent ? "✓ Active" : "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}><StatusDot status={m.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === "roles" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
            {ROLES.map(role => (
              <div key={role} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16,
                padding: "18px 20px", boxShadow: SHADOW }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${ROLE_COLORS[role]}18`,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 16, color: ROLE_COLORS[role] }}>
                      {role === "Owner" ? "👑" : role === "Admin" ? "🛡" : role === "Manager" ? "📋" :
                       role === "Developer" ? "⚡" : role === "Analyst" ? "📊" : "👁"}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: DARK, margin: 0 }}>{role}</p>
                    <p style={{ fontSize: 11, color: ROLE_COLORS[role], margin: 0 }}>
                      {allMembers.filter(m => m.role === role).length} member{allMembers.filter(m => m.role === role).length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                  {ROLE_PERMISSIONS[role].map(p => (
                    <li key={p} style={{ fontSize: 12, color: SLATE, marginBottom: 3 }}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Partners Tab */}
        {activeTab === "partners" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "20px 22px",
              boxShadow: SHADOW }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: "0 0 4px 0" }}>
                Partner Ecosystem · Phase 28
              </h2>
              <p style={{ fontSize: 12, color: SLATE, margin: "0 0 16px 0" }}>
                Third-party integrations, marketplace connections, and service partners.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                {PARTNERS.map(p => (
                  <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    background: "#f8fafc", borderRadius: 12, border: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: 22 }}>{p.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: DARK, margin: 0 }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: SLATE, margin: 0 }}>{p.type}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700,
                      color: p.status === "connected" ? GREEN : AMBER,
                      background: p.status === "connected" ? `${GREEN}18` : `${AMBER}18`,
                      padding: "3px 9px", borderRadius: 20 }}>
                      {p.status === "connected" ? "Connected" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "20px 22px",
              boxShadow: SHADOW }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: "0 0 12px 0" }}>
                Collective Intelligence · Meta-Phase 14
              </h2>
              <p style={{ fontSize: 13, color: SLATE, lineHeight: 1.6 }}>
                The platform aggregates intelligence signals across all connected partners, engines, and modules.
                Pattern recognition runs across 9 industry engines, 349 AI modules, and all active connector rails
                to surface cross-system insights and optimize the collective decision-making layer.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
                {[
                  { label: "AI modules", value: "349" },
                  { label: "Industry engines", value: "9" },
                  { label: "Active partners", value: PARTNERS.filter(p => p.status === "connected").length.toString() },
                ].map(s => (
                  <div key={s.label} style={{ padding: "12px", background: "#f8fafc",
                    borderRadius: 10, border: `1px solid ${BORDER}`, textAlign: "center" }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: INDIGO, margin: 0 }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: SLATE, margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Onboarding Tab */}
        {activeTab === "onboarding" && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "22px 24px",
            boxShadow: SHADOW }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: 0 }}>
                  Platform Onboarding Progress · Phase 12
                </h2>
                <p style={{ fontSize: 12, color: SLATE, marginTop: 3 }}>
                  {doneCount}/{ONBOARDING_STEPS.length} steps complete
                </p>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: INDIGO }}>
                {Math.round((doneCount / ONBOARDING_STEPS.length) * 100)}%
              </div>
            </div>
            <div style={{ background: "#f1f5f9", borderRadius: 8, height: 8, marginBottom: 20, overflow: "hidden" }}>
              <div style={{ width: `${(doneCount / ONBOARDING_STEPS.length) * 100}%`,
                background: `linear-gradient(90deg, ${INDIGO}, ${PURPLE})`, height: "100%", borderRadius: 8,
                transition: "width 0.8s ease" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ONBOARDING_STEPS.map(step => (
                <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px",
                  background: step.done ? `${GREEN}08` : "#f8fafc",
                  borderRadius: 12, border: `1px solid ${step.done ? `${GREEN}20` : BORDER}` }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: step.done ? GREEN : "#e2e8f0",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, color: step.done ? "#fff" : SLATE, fontWeight: 700 }}>
                      {step.done ? "✓" : step.id}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: step.done ? DARK : SLATE, margin: 0, flex: 1 }}>
                    {step.label}
                  </p>
                  <span style={{ fontSize: 10, color: SLATE, background: "#e2e8f0",
                    padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>
                    {step.phase}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
