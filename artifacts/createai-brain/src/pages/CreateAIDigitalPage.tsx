import React, { useState } from "react";
import { useLocation } from "wouter";
import useSEO from "@/hooks/useSEO";

const INDIGO = "#6366f1";
const INDIGO_DARK = "#4f46e5";
const INDIGO_BG = "rgba(99,102,241,0.08)";
const INDIGO_BORDER = "rgba(99,102,241,0.16)";

const FEATURES = [
  { icon: "🤖", label: "9 AI Family Agents", desc: "Each family member has a dedicated AI with full context, voice, and financial integration." },
  { icon: "💳", label: "Stripe Auto-Payouts", desc: "Real-time income tracking and automated payouts connected directly to your bank." },
  { icon: "🌌", label: "BeyondInfinity Mode", desc: "Unlimited AI generation across all 122+ apps — no caps, no rate limits." },
  { icon: "🔄", label: "Self-Evolution Engine", desc: "The platform learns your preferences and improves automatically over time." },
  { icon: "📱", label: "Voice Wake Words", desc: "Hands-free AI control with personalized wake words for every family member." },
  { icon: "📧", label: "Email & SMS Alerts", desc: "Intelligent notifications for activity, income, and important updates." },
  { icon: "🏦", label: "Internal Banking", desc: "Full visibility into cash flow, transactions, and automated financial management." },
  { icon: "🛡️", label: "Private & Secure", desc: "End-to-end encrypted. Your data stays within your family's secure environment." },
];

const OFFERINGS = [
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Family AI Agents",
    body: "Each member gets a personalized AI with full account, phone, and financial integration. The AI learns your voice, habits, and preferences — and gets smarter every week.",
  },
  {
    icon: "🏦",
    title: "Internal Banking & Stripe Integration",
    body: "Real-time income projections, automated payouts, and transparent financial tracking. Every dollar is accounted for — visible, auditable, and fully automated.",
  },
  {
    icon: "⚡",
    title: "Automation & Communication",
    body: "Fully voice-enabled AI interactions with wake words and natural language commands. Schedule, delegate, and execute tasks — without touching a screen.",
  },
  {
    icon: "🔒",
    title: "Privacy & Security",
    body: "Everything stays private within your family unless explicitly shared. Military-grade encryption, zero third-party data sharing, and full audit logs.",
  },
];

const STATS = [
  { value: "9", label: "AI Agents" },
  { value: "122+", label: "Apps Included" },
  { value: "100%", label: "Private & Encrypted" },
  { value: "24/7", label: "AI Always On" },
];

