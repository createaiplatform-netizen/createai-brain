import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { PlatformStore, PlatformMode } from "@/engine/PlatformStore";
import { loadFounderState, saveFounderState } from "@/engine/FounderTier";

// ─── App Registry ──────────────────────────────────────────────────────────
export type AppId =
  | "chat" | "projects" | "tools" | "creator" | "people"
  | "documents" | "marketing" | "admin" | "family"
  | "integration" | "monetization" | "universal" | "simulation"
  | "business" | "entity" | "bizcreator" | "bizdev" | "projbuilder" | "projos"
  | "notifications" | "brainhub" | "commandcenter"
  | "researchhub" | "learningcenter" | "personastudio" | "datastudio" | "pricingstudio"
  | "traction" | "opportunity" | "imaginationlab" | "loreforge"
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
  | "lessonplanner" | "curriculumdesigner";

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
  { keywords: ["business", "bizengine", "biz engine", "business plan", "business model", "startup", "venture", "monetization model", "operations design", "expansion", "opportunity"],  target: "business" },
  { keywords: ["entity", "entitygen", "entity engine", "brand", "branding", "positioning", "product idea", "platform idea", "business entity", "build entity", "brand strategy", "ecosystem", "compliance", "growth strategy"], target: "entity" },
  { keywords: ["universe", "bizcreator", "biz universe", "concept", "concept expansion", "idea", "visualize", "visualization", "digital twin", "vr", "ar", "knowledge context", "business system", "expand idea", "expand concept", "multi-layer"], target: "bizcreator" },
  { keywords: ["bizdev", "bizplanner", "biz planner", "biz dev", "business plan", "execution plan", "real world plan", "executable", "business development", "go to market", "gtm", "acquisition strategy", "legal risk", "tools systems", "target customers"], target: "bizdev" },
  { keywords: ["projbuilder", "project builder", "project file", "project plan", "healthcare platform", "construction project", "logistics hub", "sop", "standard operating procedure", "intake form", "phone script", "training outline", "launch plan", "30 days"], target: "projbuilder" },
  { keywords: ["projos", "project os", "universal platform", "project dashboard", "folder view", "sub app", "project manager", "project management", "demo mode", "test mode", "live mode", "all projects", "organize projects", "hunting", "farming", "project folder"], target: "projos" },
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

  // ── On mount: hydrate preferences from server (server wins over localStorage) ──
  useEffect(() => {
    fetch("/api/user/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.preferences && typeof data.preferences === "object") {
          const merged: PreferenceBrain = { ...DEFAULT_PREFERENCES, ...data.preferences };
          setPreferences(merged);
          savePrefsToLS(merged);
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
    const state = { active: true, activatedAt: new Date().toISOString(), founderName: "Sara Stadler", buildVersion: "Founder-1.0" };
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
