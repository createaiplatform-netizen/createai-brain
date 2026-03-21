import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

interface SubsystemScore {
  id: string;
  name: string;
  score: number;
  deployed: number;
  spec: number;
}

interface Report {
  generatedAt: string;
  identity: {
    platformName: string;
    legalEntity: string;
    ownerName: string;
    npa: string;
    handle: string;
    liveUrl: string;
    domainSource: string;
    cashApp: string;
    venmo: string;
    identityFieldsComplete: string;
    identityScore: string;
  };
  systemHealth: {
    status: string;
    executionMode: string;
    founderTier: string;
    allActive: boolean;
    allProtected: boolean;
    allIntegrated: boolean;
    registrySize: number;
    activeItems: number;
    selfHealable: boolean;
    selfHealApplied: number;
    uptime_s: number;
    uptime_human: string;
    lockedAt: string;
  };
  platformCapabilityScore: {
    unified: number;
    label: string;
    subsystems: SubsystemScore[];
  };
  engineReadinessScore: string;
  appCoverage: {
    registered: number;
    engines: number;
    metaAgents: number;
    series: number;
    categories: number;
  };
  engineInventory: {
    totalEngines: number;
    baseEngines: number;
    metaAgents: number;
    seriesLayers: number;
    categories: number;
    lastExpansion: string;
    expansionCycles: number;
  };
  productPipeline: {
    wealthProducts: number;
    wealthBatches: number;
    realMarketProducts: number;
    realMarketCycles: number;
    realMarketRunning: boolean;
    totalInternalProducts: number;
    formatsSupported: number;
    marketplaceBridges: number;
  };
  revenueStatus: {
    liveRevenue: string;
    queuedRevenue: string;
    rails: Record<string, string>;
    paymentsQueued: number;
    note: string;
  };
  advertisingHub: {
    internalAdsLive: number;
    internalAdsTotal: number;
    networksConfigured: number;
    networksConnected: number;
    campaignsQueued: number;
    campaignsReady: number;
    requiredActionsRemaining: number;
  };
  engineCycles: {
    enforcerCycles: number;
    enforcerTranscendFires: number;
    enforcerPremiumBatches: number;
    enforcerErrors: number;
    wealthCycles: number;
    realMarketCycles: number;
    selfHostWatchdogCycles: number;
    totalProductionCycles: number;
  };
  growthAndTraction: {
    pageViews: { total: number; today: number; week: number };
    leadsTotal: number;
    leadsLast24h: number;
    leadsLast7d: number;
    referrers: number;
    referralClicks: number;
    referralConversions: number;
    velocityEvents: Record<string, number>;
    peakActivityHour: string;
    totalActivityEvents: number;
  };
  handleProtocol: {
    handle: string;
    npa: string;
    protocol: string;
    handleRedirect: string;
    portableCard: string;
    wellKnown: string;
    status: string;
  };
  selfHostEngine: {
    engineActive: boolean;
    frontendBuilt: boolean;
    distSizeKb: number;
    watchdogCycles: number;
    subsystems: Record<string, string>;
  };
  activityLog: Array<{ type: string; date: string; count: number }>;
  capacityProjection: {
    note: string;
    productPipeline: number;
    estimatedAvgPrice: string;
    conversionRateUsed: string;
    capacityAtScale: Record<string, string>;
    internalImpressionsCapacity: {
      internalAdsLive: number;
      campaignsQueued: number;
      networksReady: string;
      impressionsOnConnection: string;
      expectedDailyClickCapacity: string;
      expectedDailyImpressionCapacity: string;
      note: string;
    };
    growthProjection: Record<string, string>;
  };
  pendingUnlocks: Array<{ action: string; effect: string }>;
}

