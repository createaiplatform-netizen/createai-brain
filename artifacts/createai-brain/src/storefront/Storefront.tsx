// src/storefront/Storefront.tsx — CreateAI Digital
import React from "react";
import { Route, Link, useLocation } from "wouter";

// ─── Palette ─────────────────────────────────────────────────────────────────

const P = {
  bg:       "#090d09",
  bgCard:   "#111a11",
  bgNav:    "rgba(9,13,9,0.94)",
  primary:  "#9CAF88",
  accent:   "#b8d4a8",
  text:     "#f0f4ee",
  muted:    "#9caf88",
  dim:      "#6b8a5e",
  border:   "rgba(156,175,136,0.13)",
  borderHv: "rgba(156,175,136,0.30)",
};

const FONT = "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

// ─── Global styles ────────────────────────────────────────────────────────────

function Styles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: ${P.bg}; color: ${P.text}; font-family: ${FONT}; }

      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: none; }
      }
      .cad-page { animation: fadeUp 0.4s ease-out both; }

      /* ── Nav ── */
      .cad-nav {
        position: fixed; top: 0; left: 0; right: 0; z-index: 100;
        height: 58px; padding: 0 36px;
        background: ${P.bgNav};
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid ${P.border};
        display: flex; align-items: center; justify-content: space-between;
      }
      .cad-nav-logo {
        font-size: 15px; font-weight: 700; letter-spacing: 0.05em;
        color: ${P.primary}; text-decoration: none;
      }
      .cad-nav-links {
        display: flex; gap: 6px; list-style: none; align-items: center;
      }
      .cad-nav-links a {
        font-size: 13px; color: ${P.muted}; text-decoration: none;
        padding: 6px 14px; border-radius: 8px;
        transition: color 0.18s, background 0.18s;
      }
      .cad-nav-links a:hover { color: ${P.text}; background: rgba(156,175,136,0.08); }
      .cad-nav-links a.active { color: ${P.text}; background: rgba(156,175,136,0.12); }

      /* ── Content ── */
      .cad-content { padding-top: 58px; min-height: 100vh; }

      /* ── Hero placeholder ── */
      .cad-hero {
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        min-height: calc(100vh - 58px);
        padding: 60px 24px;
        text-align: center;
        background: radial-gradient(ellipse at 50% 20%, rgba(156,175,136,0.07), transparent 65%);
      }
      .cad-tag {
        font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
        color: ${P.dim}; margin-bottom: 18px;
        padding: 4px 12px; border: 1px solid ${P.border}; border-radius: 999px;
        display: inline-block;
      }
      .cad-title {
        font-size: clamp(2rem, 6vw, 3.8rem);
        font-weight: 700; line-height: 1.12;
        color: ${P.text}; margin-bottom: 18px;
        letter-spacing: -0.01em;
      }
      .cad-sub {
        font-size: clamp(0.95rem, 2vw, 1.15rem);
        color: ${P.muted}; line-height: 1.75; max-width: 480px;
      }
      .cad-divider {
        width: 40px; height: 2px;
        background: ${P.primary}; border-radius: 2px;
        margin: 28px auto 0; opacity: 0.5;
      }

      /* ── Card grid (for future use) ── */
      .cad-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 16px; padding: 0 36px 48px; max-width: 960px; margin: 0 auto;
      }
      .cad-card {
        background: ${P.bgCard};
        border: 1px solid ${P.border};
        border-radius: 14px; padding: 24px 20px;
        transition: border-color 0.18s, transform 0.18s;
      }
      .cad-card:hover { border-color: ${P.borderHv}; transform: translateY(-2px); }
      .cad-card h3 { font-size: 0.95rem; font-weight: 600; color: ${P.text}; margin-bottom: 8px; }
      .cad-card p  { font-size: 0.88rem; color: ${P.muted}; line-height: 1.6; }

      /* ── Mobile ── */
      @media (max-width: 600px) {
        .cad-nav { padding: 0 18px; }
        .cad-nav-links a { padding: 5px 10px; font-size: 12px; }
        .cad-grid { padding: 0 18px 40px; }
      }
    `}</style>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Home",      href: "/home"      },
  { label: "Store",     href: "/store"     },
  { label: "Family",    href: "/family"    },
  { label: "Kids",      href: "/kids"      },
  { label: "Dashboard", href: "/dashboard" },
];

function Nav() {
  const [location] = useLocation();
  return (
    <nav className="cad-nav">
      <Link href="/home" className="cad-nav-logo">CreateAI</Link>
      <ul className="cad-nav-links">
        {NAV_LINKS.map(({ label, href }) => (
          <li key={href}>
            <Link href={href} className={location === href ? "active" : ""}>{label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ─── Placeholder page factory ─────────────────────────────────────────────────

function PlaceholderPage({
  tag,
  title,
  description,
}: {
  tag: string;
  title: string;
  description: string;
}) {
  return (
    <main className="cad-page cad-content">
      <div className="cad-hero">
        <span className="cad-tag">{tag}</span>
        <h1 className="cad-title">{title}</h1>
        <p className="cad-sub">{description}</p>
        <div className="cad-divider" />
      </div>
    </main>
  );
}

// ─── Pages ───────────────────────────────────────────────────────────────────

function HomePage() {
  return (
    <main className="cad-page cad-content">
      <div className="cad-hero">
        <span className="cad-tag">createai.digital</span>
        <h1 className="cad-title">Welcome to CreateAI</h1>
        <p className="cad-sub">
          A calm, intelligent space for building worlds, managing your family,
          and running your creative life—all in one place.
        </p>
        <div className="cad-divider" />
      </div>
    </main>
  );
}

function StorePage() {
  return (
    <PlaceholderPage
      tag="Store"
      title="DIGITAL STORE"
      description="Digital products, tools, and resources coming soon."
    />
  );
}

function FamilyPage() {
  return (
    <PlaceholderPage
      tag="Family Portal"
      title="FAMILY PORTAL"
      description="Your family's private space — messaging, banking, memories, and more."
    />
  );
}

function KidsPage() {
  return (
    <PlaceholderPage
      tag="Kids"
      title="KID PORTAL"
      description="A safe, creative space designed just for kids."
    />
  );
}

function DashboardPage() {
  return (
    <PlaceholderPage
      tag="Dashboard"
      title="DASHBOARD"
      description="Your main control center. Everything in one place."
    />
  );
}

function IdentityPage() {
  return (
    <PlaceholderPage
      tag="Engine"
      title="IDENTITY ENGINE"
      description="Deterministic identity and theme generation for every entity in the universe."
    />
  );
}

function UniversePage() {
  return (
    <PlaceholderPage
      tag="Engine"
      title="UNIVERSE ENGINE"
      description="Build and explore your living creative universe."
    />
  );
}

function ThemePage() {
  return (
    <PlaceholderPage
      tag="Engine"
      title="THEME ENGINE"
      description="Visual identity and color system for every member and entity."
    />
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Styles />
      <Nav />
      {children}
    </>
  );
}

// ─── Routes export ────────────────────────────────────────────────────────────

export function StorefrontRoutes() {
  return (
    <>
      <Route path="/home">      {() => <Shell><HomePage /></Shell>}      </Route>
      <Route path="/store">     {() => <Shell><StorePage /></Shell>}     </Route>
      <Route path="/family">    {() => <Shell><FamilyPage /></Shell>}    </Route>
      <Route path="/kids">      {() => <Shell><KidsPage /></Shell>}      </Route>
      <Route path="/dashboard"> {() => <Shell><DashboardPage /></Shell>} </Route>
      <Route path="/identity">  {() => <Shell><IdentityPage /></Shell>}  </Route>
      <Route path="/universe">  {() => <Shell><UniversePage /></Shell>}  </Route>
      <Route path="/theme">     {() => <Shell><ThemePage /></Shell>}     </Route>
    </>
  );
}
