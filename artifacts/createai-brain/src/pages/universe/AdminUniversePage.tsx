// ─── Admin Universe ───────────────────────────────────────────────────────────
// Full platform control center for admin/founder roles.
// Real data only — no simulated metrics.

import { useState, useEffect, useCallback } from "react";

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.13)";

const VALID_ROLES = ["admin", "user", "viewer", "family_adult", "family_child", "customer"];

const ROLE_BADGE: Record<string, { color: string; bg: string; label: string }> = {
  founder:       { label: "Founder",       color: "#7a9068", bg: "rgba(122,144,104,0.14)" },
  admin:         { label: "Admin",         color: "#6a8db5", bg: "rgba(106,141,181,0.14)" },
  user:          { label: "User",          color: "#1a1916", bg: "rgba(26,25,22,0.08)"    },
  viewer:        { label: "Viewer",        color: "#6b6660", bg: "rgba(107,102,96,0.12)"  },
  family_adult:  { label: "Family Adult",  color: "#9a7ab5", bg: "rgba(154,122,181,0.12)" },
  family_child:  { label: "Family Child",  color: "#e8826a", bg: "rgba(232,130,106,0.12)" },
  customer:      { label: "Customer",      color: "#6aab8a", bg: "rgba(106,171,138,0.12)" },
};

type Tab = "overview" | "users" | "devices" | "audit";

interface UserRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  nda_signed: boolean;
  created_at: string;
  device_count: number;
  last_active: string | null;
  has_phone_verified: boolean;
}

interface DeviceRow {
  id: number;
  device_name: string;
  has_biometric: boolean;
  phone_verified: boolean;
  last_used_at: string | null;
  created_at: string;
}

