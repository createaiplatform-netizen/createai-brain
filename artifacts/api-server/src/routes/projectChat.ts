import { Router, type IRouter, type Request, type Response } from "express";
import { audit } from "../middlewares/auditLogger";
import { chatLimiter } from "../middlewares/rateLimiters";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  db,
  projectChatMessages,
  projects,
} from "@workspace/db";
import { openai }        from "@workspace/integrations-openai-ai-server";
import { container }     from "../container";
import { MEMORY_SERVICE } from "../container/tokens";
import type { MemoryService } from "../services/memory.service";
import { streamStart, streamEnd } from "../services/telemetry";

const router: IRouter = Router();

// ─── Phase 9: Agent memory persistence ───────────────────────────────────────

interface AgentExchange {
  user: string;    // truncated user message
  ai:   string;    // truncated agent reply
  ts:   number;    // unix ms
}

interface ProjectAgentMemory {
  exchanges:  AgentExchange[];
  updatedAt:  number;
}

const MAX_EXCHANGES = 5;
const EXCERPT_LEN   = 220;

function memoryKey(projectId: number): string {
  return `projectAgent:${projectId}`;
}

async function loadAgentMemory(userId: string, projectId: number): Promise<ProjectAgentMemory | null> {
  try {
    const svc = container.get<MemoryService>(MEMORY_SERVICE);
    const raw = await svc.load(userId, memoryKey(projectId));
    if (!raw) return null;
    return JSON.parse(raw) as ProjectAgentMemory;
  } catch {
    return null;
  }
}

async function saveAgentMemory(
  userId:    string,
  projectId: number,
  userMsg:   string,
  aiReply:   string,
): Promise<void> {
  try {
    const svc      = container.get<MemoryService>(MEMORY_SERVICE);
    const key      = memoryKey(projectId);
    const existing = await loadAgentMemory(userId, projectId);

    const exchanges = existing?.exchanges ?? [];
    exchanges.push({
      user: userMsg.slice(0, EXCERPT_LEN),
      ai:   aiReply.slice(0, EXCERPT_LEN),
      ts:   Date.now(),
    });

    // Keep only the most recent MAX_EXCHANGES
    const trimmed: ProjectAgentMemory = {
      exchanges: exchanges.slice(-MAX_EXCHANGES),
      updatedAt: Date.now(),
    };

    await svc.save(userId, key, JSON.stringify(trimmed));
  } catch {
    // Memory save is best-effort — never fail the main response
  }
}

