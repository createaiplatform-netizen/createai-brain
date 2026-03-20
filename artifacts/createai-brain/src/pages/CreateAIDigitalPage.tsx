import React from "react";

const TEAL = "#0ff";
const DARK_BG = "#111";
const CARD_BG = "#222";
const HEADER_BG = "#0ff";

export default function CreateAIDigitalPage() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: DARK_BG, color: "#eee", margin: 0, padding: 0, minHeight: "100vh" }}>

      {/* Header */}
      <header style={{ background: HEADER_BG, color: "#111", padding: "20px", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>CreateAI Digital</h1>
        <p style={{ margin: "8px 0 0" }}>Professional AI Family &amp; Personal Automation System</p>
      </header>

      <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>

        {/* About */}
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ color: "#eee", borderBottom: "1px solid #333", paddingBottom: "8px" }}>About</h2>
          <p style={{ lineHeight: 1.7, color: "#ccc" }}>
            CreateAI Digital provides a fully autonomous AI platform that manages family AI agents,
            income tracking, personal automation, and internal banking systems. Our platform ensures
            secure, private, and real-time control for each family member.
          </p>
        </section>

        {/* What We Offer */}
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ color: "#eee", borderBottom: "1px solid #333", paddingBottom: "8px" }}>What We Offer</h2>

          {[
            {
              title: "Family AI Agents",
              body: "Personalized AI for each member, with full account, phone, and financial integration.",
            },
            {
              title: "Internal Banking & Stripe Integration",
              body: "Real-time income projections and secure payouts.",
            },
            {
              title: "Automation & Communication",
              body: "Fully voice-enabled AI interactions with wake words and commands.",
            },
            {
              title: "Privacy & Security",
              body: "Everything stays private within your family unless explicitly shared.",
            },
          ].map(({ title, body }) => (
            <div key={title} style={{
              background: CARD_BG,
              padding: "15px",
              borderRadius: "10px",
              margin: "10px 0",
              border: "1px solid #333",
            }}>
              <strong style={{ color: TEAL }}>{title}:</strong>
              <span style={{ color: "#ccc", marginLeft: "8px" }}>{body}</span>
            </div>
          ))}
        </section>

        {/* Features Detail */}
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ color: "#eee", borderBottom: "1px solid #333", paddingBottom: "8px" }}>Platform Features</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
            {[
              { icon: "🤖", label: "9 AI Family Agents" },
              { icon: "💳", label: "Stripe Auto-Payouts" },
              { icon: "🌌", label: "BeyondInfinity Mode" },
              { icon: "🔄", label: "Self-Evolution Engine" },
              { icon: "📱", label: "Voice Wake Words" },
              { icon: "📧", label: "Email & SMS Alerts" },
              { icon: "🏦", label: "Internal Banking" },
              { icon: "🛡️", label: "Private & Secure" },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                background: CARD_BG,
                padding: "14px 16px",
                borderRadius: "10px",
                border: "1px solid #2a2a2a",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}>
                <span style={{ fontSize: "1.4rem" }}>{icon}</span>
                <span style={{ color: "#ccc", fontSize: "0.9rem", fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ color: "#eee", borderBottom: "1px solid #333", paddingBottom: "8px" }}>Contact</h2>
          <p style={{ color: "#ccc", lineHeight: 1.8 }}>
            Email:{" "}
            <a href="mailto:admin@lakesidetrinity.com" style={{ color: TEAL, textDecoration: "none" }}>
              admin@lakesidetrinity.com
            </a>
          </p>
          <p style={{ color: "#ccc" }}>
            Website:{" "}
            <a href="https://createai.repl.co" style={{ color: TEAL, textDecoration: "none" }}>
              https://createai.repl.co
            </a>
          </p>
        </section>

        {/* CTA */}
        <section style={{ textAlign: "center", padding: "40px 0" }}>
          <a
            href="../"
            style={{
              display: "inline-block",
              padding: "14px 36px",
              background: TEAL,
              color: "#111",
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "1rem",
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            Launch CreateAI Brain →
          </a>
        </section>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "20px", fontSize: "0.9rem", color: "#888", borderTop: "1px solid #222" }}>
        &copy; {new Date().getFullYear()} CreateAI Digital. All rights reserved.
      </footer>
    </div>
  );
}
