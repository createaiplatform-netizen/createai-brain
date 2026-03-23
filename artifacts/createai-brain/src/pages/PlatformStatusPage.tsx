/**
 * PlatformStatusPage.tsx — CreateAI Brain · Platform Status
 *
 * Real-time view of all engines, connectors, and rails.
 * Owner-only admin actions: Clear message queue, reset circuit breakers.
 * All data is real — no projections, no fake metrics.
 *
 * Route: /platform-status (public, no auth gate)
 */

import React, { useState, useEffect, useCallback } from "react";
import useSEO from "@/hooks/useSEO";

// ─── Design tokens ─────────────────────────────────────────────────────────

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
const WHITE   = "#ffffff";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ConnectorStatus {
  key:    string;
  label:  string;
  status: "ACTIVE" | "NOT_CONFIGURED";
  actions?: string[];
}

interface BridgeStatus {
  connectors:     ConnectorStatus[];
  active:         number;
  not_configured: number;
  total:          number;
}

interface HybridStats {
  "Rail: Stripe":    string;
  "Rail: Email":     string;
  "Rail: SMS":       string;
  "Revenue (live)":  string;
  "Revenue (queued)":string;
  "Messages Sent":   number;
  "Messages Queued": number;
  "Payments Queued": number;
  externalChannels?: Array<{ channel: string; live: boolean; envKey?: string }>;
}

interface MarketStats {
  totalProducts:   number;
  cycleCount:      number;
  generationSpeed: number;
  salesCount:      number;
  running:         boolean;
}

interface OmniHealth {
  healthScore:   number;
  totalSystems:  number;
  activeSystems: number;
}

interface AllData {
  bridge:  BridgeStatus  | null;
  hybrid:  HybridStats   | null;
  market:  MarketStats   | null;
  omni:    OmniHealth    | null;
}

// ─── Helper components ─────────────────────────────────────────────────────

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-block", fontSize: 11, fontWeight: 700,
      letterSpacing: "0.04em", padding: "2px 10px", borderRadius: 99,
      background: color + "18", color,
    }}>
      {label}
    </span>
  );
}

function RailRow({ label, value }: { label: string; value: string }) {
  const isLive    = value.includes("✅");
  const isOpen    = value.includes("⚡");
  const isOffline = value.includes("⏸");
  const color = isLive ? GREEN : isOpen ? AMBER : isOffline ? SLATE : SLATE;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 16px", borderBottom: `1px solid ${BORDER}`,
    }}>
      <span style={{ fontSize: 13, color: DARK, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function ConnectorRow({ c }: { c: ConnectorStatus }) {
  const active = c.status === "ACTIVE";
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 16px", borderBottom: `1px solid ${BORDER}`,
    }}>
      <div>
        <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{c.label}</span>
        {!active && c.actions && c.actions[0] && (
          <div style={{ fontSize: 11, color: SLATE, marginTop: 2 }}>
            Add: {c.actions[0]}
          </div>
        )}
      </div>
      <Pill label={active ? "✅ Active" : "Not Configured"} color={active ? GREEN : SLATE} />
    </div>
  );
}

