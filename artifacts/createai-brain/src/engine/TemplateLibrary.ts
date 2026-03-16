// ─── Template Library — Universal Content Engine ─────────────────────────────
// Structured template data for all supported project types.
// All content is safe, professional, family-friendly, and mock-only.

export type ProjectType =
  | "brochure"
  | "website"
  | "landing-page"
  | "training"
  | "marketing"
  | "product-launch"
  | "game"
  | "comic"
  | "movie"
  | "app-saas"
  | "custom";

export interface TemplateNavItem {
  id: string;
  label: string;
  icon: string;
}

export interface TemplateSectionBlock {
  type: "heading" | "paragraph" | "list" | "feature-grid" | "timeline" | "stepper" | "testimonial" | "cta" | "panel" | "image-placeholder" | "faq" | "roadmap";
  label: string;
  hint: string;
}

export interface TemplateSection {
  id: string;
  label: string;
  icon: string;
  description: string;
  blocks: TemplateSectionBlock[];
}

export interface ProjectTemplate {
  type: ProjectType;
  label: string;
  icon: string;
  color: string;
  gradient: string;
  tagline: string;
  description: string;
  layoutMode: "marketing" | "document" | "creative" | "interactive";
  safetyNote?: string;
  navItems: TemplateNavItem[];
  sections: TemplateSection[];
  tourSteps: { title: string; body: string }[];
  suggestedModules: string[];
}

// ─── Template Definitions ─────────────────────────────────────────────────────

const BROCHURE_TEMPLATE: ProjectTemplate = {
  type: "brochure",
  label: "Brochure", icon: "🗂️", color: "#5856D6", gradient: "from-indigo-600 via-purple-600 to-violet-700",
  tagline: "Professional brochure — print and digital ready",
  description: "A polished product or service brochure with key features, benefits, and a strong call to action.",
  layoutMode: "marketing",
  navItems: [
    { id: "cover", label: "Cover", icon: "🎨" },
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "features", label: "Features", icon: "✨" },
    { id: "benefits", label: "Benefits", icon: "🏆" },
    { id: "contact", label: "Contact & CTA", icon: "📞" },
  ],
  sections: [
    { id: "cover", label: "Cover Page", icon: "🎨", description: "The front cover with headline and visual", blocks: [
      { type: "image-placeholder", label: "Cover Visual", hint: "Hero image or illustration representing the product/service" },
      { type: "heading", label: "Main Headline", hint: "Bold, benefit-driven headline" },
      { type: "paragraph", label: "Tagline", hint: "One-sentence value proposition" },
    ]},
    { id: "overview", label: "Overview", icon: "📋", description: "Who you are and what you offer", blocks: [
      { type: "paragraph", label: "About Section", hint: "2-3 paragraphs about the company and offering" },
      { type: "list", label: "Key Highlights", hint: "3-5 bullet points summarizing the value" },
    ]},
    { id: "features", label: "Features", icon: "✨", description: "Core features and services", blocks: [
      { type: "feature-grid", label: "Feature Grid", hint: "6 features with icons, titles, and 1-line descriptions" },
    ]},
    { id: "benefits", label: "Benefits", icon: "🏆", description: "What customers gain", blocks: [
      { type: "list", label: "Key Benefits", hint: "5-7 specific, outcome-focused benefits" },
      { type: "testimonial", label: "Client Quote", hint: "One strong client testimonial (mock)" },
    ]},
    { id: "contact", label: "Contact & CTA", icon: "📞", description: "Call to action and contact information", blocks: [
      { type: "cta", label: "Primary CTA", hint: "Strong call to action with button copy and offer" },
      { type: "paragraph", label: "Contact Details", hint: "Website, email, phone, social (all mock)" },
    ]},
  ],
  tourSteps: [
    { title: "Welcome to your Brochure", body: "This is your brochure builder. Navigate sections using the menu on the left." },
    { title: "Edit the Cover", body: "Start with the Cover section to set your headline and visual direction." },
    { title: "Add Your Features", body: "The Features grid supports 6 items — each with an icon, title, and description." },
    { title: "Finish with a CTA", body: "The Contact & CTA section closes the brochure with a clear next step for your reader." },
  ],
  suggestedModules: ["Cover Page", "Overview", "Feature Grid", "Benefits", "Client Testimonials", "CTA Section"],
};

