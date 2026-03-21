/**
 * routes/bundleOS.ts — Business OS Bundle Analysis
 * ──────────────────────────────────────────────────
 * Complete analysis of every major industry's replaceable digital expenses,
 * AI-native alternatives, and unified monthly bundle models.
 *
 * Routes:
 *   GET /bundle         → Full analysis UI
 *   GET /bundle/data    → Raw JSON data (all industries + capabilities)
 */

import { Router, type Request, type Response } from "express";
import { getPublicBaseUrl } from "../utils/publicUrl.js";

const router  = Router();
const IS_PROD = process.env["REPLIT_DEPLOYMENT"] === "1";

// ─────────────────────────────────────────────────────────────────────────────
// DATA MODEL
// ─────────────────────────────────────────────────────────────────────────────

interface DigitalTool {
  name:     string;
  vendor:   string;   // e.g. "Mailchimp"
  costLow:  number;   // monthly USD
  costHigh: number;
  category: string;   // Communication | Docs | CRM | Scheduling | Analytics | Training | Billing | HR | Operations
}

interface Industry {
  id:          string;
  name:        string;
  icon:        string;
  segment:     string;   // broad sector
  tools:       DigitalTool[];
  painPoints:  string[];
  savingsNote: string;
}

interface AICapability {
  id:          string;
  name:        string;
  icon:        string;
  tagline:     string;
  replaces:    string[];   // vendor names
  how:         string;
  cost:        string;     // what it costs the platform
  industries:  string[];   // industry IDs
  tier:        "solo" | "business" | "enterprise" | "all";
}

// ─────────────────────────────────────────────────────────────────────────────
// INDUSTRIES + THEIR DIGITAL EXPENSES
// ─────────────────────────────────────────────────────────────────────────────

