// ─── Widget Library — Reusable Presentation Components ───────────────────────
// Safe, family-friendly, presentation-ready UI building blocks.
// Used by PresentationLayout, ProjectPage, and standalone pages.

import React, { useState } from "react";

// ─── Hero Block ───────────────────────────────────────────────────────────────
export interface HeroBlockProps {
  icon: string;
  badge?: string;
  label?: string;
  title: string;
  tagline: string;
  description: string;
  gradient: string;
  primaryCTA?: { label: string; onClick: () => void };
  secondaryCTA?: { label: string; onClick: () => void };
  tertiaryCTA?: { label: string; onClick: () => void };
}

export function HeroBlock({ icon, badge, label, title, tagline, description, gradient, primaryCTA, secondaryCTA, tertiaryCTA }: HeroBlockProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl">
          {(label || badge) && (
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl flex-shrink-0">
                {icon}
              </div>
              <div>
                {label && <p className="text-white/60 text-sm font-medium uppercase tracking-wider">{label}</p>}
                {badge && <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/30 bg-white/10 text-white/90 mt-1">{badge}</span>}
              </div>
            </div>
          )}
          <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4 text-white">{title}</h1>
          <p className="text-xl sm:text-2xl text-white/80 font-light mb-4">{tagline}</p>
          <p className="text-white/70 text-base leading-relaxed mb-8 max-w-2xl">{description}</p>
          {(primaryCTA || secondaryCTA || tertiaryCTA) && (
            <div className="flex flex-wrap gap-3">
              {primaryCTA && (
                <button onClick={primaryCTA.onClick} className="bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm">
                  {primaryCTA.label}
                </button>
              )}
              {secondaryCTA && (
                <button onClick={secondaryCTA.onClick} className="bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/30 transition-colors text-sm">
                  {secondaryCTA.label}
                </button>
              )}
              {tertiaryCTA && (
                <button onClick={tertiaryCTA.onClick} className="bg-white/10 border border-white/20 text-white/80 font-medium px-6 py-3 rounded-xl hover:bg-white/20 transition-colors text-sm">
                  {tertiaryCTA.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
export interface StatItem { label: string; value: string }

export function StatsBar({ stats, gradient }: { stats: StatItem[]; gradient: string }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} border-t border-white/20`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className={`grid gap-3 ${stats.length <= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
          {stats.map(stat => (
            <div key={stat.label} className="flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-center">
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-white/70 mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feature Grid ─────────────────────────────────────────────────────────────
export interface FeatureItem { icon: string; name: string; desc: string }

export function FeatureGrid({ features, color }: { features: FeatureItem[]; color?: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {features.map(f => (
        <div key={f.name} className="bg-background rounded-2xl border border-border/50 p-5 hover:border-primary/20 hover:shadow-md transition-all group">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform inline-block">{f.icon}</div>
          <h3 className="font-bold text-[14px] text-foreground mb-1.5">{f.name}</h3>
          <p className="text-[12px] text-muted-foreground leading-relaxed">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Section Container ────────────────────────────────────────────────────────
export function SectionContainer({ id, eyebrow, title, subtitle, children, tight }: {
  id?: string; eyebrow?: string; title: string; subtitle?: string; children: React.ReactNode; tight?: boolean;
}) {
  return (
    <section id={id} className={tight ? "space-y-6" : "space-y-8"}>
      <div className={tight ? "space-y-1" : "text-center max-w-2xl mx-auto space-y-3"}>
        {eyebrow && <span className="text-xs font-bold text-primary uppercase tracking-widest">{eyebrow}</span>}
        <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-sm sm:text-base">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

// ─── Timeline Widget ──────────────────────────────────────────────────────────
export interface TimelineItem { label: string; description: string; status?: "done" | "active" | "future" }

export function Timeline({ items, color }: { items: TimelineItem[]; color?: string }) {
  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {items.map((item, i) => (
        <div key={i} className="flex gap-4 p-4 bg-background rounded-2xl border border-border/50">
          <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              item.status === "done" ? "bg-green-500" : item.status === "active" ? "bg-blue-500" : "bg-muted-foreground/30"
            }`} />
            {i < items.length - 1 && <div className="w-0.5 h-4 bg-border/50" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-[14px] text-foreground">{item.label}</p>
              {item.status && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.status === "done" ? "bg-green-100 text-green-700" : item.status === "active" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"
                }`}>{item.status === "done" ? "Complete" : item.status === "active" ? "Active" : "Upcoming"}</span>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Stepper Widget ───────────────────────────────────────────────────────────
export interface StepItem { label: string; description: string; icon?: string }

export function Stepper({ steps, color }: { steps: StepItem[]; color?: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
              active === i ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}>
            <span className="w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center" style={{ backgroundColor: active === i ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.07)" }}>
              {i + 1}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>
      <div className="bg-background border border-border/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          {steps[active].icon && <span className="text-2xl">{steps[active].icon}</span>}
          <div>
            <p className="text-xs text-muted-foreground font-medium">Step {active + 1} of {steps.length}</p>
            <h3 className="font-bold text-[16px] text-foreground">{steps[active].label}</h3>
          </div>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed">{steps[active].description}</p>
        <div className="flex gap-3 mt-5">
          <button onClick={() => setActive(s => Math.max(0, s - 1))} disabled={active === 0}
            className="text-[13px] px-4 py-2 border border-border/50 text-muted-foreground rounded-xl disabled:opacity-30 hover:bg-muted transition-colors">
            ← Prev
          </button>
          <button onClick={() => setActive(s => Math.min(steps.length - 1, s + 1))} disabled={active === steps.length - 1}
            className="text-[13px] px-4 py-2 bg-primary text-white rounded-xl disabled:opacity-30 hover:opacity-90 transition-opacity">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Panel ────────────────────────────────────────────────────────────────
export interface TabItem { id: string; label: string; icon?: string; content: React.ReactNode }

export function TabPanel({ tabs }: { tabs: TabItem[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const current = tabs.find(t => t.id === active);
  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors ${
              active === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t.icon && <span>{t.icon}</span>}
            {t.label}
          </button>
        ))}
      </div>
      <div>{current?.content}</div>
    </div>
  );
}

// ─── Card Widget ──────────────────────────────────────────────────────────────
export function CardWidget({ icon, title, desc, badge, badgeColor, action }: {
  icon: string; title: string; desc: string; badge?: string; badgeColor?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="bg-background rounded-2xl border border-border/50 p-5 hover:border-primary/20 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[14px] text-foreground">{title}</h3>
            {badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: (badgeColor ?? "#007AFF") + "20", color: badgeColor ?? "#007AFF" }}>{badge}</span>}
          </div>
          <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>
      {action && (
        <button onClick={action.onClick} className="mt-4 w-full py-2 rounded-xl text-[13px] font-semibold text-primary hover:bg-primary/5 transition-colors border border-primary/20">
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── Testimonial Block ────────────────────────────────────────────────────────
export interface TestimonialItem { quote: string; name: string; role: string; avatar?: string }

export function TestimonialBlock({ testimonials }: { testimonials: TestimonialItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {testimonials.map((t, i) => (
        <div key={i} className="bg-background rounded-2xl border border-border/50 p-6 space-y-4">
          <p className="text-2xl">⭐</p>
          <blockquote className="text-[13px] text-foreground leading-relaxed italic">"{t.quote}"</blockquote>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
              {t.avatar ?? t.name[0]}
            </div>
            <div>
              <p className="font-semibold text-[12px] text-foreground">{t.name}</p>
              <p className="text-[11px] text-muted-foreground">{t.role}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Roadmap Widget ───────────────────────────────────────────────────────────
export interface RoadmapPhase { phase: string; label: string; description: string; status: "complete" | "active" | "future" }

export function RoadmapWidget({ phases }: { phases: RoadmapPhase[] }) {
  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {phases.map((p, i) => (
        <div key={i} className="flex gap-4 p-5 bg-background rounded-2xl border border-border/50 hover:border-primary/20 transition-colors">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className={`w-3 h-3 rounded-full ${p.status === "complete" ? "bg-green-500" : p.status === "active" ? "bg-blue-500 animate-pulse" : "bg-muted-foreground/30"}`} />
            {i < phases.length - 1 && <div className="w-0.5 flex-1 bg-border/50 min-h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold text-[14px] text-foreground">{p.phase}: {p.label}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                p.status === "complete" ? "bg-green-100 text-green-700" : p.status === "active" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"
              }`}>{p.status === "complete" ? "Complete" : p.status === "active" ? "In Progress" : "Upcoming"}</span>
            </div>
            <p className="text-[13px] text-muted-foreground">{p.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FAQ Widget ───────────────────────────────────────────────────────────────
export interface FAQItem { q: string; a: string }

export function FAQWidget({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2 max-w-2xl mx-auto">
      {items.map((item, i) => (
        <div key={i} className="bg-background rounded-2xl border border-border/50 overflow-hidden">
          <button onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors">
            <span className="font-semibold text-[14px] text-foreground">{item.q}</span>
            <span className={`text-muted-foreground flex-shrink-0 ml-4 transition-transform ${open === i ? "rotate-180" : ""}`}>↓</span>
          </button>
          {open === i && (
            <div className="px-4 pb-4">
              <p className="text-[13px] text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Storyboard Panel (Comics / Movies) ──────────────────────────────────────
export interface StoryboardFrame { panelNumber: number; visual: string; caption?: string; dialogue?: string; notes?: string }

export function StoryboardPanel({ frames }: { frames: StoryboardFrame[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {frames.map(f => (
        <div key={f.panelNumber} className="bg-background rounded-2xl border border-border/50 overflow-hidden">
          <div className="bg-muted/40 border-b border-border/30 px-4 py-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center">{f.panelNumber}</span>
            <span className="text-[11px] font-bold text-muted-foreground">Panel {f.panelNumber}</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-muted/20 rounded-xl border border-dashed border-border/50 h-24 flex items-center justify-center">
              <p className="text-[11px] text-muted-foreground text-center px-3">{f.visual}</p>
            </div>
            {f.caption && <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Caption</p><p className="text-[12px] text-foreground italic mt-0.5">"{f.caption}"</p></div>}
            {f.dialogue && <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Dialogue</p><p className="text-[12px] text-foreground font-medium mt-0.5">{f.dialogue}</p></div>}
            {f.notes && <p className="text-[11px] text-muted-foreground border-t border-border/30 pt-2">{f.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Image Placeholder ────────────────────────────────────────────────────────
export function ImagePlaceholder({ label, aspectRatio = "16/9" }: { label: string; aspectRatio?: string }) {
  return (
    <div className="w-full rounded-2xl border border-dashed border-border/50 bg-muted/20 flex items-center justify-center" style={{ aspectRatio }}>
      <div className="text-center p-6">
        <p className="text-3xl mb-2">🖼️</p>
        <p className="text-[13px] text-muted-foreground font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-1">Image placeholder</p>
      </div>
    </div>
  );
}

// ─── Safety Notice ────────────────────────────────────────────────────────────
export function SafetyNotice({ message, type = "info" }: { message: string; type?: "info" | "warning" | "demo" }) {
  const colors = {
    info: "bg-blue-50 border-blue-200 text-blue-700",
    warning: "bg-orange-50 border-orange-200 text-orange-700",
    demo: "bg-green-50 border-green-200 text-green-700",
  };
  const icons = { info: "ℹ️", warning: "⚠️", demo: "🟢" };
  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${colors[type]}`}>
      <span className="flex-shrink-0">{icons[type]}</span>
      <p className="text-[12px] font-medium leading-relaxed">{message}</p>
    </div>
  );
}
