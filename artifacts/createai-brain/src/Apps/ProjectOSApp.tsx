import React, { useState, useEffect, useRef, useCallback } from "react";
import { MediaPlayer } from "../components/MediaPlayer";
import { streamProjectChat, contextStore, checkBillingEligibility, publishProject, unpublishProject } from "@/controller";
import { useUniversalResume } from "@/hooks/useUniversalResume";
import { ensureIdentityForProject } from "@/engine/IdentityEngine";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SalesModule, OpsModule, SupportModule, ComplianceModule, EnterpriseDashboard } from "./InternalModules";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "dashboard+folders" | "dashboard" | "folders" | "simple" | "advanced" | "tasks" | "team" | "opportunities" | "sales" | "ops" | "support" | "compliance" | "enterprise";

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
};

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
      style={{ background: "rgba(0,0,0,0.65)" }}
    >
      <div
        className="rounded-2xl p-6 w-80 shadow-2xl"
        style={{ background: "rgba(15,20,30,0.97)", border: "1px solid rgba(239,68,68,0.35)" }}
      >
        <div className="text-[15px] font-bold text-white mb-2">Delete "{label}"?</div>
        <div className="text-[12px] mb-5" style={{ color: "#94a3b8" }}>
          This action cannot be undone. Nothing else will break.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-[13px] font-medium"
            style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}
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
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        className="w-[520px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "rgba(12,16,24,0.98)", border: "1px solid rgba(99,102,241,0.35)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="text-lg">🔍</span>
          <input
            ref={ref}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search all projects, files, folders, sub-apps…"
            className="flex-1 bg-transparent text-white text-[14px] outline-none"
            style={{ color: "#e2e8f0" }}
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
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span className="text-base">{r.icon}</span>
              <div className="flex-1">
                <div className="text-[13px] text-white">{r.label}</div>
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
  const [newProjStep, setNewProjStep] = useState<1 | 2>(1);
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
  // ── File-level agent chat ──
  const [fileAiMessages, setFileAiMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [fileAiInput, setFileAiInput]       = useState("");
  const [fileAiLoading, setFileAiLoading]   = useState(false);
  const [editingProjectName, setEditingProjectName] = useState(false);
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
  // ── Contextual hints ──
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());
  const aiAbortRef     = useRef<AbortController | null>(null);
  const aiScrollRef    = useRef<HTMLDivElement>(null);
  const fileAiAbortRef = useRef<AbortController | null>(null);
  const fileAiScrollRef= useRef<HTMLDivElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId) ?? null;
  const visibleProjects = projects.filter(p =>
    showArchived ? p.status === "archived" : (p.status ?? "active") === "active"
  );

  // ── Onboarding + accessibility hydration ──
  useEffect(() => {
    const seen = localStorage.getItem("cai_welcome_seen");
    if (!seen) setShowWelcomeOverlay(true);
    const scale = parseFloat(localStorage.getItem("cai_text_scale") ?? "1.0");
    if (!isNaN(scale)) setTextScaleState(scale);
    const rm = localStorage.getItem("cai_reduced_motion");
    if (rm === "true") setReducedMotionState(true);
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

  const createProject = useCallback(async () => {
    if (!newProjName.trim()) return;
    const proj = await apiCreateProject(newProjName.trim(), newProjIndustry);
    if (proj) {
      setProjects(prev => [...prev, proj]);
      setActiveProjectId(proj.id);
      setActiveFolderId(null);
      setShowNewProject(false);
      setNewProjName("");
      setNewProjStep(1);
      setNewProjIndustry("General");
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
      // Keep newlyCreatedId for a moment so the "workspace ready" message shows
      setTimeout(() => setNewlyCreatedId(null), 4000);
    } else {
      setShowNewProject(false);
      setNewProjName("");
      setNewProjStep(1);
      setNewProjIndustry("General");
    }
  }, [newProjName, newProjIndustry, scaffoldProject]);

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
    { id: "dashboard+folders", label: "Dashboard + Folders" },
    { id: "dashboard",         label: "Dashboard" },
    { id: "folders",           label: "Folders" },
    { id: "simple",            label: "Simple" },
    { id: "advanced",          label: "Advanced" },
    { id: "tasks",             label: "📋 Tasks" },
    { id: "team",              label: "👥 Team" },
    { id: "opportunities",     label: "💡 Opportunities" },
    { id: "sales",             label: "📈 Sales",        group: "teams" },
    { id: "ops",               label: "⚙️ Operations",   group: "teams" },
    { id: "support",           label: "🎧 Support",      group: "teams" },
    { id: "compliance",        label: "📋 Compliance",   group: "teams" },
    { id: "enterprise",        label: "🏢 Enterprise",   group: "teams" },
  ];

  const activeFiles = activeFolderId
    ? (activeProject?.files ?? []).filter(f => f.folderId === activeFolderId)
    : (activeProject?.files ?? []);

  const MODE_COLORS: Record<string, string> = { Demo: "#8b5cf6", Test: "#f59e0b", Live: "#10b981" };

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{
        background: "hsl(225,40%,5%)",
        color: "#e2e8f0",
        fontSize: `${textScale * 100}%`,
      }}
    >
      {/* ── Left Sidebar: Project List ────────────────────────────────────── */}
      <div
        className="w-56 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight: "1px solid rgba(99,102,241,0.15)", background: "rgba(0,0,0,0.25)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <div className="text-[13px] font-bold text-white">ProjectOS</div>
            <div className="text-[9px]" style={{ color: "#475569" }}>Universal Platform</div>
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
              onClick={() => { if (!showArchived) { setActiveProjectId(proj.id); setActiveFolderId(null); } }}
            >
              <span className="text-base flex-shrink-0" style={{ opacity: showArchived ? 0.5 : 1 }}>{proj.icon}</span>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[12px] font-medium truncate"
                  style={{ color: activeProjectId === proj.id ? proj.color : showArchived ? "#475569" : "#94a3b8" }}
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
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{t.icon}</span>
                      <span className="text-[11px] font-medium text-white truncate flex-1">{t.name}</span>
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
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
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
              <div>
                <div className="text-[18px] font-bold text-white">Your Projects</div>
                <div className="text-[12px] mt-0.5" style={{ color: "#475569" }}>
                  {projects.filter(p => p.status !== "archived").length > 0
                    ? `${projects.filter(p => p.status !== "archived").length} active workspace${projects.filter(p => p.status !== "archived").length === 1 ? "" : "s"}`
                    : "No projects yet — create your first one below"}
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
                className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
                style={{ border: "1px dashed rgba(99,102,241,0.20)", background: "rgba(99,102,241,0.03)" }}
              >
                <div className="text-5xl mb-5">✨</div>
                <div className="text-[16px] font-bold text-white mb-2">What are you building?</div>
                <div className="text-[12px] leading-relaxed mb-2 max-w-[320px]" style={{ color: "#475569" }}>
                  Films, apps, startups, books, games, albums — every project gets its own workspace, expert AI agent, and professional documents scaffolded in seconds.
                </div>
                <div className="text-[11px] mb-6" style={{ color: "#334155" }}>No blank pages. Ever.</div>
                <button
                  onClick={() => setShowNewProject(true)}
                  className="px-7 py-3 rounded-2xl text-[13px] font-semibold transition-all"
                  style={{ background: "rgba(99,102,241,0.22)", border: "1px solid rgba(99,102,241,0.40)", color: "#818cf8" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.32)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.22)"; }}
                >
                  ＋ Create your first project
                </button>
              </div>
            ) : (
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
                      <div className="text-[13px] font-semibold text-white mb-1 truncate">{p.name}</div>
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
            )}
          </div>
        </div>
      ) : viewingFile ? (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── Breadcrumb Header ── */}
          <div
            className="flex items-center gap-2.5 px-5 py-2.5 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.22)" }}
          >
            <button
              onClick={() => setViewingFile(null)}
              className="flex items-center gap-1.5 text-[11px] font-medium transition-colors flex-shrink-0"
              style={{ color: "#64748b" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#a5b4fc")}
              onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
            >
              ←&nbsp;{activeProject!.name}
            </button>
            <span style={{ color: "#2d3748", fontSize: 13 }}>/</span>
            <span className="text-[12px] font-semibold truncate flex-1" style={{ color: "#e2e8f0" }}>
              {viewingFile.type === "Document" ? "📄" : viewingFile.type === "Spreadsheet" ? "📊" : viewingFile.type === "Image" ? "🖼️" : viewingFile.type === "Video" ? "🎬" : viewingFile.type === "Audio" ? "🎵" : viewingFile.type === "Presentation" ? "🎯" : "📄"}&nbsp;{viewingFile.name}
            </span>
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", color: "#475569" }}>
              {viewingFile.type}
            </span>
            {fileContentSaved && (
              <span className="text-[11px] font-medium text-green-400 px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: "rgba(34,197,94,0.12)" }}>✓ Saved</span>
            )}
            {!fileContentEditing ? (
              <button
                onClick={() => { setFileContentEditing(true); setFileContentSaved(false); }}
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
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.09)" }}
            >↓ Export</button>
          </div>

          {/* ── Two-column body: Content + File Agent ── */}
          <div className="flex flex-1 overflow-hidden">

            {/* Left: File Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5">

                {/* Media player placeholder */}
                {!fileContentLoading && !fileContentEditing && (viewingFile.type === "Video" || viewingFile.type === "Audio") && (
                  <div className="mb-4 rounded-2xl overflow-hidden" style={{ background: "rgba(0,0,0,0.40)", border: "1px solid rgba(255,255,255,0.10)" }}>
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
                    className="w-full min-h-[60vh] rounded-xl p-4 text-[13px] text-white font-mono resize-none outline-none leading-relaxed"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}
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
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.20)" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{activeProject.icon}</span>
              <div>
                <div className="text-[14px] font-bold text-white">{activeProject.name}</div>
                <div className="text-[9px]" style={{ color: "#334155" }}>{activeProject.industry} · Created {activeProject.created}</div>
              </div>
              {/* Mode Badge */}
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer"
                style={{ background: `${MODE_COLORS[activeMode]}18`, border: `1px solid ${MODE_COLORS[activeMode]}35`, color: MODE_COLORS[activeMode] }}
                onClick={() => setShowModes(true)}
              >
                {activeMode === "Live" ? "🟢" : activeMode === "Demo" ? "🎭" : "🧪"} {activeMode} Mode
              </span>
            </div>
            {/* View Toggle */}
            <div className="flex items-center gap-1 flex-wrap">
              {VIEW_MODES.filter(v => !v.group).map(v => (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: viewMode === v.id ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${viewMode === v.id ? "rgba(99,102,241,0.45)" : "transparent"}`,
                    color: viewMode === v.id ? "#818cf8" : "#475569",
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
                    background: viewMode === v.id ? "rgba(139,92,246,0.22)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${viewMode === v.id ? "rgba(139,92,246,0.45)" : "transparent"}`,
                    color: viewMode === v.id ? "#c4b5fd" : "#475569",
                  }}
                >
                  {v.label}
                </button>
              ))}
              <button
                onClick={() => setShowAI(p => !p)}
                className="ml-2 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                style={{
                  background: showAI ? "rgba(6,182,212,0.20)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${showAI ? "rgba(6,182,212,0.45)" : "transparent"}`,
                  color: showAI ? "#22d3ee" : "#475569",
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
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.12)" }}
                >
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "#334155" }}>
                    Dashboard
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

              {/* Folder + File View */}
              {viewMode !== "dashboard" && viewMode !== "tasks" && viewMode !== "team" && viewMode !== "opportunities" && viewMode !== "sales" && viewMode !== "ops" && viewMode !== "support" && viewMode !== "compliance" && viewMode !== "enterprise" && (
                <div className="flex flex-1 overflow-hidden">

                  {/* Folder Tree */}
                  <div
                    className="w-52 flex-shrink-0 overflow-y-auto py-3"
                    style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
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
          style={{ background: "rgba(0,0,0,0.72)" }}
          onClick={() => !publishLoading && setShowPublishModal(false)}
        >
          <div
            className="w-[440px] rounded-2xl p-7 shadow-2xl flex flex-col"
            style={{ background: "rgba(12,16,24,0.99)", border: "1px solid rgba(99,102,241,0.30)" }}
            onClick={e => e.stopPropagation()}
          >
            {publishStep === "done" ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.35)" }}>🌐</div>
                  <div>
                    <div className="text-[15px] font-bold text-white">Project Published</div>
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
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                  >Done</button>
                </div>
              </>
            ) : publishStep === "billing" ? (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.35)" }}>💳</div>
                  <div>
                    <div className="text-[15px] font-bold text-white">Checking account</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>Verifying publishing eligibility</div>
                  </div>
                </div>
                <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
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
                    className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
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
                    <div className="text-[15px] font-bold text-white">Ready to publish</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>{activeProject.name}</div>
                  </div>
                </div>
                <div className="rounded-xl p-4 mb-5 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
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
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}
                  >Cancel</button>
                  <button
                    onClick={confirmPublish}
                    disabled={publishLoading}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
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
                      <div className="text-[15px] font-bold text-white">Publish Project</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>{activeProject.name} · {activeProject.industry}</div>
                    </div>
                  </div>
                  <button onClick={() => setShowPublishModal(false)} style={{ color: "#334155", fontSize: 16 }}>✕</button>
                </div>
                <div className="rounded-xl p-4 mb-5 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#475569" }}>What gets published</div>
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: "#94a3b8" }}>
                    <span>📄</span> {activeProject.files.length} document{activeProject.files.length === 1 ? "" : "s"}
                  </div>
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: "#94a3b8" }}>
                    <span>📂</span> {activeProject.folders.filter(f => !f.universal).length} project folder{activeProject.folders.filter(f => !f.universal).length === 1 ? "" : "s"}
                  </div>
                  <div className="mt-3 pt-3 text-[11px] leading-relaxed" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", color: "#475569" }}>
                    Publishing is <strong className="text-white">always explicit</strong> — no project becomes public unless you confirm here. You can unpublish at any time.
                  </div>
                </div>
                <button
                  onClick={runBillingCheck}
                  className="w-full py-3 rounded-xl text-[13px] font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
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
            style={{ background: "rgba(0,0,0,0.80)" }}
            onClick={e => { if (e.target === e.currentTarget) dismissWelcome(); }}
          >
            <div
              className="w-[480px] rounded-3xl p-9 flex flex-col items-center text-center"
              style={{
                background: "rgba(10,14,22,0.99)",
                border: "1px solid rgba(99,102,241,0.30)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.60)",
              }}
            >
              <div className="text-5xl mb-5">{step.icon}</div>
              <div className="text-[18px] font-bold text-white mb-3 leading-snug">{step.title}</div>
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
          <div>
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
        </div>
      )}

      {/* New Project — 2-step modal */}
      {showNewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.70)" }}>
          {newProjStep === 1 ? (
            /* ── Step 1: Project Name ── */
            <div
              className="w-[420px] rounded-2xl p-7 shadow-2xl flex flex-col"
              style={{ background: "rgba(12,16,24,0.99)", border: "1px solid rgba(99,102,241,0.30)" }}
            >
              <div className="text-[15px] font-bold text-white mb-1">New Project</div>
              <div className="text-[11px] text-slate-500 mb-5">Give your project a name, then pick a type.</div>
              <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-widest">Project Name</div>
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
                className="w-full text-white text-[13px] px-3.5 py-3 rounded-xl outline-none mb-5"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.28)" }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowNewProject(false); setNewProjName(""); setNewProjStep(1); }}
                  className="flex-1 py-2.5 rounded-xl text-[13px]"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.08)" }}
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
                    background: newProjName.trim() ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${newProjName.trim() ? "rgba(99,102,241,0.45)" : "rgba(255,255,255,0.08)"}`,
                    color: newProjName.trim() ? "#a5b4fc" : "#334155",
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          ) : (
            /* ── Step 2: Type Picker ── */
            <div
              className="w-[680px] rounded-2xl p-7 shadow-2xl flex flex-col max-h-[90vh]"
              style={{ background: "rgba(12,16,24,0.99)", border: "1px solid rgba(99,102,241,0.30)" }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="text-[15px] font-bold text-white">{newProjName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Choose a project type — we'll scaffold the right documents for you.</div>
                </div>
                <button
                  onClick={() => setNewProjStep(1)}
                  className="text-[11px] text-slate-500 hover:text-slate-300 ml-4 mt-0.5 flex-shrink-0"
                >← Back</button>
              </div>

              {/* Type grid */}
              <div className="grid grid-cols-4 gap-2 mt-5 overflow-y-auto pr-0.5" style={{ maxHeight: "340px" }}>
                {PROJECT_TYPE_DEFINITIONS.map(type => {
                  const selected = newProjIndustry === type.id;
                  const color = INDUSTRY_COLORS[type.id] ?? "#6366f1";
                  return (
                    <button
                      key={type.id}
                      onClick={() => setNewProjIndustry(type.id)}
                      className="flex flex-col items-start text-left p-3 rounded-xl transition-all"
                      style={{
                        background: selected ? `${color}16` : "rgba(255,255,255,0.025)",
                        border: `1px solid ${selected ? `${color}45` : "rgba(255,255,255,0.06)"}`,
                        outline: selected ? `2px solid ${color}30` : "none",
                      }}
                    >
                      <div className="text-[22px] mb-1.5">{type.icon}</div>
                      <div className="text-[11px] font-semibold mb-0.5" style={{ color: selected ? color : "#cbd5e1" }}>
                        {type.label}
                      </div>
                      <div className="text-[9.5px] leading-tight mb-2" style={{ color: "#475569" }}>
                        {type.desc}
                      </div>
                      <div
                        className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{
                          background: selected ? `${color}22` : "rgba(255,255,255,0.05)",
                          color: selected ? color : "#475569",
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
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span className="text-slate-500">Folders: </span>
                  <span className="text-slate-400">
                    {INDUSTRY_SPECIFIC[newProjIndustry].map(f => f.icon + " " + f.name).join("  ·  ")}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setShowNewProject(false); setNewProjName(""); setNewProjStep(1); setNewProjIndustry("General"); }}
                  className="flex-1 py-2.5 rounded-xl text-[13px]"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.08)" }}
                >Cancel</button>
                <button
                  onClick={createProject}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{
                    background: "rgba(99,102,241,0.22)",
                    border: "1px solid rgba(99,102,241,0.45)",
                    color: "#a5b4fc",
                  }}
                >
                  Create {newProjIndustry !== "General" ? `${INDUSTRY_ICONS[newProjIndustry]} ` : ""}Project
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
          style={{ background: "rgba(12,16,24,0.97)", border: "1px solid rgba(99,102,241,0.35)", minWidth: "280px" }}
        >
          <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
          <div>
            <div className="text-[11px] text-slate-400">Scaffolding project…</div>
            <div className="text-[12px] font-medium text-white mt-0.5">{scaffoldStatus.label}</div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
          <div
            className="w-80 rounded-2xl p-6 shadow-2xl"
            style={{ background: "rgba(12,16,24,0.98)", border: "1px solid rgba(99,102,241,0.35)" }}
          >
            <div className="text-[14px] font-bold text-white mb-4">Add New File</div>
            <div className="space-y-3">
              <input
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addFile()}
                autoFocus
                placeholder="File name…"
                className="w-full text-white text-[13px] px-3 py-2.5 rounded-xl outline-none"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.30)" }}
              />
              <div className="grid grid-cols-3 gap-1.5">
                {["Document","Spreadsheet","Presentation","Image","Video","Audio","Script","Other"].map(t => (
                  <button key={t} onClick={() => setNewFileType(t)}
                    className="py-1.5 rounded-lg text-[10px] font-medium"
                    style={{
                      background: newFileType === t ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${newFileType === t ? "rgba(99,102,241,0.40)" : "transparent"}`,
                      color: newFileType === t ? "#818cf8" : "#475569",
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
                style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}>
                Cancel
              </button>
              <button onClick={addFile} disabled={!newFileName.trim()}
                className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                style={{
                  background: newFileName.trim() ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.04)",
                  color: newFileName.trim() ? "#818cf8" : "#334155",
                  border: `1px solid ${newFileName.trim() ? "rgba(99,102,241,0.45)" : "transparent"}`,
                }}>
                Add File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sub-App */}
      {showAddSubApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
          <div
            className="w-80 rounded-2xl p-6 shadow-2xl"
            style={{ background: "rgba(12,16,24,0.98)", border: "1px solid rgba(236,72,153,0.30)" }}
          >
            <div className="text-[14px] font-bold text-white mb-4">Add Sub-App</div>
            <div className="space-y-3">
              <input
                value={newSubAppName}
                onChange={e => setNewSubAppName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSubApp()}
                autoFocus
                placeholder="Sub-app name…"
                className="w-full text-white text-[13px] px-3 py-2.5 rounded-xl outline-none"
                style={{ background: "rgba(236,72,153,0.07)", border: "1px solid rgba(236,72,153,0.25)" }}
              />
              <div>
                <div className="text-[9px] uppercase tracking-wide mb-1.5" style={{ color: "#475569" }}>Icon</div>
                <div className="flex gap-2 flex-wrap">
                  {["📱","💊","🗺️","📊","🛠️","🎬","📡","🔧","🌐","⚡"].map(emoji => (
                    <button key={emoji} onClick={() => setNewSubAppIcon(emoji)}
                      className="w-9 h-9 rounded-lg text-lg flex items-center justify-center"
                      style={{
                        background: newSubAppIcon === emoji ? "rgba(236,72,153,0.18)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${newSubAppIcon === emoji ? "rgba(236,72,153,0.40)" : "transparent"}`,
                      }}
                    >{emoji}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddSubApp(false)}
                className="flex-1 py-2 rounded-xl text-[12px]"
                style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}>
                Cancel
              </button>
              <button onClick={addSubApp} disabled={!newSubAppName.trim()}
                className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                style={{
                  background: newSubAppName.trim() ? "rgba(236,72,153,0.20)" : "rgba(255,255,255,0.04)",
                  color: newSubAppName.trim() ? "#f472b6" : "#334155",
                  border: `1px solid ${newSubAppName.trim() ? "rgba(236,72,153,0.40)" : "transparent"}`,
                }}>
                Add Sub-App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode Switcher */}
      {showModes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={() => setShowModes(false)}>
          <div
            className="w-72 rounded-2xl p-5 shadow-2xl"
            style={{ background: "rgba(12,16,24,0.98)", border: "1px solid rgba(99,102,241,0.30)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-[14px] font-bold text-white mb-4">Switch Mode</div>
            {(["Demo","Test","Live"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => { setActiveMode(mode); setShowModes(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 text-left"
                style={{
                  background: activeMode === mode ? `${MODE_COLORS[mode]}18` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${activeMode === mode ? `${MODE_COLORS[mode]}40` : "rgba(255,255,255,0.08)"}`,
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
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setViewingFile(null); }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-2xl flex-shrink-0">
                {viewingFile.type === "Document" ? "📄" : viewingFile.type === "Spreadsheet" ? "📊" : viewingFile.type === "Image" ? "🖼️" : viewingFile.type === "Video" ? "🎬" : viewingFile.type === "Audio" ? "🎵" : viewingFile.type === "Presentation" ? "🎯" : "📄"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-white truncate">{viewingFile.name}</p>
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
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-white"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
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
                <div className="mb-4 rounded-2xl overflow-hidden" style={{ background: "rgba(0,0,0,0.40)", border: "1px solid rgba(255,255,255,0.10)" }}>
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
                  className="w-full h-full min-h-[50vh] rounded-xl p-4 text-[13px] text-white font-mono resize-none outline-none leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}
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
    </div>
  );
}