const INDUSTRIES: Industry[] = [
  {
    id: "healthcare", name: "Healthcare / Medical Practice", icon: "🏥", segment: "Health",
    tools: [
      { name: "Patient Scheduling",      vendor: "Acuity / Kareo",        costLow: 25,  costHigh: 99,  category: "Scheduling" },
      { name: "HIPAA Messaging",         vendor: "Spruce Health",          costLow: 24,  costHigh: 49,  category: "Communication" },
      { name: "Patient Intake Forms",    vendor: "JotForm / FormStack",    costLow: 35,  costHigh: 83,  category: "Docs" },
      { name: "Clinical Notes / EHR",    vendor: "SimplePractice",         costLow: 29,  costHigh: 99,  category: "Docs" },
      { name: "Email Newsletters",       vendor: "Mailchimp",              costLow: 20,  costHigh: 110, category: "Communication" },
      { name: "Billing & Invoicing",     vendor: "Square / Stripe",        costLow: 0,   costHigh: 60,  category: "Billing" },
      { name: "E-Signatures (consent)",  vendor: "DocuSign",               costLow: 25,  costHigh: 45,  category: "Docs" },
      { name: "Staff Training LMS",      vendor: "TalentLMS",              costLow: 59,  costHigh: 159, category: "Training" },
    ],
    painPoints: ["Fragmented patient communication", "Expensive per-provider scheduling seats", "Manual intake paperwork"],
    savingsNote: "Avg $217–704/mo across 8 tools → replaced at $79/mo",
  },
  {
    id: "legal", name: "Legal / Law Firm", icon: "⚖", segment: "Professional Services",
    tools: [
      { name: "Client Intake & Onboarding", vendor: "Clio Grow",           costLow: 49,  costHigh: 89,  category: "CRM" },
      { name: "E-Signatures",               vendor: "DocuSign / HelloSign", costLow: 25,  costHigh: 45,  category: "Docs" },
      { name: "Contract Templates",         vendor: "ContractPodAi",        costLow: 50,  costHigh: 150, category: "Docs" },
      { name: "Time & Billing",             vendor: "TimeSolv / Clio",      costLow: 28,  costHigh: 65,  category: "Billing" },
      { name: "Client Portal",              vendor: "MyCase / Clio",         costLow: 39,  costHigh: 79,  category: "CRM" },
      { name: "Knowledge Base / SOPs",      vendor: "Notion",               costLow: 8,   costHigh: 16,  category: "Docs" },
      { name: "Email Marketing",            vendor: "Mailchimp",             costLow: 20,  costHigh: 60,  category: "Communication" },
      { name: "Calendar / Scheduling",      vendor: "Calendly",              costLow: 8,   costHigh: 16,  category: "Scheduling" },
    ],
    painPoints: ["Every matter requires a document workflow", "Billing is manual and error-prone", "Client communication is scattered"],
    savingsNote: "Avg $227–520/mo across 8 tools → replaced at $79/mo",
  },
  {
    id: "realestate", name: "Real Estate", icon: "🏠", segment: "Property",
    tools: [
      { name: "CRM / Lead Nurturing",       vendor: "Follow Up Boss",       costLow: 69,  costHigh: 499, category: "CRM" },
      { name: "Email Campaigns",            vendor: "Mailchimp / kvCore",   costLow: 20,  costHigh: 150, category: "Communication" },
      { name: "E-Signatures",               vendor: "DocuSign / DotLoop",   costLow: 25,  costHigh: 65,  category: "Docs" },
      { name: "Social Scheduling",          vendor: "Buffer / Hootsuite",   costLow: 18,  costHigh: 99,  category: "Communication" },
      { name: "Listing Description Writer", vendor: "ChatGPT Pro",          costLow: 20,  costHigh: 20,  category: "Docs" },
      { name: "Scheduling / Showings",      vendor: "Calendly / ShowingTime",costLow: 8,  costHigh: 49,  category: "Scheduling" },
      { name: "Transaction Management",     vendor: "DotLoop / Skyslope",   costLow: 31,  costHigh: 99,  category: "Docs" },
      { name: "Analytics / Market Reports", vendor: "Cloud CMA / RPR",      costLow: 35,  costHigh: 100, category: "Analytics" },
    ],
    painPoints: ["AI writing tools purchased separately", "Multiple disconnected CRM and e-sig tools", "Social posting done manually"],
    savingsNote: "Avg $226–1081/mo across 8 tools → replaced at $79/mo",
  },
  {
    id: "accounting", name: "Accounting / Bookkeeping", icon: "📊", segment: "Professional Services",
    tools: [
      { name: "Client Portal / File Share",  vendor: "ShareFile / Box",     costLow: 30,  costHigh: 75,  category: "Docs" },
      { name: "E-Signatures",               vendor: "DocuSign",             costLow: 25,  costHigh: 45,  category: "Docs" },
      { name: "Proposal / Engagement Ltrs", vendor: "PandaDoc / Proposify", costLow: 19,  costHigh: 49,  category: "Docs" },
      { name: "Client Newsletter",          vendor: "Mailchimp",            costLow: 20,  costHigh: 80,  category: "Communication" },
      { name: "Scheduling",                 vendor: "Calendly",             costLow: 8,   costHigh: 16,  category: "Scheduling" },
      { name: "Internal SOPs / Docs",       vendor: "Notion / Confluence",  costLow: 8,   costHigh: 50,  category: "Docs" },
      { name: "Staff Training",             vendor: "TalentLMS",            costLow: 59,  costHigh: 159, category: "Training" },
      { name: "Survey / Client Feedback",   vendor: "Typeform",             costLow: 25,  costHigh: 83,  category: "Operations" },
    ],
    painPoints: ["Client deliverables require multiple platforms", "Staff training is expensive per seat", "Engagement letters are manually drafted"],
    savingsNote: "Avg $194–557/mo across 8 tools → replaced at $79/mo",
  },
  {
    id: "education", name: "Education / Tutoring / Coaching", icon: "🎓", segment: "Education",
    tools: [
      { name: "Course / LMS Platform",     vendor: "Teachable / Thinkific", costLow: 39,  costHigh: 199, category: "Training" },
      { name: "Email Marketing",           vendor: "ConvertKit",            costLow: 29,  costHigh: 111, category: "Communication" },
      { name: "Scheduling / Booking",      vendor: "Acuity / Calendly",     costLow: 15,  costHigh: 49,  category: "Scheduling" },
      { name: "Video Async / Loom",        vendor: "Loom",                  costLow: 8,   costHigh: 12,  category: "Communication" },
      { name: "Community / Forum",         vendor: "Circle / Mighty Nets",  costLow: 39,  costHigh: 119, category: "CRM" },
      { name: "Student Progress Tracking", vendor: "Various / Notion",      costLow: 8,   costHigh: 30,  category: "Analytics" },
      { name: "Intake / Application Forms",vendor: "Typeform / JotForm",    costLow: 25,  costHigh: 83,  category: "Operations" },
      { name: "Certificate Generation",   vendor: "Canva / Accredible",    costLow: 13,  costHigh: 70,  category: "Docs" },
    ],
    painPoints: ["Course content creation is expensive to outsource", "Platform fees consume 10-30% of revenue", "Student tracking is manual"],
    savingsNote: "Avg $176–673/mo across 8 tools → replaced at $79/mo",
  },
  {
    id: "restaurants", name: "Restaurants / Food Service", icon: "🍽", segment: "Hospitality",
    tools: [
      { name: "Email / SMS Marketing",     vendor: "Mailchimp / Klaviyo",   costLow: 20,  costHigh: 150, category: "Communication" },
      { name: "Online Reservations",       vendor: "OpenTable / Resy",      costLow: 49,  costHigh: 249, category: "Scheduling" },
      { name: "Menu Builder / Digital",    vendor: "Canva / Toast",         costLow: 13,  costHigh: 50,  category: "Docs" },
      { name: "Loyalty Program",           vendor: "Stamp Me / Fivestars",  costLow: 30,  costHigh: 89,  category: "CRM" },
      { name: "Social Media Scheduling",   vendor: "Buffer / Later",        costLow: 18,  costHigh: 45,  category: "Communication" },
      { name: "Staff Scheduling",          vendor: "7shifts / HotSchedules",costLow: 20,  costHigh: 65,  category: "HR" },
      { name: "Catering / Event Invoicing",vendor: "HoneyBook / Wave",      costLow: 0,   costHigh: 49,  category: "Billing" },
      { name: "Review Management",         vendor: "Podium / Birdeye",      costLow: 289, costHigh: 499, category: "CRM" },
    ],
    painPoints: ["Review management costs are disproportionate", "Loyalty programs require third-party infrastructure", "Staff scheduling is separate from everything else"],
    savingsNote: "Avg $439–1196/mo across 8 tools → replaced at $79/mo",
  },
  {
    id: "retail", name: "Retail / E-commerce", icon: "🛒", segment: "Commerce",
    tools: [
      { name: "Email Marketing",           vendor: "Klaviyo / Mailchimp",   costLow: 30,  costHigh: 400, category: "Communication" },
      { name: "SMS Marketing",             vendor: "Attentive / Postscript",costLow: 100, costHigh: 400, category: "Communication" },
      { name: "Product Feed Management",   vendor: "DataFeedWatch",         costLow: 59,  costHigh: 249, category: "Operations" },
      { name: "Review Platform",           vendor: "Okendo / Yotpo",        costLow: 19,  costHigh: 299, category: "CRM" },
      { name: "Helpdesk / Support",        vendor: "Gorgias / Zendesk",     costLow: 10,  costHigh: 300, category: "Operations" },
      { name: "Analytics",                 vendor: "Triplewhale / Northbeam",costLow: 129,costHigh: 499, category: "Analytics" },
      { name: "Loyalty / Rewards",         vendor: "Smile.io / LoyaltyLion",costLow: 49,  costHigh: 199, category: "CRM" },
      { name: "Affiliate Management",      vendor: "Refersion / Impact",    costLow: 89,  costHigh: 299, category: "Operations" },
    ],
    painPoints: ["Analytics tools alone cost $100-500/mo", "Affiliate tracking requires separate platform", "Feed management is a forgotten $60-250/mo line item"],
    savingsNote: "Avg $485–2145/mo across 8 tools → replaced at $299/mo",
  },
  {
    id: "construction", name: "Construction / Contractors", icon: "🔨", segment: "Trades",
    tools: [
      { name: "Estimate / Proposal",       vendor: "Jobber / Housecall Pro", costLow: 29, costHigh: 249, category: "Billing" },
      { name: "Invoice & Payment",         vendor: "QuickBooks / Stripe",    costLow: 30, costHigh: 85,  category: "Billing" },
      { name: "Scheduling / Dispatch",     vendor: "ServiceTitan / Jobber",  costLow: 65, costHigh: 398, category: "Scheduling" },
      { name: "Project Management",        vendor: "Buildertrend / Procore", costLow: 99, costHigh: 499, category: "Operations" },
      { name: "Client Communication",      vendor: "Jobber / Email",         costLow: 29, costHigh: 75,  category: "Communication" },
      { name: "Document / Contract Mgmt",  vendor: "DocuSign / PandaDoc",   costLow: 25, costHigh: 69,  category: "Docs" },
      { name: "Photo Documentation",       vendor: "CompanyCam / Loom",      costLow: 49, costHigh: 69,  category: "Docs" },
      { name: "Lead / CRM",                vendor: "Jobber / HubSpot",       costLow: 29, costHigh: 150, category: "CRM" },
    ],
    painPoints: ["Field service software costs $99-499/mo alone", "Estimates are manually typed", "Client job updates require manual effort"],
    savingsNote: "Avg $355–1594/mo across 8 tools → replaced at $79/mo",
  },
  {
    id: "fitness", name: "Fitness / Personal Training / Yoga", icon: "💪", segment: "Wellness",
    tools: [
      { name: "Class Booking Software",    vendor: "Mindbody / Glofox",      costLow: 99, costHigh: 349, category: "Scheduling" },
      { name: "Email Marketing",           vendor: "Mailchimp / ActiveCampaign",costLow:20,costHigh:149, category: "Communication" },
      { name: "Workout Plan Builder",      vendor: "TrueCoach / TrainHeroic",costLow: 19, costHigh: 99,  category: "Docs" },
      { name: "Waiver / Liability Forms",  vendor: "WaiverForever / DocuSign",costLow: 15, costHigh: 35, category: "Docs" },
      { name: "Nutrition / Habit Tracking",vendor: "CoachAccountable",       costLow: 20, costHigh: 67,  category: "Operations" },
      { name: "Newsletter / Blog",         vendor: "Substack / ConvertKit",  costLow: 0,  costHigh: 79,  category: "Communication" },
      { name: "Membership Billing",        vendor: "Stripe / Mindbody",      costLow: 0,  costHigh: 99,  category: "Billing" },
      { name: "Staff / Trainer Scheduling",vendor: "Homebase / When I Work", costLow: 20, costHigh: 55,  category: "HR" },
    ],
    painPoints: ["Mindbody alone costs $100-350/mo for basic features", "Workout plan delivery requires a separate app", "Waivers are a forgotten but necessary expense"],
    savingsNote: "Avg $193–932/mo across 8 tools → replaced at $79/mo",
  },
  {
    id: "beauty", name: "Beauty / Salon / Spa", icon: "✂", segment: "Wellness",
    tools: [
      { name: "Appointment Booking",       vendor: "Vagaro / Booker",        costLow: 25, costHigh: 85,  category: "Scheduling" },
      { name: "SMS & Email Reminders",     vendor: "Twilio / Podium",        costLow: 30, costHigh: 150, category: "Communication" },
      { name: "Loyalty Program",           vendor: "Fivestars / Stamp Me",   costLow: 30, costHigh: 89,  category: "CRM" },
      { name: "Online Store (retail)",     vendor: "Shopify / Square",       costLow: 29, costHigh: 79,  category: "Billing" },
      { name: "Gift Card Platform",        vendor: "Square / GiftUp",        costLow: 0,  costHigh: 19,  category: "Billing" },
      { name: "Staff Scheduling",          vendor: "Homebase / Deputy",      costLow: 20, costHigh: 55,  category: "HR" },
      { name: "Review Management",         vendor: "Podium / Birdeye",       costLow: 289,costHigh: 499, category: "CRM" },
      { name: "Client Communication",      vendor: "Mailchimp / Vagaro",     costLow: 20, costHigh: 60,  category: "Communication" },
    ],
    painPoints: ["Review management costs more than appointment software", "Gift cards require a separate platform", "Loyalty programs are under-utilized due to cost"],
    savingsNote: "Avg $443–1036/mo across 8 tools → replaced at $79/mo",
  },
  {
    id: "agency", name: "Marketing / Creative Agency", icon: "🎨", segment: "Professional Services",
    tools: [
      { name: "Project Management",        vendor: "Asana / ClickUp",        costLow: 10, costHigh: 24,  category: "Operations" },
      { name: "Client Reporting",          vendor: "DashThis / AgencyAnalytics",costLow:49,costHigh:299, category: "Analytics" },
      { name: "Proposal Software",         vendor: "PandaDoc / Proposify",   costLow: 19, costHigh: 99,  category: "Docs" },
      { name: "E-Signatures",              vendor: "DocuSign",               costLow: 25, costHigh: 45,  category: "Docs" },
      { name: "Time Tracking",             vendor: "Harvest / Toggl",        costLow: 12, costHigh: 22,  category: "Operations" },
      { name: "Social Scheduling",         vendor: "Hootsuite / Buffer",     costLow: 49, costHigh: 249, category: "Communication" },
      { name: "AI Writing Tools",          vendor: "Jasper / ChatGPT Team",  costLow: 20, costHigh: 99,  category: "Docs" },
      { name: "Client Portal",             vendor: "Copilot / HubSpot",      costLow: 29, costHigh: 79,  category: "CRM" },
    ],
    painPoints: ["Clients demand reporting dashboards most agencies manually rebuild", "AI writing tools are purchased per-seat", "Proposals are built in 3 different tools"],
    savingsNote: "Avg $213–916/mo across 8 tools → replaced at $299/mo",
  },
  {
    id: "consulting", name: "Consulting / Business Coaching", icon: "💼", segment: "Professional Services",
    tools: [
      { name: "Scheduling & Booking",      vendor: "Calendly / Acuity",      costLow: 8,  costHigh: 49,  category: "Scheduling" },
      { name: "Contract & Agreement",      vendor: "DocuSign / HelloSign",   costLow: 25, costHigh: 45,  category: "Docs" },
      { name: "Proposal Builder",          vendor: "PandaDoc / Proposify",   costLow: 19, costHigh: 49,  category: "Docs" },
      { name: "Course / Resource Library", vendor: "Teachable / Notion",     costLow: 39, costHigh: 119, category: "Training" },
      { name: "Email Sequences / CRM",     vendor: "ActiveCampaign / ConvertKit",costLow:29,costHigh:149,category: "Communication" },
      { name: "Invoice & Billing",         vendor: "HoneyBook / Stripe",     costLow: 0,  costHigh: 49,  category: "Billing" },
      { name: "Client Portal",             vendor: "Copilot / HubSpot",      costLow: 29, costHigh: 79,  category: "CRM" },
      { name: "Survey / Assessment",       vendor: "Typeform / SurveyMonkey",costLow: 25, costHigh: 83,  category: "Operations" },
    ],
    painPoints: ["Every engagement requires proposal + contract + invoice across 3 tools", "Course libraries priced per student", "Email sequences require marketing automation platforms"],
    savingsNote: "Avg $174–622/mo across 8 tools → replaced at $79/mo",
  },
  {
    id: "nonprofit", name: "Non-profit / Association", icon: "🤝", segment: "Non-profit",
    tools: [
      { name: "Email Marketing",           vendor: "Mailchimp / Constant Contact",costLow:20,costHigh:200,category: "Communication" },
      { name: "Donation Page",             vendor: "Donorbox / PayPal",      costLow: 0,  costHigh: 25,  category: "Billing" },
      { name: "Membership Management",     vendor: "WildApricot / MemberClicks",costLow:60,costHigh:250, category: "CRM" },
      { name: "Event Registration",        vendor: "Eventbrite / RSVPify",   costLow: 0,  costHigh: 25,  category: "Scheduling" },
      { name: "Volunteer Coordination",    vendor: "SignUpGenius / VolunteerHub",costLow:0, costHigh: 60, category: "Operations" },
      { name: "Newsletter / Blog",         vendor: "Substack / Ghost",       costLow: 0,  costHigh: 50,  category: "Communication" },
      { name: "Document / Policy Hub",     vendor: "Notion / Google Sites",  costLow: 0,  costHigh: 20,  category: "Docs" },
      { name: "Survey / Feedback",         vendor: "SurveyMonkey",           costLow: 25, costHigh: 50,  category: "Operations" },
    ],
    painPoints: ["Membership software costs $60-250/mo for basic functions", "Each tool requires separate login and management", "Budget constraints make per-seat pricing prohibitive"],
    savingsNote: "Avg $105–680/mo across 8 tools → replaced at $29/mo (non-profit discount).",
  },
  {
    id: "propertymanagement", name: "Property Management", icon: "🏢", segment: "Property",
    tools: [
      { name: "Tenant Communication",      vendor: "Buildium / AppFolio",    costLow: 52, costHigh: 300, category: "Communication" },
      { name: "Maintenance Request Forms", vendor: "Buildium / Fiix",        costLow: 52, costHigh: 200, category: "Operations" },
      { name: "Lease Document & E-sign",   vendor: "DocuSign / Avail",       costLow: 25, costHigh: 55,  category: "Docs" },
      { name: "Tenant Screening",          vendor: "TransUnion SmartMove",   costLow: 0,  costHigh: 40,  category: "Operations" },
      { name: "Online Rent Collection",    vendor: "Stripe / Buildium",      costLow: 0,  costHigh: 55,  category: "Billing" },
      { name: "Vendor / Contractor Portal",vendor: "Notion / Custom",        costLow: 8,  costHigh: 30,  category: "Docs" },
      { name: "Marketing / Listings",      vendor: "Zillow / Apartments.com",costLow: 0,  costHigh: 199, category: "Communication" },
      { name: "Owner Reporting",           vendor: "Buildium / Stessa",      costLow: 0,  costHigh: 50,  category: "Analytics" },
    ],
    painPoints: ["Property management software bundles features but costs $52-300/mo", "Lease e-signatures are an add-on cost", "Owner reports are manually assembled PDFs"],
    savingsNote: "Avg $137–929/mo across 8 tools → replaced at $79/mo",
  },
  {
    id: "insurance", name: "Insurance Agency", icon: "🛡", segment: "Financial Services",
    tools: [
      { name: "CRM / Pipeline",            vendor: "HubSpot / AgencyZoom",  costLow: 45, costHigh: 150, category: "CRM" },
      { name: "E-Signatures",              vendor: "DocuSign",               costLow: 25, costHigh: 45,  category: "Docs" },
      { name: "Email Marketing",           vendor: "Mailchimp",              costLow: 20, costHigh: 110, category: "Communication" },
      { name: "Client Renewal Reminders",  vendor: "HubSpot / EZLynx",      costLow: 30, costHigh: 100, category: "Communication" },
      { name: "Proposal Generator",        vendor: "PandaDoc",               costLow: 19, costHigh: 49,  category: "Docs" },
      { name: "Document Storage",          vendor: "ShareFile / Box",        costLow: 30, costHigh: 75,  category: "Docs" },
      { name: "Staff Training / CE",       vendor: "TalentLMS / Vector",     costLow: 59, costHigh: 159, category: "Training" },
      { name: "Agency Analytics",          vendor: "Applied Analytics",      costLow: 50, costHigh: 200, category: "Analytics" },
    ],
    painPoints: ["Renewal reminder sequences require marketing automation", "CE/training is a recurring separate expense", "Client proposals are manually assembled from carrier PDFs"],
    savingsNote: "Avg $278–888/mo across 8 tools → replaced at $79/mo",
  },
  {
    id: "staffing", name: "Staffing / Recruiting", icon: "👥", segment: "HR",
    tools: [
      { name: "ATS / Applicant Tracking",  vendor: "Greenhouse / Lever",     costLow: 99, costHigh: 500, category: "HR" },
      { name: "Job Board Posting",         vendor: "Indeed / LinkedIn",      costLow: 0,  costHigh: 500, category: "Operations" },
      { name: "Interview Scheduling",      vendor: "Calendly / Greenhouse",  costLow: 8,  costHigh: 49,  category: "Scheduling" },
      { name: "Candidate Assessment",      vendor: "Criteria / TestGorilla",  costLow: 40, costHigh: 400, category: "HR" },
      { name: "Offer Letter / E-sign",     vendor: "DocuSign / Greenhouse",  costLow: 25, costHigh: 65,  category: "Docs" },
      { name: "Candidate Communication",   vendor: "Email / Gem",            costLow: 0,  costHigh: 100, category: "Communication" },
      { name: "Onboarding Checklist",      vendor: "BambooHR / Notion",      costLow: 6,  costHigh: 99,  category: "HR" },
      { name: "Client Reporting",          vendor: "Custom / HubSpot",       costLow: 20, costHigh: 100, category: "Analytics" },
    ],
    painPoints: ["ATS alone costs $100-500/mo", "Assessment tools are expensive per-test", "Onboarding and offer letters require manual drafting"],
    savingsNote: "Avg $198–1813/mo across 8 tools → replaced at $299/mo",
  },
  {
    id: "events", name: "Events / Entertainment / Venues", icon: "🎪", segment: "Hospitality",
    tools: [
      { name: "Event Registration",        vendor: "Eventbrite / Splash",    costLow: 0,  costHigh: 99,  category: "Scheduling" },
      { name: "Email Marketing",           vendor: "Mailchimp / ActiveCampaign",costLow:20,costHigh:149, category: "Communication" },
      { name: "Venue / Client Contracts",  vendor: "HoneyBook / DocuSign",   costLow: 19, costHigh: 59,  category: "Docs" },
      { name: "Invoice & Deposits",        vendor: "HoneyBook / Stripe",     costLow: 0,  costHigh: 59,  category: "Billing" },
      { name: "Social Scheduling",         vendor: "Later / Buffer",         costLow: 18, costHigh: 80,  category: "Communication" },
      { name: "Event Run-of-Show Docs",    vendor: "Notion / Google Docs",   costLow: 0,  costHigh: 16,  category: "Docs" },
      { name: "Staff / Vendor Comms",      vendor: "Slack / Email",          costLow: 0,  costHigh: 15,  category: "Communication" },
      { name: "Photo / Media Delivery",    vendor: "Pic-Time / Sprout",      costLow: 15, costHigh: 55,  category: "Docs" },
    ],
    painPoints: ["Eventbrite takes 3-7% of every ticket", "Run-of-show docs are in Google Docs, disconnected from client records", "Photo delivery is a separate platform nobody thinks about"],
    savingsNote: "Avg $72–532/mo + % fees → replaced at $79/mo flat",
  },
  {
    id: "media", name: "Media / Content Publishing", icon: "📰", segment: "Media",
    tools: [
      { name: "Newsletter Platform",       vendor: "Substack / Ghost",       costLow: 0,  costHigh: 199, category: "Communication" },
      { name: "Email Delivery",            vendor: "Mailchimp / Beehiiv",    costLow: 20, costHigh: 250, category: "Communication" },
      { name: "Social Scheduling",         vendor: "Buffer / Publer",        costLow: 18, costHigh: 80,  category: "Communication" },
      { name: "Analytics / Attribution",   vendor: "Chartbeat / Amplitude",  costLow: 50, costHigh: 999, category: "Analytics" },
      { name: "Subscription Billing",      vendor: "Stripe / Memberful",     costLow: 0,  costHigh: 49,  category: "Billing" },
      { name: "SEO / Content Audit",       vendor: "Ahrefs / Semrush",       costLow: 99, costHigh: 499, category: "Operations" },
      { name: "AI Writing Assistant",      vendor: "Jasper / ChatGPT",       costLow: 20, costHigh: 99,  category: "Docs" },
      { name: "Link Management",           vendor: "Bitly / Pretty Links",   costLow: 8,  costHigh: 35,  category: "Operations" },
    ],
    painPoints: ["Analytics alone costs $50-999/mo", "Newsletter + email delivery are often two separate tools", "AI writing purchased separately from distribution"],
    savingsNote: "Avg $215–2210/mo across 8 tools → replaced at $299/mo",
  },
  {
    id: "saas", name: "Technology / SaaS Startups", icon: "💻", segment: "Technology",
    tools: [
      { name: "Helpdesk / Support",        vendor: "Intercom / Zendesk",     costLow: 39, costHigh: 499, category: "Operations" },
      { name: "Product Analytics",         vendor: "Mixpanel / Amplitude",   costLow: 20, costHigh: 999, category: "Analytics" },
      { name: "Email Marketing",           vendor: "Customer.io / Mailchimp", costLow: 25,costHigh: 400, category: "Communication" },
      { name: "Documentation / KB",        vendor: "Notion / Confluence",    costLow: 8,  costHigh: 100, category: "Docs" },
      { name: "Internal Comms",            vendor: "Slack",                  costLow: 7,  costHigh: 12,  category: "Communication" },
      { name: "Onboarding / In-app Guide", vendor: "Appcues / UserGuiding",  costLow: 249,costHigh: 999, category: "Training" },
      { name: "Status Page",               vendor: "Statuspage.io",          costLow: 29, costHigh: 399, category: "Operations" },
      { name: "AI Coding / Productivity",  vendor: "GitHub Copilot",         costLow: 10, costHigh: 39,  category: "Operations" },
    ],
    painPoints: ["Intercom alone is $39-499/mo for chat support", "Onboarding tools like Appcues cost $249+ before any customers", "Product analytics is a $20-999/mo black box"],
    savingsNote: "Avg $387–3447/mo across 8 tools → replaced at $299/mo",
  },
  {
    id: "trades", name: "Trades (Plumbing / HVAC / Electrical)", icon: "🔧", segment: "Trades",
    tools: [
      { name: "Field Service / Scheduling",vendor: "Housecall Pro / Jobber", costLow: 49, costHigh: 249, category: "Scheduling" },
      { name: "Estimate Builder",          vendor: "Jobber / ServiceTitan",  costLow: 49, costHigh: 198, category: "Billing" },
      { name: "Invoice & Payment",         vendor: "QuickBooks / Square",    costLow: 30, costHigh: 85,  category: "Billing" },
      { name: "Customer Follow-up / CRM",  vendor: "Jobber / HubSpot",       costLow: 49, costHigh: 150, category: "CRM" },
      { name: "Review Requests",           vendor: "Podium / Birdeye",       costLow: 289,costHigh: 499, category: "CRM" },
      { name: "Technician GPS / Dispatch", vendor: "ServiceTitan",           costLow: 125,costHigh: 398, category: "Operations" },
      { name: "Service Agreement Billing", vendor: "Stripe / ServiceTitan",  costLow: 0,  costHigh: 125, category: "Billing" },
      { name: "Training / Safety Docs",    vendor: "TalentLMS / Custom",     costLow: 59, costHigh: 159, category: "Training" },
    ],
    painPoints: ["Review management costs more than the service job", "ServiceTitan starts at $125/mo with aggressive up-sells", "Training and safety documentation is an afterthought"],
    savingsNote: "Avg $650–1863/mo across 8 tools → replaced at $79/mo",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AI-NATIVE CAPABILITIES (what the platform can provide)
// ─────────────────────────────────────────────────────────────────────────────

const AI_CAPABILITIES: AICapability[] = [
  {
    id: "ai_email",
    name: "AI Email & Newsletter Engine",
    icon: "✉",
    tagline: "Write, schedule, and deliver in one action.",
    replaces: ["Mailchimp", "Constant Contact", "ConvertKit", "Beehiiv", "Substack", "ActiveCampaign", "Customer.io", "Klaviyo"],
    how: "GPT-4o drafts the message from a brief. Resend delivers it. Analytics tracked natively. No per-subscriber fees under 50k sends/mo. Marginal cost: ~$0.002 per send.",
    cost: "~$0.002/email (Resend) + $0.01/AI generation (OpenAI)",
    industries: ["healthcare", "legal", "realestate", "accounting", "education", "restaurants", "retail", "fitness", "beauty", "agency", "consulting", "nonprofit", "insurance", "events", "media", "saas", "trades"],
    tier: "all",
  },
  {
    id: "ai_scheduling",
    name: "AI Appointment & Scheduling Layer",
    icon: "📅",
    tagline: "Booking links without Calendly. Reminders without Twilio.",
    replaces: ["Calendly", "Acuity", "Mindbody", "Vagaro", "Booker", "OpenTable", "ShowingTime", "Glofox"],
    how: "Hosted booking form on your platform subdomain. AI confirms, reminds, and reschedules via email. SMS reminders via Twilio (existing integration). No per-seat licensing.",
    cost: "~$0.01/SMS (Twilio) + $0.002/email confirmation",
    industries: ["healthcare", "legal", "realestate", "education", "restaurants", "fitness", "beauty", "consulting", "insurance", "staffing", "events", "trades"],
    tier: "business",
  },
  {
    id: "ai_docs",
    name: "AI Document & Contract Generator",
    icon: "📄",
    tagline: "Every contract, proposal, SOP, and intake form — generated in seconds.",
    replaces: ["DocuSign", "HelloSign", "PandaDoc", "Proposify", "HoneyBook", "LegalZoom templates", "ContractPodAi", "Notion templates"],
    how: "GPT-4o generates the document from a structured brief. Platform delivers via email as PDF. E-signature via inline confirmation link (no DocuSign seat required). Templates stored internally.",
    cost: "~$0.05/document generation (OpenAI) + $0.002/email delivery",
    industries: ["healthcare", "legal", "realestate", "accounting", "construction", "consulting", "nonprofit", "propertymanagement", "insurance", "staffing", "events", "trades"],
    tier: "business",
  },
  {
    id: "ai_training",
    name: "AI Training & Onboarding System",
    icon: "🎓",
    tagline: "Turn any document into a training module. Onboard anyone in minutes.",
    replaces: ["TalentLMS", "Teachable", "Thinkific", "Kajabi", "Appcues", "UserGuiding", "WalkMe", "Scribe", "Loom (async)"],
    how: "Upload a PDF or paste text → GPT-4o generates structured modules with summaries, key points, and quizzes. Delivered as hosted pages with completion tracking. Certificates generated automatically. Cost: pennies per course generation.",
    cost: "~$0.10/course module generation (OpenAI) + hosting (included)",
    industries: ["healthcare", "legal", "accounting", "education", "fitness", "construction", "insurance", "staffing", "saas", "trades"],
    tier: "business",
  },
  {
    id: "ai_crm",
    name: "AI CRM & Customer Intelligence",
    icon: "👥",
    tagline: "Know every customer. Act on every signal.",
    replaces: ["HubSpot", "Salesforce", "Pipedrive", "Follow Up Boss", "AgencyZoom", "Buildium tenant mgmt", "Jobber", "WildApricot"],
    how: "Internal Customer Store (already live) extended with AI-generated follow-up sequences, purchase history analysis, and churn prediction. No per-seat pricing. Marginal cost: storage + AI calls for analysis.",
    cost: "~$0.01/AI analysis call (OpenAI) + PostgreSQL storage (fixed)",
    industries: ["realestate", "legal", "construction", "fitness", "beauty", "consulting", "nonprofit", "propertymanagement", "insurance", "staffing", "trades"],
    tier: "business",
  },
  {
    id: "ai_analytics",
    name: "AI Analytics & Reporting Layer",
    icon: "📊",
    tagline: "Plain-language business intelligence. No dashboards to configure.",
    replaces: ["Google Analytics", "Mixpanel", "Amplitude", "DashThis", "AgencyAnalytics", "Chartbeat", "Triplewhale", "Applied Analytics"],
    how: "Platform captures all purchase events, page visits, and conversion signals. GPT-4o generates a weekly plain-English business summary: 'Your top product this week was X. Three customers abandoned checkout at Y.' Zero config.",
    cost: "~$0.03/weekly report generation (OpenAI) + existing PostgreSQL",
    industries: ["retail", "media", "saas", "agency", "realestate", "insurance", "staffing", "education"],
    tier: "business",
  },
  {
    id: "ai_affiliate",
    name: "AI Affiliate & Referral Engine",
    icon: "🔗",
    tagline: "Built-in referral tracking. No Refersion or Impact.",
    replaces: ["Refersion", "Impact", "ShareASale", "Post Affiliate Pro", "Tapfiliate"],
    how: "Native affiliate attribution already live in the platform. AI generates personalized affiliate recruitment emails and commission reports. No platform fee per-sale.",
    cost: "Storage + ~$0.01/report generation",
    industries: ["retail", "education", "fitness", "media", "saas", "consulting"],
    tier: "business",
  },
  {
    id: "ai_content",
    name: "AI Content & Copy Engine",
    icon: "✍",
    tagline: "Product descriptions. Social posts. Sales emails. All from one brief.",
    replaces: ["Jasper", "ChatGPT Team", "Copy.ai", "Writesonic", "Buffer (copy features)", "Later (caption generator)"],
    how: "Already live at /api/semantic/content/. GPT-4o generates product descriptions, email copy, social captions, and SEO content from a brief. Feed directly into email campaigns or store listings.",
    cost: "~$0.02/content piece (OpenAI)",
    industries: ["retail", "media", "agency", "realestate", "education", "restaurants", "fitness", "beauty"],
    tier: "solo",
  },
  {
    id: "ai_billing",
    name: "AI Billing & Subscription Layer",
    icon: "💳",
    tagline: "Invoices. Subscriptions. One-time charges. All Stripe-native.",
    replaces: ["FreshBooks", "Wave", "HoneyBook billing", "QuickBooks invoicing", "Square invoicing", "Donorbox", "Memberful"],
    how: "Stripe already integrated. Platform generates and sends invoices via AI, manages subscription tiers, handles failed payment flows, and generates revenue summaries. No additional billing software.",
    cost: "Stripe fees (2.9% + $0.30 — existing) + $0.002/email invoice",
    industries: ["healthcare", "legal", "construction", "consulting", "nonprofit", "propertymanagement", "events", "fitness", "staffing", "trades"],
    tier: "all",
  },
  {
    id: "ai_helpdesk",
    name: "AI Helpdesk & Support Layer",
    icon: "🎧",
    tagline: "Answer every question before it becomes a ticket.",
    replaces: ["Zendesk", "Freshdesk", "Intercom", "Gorgias", "Help Scout", "Tidio"],
    how: "AI-generated FAQ pages built from your product/service data. Email-based support with GPT-4o draft responses sent to the owner for one-click approval. Knowledge base generated automatically from past Q&A.",
    cost: "~$0.05/response draft (OpenAI) + email delivery",
    industries: ["retail", "saas", "education", "fitness", "beauty", "propertymanagement"],
    tier: "business",
  },
  {
    id: "ai_social",
    name: "AI Social Media Scheduler",
    icon: "📱",
    tagline: "30 posts scheduled in 5 minutes.",
    replaces: ["Buffer", "Hootsuite", "Later", "Publer", "Sprout Social", "Metricool"],
    how: "AI generates a month of social posts from your product catalog and events. Owner reviews and approves. Posts scheduled and delivered via platform-stored queue with manual publish step. Zero per-platform seat fees.",
    cost: "~$0.01/post generation (OpenAI) + storage",
    industries: ["retail", "restaurants", "fitness", "beauty", "realestate", "events", "media", "agency"],
    tier: "solo",
  },
  {
    id: "ai_forms",
    name: "AI Form & Survey Builder",
    icon: "📋",
    tagline: "Create any form in natural language. Collect responses natively.",
    replaces: ["Typeform", "SurveyMonkey", "JotForm", "FormStack", "Google Forms Pro", "Tally"],
    how: "Describe the form → AI generates it as a hosted page. Responses stored in platform database. AI summarizes results in plain English. No per-response pricing.",
    cost: "~$0.02/form generation (OpenAI) + storage",
    industries: ["healthcare", "legal", "accounting", "education", "fitness", "beauty", "consulting", "nonprofit", "insurance", "staffing", "events"],
    tier: "business",
  },
  {
    id: "ai_feeds",
    name: "AI Product Feed & Catalog Exporter",
    icon: "📦",
    tagline: "Shopify CSV. WooCommerce. Google Shopping. Amazon. All from one product layer.",
    replaces: ["DataFeedWatch", "Channable", "GoDataFeed", "Feedonomics", "Shopify subscriptions for catalogs"],
    how: "Already live in the Semantic Product Layer. Products defined once, exported to any channel format automatically. AI enriches product descriptions per-channel. Zero third-party feed management fee.",
    cost: "Storage + ~$0.01/enrichment (OpenAI)",
    industries: ["retail", "education", "media", "agency"],
    tier: "business",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BUNDLE TIERS
// ─────────────────────────────────────────────────────────────────────────────

const TIERS = [
  {
    name:       "Solo",
    price:      29,
    slug:       "solo",
    color:      "#6366f1",
    bg:         "rgba(99,102,241,0.1)",
    border:     "rgba(99,102,241,0.3)",
    icon:       "◇",
    tagline:    "Individual operators replacing their core stack.",
    capabilities: ["ai_email","ai_content","ai_social","ai_billing"],
    replaced:   ["Mailchimp","ConvertKit","Jasper","Buffer","FreshBooks invoicing"],
    savedLow:   85,
    savedHigh:  450,
  },
  {
    name:       "Business",
    price:      79,
    slug:       "business",
    color:      "#06b6d4",
    bg:         "rgba(6,182,212,0.1)",
    border:     "rgba(6,182,212,0.3)",
    icon:       "◈",
    tagline:    "Small businesses eliminating their entire SaaS stack.",
    capabilities: ["ai_email","ai_scheduling","ai_docs","ai_training","ai_crm","ai_analytics","ai_affiliate","ai_content","ai_billing","ai_helpdesk","ai_social","ai_forms","ai_feeds"],
    replaced:   ["Mailchimp","Calendly","DocuSign","TalentLMS","HubSpot","Mixpanel","Refersion","Jasper","FreshBooks","Zendesk","Buffer","Typeform","DataFeedWatch"],
    savedLow:   200,
    savedHigh:  1200,
  },
  {
    name:       "Enterprise",
    price:      299,
    slug:       "enterprise",
    color:      "#f59e0b",
    bg:         "rgba(245,158,11,0.1)",
    border:     "rgba(245,158,11,0.3)",
    icon:       "◉",
    tagline:    "Multi-location and high-volume operations.",
    capabilities: ["ai_email","ai_scheduling","ai_docs","ai_training","ai_crm","ai_analytics","ai_affiliate","ai_content","ai_billing","ai_helpdesk","ai_social","ai_forms","ai_feeds"],
    replaced:   ["ServiceTitan","Intercom","Amplitude","Refersion","Salesforce","Appcues","Statuspage.io","GitHub Copilot (team)","Klaviyo","DashThis","PandaDoc"],
    savedLow:   500,
    savedHigh:  5000,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Data endpoint
// ─────────────────────────────────────────────────────────────────────────────

router.get("/data", (_req: Request, res: Response) => {
  const totalTools   = AI_CAPABILITIES.reduce((s, c) => s + c.replaces.length, 0);
  const avgSavedLow  = Math.round(INDUSTRIES.reduce((s, ind) => {
    const low = ind.tools.reduce((a, t) => a + t.costLow, 0);
    return s + low;
  }, 0) / INDUSTRIES.length);
  const avgSavedHigh = Math.round(INDUSTRIES.reduce((s, ind) => {
    const hi = ind.tools.reduce((a, t) => a + t.costHigh, 0);
    return s + hi;
  }, 0) / INDUSTRIES.length);

  res.json({
    ok: true,
    summary: {
      industries: INDUSTRIES.length,
      aiCapabilities: AI_CAPABILITIES.length,
      toolsReplaced: totalTools,
      avgMonthlySpendLow:  avgSavedLow,
      avgMonthlySpendHigh: avgSavedHigh,
      tiers: TIERS.map(t => ({ name: t.name, price: t.price, savedLow: t.savedLow, savedHigh: t.savedHigh })),
    },
    industries:     INDUSTRIES,
    aiCapabilities: AI_CAPABILITIES,
    tiers:          TIERS,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Full UI
// ─────────────────────────────────────────────────────────────────────────────

router.get("/", (_req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  const totalTools     = AI_CAPABILITIES.reduce((s, c) => s + c.replaces.length, 0);
  const totalIndustries = INDUSTRIES.length;
  const totalCapabilities = AI_CAPABILITIES.length;
  const avgSpend = "$370";

  const industryCardsHtml = INDUSTRIES.map(ind => {
    const totalLow  = ind.tools.reduce((s, t) => s + t.costLow, 0);
    const totalHigh = ind.tools.reduce((s, t) => s + t.costHigh, 0);
    const toolRowsHtml = ind.tools.map(t =>
      `<tr>
        <td class="tt-name">${t.name}</td>
        <td class="tt-vendor">${t.vendor}</td>
        <td class="tt-cat">${t.category}</td>
        <td class="tt-cost">$${t.costLow === 0 ? "0" : t.costLow}–$${t.costHigh}<span>/mo</span></td>
      </tr>`
    ).join("");
    const pains = ind.painPoints.map(p => `<li>${p}</li>`).join("");

    return `
    <div class="ind-card" id="ind-${ind.id}">
      <div class="ind-header" onclick="toggleInd('${ind.id}')">
        <div class="ind-left">
          <span class="ind-icon">${ind.icon}</span>
          <div>
            <div class="ind-name">${ind.name}</div>
            <div class="ind-segment">${ind.segment}</div>
          </div>
        </div>
        <div class="ind-right">
          <div class="ind-cost">
            <span class="cost-low">$${totalLow}/mo</span>
            <span class="cost-sep">→</span>
            <span class="cost-high">$${totalHigh}/mo</span>
          </div>
          <div class="ind-tools-count">${ind.tools.length} tools</div>
          <div class="ind-arrow" id="arr-${ind.id}">▸</div>
        </div>
      </div>
      <div class="ind-body" id="body-${ind.id}" style="display:none;">
        <div class="ind-body-inner">
          <table class="tool-table">
            <thead><tr><th>Tool</th><th>Vendor(s)</th><th>Category</th><th>Monthly Cost</th></tr></thead>
            <tbody>${toolRowsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="tf-label">Total monthly spend (range)</td>
                <td class="tf-total">$${totalLow}–$${totalHigh}</td>
              </tr>
            </tfoot>
          </table>
          <div class="pain-points">
            <div class="pp-label">Key pain points this industry faces:</div>
            <ul class="pp-list">${pains}</ul>
          </div>
          <div class="ind-savings-note">${ind.savingsNote}</div>
        </div>
      </div>
    </div>`;
  }).join("");

  const capCardsHtml = AI_CAPABILITIES.map(cap => {
    const replacesTags = cap.replaces.map(v =>
      `<span class="rep-tag">${v}</span>`
    ).join("");
    const tierColor = { all: "#6366f1", solo: "#818cf8", business: "#06b6d4", enterprise: "#f59e0b" }[cap.tier] ?? "#6366f1";
    const tierLabel = { all: "All Tiers", solo: "Solo+", business: "Business+", enterprise: "Enterprise" }[cap.tier] ?? cap.tier;

    return `
    <div class="cap-card">
      <div class="cap-top">
        <span class="cap-icon">${cap.icon}</span>
        <div class="cap-tier-chip" style="color:${tierColor};border-color:${tierColor}30;background:${tierColor}12;">${tierLabel}</div>
      </div>
      <div class="cap-name">${cap.name}</div>
      <div class="cap-tagline">${cap.tagline}</div>
      <div class="cap-how">${cap.how}</div>
      <div class="cap-cost-row">
        <span class="cap-cost-label">Platform cost</span>
        <span class="cap-cost-val">${cap.cost}</span>
      </div>
      <div class="cap-replaces-label">Replaces:</div>
      <div class="cap-replaces">${replacesTags}</div>
    </div>`;
  }).join("");

  const tierCardsHtml = TIERS.map(tier => {
    const capList = tier.capabilities.map(id => {
      const cap = AI_CAPABILITIES.find(c => c.id === id);
      return cap ? `<li>${cap.icon} ${cap.name}</li>` : "";
    }).join("");
    const replacedTags = tier.replaced.map(v => `<span class="rep-tag">${v}</span>`).join("");

    return `
    <div class="tier-card" style="border-color:${tier.border};background:${tier.bg};">
      <div class="tier-icon" style="color:${tier.color};">${tier.icon}</div>
      <div class="tier-name" style="color:${tier.color};">${tier.name}</div>
      <div class="tier-price">$${tier.price}<span>/mo</span></div>
      <div class="tier-tagline">${tier.tagline}</div>
      <div class="tier-saved">Replaces $${tier.savedLow}–$${tier.savedHigh}/mo in tools</div>
      <div class="tier-sep"></div>
      <div class="tier-cap-label">AI capabilities included:</div>
      <ul class="tier-cap-list">${capList}</ul>
      <div class="tier-sep"></div>
      <div class="tier-replaces-label">Key vendors replaced:</div>
      <div class="tier-replaces">${replacedTags}</div>
      <a href="${BASE}/join/landing" class="tier-cta" style="background:${tier.color};">Get ${tier.name} →</a>
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Business OS Bundle — CreateAI Brain</title>
  <style>
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    :root {
      --bg:#020617; --s1:#0d1526; --s2:#111827; --s3:#1e293b; --s4:#243044;
      --line:#1e293b; --line2:#2d3748;
      --t1:#e2e8f0; --t2:#94a3b8; --t3:#64748b; --t4:#475569;
      --ind:#6366f1; --cyan:#06b6d4; --em:#10b981; --am:#f59e0b;
    }
    html, body { background:var(--bg); color:var(--t1); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:14px; }
    a { color:inherit; text-decoration:none; }

    /* ── Header ── */
    .hdr { border-bottom:1px solid var(--line); padding:0 28px; background:rgba(2,6,23,0.95); backdrop-filter:blur(12px); position:sticky; top:0; z-index:100; }
    .hdr-inner { max-width:1400px; margin:0 auto; height:48px; display:flex; align-items:center; gap:14px; }
    .logo { font-size:1rem; font-weight:900; letter-spacing:-0.03em; }
    .logo span { color:var(--ind); }
    .mode-chip { font-size:0.58rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; border-radius:99px; padding:3px 9px; }
    .mode-test { background:rgba(245,158,11,0.12); color:#fcd34d; border:1px solid rgba(245,158,11,0.22); }
    .mode-live { background:rgba(16,185,129,0.12); color:#6ee7b7; border:1px solid rgba(16,185,129,0.22); }
    .hdr-links { margin-left:auto; display:flex; gap:20px; }
    .hdr-lnk { font-size:0.72rem; font-weight:600; color:var(--t3); transition:color .15s; }
    .hdr-lnk:hover { color:var(--t1); }

    /* ── Hero ── */
    .hero { padding:60px 28px 48px; background:radial-gradient(ellipse 90% 60% at 50% 0%,rgba(99,102,241,0.1),transparent); border-bottom:1px solid var(--line); }
    .hero-inner { max-width:1400px; margin:0 auto; }
    .hero-eyebrow { font-size:0.6rem; font-weight:800; text-transform:uppercase; letter-spacing:0.15em; color:var(--ind); margin-bottom:14px; }
    .hero-h1 { font-size:clamp(1.6rem,4vw,2.8rem); font-weight:900; color:var(--t1); letter-spacing:-0.04em; line-height:1.1; margin-bottom:12px; }
    .hero-h1 em { color:#818cf8; font-style:normal; }
    .hero-p { font-size:1rem; color:var(--t2); max-width:640px; line-height:1.7; margin-bottom:32px; }
    .stats-bar { display:flex; gap:32px; flex-wrap:wrap; }
    .stat { }
    .stat-num { font-size:2rem; font-weight:900; color:var(--t1); letter-spacing:-0.04em; line-height:1; }
    .stat-num em { color:#818cf8; font-style:normal; font-size:1rem; }
    .stat-label { font-size:0.68rem; color:var(--t3); margin-top:4px; text-transform:uppercase; letter-spacing:0.08em; }

    /* ── Section ── */
    .section { max-width:1400px; margin:0 auto; padding:48px 28px; }
    .section-hdr { margin-bottom:24px; }
    .sec-eyebrow { font-size:0.58rem; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:var(--ind); margin-bottom:8px; }
    .sec-h2 { font-size:clamp(1.2rem,2.5vw,1.8rem); font-weight:900; color:var(--t1); letter-spacing:-0.03em; margin-bottom:6px; }
    .sec-sub { font-size:0.85rem; color:var(--t3); max-width:600px; line-height:1.6; }
    .sec-divider { border:none; border-top:1px solid var(--line); margin:0; }

    /* ── Industry cards ── */
    .ind-list { display:flex; flex-direction:column; gap:8px; }
    .ind-card { background:var(--s2); border:1px solid var(--line); border-radius:12px; overflow:hidden; }
    .ind-header { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; cursor:pointer; gap:16px; transition:background .15s; }
    .ind-header:hover { background:var(--s3); }
    .ind-left { display:flex; align-items:center; gap:12px; }
    .ind-icon { font-size:1.4rem; flex-shrink:0; }
    .ind-name { font-size:0.9rem; font-weight:800; color:var(--t1); }
    .ind-segment { font-size:0.65rem; color:var(--t4); margin-top:2px; text-transform:uppercase; letter-spacing:0.07em; }
    .ind-right { display:flex; align-items:center; gap:14px; flex-shrink:0; }
    .ind-cost { display:flex; align-items:center; gap:6px; }
    .cost-low { font-size:0.7rem; color:var(--t4); }
    .cost-sep { font-size:0.7rem; color:var(--t3); }
    .cost-high { font-size:0.85rem; font-weight:800; color:#f87171; }
    .ind-tools-count { font-size:0.65rem; color:var(--t4); border:1px solid var(--line2); border-radius:99px; padding:2px 8px; white-space:nowrap; }
    .ind-arrow { font-size:0.75rem; color:var(--t4); transition:transform .2s; width:16px; text-align:center; }
    .ind-arrow.open { transform:rotate(90deg); }
    .ind-body-inner { padding:18px; border-top:1px solid var(--line); }

    /* Tool table */
    .tool-table { width:100%; border-collapse:collapse; margin-bottom:14px; font-size:0.78rem; }
    .tool-table th { text-align:left; color:var(--t3); font-size:0.62rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; padding:6px 8px; border-bottom:1px solid var(--line); }
    .tool-table td { padding:7px 8px; border-bottom:1px solid rgba(30,41,59,0.5); vertical-align:top; }
    .tt-name { color:var(--t1); font-weight:600; }
    .tt-vendor { color:var(--t2); font-size:0.72rem; }
    .tt-cat { color:var(--t4); font-size:0.68rem; }
    .tt-cost { color:var(--am); font-weight:800; white-space:nowrap; }
    .tt-cost span { font-weight:400; color:var(--t4); font-size:0.65rem; }
    .tool-table tfoot td { border-bottom:none; border-top:2px solid var(--line2); }
    .tf-label { color:var(--t3); font-size:0.7rem; }
    .tf-total { color:#f87171; font-weight:900; font-size:1rem; }

    /* Pain points */
    .pain-points { background:rgba(248,113,113,0.06); border:1px solid rgba(248,113,113,0.15); border-radius:8px; padding:12px 14px; margin-bottom:12px; }
    .pp-label { font-size:0.62rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#f87171; margin-bottom:7px; }
    .pp-list { list-style:none; display:flex; flex-direction:column; gap:4px; }
    .pp-list li { font-size:0.75rem; color:var(--t2); display:flex; gap:6px; }
    .pp-list li::before { content:"⚠"; font-size:0.7rem; color:#f87171; flex-shrink:0; }
    .ind-savings-note { font-size:0.8rem; font-weight:800; color:#6ee7b7; background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.18); border-radius:7px; padding:10px 14px; }

    /* ── Capability cards ── */
    .cap-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; }
    .cap-card { background:var(--s2); border:1px solid var(--line); border-radius:12px; padding:18px; display:flex; flex-direction:column; gap:8px; }
    .cap-top { display:flex; align-items:center; justify-content:space-between; }
    .cap-icon { font-size:1.4rem; }
    .cap-tier-chip { font-size:0.6rem; font-weight:800; text-transform:uppercase; letter-spacing:0.07em; border:1px solid; border-radius:99px; padding:2px 9px; }
    .cap-name { font-size:1rem; font-weight:900; color:var(--t1); line-height:1.2; }
    .cap-tagline { font-size:0.78rem; color:#818cf8; font-style:italic; }
    .cap-how { font-size:0.75rem; color:var(--t2); line-height:1.6; }
    .cap-cost-row { display:flex; align-items:baseline; gap:8px; background:rgba(16,185,129,0.07); border:1px solid rgba(16,185,129,0.15); border-radius:6px; padding:6px 10px; }
    .cap-cost-label { font-size:0.6rem; font-weight:800; text-transform:uppercase; letter-spacing:0.07em; color:var(--em); white-space:nowrap; }
    .cap-cost-val { font-size:0.72rem; color:var(--t2); font-family:monospace; }
    .cap-replaces-label { font-size:0.6rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--t4); margin-top:4px; }
    .cap-replaces { display:flex; flex-wrap:wrap; gap:4px; }

    /* Shared */
    .rep-tag { font-size:0.62rem; background:var(--s1); border:1px solid var(--line2); border-radius:5px; padding:2px 8px; color:var(--t3); white-space:nowrap; }

    /* ── Tier cards ── */
    .tier-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:20px; }
    .tier-card { border:1px solid; border-radius:16px; padding:24px; display:flex; flex-direction:column; gap:10px; }
    .tier-icon { font-size:1.8rem; }
    .tier-name { font-size:1.2rem; font-weight:900; }
    .tier-price { font-size:2.4rem; font-weight:900; color:var(--t1); letter-spacing:-0.04em; line-height:1; }
    .tier-price span { font-size:1rem; color:var(--t3); font-weight:400; }
    .tier-tagline { font-size:0.8rem; color:var(--t2); line-height:1.5; }
    .tier-saved { font-size:0.75rem; font-weight:800; color:var(--em); }
    .tier-sep { border:none; border-top:1px solid var(--line2); margin:4px 0; }
    .tier-cap-label, .tier-replaces-label { font-size:0.6rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--t4); }
    .tier-cap-list { list-style:none; display:flex; flex-direction:column; gap:5px; padding:0; }
    .tier-cap-list li { font-size:0.75rem; color:var(--t2); display:flex; align-items:baseline; gap:6px; }
    .tier-replaces { display:flex; flex-wrap:wrap; gap:4px; margin-top:4px; }
    .tier-cta { display:block; text-align:center; padding:12px; border-radius:9px; font-size:0.85rem; font-weight:800; color:#fff; margin-top:8px; transition:opacity .15s; }
    .tier-cta:hover { opacity:0.88; }

    /* ── Filter bar ── */
    .filter-bar { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
    .filter-btn { background:var(--s2); border:1px solid var(--line2); border-radius:99px; padding:5px 14px; font-size:0.72rem; font-weight:700; color:var(--t3); cursor:pointer; transition:all .15s; }
    .filter-btn:hover { border-color:var(--ind); color:var(--t1); }
    .filter-btn.active { background:var(--ind); border-color:var(--ind); color:#fff; }

    @media(max-width:700px) {
      .hero { padding:36px 16px 28px; }
      .section { padding:28px 16px; }
      .tier-grid, .cap-grid { grid-template-columns:1fr; }
      .stats-bar { gap:20px; }
      .ind-header { flex-direction:column; align-items:flex-start; }
    }
  </style>
</head>
<body>

<header class="hdr">
  <div class="hdr-inner">
    <div class="logo">Create<span>AI</span> Brain</div>
    <span class="mode-chip ${IS_PROD ? "mode-live" : "mode-test"}">${IS_PROD ? "⚡ Live" : "🧪 Test"}</span>
    <div class="hdr-links">
      <a class="hdr-lnk" href="${BASE}/nexus">NEXUS</a>
      <a class="hdr-lnk" href="${BASE}/join/landing">Subscribe</a>
      <a class="hdr-lnk" href="${BASE}/hub">Hub</a>
    </div>
  </div>
</header>

<!-- Hero -->
<section class="hero">
  <div class="hero-inner">
    <div class="hero-eyebrow">Business OS Bundle · Industry Analysis</div>
    <h1 class="hero-h1">Every digital expense.<br><em>One internal OS layer.</em></h1>
    <p class="hero-p">A complete analysis of ${totalIndustries} industries, ${totalTools}+ replaceable tools, and ${totalCapabilities} AI-native capabilities that cost the platform fractions of a cent to provide — while replacing hundreds of dollars per month in SaaS subscriptions.</p>
    <div class="stats-bar">
      <div class="stat"><div class="stat-num">${totalIndustries}</div><div class="stat-label">Industries analyzed</div></div>
      <div class="stat"><div class="stat-num">${totalTools}<em>+</em></div><div class="stat-label">Vendor tools replaced</div></div>
      <div class="stat"><div class="stat-num">${totalCapabilities}</div><div class="stat-label">AI-native capabilities</div></div>
      <div class="stat"><div class="stat-num">${avgSpend}</div><div class="stat-label">Avg monthly spend replaced</div></div>
      <div class="stat"><div class="stat-num">$29<em>–$299</em></div><div class="stat-label">Unified monthly fee</div></div>
    </div>
  </div>
</section>

<hr class="sec-divider">

<!-- Industry Analysis -->
<section class="section">
  <div class="section-hdr">
    <div class="sec-eyebrow">01 — Industry by Industry</div>
    <h2 class="sec-h2">What every industry pays. What we replace.</h2>
    <p class="sec-sub">Click any industry to expand its full digital expense breakdown, vendor list, monthly cost range, and key pain points.</p>
  </div>
  <div class="filter-bar" id="filter-bar">
    <div class="filter-btn active" onclick="filterIndustries('all', this)">All Sectors</div>
    ${[...new Set(INDUSTRIES.map(i => i.segment))].map(seg =>
      `<div class="filter-btn" onclick="filterIndustries('${seg}', this)">${seg}</div>`
    ).join("")}
  </div>
  <div class="ind-list" id="ind-list">
    ${industryCardsHtml}
  </div>
</section>

<hr class="sec-divider">

<!-- AI Capabilities -->
<section class="section">
  <div class="section-hdr">
    <div class="sec-eyebrow">02 — AI-Native Replacements</div>
    <h2 class="sec-h2">${totalCapabilities} capabilities. Fractions of a cent each.</h2>
    <p class="sec-sub">Every capability costs the platform almost nothing to provide. The marginal cost per subscriber per month for AI operations is under $2 — creating 95%+ gross margins at every tier.</p>
  </div>
  <div class="cap-grid">${capCardsHtml}</div>
</section>

<hr class="sec-divider">

<!-- Bundle Tiers -->
<section class="section">
  <div class="section-hdr">
    <div class="sec-eyebrow">03 — Unified Bundle Pricing</div>
    <h2 class="sec-h2">One monthly fee. Every tool replaced.</h2>
    <p class="sec-sub">Three tiers designed around industry need. Operators save 80–95% on their SaaS stack while gaining AI-native capabilities their current vendors can't match.</p>
  </div>
  <div class="tier-grid">${tierCardsHtml}</div>
</section>

<hr class="sec-divider">

<!-- New Category Inventory -->
<section class="section">
  <div class="section-hdr">
    <div class="sec-eyebrow">04 — New AI-Native Categories</div>
    <h2 class="sec-h2">Categories that didn't exist. Now core to the OS.</h2>
    <p class="sec-sub">These are genuinely new capabilities — not just cheaper versions of existing tools, but intelligence layers that no SaaS vendor currently bundles together.</p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">
    ${[
      { icon:"🧠", name:"Contextual Identity Engine", desc:"Role-based platform identity without any external auth provider. Presence tokens prove identity against internal truth. No Okta, no Auth0, no Clerk — and no per-MAU pricing." },
      { icon:"◉", name:"Semantic Navigation OS", desc:"Navigate any platform surface by intent verb, @signal, #concept, or ?query. Replaces every navigation menu, sitemap, and search bar simultaneously." },
      { icon:"⚡", name:"Intent-Based Automation", desc:"Describe what you want to happen — AI builds the workflow. No Zapier. No Make. No n8n. No workflow builder license. Just natural language." },
      { icon:"📦", name:"Channel-Agnostic Product Layer", desc:"Define a product once. Emit it to Shopify, WooCommerce, Google Shopping, Amazon, Stripe, and a hosted page simultaneously — without a PIM system or feed management tool." },
      { icon:"🔄", name:"AI Document Lifecycle", desc:"A document is generated, delivered, confirmed, stored, and retrieved — all from one action. No separate generation tool, e-signature tool, storage tool, or retrieval tool." },
      { icon:"📡", name:"Zero-Config Analytics", desc:"Business intelligence that writes itself. No dashboard to configure, no metrics to define. The platform observes all activity and generates a weekly plain-language summary automatically." },
      { icon:"🎓", name:"Knowledge-to-Training Pipeline", desc:"Any document, PDF, or URL becomes a structured training module with quiz, completion tracking, and certificate — in under 60 seconds. No LMS required." },
      { icon:"🔮", name:"AI Renewal & Retention Engine", desc:"Predicts churn before it happens. Automatically generates and sends re-engagement sequences for at-risk subscribers or lapsed customers. No CRM workflow builder required." },
    ].map(nc =>
      `<div style="background:var(--s2);border:1px solid var(--line);border-radius:12px;padding:18px;">
        <div style="font-size:1.5rem;margin-bottom:8px;">${nc.icon}</div>
        <div style="font-size:0.88rem;font-weight:800;color:var(--t1);margin-bottom:6px;">${nc.name}</div>
        <div style="font-size:0.75rem;color:var(--t2);line-height:1.6;">${nc.desc}</div>
      </div>`
    ).join("")}
  </div>
</section>

<script>
function toggleInd(id) {
  const body = document.getElementById('body-'+id);
  const arrow = document.getElementById('arr-'+id);
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  arrow.classList.toggle('open', !isOpen);
}

const IND_SEGMENTS = ${JSON.stringify(Object.fromEntries(INDUSTRIES.map(i => [i.id, i.segment])))};

function filterIndustries(segment, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.ind-card').forEach(card => {
    const id = card.id.replace('ind-','');
    const seg = IND_SEGMENTS[id];
    card.style.display = (segment === 'all' || seg === segment) ? '' : 'none';
  });
}
</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});

export default router;
