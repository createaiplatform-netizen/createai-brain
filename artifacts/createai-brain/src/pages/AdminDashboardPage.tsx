import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

// ─── Analytics types ──────────────────────────────────────────────────────────
interface RoleCount { role: string; dau?: number; mau?: number; total?: number }
interface SignupCohort { week: string; signups: number }
interface CohortData { dau: RoleCount[]; mau: RoleCount[]; totals: RoleCount[]; signupCohorts?: SignupCohort[] }
interface ChurnTiers { high: number; medium: number; low: number }
interface ChurnData  { tiers: ChurnTiers; users: Array<{ userId: string; email: string; role: string; daysSinceActive: number; risk: string }> }
interface RevenueData { mrr_dollars: string; total_dollars: string; ltv_dollars: string; arr_dollars: string; active_subscriptions: number; payment_count: number }
interface EvalIssue { metric: string; value: string | number; benchmark: string; suggestion: string }
interface EvalBenchmark { label: string; platform: string | number; unit?: string; industry: string; status: "below" | "meeting" | "exceeding" }
interface EvalData { benchmarks: Record<string, EvalBenchmark>; issues: EvalIssue[]; system: { totalUsers: number; totalDAU: number; totalMAU: number; engagementRatePct: number; evaluatedAt: string } }

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.15)";

const ADMIN_SECTIONS = [
  {
    icon: "🧠",
    label: "Full OS Platform",
    description: "Access every app, tool, and workspace",
    path: "/",
    color: SAGE,
  },
  {
    icon: "📊",
    label: "Metrics",
    description: "Live platform data and performance",
    path: "/metrics",
    color: "#5a7a68",
  },
  {
    icon: "🌍",
    label: "Global Expansion",
    description: "Manage markets, reach, and growth",
    path: "/global-expansion",
    color: "#8a7060",
  },
  {
    icon: "⚡",
    label: "Platform Status",
    description: "Health, uptime, and service monitor",
    path: "/platform-status",
    color: "#6b7a5a",
  },
  {
    icon: "👥",
    label: "Team",
    description: "People, roles, and access management",
    path: "/team",
    color: "#7a6858",
  },
  {
    icon: "📈",
    label: "Analytics",
    description: "Usage, behavior, and insights",
    path: "/analytics",
    color: "#5a6878",
  },
];

