/**
 * GlobalPage.tsx — CreateAI Brain · Global Expansion
 *
 * Phases covered:
 *   Phase 7  — Global Expansion
 *   Phase 36 — Load Balancing & Scaling
 *   Phase 37 — High Availability Infrastructure
 *   Phase 38 — Redundancy & Failover Systems
 *   Phase 39 — Global CDN & Edge Distribution
 *   Phase 51 — Cross-Industry Expansion
 *   Phase 52 — Government & Public Sector Layer
 *   Phase 53 — Healthcare Deep Integration
 *   Phase 54 — Education & Workforce Layer
 *   Phase 55 — Enterprise-Grade Automation
 *   Phase 56 — AI-Driven Optimization
 *   Phase 58 — Autonomous Operations Layer
 *   Phase 59 — Global Network Integration
 *   Phase 60 — Final System Completion
 *   Meta-Phase 5  — Domain Expansion Layer
 *   Meta-Phase 6  — Global Interoperability Layer
 *   Meta-Phase 30 — Infinite Expansion Layer
 */

import React, { useState, useEffect, useCallback } from "react";

const INDIGO = "#6366f1";
const BG     = "#f8fafc";
const CARD   = "#ffffff";
const BORDER = "rgba(0,0,0,0.07)";
const SHADOW = "0 1px 8px rgba(0,0,0,0.05)";
const SLATE  = "#64748b";
const DARK   = "#0f172a";
const GREEN  = "#22c55e";
const AMBER  = "#f59e0b";
const RED    = "#ef4444";
const PURPLE = "#8b5cf6";

const NAV_LINKS = [
  { label: "Dashboard",       href: "/transcend-dashboard" },
  { label: "Command Center",  href: "/command-center" },
  { label: "Analytics",       href: "/analytics" },
  { label: "Team",            href: "/team" },
  { label: "Billing",         href: "/billing" },
  { label: "Data",            href: "/data" },
  { label: "Global",          href: "/global-expansion",  active: true },
  { label: "Evolution",       href: "/evolution" },
  { label: "Semantic Store",  href: "/semantic-store" },
  { label: "Settings",        href: "/settings" },
  { label: "Platform Status", href: "/platform-status" },
];

interface RegionStatus {
  name:     string;
  code:     string;
  status:   "active" | "standby" | "planned";
  latencyMs?: number;
  industries: string[];
  users:    string;
}

const REGIONS: RegionStatus[] = [
  {
    name: "North America",   code: "NA",  status: "active",
    latencyMs: 12, users: "Primary",
    industries: ["Finance", "Healthcare", "Technology", "Education"],
  },
  {
    name: "Europe",          code: "EU",  status: "standby",
    users: "Configured · inactive",
    industries: ["Finance", "Legal", "Manufacturing", "Healthcare"],
  },
  {
    name: "Asia-Pacific",    code: "APAC", status: "planned",
    users: "Planned",
    industries: ["Technology", "Manufacturing", "Trade", "Education"],
  },
  {
    name: "Latin America",   code: "LATAM", status: "planned",
    users: "Planned",
    industries: ["Agriculture", "Finance", "Energy", "Trade"],
  },
  {
    name: "Middle East",     code: "ME",  status: "planned",
    users: "Planned",
    industries: ["Energy", "Finance", "Government", "Healthcare"],
  },
  {
    name: "Africa",          code: "AF",  status: "planned",
    users: "Planned",
    industries: ["Agriculture", "Healthcare", "Education", "Finance"],
  },
  {
    name: "South Asia",      code: "SA",  status: "planned",
    users: "Planned",
    industries: ["Technology", "Healthcare", "Education", "Finance"],
  },
];

const INDUSTRY_SECTORS = [
  { name: "Healthcare",       phase: "Phase 53", icon: "🏥", status: "deep",     desc: "FHIR R4, HIPAA compliance, patient data integration" },
  { name: "Legal",            phase: "Phase 7",  icon: "⚖️", status: "active",   desc: "Contract analysis, case management, compliance" },
  { name: "Staffing",         phase: "Phase 7",  icon: "👥", status: "active",   desc: "Global talent placement, HR automation" },
  { name: "Finance",          phase: "Phase 7",  icon: "💰", status: "active",   desc: "Stripe integration, ACH payouts, wealth engine" },
  { name: "Education",        phase: "Phase 54", icon: "🎓", status: "planned",  desc: "Workforce development, certification, eLearning" },
  { name: "Government",       phase: "Phase 52", icon: "🏛",  status: "planned",  desc: "FedRAMP compliance, public sector automation" },
  { name: "Energy",           phase: "Phase 10", icon: "⚡", status: "active",   desc: "Solar/wind/grid monitoring, optimization" },
  { name: "Transport",        phase: "Phase 10", icon: "🚚", status: "active",   desc: "Route optimization, fleet management, OSM" },
  { name: "Water/Environment",phase: "Phase 10", icon: "💧", status: "active",   desc: "OpenAQ air quality, environmental monitoring" },
  { name: "Media",            phase: "Phase 10", icon: "📺", status: "active",   desc: "Streaming, content scheduling, analytics" },
  { name: "Telecom",          phase: "Phase 10", icon: "📡", status: "active",   desc: "Twilio SMS, phone services, network optimization" },
  { name: "Real Estate",      phase: "Phase 51", icon: "🏠", status: "planned",  desc: "Property management, market analysis" },
];

