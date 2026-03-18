import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const BRAND = {
  accent:      "#6366f1",
  accentLight: "#818cf8",
  accentFaint: "rgba(99,102,241,0.10)",
  text:        "#f1f5f9",
  textMuted:   "#94a3b8",
  textFaint:   "#64748b",
  border:      "rgba(255,255,255,0.10)",
  surface:     "rgba(255,255,255,0.04)",
  surfaceHigh: "rgba(255,255,255,0.08)",
};

// ─── Mode types ───────────────────────────────────────────────────────────────

export type AppMode = "demo" | "test" | "live";

export interface ModeConfig {
  mode: AppMode;
  label:       string;
  icon:        string;
  description: string;
  color:       string;
  bg:          string;
  border:      string;
}

export const MODE_CONFIGS: Record<AppMode, ModeConfig> = {
  demo: {
    mode:        "demo",
    label:       "Demo",
    icon:        "🎭",
    description: "Safe example data. Nothing real is sent or saved.",
    color:       "#fbbf24",
    bg:          "rgba(251,191,36,0.08)",
    border:      "rgba(251,191,36,0.25)",
  },
  test: {
    mode:        "test",
    label:       "Test",
    icon:        "🧪",
    description: "Simulated inputs and outputs. No real API calls.",
    color:       "#34d399",
    bg:          "rgba(52,211,153,0.08)",
    border:      "rgba(52,211,153,0.25)",
  },
  live: {
    mode:        "live",
    label:       "Live",
    icon:        "🟢",
    description: "Real API calls. Real data. Real actions.",
    color:       "#6366f1",
    bg:          "rgba(99,102,241,0.08)",
    border:      "rgba(99,102,241,0.25)",
  },
};

// ─── Demo data registry ───────────────────────────────────────────────────────

export type DemoDataFactory<T> = () => T;
export type DemoDataSet = Record<string, DemoDataFactory<unknown>>;

