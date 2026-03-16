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

// ─── Nav definition ───────────────────────────────────────────────────────
const NAV_ITEMS: { id: UniversalView; label: string; icon: string }[] = [
  { id: "home",        label: "Home",             icon: "🏠" },
  { id: "talk",        label: "Talk / Test",       icon: "🧠" },
  { id: "dashboard",   label: "Dashboard",        icon: "📊" },
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

// ─── Main Universal App ───────────────────────────────────────────────────
export function UniversalApp() {
  const { state, setView } = useInteraction();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const screens: Record<string, React.ReactNode> = {
    home:        <HomeScreen />,
    talk:        <TalkScreen />,
    dashboard:   <DashboardScreen />,
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
