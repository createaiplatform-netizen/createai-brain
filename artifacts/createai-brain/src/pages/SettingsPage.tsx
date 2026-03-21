/**
 * SettingsPage.tsx — CreateAI Brain · Platform Settings
 *
 * Phases covered:
 *   Phase 14 — Multi-Region Deployment
 *   Phase 15 — Enterprise Compliance Layer
 *   Phase 22 — Role-Based Access & Permissions
 *   Phase 34 — Security Hardening & Zero-Trust Layer
 *   Phase 36 — Load Balancing & Scaling
 *   Phase 40 — Localization & Internationalization
 *   Phase 41 — Multi-Language Support
 *   Phase 42 — Accessibility & Inclusive Design
 *   Phase 49 — Legacy Compatibility Layer
 *   Meta-Phase 12 — Adaptive Governance Layer
 *   Meta-Phase 17 — Ethical Alignment Layer
 */

import React, { useState } from "react";

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

const NAV_LINKS = [
  { label: "Dashboard",       href: "/transcend-dashboard" },
  { label: "Command Center",  href: "/command-center" },
  { label: "Analytics",       href: "/analytics" },
  { label: "Team",            href: "/team" },
  { label: "Billing",         href: "/billing" },
  { label: "Data",            href: "/data" },
  { label: "Global",          href: "/global-expansion" },
  { label: "Evolution",       href: "/evolution" },
  { label: "Semantic Store",  href: "/semantic-store" },
  { label: "Settings",        href: "/settings",        active: true },
  { label: "Platform Status", href: "/platform-status" },
];

type Section = "regions" | "compliance" | "security" | "localization" | "accessibility" | "governance";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: on ? INDIGO : "#cbd5e1", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 16, height: 16,
        borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: DARK, margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 13, color: SLATE, marginTop: 3 }}>{sub}</p>
    </div>
  );
}

function SettingRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0", borderBottom: `1px solid ${BORDER}` }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: DARK, margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 12, color: SLATE, margin: 0, marginTop: 2 }}>{sub}</p>}
      </div>
      <div style={{ marginLeft: 16, flexShrink: 0 }}>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [section, setSection] = useState<Section>("regions");
  const [saved,   setSaved]   = useState(false);

  const [regions, setRegions] = useState({
    usEast:    true,
    usWest:    false,
    eu:        false,
    apac:      false,
    latam:     false,
    africa:    false,
    middleEast:false,
  });

  const [compliance, setCompliance] = useState({
    gdpr:     true,
    hipaa:    false,
    soc2:     false,
    pci:      true,
    ccpa:     true,
    iso27001: false,
    fedramp:  false,
  });

  const [security, setSecurity] = useState({
    mfa:         true,
    zeroTrust:   true,
    ipAllowlist: false,
    sessionLock: true,
    auditLogs:   true,
    encryptRest: true,
    encryptTransit: true,
    apiKeyRotation: false,
  });

  const [localization, setLocalization] = useState({
    language:  "en-US",
    timezone:  "America/Chicago",
    currency:  "USD",
    dateFormat:"MM/DD/YYYY",
  });

  const [accessibility, setAccessibility] = useState({
    highContrast:   false,
    largeText:      false,
    reduceMotion:   false,
    screenReader:   false,
    keyboardNav:    true,
    colorBlindMode: false,
  });

  const [governance, setGovernance] = useState({
    dataRetention:  "365",
    auditTrail:     true,
    ethicsReview:   true,
    biasMonitor:    false,
    explainableAI:  true,
    dataSovereignty:"US",
  });

  function handleSave() {
    const config = { regions, compliance, security, localization, accessibility, governance };
    localStorage.setItem("createai_platform_settings", JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const SECTIONS: Array<{ id: Section; label: string; icon: string; phase: string }> = [
    { id: "regions",       label: "Regions",       icon: "🌍", phase: "Phase 14" },
    { id: "compliance",    label: "Compliance",     icon: "📋", phase: "Phase 15" },
    { id: "security",      label: "Security",       icon: "🛡",  phase: "Phase 34" },
    { id: "localization",  label: "Localization",   icon: "🌐", phase: "Phase 40-41" },
    { id: "accessibility", label: "Accessibility",  icon: "♿", phase: "Phase 42" },
    { id: "governance",    label: "Governance",     icon: "⚖️",  phase: "Meta-12, 17" },
  ];

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

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: DARK, margin: 0 }}>Platform Settings</h1>
            <p style={{ fontSize: 14, color: SLATE, marginTop: 4 }}>
              Multi-Region · Compliance · Security · Localization · Accessibility · Governance
            </p>
          </div>
          <button onClick={handleSave}
            style={{ padding: "10px 24px", background: saved ? GREEN : INDIGO, color: "#fff",
              border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}>
            {saved ? "✓ Saved" : "Save All Settings"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>

          {/* Sidebar */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18,
            padding: 8, boxShadow: SHADOW, height: "fit-content" }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  background: section === s.id ? "rgba(99,102,241,0.09)" : "transparent",
                  color: section === s.id ? INDIGO : DARK, marginBottom: 2 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "inherit" }}>{s.label}</p>
                  <p style={{ fontSize: 10, color: SLATE, margin: 0 }}>{s.phase}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18,
            padding: "24px 28px", boxShadow: SHADOW }}>

            {/* Regions */}
            {section === "regions" && (
              <>
                <SectionHeader title="Multi-Region Deployment · Phase 14"
                  sub="Configure which geographic regions host your platform instances." />
                {Object.entries(regions).map(([key, val]) => {
                  const labels: Record<string, [string, string]> = {
                    usEast:     ["US East (Primary)",    "Virginia · Active production region"],
                    usWest:     ["US West",              "Oregon · Standby / read-replica"],
                    eu:         ["Europe (EU)",          "Frankfurt · GDPR-compliant region"],
                    apac:       ["Asia-Pacific",         "Singapore / Tokyo · APAC coverage"],
                    latam:      ["Latin America",        "São Paulo · LATAM coverage"],
                    africa:     ["Africa",               "Cape Town · Emerging market coverage"],
                    middleEast: ["Middle East",          "UAE · Gulf region coverage"],
                  };
                  const [label, sub] = labels[key] ?? [key, ""];
                  return (
                    <SettingRow key={key} label={label} sub={sub}>
                      <Toggle on={val} onChange={v => setRegions(r => ({ ...r, [key]: v }))} />
                    </SettingRow>
                  );
                })}
                <div style={{ marginTop: 16, padding: "12px 14px", background: "#f0f9ff",
                  borderRadius: 10, border: "1px solid #bae6fd" }}>
                  <p style={{ fontSize: 12, color: "#0369a1", margin: 0 }}>
                    <strong>Phase 37 (High Availability):</strong> Active regions automatically receive health checks
                    every 30s. Failed regions trigger automatic failover to the next closest active region (Phase 38).
                  </p>
                </div>
              </>
            )}

            {/* Compliance */}
            {section === "compliance" && (
              <>
                <SectionHeader title="Enterprise Compliance · Phase 15"
                  sub="Enable regulatory compliance frameworks and certification requirements." />
                {Object.entries(compliance).map(([key, val]) => {
                  const labels: Record<string, [string, string]> = {
                    gdpr:     ["GDPR",      "EU General Data Protection Regulation · Required for EU region"],
                    hipaa:    ["HIPAA",     "Health Insurance Portability and Accountability Act · Healthcare"],
                    soc2:     ["SOC 2",     "Service Organization Control 2 · Trust Services Criteria"],
                    pci:      ["PCI-DSS",   "Payment Card Industry Data Security Standard · Stripe active"],
                    ccpa:     ["CCPA",      "California Consumer Privacy Act · US users"],
                    iso27001: ["ISO 27001", "Information Security Management Standard"],
                    fedramp:  ["FedRAMP",   "Federal Risk and Authorization Management Program · Gov. contracts"],
                  };
                  const [label, sub] = labels[key] ?? [key, ""];
                  return (
                    <SettingRow key={key} label={label} sub={sub}>
                      <Toggle on={val} onChange={v => setCompliance(c => ({ ...c, [key]: v }))} />
                    </SettingRow>
                  );
                })}
              </>
            )}

            {/* Security */}
            {section === "security" && (
              <>
                <SectionHeader title="Security Hardening & Zero-Trust · Phase 34"
                  sub="Configure security controls for the platform and all data access paths." />
                {Object.entries(security).map(([key, val]) => {
                  const labels: Record<string, [string, string]> = {
                    mfa:            ["Multi-Factor Authentication", "Require 2FA for all logins"],
                    zeroTrust:      ["Zero-Trust Network",         "Verify every request regardless of origin"],
                    ipAllowlist:    ["IP Allowlist",               "Restrict platform access to specific IPs"],
                    sessionLock:    ["Session Lock (30 min)",      "Auto-logout after 30 minutes of inactivity"],
                    auditLogs:      ["Audit Logs",                 "Full traceability for all platform actions"],
                    encryptRest:    ["Encryption at Rest",         "AES-256 for all stored data"],
                    encryptTransit: ["Encryption in Transit",      "TLS 1.3 for all API communications"],
                    apiKeyRotation: ["API Key Auto-Rotation",      "Rotate all API keys every 90 days"],
                  };
                  const [label, sub] = labels[key] ?? [key, ""];
                  return (
                    <SettingRow key={key} label={label} sub={sub}>
                      <Toggle on={val} onChange={v => setSecurity(s => ({ ...s, [key]: v }))} />
                    </SettingRow>
                  );
                })}
              </>
            )}

            {/* Localization */}
            {section === "localization" && (
              <>
                <SectionHeader title="Localization & Multi-Language · Phases 40-41"
                  sub="Configure language, timezone, currency, and regional formats." />
                {[
                  { key: "language",   label: "Platform Language", options: [
                    ["en-US","English (US)"], ["en-GB","English (UK)"], ["es-ES","Español"],
                    ["fr-FR","Français"], ["de-DE","Deutsch"], ["zh-CN","中文 (简体)"],
                    ["ja-JP","日本語"], ["pt-BR","Português (BR)"],
                  ]},
                  { key: "timezone",   label: "Timezone", options: [
                    ["America/Chicago","US Central"], ["America/New_York","US Eastern"],
                    ["America/Los_Angeles","US Pacific"], ["Europe/London","London"],
                    ["Europe/Berlin","Berlin"], ["Asia/Tokyo","Tokyo"], ["Asia/Singapore","Singapore"],
                  ]},
                  { key: "currency",   label: "Display Currency", options: [
                    ["USD","USD — US Dollar"], ["EUR","EUR — Euro"], ["GBP","GBP — British Pound"],
                    ["JPY","JPY — Japanese Yen"], ["CAD","CAD — Canadian Dollar"],
                  ]},
                  { key: "dateFormat", label: "Date Format", options: [
                    ["MM/DD/YYYY","MM/DD/YYYY"], ["DD/MM/YYYY","DD/MM/YYYY"],
                    ["YYYY-MM-DD","YYYY-MM-DD (ISO 8601)"],
                  ]},
                ].map(({ key, label, options }) => (
                  <SettingRow key={key} label={label}>
                    <select
                      value={(localization as Record<string,string>)[key]}
                      onChange={e => setLocalization(l => ({ ...l, [key]: e.target.value }))}
                      style={{ padding: "7px 12px", borderRadius: 9, border: `1.5px solid ${BORDER}`,
                        fontSize: 13, color: DARK, background: "#f8fafc", cursor: "pointer" }}>
                      {options.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
                    </select>
                  </SettingRow>
                ))}
                <div style={{ marginTop: 16, padding: "12px 14px", background: "#f0fdf4",
                  borderRadius: 10, border: "1px solid #bbf7d0" }}>
                  <p style={{ fontSize: 12, color: "#15803d", margin: 0 }}>
                    <strong>Phase 41:</strong> All 349 AI modules support localized output.
                    Language packs auto-install when a non-English locale is selected.
                  </p>
                </div>
              </>
            )}

            {/* Accessibility */}
            {section === "accessibility" && (
              <>
                <SectionHeader title="Accessibility & Inclusive Design · Phase 42"
                  sub="Make the platform usable for everyone, regardless of ability." />
                {Object.entries(accessibility).map(([key, val]) => {
                  const labels: Record<string, [string, string]> = {
                    highContrast:   ["High Contrast Mode",    "WCAG 2.1 AA-compliant contrast ratios"],
                    largeText:      ["Large Text Mode",       "Increase default font size by 20%"],
                    reduceMotion:   ["Reduce Motion",         "Minimize animations for vestibular sensitivity"],
                    screenReader:   ["Screen Reader Mode",    "ARIA-optimized layout and labels"],
                    keyboardNav:    ["Full Keyboard Navigation","All features accessible via keyboard only"],
                    colorBlindMode: ["Color-Blind Mode",      "Deuteranopia / protanopia / tritanopia safe"],
                  };
                  const [label, sub] = labels[key] ?? [key, ""];
                  return (
                    <SettingRow key={key} label={label} sub={sub}>
                      <Toggle on={val} onChange={v => setAccessibility(a => ({ ...a, [key]: v }))} />
                    </SettingRow>
                  );
                })}
              </>
            )}

            {/* Governance */}
            {section === "governance" && (
              <>
                <SectionHeader title="Adaptive Governance & Ethical Alignment · Meta-Phases 12, 17"
                  sub="Configure data governance, AI ethics policies, and long-term platform behavior." />
                <SettingRow label="Data Retention Period" sub="How long to retain user and activity data">
                  <select value={governance.dataRetention}
                    onChange={e => setGovernance(g => ({ ...g, dataRetention: e.target.value }))}
                    style={{ padding: "7px 12px", borderRadius: 9, border: `1.5px solid ${BORDER}`,
                      fontSize: 13, color: DARK, background: "#f8fafc", cursor: "pointer" }}>
                    {[["90","90 days"],["180","180 days"],["365","1 year"],["730","2 years"],["1825","5 years"]].map(
                      ([v, l]) => <option key={v} value={v}>{l}</option>
                    )}
                  </select>
                </SettingRow>
                <SettingRow label="Data Sovereignty" sub="Primary jurisdiction for data storage and processing">
                  <select value={governance.dataSovereignty}
                    onChange={e => setGovernance(g => ({ ...g, dataSovereignty: e.target.value }))}
                    style={{ padding: "7px 12px", borderRadius: 9, border: `1.5px solid ${BORDER}`,
                      fontSize: 13, color: DARK, background: "#f8fafc", cursor: "pointer" }}>
                    {[["US","United States"],["EU","European Union"],["UK","United Kingdom"],["SG","Singapore"]].map(
                      ([v, l]) => <option key={v} value={v}>{l}</option>
                    )}
                  </select>
                </SettingRow>
                {[
                  { key: "auditTrail",    label: "Full Audit Trail",     sub: "Immutable log of all platform actions" },
                  { key: "ethicsReview",  label: "AI Ethics Review",      sub: "Flag outputs that may require human review" },
                  { key: "biasMonitor",   label: "Bias Monitoring",       sub: "Monitor AI outputs for systematic bias" },
                  { key: "explainableAI", label: "Explainable AI (XAI)",  sub: "Surface reasoning behind AI decisions" },
                ].map(item => (
                  <SettingRow key={item.key} label={item.label} sub={item.sub}>
                    <Toggle
                      on={(governance as Record<string,boolean | string>)[item.key] as boolean}
                      onChange={v => setGovernance(g => ({ ...g, [item.key]: v }))}
                    />
                  </SettingRow>
                ))}
                <div style={{ marginTop: 16, padding: "12px 14px", background: "#faf5ff",
                  borderRadius: 10, border: "1px solid #e9d5ff" }}>
                  <p style={{ fontSize: 12, color: "#7c3aed", margin: 0 }}>
                    <strong>Meta-Phase 17 (Ethical Alignment):</strong> The platform continuously evaluates
                    AI outputs for fairness, transparency, and accountability. All decisions are logged
                    and flagged for human review when confidence thresholds are not met.
                  </p>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
