import React, { useEffect } from "react";
import { useLocation, Link } from "wouter";

const INDIGO = "#6366f1";
const PURPLE = "#8b5cf6";

interface IndustryConfig {
  slug:         string;
  title:        string;
  headline:     string;
  subheadline:  string;
  problem:      string;
  solution:     string;
  features:     { icon: string; title: string; body: string }[];
  useCases:     { icon: string; label: string; detail: string }[];
  proof:        { stat: string; label: string }[];
  cta:          string;
  ctaSecondary: string;
  metaTitle:    string;
  metaDesc:     string;
  keywords:     string;
}

const INDUSTRIES: Record<string, IndustryConfig> = {
  healthcare: {
    slug: "healthcare",
    title: "Healthcare AI",
    headline: "The AI OS Built for Healthcare Teams",
    subheadline: "HealthOS replaces five separate software tools with one AI-powered platform — EHR workflows, patient intake, billing codes, compliance, and clinical documentation in one place.",
    problem: "The average healthcare practice pays $43,000/year for disconnected software — separate EHR, billing, scheduling, compliance, and documentation tools that don't talk to each other.",
    solution: "CreateAI Brain unifies your entire clinical workflow into one AI OS. Generate SOAP notes in seconds. Auto-code ICD-10. Run HIPAA compliance checks. Manage patients and billing — all without switching apps.",
    features: [
      { icon: "🩺", title: "AI Clinical Documentation", body: "SOAP note generation, clinical decision support, and differential diagnosis in under 30 seconds." },
      { icon: "💊", title: "ICD-10 & CPT Code Assist", body: "Automatic billing code suggestions from patient encounter data. Reduce claim denials by 40%." },
      { icon: "🔒", title: "Built-In HIPAA Compliance", body: "Compliance checklists, audit logs, and documentation templates — all HIPAA-aware by default." },
      { icon: "📋", title: "Patient Intake & Scheduling", body: "Digital intake forms, smart scheduling, and automated appointment reminders." },
      { icon: "📊", title: "Practice Analytics", body: "Revenue per visit, payer mix, provider productivity — real-time insights with no setup." },
      { icon: "🧠", title: "12 AI Invention Tools", body: "From treatment protocol generators to patient education content — AI does the work." },
    ],
    useCases: [
      { icon: "🏥", label: "Private Practices", detail: "Run a solo or group practice without hiring a full admin team." },
      { icon: "🦷", label: "Dental Offices", detail: "Treatment planning, billing codes, and patient communication — automated." },
      { icon: "🧘", label: "Mental Health", detail: "Progress notes, treatment plans, and therapy session documentation in minutes." },
      { icon: "🏃", label: "Physical Therapy", detail: "Exercise plans, progress tracking, and insurance documentation simplified." },
    ],
    proof: [
      { stat: "$43K", label: "Avg software savings per practice per year" },
      { stat: "30s", label: "Average SOAP note generation time" },
      { stat: "122", label: "AI-powered apps included" },
      { stat: "$97", label: "Per month. No per-user fees." },
    ],
    cta: "Start Free — No Card Required",
    ctaSecondary: "See HealthOS in Action",
    metaTitle: "AI Software for Healthcare Practices | CreateAI Brain HealthOS",
    metaDesc: "Replace your EHR, billing, and compliance tools with one AI OS. HealthOS by CreateAI Brain — clinical documentation, ICD-10 coding, HIPAA compliance, and 122 AI tools for $97/mo.",
    keywords: "healthcare AI software, medical practice management, AI clinical documentation, EHR alternative, SOAP note generator, ICD-10 code AI",
  },
  legal: {
    slug: "legal",
    title: "Legal AI",
    headline: "The AI OS That Replaces Your Entire Legal Tech Stack",
    subheadline: "Legal Practice Manager handles case management, contract drafting, time tracking, billing, and legal research — at a fraction of the cost of Clio, Westlaw, or LexisNexis.",
    problem: "The average law firm pays $18,000+/year in legal software subscriptions — Clio, Westlaw, Lexis, DocuSign, and billing tools that each require separate logins, training, and invoices.",
    solution: "CreateAI Brain's Legal Practice Manager is one AI OS for your entire practice. Draft contracts in minutes. Track billable hours automatically. Run legal research. Manage clients and cases — all unified.",
    features: [
      { icon: "⚖️", title: "Contract Drafting AI", body: "Generate NDAs, service agreements, and demand letters in minutes. Fully editable templates." },
      { icon: "⏱️", title: "Automatic Time Tracking", body: "Log billable hours, generate invoices, and track payment status — zero manual data entry." },
      { icon: "📚", title: "Legal Research Assistant", body: "Case law summaries, statute analysis, and precedent research powered by GPT-4o." },
      { icon: "🗂️", title: "Case & Matter Management", body: "Full client lifecycle: intake, milestones, documents, deadlines, and communications." },
      { icon: "💰", title: "Billing & Invoice Engine", body: "LEDES-format invoices, contingency tracking, and retainer management — automated." },
      { icon: "📋", title: "Court Deadline Calendar", body: "Statute of limitations tracking, court date alerts, and filing deadline management." },
    ],
    useCases: [
      { icon: "👔", label: "Solo Practitioners", detail: "Run a one-person firm with AI handling the admin." },
      { icon: "🏢", label: "Small Firms (2-15 attorneys)", detail: "Unified platform replacing 5+ separate subscriptions." },
      { icon: "📝", label: "Contract-Focused Practices", detail: "M&A, real estate, and transactional law — contract drafting at scale." },
      { icon: "🔍", label: "Litigation Support", detail: "Discovery organization, case timelines, and deposition preparation." },
    ],
    proof: [
      { stat: "$18K+", label: "Avg legal software savings per firm/year" },
      { stat: "3 min", label: "Average NDA generation time" },
      { stat: "122", label: "AI-powered apps included" },
      { stat: "$97", label: "Per month. No per-seat pricing." },
    ],
    cta: "Start Free — No Card Required",
    ctaSecondary: "Explore Legal Practice Manager",
    metaTitle: "AI Legal Software for Law Firms | CreateAI Brain Legal PM",
    metaDesc: "Replace Clio, Westlaw, and DocuSign with one AI platform. Contract drafting, case management, billing, and legal research — all powered by GPT-4o. $97/mo.",
    keywords: "legal AI software, law firm management software, contract drafting AI, Clio alternative, legal research AI, law practice management",
  },
  staffing: {
    slug: "staffing",
    title: "Staffing & HR AI",
    headline: "AI-Powered Staffing That Scales Without Headcount",
    subheadline: "StaffingOS automates candidate sourcing, screening, placement, and compliance — giving staffing agencies and HR teams global reach with a fraction of the operational overhead.",
    problem: "Traditional staffing costs 15-25% of placement fees in manual administrative work — screening resumes, coordinating interviews, managing compliance paperwork, and tracking placements across dozens of tools.",
    solution: "StaffingOS by CreateAI Brain brings candidate sourcing, AI screening, placement management, compliance tracking, and payroll coordination into one automated OS.",
    features: [
      { icon: "🌍", title: "Global Talent Sourcing", body: "Source candidates across 190 countries with AI-powered job matching and outreach." },
      { icon: "🤖", title: "AI Resume Screening", body: "Screen hundreds of applicants in minutes. AI ranks, scores, and flags the best fits." },
      { icon: "📋", title: "Compliance Automation", body: "I-9, work authorization, background check coordination — automated per jurisdiction." },
      { icon: "💼", title: "Placement Tracking", body: "Full placement lifecycle: sourced → screened → placed → onboarded. Zero spreadsheets." },
      { icon: "📞", title: "Candidate Communication", body: "Automated outreach, follow-ups, interview scheduling, and offer letter generation." },
      { icon: "📊", title: "Agency Analytics", body: "Fill rate, time-to-fill, gross margin, and placement pipeline — live dashboard." },
    ],
    useCases: [
      { icon: "🏭", label: "Light Industrial", detail: "High-volume temp placements managed automatically." },
      { icon: "💻", label: "IT & Tech", detail: "Specialized talent matching for engineering and product roles." },
      { icon: "🏥", label: "Healthcare Staffing", detail: "Nurse, allied health, and per-diem shift placement — automated." },
      { icon: "🌐", label: "International Placements", detail: "Global compliance, visa tracking, and work authorization — built in." },
    ],
    proof: [
      { stat: "80%", label: "Reduction in manual screening time" },
      { stat: "190+", label: "Countries with built-in compliance" },
      { stat: "122", label: "AI-powered apps included" },
      { stat: "$97", label: "Per month. No per-placement fees." },
    ],
    cta: "Start Free — No Card Required",
    ctaSecondary: "Explore StaffingOS",
    metaTitle: "AI Staffing Software for Agencies | CreateAI Brain StaffingOS",
    metaDesc: "Automate candidate sourcing, screening, compliance, and placement with AI. StaffingOS by CreateAI Brain handles the full staffing lifecycle — $97/mo.",
    keywords: "AI staffing software, staffing agency software, AI recruitment platform, candidate screening AI, HR automation software",
  },
  entrepreneurs: {
    slug: "entrepreneurs",
    title: "AI for Entrepreneurs",
    headline: "Build Your Next Business with an AI That Does the Work",
    subheadline: "CreateAI Brain gives entrepreneurs a complete AI OS — business planning, product creation, marketing, finance, legal, and operations — in one platform that costs less than one hour of consulting.",
    problem: "First-time founders spend 60% of their time on operational tasks — writing contracts, building marketing copy, managing projects, tracking finances — instead of building the product.",
    solution: "CreateAI Brain's 122 AI apps handle the operational layer so you can focus on the product. From business entity formation to investor pitch decks, the OS does the heavy lifting.",
    features: [
      { icon: "🚀", title: "Business Plan Generator", body: "Full business plan with financial projections, market analysis, and competitive landscape in minutes." },
      { icon: "⚖️", title: "Legal Document AI", body: "Operating agreements, NDAs, terms of service, and client contracts — AI-generated, human-readable." },
      { icon: "📣", title: "Marketing Copy Engine", body: "Landing pages, email sequences, social content, and ad copy — written by AI, launched by you." },
      { icon: "💰", title: "Revenue & Finance Tools", body: "Pricing models, cash flow projections, and unit economics — built for non-financial founders." },
      { icon: "🧠", title: "12 Invention Tools", body: "Product ideation, patent research, prototype planning, and go-to-market strategy — AI-powered." },
      { icon: "📊", title: "Investor Pitch Deck", body: "One-click pitch deck generation from your business data. Slides, metrics, and narrative included." },
    ],
    useCases: [
      { icon: "🌱", label: "First-Time Founders", detail: "Build without knowing everything — AI fills the gaps." },
      { icon: "🔁", label: "Serial Entrepreneurs", detail: "Spin up new ventures faster than ever before." },
      { icon: "🛠️", label: "Bootstrapped Builders", detail: "Replace expensive agencies and consultants with AI." },
      { icon: "🌍", label: "Global Founders", detail: "Build across borders without a local team." },
    ],
    proof: [
      { stat: "$100K+", label: "Software stack it replaces" },
      { stat: "122", label: "AI-powered apps included" },
      { stat: "< 1hr", label: "To complete a full business plan" },
      { stat: "$97", label: "Per month. Less than one consulting hour." },
    ],
    cta: "Start Free — No Card Required",
    ctaSecondary: "See All 122 Apps",
    metaTitle: "AI Business Platform for Entrepreneurs | CreateAI Brain",
    metaDesc: "Build your next business with AI. Business planning, legal docs, marketing, and finance — all in one AI OS. CreateAI Brain for entrepreneurs — $97/mo.",
    keywords: "AI for entrepreneurs, AI business tools, startup software, business plan AI, entrepreneur platform, AI startup tools",
  },
  creators: {
    slug: "creators",
    title: "AI for Creators",
    headline: "The AI Studio That Makes Creating Feel Like Cheating",
    subheadline: "CreateAI Brain gives creators an AI-powered writing, design, scripting, and publishing OS — so you can produce more, in less time, without burning out.",
    problem: "Creators who go full-time hit a production ceiling — content takes hours, ideas dry up, audience growth stalls, and monetization stays inconsistent without a team or agency.",
    solution: "CreateAI Brain's creator tools cover the full pipeline: ideation, scripting, content creation, scheduling, SEO, and monetization — all in one AI OS that runs 24/7.",
    features: [
      { icon: "✍️", title: "AI Writing Engine", body: "Long-form articles, scripts, email sequences, and captions — your voice, AI speed." },
      { icon: "🎬", title: "Script & Story AI", body: "YouTube scripts, podcast outlines, and narrative arcs written and structured automatically." },
      { icon: "🎵", title: "Soundscape Generator", body: "Ambient soundscapes, sonic branding, and audio environments for videos and podcasts." },
      { icon: "🌍", title: "World & Lore Building", body: "Fiction worlds, character systems, and narrative universes — built with 12 dedicated AI tools." },
      { icon: "📈", title: "Content SEO Tools", body: "Keyword research, semantic SEO, and content optimization — built for content that ranks." },
      { icon: "💰", title: "Monetization Engine", body: "Digital products, subscription tiers, and affiliate programs — AI-designed revenue systems." },
    ],
    useCases: [
      { icon: "📹", label: "YouTubers", detail: "Script, research, SEO, and thumbnails — all AI-assisted." },
      { icon: "🎙️", label: "Podcasters", detail: "Episode outlines, show notes, and guest research — done in minutes." },
      { icon: "✍️", label: "Writers & Authors", detail: "Book planning, chapter drafts, and world-building at scale." },
      { icon: "📱", label: "Social Media Creators", detail: "Content calendars, caption banks, and viral hook libraries — built automatically." },
    ],
    proof: [
      { stat: "10x", label: "Content production speed vs. solo creation" },
      { stat: "122", label: "AI-powered apps included" },
      { stat: "12", label: "Dedicated invention & creation tools" },
      { stat: "$97", label: "Per month. Less than a single freelance article." },
    ],
    cta: "Start Creating — Free",
    ctaSecondary: "Explore Creator Tools",
    metaTitle: "AI Content Creation Platform for Creators | CreateAI Brain",
    metaDesc: "Write, script, produce, and monetize content with AI. CreateAI Brain gives creators 122 AI apps for writing, scripting, SEO, and revenue generation — $97/mo.",
    keywords: "AI for content creators, AI writing tool, script generator AI, content creation AI, YouTube AI tools, creator platform",
  },
  finance: {
    slug: "finance",
    title: "Finance AI",
    headline: "The AI OS That Runs Your Financial Practice",
    subheadline: "From financial planning to portfolio analysis, tax strategy to client reporting — CreateAI Brain handles the entire financial advisory workflow in one AI-powered platform.",
    problem: "Financial advisors and CFOs spend 40% of their time on non-client-facing tasks — report generation, compliance documentation, portfolio commentary, and client communication.",
    solution: "CreateAI Brain's finance tools automate the administrative and analytical layer — so advisors focus on relationships and strategy while AI handles research, reporting, and documentation.",
    features: [
      { icon: "📊", title: "Portfolio Analysis AI", body: "Performance attribution, risk analysis, and asset allocation recommendations — AI-generated in minutes." },
      { icon: "📋", title: "Client Report Generator", body: "Quarterly performance reports, investment commentary, and custom financial summaries — automated." },
      { icon: "💹", title: "Market Research Engine", body: "Sector analysis, economic summaries, and investment thesis generation — powered by GPT-4o." },
      { icon: "⚖️", title: "Compliance Documentation", body: "ADV forms, disclosure templates, suitability documentation, and compliance checklists — automated." },
      { icon: "💰", title: "Financial Planning Tools", body: "Retirement projections, cash flow modeling, and goals-based financial planning — AI-assisted." },
      { icon: "📧", title: "Client Communication", body: "Market update emails, newsletter content, and personalized client messaging — generated automatically." },
    ],
    useCases: [
      { icon: "🏦", label: "RIAs & Advisors", detail: "Full advisory workflow — research, reporting, compliance — automated." },
      { icon: "📈", label: "Portfolio Managers", detail: "Performance analytics and investment commentary at scale." },
      { icon: "💼", label: "Corporate CFOs", detail: "Board reporting, budget variance analysis, and financial narrative — AI-generated." },
      { icon: "🧾", label: "Tax Strategists", detail: "Tax planning memos, strategy summaries, and client education content — automated." },
    ],
    proof: [
      { stat: "40%", label: "Admin time reclaimed for client relationships" },
      { stat: "122", label: "AI-powered apps included" },
      { stat: "15 min", label: "Average client report generation time" },
      { stat: "$97", label: "Per month. No per-client fees." },
    ],
    cta: "Start Free — No Card Required",
    ctaSecondary: "Explore Finance Tools",
    metaTitle: "AI Platform for Financial Advisors | CreateAI Brain",
    metaDesc: "Automate portfolio reporting, compliance docs, market research, and client communications with AI. CreateAI Brain for financial advisors — $97/mo.",
    keywords: "AI for financial advisors, financial planning software AI, portfolio analysis AI, wealth management software, RIA software AI, financial reporting AI",
  },
  "real-estate": {
    slug: "real-estate",
    title: "Real Estate AI",
    headline: "The AI OS Built for Real Estate Professionals",
    subheadline: "CreateAI Brain gives real estate agents, brokers, and property managers an AI-powered platform for listings, client communication, market analysis, and transaction management.",
    problem: "Real estate professionals juggle 12+ tools — CRMs, listing platforms, transaction managers, marketing tools, and market data subscriptions — while spending hours on manual administrative tasks.",
    solution: "CreateAI Brain consolidates your real estate workflow into one AI OS — market analysis, listing copy, client communication, transaction management, and lead generation — all automated.",
    features: [
      { icon: "🏠", title: "Listing Copy Generator", body: "MLS-ready property descriptions, social captions, and marketing copy in under 2 minutes." },
      { icon: "📊", title: "Market Analysis AI", body: "CMA reports, price trend analysis, neighborhood insights, and investment projections — AI-generated." },
      { icon: "📧", title: "Client Communication", body: "Buyer/seller update emails, drip sequences, and follow-up automation — fully written by AI." },
      { icon: "🔑", title: "Transaction Management", body: "Contract timelines, milestone tracking, and closing checklist management — organized." },
      { icon: "🎯", title: "Lead Nurture Engine", body: "Personalized outreach, listing alerts, and re-engagement sequences — automated." },
      { icon: "💹", title: "Investment Analysis", body: "Cap rate, NOI, cash-on-cash return, and ROI projections for investment properties." },
    ],
    useCases: [
      { icon: "🏡", label: "Residential Agents", detail: "Listing copy, CMA, and client communication — all AI-generated." },
      { icon: "🏢", label: "Commercial Brokers", detail: "Investment analysis, offering memorandums, and market research at scale." },
      { icon: "🏘️", label: "Property Managers", detail: "Tenant communication, lease drafting, and maintenance coordination — automated." },
      { icon: "📐", label: "Developers", detail: "Project marketing, investor updates, and financial modeling — AI-powered." },
    ],
    proof: [
      { stat: "2 min", label: "Average listing copy generation time" },
      { stat: "122", label: "AI-powered apps included" },
      { stat: "$40K+", label: "Annual software cost savings per brokerage" },
      { stat: "$97", label: "Per month. No per-listing fees." },
    ],
    cta: "Start Free — No Card Required",
    ctaSecondary: "See Real Estate Tools",
    metaTitle: "AI Software for Real Estate Agents | CreateAI Brain",
    metaDesc: "Generate listing copy, CMA reports, and client emails with AI. CreateAI Brain for real estate professionals — MLS copy, market analysis, lead nurture. $97/mo.",
    keywords: "AI for real estate agents, real estate software AI, listing description generator, CMA AI tool, real estate marketing AI, property management software",
  },
  coaches: {
    slug: "coaches",
    title: "AI for Coaches",
    headline: "Scale Your Coaching Business Without Burning Out",
    subheadline: "CreateAI Brain gives coaches, therapists, and educators an AI OS for curriculum creation, client management, content production, and business operations — all in one platform.",
    problem: "Coaches who want to scale beyond 1:1 hit a creation ceiling — developing programs, producing content, managing clients, and running business operations takes more hours than the practice generates.",
    solution: "CreateAI Brain handles the creation and operational layer so coaches can focus on transformation. Course curriculum, coaching frameworks, content, and business tools — all AI-powered.",
    features: [
      { icon: "📚", title: "Curriculum AI Builder", body: "Full course curriculum, module outlines, lesson plans, and worksheets — generated from your methodology." },
      { icon: "🎯", title: "Coaching Framework Generator", body: "Structured coaching programs, session templates, and client outcome frameworks — AI-designed." },
      { icon: "✍️", title: "Content Creation Engine", body: "Newsletter content, social posts, webinar scripts, and lead magnets — written by AI, in your voice." },
      { icon: "👥", title: "Client Management", body: "Session notes, progress tracking, homework assignments, and client communication — organized." },
      { icon: "💰", title: "Program Monetization", body: "Pricing strategy, program positioning, sales page copy, and launch sequence — AI-generated." },
      { icon: "🎙️", title: "Podcast & Video Scripts", body: "Episode scripts, show notes, video outlines, and YouTube descriptions — produced automatically." },
    ],
    useCases: [
      { icon: "🧘", label: "Life Coaches", detail: "Programs, frameworks, and content — scaled without burnout." },
      { icon: "💼", label: "Business Coaches", detail: "Client curriculum, group programs, and thought leadership — automated." },
      { icon: "🏃", label: "Health & Fitness", detail: "Training plans, nutrition guides, and client check-ins — AI-assisted." },
      { icon: "🎓", label: "Educators & Trainers", detail: "Course design, assessments, and e-learning content — generated at scale." },
    ],
    proof: [
      { stat: "10x", label: "Content production vs. manual creation" },
      { stat: "122", label: "AI-powered apps included" },
      { stat: "< 2hr", label: "To build a full course curriculum" },
      { stat: "$97", label: "Per month. ROI on one new client." },
    ],
    cta: "Start Free — No Card Required",
    ctaSecondary: "Explore Coaching Tools",
    metaTitle: "AI Platform for Coaches and Educators | CreateAI Brain",
    metaDesc: "Build courses, coaching frameworks, and content with AI. CreateAI Brain for coaches — curriculum design, client management, and content creation. $97/mo.",
    keywords: "AI for coaches, coaching software, course creation AI, coaching curriculum AI, online coach platform, coaching business software",
  },
  logistics: {
    slug: "logistics",
    title: "Logistics AI",
    headline: "The AI OS That Optimizes Your Entire Logistics Operation",
    subheadline: "CreateAI Brain gives logistics operators, fleet managers, and supply chain professionals AI-powered tools for route optimization, compliance, documentation, and operational intelligence.",
    problem: "Logistics operations rely on manual processes for documentation, compliance tracking, carrier coordination, and reporting — creating bottlenecks that cost time, money, and accuracy.",
    solution: "CreateAI Brain automates the documentation and intelligence layer of logistics — shipping documents, compliance checklists, carrier communication, and operational reporting — powered by AI.",
    features: [
      { icon: "🚛", title: "Fleet Intelligence AI", body: "Route analysis, driver performance insights, and maintenance scheduling — AI-generated reports." },
      { icon: "📋", title: "Compliance Documentation", body: "DOT compliance checklists, FMCSA documentation, and safety audit templates — automated." },
      { icon: "📦", title: "Shipping Documentation", body: "Bills of lading, packing lists, customs declarations, and carrier agreements — AI-generated." },
      { icon: "📊", title: "Operations Analytics", body: "Cost per mile, on-time delivery, carrier scorecards, and lane analysis — live dashboards." },
      { icon: "🌍", title: "International Freight", body: "Export documentation, harmonized codes, and international compliance — AI-assisted." },
      { icon: "📞", title: "Carrier Communication", body: "Rate confirmation templates, load tender emails, and dispute documentation — automated." },
    ],
    useCases: [
      { icon: "🚚", label: "Trucking Companies", detail: "DOT compliance, driver docs, and carrier management — automated." },
      { icon: "🏭", label: "3PL Operators", detail: "Client reporting, warehouse docs, and operational intelligence at scale." },
      { icon: "✈️", label: "Freight Forwarders", detail: "International docs, customs compliance, and carrier coordination — AI-powered." },
      { icon: "🏗️", label: "Supply Chain Teams", detail: "Vendor communication, procurement docs, and supply chain analytics." },
    ],
    proof: [
      { stat: "80%", label: "Documentation time reduction" },
      { stat: "122", label: "AI-powered apps included" },
      { stat: "190+", label: "Countries supported for compliance docs" },
      { stat: "$97", label: "Per month. No per-shipment fees." },
    ],
    cta: "Start Free — No Card Required",
    ctaSecondary: "Explore Logistics Tools",
    metaTitle: "AI Platform for Logistics and Fleet Operations | CreateAI Brain",
    metaDesc: "Automate DOT compliance, shipping documents, carrier communication, and fleet analytics with AI. CreateAI Brain for logistics operators — $97/mo.",
    keywords: "AI for logistics, fleet management software, logistics AI platform, DOT compliance software, freight documentation AI, supply chain AI tools",
  },
  education: {
    slug: "education",
    title: "Education AI",
    headline: "The AI OS That Transforms How You Teach and Learn",
    subheadline: "CreateAI Brain gives educators, instructional designers, and EdTech teams an AI platform for curriculum development, student assessment, content creation, and administrative efficiency.",
    problem: "Educators spend 40-60% of their time on administrative tasks — lesson planning, grading rubrics, assessment creation, and paperwork — leaving less time for the actual work of teaching.",
    solution: "CreateAI Brain automates the curriculum and administrative layer — lesson plans, assessment rubrics, course materials, and communication templates — so educators can focus on students.",
    features: [
      { icon: "📚", title: "Curriculum Design AI", body: "Learning objectives, lesson plans, unit frameworks, and scope & sequence — AI-generated." },
      { icon: "📝", title: "Assessment Builder", body: "Quizzes, rubrics, project guidelines, and grading criteria — differentiated and AI-designed." },
      { icon: "🎯", title: "Differentiation Tools", body: "Modified content for different learning levels, IEP accommodations, and learning style variations." },
      { icon: "✍️", title: "Course Content Generator", body: "Lecture notes, reading guides, study materials, and educational handouts — automated." },
      { icon: "📊", title: "Progress Analytics", body: "Student performance tracking, learning gap identification, and outcome reporting — organized." },
      { icon: "📧", title: "Parent & Student Comms", body: "Progress updates, newsletters, and communication templates — written by AI." },
    ],
    useCases: [
      { icon: "🎓", label: "K-12 Educators", detail: "Lesson plans, assessments, and differentiated content — AI-generated." },
      { icon: "🏫", label: "Higher Education", detail: "Syllabus design, course materials, and assessment creation at scale." },
      { icon: "💻", label: "EdTech Teams", detail: "Course content, learning pathways, and assessment frameworks — automated." },
      { icon: "🌐", label: "Corporate Training", detail: "Employee development programs, training materials, and learning assessments." },
    ],
    proof: [
      { stat: "60%", label: "Admin time reclaimed for teaching" },
      { stat: "122", label: "AI-powered apps included" },
      { stat: "< 30 min", label: "To complete a full lesson plan" },
      { stat: "$97", label: "Per month. Less than 2 textbooks." },
    ],
    cta: "Start Free — No Card Required",
    ctaSecondary: "Explore Education Tools",
    metaTitle: "AI Platform for Educators and EdTech | CreateAI Brain",
    metaDesc: "Build lesson plans, assessments, and course content with AI. CreateAI Brain for educators — curriculum design, differentiation, and student communication. $97/mo.",
    keywords: "AI for educators, AI lesson plan generator, curriculum design AI, EdTech platform, assessment builder AI, educational content AI",
  },
  nonprofits: {
    slug: "nonprofits",
    title: "Nonprofit AI",
    headline: "The AI OS Built for Mission-Driven Organizations",
    subheadline: "CreateAI Brain gives nonprofits, NGOs, and social enterprises an AI platform for grant writing, donor communication, program management, and operational efficiency — at a price that respects your budget.",
    problem: "Nonprofits operate on 60-70% smaller administrative budgets than for-profit organizations of the same size — yet need the same quality of grant proposals, donor relations, program reporting, and operations.",
    solution: "CreateAI Brain makes enterprise-grade AI tools accessible to mission-driven organizations. Grant writing, donor communications, program reports, and board presentations — AI-powered, mission-aligned.",
    features: [
      { icon: "📝", title: "Grant Writing AI", body: "Full grant proposals, LOIs, needs statements, and program narratives — generated from your mission data." },
      { icon: "💌", title: "Donor Communication", body: "Thank-you letters, impact reports, fundraising appeals, and stewardship sequences — AI-personalized." },
      { icon: "📊", title: "Program Impact Reports", body: "Outcome documentation, data visualization narratives, and funder reports — automated." },
      { icon: "📋", title: "Board Communications", body: "Board packets, meeting agendas, committee reports, and governance documentation — AI-structured." },
      { icon: "🌍", title: "Campaign Management", body: "Fundraising campaigns, event promotion, and awareness content — AI-powered across all channels." },
      { icon: "🤝", title: "Volunteer Management", body: "Volunteer communications, role descriptions, impact acknowledgments, and coordination tools." },
    ],
    useCases: [
      { icon: "🌱", label: "Environmental NGOs", detail: "Grant writing, impact reporting, and campaign content — automated." },
      { icon: "🏥", label: "Health Nonprofits", detail: "Program reporting, donor comms, and grant applications at scale." },
      { icon: "🎓", label: "Education Foundations", detail: "Scholarship programs, donor stewardship, and impact measurement — AI-powered." },
      { icon: "🤲", label: "Social Services", detail: "Client reporting, funder communication, and program documentation — organized." },
    ],
    proof: [
      { stat: "3x", label: "Grant application output per staff member" },
      { stat: "122", label: "AI-powered apps included" },
      { stat: "$97", label: "Per month — 95% less than enterprise alternatives" },
      { stat: "10 min", label: "Average grant LOI generation time" },
    ],
    cta: "Start Free — No Card Required",
    ctaSecondary: "Explore Nonprofit Tools",
    metaTitle: "AI Platform for Nonprofits and NGOs | CreateAI Brain",
    metaDesc: "Write grants, automate donor communication, and produce impact reports with AI. CreateAI Brain for nonprofits — mission-driven AI tools for $97/mo.",
    keywords: "AI for nonprofits, grant writing AI, nonprofit software, donor communication AI, NGO platform, social enterprise tools",
  },
  consultants: {
    slug: "consultants",
    title: "AI for Consultants",
    headline: "Deliver More Client Value Without Hiring",
    subheadline: "CreateAI Brain gives independent consultants and boutique agencies an AI OS for research, deliverable creation, client management, and billing — so you can scale revenue without scaling headcount.",
    problem: "Solo consultants and small agencies hit a capacity ceiling fast — every new client means more research, more deliverables, more admin, and more hours. Growth requires hiring, which kills margins.",
    solution: "CreateAI Brain expands your capacity without expanding your team. Research, analysis, strategy decks, and client deliverables — all AI-generated in a fraction of the time.",
    features: [
      { icon: "📊", title: "Research & Analysis AI", body: "Market research, competitive analysis, and industry reports — compiled and formatted in minutes." },
      { icon: "📋", title: "Strategy Deck Builder", body: "Full consulting deliverables — strategy docs, roadmaps, and recommendations — AI-structured." },
      { icon: "💼", title: "Client Management", body: "Project tracking, milestone management, meeting notes, and deliverable history — organized." },
      { icon: "⏱️", title: "Time & Billing", body: "Billable hour tracking, SOW generation, and invoice management — automated." },
      { icon: "🧠", title: "Domain AI Assistants", body: "Specialized AI for finance, operations, marketing, HR, legal, and technology consulting." },
      { icon: "🔍", title: "Semantic Research Engine", body: "Deep research synthesis across any industry — patent search, academic papers, and market data." },
    ],
    useCases: [
      { icon: "💡", label: "Strategy Consultants", detail: "Research and deliverables in hours, not days." },
      { icon: "📈", label: "Marketing Consultants", detail: "Full campaign strategies, audits, and creative briefs — AI-generated." },
      { icon: "💰", label: "Finance & Operations", detail: "Process audits, financial models, and org design — automated analysis." },
      { icon: "🤝", label: "Boutique Agencies", detail: "Serve 3x more clients without adding headcount." },
    ],
    proof: [
      { stat: "3x", label: "Client capacity without hiring" },
      { stat: "122", label: "AI-powered apps included" },
      { stat: "80%", label: "Reduction in research time" },
      { stat: "$97", label: "Per month. ROI on one extra client per year." },
    ],
    cta: "Start Free — No Card Required",
    ctaSecondary: "See Consulting Tools",
    metaTitle: "AI Platform for Independent Consultants | CreateAI Brain",
    metaDesc: "Scale your consulting practice without hiring. AI research, strategy deliverables, client management, and billing — all in one platform. $97/mo.",
    keywords: "AI for consultants, consulting software, AI research tool, strategy deliverable AI, consultant platform, boutique agency software",
  },
};

