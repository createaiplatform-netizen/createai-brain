// scripts/generate_apps.ts — generates all 81 new app wrapper files
// Run: npx tsx scripts/generate_apps.ts

import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPS_DIR = path.resolve(__dirname, "../artifacts/createai-brain/src/Apps");

interface EngDef { id: string; name: string; icon: string; tagline: string; desc: string; ph: string; ex: string; color: string; }
interface AppSpec {
  id: string; title: string; icon: string; color: string; desc: string;
  engines: EngDef[];
  series?: { id: string; name: string; icon: string; desc: string; engines: string[] }[];
}

const APPS: AppSpec[] = [

  // ── Creative Writing Suite ────────────────────────────────────────────────
  {
    id: "scriptwriter", title: "Scriptwriter", icon: "🎬", color: "#e11d48",
    desc: "Professional screenplay and script writing studio — scenes, dialogue, structure, and pitch.",
    engines: [
      { id: "ScreenplayStructureEngine", name: "Screenplay Structure", icon: "📐", tagline: "Three-act architect", desc: "Designs complete screenplay structure with act breaks, midpoint, and beat sheet.", ph: "What story do you want to structure?", ex: "e.g. A detective who discovers the crime was committed by their future self", color: "#e11d48" },
      { id: "ScreenplayDialogueEngine", name: "Script Dialogue", icon: "💬", tagline: "Dialogue craftsman", desc: "Writes character dialogue with subtext, rhythm, and voice distinction.", ph: "Describe the conversation scene", ex: "e.g. Two spies who love each other meeting for the last time before one defects", color: "#be123c" },
      { id: "SceneHeaderEngine", name: "Scene Designer", icon: "🎥", tagline: "Scene architect", desc: "Designs fully realized scenes with location, action, lighting, and emotional register.", ph: "What scene should I design?", ex: "e.g. The moment a corrupt CEO realizes his own board has turned against him", color: "#9f1239" },
      { id: "PitchEngine", name: "Pitch Writer", icon: "📋", tagline: "Pitch craftsman", desc: "Writes loglines, synopses, and treatment documents for pitching to producers.", ph: "What screenplay are you pitching?", ex: "e.g. A sci-fi thriller about consciousness uploading that turns into a murder mystery", color: "#e11d48" },
      { id: "CharacterVoiceEngine", name: "Character Voice", icon: "🎭", tagline: "Voice differentiator", desc: "Develops distinct character voices — speech patterns, vocabulary, cadence, and verbal tics.", ph: "Who is the character and what's their background?", ex: "e.g. An aging jazz musician who raised her daughter alone and now meets her for the first time in 20 years", color: "#be123c" },
      { id: "ScriptNotesEngine", name: "Script Notes", icon: "📝", tagline: "Development analyst", desc: "Provides professional script coverage and development notes: strengths, weaknesses, fixes.", ph: "Paste or describe your script for coverage", ex: "e.g. My Act 2 feels flat — the protagonist doesn't change and the villain disappears for 30 pages", color: "#9f1239" },
    ],
  },
  {
    id: "comicscript", title: "ComicScript Studio", icon: "💥", color: "#7c3aed",
    desc: "Comic book and graphic novel script writing — panel descriptions, caption boxes, and visual storytelling.",
    engines: [
      { id: "PanelDescriptionEngine", name: "Panel Describer", icon: "🖼️", tagline: "Visual page architect", desc: "Writes detailed panel descriptions with camera angle, action, emotion, and staging.", ph: "Describe the page or scene", ex: "e.g. Page 1 of a noir comic where a detective finds a body that looks exactly like herself", color: "#7c3aed" },
      { id: "CaptionBoxEngine", name: "Caption Writer", icon: "📦", tagline: "Narration craftsman", desc: "Writes caption boxes — inner monologue, omniscient narration, or time stamps.", ph: "What moment needs captioning?", ex: "e.g. A superhero watching a city burn that she couldn't save, in retrospect narration", color: "#6d28d9" },
      { id: "ComicDialogueEngine", name: "Balloon Dialogue", icon: "💬", tagline: "Speech bubble writer", desc: "Writes comic dialogue optimized for speech bubbles — punchy, visual, character-distinct.", ph: "What scene needs dialogue?", ex: "e.g. A villain and hero who are secretly friends having a fight in public they both hate", color: "#5b21b6" },
      { id: "ArcSummaryEngine", name: "Story Arc Designer", icon: "🌀", tagline: "Arc planner", desc: "Designs multi-issue story arcs with cliffhangers, reveals, and thematic escalation.", ph: "What is your comic series concept?", ex: "e.g. A team of antiheroes who each secretly believe the others are the villain", color: "#7c3aed" },
      { id: "ComicCharacterDesignEngine", name: "Character Design Brief", icon: "🦸", tagline: "Visual character brief", desc: "Writes design briefs for comic characters — silhouette, costume symbolism, color psychology.", ph: "Who is the character and what do they represent?", ex: "e.g. A villain who was the original hero before the system broke them", color: "#6d28d9" },
    ],
  },
  {
    id: "poemforge", title: "PoemForge", icon: "🌸", color: "#be185d",
    desc: "Poetry creation and form exploration — sonnets to free verse, haiku to epic odes.",
    engines: [
      { id: "SonnetEngine", name: "Sonnet Forge", icon: "🌹", tagline: "Shakespearean craftsman", desc: "Writes formal sonnets (Shakespearean and Petrarchan) with proper meter and volta.", ph: "What emotion or situation should the sonnet explore?", ex: "e.g. The longing for someone you met once and never saw again but think about constantly", color: "#be185d" },
      { id: "FreeVerseEngine", name: "Free Verse Forge", icon: "🍃", tagline: "Open form poet", desc: "Writes free verse poetry with rhythm, imagery, line breaks, and emotional architecture.", ph: "What should the poem be about?", ex: "e.g. The feeling of watching your childhood home be demolished", color: "#9d174d" },
      { id: "HaikuEngine", name: "Haiku Master", icon: "🌊", tagline: "Minimalist poet", desc: "Crafts haiku and tanka with proper syllabic structure and seasonal/natural imagery.", ph: "What moment, feeling, or image should the haiku capture?", ex: "e.g. The silence after an argument where both people were right", color: "#be185d" },
      { id: "EpicPoetryEngine", name: "Epic Verse", icon: "⚡", tagline: "Epic tradition architect", desc: "Writes epic and heroic poetry in the tradition of Homer, Milton, or Dante.", ph: "What heroic event or character should the epic poem chronicle?", ex: "e.g. A leader who sacrificed their legacy to save a generation that never knew their name", color: "#9d174d" },
      { id: "LyricPoetryEngine", name: "Lyric Poet", icon: "🎵", tagline: "Emotional lyricist", desc: "Writes lyric poetry — intimate, musical, first-person emotional expression.", ph: "What feeling or experience is the poem exploring?", ex: "e.g. Grief that comes in waves years after the loss", color: "#be185d" },
      { id: "ConcretePoetryEngine", name: "Concrete Poet", icon: "🔷", tagline: "Visual form creator", desc: "Designs concrete and shape poetry where the visual form mirrors the content.", ph: "What concept should shape this poem?", ex: "e.g. A poem about erosion written in the shape of a crumbling cliff face", color: "#9d174d" },
    ],
  },
  {
    id: "essaywriter", title: "Essay Writer", icon: "📝", color: "#0369a1",
    desc: "Academic, persuasive, and analytical essay writing — from thesis to conclusion.",
    engines: [
      { id: "ThesisBuilderEngine", name: "Thesis Builder", icon: "🎯", tagline: "Argument architect", desc: "Constructs clear, defensible, specific thesis statements and argument maps.", ph: "What essay topic or question do you need to argue?", ex: "e.g. Whether universal basic income would increase or decrease economic innovation", color: "#0369a1" },
      { id: "ArgumentStructureEngine", name: "Argument Structure", icon: "📐", tagline: "Logic architect", desc: "Designs the logical structure of an essay — claim, evidence, reasoning, counterargument.", ph: "What is your main argument and who are you arguing against?", ex: "e.g. Arguing that social media improves political participation despite increasing polarization", color: "#0284c7" },
      { id: "IntroductionEngine", name: "Essay Introduction", icon: "🚪", tagline: "Entry architect", desc: "Writes essay introductions with hook, context, and thesis that demand to be read.", ph: "What is the essay's topic and thesis?", ex: "e.g. An essay arguing that the industrial revolution caused more psychological damage than historians credit", color: "#0369a1" },
      { id: "EvidenceWeaveEngine", name: "Evidence Weaver", icon: "🔗", tagline: "Source integrator", desc: "Integrates evidence, quotations, and citations smoothly into analytical prose.", ph: "What point are you making and what evidence supports it?", ex: "e.g. Using Foucault's surveillance theory to analyze social media's self-censorship effect", color: "#0284c7" },
      { id: "CounterargumentEngine", name: "Counterargument Handler", icon: "⚖️", tagline: "Devil's advocate", desc: "Generates strong counterarguments and models how to address and refute them.", ph: "What is your thesis and what might opponents say?", ex: "e.g. My thesis argues for nuclear power expansion — what are the strongest objections?", color: "#0369a1" },
      { id: "ConclusionEngine", name: "Essay Conclusion", icon: "🏁", tagline: "Landing craftsman", desc: "Writes conclusions that synthesize the argument, elevate the stakes, and leave an impression.", ph: "Summarize your essay's argument for me to conclude it", ex: "e.g. An essay arguing that privacy is now a luxury good only wealthy people can afford", color: "#0284c7" },
    ],
  },
  {
    id: "blogwriter", title: "Blog Writer", icon: "✍️", color: "#16a34a",
    desc: "Blog posts, content strategy, SEO writing, and audience-focused content creation.",
    engines: [
      { id: "BlogPostEngine", name: "Blog Post Writer", icon: "📄", tagline: "Content craftsman", desc: "Writes complete, structured blog posts with headers, examples, and clear takeaways.", ph: "What is the blog post topic and who is the target reader?", ex: "e.g. A post for small business owners about using AI to write better customer emails", color: "#16a34a" },
      { id: "HeadlineEngine", name: "Headline Generator", icon: "🎯", tagline: "Attention architect", desc: "Generates 10 irresistible headlines for any blog post topic using proven formulas.", ph: "What is the topic and main value of your blog post?", ex: "e.g. A post about why most productivity advice fails for people with ADHD", color: "#15803d" },
      { id: "SEOStructureEngine", name: "SEO Structurer", icon: "🔍", tagline: "Search architect", desc: "Designs SEO-optimized post structure with keyword placement, meta descriptions, and headers.", ph: "What keyword or topic are you targeting?", ex: "e.g. Targeting 'how to start a podcast with no audience' for beginner creators", color: "#16a34a" },
      { id: "IntroHookEngine", name: "Intro Hook Writer", icon: "🎣", tagline: "Hook architect", desc: "Writes blog introductions that immediately address reader pain and promise a solution.", ph: "What pain point does your blog post solve?", ex: "e.g. Readers who start creative projects and abandon them before finishing", color: "#15803d" },
      { id: "ContentStrategyEngine", name: "Content Strategy", icon: "📅", tagline: "Strategy planner", desc: "Designs 12-week content calendars aligned with audience, goals, and platform.", ph: "What is your brand, audience, and content goal?", ex: "e.g. A B2B SaaS company targeting HR directors who struggle with employee retention", color: "#16a34a" },
    ],
  },
  {
    id: "copywriter", title: "Copywriter", icon: "💡", color: "#d97706",
    desc: "Sales copy, headlines, CTAs, landing pages, ads, and conversion-focused writing.",
    engines: [
      { id: "SalesCopyEngine", name: "Sales Copy Engine", icon: "💰", tagline: "Conversion architect", desc: "Writes persuasive sales copy using AIDA, PAS, and other proven frameworks.", ph: "What are you selling and who is your customer?", ex: "e.g. An online course teaching corporate professionals to negotiate their salary", color: "#d97706" },
      { id: "LandingPageEngine", name: "Landing Page Writer", icon: "🎯", tagline: "Page architect", desc: "Writes complete landing pages: hero section, benefits, social proof, CTA, and FAQ.", ph: "What is the offer and who is the target customer?", ex: "e.g. A landing page for a meal planning service targeting new parents with no time", color: "#b45309" },
      { id: "AdCopyEngine", name: "Ad Copy Engine", icon: "📢", tagline: "Ad craftsman", desc: "Writes ad copy for Facebook, Google, LinkedIn, and Instagram with headline, body, and CTA variants.", ph: "What is the product/service and the key customer problem?", ex: "e.g. A project management tool for remote teams who lose track of priorities", color: "#d97706" },
      { id: "EmailSequenceEngine", name: "Email Sequence", icon: "📧", tagline: "Sequence architect", desc: "Writes 5-7 email welcome or nurture sequences that build trust and drive conversion.", ph: "What does your brand do and what action do you want subscribers to take?", ex: "e.g. A coaching business that helps burned-out executives rediscover their purpose", color: "#b45309" },
      { id: "ProductDescriptionEngine", name: "Product Description", icon: "🏷️", tagline: "Feature-to-benefit translator", desc: "Transforms product features into benefit-driven descriptions that sell without sounding like sales.", ph: "What is the product and who is it for?", ex: "e.g. A noise-cancelling sleep mask with integrated speakers for shift workers", color: "#d97706" },
    ],
  },
  {
    id: "storyboarder", title: "Storyboarder", icon: "🎞️", color: "#7c3aed",
    desc: "Scene-by-scene visual story planning — shot lists, visual beats, and narrative pacing.",
    engines: [
      { id: "ShotListEngine", name: "Shot List Designer", icon: "📷", tagline: "Visual sequence architect", desc: "Designs shot-by-shot lists with framing, movement, lens choice, and emotional intent.", ph: "Describe the scene you need a shot list for", ex: "e.g. A chase sequence through a night market where the pursuer and pursued both think they're the hero", color: "#7c3aed" },
      { id: "VisualBeatEngine", name: "Visual Beat Sheet", icon: "🎬", tagline: "Pacing architect", desc: "Maps the visual beats of a sequence — what the audience sees at each emotional moment.", ph: "What story sequence needs visual mapping?", ex: "e.g. A 5-minute opening sequence that establishes a world after technological collapse", color: "#6d28d9" },
      { id: "ColorPaletteNarrativeEngine", name: "Color Narrative", icon: "🎨", tagline: "Visual tone architect", desc: "Designs the color palette strategy for a film or video — how color shifts track the story.", ph: "What is the film's story and emotional arc?", ex: "e.g. A film that begins in a grey world and slowly gains color as a comatose patient recovers", color: "#7c3aed" },
      { id: "MontageEngine", name: "Montage Designer", icon: "⚡", tagline: "Sequence architect", desc: "Designs montage sequences with pacing, rhythm, and emotional payoff.", ph: "What should the montage convey and where is it in the story?", ex: "e.g. A training montage that also shows the emotional cost of the sacrifice", color: "#6d28d9" },
      { id: "OpeningSequenceEngine", name: "Opening Sequence", icon: "🌅", tagline: "Opening architect", desc: "Designs film or video opening sequences that establish world, tone, and stakes in 3–7 minutes.", ph: "What is the film about and what feeling should the opening create?", ex: "e.g. A film about a society that has erased memory of war — the opening is the day a memory returns", color: "#7c3aed" },
    ],
  },
  {
    id: "speechwriter", title: "Speechwriter", icon: "🎤", color: "#0891b2",
    desc: "Speeches, toasts, keynotes, commencement addresses, and public remarks.",
    engines: [
      { id: "KeynoteEngine", name: "Keynote Speech", icon: "🎤", tagline: "Keynote architect", desc: "Writes complete keynote speeches with opening story, key points, and memorable close.", ph: "What is the occasion, audience, and core message?", ex: "e.g. A CEO keynote to 500 employees after a difficult year that ended with breakthrough success", color: "#0891b2" },
      { id: "ToastEngine", name: "Toast Writer", icon: "🥂", tagline: "Toast craftsman", desc: "Writes wedding toasts, retirement speeches, and celebration remarks — warm, personal, and precise.", ph: "Who is the toast for, what is the occasion, and what do you want to say?", ex: "e.g. A best man toast that roasts the groom lovingly without embarrassing him in front of his parents", color: "#0e7490" },
      { id: "MotivationalSpeechEngine", name: "Motivational Speech", icon: "🔥", tagline: "Inspiration architect", desc: "Writes motivational speeches with emotional arc, story, and call to action.", ph: "Who is the audience and what should they feel moved to do?", ex: "e.g. A speech to first-generation college graduates about not losing where they came from", color: "#0891b2" },
      { id: "CommencementEngine", name: "Commencement Address", icon: "🎓", tagline: "Wisdom architect", desc: "Writes graduation commencement addresses — wise, warm, and forward-looking.", ph: "What is the institution, class year, and theme you want to address?", ex: "e.g. A commencement for nursing graduates who trained during the pandemic and are now exhausted", color: "#0e7490" },
      { id: "PublicApologyEngine", name: "Apology & Accountability", icon: "🙏", tagline: "Integrity architect", desc: "Writes genuine public apologies and accountability statements — no deflection, no excuses.", ph: "What happened and what does genuine accountability look like here?", ex: "e.g. A public apology from an organization that failed its employees during a crisis", color: "#0891b2" },
    ],
  },
  {
    id: "bookplanner", title: "Book Planner", icon: "📚", color: "#6366f1",
    desc: "Novel structure, chapter outlines, character development, and writing roadmaps.",
    engines: [
      { id: "NovelStructureEngine", name: "Novel Structure", icon: "📐", tagline: "Story architect", desc: "Designs complete novel structure — three/five acts, chapters, word count targets, and arc beats.", ph: "What is your novel concept, genre, and approximate length?", ex: "e.g. A literary thriller about a biographer who realizes the subject faked their death 30 years ago", color: "#6366f1" },
      { id: "ChapterOutlineEngine", name: "Chapter Outliner", icon: "📋", tagline: "Chapter architect", desc: "Writes detailed chapter-by-chapter outlines with scene, purpose, and character movement.", ph: "What is your novel's premise and main plot line?", ex: "e.g. A family saga spanning 4 generations where each chapter is told by a different family member", color: "#4f46e5" },
      { id: "WorldBuildingBriefEngine", name: "World Brief", icon: "🌍", tagline: "World brief writer", desc: "Creates a comprehensive world-building brief for your novel's setting and rules.", ph: "What genre and world is your novel set in?", ex: "e.g. A historical fantasy set in 1890s Mumbai where technology runs on spoken stories", color: "#6366f1" },
      { id: "WritingRoadmapEngine", name: "Writing Roadmap", icon: "🗺️", tagline: "Project planner", desc: "Creates a realistic writing schedule with milestones, daily word targets, and accountability checkpoints.", ph: "What is your novel word count goal and available writing time per day?", ex: "e.g. I have 90 minutes a day and want to finish an 80,000-word novel in 8 months", color: "#4f46e5" },
      { id: "QueryLetterEngine", name: "Query Letter", icon: "📮", tagline: "Agent query writer", desc: "Writes compelling query letters for literary agents — hook, synopsis, bio, and why this agent.", ph: "Describe your novel's premise, protagonist, and conflict", ex: "e.g. My novel is a 90,000-word psychological thriller about an art restorer who discovers forged memories", color: "#6366f1" },
    ],
  },
  {
    id: "technicalwriter", title: "Technical Writer", icon: "⚙️", color: "#475569",
    desc: "Technical documentation, user guides, API references, and process manuals.",
    engines: [
      { id: "UserGuideEngine", name: "User Guide Writer", icon: "📘", tagline: "Clarity architect", desc: "Writes clear, step-by-step user guides optimized for non-technical readers.", ph: "What product or process needs a user guide?", ex: "e.g. A guide for first-time users of a healthcare billing software portal", color: "#475569" },
      { id: "APIDocEngine", name: "API Documentation", icon: "🔌", tagline: "Developer doc writer", desc: "Writes developer-ready API documentation with endpoints, parameters, examples, and error codes.", ph: "Describe the API endpoint or feature to document", ex: "e.g. A REST endpoint that accepts a patient ID and returns their appointment history in JSON", color: "#334155" },
      { id: "SOPEngine", name: "SOP Writer", icon: "📋", tagline: "Process document architect", desc: "Writes Standard Operating Procedures with clear steps, roles, checkpoints, and decision trees.", ph: "What process needs a Standard Operating Procedure?", ex: "e.g. The process for handling a customer complaint escalation in a healthcare contact center", color: "#475569" },
      { id: "ReleaseNotesEngine", name: "Release Notes", icon: "🚀", tagline: "Update communicator", desc: "Writes clear, useful software release notes — features, fixes, and breaking changes explained.", ph: "What version changes need to be communicated?", ex: "e.g. Version 3.2 of our app adds real-time collaboration, fixes 3 critical bugs, removes legacy API", color: "#334155" },
      { id: "TroubleshootingEngine", name: "Troubleshooting Guide", icon: "🔧", tagline: "Problem-solver writer", desc: "Writes troubleshooting guides with error-symptom trees, solutions, and escalation paths.", ph: "What system or product needs a troubleshooting guide?", ex: "e.g. A troubleshooting guide for a medical device that displays sensor error codes 01–15", color: "#475569" },
    ],
  },
  {
    id: "contentcalendar", title: "Content Calendar", icon: "📅", color: "#0f766e",
    desc: "Content strategy, editorial calendars, campaign planning, and publishing schedules.",
    engines: [
      { id: "EditorialCalendarEngine", name: "Editorial Calendar", icon: "📅", tagline: "Schedule architect", desc: "Designs 12-week content calendars by channel, format, audience, and business goal.", ph: "What is your brand, channels, and content goals?", ex: "e.g. A B2B marketing agency targeting startup founders across LinkedIn and newsletter", color: "#0f766e" },
      { id: "ContentPillarEngine", name: "Content Pillars", icon: "🏛️", tagline: "Strategy architect", desc: "Defines 3–5 content pillars with sub-topics, formats, and audience alignment.", ph: "What does your brand do and who is your audience?", ex: "e.g. A mental health app for teenagers and their parents", color: "#0d9488" },
      { id: "CampaignBriefEngine", name: "Campaign Brief", icon: "🎯", tagline: "Campaign architect", desc: "Writes full campaign briefs with objective, audience, messaging, channels, and success metrics.", ph: "What is the campaign goal and target audience?", ex: "e.g. A product launch campaign for a sustainable packaging startup targeting e-commerce brands", color: "#0f766e" },
      { id: "RepurposingEngine", name: "Content Repurposer", icon: "♻️", tagline: "Content multiplier", desc: "Transforms one piece of content into 5–8 formats across different channels.", ph: "What piece of content do you want to repurpose?", ex: "e.g. A 3,000-word research report about employee burnout in tech companies", color: "#0d9488" },
      { id: "TrendingTopicsEngine", name: "Trending Topics", icon: "📈", tagline: "Opportunity spotter", desc: "Identifies trending topics in your niche and generates content angle ideas to capitalize on them.", ph: "What is your industry and content focus?", ex: "e.g. B2C fintech company targeting millennials who are financially anxious", color: "#0f766e" },
    ],
  },

  // ── Business & Strategy Suite ─────────────────────────────────────────────
  {
    id: "strategist", title: "Business Strategist", icon: "♟️", color: "#1d4ed8",
    desc: "Business strategy, competitive analysis, market positioning, and growth planning.",
    engines: [
      { id: "CompetitiveAnalysisEngine", name: "Competitive Analysis", icon: "🔬", tagline: "Market intelligence", desc: "Analyzes competitive landscape with positioning maps, strengths/weaknesses, and differentiation gaps.", ph: "What is your business and who are your main competitors?", ex: "e.g. A healthcare SaaS competing against Epic, Athena, and Kareo for mid-size clinic billing", color: "#1d4ed8" },
      { id: "GrowthStrategyEngine", name: "Growth Strategy", icon: "📈", tagline: "Growth architect", desc: "Designs 90-day growth strategies with prioritized initiatives, metrics, and resource allocation.", ph: "What is your business stage, goal, and biggest current constraint?", ex: "e.g. We are post-product-market-fit but stuck at $2M ARR and don't know which growth lever to pull", color: "#1e40af" },
      { id: "MarketPositioningEngine", name: "Market Positioning", icon: "🎯", tagline: "Positioning architect", desc: "Creates positioning statements, value propositions, and category design strategies.", ph: "What does your company do and who do you serve?", ex: "e.g. An AI-powered legal research tool for solo practitioners who can't afford BigLaw pricing", color: "#1d4ed8" },
      { id: "SWOTEngine", name: "SWOT Analyst", icon: "⚖️", tagline: "Situation analyst", desc: "Conducts deep SWOT analysis with strategic implications and priority action recommendations.", ph: "What business or strategic situation should I analyze?", ex: "e.g. A brick-and-mortar bookstore chain deciding whether to expand into digital or double down on local", color: "#1e40af" },
      { id: "PivotStrategyEngine", name: "Pivot Strategist", icon: "🔄", tagline: "Pivot architect", desc: "Evaluates pivot options with viability scoring, risk assessment, and execution roadmap.", ph: "What is your current business and why are you considering a pivot?", ex: "e.g. Our B2C app is struggling but enterprise clients keep asking for the same core feature", color: "#1d4ed8" },
    ],
  },
  {
    id: "reportbuilder", title: "Report Builder", icon: "📊", color: "#0369a1",
    desc: "Business reports, executive summaries, board decks, and data narratives.",
    engines: [
      { id: "ExecutiveSummaryEngine", name: "Executive Summary", icon: "⭐", tagline: "Summary architect", desc: "Writes executive summaries that are clear, concise, and decision-ready.", ph: "What report or situation needs an executive summary?", ex: "e.g. A quarterly business review showing 40% growth but also rising churn", color: "#0369a1" },
      { id: "DataNarrativeEngine", name: "Data Narrative", icon: "📈", tagline: "Story in data", desc: "Transforms data and metrics into compelling business narratives with insight and implication.", ph: "What data or metrics do you need to narrate?", ex: "e.g. Q3 showed revenue up 30% but customer satisfaction dropped from 4.2 to 3.6", color: "#0284c7" },
      { id: "BoardUpdateEngine", name: "Board Update", icon: "🏢", tagline: "Board communicator", desc: "Writes board-level updates: key metrics, strategic progress, risks, and asks.", ph: "What does the board need to know about this period?", ex: "e.g. We hit revenue targets but missed on team growth and have two strategic decisions to make", color: "#0369a1" },
      { id: "AnnualReportEngine", name: "Annual Report Writer", icon: "📚", tagline: "Year-in-review architect", desc: "Writes annual report sections: CEO letter, year in review, impact stories, and forward outlook.", ph: "What were the year's key achievements, challenges, and direction?", ex: "e.g. A nonprofit that expanded to 3 new regions, survived a funding cut, and launched a new program", color: "#0284c7" },
      { id: "RecommendationEngine", name: "Recommendation Report", icon: "💡", tagline: "Decision architect", desc: "Writes recommendation reports with situation analysis, options, pros/cons, and clear recommendation.", ph: "What decision needs a structured recommendation?", ex: "e.g. Whether to build, buy, or partner for our new analytics capability", color: "#0369a1" },
    ],
  },
  {
    id: "proposalbuilder", title: "Proposal Builder", icon: "📨", color: "#7c3aed",
    desc: "Business proposals, RFP responses, grant applications, and client pitches.",
    engines: [
      { id: "ProposalExecutiveEngine", name: "Proposal Executive Summary", icon: "⭐", tagline: "Proposal opener", desc: "Writes proposal executive summaries that capture the client's problem and your solution with urgency.", ph: "What problem is the client facing and what is your solution?", ex: "e.g. A hospital system needs to reduce readmission rates — we provide predictive discharge planning software", color: "#7c3aed" },
      { id: "SolutionSectionEngine", name: "Solution Section", icon: "💡", tagline: "Solution architect", desc: "Writes the solution section of proposals — approach, methodology, and deliverables.", ph: "What is your proposed solution and how will you deliver it?", ex: "e.g. Our 90-day consulting engagement redesigning their patient intake workflow across 5 clinics", color: "#6d28d9" },
      { id: "BudgetJustificationEngine", name: "Budget Justification", icon: "💰", tagline: "Cost justifier", desc: "Writes budget justification narratives that frame costs as investments with clear ROI.", ph: "What is the project budget and what value does it deliver?", ex: "e.g. A $250,000 software implementation expected to save $1.2M in operational costs over 3 years", color: "#7c3aed" },
      { id: "RFPResponseEngine", name: "RFP Response", icon: "📋", tagline: "RFP architect", desc: "Structures and writes RFP responses section by section, hitting every evaluation criterion.", ph: "What are the RFP requirements and your qualifications?", ex: "e.g. RFP for city government EHR modernization — we have 10 years of public sector health IT experience", color: "#6d28d9" },
      { id: "GrantApplicationEngine", name: "Grant Application", icon: "🏆", tagline: "Grant writer", desc: "Writes grant applications — statement of need, project narrative, goals, and evaluation plan.", ph: "What is the grant, the need you're addressing, and your proposed project?", ex: "e.g. An NEA grant for a community theater program serving incarcerated youth", color: "#7c3aed" },
    ],
  },
  {
    id: "emailcomposer", title: "Email Composer", icon: "📧", color: "#16a34a",
    desc: "Professional emails, newsletters, follow-ups, and communication templates.",
    engines: [
      { id: "ProfessionalEmailEngine", name: "Professional Email", icon: "💼", tagline: "Email craftsman", desc: "Writes clear, professional emails for any business context — tone-matched and purpose-driven.", ph: "What is the email for and what do you want to achieve?", ex: "e.g. Following up with a prospect who went cold after a promising demo three weeks ago", color: "#16a34a" },
      { id: "DifficultyEmailEngine", name: "Difficult Email", icon: "⚠️", tagline: "Hard message writer", desc: "Writes difficult emails — firing, declining, confronting, or delivering bad news with clarity and respect.", ph: "What difficult message needs to be communicated and to whom?", ex: "e.g. Informing a long-time vendor we are ending our contract after 5 years", color: "#15803d" },
      { id: "ColdOutreachEngine", name: "Cold Outreach", icon: "🎯", tagline: "Cold email architect", desc: "Writes cold outreach emails with hyper-personalized hooks, clear value, and low-friction CTAs.", ph: "Who are you reaching out to and what is your offer?", ex: "e.g. Cold outreach to startup CTOs about our developer productivity analytics tool", color: "#16a34a" },
      { id: "NewsletterEngine", name: "Newsletter Writer", icon: "📰", tagline: "Newsletter architect", desc: "Writes email newsletters with great subject lines, engaging body, and clear reader value.", ph: "What is the newsletter topic and who is your audience?", ex: "e.g. A weekly newsletter for independent consultants about building a practice", color: "#15803d" },
      { id: "EmailSequenceBuilderEngine", name: "Email Sequence Builder", icon: "🔄", tagline: "Sequence architect", desc: "Designs and writes multi-email sequences for onboarding, sales, or nurture campaigns.", ph: "What is the sequence goal and subscriber profile?", ex: "e.g. A 5-email onboarding sequence for new users of a mental health journaling app", color: "#16a34a" },
    ],
  },
  {
    id: "hiringassist", title: "Hiring Assistant", icon: "🤝", color: "#d97706",
    desc: "Job descriptions, interview questions, offer letters, and hiring process design.",
    engines: [
      { id: "JobDescriptionEngine", name: "Job Description Writer", icon: "📋", tagline: "JD architect", desc: "Writes inclusive, compelling job descriptions that attract the right candidates.", ph: "What role are you hiring for and what are the key responsibilities and qualifications?", ex: "e.g. A Head of Customer Success for a B2B SaaS company at Series B with 150 enterprise clients", color: "#d97706" },
      { id: "InterviewQuestionEngine", name: "Interview Question Designer", icon: "❓", tagline: "Interview architect", desc: "Designs structured interview question sets — behavioral, situational, and technical.", ph: "What role and competencies are you interviewing for?", ex: "e.g. Interviewing senior engineers for a role requiring ownership, speed, and architectural thinking", color: "#b45309" },
      { id: "ScorecardEngine", name: "Hiring Scorecard", icon: "⭐", tagline: "Evaluation architect", desc: "Designs structured hiring scorecards with competencies, rating criteria, and red flags.", ph: "What role and success criteria are you evaluating?", ex: "e.g. A scorecard for hiring a VP of Sales who can transition the team from founder-led sales", color: "#d97706" },
      { id: "OfferLetterEngine", name: "Offer Letter Writer", icon: "✉️", tagline: "Offer craftsman", desc: "Writes compelling offer letters that close candidates with clear terms and enthusiasm.", ph: "What is the role, compensation, and company context?", ex: "e.g. Offer letter for a startup's first senior hire who has a competing offer from a larger company", color: "#b45309" },
      { id: "OnboardingPlanEngine", name: "Onboarding Plan", icon: "🚀", tagline: "Onboarding architect", desc: "Designs 30-60-90 day onboarding plans with milestones, activities, and success metrics.", ph: "What role and what should the new hire achieve in their first 90 days?", ex: "e.g. A new CMO joining a company that has never had a dedicated marketing function", color: "#d97706" },
    ],
  },
  {
    id: "meetingplanner", title: "Meeting Planner", icon: "🗓️", color: "#0891b2",
    desc: "Meeting agendas, minutes, retrospectives, and facilitation guides.",
    engines: [
      { id: "AgendaBuilderEngine", name: "Agenda Builder", icon: "📋", tagline: "Meeting architect", desc: "Builds structured meeting agendas with time blocks, owners, and desired outcomes.", ph: "What type of meeting is this, who attends, and what must be decided?", ex: "e.g. A quarterly planning meeting for a 12-person product team deciding next quarter's roadmap", color: "#0891b2" },
      { id: "MeetingMinutesEngine", name: "Meeting Minutes", icon: "📝", tagline: "Minutes writer", desc: "Writes clean, action-oriented meeting minutes with decisions, action items, and owners.", ph: "Summarize what was discussed and decided in the meeting", ex: "e.g. We reviewed Q2 results, decided to pause Feature X, and agreed on a new hiring freeze policy", color: "#0e7490" },
      { id: "RetrospectiveEngine", name: "Retrospective Facilitator", icon: "🔄", tagline: "Retro architect", desc: "Designs retrospective agendas and prompts for sprint, project, or quarterly retrospectives.", ph: "What project or period are you retrospecting on?", ex: "e.g. A post-mortem after a product launch that was delayed by 3 months", color: "#0891b2" },
      { id: "FacilitationGuideEngine", name: "Facilitation Guide", icon: "🎤", tagline: "Facilitator architect", desc: "Writes detailed facilitation guides for workshops, strategy sessions, and team meetings.", ph: "What is the workshop goal and who are the participants?", ex: "e.g. A 3-hour strategic planning workshop with 20 healthcare executives from different specialties", color: "#0e7490" },
      { id: "DecisionFrameworkEngine", name: "Decision Framework", icon: "⚖️", tagline: "Decision architect", desc: "Designs decision-making frameworks for complex team decisions with criteria, weighting, and process.", ph: "What decision does your team need to make?", ex: "e.g. Whether to build our own data warehouse or buy a third-party analytics platform", color: "#0891b2" },
    ],
  },
  {
    id: "presentbuilder", title: "Presentation Builder", icon: "📊", color: "#6366f1",
    desc: "Presentation outlines, slide structures, speaker notes, and pitch decks.",
    engines: [
      { id: "PresentationOutlineEngine", name: "Presentation Outline", icon: "📐", tagline: "Story architect", desc: "Designs presentation structure with narrative arc, slide titles, and talking points.", ph: "What is the presentation topic, audience, and goal?", ex: "e.g. A 20-minute board presentation on why we need to enter a new market segment", color: "#6366f1" },
      { id: "SlideTitleEngine", name: "Slide Title Writer", icon: "🏷️", tagline: "Clarity engineer", desc: "Writes action-oriented slide titles that communicate the key insight, not just the topic.", ph: "What is the slide's message or data point?", ex: "e.g. Customer retention dropped from 92% to 87% and we know why", color: "#4f46e5" },
      { id: "SpeakerNotesEngine", name: "Speaker Notes", icon: "🎤", tagline: "Speaker note writer", desc: "Writes detailed speaker notes that guide delivery without reading verbatim.", ph: "What is the slide content and key points to convey?", ex: "e.g. Slide showing 3 years of revenue growth with a dip in year 2 that we recovered from", color: "#6366f1" },
      { id: "PitchDeckEngine", name: "Pitch Deck Narrative", icon: "🚀", tagline: "Investor story architect", desc: "Structures investor pitch decks with proven 12-slide frameworks and compelling narratives.", ph: "What does your startup do, what problem do you solve, and what stage are you at?", ex: "e.g. A Series A pitch for a mental health platform for underserved rural communities", color: "#4f46e5" },
      { id: "DataSlideEngine", name: "Data Slide Narrative", icon: "📈", tagline: "Data story translator", desc: "Transforms charts and data into slide narratives with insight headlines and business implications.", ph: "What does the data show and what should the audience conclude from it?", ex: "e.g. Our cohort analysis shows customers who onboard in under 10 minutes have 3x lifetime value", color: "#6366f1" },
    ],
  },
  {
    id: "budgetplanner", title: "Budget Planner", icon: "💰", color: "#16a34a",
    desc: "Budget templates, financial narratives, cost justifications, and financial planning.",
    engines: [
      { id: "DepartmentBudgetEngine", name: "Department Budget", icon: "📊", tagline: "Budget architect", desc: "Designs department budget structures with line items, justifications, and variance tracking.", ph: "What department, fiscal year, and strategic priorities are you budgeting for?", ex: "e.g. A marketing budget for a SaaS company shifting from outbound to inbound for the first time", color: "#16a34a" },
      { id: "ROICalculatorEngine", name: "ROI Calculator Narrative", icon: "💡", tagline: "ROI communicator", desc: "Writes ROI narratives that make financial returns tangible, credible, and compelling.", ph: "What investment are you justifying and what returns does it produce?", ex: "e.g. A $500K investment in a new CRM that we estimate will increase close rate by 15%", color: "#15803d" },
      { id: "FinancialForecastEngine", name: "Financial Forecast Narrative", icon: "📈", tagline: "Forecast architect", desc: "Writes financial forecast narratives with assumptions, scenarios, and sensitivity analysis explanation.", ph: "What are your revenue and cost projections and their key assumptions?", ex: "e.g. We project $4M ARR next year assuming 20% growth from current customers and 10 new enterprise deals", color: "#16a34a" },
      { id: "BudgetRequestEngine", name: "Budget Request", icon: "📨", tagline: "Ask architect", desc: "Writes compelling budget requests with justification, impact, and approval criteria.", ph: "What budget are you requesting and what will it achieve?", ex: "e.g. Requesting $180K for 2 new engineers to support a product launch in Q3", color: "#15803d" },
      { id: "CostReductionEngine", name: "Cost Reduction Plan", icon: "✂️", tagline: "Efficiency architect", desc: "Designs cost reduction plans with prioritized cuts, implementation timeline, and impact mitigation.", ph: "What budget needs to be reduced and by how much?", ex: "e.g. We need to cut $400K from our $2M operating budget without reducing headcount", color: "#16a34a" },
    ],
  },
  {
    id: "perfreviewer", title: "Performance Reviewer", icon: "⭐", color: "#7c3aed",
    desc: "Performance reviews, feedback frameworks, 360 reviews, and development plans.",
    engines: [
      { id: "PerformanceReviewEngine", name: "Performance Review Writer", icon: "📋", tagline: "Review architect", desc: "Writes complete performance reviews — strengths, development areas, goals, and ratings — balanced and specific.", ph: "Describe the employee's role, performance highlights, and areas for growth", ex: "e.g. A mid-level engineer who ships quality code but struggles with cross-team communication", color: "#7c3aed" },
      { id: "FeedbackFramingEngine", name: "Feedback Framer", icon: "💬", tagline: "Feedback architect", desc: "Transforms vague feedback into specific, actionable, behavior-based statements.", ph: "What feedback do you need to give and to whom?", ex: "e.g. A manager who micromanages and doesn't trust the team to make decisions without checking", color: "#6d28d9" },
      { id: "GoalSettingEngine", name: "Goal Setting Designer", icon: "🎯", tagline: "OKR architect", desc: "Designs SMART goals and OKRs aligned to individual role, team priorities, and company strategy.", ph: "What is the role and what should this person achieve this quarter?", ex: "e.g. A customer success manager who needs to reduce churn and expand accounts simultaneously", color: "#7c3aed" },
      { id: "PIPEngine", name: "Improvement Plan Designer", icon: "🔧", tagline: "PIP architect", desc: "Designs performance improvement plans with clear expectations, milestones, and support mechanisms.", ph: "What performance gap needs addressing and what does success look like?", ex: "e.g. A sales rep who has missed quota for 3 consecutive quarters despite coaching", color: "#6d28d9" },
      { id: "SelfReviewEngine", name: "Self-Review Writer", icon: "🪞", tagline: "Self-advocacy architect", desc: "Helps employees write compelling self-reviews that highlight impact without boasting.", ph: "What did you accomplish this review period and what impact did it have?", ex: "e.g. I redesigned our onboarding flow, reduced support tickets by 30%, and mentored 2 junior engineers", color: "#7c3aed" },
    ],
  },
  {
    id: "contractdraft", title: "Contract Drafter", icon: "📜", color: "#dc2626",
    desc: "Contract templates, legal language, terms drafting, and agreement structures.",
    engines: [
      { id: "ServiceAgreementEngine", name: "Service Agreement", icon: "🤝", tagline: "Agreement architect", desc: "Drafts service agreement structures with scope, payment terms, IP ownership, and termination clauses.", ph: "What service are you providing, to whom, and what are the key terms?", ex: "e.g. A consulting agreement for 6 months of strategy work with a mid-size tech company", color: "#dc2626" },
      { id: "NDAAgreementEngine", name: "NDA Framework", icon: "🔒", tagline: "Confidentiality architect", desc: "Drafts NDA frameworks — mutual and one-way — with appropriate scope and exclusions.", ph: "What is the relationship, what information is being protected, and how long?", ex: "e.g. Mutual NDA for two companies exploring a potential acquisition", color: "#b91c1c" },
      { id: "PartnershipAgreementEngine", name: "Partnership Agreement", icon: "🤝", tagline: "Partnership architect", desc: "Structures partnership agreements with roles, revenue split, decision rights, and exit terms.", ph: "What is the partnership structure and what are each party's contributions?", ex: "e.g. Two founders partnering to build a product — one brings tech, one brings clients", color: "#dc2626" },
      { id: "TermsOfServiceEngine", name: "Terms of Service", icon: "📋", tagline: "Terms architect", desc: "Drafts Terms of Service frameworks appropriate for SaaS, marketplace, or content platforms.", ph: "What type of product or platform do you need terms for?", ex: "e.g. A marketplace that connects freelancers with clients and takes a 15% commission", color: "#b91c1c" },
      { id: "ContractReviewEngine", name: "Contract Review Notes", icon: "🔍", tagline: "Risk spotter", desc: "Analyzes contract language and flags potential risks, ambiguities, and missing protections.", ph: "Describe or paste the contract clauses you want reviewed", ex: "e.g. The payment terms say NET 90 with no late payment penalty — is this a risk for us?", color: "#dc2626" },
    ],
  },

  // ── World & Universe Building ─────────────────────────────────────────────
  {
    id: "alienspecies", title: "Alien Species Forge", icon: "👾", color: "#7c3aed",
    desc: "Xenobiology, alien civilizations, first contact protocols, and interstellar cultures.",
    engines: [
      { id: "XenobiologyEngine", name: "Xenobiology Designer", icon: "🧬", tagline: "Life system architect", desc: "Designs alien biology — physiology, senses, reproduction, lifespan, and evolutionary history.", ph: "What kind of planet does this species come from and what ecological niche do they fill?", ex: "e.g. A species from a gas giant that evolved in layers of ammonia cloud without ever touching solid ground", color: "#7c3aed" },
      { id: "AlienCivilizationEngine", name: "Alien Civilization", icon: "🏛️", tagline: "Culture architect", desc: "Designs alien civilization structure — governance, religion, art, technology, and social hierarchy.", ph: "What are the biological and ecological foundations of this civilization?", ex: "e.g. A hive-mind species that has never experienced individual consciousness or private thought", color: "#6d28d9" },
      { id: "FirstContactEngine", name: "First Contact Protocol", icon: "📡", tagline: "Contact architect", desc: "Designs first contact scenarios, communication challenges, and diplomatic protocols.", ph: "Describe the two species making first contact and their communication abilities", ex: "e.g. Humans meeting a species that communicates entirely through bioluminescence and smell", color: "#7c3aed" },
      { id: "AlienLanguageEngine", name: "Alien Language System", icon: "🔤", tagline: "Xenolinguist", desc: "Designs alien communication systems — not just words, but the physics and biology of their language.", ph: "How does this species perceive and communicate? What senses do they use?", ex: "e.g. A species that communicates through time — they talk in memories, not words", color: "#6d28d9" },
      { id: "AlienTechEngine", name: "Alien Technology", icon: "🛸", tagline: "Xenotech architect", desc: "Designs alien technology that is genuinely alien — built on different physics, biology, and assumptions.", ph: "What principles does this civilization's technology operate on?", ex: "e.g. A civilization that never discovered electricity but developed biotechnology to its ultimate limits", color: "#7c3aed" },
    ],
  },
  {
    id: "planetbuilder", title: "Planet Builder", icon: "🪐", color: "#0369a1",
    desc: "Planetary creation: geology, climate, terrain, atmosphere, and ecological systems.",
    engines: [
      { id: "PlanetaryGeologyEngine", name: "Planetary Geology", icon: "🏔️", tagline: "Geology architect", desc: "Designs planetary geology — tectonic plates, mountain ranges, volcanic activity, and soil composition.", ph: "What type of star does this planet orbit and what is its size relative to Earth?", ex: "e.g. A planet with 1.4 Earth gravity orbiting a red dwarf, tidally locked with one side always facing the star", color: "#0369a1" },
      { id: "ClimateSystemEngine", name: "Climate System", icon: "🌪️", tagline: "Climate architect", desc: "Designs planetary climate with weather patterns, seasonal cycles, and atmospheric chemistry.", ph: "Describe the planet's orbit, tilt, and geography", ex: "e.g. A planet with three moons creating complex tidal patterns and seasonal flooding every 18 months", color: "#0284c7" },
      { id: "OceanSystemEngine", name: "Ocean System", icon: "🌊", tagline: "Ocean architect", desc: "Designs ocean systems — depths, currents, chemistry, and the life that inhabits them.", ph: "How much of this planet's surface is water and what is its chemistry?", ex: "e.g. An ocean world with no land, where civilization developed entirely underwater", color: "#0369a1" },
      { id: "BiosphereEngine", name: "Biosphere Designer", icon: "🌿", tagline: "Biosphere architect", desc: "Designs planetary biosphere — food webs, dominant lifeforms, ecological niches, and evolutionary pressures.", ph: "What are the planetary conditions that shaped life here?", ex: "e.g. A planet where photosynthesis never evolved and all life is chemosynthetic", color: "#0284c7" },
      { id: "PlanetNameEngine", name: "Planet Naming System", icon: "🏷️", tagline: "Nomenclature architect", desc: "Designs naming systems for planets, moons, continents, and geographical features.", ph: "What civilization named this planet and what phonological rules do they follow?", ex: "e.g. An insectoid species that names features after their six sensory organs", color: "#0369a1" },
    ],
  },
  {
    id: "futurecivilization", title: "Future Civilization", icon: "🔭", color: "#0f766e",
    desc: "Far-future society design: post-scarcity, interstellar, post-human, and deep future.",
    engines: [
      { id: "PostScarcityEngine", name: "Post-Scarcity Society", icon: "♾️", tagline: "Abundance architect", desc: "Designs post-scarcity civilizations — what happens to economy, identity, and meaning when resources are unlimited.", ph: "How did this civilization achieve post-scarcity and what replaced economic struggle?", ex: "e.g. A society where molecular assemblers make any physical object for free — what do people do?", color: "#0f766e" },
      { id: "PostHumanEngine", name: "Post-Human Design", icon: "🤖", tagline: "Evolution architect", desc: "Designs post-human civilizations where biological humanity has been transcended or altered.", ph: "What is the nature and degree of humanity's transformation?", ex: "e.g. A civilization 3,000 years from now where 60% of minds are digital and 40% are biological", color: "#0d9488" },
      { id: "InterstellarCivilizationEngine", name: "Interstellar Civilization", icon: "⭐", tagline: "Galaxy architect", desc: "Designs civilizations spanning multiple star systems — governance, communication lag, and cultural drift.", ph: "How many star systems does this civilization span and how long does travel take?", ex: "e.g. A civilization spanning 40 light-years where messages take decades — what does governance look like?", color: "#0f766e" },
      { id: "FutureSocialStructureEngine", name: "Future Social Structure", icon: "🏙️", tagline: "Society architect", desc: "Designs far-future social structures — family, identity, community, and meaning in transformed worlds.", ph: "What technologies and events shaped this future society's social fabric?", ex: "e.g. A society where lifespan is 400 years — how does marriage, career, and family change?", color: "#0d9488" },
      { id: "CollapseRecoveryEngine", name: "Collapse & Recovery", icon: "🌱", tagline: "Resilience architect", desc: "Designs civilizations that survived collapse and rebuilt — what they preserved and what they abandoned.", ph: "What kind of collapse did this civilization survive and how long did recovery take?", ex: "e.g. A civilization 500 years after a pandemic that killed 80% — how do they remember and organize?", color: "#0f766e" },
    ],
  },
  {
    id: "monsterforge", title: "Monster Forge", icon: "🐉", color: "#dc2626",
    desc: "Monster and creature design — biology, behavior, ecology, lore, and narrative role.",
    engines: [
      { id: "MonsterBiologyEngine", name: "Monster Biology", icon: "🧬", tagline: "Biology architect", desc: "Designs monster biology — anatomy, physiology, senses, diet, and evolutionary origin.", ph: "What kind of creature is this and what world do they come from?", ex: "e.g. A predator that evolved in complete darkness, hunts by sensing bioelectric fields, and communicates by touch", color: "#dc2626" },
      { id: "MonsterLoreEngine", name: "Monster Lore", icon: "📜", tagline: "Mythology architect", desc: "Creates the mythology, legends, and cultural significance of a monster in its world.", ph: "What kind of monster is this and what cultures encounter it?", ex: "e.g. A sea creature that sailors have worshipped and feared for 3,000 years", color: "#b91c1c" },
      { id: "MonsterBehaviorEngine", name: "Monster Behavior", icon: "🧠", tagline: "Behavior architect", desc: "Designs monster psychology and behavior — intelligence, social structure, territory, and threat response.", ph: "How intelligent is this creature and does it live alone or in groups?", ex: "e.g. A pack hunter with near-human intelligence that sets traps and recognizes individual prey", color: "#dc2626" },
      { id: "MonsterEcologyEngine", name: "Monster Ecology", icon: "🌿", tagline: "Ecology architect", desc: "Designs the ecological role of a monster — what it eats, what eats it, and how it shapes its environment.", ph: "What is this creature's role in its ecosystem?", ex: "e.g. An apex predator that, when removed from a forest, causes overpopulation that destroys the trees", color: "#b91c1c" },
      { id: "MonsterNarrativeEngine", name: "Monster Narrative Role", icon: "🎭", tagline: "Story role architect", desc: "Defines the narrative and symbolic role of a monster — what it represents thematically.", ph: "What should this monster mean in the story or world?", ex: "e.g. A monster that only appears to people who have given up hope — does it feed on despair or respond to it?", color: "#dc2626" },
    ],
  },
  {
    id: "artifactforge", title: "Artifact Forge", icon: "💎", color: "#d97706",
    desc: "Magical artifacts, legendary items, cursed objects, and relics of power.",
    engines: [
      { id: "ArtifactOriginEngine", name: "Artifact Origin", icon: "📜", tagline: "Origin architect", desc: "Designs the creation history, maker, and original purpose of a magical artifact.", ph: "What does this artifact do and who created it originally?", ex: "e.g. A mirror that shows not your reflection but the moment of your death — who made it and why?", color: "#d97706" },
      { id: "ArtifactPowerEngine", name: "Artifact Powers", icon: "⚡", tagline: "Power architect", desc: "Designs artifact abilities, limitations, costs, and conditions of use.", ph: "What kind of power does this artifact have and what are its rules?", ex: "e.g. A sword that wins every battle but costs the wielder one memory per kill", color: "#b45309" },
      { id: "CurseEngine", name: "Curse Designer", icon: "😈", tagline: "Curse architect", desc: "Designs curses — origin, mechanism, rules, conditions for lifting, and psychological effects.", ph: "What is the curse, who cast it, and what were the circumstances?", ex: "e.g. A curse that makes the victim unable to lie but also unable to explain the truth they see", color: "#d97706" },
      { id: "ArtifactLoreEngine", name: "Artifact Lore", icon: "🗺️", tagline: "History architect", desc: "Creates the artifact's history across time — who owned it, what happened, what was lost.", ph: "Describe the artifact and the world it exists in", ex: "e.g. A crown that has been worn by 14 monarchs — 12 died violently and 2 disappeared", color: "#b45309" },
      { id: "ArtifactSentinceEngine", name: "Sentient Artifact", icon: "🤔", tagline: "Consciousness architect", desc: "Designs artifacts with intelligence — personality, goals, values, and relationship with wielders.", ph: "What kind of consciousness does this artifact have and where did it come from?", ex: "e.g. A sword that absorbed the soul of every warrior it killed and is now a council of 10,000 voices", color: "#d97706" },
    ],
  },
  {
    id: "dimensionbuilder", title: "Dimension Builder", icon: "🌀", color: "#6366f1",
    desc: "Alternate dimensions, parallel worlds, pocket realities, and planes of existence.",
    engines: [
      { id: "PhysicsRulesEngine", name: "Physics Rules", icon: "⚛️", tagline: "Physics architect", desc: "Designs how physics works differently in this dimension — gravity, time, causality, light.", ph: "What physical law is different in this dimension and why?", ex: "e.g. A dimension where time moves backwards — entropy decreases and things grow less complex", color: "#6366f1" },
      { id: "DimensionAestheticEngine", name: "Dimension Aesthetic", icon: "🎨", tagline: "Sensory architect", desc: "Designs how this dimension looks, sounds, feels, and registers on the senses.", ph: "What is the fundamental nature of this dimension?", ex: "e.g. A dimension made entirely of memory — the landscape is assembled from things people have forgotten", color: "#4f46e5" },
      { id: "DimensionInhabitantsEngine", name: "Dimension Inhabitants", icon: "👻", tagline: "Inhabitants architect", desc: "Designs the entities that live in this dimension and how they relate to physical-world beings.", ph: "What kind of beings evolved to live in this dimension?", ex: "e.g. Beings made of pure mathematics who experience themselves as equations and humans as noise", color: "#6366f1" },
      { id: "DimensionAccessEngine", name: "Dimension Access Rules", icon: "🚪", tagline: "Access architect", desc: "Designs the rules for entering, navigating, and leaving this dimension.", ph: "How do people or things enter this dimension?", ex: "e.g. A dimension you can only enter at the moment between sleeping and waking", color: "#4f46e5" },
      { id: "DimensionConflictEngine", name: "Dimension Conflict", icon: "⚔️", tagline: "Conflict architect", desc: "Designs conflicts between dimensions — border wars, dimensional bleed, and reality collapse.", ph: "What is the conflict between this dimension and the physical world?", ex: "e.g. A dimension of perfect order bleeding into our chaotic world, eliminating randomness everywhere it touches", color: "#6366f1" },
    ],
  },
  {
    id: "dystopia", title: "Dystopia Builder", icon: "🏭", color: "#475569",
    desc: "Dystopian world design — systems of control, resistance, collapse, and moral complexity.",
    engines: [
      { id: "ControlSystemEngine", name: "Control System", icon: "👁️", tagline: "Oppression architect", desc: "Designs how the dystopian government maintains control — surveillance, propaganda, scarcity, fear.", ph: "What type of government or system controls this dystopia?", ex: "e.g. A corporation that controls all food production and uses nutrition access as social credit", color: "#475569" },
      { id: "DystopiaOriginEngine", name: "Dystopia Origin", icon: "📅", tagline: "History architect", desc: "Designs the historical path from our world to this dystopia — what choices led here.", ph: "What kind of dystopia is this and when does it take place?", ex: "e.g. A society where climate catastrophe led to an 'emergency government' that never relinquished power", color: "#334155" },
      { id: "ResistanceEngine", name: "Resistance Movement", icon: "✊", tagline: "Resistance architect", desc: "Designs underground resistance movements — structure, methods, ideology, and betrayal dynamics.", ph: "Who is resisting the system and why haven't they been crushed?", ex: "e.g. A resistance movement that hides in plain sight by appearing to be a religious charity", color: "#475569" },
      { id: "DystopiaEverydayEngine", name: "Everyday Life", icon: "🏘️", tagline: "Daily life architect", desc: "Designs what daily life actually looks like for ordinary citizens — survival, pleasure, and compromise.", ph: "What class of people and daily context do you want to explore?", ex: "e.g. A middle-class family in a surveillance state who genuinely believe they have nothing to hide", color: "#334155" },
      { id: "DystopiaFallEngine", name: "Dystopia's Cracks", icon: "🔓", tagline: "Vulnerability architect", desc: "Identifies the systemic weaknesses, contradictions, and cracks that could bring the dystopia down.", ph: "Describe the dystopian system and how it maintains power", ex: "e.g. A society that needs creative thinkers to maintain the AI systems that surveil and control people", color: "#475569" },
    ],
  },
  {
    id: "utopia", title: "Utopia Builder", icon: "🌈", color: "#16a34a",
    desc: "Utopian society design — what makes it work, what it costs, and who it might exclude.",
    engines: [
      { id: "UtopiaFoundationEngine", name: "Utopia Foundations", icon: "🏛️", tagline: "Foundation architect", desc: "Designs the philosophical and practical foundations of a functioning utopian society.", ph: "What values and principles is this utopia built on?", ex: "e.g. A post-scarcity society founded on the principle that the only meaningful work is art and care", color: "#16a34a" },
      { id: "UtopiaEconomyEngine", name: "Utopian Economy", icon: "💰", tagline: "Economy architect", desc: "Designs the economic system that makes utopian resource abundance possible and sustainable.", ph: "How does this society produce and distribute resources?", ex: "e.g. A gift economy where all production is automated and contribution is voluntary and recognized socially", color: "#15803d" },
      { id: "UtopiaGovernanceEngine", name: "Utopian Governance", icon: "⚖️", tagline: "Governance architect", desc: "Designs how decisions are made in a utopian society — without coercion but still effectively.", ph: "How are collective decisions made in this society?", ex: "e.g. A society using AI-augmented deliberative democracy where every citizen can participate in any decision", color: "#16a34a" },
      { id: "UtopiaExclusionEngine", name: "Utopia's Shadow", icon: "🌑", tagline: "Critique architect", desc: "Examines who this utopia might exclude, erase, or harm — the price of its perfection.", ph: "Describe the utopia and who it was designed for", ex: "e.g. A peaceful society that achieved harmony by removing everyone who couldn't adapt to its social norms", color: "#15803d" },
      { id: "UtopiaThreatsEngine", name: "Utopia Under Threat", icon: "⚠️", tagline: "Conflict architect", desc: "Designs the forces that threaten this utopia — from within and without.", ph: "What could destabilize or destroy this utopia?", ex: "e.g. A utopia that discovers an asteroid on a collision course — how does a society with no conflict experience crisis?", color: "#16a34a" },
    ],
  },
  {
    id: "ancientcivilization", title: "Ancient Civilization", icon: "🏛️", color: "#b45309",
    desc: "Historical and fantasy ancient civilization design — rise, peak, and fall.",
    engines: [
      { id: "CivilizationRiseEngine", name: "Civilization Rise", icon: "🌅", tagline: "Origin architect", desc: "Designs the geographic, ecological, and cultural conditions that gave rise to this civilization.", ph: "Where did this civilization emerge and what advantages did the location provide?", ex: "e.g. A civilization that emerged in a river delta at the meeting point of three distinct ecosystems", color: "#b45309" },
      { id: "AncientEconomyEngine", name: "Ancient Economy", icon: "💰", tagline: "Economy architect", desc: "Designs the economic foundation — what this civilization produced, traded, and valued.", ph: "What resources, technologies, and trade networks did this civilization control?", ex: "e.g. An ancient civilization whose entire economy was based on controlling the only inland sea crossing", color: "#92400e" },
      { id: "AncientTechnologyEngine", name: "Ancient Technology", icon: "⚙️", tagline: "Technology architect", desc: "Designs the technological achievements of this civilization and how they achieved them.", ph: "What technological achievements define this civilization?", ex: "e.g. An ancient civilization that mastered hydraulics but never discovered the wheel", color: "#b45309" },
      { id: "CivilizationDeclineEngine", name: "Civilization Fall", icon: "🌅", tagline: "Collapse architect", desc: "Designs the decline and fall of an ancient civilization — internal, external, and environmental causes.", ph: "What was this civilization at its peak and what began its decline?", ex: "e.g. A civilization that collapsed because its religion required destroying one city's infrastructure every generation", color: "#92400e" },
      { id: "AncientLegacyEngine", name: "Ancient Legacy", icon: "🗿", tagline: "Legacy architect", desc: "Designs what this civilization left behind — ruins, myths, knowledge, and influence on successors.", ph: "What did this civilization achieve and how is it remembered?", ex: "e.g. A civilization that vanished completely but whose mathematical system is the foundation of all later cultures", color: "#b45309" },
    ],
  },

  // ── Learning & Research ───────────────────────────────────────────────────
  {
    id: "researchassist", title: "Research Assistant", icon: "🔬", color: "#0369a1",
    desc: "Research methodology, literature review frameworks, and academic investigation support.",
    engines: [
      { id: "ResearchQuestionEngine", name: "Research Question Designer", icon: "❓", tagline: "Question architect", desc: "Designs focused, answerable research questions with scope, methodology alignment, and literature gap identification.", ph: "What topic are you researching and what do you want to understand?", ex: "e.g. I want to understand how remote work affects creative collaboration in software teams", color: "#0369a1" },
      { id: "LiteratureReviewEngine", name: "Literature Review Framework", icon: "📚", tagline: "Review architect", desc: "Designs literature review structures with search strategy, key themes, and synthesis approach.", ph: "What research question are you addressing and what field is it in?", ex: "e.g. A literature review on the effectiveness of mindfulness interventions in clinical depression treatment", color: "#0284c7" },
      { id: "MethodologyEngine", name: "Methodology Designer", icon: "🧪", tagline: "Method architect", desc: "Designs research methodologies — quantitative, qualitative, or mixed — with justified approach.", ph: "What is your research question and what resources do you have?", ex: "e.g. Studying how social media use correlates with political polarization in teenagers", color: "#0369a1" },
      { id: "FindingsSynthesisEngine", name: "Findings Synthesis", icon: "🔗", tagline: "Synthesis architect", desc: "Helps synthesize research findings into coherent insights with implications and limitations.", ph: "What did you find in your research and what patterns emerged?", ex: "e.g. My interviews revealed 4 distinct patterns — I need help seeing what they mean together", color: "#0284c7" },
      { id: "AbstractEngine", name: "Abstract Writer", icon: "📄", tagline: "Abstract craftsman", desc: "Writes academic abstracts with background, purpose, methods, results, and conclusions in 250 words.", ph: "Summarize your research study for me to write the abstract", ex: "e.g. A study of nurse burnout during COVID comparing hospitals with and without peer support programs", color: "#0369a1" },
    ],
  },
  {
    id: "conceptexplainer", title: "Concept Explainer", icon: "💡", color: "#7c3aed",
    desc: "Explain any concept clearly at any complexity level — from beginner to expert.",
    engines: [
      { id: "ELI5Engine", name: "ELI5 Explainer", icon: "👶", tagline: "Simplicity architect", desc: "Explains complex concepts as if to a 5-year-old — no jargon, only concrete analogies.", ph: "What concept do you want explained simply?", ex: "e.g. How inflation works and why it makes things cost more even if nothing changed", color: "#7c3aed" },
      { id: "AnalogiesEngine", name: "Analogy Generator", icon: "🔗", tagline: "Analogy architect", desc: "Creates 5 different analogies for the same concept using different domains to find what clicks.", ph: "What concept needs an analogy to make it clear?", ex: "e.g. How neural networks learn — finding analogies from cooking, sports, childhood, music, and nature", color: "#6d28d9" },
      { id: "ExpertExplainerEngine", name: "Expert-Level Explainer", icon: "🎓", tagline: "Depth architect", desc: "Explains concepts with full technical depth, nuance, and edge cases for expert audiences.", ph: "What concept should I explain at full technical depth?", ex: "e.g. How transformer attention mechanisms work, including multi-head attention and positional encoding", color: "#7c3aed" },
      { id: "ConceptMapEngine", name: "Concept Map Builder", icon: "🗺️", tagline: "Relationship architect", desc: "Maps how a concept connects to related ideas, prerequisites, and consequences.", ph: "What concept should I map in its broader intellectual landscape?", ex: "e.g. Map how evolutionary game theory connects to economics, psychology, and political science", color: "#6d28d9" },
      { id: "MisconceptionEngine", name: "Misconception Fixer", icon: "⚠️", tagline: "Clarity architect", desc: "Identifies and corrects common misconceptions about a topic with accurate replacements.", ph: "What topic has common misconceptions that need addressing?", ex: "e.g. What do people get wrong about how vaccines work and create immunity?", color: "#7c3aed" },
    ],
  },
  {
    id: "debateprep", title: "Debate Prep", icon: "🎤", color: "#dc2626",
    desc: "Argument construction, rebuttal preparation, logical analysis, and debate strategy.",
    engines: [
      { id: "ArgumentBuilderEngine", name: "Argument Builder", icon: "⚡", tagline: "Logic architect", desc: "Constructs the strongest possible argument for a position with premises, evidence, and reasoning.", ph: "What position do you need to argue and who are you arguing against?", ex: "e.g. Arguing that algorithmic hiring tools increase bias rather than reduce it", color: "#dc2626" },
      { id: "RebuttalEngine", name: "Rebuttal Strategist", icon: "🛡️", tagline: "Counter-attack architect", desc: "Anticipates opponent arguments and designs targeted rebuttals for each.", ph: "What position are you defending and what will opponents say?", ex: "e.g. Defending mandatory paid parental leave against business cost objections", color: "#b91c1c" },
      { id: "FallacyDetectorEngine", name: "Fallacy Detector", icon: "🔍", tagline: "Logic auditor", desc: "Identifies logical fallacies in arguments and explains how to exploit or fix them.", ph: "Describe or paste the argument you want analyzed for fallacies", ex: "e.g. 'Violent video games cause violence — crime increased the same year gaming became mainstream'", color: "#dc2626" },
      { id: "SocraticQuestionEngine", name: "Socratic Questions", icon: "🤔", tagline: "Question architect", desc: "Generates Socratic questions that expose hidden assumptions and weaken opponent positions.", ph: "What claim or position do you want to challenge Socratically?", ex: "e.g. A claim that free markets always produce optimal social outcomes", color: "#b91c1c" },
      { id: "DebateStrategyEngine", name: "Debate Strategy", icon: "♟️", tagline: "Strategy architect", desc: "Designs debate strategy — opening, middle, and closing — with psychological and rhetorical moves.", ph: "What is the debate topic, format, and your assigned position?", ex: "e.g. Oxford-style debate, arguing that universal basic income is harmful — 8-minute opening", color: "#dc2626" },
    ],
  },
  {
    id: "criticalthinking", title: "Critical Thinking Coach", icon: "🧩", color: "#0891b2",
    desc: "Logical analysis, cognitive bias identification, decision auditing, and reasoning improvement.",
    engines: [
      { id: "BiasAuditEngine", name: "Bias Audit", icon: "🔍", tagline: "Bias detector", desc: "Identifies cognitive biases affecting a decision, belief, or analysis and suggests debiasing strategies.", ph: "Describe the decision or belief you want to audit for bias", ex: "e.g. I keep hiring people from the same two universities and think they just work harder", color: "#0891b2" },
      { id: "AssumptionExposureEngine", name: "Assumption Exposure", icon: "👁️", tagline: "Assumption architect", desc: "Surfaces hidden assumptions in arguments, plans, and beliefs that are being treated as facts.", ph: "What argument, plan, or belief should I audit for hidden assumptions?", ex: "e.g. Our business plan assumes remote teams are less productive than in-person — is that an assumption?", color: "#0e7490" },
      { id: "SecondOrderEngine", name: "Second Order Thinking", icon: "♟️", tagline: "Consequence architect", desc: "Maps second and third-order consequences of decisions and actions.", ph: "What decision or action should I trace the downstream consequences of?", ex: "e.g. If we raise prices 30%, what happens? And what happens as a result of what happens?", color: "#0891b2" },
      { id: "PremortemEngine", name: "Pre-mortem Analysis", icon: "🔮", tagline: "Failure architect", desc: "Runs a pre-mortem on a plan — imagining it failed and working backwards to find the causes.", ph: "What plan or project should I run a pre-mortem on?", ex: "e.g. Our plan to launch a new product in a market we've never competed in, in 6 months", color: "#0e7490" },
      { id: "SteelManEngine", name: "Steel Man Builder", icon: "🛡️", tagline: "Empathy architect", desc: "Builds the strongest possible version of an opposing argument — better than the opponent would.", ph: "What position do you disagree with that should be steelmanned?", ex: "e.g. The argument that social media companies should face zero government regulation", color: "#0891b2" },
    ],
  },
  {
    id: "philosophyexplorer", title: "Philosophy Explorer", icon: "🦉", color: "#4f46e5",
    desc: "Philosophical traditions, ethical frameworks, thought experiments, and applied ethics.",
    engines: [
      { id: "EthicalFrameworkEngine", name: "Ethical Framework Analyzer", icon: "⚖️", tagline: "Ethics architect", desc: "Analyzes a moral question through consequentialist, deontological, virtue, and care ethics frameworks.", ph: "What ethical dilemma or question should I analyze?", ex: "e.g. Is it ethical to use AI to predict which employees will quit and preemptively lay them off?", color: "#4f46e5" },
      { id: "ThoughtExperimentEngine", name: "Thought Experiment Designer", icon: "🧪", tagline: "Experiment architect", desc: "Designs philosophical thought experiments that reveal intuitions and test moral principles.", ph: "What moral principle or intuition do you want to test?", ex: "e.g. Design a thought experiment that tests whether the value of a life can be quantified", color: "#3730a3" },
      { id: "PhilosophyHistoryEngine", name: "Philosophy History", icon: "📜", tagline: "Tradition architect", desc: "Traces the history of a philosophical question from ancient to contemporary thinkers.", ph: "What philosophical question or concept should I trace through history?", ex: "e.g. How have philosophers understood personal identity from Locke through to Parfit and Dennett?", color: "#4f46e5" },
      { id: "AppliedEthicsEngine", name: "Applied Ethics", icon: "🏥", tagline: "Application architect", desc: "Applies philosophical ethics to real-world professional dilemmas — medical, legal, business, tech.", ph: "What real-world ethical dilemma needs philosophical analysis?", ex: "e.g. A doctor who can save 10 patients using resources that would save one specific patient they know personally", color: "#3730a3" },
      { id: "SocraticDialogueEngine", name: "Socratic Dialogue", icon: "💬", tagline: "Dialogue architect", desc: "Designs Socratic dialogues that explore a philosophical question through question and answer.", ph: "What question or belief should the Socratic dialogue explore?", ex: "e.g. A dialogue about whether justice is the same thing as what the powerful decide", color: "#4f46e5" },
    ],
  },
  {
    id: "studyplanner", title: "Study Planner", icon: "📖", color: "#16a34a",
    desc: "Study schedules, spaced repetition, exam prep, and learning roadmaps.",
    engines: [
      { id: "StudyScheduleEngine", name: "Study Schedule Builder", icon: "📅", tagline: "Schedule architect", desc: "Builds realistic study schedules with time blocks, subjects, and review cycles.", ph: "What are you studying, when is your exam/goal, and how many hours per day can you study?", ex: "e.g. MCAT in 4 months, 4 hours a day available, weak in biochemistry and psychology", color: "#16a34a" },
      { id: "SpacedRepetitionEngine", name: "Spaced Repetition Planner", icon: "🔄", tagline: "Memory architect", desc: "Designs spaced repetition review schedules using evidence-based intervals for any subject.", ph: "What material needs to be memorized and how long until the test?", ex: "e.g. 400 anatomy terms for a practical exam in 6 weeks", color: "#15803d" },
      { id: "ActiveRecallEngine", name: "Active Recall Designer", icon: "❓", tagline: "Recall architect", desc: "Transforms passive notes into active recall questions, flashcard fronts, and self-testing prompts.", ph: "What notes or topic should I convert to active recall format?", ex: "e.g. The key concepts of cognitive behavioral therapy for a psychology exam", color: "#16a34a" },
      { id: "WeakSpotEngine", name: "Weak Spot Identifier", icon: "🎯", tagline: "Gap detector", desc: "Identifies knowledge gaps from performance data and designs targeted remediation plans.", ph: "What subject are you studying and where are you struggling?", ex: "e.g. I keep getting organic chemistry reaction mechanisms wrong — I understand the theory but fail the problems", color: "#15803d" },
      { id: "ExamStrategyEngine", name: "Exam Strategy", icon: "✅", tagline: "Strategy architect", desc: "Designs exam strategies — time allocation, question ordering, and pressure management.", ph: "What exam are you taking and how is it structured?", ex: "e.g. A 4-hour bar exam with 200 multiple choice in the morning and essays in the afternoon", color: "#16a34a" },
    ],
  },
  {
    id: "scienceexplainer", title: "Science Explainer", icon: "🔭", color: "#0369a1",
    desc: "Scientific concepts, experiments, discoveries, and the history of science.",
    engines: [
      { id: "ConceptExplainEngine", name: "Science Concept Explainer", icon: "💡", tagline: "Clarity architect", desc: "Explains scientific concepts with accuracy, clarity, and appropriate depth for any audience.", ph: "What scientific concept needs a clear explanation?", ex: "e.g. How CRISPR gene editing works and why it's considered both revolutionary and dangerous", color: "#0369a1" },
      { id: "ExperimentDesignEngine", name: "Experiment Designer", icon: "🧪", tagline: "Method architect", desc: "Designs scientific experiments with hypothesis, controls, variables, and interpretation.", ph: "What scientific question should I design an experiment to test?", ex: "e.g. Designing an experiment to test whether plants grow faster with music in the room", color: "#0284c7" },
      { id: "ScienceHistoryEngine", name: "Science History", icon: "📜", tagline: "History architect", desc: "Traces the history of a scientific discovery — who found it, how, and what resistance it faced.", ph: "What scientific discovery or revolution should I trace historically?", ex: "e.g. The history of germ theory — from Pasteur and Lister to the resistance they faced from the medical establishment", color: "#0369a1" },
      { id: "ScientificDebateEngine", name: "Scientific Debate", icon: "⚖️", tagline: "Debate architect", desc: "Maps current scientific debates — what is consensus, what is contested, and why.", ph: "What scientific question has active debate or multiple schools of thought?", ex: "e.g. The debate about whether dark matter exists or whether MOND theory is correct", color: "#0284c7" },
      { id: "ScienceFictionScienceEngine", name: "Science in Fiction", icon: "🚀", tagline: "Reality-checker", desc: "Analyzes the science in science fiction — what's accurate, what's plausible, and what's impossible.", ph: "What sci-fi concept, technology, or scenario should I analyze scientifically?", ex: "e.g. How realistic is the terraforming of Mars as depicted in The Martian?", color: "#0369a1" },
    ],
  },
  {
    id: "mathsolver", title: "Math Solver", icon: "🔢", color: "#7c3aed",
    desc: "Mathematical problem solving, proof construction, and mathematical intuition building.",
    engines: [
      { id: "ProblemSolvingEngine", name: "Problem Solver", icon: "✏️", tagline: "Solution architect", desc: "Solves mathematical problems step-by-step with full explanation of each step's reasoning.", ph: "What mathematical problem do you need solved?", ex: "e.g. Find all prime factors of 2,310 and explain why the method works", color: "#7c3aed" },
      { id: "ConceptIntuitionEngine", name: "Mathematical Intuition", icon: "💡", tagline: "Intuition builder", desc: "Builds mathematical intuition for abstract concepts using visual, geometric, and concrete explanations.", ph: "What mathematical concept feels abstract and needs intuitive grounding?", ex: "e.g. Why does imaginary number i make sense and what does it actually mean geometrically?", color: "#6d28d9" },
      { id: "ProofConstructionEngine", name: "Proof Constructor", icon: "📐", tagline: "Proof architect", desc: "Constructs mathematical proofs with clear logical steps, justified transitions, and conclusion.", ph: "What theorem or statement needs to be proved?", ex: "e.g. Prove that the square root of 2 is irrational using proof by contradiction", color: "#7c3aed" },
      { id: "MathHistoryEngine", name: "Math History", icon: "📜", tagline: "History architect", desc: "Traces the history of mathematical ideas — who discovered them, the context, and why they mattered.", ph: "What mathematical concept or branch should I trace historically?", ex: "e.g. The history of the concept of zero and what civilizations had it before others", color: "#6d28d9" },
      { id: "ApplicationMathEngine", name: "Real-World Application", icon: "🌍", tagline: "Application architect", desc: "Shows where a mathematical concept appears in the real world and why it matters practically.", ph: "What mathematical concept should I trace through real-world applications?", ex: "e.g. Where does linear algebra appear in machine learning, physics, and economics?", color: "#7c3aed" },
    ],
  },

  // ── Lifestyle & Personal ──────────────────────────────────────────────────
  {
    id: "journal", title: "Journal Studio", icon: "📔", color: "#be185d",
    desc: "Guided journaling, self-reflection prompts, emotional processing, and life writing.",
    engines: [
      { id: "ReflectionPromptEngine", name: "Reflection Prompts", icon: "🪞", tagline: "Depth architect", desc: "Generates deep, specific journaling prompts that move beyond surface to genuine insight.", ph: "What area of your life do you want to reflect on?", ex: "e.g. A relationship that ended and I haven't fully processed it yet", color: "#be185d" },
      { id: "GratitudePracticeEngine", name: "Gratitude Practice Designer", icon: "🌟", tagline: "Gratitude architect", desc: "Designs personalized gratitude practices that go beyond listing to genuine appreciation.", ph: "What is your current life context and what are you grateful for?", ex: "e.g. A difficult period where things are genuinely hard but I want to find what's still good", color: "#9d174d" },
      { id: "EmotionProcessEngine", name: "Emotion Processing Guide", icon: "💙", tagline: "Emotion architect", desc: "Guides structured emotional processing for difficult experiences — naming, understanding, integrating.", ph: "What emotion or experience needs processing?", ex: "e.g. Anger at someone I love that feels disproportionate and I don't understand why", color: "#be185d" },
      { id: "LifeReviewEngine", name: "Life Review Journaling", icon: "🌅", tagline: "Story architect", desc: "Guides a structured life review — chapters, themes, turning points, and the story you're telling yourself.", ph: "What period of your life should we review and understand?", ex: "e.g. My twenties — I want to understand what shaped me and what I was trying to figure out", color: "#9d174d" },
      { id: "IntentionSettingEngine", name: "Intention Setting", icon: "🎯", tagline: "Direction architect", desc: "Designs meaningful intentions — not resolutions — rooted in values and expressed as qualities.", ph: "What period are you setting intentions for and what matters to you right now?", ex: "e.g. Starting a new year after one that was defined by loss and needing to find forward motion", color: "#be185d" },
    ],
  },
  {
    id: "goalplanner", title: "Goal Planner", icon: "🎯", color: "#d97706",
    desc: "SMART goals, OKRs, milestone planning, accountability systems, and progress tracking.",
    engines: [
      { id: "GoalClarificationEngine", name: "Goal Clarifier", icon: "🔍", tagline: "Clarity architect", desc: "Transforms vague wishes into specific, measurable, time-bound goals with clear success criteria.", ph: "What do you want to achieve and why does it matter to you?", ex: "e.g. I want to get healthier but I don't know what that means or how to measure it", color: "#d97706" },
      { id: "MilestoneBreakdownEngine", name: "Milestone Breakdown", icon: "📋", tagline: "Path architect", desc: "Breaks big goals into concrete milestones with deadlines, dependencies, and early wins.", ph: "What is your goal and what is your timeline?", ex: "e.g. Write and publish my first book within 18 months while working full time", color: "#b45309" },
      { id: "ObstacleAnticipationEngine", name: "Obstacle Anticipator", icon: "🚧", tagline: "Resilience architect", desc: "Identifies likely obstacles and designs specific pre-committed responses before they occur.", ph: "What is your goal and what has gotten in the way of similar goals before?", ex: "e.g. I want to exercise 4x a week but always stop when work gets busy", color: "#d97706" },
      { id: "AccountabilitySystemEngine", name: "Accountability System", icon: "📊", tagline: "System architect", desc: "Designs a personalized accountability system — check-ins, metrics, consequences, and support.", ph: "What goal do you need accountability for and what kind of accountability works for you?", ex: "e.g. I'm saving $30K for a house in 2 years but I need external structure or I spend the money", color: "#b45309" },
      { id: "ReviewReflectEngine", name: "Goal Review System", icon: "🔄", tagline: "Review architect", desc: "Designs weekly and monthly goal review rituals that maintain momentum without overwhelm.", ph: "What goals are you tracking and how much time can you spend on weekly review?", ex: "e.g. 5 active goals across health, career, finance, and relationships — 30 minutes per week max", color: "#d97706" },
    ],
  },
  {
    id: "travelplanner", title: "Travel Planner", icon: "✈️", color: "#0891b2",
    desc: "Trip planning, itineraries, travel writing, cultural guides, and adventure design.",
    engines: [
      { id: "ItineraryEngine", name: "Itinerary Designer", icon: "🗺️", tagline: "Journey architect", desc: "Designs day-by-day trip itineraries with timing, activities, transitions, and local context.", ph: "Where are you going, how long is the trip, and what are your interests?", ex: "e.g. 10 days in Japan for the first time — interested in food, architecture, nature, and avoiding tourist traps", color: "#0891b2" },
      { id: "CulturalContextEngine", name: "Cultural Context Guide", icon: "🌏", tagline: "Culture architect", desc: "Provides deep cultural context — customs, etiquette, history, and how to engage respectfully.", ph: "What country or culture are you visiting?", ex: "e.g. First trip to Morocco — what are the essential cultural norms I need to understand?", color: "#0e7490" },
      { id: "TravelWritingEngine", name: "Travel Writing", icon: "✍️", tagline: "Travel writer", desc: "Transforms travel experiences into evocative travel writing — for blog, memoir, or personal record.", ph: "Describe the place or experience you want to write about", ex: "e.g. A small fishing village in Portugal I visited on a grey morning in November", color: "#0891b2" },
      { id: "PackingListEngine", name: "Packing List Designer", icon: "🧳", tagline: "Packing architect", desc: "Designs destination-specific packing lists optimized for activities, climate, and bag size.", ph: "Where are you going, for how long, what activities, and what bag size?", ex: "e.g. 3 weeks in Southeast Asia — hiking, temples, beaches, and budget hostels with a 40L backpack", color: "#0e7490" },
      { id: "HiddenGemEngine", name: "Hidden Gem Finder", icon: "💎", tagline: "Discovery architect", desc: "Identifies off-the-beaten-path experiences in any destination — what locals do but tourists miss.", ph: "What destination are you visiting and what kind of experience are you looking for?", ex: "e.g. I'm spending 5 days in Barcelona and don't want to do anything in every tourist guide", color: "#0891b2" },
    ],
  },
  {
    id: "recipecreator", title: "Recipe Creator", icon: "👨‍🍳", color: "#ef4444",
    desc: "Recipe design, meal planning, cuisine exploration, and culinary storytelling.",
    engines: [
      { id: "RecipeDesignEngine", name: "Recipe Designer", icon: "🍳", tagline: "Dish architect", desc: "Designs original recipes with ingredient rationale, technique explanation, and variation options.", ph: "What dish, cuisine, or constraint should I design a recipe around?", ex: "e.g. A plant-based version of a traditional Portuguese bacalhau dish that doesn't feel like a compromise", color: "#ef4444" },
      { id: "FlavorPairingEngine", name: "Flavor Pairing", icon: "🎨", tagline: "Flavor architect", desc: "Identifies unexpected flavor pairings with scientific explanation and recipe applications.", ph: "What ingredients or flavors do you want to combine or build around?", ex: "e.g. Miso, dark chocolate, and citrus — is there a dessert or sauce that can marry these?", color: "#dc2626" },
      { id: "MealPlanEngine", name: "Meal Plan Designer", icon: "📅", tagline: "Nutrition architect", desc: "Designs weekly meal plans with nutritional balance, variety, prep efficiency, and shopping optimization.", ph: "What dietary needs, preferences, and cooking time do you have?", ex: "e.g. 4 adults including one vegan, 45 minutes max per dinner, focused on Mediterranean flavors", color: "#ef4444" },
      { id: "CuisineExplorerEngine", name: "Cuisine Explorer", icon: "🌍", tagline: "Culture-on-plate architect", desc: "Deep-dives into any cuisine's history, techniques, key ingredients, and essential dishes.", ph: "What cuisine do you want to explore and understand deeply?", ex: "e.g. Georgian cuisine — I've never cooked it but heard it's remarkable", color: "#dc2626" },
      { id: "SubstitutionEngine", name: "Ingredient Substitution", icon: "🔄", tagline: "Adaptation architect", desc: "Finds intelligent ingredient substitutions for dietary restrictions, allergies, or availability.", ph: "What ingredient needs substituting and what is it being used for in the recipe?", ex: "e.g. I need to substitute eggs in a carbonara that remains creamy and rich", color: "#ef4444" },
    ],
  },
  {
    id: "fitnesscoach", title: "Fitness Coach", icon: "💪", color: "#16a34a",
    desc: "Workout plans, training programs, sports performance, and movement coaching.",
    engines: [
      { id: "WorkoutPlanEngine", name: "Workout Plan Designer", icon: "🏋️", tagline: "Training architect", desc: "Designs personalized workout programs with exercises, sets, reps, progression, and rest protocols.", ph: "What are your fitness goals, experience level, and available equipment?", ex: "e.g. I want to build muscle and lose fat, train 4x per week, have access to a full gym", color: "#16a34a" },
      { id: "MovementAssessmentEngine", name: "Movement Assessment", icon: "🔍", tagline: "Movement architect", desc: "Assesses movement patterns and designs corrective exercise protocols for common dysfunctions.", ph: "What movement limitations, pain, or imbalances are you experiencing?", ex: "e.g. My lower back hurts when squatting and I have a desk job — what's likely causing this?", color: "#15803d" },
      { id: "SportsPerformanceEngine", name: "Sports Performance", icon: "⚡", tagline: "Performance architect", desc: "Designs sport-specific training to improve performance in your chosen sport.", ph: "What sport are you training for and what are your performance goals?", ex: "e.g. Competitive tennis — I need to improve my first-step speed and staying power in long matches", color: "#16a34a" },
      { id: "RecoveryProtocolEngine", name: "Recovery Protocol", icon: "🌙", tagline: "Recovery architect", desc: "Designs recovery protocols — sleep, nutrition timing, active recovery, and load management.", ph: "What is your training intensity and what recovery strategies do you currently use?", ex: "e.g. Training 6 days a week for a marathon — I'm always sore and my times are getting worse", color: "#15803d" },
      { id: "NutritionTimingEngine", name: "Nutrition Timing", icon: "🥗", tagline: "Fueling architect", desc: "Designs pre/intra/post workout nutrition strategies aligned with training goals.", ph: "What are your training goals and what does your current nutrition look like?", ex: "e.g. Early morning lifting sessions 5x per week trying to gain 10 pounds of muscle", color: "#16a34a" },
    ],
  },
  {
    id: "meditationguide", title: "Meditation Guide", icon: "🧘", color: "#6366f1",
    desc: "Meditation scripts, mindfulness practices, breathwork, and contemplative exercises.",
    engines: [
      { id: "GuidedMeditationEngine", name: "Guided Meditation Script", icon: "🎙️", tagline: "Presence architect", desc: "Writes guided meditation scripts for any length, intention, and experience level.", ph: "What is the meditation's purpose and how long should it be?", ex: "e.g. A 10-minute anxiety relief meditation for someone who has never meditated before", color: "#6366f1" },
      { id: "BreathworkEngine", name: "Breathwork Protocol", icon: "💨", tagline: "Breath architect", desc: "Designs evidence-based breathwork protocols for specific goals — calm, energy, focus, or sleep.", ph: "What is the goal of this breathwork practice?", ex: "e.g. A breathwork protocol to use before a high-stakes presentation", color: "#4f46e5" },
      { id: "BodyScanEngine", name: "Body Scan Script", icon: "🧬", tagline: "Soma architect", desc: "Writes detailed body scan meditation scripts for stress relief and somatic awareness.", ph: "What is the context and how long should the body scan be?", ex: "e.g. A 15-minute body scan for people recovering from chronic pain", color: "#6366f1" },
      { id: "LovingKindnessEngine", name: "Loving-Kindness Script", icon: "💙", tagline: "Compassion architect", desc: "Writes loving-kindness (metta) meditation scripts in traditional and contemporary forms.", ph: "Who should the practice focus on and what is the practitioner's situation?", ex: "e.g. A loving-kindness meditation for someone struggling to forgive a family member", color: "#4f46e5" },
      { id: "MindfulnessPracticeEngine", name: "Mindfulness Practice", icon: "🌸", tagline: "Presence architect", desc: "Designs daily mindfulness practices embedded in ordinary activities — not requiring separate meditation time.", ph: "What is the person's daily routine and what moments could become mindfulness practices?", ex: "e.g. A busy parent with two children who has 0 minutes for formal practice", color: "#6366f1" },
    ],
  },
  {
    id: "financeadvisor", title: "Finance Advisor", icon: "📈", color: "#16a34a",
    desc: "Personal finance planning, investment education, budgeting, and financial goal mapping.",
    engines: [
      { id: "BudgetDesignEngine", name: "Budget Designer", icon: "💰", tagline: "Budget architect", desc: "Designs personalized budget frameworks with categories, allocations, and adjustment strategies.", ph: "What is your income, fixed expenses, and financial goals?", ex: "e.g. $85K income, $2,400 rent, $400 student loans — trying to save for a house in 4 years", color: "#16a34a" },
      { id: "DebtStrategyEngine", name: "Debt Strategy", icon: "🔗", tagline: "Debt architect", desc: "Designs debt payoff strategies — avalanche, snowball, or hybrid — with timeline and interest savings.", ph: "What debts do you have, their rates, and minimum payments?", ex: "e.g. $22K credit card at 24%, $15K student loan at 6%, $8K car loan at 5%", color: "#15803d" },
      { id: "InvestingFoundationsEngine", name: "Investing Foundations", icon: "📊", tagline: "Investment architect", desc: "Explains investing fundamentals clearly — compound interest, asset allocation, index funds, risk.", ph: "What aspect of investing do you want to understand?", ex: "e.g. I'm 28, just started a job with a 401k, and have no idea what to do with it", color: "#16a34a" },
      { id: "FinancialGoalMapEngine", name: "Financial Goal Map", icon: "🗺️", tagline: "Goal architect", desc: "Maps 1-year, 5-year, and 10-year financial goals with milestone targets and required savings rates.", ph: "What are your financial goals and current situation?", ex: "e.g. Buy a home in 5 years, retire at 55, and fund my child's education — 34 years old, $60K income", color: "#15803d" },
      { id: "InsurancePlanningEngine", name: "Insurance Planning", icon: "🛡️", tagline: "Protection architect", desc: "Guides insurance coverage decisions — life, disability, health, and property — for your situation.", ph: "What is your life situation and what coverages are you uncertain about?", ex: "e.g. Just had a baby, have a mortgage, self-employed with no employer benefits", color: "#16a34a" },
    ],
  },
  {
    id: "relationshipcoach", title: "Relationship Coach", icon: "💑", color: "#be185d",
    desc: "Relationship communication, conflict resolution, boundary setting, and connection building.",
    engines: [
      { id: "CommunicationStrategyEngine", name: "Communication Strategy", icon: "💬", tagline: "Communication architect", desc: "Designs communication strategies for difficult conversations — what to say, when, and how.", ph: "What conversation do you need to have and what is the relationship?", ex: "e.g. I need to tell my partner I'm not happy with how we've been dividing household work", color: "#be185d" },
      { id: "ConflictResolutionEngine", name: "Conflict Resolution", icon: "🕊️", tagline: "Peace architect", desc: "Designs conflict resolution approaches with de-escalation, understanding, and agreement strategies.", ph: "What is the conflict and what do both parties want?", ex: "e.g. My co-founder and I disagree on strategy and it's affecting our working relationship", color: "#9d174d" },
      { id: "BoundarySettingEngine", name: "Boundary Setting", icon: "🚧", tagline: "Boundary architect", desc: "Helps design and articulate personal boundaries clearly — without guilt, aggression, or over-explanation.", ph: "What boundary do you need to set and with whom?", ex: "e.g. My mother calls me multiple times a day and I need to establish limits without hurting her", color: "#be185d" },
      { id: "ConnectionRitualEngine", name: "Connection Ritual Designer", icon: "🔥", tagline: "Connection architect", desc: "Designs rituals and practices that maintain and deepen connection in relationships.", ph: "What type of relationship and what is the current connection quality?", ex: "e.g. A long-distance friendship that's drifting apart because we never have time to talk", color: "#9d174d" },
      { id: "ApologyEngine", name: "Genuine Apology", icon: "🙏", tagline: "Repair architect", desc: "Helps craft genuine, complete apologies that take responsibility without deflection.", ph: "What happened, what is your role, and what do you want to repair?", ex: "e.g. I broke a promise to a close friend and it damaged their trust in me", color: "#be185d" },
    ],
  },

  // ── Music & Audio ─────────────────────────────────────────────────────────
  {
    id: "lyricswriter", title: "Lyrics Writer", icon: "🎵", color: "#7c3aed",
    desc: "Song lyrics, rhyme schemes, verse/chorus structures, and lyrical storytelling.",
    engines: [
      { id: "ChorusEngine", name: "Chorus Designer", icon: "🎤", tagline: "Hook architect", desc: "Writes memorable choruses with strong hooks, repetition, emotional climax, and singability.", ph: "What is the song's theme and emotional core?", ex: "e.g. A pop chorus about the specific loneliness of being surrounded by people who don't know you", color: "#7c3aed" },
      { id: "VerseEngine", name: "Verse Writer", icon: "📝", tagline: "Narrative architect", desc: "Writes verses that tell the story, establish character, and build to the chorus.", ph: "What story or scene should the verse portray?", ex: "e.g. An R&B verse describing the exact moment you realize a relationship is already over", color: "#6d28d9" },
      { id: "RhymeSchemeEngine", name: "Rhyme Scheme Designer", icon: "🔤", tagline: "Sound architect", desc: "Designs and executes specific rhyme schemes — perfect, slant, internal — for any lyrical section.", ph: "What lyrical content needs a rhyme scheme designed?", ex: "e.g. I need ABAB perfect rhyme for a verse about leaving home for the first time", color: "#7c3aed" },
      { id: "BridgeEngine", name: "Bridge Builder", icon: "🌉", tagline: "Bridge architect", desc: "Writes song bridges that provide emotional contrast and lyrical resolution before the final chorus.", ph: "What shift or revelation should the bridge provide?", ex: "e.g. A bridge that shifts from anger to grief — realizing the anger was covering the sadness", color: "#6d28d9" },
      { id: "LyricalMetaphorEngine", name: "Lyrical Metaphor", icon: "🌊", tagline: "Metaphor architect", desc: "Develops extended metaphors that can carry an entire song's emotional weight.", ph: "What emotion or experience needs a metaphorical vehicle for this song?", ex: "e.g. Feeling trapped in a life that looks perfect from the outside — find me a metaphor", color: "#7c3aed" },
    ],
  },
  {
    id: "songstructure", title: "Song Structure Studio", icon: "🎼", color: "#0891b2",
    desc: "Song arrangement, composition structure, genre conventions, and musical architecture.",
    engines: [
      { id: "SongArrangementEngine", name: "Song Arrangement", icon: "🎸", tagline: "Arrangement architect", desc: "Designs full song arrangements — intro, verse, pre-chorus, chorus, bridge, outro with timing.", ph: "What genre and emotional arc should this song have?", ex: "e.g. An indie folk song that starts intimate and builds to an anthemic finale in 3.5 minutes", color: "#0891b2" },
      { id: "GenreConventionsEngine", name: "Genre Conventions", icon: "🎵", tagline: "Genre architect", desc: "Maps the conventions, expectations, and signature elements of any music genre.", ph: "What genre are you composing in and what aspects do you need to understand?", ex: "e.g. K-pop structure — what makes it distinctive and what do listeners expect?", color: "#0e7490" },
      { id: "HookCraftEngine", name: "Hook Crafter", icon: "🎣", tagline: "Hook architect", desc: "Designs melodic and rhythmic hooks — the part that sticks in your head after one listen.", ph: "What is the song's title and emotional center?", ex: "e.g. A song called 'Almost' about a relationship that was perfect except for the timing", color: "#0891b2" },
      { id: "LyricalThemeEngine", name: "Lyrical Theme Development", icon: "🌊", tagline: "Theme architect", desc: "Develops a song's lyrical theme across all sections for consistency and emotional progression.", ph: "What is the song's central theme and emotional journey?", ex: "e.g. A concept album track about climate grief — helplessness turning to stubborn hope", color: "#0e7490" },
      { id: "ProductionNotesEngine", name: "Production Notes", icon: "🎚️", tagline: "Production guide", desc: "Writes production notes describing the sonic palette, instrumentation, and arrangement choices.", ph: "What emotional effect should the production create?", ex: "e.g. Production notes for a hip-hop track about generational trauma that should feel like inherited memory", color: "#0891b2" },
    ],
  },
  {
    id: "podcastplanner", title: "Podcast Planner", icon: "🎙️", color: "#d97706",
    desc: "Podcast episodes, show notes, interview guides, and content strategy.",
    engines: [
      { id: "EpisodeOutlineEngine", name: "Episode Outline", icon: "📋", tagline: "Episode architect", desc: "Designs episode outlines with intro hook, segment structure, key points, and outro call to action.", ph: "What is the episode topic and who is the target listener?", ex: "e.g. An episode on why creators burn out and what the psychology behind it actually is", color: "#d97706" },
      { id: "ShowNotesEngine", name: "Show Notes Writer", icon: "📝", tagline: "Notes architect", desc: "Writes compelling show notes with summary, timestamps, key takeaways, and resource links.", ph: "Summarize the episode content for me to write the show notes", ex: "e.g. Episode where we discussed why most productivity advice fails and 3 evidence-based alternatives", color: "#b45309" },
      { id: "InterviewGuideEngine", name: "Interview Guide", icon: "❓", tagline: "Conversation architect", desc: "Designs interview question guides — opening, deepening, provocative, and closing questions.", ph: "Who is the guest and what is the interview focus?", ex: "e.g. Interviewing an ER doctor about what the pandemic permanently changed in their worldview", color: "#d97706" },
      { id: "PodcastSeriesEngine", name: "Series Planner", icon: "📚", tagline: "Series architect", desc: "Plans multi-episode series with themes, episode order, and narrative arc.", ph: "What is the series topic and how many episodes?", ex: "e.g. A 6-episode series on the science of friendship — from formation to maintenance to loss", color: "#b45309" },
      { id: "PodcastGrowthEngine", name: "Podcast Growth Strategy", icon: "📈", tagline: "Growth architect", desc: "Designs podcast growth strategies — audience building, distribution, monetization, and partnerships.", ph: "What is your podcast, current audience size, and growth goal?", ex: "e.g. A 50-episode business podcast with 800 listeners looking to reach 5,000 in 12 months", color: "#d97706" },
    ],
  },
  {
    id: "musictheory", title: "Music Theory Studio", icon: "🎶", color: "#4f46e5",
    desc: "Music theory exploration, harmony, counterpoint, composition principles, and ear training.",
    engines: [
      { id: "HarmonyEngine", name: "Harmony Explainer", icon: "🎹", tagline: "Harmony architect", desc: "Explains harmonic concepts — chord progressions, voice leading, tensions, and resolutions.", ph: "What harmonic concept do you want to understand or apply?", ex: "e.g. Why the IV-V-I progression feels satisfying and how to make it feel less predictable", color: "#4f46e5" },
      { id: "ModeEngine", name: "Modes & Scales", icon: "🎵", tagline: "Scale architect", desc: "Explains the emotional character, use, and composition applications of modes and exotic scales.", ph: "What mode, scale, or tonal system do you want to explore?", ex: "e.g. The Dorian mode — what makes it feel different from minor and when should I use it?", color: "#3730a3" },
      { id: "CounterpointEngine", name: "Counterpoint", icon: "🎼", tagline: "Counterpoint architect", desc: "Explains and applies counterpoint principles — voice independence, species counterpoint, and fugue.", ph: "What aspect of counterpoint do you want to understand or practice?", ex: "e.g. First species counterpoint — the rules and the musical reasoning behind each rule", color: "#4f46e5" },
      { id: "RhythmEngine", name: "Rhythm & Meter", icon: "🥁", tagline: "Rhythm architect", desc: "Explores rhythm, meter, polyrhythm, and syncopation — how rhythm creates feel and energy.", ph: "What rhythmic concept do you want to understand or apply?", ex: "e.g. How do jazz and Afrobeat use polyrhythm differently?", color: "#3730a3" },
      { id: "FormAnalysisEngine", name: "Musical Form Analysis", icon: "🏛️", tagline: "Form architect", desc: "Analyzes musical forms — sonata, rondo, theme and variations, 12-bar blues — and their logic.", ph: "What musical form do you want to understand or apply in composition?", ex: "e.g. Sonata form — what are all the sections and what is each one's structural purpose?", color: "#4f46e5" },
    ],
  },
  {
    id: "sounddesigner", title: "Sound Designer", icon: "🔊", color: "#0f766e",
    desc: "Sound design, audio world building, foley, and sonic identity systems.",
    engines: [
      { id: "FoleyEngine", name: "Foley Designer", icon: "🎭", tagline: "Sound architect", desc: "Designs foley sound descriptions and recording approaches for film and media.", ph: "What scene or sequence needs foley sound design?", ex: "e.g. A tense scene in a hospital corridor where silence is louder than the sounds", color: "#0f766e" },
      { id: "SonicIdentityEngine", name: "Sonic Identity", icon: "🎵", tagline: "Brand sound architect", desc: "Designs brand sonic identities — earcons, audio logos, and sound personality systems.", ph: "What brand needs a sonic identity and what are its values?", ex: "e.g. A mental health platform that needs to sound calm, trustworthy, and not clinical", color: "#0d9488" },
      { id: "EnvironmentSoundEngine", name: "Sound Environment", icon: "🌿", tagline: "Environment architect", desc: "Designs the complete audio environment of a scene or space — background, texture, and detail.", ph: "What environment needs a complete audio design?", ex: "e.g. A floating city market at dusk, with merchants packing up and the hum of antigravity engines", color: "#0f766e" },
      { id: "SoundSymbolismEngine", name: "Sound Symbolism", icon: "🔤", tagline: "Sound-meaning architect", desc: "Explores how sounds carry meaning — phonaesthesia, earworms, and emotional sound design.", ph: "What meaning or emotion should this sound design evoke?", ex: "e.g. A villain's leitmotif that should feel threatening but also strangely beautiful", color: "#0d9488" },
      { id: "MusicForFilmEngine", name: "Music Supervision", icon: "🎬", tagline: "Music supervisor", desc: "Designs music supervision approaches — scoring philosophy, song placement, and emotional pacing.", ph: "What film or scene needs music supervision guidance?", ex: "e.g. A coming-of-age film set in 1994 that should use period music purposefully, not just nostalgically", color: "#0f766e" },
    ],
  },

  // ── Game Design ───────────────────────────────────────────────────────────
  {
    id: "questdesigner", title: "Quest Designer", icon: "⚔️", color: "#dc2626",
    desc: "Quest and mission design, narrative objectives, rewards, and player motivation.",
    engines: [
      { id: "MainQuestEngine", name: "Main Quest Designer", icon: "⚔️", tagline: "Epic architect", desc: "Designs main story quest lines with narrative beats, player choices, and branching consequences.", ph: "What is the game's story and what is the main quest about?", ex: "e.g. Main quest for an RPG where the hero discovers they were created to destroy the world they're trying to save", color: "#dc2626" },
      { id: "SideQuestEngine", name: "Side Quest Designer", icon: "🗺️", tagline: "Side story architect", desc: "Designs compelling side quests with meaningful stories, unexpected twists, and memorable characters.", ph: "What world and tone does this side quest inhabit?", ex: "e.g. A side quest in a dark fantasy game involving an old lighthouse keeper who may have caused a shipwreck", color: "#b91c1c" },
      { id: "QuestObjectiveEngine", name: "Quest Objective Designer", icon: "🎯", tagline: "Objective architect", desc: "Designs diverse quest objectives beyond 'kill X' or 'fetch Y' — with player agency and emergent possibility.", ph: "What gameplay systems does your game have?", ex: "e.g. A stealth RPG where I want objectives that can be solved with violence, diplomacy, or deception", color: "#dc2626" },
      { id: "RewardSystemEngine", name: "Reward System Designer", icon: "🏆", tagline: "Reward architect", desc: "Designs intrinsic and extrinsic reward systems that maintain motivation and avoid feeling grindy.", ph: "What type of game and player motivation are you designing for?", ex: "e.g. An open-world RPG where I want players to feel rewarded without making money meaningless", color: "#b91c1c" },
      { id: "FailureStateEngine", name: "Failure State Designer", icon: "💀", tagline: "Failure architect", desc: "Designs meaningful failure states that teach, motivate, and don't frustrate.", ph: "What is the game type and what should failure feel like?", ex: "e.g. A strategy game where losing a campaign should feel tragic but also fair and instructive", color: "#dc2626" },
    ],
  },
  {
    id: "npccreator", title: "NPC Creator", icon: "🎭", color: "#7c3aed",
    desc: "Non-player character creation — personality, motivation, dialogue, and behavior design.",
    engines: [
      { id: "NPCPersonalityEngine", name: "NPC Personality", icon: "🧠", tagline: "Character architect", desc: "Designs NPC personalities with traits, quirks, voice, and behavioral patterns.", ph: "What role does this NPC play in the world and story?", ex: "e.g. A shopkeeper who has been in the same village for 50 years and has watched three wars pass through", color: "#7c3aed" },
      { id: "NPCDialogueEngine", name: "NPC Dialogue Tree", icon: "💬", tagline: "Dialogue architect", desc: "Designs NPC dialogue trees with branching responses, player relationship states, and secret reveals.", ph: "Who is this NPC and what do they know or want from the player?", ex: "e.g. A spy who is pretending to be a merchant and slowly reveals information as trust is built", color: "#6d28d9" },
      { id: "NPCMotivationEngine", name: "NPC Motivation", icon: "❤️", tagline: "Motivation architect", desc: "Designs NPC motivations that create coherent behavior across all situations.", ph: "What is this NPC's backstory and what do they want?", ex: "e.g. An NPC who helps the player but whose actual goal is to use them to get revenge on a third party", color: "#7c3aed" },
      { id: "NPC_AIBehaviorEngine", name: "NPC AI Behavior", icon: "🤖", tagline: "Behavior architect", desc: "Designs NPC behavior states, schedules, and reactive systems for game AI.", ph: "What is this NPC's daily routine and how should they react to different player actions?", ex: "e.g. A guard NPC with patrol routes, alert states, and personality that affects how quickly they escalate", color: "#6d28d9" },
      { id: "NPCRelationshipEngine", name: "NPC Relationship System", icon: "🔗", tagline: "Relationship architect", desc: "Designs relationship systems between NPCs and players — trust, reputation, and faction alignment.", ph: "What relationship dynamics should matter in your game?", ex: "e.g. A faction system where helping one group automatically creates enemies of another", color: "#7c3aed" },
    ],
  },
  {
    id: "dungeonbuilder", title: "Dungeon Builder", icon: "🏰", color: "#475569",
    desc: "Dungeon and environment design, encounter building, traps, puzzles, and atmosphere.",
    engines: [
      { id: "DungeonLayoutEngine", name: "Dungeon Layout", icon: "🗺️", tagline: "Spatial architect", desc: "Designs dungeon layouts with rooms, corridors, secret passages, and spatial storytelling.", ph: "What is the dungeon's theme, size, and purpose in your world?", ex: "e.g. An ancient dwarven mine that collapsed 300 years ago and is now home to something that adapted to the darkness", color: "#475569" },
      { id: "EncounterDesignEngine", name: "Encounter Designer", icon: "⚔️", tagline: "Encounter architect", desc: "Designs combat and non-combat encounters with meaningful decisions and multiple solutions.", ph: "What is the encounter context and what player options should exist?", ex: "e.g. Players encounter the villain's lieutenant — a fight they can't win, must negotiate, or flee from creatively", color: "#334155" },
      { id: "TrapDesignEngine", name: "Trap Designer", icon: "🪤", tagline: "Trap architect", desc: "Designs clever, fair traps with telegraphing signs, multiple solutions, and interesting consequences.", ph: "What type of dungeon and what role do traps play in the design?", ex: "e.g. Traps in a tomb designed by a paranoid lich who wanted puzzles, not just killing intruders", color: "#475569" },
      { id: "DungeonAtmosphereEngine", name: "Dungeon Atmosphere", icon: "🕯️", tagline: "Atmosphere architect", desc: "Designs dungeon atmosphere — description language, sensory details, and tone-setting elements.", ph: "What feeling should players have while exploring this dungeon?", ex: "e.g. A dungeon that used to be a place of celebration — the horror is how the joy became twisted", color: "#334155" },
      { id: "PuzzleDesignEngine", name: "Puzzle Designer", icon: "🧩", tagline: "Puzzle architect", desc: "Designs puzzles that are challenging, fair, and satisfying — with multiple solution paths.", ph: "What is the dungeon theme and what skill should the puzzle test?", ex: "e.g. A puzzle in a wizard's tower that tests observation rather than knowledge of the rules", color: "#475569" },
    ],
  },
  {
    id: "itemforge", title: "Item Forge", icon: "🗡️", color: "#d97706",
    desc: "Game items, weapons, armor, consumables, and equipment design.",
    engines: [
      { id: "WeaponDesignEngine", name: "Weapon Designer", icon: "⚔️", tagline: "Weapon architect", desc: "Designs weapons with gameplay purpose, visual identity, lore, and unique mechanical properties.", ph: "What type of weapon and what gameplay role should it fill?", ex: "e.g. A sword that gets stronger the more it fails — its enchantment grows with defeat, not victory", color: "#d97706" },
      { id: "ArmorDesignEngine", name: "Armor Set Designer", icon: "🛡️", tagline: "Armor architect", desc: "Designs armor sets with visual theme, protective purpose, set bonuses, and lore identity.", ph: "What type of armor and what identity should it project?", ex: "e.g. Armor made from the shed scales of a dragon who chose to give them willingly — what does that mean mechanically?", color: "#b45309" },
      { id: "ConsumableDesignEngine", name: "Consumable Designer", icon: "🧪", tagline: "Consumable architect", desc: "Designs potions, food, and consumable items with distinct effects and world-building flavor.", ph: "What type of game economy and what role should consumables play?", ex: "e.g. A game where all healing is imperfect — consumables work but leave lasting effects", color: "#d97706" },
      { id: "LoreItemEngine", name: "Lore Item Designer", icon: "📜", tagline: "Lore architect", desc: "Designs items that tell stories — flavor text, visual design, and world-building implications.", ph: "What story should this item tell through its existence?", ex: "e.g. An ordinary-looking key that opens no door in the game world — but clearly opened something", color: "#b45309" },
      { id: "ItemEconomyEngine", name: "Item Economy", icon: "💰", tagline: "Economy architect", desc: "Designs item economy systems — rarity, crafting, trading, and progression feel.", ph: "What game type and what should item acquisition feel like?", ex: "e.g. An RPG where I want items to feel meaningful to find but not make the economy inflationary", color: "#d97706" },
    ],
  },
  {
    id: "gamenarrative", title: "Game Narrative Studio", icon: "📖", color: "#6366f1",
    desc: "Game story, lore writing, world canon, cutscene narrative, and environmental storytelling.",
    engines: [
      { id: "WorldCanonEngine", name: "World Canon Builder", icon: "📚", tagline: "Canon architect", desc: "Builds consistent world canon — history, factions, rules, and the internal logic that prevents contradictions.", ph: "What is your game world and what canon conflicts exist?", ex: "e.g. My game has three factions who fought 200 years ago — I need a history they all partially remember wrong", color: "#6366f1" },
      { id: "CutsceneNarrativeEngine", name: "Cutscene Writer", icon: "🎬", tagline: "Cutscene architect", desc: "Writes cutscene scripts with direction notes, dialogue, and emotional beats.", ph: "What story moment does this cutscene cover and what should players feel?", ex: "e.g. The moment the player character realizes the mentor has been manipulating them since the beginning", color: "#4f46e5" },
      { id: "EnvironmentalStoryEngine", name: "Environmental Storytelling", icon: "🏚️", tagline: "Space architect", desc: "Designs environmental storytelling — what the space reveals without a single word of dialogue.", ph: "What happened in this location and what should players piece together from the environment?", ex: "e.g. A house where a family clearly fled in a hurry — what details tell that story without any notes?", color: "#6366f1" },
      { id: "GameLogbookEngine", name: "Logbook & Codex Writer", icon: "📋", tagline: "Codex architect", desc: "Writes in-world logbooks, journal entries, codex entries, and item descriptions with voice.", ph: "What type of document and whose perspective is it written from?", ex: "e.g. A guard's logbook from the night something impossible happened in the castle treasury", color: "#4f46e5" },
      { id: "NarrativePacingEngine", name: "Narrative Pacing", icon: "⏱️", tagline: "Pacing architect", desc: "Designs story pacing across gameplay — when to accelerate, breathe, reveal, and escalate.", ph: "What is the game's narrative arc and what is the current pacing issue?", ex: "e.g. My game's midpoint feels slow — players have all the information but nothing has changed", color: "#6366f1" },
    ],
  },
  {
    id: "balancedesigner", title: "Balance Designer", icon: "⚖️", color: "#0369a1",
    desc: "Game balance, tuning, difficulty curves, and systemic design.",
    engines: [
      { id: "DifficultyEngine", name: "Difficulty Curve Designer", icon: "📈", tagline: "Difficulty architect", desc: "Designs difficulty curves that challenge without frustrating — rubber-banding, scaling, and pacing.", ph: "What type of game and what should the difficulty experience feel like?", ex: "e.g. An action game where veterans feel challenged but new players can still experience the story", color: "#0369a1" },
      { id: "NumbersBalanceEngine", name: "Numbers Tuning", icon: "🔢", tagline: "Tuning architect", desc: "Designs numerical balance frameworks for damage, health, progression, and economy.", ph: "What game system needs numerical tuning and what is the current imbalance?", ex: "e.g. Players are all choosing the same build because magic deals 3x more damage than physical attacks", color: "#0284c7" },
      { id: "ProgressionSystemEngine", name: "Progression System", icon: "⬆️", tagline: "Progression architect", desc: "Designs player progression systems — XP curves, power gates, and meaningful upgrade choices.", ph: "What is the game's progression fantasy and how long should it take?", ex: "e.g. An RPG where players should feel power growth across 40 hours without any single upgrade feeling mandatory", color: "#0369a1" },
      { id: "MultiplayerBalanceEngine", name: "Multiplayer Balance", icon: "👥", tagline: "Balance architect", desc: "Designs multiplayer balance considerations — competitive integrity, counterplay, and dominant strategies.", ph: "What multiplayer game and what imbalances exist between options or characters?", ex: "e.g. In my fighting game, high-speed characters are winning 70% of ranked matches — is it speed or something else?", color: "#0284c7" },
      { id: "EconomyBalanceEngine", name: "Game Economy Balance", icon: "💰", tagline: "Economy architect", desc: "Designs and balances in-game economies — currency sinks, sources, inflation prevention, and meaningful choices.", ph: "What is the game's economy and what problems are you trying to prevent?", ex: "e.g. My crafting game always ends up with players hoarding one resource and ignoring everything else", color: "#0369a1" },
    ],
  },

  // ── AI & Technology ───────────────────────────────────────────────────────
  {
    id: "promptengineer", title: "Prompt Engineer", icon: "🤖", color: "#6366f1",
    desc: "AI prompt design, chain-of-thought, system prompts, and prompt optimization.",
    engines: [
      { id: "SystemPromptEngine", name: "System Prompt Designer", icon: "⚙️", tagline: "Persona architect", desc: "Designs system prompts that reliably shape AI behavior — persona, constraints, and output format.", ph: "What AI role or behavior do you need a system prompt for?", ex: "e.g. A system prompt for a customer service AI that stays helpful even with hostile users", color: "#6366f1" },
      { id: "ChainOfThoughtEngine", name: "Chain of Thought Builder", icon: "🔗", tagline: "Reasoning architect", desc: "Designs chain-of-thought prompt structures that improve AI reasoning on complex problems.", ph: "What complex problem needs better AI reasoning?", ex: "e.g. A prompt that gets AI to analyze legal contracts for hidden liability without missing nuances", color: "#4f46e5" },
      { id: "FewShotEngine", name: "Few-Shot Example Designer", icon: "📚", tagline: "Example architect", desc: "Designs high-quality few-shot examples that reliably calibrate AI output style and quality.", ph: "What output format and quality level do you need to calibrate?", ex: "e.g. I need 3 examples that teach the AI to write product descriptions in my brand's specific voice", color: "#6366f1" },
      { id: "PromptAuditEngine", name: "Prompt Auditor", icon: "🔍", tagline: "Quality auditor", desc: "Audits existing prompts for failure modes, ambiguity, and manipulation vulnerabilities.", ph: "Describe or paste the prompt you want audited", ex: "e.g. My chatbot prompt keeps being convinced to break its rules by users who frame requests as hypotheticals", color: "#4f46e5" },
      { id: "OutputFormatEngine", name: "Output Format Designer", icon: "📋", tagline: "Format architect", desc: "Designs structured output formats — JSON, markdown, tables — that AI reliably produces.", ph: "What data structure does your application need from the AI?", ex: "e.g. I need AI to always return structured character profiles in valid JSON with specific fields", color: "#6366f1" },
    ],
  },
  {
    id: "datastoryteller", title: "Data Storyteller", icon: "📊", color: "#0369a1",
    desc: "Data narratives, visualization scripts, insight communication, and analytical storytelling.",
    engines: [
      { id: "InsightNarrativeEngine", name: "Insight Narrative", icon: "💡", tagline: "Insight architect", desc: "Transforms data findings into compelling narratives that drive decision-making.", ph: "What data or finding needs to be communicated as a story?", ex: "e.g. Our conversion rate is up 12% but revenue is down — the data tells a counterintuitive story", color: "#0369a1" },
      { id: "VisualizationScriptEngine", name: "Visualization Script", icon: "📈", tagline: "Visualization architect", desc: "Writes D3.js or Plotly visualization descriptions and annotation copy for charts.", ph: "What data should be visualized and what should viewers understand?", ex: "e.g. A chart showing 5-year customer lifetime value by acquisition channel — what annotations add insight?", color: "#0284c7" },
      { id: "DashboardNarrativeEngine", name: "Dashboard Narrative", icon: "🖥️", tagline: "Dashboard architect", desc: "Writes dashboard header copy, metric descriptions, and contextual explanations for data dashboards.", ph: "What metrics does the dashboard show and who is the audience?", ex: "e.g. A healthcare operations dashboard tracking bed occupancy, readmissions, and staff-to-patient ratios", color: "#0369a1" },
      { id: "AnomalyStoryEngine", name: "Anomaly Storyteller", icon: "⚠️", tagline: "Anomaly architect", desc: "Turns data anomalies into clear investigative narratives with hypothesis and next steps.", ph: "What anomaly did you find in the data and what systems might explain it?", ex: "e.g. Website traffic dropped 60% on a Tuesday with no deployment, no outage, and no news event", color: "#0284c7" },
      { id: "PredictiveNarrativeEngine", name: "Predictive Narrative", icon: "🔮", tagline: "Forecast architect", desc: "Communicates predictive model outputs in plain language with appropriate uncertainty.", ph: "What does your predictive model say and who needs to understand it?", ex: "e.g. Our churn model says 340 customers will leave next month — how do I explain this to non-technical executives?", color: "#0369a1" },
    ],
  },
  {
    id: "systemdesigner", title: "System Designer", icon: "🏗️", color: "#475569",
    desc: "System architecture, design patterns, technical documentation, and engineering clarity.",
    engines: [
      { id: "ArchitectureDiagramEngine", name: "Architecture Description", icon: "🗺️", tagline: "Architecture architect", desc: "Describes system architectures in clear language for technical and non-technical audiences.", ph: "What system needs to be explained and who is the audience?", ex: "e.g. Our microservices architecture to a CTO who is evaluating whether to invest more or consolidate", color: "#475569" },
      { id: "TechnicalDecisionEngine", name: "Technical Decision Record", icon: "📋", tagline: "Decision architect", desc: "Writes architectural decision records (ADRs) with context, options, decision, and consequences.", ph: "What technical decision was made and what were the alternatives?", ex: "e.g. We chose PostgreSQL over MongoDB and need to document why for future engineers", color: "#334155" },
      { id: "APIDesignEngine", name: "API Design Guide", icon: "🔌", tagline: "API architect", desc: "Designs RESTful and GraphQL API structures with naming conventions, error handling, and versioning.", ph: "What does this API need to do and who will consume it?", ex: "e.g. An API for a healthcare system that external insurance companies will query for patient eligibility", color: "#475569" },
      { id: "ScalabilityEngine", name: "Scalability Analysis", icon: "📈", tagline: "Scale architect", desc: "Analyzes scalability constraints and designs solutions for growth bottlenecks.", ph: "What is your current system and what scale do you need to reach?", ex: "e.g. Our Django app handles 1K users and we need it to handle 100K — where will it break?", color: "#334155" },
      { id: "TechDebtEngine", name: "Tech Debt Analyzer", icon: "🔧", tagline: "Debt architect", desc: "Analyzes technical debt and designs prioritized paydown plans.", ph: "What technical debt exists in your system and what is causing the most pain?", ex: "e.g. We have 5 years of accumulated tech debt and need to communicate the paydown plan to executives", color: "#475569" },
    ],
  },
  {
    id: "codereviewer", title: "Code Reviewer", icon: "👨‍💻", color: "#16a34a",
    desc: "Code review frameworks, best practices analysis, refactoring guides, and quality improvement.",
    engines: [
      { id: "CodeQualityEngine", name: "Code Quality Analysis", icon: "🔍", tagline: "Quality architect", desc: "Analyzes code quality across dimensions: readability, maintainability, and testability.", ph: "Describe or paste the code you want quality analyzed", ex: "e.g. A 200-line function that handles payment processing, logging, and email — all in one place", color: "#16a34a" },
      { id: "RefactoringGuideEngine", name: "Refactoring Guide", icon: "🔧", tagline: "Refactor architect", desc: "Designs refactoring strategies for messy codebases with prioritized steps and risk assessment.", ph: "What codebase or code pattern needs refactoring?", ex: "e.g. A monolith we want to break into microservices without breaking the app or the team", color: "#15803d" },
      { id: "CodePatternEngine", name: "Design Pattern Advisor", icon: "🏛️", tagline: "Pattern architect", desc: "Recommends design patterns for specific problems with implementation guidance.", ph: "What software problem are you trying to solve with a pattern?", ex: "e.g. I need to handle different payment providers (Stripe, PayPal, Square) without coupling my code to any of them", color: "#16a34a" },
      { id: "SecurityReviewEngine", name: "Security Review", icon: "🔒", tagline: "Security architect", desc: "Identifies security vulnerabilities and recommends fixes for code and architecture.", ph: "What code or system needs a security review?", ex: "e.g. Our authentication system — I want to know if there are common attack vectors we've missed", color: "#15803d" },
      { id: "TestStrategyEngine", name: "Test Strategy", icon: "🧪", tagline: "Testing architect", desc: "Designs testing strategies — unit, integration, e2e — with coverage priorities and tool selection.", ph: "What system needs a test strategy and what is currently tested?", ex: "e.g. A medical device software system with zero tests that is going through FDA approval", color: "#16a34a" },
    ],
  },
  {
    id: "devplanner", title: "Dev Planner", icon: "🗂️", color: "#7c3aed",
    desc: "Software development planning, sprint design, technical roadmaps, and estimation.",
    engines: [
      { id: "SprintPlanEngine", name: "Sprint Planner", icon: "🏃", tagline: "Sprint architect", desc: "Designs sprint structures with stories, tasks, capacity, and realistic commitments.", ph: "What is the team's velocity, sprint length, and this sprint's goal?", ex: "e.g. 5-person team, 2-week sprint, goal is to launch the beta onboarding flow", color: "#7c3aed" },
      { id: "TechnicalRoadmapEngine", name: "Technical Roadmap", icon: "🗺️", tagline: "Roadmap architect", desc: "Creates technical roadmaps with prioritized initiatives, dependencies, and resource requirements.", ph: "What are the technical initiatives and constraints for the next 6-12 months?", ex: "e.g. We need to rebuild our legacy API, migrate to the cloud, and ship 3 major features — prioritize this", color: "#6d28d9" },
      { id: "EstimationEngine", name: "Estimation Guide", icon: "⏱️", tagline: "Estimation architect", desc: "Designs estimation approaches and helps think through complexity, risk, and uncertainty.", ph: "What feature or project needs estimation and what is known vs unknown?", ex: "e.g. Estimate rebuilding our search system from keyword to semantic — we have no ML experience", color: "#7c3aed" },
      { id: "MVP_DefinitionEngine", name: "MVP Definition", icon: "🎯", tagline: "MVP architect", desc: "Defines MVP scope that validates core assumptions without overbuilding.", ph: "What product are you building and what do you need to learn first?", ex: "e.g. A marketplace for skilled trades — we don't know if supply or demand is the harder side to acquire", color: "#6d28d9" },
      { id: "PostmortemEngine", name: "Engineering Post-mortem", icon: "🔄", tagline: "Learning architect", desc: "Designs blameless post-mortems that extract learning and systemic improvement.", ph: "What incident or failure needs a post-mortem analysis?", ex: "e.g. A database migration caused 4 hours of downtime for 10,000 users last Thursday", color: "#7c3aed" },
    ],
  },

  // ── Health & Wellness ─────────────────────────────────────────────────────
  {
    id: "healthcoach", title: "Health Coach", icon: "🏥", color: "#16a34a",
    desc: "Health planning, wellness strategies, lifestyle design, and preventive health guidance.",
    engines: [
      { id: "WellnessPlanEngine", name: "Wellness Plan Designer", icon: "🌱", tagline: "Wellness architect", desc: "Designs comprehensive wellness plans covering sleep, movement, nutrition, stress, and social health.", ph: "What are your current health challenges and goals?", ex: "e.g. 40 years old, high stress job, poor sleep, want to build sustainable health habits without overhauling my life", color: "#16a34a" },
      { id: "LifestyleAuditEngine", name: "Lifestyle Audit", icon: "🔍", tagline: "Audit architect", desc: "Audits lifestyle habits across sleep, activity, nutrition, stress, and relationships for health impact.", ph: "Describe a typical week in your life and what feels most off-balance", ex: "e.g. I sleep 5-6 hours, eat lunch at my desk, skip exercise most weeks, and feel vaguely anxious constantly", color: "#15803d" },
      { id: "ChronicManagementEngine", name: "Chronic Condition Guide", icon: "🩺", tagline: "Management architect", desc: "Designs lifestyle and self-management strategies for chronic health conditions.", ph: "What chronic condition are you managing and what are the main challenges?", ex: "e.g. Type 2 diabetes diagnosed 2 years ago — I manage it but struggle with dietary consistency", color: "#16a34a" },
      { id: "PreventiveHealthEngine", name: "Preventive Health Plan", icon: "🛡️", tagline: "Prevention architect", desc: "Designs preventive health strategies based on age, family history, and risk factors.", ph: "What age are you, what is your family health history, and what risk factors concern you?", ex: "e.g. 45 years old, father had heart disease at 55, desk job, occasional smoker in my 20s", color: "#15803d" },
      { id: "EnergyManagementEngine", name: "Energy Management", icon: "⚡", tagline: "Energy architect", desc: "Designs energy management systems — when to push, when to recover, and how to sustain high performance.", ph: "What does your energy pattern look like across the day and week?", ex: "e.g. I'm high energy until 2pm then crash, can't work after dinner, and am always depleted by Thursday", color: "#16a34a" },
    ],
  },
  {
    id: "mentalhealth", title: "Mental Health Support", icon: "💙", color: "#6366f1",
    desc: "Mental health education, CBT tools, coping strategies, and emotional resilience building.",
    engines: [
      { id: "CopingStrategyEngine", name: "Coping Strategy Designer", icon: "🛡️", tagline: "Coping architect", desc: "Designs personalized coping strategies for anxiety, stress, and emotional overwhelm.", ph: "What mental health challenge are you navigating and what has worked before?", ex: "e.g. Anxiety that spikes before big events — I know it's coming but don't know how to prepare", color: "#6366f1" },
      { id: "CBTEngine", name: "CBT Tool Designer", icon: "🧠", tagline: "CBT architect", desc: "Designs CBT exercises — thought records, behavioral experiments, and cognitive restructuring.", ph: "What thought pattern or behavior is getting in the way?", ex: "e.g. I catastrophize when projects go slightly wrong — my mind jumps to the worst possible outcome", color: "#4f46e5" },
      { id: "ResilienceEngine", name: "Resilience Builder", icon: "🌱", tagline: "Resilience architect", desc: "Designs resilience-building practices for navigating chronic difficulty and recovering from setbacks.", ph: "What difficult circumstance are you building resilience for?", ex: "e.g. A period of grief while still needing to show up for work and my family", color: "#6366f1" },
      { id: "AnxietyToolkitEngine", name: "Anxiety Toolkit", icon: "🧰", tagline: "Toolkit architect", desc: "Builds a personalized anxiety management toolkit with immediate and long-term strategies.", ph: "What type of anxiety do you experience and in what situations?", ex: "e.g. Social anxiety that is specific to professional settings — fine with friends, paralyzed in meetings", color: "#4f46e5" },
      { id: "MindfulSelfCompassionEngine", name: "Self-Compassion Practice", icon: "💗", tagline: "Compassion architect", desc: "Designs self-compassion practices drawn from MSC research for people who are hard on themselves.", ph: "What situation or pattern calls for more self-compassion?", ex: "e.g. I am relentlessly self-critical after any mistake and it takes days to recover my confidence", color: "#6366f1" },
    ],
  },
  {
    id: "nutritionplanner", title: "Nutrition Planner", icon: "🥗", color: "#16a34a",
    desc: "Nutrition planning, diet design, macro balance, and evidence-based eating guidance.",
    engines: [
      { id: "NutritionPlanEngine", name: "Nutrition Plan Designer", icon: "🥗", tagline: "Nutrition architect", desc: "Designs personalized nutrition plans with macro targets, meal timing, and food variety.", ph: "What are your health goals, dietary restrictions, and food preferences?", ex: "e.g. Trying to reduce inflammation, vegetarian, hate cooking, very food sensitive to texture", color: "#16a34a" },
      { id: "MacroCalculatorEngine", name: "Macro Calculator", icon: "🔢", tagline: "Macro architect", desc: "Calculates and explains optimal macro ratios for specific health and body composition goals.", ph: "What is your goal, body stats, and activity level?", ex: "e.g. 5'8, 185 lbs, 32% body fat, moderately active, goal of losing fat and maintaining muscle", color: "#15803d" },
      { id: "MealPrepEngine", name: "Meal Prep Planner", icon: "🍱", tagline: "Prep architect", desc: "Designs efficient meal prep systems that minimize time while maximizing nutritional variety.", ph: "How many people are you prepping for and how much time can you spend per week?", ex: "e.g. Prepping for 2 adults, 2 hours on Sunday, Mediterranean-ish diet, avoiding ultra-processed food", color: "#16a34a" },
      { id: "NutritionMythEngine", name: "Nutrition Myth Buster", icon: "💡", tagline: "Evidence architect", desc: "Analyzes nutrition claims against current evidence — what's supported, what's marketing, and what's unclear.", ph: "What nutrition claim or diet trend do you want analyzed against the evidence?", ex: "e.g. Is the carnivore diet actually healthy or is it marketing dressed up as ancestral wisdom?", color: "#15803d" },
      { id: "FoodRelationshipEngine", name: "Healthy Food Relationship", icon: "💙", tagline: "Mindfulness architect", desc: "Designs approaches to improving the psychological relationship with food — guilt-free, sustainable eating.", ph: "What is your current relationship with food and what would you like it to be?", ex: "e.g. I eat well for weeks then binge when stressed — the cycle makes me feel like a failure", color: "#16a34a" },
    ],
  },
  {
    id: "sleepcoach", title: "Sleep Coach", icon: "🌙", color: "#4f46e5",
    desc: "Sleep optimization, insomnia strategies, sleep hygiene, and circadian rhythm coaching.",
    engines: [
      { id: "SleepHygieneEngine", name: "Sleep Hygiene Designer", icon: "🛏️", tagline: "Sleep architect", desc: "Designs personalized sleep hygiene protocols based on specific sleep challenges.", ph: "What are your sleep problems and what does your current routine look like?", ex: "e.g. Take 1-2 hours to fall asleep, phone in bed, work stress, irregular schedule on weekends", color: "#4f46e5" },
      { id: "InsomniaEngine", name: "Insomnia Protocol", icon: "🌙", tagline: "Insomnia architect", desc: "Designs evidence-based insomnia interventions using CBT-I principles.", ph: "What type of insomnia do you experience and how long has it been happening?", ex: "e.g. Wake at 3am and can't get back to sleep — this has been happening for 6 months", color: "#3730a3" },
      { id: "CircadianEngine", name: "Circadian Rhythm Optimizer", icon: "☀️", tagline: "Rhythm architect", desc: "Designs circadian rhythm optimization strategies — light exposure, timing, and temperature.", ph: "What is your target wake and sleep time and what is your current pattern?", ex: "e.g. Need to wake at 5:30am for work but naturally want to sleep until 8am and stay up until midnight", color: "#4f46e5" },
      { id: "NapStrategyEngine", name: "Nap Strategy", icon: "💤", tagline: "Recovery architect", desc: "Designs optimal napping strategies that improve performance without disrupting night sleep.", ph: "What is your schedule and what are you trying to achieve with napping?", ex: "e.g. I work night shifts 3 days a week and need to be mentally sharp — how should I nap?", color: "#3730a3" },
      { id: "SleepEnvironmentEngine", name: "Sleep Environment", icon: "🏠", tagline: "Environment architect", desc: "Designs the optimal sleep environment — temperature, light, sound, and bedding recommendations.", ph: "What does your current sleep environment look like and what disrupts your sleep?", ex: "e.g. Light sleeper, partner snores, urban apartment with street noise and neighbor's TV", color: "#4f46e5" },
    ],
  },
  {
    id: "parentingguide", title: "Parenting Guide", icon: "👨‍👩‍👧", color: "#d97706",
    desc: "Parenting strategies, child development, discipline alternatives, and family communication.",
    engines: [
      { id: "DevelopmentStageEngine", name: "Child Development Guide", icon: "👶", tagline: "Development architect", desc: "Explains developmental stages with age-appropriate expectations, challenges, and support strategies.", ph: "What age is your child and what behavior or challenge are you navigating?", ex: "e.g. My 4-year-old has massive tantrums in public and I don't know if this is normal or something else", color: "#d97706" },
      { id: "DisciplineAlternativesEngine", name: "Discipline Alternatives", icon: "❤️", tagline: "Connection architect", desc: "Designs positive discipline strategies that teach rather than punish — connected and effective.", ph: "What behavior are you trying to address and what have you tried?", ex: "e.g. My 7-year-old hits when frustrated — timeouts aren't working and I don't want to escalate", color: "#b45309" },
      { id: "ConversationGuideEngine", name: "Difficult Conversation Guide", icon: "💬", tagline: "Conversation architect", desc: "Guides age-appropriate conversations on difficult topics — death, divorce, race, sex, danger.", ph: "What topic do you need to discuss with your child and how old are they?", ex: "e.g. My 8-year-old asked why their classmate's family doesn't look like ours", color: "#d97706" },
      { id: "TransitionSupportEngine", name: "Transition Support", icon: "🌱", tagline: "Transition architect", desc: "Designs support strategies for major child transitions — new sibling, school, divorce, moving.", ph: "What transition is your child facing and what are the signs of struggle?", ex: "e.g. New baby coming in 2 months and my 3-year-old already seems more clingy and regressive", color: "#b45309" },
      { id: "ScreenTimeEngine", name: "Screen Time Strategy", icon: "📱", tagline: "Balance architect", desc: "Designs balanced, guilt-free screen time strategies appropriate for each developmental stage.", ph: "What ages are your children and what are your current screen time struggles?", ex: "e.g. 6 and 9-year-olds who escalate into meltdowns when screens are turned off", color: "#d97706" },
    ],
  },

  // ── Arts & Culture ────────────────────────────────────────────────────────
  {
    id: "artcritique", title: "Art Critique Studio", icon: "🖼️", color: "#be185d",
    desc: "Art analysis, criticism frameworks, art history, and creative interpretation.",
    engines: [
      { id: "FormalAnalysisEngine", name: "Formal Analysis", icon: "🔍", tagline: "Visual architect", desc: "Analyzes visual art through formal elements — line, shape, color, texture, space, and composition.", ph: "Describe the artwork you want to analyze formally", ex: "e.g. Vermeer's Girl with a Pearl Earring — analyze the formal elements that create the painting's intimacy", color: "#be185d" },
      { id: "ContextualAnalysisEngine", name: "Contextual Analysis", icon: "📜", tagline: "Context architect", desc: "Places artworks in historical, social, and cultural context to understand their meaning and reception.", ph: "What artwork needs contextual analysis?", ex: "e.g. Picasso's Guernica — the political context, reception at the time, and evolving interpretation", color: "#9d174d" },
      { id: "ArtCriticismEngine", name: "Art Criticism Writer", icon: "✍️", tagline: "Critic architect", desc: "Writes formal art criticism in the tradition of different critical schools — formalist, Marxist, feminist, psychoanalytic.", ph: "What artwork should I critique and from which critical perspective?", ex: "e.g. Jeff Koons' Balloon Dog through a Marxist critical lens", color: "#be185d" },
      { id: "ArtHistoryEngine", name: "Art History Navigator", icon: "📚", tagline: "History architect", desc: "Traces the history and development of art movements — their context, key works, and influence.", ph: "What art movement or period should I explore historically?", ex: "e.g. Abstract Expressionism — its emergence, key figures, and why it was the first distinctly American art movement", color: "#9d174d" },
      { id: "ExhibitionTextEngine", name: "Exhibition Text Writer", icon: "🏛️", tagline: "Wall text architect", desc: "Writes exhibition texts — wall labels, catalog essays, and exhibition introductions — for any artwork.", ph: "What artwork or exhibition needs wall text written?", ex: "e.g. An exhibition of 12 photographs documenting industrial abandonment across the American Midwest", color: "#be185d" },
    ],
  },
  {
    id: "filmanalysis", title: "Film Analysis Studio", icon: "🎬", color: "#1d4ed8",
    desc: "Film theory, screenplay analysis, cinematography, and cinema criticism.",
    engines: [
      { id: "FilmAnalysisEngine", name: "Film Analyzer", icon: "🎥", tagline: "Film architect", desc: "Analyzes films through multiple frameworks — narrative, visual, thematic, and cultural.", ph: "What film do you want to analyze and what aspects interest you?", ex: "e.g. Analyze Parasite's visual symbolism and how the vertical space (above/below ground) carries the class theme", color: "#1d4ed8" },
      { id: "ScreenplayAnalysisEngine", name: "Screenplay Analyzer", icon: "📝", tagline: "Script analyst", desc: "Analyzes screenplays for structure, character, theme, and technique — professional coverage style.", ph: "What screenplay or script concept needs analysis?", ex: "e.g. Analyze the structure of The Shawshank Redemption screenplay — what makes the pacing feel inevitable?", color: "#1e40af" },
      { id: "CinematographyEngine", name: "Cinematography Analyzer", icon: "📷", tagline: "Visual architect", desc: "Analyzes cinematographic choices — framing, movement, lens, lighting — and their storytelling effect.", ph: "What film or sequence needs cinematography analysis?", ex: "e.g. How Kubrick uses wide-angle lenses and symmetry in The Shining to create psychological unease", color: "#1d4ed8" },
      { id: "DirectorStyleEngine", name: "Director Style Analyzer", icon: "🎬", tagline: "Auteur architect", desc: "Analyzes a director's distinctive visual and narrative style across their body of work.", ph: "Which director's style do you want to analyze?", ex: "e.g. What makes a Wes Anderson film visually and narratively distinctive across his entire filmography?", color: "#1e40af" },
      { id: "FilmTheoryEngine", name: "Film Theory Explorer", icon: "📚", tagline: "Theory architect", desc: "Applies film theory frameworks — psychoanalysis, feminism, auteur, structuralism — to specific films.", ph: "What film and which theoretical framework should I apply?", ex: "e.g. Apply the male gaze theory to Blade Runner 2049 — is it complicit or critical?", color: "#1d4ed8" },
    ],
  },
  {
    id: "culturalexplorer", title: "Cultural Explorer", icon: "🌍", color: "#0f766e",
    desc: "Cultural analysis, anthropology, cross-cultural comparison, and cultural intelligence.",
    engines: [
      { id: "CultureDeepDiveEngine", name: "Culture Deep Dive", icon: "🔍", tagline: "Culture architect", desc: "Deep-dives into a culture — its values, communication styles, relationship to time, hierarchy, and identity.", ph: "What culture do you want to understand deeply?", ex: "e.g. Japanese culture — specifically the concepts that don't translate and shape how people interact", color: "#0f766e" },
      { id: "CrossCulturalEngine", name: "Cross-Cultural Comparison", icon: "⚖️", tagline: "Comparison architect", desc: "Compares two cultures across key dimensions — communication, conflict, family, and work.", ph: "What two cultures are you comparing and what dimensions matter?", ex: "e.g. American and German work culture — where the differences cause the most friction in international teams", color: "#0d9488" },
      { id: "CulturalIntelligenceEngine", name: "Cultural Intelligence Coach", icon: "🤝", tagline: "Intelligence architect", desc: "Develops cultural intelligence for working across cultures — adaptive strategies and awareness.", ph: "What cultural context are you navigating and what is the challenge?", ex: "e.g. Leading a team across 5 countries with very different relationships to authority and direct feedback", color: "#0f766e" },
      { id: "AnthropologyEngine", name: "Anthropology Lens", icon: "🦴", tagline: "Anthropology architect", desc: "Applies anthropological frameworks to understanding human behavior, ritual, and social structure.", ph: "What human practice or social behavior needs anthropological analysis?", ex: "e.g. Why do office meetings have the ritual structure they do — what anthropological function does the format serve?", color: "#0d9488" },
      { id: "CulturalNarrativeEngine", name: "Cultural Narrative", icon: "📖", tagline: "Story architect", desc: "Explores the stories a culture tells itself — its myths, heroes, villains, and founding narratives.", ph: "What culture's narrative or mythology do you want to explore?", ex: "e.g. The founding mythology of the United States and how it shapes contemporary political identity", color: "#0f766e" },
    ],
  },

  // ── Legal & Professional ──────────────────────────────────────────────────
  {
    id: "legaldrafter", title: "Legal Drafter", icon: "⚖️", color: "#1d4ed8",
    desc: "Legal document drafting, clause libraries, legal language, and document structures.",
    engines: [
      { id: "ClauseLibraryEngine", name: "Clause Library", icon: "📚", tagline: "Clause architect", desc: "Drafts standard legal clauses — indemnification, limitation of liability, force majeure, and more.", ph: "What clause do you need drafted and for what type of agreement?", ex: "e.g. A limitation of liability clause for a SaaS subscription agreement with enterprise clients", color: "#1d4ed8" },
      { id: "DocumentStructureEngine", name: "Document Structure", icon: "🗺️", tagline: "Structure architect", desc: "Designs legal document structures with appropriate sections, numbering, and defined term strategy.", ph: "What type of legal document are you drafting and what is its purpose?", ex: "e.g. A joint venture agreement between two companies co-developing a technology product", color: "#1e40af" },
      { id: "LegalPlainLanguageEngine", name: "Plain Language Translator", icon: "💬", tagline: "Clarity architect", desc: "Translates complex legal language into plain English without losing legal accuracy.", ph: "Paste or describe the legal text you want translated to plain English", ex: "e.g. The force majeure clause in our lease that our landlord wants us to waive", color: "#1d4ed8" },
      { id: "ContractRiskEngine", name: "Contract Risk Spotter", icon: "⚠️", tagline: "Risk architect", desc: "Identifies contract provisions that create risk — one-sided clauses, missing protections, and traps.", ph: "Describe the contract or clause you want risk-analyzed", ex: "e.g. Our vendor wants us to accept liability for all data breaches even if caused by their system", color: "#1e40af" },
      { id: "LegalComparisonEngine", name: "Jurisdiction Comparison", icon: "🌍", tagline: "Jurisdiction architect", desc: "Compares how specific legal concepts differ across jurisdictions — US states, countries, legal systems.", ph: "What legal concept or requirement needs to be compared across jurisdictions?", ex: "e.g. Non-compete agreement enforceability in California vs New York vs Texas", color: "#1d4ed8" },
    ],
  },
  {
    id: "ipprotection", title: "IP Protection Studio", icon: "🛡️", color: "#7c3aed",
    desc: "Intellectual property, trademark strategy, copyright guidance, and IP portfolio design.",
    engines: [
      { id: "TrademarkStrategyEngine", name: "Trademark Strategy", icon: "™️", tagline: "Mark architect", desc: "Designs trademark strategies — what to protect, strength assessment, and registration approach.", ph: "What brand name, logo, or slogan are you considering trademarking?", ex: "e.g. A new brand name 'Velara' for a health supplement line — assess strength and risk", color: "#7c3aed" },
      { id: "CopyrightGuideEngine", name: "Copyright Guide", icon: "©️", tagline: "Rights architect", desc: "Explains copyright ownership, fair use, work for hire, and licensing in practical terms.", ph: "What copyright question or situation do you need guidance on?", ex: "e.g. A freelancer created a logo for us — do we own it or do they?", color: "#6d28d9" },
      { id: "PatentIdeaEngine", name: "Patent Idea Analyzer", icon: "💡", tagline: "Patent architect", desc: "Analyzes invention ideas for patentability — novelty, non-obviousness, and prior art considerations.", ph: "Describe your invention or process innovation", ex: "e.g. A physical device that uses ambient temperature differential to charge small electronics", color: "#7c3aed" },
      { id: "TradeSecretEngine", name: "Trade Secret Protection", icon: "🔒", tagline: "Secret architect", desc: "Designs trade secret protection strategies — what qualifies and how to protect it.", ph: "What confidential business information are you trying to protect?", ex: "e.g. Our customer acquisition formula that has 3x the efficiency of industry standard", color: "#6d28d9" },
      { id: "LicensingStrategyEngine", name: "Licensing Strategy", icon: "🤝", tagline: "Licensing architect", desc: "Designs IP licensing strategies — royalty structures, exclusive vs non-exclusive, and territory rights.", ph: "What IP are you licensing and what is the licensing relationship?", ex: "e.g. Licensing our patented medical device design to manufacturers in Southeast Asia", color: "#7c3aed" },
    ],
  },
  {
    id: "privacypolicy", title: "Privacy Policy Studio", icon: "🔐", color: "#dc2626",
    desc: "Privacy policies, terms of service, GDPR compliance, and data governance language.",
    engines: [
      { id: "PrivacyPolicyDraftEngine", name: "Privacy Policy Drafter", icon: "📋", tagline: "Privacy architect", desc: "Drafts privacy policy sections appropriate for your product type and jurisdiction.", ph: "What type of product is this, where are your users, and what data do you collect?", ex: "e.g. A mobile health app collecting biometric and location data from users in the EU and US", color: "#dc2626" },
      { id: "GDPRComplianceEngine", name: "GDPR Compliance Guide", icon: "🇪🇺", tagline: "Compliance architect", desc: "Guides GDPR compliance requirements — lawful bases, data subject rights, and processor agreements.", ph: "What business activity or data practice needs GDPR compliance guidance?", ex: "e.g. We want to use customer email data for behavioral retargeting — what GDPR requirements apply?", color: "#b91c1c" },
      { id: "TermsOfServiceDraftEngine", name: "Terms of Service Drafter", icon: "📄", tagline: "Terms architect", desc: "Drafts terms of service appropriate for your platform type and user relationship.", ph: "What type of platform and what user behaviors need to be governed?", ex: "e.g. A social platform where users create content and we license it — what terms protect us and them?", color: "#dc2626" },
      { id: "DataRetentionEngine", name: "Data Retention Policy", icon: "🗄️", tagline: "Retention architect", desc: "Designs data retention policies aligned with legal requirements and operational needs.", ph: "What types of data do you store and what regulations apply to your industry?", ex: "e.g. A healthcare SaaS platform storing patient records subject to HIPAA", color: "#b91c1c" },
      { id: "CookiePolicyEngine", name: "Cookie Policy", icon: "🍪", tagline: "Cookie architect", desc: "Drafts cookie policies and consent frameworks compliant with GDPR and ePrivacy requirements.", ph: "What cookies does your website use and where are your users?", ex: "e.g. E-commerce site using analytics, advertising, and functional cookies with EU and US customers", color: "#dc2626" },
    ],
  },

  // ── Education & Teaching ──────────────────────────────────────────────────
  {
    id: "lessonplanner", title: "Lesson Planner", icon: "📚", color: "#0369a1",
    desc: "Lesson plans, learning objectives, activities, and teaching strategies.",
    engines: [
      { id: "LessonPlanEngine", name: "Lesson Plan Builder", icon: "📋", tagline: "Learning architect", desc: "Builds complete lesson plans with objectives, hook, instruction, practice, and assessment.", ph: "What subject, grade level, and learning objective are you planning?", ex: "e.g. A 50-minute 8th grade lesson on the causes of World War I for students who've never studied it", color: "#0369a1" },
      { id: "LearningObjectiveEngine", name: "Learning Objective Writer", icon: "🎯", tagline: "Objective architect", desc: "Writes Bloom's taxonomy-aligned learning objectives at appropriate cognitive levels.", ph: "What content and what level of understanding do you want students to reach?", ex: "e.g. Students should leave understanding photosynthesis well enough to explain it, apply it, and analyze it", color: "#0284c7" },
      { id: "ActivityDesignEngine", name: "Activity Designer", icon: "🎮", tagline: "Activity architect", desc: "Designs classroom activities — discussion, simulation, problem-solving — aligned to learning goals.", ph: "What learning objective and what student engagement style works for your class?", ex: "e.g. An activity that helps high school students understand how propaganda works without feeling lectured at", color: "#0369a1" },
      { id: "DifferentiationEngine", name: "Differentiation Strategies", icon: "🔀", tagline: "Differentiation architect", desc: "Designs differentiation strategies for diverse learners in the same classroom.", ph: "What lesson content and what range of learner needs do you have in your class?", ex: "e.g. A class with advanced readers, English language learners, and 2 students with IEPs — same lesson on fractions", color: "#0284c7" },
      { id: "AssessmentDesignEngine", name: "Assessment Designer", icon: "✅", tagline: "Assessment architect", desc: "Designs assessments — formative and summative — aligned to learning objectives and student level.", ph: "What learning objectives and student context should this assessment measure?", ex: "e.g. Assess whether 5th graders can apply the water cycle concept to real-world weather events", color: "#0369a1" },
    ],
  },
  {
    id: "curriculumdesigner", title: "Curriculum Designer", icon: "🎓", color: "#7c3aed",
    desc: "Course design, curriculum mapping, learning pathways, and instructional frameworks.",
    engines: [
      { id: "CourseDesignEngine", name: "Course Designer", icon: "🗺️", tagline: "Course architect", desc: "Designs complete course structures with modules, sequence, objectives, and learning outcomes.", ph: "What subject, audience, and learning outcomes should this course achieve?", ex: "e.g. An 8-week online course on negotiation for mid-career professionals who negotiate daily but feel unprepared", color: "#7c3aed" },
      { id: "CurriculumMapEngine", name: "Curriculum Map", icon: "🗺️", tagline: "Map architect", desc: "Creates curriculum maps with scope and sequence across grade levels or course sequences.", ph: "What subject, grade range, and learning progression need to be mapped?", ex: "e.g. Map mathematics learning progression from 6th through 12th grade aligned to career readiness", color: "#6d28d9" },
      { id: "LearningPathwayEngine", name: "Learning Pathway", icon: "🛤️", tagline: "Pathway architect", desc: "Designs personalized learning pathways for self-directed learners with prerequisite mapping.", ph: "What mastery goal and starting knowledge level is this pathway for?", ex: "e.g. A pathway from zero programming knowledge to being able to build and deploy a web application", color: "#7c3aed" },
      { id: "InstructionalFrameworkEngine", name: "Instructional Framework", icon: "🏛️", tagline: "Framework architect", desc: "Selects and applies instructional design frameworks — UDL, backwards design, 5E — to course design.", ph: "What course are you designing and what learner challenges do you anticipate?", ex: "e.g. A corporate training on inclusive leadership for managers who think they're already inclusive", color: "#6d28d9" },
      { id: "CompetencyFrameworkEngine", name: "Competency Framework", icon: "✅", tagline: "Competency architect", desc: "Designs competency frameworks with observable behaviors, proficiency levels, and assessment criteria.", ph: "What role or domain needs a competency framework?", ex: "e.g. A competency framework for data analysts at three career levels — analyst, senior, lead", color: "#7c3aed" },
    ],
  },
];