const WEBSITE_TEMPLATE: ProjectTemplate = {
  type: "website",
  label: "Website", icon: "🌐", color: "#007AFF", gradient: "from-blue-600 via-blue-700 to-cyan-700",
  tagline: "Full marketing website — homepage to pricing",
  description: "A complete multi-section website covering your brand story, product or service, social proof, and conversion.",
  layoutMode: "marketing",
  navItems: [
    { id: "hero", label: "Hero", icon: "🚀" },
    { id: "about", label: "About", icon: "🏢" },
    { id: "features", label: "Features", icon: "✨" },
    { id: "proof", label: "Social Proof", icon: "⭐" },
    { id: "pricing", label: "Pricing", icon: "💳" },
    { id: "cta", label: "CTA", icon: "📣" },
  ],
  sections: [
    { id: "hero", label: "Hero Section", icon: "🚀", description: "The first thing visitors see", blocks: [
      { type: "heading", label: "Hero Headline", hint: "Bold, benefit-first headline (5-10 words)" },
      { type: "paragraph", label: "Sub-headline", hint: "1-2 sentences expanding on the headline promise" },
      { type: "cta", label: "Primary Button", hint: "CTA button copy and supporting text" },
      { type: "image-placeholder", label: "Hero Visual", hint: "Product screenshot, illustration, or lifestyle image" },
    ]},
    { id: "about", label: "About", icon: "🏢", description: "Your mission and story", blocks: [
      { type: "paragraph", label: "Brand Story", hint: "2-3 paragraphs about who you are and why you exist" },
      { type: "list", label: "Core Values", hint: "3-4 company values with short descriptions" },
    ]},
    { id: "features", label: "Features", icon: "✨", description: "What your product/service does", blocks: [
      { type: "feature-grid", label: "Feature Grid", hint: "6 features — icon, title, description" },
    ]},
    { id: "proof", label: "Social Proof", icon: "⭐", description: "Why people trust you", blocks: [
      { type: "testimonial", label: "Testimonials", hint: "3 mock testimonials — name, role, company, quote" },
      { type: "list", label: "Trust Signals", hint: "Logos, stats, awards, or certifications (mock)" },
    ]},
    { id: "pricing", label: "Pricing", icon: "💳", description: "Plans and value tiers", blocks: [
      { type: "panel", label: "Pricing Tiers", hint: "3 tiers — Starter, Pro, Enterprise — with mock prices and feature lists" },
    ]},
    { id: "cta", label: "Conversion CTA", icon: "📣", description: "Final conversion section", blocks: [
      { type: "cta", label: "Bottom CTA", hint: "Closing offer, urgency, and primary button" },
    ]},
  ],
  tourSteps: [
    { title: "Your Website Blueprint", body: "Navigate between sections using the menu. Each section builds toward a conversion." },
    { title: "Start with the Hero", body: "The Hero section is the most important — make the headline clear and benefit-led." },
    { title: "Build Social Proof", body: "Add testimonials, stats, and logos to build credibility with visitors." },
    { title: "Close with Pricing + CTA", body: "Make pricing clear and simple, then end with a strong call to action." },
  ],
  suggestedModules: ["Hero Section", "About / Mission", "Feature Grid", "Testimonials", "Pricing Tiers", "FAQ", "Bottom CTA"],
};

const LANDING_PAGE_TEMPLATE: ProjectTemplate = {
  type: "landing-page",
  label: "Landing Page", icon: "🎯", color: "#FF2D55", gradient: "from-pink-600 via-rose-600 to-red-600",
  tagline: "Focused conversion page — one goal, maximum impact",
  description: "A single-goal landing page optimized for conversions. No distractions — just a clear offer and a compelling reason to act.",
  layoutMode: "marketing",
  navItems: [
    { id: "hero", label: "Hero", icon: "🎯" },
    { id: "benefits", label: "Benefits", icon: "✅" },
    { id: "proof", label: "Proof", icon: "⭐" },
    { id: "offer", label: "Offer", icon: "💡" },
    { id: "cta", label: "CTA", icon: "📣" },
  ],
  sections: [
    { id: "hero", label: "Hero — Above the Fold", icon: "🎯", description: "The first screen — make the promise clear", blocks: [
      { type: "heading", label: "Headline", hint: "Outcome-focused headline — what will they get?" },
      { type: "paragraph", label: "Sub-headline", hint: "Reinforce the promise — who is this for?" },
      { type: "cta", label: "Primary CTA Button", hint: "Action-focused CTA — 'Get Started Free', 'Download Now', etc." },
    ]},
    { id: "benefits", label: "Benefits", icon: "✅", description: "Why they should care", blocks: [
      { type: "list", label: "Core Benefits", hint: "5 outcome-focused benefits with icons" },
    ]},
    { id: "proof", label: "Proof & Trust", icon: "⭐", description: "Evidence that it works", blocks: [
      { type: "testimonial", label: "Social Proof", hint: "2-3 testimonials + a key stat (mock)" },
    ]},
    { id: "offer", label: "The Offer", icon: "💡", description: "Exactly what they get", blocks: [
      { type: "list", label: "What's Included", hint: "List everything in the offer — be specific" },
      { type: "panel", label: "Guarantee / Risk Removal", hint: "What removes their hesitation?" },
    ]},
    { id: "cta", label: "Final CTA", icon: "📣", description: "Last chance to convert", blocks: [
      { type: "cta", label: "Closing CTA", hint: "Repeat the offer, add urgency, single button" },
    ]},
  ],
  tourSteps: [
    { title: "Landing Page Focus", body: "Landing pages have ONE goal. Every section exists to drive the visitor to your CTA." },
    { title: "Hero = First Impression", body: "You have 3 seconds. Make the headline say exactly what they get and why it matters." },
    { title: "Remove Every Objection", body: "Benefits, proof, and the offer section all exist to remove hesitation." },
    { title: "One Button, Repeated", body: "Repeat the same CTA button at the top, middle, and bottom. Never give two options." },
  ],
  suggestedModules: ["Hero Headline", "Sub-headline", "Primary CTA", "Benefits List", "Testimonials", "Offer Breakdown", "Final CTA"],
};

