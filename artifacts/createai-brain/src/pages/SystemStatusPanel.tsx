import React, { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreData {
  readiness:    number;
  completeness: number;
  stability:    number;
  integration:  number;
  performance:  number;
  security:     number;
  scalability:  number;
  minimum:      number;
  ceiling:      string;
  generatedAt:  string;
  uptimeSeconds: number;
  bootCount:    number;
  lastBootAt:   string;
}

interface HealthData {
  status:            string;
  uptime:            number;
  registrySize:      number;
  activeItems:       number;
  availableCommands: number;
  founderTier:       string;
  version:           string;
}

interface ManifestData {
  name:                 string;
  purpose:              string;
  engines:              Record<string, unknown>;
  initializationOrder:  string[];
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const BG       = "#050A18";
const BG2      = "#0A1128";
const BG3      = "#0F1835";
const TEAL     = "#00C9A7";
const PURPLE   = "#A78BFA";
const GOLD     = "#E8C77A";
const MUTED    = "rgba(255,255,255,0.38)";
const DIM      = "rgba(255,255,255,0.12)";
const WHITE    = "#F0F4FF";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return iso; }
}

// Scale a raw score to a 0–1 display fraction.
// Min baseline = 100; typical range 100–200 (scores can exceed 200).
// We cap display at 200 so the ring doesn\u2019t overflow — the label shows the raw value.
function scaleFraction(v: number, cap = 200): number {
  return Math.min(1, Math.max(0, (v - 100) / (cap - 100)));
}

function overall(s: ScoreData): number {
  return Math.round(
    (s.readiness + s.completeness + s.stability +
      s.integration + s.performance + s.security + s.scalability) / 7
  );
}

// ─── Keyframes injected once ─────────────────────────────────────────────────

const STYLES = `
@keyframes cai-pulse {
  0%,100% { opacity:1; transform:scale(1); box-shadow:0 0 0 0 rgba(0,201,167,0.60); }
  50%      { opacity:0.85; transform:scale(1.08); box-shadow:0 0 0 7px rgba(0,201,167,0); }
}
@keyframes cai-orbit {
  0%   { transform:rotate(0deg)   translateX(var(--r)) rotate(0deg); }
  100% { transform:rotate(360deg) translateX(var(--r)) rotate(-360deg); }
}
@keyframes cai-shimmer {
  0%   { opacity:0.55; }
  50%  { opacity:1; }
  100% { opacity:0.55; }
}
@keyframes cai-rotate {
  from { transform:rotate(0deg); }
  to   { transform:rotate(360deg); }
}
@keyframes cai-stars {
  0%   { transform:rotate(0deg) scale(1); }
  50%  { transform:rotate(180deg) scale(1.03); }
  100% { transform:rotate(360deg) scale(1); }
}
@keyframes cai-beat {
  0%,100% { transform:scaleY(1); }
  50%      { transform:scaleY(1.12); }
}
@keyframes cai-layer-in {
  from { opacity:0; transform:translateY(6px); }
  to   { opacity:1; transform:translateY(0); }
}
`;

function injectStyles() {
  if (document.getElementById("cai-ssp-styles")) return;
  const el = document.createElement("style");
  el.id = "cai-ssp-styles";
  el.textContent = STYLES;
  document.head.appendChild(el);
}

// ─── Readiness — SVG circular ring ───────────────────────────────────────────

