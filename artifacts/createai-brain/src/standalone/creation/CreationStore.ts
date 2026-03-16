// ─── Creation Store — Everything Engine (Omega) ──────────────────────────────

export type CreationType =
  | "movie"
  | "comic"
  | "software"   // SaaS, platforms, engines, modules
  | "document"
  | "marketing"
  | "game"
  | "community"
  | "custom";

export interface CreationSection {
  title: string;
  content: string;
}

export interface Creation {
  id: string;
  type: CreationType;
  name: string;
  description: string;
  genre: string;
  style: string;
  tone: string;
  domain: string;        // Auto-detected domain (Healthcare, Finance, etc.)
  modules: string[];     // Auto-detected modules
  patterns: string[];    // SaaS/engine patterns
  createdAt: string;
  rawContent: string;
  sections: CreationSection[];
}

// ─── localStorage ─────────────────────────────────────────────────────────────
const STORE_KEY = "createai_creations_v1";

function loadAll(): Creation[] {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]"); } catch { return []; }
}

function saveAll(list: Creation[]) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch {}
}

export const CreationStore = {
  getAll: () => loadAll(),
  get: (id: string) => loadAll().find(c => c.id === id),
  save(c: Creation) { const l = loadAll().filter(x => x.id !== c.id); l.unshift(c); saveAll(l.slice(0, 50)); },
  delete: (id: string) => saveAll(loadAll().filter(c => c.id !== id)),
};

// ─── Section Parser ───────────────────────────────────────────────────────────
export function parseSections(raw: string): CreationSection[] {
  const secs: CreationSection[] = [];
  let cur: CreationSection | null = null;
  for (const line of raw.split("\n")) {
    const m = line.match(/^==\s*(.+?)\s*==\s*$/);
    if (m) { if (cur) secs.push(cur); cur = { title: m[1], content: "" }; }
    else if (cur) cur.content += (cur.content ? "\n" : "") + line;
    else if (line.trim()) cur = { title: "Overview", content: line };
  }
  if (cur?.content.trim()) secs.push(cur);
  return secs.map(s => ({ ...s, content: s.content.trim() })).filter(s => s.content);
}

// ─── Pattern Library ──────────────────────────────────────────────────────────
export const PATTERN_LIBRARY = {
  saasPatterns: ["CRM","EMR/EHR","LMS","Project Management","Ticketing","Scheduling","Billing","Analytics","Content Studio","Community","Marketplace","Inventory","HR Platform","Supply Chain","Legal Practice","Real Estate","Restaurant","Fitness","Veterinary","Home Services"],
  engines:      ["Creation Engine","Monetization Engine","Analytics Engine","Notification Engine","Search Engine","Recommendation Engine","Learning Engine","Simulation Engine","Game Engine","Compliance Engine","Workflow Engine","Scheduling Engine","Billing Engine","Messaging Engine"],
  modules:      ["Authentication","User Roles","Organizations","Teams","Billing","Invoices","Subscriptions","Dashboard","Charts/Analytics","Forms","Workflows","Approvals","Messaging/Chat","Notifications","File Storage","Media Viewer","AI Assistant","Onboarding","Settings","Reports","Calendar","Payments","API Keys","Activity Log","Search"],
  domains: {
    healthcare:  ["Healthcare","Medical","Clinical","Patient","EMR","EHR","Health","Pharmacy","Therapy","Nurse","Doctor","Hospital","Clinic","Telehealth","Mental Health","Dental","Vision","Home Health"],
    finance:     ["Finance","Financial","Fintech","Banking","Investment","Trading","Accounting","Payroll","Insurance","Lending","Credit","Mortgage","Crypto","Wealth","Budget","Tax"],
    education:   ["Education","Learning","School","Course","Curriculum","Student","Teacher","Training","LMS","eLearning","Academy","University","Tutoring","Exam","Quiz","Lesson"],
    marketing:   ["Marketing","CRM","Sales","Funnel","Campaign","Email","Lead","Pipeline","Prospecting","Advertising","Social","Content","SEO","Brand","Agency","PR"],
    operations:  ["Operations","Project","Task","Workflow","Process","Approval","Scheduling","Resource","Inventory","Supply Chain","Logistics","Fleet","Field Service","Dispatch"],
    retail:      ["Retail","Commerce","Store","Shop","Product","Inventory","Order","Shipping","POS","Subscription Box","Marketplace","Vendor","Buyer","Seller"],
    creative:    ["Creative","Studio","Media","Content","Video","Music","Podcast","Art","Design","Writing","Publishing","Photography","Animation","Film","TV"],
    community:   ["Community","Social","Forum","Network","Members","Events","Posts","Discussions","Groups","Clubs","Meetups","Online Community"],
    game:        ["Game","Gaming","Play","Player","Level","Quest","Achievement","Leaderboard","Score","Character","RPG","Puzzle","Strategy","Simulation"],
  },
};