const TRAINING_TEMPLATE: ProjectTemplate = {
  type: "training",
  label: "Training / LMS", icon: "🎓", color: "#34C759", gradient: "from-green-600 via-emerald-600 to-teal-700",
  tagline: "Structured training program — learn, practice, progress",
  description: "A complete training module or course with lessons, exercises, assessments, and progress tracking.",
  layoutMode: "interactive",
  navItems: [
    { id: "overview", label: "Course Overview", icon: "📋" },
    { id: "modules", label: "Modules", icon: "📚" },
    { id: "lessons", label: "Lessons", icon: "📖" },
    { id: "practice", label: "Practice", icon: "✏️" },
    { id: "assessment", label: "Assessment", icon: "📝" },
    { id: "progress", label: "Progress", icon: "📊" },
  ],
  sections: [
    { id: "overview", label: "Course Overview", icon: "📋", description: "What learners will achieve", blocks: [
      { type: "heading", label: "Course Title & Description", hint: "What is this course and who is it for?" },
      { type: "list", label: "Learning Objectives", hint: "5-7 specific skills or outcomes learners gain" },
      { type: "timeline", label: "Course Structure", hint: "Module breakdown with estimated time per module" },
    ]},
    { id: "modules", label: "Modules", icon: "📚", description: "Course structure and content areas", blocks: [
      { type: "stepper", label: "Module Sequence", hint: "5-6 modules — title, description, lessons count" },
    ]},
    { id: "lessons", label: "Lessons", icon: "📖", description: "Individual lesson content", blocks: [
      { type: "paragraph", label: "Lesson Content", hint: "Detailed lesson text — concept, examples, key points" },
      { type: "list", label: "Key Takeaways", hint: "3-5 bullet points per lesson" },
      { type: "image-placeholder", label: "Visual Aid", hint: "Diagram, infographic, or illustration" },
    ]},
    { id: "practice", label: "Practice", icon: "✏️", description: "Exercises and activities", blocks: [
      { type: "list", label: "Practice Activities", hint: "3-5 exercises with instructions and expected outcomes" },
      { type: "panel", label: "Scenario Practice", hint: "Real-world scenario for learners to apply knowledge" },
    ]},
    { id: "assessment", label: "Assessment", icon: "📝", description: "Knowledge check and quiz", blocks: [
      { type: "faq", label: "Quiz Questions", hint: "5-8 multiple choice or scenario-based questions (mock)" },
    ]},
    { id: "progress", label: "Progress Tracker", icon: "📊", description: "Track completion and performance", blocks: [
      { type: "timeline", label: "Completion Milestones", hint: "Progress milestones with badges or recognition" },
    ]},
  ],
  tourSteps: [
    { title: "Your Training Module", body: "This template structures a complete training program from overview to assessment." },
    { title: "Start with Objectives", body: "Clear learning objectives tell learners exactly what they'll be able to do after completing the course." },
    { title: "Build the Modules", body: "Organize content into 5-6 focused modules. Each module should have a single clear topic." },
    { title: "End with Assessment", body: "Assessment reinforces learning and gives learners confidence in what they've learned." },
  ],
  suggestedModules: ["Course Overview", "Learning Objectives", "Module Sequence", "Lesson Content", "Practice Activities", "Quiz/Assessment", "Progress Tracking", "Certificates"],
};

