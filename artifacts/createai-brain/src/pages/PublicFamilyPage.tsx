import React from "react"
import { useLocation } from "wouter"
import { SEOMeta } from "@/components/SEOMeta"

// ─── External Bridge Layer — Family Universe Public Presence ──────────────────
// The full public face of the Family Creation Universe.
// Route: /public/family  |  Public, no auth  |  Fully indexed
// Every family creation type gets its own section, feel, and marketing story.

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

const ANIM = `
@keyframes fam-fadeup {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fam-sway {
  0%, 100% { transform: rotate(-1deg); }
  50%       { transform: rotate(1deg);  }
}
.fam-fadeup { animation: fam-fadeup 0.55s ease both; }
.fam-card {
  transition: box-shadow 0.22s ease, transform 0.22s ease;
}
.fam-card:hover {
  box-shadow: 0 10px 36px rgba(122,144,104,0.14), 0 2px 8px rgba(0,0,0,0.05);
  transform: translateY(-3px);
}
.fam-btn {
  transition: opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
.fam-btn:hover  { opacity: 0.9; transform: translateY(-1px); }
.fam-btn:active { transform: scale(0.98); }
`

// ─── Content ──────────────────────────────────────────────────────────────────

const CREATION_TYPES = [
  {
    icon:    "📖",
    label:   "Story Maker",
    context: "story",
    color:   "#8c7c5e",
    bg:      "#f0e8d8",
    desc:    "Write personalised family stories together — warm, funny, heartfelt, and entirely yours. AI helps, your family gives it life.",
    tag:     "Narrative & Imagination",
  },
  {
    icon:    "🎨",
    label:   "Art Studio",
    context: "art",
    color:   "#6b8f5e",
    bg:      "#dce8d4",
    desc:    "Get inspired with AI-generated art concepts your family can bring to life — on canvas, digital, or just in your minds.",
    tag:     "Expressive & Layered",
  },
  {
    icon:    "🎬",
    label:   "Video Moments",
    context: "video",
    color:   "#5a6b52",
    bg:      "#d8e0d2",
    desc:    "Plan and script your family's next video — precious moments, beautifully framed, ready to capture when the moment is right.",
    tag:     "Cinematic & Real",
  },
  {
    icon:    "💌",
    label:   "Memory Cards",
    context: "memory",
    color:   "#b8905a",
    bg:      "#f5e8cc",
    desc:    "Create digital memory cards for birthdays, milestones, and everyday moments. Your family's story, beautifully documented.",
    tag:     "Nostalgic & Golden",
  },
  {
    icon:    "🎯",
    label:   "Family Challenges",
    context: "challenge",
    color:   "#6d8a4e",
    bg:      "#d8eccc",
    desc:    "Fun, creative family challenges that pull everyone off screens and into the moment. Compete, collaborate, celebrate.",
    tag:     "Energetic & Motivating",
  },
  {
    icon:    "💡",
    label:   "Invention Lab",
    context: "invention",
    color:   "#7a8a5e",
    bg:      "#e4e8cc",
    desc:    "Dream up inventions, gadgets, and ideas together. Your family's imagination is the only limit — and there isn't one.",
    tag:     "Curious & Exploratory",
  },
]

const MILESTONES = [
  { icon: "🌱", label: "First Creation",   desc: "Your first family story, artwork, or memory.", req: 1  },
  { icon: "🌿", label: "5 Creations",      desc: "Your creative family is just getting started.",  req: 5  },
  { icon: "🌳", label: "10 Creations",     desc: "You're building something real together.",        req: 10 },
  { icon: "🏔️", label: "25 Creations",     desc: "A true creative habit, together.",               req: 25 },
  { icon: "⭐", label: "50 Creations",     desc: "A lifetime of creative memories.",               req: 50 },
  { icon: "👑", label: "100 Creations",    desc: "Family legacy. Legends in the making.",          req: 100},
]

