import React, { useState, useEffect, useCallback } from "react";
import { useOS } from "@/os/OSContext";
import type { AppId } from "@/os/OSContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@workspace/replit-auth-web";

const STORAGE_KEY = "cai_onboarded_v1";
const SAGE = "#7a9068";
const SAGE_LIGHT = "#f0f4ee";
const SAGE_DARK = "#5a6d50";

// ─── Goal → Recommended Apps ─────────────────────────────────────────────────

type Goal = "business" | "creative" | "family" | "learning" | "health" | "ai";

interface GoalDef {
  id: Goal;
  icon: string;
  label: string;
  sub: string;
  apps: Array<{ id: AppId; icon: string; label: string; desc: string }>;
}

const GOALS: GoalDef[] = [
  {
    id: "business",
    icon: "🏗️",
    label: "Business Building",
    sub: "Strategy, proposals, marketing, finance",
    apps: [
      { id: "strategist"      as AppId, icon: "🧠", label: "Business Strategist", desc: "Strategic plans, market positioning, competitive analysis" },
      { id: "creator"         as AppId, icon: "✨", label: "Create Engine",        desc: "Build anything from one sentence — apps, campaigns, reports" },
      { id: "emailcomposer"   as AppId, icon: "📧", label: "Email Composer",       desc: "Professional emails, cold outreach, follow-up sequences" },
      { id: "projbuilder"     as AppId, icon: "📋", label: "Project Builder",      desc: "Full project plans, timelines, milestones" },
      { id: "people"          as AppId, icon: "👥", label: "People CRM",           desc: "Contacts, leads, relationships in one place" },
      { id: "proposalbuilder" as AppId, icon: "📑", label: "Proposal Builder",     desc: "Winning proposals and pitch documents" },
    ],
  },
  {
    id: "creative",
    icon: "✍️",
    label: "Creative Work",
    sub: "Writing, stories, scripts, art direction",
    apps: [
      { id: "poemforge"     as AppId, icon: "🌸", label: "PoemForge",          desc: "Poetry in any style, form, tone, or language" },
      { id: "scriptwriter"  as AppId, icon: "🎬", label: "Scriptwriter",       desc: "Screenplays, short films, commercial scripts" },
      { id: "essaywriter"   as AppId, icon: "📝", label: "Essay Writer",       desc: "Academic and professional essays with structure" },
      { id: "imaginationlab" as AppId, icon: "✨", label: "Imagination Lab",   desc: "11 creative fiction and world-building engines" },
      { id: "loreforge"     as AppId, icon: "📜", label: "LoreForge",          desc: "Deep mythology, prophecy, and lore creation" },
      { id: "blogwriter"    as AppId, icon: "✍️", label: "Blog Writer",        desc: "Engaging blog posts optimized for any audience" },
    ],
  },
  {
    id: "family",
    icon: "🏡",
    label: "Family & Personal",
    sub: "Life organization, goals, memories, wellness",
    apps: [
      { id: "family"            as AppId, icon: "🏡", label: "Family Hub",      desc: "Family universe — shared goals, memories, events" },
      { id: "journal"           as AppId, icon: "📔", label: "Journal",         desc: "Personal journaling with AI reflection prompts" },
      { id: "goalplanner"       as AppId, icon: "🎯", label: "Goal Planner",    desc: "Set, track, and achieve personal and team goals" },
      { id: "travelplanner"     as AppId, icon: "✈️", label: "Travel Planner",  desc: "Full trip itineraries, packing lists, logistics" },
      { id: "meditationguide"   as AppId, icon: "🧘", label: "Meditation Guide", desc: "Mindfulness scripts, breathing exercises, reflection" },
      { id: "recipecreator"     as AppId, icon: "🍽️", label: "Recipe Creator",  desc: "Custom recipes from any ingredients or dietary needs" },
    ],
  },
  {
    id: "learning",
    icon: "📚",
    label: "Research & Learning",
    sub: "Deep research, study plans, concepts",
    apps: [
      { id: "researchassist"   as AppId, icon: "🔬", label: "Research Assistant",   desc: "Literature reviews, methodology, academic research" },
      { id: "conceptexplainer" as AppId, icon: "💡", label: "Concept Explainer",    desc: "Any concept explained at any level of complexity" },
      { id: "studyplanner"     as AppId, icon: "📅", label: "Study Planner",        desc: "Custom study schedules and revision strategies" },
      { id: "criticalthinking" as AppId, icon: "🧩", label: "Critical Thinking",    desc: "Arguments, fallacies, logical analysis frameworks" },
      { id: "scienceexplainer" as AppId, icon: "🔭", label: "Science Explainer",    desc: "Physics, chemistry, biology — made understandable" },
      { id: "mathsolver"       as AppId, icon: "➕", label: "Math Solver",          desc: "Step-by-step solutions with full explanations" },
    ],
  },
  {
    id: "health",
    icon: "💚",
    label: "Health & Wellness",
    sub: "Coaching, nutrition, mental health, parenting",
    apps: [
      { id: "healthcoach"      as AppId, icon: "💪", label: "Health Coach",        desc: "Personalized fitness and health advice" },
      { id: "mentalhealth"     as AppId, icon: "🧠", label: "Mental Health",       desc: "CBT techniques, mindfulness, emotional support" },
      { id: "nutritionplanner" as AppId, icon: "🥗", label: "Nutrition Planner",   desc: "Meal plans, macros, dietary guidance" },
      { id: "sleepcoach"       as AppId, icon: "😴", label: "Sleep Coach",         desc: "Sleep hygiene, routines, and optimization" },
      { id: "parentingguide"   as AppId, icon: "👶", label: "Parenting Guide",     desc: "Age-appropriate advice and family strategies" },
      { id: "fitnesscoach"     as AppId, icon: "🏋️", label: "Fitness Coach",       desc: "Workouts, training plans, performance tracking" },
    ],
  },
  {
    id: "ai",
    icon: "🤖",
    label: "AI Tools & Tech",
    sub: "Prompts, systems, data, code planning",
    apps: [
      { id: "promptengineer"  as AppId, icon: "⚡", label: "Prompt Engineer",    desc: "Craft powerful prompts for any AI model" },
      { id: "brainhub"        as AppId, icon: "🧠", label: "Brain Hub",          desc: "Your AI command center — engines, tools, automation" },
      { id: "chat"            as AppId, icon: "💬", label: "AI Chat",            desc: "9 specialized AI workspaces for any task" },
      { id: "datastoryteller" as AppId, icon: "📊", label: "Data Storyteller",   desc: "Turn data into compelling narratives and insights" },
      { id: "systemdesigner"  as AppId, icon: "🏛️", label: "System Designer",    desc: "Architecture diagrams, system specs, tech design" },
      { id: "devplanner"      as AppId, icon: "💻", label: "Dev Planner",        desc: "Technical roadmaps, sprint planning, dev workflows" },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomerOnboardingWizard() {
  const { role } = useUserRole();
  const { user } = useAuth();
  const { openApp } = useOS();

  const [visible, setVisible]         = useState(false);
  const [step, setStep]               = useState(0);
  const [selectedGoals, setSelected]  = useState<Set<Goal>>(new Set());
  const [chosenApp, setChosenApp]     = useState<AppId | null>(null);
  const [animating, setAnimating]     = useState(false);

  // Only show for customer role, and only once
  useEffect(() => {
    if (role !== "customer") return undefined;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [role]);

  const dismiss = useCallback((launchApp?: AppId) => {
    localStorage.setItem(STORAGE_KEY, "1");
    // Fire-and-forget server record
    fetch("/api/activity", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "onboarding_complete", label: "Completed customer onboarding", icon: "🎉" }),
    }).catch(() => {});
    setVisible(false);
    if (launchApp) {
      setTimeout(() => openApp(launchApp), 300);
    }
  }, [openApp]);

  const nextStep = useCallback(() => {
    setAnimating(true);
    setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 200);
  }, []);

  const toggleGoal = useCallback((g: Goal) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g); else next.add(g);
      return next;
    });
  }, []);

  const recommendedApps = GOALS
    .filter(g => selectedGoals.has(g.id))
    .flatMap(g => g.apps)
    .reduce<Array<{ id: AppId; icon: string; label: string; desc: string }>>((acc, app) => {
      if (!acc.find(a => a.id === app.id)) acc.push(app);
      return acc;
    }, [])
    .slice(0, 6);

  const displayName = user?.firstName || user?.email?.split("@")[0] || "there";

  if (!visible) return null;

  const steps = ["Welcome", "Your Goals", "Top Apps", "Ready"];
  const progress = ((step) / (steps.length - 1)) * 100;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(15,23,42,0.65)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 24, width: "100%", maxWidth: 520,
          boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)",
          overflow: "hidden",
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.18s ease, transform 0.18s ease",
        }}
      >
        {/* Header bar */}
        <div style={{ background: `linear-gradient(135deg, ${SAGE} 0%, ${SAGE_DARK} 100%)`, padding: "20px 24px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {steps.map((s, i) => (
                <div key={s} style={{
                  width: i <= step ? 20 : 8, height: 8, borderRadius: 4,
                  background: i <= step ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.30)",
                  transition: "all 0.3s ease",
                }} />
              ))}
            </div>
            <button onClick={() => dismiss()} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "4px 10px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
              Skip
            </button>
          </div>
          <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
            Step {step + 1} of {steps.length}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 24px 20px", minHeight: 300 }}>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🧠</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 8, letterSpacing: "-0.03em" }}>
                Welcome, {displayName}!
              </h2>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 20, maxWidth: 380, margin: "0 auto 20px" }}>
                You've unlocked <strong style={{ color: SAGE }}>408 AI tools</strong> across business, creativity, health, research, and more. Let's set up your workspace in 60 seconds.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
                {[
                  { icon: "✨", label: "408 Apps" },
                  { icon: "🤖", label: "Real AI" },
                  { icon: "💾", label: "All Saved" },
                ].map(item => (
                  <div key={item.label} style={{ background: SAGE_LIGHT, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: SAGE_DARK }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <button onClick={nextStep} style={btnStyle}>
                Get Started →
              </button>
            </div>
          )}

          {/* Step 1: Goal Selection */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.02em" }}>
                What brings you here?
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Select all that apply — we'll recommend your top apps.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {GOALS.map(g => {
                  const sel = selectedGoals.has(g.id);
                  return (
                    <button key={g.id} onClick={() => toggleGoal(g.id)} style={{
                      border: `2px solid ${sel ? SAGE : "#e2e8f0"}`,
                      background: sel ? SAGE_LIGHT : "#fff",
                      borderRadius: 14, padding: "12px 14px", cursor: "pointer",
                      textAlign: "left", transition: "all 0.15s ease",
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{g.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: sel ? SAGE_DARK : "#0f172a" }}>{g.label}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{g.sub}</div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={nextStep}
                disabled={selectedGoals.size === 0}
                style={{ ...btnStyle, opacity: selectedGoals.size === 0 ? 0.4 : 1 }}
              >
                {selectedGoals.size === 0 ? "Select at least one goal" : `See my ${Math.min(recommendedApps.length || 6, 6)} recommended apps →`}
              </button>
            </div>
          )}

          {/* Step 2: Recommended Apps */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.02em" }}>
                Your top apps
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
                Based on your goals — pick one to open first.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {(recommendedApps.length > 0 ? recommendedApps : GOALS[0].apps).map(app => (
                  <button
                    key={app.id}
                    onClick={() => setChosenApp(app.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                      border: `2px solid ${chosenApp === app.id ? SAGE : "#e2e8f0"}`,
                      background: chosenApp === app.id ? SAGE_LIGHT : "#fff",
                      borderRadius: 14, cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{app.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: chosenApp === app.id ? SAGE_DARK : "#0f172a" }}>{app.label}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.desc}</div>
                    </div>
                    {chosenApp === app.id && <span style={{ color: SAGE, fontSize: 16, flexShrink: 0 }}>✓</span>}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(1)} style={secondaryBtnStyle}>← Back</button>
                <button onClick={nextStep} style={{ ...btnStyle, flex: 1 }}>
                  {chosenApp ? "Continue →" : "Skip for now →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 8, letterSpacing: "-0.03em" }}>
                You're all set!
              </h2>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>
                Your AI workspace is ready. Everything you generate is automatically saved to your <strong>Output Library</strong>. You can find any app with <strong>⌘K</strong>.
              </p>
              <div style={{ background: SAGE_LIGHT, borderRadius: 16, padding: "14px 16px", marginBottom: 24, textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: SAGE_DARK, marginBottom: 8 }}>Quick tips:</div>
                {[
                  ["⌘K", "Open any of the 408 apps instantly"],
                  ["📚", "Your Output Library saves every AI response"],
                  ["🔍", "Type any goal into the search bar — it routes you automatically"],
                ].map(([icon, tip]) => (
                  <div key={tip} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                    <span style={{ fontSize: 12, color: "#475569", lineHeight: 1.4 }}>{tip}</span>
                  </div>
                ))}
              </div>
              {chosenApp ? (
                <button onClick={() => dismiss(chosenApp)} style={btnStyle}>
                  Open my first app →
                </button>
              ) : (
                <button onClick={() => dismiss()} style={btnStyle}>
                  Explore the platform →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: "block", width: "100%", padding: "13px 20px",
  background: SAGE, color: "#fff", border: "none", borderRadius: 12,
  fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "-0.01em",
  transition: "opacity 0.15s ease",
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "13px 16px", background: "#f1f5f9", color: "#475569",
  border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600,
  cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
};