// Built-in generic demo data helpers
export const DEMO = {
  user: () => ({
    id: "demo-user-1",
    name: "Sara Demo",
    email: "sara@demo.createai.app",
    role: "Admin",
    avatar: "SD",
    plan: "Pro",
    createdAt: "2024-01-15",
  }),
  project: (i = 0) => ({
    id: `demo-project-${i}`,
    name: ["Brand Relaunch", "Product OS", "Growth Strategy", "Compliance Audit"][i % 4],
    icon: ["🚀", "📂", "📈", "🛡️"][i % 4],
    status: ["Active", "In Review", "Draft", "Complete"][i % 4],
    members: Math.floor(Math.random() * 5) + 2,
    updatedAt: new Date(Date.now() - i * 86400000 * 3).toLocaleDateString(),
  }),
  document: (i = 0) => ({
    id: `demo-doc-${i}`,
    title: ["Executive Summary", "Technical Spec", "Market Analysis", "Risk Report", "Roadmap Q2"][i % 5],
    docType: ["Report", "Spec", "Analysis", "Risk", "Plan"][i % 5],
    body: `This is a sample ${["report", "specification", "analysis", "risk assessment", "roadmap"][i % 5]} generated in Demo Mode. No real data is used.`,
    tags: ["demo", ["strategy", "tech", "market", "risk", "planning"][i % 5]].join(","),
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }),
  metric: (label: string, value: string | number, trend?: string) => ({ label, value: String(value), trend: trend ?? "+0%" }),
  metrics: () => [
    DEMO.metric("Total Output",    "1,284",  "+12%"),
    DEMO.metric("Engines Active",  "47",     "+3"),
    DEMO.metric("Avg. Quality",    "94%",    "+2%"),
    DEMO.metric("Runs This Week",  "218",    "+18%"),
  ],
  activity: (n = 5) => Array.from({ length: n }, (_, i) => ({
    id: `demo-event-${i}`,
    type: ["engine_run", "document_created", "project_updated", "series_complete"][i % 4],
    label: ["Ran StrategyEngine", "Created Market Report", "Updated Product OS", "Completed Finance Series"][i % 4],
    time: `${i + 1}h ago`,
    icon: ["⚡", "📄", "📂", "✅"][i % 4],
  })),
  tableRows: (n = 4, cols: number = 3) =>
    Array.from({ length: n }, (_, i) =>
      Array.from({ length: cols }, (__, c) => `Demo Cell ${i}-${c}`)
    ),
  text: (prompt: string) =>
    `[Demo Mode] This is a simulated response for: "${prompt}". In Live mode, this would call the real AI engine and return a full structured output based on your input.`,
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface DemoModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isDemo: boolean;
  isTest: boolean;
  isLive: boolean;
  config: ModeConfig;
  fetch: typeof window.fetch;
  demoData: typeof DEMO;
  log: (msg: string, data?: unknown) => void;
  testLog: Array<{ time: string; msg: string; data?: unknown }>;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

// ─── Test-mode fetch interceptor ──────────────────────────────────────────────

function createTestFetch(log: (msg: string, data?: unknown) => void): typeof window.fetch {
  return async (input, init) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    const method = init?.method ?? "GET";
    log(`[TEST] ${method} ${url}`, init?.body ? JSON.parse(init.body as string) : undefined);
    await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
    const body = JSON.stringify({ ok: true, message: "Test mode — simulated response", url, method, timestamp: Date.now() });
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json" } });
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface DemoModeProviderProps {
  children: React.ReactNode;
  defaultMode?: AppMode;
  storageKey?: string;
}

export function DemoModeProvider({ children, defaultMode = "demo", storageKey }: DemoModeProviderProps) {
  const [mode, setModeState] = useState<AppMode>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved === "demo" || saved === "test" || saved === "live") return saved;
    }
    return defaultMode;
  });

  const [testLog, setTestLog] = useState<Array<{ time: string; msg: string; data?: unknown }>>([]);
  const logFn = useCallback((msg: string, data?: unknown) => {
    setTestLog(prev => [...prev.slice(-49), { time: new Date().toLocaleTimeString(), msg, data }]);
  }, []);

  const testFetchRef = useRef(createTestFetch(logFn));

  const setMode = useCallback((m: AppMode) => {
    setModeState(m);
    if (storageKey) localStorage.setItem(storageKey, m);
    if (m !== "test") setTestLog([]);
  }, [storageKey]);

  const fetchFn = mode === "test" ? testFetchRef.current : window.fetch.bind(window);

  return (
    <DemoModeContext.Provider value={{
      mode,
      setMode,
      isDemo: mode === "demo",
      isTest: mode === "test",
      isLive: mode === "live",
      config: MODE_CONFIGS[mode],
      fetch: fetchFn,
      demoData: DEMO,
      log: logFn,
      testLog,
    }}>
      {children}
    </DemoModeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDemoMode(): DemoModeContextValue {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error("useDemoMode must be used inside <DemoModeProvider>");
  return ctx;
}

// Safe version that doesn't throw — useful for apps that optionally use demo mode
export function useDemoModeSafe(): DemoModeContextValue | null {
  return useContext(DemoModeContext);
}

// ─── Mode Switcher ─────────────────────────────────────────────────────────────

interface ModeSwitcherProps {
  compact?: boolean;
  style?: React.CSSProperties;
  onChange?: (mode: AppMode) => void;
}

export function ModeSwitcher({ compact = false, style, onChange }: ModeSwitcherProps) {
  const { mode, setMode, config } = useDemoMode();
  const modes: AppMode[] = ["demo", "test", "live"];

  const handleChange = (m: AppMode) => {
    setMode(m);
    onChange?.(m);
  };

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4, ...style }}>
        {modes.map(m => {
          const c = MODE_CONFIGS[m];
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => handleChange(m)}
              title={c.description}
              style={{
                fontSize: 11, fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 6,
                border: `1px solid ${active ? c.border : BRAND.border}`,
                background: active ? c.bg : "transparent",
                color: active ? c.color : BRAND.textFaint,
                cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {c.icon} {c.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ ...style }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: BRAND.textFaint, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
        Mode
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {modes.map(m => {
          const c = MODE_CONFIGS[m];
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => handleChange(m)}
              style={{
                flex: 1,
                minWidth: 80,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1.5px solid ${active ? c.color : BRAND.border}`,
                background: active ? c.bg : BRAND.surface,
                color: active ? c.color : BRAND.textMuted,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{c.label}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2, lineHeight: 1.4 }}>{c.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mode Banner ──────────────────────────────────────────────────────────────

interface ModeBannerProps {
  style?: React.CSSProperties;
  showSwitcher?: boolean;
}

export function ModeBanner({ style, showSwitcher = true }: ModeBannerProps) {
  const { mode, config, isLive } = useDemoMode();
  if (isLive) return null;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "8px 14px",
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 10,
      marginBottom: 16,
      ...style,
    }}>
      <span style={{ fontSize: 18 }}>{config.icon}</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: config.color }}>{config.label} Mode</span>
        <span style={{ fontSize: 12, color: BRAND.textMuted, marginLeft: 8 }}>{config.description}</span>
      </div>
      {showSwitcher && <ModeSwitcher compact style={{ flexShrink: 0 }} />}
    </div>
  );
}

// ─── Mode Guard — only renders in specified modes ─────────────────────────────

interface ModeGuardProps {
  modes: AppMode[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function ModeGuard({ modes, fallback = null, children }: ModeGuardProps) {
  const { mode } = useDemoMode();
  return <>{modes.includes(mode) ? children : fallback}</>;
}

// ─── Demo Panel — shows contextual help in demo mode ─────────────────────────

interface DemoPanelProps {
  title?: string;
  steps?: string[];
  note?: string;
  style?: React.CSSProperties;
}

export function DemoPanel({ title, steps, note, style }: DemoPanelProps) {
  const { isDemo } = useDemoMode();
  if (!isDemo) return null;
  return (
    <div style={{
      background: "rgba(251,191,36,0.06)",
      border: "1px solid rgba(251,191,36,0.2)",
      borderRadius: 10,
      padding: "14px 16px",
      ...style,
    }}>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24", marginBottom: 8 }}>
          🎭 {title}
        </div>
      )}
      {steps && steps.length > 0 && (
        <ol style={{ margin: "0 0 8px", paddingLeft: 18 }}>
          {steps.map((s, i) => (
            <li key={i} style={{ fontSize: 12, color: BRAND.textMuted, lineHeight: 1.6 }}>{s}</li>
          ))}
        </ol>
      )}
      {note && (
        <div style={{ fontSize: 11, color: BRAND.textFaint, lineHeight: 1.5, borderTop: "1px solid rgba(251,191,36,0.15)", paddingTop: 8, marginTop: 8 }}>
          ⚠ {note}
        </div>
      )}
    </div>
  );
}

// ─── Test Log viewer ──────────────────────────────────────────────────────────

interface TestLogProps {
  maxHeight?: number;
  style?: React.CSSProperties;
}

export function TestLog({ maxHeight = 200, style }: TestLogProps) {
  const { isTest, testLog } = useDemoMode();
  if (!isTest || testLog.length === 0) return null;
  return (
    <div style={{
      background: "rgba(0,0,0,0.3)",
      border: "1px solid rgba(52,211,153,0.2)",
      borderRadius: 8,
      padding: 12,
      ...style,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#34d399", marginBottom: 8, letterSpacing: "0.06em" }}>
        🧪 TEST LOG ({testLog.length} calls)
      </div>
      <div style={{ maxHeight, overflowY: "auto" }}>
        {testLog.slice().reverse().map((entry, i) => (
          <div key={i} style={{ fontSize: 11, color: BRAND.textMuted, lineHeight: 1.6, borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: 4, marginBottom: 4 }}>
            <span style={{ color: BRAND.textFaint }}>{entry.time}</span>{" "}
            <span style={{ color: "#34d399" }}>{entry.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── useDemoData — returns demo data when in demo/test mode ───────────────────

export function useDemoData<T>(liveData: T | undefined, demoFactory: () => T): T {
  const ctx = useDemoModeSafe();
  if (!ctx || ctx.isLive) return liveData as T;
  return demoFactory();
}

// ─── withDemoMode HOC ─────────────────────────────────────────────────────────

export function withDemoMode<P extends object>(
  Component: React.ComponentType<P>,
  options?: { defaultMode?: AppMode; storageKey?: string }
): React.FC<P> {
  return function DemoModeWrapped(props: P) {
    return (
      <DemoModeProvider defaultMode={options?.defaultMode ?? "demo"} storageKey={options?.storageKey}>
        <Component {...props} />
      </DemoModeProvider>
    );
  };
}

// ─── DemoModeShell — wraps any app with banner + switcher ─────────────────────

interface DemoModeShellProps {
  children: React.ReactNode;
  defaultMode?: AppMode;
  storageKey?: string;
  showBanner?: boolean;
  demoPanelTitle?: string;
  demoPanelSteps?: string[];
  demoPanelNote?: string;
  style?: React.CSSProperties;
}

export function DemoModeShell({
  children,
  defaultMode = "demo",
  storageKey,
  showBanner = true,
  demoPanelTitle,
  demoPanelSteps,
  demoPanelNote,
  style,
}: DemoModeShellProps) {
  return (
    <DemoModeProvider defaultMode={defaultMode} storageKey={storageKey}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", ...style }}>
        {showBanner && <ModeBanner />}
        {(demoPanelTitle || demoPanelSteps) && (
          <DemoPanel title={demoPanelTitle} steps={demoPanelSteps} note={demoPanelNote} style={{ marginBottom: 16 }} />
        )}
        <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
        <TestLog style={{ marginTop: 12 }} />
      </div>
    </DemoModeProvider>
  );
}

// ─── Typed demo data helpers ─────────────────────────────────────────────────

export function makeDemoList<T>(factory: (i: number) => T, count = 5): T[] {
  return Array.from({ length: count }, (_, i) => factory(i));
}

export function demoDelay(ms = 500): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export async function demoFetch<T>(demoResponse: T, delayMs = 600): Promise<T> {
  await demoDelay(delayMs);
  return demoResponse;
}