const MARKETING_TEMPLATE: ProjectTemplate = {
  type: "marketing",
  label: "Marketing System", icon: "📣", color: "#FF9500", gradient: "from-orange-500 via-amber-600 to-yellow-600",
  tagline: "Complete marketing campaign — from brief to launch",
  description: "A full marketing system covering brand positioning, campaign strategy, email sequences, ad copy, and content calendar.",
  layoutMode: "marketing",
  navItems: [
    { id: "strategy", label: "Strategy", icon: "🎯" },
    { id: "campaigns", label: "Campaigns", icon: "🚀" },
    { id: "email", label: "Email", icon: "📧" },
    { id: "ads", label: "Ad Copy", icon: "📱" },
    { id: "content", label: "Content", icon: "📝" },
    { id: "analytics", label: "Analytics", icon: "📊" },
  ],
  sections: [
    { id: "strategy", label: "Brand Strategy", icon: "🎯", description: "Positioning and messaging framework", blocks: [
      { type: "paragraph", label: "Brand Positioning Statement", hint: "Target audience, key benefit, differentiator" },
      { type: "list", label: "Messaging Pillars", hint: "3-4 core messages the brand stands for" },
      { type: "list", label: "Tone of Voice", hint: "5 adjectives that describe how the brand sounds" },
    ]},
    { id: "campaigns", label: "Campaigns", icon: "🚀", description: "Active marketing campaigns", blocks: [
      { type: "feature-grid", label: "Campaign Cards", hint: "3-4 campaigns — type, goal, channels, status" },
      { type: "timeline", label: "Campaign Timeline", hint: "Month-by-month campaign calendar" },
    ]},
    { id: "email", label: "Email Sequences", icon: "📧", description: "Nurture and sales email flows", blocks: [
      { type: "stepper", label: "Welcome Sequence", hint: "5-email welcome series — subject, preview, goal" },
      { type: "panel", label: "Sales Email Template", hint: "Full sales email — subject, body, CTA, P.S." },
    ]},
    { id: "ads", label: "Ad Copy", icon: "📱", description: "Social and search ad creative", blocks: [
      { type: "panel", label: "Facebook / Instagram Ads", hint: "2-3 ad variants — hook, body, CTA" },
      { type: "panel", label: "Google Search Ads", hint: "2-3 headline and description variations" },
    ]},
    { id: "content", label: "Content Calendar", icon: "📝", description: "Organic content plan", blocks: [
      { type: "timeline", label: "30-Day Content Plan", hint: "Daily post schedule — platform, topic, format, caption" },
    ]},
    { id: "analytics", label: "Analytics", icon: "📊", description: "Performance targets and metrics", blocks: [
      { type: "feature-grid", label: "KPI Dashboard", hint: "6 key metrics — current value, target, trend (mock)" },
    ]},
  ],
  tourSteps: [
    { title: "Your Marketing System", body: "This covers every layer of a modern marketing campaign — from strategy to analytics." },
    { title: "Start with Strategy", body: "Positioning and messaging come first. Everything else flows from a clear brand strategy." },
    { title: "Build Your Campaigns", body: "Add campaigns with clear goals and channel selections before creating any content." },
    { title: "Track with Analytics", body: "Define your KPIs upfront — you can't improve what you don't measure." },
  ],
  suggestedModules: ["Brand Strategy", "Campaign Planning", "Email Sequences", "Ad Copy", "Social Calendar", "Analytics Dashboard"],
};

const PRODUCT_LAUNCH_TEMPLATE: ProjectTemplate = {
  type: "product-launch",
  label: "Product Launch", icon: "🚀", color: "#BF5AF2", gradient: "from-purple-600 via-violet-700 to-indigo-700",
  tagline: "Complete product launch — from announcement to sale",
  description: "A structured product launch system covering roadmap, announcement strategy, press kit, launch day plan, and post-launch review.",
  layoutMode: "marketing",
  navItems: [
    { id: "overview", label: "Product Overview", icon: "📋" },
    { id: "roadmap", label: "Roadmap", icon: "🗺️" },
    { id: "announcement", label: "Announcement", icon: "📣" },
    { id: "faq", label: "FAQ", icon: "❓" },
    { id: "presskit", label: "Press Kit", icon: "📰" },
    { id: "launchday", label: "Launch Day", icon: "🚀" },
  ],
  sections: [
    { id: "overview", label: "Product Overview", icon: "📋", description: "What you're launching and why it matters", blocks: [
      { type: "heading", label: "Product Name & Tagline", hint: "Name, tagline, and one-paragraph description" },
      { type: "feature-grid", label: "Core Features", hint: "6 key features that define the product" },
      { type: "list", label: "Target Audience", hint: "Who this is for — primary and secondary audiences" },
    ]},
    { id: "roadmap", label: "Roadmap", icon: "🗺️", description: "Development and release timeline", blocks: [
      { type: "roadmap", label: "Release Phases", hint: "Alpha, Beta, GA phases with dates and milestones" },
      { type: "list", label: "v1.0 Scope", hint: "What's in v1.0 vs what's coming later" },
    ]},
    { id: "announcement", label: "Launch Announcement", icon: "📣", description: "The announcement strategy", blocks: [
      { type: "paragraph", label: "Press Release", hint: "Full press release — headline, dateline, body, boilerplate" },
      { type: "panel", label: "Social Announcement Posts", hint: "LinkedIn, Twitter/X, Instagram launch posts" },
    ]},
    { id: "faq", label: "FAQ", icon: "❓", description: "Anticipated questions and answers", blocks: [
      { type: "faq", label: "Product FAQs", hint: "8-10 frequently asked questions with clear answers" },
    ]},
    { id: "presskit", label: "Press Kit", icon: "📰", description: "Media and press resources", blocks: [
      { type: "list", label: "Press Kit Contents", hint: "What's included — bios, logos, screenshots, fact sheet" },
      { type: "paragraph", label: "Company Boilerplate", hint: "Standard company description for press use (mock)" },
    ]},
    { id: "launchday", label: "Launch Day Plan", icon: "🚀", description: "Minute-by-minute launch day operations", blocks: [
      { type: "stepper", label: "Launch Day Checklist", hint: "Hour-by-hour launch day tasks and owner assignments" },
    ]},
  ],
  tourSteps: [
    { title: "Product Launch Blueprint", body: "This system covers every phase of a successful product launch — from announcement to post-launch." },
    { title: "Define the Product First", body: "Start with the Product Overview — clear features, audience, and positioning before anything else." },
    { title: "Plan the Roadmap", body: "A public roadmap builds anticipation. Define your phases and what's in scope for v1.0." },
    { title: "Prepare Everything", body: "FAQ, press kit, and launch day checklist prevent scrambling when the day arrives." },
  ],
  suggestedModules: ["Product Overview", "Roadmap", "Press Release", "FAQ", "Press Kit", "Launch Day Checklist"],
};

