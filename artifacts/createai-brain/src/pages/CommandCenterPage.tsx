/**
 * CommandCenterPage.tsx — All-Systems Command Center
 *
 * Accept a plain-language goal → turn it into a complete, multi-day,
 * multi-channel, asset-complete execution pack using the full platform.
 *
 * Tabs: Plan (Today / This Week / This Month) · Assets (6 channels) · History
 * Public route — no auth required.
 *
 * All assets are copy-ready text. Human executes the final steps manually.
 */

import React, { useState, useCallback, useEffect } from "react";

// ── Types (mirrors executionOrchestrator.ts) ──────────────────────────────────

interface ExecutionAction {
  id:       string;
  text:     string;
  channel?: string;
  done:     boolean;
}

interface EmailAsset    { type: string; subject: string; body: string }
interface SocialAsset   { type: string; platform: string; copy: string }
interface VideoAsset    { title: string; hook: string; script: string; callToAction: string }
interface AdAsset       { platform: string; headline: string; body: string; cta: string }

interface ExecutionPlan {
  id:           string;
  goal:         string;
  createdAt:    string;
  goalSummary:  string;
  strategy:     string;
  monthPlan:    string;
  weekPlan:     string;
  phases: {
    today:     ExecutionAction[];
    thisWeek:  ExecutionAction[];
    thisMonth: ExecutionAction[];
  };
  assets: {
    offersLanding: {
      offer: string; pricing: string; landingHeadline: string;
      landingSubhead: string; landingBody: string; ctaText: string;
    };
    email:          EmailAsset[];
    social:         SocialAsset[];
    shortFormVideo: VideoAsset[];
    ads:            AdAsset[];
    inApp:          { onboardingFlow: string; guidance: string; visualPrompts: string };
  };
  universeContext:  string;
  enginesUsed:      string[];
  modesActivated:   string[];
  experienceLayers: string[];
}

interface HistorySummary {
  id: string; goal: string; goalSummary: string;
  createdAt: string; universe: string;
  actionsDone: number; actionsTotal: number;
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const INDIGO   = "#6366f1";
const SLATE900 = "#0f172a";
const SLATE600 = "#475569";
const SLATE400 = "#94a3b8";
const WHITE    = "#ffffff";

// ── Utility: copy to clipboard ────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={copy}
      style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
        color:       copied ? "#10b981" : INDIGO,
        background:  copied ? "rgba(16,185,129,0.08)" : "rgba(99,102,241,0.07)",
        border:      copied ? "1px solid rgba(16,185,129,0.22)" : "1px solid rgba(99,102,241,0.18)",
        borderRadius: 7, padding: "3px 10px", cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ── Asset text box ─────────────────────────────────────────────────────────────

function AssetBox({
  label, content, mono = false,
}: { label?: string; content: string; mono?: boolean }) {
  if (!content) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {label && (
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            color: SLATE400, textTransform: "uppercase" }}>
            {label}
          </span>
        )}
        <CopyButton text={content} />
      </div>
      <div style={{
        background: "#f8fafc", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10,
        padding: "12px 14px", fontSize: 13, lineHeight: 1.65, color: SLATE900,
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        fontFamily: mono ? "monospace" : "inherit",
      }}>
        {content}
      </div>
    </div>
  );
}

// ── Section divider ────────────────────────────────────────────────────────────

function SectionTitle({ icon, title, count }: { icon: string; title: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: SLATE900,
        letterSpacing: "-0.02em" }}>
        {title}
      </h3>
      {count !== undefined && (
        <span style={{ fontSize: 11, fontWeight: 600, color: INDIGO,
          background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)",
          borderRadius: 99, padding: "1px 8px" }}>
          {count}
        </span>
      )}
    </div>
  );
}

// ── Action card ────────────────────────────────────────────────────────────────