const HA_SYSTEMS = [
  { label: "Circuit Breaker",        desc: "3-failure threshold · 30-min auto-reset",                status: "active" },
  { label: "Message Queue Cap",      desc: "50-message limit · auto-drain on reset",                  status: "active" },
  { label: "Health Check Endpoints", desc: "GET /health returns live status in < 5ms",               status: "active" },
  { label: "Auto-restart",           desc: "Replit workflow supervisor on crash",                      status: "active" },
  { label: "Rate Limiting",          desc: "Per-route, per-user middleware on all sensitive endpoints",status: "active" },
  { label: "DB Connection Pool",     desc: "PostgreSQL pool with automatic reconnect",                 status: "active" },
  { label: "Geographic Failover",    desc: "Configure multi-region in Settings → Regions",             status: "planned" },
  { label: "Load Balancer",          desc: "Replit platform handles routing and TLS termination",      status: "active" },
];

const CDN_EDGES = [
  { city: "Ashburn, VA",    region: "NA-East",  status: "active",   ms: 12   },
  { city: "Frankfurt",      region: "EU-Central",status: "standby", ms: null },
  { city: "Singapore",      region: "APAC",      status: "planned", ms: null },
  { city: "São Paulo",      region: "LATAM",     status: "planned", ms: null },
  { city: "Mumbai",         region: "South Asia",status: "planned", ms: null },
  { city: "Johannesburg",   region: "Africa",    status: "planned", ms: null },
];

