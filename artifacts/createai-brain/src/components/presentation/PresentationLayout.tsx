// ─── Presentation Layout — Shared Full-Page Layout ────────────────────────────
// Shared layout for ProjectPage and any standalone presentation-mode pages.
// NO OS chrome. NO sidebar from OS. Completely independent full-screen layout.

import React, { useRef } from "react";
import { HeroBlock, HeroBlockProps, StatsBar, StatItem, SafetyNotice } from "@/components/widgets/WidgetLibrary";
import { AITourMode, TourStep } from "./AITourMode";

export interface PresentationSection {
  id: string;
  label: string;
  icon: string;
}

interface PresentationLayoutProps {
  // Identity
  title: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;

  // Classification
  label?: string;
  badge?: string;
  safetyNote?: string;

  // Navigation
  sections: PresentationSection[];
  activeSection: string;
  onSectionChange: (id: string) => void;

  // Hero CTAs
  primaryCTA?: { label: string; onClick: () => void };
  secondaryCTA?: { label: string; onClick: () => void };
  tertiaryCTA?: { label: string; onClick: () => void };

  // Stats bar (optional)
  stats?: StatItem[];

  // Back navigation
  onBack?: () => void;
  backLabel?: string;

  // Top-right action
  topAction?: { label: string; onClick: () => void };

  // Tour mode
  tourSteps?: TourStep[];
  showTour?: boolean;

  children: React.ReactNode;
}

export function PresentationLayout({
  title, tagline, description, icon, color, gradient,
  label, badge, safetyNote,
  sections, activeSection, onSectionChange,
  primaryCTA, secondaryCTA, tertiaryCTA,
  stats,
  onBack, backLabel = "← Back",
  topAction,
  tourSteps,
  showTour = true,
  children,
}: PresentationLayoutProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSectionChange = (id: string) => {
    onSectionChange(id);
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Top Nav Bar ── */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">

          {onBack && (
            <button onClick={onBack}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium flex-shrink-0">
              <span className="text-xs">←</span>
              <span className="hidden sm:inline">{backLabel}</span>
            </button>
          )}

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl flex-shrink-0">{icon}</span>
            <span className="font-bold text-[14px] text-foreground truncate">{title}</span>
            {badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground flex-shrink-0 hidden sm:inline-flex">
                {badge}
              </span>
            )}
          </div>

          {topAction && (
            <button onClick={topAction.onClick}
              className="flex-shrink-0 text-[12px] font-bold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity hidden sm:block"
              style={{ backgroundColor: color }}>
              {topAction.label}
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <HeroBlock
        icon={icon} badge={badge} label={label}
        title={title} tagline={tagline} description={description} gradient={gradient}
        primaryCTA={primaryCTA}
        secondaryCTA={secondaryCTA}
        tertiaryCTA={tertiaryCTA}
      />

      {/* ── Stats Bar ── */}
      {stats && stats.length > 0 && (
        <StatsBar stats={stats} gradient={gradient} />
      )}

      {/* ── Safety Notice (if needed) ── */}
      {safetyNote && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <SafetyNotice message={safetyNote} type="warning" />
        </div>
      )}

      {/* ── Section Navigation ── */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: "none" }}>
            {sections.map(section => (
              <button key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeSection === section.id
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}>
                <span className="text-sm">{section.icon}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {children}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-bold text-[14px] text-foreground">{title}</p>
                <p className="text-[11px] text-muted-foreground">Built on CreateAI Brain · All content is mock</p>
              </div>
            </div>
            <div className="flex gap-3">
              {onBack && (
                <button onClick={onBack}
                  className="text-[13px] font-medium text-muted-foreground hover:text-foreground border border-border/50 px-4 py-2 rounded-xl transition-colors">
                  {backLabel}
                </button>
              )}
              {topAction && (
                <button onClick={topAction.onClick}
                  className="text-[13px] font-bold text-white px-5 py-2 rounded-xl hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: color }}>
                  {topAction.label}
                </button>
              )}
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-border/30 text-center">
            <p className="text-[11px] text-muted-foreground">
              CreateAI Brain · Built by Sara Stadler · All platform content is mock, conceptual, and for demonstration purposes only.
            </p>
          </div>
        </div>
      </footer>

      {/* ── AI Tour Mode ── */}
      {showTour && tourSteps && tourSteps.length > 0 && (
        <AITourMode steps={tourSteps} productName={title} accentColor={color} />
      )}
    </div>
  );
}