const GAME_TEMPLATE: ProjectTemplate = {
  type: "game",
  label: "Game Design", icon: "🎮", color: "#5856D6", gradient: "from-indigo-600 via-purple-700 to-violet-800",
  tagline: "Game concept & design document — story to mechanics",
  description: "A complete safe game concept covering core gameplay, story and world, characters, level design, and marketing. All content is family-friendly and conceptual.",
  layoutMode: "creative",
  safetyNote: "All game content is family-friendly and conceptual. No violent, harmful, or unsafe content.",
  navItems: [
    { id: "concept", label: "Concept", icon: "💡" },
    { id: "mechanics", label: "Mechanics", icon: "⚙️" },
    { id: "story", label: "Story & World", icon: "📖" },
    { id: "characters", label: "Characters", icon: "👤" },
    { id: "levels", label: "Levels", icon: "🗺️" },
    { id: "marketing", label: "Marketing", icon: "📣" },
  ],
  sections: [
    { id: "concept", label: "Game Concept", icon: "💡", description: "Core concept and pitch", blocks: [
      { type: "heading", label: "Game Title & Logline", hint: "Title and one-sentence pitch — genre, platform, core hook" },
      { type: "paragraph", label: "Concept Overview", hint: "3-paragraph overview — what it is, what makes it unique, target audience" },
      { type: "list", label: "Unique Selling Points", hint: "5 things that make this game different and compelling" },
    ]},
    { id: "mechanics", label: "Core Mechanics", icon: "⚙️", description: "How the player interacts with the game", blocks: [
      { type: "stepper", label: "Core Game Loop", hint: "The primary gameplay loop in 5-7 steps — action → feedback → reward" },
      { type: "feature-grid", label: "Mechanic Modules", hint: "6 key mechanics — name, description, player benefit" },
    ]},
    { id: "story", label: "Story & World", icon: "📖", description: "The game's narrative and setting", blocks: [
      { type: "paragraph", label: "World Overview", hint: "The game world — setting, tone, lore, key locations" },
      { type: "timeline", label: "Story Arc", hint: "Act 1, 2, 3 structure — setup, conflict, resolution" },
    ]},
    { id: "characters", label: "Characters", icon: "👤", description: "Key characters and their roles", blocks: [
      { type: "panel", label: "Protagonist", hint: "Name, backstory, abilities, appearance, character arc (safe, family-friendly)" },
      { type: "panel", label: "Supporting Characters", hint: "3 key NPCs — role, personality, appearance, purpose in story" },
    ]},
    { id: "levels", label: "Level Design", icon: "🗺️", description: "Level structure and progression", blocks: [
      { type: "stepper", label: "Level Progression", hint: "First 5 levels — theme, challenge type, new mechanic introduced, goal" },
    ]},
    { id: "marketing", label: "Game Marketing", icon: "📣", description: "How to position and sell the game", blocks: [
      { type: "list", label: "Store Page Copy", hint: "3 taglines + full store description (Steam/App Store style)" },
      { type: "panel", label: "Social Campaign", hint: "Twitter/X, TikTok, Discord launch content plan" },
    ]},
  ],
  tourSteps: [
    { title: "Game Design Doc", body: "This template helps you build a complete, family-friendly game concept from idea to market." },
    { title: "Start with the Concept", body: "The concept section is your pitch — make it clear, exciting, and easy to understand." },
    { title: "Design the Core Loop", body: "The core game loop is the heartbeat of any game. Action → Feedback → Reward." },
    { title: "Build Characters Last", body: "Once the world and mechanics are clear, characters become easier to design with purpose." },
  ],
  suggestedModules: ["Game Concept", "Core Mechanics", "Core Loop", "World/Setting", "Characters", "Level Design", "Economy", "Art Direction", "Store Page"],
};

