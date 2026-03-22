import React from "react"
import { useLocation } from "wouter"
import { SEOMeta } from "@/components/SEOMeta"

// ─── External Bridge Layer — Public Presence Hub ──────────────────────────────
// Root of the public ecosystem. Every creation that lives inside CreateAI Brain
// automatically generates its full external presence through this layer.
// Route: /public  |  Public, no auth  |  Fully indexed

const T = {
  primary:  "#7a9068",
  sand:     "#c4a97a",
  bg:       "#faf9f6",
  text:     "#1a1916",
  muted:    "#6b6660",
  border:   "rgba(122,144,104,0.12)",
  soft:     "#f0f3ed",
  accent:   "#e3eadf",
  card:     "#ffffff",
}

// ─── Micro-animation styles ───────────────────────────────────────────────────

const ANIM = `
@keyframes ca-fadeup {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes ca-fadein {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes ca-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.65; }
}
.ca-fadeup    { animation: ca-fadeup  0.55s ease both; }
.ca-fadein    { animation: ca-fadein  0.4s  ease both; }
.ca-pulse-dot { animation: ca-pulse   2.4s  ease infinite; }
.ca-card-hover {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.ca-card-hover:hover {
  box-shadow: 0 8px 32px rgba(122,144,104,0.14), 0 2px 8px rgba(0,0,0,0.05);
  transform: translateY(-2px);
}
.ca-btn-hover {
  transition: opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
.ca-btn-hover:hover  { opacity: 0.92; transform: translateY(-1px); }
.ca-btn-hover:active { transform: scale(0.98); }
`

// ─── Small components ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em]"
      style={{ color: T.primary }}>
      {children}
    </p>
  )
}

function Card({ children, style = {}, delay = 0 }: {
  children: React.ReactNode; style?: React.CSSProperties; delay?: number
}) {
  return (
    <div className="ca-card-hover rounded-2xl"
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        boxShadow: "0 2px 12px rgba(122,144,104,0.07), 0 1px 3px rgba(0,0,0,0.04)",
        animationDelay: `${delay}ms`,
        ...style,
      }}>
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div className="max-w-3xl mx-auto px-6">
      <div style={{ height: 1, background: T.border }} />
    </div>
  )
}

// ─── Content ──────────────────────────────────────────────────────────────────

const FAMILY_TOOLS = [
  { icon: "📖", label: "Story Maker",       desc: "AI-crafted family stories, warm and personal." },
  { icon: "🎨", label: "Art Studio",        desc: "Creative art ideas your family can bring to life together." },
  { icon: "🎬", label: "Video Moments",     desc: "Plan and script your family's most precious video memories." },
  { icon: "💌", label: "Memory Cards",      desc: "Capture and preserve the moments that matter most." },
  { icon: "🎯", label: "Family Challenges", desc: "Creative activities that bring everyone together." },
  { icon: "💡", label: "Invention Lab",     desc: "Dream up inventions and ideas as a family." },
  { icon: "🌿", label: "Journey Tracker",   desc: "Milestones, achievements, and your family's creative growth." },
  { icon: "📅", label: "Creation Planner",  desc: "Schedule sessions, themes, and upcoming family activities." },
  { icon: "🖼️", label: "Gallery Vault",     desc: "A private gallery of everything your family has ever made." },
]

const PLATFORM_FEATURES = [
  { icon: "🧠", label: "365+ AI Tools",      desc: "Intelligent tools for every need — creative, business, and operational." },
  { icon: "🏡", label: "Family Universe",    desc: "A private creative space for your family to build and grow together." },
  { icon: "💼", label: "Business OS",        desc: "Healthcare, legal, staffing, finance — all in one platform." },
  { icon: "📈", label: "Revenue Engine",     desc: "Product creation, marketing, and monetisation built in." },
  { icon: "🌐", label: "Public Presence",    desc: "Everything you build gets a full public face, automatically." },
  { icon: "🔒", label: "Private & Secure",  desc: "Your data stays yours. Always private, always protected." },
]

const HOW_IT_WORKS = [
  { n: "01", title: "Enter the Universe",   desc: "Access the Family Creation Universe — a warm, private space built for your family." },
  { n: "02", title: "Create Together",      desc: "Use AI to write stories, make art, plan videos, and capture memories." },
  { n: "03", title: "Grow & Share",         desc: "Build a gallery of everything you've made, track milestones, and celebrate." },
]

