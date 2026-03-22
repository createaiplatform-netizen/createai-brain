// ─── WonderSpark — Subtle Magic Layer ─────────────────────────────────────────
// Two components:
//   WonderSpark — floating particles in the creation type's colour.
//   CreationAffirmation — the gentle post-save message that fades after 3.5s.
//
// Both are aria-hidden and pointer-events-none — purely decorative.
// Used at save moments, on public family pages, and in creation headers.

import { useEffect, useState } from "react";

// ─── WonderSpark ───────────────────────────────────────────────────────────────

interface SparkProps {
  color?:   string;
  count?:   number;
  active?:  boolean;
  size?:    "sm" | "md" | "lg";
}

export function WonderSpark({ color = "#c4a97a", count = 7, active = true, size = "md" }: SparkProps) {
  if (!active) return null;

  const basePx = size === "sm" ? 2 : size === "lg" ? 5 : 3;

  const particles = Array.from({ length: count }, (_, i) => ({
    id:    i,
    left:  `${8 + (i / count) * 84}%`,
    delay: `${(i * 0.13).toFixed(2)}s`,
    px:    basePx + (i % 3),
    dur:   `${1.1 + (i % 4) * 0.35}s`,
    drift: `${-8 + (i % 5) * 4}px`,
  }));

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 10 }}>
      <style>{`
        @keyframes wonder-float {
          0%   { opacity: 0;   transform: translateY(0)    translateX(0)    scale(0.4); }
          25%  { opacity: 1; }
          80%  { opacity: 0.5; }
          100% { opacity: 0;   transform: translateY(-70px) translateX(var(--drift)) scale(1.3); }
        }
      `}</style>
      {particles.map(p => (
        <span
          key={p.id}
          style={{
            position:     "absolute",
            bottom:       "15%",
            left:         p.left,
            width:        `${p.px}px`,
            height:       `${p.px}px`,
            borderRadius: "50%",
            background:   color,
            opacity:      0,
            animation:    `wonder-float ${p.dur} ${p.delay} ease-out forwards`,
            boxShadow:    `0 0 ${p.px * 2}px ${color}80`,
            "--drift":    p.drift,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── CreationAffirmation ───────────────────────────────────────────────────────
// Shown immediately after a creation is saved.
// Fades out after 3.5 seconds, then calls onDone to unmount.

interface AffirmationProps {
  message:  string;
  color:    string;
  accentBg?: string;
  onDone?:  () => void;
}

export function CreationAffirmation({ message, color, accentBg, onDone }: AffirmationProps) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 300);
    const t2 = setTimeout(() => setPhase("out"),  3000);
    const t3 = setTimeout(() => onDone?.(),        3600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-5 py-4 text-center mb-4"
      style={{
        background:  accentBg ?? `${color}10`,
        border:      `1px solid ${color}28`,
        opacity:     phase === "out" ? 0 : 1,
        transform:   phase === "in" ? "translateY(6px)" : "translateY(0)",
        transition:  "opacity 0.5s ease, transform 0.4s ease",
      }}>
      {/* Spark particles — fire once on mount */}
      <WonderSpark color={color} count={8} active={phase === "in" || phase === "hold"} />
      <p
        className="font-semibold text-[14px] relative z-10 leading-relaxed"
        style={{ color }}>
        {message}
      </p>
    </div>
  );
}

// ─── WonderBadge ──────────────────────────────────────────────────────────────
// Small safety/presence badge for public family pages.

interface BadgeProps {
  label:  string;
  color:  string;
  icon?:  string;
}

export function WonderBadge({ label, color, icon }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: `${color}14`, color, border: `1px solid ${color}22` }}>
      {icon && <span className="text-[10px]">{icon}</span>}
      {label}
    </span>
  );
}

// ─── WonderGlow ───────────────────────────────────────────────────────────────
// A soft ambient glow behind content cards — warmth and depth without harshness.

interface GlowProps {
  color:    string;
  opacity?: number;
  blur?:    number;
}

export function WonderGlow({ color, opacity = 0.08, blur = 40 }: GlowProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-inherit"
      style={{
        background:  color,
        opacity,
        filter:      `blur(${blur}px)`,
        zIndex:      0,
      }}
    />
  );
}
