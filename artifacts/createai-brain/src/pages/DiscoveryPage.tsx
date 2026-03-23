/**
 * DiscoveryPage — Public registry-driven discovery grid
 * ──────────────────────────────────────────────────────
 * Route: /discover  (public, no auth required)
 * Fetches /api/discovery/surfaces and renders each surface as an InviteCard.
 * Full SEO metadata for crawlers and link previews.
 * Self-expanding: adding a surface to publicSurfaces.ts auto-appears here.
 */

import React from "react";
import { SEOMeta } from "@/components/SEOMeta";
import { InviteCard, type InviteSurface } from "@/components/invite";

const SAGE = "#7a9068";

interface DiscoverySurface {
  id:       string;
  title:    string;
  tagline:  string;
  path:     string;
  icon:     string;
  category: string;
  canonical: string;
  sharePayload: { title: string; text: string; url: string };
  og: { title: string; description: string; url: string; image: string };
}

const CATEGORY_LABELS: Record<string, string> = {
  platform:  "Core Platform",
  tool:      "Industry Tools",
  invite:    "Invite & Join",
  broadcast: "Broadcast",
  hub:       "Hubs & Spaces",
};

export default function DiscoveryPage() {
  const [surfaces, setSurfaces]   = React.useState<DiscoverySurface[]>([]);
  const [loading,  setLoading]    = React.useState(true);
  const [error,    setError]      = React.useState(false);
  const [filter,   setFilter]     = React.useState<string>("all");

  React.useEffect(() => {
    fetch("/api/discovery/surfaces")
      .then(r => r.json())
      .then(d => { if (d.ok) setSurfaces(d.surfaces); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const categories = React.useMemo(() => {
    const seen = new Set<string>();
    surfaces.forEach(s => seen.add(s.category));
    return ["all", ...seen];
  }, [surfaces]);

  const visible = filter === "all" ? surfaces : surfaces.filter(s => s.category === filter);

  // Convert DiscoverySurface → InviteSurface for InviteCard
  function toInviteSurface(s: DiscoverySurface): InviteSurface {
    return {
      id:        s.id,
      title:     s.title,
      tagline:   s.tagline,
      link:      s.path,
      joinLabel: "Explore",
      icon:      s.icon,
      color:     SAGE,
      category:  s.category,
    };
  }

  return (
    <>
      <SEOMeta
        title="Discover CreateAI Brain — 365+ AI Tools, Surfaces & Spaces"
        description="Browse every public surface, tool, hub, and space in the CreateAI Brain ecosystem. Find the right AI for any job, industry, or goal."
        canonical="https://createai.digital/discover"
        ogTitle="Discover CreateAI Brain"
        ogDescription="365+ intelligent tools in one OS. Explore every surface — healthcare, legal, staffing, family, finance, and more."
        ogUrl="https://createai.digital/discover"
        structuredData={{
          "@context": "https://schema.org",
          "@type":    "CollectionPage",
          name:       "CreateAI Brain Discovery Index",
          description: "Public index of all surfaces, tools, and spaces in the CreateAI Brain ecosystem.",
          url:        "https://createai.digital/discover",
          publisher: {
            "@type": "Organization",
            name:    "Lakeside Trinity LLC",
            url:     "https://createai.digital",
          },
        }}
      />

      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
        {/* Header */}
        <div style={{ background: SAGE, color: "#fff", padding: "40px 24px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.03em" }}>
            Discover CreateAI Brain
          </h1>
          <p style={{ fontSize: 15, opacity: .88, margin: "0 0 24px", maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
            Every surface, tool, hub, and space — publicly indexed and ready to explore.
          </p>
          <a href="/broadcast" style={{
            display: "inline-block", background: "rgba(255,255,255,.2)",
            color: "#fff", textDecoration: "none", borderRadius: 24,
            padding: "8px 22px", fontSize: 13, fontWeight: 700,
            border: "1.5px solid rgba(255,255,255,.4)",
          }}>
            📡 Subscribe to live updates
          </a>
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "20px 24px 0", justifyContent: "center" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: "none", cursor: "pointer",
              background: filter === cat ? SAGE : "#e5e7eb",
              color: filter === cat ? "#fff" : "#374151",
            }}>
              {cat === "all" ? "All" : (CATEGORY_LABELS[cat] ?? cat)}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af", fontSize: 14 }}>
              Loading surfaces…
            </div>
          )}
          {error && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#ef4444", fontSize: 14 }}>
              Could not load surfaces. Please try again.
            </div>
          )}
          {!loading && !error && visible.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af", fontSize: 14 }}>
              No surfaces in this category yet.
            </div>
          )}
          {!loading && !error && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {visible.map(s => (
                <InviteCard key={s.id} surface={toInviteSurface(s)} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "32px 24px", borderTop: "1px solid #e5e7eb", color: "#9ca3af", fontSize: 12 }}>
          <strong style={{ color: "#374151" }}>CreateAI Brain</strong> by Lakeside Trinity LLC ·{" "}
          <a href="/public" style={{ color: SAGE, textDecoration: "none" }}>Public Portal</a> ·{" "}
          <a href="/broadcast" style={{ color: SAGE, textDecoration: "none" }}>Broadcast Network</a> ·{" "}
          <a href="/sitemap.xml" style={{ color: SAGE, textDecoration: "none" }}>Sitemap</a>
        </div>
      </div>
    </>
  );
}