const CONNECT_CARDS = [
  { icon: "💚", label: "Cash App",      value: "$CreateAIDigital",            sub: "For payments and orders" },
  { icon: "💙", label: "Venmo",         value: "@CreateAIDigital",            sub: "For payments and orders" },
  { icon: "🌐", label: "Website",       value: "createai.digital",            sub: "The full platform" },
  { icon: "🏡", label: "Family Hub",    value: "createai.digital/family-hub", sub: "Enter the family universe" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicBridgePage() {
  const [, navigate] = useLocation()

  return (
    <div style={{ background: T.bg, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", color: T.text }}>
      <style>{ANIM}</style>

      <SEOMeta
        title="CreateAI — The Complete Creative & Business OS"
        description="CreateAI is the complete AI-powered platform for families and businesses. Build stories, art, memories, and real products — all in one warm, modern creative space."
        canonical="https://createai.digital/public"
        ogTitle="CreateAI — Build Everything Together"
        ogDescription="365+ AI tools for families and businesses. Family Universe, Business OS, Revenue Engine — all in one platform by Lakeside Trinity LLC."
        ogType="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "CreateAI",
          "url": "https://createai.digital",
          "description": "AI-powered creative OS for families and businesses — by Lakeside Trinity LLC",
          "founder": { "@type": "Person", "name": "Sara Stadler" },
          "sameAs": [
            "https://createai.digital/family-hub",
            "https://createai.digital/public/family",
          ],
        }}
      />

      {/* ── Sticky nav ── */}
      <nav className="sticky top-0 z-50" style={{
        background: "rgba(250,249,246,0.96)",
        backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/public")} className="flex items-center gap-2.5 ca-btn-hover">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: T.primary }}>
              <span className="text-white font-black text-[11px]">CA</span>
            </div>
            <span className="font-black text-[15px]" style={{ color: T.text }}>CreateAI</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/public/family")} className="ca-btn-hover text-[13px] font-semibold px-3.5 py-2 rounded-xl"
              style={{ color: T.primary, background: T.accent }}>
              Family
            </button>
            <button onClick={() => navigate("/family-hub")} className="ca-btn-hover text-[13px] font-semibold px-3.5 py-2 rounded-xl text-white"
              style={{ background: T.primary, boxShadow: `0 4px 14px ${T.primary}40` }}>
              Enter
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-3xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="ca-fadeup" style={{ animationDelay: "0ms" }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: T.accent, border: `1px solid rgba(122,144,104,0.18)` }}>
            <span className="ca-pulse-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: T.primary }} />
            <span className="text-[11px] font-bold" style={{ color: T.primary }}>External Bridge Layer · Active</span>
          </div>
        </div>

        <h1 className="ca-fadeup text-[42px] sm:text-[52px] font-black leading-[1.0] mb-5"
          style={{ letterSpacing: "-1.5px", color: T.text, animationDelay: "80ms" }}>
          Create Together.<br />
          <span style={{ color: T.primary }}>Build Anything.</span>
        </h1>

        <p className="ca-fadeup text-[16px] leading-relaxed max-w-lg mb-10"
          style={{ color: T.muted, animationDelay: "160ms" }}>
          An AI-powered creative OS for families and businesses — stories, art, memories, and real products, all in one warm, modern space.
        </p>

        <div className="ca-fadeup flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-none sm:justify-center"
          style={{ animationDelay: "240ms" }}>
          <button onClick={() => navigate("/family-hub")}
            className="ca-btn-hover px-8 py-4 rounded-2xl font-bold text-[15px] text-white"
            style={{ background: T.primary, boxShadow: `0 8px 28px ${T.primary}38` }}>
            Enter the Family Universe
          </button>
          <button onClick={() => navigate("/")}
            className="ca-btn-hover px-8 py-4 rounded-2xl font-bold text-[15px]"
            style={{ color: T.text, background: T.accent, border: `1.5px solid ${T.border}` }}>
            Explore the Platform
          </button>
        </div>

        <p className="ca-fadein text-[11px] mt-6" style={{ color: "rgba(107,102,96,0.50)", animationDelay: "400ms" }}>
          By Lakeside Trinity LLC · createai.digital
        </p>
      </section>

      {/* ── Trust band ── */}
      <div style={{ background: T.accent, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div className="max-w-3xl mx-auto px-6 py-6 grid grid-cols-3 gap-4">
          {[
            { value: "365+", label: "AI Tools" },
            { value: "9",    label: "Family Creation Tools" },
            { value: "∞",    label: "Possibilities" },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center text-center gap-0.5">
              <span className="text-[28px] font-black" style={{ color: T.primary }}>{value}</span>
              <span className="text-[11px] font-semibold" style={{ color: T.muted }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Family Universe section ── */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <Label>Family Creation Universe</Label>
        <h2 className="text-[32px] font-black mt-2 mb-3" style={{ letterSpacing: "-0.8px" }}>
          A space built for your family to create.
        </h2>
        <p className="text-[14px] leading-relaxed mb-10" style={{ color: T.muted, maxWidth: 520 }}>
          The Family Universe is a warm, private, AI-powered space where your whole family can build stories, make art, plan videos, capture memories, and grow together — guided by intelligence, shaped by love.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {FAMILY_TOOLS.map(({ icon, label, desc }, i) => (
            <Card key={label} delay={i * 40} style={{ padding: "18px 20px" }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: T.soft }}>
                  {icon}
                </div>
                <div>
                  <p className="font-bold text-[13px]" style={{ color: T.text }}>{label}</p>
                  <p className="text-[12px] mt-0.5 leading-snug" style={{ color: T.muted }}>{desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <button onClick={() => navigate("/family-hub")}
          className="ca-btn-hover w-full py-4 rounded-2xl font-bold text-[15px] text-white"
          style={{ background: T.primary, boxShadow: `0 6px 24px ${T.primary}28` }}>
          Enter the Family Universe →
        </button>
      </section>

      <Divider />

      {/* ── How it works ── */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <Label>How It Works</Label>
        <h2 className="text-[32px] font-black mt-2 mb-10" style={{ letterSpacing: "-0.8px" }}>
          Three steps to your creative universe.
        </h2>
        <div className="space-y-4">
          {HOW_IT_WORKS.map(({ n, title, desc }, i) => (
            <Card key={n} delay={i * 60} style={{ padding: "22px 24px" }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[14px] flex-shrink-0"
                  style={{ background: T.soft, color: T.primary }}>
                  {n}
                </div>
                <div>
                  <p className="font-bold text-[15px]" style={{ color: T.text }}>{title}</p>
                  <p className="text-[13px] mt-1 leading-relaxed" style={{ color: T.muted }}>{desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Platform overview ── */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <Label>The Full Platform</Label>
        <h2 className="text-[32px] font-black mt-2 mb-3" style={{ letterSpacing: "-0.8px" }}>
          Everything in one intelligent OS.
        </h2>
        <p className="text-[14px] leading-relaxed mb-10" style={{ color: T.muted, maxWidth: 520 }}>
          Beyond the Family Universe, CreateAI Brain is a complete business OS — 365+ intelligent tools for healthcare, legal, staffing, marketing, and more. Real products, real results.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PLATFORM_FEATURES.map(({ icon, label, desc }, i) => (
            <Card key={label} delay={i * 50} style={{ padding: "18px 20px" }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
                <div>
                  <p className="font-bold text-[13px]" style={{ color: T.text }}>{label}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: T.muted }}>{desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Connect ── */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <Label>Connect With Us</Label>
        <h2 className="text-[32px] font-black mt-2 mb-3" style={{ letterSpacing: "-0.8px" }}>
          Ready to build your universe?
        </h2>
        <p className="text-[14px] leading-relaxed mb-10" style={{ color: T.muted, maxWidth: 520 }}>
          The Family Universe is free to explore. The full platform requires a one-time access agreement.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {CONNECT_CARDS.map(({ icon, label, value, sub }) => (
            <Card key={label} style={{ padding: "18px 20px" }}>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{icon}</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: T.muted }}>{label}</p>
                  <p className="font-bold text-[14px]" style={{ color: T.text }}>{value}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>{sub}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => navigate("/family-hub")}
            className="ca-btn-hover flex-1 py-4 rounded-2xl font-bold text-[15px] text-white"
            style={{ background: T.primary, boxShadow: `0 6px 24px ${T.primary}28` }}>
            Enter the Family Universe
          </button>
          <button onClick={() => navigate("/")}
            className="ca-btn-hover flex-1 py-4 rounded-2xl font-bold text-[15px]"
            style={{ color: T.text, background: T.accent, border: `1.5px solid ${T.border}` }}>
            Explore the Platform
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: T.primary }}>
              <span className="text-white font-black text-[10px]">CA</span>
            </div>
            <span className="font-bold text-[13px]" style={{ color: T.text }}>CreateAI</span>
            <span className="text-[12px]" style={{ color: T.muted }}>by Lakeside Trinity LLC</span>
          </div>
          <div className="flex items-center gap-5">
            {[
              { label: "Family Hub",      path: "/family-hub"     },
              { label: "Family Universe", path: "/public/family"  },
              { label: "Platform",        path: "/"               },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => navigate(path)}
                className="ca-btn-hover text-[12px] font-medium" style={{ color: T.muted }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-6 pb-8 text-center">
          <p className="text-[11px]" style={{ color: "rgba(107,102,96,0.45)" }}>
            © {new Date().getFullYear()} Lakeside Trinity LLC · createai.digital · All rights reserved
          </p>
        </div>
      </footer>
    </div>
  )
}