function ReadinessViz({ value }: { value: number }) {
  const r = 36, cx = 48, cy = 48;
  const circ = 2 * Math.PI * r;
  const frac = scaleFraction(value);
  const dash = frac * circ;
  // Ring thickness: 6px at baseline, grows by 0.04px per point above 100
  const strokeW = 6 + Math.max(0, (value - 100) * 0.04);
  return (
    <svg width={96} height={96} style={{ overflow: "visible" }}>
      <defs>
        <filter id="rgl" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={DIM} strokeWidth={4} />
      {/* Progress */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={TEAL} strokeWidth={strokeW}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        filter="url(#rgl)"
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text x={cx} y={cy + 5} textAnchor="middle" fill={TEAL}
        style={{ fontSize: 14, fontWeight: 700, fontFamily: "system-ui, sans-serif" }}>
        {value}
      </text>
    </svg>
  );
}

// ─── Completeness — vertical bar + shimmer ────────────────────────────────────

function CompletenessViz({ value }: { value: number }) {
  const frac = scaleFraction(value);
  const pct  = Math.round(frac * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ width: 20, height: 72, borderRadius: 6, background: DIM, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: `${pct}%`,
          background: `linear-gradient(to top, ${PURPLE}, rgba(167,139,250,0.50))`,
          borderRadius: 6,
          transition: "height 1.4s cubic-bezier(0.4,0,0.2,1)",
          animation: "cai-shimmer 2.8s ease-in-out infinite",
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: PURPLE }}>{value}</span>
    </div>
  );
}

// ─── Stability — pulse line (heartbeat) ──────────────────────────────────────

function StabilityViz({ value }: { value: number }) {
  // Amplitude: proportional to score 100–170 → 4–20
  const amp = 4 + Math.max(0, Math.min(1, (value - 100) / 70)) * 16;
  const w = 96, h = 48, mid = h / 2;
  // Build a heartbeat path
  const path = [
    `M0,${mid}`,
    `L16,${mid}`,
    `L22,${mid - amp * 0.5}`,
    `L26,${mid + amp}`,
    `L30,${mid - amp}`,
    `L34,${mid + amp * 0.6}`,
    `L40,${mid}`,
    `L96,${mid}`,
  ].join(" ");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={w} height={h} style={{ animation: "cai-beat 1.8s ease-in-out infinite" }}>
        <defs>
          <filter id="sgl" x="-30%" y="-100%" width="160%" height="300%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <polyline points={`0,${mid} 16,${mid} 22,${mid - amp * 0.5} 26,${mid + amp} 30,${mid - amp} 34,${mid + amp * 0.6} 40,${mid} 96,${mid}`}
          fill="none" stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
          filter="url(#sgl)"
        />
      </svg>
      <span style={{ fontSize: 13, fontWeight: 700, color: TEAL }}>{value}</span>
    </div>
  );
}

// ─── Integration — orbit nodes ────────────────────────────────────────────────

function IntegrationViz({ value }: { value: number }) {
  // More nodes for higher score; min 3, max 6
  const nodeCount = 3 + Math.min(3, Math.floor(scaleFraction(value) * 4));
  // Speed: 3s at 100, 1.6s at 200
  const speed = 3 - scaleFraction(value) * 1.4;
  const cx = 48, cy = 48, radius = 32;
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    angle: (360 / nodeCount) * i,
    delay: (speed / nodeCount) * i,
  }));
  return (
    <div style={{ position: "relative", width: 96, height: 96 }}>
      <svg width={96} height={96} style={{ position: "absolute", top: 0, left: 0 }}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={DIM} strokeWidth={1} strokeDasharray="2 4" />
        <circle cx={cx} cy={cy} r={5} fill={PURPLE} opacity={0.85} />
      </svg>
      {nodes.map((n, i) => (
        <div key={i} style={{
          position: "absolute",
          top: cy - 4, left: cx - 4,
          width: 8, height: 8,
          borderRadius: "50%",
          background: i % 2 === 0 ? TEAL : GOLD,
          boxShadow: `0 0 5px ${i % 2 === 0 ? TEAL : GOLD}`,
          // @ts-ignore css var
          "--r": `${radius}px`,
          transformOrigin: "4px 4px",
          animation: `cai-orbit ${speed.toFixed(2)}s linear infinite`,
          animationDelay: `-${n.delay.toFixed(2)}s`,
        } as React.CSSProperties} />
      ))}
      <span style={{
        position: "absolute", bottom: 2, left: 0, right: 0,
        textAlign: "center", fontSize: 13, fontWeight: 700, color: PURPLE,
      }}>{value}</span>
    </div>
  );
}

// ─── Performance — arc gauge ──────────────────────────────────────────────────