const COMIC_TEMPLATE: ProjectTemplate = {
  type: "comic",
  label: "Comic / Graphic Novel", icon: "📖", color: "#FF9500", gradient: "from-orange-500 via-amber-500 to-yellow-500",
  tagline: "Comic series concept — panels, characters, story arcs",
  description: "A safe, family-friendly comic series outline with story structure, character designs, panel scripts, and marketing copy.",
  layoutMode: "creative",
  safetyNote: "All comic content is safe and family-friendly. No violent, harmful, or inappropriate content.",
  navItems: [
    { id: "concept", label: "Series Concept", icon: "💡" },
    { id: "characters", label: "Characters", icon: "👤" },
    { id: "story", label: "Story Arc", icon: "📖" },
    { id: "panels", label: "Panels", icon: "🖼️" },
    { id: "artdirection", label: "Art Direction", icon: "🎨" },
    { id: "marketing", label: "Marketing", icon: "📣" },
  ],
  sections: [
    { id: "concept", label: "Series Concept", icon: "💡", description: "The big idea and premise", blocks: [
      { type: "heading", label: "Series Title & Logline", hint: "Title and one-sentence pitch — genre, tone, hook" },
      { type: "paragraph", label: "Series Overview", hint: "3-paragraph overview — world, central conflict, what makes it unique" },
    ]},
    { id: "characters", label: "Characters", icon: "👤", description: "Heroes, villains, and supporting cast", blocks: [
      { type: "panel", label: "Protagonist Design", hint: "Name, appearance, abilities/skills, backstory, personality, visual notes" },
      { type: "panel", label: "Antagonist Design", hint: "Name, appearance, motivation, visual design, role in story" },
      { type: "panel", label: "Supporting Cast", hint: "3 key characters — role, personality, relationship to protagonist" },
    ]},
    { id: "story", label: "Story Arc", icon: "📖", description: "Issue structure and narrative arc", blocks: [
      { type: "timeline", label: "3-Arc Story Structure", hint: "Setup arc, rising conflict arc, climax & resolution arc — with key story beats" },
      { type: "stepper", label: "Issue Breakdown", hint: "6 issues — title, key events, cliffhanger, character moment" },
    ]},
    { id: "panels", label: "Panel Scripts", icon: "🖼️", description: "Sample panel descriptions and dialogue", blocks: [
      { type: "panel", label: "Opening Sequence (Panels 1-4)", hint: "Visual — [scene]. Caption: [narration]. Dialogue: [character]: '[text]'" },
      { type: "panel", label: "Action Sequence (Panels 5-8)", hint: "Dynamic panels — motion, sound effects, key dialogue" },
    ]},
    { id: "artdirection", label: "Art Direction", icon: "🎨", description: "Visual style and design language", blocks: [
      { type: "list", label: "Visual Style Notes", hint: "Color palette, line weight, panel layout style, lettering approach" },
      { type: "image-placeholder", label: "Style Reference", hint: "Visual mood board description" },
    ]},
    { id: "marketing", label: "Marketing", icon: "📣", description: "Launch and promotion plan", blocks: [
      { type: "paragraph", label: "Solicitation Copy", hint: "Publisher-style solicitation for Issue #1" },
      { type: "panel", label: "Social Media Launch", hint: "Launch announcement for Twitter/X, Instagram, and Discord" },
    ]},
  ],
  tourSteps: [
    { title: "Your Comic Series", body: "This template builds a complete, safe comic series — from concept to panel scripts." },
    { title: "Start with the Concept", body: "The series concept is your pitch. Make it clear, exciting, and family-friendly." },
    { title: "Design Characters Next", body: "Strong characters drive great comics. Build the protagonist and antagonist before plotting." },
    { title: "Then the Story Arc", body: "Once you know who the characters are, the story arc comes naturally." },
  ],
  suggestedModules: ["Series Concept", "Character Design", "Story Arc", "Issue Breakdown", "Panel Scripts", "Art Direction", "Solicitation Copy"],
};