export default function CreateAIDigitalPage() {
  const [_, setLocation] = useLocation();
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  useSEO({
    title:       "CreateAI Brain — The Complete AI Business OS | 408+ Tools",
    description: "Discover 408+ AI-powered tools for healthcare, legal, staffing, finance, and family. Replace $100K+ in software. One platform, one OS, unlimited AI by Lakeside Trinity LLC.",
    url:         "https://createai.digital/createai-digital",
    keywords:    "AI business OS, 408 AI tools, healthcare AI, legal AI, family AI, createai digital, Lakeside Trinity",
    jsonLD: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "CreateAI Brain",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "url": "https://createai.digital",
      "description": "408+ AI-powered tools for every industry in one OS.",
      "offers": { "@type": "Offer", "price": "29", "priceCurrency": "USD" },
      "creator": { "@type": "Organization", "name": "Lakeside Trinity LLC", "url": "https://createai.digital" }
    }
  });

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      background: "hsl(220,20%,97%)",
      color: "#0f172a",
      minHeight: "100vh",
      WebkitFontSmoothing: "antialiased",
    }}>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        padding: "0 24px",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 60,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: `linear-gradient(135deg, ${INDIGO}, ${INDIGO_DARK})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, boxShadow: "0 2px 8px rgba(99,102,241,0.30)",
            }}>🧠</div>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", color: "#0f172a" }}>
              CreateAI Digital
            </span>
          </div>
          <button
            onClick={() => setLocation("/")}
            style={{
              padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer",
              background: INDIGO, color: "#fff", fontFamily: "inherit",
              fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em",
              boxShadow: "0 2px 10px rgba(99,102,241,0.35)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = INDIGO_DARK; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = INDIGO; }}
          >
            Launch Brain →
          </button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)",
        padding: "80px 24px 72px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 70%)",
        }} />
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 100,
            background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.30)",
            marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(165,180,252,0.9)", letterSpacing: "0.03em" }}>
              Professional AI Family &amp; Automation System
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(2rem, 6vw, 3.25rem)",
            fontWeight: 900, lineHeight: 1.1,
            color: "#fff", margin: "0 0 20px",
            letterSpacing: "-0.03em",
          }}>
            Your Family's Private<br />
            <span style={{
              background: "linear-gradient(135deg, #a5b4fc 0%, #818cf8 50%, #6366f1 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>AI Operating System</span>
          </h1>

          <p style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "rgba(148,163,184,0.80)",
            lineHeight: 1.65, margin: "0 auto 40px",
            maxWidth: 560,
          }}>
            CreateAI Digital delivers a fully autonomous AI platform that manages family agents,
            income tracking, personal automation, and internal banking — all in one private system.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setLocation("/")}
              style={{
                padding: "14px 32px", borderRadius: 12, border: "none", cursor: "pointer",
                background: INDIGO, color: "#fff", fontFamily: "inherit",
                fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em",
                boxShadow: "0 6px 24px rgba(99,102,241,0.40)",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 32px rgba(99,102,241,0.50)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(99,102,241,0.40)";
              }}
            >
              Launch CreateAI Brain
            </button>
            <a
              href="mailto:admin@lakesidetrinity.com"
              style={{
                padding: "14px 28px", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(203,213,225,0.85)",
                fontSize: 15, fontWeight: 600,
                textDecoration: "none", letterSpacing: "-0.01em",
                transition: "all 0.18s ease", display: "inline-block",
                fontFamily: "inherit",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ───────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <div style={{
          maxWidth: 900, margin: "0 auto", padding: "0 24px",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        }}>
          {STATS.map(({ value, label }, i) => (
            <div key={label} style={{
              padding: "28px 20px", textAlign: "center",
              borderRight: i < STATS.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
            }}>
              <div style={{
                fontSize: "clamp(22px, 4vw, 28px)",
                fontWeight: 900, color: INDIGO,
                letterSpacing: "-0.03em", lineHeight: 1,
              }}>{value}</div>
              <div style={{
                fontSize: 11, fontWeight: 600, color: "#64748b",
                marginTop: 5, letterSpacing: "0.04em", textTransform: "uppercase",
              }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── About ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "72px 24px", background: "hsl(220,20%,97%)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 8,
            background: INDIGO_BG, border: `1px solid ${INDIGO_BORDER}`,
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: INDIGO, letterSpacing: "0.06em", textTransform: "uppercase" }}>About the Platform</span>
          </div>
          <h2 style={{
            fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, color: "#0f172a",
            letterSpacing: "-0.025em", marginBottom: 16, marginTop: 0,
          }}>
            Private. Automated. Always Working For You.
          </h2>
          <p style={{
            fontSize: 17, lineHeight: 1.7, color: "#475569", maxWidth: 620, margin: "0 auto",
          }}>
            CreateAI Digital provides a fully autonomous AI platform that manages family AI agents,
            income tracking, personal automation, and internal banking systems. Our platform ensures
            secure, private, and real-time control for each family member — with zero configuration required.
          </p>
        </div>
      </section>

      {/* ── Offerings ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 72px", background: "hsl(220,20%,97%)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 440px), 1fr))",
            gap: 16,
          }}>
            {OFFERINGS.map(({ icon, title, body }) => (
              <div
                key={title}
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.07)",
                  borderRadius: 16, padding: "24px",
                  display: "flex", gap: 18, alignItems: "flex-start",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = INDIGO_BORDER;
                  el.style.boxShadow = "0 4px 20px rgba(99,102,241,0.10), 0 1px 4px rgba(0,0,0,0.05)";
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(0,0,0,0.07)";
                  el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)";
                  el.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: INDIGO_BG, border: `1px solid ${INDIGO_BORDER}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.01em" }}>
                    {title}
                  </div>
                  <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      <section style={{ padding: "72px 24px", background: "#fff", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 8,
              background: INDIGO_BG, border: `1px solid ${INDIGO_BORDER}`,
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: INDIGO, letterSpacing: "0.06em", textTransform: "uppercase" }}>Platform Features</span>
            </div>
            <h2 style={{
              fontSize: "clamp(1.4rem, 3.5vw, 1.9rem)", fontWeight: 800, color: "#0f172a",
              letterSpacing: "-0.025em", margin: "0 0 12px",
            }}>
              Everything Your Family Needs
            </h2>
            <p style={{ fontSize: 16, color: "#64748b", maxWidth: 480, margin: "0 auto" }}>
              Built specifically for families who want real AI automation — not toys, not demos.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
            gap: 14,
          }}>
            {FEATURES.map(({ icon, label, desc }) => (
              <div
                key={label}
                style={{
                  background: hoveredFeature === label ? INDIGO_BG : "hsl(220,20%,98%)",
                  border: `1px solid ${hoveredFeature === label ? INDIGO_BORDER : "rgba(0,0,0,0.07)"}`,
                  borderRadius: 14, padding: "20px 18px",
                  transition: "all 0.18s ease", cursor: "default",
                }}
                onMouseEnter={() => setHoveredFeature(label)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div style={{ fontSize: 24, marginBottom: 12 }}>{icon}</div>
                <div style={{
                  fontSize: 13.5, fontWeight: 700,
                  color: hoveredFeature === label ? INDIGO : "#0f172a",
                  marginBottom: 6, letterSpacing: "-0.01em",
                  transition: "color 0.18s ease",
                }}>{label}</div>
                <p style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.5, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{
        padding: "80px 24px",
        background: "linear-gradient(135deg, #020617 0%, #0f172a 60%, #1e1b4b 100%)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(99,102,241,0.14) 0%, transparent 70%)",
        }} />
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <h2 style={{
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 900, color: "#fff",
            letterSpacing: "-0.03em", marginBottom: 16, marginTop: 0,
          }}>
            Ready to Get Started?
          </h2>
          <p style={{
            fontSize: 16, color: "rgba(148,163,184,0.80)",
            lineHeight: 1.65, marginBottom: 36,
          }}>
            Log in to CreateAI Brain and access the full platform — all 122+ apps, your family AI agents, and everything built for your household.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setLocation("/")}
              style={{
                padding: "15px 36px", borderRadius: 12, border: "none", cursor: "pointer",
                background: INDIGO, color: "#fff", fontFamily: "inherit",
                fontSize: 15, fontWeight: 700,
                boxShadow: "0 6px 28px rgba(99,102,241,0.45)",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              Launch CreateAI Brain →
            </button>
            <a
              href="mailto:admin@lakesidetrinity.com"
              style={{
                padding: "15px 28px", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "rgba(203,213,225,0.85)",
                fontSize: 15, fontWeight: 600,
                textDecoration: "none", fontFamily: "inherit",
                transition: "all 0.18s ease", display: "inline-block",
              }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────────── */}
      <section style={{ padding: "56px 24px", background: "hsl(220,20%,97%)", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h3 style={{
            fontSize: 17, fontWeight: 700, color: "#0f172a",
            letterSpacing: "-0.015em", marginBottom: 24, marginTop: 0,
          }}>Get in Touch</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 14 }}>
            {[
              { icon: "📧", label: "Email", value: "admin@lakesidetrinity.com", href: "mailto:admin@lakesidetrinity.com" },
              { icon: "💳", label: "Cash App", value: "$CreateAIDigital", href: "https://cash.app/$CreateAIDigital" },
              { icon: "💜", label: "Venmo", value: "@CreateAIDigital", href: "https://venmo.com/u/CreateAIDigital" },
            ].map(({ icon, label, value, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 20px", borderRadius: 12,
                  background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
                  textDecoration: "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = INDIGO_BORDER;
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(99,102,241,0.10)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: INDIGO_BG, border: `1px solid ${INDIGO_BORDER}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: INDIGO, marginTop: 2 }}>{value}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{
        background: "#fff", borderTop: "1px solid rgba(0,0,0,0.07)",
        padding: "24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: `linear-gradient(135deg, ${INDIGO}, ${INDIGO_DARK})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
            }}>🧠</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>CreateAI Digital</span>
          </div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
            © {new Date().getFullYear()} CreateAI Digital · Lakeside Trinity LLC · All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
