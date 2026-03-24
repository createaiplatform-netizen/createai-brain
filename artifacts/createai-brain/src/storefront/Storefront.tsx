// src/storefront/Storefront.tsx
import React, { useState } from "react";
import { Route, Link, useLocation } from "wouter";

// ─── Palette & tokens ────────────────────────────────────────────────────────

const P = {
  bg:         "#090d09",
  bgCard:     "#111a11",
  bgCardHov:  "#16221600",
  bgNav:      "rgba(9,13,9,0.92)",
  primary:    "#9CAF88",
  primaryDk:  "#7a9068",
  accent:     "#b8d4a8",
  text:       "#f0f4ee",
  textMuted:  "#9caf88",
  textDim:    "#6b8a5e",
  border:     "rgba(156,175,136,0.14)",
  borderHov:  "rgba(156,175,136,0.32)",
  shadow:     "0 2px 24px rgba(0,0,0,0.45)",
};

const FONT = "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

// ─── Global styles (keyframes + media queries) ────────────────────────────────

function StorefrontStyles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: ${P.bg}; color: ${P.text}; font-family: ${FONT}; }

      @keyframes sfFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes sfOverlayIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes sfOverlayOut { from { opacity: 1; } to { opacity: 0; } }

      .sf-page {
        animation: sfFadeIn 0.45s ease-out both;
      }

      /* Nav */
      .sf-nav {
        position: fixed; top: 0; left: 0; right: 0; z-index: 100;
        background: ${P.bgNav};
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border-bottom: 1px solid ${P.border};
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 40px; height: 60px;
      }
      .sf-nav-logo {
        font-size: 16px; font-weight: 600; letter-spacing: 0.04em;
        color: ${P.primary}; text-decoration: none;
      }
      .sf-nav-links {
        display: flex; align-items: center; gap: 28px; list-style: none;
      }
      .sf-nav-links a {
        font-size: 14px; color: ${P.textMuted}; text-decoration: none;
        transition: color 0.2s;
      }
      .sf-nav-links a:hover { color: ${P.text}; }
      .sf-nav-cta {
        font-size: 13px; font-weight: 600;
        color: ${P.bg} !important;
        background: ${P.primary};
        padding: 7px 18px; border-radius: 999px;
        transition: background 0.2s !important;
      }
      .sf-nav-cta:hover { background: ${P.accent} !important; color: ${P.bg} !important; }

      /* Layout */
      .sf-content { padding-top: 60px; }

      /* Sections */
      .sf-hero {
        min-height: 72vh;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        text-align: center; padding: 80px 24px 64px;
        background: radial-gradient(ellipse at 50% 0%, ${P.primaryDk}18, transparent 70%);
        border-bottom: 1px solid ${P.border};
      }
      .sf-hero-eyebrow {
        font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
        color: ${P.textMuted}; margin-bottom: 20px;
      }
      .sf-hero-title {
        font-size: clamp(2rem, 5vw, 3.4rem);
        font-weight: 700; line-height: 1.15;
        color: ${P.text}; margin-bottom: 20px; max-width: 720px;
      }
      .sf-hero-sub {
        font-size: clamp(1rem, 2vw, 1.2rem);
        color: ${P.textMuted}; line-height: 1.7;
        max-width: 520px; margin-bottom: 40px;
      }
      .sf-hero-actions {
        display: flex; gap: 14px; flex-wrap: wrap; justify-content: center;
      }
      .sf-btn-primary {
        font-size: 14px; font-weight: 600;
        background: ${P.primary}; color: ${P.bg};
        padding: 12px 28px; border-radius: 999px;
        text-decoration: none; transition: background 0.2s, transform 0.15s;
        cursor: pointer; border: none;
      }
      .sf-btn-primary:hover { background: ${P.accent}; transform: translateY(-1px); }
      .sf-btn-ghost {
        font-size: 14px; font-weight: 500;
        color: ${P.textMuted};
        padding: 12px 28px; border-radius: 999px;
        border: 1px solid ${P.border};
        text-decoration: none; transition: border-color 0.2s, color 0.2s;
      }
      .sf-btn-ghost:hover { border-color: ${P.primaryDk}; color: ${P.text}; }

      /* Section */
      .sf-section {
        max-width: 900px; margin: 0 auto; padding: 64px 24px;
        border-bottom: 1px solid ${P.border};
      }
      .sf-section:last-child { border-bottom: none; }
      .sf-section-label {
        font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
        color: ${P.textDim}; margin-bottom: 12px;
      }
      .sf-section h2 {
        font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 600;
        color: ${P.text}; margin-bottom: 16px;
      }
      .sf-section p {
        font-size: 1.05rem; color: ${P.textMuted}; line-height: 1.75; max-width: 620px;
      }

      /* Artifact grid */
      .sf-artifact-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 20px; list-style: none; margin-top: 32px;
      }
      .sf-card {
        background: ${P.bgCard};
        border: 1px solid ${P.border};
        border-radius: 16px;
        padding: 28px 24px;
        transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        cursor: default;
      }
      .sf-card:hover {
        border-color: ${P.borderHov};
        transform: translateY(-2px);
        box-shadow: ${P.shadow};
      }
      .sf-card h2, .sf-card h3 {
        font-size: 1.05rem; font-weight: 600;
        color: ${P.text}; margin-bottom: 10px;
      }
      .sf-card p {
        font-size: 0.92rem; color: ${P.textMuted}; line-height: 1.6;
      }

      /* Page header */
      .sf-page-header {
        max-width: 900px; margin: 0 auto; padding: 64px 24px 32px;
        border-bottom: 1px solid ${P.border};
      }
      .sf-page-header h1 {
        font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 700; color: ${P.text};
        margin-bottom: 12px;
      }
      .sf-page-header p {
        font-size: 1.05rem; color: ${P.textMuted}; line-height: 1.7; max-width: 560px;
      }

      /* Footer */
      .sf-footer {
        border-top: 1px solid ${P.border};
        padding: 40px 40px;
        display: flex; flex-direction: column; align-items: center; gap: 20px;
        margin-top: 40px;
      }
      .sf-footer-links {
        display: flex; gap: 28px; flex-wrap: wrap; justify-content: center; list-style: none;
      }
      .sf-footer-links a {
        font-size: 13px; color: ${P.textDim}; text-decoration: none;
        transition: color 0.2s;
      }
      .sf-footer-links a:hover { color: ${P.textMuted}; }
      .sf-footer-copy {
        font-size: 11px; color: ${P.textDim}; letter-spacing: 0.05em;
      }

      /* List (membership) */
      .sf-list {
        list-style: none; margin-top: 20px; display: flex; flex-direction: column; gap: 12px;
      }
      .sf-list li {
        font-size: 1rem; color: ${P.textMuted}; padding-left: 20px; position: relative;
        line-height: 1.6;
      }
      .sf-list li::before {
        content: "·"; position: absolute; left: 0; color: ${P.primary}; font-size: 1.2rem;
        line-height: 1.4;
      }

      /* Utility */
      .sf-link-muted {
        font-size: 13px; color: ${P.textDim}; text-decoration: none;
        transition: color 0.2s;
      }
      .sf-link-muted:hover { color: ${P.textMuted}; }
      .sf-text-center { text-align: center; }
      .sf-mt-lg { margin-top: 40px; }
      .sf-mt-md { margin-top: 24px; }

      /* Transition overlay */
      .sf-transition-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: ${P.bg}; opacity: 0; pointer-events: none;
        transition: opacity 0.4s ease;
      }
      .sf-transition-overlay.active { opacity: 1; pointer-events: all; }

      /* Mobile */
      @media (max-width: 640px) {
        .sf-nav { padding: 0 20px; }
        .sf-nav-links { gap: 14px; }
        .sf-nav-links a { font-size: 12px; }
        .sf-section, .sf-page-header { padding-left: 20px; padding-right: 20px; }
        .sf-hero { padding: 64px 20px 48px; }
        .sf-hero-actions { flex-direction: column; align-items: center; }
        .sf-artifact-grid { grid-template-columns: 1fr; }
        .sf-footer { padding: 32px 20px; }
        .sf-footer-links { gap: 16px; }
      }
    `}</style>
  );
}

// ─── Transition overlay (fade to dark before navigating) ─────────────────────

function useFadeNav() {
  const [fading, setFading] = useState(false);
  const [, navigate] = useLocation();

  function fadeTo(href: string) {
    setFading(true);
    setTimeout(() => navigate(href), 420);
  }

  return { fading, fadeTo };
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function StorefrontNav({ onEnterWorld }: { onEnterWorld: () => void }) {
  return (
    <nav className="sf-nav">
      <Link href="/" className="sf-nav-logo">CreateAI</Link>
      <ul className="sf-nav-links">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/artifacts">Artifacts</Link></li>
        <li><Link href="/membership">Membership</Link></li>
        <li><Link href="/about">About</Link></li>
        <li>
          <a className="sf-nav-cta" onClick={onEnterWorld} href="#" style={{ cursor: "pointer" }}>
            Enter the World
          </a>
        </li>
      </ul>
    </nav>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function StorefrontFooter() {
  return (
    <footer className="sf-footer">
      <ul className="sf-footer-links">
        <li><Link href="/about" className="">About</Link></li>
        <li><Link href="/membership" className="">Membership</Link></li>
        <li><Link href="/artifacts" className="">Artifacts</Link></li>
        <li><Link href="/entity/root" className="">Universe</Link></li>
      </ul>
      <p className="sf-footer-copy">CreateAI · Lakeside Trinity LLC · All rights reserved</p>
    </footer>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

function StorefrontHome({ onEnterWorld }: { onEnterWorld: () => void }) {
  return (
    <main className="sf-page sf-content">
      <section className="sf-hero">
        <p className="sf-hero-eyebrow">A living creative universe</p>
        <h1 className="sf-hero-title">Welcome to the CreateAI World</h1>
        <p className="sf-hero-sub">
          A calm, human space where ideas become living artifacts.
          Not products, but pieces of a universe.
        </p>
        <div className="sf-hero-actions">
          <button className="sf-btn-primary" onClick={onEnterWorld}>
            Enter the World
          </button>
          <Link href="/artifacts" className="sf-btn-ghost">Explore the Artifacts</Link>
        </div>
      </section>

      <div className="sf-section">
        <p className="sf-section-label">What this place is</p>
        <h2>A collection of tools, stories, and systems</h2>
        <p>
          Designed to help you build your own world—your way.
          Every artifact is crafted with intention and calm clarity.
        </p>
      </div>

      <div className="sf-section">
        <p className="sf-section-label">Featured artifacts</p>
        <h2>Start here</h2>
        <ul className="sf-artifact-grid">
          <li className="sf-card">
            <h3>The Story Engine</h3>
            <p>Shape worlds, characters, and meaning with intention.</p>
          </li>
          <li className="sf-card">
            <h3>The Memory Weaver</h3>
            <p>Capture lived experience and turn it into something beautiful.</p>
          </li>
          <li className="sf-card">
            <h3>The Creator's Compass</h3>
            <p>Navigate your creative life with clarity and calm.</p>
          </li>
        </ul>
        <div className="sf-mt-md">
          <Link href="/artifacts" className="sf-link-muted">See all artifacts →</Link>
        </div>
      </div>

      <StorefrontFooter />
    </main>
  );
}

// ─── Artifacts ────────────────────────────────────────────────────────────────

const ARTIFACTS = [
  {
    id: "story-engine",
    name: "The Story Engine",
    summary: "A guide for shaping worlds, characters, and meaning.",
  },
  {
    id: "memory-weaver",
    name: "The Memory Weaver",
    summary: "A gentle framework for capturing your lived experiences.",
  },
  {
    id: "creators-compass",
    name: "The Creator's Compass",
    summary: "A grounding system for your creative life.",
  },
];

function ArtifactsPage() {
  return (
    <main className="sf-page sf-content">
      <div className="sf-page-header">
        <h1>Artifacts</h1>
        <p>Choose the pieces that belong in your world.</p>
      </div>

      <div className="sf-section">
        <ul className="sf-artifact-grid">
          {ARTIFACTS.map((a) => (
            <li key={a.id} className="sf-card">
              <h2>{a.name}</h2>
              <p>{a.summary}</p>
            </li>
          ))}
        </ul>
      </div>

      <StorefrontFooter />
    </main>
  );
}

// ─── Membership ───────────────────────────────────────────────────────────────

function MembershipPage() {
  return (
    <main className="sf-page sf-content">
      <div className="sf-page-header">
        <h1>Inner Circle Membership</h1>
        <p>
          A quiet, supportive space for deeper tools, early access,
          and behind-the-scenes worldbuilding.
        </p>
      </div>

      <div className="sf-section">
        <p className="sf-section-label">What you receive</p>
        <h2>Deeper access to the universe</h2>
        <ul className="sf-list">
          <li>Deeper, universe-aligned tools</li>
          <li>Private artifacts and experiments</li>
          <li>Early access to new worlds and systems</li>
        </ul>
      </div>

      <div className="sf-section">
        <p className="sf-section-label">What it's really about</p>
        <h2>Belonging to the world you're building</h2>
        <p>
          Membership isn't about more content.
          It's about belonging to the world you're building.
        </p>
      </div>

      <StorefrontFooter />
    </main>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────

function AboutPage() {
  return (
    <main className="sf-page sf-content">
      <div className="sf-page-header">
        <h1>About this world</h1>
        <p>
          Built with love for families, creators, and anyone who
          wants to make something meaningful.
        </p>
      </div>

      <div className="sf-section">
        <p>
          CreateAI isn't just a product line. It's a doorway—a place where
          your ideas can breathe and become real.
        </p>
      </div>

      <StorefrontFooter />
    </main>
  );
}

// ─── Shell (nav + overlay shared across all storefront pages) ─────────────────

function StorefrontShell({ children }: { children: React.ReactNode }) {
  const { fading, fadeTo } = useFadeNav();

  function handleEnterWorld(e: React.MouseEvent) {
    e.preventDefault();
    fadeTo("/entity/root");
  }

  const childrenWithProps = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child as React.ReactElement<{ onEnterWorld?: (e: React.MouseEvent) => void }>, { onEnterWorld: handleEnterWorld })
      : child
  );

  return (
    <>
      <StorefrontStyles />
      <div className={`sf-transition-overlay${fading ? " active" : ""}`} />
      <StorefrontNav onEnterWorld={handleEnterWorld} />
      {childrenWithProps}
    </>
  );
}

// ─── Routes export ────────────────────────────────────────────────────────────

export function StorefrontRoutes() {
  return (
    <>
      <Route path="/">
        {() => (
          <StorefrontShell>
            <StorefrontHome onEnterWorld={() => {}} />
          </StorefrontShell>
        )}
      </Route>
      <Route path="/artifacts">
        {() => (
          <StorefrontShell>
            <ArtifactsPage />
          </StorefrontShell>
        )}
      </Route>
      <Route path="/membership">
        {() => (
          <StorefrontShell>
            <MembershipPage />
          </StorefrontShell>
        )}
      </Route>
      <Route path="/about">
        {() => (
          <StorefrontShell>
            <AboutPage />
          </StorefrontShell>
        )}
      </Route>
    </>
  );
}
