import React, { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";

// ─── Project Configs ──────────────────────────────────────────────────────────
interface ProjectConfig {
  name: string;
  icon: string;
  color: string;
  gradient: string;
  tagline: string;
  description: string;
  industry: string;
  mode: "DEMO" | "FUTURE" | "TEST";
  stats: { label: string; value: string }[];
  features: { icon: string; name: string; desc: string }[];
  marketingItems: { type: string; title: string; desc: string }[];
  documents: { icon: string; name: string; type: string; pages: string }[];
  sections: string[];
}

const PROJECT_CONFIGS: Record<string, ProjectConfig> = {
  "healthcare-legal-safe": {
    name: "Healthcare System – Legal Safe",
    icon: "🏥",
    color: "#34C759",
    gradient: "from-green-600 via-teal-600 to-emerald-700",
    tagline: "Clinical workflow platform for modern healthcare teams",
    description: "A fully simulated healthcare operations platform demonstrating patient management, clinical workflows, AI-assisted documentation, and care coordination. All content is mock, non-clinical, and for demonstration purposes only.",
    industry: "Healthcare",
    mode: "DEMO",
    stats: [
      { label: "Mock Patients", value: "247" },
      { label: "Daily Workflows", value: "1,834" },
      { label: "AI Assists / Day", value: "412" },
      { label: "Mock Documents", value: "89" },
    ],
    features: [
      { icon: "👤", name: "Patient Management", desc: "Centralized patient records with mock vitals, orders, and clinical notes — fully simulated" },
      { icon: "📊", name: "Clinical Dashboard", desc: "Real-time overview of patient status, workflow queue, and team activity (mock)" },
      { icon: "🤖", name: "AI Documentation", desc: "Assisted note-taking, discharge summaries, and care plan generation — conceptual only" },
      { icon: "📋", name: "Order Management", desc: "Lab, medication, and imaging orders with mock approval workflows" },
      { icon: "📝", name: "Nursing Notes", desc: "Shift handover, observation logs, and care coordination — all simulated" },
      { icon: "🔗", name: "Integration Layer", desc: "Conceptual EHR, LIS, and PACS integration mapping — future implementation" },
    ],
    marketingItems: [
      { type: "Landing Page", title: "Healthcare System Homepage", desc: "Full-width hero showcasing patient-first design philosophy and AI-assisted clinical workflows" },
      { type: "One-Pager", title: "Clinical Efficiency Report", desc: "Mock statistics on workflow reduction, documentation time savings, and staff satisfaction" },
      { type: "Email Campaign", title: "Healthcare Leadership Series", desc: "3-email nurture sequence for CMOs and CIOs — built around operational efficiency" },
      { type: "Case Study", title: "Community Hospital Demo Case", desc: "Fictional 500-bed facility implementation story with mock outcome data" },
    ],
    documents: [
      { icon: "📋", name: "Clinical Workflow Guide", type: "PDF Guide", pages: "24 pages" },
      { icon: "📊", name: "Platform Overview Deck", type: "Presentation", pages: "18 slides" },
      { icon: "📝", name: "Admin Configuration Manual", type: "Manual", pages: "52 pages" },
      { icon: "📄", name: "Mock Compliance Checklist", type: "Checklist", pages: "8 pages" },
    ],
    sections: ["Overview", "Features", "Marketing", "Documents", "Demo"],
  },
  "healthcare-mach1": {
    name: "Healthcare System – Mach 1",
    icon: "🔬",
    color: "#BF5AF2",
    gradient: "from-purple-700 via-violet-700 to-indigo-800",
    tagline: "Next-generation clinical intelligence — future-ready architecture",
    description: "A forward-looking conceptual blueprint for an advanced healthcare AI system. This is a vision platform — all capabilities described are future targets requiring real experts, legal review, and clinical validation. Clearly labeled as FUTURE/MOCK throughout.",
    industry: "Healthcare",
    mode: "FUTURE",
    stats: [
      { label: "Conceptual Modules", value: "14" },
      { label: "AI Engines (Future)", value: "7" },
      { label: "Integration Points", value: "32" },
      { label: "Research Papers", value: "12" },
    ],
    features: [
      { icon: "🧠", name: "Predictive Intelligence", desc: "Conceptual AI that anticipates patient deterioration — requires real clinical data and expert validation" },
      { icon: "🔬", name: "Genomics Layer", desc: "Future integration point for genomic data interpretation — FUTURE placeholder only" },
      { icon: "📡", name: "Real-Time Monitoring", desc: "Conceptual IoT sensor network for continuous patient monitoring — requires real hardware" },
      { icon: "🌐", name: "Population Health", desc: "Community-level health trend modeling — conceptual only, requires real epidemiological data" },
      { icon: "🤝", name: "Interoperability", desc: "Universal FHIR/HL7 integration layer — future implementation, requires real EHR agreements" },
      { icon: "🛡️", name: "Compliance Engine", desc: "Automated HIPAA, GDPR, and regulatory compliance — requires real legal and compliance experts" },
    ],
    marketingItems: [
      { type: "Vision Deck", title: "Mach 1 Clinical Vision", desc: "Executive presentation on the future of AI-powered clinical operations" },
      { type: "Whitepaper", title: "Next-Gen EHR Architecture", desc: "Technical conceptual overview of the proposed system architecture (structural only)" },
      { type: "Roadmap", title: "2025–2027 Platform Roadmap", desc: "Phased implementation plan from mock to live clinical operations" },
      { type: "Research Brief", title: "AI in Clinical Decision Support", desc: "Curated conceptual research summary — not medical advice" },
    ],
    documents: [
      { icon: "🗺️", name: "System Architecture Overview", type: "Whitepaper", pages: "38 pages" },
      { icon: "📊", name: "Vision & Scope Deck", type: "Presentation", pages: "22 slides" },
      { icon: "⚠️", name: "Risk & Compliance Notes", type: "Advisory", pages: "14 pages" },
      { icon: "🔭", name: "Future Capabilities Matrix", type: "Reference", pages: "10 pages" },
    ],
    sections: ["Overview", "Vision", "Architecture", "Roadmap", "Documents"],
  },
  "monetary-legal-safe": {
    name: "Monetary System – Legal Safe",
    icon: "💳",
    color: "#007AFF",
    gradient: "from-blue-600 via-blue-700 to-indigo-700",
    tagline: "Financial operations platform — structured, safe, and mock-only",
    description: "A fully simulated financial operations platform demonstrating pricing models, revenue tracking, and marketplace management. All figures are fictional and non-operational. No real financial logic, banking, or transaction processing.",
    industry: "Finance",
    mode: "DEMO",
    stats: [
      { label: "Mock Revenue", value: "$3,240" },
      { label: "Active Plans", value: "3" },
      { label: "Marketplace Items", value: "24" },
      { label: "Mock Users", value: "14" },
    ],
    features: [
      { icon: "💰", name: "Revenue Dashboard", desc: "Mock revenue tracking by source — creator licenses, packages, and digital products" },
      { icon: "📦", name: "Plans & Tiers", desc: "Starter, Pro, and Enterprise plan structures — mock descriptions and benefit listings" },
      { icon: "🏪", name: "Marketplace", desc: "Structural layout for a digital products marketplace — fully illustrative" },
      { icon: "💳", name: "Virtual Wallets", desc: "Conceptual wallet system showing balance, payouts, and pending amounts (no real funds)" },
      { icon: "📊", name: "Revenue Reports", desc: "Mock charts and tables showing revenue breakdown by source and time period" },
      { icon: "🤝", name: "Revenue Sharing", desc: "Configurable platform revenue share — adjustable from 0% to 50%, mock only" },
    ],
    marketingItems: [
      { type: "Pricing Page", title: "Platform Pricing Overview", desc: "Clean pricing page for all three tiers with feature comparison table" },
      { type: "Revenue Report", title: "Q4 Creator Earnings Summary", desc: "Mock quarterly earnings report for creator community — fictional figures" },
      { type: "Email Series", title: "Monetization Mastery", desc: "5-email course on building sustainable revenue with the platform (mock)" },
      { type: "Case Study", title: "Creator Revenue Story", desc: "Fictional creator journey from $0 to $3,240/mo using the platform" },
    ],
    documents: [
      { icon: "💰", name: "Revenue Share Agreement", type: "Template", pages: "6 pages" },
      { icon: "📋", name: "Platform Pricing Guide", type: "Reference", pages: "12 pages" },
      { icon: "📊", name: "Earnings Dashboard Manual", type: "Guide", pages: "18 pages" },
      { icon: "📄", name: "Marketplace Listing Standards", type: "Policy", pages: "8 pages" },
    ],
    sections: ["Overview", "Revenue", "Marketplace", "Marketing", "Documents"],
  },
  "monetary-mach1": {
    name: "Monetary System – Mach 1",
    icon: "🚀",
    color: "#FF9500",
    gradient: "from-orange-500 via-amber-600 to-yellow-600",
    tagline: "Future financial architecture — the next evolution of creator economics",
    description: "A vision-forward conceptual blueprint for a full creator economy platform. All financial flows, integrations, and capabilities described are future targets requiring real financial experts, legal compliance, and regulatory approval before any real implementation.",
    industry: "Finance",
    mode: "FUTURE",
    stats: [
      { label: "Future Modules", value: "11" },
      { label: "Payment Partners", value: "4+" },
      { label: "Conceptual APIs", value: "18" },
      { label: "Currency Support", value: "12+" },
    ],
    features: [
      { icon: "🌐", name: "Global Payments", desc: "Conceptual Stripe, PayPal, and Square integration — future implementation requiring real accounts" },
      { icon: "📈", name: "Dynamic Pricing", desc: "AI-driven pricing optimization — FUTURE concept requiring real market data" },
      { icon: "🏦", name: "Banking Layer", desc: "Conceptual banking API connections — requires real financial institution agreements" },
      { icon: "💹", name: "Investment Dashboard", desc: "Portfolio tracking and growth metrics — FUTURE, requires real financial data" },
      { icon: "🔐", name: "Compliance Engine", desc: "PCI-DSS, AML, and KYC compliance layer — requires real legal and compliance expertise" },
      { icon: "⚡", name: "Instant Payouts", desc: "Real-time creator payout system — FUTURE, requires real payment processor" },
    ],
    marketingItems: [
      { type: "Vision Deck", title: "Creator Economy 2.0", desc: "The future of platform-native financial infrastructure for independent creators" },
      { type: "Whitepaper", title: "Decentralized Creator Revenue", desc: "Conceptual architecture for distributed creator monetization" },
      { type: "Roadmap", title: "Financial Platform Roadmap", desc: "Path from mock to real financial operations — phased and compliance-first" },
      { type: "Partner Brief", title: "Payment Provider Integration Guide", desc: "Structural overview of planned payment processor partnerships" },
    ],
    documents: [
      { icon: "🗺️", name: "Financial Architecture Blueprint", type: "Whitepaper", pages: "42 pages" },
      { icon: "⚠️", name: "Regulatory Compliance Notes", type: "Advisory", pages: "20 pages" },
      { icon: "🚀", name: "Go-to-Market Roadmap", type: "Strategy", pages: "16 pages" },
      { icon: "🤝", name: "Payment Partner Overview", type: "Reference", pages: "10 pages" },
    ],
    sections: ["Overview", "Vision", "Payments", "Roadmap", "Documents"],
  },
  "marketing-hub": {
    name: "Marketing Hub",
    icon: "📣",
    color: "#FF2D55",
    gradient: "from-pink-600 via-rose-600 to-red-600",
    tagline: "Complete marketing engine — campaigns, content, and growth built in",
    description: "A full-featured marketing operations platform covering brand campaigns, email marketing, social content, ad creative, and growth funnels. All campaigns are mock and illustrative. Outputs are staged for human review before any real publication.",
    industry: "Marketing",
    mode: "DEMO",
    stats: [
      { label: "Campaigns (Mock)", value: "18" },
      { label: "Email Open Rate", value: "34%" },
      { label: "Content Pieces", value: "127" },
      { label: "Growth Score", value: "87" },
    ],
    features: [
      { icon: "📧", name: "Email Campaigns", desc: "Multi-step email sequences with open tracking and personalization — mock data" },
      { icon: "📱", name: "Social Content", desc: "AI-generated social posts, captions, and visual briefs across all major platforms" },
      { icon: "🎯", name: "Paid Ads", desc: "Facebook, Google, and LinkedIn ad creative — copy and visual direction (mock)" },
      { icon: "📝", name: "Blog & SEO", desc: "Long-form content strategy and keyword targeting — conceptual framework" },
      { icon: "🌊", name: "Funnel Builder", desc: "Lead capture, nurture, and conversion flow mapping — fully illustrative" },
      { icon: "📊", name: "Analytics Dashboard", desc: "Campaign performance, conversion tracking, and ROI reporting — mock figures" },
    ],
    marketingItems: [
      { type: "Brand Guide", title: "Marketing Hub Brand Identity", desc: "Colors, typography, voice, and visual standards for all campaign assets" },
      { type: "Campaign Kit", title: "Q1 Growth Campaign Package", desc: "Full campaign with email, social, ad, and landing page — ready to stage" },
      { type: "Content Calendar", title: "30-Day Content Plan", desc: "Daily post schedule with topics, platforms, and mock performance predictions" },
      { type: "Ad Creative", title: "Paid Acquisition Bundle", desc: "6 Facebook ads, 4 Google display sets, and 3 LinkedIn sponsored posts" },
    ],
    documents: [
      { icon: "📋", name: "Brand Style Guide", type: "Guide", pages: "28 pages" },
      { icon: "📊", name: "Campaign Performance Report", type: "Report", pages: "16 pages" },
      { icon: "🗓️", name: "Content Calendar Template", type: "Template", pages: "4 pages" },
      { icon: "📧", name: "Email Sequence Playbook", type: "Playbook", pages: "22 pages" },
    ],
    sections: ["Overview", "Campaigns", "Content", "Analytics", "Documents"],
  },
  "operations-builder": {
    name: "Operations Builder",
    icon: "🏗️",
    color: "#5856D6",
    gradient: "from-indigo-600 via-purple-600 to-violet-700",
    tagline: "Business operations platform — workflows, teams, and systems unified",
    description: "A comprehensive operations management platform for organizing teams, workflows, processes, and business systems. All data is mock and structural. Designed for any industry — from construction to healthcare to retail.",
    industry: "Operations",
    mode: "TEST",
    stats: [
      { label: "Active Workflows", value: "34" },
      { label: "Team Members", value: "8" },
      { label: "Processes", value: "67" },
      { label: "Efficiency Score", value: "91%" },
    ],
    features: [
      { icon: "⚙️", name: "Workflow Engine", desc: "Visual workflow builder with triggers, conditions, and automated actions — mock" },
      { icon: "👥", name: "Team Management", desc: "Roles, permissions, task assignment, and performance tracking — all simulated" },
      { icon: "📋", name: "Process Library", desc: "Reusable process templates across departments and industries" },
      { icon: "📊", name: "Operations Dashboard", desc: "Real-time overview of active workflows, bottlenecks, and team capacity (mock)" },
      { icon: "🔔", name: "Alerts & Escalation", desc: "Automated escalation paths when workflows stall or deadlines approach" },
      { icon: "📝", name: "Documentation Hub", desc: "SOPs, runbooks, and process documentation — organized and searchable" },
    ],
    marketingItems: [
      { type: "Overview Page", title: "Operations Builder Platform", desc: "Full product landing page with feature showcase and demo request CTA" },
      { type: "Use Case", title: "Construction Operations Case", desc: "How a 12-person construction firm unified their workflows — fictional" },
      { type: "Email Series", title: "Operations Excellence Series", desc: "4-email sequence on operational maturity and workflow optimization" },
      { type: "ROI Calculator", title: "Operations ROI Estimator", desc: "Mock calculator showing time and cost savings from workflow automation" },
    ],
    documents: [
      { icon: "📋", name: "Platform Implementation Guide", type: "Guide", pages: "34 pages" },
      { icon: "⚙️", name: "Workflow Templates Library", type: "Templates", pages: "48 pages" },
      { icon: "👥", name: "Team Onboarding Manual", type: "Manual", pages: "20 pages" },
      { icon: "📊", name: "Operations Maturity Assessment", type: "Assessment", pages: "12 pages" },
    ],
    sections: ["Overview", "Workflows", "Teams", "Marketing", "Documents"],
  },
};

// ─── Helper Components ────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-center">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-white/70 mt-1 font-medium">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, name, desc }: { icon: string; name: string; desc: string }) {
  return (
    <div className="bg-background rounded-2xl border border-border/50 p-5 hover:border-primary/20 hover:shadow-md transition-all group">
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform inline-block">{icon}</div>
      <h3 className="font-bold text-[14px] text-foreground mb-1.5">{name}</h3>
      <p className="text-[12px] text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

type SectionId = "overview" | "features" | "marketing" | "documents" | "demo" | "vision" | "architecture" | "roadmap" | "revenue" | "marketplace" | "campaigns" | "content" | "analytics" | "payments" | "workflows" | "teams";

// ─── Main ProjectPage ─────────────────────────────────────────────────────────
export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [docDownloaded, setDocDownloaded] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const projectId = params.projectId ?? "";
  const config = PROJECT_CONFIGS[projectId];

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-background text-foreground p-8">
        <p className="text-5xl">🔍</p>
        <h1 className="text-2xl font-bold">Project Not Found</h1>
        <p className="text-muted-foreground">No project found for "{projectId}"</p>
        <button onClick={() => navigate("/")}
          className="mt-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          ← Back to CreateAI OS
        </button>
      </div>
    );
  }

  const modeColor = {
    DEMO: "bg-green-500/20 text-green-200 border-green-400/30",
    TEST: "bg-orange-500/20 text-orange-200 border-orange-400/30",
    FUTURE: "bg-purple-500/20 text-purple-200 border-purple-400/30",
  }[config.mode];

  const handleSectionClick = (section: string) => {
    setActiveSection(section.toLowerCase() as SectionId);
    contentRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const downloadDoc = (name: string) => {
    setDocDownloaded(name);
    setTimeout(() => setDocDownloaded(null), 2500);
  };

  const openStandalone = () => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    window.open(`${base}/standalone/${projectId}`, "_blank", "noopener");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Top Nav Bar ── */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium flex-shrink-0">
            <span>←</span>
            <span className="hidden sm:inline">CreateAI OS</span>
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl">{config.icon}</span>
            <span className="font-bold text-[14px] text-foreground truncate">{config.name}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 hidden sm:inline-flex ${modeColor}`}>
              {config.mode}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={openStandalone}
              className="text-[12px] font-bold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity hidden sm:block"
              style={{ backgroundColor: config.color }}
            >
              Open Full App ↗
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className={`bg-gradient-to-br ${config.gradient} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl">
                {config.icon}
              </div>
              <div>
                <p className="text-white/60 text-sm font-medium uppercase tracking-wider">{config.industry} Platform</p>
                <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border mt-1 ${modeColor}`}>
                  {config.mode} Mode
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4 text-white">
              {config.name}
            </h1>
            <p className="text-xl sm:text-2xl text-white/80 font-light mb-6">
              {config.tagline}
            </p>
            <p className="text-white/70 text-base leading-relaxed mb-8 max-w-2xl">
              {config.description}
            </p>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => handleSectionClick("overview")}
                className="bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm">
                Explore Platform
              </button>
              <button onClick={openStandalone}
                className="bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/30 transition-colors text-sm">
                Open Full App ↗
              </button>
              <button onClick={() => handleSectionClick("documents")}
                className="bg-white/10 border border-white/20 text-white/80 font-medium px-6 py-3 rounded-xl hover:bg-white/20 transition-colors text-sm">
                View Documents
              </button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {config.stats.map(stat => (
                <StatCard key={stat.label} {...stat} color={config.color} />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Section Navigation ── */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {config.sections.map(section => (
              <button key={section}
                onClick={() => handleSectionClick(section)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeSection === section.toLowerCase()
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}>
                {section}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

        {/* Overview Section */}
        {(activeSection === "overview" || activeSection === "vision") && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Platform Overview</span>
                  <h2 className="text-3xl font-black text-foreground mt-2">
                    {config.mode === "FUTURE" ? "The Vision" : "What This Platform Does"}
                  </h2>
                </div>
                <p className="text-muted-foreground text-base leading-relaxed">{config.description}</p>
                <div className="space-y-3">
                  {config.features.slice(0, 3).map(f => (
                    <div key={f.name} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                      <span className="text-xl mt-0.5 flex-shrink-0">{f.icon}</span>
                      <div>
                        <p className="font-semibold text-[13px] text-foreground">{f.name}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => handleSectionClick("features")}
                  className="text-primary font-semibold text-sm hover:underline">
                  View all {config.features.length} features →
                </button>
              </div>

              <div className="bg-gradient-to-br from-muted/50 to-muted rounded-3xl p-8 space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Platform At a Glance</p>
                <div className="space-y-3">
                  {[
                    { label: "Industry", value: config.industry },
                    { label: "Mode", value: config.mode },
                    { label: "Features", value: `${config.features.length} modules` },
                    { label: "Documents", value: `${config.documents.length} available` },
                    { label: "Marketing Assets", value: `${config.marketingItems.length} pieces` },
                    { label: "Status", value: config.mode === "FUTURE" ? "Design Phase" : "Demo Ready" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <span className="text-[13px] text-muted-foreground">{row.label}</span>
                      <span className="text-[13px] font-semibold text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>
                {config.mode === "FUTURE" && (
                  <div className="bg-purple-100 border border-purple-200 rounded-xl p-3 mt-4">
                    <p className="text-[11px] text-purple-700 font-medium">⚠️ This is a future-ready conceptual platform. All capabilities require real experts, legal approval, and proper implementation before any real-world use.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted/30 rounded-3xl p-8 text-center space-y-4">
              <h3 className="text-xl font-bold text-foreground">Ready to explore the full platform?</h3>
              <p className="text-muted-foreground text-sm">Open {config.name} as a full standalone application with its own navigation, AI assistant, and complete workflow system.</p>
              <button onClick={openStandalone}
                className="inline-flex items-center gap-2 font-bold px-8 py-3 rounded-xl text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: config.color }}>
                <span>Open Full App</span>
                <span>↗</span>
              </button>
            </div>
          </div>
        )}

        {/* Features Section */}
        {(activeSection === "features" || activeSection === "architecture" || activeSection === "workflows" || activeSection === "campaigns" || activeSection === "content" || activeSection === "revenue" || activeSection === "marketplace" || activeSection === "payments" || activeSection === "teams") && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Platform Modules</span>
              <h2 className="text-3xl font-black text-foreground mt-2">
                {config.mode === "FUTURE" ? "Planned Capabilities" : "Core Features"}
              </h2>
              <p className="text-muted-foreground mt-3">
                {config.mode === "FUTURE"
                  ? "These capabilities are conceptual targets. Each requires real expert design, legal review, and technical implementation."
                  : "Every module is built for demonstration and ideation. All data is mock and outputs are staged for review."}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {config.features.map(f => <FeatureCard key={f.name} {...f} />)}
            </div>
            {config.mode === "FUTURE" && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 text-center">
                <p className="text-[13px] text-purple-800 font-medium">All features above are conceptual. Real implementation requires qualified experts, legal agreements, and proper technical development.</p>
              </div>
            )}
          </div>
        )}

        {/* Marketing Section */}
        {activeSection === "marketing" && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Marketing Assets</span>
              <h2 className="text-3xl font-black text-foreground mt-2">Campaign-Ready Content</h2>
              <p className="text-muted-foreground mt-3">AI-generated marketing assets for {config.name}. All content is staged for human review before any real publication.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {config.marketingItems.map(item => (
                <div key={item.title} className="bg-background rounded-2xl border border-border/50 p-6 hover:border-primary/20 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wide">{item.type}</span>
                  </div>
                  <h3 className="font-bold text-[15px] text-foreground mb-2">{item.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">{item.desc}</p>
                  <div className="flex gap-2">
                    <button className="text-[12px] font-semibold text-primary hover:underline">Preview →</button>
                    <button className="text-[12px] font-semibold text-muted-foreground hover:text-foreground ml-auto">Stage for Review</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
              <p className="text-[12px] text-orange-700">All marketing content is AI-generated and mock. Stage for review before any real-world use. No content is published automatically.</p>
            </div>
          </div>
        )}

        {/* Analytics/Demo section */}
        {(activeSection === "analytics" || activeSection === "demo") && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Live Demo</span>
              <h2 className="text-3xl font-black text-foreground mt-2">See It In Action</h2>
              <p className="text-muted-foreground mt-3">Explore mock analytics and a simulated live environment. All data is fictional.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {config.stats.map(stat => (
                <div key={stat.label} className="bg-background rounded-2xl border border-border/50 p-5 text-center hover:border-primary/20 transition-colors">
                  <p className="text-2xl font-black" style={{ color: config.color }}>{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-muted/30 rounded-3xl p-8 text-center space-y-4">
              <p className="text-4xl">🎬</p>
              <h3 className="text-xl font-bold">Ready to see the full interactive demo?</h3>
              <p className="text-muted-foreground text-sm">Launch {config.name} as a standalone app with full navigation, AI assistant, and complete interactive workflows.</p>
              <button onClick={openStandalone}
                className="inline-flex items-center gap-2 font-bold px-8 py-3 rounded-xl text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: config.color }}>
                Launch Full Demo ↗
              </button>
            </div>
          </div>
        )}

        {/* Roadmap section */}
        {activeSection === "roadmap" && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Platform Roadmap</span>
              <h2 className="text-3xl font-black text-foreground mt-2">The Path Forward</h2>
              <p className="text-muted-foreground mt-3">A phased approach from conceptual design to real-world deployment — each phase requiring expert review and compliance sign-off.</p>
            </div>
            <div className="space-y-4 max-w-2xl mx-auto">
              {[
                { phase: "Phase 1", label: "Conceptual Design", status: "COMPLETE", desc: "Platform architecture, feature mapping, and structural scaffolding — all mock." },
                { phase: "Phase 2", label: "Demo Environment", status: "ACTIVE", desc: "Interactive demonstration environment with mock data and AI-assisted workflows." },
                { phase: "Phase 3", label: "Expert Review", status: "FUTURE", desc: "Qualified domain experts review all workflows, compliance requirements, and edge cases." },
                { phase: "Phase 4", label: "Legal & Compliance", status: "FUTURE", desc: "Full legal, regulatory, and compliance review before any real-world integration." },
                { phase: "Phase 5", label: "Live Launch", status: "FUTURE", desc: "Real data connections, live integrations, and production deployment under proper oversight." },
              ].map(p => (
                <div key={p.phase} className="flex gap-4 p-5 bg-background rounded-2xl border border-border/50">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${p.status === "COMPLETE" ? "bg-green-500" : p.status === "ACTIVE" ? "bg-blue-500" : "bg-muted-foreground/30"}`} />
                    <div className="w-0.5 flex-1 bg-border/50 last:hidden" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-[14px] text-foreground">{p.phase}: {p.label}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === "COMPLETE" ? "bg-green-100 text-green-700" : p.status === "ACTIVE" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>{p.status}</span>
                    </div>
                    <p className="text-[13px] text-muted-foreground">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Section */}
        {activeSection === "documents" && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Document Library</span>
              <h2 className="text-3xl font-black text-foreground mt-2">Platform Documents</h2>
              <p className="text-muted-foreground mt-3">Download guides, presentations, and reference documents for {config.name}. All documents are mock and for demonstration.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {config.documents.map(doc => (
                <div key={doc.name} className="bg-background rounded-2xl border border-border/50 p-6 hover:border-primary/20 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">{doc.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[14px] text-foreground mb-1">{doc.name}</h3>
                      <p className="text-[12px] text-muted-foreground">{doc.type} · {doc.pages}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadDoc(doc.name)}
                    className="mt-4 w-full py-2.5 rounded-xl text-[13px] font-semibold border border-border/50 text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {docDownloaded === doc.name ? "✓ Downloaded (Mock)" : "↓ Download (Mock)"}
                  </button>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
              <p className="text-[12px] text-blue-700">All documents are mock and for demonstration purposes only. No real content is delivered.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <p className="font-bold text-[14px] text-foreground">{config.name}</p>
                <p className="text-[11px] text-muted-foreground">Built on CreateAI Brain · All content is mock</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate("/")}
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground border border-border/50 px-4 py-2 rounded-xl transition-colors">
                ← Back to OS
              </button>
              <button
                onClick={openStandalone}
                className="text-[13px] font-bold text-white px-5 py-2 rounded-xl hover:opacity-90 transition-opacity"
                style={{ backgroundColor: config.color }}>
                Open Full App ↗
              </button>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-border/30 text-center">
            <p className="text-[11px] text-muted-foreground">
              CreateAI Brain · Built by Sara Stadler · All platform content is mock, conceptual, and for demonstration purposes only.
              {config.mode === "FUTURE" && " This is a future-ready design — not operational."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
