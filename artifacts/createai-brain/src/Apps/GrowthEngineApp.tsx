/**
 * GrowthEngineApp.tsx — Internal Growth Analytics Dashboard
 *
 * Replaces Google Analytics entirely. Shows real data from your own DB.
 * - Page views by industry (SEO landing page traffic)
 * - Lead capture stats by source/industry
 * - Referral funnel: clicks → conversions
 * - Daily trends over 30 days
 * - Top traffic sources
 */

import React, { useState, useEffect, useCallback } from "react";

const API = "/api";
const INDIGO = "#6366f1";

interface OverviewData {
  pageViews: { total: number; today: number; week: number };
  leads:     { total: number; today: number; week: number };
  referrals: { totalReferrers: number; totalClicks: number; totalConverts: number };
  charts: {
    dailyViews:  { date: string; count: number }[];
    dailyLeads:  { date: string; count: number }[];
    topPages:    { path: string; count: number }[];
    topSources:  { source: string; count: number }[];
  };
}

interface IndustryData {
  views: { industry: string | null; count: number }[];
  leads: { industry: string | null; count: number }[];
}

const INDUSTRY_ICONS: Record<string, string> = {
  healthcare: "🩺", legal: "⚖️", staffing: "🎯", entrepreneurs: "🚀",
  creators: "✍️", consultants: "💼", finance: "📊", "real-estate": "🏠",
  coaches: "🧘", logistics: "🚛", education: "🎓", nonprofits: "🤲",
};

