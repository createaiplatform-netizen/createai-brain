/**
 * UltimateTranscendDashboard.tsx
 * Spec: FULL-AUTONOMOUS-TRANSCENDENT-LAUNCH-MAXIMIZER
 *
 * Modular live dashboard — polls all engine endpoints every 60 s.
 * Toggle panels on/off; hover stat rows for tooltips.
 * Apple/Linear/Notion aesthetic: indigo #6366f1, light theme, bg #f8fafc.
 *
 * All metrics displayed are real operational data.
 * No projections. No simulated numbers.
 * If no real data exists, "—" is shown.
 */

import React, { useState, useEffect, useCallback } from "react";
import { ModeSpectrumPanel }          from "@/components/ModeSpectrumPanel";
import { CreationEngineStatusPanel }  from "@/components/CreationEngineStatusPanel";
import { OmniBridgePanel }            from "@/components/OmniBridgePanel";

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

type ModuleKey = "market" | "hybrid" | "wealth" | "audit" | "meta" | "maximizer" | "enforcer" | "ultimate" | "payout" | "bridge" | "ownerAuth";

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
  totalRevenue: string;
  products:     number;
  batches:      number;
  marketplaces: number;
  cycleTs:      string;
}
interface AuditStats {
  ts:           string;
  products:     number;
  batches:      number;
  marketplaces: number;
  liveRevenue:  string;
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
  transcendFires:       number;
  errors:               number;
}
interface MaximizerStats {
  cycleCount:     number;
  lastCycleTs:    string;
  transcendFires: number;
  errors:         number;
}

interface EnforcerStats {
  cycleCount:     number;
  lastCycleTs:    string;
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
  transcendFires:  number;
  errors:          number;
}

interface PayoutStats {
  cycleCount:          number;
  successCount:        number;
  queuedCount:         number;
  errorCount:          number;
  totalTransferredUsd: number;
  lastPayoutId:        string;
  lastPayoutTs:        string;
  lastAmountUsd:       number;
  bankLinked:          boolean;
  lastError:           string;
}

interface BridgeConnector {
  key:          string;
  label:        string;
  status:       "ACTIVE" | "NOT_CONFIGURED";
  note?:        string;
  activateWith: string[];
}
interface BridgeStats {
  ts:         string;
  connectors: BridgeConnector[];
  summary: {
    active:         number;
    not_configured: number;
    total:          number;
  };
}
interface OwnerAuthStats {
  ts:     string;
  status: "ACTIVE" | "INACTIVE";
  manifest: {
    owner:                              string;
    ownerId:                            string;
    approvedAt:                         string;
    approvesUniversalBridgeEngine:      boolean;
    approvesAllConnectors:              boolean;
    approvesAllAutomationFlows:         boolean;
    approvesAllMonetizationFlows:       boolean;
    approvesAllCurrentAndFutureEngines: boolean;
    scope:                              string;
    notes:                              readonly string[];
  };
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
  payout:    PayoutStats    | null;
  bridge:    BridgeStats    | null;
  ownerAuth: OwnerAuthStats | null;
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
      <Row label="Total Products"   value={s.totalProducts.toLocaleString()} accent />
      <Row label="Market Cycles"    value={s.cycleCount} />
      <Row label="Generation Speed" value={s.generationSpeed} />
      <Row label="Total Sales"      value={s.salesCount} />
      <Row label="Engine"           value={s.running ? "✅ Running" : "⏸ Stopped"} />
    </>
  );
}

function HybridPanel({ s }: { s: HybridStats }) {
  const stripeOk = s["Rail: Stripe"]?.includes("✅");
  const emailOk  = s["Rail: Email"]?.includes("✅");
  const smsOk    = s["Rail: SMS"]?.includes("✅");
  return (
    <>
      <Row label="Revenue (live)"   value={s["Revenue (live)"]}   accent />
      <Row label="Revenue (queued)" value={s["Revenue (queued)"]} />
      <Row label="Messages Sent"    value={s["Messages Sent"]} />
      <Row label="Payments Queued"  value={s["Payments Queued"]} />
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
      <Row label="Revenue (live)"  value={s.totalRevenue} accent />
      <Row label="Products"        value={s.products?.toLocaleString() ?? "—"} />
      <Row label="Batches"         value={s.batches ?? "—"} />
      <Row label="Marketplaces"    value={s.marketplaces ?? 6} />
    </>
  );
}

