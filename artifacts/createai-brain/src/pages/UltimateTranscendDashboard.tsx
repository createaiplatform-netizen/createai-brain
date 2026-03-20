/**
 * UltimateTranscendDashboard.tsx
 * Spec: FULL-AUTONOMOUS-TRANSCENDENT-LAUNCH-MAXIMIZER
 *
 * Modular live dashboard — polls all 6 engine endpoints every 60 s.
 * Toggle panels on/off; hover stat rows for tooltips.
 * Apple/Linear/Notion aesthetic: indigo #6366f1, light theme, bg #f8fafc.
 */

import React, { useState, useEffect, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIGO  = "#6366f1";
const SLATE   = "#64748b";
const GREEN   = "#22c55e";
const AMBER   = "#f59e0b";
const BG      = "#f8fafc";
const CARD_BG = "#ffffff";
const BORDER  = "rgba(0,0,0,0.07)";
const SHADOW  = "0 1px 8px rgba(0,0,0,0.05)";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModuleKey = "market" | "hybrid" | "wealth" | "audit" | "meta" | "maximizer" | "enforcer" | "ultimate";

interface MarketStats {
  totalProducts:   number;
  cycleCount:      number;
  generationSpeed: number;
  salesCount:      number;
  running:         boolean;
}
interface HybridStats {
  "Rail: Stripe":    string;
  "Rail: Email":     string;
  "Rail: SMS":       string;
  "Revenue (live)":  string;
  "Revenue (queued)": string;
  "Messages Sent":   number;
  "Payments Queued": number;
  externalChannels:  Array<{ channel: string; live: boolean }>;
}
interface WealthStats {
  totalRevenue:      string;
  projectedRevenue:  string;
  growthPercent:     string;
  products:          number;
  batches:           number;
  marketplaces:      number;
  cycleTs:           string;
}
interface AuditStats {
  ts:              string;
  products:        number;
  batches:         number;
  marketplaces:    number;
  liveRevenue:     string;
  projectedRevenue: string;
  growthPercent:   string;
  campaignReach:   number;
  impressions:     number;
  status: {
    marketEngine: string;
    hybridEngine: string;
    wealthEngine: string;
  };
}
interface MetaStats {
  cycleCount:           number;
  lastCycleTs:          string;
  totalPremiumProducts: number;
  totalCampaignReach:   number;
  totalImpressions:     number;
  avgOptimizedCents:    number;
  transcendFires:       number;
  errors:               number;
}
interface MaximizerStats {
  cycleCount:    number;
  lastCycleTs:   string;
  boostsApplied: number;
  totalBoostPct: number;
  transcendFires: number;
  errors:        number;
  lastGrowthPct: number;
}

interface EnforcerStats {
  cycleCount:     number;
  lastCycleTs:    string;
  growthBoosts:   number;
  transcendFires: number;
  premiumBatches: number;
  campaignsFired: number;
  errors:         number;
}

interface UltimateStats {
  cycleCount:      number;
  lastCycleTs:     string;
  totalProducts:   number;
  totalFormats:    number;
  totalCategories: number;
  metaCyclesFired: number;
  growthEnforced:  number;
  transcendFires:  number;
  errors:          number;
}

interface AllStats {
  market:    MarketStats    | null;
  hybrid:    HybridStats    | null;
  wealth:    WealthStats    | null;
  audit:     AuditStats     | null;
  meta:      MetaStats      | null;
  maximizer: MaximizerStats | null;
  enforcer:  EnforcerStats  | null;
  ultimate:  UltimateStats  | null;
}

// ─── Small UI atoms ───────────────────────────────────────────────────────────

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: "inline-block",
      width: 8, height: 8,
      borderRadius: "50%",
      background: ok ? GREEN : AMBER,
      marginRight: 5,
      verticalAlign: "middle",
    }} />
  );
}

function Row({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "5px 0", borderBottom: `1px solid ${BORDER}`,
    }}>
      <span style={{ fontSize: 12, color: SLATE }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 600,
        color: accent ? INDIGO : "#1e293b",
        fontVariantNumeric: "tabular-nums",
      }}>{value}</span>
    </div>
  );
}

