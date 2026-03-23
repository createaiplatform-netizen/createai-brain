/**
 * AboveTranscendPage — Platform Intelligence
 * Real-time view of actual platform data: customers, projects, health, activity.
 * Zero simulated numbers. All data is live from the database and APIs.
 */

import React, { useEffect, useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";

const SAGE   = "#7a9068";
const CREAM  = "#faf9f6";
const TEXT   = "#1a1916";
const MUTED  = "#6b6660";
const BORDER = "rgba(122,144,104,0.13)";
const GREEN  = "#22c55e";
const RED    = "#ef4444";
const AMBER  = "#f59e0b";

interface SystemStats {
  projects:   number;
  documents:  number;
  people:     number;
  engineRuns: number;
}

interface CustomerStats {
  totalCustomers:         number;
  totalRevenueCents:      number;
  totalViews:             number;
  emailSequencesSent:     number;
  emailSequencesScheduled: number;
  checkoutConversionEstimate: string;
}

interface ActivityItem {
  id:        number;
  label:     string;
  icon:      string;
  createdAt: string;
}

interface AdminStatus {
  status?:         string;
  users?:          number;
  projects?:       number;
  auditEntries?:   number;
  analyticsEvents?: number;
}

function fmtCents(cents: number): string {
  if (cents >= 100_000_00)  return `$${(cents / 100_000_00).toFixed(2)}M`;
  if (cents >= 1_000_00)    return `$${(cents / 100_00).toFixed(1)}K`;
  return `$${(cents / 100).toFixed(2)}`;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function StatCard({
  label, value, sub, color = SAGE,
}: { label: string; value: string | number | null | undefined; sub?: string; color?: string }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      padding: "20px 22px",
      border: `1px solid ${BORDER}`,
      boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: "-1px", marginBottom: sub ? 4 : 0 }}>
        {value === null || value === undefined || value === "" ? "—" : value}
      </p>
      {sub && <p style={{ fontSize: 12, color: MUTED }}>{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: TEXT, letterSpacing: "-0.4px", margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

export default function AboveTranscendPage() {
  const { user } = useAuth();

  const [sysStats,    setSysStats]    = useState<SystemStats | null>(null);
  const [custStats,   setCustStats]   = useState<CustomerStats | null>(null);
  const [activity,    setActivity]    = useState<ActivityItem[]>([]);
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
  const [apiOk,       setApiOk]       = useState<boolean | null>(null);
  const [loading,     setLoading]     = useState(true);
  

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : (user?.email?.split("@")[0] ?? "");

  useEffect(() => {
    const go = async () => {
      await Promise.allSettled([
        fetch("/api/system/stats", { credentials: "include" })
          .then(r => { setApiOk(r.ok); return r.ok ? r.json() : null; })
          .then((d: (SystemStats & { ok: boolean }) | null) => { if (d?.ok) setSysStats(d); })
          .catch(() => setApiOk(false)),

        fetch("/api/semantic/analytics", { credentials: "include" })
          .then(r => r.ok ? r.json() : null)
          .then((d: { ok: boolean; summary: CustomerStats } | null) => { if (d?.ok && d.summary) setCustStats(d.summary); }),

        fetch("/api/activity?limit=8", { credentials: "include" })
          .then(r => r.ok ? r.json() : { activity: [] })
          .then((d: { activity: ActivityItem[] }) => setActivity(d.activity ?? [])),

        fetch("/api/admin/status", { credentials: "include" })
          .then(r => r.ok ? r.json() : null)
          .then((d: AdminStatus | null) => { if (d) setAdminStatus(d); }),
      ]);
      setLoading(false);
    };
    void go();
  }, []);

  const statusColor = apiOk === null ? AMBER : apiOk ? GREEN : RED;
  const statusLabel = apiOk === null ? "Checking…" : apiOk ? "All systems operational" : "API degraded";

  const noData = !sysStats && !custStats && !adminStatus && activity.length === 0;

  return (
    <div style={{ background: CREAM, minHeight: "100vh", padding: "32px 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: `linear-gradient(135deg, ${SAGE} 0%, #5a7a58 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>📊</div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: TEXT, letterSpacing: "-0.75px", margin: 0 }}>
                Platform Intelligence
              </h1>
              <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
                {displayName ? `Logged in as ${displayName} · ` : ""}
                {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#fff", border: `1px solid ${BORDER}`,
            borderRadius: 100, padding: "6px 14px",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{statusLabel}</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: MUTED, fontSize: 14 }}>
            Loading platform data…
          </div>
        ) : noData ? (
          <div style={{
            background: "#fff", borderRadius: 14, padding: "48px",
            border: `1px solid ${BORDER}`, textAlign: "center",
          }}>
            <p style={{ fontSize: 36, marginBottom: 16 }}>📊</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 8 }}>No platform data yet</p>
            <p style={{ fontSize: 14, color: MUTED, maxWidth: 360, margin: "0 auto" }}>
              Stats will appear here as customers sign up and projects are created.
            </p>
          </div>
        ) : (
          <>
            {/* Customer & Revenue */}
            {custStats && (
              <div style={{ marginBottom: 32 }}>
                <SectionHeader title="Customers & Revenue" sub="Live from Stripe payments and database records" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
                  <StatCard
                    label="Total Customers"
                    value={custStats.totalCustomers}
                    color={SAGE}
                  />
                  <StatCard
                    label="Total Revenue"
                    value={fmtCents(custStats.totalRevenueCents)}
                    color="#4a6a58"
                  />
                  <StatCard
                    label="Emails Sent"
                    value={custStats.emailSequencesSent}
                    sub={`of ${custStats.emailSequencesScheduled} scheduled`}
                    color={SAGE}
                  />
                </div>
              </div>
            )}

            {/* Platform Content */}
            {sysStats && (
              <div style={{ marginBottom: 32 }}>
                <SectionHeader title="Platform Content" sub="Created by all accounts across the platform" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
                  <StatCard label="Projects"       value={sysStats.projects}   />
                  <StatCard label="Documents"      value={sysStats.documents}  />
                  <StatCard label="People Records" value={sysStats.people}     />
                  <StatCard label="AI Engine Runs" value={sysStats.engineRuns} sub="Generation calls to date" />
                </div>
              </div>
            )}

            {/* Admin Overview */}
            {adminStatus && (adminStatus.users || adminStatus.auditEntries || adminStatus.analyticsEvents) && (
              <div style={{ marginBottom: 32 }}>
                <SectionHeader title="Admin Overview" sub="Platform-wide user and event summary" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
                  {adminStatus.users != null && (
                    <StatCard label="Registered Users"  value={adminStatus.users} />
                  )}
                  {adminStatus.auditEntries != null && (
                    <StatCard label="Audit Log Entries" value={adminStatus.auditEntries} sub="Security and action logs" />
                  )}
                  {adminStatus.analyticsEvents != null && (
                    <StatCard label="Analytics Events"  value={adminStatus.analyticsEvents} sub="User interactions tracked" />
                  )}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div style={{ marginBottom: 32 }}>
              <SectionHeader title="Recent Activity" sub="Last 8 platform actions" />
              {activity.length === 0 ? (
                <div style={{
                  background: "#fff", borderRadius: 14, padding: "28px",
                  border: `1px solid ${BORDER}`, textAlign: "center",
                  color: MUTED, fontSize: 14,
                }}>
                  No recent activity. Open any app to get started.
                </div>
              ) : (
                <div style={{
                  background: "#fff", borderRadius: 14,
                  border: `1px solid ${BORDER}`,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.04)", overflow: "hidden",
                }}>
                  {activity.map((a, i) => (
                    <div key={a.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 18px",
                      borderBottom: i < activity.length - 1 ? `1px solid ${BORDER}` : "none",
                    }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{a.icon}</span>
                      <span style={{ flex: 1, fontSize: 13, color: TEXT, fontWeight: 500 }}>{a.label}</span>
                      <span style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{timeAgo(a.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p style={{ fontSize: 11, color: MUTED, textAlign: "center", marginTop: 8 }}>
              All values are live from the database. No simulated or projected numbers.
              Refreshed at {new Date().toLocaleTimeString()}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
