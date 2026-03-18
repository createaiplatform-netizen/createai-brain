import React, { useEffect, useRef } from "react";

/**
 * AtmosphericLayer — room-scale ambient environment
 *
 * Three independent visual systems rendered as a fixed full-viewport canvas
 * behind all content (pointer-events: none, z-index: 0):
 *
 *  1. Gradient wash   — two slow-drifting radial blobs of indigo/violet at 3-4% opacity
 *  2. Micro-particles — 14 tiny dots drifting upward with randomised speed, size, and path
 *  3. Depth haze      — a very subtle vignette that reinforces spatial depth
 *
 * All motion is CSS-only where possible. A single canvas element is used for
 * the particles to keep the DOM lean. Everything honours prefers-reduced-motion.
 */

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left:  10 + (i * 6.1)  % 82,  // percent
  size:  i % 3 === 0 ? 2.5 : i % 3 === 1 ? 2 : 1.5,
  dur:   22 + (i * 3.7) % 24,   // seconds
  delay: -(i * 2.3) % 20,       // negative = already mid-flight
  dx:    -12 + (i * 4.1) % 24,  // horizontal drift px
  opacity: i % 4 === 0 ? 0.28 : i % 4 === 1 ? 0.20 : i % 4 === 2 ? 0.16 : 0.24,
}));

export function AtmosphericLayer() {
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  if (prefersReducedMotion.current) return null;

  return (
    <>
      {/* ── Gradient wash blobs ────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* Primary blob — indigo, top-right */}
        <div style={{
          position: "absolute",
          width: "70vw", height: "55vh",
          top: "-15vh", right: "-10vw",
          background: "radial-gradient(ellipse at center, rgba(99,102,241,0.055) 0%, transparent 70%)",
          animation: "blobDrift1 38s ease-in-out infinite",
          willChange: "transform",
        }} />

        {/* Secondary blob — violet, bottom-left */}
        <div style={{
          position: "absolute",
          width: "55vw", height: "60vh",
          bottom: "-20vh", left: "-8vw",
          background: "radial-gradient(ellipse at center, rgba(139,92,246,0.04) 0%, transparent 70%)",
          animation: "blobDrift2 47s ease-in-out infinite",
          willChange: "transform",
        }} />

        {/* Tertiary blob — sky blue, center */}
        <div style={{
          position: "absolute",
          width: "45vw", height: "40vh",
          top: "30vh", left: "25vw",
          background: "radial-gradient(ellipse at center, rgba(56,189,248,0.025) 0%, transparent 70%)",
          animation: "blobDrift3 56s ease-in-out infinite",
          willChange: "transform",
        }} />

        {/* ── Micro-particles ─────────────────────────────────────────── */}
        {PARTICLES.map(p => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left:   `${p.left}%`,
              bottom: "-4px",
              width:  p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.id % 3 === 0
                ? `rgba(99,102,241,${p.opacity})`
                : p.id % 3 === 1
                  ? `rgba(139,92,246,${p.opacity * 0.85})`
                  : `rgba(148,163,184,${p.opacity * 0.7})`,
              animation: `particleFloat ${p.dur}s linear ${p.delay}s infinite`,
              "--pdx": `${p.dx}px`,
            } as React.CSSProperties}
          />
        ))}

        {/* ── Depth vignette — reinforces spatial depth ─────────────── */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 60%, rgba(220,225,240,0.18) 100%)",
          pointerEvents: "none",
        }} />
      </div>
    </>
  );
}