const ALL_INDUSTRIES = Object.values(INDUSTRIES);

function useMetaTags(title: string, description: string, keywords: string) {
  useEffect(() => {
    document.title = title;
    let metaDesc = document.querySelector("meta[name='description']");
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);

    let metaKw = document.querySelector("meta[name='keywords']");
    if (!metaKw) {
      metaKw = document.createElement("meta");
      metaKw.setAttribute("name", "keywords");
      document.head.appendChild(metaKw);
    }
    metaKw.setAttribute("content", keywords);

    let ogTitle = document.querySelector("meta[property='og:title']");
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", title);

    let ogDesc = document.querySelector("meta[property='og:description']");
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute("content", description);

    return () => { document.title = "CreateAI Brain"; };
  }, [title, description, keywords]);
}

interface SEOLandingPageProps {
  industry: string;
}

export default function SEOLandingPage({ industry }: SEOLandingPageProps) {
  const [, navigate] = useLocation();
  const config = INDUSTRIES[industry];

  useMetaTags(
    config?.metaTitle ?? "CreateAI Brain — AI Operating System",
    config?.metaDesc ?? "122 AI apps for every industry. One platform. $97/mo.",
    config?.keywords ?? "AI platform, AI tools, AI software",
  );

  if (!config) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter,sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>Industry Not Found</h1>
          <p style={{ color: "#64748b", marginTop: 8 }}>We don't have a page for that industry yet.</p>
          <button onClick={() => navigate("/")} style={{ marginTop: 20, background: INDIGO, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Go to CreateAI Brain →
          </button>
        </div>
      </div>
    );
  }

  const DARK_BG = "linear-gradient(135deg, hsl(220,20%,10%) 0%, hsl(240,25%,14%) 50%, hsl(255,30%,12%) 100%)";

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", color: "#0f172a" }}>

      {/* Hero */}
      <div style={{ background: DARK_BG, padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 100, padding: "6px 16px", marginBottom: 24 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#a5b4fc" }}>{config.title} — Available Now</span>
          </div>

          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, color: "#f1f5f9", lineHeight: 1.1, marginBottom: 20 }}>
            {config.headline}
          </h1>
          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(148,163,184,0.85)", lineHeight: 1.7, marginBottom: 36 }}>
            {config.subheadline}
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/")}
              style={{ background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`, color: "#fff", border: "none", borderRadius: 14, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 32px rgba(99,102,241,0.40)" }}>
              {config.cta}
            </button>
            <button onClick={() => navigate("/")}
              style={{ background: "rgba(255,255,255,0.08)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              {config.ctaSecondary}
            </button>
          </div>
        </div>
      </div>

      {/* Proof stats */}
      <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "36px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24 }}>
          {config.proof.map(p => (
            <div key={p.stat} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: INDIGO, lineHeight: 1 }}>{p.stat}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Problem / Solution */}
      <div style={{ padding: "64px 24px", maxWidth: 840, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
          <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 16, padding: "28px 24px" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>❌</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#991b1b", marginBottom: 12 }}>The Problem</h2>
            <p style={{ fontSize: 14, color: "#7f1d1d", lineHeight: 1.7 }}>{config.problem}</p>
          </div>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 16, padding: "28px 24px" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#166534", marginBottom: 12 }}>The Solution</h2>
            <p style={{ fontSize: 14, color: "#14532d", lineHeight: 1.7 }}>{config.solution}</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: "0 24px 64px", maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, textAlign: "center", marginBottom: 36, color: "#0f172a" }}>
          Everything You Need, Built In
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {config.features.map(f => (
            <div key={f.title} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Use Cases */}
      <div style={{ background: "#f8fafc", padding: "64px 24px" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, textAlign: "center", marginBottom: 36, color: "#0f172a" }}>
            Built For Your Specific Practice
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {config.useCases.map(uc => (
              <div key={uc.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{uc.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{uc.label}</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{uc.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All other industries nav */}
      <div style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 8, color: "#0f172a" }}>
            CreateAI Brain Works For Every Industry
          </h2>
          <p style={{ textAlign: "center", fontSize: 14, color: "#64748b", marginBottom: 32 }}>
            122 AI apps, one platform. Pick your industry to see what's built for you.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {ALL_INDUSTRIES.map(ind => (
              <a key={ind.slug} href={`/for/${ind.slug}`}
                style={{ background: ind.slug === industry ? INDIGO : "#f1f5f9", color: ind.slug === industry ? "#fff" : "#475569", border: `1px solid ${ind.slug === industry ? INDIGO : "#e2e8f0"}`, borderRadius: 100, padding: "8px 18px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                {ind.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ background: DARK_BG, padding: "64px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, color: "#f1f5f9", marginBottom: 16 }}>
            Start free today
          </h2>
          <p style={{ fontSize: 15, color: "rgba(148,163,184,0.85)", marginBottom: 32, lineHeight: 1.6 }}>
            No credit card. No setup fees. Full access to all 122 apps. Payment via Cash App ($CreateAIDigital) or Venmo (@CreateAIDigital) when you upgrade.
          </p>
          <button onClick={() => navigate("/")}
            style={{ background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`, color: "#fff", border: "none", borderRadius: 14, padding: "16px 36px", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 32px rgba(99,102,241,0.45)" }}>
            {config.cta}
          </button>
        </div>
      </div>

      {/* SEO Footer */}
      <div style={{ background: "#0f172a", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "rgba(148,163,184,0.5)", marginBottom: 8 }}>
          CreateAI Brain · Lakeside Trinity LLC · {new Date().getFullYear()}
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {ALL_INDUSTRIES.map(ind => (
            <a key={ind.slug} href={`/for/${ind.slug}`} style={{ fontSize: 11, color: "rgba(148,163,184,0.4)", textDecoration: "none" }}>
              AI for {ind.title.replace(" AI", "")}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export { INDUSTRIES, ALL_INDUSTRIES };
