import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ALL_ENGINES, ALL_SERIES, saveEngineOutput,
  fetchPlatformStats, getEnginesByCategory,
  type EngineDefinition, type SeriesDefinition, type PlatformStats,
} from "@/engine/CapabilityEngine";
import { RegulatoryEngine } from "@/engine/RegulatoryEngine";
import { SaveToProjectModal } from "@/components/SaveToProjectModal";
import { useEngineRun, useSeriesRun } from "@/controller";
import { DocumentRenderer } from "@/engines/document";

// ─── Types ─────────────────────────────────────────────────────────────────────
type HubView = "dashboard" | "engines" | "agents" | "series" | "compliance" | "run" | "series-run";

// Per-engine hint text shown in RunPanel (Step 4 — engine-specific hints)
const ENGINE_HINTS: Record<string, { placeholder: string; example: string }> = {
  BrainGen:                  { placeholder: "What content should BrainGen create?", example: "e.g. LinkedIn post about AI trends in healthcare" },
  InfiniteExpansionEngine:   { placeholder: "What idea should be expanded infinitely?", example: "e.g. A community platform for rural educators" },
  UniversalCreativeEngine:   { placeholder: "What creative project needs a full production package?", example: "e.g. A 6-episode podcast series on mental health for founders" },
  UniversalWorkflowEngine:   { placeholder: "What process or workflow should be designed?", example: "e.g. Patient onboarding workflow for a telehealth clinic" },
  UniversalStrategyEngine:   { placeholder: "What business or initiative needs a strategic roadmap?", example: "e.g. Launching a SaaS product for construction project managers" },
  UniversalStoryEngine:      { placeholder: "What story world, character, or narrative needs building?", example: "e.g. A near-future thriller about AI governance in small towns" },
  UniversalGameEngine:       { placeholder: "What game needs a complete design document?", example: "e.g. A mobile puzzle game for adults with memory challenges" },
  UniversalConnectionEngine: { placeholder: "What two domains or systems should be connected?", example: "e.g. Healthcare + Construction (safety compliance)" },
  ProjectIntelligence:       { placeholder: "Describe the project to analyze for risks and recommendations.", example: "e.g. Launching a home health aide scheduling app in 90 days" },
  RegulatoryEngine:          { placeholder: "What industry or regulation needs a compliance framework?", example: "e.g. HIPAA compliance for a telehealth startup" },
  BackendBlueprintEngine:    { placeholder: "What system needs a backend architecture design?", example: "e.g. Multi-tenant SaaS with RBAC and real-time notifications" },
  TemplateLibrary:           { placeholder: "What document or template should be generated?", example: "e.g. Client onboarding agreement for a digital marketing agency" },
  ConversationEngine:        { placeholder: "What conversational flow or chatbot script needs designing?", example: "e.g. Customer support bot for an e-commerce returns portal" },
  IntegrationEngine:         { placeholder: "What systems need to be integrated?", example: "e.g. Salesforce CRM + HubSpot + Slack notifications" },
  ExportEngine:              { placeholder: "What report or export format needs designing?", example: "e.g. Weekly performance dashboard for a logistics company" },
  ThemeEngine:               { placeholder: "What brand or product needs a design system?", example: "e.g. Design system for a children's education platform" },
  guideEngine:               { placeholder: "What product or process needs a complete guide?", example: "e.g. Onboarding guide for new users of a project management tool" },
  InviteGeneratorEngine:     { placeholder: "What product or community needs an invite campaign?", example: "e.g. Referral campaign for a healthcare professional network" },
  InteractionEngine:         { placeholder: "What user interface or experience needs interaction design?", example: "e.g. Mobile onboarding flow for a first-time investor app" },
  ORACLE:                    { placeholder: "What topic or domain should ORACLE forecast and analyze?", example: "e.g. AI adoption trends in rural healthcare over the next 5 years" },
  FORGE:                     { placeholder: "What content package should FORGE build and bundle?", example: "e.g. Complete brand launch package for a sustainable food startup" },
  NEXUS:                     { placeholder: "What systems or workflows should NEXUS integrate?", example: "e.g. Automate the intake-to-invoice workflow for a consulting firm" },
  SENTINEL:                  { placeholder: "What needs a risk and compliance analysis?", example: "e.g. Risks of launching a fintech app for unbanked communities" },
  PULSE:                     { placeholder: "What experience or journey should PULSE optimize for engagement?", example: "e.g. User onboarding for a meditation app targeting stressed executives" },
  VECTOR:                    { placeholder: "What data or domain should VECTOR extract patterns from?", example: "e.g. Patterns in why B2B SaaS companies churn in months 3-6" },

  // ── B1 — Intelligence Engines ─────────────────────────────────────────────
  ResearchEngine:            { placeholder: "What topic or domain should be deeply researched?", example: "e.g. Evidence-based approaches to reducing hospital readmission rates" },
  PersonaEngine:             { placeholder: "Who is your user? Describe them briefly.", example: "e.g. First-generation college students applying to STEM programs in rural areas" },
  MarketResearchEngine:      { placeholder: "What market or opportunity should be analyzed?", example: "e.g. AI-powered legal document review for solo law practitioners in the US" },
  CritiqueEngine:            { placeholder: "What idea, plan, or assumption should be critically analyzed?", example: "e.g. Our plan to launch a freemium B2B SaaS with no sales team in year one" },
  LearningEngine:            { placeholder: "What skill or knowledge area needs a learning path?", example: "e.g. Teaching non-technical founders how to read and review engineering roadmaps" },

  // ── B2 — Workflow Engines ─────────────────────────────────────────────────
  PricingEngine:             { placeholder: "What product or service needs a pricing strategy?", example: "e.g. A project management SaaS for construction firms — 3-tier pricing with enterprise" },
  FeedbackEngine:            { placeholder: "What product or experience needs a feedback system?", example: "e.g. Post-discharge feedback system for a telehealth platform" },
  CommunicationEngine:       { placeholder: "What communication challenge or campaign needs a plan?", example: "e.g. Announcing a major product pivot to existing customers and the press" },

  // ── B3 — Data + Integration Engines ──────────────────────────────────────
  DataModelEngine:           { placeholder: "What system or domain needs a data model?", example: "e.g. Multi-tenant healthcare scheduling app with patients, providers, and appointments" },
  LocalizationEngine:        { placeholder: "What product or market needs a localization strategy?", example: "e.g. Expanding a US fintech app to Brazil, India, and Germany" },

  // ── C1-C2 — New Meta-Agents ───────────────────────────────────────────────
  ARCHITECT:                 { placeholder: "What system should ARCHITECT design from scratch?", example: "e.g. A real-time collaboration platform for distributed healthcare teams" },
  CURATOR:                   { placeholder: "What topic or knowledge area should CURATOR organize?", example: "e.g. Everything known about reducing patient no-shows in outpatient clinics" },
  MENTOR:                    { placeholder: "What skill, role, or growth journey needs a mentorship plan?", example: "e.g. A junior product manager transitioning into a technical PM role in 6 months" },
  CATALYST:                  { placeholder: "What initiative is stuck or needs a breakthrough?", example: "e.g. Our MVP launch has stalled for 3 months — what's blocking us and how do we break through?" },

  // ── Opportunity Engine ────────────────────────────────────────────────────
  OpportunityEngine:         { placeholder: "What market, business, or domain should be scanned for opportunities?", example: "e.g. Our healthcare SaaS in mid-market — what expansion or partnership opportunities exist in the next 12 months?" },

  // ── ImaginationLab Engines (all fictional, safe, family-friendly) ─────────
  StoryEngine:               { placeholder: "What kind of story should be built?", example: "e.g. A coming-of-age fantasy about a girl who can communicate with ancient trees" },
  CharacterEngine:           { placeholder: "Describe the fictional character you want to design", example: "e.g. A reluctant wizard who lost their memory and must rediscover who they are" },
  WorldbuildingEngine:       { placeholder: "What fictional world do you want to build?", example: "e.g. A floating archipelago of sky islands where different civilizations control different elements" },
  CreatureEngine:            { placeholder: "What kind of creature do you want to invent?", example: "e.g. A bioluminescent deep-sea dragon that feeds on starlight and can walk between dreams" },
  SuperpowerEngine:          { placeholder: "What fictional superpower should be designed?", example: "e.g. The ability to rewind a single object in time by 24 hours, but only while the user is asleep" },
  AdventureEngine:           { placeholder: "What adventure scenario should be created?", example: "e.g. A group of misfits must cross a continent to deliver a baby phoenix before the winter eclipse" },
  ComicPlotEngine:           { placeholder: "What kind of comic book story should be plotted?", example: "e.g. A teen superhero team discovers their city is built on top of a sleeping god who is waking up" },
  GameIdeaEngine:            { placeholder: "What kind of game concept should be invented?", example: "e.g. A puzzle platformer where your shadow is an AI that sometimes disagrees with your decisions" },
  FutureTechFictionEngine:   { placeholder: "What fictional future technology should be imagined?", example: "e.g. A device that lets people visit their own memories as if they were a video game level" },
  BlueprintFictionEngine:    { placeholder: "What fictional artifact or story prop should be designed?", example: "e.g. An ancient compass that points toward your greatest regret instead of north" },
  QuestEngine:               { placeholder: "What quest or mission should be designed?", example: "e.g. A side quest to reunite a cursed musician with the melody she gave away to save her village" },
  DreamscapeEngine:          { placeholder: "What mood or atmosphere should I generate?", example: "e.g. The emotional landscape of an ancient library on a floating island at the moment the last librarian disappears" },
  MagicSystemEngine:         { placeholder: "What kind of magic system should I design?", example: "e.g. A system where practitioners sacrifice cherished memories — the more powerful the spell, the more precious the memory lost" },
  MythologyEngine:           { placeholder: "What mythology or pantheon should I create?", example: "e.g. A pantheon of gods born from the first seven sounds ever made, each governing a different domain" },
  ProphecyEngine:            { placeholder: "What prophecy should I write?", example: "e.g. A prophecy given simultaneously to two rival kingdoms, each believing themselves the chosen ones" },
  LegendEngine:              { placeholder: "What legend should I build?", example: "e.g. A warrior who traded her name for immortality and now wanders the world, forgotten by all who loved her" },
  ReligionEngine:            { placeholder: "What fictional religion should I design?", example: "e.g. A religion that worships time itself, with priests forbidden from remembering the past" },
  AncientHistoryEngine:      { placeholder: "What ancient civilization or era should I create?", example: "e.g. An empire built entirely on the art of forgetting — their greatest technology was erasure" },
  FactionEngine:             { placeholder: "What faction, guild, or secret society should I design?", example: "e.g. A secret order of librarians who control the flow of information by deciding what gets written down" },
  LanguageEngine:            { placeholder: "What fictional language concept should I design?", example: "e.g. A language where tense is determined by emotional certainty — things you feel sure about are past tense" },
  CurseEngine:               { placeholder: "What curse should I design?", example: "e.g. A curse that makes everything you love slowly forget you — not hate you, just gently cease to remember you exist" },
  ProphetEngine:             { placeholder: "What prophet or seer should I create?", example: "e.g. A prophet who can only see the future when completely alone, and loses the vision the moment she tries to share it" },
  RelicEngine:               { placeholder: "What relic or legendary artifact should I design?", example: "e.g. A crown that grants perfect wisdom to its wearer, but causes them to slowly lose the capacity for joy" },
  LoreKeeperEngine:          { placeholder: "What lore keeper or knowledge institution should I create?", example: "e.g. An order of blind historians who memorize entire libraries after the Great Burning" },
  CosmologyEngine:           { placeholder: "What cosmology or universe structure should I design?", example: "e.g. A universe where the afterlife is a vast library and every book is someone's unlived life" },
  EraEngine:                 { placeholder: "What historical era should I design?", example: "e.g. The Age of Hollow Crowns — when every ruler was secretly controlled by the same ancient council" },

  // ── Maximum-Capacity Engines (v3 Expansion) ────────────────────────────────
  DeliverableEngine:         { placeholder: "What product or initiative needs a complete Demo/Test/Live deliverable package?", example: "e.g. A healthcare scheduling SaaS for home health agencies — build the full Demo, Test, and Live packages" },
  AutomationEngine:          { placeholder: "What business process needs a complete automation system?", example: "e.g. Patient intake-to-invoice automation for a home health agency with Salesforce, EHR, and billing" },
  ProductionEngine:          { placeholder: "What system needs a full production-readiness plan?", example: "e.g. Our healthcare SaaS launching in 60 days — full production checklist, deployment strategy, and runbook" },
  ComplianceAuditEngine:     { placeholder: "What system or product needs a deep compliance audit?", example: "e.g. A telehealth platform — HIPAA, GDPR, and SOC2 audit with gap report and remediation roadmap" },
  SecurityEngine:            { placeholder: "What system needs a complete security architecture and threat model?", example: "e.g. A multi-tenant SaaS handling PHI — STRIDE threat model, authentication design, and OWASP Top 10 coverage" },
  ScalingEngine:             { placeholder: "What system needs a scaling architecture from zero to millions of users?", example: "e.g. Our scheduling platform hitting 10K concurrent users — database, API, and infrastructure scaling plan" },
  MonetizationEngine:        { placeholder: "What product needs a complete revenue architecture?", example: "e.g. A B2B SaaS for construction project managers — 3-tier pricing, subscription logic, and 12-month revenue forecast" },
  LaunchEngine:              { placeholder: "What product or initiative needs a complete go-to-market launch system?", example: "e.g. Launching a staffing OS platform for home health agencies in Q2 — 90-day plan, press kit, and day-1 playbook" },
  GrowthEngine:              { placeholder: "What product or platform needs a data-driven growth system?", example: "e.g. Our SaaS with 500 users — acquisition channels, activation flow, referral program, and 10 growth experiments" },
  RetentionEngine:           { placeholder: "What product needs a complete user retention architecture?", example: "e.g. A project management tool with 15% monthly churn — churn analysis, engagement loops, and save flow" },
  AnalyticsEngine:           { placeholder: "What product or platform needs a complete analytics system?", example: "e.g. A healthcare SaaS — event taxonomy, funnel design, 3 dashboards, and A/B testing framework" },
  APIDesignEngine:           { placeholder: "What system or feature needs a complete REST API specification?", example: "e.g. A multi-tenant scheduling API with authentication, RBAC, webhooks, and OpenAPI spec for 20 endpoints" },
  UIUXEngine:                { placeholder: "What product or feature needs a complete UI/UX design system?", example: "e.g. A mobile-first home health agency dashboard — design principles, component library, and key screen wireframes" },
  AccessibilityEngine:       { placeholder: "What product needs a WCAG 2.2 AA accessibility audit and implementation spec?", example: "e.g. Our scheduling web app — 50-point WCAG audit, keyboard navigation map, and ADA compliance statement" },
  DevOpsEngine:              { placeholder: "What system needs a complete DevOps pipeline and infrastructure design?", example: "e.g. A SaaS platform with 3 environments — CI/CD pipeline, container architecture, monitoring, and SLO framework" },
  MobileEngine:              { placeholder: "What product needs a complete mobile app specification for iOS and Android?", example: "e.g. A home health aide scheduling app — screen inventory, offline mode, push notifications, and App Store readiness" },
  PartnershipEngine:         { placeholder: "What product or business needs a strategic partnership program?", example: "e.g. A healthcare SaaS — partner landscape, top 10 targets, outreach sequences, and co-marketing plan" },
  ContentStrategyEngine:     { placeholder: "What brand or product needs a complete content strategy?", example: "e.g. A B2B SaaS for construction — content mission, 3 pillars, 90-day calendar, and SEO keyword strategy" },
  SEOEngine:                 { placeholder: "What website or product needs a complete SEO strategy and technical audit?", example: "e.g. A healthcare scheduling platform — 30-keyword strategy, content gap analysis, and Core Web Vitals audit" },
  PerformanceEngine:         { placeholder: "What system needs a complete performance optimization plan?", example: "e.g. Our React + Node SaaS — frontend bundle optimization, N+1 query elimination, and load testing plan" },
};