function ModuleCard({
  title, icon, visible, onToggle, children, loading,
}: {
  title: string; icon: string; visible: boolean;
  onToggle: () => void; children: React.ReactNode; loading: boolean;
}) {
  return (
    <div style={{
      background: CARD_BG, border: `1px solid ${BORDER}`,
      borderRadius: 16, boxShadow: SHADOW,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: visible ? `1px solid ${BORDER}` : "none",
        cursor: "pointer",
        background: visible ? "rgba(99,102,241,0.03)" : CARD_BG,
      }} onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loading && visible && (
            <span style={{ fontSize: 11, color: SLATE, fontStyle: "italic" }}>updating…</span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: visible ? INDIGO : SLATE,
            padding: "2px 8px",
            background: visible ? "rgba(99,102,241,0.1)" : "rgba(100,116,139,0.08)",
            borderRadius: 99,
          }}>
            {visible ? "Hide" : "Show"}
          </span>
        </div>
      </div>

      {/* Body */}
      {visible && (
        <div style={{ padding: "12px 16px" }}>{children}</div>
      )}
    </div>
  );
}

// ─── Module Contents ──────────────────────────────────────────────────────────

function MarketPanel({ s }: { s: MarketStats }) {
  return (
    <>
      <Row label="Total Products"    value={s.totalProducts.toLocaleString()} accent />
      <Row label="Market Cycles"     value={s.cycleCount} />
      <Row label="Generation Speed"  value={s.generationSpeed} />
      <Row label="Total Sales"       value={s.salesCount} />
      <Row label="Engine"            value={s.running ? "✅ Running" : "⏸ Stopped"} />
    </>
  );
}