function ScoreBar({ score, max = 200 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);
  const color =
    score >= 200
      ? "#22c55e"
      : score >= 100
      ? "#6366f1"
      : score >= 70
      ? "#f59e0b"
      : "#ef4444";
  return (
    <div className="w-full bg-white/5 rounded-full h-2">
      <div
        className="h-2 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="text-xs text-white/40 uppercase tracking-widest mb-1">{label}</div>
      <div
        className="text-2xl font-bold font-mono"
        style={{ color: accent ?? "#a5b4fc" }}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-white/40 mt-1">{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-xs font-bold uppercase tracking-widest text-white/40">
        {children}
      </span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function RailBadge({ label, value }: { label: string; value: string }) {
  const live = value.includes("Live") || value.includes("✅");
  const warn = value.includes("Open") || value.includes("⚡");
  const color = live ? "#22c55e" : warn ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-xs text-white/60">{label}</span>
      <span className="text-xs font-mono ml-auto text-white/80">{value}</span>
    </div>
  );
}

export default function PlatformReportApp() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/platform/report`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setReport(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "#020617" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-white/40 text-sm">Compiling platform report...</div>
        </div>
      </div>
    );
  }
  if (error || !report) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "#020617" }}>
        <div className="text-red-400 text-sm">{error ?? "Failed to load report"}</div>
      </div>
    );
  }

  const { platformCapabilityScore: pcs } = report;
  const totalCycles = report.engineCycles.totalProductionCycles;

  return (
    <div
      className="h-full overflow-y-auto text-white text-sm"
      style={{ background: "#020617" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">

        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-white">Platform Analytics Report</h1>
              <div className="text-white/40 text-xs mt-1">
                {report.identity.platformName} &middot; {report.identity.legalEntity} &middot; {report.identity.ownerName}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/30">Generated</div>
              <div className="text-xs text-white/50 font-mono">
                {new Date(report.generatedAt).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full">
              {report.systemHealth.status.toUpperCase()}
            </span>
            <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-1 rounded-full">
              {report.systemHealth.founderTier}
            </span>
            <span className="bg-white/10 text-white/60 text-xs px-2 py-1 rounded-full">
              Uptime {report.systemHealth.uptime_human}
            </span>
            <span className="bg-white/10 text-white/60 text-xs px-2 py-1 rounded-full">
              {totalCycles.toLocaleString()} production cycles
            </span>
          </div>
        </div>

        {/* System Health Grid */}
        <div>
          <SectionTitle>System Health</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Registry Size" value={report.systemHealth.registrySize} sub="active systems" />
            <StatCard label="All Active" value={report.systemHealth.allActive ? "YES" : "NO"} accent={report.systemHealth.allActive ? "#22c55e" : "#ef4444"} />
            <StatCard label="All Protected" value={report.systemHealth.allProtected ? "YES" : "NO"} accent={report.systemHealth.allProtected ? "#22c55e" : "#ef4444"} />
            <StatCard label="Self-Heal Applied" value={report.systemHealth.selfHealApplied} sub="autonomous corrections" />
          </div>
        </div>

        {/* Platform Capability Score */}
        <div>
          <SectionTitle>Platform Capability Score</SectionTitle>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
            <div className="flex items-end gap-4 mb-3">
              <div
                className="text-6xl font-black font-mono leading-none"
                style={{ color: pcs.unified >= 200 ? "#22c55e" : pcs.unified >= 100 ? "#6366f1" : "#f59e0b" }}
              >
                {pcs.unified}%
              </div>
              <div className="pb-1">
                <div className="text-lg font-bold text-white">{pcs.label}</div>
                <div className="text-xs text-white/40">Unified score across all platform subsystems</div>
              </div>
            </div>
            <ScoreBar score={pcs.unified} max={200} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pcs.subsystems.map((s) => (
              <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80 font-medium">{s.name}</span>
                  <span
                    className="text-sm font-bold font-mono"
                    style={{ color: s.score >= 200 ? "#22c55e" : s.score >= 100 ? "#6366f1" : s.score >= 80 ? "#f59e0b" : "#ef4444" }}
                  >
                    {s.score}%
                  </span>
                </div>
                <ScoreBar score={s.score} max={200} />
                <div className="text-xs text-white/30 mt-1">
                  {s.deployed} deployed / {s.spec} spec
                  {s.deployed > s.spec && (
                    <span className="text-emerald-400 ml-1">(+{s.deployed - s.spec} over-spec)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engine Inventory + App Coverage */}
        <div>
          <SectionTitle>Engine Inventory &amp; App Coverage</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Total Engines" value={report.appCoverage.engines} sub={`${report.engineInventory.baseEngines} base + ${report.engineInventory.metaAgents} meta-agents`} />
            <StatCard label="Series Layers" value={report.appCoverage.series} sub="omega → delta" />
            <StatCard label="OS Apps" value={report.appCoverage.registered} sub="in NEXUS registry" />
            <StatCard label="Engine Categories" value={report.appCoverage.categories} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Expansion Cycles" value={report.engineInventory.expansionCycles} sub={`Last: ${report.engineInventory.lastExpansion}`} />
            <StatCard label="Engine Readiness" value={report.engineReadinessScore} accent="#6366f1" />
            <StatCard label="Identity Fields" value={report.identity.identityScore} sub={report.identity.identityFieldsComplete + " complete"} />
          </div>
        </div>

        {/* Production Cycles */}
        <div>
          <SectionTitle>Production Engine Cycles</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Enforcer Cycles" value={report.engineCycles.enforcerCycles} sub={`${report.engineCycles.enforcerErrors} errors`} />
            <StatCard label="Premium Batches" value={report.engineCycles.enforcerPremiumBatches} sub="Transcend fires" />
            <StatCard label="Wealth Batches" value={report.engineCycles.wealthCycles} />
            <StatCard label="Real-Market Cycles" value={report.engineCycles.realMarketCycles} sub={report.productPipeline.realMarketRunning ? "running" : "idle"} />
          </div>
        </div>

        {/* Product Pipeline */}
        <div>
          <SectionTitle>Internal Product Pipeline</SectionTitle>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
            <div className="flex items-end gap-3 mb-1">
              <div className="text-4xl font-black font-mono text-indigo-400">
                {report.productPipeline.totalInternalProducts.toLocaleString()}
              </div>
              <div className="pb-1 text-white/50 text-sm">total internal products</div>
            </div>
            <div className="text-xs text-white/30">
              {report.productPipeline.wealthProducts.toLocaleString()} wealth engine &nbsp;+&nbsp;
              {report.productPipeline.realMarketProducts.toLocaleString()} real-market &nbsp;&middot;&nbsp;
              {report.productPipeline.formatsSupported} digital formats &nbsp;&middot;&nbsp;
              {report.productPipeline.marketplaceBridges} marketplace bridges configured
            </div>
          </div>
        </div>

        {/* Revenue Status */}
        <div>
          <SectionTitle>Revenue Status</SectionTitle>
          <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-4 mb-4">
            <div className="text-amber-400 text-xs font-bold mb-1">REAL DATA — ZERO EXTERNAL SALES TO DATE</div>
            <div className="text-white/60 text-xs">{report.revenueStatus.note}</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Live Revenue" value={report.revenueStatus.liveRevenue} accent="#22c55e" />
            <StatCard label="Queued Revenue" value={report.revenueStatus.queuedRevenue} />
            <StatCard label="Payments Queued" value={report.revenueStatus.paymentsQueued} />
            <StatCard label="Cash App" value={report.identity.cashApp} sub={`Venmo: ${report.identity.venmo}`} accent="#a5b4fc" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {Object.entries(report.revenueStatus.rails)
              .filter(([k]) => !["cashApp", "venmo", "liveRevenue", "queuedRevenue"].includes(k))
              .map(([k, v]) => (
                <RailBadge key={k} label={k.replace(/([A-Z])/g, " $1").trim()} value={String(v)} />
              ))}
          </div>
        </div>

        {/* Advertising Hub */}
        <div>
          <SectionTitle>Advertising Hub</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Internal Ads Live" value={`${report.advertisingHub.internalAdsLive}/${report.advertisingHub.internalAdsTotal}`} accent="#22c55e" />
            <StatCard label="Networks Configured" value={report.advertisingHub.networksConfigured} />
            <StatCard label="Networks Connected" value={report.advertisingHub.networksConnected} sub="pending API keys" accent={report.advertisingHub.networksConnected > 0 ? "#22c55e" : "#f59e0b"} />
            <StatCard label="Campaigns Queued" value={report.advertisingHub.campaignsQueued} sub="fire on first credential" />
          </div>
        </div>

        {/* Growth & Traction */}
        <div>
          <SectionTitle>Growth &amp; Traction</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Page Views (Total)" value={report.growthAndTraction.pageViews.total} />
            <StatCard label="Today" value={report.growthAndTraction.pageViews.today} />
            <StatCard label="Leads Captured" value={report.growthAndTraction.leadsTotal} />
            <StatCard label="Referrers" value={report.growthAndTraction.referrers} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-xs text-white/40 uppercase tracking-widest mb-3">Traction Velocity (7d)</div>
              {Object.entries(report.growthAndTraction.velocityEvents).slice(0, 6).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                  <span className="text-xs text-white/50">{k.replace(/_/g, " ")}</span>
                  <span className="text-xs font-mono text-indigo-300">{v}</span>
                </div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-xs text-white/40 uppercase tracking-widest mb-3">Activity Log</div>
              {report.activityLog.length === 0 ? (
                <div className="text-xs text-white/30">No logged events yet</div>
              ) : (
                report.activityLog.slice(0, 6).map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                    <span className="text-xs text-white/50">{e.type.replace(/_/g, " ")}</span>
                    <span className="text-xs font-mono text-white/30">{new Date(e.date).toLocaleDateString()}</span>
                    <span className="text-xs font-mono text-indigo-300">{e.count}</span>
                  </div>
                ))
              )}
              <div className="mt-2 text-xs text-white/30">
                Peak activity: {report.growthAndTraction.peakActivityHour} &nbsp;&middot;&nbsp;
                {report.growthAndTraction.totalActivityEvents} total events
              </div>
            </div>
          </div>
        </div>

        {/* Handle Protocol */}
        <div>
          <SectionTitle>Handle Protocol System</SectionTitle>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
            {[
              ["NPA", report.handleProtocol.npa],
              ["Protocol", report.handleProtocol.protocol],
              ["Handle Redirect", report.handleProtocol.handleRedirect],
              ["Portable Card", report.handleProtocol.portableCard],
              ["Well-Known", report.handleProtocol.wellKnown],
              ["Status", report.handleProtocol.status],
            ].map(([label, val]) => (
              <div key={label} className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-white/5 last:border-0">
                <span className="text-xs text-white/40 w-32 shrink-0">{label}</span>
                <span className="text-xs font-mono text-indigo-300 break-all">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Capacity Projection */}
        <div>
          <SectionTitle>Internal Capacity Projection</SectionTitle>
          <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-4 mb-4">
            <div className="text-indigo-400 text-xs font-bold mb-1">
              INTERNAL CAPACITY PROJECTION — NOT ACTUAL REVENUE
            </div>
            <div className="text-white/50 text-xs">{report.capacityProjection.note}</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {Object.entries(report.capacityProjection.capacityAtScale).map(([k, v]) => (
              <StatCard
                key={k}
                label={k.replace("_", " ")}
                value={String(v)}
                accent="#a5b4fc"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-xs text-white/40 uppercase tracking-widest mb-3">Product Pipeline</div>
              {[
                ["Total Products", report.capacityProjection.productPipeline.toLocaleString()],
                ["Avg Price", report.capacityProjection.estimatedAvgPrice],
                ["Conversion Rate Used", report.capacityProjection.conversionRateUsed],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-xs text-white/50">{label}</span>
                  <span className="text-xs font-mono text-indigo-300">{val}</span>
                </div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-xs text-white/40 uppercase tracking-widest mb-3">Ad System Capacity</div>
              {[
                ["Internal Ads Live", report.capacityProjection.internalImpressionsCapacity.internalAdsLive],
                ["Campaigns Queued", report.capacityProjection.internalImpressionsCapacity.campaignsQueued],
                ["Expected Daily Clicks", report.capacityProjection.internalImpressionsCapacity.expectedDailyClickCapacity],
                ["Expected Daily Impressions", report.capacityProjection.internalImpressionsCapacity.expectedDailyImpressionCapacity],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-xs text-white/50">{label}</span>
                  <span className="text-xs font-mono text-indigo-300">{val}</span>
                </div>
              ))}
              <div className="text-xs text-white/30 mt-2">{report.capacityProjection.internalImpressionsCapacity.note}</div>
            </div>
          </div>
        </div>

        {/* Growth Projection */}
        <div>
          <SectionTitle>Growth Projections</SectionTitle>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["1_day", "2_day", "1_week", "1_month"].map((k) => (
                <div key={k}>
                  <div className="text-xs text-white/30 mb-1 uppercase tracking-wider">{k.replace("_", " ")}</div>
                  <div className="text-lg font-bold font-mono text-white/60">
                    {report.capacityProjection.growthProjection[k] ?? "—"}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-white/30 mt-3 border-t border-white/5 pt-3">
              {report.capacityProjection.growthProjection["note"]}
            </div>
          </div>
        </div>

        {/* Pending Unlocks */}
        <div>
          <SectionTitle>Pending Unlocks — Your 5 Activation Keys</SectionTitle>
          <div className="space-y-2">
            {report.pendingUnlocks.map((u, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4">
                <div
                  className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0"
                >
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm text-white/80 font-medium">{u.action}</div>
                  <div className="text-xs text-white/40 mt-0.5">{u.effect}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Identity Footer */}
        <div className="border-t border-white/5 pt-6 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-white/30">
            <div>
              <span className="text-white/20 uppercase tracking-widest block mb-1">NPA</span>
              <span className="font-mono text-indigo-400/70">{report.identity.npa}</span>
            </div>
            <div>
              <span className="text-white/20 uppercase tracking-widest block mb-1">Live URL</span>
              <span className="font-mono text-indigo-400/70 break-all">{report.identity.liveUrl}</span>
            </div>
            <div>
              <span className="text-white/20 uppercase tracking-widest block mb-1">Domain Source</span>
              <span className="font-mono text-indigo-400/70">{report.identity.domainSource}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
