import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { PlatformStore, PlatformMode } from "@/engine/PlatformStore";
import { loadFounderState, saveFounderState } from "@/engine/FounderTier";
import { contextStore } from "@/controller";
import { LocalSettingsService } from "@/services/LocalBackendService";

// ─── App Registry ──────────────────────────────────────────────────────────
export type AppId =
  | "chat" | "projects" | "tools" | "creator" | "people"
  | "documents" | "marketing" | "admin" | "family"
  | "integration" | "monetization" | "universal" | "simulation"
  | "business" | "entity" | "bizcreator" | "bizdev" | "projbuilder" | "projos"
  | "notifications" | "brainhub" | "commandcenter"
  | "researchhub" | "learningcenter" | "personastudio" | "datastudio" | "pricingstudio"
  | "traction" | "opportunity" | "leadCycle" | "ucpx" | "universalDemo" | "genericEngine"
  | "imaginationlab" | "loreforge"
  | "narratoros" | "civilizationforge" | "ecologyforge"
  | "soundscape" | "timelineforge" | "mythweave"
  | "languageforge" | "magicsystem" | "urbanworld" | "warlore"
  | "characterforge" | "techforge" | "visualworld"
  | "religionforge" | "cosmologyforge" | "gameworld"
  // ── Creative Writing ─────────────────────────────────────────────────────
  | "scriptwriter" | "comicscript" | "poemforge" | "essaywriter" | "blogwriter"
  | "copywriter" | "storyboarder" | "speechwriter" | "bookplanner" | "technicalwriter" | "contentcalendar"
  // ── Business & Strategy ──────────────────────────────────────────────────
  | "strategist" | "reportbuilder" | "proposalbuilder" | "emailcomposer" | "hiringassist"
  | "meetingplanner" | "presentbuilder" | "budgetplanner" | "perfreviewer" | "contractdraft"
  // ── World & Universe Building ────────────────────────────────────────────
  | "alienspecies" | "planetbuilder" | "futurecivilization" | "monsterforge" | "artifactforge"
  | "dimensionbuilder" | "dystopia" | "utopia" | "ancientcivilization"
  // ── Learning & Research ──────────────────────────────────────────────────
  | "researchassist" | "conceptexplainer" | "debateprep" | "criticalthinking" | "philosophyexplorer"
  | "studyplanner" | "scienceexplainer" | "mathsolver"
  // ── Lifestyle & Personal ─────────────────────────────────────────────────
  | "journal" | "goalplanner" | "travelplanner" | "recipecreator" | "fitnesscoach"
  | "meditationguide" | "financeadvisor" | "relationshipcoach"
  // ── Music & Audio ────────────────────────────────────────────────────────
  | "lyricswriter" | "songstructure" | "podcastplanner" | "musictheory" | "sounddesigner"
  // ── Game Design ──────────────────────────────────────────────────────────
  | "questdesigner" | "npccreator" | "dungeonbuilder" | "itemforge" | "gamenarrative" | "balancedesigner"
  // ── AI & Technology ──────────────────────────────────────────────────────
  | "promptengineer" | "datastoryteller" | "systemdesigner" | "codereviewer" | "devplanner"
  // ── Health & Wellness ────────────────────────────────────────────────────
  | "healthcoach" | "mentalhealth" | "nutritionplanner" | "sleepcoach" | "parentingguide"
  // ── Arts & Culture ───────────────────────────────────────────────────────
  | "artcritique" | "filmanalysis" | "culturalexplorer"
  // ── Legal & Professional ─────────────────────────────────────────────────
  | "legaldrafter" | "ipprotection" | "privacypolicy"
  // ── Education & Teaching ─────────────────────────────────────────────────
  | "lessonplanner" | "curriculumdesigner"
  // ── Enterprise Suite (generated) ────────────────────────────────────
  | "zeroTrust"
  | "threatModel"
  | "socDashboard"
  | "penTestPlan"
  | "incidentResponse"
  | "iamStudio"
  | "encryptionPlanner"
  | "vulnScanner"
  | "securityAuditStudio"
  | "cloudSecurity"
  | "networkDefense"
  | "appSecurity"
  | "endpointSecurity"
  | "secureSDLC"
  | "privacyByDesign"
  | "cyberResilience"
  | "redTeamPlanner"
  | "securityPosture"
  | "cveTracker"
  | "securityPolicy"
  | "financialModeler"
  | "revenueRecognition"
  | "cashFlowPlanner"
  | "investmentThesis"
  | "fundraisingStudio"
  | "taxStrategy"
  | "equityPlanner"
  | "unitEconomics"
  | "auditPrep"
  | "budgetBuilder"
  | "maAnalyzer"
  | "ipoReadiness"
  | "grantWriter"
  | "cryptoTokenomics"
  | "insurancePlanner"
  | "debtStructure"
  | "fpaDashboard"
  | "treasuryManager"
  | "financeReport"
  | "capTable"
  | "ehrIntegration"
  | "clinicalWorkflow"
  | "patientEngagement"
  | "healthcareCompliance"
  | "telehealthBuilder"
  | "clinicalTrial"
  | "medicalCoding"
  | "healthAnalytics"
  | "careCoordination"
  | "healthcareAPI"
  | "mentalHealthPlatform"
  | "homeHealthOS"
  | "pharmacyOS"
  | "medicalDevice"
  | "healthDataGovernance"
  | "clinicalDecision"
  | "healthBilling"
  | "populationHealth"
  | "hipaaDashboard"
  | "fhirBuilder"
  | "learningPathBuilder"
  | "assessmentBuilder"
  | "studentEngagement"
  | "lmsBuilder"
  | "edTechStack"
  | "eduAccessibility"
  | "instructionalDesign"
  | "microlearningStudio"
  | "gameLearning"
  | "virtualClassroom"
  | "credentialBuilder"
  | "adaptiveLearning"
  | "parentPortal"
  | "teacherToolbox"
  | "k12Platform"
  | "higherEduOS"
  | "continuingEdu"
  | "schoolAnalytics"
  | "eduMarketplace"
  | "supplyChainOS"
  | "inventoryOS"
  | "qualityManagement"
  | "facilitiesOS"
  | "processMiner"
  | "logisticsOS"
  | "procurementOS"
  | "vendorOS"
  | "opsAnalytics"
  | "leanSigma"
  | "changeManagement"
  | "bcpBuilder"
  | "kpiBuilder"
  | "workflowRPA"
  | "fieldOps"
  | "capacityPlanner"
  | "okrStudio"
  | "opExDashboard"
  | "slaManager"
  | "operationsWiki"
  | "esgReporter"
  | "carbonTracker"
  | "sustainabilityPlanner"
  | "circularEconomy"
  | "renewableEnergy"
  | "sustainableSupply"
  | "greenBuilding"
  | "wasteTracker"
  | "waterStewardship"
  | "biodiversity"
  | "socialImpact"
  | "greenFinance"
  | "lcaBuilder"
  | "climateRisk"
  | "sustainabilityReport"
  | "sdgAlignment"
  | "corpSustainability"
  | "environmentalOS"
  | "netZeroRoadmap"
  | "greenProcurement"
  | "talentAcquisition"
  | "employeeExperience"
  | "performanceOS"
  | "ldStudio"
  | "compBenchmark"
  | "workforcePlanner"
  | "deiStudio"
  | "offboarding"
  | "hrAnalytics"
  | "engagementSurvey"
  | "successionPlanner"
  | "hrisDesigner"
  | "remoteWorkOS"
  | "orgDesign"
  | "employerBranding"
  | "hrCompliance"
  | "wellnessProgram"
  | "talentPipeline"
  | "onboardingOS"
  | "peopleOps"
  | "legalResearch"
  | "complianceMapping"
  | "legalRisk"
  | "ipStrategy"
  | "litigationPlanner"
  | "corporateGovernance"
  | "legalTemplate"
  | "dueDiligence"
  | "privacyLaw"
  | "laborLaw"
  | "tradeCompliance"
  | "regulatoryFiling"
  | "legalAnalytics"
  | "adrStudio"
  | "productDiscovery"
  | "userResearch"
  | "jtbdStudio"
  | "roadmapBuilder"
  | "featurePrioritizer"
  | "userStoryMapper"
  | "designSprint"
  | "prototypingStudio"
  | "usabilityTest"
  | "productMetrics"
  | "competitiveProduct"
  | "launchPlanner"
  | "feedbackSystem"
  | "designSystemBuilder"
  | "productCulture"
  | "primaryResearch"
  | "marketSurvey"
  | "ciFramework"
  | "insightSynthesis"
  | "researchReport"
  | "dataCollection"
  | "hypothesisBuilder"
  | "experimentDesign"
  | "statAnalytics"
  | "ethnographicResearch"
  | "researchMethod"
  | "knowledgeBase"
  | "trendsSentinel"
  | "apiPlayground"
  | "databaseStudio"
  | "integrationBuilder"
  | "webhookManager"
  | "dataPipeline"
  | "eventStream"
  | "notificationBuilder"
  | "workspaceOS"
  | "searchStudio"
  | "aiAgentBuilder"
  | "pluginManager"
  | "extensionStore"
  | "widgetBuilder"
  | "dashboardBuilder"
  | "reportingStudio"
  | "automationCenter"
  | "workflowBuilder"
  | "triggerManager"
  | "scheduler"
  | "jobManager"
  | "batchProcessor"
  | "dataTransformer"
  | "mappingStudio"
  | "schemaBuilder"
  | "configManager"
  // ── Platform ─────────────────────────────────────────────────────────────
  | "metricsPanel" | "integrationDashboard"
  // ── Builder ──────────────────────────────────────────────────────────────
  | "builder"
  | "identityManager"
  | "createaiDashboard"
  | "infiniteBrainControl"
  | "infiniteBrainPortal"
  | "infiniteBrainDashboard"
  // ── Industry OS Apps ───────────────────────────────────────────────────────
  | "healthos" | "legalpm" | "staffingos"
  // ── New Platform Capabilities ─────────────────────────────────────────────
  | "adshub" | "adsOrchestrator" | "authlab" | "paygate" | "inventionLayer"
  | "percentageEngine" | "activation" | "credentialsHub" | "referral" | "growthEngine" | "npaSettings" | "selfHost" | "handleProtocol" | "platformReport"
  // ── Domain Gap Engines — 19 industry-equivalent internal engines ───────────
  | "domainCRM" | "domainLedger" | "domainOrders" | "domainCases" | "domainContent"
  | "domainKPI" | "domainAgreements" | "domainGrowthPath" | "domainAssets" | "domainEngagement"
  | "domainValueExchange" | "domainRiskCoverage" | "domainPropertyFlow" | "domainWorkforce"
  | "domainPerfReview" | "domainCampaigns" | "domainRegulatory" | "domainFiscal" | "domainRecurring"
  | "domainHub"
  // ── Extended Domain Engine Suite v2.0 — 10 new engines ─────────────────────
  | "projectsCmd" | "partnerNet" | "eventBooking" | "educationHub" | "socialCmd"
  | "supplyChainOps" | "franchiseOps" | "brandVault" | "revenueIntel" | "aiStrategy";

export interface AppDef {
  id: AppId;
  label: string;
  icon: string;
  color: string;
  description: string;
  category?: "core" | "tools" | "business" | "system";
  enabled?: boolean;
}