interface TopApp {
  appId:  string;
  label:  string;
  icon:   string;
  opens:  number;
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [topApps,       setTopApps]       = useState<TopApp[]>([]);
  const [appsLoaded,    setAppsLoaded]    = useState(false);
  const [cohortData,    setCohortData]    = useState<CohortData | null>(null);
  const [churnData,     setChurnData]     = useState<ChurnData | null>(null);
  const [revenueData,   setRevenueData]   = useState<RevenueData | null>(null);
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);
  const [evalData,      setEvalData]      = useState<EvalData | null>(null);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : (user?.email?.split("@")[0] ?? "Admin");

  useEffect(() => {
    fetch("/api/app-usage/top?limit=6", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((data: { topApps?: TopApp[] } | null) => {
        if (data?.topApps?.length) setTopApps(data.topApps);
      })
      .catch(() => {})
      .finally(() => setAppsLoaded(true));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/cohorts/dau-mau",   { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/cohorts/churn-risk", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/cohorts/revenue",    { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/evaluate/self",      { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([cohort, churn, revenue, evalResult]) => {
      if (cohort)      setCohortData(cohort);
      if (churn)       setChurnData(churn);
      if (revenue)     setRevenueData(revenue);
      if (evalResult)  setEvalData(evalResult);
    }).finally(() => setAnalyticsLoaded(true));
  }, []);

  const maxOpens = topApps.length > 0 ? Math.max(...topApps.map(a => a.opens)) : 1;

  return (
    <div
      className="min-h-screen"
      style={{ background: CREAM, color: TEXT }}
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(250,249,246,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{ background: SAGE }}
          >
            🧠
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: TEXT }}>
              CreateAI Brain
            </p>
            <p className="text-[11px]" style={{ color: MUTED }}>
              Admin Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-[12px] px-3 py-1 rounded-full font-medium"
            style={{ background: `${SAGE}18`, color: SAGE }}
          >
            Admin
          </span>
          <button
            onClick={logout}
            className="text-[12px] px-3 py-1.5 rounded-lg font-medium transition-all"
            style={{ background: "rgba(0,0,0,0.05)", color: MUTED }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Welcome */}
        <div>
          <h1 className="text-[26px] font-black tracking-tight" style={{ color: TEXT }}>
            Welcome back, {displayName}
          </h1>
          <p className="text-[14px] mt-1" style={{ color: MUTED }}>
            You have full platform access. Where do you want to go?
          </p>
        </div>

        {/* Quick access cards */}
        <div className="flex flex-col gap-3">
          {ADMIN_SECTIONS.map(({ icon, label, description, path, color }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.99]"
              style={{
                background: "white",
                border: `1px solid ${BORDER}`,
                boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${color}40`;
                e.currentTarget.style.boxShadow = `0 4px 16px ${color}14`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = BORDER;
                e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)";
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${color}14` }}
              >
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold" style={{ color: TEXT }}>
                  {label}
                </p>
                <p className="text-[12px] mt-0.5 truncate" style={{ color: MUTED }}>
                  {description}
                </p>
              </div>
              <span style={{ color: MUTED, fontSize: 16 }}>›</span>
            </button>
          ))}
        </div>

        {/* ── Usage Analytics ───────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${BORDER}`, background: "white" }}
        >
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${BORDER}` }}
          >
            <div>
              <p className="text-[14px] font-bold" style={{ color: TEXT }}>
                Top Apps by Opens
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                Real usage across all platform users
              </p>
            </div>
            <button
              onClick={() => navigate("/metrics")}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: `${SAGE}12`, color: SAGE }}
            >
              Full metrics →
            </button>
          </div>

          <div className="p-5">
            {!appsLoaded && (
              <div className="flex items-center gap-2" style={{ color: MUTED }}>
                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span className="text-[12px]">Loading usage data…</span>
              </div>
            )}

            {appsLoaded && topApps.length === 0 && (
              <div className="text-center py-6">
                <p className="text-[13px]" style={{ color: MUTED }}>
                  No usage data yet — opens will appear here as apps are used.
                </p>
              </div>
            )}

            {appsLoaded && topApps.length > 0 && (
              <div className="flex flex-col gap-3">
                {topApps.map((app, i) => {
                  const pct = maxOpens > 0 ? Math.round((app.opens / maxOpens) * 100) : 0;
                  return (
                    <div key={app.appId} className="flex items-center gap-3">
                      <span className="text-[13px] w-5 text-center flex-shrink-0" style={{ color: MUTED }}>
                        {i + 1}
                      </span>
                      <span className="text-[18px] w-6 flex-shrink-0">{app.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-semibold truncate" style={{ color: TEXT }}>
                            {app.label}
                          </span>
                          <span className="text-[11px] ml-2 flex-shrink-0" style={{ color: MUTED }}>
                            {app.opens} {app.opens === 1 ? "open" : "opens"}
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: `${SAGE}18` }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              background: i === 0
                                ? SAGE
                                : i === 1
                                  ? "#5a7a68"
                                  : "#8aad78",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Platform Cohorts ─────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${BORDER}`, background: "white" }}
        >
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div>
              <p className="text-[14px] font-bold" style={{ color: TEXT }}>Platform Cohorts</p>
              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Daily &amp; monthly active users by role</p>
            </div>
            <span className="text-[18px]">👥</span>
          </div>
          <div className="p-5">
            {!analyticsLoaded && (
              <div className="flex items-center gap-2" style={{ color: MUTED }}>
                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span className="text-[12px]">Loading cohort data…</span>
              </div>
            )}
            {analyticsLoaded && !cohortData && (
              <p className="text-[13px] text-center py-4" style={{ color: MUTED }}>No activity data yet.</p>
            )}
            {analyticsLoaded && cohortData && (
              <div className="flex flex-col gap-2">
                {/* Header row */}
                <div className="grid grid-cols-4 gap-2 pb-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Role", "DAU", "MAU", "Total"].map(h => (
                    <span key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>{h}</span>
                  ))}
                </div>
                {/* Role rows — merge dau/mau/totals by role */}
                {(cohortData.totals.length > 0 ? cohortData.totals : [{ role: "—" }]).map(tr => {
                  const dauRow = cohortData.dau.find(d => d.role === tr.role);
                  const mauRow = cohortData.mau.find(m => m.role === tr.role);
                  return (
                    <div key={tr.role} className="grid grid-cols-4 gap-2 py-1.5">
                      <span className="text-[12px] font-semibold capitalize" style={{ color: TEXT }}>{tr.role}</span>
                      <span className="text-[12px] font-bold" style={{ color: SAGE }}>{dauRow?.dau ?? 0}</span>
                      <span className="text-[12px] font-bold" style={{ color: "#5a7a68" }}>{mauRow?.mau ?? 0}</span>
                      <span className="text-[12px]" style={{ color: MUTED }}>{tr.total ?? 0}</span>
                    </div>
                  );
                })}
                {cohortData.signupCohorts && cohortData.signupCohorts.length > 0 && (
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: MUTED }}>Signups last 30 days</p>
                    <div className="flex gap-2 flex-wrap">
                      {cohortData.signupCohorts.map((c) => (
                        <div key={c.week} className="flex flex-col items-center px-3 py-2 rounded-lg" style={{ background: `${SAGE}10` }}>
                          <span className="text-[13px] font-bold" style={{ color: SAGE }}>{c.signups}</span>
                          <span className="text-[10px]" style={{ color: MUTED }}>wk {c.week.slice(5)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Churn Risk ───────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${BORDER}`, background: "white" }}
        >
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div>
              <p className="text-[14px] font-bold" style={{ color: TEXT }}>Churn Risk</p>
              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Rule-based inactivity scoring</p>
            </div>
            <span className="text-[18px]">⚠️</span>
          </div>
          <div className="p-5">
            {!analyticsLoaded && (
              <div className="flex items-center gap-2" style={{ color: MUTED }}>
                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span className="text-[12px]">Computing churn risk…</span>
              </div>
            )}
            {analyticsLoaded && !churnData && (
              <p className="text-[13px] text-center py-4" style={{ color: MUTED }}>No user data yet.</p>
            )}
            {analyticsLoaded && churnData && (
              <div className="flex flex-col gap-4">
                {/* Risk tier summary */}
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { key: "high",   label: "High Risk",   color: "#ef4444", bg: "#fef2f2", desc: "30+ days inactive" },
                    { key: "medium", label: "Medium Risk",  color: "#f59e0b", bg: "#fffbeb", desc: "7–30 days inactive" },
                    { key: "low",    label: "Low Risk",     color: SAGE,      bg: `${SAGE}10`, desc: "Active within 7d" },
                  ] as const).map(tier => (
                    <div key={tier.key} className="flex flex-col items-center p-3 rounded-xl" style={{ background: tier.bg }}>
                      <span className="text-[22px] font-black" style={{ color: tier.color }}>
                        {churnData.tiers[tier.key]}
                      </span>
                      <span className="text-[11px] font-semibold mt-0.5" style={{ color: tier.color }}>{tier.label}</span>
                      <span className="text-[10px] mt-0.5" style={{ color: MUTED }}>{tier.desc}</span>
                    </div>
                  ))}
                </div>
                {/* High-risk user list (max 5) */}
                {churnData.tiers.high > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: MUTED }}>
                      High-risk users
                    </p>
                    <div className="flex flex-col gap-1">
                      {churnData.users
                        .filter((u: { risk: string }) => u.risk === "high")
                        .slice(0, 5)
                        .map((u: { userId: string; email: string; role: string; daysSinceActive: number }) => (
                          <div key={u.userId} className="flex items-center justify-between py-1.5 px-3 rounded-lg" style={{ background: "#fef2f2" }}>
                            <span className="text-[12px] truncate flex-1" style={{ color: TEXT }}>{u.email}</span>
                            <span className="text-[11px] ml-2 flex-shrink-0 font-medium" style={{ color: "#ef4444" }}>
                              {u.daysSinceActive === 999 ? "Never" : `${u.daysSinceActive}d ago`}
                            </span>
                          </div>
                        ))}
                      {churnData.tiers.high > 5 && (
                        <p className="text-[11px] mt-1" style={{ color: MUTED }}>
                          +{churnData.tiers.high - 5} more high-risk users
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Revenue Intelligence ─────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${BORDER}`, background: "white" }}
        >
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div>
              <p className="text-[14px] font-bold" style={{ color: TEXT }}>Revenue Intelligence</p>
              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>MRR · ARR · LTV from live Stripe data</p>
            </div>
            <span className="text-[18px]">💰</span>
          </div>
          <div className="p-5">
            {!analyticsLoaded && (
              <div className="flex items-center gap-2" style={{ color: MUTED }}>
                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span className="text-[12px]">Loading revenue data…</span>
              </div>
            )}
            {analyticsLoaded && !revenueData && (
              <p className="text-[13px] text-center py-4" style={{ color: MUTED }}>No revenue data yet.</p>
            )}
            {analyticsLoaded && revenueData && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { label: "MRR",                value: `$${revenueData.mrr_dollars}`,   desc: "Monthly recurring revenue",     color: SAGE },
                    { label: "ARR",                value: `$${revenueData.arr_dollars}`,   desc: "Annual recurring revenue",      color: "#5a7a68" },
                    { label: "LTV",                value: `$${revenueData.ltv_dollars}`,   desc: "Avg lifetime value per user",   color: "#8a6050" },
                    { label: "Total Revenue",      value: `$${revenueData.total_dollars}`, desc: "All-time collected",            color: "#6a5080" },
                  ]).map(kpi => (
                    <div key={kpi.label} className="p-3 rounded-xl" style={{ background: `${SAGE}08`, border: `1px solid ${SAGE}18` }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>{kpi.label}</p>
                      <p className="text-[20px] font-black mt-0.5" style={{ color: kpi.color }}>{kpi.value}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>{kpi.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: `${SAGE}08` }}>
                  <span className="text-[12px]" style={{ color: MUTED }}>Active subscriptions</span>
                  <span className="text-[13px] font-bold" style={{ color: SAGE }}>{revenueData.active_subscriptions}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: `${SAGE}08` }}>
                  <span className="text-[12px]" style={{ color: MUTED }}>Total payments processed</span>
                  <span className="text-[13px] font-bold" style={{ color: SAGE }}>{revenueData.payment_count}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Platform Evaluation ───────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ background: `${SAGE}10`, borderBottom: `1px solid ${BORDER}` }}>
            <p className="text-[14px] font-bold" style={{ color: TEXT }}>Platform Evaluation</p>
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${SAGE}18`, color: SAGE }}>
              {evalData ? `${evalData.issues.length} issue${evalData.issues.length !== 1 ? "s" : ""} flagged` : "Loading…"}
            </span>
          </div>
          <div className="px-5 py-4 space-y-3" style={{ background: CREAM }}>
            {!analyticsLoaded && <p className="text-[12px]" style={{ color: MUTED }}>Running evaluation…</p>}
            {analyticsLoaded && !evalData && <p className="text-[12px]" style={{ color: MUTED }}>Evaluation data unavailable.</p>}
            {analyticsLoaded && evalData && (
              <>
                {/* System snapshot */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "Total Users",     value: evalData.system.totalUsers },
                    { label: "DAU",             value: evalData.system.totalDAU },
                    { label: "MAU",             value: evalData.system.totalMAU },
                    { label: "Engagement",      value: `${evalData.system.engagementRatePct}%` },
                  ].map(kpi => (
                    <div key={kpi.label} className="rounded-xl p-3 text-center" style={{ background: `${SAGE}08`, border: `1px solid ${SAGE}18` }}>
                      <p className="text-[18px] font-bold" style={{ color: SAGE }}>{kpi.value}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{kpi.label}</p>
                    </div>
                  ))}
                </div>

                {/* Benchmark rows */}
                <div className="space-y-1 pt-1">
                  {Object.values(evalData.benchmarks).map((b) => {
                    const dot = b.status === "exceeding" ? "#4ade80" : b.status === "meeting" ? SAGE : "#f97316";
                    const bg  = b.status === "exceeding" ? "#f0fdf4" : b.status === "meeting" ? `${SAGE}08` : "#fff7ed";
                    return (
                      <div key={b.label} className="flex items-start justify-between rounded-lg px-3 py-2 gap-2" style={{ background: bg }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0, display: "inline-block", marginTop: 3 }} />
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium truncate" style={{ color: TEXT }}>{b.label}</p>
                            <p className="text-[10px] truncate" style={{ color: MUTED }}>{b.industry}</p>
                          </div>
                        </div>
                        <span className="text-[12px] font-bold shrink-0" style={{ color: dot }}>
                          {b.platform}{b.unit ?? ""}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Issues */}
                {evalData.issues.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-[12px] font-semibold" style={{ color: TEXT }}>Action Items</p>
                    {evalData.issues.map((issue, i) => (
                      <div key={i} className="rounded-xl px-4 py-3" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#f97316", color: "#fff" }}>Below</span>
                          <p className="text-[12px] font-semibold" style={{ color: TEXT }}>{issue.metric}</p>
                          <span className="text-[11px] ml-auto" style={{ color: "#f97316" }}>{String(issue.value)}</span>
                        </div>
                        <p className="text-[11px] mb-0.5" style={{ color: MUTED }}>Benchmark: {issue.benchmark}</p>
                        <p className="text-[11px]" style={{ color: "#7c3a00" }}>{issue.suggestion}</p>
                      </div>
                    ))}
                  </div>
                )}

                {evalData.issues.length === 0 && (
                  <div className="rounded-xl px-4 py-3 text-center" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <p className="text-[13px] font-semibold" style={{ color: "#166534" }}>All benchmarks met</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#4ade80" }}>Platform is performing at or above industry standards.</p>
                  </div>
                )}

                <p className="text-[10px] text-right" style={{ color: MUTED }}>
                  Evaluated {new Date(evalData.system.evaluatedAt).toLocaleTimeString()} · 5-min cache
                </p>
              </>
            )}
          </div>
        </div>

        {/* System note */}
        <div
          className="p-4 rounded-2xl"
          style={{ background: `${SAGE}0c`, border: `1px solid ${SAGE}20` }}
        >
          <p className="text-[12px]" style={{ color: MUTED }}>
            <strong style={{ color: SAGE }}>Admin access:</strong> You can access all platform areas
            except the customer storefront. Use the Full OS Platform link above for the complete workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
