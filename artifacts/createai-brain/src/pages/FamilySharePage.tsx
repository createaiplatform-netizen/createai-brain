import React from "react";

const SAGE       = "#7a9068";
const SAGE_DARK  = "#5a6d50";
const SAGE_LIGHT = "#f0f4ee";
const SAGE_MID   = "#9CAF88";

const FEATURES = [
  { icon: "🏡", title: "Family Universe",    desc: "A private space for the whole family — shared goals, memories, events, and a family bank." },
  { icon: "🧠", title: "408+ AI Apps",       desc: "Business, health, legal, creative, education — every domain covered with real AI tools." },
  { icon: "💚", title: "Family Messages",    desc: "Personalized messages from Sara, always here at your private link — no login needed." },
  { icon: "🏥", title: "HealthOS",           desc: "Complete healthcare management built into the platform." },
  { icon: "⚖️", title: "Legal Suite",       desc: "Contracts, documents, and legal tools — all AI-powered." },
  { icon: "👥", title: "Staffing & Business", desc: "Full staffing and business management tools for teams and professionals." },
];

export default function FamilySharePage() {
  return (
    <div style={pageWrap}>

      {/* ── Nav bar ── */}
      <nav style={navStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={logoBox}>🧠</div>
          <span style={{ fontWeight: 900, fontSize: 16, color: "#0a0a0a", letterSpacing: "-0.5px" }}>
            CreateAI Brain
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/family" style={navLink}>Family Portal</a>
          <a href="/" style={navCta}>Enter Platform →</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={heroSection}>

        <div style={pillBadge}>
          <span style={{ fontSize: 12 }}>💚</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: SAGE }}>
            From Sara Stadler · Lakeside Trinity LLC
          </span>
        </div>

        <h1 style={heroH1}>
          Welcome to the<br />
          <span style={{ background: `linear-gradient(135deg, ${SAGE} 0%, ${SAGE_DARK} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Family Universe
          </span>
        </h1>

        <p style={heroSubtitle}>
          This is our family's private platform — built with love and powered by AI.
          You each have a personal message waiting for you, and a family space we can all share.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 36 }}>
          <a href="/family" style={heroCta}>
            🏡 Enter the Family Portal
          </a>
          <a href="/" style={heroCtaSecondary}>
            Explore the full platform →
          </a>
        </div>

        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 16, textAlign: "center" }}>
          No account needed to view your personal message · Login to access the family space
        </p>
      </section>

      {/* ── Personal Message Banner ── */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{
          background: `linear-gradient(135deg, ${SAGE} 0%, ${SAGE_DARK} 100%)`,
          borderRadius: 20, padding: "32px 36px",
          boxShadow: "0 16px 48px rgba(122,144,104,0.30)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160,
            borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "relative" }}>
            <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 12, fontWeight: 700,
              letterSpacing: "0.10em", textTransform: "uppercase", margin: "0 0 10px" }}>
              💌 Your personal message
            </p>
            <h2 style={{ color: "#fff", fontSize: "clamp(18px,4vw,26px)", fontWeight: 900,
              letterSpacing: "-0.02em", margin: "0 0 12px", lineHeight: 1.3 }}>
              Sara has written a personal message for each of you.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.80)", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px", maxWidth: 520 }}>
              Each family member has a private link with their own personalized message —
              no login required, always accessible, always there.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{
                background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 16px",
                fontSize: 13, color: "#fff", fontWeight: 600,
              }}>
                📲 Ask Sara for your personal link
              </div>
              <div style={{
                background: "rgba(255,255,255,0.10)", borderRadius: 10, padding: "10px 16px",
                fontSize: 13, color: "rgba(255,255,255,0.80)", fontWeight: 500,
              }}>
                🔒 Private · Permanent · No login needed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What's inside ── */}
      <section style={{ background: "#fff", padding: "64px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
            color: "#94a3b8", textAlign: "center", margin: "0 0 12px" }}>
            What's inside
          </p>
          <h2 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 900, color: "#0a0a0a",
            textAlign: "center", letterSpacing: "-0.03em", margin: "0 0 12px" }}>
            More than an app. It's our family OS.
          </h2>
          <p style={{ fontSize: 15, color: "#6b7280", textAlign: "center", margin: "0 0 48px", lineHeight: 1.6 }}>
            Built by Sara Stadler for Lakeside Trinity LLC — combining AI tools, a family portal,
            and everything we need in one place.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: SAGE_LIGHT, borderRadius: 16, padding: "24px 20px",
                border: `1px solid ${SAGE_MID}22`,
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0a", margin: "0 0 6px" }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sara's note ── */}
      <section style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: `linear-gradient(135deg, ${SAGE_MID} 0%, ${SAGE} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, margin: "0 auto 20px",
          }}>💚</div>
          <blockquote style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(16px,3vw,20px)", color: "#1e293b",
            lineHeight: 1.7, fontStyle: "italic", margin: "0 0 20px",
          }}>
            "I built this for all of us — so we can stay connected, grow together,
            and always have a place that's just ours."
          </blockquote>
          <p style={{ fontSize: 14, fontWeight: 700, color: SAGE_DARK, margin: "0 0 4px" }}>Sara Stadler</p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Founder · Lakeside Trinity LLC</p>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{ background: SAGE_LIGHT, padding: "56px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 900, color: "#0a0a0a",
            letterSpacing: "-0.03em", margin: "0 0 12px" }}>
            Ready to explore?
          </h2>
          <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 32px", lineHeight: 1.6 }}>
            The family portal is waiting for you. Log in with the account Sara created for you,
            or explore the platform as a guest.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/family" style={heroCta}>🏡 Family Portal</a>
            <a href="/" style={heroCtaSecondary}>Full Platform →</a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: "28px 24px", textAlign: "center", borderTop: `1px solid ${SAGE_LIGHT}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <div style={logoBox}>🧠</div>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#0a0a0a" }}>CreateAI Brain</span>
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
          by Lakeside Trinity LLC · <a href="https://createai.digital" style={{ color: SAGE, textDecoration: "none" }}>createai.digital</a>
        </p>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageWrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "#ffffff",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const navStyle: React.CSSProperties = {
  position: "sticky", top: 0, zIndex: 50,
  background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
  borderBottom: "1px solid #f0f0f0",
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "0 28px", height: 60,
};

const logoBox: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8,
  background: `linear-gradient(135deg, ${SAGE} 0%, ${SAGE_DARK} 100%)`,
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
};

const navLink: React.CSSProperties = {
  color: "#374151", fontSize: 14, fontWeight: 600,
  textDecoration: "none", padding: "8px 14px", borderRadius: 8,
};

const navCta: React.CSSProperties = {
  background: `linear-gradient(135deg, ${SAGE} 0%, ${SAGE_DARK} 100%)`,
  color: "#fff", fontSize: 14, fontWeight: 700,
  textDecoration: "none", padding: "8px 18px", borderRadius: 8,
  boxShadow: "0 4px 12px rgba(122,144,104,0.35)",
};

const heroSection: React.CSSProperties = {
  maxWidth: 860, margin: "0 auto",
  padding: "80px 24px 64px", textAlign: "center",
};

const pillBadge: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: `${SAGE}12`, border: `1px solid ${SAGE}30`,
  borderRadius: 100, padding: "6px 16px", marginBottom: 28,
};

const heroH1: React.CSSProperties = {
  fontSize: "clamp(34px,6vw,60px)", fontWeight: 900, color: "#0a0a0a",
  lineHeight: 1.1, letterSpacing: "-0.04em", margin: "0 0 20px",
};

const heroSubtitle: React.CSSProperties = {
  fontSize: "clamp(15px,2vw,18px)", color: "#6b7280",
  lineHeight: 1.7, maxWidth: 560, margin: "0 auto",
};

const heroCta: React.CSSProperties = {
  display: "inline-block", textDecoration: "none",
  background: `linear-gradient(135deg, ${SAGE} 0%, ${SAGE_DARK} 100%)`,
  color: "#fff", fontSize: 15, fontWeight: 700,
  padding: "14px 28px", borderRadius: 12,
  boxShadow: "0 8px 28px rgba(122,144,104,0.40)",
};

const heroCtaSecondary: React.CSSProperties = {
  display: "inline-block", textDecoration: "none",
  background: "#fff", border: "1.5px solid #e5e7eb",
  color: "#374151", fontSize: 15, fontWeight: 600,
  padding: "14px 26px", borderRadius: 12,
};