export const DEFAULT_APPS: AppDef[] = [
  { id: "chat",         label: "AI Chat",     icon: "💬", color: "#007AFF", description: "Talk to the CreateAI Brain",                  category: "core" },
  { id: "projects",     label: "Projects",    icon: "📁", color: "#5856D6", description: "All your projects & workspaces",               category: "core" },
  { id: "tools",        label: "Tools",       icon: "🛠️", color: "#FF9500", description: "Brochures, docs, pages & more",               category: "tools" },
  { id: "creator",      label: "Create",      icon: "✨", color: "#FF2D55", description: "Generate anything — docs, workflows, modules", category: "tools" },
  { id: "people",       label: "People",      icon: "👥", color: "#34C759", description: "Contacts, profiles & invites",                 category: "business" },
  { id: "documents",    label: "Documents",   icon: "📄", color: "#FF6B6B", description: "Files, forms & structured docs",              category: "business" },
  { id: "marketing",    label: "Marketing",   icon: "📣", color: "#FF2D55", description: "Brand, campaigns & content",                  category: "business" },
  { id: "admin",        label: "Admin",       icon: "⚙️", color: "#636366", description: "Platform control & settings",                 category: "system" },
  { id: "family",       label: "Family",      icon: "🏡", color: "#30B0C7", description: "Family-friendly simplified view",             category: "system" },
  { id: "integration",  label: "Integration", icon: "🔌", color: "#BF5AF2", description: "Connect & map existing tools",                category: "system" },
  { id: "monetization", label: "Monetize",    icon: "💰", color: "#FFD60A", description: "Storefront, plans & earnings",                category: "business" },
  { id: "simulation",   label: "Simulate",    icon: "🧪", color: "#a855f7", description: "Simulations, gap analysis & ad packets",              category: "tools"     },
  { id: "universal",    label: "Universal",   icon: "🌐", color: "#007AFF", description: "Universal interaction hub — all flows wired",         category: "system"    },
  { id: "business",     label: "BizEngine",   icon: "🏗️", color: "#f59e0b", description: "6-layer business design: model, ops, monetization",   category: "business"  },
  { id: "entity",       label: "EntityGen",   icon: "🧬", color: "#10b981", description: "7-layer entity engine: brand, model, ops, ecosystem, growth, compliance, expansion", category: "business" },
  { id: "bizcreator",   label: "BizUniverse", icon: "🌌", color: "#8b5cf6", description: "8-layer universe engine: knowledge, blueprint, monetization, ecosystem, visualization, expansion", category: "business" },
  { id: "bizdev",       label: "BizPlanner",  icon: "⚡", color: "#f97316", description: "9-section real-world business planner: grounded, executable, no filler", category: "business" },
  { id: "projbuilder",  label: "ProjBuilder", icon: "📋", color: "#06b6d4", description: "7-section project file builder: overview, modules, ops, documents, tools, pricing, launch", category: "business" },
  { id: "projos",       label: "ProjectOS",   icon: "📂", color: "#6366f1", description: "Universal project platform: dashboard, folder view, sub-apps, AI helper, modes, search, delete", category: "system" },
  { id: "notifications",  label: "Notifications",   icon: "🔔", color: "#6366f1", description: "System notifications, alerts, and activity updates", category: "system" },
  { id: "brainhub",       label: "Brain Hub",       icon: "⚡", color: "#6366f1", description: "All engines, meta-agents, and series — real AI capability center", category: "core" },
  { id: "commandcenter",  label: "Command Center",  icon: "🎛️", color: "#6366f1", description: "Founder Tier — full platform control, auto-routing, messaging automation, and system status", category: "core" },
  { id: "researchhub",    label: "Research Hub",    icon: "🔬", color: "#007AFF", description: "Deep research, market analysis, and critical review — powered by Research, Market, and Critique engines", category: "tools" },
  { id: "learningcenter", label: "Learning Center", icon: "🎓", color: "#5856D6", description: "Learning paths, curricula, and mentorship — powered by Learning Engine and MENTOR meta-agent", category: "tools" },
  { id: "personastudio",  label: "Persona Studio",  icon: "👤", color: "#BF5AF2", description: "ICP creation, user personas, and communication strategy — powered by Persona and Communication engines", category: "business" },
  { id: "datastudio",     label: "Data Studio",     icon: "🗄️", color: "#30B0C7", description: "Data modeling, schema design, and pattern intelligence — powered by DataModel Engine and VECTOR", category: "tools" },
  { id: "pricingstudio",  label: "Pricing Studio",  icon: "💰", color: "#FFD60A", description: "Pricing strategy, packaging, and feedback frameworks — powered by Pricing and Feedback engines", category: "business" },
  { id: "traction",       label: "Traction",        icon: "📈", color: "#10b981", description: "Real traction signals, retention curves, growth analytics, and expansion velocity — all based on actual system activity", category: "system" },
  { id: "opportunity",    label: "Opportunities",    icon: "🎯", color: "#f59e0b", description: "Discover, score, and pursue high-value opportunities with AI intelligence, pipeline management, and strategic scanning", category: "business" },
  { id: "leadCycle",      label: "Lead Cycle",       icon: "🔄", color: "#6366f1", description: "Automatic lead generation engine — paste any input, get qualified leads, personalized outreach, and a ready-to-send proposal in seconds", category: "business" },
  { id: "imaginationlab", label: "ImaginationLab",   icon: "✨", color: "#8b5cf6", description: "13 creative engines for story, character, world-building, creatures, superpowers, quests, dreamscapes, and magic systems — safe and fictional", category: "tools" },
  { id: "loreforge",          label: "LoreForge",            icon: "📜", color: "#d97706", description: "Deep lore creation studio — mythology, religion, ancient history, prophecies, factions, languages, curses, relics, and cosmology for fictional worlds", category: "tools" },
  { id: "narratoros",         label: "NarratorOS",           icon: "🎬", color: "#e11d48", description: "Cinematic narrative studio — scene design, dialogue, plot twists, act structure, conflict, theme, arc, monologue, and ensemble dynamics for fiction", category: "tools" },
  { id: "civilizationforge",  label: "CivilizationForge",    icon: "🏛️", color: "#d97706", description: "Society and culture builder — economy, political systems, social strata, architecture, law, trade routes, war doctrine, food culture, and institutions", category: "tools" },
  { id: "ecologyforge",       label: "EcologyForge",         icon: "🌿", color: "#15803d", description: "World ecology builder — biomes, ecosystems, apex creatures, extinction events, evolution, flora, fauna, climate, geology, and symbiosis for fictional worlds", category: "tools" },
  { id: "soundscape",         label: "SoundscapeStudio",     icon: "🎵", color: "#7c3aed", description: "Fictional sound and music designer — music theory, instruments, acoustic environments, ceremonial music, war music, lullabies, epic ballads, and sonic systems", category: "tools" },
  { id: "timelineforge",      label: "TimelineForge",        icon: "⏰", color: "#6366f1", description: "Temporal history studio — timelines, alternate history, parallel timelines, temporal paradoxes, historical divergences, dynasties, and civilizational collapse", category: "tools" },
  { id: "mythweave",          label: "MythweaveStudio",      icon: "🕸️", color: "#7c3aed", description: "Myth, archetype, and symbol designer — archetypes, symbol systems, motifs, folklore, rituals, tricksters, hero journeys, shadow narratives, and destiny systems", category: "tools" },
  { id: "languageforge",   label: "LanguageForge",      icon: "🔤", color: "#6366f1", description: "Constructed language studio — phonology, grammar, vocabulary, dialects, scripts, naming systems, sacred languages, and linguistic evolution for fictional worlds", category: "tools" },
  { id: "magicsystem",     label: "MagicSystemStudio",  icon: "✨", color: "#7c3aed", description: "Magic & power system design — rules, costs, spells, schools, corruption, artifacts, practitioners, forbidden magic, and sentient magic for fictional worlds", category: "tools" },
  { id: "urbanworld",      label: "UrbanWorldEngine",   icon: "🏙️", color: "#6366f1", description: "City & urban world design — layout, districts, underground, criminal networks, architecture, street culture, markets, and political geography", category: "tools" },
  { id: "warlore",         label: "WarloreStudio",      icon: "⚔️", color: "#dc2626", description: "Military & warfare design — armies, tactics, siege, naval warfare, spy networks, weapons, propaganda, peace treaties, mercenaries, and aftermath", category: "tools" },
  { id: "characterforge",  label: "CharacterForge",     icon: "🧠", color: "#be185d", description: "Deep character psychology — backstory, core wound, want vs need, moral code, voice, flaw, secrets, relationships, change arc, mask, obsession, and death", category: "tools" },
  { id: "techforge",       label: "TechForge",          icon: "🛸", color: "#0891b2", description: "Fictional technology design — tech levels, energy systems, transportation, weapons tech, medical tech, communication, surveillance, and tech revolutions", category: "tools" },
  { id: "visualworld",     label: "VisualWorldStudio",  icon: "🎨", color: "#be185d", description: "Visual design language — color palettes, fashion, heraldry, flags, motifs, art movements, propaganda art, funerary art, body marking, masks, and costumes", category: "tools" },
  { id: "religionforge",   label: "ReligionForge",      icon: "🙏", color: "#4f46e5", description: "Belief system & theology design — theology, deities, sacred texts, clergy, rituals, schisms, heresies, saints, afterlife, prayer, miracles, and holy wars", category: "tools" },
  { id: "cosmologyforge",  label: "CosmologyForge",     icon: "🌌", color: "#6366f1", description: "Universe physics & metaphysics — cosmology, planes of existence, creation myths, deity hierarchies, death mechanics, souls, cosmic conflict, void, and ascension", category: "tools" },
  { id: "gameworld",       label: "GameWorldStudio",    icon: "🎲", color: "#d97706", description: "Games & play culture design — board games, sports, gambling, children's games, deadly games, gladiators, championships, stadium culture, and wager culture", category: "tools" },
  // ── Creative Writing Suite ────────────────────────────────────────────────
  { id: "scriptwriter",    label: "Scriptwriter",        icon: "🎬", color: "#e11d48", description: "Professional screenplay and script writing studio — scenes, dialogue, structure, and pitch", category: "tools" },
  { id: "comicscript",     label: "ComicScript Studio",  icon: "💥", color: "#7c3aed", description: "Comic book and graphic novel script writing — panels, captions, and visual storytelling", category: "tools" },
  { id: "poemforge",       label: "PoemForge",           icon: "🌸", color: "#be185d", description: "Poetry creation and form exploration — sonnets to free verse, haiku to epic odes", category: "tools" },
  { id: "essaywriter",     label: "Essay Writer",         icon: "📝", color: "#0369a1", description: "Academic, persuasive, and analytical essay writing — from thesis to conclusion", category: "tools" },
  { id: "blogwriter",      label: "Blog Writer",          icon: "✍️", color: "#16a34a", description: "Blog posts, content strategy, SEO writing, and audience-focused content creation", category: "tools" },
  { id: "copywriter",      label: "Copywriter",           icon: "💡", color: "#d97706", description: "Sales copy, headlines, CTAs, landing pages, ads, and conversion-focused writing", category: "tools" },
  { id: "storyboarder",    label: "Storyboarder",         icon: "🎞️", color: "#7c3aed", description: "Scene-by-scene visual story planning — shot lists, visual beats, and narrative pacing", category: "tools" },
  { id: "speechwriter",    label: "Speechwriter",         icon: "🎤", color: "#0891b2", description: "Speeches, toasts, keynotes, commencement addresses, and public remarks", category: "tools" },
  { id: "bookplanner",     label: "Book Planner",         icon: "📚", color: "#6366f1", description: "Novel structure, chapter outlines, character development, and writing roadmaps", category: "tools" },
  { id: "technicalwriter", label: "Technical Writer",     icon: "⚙️", color: "#475569", description: "Technical documentation, user guides, API references, and process manuals", category: "tools" },
  { id: "contentcalendar", label: "Content Calendar",     icon: "📅", color: "#0f766e", description: "Content strategy, editorial calendars, campaign planning, and publishing schedules", category: "tools" },
  // ── Business & Strategy Suite ─────────────────────────────────────────────
  { id: "strategist",      label: "Business Strategist",  icon: "♟️", color: "#1d4ed8", description: "Business strategy, competitive analysis, market positioning, and growth planning", category: "business" },
  { id: "reportbuilder",   label: "Report Builder",        icon: "📊", color: "#0369a1", description: "Business reports, executive summaries, board decks, and data narratives", category: "business" },
  { id: "proposalbuilder", label: "Proposal Builder",      icon: "📨", color: "#7c3aed", description: "Business proposals, RFP responses, grant applications, and client pitches", category: "business" },
  { id: "emailcomposer",   label: "Email Composer",        icon: "📧", color: "#16a34a", description: "Professional emails, newsletters, follow-ups, and communication templates", category: "business" },
  { id: "hiringassist",    label: "Hiring Assistant",      icon: "🤝", color: "#d97706", description: "Job descriptions, interview questions, offer letters, and hiring process design", category: "business" },
  { id: "meetingplanner",  label: "Meeting Planner",       icon: "🗓️", color: "#0891b2", description: "Meeting agendas, minutes, retrospectives, and facilitation guides", category: "business" },
  { id: "presentbuilder",  label: "Presentation Builder",  icon: "📊", color: "#6366f1", description: "Presentation outlines, slide structures, speaker notes, and pitch decks", category: "business" },
  { id: "budgetplanner",   label: "Budget Planner",        icon: "💰", color: "#16a34a", description: "Budget templates, financial narratives, cost justifications, and financial planning", category: "business" },
  { id: "perfreviewer",    label: "Performance Reviewer",  icon: "⭐", color: "#7c3aed", description: "Performance reviews, feedback frameworks, 360 reviews, and development plans", category: "business" },
  { id: "contractdraft",   label: "Contract Drafter",      icon: "📜", color: "#dc2626", description: "Contract templates, legal language, terms drafting, and agreement structures", category: "business" },
  // ── World & Universe Building ─────────────────────────────────────────────
  { id: "alienspecies",       label: "Alien Species Forge",   icon: "👾", color: "#7c3aed", description: "Xenobiology, alien civilizations, first contact protocols, and interstellar cultures", category: "tools" },
  { id: "planetbuilder",      label: "Planet Builder",         icon: "🪐", color: "#0369a1", description: "Planetary creation: geology, climate, terrain, atmosphere, and ecological systems", category: "tools" },
  { id: "futurecivilization", label: "Future Civilization",    icon: "🔭", color: "#0f766e", description: "Far-future society design: post-scarcity, interstellar, post-human, and deep future", category: "tools" },
  { id: "monsterforge",       label: "Monster Forge",          icon: "🐉", color: "#dc2626", description: "Monster and creature design — biology, behavior, ecology, lore, and narrative role", category: "tools" },
  { id: "artifactforge",      label: "Artifact Forge",         icon: "💎", color: "#d97706", description: "Magical artifacts, legendary items, cursed objects, and relics of power", category: "tools" },
  { id: "dimensionbuilder",   label: "Dimension Builder",      icon: "🌀", color: "#6366f1", description: "Alternate dimensions, parallel worlds, pocket realities, and planes of existence", category: "tools" },
  { id: "dystopia",           label: "Dystopia Builder",       icon: "🏭", color: "#475569", description: "Dystopian world design — systems of control, resistance, collapse, and moral complexity", category: "tools" },
  { id: "utopia",             label: "Utopia Builder",         icon: "🌈", color: "#16a34a", description: "Utopian society design — what makes it work, what it costs, and who it might exclude", category: "tools" },
  { id: "ancientcivilization",label: "Ancient Civilization",   icon: "🏛️", color: "#b45309", description: "Historical and fantasy ancient civilization design — rise, peak, and fall", category: "tools" },
  // ── Learning & Research ───────────────────────────────────────────────────
  { id: "researchassist",     label: "Research Assistant",     icon: "🔬", color: "#0369a1", description: "Research methodology, literature review frameworks, and academic investigation support", category: "tools" },
  { id: "conceptexplainer",   label: "Concept Explainer",      icon: "💡", color: "#7c3aed", description: "Explain any concept clearly at any complexity level — from beginner to expert", category: "tools" },
  { id: "debateprep",         label: "Debate Prep",            icon: "🎤", color: "#dc2626", description: "Argument construction, rebuttal preparation, logical analysis, and debate strategy", category: "tools" },
  { id: "criticalthinking",   label: "Critical Thinking",      icon: "🧩", color: "#0891b2", description: "Logical analysis, cognitive bias identification, decision auditing, and reasoning improvement", category: "tools" },
  { id: "philosophyexplorer", label: "Philosophy Explorer",    icon: "🦉", color: "#4f46e5", description: "Philosophical traditions, ethical frameworks, thought experiments, and applied ethics", category: "tools" },
  { id: "studyplanner",       label: "Study Planner",          icon: "📖", color: "#16a34a", description: "Study schedules, spaced repetition, exam prep, and learning roadmaps", category: "tools" },
  { id: "scienceexplainer",   label: "Science Explainer",      icon: "🔭", color: "#0369a1", description: "Scientific concepts, experiments, discoveries, and the history of science", category: "tools" },
  { id: "mathsolver",         label: "Math Solver",            icon: "🔢", color: "#7c3aed", description: "Mathematical problem solving, proof construction, and mathematical intuition building", category: "tools" },
  // ── Lifestyle & Personal ──────────────────────────────────────────────────
  { id: "journal",            label: "Journal Studio",         icon: "📔", color: "#be185d", description: "Guided journaling, self-reflection prompts, emotional processing, and life writing", category: "tools" },
  { id: "goalplanner",        label: "Goal Planner",           icon: "🎯", color: "#d97706", description: "SMART goals, OKRs, milestone planning, accountability systems, and progress tracking", category: "tools" },
  { id: "travelplanner",      label: "Travel Planner",         icon: "✈️", color: "#0891b2", description: "Trip planning, itineraries, travel writing, cultural guides, and adventure design", category: "tools" },
  { id: "recipecreator",      label: "Recipe Creator",         icon: "👨‍🍳", color: "#ef4444", description: "Recipe design, meal planning, cuisine exploration, and culinary storytelling", category: "tools" },
  { id: "fitnesscoach",       label: "Fitness Coach",          icon: "💪", color: "#16a34a", description: "Workout plans, training programs, sports performance, and movement coaching", category: "tools" },
  { id: "meditationguide",    label: "Meditation Guide",       icon: "🧘", color: "#6366f1", description: "Meditation scripts, mindfulness practices, breathwork, and contemplative exercises", category: "tools" },
  { id: "financeadvisor",     label: "Finance Advisor",        icon: "📈", color: "#16a34a", description: "Personal finance planning, investment education, budgeting, and financial goal mapping", category: "tools" },
  { id: "relationshipcoach",  label: "Relationship Coach",     icon: "💑", color: "#be185d", description: "Relationship communication, conflict resolution, boundary setting, and connection building", category: "tools" },
  // ── Music & Audio ─────────────────────────────────────────────────────────
  { id: "lyricswriter",    label: "Lyrics Writer",          icon: "🎵", color: "#7c3aed", description: "Song lyrics, rhyme schemes, verse/chorus structures, and lyrical storytelling", category: "tools" },
  { id: "songstructure",   label: "Song Structure Studio",  icon: "🎼", color: "#0891b2", description: "Song arrangement, composition structure, genre conventions, and musical architecture", category: "tools" },
  { id: "podcastplanner",  label: "Podcast Planner",        icon: "🎙️", color: "#d97706", description: "Podcast episodes, show notes, interview guides, and content strategy", category: "tools" },
  { id: "musictheory",     label: "Music Theory Studio",    icon: "🎶", color: "#4f46e5", description: "Music theory exploration, harmony, counterpoint, composition principles, and ear training", category: "tools" },
  { id: "sounddesigner",   label: "Sound Designer",         icon: "🔊", color: "#0f766e", description: "Sound design, audio world building, foley, and sonic identity systems", category: "tools" },
  // ── Game Design ───────────────────────────────────────────────────────────
  { id: "questdesigner",   label: "Quest Designer",     icon: "⚔️", color: "#dc2626", description: "Quest and mission design, narrative objectives, rewards, and player motivation", category: "tools" },
  { id: "npccreator",      label: "NPC Creator",        icon: "🎭", color: "#7c3aed", description: "Non-player character creation — personality, motivation, dialogue, and behavior design", category: "tools" },
  { id: "dungeonbuilder",  label: "Dungeon Builder",    icon: "🏰", color: "#475569", description: "Dungeon and environment design, encounter building, traps, puzzles, and atmosphere", category: "tools" },
  { id: "itemforge",       label: "Item Forge",         icon: "🗡️", color: "#d97706", description: "Game items, weapons, armor, consumables, and equipment design", category: "tools" },
  { id: "gamenarrative",   label: "Game Narrative",     icon: "📖", color: "#6366f1", description: "Game story, lore writing, world canon, cutscene narrative, and environmental storytelling", category: "tools" },
  { id: "balancedesigner", label: "Balance Designer",   icon: "⚖️", color: "#0369a1", description: "Game balance, tuning, difficulty curves, and systemic design", category: "tools" },
  // ── AI & Technology ───────────────────────────────────────────────────────
  { id: "promptengineer",  label: "Prompt Engineer",    icon: "🤖", color: "#6366f1", description: "AI prompt design, chain-of-thought, system prompts, and prompt optimization", category: "tools" },
  { id: "datastoryteller", label: "Data Storyteller",   icon: "📊", color: "#0369a1", description: "Data narratives, visualization scripts, insight communication, and analytical storytelling", category: "tools" },
  { id: "systemdesigner",  label: "System Designer",    icon: "🏗️", color: "#475569", description: "System architecture, design patterns, technical documentation, and engineering clarity", category: "tools" },
  { id: "codereviewer",    label: "Code Reviewer",      icon: "👨‍💻", color: "#16a34a", description: "Code review frameworks, best practices analysis, refactoring guides, and quality improvement", category: "tools" },
  { id: "devplanner",      label: "Dev Planner",        icon: "🗂️", color: "#7c3aed", description: "Software development planning, sprint design, technical roadmaps, and estimation", category: "tools" },
  // ── Health & Wellness ─────────────────────────────────────────────────────
  { id: "healthcoach",       label: "Health Coach",         icon: "🏥", color: "#16a34a", description: "Health planning, wellness strategies, lifestyle design, and preventive health guidance", category: "tools" },
  { id: "mentalhealth",      label: "Mental Health Support", icon: "💙", color: "#6366f1", description: "Mental health education, CBT tools, coping strategies, and emotional resilience building", category: "tools" },
  { id: "nutritionplanner",  label: "Nutrition Planner",    icon: "🥗", color: "#16a34a", description: "Nutrition planning, diet design, macro balance, and evidence-based eating guidance", category: "tools" },
  { id: "sleepcoach",        label: "Sleep Coach",          icon: "🌙", color: "#4f46e5", description: "Sleep optimization, insomnia strategies, sleep hygiene, and circadian rhythm coaching", category: "tools" },
  { id: "parentingguide",    label: "Parenting Guide",      icon: "👨‍👩‍👧", color: "#d97706", description: "Parenting strategies, child development, discipline alternatives, and family communication", category: "tools" },
  // ── Arts & Culture ────────────────────────────────────────────────────────
  { id: "artcritique",     label: "Art Critique Studio",  icon: "🖼️", color: "#be185d", description: "Art analysis, criticism frameworks, art history, and creative interpretation", category: "tools" },
  { id: "filmanalysis",    label: "Film Analysis Studio", icon: "🎬", color: "#1d4ed8", description: "Film theory, screenplay analysis, cinematography, and cinema criticism", category: "tools" },
  { id: "culturalexplorer",label: "Cultural Explorer",    icon: "🌍", color: "#0f766e", description: "Cultural analysis, anthropology, cross-cultural comparison, and cultural intelligence", category: "tools" },
  // ── Legal & Professional ──────────────────────────────────────────────────
  { id: "legaldrafter",    label: "Legal Drafter",       icon: "⚖️", color: "#1d4ed8", description: "Legal document drafting, clause libraries, legal language, and document structures", category: "tools" },
  { id: "ipprotection",    label: "IP Protection",        icon: "🛡️", color: "#7c3aed", description: "Intellectual property, trademark strategy, copyright guidance, and IP portfolio design", category: "tools" },
  { id: "privacypolicy",   label: "Privacy Policy Studio",icon: "🔐", color: "#dc2626", description: "Privacy policies, terms of service, GDPR compliance, and data governance language", category: "tools" },
  // ── Education & Teaching ──────────────────────────────────────────────────
  { id: "lessonplanner",      label: "Lesson Planner",      icon: "📚", color: "#0369a1", description: "Lesson plans, learning objectives, activities, and teaching strategies", category: "tools" },
  { id: "curriculumdesigner", label: "Curriculum Designer", icon: "🎓", color: "#7c3aed", description: "Course design, curriculum mapping, learning pathways, and instructional frameworks", category: "tools" },
  { id: "ucpx",          label: "UCP-X Intelligence",  icon: "🧠", color: "#4f46e5", description: "Ultra-Capability Platform X — 21 simultaneous engine sections, ARIA intelligence, full-stack automation, revenue systems, and infinite expansion mode", category: "system" },
  { id: "universalDemo", label: "Universal Workspace", icon: "🌐", color: "#0891b2", description: "Multi-panel universal workspace shell — filters, guides, and workspace panels for any industry or workflow", category: "system" },
  { id: "genericEngine", label: "Engine Launcher",     icon: "⚡", color: "#4f46e5", description: "Universal AI engine launcher — run any of the 12 most powerful cross-domain engines on any topic, any industry", category: "system" },
  { id: "metricsPanel",           label: "Platform Metrics",       icon: "📊", color: "#6366f1", description: "Executive metrics panel — engines, series, endpoints, registry, systems, and expansion paths", category: "system" },
  { id: "integrationDashboard",  label: "Integration Dashboard",  icon: "🔗", color: "#0891b2", description: "Full integration hub — REST, FHIR R4, HL7, OAuth2, webhooks, PHI safety, TLS status, and simulation mode", category: "system" },
  { id: "builder",               label: "Builder Space",          icon: "🔧", color: "#4f46e5", description: "In-platform code review IDE — every proposed change is shown here for review before anything applies", category: "system" },
  { id: "identityManager",       label: "Identity Manager",       icon: "🪪", color: "#4f46e5", description: "View and manage internal identity packages — internal domain, email, and phone ID for every project", category: "system" },
  { id: "createaiDashboard",     label: "Coverage Dashboard",      icon: "📊", color: "#6366f1", description: "Global 100% industry coverage dashboard — AI personas, savings, compliance, capacity, environmental impact, and ROI simulation", category: "system" },
  { id: "infiniteBrainControl",  label: "Infinite Brain Control",  icon: "🚀", color: "#6366f1", description: "Live control panel — launch all workflows, notify family, run infinite expansion simulations, view real-time audit log", category: "system" },
  { id: "infiniteBrainPortal",   label: "Infinite Brain Portal",   icon: "💠", color: "#6366f1", description: "Ultimate Live Full Deployment — 9 modules × 5 tasks, Beyond Infinity mode, real-time audit log, all APIs wired", category: "system" },
  { id: "infiniteBrainDashboard", label: "Infinite Brain Dashboard", icon: "📊", color: "#7c3aed", description: "Transcend All — real-time module scores, industry overachievement metrics, system log, Absolute Infinity mode", category: "system" },
  // ── Industry OS Apps ─────────────────────────────────────────────────────
  { id: "healthos",      label: "HealthOS",         icon: "🏥", color: "#0d9488", description: "Full healthcare management — patients, appointments, doctors, departments, and billing in one unified OS", category: "business" },
  { id: "legalpm",       label: "LegalPM",          icon: "⚖️", color: "#4f46e5", description: "Legal practice management — matters, clients, time tracking, billing, and tasks for law firms", category: "business" },
  { id: "staffingos",    label: "StaffingOS",        icon: "🎯", color: "#7c3aed", description: "Global staffing platform — candidates, clients, requisitions, interviews, and placement tracking", category: "business" },
  { id: "adshub",          label: "Advertising Hub",       icon: "📢", color: "#ec4899", description: "Complete internal advertising hub — all platform profiles, ad templates, scripts, bios, funnels, and brand assets for every major platform", category: "tools" },
  { id: "adsOrchestrator", label: "Ad Campaign Orchestrator", icon: "📡", color: "#6366f1", description: "Universal ad deployment orchestrator — connects all 12 ad networks, deploys pre-built campaigns the moment credentials are entered, manages internal platform ads (live immediately), and aggregates reporting from all connected networks", category: "tools" },
  { id: "authlab",       label: "Authentication Lab", icon: "🔐", color: "#6366f1", description: "Advanced authentication methods — passwordless magic link, device fingerprinting, trusted sessions, and full auth architecture", category: "system" },
  { id: "paygate",       label: "PayGate",           icon: "💳", color: "#10b981", description: "Multi-rail payment system — professional invoice generation, email delivery, and payment tracking via bank, wire, Zelle, Venmo, crypto, and check", category: "business" },
  { id: "inventionLayer",    label: "Invention Layer",    icon: "🔬", color: "#f59e0b", description: "12 AI invention tools that bypass $500K+ in software licenses — clinical scribe, legal research, fleet intelligence, risk underwriting, agronomist, and more", category: "tools" },
  { id: "percentageEngine", label: "Percentage Engine",  icon: "📊", color: "#6366f1", description: "Real-time platform capability engine — unified score, subsystem breakdowns, industry coverage, over-100% expansion tracking, and financial capacity model", category: "system" },
  { id: "activation",       label: "Activation Center",   icon: "⚡", color: "#6366f1", description: "Maximum potential command center — fire all engines simultaneously, view real-time status of every system, see active bypasses for every blocker, and track the live execution sequence", category: "system" },
  { id: "credentialsHub",   label: "Credentials Hub",     icon: "🔗", color: "#6366f1", description: "Enter marketplace API tokens directly in the OS — no Replit Secrets navigation required. Tokens activate instantly, persist across restarts, and unlock Shopify, Etsy, Amazon, eBay, and Creative Market publishing automatically.", category: "system" },
  { id: "referral",         label: "Referral Program",    icon: "🎁", color: "#10b981", description: "Viral referral loop — get your unique link, share on any channel, track clicks and conversions in real time, see your rank on the leaderboard, and copy industry-specific links for healthcare, legal, and staffing contacts", category: "tools" },
  { id: "growthEngine",     label: "Growth Engine",        icon: "📈", color: "#6366f1", description: "Internal analytics dashboard — page views by industry, lead captures, referral funnel, daily traffic trends, top sources, and exact step-by-step guide for the 3 manual setup steps that unlock Google Search Console, Resend email, and Stripe payments", category: "system" },
  { id: "npaSettings",      label: "Platform Identity",     icon: "🪪", color: "#6366f1", description: "NEXUS Platform Address — internal identity system that unifies the platform without a purchased domain. See your live URL, NPA handle, email identity, resolution chain, and machine-readable identity endpoints.", category: "system" },
  { id: "selfHost",         label: "Self-Host Engine",       icon: "🏠", color: "#6366f1", description: "Internal self-hosting system — build the frontend, serve it from the API server, browse the createai:// routing table, inspect the platform proof token, and publish portable snapshots. No external hosting required.", category: "system" },
  { id: "handleProtocol",   label: "Handle Protocol",        icon: "🔗", color: "#6366f1", description: "NEXUS Handle Protocol System — register web+npa://CreateAIDigital as a browser-native URL scheme, download a self-resolving portable card (host it free on GitHub Pages or Netlify for a professional URL), and use the permanent handle redirect. No domain purchase required.", category: "system" },
  { id: "platformReport",   label: "Platform Analytics Report", icon: "📊", color: "#6366f1", description: "Full internal platform analytics report — system health, percentage scores for all subsystems, engine inventory, product pipeline, revenue status, ad engine metrics, traction velocity, identity completeness, handle protocol status, and capacity projections. Real data only, zero simulated numbers.", category: "system" },
  // ── Domain Gap Engines — 19 industry-equivalent internal engines ────────────
  { id: "domainHub",         label: "Domain Hub",               icon: "🌐", color: "#6366f1", description: "Unified view of all 25 industry-equivalent domain engines — CRM, accounting, orders, support, content, BI/KPI, contracts, L&D, inventory, customer journey, value exchange, risk, property, workforce, performance, marketing automation, compliance, FP&A, and recurring revenue. 25/25 complete, zero gaps.", category: "business" },
  { id: "domainCRM",         label: "Contact Intelligence",     icon: "👥", color: "#6366f1", description: "Internal CRM engine — manage contacts, pipeline stages, deal values, and relationship tracking. Replaces Salesforce and HubSpot. Internal name: Contact Intelligence Engine.", category: "business" },
  { id: "domainLedger",      label: "Transaction Ledger",       icon: "📒", color: "#10b981", description: "Internal accounting engine — double-entry journal, balance sheet, trial balance, and cash flow tracking. Replaces QuickBooks and Xero. Internal name: Transaction Ledger Engine.", category: "business" },
  { id: "domainOrders",      label: "Order Flow",               icon: "📦", color: "#f59e0b", description: "Internal order management engine — full order lifecycle from pending to delivered, revenue tracking, and status management. Replaces Shopify's order system. Internal name: Order Flow Engine.", category: "business" },
  { id: "domainCases",       label: "Case Resolution",          icon: "🎫", color: "#ef4444", description: "Internal support engine — case creation, SLA tracking, priority management, and resolution workflows. Replaces Zendesk and Freshdesk. Internal name: Case Resolution Engine.", category: "business" },
  { id: "domainContent",     label: "Content Pipeline",         icon: "📝", color: "#8b5cf6", description: "Internal content management engine — content calendar, publishing workflows, SEO scoring, and 10 content type templates. Replaces WordPress and Contentful. Internal name: Content Pipeline Engine.", category: "tools" },
  { id: "domainKPI",         label: "Insight Engine",           icon: "📊", color: "#06b6d4", description: "Internal BI/KPI engine — live KPI dashboard, target vs actual tracking, trend direction, and category grouping. Replaces Tableau and Power BI. Internal name: Insight Engine.", category: "business" },
  { id: "domainAgreements",  label: "Agreement Flow",           icon: "📄", color: "#6366f1", description: "Internal contract lifecycle engine — 10 agreement types, full draft-to-active workflow, auto-renewal tracking, and total contract value reporting. Replaces DocuSign and Ironclad. Internal name: Agreement Flow Engine.", category: "business" },
  { id: "domainGrowthPath",  label: "Growth Path",              icon: "🎓", color: "#10b981", description: "Internal L&D engine — 5 pre-built learning tracks (AI Tools, Platform Ops, Monetization, Healthcare AI, Legal AI), enrollment tracking, and completion management. Replaces Workday Learning and Docebo. Internal name: Growth Path Engine.", category: "tools" },
  { id: "domainAssets",      label: "Asset Flow",               icon: "🏭", color: "#f59e0b", description: "Internal inventory and supply chain engine — asset registry, stock tracking, automatic reorder queue, and supplier management. Replaces NetSuite and TradeGecko. Internal name: Asset Flow Engine.", category: "business" },
  { id: "domainEngagement",  label: "Engagement Map",           icon: "🗺️", color: "#ec4899", description: "Internal customer journey engine — 7-stage touchpoint tracking (discovery through advocacy), funnel conversion rates, and multi-channel attribution. Replaces Salesforce Journey Builder. Internal name: Engagement Map Engine.", category: "business" },
  { id: "domainValueExchange",label: "Value Exchange",          icon: "🏦", color: "#10b981", description: "Internal financial services engine — account management, internal transfers, balance tracking across platform-operating, reserve, escrow, and revenue-pool accounts. Internal name: Value Exchange Engine.", category: "business" },
  { id: "domainRiskCoverage", label: "Risk Coverage",           icon: "🛡️", color: "#6366f1", description: "Internal risk assessment engine — factor-based risk scoring (0-100), coverage level classification, premium-equivalent calculation, and recommendation generation. Internal name: Risk Coverage Engine.", category: "business" },
  { id: "domainPropertyFlow", label: "Property Flow",           icon: "🏠", color: "#f59e0b", description: "Internal real estate management engine — property listings, portfolio value tracking, status management, and deal pipeline. Internal name: Property Flow Engine.", category: "business" },
  { id: "domainWorkforce",   label: "Workforce Pipeline",       icon: "🎯", color: "#8b5cf6", description: "Internal talent acquisition engine — 7-stage candidate pipeline (applied through hired), stage advancement, and pipeline analytics. Replaces Greenhouse and Lever. Internal name: Workforce Pipeline Engine.", category: "business" },
  { id: "domainPerfReview",  label: "Performance Review",       icon: "⭐", color: "#f59e0b", description: "Internal performance management engine — weighted goal scoring, automatic rating labels (Exceptional through Needs Improvement), and approval workflow. Internal name: Performance Review Engine.", category: "business" },
  { id: "domainCampaigns",   label: "Campaign Intelligence",    icon: "📡", color: "#ec4899", description: "Internal marketing automation engine — multi-type campaign registry, trigger/sequence configuration, and enrolled/opens/clicks/conversions tracking. Replaces Marketo and HubSpot Marketing. Internal name: Campaign Intelligence Engine.", category: "tools" },
  { id: "domainRegulatory",  label: "Regulatory Map",           icon: "⚖️", color: "#6366f1", description: "Internal compliance management engine — regulatory status registry (GDPR, PCI-DSS, CCPA, HIPAA, SOC 2 pre-loaded), action-required tracking, and audit trail. Internal name: Regulatory Map Engine.", category: "system" },
  { id: "domainFiscal",      label: "Fiscal Intelligence",      icon: "💹", color: "#10b981", description: "Internal FP&A engine — budget, forecast, and actuals planning with revenue, expenses, margin, and category breakdown. Replaces Adaptive Planning and Anaplan. Internal name: Fiscal Intelligence Engine.", category: "business" },
  { id: "domainRecurring",   label: "Recurring Revenue",        icon: "🔄", color: "#6366f1", description: "Internal subscription billing engine — 4 pre-built plans ($97–$2,997/mo), MRR/ARR calculation, and billing cycle management (monthly/quarterly/annual). Replaces Chargebee and Recurly. Internal name: Recurring Revenue Engine.", category: "business" },
  // ── Extended Domain Engine Suite v2.0 ──────────────────────────────────────
  { id: "projectsCmd",   label: "Project Command",     icon: "🎯", color: "#6366f1", description: "Full project management system — projects, tasks, sprints, milestones, time tracking, budget vs. actuals, and team assignments. Replaces Asana, Jira, and Monday.com. Real-time project health dashboard.", category: "business" },
  { id: "partnerNet",    label: "Partner Network",     icon: "🤝", color: "#6366f1", description: "Affiliate, reseller, and referral partner management — commission tracking, partner tiers (Bronze→Elite), referral conversion, and revenue attribution. Replaces Impact, PartnerStack, and Tapfiliate.", category: "business" },
  { id: "eventBooking",  label: "Events & Bookings",   icon: "📅", color: "#6366f1", description: "Event creation, ticketing, and attendee management — webinars, workshops, conferences, VIP events, waitlisting, check-in, and revenue reporting. Replaces Eventbrite and Hopin.", category: "business" },
  { id: "educationHub",  label: "Education Hub",       icon: "🎓", color: "#6366f1", description: "Course creation, enrollment management, and progress tracking — multi-level courses, module structure, completion certificates, and learner analytics. Replaces Teachable, Kajabi, and Thinkific.", category: "business" },
  { id: "socialCmd",     label: "Social Command",      icon: "📣", color: "#6366f1", description: "Cross-platform social media command center — schedule posts across Instagram, TikTok, LinkedIn, YouTube, Twitter; track impressions, reach, and engagement per post. Replaces Hootsuite and Buffer.", category: "business" },
  { id: "supplyChainOps",label: "Supply Chain",        icon: "🚚", color: "#6366f1", description: "Vendor management, purchase orders, and fulfillment tracking — vendor reliability scores, PO lifecycle (draft→received), spend analytics, and reorder intelligence. Replaces NetSuite and TradeGecko.", category: "business" },
  { id: "franchiseOps",  label: "Franchise Hub",       icon: "🏪", color: "#6366f1", description: "Multi-location franchise operations — operator management, royalty tracking (6% default), compliance scoring, revenue reporting, and territory management. Replaces FranConnect and Revel.", category: "business" },
  { id: "brandVault",    label: "Brand Vault",         icon: "💎", color: "#6366f1", description: "Brand asset management and guidelines library — logos, color palettes, templates, fonts, usage rights, version control, and brand compliance enforcement. Replaces Bynder and Brandfolder.", category: "system" },
  { id: "revenueIntel",  label: "Revenue Intelligence",icon: "📈", color: "#10b981", description: "Advanced revenue analytics — cohort analysis, LTV modeling, churn prediction, MRR/ARR trends, net revenue retention, and ARPU tracking. Replaces ChartMogul and Baremetrics.", category: "business" },
  { id: "aiStrategy",    label: "AI Strategy Engine",  icon: "🧠", color: "#6366f1", description: "GPT-4o powered strategic intelligence — analyze business positions, generate 90-day action plans, map competitive landscapes, identify growth levers, and evaluate pivot options. Full strategic advisor.", category: "ai" },
];