function PerformanceViz({ value }: { value: number }) {
  const frac = scaleFraction(value);
  const r = 34, cx = 48, cy = 52;
  // Half-circle arc (180 degrees)
  const circ = Math.PI * r;
  const dash = frac * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <svg width={96} height={60} style={{ overflow: "visible" }}>
        <defs>
          <filter id="pgl">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <path d={`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill="none" stroke={DIM} strokeWidth={5} strokeLinecap="round" />
        {/* Fill */}
        <path d={`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill="none" stroke={GOLD} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          filter="url(#pgl)"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={GOLD}
          style={{ fontSize: 13, fontWeight: 700, fontFamily: "system-ui, sans-serif" }}>
          {value}
        </text>
      </svg>
    </div>
  );
}

// ─── Security — shield with glow ──────────────────────────────────────────────

function SecurityViz({ value }: { value: number }) {
  const frac   = scaleFraction(value);
  const glow   = Math.round(4 + frac * 12);
  const glowOp = 0.4 + frac * 0.5;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{
        width: 52, height: 60,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <svg width={52} height={60} viewBox="0 0 52 60">
          <defs>
            <filter id="sglow">
              <feGaussianBlur stdDeviation={glow / 2} result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Shield path */}
          <path d="M26,3 L46,12 L46,30 C46,42 36,52 26,57 C16,52 6,42 6,30 L6,12 Z"
            fill="none" stroke={TEAL} strokeWidth={1.5}
            filter="url(#sglow)"
            opacity={glowOp}
          />
          <path d="M26,3 L46,12 L46,30 C46,42 36,52 26,57 C16,52 6,42 6,30 L6,12 Z"
            fill={`rgba(0,201,167,${0.06 + frac * 0.10})`}
            stroke={TEAL} strokeWidth={1}
          />
          {/* Inner check */}
          <polyline points="17,30 23,36 35,22" fill="none" stroke={TEAL}
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        </svg>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: TEAL }}>{value}</span>
    </div>
  );
}

// ─── Scalability — stacked layers ─────────────────────────────────────────────

function ScalabilityViz({ value }: { value: number }) {
  const frac      = scaleFraction(value);
  const layerCount = 3 + Math.min(4, Math.round(frac * 5));
  const colors    = [TEAL, PURPLE, GOLD, TEAL, PURPLE, GOLD, TEAL];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{
        display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 2,
        height: 72, justifyContent: "flex-start",
      }}>
        {Array.from({ length: layerCount }, (_, i) => (
          <div key={i} style={{
            width: 48 - i * 3, height: 9,
            borderRadius: 3,
            background: colors[i % colors.length],
            opacity: 0.55 + (i / layerCount) * 0.45,
            animation: `cai-layer-in 0.4s ease ${i * 0.06}s both`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{value}</span>
    </div>
  );
}

// ─── Overall — large central ring with starfield ──────────────────────────────

function OverallViz({ value }: { value: number }) {
  const frac = scaleFraction(value, 180);
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash = frac * circ;
  // Rotating starfield dots
  const stars = Array.from({ length: 10 }, (_, i) => ({
    x: cx + (28 - (i % 3) * 14) * Math.cos((i / 10) * 2 * Math.PI),
    y: cy + (28 - (i % 3) * 14) * Math.sin((i / 10) * 2 * Math.PI),
    r: 1 + (i % 2),
    op: 0.3 + (i % 4) * 0.15,
  }));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 128, height: 128 }}>
        <svg width={128} height={128} style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}>
          <defs>
            <radialGradient id="ogrd" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={PURPLE} stopOpacity="0.18" />
              <stop offset="100%" stopColor={TEAL}   stopOpacity="0.04" />
            </radialGradient>
            <filter id="oglow">
              <feGaussianBlur stdDeviation="3.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="olin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor={TEAL} />
              <stop offset="50%"  stopColor={PURPLE} />
              <stop offset="100%" stopColor={GOLD} />
            </linearGradient>
          </defs>
          {/* Inner fill */}
          <circle cx={cx} cy={cy} r={r - 4} fill="url(#ogrd)" />
          {/* Track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={DIM} strokeWidth={5} />
          {/* Progress ring */}
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke="url(#olin)" strokeWidth={7}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
            filter="url(#oglow)"
            style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)" }}
          />
          {/* Rotating starfield */}
          <g style={{ animation: "cai-stars 14s linear infinite", transformOrigin: `${cx}px ${cy}px` }}>
            {stars.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={WHITE} opacity={s.op} />
            ))}
          </g>
          {/* Value label */}
          <text x={cx} y={cy - 6} textAnchor="middle" fill={WHITE}
            style={{ fontSize: 22, fontWeight: 800, fontFamily: "system-ui, sans-serif" }}>
            {value}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill={MUTED}
            style={{ fontSize: 9, fontWeight: 600, fontFamily: "system-ui, sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            OVERALL
          </text>
        </svg>
      </div>
    </div>
  );
}

