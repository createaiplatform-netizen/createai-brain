import React, { useState, useEffect, useRef, useCallback } from "react";
import { MediaPlayer } from "../components/MediaPlayer";
import { streamProjectChat, contextStore, checkBillingEligibility, publishProject, unpublishProject } from "@/controller";
import { useUniversalResume } from "@/hooks/useUniversalResume";
import { ensureIdentityForProject } from "@/engine/IdentityEngine";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SalesModule, OpsModule, SupportModule, ComplianceModule, EnterpriseDashboard, StrategyModule, UXContentModule, PipelineView, MarketingModule, ProductModule, HRModule, FinanceModule } from "./InternalModules";
import { ProjectOutputLayer } from "./ProjectOutputLayer";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "output" | "dashboard+folders" | "dashboard" | "folders" | "simple" | "advanced" | "tasks" | "team" | "opportunities" | "portfolio" | "sales" | "ops" | "support" | "compliance" | "enterprise" | "strategy" | "ux" | "pipeline" | "marketing" | "product" | "hr" | "finance" | "observability";

// ─── Shared / Suggested Types ────────────────────────────────────────────────
interface SharedProject {
  id: string;
  name: string;
  industry: string;
  icon: string;
  color: string;
  status: string;
  role: string;
  ownerId: string;
}

interface SuggestedTemplate {
  id: string;
  icon: string;
  name: string;
  industry: string;
  description: string;
  tags: string[];
}

interface OpportunityItem {
  id: string;
  icon: string;
  title: string;
  category: string;
  summary: string;
  potential: string;
  effort: "Low" | "Medium" | "High";
}

// ─── Member Types ─────────────────────────────────────────────────────────────
interface ProjectMember {
  projectId: string;
  userId: string;
  addedByUserId: string;
  role: "owner" | "editor" | "viewer";
  createdAt?: string;
}

// ─── Task Types ───────────────────────────────────────────────────────────────
interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  assignedTo?: string;
  dueAt?: string;
  createdAt: string;
}

interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: string;
  created: string;
  folderId: string;
  content?: string;
}

interface ProjectFolder {
  id: string;
  name: string;
  icon: string;
  universal: boolean;
  count: number;
}

interface SubApp {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  industry: string;
  icon: string;
  color: string;
  created: string;
  status?: "active" | "archived";
  folders: ProjectFolder[];
  files: ProjectFile[];
  subApps: SubApp[];
}

// ─── Universal Folders ────────────────────────────────────────────────────────

const UNIVERSAL_FOLDERS: Omit<ProjectFolder, "count">[] = [
  { id: "apps",       name: "Apps",              icon: "🧩", universal: true },
  { id: "demo",       name: "Demo Mode",         icon: "🎭", universal: true },
  { id: "test",       name: "Test Mode",         icon: "🧪", universal: true },
  { id: "live",       name: "Live Mode",         icon: "🟢", universal: true },
  { id: "marketing",  name: "Marketing Packet",  icon: "📣", universal: true },
  { id: "company",    name: "Company Materials", icon: "🏢", universal: true },
  { id: "screens",    name: "Screens",           icon: "🖥️", universal: true },
  { id: "files",      name: "Files",             icon: "📁", universal: true },
  { id: "data",       name: "Data",              icon: "🗄️", universal: true },
];

const INDUSTRY_SPECIFIC: Record<string, { name: string; icon: string }[]> = {
  Healthcare:        [{ name: "Regulations", icon: "⚖️" }, { name: "Patient Records", icon: "🏥" }, { name: "Compliance", icon: "✅" }],
  Construction:      [{ name: "Plans & Blueprints", icon: "📐" }, { name: "Safety", icon: "🦺" }, { name: "Permits", icon: "📋" }, { name: "Equipment", icon: "🚧" }],
  Hunting:           [{ name: "Maps", icon: "🗺️" }, { name: "Gear Lists", icon: "🎒" }, { name: "Safety", icon: "🦺" }, { name: "Seasons & Regulations", icon: "📅" }],
  Farming:           [{ name: "Crop Plans", icon: "🌱" }, { name: "Equipment", icon: "🚜" }, { name: "Soil Data", icon: "🌍" }, { name: "Harvest Logs", icon: "📊" }],
  Education:         [{ name: "Curriculum", icon: "📚" }, { name: "Student Records", icon: "👤" }, { name: "Assessments", icon: "📝" }],
  Logistics:         [{ name: "Routes", icon: "🗺️" }, { name: "Fleet", icon: "🚛" }, { name: "Schedules", icon: "📅" }, { name: "Manifests", icon: "📋" }],
  Legal:             [{ name: "Cases", icon: "⚖️" }, { name: "Contracts", icon: "📄" }, { name: "Evidence", icon: "🔍" }],
  Technology:        [{ name: "Source Code", icon: "💻" }, { name: "APIs", icon: "🔌" }, { name: "Deployments", icon: "🚀" }],
  Nonprofit:         [{ name: "Donors", icon: "❤️" }, { name: "Grants", icon: "💰" }, { name: "Impact Reports", icon: "📊" }],
  Retail:            [{ name: "Inventory", icon: "📦" }, { name: "Suppliers", icon: "🤝" }, { name: "POS Data", icon: "🛒" }],
  General:           [{ name: "Notes", icon: "📝" }, { name: "Research", icon: "🔍" }],
  "Film / Movie":    [{ name: "Development", icon: "📖" }, { name: "Pre-Production", icon: "📋" }, { name: "Production", icon: "🎬" }, { name: "Post-Production", icon: "✂️" }, { name: "Distribution", icon: "🌍" }, { name: "Legal", icon: "⚖️" }],
  "Documentary":     [{ name: "Research", icon: "🔍" }, { name: "Pre-Production", icon: "📋" }, { name: "Production", icon: "🎥" }, { name: "Post-Production", icon: "✂️" }, { name: "Distribution", icon: "🌍" }],
  "Video Game":      [{ name: "Game Design", icon: "🎮" }, { name: "Art & Assets", icon: "🎨" }, { name: "Engineering", icon: "💻" }, { name: "Audio", icon: "🎵" }, { name: "Production", icon: "⚙️" }, { name: "Business", icon: "📊" }],
  "Mobile App":      [{ name: "Product", icon: "📱" }, { name: "Design", icon: "🎨" }, { name: "Engineering", icon: "💻" }, { name: "Marketing", icon: "📣" }, { name: "Operations", icon: "⚙️" }],
  "Web App / SaaS":  [{ name: "Product", icon: "🖥️" }, { name: "Design", icon: "🎨" }, { name: "Engineering", icon: "💻" }, { name: "Growth", icon: "📈" }, { name: "Operations", icon: "⚙️" }],
  "Business":        [{ name: "Foundation", icon: "🏛️" }, { name: "Finance", icon: "💰" }, { name: "Marketing", icon: "📣" }, { name: "Operations", icon: "⚙️" }, { name: "Legal", icon: "⚖️" }, { name: "Growth", icon: "📈" }],
  "Startup":         [{ name: "Idea & Vision", icon: "💡" }, { name: "Product", icon: "📱" }, { name: "Business Model", icon: "💼" }, { name: "Fundraising", icon: "💰" }, { name: "Marketing", icon: "📣" }, { name: "Legal", icon: "⚖️" }],
  "Physical Product":[{ name: "Discovery", icon: "🔍" }, { name: "Design", icon: "🎨" }, { name: "Manufacturing", icon: "🏭" }, { name: "Marketing", icon: "📣" }, { name: "Launch", icon: "🚀" }, { name: "Operations", icon: "⚙️" }],
  "Book / Novel":    [{ name: "Story Development", icon: "📖" }, { name: "Writing", icon: "✏️" }, { name: "Editing", icon: "📝" }, { name: "Publishing", icon: "📚" }, { name: "Marketing", icon: "📣" }],
  "Music / Album":   [{ name: "Creative", icon: "🎵" }, { name: "Recording", icon: "🎙️" }, { name: "Release", icon: "🚀" }, { name: "Marketing", icon: "📣" }],
  "Podcast":         [{ name: "Strategy", icon: "🗺️" }, { name: "Production", icon: "🎙️" }, { name: "Distribution", icon: "📡" }, { name: "Growth", icon: "📈" }],
  "Online Course":   [{ name: "Curriculum", icon: "📚" }, { name: "Production", icon: "🎬" }, { name: "Marketing", icon: "📣" }, { name: "Operations", icon: "⚙️" }],
  // ── Expansion: niche & emerging project types ──────────────────────────────
  "Architecture / Interior Design": [{ name: "Concepts & Mood", icon: "🎨" }, { name: "Drawings & Plans", icon: "📐" }, { name: "Material Specs", icon: "🧱" }, { name: "Client Deliverables", icon: "📋" }, { name: "Contractors", icon: "🔨" }],
  "E-commerce / DTC":    [{ name: "Product Catalog", icon: "🛍️" }, { name: "Marketing", icon: "📣" }, { name: "Operations & Fulfillment", icon: "⚙️" }, { name: "Finance & Metrics", icon: "💰" }, { name: "Tech Stack", icon: "💻" }],
  "Real Estate":         [{ name: "Property Research", icon: "🏠" }, { name: "Financials & Pro Forma", icon: "💰" }, { name: "Legal & Contracts", icon: "⚖️" }, { name: "Marketing", icon: "📣" }, { name: "Due Diligence", icon: "🔍" }],
  "Blockchain / Web3":   [{ name: "Protocol Design", icon: "⛓️" }, { name: "Smart Contracts", icon: "📄" }, { name: "Tokenomics", icon: "🪙" }, { name: "Community & DAO", icon: "🌐" }, { name: "Legal & Compliance", icon: "⚖️" }],
  "Clean Energy":        [{ name: "Technology & R&D", icon: "⚡" }, { name: "Project Finance", icon: "💰" }, { name: "Regulatory & Permits", icon: "⚖️" }, { name: "Operations & Maintenance", icon: "⚙️" }, { name: "Partnerships", icon: "🤝" }],
  "Biotech / Life Sciences": [{ name: "R&D", icon: "🔬" }, { name: "Clinical", icon: "🏥" }, { name: "Regulatory (FDA/CE)", icon: "⚖️" }, { name: "IP & Patents", icon: "💡" }, { name: "Business & Funding", icon: "📊" }],
  "Sports & Fitness":    [{ name: "Programs & Methodology", icon: "🏋️" }, { name: "Nutrition & Wellness", icon: "🥗" }, { name: "Business & Clients", icon: "📊" }, { name: "Marketing", icon: "📣" }],
  "Travel & Hospitality":[{ name: "Destinations & Itineraries", icon: "✈️" }, { name: "Operations & Partners", icon: "⚙️" }, { name: "Marketing & Brand", icon: "📣" }, { name: "Finance & Pricing", icon: "💰" }],
  "Events & Conference": [{ name: "Event Planning", icon: "📋" }, { name: "Venue & Logistics", icon: "🏟️" }, { name: "Marketing & Tickets", icon: "📣" }, { name: "Speakers & Agenda", icon: "🎤" }, { name: "Budget & Sponsors", icon: "💰" }],
  "Fashion & Apparel":   [{ name: "Collection & Design", icon: "👗" }, { name: "Production & Manufacturing", icon: "🏭" }, { name: "Marketing & Brand", icon: "📣" }, { name: "Retail & Distribution", icon: "🛍️" }],
  "Restaurant / F&B":    [{ name: "Menu & Recipes", icon: "🍽️" }, { name: "Operations & Staffing", icon: "⚙️" }, { name: "Marketing & Social", icon: "📣" }, { name: "Finance & COGS", icon: "💰" }],
  "Agency / Consultancy":[{ name: "Service Offerings", icon: "💼" }, { name: "Clients & Proposals", icon: "🤝" }, { name: "Delivery & Processes", icon: "📋" }, { name: "Finance & Pricing", icon: "💰" }, { name: "Team & Growth", icon: "📈" }],
  "IoT / Hardware":      [{ name: "Hardware Design", icon: "🔌" }, { name: "Firmware & Embedded", icon: "💻" }, { name: "Cloud & APIs", icon: "☁️" }, { name: "Manufacturing & Supply", icon: "🏭" }, { name: "Business", icon: "📊" }],
  "AR/VR / Metaverse":   [{ name: "Experience Design", icon: "🥽" }, { name: "Development & Engine", icon: "💻" }, { name: "Assets & Content", icon: "🎨" }, { name: "Platform & Distribution", icon: "📡" }, { name: "Business", icon: "📊" }],
  "Media & Publishing":  [{ name: "Editorial & Content", icon: "✏️" }, { name: "Content Pipeline", icon: "📅" }, { name: "Distribution & Reach", icon: "📡" }, { name: "Monetization & Revenue", icon: "💰" }, { name: "Analytics", icon: "📊" }],
  "FinTech":             [{ name: "Product & Compliance", icon: "🏦" }, { name: "Engineering", icon: "💻" }, { name: "Risk & Fraud", icon: "🛡️" }, { name: "Growth & Partnerships", icon: "📈" }, { name: "Finance & Ops", icon: "💰" }],
  "EdTech":              [{ name: "Curriculum & Content", icon: "📚" }, { name: "Platform & Tech", icon: "💻" }, { name: "Pedagogy & UX", icon: "🧠" }, { name: "Growth & Marketing", icon: "📣" }, { name: "Business & Revenue", icon: "💰" }],
  "GovTech / CivicTech": [{ name: "Policy & Requirements", icon: "📋" }, { name: "Platform & Architecture", icon: "💻" }, { name: "Security & Compliance", icon: "🛡️" }, { name: "Stakeholder & Comms", icon: "🤝" }, { name: "Deployment & Support", icon: "⚙️" }],
  "Space & Aerospace":   [{ name: "Mission Design", icon: "🚀" }, { name: "Systems Engineering", icon: "🛰️" }, { name: "Ground Segment", icon: "📡" }, { name: "Regulatory & Licensing", icon: "📋" }, { name: "Business & Funding", icon: "💰" }],
  "Cybersecurity":       [{ name: "Threat Intelligence", icon: "🛡️" }, { name: "Product & Engineering", icon: "💻" }, { name: "Compliance & GRC", icon: "📋" }, { name: "Sales & GTM", icon: "📈" }, { name: "Operations & IR", icon: "⚙️" }],
  "LegalTech":           [{ name: "Product & Workflow", icon: "⚖️" }, { name: "Engineering", icon: "💻" }, { name: "Legal & Compliance", icon: "📋" }, { name: "Sales & GTM", icon: "📈" }, { name: "Data & AI", icon: "🤖" }],
  "HRTech / WorkTech":   [{ name: "Product & Features", icon: "👥" }, { name: "Engineering", icon: "💻" }, { name: "Data & Analytics", icon: "📊" }, { name: "GTM & Partnerships", icon: "📈" }, { name: "Operations", icon: "⚙️" }],
  "AgriTech":            [{ name: "Agronomy & Science", icon: "🌱" }, { name: "Hardware & Sensors", icon: "🔌" }, { name: "Software & Platform", icon: "💻" }, { name: "Supply Chain", icon: "🚛" }, { name: "Business & GTM", icon: "📊" }],
  "Mobility & AutoTech": [{ name: "Vehicle & Systems", icon: "🚗" }, { name: "Software & Autonomy", icon: "💻" }, { name: "Infrastructure & Fleet", icon: "⚙️" }, { name: "Regulatory & Safety", icon: "📋" }, { name: "Business & GTM", icon: "📈" }],
  "Creator Economy":     [{ name: "Content Strategy", icon: "🎨" }, { name: "Monetization", icon: "💰" }, { name: "Audience & Community", icon: "👥" }, { name: "Tools & Workflow", icon: "⚙️" }, { name: "Brand & Partnerships", icon: "🤝" }],
  "PropTech":            [{ name: "Product & Platform", icon: "🏢" }, { name: "Engineering", icon: "💻" }, { name: "Data & Analytics", icon: "📊" }, { name: "Regulatory & Legal", icon: "⚖️" }, { name: "Sales & GTM", icon: "📈" }],
  "RetailTech":          [{ name: "Product & Commerce", icon: "🛒" }, { name: "Engineering & POS", icon: "💻" }, { name: "Data & Loyalty", icon: "📊" }, { name: "Operations & Supply", icon: "⚙️" }, { name: "Growth & Channels", icon: "📈" }],
  "Climate Tech":        [{ name: "Science & Methodology", icon: "🌍" }, { name: "Platform & Data", icon: "💻" }, { name: "Regulatory & Verification", icon: "📋" }, { name: "Carbon Markets", icon: "💹" }, { name: "Partnerships & GTM", icon: "🤝" }],
};

const INDUSTRIES = Object.keys(INDUSTRY_SPECIFIC);

const INDUSTRY_ICONS: Record<string, string> = {
  Healthcare: "🏥", Construction: "🏗️", Hunting: "🦌", Farming: "🌾",
  Education: "📚", Logistics: "🚛", Legal: "⚖️", Technology: "💻",
  Nonprofit: "❤️", Retail: "🛒", General: "📁",
  "Film / Movie": "🎬", "Documentary": "📺", "Video Game": "🎮",
  "Mobile App": "📱", "Web App / SaaS": "🖥️", "Business": "🏢",
  "Startup": "🚀", "Physical Product": "📦", "Book / Novel": "📚",
  "Music / Album": "🎵", "Podcast": "🎙️", "Online Course": "📖",
  "Architecture / Interior Design": "🏛️", "E-commerce / DTC": "🛍️",
  "Real Estate": "🏠", "Blockchain / Web3": "⛓️", "Clean Energy": "⚡",
  "Biotech / Life Sciences": "🔬", "Sports & Fitness": "🏋️",
  "Travel & Hospitality": "✈️", "Events & Conference": "🎪",
  "Fashion & Apparel": "👗", "Restaurant / F&B": "🍽️",
  "Agency / Consultancy": "💼", "IoT / Hardware": "🔌",
  "AR/VR / Metaverse": "🥽", "Media & Publishing": "📰",
  "FinTech": "🏦", "EdTech": "📚", "GovTech / CivicTech": "🏛️",
  "Space & Aerospace": "🚀", "Cybersecurity": "🛡️", "LegalTech": "⚖️",
  "HRTech / WorkTech": "👥", "AgriTech": "🌱", "Mobility & AutoTech": "🚗",
  "Creator Economy": "🎨", "PropTech": "🏢", "RetailTech": "🛒",
  "Climate Tech": "🌍",
};

const INDUSTRY_COLORS: Record<string, string> = {
  Healthcare: "#10b981", Construction: "#f97316", Hunting: "#78716c",
  Farming: "#84cc16", Education: "#6366f1", Logistics: "#0ea5e9",
  Legal: "#8b5cf6", Technology: "#06b6d4", Nonprofit: "#ec4899",
  Retail: "#f59e0b", General: "#94a3b8",
  "Film / Movie": "#dc2626", "Documentary": "#0284c7", "Video Game": "#7c3aed",
  "Mobile App": "#059669", "Web App / SaaS": "#2563eb", "Business": "#d97706",
  "Startup": "#7c3aed", "Physical Product": "#b45309", "Book / Novel": "#6b7280",
  "Music / Album": "#db2777", "Podcast": "#ea580c", "Online Course": "#0891b2",
  "Architecture / Interior Design": "#78716c", "E-commerce / DTC": "#f59e0b",
  "Real Estate": "#0ea5e9", "Blockchain / Web3": "#8b5cf6", "Clean Energy": "#22c55e",
  "Biotech / Life Sciences": "#14b8a6", "Sports & Fitness": "#ef4444",
  "Travel & Hospitality": "#06b6d4", "Events & Conference": "#a855f7",
  "Fashion & Apparel": "#ec4899", "Restaurant / F&B": "#f97316",
  "Agency / Consultancy": "#6366f1", "IoT / Hardware": "#64748b",
  "AR/VR / Metaverse": "#7c3aed", "Media & Publishing": "#334155",
  "FinTech": "#0ea5e9", "EdTech": "#6366f1", "GovTech / CivicTech": "#475569",
  "Space & Aerospace": "#1e293b", "Cybersecurity": "#dc2626", "LegalTech": "#7c3aed",
  "HRTech / WorkTech": "#0891b2", "AgriTech": "#16a34a", "Mobility & AutoTech": "#2563eb",
  "Creator Economy": "#f59e0b", "PropTech": "#64748b", "RetailTech": "#f97316",
  "Climate Tech": "#22c55e",
};

// M-01: Module-scope constant — avoids re-creation on every render inside parseAndCreate
const THINKING_LINES = [
  "Analysing your industry landscape…",
  "Defining audience and purpose…",
  "Mapping the project lifecycle…",
  "Identifying critical documents…",
  "Applying industry best practices…",
  "Structuring the workspace…",
  "Generating scaffold architecture…",
  "Optimising for your project type…",
  "Building the knowledge base…",
  "Preparing your AI agent…",
];

// ─── Project Type Definitions (for the type picker modal) ─────────────────────

interface ProjectTypeDef {
  id: string;
  icon: string;
  label: string;
  desc: string;
  count: number;
  keywords: string[];
}

const PROJECT_TYPE_DEFINITIONS: ProjectTypeDef[] = [
  { id: "Film / Movie",    icon: "🎬", label: "Film / Movie",    desc: "Feature film or short",           count: 12, keywords: ["film","movie","cinema","feature","short","screenplay","script","cinematic"] },
  { id: "Documentary",     icon: "📺", label: "Documentary",     desc: "Nonfiction storytelling",         count: 10, keywords: ["documentary","doc","docuseries","nonfiction","true story","investigative"] },
  { id: "Video Game",      icon: "🎮", label: "Video Game",      desc: "Any platform or genre",           count: 12, keywords: ["game","video game","indie game","mobile game","rpg","shooter","puzzle","platformer","strategy"] },
  { id: "Mobile App",      icon: "📱", label: "Mobile App",      desc: "iOS, Android, or cross-platform", count: 10, keywords: ["app","mobile app","ios","android","react native","flutter","expo"] },
  { id: "Web App / SaaS",  icon: "🖥️", label: "Web App / SaaS",  desc: "SaaS, platform, or tool",         count: 12, keywords: ["saas","web app","platform","tool","dashboard","software","webapp","website"] },
  { id: "Business",        icon: "🏢", label: "Business",        desc: "Company or small business",       count: 12, keywords: ["business","company","brand","shop","service","agency","firm","studio"] },
  { id: "Startup",         icon: "🚀", label: "Startup",         desc: "VC-backed or bootstrapped",       count: 10, keywords: ["startup","venture","mvp","raise","pitch","series","seed","founder","fintech","ai startup"] },
  { id: "Physical Product",icon: "📦", label: "Physical Product",desc: "Consumer or industrial product",  count: 10, keywords: ["product","hardware","device","gadget","consumer product","physical","invention"] },
  { id: "Book / Novel",    icon: "📚", label: "Book / Novel",    desc: "Fiction, nonfiction, or memoir",  count: 10, keywords: ["book","novel","memoir","nonfiction","story","manuscript","author","write","writing"] },
  { id: "Music / Album",   icon: "🎵", label: "Music / Album",   desc: "Album, EP, or single",            count: 8,  keywords: ["music","album","song","ep","single","artist","band","record","rap","pop","producer"] },
  { id: "Podcast",         icon: "🎙️", label: "Podcast",         desc: "Interview, narrative, or solo",   count: 8,  keywords: ["podcast","show","episode","audio","interview","radio","cast"] },
  { id: "Online Course",   icon: "📖", label: "Online Course",   desc: "Educational course or cohort",    count: 8,  keywords: ["course","online course","cohort","training","bootcamp","learn","teach","education","masterclass"] },
  { id: "Architecture / Interior Design", icon: "🏛️", label: "Architecture / Interior Design", desc: "Residential, commercial, or interior", count: 9,  keywords: ["architecture","interior design","architect","interior","renovation","design build","space","studio","residential","commercial"] },
  { id: "E-commerce / DTC", icon: "🛍️", label: "E-commerce / DTC",   desc: "Online store, brand, or marketplace",  count: 9,  keywords: ["ecommerce","e-commerce","dtc","direct to consumer","shopify","amazon","store","shop","brand","dropship","merch"] },
  { id: "Real Estate",      icon: "🏠", label: "Real Estate",      desc: "Residential, commercial, or investing",  count: 9,  keywords: ["real estate","property","rental","investment","flip","apartment","condo","reits","commercial real estate","proptech","landlord"] },
  { id: "Blockchain / Web3", icon: "⛓️", label: "Blockchain / Web3", desc: "Protocol, dApp, DAO, or NFT project",  count: 9,  keywords: ["blockchain","web3","crypto","dao","nft","defi","token","smart contract","solidity","ethereum","solana","protocol","dapp"] },
  { id: "Clean Energy",     icon: "⚡", label: "Clean Energy",     desc: "Solar, wind, storage, or climate tech",  count: 9,  keywords: ["clean energy","solar","wind","battery","storage","renewable","climate","green","sustainability","net zero","carbon","ev","energy"] },
  { id: "Biotech / Life Sciences", icon: "🔬", label: "Biotech / Life Sciences", desc: "Drug, device, diagnostic, or research", count: 9, keywords: ["biotech","life sciences","pharma","drug","clinical","fda","medical device","genomics","bioinformatics","research","lab","therapeutics","diagnostic"] },
  { id: "Sports & Fitness", icon: "🏋️", label: "Sports & Fitness",  desc: "Gym, coaching, brand, or sports tech",  count: 8,  keywords: ["fitness","gym","sport","coaching","trainer","athlete","wellness","health","workout","nutrition","yoga","crossfit"] },
  { id: "Travel & Hospitality", icon: "✈️", label: "Travel & Hospitality", desc: "Tours, hotel, or travel brand",      count: 8,  keywords: ["travel","hospitality","hotel","tours","tourism","airbnb","boutique","resort","destination","booking","vacation"] },
  { id: "Events & Conference", icon: "🎪", label: "Events & Conference", desc: "Conference, festival, or live event",  count: 9,  keywords: ["event","conference","summit","festival","concert","venue","expo","meetup","seminar","webinar","workshop","gala"] },
  { id: "Fashion & Apparel", icon: "👗", label: "Fashion & Apparel", desc: "Brand, collection, or fashion tech",      count: 8,  keywords: ["fashion","apparel","clothing","brand","collection","streetwear","luxury","designer","textile","accessories","garment"] },
  { id: "Restaurant / F&B", icon: "🍽️", label: "Restaurant / F&B",  desc: "Restaurant, café, food brand, or CPG",  count: 8,  keywords: ["restaurant","food","cafe","bar","chef","menu","kitchen","food brand","cpg","beverage","catering","bakery","brewery"] },
  { id: "Agency / Consultancy", icon: "💼", label: "Agency / Consultancy", desc: "Service firm, studio, or consultancy", count: 9, keywords: ["agency","consulting","consultancy","firm","studio","freelance","services","marketing agency","pr agency","strategy"] },
  { id: "IoT / Hardware",   icon: "🔌", label: "IoT / Hardware",    desc: "Connected device or embedded system",    count: 9,  keywords: ["iot","hardware","device","embedded","firmware","sensor","arduino","raspberry pi","connected","smart home","wearable","electronics"] },
  { id: "AR/VR / Metaverse", icon: "🥽", label: "AR/VR / Metaverse", desc: "Immersive experience, game, or app",    count: 9,  keywords: ["ar","vr","augmented reality","virtual reality","metaverse","xr","mixed reality","immersive","spatial","unity","unreal","oculus","headset"] },
  { id: "Media & Publishing", icon: "📰", label: "Media & Publishing", desc: "Newsletter, magazine, or media brand",  count: 8,  keywords: ["media","publishing","newsletter","magazine","journal","blog","editorial","content","substack","audience","publication"] },
  { id: "FinTech",             icon: "🏦", label: "FinTech",             desc: "Payments, neobank, lending, or trading", count: 9,  keywords: ["fintech","payment","neobank","lending","banking","insurance","trading","finance","embedded finance","plaid","stripe","defi","wealthtech"] },
  { id: "EdTech",              icon: "📚", label: "EdTech",              desc: "Learning platform, LMS, or course tool",  count: 9,  keywords: ["edtech","education technology","lms","learning","tutoring","online course","training","school","e-learning","bootcamp","assessment","adaptive"] },
  { id: "GovTech / CivicTech", icon: "🏛️", label: "GovTech / CivicTech", desc: "Government digital services or civic tech",count: 9,  keywords: ["govtech","civictech","government","civic","public sector","federal","municipal","digital services","fedramp","procurement","ato","public good"] },
  { id: "Space & Aerospace",   icon: "🚀", label: "Space & Aerospace",   desc: "Satellite, launch vehicle, or space service",count: 9, keywords: ["space","aerospace","satellite","launch","rocket","orbit","propulsion","space tech","nasa","smallsat","cubesat","ground station","astronomy","deep tech"] },
  { id: "Cybersecurity",       icon: "🛡️", label: "Cybersecurity",       desc: "Security product, GRC, or threat intel",  count: 9,  keywords: ["cybersecurity","security","infosec","threat","siem","edr","zero trust","pentest","soc","compliance","grc","vulnerability","iam","devsecops"] },
  { id: "LegalTech",           icon: "⚖️", label: "LegalTech",           desc: "Legal software, CLM, or e-discovery",     count: 9,  keywords: ["legaltech","legal tech","law","contract","clm","e-discovery","legal ops","attorney","compliance","legal ai","legal automation","doc automation"] },
  { id: "HRTech / WorkTech",   icon: "👥", label: "HRTech / WorkTech",   desc: "HR platform, ATS, or workforce tool",     count: 9,  keywords: ["hrtech","hr tech","human resources","ats","hris","hcm","payroll","recruiting","talent","workforce","people ops","employee","engagement"] },
  { id: "AgriTech",            icon: "🌱", label: "AgriTech",            desc: "Precision farming, crop science, or supply chain",count: 9,keywords: ["agritech","agriculture","farming","crop","precision farming","soil","irrigation","agronomy","supply chain","food tech","vertical farming","livestock"] },
  { id: "Mobility & AutoTech", icon: "🚗", label: "Mobility & AutoTech", desc: "EV, autonomous vehicle, or fleet platform", count: 9,  keywords: ["mobility","autotech","electric vehicle","ev","autonomous","self-driving","fleet","logistics","telematics","maas","automotive","transportation"] },
  { id: "Creator Economy",     icon: "🎨", label: "Creator Economy",     desc: "Creator tools, monetization, or community", count: 9,  keywords: ["creator economy","creator","content creator","influencer","monetization","subscription","community","patreon","substack","twitch","youtube","newsletter"] },
  { id: "PropTech",            icon: "🏢", label: "PropTech",            desc: "Real estate platform, smart building, or RE data",count: 9,keywords: ["proptech","property technology","real estate tech","smart building","property management","mls","reo","real estate data","rent tech","construction tech","bim"] },
  { id: "RetailTech",          icon: "🛒", label: "RetailTech",          desc: "POS, loyalty, inventory, or omnichannel",  count: 9,  keywords: ["retailtech","retail technology","pos","point of sale","inventory","loyalty","omnichannel","ecommerce","fulfillment","retail analytics","merchandising"] },
  { id: "Climate Tech",        icon: "🌍", label: "Climate Tech",        desc: "Carbon markets, climate data, or CDR",     count: 9,  keywords: ["climate tech","carbon","climate","ghg","emissions","carbon credit","offset","net zero","sustainability","esg","carbon market","dac","cdr","climate data"] },
];

// ─── Detect project type from name ───────────────────────────────────────────

function detectProjectType(name: string): string {
  const lower = name.toLowerCase();
  for (const type of PROJECT_TYPE_DEFINITIONS) {
    if (type.keywords.some(k => lower.includes(k))) return type.id;
  }
  return "General";
}

// ─── Scaffold file definitions (industry-standard templates per type) ─────────

interface ScaffoldFile {
  name: string;
  type: string;
  folder: string;
  content: string;
}

const PROJECT_SCAFFOLD_MAP: Record<string, ScaffoldFile[]> = {
  "Film / Movie": [
    { name: "Logline", type: "document", folder: "Development", content: `LOGLINE — [PROJECT NAME]\nFormat: Feature Film  |  Genre: [Genre]  |  Running Time: [XX] min\n\nTHE LOGLINE\nWhen [protagonist] discovers [inciting incident], they must [active goal] before [stakes/consequence].\n\nCOMPARABLE TITLES\n• [Film A] meets [Film B]\n• Tone: [describe emotional/visual feel]\n\nLOG PITCH (one breath)\n[One sentence you'd say at a cocktail party]` },
    { name: "Script Treatment", type: "document", folder: "Development", content: `SCRIPT TREATMENT — [PROJECT NAME]\nWritten by: [Author]  |  Draft Date: [Date]  |  Draft #: 1\n\nACT ONE — SETUP\n[Introduce protagonist in their ordinary world. An inciting incident disrupts everything.]\n\nACT TWO — CONFRONTATION\n[Protagonist pursues goal against mounting obstacles. Internal conflicts mirror external ones. The "all is lost" moment arrives.]\n\nMIDPOINT\n[Something shifts. Stakes escalate. New information changes everything.]\n\nACT THREE — RESOLUTION\n[Climax. Protagonist must use everything learned. Resolution arrives. Final image mirrors the opening, transformed.]\n\nTONE & VISUAL STYLE\n[Describe the look, feel, pacing, and emotional register of the film]\n\nTHEMES\n1. [Primary theme]\n2. [Secondary theme]\n\nKEY CHARACTERS\n• [Protagonist]: [One-sentence description]\n• [Antagonist/Foil]: [One-sentence description]\n• [Supporting]: [One-sentence description]` },
    { name: "Character Breakdown", type: "document", folder: "Development", content: `CHARACTER BREAKDOWN — [PROJECT NAME]\n\nPROTAGONIST\nName: \nAge: \nOccupation: \nWant (external): \nNeed (internal): \nArc: \nKey traits: \n\nANTAGONIST / FOIL\nName: \nAge: \nMotivation: \nRelationship to protagonist: \nKey traits: \n\nSUPPORTING CHARACTERS\n[Name] — [Role] — [Function in story]\n[Name] — [Role] — [Function in story]\n\nCASTING NOTES\n[Any directorial thoughts on casting direction or real names being considered]` },
    { name: "Budget Overview", type: "document", folder: "Pre-Production", content: `BUDGET OVERVIEW — [PROJECT NAME]\nEstimated Total: $[AMOUNT]  |  Format: [Feature/Short]  |  Shoot Days: [XX]\n\nABOVE-THE-LINE\nWriter(s):            $\nDirector:             $\nProducer(s):          $\nCast (principal):     $\nATL Subtotal:         $\n\nBELOW-THE-LINE\nProduction Design:    $\nCamera/Grip/Electric: $\nSound:                $\nWardrobe/Hair/MU:     $\nLocation Fees:        $\nBTL Subtotal:         $\n\nPOST-PRODUCTION\nEdit:                 $\nColor:                $\nSound Mix/Design:     $\nMusic/Score:          $\nVFX:                  $\nPost Subtotal:        $\n\nGRAND TOTAL:          $\n\nNOTES\n[Financing structure, tax credit eligibility, deferrals, etc.]` },
    { name: "Shoot Schedule", type: "document", folder: "Pre-Production", content: `SHOOT SCHEDULE — [PROJECT NAME]\nPrincipal Photography: [Start Date] – [End Date]  |  Total Days: [XX]\n\nPREP TIMELINE\n[Date]: Production design begins\n[Date]: Casting locked\n[Date]: Location scouts complete\n[Date]: Wardrobe fittings\n[Date]: Final tech scout\n[Date]: Day 1\n\nPRODUCTION SCHEDULE (by week)\nWeek 1: [Locations/scenes to cover]\nWeek 2: [Locations/scenes to cover]\nWeek 3: [Locations/scenes to cover]\n\nKEY LOCATIONS\n1. [Location name] — [# days] shooting days\n2. [Location name] — [# days] shooting days\n\nNOTES\n[Weather contingencies, night shoots, travel days, holidays]` },
    { name: "Shot List Template", type: "document", folder: "Production", content: `SHOT LIST — [PROJECT NAME] — SCENE [XX]\nLocation: [Location]  |  Date: [Date]  |  DP: [Name]\n\nSHOT # | DESCRIPTION | LENS | MOVEMENT | NOTES\n001    | Wide establishing shot | 24mm | Static | [Notes]\n002    | Medium two-shot | 50mm | Dolly in | [Notes]\n003    | Close-up protagonist | 85mm | Handheld | [Notes]\n004    | Insert/detail | Macro | Static | [Notes]\n\nB-ROLL / COVERAGE\n• [B-roll item 1]\n• [B-roll item 2]\n\nSPECIAL NOTES\n[Lighting setup, special equipment, safety considerations]` },
    { name: "Daily Call Sheet Template", type: "document", folder: "Production", content: `CALL SHEET — [PROJECT NAME] — DAY [XX] of [XX]\nDate: [Date]  |  General Call: [Time]  |  Crew Call: [Time]\n\nPRODUCTION CONTACTS\nDirector: [Name] — [Phone]\nAD: [Name] — [Phone]\nProducer: [Name] — [Phone]\n\nTODAY'S SCENES\nScene | Pages | Location | Cast | Notes\n[#]   | [X/8] | [Location] | [Cast #s] | [Notes]\n\nLOCATIONS\nAddress: [Full address]\nNearest hospital: [Name + address]\nParking: [Instructions]\n\nWEATHER: [Forecast]\nSUNRISE: [Time]  SUNSET: [Time]` },
    { name: "Post-Production Plan", type: "document", folder: "Post-Production", content: `POST-PRODUCTION PLAN — [PROJECT NAME]\nExpected Post Period: [X] months  |  Target Delivery: [Date]\n\nEDITORIAL\nEditor: [Name]  |  Edit System: [Avid/Premiere/Final Cut]\nAssembly Cut: [Date]\nRough Cut: [Date]\nPicture Lock: [Date]\n\nCOLOR\nColorist: [Name]\nDeliverable formats: [DCP, HDR, SDR]\nColor complete: [Date]\n\nSOUND\nComposer: [Name]  |  Music delivery: [Date]\nSound Designer: [Name]\nSound mix: [Date]\n\nDELIVERABLES\nDCP: [Date]  |  ProRes master: [Date]  |  Screener: [Date]\n\nPOST BUDGET: $[Amount]` },
    { name: "Festival Strategy", type: "document", folder: "Distribution", content: `FESTIVAL STRATEGY — [PROJECT NAME]\n\nFESTIVAL TIER 1 — WORLD PREMIERE TARGETS (pick one)\n□ Sundance (January) — Deadline: [Date]\n□ SXSW (March) — Deadline: [Date]\n□ Tribeca (June) — Deadline: [Date]\n□ TIFF (September) — Deadline: [Date]\n□ Cannes/Venice/Berlin (varies)\n\nFESTIVAL TIER 2 — FOLLOW-UP CIRCUIT\n□ [Festival Name] — [Date] — Fee: $[XX]\n□ [Festival Name] — [Date] — Fee: $[XX]\n\nDISTRIBUTION GOALS\n□ Theatrical (self-distribution vs. acquisition)\n□ Streaming (SVOD targets: Netflix, A24, MUBI, etc.)\nTarget acquisition price: $[Range]\n\nSUBMISSION BUDGET: $[Total]` },
    { name: "Pitch Deck Outline", type: "document", folder: "Distribution", content: `PITCH DECK OUTLINE — [PROJECT NAME]\n\nSLIDE 1: TITLE & LOGLINE\n[Title] + [Logline] + [Tagline]\n\nSLIDE 2: THE STORY\n[3-paragraph story summary]\n\nSLIDE 3: WHY THIS STORY, WHY NOW\n[Cultural moment / timeliness / urgency]\n\nSLIDE 4: DIRECTOR'S VISION\n[Tone, visual approach, personal connection]\n\nSLIDE 5: COMPARABLE FILMS\n[3 comps with box office or streaming performance data]\n\nSLIDE 6: TEAM\n[Director, Producer, Key Cast, DP — with credits]\n\nSLIDE 7: BUDGET & FINANCING\n[Total budget, amount raised, ask, use of funds]\n\nSLIDE 8: DISTRIBUTION STRATEGY\n[Festival plan, target platforms, release strategy]` },
    { name: "Press Kit", type: "document", folder: "Distribution", content: `PRESS KIT — [PROJECT NAME]\n\nLOGLINE\n[One-sentence logline]\n\nSYNOPSIS (short — 2–3 sentences)\n[Brief synopsis]\n\nSYNOPSIS (long — 200–300 words)\n[Full synopsis]\n\nDIRECTOR'S STATEMENT\n[150–200 words — why this story, what you want audiences to feel]\n\nDIRECTOR BIO\n[100 words — key credits, background, visual style]\n\nTECHNICAL SPECS\nRuntime: [XX min]  |  Format: [Aspect ratio, shot format]\nSound: [5.1, Stereo]  |  Language: [English]\nCountry: [Country]  |  Year: [Year]\n\nCONTACT\nWorld Sales / PR: [Name + email]\nSocial: [Instagram, Letterboxd, etc.]` },
    { name: "Rights & Legal Checklist", type: "document", folder: "Legal", content: `RIGHTS & LEGAL CHECKLIST — [PROJECT NAME]\n\nCHAIN OF TITLE\n□ Original screenplay signed\n□ Life rights acquired (if based on real person)\n□ WGA registration\n□ Copyright registration\n\nMUSIC\n□ Master use licenses for all songs\n□ Sync licenses for all songs\n□ Original score work-for-hire agreement\n\nTALENT & CREW\n□ SAG-AFTRA agreements (if applicable)\n□ All actor contracts executed\n□ All crew deal memos signed\n□ Director agreement signed\n\nCLEARANCES\n□ E&O insurance obtained\n□ All brand logos / trademarks cleared\n□ All locations releases signed\n\nBUSINESS\n□ Production company LLC formed\n□ Investor agreements signed\n\nNOTES\n[Attorney: Name + contact]` },
  ],
  "Documentary": [
    { name: "Pitch Document", type: "document", folder: "Research", content: `DOCUMENTARY PITCH — [PROJECT NAME]\nDirector: [Name]  |  Producer: [Name]  |  Runtime: [XX] min (est.)\n\nLOGLINE\n[One sentence that captures the film's subject, angle, and emotional stakes]\n\nTHE STORY\n[3–4 paragraphs describing the documentary: who/what it's about, the central conflict or question, the journey, and the emotional landing]\n\nTHE SUBJECTS\n[Who are we following? What access do you have?]\n\nWHY THIS STORY NOW\n[Cultural urgency, timeliness, or unique moment]\n\nDIRECTOR'S STATEMENT\n[Personal connection to the material, visual approach, intended impact]\n\nCOMPARABLE FILMS\n• [Doc A] — [Platform/distribution]\n• [Doc B] — [Platform/distribution]\n\nBUDGET: $[Amount]  |  TIMELINE: [Production start] – [Delivery]` },
    { name: "Subject Research", type: "document", folder: "Research", content: `SUBJECT RESEARCH — [PROJECT NAME]\n\nPRIMARY SUBJECT(S)\nName: \nBackground: \nKey facts: \nConflict/tension: \nAccess status: [Confirmed / Pending / Seeking]\nContact: \n\nBACKGROUND CONTEXT\n[Historical, cultural, or situational context for the story]\n\nKEY FACTS & STATISTICS\n• [Fact 1 + source]\n• [Fact 2 + source]\n• [Fact 3 + source]\n\nEXISTING COVERAGE\n[What has already been covered? What angle is fresh?]\n\nARCHIVAL SOURCES\n□ [Archive name] — [Contact] — [Availability/cost]\n□ [Archive name] — [Contact] — [Availability/cost]\n\nRESEARCH GAPS\n[What still needs to be confirmed, verified, or discovered]` },
    { name: "Interview Subject List", type: "document", folder: "Research", content: `INTERVIEW SUBJECT LIST — [PROJECT NAME]\n\nCONFIRMED INTERVIEWS\nName | Role/Relevance | Date | Location | Status\n[Name] | [Protagonist] | [Date] | [Location] | Confirmed\n[Name] | [Expert] | [Date] | [Location] | Confirmed\n\nPRIORITY TARGETS (seeking access)\nName | Role/Relevance | Contact | Status\n[Name] | [Why important] | [How to reach] | Outreach sent\n[Name] | [Why important] | [How to reach] | No response\n\nSECONDARY LIST\n[Name] — [Why useful]\n[Name] — [Why useful]\n\nINTERVIEW NOTES\n[Language barriers, legal clearances needed, sensitive topics]` },
    { name: "Story Arc Outline", type: "document", folder: "Pre-Production", content: `STORY ARC OUTLINE — [PROJECT NAME]\n\nOPENING IMAGE\n[What does the film open on? What's the hook?]\n\nACT 1 — ESTABLISH\n[Introduce world, subjects, and central question]\n\nTURNING POINT 1\n[Something reveals the film's real stakes or conflict]\n\nACT 2 — DEEPEN\n[Go deeper. New revelations. Complications arise.]\n\nMIDPOINT\n[Major revelation, shift, or confrontation]\n\nACT 3 — RESOLUTION\n[How does it resolve? What do we leave the audience with?]\n\nCLOSING IMAGE\n[Mirror or contrast to the opening — what's changed?]\n\nSTRUCTURAL NOTES\nTotal runtime: [XX] min\nKey scenes still needed: [List]` },
    { name: "Shoot Schedule", type: "document", folder: "Pre-Production", content: `DOCUMENTARY SHOOT SCHEDULE — [PROJECT NAME]\n\nPHASE 1 — CHARACTER SETUP INTERVIEWS\nDates: [Range]  |  Subjects: [Who]  |  Days: [#]\n\nPHASE 2 — OBSERVATIONAL / VERITÉ\nDates: [Range]  |  Following: [Who/what]  |  Days: [#]\n\nPHASE 3 — EXPERT INTERVIEWS\nDates: [Range]  |  Subjects: [Names]  |  Days: [#]\n\nARCHIVE / B-ROLL PICKUP\nDates: [Range]  |  Special equipment: [Crane, drone, etc.]\n\nTOTAL SHOOT DAYS: [#]\nTOTAL BUDGET FOR PRODUCTION: $[Amount]\n\nTRAVEL SCHEDULE\n[Any travel — flights, hotels, logistics]` },
    { name: "Interview Question Guide", type: "document", folder: "Production", content: `INTERVIEW QUESTION GUIDE — [PROJECT NAME]\n\nSUBJECT: [Name]  |  DATE: [Date]  |  DURATION: [Est. time]\n\nOPENING — WARM UP\n1. Tell me a little about yourself and how you came to be involved in [subject].\n2. When did you first become aware of [topic]?\n3. What was your first reaction?\n\nCORE QUESTIONS — THE STORY\n4. Walk me through what happened on [key date/event].\n5. What were you thinking in that moment?\n6. What did you not know at the time that you know now?\n7. What was the hardest part of [situation]?\n8. What do you want people to understand about [topic]?\n\nCLOSING\n9. Is there anything I haven't asked that you think is important?\n10. Who else should we be talking to?\n\nDIRECTOR NOTES\n[What emotional beats are you looking for?]` },
    { name: "B-Roll Shot List", type: "document", folder: "Production", content: `B-ROLL SHOT LIST — [PROJECT NAME]\n\nOBSERVATIONAL / VERITÉ\n□ [Subject] doing [activity] — [Location]\n□ [Subject] with [person/object] — [Location]\n□ [Key location] exterior and interior — multiple times of day\n\nILLUSTRATIVE B-ROLL\n□ [Concept that needs visual cover] — [Shot idea]\n□ [Statistic or fact] — [Infographic or archival alternative]\n\nATMOSPHERE / TEXTURE\n□ [Location] at different times of day\n□ Environmental details — [Specific items]\n\nARCHIVAL NEEDS (to be sourced)\n□ [Event] footage — [Source]\n□ [Person] historical footage — [Source]` },
    { name: "Edit Roadmap", type: "document", folder: "Post-Production", content: `EDIT ROADMAP — [PROJECT NAME]\nEditor: [Name]  |  Edit System: [Software]\n\nTIMELINE\nAssembly Cut: [Date] — Runtime goal: [XX] min\nDirector's Cut: [Date] — Runtime goal: [XX] min\nPicture Lock: [Date] — Runtime: [XX] min\nSound Mix: [Date]  |  Color: [Date]  |  Delivery: [Date]\n\nSTRUCTURE (current working plan)\n0:00–[XX:XX] — Act 1: [What happens]\n[XX:XX]–[XX:XX] — Act 2: [What happens]\n[XX:XX]–[XX:XX] — Act 3: [Resolution]\n\nMUSIC PLAN\n□ Original score — Composer: [Name]\n□ Licensed tracks — [Clearance budget]\n\nPOST BUDGET: $[Amount]` },
    { name: "Festival & Distribution Strategy", type: "document", folder: "Distribution", content: `FESTIVAL & DISTRIBUTION STRATEGY — [PROJECT NAME]\n\nWORLD PREMIERE TARGETS\n□ Sundance — Deadline: [Date]  |  Category: US/World Doc\n□ HotDocs (Toronto) — Deadline: [Date]\n□ IDFA (Amsterdam) — Deadline: [Date]\n□ SXSW — Deadline: [Date]\n\nBROADCAST / STREAMING TARGETS\n□ Netflix Documentary\n□ HBO Documentary Films\n□ Hulu Docs\n□ Apple TV+\n□ PBS Frontline / POV\n\nIMPACT DISTRIBUTION\n□ Educational licensing — [Partner]\n□ Community screenings — [Partner]\n\nDISTRIBUTION STRATEGY\nSales agent: [Name / Seeking]\nExpected acquisition range: $[Min]–$[Max]\n\nSUBMISSION BUDGET: $[Amount]` },
    { name: "Archive & Rights Tracker", type: "document", folder: "Post-Production", content: `ARCHIVE & RIGHTS TRACKER — [PROJECT NAME]\n\nFOOTAGE USED IN CUT\nClip Description | Source | Duration Used | License Type | Fee | Status\n[Clip] | [Source] | [:XX] | Fair Use / Licensed | $[XX] | Cleared\n[Clip] | [Source] | [:XX] | [Type] | $[XX] | Pending\n\nPHOTOS / STILL IMAGES\nImage | Source | License | Fee | Status\n[Image] | [Source] | [Type] | $[XX] | [Status]\n\nMUSIC\nTrack | Artist | Source | Master Fee | Sync Fee | Status\n[Song] | [Artist] | [Label] | $[XX] | $[XX] | [Status]\n\nARCHIVAL CONTACTS\n[Archive name] — Contact: [Name] — Lead time: [Weeks]\n\nTOTAL ARCHIVE BUDGET: $[Amount]\nClearance attorney: [Name + contact]` },
  ],
  "Video Game": [
    { name: "Game Design Document (GDD)", type: "document", folder: "Game Design", content: `GAME DESIGN DOCUMENT — [PROJECT NAME]\nVersion: 1.0  |  Date: [Date]  |  Studio: [Studio Name]\n\nGAME OVERVIEW\nTitle: [Game Name]\nGenre: [e.g., Action RPG, Puzzle Platformer, Strategy]\nPlatform(s): [PC / PS5 / Xbox / Switch / iOS / Android]\nCore Concept: [One sentence — the heart of the game]\nTagline: [Marketable one-liner]\n\nTARGET AUDIENCE\nPrimary: [Age range, gaming experience, interests]\n\nCORE PILLARS\n1. [Pillar — e.g., "Emergent exploration"]\n2. [Pillar — e.g., "Rewarding mastery"]\n3. [Pillar — e.g., "Narrative immersion"]\n\nCORE GAMEPLAY LOOP\n[Describe the 30-second loop: player action → feedback → reward → repeat]\n\nMONETIZATION MODEL\n□ Premium ($[Price])  □ Free-to-Play  □ GaaS  □ DLC/Season Pass\n\nCOMPARABLE TITLES\n• [Game A] — what we take from it\n• [Game B] — what we do differently` },
    { name: "Story & World Bible", type: "document", folder: "Game Design", content: `STORY & WORLD BIBLE — [PROJECT NAME]\n\nSETTING\nWorld Name: [Name]\nTime Period: [Fantasy / Sci-fi / Contemporary]\nTone: [e.g., Dark fantasy / Whimsical / Grounded realism]\n\nTHE CONFLICT\n[The central tension driving the world and narrative]\n\nPROTAGONIST\nName:  |  Background:  |  Motivation:  |  Arc:\n\nKEY CHARACTERS\n[Character name] — [Role] — [Relationship to protagonist]\n[Character name] — [Role] — [Motivation/agenda]\n\nMAIN NARRATIVE ARC\nAct 1: [Setup and hook]\nAct 2: [Rising stakes, world expansion]\nAct 3: [Climax and resolution]\n\nLORE ELEMENTS\n• [Faction 1] — [What they want]\n• [Key mythology/magic system] — [Rules]\n\nNARRATIVE TONE\n[What this game says. What players should feel.]` },
    { name: "Core Mechanics Doc", type: "document", folder: "Game Design", content: `CORE MECHANICS DOCUMENT — [PROJECT NAME]\n\nMOVEMENT & CONTROLS\n[How the player moves, interacts, and navigates the world]\n\nDefault control scheme:\n• Movement: [Input]\n• Primary action: [Input]\n• Secondary action: [Input]\n• Special/Ultimate: [Input]\n\nCORE MECHANIC 1: [Name]\nWhat it is: [Description]\nHow it feels: [Adjectives — snappy, weighty, fluid]\nPlayer input: [Button/gesture]\nGame response: [What happens]\nFailure state: [What happens if done wrong]\n\nCORE MECHANIC 2: [Name]\n[Same structure]\n\nPROGRESSION SYSTEM\n[How does the player grow? XP, skill trees, gear, unlocks]\n\nBALANCING NOTES\n[Early thoughts on difficulty curve, accessibility options]` },
    { name: "Art Style Guide", type: "document", folder: "Art & Assets", content: `ART STYLE GUIDE — [PROJECT NAME]\nArt Director: [Name]  |  Version: 1.0\n\nVISUAL DIRECTION\nCore aesthetic: [2–3 words — e.g., "Painterly dark fantasy"]\nInfluences: [Reference games, films, art movements]\nColor palette: [Description — warm/cool, saturated/muted]\n\nCOLOR PALETTE\nPrimary colors: [Hex values]\nSecondary colors: [Hex values]\nUI/HUD colors: [Hex values]\n\nCHARACTER DESIGN\nSilhouette principle: [Readable at X% zoom]\nProportion style: [Realistic / Stylized / Chibi]\nLine weight: [Heavy outline / No outline / Painterly]\n\nENVIRONMENT DESIGN\nLighting mood: [Direction, time of day, atmosphere]\nTexture approach: [PBR / Hand-painted / Cel-shaded]\n\nUI/UX DESIGN\nInterface style: [Diegetic / Minimal / Dense / Futuristic]\nFont families: [Heading / Body / Accent]` },
    { name: "Level Design Doc", type: "document", folder: "Game Design", content: `LEVEL DESIGN DOCUMENT — [PROJECT NAME]\n\nLEVEL DESIGN PHILOSOPHY\n[What makes a great level in this game?]\n\nWORLD STRUCTURE\n[Hub world / linear / open world / procedural]\nTotal levels/areas: [#]  |  Est. playtime per level: [XX] min\nTotal game length (main story): [XX] hours\n\nLEVEL BREAKDOWN\nLEVEL 1 — [Name]\nTheme/environment: [Description]\nPlayer objectives: [What must the player do?]\nNew mechanics introduced: [List]\nKey set piece: [Description]  |  Boss/challenge: [Description]\n\nLEVEL 2 — [Name]\n[Same structure]\n\nPACING CURVE\n[Difficulty arc across the full game]\n\nACCESSIBILITY OPTIONS\n□ Difficulty modes  □ Colorblind mode  □ Control remapping  □ Subtitles` },
    { name: "Technical Architecture", type: "document", folder: "Engineering", content: `TECHNICAL ARCHITECTURE — [PROJECT NAME]\nLead Engineer: [Name]  |  Version: 1.0\n\nENGINE & PLATFORM\nEngine: [Unity / Unreal / Godot / Custom]  |  Version: [XX]\nTarget platforms: [PC / Console / Mobile / Web]\nMinimum specs (PC): [CPU / RAM / GPU]\n\nCORE SYSTEMS\n1. Game Loop — [Description]\n2. Input System — [Description]\n3. Physics — [Built-in / Custom / Third-party]\n4. Audio Engine — [FMOD / Wwise / Built-in]\n5. Save System — [Cloud / Local / Cross-platform]\n6. UI Framework — [Description]\n7. Networking — [P2P / Dedicated servers / N/A]\n8. Analytics — [Tool + events to track]\n\nPERFORMANCE TARGETS\nTarget FPS: [30/60/120]\nLoad time target: <[XX] seconds\nMemory budget: [MB]\n\nTHIRD-PARTY TOOLS & MIDDLEWARE\n[List all licensed tools, SDKs, and their purpose]` },
    { name: "Audio Design Brief", type: "document", folder: "Audio", content: `AUDIO DESIGN BRIEF — [PROJECT NAME]\nAudio Director: [Name]  |  Composer: [Name]\n\nAUDIO DIRECTION\nOverall feel: [e.g., Cinematic orchestral / Synth-driven electronic]\nTone: [e.g., Tense and atmospheric / Epic and uplifting]\nKey influences: [Game soundtracks, films, artists]\n\nMUSIC\nScore type: [Orchestral / Electronic / Hybrid / Licensed]\nAdaptive music: [Yes — describe system / No]\nKey moments:\n• Main theme — [Brief]\n• Exploration — [Tone]\n• Combat — [Intensity]\n• Boss fights — [Escalation arc]\n• Victory/death stings — [Brief]\n\nSOUND EFFECTS DESIGN\nCharacter SFX: [Movement, attacks, voice]\nEnvironment SFX: [Ambient loops, interactive objects]\nUI SFX: [Menu clicks, transitions]\n\nVOICE ACTING\n□ Fully voiced  □ Partial  □ Text only\nIf voiced — characters: [#]  |  Recording: [Remote / Studio]` },
    { name: "Sprint Plan — Pre-Alpha", type: "document", folder: "Production", content: `SPRINT PLAN — PRE-ALPHA — [PROJECT NAME]\nSprint Duration: 2 weeks  |  Team Size: [#]  |  Target: [Date]\n\nMILESTONE: PRE-ALPHA\nDeliverable: Playable vertical slice demonstrating core loop\n\nSPRINT 1 — [Date Range]\nGoal: Core gameplay mechanics functional\n□ [Task] — [Assignee] — [Est. days]\n□ [Task] — [Assignee] — [Est. days]\n□ [Task] — [Assignee] — [Est. days]\n\nSPRINT 2 — [Date Range]\nGoal: First level playable end-to-end\n□ [Task] — [Assignee] — [Est. days]\n□ [Task] — [Assignee] — [Est. days]\n\nSPRINT 3 — [Date Range]\nGoal: Art pass + audio integration\n□ [Task] — [Assignee] — [Est. days]\n\nRISKS & DEPENDENCIES\n• [Risk] — Mitigation: [Plan]\n\nTEAM ROLES\nProducer: [Name]  |  Lead Designer: [Name]\nLead Engineer: [Name]  |  Art Lead: [Name]` },
    { name: "QA Testing Plan", type: "document", folder: "Production", content: `QA TESTING PLAN — [PROJECT NAME]\nQA Lead: [Name]  |  Test Build: [Version]\n\nTESTING PHASES\nPhase 1 — Functional: [Date range]\nPhase 2 — Systems: [Date range]\nPhase 3 — Performance: [Date range]\nPhase 4 — Platform Certification: [Date range]\n\nTEST CATEGORIES\nGAMEPLAY\n□ Core loop completable start-to-finish\n□ All mechanics function as designed\n□ No progression blockers\n\nTECHNICAL\n□ No crashes on target hardware\n□ FPS stays above [XX] at all times\n□ Save/load functions correctly\n\nBUG SEVERITY LEVELS\nP0 — Crash / progression blocker (ship-stopper)\nP1 — Major gameplay issue\nP2 — Minor issue (can ship with)\nP3 — Polish / cosmetic\n\nBUG TRACKING TOOL: [Jira / Notion / Shortcut]\n\nBETA TESTING\nInternal: [Date] / [# testers]\nExternal: [Date] / [# testers]` },
    { name: "Monetization Strategy", type: "document", folder: "Business", content: `MONETIZATION STRATEGY — [PROJECT NAME]\n\nMODEL: [Premium / Free-to-Play / Hybrid / GaaS]\n\nIF PREMIUM\nBase price: $[XX] (Steam / Console / Mobile)\nDLC/expansion plan: [Titles + prices + schedule]\nSales/discount strategy: [Launch sale, seasonal events]\n\nIF FREE-TO-PLAY\nCore F2P loop: [What's free? What's paid?]\nMonetization mechanics:\n□ Cosmetics (skins, emotes)\n□ Battle Pass / Season Pass\n□ Convenience items (XP boosts)\n□ Starter packs / Founder's packs\nPlayer-friendly commitments: [No pay-to-win, etc.]\n\nREVENUE PROJECTIONS\nDay 1 target: [#] units / [#] installs\nMonth 1 revenue target: $[XX]\nYear 1 revenue target: $[XX]\n\nLIVE SERVICE PLAN (if applicable)\nUpdate cadence: [Weekly / Monthly / Seasonal]\nContent roadmap: [Year 1 plan]` },
    { name: "Marketing & Launch Plan", type: "document", folder: "Business", content: `MARKETING & LAUNCH PLAN — [PROJECT NAME]\nStudio: [Name]  |  Launch Date: [Date]  |  Marketing Budget: $[Amount]\n\nPRE-LAUNCH TIMELINE\n[12 months out]: Announce / tease campaign\n[9 months out]: First gameplay trailer\n[6 months out]: Steam page live / Wishlist campaign\n[3 months out]: Press preview / influencer access\n[1 month out]: Review codes sent, launch trailer\n[Launch day]: Press embargo lifts\n\nKEY ASSETS TO CREATE\n□ Announce trailer  □ Gameplay trailer  □ Launch trailer\n□ Key art (horizontal + vertical)  □ Screenshots (15–30)\n□ Press kit\n\nCOMMUNITY BUILDING\nDiscord goal: [# members by launch]\nSteam wishlist target: [# by launch day]\nSocial channels: [Twitter / TikTok / YouTube / Reddit]\n\nLAUNCH EVENTS\nDay 1 stream: [Platform + host]\nLaunch week promotions: [Discount, bundle, events]` },
  ],
  "Mobile App": [
    { name: "Product Requirements Doc (PRD)", type: "document", folder: "Product", content: `PRODUCT REQUIREMENTS DOCUMENT — [PROJECT NAME]\nPM: [Name]  |  Version: 1.0  |  Date: [Date]\n\nPRODUCT VISION\nIn one sentence: [What this app does and for whom]\n\nPROBLEM STATEMENT\n[What problem does this solve? Why is it painful?]\n\nSUCCESS METRICS\n• Primary: [e.g., DAU, retention D7, revenue]\n• Secondary: [e.g., session length, NPS]\n\nFEATURES — V1 SCOPE\nMUST HAVE (launch blockers)\n□ [Feature] — [Why required]\n□ [Feature] — [Why required]\n□ [Feature] — [Why required]\n\nSHOULD HAVE (ship if time)\n□ [Feature]\n□ [Feature]\n\nOUT OF SCOPE (v1)\n□ [Feature] — reason: [Why cut]\n\nTECHNICAL CONSTRAINTS\nPlatform: [iOS / Android / Both]\nBackend: [Firebase / Supabase / Custom / None]\nAuth: [Email / Social / Phone / None]` },
    { name: "User Personas", type: "document", folder: "Product", content: `USER PERSONAS — [PROJECT NAME]\n\nPERSONA 1 — [Name] (Primary)\nAge: [Range]  |  Occupation: [Job/role]\nTech comfort: [Low / Medium / High]  |  Device: [iPhone/Android]\n\nGoals:\n• [What they want to accomplish]\n• [Secondary goal]\n\nPain Points:\n• [Current frustration]\n• [What makes them abandon apps]\n\nHow they'll use [App Name]:\n[2–3 sentences on their core use case]\n\nQuote: "[Something they'd say about their problem]"\n\n---\n\nPERSONA 2 — [Name] (Secondary)\nAge: [Range]  |  Occupation: [Job/role]\nGoals: [Goal]\nPain Points: [Pain]\nHow they'll use the app: [Description]\n\n---\n\nPERSONA PRIORITY: Persona 1 > Persona 2\n[Design decisions should favor Persona 1's mental model]` },
    { name: "User Journey Map", type: "document", folder: "Product", content: `USER JOURNEY MAP — [PROJECT NAME]\nPrimary persona: [Persona 1 name]\n\nSTAGE 1: DISCOVERY\nHow they find the app: [App Store search / social / referral / ad]\nDecision to download: [What tips them over? Reviews, screenshots]\nEmotion: [Curious / Skeptical / Excited]\n\nSTAGE 2: ONBOARDING\nAction: Download → open → onboarding flow\nPotential friction: [Where they might drop off]\nGoal: Get to [core value] in under [X] minutes\nEmotion: [Hopeful / Impatient]\n\nSTAGE 3: FIRST VALUE\nAction: [Complete first core task]\nAha moment: "[Oh — this is what this is for]"\nTime to value target: <[XX] minutes\nEmotion: [Satisfied / Delighted]\n\nSTAGE 4: HABIT FORMATION\nReturn triggers: [Push notification / Email / Natural habit]\nFrequency of use: [Daily / Weekly / As-needed]\n\nFRICTION POINTS TO SOLVE\n1. [Friction point] → Solution: [Design/copy fix]\n2. [Friction point] → Solution: [Design/copy fix]` },
    { name: "Design System Guide", type: "document", folder: "Design", content: `DESIGN SYSTEM GUIDE — [PROJECT NAME]\nDesigner: [Name]  |  Platform: iOS / Android / Both\n\nBRAND ESSENCE\n[2–3 words that capture how the app should feel visually]\n\nCOLOR SYSTEM\nPrimary: [Hex] — used for: [Primary buttons, key actions]\nSecondary: [Hex] — used for: [Accents, highlights]\nBackground: [Hex]  |  Surface: [Hex]  |  Card: [Hex]\nSuccess: [Hex]  |  Warning: [Hex]  |  Error: [Hex]\n\nTYPOGRAPHY\nHeading font: [Font name] — [Weights used]\nBody font: [Font name] — [Weights used]\nScale: H1/H2/H3/Body/Caption/Label — sizes\n\nSPACING SYSTEM\nBase unit: [4px / 8px]\nTouch target minimum: 44×44pt (iOS) / 48×48dp (Android)\n\nCOMPONENTS (to be designed)\n□ Buttons: Primary / Secondary / Ghost / Destructive\n□ Inputs: Text / Password / Search / Select\n□ Cards: Content / Action / List item\n□ Navigation: Tab bar / Top nav / Bottom sheet\n□ States: Loading / Empty / Error / Success` },
    { name: "Technical Architecture", type: "document", folder: "Engineering", content: `TECHNICAL ARCHITECTURE — [PROJECT NAME]\nLead Engineer: [Name]  |  Date: [Date]\n\nPLATFORM\nTarget: [iOS only / Android only / Cross-platform]\nFramework: [Swift/UIKit / SwiftUI / React Native / Flutter / Expo]\nMinimum OS: [iOS XX / Android XX]\n\nARCHITECTURE PATTERN\n[MVC / MVVM / Clean / Redux / BLoC — with brief reasoning]\n\nCORE TECH STACK\nFrontend: [Framework + state management]\nBackend: [Firebase / Supabase / Node.js / None]\nDatabase: [Firestore / PostgreSQL / SQLite / Realm]\nAuth: [Firebase Auth / Auth0 / Apple Sign-In / Google]\nStorage: [S3 / Firebase Storage]\nPush notifications: [APNs / FCM / OneSignal]\nAnalytics: [Amplitude / Mixpanel / Firebase]\nCrash reporting: [Sentry / Firebase Crashlytics]\n\nSECURITY\nData encryption: [At-rest / In-transit]\nApp transport security: Enforced` },
    { name: "App Store Optimization (ASO)", type: "document", folder: "Marketing", content: `APP STORE OPTIMIZATION — [PROJECT NAME]\n\nAPP STORE (iOS) METADATA\nApp Name: [30 chars max]\nSubtitle: [30 chars max — keyword-rich]\nPrimary Category: [Category]\n\nKeywords (100 chars max, comma-separated):\n[keyword1,keyword2,keyword3...]\n\nDescription (first 3 lines show before "more"):\n[First line hook]\n[Benefit 1]\n[Benefit 2]\n[Feature list]\n[CTA]\n\nGOOGLE PLAY METADATA\nShort Description (80 chars): [Hook]\nCategory: [Category]\n\nSCREENSHOTS\nTheme: [Dark / Light / Branded]\nScreenshot 1: [Feature highlight]\nScreenshot 2: [Feature highlight]\nScreenshot 3: [Social proof or use case]\nScreenshot 4: [Feature highlight]\nScreenshot 5: [CTA or summary]\n\nRATINGS & REVIEWS STRATEGY\nPrompt trigger: [After X sessions / After completing Y]\nGoal: [XX] reviews in first month, [X.X]★ average` },
    { name: "Launch Plan", type: "document", folder: "Marketing", content: `LAUNCH PLAN — [PROJECT NAME]\nLaunch Date: [Date]  |  Platform: [App Store / Google Play / Both]\n\nPRE-LAUNCH CHECKLIST\nTechnical\n□ App builds pass all tests\n□ App Store / Google Play listing complete\n□ Privacy policy hosted at [URL]\n□ Analytics configured and verified\n\nMarketing\n□ Landing page live\n□ Social accounts created  □ Press kit ready\n□ Beta feedback incorporated\n\nLAUNCH DAY TIMELINE\n[Time]: App goes live (submission approved)\n[Time]: Launch email sent to waitlist\n[Time]: Social posts go live\n[Time]: Product Hunt launch (if applicable)\n\nMARKETING CHANNELS\n□ Product Hunt (prepare upvote strategy)\n□ Twitter/X (launch thread)\n□ Reddit (relevant subreddits)\n□ Press outreach\n\nFIRST 30 DAYS GOALS\nDownloads: [#]  |  DAU by Day 30: [#]\nApp Store rating: [X.X]+  |  Revenue: $[XX]` },
    { name: "Sprint Roadmap", type: "document", folder: "Engineering", content: `SPRINT ROADMAP — [PROJECT NAME]\nTeam: [Size]  |  Sprint Length: 2 weeks\n\nPHASE 1 — FOUNDATION ([Date] – [Date])\nSprint 1: Core UI shell, navigation, auth flow\nSprint 2: [Core feature 1] backend + API\nSprint 3: [Core feature 1] frontend integration\nSprint 4: [Core feature 2] + internal alpha\n\nPHASE 2 — FEATURE COMPLETE ([Date] – [Date])\nSprint 5: [Core feature 3]\nSprint 6: [Core feature 4]\nSprint 7: Notifications, onboarding, settings\nSprint 8: Internal beta, bug bash\n\nPHASE 3 — POLISH & LAUNCH ([Date] – [Date])\nSprint 9: Performance optimization, accessibility\nSprint 10: App Store assets, legal, final QA\nSprint 11: Soft launch / TestFlight\nSprint 12: Full launch + monitoring\n\nMILESTONES\nInternal Alpha: [Date]  |  Closed Beta: [Date]\nApp Store Submission: [Date]  |  Launch: [Date]` },
    { name: "Operations Plan", type: "document", folder: "Operations", content: `OPERATIONS PLAN — [PROJECT NAME]\n\nINFRASTRUCTURE\nHosting: [AWS / GCP / Firebase / Supabase / Vercel]\nEnvironments: Dev | Staging | Production\nCI/CD: [GitHub Actions / Bitrise / Fastlane]\nMonitoring: [Datadog / Sentry / Firebase Performance]\nUptime target: 99.9%\n\nTEAM OPERATIONS\nStandups: [Daily / Async — tool]\nSprint planning: [Day/time]\nProject management: [Jira / Linear / Notion]\n\nAPP STORE MANAGEMENT\nRelease cadence: [Weekly / Bi-weekly / Monthly]\nPhased rollout: [Yes — X% per day / No]\n\nCUSTOMER SUPPORT\nSupport tool: [Intercom / Zendesk / Help Scout]\nResponse SLA: [XX hours]\n\nKEY METRICS TRACKED\n□ DAU / MAU / Retention D1, D7, D30\n□ Session length + frequency\n□ Crash-free rate target: >99.5%\n□ Revenue metrics (if applicable)` },
  ],
  "Web App / SaaS": [
    { name: "Product Vision & Goals", type: "document", folder: "Product", content: `PRODUCT VISION — [PROJECT NAME]\nPM: [Name]  |  Version: 1.0  |  Date: [Date]\n\nVISION STATEMENT\n[One sentence — what world are you trying to create with this product?]\n\nPRODUCT IN ONE SENTENCE\n[App Name] helps [target user] [solve problem] by [key mechanism].\n\nTHE PROBLEM\n[Describe the problem in user terms — real pain, not assumed pain]\n\n1-YEAR GOALS\n□ [Quantitative goal — e.g., 1,000 paying customers]\n□ [Revenue goal — e.g., $50K MRR]\n□ [Product goal — e.g., NPS > 50]\n\n3-YEAR VISION\n[Where does this product/company sit in 3 years?]\n\nWHAT WE ARE NOT\n[Things explicitly out of scope — important for alignment]\n\nSUCCESS METRICS (North Star)\nPrimary: [One metric — e.g., "Weekly Active Paying Users"]\nTarget: [Value by when]\n\nCOMPETITIVE ADVANTAGE\n[What do you have that competitors don't — and can't easily copy?]` },
    { name: "User Research & Personas", type: "document", folder: "Product", content: `USER RESEARCH & PERSONAS — [PROJECT NAME]\n\nRESEARCH METHODOLOGY\n□ User interviews conducted: [#]\n□ Survey responses: [#]\n□ Competitor analysis: [Done / Pending]\n\nKEY INSIGHTS FROM RESEARCH\n1. [Insight — with evidence]\n2. [Insight — with evidence]\n3. [Insight — with evidence]\n\nPERSONA 1 — [Name] (Primary)\nRole/Title: [Job title]\nCompany size: [SMB / Mid-market / Enterprise]\nTech sophistication: [Low / Medium / High]\nCurrent tool: [What they use today]\nPain: [Primary frustration]\nGoal: [What they want to achieve]\nQuote: "[Their words about their problem]"\n\nPERSONA 2 — [Name] (Secondary)\n[Same structure]\n\nICP (IDEAL CUSTOMER PROFILE)\nCompany type: [Industry / vertical]\nCompany size: [# employees]\nBudget: [$XXX–$XXX/month they'd pay]\nBuying process: [Bottom-up / Top-down]` },
    { name: "Feature Specification", type: "document", folder: "Product", content: `FEATURE SPECIFICATION — [PROJECT NAME]\nFeature: [Feature Name]  |  Author: [PM Name]  |  Status: Draft\n\nOVERVIEW\nWhat it does: [One sentence]  |  Who it's for: [Persona]  |  Why now: [Reason]\n\nUSER STORY\nAs a [persona], I want to [action] so that [benefit].\n\nACCEPTANCE CRITERIA\n□ [Criterion 1 — must be testable and specific]\n□ [Criterion 2]\n□ [Criterion 3]\n\nOUT OF SCOPE (for this version)\n□ [Thing we're not building yet]\n□ [Edge case we'll handle later]\n\nDESIGN REQUIREMENTS\n[Link to Figma / describe key UI elements]\nResponsive: [Desktop / Tablet / Mobile]\nAccessibility: [WCAG AA target]\n\nANALYTICS / EVENTS TO TRACK\n□ [Event name] — [Trigger]\n□ [Event name] — [Trigger]\n\nSUCCESS CRITERIA\nPrimary metric: [How will we know this feature worked?]` },
    { name: "Design System & Brand", type: "document", folder: "Design", content: `DESIGN SYSTEM & BRAND — [PROJECT NAME]\nDesigner: [Name]  |  Version: 1.0\n\nBRAND ESSENCE\nPersonality: [3 adjectives — e.g., "Clear, powerful, trustworthy"]\nVoice: [Formal / Casual / Playful / Expert]\n\nCOLOR SYSTEM\nPrimary: [Hex] — [Usage]\nSecondary: [Hex] — [Usage]\nNeutral scale: [Gray-50 through Gray-900]\nSemantic: Success [Hex]  |  Warning [Hex]  |  Error [Hex]  |  Info [Hex]\n\nTYPOGRAPHY\nHeading: [Font] — [Weights]\nBody: [Font] — [Weights]\nType scale: xs/sm/base/lg/xl/2xl/3xl/4xl\n\nSPACING & LAYOUT\nBase unit: 4px  |  Grid: 12-column\nMax content width: [1280px]\n\nCOMPONENTS (Storybook / Figma)\n□ Button: Primary / Secondary / Ghost / Danger / Link\n□ Form: Input / Textarea / Select / Checkbox / Toggle\n□ Feedback: Toast / Alert / Badge / Loading\n□ Navigation: Sidebar / Top nav / Breadcrumb / Tabs\n□ Data: Table / Card / List / Empty state\n\nDARK MODE\nSupported: [Yes / No / Planned]` },
    { name: "System Architecture", type: "document", folder: "Engineering", content: `SYSTEM ARCHITECTURE — [PROJECT NAME]\nArchitect: [Name]  |  Version: 1.0\n\nARCHITECTURE STYLE\n[Monolith / Microservices / Serverless / Hybrid]\nReasoning: [Why this approach for our scale and team]\n\nTECH STACK\nFrontend: [React / Next.js / Vue / SvelteKit]\nBackend: [Node.js / Python / Go]\nDatabase: [PostgreSQL / MySQL / MongoDB]\nCache: [Redis / Upstash / None]\nAuth: [NextAuth / Clerk / Auth0 / Custom]\nFile storage: [S3 / Cloudflare R2]\nEmail: [Resend / SendGrid / Postmark]\nPayments: [Stripe / Paddle]\n\nINFRASTRUCTURE\nHosting: [Vercel / Railway / AWS / GCP / Render]\nDatabase host: [Supabase / Neon / RDS]\nCDN: [Cloudflare / Fastly]\nMonitoring: [Datadog / Sentry]\n\nSECURITY\nAuth expiry: [Duration]\nRate limiting: [Tool + limits]\nHTTPS: Enforced everywhere\nCompliance target: [SOC 2 / GDPR / HIPAA / none]` },
    { name: "API Documentation", type: "document", folder: "Engineering", content: `API DOCUMENTATION — [PROJECT NAME]\nBase URL: https://api.[domain].com/v1  |  Auth: Bearer JWT\n\nAUTHENTICATION\nPOST /auth/register — Create account\nBody: { email, password, name }  |  Response: { user, token }\n\nPOST /auth/login — Sign in\nBody: { email, password }  |  Response: { user, token }\n\n[RESOURCE 1]\nGET /[resource] — List all (paginated)\nQuery: ?page=1&limit=20&sort=createdAt&order=desc\nResponse: { data: [...], total, page, limit }\n\nGET /[resource]/:id — Get single\nPOST /[resource] — Create\nPUT /[resource]/:id — Update\nDELETE /[resource]/:id — Delete\n\n[RESOURCE 2]\n[Same structure]\n\nERROR CODES\n400 Bad Request — Validation error\n401 Unauthorized — Missing/invalid token\n403 Forbidden — Insufficient permissions\n404 Not Found — Resource doesn't exist\n429 Too Many Requests — Rate limit exceeded\n500 Internal Server Error\n\nRATE LIMITS\nAuthenticated: [XXX] requests/minute\nUnauthenticated: [XX] requests/minute` },
    { name: "Pricing & Conversion Strategy", type: "document", folder: "Growth", content: `PRICING & CONVERSION STRATEGY — [PROJECT NAME]\n\nPRICING MODEL\n□ Freemium  □ Free trial  □ Paid-only  □ Usage-based  □ Seat-based\n\nFREE / STARTER\nPrice: $0  |  Limits: [What's capped]\nFeatures: [What's included]\nGoal: [Acquisition / lead gen / PLG]\n\nPRO\nPrice: $[XX]/month or $[XX]/year\nFeatures: [Added features]\nTarget: [Individual power users / small teams]\n\nTEAM / BUSINESS\nPrice: $[XX]/seat/month\nFeatures: [Collaboration, admin, SSO]\nTarget: [Teams of X–XX people]\n\nENTERPRISE\nPrice: Custom  |  Features: [SOC 2, SAML, dedicated support]\n\nCONVERSION STRATEGY\nFree → Pro trigger: [What action triggers upgrade prompt]\nTrial approach: [14-day / 30-day / feature-gated]\n\nMETRICS\nFree signup → paid conversion: Target [X]%\nTrial → paid: Target [X]%\nMRR target month 6: $[XX]  |  Month 12: $[XX]` },
    { name: "Development Roadmap", type: "document", folder: "Engineering", content: `DEVELOPMENT ROADMAP — [PROJECT NAME]\n\nCURRENT SPRINT ([Date] – [Date])\n□ [Task] — [Assignee]\n□ [Task] — [Assignee]\n\nV1 LAUNCH MILESTONE — [Date]\nMust-have:\n□ [Feature 1]\n□ [Feature 2]\n□ [Feature 3]\n□ [Feature 4]\n□ [Feature 5]\n\nV1.1 — POST-LAUNCH QUICK WINS ([Date])\n□ [Feature] — estimated: [X] days\n□ [Feature] — estimated: [X] days\n\nV2 — GROWTH FEATURES ([Date])\n□ [Feature]\n□ [Feature]\n\nBACKLOG (Unscheduled)\n□ [Feature]\n□ [Feature]\n\nTECHNICAL DEBT QUEUE\n□ [Debt item] — priority: [H/M/L]\n□ [Debt item] — priority: [H/M/L]\n\nTEAM\n[Name] — [Role] — [Focus area]\n[Name] — [Role] — [Focus area]` },
    { name: "SEO & Content Strategy", type: "document", folder: "Growth", content: `SEO & CONTENT STRATEGY — [PROJECT NAME]\n\nSEO FOUNDATION\nDomain: [domain.com]  |  Target DA goal: [XX] within [X] months\nPrimary keyword cluster: [Topic]\n\nKEYWORD TARGETS\nHead terms (high volume, competitive):\n• [keyword] — [search volume] — [current rank / target]\n• [keyword] — [search volume] — [current rank / target]\n\nLong-tail (lower volume, easier wins):\n• [keyword phrase] — [volume] — [difficulty]\n\nCONTENT PLAN (first 90 days)\nWeek 1–2: [Pillar content piece — topic]\nWeek 3–4: [Supporting blog post 1]\nWeek 5–6: [Supporting blog post 2]\nWeek 7–8: [Comparison / alternative page]\nWeek 9–12: [Use case pages + case study]\n\nCONTENT TYPES TO BUILD\n□ Landing pages (by use case / persona / competitor)\n□ Blog (SEO-focused, problem-awareness)\n□ Documentation / help center\n□ Comparison pages ([Product] vs [Competitor])\n□ Template library (link magnet)\n\nTOOLS\nSEO: [Ahrefs / SEMrush / Clearscope]\nAnalytics: [GA4 / Plausible]` },
    { name: "Customer Success Plan", type: "document", folder: "Operations", content: `CUSTOMER SUCCESS PLAN — [PROJECT NAME]\n\nONBOARDING FLOW\nGoal: Get user to [core aha moment] in <[X] minutes\n\nStep 1: Account creation → [what happens]\nStep 2: First action → guidance provided\nStep 3: Aha moment achieved\nStep 4: Habit-forming follow-up — email D+1\n\nONBOARDING EMAILS\nDay 0: Welcome + getting started\nDay 1: [Tip or resource]\nDay 3: [Feature highlight]\nDay 7: Check-in / did you achieve [goal]?\nDay 14: [Upgrade prompt]\n\nHEALTH SCORING\nGreen (healthy): [Criteria — logged in 3+ times this week]\nYellow (at risk): [1 login in 2 weeks]\nRed (churning): [No login in 30 days]\n\nRETENTION LEVERS\nAt-risk trigger: [Automated email / in-app message]\nCancellation flow: [Pause / discount offer / exit survey]\n\nSUPPORT\nTool: [Intercom / Crisp / HelpScout]\nResponse SLA: <[XX] hours\n\nCHURN REDUCTION TARGETS\nTarget: <[X]% monthly` },
  ],
  "Business": [
    { name: "Business Plan", type: "document", folder: "Foundation", content: `BUSINESS PLAN — [COMPANY NAME]\nDate: [Date]  |  Prepared by: [Name]  |  Version: 1.0\n\nEXECUTIVE SUMMARY\n[Company name] is a [type of business] that [what it does] for [target customer]. We are solving [problem]. Our revenue model is [model].\n\nTHE OPPORTUNITY\nMarket size: $[TAM]  |  Problem: [Describe]  |  Solution: [How you solve it]\n\nPRODUCT / SERVICE\n[Describe what you sell and what makes it different]\n\nBUSINESS MODEL\nRevenue streams:\n1. [Stream 1] — $[XX] per [unit/month]\n2. [Stream 2] — $[XX] per [unit]\n\nMARKET & CUSTOMERS\nTarget customer: [Description]\nCustomer acquisition: [How you find and convert customers]\n\nCOMPETITION\n[Competitor 1] — Strength: [X] — Our advantage: [Y]\n[Competitor 2] — Strength: [X] — Our advantage: [Y]\n\nTEAM\n[Name] — [Role] — [Background]\n[Name] — [Role] — [Background]\n\nFINANCIAL HIGHLIGHTS\nYear 1 revenue: $[XX]  |  Year 2: $[XX]  |  Year 3: $[XX]\nBreak-even: Month [#]` },
    { name: "Mission, Vision & Values", type: "document", folder: "Foundation", content: `MISSION, VISION & VALUES — [COMPANY NAME]\n\nMISSION STATEMENT\n(What we do and for whom — present tense)\n[Company name] [verb] [target audience] to [outcome].\n\nVISION STATEMENT\n(Where we're going — aspirational future state)\nA world where [vision of change this company creates].\n\nOUR VALUES\n1. [Value name]\n[2–3 sentences on what this means in practice]\n\n2. [Value name]\n[2–3 sentences]\n\n3. [Value name]\n[2–3 sentences]\n\n4. [Value name]\n[2–3 sentences]\n\nHOW WE WORK (Cultural norms)\n• [Norm 1 — e.g., "We default to async communication"]\n• [Norm 2]\n• [Norm 3]\n\nWHAT WE DON'T DO\n[Things explicitly outside the company's values or scope]` },
    { name: "Revenue Model", type: "document", folder: "Finance", content: `REVENUE MODEL — [COMPANY NAME]\n\nBUSINESS MODEL TYPE\n□ SaaS / Subscription  □ Marketplace  □ E-commerce  □ Services\n□ Product (physical)  □ Licensing  □ Advertising  □ Hybrid\n\nPRIMARY REVENUE STREAMS\nStream 1: [Name]\nHow it works: [Description]\nPricing: $[XX] per [unit/month/year]\nGross margin: [%]\n\nStream 2: [Name]\nHow it works: [Description]\nPricing: $[XX] per [unit]\n\nUNIT ECONOMICS\nAverage Contract Value (ACV): $[XX]\nCustomer Acquisition Cost (CAC): $[XX]\nLifetime Value (LTV): $[XX]\nLTV:CAC ratio: [X:1] — target: 3:1+\n\nREVENUE PROJECTIONS\nMonth 1: $[XX]  |  Month 6: $[XX]  |  Month 12: $[XX]\n\nKEY ASSUMPTIONS\n• [Assumption 1 — e.g., "Monthly churn <2%"]\n• [Assumption 2]\n• [Assumption 3]` },
    { name: "Financial Projections (12-Month)", type: "document", folder: "Finance", content: `12-MONTH FINANCIAL PROJECTIONS — [COMPANY NAME]\n\nASSUMPTIONS\nStarting MRR: $[XX]  |  Monthly growth rate: [X]%\nMonthly churn: [X]%  |  COGS as % of revenue: [X]%\n\nMONTHLY P&L SUMMARY\nMonth | Revenue | COGS | Gross Profit | Opex | Net Income\nJan   | $[XX]   | $[XX]| $[XX]        | $[XX]| $[XX]\nFeb   |\nMar   |\nApr   |\nMay   |\nJun   |\nJul   |\nAug   |\nSep   |\nOct   |\nNov   |\nDec   |\n\nANNUAL TOTALS\nTotal Revenue: $[XX]\nTotal Gross Profit: $[XX] ([X]% margin)\nNet Income (Loss): $[XX]\n\nKEY EXPENSE CATEGORIES\nPayroll: $[XX]/month  |  Marketing: $[XX]/month\nInfrastructure: $[XX]/month  |  Tools: $[XX]/month\n\nFUNDING RUNWAY\nCurrent cash: $[XX]  |  Monthly burn: $[XX]  |  Runway: [X] months` },
    { name: "Brand Guide", type: "document", folder: "Marketing", content: `BRAND GUIDE — [COMPANY NAME]\n\nBRAND IDENTITY\nMission: [One sentence]\nPersonality: [3–5 adjectives — e.g., "Bold, approachable, expert, warm"]\nVoice: [Formal / Casual / Conversational / Expert / Playful]\n\nLOGO\nPrimary logo: [Description / link to file]\nLogo minimum size: [XX]px  |  Clear space: [X × logo height]\nDon't use the logo: [On busy backgrounds / at angles / stretched]\n\nCOLORS\nPrimary: [Hex] — [Color name]\nSecondary: [Hex] — [Color name]\nAccent: [Hex] — [Color name]\n\nTYPOGRAPHY\nHeading: [Font] [Weight]\nBody: [Font] [Weight]\n\nIMAGERY STYLE\nPhotography: [Natural light / Studio / Lifestyle — style]\nAvoid: [Types of imagery that don't fit the brand]\n\nMESSAGING\nTagline: [Current tagline]\nElevator pitch: [30 seconds]\nKey messages: [3–5 messages the brand consistently communicates]` },
    { name: "Marketing Plan", type: "document", folder: "Marketing", content: `MARKETING PLAN — [COMPANY NAME]\nPeriod: [Q1 / Year]  |  Budget: $[XX]\n\nMARKETING GOALS\n1. [Goal + metric + target]\n2. [Goal + metric + target]\n3. [Goal + metric + target]\n\nCHANNELS & BUDGET ALLOCATION\n[Paid Search]: $[XX]/month — Expected: [Result]\n[Content/SEO]: $[XX]/month — Expected: [Result]\n[Social Media]: $[XX]/month — Expected: [Result]\n[Events/PR]: $[XX]/month — Expected: [Result]\n[Email]: $[XX]/month — Expected: [Result]\n\nCONTENT PLAN\nBlog/SEO: [X] posts/month — Topics: [List]\nEmail: [X] sends/month — Segments: [List]\nSocial: [Platforms] — [X] posts/week\n\nMETRICS TO TRACK\n□ Leads generated\n□ Cost per lead (CPL)\n□ Conversion rate (lead → customer)\n□ Customer acquisition cost (CAC)\n□ Organic traffic growth` },
    { name: "Standard Operating Procedures", type: "document", folder: "Operations", content: `STANDARD OPERATING PROCEDURES — [COMPANY NAME]\n\nSOP DIRECTORY\n1. Customer Onboarding — [Owner]\n2. Order Fulfillment — [Owner]\n3. Customer Support Response — [Owner]\n4. Invoicing & Payment Collection — [Owner]\n5. New Employee Onboarding — [Owner]\n\n---\n\nSOP #1: CUSTOMER ONBOARDING\nTrigger: New customer signed\nOwner: [Name/Role]\nTime required: [X hours over X days]\n\nStep 1: [Action] — [Who] — [Tool] — [Timeframe]\nStep 2: [Action] — [Who] — [Tool] — [Timeframe]\nStep 3: [Action] — [Who] — [Tool] — [Timeframe]\nStep 4: [Action] — [Who] — [Tool] — [Timeframe]\n\nSuccess criteria: [What does a successful onboarding look like?]\nCommon issues: [Known pitfalls and how to handle them]\n\n---\n\nSOP #2: [Next Process]\n[Same structure]\n\nAll SOPs reviewed quarterly by [Name/Role].` },
    { name: "Hiring Plan", type: "document", folder: "Operations", content: `HIRING PLAN — [COMPANY NAME]\n\nCURRENT TEAM\n[Name] — [Role] — [Start date]\n[Name] — [Role] — [Start date]\n\nHIRING ROADMAP\nQ1 [Year]: [Role] — Priority: High — Budget: $[XX]/year\nQ2 [Year]: [Role] — Priority: High — Budget: $[XX]/year\nQ3 [Year]: [Role] — Priority: Medium — Budget: $[XX]/year\nQ4 [Year]: [Role] — Priority: Medium — Budget: $[XX]/year\n\nHIRING PROCESS\nStep 1: Define role + write JD\nStep 2: Post to [LinkedIn / AngelList / referrals]\nStep 3: Initial screen — [Who does it?]\nStep 4: Skills assessment\nStep 5: Final interview round — [Who's involved?]\nStep 6: Reference check + offer\nStep 7: Onboarding\n\nCOMPENSATION BENCHMARKS\n[Role]: $[Min]–$[Max] + [Equity: X%]\n\nBENEFITS\n□ Health / dental / vision\n□ [X] days PTO  □ Remote / hybrid policy\n□ Equity  □ Learning budget: $[XX]/year` },
    { name: "Legal Checklist", type: "document", folder: "Legal", content: `LEGAL CHECKLIST — [COMPANY NAME]\n\nBUSINESS FORMATION\n□ Entity formed: [LLC / S-Corp / C-Corp] — State: [State]\n□ EIN obtained (IRS)\n□ Operating agreement / bylaws executed\n□ Bank account opened\n□ Business license obtained\n\nINTELLECTUAL PROPERTY\n□ Company name trademarked — Status: [Filed / Pending / Granted]\n□ Domain registered: [domain.com]\n□ Source code / IP assigned from founders to company\n\nCUSTOMER-FACING\n□ Terms of Service drafted and live\n□ Privacy Policy drafted and live\n□ Refund policy documented\n\nFINANCIAL & COMPLIANCE\n□ Accounting software: [QuickBooks / Bench / etc.]\n□ Payroll system: [Gusto / Rippling / etc.]\n□ Sales tax nexus reviewed\n\nLEGAL COUNSEL\nAttorney: [Name]  |  Firm: [Firm]  |  Contact: [Email]` },
    { name: "Investor Pitch Outline", type: "document", folder: "Growth", content: `INVESTOR PITCH OUTLINE — [COMPANY NAME]\n\nSLIDE 1: TITLE\nCompany name + logo + tagline + "[One-line description]"\n\nSLIDE 2: THE PROBLEM\n[Describe pain with empathy and specificity. Use data.]\n\nSLIDE 3: THE SOLUTION\n[What you do, simply. Show the product.]\n\nSLIDE 4: PRODUCT\n[Screenshot / demo / key feature highlight]\n\nSLIDE 5: MARKET SIZE\nTAM: $[XX]B  |  SAM: $[XX]B  |  SOM: $[XX]M\n\nSLIDE 6: BUSINESS MODEL\nHow you make money. Unit economics: LTV/CAC.\n\nSLIDE 7: TRACTION\n[Revenue / users / growth rate — MoM: [X]%]\n\nSLIDE 8: GO-TO-MARKET\n[How you acquire customers. Distribution strategy.]\n\nSLIDE 9: COMPETITION\n[Where you win. What incumbents can't do.]\n\nSLIDE 10: TEAM\n[Founders + key hires — domain expertise]\n\nSLIDE 11: FINANCIALS\nRevenue today: $[XX]  |  12-month projection chart\n\nSLIDE 12: THE ASK\nRaising: $[XX]  |  Use of funds: [Breakdown]  |  Runway: [X] months` },
  ],
  "Startup": [
    { name: "Problem Statement", type: "document", folder: "Idea & Vision", content: `PROBLEM STATEMENT — [STARTUP NAME]\n\nTHE PROBLEM\n[Describe the problem in specific, concrete terms. Whose problem is it? How often do they face it? What do they lose — time, money, opportunities?]\n\nWHO HAS THIS PROBLEM\nPrimary sufferer: [Specific persona]\nScale: Estimated [XX] million in the US\nValidation source: [Interviews, surveys, data]\n\nHOW THEY SOLVE IT TODAY\n[Current workaround — spreadsheets, manual processes, expensive tools?]\nProblems with current solution:\n• [Pain 1]\n• [Pain 2]\n• [Pain 3]\n\nTHE COST OF THE PROBLEM\nEconomic cost: [$ per person per year]\nTime cost: [Hours per week/month]\nEmotional cost: [Frustration, stress, missed opportunity]\n\nOUR INSIGHT\n[What do you know about this problem that others miss?]\n\nPROBLEM VALIDATION\n□ Interviews conducted: [#]\n□ Key quotes: "[Quote from a real potential customer]"\n□ Surveys: [# respondents, key stat]` },
    { name: "Solution & Value Proposition", type: "document", folder: "Idea & Vision", content: `SOLUTION & VALUE PROPOSITION — [STARTUP NAME]\n\nTHE SOLUTION\n[What does [Startup Name] do? Describe it simply.]\n\nHOW IT WORKS\nStep 1: [User does X]\nStep 2: [System does Y]\nStep 3: [User gets Z — the value]\n\nTHE VALUE PROPOSITION\nFor [target customer] who [has this problem], [Startup Name] is [product category] that [key benefit]. Unlike [alternative], we [key differentiator].\n\nBENEFITS (outcomes the user gets)\n1. [Benefit 1 — quantify: "Save 3 hours per week"]\n2. [Benefit 2 — quantify: "Reduce error rate by 80%"]\n3. [Benefit 3]\n\nFEATURES (that deliver those benefits)\n• [Feature] → delivers → [Benefit]\n• [Feature] → delivers → [Benefit]\n\nWHAT MAKES US DEFENSIBLE\n□ Network effects  □ Data moat  □ Switching costs\n□ Brand / trust  □ Proprietary technology  □ Distribution\n\nOUR "SECRET"\n[The non-obvious insight that makes this work when others have failed]` },
    { name: "Target Market & TAM", type: "document", folder: "Idea & Vision", content: `TARGET MARKET & TAM — [STARTUP NAME]\n\nMARKET SIZING\nTAM (Total Addressable Market):\nCalculation: [# potential customers] × $[price] × [frequency] = $[TAM]\nTAM: $[XX] billion\n\nSAM (Serviceable Addressable Market):\nSegment: [Geographic / vertical / size constraint]\nSAM: $[XX] billion\n\nSOM (5-year target): $[XX] million\n\nIDEAL CUSTOMER PROFILE (ICP)\nIndustry: [Vertical]  |  Company size: [# employees]\nGeography: [Region]  |  Tech maturity: [Early adopter / mainstream]\nDecision maker: [Title]  |  Budget: $[XX–XX] per year\n\nGO-TO-MARKET BEACHHEAD\nStarting niche: [Hyper-specific first customer segment]\nWhy start here: [Density, word of mouth, ease of reach]\nExpansion path: [From niche → adjacent → full market]\n\nMARKET DYNAMICS\nGrowth rate: [X]% annually — Source: [Report]\nKey trends: [List 3]\nRegulatory tailwinds/headwinds: [If applicable]` },
    { name: "MVP Specification", type: "document", folder: "Product", content: `MVP SPECIFICATION — [STARTUP NAME]\nVersion: 1.0  |  Target Launch: [Date]\n\nMVP GOAL\n[One sentence: What does this MVP prove? What hypothesis are you testing?]\n\nWHAT THE MVP DOES (Core loop)\nA user can:\n1. [Action 1 — first step]\n2. [Action 2 — core value-creating step]\n3. [Action 3 — deliver the outcome]\n\nIN SCOPE — V1\n□ [Feature 1] — because: [This is the core value]\n□ [Feature 2] — because: [Required for core loop]\n□ [Feature 3] — because: [Required for core loop]\n\nNOT IN SCOPE — V1 (explicit)\n□ [Feature] — deferred: [Reason]\n□ [Feature] — deferred: [Reason]\n□ [Feature] — deferred: [Reason]\n\nSUCCESS CRITERIA\n□ [X] users complete the core loop in one session\n□ [X]% of beta users return within 7 days\n□ [X] users say "very disappointed" if it went away\n\nMANUAL / FAKE BEFORE AUTOMATING\n[What parts can be done manually (Wizard of Oz) before building?]` },
    { name: "Business Model Canvas", type: "document", folder: "Business Model", content: `BUSINESS MODEL CANVAS — [STARTUP NAME]\n\nVALUE PROPOSITIONS\n[What value do you deliver? Which problems do you solve?]\n•\n•\n\nCUSTOMER SEGMENTS\nPrimary: [Description]  |  Secondary: [Description]\n\nCHANNELS\nAwareness: [Channel]  |  Evaluation: [Channel]\nPurchase: [Channel]  |  After-sales: [Channel]\n\nKEY ACTIVITIES\n•  |  •  |  •\n\nKEY RESOURCES\n□ Physical:  □ Intellectual (IP, data):  □ Human:  □ Financial:\n\nKEY PARTNERS\n•  |  •\n\nREVENUE STREAMS\nStream 1: [Type] — Price: $[XX] — Volume: [Est.]\nStream 2: [Type] — Price: $[XX] — Volume: [Est.]\n\nCOST STRUCTURE\nFixed costs: [Rent, salaries, infrastructure]\nVariable costs: [COGS, marketing, support]\nEconomies of scale: [When do unit economics improve?]` },
    { name: "Pitch Deck Outline", type: "document", folder: "Fundraising", content: `PITCH DECK OUTLINE — [STARTUP NAME]\nRaising: $[XX] [SAFE / Seed]  |  Valuation cap: $[XXM]\n\nSLIDE 1: COVER — [Name + logo + tagline + "Seed Deck"]\nSLIDE 2: THE PROBLEM — [Emotional, specific, validated pain]\nSLIDE 3: THE SOLUTION — [Plain English + product screenshot]\nSLIDE 4: PRODUCT DEMO — [Show it, don't just tell it]\nSLIDE 5: MARKET SIZE — TAM / SAM / SOM with methodology\nSLIDE 6: TRACTION — [Most compelling metric + growth chart]\nSLIDE 7: BUSINESS MODEL — [How you make money + unit economics]\nSLIDE 8: GO-TO-MARKET — [Distribution. First 100 customers.]\nSLIDE 9: TEAM — [Why you? Domain expertise, previous wins]\nSLIDE 10: COMPETITION — [2×2 or table. Where you win.]\nSLIDE 11: THE ASK\nRaising: $[XX]\nTerms: [SAFE / Equity — cap / discount]\nUse of funds: [Specific breakdown]\nMilestones this gets us to: [List 2–3]\n\nAPPENDIX (have ready, don't show unless asked)\n• Detailed financial model\n• Customer references  • Technical architecture` },
    { name: "GTM Strategy", type: "document", folder: "Marketing", content: `GO-TO-MARKET STRATEGY — [STARTUP NAME]\n\nGTM MOTION\n□ Product-Led Growth (PLG)  □ Sales-Led Growth (SLG)\n□ Community-Led  □ Content/SEO-Led  □ Hybrid\n\nBEACHHEAD MARKET\nWho: [Specific description]\nWhere they are: [Where to find them]\nWhy them first: [Density, pain level, referral potential]\n\nFIRST 10 CUSTOMERS (plan)\nSource: [How — your network / cold outreach / community]\nScript: [What you say when you reach out]\nOffer: [Free / Paid / Pilot — what's the ask?]\n\nFIRST 100 CUSTOMERS (plan)\nChannel 1: [What's working from 0→10? Double down.]\nChannel 2: [New channel to test]\nConversion funnel: [Awareness → Signup → Activation → Revenue]\n\nACQUISITION CHANNELS (to test)\n□ Outbound (cold email / LinkedIn)\n□ Content marketing / SEO\n□ Product Hunt / launch\n□ Community (Reddit / Slack / Discord)\n□ Partnerships / integrations\n□ Paid social\n□ Word of mouth / referrals\n\nPRICING AT LAUNCH\nPrice: $[XX]/month  |  Rationale: [Why this price?]` },
    { name: "Investor CRM Template", type: "document", folder: "Fundraising", content: `INVESTOR CRM — [STARTUP NAME]\nRound: $[XX] [SAFE / Seed]  |  Target close: [Date]\n\nSTATUS KEY: 🟢 Warm 🟡 Intro Needed 🔵 In Diligence 🔴 Passed ✅ Committed\n\nTIER 1 — LEAD INVESTORS (target)\nName | Firm | Status | Last Contact | Notes\n[Name] | [Firm] | 🟡 | [Date] | [Intro via who?]\n[Name] | [Firm] | 🟢 | [Date] | [Met at event]\n\nTIER 2 — FILL ROUND\nName | Firm | Check size | Status | Notes\n[Name] | [Angel] | $[XX]K | 🟢 | [Notes]\n\nCOMMITTED / SIGNED\nName | Amount | Type | Date\n[Name] | $[XX] | SAFE [cap: $XXM] | [Date]\n\nTOTAL COMMITTED: $[XX]  |  TARGET: $[XX]  |  REMAINING: $[XX]\n\nMATERIALS READY\n□ Pitch deck  □ Executive summary (1 page)\n□ Data room: [Link]  □ Demo: [Link]  □ Financial model: [Link]` },
    { name: "Legal Checklist", type: "document", folder: "Legal", content: `STARTUP LEGAL CHECKLIST — [STARTUP NAME]\n\nFORMATION\n□ Delaware C-Corp incorporated — Date: [Date]\n□ EIN obtained\n□ Board of directors established — Members: [Names]\n□ Bylaws executed\n□ Bank account opened\n□ Stock option pool created — Size: [X]%\n\nFOUNDERS\n□ Founder Restricted Stock Purchase Agreements signed (all founders)\n□ Vesting schedule: 4-year / 1-year cliff\n□ IP Assignment Agreements signed\n□ Non-compete / NDA between founders (if applicable)\n\nCAP TABLE\n□ Initial shares issued: [Total] — [Founder breakdown]\n□ SAFE agreements documented (if any)\n□ Cap table in Carta / Pulley: [Link]\n\nCUSTOMER-FACING\n□ Terms of Service live: [URL]\n□ Privacy Policy live: [URL] — GDPR/CCPA compliant\n\nLEGAL COUNSEL\nAttorney: [Name]  |  Firm: [Firm]\nStartup-friendly: [Yes — deferred fees / fixed packages]` },
    { name: "Unit Economics", type: "document", folder: "Business Model", content: `UNIT ECONOMICS — [STARTUP NAME]\n\nKEY METRICS\nARR / MRR: $[XX]\nMonthly growth rate: [X]%\n\nAVERAGE CONTRACT VALUE (ACV)\nMonthly: $[XX]  |  Annual: $[XX]\n\nCUSTOMER ACQUISITION COST (CAC)\nSales & marketing spend: $[XX]/month\nNew customers/month: [#]\nCAC = $[XX]\n\nLIFETIME VALUE (LTV)\nMonthly revenue per customer: $[XX]\nAverage customer lifetime: [X] months\nLTV = $[XX]\n\nLTV:CAC RATIO\nCurrent: [X:1]  |  Target: 3:1+\n\nCAC PAYBACK PERIOD\nCurrent: [X] months  |  Target: <12 months\n\nGROSS MARGIN\nRevenue: $[XX]  |  COGS: $[XX]  |  Gross margin: [X]%\nTarget: >70% (SaaS) / >50% (marketplace)\n\nCHURN\nMonthly revenue churn: [X]%  |  Monthly customer churn: [X]%\nNet Revenue Retention (NRR): [X]%  |  Target: >100%\n\nCOHORT ANALYSIS\n[Month cohort] — D30 retention: [X]% — D90: [X]% — D180: [X]%\n\nPATH TO PROFITABILITY\nCurrent burn: $[XX]/month\nRunway: [X] months\nBreak-even ARR: $[XX]\nBreak-even date: [Date]` },
  ],
  "Physical Product": [
    { name: "Problem & Opportunity", type: "document", folder: "Discovery", content: `PROBLEM & OPPORTUNITY — [PRODUCT NAME]\n\nTHE PROBLEM\n[What problem does this product solve? Be specific about the user's experience.]\n\nWHO HAS THIS PROBLEM\nTarget customer: [Description — age, lifestyle, context]\nMarket size: Estimated [#] potential buyers in [geography]\nHow they deal with it today: [Current solutions — and why they're inadequate]\n\nTHE OPPORTUNITY\nMarket gap: [Exactly what's missing in the current market]\nTiming: [Why now is the right time?]\nTrends in your favor: [Consumer behavior, tech, regulation]\n\nCOMPETITIVE LANDSCAPE\nProduct | Price | Strengths | Weaknesses | Our Edge\n[Competitor 1] | $[XX] | [Strengths] | [Weaknesses] | [Why we win]\n[Competitor 2] | $[XX] | [Strengths] | [Weaknesses] | [Why we win]\n\nBUSINESS OPPORTUNITY\nTarget price point: $[XX] retail\nEstimated COGS: $[XX]  |  Gross margin: [X]%\nYear 1 unit target: [#] units\n\nVALIDATION DONE\n□ Customer interviews: [#]  □ Surveys: [#]\n□ Prototype tested: [Yes/No]  □ Pre-orders: [#]` },
    { name: "Product Specification", type: "document", folder: "Design", content: `PRODUCT SPECIFICATION — [PRODUCT NAME]\nVersion: 1.0  |  Date: [Date]  |  Designer: [Name]\n\nPRODUCT OVERVIEW\nProduct name: [Name]  |  Category: [Consumer / Industrial]\nTarget use case: [When and how is it used?]\nTarget user: [Who uses it?]\n\nDIMENSIONS & FORM FACTOR\nDimensions: [L × W × H] mm  |  Weight: [XX] grams\nForm factor: [Describe shape, ergonomics]\n\nMATERIALS\nPrimary: [Material] — Spec: [Grade/type]\nSecondary: [Material] — Spec: [Grade/type]\nSurface finish: [Matte / Gloss / Texture — Pantone color]\n\nFUNCTIONAL REQUIREMENTS\n• [Spec 1 — e.g., "Holds up to 50 lbs"]\n• [Spec 2 — e.g., "Waterproof to IP67"]\n• [Spec 3 — e.g., "Battery life: 48 hours"]\n\nSAFETY & COMPLIANCE\n[UL / CE / FCC / CPSC / FDA — as applicable]\n\nPACKAGING\nRetail packaging type: [Box / Bag / Clamshell]\nWhat's included: [Product + accessories + manual]\n\nDESIGN REFERENCE\n[Link to Figma / CAD files / mood board]` },
    { name: "Manufacturing Requirements", type: "document", folder: "Manufacturing", content: `MANUFACTURING REQUIREMENTS — [PRODUCT NAME]\n\nPRODUCTION METHOD\n□ Injection molding  □ CNC machining  □ Die casting\n□ 3D printing  □ Electronics PCBA  □ Soft goods / cut & sew\n□ Assembly of purchased components  □ Other: [Description]\n\nBILL OF MATERIALS (BOM)\n# | Component | Spec | Supplier | Unit Cost | MOQ | Lead Time\n1 | [Component] | [Spec] | [Supplier] | $[XX] | [#] | [Weeks]\n2 | [Component] | [Spec] | [Supplier] | $[XX] | [#] | [Weeks]\n\nASSEMBLY (high level)\nStep 1: [Assembly step]\nStep 2: [Assembly step]\nStep 3: [Assembly step]\nQuality check: [Inspection point]\n\nQUALITY CONTROL\nDefect rate target: <[X]%\nQC inspection: [Pre-production / In-line / Pre-shipment]\nAQL: [AQL 2.5 / custom]\n\nTIMELINE\nTooling start: [Date]  |  Tooling complete: [Date]\nPilot run: [Date]  |  Mass production: [Date]\nFirst shipment: [Date]` },
    { name: "Supplier & Vendor List", type: "document", folder: "Manufacturing", content: `SUPPLIER & VENDOR LIST — [PRODUCT NAME]\n\nMANUFACTURER\nName: [Factory name]  |  Location: [City, Country]\nContact: [Name] — [Email] — [WhatsApp/WeChat]\nMOQ: [# units]  |  Lead time: [X weeks]\nPayment terms: [30% deposit / 70% on shipment]\nStatus: [Qualified / Prospecting / Declined]\n\nCOMPONENT SUPPLIERS\nName | Component | Location | Contact | MOQ | Lead Time | Status\n[Supplier] | [Component] | [Country] | [Contact] | [#] | [Weeks] | [Status]\n[Supplier] | [Component] | [Country] | [Contact] | [#] | [Weeks] | [Status]\n\nPACKAGING SUPPLIER\nName: [Supplier]  |  Location: [Country]\nProducts: [Box, labels, inserts]\nLead time: [X weeks]\n\nFREIGHT & LOGISTICS\nFreight forwarder: [Name] — [Contact]\nIncoterms: [FOB / CIF / DDP]\nPreferred port: [Port name]\n\n3PL / FULFILLMENT\nName: [3PL company]  |  Location: [State]\nIntegration: [Shopify / Amazon / Manual]\nPick & pack cost: $[XX] per order` },
    { name: "Unit Cost Model", type: "document", folder: "Manufacturing", content: `UNIT COST MODEL — [PRODUCT NAME]\nVolume assumed: [# units]  |  Date: [Date]\n\nCOGS BREAKDOWN\nCategory | Cost per Unit | Notes\nMaterials (BOM total) | $[XX] | At [X] units volume\nManufacturing labor | $[XX] | Factory quote\nPackaging | $[XX] | Box + insert + label\nQuality control | $[XX] | Per-unit QC\nFreight (factory → 3PL) | $[XX] | Sea freight ÷ units\nImport duties & tariffs | $[XX] | HTS code: [XXXX.XX]\n3PL receiving & storage | $[XX] | Per unit\nTOTAL COGS | $[XX] |\n\nUNIT ECONOMICS\nMSRP: $[XX]\nDTC (your store) margin: [X]% | Net: $[XX]\nAmazon margin: [X]% | Net: $[XX]\nWholesale margin: [X]% | Net: $[XX]\n\nMARGIN IMPROVEMENT PATH\nAt [X] units: COGS drops to $[XX] (margin → [X]%)\nAt [Y] units: COGS drops to $[XX] (margin → [X]%)\n\nTARGET ECONOMICS\nTarget retail price: $[XX]\nTarget COGS: $[XX]\nTarget gross margin: [X]% minimum` },
    { name: "Marketing Strategy", type: "document", folder: "Marketing", content: `MARKETING STRATEGY — [PRODUCT NAME]\n\nBRAND POSITIONING\n[In one sentence — what does [Product Name] stand for and for whom?]\n\nUNIQUE SELLING PROPOSITION\n"[Product Name] is the only [category] that [specific differentiator]."\n\nTARGET CUSTOMER\nPrimary: [Demographics, psychographics, lifestyle]\nWhere they spend time: [Platforms, publications, communities]\n\nMARKETING CHANNELS\nPaid Social (Meta) | Goal: [X] | Budget: $[XX]/mo | [Video ads / UGC]\nTikTok / Reels | Goal: [X] | Budget: $[XX]/mo | [Creator content]\nInfluencer / UGC | Goal: [X] | Budget: $[XX]/mo | [Micro-influencers]\nEmail / SMS | Goal: [X] | Budget: $[XX]/mo | [Klaviyo sequences]\nAmazon | Goal: [X] | Budget: $[XX]/mo | [PPC + listing]\n\nCONTENT STRATEGY\nHero content: [Product video, origin story]\nProof content: [Reviews, before/after, demonstrations]\nCommunity content: [UGC, customer stories]\n\nLAUNCH CAMPAIGN\nPre-launch: [Countdown / waitlist / teaser content]\nLaunch day: [Press push / influencer drops / ads live]\n\nMETRICS\nTarget ROAS: [X:1]  |  CAC: <$[XX]  |  LTV: $[XX]` },
    { name: "Launch Timeline", type: "document", folder: "Launch", content: `LAUNCH TIMELINE — [PRODUCT NAME]\nTarget launch date: [Date]\n\n[12 months before launch]\n□ Concept validation — interviews, surveys\n□ Product specification finalized\n□ Competitive analysis complete\n\n[9 months before]\n□ Manufacturer sourced and contracted\n□ Tooling started (if injection molding)\n□ Brand identity designed\n□ Domain and social handles registered\n\n[6 months before]\n□ Pilot samples reviewed and approved\n□ Packaging design finalized\n□ Pre-launch landing page live\n□ Email waitlist building begins\n□ Influencer outreach begins\n\n[3 months before]\n□ Mass production started\n□ Shopify store built  □ Amazon listing created\n□ PR outreach begins\n\n[1 month before]\n□ Inventory received at 3PL / Amazon FBA\n□ All marketing assets finalized\n□ Press review units shipped\n\nLAUNCH DAY\n□ Press embargo lifts  □ Paid ads go live\n□ Email to waitlist  □ Influencer posts\n\n[30 days post-launch]\n□ Review generation campaign\n□ Retargeting campaigns live  □ First reorder triggered` },
    { name: "Operations & Fulfillment Plan", type: "document", folder: "Operations", content: `OPERATIONS & FULFILLMENT PLAN — [PRODUCT NAME]\n\nFULFILLMENT MODEL\n□ Self-fulfillment  □ 3PL  □ Amazon FBA  □ Hybrid\n\n3PL / WAREHOUSE\nName: [3PL name]  |  Location: [City, State]\nIntegration: [Shopify / WooCommerce / manual]\nReceiving fee: $[XX] per pallet\nStorage: $[XX] per pallet/month\nPick & pack: $[XX] per order\n\nORDER MANAGEMENT\nPlatform: [Shopify / WooCommerce / Amazon]\nInventory sync: [Tool]\n\nSHIPPING & DELIVERY\nStandard: [X–X] days — [Carrier]\nFree shipping threshold: $[XX]\nInternational: [Supported / not yet]\n\nRETURNS & EXCHANGES\nReturn window: [30/60/90] days\nRestocking fee: [Yes / No]\nDamaged/defective: Immediate replacement\n\nINVENTORY MANAGEMENT\nReorder point: [# units]\nSafety stock: [# units]\nReorder quantity: [# units]\nInventory tool: [Cin7 / Linnworks / Shopify]\n\nMARGIN TRACKING\nTool: [QuickBooks / Xero / spreadsheet]\nMonthly margin review: [Yes]` },
  ],
  "Book / Novel": [
    { name: "Story Premise & Logline", type: "document", folder: "Story Development", content: `STORY PREMISE & LOGLINE — [BOOK TITLE]\nAuthor: [Name]  |  Genre: [Genre]  |  Draft: 1\n\nTHE LOGLINE\nWhen [protagonist] [inciting incident], they must [pursuit/goal] before [stakes/consequence].\n\nTHE PREMISE (one paragraph)\n[A fuller version of the logline — 3–5 sentences capturing the emotional core, protagonist journey, and what the book is ultimately about]\n\nCOMPARABLE TITLES\n• [Book A by Author A] — [What you share and where you differ]\n• [Book B by Author B] — [What you share and where you differ]\n\nGENRE & CATEGORY\nGenre: [Literary / Thriller / Fantasy / Romance / etc.]\nAge category: [Adult / YA / Middle Grade]\nWord count target: [XX,000] words\n\nTHEMES\nCentral theme: [What is this book actually about beneath the plot?]\nSecondary themes: [List 2–3]\n\nWHY I'M WRITING THIS\n[Your personal connection to the story — why you are the right person to tell it]` },
    { name: "Story Outline (3-Act Structure)", type: "document", folder: "Story Development", content: `STORY OUTLINE — [BOOK TITLE]\n\nACT 1 — SETUP (25% of book)\n\nOpening image/scene:\n[What's the very first image, line, or scene that hooks the reader?]\n\nProtagonist in ordinary world:\n[Establish who they are, what they want, what they're missing, their flaw]\n\nInciting incident (10–15% mark):\n[The event that disrupts the protagonist's world]\n\nAct 1 Break (25% mark):\n[Protagonist commits to the journey — no turning back]\n\nACT 2A — FIRST HALF OF MIDDLE (25–50%)\nNew world / complications:\n[Protagonist enters unfamiliar territory. Allies, enemies, obstacles.]\n\nMidpoint (50% mark):\n[Major shift — revelation, reversal, or raise-the-stakes moment]\n\nACT 2B — SECOND HALF OF MIDDLE (50–75%)\nAll is lost (75% mark):\n[The lowest point. The "death" moment.]\n\nACT 3 — RESOLUTION (75–100%)\nBreakthrough:\n[Protagonist finds what they need — internal change]\n\nClimax:\n[Final confrontation — protagonist must use their arc]\n\nResolution:\n[How does it resolve? What's the new normal?]\n\nFinal image:\n[Mirror or contrast to the opening — what has changed?]` },
    { name: "Character Profiles", type: "document", folder: "Story Development", content: `CHARACTER PROFILES — [BOOK TITLE]\n\nPROTAGONIST\nName:  |  Age:  |  Gender / pronouns:\nOccupation / role in story:\nBackstory: [Key history that shapes who they are]\n\nWANT (external goal): [What do they think they want?]\nNEED (internal truth): [What do they actually need to learn/accept?]\nFLAW: [The wound or belief that holds them back]\nARC: [How they change from page 1 to the end]\n\nGreatest strength:  |  Greatest weakness:\nWhat they fear most:  |  What they'd never do (and whether they cross that line):\n\n---\n\nANTAGONIST / FOIL\nName:  |  Motivation: [What do they want?]\nRelationship to protagonist:\nWorldview: [How do they see things differently?]\nSympathetic element: [What makes them understandable?]\n\n---\n\nSUPPORTING CHARACTER 1\nName:  |  Role in story:\nRelationship to protagonist:\nFunction in narrative: [Comic relief / mentor / mirror / catalyst]\n\n---\n\nMINOR CHARACTERS\n[Name] — [Role / function — 1 sentence]\n[Name] — [Role / function — 1 sentence]` },
    { name: "World-Building Bible", type: "document", folder: "Story Development", content: `WORLD-BUILDING BIBLE — [BOOK TITLE]\nGenre: [Fantasy / Sci-fi / Contemporary / Historical]\n\nTHE WORLD\nSetting name: [If applicable]  |  Time period: [Year / Era]\nGeography: [Continents, countries, cities relevant to the story]\nClimate and environment: [Important for atmosphere]\nPolitical structure: [Governments, powers, factions]\n\nTHE RULES (for speculative fiction)\nMagic / technology system:\n[What can it do? What are its limits? What does it cost?]\n\nSocieties & economies:\n[Class structure, how people earn a living, social mobility]\n\nReligion / belief systems:\n[What do people believe? How does faith shape behavior?]\n\nFACTIONS / GROUPS\n[Faction name] — [What they want] — [Relation to protagonist]\n[Faction name] — [What they want] — [Relation to protagonist]\n\nUNIQUE ELEMENTS\n• [Detail 1 — what makes this world distinctive]\n• [Detail 2]\n• [Detail 3]\n\nWHAT THE READER NEEDS TO KNOW BY PAGE [X]\n[Don't over-explain — minimum world-building the reader needs]` },
    { name: "Chapter-by-Chapter Outline", type: "document", folder: "Writing", content: `CHAPTER-BY-CHAPTER OUTLINE — [BOOK TITLE]\nTotal chapters: [#]  |  Target word count: [XX,000]  |  Avg chapter: [X,000] words\n\nCHAPTER 1\nPOV character: [Name]  |  Scene: [Where, when]\nWhat happens: [2–3 sentences — plot events]\nPurpose: [What this accomplishes — setup, character intro, hook]\nEnds on: [Tension hook / revelation / question]\n\nCHAPTER 2\nPOV character: [Name]  |  Scene: [Where, when]\nWhat happens: [2–3 sentences]\nPurpose: [What this advances]\nEnds on: [Hook]\n\nCHAPTER 3\n[Same structure]\n\n[Continue for each chapter]\n\nNOTES ON STRUCTURE\n□ Each chapter ends on a hook\n□ POV stays consistent within chapters\n□ Time jumps clearly signaled\n\nCHAPTERS STILL TO OUTLINE\n[List chapter numbers that need more development]` },
    { name: "Writing Tracker", type: "document", folder: "Writing", content: `WRITING TRACKER — [BOOK TITLE]\n\nGOALS\nTotal target word count: [XX,000] words\nDaily word count goal: [XXX–X,XXX] words\nWriting days per week: [X]\nTarget first draft completion: [Date]\n\nCURRENT STATUS\nWords written: [XXXX]  |  Words remaining: [XXXXX]\nCurrent chapter: [#]  |  % complete: [X]%\n\nDAILY LOG\nDate | Words Written | Cumulative Total | Session Notes\n[Date] | [#] | [#] | [Notes]\n[Date] | [#] | [#] | [Notes]\n\nWRITING RULES (personal)\n• [Rule 1 — e.g., "Write before checking email"]\n• [Rule 2 — e.g., "Don't edit first draft — just write forward"]\n\nMILESTONES\n□ Chapter 1 complete — [Date]\n□ Act 1 complete — [Date]\n□ Midpoint reached — [Date]\n□ First draft complete — [Date]\n□ Shared with beta readers — [Date]` },
    { name: "Query Letter Template", type: "document", folder: "Publishing", content: `QUERY LETTER — [BOOK TITLE]\n[Date]\n\nDear [Agent First Name],\n\n[HOOK — one sentence capturing the essence of your book with tone and stakes]\n\nBOOK DETAILS\nTitle: [BOOK TITLE]\nGenre: [Genre]  |  Word Count: [XX,XXX] words\nComparables: [Book A by Author A] and [Book B by Author B]\n\nTHE PITCH (2–3 paragraphs)\n[Paragraph 1: Introduce protagonist and their world. Establish situation and goal.]\n\n[Paragraph 2: Inciting incident / central conflict. What forces them into action? Stakes?]\n\n[Paragraph 3: The question the book raises — end on tension or intrigue. Do not reveal ending.]\n\nABOUT ME\n[Brief bio — relevant credentials, publications, memberships. If debut: "This is my debut novel."]\n\nThank you for your time and consideration.\n\n[Your name]\n[Email]  |  [Phone]  |  [Website]\n\n---\n\nAGENTS TO QUERY\nName | Agency | Wishlist match | Status | Date\n[Agent] | [Agency] | [Why they're a fit] | [Sent] | [Date]` },
    { name: "Author Platform Strategy", type: "document", folder: "Marketing", content: `AUTHOR PLATFORM STRATEGY — [AUTHOR NAME]\n\nPLATFORM GOALS\nPrimary: [Build readership / Establish as expert / Grow to [#] readers]\nTimeline: [X months until launch]\n\nTARGET READER\n[Who is your ideal reader — what do they read, where do they spend time online?]\n\nPLATFORM CHANNELS\n□ Newsletter (owned — highest value)\nPlatform: [Substack / ConvertKit / Beehiiv]\nGoal: [# subscribers by launch]  |  Frequency: [Weekly / Bi-weekly]\n\n□ Social Media\nPrimary: [Instagram / TikTok / X / LinkedIn — pick 1–2]\nContent type: [Writing updates / book content / behind-the-scenes]\nPosting frequency: [X times/week]\n\n□ Website\nURL: [yourname.com]\nKey pages: [About / Books / Newsletter / Blog]\n\nCONTENT PILLARS\n1. [Topic connected to your book's theme]\n2. [Behind-the-scenes of writing]\n3. [Books you love / reading taste]\n\nLAUNCH STRATEGY\n□ ARC outreach: [# ARCs / to whom]\n□ Launch team: [# members]\n□ Pre-order campaign: [Incentive?]\n□ Launch week events: [Online / in-person]` },
  ],
  "Music / Album": [
    { name: "Album Concept & Vision", type: "document", folder: "Creative", content: `ALBUM CONCEPT & VISION — [ALBUM TITLE]\nArtist: [Name]  |  Release Target: [Date]  |  Format: [LP / EP / Single]\n\nTHE CONCEPT\n[What is this album about? In 2–3 sentences, describe the central theme, emotional arc, or narrative thread.]\n\nTHE VISION\n[What do you want a listener to feel from start to finish?]\n\nSONIC DIRECTION\nGenre(s): [Primary] / [Blend]\nReference artists/albums: [Artist A — Album] / [Artist B — Album]\nKey sounds: [Instruments, production style, atmosphere]\nProduction approach: [Analog / Digital / Hybrid / Live band / Bedroom / Studio]\nCollaborators planned: [Producers, co-writers, features]\n\nVISUAL IDENTITY\nColor palette: [Describe]\nAlbum artwork direction: [Mood board description or reference]\nPhoto/video direction: [Visual aesthetic]\n\nTHE ARC (song sequence concept)\n[Beginning] → [Middle] → [End]\n\nCAREER GOALS FOR THIS RELEASE\n□ Establish/evolve sound and artist identity\n□ Playlist target: [Spotify editorial / genre editorial]\n□ Press coverage: [Target outlets]\n□ Live shows tied to release: [Tour / headline / support slot]\n□ Revenue target: $[XX] in first 90 days` },
    { name: "Track List & Descriptions", type: "document", folder: "Creative", content: `TRACK LIST & DESCRIPTIONS — [ALBUM TITLE]\nFORMAT: [LP: 10–14 tracks / EP: 4–6 tracks]\n\nTRACK 1 — [SONG TITLE]\nStatus: [Written / Demo / Produced / Mixed / Mastered]\nCo-writers: [Names]  |  BPM: [XX]  |  Key: [Key]  |  Length: [X:XX]\nVibe: [2–3 words]\nWhat it's about: [1 sentence]\nRole on the album: [Opens strong / sets tone / slow build]\nNotes: [Sample clearance needed, feature, etc.]\n\nTRACK 2 — [SONG TITLE]\nStatus: [Status]  |  BPM: [XX]  |  Key: [Key]  |  Length: [X:XX]\nVibe: [2–3 words]  |  What it's about: [1 sentence]\n\nTRACK 3 — [SONG TITLE]\n[Same structure]\n\n[Continue for all tracks]\n\nPOTENTIAL SINGLES\n1st single: Track [#] — [Title] — Release: [Date]\n2nd single: Track [#] — [Title] — Release: [Date]\nAlbum release: [Full album date]\n\nSEQUENCING RATIONALE\n[Why did you order the tracks this way?]\n\nTOTAL RUNTIME: [XX:XX] min\nPRODUCED BY: [Producer name(s)]` },
    { name: "Recording Session Plan", type: "document", folder: "Recording", content: `RECORDING SESSION PLAN — [ALBUM TITLE]\nStudio: [Name or "Home Studio"]  |  Engineer: [Name]  |  Producer: [Name]\n\nSTUDIO SESSIONS\nSession 1 — [Date] — [Start–End time]\nLocation: [Studio name]  |  Tracks: [Which songs]\nFocus: [Drums / bass / guitars / vocals / overdubs]\nCost: $[XX]\n\nSession 2 — [Date]\n[Same structure]\n\nHOME RECORDING / OVERDUBS\n[Which parts will be recorded at home / remotely]\n\nMUSICIANS NEEDED\nInstrument | Player | Session | Rate\nDrums | [Name] | [Date] | $[XX]\nBass | [Name] | [Date] | $[XX]\nGuitar | [Name] | [Date] | $[XX]\nStrings | [Name] | [Date] | $[XX]\n\nVOCAL SESSIONS\nLead vocals — [Artist] — [Dates]\nBacking vocals — [Name(s)] — [Dates]\n\nPRE-PRODUCTION CHECKLIST\n□ All songs demoed and approved before booking studio\n□ Chord charts / lead sheets prepared for session musicians\n□ Headphone mixes decided\n\nBUDGET\nStudio time: $[XX]  |  Session musicians: $[XX]\nProducer fee: $[XX]  |  Total recording: $[XX]` },
    { name: "Mixing & Mastering Notes", type: "document", folder: "Recording", content: `MIXING & MASTERING NOTES — [ALBUM TITLE]\n\nMIXING\nMixer: [Name]  |  Studio: [Name / Remote]\nMix start: [Date]  |  Mix delivery: [Date]\nRevisions: [# rounds included in deal]\nFormat delivered: [Stems / Full mix / Both]\n\nMIX REFERENCES (per track or album-wide)\n[Track / Album reference] — [What we love about the mix]\n[Track / Album reference] — [Specific element: low end / vocal clarity / space]\n\nNOTES PER TRACK\nTrack 1 [Title]: [Mix direction — e.g., "Wide and airy, vocals out front, punchy kick"]\nTrack 2 [Title]: [Mix direction]\nTrack 3 [Title]: [Mix direction]\n\nMASTERING\nMastering engineer: [Name]  |  Studio: [Name / Remote]\nMastering date: [Date]\nDelivery formats:\n□ Streaming (WAV, 16-bit/44.1kHz)\n□ Vinyl (WAV, 24-bit/96kHz — ask about cutting level)\n□ CD (Red Book standard)\n□ Dolby Atmos / spatial audio (if applicable)\n\nTARGET LOUDNESS\nStreaming: -14 LUFS (Spotify / Apple Music standard)\nCD: -9 to -12 LUFS\n\nMASTERING NOTES\n[Any specific frequency or dynamic concerns from mixing to address in mastering]` },
    { name: "Distribution & Release Plan", type: "document", folder: "Release", content: `DISTRIBUTION & RELEASE PLAN — [ALBUM TITLE]\n\nDISTRIBUTOR\nPlatform: [DistroKid / TuneCore / CD Baby / AWAL / Amuse / Label]\nRelease submission deadline: [Date — typically 3–4 weeks before]\n\nRELEASE DATE STRATEGY\nPre-save campaign live: [Date — 4–6 weeks before]\nFirst single: [Date]\nSecond single: [Date]\nAlbum release: [Date]\n\nSTREAMING PLATFORM TARGETS\n□ Spotify — Official Artist Channel verified\n□ Apple Music — Verified profile + lyrics submitted\n□ Amazon Music — Submit for playlisting\n□ Tidal — HiFi lossless upload\n\nDSP EDITORIAL SUBMISSIONS\n□ Spotify — Submit via Spotify for Artists, [# days] before release\n□ Apple Music — Submit via iTunes Connect\nTarget playlists: [Genre playlist / New Music Friday]\n\nPHYSICAL RELEASE\n□ Vinyl: [# copies] — Pressing plant: [Name] — Lead time: 18–24 weeks\n□ CD: [# copies]\n\nDIRECT-TO-FAN\nBandcamp: [Yes — exclusive early access?]\nWebsite store: [Yes — digital + physical bundles]` },
    { name: "Social Media Launch Plan", type: "document", folder: "Marketing", content: `SOCIAL MEDIA LAUNCH PLAN — [ALBUM TITLE]\n\nCHANNELS\nPrimary: [Instagram / TikTok / YouTube / X]\nGoal by release day: [# followers per platform]\n\nPRE-RELEASE CAMPAIGN (6 weeks out → release)\nWeek 6: Announce album / reveal artwork teaser\nWeek 5: First single release + rollout content\nWeek 4: Behind-the-scenes studio content\nWeek 3: Second single release\nWeek 2: Lyrics / meaning content / press quotes\nWeek 1: Countdown content / fan engagement\nRelease Day: Full album push across all channels\n\nCONTENT TYPES\n□ Album art reveal (teaser + full)\n□ Lyric graphics for each single\n□ Studio footage / recording reels\n□ Story behind the album (talking head video)\n□ Track-by-track breakdown\n□ Spotify pre-save link posts\n□ Fan reaction reposts / UGC\n\nPRESS / PLAYLIST PITCHING\nPR: [Publicist name / DIY]\nTarget publications: [Outlets by genre]\nReview copies sent: [Date]\n\nCREATOR / INFLUENCER SEEDING\n[Creator] — [Platform] — [Niche] — [Status]` },
    { name: "Monetization Roadmap", type: "document", folder: "Marketing", content: `MONETIZATION ROADMAP — [ALBUM TITLE / ARTIST NAME]\n\nREVENUE STREAMS\n□ Streaming royalties (Spotify, Apple Music, etc.)\n□ Physical sales (vinyl, CD, cassette)\n□ Direct-to-fan (Bandcamp, website store)\n□ Live performance (touring, headline shows, support slots)\n□ Sync licensing (film, TV, ads, games)\n□ Publishing royalties (mechanical, performance)\n□ Merchandise (tied to album release)\n□ Patreon / fan membership\n\nSTREAMING REVENUE ESTIMATE\nSpotify rate: ~$0.003–$0.005/stream\nTarget streams (Month 1): [#]\nMonth 1 streaming revenue estimate: $[XX]\n\nPHYSICAL SALES TARGET\nVinyl: [# copies] × $[XX] = $[XX]\nCD: [# copies] × $[XX] = $[XX]\n\nSYNC LICENSING STRATEGY\n□ Register songs with PRO (ASCAP / BMI / SESAC)\n□ Submit to sync library: [Music Bed / Artlist / Musicbed]\n□ Pitch to music supervisor: [Name / Agency]\n\nMERCHANDISE\nProducts: [T-shirt / hoodie / tote / poster / limited bundle]\nLaunch with album: [Yes — link in pre-save landing page]\n\nYEAR 1 REVENUE TARGET\nStreaming + digital: $[XX]  |  Physical: $[XX]\nLive: $[XX]  |  Merch: $[XX]  |  Sync: $[XX]\nTotal: $[XX]` },
    { name: "Press Kit", type: "document", folder: "Marketing", content: `PRESS KIT — [ARTIST NAME]\n\nARTIST BIO (short — 100 words)\n[Concise, present-tense bio capturing who you are, your sound, and what makes you notable]\n\nARTIST BIO (long — 300 words)\n[Expanded bio with origin story, influences, career highlights, recent release context]\n\nALBUM OVERVIEW\nTitle: [ALBUM TITLE]  |  Release date: [Date]  |  Format: [LP / EP]\nTracklist: [Full list]\nProduced by: [Name]  |  Available on: [Streaming links]\n\nKEY QUOTES (from press, if available)\n"[Quote]" — [Publication]\n"[Quote]" — [Reviewer]\n\nLINKS\nMusic: [Spotify / Apple Music / Bandcamp]\nVideo: [YouTube / Vimeo]\nSocial: [Instagram / TikTok / X]\nHigh-res photos: [Download link]\n\nCONTACT\nBooking: [Name] — [Email] — [Phone]\nPress/PR: [Name or Agency] — [Email]` },
  ],
  "Podcast": [
    { name: "Show Bible & Format", type: "document", folder: "Strategy", content: `SHOW BIBLE — [PODCAST NAME]\nHost(s): [Name]  |  Format: [Interview / Narrative / Solo / Panel]  |  Launched: [Date]\n\nTHE SHOW\n[PODCAST NAME] is a [weekly / bi-weekly] podcast about [topic] for [target audience]. Each episode [format description].\n\nTHE MISSION\n[Why does this show exist? What value does it deliver that listeners can't get elsewhere?]\n\nTARGET LISTENER\nPrimary: [Specific description — job, life stage, interests, pain point]\nWhere they listen: [Commute / gym / walk / work]\nWhat they need: [Entertainment / education / inspiration / information]\n\nEPISODE FORMAT\nTotal runtime: [XX–XX] minutes\nStructure:\n0:00 – [XX]: Intro / cold open / hook\n[XX] – [XX]: Segment 1 — [description]\n[XX] – [XX]: Segment 2 / interview core\n[XX] – [XX]: Rapid fire / lightning round / wrap-up\n[XX] – [XX]: Outro / CTA / subscribe ask\n\nCONTENT PILLARS\n1. [Pillar 1]  2. [Pillar 2]  3. [Pillar 3]\n\nTONE & VOICE\n[Describe the show's personality — casual / authoritative / funny / nerdy / aspirational]\n\nWHAT THE SHOW IS NOT\n[Topics that are off-brand. What episodes you'll never do.]\n\nCOMPARABLE SHOWS\n• [Show A] — [What you share / what sets you apart]\n• [Show B] — [What you share / what sets you apart]\n\nSIGNATURE ELEMENTS\n□ [Recurring segment — e.g., "One-word guest intro"]\n□ [Signature question every guest gets]` },
    { name: "Episode Calendar (12 Weeks)", type: "document", folder: "Strategy", content: `EPISODE CALENDAR — [PODCAST NAME]\nPublishing schedule: [Day] at [Time]\n\nWEEK 1 — [Date]\nEpisode title: [Title]\nGuest: [Name] / Solo\nTopic: [What this episode covers]\nKey angle: [The hook]\nStatus: [Booked / In progress / Idea]\n\nWEEK 2 — [Date]\n[Same structure]\n\nWEEK 3 — [Date]\n[Same structure]\n\nWEEK 4 — [Date]\n[Same structure]\n\nWEEK 5 — [Date]\n[Same structure]\n\nWEEK 6 — [Date]\n[Same structure]\n\nWEEK 7 — [Date]\n[Same structure]\n\nWEEK 8 — [Date]\n[Same structure]\n\nWEEK 9 — [Date]\n[Same structure]\n\nWEEK 10 — [Date]\n[Same structure]\n\nWEEK 11 — [Date]\n[Same structure]\n\nWEEK 12 — [Date]\n[Same structure]\n\nBACKLOG IDEAS\n• [Episode idea + potential guest]\n• [Episode idea + potential guest]\n• [Episode idea + potential guest]\n\nTHEME MONTHS / SERIES\n[Month]: [Theme — e.g., "Founder stories"]\n[Month]: [Theme]` },
    { name: "Guest Research Template", type: "document", folder: "Production", content: `GUEST RESEARCH TEMPLATE — [GUEST NAME]\nEpisode #: [#]  |  Record date: [Date]\n\nGUEST OVERVIEW\nFull name:  |  Title / Role:  |  Company:\nKnown for: [What they're most known for]\nSocial: [Instagram / X / LinkedIn]  |  Website:\nRecent work: [Book / company / project]\n\nWHY THIS GUEST\n[Why are they a great fit for your show and audience right now?]\n\nTHEIR STORY (key beats)\n[Key life events, career turns, story points to explore]\n\nPREVIOUS PODCAST APPEARANCES\n[Show name] — [Topic covered] — [Date]\n[Show name] — [Topic covered] — [Date]\n\nANGLES NOT YET EXPLORED\n[What hasn't been asked? What's the fresh angle your audience would love?]\n\nOUTREACH STATUS\n□ Invite sent — [Date]\n□ Response received — [Date]\n□ Pre-interview call — [Date]\n□ Confirmed for recording — [Date]\n\nLOGISTICS\nRecording platform: [Riverside / Zencastr / Zoom / in-person]\nGuest timezone: [TZ]\nMaterials sent to guest: [Topics overview / format / how to prep]` },
    { name: "Interview Question Framework", type: "document", folder: "Production", content: `INTERVIEW QUESTION FRAMEWORK — [PODCAST NAME]\n\nOPENING (set the stage — 5–10 min)\n1. [Light opener — e.g., "Take us back to the beginning — who were you before [their major story began]?"]\n2. [Context — e.g., "For listeners who don't know you, what should they know about your work?"]\n\nTHE STORY (dig into their arc — 20–30 min)\n3. [Inciting moment — e.g., "What was the moment that changed everything?"]\n4. [The hard part — e.g., "Walk us through the hardest period — what did it actually look like?"]\n5. [Decision point — e.g., "When you had to choose between X and Y, how did you decide?"]\n6. [The turn — e.g., "At what point did things shift? What changed?"]\n7. [Results — e.g., "Looking back — what did that time actually produce?"]\n\nTHE INSIGHT (lessons — 10–15 min)\n8. [The lesson — e.g., "What do you know now that you wish you'd known at [earlier point]?"]\n9. [The framework — e.g., "How do you think about [key topic] now?"]\n10. [Unpopular opinion — e.g., "What's something you believe that most people get wrong?"]\n\nTHE CLOSE (5 min)\n11. [Signature question — e.g., "One book that changed how you think?"]\n12. [What's next — e.g., "What are you working on that we should know about?"]\n13. [Where to find them]\n\nHOST NOTES\n□ Listen for: [Themes to explore deeper]\n□ Do not miss: [Question that must get answered]\n□ Off-limits: [Topics the guest asked to avoid]` },
    { name: "Episode Production Checklist", type: "document", folder: "Production", content: `EPISODE PRODUCTION CHECKLIST — [PODCAST NAME]\n\nPRE-RECORDING\n□ Episode outline / question framework complete\n□ Guest research done and notes ready\n□ Recording platform tested\n□ Audio levels checked (host mic at -12 to -6 dBFS)\n□ Recording software armed (separate tracks if possible)\n□ Do Not Disturb enabled\n□ Guest briefed on: format, length, recording setup tips\n\nRECORDING\n□ Intro recorded (episode number + guest name)\n□ Sponsor reads recorded (if applicable)\n□ Outro recorded with CTA\n□ All audio files saved and backed up\n\nPOST-PRODUCTION\n□ Audio edited (remove ums, dead air, mistakes)\n□ Audio leveled and normalized\n□ Intro/outro music added\n□ Show notes written\n□ Transcript generated — Tool: [Descript / Whisper / Otter]\n\nPUBLISHING\n□ Episode title finalized (SEO-friendly + interesting)\n□ Episode description written (3–5 sentences)\n□ Guest bio + links confirmed\n□ Thumbnail / cover art created\n□ Uploaded to host: [Buzzsprout / Spotify / RSS.com]\n□ Release scheduled: [Date and time]\n\nPROMOTION\n□ Social clips cut (30s + 90s)\n□ Quote graphic created\n□ Guest tagged in all promotional posts\n□ Email to list scheduled\n□ Cross-post to: [YouTube / TikTok / Instagram Reels]` },
    { name: "Podcast Distribution Plan", type: "document", folder: "Distribution", content: `PODCAST DISTRIBUTION PLAN — [PODCAST NAME]\n\nHOSTING PLATFORM\nHost: [Buzzsprout / Podbean / Libsyn / Transistor / Spotify for Podcasters]\nRSS feed: [URL]  |  Account: [Email]\n\nDISTRIBUTION PLATFORMS\n□ Spotify — [Status: Live / Pending]\n□ Apple Podcasts — [Status: Live / Pending]\n□ Amazon Music / Audible — [Status]\n□ YouTube — [Published as video / audio / not applicable]\n□ Pocket Casts — [Auto-distributed via RSS]\n□ iHeart Radio — [Submitted / pending]\n\nWEBSITE\nEpisodes embedded at: [URL]\nEpisode show notes hosted at: [URL/blog]\nSEO approach: [Transcripts / keyword-rich show notes]\n\nNEWSLETTER\nSend to subscribers: [Yes — Platform: Beehiiv / Substack / ConvertKit]\n\nYOUTUBE STRATEGY\n□ Full episode video (face cam / waveform / static artwork)\n□ Short clips (Reels / Shorts / TikTok)\nVideo format: [Riverside auto-video / animated audiogram]\n\nCROSS-PROMOTION\n□ Guest reposts to their audience\n□ Featured in other podcasts (swap appearances)\n□ Guesting on other shows — [# episodes/month]` },
    { name: "Audience Growth Strategy", type: "document", folder: "Growth", content: `AUDIENCE GROWTH STRATEGY — [PODCAST NAME]\n\nCURRENT METRICS\nDownloads/month: [#]  |  Subscribers: [#]  |  Email list: [#]\nAverage episode completion rate: [X]%\n\nGROWTH TARGETS\n3 months: [#] downloads/month\n6 months: [#] downloads/month\n12 months: [#] downloads/month\n\nACQUISITION CHANNELS\n1. GUEST MARKETING\nEach guest shares → estimated reach: [#]\nAsk every guest to: [Share to list / social / their own podcast]\n\n2. PODCAST CROSS-PROMOTION\nSwap episodes with [# shows/month] — similar audience, non-competing\n\n3. CONTENT REPURPOSING\n□ Short clips for TikTok / Reels / Shorts\n□ Quote cards for Instagram / X\n□ Full transcript for SEO\n□ Newsletter summary of key episode insights\n\n4. GUEST TARGETING\nBook guests with [X,000]+ audiences in [niche]\n\n5. COMMUNITY BUILDING\n□ Discord / Slack for listeners: [Yes / Planned]\n□ Reddit community engagement: [Subreddits]\n□ Live episodes or AMA: [Platform / frequency]\n\nRETENTION STRATEGY\nListening habit triggers: [Weekly drop on [Day]]\nSuper-fan cultivation: [How you identify and reward biggest fans?]` },
    { name: "Monetization Roadmap", type: "document", folder: "Growth", content: `MONETIZATION ROADMAP — [PODCAST NAME]\n\nREVENUE MODEL\n□ Sponsorships / Advertising\n□ Listener support (Patreon / Supercast / Spotify Subscriptions)\n□ Digital products (courses, templates, ebooks)\n□ Coaching / consulting\n□ Affiliate marketing\n□ Live events\n\nPHASE 1 — FOUNDATION (0–[# downloads]/month)\nFocus: Build audience, establish authority. No ads yet.\nRevenue: $0\nAction: Grow to ad-viable threshold ([X,000] downloads/episode)\n\nPHASE 2 — FIRST MONETIZATION ([X,000] downloads/month)\n□ Dynamic ad insertion — CPM rates: $[XX]–$[XX] per 1,000 downloads\n□ Affiliate links (lower threshold)\nMonthly revenue potential: $[XX]\n\nPHASE 3 — PREMIUM / DIRECT\n□ Patreon — Tiers: $[X] / $[XX] / $[XX] per month\n□ Bonus episodes / early access / ad-free feed\nTarget: [#] supporters × $[XX]/month = $[XX] MRR\n\nSPONSORSHIP TARGETS\nCompany | Relevance | Contact | Rate | Status\n[Brand] | [Why relevant] | [Contact] | $[XX]/ep | [Status]\n[Brand] | [Why relevant] | [Contact] | $[XX]/ep | [Status]\n\nSPONSORSHIP RATES\nPre-roll (30s): $[XX] CPM\nMid-roll (60s): $[XX] CPM\nHost-read integrated: Premium — negotiate per deal` },
  ],
  "Online Course": [
    { name: "Course Overview & Outcomes", type: "document", folder: "Curriculum", content: `COURSE OVERVIEW & OUTCOMES — [COURSE NAME]\nCreator: [Name]  |  Platform: [Teachable / Kajabi / Thinkific / Podia / Skool]\n\nTHE COURSE IN ONE SENTENCE\n[Course Name] teaches [target student] to [transformation] in [timeframe].\n\nTHE TRANSFORMATION\nBefore: [Where students are — pain, frustration, current state]\nAfter: [Where they'll be — specific outcome]\n\nTARGET STUDENT\nWho they are: [Specific description]\nWhat they want: [Desired outcome]\nWhat's held them back: [Why they haven't succeeded yet]\n\nLEARNING OBJECTIVES\nBy the end, students will be able to:\n1. [Specific, measurable skill]\n2. [Specific, measurable skill]\n3. [Specific, measurable skill]\n4. [Specific, measurable skill]\n5. [Specific, measurable skill]\n\nWHAT MAKES THIS DIFFERENT\n[Why better than YouTube tutorials, books, or competitors?]\n\nCOURSE FORMAT\n□ Self-paced  □ Live cohort  □ Hybrid\nTotal video hours: [XX]  |  Completion time: [X–X hours/week for X weeks]\n\nPRICE POINT\n□ Self-paced: $[XX]  □ With community: $[XX]  □ With coaching: $[XX]\n[Beta / founding member price: $[XX]]` },
    { name: "Module & Lesson Outline", type: "document", folder: "Curriculum", content: `MODULE & LESSON OUTLINE — [COURSE NAME]\n\nMODULE 1: [Module Name]\nObjective: [What students master in this module]\nDuration: [XX] minutes total\n\n  Lesson 1.1: [Lesson Title]\n  Type: [Video / PDF / Exercise / Quiz]  |  Duration: [XX] min\n  What students learn: [1 sentence]\n  Deliverable: [What students create or do]\n\n  Lesson 1.2: [Lesson Title]\n  Type: [Type]  |  Duration: [XX] min\n  What students learn: [1 sentence]\n\n  Module 1 Project: [Assignment for this module]\n\nMODULE 2: [Module Name]\nObjective: [What students master]\nDuration: [XX] minutes total\n\n  Lesson 2.1: [Lesson Title]\n  [Same structure]\n\n  Lesson 2.2: [Lesson Title]\n  [Same structure]\n\nMODULE 3: [Module Name]\n[Same structure]\n\nMODULE 4: [Module Name]\n[Same structure]\n\nMODULE 5: [Module Name]\n[Same structure]\n\nCAPSTONE PROJECT\n[The final project that demonstrates full transformation]\nFormat: [What they submit]  |  Review: [Peer / Instructor / Self-assessed]\n\nTOTAL CONTENT\nModules: [#]  |  Lessons: [#]  |  Video hours: [XX]\nWorksheets: [#]  |  Quizzes: [#]  |  Projects: [#]` },
    { name: "Script Template per Lesson", type: "document", folder: "Production", content: `LESSON SCRIPT TEMPLATE — [COURSE NAME]\nModule [#], Lesson [#]: [LESSON TITLE]\nVideo length target: [XX] minutes  |  Recorded: [Date]\n\nHOOK (0:00–0:20)\n"In this lesson, you're going to learn [specific thing], which means you'll finally be able to [outcome]."\n\nCONTEXT (0:20–1:00)\n[Brief context — where this fits in the bigger picture of the course]\n"Before we dive in, here's how this connects to [previous lesson]..."\n\nMAIN TEACHING (1:00 – [XX:XX])\n\nCONCEPT 1: [Name]\n[Explain simply. Use an analogy. Show an example.]\n"Think of it like..."\n\nCONCEPT 2: [Name]\n[Teach it. Show it. Demonstrate if applicable.]\n\nDEMONSTRATION (if applicable)\n"Let me show you exactly how I do this..."\n[Walk through a real example — often the most valuable part]\n\nCOMMON MISTAKES\n"Most people get this wrong because [reason]. Here's how to avoid it..."\n\nSUMMARY ([XX:XX]–end)\n"Let's recap what you just learned:\n1. [Key point]\n2. [Key point]\n3. [Key point]"\n\nACTION / ASSIGNMENT\n"Your assignment: [Specific, simple action]\nCompleting this gives you [specific milestone] done."\n\nNOTES FOR RECORDING\n□ Screen share needed: [Yes / No]\n□ Graphics needed: [Yes — describe]\n□ Captions needed: [Auto-generated / manual]` },
    { name: "Recording & Production Guide", type: "document", folder: "Production", content: `RECORDING & PRODUCTION GUIDE — [COURSE NAME]\n\nSETUP\nCamera: [DSLR / mirrorless / webcam — model]\nMicrophone: [Model]  |  Audio interface: [Model / none]\nLighting: [Ring light / softbox / window natural]\nBackground: [Set description / virtual background]\n\nRECORDING SOFTWARE\nScreen recording: [Loom / Camtasia / OBS / ScreenFlow]\nVideo editing: [DaVinci Resolve / Final Cut / Premiere / Descript]\nAudio editing: [Audacity / Adobe Audition / built-in]\n\nQUALITY STANDARDS\nResolution: [1080p / 4K minimum]\nFrame rate: [30fps / 24fps]\nAudio: [Clear, no echo, consistent volume — target -12 dBFS]\nPace: [Talk slightly slower than natural conversation]\n\nCOURSE PLATFORM SPECS\nPlatform: [Teachable / Kajabi / etc.]\nMax file size per video: [GB]\nAccepted formats: [MP4 / MOV]\nThumbnail size: [1280×720px]\n\nPRE-RECORDING CHECKLIST\n□ Script or outline ready\n□ Screen recording test done\n□ Audio test — no hiss, echo, or background noise\n□ Lighting consistent\n□ Do Not Disturb / phone silenced\n\nPOST-PRODUCTION CHECKLIST\n□ Intro/outro branded sequence added\n□ Captions generated and reviewed\n□ B-roll or screen recording inserts added\n□ Final export at correct specs\n□ Upload to course platform\n□ Preview in student view before publishing` },
    { name: "Launch Strategy", type: "document", folder: "Marketing", content: `COURSE LAUNCH STRATEGY — [COURSE NAME]\n\nLAUNCH TYPE\n□ Open enrollment (always enrolling)\n□ Closed enrollment / cohort (launches on [Date])\n□ Beta launch (limited seats, lower price, feedback-first)\n□ Evergreen with live launch promotions\n\nLAUNCH TIMELINE (for live launch)\n6 weeks before: Email waitlist building begins\n5 weeks before: Free training / lead magnet live\n4 weeks before: Webinar / masterclass delivered\n3 weeks before: Early-bird cart open\n2 weeks before: Full cart open / testimonial push\nLast 5 days: Scarcity / urgency push\nClose day: Final email sequence (3 emails in 24 hours)\n\nLAUNCH EMAIL SEQUENCE\nEmail 1 (Cart open): Announce + key benefits + social proof\nEmail 2 (Day 3): Address main objection\nEmail 3 (Mid-launch): Testimonial / case study\nEmail 4 (3 days before close): Urgency — price going up\nEmail 5 (48 hours): FAQ / "Is this right for you?"\nEmail 6 (24 hours): Last chance — closes tomorrow\nEmail 7 (Close day — morning): Today is the last day\nEmail 8 (Close day — evening): Final hour\n\nLAUNCH METRICS TARGETS\nEmail list entering launch: [#] subscribers\nConversion rate target: [2–4]% of list\nEnrollment target: [#] students\nRevenue target: $[XX]` },
    { name: "Student Onboarding Flow", type: "document", folder: "Operations", content: `STUDENT ONBOARDING FLOW — [COURSE NAME]\n\nENROLLMENT CONFIRMATION\nTrigger: Purchase confirmed\nImmediate: Platform sends login credentials\nWithin 1 hour: Personal welcome email from [Creator name]\nWelcome email includes: [What to do first / what to expect / how to get support]\n\nONBOARDING EMAIL SEQUENCE\nDay 0: Welcome + access link + quick win assignment\nDay 1: "Here's your first step" — direct to Lesson 1.1\nDay 3: Community invite (if applicable)\nDay 7: Check-in — "How's it going?"\nDay 14: Midpoint check / celebrate progress\n\nFIRST 48 HOURS EXPERIENCE\nGoal: Get students to complete Lesson 1 within 48 hours\nHook: First lesson is [X] minutes and delivers immediate value\nQuick win: [What students accomplish from Lesson 1 immediately]\n\nCOMMUNITY (if applicable)\nPlatform: [Skool / Circle / Discord / Slack]\nOnboarding:\n1. Student accepts invite\n2. Pinned intro thread prompts introduction\n3. First challenge or prompt to complete\n\nSUPPORT CHANNELS\nEmail: [support email]  |  Response time: [24–48 hours]\nOffice hours / Q&A calls: [Day and time]\n\nCOMPLETION INCENTIVES\n□ Certificate of completion\n□ Feature in community / testimonial request\n□ Alumni access or next-level offer` },
    { name: "Course Pricing & Tiers", type: "document", folder: "Operations", content: `COURSE PRICING & TIERS — [COURSE NAME]\n\nPRICING PHILOSOPHY\n[What does this course deliver in terms of ROI? How does the price reflect that value?]\n\nPRICING TIERS\n\nSELF-PACED — $[XX]\nIncludes:\n□ Lifetime access to all [#] modules\n□ [#] video lessons + worksheets\n□ [No community]\nBest for: [Self-driven students who don't need live support]\n\nWITH COMMUNITY — $[XX]\nIncludes everything above, plus:\n□ Access to [Platform] community\n□ Monthly group Q&A calls\n□ Peer accountability groups\nBest for: [Students who want community and accountability]\n\nVIP / WITH COACHING — $[XX]\nIncludes everything above, plus:\n□ [# sessions] 1:1 coaching calls\n□ Direct email/Voxer access for [X weeks]\n□ Personal project review\nBest for: [Students who want fastest results with personal guidance]\n\nPAYMENT PLANS\nTier 1: [3 × $XX]  |  Tier 2: [3 × $XX]  |  Tier 3: [3 × $XX]\n\nBONUSES (for launch)\n□ [Bonus 1 — value $XX] — [Description]\n□ [Bonus 2 — value $XX] — [Description]\n\nGUARANTEE\n□ [30-day] money-back guarantee\nConditions: [Complete X lessons / submit X assignment]\n\nCOMPETITIVE PRICING\n[Competitor A]: $[XX]  |  [Competitor B]: $[XX]\nOur positioning: [Where we sit and why]` },
  ],

  // ── Expansion: 15 niche & emerging project types ─────────────────────────

  "Architecture / Interior Design": [
    { name: "Project Brief & Program", type: "document", folder: "Concepts & Mood", content: `PROJECT BRIEF & PROGRAM — [PROJECT NAME]\nClient: [Name]  |  Project Type: [Residential / Commercial / Interior]\nLocation: [Address]  |  Gross Area: [sq ft / m²]  |  Budget: $[Amount]\n\nCLIENT VISION\n[Describe the client's goals, lifestyle, aesthetic preferences, and must-haves]\n\nSPACE PROGRAM\nSpaces required:\n• [Room/Zone 1]: [Approx. sq ft] — [Key notes]\n• [Room/Zone 2]: [Approx. sq ft] — [Key notes]\n• [Room/Zone 3]: [Approx. sq ft] — [Key notes]\n\nDESIGN DIRECTION\nStyle: [Modern / Scandinavian / Industrial / Biophilic / Transitional / etc.]\nPalette: [Colors, tones, materials]\nInspiration: [References, images, comparable projects]\n\nCONSTRAINTS\n• Zoning / code: [Key code requirements]\n• Structural: [Any known structural limitations]\n• Schedule: [Target completion / phasing]\n\nDELIVERABLES SCOPE\n□ Schematic design  □ Design development  □ Construction documents\n□ Permit submission  □ Construction administration` },
    { name: "Schematic Design Summary", type: "document", folder: "Concepts & Mood", content: `SCHEMATIC DESIGN SUMMARY — [PROJECT NAME]\nPhase: Schematic Design  |  Date: [Date]  |  Revision: [#]\n\nCONCEPT STATEMENT\n[1–2 paragraphs describing the overarching design idea, inspiration, and intent]\n\nSPATIAL ORGANIZATION\n[Describe how the spaces are organized — adjacencies, circulation, entry sequence, focal points]\n\nMATERIAL & PALETTE DIRECTION\nFlooring: [Material, finish, color]\nWalls: [Paint / plaster / paneling / tile — specify finishes]\nCeiling: [Height, material, feature elements]\nMillwork: [Custom / semi-custom — style and finish direction]\nLighting: [Ambient, task, accent strategy]\nKey accent materials: [Stone, metal, wood species, etc.]\n\nFURNITURE DIRECTION\n[Overall approach — custom, vintage, contract brands, budget level]\nKey pieces being considered:\n• [Item 1 — source / designer]\n• [Item 2 — source / designer]\n\nNEXT STEPS\n□ Client review and approval of SD package\n□ Incorporate feedback\n□ Proceed to Design Development` },
    { name: "Material & Finish Schedule", type: "document", folder: "Material Specs", content: `MATERIAL & FINISH SCHEDULE — [PROJECT NAME]\nProject: [Name]  |  Date: [Date]  |  Revision: [#]\n\nFLOORING\nZone: [Room name]  |  Material: [Specify]  |  Supplier: [Name]  |  SKU/Ref: [#]  |  Unit Cost: $[XX]\nZone: [Room name]  |  Material: [Specify]  |  Supplier: [Name]  |  SKU/Ref: [#]  |  Unit Cost: $[XX]\n\nWALL FINISHES\nZone: [Room name]  |  Finish: [Paint / plaster / tile]  |  Supplier: [Name]  |  Color/Ref: [#]  |  Unit Cost: $[XX]\nZone: [Room name]  |  Finish: [Specify]  |  Supplier: [Name]  |  Color/Ref: [#]  |  Unit Cost: $[XX]\n\nCEILING FINISHES\nZone: [Room name]  |  Finish: [Specify]  |  Notes: [Height, coffers, beams, etc.]\n\nMILLWORK & CABINETRY\nItem: [Kitchen cabinetry]  |  Supplier/Maker: [Name]  |  Door style: [Specify]  |  Finish: [Specify]\nItem: [Bathroom vanity]  |  Supplier/Maker: [Name]  |  Door style: [Specify]  |  Finish: [Specify]\n\nHARDWARE\nCabinet hardware: [Brand / collection / finish]\nDoor hardware: [Brand / collection / finish]\nPlumbing fixtures: [Brand / collection / finish]\n\nAPPROVAL LOG\n[Material]: Submitted [Date] | Client approved [Date]` },
    { name: "Construction Budget Estimate", type: "document", folder: "Client Deliverables", content: `CONSTRUCTION BUDGET ESTIMATE — [PROJECT NAME]\nDate: [Date]  |  Phase: [SD / DD / CD]  |  Estimator: [Name]\n\nNOTE: This is a [conceptual / schematic / detailed] estimate. Actual costs will vary.\n\nDEMOLITION & SITE PREP         $\nSTRUCTURAL WORK                $\nFRAMING & ROUGH CARPENTRY      $\nMECHANICAL (HVAC)              $\nPLUMBING (ROUGH & FINISH)      $\nELECTRICAL (ROUGH & FINISH)    $\nINSULATION                     $\nDRYWALL & PLASTER              $\nFLOORING                       $\nPAINT & WALL FINISHES          $\nMILLWORK & CABINETRY           $\nCOUNTERTOPS                    $\nTILE WORK                      $\nDOORS, FRAMES & HARDWARE       $\nWINDOWS & GLAZING              $\nLIGHTING & ELECTRICAL TRIM     $\nFURNISHINGS (FF&E)             $\nSPECIALTY ITEMS                $\n\nSUBTOTAL CONSTRUCTION:         $\nCONTINGENCY ([10–20]%):        $\nDESIGN FEES:                   $\nPERMITS & FEES:                $\n─────────────────────────────\nTOTAL PROJECT BUDGET:          $` },
    { name: "Project Schedule & Milestones", type: "document", folder: "Client Deliverables", content: `PROJECT SCHEDULE — [PROJECT NAME]\nStart: [Date]  |  Estimated Completion: [Date]  |  Total Duration: [XX] weeks\n\nPHASE 1 — DESIGN (Weeks 1–[X])\n□ Project kickoff & brief finalization\n□ Site measurements / existing conditions survey\n□ Schematic design  |  Client review\n□ Design development  |  Client review\n□ Construction documents\n□ Permit submission\n\nPHASE 2 — PROCUREMENT (Weeks [X]–[X])\n□ Furniture & materials ordered\n□ Lead time tracking begins\n□ GC / subcontractor bids received\n□ Contractor selected & contract executed\n□ Permits received\n\nPHASE 3 — CONSTRUCTION (Weeks [X]–[X])\n□ Demolition\n□ Rough mechanical / plumbing / electrical\n□ Framing / structural\n□ Inspections\n□ Finishes: drywall, flooring, tile, paint, millwork\n□ Punch list\n\nPHASE 4 — INSTALLATION & COMPLETION (Weeks [X]–[X])\n□ Furniture & accessories delivered\n□ Art & lighting installed\n□ Final styling\n□ Client walk-through\n□ Project photography` },
    { name: "Contractor & Vendor List", type: "document", folder: "Contractors", content: `CONTRACTOR & VENDOR LIST — [PROJECT NAME]\n\nGENERAL CONTRACTOR\nCompany: [Name]  |  Contact: [Name]  |  Phone: [#]  |  Email: [Email]\nContract type: [Fixed / GMP / Cost-plus]  |  Contract value: $[Amount]\n\nSUBCONTRACTORS\nDiscipline: Electrical  |  Company: [Name]  |  Contact: [Name]  |  Phone: [#]  |  Approved: □\nDiscipline: Plumbing    |  Company: [Name]  |  Contact: [Name]  |  Phone: [#]  |  Approved: □\nDiscipline: HVAC        |  Company: [Name]  |  Contact: [Name]  |  Phone: [#]  |  Approved: □\nDiscipline: Tile        |  Company: [Name]  |  Contact: [Name]  |  Phone: [#]  |  Approved: □\nDiscipline: Flooring    |  Company: [Name]  |  Contact: [Name]  |  Phone: [#]  |  Approved: □\nDiscipline: Millwork    |  Company: [Name]  |  Contact: [Name]  |  Phone: [#]  |  Approved: □\nDiscipline: Painting    |  Company: [Name]  |  Contact: [Name]  |  Phone: [#]  |  Approved: □\n\nKEY VENDORS\nFurniture supplier: [Name]  |  Contact: [Name]  |  Lead time: [Weeks]\nLighting: [Name]  |  Contact: [Name]  |  Lead time: [Weeks]\nStone/tile: [Name]  |  Contact: [Name]  |  Lead time: [Weeks]\nHardware: [Name]  |  Contact: [Name]  |  Lead time: [Weeks]` },
    { name: "Punch List Template", type: "document", folder: "Client Deliverables", content: `PUNCH LIST — [PROJECT NAME]\nDate: [Date]  |  Walk-through with: [GC / Subs / Client]\nTarget completion date: [Date]\n\nINSTRUCTIONS\nStatus codes: O = Open | IP = In Progress | C = Closed\n\nLIVING / MAIN AREA\n□ [Item 1 — describe defect and location]\n□ [Item 2]\n□ [Item 3]\n\nKITCHEN\n□ [Item 1]\n□ [Item 2]\n\nBATHROOM(S)\n□ [Item 1]\n□ [Item 2]\n\nBEDROOM(S)\n□ [Item 1]\n□ [Item 2]\n\nOUTDOOR / OTHER\n□ [Item 1]\n□ [Item 2]\n\nGLOBAL ITEMS\n□ Final clean — all surfaces, floors, windows\n□ Touch-up paint — all rooms\n□ Hardware tightened and aligned\n□ All lights operational and dimmer tested\n□ Plumbing fixtures tested — no leaks\n□ HVAC balanced and tested\n\nFINAL SIGN-OFF\nGC signature: ___________________  Date: ________\nClient signature: ________________  Date: ________` },
    { name: "Client Presentation Outline", type: "document", folder: "Client Deliverables", content: `CLIENT PRESENTATION OUTLINE — [PROJECT NAME]\nMeeting type: [SD Review / DD Review / Final Presentation]\nDate: [Date]  |  Attendees: [Names]\nFormat: [In-person / Zoom / PDF deck]\n\nAGENDA (60–90 min meeting)\n1. Welcome & recap of brief (5 min)\n2. Design concept narrative (10 min)\n   • Inspiration & mood\n   • Overall spatial strategy\n3. Floor plan walkthrough (15 min)\n   • Circulation & adjacency decisions\n   • Key space highlights\n4. Material & palette presentation (20 min)\n   • Material boards or swatches per zone\n   • Reasoning for each selection\n5. Lighting design (10 min)\n6. Furniture direction (10 min)\n7. Budget overview (5 min)\n8. Next steps & timeline (5 min)\n9. Q&A (open)\n\nPRESENTATION ASSETS NEEDED\n□ Mood board(s)\n□ Floor plan (schematic)\n□ Key elevations / 3D views\n□ Material board (physical or digital)\n□ Budget summary\n□ Schedule` },
    { name: "Client Satisfaction Checklist", type: "document", folder: "Client Deliverables", content: `CLIENT SATISFACTION CHECKLIST — [PROJECT NAME]\nCompletion date: [Date]  |  Reviewed by: [Designer name]\n\nDESIGN DELIVERY\n□ All approved designs delivered as specified\n□ All materials and finishes installed as scheduled\n□ Furniture and accessories placed per final plan\n□ Art and lighting installed\n□ Final styling complete\n\nCOMMUNICATION\n□ Client briefed on warranty items and care instructions\n□ Contractor contact info handed over for any warranty issues\n□ All project files and specifications delivered to client\n□ As-built drawings provided (if applicable)\n\nFINANCIAL\n□ Final invoice issued\n□ All vendor invoices reconciled\n□ Final budget reconciliation presented to client\n□ Any retention released\n\nFOLLOW-UP\n□ 30-day check-in call scheduled\n□ Photography scheduled (with client permission)\n□ Testimonial / review requested\n□ Project featured on portfolio / social (with client approval)` },
  ],

  "E-commerce / DTC": [
    { name: "Brand & Business Overview", type: "document", folder: "Product Catalog", content: `BRAND & BUSINESS OVERVIEW — [BRAND NAME]\nFounded: [Year]  |  HQ: [Location]  |  Category: [Product category]\nChannel: [DTC / Amazon / Wholesale / Omni-channel]\nBusiness Model: [Transactional / Subscription / Bundle]\n\nBRAND STORY\n[Why was this brand founded? What gap or belief drives it? Who is it for?]\n\nMISSION\n[One sentence: We exist to ___]\n\nTARGET CUSTOMER\nPrimary persona: [Name, age range, lifestyle]\nPain they feel: [What frustrates them about existing solutions?]\nDesired outcome: [What do they want to feel or achieve?]\n\nPRODUCT LINEUP\n[Product 1]: $[XX] | [Short description]\n[Product 2]: $[XX] | [Short description]\n[Product 3]: $[XX] | [Short description]\n\nKEY METRICS (current or targets)\nRevenue run-rate: $[XX]\nAOV (Average Order Value): $[XX]\nCAC (Customer Acquisition Cost): $[XX]\nLTV (Lifetime Value): $[XX]\nRepeat purchase rate: [%]\n\nCURRENT CHANNELS\n□ Shopify DTC  □ Amazon  □ TikTok Shop  □ Wholesale  □ Retail\nTop traffic source: [Paid / Organic / Influencer / SEO]` },
    { name: "Product Catalog & Pricing", type: "document", folder: "Product Catalog", content: `PRODUCT CATALOG & PRICING — [BRAND NAME]\nDate: [Date]  |  Season/Version: [Season / V1]\n\nPRODUCT MASTER LIST\n\nSKU: [SKU001]\nName: [Product Name]\nDescription: [2–3 sentence product description]\nVariants: [Colors / Sizes / Flavors]\nCOGS: $[XX]  |  Retail price: $[XX]  |  Gross margin: [%]\nMinimum reorder qty: [Units]\nLead time: [Weeks]\nStatus: □ Active  □ Coming soon  □ Discontinued\n\nSKU: [SKU002]\nName: [Product Name]\nDescription: [Description]\nVariants: [Variants]\nCOGS: $[XX]  |  Retail price: $[XX]  |  Gross margin: [%]\nMinimum reorder qty: [Units]\nLead time: [Weeks]\nStatus: □ Active  □ Coming soon  □ Discontinued\n\nBUNDLES\nBundle 1: [Name] — includes [products] — Retail: $[XX] — Margin: [%]\nBundle 2: [Name] — includes [products] — Retail: $[XX] — Margin: [%]\n\nSUBSCRIPTION (if applicable)\nFrequency options: [Weekly / Monthly / Every 2 months]\nSubscription discount: [%]\nSubscription LTV target: $[XX]` },
    { name: "Marketing & Growth Plan", type: "document", folder: "Marketing", content: `MARKETING & GROWTH PLAN — [BRAND NAME]\nPeriod: [Q1 / H1 / Full Year] [Year]  |  Marketing Budget: $[Amount]\n\nGROWTH THESIS\n[How will we grow? Which 2–3 channels will drive most revenue? What's our core unfair advantage?]\n\nPAID ACQUISITION\nMeta (Facebook/Instagram):\n• Budget: $[XX]/month\n• Strategy: [Prospecting + retargeting / UGC-forward / etc.]\n• Target ROAS: [X.Xx]\nGoogle (Search/Shopping):\n• Budget: $[XX]/month\n• Strategy: [Branded + non-branded / PMax / etc.]\n• Target ROAS: [X.Xx]\nTikTok Ads:\n• Budget: $[XX]/month\n• Strategy: [Spark ads / creative testing / etc.]\n\nORGANIC & CONTENT\nInstagram: [# posts/week], [Content strategy]\nTikTok: [# videos/week], [Content strategy]\nEmail list: [# subscribers], [Cadence: # emails/week]\nSMS: [# subscribers], [Cadence]\n\nINFLUENCER / CREATOR STRATEGY\nTier: [Nano 1k–10k / Micro 10k–100k / Macro]\nBudget: $[XX]/month  |  # partnerships/month: [#]\nSeeding strategy: [Free product / affiliate / paid]\n\nQUARTERLY REVENUE TARGETS\nQ1: $[XX]  Q2: $[XX]  Q3: $[XX]  Q4: $[XX]` },
    { name: "Operations & Fulfillment SOP", type: "document", folder: "Operations & Fulfillment", content: `OPERATIONS & FULFILLMENT SOP — [BRAND NAME]\n\nFULFILLMENT MODEL\n□ In-house  □ 3PL (Third-Party Logistics)  □ Dropship  □ Hybrid\n3PL provider (if applicable): [Name]  |  Contract rate: [$/unit or monthly]\nWarehouse location: [City, State]\n\nORDER PROCESSING\nOrder placed → [Platform] → [WMS / Shopify] → [3PL / fulfillment center]\nProcessing SLA: Orders placed before [time] ship same day / next day\nPacking standard: [Poly bag / box / branded packaging — describe]\n\nSHIPPING\nDomestic standard: [Carrier] — [2–5 days] — $[XX] or free over $[XX]\nDomestic express: [Carrier] — [1–2 days] — $[XX]\nInternational: [Countries served] — [Carrier] — $[XX] — duties [DDU/DDP]\n\nINVENTORY MANAGEMENT\nReorder point: [# units]\nSafety stock level: [# weeks of supply]\nInventory count cadence: [Weekly / Monthly]\nSlow-moving SKU threshold: [# days no movement]\n\nRETURNS\nReturn window: [30 / 60 / 90] days\nCondition policy: [Unused/original packaging / Any condition]\nReturn portal: [Self-serve via [platform] / email CS]\nRefund processing time: [X business days]` },
    { name: "Unit Economics & P&L", type: "document", folder: "Finance & Metrics", content: `UNIT ECONOMICS & P&L — [BRAND NAME]\nPeriod: [Month / Quarter]  |  Currency: [USD]\n\nUNIT ECONOMICS (per order)\nRevenue (AOV):           $[XX]\n– COGS:                  ($[XX])  [%]\n– Shipping & fulfillment:($[XX])  [%]\n– Payment processing:    ($[XX])  [~3%]\nContribution margin 1:   $[XX]   [%]\n– Returns & refunds:     ($[XX])  [%]\nContribution margin 2:   $[XX]   [%]\n– Blended CAC:           ($[XX])\nContribution margin 3:   $[XX]   [%]\n\nCUSTOMER METRICS\nLTV (12-month):     $[XX]\nLTV:CAC ratio:      [X]:1  (target ≥ 3:1)\nRepeat rate:        [%]\nSubscription %:     [%] of orders\n\nMONTHLY P&L\nGross revenue:      $[XX]\nRefunds/returns:    ($[XX])\nNet revenue:        $[XX]\nCOGS:               ($[XX])\nGross profit:       $[XX]   [%]\nMarketing spend:    ($[XX])\nOperating expenses: ($[XX])\nEBITDA:             $[XX]   [%]\n\nKEY BENCHMARKS\nGross margin target: ≥ [60]%\nMarketing % of revenue: ≤ [25]%\nMonthly burn (if pre-profit): $[XX]` },
    { name: "Tech Stack & Integrations", type: "document", folder: "Tech Stack", content: `TECH STACK & INTEGRATIONS — [BRAND NAME]\n\nSTOREFRONT\nPlatform: [Shopify / WooCommerce / Custom]\nTheme/Framework: [Name]  |  Customization level: [Low / Medium / Custom]\n\nKEY APPS & TOOLS\nEmail/SMS: [Klaviyo / Attentive / Postscript]\nReviews: [Okendo / Yotpo / Loox / Judge.me]\nUpsell/cross-sell: [Rebuy / Bold / Zipify]\nSubscriptions: [Recharge / Skio / Stay.ai]\nLoyalty: [LoyaltyLion / Smile.io / Yotpo Loyalty]\nReturns: [Loop / AfterShip / Narvar]\nShipping: [ShipStation / EasyPost / ShipBob]\nAnalytics: [Triple Whale / Northbeam / Google Analytics 4]\nCRO: [Hotjar / Microsoft Clarity / Intelligems]\nInventory: [Inventory Planner / Cin7 / Linnworks]\nCustomer support: [Gorgias / Zendesk / Re:amaze]\n\nDATA & TRACKING\nPixel/tracking: [Meta CAPI / GA4 / Triple Whale pixel]\nAttribution model: [Last-click / Data-driven / MTA]\n\nINTEGRATIONS MAP\n[Shopify] ↔ [Klaviyo] — order triggers, segments\n[Shopify] ↔ [3PL] — order routing, inventory sync\n[Shopify] ↔ [Gorgias] — order lookup, CS tickets` },
    { name: "Launch Calendar", type: "document", folder: "Marketing", content: `LAUNCH CALENDAR — [BRAND NAME]\nYear: [YYYY]  |  Version: [#]\n\nLAUNCH TYPES\n• New product launch\n• Seasonal / holiday sale\n• Influencer campaign\n• Email/SMS campaign send\n• Restocking\n\nCALENDAR\nJAN: [Campaign / product launch notes]\nFEB: Valentine's Day push — [Details]\nMAR: Spring launch — [Details]\nAPR: [Campaign]\nMAY: Mother's Day — [Details]\nJUN: Mid-year sale — [Details]\nJUL: [Campaign]\nAUG: Back-to-school — [Details]\nSEP: Fall launch — [Details]\nOCT: Pre-holiday ramp + Halloween — [Details]\nNOV: Black Friday / Cyber Monday — [BFCM strategy]\nDEC: Holiday + gifting push — [Details]\n\nBFCM STRATEGY (Priority)\nTarget revenue: $[XX]  |  Email/SMS sends: [#]\nOffers: [Discount % / Free gift / Bundle]\nAd spend increase: [X]x normal budget\nCampaign start date: [Date]` },
    { name: "Customer Persona", type: "document", folder: "Marketing", content: `CUSTOMER PERSONA — [BRAND NAME]\nPersona Name: [Give them a name — e.g., "Wellness Whitney"]\n\nDEMOGRAPHICS\nAge range: [XX–XX]\nGender: [Primary demographic]\nLocation: [Urban / Suburban / Rural — US / Global]\nIncome: $[XX,000]–$[XX,000]/year\nOccupation: [Describe]\nFamily: [Single / Married / Kids]\n\nPSYCHOGRAPHICS\nValues: [What do they care about deeply?]\nLifestyle: [How do they spend their time?]\nAspirations: [What do they want to become or achieve?]\nFrustrations: [What annoys them about current solutions?]\n\nSHOPPING BEHAVIOR\nWhere they discover products: [Instagram / TikTok / Google / Word of mouth]\nWhat they read before buying: [Reviews / UGC / Blog / Nothing — impulse]\nAverage spend per order: $[XX]\nHow often they repurchase: [Monthly / Quarterly / When needed]\nWhat would make them switch to a competitor: [Price / Better quality / Better brand]\n\nMESSAGING THAT RESONATES\nEmotional hook: [What feeling do they want?]\nKey benefit to emphasize: [Convenience / Quality / Community / Status / Values]\nTone they respond to: [Witty / Earnest / Expert / Aspirational / Friendly]` },
    { name: "Supplier & COGS Tracker", type: "document", folder: "Operations & Fulfillment", content: `SUPPLIER & COGS TRACKER — [BRAND NAME]\n\nSUPPLIER DIRECTORY\nSupplier 1:\nName: [Name]  |  Location: [Country]\nProducts: [SKU list]\nLead time: [Weeks]  |  MOQ: [Units]  |  Payment terms: [Net30 / 50% deposit]\nPrimary contact: [Name, email]\nQuality rating: [1–5 ★]\n\nSupplier 2:\nName: [Name]  |  Location: [Country]\nProducts: [SKU list]\nLead time: [Weeks]  |  MOQ: [Units]  |  Payment terms: [Terms]\nPrimary contact: [Name, email]\nQuality rating: [1–5 ★]\n\nCOGS BREAKDOWN (per unit)\nSKU: [Name]\nRaw materials/components:  $[XX]\nManufacturing/assembly:    $[XX]\nPackaging:                 $[XX]\nQuality inspection:        $[XX]\nFreight (landed cost):     $[XX]\nDuties & customs:          $[XX]\nTotal COGS:                $[XX]\nRetail price:              $[XX]\nGross margin:              [%]\n\nCOST REDUCTION TARGETS\nTarget COGS reduction: [%] by [Date]\nStrategies: [Volume commitments / alternate suppliers / design optimization]` },
  ],

  "Real Estate": [
    { name: "Deal Overview & Thesis", type: "document", folder: "Property Research", content: `DEAL OVERVIEW & THESIS — [PROPERTY NAME]\nProperty type: [Single-family / Multi-family / Commercial / Industrial / Mixed-use]\nAddress: [Address]  |  City: [City, State]\nAcquisition price: $[Amount]  |  Close date (target): [Date]\nStrategy: □ Buy & hold  □ Fix & flip  □ BRRRR  □ Development  □ Syndication\n\nINVESTMENT THESIS\n[Why this deal? What macro and micro factors make this property compelling?]\n\nDEAL HIGHLIGHTS\n• [Key metric 1 — e.g., cap rate, cash-on-cash, IRR]\n• [Key metric 2]\n• [Key differentiator — location, value-add opportunity, etc.]\n• [Risk mitigant — why this is defensible]\n\nPROPERTY OVERVIEW\nSq ft: [#]  |  Lot size: [#]  |  Year built: [Year]\nBedrooms/units: [#]  |  Bathrooms: [#]\nCurrent use: [Describe]  |  Proposed use: [Describe if changing]\nZoning: [Code]  |  Permitted uses: [List]\n\nLOCATION RATIONALE\nSubmarket: [Name]  |  Walk score: [#]  |  Transit score: [#]\nProximity to: [Employment centers / schools / amenities]\nMarket trend: [Appreciating / Stable / Emerging]` },
    { name: "Pro Forma Financial Model", type: "document", folder: "Financials & Pro Forma", content: `PRO FORMA FINANCIAL MODEL — [PROPERTY NAME]\nScenario: [Base / Conservative / Upside]\n\nACQUISITION\nPurchase price:              $[Amount]\nAcquisition costs ([3]%):   $[Amount]\nCapEx / renovation budget:  $[Amount]\nTotal project cost:         $[Amount]\nLoan amount ([LTV]%):       $[Amount]\nEquity required:            $[Amount]\n\nINCOME (Year 1 Stabilized)\nGross rental income:        $[Amount]/year\nVacancy ([5]%):            ($[Amount])\nEffective gross income:     $[Amount]\n\nEXPENSES\nProperty taxes:             $[Amount]\nInsurance:                  $[Amount]\nPM fee ([8]%):              $[Amount]\nMaintenance & repairs:      $[Amount]\nUtilities (owner-paid):     $[Amount]\nOther:                      $[Amount]\nTotal expenses:             $[Amount]\n\nNET OPERATING INCOME (NOI):$[Amount]\nDebt service (annual):     ($[Amount])\nCash flow after debt:       $[Amount]\n\nRETURN METRICS\nCap rate:                  [%]\nCash-on-cash return:       [%]\nGross rent multiplier:     [X.X]x\nIRR (5-year hold):         [%]\nEquity multiple:           [X.Xx]` },
    { name: "Due Diligence Checklist", type: "document", folder: "Due Diligence", content: `DUE DILIGENCE CHECKLIST — [PROPERTY NAME]\nDD period: [Start date] – [End date]  |  Deadline: [Date]\n\nTITLE & LEGAL\n□ Title report ordered and reviewed\n□ CC&Rs / HOA docs reviewed (if applicable)\n□ Survey ordered\n□ Environmental report (Phase I) ordered if commercial\n□ Zoning confirmed\n□ Liens / encumbrances confirmed cleared\n\nPHYSICAL INSPECTION\n□ General inspection completed  |  Inspector: [Name]\n□ Roof inspection\n□ HVAC inspection\n□ Plumbing inspection\n□ Electrical panel inspection\n□ Foundation / structural review\n□ Pest / termite inspection\n□ Issues noted: [List]\n\nFINANCIAL REVIEW\n□ Current rent roll obtained and verified\n□ Last 2 years of operating statements reviewed\n□ Property tax records confirmed\n□ Utility bills reviewed\n□ All leases reviewed\n□ Tenant estoppels received (multi-family/commercial)\n\nMARKET DATA\n□ Comparable sales pulled (last 6 months)\n□ Comparable rentals pulled\n□ Vacancy rate research done\n□ Rent growth trend analyzed\n\nDD SUMMARY\nFatal flaws found: [Yes / No — describe]\nRepair cost estimate from inspection: $[Amount]\nRenegotiation needed: [Yes / No — describe]` },
    { name: "Comparable Market Analysis", type: "document", folder: "Property Research", content: `COMPARABLE MARKET ANALYSIS — [PROPERTY NAME]\nDate: [Date]  |  Prepared by: [Name]\n\nSUBJECT PROPERTY\nAddress: [Address]  |  Sq ft: [#]  |  Beds/Baths: [#/# ]\nList price: $[Amount]  |  Price per sq ft: $[XX]\n\nSALES COMPARABLES (last 6–12 months)\nComp 1: [Address] | [Beds/Baths] | [Sq ft] | Sold $[Amount] | $[XX]/sf | [Date] | [# days on market]\nComp 2: [Address] | [Beds/Baths] | [Sq ft] | Sold $[Amount] | $[XX]/sf | [Date] | [# days on market]\nComp 3: [Address] | [Beds/Baths] | [Sq ft] | Sold $[Amount] | $[XX]/sf | [Date] | [# days on market]\nComp 4: [Address] | [Beds/Baths] | [Sq ft] | Sold $[Amount] | $[XX]/sf | [Date] | [# days on market]\n\nSALES ADJUSTMENT SUMMARY\nAverage sold price/sf of comps: $[XX]\nAdjusted value of subject:      $[Amount]\nPrice range: $[Low] – $[High]\n\nRENTAL COMPARABLES (current market)\nRental Comp 1: [Address] | [Beds/Baths] | [Sq ft] | Asking $[XX]/mo\nRental Comp 2: [Address] | [Beds/Baths] | [Sq ft] | Asking $[XX]/mo\nRental Comp 3: [Address] | [Beds/Baths] | [Sq ft] | Asking $[XX]/mo\nMarket rent estimate for subject: $[XX]/month\n\nVACK RATE & ABSORPTION\nSubmarket vacancy rate: [%]\nAvg days on market (rentals): [#] days\nMarket trend: [Appreciating / Stable / Softening]` },
    { name: "Offer & Negotiation Log", type: "document", folder: "Legal & Contracts", content: `OFFER & NEGOTIATION LOG — [PROPERTY NAME]\nSeller: [Name / Entity]  |  Listing agent: [Name, brokerage]\nListing price: $[Amount]  |  Days on market at offer: [#]\n\nOFFER HISTORY\nOffer 1:\nDate: [Date]  |  Amount: $[Amount]  |  Terms: [Cash / Conventional / other]\nContingencies: [Inspection / Financing / Appraisal]\nClose date: [Date]  |  Deposit: $[Amount]\nSeller response: [Rejected / Counter / Accepted]\n\nCounter 1:\nDate: [Date]  |  Amount: $[Amount]  |  Terms: [Terms]\nResponse: [Counter / Accepted]\n\nOffer 2 (revised):\nDate: [Date]  |  Amount: $[Amount]  |  Final terms: [Terms]\nResult: [Accepted / In negotiation]\n\nKEY NEGOTIATION POINTS\n• Price: [What was conceded?]\n• Credits: Seller credits $[Amount] for [repairs / closing costs]\n• Included items: [Appliances / equipment staying]\n• Exclusions: [What seller is keeping]\n• Close date: [Final agreed date]\n\nFINAL AGREED TERMS\nPurchase price: $[Amount]\nClose date: [Date]\nDeposit: $[Amount] (due [Date])\nDD period ends: [Date]` },
    { name: "Renovation Scope & Budget", type: "document", folder: "Financials & Pro Forma", content: `RENOVATION SCOPE & BUDGET — [PROPERTY NAME]\nStrategy: [Cosmetic / Full gut / Light value-add]\nGeneral Contractor: [Name]  |  Estimated start: [Date]  |  Duration: [X weeks]\n\nSCOPE OF WORK\n\nKITCHEN\n□ Cabinets: [Replace / Reface / Paint]         $[Amount]\n□ Countertops: [Quartz / Granite / Laminate]   $[Amount]\n□ Appliances: [Replace all / partial]           $[Amount]\n□ Plumbing fixtures                             $[Amount]\n□ Lighting                                      $[Amount]\nKitchen subtotal:                               $[Amount]\n\nBATHROOM(S)\n□ Vanity / toilet / fixtures                    $[Amount]\n□ Tile (floor + shower)                         $[Amount]\n□ Shower / tub                                  $[Amount]\nBathroom subtotal:                              $[Amount]\n\nFLOORING\n□ [LVP / hardwood / tile] — [sq ft]            $[Amount]\n\nPAINT (interior + exterior)                    $[Amount]\n\nROOF (if needed)                               $[Amount]\n\nHVAC (if needed)                               $[Amount]\n\nELECTRICAL / PLUMBING (if needed)             $[Amount]\n\nLANDSCAPING & EXTERIOR                        $[Amount]\n\nCONTINGENCY (10–15%):                         $[Amount]\n─────────────────────────────────────\nTOTAL RENOVATION BUDGET:                      $[Amount]\n\nARV (After-Repair Value):                      $[Amount]\nTotal project cost:                            $[Amount]\nEquity created:                                $[Amount]` },
    { name: "Marketing & Listing Strategy", type: "document", folder: "Marketing", content: `MARKETING & LISTING STRATEGY — [PROPERTY NAME]\nListing type: □ For sale  □ For rent\nListing agent / platform: [Name / Zillow / Apartments.com / Crexi]\nTarget list date: [Date]  |  Target close/lease: [Date]\n\nPRICING STRATEGY\nList price: $[Amount]  |  Rationale: [Based on comps — see CMA]\nPricing approach: □ Priced to sell fast  □ Priced at market  □ Testing above market\nPrice reduction triggers: [If no offer in X days, reduce by $XX]\n\nPROPERTY PREP\n□ Professional photography (include drone if lot > [X] acres)\n□ 3D virtual tour (Matterport)\n□ Staging: □ Full  □ Virtual  □ Key rooms only\n□ Curb appeal refresh: [Describe]\n□ Pre-listing inspection done\n\nMARKETING ASSETS\n□ MLS listing copy (see below)\n□ Social media posts (Instagram, Facebook)\n□ Email to buyers list\n□ Open house scheduled: [Date/Time]\n\nMLS LISTING COPY\nHeadline: [Attention-grabbing headline]\nDescription: [2–4 paragraphs describing property, features, location, and lifestyle]\n\nSHOWING INSTRUCTIONS\nAccess: [Lockbox / Agent accompanies]\nNotice required: [24hr / Same day]\nPets: [On premises — advise]` },
    { name: "Financing & Lender Tracker", type: "document", folder: "Financials & Pro Forma", content: `FINANCING & LENDER TRACKER — [PROPERTY NAME]\nLoan type: □ Conventional  □ FHA  □ Commercial  □ DSCR  □ Hard money  □ Bridge  □ Cash\nTarget LTV: [%]  |  Loan amount: $[Amount]  |  Down payment: $[Amount]\n\nLENDER COMPARISON\nLender 1: [Name]\nLoan type: [Type]  |  Rate: [%]  |  Points: [#]\nLTV: [%]  |  DSCR requirement: [X.Xx]  |  Close timeline: [Days]\nFees: $[Amount]  |  Prepay penalty: [Yes / No]\n\nLender 2: [Name]\nLoan type: [Type]  |  Rate: [%]  |  Points: [#]\nLTV: [%]  |  DSCR requirement: [X.Xx]  |  Close timeline: [Days]\nFees: $[Amount]  |  Prepay penalty: [Yes / No]\n\nSELECTED LENDER: [Name]\nRationale: [Why chosen]\n\nLOAN MILESTONES\n□ Pre-approval obtained  |  Date: [Date]\n□ Loan application submitted  |  Date: [Date]\n□ Appraisal ordered  |  Date: [Date]\n□ Appraisal received  |  Value: $[Amount]\n□ Clear to close (CTC)  |  Date: [Date]\n□ Closing scheduled  |  Date: [Date]\n\nRATIO CHECKS\nDSCR (NOI / Debt Service): [X.Xx]  (lender min: [X.Xx])\nLTV: [%]  (lender max: [%])` },
    { name: "Property Management Plan", type: "document", folder: "Legal & Contracts", content: `PROPERTY MANAGEMENT PLAN — [PROPERTY NAME]\nManagement model: □ Self-managed  □ Third-party PM\nProperty manager (if 3rd party): [Company]  |  Fee: [%] of collected rent\n\nTENANT ACQUISITION\nListing platforms: [Zillow / Apartments.com / Craigslist / MLS]\nScreening criteria:\n• Credit score minimum: [#]\n• Income requirement: [X]x monthly rent\n• Background check: [Yes — provider: [Company]]\n• References: [Prior landlord required]\n\nLEASE TERMS\nLease length: [12 months / Month-to-month]\nRent: $[Amount]/month  |  Due date: [1st of month]\nLate fee: $[Amount] after [# days] grace period\nSecurity deposit: $[Amount] (= [# months] rent)\nPet policy: [No pets / Dogs OK — $[XX] deposit]\n\nMAINTENANCE PROTOCOL\nRoutine maintenance requests: [Tenant submits via [platform/method]]\nEmergency line: [Number / 24-hr service]\nPreferred vendors:\n• Plumber: [Name, phone]\n• HVAC: [Name, phone]\n• Electrician: [Name, phone]\n• Handyman: [Name, phone]\n\nANNUAL OPERATING CALENDAR\n□ Annual inspection (tenant present)\n□ HVAC filter change: [Frequency]\n□ Smoke/CO detector test: [Annually]\n□ Lease renewal notice: [60 days before expiry]\n□ Year-end financial report` },
  ],

  "Blockchain / Web3": [
    { name: "Protocol Design Document", type: "document", folder: "Protocol Design", content: `PROTOCOL DESIGN DOCUMENT — [PROTOCOL NAME]\nVersion: 0.1  |  Date: [Date]  |  Authors: [Names]\nCategory: □ DeFi  □ NFT/Gaming  □ Infrastructure  □ DAO  □ Identity  □ Storage  □ Cross-chain\nChain(s): [Ethereum / Solana / Base / Polygon / Avalanche / custom]\n\nPROBLEM STATEMENT\n[What specific problem does this protocol solve? Why does it need to exist on-chain?]\n\nSOLUTION OVERVIEW\n[What does the protocol do? How does it work at a high level?]\n\nCORE MECHANICS\n1. [Mechanic 1 — describe in plain language]\n2. [Mechanic 2]\n3. [Mechanic 3]\n\nARCHITECTURE\nContracts:\n• [ContractName.sol] — [Responsibility]\n• [ContractName.sol] — [Responsibility]\nOff-chain components:\n• [Indexer / Oracle / Frontend / API]\nOracle usage: [Chainlink / Pyth / TWAP / none]\n\nSECURITY MODEL\nAccess control: [Ownable / Role-based / Multisig]\nUpgradeability: [Immutable / Proxy — which pattern]\nAudit plan: [Firm names / timeline]\nBug bounty: [Amount / platform]\n\nKEY RISKS\n1. [Smart contract risk]\n2. [Oracle risk / manipulation]\n3. [Governance attack]\n4. [Regulatory risk]\n\nSUCCESS METRICS\n[TVL / DAU / transaction volume / protocol revenue / etc.]` },
    { name: "Tokenomics Design", type: "document", folder: "Tokenomics", content: `TOKENOMICS DESIGN — [TOKEN SYMBOL] / [PROJECT NAME]\nStandard: [ERC-20 / SPL / ERC-721 / etc.]\nChain: [Ethereum / Solana / Base / etc.]\n\nTOKEN PURPOSE\n□ Governance  □ Fee payment  □ Staking  □ Rewards  □ Access  □ Collateral\n[Describe the core economic role of the token]\n\nSUPPLY SCHEDULE\nMax supply: [#] tokens\nInitial circulating supply: [#] tokens ([%] of max)\nInflation schedule: [Fixed / Decreasing / No inflation]\n\nALLOCATION\nTeam & founders: [%] — locked [X months], vesting [X months linear]\nInvestors: [%] — locked [X months], vesting [X months]\nEcosystem / treasury: [%] — governed by DAO / multisig\nCommunity / airdrop: [%]\nLiquidity provisioning: [%]\nProtocol reserves: [%]\n\nVESTING & LOCKUPS\nTeam cliff: [# months]  |  Vest duration: [# months]\nInvestor cliff: [# months]  |  Vest duration: [# months]\n\nEMISSION MECHANICS (if applicable)\nReward rate: [X% APY / fixed emissions / halvings]\nDistribution: [Staking rewards / LP incentives / usage-based]\n\nVALUE CAPTURE\n[How does the token capture value from protocol activity?]\n[Fee switch / buyback-and-burn / staking yield / etc.]\n\nANTI-DUMP MECHANISMS\n[Vesting contracts / liquidity locks / staking requirements]` },
    { name: "Smart Contract Spec", type: "document", folder: "Smart Contracts", content: `SMART CONTRACT SPECIFICATION — [PROJECT NAME]\nDate: [Date]  |  Lead engineer: [Name]  |  Target audit: [Date]\n\nCONTRACTS\n\n[ContractName].sol\nPurpose: [What does this contract do?]\nInherits: [OpenZeppelin contracts — list]\nStorage:\n  • [variableName]: [type] — [purpose]\n  • [variableName]: [type] — [purpose]\nKey functions:\n  • [functionName(params)]: [What it does, access control, events emitted]\n  • [functionName(params)]: [Description]\nEvents:\n  • [EventName(indexed params)]: [When emitted]\nModifiers:\n  • [onlyOwner / whenNotPaused / etc.]\n\n[ContractName2].sol\n[Same structure]\n\nINTERACTION FLOWS\nFlow 1 — [User action]:\n1. User calls [contract.function(params)]\n2. Contract validates [conditions]\n3. State updated: [describe]\n4. Event emitted: [EventName]\n\nAUDIT SCOPE\nContracts in scope: [List]\nOut of scope: [List]\nKnown issues / accepted risks: [List]\n\nTESTING\nTest framework: [Hardhat / Foundry]\nCoverage target: [100]% of critical paths\nFork testing: [Yes / No — mainnet block #]` },
    { name: "Community & DAO Framework", type: "document", folder: "Community & DAO", content: `COMMUNITY & DAO FRAMEWORK — [PROJECT NAME]\n\nCOMMUNITY CHANNELS\nPrimary: [Discord / Telegram / Farcaster / Lens]\nSecondary: [Twitter/X / Reddit / Mirror]\nCommunity manager: [Name]\n\nDISCORD STRUCTURE (if applicable)\n#announcements — admin only\n#general — open discussion\n#governance — proposals and voting\n#dev-chat — technical discussion\n#support — user help\n#alpha / holders-only — token/NFT gated\n\nDAO STRUCTURE\nGovernance token: [$SYMBOL]\nVoting mechanism: [On-chain: Compound Governor / Tally / Snapshot off-chain]\nProposal threshold: [# tokens to submit]\nQuorum requirement: [%]\nVoting period: [# days]\nTimelock: [# hours / days]\n\nPROPOSAL TYPES\n□ Protocol parameter changes\n□ Treasury allocations (spend > $[XX])\n□ Smart contract upgrades\n□ Grants and ecosystem funding\n\nCOMMUNITY GROWTH STRATEGY\nPhase 1 — Core community: [Target # members, how to attract]\nPhase 2 — Ecosystem: [Grants, hackathons, builder incentives]\nPhase 3 — Mainstream: [Simplification, consumer apps]\n\nAMBASSADOR PROGRAM\nRequirements: [Token holding / activity / KYC]\nBenefits: [Token grants / access / recognition]\nResponsibilities: [Content / support / events]` },
    { name: "Fundraising & Investor Strategy", type: "document", folder: "Legal & Compliance", content: `FUNDRAISING & INVESTOR STRATEGY — [PROJECT NAME]\n\nFUNDRAISING HISTORY\nPre-seed: $[Amount] at $[Valuation] valuation  |  Date: [Date]  |  Investors: [Names]\nSeed: $[Amount] at $[Valuation]  |  Date: [Date]  |  Investors: [Names]\n\nCURRENT RAISE\nRound: [Seed / Series A / Strategic]\nAmount: $[Amount]  |  Instrument: [SAFE / Priced equity / SAFT / Token warrants]\nValuation / cap: $[Amount]\nLead investor: [Name / TBD]\nTarget close: [Date]\n\nUSE OF FUNDS\n[%] Engineering & core team ([# months runway])\n[%] Security audits & infrastructure\n[%] Community & marketing growth\n[%] Legal & compliance\n[%] Ecosystem grants & partnerships\n\nTARGET INVESTORS\n1. [Fund name] — [Why them — thesis fit, portfolio]\n2. [Fund name] — [Why them]\n3. [Angel name] — [Why them]\n\nKEY DOCUMENTS\n□ Pitch deck  □ One-pager  □ Token paper / whitepaper\n□ Legal opinion on token classification\n□ Cap table  □ Financial projections\n\nCOMPLIANCE CONSIDERATIONS\nJurisdiction: [US / Cayman / Singapore / UAE]\nToken classification: [Utility / Security / TBD]\nKYC/AML: [Required for token sale — provider: [Name]]` },
    { name: "Launch & TGE Plan", type: "document", folder: "Community & DAO", content: `LAUNCH & TOKEN GENERATION EVENT (TGE) PLAN — [PROJECT NAME]\nTGE date (target): [Date]  |  Chain: [Ethereum / Solana / Base]\n\nPRE-LAUNCH MILESTONES\n□ Smart contracts audited  |  Firm: [Name]  |  Report published: [Date]\n□ Multisig / timelock configured  |  Signers: [Names]\n□ Token contract deployed to mainnet\n□ Community reaches [#] Discord members\n□ [# of] integrations / partnerships announced\n□ CEX listing confirmed (if applicable): [Exchange]\n□ DEX liquidity provisioned: $[Amount] on [Uniswap / Orca / etc.]\n\nTGE MECHANICS\nInitial circulating supply: [#] tokens ([%] of max)\nInitial liquidity: $[Amount] ([% of] raise proceeds)\nDEX listing price: $[XX] per token\nFDV at listing: $[Amount]\n\nLAUNCH DAY SEQUENCE\n08:00 UTC: Token contract verified on Etherscan\n10:00 UTC: Liquidity added to DEX\n10:00 UTC: Community announcement\n12:00 UTC: Twitter/X Spaces AMA\nOngoing: Monitor Telegram / Discord for support\n\nPOST-LAUNCH\nWeek 1: Monitor liquidity / bot activity\nWeek 2–4: First governance vote\nMonth 2: Ecosystem grants round 1\nMonth 3: V2 roadmap announcement` },
    { name: "Security & Audit Checklist", type: "document", folder: "Legal & Compliance", content: `SECURITY & AUDIT CHECKLIST — [PROJECT NAME]\n\nPRE-AUDIT INTERNAL REVIEW\n□ All contracts have natspec documentation\n□ All public/external functions have access control\n□ No hardcoded addresses or private keys\n□ Reentrancy guards on all external calls\n□ Integer overflow/underflow checked (Solidity 0.8+ or SafeMath)\n□ All user inputs validated\n□ Emergency pause / circuit breaker implemented\n□ Upgradeable proxy pattern reviewed (if used)\n□ Oracle manipulation resistant (TWAP, not spot price)\n□ 100% test coverage on critical functions\n\nAUDIT PROCESS\nFirm 1: [Name]  |  Timeline: [Weeks]  |  Cost: $[Amount]\nFirm 2: [Name]  |  Timeline: [Weeks]  |  Cost: $[Amount]\nScope submitted: [Date]\nAudit start: [Date]  |  Report received: [Date]\nCritical findings: [#]  |  High: [#]  |  Medium: [#]  |  Low: [#]\nAll criticals/highs resolved: □ Yes\nPublic report URL: [URL]\n\nBUG BOUNTY\nPlatform: [Immunefi / HackerOne / Code4rena]\nCritical payout: up to $[Amount]\nHigh payout: up to $[Amount]\nActive since: [Date]  |  URL: [URL]\n\nMULTISIG CONFIGURATION\nMultisig address: [0x...]\nRequired signers: [X of Y]\nSigners: [Names / addresses]\nTimelock: [# hours]` },
    { name: "Whitepaper Outline", type: "document", folder: "Protocol Design", content: `WHITEPAPER OUTLINE — [PROJECT NAME]\nVersion: 0.1 Draft  |  Date: [Date]\n\n1. ABSTRACT\n[150–300 word summary of the protocol, problem, solution, and token]\n\n2. INTRODUCTION\n2.1 Problem statement — why today's solutions fail\n2.2 The opportunity — market size / timing\n2.3 Our approach\n\n3. PROTOCOL DESIGN\n3.1 Architecture overview\n3.2 Core mechanics (with diagrams)\n3.3 Smart contract design\n3.4 Oracle and data feeds\n3.5 Security model\n\n4. TOKENOMICS\n4.1 Token overview and utility\n4.2 Supply and distribution\n4.3 Vesting schedules\n4.4 Value capture mechanisms\n4.5 Economic sustainability model\n\n5. GOVERNANCE\n5.1 DAO structure\n5.2 Proposal and voting process\n5.3 Treasury management\n\n6. ROADMAP\n6.1 Phase 1 — [Name + timeline]\n6.2 Phase 2 — [Name + timeline]\n6.3 Phase 3 — [Name + timeline]\n\n7. TEAM\n[Profiles of core contributors]\n\n8. RISKS\n[Smart contract / regulatory / market / competition risks]\n\n9. CONCLUSION\n[Vision for the future]\n\nAPPENDICES\nA. Technical specs\nB. Audit reports\nC. Legal disclaimers` },
    { name: "Legal & Regulatory Framework", type: "document", folder: "Legal & Compliance", content: `LEGAL & REGULATORY FRAMEWORK — [PROJECT NAME]\nCounsel: [Law firm name]  |  Jurisdiction: [US / Cayman / Singapore / UAE / BVI]\n\nENTITY STRUCTURE\nOperating entity: [LLC / Corp / Foundation — jurisdiction]\nFoundation (if applicable): [Jurisdiction — Cayman / Switzerland / Panama]\nIP holding: [Entity and jurisdiction]\n\nTOKEN LEGAL OPINION\nStatus: [Obtained / In progress / Pending]\nConclusion: [Utility token / Security / Insufficient basis — TBD]\nCounsel: [Name, firm]\n\nUS REGULATORY CONSIDERATIONS\nHowey test analysis: [Summary of analysis]\nSEC no-action or safe harbor applicable: [Yes / No / N/A]\nKYC/AML for US participants: [Required / Blocked from participation]\n\nTOKEN SALE RESTRICTIONS\nUS persons: □ Excluded  □ Accredited investors only  □ Unrestricted\nSanctioned countries: Excluded per OFAC list\nGeofencing implemented: [Yes — tech provider: [Name]]\n\nIP & OPEN SOURCE\nCore protocol: [Open source — MIT / GPL / BSL / proprietary]\nBrand / trademark: [Registered in [jurisdictions]]\nFront-end: [Open source / Proprietary]\n\nCOMPLIANCE CALENDAR\n□ Annual legal review of token status\n□ OFAC list updates: [Monthly]\n□ KYC/AML refresh: [Annual]\n□ Tax reporting: [Annual — counsel: [Name]]` },
  ],

  "Clean Energy": [
    { name: "Project Overview & Technology", type: "document", folder: "Technology & R&D", content: `PROJECT OVERVIEW & TECHNOLOGY — [PROJECT NAME]\nTechnology type: □ Solar PV  □ Wind (onshore/offshore)  □ Battery storage  □ Green hydrogen  □ Geothermal  □ Biomass  □ Hydro  □ EV / Charging  □ Other: [Specify]\nProject stage: □ Development  □ Construction  □ Operating  □ R&D\nLocation: [City, State/Country]  |  Capacity: [MW / MWh]\n\nTECHNOLOGY OVERVIEW\n[Describe the technology: how it works, key components, efficiency, and differentiation from existing solutions]\n\nKEY SPECIFICATIONS\nCapacity: [MW / MWh]  |  Annual generation: [MWh/year]\nCapacity factor: [%]  |  Technology provider(s): [Names]\nLandfall / connection: [Substation / Grid connection point]\nGrid interconnection voltage: [kV]\n\nSITE RATIONALE\nResource quality: [Solar irradiance / Wind speed / GHI data]\nSite control: [Owned / Leased / Option to lease]\nLand area: [Acres / Hectares]\nProximity to transmission: [Miles / km to nearest substation]\n\nKEY MILESTONES (Development)\n□ Site assessment complete\n□ Resource study complete\n□ Interconnection application submitted\n□ Environmental study complete\n□ Permitting received\n□ Power Purchase Agreement executed\n□ Financial close\n□ Construction start\n□ Commercial operations date (COD)` },
    { name: "Project Finance Model", type: "document", folder: "Project Finance", content: `PROJECT FINANCE MODEL — [PROJECT NAME]\nCapacity: [XX] MW  |  COD: [Date]  |  Contract life: [XX] years\nCurrency: [USD]  |  Model date: [Date]\n\nCAPITAL STRUCTURE\nTotal project cost:          $[Amount]\n  – EPC (construction):      $[Amount]  ([$/W or $/kWh])\n  – Development costs:       $[Amount]\n  – Financing costs:         $[Amount]\n  – Working capital:         $[Amount]\nDebt (Tax Equity / Debt):    $[Amount]  ([%] of total)\nEquity:                      $[Amount]  ([%] of total)\n\nDEBT TERMS\nLender: [Name]  |  Loan type: [Construction + term / Tax equity]\nRate: [X.X%] fixed / [SOFR + X.Xbps]  |  Tenor: [XX] years\nDSCR minimum: [X.Xx]  |  LLCR: [X.Xx]\n\nREVENUE\nPPA price: $[XX]/MWh  |  PPA buyer: [Offtaker name]\nPPA term: [XX] years  |  Escalator: [X%/year]\nMerchant tail: [Post-PPA assumptions]\n\nRETURN METRICS\nProject IRR: [%]  |  Equity IRR: [%]\nProject NPV: $[Amount]  |  DSCR (average): [X.Xx]\nPayback period: [X] years\n\nINVESTMENT TAX CREDITS (ITC / PTC)\nITC: [30]% of eligible basis under IRA  |  Est. value: $[Amount]\nPTC: $[XX/MWh] for [XX] years  |  Est. value: $[Amount]\nTax equity structure: [Sale-leaseback / Partnership flip / Inverted lease]` },
    { name: "Permitting & Regulatory Tracker", type: "document", folder: "Regulatory & Permits", content: `PERMITTING & REGULATORY TRACKER — [PROJECT NAME]\nJurisdiction: [State / Country]  |  AHJ: [Authority Having Jurisdiction]\nPermitting consultant: [Name, firm]\n\nFEDERAL PERMITS\n□ NEPA review (if federal land / nexus)  |  Status: [Not started / In progress / Complete]\n□ FAA determination (if wind)  |  Status:\n□ FCC coordination  |  Status:\n□ Army Corps of Engineers (if wetlands)  |  Status:\n□ Bald & Golden Eagle Protection Act  |  Status:\n\nSTATE PERMITS\n□ State environmental permit  |  Agency: [Name]  |  Status:\n□ State siting certificate (if required)  |  Agency: [Name]  |  Status:\n□ Air quality permit (if combustion)  |  Status:\n□ Water rights (if applicable)  |  Status:\n\nLOCAL PERMITS\n□ Conditional use permit (CUP)  |  Status:\n□ Grading / construction permit  |  Status:\n□ Building permit  |  Status:\n□ Stormwater / erosion control  |  Status:\n\nGRID INTERCONNECTION\nApplication submitted: [Date]  |  ISO/RTO: [MISO / PJM / CAISO / ERCOT / etc.]\nStudy phase: [System impact / Facilities / Construction]\nInterconnection agreement signed: [Date]  |  Queue position: [#]\n\nCOMPLIANCE\n□ Annual compliance report due: [Date]\n□ Environmental monitoring plan active\n□ Community benefit agreement: [Yes / No]` },
    { name: "PPA & Offtaker Strategy", type: "document", folder: "Regulatory & Permits", content: `POWER PURCHASE AGREEMENT (PPA) STRATEGY — [PROJECT NAME]\n\nOFFTAKER TARGET PROFILE\nType: □ Utility □ Corporate (C&I) □ Municipality □ Merchant\nCredit rating target: [Investment grade / BBB+ or better]\nTerm: [10 / 15 / 20 / 25 years]\n\nPPA STRUCTURE\nType: □ Fixed price  □ Indexed  □ Proxy revenue swap  □ Virtual PPA\nPrice: $[XX]/MWh  |  Escalator: [X%/year / fixed]\nSettlement: [Physical delivery / Financial swap]\nCurtailment provisions: [Economic dispatch / Unconditional]\n\nOFFTAKER PIPELINE\nOffTaker 1: [Name]  |  Type: [Corp / Utility]  |  Credit: [Rating]  |  MW requested: [#]  |  Status: [LOI / NDA / Negotiation]\nOfftaker 2: [Name]  |  Type: [Type]  |  Credit: [Rating]  |  MW: [#]  |  Status:\nOfftaker 3: [Name]  |  Type: [Type]  |  Credit: [Rating]  |  MW: [#]  |  Status:\n\nPPA TIMELINE\n□ NDA / CDA executed\n□ Term sheet issued\n□ Credit review complete\n□ PPA negotiation (target [X] weeks)\n□ Legal review\n□ Execution\n□ CP satisfaction (financial close, commercial ops)\n\nRISK CONSIDERATIONS\nBasis risk: [How addressed]\nPrice cannibalization risk: [Market saturation in congested zone]\nCurtailment risk: [Contractual protections]` },
    { name: "EPC & Construction Plan", type: "document", folder: "Operations & Maintenance", content: `EPC & CONSTRUCTION PLAN — [PROJECT NAME]\nEPC contractor: [Name]  |  Contract type: [Fixed price lump sum / Cost-plus]\nConstruction start: [Date]  |  COD: [Date]  |  Duration: [XX months]\n\nKEY MILESTONES\n□ EPC contract executed\n□ Permits received — all major\n□ Procurement: major equipment ordered\n  – [Panels / Turbines / Inverters / Batteries] — Supplier: [Name]  |  Lead time: [Weeks]\n□ Site mobilization\n□ Civil / grading complete\n□ Foundation / racking / tower installation\n□ Electrical installation\n□ Equipment commissioning\n□ Grid connection / energization\n□ Mechanical completion\n□ Performance testing / acceptance test\n□ Commercial operations date (COD)\n\nBUDGET TRACKING\nEPC contract value: $[Amount]\nApproved change orders to date: $[Amount]\nForecasted final cost: $[Amount]\nVariance: $[Amount] ([%])\n\nSAFETY\nEPC safety plan: [In place]\nIncident rate target: [0 recordable incidents]\nSafety meetings: [Weekly]\n\nOWNER'S ENGINEER\nFirm: [Name]  |  Scope: [Construction monitoring / independent testing]` },
    { name: "O&M & Asset Management Plan", type: "document", folder: "Operations & Maintenance", content: `O&M & ASSET MANAGEMENT PLAN — [PROJECT NAME]\nCOD: [Date]  |  Asset life: [25–30] years\nO&M model: □ Self-perform  □ Third-party O&M provider\nO&M provider (if 3rd party): [Name]  |  Contract: $[Amount]/year\n\nO&M SCOPE\nPreventive maintenance:\n• [Panels / Inverters / Trackers / Turbine blades / Battery modules] — [Frequency]\nCorrective maintenance: [Contractor response time SLA: [X] hours]\nVegetation management: [Frequency]\nSite security: [Monitoring method]\n\nMONITORING\nSCADA platform: [Name]  |  Data interval: [1 min / 15 min]\nPerformance ratio target: [%]\nAvailability target: [%]\nAlarm response: [24/7 NOC — provider: [Name]]\n\nKEY PERFORMANCE INDICATORS\nAnnual generation target: [MWh]\nCapacity factor: [%]\nSystem availability: [%]\nDegradation rate: [0.5%/year]\n\nWARRANTIES & INSURANCE\nEquipment warranties: [Manufacturer — [X] years]\nO&M contractor liability: $[Amount]\nProperty insurance: [Provider, coverage amount]\nBusiness interruption: [Provider, coverage]\n\nANNUAL BUDGET (Year 1)\nO&M labor: $[Amount]\nParts & consumables: $[Amount]\nLand lease: $[Amount]\nInsurance: $[Amount]\nLegal/admin: $[Amount]\nTotal O&M: $[Amount]  (= $[XX]/kW-year)` },
    { name: "Stakeholder & Partnership Map", type: "document", folder: "Partnerships", content: `STAKEHOLDER & PARTNERSHIP MAP — [PROJECT NAME]\n\nINTERNAL TEAM\nProject developer: [Name]  |  Role: [Overall lead]\nProject finance: [Name]  |  Role: [Debt / equity structuring]\nEnvironmental & permitting: [Name]  |  Role: [Agency liaison]\nEngineering lead: [Name]  |  Role: [Technical oversight]\nLegal counsel: [Firm, attorney]\n\nKEY EXTERNAL STAKEHOLDERS\nLandowner(s): [Name]  |  Relationship: [Lease / Option]  |  Contact: [Name]\nUtility / ISO: [Name]  |  Contact: [Name, department]\nLocal municipality: [County / City]  |  Planning contact: [Name]\nState energy agency: [Name]  |  Program: [Incentive / RPS]\nFederal: [DOE / BOEM / BLM — if applicable]  |  Contact: [Name]\n\nKEY PARTNERS\nEPC contractor: [Name]  |  Scope: [Full EPC / Civil / Electrical]\nEquipment supplier: [Name]  |  Equipment: [Panels / Turbines / Inverters]\nO&M contractor: [Name]  |  Contract: $[Amount]\nLenders: [Name, name]  |  Role: [Senior debt / Tax equity]\nOfftaker: [Name]  |  Contract: [PPA terms]\nInsurance: [Broker / underwriter]\n\nCOMMUNITY ENGAGEMENT\nLocal hire commitment: [%] of jobs\nCommunity benefit fund: $[Amount]/year\nPublic meetings: [Cadence]` },
    { name: "Impact & ESG Report", type: "document", folder: "Partnerships", content: `IMPACT & ESG REPORT — [PROJECT NAME]\nReporting period: [Year]  |  Framework: [GRI / TCFD / CDP / Custom]\n\nENVIRONMENTAL IMPACT\nAnnual clean energy generated: [MWh]\nCO2 emissions avoided: [Metric tons/year]\nEquivalent cars off the road: [#]\nHomes powered: [#]\nWater saved vs. fossil fuel equivalent: [Gallons/year]\nLand use: [Acres] — dual use (agrivoltaics / pollinator habitat): [Yes/No]\n\nSOCIAL IMPACT\nConstruction jobs created: [#]\nPermanent operations jobs: [#]\nLocal hire rate: [%]\nCommunity benefit payments: $[Amount]\nEducation/STEM partnerships: [Programs]\nLandowner revenue (lease): $[Amount]/year\n\nGOVERNANCE\nBoard composition: [# members, diversity]\nEthics policy: [In place / Reference URL]\nSupply chain: [Panel supply chain audit — UFLPA compliance]\nAnti-corruption: [Policy in place]\n\nSDG ALIGNMENT\n□ SDG 7 — Affordable and Clean Energy\n□ SDG 8 — Decent Work and Economic Growth\n□ SDG 13 — Climate Action\n□ SDG 15 — Life on Land (biodiversity)\n\nFORWARD COMMITMENTS\n[Year+1]: [Commitment]\n[Year+3]: [Commitment]\n[Year+5]: [Commitment]` },
    { name: "Go-to-Market & Business Development", type: "document", folder: "Partnerships", content: `GO-TO-MARKET & BUSINESS DEVELOPMENT — [PROJECT / COMPANY NAME]\n\nTARGET MARKET\nPrimary: [Utility-scale / C&I / Community solar / Distributed / Municipal]\nGeography: [US markets / International]\nCustomer type: [Utilities / Corporations / REITs / Municipalities / Homeowners]\n\nCOMPETITIVE LANDSCAPE\n[Competitor 1]: [Size, positioning, differentiation vs. us]\n[Competitor 2]: [Size, positioning]\nOur differentiation: [Cost / Speed to market / Technology / Geographic focus / Team]\n\nDEVELOPMENT PIPELINE\nProject: [Name]  |  MW: [#]  |  Stage: [Early / Mid / Late]  |  Target COD: [Year]\nProject: [Name]  |  MW: [#]  |  Stage: [Stage]  |  Target COD: [Year]\nTotal pipeline: [# projects] / [MW]\n\nCAPITAL RAISE\nCurrent raise: [Amount] — [Equity / Project finance / Grant]\nTarget investors: [Infrastructure funds / YieldCos / Strategics / Family offices]\nUse of proceeds: [Development expenses / Land control / Team]\n\nPARTNERSHIP STRATEGY\n[EPC partners — why, who]\n[Offtaker relationships — broker vs. direct]\n[Financial partners — existing relationships]\n\nSALES PROCESS\nLead source: [RFP responses / Inbound / Broker / Existing relationship]\nDeal cycle: [X months from site control to PPA]\nDecision makers: [VP Sustainability / CFO / Energy procurement team]` },
  ],

  "Biotech / Life Sciences": [
    { name: "Research & Development Plan", type: "document", folder: "R&D", content: `RESEARCH & DEVELOPMENT PLAN — [PROJECT NAME]\nTherapeutic area / Application: [Oncology / Neurology / Diagnostics / Medical device / Agbio / etc.]\nModality: [Small molecule / Biologic / Cell therapy / Gene therapy / Diagnostic / Device]\nStage: □ Discovery  □ Lead optimization  □ Preclinical  □ IND-enabling  □ Phase I  □ Phase II  □ Phase III\n\nSCIENTIFIC RATIONALE\n[What biological problem are we solving? What is the validated target / mechanism of action?]\n\nPROGRAM OVERVIEW\nLead compound / product: [Name]\nTarget: [Protein / Pathway / Biomarker]\nMechanism of action (MoA): [Describe in plain language]\nHypothesis: [What we believe will happen in the clinic / market]\n\nR&D MILESTONES\n□ Target identification & validation  |  By: [Date]\n□ Lead series identified  |  By: [Date]\n□ Lead optimization complete  |  By: [Date]\n□ Candidate selection (IND candidate)  |  By: [Date]\n□ GLP tox studies complete  |  By: [Date]\n□ IND / CTA submission  |  By: [Date]\n□ Phase I first patient dosed  |  By: [Date]\n\nKEY EXPERIMENTS (next 90 days)\n1. [Experiment] — Hypothesis: [What are we testing?] — Readout: [Date]\n2. [Experiment] — Hypothesis: — Readout:\n3. [Experiment] — Hypothesis: — Readout:\n\nRESOURCES\nInternal team: [# scientists, roles]\nCROs: [Name, scope]\nKey collaborators / KOLs: [Name, institution]\nLaboratory equipment: [Key instruments]` },
    { name: "Target Product Profile (TPP)", type: "document", folder: "R&D", content: `TARGET PRODUCT PROFILE (TPP) — [PRODUCT NAME]\nDate: [Date]  |  Version: [#]  |  Stage: [Preclinical / Phase I / etc.]\n\nINDICATION\nPrimary indication: [Disease / Condition]\nSecondary indications (potential): [List]\nPatient population: [Demographics, disease characteristics, line of therapy]\n\nTPP TABLE\n\nAttribute               Minimum Acceptable         Target / Ideal\n──────────────────────────────────────────────────────────────────\nEfficacy (primary):    [e.g., ORR > 30%]           [ORR > 50%]\nEfficacy (secondary):  [e.g., PFS > 4 mo]          [PFS > 8 mo]\nSafety profile:        [Grade ≤ 2 key AEs]         [Better than SoC]\nRoute of admin:        [IV / SC / Oral]             [Oral preferred]\nDosing frequency:      [Weekly]                     [Monthly]\nPatient selection:     [Biomarker-selected]         [Pan-tumor]\nFormulation:           [Room temp stable]           [Lyophilized]\nProduction (COGS):     [< $X,000/unit]             [< $XX/unit]\n\nCOMPETITIVE BENCHMARK\n[SoC / Comparator drug] — [Key attributes]\nOur advantage: [Describe differentiation]\n\nCOMMERCIAL HYPOTHESIS\nTarget price: $[XX,000]/year  |  Addressable patients: [#]/year in US\nPeak revenue estimate: $[Amount]/year  |  Patent protection: [Year]` },
    { name: "Regulatory Strategy", type: "document", folder: "Regulatory (FDA/CE)", content: `REGULATORY STRATEGY — [PRODUCT NAME]\nRegulatory pathway: □ IND/NDA  □ BLA  □ 510(k)  □ De Novo  □ PMA  □ CE Mark  □ EUA\nLead market: [US / EU / JP / CN]\nRegulatory counsel: [Firm, name]\n\nUS FDA PATHWAY\nCenter: □ CDER  □ CBER  □ CDRH  □ CFSAN\nDesignation(s) sought:\n□ Fast Track  □ Breakthrough Therapy  □ Accelerated Approval\n□ Priority Review  □ Orphan Drug (indication: [rare disease, < 200k patients])\n□ QIDP / GAIN Act (antimicrobial)\n\nPRE-IND / PRE-SUBMISSION MEETINGS\n□ Type B Pre-IND meeting scheduled  |  Date: [Date]\nKey questions to ask FDA:\n1. [Question about nonclinical package adequacy]\n2. [Question about Phase I design / dose escalation]\n3. [Question about biomarker strategy]\n\nIND SUBMISSION PLAN\nTarget IND submission date: [Date]\nClinical program: [Phase I design — SAD/MAD / PK-PD]\nNonclinical package status:\n□ Pharmacology  □ ADME  □ GLP tox (species: [Species])\n□ Safety pharmacology  □ Genotoxicity\n\nEU PATHWAY\nDesignation sought: □ ATMP  □ Orphan  □ Prime  □ Conditional MA\nEU regulatory counsel: [Name]\n\nKEY REGULATORY MILESTONES\n□ Pre-IND meeting  |  [Date]\n□ IND submitted  |  [Date]\n□ End-of-Phase II meeting  |  [Date]\n□ NDA / BLA / PMA submission  |  [Date]\n□ PDUFA date / approval  |  [Date]` },
    { name: "Clinical Trial Design", type: "document", folder: "Clinical", content: `CLINICAL TRIAL DESIGN — [STUDY NAME / PROTOCOL NUMBER]\nPhase: □ I  □ I/II  □ II  □ III  □ IV  |  Indication: [Indication]\nSponsor: [Company name]  |  CRO: [Name]\nEstimated start: [Date]  |  Estimated completion: [Date]\n\nSTUDY OBJECTIVES\nPrimary: [e.g., Assess safety and MTD of [drug] in [population]]\nSecondary: [e.g., Characterize PK, assess preliminary efficacy signals]\nExploratory: [Biomarker analysis, PD assessment]\n\nDESIGN\nStudy type: □ Open-label  □ Randomized  □ Blinded  □ Crossover  □ Adaptive\nDose escalation (Phase I): [3+3 / Accelerated titration / BOIN / mTPI-2]\nDose levels: [List planned doses]\nExpansion cohorts (if applicable): [Tumor types / indications]\n\nPATIENT POPULATION\nKey inclusion criteria:\n• [Age range]\n• [Confirmed diagnosis, line of therapy]\n• [ECOG / Karnofsky performance status]\nKey exclusion criteria:\n• [Prior treatment restrictions]\n• [Organ function requirements]\n\nSITES & ENROLLMENT\nSite count (target): [#]  |  Countries: [List]\nEnrollment target: [# patients]  |  Enrollment rate: [#/month]\nPlanned CRO: [Name]  |  Data management: [CTMS: Name]\n\nENDPOINTS\nPrimary: [e.g., MTD / ORR / PFS at X months]\nSecondary: [DOR / OS / safety / PK]\nBiomarkers: [ctDNA / IHC / genomic profiling]` },
    { name: "IP & Patent Strategy", type: "document", folder: "IP & Patents", content: `IP & PATENT STRATEGY — [COMPANY / PRODUCT NAME]\nPatent counsel: [Firm, attorney]  |  IP strategy date: [Date]\n\nIP PORTFOLIO OVERVIEW\nPatent 1:\nTitle: [Title]\nFiling date: [Date]  |  Priority date: [Date]\nApplication #: [#]  |  Status: [Pending / Granted]\nCoverage: [Composition of matter / Method of treatment / Formulation / Manufacture]\nKey jurisdictions: [US / EU / JP / CN / CA / AU]\nExpected patent expiry: [Year] (+ PTE/SPC potential: [Yes/No])\n\nPatent 2:\nTitle: [Title]\n[Same structure]\n\nFREEDOM TO OPERATE (FTO)\nFTO search conducted: [Yes — by: [Firm] / Pending]\nKey third-party patents identified: [# — see attached analysis]\nFTO risks: [Low / Medium / High — rationale]\nMitigation: [Design around / license / challenge]\n\nTRADE SECRETS\nKey trade secrets: [Manufacturing process / Formulation know-how / Clinical data]\nProtection measures: [NDAs / Access controls / Employee agreements]\n\nLICENSING STRATEGY\nIn-licensing needs: [What IP do we need access to?]\nOut-licensing opportunities: [Territories or indications we won't pursue]\nPartnering / collaboration IP terms: [Standard approach]\n\nWORTH NOTING\nOrphan drug exclusivity: [7 years US / 10 years EU if granted]\nBiological exclusivity: [12 years US reference product exclusivity]\nData exclusivity: [5 years US NME / 3 years new clinical data]` },
    { name: "Funding & Partnerships Strategy", type: "document", folder: "Business & Funding", content: `FUNDING & PARTNERSHIPS STRATEGY — [COMPANY NAME]\n\nFUNDING HISTORY\nFounding / bootstrapped: $[Amount]  |  Date: [Date]\nSeed / Angel: $[Amount]  |  Investors: [Names]  |  Date: [Date]\nSeries A: $[Amount]  |  Lead: [Name]  |  Date: [Date]\n\nCURRENT RAISE\nRound: [Series A / B / Crossover / IPO-prep]\nAmount: $[Amount]  |  Target close: [Date]\nLead investor: [Name / TBD]\nValuation: $[Amount] pre-money\nUse of proceeds:\n[%] Clinical program through [Phase X, readout]\n[%] CMC / Manufacturing scale-up\n[%] Regulatory submissions\n[%] Team build-out\n[%] G&A + runway\n\nNON-DILUTIVE FUNDING\n□ SBIR/STTR grants — applied: [Yes / No]  |  Grants received: $[Amount]\n□ NIH / BARDA / DARPA grants  |  Amount: $[Amount]\n□ Regional/state innovation grants\n□ Charitable foundations: [Name, amount]\n\nPARTNERSHIP STRATEGY\nTarget partners: [Big pharma / Mid-size / Specialty]\nDeal structure preferred: [Co-development / Out-license / Platform partnership]\nGeographies to partner for: [Ex-US / Asia / Global]\nKey relationships: [KOLs, BD contacts at target companies]\n\nVALUATION INFLECTION POINTS\n1. [Milestone — e.g., IND clearance] → Est. value step-up: [X]x\n2. [Milestone — e.g., Phase II POC data] → Est. step-up: [X]x\n3. [Milestone — e.g., Phase III initiation] → Est. step-up: [X]x` },
    { name: "Manufacturing & CMC Plan", type: "document", folder: "R&D", content: `MANUFACTURING & CMC PLAN — [PRODUCT NAME]\nProduct type: [Small molecule / Biologic / Cell therapy / Device]\nDrug substance (DS) manufacturer: [CDMO name]  |  Location: [City, Country]\nDrug product (DP) manufacturer: [CDMO name]  |  Location: [City, Country]\n\nCURRENT MANUFACTURING STATUS\nProcess development stage: [Discovery / Lead opt / GMP readiness / Phase I supply]\nBatch size (current): [mg / g / L]  |  Scale needed for Phase I: [Amount]\nYield: [%]  |  Purity: [%]\n\nGMP READINESS MILESTONES\n□ CDMO selected  |  Date: [Date]\n□ Technology transfer complete  |  Date:\n□ GMP batch produced  |  Date:\n□ Release testing complete  |  Date:\n□ Stability studies initiated  |  Date:\n□ Phase I clinical supply ready  |  Date:\n\nANALYTICAL DEVELOPMENT\nRelease assays: [List key assays]\nStability protocol: [Real-time / Accelerated — ICH conditions]\nReference standard established: [Yes / No]\nComparative characterization (biologics): [Yes / No]\n\nSUPPLY CHAIN\nStarting materials / raw materials: [Sources, qualification]\nSingle-use vs. stainless: [Choice and rationale]\nCold chain requirements: [°C requirement]\n\nCMC REGULATORY PLAN\n□ IND Module 3 (drug substance + drug product sections)\n□ Spec setting based on batch history\n□ Primary container closure validation\n□ Validation batches (Phase III / NDA): [Timeline]` },
    { name: "Board & Investor Update Template", type: "document", folder: "Business & Funding", content: `BOARD & INVESTOR UPDATE — [COMPANY NAME]\nDate: [Month Year]  |  Prepared by: [CEO / CFO]\nConfidential — For board and investor use only\n\nHIGHLIGHT SUMMARY\n[2–3 bullet points on the most important developments this period]\n\nPIPELINE STATUS\nProgram: [Name]  |  Stage: [Phase X]  |  Status: [On track / Delayed / Ahead]\nKey results: [Any data readouts, publications, regulatory interactions]\nNext milestone: [What, when]\n\nProgram: [Name]  |  Stage: [Stage]  |  Status: [Status]\nKey results: [Summary]\nNext milestone: [What, when]\n\nFINANCIAL SUMMARY\nCash on hand: $[Amount]  |  As of: [Date]\nMonthly burn rate: $[Amount]  |  Runway: [# months]\nYear-to-date spend: $[Amount] vs. budget: $[Amount]  |  Variance: [%]\nRevenue / milestones received: $[Amount]\n\nBUSINESS DEVELOPMENT\n[Partnerships, collaborations, licensing discussions — status]\n\nHIRING\nNew hires: [Name, role, start date]\nOpen roles: [# open positions, critical hires]\n\nASK OF THE BOARD\n1. [Decision needed / input requested]\n2. [Connection requested — investor intros, KOL]\n\nLOOK AHEAD (next 90 days)\n1. [Key milestone]\n2. [Key milestone]\n3. [Key milestone]` },
  ],

  "Sports & Fitness": [
    { name: "Methodology & Training Philosophy", type: "document", folder: "Programs & Methodology", content: `TRAINING METHODOLOGY & PHILOSOPHY — [BUSINESS / PROGRAM NAME]\n\nCORE PHILOSOPHY\n[What do you believe about fitness, performance, and health that drives everything you do?]\n\nTRAINING PRINCIPLES\n1. [Principle — e.g., Progressive overload]\n   [Explain how you apply this in your programs]\n2. [Principle — e.g., Recovery as training]\n   [Explanation]\n3. [Principle — e.g., Individualization]\n   [Explanation]\n4. [Principle]\n   [Explanation]\n\nMETHODOLOGY OVERVIEW\nStyle: [Strength & conditioning / HIIT / Functional / Sport-specific / Rehab / Yoga / etc.]\nEquipment used: [Barbell / Dumbbells / Kettlebells / Bodyweight / Machines / Bands / etc.]\nSession structure: [Warm-up / Main work / Accessory / Cool-down — timing]\nProgression model: [Linear / Undulating / Block / etc.]\n\nDIFFERENTIATION\n[What makes your approach different from other coaches, gyms, or programs in your niche?]\n\nCLIENT RESULTS (examples)\n• [Client type] — [Result achieved in X timeframe]\n• [Client type] — [Result achieved]\n• [Client type] — [Result achieved]\n\nSCIENCE & CREDENTIALS\nCertifications: [NSCA-CSCS / NASM / ACE / CF-L2 / ISSA / etc.]\nEducation: [Degree in kinesiology / exercise science]\nResearch basis: [Key principles or studies that inform your approach]` },
    { name: "Program Design Template", type: "document", folder: "Programs & Methodology", content: `PROGRAM DESIGN — [PROGRAM NAME]\nDuration: [X weeks]  |  Frequency: [X days/week]  |  Level: [Beginner / Intermediate / Advanced]\nGoal: [Fat loss / Muscle gain / Strength / Endurance / Sport performance / General fitness]\nEquipment: [What's required]\n\nWEEK 1–[X] — PHASE 1: [Phase Name]\nObjective: [What this phase builds — e.g., base strength, work capacity]\n\nDAY 1 — [Primary focus]\nWarm-up ([10] min):\n• [Exercise] — [Sets × Reps / Duration]\n• [Exercise] — [Sets × Reps / Duration]\n\nMain work:\nA1. [Exercise] — [Sets] × [Reps] @ [% 1RM / RPE / Weight] — Rest: [Xsec/min]\nA2. [Superset partner] — [Sets] × [Reps] — Rest: [Xsec]\nB1. [Exercise] — [Sets] × [Reps] — Rest: [Xsec]\nB2. [Exercise] — [Sets] × [Reps] — Rest: [Xsec]\nC. [Finisher / Conditioning] — [Format — AMRAP / EMOM / Time cap]\n\nCool-down ([10] min):\n• [Mobility work / stretching]\n\nDAY 2 — [Primary focus]\n[Same structure]\n\nPROGRESSION RULES\nWeek-over-week: [How to add weight or reps each week]\nDeload: [Week X is a deload — reduce volume by [%] or intensity]\n\nCOACHING NOTES\n[Key teaching points, modifications, watch-outs for clients]` },
    { name: "Client Onboarding & Assessment", type: "document", folder: "Business & Clients", content: `CLIENT ONBOARDING & ASSESSMENT — [BUSINESS NAME]\n\nINTAKE QUESTIONNAIRE\nFull name: _______________  |  Age: ___  |  Gender: ___\nHeight: ___  |  Weight: ___  |  Goal weight / body comp: ___\n\nPRIMARY GOAL\n□ Lose fat  □ Build muscle  □ Improve performance  □ General health  □ Injury rehab  □ Event prep: [Event]\n\nCURRENT ACTIVITY LEVEL\n□ Sedentary  □ 1–2x/week  □ 3–4x/week  □ 5+x/week\nYears of training experience: ___\nSports background: ___\n\nHEALTH HISTORY\nInjuries or surgeries: [List]\nCurrent pain or limitations: [List]\nMedical conditions: [List]\nMedications: [List]\nDoctor clearance received: □ Yes  □ No — required before starting\n\nNUTRITION\nCurrent diet style: [Describe]\nMeals per day: ___  |  Water intake: ___\nSupplements: [List]\n\nFITNESS ASSESSMENT (to be done in first session)\nMovement screen: [FMS / Custom assessment]\nBenchmarks recorded:\n• Push-ups (max): ___\n• Squat depth / form: ___\n• Plank hold (time): ___\n• Resting HR: ___  |  BP: ___\n• [Sport-specific test]: ___\n\nGOALS & COMMITMENTS\nSpecific outcome goal: ___\nTimeline: ___\nCommitment: [Sessions/week, coaching calls, check-ins]\nSignature: _______________  Date: ___` },
    { name: "Nutrition Framework", type: "document", folder: "Nutrition & Wellness", content: `NUTRITION FRAMEWORK — [BUSINESS NAME / PROGRAM NAME]\n\nPHILOSOPHY\n[What is your nutritional philosophy? What do you believe about food and performance?]\n\nMACRONUTRIENT GUIDELINES (adjust by client goal)\nFat loss:\n• Calories: [Bodyweight × 12–14 kcal]\n• Protein: [0.8–1g / lb bodyweight]\n• Carbs: [Moderate — [%] of calories]\n• Fat: [Remaining — minimum 20% of calories]\n\nMuscle gain:\n• Calories: [Bodyweight × 16–18 kcal]\n• Protein: [0.8–1g / lb bodyweight]\n• Carbs: [Higher — [%] of calories]\n• Fat: [Remaining]\n\nMEAL TIMING\nPre-workout: [Meal or snack [X–X hours] before — [composition]]\nPost-workout: [Meal within [X hour] — [composition]]\n\nSAMPLE DAILY MEAL PLAN\nBreakfast: [Example meal — [approx. macros]]\nLunch: [Example meal — [approx. macros]]\nDinner: [Example meal — [approx. macros]]\nSnack(s): [Example — [approx. macros]]\n\nHYDRATION\nBaseline: [0.5–1 oz per lb of bodyweight]\nDuring exercise: [Add [16–24 oz] per hour of activity]\nElectrolytes: [When / what to supplement]\n\nSUPPLEMENTS (evidence-based only)\n□ Creatine monohydrate — [3–5g/day]\n□ Caffeine — [3–6mg/kg before training]\n□ Protein powder — [as needed to hit targets]\n□ Vitamin D3 — [2,000–4,000 IU/day]\n□ Omega-3 — [1–3g EPA+DHA/day]\n□ Magnesium — [200–400mg before bed]` },
    { name: "Business & Pricing Model", type: "document", folder: "Business & Clients", content: `BUSINESS & PRICING MODEL — [BUSINESS NAME]\nBusiness type: □ Online coaching  □ In-person personal training  □ Group fitness  □ Gym / Studio  □ Hybrid\n\nSERVICE OFFERINGS\nService 1: [1:1 Online Coaching]\nPrice: $[Amount]/month  |  Deliverables: [Custom program + nutrition + weekly check-in + app access]\nClient limit: [# max]  |  Current clients: [#]\n\nService 2: [In-Person Training]\nPrice: $[Amount]/session  |  Package: [10 sessions for $Amount]\nLocation: [Gym / Client home / Own studio]\n\nService 3: [Group Class]\nPrice: $[Amount]/month or $[Amount]/drop-in  |  Class size: [# max]\nSchedule: [Days/times]\n\nService 4: [Digital Product — Program / Course]\nPrice: $[Amount] (one-time)  |  Format: [PDF / App / Video course]\n\nREVENUE MODEL\nMRR target: $[Amount]\nRevenue mix: [%] coaching / [%] sessions / [%] digital\n\nCAPACITY\nMax monthly revenue at capacity: $[Amount]\nGrowth bottleneck: [Time / Space / Marketing]\n\nPROFIT & LOSS (monthly)\nGross revenue: $[Amount]\nSoftware / tools: ($[Amount])\nGym rent (if applicable): ($[Amount])\nMarketing: ($[Amount])\nNet profit: $[Amount]  ([%] margin)` },
    { name: "Marketing & Social Strategy", type: "document", folder: "Marketing", content: `MARKETING & SOCIAL STRATEGY — [BUSINESS NAME]\n\nBRAND POSITIONING\nWho I serve: [Specific niche — e.g., "busy professionals who want to get strong in 3 days/week"]\nCore promise: [The transformation in one sentence]\nTone of voice: [No-BS / Encouraging / Science-based / High-energy / Calm]\n\nCONTENT PILLARS\n1. [Education] — Training tips, myth-busting, technique videos\n2. [Results / Proof] — Client transformations, before/afters, testimonials\n3. [Behind the scenes] — Your training, business, life\n4. [Selling] — Program launches, free trials, booking link\nRatio: [3:1:1:1 — education:results:BTS:selling]\n\nINSTAGRAM STRATEGY\nPosting frequency: [X posts/week + X stories/day]\nReels focus: [Quick tips / Transformations / Day in life]\nGrowth tactic: [Collabs / Hashtag research / Share-worthy content]\nFollower goal: [# by Date]\n\nTIKTOK STRATEGY\nPosting frequency: [X videos/week]\nContent style: [Workout videos / Quick tips / Storytelling]\n\nEMAIL LIST\nList size: [# subscribers]  |  Growth strategy: [Lead magnet — free program]\nEmail cadence: [1–2x/week]\nWelcome sequence: [# emails over # days]\n\nCLIENT ACQUISITION\nPrimary method: [Instagram DMs / Referrals / TikTok / Paid ads]\nLead magnet: [Free 7-day plan / Free training video series]\nDiscovery call: [Yes — [X] min via Zoom]` },
    { name: "Recovery & Wellness Protocols", type: "document", folder: "Nutrition & Wellness", content: `RECOVERY & WELLNESS PROTOCOLS — [BUSINESS NAME]\n\nPHILOSOPHY\n[Recovery is training. How you approach the recovery piece of the equation.]\n\nSLEEP\nTarget: [7–9 hours/night]\nKey habits:\n□ Consistent wake time (even weekends)\n□ Dark, cool room (65–68°F)\n□ No screens [30–60 min] before bed\n□ No caffeine after [2pm]\n□ [Optional: magnesium glycinate, melatonin protocol]\n\nACTIVE RECOVERY\nTools:\n• Foam rolling / self-myofascial release: [Frequency, areas to target]\n• Stretching / mobility: [Protocol — see program notes]\n• Light walk or zone 2 cardio on rest days: [Duration, intensity target: < [130] BPM]\n• Cold exposure (optional): [Contrast shower / cold plunge — protocol]\n• Sauna (optional): [Protocol if available]\n\nLOAD MANAGEMENT\nHRV monitoring: [App: WHOOP / Oura / HRV4Training]\nHRV < baseline: [Reduce intensity, emphasize recovery day]\nSubjective readiness tracking: [1–10 scale at session start]\n\nDELOAD PROTOCOL\nFrequency: [Every [4th] week]\nDeload method: [Reduce volume by [40%] / Keep intensity, drop volume / Full rest week]\n\nMINDSET & STRESS MANAGEMENT\n[Breathing protocols / meditation / journaling recommendations]\n[How stress outside the gym affects recovery — educate clients]` },
    { name: "Client Progress Tracking", type: "document", folder: "Business & Clients", content: `CLIENT PROGRESS TRACKING — [CLIENT NAME] — [COACH NAME]\nStart date: [Date]  |  Program: [Name]  |  Duration: [Weeks]\nGoal: [Specific outcome]\n\nBASELINE MEASUREMENTS (Week 0)\nWeight: [X lbs / kg]  |  Body fat %: [%]\nWaist: [X in/cm]  |  Hip: [X in]  |  Chest: [X in]  |  Arms: [X in]\nPhotos taken: □ Front  □ Side  □ Back\n\nBENCHMARK LIFTS (Week 0)\n• Squat [1RM / 5RM]: [Weight]\n• Deadlift [1RM / 5RM]: [Weight]\n• Bench press [1RM / 5RM]: [Weight]\n• Pull-ups (max reps): [#]\n• [Sport-specific test]: [Score]\n\nWEEKLY CHECK-IN LOG\nWeek [#]:\nWeight: [X]  |  Energy: [1–10]  |  Sleep quality: [1–10]\nAdherence to program: [%]  |  Adherence to nutrition: [%]\nNotes: [Client's reflections, challenges, wins]\nCoach response: [Feedback, adjustments]\n\nPROGRESS PHOTOS LOG\nWeek 4: □ Taken and shared\nWeek 8: □ Taken and shared\nWeek 12: □ Taken and shared\n\nMID-PROGRAM REASSESSMENT (Week [X])\n[Repeat all baseline measurements]\nProgress vs. goal: [On track / Behind / Ahead]\nProgram adjustments: [Any changes to training or nutrition]\n\nFINAL RESULTS\n[Compare to baseline — weight change, measurement changes, strength gains]\nTestimonial: □ Requested  |  Case study: □ Approved by client` },
  ],

  "Travel & Hospitality": [
    { name: "Brand & Concept Overview", type: "document", folder: "Marketing & Brand", content: `BRAND & CONCEPT OVERVIEW — [BRAND / PROPERTY NAME]\nType: □ Boutique hotel  □ Tour operator  □ Travel agency  □ Vacation rental  □ Experience brand  □ Travel tech\nTarget market: [Luxury / Adventure / Eco / Cultural / Wellness / Family / Business]\nPrimary geography: [Where you operate or focus]\n\nBRAND STORY\n[What is the founding story? What gap or passion drives this brand? Why does it deserve to exist?]\n\nBRAND IDENTITY\nVoice: [Inspiring / Luxe / Adventurous / Warm / Expert]\nVisual style: [Minimalist / Rich / Natural / Urban / Artisanal]\nCore values: [3–5 values the brand lives by]\n\nTARGET CUSTOMER\nPrimary persona: [Name, age, income, travel style]\nWhat they're seeking: [The transformation or experience they want]\nWhat frustrates them: [About existing options]\n\nPRODUCT / EXPERIENCE OFFERING\n[Property 1 / Tour 1 / Service 1]: [Description, price, key differentiators]\n[Property 2 / Tour 2 / Service 2]: [Description, price, key differentiators]\n\nCOMPETITIVE POSITION\n[Comp 1]: [Their positioning vs. ours]\n[Comp 2]: [Their positioning vs. ours]\nOur unfair advantage: [What makes us irreplaceable?]\n\nKEY MARKETS (origin)\nMarket 1: [Country/city]  |  % of bookings: [%]\nMarket 2: [Country/city]  |  % of bookings: [%]` },
    { name: "Destination & Experience Guide", type: "document", folder: "Destinations & Itineraries", content: `DESTINATION GUIDE — [DESTINATION NAME]\nRegion: [Country / Region]  |  Best season: [Months]  |  Ideal stay: [X–X days]\nType: □ Beach  □ Mountain  □ City  □ Cultural  □ Safari  □ Arctic  □ Island  □ Desert\n\nWHY THIS DESTINATION\n[Compelling case for this destination — what makes it special, what can you find here that you can't find anywhere else?]\n\nOUR EXPERIENCE HERE\nExperience 1: [Name] — [Short description] — [Duration] — From $[Price]\nExperience 2: [Name] — [Short description] — [Duration] — From $[Price]\nExperience 3: [Name] — [Short description] — [Duration] — From $[Price]\n\nPRACTICAL INFORMATION\nVisas required: [For [passport] citizens: [requirements]]\nBest access: [Nearest airport / transport]\nLocal currency: [Name / exchange rate guidance]\nHealth requirements: [Vaccinations / medications]\nSafety level: [Low risk / Exercise caution / Specific areas to avoid]\n\nACCOMMODATION RECOMMENDATIONS\nLuxury: [Property name] — [Why we love it] — From $[XX]/night\nMid-range: [Property name] — From $[XX]/night\nBoutique/unique: [Property name] — From $[XX]/night\n\nBEST EXPERIENCES BY INTEREST\nAdventure: [List top activities]\nCulture: [Museums, temples, markets, etc.]\nFood & drink: [Must-try restaurants, dishes, local drinks]\nWellness: [Spas, retreat centers, natural hot springs]` },
    { name: "Itinerary Template", type: "document", folder: "Destinations & Itineraries", content: `ITINERARY — [TOUR / TRIP NAME]\nDuration: [X days / X nights]  |  Group size: [Min–Max]\nDifficulty: [Easy / Moderate / Challenging]  |  From: $[Amount] per person\n\nOVERVIEW\n[1–2 paragraph narrative description of the journey — sell the experience]\n\nDAY 1 — [Title e.g., "Arrival & First Impressions"]\nMorning: [Activity / arrival / transfer]\nAfternoon: [Experience — describe vividly]\nEvening: [Dinner / welcome event]\nAccommodation: [Property name]  |  Meals included: [B / L / D]\n\nDAY 2 — [Title]\nMorning: [Description]\nAfternoon: [Description]\nEvening: [Description]\nAccommodation: [Property]  |  Meals: [B/L/D]\n\nDAY 3 — [Title]\n[Same structure]\n\nDAY [X] — Departure\nMorning: [Last breakfast / check-out / transfer]\nFarewell notes: [What to keep with you from this journey]\n\nWHAT'S INCLUDED\n□ [X] nights accommodation\n□ All meals as indicated\n□ Private / shared transfers as specified\n□ Expert local guide throughout\n□ All entrance fees and activities listed\n□ Pre-departure information pack\n\nNOT INCLUDED\n□ International flights\n□ Travel insurance (required)\n□ Personal expenses and optional activities\n□ Gratuities` },
    { name: "Pricing & Revenue Strategy", type: "document", folder: "Finance & Pricing", content: `PRICING & REVENUE STRATEGY — [BRAND NAME]\n\nPRICING MODEL\n□ Rack rate (published prices)  □ Net rate + markup  □ Commission-based  □ Dynamic pricing\n\nPRODUCT PRICING\nProduct: [Name]  |  Duration: [X days]  |  Cost per pax: $[Amount]  |  Sell price: $[Amount]  |  Margin: [%]\nProduct: [Name]  |  Duration: [X days]  |  Cost per pax: $[Amount]  |  Sell price: $[Amount]  |  Margin: [%]\n\nSEASONALITY\nHigh season ([Months]): [Price modifier — e.g., +[20]%]\nShoulder season ([Months]): [Rack rate]\nLow season ([Months]): [Price modifier — e.g., –[15]%]\n\nEARLY BIRD & PROMOTIONS\nEarly bird (book [X months] out): [%] discount\nLast-minute (< [X weeks]): [% discount or upgrade incentive]\nGroup discount (> [X] people): [%]\nRepeat customer / loyalty: [Discount or upgrade]\n\nDISTRIBUTION & COMMISSIONS\nDirect (website): [%] of bookings  |  Commission: 0%\nOTA (Booking.com / Expedia / Airbnb): [%] of bookings  |  Commission: [15–25%]\nTravel agents / tour operators: [%] of bookings  |  Commission: [10–20%]\nTarget direct booking %: [%] (higher = better margin)\n\nYIELD MANAGEMENT\nAvailability calendar: [Open / Blackout dates]\nMinimum stay requirements: [X nights in high season]\nPeak pricing triggers: [Holidays, local events — list]` },
    { name: "Partner & Supplier Directory", type: "document", folder: "Operations & Partners", content: `PARTNER & SUPPLIER DIRECTORY — [BRAND NAME]\n\nACCOMMODATION PARTNERS\nPartner 1: [Property name]  |  Type: [Hotel / Villa / Camp]\nLocation: [Destination]  |  Contact: [Name, email]\nNet rate: $[Amount]/night  |  Sell rate: $[Amount]/night  |  Contract: [Yes / Pending]\nRooms/capacity: [#]  |  Notes: [Special terms, blackout dates]\n\nPartner 2: [Property name]\n[Same structure]\n\nGUIDE & EXPERIENCE PARTNERS\nGuide 1: [Name]  |  Specialty: [Specialty]  |  Location: [City]\nRate: $[Amount]/day  |  Languages: [List]  |  Vetted: □ Yes\nInsurance: □ Valid  |  References checked: □ Yes\n\nEXPERIENCE OPERATOR 1: [Company name]  |  Experience: [Activity]\nLocation: [Destination]  |  Net rate: $[Amount]/pax  |  Min group: [#]  |  Max: [#]\n\nTRANSFER & GROUND PARTNERS\nDriver 1: [Name / Company]  |  Location: [Airport/City]\nVehicle: [Type]  |  Capacity: [#]  |  Rate: $[Amount] per [transfer/day]\n\nFOOD & BEVERAGE\nRestaurant 1: [Name]  |  Cuisine: [Type]  |  Price per pax: $[Amount]\nCatering partner: [Name]  |  Specialty: [Private dining / Picnics / Events]\n\nCONTINGENCY / BACKUP SUPPLIERS\nFor each category, backup confirmed: □ Yes\nBackup contact: [Name, phone] — [Response time SLA]` },
    { name: "Operations & Guest Experience SOP", type: "document", folder: "Operations & Partners", content: `OPERATIONS & GUEST EXPERIENCE SOP — [BRAND NAME]\n\nBOOKING PROCESS\n1. Inquiry received via [website / email / phone]\n2. Response sent within [24 hours] — personalised\n3. Custom proposal or brochure sent within [48 hours]\n4. Follow-up call/email at [3 days] if no response\n5. Booking confirmed: [Deposit [%] received]\n6. Pre-departure info sent [X weeks] before travel\n\nPRE-DEPARTURE\n□ Flight details received and verified\n□ Dietary restrictions and accessibility needs confirmed\n□ Welcome pack sent: [Destination guide / packing list / emergency contacts]\n□ Hotel / activity reconfirmations made [X days] before arrival\n□ Welcome gift / surprise arranged (if applicable)\n\nON-GROUND OPERATIONS\nArrival: [Transfer arranged, check-in facilitated]\nDuring experience: [Check-in touchpoints — WhatsApp / in-person / phone]\nProblem escalation: [On-call guide / Emergency line: +1 [XXX-XXX-XXXX]]\nMid-trip survey (if multi-day): [Day X — quick check]\n\nPOST-TRIP\n□ Thank-you message sent within 24 hours of return\n□ Post-trip survey / review request sent at [Day 3]\n□ Review posted on [Google / TripAdvisor / Trust Pilot] monitored\n□ CRM record updated with trip notes, preferences, feedback\n□ Repeat booking offer / loyalty benefit communicated\n\nGUEST FEEDBACK MANAGEMENT\nTarget satisfaction score: [4.8+/5]\nNegative feedback protocol: [Respond within [24 hrs], offer resolution]` },
    { name: "Sales & Channel Strategy", type: "document", folder: "Marketing & Brand", content: `SALES & CHANNEL STRATEGY — [BRAND NAME]\n\nSALES OVERVIEW\nRevenue target: $[Amount] / [year]  |  # of bookings target: [#]\nAverage booking value: $[Amount]  |  Average group size: [X pax]\n\nCHANNELS\nDirect (website): [%] of mix — [CAC: $XX — highest margin]\nEmail marketing: [%] of mix — [Newsletter: # subscribers]\nSocial (Instagram / Pinterest / YouTube): [%] of mix\nTravel agent / luxury travel advisor (LTA) network: [%] of mix\nOTA (Booking.com / Viator / Airbnb): [%] of mix\nCorporate / MICE: [%] of mix\n\nTRAVEL AGENT STRATEGY\nAgencies in network: [#]  |  Target agencies: [Name high-value agencies to cultivate]\nFAM trip plan: [Host [X] agents per year to experience product firsthand]\nCommission: [15–20%] net  |  Agent portal: [Yes / No / Planned]\n\nDIRECT BOOKING GROWTH\nLead magnets: [Free destination guide / Quiz / Trip planner]\nEmail nurture: [# emails over # weeks]\nRetargeting ads: [Platform and budget]\n\nCORPORATE / GROUP\nTarget: [Companies, incentive travel, retreats, team building]\nContact: [HR / EA / Event manager]\nGroup minimum: [# pax]  |  Corporate rate: [Net rate structure]` },
    { name: "Financial Model & Budget", type: "document", folder: "Finance & Pricing", content: `FINANCIAL MODEL & BUDGET — [BRAND NAME]\nYear: [YYYY]  |  Currency: [USD]\n\nREVENUE PROJECTIONS\nQ1: $[Amount] ([#] bookings × $[AOV])\nQ2: $[Amount] ([#] bookings × $[AOV])\nQ3: $[Amount] ([#] bookings × $[AOV])\nQ4: $[Amount] ([#] bookings × $[AOV])\nAnnual Revenue: $[Amount]\n\nCOST OF SALES (variable)\nAccommodation (net): [%] of revenue = $[Amount]\nGuides & activities: [%] = $[Amount]\nTransfers: [%] = $[Amount]\nMeals: [%] = $[Amount]\nTravel agent commissions: [%] = $[Amount]\nTotal COGS: $[Amount]  |  Gross margin: [%]\n\nOPERATING EXPENSES (fixed)\nSalaries & contractors: $[Amount]/year\nMarketing & advertising: $[Amount]/year\nTechnology (CRM, booking engine, OTA fees): $[Amount]/year\nTravel & FAM trips: $[Amount]/year\nInsurance (professional + travel): $[Amount]/year\nLegal & compliance: $[Amount]/year\nOffice / overhead: $[Amount]/year\nTotal OpEx: $[Amount]\n\nEBITDA: $[Amount]  ([%] margin)\n\nBREAKEVEN ANALYSIS\nFixed costs: $[Amount]/year\nContribution per booking: $[Amount]\nBreakeven: [#] bookings/year = [#] bookings/month` },
  ],

  "Events & Conference": [
    { name: "Event Brief & Vision", type: "document", folder: "Event Planning", content: `EVENT BRIEF & VISION — [EVENT NAME]\nEvent type: □ Conference  □ Summit  □ Trade show  □ Festival  □ Concert  □ Gala  □ Workshop  □ Corporate  □ Wedding  □ Product launch\nDate(s): [Date]  |  Venue: [Name, City]  |  Expected attendance: [#]\nOrganizer: [Company / Individual]  |  Event website: [URL]\n\nEVENT VISION\n[What is this event, and why does it need to exist? What is the big idea?]\n\nGOALS & OBJECTIVES\n1. [Primary goal — e.g., educate [# attendees] on [topic]]\n2. [Secondary goal — e.g., generate [#] leads for exhibitors]\n3. [Tertiary goal — e.g., create $[Amount] in sponsorship revenue]\n\nTARGET AUDIENCE\nWho attends: [Job titles, industries, career levels, geography]\nWhy they come: [Learning / Networking / Business development / Entertainment]\nAttendance source: [% Corporate / % Individual / % Speakers / % Press]\n\nFORMAT\nKeynote sessions: [# keynotes, [XX] min each]\nBreakout sessions: [# tracks, [XX] min each]\nNetworking events: [Structured / Cocktail / Activities]\nExhibitor / sponsor floor: [Yes / No  — [# booths]]\nWorkshops / masterclasses: [# workshops, [# attendees each]]\nVirtual / hybrid component: [Yes / No]\n\nSUCCESS METRICS\n[NPS target / # attendees / # sponsors / media coverage / social impressions]` },
    { name: "Budget & P&L", type: "document", folder: "Budget & Sponsors", content: `EVENT BUDGET & P&L — [EVENT NAME]\nDate: [Date]  |  Currency: [USD]  |  Version: [#]\n\nREVENUE\nTickets: [#] tickets × $[Amount] avg = $[Amount]\nSponsorships: $[Amount] (see sponsor deck)\nExhibitor fees: [#] booths × $[Amount] = $[Amount]\nVIP / workshop upsells: $[Amount]\nOther (livestream, recordings, merch): $[Amount]\nTOTAL REVENUE: $[Amount]\n\nEXPENSES\nVenue rental:                 $[Amount]\nA/V & production:             $[Amount]\nCatering / F&B:               $[Amount]\nDecor & signage:              $[Amount]\nSpeaker fees & travel:        $[Amount]\nEntertainment:                $[Amount]\nMarketing & advertising:      $[Amount]\nTicketing platform fees ([%])  $[Amount]\nStaff & contractors:          $[Amount]\nEvent tech (app, badge, etc): $[Amount]\nInsurance:                    $[Amount]\nPrinting & collateral:        $[Amount]\nSecurity:                     $[Amount]\nMiscellaneous / contingency:  $[Amount]\nTOTAL EXPENSES: $[Amount]\n\nNET PROFIT / (LOSS): $[Amount]\n\nBREAKEVEN ATTENDANCE: [# tickets] at $[Amount] avg price\n\nCASH FLOW TIMING\nRevenue timing: [Sponsor deposits / early bird tickets — describe]\nMajor expense timing: [Venue deposit / A/V contract — describe]` },
    { name: "Venue & Logistics Plan", type: "document", folder: "Venue & Logistics", content: `VENUE & LOGISTICS PLAN — [EVENT NAME]\nVenue: [Name]  |  Address: [Address]\nVenue contact: [Name]  |  Phone: [#]  |  Email: [Email]\nCapacity: [# seated / # standing]  |  Contracted capacity: [#]\n\nVENUE LAYOUT\nMain stage / plenary: [Room name] — Capacity: [#] — Setup: [Theater / Classroom / Banquet]\nBreakout room 1: [Name] — Capacity: [#] — Setup: [Describe]\nBreakout room 2: [Name] — Capacity: [#] — Setup: [Describe]\nExhibit hall: [Room name] — [# booths] — Dimensions: [sq ft]\nNetworking / cocktail space: [Name] — Capacity: [#]\nGreen room / speaker lounge: [Room] — Access: [Speakers + staff only]\nPress room: [Room] — [Yes / No]\n\nA/V & PRODUCTION\nA/V vendor: [Company]  |  Contact: [Name]  |  Contract value: $[Amount]\nMain stage: [Screen size / LED wall / Projector] — [# screens]\nSound system: [Line array / Fill speakers]\nLighting: [Wash / Moving heads / LED strips]\nStreaming: [Platform — YouTube Live / Vimeo / Custom] — [Resolution]\nBackdrop / branding: [Set description]\n\nLOGISTICS\nLoad-in: [Date, time]  |  Setup complete by: [Time]\nRegistration opens: [Time]  |  Event start: [Time]  |  Event end: [Time]\nLoad-out deadline: [Time]\nParking: [# spaces / Public lots / Valet]\nSecurity: [# guards / Badge policy]\nWifi: [SSID / Password — shared with attendees]` },
    { name: "Speaker & Agenda Management", type: "document", folder: "Speakers & Agenda", content: `SPEAKER & AGENDA MANAGEMENT — [EVENT NAME]\nTotal speakers: [#]  |  Keynotes: [#]  |  Panels: [#]  |  Workshops: [#]\n\nSPEAKER ROSTER\nSpeaker 1:\nName: [Name]  |  Title: [Title, Company]\nSession: [Session title]  |  Format: [Keynote / Panel / Workshop]\nDate/Time: [Date, Time]  |  Room: [Room name]  |  Duration: [XX min]\nBio approved: □  |  Photo received: □  |  AV needs: [Slides / Demo / Video clip]\nTravel: [Flying from: City]  |  Hotel: [Property] — Booked: □\nHonorarim: $[Amount] or [Speaker fee waived]\n\nSpeaker 2:\n[Same structure]\n\nAGENDA (Master Schedule)\n[TIME]  Registration opens  |  [Location]\n[TIME]  Welcome & opening remarks  |  [Speaker, room]\n[TIME]  Keynote 1: [Title]  |  [Speaker, room]\n[TIME]  Break + Networking  |  [Location]\n[TIME]  Breakout Track A: [Session title]  |  [Speaker, room]\n[TIME]  Breakout Track B: [Session title]  |  [Speaker, room]\n[TIME]  Lunch  |  [Location]\n[TIME]  Keynote 2: [Title]  |  [Speaker, room]\n[TIME]  Panel: [Title]  |  [Panelists, room]\n[TIME]  Closing remarks  |  [Speaker, room]\n[TIME]  Networking reception  |  [Location]\n\nSPEAKER COMMUNICATIONS TIMELINE\n□ Initial invite sent  |  [Date]\n□ Confirmation received  |  [Date]\n□ Travel booked  |  [Date]\n□ AV/tech requirements collected  |  [Date]\n□ Slides submitted  |  [By: [Date]]\n□ Green room briefing  |  [Day of — Time]` },
    { name: "Sponsor & Exhibitor Deck", type: "document", folder: "Budget & Sponsors", content: `SPONSOR & EXHIBITOR PACKAGE — [EVENT NAME]\n[Event Date] | [City, Venue]\nExpected attendance: [#] | Audience: [Job titles, industries]\n\nWHY SPONSOR [EVENT NAME]?\n[3 compelling reasons — audience quality, brand alignment, ROI proof]\n\nSPONSORSHIP TIERS\n\nTITLE SPONSOR — $[Amount]  (1 available)\n□ Title naming rights (Event Name presented by [Sponsor])\n□ [X] min keynote speaking slot\n□ Logo: all marketing materials, stage backdrop, email\n□ [X] VIP passes + [X] general passes\n□ Exhibit booth (premium location, [X sq ft])\n□ Social media features: [#] posts\n□ [Additional custom benefit]\n\nGOLD SPONSOR — $[Amount]  ([X] available)\n□ [X] min speaking slot or panel placement\n□ Logo: website, email, stage\n□ [X] VIP passes + [X] general passes\n□ Standard exhibit booth ([X sq ft])\n□ Social media feature: [#] posts\n\nSILVER SPONSOR — $[Amount]  ([X] available)\n□ Logo: website and email\n□ [X] general passes\n□ Table in exhibit area\n□ Social media mention\n\nSESSION SPONSOR — $[Amount]\n□ Naming rights to [X] breakout session\n□ [X min] intro speaking\n□ [X] passes + branding in room\n\nEXHIBITOR BOOTH — $[Amount]\n□ [X sq ft] booth space\n□ [X] exhibitor passes\n□ Listing in event app / program` },
    { name: "Marketing & Ticket Sales Plan", type: "document", folder: "Marketing & Tickets", content: `MARKETING & TICKET SALES PLAN — [EVENT NAME]\nEvent date: [Date]  |  Ticket launch: [Date]  |  Sell-out target: [Date]\nTicketing platform: [Eventbrite / Tito / Universe / Hopin / Custom]\n\nTICKET TIERS\nEarly bird: $[Amount] — [# available] — [Deadline]\nGeneral admission: $[Amount]\nVIP: $[Amount] — includes [list VIP benefits]\nGroup ([X]+): $[Amount]/person\nPress/speaker/sponsor: [Complimentary]\n\nMARKETING TIMELINE\n[X months out]: Save-the-date / initial announcement\n[X months out]: Speaker announcement 1 — organic + email\n[X months out]: Sponsor announcement — press release\n[X months out]: Agenda live on website\n[6 weeks out]: Urgency push — "X spots left" or price increase\n[4 weeks out]: Speaker highlight series\n[2 weeks out]: Final push — last call email\n[Week of]: Logistics info to registered attendees\n\nCHANNELS\nEmail list ([# subscribers]): [Cadence during campaign]\nSocial (LinkedIn / Instagram / X): [Content strategy]\nPaid ads: $[Budget] — [Meta / LinkedIn / Google]\nPR: [Press releases to: media list]\nPartner / speaker promotion: [# of partners × their avg reach]\nInfluencer / community: [Specific communities to target]\n\nCONTENT ASSETS\n□ Event website  □ Email series ([# emails])\n□ Speaker promo graphics  □ Countdown graphics\n□ Event trailer video  □ Testimonial clips (from past attendees)` },
    { name: "On-Site Run of Show", type: "document", folder: "Venue & Logistics", content: `RUN OF SHOW — [EVENT NAME]\nDate: [Date]  |  Lead coordinator: [Name]  |  Emergency line: [Phone]\n\nSTAFF ASSIGNMENTS\n[Name]: Registration desk / Welcome\n[Name]: A/V / tech support\n[Name]: Speaker liaison / green room\n[Name]: Sponsor / exhibitor coordinator\n[Name]: Social media / photographer liaison\n[Name]: Floor manager / logistics\n\nMORNING (PRE-EVENT)\n[06:00] Venue access — setup crew on site\n[07:00] A/V setup and testing begins\n[08:00] Registration desk setup complete\n[08:30] Catering on site — breakfast stations ready\n[08:45] All staff briefing\n[09:00] Registration opens\n\nEVENT FLOW\n[09:00] Registration & networking breakfast\n[10:00] Doors open to main hall — [Name] welcomes guests\n[10:10] Opening remarks — [Speaker name]\n[10:30] Keynote 1 — [Speaker]\n[11:15] Break + exhibit hall open\n[11:45] Breakout sessions begin\n[12:30] Lunch — [Location]\n[13:30] [Continue with schedule...]\n\nCONTINGENCY PROTOCOLS\nSpeaker no-show: [Backup plan]\nA/V failure: [Backup laptop + HDMI dongles on hand]\nMedical emergency: [First aid location, hospital: [Name, address]]\nFire evacuation: [Assembly point: [Location]]\nOverrunning schedule: [Emcee shortens Q&A by [X min]]` },
    { name: "Post-Event Report Template", type: "document", folder: "Event Planning", content: `POST-EVENT REPORT — [EVENT NAME]\nDate: [Date]  |  Venue: [Name]  |  Prepared by: [Name]  |  Report date: [Date]\n\nATTENDANCE SUMMARY\nRegistered: [#]  |  Attended: [#]  |  No-shows: [#]  |  Walk-ins: [#]\nAttendance rate: [%]\nAudience breakdown: [Job titles, industries, geography]\n\nFINANCIAL SUMMARY\nTotal revenue: $[Amount]\nTotal expenses: $[Amount]\nNet profit / (loss): $[Amount]\nROI: [%]\nTop revenue source: [Tickets / Sponsorship / Exhibits]\n\nSPEAKER PERFORMANCE\nHighest-rated session: [Session title, score: [X.X/5]]\nLowest-rated session: [Session title, score: [X.X/5]]\nOverall speaker rating: [X.X/5]\n\nATTENDEE FEEDBACK (survey results, [#] respondents)\nOverall event rating: [X.X/5]\nTop satisfaction drivers: [List]\nTop complaints / areas for improvement: [List]\nNPS: [Score]\n\nSOCIAL MEDIA IMPACT\nPrimary hashtag: [#hashtag]  |  Total impressions: [#]\nTop-performing post: [Description + reach]\nMedia mentions: [#]\n\nKEY LEARNINGS\nWhat worked:\n1. [Specific success]\n2. [Specific success]\n\nWhat to improve:\n1. [Specific action for next year]\n2. [Specific action]\n\nNEXT STEPS\n□ Speaker thank-you notes sent\n□ Sponsor reports delivered\n□ Save-the-date for next year issued\n□ Session recordings edited and distributed\n□ Sponsor post-event metrics delivered` },
    { name: "Volunteer & Staff Plan", type: "document", folder: "Venue & Logistics", content: `VOLUNTEER & STAFF PLAN — [EVENT NAME]\n\nSTAFFING NEEDS\nTotal staff needed: [#]\nPaid staff: [#]  |  Volunteers: [#]  |  Venue staff (included): [#]\n\nROLES & ASSIGNMENTS\nRegistration / Check-in: [#] people — [Names]\nSession room monitors: [#] people — [Names] ([# per room])\nSpeaker liaisons: [#] people — [Names]\nExhibit floor: [#] people — [Names]\nA/V support: [#] people — [Names]\nCatering / F&B coordination: [#] people — [Names]\nSocial media / photographer: [#] people — [Names]\nGeneral support / floaters: [#] people — [Names]\n\nRECRUITMENT\nVolunteer platform: [Volunteer Match / Eventbrite / Direct outreach]\nIncentives for volunteers: [Complimentary ticket / Meals / Certificate / Swag]\nApplication deadline: [Date]  |  Confirmation: [Date]\nOrientation: [Date, Time, Location]\n\nBRIEFING AGENDA (Day before or morning of)\n1. Event overview and goals ([X min])\n2. Role-specific instructions ([X min])\n3. Key contacts + emergency protocols ([X min])\n4. Q&A ([X min])\nBriefing materials: [Printed role sheets / Walkie-talkies / Staff shirts]\n\nCOMMUNICATION\nStaff channel: [WhatsApp group / Slack / Radio]\nEmergency escalation: [Name] → [Name] → [Name]\nStaff check-in points: [Start of day / After lunch / End of day]` },
  ],

  "Fashion & Apparel": [
    { name: "Brand Identity & Manifesto", type: "document", folder: "Collection & Design", content: `BRAND IDENTITY & MANIFESTO — [BRAND NAME]\n\nBRAND MANIFESTO\n[Write the brand's core belief in raw, compelling language. What does this brand stand for? What does it stand against? What world does it exist to create?]\n\nBRAND DNA\nHeritage / founding story: [When, where, and why was this brand born?]\nMission: [One sentence — We make / stand for / believe in ___]\nVision: [What does the world look like when we've succeeded?]\nValues: [3–5 specific brand values with a sentence explaining each]\n\nAESTHETIC IDENTITY\nDesign codes: [The visual and material signatures that run through every collection]\nColors: [Core palette — specific references / Pantone]\nSilhouette DNA: [The shapes and proportions that define the brand]\nFabric philosophy: [What materials and why — luxury / sustainable / technical]\nCraft signature: [Embroidery / print / cut / hardware — the detail that makes it unmistakably yours]\n\nTARGET CUSTOMER\nThe [Brand Name] customer: [Rich portrait — not demographics, but who they ARE]\nThey wear [Brand Name] because: [The identity and feeling it gives them]\n\nCOMPETITIVE POSITION\nWe are not: [Competitor A] — we are more [differentiation]\nWe are not: [Competitor B] — we are more [differentiation]\nOur lane: [The specific territory we own in fashion]` },
    { name: "Collection Brief", type: "document", folder: "Collection & Design", content: `COLLECTION BRIEF — [COLLECTION NAME] [SEASON] [YEAR]\nSeason: [SS / FW] [Year]  |  Delivery: [Date]  |  Price range: $[Low] – $[High]\nCollection size: [# looks / # SKUs]\n\nINSPIRATION\n[What is the story, world, or feeling behind this collection? What are you referencing?]\n\nMOOD & WORLD\n[Describe the world of this collection — the woman/man/person who lives in it, where they are, what they feel]\n\nPALETTE\nPrimary: [Color 1 — Pantone ref] | [Color 2 — ref] | [Color 3 — ref]\nAccent: [Color — ref]\nNeutral: [Color — ref]\n\nFABRICS & MATERIALS\n[Fabric 1]: [Composition, weight, supplier, use in collection]\n[Fabric 2]: [Same]\n[Fabric 3]: [Same]\nHardware / embellishment: [Material, finish, supplier]\n\nSILHOUETTE DIRECTION\n[Describe the key shapes, proportions, and structural themes]\n\nKEY LOOKS\nLook 1 (Hero / Opening): [Description]\nLook 2: [Description]\nLook 3: [Description]\nLook [X] (Closing): [Description]\n\nBESTSELLER CARRYOVERS\n[Items from past seasons to repeat / update]\n\nPRICE ARCHITECTURE\nEntry [%] of collection: $[Low–Mid range]\nCore [%] of collection: $[Mid range]\nStatement [%] of collection: $[High range]` },
    { name: "Production & Manufacturing Plan", type: "document", folder: "Production & Manufacturing", content: `PRODUCTION & MANUFACTURING PLAN — [COLLECTION NAME]\nSeason: [SS / FW] [Year]  |  Total units: [#]  |  Delivery target: [Date]\n\nPRODUCTION PARTNERS\nManufacturer 1: [Factory name]  |  Location: [Country]\nSpecialty: [Cut & sew / Knitwear / Denim / Technical]  |  MOQ: [Units]\nLead time: [Weeks]  |  Payment: [%] deposit, balance on delivery\nContact: [Name, email]  |  Compliance: □ SA8000 / □ BSCI / □ GOTS certified\n\nManufacturer 2: [Factory name]\n[Same structure]\n\nPRODUCTION TIMELINE\n□ Tech packs submitted to factory  |  By: [Date]\n□ Proto samples received  |  By: [Date]\n□ Proto approval / corrections  |  By: [Date]\n□ Fabric ordered  |  By: [Date]\n□ Salesman samples received  |  By: [Date]\n□ Salesman sample approval  |  By: [Date]\n□ Production order placed  |  By: [Date]\n□ Fabric receipt at factory  |  By: [Date]\n□ Production complete  |  By: [Date]\n□ QC inspection  |  By: [Date]\n□ Shipment  |  By: [Date]\n□ Goods received at warehouse  |  By: [Date]\n\nQUALITY CONTROL\nQC standard: [AQL 2.5 / 4.0]\nQC agent: [In-house / Third party — company name]\nQC checklist: [Measurements / Stitching / Zippers / Color / Labeling]` },
    { name: "Costing & Margin Analysis", type: "document", folder: "Production & Manufacturing", content: `COSTING & MARGIN ANALYSIS — [COLLECTION NAME]\n\nCOST SHEET TEMPLATE\nSKU: [Reference #]  |  Description: [Name]  |  Season: [Season]\n\nFABRIC\nMain fabric: [Fabric name] — [meters/yards per unit] × $[Cost per meter] = $[Amount]\nLining: [Fabric] — [qty] × $[Amount] = $[Amount]\nTrim / interfacing: $[Amount]\n\nPRODUCTION\nCutting: $[Amount]\nSewing (CMT): $[Amount]\nEmbroidery / print / embellishment: $[Amount]\n\nFINISHING\nLabels / hang tags: $[Amount]\nPackaging (polybag / tissue / box): $[Amount]\n\nLOGISTICS\nFreight (per unit): $[Amount]\nDuties & customs: $[Amount]\n\nFOB COST:          $[Amount]\nLanded COGS:       $[Amount]\n\nPRICING\nWholesale price:   $[Amount]  |  Margin: [%] over COGS\nRetail (keystone): $[Amount]  |  Margin: [%] over COGS\nFull-price RRP:    $[Amount]\n\nMARGIN SUMMARY (collection)\nAvg COGS:                     $[Amount]\nAvg wholesale selling price:  $[Amount]\nWholesale margin:             [%]\nAvg retail selling price:     $[Amount]\nRetail margin:                [%]\nTarget sell-through at full price: [%] of units` },
    { name: "Brand Marketing & PR Plan", type: "document", folder: "Marketing & Brand", content: `BRAND MARKETING & PR PLAN — [BRAND NAME]\nSeason: [SS / FW] [Year]  |  Marketing budget: $[Amount]\n\nSEASONAL CAMPAIGN\nCampaign title: [Name]\nCampaign concept: [1–2 sentence description of the visual world and message]\nHero asset: [Campaign film / Editorial / Portrait series]\nPhotographer: [Name]  |  Casting: [Talent names / type]\nShoot dates: [Date]  |  Location: [Describe]\n\nPR STRATEGY\nPR agency: [Name / In-house]\nKey targets:\n• [Magazine 1] — [Target issue, deadline]\n• [Magazine 2] — [Target]\n• [Editor/journalist 1] — [Specific angle]\nShowroom / press days: [Date, location]\nSampling calendar: [When samples go out / return]\nPress release: [Collection story angle — [X] words]\n\nINFLUENCER & TALENT\nBrand ambassador(s): [Name — scope and compensation]\nGifting / seeding: [# influencers — tier — product sent]\nEvent dressing: [Talent dressing for [event]]\n\nSOCIAL MEDIA\nInstagram: [# posts/week — content mix]\nTikTok: [# videos/week]\nPinterest: [Seasonal boards strategy]\nContent types: [Campaign imagery / BTS / Product details / Styling / Collaborations]\n\nDROP / LAUNCH CALENDAR\n[Date]: Campaign launch — [Platform]\n[Date]: Product drop or pre-order opens\n[Date]: Pop-up or event\n[Date]: Wholesale delivery to stockists` },
    { name: "Retail & Distribution Strategy", type: "document", folder: "Retail & Distribution", content: `RETAIL & DISTRIBUTION STRATEGY — [BRAND NAME]\n\nDISTRIBUTION MODEL\n□ DTC only (own website)\n□ DTC + select wholesale\n□ Wholesale primary\n□ Own retail stores\n□ Marketplace (SSENSE, Net-a-Porter, Farfetch, etc.)\n\nDTC CHANNEL\nE-commerce platform: [Shopify / Magento / Custom]\nWebsite: [URL]  |  AOV: $[Amount]  |  Conversion rate: [%]\nRevenue target: $[Amount] / year\n\nWHOLESALE ACCOUNTS\nAccount 1: [Retailer name]  |  Market: [Country/City]\nBuyer: [Name]  |  Order size (last season): $[Amount]\nSell-in date: [Date]  |  Delivery window: [Dates]\n\nAccount 2: [Retailer name]\n[Same structure]\n\nMARKETPLACE STRATEGY\nPlatforms: [Net-a-Porter / SSENSE / Farfetch / Mytheresa]\nCommission: [30–35%]  |  Revenue target via marketplaces: $[Amount]\n\nPRICING BY CHANNEL\nWholesale (keystone): [÷2 from RRP]\nMarketplace: [RRP – [30%] margin share]\nDTC: [Full RRP]\n\nPOP-UP & RETAIL EVENTS\n[Location]: [Date]  |  Format: [Pop-up shop / Showroom / Market]\n[Location]: [Date]  |  Format:\n\nINTERNATIONAL\nCurrent markets: [List]\nTarget expansion markets: [List + rationale]\nDistribution agents: [Name / Region]` },
    { name: "Sustainability & Sourcing Policy", type: "document", folder: "Production & Manufacturing", content: `SUSTAINABILITY & SOURCING POLICY — [BRAND NAME]\n\nOUR COMMITMENT\n[What does sustainability mean to this brand? What is our ambition and timeline?]\n\nMATERIALS STANDARDS\nPreferred materials:\n□ Organic cotton (GOTS certified)\n□ Recycled polyester (GRS certified)\n□ Tencel / Lyocell / Modal\n□ Deadstock fabrics\n□ Responsible wool (RWS certified)\n□ Linen / hemp\n□ Leather: [Chromefree / vegetable-tanned / recycled / none]\n\nMaterials to eliminate by [Year]: [Conventional cotton / Virgin nylon / Virgin polyester]\n\nSUPPLY CHAIN TRANSPARENCY\nFactory disclosure: □ Public factory list on website  □ Not yet disclosed\nFactory audits: [Social compliance audits — [Frequency] — by [Firm]]\nTraceability: [Fiber → yarn → fabric → garment — level of traceability achieved]\n\nPRODUCTION\nLocal / nearshore manufacturing target: [%] by [Year]\nOverproduction strategy: [Made-to-order / Limited quantities / Pre-order]\nUnsold inventory policy: [Sample sales / Donate / Recycle — never landfill]\n\nPACKAGING\nShipping: [Recycled/compostable poly bags]  |  Hang tags: [FSC certified paper]\nTissue: [Acid-free recycled]  |  Boxes: [FSC certified or recycled]\nPlastic-free target: □ Achieved  □ By [Year]\n\nGOALS & REPORTING\nAnnual impact report: □ Published  □ Planned for [Year]\nCarbon footprint measurement: [Scope 1 / 2 / 3 — by [Year]]` },
    { name: "Sales & Wholesale Outreach Plan", type: "document", folder: "Retail & Distribution", content: `SALES & WHOLESALE OUTREACH PLAN — [BRAND NAME]\nSeason: [SS / FW] [Year]  |  Sell-in period: [Dates]\nSales goal: $[Amount] wholesale  |  # new accounts: [#]\n\nSHOWROOM / TRADESHOW STRATEGY\nShowroom: [In-house / Agent — city]\nAgent: [Name, % commission]\nTradeshows: [Paris showroom / Pitti Uomo / Capsule / Liberty / MAGIC — dates]\n\nLOOKBOOK\nFormat: [Digital PDF / Print — [# pages]]\nPhotography: [Date]  |  Photographer: [Name]\nDistribution: [Email to buyer list / Showroom / Trade press]\n\nBUYER TARGET LIST\nAccount: [Name]  |  City: [City]  |  Contact: [Buyer name, email]\nWhy target: [Brand alignment, customer base, door count]\nApproach: [Cold outreach / Existing relationship / Via agent]\n\nAccount: [Name]  |  City: [City]  |  Contact: [Buyer name]\n[Same structure]\n\nOUTREACH SEQUENCE\nStep 1 (Week [X]): Cold email — lookbook + line sheet\nStep 2 (Week [X+1]): Follow-up email or DM\nStep 3 (Week [X+2]): Appointment request — showroom or digital showroom\nStep 4: Appointment / virtual preview  |  Sample send if requested\nStep 5: Order / PO received\nStep 6: Order confirmation + production timeline sent\n\nKEY SELLING TOOLS\n□ Linesheet with wholesale prices and minimums\n□ Lookbook (digital + print)\n□ Wholesale order form\n□ Terms & conditions sheet\n□ Brand deck (for new accounts)` },
  ],

  "Restaurant / F&B": [
    { name: "Concept & Brand Identity", type: "document", folder: "Menu & Recipes", content: `CONCEPT & BRAND IDENTITY — [RESTAURANT / BRAND NAME]\nConcept type: □ Full-service restaurant  □ Fast casual  □ QSR  □ Café / bakery  □ Bar  □ Pop-up  □ Ghost kitchen  □ Food brand / CPG\nCuisine: [Describe]  |  Service style: [Describe]\nLocation: [Address / City]  |  Seats: [#]  |  Open: [Date]\n\nCONCEPT STORY\n[What is the founding vision? Why this concept, why here, why now?]\n\nPOSITIONING\nPrice tier: [Fast food / Casual / Polished casual / Fine dining] ($[Average check])\nOccasion: [Every day / Special occasion / Business lunch / Late night]\nDifferentiation: [What makes this unmistakably different from competitors?]\n\nBRAND PERSONALITY\nVoice: [Warm / Irreverent / Elevated / Neighborhood / Global]\nAesthetic: [Industrial / Warm wood / Minimalist / Maximalist / Rustic / Contemporary]\nColor palette: [Primary, secondary, accent]\nTagline / mission: [One line]\n\nTARGET CUSTOMER\n[Primary diner profile — who are they, what are their values, what brings them here?]\n\nCOMPETITIVE LANDSCAPE\n[Comp 1]: [Positioning vs. ours]\n[Comp 2]: [Positioning vs. ours]\nOur white space: [What we own that they don't]` },
    { name: "Menu Design & Recipe Database", type: "document", folder: "Menu & Recipes", content: `MENU DESIGN & RECIPE DATABASE — [RESTAURANT NAME]\nMenu season: [Current / [Season Year]]  |  Updated: [Date]\n\nMENU PHILOSOPHY\n[What guides menu decisions? Local sourcing, seasonality, technique, cultural inspiration?]\n\nFOOD MENU STRUCTURE\n\nSTARTERS / SMALL PLATES\n[Dish 1]: $[XX] — [2-sentence description]\n[Dish 2]: $[XX] — [Description]\n[Dish 3]: $[XX] — [Description]\n\nMAINS\n[Dish 1]: $[XX] — [Description]\n[Dish 2]: $[XX] — [Description]\n[Dish 3]: $[XX] — [Description]\n\nDESSERTS\n[Dessert 1]: $[XX] — [Description]\n\nBEVERAGES\nNon-alcoholic: [List]\nCocktail/wine list: [Refer to separate menu]\n\nRECIPE CARD FORMAT (for each dish)\nDish: [Name]\nYield: [# servings]\nIngredients:\n• [Qty] [Ingredient] — [Prep note]\n• [Qty] [Ingredient]\nMethod:\n1. [Step]\n2. [Step]\nPlating: [Describe presentation]\nAllergens: [List]\nModifications: [Vegan / GF / Nut-free options]\nFood cost: $[XX]  |  Menu price: $[XX]  |  Food cost %: [%]` },
    { name: "Financial Model & P&L", type: "document", folder: "Finance & COGS", content: `FINANCIAL MODEL & P&L — [RESTAURANT NAME]\nPeriod: [Month / Year]  |  Seats: [#]  |  Operating days/week: [#]\n\nREVENUE\nDine-in covers/day: [#]  |  Avg check: $[XX]  |  Dine-in revenue: $[Amount]/month\nTakeout / delivery: $[Amount]/month\nBeverage (bar): $[Amount]/month\nEvents / buyouts: $[Amount]/month\nTOTAL REVENUE: $[Amount]/month\n\nCOST OF GOODS SOLD\nFood cost ([target: 28–32%]):  $[Amount]  ([%])\nBeverage cost ([target: 20–25%]): $[Amount]  ([%])\nTotal COGS:                    $[Amount]  ([%])\nGROSS PROFIT:                  $[Amount]  ([%])\n\nOPERATING EXPENSES\nLabor (front + back of house): $[Amount]  ([target: 25–35%])\nRent / occupancy:               $[Amount]  ([target: 6–10%])\nUtilities:                      $[Amount]\nMarketing:                      $[Amount]\nCredit card fees ([2.5–3%]):    $[Amount]\nRepairs & maintenance:          $[Amount]\nSupplies (non-food):            $[Amount]\nDelivery app commissions:       $[Amount]  ([25–30%] of delivery rev)\nInsurance:                      $[Amount]\nMiscellaneous:                  $[Amount]\nTotal OpEx:                     $[Amount]\n\nEBITDA:                         $[Amount]  ([%])\n\nBREAKEVEN (monthly)\nFixed costs:          $[Amount]\nContribution margin:  [%]\nBreakeven revenue:    $[Amount]/month = [#] covers at $[XX] avg check` },
    { name: "Operations & Staffing Manual", type: "document", folder: "Operations & Staffing", content: `OPERATIONS & STAFFING MANUAL — [RESTAURANT NAME]\n\nHOURS OF OPERATION\nLunch: [Days] [Time – Time]\nDinner: [Days] [Time – Time]\nBrunch: [Days] [Time – Time]\nPrivate events: [By arrangement]\n\nFRONT OF HOUSE (FOH) TEAM\nPositions: General Manager / Floor Manager / Server / Bartender / Host / Busser\nGM — [Name]  |  Phone: [#]  |  Email: [Email]\n\nBACK OF HOUSE (BOH) TEAM\nPositions: Executive Chef / Sous Chef / Line Cook / Prep Cook / Dishwasher\nExec Chef — [Name]  |  Phone: [#]  |  Email: [Email]\n\nOPENING CHECKLIST (FOH)\n□ Lights on, music on\n□ Tables set and polished\n□ Service stations stocked\n□ POS system checked\n□ Reservation list printed / reviewed\n□ Team briefing — specials, 86'd items, reservations of note\n\nCLOSING CHECKLIST (FOH)\n□ All tables cleared and reset\n□ Cash counted, POS closed out\n□ Tips distributed\n□ Floors swept and mopped\n□ Chairs up\n□ Alarm set\n\nSTAFF SCHEDULING\nSchedule posted: [Day, X days in advance]\nSchedule platform: [When I Work / 7shifts / Paper]\nCall-in/no-call policy: [Describe]\n\nSERVICE STANDARDS\n[Describe your table greeting, pacing, upselling, complaint handling, and checkout standards]` },
    { name: "Marketing & Social Plan", type: "document", folder: "Marketing & Social", content: `MARKETING & SOCIAL PLAN — [RESTAURANT NAME]\nMarketing budget: $[Amount]/month\n\nBRAND PRESENCE ONLINE\nWebsite: [URL]  |  Google Business: □ Claimed & complete\nYelp: □ Claimed  |  TripAdvisor: □ Claimed  |  OpenTable/Resy: □ Listed\n\nINSTAGRAM STRATEGY\nHandle: @[handle]  |  Current followers: [#]\nPosting frequency: [X posts/week + X stories/day]\nContent types: [Food photography / Chef content / BTS / Specials / Reels]\nGrowth goal: [# followers by Date]\n\nGOOGLE STRATEGY\nGoogle reviews: [#] at [X.X stars] — target: [#] at [4.8+]\nReview response: [Respond to all within [24 hrs]]\nGoogle Posts: [Weekly updates — specials, events]\nSEO: [Menu keywords / local keywords targeted]\n\nEMAIL & SMS\nEmail list: [# subscribers]  |  Platform: [Mailchimp / Klaviyo]\nCadence: [Monthly newsletter — new menu, events, staff highlight]\nSMS: [# subscribers — weekly specials and reservations]\n\nLOCAL PARTNERSHIPS\n[Hotel]: [Feature on in-room dining menu / concierge recommendation]\n[Office building]: [Catering partnership / lunch delivery]\n[Event venue nearby]: [Pre-show dinner partnership]\n\nINFLUENCER / FOOD MEDIA\n[Journalist / food blogger]: [Comp table + press kit]\n[Micro-influencer (@[handle])]: [Comp meal exchange for post]\nTarget food media placements: [Local magazine / food publication / podcast]` },
    { name: "Supplier & Purchasing Plan", type: "document", folder: "Finance & COGS", content: `SUPPLIER & PURCHASING PLAN — [RESTAURANT NAME]\n\nSUPPLIER DIRECTORY\nProtein\nSupplier: [Name]  |  Products: [Beef / Chicken / Seafood]\nDelivery: [Days]  |  Minimum order: $[Amount]  |  Contact: [Name, phone]\nPayment: [Net15 / COD]\n\nProduce\nSupplier: [Name]  |  Products: [Fresh vegetables, herbs, fruit]\nDelivery: [Days]  |  Contact: [Name, phone]  |  Notes: [Local farm — seasonal availability]\n\nDairy & Eggs\nSupplier: [Name]  |  Products: [Dairy, eggs]\nDelivery: [Days]  |  Contact: [Name]\n\nDry Goods & Pantry\nSupplier: [Name / Sysco / US Foods]  |  Products: [Dry goods, oils, spices]\nDelivery: [Days]  |  Minimum: $[Amount]\n\nBeverage\nBeverage distributor: [Name]  |  Products: [Beer, wine, spirits]\nRep: [Name, phone]  |  Ordering: [Platform / Email]\n\nPURCHASING PROTOCOLS\nOrdering cadence: [Daily / 3x/week / Weekly by category]\nInventory count: [Weekly — [Day]]\nPar levels: [Maintained by [Chef name]]\nWeekly food cost tracking: [Reviewed by [Manager]]\n\nFOOD COST TARGET: [28–32%]\nTop 10 most expensive ingredients: [Track and review monthly]` },
    { name: "Health & Safety Compliance", type: "document", folder: "Operations & Staffing", content: `HEALTH & SAFETY COMPLIANCE — [RESTAURANT NAME]\n\nFOOD SAFETY\nServSafe certified staff: [# certified]  |  Renewal: [Every 5 years]\nTemperature logs: [Completed [2x daily] — refrigerators + hot-holding]\nCooling protocols: [Cool to 70°F within 2 hrs, 40°F within 4 hrs total]\nProper handwashing: [20 seconds, at [key times]]\nAllergen protocols: [How cross-contamination is prevented]\nFood handler licenses: [Required in [state] — all staff current: □ Yes]\n\nHEALTH DEPARTMENT\nPermit: [Current — expires [Date]]  |  Renewal submitted: □\nLast inspection: [Date]  |  Score: [#]  |  Violations: [#]\nInspection deficiencies corrected: □ Yes / □ Outstanding: [List]\nHealth department contact: [Inspector name, phone]\n\nFIRE SAFETY\nFire suppression system (hood): [Last serviced: Date]  |  Next: [Date]\nFire extinguishers: [Last inspected: Date]  |  Next: [Date]\nEvacuation routes: [Posted: □ Yes]\nStaff fire safety training: [Annual]\n\nADA COMPLIANCE\nEntrance: □ Accessible  |  Restrooms: □ Accessible\n\nINSURANCE\nGeneral liability: $[Amount]  |  Carrier: [Name]  |  Expires: [Date]\nWorkers' comp: [Carrier]  |  Expires: [Date]\nLiquor liability: [Carrier]  |  Expires: [Date]\n\nEMERGENCY CONTACTS\nPlumber: [Name, phone]  |  HVAC: [Name, phone]  |  Electrician: [Name, phone]` },
    { name: "Growth & Expansion Plan", type: "document", folder: "Finance & COGS", content: `GROWTH & EXPANSION PLAN — [RESTAURANT / BRAND NAME]\n\nCURRENT STATE\nLocations: [#]  |  Annual revenue: $[Amount]  |  EBITDA margin: [%]\nAvg unit volume (AUV): $[Amount]\nProfit per unit: $[Amount]\n\nGROWTH THESIS\n[Why are we positioned to grow? What is the repeatable model? What's the unlock?]\n\nGROWTH OPTIONS (ranked by priority)\n1. [New unit opening in [City / Neighborhood]]\n   Investment: $[Amount]  |  Expected AUV: $[Amount]  |  Payback: [Months]\n2. [Ghost kitchen / Virtual brand expansion]\n   Investment: $[Amount]  |  Revenue potential: $[Amount]\n3. [CPG / retail product line]\n   Products: [Sauces / spice blends / packaged goods]\n   Target: [Whole Foods / Direct online / Specialty retail]\n4. [Franchise / licensing model]\n   [Description of model — when this becomes viable]\n5. [Catering / events as revenue vertical]\n   [Target accounts, pricing, staffing model]\n\nNEW UNIT ECONOMICS (proforma)\nBuild-out cost: $[Amount]  |  Seats: [#]\nAUV: $[Amount]  |  EBITDA margin: [%]\nPayback period: [Months]\n\nTIMELINE\nYear 1: [Current — optimize unit economics, build systems]\nYear 2: [2nd location — [City]]\nYear 3: [3rd location / ghost kitchen / CPG launch]` },
  ],

  "Agency / Consultancy": [
    { name: "Agency Positioning & Credentials", type: "document", folder: "Service Offerings", content: `AGENCY POSITIONING & CREDENTIALS — [AGENCY NAME]\nFounded: [Year]  |  HQ: [City]  |  Team size: [#]  |  Structure: [LLC / Corp / Partnership]\nSpecialty: [Marketing / Strategy / Tech / HR / Finance / Legal / Creative / Management / etc.]\n\nPOSITIONING STATEMENT\n[We are the agency for ___] who need ___ so they can ___.\n\nWHY WE WIN\n1. [Specific differentiation — deep expertise, speed, proprietary method, niche]\n2. [Client outcomes — specific results you've delivered]\n3. [People / culture — what makes your team exceptional]\n\nCLIENT PROFILE\nIdeal client size: [Revenue range / headcount]\nIdeal client type: [B2B / B2C / Industry vertical]\nBuying decision maker: [CMO / CEO / VP / HR Director]\nEngagement starting budget: $[Amount]\nAvg engagement size: $[Amount]\n\nTEAM CREDENTIALS\nFounder/CEO: [Name] — [Background, past companies, notable expertise]\nSenior [Role]: [Name] — [Background]\nAdvisors: [Name] — [Relevance]\n\nCLIENT TESTIMONIALS\n"[Quote]" — [Name, Title, Company]\n"[Quote]" — [Name, Title, Company]\n\nSELECT CLIENT LIST\n[Client 1], [Client 2], [Client 3], [Client 4]` },
    { name: "Service Menu & Pricing", type: "document", folder: "Service Offerings", content: `SERVICE MENU & PRICING — [AGENCY NAME]\n\nCORE SERVICES\n\nService 1: [Service name]\nDescription: [What we deliver and how]\nIdeal client: [Who needs this]\nTimeline: [Typical engagement length]\nDeliverables: [List key outputs]\nPricing: [Project fee: $XX,XXX / Retainer: $X,XXX/month / Hourly: $XXX/hr]\n\nService 2: [Service name]\nDescription: [What we deliver]\nIdeal client: [Who]\nTimeline: [Length]\nDeliverables: [Outputs]\nPricing: [Model and range]\n\nService 3: [Service name]\n[Same structure]\n\nRETAINER PACKAGES\nStarter: $[Amount]/month — [X hours + X deliverables]\nGrowth: $[Amount]/month — [X hours + X deliverables]\nEnterprise: $[Amount]/month — [X hours + dedicated team]\n\nPROJECT FEES (typical range)\n[Project type 1]: $[Low] – $[High]\n[Project type 2]: $[Low] – $[High]\n[Project type 3]: $[Low] – $[High]\n\nADD-ONS / A LA CARTE\n[Item 1]: $[Amount]\n[Item 2]: $[Amount]\n\nPRICING NOTES\nMinimum engagement: $[Amount]\nExpenses policy: [Billed at cost + [%] markup / included / pre-approved only]\nTravel: [Billed at cost / $[XX]/day flat rate]` },
    { name: "Client Proposal Template", type: "document", folder: "Clients & Proposals", content: `CLIENT PROPOSAL — [CLIENT COMPANY NAME]\nPrepared by: [Agency Name]  |  Date: [Date]  |  Version: [#]\nPrepared for: [Client contact name, title]\n\n1. EXECUTIVE SUMMARY\n[2–3 sentences: We understand your challenge. Here's what we'll do. Here's what you'll get.]\n\n2. UNDERSTANDING OF YOUR CHALLENGE\n[Show you've listened. Articulate their problem or opportunity better than they can.]\n\n3. OUR RECOMMENDED APPROACH\n[Describe the engagement — what we'll do, how we'll do it, in what order]\n\nPhase 1 — [Name]: [Description] — [Timeline]\nPhase 2 — [Name]: [Description] — [Timeline]\nPhase 3 — [Name]: [Description] — [Timeline]\n\n4. DELIVERABLES\n□ [Deliverable 1]\n□ [Deliverable 2]\n□ [Deliverable 3]\n□ [Deliverable 4]\n\n5. TEAM\n[Name] — [Title] — [Why they're on this engagement]\n[Name] — [Title] — [Role]\n\n6. TIMELINE\nProject start: [Date]  |  Completion: [Date]  |  Key milestones: [List]\n\n7. INVESTMENT\nProject fee: $[Amount]  |  Payment terms: [50% upfront, 50% on delivery / Milestone-based]\nMonthly retainer (if applicable): $[Amount]/month for [X months]\n\n8. WHY [AGENCY NAME]\n[3 specific reasons this agency is the right choice for this specific client]\n\n9. NEXT STEPS\nTo proceed, [Client] would [sign SOW + submit deposit by [Date]].` },
    { name: "Delivery & Process Playbook", type: "document", folder: "Delivery & Processes", content: `DELIVERY & PROCESS PLAYBOOK — [AGENCY NAME]\n\nCLIENT ONBOARDING (Week 1)\n□ Signed SOW + deposit received\n□ Welcome packet sent\n□ Kickoff call scheduled (60 min)\n□ Shared workspace set up ([Notion / Asana / Basecamp / ClickUp])\n□ Client intro to dedicated team member(s)\n□ Access / credentials request sent\n□ Kickoff call completed — goals, KPIs, stakeholders, communication preferences confirmed\n\nPROJECT EXECUTION RHYTHM\nWeekly standup: [Day, Time] — [Client + agency team]\nStatus update: [Friday afternoon — Slack / Email]\nMajor deliverable review: [Async first → Sync call if needed]\nBi-weekly or monthly strategic review: [Longer session — progress vs. goals]\n\nDELIVERABLE REVIEW PROCESS\n1. Internal QA before client delivery (always)\n2. Deliver via [platform / email] with context document\n3. Client feedback window: [X business days]\n4. Revisions: [X rounds included per deliverable]\n5. Sign-off: [Written approval via email / Notion comment]\n\nCOMMUNICATION STANDARDS\nResponse SLA: [2 business hours / By end of same business day]\nPreferred channel: [Slack / Email / Teams]\nEscalation path: Account lead → Agency principal\n\nPROJECT CLOSEOUT\n□ All deliverables delivered and signed off\n□ Final report / retrospective shared\n□ File handoff / knowledge transfer complete\n□ Invoice issued and paid\n□ Testimonial / case study request\n□ Referral ask\n□ Offboarding from shared tools` },
    { name: "Financial Model & Pricing", type: "document", folder: "Finance & Pricing", content: `FINANCIAL MODEL & PRICING — [AGENCY NAME]\nYear: [YYYY]  |  Team size: [#] FTE  |  Target utilization: [%]\n\nREVENUE TARGETS\nRetainer revenue (MRR): $[Amount]/month × [# clients] = $[Amount]/month\nProject revenue: $[Amount]/month\nTotal MRR: $[Amount]  |  Annual ARR: $[Amount]\n\nPRICING MECHANICS\nBillable rate (avg): $[Amount]/hour\nTarget utilization rate: [60–75%] (% of team hours billable)\nBillable hours/person/month: [Utilization% × 160 hrs] = [#]\nRevenue per FTE: [# hrs × $[Amount]] = $[Amount]/month\n\nCAPACITY PLANNING\nCurrent team: [# FTE]  |  Current capacity: [# billable hrs/month]\nCurrent booked: [# hrs/month]  |  Available: [# hrs]\nHire trigger: [When utilization exceeds [80]% for [X consecutive months]]\n\nCOST STRUCTURE\nSalaries & benefits: $[Amount]/month  ([%] of revenue)\nContractors / freelancers: $[Amount]/month\nSoftware & tools: $[Amount]/month\nMarketing & BD: $[Amount]/month\nOffice (if any): $[Amount]/month\nG&A / Legal / Accounting: $[Amount]/month\nTotal costs: $[Amount]/month\n\nEBITDA: $[Amount]/month  ([%] margin)\n\nPIPELINE\nTotal pipeline: $[Amount]\nWeighted pipeline: $[Amount]\nCurrent win rate: [%]\nAvg sales cycle: [X weeks/months]` },
    { name: "Business Development & Sales Playbook", type: "document", folder: "Clients & Proposals", content: `BUSINESS DEVELOPMENT & SALES PLAYBOOK — [AGENCY NAME]\n\nBD STRATEGY\nPrimary channels:\n1. [Referrals] — [How to systematically generate referrals]\n2. [Content / thought leadership] — [Platforms, cadence]\n3. [Outbound] — [Target companies, decision makers, outreach method]\n4. [Events / speaking] — [Which events, speaking topics]\n5. [Partnerships] — [Who refers to you / who you co-sell with]\n\nIDEAL CLIENT PROFILE (ICP)\n[Revenue / size / industry / geography / trigger events that signal they need you]\n\nOUTBOUND SEQUENCE\nStep 1: [LinkedIn connect + message — Day 1]\nStep 2: [Email — Day 3]\nStep 3: [LinkedIn follow-up — Day 7]\nStep 4: [Value-add email (content, insight, idea) — Day 12]\nStep 5: [Final email — Day 17]\nIf no response: [Move to nurture sequence]\n\nDISCOVERY CALL FRAMEWORK\n1. [5 min] — Rapport + agenda\n2. [20 min] — Their situation: What's happening, what's the goal, what's been tried?\n3. [10 min] — Ideal outcome: What does success look like in 6 months?\n4. [10 min] — Fit assessment + our approach overview\n5. [5 min] — Next steps / proposal timeline\nKey questions to always ask: [List 5 discovery questions]\n\nPROPOSAL CONVERSION\nProposal turnaround SLA: [X business days]\nFollow-up after sending: [Day 2, Day 5, Day 10]\nWin rate target: [40–60%]\nCommon objections + responses: [Price / timing / not our priority / need approval]` },
    { name: "Talent & Team Plan", type: "document", folder: "Team & Growth", content: `TALENT & TEAM PLAN — [AGENCY NAME]\n\nCURRENT TEAM\n[Name] — [Title] — [Billable rate] — [Key skills]\n[Name] — [Title] — [Billable rate] — [Key skills]\n[Name] — [Title] — [Non-billable] — [Function]\n\nFREELANCER / CONTRACTOR BENCH\n[Name] — [Specialty] — [Rate] — [Availability: X days/month]\n[Name] — [Specialty] — [Rate] — [Availability]\n[Name] — [Specialty] — [Rate] — [Availability]\n\nHIRING ROADMAP\nHire 1: [Title]  |  Target start: [Date]  |  Trigger: [Revenue / utilization threshold]\nSkills needed: [List]  |  Comp range: $[Low]–$[High] + [equity / bonus]\nHire 2: [Title]  |  Target start: [Date]  |  Trigger: [Threshold]\n\nPERFORMANCE MANAGEMENT\nUtilization target: [%] of hours billable\nReview cadence: [Quarterly]\nCareer path: [Junior → Mid → Senior → Principal → Partner]\n\nCULTURE\n[How do you work? Remote / hybrid / in-person? What do you value?]\n[Rituals: All-hands, team lunches, annual offsite, etc.]\n\nCOMPENSATION PHILOSOPHY\nSalary: [Market / Below market + equity / Above market]\nBonus: [Individual performance / Company profit share]\nEquity: [% for early hires — vesting schedule]\nBenefits: [List key benefits]` },
    { name: "Case Studies & Portfolio", type: "document", folder: "Clients & Proposals", content: `CASE STUDY — [CLIENT NAME] × [AGENCY NAME]\nIndustry: [Industry]  |  Company size: [Revenue / Employees]\nEngagement type: [Retainer / Project]  |  Duration: [X months]\n(Published with client permission)\n\nCLIENT BACKGROUND\n[Who is the client? What do they do? What was their market position when we started?]\n\nCHALLENGE\n[What specific problem, pain, or opportunity brought them to us? Be specific.]\n\nOUR APPROACH\n[How did we tackle it? What was our methodology? What made our approach different?]\n\nPhase 1 — [Name]: [What we did]\nPhase 2 — [Name]: [What we did]\nPhase 3 — [Name]: [What we did]\n\nRESULTS\n[Specific, measurable outcomes]\n• [Metric 1]: [From X to Y in Z months]\n• [Metric 2]: [Describe result]\n• [Metric 3]: [Revenue generated / cost saved / efficiency gained]\n• [Qualitative result]: [Team capability, strategic clarity, etc.]\n\nCLIENT QUOTE\n"[Specific, compelling quote from client about their experience and results]"\n— [Name, Title, Company]\n\nKEY LEARNINGS\n[What did this engagement teach us that made us better?]\n\nSTATUS\n□ Ongoing engagement  □ Project complete  □ Client departed  |  Reason: [If departed]` },
    { name: "Tools & Technology Stack", type: "document", folder: "Delivery & Processes", content: `TOOLS & TECHNOLOGY STACK — [AGENCY NAME]\n\nPROJECT MANAGEMENT\nPrimary PM tool: [Asana / ClickUp / Monday / Notion / Linear]\nClient-facing workspace: [Notion / Basecamp / Shared Asana]\nTime tracking: [Harvest / Toggl / Clockify]\n\nCOMMUNICATION\nInternal: [Slack / Teams / Discord]\nClient comms: [Email / Slack Connect / Teams]\nVideo calls: [Zoom / Google Meet / Teams]\n\nFINANCE & OPERATIONS\nInvoicing: [QuickBooks / FreshBooks / Xero / Stripe]\nProposal software: [Better Proposals / Proposify / Qwilr / Google Docs]\nCRM: [HubSpot / Pipedrive / Notion]\nContract signing: [DocuSign / PandaDoc / HelloSign]\n\nSPECIALIZED TOOLS (by service)\nMarketing agencies: [SEMrush / Ahrefs / Klaviyo / Figma / Hootsuite]\nStrategy / consulting: [Miro / Figma / Dovetail / Notion]\nTech agencies: [GitHub / Jira / Figma / Vercel]\nHR consulting: [BambooHR / Rippling / Lattice]\n\nAI & AUTOMATION\nAI tools in use: [ChatGPT / Claude / Midjourney / Perplexity — for what use cases]\nAutomation: [Zapier / Make — which workflows are automated]\nKnowledge base: [Notion / Confluence — internal documentation]\n\nSECURITY\nPassword management: [1Password / Bitwarden]\nClient data handling: [How we protect sensitive client information]\nNDA standard: [Always required before sharing sensitive information]` },
  ],

  "IoT / Hardware": [
    { name: "Product Concept & Requirements", type: "document", folder: "Hardware Design", content: `PRODUCT CONCEPT & REQUIREMENTS — [PRODUCT NAME]\nProduct type: □ Consumer IoT  □ Industrial IoT  □ Wearable  □ Smart home  □ Medical device  □ Embedded system\nStage: □ Concept  □ Prototype  □ EVT  □ DVT  □ PVT  □ Mass production\n\nPRODUCT VISION\n[What does this device do? What problem does it solve? Why does it need to be hardware vs. software-only?]\n\nKEY REQUIREMENTS\n\nFUNCTIONAL REQUIREMENTS\n1. [Req 1 — e.g., Measures X with Y accuracy]\n2. [Req 2 — e.g., Transmits data via Bluetooth 5.2 to mobile app]\n3. [Req 3 — e.g., Battery life > 72 hours continuous use]\n4. [Req 4]\n5. [Req 5]\n\nNON-FUNCTIONAL REQUIREMENTS\nWater resistance: [IP rating — e.g., IP67]\nOperating temperature: [−10°C to +60°C]\nDrop resistance: [e.g., 1m onto concrete]\nSize target: [Dimensions in mm]\nWeight target: [< Xg]\nBattery / power: [Battery size / wired power]\nConnectivity: [BLE / WiFi / LoRa / LTE-M / NFC / Zigbee]\nDisplay: [None / LED / E-ink / LCD / OLED]\n\nCOMPLIANCE REQUIREMENTS\n□ FCC Part 15 (US wireless)  □ CE Mark (EU)  □ UL (safety)  □ RoHS\n□ Medical: FDA 510(k) / CE MDR  □ Industrial: ATEX / IECEx\n\nBOM COST TARGET\nTarget BOM: $[XX]  |  Target retail price: $[XX]  |  Margin target: [%]` },
    { name: "Hardware Architecture", type: "document", folder: "Hardware Design", content: `HARDWARE ARCHITECTURE — [PRODUCT NAME]\nVersion: [HW Rev X.X]  |  Date: [Date]  |  Engineer: [Name]\n\nMICROCONTROLLER / SOM\nChip / module: [e.g., ESP32-S3 / nRF52840 / STM32 / Raspberry Pi CM4]\nCore(s): [# cores, clock speed]  |  RAM: [MB]  |  Flash: [MB]\nRationale: [Why this chip — cost, power, connectivity, ecosystem]\n\nCONNECTIVITY\nWireless: [BLE [version] / WiFi [b/g/n/ac/ax] / LoRa [band] / LTE-M / NB-IoT]\nAntennas: [PCB trace / external / ceramic — location in enclosure]\nCertifications: [FCC/CE pre-certified module: Yes/No]\n\nSENSORS\n[Sensor 1]: [Part # / model]  |  Interface: [I2C / SPI / UART / ADC]  |  Purpose: [What it measures]\n[Sensor 2]: [Part # / model]  |  Interface: [Interface]  |  Purpose: [Purpose]\n[Sensor 3]: [Part # / model]  |  Interface: [Interface]  |  Purpose: [Purpose]\n\nPOWER SYSTEM\nPower source: [LiPo [mAh] / Alkaline AA / USB-C powered / Solar + battery]\nPMIC: [Part #]  |  Input: [4.5–6V USB-C]  |  Output: [3.3V @ Xma, 1.8V @ Xma]\nCharging: [USB-C PD / Qi wireless — IC: Part #]\nExpected battery life: [X hours] @ [typical use case]\n\nENCLOSURE\nMaterial: [ABS / PC / Aluminum / Stainless]  |  Process: [Injection molded / CNC]\nDimensions: [L × W × H mm]  |  Finish: [Texture / Color]\nConnectors external: [USB-C / 3.5mm / Custom]  |  LEDs: [# and purpose]` },
    { name: "Firmware Architecture", type: "document", folder: "Firmware & Embedded", content: `FIRMWARE ARCHITECTURE — [PRODUCT NAME]\nVersion: [FW v0.1.0]  |  Date: [Date]  |  Engineer: [Name]\nPlatform: [Zephyr RTOS / FreeRTOS / ESP-IDF / Arduino / Bare metal / Linux]\nLanguage(s): [C / C++ / Rust / MicroPython]\n\nSYSTEM OVERVIEW\n[High-level description of what the firmware does and how it's structured]\n\nFIRMWARE MODULES\nModule 1: [Sensor Manager]\nResponsibility: [Polling / interrupt-driven sensor data collection]\nKey functions: [List]\nEvents produced: [Data ready / error]\n\nModule 2: [BLE / Connectivity Manager]\nResponsibility: [GATT server / advertising / connection management]\nBLE services: [Battery service / Custom data service / OTA service]\nKey characteristics: [UUID, read/write/notify for each]\n\nModule 3: [Power Manager]\nResponsibility: [Sleep modes / wake-up sources / battery monitoring]\nSleep current target: [< XμA]\n\nModule 4: [OTA Update Manager]\nOTA mechanism: [BLE DFU / WiFi HTTP / MQTT]\nSecurity: [Code signing / encrypted binary]\n\nDATA FLOW\n[Sensor] → [Data acquisition] → [Processing] → [BLE GATT / Local storage] → [Cloud]\n\nERROR HANDLING & WATCHDOG\n[How faults are handled — watchdog timer, error codes, safe state]\n\nBUILD SYSTEM\nBuild tool: [CMake / Makefile / PlatformIO]\nCI/CD: [GitHub Actions — build + flash test]\nFirmware versioning: [Semantic versioning — MAJOR.MINOR.PATCH]` },
    { name: "Cloud Backend & APIs", type: "document", folder: "Cloud & APIs", content: `CLOUD BACKEND & API DESIGN — [PRODUCT NAME]\nStack: [AWS IoT Core / Azure IoT Hub / Google IoT / Custom MQTT broker]\nData store: [TimescaleDB / InfluxDB / DynamoDB / PostgreSQL]\nAPI: [REST / GraphQL / MQTT pub/sub]\n\nARCHITECTURE\n[Device] → [MQTT / HTTPS] → [IoT Core / broker] → [Lambda / Cloud function] → [Database] → [REST API] → [Mobile app]\n\nDEVICE CONNECTIVITY\nProtocol: [MQTT v3.1.1 / v5]\nAuthentication: [Mutual TLS (device certificate) / JWT / API key]\nTopic structure:\n  devices/{deviceId}/telemetry — Device sends sensor data\n  devices/{deviceId}/commands — Cloud sends commands to device\n  devices/{deviceId}/status — Device sends status / heartbeat\n\nKEY API ENDPOINTS\nGET /devices — List user's registered devices\nGET /devices/{id}/data?from=&to= — Get historical sensor data\nPOST /devices/{id}/commands — Send command to device\nGET /devices/{id}/firmware — Get latest firmware version\nPOST /devices — Register a new device (provisioning)\n\nDATA RETENTION\nRaw data: [30 days]  |  Aggregated (hourly avg): [1 year]  |  Reports: [Forever]\n\nSECURITY\nDevice auth: [Unique X.509 cert per device, provisioned at manufacturing]\nAPI auth: [JWT with [expiry]]\nData encryption: [TLS 1.3 in transit / AES-256 at rest]\nDevice OTA: [Signed firmware — ECDSA P-256]` },
    { name: "Manufacturing & Supply Chain Plan", type: "document", folder: "Manufacturing & Supply", content: `MANUFACTURING & SUPPLY CHAIN PLAN — [PRODUCT NAME]\nTarget volume: [# units for first run]  |  Target COGS: $[Amount]\n\nDESIGN STAGES\nEVT (Engineering Validation Test): [# units]  |  Target date: [Date]  |  Purpose: Validate design\nDVT (Design Validation Test): [# units]  |  Target date: [Date]  |  Purpose: Validate manufacturing\nPVT (Production Validation Test): [# units]  |  Target date: [Date]  |  Purpose: Line qualification\nMP (Mass Production): [# units per run]  |  Start date: [Date]\n\nCM (CONTRACT MANUFACTURER)\nCM: [Name]  |  Location: [City, Country]\nTier: [EMS / ODM]  |  Capacity: [Units/month]\nContact: [Name, email]  |  Status: [Quoting / NDA signed / Under contract]\n\nKEY COMPONENT SOURCING\nComponent: [MCU / SOM]  |  Part #: [#]  |  Supplier: [Name]  |  Lead time: [Weeks]  |  Single-source risk: [Y/N]\nComponent: [PMIC]  |  Part #: [#]  |  Supplier: [Name]  |  Lead time: [Weeks]\nComponent: [Battery]  |  Part #: [#]  |  Supplier: [Name]  |  Lead time: [Weeks]\nComponent: [Enclosure]  |  Tooling cost: $[Amount]  |  Lead time: [Weeks]\n\nBOM COST BREAKDOWN\nElectronics (PCB + components): $[Amount]\nEnclosure + tooling amortized: $[Amount]\nPackaging: $[Amount]\nManufacturing / assembly: $[Amount]\nTotal BOM: $[Amount]  |  Target retail: $[Amount]\n\nQUALITY ASSURANCE\nICT (In-circuit test): [Yes / No]  |  FCT (Functional test): [Yes / No]\nAOI: [Yes / No]  |  X-ray inspection (BGA): [Yes / No]\nAcceptable quality level (AQL): [2.5]\nFinal QA test: [% of units — 100% / sampling]` },
    { name: "Mobile App Specification", type: "document", folder: "Cloud & APIs", content: `MOBILE APP SPECIFICATION — [PRODUCT NAME]\nApp name: [Name]  |  Platform: □ iOS  □ Android  □ Cross-platform ([React Native / Flutter])\nMin OS: iOS [14+] / Android [API 29+]\n\nAPP OVERVIEW\n[What does the app do? What is the primary user journey?]\n\nKEY SCREENS\n1. Onboarding / Device pairing\n   - Bluetooth scan for nearby devices\n   - Pairing via QR code / PIN\n   - WiFi provisioning (if applicable)\n2. Home / Dashboard\n   - Real-time sensor readings\n   - Device status (connected / battery level)\n   - Key metrics / charts\n3. Historical Data\n   - Time-series charts (day / week / month)\n   - Export / share data\n4. Settings\n   - Device settings / configuration\n   - Alerts & notifications\n   - Account / profile\n   - Firmware update trigger\n\nBLUETOOTH INTEGRATION\nBLE library: [CoreBluetooth (iOS) / Android BLE API / React Native BLE library]\nScan duration: [X seconds]  |  RSSI filter: [−80 dBm]\nGATT services consumed: [Battery / Custom data / OTA]\n\nNOTIFICATIONS\nPush: [Firebase FCM]\nTriggers: [Threshold alerts / Device offline / Low battery / Firmware available]\n\nDESIGN SYSTEM\n[Design tool: Figma]  |  Prototype: [Figma link]\nComponent library: [Custom / Tailwind / [Design system name]]` },
    { name: "Regulatory & Certification Plan", type: "document", folder: "Business", content: `REGULATORY & CERTIFICATION PLAN — [PRODUCT NAME]\nTarget markets: [US / EU / UK / AU / CA / JP]\n\nUS CERTIFICATIONS\n□ FCC Part 15 (Unlicensed wireless) — Required for: [WiFi / BLE / LoRa]\n  Test lab: [Name]  |  Timeline: [X weeks]  |  Cost: $[Amount]\n□ UL / ETL safety listing — Required for: [Mains-powered products]\n  Test lab: [Name]  |  Timeline: [X weeks]  |  Cost: $[Amount]\n□ ENERGY STAR — Optional: [If applicable]\n□ FDA 510(k) / De Novo — Required for: [Medical device classification]\n\nEU / UK CERTIFICATIONS\n□ CE Mark — Required for all EU sales\n  EMC (EN 301 489): [Testing at lab — Name]\n  Radio (RED — EN 300 328): [Testing]\n  Safety (LVD — EN 62368-1): [Testing]\n□ UKCA Mark — Required for UK sales post-Brexit\n□ WEEE / RoHS compliance\n□ EU Battery Regulation (if rechargeable battery > [Xg])\n□ EU MDR (for medical devices)\n\nOTHER MARKETS\n□ IC (Canada) — [Timing]\n□ TELEC (Japan) — [Timing]\n□ RCM (Australia) — [Timing]\n\nCERTIFICATION TIMELINE\nModule pre-certified: [Yes / No — reduces time/cost significantly]\nFirst cert target: FCC — by [Date]\nCE Mark — by [Date]\nAll major certs — by [Date — before MP start]` },
    { name: "Go-to-Market Plan", type: "document", folder: "Business", content: `GO-TO-MARKET PLAN — [PRODUCT NAME]\nLaunch date: [Date]  |  Launch price: $[Amount]  |  Channel: [DTC / Amazon / B2B / Crowdfunding]\n\nGTM STRATEGY\nPhase 1 — [Early adopter / Beta]: [Target customer, channel, offer]\nPhase 2 — [Broad launch]: [Channel expansion, partnerships]\nPhase 3 — [Scale / Retail / B2B]: [Enterprise / retail entry]\n\nCROWDFUNDING (if applicable)\nPlatform: [Kickstarter / Indiegogo]  |  Goal: $[Amount]\nEarly bird price: $[Amount]  |  Retail price: $[Amount]\nCampaign duration: [X days]  |  Launch date: [Date]\nPre-launch email list target: [# subscribers]\n\nCHANNELS\nDTC website (Shopify): [% of revenue]\nAmazon: [% of revenue]\nB2B / enterprise: [% of revenue]  |  Target sectors: [List]\nRetail: [Planned — Year [X] — retailers: [Names]]\n\nPARTNERSHIPS\nTech partnerships: [Platform integrations — Alexa / Google Home / HomeKit / Slack]\nDistribution partners: [Distributors / reps]\nOEM / white-label: [Partners, terms]\n\nMARKETING\nLead: [Amazon PPC / Google / Meta / PR / YouTube reviews]\nContent: [Unboxing / Review / Setup videos]\nInfluencers / reviewers: [Tech YouTubers / Industry press]\nPR target: [Tech press — TechCrunch / The Verge / product-specific media]\n\nCUSTOMER SUCCESS\nWarranty: [1 / 2 years]  |  Support: [Email / Chat / Forum]\nReturn policy: [30 days]  |  RMA process: [Describe]` },
    { name: "Business Model & Financials", type: "document", folder: "Business", content: `BUSINESS MODEL & FINANCIALS — [COMPANY NAME]\nModel: □ Hardware only  □ Hardware + SaaS  □ Hardware + Data  □ B2B enterprise  □ Platform\n\nREVENUE STREAMS\n1. Hardware: [Price] × [Units] = $[Amount]/year\n2. SaaS / subscription: $[XX]/device/month × [# connected devices] = $[Amount] MRR\n3. Data / analytics (B2B): $[XX]/month per enterprise customer\n4. Professional services / installation: $[Amount]\n\nUNIT ECONOMICS\nHardware:\nASP: $[Amount]  |  BOM: $[Amount]  |  Landed COGS: $[Amount]\nHardware gross margin: [%]\n\nSaaS (if applicable):\nMRR per device: $[Amount]  |  CAC (device): $[Amount]  |  LTV (12 mo): $[Amount]\nSaaS gross margin: [~80%]\n\nBLENDED UNIT ECONOMICS\nFirst-year revenue per device: $[Hardware + 12mo SaaS]\nFirst-year COGS per device: $[Hardware COGS + hosting]\nFirst-year gross profit: $[Amount]  |  First-year gross margin: [%]\n\n5-YEAR PROJECTIONS\nYear 1: [#] units sold / [#] connected devices — Revenue: $[Amount]\nYear 2: [#] units / [#] devices — Revenue: $[Amount]\nYear 3: [#] units / [#] devices — Revenue: $[Amount]\nYear 4: [#] / [#] — Revenue: $[Amount]\nYear 5: [#] / [#] — Revenue: $[Amount]\n\nFUNDING\nRaised to date: $[Amount]  |  Runway: [X months]\nCurrent raise: $[Amount] [Seed / Series A]  |  Lead: [Name / TBD]` },
  ],

  "AR/VR / Metaverse": [
    { name: "Experience Concept & Design Brief", type: "document", folder: "Experience Design", content: `EXPERIENCE CONCEPT & DESIGN BRIEF — [EXPERIENCE NAME]\nExperience type: □ VR application  □ AR app / filter  □ Mixed reality  □ Metaverse space  □ Spatial computing\nPlatform(s): □ Meta Quest  □ Apple Vision Pro  □ HoloLens  □ Web (WebXR)  □ Mobile AR (iOS/Android)  □ PCVR\nEngine: □ Unity  □ Unreal Engine  □ Web (Three.js / Babylon.js / A-Frame)\n\nCONCEPT STATEMENT\n[What is this experience? What is the central idea, world, or mechanic? What should a user feel or accomplish?]\n\nCORE LOOP\n[What does the user DO, moment to moment? What is the core interaction loop?]\nStep 1: [User does X]\nStep 2: [System responds with Y]\nStep 3: [User achieves Z]\nStep 4: [Loop continues / deepens]\n\nKEY DESIGN PRINCIPLES\n1. [Comfort first — minimize motion sickness triggers]\n2. [Intuitive affordances — world must teach its own rules]\n3. [Spatial audio — sound design is 3D and directional]\n4. [Presence — every element reinforces immersion]\n\nTARGET AUDIENCE\nWho: [Gamers / Enterprise workers / Healthcare / Education / Consumer]\nXR experience level: [First-timer / Enthusiast / Expert]\nHardware access: [Quest standalone / PCVR / Mobile / Apple Vision Pro]\n\nKEY SCENES / SPACES\n1. [Entry / Hub space]: [Description]\n2. [Main experience space]: [Description]\n3. [Secondary space / Level 2]: [Description]` },
    { name: "Technical Architecture", type: "document", folder: "Development & Engine", content: `TECHNICAL ARCHITECTURE — [EXPERIENCE NAME]\nEngine: [Unity [version] / Unreal [version]]  |  XR SDK: [OpenXR / Meta XR SDK / ARKit / ARCore / MRTK]\nTarget platform: [Meta Quest 3 / PCVR / Apple Vision Pro / HoloLens / WebXR]\nMin specs: [CPU / GPU / RAM target for standalone / PC]\n\nRENDERING\nRender pipeline: [URP / HDRP / Built-in / Nanite+Lumen (UE5)]\nTarget resolution: [Per eye — e.g., 1832×1920 (Quest 3)]\nTarget frame rate: [90 Hz / 72 Hz]\nAnti-aliasing: [MSAA 4x / TAA]\nPerformance budget:\n  Draw calls: < [X]\n  Triangle count (per frame): < [Xk]\n  Texture budget: [MB]\n\nINPUT SYSTEM\nController input: [Meta Touch / Index Knuckles / Hand tracking]\nHand tracking: [Yes / No]  |  SDK: [OpenXR hand tracking / Meta Hand SDK]\nEye tracking (if supported): [Yes / No]\nPassthrough / mixed reality: [Yes / No — OST or VST]\n\nPHYSICS & INTERACTIONS\nPhysics engine: [PhysX / Chaos]\nInteraction pattern: [Grab / Poke / Ray cast / Near-field]\nHaptics: [Controller rumble — [pattern description]]\n\nNETWORKING (multiplayer, if applicable)\nNetworking framework: [Photon Fusion / Mirror / Normcore / Netcode for GameObjects]\nMax concurrent users: [#]  |  Topology: [Client-server / P2P]\nVoice: [Vivox / Photon Voice / Agora]\n\nBUILD & DISTRIBUTION\nBuild targets: [Quest store / Sidequest / PCVR / App Store (visionOS)]\nCI/CD: [GitHub Actions + Unity Cloud Build]` },
    { name: "Asset Production Pipeline", type: "document", folder: "Assets & Content", content: `ASSET PRODUCTION PIPELINE — [EXPERIENCE NAME]\n\nART STYLE GUIDE\nVisual style: [Photorealistic / Stylized / Toon / Sci-fi / Fantasy / Minimalist]\nKey reference images: [Attach or link to mood board]\nColor palette: [Primary, secondary, accent, neutral — hex codes]\nMaterial language: [PBR materials — metallic/roughness workflow]\n\n3D ASSET STANDARDS\nPoly budget (hero assets): < [X,000] tris\nPoly budget (background): < [X,000] tris\nTexture resolution (hero): [2048×2048]\nTexture resolution (background): [512–1024]\nTexture format: [BC7 / ASTC for Quest / PNG source]\nNaming convention: [prefix_category_name_v01]\nFile format source: [FBX / glTF / USD]\nLOD levels: [LOD0–LOD2 for complex objects]\n\nCHARACTER / AVATAR (if applicable)\nRigging standard: [Humanoid / Generic — matching [engine] avatar system]\nBlendshapes: [Facial expressions / Lip sync]\nPoly budget (avatar): [Xk tris]\n\nAUDIO STANDARDS\nSpatial audio engine: [Unity Resonance / Steam Audio / Meta Spatial Audio]\nFile format: [WAV 48kHz 24-bit source → compressed in engine]\nSoundscape: [Ambient layers / Object sounds / UI sounds / Voice]\n\nANIMATION\nCharacter animation: [Mocap / Keyframe / Procedural]\nEnvironment animation: [Particle systems / Shader animations / Physics sims]\n\nASSET PIPELINE TOOLS\nModeling: [Blender / Maya / 3ds Max]\nTexturing: [Substance Painter / Quixel Mixer]\nPrototyping: [ProBuilder / Greyboxing first]` },
    { name: "Multiplayer & Social Design", type: "document", folder: "Development & Engine", content: `MULTIPLAYER & SOCIAL DESIGN — [EXPERIENCE NAME]\n\nSOCIAL EXPERIENCE OVERVIEW\n[Is this single-player, co-op, competitive, or social? What makes the multi-user experience compelling?]\n\nSESSION STRUCTURE\nMax users per instance: [#]\nSession type: [Public / Private / Invite-only / Hybrid]\nMatchmaking: [Random / Friend lobby / Skill-based]\nPersistence: [Session-based / Persistent world]\n\nAVATAR SYSTEM\nAvatar type: [Full body / Half body / Head + hands]\nCustomization: [Skin / Clothing / Accessories]\nAvatar source: [Platform avatar / Custom / Ready Player Me]\nBody IK: [Full body IK / Upper body only]\n\nSOCIAL FEATURES\n□ Voice chat — spatial audio  |  Provider: [Vivox / Photon / Agora]\n□ Text chat  □ Gestures / emotes  □ Object sharing / interaction\n□ Whiteboard / collaboration tools\n□ Event hosting (presentations, gatherings)\n□ Persistent rooms / spaces users can own\n\nMODERATION\nSafe zone / personal space: [Bubble — auto-enabled when users get within [X]m]\nReporting / blocking: [Available from pause menu / watch menu]\nVoice moderation: [AI moderation / community reporting]\nAge verification: [Platform-level / additional]\n\nNETWORK QUALITY\nTarget latency: < [50ms] for voice / [100ms] for physics sync\nBandwidth per user: < [X Mbps]\nFallback for poor connection: [Reduce avatar fidelity / physics off]` },
    { name: "Monetization & Business Model", type: "document", folder: "Business", content: `MONETIZATION & BUSINESS MODEL — [EXPERIENCE NAME]\nModel: □ One-time purchase  □ Freemium  □ Subscription  □ Virtual economy  □ Enterprise SaaS  □ Free (ad-supported)\n\nREVENUE STREAMS\n1. [One-time purchase]: $[XX] on [Platform store]\n2. [Virtual goods / cosmetics]: In-experience items — [currency: [$] or virtual currency]\n3. [Season pass / battle pass]: $[XX] — content refresh every [X weeks]\n4. [Enterprise licensing]: $[XX/seat/month] — for [Training / Collaboration / Events]\n5. [Creator marketplace]: [%] rev share on user-created content\n\nVIRTUAL ECONOMY (if applicable)\nCurrency: [Currency name]\nPurchase: $[1 USD] = [X coins]\nEarning: [Through gameplay / rewards / watching / creating]\nMarketplace: [Trade / sell user-created items]\nSink mechanisms: [What removes currency from economy]\n\nPLATFORM ECONOMICS\nMeta Quest store: [30%] platform fee\nApple Vision Pro (App Store): [30%] platform fee\nSteam: [30%] (negotiable at volume)\nSidequest / direct: [0% — self-distributed]\n\nTARGET METRICS\nInstalls / users: [# target by [Date]]\nDAU / MAU: [Target ratio — [%]]\nARPU (avg rev per user): $[Amount]\nLTV: $[Amount]\nConversion (free → paid): [%]\n\nENTERPRISE GTM (if applicable)\nTarget sectors: [Healthcare training / Real estate / Industrial / Events]\nICP: [Company size, buyer, use case]\nDeal size: $[Amount] ARR` },
    { name: "Launch & Distribution Plan", type: "document", folder: "Platform & Distribution", content: `LAUNCH & DISTRIBUTION PLAN — [EXPERIENCE NAME]\nLaunch date: [Date]  |  Platform(s): [Meta Quest Store / App Store / Steam / SideQuest / WebXR]\n\nPLATFORM CERTIFICATION\nMeta Quest Store:\n□ App Lab submission (early access)\n□ Quest Store submission (full review — [4–8 weeks])\n□ Store listing: Title / Description / Screenshots / Trailer / Capsule art\nApple Vision Pro (App Store):\n□ visionOS app review ([1–3 days typical])\nSteam (PCVR):\n□ Steam page created  □ 30-day notice for release\n□ Coming soon page live (wishlist building)\n\nLAUNCH TRAILER\nDuration: [90 sec]  |  Format: [Cinematic gameplay / Experience preview]\nShots needed: [Gameplay + reaction shots + use case shots]\nDeadline for delivery: [Date]\n\nPRE-LAUNCH MARKETING\n□ Press kit: Screenshots + trailer + press release\n□ YouTube review seeding: [Channels — UploadVR / VR reviewer list]\n□ Reddit (r/OculusQuest / r/virtualreality): [AMA / launch post]\n□ Discord community: [Server created — [# members at launch]]\n□ Creator / influencer: [# creators gifted early access]\n\nPRESS TARGETS\n[UploadVR] — [Contact]\n[Road to VR] — [Contact]\n[VRScout] — [Contact]\n[Mainstream tech press] — [Specific editor]\n\nPOST-LAUNCH\nWeek 1: Monitor reviews / ratings — respond to all\nWeek 2: First patch if critical bugs\nMonth 2: First content update / DLC\nMonth 3: Review ask from engaged users` },
    { name: "User Testing & Comfort Protocol", type: "document", folder: "Experience Design", content: `USER TESTING & COMFORT PROTOCOL — [EXPERIENCE NAME]\n\nCOMFORT DESIGN STANDARDS\nLocomotion method: □ Teleportation  □ Smooth locomotion (with vignette)  □ Room-scale only  □ On-rails\nTunnel vignette: [On by default for smooth locomotion]  |  User can disable: □ Yes\nSickscore target: [< 10 SSQ (Simulator Sickness Questionnaire)]\nCaution signs: [Warning screen on launch — yes, per platform requirement]\n\nDESIGN RULES TO PREVENT DISCOMFORT\n□ Camera never moves without user input (no forced cam movement)\n□ Fixed reference points in FOV (cockpit, hand controllers)\n□ Frame rate lock: never below [72 Hz] on target hardware\n□ Acceleration is instant (never lerp locomotion)\n□ Rotation snap-turn default: [30°] increments\n□ UI elements are world-anchored, not HUD (avoid persistent screen-space UI)\n□ Minimum 0.5m comfortable interaction distance\n\nTEST PLAN\nPhase 1 — Internal (Alpha):\n□ Dev team dogfooding\n□ Frame rate profiling on target hardware (all levels)\n□ Interaction tests for all input methods\nPhase 2 — External beta ([# users]):\n□ SSQ administered pre and post session\n□ SUS (System Usability Scale) questionnaire\n□ Think-aloud protocol recorded\n□ Session duration tested: [target session = X min comfortable]\nPhase 3 — Certification test:\n□ Platform compliance checks (Quest / visionOS guidelines)` },
    { name: "Accessibility & Inclusion Guidelines", type: "document", folder: "Experience Design", content: `ACCESSIBILITY & INCLUSION GUIDELINES — [EXPERIENCE NAME]\n\nWHY ACCESSIBILITY MATTERS\n[Brief statement on the team's commitment to inclusive XR design]\n\nCOMFORT OPTIONS\n□ Smooth vs. teleport locomotion toggle\n□ Comfort vignette intensity: [Off / Low / Medium / High]\n□ Snap turn vs. smooth turn toggle\n□ Seated mode: [Full experience playable seated]\n□ Height calibration: [Adjustable — for seated users, shorter / taller users]\n□ Dominant hand switch: [Left / Right]\n\nVISUAL ACCESSIBILITY\n□ Subtitles / closed captions: [Available for all dialogue and audio cues]\n□ Color blind modes: [Deuteranopia / Protanopia / Tritanopia]\n□ High contrast UI option\n□ Text size: [Adjustable]\n□ Dyslexia-friendly font option: [OpenDyslexic]\n\nAUDIO ACCESSIBILITY\n□ Spatial audio with visual indicators for deaf / hard-of-hearing users\n□ Subtitle positioning customizable\n□ Haptic substitutions for audio cues where possible\n□ Volume controls: Master / Music / SFX / Voice separate\n\nMOTOR ACCESSIBILITY\n□ One-handed mode supported\n□ No timed interactions required (or adjustable time limit)\n□ Large interaction zones (easier to grab/poke)\n□ Auto-grab / hold toggle\n\nCOGNITIVE ACCESSIBILITY\n□ Clear onboarding and tutorials (skippable)\n□ Pause at any point\n□ Save at any point (no frustrating checkpoints)\n□ Adjustable difficulty / experience intensity` },
  ],

  "Media & Publishing": [
    { name: "Editorial Mission & Voice Guide", type: "document", folder: "Editorial & Content", content: `EDITORIAL MISSION & VOICE GUIDE — [PUBLICATION NAME]\nType: □ Newsletter  □ Magazine  □ Blog  □ Podcast  □ Video channel  □ Social media  □ Mixed media\nPublishing cadence: [Daily / Weekly / Biweekly / Monthly]\nPrimary channel: [Substack / Website / App / Email / YouTube]\n\nMISSION STATEMENT\n[Who is this for, what do you cover, and why does it matter? In 2–3 sentences.]\n\nEDITORIAL PHILOSOPHY\n[What do you believe about [your topic] that drives your coverage? What's your editorial worldview?]\n\nVOICE & TONE\nPersonality: [Smart / Conversational / Irreverent / Expert / Curious / Opinionated]\nPerspective: [First-person editorial / Neutral / Strongly opinionated]\nFormality: [Casual / Professional / Academic]\nWhat we never do: [Clickbait / Sensationalism / Affiliate shilling / Vague claims]\n\nCOVERAGE MANDATE\nWe cover: [Define scope clearly]\nWe don't cover: [Define what's out of scope]\nWe always include: [Data / expert voices / historical context / actionable insights]\n\nIDEAL READER\n[Specific portrait — job, reading habits, what they do with what they learn, what they're tired of]\n\nCOMPETITIVE LANDSCAPE\n[Publication 1]: [How they're different from us]\n[Publication 2]: [How they're different]\nOur white space: [What we do that nobody else does the same way]` },
    { name: "Content Pipeline & Editorial Calendar", type: "document", folder: "Content Pipeline", content: `CONTENT PIPELINE & EDITORIAL CALENDAR — [PUBLICATION NAME]\nCadence: [# pieces/week]  |  Team size: [# editors / writers / contributors]\nPlanning cycle: [Rolling [4-week] / Seasonal / Annual]\n\nCONTENT TYPES\n[Type 1]: [Deep dive / investigation / long-form] — [Length, frequency]\n[Type 2]: [News analysis / quick take] — [Length, frequency]\n[Type 3]: [Interview / profile] — [Length, frequency]\n[Type 4]: [Data / infographic / research] — [Frequency]\n[Type 5]: [Sponsored content / partner feature] — [Rules for this]\n\nEDITORIAL CALENDAR (rolling 4-week view)\n\nWEEK 1\n[Date]: [Piece title / topic]  |  Author: [Name]  |  Status: [Assigned / In progress / Done]\n[Date]: [Piece title]  |  Author: [Name]  |  Status: [Status]\n\nWEEK 2\n[Date]: [Piece title]  |  Author: [Name]  |  Status: [Status]\n\nWEEK 3\n[Date]: [Piece title]  |  Author: [Name]  |  Status: [Status]\n\nWEEK 4\n[Date]: [Piece title]  |  Author: [Name]  |  Status: [Status]\n\nCONTENT STAGES\nIdea → Assigned → Draft due → Editor review → [Revisions] → Final approval → Scheduled → Published → Distributed\nDraft lead time: [X days before publish]\nFinal sign-off: [Editor in chief / Senior editor]\n\nSEASONAL / EVERGREEN MIX\nEvergreen target: [%] of output — builds SEO and long-term traffic\nTimely / news-driven: [%] of output` },
    { name: "Audience Growth Strategy", type: "document", folder: "Distribution & Reach", content: `AUDIENCE GROWTH STRATEGY — [PUBLICATION NAME]\n\nCURRENT STATE\nSubscribers / followers: [#] (as of [Date])\nMonthly readers / views: [#]\nOpen rate (email): [%]  |  Click rate: [%]\nTop acquisition channel: [SEO / Social / Word of mouth / Paid]\n\nGROWTH TARGETS\n[3 months]: [#] subscribers\n[12 months]: [#] subscribers\nEmail list growth rate target: [+[#] subscribers/week]\n\nACQUISITION CHANNELS\nSEO / organic search:\n• Target keywords: [List 5–10 pillar topic areas]\n• Content strategy: [Pillar pages / cluster content / FAQ content]\n• Tool: [Ahrefs / SEMrush / Google Search Console]\n\nSocial media:\n• [Twitter/X]: [Content strategy — [X posts/day]]\n• [LinkedIn]: [Strategy — [X posts/week]]\n• [TikTok / YouTube / Instagram]: [Strategy]\n\nReferral & partnerships:\n• Newsletter swaps: [Target publications — [X/month]]\n• Podcast appearances: [# per month]\n• Guest bylines: [Target publications]\n\nPaid acquisition (if applicable):\n• Budget: $[Amount]/month  |  Platform: [Meta / LinkedIn / Google / X]\n• Target CPL (cost per subscriber): < $[Amount]\n\nRETENTION\nChurn rate: [%/month]  |  Target: < [X]%\nRe-engagement sequence: [Triggered after [X days] of no open]\nBest-of / archival content: [Promoted to new subscribers]` },
    { name: "Monetization & Revenue Strategy", type: "document", folder: "Monetization & Revenue", content: `MONETIZATION & REVENUE STRATEGY — [PUBLICATION NAME]\n\nMONETIZATION MIX\n1. [Paid subscriptions] — [%] of revenue\n2. [Advertising / sponsorships] — [%] of revenue\n3. [Events / conferences] — [%] of revenue\n4. [Courses / products] — [%] of revenue\n5. [Affiliate commissions] — [%] of revenue\n\nSUBSCRIPTION (if applicable)\nPlatform: [Substack / Ghost / Beehiiv / Custom]\nFree tier: [What's included — builds audience]\nPaid tier: $[Amount]/month or $[Amount]/year  |  [What's exclusive]\nCurrent paid subscribers: [#]  |  Conversion rate (free → paid): [%]\nPaid subscriber target: [#] generating $[Amount] MRR\n\nSPONSORSHIPS / ADVERTISING\nSponsor types: [Newsletter sponsor / Podcast sponsor / Banner / Dedicated send]\nNewsletter sponsor rate: $[Amount] per issue ([# subscribers])\nRate card basis: [CPM: $[XX] per 1,000 opens]\nSponsors: [# current]  |  Sponsor pipeline: [# being outreach to]\nBlacklist: [Categories we won't accept — [Competitors / sensitive industries]]\n\nAFFILIATE\nPrograms: [Amazon / ConvertKit / [Tool names] — commission rates]\nDisclosure policy: [Always disclosed, only products we genuinely use/recommend]\n\nEVENTS\n[Annual summit / virtual event / workshop]: $[Amount] revenue target\nTickets: $[Amount] × [#] | Sponsorship: $[Amount]` },
    { name: "Writer & Contributor Guidelines", type: "document", folder: "Editorial & Content", content: `WRITER & CONTRIBUTOR GUIDELINES — [PUBLICATION NAME]\nVersion: [#]  |  Date: [Date]\n\nWHO WE PUBLISH\n[Who is the ideal contributor? Practitioner-experts? Journalists? Academics?]\n[We [do / don't] accept pitches from PR agencies.]\n[We [do / don't] publish branded content from companies.]\n\nHOW TO PITCH\nPitch email: [submissions@[domain].com]\nPitch format: [Subject line format] + [What to include in the pitch]\n[One-paragraph idea summary / Proposed angle / Why you're the right person to write it]\nResponse time: [We respond to all pitches within [X] business days.]\n\nWRITING STANDARDS\nLength: [Short: [Word range] / Medium: [Word range] / Long: [Word range]]\nTone: [See Voice & Tone guide above]\nSources: [Minimum [#] named sources / [#] studies / [#] data points]\nNo: [Brand-positive language / Unverified claims / Generic advice / Passive voice]\nYes: [First-person analysis / Contrarian takes when backed by evidence / Concrete examples]\n\nEDITORIAL PROCESS\nDraft submission: [Via Google Doc / direct to CMS]\nEditor feedback: [Within [X] business days of receipt]\nRevision rounds: [Up to [2] rounds included]\nFinal approval: [Editor in chief]\nPublishing timeline: [# weeks from acceptance to publication]\n\nPAYMENT (if applicable)\n[Short piece]: $[Amount] flat fee\n[Long piece]: $[Amount] flat fee\n[Byline only (for exposure)]: [We do / don't offer this]\nPayment terms: [Net [X] days from publication via [PayPal / Wire / Check]]` },
    { name: "Tech Stack & Publishing Workflow", type: "document", folder: "Distribution & Reach", content: `TECH STACK & PUBLISHING WORKFLOW — [PUBLICATION NAME]\n\nCONTENT MANAGEMENT\nCMS: [Ghost / WordPress / Webflow / Contentful / Sanity]\nURL: [https://[domain]]\nEmail platform: [Substack / Beehiiv / ConvertKit / Mailchimp]\nNewsletter + CMS: [Same tool / Integrated]\n\nCONTENT WORKFLOW\n1. Idea captured in [Notion / Airtable / Linear]\n2. Assigned to writer — deadline set\n3. Draft submitted via [Google Docs / CMS draft mode]\n4. Editor review — feedback via [comments / tracked changes]\n5. Revisions complete\n6. Final proofread\n7. SEO review (titles, meta, alt text, internal links)\n8. Scheduled in CMS: [X days before publish]\n9. Email send scheduled: [Time — [Day] at [Time] [TZ]]\n10. Social media posts scheduled: [Tool: Buffer / Hootsuite / Typefully]\n\nSOCIAL DISTRIBUTION\nPlatforms: [Twitter/X / LinkedIn / Instagram / Threads / TikTok / YouTube]\nTool: [Buffer / Hootsuite / Typefully / Manual]\nRSS-to-social automation: [Yes — Zapier + Buffer]\n\nANALYTICS\nWeb analytics: [Google Analytics 4 / Plausible / Fathom]\nEmail analytics: [Open rate / Click rate — platform native]\nReferral tracking: [UTM parameters on all distributed links]\nWeekly metrics review: [Who reviews, what metrics matter]\n\nSEO TOOLS\n[Ahrefs / SEMrush / Surfer SEO / Google Search Console]\nKeyword strategy: [Pillar topic approach — [X] pillar pieces + [X] supporting clusters]` },
    { name: "Partnership & Licensing Strategy", type: "document", folder: "Distribution & Reach", content: `PARTNERSHIP & LICENSING STRATEGY — [PUBLICATION NAME]\n\nCONTENT LICENSING\nCan our content be republished? [Yes — with credit and link / Yes — paid license / No]\nSyndication partners: [Medium / LinkedIn articles / [Major publication]]\nLicensing model: [Flat fee / Revenue share / Free with attribution]\nLicense inquiry: [licensing@[domain].com]\n\nNEWSLETTER GROWTH PARTNERSHIPS\nSwap partners: [Similar publications for cross-promotion]\nTarget swap size match: [Within [2]x of our subscriber count]\nSwap format: [Mention / Dedicated section / Co-authored issue]\nMonthly swaps: [#] per month\n\nBRAND PARTNERSHIPS\nSponsored content rules: [Must be clearly labeled / Must align with editorial values]\nApproved categories: [SaaS tools / Books / Events / [Industry-specific]]\nProhibited: [Competitors / [List categories]]\nPartnership inquiry: [sponsorships@[domain].com]\n\nINSTITUTIONAL PARTNERSHIPS\n[University research partnerships — joint studies / exclusive data access]\n[Industry association — official media partner]\n[Conference / event — media partner deal]\n\nDISTRIBUTION DEALS\n[App / aggregator — Apple News / Google News / Flipboard / Feedly]\n[Podcast distribution — Spotify / Apple Podcasts / all major platforms]\n[Video — YouTube + any exclusive platform deals]\n\nINTERNATIONAL / TRANSLATION\nTranslation partners: [Languages targeted]\nRegional edition strategy: [Single global / Localized editions]` },
    { name: "Analytics & Performance Dashboard", type: "document", folder: "Analytics", content: `ANALYTICS & PERFORMANCE DASHBOARD — [PUBLICATION NAME]\nReporting period: [Weekly / Monthly]  |  Reviewed by: [Editor / Publisher]\n\nAUDIENCE METRICS\nTotal subscribers / followers:\n  Email list: [#]  |  Change: [+/–#] vs. last period\n  [Platform 1]: [#]  |  Change: [+/–#]\n  [Platform 2]: [#]  |  Change: [+/–#]\nMonthly unique visitors: [#]  |  Change: [%]\n\nENGAGEMENT METRICS\nEmail open rate: [%]  |  Industry avg: [%]  |  Click rate: [%]\nAvg time on page: [X min]  |  Scroll depth: [%]\nTop content (this period):\n  1. [Piece title] — [# opens / views / shares]\n  2. [Piece title] — [# opens / views]\n  3. [Piece title] — [# opens / views]\n\nGROWTH METRICS\nNew subscribers: [#]  |  Source breakdown:\n  Organic / SEO: [%]  |  Social: [%]  |  Referral: [%]  |  Paid: [%]\nUnsubscribes: [#]  |  Churn rate: [%]\nNet growth: [+/–#]\n\nREVENUE METRICS\nMRR (paid subs): $[Amount]  |  Change: [%]\nSponsor revenue: $[Amount]\nOther: $[Amount]\nTotal revenue: $[Amount]  |  vs. goal: [%]\n\nACTIONS FROM THIS REPORT\n1. [Insight → Action]\n2. [Insight → Action]\n3. [Test to run next period: Test X vs. Y for metric Z]` },
  ],

  "FinTech": [
    { name: "Product Vision & Compliance Scope", type: "document", folder: "Product & Compliance", content: `PRODUCT VISION & COMPLIANCE SCOPE — [PRODUCT NAME]\nCategory: □ Payments  □ Lending  □ Neobank  □ Wealthtech  □ InsurTech  □ Embedded Finance  □ B2B Fintech\nTarget market: □ Consumer (B2C)  □ SMB  □ Enterprise  □ Developer/API\n\nPROBLEM & SOLUTION\nProblem: [What financial pain point are you solving?]\nSolution: [How do you solve it — product/service description]\nUnique angle: [Why yours vs. existing banks/fintechs?]\n\nPRODUCT OVERVIEW\nCore product: [Name + description]\nKey features:\n1. [Feature — e.g., instant ACH transfer]\n2. [Feature — e.g., AI-powered spend analytics]\n3. [Feature — e.g., programmable card controls]\n\nCOMPLIANCE SCOPE\nRegulatory framework: □ PCI DSS  □ BSA/AML  □ KYC/KYB  □ CFPB  □ PSD2  □ FCA  □ MAS  □ GDPR\nLicensing required: [Money transmitter license / Banking charter / E-money license / Broker-dealer]\nBank partner (if BaaS): [Evolve / Column / Thread / Sutton / other]\nCompliance lead: [Name or TBD]  |  Outside counsel: [Firm or TBD]\n\nMONETIZATION\nRevenue model: □ Interchange  □ Subscription  □ Lending spread  □ SaaS fee  □ Transaction fee  □ AUM fee\nPricing: [Describe]\nUnit economics: CAC $[X]  |  LTV $[X]  |  Take rate [%]  |  Net revenue retention [%]` },
    { name: "Regulatory & Licensing Roadmap", type: "document", folder: "Product & Compliance", content: `REGULATORY & LICENSING ROADMAP — [COMPANY NAME]\n\nCURRENT STATUS\nIncorporation: [State / jurisdiction]  |  Date: [Date]\nEIN: [Obtained / Pending]\nData privacy policy: [Published / In review]\n\nLICENSING REQUIREMENTS\nMoney Transmitter License (MTL):\n  States required: [List states where license needed before launch]\n  Application timeline: [3–18 months per state]\n  Surety bond requirement: [Varies by state — $[X] average]\n  Expedited states: [TX, WY — faster processing]\n\nAlternatives to direct licensing:\n  □ Bank sponsor model (partner bank holds charter) — [Bank name or TBD]\n  □ Agent of bank — [Bank name]\n  □ Acquire licensed entity\n\nFEDERAL REGISTRATIONS\n□ FinCEN MSB registration — deadline: [Within 180 days of starting business]\n□ CFPB registration (if applicable)\n□ SEC/FINRA registration (if investment product)\n\nBSA/AML PROGRAM\n□ BSA Officer designated: [Name]\n□ AML policy written: [Yes / In progress]\n□ Transaction monitoring system: [Sardine / Unit21 / ComplyAdvantage / Custom]\n□ SAR filing process documented\n□ CIP (Customer ID Program) implemented\n\nTIMELINE\nQ[X]: FinCEN registration, legal entity, bank partner signed\nQ[X]: MTL applications filed — [Priority states]\nQ[X]: Soft launch (bank sponsor model) — [States covered]\nQ[X]: Direct MTLs received — expand to [X] states` },
    { name: "Engineering Architecture & API Design", type: "document", folder: "Engineering", content: `ENGINEERING ARCHITECTURE — [PRODUCT NAME]\n\nSYSTEM OVERVIEW\n[High-level description of the platform and its components]\n\nCORE SERVICES\n1. [Auth service] — [JWT / OAuth2 / Passkeys] — [Auth0 / Cognito / Custom]\n2. [Core ledger] — [Double-entry accounting / Real-time balance engine]\n3. [Payment rails] — [ACH / RTP / Wire / Card] — [Processor: Stripe / Adyen / Moov / Column]\n4. [KYC/KYB service] — [Alloy / Persona / Sardine / Jumio]\n5. [Fraud & risk] — [Unit21 / Sift / Sardine / Internal ML]\n6. [Notifications] — [Email: SendGrid / SMS: Twilio / Push: FCM]\n\nINFRASTRUCTURE\nCloud: [AWS / GCP / Azure]  |  Region: [us-east-1 / etc.]\nDatabase: [PostgreSQL / Aurora] — [PCI zone, encrypted at rest AES-256]\nMessage queue: [SQS / Kafka / RabbitMQ] — for async payment processing\nSecrets management: [AWS Secrets Manager / HashiCorp Vault]\nObservability: [Datadog / New Relic / Grafana + Prometheus]\n\nSECURITY ARCHITECTURE\nEncryption at rest: AES-256  |  In transit: TLS 1.3 minimum\nTokenization: [Card data tokenized via PCI-compliant vault — Basis Theory / Spreedly]\nSecret scanning: [Gitguardian / TruffleHog]\nPen testing: [Annual + after major releases]\nSOC 2 Type II: [Target completion: Q[X]]\n\nAPI DESIGN\nStyle: REST + webhooks  |  Auth: OAuth 2.0 + API keys\nVersioning: URL versioning (/v1/)\nRate limiting: [X req/sec per key]\nWebhook retry: [3 retries with exponential backoff]\nSDKs: [Node.js / Python / Go / Java — planned]` },
    { name: "Risk & Fraud Framework", type: "document", folder: "Risk & Fraud", content: `RISK & FRAUD FRAMEWORK — [COMPANY NAME]\n\nRISK TAXONOMY\nCredit risk: [If lending — scoring model, loss reserves]\nFraud risk: [Account takeover, synthetic identity, payment fraud, friendly fraud]\nCompliance risk: [BSA/AML violations, sanctions]\nOperational risk: [System downtime, third-party failure]\nLiquidity risk: [Float, settlement timing]\n\nFRAUD DETECTION\nFirst-party fraud signals:\n• Device fingerprinting: [Sardine / Seon / Custom]\n• Behavioral biometrics: [NeuroID / BioCatch / ThreatMetrix]\n• Velocity checks: [X transactions / $X in Y hours]\n• Linked account graph: [Detect synthetic identities via shared data points]\n\nThird-party fraud signals:\n• Email/phone risk scoring: [Ekata / Melissa]\n• Document verification: [Persona / Jumio / Onfido]\n• Bank account verification: [Plaid Auth / Argyle / MX]\n\nTRANSACTION MONITORING\nTool: [Unit21 / ComplyAdvantage / Actimize / Internal]\nRules engine: [Threshold alerts / velocity rules / pattern matching]\nSAR filing workflow: [Alert → Review → Escalate → File within 30 days]\n\nDISPUTE & CHARGEBACK MANAGEMENT\nDispute resolution SLA: [X business days]\nChargeback representment: [In-house / Midigator / Chargebacks911]\nTarget chargeback rate: < 0.1% (Visa/Mastercard threshold)\n\nKEY METRICS\nFraud rate target: < [X]% of TPV\nFalse positive rate: < [X]% (user friction goal)\nSAR filing rate: [Benchmark]\nMLRO / BSA officer: [Name]` },
    { name: "Go-to-Market & Growth Strategy", type: "document", folder: "Growth & Partnerships", content: `GO-TO-MARKET & GROWTH STRATEGY — [COMPANY NAME]\n\nTARGET CUSTOMER\nPrimary: [Consumer segment / SMB type / Enterprise buyer persona]\nICP detail: [Age / income / business size / pain point / current solution]\nAddrressable market: TAM $[X]B  |  SAM $[X]B  |  SOM $[X]M (year 1)\n\nGTM MOTION\n□ Product-led growth (PLG) — self-serve, freemium, viral\n□ Sales-led — SDR/AE model, outbound\n□ Partnership-led — bank partners, embedded distribution\n□ Community-led — creator finance, niche community\n\nGROWTH CHANNELS\nChannel 1 — [e.g., Referral / Word of mouth]:\nMechanic: [How it works]\nTarget CAC: $[X]  |  Volume: [# users/month]\n\nChannel 2 — [e.g., Content / SEO]:\nPrimary keywords: [List]\nConversion path: [Search → Landing page → Signup]\n\nChannel 3 — [e.g., Partnerships / Banking as a Service distribution]:\nPartner type: [API partner / SaaS platform / Payroll co / Employer]\nRevenue share model: [Describe]\n\nACTIVATION & RETENTION\nFirst value moment (aha): [User achieves [X] within [Y] minutes/days]\nOnboarding steps: [KYC → Fund account → First transaction]\nRetention levers: [Direct deposit stickiness / Rewards / Daily active use hooks]\n\nKEY METRICS\nCAC: $[X]  |  Payback period: [X months]\nLTV: $[X]  |  LTV:CAC ratio target: >[3]x\nMonthly active users (MAU) target: [#] at [12 months]` },
    { name: "Financial Model & Unit Economics", type: "document", folder: "Finance & Ops", content: `FINANCIAL MODEL & UNIT ECONOMICS — [COMPANY NAME]\n\nREVENUE STREAMS\n1. [Interchange] — [%] of [card spend / TPV]  |  Est. rate: [1.5–2.5]% (credit) / [0.2–0.6]% (debit)\n2. [Subscription] — $[X]/month per [user / seat / account]\n3. [Lending spread] — [X]% net interest margin\n4. [Transaction fees] — $[X] per [wire / ACH / FX conversion]\n5. [AUM/Advisory fee] — [X] bps per year on [AUM]\n\nCOST STRUCTURE\nCOGS (variable):\n  Banking partner / sponsor bank fee: [X]% or $[X] per account\n  Payment processing: [Interchange out / Wire cost / ACH cost]\n  KYC/fraud tooling: $[X] per verified user\n  Card issuance: $[X] per card\n  Customer support (tier 1): $[X] per contact\n\nFixed costs:\n  Engineering team: $[X]/month\n  Compliance & legal: $[X]/month\n  Infrastructure: $[X]/month\n  Insurance (D&O, cyber, E&O): $[X]/month\n\nUNIT ECONOMICS (per customer)\nCAC: $[X]  |  Payback: [X months]\nGross margin per active user/month: $[X]\nLTV (at [X month avg. tenure): $[X]\n\nMODEL SCENARIOS\nConservative: [X] users @ [X months] → $[X] ARR\nBase: [X] users @ [X months] → $[X] ARR\nUpside: [X] users @ [X months] → $[X] ARR` },
    { name: "Banking Partner & Integration Plan", type: "document", folder: "Growth & Partnerships", content: `BANKING PARTNER & INTEGRATION PLAN — [COMPANY NAME]\n\nBANK PARTNER OVERVIEW\nPartner bank: [Evolve Bank & Trust / Column Bank / Thread Bank / Sutton Bank / Lead Bank / Blue Ridge / Other]\nRelationship type: □ Sponsor bank (MTL holder)  □ BaaS platform (e.g., Unit, Treasury Prime)  □ Direct bank partnership\nBaaS middleware (if applicable): [Unit / Treasury Prime / Bond / Synctera / Moov]\n\nSERVICES REQUIRED FROM BANK\n□ FDIC-insured deposit accounts (for customers)\n□ ACH origination (debits and credits)\n□ Wire transfer (domestic + international)\n□ Debit card program (Visa / Mastercard via Marqeta / Lithic / i2c)\n□ Real-Time Payments (RTP) / FedNow\n□ Lending / credit line (if applicable)\n□ Foreign exchange\n\nONBOARDING REQUIREMENTS\n□ Business due diligence package (AML program, BSA policies, exec KYB)\n□ Technology review / security assessment\n□ Compliance review + sign-off\n□ Program agreement signed\n□ API integration + sandbox testing\n□ Pilot launch (limited users)\n□ Full production launch\n\nINTEGRATION ARCHITECTURE\nAuth to bank API: [OAuth / API key]\nWebhooks for: [Account events / Transaction notifications / KYC decisions]\nReconciliation: [Automated daily via API / Manual CSV]\nSettlement timing: [Same-day ACH / Next-day]\nError handling: [Retry policy / Dead letter queue / Alerting]\n\nTIMELINE\nDue diligence submitted: [Date]\nProgram agreement signed: [Date]\nSandbox integration: [Date]\nPilot launch: [Date]  |  Full launch: [Date]` },
    { name: "SOC 2 & Security Compliance Tracker", type: "document", folder: "Product & Compliance", content: `SOC 2 & SECURITY COMPLIANCE TRACKER — [COMPANY NAME]\nTarget: SOC 2 Type [I / II]  |  Auditor: [Drata / Vanta / Secureframe / Direct audit firm]\nTarget completion: [Quarter / Year]\n\nTRUST SERVICE CRITERIA\nSecurity (CC): □ Not started  □ In progress  □ Controls implemented\nAvailability (A): □ N/A  □ In progress  □ Implemented\nConfidentiality (C): □ N/A  □ In progress  □ Implemented\nProcessing Integrity (PI): □ N/A  □ In progress  □ Implemented\nPrivacy (P): □ N/A  □ In progress  □ Implemented\n\nCONTROL AREAS STATUS\nAccess control: [% complete]\nEncryption at rest & transit: [% complete]\nIncident response plan: [% complete]\nVendor management: [% complete]\nBusiness continuity / DR: [% complete]\nChange management: [% complete]\nMonitoring & alerting: [% complete]\nEmployee security training: [% complete]\n\nOPEN ITEMS\n[Item 1]: [Owner] — due [Date]\n[Item 2]: [Owner] — due [Date]\n\nPEN TEST\nLast pen test: [Date]  |  Firm: [Name]\nCritical findings: [#]  |  Resolved: [#]\nNext pen test: [Date]\n\nINSURANCE\nCyber liability: $[X]M  |  Carrier: [Name]\nD&O: $[X]M  |  Carrier: [Name]\nE&O: $[X]M  |  Carrier: [Name]` },
    { name: "Investor Update Template", type: "document", folder: "Finance & Ops", content: `INVESTOR UPDATE — [COMPANY NAME] — [Month Year]\n\nHEADLINE\n[One sentence: biggest win or most important development this period]\n\nKEY METRICS\nTPV: $[X] ([+/-X]% vs. last period)\nActive accounts: [#] ([+/-#])\nMRR / ARR: $[X] ([+/-X]%)\nGross margin: [%]\nCAC: $[X]  |  LTV: $[X]\nRunway: [X months] @ $[X] monthly burn\n\nHIGHLIGHTS\n✓ [Milestone 1 — e.g., Bank partner agreement signed]\n✓ [Milestone 2 — e.g., MTL approved in [X] states]\n✓ [Milestone 3 — e.g., Launched [feature] → [metric improvement]]\n\nCHALLENGES\n[Challenge 1] → [How addressing]\n[Challenge 2] → [How addressing]\n\nNEXT 30 DAYS\n□ [Priority 1]\n□ [Priority 2]\n□ [Priority 3]\n\nASK\n□ [Introduction to [type of contact]]\n□ [Advice on [decision]]\n□ [Other ask]` },
  ],

  "EdTech": [
    { name: "Learning Platform Vision & Pedagogy", type: "document", folder: "Curriculum & Content", content: `LEARNING PLATFORM VISION & PEDAGOGY — [PLATFORM NAME]\nCategory: □ K-12  □ Higher Ed  □ Professional / Upskilling  □ Corporate L&D  □ Coding bootcamp  □ Test prep  □ Language learning\nDelivery: □ Self-paced  □ Cohort-based  □ Instructor-led  □ Blended  □ Microlearning\n\nMISSION\n[Who do you help, what outcome do you create, and why now?]\n\nLEARNING SCIENCE FOUNDATIONS\nCore pedagogy: □ Mastery learning  □ Spaced repetition  □ Project-based  □ Socratic / discussion  □ Competency-based\nMeasuring learning: [How do you know learning happened? Assessment method.]\nRetention strategy: [Spaced review / Practice / Real-world application / Community]\n\nLEARNER PERSONA\nPrimary learner: [Age / role / education level]\nMotivation: [Career change / Promotion / Curiosity / Required / Certification]\nConstraints: [Time-poor / Budget-limited / English as second language / Accessibility needs]\n\nCURRICULUM PHILOSOPHY\n[What do you teach, how deeply, and in what sequence? Why this approach vs. alternatives?]\nCore curriculum structure: [Modules / Units / Lessons — high-level map]\nCapstone or project: [Yes — description / No]\n\nCOMPETITIVE DIFFERENTIATION\n[Competitor 1] — [Their approach] vs. ours: [Your differentiation]\n[Competitor 2] — [Their approach] vs. ours: [Your differentiation]\nOur moat: [Network effects / Content quality / Outcomes data / Instructor talent / Employer partnerships]` },
    { name: "Curriculum Architecture & Content Map", type: "document", folder: "Curriculum & Content", content: `CURRICULUM ARCHITECTURE & CONTENT MAP — [COURSE/PROGRAM NAME]\nTotal duration: [X hours / X weeks]  |  Effort per week: [X hours]\nPrerequisites: [None / [List]]\nOutcome: [Learner will be able to [competency] after completing this program]\n\nMODULE STRUCTURE\nModule 1: [Title]\n  Learning objectives: [1], [2], [3]\n  Lessons: [Lesson 1.1] [Lesson 1.2] [Lesson 1.3]\n  Assessment: [Quiz / Project / Reflection prompt]\n  Duration: [X hours]\n\nModule 2: [Title]\n  Learning objectives: [1], [2]\n  Lessons: [Lesson 2.1] [Lesson 2.2] [Lesson 2.3]\n  Assessment: []\n  Duration: [X hours]\n\nModule 3: [Title]\n  [Same structure]\n\n[Continue for all modules]\n\nFINAL CAPSTONE / PROJECT\nDescription: [What the learner builds or produces]\nEvaluation rubric: [Criteria 1] / [Criteria 2] / [Criteria 3]\nPeer review: [Yes / No]  |  Instructor review: [Yes / No]\n\nCONTENT FORMATS\n□ Video lessons (avg [X] min each)  □ Reading / articles  □ Interactive exercises\n□ Quizzes  □ Live sessions  □ Discussion prompts  □ Downloadable resources\n\nACCESSIBILITY\nCaptions: [Auto + reviewed / Professional]  |  Language: [EN / other]\nADA/WCAG compliance: [Level AA target]  |  Screen reader tested: [Yes / No]` },
    { name: "Platform Tech Architecture", type: "document", folder: "Platform & Tech", content: `PLATFORM TECH ARCHITECTURE — [PLATFORM NAME]\n\nPLATFORM TYPE\n□ Custom-built LMS  □ White-labeled LMS (Teachable / Thinkific / Kajabi)\n□ On top of [Canvas / Moodle / Blackboard]  □ API-first headless LMS\n\nCORE COMPONENTS\n1. Content delivery: [Video — Wistia / Vimeo / Mux / Cloudflare Stream]\n2. Assessment engine: [Quiz engine — custom / LearnDash / H5P]\n3. Progress tracking: [xAPI / SCORM / custom learning record store]\n4. Community: [Circle / Discord / Custom forums]\n5. Live sessions: [Zoom / Daily.co / StreamYard]\n6. Auth: [Auth0 / Clerk / Firebase Auth]\n7. Payments: [Stripe / Paddle / Chargebee for subscriptions]\n8. CRM / Email: [HubSpot / ConvertKit / Braze for learner lifecycle]\n\nINFRASTRUCTURE\nCloud: [AWS / GCP / Vercel + Railway]\nVideo CDN: [Cloudflare / AWS CloudFront]\nDatabase: [PostgreSQL — user progress, completions, grades]\nSearch: [Algolia / Elasticsearch — course/lesson search]\n\nADAPTIVE LEARNING (if applicable)\nPersonalization engine: [Recommends next lesson based on performance]\nData inputs: [Quiz scores / time on task / completion rate / learner goals]\nML approach: [Collaborative filtering / Rule-based / LLM-powered]\n\nCOMPLIANCE\nFERPA (US student data): [Applicable / N/A]\nCOPPA (under 13): [Applicable / N/A]\nGDPR (EU learners): [Applicable — DPA + consent flows]\nAccessibility: [WCAG 2.1 AA]` },
    { name: "Business Model & Revenue Strategy", type: "document", folder: "Business & Revenue", content: `BUSINESS MODEL & REVENUE STRATEGY — [PLATFORM NAME]\n\nBUSINESS MODEL\n□ B2C self-serve — Individual learners purchase directly\n□ B2B2C — Employer / school buys, learners access\n□ B2B — Corporate L&D licensing\n□ Marketplace — Third-party instructors, revenue share\n□ Cohort-based — Time-bound, premium pricing\n□ Freemium — Free core + paid premium\n\nPRICING\nIndividual course: $[X] one-time\nSubscription: $[X]/month or $[X]/year  |  Access: [All-access / Single subject]\nBootcamp/cohort: $[X]–$[X] per cohort\nCorporate license: $[X]/seat/year (min [#] seats)  |  Enterprise: Custom\nCertification exam fee: $[X]\nISA (Income Share Agreement): [%] of income for [X months] (if applicable)\n\nREVENUE MODEL PROJECTIONS\nYear 1: [#] paying learners × avg $[X] = $[X] ARR\nYear 2: [#] learners × avg $[X] = $[X] ARR\nYear 3: [#] learners × avg $[X] = $[X] ARR\n\nKEY METRICS\nCompletion rate target: [%] (industry avg: ~10–15% for MOOCs, [X]% for cohort)\nCAC: $[X]  |  LTV: $[X]  |  Payback: [X months]\nNet Promoter Score (NPS) target: >[X]\nOutcome rate (job placement / salary increase): [%]` },
    { name: "Instructor & Content Partner Program", type: "document", folder: "Curriculum & Content", content: `INSTRUCTOR & CONTENT PARTNER PROGRAM — [PLATFORM NAME]\n\nINSTRUCTOR MODEL\n□ In-house instructors (employees)\n□ Contracted subject-matter experts (SMEs)\n□ Open marketplace (any instructor can publish)\n□ Curated partner instructors (vetted)\n\nINSTRUCTOR REQUIREMENTS\nSubject expertise: [Credentials / portfolio / work samples required]\nTeaching experience: [Preferred / Required]\nContent format proficiency: [Video / live session / written]\nApplication process: [Application form → Review → Test lesson → Onboarding]\n\nCOMPENSATION MODEL\nRevenue share: [%] per enrollment from their course\nFlat fee: $[X] per module/course produced\nSalary (in-house): $[X]–$[X] range\nBonus: [Performance bonus at [X] completions / [X]% completion rate]\n\nCONTENT PRODUCTION SUPPORT\n□ Video production guide provided\n□ Script template provided\n□ Editing support: [In-house / Vendor / Self-produced]\n□ Captioning: [Auto-generated + reviewed]\n□ Studio/equipment: [Stipend / In-person studio / Remote kit]\n\nINSTRUCTOR PORTAL\nFeatures: [Course builder / Analytics dashboard / Learner messaging / Earnings tracker]\nFeedback loop: [Instructor sees completion rates, quiz scores, learner comments]` },
    { name: "Go-to-Market & Student Acquisition", type: "document", folder: "Growth & Marketing", content: `GO-TO-MARKET & STUDENT ACQUISITION — [PLATFORM NAME]\n\nTARGET SEGMENT\nPrimary: [e.g., Mid-career professionals wanting to break into data science]\nSecondary: [e.g., Recent grads, international learners]\nICP: [Age / education / location / income / current role / aspiration]\n\nACQUISITION CHANNELS\nOrganic / SEO:\n• Pillar content strategy: [Topic clusters — [X] pillar pages]\n• YouTube: [Free preview content / educational shorts]\n• Keyword targets: [List 5-10 primary keywords]\n\nPaid:\n• Meta / Instagram: [Target interest / lookalike audience]\n• Google Search: [Branded + category keywords]\n• LinkedIn (B2B/corporate): [Job title targeting]\n• Target CPL: $[X]\n\nCommunity / Social proof:\n• LinkedIn success story posts\n• Reddit / Discord community participation\n• Alumni ambassador program\n• Employer placement announcements\n\nPartnerships:\n• Employer / bootcamp alumni hiring partnerships\n• University articulation agreements\n• Corporate L&D pilot programs\n• Influencer / creator collab\n\nCONVERSION\nFree trial / sample lesson → Email capture → Nurture → Enroll\nConversion rate targets: [X]% free → paid\nSales assist (for cohort/enterprise): [SDR team / founder-led / Inside sales]` },
    { name: "Outcomes & Employer Partnership Strategy", type: "document", folder: "Business & Revenue", content: `OUTCOMES & EMPLOYER PARTNERSHIP STRATEGY — [PLATFORM NAME]\n\nLEARNER OUTCOMES TRACKING\nPrimary outcome: [Job placement / Promotion / Salary increase / Certification / Skill gain]\nTracking method: [Alumni survey at [30 / 90 / 180 days] post-completion]\nSurvey tool: [Typeform / Custom]\nOutcomes reported:\n  Job placement rate: [%] within [X months]\n  Salary change: [Avg $[X] increase / [%] increase]\n  Learner satisfaction (NPS): [X]\n\nOUTCOMES TRANSPARENCY\nOutcomes report: [Published publicly / Available on request]\nISA conditions (if applicable): [Only triggered if placed in qualifying role >[threshold salary]]\nRefund policy: [X-day money-back guarantee / satisfaction guarantee]\n\nEMPLOYER PARTNERSHIP PROGRAM\nValue to employers: [Trained talent pipeline / Hiring portal / Sponsored seats for employees]\nPartner tiers:\n  Hiring partner (free): [Post jobs / Access to graduate profiles]\n  Preferred partner ($[X]/year): [Early access / Co-branded credential / On-campus sessions]\n  Corporate training ($[X]/seat): [Custom learning path / Manager dashboard]\n\nEMPLOYER PIPELINE TARGETS\nYear 1: [#] hiring partners signed\nYear 2: [#] employers + [#] corporate accounts\nAnnual employer revenue target: $[X]\n\nCREDENTIALS & ACCREDITATION\nCertificate: [Co-branded with employer / University / Industry body]\nAccreditation: [In progress / ACCET / DEAC / Regional accreditation target]` },
    { name: "Accessibility & Compliance Checklist", type: "document", folder: "Platform & Tech", content: `ACCESSIBILITY & COMPLIANCE CHECKLIST — [PLATFORM NAME]\n\nACCESSIBILITY STANDARDS\n□ WCAG 2.1 Level AA compliance target\n□ Screen reader tested (NVDA / JAWS / VoiceOver)\n□ Keyboard navigation fully functional\n□ Color contrast ratio ≥ 4.5:1 for normal text\n□ All images have alt text\n□ All video content has captions (auto + reviewed for accuracy)\n□ Audio descriptions for video (if visual-only information present)\n□ No content flashes > 3 times/second\n□ Focus indicators visible\n□ Error messages describe how to fix errors\n□ Forms labeled correctly\n\nDATA PRIVACY COMPLIANCE\nFERPA (US, student records):\n□ Not applicable — not a school  □ Applicable — FERPA policy implemented\n□ Parent/student consent mechanisms in place\n□ Data sharing agreements with partner schools\n\nCOPPA (children under 13):\n□ Platform not intended for under 13 — age gate implemented\n□ Parental consent mechanism — [Describe]\n\nGDPR (EU learners):\n□ Lawful basis for processing identified\n□ Privacy policy in plain language\n□ Cookie consent implemented\n□ Data deletion request process in place\n□ DPA signed with all data processors\n□ Data breach notification process documented (72-hour window)` },
    { name: "LMS Feature Roadmap", type: "document", folder: "Platform & Tech", content: `LMS FEATURE ROADMAP — [PLATFORM NAME]\n\nCURRENT STATE (MVP)\n✓ [Feature 1 — e.g., Video lesson player]\n✓ [Feature 2 — e.g., Quiz engine]\n✓ [Feature 3 — e.g., Progress tracking]\n✓ [Feature 4 — e.g., Certificate generation]\n\nROADMAP\n\nQ[X] — FOUNDATION\n□ [Feature: e.g., Discussion forums per lesson]\n□ [Feature: e.g., Mobile app (iOS + Android)]\n□ [Feature: e.g., Bulk learner import for B2B]\nSuccessmetric: [X active learners / [X]% completion rate]\n\nQ[X] — ENGAGEMENT\n□ [Feature: e.g., Spaced repetition review system]\n□ [Feature: e.g., Peer feedback / review]\n□ [Feature: e.g., Live Q&A session scheduling]\n□ [Feature: e.g., Leaderboards / streak system]\nSuccess metric: [NPS >[X] / completion rate [X]%]\n\nQ[X] — SCALE\n□ [Feature: e.g., Adaptive learning path engine]\n□ [Feature: e.g., Manager dashboard for corporate]\n□ [Feature: e.g., SCORM/xAPI compliance]\n□ [Feature: e.g., Multi-language support (i18n)]\nSuccess metric: [$[X]M ARR / [#] B2B accounts]\n\nQ[X] — INTELLIGENCE\n□ [Feature: e.g., AI-powered personalized recommendations]\n□ [Feature: e.g., Predictive dropout detection]\n□ [Feature: e.g., Auto-grading for open-ended responses]\nSuccess metric: [Completion rate delta / Churn reduction]\n\nDEFERRED / FUTURE\n• [Feature] — [Reason deferred]\n• [Feature] — [Reason deferred]` },
  ],

  "GovTech / CivicTech": [
    { name: "Problem Statement & Stakeholder Map", type: "document", folder: "Policy & Requirements", content: `PROBLEM STATEMENT & STAKEHOLDER MAP — [PROJECT NAME]\nAgency / Context: [Federal / State / Municipal / Non-governmental]\nProblem owner: [Department / Office / Program]\n\nPROBLEM STATEMENT\n[What is the current situation? What pain does it cause? Who is affected? What has been tried?]\nQuantification: [Volume of people affected / Cost of current process / Error rate / Time wasted]\n\nROOT CAUSES\n1. [Root cause — e.g., Paper-based process creates data silos]\n2. [Root cause — e.g., No real-time status visibility for caseworkers]\n3. [Root cause — e.g., Legacy system cannot be updated without months-long procurement]\n\nSTAKEHOLDERS\nEnd users (citizens/beneficiaries): [Description — who they are, what they need]\nFront-line staff: [Caseworkers / clerks / officers — their workflow pain]\nDecision-makers: [Dept head / CIO / City manager — what they care about]\nPolitical stakeholders: [Elected officials — timeline/budget pressures]\nOversight: [OMB / GAO / Inspector General / Legislature]\nVendors: [Current legacy vendors / Proposed new vendors]\n\nSUCCESS METRICS\nPrimary outcome: [Reduced processing time / Increased access / Lower error rate]\nMeasurement plan: [How will you track progress?]\nTarget: [Baseline X → Target Y within Z months]\n\nPOLITICAL & TIMING CONSTRAINTS\nBudget cycle: [FY[XX] — appropriation deadline]\nElection/transition risk: [Leadership change possible — mitigation plan]\nPublic pressure: [Media coverage / advocacy groups / litigation]` },
    { name: "Technical Architecture & ATO Plan", type: "document", folder: "Platform & Architecture", content: `TECHNICAL ARCHITECTURE & ATO PLAN — [SYSTEM NAME]\n\nSYSTEM OVERVIEW\n[High-level description of what the system does, who uses it, and how it fits into existing infrastructure]\n\nARCHITECTURE\nDeployment: □ FedRAMP Authorized Cloud (AWS GovCloud / Azure Government / Google Cloud Government)\n□ On-premise data center  □ Hybrid\nFront-end: [React / Angular / Next.js — Section 508 compliant]\nBack-end: [Node / Python / Java + REST API]\nDatabase: [PostgreSQL / Oracle / SQL Server]\nAuthentication: [PIV/CAC / Login.gov / Agency SSO / OAuth2 + SAML]\nData classification: [Controlled Unclassified Info (CUI) / FOUO / PII handling]\n\nSECURITY & COMPLIANCE\nFramework: NIST SP 800-53  |  FISMA impact level: □ Low  □ Moderate  □ High\nFedRAMP: □ Applicable — using authorized IaaS  □ Not applicable\nPrivacy: Privacy Threshold Analysis (PTA) required — [Completed / In progress]\nSection 508: [Compliant / In remediation]\n\nATO (AUTHORITY TO OPERATE) ROADMAP\nStep 1: System categorization (FIPS 199) — [Date]\nStep 2: Security controls selection (NIST 800-53) — [Date]\nStep 3: Implementation & documentation (SSP) — [Date]\nStep 4: Security assessment (3PAO or internal) — [Date]\nStep 5: Plan of Action & Milestones (POA&M) — [Date]\nStep 6: Authorization decision by AO — [Date]\nStep 7: Continuous monitoring established — [Date]\nExpected ATO date: [Date]  |  ATO type: □ Full ATO  □ IATO  □ FedRAMP P-ATO` },
    { name: "Procurement & Contracting Strategy", type: "document", folder: "Policy & Requirements", content: `PROCUREMENT & CONTRACTING STRATEGY — [PROJECT NAME]\n\nPROCUREMENT APPROACH\n□ FAR Part 12 (Commercial items) — fastest path for COTS/SaaS\n□ FAR Part 15 (Negotiated procurement) — for complex custom development\n□ GSA Schedule (MAS) — pre-vetted vendors, faster award\n□ SBIR/STTR — R&D contracts for innovative solutions\n□ Other Transaction Authority (OTA) — for prototype development\n□ State/local procurement rules: [Applicable regulations]\n\nPATHWAY\nSole source justification (if applicable): [Reason — unique qualifications / sole provider]\nCompetitive: □ RFI first → RFP  □ Sources sought → RFP  □ SAM.gov posting\n\nRFP REQUIREMENTS (if applicable)\nEstimated value: $[X]  |  Period of performance: [X years + options]\nKey evaluation criteria:\n  Technical approach: [%] weight\n  Past performance: [%] weight\n  Price: [%] weight\nRequired certifications: [8(a) / HUBZone / SDVOSB / WOSB]\n\nCONTRACT TYPE\n□ Firm-Fixed Price (FFP) — [For well-defined scope]\n□ Time & Materials (T&M) — [For uncertain scope]\n□ Cost-Plus — [For R&D]\n□ IDIQ + Task Orders — [For recurring services]\n\nVENDOR REQUIREMENTS\n□ Cleared personnel (if applicable): [Secret / Top Secret]\n□ U.S. persons only requirement\n□ FedRAMP-authorized product\n□ Section 508 compliance certification\n□ Past performance in [similar agency / program]\n\nKEY DATES\nDraft RFP review period: [Date range]\nRFP posted on SAM.gov: [Date]\nProposals due: [Date]\nAward target: [Date]  |  Period of performance start: [Date]` },
    { name: "Human-Centered Design Research Plan", type: "document", folder: "Stakeholder & Comms", content: `HUMAN-CENTERED DESIGN RESEARCH PLAN — [PROJECT NAME]\nMethodology: [USDS / 18F / UK GDS approach]\n\nRESEARCH GOALS\n1. [Understand how [user type] currently accomplishes [task]]\n2. [Identify pain points in the current [process]]\n3. [Test whether proposed solution solves [specific problem]]\n\nUSER GROUPS\nGroup 1: [Front-line staff — caseworkers, clerks]\n  # to interview: [5–8]  |  Recruiting via: [Agency liaison]\nGroup 2: [End users / beneficiaries / citizens]\n  # to interview: [8–12]  |  Recruiting via: [Community orgs / Service centers]\nGroup 3: [Supervisors / managers]\n  # to interview: [3–5]  |  Recruiting via: [Agency HR contact]\n\nRESEARCH METHODS\n□ Contextual inquiry (observe users in their environment)\n□ Semi-structured interviews ([X hours each])\n□ Usability testing (prototype) — [Think-aloud protocol]\n□ Survey ([#] responses target)\n□ Analytics review (existing system logs)\n□ Card sorting / tree testing (IA validation)\n\nKEY QUESTIONS TO ANSWER\n1. [Question about user goal]\n2. [Question about current workaround]\n3. [Question about acceptance criteria for new solution]\n\nETHICS & CONSENT\n□ IRB review required: [Yes / No / Pending assessment]\n□ Informed consent form drafted\n□ PII handling: [No PII collected / PII handled per agency privacy policy]\n□ Accessibility: [Research sessions accessible to participants with disabilities]\n\nDELIVERABLES\n□ Research summary report\n□ User journey maps\n□ Affinity diagram / insights synthesis\n□ Persona(s) (if appropriate for this project)\n□ Recommendations for design` },
    { name: "Change Management & Adoption Plan", type: "document", folder: "Deployment & Support", content: `CHANGE MANAGEMENT & ADOPTION PLAN — [SYSTEM NAME]\n\nCHANGE OVERVIEW\nSystem being replaced: [Legacy system / Paper process / Manual workflow]\nImpacted staff: [#] users across [# offices / locations]\nGo-live date: [Date]  |  Rollout approach: □ Big bang  □ Phased by region  □ Pilot first\n\nSTAKEHOLDER IMPACT ASSESSMENT\n[User group 1]: [Impact — High / Medium / Low]  |  [Main concern]\n[User group 2]: [Impact]  |  [Main concern]\n[Supervisors/managers]: [Impact]  |  Sponsor they need: [Executive champion]\n\nCOMMUNICATION PLAN\nAnnouncement (T-[X weeks]): [From executive sponsor — overview of why this change]\nDept briefings (T-[X weeks]): [Program team presentations to each office]\nTraining announcement (T-[X weeks]): [Schedule, modality, expectations]\nGo-live reminder (T-[X days]): [Final checklist, help desk contact]\nPost-launch check-in (T+[X days]): [Feedback survey, issues log]\n\nTRAINING PLAN\nDelivery: □ In-person workshops  □ Virtual sessions  □ Self-paced e-learning  □ Job aids\nCurriculum:\n  Module 1: [System overview — [X min]]\n  Module 2: [Core workflow — [X min]]\n  Module 3: [Common tasks / edge cases — [X min]]\nTrainer-of-trainers: [Who trains the trainers]\nJob aids: [One-page quick reference cards / Desk guides / Video walkthroughs]\n\nSUPPORT MODEL\nHelp desk: [Tier 1 — [Phone / Email / Chat] — staffed [Hours]]\nEscalation: [Tier 2 — Program team / Tier 3 — Vendor]\nKnowledge base: [URL or planned location]\n\nADOPTION METRICS\n[X]% of staff trained by [Date]\n[X]% active users within [X weeks of go-live]\nHelp desk call volume target: < [#]/day by [Date]` },
    { name: "Open Data & Interoperability Plan", type: "document", folder: "Platform & Architecture", content: `OPEN DATA & INTEROPERABILITY PLAN — [PROJECT NAME]\n\nOPEN DATA STRATEGY\nOpen data policy: [Reference applicable law / executive order / agency policy]\nData catalog: [data.gov / agency open data portal / CKAN instance]\nDatasets to publish:\n  Dataset 1: [Name / Description / Update frequency]\n  Dataset 2: [Name / Description / Update frequency]\n  Dataset 3: [Name / Description / Update frequency]\nFormats: [CSV / JSON / GeoJSON / Shapefile / API]\nMetadata standard: [DCAT-US / ISO 19115]\n\nAPI STRATEGY\nAPI style: [REST / GraphQL]\nDocumentation: [OpenAPI 3.0 / Swagger]\nAuthentication: [API key / OAuth2]\nVersioning: [URL versioning /v1/]\nRate limiting: [X requests/min per key]\nDeveloper portal: [URL or planned]\n\nINTEROPERABILITY STANDARDS\nHealth data: [HL7 FHIR R4 — if applicable]\nGIS/geospatial: [ESRI / OGC WMS/WFS]\nIdentity: [ICAM / PIV / Login.gov]\nPayments: [Pay.gov integration]\nDocument exchange: [Electronic Records Management standard]\n\nDATA SHARING AGREEMENTS\nAgreement type: [ISA / MOU / Data Sharing Agreement]\nPartner agencies: [List]\nPII handling: [De-identified / Aggregated / Full PII with agreement]\nLegal authority: [Cite statute or regulation]\n\nGOVERNANCE\nData steward: [Name / Role]\nData quality review: [Frequency / Method]\nTakedown process: [How errors or sensitive data are removed]` },
    { name: "Security & Privacy Controls Tracker", type: "document", folder: "Security & Compliance", content: `SECURITY & PRIVACY CONTROLS TRACKER — [SYSTEM NAME]\nFISMA Impact Level: □ Low  □ Moderate  □ High\nBaseline: NIST SP 800-53 Rev 5 [Low / Moderate / High] Baseline\n\nCONTROL FAMILIES STATUS\nAC — Access Control: □ Not started  □ In progress  □ Implemented  □ Assessed\nAT — Awareness & Training: [Status]\nAU — Audit & Accountability: [Status]\nCA — Assessment, Authorization & Monitoring: [Status]\nCM — Configuration Management: [Status]\nCP — Contingency Planning: [Status]\nIA — Identification & Authentication: [Status]\nIR — Incident Response: [Status]\nMA — Maintenance: [Status]\nMP — Media Protection: [Status]\nPE — Physical & Environmental Protection: [Status]\nPL — Planning: [Status]\nPS — Personnel Security: [Status]\nRA — Risk Assessment: [Status]\nSA — System & Services Acquisition: [Status]\nSC — System & Communications Protection: [Status]\nSI — System & Information Integrity: [Status]\nSR — Supply Chain Risk Management: [Status]\n\nPRIVACY CONTROLS (NIST SP 800-53 PT family)\nPT-1 Policy: [Status]  PT-2 Authority: [Status]  PT-3 Purpose Specification: [Status]\n\nPOA&M (Plan of Action & Milestones)\n[Finding 1]: [Control] — [Risk level] — [Remediation plan] — [Due date]\n[Finding 2]: [Control] — [Risk level] — [Remediation plan] — [Due date]\n\nINCIDENT RESPONSE\nIRT contact: [Name, email, phone]\nUS-CERT reporting: [Within 1 hour for Major incidents]\nAgency reporting: [Within [X hours] to CISO]` },
  ],

  "Space & Aerospace": [
    { name: "Mission Concept Document (MCD)", type: "document", folder: "Mission Design", content: `MISSION CONCEPT DOCUMENT — [MISSION NAME]\nMission class: □ Earth observation  □ Communications  □ Navigation  □ Science  □ Human spaceflight  □ In-space services  □ Launch\nOrbit type: □ LEO  □ MEO  □ GEO  □ SSO  □ Lunar  □ Interplanetary  □ Suborbital\n\nMISSION OVERVIEW\n[1–2 paragraph description of what this mission does, why it matters, and for whom]\n\nMISSION OBJECTIVES\nPrimary objective: [Specific, measurable outcome]\nSecondary objectives:\n1. [Objective]\n2. [Objective]\n\nKEY REQUIREMENTS\nKEY-001: [Mission lifetime — X years on orbit]\nKEY-002: [Data product — resolution, revisit, latency]\nKEY-003: [Launch vehicle compatibility — fairing size, mass]\nKEY-004: [Ground contact — X contacts/day, X Mbps downlink]\nKEY-005: [Reliability / MTBF target]\n\nSPACECRAFT OVERVIEW\nBus: [In-house / COTS — name]\nPayload: [Description]\nMass budget (est.): [X kg] dry  |  Launch mass: [X kg]\nPower budget (est.): [X W EOL]\nDatarate: [X Mbps payload downlink]\n\nLAUNCH\nTarget launch: [Quarter / Year]\nLaunch vehicle: [SpaceX Rideshare / Rocket Lab Electron / ISRO PSLV / Exolaunch / Other]\nLaunch site: [Cape Canaveral / Vandenberg / Sriharikota / Kourou]\n\nMISSION LIFETIME & DISPOSAL\nDesign lifetime: [X years]  |  EOL: [Deorbit within 25 years per IADC guidelines / GEO graveyard orbit]` },
    { name: "Systems Engineering Plan", type: "document", folder: "Systems Engineering", content: `SYSTEMS ENGINEERING PLAN — [MISSION NAME]\n\nSE APPROACH\nMethodology: [Model-Based SE (MBSE) / Document-Based / Hybrid]\nSE tool: [Cameo / MagicDraw / Capella / Enterprise Architect]\nRequirements management: [DOORS / Jama / Codebeamer / Notion]\nV&V approach: [Analysis / Test / Inspection / Demonstration]\n\nMISSION LIFECYCLE PHASES\nPhase A — Conceptual design: [Duration] — Outputs: [MCD, feasibility, ConOps]\nPhase B — Preliminary design: [Duration] — Outputs: [PDR package, subsystem specs]\nPhase C — Detailed design: [Duration] — Outputs: [CDR package, build-to drawings]\nPhase D — Integration, test, launch: [Duration] — Outputs: [ATLO, launch readiness review]\nPhase E — Operations: [Duration] — Outputs: [Mission data, anomaly resolution]\nPhase F — Closeout: [Duration]\n\nKEY REVIEWS\nMission Concept Review (MCR): [Date]\nSystem Requirements Review (SRR): [Date]\nPreliminary Design Review (PDR): [Date]\nCritical Design Review (CDR): [Date]\nTest Readiness Review (TRR): [Date]\nLaunch Readiness Review (LRR): [Date]\n\nSUBSYSTEM BREAKDOWN (WBS)\n1.0 Spacecraft\n  1.1 Structures & mechanisms\n  1.2 Power (EPS) — solar arrays, batteries\n  1.3 Attitude determination & control (ADCS)\n  1.4 Propulsion (if applicable)\n  1.5 Communications (Comms)\n  1.6 Command & Data Handling (C&DH)\n  1.7 Thermal\n  1.8 Payload\n2.0 Ground Segment\n3.0 Launch Vehicle Interface\n4.0 Mission Operations\n\nMARGIN POLICY\nMass margin: [20]% (PDR) → [10]% (CDR)\nPower margin: [20]% (PDR) → [10]% (CDR)\nLink margin: [3]dB minimum` },
    { name: "Ground Segment Architecture", type: "document", folder: "Ground Segment", content: `GROUND SEGMENT ARCHITECTURE — [MISSION NAME]\n\nGROUND SEGMENT OVERVIEW\n[High-level description of how ground system supports mission operations]\n\nGROUND STATIONS\nPrimary station: [Location] — [Antenna size] — [Frequency band — S/X/Ka]\nSecondary/backup: [Location or commercial network]\nCommercial ground network (if applicable): [AWS Ground Station / KSAT / Leaf Space / Viasat / SSC]\nContact frequency: [X passes/day]  |  Contact duration per pass: [X min avg]\nDownlink rate: [X Mbps]  |  Uplink rate: [X kbps]\n\nMISSION OPERATIONS CENTER (MOC)\nLocation: [Physical / Cloud-based]\nOperations tempo: [24/7 / Business hours + on-call / Lights-out automation]\nKey functions: [TT&C / Mission planning / Anomaly resolution / Data processing]\n\nFLIGHT DYNAMICS SYSTEM\nOrbit determination: [Tool — ODTK / STK / GMAT]\nManeuver planning: [Tool]\nConjunction assessment: [LeoLabs / ExoAnalytic / Space-Track.org]\n\nDATA PIPELINE\nRaw data → [L0 processing] → [L1 calibrated] → [L2 data products] → [L3 analysis products]\nProcessing latency target: [Near-real-time / Same pass / Next day]\nData archive: [AWS S3 / USGS / Partner agency]\nData distribution: [API / FTP / Direct download portal]\n\nCYBERSECURITY\nSatellite link encryption: [AES-256 command encryption]\nGround system: [NIST 800-53 applicable / FedRAMP if federal customer]\nLink authentication: [Crypto module — command authentication]\n\nCONTINGENCY OPERATIONS\nSafe mode: [Spacecraft safe mode protocol — automatic / ground command]\nAnomaly response: [On-call engineer paged / [X hour response SLA]]\nBlackout periods: [Solar eclipse / Ground station gap — [duration, frequency]]` },
    { name: "Regulatory & Licensing Plan", type: "document", folder: "Regulatory & Licensing", content: `REGULATORY & LICENSING PLAN — [COMPANY / MISSION NAME]\n\nFAA LAUNCH LICENSE (if applicable)\nApplication type: □ Part 450 (integrated) □ Experimental permit □ Launch site operator\nLaunch vehicle: [Description]\nLaunch site: [Location]\nApplication lead time: [~6 months typical]\nEnvironmental review: [NEPA/NHPA — EA or EIS required]\nFinancial responsibility: [Insurance requirement per 14 CFR 440]\nFAA POC: [Office of Commercial Space Transportation]\n\nFCC SPECTRUM LICENSE (if applicable)\nApplication type: □ Space station license □ Earth station □ Market access petition\nFrequency bands: [Uplink: X GHz / Downlink: X GHz]\nITU coordination: [Filing through FCC ITU filing system]\nLead time: [2–4 years for geostationary / 12–18 months for NGSO]\nCoordination with: [Other operators in same frequency / orbital slot]\n\nNOAA REMOTE SENSING LICENSE (if applicable)\nRequired for: [Earth observation — optical, SAR, multispectral]\nApplication: [15 CFR Part 960]\nData policy requirements: [License conditions on data sharing with government]\n\nSTATE DEPT. EXPORT CONTROLS\nITAR jurisdiction: [Confirm classification — USML Category IV (launch), XV (spacecraft)]\nLicense type: [Technical Assistance Agreement / Manufacturing License Agreement / Export License]\nCCL/EAR (if EAR99 or ECCN): [Classification]\n\nINTERNATIONAL CONSIDERATIONS\nLiability Convention: [State of registry responsible — US government indemnification limit]\nDebris mitigation: [IADC Guidelines / FCC 5-year deorbit rule compliance]\nHost nation agreements: [If launching from non-US soil]` },
    { name: "Business Case & Funding Strategy", type: "document", folder: "Business & Funding", content: `BUSINESS CASE & FUNDING STRATEGY — [COMPANY NAME]\n\nBUSINESS MODEL\n□ Data-as-a-service (DaaS) — sell Earth observation / space data products\n□ Communications services — sell bandwidth, data relay, IoT connectivity\n□ Space transportation — launch services revenue\n□ In-space services — servicing, refueling, debris removal\n□ Government contracts — NASA, DoD, allied governments\n□ Dual-use — commercial + government revenue\n\nREVENUE PROJECTIONS\nYear 1: $[X] — [Source breakdown]\nYear 3: $[X] — [Source breakdown]\nYear 5: $[X] — [Source breakdown]\n\nFUNDING ROADMAP\nSeed / Pre-seed: $[X] — [Status]\n  Sources: [Angels / SBIR Phase I / Non-dilutive grants]\nSeries A: $[X] — [Timeline]\n  Use: [First satellite / Constellation Phase 1 / Launch vehicle development]\nSeries B+: $[X] — [Timeline]\n  Use: [Scale constellation / Commercial launch ops]\n\nNON-DILUTIVE FUNDING\nNASA SBIR/STTR:\n  Phase I: Up to $[275K] — [Applied / Not applied]\n  Phase II: Up to $[2M] — [Timeline]\n  Phase III: [Commercialization — government + commercial revenue]\nNSF SBIR: [Applied / Applicable]\nAFWERX / SpaceWERX: [Grant opportunities]\nDOE / DOT / NOAA grants: [If applicable]\n\nINVESTOR LANDSCAPE\nTarget investors: [Lux Capital / USV / Bessemer / Playground / Type One / Lockheed Ventures]\nStrategic investors: [Boeing / Airbus / L3Harris / Thales / JAXA / ESA]\nCo-investment programs: [In-Q-Tel — if dual-use]\n\nKEY VALUE INFLECTION POINTS\n1. [Milestone — e.g., first satellite launch] → unlocks: [revenue / next funding]\n2. [Milestone — e.g., data product validated] → unlocks: [government contracts]\n3. [Milestone — e.g., constellation Phase 1] → unlocks: [Series B / global customers]` },
    { name: "ConOps — Concept of Operations", type: "document", folder: "Mission Design", content: `CONCEPT OF OPERATIONS (ConOps) — [MISSION NAME]\n\nMISSION PHASES\nPhase 1 — Launch & Early Orbit (LEOP): [Duration — typically [1–14 days]]\n  Activities: Separation from LV / Initial contact / Detumbling / Solar array deployment / Safe mode checkout\n  Pass 1 script: [What you do in the first contact after launch]\n\nPhase 2 — Commissioning: [Duration — [4–12 weeks typical]]\n  Activities: Subsystem checkout / ADCS calibration / Payload activation / Link margin verification / Operational mode transition\n\nPhase 3 — Nominal Operations: [Mission lifetime]\n  Cadence: [Daily pass schedule / tasking workflow / data delivery]\n  Tasking: [Customer portal / API / Internal mission planner]\n  Data flow: [Payload collect → downlink → process → deliver → archive]\n  Contacts/day: [X] via [station network]\n\nPhase 4 — Contingency / Anomaly Response\n  Safe mode entry: [Trigger conditions / Recovery procedure]\n  Anomaly response: [On-call rotation / [X hour response window]]\n  Major anomalies requiring mission recovery: [List types + recovery procedures]\n\nPhase 5 — Decommission / Disposal\n  EOL deorbit: [Natural decay within 25 years / Propulsive deorbit maneuver]\n  Data archival: [Final data products preserved for [X years]]\n  License closeout: [FCC / NOAA reporting requirements]\n\nOPERATIONS TEAM\nMission Director: [Name / TBD]\nFlight Ops Lead: [Name / TBD]\nPayload Operations: [Name / TBD]\nOn-call rotation: [X engineers, [X week] rotation]` },
    { name: "Mass, Power & Link Budget", type: "document", folder: "Systems Engineering", content: `MASS, POWER & LINK BUDGET — [SPACECRAFT NAME]\nRevision: [#]  |  Date: [Date]  |  Design stage: [Phase A / B / C]\n\nMASSBUDGET\n\nSubsystem               | CBE (kg) | Margin (%) | MEV (kg)\nStructure & mechanisms  | [X]      | [20]       | [X]\nPower (EPS)             | [X]      | [20]       | [X]\nADCS                    | [X]      | [20]       | [X]\nPropulsion              | [X]      | [20]       | [X]\nComms                   | [X]      | [20]       | [X]\nC&DH                    | [X]      | [20]       | [X]\nThermal                 | [X]      | [20]       | [X]\nPayload                 | [X]      | [10]       | [X]\nHarness                 | [X]      | [30]       | [X]\nTotal dry mass          | [X]      |            | [X]\nPropellant              | [X]      | [5]        | [X]\nLaunch mass             | [X]      |            | [X]\nLaunch vehicle adapter (LVA): [X kg]\n\nPOWER BUDGET\nSolar array power (EOL, worst case): [X W]\nBattery capacity: [X Wh]  |  Depth of discharge (DoD): [20]%\n\nMode                    | Power (W) | Duration\nSunlit nominal          | [X]       | [X% orbit]\nEclipse                 | [X]       | [X% orbit]\nPeak (maneuver/downlink)| [X]       | [X min]\nSafe mode               | [X]       | Indefinite\n\nLINK BUDGET (downlink)\nFrequency: [X GHz — X band]  |  Modulation: [BPSK / QPSK / 8PSK]\nTransmit power: [X] dBW  |  Antenna gain (spacecraft): [X] dBi\nPath loss at [800 km]: [X] dB  |  Ground antenna gain: [X dBi — [X]m dish]\nReceived Eb/N0: [X] dB  |  Required Eb/N0: [X] dB\n→ Link margin: [X] dB  |  Minimum required: [3] dB` },
    { name: "Risk Register", type: "document", folder: "Systems Engineering", content: `RISK REGISTER — [MISSION NAME]\nRisk scale: Likelihood [1–5] × Consequence [1–5] = Risk Score [1–25]\nHigh risk: Score ≥ 15  |  Medium: 8–14  |  Low: < 8\n\nTECHNICAL RISKS\nRisk T-01: [Component long-lead procurement delay]\n  Likelihood: [3]  Consequence: [4]  Score: [12]\n  Mitigation: [Identify multiple vendors / Order early / Maintain spares]\n  Owner: [Procurement lead]  Deadline: [Date]\n\nRisk T-02: [Thermal design failure in vacuum testing]\n  Likelihood: [2]  Consequence: [5]  Score: [10]\n  Mitigation: [Thermal desktop analysis at PDR / TVAC test early]\n  Owner: [Thermal engineer]\n\nRisk T-03: [ADCS performance below requirement]\n  Likelihood: [3]  Consequence: [4]  Score: [12]\n  Mitigation: [High-fidelity simulation / Hardware-in-loop test]\n\nPROGRAM RISKS\nRisk P-01: [Key engineer departure]\n  Likelihood: [3]  Consequence: [3]  Score: [9]\n  Mitigation: [Cross-training / Documentation / Retention plan]\n\nRisk P-02: [Launch vehicle schedule slip]\n  Likelihood: [3]  Consequence: [3]  Score: [9]\n  Mitigation: [Book launch early / Secondary LV option / Storage plan]\n\nEXTERNAL RISKS\nRisk E-01: [FCC license delay]\n  Likelihood: [3]  Consequence: [5]  Score: [15]\n  Mitigation: [File early / Regulatory counsel / Interim waiver request]\n\nRisk E-02: [Launch failure / loss of mission]\n  Likelihood: [2]  Consequence: [5]  Score: [10]\n  Mitigation: [Launch insurance / Design for dual-manifest / Rapid replenishment plan]` },
  ],

  "Cybersecurity": [
    { name: "Product Vision & Threat Model", type: "document", folder: "Product & Engineering", content: `PRODUCT VISION & THREAT MODEL — [PRODUCT NAME]\nCategory: □ SIEM  □ EDR/XDR  □ SOAR  □ IAM/PAM  □ Zero Trust Network Access (ZTNA)  □ Cloud Security (CASB/CSPM)  □ AppSec (DAST/SAST)  □ Vulnerability Management  □ Threat Intel  □ GRC/Compliance  □ Email Security\nDeployment: □ SaaS  □ On-prem  □ Hybrid  □ Managed Service (MSSP)\n\nPROBLEM\n[What specific security problem do you solve? What does it cost organizations today?]\n\nSOLUTION\n[Your product in 2–3 sentences — what it detects/prevents/automates and how]\n\nTHREAT MODEL\nAssets protected: [Endpoints / Identity / Cloud workloads / Applications / Network / Data]\nThreat actors: □ Ransomware gangs  □ Nation-state APTs  □ Insider threats  □ Script kiddies  □ Supply chain attackers\nAttack vectors addressed:\n  [MITRE ATT&CK Tactic 1] → [Technique] → [How your product detects/prevents]\n  [MITRE ATT&CK Tactic 2] → [Technique] → [How your product detects/prevents]\n  [MITRE ATT&CK Tactic 3] → [Technique] → [Your response]\n\nDIFFERENTIATION\n[Competitor 1]: [Their approach] vs. ours: [Your differentiation — detection speed / false positive rate / coverage / price]\n[Competitor 2]: vs. ours: [Differentiation]\n\nBUYER PERSONA\nPrimary: [CISO / Security Manager / SOC Lead / IT Admin]\nOrg size: [SMB / Mid-market / Enterprise]\nBuyer trigger: [Audit finding / Breach / New compliance requirement / Board pressure]` },
    { name: "Security Architecture & Tech Stack", type: "document", folder: "Product & Engineering", content: `SECURITY ARCHITECTURE & TECH STACK — [PRODUCT NAME]\n\nARCHITECTURE OVERVIEW\n[High-level diagram description — data flow from customer environment to product backend]\n\nDATA COLLECTION (agent / agentless / API-based)\n□ Endpoint agent: [Language — Rust / C++ / Go]  |  Platforms: [Windows / macOS / Linux]\n□ Network sensor: [Packet capture / NetFlow / sFlow]\n□ API integrations: [Cloud APIs — AWS CloudTrail / Azure AD / GCP Security Command Center]\n□ Log ingestion: [Syslog / CEF / LEEF / JSON via API / Kafka]\n□ SIEM integration: [Splunk / QRadar / Sentinel — send events to or ingest from]\n\nDETECTION ENGINE\nDetection types: □ Signature-based  □ Behavioral anomaly  □ ML/AI-powered  □ Threat intel correlation\nML approach: [UEBA — user behavior baselining / Supervised anomaly detection / LLM for alert triage]\nFalse positive management: [Tuning workflow / Feedback loop / Confidence scoring]\nResponse latency (detect-to-alert): < [X seconds / minutes]\n\nBACKEND INFRASTRUCTURE\nCloud: [AWS / GCP / Azure]  |  Regions: [List for data residency]\nData store: [Elasticsearch / ClickHouse / Apache Iceberg — for security telemetry at scale]\nStream processing: [Kafka / Kinesis / Flink]\nOrchestration: [Kubernetes]\nData retention: [Hot: [X days] / Warm: [X months] / Cold archive: [X years]]\n\nPRODUCT SECURITY (securing the product itself)\nSaaS architecture: [Single-tenant / Multi-tenant isolated]  |  Data encryption: AES-256\nPen test: [Annual third-party + continuous bug bounty]\nSOC 2 Type II: [Certified / In progress]  |  FedRAMP: [Planned / In progress]\nData residency options: [US / EU / APAC]\nSecret management: [HashiCorp Vault / AWS Secrets Manager]` },
    { name: "Compliance & GRC Roadmap", type: "document", folder: "Compliance & GRC", content: `COMPLIANCE & GRC ROADMAP — [COMPANY NAME]\n\nCOMPLIANCE SCOPE\nFrameworks in scope:\n  □ SOC 2 Type II — Customer trust / sales requirement\n  □ ISO 27001 — EU / global enterprise requirement\n  □ FedRAMP Moderate — Federal government customers\n  □ CMMC Level 2/3 — DoD contractor\n  □ PCI DSS — If handling cardholder data\n  □ HIPAA — If healthcare customer data\n  □ GDPR — EU data protection\n  □ NIST CSF — Framework for internal security program\n\nSOC 2 TIMELINE\nScope defined: [Date]\nControl implementation: [Date]\nRead to audit: [Date]\nAudit period (Type II — min 6 months): [Start] → [End]\nReport expected: [Date]\nGRC platform: [Drata / Vanta / Secureframe / Tugboat Logic]\n\nISO 27001 TIMELINE\nGap assessment: [Date]\nISMS implemented: [Date]\nInternal audit: [Date]\nRegistrar audit (Stage 1 + 2): [Date]\nCertification: [Date]\n\nFedRAMP ROADMAP (if applicable)\nPath: □ 3PAO assessment → JAB P-ATO  □ Agency sponsorship → Agency ATO\nFedRAMP equivalent cloud: [AWS GovCloud / Azure Government / Google Cloud]\nEstimated cost: $[500K–2M+]\nEstimated timeline: [18–36 months]\n\nCURRENT CONTROLS GAP\n[Control area 1]: [Status / Gap]\n[Control area 2]: [Status / Gap]\n\nEXTERNAL AUDITORS / ASSESSORS\nSOC 2 auditor: [Firm name]\n3PAO (FedRAMP): [Firm name]\nISO registrar: [Firm name]` },
    { name: "GTM & CISO Sales Playbook", type: "document", folder: "Sales & GTM", content: `GTM & CISO SALES PLAYBOOK — [PRODUCT NAME]\n\nTARGET CUSTOMER\nPrimary buyer: CISO / VP Security / Security Manager\nSecondary influencer: SOC Lead / Head of IT / DevSecOps Lead\nOrg size: [SMB: [#-#] employees / Mid-market: [#-#K] / Enterprise: [#K+]]\nVerticals: [Finance / Healthcare / Government / Technology / Retail]\nBuyer triggers: [Ransomware incident / Compliance deadline / Board mandate / Competitor breach in news]\n\nMESSAGING BY PERSONA\nCISO: [Business risk / Board reporting / Compliance / Vendor consolidation]\nSOC Analyst: [Reduce alert fatigue / Faster investigation / Better context]\nIT Manager (SMB): [Easy deployment / Low maintenance / Clear ROI]\n\nSALES MOTION\n□ Inbound (content / SEO-driven) → Trial → Self-serve → Land/expand\n□ Outbound (SDR) → CISO cold outreach → Demo → POC → Close\n□ Channel / MSSP — partner-led delivery\n\nSALES CYCLE\nSMB: [30–60 days]  |  Mid-market: [60–90 days]  |  Enterprise: [6–12+ months]\nPOC requirements: [X weeks / specific success criteria / environment access]\nSecurity questionnaire: [Standard CAIQ / Custom — response time [X days]]\n\nCOMPETITIVE BATTLECARDS\n[Competitor A] — Win when: [Scenarios where you win] / Lose when: [Scenarios where they win]\n[Competitor B] — Win when: [Scenarios] / Lose when: [Scenarios]\n\nPRICING MODEL\n□ Per endpoint / per user / per asset\n□ Annual contract (ACVs: SMB $[X]K / Mid-market $[X]K / Enterprise $[X]K+)\n□ MSSP: [Per managed endpoint / revenue share]\nFree tier / POC policy: [[X]-day free trial / Managed POC with SE support]` },
    { name: "Incident Response Playbook", type: "document", folder: "Operations & IR", content: `INCIDENT RESPONSE PLAYBOOK — [COMPANY NAME]\nVersion: [#]  |  Date: [Date]  |  Owner: [CISO / Security Team Lead]\n\nSEVERITY CLASSIFICATION\nP0 — Critical: [Active breach / Ransomware / Data exfiltration in progress]\n  Response: Immediate — all-hands — [CEO + Board notified within [X hours]]\nP1 — High: [Confirmed intrusion / PII exposure / Insider threat confirmed]\n  Response: Within [1 hour]\nP2 — Medium: [Suspicious activity / Anomaly requiring investigation]\n  Response: Within [4 hours (business hours)]\nP3 — Low: [Policy violation / Failed login surge / Phishing attempt (no click)]\n  Response: Within [24 hours]\n\nINITIAL RESPONSE CHECKLIST\n□ Incident declared by: [Who can declare]\n□ IRT assembled: [Names + escalation path]\n□ Communication channel: [Slack #incident / Signal / Out-of-band if comms compromised]\n□ Legal notified: [Internal counsel / External — [firm name]]\n□ Evidence preserved: [Forensic snapshot before remediation]\n□ Timeline started: [Timestamp all actions]\n\nCONTAINMENT\n□ Affected systems isolated (network segmentation / host quarantine)\n□ Compromised credentials revoked\n□ C2 communication blocked\n□ Backup systems verified (not connected to compromised segment)\n\nNOTIFICATION OBLIGATIONS\nCustomer notification: [Required if customer data affected — within [X hours / days]]\nRegulatory (GDPR): [72 hours to supervisory authority]\nRegulatory (HIPAA): [60 days for covered entities]\nSEC (public companies): [4 business days for material incidents]\nState AG notification: [Per applicable state breach laws]\n\nPOST-INCIDENT\n□ Root cause analysis (RCA) completed within [5 business days]\n□ Remediation plan with owners and deadlines\n□ Board/executive briefing prepared\n□ Lessons learned incorporated into controls` },
    { name: "Threat Intelligence Program", type: "document", folder: "Threat Intelligence", content: `THREAT INTELLIGENCE PROGRAM — [COMPANY NAME]\n\nTI PROGRAM GOALS\n1. [Reduce mean time to detect (MTTD) by [X]%]\n2. [Provide actionable IOCs to SOC within [X minutes] of public disclosure]\n3. [Enable proactive threat hunting for [TTPs] relevant to our industry]\n\nINTELLIGENCE SOURCES\nOpen source (OSINT):\n  □ AlienVault OTX  □ MISP feeds  □ abuse.ch  □ VirusTotal  □ Shodan\n  □ ISACs: [FS-ISAC / H-ISAC / MS-ISAC / sector-specific]\n  □ Government: [CISA advisories / FBI alerts / NCSC / NSA]\n\nCommercial:\n  □ [Recorded Future / Mandiant / Crowdstrike Intel / Intel 471 / Team Cymru]\n\nInternally generated:\n  □ Honeypots / honeytokens\n  □ Incident response learnings\n  □ Threat hunting findings\n\nINTELLIGENCE TYPES\nStrategic: [Board-level threat landscape briefings — quarterly]\nOperational: [Campaigns targeting our industry / Threat actor profiles]\nTactical: [IOCs — IPs, domains, hashes, email subjects — fed to SIEM/EDR]\nTechnical: [CVE priority scoring / Patch urgency ranking]\n\nINTEL WORKFLOW\nCollect → Process → Analyze → Disseminate → Feedback\nSIEM integration: [Auto-ingest IOC feeds via STIX/TAXII]\nSOC consumption: [Daily IOC report / Automated block list update]\nPrioritization: [Score IOCs by: relevance to our industry / actor sophistication / freshness]\n\nMETRICS\nMTTD (mean time to detect): [Current X → Target Y]\nIOC coverage rate: [% of known threat actor TTPs we can detect]\nFalse positive rate: [%]  |  Threat hunt success rate: [%]` },
    { name: "Security Sales Engineering Toolkit", type: "document", folder: "Sales & GTM", content: `SECURITY SALES ENGINEERING TOOLKIT — [PRODUCT NAME]\n\nDEMO ENVIRONMENT\nDemo tenant: [URL / credentials]\nSample data: [Pre-populated with realistic security events — not real customer data]\nDemo scenarios:\n  1. [Alert triage workflow — [X minutes]]\n  2. [Threat hunting demo — [X minutes]]\n  3. [Compliance reporting — [X minutes]]\n  4. [Integration demo — connects to [SIEM / EDR / ticketing] — [X minutes]]\n\nPROOF OF CONCEPT (POC) FRAMEWORK\nPOC duration: [[X] weeks]\nScope: [Agent deployment on [X] endpoints / [X] data sources connected]\nSuccess criteria (agreed upfront with customer):\n  □ [X]% of test scenarios detected\n  □ False positive rate < [X]%\n  □ Deployment time < [X hours]\n  □ [Integration working with [specific tool]]\nPOC owner (customer): [Name / Role]\nPOC owner (us): [SE name]\n\nSECURITY QUESTIONNAIRE LIBRARY\nCapability domains: [Access control / Encryption / Availability / Incident response / Vendor management]\nStandard framework: [CAIQ v4 / CSA STAR / SIG Lite]\nCustom response library: [Answers maintained in [Google Sheets / Responsive / RFPIO]]\nSLA for response: [3 business days standard / 1 day expedited]\n\nRFP RESPONSE PROCESS\nStep 1: Qualify — [Is this a real opportunity? Budget? Timeline?]\nStep 2: Go/No-go decision — [Criteria]\nStep 3: Assign SE + AE + SME (compliance)\nStep 4: Draft in [Responsive / RFPIO / Google Docs]\nStep 5: Legal review (if required)\nStep 6: Submit + follow up` },
    { name: "Bug Bounty & Vulnerability Disclosure Program", type: "document", folder: "Operations & IR", content: `BUG BOUNTY & VULNERABILITY DISCLOSURE PROGRAM — [COMPANY NAME]\n\nPROGRAM OVERVIEW\nProgram type: □ Private (invite-only researchers)  □ Public (open to all)\nPlatform: [HackerOne / Bugcrowd / Intigriti / Self-hosted]\nProgram URL: [https://]\nScope: [What can researchers test?]\nOut of scope: [What's explicitly off-limits?]\n\nIN-SCOPE ASSETS\n□ [Web application: https://app.[company].com]\n□ [API: https://api.[company].com]\n□ [Mobile app: iOS + Android]\n□ [Specific subdomains: [list]]\n\nOUT-OF-SCOPE\n□ Social engineering / phishing of staff\n□ Denial of service / volumetric attacks\n□ Physical attacks\n□ Testing against customer environments\n□ [Specific domains / systems — list]\n\nREWARD TABLE\nCritical (CVSS 9.0+): $[X,000]–$[X,000]\nHigh (7.0–8.9): $[X,000]–$[X,000]\nMedium (4.0–6.9): $[X00]–$[X,000]\nLow (0.1–3.9): [Swag / Hall of fame / $[X00]]\n\nDISCLOSURE POLICY\nAcknowledgment: Within [3] business days of report\nTriage: Within [10] business days\nFix timeline: Critical [7 days] / High [30 days] / Medium [90 days]\nPublic disclosure: [After fix deployed + [X days] / Coordinated with researcher]\nSafe harbor: [Researchers who follow program rules will not face legal action]\n\nVULNERABILITY REPORTING CONTACT\nEmail: [security@[company].com]\nPGP key: [Key ID or link]\nResponse SLA: [72 hours]` },
  ],

  "LegalTech": [
    { name: "Product Vision & Legal Workflow Analysis", type: "document", folder: "Product & Workflow", content: `PRODUCT VISION & LEGAL WORKFLOW ANALYSIS — [PRODUCT NAME]\nCategory: □ Contract Lifecycle Management (CLM)  □ Legal Research  □ E-discovery  □ Document Automation  □ Legal Marketplace  □ Matter Management  □ Compliance Automation  □ Legal Analytics\nTarget customer: □ BigLaw  □ In-house legal  □ Mid-size firm  □ Solo/Small firm  □ SMB (non-legal dept)\n\nPROBLEM\n[What specific legal workflow inefficiency, cost, or risk do you eliminate?]\nQuantification: [Hours saved / Cost reduced / Error rate eliminated / Risk mitigated]\n\nSOLUTION\n[Your product in 2–3 sentences]\n\nCURRENT STATE WORKFLOW (what you replace/augment)\nStep 1: [Current manual step — e.g., Draft NDA by pulling from Word template folder]\nStep 2: [Current step — e.g., Email for review → 3-day lag]\nStep 3: [Current step — e.g., Track changes in email threads — version confusion]\nStep 4: [Current step — e.g., Print, sign, scan, email — no audit trail]\nPain: [Time / Risk / Cost / Inconsistency / Collaboration friction]\n\nFUTURE STATE WORKFLOW (with your product)\nStep 1: [e.g., Auto-generate NDA from clause library in 2 minutes]\nStep 2: [e.g., AI review flags non-standard terms immediately]\nStep 3: [e.g., Negotiation in-platform with tracked changes]\nStep 4: [e.g., E-signature + auto-archive with metadata]\n\nCOMPETITIVE LANDSCAPE\n[Competitor 1 — e.g., DocuSign CLM]: [Their strength / Your differentiation]\n[Competitor 2 — e.g., Ironclad]: [Their strength / Your differentiation]\n[Competitor 3]: [Their strength / Your differentiation]\nWhy now: [AI capability / Law firm transformation pressure / In-house budget pressure / M&A volume]` },
    { name: "AI & NLP Feature Specification", type: "document", folder: "Data & AI", content: `AI & NLP FEATURE SPECIFICATION — [PRODUCT NAME]\n\nAI CAPABILITIES\n1. CONTRACT ANALYSIS\n  Input: [Contract PDF / Word / uploaded text]\n  Extractions: [Party names / Dates / Payment terms / Termination clauses / Governing law / Liability caps / IP ownership / Non-compete]\n  Classification: [Contract type / Risk level / Standard vs. non-standard clauses]\n  Model approach: [Fine-tuned LLM / Legal-specific model — e.g., GPT-4 fine-tuned on contracts / Lexion / SpotDraft AI]\n  Accuracy target: [X]% on held-out test set\n\n2. CONTRACT DRAFTING ASSISTANT\n  Clause library: [X,000] standard clauses tagged by [type / jurisdiction / industry]\n  Fallback positions: [Preferred / Acceptable / Walk-away for each key clause type]\n  Tone/style: [Formal / Plain language]\n  Jurisdiction-aware: [Applicable — [Jurisdictions supported]]\n\n3. DUE DILIGENCE AUTOMATION\n  Document types: [Purchase agreements / Employment agreements / IP assignments / Licenses / Litigation history]\n  Output: [Risk summary / Key terms table / Flagged issues]\n  Workstream: [Upload VDR documents → AI processes → Produces preliminary diligence memo]\n\n4. LEGAL RESEARCH (if applicable)\n  Sources: [Westlaw / LexisNexis / Court opinions / Statutes / Regulations]\n  Query: [Natural language → Relevant case law + statutes]\n  Citation accuracy: [Hallucination prevention — verified citation only]\n\nCOMPLIANCE & ETHICS\n□ Attorney-client privilege protection — AI output is work product\n□ No training on customer data without consent\n□ Model transparency — can explain reasoning\n□ Jurisdiction disclosure — AI doesn't constitute legal advice\n□ UPL (Unauthorized Practice of Law) guardrails implemented` },
    { name: "Legal & Regulatory Compliance Framework", type: "document", folder: "Legal & Compliance", content: `LEGAL & REGULATORY COMPLIANCE FRAMEWORK — [COMPANY NAME]\n\nUNAUTHORIZED PRACTICE OF LAW (UPL) ANALYSIS\nJurisdictions operating in: [List states / countries]\nUPL risk: □ High — product provides legal advice  □ Medium — document generation  □ Low — pure productivity tool\nMitigation:\n  □ Prominent disclaimers: "This is not legal advice"\n  □ Attorney review required before reliance\n  □ State bar ethics opinions obtained: [States]\n  □ Outside counsel opinion: [Firm name — obtained / planned]\n  □ Model rules compliance reviewed: [ABA Model Rules 5.5, 7.2, 7.4]\n\nDATA PRIVACY & CONFIDENTIALITY\nAttorney-client privilege:\n  □ Not waived by use of platform (non-disclosure with service provider)\n  □ BAA / Data Processing Agreement includes privilege protections\nGDPR (EU):\n  □ Legal basis: [Contract performance / Legitimate interest]\n  □ DPA signed with all processors\n  □ Data deletion: [Automated deletion at [X months] / On request]\nCCPA: [Compliant — privacy policy updated / Not applicable]\nHIPAA: [If processing health legal matter data — BAA required]\n\nSOC 2 & SECURITY\nSOC 2 Type II: [Certified / In progress — target Q[X]]\nEncryption: AES-256 at rest / TLS 1.3 in transit\nAccess control: [Role-based access — matter-level permissions]\n\nADMINISTRATIVE & REGULATORY\nState bar relationships: [Direct engagement / Ethics opinions]\nLegal tech-specific regulation: [UK: Legal Services Act / AUS: Legal Profession Uniform Law / CA: Pending regulation]\nE-signature compliance: [eSign Act (US) / eIDAS (EU) / jurisdiction-specific]` },
    { name: "GTM & Legal Buyer Playbook", type: "document", folder: "Sales & GTM", content: `GTM & LEGAL BUYER PLAYBOOK — [PRODUCT NAME]\n\nTARGET BUYERS\nPrimary: General Counsel / Deputy GC / VP Legal (in-house)\nSecondary: Legal Operations Manager / Chief Legal Officer\nLaw firm: Practice group chair / Innovation partner / COO of firm\nSMB: Business owner / HR manager (non-legal buyer)\n\nBUYER PSYCHOLOGY\nIn-house legal: [Overwhelmed by volume / Under-resourced / Being asked to do more with less / Need to prove legal ROI to CFO]\nLaw firm: [Billable hour model resists efficiency tools / But client pressure + competitive threat is changing this]\nLegal ops: [Budget holder increasingly / Loves data / Wants workflow integration]\n\nSALES CYCLE\nIn-house (SMB): [30–60 days]\nIn-house (Enterprise): [90–180 days — security review + legal review of vendor agreement!]\nLaw firm: [6–18 months — committee approval / CTO + MP sign-off]\n\nSALES MOTION\n□ PLG — self-serve trial → convert to paid\n□ Outbound SDR → Demo → POC → Close\n□ Legal ops / ACC community partnerships\n□ Integration partner (e.g., Microsoft Teams / Salesforce / Workday legal) channel\n\nKEY OBJECTIONS\nObjection: "Our lawyers won't trust AI"\nResponse: [AI is a starting point — attorney always reviews; reduces 80% of time on low-value tasks]\n\nObjection: "What about privilege?"\nResponse: [Our BAA + DPA protects privilege / Attorney work product doctrine applies / We don't train on your data]\n\nObjection: "We already have [Word + DocuSign]"\nResponse: [That's not CLM — [X hours/week saved per lawyer / [ROI calculation]]\n\nPRICING\nSelf-serve: $[X]/seat/month (monthly)\nTeam: $[X]/seat/month (annual, min [X] seats)\nEnterprise: Custom (annual contract, SOC 2 + security review + custom DPA)` },
    { name: "Integration Architecture", type: "document", folder: "Engineering", content: `INTEGRATION ARCHITECTURE — [PRODUCT NAME]\n\nCORE INTEGRATIONS\n1. Document storage:\n   □ SharePoint / OneDrive — [OAuth2 / Graph API]\n   □ Google Drive — [Google Workspace OAuth]\n   □ Box — [Box API]\n   □ NetDocuments — [LegalTech-specific DMS]\n   □ iManage — [Law firm DMS standard]\n\n2. E-signature:\n   □ DocuSign — [REST API + webhooks]\n   □ Adobe Sign — [REST API]\n   □ HelloSign (Dropbox Sign)\n\n3. CRM / matter management:\n   □ Salesforce — [SFDC integration for contract origination]\n   □ Clio / MyCase / PracticePanther — [Law practice management]\n   □ ServiceNow Legal — [Enterprise legal ops]\n\n4. Communication:\n   □ Microsoft Teams — [bot + app]\n   □ Slack — [slash commands + notifications]\n   □ Outlook / Gmail add-ins\n\n5. ERP / Finance (for contract obligations tracking):\n   □ SAP / Oracle NetSuite — [Contract value, payment terms sync]\n\nINTEGRATION ARCHITECTURE\nApproach: □ Direct API integration  □ Middleware (Zapier / Workato / Boomi)  □ iPaaS\nWebhook events: [Contract signed / Expiry approaching / Approval requested / Clause risk flagged]\nSSO: [SAML 2.0 / OIDC — Okta / Azure AD / Ping]\nAPI: [REST + OpenAPI 3.0 / Webhooks + event subscriptions]\nData sync frequency: [Real-time / Hourly / Daily]\n\nSECURITY FOR INTEGRATIONS\n□ OAuth 2.0 scoped permissions (minimal access principle)\n□ Token rotation\n□ Audit log of all integration data access\n□ Customer-controlled integration enable/disable` },
    { name: "Revenue Model & Pricing Strategy", type: "document", folder: "Sales & GTM", content: `REVENUE MODEL & PRICING STRATEGY — [PRODUCT NAME]\n\nPRIMARY REVENUE MODEL\n□ Per seat / per user — most common for legal SaaS\n□ Volume-based — per contract processed / per document\n□ Outcome-based — per deal closed / per matter resolved\n□ Platform fee + usage — base + metered\n\nPRICING TIERS\nStarter (self-serve):\n  Price: $[X]/seat/month (billed monthly) or $[X]/seat/year\n  Seats: [1–[X] seats]\n  Features: [Core CLM / Basic AI / [X] storage]\n  Target: [Solo / small firm / SMB legal dept]\n\nTeam:\n  Price: $[X]/seat/month (annual)\n  Seats: [Min [X] seats]\n  Features: [+Advanced AI / Workflow automation / Integrations / Admin dashboard]\n\nEnterprise:\n  Price: Custom (ACV $[X]K+)\n  Features: [+Custom templates / SSO / Dedicated CSM / Custom SLA / Security review / Custom DPA]\n  Sales-assisted: [SE + AE + CS team]\n\nADD-ONS\n[Add-on 1: AI clause library — $[X]/month]\n[Add-on 2: Advanced analytics / reporting — $[X]/month]\n[Add-on 3: Additional storage — $[X]/TB/month]\n\nUNIT ECONOMICS\nCAC: $[X]  |  Payback: [X months]\nGross margin: [%]  |  Net Revenue Retention (NRR): [%]\nACV (avg): $[X]  |  ARR target [Year 2]: $[X]M` },
    { name: "Contract Intelligence Roadmap", type: "document", folder: "Data & AI", content: `CONTRACT INTELLIGENCE ROADMAP — [PRODUCT NAME]\n\nCURRENT AI CAPABILITIES (MVP)\n✓ [Capability 1 — e.g., Party and date extraction]\n✓ [Capability 2 — e.g., Contract type classification]\n✓ [Capability 3 — e.g., Key clause identification]\n\nROADMAP\n\nQ[X] — CORE EXTRACTION\n□ [Entity extraction: parties, dates, amounts, jurisdictions]\n□ [Clause classification: [X] clause types with [X]% accuracy target]\n□ [Risk flagging: non-standard vs. standard clause comparison]\n□ [Expiry / renewal alerts: automated calendar events]\nModel: [Fine-tuned GPT-4 / Legal BERT / LegalBench evaluation]\n\nQ[X] — NEGOTIATION INTELLIGENCE\n□ [Playbook enforcement: flag deviations from approved fallback positions]\n□ [Redline suggestions: auto-propose alternative clause language]\n□ [Negotiation analytics: track what terms get changed / who asks for what]\n□ [Benchmarking: compare your terms vs. market standard]\n\nQ[X] — PORTFOLIO INTELLIGENCE\n□ [Obligation tracking: payment dates / milestones / deliverables across all contracts]\n□ [Exposure analytics: total liability cap exposure / IP ownership map]\n□ [Renewal pipeline dashboard]\n□ [Cross-contract search: find all contracts with [Supplier X] or [Clause Y]]\n\nQ[X] — PREDICTIVE & GENERATIVE\n□ [Predictive dispute risk: flag contracts likely to lead to disputes]\n□ [Auto-drafting from intake form + clause library]\n□ [Plain language summaries for non-lawyers]\n□ [Multi-language support: [Languages]]` },
    { name: "Legal Ops Metrics Dashboard", type: "document", folder: "Product & Workflow", content: `LEGAL OPS METRICS DASHBOARD — [COMPANY NAME]\nReporting period: [Monthly / Quarterly]  |  Reviewed by: [GC / Legal Ops Manager]\n\nVOLUME METRICS\nContracts executed: [#]  |  vs. prior period: [+/-#]\nAvg contract cycle time: [X days] (request → signature)\n  By type: NDA [X days] / MSA [X days] / SOW [X days]\nContracts in review (open): [#]  |  Oldest open: [X days]\nMatters opened (if tracking): [#]\n\nEFFICIENCY METRICS\nTime saved by AI (est.): [X hours/week across legal team]\nSelf-service contract rate: [% of contracts handled without lawyer review]\nContract request backlog: [#] (target: < [#])\nLegal team capacity utilization: [%]\n\nRISK & COMPLIANCE METRICS\nExpiring contracts (next 30 days): [#]  |  High-value (>[threshold]): [#]\nNon-standard clause frequency: [Most common non-standard asks this period]\nSLA compliance (response within [X] days): [%]\n\nCOST METRICS\nTotal legal spend: $[X]  |  Inside vs. outside counsel: [%] / [%]\nCost per contract: $[X]\nOutside counsel spend by firm: [Firm 1: $X] / [Firm 2: $X]\nBudget vs. actual: [%]\n\nACTIONS FROM THIS REPORT\n1. [Insight → Action]\n2. [Insight → Action]\n3. [Process improvement to test next period]` },
  ],

  "HRTech / WorkTech": [
    { name: "Product Vision & HR Buyer Analysis", type: "document", folder: "Product & Features", content: `PRODUCT VISION & HR BUYER ANALYSIS — [PRODUCT NAME]\nCategory: □ ATS (Applicant Tracking)  □ HRIS/HCM  □ Performance Management  □ Employee Engagement  □ Learning & Development (LMS)  □ Payroll  □ Workforce Analytics  □ Remote Work Platform  □ Benefits Administration\nMarket segment: □ SMB (< 100 employees)  □ Mid-market (100–1,000)  □ Enterprise (1,000+)\n\nPROBLEM\n[What HR/workforce pain are you solving? For who? What's the cost of the status quo?]\n\nSOLUTION\n[Your product in 2–3 sentences — what it does and the outcome it creates]\n\nHR BUYER LANDSCAPE\nPrimary buyer: [CHRO / VP HR / HR Manager / Head of People Ops]\nSecondary influencer: [CEO / COO / IT / Finance]\nBuying trigger: [Rapid headcount growth / Compliance failure / High turnover / System consolidation / IPO prep]\n\nCOMPETITIVE LANDSCAPE\n[Competitor 1 — e.g., Workday]: [Their strength] vs. us: [Your differentiation]\n[Competitor 2 — e.g., BambooHR]: [Their strength] vs. us: [Your differentiation]\n[Competitor 3 — e.g., Greenhouse]: [Their strength] vs. us: [Your differentiation]\nWhy now: [Remote/hybrid shift / DE&I pressure / AI capability / Skills-based hiring / Compliance complexity]\n\nDIFFERENTIATION\n[What do you do differently that matters to your target buyer?]\nData / AI advantage: [Unique dataset / Better predictions / Specific ML application]\nIntegration advantage: [Works with [existing stack] natively]\nUser experience: [Designed for [specific persona] — e.g., frontline workers vs. desk workers]` },
    { name: "Core Feature Specification", type: "document", folder: "Product & Features", content: `CORE FEATURE SPECIFICATION — [PRODUCT NAME]\n\nFEATURE SET\n1. [CORE FEATURE 1 — e.g., Applicant Tracking]\nDescription: [What it does]\nUser stories:\n  • As a [recruiter], I want to [post a job to multiple job boards] so that [I reach more candidates without duplicate work]\n  • As a [hiring manager], I want to [see ranked candidates with AI summaries] so that [I can quickly shortlist without reading every resume]\nAcceptance criteria: [List specific, testable criteria]\nIntegrations required: [LinkedIn / Indeed / Greenhouse / Calendar]\nEdge cases: [What happens when...]\n\n2. [CORE FEATURE 2 — e.g., Onboarding Workflow]\nDescription: []\nUser stories:\n  • As a [new hire], I want to [complete all onboarding docs digitally] so that [I can start working faster]\n  • As an [HR manager], I want to [track onboarding completion status] so that [I know who is delayed]\nAcceptance criteria: []\n\n3. [CORE FEATURE 3 — e.g., Performance Reviews]\nDescription: []\nUser stories:\n  • [Story]\nAcceptance criteria: []\n\nMOBILE REQUIREMENTS\n□ iOS + Android app  □ Responsive web  □ Mobile-first design\nMobile-specific flows: [Employee check-ins / Time tracking / Feedback submission]\n\nACCESSIBILITY\n□ WCAG 2.1 Level AA  □ Screen reader compatible\n□ Multi-language / i18n: [Languages — [EN / ES / FR / DE / etc.]]` },
    { name: "People Analytics Framework", type: "document", folder: "Data & Analytics", content: `PEOPLE ANALYTICS FRAMEWORK — [COMPANY/PRODUCT NAME]\n\nKEY HR METRICS TRACKED\nTalent Acquisition:\n  Time-to-hire: [Avg X days — benchmark: [Y days]]\n  Time-to-fill: [Avg X days]\n  Cost-per-hire: $[X] — benchmark: $[Industry avg]\n  Offer acceptance rate: [%]\n  Source of hire (channel mix): [%]\n  Diversity pipeline: [% candidates by [demographic] at each stage]\n\nEmployee Performance:\n  Performance rating distribution: [% high / mid / low]\n  Calibration completion rate: [%]\n  Goal completion rate: [%]\n  360 feedback participation: [%]\n\nEngagement & Retention:\n  eNPS (Employee Net Promoter Score): [Score] — benchmark: [Y]\n  Voluntary turnover rate: [%] — benchmark: [Y%]\n  Regrettable attrition: [% of voluntary leavers who were high performers]\n  Avg tenure: [X years]\n  Engagement survey score: [X/10]\n\nWorkforce Planning:\n  Headcount by department: [Table]\n  Open req count: [#]  |  Avg time-to-fill by dept: [X days]\n  Internal mobility rate: [% of open roles filled internally]\n\nAI PREDICTIONS (if applicable)\n  Attrition risk model: [Predict employees likely to leave in next 90 days]\n  Inputs: [Tenure / Manager / Pay equity / Engagement / Promotion recency]\n  Accuracy target: [X]% precision at [Y]% recall\n  Action taken: [Manager notification + retention conversation trigger]` },
    { name: "Compliance & Employment Law Tracker", type: "document", folder: "Operations", content: `COMPLIANCE & EMPLOYMENT LAW TRACKER — [COMPANY NAME]\n\nFEDERAL COMPLIANCE (US)\n□ FLSA (Fair Labor Standards Act) — wage & hour, overtime, exempt/non-exempt classification\n□ FMLA (Family & Medical Leave Act) — leave tracking, eligibility, designation\n□ ADA (Americans with Disabilities Act) — accommodation process documented\n□ EEOC/Title VII — anti-discrimination policies, complaint process\n□ ADEA — age discrimination (40+ protected class)\n□ NLRA — employee rights to organize (applies to all, not just union)\n□ I-9 / E-Verify — employment eligibility verification\n□ EEO-1 reporting (if 100+ employees or federal contractor)\n\nSTATE & LOCAL COMPLIANCE\n□ State minimum wage: [State: $X.XX — effective date]\n□ Pay transparency laws: [CA / CO / NY / WA — salary ranges in job postings]\n□ Non-compete enforceability: [State-specific — CA bans / others vary]\n□ Paid leave: [State PTO/sick leave mandates — [State]: [X days]]\n□ WARN Act (50+ employees): [60-day notice for mass layoffs]\n□ Ban-the-box: [Criminal history inquiry restrictions — [jurisdictions]]\n□ State biometric data laws: [IL BIPA / TX / WA — consent required]\n\nHR TECH COMPLIANCE (PRODUCT)\n□ AI bias audit: [If using AI in hiring/performance — NYC Local Law 144 / potential EEOC guidance]\n□ GDPR employee data: [HR data for EU employees — DPA / transfer mechanisms]\n□ CCPA employee data: [CA employee privacy rights]\n□ ADA-accessible product: [Product accessibility for employees with disabilities]\n\nCOMPLIANCE CALENDAR\nEEO-1 filing deadline: [Annually — September 30]\nW-2 distribution: [January 31]\n[State-specific filings]: [Dates]` },
    { name: "Integration Ecosystem Map", type: "document", folder: "Engineering", content: `INTEGRATION ECOSYSTEM MAP — [PRODUCT NAME]\n\nCORE INTEGRATIONS\n1. Payroll:\n   □ ADP — [Workforce Now / Run] via API  □ Gusto  □ Paychex  □ Rippling  □ Ceridian\n   Data sync: [Employee records / Salary changes / Terminations / Tax info]\n   Sync frequency: [Real-time events / Daily batch]\n\n2. Benefits Administration:\n   □ Benefitfocus  □ bswift  □ Lumity  □ Maxwell Health\n   Data: [Enrollment status / Benefit elections / Life events]\n\n3. HRIS / HCM (if ATS):\n   □ Workday  □ SAP SuccessFactors  □ Oracle HCM  □ BambooHR  □ HiBob\n   Integration type: [SFTP file-based / REST API / Workday SOAP]\n\n4. Calendar / Scheduling:\n   □ Google Calendar  □ Outlook  □ Greenhouse / Calendly\n   Use: [Interview scheduling / 1-on-1 scheduling / PTO calendar sync]\n\n5. Communication:\n   □ Slack — [Notifications / manager alerts / survey delivery]\n   □ Microsoft Teams — [Bot + app]\n\n6. Background Check:\n   □ Checkr  □ Sterling  □ HireRight\n   Flow: [Candidate consent → Vendor checks → Results to ATS]\n\n7. Job Boards (if ATS):\n   □ LinkedIn  □ Indeed  □ Glassdoor  □ ZipRecruiter  □ AngelList / Wellfound\n\nINTEGRATION STANDARDS\nAPI style: [REST + webhooks]  |  Auth: [OAuth2 / SAML SSO]\nData format: [JSON / CSV for bulk]\nIDP (SSO): [Okta / Azure AD / Google Workspace]` },
    { name: "GTM & HR Buyer Journey", type: "document", folder: "GTM & Partnerships", content: `GTM & HR BUYER JOURNEY — [PRODUCT NAME]\n\nTARGET SEGMENTS\nSegment 1: [High-growth startups 50–200 employees — first real HR system]\n  Pain: [Outgrown spreadsheets / Compliance exposure / Bad candidate experience]\n  Budget: $[X]–$[X]/month\n  Buying timeline: [30–60 days]\n\nSegment 2: [Mid-market 200–1,000 employees — replacing legacy system]\n  Pain: [Siloed systems / Reporting gaps / Employee experience lagging]\n  Budget: $[X]K–$[X]K/year\n  Buying timeline: [90–180 days]\n\nACQUISITION CHANNELS\nContent / SEO:\n  Primary keywords: [HR software / best ATS / employee onboarding software]\n  Content strategy: [Comparison guides / Compliance guides / HR templates]\n\nCommunity:\n  [SHRM / HR Open Source / People Ops Society]\n  [HR/People Ops Slack communities: People First / HR in Tech / etc.]\n\nPartnerships:\n  [PEO partnerships — Justworks / TriNet / Insperity]\n  [Payroll partner channels — ADP Marketplace / Gusto partner program]\n  [VC portfolio HR tooling recommendation programs]\n\nPAYBACK STORY (for CFO/CEO)\nCurrent cost: [External recruiter fees $[X]K/hire × [X] hires/year = $[X]K]\nProduct cost: $[X]K/year\nSavings: $[X]K/year  |  Payback: [X months]\nAdditional ROI: [X hours/week HR time saved × $[X]/hour = $[X]K/year]` },
    { name: "Employee Experience Design Principles", type: "document", folder: "Product & Features", content: `EMPLOYEE EXPERIENCE DESIGN PRINCIPLES — [PRODUCT NAME]\n\nDESIGN PHILOSOPHY\n[What is your fundamental belief about how HR software should feel to use?]\n\nKEY DESIGN PRINCIPLES\n1. [Employee-first, not admin-first]\n   [Employees are the primary users. If the experience is great for employees, HR benefits too.]\n\n2. [Reduce friction at every step]\n   [No task should require more clicks than necessary. Onboarding should feel like a product, not paperwork.]\n\n3. [Mobile-first for frontline, desktop-enhanced for desk workers]\n   [Deskless workers need everything on mobile. Knowledge workers need richer features on desktop.]\n\n4. [Proactive, not reactive]\n   [Surface the right action at the right time — don't make users hunt for what to do next.]\n\n5. [Transparent data usage]\n   [Employees should know what data is collected, who sees it, and how it's used — especially for analytics.]\n\nKEY USER JOURNEYS (prioritized by UX polish)\n1. New hire onboarding — first impression: [Steps + time to complete target]\n2. Time off request — frequency: [High — must be frictionless]\n3. Performance review — emotional charge: [High — design for psychological safety]\n4. Benefits enrollment — complexity: [High — guided, not overwhelming]\n5. Paycheck view — trust: [Critical — accuracy + clarity]\n\nACCESSIBILITY FOR ALL WORKERS\n□ Low-literacy design: [Plain language / Icon-supported navigation]\n□ Language support: [Languages]\n□ Variable digital literacy: [Onboarding for first-time app users]\n□ Shift worker UX: [No required desktop / works during shift changes]` },
  ],

  "AgriTech": [
    { name: "Agronomy & Science Foundation", type: "document", folder: "Agronomy & Science", content: `AGRONOMY & SCIENCE FOUNDATION — [PRODUCT/COMPANY NAME]\nFocus area: □ Precision agriculture  □ Crop protection  □ Soil health  □ Irrigation optimization  □ Crop monitoring / remote sensing  □ Livestock / animal health  □ Vertical / controlled environment agriculture\nCrop(s) targeted: [Corn / Soy / Wheat / Specialty crops / Tree crops / [Specific crop]]\nGeography: [US Midwest / California / Global / [Specific regions]]\n\nPROBLEM\n[What agricultural challenge does this address? What are the farmer's costs/losses from this problem?]\nScale: [# acres affected nationally / Crop loss % / $ loss per acre]\n\nSCIENCE BASE\n[What is the underlying agronomic or biological science that makes your solution work?]\nKey research: [University partner / Published studies / Own trial data]\nValidation: [Field trials — [# plots / # locations / # years]]\n\nPRODUCT-SCIENCE CONNECTION\n[How does your product operationalize the science? What does the farmer actually do differently?]\nKey inputs: [Soil data / Weather / Satellite imagery / Scout data / Sensor readings]\nKey outputs: [Variable rate prescription / Yield prediction / Disease alert / Irrigation schedule]\n\nFARMER VALUE PROPOSITION\n[Quantified benefit: $[X]/acre increase / [X]% yield improvement / [X]% input cost reduction]\nROI example: [On a [1,000]-acre corn farm, this saves $[X] per year]\n\nSEASONAL WORKFLOW\nPre-season: [What farmer does with your product — soil sampling / field planning / input ordering]\nIn-season: [Monitoring / scouting / intervention]\nPost-harvest: [Yield analysis / Soil health report / Planning for next season]` },
    { name: "Platform & Data Architecture", type: "document", folder: "Software & Platform", content: `PLATFORM & DATA ARCHITECTURE — [PLATFORM NAME]\n\nDATA SOURCES\n□ Satellite imagery: [Planet / Maxar / Sentinel-2 (free) / Landsat (free)] — [Frequency / Resolution]\n□ Drone / aerial: [DJI / senseFly / Fixed-wing] — [Coverage / Resolution]\n□ In-field sensors: [Soil moisture / Weather station / Yield monitor / VRT applicator]\n□ Farm management system (FMS): [John Deere Operations Center / Climate FieldView / Granular / Farmers Edge]\n□ Public datasets: [USDA NASS / NOAA weather / SSURGO soils / NLCD land cover]\n□ Market data: [CBOT commodity prices / Local basis / Input costs]\n\nDATA PIPELINE\nCollect → [Ingest / Clean / Normalize] → [Process / Analyze] → [Insights / Prescriptions] → [Deliver to farmer]\nData format: [GeoTIFF / Shapefile / GeoJSON / CSV / API streams]\nGeospatial processing: [Google Earth Engine / GDAL / PostGIS / GeoPandas]\nStorage: [AWS S3 for raw / PostgreSQL + PostGIS for spatial queries / Time-series DB for sensor data]\n\nFARM MANAGEMENT INTEGRATION\nFieldView integration: [Climate Corp API]\nJohn Deere Operations Center: [MyJohnDeere API — machine data, field boundaries]\nISO-XML / ISOBUS: [Precision ag machine standard — VRT prescription delivery]\nAGRON standard: [If applicable]\n\nMACHINE LEARNING MODELS\nYield prediction: [Random Forest / XGBoost on: [features]]\nDisease/pest detection: [CNN on aerial/satellite imagery]\nSoil property mapping: [Kriging / ML interpolation from sample points]\nModel validation: [Cross-validation / Hold-out field test / 3rd party trial]\n\nFARMER INTERFACE\n□ Web dashboard  □ Mobile app (iOS + Android)  □ SMS alerts (low connectivity areas)\nConnectivity handling: [Offline mode — data syncs when connected]` },
    { name: "Hardware & Sensor Deployment Guide", type: "document", folder: "Hardware & Sensors", content: `HARDWARE & SENSOR DEPLOYMENT GUIDE — [PRODUCT NAME]\n\nSENSOR TYPES\n□ Soil moisture sensors: [Brand / Depth — [4\", 8\", 16\", 24\"] / Wireless protocol — LoRa / BLE / Cellular]\n□ Weather stations: [Brand / Parameters: temp, humidity, wind, rainfall, ET]\n□ Canopy sensors: [NDVI / chlorophyll / biomass estimation]\n□ Dendrometers (tree crops): [Trunk diameter fluctuation — water stress indicator]\n□ Water flow meters: [Irrigation monitoring]\n□ Trap / pest monitoring: [Camera + AI identification]\n\nHARDWARE SPECIFICATIONS\nPower: [Solar + battery / Battery only — lifespan: [X months]]\nConnectivity: [LoRaWAN / NB-IoT / Cellular (LTE-M) / Satellite (Globalstar / Iridium for remote areas)]\nEnclosure: [IP67 rating / UV-resistant / Operating temp: [-[X]°C to [X]°C]]\nInstallation time: [Avg [X] minutes per sensor by farmer]\n\nNETWORK ARCHITECTURE\nLoRaWAN gateway: [1 gateway per [X] acres / [X km] range typical]\nCloud connectivity: [MQTT → AWS IoT Core / The Things Network]\nData telemetry: [Every [X] minutes / Configurable]\n\nSUPPLY CHAIN\nContract manufacturer: [Name / Location]\nBOM key components: [MCU / Radio module / Sensor element / Battery / Enclosure]\nLead time: [X weeks]\nTarget BOM cost: $[X] per unit  |  Target retail: $[X]\nFCC/IC certification: [Obtained / In progress — cost est. $[X]K]\n\nINSTALLATION SUPPORT\nInstallation guide: [Illustrated PDF + video]\nDealer/agronomist network: [Who installs in field]\nWarranty: [X years / Replace if defective]\nAnnual maintenance: [Battery replacement / Calibration]` },
    { name: "Supply Chain & Distribution Strategy", type: "document", folder: "Supply Chain", content: `SUPPLY CHAIN & DISTRIBUTION STRATEGY — [COMPANY NAME]\n\nGO-TO-MARKET CHANNELS\n□ Direct to farmer (digital): [Website / e-commerce / API]\n□ Ag retail / co-op: [Winfield United / Nutrien Ag Solutions / CHS / Regional co-ops]\n□ Agronomist / CCA (Certified Crop Adviser) network: [Independent CCAs as resellers/advisors]\n□ Seed company / input manufacturer: [Bundled with seed or input purchase — Channel co-sell]\n□ Farm equipment dealer: [John Deere dealer / Ag retailer]\n□ Crop insurance: [Bundled with policy — risk reduction story]\n\nFARMER SEGMENTS\nLarge commercial: [1,000+ acres] — focus: [ROI, data integration, operational efficiency]\nMid-size: [500–1,000 acres] — focus: [Easy to use, affordable, proven results]\nSmall / specialty: [<500 acres / specialty crops] — focus: [Crop-specific ROI, personal relationship]\nVertical/CEA: [Greenhouse / indoor] — [Different KPIs — yield/sqft, energy, water]\n\nSEASONAL SALES CYCLE\nNov–Jan: [Winter agronomy meetings / IFCA / commodity conferences — Awareness]\nFeb–Mar: [Pre-season product trials set up]\nApr–May: [In-season onboarding — planting decisions]\nJun–Aug: [In-season support / data collection]\nSep–Oct: [Harvest integration / ROI reporting / Renewal conversations]\n\nPRICING\n□ Per acre / per year: $[X]/acre/year (tiered by acreage)\n□ Per sensor: $[X] hardware + $[X]/month data subscription\n□ SaaS seat: $[X]/month for agronomist / large operator\n□ Data licensing to input companies: [Negotiated B2B]\n\nFARMER ROI STORY\nCost: $[X]/acre/year\nSavings from [e.g., reduced fertilizer]: $[X]/acre\nYield gain: [+X bu/acre × $[X]/bu = $[X]/acre]\nNet benefit: $[X]/acre  |  Payback: [X months / season]` },
    { name: "Regulatory & Data Privacy in Agriculture", type: "document", folder: "Business & GTM", content: `REGULATORY & DATA PRIVACY IN AGRICULTURE — [COMPANY NAME]\n\nFARM DATA PRIVACY\nFarm Bureau Principles (voluntary):\n  □ Transparency: Clear disclosure of what data is collected and why\n  □ Farmer control: Farmer owns their data / can delete it\n  □ Portability: Data exportable in open formats\n  □ No unauthorized sale: Farm data not sold without explicit consent\n  □ Security: Reasonable security measures implemented\n\nAg Data Coalition signatories: [Check if applicable — [Company] has / has not signed]\nData policy published at: [URL]\n\nREGULATORY ENVIRONMENT\nUSDA programs (if participating):\n  □ USDA AMS / NRCS data requirements\n  □ FSA farm record data — cannot be combined without consent\n  □ USDA research data sharing agreements\n\nEnvironmental compliance:\n  □ Water quality data — Clean Water Act implications\n  □ Pesticide application records — EPA requirements (FIFRA)\n  □ Organic certification data — USDA NOP requirements\n\nBIOLOGICAL / BIOTECH REGULATION (if applicable):\n  □ USDA APHIS — biotech crop regulation (Part 340)\n  □ EPA — biopesticide registration (FIFRA Section 25(b))\n  □ FDA — food safety (FSMA produce safety rule)\n\nINTERNATIONAL EXPORT / DATA COMPLIANCE:\n  □ GDPR — EU farmer data\n  □ Country-specific ag data regulations: [List]\n\nIPs & TRADE SECRETS\nAlgorithms / models: [Trade secret protection — reasonable security measures]\nPlant variety protection: [PVP certificate — if applicable]\nPatent: [Applied / Granted — Patent #[X]]` },
    { name: "Field Trial Design & Validation Protocol", type: "document", folder: "Agronomy & Science", content: `FIELD TRIAL DESIGN & VALIDATION PROTOCOL — [PRODUCT NAME]\n\nTRIAL OBJECTIVES\nObjective 1: [Demonstrate [X]% yield improvement vs. farmer standard practice (FSP)]\nObjective 2: [Validate [X]% reduction in [fertilizer / water / pesticide] use]\nObjective 3: [Confirm agronomic recommendations accuracy vs. ground truth]\n\nEXPERIMENTAL DESIGN\nDesign type: □ RCBD (Randomized Complete Block Design)  □ Strip trial  □ Alpha lattice\nTreatments:\n  T1: [Product / Service as recommended]\n  T2: [Farmer standard practice (FSP) — control]\n  T3: [Optional: intermediate rate]\nReplicates: [Minimum 4 per location]\nPlot size: [X acres per plot]\n\nTRIAL LOCATIONS\n[Location 1]: [Farm name / state / soil type / crop / farmer contact]\n[Location 2]: [Location details]\n[Location 3]: [Location details]\nNumber of locations: [Minimum [X] for statistical power]\nYears of data: [Minimum [2] seasons for robustness]\n\nDATA COLLECTED\n□ Yield (yield monitor + hand harvest calibration)\n□ Soil samples (pre- and post-season) — [Parameters: N / P / K / pH / OM / etc.]\n□ In-season scouting observations: [BBCH growth stages / disease/pest ratings]\n□ Weather data: [Daily temp / GDD / precip from on-site or nearest ASOS station]\n□ Input applications: [Rate / Timing / Product applied]\n□ Economic data: [Input costs + yield revenue]\n\nSTATISTICAL ANALYSIS\nTool: [R / SAS / JMP]\nTests: [ANOVA / LSD / Tukey's HSD]\nSignificance level: p < 0.05\nEffect size: [Practical vs. statistical significance — >[X] bu/acre or >[X]% improvement target]\n\nRESULT REPORTING\n□ Trial report per location\n□ Combined analysis across locations\n□ Farmer testimonials / case studies\n□ Peer-reviewed publication (if applicable)` },
    { name: "Business Model & Investor Thesis", type: "document", folder: "Business & GTM", content: `BUSINESS MODEL & INVESTOR THESIS — [COMPANY NAME]\n\nBUSINESS MODEL\n□ SaaS — per acre / per user subscription\n□ Hardware + data subscription\n□ Data licensing to input companies / insurers\n□ Outcome-based (% of input savings or yield gain)\n□ Marketplace / distribution platform\n\nUNIT ECONOMICS\nAvg contract: [X acres × $[Y]/acre = $[Z] ACV]\nGross margin: [Hardware: [X]% / Software: [Y]%]\nNet revenue retention: [%] — farmers expand acreage over time\nCAC: $[X] (channel-dependent)\nPayback period: [X seasons]\nLTV: $[X] (at [X year avg. tenure]\n\nADDRESSABLE MARKET\nUS cropland: ~900M acres — [X]% addressable now = [Y]M acres\nAt $[Z]/acre → TAM = $[X]B\nGlobal extension: [Focus on [regions] in years [X–Y]]\n\nINVESTOR THESIS\n[Why is this company uniquely positioned to win?]\n1. [Proprietary dataset advantage — [years / acres / datapoints]]\n2. [Network effects — more farms → better models → more farms]\n3. [Defensibility — switching cost / data lock-in / relationship with agronomist network]\n4. [Team — [Founder backgrounds — agronomic / engineering / distribution expertise]]\n\nFUNDING ASK\nRound: [Seed / Series A]  |  Amount: $[X]M\nUse of proceeds:\n  [%] Product / Engineering ([FTE addition])\n  [%] Sales & Channel expansion ([States / markets])\n  [%] Trial network & agronomy team ([#] CCAs hired)\n  [%] Working capital / hardware inventory\nMilestones to close: [X acres contracted / [X] revenue / [X] validated trials]` },
  ],

  "Mobility & AutoTech": [
    { name: "Product Vision & Market Definition", type: "document", folder: "Business & GTM", content: `PRODUCT VISION & MARKET DEFINITION — [COMPANY NAME]\nCategory: □ EV / Powertrain  □ Autonomous Vehicle (AV)  □ Fleet Management  □ Mobility-as-a-Service (MaaS)  □ Telematics & Insurance Telematics  □ EV Charging Infrastructure  □ Vehicle Software / OTA  □ Logistics & Last Mile  □ Automotive AI / ADAS\nSegment: □ Passenger vehicle  □ Commercial fleet  □ Last-mile delivery  □ Public transit  □ Micromobility  □ Aviation / Urban Air Mobility (UAM)\n\nVISION\n[What does mobility look like in [X] years, and where does your company fit?]\n\nPROBLEM\n[What specific mobility problem are you solving? For who? What's the economic or social cost?]\n\nSOLUTION\n[Your product/service in 2–3 sentences]\n\nMARKET SIZE\nTAM: $[X]B — [How calculated: [global EV market / fleet telematics / etc.]]\nSAM: $[X]B — [Accessible segment]\nSOM: $[X]M — [Realistic capture in Year 3]\n\nCOMPETITIVE LANDSCAPE\n[Competitor 1]: [What they do] vs. us: [Your differentiation]\n[Competitor 2]: [What they do] vs. us: [Your differentiation]\n[OEM / Tier 1]: [Strategic threat or potential partner?]\n\nWHY NOW\n[Market timing rationale: EV adoption curve / Autonomy regulation maturing / Fleet electrification mandates / AI capability jump / Chip/sensor cost decline]` },
    { name: "Vehicle Systems Architecture", type: "document", folder: "Vehicle & Systems", content: `VEHICLE SYSTEMS ARCHITECTURE — [VEHICLE/SYSTEM NAME]\n\nVEHICLE TYPE\n□ Battery Electric Vehicle (BEV)  □ Hybrid (HEV / PHEV)  □ Fuel Cell (FCEV)\nClass: [Passenger car / Light truck / Commercial van / Semi / 2-wheeler / Autonomous shuttle / Air vehicle]\n\nELECTRIC POWERTRAIN (if EV)\nBattery pack:\n  Chemistry: [NMC / LFP / NCA / Solid-state]\n  Capacity: [X kWh]  |  Range (estimated): [X miles / km]\n  Pack voltage: [X V nominal]\n  BMS: [Battery Management System — supplier or in-house]\nMotor/drive unit:\n  Type: [Permanent magnet / AC induction]\n  Peak power: [X kW]  |  Torque: [X Nm]\n  Motor supplier: [In-house / Bosch / Nidec / BorgWarner]\nThermal management:\n  Battery cooling: [Active liquid / Passive / Refrigerant direct]\n  Operating temp range: [-[X]°C to [X]°C]\n\nADAS / AUTONOMY SENSOR STACK (if applicable)\nCamera: [# cameras / supplier — Mobileye / Luminar / in-house]\nLiDAR: [# units / supplier — Luminar / Ouster / Hesai / in-house]\nRadar: [# units / supplier — Bosch / Continental / in-house]\nHigh-def mapping: [HERE / TomTom / in-house]\nFusion / perception: [NVIDIA DRIVE / Qualcomm / custom SoC]\nFunctional safety: [ISO 26262 ASIL-[B/C/D] target]\n\nCONNECTIVITY & SOFTWARE\nTelematics: [4G LTE / 5G V2X]  |  OTA: [Delta OTA for SW + FW]\nV2X (Vehicle-to-Everything): [C-V2X / DSRC]\nVehicle SOA (Service-Oriented Architecture): [AUTOSAR Classic / Adaptive]\nCybersecurity: [ISO/SAE 21434 compliance roadmap]` },
    { name: "Regulatory & Safety Plan", type: "document", folder: "Regulatory & Safety", content: `REGULATORY & SAFETY PLAN — [COMPANY NAME]\n\nFEDERAL MOTOR VEHICLE SAFETY STANDARDS (FMVSS)\n□ FMVSS 111 (Rear visibility cameras)\n□ FMVSS 126 (Electronic stability control)\n□ FMVSS 135 (Brake systems)\n□ [Relevant standards for your vehicle type]\n\nAV-SPECIFIC REGULATION\nFederal: [NHTSA AV guidance — voluntary safety self-assessment / AV STEP program]\nState-by-state AV testing permits:\n  □ California DMV AV testing permit\n  □ [Other states with AV testing programs]\nAutonomous Vehicle Safety Self-Assessment: [NHTSA voluntary reporting — [Filed / Planned]]\nFMCSA (commercial vehicles): [Hours of Service / ELD compliance if applicable]\n\nFUNCTIONAL SAFETY (ISO 26262)\nVehicle type: [Category — passenger / commercial]\nASIL decomposition: [ASIL D for braking / steering / AV control]\nSafety lifecycle:\n  Concept phase: □ Complete  □ In progress\n  System development: □ Complete  □ In progress\n  Hardware/Software development: [Status]\n  Validation & verification: [Status]\nFunctional Safety Manager: [Name / TBD]\nIndependent safety assessor: [TÜV SÜD / TÜV Rheinland / Bureau Veritas]\n\nCYBERSECURITY (ISO/SAE 21434)\n□ Threat analysis and risk assessment (TARA) completed\n□ Cybersecurity management system documented\n□ OTA update security validated\n□ Key management for vehicle identity\n\nNHTSA SELF-CERTIFICATION\nManufacturer identifier registered: [Yes / No]\nFMVSS compliance declaration filed for: [Model / Model year]\nRecall readiness: [Early warning reporting (EWR) process documented]` },
    { name: "Fleet Electrification Business Case", type: "document", folder: "Infrastructure & Fleet", content: `FLEET ELECTRIFICATION BUSINESS CASE — [FLEET OWNER/CLIENT NAME]\nFleet size: [#] vehicles  |  Types: [Vans / Trucks / Sedans / Class [X]]\nAnnual mileage per vehicle: [X miles]  |  Total fleet mileage: [X miles/year]\nCurrent fuel: [Diesel / Gasoline]  |  Fuel cost: $[X]/gallon avg\n\nCURRENT STATE COSTS (Annual)\nFuel: $[X] — [X gal/vehicle/year × $[X]/gal × [#] vehicles]\nMaintenance (ICE): $[X]/vehicle/year × [#] = $[X]\nDriver wages (if relevant): $[X]\nTotal TCO (current): $[X]/vehicle/year\n\nELECTRIC VEHICLE ALTERNATIVE\nEV model selected: [Make / Model / Range / Payload]\nEV purchase cost: $[X]/vehicle  |  Net after federal tax credit (Section 30D/45W): $[X]\nAlternative: [Lease: $[X]/month per vehicle]\nCharging infrastructure:\n  Level 2 (AC): $[X]/charger installed (per vehicle or shared)\n  DCFC (DC Fast): $[X]/charger (if applicable)\n  Utility upgrade: $[X] (if required)\n\nEV OPERATING COSTS (Annual)\nElectricity: [X kWh/mile × X miles × $[X]/kWh × [#] vehicles = $[X]]\nMaintenance (EV — est. 30–40% less than ICE): $[X]/vehicle × [#] = $[X]\nTotal EV TCO: $[X]/vehicle/year\n\nROI ANALYSIS\nAnnual savings: $[X] (fuel + maintenance delta)\nCapex: $[X] (vehicles + charging)\nPayback period: [X years]\nNPV (10-year, [X]% discount): $[X]\n\nRISKS & MITIGATIONS\nRange anxiety: [Route analysis shows [X]% routes under [X] miles — covered]\nCharging uptime: [Redundant charger ratio [X:1]]\nGrid capacity: [Utility pre-assessment complete / smart charging scheduled]` },
    { name: "OTA Software & Cybersecurity Architecture", type: "document", folder: "Software & Autonomy", content: `OTA SOFTWARE & CYBERSECURITY ARCHITECTURE — [COMPANY NAME]\n\nOTA UPDATE SYSTEM\nScope: [ECU firmware / ADAS software / Infotainment / Maps / Vehicle configuration]\nOTA platform: [Aurora / Harman / Excelfore / NVIDIA DRIVE OTA / Custom]\nUpdate types:\n  Delta OTA: [Diff-based — minimizes data transfer]\n  Full OTA: [Complete image replacement — rare, for major releases]\nDeployment strategy:\n  □ Staged rollout: [1% → 10% → 100% with telemetry gates]\n  □ Rollback capability: [Prior image stored — auto-rollback on validation failure]\n  □ Customer notification: [In-vehicle + app notification before update]\nScheduling: [User-consent update windows / Non-safety-critical auto-update at [time]]\n\nVEHICLE CYBERSECURITY ARCHITECTURE\nFramework: ISO/SAE 21434  |  TARA: [Completed / In progress]\nBoundary protection:\n  □ Automotive-grade firewall between OBD-II and CAN network\n  □ Secure gateway (SGW) module — filters all external communication to CAN bus\n  □ Intrusion detection system (IDS): [Argus / GuardKnox / Upstream / In-house]\n\nIdentity & Authentication:\n  □ Vehicle identity certificate — Hardware Security Module (HSM) based\n  □ PKI: [Root CA → Intermediate → Vehicle certificate]\n  □ Code signing for all OTA updates — SHA-256 signature verified before flash\n\nTelemetry Security:\n  □ TLS 1.3 for all vehicle-to-cloud communication\n  □ V2X security (if applicable): [IEEE 1609.2 / ETSI ITS-Security]\n\nINDIDENT RESPONSE\n□ Vehicle-level: [Safe state triggered on anomaly detection]\n□ Fleet-level: [OTA emergency patch capability <[X hours] from discovery]\n□ Disclosure: [NHTSA reporting if safety-relevant / Coordinated disclosure process]` },
    { name: "GTM & Fleet Customer Acquisition", type: "document", folder: "Business & GTM", content: `GTM & FLEET CUSTOMER ACQUISITION — [COMPANY NAME]\n\nTARGET CUSTOMERS\nSegment 1: [Last-mile delivery fleets — Amazon DSP / FedEx / DHL / Regional courier]\n  Size: [X–X vehicles]  |  Pain: [Fuel cost / Route efficiency / Compliance]\nSegment 2: [Corporate / campus shuttle fleet operators]\n  Size: [X–X vehicles]  |  Pain: [ESG reporting / Electrification planning]\nSegment 3: [Municipal / government fleets — city transit / utility fleets]\n  Size: [X–X vehicles]  |  Pain: [EV mandate / Maintenance cost / Sustainability goals]\n\nSALES CYCLE\nPilot: [X–X vehicles for [X months] — performance validation]\nExpansion: [Fleet-wide rollout — [X months] after pilot success]\nEnterprise contract: [$[X]K–$[X]K ACV / Multi-year preferred]\n\nEVALUATION CRITERIA FOR FLEET OPERATORS\n1. [Uptime / reliability — [X]% SLA required]\n2. [Integration with existing FMS / telematics]\n3. [ROI payback < [X years]]\n4. [Maintenance support / service network]\n5. [OEM warranty compatibility]\n\nCHANNEL STRATEGY\n□ Direct enterprise sales (AE + fleet consultant)\n□ OEM / dealer channel (vehicle sale bundled with SW/service)\n□ Fleet management partner (Geotab / Samsara / Verizon Connect marketplace)\n□ EV charger / infrastructure partner (ChargePoint / EVgo / Electrify America)\n\nINFRASTRUCTURE PARTNERSHIPS\nCharging: [ChargePoint / Blink / Shell Recharge / In-house]\nGrid services: [Demand response revenue share with fleet operator]\nInsurance: [Usage-based insurance partner — Nuvocargo / Clearfly / Carpe Data]\n\nKEY PROOF POINTS NEEDED\n□ [X] pilot fleets completed\n□ [X]% uptime achieved in pilot\n□ $[X]/vehicle/year savings demonstrated\n□ [Safety miles / MTBF data]` },
    { name: "Fundraising Materials Framework", type: "document", folder: "Business & GTM", content: `FUNDRAISING MATERIALS FRAMEWORK — [COMPANY NAME]\nRound: [Seed / Series A / Series B]  |  Amount: $[X]M\n\nELEVATOR PITCH\n[1–2 sentence description of what you do, for whom, and why you win]\n\nINVESTMENT THESIS\n[Why is this company going to be very large? What is the insight that competitors are missing?]\n\nTEAM\n[Founder 1]: [Background — [X years at OEM / AV company / fleet operator]]\n[Founder 2]: [Background]\n[Key hire]: [Background]\nAdvisors: [Name — [Affiliation]]\n\nTRACTION\nPilots: [#] pilots with [#] vehicles / [#] fleet operators\nRevenue: $[X] ARR or contracted pipeline\nLOIs: $[X] of letters of intent\nKey customers: [Name if shareable / description if confidential]\n\nMARKET OPPORTUNITY\n[Market size — why this is a multi-billion dollar opportunity]\n[TAM / SAM / SOM with methodology]\n\nBUSINESS MODEL\n[Revenue model — per vehicle / SaaS / hardware / service contract]\nUnit economics: ACV $[X]K / Gross margin [%] / Payback [X months]\n\nCOMPETITIVE MOAT\n[Data / Network effects / Proprietary tech / Team / Regulatory / Customer lock-in]\n\nUSE OF FUNDS\n[X]% — Engineering ([# additional engineers]\n[X]% — Sales & BD ([# pilot expansions]\n[X]% — Manufacturing / supply chain\n[X]% — Operations & G&A\nMilestones unlocked: [Series A triggers — [X]M ARR / [X] customers / [X] milestone]` },
  ],

  "Creator Economy": [
    { name: "Creator Brand & Content Strategy", type: "document", folder: "Content Strategy", content: `CREATOR BRAND & CONTENT STRATEGY — [CREATOR/BRAND NAME]\nPrimary platform: □ YouTube  □ TikTok  □ Instagram  □ Twitch  □ Podcast  □ Substack  □ LinkedIn  □ X (Twitter)  □ OnlyFans  □ Other\nContent category: [Niche — e.g., personal finance / fitness / design / tech / comedy / cooking]\n\nCREATOR IDENTITY\nPersona: [Who are you on camera/in content? Not necessarily who you are IRL.]\nVoice: [Direct / Storytelling / Educational / Entertaining / Vulnerable / Expert]\nValues you stand for: [3 core values — e.g., transparency, rigor, accessibility]\nAudience promise: [What does the audience get by following you that they can't get elsewhere?]\n\nCONTENT PILLARS\nPillar 1 — [Primary topic]: [X% of content — Description]\nPillar 2 — [Secondary topic]: [X% of content — Description]\nPillar 3 — [Behind-the-scenes / Personal]: [X% of content — Description]\n\nCONTENT CADENCE\nPlatform 1: [X posts/week / videos/month]\nPlatform 2: [X posts/week]\nShort-form: [Daily / X per week]\nLong-form: [X per month]\nNewsletter: [Weekly / Biweekly]\n\nSEED AUDIENCE STRATEGY\nCurrent audience size: [#] on [platform]\nTarget: [#] in [X months]\nGrowth tactics: [Collab with [type of creators] / Short-form content flywheel / SEO / Posting in communities]\n\nCOMPETITIVE POSITIONING\nCreators in your space: [Name 1], [Name 2], [Name 3]\nWhite space: [What they don't cover / your specific angle / format differentiation]` },
    { name: "Monetization Architecture", type: "document", folder: "Monetization", content: `MONETIZATION ARCHITECTURE — [CREATOR/BUSINESS NAME]\n\nREVENUE STREAMS\nStream 1 — Platform Ad Revenue:\n  Platform: [YouTube / TikTok Creator Fund / Facebook / Podcast ads]\n  Current monthly: $[X]  |  CPM: $[X]  |  Monthly views/downloads: [#]\n  Target: $[X]/month at [#] views\n\nStream 2 — Sponsorships / Brand Deals:\n  Current rate: $[X] per integration  |  # deals/month: [#]\n  Target rate: $[X] at [# followers / # views avg]\n  Minimum engagement rate for pitching: [X]%\n  Ideal brands: [Category / specific names]\n  Agency / representation: [Self-managed / [Agency name]]\n\nStream 3 — Subscriptions / Memberships:\n  Platform: [Patreon / Memberful / Substack / Circle]\n  Tiers: Free / [Tier 1: $[X]/month — benefits] / [Tier 2: $[X]/month — benefits]\n  Current: [#] paying members × avg $[X] = $[X] MRR\n  Target: [#] members × $[X] = $[X] MRR\n\nStream 4 — Digital Products:\n  Products: [Course / Presets / Templates / Ebook / Swipe file]\n  Pricing: $[X]–$[X]\n  Launch frequency: [X per year]\n  Platform: [Gumroad / Teachable / Kajabi / Own store]\n\nStream 5 — Services / Consulting:\n  Offering: [1:1 coaching / Done-for-you / Consulting]\n  Rate: $[X]/hour or $[X]/project\n  Availability: [X slots/month]\n\nStream 6 — Affiliate:\n  Programs: [Program 1: [X]% commission / Program 2: [X]%]\n  Monthly affiliate revenue: $[X]\n\nTOTAL MRR: $[X]  |  MRR target [12 months]: $[X]` },
    { name: "Audience & Community Growth Plan", type: "document", folder: "Audience & Community", content: `AUDIENCE & COMMUNITY GROWTH PLAN — [CREATOR/BRAND NAME]\n\nCURRENT AUDIENCE SNAPSHOT\nPlatform 1: [#] followers / subscribers\nPlatform 2: [#] followers\nEmail list: [#] subscribers  |  Open rate: [%]\nMonthly unique reach (total): [#]\n\nGROWTH TARGETS\n[3 months]: [Platform 1: X / Email: Y]\n[12 months]: [Platform 1: X / Email: Y]\nMonthly growth rate target: [X]%\n\nGROWTH TACTICS\nShort-form content engine:\n  Volume: [X Reels / TikToks / Shorts per week]\n  Hook formula: [Your proven hook style]\n  CTA in every short-form: [Follow / Link in bio / Join newsletter]\n  Repurposing: [Long-form → [X] short-form pieces per long video/episode]\n\nCollaboration strategy:\n  Target collab creators: [Name type — similar size / complementary niche]\n  Collab formats: [Podcast swap / Joint video / Newsletter mention / IG Live]\n  Cadence: [X collabs/month]\n\nEmail list building:\n  Lead magnet: [What you give away — free guide / template / mini-course]\n  Opt-in placement: [Bio link / Video CTA / End card / Pinned comment]\nList growth rate target: [+X subscribers/week]\n\nCOMMUNITY\nPlatform: [Discord / Circle / Facebook Group / Slack / Locals]\nPurpose: [Support / Accountability / Networking / Exclusivity]\nActive community size target: [#]\nEngagement mechanics: [Daily prompt / Weekly AMA / Monthly challenge]\n\nSEO / DISCOVERABILITY\nYouTube SEO: [Keyword research / Title formula / Thumbnail testing]\nPodcast SEO: [Show notes / Transcript / Guest SEO]\nBlog / newsletter SEO: [Pillar content strategy]` },
    { name: "Content Production Workflow", type: "document", folder: "Tools & Workflow", content: `CONTENT PRODUCTION WORKFLOW — [CREATOR NAME]\n\nPRODUCTION SETUP\nCamera: [Make / Model / Settings]\nMicrophone: [Make / Model]\nLighting: [Setup description]\nEditing software: [Premiere / Final Cut / DaVinci Resolve / CapCut]\nGraphics / thumbnails: [Canva / Photoshop / Figma]\nSupporting tools: [TubeBuddy / VidIQ / Notion / Airtable / Opus Clip]\n\nIDEATION\nIdea capture: [Notion / Notes app / Voice memos — daily]\nIdea validation: [Search volume / Comment mining / DM questions from audience]\nContent calendar: [Planned [X] weeks in advance]\n\nPER-VIDEO / PER-EPISODE WORKFLOW\nStep 1: Research — [X hours]\nStep 2: Script / outline — [X hours]\nStep 3: Record — [X hours]\nStep 4: Edit (primary) — [X hours]\nStep 5: Color / audio mastering — [X hours]\nStep 6: Thumbnail creation — [X hours]\nStep 7: Title / description / tags / chapters — [X hours]\nStep 8: Schedule + repurpose clips — [X hours]\nTotal time per piece: [X hours]\n\nTEAM (if any)\nVideo editor: [In-house / Freelancer — [Platform]]\nThumbnail designer: [In-house / Freelancer]\nSocial media clipper: [Freelancer / Opus Clip auto]\nNewsletter writer: [In-house / Ghost writer]\n\nBATCH PRODUCTION SCHEDULE\nRecord [X] videos on [Day]\nEdit [X] videos on [Day]\nPublish [Day] at [Time] — based on audience analytics\n\nQUALITY STANDARD\nMinimum: [Retention >60% in first 30 seconds / Avg view duration >[X] minutes]\nThumbnail CTR target: >[X]% on YouTube` },
    { name: "Brand Partnership & Sponsorship Kit", type: "document", folder: "Brand & Partnerships", content: `BRAND PARTNERSHIP & SPONSORSHIP KIT — [CREATOR NAME]\n\nCREATOR SNAPSHOT\nPrimary platform: [Platform] — [#] [followers/subscribers]\nMonthly reach: [#] people\nContent niche: [Your niche]\nAudience: [Age range / Gender split / Primary location / Profession if relevant]\nEngagement rate: [%] (avg across posts/videos)\n\nAUDIENCE DEMOGRAPHICS\nAge: [X]% 18–24 / [X]% 25–34 / [X]% 35–44 / [X]% 45+\nGender: [X]% [gender 1] / [X]% [gender 2]\nTop locations: [Country 1 / Country 2 / Country 3]\nIncome: [Estimated or platform insight]\nInterests (besides my content): [List 3–5]\n\nINTEGRATION OPTIONS & RATES\n1. Dedicated video / episode: $[X] — [Full video on sponsor / 10–15 min endorsement]\n2. Integrated mention: $[X] — [60–90 second mid-roll integration]\n3. Pre-roll / outro: $[X] — [30 second]\n4. Newsletter sponsor: $[X]/issue — [[#] subscribers, [X]% open rate]\n5. Social post (dedicated): $[X] — [Platform]\n6. Affiliate only (no upfront): [X]% commission on tracked sales\n\nPAST PARTNERS\n[Brand 1] — [Integration type] — [Results if shareable]\n[Brand 2] — [Integration type] — [Results]\n[Brand 3] — [Integration type]\n\nIDEAL BRAND CATEGORIES\n[Category 1 — e.g., B2B SaaS tools / productivity apps]\n[Category 2 — e.g., Finance / investing apps]\n[Category 3 — e.g., Fitness / health supplements]\nNOT interested in: [Categories you decline]\n\nSPONSORSHIP TERMS\nLead time: [Minimum [X] weeks]\nContent rights: [Creator retains / Sponsor may reuse with credit for [X months]]\nApproval process: [Script submitted [X days] before record date]\nDisclosure: [FTC-compliant — always labeled as sponsored]\nContact: [email / link to apply]` },
    { name: "Creator Business Finance Model", type: "document", folder: "Monetization", content: `CREATOR BUSINESS FINANCE MODEL — [CREATOR/BUSINESS NAME]\n\nMONTHLY REVENUE SNAPSHOT\nPlatform ad revenue:     $[X]\nSponsorships:            $[X]\nSubscription/membership: $[X]\nDigital products:        $[X]\nAffiliate:               $[X]\nServices/coaching:       $[X]\nOther:                   $[X]\nTOTAL MRR:              $[X]\n\nMONTHLY EXPENSES\nProduction (gear, software): $[X]\nTeam (editors, VAs):         $[X]\nAds / paid distribution:     $[X]\nTools & subscriptions:       $[X]\nLegal & accounting:          $[X]\nOther:                       $[X]\nTOTAL EXPENSES:             $[X]\n\nNET INCOME: $[X]  |  Profit margin: [%]\n\n12-MONTH PROJECTIONS\nMonth 1: Revenue $[X] / Expenses $[X] / Net $[X]\nMonth 3: Revenue $[X] / Expenses $[X] / Net $[X]\nMonth 6: Revenue $[X] / Expenses $[X] / Net $[X]\nMonth 12: Revenue $[X] / Expenses $[X] / Net $[X]\n\nBUSINESS STRUCTURE\nEntity type: [Sole prop / LLC / S-Corp]\nState of formation: [State]\nAccountant/CPA: [Name or TBD]\nTax strategy: [Quarterly estimates / S-Corp salary + distributions (if applicable)]\n\nFINANCIAL GOALS\nTarget MRR [6 months]: $[X]\nTarget MRR [12 months]: $[X]\nBiggest revenue unlock: [e.g., Course launch / Podcast launch / Corporate sponsorship]\nEmergency fund: [X months of expenses saved = $[X]]` },
    { name: "IP, Legal & Business Formation", type: "document", folder: "Brand & Partnerships", content: `IP, LEGAL & BUSINESS FORMATION — [CREATOR NAME]\n\nBUSINESS FORMATION\nEntity: [LLC / S-Corp / C-Corp]\nState: [DE for C-Corp / Home state for LLC]\nFormation date: [Date]  |  EIN: [Obtained]\nOperating agreement: [Drafted / Signed]\n\nINTELLECTUAL PROPERTY\nTrademark:\n  Brand name: [[BRAND NAME] — filed / registered]\n  Logo: [[LOGO — filed / registered]\n  Classes: [Class 41 (entertainment) / Class 9 (digital products) / Class 25 (merchandise)]\n  Registration #: [#] | USPTO  |  International: [Countries]\n  Attorney: [Firm name or self-filed]\n\nContent copyright:\n  All original content © [Year] [Creator Name / Company Name]\n  Copyright registration: [Applied for key works / Not yet]\n  DMCA agent registered: [Yes — required if hosting UGC / No]\n\nLICENSING\nContent licensing to brands: [Terms — usage rights / duration / territory]\nTemplate / product licensing: [What buyers can do with your products]\nAffiliate agreement: [Standard terms provided by program]\n\nCONTRACTS NEEDED\n□ Sponsorship agreement template — [Drafted / Need]\n□ Collab/co-creator agreement — [Drafted / Need]\n□ Team contractor agreements (1099) — [Drafted / Need]\n□ Community membership terms — [Drafted / Need]\n□ Digital product terms of use — [Drafted / Need]\n\nPRIVACY & COMPLIANCE\n□ Privacy policy on website (required for email list + Google ads)\n□ Cookie consent (if EU audience)\n□ FTC disclosure compliance (sponsorship labeling)\n□ COPPA (if audience includes under-13s)` },
  ],

  "PropTech": [
    { name: "Product Vision & Market Focus", type: "document", folder: "Product & Platform", content: `PRODUCT VISION & MARKET FOCUS — [PRODUCT NAME]\nCategory: □ Real estate search / marketplace  □ Transaction management  □ Property management SaaS  □ Smart building / IoT  □ Construction tech  □ Real estate data & analytics  □ Fractional ownership / tokenization  □ iBuyer / instant offer  □ CRE (Commercial) platform\nSegment: □ Residential  □ Commercial (office / retail / industrial / multifamily)  □ Proptech data/API\n\nPROBLEM\n[What real estate workflow, cost, or information gap do you solve?]\nQuantification: [Time wasted / Cost of friction / Decision error rate / Risk exposure]\n\nSOLUTION\n[Your product in 2–3 sentences]\n\nTARGET USER\nPrimary: [Homebuyer / Property manager / Landlord / Agent / Broker / CRE investor / Developer / Tenant]\nSecondary: [Lender / Title company / HOA / Municipality]\n\nCOMPETITIVE LANDSCAPE\n[Zillow / CoStar / Yardi / AppFolio / Buildout — as applicable]\n[Competitor 1]: [Their strength] vs. ours: [Your differentiation]\n[Competitor 2]: [Their strength] vs. ours: [Your differentiation]\n\nWHY NOW\n[Market timing: Interest rate environment / Proptech VC investment cycle / Remote work reshaping demand / AI capability / Data availability / Regulation change]\n\nBUSINESS MODEL\n□ SaaS subscription (per unit / per seat / per property)\n□ Transaction fee (% of deal value)\n□ Data licensing / API access\n□ Marketplace (leads / buyer-seller matching)\n□ Managed services + software` },
    { name: "Data & Analytics Architecture", type: "document", folder: "Data & Analytics", content: `DATA & ANALYTICS ARCHITECTURE — [PLATFORM NAME]\n\nDATA SOURCES\nPublic:\n  □ MLS / IDX data feeds (RETS / RESO Web API) — [Data provider: CoreLogic / Black Knight / ATTOM]\n  □ County recorder / assessor records — [Tax assessment / sale history / deed]\n  □ Census / American Community Survey — [Demographics / Walkability]\n  □ Zoning data: [City/county GIS portals]\n  □ Permit data: [Building permits via city portals / BuildZoom]\n  □ School ratings: [GreatSchools API]\n  □ Crime data: [Crime API / local PD data]\nCommercial:\n  □ CoStar data (CRE): [Comps / vacancy / rents]\n  □ ATTOM / CoreLogic: [AVMs / property data]\n  □ Walk Score / Transit Score: [Walkability API]\n  □ Moody's / CoStar Economy: [Market forecasts]\nPropriety:\n  □ User-generated: [Agent notes / Tenant reviews / Listing updates]\n  □ IoT sensor data (smart building): [Occupancy / energy / HVAC]\n\nDATA PIPELINE\nIngestion: [SFTP / API pull / Webhook] → [Kafka / SQS] → [ETL — dbt / Spark] → [Data warehouse: Snowflake / Redshift / BigQuery]\nGeospatial: [PostGIS / Google Maps geocoding / HERE]\nSearch: [Elasticsearch with geosearch (geo_distance, geo_bounding_box)]\nAVM (Automated Valuation Model): [In-house ML / CoreLogic AVM / Quantarium]\n\nKEY ANALYTICS FEATURES\n□ AVM — estimated property value with confidence interval\n□ Rent comparables (rent comps)\n□ Market trend analysis (price per sqft, DOM, list-to-sale ratio)\n□ Investment analysis (cap rate, cash-on-cash, IRR)\n□ Neighborhood scoring (walkability, school, crime, transit)` },
    { name: "Regulatory & Compliance Framework", type: "document", folder: "Regulatory & Legal", content: `REGULATORY & COMPLIANCE FRAMEWORK — [COMPANY NAME]\n\nFEDERAL REGULATIONS\nFair Housing Act (FHA):\n  □ No discriminatory advertising (protected classes: race, color, national origin, religion, sex, familial status, disability)\n  □ AI/algorithm audit: [Automated decision tools audited for disparate impact]\n  □ Accessibility: [Physical — ADA / Digital — WCAG 2.1 AA]\n\nReal Estate Settlement Procedures Act (RESPA):\n  □ Kickback / referral fee compliance (Section 8)\n  □ Marketing services agreements (MSA): [Reviewed by outside counsel]\n  □ Affiliated business disclosure (AfBA): [Required if owning title/mortgage subsidiary]\n\nTruth in Lending Act (TILA) / Regulation Z:\n  [If offering mortgage or lending product — disclosure requirements]\n\nFinancial crimes:\n  □ FinCEN Geographic Targeting Orders (GTO): [If high-value cash transactions in covered cities]\n  □ BSA/AML: [If offering financial services adjacent to RE transactions]\n\nSTATE & LOCAL\n□ Real estate license requirements: [Required if facilitating licensed activities — check each state]\n□ Tenant protection laws: [Just cause eviction / Rent control — [Key states: CA / NY / OR]]\n□ Short-term rental (STR) regulation: [Platform compliance with local STR permit requirements]\n□ Condo conversion rules: [If converting rental to condo units]\n□ Environmental disclosure: [Lead paint / Flood zone / Mold / Radon — by state]\n\nDATA & PRIVACY\n□ FCRA: [If running tenant screening / background checks]\n□ CCPA / state privacy laws: [Consumer data rights for platform users]\n□ MLS rules: [IDX display rules / listing display agreement compliance]` },
    { name: "GTM & Real Estate Channel Strategy", type: "document", folder: "Sales & GTM", content: `GTM & REAL ESTATE CHANNEL STRATEGY — [COMPANY NAME]\n\nCHANNEL OPTIONS\n□ Direct to agent/broker — individual subscription or per-deal fee\n□ Brokerage enterprise license — firm-wide contract (ACV: $[X]K–$[X]M)\n□ Property manager / landlord direct — subscription per unit under management\n□ Institutional investor / REIT — data or platform license\n□ Developer / builder — project management + marketing tool\n□ Lender / title — workflow integration\n\nPARTNERSHIP CHANNELS\nMLS / Association integration:\n  [RESO / CRMLS / MRIS / etc.] — [Data partner / Distribution partner]\nFranchise:\n  [RE/MAX / Keller Williams / Coldwell Banker / Compass] — Enterprise deal\nPortal integration:\n  [Zillow Premier Agent / Realtor.com / Redfin partner program]\nLending partners:\n  [Rocket Mortgage / United Wholesale / Local lender referral program]\n\nSALES MOTION\nSMB (individual agent/PM): [Self-serve / Freemium → upgrade / Inside sales]\nMid-market (team/boutique brokerage): [Inside sales + demo]\nEnterprise (franchise / large PM company): [Field sales / Named accounts]\n\nKEY METRICS\nCAC: $[X]  |  LTV: $[X]  |  NRR: [%]\nGross margin: [%]\nSales cycle: [X days SMB / X months enterprise]\nTrials-to-paid conversion: [%]\n\nINDUSTRY TOUCHPOINTS\nConferences: [NAR Annual / Inman Connect / T3 Sixty / CRE Tech Connect]\nPublications: [Inman / The Real Deal / RealTrends / GlobeSt]\nAssociations: [NAR / CAR / Local REALTOR® boards / IREM / BOMA (CRE)]` },
    { name: "Smart Building & IoT Integration Spec", type: "document", folder: "Engineering", content: `SMART BUILDING & IoT INTEGRATION SPEC — [PRODUCT NAME]\n[Complete only if your product includes IoT/smart building components]\n\nSYSTEM OVERVIEW\n[What building systems does your product connect to and what outcomes does it deliver?]\n\nBUILDING SYSTEMS INTEGRATION\n□ BMS / BAS (Building Management System): [Niagara / Johnson Controls Metasys / Siemens Desigo]\n□ HVAC: [Thermostat control / Demand control ventilation / VRF systems]\n□ Lighting: [DALI / DALI-2 / BACnet-connected fixtures]\n□ Access control / Security: [Lenel / Software House / OpenPath / Brivo]\n□ Elevators: [Status / predictive maintenance API]\n□ Parking: [Occupancy sensors / Access gate integration]\n□ Metering: [Electric / Gas / Water / Submetering]\n\nCOMMUNICATION PROTOCOLS\n□ BACnet/IP or BACnet MS/TP (HVAC/BMS)\n□ Modbus TCP/RTU (industrial / energy metering)\n□ LonWorks (legacy BMS)\n□ Zigbee / Z-Wave (IoT sensors)\n□ LoRaWAN (low-power sensors, long range)\n□ MQTT over TLS (IoT data to cloud)\n□ REST API (modern building platforms)\n\nDATA & ANALYTICS\nMetrics tracked per building:\n  □ Energy consumption (kWh / thermal BTU)\n  □ Occupancy (presence sensors / desk booking)\n  □ Indoor air quality (CO2 / temp / humidity / PM2.5)\n  □ Water usage\n  □ Equipment health / fault detection\n\nENERGY & SUSTAINABILITY\nBEMS (Building Energy Management):\n  □ Peak demand management\n  □ Demand response (utility program integration)\n  □ ENERGY STAR Portfolio Manager sync\n  □ LEED / BREEAM / GRESB reporting data` },
    { name: "Property Management Feature Set", type: "document", folder: "Product & Platform", content: `PROPERTY MANAGEMENT FEATURE SET — [PLATFORM NAME]\n[For property management SaaS products]\n\nCORE MODULES\n1. LISTING & MARKETING\n□ Vacancy listing creation + syndication to [Apartments.com / Zillow Rental / HotPads]\n□ Online application portal (customizable screening questions)\n□ AI-generated listing description\n□ Virtual tour integration: [Matterport / Zillow 3D / Video]\n\n2. TENANT SCREENING\n□ Credit check: [TransUnion / Experian / Equifax]\n□ Background check: [Criminal / Eviction history]\n□ Income verification: [Employment / Pay stub upload / Plaid bank verification]\n□ Fair Housing compliant: [Consistent criteria / No discriminatory questions]\n\n3. LEASE MANAGEMENT\n□ State-compliant lease templates\n□ E-signature: [DocuSign / RightSignature / Native]\n□ Lease renewal workflow (automated reminders)\n□ Addendum management\n\n4. RENT COLLECTION\n□ ACH / bank transfer\n□ Card payment (with fee pass-through option)\n□ Auto-pay enrollment\n□ Late fee automation (per state rules)\n□ Rent roll reporting\n\n5. MAINTENANCE\n□ Tenant-submitted work orders (with photo upload)\n□ Vendor marketplace / dispatch\n□ Work order status tracking + tenant communication\n□ Preventive maintenance scheduling\n\n6. ACCOUNTING\n□ Property-level P&L\n□ Owner statement generation (monthly)\n□ 1099 generation for owners + vendors\n□ QuickBooks / Xero sync\n\n7. OWNER PORTAL\n□ Real-time financial dashboard\n□ Maintenance visibility\n□ Document library (lease / inspection reports)` },
    { name: "Fundraising & Cap Table Summary", type: "document", folder: "Sales & GTM", content: `FUNDRAISING & CAP TABLE SUMMARY — [COMPANY NAME]\nDate: [Date]  |  Round: [Seed / Series A / Series B]\n\nCOMPANY OVERVIEW\nFounded: [Date]  |  HQ: [City, State]\nProduct: [One-sentence description]\nStage: [Pre-revenue / Seed-stage / Revenue generating — $[X] ARR]\n\nTRACTION\n[Metric 1]: [Value] ([Context — e.g., properties managed, transactions facilitated])\n[Metric 2]: [Value]\n[Key customer]: [Name or description]\n\nFUNDING ASK\nAmount raising: $[X]M\nInstrument: [SAFE / Convertible note / Priced equity round]\nValuation cap / Pre-money: $[X]M\nPro-rata rights: [Yes / Negotiable]\nClosing target: [Date]\n\nUSE OF FUNDS\n[X]% — Product / Engineering: [[#] hires, [feature milestones]]\n[X]% — Sales & Marketing: [[channels], [CAC targets]]\n[X]% — Data / infrastructure\n[X]% — G&A / runway\nRunway: [X months at $[X]/month burn]\n\nMILESTONES TO SERIES [X]\n□ $[X]M ARR\n□ [X] customers / [X] units under management\n□ [Geographic expansion — [Market]]\n□ [Product milestone — [Feature]]\n\nCURRENT INVESTORS\n[Investor 1 — [Type: Angel / VC / Strategic]] — $[X]\n[Investor 2] — $[X]\nTotal raised to date: $[X]\n\nLEAD INVESTOR CRITERIA\n[What you're looking for in a lead investor — check size, value-add, network]` },
  ],

  "RetailTech": [
    { name: "Product Vision & Retail Problem Analysis", type: "document", folder: "Product & Commerce", content: `PRODUCT VISION & RETAIL PROBLEM ANALYSIS — [PRODUCT NAME]\nCategory: □ POS / Checkout  □ Inventory Management  □ Loyalty & CRM  □ Omnichannel / OMS  □ Retail Analytics  □ Pricing / Markdown Optimization  □ Loss Prevention  □ Supplier / Vendor Management  □ Retail Media Network  □ In-store Tech\nTarget retailer: □ Grocery  □ Specialty retail  □ Apparel  □ Home goods  □ Convenience  □ Pharmacy  □ Restaurant / QSR  □ E-commerce pure play  □ Enterprise chain  □ Independent / SMB\n\nPROBLEM\n[What retail operational pain, lost revenue, or inefficiency do you solve?]\nQuantification: [$ lost to shrink / stockout / markdowns / labor inefficiency per store per year]\n\nSOLUTION\n[Your product in 2–3 sentences]\n\nRETAIL BUYER\nPrimary: [VP Retail Tech / CTO / SVP Operations / Head of Digital / Store Operations lead]\nSecondary: [Merchandising / Inventory planning / Marketing / Store managers]\nBuying trigger: [Legacy system EOL / Failed initiative / Competitive threat / ESG pressure / Labor costs]\n\nCOMPETITIVE LANDSCAPE\n[Oracle Retail / Manhattan Associates / Shopify / Toast / Square / Lightspeed — as applicable]\n[Competitor 1]: [Strength] vs. us: [Your differentiation]\n[Competitor 2]: [Strength] vs. us: [Differentiation]\n\nWHY NOW\n[Shift to unified commerce / AI in retail forecasting / Omnichannel imperative / Labor cost surge driving automation / Consumer expectation evolution]` },
    { name: "POS & Commerce Integration Architecture", type: "document", folder: "Engineering & POS", content: `POS & COMMERCE INTEGRATION ARCHITECTURE — [PRODUCT NAME]\n\nPOS SYSTEM\nDeployment: □ Cloud-based (SaaS)  □ Edge (runs in-store, syncs to cloud)  □ Hybrid\nHardware: □ iPad/tablet  □ Purpose-built terminal  □ Handheld  □ Self-checkout kiosk  □ BYOD\nOS: [iOS / Android / Windows / Linux embedded]\n\nPAYMENT PROCESSING\nProcessor: [Stripe Terminal / Adyen In-Person / Heartland / Square / Shift4]\nCard types: [Visa / Mastercard / Amex / Discover / Contactless (NFC) / Apple Pay / Google Pay]\nPIN debit: [Required for debit routing — Durbin compliance]\nPCI scope: □ P2PE — Hardware encryption reduces scope  □ SAQ D (full compliance)\nEBT/SNAP (if grocery): [Required — processor support]\nSplit tender: [Yes — multiple payment methods per transaction]\n\nOMNICHANNEL ORDER MANAGEMENT\nOrder types: [Ship-to-home / BOPIS (buy online, pick up in-store) / Curbside / Ship-from-store]\nOMS integrations: [NetSuite / Shopify / WooCommerce / Magento / BigCommerce]\nInventory sync: [Real-time across channels — polling interval [X seconds] or webhook-triggered]\n\nHARDWARE ECOSYSTEM\n□ Barcode scanner: [Zebra / Honeywell / Socket Mobile]\n□ Receipt printer: [Epson / Star Micronics — Bluetooth + USB]\n□ Cash drawer: [Standard RJ11 interface]\n□ Customer display / second screen\n□ Weight scale (grocery): [GS1 integration]\n□ Label printer (e-commerce fulfillment): [Zebra ZPL]\n\nINTEGRATIONS\nERP: [NetSuite / Microsoft D365 / SAP]\nAccounting: [QuickBooks Online / Xero]\nLoyalty: [In-house / Yotpo / LoyaltyLion / Antavo]\nKitchen display (restaurant): [KDS integration]` },
    { name: "Inventory & Supply Chain Intelligence", type: "document", folder: "Operations & Supply", content: `INVENTORY & SUPPLY CHAIN INTELLIGENCE — [PRODUCT NAME]\n\nINVENTORY MANAGEMENT FEATURES\n□ Real-time inventory tracking (by SKU / store / warehouse)\n□ Low-stock alerts and auto-reorder\n□ Multi-location inventory transfer management\n□ Receiving workflow (PO → receiving → QC → put-away)\n□ Cycle counting / physical inventory tools\n□ Landed cost calculation\n□ FIFO / LIFO / WAC costing methods\n□ Shrinkage tracking and reporting\n□ Serial number / lot tracking (for regulated goods)\n\nDEMAND FORECASTING & REPLENISHMENT\nForecasting inputs:\n  □ Historical sales (seasonality / trend decomposition)\n  □ Promotional calendar\n  □ Weather signals (for weather-sensitive categories)\n  □ Market events / competitor promotions\nModel: [ARIMA / Prophet / ML ensemble / External provider — Relex / Blue Yonder / o9]\nForecast horizon: [Weekly / Daily — [X weeks out]]\nReplenishment logic: [Min/max / Days-of-supply / Economic Order Quantity (EOQ)]\nTarget metrics:\n  In-stock rate: >[X]%  |  Overstock rate: <[X]% of inventory value\n  Fill rate: >[X]%  |  Inventory turns: [X]x per year\n\nSUPPLIER MANAGEMENT\n□ Supplier portal (order tracking / compliance docs)\n□ EDI integration: [EDI 850 / 855 / 856 / 810 — via SPS Commerce / TrueCommerce]\n□ Lead time tracking and adjustment\n□ Supplier scorecard: [On-time delivery / Fill rate / Defect rate]\n□ ASN (Advance Ship Notice) processing\n\nLOSS PREVENTION\nShrink sources: [Shoplifting / Employee theft / Vendor fraud / Administrative error]\nTools: [Exception-based reporting / POS anomaly detection / Video analytics integration]` },
    { name: "Loyalty & Customer Data Platform", type: "document", folder: "Data & Loyalty", content: `LOYALTY & CUSTOMER DATA PLATFORM — [PRODUCT NAME]\n\nLOYALTY PROGRAM DESIGN\nProgram type: □ Points-based  □ Tiered (Bronze/Silver/Gold)  □ Subscription (paid)  □ Cashback  □ Coalition  □ Punch card / Visit-based\nEarn: [X points per $1 spent / X% cashback / Visit stamp]\nRedeem: [$[X] off / Free item / Exclusive access] at [X] points\nExpiry: [Points expire after [X months] of inactivity]\n\nCustomer tiers:\n  Tier 1 [Bronze]: [Spending threshold / Benefits]\n  Tier 2 [Silver]: [Spending threshold / Benefits]\n  Tier 3 [Gold]: [Spending threshold / Benefits]\n\nENROLLMENT\nChannels: [POS at checkout / Web / Mobile app / Email sign-up]\nEnrollment incentive: [X points / $[X] off first purchase]\nData collected at enrollment: [Name / Email / Phone / Birthday (optional)]\n\nCUSTOMER DATA PLATFORM (CDP)\nData unified from: [POS / E-commerce / Mobile app / Email / Loyalty]\nCustomer 360 profile: [Purchase history / Channel preferences / Lifetime value / RFM segment / Churn risk]\nSegmentation: [RFM scoring / ML clustering / Manual rules]\n\nMARKETING AUTOMATION\nTriggered campaigns:\n  □ Birthday offer (7 days before)\n  □ Win-back (no purchase in [X days])\n  □ Post-purchase review request ([X days after purchase])\n  □ Points expiring ([X days notice])\n  □ Tier upgrade congratulation\nChannels: [Email / SMS / Push notification / In-store kiosk]\nEmail platform: [Klaviyo / Braze / Salesforce Marketing Cloud / Mailchimp]` },
    { name: "Retail Analytics & KPI Dashboard", type: "document", folder: "Data & Loyalty", content: `RETAIL ANALYTICS & KPI DASHBOARD — [COMPANY/PRODUCT NAME]\nReporting cadence: [Daily / Weekly / Monthly]  |  Audience: [Store managers / Merchants / Leadership]\n\nSTORE PERFORMANCE\nSales:\n  Total sales: $[X]  |  vs. prior period: [+/-X]%  |  vs. plan: [+/-X]%\n  Comp store sales (same-store): [+/-X]%\n  Sales per sqft: $[X]  |  Transactions: [#]  |  Avg basket size: $[X]\n  Items per transaction: [X]  |  Conversion rate (if tracking): [%]\n\nInventory:\n  In-stock rate: [%]  |  Target: >[X]%\n  Stockout events: [#]  |  Most frequent OOS SKUs: [List top 5]\n  Inventory turns: [X]x  |  Days of supply: [X days]\n  Shrink %: [%]  |  vs. prior period: [+/-X]%\n\nLABOR:\n  Labor % of sales: [%]  |  Target: [X]%\n  Labor hours: [#]  |  Sales per labor hour: $[X]\n  Schedule adherence: [%]\n\nCUSTOMER:\n  Loyalty enrollment rate: [%] of transactions\n  Loyalty member basket vs. non-member: [+X]% higher\n  NPS (if measured): [Score]\n  Customer retention rate: [%]\n\nMERCHANDISING:\n  Category performance (top categories this period): [List]\n  Top 10 items by sales: [List or linked report]\n  Markdown rate: [%] of sales  |  Clearance sell-through: [%]\n\nACTION ITEMS\n1. [Insight → Action → Owner → Due date]\n2. [Insight → Action]\n3. [Test to run next period]` },
    { name: "Retail GTM & Enterprise Sales Strategy", type: "document", folder: "Growth & Channels", content: `RETAIL GTM & ENTERPRISE SALES STRATEGY — [PRODUCT NAME]\n\nTARGET SEGMENTS\nSegment 1: [Specialty retail chain — [#]–[#] locations — [Products / category]]\n  Pain: [Pain point]\n  Deal size: $[X]K–$[X]K ACV\n  Sales cycle: [X months]\n\nSegment 2: [Grocery / Convenience — [#]+  locations]\n  Pain: [Pain point]\n  Deal size: $[X]K–$[X]M ACV\n  Sales cycle: [X months]\n\nSALES TEAM\nAE territories: [By region or account size]\nSE (Sales Engineer): [Required for technical demos / integration scoping]\nRetail industry consultants: [Domain experts who support enterprise deals]\nChannel: [Reseller — [POS reseller network / VAR]]\n\nRETAIL EVALUATION PROCESS\nPhase 1: Discovery + stakeholder mapping — [X weeks]\nPhase 2: Demo + proof-of-concept (pilot store) — [X weeks]\nPhase 3: Business case + ROI modeling — [X weeks]\nPhase 4: Procurement / legal / IT security review — [X weeks]\nPhase 5: Contract + onboarding planning — [X weeks]\nTotal: [X months]\n\nPILOT STRUCTURE\n# pilot stores: [X]  |  Duration: [X months]\nSuccess criteria: [Agreed upfront — [X]% in-stock improvement / [X]% reduction in markdowns / [X]% labor savings]\n\nTRADE EVENTS\n[NRF Big Show (January) / Groceryshop (September) / Shoptalk (March) / RILA LINK]\n\nCONTENT & THOUGHT LEADERSHIP\n□ Retail ROI calculator (interactive on website)\n□ Case studies by vertical (grocery / specialty / apparel)\n□ State of [Category] annual report\n□ NRF panel / speaker submission\n□ Partnership with [Gartner / Forrester / IDC Retail Analyst]` },
    { name: "Platform Engineering & Infrastructure", type: "document", folder: "Engineering & POS", content: `PLATFORM ENGINEERING & INFRASTRUCTURE — [PRODUCT NAME]\n\nSYSTEM ARCHITECTURE\nDeployment model: □ Multi-tenant SaaS  □ Single-tenant (large enterprise)  □ Edge + cloud hybrid\nCloud: [AWS / Azure / GCP]  |  Regions: [us-east-1 / eu-west-1 / etc. for data residency]\n\nCORE SERVICES\n1. [Commerce / POS engine] — [Transaction processing / receipt management / refunds]\n2. [Inventory service] — [Real-time stock ledger across locations]\n3. [Customer/loyalty service] — [CDP + loyalty program engine]\n4. [Analytics service] — [Real-time + batch reporting]\n5. [Integration service] — [Webhook dispatch / ERP sync / API gateway]\n\nEDGE / IN-STORE REQUIREMENTS\n□ Offline mode: [Transactions processed locally — synced to cloud on reconnect]\n□ Local data store: [SQLite / PouchDB / IndexedDB for browser POS]\n□ Heartbeat monitoring: [Per-device / Per-store connectivity status]\n□ Auto-update: [Silent OTA for POS software updates at EOD]\n□ Hardware integration: [USB/Bluetooth — printer, scanner, cash drawer, payment terminal]\n\nSCALE REQUIREMENTS\nPeak transactions/second: [Black Friday / holiday peak — [X] TPS per store × [X] stores]\nData volume: [X million transactions/year / [X] TB/year]\nLatency: [Transaction processing < [X]ms / Inventory sync < [X]s]\n\nSECURITY\nPCI DSS: [PCI DSS Level [1/2/3] compliant — SAQ type]\nP2PE: [Point-to-point encryption at terminal — reduces PCI scope]\nNetwork segmentation: [POS network isolated from corporate / guest WiFi]\nSOC 2 Type II: [Status]` },
  ],

  "Climate Tech": [
    { name: "Climate Science & Methodology Foundation", type: "document", folder: "Science & Methodology", content: `CLIMATE SCIENCE & METHODOLOGY FOUNDATION — [COMPANY NAME]\nFocus area: □ Voluntary carbon market (VCM)  □ Compliance carbon market  □ Carbon data / analytics  □ CDR (Carbon Dioxide Removal)  □ Climate risk analytics  □ Corporate ESG / net-zero advisory  □ Renewable energy + RECs  □ Nature-based solutions (NbS)\n\nSCIENTIFIC BASIS\n[What is the underlying science / mechanism by which your solution removes or avoids GHG emissions?]\nGHG Protocol alignment: □ Scope 1  □ Scope 2  □ Scope 3\nGas covered: □ CO2  □ CH4 (GWP 100-year: 28)  □ N2O (GWP: 265)  □ HFCs / PFCs / SF6\nAdditional co-benefits: [Biodiversity / Water quality / Livelihoods / Soil health]\n\nQUANTIFICATION METHODOLOGY\nStandard: □ VCS (Verra) — [VM00X]  □ Gold Standard  □ ACR  □ CAR  □ UNFCCC CDM  □ Plan Vivo  □ Proprietary\nBaseline approach: [Historical emissions / Regulatory / Performance standard]\nAdditionality demonstration: [Legal surplus / Investment test / Common practice test]\nPermanence approach: [Buffer pool / Insurance / Long-term guarantee]\nMRV (Monitoring, Reporting, Verification):\n  Monitoring: [Remote sensing / Ground measurements / IoT sensors / Modeled]\n  Reporting: [Annual / Project period]\n  Verification: [Third-party validator — [Approved VVBs]]\n  Sampling design: [Stratified random / Systematic grid]\n\nUNIQUE DIFFERENTIATOR\n[What makes your methodology more accurate / scalable / cost-effective than alternatives?]\nProprietary models: [Yes — [Description] / No]\nScientific advisors: [University affiliation / IPCC authors / National labs]` },
    { name: "Carbon Project Development Pipeline", type: "document", folder: "Carbon Markets", content: `CARBON PROJECT DEVELOPMENT PIPELINE — [COMPANY NAME]\n\nPROJECT TYPES IN PIPELINE\n□ Afforestation / Reforestation (ARR)\n□ Improved Forest Management (IFM)\n□ REDD+ (Reducing Emissions from Deforestation and Degradation)\n□ Soil organic carbon (agricultural land management)\n□ Grassland management\n□ Blue carbon (mangrove / seagrass / salt marsh)\n□ Biochar\n□ Landfill gas capture\n□ Cookstoves / clean energy access (developing world)\n□ Direct Air Capture (DAC)\n□ Industrial / fuel switching\n\nACTIVE PROJECTS\nProject 1: [Name / Type / Location]\n  Status: □ Feasibility  □ Project design doc (PDD)  □ Validation  □ Registration  □ Verified credits issued\n  Estimated annual credits: [X tCO2e/year]\n  Project duration: [X years]  |  Total credits potential: [X M tCO2e]\n  Validation body (VVB): [Name]\n  Registry listing: [Verra / Gold Standard / ACR]\n  Buyer: [Contracted / On market / Pipeline]\n\nProject 2: [Same structure]\n\nCREDIT PRICING\nSpot price range for [type]: $[X]–$[X]/tCO2e (as of [Date])\nForward contract pricing: $[X]/tCO2e at [delivery year]\nOur avg realized price: $[X]/tCO2e\n\nDEVELOPMENT TIMELINE (per project)\nFeasibility assessment: [X months]\nPDD development: [X months]\nValidation + registration: [X–X months]\nFirst credit issuance: [Total: X–X years from start]` },
    { name: "MRV & Technology Platform", type: "document", folder: "Platform & Data", content: `MRV & TECHNOLOGY PLATFORM — [PLATFORM NAME]\n\nMONITORING APPROACH\nRemote sensing:\n  □ Satellite imagery: [Sentinel-2 (free, 10m) / Planet (daily, 3m) / Maxar (50cm)]\n  □ LiDAR: [Airborne / GEDI (NASA spaceborne)]\n  □ SAR: [Sentinel-1 — cloud-penetrating for forest monitoring]\n  □ Hyperspectral: [DESIS / EnMap / Airborne]\n\nGround-based:\n  □ Plot-level biomass measurements (standard allometric equations)\n  □ Eddy covariance towers (direct flux measurement)\n  □ Soil sampling (soil carbon, bulk density)\n  □ IoT sensors (soil moisture, temperature, CO2)\n\nModels & Algorithms:\n  □ Carbon stock estimation: [Allometric equations / Biomass density maps / Machine learning]\n  □ Baseline projections: [Historical deforestation rate / Counterfactual modeling]\n  □ Additionality: [Leakage belt analysis]\n\nDIGITAL MRV (dMRV) PLATFORM\nData ingestion: [Satellite feed APIs / Field data mobile app / CSV / API from partners]\nProcessing: [Google Earth Engine / AWS SageMaker / Descartes Labs / In-house]\nValidation: [Automated QC rules + human review workflow]\nAudit trail: [Immutable log of all data inputs and calculations]\nVerifier access: [Read-only portal for third-party VVB access]\n\nBLOCKCHAIN / TOKENIZATION (if applicable)\nRegistry: [Toucan / Regen Network / Moss / Base Carbon Tokens]\nStandard retirement: [On-chain retirement = Verra/Gold Standard retirement]\nCustody: [Custodian for institutional buyers]` },
    { name: "Regulatory & Compliance Landscape", type: "document", folder: "Regulatory & Verification", content: `REGULATORY & COMPLIANCE LANDSCAPE — [COMPANY NAME]\n\nVOLUNTARY CARBON MARKETS\nKey standards:\n  □ Verra (VCS) — largest VCM registry\n  □ Gold Standard — high co-benefit claims\n  □ American Carbon Registry (ACR)\n  □ Climate Action Reserve (CAR)\n  □ Plan Vivo — smallholder / community focus\n\nICVCM Core Carbon Principles (CCPs):\n  □ Additionality  □ Permanence  □ Robust quantification\n  □ No double-counting  □ Sustainable development  □ No net harm\n  □ Contribution to net zero\n\nCOMPLIANCE CARBON MARKETS\n□ EU ETS (Emission Trading System) — [If applicable]\n□ California Cap-and-Trade (AB32) / CARB\n□ RGGI (Regional Greenhouse Gas Initiative — NE US)\n□ Article 6 (Paris Agreement) — ITMOs for country transfers\n□ UK ETS / Australia / Canada — [If applicable]\n\nCORPORATE REPORTING STANDARDS\n□ GHG Protocol Corporate Standard\n□ Science Based Targets initiative (SBTi)\n□ TCFD (Task Force on Climate-related Financial Disclosures)\n□ ISSB IFRS S1/S2 (mandatory disclosure — UK, Australia, others)\n□ SEC Climate Disclosure Rule (US — large accelerated filers)\n□ CDP (Climate Disclosure Project) reporting\n□ CSRD (EU Corporate Sustainability Reporting Directive)\n\nANTI-GREENWASHING RISK\n□ Green Guides (FTC) compliance for marketing claims\n□ EU Green Claims Directive (proposed)\n□ Science-based substantiation for all claims\n□ Third-party verification for all reported emissions reductions` },
    { name: "Corporate Climate Advisory Service", type: "document", folder: "Partnerships & GTM", content: `CORPORATE CLIMATE ADVISORY SERVICE — [COMPANY NAME]\n\nSERVICE OVERVIEW\n[What does your corporate advisory service offer? GHG accounting / Net-zero strategy / Carbon credit sourcing / TCFD reporting / ESG disclosure?]\n\nTARGET CLIENTS\nPrimary: [Corporate sustainability / ESG teams — Fortune 500 / mid-market]\nTrigger: [Net-zero commitment made / ISSB/CSRD disclosure requirement / Investor ESG pressure / Supply chain requirement]\nBuyer: [Chief Sustainability Officer (CSO) / VP ESG / CFO (for disclosure)]\n\nSERVICE PACKAGES\nPackage 1 — GHG Inventory & Baseline: $[X]K\n  Deliverables: [Scope 1 / 2 / 3 inventory / GHG Protocol compliant / Third-party reviewed]\n  Timeline: [X months]\n\nPackage 2 — Net-Zero Roadmap: $[X]K\n  Deliverables: [SBTi pathway / Reduction measures prioritized / Residual offset strategy]\n  Timeline: [X months]\n\nPackage 3 — Carbon Credit Sourcing & Portfolio: $[X]K/year\n  Deliverables: [High-quality offset portfolio / Annual retirement / Verification documentation]\n  Recurring: [Annual renewal + price locked]\n\nPackage 4 — TCFD/ISSB Disclosure Support: $[X]K\n  Deliverables: [Climate risk assessment / Scenario analysis (1.5°C / 2°C / 4°C) / Disclosure draft]\n\nDELIVERY MODEL\n□ Advisory only (consulting firm model)\n□ Software + advisory (SaaS + human layer)\n□ Fully managed (CSO-as-a-service)\n\nQUALITY STANDARDS\n□ GHG Protocol certified practitioners\n□ SBTi certified validator (if applicable)\n□ Carbon Disclosure Project (CDP) scoring support\n□ PAS 2060 carbon neutrality certification support` },
    { name: "Climate Data Product Specification", type: "document", folder: "Platform & Data", content: `CLIMATE DATA PRODUCT SPECIFICATION — [PRODUCT NAME]\n\nDATA PRODUCTS\nProduct 1: [Carbon credit quality score]\n  Description: [Assess integrity of individual carbon credits — methodology robustness, additionality, permanence, co-benefits, registry status]\n  Methodology: [Scoring rubric — [X] dimensions × weight]\n  Output: [Score 1–100 / Rating: A/B/C/D / Risk flags]\n  Coverage: [[X] projects / [X] registries]\n\nProduct 2: [Corporate emissions intelligence]\n  Description: [Estimated Scope 1/2/3 emissions for [X,000] public companies]\n  Methodology: [Reported data + physical activity data + spend-based estimation (EEIO model)]\n  Sources: [CDP / SEC filings / EDGAR / Company reports]\n  Update frequency: [Annual / Quarterly for publicly reported]\n\nProduct 3: [Climate risk exposure scores]\n  Description: [Physical + transition risk scores for [asset type: property / company / supply chain]]\n  Physical risks: [Heat stress / Flood / Sea level rise / Wildfire / Drought — RCP 4.5 + 8.5 scenarios]\n  Transition risks: [Carbon price exposure / Stranded asset risk / Policy sensitivity]\n  Scenarios: [IPCC SSP1-2.6 / SSP2-4.5 / SSP5-8.5]\n\nDATA DELIVERY\n□ API (REST + JSON) — [Authentication: API key / OAuth]\n□ Bulk download (CSV / Parquet)\n□ Dashboard (web app)\n□ Data feeds (SFTP / Snowflake secure data share)\nSLA: [API uptime: [X]% / Data freshness: [Daily / Weekly / Annual for corporate data]]` },
    { name: "Investor & Partnership Strategy", type: "document", folder: "Partnerships & GTM", content: `INVESTOR & PARTNERSHIP STRATEGY — [COMPANY NAME]\nRound: [Seed / Series A / Series B]  |  Amount: $[X]M\n\nCOMPANY OVERVIEW\nMission: [One sentence — e.g., "We accelerate the voluntary carbon market by making credit quality transparent and trustworthy"]\nRevenue: $[X] ARR  |  Customers: [#]  |  Credits verified / data coverage: [Metrics]\n\nINVESTMENT THESIS\n[Why is this an enormous opportunity? What is the structural market shift driving demand?]\n1. [Demand driver — e.g., Corporate net-zero commitments requiring $[X]B of credits by 2030]\n2. [Supply driver — e.g., High-quality credits scarce — our verification enables premium market]\n3. [Timing — e.g., ISSB mandatory disclosure creating urgency for Scope 3 data]\n\nTARGET INVESTORS\nClimate-focused VCs: [Breakthrough Energy Ventures / Congruent Ventures / Lowercarbon / Union Square Ventures / Prelude Ventures]\nESG / Impact: [Generate Capital / TPG Rise / BlackRock Climate / Nuveen]\nStrategic: [S&P Global / MSCI / Bloomberg / Intercontinental Exchange / major carbon market participants]\n\nSTRATEGIC PARTNERSHIPS\nRegistry partnerships: [Verra / Gold Standard — data access + referral]\nFinancial market: [CME Group / ICE / Xpansiv (CBL marketplace)]\nCorporate customer channel: [ESG consulting firms (EY / Deloitte / Accenture) — white-label / referral]\nTech platform: [Salesforce Net Zero Cloud / SAP Sustainability / Workiva — integration]\n\nPARTNERSHIP VALUE EXCHANGE\n[Partner Type]: [What we give them] ↔ [What they give us]\n[Registry]: [Enhanced data / better reporting tools] ↔ [Data access / co-marketing / referrals]\n[Financial]: [Market intelligence / credit quality scores] ↔ [Distribution / trading data]\n\nMILESTONES TO NEXT ROUND\n□ $[X]M ARR\n□ [X] corporate enterprise clients\n□ [X] credits verified or [X] tCO2e in pipeline\n□ [Key partnership signed]\n□ [Geographic expansion]` },
    { name: "GHG Accounting & Net-Zero Playbook", type: "document", folder: "Science & Methodology", content: `GHG ACCOUNTING & NET-ZERO PLAYBOOK — [COMPANY NAME / CLIENT NAME]\nGHG Protocol: Corporate Standard  |  Base year: [Year]  |  Reporting year: [Year]\n\nSCOPE 1 — DIRECT EMISSIONS\nSources:\n  □ Stationary combustion: [Natural gas / Propane / Fuel oil]\n  □ Mobile combustion: [Fleet vehicles — gas / diesel]\n  □ Process emissions: [If applicable]\n  □ Fugitive emissions: [Refrigerants — R-22 / R-410A / SF6]\nTotal Scope 1: [X] tCO2e\nData quality: □ Measured  □ Calculated from activity data  □ Estimated\n\nSCOPE 2 — INDIRECT ENERGY\nMarket-based: [X] tCO2e (using RECs / GOs / supplier-specific EFs)\nLocation-based: [X] tCO2e (using grid average EFs from EPA eGrid)\nRECs retired: [Yes — [X] MWh / No]\n\nSCOPE 3 — VALUE CHAIN\nMaterial categories:\n  Cat 1 (Purchased goods & services): [X] tCO2e — [Spend-based / Supplier-specific]\n  Cat 4 (Upstream transportation): [X] tCO2e\n  Cat 6 (Business travel): [X] tCO2e\n  Cat 7 (Employee commuting): [X] tCO2e\n  Cat 11 (Use of sold products): [X] tCO2e — [If applicable]\n  Cat 12 (End-of-life): [X] tCO2e — [If applicable]\nTotal Scope 3: [X] tCO2e\n\nNET-ZERO ROADMAP\nBase year total: [X] tCO2e\n2025 target: [X]% reduction → [X] tCO2e\n2030 target: [X]% reduction → [X] tCO2e (SBTi near-term)\n2040 target: [X]% reduction → [X] tCO2e\n2050 target: Net zero — residual [X] tCO2e offset with [removal credits only per SBTi]\n\nKEY REDUCTION LEVERS\n1. [100% renewable electricity — RECs / PPA] → [X] tCO2e/year\n2. [Fleet electrification] → [X] tCO2e/year\n3. [Supplier engagement (top [X] by spend)] → [X] tCO2e/year\n4. [Business travel reduction policy] → [X] tCO2e/year` },
  ],
};

// ─── Dashboard Actions ────────────────────────────────────────────────────────

const DASHBOARD_ACTIONS = [
  { id: "apps",      icon: "🧩", label: "Apps",              color: "#6366f1" },
  { id: "modes",     icon: "🎛️", label: "Modes",             color: "#8b5cf6" },
  { id: "marketing", icon: "📣", label: "Marketing Packet",  color: "#f59e0b" },
  { id: "company",   icon: "🏢", label: "Company Packet",    color: "#10b981" },
  { id: "ai",        icon: "🤖", label: "AI Helper",         color: "#06b6d4" },
  { id: "addfile",   icon: "➕", label: "Add New File",      color: "#0ea5e9" },
  { id: "addsubapp", icon: "📱", label: "Add New Sub‑App",   color: "#ec4899" },
  { id: "search",    icon: "🔍", label: "Search Project",    color: "#f97316" },
];

// ─── Suggested Project Templates ─────────────────────────────────────────────

const SUGGESTED_TEMPLATES: SuggestedTemplate[] = [
  {
    id: "st-freelance",
    icon: "💼",
    name: "Freelance Services Platform",
    industry: "Technology",
    description: "Package your skills as a full-service offering with pricing pages, client portal, and deliverable tracker.",
    tags: ["gigs", "services", "clients"],
  },
  {
    id: "st-digital-product",
    icon: "🎁",
    name: "Digital Product Launch",
    industry: "Retail",
    description: "Ready-to-sell templates, courses, or toolkits. Comes with marketing kit and checkout flow.",
    tags: ["product", "launch", "ecommerce"],
  },
  {
    id: "st-local-biz",
    icon: "🏪",
    name: "Local Business Presence",
    industry: "General",
    description: "Website, booking system, and social content calendar for any local service business.",
    tags: ["local", "booking", "community"],
  },
  {
    id: "st-consulting",
    icon: "📊",
    name: "Consulting Practice",
    industry: "Legal",
    description: "Client proposals, SOW templates, invoicing, and outcome reports — all in one workspace.",
    tags: ["consulting", "B2B", "professional"],
  },
  {
    id: "st-content",
    icon: "🎬",
    name: "Content Creator Studio",
    industry: "Technology",
    description: "Script-to-publish pipeline, audience tracker, sponsorship CRM, and brand kit.",
    tags: ["creator", "media", "brand"],
  },
  {
    id: "st-health",
    icon: "🏥",
    name: "Health & Wellness Practice",
    industry: "Healthcare",
    description: "Client intake, session notes, wellness plans, and compliance documentation.",
    tags: ["health", "coaching", "wellness"],
  },
];

// ─── Static Opportunity Feed ───────────────────────────────────────────────────

const STATIC_OPPORTUNITIES: OpportunityItem[] = [
  {
    id: "op-1", icon: "💻",
    title: "AI-Powered Resume Services",
    category: "Freelance Gig",
    summary: "High demand for personalized AI resume writing and LinkedIn optimization. $50–$150/client.",
    potential: "$3k–$8k/mo",
    effort: "Low",
  },
  {
    id: "op-2", icon: "📱",
    title: "Social Media Management Packages",
    category: "Service",
    summary: "Businesses actively hiring for monthly social media retainers. Package for 3–5 platforms.",
    potential: "$2k–$6k/mo",
    effort: "Medium",
  },
  {
    id: "op-3", icon: "🎓",
    title: "Online Course: AI Tools for Professionals",
    category: "Digital Product",
    summary: "Trending searches for AI productivity courses. One-time creation, recurring passive income.",
    potential: "$1k–$5k/launch",
    effort: "Medium",
  },
  {
    id: "op-4", icon: "🏗️",
    title: "Construction Project Management App",
    category: "Market Gap",
    summary: "Contractors need simple mobile-first tools for estimates, crew schedules, and client sign-offs.",
    potential: "$5k–$20k/mo SaaS",
    effort: "High",
  },
  {
    id: "op-5", icon: "🛒",
    title: "Done-For-You Etsy / Shopify Store",
    category: "Business Package",
    summary: "Fully branded print-on-demand store. Setup + handoff in 5 days. Growing buyer demand.",
    potential: "$800–$2k/store",
    effort: "Low",
  },
  {
    id: "op-6", icon: "📣",
    title: "Local Business Digital Marketing Retainer",
    category: "Service",
    summary: "Restaurants, salons, and gyms need consistent ad management. Flat-rate monthly package.",
    potential: "$1.5k–$4k/client",
    effort: "Medium",
  },
];

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiListProjects(): Promise<Project[]> {
  try {
    const res = await fetch("/api/projects", { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json() as { projects: Project[] };
    return data.projects ?? [];
  } catch { return []; }
}

async function apiCreateProject(name: string, industry: string): Promise<Project | null> {
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, industry }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { project: Project };
    fetch("/api/activity", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "project_created", label: `Created project "${name}"`, icon: "📁", appId: "projos", projectId: String(data.project?.id ?? "") }),
    }).catch(() => {});
    return data.project;
  } catch { return null; }
}

async function apiDeleteProject(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE", credentials: "include" });
    return res.ok;
  } catch { return false; }
}

async function apiSetProjectStatus(id: string, status: "active" | "archived"): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${id}/status`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch { return false; }
}

async function apiAddFile(projectId: string, name: string, fileType: string, folderId: string, content?: string): Promise<ProjectFile | null> {
  try {
    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, fileType, folderId: folderId || undefined, content }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { file: ProjectFile };
    fetch("/api/activity", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "file_created", label: `Created file "${name}"`, icon: "📄", appId: "projos", projectId }),
    }).catch(() => {});
    return data.file;
  } catch { return null; }
}

async function apiDeleteFile(projectId: string, fileId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, { method: "DELETE", credentials: "include" });
    return res.ok;
  } catch { return false; }
}

async function apiLoadFileContent(fileId: string): Promise<string> {
  try {
    const res = await fetch(`/api/projects/files/${fileId}`, { credentials: "include" });
    if (!res.ok) return "";
    const data = await res.json() as { file: ProjectFile };
    return data.file.content ?? "";
  } catch { return ""; }
}

async function apiSaveFileContent(projectId: string, fileId: string, content: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  } catch { return false; }
}

async function apiUpdateProject(id: string, updates: { name?: string; description?: string }): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return res.ok;
  } catch { return false; }
}

async function apiListSharedProjects(): Promise<SharedProject[]> {
  try {
    const res = await fetch("/api/projects/shared-with-me", { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json() as { projects: SharedProject[] };
    return data.projects ?? [];
  } catch { return []; }
}

async function apiResetMySpace(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch("/api/projects/reset-my-space", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return { ok: false, message: "Failed to reset space." };
    return await res.json() as { ok: boolean; message: string };
  } catch { return { ok: false, message: "Network error." }; }
}

async function apiLoadChatHistory(projectId: string): Promise<{ role: "user" | "ai"; text: string }[]> {
  try {
    const res = await fetch(`/api/project-chat/${projectId}/history`, { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json() as { messages: { role: "user" | "ai"; text: string }[] };
    return data.messages ?? [];
  } catch { return []; }
}

// ─── Task API ─────────────────────────────────────────────────────────────────

async function apiListTasks(projectId: string): Promise<ProjectTask[]> {
  try {
    const res = await fetch(`/api/projects/${projectId}/tasks`, { credentials: "include" });
    if (!res.ok) return [];
    return await res.json() as ProjectTask[];
  } catch { return []; }
}

async function apiCreateTask(projectId: string, title: string, status: ProjectTask["status"], priority: ProjectTask["priority"], description?: string): Promise<ProjectTask | null> {
  try {
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status, priority, description }),
    });
    if (!res.ok) return null;
    return await res.json() as ProjectTask;
  } catch { return null; }
}

async function apiUpdateTask(projectId: string, taskId: string, updates: Partial<Pick<ProjectTask, "status" | "priority" | "title" | "description">>): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return res.ok;
  } catch { return false; }
}

async function apiDeleteTask(projectId: string, taskId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "DELETE", credentials: "include",
    });
    return res.ok;
  } catch { return false; }
}

async function apiPublishProject(id: string): Promise<{ ok: boolean; publishUrl?: string }> {
  return publishProject(id);
}

async function apiUnpublishProject(id: string): Promise<boolean> {
  return unpublishProject(id);
}

// ─── TaskBoard Component ──────────────────────────────────────────────────────

const TASK_COLS: { id: ProjectTask["status"]; label: string; icon: string; color: string }[] = [
  { id: "todo",        label: "To Do",      icon: "⬜", color: "#94a3b8" },
  { id: "in-progress", label: "In Progress", icon: "🔵", color: "#6366f1" },
  { id: "done",        label: "Done",       icon: "✅", color: "#34C759" },
];

const PRIORITY_COLORS: Record<ProjectTask["priority"], string> = {
  low: "#94a3b8", medium: "#FF9500", high: "#FF3B30",
};

function TaskBoard({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState<ProjectTask["status"] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<ProjectTask["priority"]>("medium");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiListTasks(projectId).then(t => { setTasks(t); setLoading(false); });
  }, [projectId]);

  const handleAdd = async (status: ProjectTask["status"]) => {
    if (!newTitle.trim()) return;
    setSaving(true);
    const task = await apiCreateTask(projectId, newTitle.trim(), status, newPriority, newDesc.trim() || undefined);
    if (task) setTasks(prev => [...prev, task]);
    setNewTitle(""); setNewDesc(""); setNewPriority("medium"); setShowAdd(null);
    setSaving(false);
  };

  const handleMove = async (task: ProjectTask, newStatus: ProjectTask["status"]) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    await apiUpdateTask(projectId, task.id, { status: newStatus });
  };

  const handleDelete = async (task: ProjectTask) => {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    await apiDeleteTask(projectId, task.id);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, color: "#475569", fontSize: 13 }}>
        Loading tasks…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, padding: "16px", overflowX: "auto", height: "100%", alignItems: "flex-start" }}>
      {TASK_COLS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id} style={{
            width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8,
            background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "12px",
            border: `1px solid ${col.color}22`,
          }}>
            {/* Column header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{col.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: col.color }}>{col.label}</span>
                <span style={{
                  fontSize: 10, background: `${col.color}22`, color: col.color,
                  borderRadius: 20, padding: "1px 7px", fontWeight: 700,
                }}>{colTasks.length}</span>
              </div>
              <button
                onClick={() => { setShowAdd(col.id); setNewTitle(""); setNewDesc(""); setNewPriority("medium"); }}
                style={{
                  background: `${col.color}22`, border: `1px solid ${col.color}44`, borderRadius: 6,
                  width: 22, height: 22, color: col.color, cursor: "pointer", fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >+</button>
            </div>

            {/* Add form */}
            {showAdd === col.id && (
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                <input
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Task title…"
                  style={{
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 6, padding: "6px 8px", color: "#e2e8f0", fontSize: 12,
                  }}
                  onKeyDown={e => { if (e.key === "Enter") handleAdd(col.id); if (e.key === "Escape") setShowAdd(null); }}
                />
                <input
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  style={{
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6, padding: "5px 8px", color: "#94a3b8", fontSize: 11,
                  }}
                />
                <div style={{ display: "flex", gap: 4 }}>
                  {(["low", "medium", "high"] as ProjectTask["priority"][]).map(p => (
                    <button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      style={{
                        flex: 1, background: newPriority === p ? `${PRIORITY_COLORS[p]}22` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${newPriority === p ? PRIORITY_COLORS[p] : "transparent"}`,
                        borderRadius: 5, padding: "4px 0", color: PRIORITY_COLORS[p],
                        fontSize: 10, cursor: "pointer", fontWeight: 600, textTransform: "capitalize",
                      }}
                    >{p}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => handleAdd(col.id)}
                    disabled={!newTitle.trim() || saving}
                    style={{
                      flex: 1, background: col.color, border: "none", borderRadius: 6,
                      padding: "6px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}
                  >{saving ? "…" : "Add Task"}</button>
                  <button
                    onClick={() => setShowAdd(null)}
                    style={{
                      background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6,
                      padding: "6px 10px", color: "#94a3b8", fontSize: 11, cursor: "pointer",
                    }}
                  >Cancel</button>
                </div>
              </div>
            )}

            {/* Tasks */}
            {colTasks.length === 0 && showAdd !== col.id && (
              <div style={{ fontSize: 11, color: "#334155", textAlign: "center", padding: "16px 0" }}>No tasks yet</div>
            )}
            {colTasks.map(task => (
              <div key={task.id} style={{
                background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "10px",
                border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3 }}>{task.title}</div>
                    {task.description && (
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3, lineHeight: 1.4 }}>{task.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(task)}
                    style={{
                      background: "transparent", border: "none", color: "#475569",
                      cursor: "pointer", fontSize: 11, padding: "0 2px", flexShrink: 0,
                    }}
                    title="Delete"
                  >✕</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    fontSize: 9, background: `${PRIORITY_COLORS[task.priority]}22`,
                    color: PRIORITY_COLORS[task.priority], borderRadius: 4, padding: "2px 6px",
                    fontWeight: 700, textTransform: "capitalize",
                  }}>{task.priority}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {TASK_COLS.filter(c => c.id !== task.status).map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleMove(task, c.id)}
                        title={`Move to ${c.label}`}
                        style={{
                          background: `${c.color}15`, border: `1px solid ${c.color}33`,
                          borderRadius: 4, padding: "2px 5px", color: c.color,
                          fontSize: 9, cursor: "pointer", fontWeight: 600,
                        }}
                      >{c.icon}</button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DeleteConfirm({
  label, onConfirm, onCancel,
}: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="rounded-2xl p-6 w-80 shadow-2xl"
        style={{ background: "#ffffff", border: "1px solid rgba(239,68,68,0.20)" }}
      >
        <div className="text-[15px] font-bold mb-2" style={{ color: "#0f172a" }}>Delete "{label}"?</div>
        <div className="text-[12px] mb-5" style={{ color: "#64748b" }}>
          This action cannot be undone. Nothing else will break.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-[13px] font-medium"
            style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid rgba(0,0,0,0.09)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl text-[13px] font-medium"
            style={{ background: "rgba(239,68,68,0.18)", color: "#f87171", border: "1px solid rgba(239,68,68,0.35)" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchModal({
  projects, onClose,
}: { projects: Project[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const results: { type: string; label: string; project: string; icon: string }[] = [];
  if (q.trim()) {
    const lq = q.toLowerCase();
    for (const p of projects) {
      if (p.name.toLowerCase().includes(lq)) results.push({ type: "Project", label: p.name, project: p.name, icon: p.icon });
      for (const f of p.files) {
        if (f.name.toLowerCase().includes(lq)) results.push({ type: "File", label: f.name, project: p.name, icon: "📄" });
      }
      for (const folder of p.folders) {
        if (folder.name.toLowerCase().includes(lq)) results.push({ type: "Folder", label: folder.name, project: p.name, icon: folder.icon });
      }
      for (const sa of p.subApps) {
        if (sa.name.toLowerCase().includes(lq)) results.push({ type: "Sub-App", label: sa.name, project: p.name, icon: sa.icon });
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      style={{ background: "rgba(15,23,42,0.50)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-[520px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.10)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <span className="text-lg">🔍</span>
          <input
            ref={ref}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search all projects, files, folders, sub-apps…"
            className="flex-1 bg-transparent text-[14px] outline-none"
            style={{ color: "#0f172a" }}
          />
          <button onClick={onClose} className="text-[11px]" style={{ color: "#475569" }}>ESC</button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {!q.trim() && (
            <div className="p-6 text-center text-[12px]" style={{ color: "#475569" }}>
              Start typing to search across all projects, files, folders, sub-apps, screens, and packets
            </div>
          )}
          {q.trim() && results.length === 0 && (
            <div className="p-6 text-center text-[12px]" style={{ color: "#475569" }}>No results for "{q}"</div>
          )}
          {results.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span className="text-base">{r.icon}</span>
              <div className="flex-1">
                <div className="text-[13px]" style={{ color: "#0f172a" }}>{r.label}</div>
                <div className="text-[10px]" style={{ color: "#475569" }}>{r.type} · {r.project}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

// ── File-level workflow quick-action prompts ──────────────────────────────────
function getFileWorkflows(file: ProjectFile): { label: string; icon: string; prompt: string }[] {
  const n = file.name.toLowerCase();
  const base: { label: string; icon: string; prompt: string }[] = [
    { label: "Enhance",     icon: "✨", prompt: `Enhance and improve the "${file.name}" document. Make it more detailed, professional, and actionable. Return the improved content directly.` },
    { label: "Add Section", icon: "＋", prompt: `Add one new, highly relevant section to "${file.name}" that would make it more complete.` },
    { label: "Summarize",   icon: "📋", prompt: `Write a concise executive summary of "${file.name}".` },
  ];
  if (n.includes("budget") || n.includes("financ") || n.includes("revenue") || n.includes("p&l"))
    return [{ label: "Build Budget",    icon: "💰", prompt: `Create a detailed line-item budget breakdown for this project.` }, ...base.slice(0, 2)];
  if (n.includes("script") || n.includes("scene") || n.includes("screenplay") || n.includes("pilot") || n.includes("episode"))
    return [
      { label: "Write Next Scene", icon: "🎬", prompt: `Write the next scene for this script, continuing naturally from where it left off.` },
      { label: "Format Script",    icon: "📐", prompt: `Reformat this content into proper screenplay format: scene headers, action lines, dialogue.` },
      base[0],
    ];
  if (n.includes("pitch") || n.includes("deck") || n.includes("investor"))
    return [{ label: "Sharpen Pitch", icon: "🎯", prompt: `Make this pitch more compelling. Sharpen the value proposition and key metrics.` }, ...base.slice(0, 2)];
  if (n.includes("market") || n.includes("campaign") || n.includes("brand") || n.includes("audience"))
    return [
      { label: "Target Audience", icon: "🎯", prompt: `Define the ideal target audience, buyer personas, and messaging approach.` },
      { label: "Campaign Ideas",  icon: "💡", prompt: `Generate 5 high-impact campaign concepts for this project.` },
      base[0],
    ];
  if (n.includes("roadmap") || n.includes("sprint") || n.includes("milestone") || n.includes("timeline"))
    return [
      { label: "Next Milestones", icon: "🗺️", prompt: `Suggest the next 3 milestones this project should hit, with timelines.` },
      { label: "Risk Analysis",   icon: "⚠️",  prompt: `Identify the top 5 risks for this project and propose mitigation strategies.` },
      base[0],
    ];
  if (n.includes("legal") || n.includes("contract") || n.includes("nda") || n.includes("term"))
    return [{ label: "Review Clauses", icon: "⚖️", prompt: `Review the key clauses in this document and suggest improvements or missing protections.` }, ...base.slice(0, 2)];
  if (n.includes("lyric") || n.includes("track") || n.includes("song") || n.includes("chorus"))
    return [
      { label: "Write Verse", icon: "🎵", prompt: `Write a new verse for this track that fits the style and theme of the existing content.` },
      { label: "Write Hook",  icon: "🎶", prompt: `Write a memorable, catchy hook/chorus for this song.` },
      base[0],
    ];
  if (n.includes("chapter") || n.includes("outline") || n.includes("character") || n.includes("plot"))
    return [
      { label: "Write Scene",    icon: "📖", prompt: `Write the next scene or section, continuing naturally.` },
      { label: "Character Arc",  icon: "🧑‍🎭", prompt: `Develop the character arcs and add depth to the characters.` },
      base[0],
    ];
  if (n.includes("lesson") || n.includes("module") || n.includes("curriculum") || n.includes("course"))
    return [
      { label: "Add Exercise",  icon: "📝", prompt: `Add a practical exercise or quiz for this lesson module.` },
      { label: "Learning Goals", icon: "🎓", prompt: `Define clear learning objectives and outcomes for this module.` },
      base[0],
    ];
  return base;
}

// ─── Observability Dashboard ──────────────────────────────────────────────────
// Live system health view — polls metrics, telemetry, and audit log every 5 s.

interface ObservMetrics {
  memory?: { heapUsed: number; heapTotal: number; rss: number };
  cpu?: { user: number; system: number };
  uptime?: number;
  db?: Record<string, number>;
  platform?: { totalTypes: number; totalTemplates: number; totalPersonas: number };
}
interface ObservStreams {
  activeCount?: number;
  peakConcurrency?: number;
  totalStarted?: number;
  avgDurationMs?: number;
  activeStreams?: { streamId: string; projectId: string; durationMs: number }[];
}
interface ObservAudit {
  activity?: { id: number; action: string; label: string; icon: string; createdAt: string }[];
  actionCounts?: { action: string; count: number }[];
}

function ObservabilityDashboard() {
  const [metrics, setMetrics]   = useState<ObservMetrics>({});
  const [streams, setStreams]   = useState<ObservStreams>({});
  const [audit,   setAudit]     = useState<ObservAudit>({});
  const [lastAt,  setLastAt]    = useState<string>("—");
  const [error,   setError]     = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [mRes, sRes, aRes] = await Promise.all([
        fetch("/api/system/metrics",          { credentials: "include" }),
        fetch("/api/system/telemetry/streams", { credentials: "include" }),
        fetch("/api/activity/query?limit=30", { credentials: "include" }),
      ]);
      if (mRes.ok) setMetrics(await mRes.json());
      if (sRes.ok) setStreams(await sRes.json());
      if (aRes.ok) setAudit(await aRes.json());
      setLastAt(new Date().toLocaleTimeString());
      setError(null);
    } catch (e) {
      setError("Fetch failed — retrying in 5 s");
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const fmt = (n: number) => n >= 1024 ? `${(n / 1024).toFixed(1)} GB` : `${n.toFixed(0)} MB`;
  const sec = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m ${Math.floor(s % 60)}s`;
  };

  const card = (title: string, children: React.ReactNode) => (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );

  const stat = (label: string, value: string | number, sub?: string, color = "#1e293b") => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{sub}</div>}
    </div>
  );

  const mem   = metrics.memory;
  const heapPct = mem ? Math.round((mem.heapUsed / mem.heapTotal) * 100) : 0;
  const heapColor = heapPct > 80 ? "#f87171" : heapPct > 60 ? "#f59e0b" : "#10b981";

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>System Observability</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Auto-refreshes every 5 s · Last update: {lastAt}</div>
        </div>
        <button
          onClick={fetchAll}
          style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.20)", color: "#6366f1", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
        >↻ Refresh</button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", color: "#ef4444", fontSize: 11, marginBottom: 16 }}>{error}</div>
      )}

      {/* Row 1 — Server + Streams */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        {card("Server Health", <>
          {stat("Uptime", metrics.uptime ? sec(metrics.uptime) : "—")}
          {stat("Heap used / total",
            mem ? `${fmt(mem.heapUsed / 1e6)} / ${fmt(mem.heapTotal / 1e6)}` : "—",
            `${heapPct}% utilised`, heapColor)}
          {mem && (
            <div style={{ height: 4, borderRadius: 4, background: "rgba(0,0,0,0.06)", overflow: "hidden", marginTop: -4 }}>
              <div style={{ height: "100%", width: `${heapPct}%`, background: heapColor, borderRadius: 4, transition: "width 0.4s" }} />
            </div>
          )}
          {stat("RSS", mem ? fmt(mem.rss / 1e6) : "—", "resident set size")}
        </>)}

        {card("AI Streams", <>
          {stat("Active now",   streams.activeCount    ?? 0, undefined, streams.activeCount ? "#6366f1" : "#10b981")}
          {stat("Peak",         streams.peakConcurrency ?? 0)}
          {stat("Total started", streams.totalStarted   ?? 0)}
          {stat("Avg duration",  streams.avgDurationMs  != null ? `${(streams.avgDurationMs / 1000).toFixed(1)}s` : "—")}
        </>)}

        {card("Platform", <>
          {stat("Project types",    metrics.platform?.totalTypes     ?? "—")}
          {stat("Templates",        metrics.platform?.totalTemplates ?? "—")}
          {stat("Expert personas",  metrics.platform?.totalPersonas  ?? "—")}
        </>)}
      </div>

      {/* Row 2 — DB stats + Active streams + Action counts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {card("Database Row Counts", <>
          {metrics.db
            ? Object.entries(metrics.db).map(([table, count]) => (
                <div key={table} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{table}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{count.toLocaleString()}</span>
                </div>
              ))
            : <div style={{ color: "#94a3b8", fontSize: 11 }}>Loading…</div>
          }
        </>)}

        {card("Action Frequency", <>
          {audit.actionCounts?.length
            ? audit.actionCounts.map(({ action, count }) => {
                const max = audit.actionCounts![0].count;
                return (
                  <div key={action} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{action}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#6366f1" }}>{count}</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 3, background: "rgba(0,0,0,0.05)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(count / max) * 100}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })
            : <div style={{ color: "#94a3b8", fontSize: 11 }}>No actions logged yet.</div>
          }
        </>)}
      </div>

      {/* Active streams detail */}
      {(streams.activeStreams?.length ?? 0) > 0 && card("Live Streams", (
        <div>
          {streams.activeStreams!.map(s => (
            <div key={s.streamId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <div>
                <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 600 }}>Project {s.projectId}</span>
                <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 8, fontFamily: "monospace" }}>{s.streamId.slice(0, 8)}…</span>
              </div>
              <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>{(s.durationMs / 1000).toFixed(1)}s</span>
            </div>
          ))}
        </div>
      ))}

      {/* Row 3 — Recent audit feed */}
      <div style={{ marginTop: 14 }}>
        {card("Recent Activity Log (last 30)", <>
          {audit.activity?.length
            ? audit.activity.map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize: 14 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.label}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1, fontFamily: "monospace" }}>{a.action}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#cbd5e1", flexShrink: 0, whiteSpace: "nowrap" }}>
                    {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))
            : <div style={{ color: "#94a3b8", fontSize: 11 }}>No activity yet.</div>
          }
        </>)}
      </div>
    </div>
  );
}

export function ProjectOSApp() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Universal Resume — restore last project + view across sessions
  const { resumeState, setEntityId: _resumeSetProject, setView: _resumeSetView } =
    useUniversalResume("projos", { view: "dashboard+folders", entityId: null });

  const [activeProjectId, _setActiveProjectId] = useState<string | null>(resumeState.entityId);
  const [viewMode, _setViewMode] = useState<ViewMode>(resumeState.view as ViewMode ?? "dashboard+folders");

  const setActiveProjectId = (id: string | null) => { _setActiveProjectId(id); _resumeSetProject(id); };
  const setViewMode = (m: ViewMode) => { _setViewMode(m); _resumeSetView(m); };
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjIndustry, setNewProjIndustry] = useState("General");
  const [newProjStep, setNewProjStep] = useState<1 | 2 | 3>(1);
  // ── "Create X" natural language entry ──────────────────────────────────
  const [createXInput, setCreateXInput] = useState("");
  const [createXLoading, setCreateXLoading] = useState(false);
  const [createXParsed, setCreateXParsed] = useState<{
    name: string; industry: string;
    intent: { purpose: string; audience: string; tone: string };
  } | null>(null);
  // ── Live Build Mode ──────────────────────────────────────────────────────
  const [liveBuild, setLiveBuild] = useState<{
    phase: "parsing" | "creating" | "scaffolding" | "genome" | "complete";
    projectId: string | null;
    projectName: string | null;
    industry: string | null;
    thinking: string[];
    scaffoldProgress: { current: number; total: number } | null;
  } | null>(null);
  // ── Mobile sidebar ───────────────────────────────────────────────────────
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // ── Global Rewrite Engine ─────────────────────────────────────────────
  const [showGlobalRewrite, setShowGlobalRewrite] = useState(false);
  const [globalRewriteInstruction, setGlobalRewriteInstruction] = useState("");
  const [globalRewriteLoading, setGlobalRewriteLoading] = useState(false);
  const [globalRewriteProgress, setGlobalRewriteProgress] = useState<{ current: number; total: number } | null>(null);
  // H-04: AbortController ref — lets us cancel in-flight rewrite requests when the modal closes
  const globalRewriteAbortRef = useRef<AbortController | null>(null);
  const [newProjIntent, setNewProjIntent] = useState<{ audience: string; purpose: string; tone: string; constraints: string }>({
    audience: "", purpose: "", tone: "professional", constraints: "",
  });
  const [scaffoldStatus, setScaffoldStatus] = useState<{ current: number; total: number; label: string } | null>(null);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; label: string; projectId?: string } | null>(null);
  const [showAddFile, setShowAddFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState("Document");
  const [showAddSubApp, setShowAddSubApp] = useState(false);
  const [newSubAppName, setNewSubAppName] = useState("");
  const [newSubAppIcon, setNewSubAppIcon] = useState("📱");
  const [showModes, setShowModes] = useState(false);
  const [activeMode, setActiveMode] = useState<"Demo" | "Test" | "Live">("Live");
  const [viewingFile, setViewingFile] = useState<ProjectFile | null>(null);
  const [fileContentText, setFileContentText] = useState("");
  const [fileContentEditing, setFileContentEditing] = useState(false);
  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [fileContentSaving, setFileContentSaving] = useState(false);
  const [fileContentSaved, setFileContentSaved] = useState(false);
  // Instant-edit AI agent
  const [instantEditLoading, setInstantEditLoading] = useState(false);
  const [instantEditMode, setInstantEditMode] = useState<"improve" | "rewrite" | "expand" | "summarize" | "proof" | null>(null);
  const [showInstantEditMenu, setShowInstantEditMenu] = useState(false);
  const instantEditAbortRef = useRef<AbortController | null>(null);
  // Portfolio intelligence
  const [portfolioIntel, setPortfolioIntel] = useState<{
    stats:  { total: number; typeBreakdown: Record<string, number>; avgCompletion: number; projectCompletions: Array<{ name: string; industry: string; completion: number; files: number }> };
    recommendations: Array<{ title: string; body: string; priority: string }>;
    synergies: Array<{ projects: string[]; insight: string }>;
    portfolioInsight: string;
    missingTypes: string[];
  } | null>(null);
  const [portfolioIntelLoading, setPortfolioIntelLoading] = useState(false);
  // ── File-level agent chat ──
  const [fileAiMessages, setFileAiMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [fileAiInput, setFileAiInput]       = useState("");
  const [fileAiLoading, setFileAiLoading]   = useState(false);
  const [editingProjectName, setEditingProjectName] = useState(false);

  // ── Project Intelligence: Lifecycle + Document Generation ──────────────────
  interface LifecycleFile { id: string; name: string; status: "empty" | "started" | "complete"; }
  interface LifecycleData {
    score: number;
    summary: { total: number; complete: number; started: number; empty: number };
    files: LifecycleFile[];
    nextAction: string;
    projectType: string;
  }
  const [lifecycle, setLifecycle]       = useState<LifecycleData | null>(null);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [genStatus, setGenStatus] = useState<{
    running:   boolean;
    current:   string;
    completed: number;
    total:     number;
    done:      boolean;
  } | null>(null);
  const genAbortRef = useRef<AbortController | null>(null);

  // ── Project Genome state ─────────────────────────────────────────────────
  interface GenomeVision    { purpose: string; audience: string; tone: string; differentiators: string[] }
  interface GenomeStructure { phases: string[]; keyDeliverables: string[] }
  interface GenomeAssets    { documentsNeeded: string[]; visualStyle: string; copyThemes: string[] }
  interface GenomeExecution { estimatedTimeline: string; keyRisks: string[]; suggestedTools: string[] }
  interface GenomeLifecycle { currentPhase: "IDEATION" | "SCOPING" | "PRODUCTION" | "POLISH"; nextActions: string[] }
  interface GenomeData {
    vision:        GenomeVision;
    structure:     GenomeStructure;
    assetPlan:     GenomeAssets;
    executionPlan: GenomeExecution;
    lifecycle:     GenomeLifecycle;
    generatedAt?:  string;
  }
  const [genome, setGenome]               = useState<GenomeData | null>(null);
  const [genomeLoading, setGenomeLoading] = useState(false);
  const [genomeExpanded, setGenomeExpanded] = useState(false);
  const [editProjectNameVal, setEditProjectNameVal] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  // ── Shared With Me / Suggested / Opportunities state ──
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [sharedLoading, setSharedLoading]   = useState(false);
  const [showSuggested, setShowSuggested]   = useState(false);
  const [showShared, setShowShared]         = useState(false);
  const [adoptingId, setAdoptingId]         = useState<string | null>(null);
  const [adoptedIds, setAdoptedIds]         = useState<string[]>([]);
  const [opportunities]                     = useState<OpportunityItem[]>(STATIC_OPPORTUNITIES);
  const [adoptingOpId, setAdoptingOpId]     = useState<string | null>(null);
  const [adoptedOpIds, setAdoptedOpIds]     = useState<string[]>([]);
  // ── Member/Team state ──
  const [members, setMembers]         = useState<ProjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [addMemberId, setAddMemberId] = useState("");
  const [addMemberRole, setAddMemberRole] = useState<"viewer" | "editor" | "owner">("viewer");
  const [addingMember, setAddingMember] = useState(false);
  // ── Publishing pipeline state (req 13 + 14) ──
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishStep, setPublishStep] = useState<"review" | "billing" | "confirm" | "done">("review");
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishBillingOk, setPublishBillingOk] = useState(false);
  const [publishDoneUrl, setPublishDoneUrl] = useState<string | null>(null);
  const [publishedProjectIds, setPublishedProjectIds] = useState<Set<string>>(new Set());
  // ── Voice input state (req 6) ──
  const [voiceListening, setVoiceListening] = useState(false);
  // ── Responsive breakpoint (req 7) ──
  const isMobile = useMediaQuery("(max-width: 768px)");
  // ── Onboarding + welcome ──
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState(0);
  // ── Accessibility ──
  const [textScale, setTextScaleState] = useState(1.0);
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [contrastMode, setContrastModeState] = useState(false);
  // ── User mode (Beginner / Expert / Educational) ──
  const [userMode, setUserModeState] = useState<"beginner" | "expert" | "educational">("expert");
  // ── What's New panel ──
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  // ── Contextual hints ──
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());
  const aiAbortRef     = useRef<AbortController | null>(null);
  const aiScrollRef    = useRef<HTMLDivElement>(null);
  const fileAiAbortRef = useRef<AbortController | null>(null);
  const fileAiScrollRef= useRef<HTMLDivElement>(null);

  const [projSearch, setProjSearch] = useState("");

  const activeProject = projects.find(p => p.id === activeProjectId) ?? null;
  const visibleProjects = projects.filter(p => {
    const matchesArchive = showArchived ? p.status === "archived" : (p.status ?? "active") === "active";
    const matchesSearch = projSearch.trim() === "" || p.name.toLowerCase().includes(projSearch.toLowerCase());
    return matchesArchive && matchesSearch;
  });

  // ── Onboarding + accessibility hydration ──
  useEffect(() => {
    const seen = localStorage.getItem("cai_welcome_seen");
    if (!seen) setShowWelcomeOverlay(true);
    const scale = parseFloat(localStorage.getItem("cai_text_scale") ?? "1.0");
    if (!isNaN(scale)) setTextScaleState(scale);
    const rm = localStorage.getItem("cai_reduced_motion");
    if (rm === "true") setReducedMotionState(true);
    const cm = localStorage.getItem("cai_contrast_mode");
    if (cm === "true") setContrastModeState(true);
    const mode = localStorage.getItem("cai_user_mode") as "beginner" | "expert" | "educational" | null;
    if (mode) setUserModeState(mode);
    const hints = localStorage.getItem("cai_dismissed_hints");
    if (hints) {
      try { setDismissedHints(new Set(JSON.parse(hints))); } catch {}
    }
  }, []);

  const setTextScale = (v: number) => {
    setTextScaleState(v);
    localStorage.setItem("cai_text_scale", String(v));
  };
  const setReducedMotion = (v: boolean) => {
    setReducedMotionState(v);
    localStorage.setItem("cai_reduced_motion", String(v));
  };
  const setContrastMode = (v: boolean) => {
    setContrastModeState(v);
    localStorage.setItem("cai_contrast_mode", String(v));
  };
  const setUserMode = (m: "beginner" | "expert" | "educational") => {
    setUserModeState(m);
    localStorage.setItem("cai_user_mode", m);
  };
  const dismissHint = (key: string) => {
    setDismissedHints(prev => {
      const next = new Set(prev);
      next.add(key);
      localStorage.setItem("cai_dismissed_hints", JSON.stringify([...next]));
      return next;
    });
  };
  const dismissWelcome = () => {
    setShowWelcomeOverlay(false);
    localStorage.setItem("cai_welcome_seen", "1");
  };

  // Load projects from API on mount
  useEffect(() => {
    apiListProjects().then(list => {
      setProjects(list);
      setLoadingProjects(false);
    });
  }, []);

  // Auto-scroll project AI
  useEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
  }, [aiMessages]);

  // Reset file-level AI when a different file is opened
  useEffect(() => {
    if (viewingFile) {
      setFileAiMessages([]);
      setFileAiInput("");
      setFileAiLoading(false);
      fileAiAbortRef.current?.abort();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingFile?.id]);

  // Auto-scroll file AI
  useEffect(() => {
    if (fileAiScrollRef.current) fileAiScrollRef.current.scrollTop = fileAiScrollRef.current.scrollHeight;
  }, [fileAiMessages]);

  // Seed shared intelligence layer when active project changes
  useEffect(() => {
    if (activeProject) {
      contextStore.setSessionContext({
        projectId:   activeProject.id,
        projectName: activeProject.name,
      });
    }
  }, [activeProject]);

  // Load shared projects on mount
  useEffect(() => {
    setSharedLoading(true);
    apiListSharedProjects().then(list => {
      setSharedProjects(list);
      setSharedLoading(false);
    });
  }, []);

  // Adopt a suggested template → create real project
  const adoptSuggested = useCallback(async (template: SuggestedTemplate) => {
    if (adoptingId) return;
    setAdoptingId(template.id);
    const proj = await apiCreateProject(template.name, template.industry);
    if (proj) {
      setProjects(prev => [proj, ...prev]);
      setActiveProjectId(proj.id);
      setAdoptedIds(prev => [...prev, template.id]);
    }
    setAdoptingId(null);
  }, [adoptingId]);

  // Adopt opportunity → create a project from it
  const adoptOpportunity = useCallback(async (op: OpportunityItem) => {
    if (adoptingOpId) return;
    setAdoptingOpId(op.id);
    const proj = await apiCreateProject(op.title, "General");
    if (proj) {
      setProjects(prev => [proj, ...prev]);
      setActiveProjectId(proj.id);
      setAdoptedOpIds(prev => [...prev, op.id]);
      setViewMode("dashboard+folders");
    }
    setAdoptingOpId(null);
  }, [adoptingOpId]);

  // ── Load members when Team tab is active ────────────────────────────────
  useEffect(() => {
    if (viewMode !== "team" || !activeProjectId) return;
    setMembersLoading(true);
    setMemberError("");
    fetch(`/api/projects/${activeProjectId}/members`, { credentials: "include" })
      .then(r => r.json())
      .then((data: { members?: ProjectMember[]; error?: string }) => {
        if (data.members) setMembers(data.members);
        else setMemberError(data.error ?? "Failed to load members");
      })
      .catch(() => setMemberError("Network error"))
      .finally(() => setMembersLoading(false));
  }, [viewMode, activeProjectId]);

  const handleAddMember = useCallback(async () => {
    if (!addMemberId.trim() || !activeProjectId) return;
    setAddingMember(true); setMemberError("");
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/members`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: addMemberId.trim(), role: addMemberRole }),
      });
      const data = await res.json() as { member?: ProjectMember; error?: string };
      if (data.member) { setMembers(prev => [...prev, data.member!]); setAddMemberId(""); }
      else setMemberError(data.error ?? "Failed to add member");
    } catch { setMemberError("Network error"); }
    finally { setAddingMember(false); }
  }, [addMemberId, addMemberRole, activeProjectId]);

  const handleUpdateMemberRole = useCallback(async (memberId: string, role: "owner" | "editor" | "viewer") => {
    if (!activeProjectId) return;
    await fetch(`/api/projects/${activeProjectId}/members/${memberId}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setMembers(prev => prev.map(m => m.userId === memberId ? { ...m, role } : m));
  }, [activeProjectId]);

  const handleRemoveMember = useCallback(async (memberId: string) => {
    if (!activeProjectId) return;
    await fetch(`/api/projects/${activeProjectId}/members/${memberId}`, {
      method: "DELETE", credentials: "include",
    });
    setMembers(prev => prev.filter(m => m.userId !== memberId));
  }, [activeProjectId]);

  // ── Voice input (req 6 — optional) ─────────────────────────────────────────
  const startVoiceInput = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = String(e.results[0][0].transcript ?? "");
      setAiInput(prev => prev ? prev + " " + transcript : transcript);
    };
    recognition.onend = () => setVoiceListening(false);
    recognition.onerror = () => setVoiceListening(false);
    setVoiceListening(true);
    recognition.start();
  }, []);

  // ── Publish pipeline (req 13 + 14) ─────────────────────────────────────────
  const openPublishModal = useCallback(() => {
    setPublishStep("review");
    setPublishBillingOk(false);
    setPublishDoneUrl(null);
    setShowPublishModal(true);
  }, []);

  const runBillingCheck = useCallback(async () => {
    if (!activeProject) return;
    setPublishLoading(true);
    setPublishStep("billing");
    const result = await checkBillingEligibility(activeProject.id);
    setPublishBillingOk(result.eligible);
    setPublishStep(result.eligible ? "confirm" : "billing");
    setPublishLoading(false);
  }, [activeProject]);

  const confirmPublish = useCallback(async () => {
    if (!activeProject) return;
    setPublishLoading(true);
    const result = await apiPublishProject(activeProject.id);
    if (result.ok) {
      setPublishedProjectIds(prev => new Set([...prev, activeProject.id]));
      setPublishDoneUrl(result.publishUrl ?? null);
      setPublishStep("done");
    }
    setPublishLoading(false);
  }, [activeProject]);

  const handleUnpublish = useCallback(async () => {
    if (!activeProject) return;
    await apiUnpublishProject(activeProject.id);
    setPublishedProjectIds(prev => { const n = new Set(prev); n.delete(activeProject.id); return n; });
    setPublishDoneUrl(null);
    setShowPublishModal(false);
  }, [activeProject]);

  const scaffoldProject = useCallback(async (
    projectId: string,
    folders: ProjectFolder[],
    industryType: string,
  ) => {
    const files = PROJECT_SCAFFOLD_MAP[industryType];
    if (!files || files.length === 0) return;
    const total = files.length;
    for (let i = 0; i < files.length; i++) {
      const sf = files[i];
      setScaffoldStatus({ current: i + 1, total, label: sf.name });
      const folder = folders.find(f => f.name === sf.folder);
      const folderId = folder?.id ?? "";
      try {
        const created = await apiAddFile(projectId, sf.name, sf.type, folderId, sf.content);
        if (created) {
          setProjects(prev => prev.map(p =>
            p.id === projectId ? { ...p, files: [...p.files, created] } : p,
          ));
        }
      } catch {}
      // pe-001: Yield to main thread every 2 files — keeps progress bar smooth,
      // eliminates perceived freeze during large scaffolds (8–12 files).
      if ((i + 1) % 2 === 0) await new Promise<void>(r => setTimeout(r, 0));
    }
    setScaffoldStatus(null);
  }, []);

  const resetModal = useCallback(() => {
    setShowNewProject(false);
    setNewProjName("");
    setNewProjStep(1);
    setNewProjIndustry("General");
    setNewProjIntent({ audience: "", purpose: "", tone: "professional", constraints: "" });
  }, []);

  // ── Genome: fetch + generate (declared before createProject to avoid forward reference) ──
  const fetchGenome = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/project-documents/${projectId}/genome`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { genome: GenomeData | null };
        setGenome(data.genome ?? null);
      }
    } catch { /* best-effort */ }
  }, []);

  const generateGenome = useCallback(async (
    projectId: string,
    intent?: { audience: string; purpose: string; tone: string; constraints: string },
  ) => {
    setGenomeLoading(true);
    try {
      const res = await fetch(`/api/project-documents/${projectId}/genome`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ intent }),
      });
      if (res.ok) {
        const data = await res.json() as { genome: GenomeData };
        setGenome(data.genome ?? null);
      }
    } catch { /* best-effort */ }
    setGenomeLoading(false);
  }, []);

  // ── startInstantEdit — SSE-stream AI-improved content into the active file ──
  const startInstantEdit = useCallback(async (
    mode: "improve" | "rewrite" | "expand" | "summarize" | "proof",
  ) => {
    if (!activeProject || !viewingFile || instantEditLoading) return;
    setShowInstantEditMenu(false);
    setInstantEditLoading(true);
    setInstantEditMode(mode);
    instantEditAbortRef.current?.abort();
    const ctrl = new AbortController();
    instantEditAbortRef.current = ctrl;
    let newContent = "";
    try {
      const res = await fetch(
        `/api/project-documents/${activeProject.id}/instant-edit/${viewingFile.id}`,
        {
          method:      "POST",
          credentials: "include",
          headers:     { "Content-Type": "application/json" },
          body:        JSON.stringify({ mode }),
          signal:      ctrl.signal,
        },
      );
      if (!res.ok || !res.body) throw new Error("stream failed");
      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(part.slice(6)) as Record<string, unknown>;
            if (evt.type === "chunk") {
              newContent += evt.content as string;
              setFileContentText(newContent);
            } else if (evt.type === "done") {
              // DB already saved by backend; update local project file cache
              setProjects(prev => prev.map(p =>
                p.id !== activeProject.id ? p : {
                  ...p,
                  files: p.files.map(f =>
                    f.id === viewingFile.id ? { ...f, content: newContent } : f,
                  ),
                },
              ));
              setFileContentSaved(true);
              setTimeout(() => setFileContentSaved(false), 3000);
            }
          } catch { /* skip */ }
        }
      }
    } catch (e: unknown) {
      if ((e as Error)?.name !== "AbortError") {
        console.error("[instant-edit] stream error", e);
      }
    }
    setInstantEditLoading(false);
    setInstantEditMode(null);
  }, [activeProject, viewingFile, instantEditLoading]);

  // ── fetchPortfolioIntel — load cross-project AI intelligence ─────────────
  const fetchPortfolioIntel = useCallback(async () => {
    if (portfolioIntelLoading) return;
    setPortfolioIntelLoading(true);
    setPortfolioIntel(null);
    try {
      const res = await fetch("/api/projects/portfolio-intelligence", { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as typeof portfolioIntel;
        setPortfolioIntel(data);
      }
    } catch { /* best-effort */ }
    setPortfolioIntelLoading(false);
  }, [portfolioIntelLoading]);

  // ── createProjectDirect — create + scaffold + genome from explicit params ────
  //    Used by "Create X" natural language flow (no modal required)
  const createProjectDirect = useCallback(async (
    name:     string,
    industry: string,
    intent?:  { audience: string; purpose: string; tone: string; constraints?: string },
  ) => {
    const proj = await apiCreateProject(name.trim(), industry);
    if (!proj) return null;
    setProjects(prev => [...prev, proj]);
    setActiveProjectId(proj.id);
    setActiveFolderId(null);
    setShowAI(true);
    setAiMessages([]);
    _setViewMode("dashboard+folders");
    setNewlyCreatedId(proj.id);
    ensureIdentityForProject({ id: proj.id, name: proj.name });
    await scaffoldProject(proj.id, proj.folders, industry);
    const fullIntent = intent ? { audience: intent.audience, purpose: intent.purpose, tone: intent.tone, constraints: intent.constraints ?? "" } : undefined;
    generateGenome(proj.id, fullIntent).catch(() => {/* best-effort */});
    setTimeout(() => setNewlyCreatedId(null), 4000);
    return proj;
  }, [scaffoldProject, generateGenome]);

  // ── parseAndCreate — Live Build Mode ──────────────────────────────────────
  const parseAndCreate = useCallback(async (prompt: string) => {
    if (!prompt.trim() || createXLoading) return;
    setCreateXLoading(true);
    setCreateXInput("");

    // 1. Open the Live Build overlay immediately
    setLiveBuild({
      phase: "parsing",
      projectId: null,
      projectName: null,
      industry: null,
      thinking: [THINKING_LINES[0]!],
      scaffoldProgress: null,
    });

    // Rotate thinking lines throughout the build
    let thinkingIdx = 1;
    const thinkingInterval = setInterval(() => {
      setLiveBuild(prev => prev ? {
        ...prev,
        thinking: [...prev.thinking, THINKING_LINES[thinkingIdx++ % THINKING_LINES.length]!],
      } : prev);
    }, 1800);

    try {
      // 2. Parse intent
      const res = await fetch("/api/projects/parse-intent", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("parse failed");
      const parsed = await res.json() as {
        name: string; industry: string;
        intent: { purpose: string; audience: string; tone: string };
      };

      setLiveBuild(prev => prev ? {
        ...prev, phase: "creating",
        projectName: parsed.name, industry: parsed.industry,
      } : prev);

      // 3. Create the project record
      const proj = await apiCreateProject(parsed.name.trim(), parsed.industry);
      if (!proj) throw new Error("create failed");
      setProjects(prev => [...prev, proj]);
      setNewlyCreatedId(proj.id);
      ensureIdentityForProject({ id: proj.id, name: proj.name });

      setLiveBuild(prev => prev ? {
        ...prev, phase: "scaffolding", projectId: proj.id,
        scaffoldProgress: { current: 0, total: PROJECT_SCAFFOLD_MAP[parsed.industry]?.length ?? 8 },
      } : prev);

      // 4. Scaffold documents (intercepting scaffoldStatus updates)
      await scaffoldProject(proj.id, proj.folders, parsed.industry);

      setLiveBuild(prev => prev ? { ...prev, phase: "genome" } : prev);

      // 5. Generate genome in background
      const intent = { ...parsed.intent, constraints: "" };
      generateGenome(proj.id, intent).catch(() => {/* best-effort */});

      await new Promise(r => setTimeout(r, 600));

      setLiveBuild(prev => prev ? { ...prev, phase: "complete" } : prev);
      setTimeout(() => setNewlyCreatedId(null), 4000);

    } catch {
      setLiveBuild(null);
    }

    clearInterval(thinkingInterval);
    setCreateXLoading(false);
  }, [createXLoading, scaffoldProject, generateGenome]);

  const createProject = useCallback(async () => {
    if (!newProjName.trim()) return;
    const capturedIntent = { ...newProjIntent };
    const proj = await apiCreateProject(newProjName.trim(), newProjIndustry);
    if (proj) {
      setProjects(prev => [...prev, proj]);
      setActiveProjectId(proj.id);
      setActiveFolderId(null);
      resetModal();
      // Open the AI agent panel automatically so the workspace feels complete
      setShowAI(true);
      setAiMessages([]);
      // Switch to the files+folders view so scaffold files are visible as they appear
      _setViewMode("dashboard+folders");
      // Mark as newly created so workspace shows the scaffold launch UX
      setNewlyCreatedId(proj.id);
      // Auto-generate internal identity package for new project
      ensureIdentityForProject({ id: proj.id, name: proj.name });
      // Scaffold all industry-standard files — workspace populates in real time
      await scaffoldProject(proj.id, proj.folders, newProjIndustry);
      // Auto-generate Project Genome in background (fire-and-forget)
      const hasIntent = capturedIntent.audience || capturedIntent.purpose;
      generateGenome(proj.id, hasIntent ? capturedIntent : undefined).catch(() => {/* best-effort */});
      // Keep newlyCreatedId for a moment so the "workspace ready" message shows
      setTimeout(() => setNewlyCreatedId(null), 4000);
    } else {
      resetModal();
    }
  }, [newProjName, newProjIndustry, newProjIntent, scaffoldProject, generateGenome, resetModal]);

  // ── Global Rewrite Engine ─────────────────────────────────────────────────
  const globalRewriteEngine = useCallback(async (instruction: string) => {
    if (!activeProject || !instruction.trim() || globalRewriteLoading) return;
    const files = activeProject.files;
    if (!files.length) return;

    // H-04: Cancel any prior rewrite and create a fresh controller for this run
    globalRewriteAbortRef.current?.abort();
    const ctrl = new AbortController();
    globalRewriteAbortRef.current = ctrl;

    setGlobalRewriteLoading(true);
    setGlobalRewriteProgress({ current: 0, total: files.length });

    let completed = 0;
    // Process files in parallel batches of 3
    const BATCH = 3;
    for (let i = 0; i < files.length; i += BATCH) {
      if (ctrl.signal.aborted) break;
      const batch = files.slice(i, i + BATCH);
      await Promise.all(batch.map(async (file) => {
        if (ctrl.signal.aborted) return;
        try {
          const res = await fetch(
            `/api/project-documents/${activeProject.id}/instant-edit/${file.id}`,
            {
              method: "POST", credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mode: "rewrite", instruction }),
              signal: ctrl.signal,
            }
          );
          if (res.ok && res.body) {
            const reader = res.body.getReader();
            const dec = new TextDecoder();
            let accumulated = "";
            while (true) {
              if (ctrl.signal.aborted) { reader.cancel(); break; }
              const { done, value } = await reader.read();
              if (done) break;
              const text = dec.decode(value, { stream: true });
              for (const line of text.split("\n")) {
                if (line.startsWith("data: ")) {
                  try {
                    const d = JSON.parse(line.slice(6));
                    if (d.chunk) accumulated += d.chunk;
                    if (d.done && accumulated) {
                      setProjects(prev => prev.map(p =>
                        p.id !== activeProject.id ? p : {
                          ...p,
                          files: p.files.map(f =>
                            f.id !== file.id ? f : { ...f, content: accumulated }
                          ),
                        }
                      ));
                    }
                  } catch { /* skip */ }
                }
              }
            }
          }
        } catch (err: unknown) {
          // DOMException name "AbortError" is expected when the user cancels
          if ((err as { name?: string })?.name !== "AbortError") { /* best-effort */ }
        }
        completed++;
        setGlobalRewriteProgress({ current: completed, total: files.length });
      }));
    }

    if (!ctrl.signal.aborted) {
      setGlobalRewriteLoading(false);
      setGlobalRewriteProgress(null);
      setShowGlobalRewrite(false);
      setGlobalRewriteInstruction("");
    }
  }, [activeProject, globalRewriteLoading]);


  // ── Lifecycle: fetch document completion scores ───────────────────────────
  const fetchLifecycle = useCallback(async (projectId: string) => {
    setLifecycleLoading(true);
    try {
      const res = await fetch(`/api/project-documents/${projectId}/lifecycle`, { credentials: "include" });
      if (res.ok) setLifecycle(await res.json() as LifecycleData);
    } catch { /* best-effort */ }
    setLifecycleLoading(false);
  }, []);

  // ── Generate All: stream AI content for all empty files ──────────────────
  const startGenerateAll = useCallback(async (projectId: string, fileIds?: string[]) => {
    genAbortRef.current?.abort();
    const ctrl = new AbortController();
    genAbortRef.current = ctrl;
    setGenStatus({ running: true, current: "Starting…", completed: 0, total: 0, done: false });
    try {
      const res = await fetch(`/api/project-documents/${projectId}/generate-all`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ fileIds }),
        signal:      ctrl.signal,
      });
      if (!res.ok || !res.body) {
        setGenStatus(null);
        return;
      }
      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(part.slice(6)) as Record<string, unknown>;
            if (evt.type === "start") {
              setGenStatus(s => s ? { ...s, total: evt.totalFiles as number } : s);
            } else if (evt.type === "file_start") {
              setGenStatus(s => s ? {
                ...s,
                current:   evt.fileName as string,
                completed: (evt.index as number) - 1,
                total:     evt.total as number,
              } : s);
            } else if (evt.type === "file_done") {
              setGenStatus(s => s ? { ...s, completed: s.completed + 1 } : s);
              // Reload project files so the UI reflects generated content
              setProjects(prev => prev.map(p => {
                if (p.id !== projectId) return p;
                return {
                  ...p,
                  files: p.files.map(f =>
                    f.id === String(evt.fileId) ? { ...f, content: "[generated]" } : f,
                  ),
                };
              }));
            } else if (evt.type === "complete") {
              setGenStatus(s => s ? { ...s, running: false, done: true, current: `${evt.generated as number} documents generated` } : s);
              // Refresh lifecycle score after generation
              await fetchLifecycle(projectId);
              // Reload full project data so files show updated content
              const updated = await fetch(`/api/projects/${projectId}`, { credentials: "include" });
              if (updated.ok) {
                const data = await updated.json() as { project: Project };
                if (data.project) setProjects(prev => prev.map(p => p.id === projectId ? data.project : p));
              }
              setTimeout(() => setGenStatus(null), 4000);
            }
          } catch { /* parse error — skip event */ }
        }
      }
    } catch (e: unknown) {
      if ((e as Error)?.name !== "AbortError") {
        setGenStatus(s => s ? { ...s, running: false, done: false } : null);
      }
    }
  }, [fetchLifecycle]);

  // Fetch lifecycle score + genome whenever the active project changes
  useEffect(() => {
    if (!activeProjectId) { setLifecycle(null); setGenome(null); return; }
    fetchLifecycle(activeProjectId);
    fetchGenome(activeProjectId);
  }, [activeProjectId, fetchLifecycle, fetchGenome]);

  const deleteProject = useCallback(async (id: string) => {
    await apiDeleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  }, [activeProjectId]);

  const archiveProject = useCallback(async (id: string) => {
    const ok = await apiSetProjectStatus(id, "archived");
    if (ok) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status: "archived" } : p));
      if (activeProjectId === id) setActiveProjectId(null);
    }
  }, [activeProjectId]);

  const restoreProject = useCallback(async (id: string) => {
    const ok = await apiSetProjectStatus(id, "active");
    if (ok) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status: "active" } : p));
    }
  }, []);

  const addFile = useCallback(async () => {
    if (!activeProject || !newFileName.trim()) return;
    const file = await apiAddFile(activeProject.id, newFileName.trim(), newFileType, activeFolderId ?? "");
    if (file) {
      setProjects(prev => prev.map(p =>
        p.id === activeProject.id ? { ...p, files: [...p.files, file] } : p
      ));
    }
    setShowAddFile(false);
    setNewFileName("");
    setNewFileType("Document");
  }, [activeProject, newFileName, newFileType, activeFolderId]);

  const deleteFile = useCallback(async (fileId: string) => {
    if (!activeProject) return;
    await apiDeleteFile(activeProject.id, fileId);
    setProjects(prev => prev.map(p =>
      p.id === activeProject.id ? { ...p, files: p.files.filter(f => f.id !== fileId) } : p
    ));
  }, [activeProject]);

  const openFileViewer = useCallback(async (file: ProjectFile) => {
    setViewingFile(file);
    setFileContentEditing(false);
    setFileContentSaved(false);
    if (file.content) {
      setFileContentText(file.content);
    } else {
      setFileContentLoading(true);
      const content = await apiLoadFileContent(file.id);
      setFileContentText(content);
      setFileContentLoading(false);
    }
  }, []);

  const saveFileContent = useCallback(async () => {
    if (!activeProject || !viewingFile) return;
    setFileContentSaving(true);
    const ok = await apiSaveFileContent(activeProject.id, viewingFile.id, fileContentText);
    setFileContentSaving(false);
    if (ok) {
      setFileContentSaved(true);
      setFileContentEditing(false);
      setProjects(prev => prev.map(p =>
        p.id === activeProject.id
          ? { ...p, files: p.files.map(f => f.id === viewingFile.id ? { ...f, content: fileContentText } : f) }
          : p
      ));
      setTimeout(() => setFileContentSaved(false), 2000);
    }
  }, [activeProject, viewingFile, fileContentText]);

  const renameProject = useCallback(async () => {
    if (!activeProject || !editProjectNameVal.trim()) return;
    const ok = await apiUpdateProject(activeProject.id, { name: editProjectNameVal.trim() });
    if (ok) {
      setProjects(prev => prev.map(p =>
        p.id === activeProject.id ? { ...p, name: editProjectNameVal.trim() } : p
      ));
    }
    setEditingProjectName(false);
  }, [activeProject, editProjectNameVal]);

  const addSubApp = useCallback(() => {
    if (!activeProject || !newSubAppName.trim()) return;
    const sa: SubApp = {
      id: `sa_${Date.now()}`,
      name: newSubAppName.trim(),
      icon: newSubAppIcon,
      description: "Custom sub-app",
    };
    setProjects(prev => prev.map(p =>
      p.id === activeProject.id ? { ...p, subApps: [...p.subApps, sa] } : p
    ));
    setShowAddSubApp(false);
    setNewSubAppName("");
    setNewSubAppIcon("📱");
  }, [activeProject, newSubAppName, newSubAppIcon]);

  const deleteSubApp = useCallback((saId: string) => {
    if (!activeProject) return;
    setProjects(prev => prev.map(p =>
      p.id === activeProject.id ? { ...p, subApps: p.subApps.filter(sa => sa.id !== saId) } : p
    ));
  }, [activeProject]);

  const sendAI = useCallback(async () => {
    if (!aiInput.trim() || aiLoading || !activeProject) return;
    const msg = aiInput.trim();
    setAiInput("");
    const newHistory = [...aiMessages, { role: "user" as const, text: msg }];
    setAiMessages([...newHistory, { role: "ai", text: "" }]);
    setAiLoading(true);
    aiAbortRef.current?.abort();
    const ctrl = new AbortController();
    aiAbortRef.current = ctrl;
    let reply = "";
    try {
      await streamProjectChat({
        projectId:     activeProject.id,
        message:       msg,
        history:       newHistory.slice(0, -1).map(m => ({
          role:    m.role === "user" ? "user" as const : "assistant" as const,
          content: m.text,
        })),
        scaffoldFiles: activeProject.files.map(f => f.name),
        projectType:   activeProject.industry,
        signal:        ctrl.signal,
        onChunk: chunk => {
          reply += chunk;
          setAiMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "ai", text: reply };
            return updated;
          });
        },
      });
    } catch {}
    setAiLoading(false);
  }, [aiInput, aiLoading, activeProject, aiMessages]);

  const sendFileAI = useCallback(async (overrideMsg?: string) => {
    if (!activeProject || !viewingFile) return;
    const msg = (overrideMsg ?? fileAiInput).trim();
    if (!msg || fileAiLoading) return;
    setFileAiInput("");
    // Prepend file context so the agent focuses on this specific file
    const prefix = fileContentText
      ? `[File: ${viewingFile.name}]\n${fileContentText.slice(0, 1400)}\n\n`
      : `[File: ${viewingFile.name}]\n\n`;
    const fullMsg = prefix + msg;
    const newHistory = [...fileAiMessages, { role: "user" as const, text: msg }];
    setFileAiMessages([...newHistory, { role: "ai" as const, text: "" }]);
    setFileAiLoading(true);
    fileAiAbortRef.current?.abort();
    const ctrl = new AbortController();
    fileAiAbortRef.current = ctrl;
    let reply = "";
    try {
      await streamProjectChat({
        projectId:     activeProject.id,
        message:       fullMsg,
        history:       newHistory.slice(0, -1).map(m => ({
          role:    m.role === "user" ? "user" as const : "assistant" as const,
          content: m.text,
        })),
        scaffoldFiles: activeProject.files.map(f => f.name),
        projectType:   activeProject.industry,
        signal:        ctrl.signal,
        onChunk: chunk => {
          reply += chunk;
          setFileAiMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "ai", text: reply };
            return updated;
          });
        },
      });
    } catch { /* abort or network error — safe to ignore */ }
    setFileAiLoading(false);
  }, [fileAiInput, fileAiLoading, activeProject, viewingFile, fileAiMessages, fileContentText]);

  const openAIPanel = useCallback(async () => {
    setShowAI(true);
    if (activeProject && aiMessages.length === 0) {
      const history = await apiLoadChatHistory(activeProject.id);
      if (history.length > 0) setAiMessages(history);
    }
  }, [activeProject, aiMessages.length]);

  const handleDashboardAction = (actionId: string) => {
    switch (actionId) {
      case "ai":       openAIPanel(); break;
      case "addfile":  setShowAddFile(true); break;
      case "addsubapp":setShowAddSubApp(true); break;
      case "search":   setShowSearch(true); break;
      case "modes":    setShowModes(true); break;
      case "apps":     setActiveFolderId("apps"); break;
      case "marketing":setActiveFolderId("marketing"); break;
      case "company":  setActiveFolderId("company"); break;
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "project") deleteProject(deleteTarget.id);
    if (deleteTarget.type === "file") deleteFile(deleteTarget.id);
    if (deleteTarget.type === "subapp") deleteSubApp(deleteTarget.id);
    setDeleteTarget(null);
  };

  const VIEW_MODES: { id: ViewMode; label: string; group?: string }[] = [
    { id: "output",            label: "⚡ Output" },
    { id: "dashboard+folders", label: "Dashboard + Folders" },
    { id: "dashboard",         label: "Dashboard" },
    { id: "folders",           label: "Folders" },
    { id: "simple",            label: "Simple" },
    { id: "advanced",          label: "Advanced" },
    { id: "tasks",             label: "📋 Tasks" },
    { id: "team",              label: "👥 Team" },
    { id: "opportunities",     label: "💡 Opportunities" },
    { id: "portfolio",         label: "🧠 Portfolio Intelligence" },
    { id: "pipeline",          label: "🔄 Pipeline",     group: "power" },
    { id: "sales",             label: "📈 Sales",        group: "teams" },
    { id: "ops",               label: "⚙️ Ops",          group: "teams" },
    { id: "support",           label: "🎧 Support",      group: "teams" },
    { id: "compliance",        label: "📋 Compliance",   group: "teams" },
    { id: "strategy",          label: "🎯 Strategy",     group: "teams" },
    { id: "ux",                label: "✨ UX/Content",   group: "teams" },
    { id: "enterprise",        label: "🏢 Enterprise",   group: "teams" },
    { id: "marketing",         label: "📣 Marketing",    group: "teams" },
    { id: "product",           label: "📦 Product",      group: "teams" },
    { id: "hr",                label: "🤝 People/HR",    group: "teams" },
    { id: "finance",           label: "💰 Finance",      group: "teams" },
    { id: "observability",     label: "📡 System",       group: "power" },
  ];

  const activeFiles = activeFolderId
    ? (activeProject?.files ?? []).filter(f => f.folderId === activeFolderId)
    : (activeProject?.files ?? []);

  const MODE_COLORS: Record<string, string> = { Demo: "#8b5cf6", Test: "#f59e0b", Live: "#10b981" };

  return (
    <div
      className="relative flex h-full max-w-full overflow-hidden"
      style={{
        background: "#f8fafc",
        color: "#1e293b",
        fontSize: `${textScale * 100}%`,
      }}
    >
      {/* ── Mobile sidebar backdrop ──────────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Left Sidebar: Project List ────────────────────────────────────── */}
      <div
        className={`flex-shrink-0 flex flex-col overflow-hidden transition-all duration-200
          ${mobileSidebarOpen
            ? "fixed inset-y-0 left-0 z-50 w-64 sm:relative sm:w-56 sm:z-auto"
            : "hidden sm:flex sm:w-56"
          }`}
        style={{ borderRight: "1px solid rgba(99,102,241,0.12)", background: "#ffffff" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div>
            <div className="text-[13px] font-bold" style={{ color: "#1e293b" }}>ProjectOS</div>
            <div className="text-[9px]" style={{ color: "#94a3b8" }}>Universal Platform</div>
          </div>
          <button
            onClick={() => setShowSearch(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px]"
            style={{ background: "rgba(99,102,241,0.14)", color: "#818cf8" }}
            title="Search all"
          >🔍</button>
        </div>

        {/* Active / Archived toggle */}
        <div className="flex mx-3 mb-1 mt-1 rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={() => setShowArchived(false)}
            className="flex-1 py-1.5 text-[10px] font-semibold transition-all"
            style={!showArchived ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc" } : { background: "transparent", color: "#475569" }}
          >Active</button>
          <button
            onClick={() => setShowArchived(true)}
            className="flex-1 py-1.5 text-[10px] font-semibold transition-all"
            style={showArchived ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc" } : { background: "transparent", color: "#475569" }}
          >Archived</button>
        </div>

        {/* Sidebar search */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-[10px]" style={{ color: "#475569" }}>🔍</span>
            <input
              type="text"
              placeholder="Filter projects…"
              value={projSearch}
              onChange={e => setProjSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[11px] placeholder-[#334155]"
              style={{ color: "#e2e8f0" }}
            />
            {projSearch && (
              <button onClick={() => setProjSearch("")} className="text-[9px]" style={{ color: "#475569" }}>✕</button>
            )}
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto py-2">
          {loadingProjects ? (
            <div className="px-4 py-6 text-center">
              <div className="text-2xl mb-2 animate-pulse">📂</div>
              <div className="text-[10px]" style={{ color: "#334155" }}>Loading projects…</div>
            </div>
          ) : visibleProjects.length === 0 && (
            <div className="px-4 py-6 text-center">
              <div className="text-2xl mb-2">{showArchived ? "🗂️" : "📂"}</div>
              <div className="text-[10px]" style={{ color: "#334155" }}>
                {showArchived ? "No archived projects" : "No projects yet"}
              </div>
            </div>
          )}
          {visibleProjects.map(proj => (
            <div
              key={proj.id}
              className="group flex items-center gap-2.5 px-3 py-2.5 mx-2 rounded-xl cursor-pointer transition-all mb-0.5"
              style={{
                background: activeProjectId === proj.id
                  ? `${proj.color}18`
                  : "transparent",
                border: `1px solid ${activeProjectId === proj.id ? `${proj.color}35` : "transparent"}`,
              }}
              role="button"
              tabIndex={0}
              aria-label={`Open project: ${proj.name}`}
              aria-current={activeProjectId === proj.id ? "page" : undefined}
              onClick={() => { if (!showArchived) { setActiveProjectId(proj.id); setActiveFolderId(null); } }}
              onKeyDown={e => { if ((e.key === "Enter" || e.key === " ") && !showArchived) { e.preventDefault(); setActiveProjectId(proj.id); setActiveFolderId(null); } }}
            >
              <span className="text-base flex-shrink-0" style={{ opacity: showArchived ? 0.5 : 1 }}>{proj.icon}</span>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[12px] font-medium truncate"
                  style={{ color: activeProjectId === proj.id ? proj.color : showArchived ? "#475569" : "#64748b" }}
                >
                  {proj.name}
                </div>
                <div className="text-[9px]" style={{ color: "#334155" }}>{proj.industry}</div>
              </div>
              {showArchived ? (
                <button
                  onClick={e => { e.stopPropagation(); restoreProject(proj.id); }}
                  className="opacity-0 group-hover:opacity-100 text-[9px] px-1.5 py-0.5 rounded font-semibold"
                  style={{ color: "#34d399", background: "rgba(52,211,153,0.12)" }}
                  title="Restore project"
                >↩</button>
              ) : (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={e => { e.stopPropagation(); archiveProject(proj.id); }}
                    className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                    style={{ color: "#f59e0b", background: "rgba(245,158,11,0.12)" }}
                    title="Archive project"
                  >📦</button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTarget({ type: "project", id: proj.id, label: proj.name }); }}
                    className="text-[10px] px-1 py-0.5 rounded"
                    style={{ color: "#f87171", background: "rgba(239,68,68,0.12)" }}
                    title="Delete project"
                  >✕</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* New Project Button */}
        {!showArchived && (
          <div className="px-3 pt-2 pb-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => setShowNewProject(true)}
              className="w-full py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.35)", color: "#818cf8" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.28)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.18)"; }}
            >
              <span>＋</span> New Project
            </button>
            {/* Accessibility + Help row */}
            <div className="flex items-center justify-between mt-2 px-0.5">
              <button
                onClick={() => setShowAccessibilityPanel(p => !p)}
                className="text-[9px] flex items-center gap-1 transition-all"
                style={{ color: "#334155" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
                title="Accessibility settings"
              >
                ♿ Accessibility
              </button>
              <button
                onClick={() => setShowWelcomeOverlay(true)}
                className="text-[9px] flex items-center gap-1 transition-all"
                style={{ color: "#334155" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
                title="Show quick tour"
              >
                ? Tour
              </button>
              <button
                onClick={() => setShowWhatsNew(true)}
                className="text-[9px] flex items-center gap-1 transition-all"
                style={{ color: "#334155" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
                title="What's new"
              >
                ✦ New
              </button>
            </div>
          </div>
        )}

        {/* ── Suggested Projects ─────────────────────────────────── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={() => setShowSuggested(p => !p)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#475569" }}>
              💡 Suggested
            </div>
            <span className="text-[10px]" style={{ color: "#334155" }}>{showSuggested ? "▲" : "▼"}</span>
          </button>
          {showSuggested && (
            <div className="px-2 pb-2 space-y-1">
              {SUGGESTED_TEMPLATES.map(t => {
                const adopted = adoptedIds.includes(t.id);
                return (
                  <div
                    key={t.id}
                    className="rounded-xl p-2.5"
                    style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{t.icon}</span>
                      <span className="text-[11px] font-medium truncate flex-1" style={{ color: "#0f172a" }}>{t.name}</span>
                    </div>
                    <p className="text-[9px] leading-relaxed mb-2" style={{ color: "#475569" }}>{t.description}</p>
                    <button
                      onClick={() => !adopted && adoptSuggested(t)}
                      disabled={adoptingId === t.id || adopted}
                      className="w-full py-1 rounded-lg text-[10px] font-semibold transition-all"
                      style={{
                        background: adopted ? "rgba(16,185,129,0.12)" : "rgba(99,102,241,0.18)",
                        border: `1px solid ${adopted ? "rgba(16,185,129,0.30)" : "rgba(99,102,241,0.35)"}`,
                        color: adopted ? "#34d399" : "#818cf8",
                      }}
                    >
                      {adoptingId === t.id ? "Adopting…" : adopted ? "✓ Added" : "Adopt"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Shared With Me ─────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={() => setShowShared(p => !p)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#475569" }}>
              👥 Shared With Me
              {sharedProjects.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold"
                  style={{ background: "rgba(99,102,241,0.20)", color: "#818cf8" }}>
                  {sharedProjects.length}
                </span>
              )}
            </div>
            <span className="text-[10px]" style={{ color: "#334155" }}>{showShared ? "▲" : "▼"}</span>
          </button>
          {showShared && (
            <div className="px-2 pb-2">
              {sharedLoading ? (
                <div className="text-center py-3 text-[10px]" style={{ color: "#334155" }}>Loading…</div>
              ) : sharedProjects.length === 0 ? (
                <div className="text-center py-3 text-[10px]" style={{ color: "#334155" }}>
                  No shared projects yet.<br />Projects shared with you appear here.
                </div>
              ) : (
                <div className="space-y-1">
                  {sharedProjects.map(sp => (
                    <div
                      key={sp.id}
                      className="flex items-center gap-2 px-2 py-2 rounded-xl"
                      style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}
                    >
                      <span className="text-sm">{sp.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium truncate" style={{ color: sp.color }}>{sp.name}</div>
                        <div className="text-[9px]" style={{ color: "#334155" }}>{sp.industry} · {sp.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Area ─────────────────────────────────────────────────────── */}
      {!activeProject ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ── Project Tiles Dashboard ── */}
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {/* Mobile hamburger — M-03: aria-label for screen readers */}
                <button
                  className="sm:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl"
                  style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}
                  aria-label={mobileSidebarOpen ? "Close navigation" : "Open navigation"}
                  aria-expanded={mobileSidebarOpen}
                  aria-controls="mobile-sidebar"
                  onClick={() => setMobileSidebarOpen(o => !o)}
                >
                  <span className="block w-4 h-0.5 rounded-full" style={{ background: "#6366f1" }} />
                  <span className="block w-4 h-0.5 rounded-full" style={{ background: "#6366f1" }} />
                  <span className="block w-4 h-0.5 rounded-full" style={{ background: "#6366f1" }} />
                </button>
                <div>
                  <div className="text-[18px] font-bold" style={{ color: "#0f172a" }}>Your Projects</div>
                  <div className="text-[12px] mt-0.5" style={{ color: "#475569" }}>
                    {projects.filter(p => p.status !== "archived").length > 0
                      ? `${projects.filter(p => p.status !== "archived").length} active workspace${projects.filter(p => p.status !== "archived").length === 1 ? "" : "s"}`
                      : "No projects yet — create your first one below"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowNewProject(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }}
              >
                ＋ New Project
              </button>
            </div>

            {projects.filter(p => p.status !== "archived").length === 0 ? (
              <div
                className="flex flex-col items-center justify-center rounded-2xl py-16 text-center px-6"
                style={{ border: "1px dashed rgba(99,102,241,0.20)", background: "rgba(99,102,241,0.03)" }}
              >
                <div className="text-5xl mb-4">✨</div>
                <div className="text-[17px] font-bold mb-1.5" style={{ color: "#0f172a" }}>What are you creating?</div>
                <div className="text-[12px] mb-6 max-w-[360px]" style={{ color: "#64748b" }}>
                  Describe your idea — film, app, startup, game, book, album — and we'll build it in seconds.
                </div>

                {/* Natural language input */}
                <div className="w-full max-w-[520px] relative">
                  <input
                    value={createXInput}
                    onChange={e => setCreateXInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") parseAndCreate(createXInput); }}
                    disabled={createXLoading}
                    placeholder="e.g. A documentary about AI replacing artists…"
                    className="w-full text-[13px] px-4 py-3.5 pr-32 rounded-2xl outline-none"
                    style={{
                      background: "#ffffff",
                      border: "1px solid rgba(99,102,241,0.35)",
                      color: "#1e293b",
                      boxShadow: "0 2px 12px rgba(99,102,241,0.08)",
                    }}
                  />
                  <button
                    onClick={() => parseAndCreate(createXInput)}
                    disabled={createXLoading || !createXInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
                    style={{
                      background: createXInput.trim() && !createXLoading ? "#6366f1" : "#e2e8f0",
                      color: createXInput.trim() && !createXLoading ? "#ffffff" : "#94a3b8",
                      border: "none",
                    }}
                  >
                    {createXLoading ? "…" : "Create ✦"}
                  </button>
                </div>

                {/* Parsed result preview */}
                {createXParsed && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.20)" }}>
                    <span className="text-sm">{(INDUSTRY_ICONS as Record<string, string>)[createXParsed.industry] ?? "📁"}</span>
                    <span className="text-[12px] font-semibold" style={{ color: "#6366f1" }}>{createXParsed.name}</span>
                    <span className="text-[10px]" style={{ color: "#94a3b8" }}>· {createXParsed.industry}</span>
                    <span className="text-[10px] animate-pulse" style={{ color: "#6366f1" }}>Creating…</span>
                  </div>
                )}
                {createXLoading && !createXParsed && (
                  <div className="mt-3 text-[11px] animate-pulse" style={{ color: "#6366f1" }}>Understanding your idea…</div>
                )}

                {/* Manual fallback */}
                <button
                  onClick={() => setShowNewProject(true)}
                  className="mt-4 text-[11px]"
                  style={{ color: "#94a3b8", background: "none", border: "none" }}
                >
                  or pick a type manually →
                </button>
              </div>
            ) : (
              <>
              {/* ── Quick Create bar ── */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex-1 relative">
                  <input
                    value={createXInput}
                    onChange={e => setCreateXInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") parseAndCreate(createXInput); }}
                    disabled={createXLoading}
                    placeholder="Create anything… film, app, startup, game, book, album…"
                    className="w-full text-[12px] px-4 py-2.5 pr-[110px] rounded-xl outline-none"
                    style={{ background: "#ffffff", border: "1px solid rgba(99,102,241,0.28)", color: "#1e293b" }}
                  />
                  <button
                    onClick={() => parseAndCreate(createXInput)}
                    disabled={createXLoading || !createXInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                    style={{
                      background: createXInput.trim() && !createXLoading ? "#6366f1" : "#f1f5f9",
                      color: createXInput.trim() && !createXLoading ? "#ffffff" : "#94a3b8",
                      border: "none",
                    }}
                  >
                    {createXLoading ? "…" : "Create ✦"}
                  </button>
                </div>
              </div>
              {/* Parsed preview */}
              {createXParsed && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                  style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)" }}>
                  <span className="text-sm">{(INDUSTRY_ICONS as Record<string, string>)[createXParsed.industry] ?? "📁"}</span>
                  <span className="text-[12px] font-semibold" style={{ color: "#6366f1" }}>{createXParsed.name}</span>
                  <span className="text-[10px]" style={{ color: "#94a3b8" }}>· {createXParsed.industry}</span>
                  <span className="ml-auto text-[10px] animate-pulse" style={{ color: "#6366f1" }}>Creating…</span>
                </div>
              )}
              {createXLoading && !createXParsed && (
                <div className="text-[11px] animate-pulse mb-3" style={{ color: "#6366f1" }}>Understanding your idea…</div>
              )}

              {/* ── Project Health Overview ── */}
              {projects.filter(p => p.status !== "archived").length > 0 && (() => {
                const active = projects.filter(p => p.status !== "archived");
                const totalFiles = active.reduce((a, p) => a + p.files.length, 0);
                const withContent = active.reduce((a, p) => a + p.files.filter(f => (f.content ?? "").length > 80).length, 0);
                const pct = totalFiles > 0 ? Math.round((withContent / totalFiles) * 100) : 0;
                const healthColor = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#f87171";
                const healthLabel = pct >= 70 ? "Strong" : pct >= 40 ? "In Progress" : "Just Starting";
                return (
                  <div className="flex gap-3 mb-5">
                    {[
                      { label: "Projects", value: String(active.length), color: "#6366f1" },
                      { label: "Documents", value: String(totalFiles), color: "#8b5cf6" },
                      { label: "Content filled", value: `${pct}%`, color: healthColor },
                      { label: "Workspace health", value: healthLabel, color: healthColor },
                    ].map(m => (
                      <div key={m.label} className="flex-1 rounded-2xl px-3.5 py-3"
                        style={{ background: `${m.color}08`, border: `1px solid ${m.color}18` }}>
                        <p className="text-[18px] font-bold mb-0.5" style={{ color: m.color }}>{m.value}</p>
                        <p className="text-[10px]" style={{ color: "#475569" }}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div className="grid grid-cols-3 gap-4">
                {projects.filter(p => p.status !== "archived").map(p => {
                  const color = INDUSTRY_COLORS[p.industry] ?? "#6366f1";
                  return (
                    <button
                      key={p.id}
                      onClick={() => { setActiveProjectId(p.id); setShowAI(true); }}
                      className="flex flex-col text-left p-4 rounded-2xl transition-all group"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                        (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                        >
                          {p.icon}
                        </div>
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                        >
                          {p.industry}
                        </span>
                      </div>
                      <div className="text-[13px] font-semibold mb-1 truncate" style={{ color: "#0f172a" }}>{p.name}</div>
                      <div className="text-[10px] mb-3" style={{ color: "#475569" }}>
                        {p.files.length} {p.files.length === 1 ? "file" : "files"} · {p.created}
                      </div>
                      <div
                        className="text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color }}
                      >
                        Open workspace →
                      </div>
                    </button>
                  );
                })}
              </div>
              </>
            )}
          </div>
        </div>
      ) : viewingFile ? (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── Breadcrumb Header ── */}
          <div
            className="flex items-center gap-2.5 px-5 py-2.5 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#ffffff" }}
          >
            <button
              onClick={() => setViewingFile(null)}
              className="flex items-center gap-1.5 text-[11px] font-medium transition-colors flex-shrink-0"
              style={{ color: "#64748b" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#6366f1")}
              onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
            >
              ←&nbsp;{activeProject!.name}
            </button>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>/</span>
            <span className="text-[12px] font-semibold truncate flex-1" style={{ color: "#0f172a" }}>
              {viewingFile.type === "Document" ? "📄" : viewingFile.type === "Spreadsheet" ? "📊" : viewingFile.type === "Image" ? "🖼️" : viewingFile.type === "Video" ? "🎬" : viewingFile.type === "Audio" ? "🎵" : viewingFile.type === "Presentation" ? "🎯" : "📄"}&nbsp;{viewingFile.name}
            </span>
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(0,0,0,0.05)", color: "#64748b" }}>
              {viewingFile.type}
            </span>
            {fileContentSaved && (
              <span className="text-[11px] font-medium text-green-400 px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: "rgba(34,197,94,0.12)" }}>✓ Saved</span>
            )}
            {/* ── Instant-edit AI dropdown ── */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowInstantEditMenu(v => !v)}
                disabled={instantEditLoading}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 flex-shrink-0"
                style={{
                  background: instantEditLoading ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.18)",
                  border:     "1px solid rgba(99,102,241,0.30)",
                  color:      "#a5b4fc",
                }}
              >
                {instantEditLoading
                  ? <><div className="w-2.5 h-2.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />{instantEditMode ?? "Editing"}…</>
                  : "✦ AI Improve"}
              </button>
              {showInstantEditMenu && !instantEditLoading && (
                <div
                  className="absolute right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden"
                  style={{ background: "#1e1e2e", border: "1px solid rgba(99,102,241,0.25)", boxShadow: "0 8px 24px rgba(0,0,0,0.35)", minWidth: 160 }}
                >
                  {(["improve", "rewrite", "expand", "summarize", "proof"] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => startInstantEdit(m)}
                      className="w-full text-left px-4 py-2.5 text-[12px] font-medium hover:bg-indigo-500/15 transition-colors capitalize"
                      style={{ color: "#c7d2fe" }}
                    >
                      {m === "improve"   ? "✦ Improve"   :
                       m === "rewrite"   ? "↺ Rewrite"   :
                       m === "expand"    ? "↕ Expand"    :
                       m === "summarize" ? "⊟ Summarize" :
                                          "✓ Proofread"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!fileContentEditing ? (
              <button
                onClick={() => { setFileContentEditing(true); setFileContentSaved(false); setShowInstantEditMenu(false); }}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-xl flex-shrink-0"
                style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}
              >Edit</button>
            ) : (
              <button
                onClick={saveFileContent}
                disabled={fileContentSaving}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                {fileContentSaving
                  ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                  : "Save"}
              </button>
            )}
            <button
              onClick={() => {
                const blob = new Blob([fileContentText], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url;
                a.download = `${viewingFile.name.replace(/\s+/g, "_")}.txt`; a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-xl flex-shrink-0"
              style={{ background: "rgba(0,0,0,0.04)", color: "#64748b", border: "1px solid rgba(0,0,0,0.09)" }}
            >↓ Export</button>
          </div>

          {/* ── Two-column body: Content + File Agent ── */}
          <div className="flex flex-1 overflow-hidden">

            {/* Left: File Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5">

                {/* Media player placeholder */}
                {!fileContentLoading && !fileContentEditing && (viewingFile.type === "Video" || viewingFile.type === "Audio") && (
                  <div className="mb-4 rounded-2xl overflow-hidden" style={{ background: "#f1f5f9", border: "1px solid rgba(0,0,0,0.09)" }}>
                    <MediaPlayer
                      type={viewingFile.type === "Video" ? "video" : "audio"}
                      title={viewingFile.name}
                      subtitle="No media source — text content below"
                    />
                  </div>
                )}

                {fileContentLoading ? (
                  <div className="flex items-center justify-center py-16 gap-3">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[13px]" style={{ color: "#6b7280" }}>Loading…</span>
                  </div>
                ) : fileContentEditing ? (
                  <textarea
                    value={fileContentText}
                    onChange={e => setFileContentText(e.target.value)}
                    className="w-full min-h-[60vh] rounded-xl p-4 text-[13px] font-mono resize-none outline-none leading-relaxed"
                    style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.09)", color: "#0f172a" }}
                    autoFocus
                  />
                ) : fileContentText ? (
                  <div className="space-y-4">
                    {fileContentText.split(/\n(?=#{1,3} )/).map((section, i) => {
                      const lines = section.split("\n");
                      const heading = lines[0].replace(/^#{1,3} /, "");
                      const body = lines.slice(1).join("\n").trim();
                      const isHeading = /^#{1,3} /.test(lines[0]);
                      if (isHeading && body) {
                        return (
                          <div key={i} className={i > 0 ? "pt-4" : ""} style={i > 0 ? { borderTop: "1px solid rgba(0,0,0,0.06)" } : {}}>
                            <h3 className="font-bold text-[14px] mb-2" style={{ color: "#0f172a" }}>{heading}</h3>
                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "#475569" }}>{body}</p>
                          </div>
                        );
                      }
                      return <p key={i} className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8" }}>{section}</p>;
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 px-6">
                    <p className="text-4xl mb-3">📝</p>
                    <p className="font-bold text-white mb-1.5">This document is blank</p>
                    <p className="text-[12px] leading-relaxed mb-5 max-w-[280px] mx-auto" style={{ color: "#6b7280" }}>
                      Write it yourself, or let the AI agent generate complete, professional content based on your project context.
                    </p>
                    <div className="flex gap-2.5 justify-center">
                      <button
                        onClick={() => setFileContentEditing(true)}
                        className="text-[12px] font-semibold text-white px-4 py-2.5 rounded-xl transition-all"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                      >Write it myself</button>
                      <button
                        onClick={() => sendFileAI(`Generate complete, professional content for the "${viewingFile.name}" document. Make it detailed, accurate, and ready to use.`)}
                        className="text-[12px] font-semibold px-4 py-2.5 rounded-xl transition-all"
                        style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.30)", color: "#a5b4fc" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.25)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.15)"; }}
                      >✨ Generate with AI</button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Workflow Quick Actions ── */}
              {!fileContentEditing && (
                <div
                  className="flex-shrink-0 px-5 py-2.5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.12)" }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-bold uppercase tracking-widest mr-1 flex-shrink-0" style={{ color: "#334155" }}>AI</span>
                    {getFileWorkflows(viewingFile).map(wf => (
                      <button
                        key={wf.label}
                        onClick={() => sendFileAI(wf.prompt)}
                        disabled={fileAiLoading}
                        className="text-[11px] font-medium px-3 py-1 rounded-full transition-all flex-shrink-0"
                        style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.18)", color: "#a5b4fc", opacity: fileAiLoading ? 0.5 : 1 }}
                        onMouseEnter={e => { if (!fileAiLoading) { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.22)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.40)"; } }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.10)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.18)"; }}
                      >
                        {wf.icon} {wf.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: File Agent Chat */}
            <div
              className="w-72 flex-shrink-0 flex flex-col"
              style={{ borderLeft: "1px solid rgba(255,255,255,0.07)", background: "#fff" }}
            >
              {/* Chat header */}
              <div
                className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>🤖</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold" style={{ color: "#0f172a" }}>File Agent</p>
                  <p className="text-[10px] truncate" style={{ color: "#6b7280" }}>Focused on: {viewingFile.name}</p>
                </div>
              </div>

              {/* Messages */}
              <div ref={fileAiScrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ background: "#f8fafc" }}>
                {fileAiMessages.length === 0 && (
                  <div className="flex flex-col items-center text-center pt-6 gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
                      style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.15)" }}>📄</div>
                    <p className="text-[12px] font-semibold" style={{ color: "#0f172a" }}>File Agent</p>
                    <p className="text-[11px] leading-relaxed max-w-[200px]" style={{ color: "#6b7280" }}>
                      I'm focused on <strong>{viewingFile.name}</strong>. Ask me to improve, expand, or rewrite any part of this file.
                    </p>
                    <div className="flex flex-col gap-1.5 w-full mt-1">
                      {[
                        `What should "${viewingFile.name}" include?`,
                        "What's missing from this document?",
                        "Rewrite this more professionally",
                      ].map(chip => (
                        <button key={chip}
                          onClick={() => setFileAiInput(chip)}
                          className="text-[11px] px-3 py-2 rounded-xl text-left"
                          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "#374151" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.30)"; (e.currentTarget as HTMLElement).style.background = "#faf5ff"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                        >{chip}</button>
                      ))}
                    </div>
                  </div>
                )}
                {fileAiMessages.map((m, i) => {
                  const isLast = i === fileAiMessages.length - 1;
                  const showTyping = isLast && fileAiLoading && m.role === "ai" && !m.text;
                  return (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}>
                      {m.role === "ai" && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mb-0.5"
                          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>🤖</div>
                      )}
                      <div
                        className={`max-w-[82%] px-3 py-2.5 text-[12px] leading-relaxed ${m.role === "user" ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"}`}
                        style={m.role === "user"
                          ? { background: "#6366f1", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.25)" }
                          : { background: "#fff", color: "#0f172a", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                      >
                        {showTyping ? (
                          <div className="flex gap-1.5 py-0.5">
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "0ms" }} />
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "150ms" }} />
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "300ms" }} />
                          </div>
                        ) : (
                          <span className="whitespace-pre-wrap">
                            {m.text}
                            {m.role === "ai" && fileAiLoading && isLast && m.text && (
                              <span className="inline-block w-0.5 h-3 rounded-sm animate-pulse align-middle ml-0.5"
                                style={{ background: "#6366f1", opacity: 0.7 }} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="flex gap-2 p-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                <input
                  value={fileAiInput}
                  onChange={e => setFileAiInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendFileAI()}
                  placeholder={`Ask about ${viewingFile.name}…`}
                  className="flex-1 text-[12px] px-3 py-2 rounded-xl outline-none"
                  style={{ background: "#f1f5f9", border: "1.5px solid transparent", color: "#0f172a" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "transparent")}
                />
                <button
                  onClick={() => sendFileAI()}
                  disabled={fileAiLoading || !fileAiInput.trim()}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: !fileAiLoading && fileAiInput.trim() ? "#6366f1" : "#e5e7eb",
                    color: !fileAiLoading && fileAiInput.trim() ? "#fff" : "#9ca3af",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── Project Top Bar ──────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#ffffff" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {/* Mobile hamburger — M-03: aria-label for screen readers */}
              <button
                className="sm:hidden w-8 h-8 flex flex-col items-center justify-center gap-1 flex-shrink-0 rounded-lg"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}
                aria-label={mobileSidebarOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={mobileSidebarOpen}
                aria-controls="mobile-sidebar"
                onClick={() => setMobileSidebarOpen(o => !o)}
              >
                <span className="block w-3.5 h-0.5 rounded-full" style={{ background: "#6366f1" }} />
                <span className="block w-3.5 h-0.5 rounded-full" style={{ background: "#6366f1" }} />
                <span className="block w-3.5 h-0.5 rounded-full" style={{ background: "#6366f1" }} />
              </button>
              <span className="text-xl flex-shrink-0">{activeProject.icon}</span>
              <div className="min-w-0">
                <div className="text-[14px] font-bold truncate" style={{ color: "#0f172a" }}>{activeProject.name}</div>
                <div className="text-[9px] hidden sm:block" style={{ color: "#334155" }}>{activeProject.industry} · Created {activeProject.created}</div>
              </div>
              {/* Mode Badge */}
              <span
                className="hidden sm:inline px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer flex-shrink-0"
                style={{ background: `${MODE_COLORS[activeMode]}18`, border: `1px solid ${MODE_COLORS[activeMode]}35`, color: MODE_COLORS[activeMode] }}
                onClick={() => setShowModes(true)}
              >
                {activeMode === "Live" ? "🟢" : activeMode === "Demo" ? "🎭" : "🧪"} {activeMode} Mode
              </span>
              {/* Global Rewrite Engine */}
              <button
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0"
                style={{ background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.22)", color: "#7c3aed" }}
                onClick={() => setShowGlobalRewrite(true)}
                title="Global Rewrite Engine — update tone across all documents"
              >
                ✦ Rewrite All
              </button>
            </div>
            {/* View Toggle */}
            <div className="flex items-center gap-1 flex-wrap">
              {VIEW_MODES.filter(v => !v.group).map(v => (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: viewMode === v.id ? "rgba(99,102,241,0.10)" : "transparent",
                    border: `1px solid ${viewMode === v.id ? "rgba(99,102,241,0.35)" : "rgba(0,0,0,0.07)"}`,
                    color: viewMode === v.id ? "#6366f1" : "#64748b",
                  }}
                >
                  {v.label}
                </button>
              ))}
              <div className="w-px h-4 mx-1 flex-shrink-0" style={{ background: "rgba(0,0,0,0.09)" }} />
              {VIEW_MODES.filter(v => v.group === "power").map(v => (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: viewMode === v.id ? "rgba(16,185,129,0.12)" : "transparent",
                    border: `1px solid ${viewMode === v.id ? "rgba(16,185,129,0.40)" : "rgba(0,0,0,0.07)"}`,
                    color: viewMode === v.id ? "#10b981" : "#64748b",
                  }}
                >
                  {v.label}
                </button>
              ))}
              <div className="w-px h-4 mx-1 flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />
              {VIEW_MODES.filter(v => v.group === "teams").map(v => (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: viewMode === v.id ? "rgba(139,92,246,0.10)" : "transparent",
                    border: `1px solid ${viewMode === v.id ? "rgba(139,92,246,0.35)" : "rgba(0,0,0,0.07)"}`,
                    color: viewMode === v.id ? "#8b5cf6" : "#64748b",
                  }}
                >
                  {v.label}
                </button>
              ))}
              <button
                onClick={() => setShowAI(p => !p)}
                className="ml-2 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                style={{
                  background: showAI ? "rgba(6,182,212,0.12)" : "transparent",
                  border: `1px solid ${showAI ? "rgba(6,182,212,0.40)" : "rgba(0,0,0,0.07)"}`,
                  color: showAI ? "#0ea5e9" : "#64748b",
                }}
              >
                🧠 Agent
              </button>
              {publishedProjectIds.has(activeProject.id) ? (
                <button
                  onClick={openPublishModal}
                  className="ml-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                  style={{ background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.40)", color: "#4ade80" }}
                >
                  🌐 Published
                </button>
              ) : (
                <button
                  onClick={openPublishModal}
                  className="ml-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                  style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.35)", color: "#818cf8" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.28)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.18)"; }}
                >
                  ↑ Publish
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">

            {/* ── Project Content ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* Dashboard */}
              {(viewMode === "dashboard+folders" || viewMode === "dashboard" || viewMode === "advanced") && (
                <div
                  className="flex-shrink-0 p-4"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#fafafa" }}
                >
                  {/* Compact Output Strip */}
                  <div className="mb-4" style={{ height: 200 }}>
                    <ProjectOutputLayer project={activeProject} compact={true} />
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>
                    Quick Actions
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {DASHBOARD_ACTIONS.map(action => (
                      <button
                        key={action.id}
                        onClick={() => handleDashboardAction(action.id)}
                        className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all"
                        style={{
                          background: `${action.color}10`,
                          border: `1px solid ${action.color}25`,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = `${action.color}22`;
                          (e.currentTarget as HTMLButtonElement).style.borderColor = `${action.color}50`;
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = `${action.color}10`;
                          (e.currentTarget as HTMLButtonElement).style.borderColor = `${action.color}25`;
                        }}
                      >
                        <span className="text-xl">{action.icon}</span>
                        <span className="text-[10px] font-medium leading-tight" style={{ color: action.color }}>
                          {action.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* ── Project Intelligence Panel ──────────────────────────── */}
                  <div className="mt-3 rounded-xl overflow-hidden"
                    style={{ border: "1px solid rgba(99,102,241,0.18)", background: "rgba(99,102,241,0.04)" }}>

                    {/* Header row */}
                    <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#6366f1" }}>
                        ✦ Project Intelligence
                      </span>
                      {lifecycleLoading && (
                        <span className="text-[9px]" style={{ color: "#94a3b8" }}>Scoring…</span>
                      )}
                      {lifecycle && !lifecycleLoading && (
                        <span className="text-[10px] font-semibold" style={{ color: lifecycle.score >= 70 ? "#10b981" : lifecycle.score >= 35 ? "#f59e0b" : "#6366f1" }}>
                          {lifecycle.score}% complete
                        </span>
                      )}
                    </div>

                    {/* Score bar */}
                    {lifecycle && (
                      <div className="px-3 pb-2">
                        <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: "rgba(99,102,241,0.12)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${lifecycle.score}%`,
                              background: lifecycle.score >= 70 ? "#10b981" : lifecycle.score >= 35 ? "#f59e0b" : "#6366f1",
                            }}
                          />
                        </div>
                        <div className="flex gap-3 mt-1.5">
                          <span className="text-[9px]" style={{ color: "#10b981" }}>✓ {lifecycle.summary.complete} done</span>
                          {lifecycle.summary.started > 0 && <span className="text-[9px]" style={{ color: "#f59e0b" }}>◐ {lifecycle.summary.started} started</span>}
                          {lifecycle.summary.empty > 0   && <span className="text-[9px]" style={{ color: "#94a3b8" }}>○ {lifecycle.summary.empty} empty</span>}
                        </div>
                      </div>
                    )}

                    {/* Next action hint */}
                    {lifecycle?.nextAction && !genStatus && (
                      <div className="px-3 pb-2 text-[9.5px] leading-relaxed" style={{ color: "#64748b" }}>
                        {lifecycle.nextAction}
                      </div>
                    )}

                    {/* Generate progress */}
                    {genStatus && (
                      <div className="px-3 pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          {genStatus.running && (
                            <span className="text-[9px] animate-pulse" style={{ color: "#6366f1" }}>⟳ Generating…</span>
                          )}
                          {genStatus.done && (
                            <span className="text-[9px]" style={{ color: "#10b981" }}>✓ Done</span>
                          )}
                          <span className="text-[9px] truncate" style={{ color: "#64748b", maxWidth: 140 }}>
                            {genStatus.current}
                          </span>
                        </div>
                        {genStatus.total > 0 && (
                          <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: "rgba(99,102,241,0.12)" }}>
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.round((genStatus.completed / genStatus.total) * 100)}%`,
                                background: "#6366f1",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Generate button */}
                    {lifecycle && lifecycle.summary.empty + lifecycle.summary.started > 0 && !genStatus && (
                      <div className="px-3 pb-3">
                        <button
                          onClick={() => startGenerateAll(activeProject.id)}
                          className="w-full py-2 rounded-lg text-[11px] font-semibold transition-all"
                          style={{ background: "#6366f1", color: "#ffffff", border: "none" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#4f46e5"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#6366f1"; }}
                        >
                          ✦ Generate {lifecycle.summary.empty + lifecycle.summary.started} Missing Documents
                        </button>
                      </div>
                    )}

                    {/* All complete state */}
                    {lifecycle && lifecycle.summary.empty === 0 && lifecycle.summary.started === 0 && !genStatus && (
                      <div className="px-3 pb-3 text-[9.5px]" style={{ color: "#10b981" }}>
                        ✓ All {lifecycle.summary.complete} documents are complete.
                      </div>
                    )}
                  </div>

                  {/* ── Project Genome Card ──────────────────────────────────── */}
                  <div className="mt-3 rounded-xl overflow-hidden"
                    style={{ border: "1px solid rgba(16,185,129,0.18)", background: "rgba(16,185,129,0.04)" }}>

                    {/* Header */}
                    <div
                      className="flex items-center justify-between px-3 pt-2.5 pb-1.5 cursor-pointer select-none"
                      onClick={() => setGenomeExpanded(e => !e)}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#10b981" }}>
                        ✦ Project Genome
                      </span>
                      <div className="flex items-center gap-2">
                        {genomeLoading && (
                          <span className="text-[9px] animate-pulse" style={{ color: "#94a3b8" }}>Generating…</span>
                        )}
                        {genome && !genomeLoading && (
                          <span className="text-[9px]" style={{ color: "#94a3b8" }}>
                            {genome.lifecycle.currentPhase}
                          </span>
                        )}
                        {!genome && !genomeLoading && (
                          <button
                            onClick={e => { e.stopPropagation(); generateGenome(activeProject.id); }}
                            className="text-[9px] px-2 py-0.5 rounded-lg"
                            style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "none" }}
                          >Generate ✦</button>
                        )}
                        <span className="text-[9px]" style={{ color: "#94a3b8" }}>{genomeExpanded ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {/* Collapsed summary — always visible */}
                    {genome && (
                      <div className="px-3 pb-2 text-[9.5px] leading-relaxed" style={{ color: "#374151" }}>
                        {genome.vision.purpose}
                      </div>
                    )}

                    {/* Expanded content */}
                    {genome && genomeExpanded && (
                      <div className="px-3 pb-3 space-y-3">
                        {/* Audience + Tone */}
                        <div className="flex gap-2">
                          <div className="flex-1 rounded-lg px-2.5 py-2" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}>
                            <div className="text-[8.5px] font-bold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Audience</div>
                            <div className="text-[9.5px]" style={{ color: "#374151" }}>{genome.vision.audience}</div>
                          </div>
                          <div className="flex-1 rounded-lg px-2.5 py-2" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}>
                            <div className="text-[8.5px] font-bold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Tone</div>
                            <div className="text-[9.5px] capitalize" style={{ color: "#374151" }}>{genome.vision.tone}</div>
                          </div>
                        </div>

                        {/* Phases */}
                        <div>
                          <div className="text-[8.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#94a3b8" }}>Phases</div>
                          <div className="space-y-1">
                            {genome.structure.phases.map((phase, i) => (
                              <div key={i} className="text-[9.5px] flex items-start gap-1.5">
                                <span style={{ color: "#10b981", flexShrink: 0 }}>→</span>
                                <span style={{ color: "#374151" }}>{phase}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Next Actions */}
                        <div>
                          <div className="text-[8.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#94a3b8" }}>Next Actions</div>
                          <div className="space-y-1">
                            {genome.lifecycle.nextActions.map((action, i) => (
                              <div key={i} className="text-[9.5px] flex items-start gap-1.5">
                                <span style={{ color: "#6366f1", flexShrink: 0 }}>□</span>
                                <span style={{ color: "#374151" }}>{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Timeline + Differentiators */}
                        <div className="flex gap-2">
                          <div className="flex-1 rounded-lg px-2.5 py-2" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}>
                            <div className="text-[8.5px] font-bold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Timeline</div>
                            <div className="text-[9.5px]" style={{ color: "#374151" }}>{genome.executionPlan.estimatedTimeline}</div>
                          </div>
                        </div>

                        {/* Regenerate */}
                        <button
                          onClick={() => generateGenome(activeProject.id)}
                          disabled={genomeLoading}
                          className="w-full py-1.5 rounded-lg text-[10px] transition-all"
                          style={{ background: "transparent", color: "#94a3b8", border: "1px solid rgba(0,0,0,0.08)" }}
                        >
                          {genomeLoading ? "Regenerating…" : "↺ Regenerate Genome"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Task Board ── */}
              {viewMode === "tasks" && (
                <div className="flex-1 overflow-hidden">
                  <TaskBoard projectId={activeProject.id} />
                </div>
              )}

              {/* ── Team / Members Panel ── */}
              {viewMode === "team" && (
                <div className="flex-1 overflow-y-auto p-5" style={{ maxWidth: "min(100%, 680px)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                    {/* Header */}
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>
                        👥 Team Members — {activeProject.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                        Add collaborators by their user ID. Roles: viewer (read-only), editor (can edit files), owner (full access).
                      </div>
                    </div>

                    {/* Add member form */}
                    <div style={{
                      background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: 0.8 }}>
                        Add Member
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontSize: 11, color: "#94a3b8" }}>User ID</label>
                          <input
                            value={addMemberId}
                            onChange={e => setAddMemberId(e.target.value)}
                            placeholder="e.g. user-abc123"
                            style={{
                              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                              borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit",
                            }}
                            onKeyDown={e => { if (e.key === "Enter") handleAddMember(); }}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontSize: 11, color: "#94a3b8" }}>Role</label>
                          <select
                            value={addMemberRole}
                            onChange={e => setAddMemberRole(e.target.value as "viewer" | "editor" | "owner")}
                            style={{
                              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                              borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, cursor: "pointer",
                            }}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="owner">Owner</option>
                          </select>
                        </div>
                        <button
                          onClick={handleAddMember}
                          disabled={addingMember || !addMemberId.trim()}
                          style={{
                            background: "#6366f1", border: "none", borderRadius: 8, padding: "8px 16px",
                            color: "#fff", fontSize: 13, fontWeight: 600, cursor: addingMember || !addMemberId.trim() ? "not-allowed" : "pointer",
                            opacity: !addMemberId.trim() ? 0.5 : 1,
                          }}
                        >{addingMember ? "Adding…" : "+ Add"}</button>
                      </div>
                      {memberError && (
                        <div style={{ fontSize: 12, color: "#ff6b6b", padding: "6px 8px", background: "rgba(255,59,48,0.1)", borderRadius: 6 }}>
                          ⚠️ {memberError}
                        </div>
                      )}
                    </div>

                    {/* Members list */}
                    {membersLoading ? (
                      <div style={{ fontSize: 13, color: "#64748b", padding: "20px 0", textAlign: "center" }}>
                        Loading members…
                      </div>
                    ) : members.length === 0 ? (
                      <div style={{
                        textAlign: "center", padding: "32px 0",
                        color: "#475569", fontSize: 13,
                      }}>
                        No team members yet. Add the first one above.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {members.map(member => {
                          const roleColors: Record<string, string> = {
                            owner: "#FF9500", editor: "#6366f1", viewer: "#34C759",
                          };
                          const roleColor = roleColors[member.role] ?? "#94a3b8";
                          return (
                            <div key={member.userId} style={{
                              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
                            }}>
                              {/* Avatar */}
                              <div style={{
                                width: 36, height: 36, borderRadius: "50%",
                                background: `${roleColor}22`, border: `1px solid ${roleColor}44`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 14, fontWeight: 700, color: roleColor, flexShrink: 0,
                              }}>
                                {member.userId.slice(0, 2).toUpperCase()}
                              </div>
                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {member.userId}
                                </div>
                                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                                  Added by {member.addedByUserId}
                                  {member.createdAt && ` · ${new Date(member.createdAt).toLocaleDateString()}`}
                                </div>
                              </div>
                              {/* Role selector */}
                              <select
                                value={member.role}
                                onChange={e => handleUpdateMemberRole(member.userId, e.target.value as "owner" | "editor" | "viewer")}
                                style={{
                                  background: `${roleColor}18`, border: `1px solid ${roleColor}40`,
                                  borderRadius: 6, padding: "4px 10px", color: roleColor,
                                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                                }}
                              >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                                <option value="owner">Owner</option>
                              </select>
                              {/* Remove */}
                              <button
                                onClick={() => handleRemoveMember(member.userId)}
                                style={{
                                  background: "rgba(255,59,48,0.12)", border: "1px solid rgba(255,59,48,0.25)",
                                  borderRadius: 6, padding: "4px 10px", color: "#ff6b6b",
                                  fontSize: 11, cursor: "pointer",
                                }}
                                title="Remove member"
                              >Remove</button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Role legend */}
                    <div style={{
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 10, padding: "12px 14px",
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>ROLE PERMISSIONS</div>
                      {[
                        { role: "viewer", color: "#34C759", perms: "Read-only — can view files and tasks, cannot edit or delete" },
                        { role: "editor", color: "#6366f1", perms: "Can add/edit files, create tasks, and run AI — cannot delete the project or manage members" },
                        { role: "owner",  color: "#FF9500", perms: "Full access — same as project creator" },
                      ].map(r => (
                        <div key={r.role} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: r.color,
                            background: `${r.color}22`, borderRadius: 4, padding: "1px 7px", flexShrink: 0, marginTop: 1,
                          }}>{r.role.toUpperCase()}</span>
                          <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{r.perms}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Opportunities Panel ── */}
              {viewMode === "opportunities" && (
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="mb-5">
                    <div className="text-[15px] font-bold text-white mb-1">💡 Opportunity Engine</div>
                    <div className="text-[11px]" style={{ color: "#475569" }}>
                      Live-scanned opportunities — jobs, gigs, market gaps, and ready-to-launch packages.
                      Adopt any to instantly create a fully-structured project workspace.
                    </div>
                  </div>
                  <div className="space-y-3">
                    {opportunities.map(op => {
                      const adopted = adoptedOpIds.includes(op.id);
                      const effortColor = op.effort === "Low" ? "#34d399" : op.effort === "Medium" ? "#f59e0b" : "#f87171";
                      return (
                        <div
                          key={op.id}
                          className="rounded-2xl p-4"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">{op.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-[13px] font-bold text-white">{op.title}</span>
                                <span
                                  className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: "rgba(99,102,241,0.18)", color: "#818cf8" }}
                                >
                                  {op.category}
                                </span>
                              </div>
                              <p className="text-[12px] leading-relaxed mb-2" style={{ color: "#64748b" }}>{op.summary}</p>
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "#475569" }}>Revenue</span>
                                  <span className="text-[11px] font-bold" style={{ color: "#a5b4fc" }}>{op.potential}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "#475569" }}>Effort</span>
                                  <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: `${effortColor}18`, color: effortColor }}
                                  >{op.effort}</span>
                                </div>
                                <button
                                  onClick={() => !adopted && adoptOpportunity(op)}
                                  disabled={adoptingOpId === op.id || adopted}
                                  className="ml-auto px-4 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                                  style={{
                                    background: adopted ? "rgba(16,185,129,0.12)" : "rgba(99,102,241,0.20)",
                                    border: `1px solid ${adopted ? "rgba(16,185,129,0.30)" : "rgba(99,102,241,0.40)"}`,
                                    color: adopted ? "#34d399" : "#818cf8",
                                  }}
                                >
                                  {adoptingOpId === op.id ? "Creating…" : adopted ? "✓ Project Created" : "Adopt Opportunity"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Portfolio Intelligence Panel ── */}
              {viewMode === "portfolio" && (
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-[15px] font-bold mb-1" style={{ color: "#0f172a" }}>🧠 Portfolio Intelligence</div>
                      <div className="text-[11px]" style={{ color: "#64748b" }}>
                        AI-powered cross-project analysis — patterns, synergies, and strategic recommendations.
                      </div>
                    </div>
                    <button
                      onClick={fetchPortfolioIntel}
                      disabled={portfolioIntelLoading}
                      className="px-4 py-2 rounded-xl text-[12px] font-semibold flex items-center gap-2"
                      style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#6366f1" }}
                    >
                      {portfolioIntelLoading
                        ? <><div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />Analysing…</>
                        : "✦ Analyse Portfolio"}
                    </button>
                  </div>

                  {/* Stats bar */}
                  {portfolioIntel && (
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="rounded-xl p-3.5" style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}>
                        <div className="text-[22px] font-bold" style={{ color: "#6366f1" }}>{portfolioIntel.stats.total}</div>
                        <div className="text-[11px] font-medium mt-0.5" style={{ color: "#64748b" }}>Active Projects</div>
                      </div>
                      <div className="rounded-xl p-3.5" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}>
                        <div className="text-[22px] font-bold" style={{ color: "#10b981" }}>{portfolioIntel.stats.avgCompletion}%</div>
                        <div className="text-[11px] font-medium mt-0.5" style={{ color: "#64748b" }}>Avg Completion</div>
                      </div>
                      <div className="rounded-xl p-3.5" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)" }}>
                        <div className="text-[22px] font-bold" style={{ color: "#f59e0b" }}>{Object.keys(portfolioIntel.stats.typeBreakdown).length}</div>
                        <div className="text-[11px] font-medium mt-0.5" style={{ color: "#64748b" }}>Project Types</div>
                      </div>
                    </div>
                  )}

                  {/* Project completion heatmap */}
                  {portfolioIntel && portfolioIntel.stats.projectCompletions.length > 0 && (
                    <div className="rounded-xl p-4 mb-4" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.07)" }}>
                      <div className="text-[12px] font-semibold mb-3" style={{ color: "#334155" }}>Completion by Project</div>
                      <div className="space-y-2">
                        {portfolioIntel.stats.projectCompletions.map((p, i) => {
                          const col = INDUSTRY_COLORS[p.industry] ?? "#6366f1";
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-[11px] w-[110px] truncate font-medium" style={{ color: "#475569" }} title={p.name}>{p.name}</span>
                              <div className="flex-1 rounded-full overflow-hidden h-2" style={{ background: "rgba(0,0,0,0.06)" }}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${p.completion}%`, background: col }}
                                />
                              </div>
                              <span className="text-[10px] font-bold w-8 text-right" style={{ color: col }}>{p.completion}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Portfolio insight */}
                  {portfolioIntel?.portfolioInsight && (
                    <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
                      <div className="text-[11px] font-bold mb-2" style={{ color: "#6366f1" }}>PORTFOLIO OVERVIEW</div>
                      <p className="text-[12px] leading-relaxed" style={{ color: "#334155" }}>{portfolioIntel.portfolioInsight}</p>
                    </div>
                  )}

                  {/* AI Recommendations */}
                  {portfolioIntel && portfolioIntel.recommendations.length > 0 && (
                    <div className="mb-4">
                      <div className="text-[12px] font-bold mb-2.5" style={{ color: "#334155" }}>Strategic Recommendations</div>
                      <div className="space-y-2.5">
                        {portfolioIntel.recommendations.map((r, i) => {
                          const priColor = r.priority === "high" ? "#ef4444" : r.priority === "medium" ? "#f59e0b" : "#10b981";
                          return (
                            <div key={i} className="rounded-xl p-3.5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)" }}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full capitalize"
                                  style={{ background: `${priColor}18`, color: priColor }}>{r.priority}</span>
                                <span className="text-[12px] font-semibold" style={{ color: "#0f172a" }}>{r.title}</span>
                              </div>
                              <p className="text-[11px] leading-relaxed" style={{ color: "#475569" }}>{r.body}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Synergies */}
                  {portfolioIntel && portfolioIntel.synergies.length > 0 && (
                    <div className="mb-4">
                      <div className="text-[12px] font-bold mb-2.5" style={{ color: "#334155" }}>Cross-Project Synergies</div>
                      <div className="space-y-2">
                        {portfolioIntel.synergies.map((s, i) => (
                          <div key={i} className="rounded-xl p-3.5" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              {s.projects.map((name, j) => (
                                <span key={j} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>{name}</span>
                              ))}
                            </div>
                            <p className="text-[11px] leading-relaxed" style={{ color: "#475569" }}>{s.insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing types */}
                  {portfolioIntel && portfolioIntel.missingTypes.length > 0 && (
                    <div>
                      <div className="text-[12px] font-bold mb-2.5" style={{ color: "#334155" }}>Expand Your Portfolio</div>
                      <div className="flex flex-wrap gap-2">
                        {portfolioIntel.missingTypes.map(t => (
                          <button
                            key={t}
                            onClick={() => { setNewProjIndustry(t); setShowNewProject(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                            style={{ background: "rgba(0,0,0,0.04)", border: "1px dashed rgba(0,0,0,0.12)", color: "#64748b" }}
                          >
                            <span>{INDUSTRY_ICONS[t] ?? "📁"}</span> {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!portfolioIntel && !portfolioIntelLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="text-4xl mb-3">🧠</div>
                      <div className="text-[14px] font-semibold mb-1" style={{ color: "#334155" }}>Portfolio Intelligence</div>
                      <p className="text-[12px] mb-5 max-w-[280px]" style={{ color: "#64748b" }}>
                        Click Analyse Portfolio to get AI-powered insights across all your active projects.
                      </p>
                      <button
                        onClick={fetchPortfolioIntel}
                        className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                      >✦ Analyse my portfolio</button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Sales Module ── */}
              {viewMode === "sales" && activeProject && (
                <SalesModule projectName={activeProject.name} />
              )}

              {/* ── Operations Module ── */}
              {viewMode === "ops" && activeProject && (
                <OpsModule projectName={activeProject.name} />
              )}

              {/* ── Support Module ── */}
              {viewMode === "support" && activeProject && (
                <SupportModule projectName={activeProject.name} />
              )}

              {/* ── Compliance Readiness ── */}
              {viewMode === "compliance" && activeProject && (
                <ComplianceModule projectName={activeProject.name} />
              )}

              {/* ── Enterprise Dashboard ── */}
              {viewMode === "enterprise" && activeProject && (
                <EnterpriseDashboard
                  projectName={activeProject.name}
                  projectCount={projects.length}
                  fileCount={activeProject.files.length}
                />
              )}

              {/* ── Strategy Module ── */}
              {viewMode === "strategy" && activeProject && (
                <StrategyModule projectName={activeProject.name} />
              )}

              {/* ── UX / Content Module ── */}
              {viewMode === "ux" && activeProject && (
                <UXContentModule projectName={activeProject.name} />
              )}

              {/* ── Pipeline View ── */}
              {viewMode === "pipeline" && activeProject && (
                <PipelineView projectName={activeProject.name} files={activeProject.files} />
              )}

              {/* ── Marketing Module ── */}
              {viewMode === "marketing" && activeProject && (
                <MarketingModule projectName={activeProject.name} />
              )}

              {/* ── Product Module ── */}
              {viewMode === "product" && activeProject && (
                <ProductModule projectName={activeProject.name} />
              )}

              {/* ── HR / People Module ── */}
              {viewMode === "hr" && activeProject && (
                <HRModule projectName={activeProject.name} />
              )}

              {/* ── Finance Module ── */}
              {viewMode === "finance" && activeProject && (
                <FinanceModule projectName={activeProject.name} />
              )}

              {/* ── Observability Dashboard ── */}
              {viewMode === "observability" && (
                <ObservabilityDashboard />
              )}

              {/* ── Output Layer ── */}
              {viewMode === "output" && activeProject && (
                <div className="flex-1 overflow-auto p-4" style={{ background: "#f8fafc" }}>
                  <ProjectOutputLayer project={activeProject} compact={false} />
                </div>
              )}

              {/* Folder + File View */}
              {viewMode !== "output" && viewMode !== "dashboard" && viewMode !== "tasks" && viewMode !== "team" && viewMode !== "opportunities" && viewMode !== "portfolio" && viewMode !== "sales" && viewMode !== "ops" && viewMode !== "support" && viewMode !== "compliance" && viewMode !== "enterprise" && viewMode !== "strategy" && viewMode !== "ux" && viewMode !== "pipeline" && viewMode !== "marketing" && viewMode !== "product" && viewMode !== "hr" && viewMode !== "finance" && viewMode !== "observability" && (
                <div className="flex flex-1 overflow-hidden">

                  {/* Folder Tree */}
                  <div
                    className="w-52 flex-shrink-0 overflow-y-auto py-3"
                    style={{ borderRight: "1px solid rgba(0,0,0,0.07)" }}
                  >
                    {/* Universal folders */}
                    <div className="px-3 mb-1">
                      <div className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: "#334155" }}>Universal</div>
                      {activeProject.folders.filter(f => f.universal).map(folder => (
                        <button
                          key={folder.id}
                          onClick={() => setActiveFolderId(activeFolderId === folder.id ? null : folder.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left mb-0.5 transition-all"
                          style={{
                            background: activeFolderId === folder.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${activeFolderId === folder.id ? "rgba(99,102,241,0.35)" : "transparent"}`,
                          }}
                        >
                          <span className="text-sm">{folder.icon}</span>
                          <span className="text-[11px] flex-1 truncate" style={{ color: activeFolderId === folder.id ? "#818cf8" : "#64748b" }}>
                            {folder.name}
                          </span>
                          <span className="text-[9px]" style={{ color: "#334155" }}>
                            {activeProject.files.filter(f => f.folderId === folder.id).length || ""}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Project-specific folders */}
                    {activeProject.folders.filter(f => !f.universal).length > 0 && (
                      <div className="px-3 mt-3">
                        <div className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: "#334155" }}>
                          {activeProject.industry}
                        </div>
                        {activeProject.folders.filter(f => !f.universal).map(folder => (
                          <button
                            key={folder.id}
                            onClick={() => setActiveFolderId(activeFolderId === folder.id ? null : folder.id)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left mb-0.5 transition-all"
                            style={{
                              background: activeFolderId === folder.id ? `${activeProject.color}18` : "rgba(255,255,255,0.02)",
                              border: `1px solid ${activeFolderId === folder.id ? `${activeProject.color}35` : "transparent"}`,
                            }}
                          >
                            <span className="text-sm">{folder.icon}</span>
                            <span
                              className="text-[11px] flex-1 truncate"
                              style={{ color: activeFolderId === folder.id ? activeProject.color : "#64748b" }}
                            >
                              {folder.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Sub-Apps */}
                    {(activeProject.subApps.length > 0 || viewMode === "advanced") && (
                      <div className="px-3 mt-3">
                        <div className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: "#334155" }}>Sub-Apps</div>
                        {activeProject.subApps.map(sa => (
                          <div
                            key={sa.id}
                            className="group flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5"
                            style={{ background: "rgba(255,255,255,0.02)" }}
                          >
                            <span className="text-sm">{sa.icon}</span>
                            <span className="text-[11px] flex-1 truncate" style={{ color: "#64748b" }}>{sa.name}</span>
                            <button
                              onClick={() => setDeleteTarget({ type: "subapp", id: sa.id, label: sa.name })}
                              className="opacity-0 group-hover:opacity-100 text-[9px]"
                              style={{ color: "#f87171" }}
                            >✕</button>
                          </div>
                        ))}
                        <button
                          onClick={() => setShowAddSubApp(true)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left mt-1"
                          style={{ background: "rgba(236,72,153,0.08)", border: "1px dashed rgba(236,72,153,0.25)", color: "#f472b6" }}
                        >
                          <span className="text-[11px]">＋ Add Sub-App</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* File List */}
                  <div className="flex-1 overflow-y-auto p-4">

                    {/* ── Inline scaffold progress banner ── */}
                    {scaffoldStatus && (
                      <div
                        className="mb-4 rounded-xl px-4 py-3"
                        style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.22)" }}
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin flex-shrink-0" />
                          <span className="text-[11px] font-semibold" style={{ color: "#a5b4fc" }}>
                            Setting up your workspace — {scaffoldStatus.label}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(scaffoldStatus.current / scaffoldStatus.total) * 100}%`,
                              background: "linear-gradient(90deg,#6366f1,#818cf8)",
                              transition: reducedMotion ? "none" : "width 0.5s ease",
                            }}
                          />
                        </div>
                        <div className="text-[9px] mt-1.5 flex items-center justify-between" style={{ color: "#475569" }}>
                          <span>{scaffoldStatus.current} of {scaffoldStatus.total} documents</span>
                          <span>{Math.round((scaffoldStatus.current / scaffoldStatus.total) * 100)}%</span>
                        </div>
                      </div>
                    )}

                    {/* ── Workspace ready banner ── */}
                    {!scaffoldStatus && newlyCreatedId === activeProject.id && activeFiles.length > 0 && (
                      <div
                        className="mb-4 rounded-xl px-4 py-3 flex items-start gap-3"
                        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.22)" }}
                      >
                        <span className="text-lg flex-shrink-0 mt-0.5">✅</span>
                        <div>
                          <div className="text-[11px] font-semibold" style={{ color: "#34d399" }}>
                            Your workspace is ready — {activeFiles.length} documents created
                          </div>
                          <div className="text-[10px] mt-0.5 leading-relaxed" style={{ color: "#475569" }}>
                            Open any document to read, edit, or ask the Agent to write the full content. Click "AI" to get started.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-[13px] font-semibold text-white">
                          {activeFolderId
                            ? activeProject.folders.find(f => f.id === activeFolderId)?.name ?? "Files"
                            : "All Files"}
                        </div>
                        <div className="text-[10px]" style={{ color: "#334155" }}>
                          {activeFiles.length} {activeFiles.length === 1 ? "file" : "files"}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAddFile(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium"
                        style={{ background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.30)", color: "#818cf8" }}
                      >
                        ＋ Add File
                      </button>
                    </div>

                    {activeFiles.length === 0 && !scaffoldStatus && (
                      <div
                        className="rounded-xl py-10 text-center"
                        style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
                      >
                        <div className="text-3xl mb-2">📄</div>
                        <div className="text-[12px]" style={{ color: "#475569" }}>No files in this folder yet</div>
                        <div className="text-[10px] mt-1" style={{ color: "#334155" }}>Add a file or switch to a different folder</div>
                        <button
                          onClick={() => setShowAddFile(true)}
                          className="mt-3 text-[11px]"
                          style={{ color: "#818cf8" }}
                        >
                          + Add the first file
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      {activeFiles.map(file => (
                        <div
                          key={file.id}
                          className="group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                          onClick={() => openFileViewer(file)}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}
                        >
                          <span className="text-lg flex-shrink-0">
                            {file.type === "Document" ? "📄" : file.type === "Spreadsheet" ? "📊" : file.type === "Image" ? "🖼️" : file.type === "Video" ? "🎬" : file.type === "Audio" ? "🎵" : file.type === "Presentation" ? "🎯" : "📄"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] text-white truncate">{file.name}</div>
                            <div className="text-[10px]" style={{ color: "#6b7280" }}>
                              {file.type} · Added {file.created}
                              {viewMode === "advanced" && ` · ${file.size}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>Open</span>
                            <button
                              onClick={e => { e.stopPropagation(); setDeleteTarget({ type: "file", id: file.id, label: file.name }); }}
                              className="px-2 py-0.5 rounded-md text-[10px]"
                              style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Project Chat Panel ────────────────────────────────────── */}
            {showAI && (
              <div
                className="w-80 flex-shrink-0 flex flex-col"
                style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", background: "#fff" }}
              >
                {/* Chat header */}
                <div
                  className="flex items-center gap-2.5 px-4 py-3.5 flex-shrink-0"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                    🤖
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold" style={{ color: "#0f172a" }}>🧠 Project Agent</p>
                    <p className="text-[10px] truncate" style={{ color: "#6b7280" }}>{activeProject.name} · Knows everything inside this project</p>
                  </div>
                  <button onClick={() => setShowAI(false)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all"
                    style={{ color: "#9ca3af", background: "rgba(0,0,0,0.05)" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#ef4444")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#9ca3af")}
                  >✕</button>
                </div>

                {/* Messages */}
                <div ref={aiScrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
                  style={{ background: "#f8fafc" }}>
                  {aiMessages.length === 0 && (
                    <div className="flex flex-col items-center text-center pt-4 gap-3">
                      {/* Agent avatar */}
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${INDUSTRY_COLORS[activeProject.industry] ?? "#6366f1"}22, rgba(99,102,241,0.12))`,
                          border: `1px solid ${INDUSTRY_COLORS[activeProject.industry] ?? "#6366f1"}30`,
                        }}>
                        {INDUSTRY_ICONS[activeProject.industry] ?? "🤖"}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold" style={{ color: "#0f172a" }}>
                          {activeProject.industry !== "General" ? `${activeProject.industry} Agent` : "Project Agent"}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#6b7280" }}>
                          Dedicated to <span className="font-semibold">{activeProject.name}</span>
                        </p>
                      </div>
                      <p className="text-[11px] leading-relaxed max-w-[230px]" style={{ color: "#6b7280" }}>
                        {newlyCreatedId === activeProject.id
                          ? `Your workspace is ready. I can write any document from scratch, walk you through the workflow, or help you plan what to tackle first.`
                          : `I know every document, folder, and detail inside this project. Ask me to write, rewrite, improve, or plan — I produce complete content, not summaries.`}
                      </p>
                      {/* Contextual hint */}
                      {!dismissedHints.has("agent-tip") && (
                        <div className="w-full flex items-start gap-2 px-3 py-2.5 rounded-xl"
                          style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.14)" }}>
                          <span className="text-[11px] flex-shrink-0 mt-0.5">💡</span>
                          <div className="flex-1 text-left">
                            <p className="text-[10px] leading-relaxed" style={{ color: "#64748b" }}>
                              Tip: Ask the agent to "write the full [document name]" for complete, ready-to-use content.
                            </p>
                          </div>
                          <button
                            onClick={() => dismissHint("agent-tip")}
                            className="text-[9px] flex-shrink-0 mt-0.5 transition-all"
                            style={{ color: "#334155" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
                          >✕</button>
                        </div>
                      )}
                      {/* Suggested prompts */}
                      <div className="flex flex-col gap-1.5 w-full mt-1">
                        {(newlyCreatedId === activeProject.id
                          ? [
                              `Walk me through this ${activeProject.industry !== "General" ? activeProject.industry.toLowerCase() : "project"} step by step`,
                              `Which document should I fill in first?`,
                              `What does a professional ${activeProject.industry !== "General" ? activeProject.industry.toLowerCase() : "project"} workflow look like?`,
                              `Explain what each file in this workspace is for`,
                            ]
                          : [
                              `What should I work on next?`,
                              `Give me a full status review of this project`,
                              `What's missing or incomplete?`,
                              `Help me plan the next milestone`,
                            ]
                        ).map(chip => (
                          <button key={chip}
                            onClick={() => { setAiInput(chip); }}
                            className="text-[11px] px-3 py-2 rounded-xl text-left transition-all"
                            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "#374151" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.30)"; (e.currentTarget as HTMLElement).style.background = "#f5f3ff"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiMessages.map((m, i) => {
                    const isLast = i === aiMessages.length - 1;
                    const showTyping = isLast && aiLoading && m.role === "ai" && !m.text;
                    return (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}>
                        {m.role === "ai" && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mb-0.5"
                            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                            🤖
                          </div>
                        )}
                        <div
                          className={`max-w-[82%] px-3 py-2.5 text-[12px] leading-relaxed ${m.role === "user" ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"}`}
                          style={m.role === "user"
                            ? { background: "#6366f1", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.25)" }
                            : { background: "#fff", color: "#0f172a", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }
                          }
                        >
                          {showTyping ? (
                            <div className="flex gap-1.5 py-0.5">
                              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "0ms" }} />
                              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "150ms" }} />
                              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "300ms" }} />
                            </div>
                          ) : (
                            <span className="whitespace-pre-wrap">
                              {m.text}
                              {m.role === "ai" && aiLoading && isLast && m.text && (
                                <span className="inline-block w-0.5 h-3 rounded-sm animate-pulse align-middle ml-0.5"
                                  style={{ background: "#6366f1", opacity: 0.7 }} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input */}
                <div className="flex gap-2 p-3 flex-shrink-0"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
                  <input
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendAI()}
                    placeholder="Ask about this project…"
                    className="flex-1 text-[12px] px-3 py-2 rounded-xl outline-none transition-all"
                    style={{ background: "#f1f5f9", border: "1.5px solid transparent", color: "#0f172a" }}
                    onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.35)")}
                    onBlur={e => ((e.currentTarget as HTMLElement).style.borderColor = "transparent")}
                  />
                  {typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) && (
                    <button
                      onClick={startVoiceInput}
                      disabled={voiceListening}
                      title={voiceListening ? "Listening… speak now" : "Voice input"}
                      className="flex items-center gap-1.5 px-2 h-8 rounded-xl flex-shrink-0 transition-all"
                      style={{
                        background: voiceListening ? "rgba(239,68,68,0.12)" : "#f1f5f9",
                        color: voiceListening ? "#ef4444" : "#94a3b8",
                        border: `1px solid ${voiceListening ? "rgba(239,68,68,0.30)" : "transparent"}`,
                        boxShadow: voiceListening ? "0 0 0 3px rgba(239,68,68,0.12)" : "none",
                      }}
                    >
                      {voiceListening ? (
                        <>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
                          </svg>
                          <span className="text-[10px] font-medium">Listening…</span>
                        </>
                      ) : (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
                        </svg>
                      )}
                    </button>
                  )}
                  <button
                    onClick={sendAI}
                    disabled={aiLoading || !aiInput.trim()}
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: !aiLoading && aiInput.trim() ? "#6366f1" : "#e5e7eb",
                      color: !aiLoading && aiInput.trim() ? "#fff" : "#9ca3af",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      {/* Publish Pipeline Modal (req 13 + 14) */}
      {showPublishModal && activeProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(15,23,42,0.50)", backdropFilter: "blur(4px)" }}
          onClick={() => !publishLoading && setShowPublishModal(false)}
        >
          <div
            className="w-[440px] rounded-2xl p-7 shadow-2xl flex flex-col"
            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.10)" }}
            onClick={e => e.stopPropagation()}
          >
            {publishStep === "done" ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.35)" }}>🌐</div>
                  <div>
                    <div className="text-[15px] font-bold" style={{ color: "#0f172a" }}>Project Published</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>{activeProject.name} is now live</div>
                  </div>
                </div>
                {publishDoneUrl && (
                  <div className="rounded-xl px-3.5 py-2.5 mb-4 flex items-center gap-2"
                    style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.20)" }}>
                    <span className="text-[11px] font-mono truncate flex-1" style={{ color: "#4ade80" }}>{publishDoneUrl}</span>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(publishDoneUrl); }}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                      style={{ background: "rgba(34,197,94,0.18)", color: "#4ade80" }}
                    >Copy</button>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleUnpublish}
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold"
                    style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                  >Unpublish</button>
                  <button
                    onClick={() => setShowPublishModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }}
                  >Done</button>
                </div>
              </>
            ) : publishStep === "billing" ? (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.35)" }}>💳</div>
                  <div>
                    <div className="text-[15px] font-bold" style={{ color: "#0f172a" }}>Checking account</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>Verifying publishing eligibility</div>
                  </div>
                </div>
                <div className="rounded-xl p-4 mb-5" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.07)" }}>
                  {publishLoading ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      <span className="text-[12px]" style={{ color: "#94a3b8" }}>Running billing eligibility check…</span>
                    </div>
                  ) : publishBillingOk ? (
                    <div className="flex items-center gap-2.5">
                      <span className="text-green-400 text-base">✓</span>
                      <span className="text-[12px]" style={{ color: "#94a3b8" }}>Eligible — Creator plan · Unlimited publishes</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <span className="text-red-400 text-base">✕</span>
                      <span className="text-[12px]" style={{ color: "#f87171" }}>Not eligible — upgrade required</span>
                    </div>
                  )}
                </div>
                {!publishLoading && publishBillingOk && (
                  <button
                    onClick={confirmPublish}
                    className="w-full py-2.5 rounded-xl text-[13px] font-semibold"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }}
                  >
                    Confirm & Publish →
                  </button>
                )}
              </>
            ) : publishStep === "confirm" ? (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${activeProject.color}18`, border: `1px solid ${activeProject.color}35` }}>
                    {activeProject.icon}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold" style={{ color: "#0f172a" }}>Ready to publish</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>{activeProject.name}</div>
                  </div>
                </div>
                <div className="rounded-xl p-4 mb-5 space-y-2" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <div className="flex items-center gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                    <span className="text-green-400">✓</span> Billing verified — Creator plan
                  </div>
                  <div className="flex items-center gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                    <span className="text-green-400">✓</span> {activeProject.files.length} document{activeProject.files.length === 1 ? "" : "s"} will be published
                  </div>
                  <div className="flex items-center gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                    <span className="text-indigo-400">○</span> Explicit publish required — no automatic sharing
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPublishModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold"
                    style={{ background: "#f1f5f9", border: "1px solid rgba(0,0,0,0.08)", color: "#64748b" }}
                  >Cancel</button>
                  <button
                    onClick={confirmPublish}
                    disabled={publishLoading}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }}
                  >
                    {publishLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {publishLoading ? "Publishing…" : "Publish Now →"}
                  </button>
                </div>
              </>
            ) : (
              /* review step */
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: `${activeProject.color}18`, border: `1px solid ${activeProject.color}35` }}>
                      {activeProject.icon}
                    </div>
                    <div>
                      <div className="text-[15px] font-bold" style={{ color: "#0f172a" }}>Publish Project</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>{activeProject.name} · {activeProject.industry}</div>
                    </div>
                  </div>
                  <button onClick={() => setShowPublishModal(false)} style={{ color: "#334155", fontSize: 16 }}>✕</button>
                </div>
                <div className="rounded-xl p-4 mb-5 space-y-3" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>What gets published</div>
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: "#475569" }}>
                    <span>📄</span> {activeProject.files.length} document{activeProject.files.length === 1 ? "" : "s"}
                  </div>
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: "#475569" }}>
                    <span>📂</span> {activeProject.folders.filter(f => !f.universal).length} project folder{activeProject.folders.filter(f => !f.universal).length === 1 ? "" : "s"}
                  </div>
                  <div className="mt-3 pt-3 text-[11px] leading-relaxed" style={{ borderTop: "1px solid rgba(0,0,0,0.07)", color: "#64748b" }}>
                    Publishing is <strong style={{ color: "#0f172a" }}>always explicit</strong> — no project becomes public unless you confirm here. You can unpublish at any time.
                  </div>
                </div>
                <button
                  onClick={runBillingCheck}
                  className="w-full py-3 rounded-xl text-[13px] font-semibold"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }}
                >
                  Continue to billing check →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Welcome Overlay (first-time experience) ── */}
      {showWelcomeOverlay && (() => {
        const WELCOME_STEPS = [
          {
            icon: "🧠",
            title: "Welcome to CreateAI Brain",
            body: "Your private AI-powered OS for building real products — films, apps, startups, books, music, and more. Each project gets its own dedicated workspace and expert AI agent.",
            cta: "Show me how →",
          },
          {
            icon: "📂",
            title: "Every project is its own world",
            body: "When you create a project, we automatically scaffold industry-standard documents, folders, and templates. Nothing starts from a blank page.",
            cta: "What else? →",
          },
          {
            icon: "🤖",
            title: "Your Project Agent knows everything inside",
            body: "Each project has a dedicated AI agent that specializes in your domain — film production, SaaS growth, book editing, music releases. Ask it to write, improve, plan, or review anything.",
            cta: "Got it, let's go →",
          },
        ];
        const step = WELCOME_STEPS[welcomeStep] ?? WELCOME_STEPS[0];
        const isLast = welcomeStep === WELCOME_STEPS.length - 1;
        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(8px)" }}
            onClick={e => { if (e.target === e.currentTarget) dismissWelcome(); }}
          >
            <div
              className="w-[480px] rounded-3xl p-9 flex flex-col items-center text-center"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.10)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.20)",
              }}
            >
              <div className="text-5xl mb-5">{step.icon}</div>
              <div className="text-[18px] font-bold mb-3 leading-snug" style={{ color: "#0f172a" }}>{step.title}</div>
              <div className="text-[13px] leading-relaxed mb-8 max-w-[360px]" style={{ color: "#94a3b8" }}>{step.body}</div>
              {/* Step dots */}
              <div className="flex items-center gap-2 mb-6">
                {WELCOME_STEPS.map((_, i) => (
                  <div key={i} className="rounded-full transition-all duration-300"
                    style={{
                      width: i === welcomeStep ? 20 : 6,
                      height: 6,
                      background: i === welcomeStep ? "#6366f1" : "rgba(99,102,241,0.25)",
                    }} />
                ))}
              </div>
              <button
                onClick={() => {
                  if (isLast) dismissWelcome();
                  else setWelcomeStep(s => s + 1);
                }}
                className="w-full py-3 rounded-2xl text-[14px] font-semibold transition-all"
                style={{ background: "#6366f1", color: "#fff" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#4f46e5"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#6366f1"; }}
              >
                {step.cta}
              </button>
              <button
                onClick={dismissWelcome}
                className="mt-3 text-[11px] transition-all"
                style={{ color: "#334155" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
              >
                Skip tour
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Accessibility Panel (floating) ── */}
      {showAccessibilityPanel && (
        <div
          className="fixed bottom-24 left-4 z-50 rounded-2xl p-4 w-[220px]"
          style={{
            background: "rgba(10,14,22,0.98)",
            border: "1px solid rgba(99,102,241,0.25)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.50)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#818cf8" }}>
              Accessibility
            </div>
            <button
              onClick={() => setShowAccessibilityPanel(false)}
              className="text-[11px] transition-all"
              style={{ color: "#475569" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#475569"; }}
            >✕</button>
          </div>
          {/* Text size */}
          <div className="mb-4">
            <div className="text-[10px] mb-2" style={{ color: "#64748b" }}>Text Size</div>
            <div className="flex gap-1.5">
              {([0.9, 1.0, 1.1, 1.2] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setTextScale(s)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                  style={{
                    background: textScale === s ? "rgba(99,102,241,0.30)" : "rgba(255,255,255,0.05)",
                    color: textScale === s ? "#a5b4fc" : "#475569",
                    border: `1px solid ${textScale === s ? "rgba(99,102,241,0.40)" : "transparent"}`,
                  }}
                >
                  {s === 0.9 ? "S" : s === 1.0 ? "M" : s === 1.1 ? "L" : "XL"}
                </button>
              ))}
            </div>
          </div>
          {/* Reduce motion */}
          <div className="mb-2">
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className="w-full flex items-center justify-between py-2 px-2.5 rounded-xl transition-all"
              style={{
                background: reducedMotion ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${reducedMotion ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.07)"}`,
              }}
            >
              <span className="text-[11px]" style={{ color: "#94a3b8" }}>Reduce motion</span>
              <div className="w-8 h-4 rounded-full flex items-center px-0.5 transition-all"
                style={{ background: reducedMotion ? "#6366f1" : "rgba(255,255,255,0.10)" }}>
                <div className="w-3 h-3 rounded-full bg-white transition-all"
                  style={{ marginLeft: reducedMotion ? "auto" : 0 }} />
              </div>
            </button>
          </div>
          {/* High contrast */}
          <div className="mb-3">
            <button
              onClick={() => setContrastMode(!contrastMode)}
              className="w-full flex items-center justify-between py-2 px-2.5 rounded-xl transition-all"
              style={{
                background: contrastMode ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${contrastMode ? "rgba(234,179,8,0.30)" : "rgba(255,255,255,0.07)"}`,
              }}
            >
              <span className="text-[11px]" style={{ color: "#94a3b8" }}>High contrast</span>
              <div className="w-8 h-4 rounded-full flex items-center px-0.5 transition-all"
                style={{ background: contrastMode ? "#eab308" : "rgba(255,255,255,0.10)" }}>
                <div className="w-3 h-3 rounded-full bg-white transition-all"
                  style={{ marginLeft: contrastMode ? "auto" : 0 }} />
              </div>
            </button>
          </div>
          {/* Mode selector */}
          <div>
            <div className="text-[10px] mb-2" style={{ color: "#64748b" }}>Experience Mode</div>
            <div className="flex gap-1">
              {(["beginner", "expert", "educational"] as const).map(m => (
                <button key={m} onClick={() => setUserMode(m)}
                  className="flex-1 py-1.5 rounded-lg text-[9px] font-semibold transition-all capitalize"
                  style={{
                    background: userMode === m ? "rgba(99,102,241,0.30)" : "rgba(255,255,255,0.05)",
                    color: userMode === m ? "#a5b4fc" : "#475569",
                    border: `1px solid ${userMode === m ? "rgba(99,102,241,0.40)" : "transparent"}`,
                  }}>
                  {m === "beginner" ? "Guide" : m === "expert" ? "Pro" : "Edu"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── What's New Modal ── */}
      {showWhatsNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.50)", backdropFilter: "blur(4px)" }}>
          <div className="w-[480px] rounded-2xl p-7 shadow-2xl"
            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.10)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[16px] font-bold" style={{ color: "#0f172a" }}>✦ What's New</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>Recent upgrades to CreateAI Brain</div>
              </div>
              <button onClick={() => setShowWhatsNew(false)}
                className="text-[12px] px-3 py-1.5 rounded-xl transition-all"
                style={{ color: "#64748b", background: "#f1f5f9", border: "1px solid rgba(0,0,0,0.08)" }}>
                Close
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon: "🔄", label: "Pipeline View", desc: "Move documents through Idea → Draft → Refining → Final stages.", tag: "New" },
                { icon: "🎯", label: "Strategy Module", desc: "SWOT analysis, strategic roadmap, and OKR framework built in.", tag: "New" },
                { icon: "✨", label: "UX / Content Module", desc: "Full UX audit checklist, content quality review, and improvement ideas.", tag: "New" },
                { icon: "📊", label: "Project Health Dashboard", desc: "Live workspace health score and document completion tracking.", tag: "New" },
                { icon: "⚡", label: "High Contrast Mode", desc: "Accessibility panel now includes a high-contrast toggle.", tag: "Improved" },
                { icon: "🎭", label: "Experience Modes", desc: "Switch between Guide, Pro, and Educational modes from accessibility settings.", tag: "Improved" },
                { icon: "📈", label: "Sales Module", desc: "6 outreach templates, CRM pipeline board, and training materials.", tag: "Existing" },
                { icon: "📋", label: "Compliance Readiness", desc: "HIPAA, SOC2, and GDPR readiness checklists — educational use only.", tag: "Existing" },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[12px] font-semibold" style={{ color: "#0f172a" }}>{item.label}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: item.tag === "New" ? "rgba(99,102,241,0.12)" : item.tag === "Improved" ? "rgba(16,185,129,0.10)" : "#f1f5f9",
                          color: item.tag === "New" ? "#6366f1" : item.tag === "Improved" ? "#10b981" : "#64748b",
                        }}>
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[10px] leading-relaxed" style={{ color: "#64748b" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Project — 3-step modal */}
      {showNewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.60)", backdropFilter: "blur(4px)" }}>
          {newProjStep === 1 ? (
            /* ── Step 1: Project Name ── */
            <div
              className="w-[440px] rounded-2xl p-7 shadow-2xl flex flex-col"
              style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.10)" }}
            >
              <div className="text-[16px] font-bold mb-1" style={{ color: "#0f172a" }}>New Project</div>
              <div className="text-[12px] mb-5" style={{ color: "#64748b" }}>Give your project a name, then pick a type.</div>
              <div className="text-[10px] font-semibold mb-1.5 uppercase tracking-widest" style={{ color: "#94a3b8" }}>Project Name</div>
              <input
                value={newProjName}
                onChange={e => setNewProjName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && newProjName.trim()) {
                    setNewProjIndustry(detectProjectType(newProjName));
                    setNewProjStep(2);
                  }
                }}
                autoFocus
                placeholder="e.g. The Last Signal, My SaaS, Album 2026…"
                className="w-full text-[13px] px-3.5 py-3 rounded-xl outline-none mb-5"
                style={{ background: "#f8fafc", border: "1px solid rgba(99,102,241,0.30)", color: "#1e293b" }}
              />
              <div className="flex gap-3">
                <button
                  onClick={resetModal}
                  className="flex-1 py-2.5 rounded-xl text-[13px]"
                  style={{ background: "#f8fafc", color: "#64748b", border: "1px solid rgba(0,0,0,0.10)" }}
                >Cancel</button>
                <button
                  onClick={() => {
                    if (!newProjName.trim()) return;
                    setNewProjIndustry(detectProjectType(newProjName));
                    setNewProjStep(2);
                  }}
                  disabled={!newProjName.trim()}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{
                    background: newProjName.trim() ? "#6366f1" : "#f1f5f9",
                    border: "none",
                    color: newProjName.trim() ? "#fff" : "#94a3b8",
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          ) : newProjStep === 2 ? (
            /* ── Step 2: Type Picker ── */
            <div
              className="w-[720px] rounded-2xl p-7 shadow-2xl flex flex-col max-h-[90vh]"
              style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.10)" }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="text-[16px] font-bold" style={{ color: "#0f172a" }}>{newProjName}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: "#64748b" }}>Choose a project type — we'll scaffold the right documents for you.</div>
                </div>
                <button
                  onClick={() => setNewProjStep(1)}
                  className="text-[11px] ml-4 mt-0.5 flex-shrink-0"
                  style={{ color: "#94a3b8" }}
                >← Back</button>
              </div>

              {/* Type grid */}
              <div className="grid grid-cols-4 gap-2 mt-5 overflow-y-auto pr-0.5" style={{ maxHeight: "360px" }}>
                {PROJECT_TYPE_DEFINITIONS.map(type => {
                  const selected = newProjIndustry === type.id;
                  const color = INDUSTRY_COLORS[type.id] ?? "#6366f1";
                  return (
                    <button
                      key={type.id}
                      onClick={() => setNewProjIndustry(type.id)}
                      className="flex flex-col items-start text-left p-3 rounded-xl transition-all"
                      style={{
                        background: selected ? `${color}12` : "#f8fafc",
                        border: `1px solid ${selected ? color : "rgba(0,0,0,0.08)"}`,
                        outline: "none",
                      }}
                    >
                      <div className="text-[22px] mb-1.5">{type.icon}</div>
                      <div className="text-[11px] font-semibold mb-0.5" style={{ color: selected ? color : "#1e293b" }}>
                        {type.label}
                      </div>
                      <div className="text-[9.5px] leading-tight mb-2" style={{ color: "#64748b" }}>
                        {type.desc}
                      </div>
                      <div
                        className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{
                          background: selected ? `${color}18` : "rgba(0,0,0,0.05)",
                          color: selected ? color : "#94a3b8",
                        }}
                      >
                        {type.count} files
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected type preview */}
              {newProjIndustry && INDUSTRY_SPECIFIC[newProjIndustry] && (
                <div
                  className="rounded-xl px-3.5 py-2.5 mt-4 text-[10px]"
                  style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <span style={{ color: "#94a3b8" }}>Folders: </span>
                  <span style={{ color: "#64748b" }}>
                    {INDUSTRY_SPECIFIC[newProjIndustry].map(f => f.icon + " " + f.name).join("  ·  ")}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={resetModal}
                  className="py-2.5 rounded-xl text-[13px] px-4"
                  style={{ background: "#f8fafc", color: "#64748b", border: "1px solid rgba(0,0,0,0.10)" }}
                >Cancel</button>
                <button
                  onClick={createProject}
                  className="flex-1 py-2.5 rounded-xl text-[13px]"
                  style={{ background: "#f8fafc", color: "#374151", border: "1px solid rgba(0,0,0,0.12)" }}
                >
                  Create Now
                </button>
                <button
                  onClick={() => setNewProjStep(3)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{ background: "#6366f1", border: "none", color: "#ffffff" }}
                >
                  Add Intent ✦ →
                </button>
              </div>
            </div>
          ) : (
            /* ── Step 3: Intent Capture ── */
            <div
              className="w-[500px] rounded-2xl p-7 shadow-2xl flex flex-col"
              style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.10)" }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="text-[16px] font-bold" style={{ color: "#0f172a" }}>Project Intent</div>
                  <div className="text-[12px] mt-0.5" style={{ color: "#64748b" }}>
                    Tell us about your vision — we'll generate a smart Project Genome that guides the AI agent and document generation.
                  </div>
                </div>
                <button onClick={() => setNewProjStep(2)} className="text-[11px] ml-4 mt-0.5 flex-shrink-0" style={{ color: "#94a3b8" }}>← Back</button>
              </div>

              <div className="mt-5 space-y-4">
                {/* Purpose */}
                <div>
                  <div className="text-[10px] font-semibold mb-1.5 uppercase tracking-widest" style={{ color: "#94a3b8" }}>Purpose</div>
                  <input
                    value={newProjIntent.purpose}
                    onChange={e => setNewProjIntent(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="What does this project achieve? Who does it help?"
                    className="w-full text-[12px] px-3 py-2.5 rounded-xl outline-none"
                    style={{ background: "#f8fafc", border: "1px solid rgba(99,102,241,0.25)", color: "#1e293b" }}
                  />
                </div>

                {/* Audience */}
                <div>
                  <div className="text-[10px] font-semibold mb-1.5 uppercase tracking-widest" style={{ color: "#94a3b8" }}>Target Audience</div>
                  <input
                    value={newProjIntent.audience}
                    onChange={e => setNewProjIntent(prev => ({ ...prev, audience: e.target.value }))}
                    placeholder="e.g. Independent filmmakers, B2B SaaS founders, Fiction readers 25–45"
                    className="w-full text-[12px] px-3 py-2.5 rounded-xl outline-none"
                    style={{ background: "#f8fafc", border: "1px solid rgba(99,102,241,0.25)", color: "#1e293b" }}
                  />
                </div>

                {/* Tone */}
                <div>
                  <div className="text-[10px] font-semibold mb-1.5 uppercase tracking-widest" style={{ color: "#94a3b8" }}>Tone</div>
                  <div className="flex flex-wrap gap-2">
                    {["professional", "creative", "bold", "cinematic", "technical", "friendly", "inspiring"].map(t => (
                      <button
                        key={t}
                        onClick={() => setNewProjIntent(prev => ({ ...prev, tone: t }))}
                        className="px-3 py-1.5 rounded-lg text-[11px] capitalize transition-all"
                        style={{
                          background: newProjIntent.tone === t ? "rgba(99,102,241,0.12)" : "#f8fafc",
                          border: `1px solid ${newProjIntent.tone === t ? "#6366f1" : "rgba(0,0,0,0.08)"}`,
                          color: newProjIntent.tone === t ? "#6366f1" : "#64748b",
                        }}
                      >{t}</button>
                    ))}
                  </div>
                </div>

                {/* Constraints (optional) */}
                <div>
                  <div className="text-[10px] font-semibold mb-1.5 uppercase tracking-widest" style={{ color: "#94a3b8" }}>Constraints <span style={{ color: "#cbd5e1", fontWeight: 400 }}>— optional</span></div>
                  <input
                    value={newProjIntent.constraints}
                    onChange={e => setNewProjIntent(prev => ({ ...prev, constraints: e.target.value }))}
                    placeholder="Budget limits, timeline, platform restrictions, compliance needs…"
                    className="w-full text-[12px] px-3 py-2.5 rounded-xl outline-none"
                    style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.08)", color: "#1e293b" }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={createProject}
                  className="flex-1 py-2.5 rounded-xl text-[13px]"
                  style={{ background: "#f8fafc", color: "#374151", border: "1px solid rgba(0,0,0,0.12)" }}
                >
                  Skip → Create
                </button>
                <button
                  onClick={createProject}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{ background: "#6366f1", border: "none", color: "#ffffff" }}
                >
                  ✦ Create with Intelligence
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scaffold progress toast */}
      {scaffoldStatus && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
          style={{ background: "#ffffff", border: "1px solid rgba(99,102,241,0.25)", minWidth: "280px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
        >
          <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <div>
            <div className="text-[11px]" style={{ color: "#64748b" }}>Scaffolding project…</div>
            <div className="text-[12px] font-medium mt-0.5" style={{ color: "#1e293b" }}>{scaffoldStatus.label}</div>
            <div className="w-full mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(scaffoldStatus.current / scaffoldStatus.total) * 100}%`,
                  background: "linear-gradient(90deg, #6366f1, #818cf8)",
                }}
              />
            </div>
            <div className="text-[9px] text-slate-600 mt-1">{scaffoldStatus.current} / {scaffoldStatus.total} files</div>
          </div>
        </div>
      )}

      {/* Add File */}
      {showAddFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.50)", backdropFilter: "blur(4px)" }}>
          <div
            className="w-80 rounded-2xl p-6 shadow-2xl"
            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.10)" }}
          >
            <div className="text-[14px] font-bold mb-4" style={{ color: "#0f172a" }}>Add New File</div>
            <div className="space-y-3">
              <input
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addFile()}
                autoFocus
                placeholder="File name…"
                className="w-full text-[13px] px-3 py-2.5 rounded-xl outline-none"
                style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)", color: "#0f172a" }}
              />
              <div className="grid grid-cols-3 gap-1.5">
                {["Document","Spreadsheet","Presentation","Image","Video","Audio","Script","Other"].map(t => (
                  <button key={t} onClick={() => setNewFileType(t)}
                    className="py-1.5 rounded-lg text-[10px] font-medium"
                    style={{
                      background: newFileType === t ? "rgba(99,102,241,0.12)" : "#f8fafc",
                      border: `1px solid ${newFileType === t ? "rgba(99,102,241,0.40)" : "rgba(0,0,0,0.09)"}`,
                      color: newFileType === t ? "#6366f1" : "#64748b",
                    }}
                  >{t}</button>
                ))}
              </div>
              {activeFolderId && (
                <div className="text-[10px]" style={{ color: "#475569" }}>
                  → Saving to: {activeProject?.folders.find(f => f.id === activeFolderId)?.name ?? activeFolderId}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddFile(false)}
                className="flex-1 py-2 rounded-xl text-[12px]"
                style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid rgba(0,0,0,0.08)" }}>
                Cancel
              </button>
              <button onClick={addFile} disabled={!newFileName.trim()}
                className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                style={{
                  background: newFileName.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f1f5f9",
                  color: newFileName.trim() ? "#fff" : "#94a3b8",
                  border: "none",
                }}>
                Add File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sub-App */}
      {showAddSubApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.50)", backdropFilter: "blur(4px)" }}>
          <div
            className="w-80 rounded-2xl p-6 shadow-2xl"
            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.10)" }}
          >
            <div className="text-[14px] font-bold mb-4" style={{ color: "#0f172a" }}>Add Sub-App</div>
            <div className="space-y-3">
              <input
                value={newSubAppName}
                onChange={e => setNewSubAppName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSubApp()}
                autoFocus
                placeholder="Sub-app name…"
                className="w-full text-[13px] px-3 py-2.5 rounded-xl outline-none"
                style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.10)", color: "#0f172a" }}
              />
              <div>
                <div className="text-[9px] uppercase tracking-wide mb-1.5" style={{ color: "#475569" }}>Icon</div>
                <div className="flex gap-2 flex-wrap">
                  {["📱","💊","🗺️","📊","🛠️","🎬","📡","🔧","🌐","⚡"].map(emoji => (
                    <button key={emoji} onClick={() => setNewSubAppIcon(emoji)}
                      className="w-9 h-9 rounded-lg text-lg flex items-center justify-center"
                      style={{
                        background: newSubAppIcon === emoji ? "rgba(236,72,153,0.12)" : "#f8fafc",
                        border: `1px solid ${newSubAppIcon === emoji ? "rgba(236,72,153,0.40)" : "rgba(0,0,0,0.09)"}`,
                      }}
                    >{emoji}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddSubApp(false)}
                className="flex-1 py-2 rounded-xl text-[12px]"
                style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid rgba(0,0,0,0.08)" }}>
                Cancel
              </button>
              <button onClick={addSubApp} disabled={!newSubAppName.trim()}
                className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                style={{
                  background: newSubAppName.trim() ? "linear-gradient(135deg,#ec4899,#db2777)" : "#f1f5f9",
                  color: newSubAppName.trim() ? "#fff" : "#94a3b8",
                  border: "none",
                }}>
                Add Sub-App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode Switcher */}
      {showModes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.50)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowModes(false)}>
          <div
            className="w-72 rounded-2xl p-5 shadow-2xl"
            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.10)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-[14px] font-bold mb-4" style={{ color: "#0f172a" }}>Switch Mode</div>
            {(["Demo","Test","Live"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => { setActiveMode(mode); setShowModes(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 text-left"
                style={{
                  background: activeMode === mode ? `${MODE_COLORS[mode]}10` : "#f8fafc",
                  border: `1px solid ${activeMode === mode ? `${MODE_COLORS[mode]}35` : "rgba(0,0,0,0.08)"}`,
                }}
              >
                <span className="text-xl">
                  {mode === "Demo" ? "🎭" : mode === "Test" ? "🧪" : "🟢"}
                </span>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: MODE_COLORS[mode] }}>{mode} Mode</div>
                  <div className="text-[10px]" style={{ color: "#475569" }}>
                    {mode === "Demo" ? "Demonstration-ready state" : mode === "Test" ? "Testing and QA environment" : "Live production operation"}
                  </div>
                </div>
                {activeMode === mode && <span className="ml-auto text-[10px]" style={{ color: MODE_COLORS[mode] }}>✓ Active</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Global Search */}
      {showSearch && <SearchModal projects={projects} onClose={() => setShowSearch(false)} />}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirm
          label={deleteTarget.label}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── File Content Viewer Modal ──────────────────────────────────── */}
      {viewingFile && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setViewingFile(null); }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.10)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <span className="text-2xl flex-shrink-0">
                {viewingFile.type === "Document" ? "📄" : viewingFile.type === "Spreadsheet" ? "📊" : viewingFile.type === "Image" ? "🖼️" : viewingFile.type === "Video" ? "🎬" : viewingFile.type === "Audio" ? "🎵" : viewingFile.type === "Presentation" ? "🎯" : "📄"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold truncate" style={{ color: "#0f172a" }}>{viewingFile.name}</p>
                <p className="text-[11px]" style={{ color: "#6b7280" }}>{viewingFile.type} · Added {viewingFile.created} · {viewingFile.size}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {fileContentSaved && (
                  <span className="text-[11px] font-medium text-green-400 px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)" }}>✓ Saved</span>
                )}
                {!fileContentEditing && (
                  <button
                    onClick={() => { setFileContentEditing(true); }}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-xl"
                    style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}
                  >Edit</button>
                )}
                {fileContentEditing && (
                  <button
                    onClick={saveFileContent}
                    disabled={fileContentSaving}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }}
                  >
                    {fileContentSaving ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : "Save"}
                  </button>
                )}
                <button
                  onClick={() => {
                    const blob = new Blob([fileContentText], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url;
                    a.download = `${viewingFile.name.replace(/\s+/g, "_")}.txt`; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.60)", border: "1px solid rgba(255,255,255,0.10)" }}
                >↓ Export</button>
                <button onClick={() => setViewingFile(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#9ca3af" }}
                >✕</button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Media player placeholder for Video/Audio file types */}
              {!fileContentLoading && !fileContentEditing && (viewingFile.type === "Video" || viewingFile.type === "Audio") && (
                <div className="mb-4 rounded-2xl overflow-hidden" style={{ background: "#f1f5f9", border: "1px solid rgba(0,0,0,0.09)" }}>
                  <MediaPlayer
                    type={viewingFile.type === "Video" ? "video" : "audio"}
                    title={viewingFile.name}
                    subtitle="No media source — text content below"
                  />
                </div>
              )}
              {fileContentLoading ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[13px]" style={{ color: "#6b7280" }}>Loading content…</span>
                </div>
              ) : fileContentEditing ? (
                <textarea
                  value={fileContentText}
                  onChange={e => setFileContentText(e.target.value)}
                  className="w-full h-full min-h-[50vh] rounded-xl p-4 text-[13px] font-mono resize-none outline-none leading-relaxed"
                  style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.09)", color: "#0f172a" }}
                  autoFocus
                />
              ) : fileContentText ? (
                <div className="space-y-4">
                  {fileContentText.split(/\n(?=#{1,3} )/).map((section, i) => {
                    const lines = section.split("\n");
                    const heading = lines[0].replace(/^#{1,3} /, "");
                    const body = lines.slice(1).join("\n").trim();
                    const isHeading = /^#{1,3} /.test(lines[0]);
                    if (isHeading && body) {
                      return (
                        <div key={i} className={i > 0 ? "pt-4" : ""} style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.07)" } : {}}>
                          <h3 className="font-bold text-[14px] text-white mb-2">{heading}</h3>
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8" }}>{body}</p>
                        </div>
                      );
                    }
                    return (
                      <p key={i} className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8" }}>{section}</p>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📝</p>
                  <p className="font-semibold text-white mb-1">No content yet</p>
                  <p className="text-[13px]" style={{ color: "#6b7280" }}>Click Edit to add content to this file.</p>
                  <button onClick={() => setFileContentEditing(true)}
                    className="mt-4 text-[13px] font-semibold text-white px-5 py-2.5 rounded-xl"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                    Start Writing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          LIVE BUILD MODE OVERLAY
          Appears when user submits Create X input. Stays on the same page
          and shows real-time AI reasoning + scaffold progress.
      ═══════════════════════════════════════════════════════════════════ */}
      {liveBuild && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(8,8,20,0.88)", backdropFilter: "blur(12px)" }}
          role="presentation"
        >
          {/* M-02: role="dialog" + aria-modal + aria-live so screen readers announce build progress */}
          <div
            className="relative w-full max-w-[520px] mx-4 rounded-3xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Building your project"
            aria-live="polite"
            aria-busy={liveBuild.phase !== "complete"}
            style={{
              background: "linear-gradient(145deg,#0f1117 0%,#15192a 60%,#1a1030 100%)",
              border: "1px solid rgba(99,102,241,0.25)",
              boxShadow: "0 40px 120px rgba(99,102,241,0.35), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            {/* Top glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-32 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(ellipse,rgba(99,102,241,0.45) 0%,transparent 70%)" }} />

            <div className="relative px-8 py-10">
              {/* Header */}
              <div className="flex items-center gap-3 mb-7">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  🧠
                </div>
                <div>
                  <div className="text-[15px] font-bold text-white">
                    {liveBuild.phase === "complete" ? "Build Complete" : "Building Live"}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#818cf8" }}>
                    {liveBuild.projectName
                      ? `"${liveBuild.projectName}" · ${liveBuild.industry}`
                      : "Analysing your idea…"
                    }
                  </div>
                </div>
              </div>

              {/* Phase Steps */}
              {(() => {
                const STEPS = [
                  { key: "parsing",     icon: "🔍", label: "Understanding intent" },
                  { key: "creating",    icon: "⚙️", label: "Creating project workspace" },
                  { key: "scaffolding", icon: "📄", label: "Scaffolding industry documents" },
                  { key: "genome",      icon: "🧬", label: "Generating project intelligence" },
                  { key: "complete",    icon: "✔",  label: "Ready to enter" },
                ] as const;
                const phaseOrder = ["parsing","creating","scaffolding","genome","complete"];
                const currentIdx = phaseOrder.indexOf(liveBuild.phase);
                return (
                  <div className="space-y-3 mb-7">
                    {STEPS.map((step, i) => {
                      const done    = i < currentIdx;
                      const active  = i === currentIdx;
                      const pending = i > currentIdx;
                      return (
                        <div key={step.key} className={`flex items-center gap-3 transition-all duration-500 ${pending ? "opacity-30" : "opacity-100"}`}>
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] flex-shrink-0"
                            style={{
                              background: done
                                ? "rgba(16,185,129,0.20)"
                                : active
                                  ? "rgba(99,102,241,0.25)"
                                  : "rgba(255,255,255,0.06)",
                              border: done
                                ? "1px solid rgba(16,185,129,0.40)"
                                : active
                                  ? "1px solid rgba(99,102,241,0.45)"
                                  : "1px solid rgba(255,255,255,0.10)",
                            }}
                          >
                            {done ? (
                              <span style={{ color: "#34d399" }}>✓</span>
                            ) : active ? (
                              <span className="inline-block w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                            ) : (
                              <span style={{ color: "#4b5563" }}>{step.icon}</span>
                            )}
                          </div>
                          <span
                            className="text-[12px] font-medium"
                            style={{ color: done ? "#34d399" : active ? "#a5b4fc" : "#4b5563" }}
                          >
                            {step.label}
                          </span>
                          {active && liveBuild.scaffoldProgress && step.key === "scaffolding" && (
                            <span className="text-[10px] ml-auto" style={{ color: "#6366f1" }}>
                              {liveBuild.scaffoldProgress.current} / {liveBuild.scaffoldProgress.total} files
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Thinking Feed */}
              {liveBuild.phase !== "complete" && liveBuild.thinking.length > 0 && (
                <div
                  className="rounded-2xl px-4 py-3 mb-6"
                  style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}
                >
                  <div className="text-[9px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#6366f1" }}>
                    AI Thinking
                  </div>
                  <div className="space-y-1 max-h-24 overflow-hidden">
                    {liveBuild.thinking.slice(-4).map((t, i) => (
                      <div
                        key={i}
                        className="text-[11px] transition-all"
                        style={{ color: i === liveBuild.thinking.slice(-4).length - 1 ? "#c7d2fe" : "#4b5563" }}
                      >
                        {i === liveBuild.thinking.slice(-4).length - 1 && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 mb-0.5 animate-pulse" style={{ background: "#6366f1" }} />
                        )}
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete CTA */}
              {liveBuild.phase === "complete" && liveBuild.projectId && (
                <div className="text-center">
                  <div className="text-[12px] mb-4" style={{ color: "#64748b" }}>
                    Your project is ready with all documents scaffolded.
                  </div>
                  <button
                    className="w-full py-3.5 rounded-2xl text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 8px 32px rgba(99,102,241,0.45)" }}
                    onClick={() => {
                      setActiveProjectId(liveBuild.projectId!);
                      setActiveFolderId(null);
                      _setViewMode("dashboard+folders");
                      setShowAI(true);
                      setAiMessages([]);
                      setLiveBuild(null);
                    }}
                  >
                    Enter Your Project →
                  </button>
                  <button
                    className="mt-2 text-[11px] underline"
                    style={{ color: "#475569" }}
                    onClick={() => setLiveBuild(null)}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          GLOBAL REWRITE ENGINE MODAL
          Takes a single instruction and rewrites every document in the project.
      ═══════════════════════════════════════════════════════════════════ */}
      {showGlobalRewrite && activeProject && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget && !globalRewriteLoading) { globalRewriteAbortRef.current?.abort(); setShowGlobalRewrite(false); } }}
        >
          <div
            className="w-full max-w-[500px] rounded-2xl overflow-hidden"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
            }}
          >
            {/* Header */}
            <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.20)" }}>
                  ✦
                </div>
                <div>
                  <div className="text-[14px] font-bold" style={{ color: "#0f172a" }}>Global Rewrite Engine</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
                    One instruction rewrites every document in "{activeProject.name}"
                  </div>
                </div>
                {!globalRewriteLoading && (
                  <button className="ml-auto text-[16px] leading-none" style={{ color: "#64748b" }}
                    aria-label="Close rewrite engine"
                    onClick={() => { globalRewriteAbortRef.current?.abort(); setShowGlobalRewrite(false); }}>✕</button>
                )}
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Tone Presets */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>Quick Presets</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Make this beginner-friendly",
                    "Make this more professional",
                    "Make this concise and direct",
                    "Make this investor-ready",
                    "Add more detail and depth",
                    "Make this startup-focused",
                  ].map(preset => (
                    <button
                      key={preset}
                      onClick={() => setGlobalRewriteInstruction(preset)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                      style={{
                        background: globalRewriteInstruction === preset ? "rgba(99,102,241,0.12)" : "rgba(0,0,0,0.04)",
                        border: `1px solid ${globalRewriteInstruction === preset ? "rgba(99,102,241,0.30)" : "rgba(0,0,0,0.08)"}`,
                        color: globalRewriteInstruction === preset ? "#6366f1" : "#475569",
                      }}
                    >{preset}</button>
                  ))}
                </div>
              </div>

              {/* Custom instruction */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>Custom Instruction</div>
                <textarea
                  value={globalRewriteInstruction}
                  onChange={e => setGlobalRewriteInstruction(e.target.value)}
                  disabled={globalRewriteLoading}
                  placeholder='e.g. "Make all documents more beginner-friendly and remove jargon"'
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-[12px] resize-none outline-none transition-all"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid rgba(0,0,0,0.10)",
                    color: "#1e293b",
                  }}
                />
              </div>

              {/* Progress */}
              {globalRewriteLoading && globalRewriteProgress && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium" style={{ color: "#6366f1" }}>
                      Rewriting documents…
                    </span>
                    <span className="text-[11px]" style={{ color: "#64748b" }}>
                      {globalRewriteProgress.current} / {globalRewriteProgress.total}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(99,102,241,0.12)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(globalRewriteProgress.current / globalRewriteProgress.total) * 100}%`,
                        background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="flex gap-3 pt-1">
                <button
                  className="flex-1 py-3 rounded-xl text-[12px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                  disabled={!globalRewriteInstruction.trim() || globalRewriteLoading}
                  onClick={() => globalRewriteEngine(globalRewriteInstruction)}
                >
                  {globalRewriteLoading
                    ? `Rewriting ${globalRewriteProgress?.current ?? 0} / ${globalRewriteProgress?.total ?? "…"}…`
                    : `✦ Rewrite All ${activeProject.files.length} Documents`
                  }
                </button>
                {!globalRewriteLoading && (
                  <button
                    className="px-4 py-3 rounded-xl text-[12px] font-medium"
                    style={{ background: "rgba(0,0,0,0.05)", color: "#64748b" }}
                    onClick={() => { globalRewriteAbortRef.current?.abort(); setShowGlobalRewrite(false); }}
                  >Cancel</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