const MOVIE_TEMPLATE: ProjectTemplate = {
  type: "movie",
  label: "Movie / Film", icon: "🎬", color: "#FF2D55", gradient: "from-rose-600 via-red-600 to-orange-600",
  tagline: "Film treatment & production plan — concept to screen",
  description: "A complete safe film treatment covering logline, synopsis, scenes, characters, script excerpt, and marketing copy. All content is family-friendly.",
  layoutMode: "creative",
  safetyNote: "All film content is family-friendly and conceptual. Not for professional production without expert involvement.",
  navItems: [
    { id: "concept", label: "Concept", icon: "💡" },
    { id: "story", label: "Story", icon: "📖" },
    { id: "scenes", label: "Scenes", icon: "🎭" },
    { id: "characters", label: "Characters", icon: "👤" },
    { id: "script", label: "Script", icon: "📄" },
    { id: "production", label: "Production", icon: "🎬" },
    { id: "marketing", label: "Marketing", icon: "📣" },
  ],
  sections: [
    { id: "concept", label: "Film Concept", icon: "💡", description: "Logline and positioning", blocks: [
      { type: "heading", label: "Title & Logline", hint: "Title and one-sentence logline — protagonist, goal, stakes, opponent" },
      { type: "paragraph", label: "Premise Overview", hint: "2-3 paragraph treatment of the full story" },
      { type: "list", label: "Thematic Elements", hint: "3-5 themes the film explores" },
    ]},
    { id: "story", label: "Story Structure", icon: "📖", description: "Three-act structure", blocks: [
      { type: "timeline", label: "Three-Act Structure", hint: "Act 1 (Setup), Act 2 (Confrontation), Act 3 (Resolution) with key plot beats" },
    ]},
    { id: "scenes", label: "Key Scenes", icon: "🎭", description: "Scene descriptions and beats", blocks: [
      { type: "panel", label: "Opening Scene", hint: "Setting, atmosphere, action, dialogue, mood" },
      { type: "panel", label: "Inciting Incident", hint: "The event that launches the story into motion" },
      { type: "panel", label: "Climax Scene", hint: "The most dramatic, high-stakes moment" },
      { type: "panel", label: "Resolution", hint: "How the story ends and arcs resolve" },
    ]},
    { id: "characters", label: "Characters", icon: "👤", description: "Cast of characters", blocks: [
      { type: "panel", label: "Protagonist", hint: "Name, backstory, wants vs needs, arc, visual description" },
      { type: "panel", label: "Antagonist / Conflict Force", hint: "Name, motivation, how they challenge the protagonist" },
      { type: "panel", label: "Supporting Cast", hint: "3 key characters — role, relationship, function in story" },
    ]},
    { id: "script", label: "Script Excerpt", icon: "📄", description: "Formatted script pages", blocks: [
      { type: "panel", label: "Scene — Formatted Script", hint: "INT./EXT. LOCATION — TIME. Action lines. CHARACTER: 'Dialogue.'" },
    ]},
    { id: "production", label: "Production Vision", icon: "🎬", description: "Visual and technical direction", blocks: [
      { type: "list", label: "Director's Vision", hint: "Visual style, color palette, tone, cinematography approach" },
      { type: "list", label: "Production Notes", hint: "Key locations, shoot requirements, technical considerations (conceptual)" },
    ]},
    { id: "marketing", label: "Marketing", icon: "📣", description: "Promotional materials", blocks: [
      { type: "list", label: "Taglines", hint: "3 tagline options with different emotional angles" },
      { type: "panel", label: "Trailer Script", hint: "60-90 second trailer with beats, music cues, and VO" },
      { type: "panel", label: "Social Campaign", hint: "Instagram, TikTok, YouTube launch content plan" },
    ]},
  ],
  tourSteps: [
    { title: "Your Film Treatment", body: "This template builds a complete, family-friendly film concept from logline to trailer." },
    { title: "Logline First", body: "A great logline is your film's DNA. Protagonist + goal + stakes + antagonist in one sentence." },
    { title: "Structure Before Scenes", body: "Build the three-act structure before writing individual scenes. Know where you're going." },
    { title: "Characters Drive Story", body: "Characters with clear wants, needs, and arcs create stories audiences care about." },
  ],
  suggestedModules: ["Logline", "Three-Act Structure", "Key Scenes", "Character Profiles", "Script Excerpt", "Director Vision", "Trailer Script"],
};

const APP_SAAS_TEMPLATE: ProjectTemplate = {
  type: "app-saas",
  label: "App / SaaS", icon: "💻", color: "#007AFF", gradient: "from-blue-600 via-blue-700 to-indigo-800",
  tagline: "Full software product — spec to launch",
  description: "A complete SaaS or app product specification covering features, user flows, technical architecture, pricing, and marketing. All content is structural and mock.",
  layoutMode: "interactive",
  navItems: [
    { id: "overview", label: "Product Overview", icon: "📋" },
    { id: "features", label: "Features", icon: "✨" },
    { id: "workflows", label: "Workflows", icon: "⚙️" },
    { id: "architecture", label: "Architecture", icon: "🏗️" },
    { id: "pricing", label: "Pricing", icon: "💳" },
    { id: "marketing", label: "Marketing", icon: "📣" },
    { id: "docs", label: "Documentation", icon: "📄" },
  ],
  sections: [
    { id: "overview", label: "Product Overview", icon: "📋", description: "What the product does and who it's for", blocks: [
      { type: "heading", label: "Product Name & Positioning", hint: "Name, tagline, target audience, key problem solved" },
      { type: "list", label: "Core Value Propositions", hint: "3-5 key reasons customers choose this product" },
      { type: "feature-grid", label: "Key Metrics at Launch", hint: "6 KPIs the product tracks — mock values" },
    ]},
    { id: "features", label: "Features", icon: "✨", description: "Full feature specification", blocks: [
      { type: "feature-grid", label: "Feature Modules", hint: "6-8 modules — name, description, key user action" },
    ]},
    { id: "workflows", label: "Workflows", icon: "⚙️", description: "Primary user journeys and workflows", blocks: [
      { type: "stepper", label: "Onboarding Flow", hint: "New user onboarding — 5-7 steps from signup to first value" },
      { type: "stepper", label: "Primary Workflow", hint: "The main job-to-be-done — step-by-step user flow" },
    ]},
    { id: "architecture", label: "Architecture", icon: "🏗️", description: "Technical and data design (conceptual)", blocks: [
      { type: "list", label: "Data Model", hint: "5-7 core entities — name, key fields, relationships" },
      { type: "list", label: "API Overview", hint: "5-6 key endpoints — method, path, purpose (mock)" },
      { type: "list", label: "Integrations", hint: "3rd-party integrations — tool, purpose, connection type" },
    ]},
    { id: "pricing", label: "Pricing", icon: "💳", description: "Plans, tiers, and monetization", blocks: [
      { type: "panel", label: "Pricing Tiers", hint: "3 plans — Starter, Pro, Enterprise — features and mock prices" },
    ]},
    { id: "marketing", label: "Marketing", icon: "📣", description: "Go-to-market content", blocks: [
      { type: "list", label: "Hero Copy", hint: "Headline, sub-headline, and 3 bullet benefits" },
      { type: "testimonial", label: "Social Proof", hint: "3 mock testimonials from target personas" },
    ]},
    { id: "docs", label: "Documentation", icon: "📄", description: "User-facing docs", blocks: [
      { type: "stepper", label: "Getting Started Guide", hint: "5-7 step quick start for new users" },
      { type: "faq", label: "FAQ", hint: "8-10 common questions with clear answers" },
    ]},
  ],
  tourSteps: [
    { title: "Your SaaS Blueprint", body: "This template covers the full product specification — from features to go-to-market." },
    { title: "Start with the Overview", body: "The product overview defines who this is for and what problem it solves. Everything else flows from this." },
    { title: "Build Workflows", body: "Workflows show how users actually use the product. Design these before writing feature specs." },
    { title: "Pricing and Marketing Last", body: "Once you know what the product does and who it's for, pricing and messaging become clear." },
  ],
  suggestedModules: ["Product Overview", "Feature Modules", "Onboarding Flow", "Primary Workflow", "Data Model", "API Overview", "Pricing Tiers", "Marketing Copy", "Documentation"],
};