// ─── Score Card ───────────────────────────────────────────────────────────────

interface ScoreCardProps {
  label:    string;
  value:    number;
  children: React.ReactNode;
  accent:   string;
}

function ScoreCard({ label, value, children, accent }: ScoreCardProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      background: BG2,
      border: `1px solid ${DIM}`,
      borderRadius: 14,
      padding: "18px 14px 14px",
      minWidth: 110,
      flex: "1 1 110px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle corner glow */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 60, height: 60, borderRadius: "50%",
        background: accent, opacity: 0.07, filter: "blur(16px)",
        pointerEvents: "none",
      }} />
      {children}
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", color: MUTED, marginTop: 2,
      }}>{label}</span>
    </div>
  );
}

// ─── Pulsing alive dot ────────────────────────────────────────────────────────

function AliveDot({ online }: { online: boolean }) {
  return (
    <span style={{
      display: "inline-block",
      width: 9, height: 9, borderRadius: "50%",
      background: online ? TEAL : "#ef4444",
      flexShrink: 0,
      animation: online ? "cai-pulse 2.4s ease-in-out infinite" : "none",
    }} />
  );
}

// ─── Engine row ───────────────────────────────────────────────────────────────

function EngineRow({ name, active }: { name: string; active: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 10px", borderRadius: 8,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
        background: active ? TEAL : MUTED,
        boxShadow: active ? `0 0 5px ${TEAL}` : "none",
      }} />
      <span style={{ fontSize: 11, color: WHITE, fontWeight: 500, flex: 1 }}>{name}</span>
    </div>
  );
}

// ─── Layer strip (activation chain) ───────────────────────────────────────────

