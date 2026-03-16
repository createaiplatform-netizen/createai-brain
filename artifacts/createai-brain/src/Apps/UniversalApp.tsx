// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL DASHBOARD APP
// All interaction is INTERNAL ONLY — mock/demo data, no real APIs.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from "react";
import { useInteraction } from "@/os/InteractionContext";
import { useConversation } from "@/os/ConversationContext";
import {
  MOCK_ROLES, MOCK_DEPARTMENTS, MOCK_AGENCIES, MOCK_STATES,
  MOCK_VENDORS, MOCK_HEALTHCARE_CATEGORIES, MOCK_PROVIDER_TYPES,
  MOCK_PAYER_TYPES, MOCK_FACILITIES, MOCK_PROGRAMS, MOCK_SERVICES,
  MOCK_USER_TYPES, MOCK_DEMO_STATUSES, DemoStatus, UniversalView,
  InteractionEngine,
} from "@/engine/InteractionEngine";
import { IntegrationEngine } from "@/engine/IntegrationEngine";
import {
  UNIVERSAL_INDUSTRIES, UNIVERSAL_COUNTRIES, UNIVERSAL_DOMAINS,
  UNIVERSAL_MODES, UNIVERSAL_SCENARIOS, getIndustry, getScenariosForIndustry,
} from "@/engine/UniversalMockDataEngine";
import { WorkflowEngine, Workflow, MockOutcome } from "@/engine/UniversalWorkflowEngine";
import { CreativeEngine, CreativeType } from "@/engine/UniversalCreativeEngine";
import { GameEngine, GameType } from "@/engine/UniversalGameEngine";
import {
  StoryEngine, CharacterEngine, WorldEngine,
  StoryFormat, StoryGenre, CharacterArchetype, WorldType,
} from "@/engine/UniversalStoryEngine";
import { ConnectionEngine, ProjectFormat, ProjectElement } from "@/engine/UniversalConnectionEngine";
import { StrategyEngine, StrategyFocus, TimeHorizon } from "@/engine/UniversalStrategyEngine";

// ─── Nav definition ───────────────────────────────────────────────────────
const NAV_ITEMS: { id: UniversalView; label: string; icon: string }[] = [
  { id: "home",        label: "Home",             icon: "🏠" },
  { id: "talk",        label: "Talk / Test",       icon: "🧠" },
  { id: "dashboard",   label: "Dashboard",        icon: "📊" },
  { id: "industries",  label: "Industries",       icon: "🏭" },
  { id: "workflows",   label: "Workflows",        icon: "⚙️" },
  { id: "creative",    label: "Creative",         icon: "🎬" },
  { id: "games",       label: "Games",            icon: "🎮" },
  { id: "story",       label: "Story / World",    icon: "📖" },
  { id: "connection",  label: "Connection",       icon: "🔗" },
  { id: "strategy",    label: "Strategy",         icon: "📈" },
  { id: "roles",       label: "Roles",            icon: "🎭" },
  { id: "agencies",    label: "Agencies",         icon: "🏛️" },
  { id: "states",      label: "States",           icon: "🗺️" },
  { id: "vendors",     label: "Vendors",          icon: "🔧" },
  { id: "programs",    label: "Programs",         icon: "📋" },
  { id: "packets",     label: "Packets",          icon: "📦" },
  { id: "submissions", label: "Submissions",      icon: "📤" },
  { id: "settings",    label: "Settings",         icon: "⚙️" },
];

// ─── Shared UI atoms ──────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
        active
          ? "bg-blue-500 text-white border-blue-500"
          : "bg-white text-muted-foreground border-border hover:border-blue-300 hover:text-blue-600"
      }`}
    >
      {label}
    </button>
  );
}

function ActionBtn({
  label, onClick, variant = "primary", size = "md",
}: {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost" | "success" | "danger";
  size?: "sm" | "md";
}) {
  const base = "rounded-xl font-semibold transition-all border";
  const sz   = size === "sm" ? "px-3 py-1 text-[11px]" : "px-4 py-2 text-[12px]";
  const col  =
    variant === "primary"   ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600" :
    variant === "success"   ? "bg-green-500 text-white border-green-500 hover:bg-green-600" :
    variant === "danger"    ? "bg-red-500 text-white border-red-500 hover:bg-red-600" :
    variant === "secondary" ? "bg-white text-blue-600 border-blue-300 hover:bg-blue-50" :
                              "bg-transparent text-muted-foreground border-border hover:bg-muted";
  return <button onClick={onClick} className={`${base} ${sz} ${col}`}>{label}</button>;
}

function Badge({ label, color = "blue" }: { label: string; color?: string }) {
  const map: Record<string, string> = {
    blue:   "bg-blue-100 text-blue-700",
    green:  "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    purple: "bg-purple-100 text-purple-700",
    gray:   "bg-gray-100 text-gray-600",
    red:    "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${map[color] ?? map.blue}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-3 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-[18px] font-bold text-foreground leading-tight">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function MockOnlyBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
      <p className="text-[10px] text-amber-700 font-medium">
        INTERNAL DEMO ONLY — All data, submissions, and selections are mock. No real APIs, no real data, no real connections.
      </p>
    </div>
  );
}

// ─── Screen: Home ─────────────────────────────────────────────────────────
function HomeScreen() {
  const { state, setRole, setAgency, setState, setVendor, setView, dispatch } = useInteraction();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const role   = MOCK_ROLES.find(r => r.id === state.currentRole);
  const agency = MOCK_AGENCIES.find(a => a.id === state.currentAgency);
  const vendor = MOCK_VENDORS.find(v => v.id === state.currentVendor);

  return (
    <div className="space-y-5">
      <MockOnlyBanner />

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white text-[12px] font-semibold px-4 py-2 rounded-xl shadow-lg animate-in fade-in">
          {toast}
        </div>
      )}

      {/* Current Session */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-4 text-white">
        <p className="text-[10px] font-bold opacity-70 uppercase mb-2">Current Session</p>
        <div className="grid grid-cols-2 gap-2 text-[12px]">
          <div><span className="opacity-70">Role</span><br /><strong>{role?.icon} {role?.label ?? state.currentRole}</strong></div>
          <div><span className="opacity-70">State</span><br /><strong>🗺️ {state.currentState}</strong></div>
          <div><span className="opacity-70">Agency</span><br /><strong>{agency?.abbrev ?? state.currentAgency}</strong></div>
          <div><span className="opacity-70">Vendor</span><br /><strong>{vendor?.label ?? state.currentVendor}</strong></div>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <ActionBtn label="Change Role"   onClick={() => setView("roles")}       variant="secondary" size="sm" />
          <ActionBtn label="Change Agency" onClick={() => setView("agencies")}    variant="secondary" size="sm" />
          <ActionBtn label="Change State"  onClick={() => setView("states")}      variant="secondary" size="sm" />
          <ActionBtn label="Change Vendor" onClick={() => setView("vendors")}     variant="secondary" size="sm" />
        </div>
      </div>

      {/* Quick Selectors */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        <p className="text-[11px] font-bold text-foreground uppercase">Quick Change Role</p>
        <div className="flex flex-wrap gap-2">
          {MOCK_ROLES.slice(0, 8).map(r => (
            <Pill key={r.id} label={`${r.icon} ${r.label}`} active={state.currentRole === r.id}
              onClick={() => { setRole(r.id); showToast(`Role set to ${r.label}`); }} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <p className="text-[11px] font-bold text-foreground uppercase mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "📊 Open Dashboard",   action: () => setView("dashboard") },
            { label: "📦 Open Packets",      action: () => setView("packets") },
            { label: "📤 View Submissions",  action: () => setView("submissions") },
            { label: "⚙️ Settings",          action: () => setView("settings") },
            { label: "✅ Submit Flow",        action: () => { dispatch("SUBMIT", "home-quick-submit"); showToast("Submission logged (mock)"); } },
            { label: "📋 View Programs",     action: () => setView("programs") },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              className="text-left px-3 py-2.5 rounded-xl border border-border text-[12px] font-medium hover:bg-blue-50 hover:border-blue-300 transition-all">
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Log */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <p className="text-[11px] font-bold text-foreground uppercase mb-2">Recent Activity</p>
        {state.actionLog.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No activity yet — start changing selections above.</p>
        ) : (
          <div className="space-y-1">
            {state.actionLog.slice(0, 5).map(entry => (
              <div key={entry.id} className="flex items-center gap-2 text-[11px]">
                <span className="text-muted-foreground">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span className="font-medium text-foreground">{entry.action}</span>
                <span className="text-muted-foreground">→ {entry.newValue}</span>
              </div>
            ))}
            {state.actionLog.length > 5 && (
              <button onClick={() => setView("dashboard")} className="text-[11px] text-blue-500 mt-1">
                See all {state.actionLog.length} actions →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Screen: Dashboard ────────────────────────────────────────────────────
function DashboardScreen() {
  const { state, clearLog, dispatch } = useInteraction();
  const stats = InteractionEngine.getStats();

  const STATUS_COLOR: Record<string, string> = {
    "not-started": "gray", "in-progress": "blue", "submitted": "purple",
    "under-review": "orange", "approved-demo": "green", "rejected": "red",
    "needs-revision": "orange", "expired": "gray",
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Universal Dashboard" subtitle="Live internal state overview — all mock data" />

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total Actions"    value={stats.totalActions}      icon="⚡" />
        <StatCard label="Role Changes"     value={stats.roleChanges}       icon="🎭" />
        <StatCard label="Agency Changes"   value={stats.agencyChanges}     icon="🏛️" />
        <StatCard label="State Changes"    value={stats.stateChanges}      icon="🗺️" />
        <StatCard label="Vendor Changes"   value={stats.vendorChanges}     icon="🔧" />
        <StatCard label="Navigations"      value={stats.navigations}       icon="🔀" />
        <StatCard label="Packet Actions"   value={stats.packetActions}     icon="📦" />
        <StatCard label="Submissions"      value={stats.submissionsLogged} icon="📤" />
      </div>

      {/* Current State Summary */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-2">
        <p className="text-[11px] font-bold uppercase text-foreground mb-1">Universal State</p>
        {[
          ["Role",          state.currentRole],
          ["Department",    state.currentDepartment],
          ["Agency",        state.currentAgency],
          ["State",         state.currentState],
          ["Vendor",        state.currentVendor],
          ["User Type",     state.currentUserType],
          ["Current View",  state.currentView],
          ["Demo Status",   state.currentDemoStatus],
          ["Active Packet", state.currentPacket ?? "none"],
        ].map(([label, val]) => (
          <div key={label} className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold text-foreground">{val}</span>
          </div>
        ))}
      </div>

      {/* Log controls */}
      <div className="flex gap-2">
        <ActionBtn label="Log: Submit"     onClick={() => dispatch("SUBMIT", "dashboard")}      variant="primary" size="sm" />
        <ActionBtn label="Log: Send"       onClick={() => dispatch("SEND", "dashboard")}        variant="secondary" size="sm" />
        <ActionBtn label="Log: Next"       onClick={() => dispatch("NEXT", "dashboard")}        variant="secondary" size="sm" />
        <ActionBtn label="Clear Log"       onClick={clearLog}                                   variant="ghost" size="sm" />
      </div>

      {/* Action Log */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <p className="text-[11px] font-bold uppercase text-foreground mb-2">
          Full Action Log ({state.actionLog.length} entries)
        </p>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {state.actionLog.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">No actions logged yet.</p>
          ) : (
            state.actionLog.map(entry => (
              <div key={entry.id} className="grid grid-cols-[80px_1fr] gap-2 text-[11px] border-b border-border/40 pb-1">
                <span className="text-muted-foreground">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <div>
                  <span className="font-medium text-foreground">{entry.action}</span>
                  {entry.previousValue && (
                    <span className="text-muted-foreground"> {entry.previousValue} → </span>
                  )}
                  <span className="text-blue-600">{entry.newValue}</span>
                  <span className="text-muted-foreground ml-1">({entry.screen})</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Roles ────────────────────────────────────────────────────────
function RolesScreen() {
  const { state, setRole, dispatch } = useInteraction();
  const [detail, setDetail] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const roleDetail = detail ? MOCK_ROLES.find(r => r.id === detail) : null;

  if (roleDetail) {
    return (
      <div className="space-y-4">
        {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white text-[12px] font-semibold px-4 py-2 rounded-xl shadow-lg">{toast}</div>}
        <button onClick={() => setDetail(null)} className="text-[12px] text-blue-500 flex items-center gap-1">← Back to Roles</button>
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{roleDetail.icon}</span>
            <div>
              <p className="text-lg font-bold text-foreground">{roleDetail.label}</p>
              <Badge label={roleDetail.level} color="blue" />
            </div>
          </div>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Role ID</span><span className="font-mono text-foreground">{roleDetail.id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Level</span><span className="font-semibold">{roleDetail.level}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge label={state.currentRole === roleDetail.id ? "Active" : "Available"} color={state.currentRole === roleDetail.id ? "green" : "gray"} /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <ActionBtn label="Change Role to This" onClick={() => { setRole(roleDetail.id); dispatch("CHANGE_ROLE", roleDetail.id); showToast(`Role changed to ${roleDetail.label}`); }} variant="primary" />
            <ActionBtn label="View Details" onClick={() => dispatch("VIEW_DETAILS", roleDetail.id)} variant="secondary" />
          </div>
        </div>
        <MockOnlyBanner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white text-[12px] font-semibold px-4 py-2 rounded-xl shadow-lg">{toast}</div>}
      <SectionHeader title="Roles" subtitle="Select a role to update the active session context" />
      <div className="grid grid-cols-1 gap-2">
        {MOCK_ROLES.map(r => (
          <div key={r.id}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer
              ${state.currentRole === r.id ? "bg-blue-50 border-blue-400" : "bg-white border-border hover:border-blue-200"}`}
          >
            <div className="flex items-center gap-3" onClick={() => { setRole(r.id); showToast(`Role → ${r.label}`); }}>
              <span className="text-xl">{r.icon}</span>
              <div>
                <p className="text-[13px] font-semibold text-foreground">{r.label}</p>
                <p className="text-[10px] text-muted-foreground">{r.level} · {r.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {state.currentRole === r.id && <Badge label="Active" color="green" />}
              <button onClick={() => setDetail(r.id)} className="text-[11px] text-blue-500 hover:underline">Details →</button>
            </div>
          </div>
        ))}
      </div>
      <MockOnlyBanner />
    </div>
  );
}