// ─── Status Dot ─────────────────────────────────────────────────────────────────
function StatusDot({ active }: { active: boolean }) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: active ? "#34C759" : "#636366",
      boxShadow: active ? "0 0 6px #34C759" : "none",
      marginRight: 6, flexShrink: 0,
    }} />
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>{label}</div>
    </div>
  );
}

// ─── Engine Card ──────────────────────────────────────────────────────────────
function EngineCard({ engine, onRun, compact }: {
  engine: EngineDefinition;
  onRun: (e: EngineDefinition) => void;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12, padding: compact ? "12px 14px" : "16px",
        display: "flex", flexDirection: "column", gap: 8, cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(99,102,241,0.08)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,102,241,0.3)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 8, background: `${engine.color}22`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            border: `1px solid ${engine.color}44`,
          }}>{engine.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.2 }}>{engine.name}</div>
            {engine.series && <div style={{ fontSize: 10, color: engine.color, marginTop: 2 }}>{engine.series}</div>}
          </div>
        </div>
        <StatusDot active={engine.status === "active"} />
      </div>
      {!compact && (
        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{engine.description}</div>
      )}
      {!compact && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {engine.capabilities.slice(0, 3).map(cap => (
            <span key={cap} style={{
              fontSize: 10, background: "rgba(255,255,255,0.06)", borderRadius: 4,
              padding: "2px 6px", color: "#94a3b8",
            }}>{cap}</span>
          ))}
        </div>
      )}
      <button
        onClick={() => onRun(engine)}
        style={{
          background: `${engine.color}22`, border: `1px solid ${engine.color}44`,
          borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600,
          color: engine.color, cursor: "pointer", alignSelf: "flex-start",
        }}
      >
        ▶ Run Engine
      </button>
    </div>
  );
}