function ActionCard({
  action, phase, planId, onToggle,
}: {
  action:   ExecutionAction;
  phase:    "today" | "thisWeek" | "thisMonth";
  planId:   string;
  onToggle: (phase: "today" | "thisWeek" | "thisMonth", actionId: string) => void;
}) {
  return (
    <div
      onClick={() => onToggle(phase, action.id)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 14px",
        background: action.done ? "rgba(16,185,129,0.05)" : WHITE,
        border: `1px solid ${action.done ? "rgba(16,185,129,0.22)" : "rgba(0,0,0,0.07)"}`,
        borderRadius: 10, cursor: "pointer",
        transition: "all 0.15s ease",
        opacity: action.done ? 0.7 : 1,
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1,
        background:   action.done ? "#10b981" : "transparent",
        border:       action.done ? "2px solid #10b981" : "2px solid #cbd5e1",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s ease",
      }}>
        {action.done && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      <span style={{
        fontSize: 13, lineHeight: 1.5, color: action.done ? SLATE400 : SLATE900,
        textDecoration: action.done ? "line-through" : "none",
        flex: 1,
      }}>
        {action.text}
      </span>
    </div>
  );
}

// ── Phase section ──────────────────────────────────────────────────────────────

function PhaseSection({
  label, icon, color, actions, phase, planId, onToggle,
}: {
  label:    string;
  icon:     string;
  color:    string;
  actions:  ExecutionAction[];
  phase:    "today" | "thisWeek" | "thisMonth";
  planId:   string;
  onToggle: (phase: "today" | "thisWeek" | "thisMonth", actionId: string) => void;
}) {
  const done  = actions.filter(a => a.done).length;
  const total = actions.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{
      background: WHITE, border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14,
      overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px 10px",
        background: `${color}08`,
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: SLATE900 }}>{label}</span>
          <span style={{ fontSize: 11, color, fontWeight: 600 }}>
            {done}/{total} done
          </span>
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, color,
          background: `${color}14`, border: `1px solid ${color}30`,
          borderRadius: 99, padding: "2px 8px",
        }}>
          {pct}%
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(0,0,0,0.05)" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: color,
          transition: "width 0.4s ease",
        }} />
      </div>

      {/* Actions */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {actions.length === 0 ? (
          <p style={{ fontSize: 12, color: SLATE400, margin: 0 }}>No actions for this phase.</p>
        ) : actions.map(action => (
          <ActionCard
            key={action.id} action={action}
            phase={phase} planId={planId} onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

// ── Assets panel ───────────────────────────────────────────────────────────────

const ASSET_TABS = [
  { id: "offers",   icon: "🏷️",  label: "Offers & Landing" },
  { id: "email",    icon: "📧",  label: "Email" },
  { id: "social",   icon: "📲",  label: "Social" },
  { id: "video",    icon: "🎬",  label: "Short-form Video" },
  { id: "ads",      icon: "📢",  label: "Ads" },
  { id: "inapp",    icon: "🖥️", label: "In-App / Onboarding" },
] as const;

type AssetTab = typeof ASSET_TABS[number]["id"];

function AssetsPanel({ plan }: { plan: ExecutionPlan }) {
  const [tab, setTab] = useState<AssetTab>("offers");
  const { assets } = plan;

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 4, flexWrap: "wrap",
        marginBottom: 16,
        padding: "4px",
        background: "rgba(0,0,0,0.03)",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 12,
      }}>
        {ASSET_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 13px", borderRadius: 9, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600,
            background: tab === t.id ? WHITE : "transparent",
            color:      tab === t.id ? SLATE900 : SLATE600,
            boxShadow:  tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s ease",
          }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {tab === "offers" && (
          <>
            <SectionTitle icon="🏷️" title="Offer & Pricing" />
            <AssetBox label="Offer Description"    content={assets.offersLanding.offer} />
            <AssetBox label="Pricing Structure"    content={assets.offersLanding.pricing} />
            <SectionTitle icon="🌐" title="Landing Page" />
            <AssetBox label="Headline"             content={assets.offersLanding.landingHeadline} />
            <AssetBox label="Subheadline"          content={assets.offersLanding.landingSubhead} />
            <AssetBox label="Body Copy"            content={assets.offersLanding.landingBody} />
            <AssetBox label="CTA Button Text"      content={assets.offersLanding.ctaText} />
          </>
        )}

        {tab === "email" && assets.email.map((e, i) => (
          <div key={i} style={{
            background: WHITE, border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 12, padding: "14px 16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                color: INDIGO, background: "rgba(99,102,241,0.08)",
                border: "1px solid rgba(99,102,241,0.18)", borderRadius: 99, padding: "2px 8px",
                textTransform: "uppercase",
              }}>{e.type}</span>
            </div>
            <AssetBox label="Subject Line" content={e.subject} />
            <div style={{ marginTop: 10 }}>
              <AssetBox label="Email Body" content={e.body} />
            </div>
          </div>
        ))}

        {tab === "social" && assets.social.map((s, i) => (
          <div key={i} style={{
            background: WHITE, border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 12, padding: "14px 16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                color: "#0ea5e9", background: "rgba(14,165,233,0.08)",
                border: "1px solid rgba(14,165,233,0.18)", borderRadius: 99, padding: "2px 8px",
                textTransform: "uppercase",
              }}>{s.type}</span>
              <span style={{ fontSize: 11, color: SLATE600, fontWeight: 600 }}>{s.platform}</span>
            </div>
            <AssetBox content={s.copy} />
          </div>
        ))}

        {tab === "video" && assets.shortFormVideo.map((v, i) => (
          <div key={i} style={{
            background: WHITE, border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 12, padding: "16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: SLATE900 }}>
              🎬 {v.title}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <AssetBox label="Hook (first 3 seconds)"  content={v.hook} />
              <AssetBox label="Full Script"             content={v.script} />
              <AssetBox label="Call to Action (closing)" content={v.callToAction} />
            </div>
          </div>
        ))}

        {tab === "ads" && assets.ads.map((a, i) => (
          <div key={i} style={{
            background: WHITE, border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 12, padding: "14px 16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                color: "#ef4444", background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.18)", borderRadius: 99, padding: "2px 8px",
                textTransform: "uppercase",
              }}>{a.platform}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <AssetBox label="Headline"    content={a.headline} />
              <AssetBox label="Ad Copy"     content={a.body} />
              <AssetBox label="CTA / Button" content={a.cta} />
            </div>
          </div>
        ))}

        {tab === "inapp" && (
          <>
            <AssetBox label="Onboarding Flow Copy"      content={assets.inApp.onboardingFlow} />
            <AssetBox label="In-App Guidance & Tooltips" content={assets.inApp.guidance} />
            <AssetBox label="Visual & Thumbnail Prompts" content={assets.inApp.visualPrompts} />
          </>
        )}
      </div>
    </div>
  );
}

// ── History panel ─────────────────────────────────────────────────────────────

function HistoryPanel({
  history,
  onLoad,
}: {
  history: HistorySummary[];
  onLoad:  (id: string) => void;
}) {
  if (history.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
        <p style={{ fontSize: 14, color: SLATE400, margin: 0 }}>
          No execution packs yet. Submit a goal above to get started.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {history.map(h => {
        const pct = h.actionsTotal ? Math.round((h.actionsDone / h.actionsTotal) * 100) : 0;
        return (
          <div key={h.id} style={{
            background: WHITE, border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 12, padding: "14px 16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: SLATE900 }}>
                  {h.goalSummary || h.goal}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: SLATE400 }}>
                    {new Date(h.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {h.universe && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                      color: INDIGO, background: "rgba(99,102,241,0.07)",
                      border: "1px solid rgba(99,102,241,0.16)", borderRadius: 99, padding: "1px 6px",
                    }}>
                      {h.universe}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: SLATE600 }}>
                    {h.actionsDone}/{h.actionsTotal} actions done · {pct}%
                  </span>
                </div>
              </div>

              <button
                onClick={() => onLoad(h.id)}
                style={{
                  fontSize: 11, fontWeight: 700, color: INDIGO,
                  background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)",
                  borderRadius: 8, padding: "5px 12px", cursor: "pointer", flexShrink: 0,
                }}
              >
                Load
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 10, height: 4, background: "rgba(0,0,0,0.05)", borderRadius: 99 }}>
              <div style={{
                height: "100%", width: `${pct}%`, borderRadius: 99,
                background: pct === 100 ? "#10b981" : INDIGO,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page component ────────────────────────────────────────────────────────

const TOP_TABS = [
  { id: "plan",    icon: "🗺️",  label: "Strategy & Plan" },
  { id: "assets",  icon: "📦",  label: "Assets" },
  { id: "history", icon: "🕘",  label: "History" },
] as const;

type TopTab = typeof TOP_TABS[number]["id"];

const GOAL_EXAMPLES = [
  "Get 10 paying users in 14 days",
  "Fill a waitlist for my new offer",
  "Grow TikTok to 1,000 followers",
  "Launch a new AI coaching package",
  "Sell 5 healthcare demo seats to decision-makers",
  "Get my first $5,000 month",
];

export default function CommandCenterPage() {
  const [goal,     setGoal]    = useState("");
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");
  const [plan,     setPlan]    = useState<ExecutionPlan | null>(null);
  const [tab,      setTab]     = useState<TopTab>("plan");
  const [history,  setHistory] = useState<HistorySummary[]>([]);
  const [histLoad, setHistLoad] = useState(false);

  const loadHistory = useCallback(() => {
    setHistLoad(true);
    fetch("/api/orchestrator/history")
      .then(r => r.json())
      .then(d => setHistory(d.history ?? []))
      .catch(() => {})
      .finally(() => setHistLoad(false));
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const submit = async () => {
    if (!goal.trim() || loading) return;
    setLoading(true);
    setError("");
    setPlan(null);
    setTab("plan");
    try {
      const res  = await fetch("/api/orchestrator/execute", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ goal: goal.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Orchestration failed");
      setPlan(data.plan as ExecutionPlan);
      loadHistory();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAction = async (
    phase:    "today" | "thisWeek" | "thisMonth",
    actionId: string,
  ) => {
    if (!plan) return;
    try {
      const res = await fetch(`/api/orchestrator/plan/${plan.id}/action/${actionId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phase }),
      });
      const data = await res.json();
      if (data.ok) { setPlan(data.plan); loadHistory(); }
    } catch {}
  };

  const loadPlanFromHistory = async (id: string) => {
    try {
      const res  = await fetch(`/api/orchestrator/plan/${id}`);
      const data = await res.json();
      if (data.ok) { setPlan(data.plan); setTab("plan"); }
    } catch {}
  };

  const totalActions = plan
    ? plan.phases.today.length + plan.phases.thisWeek.length + plan.phases.thisMonth.length
    : 0;
  const doneActions = plan
    ? [...plan.phases.today, ...plan.phases.thisWeek, ...plan.phases.thisMonth].filter(a => a.done).length
    : 0;

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", padding: "0 0 60px" }}>

      {/* ── Hero header ── */}
      <div style={{
        background:     "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)",
        padding:        "20px 24px 28px",
        position:       "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          {/* Nav row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { label: "← Dashboard",     slug: "transcend-dashboard" },
              { label: "Analytics",       slug: "analytics"           },
              { label: "Team",            slug: "team"                },
              { label: "Billing",         slug: "billing"             },
              { label: "Data",            slug: "data"                },
              { label: "Global",          slug: "global-expansion"    },
              { label: "Evolution",       slug: "evolution"           },
              { label: "Settings",        slug: "settings"            },
              { label: "Platform Status", slug: "platform-status"     },
            ].map(({ label, slug }) => (
              <a key={slug}
                href={`#${slug}`}
                onClick={e => {
                  e.preventDefault();
                  window.location.href = window.location.pathname.replace(/\/command-center.*$/, `/${slug}`);
                }}
                style={{
                  display: "inline-flex", alignItems: "center",
                  fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)",
                  textDecoration: "none", background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
                  padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {label}
              </a>
            ))}
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>· Command Center</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>🎯</span>
            <div>
              <h1 style={{
                margin: 0, fontSize: 22, fontWeight: 800,
                color: WHITE, letterSpacing: "-0.03em",
              }}>
                All-Systems Command Center
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.06em" }}>
                TYPE A GOAL · GET A COMPLETE EXECUTION PACK · EVERY CAPABILITY ACTIVATED
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
            Uses every engine, mode, universe, and layer. Returns strategy, phased actions,
            and copy-ready assets for every channel. You execute — no automatic sending.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 0" }}>

        {/* ── Goal input ── */}
        <div style={{
          background: WHITE, border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          overflow: "hidden", marginBottom: 24,
        }}>
          <div style={{ padding: "20px 20px 16px" }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: SLATE900,
              display: "block", marginBottom: 10 }}>
              What's the goal?
            </label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
              placeholder='e.g. "Get 10 paying users in the next 14 days"'
              disabled={loading}
              rows={3}
              style={{
                width: "100%", boxSizing: "border-box", resize: "vertical",
                padding: "12px 14px", fontSize: 14, lineHeight: 1.6, color: SLATE900,
                background: "#f8fafc", border: "1px solid rgba(0,0,0,0.09)",
                borderRadius: 10, outline: "none", fontFamily: "inherit",
                transition: "border-color 0.15s ease",
              }}
              onFocus={e  => { e.target.style.borderColor = INDIGO; }}
              onBlur={e   => { e.target.style.borderColor = "rgba(0,0,0,0.09)"; }}
            />

            {/* Example chips */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              <span style={{ fontSize: 10, color: SLATE400, alignSelf: "center" }}>Try:</span>
              {GOAL_EXAMPLES.map(ex => (
                <button
                  key={ex} onClick={() => setGoal(ex)} disabled={loading}
                  style={{
                    fontSize: 10, fontWeight: 600, color: INDIGO,
                    background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.16)",
                    borderRadius: 99, padding: "3px 10px", cursor: "pointer",
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Submit bar */}
          <div style={{
            padding: "12px 20px", background: "#f8fafc",
            borderTop: "1px solid rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <span style={{ fontSize: 11, color: SLATE400 }}>⌘ + Enter to submit</span>
            <button
              onClick={submit}
              disabled={!goal.trim() || loading}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 24px", borderRadius: 10, border: "none",
                fontSize: 14, fontWeight: 700, cursor: !goal.trim() || loading ? "not-allowed" : "pointer",
                background:  !goal.trim() || loading
                  ? "rgba(99,102,241,0.35)"
                  : `linear-gradient(135deg, ${INDIGO}, #8b5cf6)`,
                color: WHITE, transition: "all 0.2s ease",
                boxShadow: !goal.trim() || loading ? "none" : "0 4px 14px rgba(99,102,241,0.35)",
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2.5px solid rgba(255,255,255,0.3)",
                    borderTopColor: WHITE, animation: "ccSpin 0.9s linear infinite",
                  }} />
                  Generating execution pack…
                </>
              ) : (
                <>🚀 Generate Full Execution Pack</>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
            padding: "12px 16px", fontSize: 13, color: "#991b1b", marginBottom: 16,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{
            background: WHITE, border: "1px solid rgba(0,0,0,0.07)", borderRadius: 16,
            padding: "32px 24px", textAlign: "center",
            boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚙️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: SLATE900 }}>
              Building your execution pack…
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: SLATE600, lineHeight: 1.6 }}>
              Activating all engines, modes, universes, and experience layers.<br />
              Generating strategy, phased actions, and all channel assets.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
              {["Guided Engine","Hybrid Engine","All Universes","25 Modes","Experience Layers",
                "Asset Generation","Offer Design","Email Copy","Social Posts","Ad Copy"].map(label => (
                <span key={label} style={{
                  fontSize: 10, fontWeight: 600, color: INDIGO,
                  background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.16)",
                  borderRadius: 99, padding: "3px 10px",
                  animation: "ccPulse 1.8s ease-in-out infinite",
                }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {!loading && plan && (
          <div>
            {/* Plan summary card */}
            <div style={{
              background: WHITE, border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: 16, padding: "18px 20px", marginBottom: 20,
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}>
              {/* Meta chips */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
                  color: "#10b981", background: "rgba(16,185,129,0.09)",
                  border: "1px solid rgba(16,185,129,0.22)", borderRadius: 99, padding: "2px 8px",
                }}>
                  ✓ EXECUTION PACK READY
                </span>
                {plan.universeContext && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: INDIGO,
                    background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.16)",
                    borderRadius: 99, padding: "2px 8px",
                  }}>
                    {plan.universeContext} universe
                  </span>
                )}
                {plan.enginesUsed.slice(0, 3).map(e => (
                  <span key={e} style={{
                    fontSize: 9, fontWeight: 600, color: "#8b5cf6",
                    background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.16)",
                    borderRadius: 99, padding: "2px 7px",
                  }}>
                    {e}
                  </span>
                ))}
                {plan.enginesUsed.length > 3 && (
                  <span style={{ fontSize: 10, color: SLATE400 }}>
                    +{plan.enginesUsed.length - 3} engines
                  </span>
                )}
              </div>

              {/* Goal summary */}
              <h2 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 700,
                color: SLATE900, letterSpacing: "-0.02em" }}>
                {plan.goalSummary}
              </h2>

              {/* Strategy */}
              <p style={{ margin: "0 0 14px", fontSize: 13, color: SLATE600, lineHeight: 1.65 }}>
                {plan.strategy}
              </p>

              {/* Action progress */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 99 }}>
                  <div style={{
                    height: "100%", borderRadius: 99,
                    width: `${totalActions ? Math.round((doneActions / totalActions) * 100) : 0}%`,
                    background: `linear-gradient(90deg, ${INDIGO}, #8b5cf6)`,
                    transition: "width 0.4s ease",
                  }} />
                </div>
                <span style={{ fontSize: 11, color: SLATE600, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {doneActions}/{totalActions} actions done
                </span>
              </div>
            </div>

            {/* Top tabs */}
            <div style={{
              display: "flex", gap: 4, marginBottom: 16,
              padding: "4px", background: "rgba(0,0,0,0.03)",
              border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12,
            }}>
              {TOP_TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                  background: tab === t.id ? WHITE : "transparent",
                  color:      tab === t.id ? SLATE900 : SLATE600,
                  boxShadow:  tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                }}>
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Plan tab */}
            {tab === "plan" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Month / Week summaries */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 12,
                }}>
                  {[
                    { icon: "📅", label: "This Month", content: plan.monthPlan, color: INDIGO },
                    { icon: "📆", label: "This Week",  content: plan.weekPlan,  color: "#8b5cf6" },
                  ].map(({ icon, label, content, color }) => (
                    <div key={label} style={{
                      background: WHITE, border: "1px solid rgba(0,0,0,0.07)",
                      borderRadius: 12, padding: "14px 16px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 16 }}>{icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: SLATE600, lineHeight: 1.6 }}>
                        {content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Phases */}
                <PhaseSection
                  label="Today's Actions" icon="⚡" color="#ef4444"
                  actions={plan.phases.today} phase="today"
                  planId={plan.id} onToggle={toggleAction}
                />
                <PhaseSection
                  label="This Week's Actions" icon="📆" color={INDIGO}
                  actions={plan.phases.thisWeek} phase="thisWeek"
                  planId={plan.id} onToggle={toggleAction}
                />
                <PhaseSection
                  label="This Month's Actions" icon="📅" color="#8b5cf6"
                  actions={plan.phases.thisMonth} phase="thisMonth"
                  planId={plan.id} onToggle={toggleAction}
                />
              </div>
            )}

            {/* Assets tab */}
            {tab === "assets" && <AssetsPanel plan={plan} />}
          </div>
        )}

        {/* History tab — always accessible */}
        {(!loading && (tab === "history" || (plan === null && !loading && !error))) && (
          <div>
            {plan && tab !== "history" ? null : (
              <>
                {plan && (
                  <div style={{ marginBottom: 16 }}>
                    <button onClick={() => setTab("history")} style={{
                      fontSize: 13, fontWeight: 600, color: SLATE600,
                      background: WHITE, border: "1px solid rgba(0,0,0,0.09)",
                      borderRadius: 9, padding: "7px 16px", cursor: "pointer",
                    }}>
                      🕘 View History
                    </button>
                  </div>
                )}
              </>
            )}
            {tab === "history" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <SectionTitle icon="🕘" title="Execution History" count={history.length} />
                  <button onClick={loadHistory} style={{
                    fontSize: 11, color: SLATE400, background: "transparent",
                    border: "1px solid rgba(0,0,0,0.09)", borderRadius: 8,
                    padding: "4px 10px", cursor: "pointer",
                  }}>
                    {histLoad ? "Loading…" : "↻ Refresh"}
                  </button>
                </div>
                <HistoryPanel history={history} onLoad={loadPlanFromHistory} />
              </div>
            )}
          </div>
        )}

        {/* Empty state (no plan yet, not loading) */}
        {!loading && !plan && !error && (
          <div style={{
            background: WHITE, border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 16, padding: "48px 24px", textAlign: "center",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: SLATE900 }}>
              Ready to execute
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: SLATE600, lineHeight: 1.7 }}>
              Type any goal above and get a complete execution pack — strategy,
              phased action plan, and copy-ready assets for every channel.
              Every engine, mode, and universe in the platform is available.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              {["8 Creation Engines","25 Modes","All Universes","6 Asset Channels","Phased Plans"].map(label => (
                <span key={label} style={{
                  fontSize: 11, fontWeight: 600, color: INDIGO,
                  background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.16)",
                  borderRadius: 99, padding: "4px 12px",
                }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ccSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ccPulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.5; }
        }
      `}</style>
    </div>
  );
}