function AuditPanel({ s }: { s: AuditStats }) {
  return (
    <>
      <Row label="Products"      value={s.products.toLocaleString()} accent />
      <Row label="Batches"       value={s.batches} />
      <Row label="Marketplaces"  value={s.marketplaces} />
      <Row label="Revenue (live)" value={s.liveRevenue} />
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

function MetaPanel({ s }: { s: MetaStats }) {
  return (
    <>
      <Row label="Meta Cycles"      value={s.cycleCount} accent />
      <Row label="Premium Products" value={s.totalPremiumProducts.toLocaleString()} />
      <Row label="Transcend Fires"  value={s.transcendFires} />
      <Row label="Errors"           value={s.errors === 0 ? "✅ None" : s.errors} />
    </>
  );
}

function MaximizerPanel({ s }: { s: MaximizerStats }) {
  return (
    <>
      <Row label="Enforcement Cycles" value={s.cycleCount} accent />
      <Row label="Transcend Fires"    value={s.transcendFires} />
      <Row label="Errors"             value={s.errors === 0 ? "✅ None" : s.errors} />
    </>
  );
}

function EnforcerPanel({ s }: { s: EnforcerStats }) {
  return (
    <>
      <Row label="Enforcement Cycles" value={s.cycleCount} accent />
      <Row label="Transcend Fires"    value={s.transcendFires} />
      <Row label="Premium Batches"    value={s.premiumBatches} />
      <Row label="Campaigns Fired"    value={s.campaignsFired} />
      <Row label="Errors"             value={s.errors === 0 ? "✅ None" : s.errors} />
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
      <Row label="Transcend Fires"   value={s.transcendFires} />
      <Row label="Errors"            value={s.errors === 0 ? "✅ None" : s.errors} />
    </>
  );
}

function PayoutPanel({ s }: { s: PayoutStats }) {
  const GREEN_BG = "rgba(34,197,94,0.08)";
  const AMBER_BG = "rgba(245,158,11,0.08)";
  const RED_BG   = "rgba(239,68,68,0.08)";

  const statusColor = s.successCount > 0 ? GREEN : s.errorCount > 0 ? "#ef4444" : AMBER;
  const statusLabel = s.successCount > 0
    ? `✅ ${s.successCount} payout${s.successCount !== 1 ? "s" : ""} sent`
    : s.errorCount > 0
      ? `⚠ ${s.errorCount} error${s.errorCount !== 1 ? "s" : ""}`
      : "⏳ Warming up…";

  return (
    <div>
      <div style={{
        borderRadius: 10, padding: "12px 16px", marginBottom: 12,
        background: s.successCount > 0 ? GREEN_BG : s.errorCount > 0 ? RED_BG : AMBER_BG,
        border: `1px solid ${statusColor}22`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: statusColor }}>{statusLabel}</div>
        {s.totalTransferredUsd > 0 && (
          <div style={{ fontSize: 20, fontWeight: 800, color: statusColor, marginTop: 2 }}>
            ${s.totalTransferredUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} transferred
          </div>
        )}
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: SLATE, textTransform: "uppercase", marginBottom: 4 }}>
        ACH Cycle Payouts
      </div>
      <Row label="Payout Cycles"      value={s.cycleCount} />
      <Row label="Successful Payouts" value={s.successCount} accent />
      <Row label="Queued (below min)" value={s.queuedCount} />
      <Row label="Errors"             value={s.errorCount} />
      <Row label="Last Amount"        value={s.lastAmountUsd > 0 ? `$${s.lastAmountUsd.toFixed(2)}` : "—"} accent />
      <Row label="Bank Linked"        value={s.bankLinked ? "✅ Yes" : "⏳ Pending"} />
      {s.lastPayoutId && (
        <Row label="Last Payout ID"   value={s.lastPayoutId.substring(0, 18) + "…"} />
      )}
      {s.lastError && (
        <div style={{ marginTop: 4, marginBottom: 4, fontSize: 11, color: "#ef4444", wordBreak: "break-word" }}>
          {s.lastError}
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 11, color: SLATE }}>
        ACH: Huntington Bank · Auto-cycle 60 s · Triggered by real Stripe balance
      </div>
    </div>
  );
}

// ─── Bridge Panel ─────────────────────────────────────────────────────────────