// ─── Run Panel — wired through PlatformController ─────────────────────────────
function RunPanel({ engine, onBack }: { engine: EngineDefinition; onBack: () => void }) {
  const hint = ENGINE_HINTS[engine.id] ?? {
    placeholder: `What should ${engine.name} generate or analyze?`,
    example: "",
  };

  const { run: runCtrl, output, document: doc, status, error: runError, isRunning, isDone } = useEngineRun(engine.id);
  const [topic,    setTopic]    = useState("");
  const [context,  setContext]  = useState("");
  const [showSave, setShowSave] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const handleRun = useCallback(() => {
    if (!topic.trim()) return;
    runCtrl(topic.trim(), { context });
  }, [topic, context, runCtrl]);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8,
          padding: "6px 12px", color: "#e2e8f0", cursor: "pointer", fontSize: 13,
        }}>← Back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 40, height: 40, borderRadius: 10, background: `${engine.color}22`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            border: `1px solid ${engine.color}44`,
          }}>{engine.icon}</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#e2e8f0" }}>{engine.name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {engine.category === "meta-agent" ? "Meta-Agent" : `${engine.category} engine`}
              {engine.series ? ` · ${engine.series}` : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{
        background: `${engine.color}0d`, border: `1px solid ${engine.color}22`,
        borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#94a3b8", lineHeight: 1.6,
      }}>
        {engine.description}
      </div>

      {/* Capabilities */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {engine.capabilities.map(cap => (
          <span key={cap} style={{
            fontSize: 10, background: `${engine.color}15`, borderRadius: 20,
            padding: "3px 9px", color: engine.color, border: `1px solid ${engine.color}30`,
          }}>{cap}</span>
        ))}
      </div>

      {/* Topic input with engine-specific hint */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
          TOPIC / REQUEST *
        </label>
        {hint.example && (
          <div style={{ fontSize: 11, color: "#4f5a6e", fontStyle: "italic", marginBottom: 2 }}>
            {hint.example}
          </div>
        )}
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder={hint.placeholder}
          rows={3}
          style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13,
            resize: "none", fontFamily: "inherit", lineHeight: 1.5,
          }}
          onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleRun(); }}
        />
      </div>

      {/* Context input */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
          ADDITIONAL CONTEXT <span style={{ fontWeight: 400, color: "#4f5a6e" }}>(optional)</span>
        </label>
        <textarea
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="Industry, constraints, target audience, existing assets, goals…"
          rows={2}
          style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13,
            resize: "none", fontFamily: "inherit",
          }}
        />
      </div>

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={isRunning || !topic.trim()}
        style={{
          background: isRunning ? "rgba(99,102,241,0.3)" : engine.color,
          border: "none", borderRadius: 10, padding: "12px 20px",
          color: "#fff", fontSize: 14, fontWeight: 700,
          cursor: isRunning ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
          opacity: !topic.trim() && !isRunning ? 0.5 : 1,
        }}
      >
        {isRunning
          ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span> Running {engine.name}…</>
          : <><span>{engine.icon}</span> Activate {engine.name}</>
        }
      </button>
      <div style={{ fontSize: 11, color: "#4f5a6e", textAlign: "center" }}>
        {engine.category === "meta-agent" ? "⌘+Enter to run" : "⌘+Enter to run · Safety filter active"}
      </div>

      {/* Error */}
      {runError && (
        <div style={{
          background: "rgba(255,59,48,0.12)", border: "1px solid rgba(255,59,48,0.3)",
          borderRadius: 8, padding: "10px 14px", color: "#ff3b30", fontSize: 13,
        }}>⚠️ {runError}</div>
      )}

      {/* Output */}
      {output && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
              {isRunning ? "⟳ STREAMING OUTPUT…" : isDone ? "✅ OUTPUT COMPLETE" : "OUTPUT"}
            </label>
            {isDone && (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  style={{
                    background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 6,
                    padding: "4px 10px", color: "#94a3b8", cursor: "pointer", fontSize: 11,
                  }}
                >Copy</button>
                <button
                  onClick={() => setShowSave(true)}
                  style={{
                    background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
                    borderRadius: 6, padding: "4px 10px", color: "#818cf8",
                    cursor: "pointer", fontSize: 11, fontWeight: 600,
                  }}
                >💾 Save to Project</button>
              </div>
            )}
          </div>
          <div ref={outputRef} style={{ maxHeight: 480, overflowY: "auto" }}>
            {isDone && doc ? (
              <DocumentRenderer schema={doc} compact toolbar />
            ) : (
              <div style={{
                background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "14px", color: "#e2e8f0", fontSize: 13,
                lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace",
              }}>{output}</div>
            )}
          </div>
        </div>
      )}

      {showSave && (
        <SaveToProjectModal
          content={output}
          label={`${engine.name} — ${topic.slice(0, 40)}`}
          onClose={() => setShowSave(false)}
        />
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ─── Series Run Panel — wired through PlatformController ──────────────────────
function SeriesRunPanel({ series, onBack }: { series: SeriesDefinition; onBack: () => void }) {
  const { run: runSeries, sections, status, error: seriesError, allOutput, isRunning, isDone } = useSeriesRun(series.id);
  const [topic,    setTopic]    = useState("");
  const [context,  setContext]  = useState("");
  const [showSave, setShowSave] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sections]);

  const handleRun = useCallback(() => {
    if (!topic.trim() || isRunning) return;
    runSeries(topic.trim(), context);
  }, [topic, context, isRunning, runSeries]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8,
          padding: "6px 12px", color: "#e2e8f0", cursor: "pointer", fontSize: 13,
        }}>← Back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 44, height: 44, borderRadius: 10, background: `${series.color}22`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            border: `1px solid ${series.color}44`,
          }}>{series.icon}</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: series.color }}>{series.name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {series.engines.length} engines run in sequence · {series.symbol}
            </div>
          </div>
        </div>
      </div>

      {/* Series description */}
      <div style={{
        background: `${series.color}0d`, border: `1px solid ${series.color}22`,
        borderRadius: 10, padding: "12px 14px",
      }}>
        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{series.description}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
          {series.engines.map(eid => (
            <span key={eid} style={{
              fontSize: 10, background: `${series.color}15`, borderRadius: 4,
              padding: "2px 7px", color: series.color, border: `1px solid ${series.color}30`,
            }}>{eid}</span>
          ))}
        </div>
      </div>

      {/* Input */}
      {!isRunning && !isDone && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>TOPIC *</label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={`What should the ${series.name} analyze or build?`}
              rows={3}
              style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13,
                resize: "none", fontFamily: "inherit",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
              CONTEXT <span style={{ fontWeight: 400, color: "#4f5a6e" }}>(optional)</span>
            </label>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Industry, goals, constraints, audience…"
              rows={2}
              style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13,
                resize: "none", fontFamily: "inherit",
              }}
            />
          </div>
          <button
            onClick={handleRun}
            disabled={!topic.trim()}
            style={{
              background: series.color, border: "none", borderRadius: 10, padding: "12px 20px",
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: !topic.trim() ? "not-allowed" : "pointer",
              opacity: !topic.trim() ? 0.5 : 1,
            }}
          >
            {series.icon} Activate {series.name} ({series.engines.length} engines)
          </button>
        </>
      )}

      {/* Error */}
      {seriesError && (
        <div style={{
          background: "rgba(255,59,48,0.12)", border: "1px solid rgba(255,59,48,0.3)",
          borderRadius: 8, padding: "10px 14px", color: "#ff3b30", fontSize: 13,
        }}>⚠️ {seriesError}</div>
      )}

      {/* Streaming output — one section per engine */}
      {sections.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
              {isRunning ? "⟳ Running series…" : "✅ Series complete"}
            </div>
            {isDone && (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => navigator.clipboard.writeText(allOutput)}
                  style={{
                    background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 6,
                    padding: "4px 10px", color: "#94a3b8", cursor: "pointer", fontSize: 11,
                  }}
                >Copy All</button>
                <button
                  onClick={() => setShowSave(true)}
                  style={{
                    background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
                    borderRadius: 6, padding: "4px 10px", color: "#818cf8",
                    cursor: "pointer", fontSize: 11, fontWeight: 600,
                  }}
                >💾 Save All</button>
              </div>
            )}
          </div>

          {sections.map((section, i) => (
            <div key={section.engineId} style={{
              background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, overflow: "hidden",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.03)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: series.color,
                    background: `${series.color}22`, borderRadius: 4, padding: "2px 7px",
                  }}>ENGINE {i + 1}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{section.engineName || section.engineId}</span>
                </div>
                {section.status === "done" && <span style={{ fontSize: 11, color: "#34C759" }}>✓ Done</span>}
                {section.status === "running" && <span style={{ fontSize: 11, color: "#94a3b8", animation: "pulse 1.5s infinite" }}>streaming…</span>}
                {section.status === "pending" && <span style={{ fontSize: 11, color: "#4f5a6e" }}>pending</span>}
              </div>
              <div style={{
                padding: "12px 14px", fontSize: 12, color: "#94a3b8", lineHeight: 1.7,
                whiteSpace: "pre-wrap", maxHeight: 320, overflowY: "auto",
                fontFamily: "ui-monospace, monospace",
              }}>
                {section.text || <span style={{ color: "#4f5a6e" }}>Waiting for output…</span>}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      )}

      {isDone && (
        <button
          onClick={() => { }}
          style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10, padding: "10px", color: "#94a3b8", cursor: "pointer", fontSize: 13,
          }}
        >↩ Run Again</button>
      )}

      {showSave && (
        <SaveToProjectModal
          content={allOutput}
          label={`${series.name} — ${topic.slice(0, 40)}`}
          onClose={() => setShowSave(false)}
        />
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ─── Compliance Panel (Step 2 — port of AdminApp's RegulatorySection) ─────────
function CompliancePanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const blueprints  = RegulatoryEngine.getAll();
  const rawStats    = RegulatoryEngine.getStats();
  const stats = {
    totalBlueprints: rawStats.total,
    totalClauses:    blueprints.reduce((n, b) => n + b.clauses.length, 0),
    mapped:          blueprints.reduce((n, b) => n + b.clauses.filter(c => c.mockStatus === "mapped").length, 0),
    gaps:            blueprints.reduce((n, b) => n + b.clauses.filter(c => c.mockStatus === "gap").length, 0),
  };

  const statusColors: Record<string, string> = {
    mapped: "#34C759", partial: "#FF9500", gap: "#FF3B30", "not-applicable": "#636366",
  };

  if (selectedId) {
    const bp = RegulatoryEngine.getById(selectedId)!;
    const mappedCount  = bp.clauses.filter(c => c.mockStatus === "mapped").length;
    const partialCount = bp.clauses.filter(c => c.mockStatus === "partial").length;
    const gapCount     = bp.clauses.filter(c => c.mockStatus === "gap").length;
    const total        = bp.clauses.length;
    const readinessScore = total ? Math.round((mappedCount / total) * 100) : 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setSelectedId(null)} style={{
            background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8,
            padding: "6px 12px", color: "#e2e8f0", cursor: "pointer", fontSize: 13,
          }}>← Compliance</button>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#e2e8f0", margin: 0, flex: 1 }}>{bp.framework}</h2>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
            background: bp.status === "blueprint-ready" ? "rgba(52,199,89,0.2)" : "rgba(255,149,0,0.2)",
            color: bp.status === "blueprint-ready" ? "#34C759" : "#FF9500",
          }}>{bp.status}</span>
        </div>

        {/* Disclaimer */}
        <div style={{
          background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.25)",
          borderRadius: 10, padding: "10px 14px",
        }}>
          <p style={{ fontSize: 11, color: "#ff6b6b", lineHeight: 1.5, margin: 0 }}>
            ⚠️ {bp.disclaimer}
          </p>
        </div>

        {/* Readiness score */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12, padding: "16px",
        }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>BLUEPRINT READINESS SCORE</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              fontSize: 42, fontWeight: 700,
              color: readinessScore >= 70 ? "#34C759" : readinessScore >= 40 ? "#FF9500" : "#FF3B30",
            }}>{readinessScore}%</div>
            <div style={{ flex: 1 }}>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4, transition: "width 0.5s",
                  width: `${readinessScore}%`,
                  background: readinessScore >= 70 ? "#34C759" : readinessScore >= 40 ? "#FF9500" : "#FF3B30",
                }} />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {[["✓ Mapped", mappedCount, "#34C759"], ["~ Partial", partialCount, "#FF9500"], ["⚠ Gap", gapCount, "#FF3B30"]]
                  .map(([l, v, c]) => (
                    <span key={String(l)} style={{ fontSize: 11, color: String(c) }}>
                      {String(l)}: {String(v)}
                    </span>
                  ))
                }
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#94a3b8", lineHeight: 1.6,
        }}>{bp.summary}</div>

        {/* Clauses */}
        {bp.clauses.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
              Clauses ({bp.clauses.length})
            </div>
            {bp.clauses.map(c => (
              <div key={c.id} style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${statusColors[c.mockStatus] ?? "#636366"}33`,
                borderRadius: 8, padding: "10px 12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{c.reference}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", flex: 1 }}>{c.title}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: statusColors[c.mockStatus],
                    background: `${statusColors[c.mockStatus]}22`, borderRadius: 4, padding: "2px 6px",
                  }}>
                    {c.mockStatus === "mapped" ? "✓ Mapped" : c.mockStatus === "gap" ? "⚠ Gap" : c.mockStatus === "partial" ? "~ Partial" : "N/A"}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{c.description}</p>
                <p style={{ fontSize: 10, color: "#64748b", margin: "4px 0 0", fontStyle: "italic" }}>Blueprint: {c.implementationNote}</p>
              </div>
            ))}
          </div>
        )}

        {/* Gap analysis */}
        {bp.gapAnalysis.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
              Gap Analysis
            </div>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, padding: "12px",
            }}>
              {bp.gapAnalysis.map((g, i) => (
                <div key={i} style={{
                  fontSize: 12, lineHeight: 1.6,
                  color: g.startsWith("⚠") ? "#FF9500" : "#34C759",
                }}>{g}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
          🛡️ Compliance — Regulatory Readiness
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>
          Structural compliance blueprints for major regulatory frameworks.
          These are architectural models — not legal certifications.
        </p>
      </div>

      {/* Disclaimer banner */}
      <div style={{
        background: "rgba(255,149,0,0.1)", border: "1px solid rgba(255,149,0,0.25)",
        borderRadius: 10, padding: "12px 14px",
      }}>
        <p style={{ fontSize: 12, color: "#FF9500", margin: 0, lineHeight: 1.5 }}>
          ⚠️ All compliance content is a structural blueprint only. It does not constitute legal advice, certification,
          or regulatory approval. Real compliance requires certified legal, compliance, and security professionals.
        </p>
      </div>

      {/* Overall stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Frameworks", value: stats.totalBlueprints, color: "#6366f1" },
          { label: "Clauses", value: stats.totalClauses, color: "#007AFF" },
          { label: "Mapped", value: stats.mapped, color: "#34C759" },
          { label: "Gaps", value: stats.gaps, color: "#FF3B30" },
        ].map(s => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, padding: "12px", textAlign: "center",
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Blueprint list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {blueprints.map(bp => {
          const mapped  = bp.clauses.filter(c => c.mockStatus === "mapped").length;
          const total   = bp.clauses.length;
          const score   = total ? Math.round((mapped / total) * 100) : 0;
          return (
            <button
              key={bp.id}
              onClick={() => setSelectedId(bp.id)}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "14px 16px", cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 14,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,102,241,0.3)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{bp.framework}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                    background: bp.status === "blueprint-ready" ? "rgba(52,199,89,0.2)" : "rgba(255,149,0,0.2)",
                    color: bp.status === "blueprint-ready" ? "#34C759" : "#FF9500",
                  }}>{bp.status}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{bp.domain} · {total} clauses</div>
                <div style={{ marginTop: 8, background: "rgba(255,255,255,0.06)", borderRadius: 3, height: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${score}%`, borderRadius: 3,
                    background: score >= 70 ? "#34C759" : score >= 40 ? "#FF9500" : "#FF3B30",
                  }} />
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: score >= 70 ? "#34C759" : score >= 40 ? "#FF9500" : "#FF3B30" }}>{score}%</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>ready</div>
              </div>
              <span style={{ fontSize: 16, color: "#64748b" }}>›</span>
            </button>
          );
        })}
      </div>

      {/* Active safety systems */}
      <div style={{
        background: "linear-gradient(135deg, rgba(52,199,89,0.08), rgba(99,102,241,0.08))",
        border: "1px solid rgba(52,199,89,0.2)", borderRadius: 12, padding: "16px",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#34C759", marginBottom: 10 }}>
          ACTIVE SAFETY SYSTEMS
        </div>
        {[
          { name: "Content Safety Filter", desc: "Blocks CBRN, CSAM, violence, malware, fraud at API layer", status: "ON" },
          { name: "Compliance Disclaimer Injector", desc: "Auto-appends healthcare/legal/financial notices to AI prompts", status: "ON" },
          { name: "GPT-5.2 Safety Training", desc: "Model-level safety as second layer on every AI call", status: "ON" },
          { name: "Auth-Protected Routes", desc: "All data routes require authenticated session", status: "ON" },
        ].map(s => (
          <div key={s.name} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: "#34C759", background: "rgba(52,199,89,0.15)",
              borderRadius: 4, padding: "2px 6px", marginTop: 1, flexShrink: 0,
            }}>{s.status}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{s.name}</div>
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main BrainHubApp ──────────────────────────────────────────────────────────
export function BrainHubApp() {
  const [view, setView]               = useState<HubView>("dashboard");
  const [stats, setStats]             = useState<PlatformStats | null>(null);
  const [activeEngine, setActiveEngine] = useState<EngineDefinition | null>(null);
  const [activeSeries, setActiveSeries] = useState<SeriesDefinition | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    fetchPlatformStats().then(setStats).catch(() => {});
  }, []);

  const byCategory   = getEnginesByCategory();
  const metaAgents   = byCategory["meta-agent"] ?? [];
  const otherEngines = ALL_ENGINES.filter(e => e.category !== "meta-agent");

  const filteredEngines = categoryFilter === "all"
    ? otherEngines
    : otherEngines.filter(e => e.category === categoryFilter);

  const categories = [
    { id: "all",          label: "All" },
    { id: "universal",    label: "Universal" },
    { id: "creative",     label: "Creative" },
    { id: "workflow",     label: "Workflow" },
    { id: "intelligence", label: "Intelligence" },
    { id: "integration",  label: "Integration" },
    { id: "platform",     label: "Platform" },
  ];

  const handleRunEngine = useCallback((engine: EngineDefinition) => {
    setActiveEngine(engine);
    setView("run");
  }, []);

  const handleRunSeries = useCallback((series: SeriesDefinition) => {
    setActiveSeries(series);
    setView("series-run");
  }, []);

  // ── Run panel ──
  if (view === "run" && activeEngine) {
    return (
      <div style={{ padding: "0 24px 24px", overflowY: "auto", height: "100%" }}>
        <RunPanel engine={activeEngine} onBack={() => { setView("engines"); setActiveEngine(null); }} />
      </div>
    );
  }

  // ── Series run panel ──
  if (view === "series-run" && activeSeries) {
    return (
      <div style={{ padding: "0 24px 24px", overflowY: "auto", height: "100%" }}>
        <SeriesRunPanel series={activeSeries} onBack={() => { setView("series"); setActiveSeries(null); }} />
      </div>
    );
  }

  const NAV_ITEMS: { id: HubView; label: string; icon: string }[] = [
    { id: "dashboard",  label: "Dashboard",   icon: "📊" },
    { id: "engines",    label: "Engines",     icon: "⚙️" },
    { id: "agents",     label: "Meta-Agents", icon: "🤖" },
    { id: "series",     label: "Series",      icon: "🧬" },
    { id: "compliance", label: "Compliance",  icon: "🛡️" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Nav */}
      <div style={{
        display: "flex", gap: 2, padding: "12px 24px 0",
        borderBottom: "1px solid rgba(255,255,255,0.08)", overflowX: "auto",
      }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            style={{
              background: view === item.id ? "rgba(99,102,241,0.2)" : "transparent",
              border: view === item.id ? "1px solid rgba(99,102,241,0.4)" : "1px solid transparent",
              borderRadius: "8px 8px 0 0", padding: "8px 14px",
              color: view === item.id ? "#818cf8" : "#94a3b8",
              cursor: "pointer", fontSize: 12, fontWeight: view === item.id ? 600 : 400,
              display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
            }}
          >
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, paddingBottom: 12, flexShrink: 0 }}>
          <StatusDot active={true} />
          <span style={{ fontSize: 11, color: "#34C759", fontWeight: 600, whiteSpace: "nowrap" }}>ALL SYSTEMS ACTIVE</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>

        {/* ── DASHBOARD ── */}
        {view === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
                ⚡ Brain Hub — Capability Center
              </h2>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>
                {ALL_ENGINES.length} engines · 6 meta-agents · {ALL_SERIES.length} series · real AI on every activation
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
              <StatCard icon="⚙️" label="Active Engines"  value={stats?.engines ?? ALL_ENGINES.length} color="#6366f1" />
              <StatCard icon="🤖" label="Meta-Agents"     value={stats?.agents ?? 6}                   color="#FF9500" />
              <StatCard icon="🧬" label="Series"          value={stats?.series ?? ALL_SERIES.length}    color="#BF5AF2" />
              <StatCard icon="📁" label="Projects"        value={stats?.projects ?? "—"}                color="#007AFF" />
              <StatCard icon="📄" label="Documents"       value={stats?.documents ?? "—"}               color="#34C759" />
              <StatCard icon="👥" label="People"          value={stats?.people ?? "—"}                  color="#FF2D55" />
            </div>

            {/* Quick-launch */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>🚀 Quick-Launch Engines</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 8 }}>
                {ALL_ENGINES
                  .filter(e => ["BrainGen", "InfiniteExpansionEngine", "UniversalStrategyEngine", "UniversalCreativeEngine", "ORACLE", "FORGE"].includes(e.id))
                  .map(engine => (
                    <EngineCard key={engine.id} engine={engine} onRun={handleRunEngine} compact />
                  ))}
              </div>
            </div>

            {/* Meta-agents overview */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>🤖 Meta-Agents</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 8 }}>
                {metaAgents.map(agent => (
                  <div
                    key={agent.id}
                    onClick={() => handleRunEngine(agent)}
                    style={{
                      background: `${agent.color}11`, border: `1px solid ${agent.color}33`,
                      borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{agent.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: agent.color }}>{agent.name}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {agent.capabilities[0]}
                      </div>
                    </div>
                    <StatusDot active={true} />
                  </div>
                ))}
              </div>
            </div>

            {/* Series overview */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>🧬 Series — Click to Activate</h3>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ALL_SERIES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleRunSeries(s)}
                    style={{
                      background: `${s.color}11`, border: `1px solid ${s.color}33`,
                      borderRadius: 20, padding: "6px 14px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6, color: s.color,
                      fontSize: 12, fontWeight: 700, transition: "all 0.15s",
                    }}
                  >
                    <span>{s.icon}</span> {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform declaration */}
            <div style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(191,90,242,0.08))",
              border: "1px solid rgba(99,102,241,0.25)", borderRadius: 14, padding: "18px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", marginBottom: 8 }}>
                PLATFORM STATUS — FULL CAPABILITY ACTIVE
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  `✅ ${ALL_ENGINES.length} engines connected and active`,
                  "✅ 6 Meta-Agents (Oracle, Forge, Nexus, Sentinel, Pulse, Vector) operational",
                  `✅ ${ALL_SERIES.length} Series implemented — each runs member engines sequentially`,
                  "✅ Real AI generation (GPT-5.2 streaming) on every engine and agent",
                  "✅ Content safety filter active on all AI routes",
                  "✅ All outputs saveable to project documents",
                  "✅ 16 database tables — real persistent data",
                ].map(item => (
                  <div key={item} style={{ fontSize: 12, color: "#94a3b8" }}>{item}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ENGINES ── */}
        {view === "engines" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
                ⚙️ Engines ({otherEngines.length})
              </h2>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    style={{
                      background: categoryFilter === cat.id ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                      border: categoryFilter === cat.id ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 20, padding: "4px 12px", cursor: "pointer",
                      color: categoryFilter === cat.id ? "#818cf8" : "#94a3b8",
                      fontSize: 11, fontWeight: 600,
                    }}
                  >{cat.label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {filteredEngines.map(engine => (
                <EngineCard key={engine.id} engine={engine} onRun={handleRunEngine} />
              ))}
            </div>
          </div>
        )}

        {/* ── META-AGENTS ── */}
        {view === "agents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
                🤖 Meta-Agents — 6 Specialized AI Systems
              </h2>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>
                Each Meta-Agent runs on real GPT-5.2 streaming with a specialized system identity.
                Click any agent to activate it with your own topic and context.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 14 }}>
              {metaAgents.map(agent => (
                <div key={agent.id} style={{
                  background: `${agent.color}08`, border: `1px solid ${agent.color}33`,
                  borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, background: `${agent.color}22`,
                      border: `1px solid ${agent.color}44`, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 24,
                    }}>{agent.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: agent.color }}>{agent.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Meta-Agent · Always active</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <StatusDot active={true} />
                      <span style={{ fontSize: 9, color: "#34C759" }}>ACTIVE</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{agent.description}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {agent.capabilities.map(cap => (
                      <span key={cap} style={{
                        fontSize: 10, background: `${agent.color}15`, borderRadius: 20,
                        padding: "3px 9px", color: agent.color,
                      }}>{cap}</span>
                    ))}
                  </div>
                  {ENGINE_HINTS[agent.id] && (
                    <div style={{ fontSize: 11, color: "#4f5a6e", fontStyle: "italic" }}>
                      {ENGINE_HINTS[agent.id].example}
                    </div>
                  )}
                  <button
                    onClick={() => handleRunEngine(agent)}
                    style={{
                      background: agent.color, border: "none", borderRadius: 10,
                      padding: "10px 16px", color: "#fff", fontSize: 13, fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >▶ Activate {agent.name}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SERIES ── */}
        {view === "series" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
                🧬 Series — {ALL_SERIES.length} Multi-Engine Workflows
              </h2>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>
                Each series runs its member engines in sequence, producing a combined multi-perspective output.
                Click "Activate" to run the full series against your topic.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
              {ALL_SERIES.map(series => (
                <div key={series.id} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14, padding: "18px", display: "flex", flexDirection: "column", gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, background: `${series.color}22`,
                      border: `1px solid ${series.color}44`, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 22, flexShrink: 0,
                    }}>{series.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: series.color }}>{series.name}</span>
                        <span style={{
                          fontSize: 10, background: `${series.color}22`, color: series.color,
                          borderRadius: 4, padding: "2px 7px", fontWeight: 700,
                        }}>{series.symbol}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {series.engines.length} engines run in sequence
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{series.description}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(series.capabilities ?? []).map(cap => (
                      <span key={cap} style={{
                        fontSize: 10, background: "rgba(255,255,255,0.06)", borderRadius: 4,
                        padding: "2px 6px", color: "#64748b",
                      }}>{cap}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {series.engines.map(eid => (
                      <span key={eid} style={{
                        fontSize: 10, background: `${series.color}11`, borderRadius: 4,
                        padding: "2px 6px", color: series.color, border: `1px solid ${series.color}33`,
                      }}>{eid}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleRunSeries(series)}
                    style={{
                      background: series.color, border: "none", borderRadius: 10,
                      padding: "10px 16px", color: "#fff", fontSize: 13, fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {series.icon} Activate {series.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── COMPLIANCE ── */}
        {view === "compliance" && <CompliancePanel />}

      </div>
    </div>
  );
}