// ─── Screen: Agencies ─────────────────────────────────────────────────────
function AgenciesScreen() {
  const { state, setAgency, dispatch } = useInteraction();
  const [detail, setDetail] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const agencyDetail = detail ? MOCK_AGENCIES.find(a => a.id === detail) : null;

  if (agencyDetail) {
    return (
      <div className="space-y-4">
        <button onClick={() => setDetail(null)} className="text-[12px] text-blue-500">← Back to Agencies</button>
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <div>
            <p className="text-lg font-bold text-foreground">{agencyDetail.label}</p>
            <Badge label={agencyDetail.abbrev} color="blue" />
          </div>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Abbreviation</span><span className="font-semibold">{agencyDetail.abbrev}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge label={state.currentAgency === agencyDetail.id ? "Active" : "Available"} color={state.currentAgency === agencyDetail.id ? "green" : "gray"} /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <ActionBtn label="Change Agency to This" onClick={() => { setAgency(agencyDetail.id); showToast(`Agency → ${agencyDetail.abbrev}`); setDetail(null); }} variant="primary" />
            <ActionBtn label="View Details" onClick={() => dispatch("VIEW_DETAILS", agencyDetail.id)} variant="secondary" />
          </div>
        </div>
        <MockOnlyBanner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white text-[12px] font-semibold px-4 py-2 rounded-xl shadow-lg">{toast}</div>}
      <SectionHeader title="Agencies" subtitle="18 government/regulatory agencies — select to update active context" />
      <div className="space-y-2">
        {MOCK_AGENCIES.map(a => (
          <div key={a.id}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all
              ${state.currentAgency === a.id ? "bg-blue-50 border-blue-400" : "bg-white border-border hover:border-blue-200"}`}
          >
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setAgency(a.id); showToast(`Agency → ${a.abbrev}`); }}>
              <span className="text-xl">🏛️</span>
              <div>
                <p className="text-[12px] font-semibold text-foreground">{a.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge label={a.abbrev} color="blue" />
              {state.currentAgency === a.id && <Badge label="Active" color="green" />}
              <button onClick={() => setDetail(a.id)} className="text-[11px] text-blue-500 hover:underline">Details →</button>
            </div>
          </div>
        ))}
      </div>
      <MockOnlyBanner />
    </div>
  );
}

// ─── Screen: States ───────────────────────────────────────────────────────
function StatesScreen() {
  const { state, setState, dispatch } = useInteraction();
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const filtered = MOCK_STATES.filter(s => s.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white text-[12px] font-semibold px-4 py-2 rounded-xl shadow-lg">{toast}</div>}
      <SectionHeader title="States" subtitle="51 US states + DC — click to set active state" />
      <input
        value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search states..."
        className="w-full px-3 py-2 rounded-xl border border-border text-[13px] bg-white focus:outline-none focus:border-blue-400"
      />
      <div className="grid grid-cols-2 gap-1.5">
        {filtered.map(s => (
          <button key={s} onClick={() => { setState(s); dispatch("CHANGE_STATE", s); showToast(`State → ${s}`); }}
            className={`px-3 py-2 rounded-xl border text-[12px] font-medium text-left transition-all
              ${state.currentState === s
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-foreground border-border hover:border-blue-300 hover:bg-blue-50"}`}
          >
            {state.currentState === s ? "✓ " : ""}{s}
          </button>
        ))}
      </div>
      <MockOnlyBanner />
    </div>
  );
}

// ─── Screen: Vendors ──────────────────────────────────────────────────────
function VendorsScreen() {
  const { state, setVendor, dispatch } = useInteraction();
  const [detail, setDetail] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const categories = ["all", ...Array.from(new Set(MOCK_VENDORS.map(v => v.category)))];
  const filtered = filterCat === "all" ? MOCK_VENDORS : MOCK_VENDORS.filter(v => v.category === filterCat);
  const vendorDetail = detail ? MOCK_VENDORS.find(v => v.id === detail) : null;

  if (vendorDetail) {
    return (
      <div className="space-y-4">
        <button onClick={() => setDetail(null)} className="text-[12px] text-blue-500">← Back to Vendors</button>
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <div>
            <p className="text-xl font-bold text-foreground">{vendorDetail.label}</p>
            <div className="flex gap-2 mt-1">
              <Badge label={vendorDetail.category} color="blue" />
              <Badge label={vendorDetail.status} color={vendorDetail.status === "active" ? "green" : "orange"} />
            </div>
          </div>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Vendor ID</span><span className="font-mono">{vendorDetail.id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-semibold">{vendorDetail.category}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Integration Status</span><Badge label={vendorDetail.status} color={vendorDetail.status === "active" ? "green" : "orange"} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Active Session</span><Badge label={state.currentVendor === vendorDetail.id ? "Yes" : "No"} color={state.currentVendor === vendorDetail.id ? "green" : "gray"} /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <ActionBtn label="Set as Active Vendor" onClick={() => { setVendor(vendorDetail.id); showToast(`Vendor → ${vendorDetail.label}`); setDetail(null); }} variant="primary" />
            <ActionBtn label="Send Request (Mock)" onClick={() => { dispatch("SEND", vendorDetail.id); showToast("Request sent (mock)"); }} variant="secondary" />
          </div>
        </div>
        <MockOnlyBanner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white text-[12px] font-semibold px-4 py-2 rounded-xl shadow-lg">{toast}</div>}
      <SectionHeader title="Vendors" subtitle="20 mock vendor partners — click to activate or view details" />
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <Pill key={c} label={c === "all" ? "All" : c} active={filterCat === c} onClick={() => setFilterCat(c)} />
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(v => (
          <div key={v.id}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all
              ${state.currentVendor === v.id ? "bg-blue-50 border-blue-400" : "bg-white border-border hover:border-blue-200"}`}
          >
            <div className="cursor-pointer" onClick={() => { setVendor(v.id); showToast(`Vendor → ${v.label}`); }}>
              <p className="text-[12px] font-semibold text-foreground">{v.label}</p>
              <p className="text-[10px] text-muted-foreground">{v.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge label={v.status} color={v.status === "active" ? "green" : "orange"} />
              {state.currentVendor === v.id && <Badge label="Active" color="blue" />}
              <button onClick={() => setDetail(v.id)} className="text-[11px] text-blue-500 hover:underline">Details →</button>
            </div>
          </div>
        ))}
      </div>
      <MockOnlyBanner />
    </div>
  );
}

// ─── Screen: Programs ─────────────────────────────────────────────────────
function ProgramsScreen() {
  const { dispatch } = useInteraction();
  const [selected, setSelected] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState("all");
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const domains = ["all", ...Array.from(new Set(MOCK_PROGRAMS.map(p => p.domain)))];
  const filtered = filterDomain === "all" ? MOCK_PROGRAMS : MOCK_PROGRAMS.filter(p => p.domain === filterDomain);
  const prog = selected ? MOCK_PROGRAMS.find(p => p.id === selected) : null;

  if (prog) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="text-[12px] text-blue-500">← Back to Programs</button>
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <p className="text-lg font-bold text-foreground">{prog.label}</p>
          <Badge label={prog.domain} color="purple" />
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Program ID</span><span className="font-mono">{prog.id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Domain</span><span className="font-semibold">{prog.domain}</span></div>
          </div>
          <div className="flex gap-2 pt-2">
            <ActionBtn label="Enroll (Mock)" onClick={() => { dispatch("SUBMIT", prog.id); showToast("Enrollment submitted (mock)"); }} variant="primary" />
            <ActionBtn label="View Details"  onClick={() => dispatch("VIEW_DETAILS", prog.id)} variant="secondary" />
            <ActionBtn label="← Back"        onClick={() => setSelected(null)} variant="ghost" />
          </div>
        </div>
        <MockOnlyBanner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white text-[12px] font-semibold px-4 py-2 rounded-xl shadow-lg">{toast}</div>}
      <SectionHeader title="Programs" subtitle="16 mock healthcare programs — select to view enrollment flows" />
      <div className="flex gap-2 flex-wrap">
        {domains.map(d => <Pill key={d} label={d} active={filterDomain === d} onClick={() => setFilterDomain(d)} />)}
      </div>
      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-border hover:border-blue-200 transition-all">
            <div>
              <p className="text-[12px] font-semibold text-foreground">{p.label}</p>
              <p className="text-[10px] text-muted-foreground">{p.domain}</p>
            </div>
            <div className="flex gap-2">
              <ActionBtn label="Enroll" onClick={() => { dispatch("SUBMIT", p.id); showToast(`Enrolled in ${p.label} (mock)`); }} variant="primary" size="sm" />
              <button onClick={() => setSelected(p.id)} className="text-[11px] text-blue-500 hover:underline">View →</button>
            </div>
          </div>
        ))}
      </div>
      <MockOnlyBanner />
    </div>
  );
}

// ─── Screen: Packets ──────────────────────────────────────────────────────
function PacketsScreen() {
  const { state, setPacket, dispatch } = useInteraction();
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const packets = IntegrationEngine.getPackets();
  const activePacket = state.currentPacket ? packets.find(p => p.id === state.currentPacket) : null;

  if (activePacket) {
    return (
      <div className="space-y-4">
        {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white text-[12px] font-semibold px-4 py-2 rounded-xl shadow-lg">{toast}</div>}
        <button onClick={() => setPacket(null)} className="text-[12px] text-blue-500">← Back to Packets</button>
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{activePacket.icon}</span>
            <div>
              <p className="text-lg font-bold text-foreground">{activePacket.name}</p>
              <Badge label={activePacket.status} color={activePacket.status === "connected-demo" ? "green" : "blue"} />
            </div>
          </div>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-semibold">{activePacket.category}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Endpoint</span><span className="font-mono text-[10px]">{activePacket.mockEndpoint}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span>{activePacket.version}</span></div>
            {activePacket.activatedAt && <div className="flex justify-between"><span className="text-muted-foreground">Activated</span><span>{new Date(activePacket.activatedAt).toLocaleDateString()}</span></div>}
          </div>
          {activePacket.safetyNote && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-700">
              {activePacket.safetyNote}
            </div>
          )}
          <div className="flex gap-2 flex-wrap pt-2">
            <ActionBtn label="Submit Packet (Mock)" onClick={() => { dispatch("SUBMIT", activePacket.id); showToast("Packet submitted (mock)"); }} variant="primary" />
            <ActionBtn label="Send (Mock)"           onClick={() => { dispatch("SEND", activePacket.id); showToast("Sent (mock)"); }} variant="secondary" />
            <ActionBtn label="← Back"               onClick={() => setPacket(null)} variant="ghost" />
          </div>
        </div>
        <MockOnlyBanner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white text-[12px] font-semibold px-4 py-2 rounded-xl shadow-lg">{toast}</div>}
      <SectionHeader title="Packets" subtitle={`${packets.length} demo integration packets — open to view flows`} />
      <div className="space-y-2">
        {packets.map(p => (
          <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-border hover:border-blue-200 transition-all">
            <div className="flex items-center gap-3">
              <span className="text-xl">{p.icon}</span>
              <div>
                <p className="text-[12px] font-semibold text-foreground">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.category} · {p.version}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge label={p.status} color={p.status === "connected-demo" ? "green" : p.status === "submitted" ? "purple" : "blue"} />
              <ActionBtn label="Open Packet" onClick={() => { setPacket(p.id); dispatch("OPEN_PACKET", p.id); }} variant="primary" size="sm" />
            </div>
          </div>
        ))}
      </div>
      <MockOnlyBanner />
    </div>
  );
}

// ─── Screen: Submissions ──────────────────────────────────────────────────
function SubmissionsScreen() {
  const { state, setDemoStatus, dispatch } = useInteraction();
  const [toast, setToast] = useState<string | null>(null);
  const [step, setStep]   = useState(0);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const submissions = state.actionLog.filter(l => l.action === "SUBMIT");
  const STATUS_COLOR: Record<string, string> = {
    "not-started": "gray", "in-progress": "blue", "submitted": "purple",
    "under-review": "orange", "approved-demo": "green", "rejected": "red",
    "needs-revision": "orange", "expired": "gray",
  };

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white text-[12px] font-semibold px-4 py-2 rounded-xl shadow-lg">{toast}</div>}
      <SectionHeader title="Demo Submissions" subtitle="All submission flows are mock — no real data transmitted" />

      {/* Status selector */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        <p className="text-[11px] font-bold uppercase text-foreground">Current Demo Status</p>
        <div className="flex flex-wrap gap-2">
          {MOCK_DEMO_STATUSES.map(s => (
            <Pill key={s} label={s} active={state.currentDemoStatus === s} onClick={() => { setDemoStatus(s); showToast(`Status → ${s}`); }} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">Current:</span>
          <Badge label={state.currentDemoStatus} color={STATUS_COLOR[state.currentDemoStatus] ?? "gray"} />
        </div>
      </div>

      {/* Step-through submission flow */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        <p className="text-[11px] font-bold uppercase text-foreground">Submit Flow Demo</p>
        {step === 0 && (
          <div>
            <p className="text-[12px] text-muted-foreground mb-3">Step 1 of 3: Review submission context</p>
            <div className="space-y-1 text-[12px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span>{MOCK_ROLES.find(r => r.id === state.currentRole)?.label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Agency</span><span>{MOCK_AGENCIES.find(a => a.id === state.currentAgency)?.abbrev}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">State</span><span>{state.currentState}</span></div>
            </div>
            <div className="flex gap-2 mt-3">
              <ActionBtn label="Next →" onClick={() => { setStep(1); dispatch("NEXT", "submission-step-1"); }} variant="primary" />
            </div>
          </div>
        )}
        {step === 1 && (
          <div>
            <p className="text-[12px] text-muted-foreground mb-3">Step 2 of 3: Confirm packet selection</p>
            <p className="text-[12px] font-medium">Active Packet: <span className="text-blue-600">{state.currentPacket ?? "none selected"}</span></p>
            <div className="flex gap-2 mt-3">
              <ActionBtn label="← Back"  onClick={() => setStep(0)}                                                    variant="ghost" />
              <ActionBtn label="Next →"  onClick={() => { setStep(2); dispatch("NEXT", "submission-step-2"); }}         variant="primary" />
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <p className="text-[12px] text-muted-foreground mb-3">Step 3 of 3: Submit</p>
            <div className="flex gap-2 mt-3">
              <ActionBtn label="← Back" onClick={() => setStep(1)} variant="ghost" />
              <ActionBtn label="✅ Submit (Mock)" onClick={() => {
                dispatch("SUBMIT", "full-flow"); setDemoStatus("submitted"); showToast("Submitted! (mock only)"); setStep(0);
              }} variant="success" />
            </div>
          </div>
        )}
      </div>

      {/* Log */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <p className="text-[11px] font-bold uppercase text-foreground mb-2">
          Submission Log ({submissions.length} entries)
        </p>
        {submissions.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No submissions yet — use the flow above.</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {submissions.map(s => (
              <div key={s.id} className="flex items-center gap-2 text-[11px]">
                <span className="text-muted-foreground">{new Date(s.timestamp).toLocaleTimeString()}</span>
                <Badge label="SUBMIT" color="purple" />
                <span className="text-foreground">{s.newValue}</span>
                <span className="text-muted-foreground">({s.screen})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <MockOnlyBanner />
    </div>
  );
}

// ─── Screen: Settings ─────────────────────────────────────────────────────
function SettingsScreen() {
  const { state, setUserType, setDepartment, dispatch, reset, clearLog } = useInteraction();
  const [toast, setToast]  = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white text-[12px] font-semibold px-4 py-2 rounded-xl shadow-lg">{toast}</div>}
      <SectionHeader title="Settings" subtitle="Configure universal session context" />

      {/* User Type */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        <p className="text-[11px] font-bold uppercase text-foreground">User Type</p>
        <div className="flex flex-wrap gap-2">
          {MOCK_USER_TYPES.map(ut => (
            <Pill key={ut} label={ut} active={state.currentUserType === ut}
              onClick={() => { setUserType(ut); showToast(`User type → ${ut}`); }} />
          ))}
        </div>
      </div>

      {/* Department */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        <p className="text-[11px] font-bold uppercase text-foreground">Active Department</p>
        <div className="flex flex-wrap gap-2">
          {MOCK_DEPARTMENTS.map(d => (
            <Pill key={d.id} label={`${d.icon} ${d.label}`} active={state.currentDepartment === d.id}
              onClick={() => { setDepartment(d.id); showToast(`Department → ${d.label}`); }} />
          ))}
        </div>
      </div>

      {/* Healthcare Reference Data */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-2">
        <p className="text-[11px] font-bold uppercase text-foreground mb-2">Reference Data Loaded</p>
        {[
          ["Healthcare Categories", MOCK_HEALTHCARE_CATEGORIES.length],
          ["Provider Types",        MOCK_PROVIDER_TYPES.length],
          ["Payer Types",           MOCK_PAYER_TYPES.length],
          ["Facilities",            MOCK_FACILITIES.length],
          ["Programs",              MOCK_PROGRAMS.length],
          ["Services",              MOCK_SERVICES.length],
          ["Roles",                 MOCK_ROLES.length],
          ["Agencies",              MOCK_AGENCIES.length],
          ["States",                MOCK_STATES.length],
          ["Vendors",               MOCK_VENDORS.length],
        ].map(([label, count]) => (
          <div key={label as string} className="flex justify-between text-[12px]">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold text-foreground">{count} items</span>
          </div>
        ))}
      </div>

      {/* Log actions */}
      <div className="bg-white rounded-2xl border border-border p-4 space-y-2">
        <p className="text-[11px] font-bold uppercase text-foreground">Actions</p>
        <div className="flex gap-2 flex-wrap">
          <ActionBtn label="Log: Send"     onClick={() => { dispatch("SEND", "settings"); showToast("SEND logged"); }} variant="secondary" size="sm" />
          <ActionBtn label="Log: Submit"   onClick={() => { dispatch("SUBMIT", "settings"); showToast("SUBMIT logged"); }} variant="secondary" size="sm" />
          <ActionBtn label="Clear Log"     onClick={() => { clearLog(); showToast("Log cleared"); }} variant="ghost" size="sm" />
        </div>
      </div>

      {/* Reset */}
      <div className="bg-red-50 rounded-2xl border border-red-200 p-4 space-y-2">
        <p className="text-[11px] font-bold uppercase text-red-600">Reset All State</p>
        <p className="text-[11px] text-muted-foreground">Clears all selections and action log. Returns to defaults.</p>
        {!confirmed ? (
          <ActionBtn label="Reset Universal State" onClick={() => setConfirmed(true)} variant="danger" size="sm" />
        ) : (
          <div className="flex gap-2">
            <ActionBtn label="Yes, Reset" onClick={() => { reset(); setConfirmed(false); showToast("State reset to defaults"); }} variant="danger" size="sm" />
            <ActionBtn label="Cancel"     onClick={() => setConfirmed(false)} variant="ghost" size="sm" />
          </div>
        )}
      </div>

      <MockOnlyBanner />
    </div>
  );
}

// ─── Screen: Talk / Test Mode ─────────────────────────────────────────────
const TALK_CHIPS = [
  "help", "Test me on workflows", "Walk me through the submission flow",
  "Switch to System Admin", "Change agency to SAMHSA", "Set state to Texas",
  "Go to Dashboard", "Pretend a user submitted a packet",
  "What roles are available?", "Quiz me on agencies",
  "What happens if status is rejected?", "Show me all vendors",
];

function TalkScreen() {
  const { history, testSession, send, clear } = useConversation();
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSend = () => {
    const t = input.trim();
    if (!t) return;
    setInput("");
    send(t);
  };

  const toggleListen = () => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported."); return; }
    if (listening) { setListening(false); return; }
    const recog: SpeechRecognition = new SR();
    recog.lang = "en-US";
    recog.onresult = (e: SpeechRecognitionEvent) => {
      const t2 = e.results[0][0].transcript;
      setListening(false);
      send(t2);
    };
    recog.onerror = () => setListening(false);
    recog.onend   = () => setListening(false);
    recog.start();
    setListening(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-[14px]">🧠 Universal Brain — Talk & Test</p>
            <p className="text-blue-200 text-[10px]">Type, click, or speak · All internal · Mock · Demo-only</p>
          </div>
          {testSession.isActive && (
            <div className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-xl">
              Quiz {testSession.currentIndex + 1}/{testSession.questions.length} · Score: {testSession.score}
            </div>
          )}
        </div>
        {/* Quick chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {TALK_CHIPS.slice(0, 6).map(c => (
            <button key={c} onClick={() => send(c)}
              className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-full font-medium transition-all">
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F2F2F7]">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 pt-8">
            <span className="text-5xl">🧠</span>
            <p className="text-[14px] font-bold text-foreground">Universal Interaction Engine</p>
            <p className="text-[12px] text-muted-foreground max-w-xs">
              Say anything. Switch roles, navigate screens, simulate scenarios, get walk-throughs, or take a quiz.
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 italic">All internal · mock · demo-only · non-operational</p>
          </div>
        ) : (
          history.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "system" && (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold mr-1.5 mt-0.5 flex-shrink-0">AI</div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] whitespace-pre-wrap shadow-sm leading-relaxed
                ${msg.role === "user"
                  ? "bg-blue-500 text-white rounded-br-sm"
                  : "bg-white border border-border text-foreground rounded-bl-sm"}`}>
                {msg.text}
                {msg.stateChange && (
                  <div className="mt-1 text-[9px] font-mono opacity-60">✓ state: {msg.stateChange}</div>
                )}
                <div className={`text-[9px] mt-0.5 ${msg.role === "user" ? "text-blue-200" : "text-muted-foreground"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* More quick chips */}
      <div className="px-3 pt-2 flex flex-wrap gap-1.5 bg-white border-t border-border flex-shrink-0">
        {TALK_CHIPS.slice(6).map(c => (
          <button key={c} onClick={() => send(c)}
            className="text-[9px] bg-muted text-muted-foreground hover:bg-blue-50 hover:text-blue-600 px-2 py-0.5 rounded-full transition-all">
            {c}
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="px-3 py-1 bg-white flex-shrink-0">
        <p className="text-[8px] text-center text-muted-foreground">
          DEMO ONLY · No clinical/legal/financial guidance · All responses fictional & non-operational
        </p>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-white px-3 py-2 flex items-center gap-2 flex-shrink-0">
        <button onClick={toggleListen}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all
            ${listening ? "bg-red-500 text-white animate-pulse" : "bg-muted text-muted-foreground hover:bg-blue-50 hover:text-blue-500"}`}>
          🎤
        </button>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
          placeholder={testSession.isActive && testSession.awaitingAnswer ? "Type A, B, C, D or your answer…" : "Type or speak anything…"}
          className="flex-1 bg-muted rounded-xl px-3 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
        <button onClick={handleSend} disabled={!input.trim()}
          className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center text-white flex-shrink-0 transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
        <button onClick={clear}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 text-sm flex-shrink-0 transition-all"
          title="Clear history">
          🗑
        </button>
      </div>
    </div>
  );
}

// ─── Industries Screen ────────────────────────────────────────────────────
function IndustriesScreen() {
  const { state, setIndustry, setCountry, setDomain, setMode, setScenario, dispatch } = useInteraction();
  const activeInd = getIndustry(state.currentIndustry ?? "healthcare");
  const scenarios = getScenariosForIndustry(state.currentIndustry ?? "healthcare");

  return (
    <div className="space-y-5 pb-8">
      <SectionHeader
        title="🏭 Universal Industry Library"
        subtitle="20 industries · ALL roles, domains, workflows, vendors, regulations. Internal mock data only."
      />

      {/* Mode selector */}
      <div className="bg-white border border-border rounded-xl p-3">
        <p className="text-[11px] font-semibold text-muted-foreground mb-2">PLATFORM MODE</p>
        <div className="flex flex-wrap gap-2">
          {UNIVERSAL_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); dispatch("SET_MODE", m.id); }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                state.currentMode === m.id
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-muted-foreground border-border hover:border-blue-300"
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {UNIVERSAL_MODES.find(m => m.id === state.currentMode)?.description ?? "Demo mode active."}
        </p>
      </div>

      {/* Country + Domain */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-border rounded-xl p-3">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2">🌐 COUNTRY CONTEXT</p>
          <select
            value={state.currentCountry}
            onChange={e => { setCountry(e.target.value); dispatch("SET_COUNTRY", e.target.value); }}
            className="w-full text-[12px] border border-border rounded-lg px-2 py-1.5 bg-white text-foreground"
          >
            {UNIVERSAL_COUNTRIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <p className="text-[10px] text-muted-foreground mt-1">Jurisdictional mock context only</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-3">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2">🎯 DOMAIN FOCUS</p>
          <select
            value={state.currentDomain}
            onChange={e => { setDomain(e.target.value); dispatch("SET_DOMAIN", e.target.value); }}
            className="w-full text-[12px] border border-border rounded-lg px-2 py-1.5 bg-white text-foreground"
          >
            {UNIVERSAL_DOMAINS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <p className="text-[10px] text-muted-foreground mt-1">Filter by domain area</p>
        </div>
      </div>

      {/* Industry grid */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-2">SELECT INDUSTRY</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {UNIVERSAL_INDUSTRIES.map(ind => (
            <button
              key={ind.id}
              onClick={() => {
                setIndustry(ind.id);
                setDetailOpen(ind.id);
                dispatch("SET_INDUSTRY", ind.id);
              }}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                state.currentIndustry === ind.id
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-border bg-white hover:border-blue-200 hover:bg-blue-50/30"
              }`}
            >
              <span className="text-xl mb-1">{ind.icon}</span>
              <span className="text-[11px] font-semibold text-foreground leading-tight">{ind.label}</span>
              <span className="text-[9px] text-muted-foreground mt-0.5">{ind.domains[0]} · {ind.roles.length} roles</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active industry detail */}
      {activeInd && (
        <div className="bg-white border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeInd.icon}</span>
            <div>
              <h3 className="text-[15px] font-bold text-foreground">{activeInd.label}</h3>
              <p className="text-[11px] text-muted-foreground">Mock data only · Non-operational · Internal</p>
            </div>
          </div>

          {([
            { label: "Roles", items: activeInd.roles },
            { label: "Departments", items: activeInd.departments },
            { label: "Workflows", items: activeInd.workflows },
            { label: "Programs", items: activeInd.programs },
            { label: "Vendors", items: activeInd.vendors },
            { label: "Regulations (Mock)", items: activeInd.regulations },
          ] as const).map(({ label, items }) => (
            <div key={label}>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">{label.toUpperCase()}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map(item => (
                  <span key={item} className="px-2 py-0.5 bg-muted rounded-full text-[11px] text-foreground">{item}</span>
                ))}
              </div>
            </div>
          ))}

          {/* Scenarios */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">DEMO SCENARIOS</p>
            <div className="space-y-1.5">
              {scenarios.slice(0, 6).map(s => (
                <button
                  key={s.id}
                  onClick={() => { setScenario(s.id); dispatch("SET_SCENARIO", s.id); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left text-[12px] transition-all ${
                    state.currentScenario === s.id
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                      : "border-border bg-white text-foreground hover:border-blue-200"
                  }`}
                >
                  <span>{s.label}</span>
                  {state.currentScenario === s.id && <span className="text-blue-500 text-[10px] font-bold">ACTIVE</span>}
                </button>
              ))}
            </div>
          </div>

          {activeInd.scenarios.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">EXAMPLE SCENARIOS (FICTIONAL)</p>
              <div className="space-y-1">
                {activeInd.scenarios.map(s => (
                  <div key={s} className="text-[11px] text-muted-foreground pl-2 border-l-2 border-blue-100">{s}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-[11px] text-amber-800 font-semibold">⚠️ Universal Safety Core Active</p>
        <p className="text-[10px] text-amber-700 mt-0.5">All industry data is fictional, internal, and non-operational. No clinical, legal, financial, or regulatory guidance is provided. Demo use only.</p>
      </div>
    </div>
  );
}

// ─── Workflows Screen ─────────────────────────────────────────────────────
function WorkflowsScreen() {
  const { state, dispatch } = useInteraction();
  const [activeWfs, setActiveWfs] = useState<Workflow[]>(() => WorkflowEngine.getAll());
  const [activeTab, setActiveTab] = useState<"templates" | "active">("templates");
  const [expandedWf, setExpandedWf] = useState<string | null>(null);
  const templates = WorkflowEngine.getTemplates();
  const industryTemplates = templates.filter(t => t.industry === state.currentIndustry);
  const otherTemplates = templates.filter(t => t.industry !== state.currentIndustry);

  const startWf = (templateId: string) => {
    const wf = WorkflowEngine.startWorkflow(templateId);
    setActiveWfs(WorkflowEngine.getAll());
    setExpandedWf(wf.id);
    setActiveTab("active");
    dispatch("START_WORKFLOW", templateId);
  };

  const advanceWf = (id: string, outcome: MockOutcome) => {
    WorkflowEngine.advanceStep(id, outcome);
    setActiveWfs(WorkflowEngine.getAll());
    dispatch("ADVANCE_WORKFLOW_STEP", `${id}:${outcome}`);
  };

  const resetWf = (id: string) => {
    WorkflowEngine.resetWorkflow(id);
    setActiveWfs(WorkflowEngine.getAll());
    dispatch("RESET_WORKFLOW", id);
  };

  const deleteWf = (id: string) => {
    WorkflowEngine.deleteWorkflow(id);
    setActiveWfs(WorkflowEngine.getAll());
    if (expandedWf === id) setExpandedWf(null);
  };

  const statusColor = (s: string) => ({
    "not-started": "text-muted-foreground",
    "in-progress": "text-blue-600",
    "complete": "text-green-600",
    "failed": "text-red-500",
    "paused": "text-amber-600",
  }[s] ?? "text-muted-foreground");

  const stepStatusColor = (s: string) => ({
    "pending": "bg-muted text-muted-foreground",
    "in-progress": "bg-blue-100 text-blue-700",
    "complete": "bg-green-100 text-green-700",
    "error": "bg-red-100 text-red-600",
    "warning": "bg-amber-100 text-amber-700",
    "skipped": "bg-gray-100 text-gray-500",
  }[s] ?? "bg-muted text-muted-foreground");

  return (
    <div className="space-y-4 pb-8">
      <SectionHeader
        title="⚙️ Universal Workflow Engine"
        subtitle="Simulate workflows for any industry. All steps are fictional mock outcomes. No real processes triggered."
      />

      <div className="flex gap-2">
        {(["templates", "active"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-[12px] font-semibold border transition-all ${
              activeTab === tab ? "bg-blue-500 text-white border-blue-500" : "border-border text-muted-foreground hover:border-blue-300"
            }`}
          >
            {tab === "templates" ? `📋 Templates (${templates.length})` : `⚙️ Active (${activeWfs.length})`}
          </button>
        ))}
      </div>

      {activeTab === "templates" && (
        <div className="space-y-4">
          {industryTemplates.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-2">FOR YOUR INDUSTRY ({(getIndustry(state.currentIndustry)?.label ?? "Healthcare").toUpperCase()})</p>
              <div className="space-y-2">
                {industryTemplates.map(t => (
                  <div key={t.id} className="bg-white border border-blue-200 rounded-xl p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">{t.name}</p>
                        <p className="text-[11px] text-muted-foreground">{t.description}</p>
                        <p className="text-[10px] text-blue-600 mt-0.5">{t.steps.length} steps · {t.domain}</p>
                      </div>
                      <button
                        onClick={() => startWf(t.id)}
                        className="ml-3 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[11px] font-semibold hover:bg-blue-600 transition-colors shrink-0"
                      >
                        ▶ Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-2">ALL WORKFLOW TEMPLATES</p>
            <div className="space-y-2">
              {otherTemplates.map(t => (
                <div key={t.id} className="bg-white border border-border rounded-xl p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t.industry} · {t.steps.length} steps · {t.domain}</p>
                    </div>
                    <button
                      onClick={() => startWf(t.id)}
                      className="ml-3 px-3 py-1.5 border border-blue-400 text-blue-600 rounded-lg text-[11px] font-semibold hover:bg-blue-50 transition-colors shrink-0"
                    >
                      ▶ Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "active" && (
        <div className="space-y-3">
          {activeWfs.length === 0 ? (
            <div className="bg-muted/30 rounded-xl p-8 text-center">
              <p className="text-[13px] text-muted-foreground">No active workflows. Start one from the Templates tab.</p>
            </div>
          ) : (
            activeWfs.map(wf => (
              <div key={wf.id} className="bg-white border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedWf(expandedWf === wf.id ? null : wf.id)}
                  className="w-full flex items-center justify-between p-3 text-left"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{wf.name}</p>
                    <p className={`text-[11px] font-semibold ${statusColor(wf.status)}`}>
                      {wf.status.replace("-", " ").toUpperCase()} · Step {Math.min(wf.currentStep + 1, wf.steps.length)}/{wf.steps.length}
                    </p>
                  </div>
                  <span className="text-muted-foreground">{expandedWf === wf.id ? "▲" : "▼"}</span>
                </button>

                {expandedWf === wf.id && (
                  <div className="border-t border-border px-3 pb-3 space-y-3">
                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(wf.currentStep / wf.steps.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-2">
                      {wf.steps.map((step, i) => (
                        <div
                          key={step.id}
                          className={`rounded-lg p-2.5 border ${
                            i === wf.currentStep && wf.status === "in-progress"
                              ? "border-blue-300 bg-blue-50"
                              : "border-border bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[12px] font-semibold text-foreground">{i + 1}. {step.title}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stepStatusColor(step.status)}`}>
                              {step.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{step.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Actor: {step.actor} · {step.duration}</p>
                          {step.errorNote && (
                            <p className="text-[10px] text-red-500 mt-1">⚠ {step.errorNote}</p>
                          )}
                          {step.completedAt && (
                            <p className="text-[10px] text-green-600 mt-0.5">✓ {step.outcomes.success}</p>
                          )}
                          {/* Advance buttons for current step */}
                          {i === wf.currentStep && wf.status === "in-progress" && (
                            <div className="flex gap-2 mt-2">
                              {(["success", "failure", "partial"] as MockOutcome[]).map(outcome => (
                                <button
                                  key={outcome}
                                  onClick={() => advanceWf(wf.id, outcome)}
                                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                                    outcome === "success" ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : outcome === "failure" ? "bg-red-100 text-red-600 hover:bg-red-200"
                                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                  }`}
                                >
                                  {outcome === "success" ? "✓ Success" : outcome === "failure" ? "✗ Failure" : "⚠ Partial"}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => resetWf(wf.id)}
                        className="px-3 py-1.5 border border-border rounded-lg text-[11px] font-semibold text-muted-foreground hover:bg-muted"
                      >
                        ↺ Reset
                      </button>
                      <button
                        onClick={() => deleteWf(wf.id)}
                        className="px-3 py-1.5 border border-red-200 rounded-lg text-[11px] font-semibold text-red-500 hover:bg-red-50"
                      >
                        🗑 Delete
                      </button>
                    </div>

                    {/* Log */}
                    {wf.log.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">WORKFLOW LOG (mock)</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {wf.log.map((entry, i) => (
                            <div key={i} className="text-[10px] text-muted-foreground border-b border-border pb-1">
                              <span className="text-blue-500">[{entry.action}]</span> {entry.step} — {entry.result}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-[11px] text-amber-800 font-semibold">⚠️ Universal Safety Core · Workflow Engine</p>
        <p className="text-[10px] text-amber-700 mt-0.5">All workflow steps, outcomes, logs, and actors are entirely fictional. No real business processes, submissions, or approvals are triggered. Internal demo only.</p>
      </div>
    </div>
  );
}

// ─── Creative Screen ──────────────────────────────────────────────────────
function CreativeScreen() {
  const { dispatch } = useInteraction();
  const CREATIVE_TYPES: { value: CreativeType; label: string; icon: string }[] = [
    { value: "video",        label: "Marketing Video",    icon: "🎬" },
    { value: "documentary",  label: "Documentary",        icon: "🎥" },
    { value: "training",     label: "Training Module",    icon: "🎓" },
    { value: "simulation",   label: "Simulation",         icon: "🔬" },
    { value: "storyboard",   label: "Storyboard",         icon: "🎨" },
    { value: "script",       label: "Script",             icon: "📝" },
    { value: "explainer",    label: "Explainer Video",    icon: "💡" },
    { value: "podcast",      label: "Podcast Episode",    icon: "🎙️" },
    { value: "course",       label: "Online Course",      icon: "📚" },
    { value: "presentation", label: "Presentation",       icon: "📊" },
    { value: "webinar",      label: "Webinar",            icon: "🖥️" },
    { value: "commercial",   label: "Commercial Spot",    icon: "📺" },
  ];
  const TONE_OPTIONS = ["Professional", "Cinematic", "Educational", "Playful", "Dramatic", "Inspiring", "Authoritative", "Friendly", "Urgent", "Reflective"];

  const [form, setForm] = useState({
    type: "video" as CreativeType,
    topic: "",
    audience: "",
    tone: "Professional",
    title: "",
  });
  const [generated, setGenerated] = useState(() => CreativeEngine.getAll());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);

  const generate = () => {
    if (!form.topic.trim()) return;
    const pkg = CreativeEngine.generate({
      type: form.type,
      topic: form.topic,
      audience: form.audience || "general audiences",
      tone: form.tone,
      title: form.title || undefined,
    });
    setGenerated(CreativeEngine.getAll());
    setActiveId(pkg.id);
    setExpandedChapter(0);
    dispatch("GENERATE_CREATIVE", `${form.type}:${form.topic.slice(0, 40)}`);
  };

  const activePkg = generated.find(p => p.id === activeId);

  return (
    <div className="space-y-4 pb-8">
      <SectionHeader
        title="🎬 Universal Creative Production Engine"
        subtitle="Generate fictional production packages for any creative format. Non-operational · Demo-only · Internal."
      />

      {/* Generator form */}
      <div className="bg-white border border-border rounded-xl p-4 space-y-3">
        <p className="text-[12px] font-bold text-foreground">Generate Production Package</p>

        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">FORMAT</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {CREATIVE_TYPES.map(ct => (
              <button
                key={ct.value}
                onClick={() => setForm(f => ({ ...f, type: ct.value }))}
                className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${
                  form.type === ct.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-border bg-white text-muted-foreground hover:border-blue-200"
                }`}
              >
                <span className="text-lg">{ct.icon}</span>
                <span className="text-[10px] font-semibold mt-0.5 leading-tight">{ct.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">TOPIC / SUBJECT *</label>
            <input
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              placeholder="e.g. Patient safety protocols"
              className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground placeholder:text-muted-foreground/60"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">TARGET AUDIENCE</label>
            <input
              value={form.audience}
              onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
              placeholder="e.g. Healthcare professionals"
              className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground placeholder:text-muted-foreground/60"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">CUSTOM TITLE (optional)</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Leave blank for auto-generated"
              className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground placeholder:text-muted-foreground/60"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">TONE / STYLE</label>
            <select
              value={form.tone}
              onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}
              className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground"
            >
              {TONE_OPTIONS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={!form.topic.trim()}
          className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-[13px] font-bold disabled:opacity-40 hover:bg-blue-600 transition-colors"
        >
          ✨ Generate {CREATIVE_TYPES.find(c => c.value === form.type)?.label}
        </button>
        <p className="text-[10px] text-muted-foreground text-center">Fictional output only — not a real production document</p>
      </div>

      {/* Generated packages list */}
      {generated.length > 1 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-2">GENERATED PACKAGES ({generated.length})</p>
          <div className="flex flex-wrap gap-2">
            {generated.map(p => (
              <button
                key={p.id}
                onClick={() => { setActiveId(p.id); setExpandedChapter(0); }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                  activeId === p.id ? "bg-blue-500 text-white border-blue-500" : "border-border text-muted-foreground hover:border-blue-300"
                }`}
              >
                {CREATIVE_TYPES.find(c => c.value === p.type)?.icon} {p.type} · {p.topic?.slice(0, 18) ?? p.title.slice(0, 18)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active package display */}
      {activePkg && (
        <div className="bg-white border border-border rounded-xl p-4 space-y-4">
          <div>
            <h3 className="text-[16px] font-bold text-foreground">{activePkg.title}</h3>
            <p className="text-[12px] text-muted-foreground">{activePkg.subtitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {[
              ["Format", CREATIVE_TYPES.find(c => c.value === activePkg.type)?.label],
              ["Audience", activePkg.audience],
              ["Tone", activePkg.tone],
              ["Duration", activePkg.totalDuration],
              ["Structure", activePkg.structure],
            ].map(([k, v]) => (
              <div key={k as string} className="bg-muted/30 rounded-lg p-2">
                <p className="text-[9px] font-bold text-muted-foreground">{k as string}</p>
                <p className="text-foreground font-semibold text-[11px] mt-0.5">{v as string}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-1">PURPOSE</p>
            <p className="text-[12px] text-foreground">{activePkg.purpose}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-1">EMOTIONAL ARC</p>
            <p className="text-[12px] text-foreground">{activePkg.emotionalArc}</p>
          </div>

          {/* Style guide */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-2">STYLE GUIDE</p>
            <div className="bg-muted/20 rounded-lg p-3 space-y-1.5 text-[11px]">
              <div><span className="font-semibold">Visual:</span> {activePkg.styleGuide.visualStyle}</div>
              <div><span className="font-semibold">Music:</span> {activePkg.styleGuide.musicGenre}</div>
              <div><span className="font-semibold">Voiceover:</span> {activePkg.styleGuide.voiceoverStyle}</div>
              <div><span className="font-semibold">Typography:</span> {activePkg.styleGuide.typography}</div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Color Palette:</span>
                {activePkg.styleGuide.colorPalette.map(c => (
                  <span key={c} style={{ background: c }} className="w-4 h-4 rounded-full border border-border inline-block" title={c} />
                ))}
              </div>
            </div>
          </div>

          {/* Mock actors */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-2">MOCK TALENT (FICTIONAL)</p>
            <div className="flex flex-wrap gap-2">
              {activePkg.mockActors.map(a => (
                <div key={a.name} className="bg-muted/30 rounded-lg px-3 py-2 text-[11px]">
                  <p className="font-semibold text-foreground">{a.name}</p>
                  <p className="text-muted-foreground">{a.role} · {a.style}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chapters */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-2">
              {activePkg.type === "script" ? "SCENES" : activePkg.type === "storyboard" ? "FRAMES" : "CHAPTERS"} ({activePkg.chapters.length})
            </p>
            <div className="space-y-2">
              {activePkg.chapters.map((ch) => (
                <div key={ch.index} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedChapter(expandedChapter === ch.index ? null : ch.index)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-white hover:bg-muted/20 transition-colors"
                  >
                    <div>
                      <span className="text-[12px] font-semibold text-foreground">{ch.title}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">· {ch.duration} · {ch.pacing}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-blue-500 font-semibold">{ch.emotion}</span>
                      <span className="text-muted-foreground text-[12px]">{expandedChapter === ch.index ? "▲" : "▼"}</span>
                    </div>
                  </button>
                  {expandedChapter === ch.index && (
                    <div className="border-t border-border p-3 space-y-2 bg-muted/5 text-[11px]">
                      <div><span className="font-semibold text-muted-foreground">NARRATION / COPY:</span><p className="mt-0.5 text-foreground whitespace-pre-wrap">{ch.narration}</p></div>
                      <div><span className="font-semibold text-muted-foreground">VISUALS:</span><p className="mt-0.5 text-foreground">{ch.visuals}</p></div>
                      <div className="flex gap-4">
                        <div><span className="font-semibold text-muted-foreground">TRANSITION:</span> {ch.transition}</div>
                        <div><span className="font-semibold text-muted-foreground">PACING:</span> {ch.pacing}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-[11px] font-semibold text-blue-800">CALL TO ACTION (FICTIONAL)</p>
            <p className="text-[12px] text-blue-700 mt-0.5">{activePkg.callToAction}</p>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-[11px] text-amber-800 font-semibold">⚠️ Disclaimer</p>
            <p className="text-[10px] text-amber-700 mt-0.5">{activePkg.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Games Screen ─────────────────────────────────────────────────────────
const GAME_TYPES: { value: GameType; label: string; icon: string }[] = [
  { value: "rpg",         label: "RPG",            icon: "⚔️" },
  { value: "platformer",  label: "Platformer",     icon: "🏃" },
  { value: "strategy",    label: "Strategy",       icon: "♟️" },
  { value: "puzzle",      label: "Puzzle",         icon: "🧩" },
  { value: "simulation",  label: "Simulation",     icon: "🏙️" },
  { value: "adventure",   label: "Adventure",      icon: "🗺️" },
  { value: "action",      label: "Action",         icon: "💥" },
  { value: "horror",      label: "Horror",         icon: "👻" },
  { value: "sports",      label: "Sports",         icon: "🏆" },
  { value: "educational", label: "Educational",    icon: "📚" },
  { value: "sandbox",     label: "Sandbox",        icon: "🏗️" },
  { value: "survival",    label: "Survival",       icon: "🔥" },
];

function GamesScreen() {
  const { dispatch } = useInteraction();
  const [form, setForm] = useState({ type: "rpg" as GameType, title: "", worldName: "", audience: "General (13+)" });
  const [projects, setProjects] = useState(() => GameEngine.getAll());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"design"|"mechanics"|"levels"|"npcs"|"hud"|"loop">("design");

  const generate = () => {
    const p = GameEngine.generate({
      type: form.type,
      title: form.title || undefined,
      worldName: form.worldName || undefined,
      targetAudience: form.audience,
    });
    setProjects(GameEngine.getAll());
    setActiveId(p.id);
    setActiveTab("design");
    dispatch("GENERATE_GAME", `${form.type}:${p.title.slice(0, 40)}`);
  };

  const active = projects.find(p => p.id === activeId);
  const TABS = [
    { id: "design",    label: "Overview" },
    { id: "mechanics", label: "Mechanics" },
    { id: "levels",    label: "Levels" },
    { id: "npcs",      label: "NPCs" },
    { id: "hud",       label: "HUD / UI" },
    { id: "loop",      label: "Game Loop" },
  ] as const;

  return (
    <div className="space-y-4 pb-8">
      <SectionHeader
        title="🎮 Universal Game Engine"
        subtitle="Fictional game design documents for any genre. Non-operational · Demo-only · Internal."
      />

      {/* Generator form */}
      <div className="bg-white border border-border rounded-xl p-4 space-y-3">
        <p className="text-[12px] font-bold text-foreground">Generate Game Design Document</p>
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">GAME TYPE</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {GAME_TYPES.map(gt => (
              <button
                key={gt.value}
                onClick={() => setForm(f => ({ ...f, type: gt.value }))}
                className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${
                  form.type === gt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-border bg-white text-muted-foreground hover:border-blue-200"
                }`}
              >
                <span className="text-lg">{gt.icon}</span>
                <span className="text-[10px] font-semibold mt-0.5 leading-tight">{gt.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">GAME TITLE (optional)</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Auto-generated if blank" className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground placeholder:text-muted-foreground/60" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">WORLD NAME</label>
            <input value={form.worldName} onChange={e => setForm(f => ({ ...f, worldName: e.target.value }))} placeholder="e.g. The Iron Marches" className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground placeholder:text-muted-foreground/60" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">TARGET AUDIENCE</label>
            <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground">
              {["Everyone (E)", "General (13+)", "Teen (T)", "Mature (M, 17+)", "Adult (AO)"].map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <button onClick={generate} className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors">
          🎮 Generate {GAME_TYPES.find(g => g.value === form.type)?.label} GDD
        </button>
        <p className="text-[10px] text-muted-foreground text-center">Fictional Game Design Document — not a real game proposal</p>
      </div>

      {/* Project switcher */}
      {projects.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {projects.map(p => (
            <button key={p.id} onClick={() => { setActiveId(p.id); setActiveTab("design"); }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${activeId === p.id ? "bg-blue-500 text-white border-blue-500" : "border-border text-muted-foreground hover:border-blue-300"}`}>
              {GAME_TYPES.find(g => g.value === p.type)?.icon} {p.title.slice(0, 22)}
            </button>
          ))}
        </div>
      )}

      {/* Active GDD */}
      {active && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50 to-white">
            <h3 className="text-[16px] font-bold text-foreground">{active.title}</h3>
            <p className="text-[11px] text-muted-foreground">{active.genre} · {active.platform.join(", ")} · {active.perspective} · {active.ratingTarget}</p>
          </div>

          {/* Tab bar */}
          <div className="flex overflow-x-auto border-b border-border bg-white">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === t.id ? "border-blue-500 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {activeTab === "design" && (
              <div className="space-y-3">
                <div><p className="text-[11px] font-semibold text-muted-foreground mb-1">LOGLINE</p><p className="text-[12px] text-foreground italic">"{active.logline}"</p></div>
                <div><p className="text-[11px] font-semibold text-muted-foreground mb-1">SYNOPSIS</p><p className="text-[12px] text-foreground">{active.synopsis}</p></div>
                <div><p className="text-[11px] font-semibold text-muted-foreground mb-1">STORY ARC</p><pre className="text-[11px] text-foreground whitespace-pre-wrap font-sans">{active.storyArc}</pre></div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1">WORLD: {active.worldName}</p>
                  <p className="text-[12px] text-foreground">{active.worldDesc}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">ASSET LIST (MOCK)</p>
                  <div className="space-y-1">
                    {active.assetList.map(a => <div key={a} className="text-[11px] text-muted-foreground pl-2 border-l-2 border-blue-100">{a}</div>)}
                  </div>
                </div>
                <div className="bg-muted/20 rounded-lg p-3"><p className="text-[11px] font-semibold text-muted-foreground mb-1">TECHNICAL NOTES</p><p className="text-[11px] text-foreground">{active.technicalNotes}</p></div>
              </div>
            )}

            {activeTab === "mechanics" && (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1">PROGRESSION SYSTEM</p>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[12px] space-y-1">
                    <p><span className="font-semibold">Type:</span> {active.progression.type}</p>
                    <p><span className="font-semibold">Levels:</span> {active.progression.levels > 0 ? active.progression.levels : "No cap"}</p>
                    <p><span className="font-semibold">XP Curve:</span> {active.progression.xpCurve}</p>
                    <p><span className="font-semibold">Prestige:</span> {active.progression.prestige ? "Yes" : "No"} · <span className="font-semibold">Seasons:</span> {active.progression.seasons ? "Yes" : "No"}</p>
                    <p className="text-muted-foreground">{active.progression.description}</p>
                  </div>
                </div>
                {active.mechanics.map(m => (
                  <div key={m.id} className="border border-border rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-bold text-foreground">{m.name}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-muted rounded-full text-muted-foreground">{m.category} · {m.difficulty}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{m.description}</p>
                    <p className="text-[11px]"><span className="font-semibold text-foreground">Player:</span> {m.playerAction}</p>
                    <p className="text-[11px]"><span className="font-semibold text-foreground">System:</span> {m.systemResponse}</p>
                    <div className="flex gap-3 text-[11px]">
                      <span className="text-green-600">✓ {m.reward}</span>
                      <span className="text-red-500">✗ {m.penalty}</span>
                    </div>
                  </div>
                ))}
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">SKILL TREE: {active.skillTree.name}</p>
                  <p className="text-[11px] text-muted-foreground mb-2">{active.skillTree.description}</p>
                  <div className="space-y-1.5">
                    {active.skillTree.nodes.map(n => (
                      <div key={n.id} className="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-lg text-[11px]">
                        <span className="font-semibold text-blue-600">T{n.tier}</span>
                        <span className="font-semibold text-foreground">{n.name}</span>
                        <span className="text-muted-foreground">· Cost: {n.cost} SP</span>
                        <span className="text-foreground flex-1 text-right">{n.effect}</span>
                        {n.prerequisite && <span className="text-amber-500 text-[9px]">Req: {n.prerequisite}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "levels" && (
              <div className="space-y-3">
                {active.levels.map(lv => (
                  <div key={lv.index} className="border border-border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-bold text-foreground">{lv.name}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => <span key={i} className={`text-[12px] ${i < lv.difficultyRating ? "text-amber-400" : "text-muted-foreground/30"}`}>★</span>)}
                        <span className="text-[10px] text-muted-foreground ml-1">{lv.estimatedTime}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{lv.environment}</p>
                    <p className="text-[11px]"><span className="font-semibold text-foreground">Objective:</span> {lv.objective}</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><span className="font-semibold text-red-500">Enemies:</span> {lv.enemies.join(", ")}</div>
                      <div><span className="font-semibold text-amber-500">Obstacles:</span> {lv.obstacles.join(", ")}</div>
                      <div><span className="font-semibold text-blue-500">Collectibles:</span> {lv.collectibles}</div>
                      <div><span className="font-semibold text-green-600">Reward:</span> {lv.reward}</div>
                    </div>
                    {lv.boss && <p className="text-[11px] font-semibold text-red-600">BOSS: {lv.boss}</p>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "npcs" && (
              <div className="space-y-3">
                {active.npcs.map(npc => (
                  <div key={npc.id} className="border border-border rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-[13px] font-bold text-foreground">{npc.name}</p>
                        <p className="text-[11px] text-muted-foreground">{npc.role} · {npc.faction}</p>
                      </div>
                    </div>
                    <p className="text-[11px]"><span className="font-semibold text-foreground">Behavior:</span> {npc.behavior}</p>
                    <div className="flex flex-wrap gap-1">
                      {npc.abilities.map(a => <span key={a} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-semibold">{a}</span>)}
                    </div>
                    <div className="space-y-0.5">
                      {npc.dialogue.map((d, i) => <p key={i} className="text-[11px] text-muted-foreground italic">{d}</p>)}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {npc.loot.map(l => <span key={l} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px]">{l}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "hud" && (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-2">HUD ELEMENTS</p>
                  <div className="flex flex-wrap gap-2">
                    {active.hud.elements.map(e => <span key={e} className="px-2 py-1 bg-muted rounded-lg text-[11px] text-foreground">{e}</span>)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div><span className="text-[11px] font-semibold text-muted-foreground block mb-0.5">HEALTH DISPLAY</span>{active.hud.healthDisplay}</div>
                  <div><span className="text-[11px] font-semibold text-muted-foreground block mb-0.5">MINIMAP</span>{active.hud.minimap ? "Yes" : "None"}</div>
                  <div><span className="text-[11px] font-semibold text-muted-foreground block mb-0.5">QUEST TRACKER</span>{active.hud.questTracker ? "Yes" : "None"}</div>
                  <div><span className="text-[11px] font-semibold text-muted-foreground block mb-0.5">NOTIFICATIONS</span>{active.hud.notifications}</div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">RESOURCE BARS</p>
                  <div className="flex flex-wrap gap-2">
                    {active.hud.resourceBars.map(r => <span key={r} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px]">{r}</span>)}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "loop" && (
              <div className="space-y-3">
                {active.gameLoop.map((loop, i) => (
                  <div key={i} className="border border-border rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">{i + 1}</span>
                      <div>
                        <p className="text-[13px] font-bold text-foreground">{loop.phase}</p>
                        <p className="text-[10px] text-muted-foreground">{loop.duration}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {loop.actions.map(a => <span key={a} className="px-2 py-0.5 bg-muted rounded-full text-[10px] text-foreground">{a}</span>)}
                    </div>
                    <p className="text-[11px] text-green-700">→ {loop.outcome}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 pb-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-[11px] text-amber-800 font-semibold">⚠️ {active.safetyNote}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Story / World Screen ─────────────────────────────────────────────────
const STORY_FORMATS: { value: StoryFormat; label: string; icon: string }[] = [
  { value: "movie",       label: "Movie",          icon: "🎬" },
  { value: "tv-series",   label: "TV Series",      icon: "📺" },
  { value: "mini-series", label: "Mini-Series",    icon: "🎞️" },
  { value: "documentary", label: "Documentary",    icon: "🎥" },
  { value: "comic",       label: "Comic",          icon: "💬" },
  { value: "graphic-novel", label: "Graphic Novel", icon: "📕" },
  { value: "novel",       label: "Novel",          icon: "📗" },
  { value: "short-story", label: "Short Story",    icon: "📄" },
  { value: "interactive", label: "Interactive",    icon: "🕹️" },
  { value: "audio-drama", label: "Audio Drama",    icon: "🎙️" },
  { value: "stage-play",  label: "Stage Play",     icon: "🎭" },
  { value: "web-series",  label: "Web Series",     icon: "💻" },
];
const STORY_GENRES: { value: StoryGenre; label: string }[] = [
  { value: "drama", label: "Drama" }, { value: "thriller", label: "Thriller" },
  { value: "sci-fi", label: "Sci-Fi" }, { value: "fantasy", label: "Fantasy" },
  { value: "horror", label: "Horror" }, { value: "romance", label: "Romance" },
  { value: "comedy", label: "Comedy" }, { value: "mystery", label: "Mystery" },
  { value: "action", label: "Action" }, { value: "historical", label: "Historical" },
  { value: "biographical", label: "Biographical" }, { value: "experimental", label: "Experimental" },
];
const ARCHETYPES_UI: { value: CharacterArchetype; label: string }[] = [
  { value: "hero", label: "Hero" }, { value: "mentor", label: "Mentor" },
  { value: "villain", label: "Villain" }, { value: "anti-hero", label: "Anti-Hero" },
  { value: "trickster", label: "Trickster" }, { value: "shadow", label: "Shadow" },
  { value: "guardian", label: "Guardian" }, { value: "ally", label: "Ally" },
  { value: "shapeshifter", label: "Shapeshifter" }, { value: "everyman", label: "Everyman" },
  { value: "innocent", label: "Innocent" }, { value: "herald", label: "Herald" },
];
const WORLD_TYPES_UI: { value: WorldType; label: string; icon: string }[] = [
  { value: "fantasy",          label: "Fantasy",          icon: "🧙" },
  { value: "sci-fi",           label: "Sci-Fi",           icon: "🚀" },
  { value: "contemporary",     label: "Contemporary",     icon: "🏙️" },
  { value: "historical",       label: "Historical",       icon: "🏛️" },
  { value: "post-apocalyptic", label: "Post-Apocalyptic", icon: "☢️" },
  { value: "alternate-history", label: "Alt-History",    icon: "⚙️" },
  { value: "mythological",     label: "Mythological",     icon: "⚡" },
  { value: "horror",           label: "Horror",           icon: "👁️" },
  { value: "utopia",           label: "Utopia",           icon: "🌅" },
  { value: "dystopia",         label: "Dystopia",         icon: "🌆" },
];

function StoryScreen() {
  const { dispatch } = useInteraction();
  const [mode, setMode] = useState<"story"|"character"|"world">("story");
  const [storyForm, setStoryForm] = useState({ format: "movie" as StoryFormat, genre: "drama" as StoryGenre, title: "", tone: "Dramatic" });
  const [charForm, setCharForm] = useState({ archetype: "hero" as CharacterArchetype, name: "", context: "" });
  const [worldForm, setWorldForm] = useState({ type: "fantasy" as WorldType, name: "" });

  const [stories, setStories] = useState(() => StoryEngine.getAll());
  const [characters, setCharacters] = useState(() => CharacterEngine.getAll());
  const [worlds, setWorlds] = useState(() => WorldEngine.getAll());
  const [activeStory, setActiveStory] = useState<string | null>(null);
  const [activeChar, setActiveChar] = useState<string | null>(null);
  const [activeWorld, setActiveWorld] = useState<string | null>(null);

  const genStory = () => {
    const s = StoryEngine.generate({ format: storyForm.format, genre: storyForm.genre, title: storyForm.title || undefined, tone: storyForm.tone });
    setStories(StoryEngine.getAll()); setActiveStory(s.id);
    dispatch("GENERATE_STORY", `${storyForm.format}:${s.title.slice(0, 40)}`);
  };
  const genChar = () => {
    const c = CharacterEngine.generate({ archetype: charForm.archetype, name: charForm.name || undefined, context: charForm.context || undefined });
    setCharacters(CharacterEngine.getAll()); setActiveChar(c.id);
    dispatch("GENERATE_CHARACTER", `${charForm.archetype}:${c.name}`);
  };
  const genWorld = () => {
    const w = WorldEngine.generate({ type: worldForm.type, name: worldForm.name || undefined });
    setWorlds(WorldEngine.getAll()); setActiveWorld(w.id);
    dispatch("GENERATE_WORLD", `${worldForm.type}:${w.name}`);
  };

  const story = stories.find(s => s.id === activeStory);
  const character = characters.find(c => c.id === activeChar);
  const world = worlds.find(w => w.id === activeWorld);

  return (
    <div className="space-y-4 pb-8">
      <SectionHeader
        title="📖 Story + Character + World Engine"
        subtitle="Generate fictional story structures, character profiles, and world-building documents. Demo-only · Internal."
      />

      {/* Mode switcher */}
      <div className="flex gap-2">
        {([
          { id: "story", label: "📖 Story", count: stories.length },
          { id: "character", label: "🧑 Character", count: characters.length },
          { id: "world", label: "🌍 World", count: worlds.length },
        ] as const).map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`px-4 py-2 rounded-full text-[12px] font-semibold border transition-all ${mode === m.id ? "bg-blue-500 text-white border-blue-500" : "border-border text-muted-foreground hover:border-blue-300"}`}>
            {m.label}{m.count > 0 ? ` (${m.count})` : ""}
          </button>
        ))}
      </div>

      {/* Story mode */}
      {mode === "story" && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl p-4 space-y-3">
            <p className="text-[12px] font-bold">Generate Story Project</p>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">FORMAT</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {STORY_FORMATS.map(f => (
                  <button key={f.value} onClick={() => setStoryForm(sf => ({ ...sf, format: f.value }))}
                    className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${storyForm.format === f.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-border bg-white text-muted-foreground hover:border-blue-200"}`}>
                    <span className="text-lg">{f.icon}</span>
                    <span className="text-[10px] font-semibold mt-0.5 leading-tight">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STORY_GENRES.map(g => (
                <button key={g.value} onClick={() => setStoryForm(sf => ({ ...sf, genre: g.value }))}
                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${storyForm.genre === g.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-border text-muted-foreground hover:border-blue-200"}`}>
                  {g.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">TITLE (optional)</label>
                <input value={storyForm.title} onChange={e => setStoryForm(f => ({ ...f, title: e.target.value }))} placeholder="Auto-generated if blank" className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground placeholder:text-muted-foreground/60" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">TONE</label>
                <select value={storyForm.tone} onChange={e => setStoryForm(f => ({ ...f, tone: e.target.value }))} className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground">
                  {["Dramatic", "Cinematic", "Comedic", "Bleak", "Hopeful", "Satirical", "Lyrical", "Tense", "Intimate", "Epic"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button onClick={genStory} className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors">
              📖 Generate Story Project
            </button>
          </div>

          {/* Switcher */}
          {stories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {stories.map(s => (
                <button key={s.id} onClick={() => setActiveStory(s.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border ${activeStory === s.id ? "bg-blue-500 text-white border-blue-500" : "border-border text-muted-foreground hover:border-blue-300"}`}>
                  {STORY_FORMATS.find(f => f.value === s.format)?.icon} {s.title.slice(0, 24)}
                </button>
              ))}
            </div>
          )}

          {story && (
            <div className="bg-white border border-border rounded-xl p-4 space-y-4">
              <div>
                <h3 className="text-[16px] font-bold text-foreground">{story.title}</h3>
                <p className="text-[11px] text-muted-foreground">{story.format} · {story.genre} · {story.runtime} · {story.tone}</p>
              </div>
              <div><p className="text-[11px] font-semibold text-muted-foreground mb-1">LOGLINE</p><p className="text-[12px] text-foreground italic">"{story.logline}"</p></div>
              <div><p className="text-[11px] font-semibold text-muted-foreground mb-1">SYNOPSIS</p><p className="text-[12px] text-foreground">{story.synopsis}</p></div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">THEMES</p>
                <div className="space-y-2">
                  {story.themes.map(t => (
                    <div key={t.name} className="bg-muted/20 rounded-lg p-3 text-[11px]">
                      <p className="font-bold text-foreground">{t.name}</p>
                      <p className="text-muted-foreground italic mt-0.5">"{t.expression}"</p>
                      <p className="text-muted-foreground mt-0.5">Symbol: {t.symbol} · Motif: {t.motif}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">STRUCTURE / ACTS</p>
                <div className="space-y-2">
                  {story.acts.map(a => (
                    <div key={a.actNumber} className="border border-border rounded-xl p-3 space-y-2">
                      <p className="text-[13px] font-bold text-foreground">Act {a.actNumber}: {a.name}</p>
                      <p className="text-[11px] text-muted-foreground">{a.summary}</p>
                      <div className="flex flex-wrap gap-1">{a.keyEvents.map(e => <span key={e} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-foreground">{e}</span>)}</div>
                      <p className="text-[11px] text-blue-600"><span className="font-semibold">Turning Point:</span> {a.turning}</p>
                      <p className="text-[11px] text-muted-foreground"><span className="font-semibold">Emotion:</span> {a.emotion} · <span className="font-semibold">Scope:</span> {a.pageRange}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div><p className="text-[11px] font-semibold text-muted-foreground mb-1">CENTRAL CONFLICT</p><p className="text-[12px] text-foreground">{story.conflict}</p></div>
              <div><p className="text-[11px] font-semibold text-muted-foreground mb-1">RESOLUTION</p><p className="text-[12px] text-foreground">{story.resolution}</p></div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="bg-muted/20 rounded-lg p-2"><p className="font-semibold text-muted-foreground text-[9px]">NARRATIVE STYLE</p><p className="text-foreground mt-0.5">{story.narrativeStyle}</p></div>
                <div className="bg-muted/20 rounded-lg p-2"><p className="font-semibold text-muted-foreground text-[9px]">POV</p><p className="text-foreground mt-0.5">{story.pov}</p></div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-[11px] text-amber-800 font-semibold">⚠️ {story.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Character mode */}
      {mode === "character" && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl p-4 space-y-3">
            <p className="text-[12px] font-bold">Generate Character Profile</p>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">ARCHETYPE</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {ARCHETYPES_UI.map(a => (
                  <button key={a.value} onClick={() => setCharForm(f => ({ ...f, archetype: a.value }))}
                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${charForm.archetype === a.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-border text-muted-foreground hover:border-blue-200"}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">NAME (optional)</label>
                <input value={charForm.name} onChange={e => setCharForm(f => ({ ...f, name: e.target.value }))} placeholder="Auto-generated if blank" className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground placeholder:text-muted-foreground/60" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">STORY CONTEXT</label>
                <input value={charForm.context} onChange={e => setCharForm(f => ({ ...f, context: e.target.value }))} placeholder="e.g. a post-apocalyptic world" className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground placeholder:text-muted-foreground/60" />
              </div>
            </div>
            <button onClick={genChar} className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors">
              🧑 Generate Character Profile
            </button>
          </div>

          {characters.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {characters.map(c => (
                <button key={c.id} onClick={() => setActiveChar(c.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border ${activeChar === c.id ? "bg-blue-500 text-white border-blue-500" : "border-border text-muted-foreground hover:border-blue-300"}`}>
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {character && (
            <div className="bg-white border border-border rounded-xl p-4 space-y-4">
              <div>
                <h3 className="text-[16px] font-bold text-foreground">{character.name}</h3>
                <p className="text-[11px] text-muted-foreground">{character.role} · {character.archetype} · Age: {character.age}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {character.personality.map(p => <span key={p} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-semibold text-center">{p}</span>)}
              </div>
              {[
                { label: "MOTIVATION", value: character.motivation },
                { label: "FEAR", value: character.fear },
                { label: "SECRET", value: character.secret },
                { label: "APPEARANCE", value: character.appearance },
                { label: "VOICE STYLE", value: character.voiceStyle },
                { label: "CATCHPHRASE", value: character.catchphrase, italic: true },
              ].map(({ label, value, italic }) => (
                <div key={label}>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">{label}</p>
                  <p className={`text-[12px] text-foreground ${italic ? "italic" : ""}`}>{value}</p>
                </div>
              ))}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">CHARACTER ARC</p>
                <div className="space-y-1.5 text-[11px]">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-2"><span className="font-semibold">Start:</span> {character.arc.startState}</div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-2"><span className="font-semibold">Journey:</span> {character.arc.journey}</div>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-2"><span className="font-semibold">End:</span> {character.arc.endState}</div>
                  <p className="text-muted-foreground italic">{character.arc.growthTheme}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">ABILITIES</p>
                {character.abilities.map(a => (
                  <div key={a.name} className="border border-border rounded-lg p-2 text-[11px] mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{a.name}</span>
                      <span className="text-muted-foreground">· {a.type}</span>
                      <span className="ml-auto text-amber-500">{Array.from({ length: a.strength }, () => "★").join("").slice(0, a.strength > 5 ? 5 : a.strength)}</span>
                    </div>
                    <p className="text-muted-foreground">{a.description}</p>
                    <p className="text-red-500 text-[10px] mt-0.5">Limitation: {a.limitation}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">RELATIONSHIPS</p>
                <div className="space-y-1.5">
                  {character.relationships.map(r => (
                    <div key={r.characterName} className="flex items-start gap-2 text-[11px] border border-border rounded-lg p-2">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[9px] ${r.type === "ally" ? "bg-green-100 text-green-700" : r.type === "rival" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-700"}`}>{r.type}</span>
                      <span className="font-semibold text-foreground">{r.characterName}</span>
                      <span className="text-muted-foreground flex-1">{r.dynamic}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-[11px] text-amber-800">{character.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* World mode */}
      {mode === "world" && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl p-4 space-y-3">
            <p className="text-[12px] font-bold">Generate World</p>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">WORLD TYPE</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {WORLD_TYPES_UI.map(wt => (
                  <button key={wt.value} onClick={() => setWorldForm(f => ({ ...f, type: wt.value }))}
                    className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${worldForm.type === wt.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-border bg-white text-muted-foreground hover:border-blue-200"}`}>
                    <span className="text-lg">{wt.icon}</span>
                    <span className="text-[10px] font-semibold mt-0.5 leading-tight">{wt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">WORLD NAME (optional)</label>
              <input value={worldForm.name} onChange={e => setWorldForm(f => ({ ...f, name: e.target.value }))} placeholder="Auto-generated if blank" className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground placeholder:text-muted-foreground/60" />
            </div>
            <button onClick={genWorld} className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors">
              🌍 Generate World
            </button>
          </div>

          {worlds.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {worlds.map(w => (
                <button key={w.id} onClick={() => setActiveWorld(w.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border ${activeWorld === w.id ? "bg-blue-500 text-white border-blue-500" : "border-border text-muted-foreground hover:border-blue-300"}`}>
                  {WORLD_TYPES_UI.find(t => t.value === w.type)?.icon} {w.name.slice(0, 24)}
                </button>
              ))}
            </div>
          )}

          {world && (
            <div className="bg-white border border-border rounded-xl p-4 space-y-4">
              <div>
                <h3 className="text-[16px] font-bold text-foreground">{world.name}</h3>
                <p className="text-[11px] text-blue-600 italic mt-0.5">"{world.tagline}"</p>
                <p className="text-[11px] text-muted-foreground mt-1">{world.type}</p>
              </div>
              <p className="text-[12px] text-foreground">{world.description}</p>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">HISTORY</p>
                <div className="space-y-1">{world.history.map((h, i) => <div key={i} className="text-[11px] text-foreground pl-2 border-l-2 border-blue-100">{h}</div>)}</div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">REGIONS</p>
                <div className="space-y-2">
                  {world.regions.map(r => (
                    <div key={r.name} className="border border-border rounded-xl p-3 space-y-1 text-[11px]">
                      <p className="font-bold text-foreground">{r.name}</p>
                      <p><span className="font-semibold">Terrain:</span> {r.terrain} · <span className="font-semibold">Climate:</span> {r.climate}</p>
                      <p><span className="font-semibold">Inhabitants:</span> {r.inhabitants}</p>
                      <p><span className="font-semibold">Key Location:</span> {r.keyLocation}</p>
                      <p className="text-red-500"><span className="font-semibold text-foreground">Hazards:</span> {r.hazards}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">FACTIONS</p>
                <div className="space-y-2">
                  {world.factions.map(f => (
                    <div key={f.name} className="border border-border rounded-xl p-3 space-y-1 text-[11px]">
                      <div className="flex items-center gap-2"><p className="font-bold text-foreground">{f.name}</p><span className="text-[10px] text-muted-foreground">{f.symbol}</span></div>
                      <p><span className="font-semibold">Ideology:</span> {f.ideology}</p>
                      <p><span className="font-semibold">Leader:</span> {f.leader}</p>
                      <p><span className="font-semibold">Goal:</span> {f.goal}</p>
                      <p className="text-amber-600"><span className="font-semibold text-foreground">Conflict:</span> {f.conflict}</p>
                    </div>
                  ))}
                </div>
              </div>
              {([
                { label: "CULTURE",    value: world.culture },
                { label: "TECHNOLOGY", value: world.technology },
                { label: "ECONOMY",    value: world.economy },
                { label: "POLITICS",   value: world.politics },
                { label: "ECOLOGY",    value: world.ecology },
                { label: "CALENDAR",   value: world.calendar },
              ] as const).map(({ label, value }) => (
                <div key={label}><p className="text-[11px] font-semibold text-muted-foreground mb-0.5">{label}</p><p className="text-[12px] text-foreground">{value}</p></div>
              ))}
              {world.magic && (
                <div><p className="text-[11px] font-semibold text-muted-foreground mb-0.5">MAGIC SYSTEM</p><p className="text-[12px] text-foreground">{world.magic}</p></div>
              )}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1">LANGUAGES</p>
                <div className="flex flex-wrap gap-2">{world.languages.map(l => <span key={l} className="px-2 py-0.5 bg-muted rounded-full text-[11px]">{l}</span>)}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-[11px] text-amber-800">{world.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Connection Screen ────────────────────────────────────────────────────
function ConnectionScreen() {
  const { dispatch } = useInteraction();
  const formats = ConnectionEngine.getFormats();

  const [projects, setProjects] = useState(() => ConnectionEngine.getAll());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    title: "", format: "movie" as ProjectFormat, logline: "",
  });
  const [addEl, setAddEl] = useState({
    type: "story" as ProjectElement["type"],
    label: "", summary: "", completeness: 75,
  });
  const [activeTab, setActiveTab] = useState<"overview"|"threads"|"completeness"|"export">("overview");
  const [showAdd, setShowAdd] = useState(false);

  const createProject = () => {
    if (!createForm.title.trim()) return;
    const p = ConnectionEngine.create({ title: createForm.title, format: createForm.format, logline: createForm.logline || undefined });
    setProjects(ConnectionEngine.getAll());
    setActiveId(p.id);
    setActiveTab("overview");
    dispatch("CREATE_CONNECTION_PROJECT", `${createForm.format}:${createForm.title.slice(0, 40)}`);
    setCreateForm({ title: "", format: "movie", logline: "" });
  };

  const addElement = () => {
    if (!activeId || !addEl.label.trim()) return;
    ConnectionEngine.addElement(activeId, {
      type: addEl.type, label: addEl.label, summary: addEl.summary || `${addEl.type} element for this project. [Fictional]`, completeness: addEl.completeness,
    });
    setProjects(ConnectionEngine.getAll());
    dispatch("ADD_PROJECT_ELEMENT", `${addEl.type}:${addEl.label}`);
    setAddEl({ type: "story", label: "", summary: "", completeness: 75 });
    setShowAdd(false);
  };

  const removeEl = (label: string) => {
    if (!activeId) return;
    ConnectionEngine.removeElement(activeId, label);
    setProjects(ConnectionEngine.getAll());
    dispatch("REMOVE_PROJECT_ELEMENT", label);
  };

  const active = projects.find(p => p.id === activeId);

  const ELEMENT_TYPES: { value: ProjectElement["type"]; label: string; icon: string }[] = [
    { value: "story",     label: "Story",    icon: "📖" },
    { value: "character", label: "Character",icon: "🧑" },
    { value: "world",     label: "World",    icon: "🌍" },
    { value: "mechanics", label: "Mechanics",icon: "⚙️" },
    { value: "workflow",  label: "Workflow", icon: "🔄" },
    { value: "creative",  label: "Creative", icon: "🎬" },
    { value: "custom",    label: "Custom",   icon: "✏️" },
  ];

  const TABS = [
    { id: "overview",     label: "Overview" },
    { id: "threads",      label: "Connections" },
    { id: "completeness", label: "Pass" },
    { id: "export",       label: "Export" },
  ] as const;

  const scoreColor = (score: number) =>
    score >= 90 ? "text-green-600" : score >= 70 ? "text-blue-600" : score >= 50 ? "text-amber-600" : "text-red-500";

  const statusColor = (s: string) => ({
    complete: "bg-green-100 text-green-700",
    partial:  "bg-amber-100 text-amber-700",
    missing:  "bg-red-100 text-red-600",
  }[s] ?? "bg-muted text-muted-foreground");

  return (
    <div className="space-y-4 pb-8">
      <SectionHeader
        title="🔗 Universal Connection Layer"
        subtitle="Link Story · Character · World · Mechanics · Workflow into a unified fictional project. Completeness Pass included."
      />

      {/* Create project form */}
      <div className="bg-white border border-border rounded-xl p-4 space-y-3">
        <p className="text-[12px] font-bold text-foreground">Create Connected Project</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">PROJECT TITLE *</label>
            <input value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. The Iron Realms Universe" className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground placeholder:text-muted-foreground/60" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">FORMAT</label>
            <select value={createForm.format} onChange={e => setCreateForm(f => ({ ...f, format: e.target.value as ProjectFormat }))} className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground">
              {formats.map(f => <option key={f.value} value={f.value}>{f.icon} {f.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">LOGLINE (optional)</label>
          <input value={createForm.logline} onChange={e => setCreateForm(f => ({ ...f, logline: e.target.value }))} placeholder="One-sentence description of the project" className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground placeholder:text-muted-foreground/60" />
        </div>
        <p className="text-[10px] text-muted-foreground">{formats.find(f => f.value === createForm.format)?.desc ?? ""}</p>
        <button onClick={createProject} disabled={!createForm.title.trim()} className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-[13px] font-bold disabled:opacity-40 hover:bg-blue-600 transition-colors">
          🔗 Create Connected Project
        </button>
      </div>

      {/* Project switcher */}
      {projects.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {projects.map(p => (
            <button key={p.id} onClick={() => { setActiveId(p.id); setActiveTab("overview"); }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border ${activeId === p.id ? "bg-blue-500 text-white border-blue-500" : "border-border text-muted-foreground hover:border-blue-300"}`}>
              {formats.find(f => f.value === p.format)?.icon} {p.title.slice(0, 24)}
            </button>
          ))}
        </div>
      )}

      {/* Active project */}
      {active && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-foreground">{active.title}</h3>
                <p className="text-[11px] text-muted-foreground">{formats.find(f => f.value === active.format)?.label} · {active.elements.length} elements</p>
                <p className="text-[11px] text-muted-foreground italic mt-0.5">"{active.logline}"</p>
              </div>
              <div className="text-right">
                <p className={`text-[22px] font-bold ${scoreColor(active.completeness.overallScore)}`}>{active.completeness.overallScore}%</p>
                <p className="text-[9px] text-muted-foreground">COMPLETENESS</p>
                {active.completeness.readyToExport && <p className="text-[9px] text-green-600 font-bold">✓ READY</p>}
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-border bg-white overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === t.id ? "border-blue-500 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {/* Overview tab */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold text-foreground">Project Elements ({active.elements.length})</p>
                  <button onClick={() => setShowAdd(s => !s)} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[11px] font-semibold hover:bg-blue-600 transition-colors">
                    {showAdd ? "✕ Cancel" : "+ Add Element"}
                  </button>
                </div>

                {showAdd && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                    <p className="text-[11px] font-bold text-blue-800">Add Project Element</p>
                    <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
                      {ELEMENT_TYPES.map(et => (
                        <button key={et.value} onClick={() => setAddEl(a => ({ ...a, type: et.value }))}
                          className={`flex flex-col items-center p-1.5 rounded-lg border text-[9px] font-semibold transition-all ${addEl.type === et.value ? "border-blue-500 bg-blue-100 text-blue-700" : "border-border bg-white text-muted-foreground"}`}>
                          <span>{et.icon}</span><span>{et.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">LABEL *</label>
                        <input value={addEl.label} onChange={e => setAddEl(a => ({ ...a, label: e.target.value }))} placeholder={`e.g. "The Final Act" (story)`} className="w-full text-[11px] border border-border rounded-lg px-2 py-1.5 bg-white text-foreground placeholder:text-muted-foreground/60" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">COMPLETENESS %</label>
                        <input type="range" min={10} max={100} step={5} value={addEl.completeness} onChange={e => setAddEl(a => ({ ...a, completeness: +e.target.value }))} className="w-full mt-1" />
                        <p className="text-[10px] text-muted-foreground text-center">{addEl.completeness}%</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">SUMMARY (optional)</label>
                      <input value={addEl.summary} onChange={e => setAddEl(a => ({ ...a, summary: e.target.value }))} placeholder="Brief description of this element" className="w-full text-[11px] border border-border rounded-lg px-2 py-1.5 bg-white text-foreground placeholder:text-muted-foreground/60" />
                    </div>
                    <button onClick={addElement} disabled={!addEl.label.trim()} className="w-full py-2 bg-blue-500 text-white rounded-lg text-[11px] font-bold disabled:opacity-40 hover:bg-blue-600 transition-colors">
                      Add {ELEMENT_TYPES.find(e => e.value === addEl.type)?.label} Element
                    </button>
                  </div>
                )}

                {active.elements.length === 0 ? (
                  <div className="bg-muted/20 rounded-xl p-6 text-center">
                    <p className="text-[13px] text-muted-foreground">No elements yet. Click "+ Add Element" to link your first Story, Character, World, or Mechanic.</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Generate content from other engine screens, then link it here. [Demo — all fictional]</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {active.elements.map(el => (
                      <div key={el.label} className="border border-border rounded-xl p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="text-lg mt-0.5">{ELEMENT_TYPES.find(e => e.value === el.type)?.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[13px] font-semibold text-foreground">{el.label}</p>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColor(el.status)}`}>{el.status.toUpperCase()}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{el.summary}</p>
                              <div className="mt-1.5 flex items-center gap-2">
                                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${el.completeness}%` }} />
                                </div>
                                <span className="text-[10px] text-muted-foreground">{el.completeness}%</span>
                              </div>
                            </div>
                          </div>
                          <button onClick={() => removeEl(el.label)} className="ml-2 text-[10px] text-red-400 hover:text-red-600 font-semibold">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">INTERNAL NOTES</p>
                  <div className="space-y-0.5">
                    {active.internalNotes.map((n, i) => <p key={i} className="text-[10px] text-muted-foreground">{n}</p>)}
                  </div>
                </div>
              </div>
            )}

            {/* Connections tab */}
            {activeTab === "threads" && (
              <div className="space-y-3">
                <p className="text-[12px] text-muted-foreground">Connection threads are auto-generated from the element types in your project. They describe the structural and narrative links between elements. [Fictional]</p>
                {active.threads.length === 0 ? (
                  <div className="bg-muted/20 rounded-xl p-6 text-center">
                    <p className="text-[13px] text-muted-foreground">No connection threads yet. Add 2+ elements with complementary types (e.g. Story + World) to generate threads.</p>
                  </div>
                ) : (
                  active.threads.map((t, i) => (
                    <div key={i} className="border border-border rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[12px] text-foreground">{t.from}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold text-[12px] text-foreground">{t.to}</span>
                        <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full ${t.strength === "strong" ? "bg-green-100 text-green-700" : t.strength === "medium" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                          {t.strength.toUpperCase()} LINK
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{t.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Completeness pass tab */}
            {activeTab === "completeness" && (
              <div className="space-y-4">
                <div className={`rounded-xl p-4 text-center border ${active.completeness.overallScore >= 70 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                  <p className={`text-[36px] font-bold ${scoreColor(active.completeness.overallScore)}`}>{active.completeness.overallScore}<span className="text-[18px]">%</span></p>
                  <p className="text-[12px] text-foreground font-semibold mt-1">Overall Completeness Score</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{active.completeness.recommendation}</p>
                  {active.completeness.readyToExport && <p className="text-[11px] text-green-700 font-bold mt-2">✓ Ready for conceptual export</p>}
                </div>

                {active.completeness.issues.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground mb-2">ISSUES FOUND</p>
                    <div className="space-y-2">
                      {active.completeness.issues.map((issue, i) => (
                        <div key={i} className={`rounded-lg p-3 border text-[11px] ${issue.severity === "critical" ? "bg-red-50 border-red-200" : issue.severity === "major" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-100"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${issue.severity === "critical" ? "bg-red-100 text-red-700" : issue.severity === "major" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{issue.severity.toUpperCase()}</span>
                            <span className="font-semibold text-foreground">{issue.element}</span>
                            {issue.autoFixed && <span className="text-[9px] text-green-700 font-bold ml-auto">AUTO-FIXED</span>}
                          </div>
                          <p className="text-muted-foreground">{issue.description}</p>
                          <p className="text-foreground mt-1 font-semibold">→ {issue.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {active.completeness.autoFixes.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground mb-2">AUTO-FIXES APPLIED</p>
                    <div className="space-y-1">
                      {active.completeness.autoFixes.map((fix, i) => (
                        <div key={i} className="text-[10px] text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5">{fix}</div>
                      ))}
                    </div>
                  </div>
                )}

                {active.completeness.issues.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <p className="text-[13px] font-bold text-green-700">No issues found</p>
                    <p className="text-[11px] text-green-600 mt-0.5">This project passed all completeness checks. [Fictional assessment]</p>
                  </div>
                )}
              </div>
            )}

            {/* Export tab */}
            {activeTab === "export" && (
              <div className="space-y-4">
                <div className="bg-muted/20 rounded-xl p-3">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1">CONCEPTUAL EXPORT PACKAGE</p>
                  <p className="text-[11px] text-muted-foreground">What would be included in an export of this project. All documents are fictional. No real file is generated.</p>
                </div>
                <div className="space-y-1.5">
                  {active.exportPackage.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg text-[11px]">
                      <span className="text-blue-400">📄</span>
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-[11px] text-amber-800 font-semibold">⚠️ {active.safetyNote}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Strategy Screen ──────────────────────────────────────────────────────
function StrategyScreen() {
  const { dispatch } = useInteraction();
  const focusOptions  = StrategyEngine.getFocusOptions();
  const horizonOptions = StrategyEngine.getHorizonOptions();

  const [form, setForm] = useState({
    focus:   "growth" as StrategyFocus,
    horizon: "90-day" as TimeHorizon,
    context: "",
    title:   "",
  });
  const [roadmaps, setRoadmaps] = useState(() => StrategyEngine.getAll());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"milestones"|"competitive"|"revenue"|"risks"|"quick">("milestones");

  const generate = () => {
    const r = StrategyEngine.generate({
      focus:   form.focus,
      horizon: form.horizon,
      context: form.context || undefined,
      title:   form.title || undefined,
    });
    setRoadmaps(StrategyEngine.getAll());
    setActiveId(r.id);
    setActiveTab("milestones");
    dispatch("GENERATE_STRATEGY", `${form.focus}:${form.horizon}`);
  };

  const active = roadmaps.find(r => r.id === activeId);
  const TABS = [
    { id: "milestones",  label: "Milestones" },
    { id: "competitive", label: "Competitive" },
    { id: "revenue",     label: "Revenue" },
    { id: "risks",       label: "Risks" },
    { id: "quick",       label: "Quick Wins" },
  ] as const;

  return (
    <div className="space-y-4 pb-8">
      <SectionHeader
        title="📈 Strategy & Roadmap Module"
        subtitle="Conceptual planning: roadmaps, milestones, growth, revenue, competitive positioning. Non-operational · No guarantees implied."
      />

      {/* Generator */}
      <div className="bg-white border border-border rounded-xl p-4 space-y-3">
        <p className="text-[12px] font-bold text-foreground">Generate Strategy Roadmap</p>

        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">FOCUS AREA</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {focusOptions.map(f => (
              <button key={f.value} onClick={() => setForm(fm => ({ ...fm, focus: f.value }))}
                className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border text-left text-[11px] font-semibold transition-all ${form.focus === f.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-border text-muted-foreground hover:border-blue-200"}`}>
                <span>{f.icon}</span><span>{f.label}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">{focusOptions.find(f => f.value === form.focus)?.desc ?? ""}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">TIME HORIZON</label>
            <select value={form.horizon} onChange={e => setForm(f => ({ ...f, horizon: e.target.value as TimeHorizon }))} className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground">
              {horizonOptions.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">CUSTOM TITLE</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Auto-generated if blank" className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground placeholder:text-muted-foreground/60" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">CONTEXT</label>
            <input value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} placeholder="e.g. creative media platform" className="w-full text-[12px] border border-border rounded-lg px-2.5 py-2 bg-white text-foreground placeholder:text-muted-foreground/60" />
          </div>
        </div>

        <button onClick={generate} className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors">
          📈 Generate {form.horizon} {focusOptions.find(f => f.value === form.focus)?.label} Roadmap
        </button>
        <p className="text-[10px] text-muted-foreground text-center">Conceptual planning only — not real business advice · No outcomes guaranteed or implied</p>
      </div>

      {/* Roadmap switcher */}
      {roadmaps.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {roadmaps.map(r => (
            <button key={r.id} onClick={() => { setActiveId(r.id); setActiveTab("milestones"); }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${activeId === r.id ? "bg-blue-500 text-white border-blue-500" : "border-border text-muted-foreground hover:border-blue-300"}`}>
              {focusOptions.find(f => f.value === r.focus)?.icon} {r.title.slice(0, 28)}
            </button>
          ))}
        </div>
      )}

      {/* Active roadmap */}
      {active && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-green-50 to-white">
            <h3 className="text-[15px] font-bold text-foreground">{active.title}</h3>
            <p className="text-[11px] text-muted-foreground">{horizonOptions.find(h => h.value === active.horizon)?.label} · {focusOptions.find(f => f.value === active.focus)?.label} · Conceptual</p>
          </div>

          {/* North Star */}
          <div className="px-4 pt-4 pb-0">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-blue-600 mb-1">★ NORTH STAR</p>
              <p className="text-[12px] text-blue-800 font-medium italic">"{active.northStar}"</p>
            </div>
          </div>

          {/* Principles */}
          <div className="px-4 pt-3">
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">OPERATING PRINCIPLES</p>
            <div className="space-y-1">
              {active.principles.map((p, i) => <p key={i} className="text-[11px] text-foreground pl-2 border-l-2 border-blue-100">{p}</p>)}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-border mt-3 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === t.id ? "border-blue-500 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {/* Milestones */}
            {activeTab === "milestones" && (
              <div className="space-y-3">
                {active.milestones.map((m, i) => (
                  <div key={i} className="border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 p-3 bg-muted/10">
                      <span className="w-7 h-7 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-[11px] font-bold shrink-0">{i + 1}</span>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground">{m.phase}</p>
                        <p className="text-[13px] font-bold text-foreground">{m.title}</p>
                        <p className="text-[10px] text-blue-600">{m.timeframe}</p>
                      </div>
                    </div>
                    <div className="p-3 space-y-2 text-[11px]">
                      <p className="text-muted-foreground">{m.description}</p>
                      <div>
                        <p className="font-semibold text-foreground mb-1">KEY ACTIONS</p>
                        <div className="space-y-0.5">
                          {m.keyActions.map(a => <p key={a} className="text-muted-foreground pl-2 border-l-2 border-blue-100">{a}</p>)}
                        </div>
                      </div>
                      <div className="flex gap-3 pt-1">
                        <div className="flex-1 bg-green-50 border border-green-100 rounded-lg p-2">
                          <p className="text-[9px] font-bold text-green-700 mb-0.5">SUCCESS METRIC</p>
                          <p className="text-foreground">{m.successMetric}</p>
                        </div>
                        <div className="flex-1 bg-amber-50 border border-amber-100 rounded-lg p-2">
                          <p className="text-[9px] font-bold text-amber-700 mb-0.5">RISK NOTE</p>
                          <p className="text-foreground">{m.riskNote}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Competitive */}
            {activeTab === "competitive" && (
              <div className="space-y-3 text-[11px]">
                <p className="text-muted-foreground">{active.competitive.positioning}</p>
                {[
                  { label: "STRENGTHS", items: active.competitive.strengthAreas, cls: "bg-green-50 border-green-100 text-green-800" },
                  { label: "DIFFERENTIATORS", items: active.competitive.differentiators, cls: "bg-blue-50 border-blue-100 text-blue-800" },
                  { label: "GAPS TO ADDRESS", items: active.competitive.gapAreas, cls: "bg-amber-50 border-amber-100 text-amber-800" },
                  { label: "THREATS (CONCEPTUAL)", items: active.competitive.threats, cls: "bg-red-50 border-red-100 text-red-700" },
                  { label: "OPPORTUNITIES (CONCEPTUAL)", items: active.competitive.opportunities, cls: "bg-purple-50 border-purple-100 text-purple-800" },
                ].map(({ label, items, cls }) => (
                  <div key={label}>
                    <p className="font-semibold text-muted-foreground mb-1.5">{label}</p>
                    <div className={`border rounded-xl p-3 space-y-1 ${cls}`}>
                      {items.map(item => <p key={item} className="pl-2 border-l-2 border-current/20">{item}</p>)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Revenue */}
            {activeTab === "revenue" && (
              <div className="space-y-4 text-[11px]">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="font-semibold text-blue-800 mb-1">PRIORITIZATION</p>
                  <p className="text-blue-700">{active.revenueModel.prioritization}</p>
                </div>
                <div className="space-y-2">
                  {active.revenueModel.streams.map(s => (
                    <div key={s.name} className="border border-border rounded-xl p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{s.name}</span>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-muted rounded-full text-muted-foreground">{s.type}</span>
                        <span className="text-[9px] text-blue-600 ml-auto">{s.stage}</span>
                      </div>
                      <p className="text-muted-foreground">{s.description}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground mb-1.5">ASSUMPTIONS (CONCEPTUAL)</p>
                  <div className="space-y-1">
                    {active.revenueModel.assumptions.map((a, i) => <p key={i} className="text-muted-foreground pl-2 border-l-2 border-blue-100">{a}</p>)}
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-amber-800 font-semibold">⚠️ {active.revenueModel.disclaimer}</p>
                </div>
              </div>
            )}

            {/* Risks */}
            {activeTab === "risks" && (
              <div className="space-y-2">
                {active.risks.map((r, i) => (
                  <div key={i} className={`border rounded-xl p-3 text-[11px] space-y-1 ${r.level === "High" ? "border-red-200 bg-red-50" : r.level === "Medium" ? "border-amber-200 bg-amber-50" : "border-border bg-white"}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${r.level === "High" ? "bg-red-100 text-red-700" : r.level === "Medium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{r.level.toUpperCase()}</span>
                      <p className="text-foreground font-semibold flex-1">{r.description}</p>
                    </div>
                    <p className="text-muted-foreground pl-2 border-l-2 border-current/20"><span className="font-semibold">Mitigation:</span> {r.mitigation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Quick wins + long bets */}
            {activeTab === "quick" && (
              <div className="space-y-4 text-[11px]">
                <div>
                  <p className="font-semibold text-muted-foreground mb-2">⚡ QUICK WINS (First 60 Days)</p>
                  <div className="space-y-1.5">
                    {active.quickWins.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                        <span className="text-green-600 font-bold mt-0.5">{i + 1}.</span>
                        <p className="text-green-800">{w}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground mb-2">🎯 LONG BETS (12–36 Months)</p>
                  <div className="space-y-1.5">
                    {active.longBets.map((b, i) => (
                      <div key={i} className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                        <span className="text-blue-600 font-bold mt-0.5">{i + 1}.</span>
                        <p className="text-blue-800">{b}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-muted/20 border border-border rounded-xl p-3">
                  <p className="font-semibold text-foreground mb-1">RECOMMENDATION</p>
                  <p className="text-muted-foreground">{active.recommendation}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-amber-800 font-semibold text-[11px]">⚠️ {active.disclaimer}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Universal App ───────────────────────────────────────────────────
export function UniversalApp() {
  const { state, setView } = useInteraction();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const screens: Record<string, React.ReactNode> = {
    home:        <HomeScreen />,
    talk:        <TalkScreen />,
    dashboard:   <DashboardScreen />,
    industries:  <IndustriesScreen />,
    workflows:   <WorkflowsScreen />,
    creative:    <CreativeScreen />,
    games:       <GamesScreen />,
    story:       <StoryScreen />,
    connection:  <ConnectionScreen />,
    strategy:    <StrategyScreen />,
    roles:       <RolesScreen />,
    agencies:    <AgenciesScreen />,
    states:      <StatesScreen />,
    vendors:     <VendorsScreen />,
    programs:    <ProgramsScreen />,
    packets:     <PacketsScreen />,
    submissions: <SubmissionsScreen />,
    settings:    <SettingsScreen />,
  };

  const currentNav = NAV_ITEMS.find(n => n.id === state.currentView) ?? NAV_ITEMS[0];

  return (
    <div className="flex h-full w-full bg-[#F2F2F7] overflow-hidden">

      {/* ── Sidebar nav (desktop) ── */}
      <div className="hidden md:flex flex-col w-44 bg-white border-r border-border py-3 gap-0.5 flex-shrink-0">
        <p className="text-[9px] font-bold uppercase text-muted-foreground px-3 mb-1 tracking-widest">Universal Hub</p>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setView(item.id)}
            className={`flex items-center gap-2.5 px-3 py-2 mx-1 rounded-xl text-[12px] font-medium transition-all text-left
              ${state.currentView === item.id
                ? "bg-blue-500 text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <div className="mt-auto px-3 pb-2">
          <p className="text-[9px] text-muted-foreground">Internal Demo Only</p>
          <div className="w-2 h-2 rounded-full bg-green-400 inline-block mr-1" />
          <span className="text-[9px] text-green-600">All engines active</span>
        </div>
      </div>

      {/* ── Mobile nav ── */}
      {mobileNavOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 z-50 w-44 bg-white border-r border-border py-3 flex flex-col gap-0.5">
            <p className="text-[9px] font-bold uppercase text-muted-foreground px-3 mb-1">Universal Hub</p>
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => { setView(item.id); setMobileNavOpen(false); }}
                className={`flex items-center gap-2.5 px-3 py-2 mx-1 rounded-xl text-[12px] font-medium transition-all text-left
                  ${state.currentView === item.id ? "bg-blue-500 text-white" : "text-muted-foreground hover:bg-muted"}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
          <button className="md:hidden text-lg" onClick={() => setMobileNavOpen(true)}>☰</button>
          <div>
            <p className="text-[14px] font-bold text-foreground">{currentNav.icon} {currentNav.label}</p>
            <p className="text-[10px] text-muted-foreground">
              {state.currentRole} · {state.currentState} · {state.currentAgency} · {state.actionLog.length} actions
            </p>
          </div>
        </div>

        {/* Screen */}
        <div className="flex-1 overflow-y-auto p-4">
          {screens[state.currentView]}
        </div>
      </div>
    </div>
  );
}
