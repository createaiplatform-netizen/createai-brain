import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { PresentationLayout, PresentationSection } from "@/components/presentation/PresentationLayout";
import {
  FeatureGrid, FeatureItem, SectionContainer, Timeline, Stepper, StepItem,
  RoadmapWidget, RoadmapPhase, FAQWidget, FAQItem,
  TestimonialBlock, TestimonialItem, CardWidget, ImagePlaceholder, SafetyNotice,
} from "@/components/widgets/WidgetLibrary";
import { TourStep } from "@/components/presentation/AITourMode";

// ─── Project Configs (static per-project data) ────────────────────────────────
interface ProjectConfig {
  name: string; icon: string; color: string; gradient: string;
  tagline: string; description: string; industry: string;
  mode: "DEMO" | "FUTURE" | "TEST";
  safetyNote?: string;
  stats: { label: string; value: string }[];
  features: FeatureItem[];
  marketingItems: { type: string; title: string; desc: string }[];
  documents: { icon: string; name: string; type: string; pages: string }[];
  testimonials: TestimonialItem[];
  faq: FAQItem[];
  roadmap: RoadmapPhase[];
  tourSteps: TourStep[];
  sections: PresentationSection[];
}

const PROJECT_CONFIGS: Record<string, ProjectConfig> = {
  "healthcare-legal-safe": {
    name: "Healthcare System – Legal Safe", icon: "🏥", color: "#34C759",
    gradient: "from-green-600 via-teal-600 to-emerald-700",
    tagline: "Clinical workflow platform for modern healthcare teams",
    description: "A fully simulated healthcare operations platform demonstrating patient management, clinical workflows, AI-assisted documentation, and care coordination. All content is mock, non-clinical, and for demonstration purposes only.",
    industry: "Healthcare", mode: "DEMO",
    safetyNote: "All healthcare content is mock and non-clinical. Not for real medical, diagnostic, or treatment decisions. Always consult qualified healthcare professionals.",
    stats: [
      { label: "Mock Patients", value: "247" }, { label: "Daily Workflows", value: "1,834" },
      { label: "AI Assists / Day", value: "412" }, { label: "Mock Documents", value: "89" },
    ],
    features: [
      { icon: "👤", name: "Patient Management", desc: "Centralized patient records with mock vitals, orders, and clinical notes — fully simulated" },
      { icon: "📊", name: "Clinical Dashboard", desc: "Real-time overview of patient status, workflow queue, and team activity (mock data)" },
      { icon: "🤖", name: "AI Documentation", desc: "Assisted note-taking, discharge summaries, and care plan generation — conceptual only" },
      { icon: "📋", name: "Order Management", desc: "Lab, medication, and imaging orders with mock approval workflows" },
      { icon: "📝", name: "Nursing Notes", desc: "Shift handover, observation logs, and care coordination — all simulated" },
      { icon: "🔗", name: "Integration Layer", desc: "Conceptual EHR, LIS, and PACS integration mapping — future implementation only" },
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
    testimonials: [
      { quote: "This demo completely changed how our team envisions the future of clinical documentation. The workflow engine is exactly what we need.", name: "Dr. Sarah M.", role: "CMO, Regional Hospital (Mock)" },
      { quote: "Finally a platform that puts the care team first. The AI assistant is smart and clearly knows when to stay out of the way.", name: "James R.", role: "Director of Nursing (Mock)" },
      { quote: "We used this demo to align our board on digital health investment. It's polished, clear, and professional.", name: "Priya K.", role: "Healthcare CIO (Mock)" },
    ],
    faq: [
      { q: "Is this a real EHR system?", a: "No. This is a demonstration platform with entirely mock data. It cannot connect to real patient records, clinical systems, or medical devices." },
      { q: "Can I use this for real clinical decisions?", a: "Absolutely not. All content is for demonstration only. Real clinical decisions require qualified healthcare professionals and certified clinical software." },
      { q: "What does DEMO mode mean?", a: "DEMO mode shows a fully functional but entirely simulated experience. All patients, vitals, orders, and notes are fictional." },
      { q: "Is there a LIVE mode?", a: "LIVE mode is a future placeholder. Real live deployment requires EHR agreements, HIPAA compliance, and expert clinical and technical review." },
      { q: "Who built this?", a: "This platform was created by the CreateAI Brain — a demo and conceptual design tool by Sara Stadler." },
    ],
    roadmap: [
      { phase: "Phase 1", label: "Demo Environment", description: "Full interactive demo with mock patients, clinical workflows, and AI documentation.", status: "complete" },
      { phase: "Phase 2", label: "Expert Review", description: "Clinical experts, compliance specialists, and HIPAA counsel review all workflows.", status: "active" },
      { phase: "Phase 3", label: "Pilot Design", description: "Design a controlled pilot with a real healthcare organization — structure only.", status: "future" },
      { phase: "Phase 4", label: "Live Deployment", description: "Real EHR integration, certified data handling, and full compliance sign-off.", status: "future" },
    ],
    tourSteps: [
      { title: "Welcome to Healthcare System", body: "This is a fully simulated healthcare operations platform. Navigate sections using the menu bar above." },
      { title: "Explore the Features", body: "The Features section shows all 6 clinical modules — each fully simulated with mock data." },
      { title: "See the Marketing Assets", body: "The Marketing section shows campaign-ready materials generated for this platform — all staged for review." },
      { title: "Download Mock Documents", body: "The Documents section has 4 downloadable guides and specs — all mock and for reference." },
      { title: "Safety First", body: "This platform is for demonstration only. No real clinical decisions, no real patient data, no real medical guidance." },
    ],
    sections: [
      { id: "overview", label: "Overview", icon: "📋" },
      { id: "features", label: "Features", icon: "✨" },
      { id: "marketing", label: "Marketing", icon: "📣" },
      { id: "documents", label: "Documents", icon: "📄" },
      { id: "testimonials", label: "Testimonials", icon: "⭐" },
      { id: "faq", label: "FAQ", icon: "❓" },
      { id: "roadmap", label: "Roadmap", icon: "🗺️" },
    ],
  },

  "healthcare-mach1": {
    name: "Healthcare System – Mach 1", icon: "🔬", color: "#BF5AF2",
    gradient: "from-purple-700 via-violet-700 to-indigo-800",
    tagline: "Next-generation clinical intelligence — future-ready architecture",
    description: "A vision-forward conceptual blueprint for advanced healthcare AI. All capabilities require real experts, legal review, and clinical validation before any real-world implementation.",
    industry: "Healthcare", mode: "FUTURE",
    safetyNote: "All capabilities are conceptual. Real implementation requires qualified clinical experts, legal sign-off, and HIPAA compliance review.",
    stats: [
      { label: "Conceptual Modules", value: "14" }, { label: "AI Engines (Future)", value: "7" },
      { label: "Integration Points", value: "32" }, { label: "Research Areas", value: "12" },
    ],
    features: [
      { icon: "🧠", name: "Predictive Intelligence", desc: "Conceptual AI anticipating patient deterioration — requires real clinical data and expert validation" },
      { icon: "🔬", name: "Genomics Layer", desc: "Future integration point for genomic data interpretation — conceptual placeholder only" },
      { icon: "📡", name: "Real-Time Monitoring", desc: "Conceptual IoT sensor network for continuous patient monitoring — requires real hardware" },
      { icon: "🌐", name: "Population Health", desc: "Community-level health trend modeling — requires real epidemiological data and experts" },
      { icon: "🤝", name: "Interoperability", desc: "Universal FHIR/HL7 integration layer — future, requires real EHR organization agreements" },
      { icon: "🛡️", name: "Compliance Engine", desc: "Automated regulatory compliance layer — requires real legal and compliance expertise" },
    ],
    marketingItems: [
      { type: "Vision Deck", title: "Mach 1 Clinical Vision", desc: "Executive presentation on the future of AI-powered clinical operations" },
      { type: "Whitepaper", title: "Next-Gen EHR Architecture", desc: "Technical conceptual overview of the proposed system architecture" },
      { type: "Roadmap", title: "2025–2027 Platform Roadmap", desc: "Phased implementation plan from demo to live clinical operations" },
      { type: "Research Brief", title: "AI in Clinical Decision Support", desc: "Curated conceptual research summary — not medical advice" },
    ],
    documents: [
      { icon: "🗺️", name: "System Architecture Overview", type: "Whitepaper", pages: "38 pages" },
      { icon: "📊", name: "Vision & Scope Deck", type: "Presentation", pages: "22 slides" },
      { icon: "⚠️", name: "Risk & Compliance Notes", type: "Advisory", pages: "14 pages" },
      { icon: "🔭", name: "Future Capabilities Matrix", type: "Reference", pages: "10 pages" },
    ],
    testimonials: [
      { quote: "This vision is exactly where clinical intelligence needs to go. The architecture is thoughtful and the safety framework gives me confidence.", name: "Dr. Anika P.", role: "Medical Director (Mock)" },
      { quote: "The genomics integration concept alone makes this worth serious investment consideration. Properly implemented, it could be transformative.", name: "Research Lead T.", role: "Clinical Research (Mock)" },
      { quote: "I've reviewed dozens of next-gen health platforms. This is among the most structured and safety-conscious designs I've seen at this stage.", name: "Health CTO J.", role: "Health System CTO (Mock)" },
    ],
    faq: [
      { q: "Is Mach 1 operational?", a: "No. Mach 1 is a future-ready conceptual design. It requires real clinical experts, regulatory approval, and technical development to become operational." },
      { q: "What makes it different from Legal Safe?", a: "Legal Safe is a demo-ready simulation. Mach 1 is a next-generation architectural vision with more advanced AI, genomics, and interoperability concepts." },
      { q: "Can I see a live demo?", a: "A live demo of Mach 1 does not exist yet. The platform is in design phase. The Demo mode shows the conceptual architecture only." },
    ],
    roadmap: [
      { phase: "Phase 1", label: "Conceptual Design", description: "Architecture, module mapping, and capability definition — all conceptual.", status: "complete" },
      { phase: "Phase 2", label: "Expert Advisory", description: "Clinical, legal, and technical advisory panel review of all capabilities.", status: "active" },
      { phase: "Phase 3", label: "Research Partnerships", description: "Partner with research institutions for clinical AI validation.", status: "future" },
      { phase: "Phase 4", label: "Regulatory Review", description: "Full regulatory and compliance review before any real development.", status: "future" },
      { phase: "Phase 5", label: "Development & Pilot", description: "Real development under expert oversight with a controlled pilot program.", status: "future" },
    ],
    tourSteps: [
      { title: "Healthcare – Mach 1", body: "This is the next-generation vision platform. Everything here is conceptual and requires expert review." },
      { title: "Vision, Not a Demo", body: "Unlike Legal Safe, Mach 1 is a blueprint for what clinical intelligence could become — not a working demo." },
      { title: "The Roadmap", body: "The Roadmap section shows the path from concept to real-world deployment — each phase requiring expert sign-off." },
    ],
    sections: [
      { id: "overview", label: "Overview", icon: "📋" },
      { id: "features", label: "Capabilities", icon: "✨" },
      { id: "roadmap", label: "Roadmap", icon: "🗺️" },
      { id: "documents", label: "Documents", icon: "📄" },
      { id: "faq", label: "FAQ", icon: "❓" },
    ],
  },

  "monetary-legal-safe": {
    name: "Monetary System – Legal Safe", icon: "💳", color: "#007AFF",
    gradient: "from-blue-600 via-blue-700 to-indigo-700",
    tagline: "Financial operations platform — structured, safe, and mock-only",
    description: "A fully simulated financial operations platform demonstrating pricing models, revenue tracking, and marketplace management. All figures are fictional. No real financial logic, banking, or transactions.",
    industry: "Finance", mode: "DEMO",
    safetyNote: "All financial data is fictional and illustrative. Not financial advice. No real transactions, banking, or investment decisions.",
    stats: [
      { label: "Mock Revenue", value: "$3,240" }, { label: "Active Plans", value: "3" },
      { label: "Marketplace Items", value: "24" }, { label: "Mock Users", value: "14" },
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
    testimonials: [
      { quote: "The revenue dashboard gave us a clear picture of where our creator economy is heading. The breakdown by source is genuinely useful.", name: "Platform Lead A.", role: "Creator Economy Director (Mock)" },
      { quote: "The marketplace layout is exactly what we needed to show investors. Clean, professional, and clear about the revenue model.", name: "Sara K.", role: "Startup Founder (Mock)" },
    ],
    faq: [
      { q: "Are the revenue figures real?", a: "No. All revenue figures are fictional mock data for demonstration purposes only. No real financial transactions occur." },
      { q: "Can this connect to Stripe?", a: "Not in demo mode. Real payment integration requires real Stripe accounts, PCI compliance, and proper technical implementation." },
      { q: "Is this suitable for investor demos?", a: "Yes — as a structural mockup showing your revenue model. Always clearly communicate that figures are illustrative." },
    ],
    roadmap: [
      { phase: "Phase 1", label: "Demo Mode", description: "Mock revenue dashboard, pricing tiers, and marketplace structure — all illustrative.", status: "complete" },
      { phase: "Phase 2", label: "Payment Integration", description: "Real Stripe/PayPal integration — requires real accounts and PCI compliance review.", status: "future" },
      { phase: "Phase 3", label: "Live Marketplace", description: "Real product listings, transactions, and creator payouts — requires legal and financial review.", status: "future" },
    ],
    tourSteps: [
      { title: "Monetary System – Legal Safe", body: "A financial operations demo. All data is fictional and no real transactions occur." },
      { title: "Revenue Dashboard", body: "The Features section shows the full revenue tracking system — all mock values." },
      { title: "Pricing & Plans", body: "Three pricing tiers with feature comparison — designed for investor and stakeholder demos." },
    ],
    sections: [
      { id: "overview", label: "Overview", icon: "📋" },
      { id: "features", label: "Features", icon: "✨" },
      { id: "marketing", label: "Marketing", icon: "📣" },
      { id: "roadmap", label: "Roadmap", icon: "🗺️" },
      { id: "documents", label: "Documents", icon: "📄" },
      { id: "faq", label: "FAQ", icon: "❓" },
    ],
  },

  "monetary-mach1": {
    name: "Monetary System – Mach 1", icon: "🚀", color: "#FF9500",
    gradient: "from-orange-500 via-amber-600 to-yellow-600",
    tagline: "Future financial architecture — the next evolution of creator economics",
    description: "A vision-forward conceptual blueprint for a full creator economy platform. All financial flows require real experts, legal compliance, and regulatory approval before any real implementation.",
    industry: "Finance", mode: "FUTURE",
    safetyNote: "All financial architecture is conceptual. Real implementation requires qualified financial experts, legal agreements, and full regulatory compliance.",
    stats: [
      { label: "Future Modules", value: "11" }, { label: "Payment Partners", value: "4+" },
      { label: "Conceptual APIs", value: "18" }, { label: "Currency Support", value: "12+" },
    ],
    features: [
      { icon: "🌐", name: "Global Payments", desc: "Conceptual Stripe, PayPal, and Square integration — requires real accounts and legal agreements" },
      { icon: "📈", name: "Dynamic Pricing", desc: "AI-driven pricing optimization — requires real market data and financial expert oversight" },
      { icon: "🏦", name: "Banking Layer", desc: "Conceptual banking API connections — requires real financial institution agreements" },
      { icon: "💹", name: "Investment Dashboard", desc: "Portfolio tracking and growth metrics — requires real financial data and expert oversight" },
      { icon: "🔐", name: "Compliance Engine", desc: "PCI-DSS, AML, and KYC compliance layer — requires real legal and compliance expertise" },
      { icon: "⚡", name: "Instant Payouts", desc: "Real-time creator payout system — requires real payment processor agreements" },
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
    testimonials: [
      { quote: "The architecture is ambitious and well-thought-out. With the right compliance framework, this could genuinely reshape creator monetization.", name: "Fintech Advisor L.", role: "Payments Expert (Mock)" },
    ],
    faq: [
      { q: "Is this operational?", a: "No. Mach 1 is a future architecture. All capabilities are conceptual and require real financial, legal, and technical expertise to implement." },
      { q: "What's the difference from Legal Safe?", a: "Legal Safe is a working demo. Mach 1 is a next-generation vision with global payments, AI pricing, and banking integrations — all future capabilities." },
    ],
    roadmap: [
      { phase: "Phase 1", label: "Architecture Design", description: "Complete financial architecture blueprint — conceptual only.", status: "complete" },
      { phase: "Phase 2", label: "Legal & Regulatory Review", description: "Full legal, AML/KYC, and regulatory review of all planned capabilities.", status: "future" },
      { phase: "Phase 3", label: "Payment Partner Agreements", description: "Formal agreements with Stripe, PayPal, and banking partners.", status: "future" },
      { phase: "Phase 4", label: "Compliance & Launch", description: "PCI-DSS certification, compliance sign-off, and controlled launch.", status: "future" },
    ],
    tourSteps: [
      { title: "Monetary System – Mach 1", body: "The next-generation creator economy architecture. All capabilities are conceptual and future-phase." },
      { title: "Review the Roadmap", body: "The Roadmap shows the compliance-first path from concept to real financial operations." },
    ],
    sections: [
      { id: "overview", label: "Overview", icon: "📋" },
      { id: "features", label: "Capabilities", icon: "✨" },
      { id: "roadmap", label: "Roadmap", icon: "🗺️" },
      { id: "documents", label: "Documents", icon: "📄" },
      { id: "faq", label: "FAQ", icon: "❓" },
    ],
  },

  "marketing-hub": {
    name: "Marketing Hub", icon: "📣", color: "#FF2D55",
    gradient: "from-pink-600 via-rose-600 to-red-600",
    tagline: "Complete marketing engine — campaigns, content, and growth built in",
    description: "A full-featured marketing operations platform covering brand campaigns, email marketing, social content, ad creative, and growth funnels. All campaigns are mock and staged for human review.",
    industry: "Marketing", mode: "DEMO",
    stats: [
      { label: "Campaigns (Mock)", value: "18" }, { label: "Email Open Rate", value: "34%" },
      { label: "Content Pieces", value: "127" }, { label: "Growth Score", value: "87" },
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
    testimonials: [
      { quote: "This is exactly the kind of marketing ops platform we've been building toward. The campaign structure is professional and the content calendar is immediately usable.", name: "Marketing Director M.", role: "Brand & Growth (Mock)" },
      { quote: "The funnel builder concept mapped out our entire go-to-market strategy in one sitting. We're using this as our north star.", name: "Growth Lead C.", role: "Startup CMO (Mock)" },
      { quote: "The social content generation is fast, consistent, and brand-safe. It's exactly what a small team needs to punch above their weight.", name: "Social Manager K.", role: "Content Lead (Mock)" },
    ],
    faq: [
      { q: "Are campaigns published automatically?", a: "No. All content is staged for human review first. Nothing is published automatically from this platform." },
      { q: "Can I use the email templates for real campaigns?", a: "The templates are structural guides. Real campaigns require brand customization, legal review, and compliance with email regulations (CAN-SPAM, GDPR, etc.)." },
      { q: "What does the AI generate?", a: "The AI generates copy drafts, campaign structures, and content outlines — all for review, editing, and approval before any real use." },
    ],
    roadmap: [
      { phase: "Phase 1", label: "Platform Build", description: "Full marketing operations platform — campaign management, email, social, ads.", status: "complete" },
      { phase: "Phase 2", label: "Integration Layer", description: "Connect to Mailchimp, HubSpot, Meta Ads, Google Ads — requires real API keys.", status: "future" },
      { phase: "Phase 3", label: "Live Analytics", description: "Real-time campaign analytics with actual performance data.", status: "future" },
    ],
    tourSteps: [
      { title: "Marketing Hub", body: "Your complete marketing operations platform. All content is AI-generated and staged for review." },
      { title: "Campaign Structure", body: "The Features section shows all 6 marketing modules — from email to paid ads to analytics." },
      { title: "Content & Brand", body: "The Marketing section has 4 campaign-ready asset packages — each staged for human review before use." },
    ],
    sections: [
      { id: "overview", label: "Overview", icon: "📋" },
      { id: "features", label: "Modules", icon: "✨" },
      { id: "marketing", label: "Campaigns", icon: "📣" },
      { id: "testimonials", label: "Testimonials", icon: "⭐" },
      { id: "documents", label: "Documents", icon: "📄" },
      { id: "faq", label: "FAQ", icon: "❓" },
    ],
  },

  "operations-builder": {
    name: "Operations Builder", icon: "🏗️", color: "#5856D6",
    gradient: "from-indigo-600 via-purple-600 to-violet-700",
    tagline: "Business operations platform — workflows, teams, and systems unified",
    description: "A comprehensive operations management platform for organizing teams, workflows, processes, and business systems. All data is mock and structural. Designed for any industry.",
    industry: "Operations", mode: "TEST",
    stats: [
      { label: "Active Workflows", value: "34" }, { label: "Team Members", value: "8" },
      { label: "Processes", value: "67" }, { label: "Efficiency Score", value: "91%" },
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
    testimonials: [
      { quote: "The workflow engine mapped our entire construction ops in a single afternoon. It's the most intuitive operations tool we've evaluated.", name: "Ops Director R.", role: "Construction Company (Mock)" },
      { quote: "Process Library alone was worth it — we had 40 workflows documented and templated before the week was out.", name: "COO B.", role: "Professional Services (Mock)" },
    ],
    faq: [
      { q: "What industries does this work for?", a: "The platform is industry-agnostic. It's been used to model operations in construction, healthcare, education, retail, and professional services — all in mock mode." },
      { q: "Can I export my workflows?", a: "In demo mode, exports are mock. Real workflow exports require a live integration with your existing tooling." },
      { q: "How does TEST mode differ from DEMO?", a: "TEST mode allows you to explore and modify content freely without any guided structure. DEMO mode provides structured guided flows." },
    ],
    roadmap: [
      { phase: "Phase 1", label: "Platform Demo", description: "Full operations platform with mock workflows, team management, and documentation.", status: "complete" },
      { phase: "Phase 2", label: "Test Mode Expansion", description: "Expand test mode with editable workflows and custom process templates.", status: "active" },
      { phase: "Phase 3", label: "Tool Integrations", description: "Connect to Slack, Jira, Monday, and Asana — requires real API agreements.", status: "future" },
      { phase: "Phase 4", label: "Live Operations", description: "Real workflow automation with live data — requires proper technical implementation.", status: "future" },
    ],
    tourSteps: [
      { title: "Operations Builder", body: "Your business operations platform. All workflows and data are mock — use TEST mode to explore freely." },
      { title: "Workflow Engine", body: "The Features section shows the workflow engine and all 6 operational modules." },
      { title: "Process Library", body: "48 workflow templates covering every operational scenario — download and adapt for your team." },
    ],
    sections: [
      { id: "overview", label: "Overview", icon: "📋" },
      { id: "features", label: "Modules", icon: "✨" },
      { id: "marketing", label: "Marketing", icon: "📣" },
      { id: "testimonials", label: "Testimonials", icon: "⭐" },
      { id: "roadmap", label: "Roadmap", icon: "🗺️" },
      { id: "documents", label: "Documents", icon: "📄" },
      { id: "faq", label: "FAQ", icon: "❓" },
    ],
  },
};

// ─── Main ProjectPage ─────────────────────────────────────────────────────────
export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState("overview");
  const [docDownloaded, setDocDownloaded] = useState<string | null>(null);

  const projectId = params.projectId ?? "";
  const config = PROJECT_CONFIGS[projectId];

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-background text-foreground p-8">
        <p className="text-5xl">🔍</p>
        <h1 className="text-2xl font-bold">Project Not Found</h1>
        <p className="text-muted-foreground">No project configured for "{projectId}"</p>
        <button onClick={() => navigate("/")} className="mt-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          ← Back to CreateAI OS
        </button>
      </div>
    );
  }

  const modeLabel = { DEMO: "DEMO Mode", TEST: "TEST Mode", FUTURE: "FUTURE / Design Phase" }[config.mode];

  const openStandalone = () => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    window.open(`${base}/standalone/${projectId}`, "_blank", "noopener");
  };

  const downloadDoc = (name: string) => {
    setDocDownloaded(name);
    setTimeout(() => setDocDownloaded(null), 2500);
  };

  return (
    <PresentationLayout
      title={config.name}
      tagline={config.tagline}
      description={config.description}
      icon={config.icon}
      color={config.color}
      gradient={config.gradient}
      label={`${config.industry} Platform`}
      badge={modeLabel}
      safetyNote={config.safetyNote}
      sections={config.sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      stats={config.stats}
      onBack={() => navigate("/")}
      backLabel="CreateAI OS"
      topAction={{ label: "Open Full App ↗", onClick: openStandalone }}
      tourSteps={config.tourSteps}
      showTour
      primaryCTA={{ label: "Explore Platform", onClick: () => setActiveSection("features") }}
      secondaryCTA={{ label: "Open Full App ↗", onClick: openStandalone }}
      tertiaryCTA={{ label: "View Documents", onClick: () => setActiveSection("documents") }}
    >

      {/* ── Overview ── */}
      {activeSection === "overview" && (
        <div className="space-y-12">
          <SectionContainer eyebrow="Platform Overview" title={config.mode === "FUTURE" ? "The Vision" : "What This Platform Does"}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
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
                <button onClick={() => setActiveSection("features")} className="text-primary font-semibold text-sm hover:underline">
                  View all {config.features.length} features →
                </button>
              </div>
              <div className="bg-gradient-to-br from-muted/50 to-muted rounded-3xl p-6 space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Platform At a Glance</p>
                <div className="space-y-3">
                  {[
                    { label: "Industry", value: config.industry },
                    { label: "Mode", value: config.mode },
                    { label: "Features", value: `${config.features.length} modules` },
                    { label: "Documents", value: `${config.documents.length} available` },
                    { label: "Marketing Assets", value: `${config.marketingItems.length} pieces` },
                    { label: "Status", value: config.mode === "FUTURE" ? "Design Phase" : config.mode === "TEST" ? "Test Ready" : "Demo Ready" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <span className="text-[13px] text-muted-foreground">{row.label}</span>
                      <span className="text-[13px] font-semibold text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionContainer>

          <div className="bg-muted/30 rounded-3xl p-8 text-center space-y-4">
            <h3 className="text-xl font-bold text-foreground">Ready to explore the full product?</h3>
            <p className="text-muted-foreground text-sm">Open {config.name} as a full standalone application with its own navigation, AI assistant, and complete workflow system.</p>
            <button onClick={openStandalone}
              className="inline-flex items-center gap-2 font-bold px-8 py-3 rounded-xl text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: config.color }}>
              Open Full App ↗
            </button>
          </div>
        </div>
      )}

      {/* ── Features ── */}
      {(activeSection === "features" || activeSection === "capabilities") && (
        <SectionContainer
          eyebrow={config.mode === "FUTURE" ? "Planned Capabilities" : "Platform Modules"}
          title={config.mode === "FUTURE" ? "Future Capabilities" : "Core Features"}
          subtitle={config.mode === "FUTURE"
            ? "These capabilities are conceptual targets requiring expert design, legal review, and technical implementation."
            : "Every module is built for demonstration and ideation. All data is mock and outputs are staged for review."}
        >
          <FeatureGrid features={config.features} color={config.color} />
          {config.mode === "FUTURE" && (
            <SafetyNotice message="All features above are conceptual. Real implementation requires qualified experts, legal agreements, and proper technical development." type="warning" />
          )}
        </SectionContainer>
      )}

      {/* ── Marketing ── */}
      {(activeSection === "marketing" || activeSection === "campaigns") && (
        <SectionContainer eyebrow="Marketing Assets" title="Campaign-Ready Content" subtitle={`AI-generated marketing assets for ${config.name}. All content staged for human review before any publication.`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {config.marketingItems.map(item => (
              <div key={item.title} className="bg-background rounded-2xl border border-border/50 p-6 hover:border-primary/20 hover:shadow-md transition-all">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wide">{item.type}</span>
                <h3 className="font-bold text-[15px] text-foreground mt-3 mb-2">{item.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">{item.desc}</p>
                <div className="flex gap-2">
                  <button className="text-[12px] font-semibold text-primary hover:underline">Preview →</button>
                  <button className="text-[12px] font-semibold text-muted-foreground hover:text-foreground ml-auto">Stage for Review</button>
                </div>
              </div>
            ))}
          </div>
          <SafetyNotice message="All marketing content is AI-generated. Stage for review before any real-world use. No content is published automatically." type="info" />
        </SectionContainer>
      )}

      {/* ── Testimonials ── */}
      {activeSection === "testimonials" && (
        <SectionContainer eyebrow="Social Proof" title="What People Are Saying" subtitle="Mock testimonials from representative personas — not real endorsements.">
          <TestimonialBlock testimonials={config.testimonials} />
          <SafetyNotice message="All testimonials are fictional mock personas for demonstration purposes only." type="demo" />
        </SectionContainer>
      )}

      {/* ── Documents ── */}
      {activeSection === "documents" && (
        <SectionContainer eyebrow="Document Library" title="Platform Documents" subtitle={`Download guides, presentations, and reference documents for ${config.name}. All documents are mock.`}>
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
                  className="mt-4 w-full py-2.5 rounded-xl text-[13px] font-semibold border border-border/50 text-foreground hover:bg-muted/50 transition-colors">
                  {docDownloaded === doc.name ? "✓ Downloaded (Mock)" : "↓ Download (Mock)"}
                </button>
              </div>
            ))}
          </div>
          <SafetyNotice message="All documents are mock and for demonstration only. No real content is delivered." type="demo" />
        </SectionContainer>
      )}

      {/* ── FAQ ── */}
      {activeSection === "faq" && (
        <SectionContainer eyebrow="Frequently Asked" title="Questions & Answers" subtitle={`Common questions about ${config.name}`}>
          <FAQWidget items={config.faq} />
        </SectionContainer>
      )}

      {/* ── Roadmap ── */}
      {activeSection === "roadmap" && (
        <SectionContainer eyebrow="Platform Roadmap" title="The Path Forward" subtitle="A phased approach from conceptual design to real-world deployment — each phase requiring expert review.">
          <RoadmapWidget phases={config.roadmap} />
        </SectionContainer>
      )}

    </PresentationLayout>
  );
}