const WHY_ITEMS = [
  { icon: "🤍", head: "Built for real families",     body: "Not another content tool. This is a dedicated creative space for your specific family — names, personalities, and all." },
  { icon: "🧠", head: "AI does the heavy lifting",  body: "Your family provides the spark. AI generates the full story, concept, or plan — you shape and save what you love." },
  { icon: "🔒", head: "Private by default",         body: "Nothing is shared unless you choose. Your family's creations are yours, always." },
  { icon: "📈", head: "Grows with your family",     body: "From first story to 100 creations, the Family Universe tracks your creative journey together." },
]

// ─── Components ───────────────────────────────────────────────────────────────

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="fam-card rounded-2xl"
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        boxShadow: "0 2px 12px rgba(122,144,104,0.07), 0 1px 3px rgba(0,0,0,0.04)",
        ...style,
      }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: T.primary }}>
      {children}
    </p>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicFamilyPage() {
  const [, navigate] = useLocation()

  return (
    <div style={{ background: T.bg, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", color: T.text }}>
      <style>{ANIM}</style>

      <SEOMeta
        title="CreateAI Family Universe — A Creative Space for Families"
        description="The Family Creation Universe is a warm, AI-powered space where families write stories, make art, plan videos, capture memories, and grow together."
        canonical="https://createai.digital/public/family"
        ogTitle="CreateAI Family Universe — Create Together"
        ogDescription="Stories, art, videos, memories, challenges, inventions — all made together as a family. Powered by AI, built with love."
        ogType="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "CreateAI Family Universe",
          "url": "https://createai.digital/public/family",
          "description": "AI-powered family creation universe — stories, art, memories, and more.",
          "publisher": {
            "@type": "Organization",
            "name": "CreateAI",
            "url": "https://createai.digital",
          },
        }}
      />

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50" style={{
        background: "rgba(250,249,246,0.96)",
        backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/public")} className="flex items-center gap-2.5 fam-btn">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: T.primary }}>
              <span className="text-white font-black text-[11px]">CA</span>
            </div>
            <span className="font-black text-[15px]" style={{ color: T.text }}>CreateAI</span>
          </button>
          <button onClick={() => navigate("/family-hub")}
            className="fam-btn text-[13px] font-bold px-5 py-2.5 rounded-xl text-white"
            style={{ background: T.primary, boxShadow: `0 4px 14px ${T.primary}38` }}>
            Enter the Universe →
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="fam-fadeup">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: T.accent, border: `1px solid rgba(122,144,104,0.18)` }}>
            <span className="text-base">🏡</span>
            <span className="text-[11px] font-bold" style={{ color: T.primary }}>Family Creation Universe</span>
          </div>
          <h1 className="text-[40px] sm:text-[52px] font-black leading-[1.0] mb-5"
            style={{ letterSpacing: "-1.5px", color: T.text }}>
            A space built for<br />
            <span style={{ color: T.primary }}>families to create.</span>
          </h1>
          <p className="text-[16px] leading-relaxed max-w-md mx-auto mb-10" style={{ color: T.muted }}>
            Write stories together. Make art. Plan videos. Capture memories. Build something real — as a family, guided by AI, shaped by love.
          </p>
          <button onClick={() => navigate("/family-hub")}
            className="fam-btn px-12 py-4 rounded-2xl font-bold text-[16px] text-white inline-block"
            style={{ background: T.primary, boxShadow: `0 8px 32px ${T.primary}38` }}>
            Enter the Family Universe
          </button>
          <p className="text-[11px] mt-4" style={{ color: "rgba(107,102,96,0.50)" }}>
            Warm · Private · Built for your family
          </p>
        </div>
      </section>

      {/* ── Ambient hero band ── */}
      <div style={{ background: "linear-gradient(180deg, #e3eadf 0%, #f0f3ed 100%)", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: "6",    label: "Creation Types" },
              { value: "∞",    label: "Stories to Tell" },
              { value: "100+", label: "Milestone Moments" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-[32px] font-black" style={{ color: T.primary }}>{value}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: T.muted }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Creation types grid ── */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <SectionLabel>Creation Tools</SectionLabel>
        <h2 className="text-[30px] font-black mt-2 mb-3" style={{ letterSpacing: "-0.8px" }}>
          Six ways to create together.
        </h2>
        <p className="text-[14px] leading-relaxed mb-10" style={{ color: T.muted, maxWidth: 500 }}>
          Each tool adapts its style to match the purpose — story feels literary, art feels expressive, video feels cinematic. The system knows what each creation needs.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CREATION_TYPES.map(({ icon, label, color, bg, desc, tag }, i) => (
            <Card key={label} style={{ padding: "22px 24px", animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: bg }}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-bold text-[14px]" style={{ color: T.text }}>{label}</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: bg, color }}>
                      {tag}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: T.muted }}>{desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <button onClick={() => navigate("/family-hub")}
          className="fam-btn w-full py-4 rounded-2xl font-bold text-[15px] text-white mt-8"
          style={{ background: T.primary, boxShadow: `0 6px 24px ${T.primary}28` }}>
          Start Creating →
        </button>
      </section>

      {/* ── Journey milestones ── */}
      <div style={{ background: T.soft, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <section className="max-w-3xl mx-auto px-6 py-16">
          <SectionLabel>The Family Journey</SectionLabel>
          <h2 className="text-[30px] font-black mt-2 mb-3" style={{ letterSpacing: "-0.8px" }}>
            Every creation is a milestone.
          </h2>
          <p className="text-[14px] leading-relaxed mb-10" style={{ color: T.muted, maxWidth: 500 }}>
            As your family creates together, you unlock milestones and achievements. Every story, artwork, and memory adds to your family's creative legacy.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MILESTONES.map(({ icon, label, desc }) => (
              <Card key={label} style={{ padding: "18px 20px" }}>
                <div className="text-2xl mb-3">{icon}</div>
                <p className="font-bold text-[13px]" style={{ color: T.text }}>{label}</p>
                <p className="text-[11px] mt-1 leading-snug" style={{ color: T.muted }}>{desc}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* ── Why ── */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <SectionLabel>Why This Is Different</SectionLabel>
        <h2 className="text-[30px] font-black mt-2 mb-10" style={{ letterSpacing: "-0.8px" }}>
          Built for your family, not for everyone.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WHY_ITEMS.map(({ icon, head, body }) => (
            <Card key={head} style={{ padding: "22px 24px" }}>
              <div className="text-2xl mb-3">{icon}</div>
              <p className="font-bold text-[14px] mb-1" style={{ color: T.text }}>{head}</p>
              <p className="text-[12px] leading-relaxed" style={{ color: T.muted }}>{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── CTA band ── */}
      <div className="mx-5 mb-16 rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #e3eadf 0%, #f0f3ed 60%, #f5f0e8 100%)", border: `1px solid ${T.border}` }}>
        <div className="max-w-lg mx-auto px-8 py-14 text-center">
          <div className="text-5xl mb-6" style={{ animation: "fam-sway 4s ease-in-out infinite" }}>🌿</div>
          <h2 className="text-[28px] font-black mb-3" style={{ color: T.text, letterSpacing: "-0.5px" }}>
            Ready to start creating?
          </h2>
          <p className="text-[14px] mb-8" style={{ color: T.muted }}>
            The Family Universe is warm, modern, and built specifically for your family. Enter any time — your first creation takes less than a minute.
          </p>
          <button onClick={() => navigate("/family-hub")}
            className="fam-btn w-full max-w-xs py-4 rounded-2xl font-bold text-[16px] text-white"
            style={{ background: T.primary, boxShadow: `0 8px 28px ${T.primary}35` }}>
            Enter the Family Universe
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: T.primary }}>
              <span className="text-white font-black text-[10px]">CA</span>
            </div>
            <span className="font-bold text-[13px]" style={{ color: T.text }}>CreateAI Family Universe</span>
          </div>
          <div className="flex items-center gap-5">
            {[
              { label: "About",    path: "/public"      },
              { label: "Platform", path: "/"            },
              { label: "Enter",    path: "/family-hub"  },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => navigate(path)}
                className="fam-btn text-[12px] font-medium" style={{ color: T.muted }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-[11px] pb-8" style={{ color: "rgba(107,102,96,0.45)" }}>
          © {new Date().getFullYear()} Lakeside Trinity LLC · createai.digital · All rights reserved
        </p>
      </footer>
    </div>
  )
}