function SectionCard({
  title, icon, children,
}: {
  title: string; icon: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 16, boxShadow: SHADOW, overflow: "hidden",
      marginBottom: 20,
    }}>
      <div style={{
        padding: "14px 16px 12px", borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 16px", borderBottom: `1px solid ${BORDER}`,
    }}>
      <span style={{ fontSize: 13, color: SLATE }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: DARK, fontVariantNumeric: mono ? "tabular-nums" : undefined }}>
        {String(value)}
      </span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function PlatformStatusPage() {
  useSEO({
    title:       "Platform Status — CreateAI Brain System Health & Uptime",
    description: "Live status monitoring for all CreateAI Brain services, AI connectors, APIs, and platform engines. Real-time health checks, updated continuously.",
    url:         "https://createai.digital/platform-status",
    keywords:    "platform status, system health, API uptime, CreateAI Brain status page",
    jsonLD: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Platform Status — CreateAI Brain",
      "url": "https://createai.digital/platform-status",
      "description": "Real-time system health and uptime monitoring for CreateAI Brain.",
      "isPartOf": { "@type": "WebSite", "url": "https://createai.digital" }
    }
  });

  const [data,      setData]      = useState<AllData>({ bridge: null, hybrid: null, market: null, omni: null });
  const [loading,   setLoading]   = useState(false);
  const [lastTs,    setLastTs]    = useState("");
  const [clearing,  setClearing]  = useState(false);
  const [clearMsg,  setClearMsg]  = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bridge, hybrid, market, omni] = await Promise.allSettled([
        fetch("/api/bridge/status").then(r => r.json()),
        fetch("/api/hybrid/stats").then(r => r.json()),
        fetch("/api/real-market/stats").then(r => r.json()),
        fetch("/api/omni-bridge/health").then(r => r.json()),
      ]);
      setData({
        bridge: bridge.status === "fulfilled" ? bridge.value  as BridgeStatus  : null,
        hybrid: hybrid.status === "fulfilled" ? hybrid.value  as HybridStats   : null,
        market: market.status === "fulfilled" ? market.value  as MarketStats   : null,
        omni:   omni.status   === "fulfilled" ? omni.value    as OmniHealth    : null,
      });
      setLastTs(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const clearQueue = async () => {
    setClearing(true);
    setClearMsg("");
    try {
      const res  = await fetch("/api/hybrid/clear-queue", { method: "POST" });
      const data = await res.json();
      setClearMsg(data.message ?? "Queue cleared.");
      await fetchAll();
    } catch {
      setClearMsg("Failed to clear queue — try again.");
    } finally {
      setClearing(false);
    }
  };

  const { bridge, hybrid, market, omni } = data;

  const healthScore = omni?.healthScore ?? "—";
  const activeSystems = omni ? `${omni.activeSystems}/${omni.totalSystems}` : "—";

  return (
    <div style={{
      minHeight: "100vh", background: BG, padding: "0 0 60px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${DARK} 0%, #1e1b4b 60%, #312e81 100%)`,
        padding: "20px 24px 28px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { label: "← Dashboard",     slug: "transcend-dashboard" },
              { label: "Command Center",  slug: "command-center"      },
              { label: "Analytics",       slug: "analytics"           },
              { label: "Team",            slug: "team"                },
              { label: "Billing",         slug: "billing"             },
              { label: "Data",            slug: "data"                },
              { label: "Global",          slug: "global-expansion"    },
              { label: "Evolution",       slug: "evolution"           },
              { label: "Settings",        slug: "settings"            },
            ].map(({ label, slug }) => (
              <a key={slug}
                href={`#${slug}`}
                onClick={e => {
                  e.preventDefault();
                  window.location.href = window.location.pathname.replace(/\/platform-status.*$/, `/${slug}`);
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
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🔬</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: WHITE, letterSpacing: "-0.03em" }}>
                Platform Status
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em" }}>
                ALL ENGINES · ALL CONNECTORS · ALL RAILS
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 0" }}>

        {/* ── Refresh bar ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 20, flexWrap: "wrap", gap: 10,
        }}>
          <span style={{ fontSize: 12, color: SLATE }}>
            {lastTs ? `Last updated ${lastTs} · auto-refresh 30 s` : "Loading…"}
          </span>
          <button
            onClick={fetchAll}
            disabled={loading}
            style={{
              fontSize: 12, fontWeight: 600, padding: "6px 16px",
              borderRadius: 99, border: "none", cursor: "pointer",
              background: INDIGO, color: WHITE, opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Refreshing…" : "Refresh Now"}
          </button>
        </div>

        {/* ── Overall Health ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12, marginBottom: 20,
        }}>
          {[
            { label: "OmniBridge Health", value: `${healthScore}/100`, color: (omni?.healthScore ?? 0) >= 90 ? GREEN : AMBER },
            { label: "Active Systems",    value: activeSystems,          color: INDIGO },
            { label: "Bridge Connectors", value: bridge ? `${bridge.active}/${bridge.total} active` : "—", color: bridge && bridge.active === bridge.total ? GREEN : AMBER },
            { label: "Revenue Live",      value: hybrid?.["Revenue (live)"] ?? "—",  color: DARK },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
              boxShadow: SHADOW, padding: "16px 18px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: SLATE, letterSpacing: "0.05em", marginBottom: 6, textTransform: "uppercase" }}>
                {label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: "-0.02em" }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20 }}>

          {/* ── Left Column ── */}
          <div>
            {/* Hybrid Rails */}
            <SectionCard title="Hybrid Engine Rails" icon="⚡">
              {hybrid ? (
                <>
                  {(["Rail: Stripe", "Rail: Email", "Rail: SMS"] as const).map(k => (
                    <RailRow key={k} label={k.replace("Rail: ", "")} value={String(hybrid[k])} />
                  ))}
                  <StatRow label="Revenue (live)"   value={hybrid["Revenue (live)"]}   mono />
                  <StatRow label="Revenue (queued)" value={hybrid["Revenue (queued)"]} mono />
                  <StatRow label="Messages Sent"    value={hybrid["Messages Sent"]}    mono />
                  <StatRow label="Messages Queued"  value={hybrid["Messages Queued"]}  mono />
                  <StatRow label="Payments Queued"  value={hybrid["Payments Queued"]}  mono />
                </>
              ) : (
                <div style={{ padding: "16px", color: SLATE, fontSize: 13 }}>Loading rails…</div>
              )}

              {/* Clear Queue Admin Action */}
              <div style={{ padding: "14px 16px", background: "#fffbeb", borderTop: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 12, color: SLATE, marginBottom: 8 }}>
                  <strong>Admin Action:</strong> Clear the message queue and reset circuit breakers.
                  Use after updating credentials or resolving send errors.
                </div>
                <button
                  onClick={clearQueue}
                  disabled={clearing}
                  style={{
                    fontSize: 12, fontWeight: 700, padding: "7px 16px",
                    borderRadius: 8, border: "none", cursor: "pointer",
                    background: AMBER, color: WHITE,
                    opacity: clearing ? 0.6 : 1,
                  }}
                >
                  {clearing ? "Clearing…" : "🧹 Clear Queue + Reset Circuits"}
                </button>
                {clearMsg && (
                  <div style={{ fontSize: 12, color: GREEN, marginTop: 8, fontWeight: 600 }}>
                    ✅ {clearMsg}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* RealMarket Engine */}
            <SectionCard title="RealMarket Engine" icon="📦">
              {market ? (
                <>
                  <StatRow label="Status"           value={market.running ? "✅ Running" : "⏸ Stopped"} />
                  <StatRow label="Total Products"   value={market.totalProducts}   mono />
                  <StatRow label="Cycle Count"      value={market.cycleCount}      mono />
                  <StatRow label="Generation Speed" value={market.generationSpeed} mono />
                  <StatRow label="Sales"            value={market.salesCount}      mono />
                </>
              ) : (
                <div style={{ padding: "16px", color: SLATE, fontSize: 13 }}>Loading market stats…</div>
              )}
              <div style={{ padding: "14px 16px", borderTop: `1px solid ${BORDER}`, fontSize: 12, color: SLATE }}>
                Product creation pauses automatically at 500 products when no external marketplace is configured.
                Add <code style={{ fontSize: 11, background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>SHOPIFY_ACCESS_TOKEN</code> or similar to enable external publishing.
              </div>
            </SectionCard>
          </div>

          {/* ── Right Column ── */}
          <div>
            {/* Bridge Connectors */}
            <SectionCard title="Bridge Connectors" icon="🌉">
              {bridge?.connectors ? (
                bridge.connectors.map(c => <ConnectorRow key={c.key} c={c} />)
              ) : (
                <div style={{ padding: "16px", color: SLATE, fontSize: 13 }}>Loading connectors…</div>
              )}
            </SectionCard>

            {/* External Marketplace Channels */}
            <SectionCard title="External Marketplace Channels" icon="🛒">
              {hybrid?.externalChannels ? (
                hybrid.externalChannels.map(ch => (
                  <div key={ch.channel} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 16px", borderBottom: `1px solid ${BORDER}`,
                  }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{ch.channel}</span>
                      {!ch.live && ch.envKey && (
                        <div style={{ fontSize: 11, color: SLATE, marginTop: 2 }}>
                          Add: <code style={{ fontSize: 10, background: "#f1f5f9", padding: "1px 4px", borderRadius: 4 }}>{ch.envKey}</code>
                        </div>
                      )}
                    </div>
                    <Pill label={ch.live ? "✅ Live" : "Not Connected"} color={ch.live ? GREEN : SLATE} />
                  </div>
                ))
              ) : (
                <div style={{ padding: "16px", color: SLATE, fontSize: 13 }}>
                  No external marketplace channels configured.
                </div>
              )}
              <div style={{ padding: "14px 16px", borderTop: `1px solid ${BORDER}`, fontSize: 12, color: SLATE }}>
                Add marketplace API credentials via Replit Secrets to enable live external publishing.
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ── What needs credentials ── */}
        <SectionCard title="To Activate External Publishing" icon="🔑">
          <div style={{ padding: "16px 16px 4px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {[
                { label: "Shopify",          key: "SHOPIFY_ACCESS_TOKEN",    what: "Publish products to Shopify store" },
                { label: "Etsy",             key: "ETSY_API_KEY",            what: "List digital products on Etsy" },
                { label: "Amazon",           key: "AMAZON_SP_ACCESS_TOKEN",  what: "List via Amazon Selling Partner API" },
                { label: "eBay",             key: "EBAY_OAUTH_TOKEN",        what: "List products on eBay" },
                { label: "Creative Market",  key: "CREATIVEMARKET_API_KEY",  what: "Publish to Creative Market" },
                { label: "Resend Domain",    key: "RESEND_FROM_EMAIL",       what: "Send email from your verified domain" },
                { label: "Twilio Phone",     key: "TWILIO_PHONE",            what: "Send SMS from your Twilio number" },
              ].map(item => (
                <div key={item.key} style={{
                  background: BG, border: `1px solid ${BORDER}`,
                  borderRadius: 10, padding: "12px 14px", marginBottom: 8,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <code style={{ fontSize: 11, background: "#e0e7ff", color: INDIGO, padding: "2px 7px", borderRadius: 5, display: "inline-block", marginBottom: 6 }}>
                    {item.key}
                  </code>
                  <div style={{ fontSize: 11, color: SLATE }}>{item.what}</div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