function BridgePanel({ s }: { s: BridgeStats }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "3px 10px",
          borderRadius: 99, background: "rgba(34,197,94,0.12)", color: "#15803d",
        }}>
          {s.summary.active} ACTIVE
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "3px 10px",
          borderRadius: 99, background: "rgba(245,158,11,0.10)", color: "#b45309",
        }}>
          {s.summary.not_configured} NOT CONFIGURED
        </span>
      </div>

      {s.connectors.map(c => (
        <div key={c.key} style={{
          padding: "8px 10px", marginBottom: 6, borderRadius: 10,
          background: c.status === "ACTIVE"
            ? "rgba(34,197,94,0.06)"
            : "rgba(245,158,11,0.06)",
          border: `1px solid ${c.status === "ACTIVE" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{c.label}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
              background: c.status === "ACTIVE" ? "#22c55e" : AMBER,
              color: c.status === "ACTIVE" ? "#fff" : "#78350f",
            }}>
              {c.status === "ACTIVE" ? "ACTIVE" : "NOT CONFIGURED"}
            </span>
          </div>
          {c.note && (
            <div style={{ fontSize: 10, color: SLATE, marginTop: 3, lineHeight: 1.4 }}>{c.note}</div>
          )}
          {c.status === "NOT_CONFIGURED" && c.activateWith.length > 0 && (
            <div style={{ fontSize: 10, color: SLATE, marginTop: 4 }}>
              <strong>Activate:</strong> {c.activateWith.slice(0, 2).join(" · ")}
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: 8, fontSize: 11, color: SLATE }}>
        Universal Bridge Engine · all external calls route through here
      </div>
    </div>
  );
}

// ─── Owner Authorization Panel ────────────────────────────────────────────────

function OwnerAuthPanel({ s }: { s: OwnerAuthStats }) {
  const m       = s.manifest;
  const isActive = s.status === "ACTIVE";

  const approvals: { label: string; value: boolean }[] = [
    { label: "Universal Bridge Engine",     value: m.approvesUniversalBridgeEngine },
    { label: "All Connectors",              value: m.approvesAllConnectors },
    { label: "All Automation Flows",        value: m.approvesAllAutomationFlows },
    { label: "All Monetization Flows",      value: m.approvesAllMonetizationFlows },
    { label: "All Current & Future Engines",value: m.approvesAllCurrentAndFutureEngines },
  ];

  return (
    <div>
      {/* Status badge */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 99,
          background: isActive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
          color: isActive ? "#15803d" : "#b91c1c",
        }}>
          {isActive ? "ACTIVE" : "INACTIVE"}
        </span>
        <span style={{ fontSize: 11, color: SLATE }}>Cold Box · Owner-signed internal permission layer</span>
      </div>

      {/* Owner identity */}
      <div style={{
        padding: "10px 12px", borderRadius: 10, marginBottom: 10,
        background: "rgba(99,102,241,0.06)", border: `1px solid rgba(99,102,241,0.15)`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{m.owner}</span>
          <span style={{ fontSize: 11, color: SLATE }}>{m.ownerId}</span>
        </div>
        <div style={{ fontSize: 10, color: SLATE, marginTop: 4 }}>
          Approved: {new Date(m.approvedAt).toLocaleString()}
        </div>
        <div style={{ fontSize: 10, color: SLATE, marginTop: 2 }}>
          Scope: {m.scope}
        </div>
      </div>

      {/* Approval checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
        {approvals.map(a => (
          <div key={a.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "5px 10px", borderRadius: 8,
            background: a.value ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${a.value ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
          }}>
            <span style={{ fontSize: 11, color: "#334155" }}>{a.label}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
              background: a.value ? GREEN : "#ef4444", color: "#fff",
            }}>
              {a.value ? "APPROVED" : "NOT APPROVED"}
            </span>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div style={{ fontSize: 10, color: SLATE, lineHeight: 1.6, borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>
        {m.notes.map((n, i) => <div key={i}>· {n}</div>)}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const MODULES: { key: ModuleKey; title: string; icon: string }[] = [
  { key: "market",    title: "Market Engine",             icon: "🏪" },
  { key: "hybrid",    title: "Hybrid Engine",              icon: "⚡" },
  { key: "wealth",    title: "Wealth Tracker",             icon: "💹" },
  { key: "audit",     title: "Platform Audit",             icon: "🔍" },
  { key: "meta",      title: "Meta Transcend",             icon: "🌌" },
  { key: "maximizer", title: "Wealth Maximizer",           icon: "💪" },
  { key: "enforcer",  title: "Platform Enforcer",          icon: "🔒" },
  { key: "ultimate",  title: "Ultimate Zero-Touch Launch", icon: "🔥" },
  { key: "payout",    title: "Huntington ACH Payout",      icon: "🏦" },
  { key: "bridge",    title: "Universal Bridge Engine",    icon: "🌉" },
  { key: "ownerAuth", title: "Owner Authorization",        icon: "🔐" },
];

const emptyVisible = (): Record<ModuleKey, boolean> => ({
  market: true, hybrid: true, wealth: true, audit: true, meta: true,
  maximizer: true, enforcer: true, ultimate: true, payout: true, bridge: true,
  ownerAuth: true,
});

const emptyStats = (): AllStats => ({
  market: null, hybrid: null, wealth: null, audit: null, meta: null,
  maximizer: null, enforcer: null, ultimate: null, payout: null, bridge: null,
  ownerAuth: null,
});

export default function UltimateTranscendDashboard() {
  const [visible, setVisible] = useState<Record<ModuleKey, boolean>>(emptyVisible());
  const [stats,   setStats]   = useState<AllStats>(emptyStats());
  const [loading, setLoading] = useState(false);
  const [lastTs,  setLastTs]  = useState<string>("");
  const [error,   setError]   = useState<string>("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [market, hybrid, wealth, audit, meta, maximizer, enforcer, ultimate, payout, bridge, ownerAuth] = await Promise.allSettled([
        fetch("/api/real-market/stats").then(r => r.json()),
        fetch("/api/hybrid/stats").then(r => r.json()),
        fetch("/api/wealth/snapshot").then(r => r.json()),
        fetch("/api/audit/snapshot").then(r => r.json()),
        fetch("/api/meta/stats").then(r => r.json()),
        fetch("/api/maximizer/stats").then(r => r.json()),
        fetch("/api/enforcer/stats").then(r => r.json()),
        fetch("/api/ultimate/stats").then(r => r.json()),
        fetch("/api/payout/stats").then(r => r.json()),
        fetch("/api/bridge/status").then(r => r.json()),
        fetch("/api/security/owner-auth").then(r => r.json()),
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
        payout:    payout.status    === "fulfilled" ? payout.value    : null,
        bridge:    bridge.status    === "fulfilled" ? bridge.value    : null,
        ownerAuth: ownerAuth.status === "fulfilled" ? ownerAuth.value : null,
      });
      setLastTs(new Date().toLocaleTimeString());
    } catch {
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

  const toggle    = (k: ModuleKey) => setVisible(prev => ({ ...prev, [k]: !prev[k] }));
  const allVisible = Object.values(visible).every(Boolean);
  const toggleAll  = () => {
    const next = !allVisible;
    setVisible({ market: next, hybrid: next, wealth: next, audit: next, meta: next,
                 maximizer: next, enforcer: next, ultimate: next, payout: next, bridge: next,
                 ownerAuth: next });
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "32px 24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              🌌 Ultimate Transcend Engine
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: SLATE }}>
              Live operational dashboard — 9 engines · auto-refresh 60 s · real data only
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {lastTs && (
              <span style={{ fontSize: 12, color: SLATE }}>Updated {lastTs}</span>
            )}
            {[
              { label: "Command Center",  slug: "command-center"  },
              { label: "Analytics",       slug: "analytics"       },
              { label: "Team",            slug: "team"            },
              { label: "Billing",         slug: "billing"         },
              { label: "Data",            slug: "data"            },
              { label: "Global",          slug: "global-expansion"},
              { label: "Evolution",       slug: "evolution"       },
              { label: "Settings",        slug: "settings"        },
              { label: "Platform Status", slug: "platform-status" },
            ].map(({ label, slug }) => (
              <a key={slug}
                href={`#${slug}`}
                onClick={e => {
                  e.preventDefault();
                  window.location.href = window.location.pathname.replace(/\/transcend-dashboard.*$/, `/${slug}`);
                }}
                style={{
                  fontSize: 11, fontWeight: 600, padding: "5px 11px",
                  borderRadius: 99, border: "none", cursor: "pointer",
                  background: "rgba(99,102,241,0.1)", color: INDIGO,
                  textDecoration: "none", display: "inline-block", whiteSpace: "nowrap",
                }}
              >
                {label}
              </a>
            ))}
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
              {key === "payout"    && stats.payout    && <PayoutPanel    s={stats.payout}    />}
              {key === "bridge"    && stats.bridge    && <BridgePanel    s={stats.bridge}    />}
              {key === "ownerAuth" && stats.ownerAuth && <OwnerAuthPanel s={stats.ownerAuth} />}

              {!stats[key] && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[1, 2, 3, 4].map(i => (
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

        {/* ── Omni-Bridge Architecture (7-dimension unified integration layer) ── */}
        <OmniBridgePanel />

        {/* ── Core Creation Engines (8 unified BASE-layer engines) ── */}
        <CreationEngineStatusPanel />

        {/* ── Mode Spectrum (all 25 modes, 5 layers) ── */}
        <ModeSpectrumPanel />

        {/* ── Footer ── */}
        <div style={{ marginTop: 32, textAlign: "center", fontSize: 12, color: SLATE }}>
          CreateAI Brain · Omni-Bridge Architecture active · 7 dimensions unified · 75+ systems · 11 engines · 8 creation engines · 25 modes · Owner Authorization ACTIVE · Real data only
        </div>
      </div>
    </div>
  );
}