// ── Generator ────────────────────────────────────────────────────────────────
function generateAppFile(spec: AppSpec): string {
  const engines = spec.engines.map(e => `    {
      id: "${e.id}",
      name: "${e.name}",
      icon: "${e.icon}",
      tagline: "${e.tagline}",
      description: "${e.desc.replace(/"/g, '\\"')}",
      placeholder: "${e.ph.replace(/"/g, '\\"')}",
      example: "${e.ex.replace(/"/g, '\\"')}",
      color: "${e.color}",
    }`).join(",\n");

  const seriesStr = spec.series ? `,
  series: [
${spec.series.map(s => `    {
      id: "${s.id}",
      name: "${s.name}",
      icon: "${s.icon}",
      description: "${s.desc.replace(/"/g, '\\"')}",
      engines: ${JSON.stringify(s.engines)},
    }`).join(",\n")}
  ]` : "";

  const componentName = spec.title.replace(/[^a-zA-Z0-9]/g, "") + "App";
  return `// Auto-generated app — ${spec.title}
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "${spec.id}",
  title: "${spec.title}",
  icon: "${spec.icon}",
  color: "${spec.color}",
  description: "${spec.desc.replace(/"/g, '\\"')}",
  engines: [
${engines}
  ]${seriesStr},
};

export function ${componentName}() {
  return <GenericEngineApp config={CONFIG} />;
}
`;
}

mkdirSync(APPS_DIR, { recursive: true });
let generated = 0;
for (const spec of APPS) {
  const componentName = spec.title.replace(/[^a-zA-Z0-9]/g, "") + "App";
  const filename = `${componentName}.tsx`;
  const filePath = `${APPS_DIR}/${filename}`;
  writeFileSync(filePath, generateAppFile(spec), "utf8");
  generated++;
  console.log(`✓ ${filename}`);
}
console.log(`\n✅ Generated ${generated} app files`);
console.log(`📊 Total new AppIds: ${APPS.map(a => a.id).join(", ")}`);
