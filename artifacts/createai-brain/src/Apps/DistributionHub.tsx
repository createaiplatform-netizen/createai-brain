import { useState, useEffect } from "react";

interface Channel {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  storeUrl?: string | null;
  installUrl?: string;
  submissionUrl?: string;
  requiredSecrets?: string[];
  notes?: string[];
  iconUrl?: string;
}

interface Audit {
  score: string;
  grade: string;
  passed: number;
  total: number;
  checks: { check: string; pass: boolean }[];
  readyFor: Record<string, boolean>;
}

interface AutomationStatus {
  githubActions: boolean;
  fastlane: boolean;
  capacitorConfig: boolean;
  twaManifest: boolean;
  chromeExtension: boolean;
  pwaManifest: boolean;
  serviceWorker: boolean;
  allIcons: number;
  allSplashScreens: number;
}

const CHANNEL_ICONS: Record<string, string> = {
  pwa: "🌐",
  chrome: "🟡",
  apple: "🍎",
  "google-play": "▶️",
  "samsung-galaxy": "📱",
  "amazon-appstore": "🟠",
  "microsoft-store": "🟦",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  CONFIGURED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  READY_TO_SUBMIT: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  AWAITING_CREDENTIALS: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  PENDING_REVIEW: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export default function DistributionHub() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [automation, setAutomation] = useState<AutomationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"channels" | "audit" | "automation">("channels");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [storeRes, auditRes] = await Promise.all([
        fetch("/api/store"),
        fetch("/api/store/pwa-audit"),
      ]);
      const storeData = await storeRes.json();
      const auditData = await auditRes.json();
      setChannels(storeData.channels || []);
      setAutomation(storeData.automationStatus || null);
      setAudit(auditData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function submitChrome() {
    setSubmitting("chrome");
    setResult(null);
    try {
      const res = await fetch("/api/store/submit-chrome", { method: "POST" });
      const data = await res.json();
      setResult({ ok: data.success, msg: data.success ? data.message : data.error });
    } catch (e: any) {
      setResult({ ok: false, msg: e.message });
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#020617]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading distribution channels...</p>
        </div>
      </div>
    );
  }

  const activeCount = channels.filter((c) => c.status === "ACTIVE" || c.status === "CONFIGURED").length;

  return (
    <div className="flex h-full flex-col bg-[#020617] text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-[#0f172a] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl">
            🚀
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Distribution Hub</h1>
            <p className="text-xs text-slate-400">
              App store submissions & deployment channels
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
              {activeCount}/{channels.length} Active
            </span>
            {audit && (
              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/30">
                PWA Score: {audit.score} {audit.grade}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1">
          {(["channels", "audit", "automation"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {tab === "channels" ? "📦 Channels" : tab === "audit" ? "🔍 PWA Audit" : "⚙️ Automation"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Result banner */}
        {result && (
          <div
            className={`mb-4 rounded-xl border p-4 text-sm ${
              result.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {result.ok ? "✅" : "❌"} {result.msg}
            <button onClick={() => setResult(null)} className="ml-auto float-right opacity-60 hover:opacity-100">×</button>
          </div>
        )}

        {/* ── CHANNELS TAB ─────────────────────────────────── */}
        {activeTab === "channels" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              CreateAI Brain is packaged and ready for distribution across all major platforms.
              Channels marked <span className="text-emerald-400 font-semibold">ACTIVE</span> are live now.
              Channels marked <span className="text-indigo-400 font-semibold">READY TO SUBMIT</span> require only developer account credentials to launch.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  className="rounded-xl border border-slate-800/60 bg-[#0f172a] p-5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">{CHANNEL_ICONS[ch.id] ?? "📦"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">{ch.name}</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                            STATUS_COLORS[ch.status] ?? "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {ch.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">{ch.description}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {ch.notes && (
                    <div className="mb-3 rounded-lg bg-slate-800/40 p-3">
                      {ch.notes.map((n, i) => (
                        <p key={i} className="text-xs text-slate-400">{n}</p>
                      ))}
                    </div>
                  )}

                  {/* Required secrets */}
                  {ch.requiredSecrets && ch.status === "AWAITING_CREDENTIALS" && (
                    <div className="mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                      <p className="text-xs font-semibold text-amber-400 mb-1">Required secrets to activate:</p>
                      {ch.requiredSecrets.map((s) => (
                        <p key={s} className="text-xs font-mono text-amber-300/70">{s}</p>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {ch.storeUrl && (
                      <a
                        href={ch.storeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 rounded-lg bg-indigo-600/80 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-indigo-600"
                      >
                        View in Store ↗
                      </a>
                    )}
                    {ch.installUrl && (
                      <a
                        href={ch.installUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 rounded-lg bg-emerald-600/80 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-emerald-600"
                      >
                        Install Now ↗
                      </a>
                    )}
                    {ch.submissionUrl && (
                      <a
                        href={ch.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-center text-xs font-semibold text-slate-200 hover:bg-slate-600"
                      >
                        Open Developer Portal ↗
                      </a>
                    )}
                    {ch.id === "chrome" && (
                      <button
                        onClick={submitChrome}
                        disabled={submitting === "chrome"}
                        className="flex-1 rounded-lg bg-yellow-600/80 px-3 py-2 text-xs font-semibold text-white hover:bg-yellow-600 disabled:opacity-50"
                      >
                        {submitting === "chrome" ? "Submitting..." : "Auto-Submit API"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AUDIT TAB ──────────────────────────────────── */}
        {activeTab === "audit" && audit && (
          <div className="space-y-6">
            {/* Score card */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-6 text-center">
              <div className="text-5xl font-black text-indigo-400">{audit.grade}</div>
              <div className="mt-1 text-2xl font-bold text-white">{audit.score}</div>
              <div className="mt-1 text-sm text-slate-400">{audit.passed}/{audit.total} checks passed</div>
            </div>

            {/* Store readiness */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Store Readiness</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(audit.readyFor).map(([key, ready]) => (
                  <div
                    key={key}
                    className={`flex items-center gap-2 rounded-lg border p-3 ${
                      ready
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-slate-700 bg-slate-800/30"
                    }`}
                  >
                    <span>{ready ? "✅" : "⏳"}</span>
                    <span className={`text-sm font-medium ${ready ? "text-emerald-300" : "text-slate-400"}`}>
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Checks */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Detailed Checklist</h3>
              <div className="space-y-1">
                {audit.checks.map((c) => (
                  <div
                    key={c.check}
                    className="flex items-center gap-3 rounded-lg bg-slate-800/40 px-4 py-2.5"
                  >
                    <span className={c.pass ? "text-emerald-400" : "text-red-400"}>
                      {c.pass ? "✅" : "❌"}
                    </span>
                    <span className="text-sm text-slate-300">{c.check}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── AUTOMATION TAB ─────────────────────────────── */}
        {activeTab === "automation" && automation && (
          <div className="space-y-6">
            <p className="text-sm text-slate-400">
              All automation infrastructure is pre-built and ready. Add developer credentials as Replit Secrets and every git push automatically deploys to all configured stores.
            </p>

            {/* Automation status */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Infrastructure Status</h3>
              <div className="space-y-1">
                {[
                  { key: "githubActions", label: "GitHub Actions CI/CD Workflow", path: ".github/workflows/app-store-submit.yml" },
                  { key: "fastlane", label: "Fastlane (iOS + Android automation)", path: "fastlane/Fastfile" },
                  { key: "capacitorConfig", label: "Capacitor Native Shell Config", path: "capacitor.config.ts" },
                  { key: "twaManifest", label: "Trusted Web Activity (Google Play TWA)", path: "twa-manifest.json" },
                  { key: "chromeExtension", label: "Chrome Web Store Extension Package", path: "chrome-extension/manifest.json" },
                  { key: "pwaManifest", label: "PWA Web Manifest", path: "public/manifest.json" },
                  { key: "serviceWorker", label: "Production Service Worker", path: "public/sw.js" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 rounded-lg bg-slate-800/40 px-4 py-2.5"
                  >
                    <span className={(automation as any)[item.key] ? "text-emerald-400" : "text-slate-600"}>
                      {(automation as any)[item.key] ? "✅" : "❌"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-slate-300">{item.label}</span>
                      <p className="text-xs font-mono text-slate-500">{item.path}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 rounded-lg bg-slate-800/40 px-4 py-2.5">
                  <span className="text-emerald-400">✅</span>
                  <div className="flex-1">
                    <span className="text-sm text-slate-300">App Icon Suite</span>
                    <p className="text-xs font-mono text-slate-500">{automation.allIcons} icon sizes generated</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-slate-800/40 px-4 py-2.5">
                  <span className="text-emerald-400">✅</span>
                  <div className="flex-1">
                    <span className="text-sm text-slate-300">iOS Splash Screens</span>
                    <p className="text-xs font-mono text-slate-500">{automation.allSplashScreens} device-specific splash screens</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Credential checklist */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-5">
              <h3 className="text-sm font-bold text-amber-400 mb-3">
                🔑 One-Time Credential Setup (Then 100% Automated)
              </h3>
              <div className="space-y-3">
                {[
                  {
                    store: "Apple App Store",
                    cost: "$99/yr",
                    secrets: ["APPLE_ID", "APPLE_APP_SPECIFIC_PASS", "APPLE_TEAM_ID", "MATCH_GIT_URL", "MATCH_PASSWORD"],
                    url: "https://developer.apple.com/programs/",
                  },
                  {
                    store: "Google Play Store",
                    cost: "$25 one-time",
                    secrets: ["GOOGLE_PLAY_KEY_JSON", "ANDROID_KEYSTORE_BASE64", "ANDROID_KEYSTORE_PASS", "ANDROID_KEY_PASS"],
                    url: "https://play.google.com/console",
                  },
                  {
                    store: "Chrome Web Store",
                    cost: "$5 one-time",
                    secrets: ["CHROME_WS_CLIENT_ID", "CHROME_WS_CLIENT_SECRET", "CHROME_WS_REFRESH_TOKEN", "CHROME_WS_EXTENSION_ID"],
                    url: "https://chrome.google.com/webstore/devconsole",
                  },
                ].map((item) => (
                  <div key={item.store} className="rounded-lg bg-slate-800/60 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{item.store}</span>
                      <span className="text-xs text-amber-400 font-medium">{item.cost}</span>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {item.secrets.map((s) => (
                        <span key={s} className="rounded bg-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      Register → {item.url}
                    </a>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-amber-300/70">
                Once credentials are added as Replit Secrets, every code push automatically builds and submits to all stores. Zero ongoing manual steps required.
              </p>
            </div>

            {/* Download Chrome extension */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5">
              <h3 className="text-sm font-bold text-slate-200 mb-2">📦 Chrome Extension Package</h3>
              <p className="text-xs text-slate-400 mb-3">
                The Chrome extension is packaged and ready for Chrome Web Store submission. Download the ZIP or use the API auto-submit endpoint.
              </p>
              <div className="flex gap-2">
                <a
                  href="/createai-brain-chrome-extension.zip"
                  className="rounded-lg bg-yellow-600/80 px-4 py-2 text-xs font-semibold text-white hover:bg-yellow-600"
                >
                  Download Extension ZIP
                </a>
                <a
                  href="https://chrome.google.com/webstore/devconsole"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-600"
                >
                  Open Chrome Web Store Console ↗
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