function ActivationChain({ layers }: { layers: string[] }) {
  if (layers.length === 0) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      overflowX: "auto", padding: "8px 0",
      scrollbarWidth: "none",
    }}>
      {layers.map((l, i) => {
        const name = l.replace("EngineManifest", "").replace("Manifest", "");
        return (
          <React.Fragment key={l}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              minWidth: 64,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: TEAL,
                boxShadow: `0 0 6px ${TEAL}`,
                animation: `cai-pulse ${2.2 + (i % 4) * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }} />
              <span style={{
                fontSize: 8, color: MUTED, fontWeight: 600,
                letterSpacing: "0.04em", textAlign: "center",
                maxWidth: 56, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{name}</span>
            </div>
            {i < layers.length - 1 && (
              <div style={{
                width: 18, height: 1, background: DIM, flexShrink: 0,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SystemStatusPanel() {
  const [scores,   setScores]   = useState<ScoreData | null>(null);
  const [health,   setHealth]   = useState<HealthData | null>(null);
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [err,      setErr]      = useState<Record<string, boolean>>({});
  const [tick,     setTick]     = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  injectStyles();

  async function fetchAll() {
    // Scores
    try {
      const r = await fetch("/api/system/score");
      if (r.ok) setScores(await r.json());
      else setErr(p => ({ ...p, scores: true }));
    } catch { setErr(p => ({ ...p, scores: true })); }

    // Health
    try {
      const r = await fetch("/api/system/health");
      if (r.ok) {
        const j = await r.json();
        setHealth(j);
        setErr(p => ({ ...p, health: false }));
      } else setErr(p => ({ ...p, health: true }));
    } catch { setErr(p => ({ ...p, health: true })); }

    // Master manifest (universe data)
    try {
      const r = await fetch("/api/universe-data/master-manifest");
      if (r.ok) setManifest(await r.json());
      else setErr(p => ({ ...p, manifest: true }));
    } catch { setErr(p => ({ ...p, manifest: true })); }
  }

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(() => { void fetchAll(); setTick(t => t + 1); }, 20_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const online = health?.status === "online";
  const ov     = scores ? overall(scores) : 0;

  const engineNames = manifest?.engines
    ? Object.keys(manifest.engines)
    : [];

  const initOrder = manifest?.initializationOrder ?? [];
  const layerCount = initOrder.length;

  return (
    <div style={{
      minHeight: "100vh",
      background: BG,
      color: WHITE,
      fontFamily: "-apple-system, BlinkMacSystemFont, \u2018Segoe UI\u2019, system-ui, sans-serif",
      padding: "0 0 60px",
    }}>
      {/* ── Grid overlay — ultra-subtle ── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(${DIM} 1px, transparent 1px), linear-gradient(90deg, ${DIM} 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        opacity: 0.18,
        zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — System Identity
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{
          padding: "36px 0 24px",
          borderBottom: `1px solid ${DIM}`,
          marginBottom: 32,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Title row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <AliveDot online={online} />
                <h1 style={{
                  margin: 0, fontSize: 26, fontWeight: 800,
                  letterSpacing: "-0.03em",
                  background: `linear-gradient(90deg, ${WHITE}, ${TEAL})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>CreateAI Brain</h1>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.10em",
                  textTransform: "uppercase", color: MUTED,
                  border: `1px solid ${DIM}`, borderRadius: 5,
                  padding: "2px 7px", marginTop: 3,
                }}>System Status</span>
              </div>

              {/* Version from health */}
              {health?.version && (
                <p style={{ margin: 0, fontSize: 11, color: MUTED, letterSpacing: "0.03em" }}>
                  {health.version}
                </p>
              )}

              {/* Uptime + last boot */}
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 4 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.10em", color: MUTED }}>Uptime</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: TEAL }}>
                    {scores ? fmt(scores.uptimeSeconds) : health ? fmt(health.uptime) : "\u2014"}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.10em", color: MUTED }}>Last Activation</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: WHITE }}>
                    {scores?.lastBootAt ? fmtDate(scores.lastBootAt) : "\u2014"}
                  </span>
                </div>
                {health?.founderTier && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.10em", color: MUTED }}>Founder Tier</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>{health.founderTier}</span>
                  </div>
                )}
                {health?.registrySize !== undefined && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.10em", color: MUTED }}>Registry</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: PURPLE }}>
                      {health.activeItems} / {health.registrySize} active
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 12,
              background: online ? "rgba(0,201,167,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${online ? "rgba(0,201,167,0.22)" : "rgba(239,68,68,0.22)"}`,
            }}>
              <AliveDot online={online} />
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                color: online ? TEAL : "#ef4444",
                textTransform: "uppercase",
              }}>
                {health ? health.status : "connecting\u2026"}
              </span>
            </div>
          </div>

          {/* Error notices */}
          {err.scores && (
            <p style={{ margin: "12px 0 0", fontSize: 11, color: "#ef4444" }}>
              Score endpoint temporarily unavailable
            </p>
          )}
          {err.health && (
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#ef4444" }}>
              Health endpoint temporarily unavailable
            </p>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — Growth Scores Grid
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            margin: "0 0 16px", fontSize: 9, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED,
          }}>Growth Scores</p>

          {!scores && !err.scores && (
            <p style={{ color: MUTED, fontSize: 12 }}>Loading\u2026</p>
          )}
          {err.scores && !scores && (
            <p style={{ color: "#ef4444", fontSize: 12 }}>Score data temporarily unavailable</p>
          )}

          {scores && (
            <>
              {/* Overall — centered above the grid */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                  background: BG2, border: `1px solid rgba(167,139,250,0.18)`,
                  borderRadius: 18, padding: "24px 36px",
                }}>
                  <OverallViz value={ov} />
                  <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: MUTED }}>
                      Min: <strong style={{ color: WHITE }}>{scores.minimum}</strong>
                    </span>
                    <span style={{ fontSize: 9, color: MUTED }}>
                      Ceiling: <strong style={{ color: WHITE }}>{scores.ceiling}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* 7-metric grid */}
              <div style={{
                display: "flex", flexWrap: "wrap", gap: 12,
              }}>
                <ScoreCard label="Readiness" value={scores.readiness} accent={TEAL}>
                  <ReadinessViz value={scores.readiness} />
                </ScoreCard>
                <ScoreCard label="Completeness" value={scores.completeness} accent={PURPLE}>
                  <CompletenessViz value={scores.completeness} />
                </ScoreCard>
                <ScoreCard label="Stability" value={scores.stability} accent={TEAL}>
                  <StabilityViz value={scores.stability} />
                </ScoreCard>
                <ScoreCard label="Integration" value={scores.integration} accent={PURPLE}>
                  <IntegrationViz value={scores.integration} />
                </ScoreCard>
                <ScoreCard label="Performance" value={scores.performance} accent={GOLD}>
                  <PerformanceViz value={scores.performance} />
                </ScoreCard>
                <ScoreCard label="Security" value={scores.security} accent={TEAL}>
                  <SecurityViz value={scores.security} />
                </ScoreCard>
                <ScoreCard label="Scalability" value={scores.scalability} accent={GOLD}>
                  <ScalabilityViz value={scores.scalability} />
                </ScoreCard>
              </div>

              <p style={{ margin: "12px 0 0", fontSize: 9, color: MUTED, textAlign: "right" }}>
                Generated {fmtDate(scores.generatedAt)} \u00b7 refreshes every 20s
              </p>
            </>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3 — Universe & Engine Overview
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{
          background: BG2, border: `1px solid ${DIM}`,
          borderRadius: 16, padding: "24px",
        }}>
          <p style={{
            margin: "0 0 20px", fontSize: 9, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED,
          }}>Universe &amp; Engine Overview</p>

          {err.manifest && !manifest && (
            <p style={{ color: "#ef4444", fontSize: 12, margin: "0 0 16px" }}>Universe data temporarily unavailable</p>
          )}

          {manifest && (
            <>
              {/* Stats row */}
              <div style={{ display: "flex", gap: 28, flexWrap: "wrap", marginBottom: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.10em", color: MUTED }}>Universe Layers</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: PURPLE }}>{layerCount}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.10em", color: MUTED }}>Engines Loaded</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: TEAL }}>{engineNames.length}</span>
                </div>
                {manifest.name && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.10em", color: MUTED }}>OS Name</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: WHITE, maxWidth: 240 }}>{manifest.name}</span>
                  </div>
                )}
              </div>

              {/* Activation chain */}
              {initOrder.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{
                    margin: "0 0 10px", fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.10em", textTransform: "uppercase", color: MUTED,
                  }}>Activation Chain</p>
                  <div style={{
                    background: BG3, borderRadius: 10, padding: "10px 14px",
                    border: `1px solid ${DIM}`,
                  }}>
                    <ActivationChain layers={initOrder} />
                  </div>
                </div>
              )}

              {/* Engine list */}
              {engineNames.length > 0 && (
                <div>
                  <p style={{
                    margin: "0 0 10px", fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.10em", textTransform: "uppercase", color: MUTED,
                  }}>Engine Registry</p>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: 6,
                  }}>
                    {engineNames.map(name => (
                      <EngineRow key={name} name={name} active={true} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!manifest && !err.manifest && (
            <p style={{ color: MUTED, fontSize: 12 }}>Loading universe data\u2026</p>
          )}
        </div>

      </div>
    </div>
  );
}