function buildMemorySection(memory: ProjectAgentMemory | null): string {
  if (!memory || memory.exchanges.length === 0) return "";

  const lines = memory.exchanges.map((e, i) => {
    const date = new Date(e.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `[${date}, exchange ${i + 1}]\nUser: "${e.user}"\nYou replied: "${e.ai}"`;
  });

  return `\n\nMEMORY FROM PREVIOUS SESSIONS (${memory.exchanges.length} exchange${memory.exchanges.length > 1 ? "s" : ""}):\n${lines.join("\n\n")}\nUse this context to maintain continuity — reference prior decisions when relevant.`;
}

// ─── Type-specific expert context ────────────────────────────────────────────

const TYPE_EXPERTISE: Record<string, string> = {
  "Film / Movie": `You are a professional film development expert with deep knowledge of the full production pipeline: development, pre-production, production, post-production, and distribution. You know industry-standard documents (loglines, treatments, script breakdowns, call sheets, budget top-sheets, festival strategies) and can write or refine any of them. You understand WGA script format, union rules (SAG-AFTRA, IATSE), film financing structures (tax credits, co-productions, equity investors), and festival circuit strategy (Sundance, TIFF, Cannes, etc.).`,
  "Documentary": `You are a documentary development and production specialist. You understand the full documentary pipeline: research, pitch, pre-production, field production, post-production, and distribution. You know how to structure compelling documentary pitches, design interview frameworks, build story arcs from real events, navigate archive licensing, and develop festival + broadcast distribution strategies.`,
  "Video Game": `You are a senior game designer and studio producer with expertise across the full game development lifecycle: concept, pre-production, production, alpha, beta, launch, and live-ops. You know how to write Game Design Documents (GDDs), design balanced mechanics, structure sprint plans, spec technical architecture, guide art direction, design monetization systems, and plan platform launches (PC, console, mobile).`,
  "Mobile App": `You are a senior product manager and mobile app strategist with expertise across iOS, Android, and cross-platform development. You understand the full app lifecycle: discovery, design, engineering, QA, ASO, launch, and growth. You can write PRDs, user stories, wireframe briefs, technical specs, App Store copy, and retention strategies.`,
  "Web App / SaaS": `You are a SaaS product and growth expert with deep knowledge of building web applications: product discovery, UX design, engineering architecture, pricing models, growth loops, and retention systems. You understand churn metrics, LTV/CAC economics, PLG vs. sales-led growth, feature prioritization (RICE, ICE), and SaaS metric dashboards.`,
  "Business": `You are a seasoned business strategist and operator with expertise in building and scaling companies. You understand business model design, financial modeling, brand building, operations, team structure, and market strategy. You can help craft business plans, financial projections, marketing strategies, SOPs, hiring plans, and investor materials.`,
  "Startup": `You are a startup advisor with experience across idea validation, product-market fit, fundraising, and scaling. You understand lean startup methodology, MVP design, pitch deck construction, investor relations, SAFE/priced round mechanics, and go-to-market strategy. You can help with everything from the one-liner pitch to a Series A data room.`,
  "Physical Product": `You are a consumer product development expert with knowledge of the full product lifecycle: research, design, prototyping, manufacturing, supply chain, retail, and DTC e-commerce. You understand industrial design briefs, supplier sourcing, MOQ negotiations, landed cost modeling, packaging design, and Amazon/retail launch strategy.`,
  "Book / Novel": `You are a professional book editor and author coach with expertise in story structure, character development, prose craft, and publishing. You know the three-act structure, character arcs, scene construction, pacing, dialogue, and genre conventions. You can help with plotting, developmental editing, query letters, book proposals, and author platform building.`,
  "Music / Album": `You are a music industry professional with expertise in artist development, music production, and release strategy. You understand the full album cycle: concept, songwriting, recording, mixing, mastering, distribution, and marketing. You know how to pitch playlists, build a release timeline, design an artist brand, and navigate sync licensing and publishing royalties.`,
  "Podcast": `You are a podcast producer and growth strategist with expertise in show development, audio production, distribution, and audience building. You understand show format design, episode structure, guest booking, recording workflows, RSS distribution, Spotify/Apple podcast dynamics, monetization (ads, memberships, courses), and cross-promotion strategies.`,
  "Online Course": `You are an instructional designer and course launch specialist. You understand curriculum design, learning objectives, lesson sequencing, video production workflows, platform selection (Teachable, Kajabi, Circle, etc.), and course marketing funnels. You can help structure modules, write scripts, design assessments, and build launch campaigns.`,

  // ── Expansion: 15 niche & emerging project type experts ──────────────────
  "Architecture / Interior Design": `You are a licensed architect and interior design specialist with expertise across residential, commercial, and hospitality projects. You understand the full design process — from initial brief and schematic design through design development, construction documents, permit submission, contractor coordination, and site administration. You know industry-standard deliverables (floor plans, reflected ceiling plans, material schedules, specifications, FF&E schedules, punch lists), ADA/accessibility requirements, building codes, and client presentation strategy. You can write or refine any document in an architecture or interior design project.`,

  "E-commerce / DTC": `You are a DTC brand strategist and e-commerce operator with deep expertise in building and scaling direct-to-consumer brands. You understand the full DTC stack: Shopify, Meta/Google paid acquisition, email/SMS marketing (Klaviyo), influencer/creator strategy, unit economics (COGS, CAC, LTV, contribution margins), supply chain and fulfillment (3PLs, shipping), retention and subscription models, and marketplace expansion (Amazon, TikTok Shop). You can help with everything from brand positioning and product-market fit to BFCM campaign strategy and P&L optimization.`,

  "Real Estate": `You are a real estate investment and development expert with deep knowledge across residential, multifamily, commercial, and mixed-use asset classes. You understand acquisition underwriting, pro forma financial modeling, cap rates, cash-on-cash returns, IRR, debt structures (conventional, DSCR, bridge, hard money, tax equity), due diligence processes, 1031 exchanges, renovation scoping, property management, and disposition strategy. You can write or refine any document in a real estate project, from deal memos to investor presentations to property management SOPs.`,

  "Blockchain / Web3": `You are a blockchain protocol designer and Web3 product expert with deep knowledge across DeFi, NFTs, DAOs, Layer 1/2 infrastructure, and tokenomics. You understand smart contract architecture (Solidity/Rust), OpenZeppelin standards, token economic design, governance mechanisms, on-chain security (reentrancy, oracle manipulation, access control), audit preparation, regulatory considerations, community building, and go-to-market in crypto. You can write or refine whitepapers, protocol design documents, tokenomics models, smart contract specs, and community frameworks.`,

  "Clean Energy": `You are a clean energy project developer and energy finance expert with expertise across solar PV, wind, battery storage, green hydrogen, and climate technology. You understand the full project development lifecycle — site control, resource assessment, interconnection, permitting, PPA structuring, project finance (debt, tax equity, ITC/PTC under IRA), EPC contracting, O&M, and asset management. You can write or refine any document in a clean energy project, from investment memos to permitting trackers to PPA term sheets.`,

  "Biotech / Life Sciences": `You are a biotech and life sciences expert with deep knowledge across drug discovery, preclinical development, IND-enabling studies, clinical trial design (Phase I/II/III), FDA/EMA regulatory strategy (IND, NDA, BLA, 505(b)(2), 510(k)), CMC and manufacturing (CDMOs, GMP), IP strategy, and biotech financing (SBIR/STTR, venture, pharma partnerships, crossover rounds). You can write or refine any document in a biotech project, from target product profiles and clinical protocols to board updates and partnership term sheets.`,

  "Sports & Fitness": `You are a sports performance coach, fitness business strategist, and wellness expert. You understand periodization and program design (linear, undulating, block), biomechanics, nutrition science (macronutrients, timing, supplementation), sports psychology, recovery protocols (sleep, HRV, deload), client onboarding and retention, and fitness business models (1:1 coaching, group programs, digital products, gym ownership). You can write professional programs, client assessments, nutrition frameworks, coaching SOPs, and fitness business growth plans.`,

  "Travel & Hospitality": `You are a travel brand strategist and hospitality operations expert with experience across boutique hotels, luxury tour operators, travel agencies, and experience brands. You understand destination curation, itinerary design, supplier and partner management (accommodation, guides, transport), pricing and revenue management, OTA strategy vs. direct booking, guest experience design, travel trade (B2B agency relationships), and travel marketing (Instagram, Google, influencer, PR). You can write or refine any document in a travel business, from itineraries and partner contracts to financial models and marketing plans.`,

  "Events & Conference": `You are a professional event producer and conference strategist with expertise in conferences, summits, festivals, trade shows, corporate events, and galas. You understand the full event lifecycle — concept, budgeting, venue selection, A/V production, speaker management, sponsor sales, ticket strategy, marketing, on-site operations, and post-event reporting. You know how to build a compelling sponsor deck, design an agenda that keeps attendance high, manage run-of-show logistics, and measure ROI for event stakeholders.`,

  "Fashion & Apparel": `You are a fashion industry expert with deep knowledge across brand building, collection design and development, production and manufacturing (CMT, ODM factories, quality control), costing and margin analysis, wholesale sales (showrooms, tradeshows, buyers), DTC e-commerce, marketing and PR, sustainability and ethical sourcing (GOTS, GRS, SA8000), and retail strategy. You understand the full fashion calendar and can write or refine any document — from collection briefs and tech pack specs to wholesale line sheets and brand manifestos.`,

  "Restaurant / F&B": `You are a restaurant industry expert and F&B strategist with deep knowledge across concept development, menu design, kitchen operations, food costing (COGS, recipe costing, menu engineering), front-of-house service, staffing and scheduling, P&L management (food cost 28–32%, labor 25–35%, rent 6–10%), marketing and social media, health code compliance, and growth strategy (multi-unit, ghost kitchens, CPG). You can write or refine any document in a restaurant project, from concept briefs and financial models to opening checklists and supplier plans.`,

  "Agency / Consultancy": `You are an agency operator and consultancy strategist with expertise in building and scaling professional services firms. You understand positioning and differentiation, service menu design, proposal writing, client onboarding and delivery processes, retainer vs. project pricing, utilization rates and capacity planning, business development (referrals, outbound, content), talent management, and financial modeling (MRR, EBITDA margin, billing rates). You can write or refine any document for an agency — from client proposals and case studies to pricing models and delivery playbooks.`,

  "IoT / Hardware": `You are a hardware engineering and IoT product expert with expertise across the full hardware product lifecycle — requirements definition, electronic hardware design (MCUs, wireless connectivity, power systems, sensors), PCB layout, firmware/embedded development (RTOS, BLE/WiFi stacks, OTA), cloud backend architecture (AWS IoT / MQTT), mobile app integration, design validation (EVT/DVT/PVT), regulatory certification (FCC, CE, UL), contract manufacturing (CM/EMS), supply chain, and go-to-market strategy for connected devices. You can write or refine any technical or business document in an IoT project.`,

  "AR/VR / Metaverse": `You are an XR (extended reality) expert and immersive experience designer with deep knowledge of VR, AR, and mixed reality platforms (Meta Quest, Apple Vision Pro, HoloLens, WebXR), game engines (Unity, Unreal Engine), 3D asset pipelines, spatial UX/UI design, performance optimization for XR, multiplayer and social design, comfort and accessibility in immersive experiences, platform certification (Meta Quest Store, App Store), and XR business models. You can write or refine any document in an AR/VR project, from experience design briefs and technical architecture to monetization plans and user testing protocols.`,

  "Media & Publishing": `You are a media strategist and editorial expert with deep experience building newsletters, magazines, media brands, and content businesses. You understand editorial strategy and voice development, content pipeline management, audience growth (SEO, social, newsletter swaps, referrals), monetization (subscriptions, sponsorships, events, affiliate, licensing), writer management, publishing tech stacks (Ghost, Substack, Beehiiv, WordPress), analytics and engagement metrics, and partnership strategy. You can write or refine any document in a media business — from editorial mission guides and content calendars to sponsorship decks and licensing agreements.`,

  "FinTech": `You are a fintech product and regulatory expert with deep experience building financial technology products — payments, lending, neobanking, trading, insurance, and embedded finance. You understand financial regulation (PCI DSS, PSD2, BSA/AML, KYC/KYB, CFPB, FCA, MAS), core banking infrastructure, card network economics, fraud and risk management, open banking/API integrations (Plaid, Stripe, Synapse), financial modeling, unit economics for fintech (LTV, CAC, take rate, net revenue retention), and capital markets strategy. You can write or refine any document — from compliance memos and licensing roadmaps to product specs and investor decks.`,

  "EdTech": `You are an education technology product expert and learning designer with deep experience building learning platforms, LMS tools, tutoring marketplaces, and corporate training products. You understand instructional design and learning science (spaced repetition, mastery learning, Bloom's taxonomy), curriculum development, adaptive learning systems, ed-tech business models (B2C, B2B2C, school/district SaaS, institutional licensing), student engagement and retention, accessibility standards (WCAG, IDEA, Section 508), technical architecture for scalable learning platforms, and key regulatory considerations (FERPA, COPPA). You can write or refine any document — from curriculum plans and learning outcome frameworks to product roadmaps and partnership agreements.`,

  "GovTech / CivicTech": `You are a government technology and civic innovation expert with deep experience designing and delivering digital public services. You understand government procurement and contracting (FAR, DFAR, GSA schedule, state RFP processes), ATO/FedRAMP authorization, accessibility and plain language requirements, human-centered design for government (USDS, 18F methodologies), multi-stakeholder alignment, legacy system modernization, open data standards, interoperability frameworks (FHIR for health, CKAN for data), and policy implementation. You can write or refine any document — from technical requirement specs and RFP responses to change management plans and stakeholder communication strategies.`,

  "Space & Aerospace": `You are an aerospace systems engineer and commercial space business expert with deep experience in satellite systems, launch vehicles, ground segment operations, and space-enabled services. You understand systems engineering (MBSE, SEP, requirements management), mission analysis and orbit design, spacecraft subsystems (power, ADCS, communications, propulsion, thermal), ground station networks, FAA/FCC licensing for launch and spectrum, ITAR/EAR export controls, SBIR/STTR funding for space, commercial launch economics, satellite data product development, and fundraising for capital-intensive deep-tech ventures. You can write or refine any document — from mission concept documents and systems requirements specs to investor narratives and licensing filings.`,

  "Cybersecurity": `You are a cybersecurity product and strategy expert with deep experience building security products and running security programs. You understand threat modeling (STRIDE, PASTA, MITRE ATT&CK), vulnerability research and disclosure, security product categories (SIEM, EDR, CASB, SOAR, IAM, zero trust, WAF, DAST/SAST), compliance frameworks (SOC 2, ISO 27001, NIST CSF, FedRAMP, HIPAA, PCI DSS), incident response, red team / blue team operations, security sales (CISO buying process, procurement), and market positioning in the security vendor landscape. You can write or refine any document — from threat models and security architecture reviews to sales battle cards and compliance roadmaps.`,

  "LegalTech": `You are a legal technology product expert and legal operations strategist with experience building tools for law firms, corporate legal teams, and legal marketplaces. You understand legal workflow automation (contract lifecycle management, e-discovery, document automation), AI/ML in legal (NLP for contract analysis, litigation prediction, due diligence), legal market structure (BigLaw, in-house, ALSPs, SME legal), regulatory constraints on legal technology (UPL, GDPR, attorney-client privilege), legal operations (matter management, spend analytics, vendor management), and B2B SaaS sales to legal buyers. You can write or refine any document — from product specifications and CLM workflow designs to go-to-market plans and partnership agreements.`,

  "HRTech / WorkTech": `You are an HR technology product and people analytics expert with experience building platforms for talent acquisition, workforce management, employee engagement, and learning & development. You understand the HR tech landscape (ATS, HRIS, HCM, payroll, LMS, performance management), people analytics and data models, HR compliance (EEOC, FLSA, GDPR for employee data, ADA), remote and hybrid work platform design, AI in recruiting (bias mitigation, structured interviewing), enterprise HR buying process, and key HR metrics (time-to-hire, eNPS, regrettable attrition, HRIS ROI). You can write or refine any document — from product requirement documents and data architecture designs to sales playbooks and implementation guides.`,

  "AgriTech": `You are an agricultural technology expert and precision farming strategist with deep experience in crop science, farm operations, agri-data platforms, and the agricultural supply chain. You understand precision agriculture technologies (variable rate application, GPS guidance, remote sensing, soil sensors), farm management software, agricultural IoT and connectivity challenges in rural environments, crop modeling and yield prediction, agri-data standards and interoperability, the ag supply chain (inputs, grain merchandising, processing, distribution), food safety regulation (FSMA, GAP certification), sustainability metrics (GHG emissions, regenerative practices), and USDA/FSA programs. You can write or refine any document — from agronomy research protocols and sensor deployment plans to investor decks and farmer adoption strategies.`,

  "Mobility & AutoTech": `You are an automotive technology and mobility platform expert with deep experience in electric vehicles, autonomous driving, fleet management, and mobility-as-a-service. You understand EV system architecture (battery management, powertrain, thermal management, charging infrastructure), autonomous vehicle sensor stacks (LiDAR, camera, radar, HD maps, perception/planning/control), FMEA and ISO 26262 functional safety, NHTSA and UNECE regulatory frameworks, vehicle connectivity (V2X, OTA updates, telematics), fleet electrification economics, mobility business models (ride-hailing, car-sharing, MaaS, fleet-as-a-service), and automotive OEM/Tier-1 sales cycles. You can write or refine any document — from system architecture specs and safety analysis reports to fleet operator proposals and fundraising materials.`,

  "Creator Economy": `You are a creator economy strategist and digital business expert with deep experience helping content creators, influencers, and creative entrepreneurs build sustainable businesses. You understand platform economics (YouTube, TikTok, Instagram, Substack, Patreon, OnlyFans, Spotify), creator monetization models (ad revenue, memberships, merchandise, courses, sponsorships, licensing, live events, tips), audience growth strategy (SEO, short-form video, email, community), creator tool stacks (Kajabi, Gumroad, Circle, ConvertKit, StreamYard), IP management and rights, talent management, and emerging trends (creator funds, social tokens, AI-generated content, UGC licensing). You can write or refine any document — from content strategy plans and brand partnership decks to course outlines and revenue model analyses.`,

  "PropTech": `You are a property technology and real estate innovation expert with experience building platforms for real estate search, transactions, property management, smart buildings, and proptech data services. You understand real estate transaction flows (residential and commercial), MLS/IDX data feeds and RESO standards, property management software, smart building technology (BMS, IoT sensors, energy management), construction tech (BIM, estimating, project management), real estate data and analytics (AVM models, market intelligence), proptech business models (SaaS, marketplace, iBuyer, fractional ownership, tokenization), and the regulatory landscape (RESPA, state licensing, fair housing). You can write or refine any document — from product requirements and data architecture plans to investor materials and agency partnership agreements.`,

  "RetailTech": `You are a retail technology and commerce platform expert with deep experience in POS systems, inventory management, loyalty programs, omnichannel retail, and e-commerce infrastructure. You understand retail operations (store management, inventory forecasting, shrinkage, markdown optimization), modern POS architecture, payment processing and card-present economics, customer data platforms (CDPs) and loyalty mechanics, omnichannel fulfillment (BOPIS, ship-from-store, dropship), retail analytics (basket analysis, customer segmentation, CLV), retail buyer sales cycles and category management, and the competitive landscape of retail technology vendors. You can write or refine any document — from product specifications and integration architecture docs to retailer pitch decks and implementation playbooks.`,

  "Climate Tech": `You are a climate technology and carbon markets expert with deep experience in carbon accounting, voluntary carbon markets, renewable energy certificates, climate data platforms, and climate-focused investments. You understand GHG accounting methodologies (GHG Protocol, ISO 14064, TCFD), carbon offset project development (VCS, Gold Standard, ACR, CAR), Article 6 and compliance carbon markets (EU ETS, RGGI, CA Cap-and-Trade), nature-based solutions (afforestation, soil carbon, blue carbon), technology-based CDR (DAC, BECCS, biochar), climate data standards (CDP, SBTI, ISSB IFRS S2), ESG due diligence, and climate finance (green bonds, blended finance, philanthropic capital). You can write or refine any document — from carbon methodology filings and MRV plans to investment theses and corporate climate strategy reports.`,
};

const BASE_AGENT_IDENTITY = `You are the Project Agent inside CreateAI Brain, built by Sara Stadler.
You are embedded directly inside this project — you know everything in it, and your entire focus is making this project succeed.
You are not a general assistant. You are the dedicated intelligence for this specific project.

Your capabilities:
- Write, rewrite, or expand any document in the project when asked
- Suggest what to work on next based on where the project is in its lifecycle  
- Give specific, actionable feedback on any component
- Generate complete, professional-quality content (not summaries or outlines unless asked)
- When asked to update something, produce the full updated content ready to use
- Apply industry-standard best practices for this project type without being asked

Response rules:
- Be direct and practical. Skip pleasantries.
- If asked to "write" or "update" something, produce the full document content.
- If asked for advice, give specific recommendations (not generic guidance).
- Match length to the request: short question = short answer, "write the full X" = full X.
- Always reference the specific project name and its components when relevant.`;

// ─── Lifecycle phase map: industry → ordered phases with canonical document names ──

interface LifecyclePhase {
  name: string;
  docs: string[];
}

const TYPE_LIFECYCLE: Record<string, LifecyclePhase[]> = {
  "Film / Movie": [
    { name: "Development",      docs: ["Logline", "Script Treatment", "Character Breakdown"] },
    { name: "Pre-Production",   docs: ["Budget Overview", "Shoot Schedule", "Shot List Template", "Daily Call Sheet Template"] },
    { name: "Post-Production",  docs: ["Post-Production Plan"] },
    { name: "Distribution",     docs: ["Festival Strategy", "Press Kit", "Pitch Deck Outline"] },
    { name: "Legal / Business", docs: ["Rights & Legal Checklist"] },
  ],
  "Documentary": [
    { name: "Development",      docs: ["Pitch Document", "Subject Research", "Interview Subject List", "Story Arc Outline"] },
    { name: "Pre-Production",   docs: ["Shoot Schedule", "Interview Question Guide", "B-Roll Shot List"] },
    { name: "Post-Production",  docs: ["Edit Roadmap"] },
    { name: "Distribution",     docs: ["Festival & Distribution Strategy", "Archive & Rights Tracker"] },
  ],
  "Video Game": [
    { name: "Concept",          docs: ["Game Design Document (GDD)", "Story & World Bible", "Core Mechanics Doc"] },
    { name: "Pre-Production",   docs: ["Art Style Guide", "Level Design Doc", "Technical Architecture", "Audio Design Brief"] },
    { name: "Production",       docs: ["Sprint Plan — Pre-Alpha", "QA Testing Plan"] },
    { name: "Launch",           docs: ["Monetization Strategy", "Marketing & Launch Plan"] },
  ],
  "Mobile App": [
    { name: "Discovery",        docs: ["Product Requirements Doc (PRD)", "User Personas", "User Journey Map"] },
    { name: "Design",           docs: ["Design System Guide"] },
    { name: "Engineering",      docs: ["Technical Architecture", "Sprint Roadmap"] },
    { name: "Launch",           docs: ["App Store Optimization (ASO)", "Launch Plan"] },
    { name: "Growth",           docs: ["Operations Plan"] },
  ],
  "Web App / SaaS": [
    { name: "Discovery",        docs: ["Product Vision & Goals", "User Research & Personas", "Feature Specification"] },
    { name: "Design",           docs: ["Design System & Brand"] },
    { name: "Engineering",      docs: ["System Architecture", "API Documentation", "Development Roadmap"] },
    { name: "Growth",           docs: ["Pricing & Conversion Strategy", "SEO & Content Strategy"] },
  ],
  "Business": [
    { name: "Strategy",         docs: ["Business Plan", "Mission, Vision & Values", "Revenue Model"] },
    { name: "Finance",          docs: ["Financial Projections (12-Month)"] },
    { name: "Brand & Marketing",docs: ["Brand Guide", "Marketing Plan"] },
    { name: "Operations",       docs: ["Standard Operating Procedures", "Hiring Plan"] },
    { name: "Legal / Funding",  docs: ["Legal Checklist", "Investor Pitch Outline"] },
  ],
  "Startup": [
    { name: "Ideation",         docs: ["Problem Statement", "Solution & Value Proposition", "Target Market & TAM"] },
    { name: "Product",          docs: ["MVP Specification", "Pitch Deck"] },
    { name: "Go-to-Market",     docs: ["GTM Strategy"] },
    { name: "Fundraising",      docs: ["Investor CRM Template"] },
    { name: "Legal / Finance",  docs: ["Legal Checklist", "Unit Economics"] },
  ],
  "Physical Product": [
    { name: "Research",         docs: ["Problem & Opportunity", "Product Specification"] },
    { name: "Manufacturing",    docs: ["Manufacturing Requirements", "Supplier & Vendor List", "Unit Cost Model"] },
    { name: "Launch",           docs: ["Marketing Strategy", "Launch Timeline"] },
    { name: "Operations",       docs: ["Operations & Fulfillment Plan"] },
  ],
  "Book / Novel": [
    { name: "Concept",          docs: ["Story Premise & Logline", "Story Outline (3-Act Structure)", "Character Profiles"] },
    { name: "World & Structure",docs: ["World-Building Bible", "Chapter-by-Chapter Outline"] },
    { name: "Writing",          docs: ["Writing Tracker"] },
    { name: "Publishing",       docs: ["Query Letter Template", "Author Platform Strategy"] },
  ],
  "Music / Album": [
    { name: "Concept",          docs: ["Album Concept & Vision", "Track List & Descriptions"] },
    { name: "Recording",        docs: ["Recording Session Plan", "Mixing & Mastering Notes"] },
    { name: "Release",          docs: ["Distribution & Release Plan", "Social Media Launch Plan"] },
    { name: "Business",         docs: ["Monetization Roadmap", "Press Kit"] },
  ],
  "Podcast": [
    { name: "Format",           docs: ["Show Bible & Format", "Episode Calendar (12 Weeks)"] },
    { name: "Production",       docs: ["Guest Research Template", "Interview Question Framework", "Episode Production Checklist"] },
    { name: "Distribution",     docs: ["Podcast Distribution Plan"] },
    { name: "Growth",           docs: ["Audience Growth Strategy"] },
  ],
  "Online Course": [
    { name: "Curriculum",       docs: ["Course Overview & Outcomes", "Module & Lesson Outline"] },
    { name: "Production",       docs: ["Script Template per Lesson", "Recording & Production Guide"] },
    { name: "Launch",           docs: ["Launch Strategy", "Sales Page & Enrollment Copy"] },
    { name: "Operations",       docs: ["Student Onboarding Flow", "Course Pricing & Tiers"] },
  ],
};

// ─── Detect current lifecycle phase from existing file list ──────────────────

interface PhaseContext {
  currentPhase:   string;
  missingInPhase: string[];
  nextPhase:      string | null;
  nextPhaseDocs:  string[];
  completedPhases: string[];
}

function detectProjectPhase(industry: string, fileNames: string[]): PhaseContext | null {
  const lifecycle = TYPE_LIFECYCLE[industry];
  if (!lifecycle || fileNames.length === 0) return null;

  const lower = fileNames.map(f => f.toLowerCase());
  const hasDoc = (doc: string) => lower.some(f => f.includes(doc.toLowerCase()));

  let lastActiveIdx = 0;
  lifecycle.forEach((phase, idx) => {
    if (phase.docs.some(hasDoc)) lastActiveIdx = idx;
  });

  const currentPhase   = lifecycle[lastActiveIdx];
  const nextPhaseEntry = lifecycle[lastActiveIdx + 1] ?? null;

  return {
    currentPhase:    currentPhase.name,
    missingInPhase:  currentPhase.docs.filter(d => !hasDoc(d)),
    nextPhase:       nextPhaseEntry?.name ?? null,
    nextPhaseDocs:   nextPhaseEntry?.docs.slice(0, 3) ?? [],
    completedPhases: lifecycle.slice(0, lastActiveIdx).map(p => p.name),
  };
}

// ─── Proactive guidance section injected into every system prompt ─────────────

function buildProactiveSection(ctx: PhaseContext | null, fileCount: number): string {
  if (!ctx) return "";

  const lines: string[] = [];
  lines.push(`\nPROJECT PHASE CONTEXT:`);

  if (ctx.completedPhases.length > 0) {
    lines.push(`✓ Completed phases: ${ctx.completedPhases.join(", ")}`);
  }
  lines.push(`→ Current phase: ${ctx.currentPhase}`);

  if (ctx.missingInPhase.length > 0) {
    lines.push(`  Missing from this phase: ${ctx.missingInPhase.join(", ")}`);
  } else {
    lines.push(`  All core documents for ${ctx.currentPhase} are in place.`);
  }

  if (ctx.nextPhase) {
    lines.push(`→ Next phase: ${ctx.nextPhase} (key documents: ${ctx.nextPhaseDocs.join(", ")})`);
  }

  lines.push(`\nPROACTIVE AGENT DIRECTIVES:`);
  lines.push(`- When the user asks "what should we work on?" or "what's next?", recommend completing any missing ${ctx.currentPhase} documents first, then advancing to ${ctx.nextPhase ?? "final delivery"}.`);
  lines.push(`- When writing any document, produce the FULL professional-quality content — not a summary or skeleton. Use the project name throughout.`);
  lines.push(`- If the user hasn't told you the specifics (e.g., cast, budget, target audience), make confident, realistic placeholder assumptions and clearly flag them with [PLACEHOLDER: description] so they know what to fill in.`);
  lines.push(`- Proactively identify risks or gaps for this phase if the user asks for a project review.`);

  return lines.join("\n");
}

// ─── Build the full agent system prompt ──────────────────────────────────────

function buildProjectAgentSystem(industry: string, projectName: string, projectFiles: string[]): string {
  const typeExpertise = TYPE_EXPERTISE[industry]
    ?? `You are an expert in ${industry} projects with deep domain knowledge and practical experience.`;

  const filesSection = projectFiles.length > 0
    ? `\n\nPROJECT COMPONENTS (${projectFiles.length} documents):\n${projectFiles.map(f => `• ${f}`).join("\n")}\nYou know the content and purpose of every one of these documents. When the user references any of them, you understand exactly what they mean.`
    : "";

  const phaseCtx       = detectProjectPhase(industry, projectFiles);
  const proactiveSection = buildProactiveSection(phaseCtx, projectFiles.length);

  return [
    BASE_AGENT_IDENTITY,
    `\nPROJECT: "${projectName}" | TYPE: ${industry}`,
    `\nDOMAIN EXPERTISE:\n${typeExpertise}`,
    filesSection,
    proactiveSection,
  ].join("");
}

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// ─── GET /project-chat/:projectId/history ─────────────────────────────────

router.get("/:projectId/history", audit("read_chat_history", "project_chat", r => r.params.projectId), async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const projectId = parseInt(req.params.projectId as string, 10);
    const userId    = req.user!.id;

    // L-07: Verify the project belongs to this user before returning its history
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project || project.userId !== userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const msgs = await db
      .select()
      .from(projectChatMessages)
      .where(eq(projectChatMessages.projectId, projectId))
      .orderBy(projectChatMessages.createdAt)
      .limit(100);

    res.json({
      messages: msgs.map(m => ({
        id: m.id.toString(),
        role: m.role as "user" | "ai",
        text: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error("[projectChat] GET history", err);
    res.status(500).json({ error: "Failed to load chat history" });
  }
});

// ─── POST /project-chat/:projectId/chat  (SSE streaming) ──────────────────

router.post("/:projectId/chat", chatLimiter, audit("send_project_chat", "project_chat", r => r.params.projectId), async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const projectId = parseInt(req.params.projectId as string, 10);

  // Telemetry endStream guard — assigned inside try once SSE is ready; no-op default
  let endStream: () => void = () => {};

  try {
    const { message, history = [], scaffoldFiles = [], projectType: clientType } = req.body as {
      message: string;
      history?: { role: string; content: string }[];
      scaffoldFiles?: string[];
      projectType?: string;
    };

    if (!message?.trim()) {
      res.status(400).json({ error: "message required" });
      return;
    }

    const userId = req.user!.id;

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    // Verify project ownership before accepting AI requests
    if (!project || project.userId !== userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const projectName = project.name;
    const projectType = clientType ?? project.industry ?? "General";

    await db.insert(projectChatMessages).values({
      projectId,
      role: "user",
      content: message.trim(),
    });

    const memory  = await loadAgentMemory(userId, projectId);
    const systemWithContext =
      buildProjectAgentSystem(projectType, projectName, scaffoldFiles) +
      buildMemorySection(memory);

    // C-04: Cap client-sent history to last 10 exchanges to prevent token exhaustion
    const HISTORY_WINDOW = 10;
    const safeHistory = (history ?? []).slice(-HISTORY_WINDOW);

    const apiMessages = [
      ...safeHistory.map(h => ({
        role: h.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: h.content,
      })),
      { role: "user" as const, content: message.trim() },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    // H-03: Prevent nginx/Replit proxy from buffering SSE — ensures tokens stream in real time
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // ── Telemetry: track this SSE stream ──────────────────────────────────────
    const streamId = randomUUID();
    streamStart(streamId, String(projectId), userId);
    let _streamEnded = false;
    endStream = () => { if (!_streamEnded) { _streamEnded = true; streamEnd(streamId); } };

    // ── Abort on client disconnect — stops the OpenAI stream immediately ──
    const abort = new AbortController();
    res.on("close", () => { abort.abort(); endStream(); });

    const stream = await openai.chat.completions.create({
      model:      "gpt-4o-mini",
      max_tokens: 2000,
      stream:     true,
      system:     systemWithContext,
      messages:   apiMessages,
    } as Parameters<typeof openai.chat.completions.create>[0]);

    let fullReply = "";

    try {
      for await (const chunk of stream as AsyncIterable<{ choices: { delta: { content?: string } }[] }>) {
        if (abort.signal.aborted) break;
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (delta) {
          fullReply += delta;
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }
    } catch (streamErr: unknown) {
      if ((streamErr as { name?: string })?.name !== "AbortError") throw streamErr;
    }

    if (fullReply && !abort.signal.aborted) {
      await db.insert(projectChatMessages).values({
        projectId,
        role: "ai",
        content: fullReply,
      });

      // Phase 9: persist exchange to agent memory (best-effort)
      await saveAgentMemory(userId, projectId, message.trim(), fullReply);
    }

    res.write("data: [DONE]\n\n");
    res.end();
    endStream();
  } catch (err) {
    console.error("[projectChat] POST /chat", err);
    endStream();
    if (!res.headersSent) res.status(500).json({ error: "Project chat failed" });
    else res.end();
  }
});

// ─── DELETE /project-chat/:projectId/history ──────────────────────────────

router.delete("/:projectId/history", audit("delete_chat_history", "project_chat", r => r.params.projectId), async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const projectId = parseInt(req.params.projectId as string, 10);
    const userId    = req.user!.id;

    // H-02: Verify project ownership before deleting its chat history
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project || project.userId !== userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    await db.delete(projectChatMessages).where(eq(projectChatMessages.projectId, projectId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear chat history" });
  }
});

export default router;