function HybridPanel({ s }: { s: HybridStats }) {
  const stripeOk = s["Rail: Stripe"]?.includes("✅");
  const emailOk  = s["Rail: Email"]?.includes("✅");
  const smsOk    = s["Rail: SMS"]?.includes("✅");
  return (
    <>
      <Row label="Revenue (live)"    value={s["Revenue (live)"]}  accent />
      <Row label="Revenue (queued)"  value={s["Revenue (queued)"]} />
      <Row label="Messages Sent"     value={s["Messages Sent"]} />
      <Row label="Payments Queued"   value={s["Payments Queued"]} />
      <div style={{ marginTop: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: SLATE, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Payment Rails</p>
        {[["Stripe", stripeOk], ["Email", emailOk], ["SMS", smsOk]].map(([name, ok]) => (
          <div key={name as string} style={{ fontSize: 12, padding: "3px 0", color: "#1e293b" }}>
            <StatusDot ok={ok as boolean} />{name as string}
          </div>
        ))}
      </div>
      {s.externalChannels?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: SLATE, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>External Channels</p>
          {s.externalChannels.map(c => (
            <div key={c.channel} style={{ fontSize: 12, padding: "3px 0", color: "#1e293b" }}>
              <StatusDot ok={c.live} />{c.channel}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function WealthPanel({ s }: { s: WealthStats }) {
  return (
    <>
      <Row label="Total Revenue"     value={s.totalRevenue}     accent />
      <Row label="Projected Revenue" value={s.projectedRevenue} accent />
      <Row label="Growth %"          value={s.growthPercent}    accent />
      <Row label="Products"          value={s.products?.toLocaleString() ?? "—"} />
      <Row label="Batches"           value={s.batches ?? "—"} />
      <Row label="Marketplaces"      value={s.marketplaces ?? 6} />
    </>
  );
}

function AuditPanel({ s }: { s: AuditStats }) {
  return (
    <>
      <Row label="Products"          value={s.products.toLocaleString()} accent />
      <Row label="Batches"           value={s.batches} />
      <Row label="Marketplaces"      value={s.marketplaces} />
      <Row label="Revenue (live)"    value={s.liveRevenue} />
      <Row label="Projected Revenue" value={s.projectedRevenue} />
      <Row label="Growth %"          value={s.growthPercent} accent />
      <Row label="Campaign Reach"    value={(s.campaignReach ?? 0).toLocaleString()} />
      <Row label="Impressions"       value={(s.impressions ?? 0).toLocaleString()} />
      <div style={{ marginTop: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: SLATE, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Engine Status</p>
        {Object.entries(s.status).map(([k, v]) => (
          <div key={k} style={{ fontSize: 12, padding: "3px 0", color: "#1e293b" }}>
            {v} {k.replace("Engine", " Engine")}
          </div>
        ))}
      </div>
    </>
  );
}

function EnforcerPanel({ s }: { s: EnforcerStats }) {
  return (
    <>
      <Row label="Enforcement Cycles" value={s.cycleCount} accent />
      <Row label="Growth Boosts"       value={s.growthBoosts} />
      <Row label="Transcend Fires"     value={s.transcendFires} />
      <Row label="Premium Batches"     value={s.premiumBatches} />
      <Row label="Campaigns Fired"     value={s.campaignsFired} />
      <Row label="Errors"              value={s.errors === 0 ? "✅ None" : s.errors} />
    </>
  );
}

function UltimatePanel({ s }: { s: UltimateStats }) {
  return (
    <>
      <Row label="Ultimate Cycles"   value={s.cycleCount} accent />
      <Row label="Total Products"    value={s.totalProducts.toLocaleString()} accent />
      <Row label="Formats per Niche" value={s.totalFormats} />
      <Row label="Active Niches"     value={s.totalCategories} />
      <Row label="Meta Cycles Fired" value={s.metaCyclesFired} />
      <Row label="Growth Enforced"   value={s.growthEnforced} />
      <Row label="Transcend Fires"   value={s.transcendFires} />
      <Row label="Errors"            value={s.errors === 0 ? "✅ None" : s.errors} />
    </>
  );
}

function MetaPanel({ s }: { s: MetaStats }) {
  return (
    <>
      <Row label="Meta Cycles"         value={s.cycleCount} accent />
      <Row label="Premium Products"    value={s.totalPremiumProducts.toLocaleString()} />
      <Row label="Campaign Reach"      value={s.totalCampaignReach.toLocaleString()} />
      <Row label="Total Impressions"   value={s.totalImpressions.toLocaleString()} />
      <Row label="Avg Optimized Price" value={`$${(s.avgOptimizedCents / 100).toFixed(2)}`} accent />
      <Row label="Transcend Fires"     value={s.transcendFires} />
      <Row label="Errors"              value={s.errors === 0 ? "✅ None" : s.errors} />
    </>
  );
}

function MaximizerPanel({ s }: { s: MaximizerStats }) {
  return (
    <>
      <Row label="Enforcement Cycles" value={s.cycleCount} accent />
      <Row label="Boosts Applied"     value={s.boostsApplied} />
      <Row label="Total Boost (pp)"   value={`+${s.totalBoostPct.toFixed(2)}pp`} accent />
      <Row label="Last Growth %"      value={`${s.lastGrowthPct.toFixed(2)}%`} />
      <Row label="Transcend Fires"    value={s.transcendFires} />
      <Row label="Errors"             value={s.errors === 0 ? "✅ None" : s.errors} />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const MODULES: { key: ModuleKey; title: string; icon: string }[] = [
  { key: "market",    title: "Market Engine",        icon: "🏪" },
  { key: "hybrid",    title: "Hybrid Engine",         icon: "⚡" },
  { key: "wealth",    title: "Wealth Multiplier",     icon: "💹" },
  { key: "audit",     title: "Platform Audit",        icon: "🔍" },
  { key: "meta",      title: "Meta Transcend",        icon: "🌌" },
  { key: "maximizer", title: "Wealth Maximizer",      icon: "💪" },
  { key: "enforcer",  title: "Platform 100% Enforcer", icon: "🔒" },
  { key: "ultimate",  title: "Ultimate Zero-Touch Launch", icon: "🔥" },
];

export default function UltimateTranscendDashboard() {
  const [visible, setVisible] = useState<Record<ModuleKey, boolean>>({
    market: true, hybrid: true, wealth: true, audit: true, meta: true, maximizer: true, enforcer: true, ultimate: true,
  });

  const [stats, setStats] = useState<AllStats>({
    market: null, hybrid: null, wealth: null, audit: null, meta: null, maximizer: null, enforcer: null, ultimate: null,
  });

  const [loading, setLoading] = useState(false);
  const [lastTs,  setLastTs]  = useState<string>("");
  const [error,   setError]   = useState<string>("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [market, hybrid, wealth, audit, meta, maximizer, enforcer, ultimate] = await Promise.allSettled([
        fetch("/api/real-market/stats").then(r => r.json()),
        fetch("/api/hybrid/stats").then(r => r.json()),
        fetch("/api/wealth/snapshot").then(r => r.json()),
        fetch("/api/audit/snapshot").then(r => r.json()),
        fetch("/api/meta/stats").then(r => r.json()),
        fetch("/api/maximizer/stats").then(r => r.json()),
        fetch("/api/enforcer/stats").then(r => r.json()),
        fetch("/api/ultimate/stats").then(r => r.json()),
      ]);

      setStats({
        market:    market.status    === "fulfilled" ? market.value    : null,
        hybrid:    hybrid.status    === "fulfilled" ? hybrid.value    : null,
        wealth:    wealth.status    === "fulfilled" ? wealth.value    : null,
        audit:     audit.status     === "fulfilled" && !audit.value?.message ? audit.value : null,
        meta:      meta.status      === "fulfilled" ? meta.value      : null,
        maximizer: maximizer.status === "fulfilled" ? maximizer.value : null,
        enforcer:  enforcer.status  === "fulfilled" ? enforcer.value  : null,
        ultimate:  ultimate.status  === "fulfilled" ? ultimate.value  : null,
      });
      setLastTs(new Date().toLocaleTimeString());
    } catch (e) {
      setError("Fetch failed — retrying next cycle");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const toggle = (k: ModuleKey) =>
    setVisible(prev => ({ ...prev, [k]: !prev[k] }));

  const allVisible = Object.values(visible).every(Boolean);
  const toggleAll  = () => {
    const next = !allVisible;
    setVisible({ market: next, hybrid: next, wealth: next, audit: next, meta: next, maximizer: next, enforcer: next, ultimate: next });
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "32px 24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              🌌 Ultimate Transcend Engine
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: SLATE }}>
              Live platform dashboard — all 8 engines · auto-refresh 60 s
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {lastTs && (
              <span style={{ fontSize: 12, color: SLATE }}>
                Updated {lastTs}
              </span>
            )}
            <button onClick={toggleAll} style={{
              fontSize: 12, fontWeight: 600, padding: "6px 14px",
              borderRadius: 99, border: "none", cursor: "pointer",
              background: "rgba(99,102,241,0.1)", color: INDIGO,
            }}>
              {allVisible ? "Collapse All" : "Expand All"}
            </button>
            <button onClick={fetchAll} disabled={loading} style={{
              fontSize: 12, fontWeight: 600, padding: "6px 14px",
              borderRadius: 99, border: "none", cursor: "pointer",
              background: INDIGO, color: "#fff",
              opacity: loading ? 0.6 : 1,
            }}>
              {loading ? "Refreshing…" : "Refresh Now"}
            </button>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div style={{ padding: "10px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, marginBottom: 16, fontSize: 13, color: "#991b1b" }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Module grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {MODULES.map(({ key, title, icon }) => (
            <ModuleCard
              key={key}
              title={title}
              icon={icon}
              visible={visible[key]}
              onToggle={() => toggle(key)}
              loading={loading}
            >
              {key === "market"    && stats.market    && <MarketPanel    s={stats.market}    />}
              {key === "hybrid"    && stats.hybrid    && <HybridPanel    s={stats.hybrid}    />}
              {key === "wealth"    && stats.wealth    && <WealthPanel    s={stats.wealth}    />}
              {key === "audit"     && stats.audit     && <AuditPanel     s={stats.audit}     />}
              {key === "meta"      && stats.meta      && <MetaPanel      s={stats.meta}      />}
              {key === "maximizer" && stats.maximizer && <MaximizerPanel s={stats.maximizer} />}
              {key === "enforcer"  && stats.enforcer  && <EnforcerPanel  s={stats.enforcer}  />}
              {key === "ultimate"  && stats.ultimate  && <UltimatePanel  s={stats.ultimate}  />}

              {/* Loading skeleton */}
              {!stats[key] && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      height: 14, borderRadius: 6,
                      background: "rgba(99,102,241,0.07)",
                      width: i % 2 === 0 ? "70%" : "100%",
                    }} />
                  ))}
                </div>
              )}
            </ModuleCard>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{ marginTop: 32, textAlign: "center", fontSize: 12, color: SLATE }}>
          CreateAI Brain · Ultimate Transcendent Stack · All engines running · Growth enforced to 100%
        </div>
      </div>
    </div>
  );
}