export const ALL_APPS = DEFAULT_APPS;

// ─── Preference Brain ──────────────────────────────────────────────────────
export type ToneOption = "Professional" | "Plain Language" | "Executive Brief" | "Educational" | "Empowering" | "Clinical Structural";
export type LanguageOption = "English" | "Tamil" | "Tamil–English" | "Spanish" | "French";
export type StyleOption = "Guided" | "Smart" | "Fast" | "Adaptive";

export interface PreferenceBrain {
  tone: ToneOption;
  language: LanguageOption;
  interactionStyle: StyleOption;
  interests: string[];
  groupMembers: string[];
  zeroOverwhelmMode: boolean;
  revenueShare: number;
}

const DEFAULT_PREFERENCES: PreferenceBrain = {
  tone: "Empowering",
  language: "English",
  interactionStyle: "Adaptive",
  interests: ["Healthcare", "Marketing", "Operations"],
  groupMembers: [],
  zeroOverwhelmMode: false,
  revenueShare: 25,
};

const PREFS_LS_KEY = "createai-brain-prefs-v1";

function loadPrefsFromLS(): PreferenceBrain {
  try {
    const raw = localStorage.getItem(PREFS_LS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function savePrefsToLS(prefs: PreferenceBrain) {
  try { localStorage.setItem(PREFS_LS_KEY, JSON.stringify(prefs)); } catch {}
}

// ─── Intent Routing ────────────────────────────────────────────────────────
const INTENT_MAP: { keywords: string[]; target: AppId }[] = [
  { keywords: ["chat", "talk", "ask", "message", "brain"],                target: "chat" },
  { keywords: ["create", "generate", "build", "make", "write"],           target: "creator" },
  { keywords: ["project", "workspace", "healthcare", "medical"],          target: "projects" },
  { keywords: ["tool", "brochure", "document", "page", "generator"],      target: "tools" },
  { keywords: ["simulate", "simulation", "analyze", "gap", "scenario", "stress", "ad packet", "advertising"], target: "simulation" },
  { keywords: ["marketing", "campaign", "brand", "social", "email"],      target: "marketing" },
  { keywords: ["people", "contact", "invite", "person"],                  target: "people" },
  { keywords: ["file", "doc", "document"],                                 target: "documents" },
  { keywords: ["notification", "alert", "inbox", "updates"],              target: "notifications" },
  { keywords: ["brain hub", "capability", "engines", "meta-agent", "oracle", "forge", "nexus", "sentinel", "pulse", "vector", "series", "omega", "phi"], target: "brainhub" },
  { keywords: ["command center", "commandcenter", "founder", "founder tier", "platform control", "command", "platform status", "systems online", "auto-wire", "protection", "replication", "auto wire"], target: "commandcenter" },
  { keywords: ["opportunity", "opportunities", "opportunity engine", "opp", "pipeline", "discover opportunities", "scan opportunities", "opportunity score", "market opportunity", "revenue opportunity", "partnership opportunity"], target: "opportunity" },
  { keywords: ["lead", "leads", "lead generation", "lead cycle", "lead gen", "outreach", "cold email", "prospecting", "cold outreach", "pipeline leads", "generate leads", "find leads", "sales leads", "b2b leads", "lead qualification"], target: "leadCycle" },
  { keywords: ["ucpx", "ucp-x", "ultra capability", "aria", "platform x", "21 engines", "all engines", "full intelligence", "ucpx agent", "intelligence layer", "platform intelligence"], target: "ucpx" },
  { keywords: ["universal workspace", "workspace shell", "universal demo", "multi-panel", "workspace", "demo mode", "platform shell", "filters panel", "guide panel"], target: "universalDemo" },
  { keywords: ["engine launcher", "generic engine", "run engine", "launch engine", "engine runner", "engine selector", "universal engine", "all engines", "cross-domain engine", "engine chooser"], target: "genericEngine" },
  { keywords: ["metrics", "platform metrics", "engine metrics", "usage metrics", "activity metrics", "system metrics", "analytics", "platform stats", "engine usage", "execution stats", "metrics panel"], target: "metricsPanel" },
  { keywords: ["imagination", "imaginationlab", "story", "character", "worldbuilding", "creature", "superpower", "adventure", "comic", "quest", "fiction", "game idea", "creative", "storytelling", "world builder", "imagine", "dreamscape", "magic system"], target: "imaginationlab" },
  { keywords: ["loreforge", "lore", "mythology", "prophecy", "legend", "religion", "ancient history", "faction", "language engine", "curse", "prophet", "relic", "lorekeeper", "cosmology", "era", "pantheon", "deep lore"], target: "loreforge" },
  { keywords: ["narratoros", "narrator", "scene", "dialogue", "plot twist", "act structure", "conflict engine", "monologue", "ensemble", "narrative voice", "subplot", "screenplay", "cinematic"], target: "narratoros" },
  { keywords: ["civilizationforge", "civilization", "society", "political system", "social strata", "architecture style", "law system", "trade route", "warfare", "food culture", "fashion era", "sports culture", "institution"], target: "civilizationforge" },
  { keywords: ["ecologyforge", "ecology", "biome", "ecosystem", "apex creature", "extinction", "evolution", "flora", "fauna", "climate system", "geology", "oceanic", "symbiosis", "disaster", "migration"], target: "ecologyforge" },
  { keywords: ["soundscape", "soundscapestudio", "fictional music", "instrument forge", "acoustic environment", "ceremonial music", "war music", "lullaby", "epic ballad", "silence engine", "nature sound", "crowd sound", "sonic weapon", "harmony system"], target: "soundscape" },
  { keywords: ["timelineforge", "timeline", "alternate history", "parallel timeline", "temporal paradox", "historical divergence", "ancestral line", "future history", "calendar system", "age transition", "generation cycle", "collapse timeline", "chronology"], target: "timelineforge" },
  { keywords: ["mythweave", "mythweavestudio", "archetype", "symbol system", "motif", "folklore", "ritual", "trickster", "hero journey", "shadow narrative", "transformation", "threshold", "mentor archetype", "oracle archetype", "destiny"], target: "mythweave" },
  { keywords: ["languageforge", "conlang", "constructed language", "phonology", "grammar", "vocabulary", "dialect", "slang", "script", "writing system", "naming system", "sacred language", "sign language", "proverb", "poetry form", "linguistic evolution"], target: "languageforge" },
  { keywords: ["magicsystem", "magic system", "magic rule", "spell", "magic cost", "school of magic", "magic corruption", "artifact", "practitioner", "forbidden magic", "magic ecology", "sentient magic", "magic politics", "magic evolution"], target: "magicsystem" },
  { keywords: ["urbanworld", "city design", "city layout", "district", "underground city", "criminal network", "architecture style", "street culture", "market economy", "slum", "elite quarter", "transportation", "city ghost", "boundary", "urban"], target: "urbanworld" },
  { keywords: ["warlore", "war lore", "army design", "tactics", "siege warfare", "naval warfare", "spy network", "weapon forge", "propaganda", "peace treaty", "mercenary", "war economy", "military tradition", "war crime", "aftermath", "warfare"], target: "warlore" },
  { keywords: ["characterforge", "character forge", "backstory", "core wound", "character flaw", "character voice", "secret", "relationship web", "change arc", "mask persona", "obsession", "character decision", "character death", "want vs need", "moral code"], target: "characterforge" },
  { keywords: ["techforge", "tech forge", "tech level", "energy system", "transportation tech", "weapon tech", "medical tech", "communication tech", "surveillance tech", "agricultural tech", "building tech", "ai equivalent", "tech failure", "tech taboo", "tech revolution"], target: "techforge" },
  { keywords: ["visualworld", "visual world", "color palette", "fashion cycle", "heraldry", "flag design", "visual motif", "art movement", "propaganda art", "funerary art", "body marking", "mask design", "costume", "street art", "forbidden image"], target: "visualworld" },
  { keywords: ["religionforge", "religion forge", "theology", "deity", "sacred text", "clergy", "ritual", "schism", "heresy", "saint", "afterlife", "prayer system", "miracle", "religious war", "atheism", "belief system", "faith"], target: "religionforge" },
  { keywords: ["cosmologyforge", "cosmology forge", "universe physics", "plane of existence", "creation myth", "deity hierarchy", "death mechanics", "soul system", "cosmic conflict", "void", "liminal plane", "ascension", "prophecy mechanics", "universe collapse", "multiverse"], target: "cosmologyforge" },
  { keywords: ["gameworld", "game world", "board game", "sport design", "gambling", "children game", "deadly game", "gladiator", "trading card", "game rules", "stadium culture", "championship", "fixing", "game ban", "wager culture", "play culture"], target: "gameworld" },
  { keywords: ["money", "monetize", "revenue", "earn", "funnel", "offer"],target: "monetization" },
  { keywords: ["admin", "settings", "control", "mode", "user"],           target: "admin" },
  { keywords: ["family", "home", "personal"],                              target: "family" },
  { keywords: ["integration", "connect", "api", "third-party"],           target: "integration" },
  { keywords: ["integration dashboard", "fhir", "hl7", "webhook", "rest api", "phi", "hipaa", "healthcare integration", "tls", "encrypt", "compliance", "simulate", "event log"], target: "integrationDashboard" },
  { keywords: ["builder", "builder space", "code review", "review change", "apply proposal", "diff", "file tree", "preview change", "pending proposal", "code proposal"], target: "builder" },
  { keywords: ["identity", "identity manager", "internal domain", "internal email", "phone id", "project identity", "cai domain", "mail createai", "createai domain", "+cai", "routing"], target: "identityManager" },
  { keywords: ["coverage dashboard", "global coverage", "industry coverage", "roi simulation", "impact dashboard", "createai dashboard", "ai dashboard", "savings dashboard", "compliance dashboard", "enforcement dashboard"], target: "createaiDashboard" },
  { keywords: ["infinite brain", "brain control", "control panel", "launch workflows", "notify family", "brain panel", "system control", "infinite control", "simulation panel", "brain simulator", "expansion sim"], target: "infiniteBrainControl" },
  { keywords: ["infinite brain portal", "portal", "ultimate deployment", "beyond infinity portal", "9 modules", "energy module", "telecom module", "finance module", "healthcare module", "transport module", "water module", "custom ops", "run ultimate", "no limits portal", "full deployment"], target: "infiniteBrainPortal" },
  { keywords: ["infinite brain dashboard", "transcend all", "absolute infinity", "module scores", "overachievement", "industry average", "dashboard metrics", "transcend", "brain dashboard", "module dashboard", "system log dashboard"], target: "infiniteBrainDashboard" },
  { keywords: ["business", "bizengine", "biz engine", "business plan", "business model", "startup", "venture", "monetization model", "operations design", "expansion", "opportunity"],  target: "business" },
  { keywords: ["entity", "entitygen", "entity engine", "brand", "branding", "positioning", "product idea", "platform idea", "business entity", "build entity", "brand strategy", "ecosystem", "compliance", "growth strategy"], target: "entity" },
  { keywords: ["universe", "bizcreator", "biz universe", "concept", "concept expansion", "idea", "visualize", "visualization", "digital twin", "vr", "ar", "knowledge context", "business system", "expand idea", "expand concept", "multi-layer"], target: "bizcreator" },
  { keywords: ["bizdev", "bizplanner", "biz planner", "biz dev", "business plan", "execution plan", "real world plan", "executable", "business development", "go to market", "gtm", "acquisition strategy", "legal risk", "tools systems", "target customers"], target: "bizdev" },
  { keywords: ["projbuilder", "project builder", "project file", "project plan", "healthcare platform", "construction project", "logistics hub", "sop", "standard operating procedure", "intake form", "phone script", "training outline", "launch plan", "30 days"], target: "projbuilder" },
  { keywords: ["projos", "project os", "universal platform", "project dashboard", "folder view", "sub app", "project manager", "project management", "demo mode", "test mode", "live mode", "all projects", "organize projects", "hunting", "farming", "project folder"], target: "projos" },
  // ── New Platform Capabilities ─────────────────────────────────────────────
  { keywords: ["advertising hub", "ads hub", "adshub", "advertising assets", "ad templates", "platform ads", "ad copy", "content calendar", "ad scripts", "brand assets", "advertising content", "ad generator", "social media ads", "ad hub"], target: "adshub" },
  { keywords: ["ad orchestrator", "campaign manager", "deploy campaigns", "campaign deployment", "ad deployment", "connect ad network", "ad network credentials", "meta ads api", "google ads api", "tiktok ads api", "linkedin ads api", "ad credentials", "ads reporting", "ad performance", "internal ads", "platform ads internal", "ad spend", "ad reporting dashboard", "universal ads", "all ad networks", "deploy ads", "ad accounts", "advertising deploy", "ad network setup", "google ads", "facebook ads api", "tiktok ads", "snapchat ads api", "reddit ads", "pinterest ads", "microsoft ads", "bing ads", "twitter ads api", "x ads api"], target: "adsOrchestrator" },
  { keywords: ["auth lab", "authlab", "authentication", "magic link", "passwordless", "device fingerprint", "trusted device", "passkey", "session", "auth methods", "login security", "2fa", "two factor", "secure login", "auth upgrade", "authentication lab", "sign in methods"], target: "authlab" },
  { keywords: ["paygate", "pay gate", "invoice", "payment rail", "payment methods", "update payment methods", "show payment options", "what are my payment options", "cash app", "cashapp", "createaidigital", "venmo", "accept payment", "create invoice", "send invoice", "payment tracking", "revenue collection", "stripe alternative", "invoice system", "collect payment", "billing", "mark paid", "mark invoice paid", "daily income", "has invoice been paid"], target: "paygate" },
  { keywords: ["invention layer", "inventionlayer", "invention tools", "12 tools", "ai clinical scribe", "ai fleet", "ai energy", "ai property", "ai risk underwriter", "ai legal research", "ai production", "ai grant writer", "ai compliance", "ai email sequence", "ai financial intelligence", "ai agronomist", "bypass software", "replace software", "no hardware", "no license"], target: "inventionLayer" },
  { keywords: ["percentage engine", "percentages", "percentage", "system readiness", "how high are we", "how high are we now", "capability score", "platform score", "readiness score", "completeness", "what percent", "system percentage", "subsystem score", "over 100", "over 1000", "expansion score", "platform capability", "daily income", "revenue capacity", "financial capacity", "how complete", "platform health score", "unified score", "score engine"], target: "percentageEngine" },
  { keywords: ["activate", "activation", "activate all", "fire all", "fire all engines", "maximum potential", "activate systems", "all systems", "activate revenue", "activate platform", "launch all", "go live", "full activation", "command center", "engine status", "system status", "blockers", "bypass blockers", "execution sequence", "what fires next", "engines running", "what's running", "platform running", "revenue engines", "autonomous engines", "all revenue systems", "full auto", "max activation", "turn everything on", "start all systems"], target: "activation" },
  { keywords: ["credentials", "credentials hub", "api token", "api key", "marketplace token", "connect shopify", "connect etsy", "connect amazon", "connect ebay", "creative market", "shopify token", "etsy api", "amazon sp", "ebay oauth", "marketplace connect", "add token", "enter token", "activate marketplace", "external marketplace", "dns records", "resend dns", "domain verification", "email verification", "verify domain", "dns setup", "client link", "share invoice", "invoice link", "shareable link", "client payment page", "no email needed"], target: "credentialsHub" },
  { keywords: ["referral", "referral program", "refer a friend", "invite link", "share link", "my referral link", "referral code", "referral stats", "clicks", "conversions", "leaderboard", "top referrers", "viral loop", "share createai", "invite someone", "grow platform", "earn referral", "referral tracking", "unique code", "share on twitter", "share on linkedin", "whatsapp invite"], target: "referral" },
  { keywords: ["growth", "growth engine", "analytics", "page views", "traffic", "leads", "lead capture", "lead database", "seo traffic", "email list", "mailchimp alternative", "google analytics alternative", "visitors", "industry traffic", "conversion funnel", "growth dashboard", "traffic sources", "top pages", "next steps", "setup guide", "google search console", "resend email", "stripe verification", "3 manual steps", "search engine", "sitemap"], target: "growthEngine" },
  { keywords: ["platform identity", "npa", "nexus platform address", "identity", "domain", "live url", "internal domain", "no domain", "brand domain", "domain settings", "platform address", "npa settings", "handle", "createaidigital", "my url", "platform url", "identity system", "domain system", "internal identity", "email identity", "verification substitute", "internal routing", "well-known", "platform-id", "npa resolve", "identity resolution", "domain free"], target: "npaSettings" },
  { keywords: ["self host", "self-host", "hosting", "internal hosting", "build frontend", "serve frontend", "createai url", "internal routing", "url map", "createai://", "proof token", "platform proof", "verification", "publish", "snapshot", "internal publish", "build", "compile", "dist", "frontend build", "watchdog", "service loop", "self contained", "no vercel", "no netlify", "no replit deploy", "single server", "one port", "port 8080", "serve everything"], target: "selfHost" },
  { keywords: ["handle protocol", "web+npa", "protocol handler", "register protocol", "npa protocol", "handle url", "professional url", "no domain", "free url", "portable card", "platform card", "redirect card", "handle redirect", "npa gateway", "protocol link", "browser protocol", "custom protocol", "web+ scheme", "protocol registration", "pwa protocol", "install app", "add to home screen", "github pages redirect", "free hosting card", "self resolving", "portable html", "url without domain"], target: "handleProtocol" },
  { keywords: ["platform report", "analytics report", "full report", "system report", "internal analytics", "platform analytics", "readiness score", "engine report", "capability score", "platform score", "subsystem scores", "product pipeline report", "revenue status", "ad engine report", "traction report", "identity completeness", "capacity projection", "platform metrics", "internal metrics", "all systems", "platform health", "complete report", "dashboard report", "analytics dashboard", "report card", "platform audit"], target: "platformReport" },
  // ── Domain Gap Engines ────────────────────────────────────────────────────
  { keywords: ["domain hub", "all domains", "25 domains", "domain engines", "domain coverage", "enterprise gaps", "industry gaps", "all 19", "domain overview", "platform domains", "domain complete", "zero gaps"], target: "domainHub" },
  { keywords: ["crm", "contact intelligence", "contacts", "pipeline", "deals", "salesforce", "hubspot", "leads", "accounts", "opportunities", "contact management", "sales pipeline", "deal value", "relationship tracking"], target: "domainCRM" },
  { keywords: ["ledger", "accounting", "transaction ledger", "journal", "balance sheet", "trial balance", "quickbooks", "xero", "bookkeeping", "double entry", "debit", "credit", "cash flow accounting", "financial records"], target: "domainLedger" },
  { keywords: ["order flow", "orders", "order management", "fulfillment", "oms", "shopify orders", "order status", "order tracking", "purchase orders", "order lifecycle", "revenue tracking"], target: "domainOrders" },
  { keywords: ["cases", "case resolution", "support", "helpdesk", "tickets", "zendesk", "freshdesk", "sla", "customer support", "support cases", "support tickets", "issue tracker", "ticket resolution"], target: "domainCases" },
  { keywords: ["content pipeline", "cms", "content management", "blog", "editorial calendar", "content calendar", "wordpress", "contentful", "publish content", "content workflow", "blog posts", "content types"], target: "domainContent" },
  { keywords: ["kpi", "insight engine", "bi", "business intelligence", "dashboard kpi", "tableau", "power bi", "key performance", "metrics dashboard", "kpi tracking", "data insights", "analytics kpi", "goals tracking"], target: "domainKPI" },
  { keywords: ["agreements", "agreement flow", "contracts", "clm", "docusign", "ironclad", "contract lifecycle", "contract management", "saas agreement", "service agreement", "ndas", "msa", "contract value", "auto renew"], target: "domainAgreements" },
  { keywords: ["growth path", "learning", "l&d", "learning development", "courses", "training", "workday learning", "docebo", "learning tracks", "ai tools training", "platform training", "learning management"], target: "domainGrowthPath" },
  { keywords: ["asset flow", "inventory", "stock", "supply chain", "netsuite", "tradegecko", "assets", "asset registry", "reorder", "sku", "warehouse", "stock levels", "supplier"], target: "domainAssets" },
  { keywords: ["engagement map", "customer journey", "journey builder", "touchpoints", "funnel", "conversion funnel", "discovery stage", "advocacy", "customer stages", "marketing funnel", "attribution"], target: "domainEngagement" },
  { keywords: ["value exchange", "banking", "internal banking", "accounts", "transfers", "financial accounts", "platform banking", "escrow", "reserve account", "revenue pool"], target: "domainValueExchange" },
  { keywords: ["risk coverage", "risk assessment", "insurance", "risk scoring", "coverage level", "underwriting", "risk factors", "risk management", "platform risk"], target: "domainRiskCoverage" },
  { keywords: ["property flow", "real estate", "properties", "listings", "portfolio", "property management", "deals real estate", "property value"], target: "domainPropertyFlow" },
  { keywords: ["workforce pipeline", "ats", "applicant tracking", "candidates", "recruiting", "hiring pipeline", "greenhouse", "lever", "talent acquisition", "job applicants", "candidate stages"], target: "domainWorkforce" },
  { keywords: ["performance review", "perf review", "reviews", "goals", "performance goals", "okr", "performance management", "employee review", "rating", "performance score"], target: "domainPerfReview" },
  { keywords: ["campaigns", "campaign intelligence", "marketing automation", "marketo", "hubspot marketing", "email campaigns", "drip", "nurture", "campaign management", "automated marketing"], target: "domainCampaigns" },
  { keywords: ["regulatory", "compliance", "regulatory map", "gdpr", "pci", "ccpa", "hipaa", "soc 2", "compliance tracking", "regulatory status", "audit compliance", "compliance management"], target: "domainRegulatory" },
  { keywords: ["fiscal intelligence", "fpa", "fp&a", "budget", "forecast", "actuals", "adaptive planning", "anaplan", "financial planning", "budgeting", "revenue planning", "expense planning"], target: "domainFiscal" },
  { keywords: ["recurring revenue", "subscriptions", "subscription billing", "mrr", "arr", "chargebee", "recurly", "subscription management", "monthly recurring", "billing cycles", "annual revenue"], target: "domainRecurring" },
  // ── Extended Domain Suite v2.0 NEXUS keywords ────────────────────────────
  { keywords: ["project command", "projects cmd", "project management", "tasks", "sprints", "milestones", "jira", "asana", "monday", "project tracking", "task management", "project dashboard", "team projects", "project health"], target: "projectsCmd" },
  { keywords: ["partner network", "partners", "affiliate", "affiliates", "reseller", "referral program", "commissions", "partner tiers", "partner revenue", "partnerstack", "impact", "tapfiliate", "affiliate marketing", "referral tracking"], target: "partnerNet" },
  { keywords: ["events", "event booking", "bookings", "tickets", "webinar", "workshop", "conference", "attendees", "eventbrite", "hopin", "event management", "event calendar", "check-in", "capacity management"], target: "eventBooking" },
  { keywords: ["education hub", "courses", "learning", "lms", "e-learning", "course management", "enrollments", "certificates", "teachable", "kajabi", "thinkific", "student progress", "training programs", "course creation"], target: "educationHub" },
  { keywords: ["social command", "social media", "instagram", "tiktok", "linkedin", "youtube", "social posts", "hootsuite", "buffer", "social scheduling", "content calendar", "social analytics", "post scheduling", "social management"], target: "socialCmd" },
  { keywords: ["supply chain", "vendors", "purchase orders", "pos", "procurement", "fulfillment", "netsuite", "inventory management", "vendor management", "purchase management", "supply management", "vendor reliability"], target: "supplyChainOps" },
  { keywords: ["franchise", "franchise hub", "locations", "operators", "royalties", "franchise management", "franconnect", "compliance score", "territory management", "franchise operations", "multi-location", "franchise revenue"], target: "franchiseOps" },
  { keywords: ["brand vault", "brand assets", "brand guidelines", "brand management", "bynder", "brandfolder", "logo assets", "brand colors", "brand templates", "brand compliance", "asset management", "brand system"], target: "brandVault" },
  { keywords: ["revenue intelligence", "revenue analytics", "cohort analysis", "ltv", "customer lifetime value", "churn", "churn rate", "chartmogul", "baremetrics", "arr", "mrr trends", "nrr", "arpu", "revenue metrics", "retention analytics"], target: "revenueIntel" },
  { keywords: ["ai strategy", "strategy engine", "strategic intelligence", "business strategy", "competitive analysis", "growth strategy", "strategic planning", "90-day plan", "strategic advisor", "strategy generation", "competitive landscape", "pivot analysis", "market strategy"], target: "aiStrategy" },
];

function routeIntentFn(intent: string): AppId | null {
  const lower = intent.toLowerCase();
  for (const mapping of INTENT_MAP) {
    if (mapping.keywords.some(k => lower.includes(k))) return mapping.target;
  }
  return null;
}

// ─── App icon/label map for recent activity ────────────────────────────────
const APP_META: Record<AppId, { icon: string; label: string }> = {
  chat:         { icon: "💬", label: "AI Chat" },
  projects:     { icon: "📁", label: "Projects" },
  tools:        { icon: "🛠️", label: "Tools" },
  creator:      { icon: "✨", label: "Create" },
  people:       { icon: "👥", label: "People" },
  documents:    { icon: "📄", label: "Documents" },
  marketing:    { icon: "📣", label: "Marketing" },
  admin:        { icon: "⚙️", label: "Admin" },
  family:       { icon: "🏡", label: "Family" },
  integration:  { icon: "🔌", label: "Integration" },
  monetization: { icon: "💰", label: "Monetize" },
  simulation:   { icon: "🧪", label: "Simulate" },
  universal:    { icon: "🌐", label: "Universal" },
  business:     { icon: "🏗️", label: "BizEngine" },
  entity:       { icon: "🧬", label: "EntityGen" },
  bizcreator:   { icon: "🌌", label: "BizUniverse" },
  bizdev:       { icon: "⚡", label: "BizPlanner" },
  projbuilder:  { icon: "📋", label: "ProjBuilder" },
  projos:       { icon: "📂", label: "ProjectOS" },
  notifications:  { icon: "🔔", label: "Notifications" },
  brainhub:       { icon: "⚡", label: "Brain Hub" },
  commandcenter:  { icon: "🎛️", label: "Command Center" },
  researchhub:    { icon: "🔬", label: "Research Hub" },
  learningcenter: { icon: "🎓", label: "Learning Center" },
  personastudio:  { icon: "👤", label: "Persona Studio" },
  datastudio:     { icon: "🗄️", label: "Data Studio" },
  pricingstudio:  { icon: "💰", label: "Pricing Studio" },
  traction:       { icon: "📈", label: "Traction" },
  opportunity:    { icon: "🎯", label: "Opportunities" },
  leadCycle:      { icon: "🔄", label: "Lead Cycle"     },
  imaginationlab:     { icon: "✨", label: "ImaginationLab" },
  loreforge:          { icon: "📜", label: "LoreForge" },
  narratoros:         { icon: "🎬", label: "NarratorOS" },
  civilizationforge:  { icon: "🏛️", label: "CivilizationForge" },
  ecologyforge:       { icon: "🌿", label: "EcologyForge" },
  soundscape:         { icon: "🎵", label: "SoundscapeStudio" },
  timelineforge:      { icon: "⏰", label: "TimelineForge" },
  mythweave:          { icon: "🕸️", label: "MythweaveStudio" },
  languageforge:   { icon: "🔤", label: "LanguageForge" },
  magicsystem:     { icon: "✨", label: "MagicSystemStudio" },
  urbanworld:      { icon: "🏙️", label: "UrbanWorldEngine" },
  warlore:         { icon: "⚔️", label: "WarloreStudio" },
  characterforge:  { icon: "🧠", label: "CharacterForge" },
  techforge:       { icon: "🛸", label: "TechForge" },
  visualworld:     { icon: "🎨", label: "VisualWorldStudio" },
  religionforge:   { icon: "🙏", label: "ReligionForge" },
  cosmologyforge:  { icon: "🌌", label: "CosmologyForge" },
  gameworld:       { icon: "🎲", label: "GameWorldStudio" },
  // Creative Writing
  scriptwriter:    { icon: "🎬", label: "Scriptwriter" },
  comicscript:     { icon: "💥", label: "ComicScript Studio" },
  poemforge:       { icon: "🌸", label: "PoemForge" },
  essaywriter:     { icon: "📝", label: "Essay Writer" },
  blogwriter:      { icon: "✍️", label: "Blog Writer" },
  copywriter:      { icon: "💡", label: "Copywriter" },
  storyboarder:    { icon: "🎞️", label: "Storyboarder" },
  speechwriter:    { icon: "🎤", label: "Speechwriter" },
  bookplanner:     { icon: "📚", label: "Book Planner" },
  technicalwriter: { icon: "⚙️", label: "Technical Writer" },
  contentcalendar: { icon: "📅", label: "Content Calendar" },
  // Business & Strategy
  strategist:      { icon: "♟️", label: "Business Strategist" },
  reportbuilder:   { icon: "📊", label: "Report Builder" },
  proposalbuilder: { icon: "📨", label: "Proposal Builder" },
  emailcomposer:   { icon: "📧", label: "Email Composer" },
  hiringassist:    { icon: "🤝", label: "Hiring Assistant" },
  meetingplanner:  { icon: "🗓️", label: "Meeting Planner" },
  presentbuilder:  { icon: "📊", label: "Presentation Builder" },
  budgetplanner:   { icon: "💰", label: "Budget Planner" },
  perfreviewer:    { icon: "⭐", label: "Performance Reviewer" },
  contractdraft:   { icon: "📜", label: "Contract Drafter" },
  // World Building
  alienspecies:       { icon: "👾", label: "Alien Species Forge" },
  planetbuilder:      { icon: "🪐", label: "Planet Builder" },
  futurecivilization: { icon: "🔭", label: "Future Civilization" },
  monsterforge:       { icon: "🐉", label: "Monster Forge" },
  artifactforge:      { icon: "💎", label: "Artifact Forge" },
  dimensionbuilder:   { icon: "🌀", label: "Dimension Builder" },
  dystopia:           { icon: "🏭", label: "Dystopia Builder" },
  utopia:             { icon: "🌈", label: "Utopia Builder" },
  ancientcivilization:{ icon: "🏛️", label: "Ancient Civilization" },
  // Learning & Research
  researchassist:     { icon: "🔬", label: "Research Assistant" },
  conceptexplainer:   { icon: "💡", label: "Concept Explainer" },
  debateprep:         { icon: "🎤", label: "Debate Prep" },
  criticalthinking:   { icon: "🧩", label: "Critical Thinking" },
  philosophyexplorer: { icon: "🦉", label: "Philosophy Explorer" },
  studyplanner:       { icon: "📖", label: "Study Planner" },
  scienceexplainer:   { icon: "🔭", label: "Science Explainer" },
  mathsolver:         { icon: "🔢", label: "Math Solver" },
  // Lifestyle
  journal:            { icon: "📔", label: "Journal Studio" },
  goalplanner:        { icon: "🎯", label: "Goal Planner" },
  travelplanner:      { icon: "✈️", label: "Travel Planner" },
  recipecreator:      { icon: "👨‍🍳", label: "Recipe Creator" },
  fitnesscoach:       { icon: "💪", label: "Fitness Coach" },
  meditationguide:    { icon: "🧘", label: "Meditation Guide" },
  financeadvisor:     { icon: "📈", label: "Finance Advisor" },
  relationshipcoach:  { icon: "💑", label: "Relationship Coach" },
  // Music & Audio
  lyricswriter:    { icon: "🎵", label: "Lyrics Writer" },
  songstructure:   { icon: "🎼", label: "Song Structure Studio" },
  podcastplanner:  { icon: "🎙️", label: "Podcast Planner" },
  musictheory:     { icon: "🎶", label: "Music Theory Studio" },
  sounddesigner:   { icon: "🔊", label: "Sound Designer" },
  // Game Design
  questdesigner:   { icon: "⚔️", label: "Quest Designer" },
  npccreator:      { icon: "🎭", label: "NPC Creator" },
  dungeonbuilder:  { icon: "🏰", label: "Dungeon Builder" },
  itemforge:       { icon: "🗡️", label: "Item Forge" },
  gamenarrative:   { icon: "📖", label: "Game Narrative" },
  balancedesigner: { icon: "⚖️", label: "Balance Designer" },
  // AI & Tech
  promptengineer:  { icon: "🤖", label: "Prompt Engineer" },
  datastoryteller: { icon: "📊", label: "Data Storyteller" },
  systemdesigner:  { icon: "🏗️", label: "System Designer" },
  codereviewer:    { icon: "👨‍💻", label: "Code Reviewer" },
  devplanner:      { icon: "🗂️", label: "Dev Planner" },
  // Health & Wellness
  healthcoach:       { icon: "🏥", label: "Health Coach" },
  mentalhealth:      { icon: "💙", label: "Mental Health Support" },
  nutritionplanner:  { icon: "🥗", label: "Nutrition Planner" },
  sleepcoach:        { icon: "🌙", label: "Sleep Coach" },
  parentingguide:    { icon: "👨‍👩‍👧", label: "Parenting Guide" },
  // Arts & Culture
  artcritique:     { icon: "🖼️", label: "Art Critique Studio" },
  filmanalysis:    { icon: "🎬", label: "Film Analysis Studio" },
  culturalexplorer:{ icon: "🌍", label: "Cultural Explorer" },
  // Legal & Professional
  legaldrafter:    { icon: "⚖️", label: "Legal Drafter" },
  ipprotection:    { icon: "🛡️", label: "IP Protection" },
  privacypolicy:   { icon: "🔐", label: "Privacy Policy Studio" },
  // Education
  lessonplanner:      { icon: "📚", label: "Lesson Planner" },
  curriculumdesigner: { icon: "🎓", label: "Curriculum Designer" },
  // Platform
  ucpx:           { icon: "🧠", label: "UCP-X Intelligence"  },
  universalDemo:  { icon: "🌐", label: "Universal Workspace" },
  genericEngine:  { icon: "⚡", label: "Engine Launcher"     },
  metricsPanel:           { icon: "📊", label: "Platform Metrics" },
  integrationDashboard:   { icon: "🔗", label: "Integration Dashboard" },
  builder:                { icon: "🔧", label: "Builder Space" },
  identityManager:        { icon: "🪪", label: "Identity Manager" },
  createaiDashboard:      { icon: "📊", label: "Coverage Dashboard" },
  infiniteBrainControl:  { icon: "🚀", label: "Infinite Brain Control" },
  infiniteBrainPortal:    { icon: "💠", label: "Infinite Brain Portal" },
  infiniteBrainDashboard: { icon: "📊", label: "Infinite Brain Dashboard" },
  // ── Industry OS ──────────────────────────────────────────────────────────
  healthos:       { icon: "🏥", label: "HealthOS" },
  legalpm:        { icon: "⚖️", label: "LegalPM" },
  staffingos:     { icon: "🎯", label: "StaffingOS" },
  adshub:          { icon: "📢", label: "Advertising Hub" },
  adsOrchestrator: { icon: "📡", label: "Ad Campaign Orchestrator" },
  authlab:        { icon: "🔐", label: "Authentication Lab" },
  paygate:        { icon: "💳", label: "PayGate" },
  inventionLayer:    { icon: "🔬", label: "Invention Layer" },
  percentageEngine:  { icon: "📊", label: "Percentage Engine" },
  activation:        { icon: "⚡", label: "Activation Center" },
  credentialsHub:    { icon: "🔗", label: "Credentials Hub" },
  referral:          { icon: "🎁", label: "Referral Program" },
  growthEngine:      { icon: "📈", label: "Growth Engine" },
  npaSettings:       { icon: "🪪", label: "Platform Identity" },
  selfHost:          { icon: "🏠", label: "Self-Host Engine" },
  handleProtocol:    { icon: "🔗", label: "Handle Protocol" },
  platformReport:    { icon: "📊", label: "Platform Analytics Report" },
  // ── Domain Gap Engines ────────────────────────────────────────────────────
  domainHub:          { icon: "🌐", label: "Domain Hub" },
  domainCRM:          { icon: "👥", label: "Contact Intelligence" },
  domainLedger:       { icon: "📒", label: "Transaction Ledger" },
  domainOrders:       { icon: "📦", label: "Order Flow" },
  domainCases:        { icon: "🎫", label: "Case Resolution" },
  domainContent:      { icon: "📝", label: "Content Pipeline" },
  domainKPI:          { icon: "📊", label: "Insight Engine" },
  domainAgreements:   { icon: "📄", label: "Agreement Flow" },
  domainGrowthPath:   { icon: "🎓", label: "Growth Path" },
  domainAssets:       { icon: "🏭", label: "Asset Flow" },
  domainEngagement:   { icon: "🗺️", label: "Engagement Map" },
  domainValueExchange:{ icon: "🏦", label: "Value Exchange" },
  domainRiskCoverage: { icon: "🛡️", label: "Risk Coverage" },
  domainPropertyFlow: { icon: "🏠", label: "Property Flow" },
  domainWorkforce:    { icon: "🎯", label: "Workforce Pipeline" },
  domainPerfReview:   { icon: "⭐", label: "Performance Review" },
  domainCampaigns:    { icon: "📡", label: "Campaign Intelligence" },
  domainRegulatory:   { icon: "⚖️", label: "Regulatory Map" },
  domainFiscal:       { icon: "💹", label: "Fiscal Intelligence" },
  domainRecurring:    { icon: "🔄", label: "Recurring Revenue" },
  // Extended Domain Suite v2.0
  projectsCmd:    { icon: "🎯", label: "Project Command" },
  partnerNet:     { icon: "🤝", label: "Partner Network" },
  eventBooking:   { icon: "📅", label: "Events & Bookings" },
  educationHub:   { icon: "🎓", label: "Education Hub" },
  socialCmd:      { icon: "📣", label: "Social Command" },
  supplyChainOps: { icon: "🚚", label: "Supply Chain" },
  franchiseOps:   { icon: "🏪", label: "Franchise Hub" },
  brandVault:     { icon: "💎", label: "Brand Vault" },
  revenueIntel:   { icon: "📈", label: "Revenue Intelligence" },
  aiStrategy:     { icon: "🧠", label: "AI Strategy Engine" },

  // ── Enterprise Suite Apps ──────────────────────────────────────────────────
  zeroTrust: { icon: "🔐", label: "Zero Trust" },
  threatModel: { icon: "⚠️", label: "Threat Model" },
  socDashboard: { icon: "🛡️", label: "SOC Ops" },
  penTestPlan: { icon: "🕵️", label: "Pen Test" },
  incidentResponse: { icon: "🚨", label: "Incident Response" },
  iamStudio: { icon: "🔑", label: "IAM Studio" },
  encryptionPlanner: { icon: "🔒", label: "Encryption" },
  vulnScanner: { icon: "🦠", label: "Vuln Scanner" },
  securityAuditStudio: { icon: "📋", label: "Security Audit" },
  cloudSecurity: { icon: "☁️", label: "Cloud Security" },
  networkDefense: { icon: "🌐", label: "Network Security" },
  appSecurity: { icon: "💻", label: "App Security" },
  endpointSecurity: { icon: "📱", label: "Endpoint Security" },
  secureSDLC: { icon: "⚙️", label: "Secure SDLC" },
  privacyByDesign: { icon: "🔏", label: "Privacy Design" },
  cyberResilience: { icon: "💪", label: "Cyber Resilience" },
  redTeamPlanner: { icon: "🎯", label: "Red Team" },
  securityPosture: { icon: "📊", label: "Security Posture" },
  cveTracker: { icon: "🎯", label: "CVE Tracker" },
  securityPolicy: { icon: "📜", label: "Security Policy" },
  financialModeler: { icon: "📈", label: "Financial Model" },
  revenueRecognition: { icon: "💹", label: "Revenue Rec" },
  cashFlowPlanner: { icon: "💰", label: "Cash Flow" },
  investmentThesis: { icon: "🚀", label: "Investment Thesis" },
  fundraisingStudio: { icon: "💼", label: "Fundraising" },
  taxStrategy: { icon: "🧾", label: "Tax Strategy" },
  equityPlanner: { icon: "📊", label: "Equity Planner" },
  unitEconomics: { icon: "🔢", label: "Unit Economics" },
  auditPrep: { icon: "📋", label: "Audit Prep" },
  budgetBuilder: { icon: "💵", label: "Budget Builder" },
  maAnalyzer: { icon: "🤝", label: "M&A Analyzer" },
  ipoReadiness: { icon: "📣", label: "IPO Readiness" },
  grantWriter: { icon: "✍️", label: "Grant Writer" },
  cryptoTokenomics: { icon: "🪙", label: "Tokenomics" },
  insurancePlanner: { icon: "🛡️", label: "Insurance" },
  debtStructure: { icon: "🏦", label: "Debt Structure" },
  fpaDashboard: { icon: "📊", label: "FP&A" },
  treasuryManager: { icon: "🏛️", label: "Treasury" },
  financeReport: { icon: "📄", label: "Finance Report" },
  capTable: { icon: "📋", label: "Cap Table" },
  ehrIntegration: { icon: "🏥", label: "EHR Integration" },
  clinicalWorkflow: { icon: "🩺", label: "Clinical Workflow" },
  patientEngagement: { icon: "❤️", label: "Patient Engagement" },
  healthcareCompliance: { icon: "⚖️", label: "HC Compliance" },
  telehealthBuilder: { icon: "⚙️", label: "Telehealth Builder" },
  clinicalTrial: { icon: "⚙️", label: "Clinical Trial" },
  medicalCoding: { icon: "🏷️", label: "Medical Coding" },
  healthAnalytics: { icon: "📊", label: "Health Analytics" },
  careCoordination: { icon: "🤝", label: "Care Coordination" },
  healthcareAPI: { icon: "⚙️", label: "Healthcare A P I" },
  mentalHealthPlatform: { icon: "💙", label: "Mental Health" },
  homeHealthOS: { icon: "🏠", label: "Home Health" },
  pharmacyOS: { icon: "⚙️", label: "Pharmacy O S" },
  medicalDevice: { icon: "🔬", label: "Medical Device" },
  healthDataGovernance: { icon: "🔒", label: "Health Data" },
  clinicalDecision: { icon: "⚙️", label: "Clinical Decision" },
  healthBilling: { icon: "⚙️", label: "Health Billing" },
  populationHealth: { icon: "👥", label: "Population Health" },
  hipaaDashboard: { icon: "⚙️", label: "Hipaa Dashboard" },
  fhirBuilder: { icon: "⚡", label: "FHIR Builder" },
  learningPathBuilder: { icon: "⚙️", label: "Learning Path Builde" },
  assessmentBuilder: { icon: "⚙️", label: "Assessment Builder" },
  studentEngagement: { icon: "🌟", label: "Student Engage" },
  lmsBuilder: { icon: "⚙️", label: "Lms Builder" },
  edTechStack: { icon: "⚙️", label: "Ed Tech Stack" },
  eduAccessibility: { icon: "⚙️", label: "Edu Accessibility" },
  instructionalDesign: { icon: "🎯", label: "Instructional Design" },
  microlearningStudio: { icon: "⚙️", label: "Microlearning Studio" },
  gameLearning: { icon: "⚙️", label: "Game Learning" },
  virtualClassroom: { icon: "🖥️", label: "Virtual Classroom" },
  credentialBuilder: { icon: "⚙️", label: "Credential Builder" },
  adaptiveLearning: { icon: "🤖", label: "Adaptive Learning" },
  parentPortal: { icon: "⚙️", label: "Parent Portal" },
  teacherToolbox: { icon: "⚙️", label: "Teacher Toolbox" },
  k12Platform: { icon: "⚙️", label: "K12 Platform" },
  higherEduOS: { icon: "⚙️", label: "Higher Edu O S" },
  continuingEdu: { icon: "⚙️", label: "Continuing Edu" },
  schoolAnalytics: { icon: "⚙️", label: "School Analytics" },
  eduMarketplace: { icon: "⚙️", label: "Edu Marketplace" },
  supplyChainOS: { icon: "🔗", label: "Supply Chain" },
  inventoryOS: { icon: "⚙️", label: "Inventory O S" },
  qualityManagement: { icon: "✅", label: "Quality Mgmt" },
  facilitiesOS: { icon: "⚙️", label: "Facilities O S" },
  processMiner: { icon: "⚙️", label: "Process Miner" },
  logisticsOS: { icon: "⚙️", label: "Logistics O S" },
  procurementOS: { icon: "🛒", label: "Procurement" },
  vendorOS: { icon: "⚙️", label: "Vendor O S" },
  opsAnalytics: { icon: "⚙️", label: "Ops Analytics" },
  leanSigma: { icon: "⚙️", label: "Lean Sigma" },
  changeManagement: { icon: "🔄", label: "Change Mgmt" },
  bcpBuilder: { icon: "⚙️", label: "Bcp Builder" },
  kpiBuilder: { icon: "⚙️", label: "Kpi Builder" },
  workflowRPA: { icon: "⚙️", label: "Workflow R P A" },
  fieldOps: { icon: "📍", label: "Field Ops" },
  capacityPlanner: { icon: "⚙️", label: "Capacity Planner" },
  okrStudio: { icon: "🎯", label: "OKR Studio" },
  opExDashboard: { icon: "⚙️", label: "Op Ex Dashboard" },
  slaManager: { icon: "⚙️", label: "Sla Manager" },
  operationsWiki: { icon: "⚙️", label: "Operations Wiki" },
  esgReporter: { icon: "⚙️", label: "Esg Reporter" },
  carbonTracker: { icon: "⚙️", label: "Carbon Tracker" },
  sustainabilityPlanner: { icon: "⚙️", label: "Sustainability Plann" },
  circularEconomy: { icon: "🔁", label: "Circular Economy" },
  renewableEnergy: { icon: "⚡", label: "Renewable Energy" },
  sustainableSupply: { icon: "🌱", label: "Sust. Supply" },
  greenBuilding: { icon: "🏢", label: "Green Building" },
  wasteTracker: { icon: "⚙️", label: "Waste Tracker" },
  waterStewardship: { icon: "💧", label: "Water Mgmt" },
  biodiversity: { icon: "⚙️", label: "Biodiversity" },
  socialImpact: { icon: "💚", label: "Social Impact" },
  greenFinance: { icon: "💰", label: "Green Finance" },
  lcaBuilder: { icon: "⚙️", label: "Lca Builder" },
  climateRisk: { icon: "🌡️", label: "Climate Risk" },
  sustainabilityReport: { icon: "⚙️", label: "Sustainability Repor" },
  sdgAlignment: { icon: "🎯", label: "SDG Align" },
  corpSustainability: { icon: "⚙️", label: "Corp Sustainability" },
  environmentalOS: { icon: "⚙️", label: "Environmental O S" },
  netZeroRoadmap: { icon: "♻️", label: "Net Zero" },
  greenProcurement: { icon: "⚙️", label: "Green Procurement" },
  talentAcquisition: { icon: "👥", label: "Talent Acq" },
  employeeExperience: { icon: "😊", label: "Employee Exp" },
  performanceOS: { icon: "⚙️", label: "Performance O S" },
  ldStudio: { icon: "⚙️", label: "Ld Studio" },
  compBenchmark: { icon: "⚙️", label: "Comp Benchmark" },
  workforcePlanner: { icon: "⚙️", label: "Workforce Planner" },
  deiStudio: { icon: "⚙️", label: "Dei Studio" },
  offboarding: { icon: "⚙️", label: "Offboarding" },
  hrAnalytics: { icon: "⚙️", label: "Hr Analytics" },
  engagementSurvey: { icon: "⚙️", label: "Engagement Survey" },
  successionPlanner: { icon: "⚙️", label: "Succession Planner" },
  hrisDesigner: { icon: "⚙️", label: "Hris Designer" },
  remoteWorkOS: { icon: "⚙️", label: "Remote Work O S" },
  orgDesign: { icon: "⚙️", label: "Org Design" },
  employerBranding: { icon: "⚙️", label: "Employer Branding" },
  hrCompliance: { icon: "⚖️", label: "HR Compliance" },
  wellnessProgram: { icon: "❤️", label: "Wellness" },
  talentPipeline: { icon: "🔮", label: "Talent Pipeline" },
  onboardingOS: { icon: "🚀", label: "Onboarding" },
  peopleOps: { icon: "⚙️", label: "People Ops" },
  legalResearch: { icon: "🔍", label: "Legal Research" },
  complianceMapping: { icon: "⚙️", label: "Compliance Mapping" },
  legalRisk: { icon: "⚙️", label: "Legal Risk" },
  ipStrategy: { icon: "⚙️", label: "Ip Strategy" },
  litigationPlanner: { icon: "⚙️", label: "Litigation Planner" },
  corporateGovernance: { icon: "🏛️", label: "Corp Governance" },
  legalTemplate: { icon: "⚙️", label: "Legal Template" },
  dueDiligence: { icon: "🔍", label: "Due Diligence" },
  privacyLaw: { icon: "🔒", label: "Privacy Law" },
  laborLaw: { icon: "👷", label: "Labor Law" },
  tradeCompliance: { icon: "🌐", label: "Trade Compliance" },
  regulatoryFiling: { icon: "⚙️", label: "Regulatory Filing" },
  legalAnalytics: { icon: "⚙️", label: "Legal Analytics" },
  adrStudio: { icon: "🤝", label: "ADR Studio" },
  productDiscovery: { icon: "🔭", label: "Product Discovery" },
  userResearch: { icon: "🔍", label: "User Research" },
  jtbdStudio: { icon: "💡", label: "JTBD Studio" },
  roadmapBuilder: { icon: "🗺️", label: "Roadmap Builder" },
  featurePrioritizer: { icon: "🎯", label: "Feature Prior." },
  userStoryMapper: { icon: "📝", label: "User Stories" },
  designSprint: { icon: "⚡", label: "Design Sprint" },
  prototypingStudio: { icon: "🎨", label: "Prototyping" },
  usabilityTest: { icon: "🔍", label: "Usability Test" },
  productMetrics: { icon: "📊", label: "Product Metrics" },
  competitiveProduct: { icon: "🏆", label: "Competitive" },
  launchPlanner: { icon: "🚀", label: "Launch Planner" },
  feedbackSystem: { icon: "💬", label: "Feedback System" },
  designSystemBuilder: { icon: "🎨", label: "Design System" },
  productCulture: { icon: "🌱", label: "Product Culture" },
  primaryResearch: { icon: "🔬", label: "Primary Research" },
  marketSurvey: { icon: "📊", label: "Market Survey" },
  ciFramework: { icon: "🏆", label: "CI Framework" },
  insightSynthesis: { icon: "💡", label: "Insight Synthesis" },
  researchReport: { icon: "📄", label: "Research Report" },
  dataCollection: { icon: "📥", label: "Data Collection" },
  hypothesisBuilder: { icon: "🔮", label: "Hypothesis" },
  experimentDesign: { icon: "🧪", label: "Experiment Design" },
  statAnalytics: { icon: "📊", label: "Stat Analytics" },
  ethnographicResearch: { icon: "👥", label: "Ethnographic" },
  researchMethod: { icon: "📐", label: "Research Method" },
  knowledgeBase: { icon: "🧠", label: "Knowledge Base" },
  trendsSentinel: { icon: "📡", label: "Trends Sentinel" },
  apiPlayground: { icon: "⚡", label: "API Playground" },
  databaseStudio: { icon: "🗄️", label: "DB Studio" },
  integrationBuilder: { icon: "🔌", label: "Integration Builder" },
  webhookManager: { icon: "🔗", label: "Webhooks" },
  dataPipeline: { icon: "🔄", label: "Data Pipeline" },
  eventStream: { icon: "📡", label: "Event Stream" },
  notificationBuilder: { icon: "🔔", label: "Notification Builder" },
  workspaceOS: { icon: "🖥️", label: "Workspace OS" },
  searchStudio: { icon: "🔍", label: "Search Studio" },
  aiAgentBuilder: { icon: "🤖", label: "AI Agent Builder" },
  pluginManager: { icon: "🔧", label: "Plugin Manager" },
  extensionStore: { icon: "🏪", label: "Extension Store" },
  widgetBuilder: { icon: "🧩", label: "Widget Builder" },
  dashboardBuilder: { icon: "📊", label: "Dashboard Builder" },
  reportingStudio: { icon: "📊", label: "Reporting Studio" },
  automationCenter: { icon: "🤖", label: "Automation Ctr" },
  workflowBuilder: { icon: "🔄", label: "Workflow Builder" },
  triggerManager: { icon: "⚡", label: "Trigger Mgr" },
  scheduler: { icon: "📅", label: "Scheduler" },
  jobManager: { icon: "💼", label: "Job Manager" },
  batchProcessor: { icon: "📦", label: "Batch Processor" },
  dataTransformer: { icon: "⚙️", label: "Data Transformer" },
  mappingStudio: { icon: "⚙️", label: "Mapping Studio" },
  schemaBuilder: { icon: "⚙️", label: "Schema Builder" },
  configManager: { icon: "⚙️", label: "Config Manager" },

};

// ─── OS Context value ───────────────────────────────────────────────────────
interface OSContextValue {
  activeApp: AppId | null;
  sidebarCollapsed: boolean;
  history: AppId[];
  appRegistry: AppDef[];
  preferences: PreferenceBrain;
  platformMode: PlatformMode;
  unreadCount: number;
  founderTierActive: boolean;
  openApp: (id: AppId) => void;
  closeApp: () => void;
  goBack: () => void;
  toggleSidebar: () => void;
  routeIntent: (intent: string) => AppId | null;
  updatePreferences: (patch: Partial<PreferenceBrain>) => void;
  registerApp: (app: AppDef) => void;
  setPlatformMode: (mode: PlatformMode) => void;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  activateFounderTier: () => void;
}

const OSContext = createContext<OSContextValue | null>(null);

export function OSProvider({ children }: { children: React.ReactNode }) {
  const [activeApp, setActiveApp]         = useState<AppId | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [history, setHistory]             = useState<AppId[]>([]);
  const [appRegistry, setAppRegistry]     = useState<AppDef[]>(DEFAULT_APPS);
  const [preferences, setPreferences]     = useState<PreferenceBrain>(() => loadPrefsFromLS());
  const [platformMode, setPlatformModeState] = useState<PlatformMode>(() => PlatformStore.getMode());
  const [unreadCount, setUnreadCount]     = useState(0);
  const [founderTierActive, setFounderTierActive] = useState<boolean>(() => loadFounderState().active);
  // Prevent server save from re-triggering on server-hydration
  const serverHydrated = useRef(false);

  // ── Sync mode from custom events ──
  useEffect(() => {
    const handler = (e: Event) => {
      setPlatformModeState((e as CustomEvent<PlatformMode>).detail);
    };
    window.addEventListener("cai:mode-change", handler);
    return () => window.removeEventListener("cai:mode-change", handler);
  }, []);

  // ── Poll notifications every 30 seconds ──
  useEffect(() => {
    const poll = () => {
      fetch("/api/notifications?limit=50", { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data?.notifications) return;
          const unread = (data.notifications as Array<{ read: boolean }>)
            .filter(n => !n.read).length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    };
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, []);

  // ── On mount: hydrate preferences from server (server wins over localStorage) ──
  useEffect(() => {
    fetch("/api/user/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.preferences && typeof data.preferences === "object") {
          const merged: PreferenceBrain = { ...DEFAULT_PREFERENCES, ...data.preferences };
          setPreferences(merged);
          savePrefsToLS(merged);
          // Seed shared intelligence layer with user preferences
          contextStore.setSessionContext({ tone: merged.tone });
        }
        // Load unread notification count
        return fetch("/api/notifications?limit=50", { credentials: "include" });
      })
      .then(r => r && r.ok ? r.json() : null)
      .then(data => {
        if (data?.notifications) {
          const unread = (data.notifications as Array<{ readAt: string | null }>)
            .filter(n => !n.readAt).length;
          setUnreadCount(unread);
        }
        serverHydrated.current = true;
      })
      .catch(() => { serverHydrated.current = true; });
  }, []);

  const openApp = useCallback((id: AppId) => {
    setHistory(prev => activeApp ? [...prev, activeApp] : prev);
    setActiveApp(id);
    const meta = APP_META[id];
    if (meta) PlatformStore.pushRecent({ appId: id, label: meta.label, icon: meta.icon });
    // Clear badge when notifications opens
    if (id === "notifications") {
      setUnreadCount(0);
      fetch("/api/notifications/read-all", { method: "PUT", credentials: "include" }).catch(() => {});
    }
  }, [activeApp]);

  const closeApp = useCallback(() => {
    setActiveApp(null);
    setHistory([]);
  }, []);

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setActiveApp(prev);
    } else {
      setActiveApp(null);
    }
  }, [history]);

  const toggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);

  const routeIntent = useCallback((intent: string): AppId | null => routeIntentFn(intent), []);

  const updatePreferences = useCallback((patch: Partial<PreferenceBrain>) => {
    setPreferences(prev => {
      const next = { ...prev, ...patch };
      // Persist to localStorage immediately
      savePrefsToLS(next);
      // Fire-and-forget to server (only after initial server hydration)
      if (serverHydrated.current) {
        fetch("/api/user/me", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: next }),
        }).catch(() => {});
      }
      // Mirror to local backend for session continuity across refreshes
      LocalSettingsService.setAll(next as Record<string, unknown>).catch(() => {});
      // Keep shared intelligence layer in sync with preference changes
      if (patch.tone) contextStore.setSessionContext({ tone: next.tone });
      return next;
    });
  }, []);

  const registerApp = useCallback((app: AppDef) => {
    setAppRegistry(prev => prev.find(a => a.id === app.id) ? prev : [...prev, app]);
  }, []);

  const setPlatformMode = useCallback((mode: PlatformMode) => {
    PlatformStore.setMode(mode);
    setPlatformModeState(mode);
  }, []);

  const activateFounderTier = useCallback(() => {
    const state = { active: true, activatedAt: new Date().toISOString(), founderName: "Sara Stadler", buildVersion: "Founder-1.0", executionMode: "full" as const };
    saveFounderState(state);
    setFounderTierActive(true);
  }, []);

  return (
    <OSContext.Provider value={{
      activeApp, sidebarCollapsed, history, appRegistry, preferences, platformMode,
      unreadCount, setUnreadCount, founderTierActive,
      openApp, closeApp, goBack, toggleSidebar, routeIntent,
      updatePreferences, registerApp, setPlatformMode, activateFounderTier,
    }}>
      {children}
    </OSContext.Provider>
  );
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error("useOS must be used within OSProvider");
  return ctx;
}