const CUSTOM_TEMPLATE: ProjectTemplate = {
  type: "custom",
  label: "Custom Creation", icon: "✨", color: "#BF5AF2", gradient: "from-purple-500 via-violet-600 to-fuchsia-700",
  tagline: "Anything you can imagine — structured and built",
  description: "A flexible template that adapts to any creation type. Describe what you need and the system will build the right structure.",
  layoutMode: "interactive",
  navItems: [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "content", label: "Content", icon: "📝" },
    { id: "structure", label: "Structure", icon: "🏗️" },
    { id: "features", label: "Features", icon: "✨" },
    { id: "next", label: "Next Steps", icon: "→" },
  ],
  sections: [
    { id: "overview", label: "Overview", icon: "📋", description: "What this creation is and why it matters", blocks: [
      { type: "heading", label: "Title & Description", hint: "What is this? Who is it for? What problem does it solve?" },
      { type: "list", label: "Key Elements", hint: "5 most important things about this creation" },
    ]},
    { id: "content", label: "Core Content", icon: "📝", description: "The main substance", blocks: [
      { type: "paragraph", label: "Main Content Block", hint: "The primary content — rich, detailed, and specific" },
      { type: "list", label: "Supporting Content", hint: "Additional content blocks and elements" },
    ]},
    { id: "structure", label: "Structure", icon: "🏗️", description: "How everything is organized", blocks: [
      { type: "timeline", label: "Content Structure", hint: "How sections/chapters/modules are ordered and why" },
    ]},
    { id: "features", label: "Features", icon: "✨", description: "Key capabilities or highlights", blocks: [
      { type: "feature-grid", label: "Feature Set", hint: "6 key features, capabilities, or highlights" },
    ]},
    { id: "next", label: "Next Steps", icon: "→", description: "What to build or do next", blocks: [
      { type: "stepper", label: "Action Plan", hint: "5 next steps to develop or expand this creation" },
    ]},
  ],
  tourSteps: [
    { title: "Your Custom Creation", body: "This flexible template adapts to your project. Start with the Overview to set the foundation." },
    { title: "Describe the Overview", body: "Be specific about what this is, who it's for, and what makes it unique." },
    { title: "Build the Content", body: "Add your core content in the sections that make most sense for your type." },
    { title: "Plan Next Steps", body: "The Next Steps section helps you plan how to grow and develop this creation further." },
  ],
  suggestedModules: ["Overview", "Core Content", "Structure", "Feature Set", "Action Plan"],
};

// ─── Template Map ─────────────────────────────────────────────────────────────
export const TEMPLATE_LIBRARY: Record<ProjectType, ProjectTemplate> = {
  "brochure":       BROCHURE_TEMPLATE,
  "website":        WEBSITE_TEMPLATE,
  "landing-page":   LANDING_PAGE_TEMPLATE,
  "training":       TRAINING_TEMPLATE,
  "marketing":      MARKETING_TEMPLATE,
  "product-launch": PRODUCT_LAUNCH_TEMPLATE,
  "game":           GAME_TEMPLATE,
  "comic":          COMIC_TEMPLATE,
  "movie":          MOVIE_TEMPLATE,
  "app-saas":       APP_SAAS_TEMPLATE,
  "custom":         CUSTOM_TEMPLATE,
};

export function getTemplate(type: ProjectType): ProjectTemplate {
  return TEMPLATE_LIBRARY[type] ?? CUSTOM_TEMPLATE;
}

export function getAllTemplates(): ProjectTemplate[] {
  return Object.values(TEMPLATE_LIBRARY);
}