export default function GlobalPage() {
  const [tab, setTab] = useState<"regions" | "industries" | "ha" | "cdn" | "phases">("regions");

  const statusColor = (s: string) =>
    s === "active" ? GREEN : s === "standby" ? AMBER : SLATE;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui,-apple-system,sans-serif" }}>

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

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: DARK, margin: 0 }}>Global Expansion</h1>
          <p style={{ fontSize: 14, color: SLATE, marginTop: 4 }}>
            Regions · Industries · High Availability · CDN · Final Phases (51–60) · Meta-Phases 5, 6, 30
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Active regions",      value: REGIONS.filter(r => r.status === "active").length.toString(),    color: GREEN  },
            { label: "Industry sectors",    value: INDUSTRY_SECTORS.length.toString(),                              color: INDIGO },
            { label: "HA systems active",   value: HA_SYSTEMS.filter(s => s.status === "active").length.toString(), color: PURPLE },
            { label: "CDN edge nodes",      value: CDN_EDGES.length.toString(),                                     color: AMBER  },
            { label: "Completion (Ph 51–60)",value: "2/10",                                                         color: DARK   },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16,
              padding: "18px 20px", boxShadow: SHADOW }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: SLATE, textTransform: "uppercase",
                letterSpacing: "0.06em", margin: 0 }}>{kpi.label}</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: kpi.color, marginTop: 6 }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: CARD,
          borderRadius: 12, padding: 4, border: `1px solid ${BORDER}`, width: "fit-content", flexWrap: "wrap" }}>
          {(["regions", "industries", "ha", "cdn", "phases"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 9, border: "none",
                cursor: "pointer", transition: "all 0.15s",
                background: tab === t ? INDIGO : "transparent",
                color: tab === t ? "#fff" : SLATE }}>
              {t === "ha" ? "High Availability" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Regions */}
        {tab === "regions" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
            {REGIONS.map(r => (
              <div key={r.code} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18,
                padding: "20px 22px", boxShadow: SHADOW }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: DARK, margin: 0 }}>{r.name}</p>
                    <p style={{ fontSize: 12, color: SLATE, margin: 0 }}>{r.users}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(r.status),
                      background: `${statusColor(r.status)}18`, padding: "3px 10px", borderRadius: 20 }}>
                      {r.status}
                    </span>
                    {r.latencyMs && (
                      <p style={{ fontSize: 11, color: SLATE, margin: "4px 0 0", textAlign: "right" }}>
                        {r.latencyMs}ms
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {r.industries.map(i => (
                    <span key={i} style={{ fontSize: 11, color: INDIGO, background: "rgba(99,102,241,0.09)",
                      padding: "2px 8px", borderRadius: 20 }}>
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Industries */}
        {tab === "industries" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {INDUSTRY_SECTORS.map(s => (
              <div key={s.name} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18,
                padding: "18px 20px", boxShadow: SHADOW }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: DARK, margin: 0 }}>{s.name}</p>
                    <span style={{ fontSize: 10, color: SLATE, background: "#e2e8f0",
                      padding: "2px 8px", borderRadius: 20 }}>{s.phase}</span>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <span style={{ fontSize: 11, fontWeight: 700,
                      color: s.status === "active" || s.status === "deep" ? GREEN : AMBER,
                      background: `${s.status === "active" || s.status === "deep" ? GREEN : AMBER}18`,
                      padding: "3px 9px", borderRadius: 20 }}>
                      {s.status === "deep" ? "deep integration" : s.status}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: SLATE, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* High Availability */}
        {tab === "ha" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "22px 24px", boxShadow: SHADOW, marginBottom: 4 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: "0 0 6px 0" }}>
                High Availability · Phases 36, 37, 38
              </h2>
              <p style={{ fontSize: 13, color: SLATE, margin: 0 }}>
                All redundancy and failover systems currently active in the platform.
              </p>
            </div>
            {HA_SYSTEMS.map(s => (
              <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
                padding: "14px 18px", boxShadow: SHADOW, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: s.status === "active" ? `${GREEN}18` : `${AMBER}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, color: s.status === "active" ? GREEN : AMBER }}>
                  {s.status === "active" ? "✓" : "○"}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: DARK, margin: 0 }}>{s.label}</p>
                  <p style={{ fontSize: 12, color: SLATE, margin: 0 }}>{s.desc}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700,
                  color: s.status === "active" ? GREEN : AMBER,
                  background: `${s.status === "active" ? GREEN : AMBER}18`,
                  padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CDN */}
        {tab === "cdn" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "22px 24px", boxShadow: SHADOW }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: "0 0 6px 0" }}>
                Global CDN & Edge Distribution · Phase 39
              </h2>
              <p style={{ fontSize: 13, color: SLATE, margin: "0 0 16px 0" }}>
                Replit's global infrastructure provides automatic CDN routing. Additional edge nodes
                can be configured as regional deployments are activated.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                {CDN_EDGES.map(e => (
                  <div key={e.city} style={{ padding: "14px 16px", background: "#f8fafc",
                    borderRadius: 14, border: `1px solid ${BORDER}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: DARK, margin: 0 }}>{e.city}</p>
                      <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(e.status),
                        background: `${statusColor(e.status)}18`, padding: "2px 8px", borderRadius: 20 }}>
                        {e.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: SLATE, margin: 0 }}>{e.region}</p>
                    {e.ms && <p style={{ fontSize: 11, color: GREEN, margin: 0, marginTop: 2 }}>{e.ms}ms avg latency</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Phases 51–60 */}
        {tab === "phases" && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "22px 24px", boxShadow: SHADOW }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: "0 0 16px 0" }}>
              Final Phases 51–60 & Meta-Phases 5, 6, 30
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { ph: "Phase 51",     label: "Cross-Industry Expansion",          done: true,  detail: "12 industry sectors active or planned" },
                { ph: "Phase 52",     label: "Government & Public Sector",         done: false, detail: "FedRAMP compliance framework configured in Settings" },
                { ph: "Phase 53",     label: "Healthcare Deep Integration",         done: true,  detail: "FHIR R4, HIPAA, SMART-on-FHIR OAuth active" },
                { ph: "Phase 54",     label: "Education & Workforce Layer",         done: false, detail: "Education route registered — UI page planned" },
                { ph: "Phase 55",     label: "Enterprise-Grade Automation",         done: true,  detail: "349 modules, 9 engines, zero-touch launch active" },
                { ph: "Phase 56",     label: "AI-Driven Optimization",             done: true,  detail: "GPT-4o execution packs, BeyondInfinity mode active" },
                { ph: "Phase 57",     label: "Predictive Intelligence Layer",      done: true,  detail: "Analytics page — pattern discovery, intent signals" },
                { ph: "Phase 58",     label: "Autonomous Operations Layer",        done: true,  detail: "Ultra Interaction Engine, wealth maximizer, auto cycles" },
                { ph: "Phase 59",     label: "Global Network Integration",         done: false, detail: "Regions configured — activation via Settings → Regions" },
                { ph: "Phase 60",     label: "Final System Completion",            done: false, detail: "All phases tracked in Evolution page" },
                { ph: "Meta-Phase 5", label: "Domain Expansion Layer",             done: true,  detail: "12 industry verticals, 349 modules, global reach" },
                { ph: "Meta-Phase 6", label: "Global Interoperability Layer",      done: true,  detail: "Omni-Bridge, Universal Bridge Engine, FHIR, Stripe" },
                { ph: "Meta-Phase 30","label": "Infinite Expansion Layer",         done: true,  detail: "Infinite universe scanner, batch cycle probes, expansion ideas" },
              ].map((item) => (
                <div key={item.ph} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px",
                  background: item.done ? `${GREEN}08` : "#f8fafc",
                  borderRadius: 12, border: `1px solid ${item.done ? `${GREEN}20` : BORDER}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: item.done ? GREEN : "#e2e8f0",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, color: item.done ? "#fff" : SLATE, fontWeight: 700 }}>
                      {item.done ? "✓" : "○"}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: DARK, margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: 12, color: SLATE, margin: 0 }}>{item.detail}</p>
                  </div>
                  <span style={{ fontSize: 10, color: SLATE, background: "#e2e8f0",
                    padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>
                    {item.ph}
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