// ─── Intent Classifier ────────────────────────────────────────────────────────
export interface IntentResult {
  type: CreationType;
  domain: string;
  modules: string[];
  patterns: string[];
  genre: string;
  style: string;
  tone: string;
  label: string;
  confidence: "high" | "medium" | "low";
}

function contains(text: string, keywords: string[]): boolean {
  return keywords.some(k => text.includes(k.toLowerCase()));
}

export function classifyIntent(rawDesc: string): IntentResult {
  const d = rawDesc.toLowerCase();

  // ── Primary type detection ──
  let type: CreationType = "custom";
  let confidence: "high" | "medium" | "low" = "medium";

  const movieKw  = ["movie","film","cinematic","animation","cartoon","live action","animated series","show","tv show","episode","screenplay","script","scene","actor","director","plot"];
  const comicKw  = ["comic","manga","graphic novel","panel","superhero","graphic","illustration","webcomic","sequential art","issue","series","character arc"];
  const gameKw   = ["game","gaming","rpg","puzzle","strategy","simulation game","player","level","quest","achievement","leaderboard","playthrough","gameplay","play","gamer","indie game"];
  const commKw   = ["community","forum","social network","online community","members","discussion board","groups","meetups","club"];
  const mktgKw   = ["marketing system","funnel","landing page","email sequence","ad copy","social media content","campaign","lead generation","conversion","advertising"];
  const docKw    = ["document","report","policy","sop","guide","manual","handbook","whitepaper","specification","curriculum","proposal","contract","pitch deck","pdf"];
  const saasKw   = ["saas","platform","software","app","application","dashboard","crm","erp","lms","ehr","emr","system","tool","suite","engine","module","feature set","product","service","subscription","api","portal","hub","workspace","automation"];

  if      (contains(d, movieKw))  { type = "movie";     confidence = "high"; }
  else if (contains(d, comicKw))  { type = "comic";     confidence = "high"; }
  else if (contains(d, gameKw))   { type = "game";      confidence = "high"; }
  else if (contains(d, commKw))   { type = "community"; confidence = "high"; }
  else if (contains(d, mktgKw))   { type = "marketing"; confidence = "high"; }
  else if (contains(d, docKw))    { type = "document";  confidence = "high"; }
  else if (contains(d, saasKw))   { type = "software";  confidence = "high"; }
  else                             { type = "custom";    confidence = "low";  }

  // ── Domain detection (for software/custom) ──
  const domLib = PATTERN_LIBRARY.domains;
  let domain = "General";
  if      (contains(d, domLib.healthcare.map(x => x.toLowerCase())))  domain = "Healthcare";
  else if (contains(d, domLib.finance.map(x => x.toLowerCase())))     domain = "Finance";
  else if (contains(d, domLib.education.map(x => x.toLowerCase())))   domain = "Education";
  else if (contains(d, domLib.marketing.map(x => x.toLowerCase())))   domain = "Marketing & Sales";
  else if (contains(d, domLib.operations.map(x => x.toLowerCase())))  domain = "Operations";
  else if (contains(d, domLib.retail.map(x => x.toLowerCase())))      domain = "Retail & Commerce";
  else if (contains(d, domLib.creative.map(x => x.toLowerCase())))    domain = "Creative & Media";
  else if (contains(d, domLib.community.map(x => x.toLowerCase())))   domain = "Community & Social";
  else if (contains(d, domLib.game.map(x => x.toLowerCase())))        domain = "Gaming";

  // ── Module detection ──
  const moduleMap: Record<string, string[]> = {
    "AI Assistant":     ["ai","assistant","chatbot","gpt","llm","intelligence","suggest","recommend","smart"],
    "Billing":          ["billing","invoice","payment","stripe","subscription","pricing","charge","pay"],
    "Scheduling":       ["schedule","appointment","calendar","booking","availability","slot","reminder"],
    "Dashboard":        ["dashboard","metrics","kpi","analytics","chart","graph","report","overview"],
    "Authentication":   ["auth","login","signin","signup","sso","oauth","password","account","user account"],
    "Messaging/Chat":   ["message","chat","inbox","conversation","communicate","notify","alert"],
    "Workflows":        ["workflow","approval","process","automation","trigger","pipeline","stage"],
    "File Storage":     ["file","document upload","attachment","storage","media","image","video upload"],
    "Teams/Roles":      ["team","role","permission","org","organization","member","admin","staff"],
    "Notifications":    ["notification","alert","email","push","sms","remind","nudge"],
    "Search":           ["search","filter","find","query","lookup","browse"],
    "Forms":            ["form","input","survey","questionnaire","collect","submit"],
    "Reports":          ["report","export","pdf","download","summary","insight"],
    "Onboarding":       ["onboard","setup","wizard","walkthrough","tutorial","getting started"],
    "Inventory":        ["inventory","stock","product catalog","sku","warehouse","items"],
    "Payments":         ["payment","checkout","cart","transaction","refund","revenue"],
  };

  const detectedModules: string[] = [];
  for (const [mod, keywords] of Object.entries(moduleMap)) {
    if (keywords.some(kw => d.includes(kw))) detectedModules.push(mod);
  }
  // Always include basics
  if (!detectedModules.includes("Dashboard")) detectedModules.unshift("Dashboard");
  if (!detectedModules.includes("AI Assistant")) detectedModules.push("AI Assistant");
  const modules = detectedModules.slice(0, 8);

  // ── Pattern selection ──
  const patterns: string[] = [];
  if (type === "software" || type === "custom") {
    for (const p of PATTERN_LIBRARY.saasPatterns) {
      if (d.includes(p.toLowerCase())) patterns.push(p);
    }
    if (patterns.length === 0) patterns.push(domain !== "General" ? `${domain} Platform` : "SaaS Platform");
    for (const e of PATTERN_LIBRARY.engines) {
      const ek = e.replace(" Engine", "").toLowerCase();
      if (d.includes(ek)) patterns.push(e);
    }
  }

  // ── Style / genre / tone ──
  const styleMap: Record<CreationType, { genre: string; style: string; tone: string }> = {
    movie:     { genre: "Drama", style: "Cinematic", tone: "Dramatic" },
    comic:     { genre: "Action", style: "Western Comics", tone: "Energetic" },
    software:  { genre: domain !== "General" ? domain : "SaaS", style: "Modern SaaS", tone: "Professional" },
    document:  { genre: "Business", style: "Executive", tone: "Professional" },
    marketing: { genre: "Digital", style: "Conversion-Focused", tone: "Persuasive" },
    game:      { genre: "Adventure", style: "Indie", tone: "Engaging" },
    community: { genre: "Social", style: "Community-Driven", tone: "Warm" },
    custom:    { genre: domain, style: "Creative", tone: "Professional" },
  };
  const defaults = styleMap[type];

  // ── Labels ──
  const labelMap: Record<CreationType, string> = {
    movie:     "Film Production",
    comic:     "Comic Universe",
    software:  domain !== "General" ? `${domain} Platform` : "Software Product",
    document:  "Document Suite",
    marketing: "Marketing System",
    game:      "Game Production",
    community: "Community Platform",
    custom:    "Custom Creation",
  };

  return {
    type, domain, modules, patterns,
    genre: defaults.genre, style: defaults.style, tone: defaults.tone,
    label: labelMap[type], confidence,
  };
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────
export function buildPrompt(
  type: CreationType, name: string, description: string,
  genre: string, style: string, tone: string,
  domain = "General", modules: string[] = [], patterns: string[] = [],
): string {
  const DISCLAIMER = "All content is mock/simulated. Generated by the Everything Engine (CreateAI Brain). Not for real production use without expert review.";
  const shared = `Title: "${name}"\nDescription: "${description}"\nDomain: ${domain}\nGenre: ${genre} | Style: ${style} | Tone: ${tone}\n\n${DISCLAIMER}\n\n`;
  const S = (t: string) => `== ${t} ==`;

  if (type === "movie") return `${shared}Generate a complete ${genre} film treatment. Use == SECTION NAME == markers.\n\n${S("Synopsis")}\nVivid 2-3 paragraph synopsis. Include genre, tone, theme.\n\n${S("Scene 1 — Opening")}\nFull scene: setting, atmosphere, action, dialogue.\n\n${S("Scene 2 — Inciting Incident")}\nCharacter action, dialogue, visual cues.\n\n${S("Scene 3 — Rising Action")}\nEscalating tension, dialogue, visual beats.\n\n${S("Scene 4 — Midpoint")}\nMajor turning point. Character interaction, dialogue.\n\n${S("Scene 5 — Climax")}\nFull climactic scene. Drama, spectacle, peak dialogue.\n\n${S("Scene 6 — Resolution")}\nEmotional closing. Arcs resolved. Visual tone.\n\n${S("Character: Protagonist")}\nName, role, backstory, personality, key traits, visual.\n\n${S("Character: Antagonist")}\nName, role, backstory, motivation, visual.\n\n${S("Character: Supporting")}\nName, role, function, key scene.\n\n${S("Full Script Excerpt")}\nFormatted screenplay from most dramatic scene. Scene headings, action, dialogue.\n\n${S("Director's Vision")}\nVisual style, color palette, cinematography, tone.\n\n${S("Marketing — Tagline")}\nThree taglines + one-sentence pitch.\n\n${S("Marketing — Trailer Script")}\n90-second trailer with beats, music cues, VO.\n\n${S("Marketing — Social Copy")}\nInstagram, Twitter/X, TikTok posts with hashtags.`;

  if (type === "comic") return `${shared}Generate a complete ${genre} comic/graphic novel. Use == SECTION NAME == markers.\n\n${S("Story Overview")}\nIssue summary, arc setup, tone, visual style.\n\n${S("Panel 1")}\nVisual — [what we see]. Caption: [narration]. Dialogue: [character]: "[text]". Composition notes.\n\n${S("Panel 2")}\nVisual, caption, dialogue, composition.\n\n${S("Panel 3")}\nVisual, caption, dialogue.\n\n${S("Panel 4")}\nAction panel — dynamic visual, sound effects, minimal dialogue.\n\n${S("Panel 5")}\nEmotional beat — close-up or reaction. Dialogue and caption.\n\n${S("Panel 6")}\nPlot twist. Strong visual, impactful dialogue.\n\n${S("Panel 7")}\nRising tension. Multi-character panel. Dialogue exchange.\n\n${S("Panel 8 — Cliffhanger")}\nFinal panel. Cliffhanger image. Final caption or dialogue.\n\n${S("Character: Hero")}\nName, appearance, powers/skills, backstory, personality, signature look.\n\n${S("Character: Villain")}\nName, appearance, powers, motivation, visual design.\n\n${S("Character: Ally")}\nName, role, relationship to hero, visual notes.\n\n${S("Full Issue Script")}\nComplete issue script: panel breakdowns, captions, dialogue.\n\n${S("Art Direction")}\nColor palette, panel layout, lettering style, visual mood.\n\n${S("Marketing — Solicitation Copy")}\nPublisher-style solicitation text and cover description.\n\n${S("Marketing — Social Copy")}\nLaunch announcement for social media.`;

  if (type === "game") return `${shared}Generate a complete ${genre} game concept and design document. Use == SECTION NAME == markers.\n\n${S("Game Overview")}\nOne-paragraph pitch, genre, platform, target audience, core loop, USP.\n\n${S("Core Gameplay Mechanics")}\nDetail the core mechanics. How does the player interact? What are the primary loops? What makes it fun?\n\n${S("Story & Setting")}\nWorld background, narrative premise, tone. Player's motivation and the central conflict.\n\n${S("Level 1 — Tutorial")}\nDetailed description of the first level/area. What does the player learn? Key design goals.\n\n${S("Level 2 — Rising Challenge")}\nSecond level. New mechanics introduced. Escalating difficulty.\n\n${S("Level 3 — Midgame Boss/Challenge")}\nA significant challenge or boss encounter. Design notes, player strategy options.\n\n${S("Character: Protagonist")}\nName, backstory, abilities, appearance, character arc.\n\n${S("Character: Antagonist / Boss")}\nName, motivation, abilities, design philosophy.\n\n${S("Game Economy")}\nResources, currency, progression systems, unlocks, rewards.\n\n${S("World Building")}\nThe world's lore, geography, factions, history. Key locations.\n\n${S("AI & NPC Behavior")}\nHow NPCs and enemies behave. Difficulty scaling. AI assistant in-game role.\n\n${S("Technical Overview")}\nPlatforms, engine (conceptual), key technical features, multiplayer notes.\n\n${S("Art Direction")}\nVisual style, color palette, UI design philosophy, character design language.\n\n${S("Marketing — Tagline")}\nThree taglines + elevator pitch.\n\n${S("Marketing — Steam/App Store Copy")}\nFull store description with features list.\n\n${S("Documentation — Player Guide")}\nQuick start guide for new players (7 steps).`;

  if (type === "community") return `${shared}Generate a complete ${genre} community platform design. Use == SECTION NAME == markers.\n\n${S("Platform Overview")}\nMission, target community, value proposition, what makes it unique.\n\n${S("Core Features")}\nTop 6 features that define the platform experience.\n\n${S("Member Experience")}\nOnboarding flow, profile setup, discovery, engagement loop.\n\n${S("Content & Posts")}\nContent types, posting mechanics, format options, moderation.\n\n${S("Events & Gatherings")}\nEvent types, creation flow, RSVP, virtual vs in-person.\n\n${S("Groups & Channels")}\nGroup structure, creation, management, private vs public.\n\n${S("Gamification")}\nReputation system, badges, levels, leaderboards, rewards.\n\n${S("Monetization")}\nRevenue model (subscription, freemium, marketplace, etc.), pricing tiers.\n\n${S("Moderation & Safety")}\nCommunity guidelines, moderation tools, trust & safety systems.\n\n${S("Marketing — Positioning")}\nBrand positioning, target audience, tagline, differentiators.\n\n${S("Marketing — Launch Plan")}\nPre-launch strategy, beta approach, launch day plan, growth tactics.\n\n${S("Documentation — Community Guidelines")}\nFull community guidelines document.\n\n${S("Documentation — Getting Started")}\nNew member onboarding guide.`;

  if (type === "document") return `${shared}Generate a complete professional document. Use == SECTION NAME == markers. Structural/mock only.\n\n${S("Executive Summary")}\n2-3 paragraph executive summary covering purpose, key findings, recommendations.\n\n${S("Introduction")}\nBackground, context, scope, purpose. 2-3 paragraphs.\n\n${S("Section 1 — Background & Context")}\nDetailed background. Current state, why this document matters.\n\n${S("Section 2 — Key Findings")}\n4-5 key findings, each with explanation.\n\n${S("Section 3 — Analysis")}\nDetailed analysis with structured insights.\n\n${S("Section 4 — Recommendations")}\n5-7 specific, actionable recommendations with rationale.\n\n${S("Section 5 — Implementation Plan")}\nPhased plan with timeline, responsibilities (mock), success metrics.\n\n${S("Section 6 — Risk Assessment")}\n4-5 key risks with likelihood, impact, mitigation.\n\n${S("Conclusion")}\nClosing summary and call to action.\n\n${S("Appendix A — References")}\nMock reference list.\n\n${S("Appendix B — Glossary")}\nKey terms and definitions.`;

  if (type === "marketing") return `${shared}Generate a complete marketing system. Use == SECTION NAME == markers.\n\n${S("Brand Positioning")}\nBrand statement, target audience, UVP, competitive differentiator.\n\n${S("Landing Page — Hero Section")}\nHero headline, subheadline, CTA text, trust indicators.\n\n${S("Landing Page — Features")}\n6 feature blocks (icon described, title, 2-sentence description).\n\n${S("Landing Page — Social Proof")}\n3 mock testimonials (name, company, role, quote).\n\n${S("Landing Page — CTA Section")}\nBottom CTA headline, offer description, button copy.\n\n${S("Funnel Stage 1 — Awareness")}\nTop-of-funnel: content types, messaging, channels, goals.\n\n${S("Funnel Stage 2 — Interest")}\nLead magnet idea, opt-in copy, nurture strategy.\n\n${S("Funnel Stage 3 — Decision")}\nOffer presentation, objection handling, social proof.\n\n${S("Funnel Stage 4 — Action")}\nConversion: CTA copy, checkout notes, urgency (mock).\n\n${S("Email 1 — Welcome")}\nFull email: subject, preheader, body, CTA.\n\n${S("Email 2 — Value Delivery")}\nValue email: subject, body, CTA.\n\n${S("Email 3 — Offer")}\nSales email: subject, body, offer, CTA, P.S.\n\n${S("Ad Copy — Social")}\n2 Facebook/Instagram ad variants.\n\n${S("Ad Copy — Search")}\n2 Google Search ad variants.\n\n${S("Content Calendar — Week 1")}\n7-day social calendar: post type, topic, caption, hashtags.`;

  if (type === "software") {
    // Build module-specific sections
    const modulePrompts = modules.slice(0, 6).map(m => `${S(`Module: ${m}`)}\nDetailed description of the ${m} module. Features, user flows, key screens, data handled, integrations (conceptual).`).join("\n\n");
    const patternList = patterns.length > 0 ? patterns.join(", ") : "SaaS Platform";
    return `${shared}Generate a complete ${domain} SaaS product. Patterns: ${patternList}. Modules: ${modules.join(", ")}. Use == SECTION NAME == markers.\n\n${S("Product Overview")}\nWhat the software does, who it's for, key value proposition, problem solved. Include domain-specific context for ${domain}.\n\n${S("Feature 1 — Core Feature")}\nPrimary feature name, description, user benefit, workflow, UI notes.\n\n${S("Feature 2 — AI Engine")}\nAI capabilities built in, what it automates, sample interaction, model behavior.\n\n${S("Feature 3 — Dashboard")}\nDashboard layout, key metrics, widgets, mock data, personalization.\n\n${S("Feature 4 — Workflow Engine")}\nStep-by-step workflows the software enables. Primary workflow with all steps.\n\n${S("Feature 5 — Document Suite")}\nDocuments, exports, reports the software generates.\n\n${S("Feature 6 — Integrations (Future)")}\nThird-party integrations for ${domain} this software would connect to.\n\n${modulePrompts}\n\n${S("Dashboard KPIs")}\n6-8 key performance indicators the dashboard tracks. Mock values with trend direction.\n\n${S("Primary Workflow")}\nStep-by-step primary user workflow (8-10 steps) with action descriptions.\n\n${S("Secondary Workflow")}\nSecond key workflow (5-6 steps).\n\n${S("Data Model")}\n5-7 core entities/records the system manages. Fields, relationships, notes.\n\n${S("API Overview")}\n5-6 key API endpoints (conceptual/mock). Method, path, description, parameters.\n\n${S("Marketing — Hero Copy")}\nLanding page hero headline, subheadline, 3 bullet benefits.\n\n${S("Marketing — Features Page")}\nFeature grid copy (6 features with icons described).\n\n${S("Marketing — Pricing")}\n3 pricing tiers with feature lists (all mock).\n\n${S("Documentation — Getting Started")}\nQuick start guide for new users (5-7 steps).\n\n${S("Documentation — User Guide")}\nCore user guide covering the main workflows and features.`;
  }

  // custom
  return `${shared}Generate a complete, rich ${domain} creation/product based on this description. Use == SECTION NAME == markers. Be creative, thorough, and domain-specific.\n\n${S("Overview")}\nFull description: what this is, purpose, audience, key elements.\n\n${S("Core Content — Part 1")}\nThe main content. Rich, detailed, fully developed.\n\n${S("Core Content — Part 2")}\nSecond major section with additional depth.\n\n${S("Core Content — Part 3")}\nThird section continuing development.\n\n${S("Architecture & Structure")}\nHow this is structured: key components, flows, relationships.\n\n${S("Interactive Features")}\nKey interactive elements, user actions, engagement points.\n\n${S("AI Capabilities")}\nHow AI is integrated or enhances this creation.\n\n${S("Marketing Copy")}\nTagline, description, key selling points.\n\n${S("Documentation")}\nUser guide or spec for this creation.\n\n${S("Next Steps")}\nHow to expand, iterate, or build on this creation.`;
}