function MiniChart({ data, color = INDIGO, label }: { data: { date: string; count: number }[]; color?: string; label: string }) {
  if (!data.length) return (
    <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#94a3b8" }}>
      No data yet — traffic will appear here once visitors land on your pages.
    </div>
  );

  const max = Math.max(...data.map(d => d.count), 1);
  const recent = data.slice(-30);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 60 }}>
        {recent.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
            <div title={`${d.date}: ${d.count} ${label}`}
              style={{ background: color, opacity: 0.7 + (d.count / max) * 0.3, borderRadius: "2px 2px 0 0", height: Math.max(2, (d.count / max) * 100) + "%" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#94a3b8" }}>
        <span>{recent[0]?.date?.slice(5) ?? ""}</span>
        <span>{recent[recent.length - 1]?.date?.slice(5) ?? "today"}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = INDIGO }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function GrowthEngineApp() {
  const [tab, setTab] = useState<"overview" | "industries" | "leads" | "actions">("overview");
  const [overview, setOverview]   = useState<OverviewData | null>(null);
  const [industry, setIndustry]   = useState<IndustryData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, ind] = await Promise.all([
        fetch(`${API}/analytics/overview`).then(r => r.ok ? r.json() : null),
        fetch(`${API}/analytics/by-industry`).then(r => r.ok ? r.json() : null),
      ]);
      if (ov?.ok) setOverview(ov);
      if (ind?.ok) setIndustry(ind);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportLeads = async () => {
    setExporting(true);
    try {
      const r = await fetch(`${API}/leads/export`);
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `createai-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  const TABS = [
    { id: "overview",   label: "📊 Overview" },
    { id: "industries", label: "🌐 By Industry" },
    { id: "leads",      label: "📧 Leads" },
    { id: "actions",    label: "⚡ Next Steps" },
  ] as const;

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e1b4b)", padding: "24px 28px 0", color: "#f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📈</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Growth Engine</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Internal analytics · No Google Analytics required · All data in your DB</p>
          </div>
          <button onClick={load} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.08)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ background: tab === t.id ? "rgba(255,255,255,0.12)" : "transparent", color: tab === t.id ? "#fff" : "#64748b", border: "none", borderRadius: "8px 8px 0 0", padding: "8px 16px", fontSize: 13, fontWeight: tab === t.id ? 700 : 400, cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#64748b", fontSize: 14 }}>Loading growth data…</div>
        )}

        {/* Overview Tab */}
        {!loading && tab === "overview" && overview && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              <StatCard label="Total Page Views" value={overview.pageViews.total.toLocaleString()} sub={`Today: ${overview.pageViews.today} · Week: ${overview.pageViews.week}`} color={INDIGO} />
              <StatCard label="Total Leads" value={overview.leads.total.toLocaleString()} sub={`Today: ${overview.leads.today} · Week: ${overview.leads.week}`} color="#10b981" />
              <StatCard label="Referral Clicks" value={(overview.referrals.totalClicks ?? 0).toLocaleString()} sub={`Conversions: ${overview.referrals.totalConverts ?? 0}`} color="#f59e0b" />
              <StatCard label="Active Referrers" value={overview.referrals.totalReferrers ?? 0} sub="Users sharing your link" color="#8b5cf6" />
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>SEO Page Views — Last 30 Days</div>
                <MiniChart data={overview.charts.dailyViews} color={INDIGO} label="views" />
              </div>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Lead Captures — Last 30 Days</div>
                <MiniChart data={overview.charts.dailyLeads} color="#10b981" label="leads" />
              </div>
            </div>

            {/* Top pages + sources */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Top Pages (This Week)</div>
                {overview.charts.topPages.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>No page view data yet.</div>
                ) : overview.charts.topPages.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", width: 18 }}>#{i + 1}</div>
                    <div style={{ flex: 1, fontSize: 12, color: "#0f172a", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.path}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: INDIGO }}>{p.count}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Traffic Sources (This Week)</div>
                {overview.charts.topSources.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>No source data yet.</div>
                ) : overview.charts.topSources.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", width: 18 }}>#{i + 1}</div>
                    <div style={{ flex: 1, fontSize: 12, color: "#0f172a" }}>{s.source}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>{s.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Industries Tab */}
        {!loading && tab === "industries" && industry && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Views by Industry Landing Page (30 days)</div>
              {industry.views.filter(v => v.industry).length === 0 ? (
                <div style={{ fontSize: 13, color: "#94a3b8", padding: "20px 0" }}>
                  No industry page views yet. Share the landing page links to start seeing traffic here.
                </div>
              ) : industry.views.filter(v => v.industry).map((v, i) => {
                const maxCount = Math.max(...industry.views.map(x => x.count), 1);
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: "#0f172a" }}>{INDUSTRY_ICONS[v.industry ?? ""] ?? "🏢"} {v.industry}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: INDIGO }}>{v.count} views</span>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: (v.count / maxCount * 100) + "%", background: `linear-gradient(90deg, ${INDIGO}, #8b5cf6)`, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Leads by Industry</div>
              {industry.leads.filter(l => l.industry).length === 0 ? (
                <div style={{ fontSize: 13, color: "#94a3b8", padding: "20px 0" }}>No leads captured yet.</div>
              ) : industry.leads.filter(l => l.industry).map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 13, color: "#0f172a" }}>{INDUSTRY_ICONS[l.industry ?? ""] ?? "🏢"} {l.industry}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{l.count} leads</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leads Tab */}
        {!loading && tab === "leads" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Your Internal Lead Database</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>
                All leads captured from SEO landing pages are stored here — in your own PostgreSQL database. No Mailchimp. No ConvertKit. No external service needed. Export anytime as CSV.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={exportLeads} disabled={exporting}
                  style={{ background: INDIGO, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: exporting ? "not-allowed" : "pointer", opacity: exporting ? 0.7 : 1 }}>
                  {exporting ? "Exporting…" : "⬇️ Export All Leads as CSV"}
                </button>
                <a href="/api/leads/export" target="_blank" rel="noopener noreferrer"
                  style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  Direct Download Link
                </a>
              </div>
            </div>

            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#166534", marginBottom: 8 }}>✅ What this replaces</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                {[
                  { tool: "Mailchimp", cost: "$20-350/mo", desc: "Email list management" },
                  { tool: "ConvertKit", cost: "$29-99/mo", desc: "Creator email platform" },
                  { tool: "ActiveCampaign", cost: "$39-187/mo", desc: "Marketing automation" },
                  { tool: "HubSpot CRM", cost: "$45-800/mo", desc: "Lead management" },
                ].map(item => (
                  <div key={item.tool} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", border: "1px solid #d1fae5" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.tool}</div>
                    <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>{item.cost}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{item.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: "#166534", fontWeight: 700 }}>
                Total replaced: $133–$1,436/month → $0 (stored in your own DB)
              </div>
            </div>
          </div>
        )}

        {/* Actions Tab */}
        {!loading && tab === "actions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Automated — Already Done ✅</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>These systems are live with zero manual work:</div>
              {[
                { icon: "🗺️", title: "Sitemap.xml", desc: "All 12 industry pages + store products indexed. Live at /sitemap.xml" },
                { icon: "🤖", title: "Robots.txt", desc: "Search bots allowed on all public pages. Blocks internal routes." },
                { icon: "📡", title: "Search Engine Ping", desc: "Google & Bing pinged on every server boot. They know your pages exist." },
                { icon: "📋", title: "ads.txt", desc: "Programmatic ad readiness file. Served at /ads.txt" },
                { icon: "🔒", title: "security.txt", desc: "Domain trust signal. Served at /.well-known/security.txt" },
                { icon: "🌐", title: "12 SEO Landing Pages", desc: "Healthcare, Legal, Staffing, Finance, Real Estate + 7 more. All crawlable." },
                { icon: "📧", title: "Internal Lead Capture", desc: "Email capture on every landing page. Stored in your DB. Zero external accounts." },
                { icon: "📊", title: "Internal Analytics", desc: "Page views, sources, and funnels tracked. No Google Analytics needed." },
                { icon: "🔗", title: "Viral Referral Loop", desc: "Every user has a unique link. Clicks and conversions tracked automatically." },
                { icon: "🎁", title: "JSON-LD Structured Data", desc: "Rich search results schema on every landing page. Google reads this for snippets." },
              ].map(item => (
                <div key={item.title} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#92400e", marginBottom: 4 }}>3 Manual Steps Required</div>
              <div style={{ fontSize: 13, color: "#78350f", marginBottom: 14 }}>These legally require your physical identity/account. I've pre-built everything — you just need to click through:</div>

              {[
                {
                  number: "1",
                  title: "Google Search Console — 3 clicks",
                  time: "2 minutes",
                  color: "#4285f4",
                  steps: [
                    "Go to: search.google.com/search-console",
                    "Click 'Add Property' → enter your domain → click Continue",
                    "Choose 'HTML tag' method → copy the meta tag content value",
                    "Set environment variable GOOGLE_SITE_VERIFICATION=[that value] in Replit Secrets",
                    "Click 'Verify' — done. Your sitemap is now submitted automatically.",
                  ],
                  why: "Google won't let a bot verify domain ownership — it's a 1-person verification step.",
                },
                {
                  number: "2",
                  title: "Resend Domain Verification — 10 minutes",
                  time: "10 minutes",
                  color: "#6366f1",
                  steps: [
                    "Go to: resend.com → Dashboard → Domains",
                    "Click 'Add Domain' → enter your domain",
                    "Copy the 3 DNS records Resend shows you",
                    "Go to your domain registrar (GoDaddy/Namecheap/etc) → DNS settings",
                    "Add all 3 records exactly as shown",
                    "Return to Resend and click 'Verify' — emails will flow immediately",
                  ],
                  why: "Domain verification requires DNS access that only you have.",
                },
                {
                  number: "3",
                  title: "Stripe Identity Verification — 15 minutes",
                  time: "15 minutes",
                  color: "#635bff",
                  steps: [
                    "Go to: dashboard.stripe.com → Home",
                    "Click the yellow 'Complete your account' banner",
                    "Fill in your business type (LLC) and business name (Lakeside Trinity LLC)",
                    "Enter the business address and EIN (or SSN for sole prop)",
                    "Add your bank account for payouts",
                    "Upload a government ID — Stripe reviews in 1-2 days",
                    "Once approved: charges_enabled becomes true, payments flow immediately",
                  ],
                  why: "KYC/AML laws require identity verification for payment processing. No workaround exists.",
                },
              ].map(item => (
                <div key={item.number} style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: item.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>{item.number}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Estimated time: {item.time}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#92400e", marginBottom: 8, fontStyle: "italic" }}>Why this requires you: {item.why}</div>
                  <ol style={{ margin: 0, padding: "0 0 0 18px" }}>
                    {item.steps.map((step, i) => (
                      <li key={i} style={{ fontSize: 12, color: "#374151", marginBottom: 4, lineHeight: 1.5 }}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