export default function AdminUniversePage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDevices, setUserDevices] = useState<DeviceRow[]>([]);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // ── Audit Log State ──────────────────────────────────────────────────────────
  const [auditEvents, setAuditEvents] = useState<{ id: string; event_type: string; actor_email: string | null; actor_first_name: string | null; details: Record<string, unknown>; target_type: string | null; created_at: string }[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditType, setAuditType] = useState("");

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (auditType) params.set("type", auditType);
      const res = await fetch(`/api/audit/events?${params}`, { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as { events: typeof auditEvents; total: number };
        setAuditEvents(data.events);
        setAuditTotal(data.total);
      }
    } finally {
      setAuditLoading(false);
    }
  }, [auditType]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/user-admin/users", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as { users: UserRow[] };
        setUsers(data.users);
      }
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadDevicesForUser(userId: string) {
    const res = await fetch(`/api/user-admin/users/${userId}/devices`, { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as { devices: DeviceRow[] };
      setUserDevices(data.devices);
    }
  }

  useEffect(() => {
    if (tab === "users" || tab === "overview") void loadUsers();
    if (tab === "audit") void loadAudit();
  }, [tab, loadAudit]);

  useEffect(() => {
    if (selectedUserId) void loadDevicesForUser(selectedUserId);
  }, [selectedUserId]);

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingRole(userId);
    try {
      await fetch(`/api/user-admin/users/${userId}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      await loadUsers();
    } finally {
      setUpdatingRole(null);
    }
  }

  async function handleSuspend(userId: string) {
    if (!confirm("Suspend this user?")) return;
    await fetch(`/api/user-admin/users/${userId}/suspend`, { method: "POST", credentials: "include" });
    await loadUsers();
  }

  async function handleRemoveAllDevices(userId: string) {
    if (!confirm("Remove all trusted devices for this user? They'll need to re-verify their phone.")) return;
    await fetch(`/api/user-admin/users/${userId}/devices`, { method: "DELETE", credentials: "include" });
    setUserDevices([]);
  }

  // Role distribution for overview
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  const ndaSigned = users.filter(u => u.nda_signed).length;
  const phoneVerified = users.filter(u => u.has_phone_verified).length;

  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${SAGE}18` }}
          >
            🛡️
          </div>
          <div>
            <h1 className="text-[22px] font-black" style={{ color: TEXT }}>Admin Universe</h1>
            <p className="text-[12px]" style={{ color: MUTED }}>CreateAI Brain · Platform Control</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 flex gap-1 mb-6 overflow-x-auto scrollbar-hide">
        {([
          { key: "overview", label: "Overview" },
          { key: "users",    label: "Users" },
          { key: "devices",  label: "Devices" },
          { key: "audit",    label: "Audit Log" },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all"
            style={{
              background: tab === t.key ? SAGE : "transparent",
              color: tab === t.key ? "white" : MUTED,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-6 pb-10">
        {/* ── Overview Tab ── */}
        {tab === "overview" && (
          <div className="flex flex-col gap-4">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Members", value: users.length, icon: "👥" },
                { label: "NDA Signed",    value: ndaSigned,    icon: "✍️" },
                { label: "Phone Verified",value: phoneVerified, icon: "📱" },
                { label: "Active Roles",  value: Object.keys(roleCounts).length, icon: "🎭" },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="p-4 rounded-2xl"
                  style={{ background: "white", border: `1px solid ${BORDER}` }}
                >
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-[24px] font-black" style={{ color: TEXT }}>{stat.value}</div>
                  <div className="text-[11px] font-semibold" style={{ color: MUTED }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Role breakdown */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "white", border: `1px solid ${BORDER}` }}
            >
              <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT }}>Role breakdown</h3>
              <div className="flex flex-col gap-2">
                {Object.entries(roleCounts).map(([role, count]) => {
                  const info = ROLE_BADGE[role] ?? { label: role, color: MUTED, bg: "transparent" };
                  return (
                    <div key={role} className="flex items-center justify-between">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ color: info.color, background: info.bg }}
                      >
                        {info.label}
                      </span>
                      <span className="text-[13px] font-bold" style={{ color: TEXT }}>{count}</span>
                    </div>
                  );
                })}
                {Object.keys(roleCounts).length === 0 && (
                  <p className="text-[12px]" style={{ color: MUTED }}>No users yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Users Tab ── */}
        {tab === "users" && (
          <div className="flex flex-col gap-2">
            {loadingUsers && (
              <div className="py-8 text-center text-[13px]" style={{ color: MUTED }}>Loading…</div>
            )}
            {!loadingUsers && users.map(user => {
              const badge = ROLE_BADGE[user.role] ?? { label: user.role, color: MUTED, bg: "transparent" };
              return (
                <div
                  key={user.id}
                  className="p-4 rounded-2xl"
                  style={{ background: "white", border: `1px solid ${BORDER}` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-bold truncate" style={{ color: TEXT }}>
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : (user.email ?? user.id)
                          }
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                          style={{ color: badge.color, background: badge.bg }}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: MUTED }}>
                        {user.email ?? user.id}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {user.nda_signed && (
                          <span className="text-[10px] font-semibold" style={{ color: SAGE }}>✓ NDA</span>
                        )}
                        {user.has_phone_verified && (
                          <span className="text-[10px] font-semibold" style={{ color: SAGE }}>📱 Verified</span>
                        )}
                        {user.device_count > 0 && (
                          <span className="text-[10px]" style={{ color: MUTED }}>
                            {user.device_count} device{user.device_count !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {user.role !== "founder" && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={user.role}
                          disabled={updatingRole === user.id}
                          onChange={e => handleRoleChange(user.id, e.target.value)}
                          className="text-[11px] px-2 py-1.5 rounded-lg outline-none font-semibold"
                          style={{ background: CREAM, border: `1px solid ${BORDER}`, color: MUTED }}
                        >
                          {VALID_ROLES.map(r => (
                            <option key={r} value={r}>{r.replace("_", " ")}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleSuspend(user.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px]"
                          style={{ background: "rgba(197,48,48,0.08)", color: "#c53030" }}
                          title="Suspend user"
                        >
                          ⊘
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {!loadingUsers && users.length === 0 && (
              <p className="text-[13px] text-center py-8" style={{ color: MUTED }}>No users found</p>
            )}
          </div>
        )}

        {/* ── Devices Tab ── */}
        {tab === "devices" && (
          <div className="flex flex-col gap-4">
            {/* User picker */}
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: MUTED }}>
                Select a user to view their devices
              </label>
              <select
                value={selectedUserId ?? ""}
                onChange={e => setSelectedUserId(e.target.value || null)}
                className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                style={{ background: "white", border: `1.5px solid ${BORDER}`, color: TEXT }}
              >
                <option value="">Choose user…</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.first_name && u.last_name
                      ? `${u.first_name} ${u.last_name} (${u.email ?? u.id})`
                      : (u.email ?? u.id)
                    }
                  </option>
                ))}
              </select>
            </div>

            {selectedUserId && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[14px] font-bold" style={{ color: TEXT }}>
                    {userDevices.length} trusted device{userDevices.length !== 1 ? "s" : ""}
                  </h3>
                  {userDevices.length > 0 && (
                    <button
                      onClick={() => handleRemoveAllDevices(selectedUserId)}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(197,48,48,0.08)", color: "#c53030" }}
                    >
                      Remove all
                    </button>
                  )}
                </div>
                {userDevices.map(d => (
                  <div
                    key={d.id}
                    className="p-4 rounded-2xl flex items-center justify-between gap-3"
                    style={{ background: "white", border: `1px solid ${BORDER}` }}
                  >
                    <div>
                      <p className="text-[14px] font-bold" style={{ color: TEXT }}>{d.device_name}</p>
                      <div className="flex gap-3 mt-0.5">
                        {d.has_biometric && (
                          <span className="text-[10px] font-semibold" style={{ color: SAGE }}>🔐 Biometric</span>
                        )}
                        {d.phone_verified && (
                          <span className="text-[10px] font-semibold" style={{ color: SAGE }}>📱 Phone verified</span>
                        )}
                        {d.last_used_at && (
                          <span className="text-[10px]" style={{ color: MUTED }}>
                            Last used: {new Date(d.last_used_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {userDevices.length === 0 && (
                  <p className="text-[13px] text-center py-6" style={{ color: MUTED }}>No trusted devices for this user</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Audit Log Tab ── */}
        {tab === "audit" && (
          <div className="flex flex-col gap-4">
            <div className="p-3 rounded-xl text-[11px] leading-snug"
              style={{ background: `${SAGE}08`, border: `1px solid ${SAGE}18`, color: MUTED }}>
              🔒 <strong>Safety, not surveillance.</strong> Only key platform events are logged.
              This view is admin-only and is used for debugging and security review.
            </div>

            {/* Filter + refresh */}
            <div className="flex items-center gap-2">
              <select
                value={auditType}
                onChange={e => setAuditType(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                style={{ background: "white", border: `1px solid ${BORDER}`, color: TEXT }}
              >
                <option value="">All events</option>
                {["login","logout","device_trusted","device_removed","biometric_registered","phone_verified",
                  "role_changed","user_suspended","user_restored","payment_approved","payment_triggered",
                  "bill_created","bill_approved","bill_paid","bank_transaction","nda_signed","admin_action"].map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
              <button
                onClick={() => void loadAudit()}
                className="px-4 py-2 rounded-xl text-[13px] font-bold text-white"
                style={{ background: SAGE }}
              >
                Refresh
              </button>
            </div>

            <p className="text-[11px]" style={{ color: MUTED }}>
              Showing up to 50 of {auditTotal} events
            </p>

            {auditLoading && (
              <p className="text-[13px] text-center py-6" style={{ color: MUTED }}>Loading…</p>
            )}

            {!auditLoading && auditEvents.length === 0 && (
              <div className="py-8 text-center">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-[14px] font-semibold" style={{ color: TEXT }}>No events yet</p>
                <p className="text-[12px] mt-1" style={{ color: MUTED }}>Key platform actions will appear here as they happen</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {auditEvents.map(ev => {
                const typeColors: Record<string, string> = {
                  login: "#4a7a5a", logout: "#6b6660",
                  device_trusted: "#6a8db5", device_removed: "#c53030", biometric_registered: "#6a8db5",
                  role_changed: "#9a7ab5", user_suspended: "#c53030", user_restored: "#4a7a5a",
                  payment_approved: SAGE, payment_triggered: SAGE,
                  bill_created: "#6aab8a", bill_approved: "#4a7a5a", bill_paid: "#4a7a5a",
                  admin_action: "#c4a97a", nda_signed: "#6a8db5",
                };
                const color = typeColors[ev.event_type] ?? MUTED;
                return (
                  <div key={ev.id} className="px-4 py-3 rounded-2xl"
                    style={{ background: "white", border: `1px solid ${BORDER}` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: `${color}15`, color }}>
                            {ev.event_type.replace(/_/g, " ")}
                          </span>
                          {ev.target_type && (
                            <span className="text-[10px]" style={{ color: MUTED }}>→ {ev.target_type}</span>
                          )}
                        </div>
                        <p className="text-[12px] mt-1" style={{ color: MUTED }}>
                          by <span style={{ color: TEXT, fontWeight: 600 }}>{ev.actor_first_name ?? ev.actor_email ?? ev.event_type}</span>
                        </p>
                        {Object.keys(ev.details ?? {}).length > 0 && (
                          <p className="text-[11px] mt-0.5 font-mono truncate" style={{ color: MUTED }}>
                            {JSON.stringify(ev.details)}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] flex-shrink-0" style={{ color: MUTED }}>
                        {new Date(ev.created_at).toLocaleString("en-US", {
                          month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
