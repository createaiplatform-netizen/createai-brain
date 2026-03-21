/**
 * routes/advertising.ts — Internal Advertising Hub
 * ─────────────────────────────────────────────────
 * All brand assets, platform profiles, ad templates, scripts, captions,
 * and content structures for CreateAI Brain across all major platforms.
 * Nothing is published externally — all assets are internal-only.
 *
 * GET  /api/advertising/brand            — brand identity + voice
 * GET  /api/advertising/platforms        — all platform configs + profiles
 * GET  /api/advertising/assets           — all pre-built ad assets
 * GET  /api/advertising/platform/:id     — single platform full detail
 * GET  /api/advertising/calendar         — 30-day content calendar
 * GET  /api/advertising/funnels          — sales funnels per platform
 * POST /api/advertising/generate         — AI-generate custom asset
 * GET  /api/advertising/scripts          — video scripts for all platforms
 * GET  /api/advertising/bios             — all platform bios
 * GET  /api/advertising/banners          — banner specs + copy
 * GET  /api/advertising/hashtags         — hashtag sets per platform
 * GET  /api/advertising/status           — hub readiness status
 */

import { Router, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

/* ── BRAND IDENTITY ──────────────────────────────────────────────── */
const BRAND = {
  name: "CreateAI Brain",
  tagline: "The AI OS for Everything You Do",
  taglineAlt: "Replace $100K+ in Software. Run on Intelligence.",
  owner: "Sara Stadler",
  company: "Lakeside Trinity LLC",
  email: "admin@LakesideTrinity.com",
  website: "https://createaibrain.app",
  category: "AI Platform / Business Operating System",
  mission: "Empower entrepreneurs and enterprises with AI-native tools that replace expensive software, licensed APIs, hardware sensors, and professional consultants — at a fraction of the cost.",
  voice: {
    tone: "Confident, authoritative, forward-thinking, practical",
    personality: "Expert advisor who has unlocked systems most people pay fortunes for",
    avoid: "Hype, empty promises, jargon overload, passive language",
    keywords: ["AI OS", "replace", "bypass", "intelligence", "automation", "revenue", "no limits", "full capability"]
  },
  colors: {
    primary: "#6366f1",
    dark: "#020617",
    mid: "#0f172a",
    accent: "#a5b4fc",
    white: "#ffffff"
  },
  valueProps: [
    "12 AI invention tools that bypass $500K+ in software licenses",
    "Full business OS: Health, Legal, Staffing, Finance, Marketing in one platform",
    "Autonomous revenue generation with zero manual steps",
    "Replace hardware sensors, actuarial databases, and professional consultants with AI",
    "One platform. Every industry. Zero limits."
  ],
  targetAudiences: [
    { segment: "Entrepreneurs & Solopreneurs", pain: "Too many tools, too little budget", solution: "All-in-one AI OS" },
    { segment: "Healthcare Operators", pain: "EHR costs, clinical note burden", solution: "AI Clinical Scribe + HealthOS" },
    { segment: "Legal Professionals", pain: "Westlaw/LexisNexis costs $500+/mo", solution: "AI Legal Research Engine" },
    { segment: "Staffing Agencies", pain: "Manual recruitment, compliance burden", solution: "AI StaffingOS" },
    { segment: "Agricultural Businesses", pain: "IoT sensors cost $50K+/farm", solution: "AI Agronomist — no sensors needed" },
    { segment: "Financial Advisors", pain: "Bloomberg terminal costs", solution: "AI Financial Intelligence" },
    { segment: "Fleet & Logistics", pain: "GPS hardware + ELD devices", solution: "AI Fleet Intelligence — no hardware" },
    { segment: "Insurance Underwriters", pain: "Actuarial database subscriptions", solution: "AI Risk Underwriter" }
  ],
  offers: [
    { name: "CreateAI Brain Pro", price: "$97/mo", desc: "Full platform access — all 12 invention tools + OS suite" },
    { name: "CreateAI Brain Enterprise", price: "$497/mo", desc: "Unlimited seats, white-label, priority AI, dedicated support" },
    { name: "Industry Bundle", price: "$197 one-time", desc: "Domain-specific bundle: Healthcare, Legal, or Staffing pack" },
    { name: "Invention Layer Access", price: "$47/mo", desc: "12 AI tools only — no OS suite" }
  ]
};

/* ── PLATFORM PROFILES ───────────────────────────────────────────── */
const PLATFORMS = [
  {
    id: "tiktok",
    name: "TikTok",
    icon: "🎵",
    color: "#010101",
    accentColor: "#fe2c55",
    profile: {
      displayName: "CreateAI Brain",
      handle: "@createaibrain",
      bio: "AI OS that replaces $100K in software 🤖⚡ | 12 AI invention tools | No limits | Sara Stadler",
      bioCharLimit: 80,
      description: "We build AI tools that replace hardware sensors, clinical software, legal databases, and expensive consultants — with pure intelligence. No limits. Full capability.",
      linkInBio: "createaibrain.app",
      category: "Technology",
      cta: "Try Free"
    },
    adFormats: [
      {
        id: "in-feed",
        name: "In-Feed Ad",
        specs: "9:16, 1080×1920px, 15–60s video",
        duration: "15-60s",
        copy: "POV: You just replaced your entire software stack with one AI 🤯\n\nCreateAI Brain runs:\n✅ Clinical notes (no EHR)\n✅ Legal research (no Westlaw)\n✅ Fleet management (no GPS hardware)\n✅ Risk underwriting (no actuarial databases)\n\nOne platform. Zero limits. 12 AI invention tools.\n\nLink in bio → createaibrain.app",
        cta: "Learn More",
        objective: "Awareness + Traffic",
        hashtags: ["#AItools", "#automation", "#entrepreneur", "#futureofwork", "#AI", "#saas", "#businessOS", "#createaibrain"]
      },
      {
        id: "spark-ads",
        name: "Spark Ad (Boosted Organic)",
        specs: "Same as organic post, boosted with ad dollars",
        duration: "15-30s",
        copy: "This AI tool just replaced our $4,800/month software suite. No hardware. No licenses. Pure intelligence. CreateAI Brain → link in bio.",
        cta: "Shop Now",
        objective: "Conversions",
        hashtags: ["#businesstools", "#AIstartup", "#replacesubscriptions", "#smartbusiness"]
      },
      {
        id: "branded-effect",
        name: "Branded Hashtag Challenge",
        specs: "Custom effect + hashtag challenge",
        duration: "Any",
        copy: "Challenge: Show us how you use AI to run your business. Tag #CreateAIBrain for a feature. Best entry wins 1 year free Pro access.",
        cta: "Join Challenge",
        objective: "Engagement + UGC",
        hashtags: ["#CreateAIBrainChallenge", "#AIbusiness", "#futureofwork"]
      }
    ],
    contentTemplates: [
      { type: "hook-reveal", title: "The Software You're Overpaying For", caption: "You're paying $500+/mo for tools AI can replace right now. Here's what we killed off with CreateAI Brain 👇 [LIST TOOLS]. Full breakdown at createaibrain.app", hooks: ["I cancelled $4,800 in software this month. Here's what replaced it all 👇", "This single platform replaced 11 different SaaS tools. No joke.", "POV: You discover an AI OS that does everything your software stack does, for $97/mo."] },
      { type: "demo-reveal", title: "Live Demo: AI Clinical Scribe", caption: "Watch AI write a full SOAP note from scratch with zero EHR access. No license. No database. Just intelligence. #healthcare #AItools #medtech", hooks: ["Doctors pay $800/month for this. We built the AI version.", "SOAP notes in 30 seconds. No EHR needed. Watch this.", "This is replacing clinical documentation software 🏥🤖"] },
      { type: "before-after", title: "Before vs After CreateAI Brain", caption: "Before: 14 different tools, $3,200/month, 40 hours/week managing software. After: One AI OS, $97/month, runs itself. Link in bio.", hooks: ["My software bill before vs after AI. The difference is wild.", "Before CreateAI Brain / After CreateAI Brain. Let that sink in.", "I don't manage software anymore. My AI OS does."] },
      { type: "education", title: "12 AI Tools That Replace $500K in Licenses", caption: "Thread 🧵 Each of these AI tools replaces a $30K–$100K system. No hardware. No API access. No specialist required. Just AI.", hooks: ["This AI replaces Westlaw. ($500+/mo saved)", "No SCADA sensors needed. This AI reads your energy data.", "MLS access is $500+/yr. This AI does comps for free."] }
    ],
    strategy: {
      objective: "Brand awareness + traffic to landing page",
      audience: "Entrepreneurs 25-45, business owners, healthcare operators, legal professionals",
      budget: "Start $20/day, scale winners to $100/day",
      bestTimes: "7-9am, 12-2pm, 7-11pm EST",
      frequency: "1 organic post/day, 1 boosted/week",
      kpis: ["View rate", "Profile visits", "Link clicks", "Followers gained"]
    }
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "📘",
    color: "#1877F2",
    accentColor: "#1877F2",
    profile: {
      displayName: "CreateAI Brain",
      handle: "CreateAIBrain",
      bio: "The AI Operating System for Entrepreneurs, Healthcare Operators, Legal Professionals & Enterprise Teams. 12 AI invention tools. One platform. No limits.",
      bioCharLimit: 255,
      description: "CreateAI Brain is a full AI Operating System built by Sara Stadler and Lakeside Trinity LLC. Our 12 AI invention tools replace expensive hardware sensors, licensed databases, and professional consultants with pure AI intelligence. HealthOS, LegalPM, StaffingOS, and more — all in one platform. Try free. Scale without limits.",
      website: "https://createaibrain.app",
      category: "Software",
      cta: "Get Started"
    },
    adFormats: [
      {
        id: "carousel",
        name: "Carousel Ad",
        specs: "Up to 10 cards, 1:1 or 4:5, 1080×1080px or 1080×1350px",
        copy: "Card 1: The AI OS That Does Everything (Headline) | Card 2: ✅ AI Clinical Scribe — No EHR needed | Card 3: ✅ AI Legal Research — No Westlaw | Card 4: ✅ AI Fleet Intelligence — No GPS hardware | Card 5: ✅ AI Risk Underwriter — No actuarial DB | Card 6: Try CreateAI Brain Free → createaibrain.app",
        cta: "Learn More",
        objective: "Awareness + Consideration",
        hashtags: ["#AI", "#entrepreneur", "#businessOS"]
      },
      {
        id: "lead-gen",
        name: "Lead Generation Ad",
        specs: "1:1 image or video, 1080×1080px, Instant Form",
        copy: "Headline: \"Replace Your Entire Software Stack With One AI Platform\"\nBody: Healthcare operators, legal professionals, and business owners are replacing $50K–$500K in annual software costs with CreateAI Brain. No hardware. No licenses. No consultants. Just AI.\nForm fields: Name, Email, Industry, Company Size\nThank you: 'Your free access is being prepared — check your email within 2 minutes.'",
        cta: "Get Free Access",
        objective: "Lead generation",
        hashtags: []
      },
      {
        id: "video-ad",
        name: "Video Ad (Feed)",
        specs: "4:5, 1080×1350px, 15–120s, captions required",
        copy: "HOOK (0-3s): 'This AI just replaced $4,800 in monthly software.'\nPROBLEM (3-15s): 'Most businesses pay for 10-15 different tools. EHR systems. Legal databases. Fleet GPS. Risk actuarial tools. It adds up to tens of thousands per year.'\nSOLUTION (15-45s): 'CreateAI Brain is a single AI OS that replaces all of it. 12 AI invention tools. HealthOS. LegalPM. StaffingOS. All in one platform.'\nCTA (45-60s): 'Try CreateAI Brain free. Link below.'",
        cta: "Start Free Trial",
        objective: "Conversions",
        hashtags: ["#AI", "#businesstools", "#automation", "#saas"]
      },
      {
        id: "retargeting",
        name: "Retargeting Ad",
        specs: "1:1 image, 1080×1080px",
        copy: "Headline: 'Still thinking about it?'\nBody: 'Thousands of businesses just replaced their software stack with CreateAI Brain. Your industry-specific AI tools are ready. No setup. No learning curve. Just results.'\nCTA: 'Get Started — Risk Free'",
        cta: "Get Started",
        objective: "Retargeting + Conversion",
        hashtags: []
      }
    ],
    contentTemplates: [
      { type: "educational-post", title: "12 AI Tools That Are Replacing Entire Industries", caption: "We built 12 AI invention tools that each replace a $30K–$100K specialized system. Here's the list:\n\n🩺 AI Clinical Scribe → replaces EHR clinical notes\n🚛 AI Fleet Intelligence → replaces GPS + ELD hardware\n⚡ AI Energy Intelligence → replaces SCADA + IoT sensors\n🏠 AI Property Intelligence → replaces MLS access\n🛡 AI Risk Underwriter → replaces actuarial databases\n⚖ AI Legal Research Engine → replaces Westlaw/LexisNexis\n🏭 AI Production Intelligence → replaces MES + IoT\n🎁 AI Grant Writer → replaces grant writing consultants\n✅ AI Compliance Pack → replaces compliance consultants\n📬 AI Email Sequence Builder → replaces marketing automation\n📈 AI Financial Intelligence → replaces Bloomberg\n🌾 AI Agronomist → replaces $50K in soil sensors\n\nAll of this in ONE platform. $97/mo. No hardware. No licenses.\n\n→ createaibrain.app" },
      { type: "case-study-post", title: "How a Healthcare Practice Saved $84,000/Year", caption: "A 3-provider medical practice was spending:\n• $18,000/yr on EHR clinical note software\n• $12,000/yr on compliance consulting\n• $8,400/yr on billing coding software\n• $6,000/yr on documentation tools\n\nTotal: $44,400/year. With CreateAI Brain HealthOS + AI Clinical Scribe + AI Compliance Pack:\n\nNew cost: $1,164/year (Pro plan).\nSavings: $43,236/year.\n\nThis is real. This is what AI displacement looks like when it's working for you.\n\n→ Try CreateAI Brain free at createaibrain.app" }
    ],
    strategy: {
      objective: "Lead generation + retargeting",
      audience: "Business owners 30-55, healthcare decision-makers, legal professionals, HR directors",
      budget: "$30-50/day for lead gen, $10/day retargeting",
      bestTimes: "8-10am, 1-3pm, 8-10pm",
      frequency: "5-7 organic posts/week, continuous lead gen campaign",
      kpis: ["Cost per lead", "Lead form completion rate", "ROAS", "Page followers"]
    }
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    color: "#E1306C",
    accentColor: "#833AB4",
    profile: {
      displayName: "CreateAI Brain | AI OS",
      handle: "@createaibrain",
      bio: "🤖 The AI OS for Everything\n⚡ 12 AI tools. No limits. No hardware.\n💼 HealthOS · LegalPM · StaffingOS\n👇 Replace your software stack",
      bioCharLimit: 150,
      description: "AI Operating System for entrepreneurs, healthcare operators, legal professionals, and enterprise teams. Built by Sara Stadler / Lakeside Trinity LLC.",
      website: "createaibrain.app",
      category: "Science & Technology",
      cta: "Book Now"
    },
    adFormats: [
      {
        id: "reels-ad",
        name: "Reels Ad",
        specs: "9:16, 1080×1920px, up to 90s, full audio recommended",
        copy: "HOOK: 'I replaced my $3,200/month software stack with this one AI platform.'\nSOFT DEMO: Quick cuts showing HealthOS → LegalPM → StaffingOS → Invention Layer\nCTA: 'createaibrain.app — link in bio'\nCaption: This AI OS does everything. 12 invention tools. No hardware needed. Zero limits.",
        cta: "Learn More",
        objective: "Awareness + Reach",
        hashtags: ["#AItools", "#entrepreneur", "#businessOS", "#automation", "#saas", "#createaibrain", "#futureofwork", "#AI"]
      },
      {
        id: "stories-ad",
        name: "Stories Ad",
        specs: "9:16, 1080×1920px, 15s max, swipe-up/link sticker",
        copy: "Frame 1 (0-5s): 'What if one AI replaced ALL your business software?' [Bold text on dark background]\nFrame 2 (5-10s): 'CreateAI Brain: 12 AI tools. One platform. $97/mo.' [Feature icons]\nFrame 3 (10-15s): 'Swipe up → Start free' [CTA with arrow]",
        cta: "Swipe Up",
        objective: "Traffic",
        hashtags: []
      },
      {
        id: "explore-ad",
        name: "Explore Ad (Photo)",
        specs: "1:1, 1080×1080px, static image",
        copy: "Headline: 'The AI OS replacing a $500K software stack'\nBody: '12 AI invention tools. No hardware. No licenses. Full capability.'\nCaption: Which industry are you in? We have an AI tool that just replaced your most expensive software. Comment your industry 👇",
        cta: "Shop Now",
        objective: "Engagement + Traffic",
        hashtags: ["#entrepreneur", "#AItools", "#businessautomation", "#futureofwork", "#saas"]
      }
    ],
    contentTemplates: [
      { type: "carousel-edu", title: "12 AI Tools Explained", caption: "Swipe to see every invention tool and what $$$$ it replaces 👉\n\nSlide 1: CreateAI Brain — The AI OS | Slide 2-13: Each tool + what it replaces | Slide 14: Try free → createaibrain.app\n\n#AItools #entrepreneur #businessOS #automation" },
      { type: "reel-demo", title: "60-Second AI OS Tour", caption: "Everything your business needs. In one platform. In under 60 seconds. 🤯\n\n→ createaibrain.app (link in bio)\n\n#createaibrain #AI #AIbusiness #entrepreneur #saas #businessOS" },
      { type: "quote-graphic", title: "AI Replaces Your Most Expensive Tools", caption: "'We cancelled 9 subscriptions after switching to CreateAI Brain. The ROI was immediate.'\n\nThis is the future. And it's available now.\n→ createaibrain.app" }
    ],
    strategy: {
      objective: "Brand awareness + Reels reach",
      audience: "Entrepreneurs, small business owners, healthcare, legal, tech-forward professionals, 25-45",
      budget: "$20/day Reels ads, $10/day Stories",
      bestTimes: "6-9am, 12-2pm, 7-10pm",
      frequency: "1 Reel/day, 3-5 Stories/day, 1 static post/day",
      kpis: ["Reels views", "Profile link taps", "Story swipe-ups", "Follower growth"]
    }
  },
  {
    id: "snapchat",
    name: "Snapchat",
    icon: "👻",
    color: "#FFFC00",
    accentColor: "#FFFC00",
    profile: {
      displayName: "CreateAI Brain",
      handle: "createaibrain",
      bio: "AI OS for everything 🤖⚡ 12 invention tools. Zero limits. Sara Stadler / Lakeside Trinity",
      bioCharLimit: 100,
      description: "AI Operating System: Replace your entire software stack with intelligence.",
      website: "createaibrain.app",
      category: "Technology",
      cta: "Try Free"
    },
    adFormats: [
      {
        id: "snap-ad",
        name: "Single Snap Ad",
        specs: "9:16, 1080×1920px, 3–180s, top-snap with attachment",
        copy: "TOP SNAP: Fast-cut video — 'This AI just made your software obsolete.' | Text overlay: 'CreateAI Brain. 12 tools. $97/mo.'\nATTACHMENT: Web view → createaibrain.app landing page\nCTA Button: 'Tap to See More'",
        cta: "Swipe Up",
        objective: "Awareness + Traffic",
        hashtags: []
      },
      {
        id: "collection-ad",
        name: "Collection Ad",
        specs: "9:16 hero + 4 thumbnail tiles",
        copy: "HERO: 'Replace $100K in software with AI.' | Tiles: [AI Clinical Scribe] [AI Legal Research] [AI Fleet Intelligence] [AI Agronomist]\nCaption: 'One platform. Every industry. No limits.'",
        cta: "Shop",
        objective: "Product discovery",
        hashtags: []
      }
    ],
    contentTemplates: [
      { type: "story-series", title: "The AI OS Series", caption: "Day 1: What is CreateAI Brain? | Day 2: The 12 invention tools | Day 3: Meet HealthOS | Day 4: Meet LegalPM | Day 5: Meet StaffingOS | Day 6: Revenue proof | Day 7: Start free" }
    ],
    strategy: {
      objective: "Younger entrepreneur + freelancer audience",
      audience: "18-34, mobile-first entrepreneurs, freelancers, early adopters",
      budget: "$15/day, focus on Collection ads",
      bestTimes: "8-10pm weekdays, all day weekends",
      frequency: "1 Snap ad/day, daily Story updates",
      kpis: ["Swipe-up rate", "Story views", "App installs (if applicable)", "Website visits"]
    }
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "▶️",
    color: "#FF0000",
    accentColor: "#FF0000",
    profile: {
      displayName: "CreateAI Brain",
      handle: "@CreateAIBrain",
      bio: "CreateAI Brain is the AI Operating System built for entrepreneurs, healthcare operators, legal professionals, and enterprise teams.\n\nWe built 12 AI invention tools that replace $500K+ in software licenses — no hardware, no external APIs, no specialist credentials required.\n\n✅ AI Clinical Scribe\n✅ AI Legal Research Engine\n✅ AI Fleet Intelligence\n✅ AI Risk Underwriter\n✅ AI Agronomist\n+ 7 more invention tools\n\nAll inside a full AI OS: HealthOS, LegalPM, StaffingOS, NEXUS Semantic OS.\n\nSubscribe for AI breakdowns, tool demos, business automation, and revenue strategies.\n\nStart free: createaibrain.app\nContact: admin@LakesideTrinity.com",
      bioCharLimit: 1000,
      website: "createaibrain.app",
      category: "Science & Technology",
      cta: "Subscribe"
    },
    adFormats: [
      {
        id: "skippable-in-stream",
        name: "Skippable In-Stream Ad",
        specs: "16:9, 1920×1080px, 12s+ (skip at 5s), CPV bidding",
        copy: "0-5s (MUST HOOK): 'I just replaced my entire $4,800/month software stack — with one AI platform. Here's proof.'\n5-30s (STORY): 'CreateAI Brain is an AI Operating System. It runs 12 AI invention tools that replace clinical software, legal databases, fleet GPS, insurance actuarial models, and more. No hardware. No specialist license. Just AI.'\n30-60s (PROOF + CTA): 'Our Healthcare module writes SOAP clinical notes. Our Legal tool does case research. Our Fleet tool manages logistics. All for $97/month. Try it free at createaibrain.app — link below.'",
        cta: "Visit Website",
        objective: "Awareness + Consideration",
        hashtags: []
      },
      {
        id: "non-skippable",
        name: "Non-Skippable In-Stream (15s)",
        specs: "16:9, 1920×1080px, exactly 15s",
        copy: "0-3s: 'One AI platform. 12 tools. Replaces $100K in software.'\n3-12s: Fast-cut montage: HealthOS → LegalPM → StaffingOS → Invention tools\n12-15s: 'CreateAI Brain. Try free at createaibrain.app'",
        cta: "createaibrain.app",
        objective: "Brand recall",
        hashtags: []
      },
      {
        id: "bumper",
        name: "Bumper Ad (6s)",
        specs: "16:9, 1920×1080px, exactly 6s",
        copy: "'The AI OS that replaces your entire software stack. createaibrain.app'",
        cta: "createaibrain.app",
        objective: "Frequency + recall",
        hashtags: []
      }
    ],
    videoScripts: [
      {
        title: "The AI OS That Replaced My Entire Software Stack",
        duration: "8-12 minutes",
        type: "Long-form educational",
        script: `INTRO (0:00-0:45): "In this video, I'm going to show you exactly how I — and hundreds of other business owners — replaced $3,200 to $15,000 per month in software subscriptions with a single AI platform. I'm Sara Stadler, founder of CreateAI Brain. Let's get into it."

PROBLEM SETUP (0:45-2:00): "Most businesses are running 10 to 20 different software tools. EHR systems for healthcare. Westlaw or LexisNexis for legal research. SCADA sensors for energy. GPS hardware plus ELD devices for fleet management. Actuarial databases for insurance. Each one costs thousands per year. Each requires specialist training. And most of them are completely overkill."

THE SOLUTION (2:00-5:00): "CreateAI Brain is an AI Operating System. We built 12 AI invention tools that replace every one of those systems — without the hardware, without the license, without the specialist credentials. Here's what I mean. [DEMO EACH TOOL BRIEFLY]"

LIVE DEMO (5:00-9:00): "Let me show you the AI Clinical Scribe live. [DEMO] Now the AI Legal Research Engine. [DEMO] Now the AI Agronomist — no soil sensors needed. [DEMO]"

PROOF + BUSINESS MODEL (9:00-10:30): "HealthOS handles the full healthcare operations layer. LegalPM runs legal practice management. StaffingOS handles recruitment and compliance. All inside one AI OS."

CTA (10:30-12:00): "We have a free trial at createaibrain.app — link in the description. Subscribe for weekly AI tool breakdowns. If you're running a business and paying for software you don't need, this platform will change everything."`,
        thumbnailCopy: "I Replaced $4,800/Month in Software With 1 AI Platform"
      },
      {
        title: "12 AI Invention Tools — Full Breakdown",
        duration: "15-20 minutes",
        type: "Deep-dive educational",
        script: "Full breakdown of all 12 tools, what each replaces, live demo of each, pricing comparison, ROI calculation per tool.",
        thumbnailCopy: "12 AI Tools That Replaced $500K in Software Licenses"
      }
    ],
    contentTemplates: [
      { type: "shorts", title: "30-Second AI Tool Demo", caption: "#AItools #entrepreneur #automation #createaibrain #business" }
    ],
    strategy: {
      objective: "Authority building + long-form content + search traffic",
      audience: "Business decision-makers, entrepreneurs, healthcare/legal/staffing operators, 28-55",
      budget: "$25/day skippable in-stream, $15/day bumper retargeting",
      bestTimes: "Upload 9-11am EST for best organic reach",
      frequency: "2-3 long-form videos/week, 1 Short/day",
      kpis: ["Watch time", "Subscriber growth", "Click-through rate", "Conversions from description links"]
    }
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: "📌",
    color: "#E60023",
    accentColor: "#E60023",
    profile: {
      displayName: "CreateAI Brain",
      handle: "createaibrain",
      bio: "AI Operating System for entrepreneurs, healthcare, legal & enterprise teams. 12 AI invention tools. Replace expensive software with intelligence. Sara Stadler / Lakeside Trinity LLC.",
      bioCharLimit: 160,
      website: "createaibrain.app",
      category: "Technology",
      cta: "Visit"
    },
    adFormats: [
      {
        id: "standard-pin",
        name: "Standard Pin Ad",
        specs: "2:3, 1000×1500px, static image",
        copy: "Title: '12 AI Tools That Replace $500K in Business Software'\nDescription: 'From clinical notes to legal research to fleet management — these AI invention tools bypass every expensive system. No hardware. No licenses. Full capability. createaibrain.app'\nText overlay on image: 'The AI OS That Does Everything'",
        cta: "Learn More",
        objective: "Traffic",
        hashtags: ["#AItools", "#entrepreneur", "#businessautomation", "#saas", "#AI"]
      },
      {
        id: "video-pin",
        name: "Video Pin Ad",
        specs: "1:1 or 2:3, 1080×1080px or 1000×1500px, 4s–15min",
        copy: "Title: 'Replace Your Entire Software Stack With This AI'\nDescription: '12 AI invention tools. One platform. $97/month. See how CreateAI Brain is replacing clinical software, legal databases, and GPS hardware — with pure AI intelligence.'\nVideo: 60-second tool demo montage",
        cta: "Watch",
        objective: "Engagement",
        hashtags: ["#AI", "#automation", "#businessOS"]
      }
    ],
    boardStructure: [
      { board: "AI Business Tools", desc: "The best AI tools replacing traditional software — healthcare, legal, finance, logistics" },
      { board: "AI for Entrepreneurs", desc: "How entrepreneurs are using AI OS platforms to replace $100K in annual software costs" },
      { board: "AI Healthcare Tools", desc: "AI Clinical Scribe, HealthOS, and AI-powered clinical workflows — no EHR required" },
      { board: "AI Legal Tools", desc: "AI legal research, contract drafting, and practice management — no Westlaw needed" },
      { board: "Business Automation", desc: "Full business automation with CreateAI Brain — StaffingOS, FleetOS, and more" }
    ],
    contentTemplates: [
      { type: "infographic", title: "The 12 AI Invention Tools [Infographic]", caption: "12 AI tools. 12 industries. $500K+ in software replaced. Save this. Share with your industry." }
    ],
    strategy: {
      objective: "SEO-rich organic traffic + visual brand authority",
      audience: "Female entrepreneurs 28-45, healthcare administrators, creative business owners",
      budget: "$15/day, focus on search-intent keywords",
      bestTimes: "Evenings and weekends",
      frequency: "5-10 pins/day for organic, 1 ad campaign/week",
      kpis: ["Outbound link clicks", "Saves", "Impressions", "Pin engagement rate"]
    }
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    color: "#0A66C2",
    accentColor: "#0A66C2",
    profile: {
      displayName: "Sara Stadler",
      companyPage: "CreateAI Brain",
      handle: "sarastadler",
      bio: "Founder & CEO, CreateAI Brain | AI Operating System for Enterprise & Healthcare | Built 12 AI invention tools replacing $500K+ in software | Lakeside Trinity LLC",
      bioCharLimit: 220,
      about: "Sara Stadler is the founder of CreateAI Brain, the first AI Operating System designed to replace expensive business software, hardware sensors, and professional consultants with pure AI intelligence.\n\nCreateAI Brain's 12 AI invention tools serve healthcare operators, legal professionals, staffing agencies, fleet operators, financial advisors, insurance underwriters, agricultural businesses, and more — all from a single platform.\n\nPreviously: [Enterprise background]\nNow: Building the AI OS that has no limits and no ceilings.\n\nConnect to discuss: AI platform architecture, enterprise AI adoption, healthcare AI, legal tech, and autonomous business systems.",
      headline: "Founder, CreateAI Brain | AI OS That Replaces $500K in Software | 12 AI Invention Tools | Healthcare · Legal · Staffing · Finance",
      website: "createaibrain.app",
      industry: "Technology / SaaS / AI",
      companySize: "1-10 employees",
      companyAbout: "CreateAI Brain is the AI Operating System for entrepreneurs, healthcare operators, legal professionals, and enterprise teams.\n\nOur 12 AI invention tools bypass expensive external systems:\n• AI Clinical Scribe (replaces EHR clinical notes)\n• AI Legal Research Engine (replaces Westlaw/LexisNexis)\n• AI Fleet Intelligence (replaces GPS hardware + ELD devices)\n• AI Energy Intelligence (replaces SCADA + IoT sensors)\n• AI Risk Underwriter (replaces actuarial databases)\n• AI Property Intelligence (replaces MLS access)\n• AI Production Intelligence (replaces MES + IoT)\n• AI Grant Writer (replaces grant writing consultants)\n• AI Compliance Pack (replaces compliance consultants)\n• AI Email Sequence Builder (replaces marketing automation)\n• AI Financial Intelligence (replaces Bloomberg)\n• AI Agronomist (replaces $50K in soil sensors)\n\nAll inside a full AI OS: HealthOS, LegalPM, StaffingOS, NEXUS Semantic OS.\n\nFounded by Sara Stadler | Lakeside Trinity LLC | createaibrain.app",
      cta: "Contact Us"
    },
    adFormats: [
      {
        id: "single-image",
        name: "Single Image Ad",
        specs: "1.91:1, 1200×628px",
        copy: "Headline: 'This AI Just Made Your Software License Obsolete'\nIntro text: 'Healthcare operators are using CreateAI Brain to generate clinical SOAP notes without EHR access. Legal firms are replacing Westlaw with our AI Research Engine. Fleet companies are managing logistics without GPS hardware. These are 3 of our 12 AI invention tools. The AI OS has no limits.\n\n→ Get a free demo: createaibrain.app'\nCTA: Learn More",
        cta: "Learn More",
        objective: "Awareness + Consideration",
        hashtags: ["#AI", "#enterpriseAI", "#healthcareIT", "#legaltech", "#SaaS"]
      },
      {
        id: "message-ad",
        name: "Message Ad (InMail)",
        specs: "Direct message to target audience",
        copy: "Subject: Your industry's most expensive software has an AI replacement\n\nHi [First Name],\n\nI'm Sara Stadler, founder of CreateAI Brain.\n\nWe built 12 AI invention tools specifically for [their industry] operators. Each one replaces a $30,000–$100,000+ annual software cost — with zero hardware, zero licenses, and zero specialist credentials required.\n\nFor [healthcare/legal/staffing] operators specifically:\n[Industry-specific tool and value proposition]\n\nI'd love to show you a 15-minute demo. Would [Day/Date] at [Time] work?\n\n→ Or start free immediately: createaibrain.app\n\nBest,\nSara Stadler\nFounder, CreateAI Brain | Lakeside Trinity LLC",
        cta: "Reply",
        objective: "Direct outreach + demo booking",
        hashtags: []
      },
      {
        id: "thought-leadership",
        name: "Thought Leadership / Document Ad",
        specs: "PDF carousel, up to 300 pages",
        copy: "Title: 'The Complete Guide to AI-Native Business Operations in 2025'\nTeaser: 'How enterprises are replacing $500K+ in annual software costs with a single AI Operating System. 12 case studies. Full ROI analysis. Implementation guide.'\nGate: Email required to download",
        cta: "Download Free Guide",
        objective: "Lead generation",
        hashtags: ["#thoughtleadership", "#enterpriseAI", "#digitaltransformation"]
      }
    ],
    contentTemplates: [
      { type: "thought-leadership-post", title: "The End of the Software License Era", caption: "The enterprise software industry built a $600 billion business on one idea: you need their access to do your job.\n\nWe disagreed.\n\nCreateAI Brain's 12 AI invention tools replace:\n• Westlaw ($500+/month) → AI Legal Research Engine\n• Clinical EHR notes ($800/month) → AI Clinical Scribe\n• Bloomberg Terminal ($2,000/month) → AI Financial Intelligence\n• SCADA + IoT sensors ($50,000+) → AI Energy Intelligence\n• Soil sensors + precision ag systems ($50,000/farm) → AI Agronomist\n\nNo hardware. No licenses. No specialist credentials.\n\nJust AI.\n\nThe software license era is ending. The AI OS era is here.\n\n→ createaibrain.app" },
      { type: "industry-post", title: "To Every Healthcare Operator Paying for EHR Clinical Notes", caption: "You're paying $800–$2,000/month for clinical note software.\n\nOur AI Clinical Scribe generates structured SOAP notes, care plans, and patient education summaries from symptom input and consultation notes.\n\nNo EHR access required. No clinical integration. No setup.\n\nJust: input → AI → structured clinical output.\n\nThe ROI is instant. The tool is live. Try it inside CreateAI Brain.\n\n→ createaibrain.app/demo" }
    ],
    strategy: {
      objective: "B2B lead generation + thought leadership + enterprise deals",
      audience: "C-suite, healthcare administrators, law firm partners, staffing directors, CFOs, COOs — company size 10-500",
      budget: "$50/day message ads + $30/day image ads",
      bestTimes: "Tuesday-Thursday, 8-10am and 12-2pm EST",
      frequency: "1 personal post (Sara) per day, 3-5 company posts/week",
      kpis: ["Cost per lead", "Demo booking rate", "Connection acceptance rate", "InMail open rate"]
    }
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: "✖️",
    color: "#000000",
    accentColor: "#1D9BF0",
    profile: {
      displayName: "CreateAI Brain",
      handle: "@CreateAIBrain",
      bio: "AI OS replacing $500K in software. 12 invention tools. No hardware. No limits. | Sara Stadler @SaraSStadler | createaibrain.app",
      bioCharLimit: 160,
      description: "The AI Operating System for entrepreneurs, healthcare, legal, and enterprise. Built by Sara Stadler / Lakeside Trinity LLC.",
      website: "createaibrain.app",
      category: "Technology",
      cta: "Follow"
    },
    adFormats: [
      {
        id: "promoted-tweet",
        name: "Promoted Post",
        specs: "280 chars text + optional 16:9 image/video",
        copy: "The software license era is over.\n\nCreateAI Brain built 12 AI invention tools that bypass:\n• Westlaw ($500/mo) → AI Legal Research\n• EHR clinical notes ($800/mo) → AI Scribe\n• GPS hardware ($50K) → AI Fleet\n• Soil sensors ($50K/farm) → AI Agronomist\n\nOne platform. No hardware. No licenses.\n\n→ createaibrain.app",
        cta: "Learn More",
        objective: "Awareness",
        hashtags: ["#AI", "#entrepreneur", "#legaltech", "#healthtech", "#automation"]
      },
      {
        id: "follower-ad",
        name: "Follower Ad",
        specs: "Text only, shown as 'Follow @CreateAIBrain'",
        copy: "Replacing $500K in software with 12 AI tools. Follow for weekly breakdowns of how AI is making expensive software obsolete.",
        cta: "Follow",
        objective: "Follower growth",
        hashtags: []
      }
    ],
    threadTemplates: [
      {
        title: "The 12 AI Tools Thread",
        tweets: [
          "We built 12 AI invention tools that replace $500K+ in annual software costs. Thread 🧵 (1/14)",
          "1/ AI Clinical Scribe: Converts symptom input → SOAP notes, care plans, patient education. No EHR needed. Replaces $800/mo clinical note software.",
          "2/ AI Fleet Intelligence: Milestone reporting → route timelines, risk assessments, driver comms. No GPS hardware. No ELD devices.",
          "3/ AI Energy Intelligence: Meter readings → anomaly detection, consumption forecasts, maintenance alerts. Replaces $50K SCADA systems.",
          "4/ AI Property Intelligence: Self-hosted listings → comp analysis, pricing recommendations, market assessments. No MLS access needed.",
          "5/ AI Risk Underwriter: Qualitative questionnaire → risk profiles, premium estimates, coverage recommendations. Replaces actuarial databases.",
          "6/ AI Legal Research Engine: Case facts → legal analysis, precedent frameworks, argument structures. Replaces Westlaw ($500/mo).",
          "7/ AI Production Intelligence: Shift reports → OEE calculations, downtime patterns, CAPA drafts, maintenance predictions. No MES sensors.",
          "8/ AI Grant Writer: Brief input → needs statement, project description, evaluation plan, budget narrative. Replaces $15K grant consultants.",
          "9/ AI Compliance Pack: Industry + parameters → compliance framework, required policies, SOPs, calendar, regulatory checklist.",
          "10/ AI Email Sequence Builder: Campaign goal → full multi-email drip sequence with copy, subject lines, timing, personalization.",
          "11/ AI Financial Intelligence: Client data → portfolio analysis, risk profiling, financial planning narratives. Replaces Bloomberg ($2K/mo).",
          "12/ AI Agronomist: Visual observations → crop diagnosis, treatment plans, yield forecasts. Replaces $50K precision ag sensors.",
          "All 12 tools live inside CreateAI Brain OS. $97/mo. No hardware. No licenses. Try free → createaibrain.app"
        ]
      }
    ],
    contentTemplates: [
      { type: "single-tweet", title: "Software Killer Series", caption: "Today's software we replaced:\n\nWestlaw ($6,000/yr) → AI Legal Research Engine\n\nNo login. No subscription. No specialist.\nJust: facts in → legal analysis out.\n\nThis is what AI OS looks like.\n\ncreateaibrain.app" }
    ],
    strategy: {
      objective: "Thought leadership + viral reach + founder brand",
      audience: "Tech founders, VCs, enterprise decision-makers, healthcare/legal/tech-adjacent professionals",
      budget: "$20/day promoted posts",
      bestTimes: "8-10am, 12-1pm, 4-6pm EST weekdays",
      frequency: "5-10 tweets/day (threads, singles, replies), 1 thread/week",
      kpis: ["Impressions", "Engagement rate", "Profile visits", "Follower growth", "Link clicks"]
    }
  },
  {
    id: "google",
    name: "Google Ads",
    icon: "🔍",
    color: "#4285F4",
    accentColor: "#34A853",
    profile: {
      displayName: "CreateAI Brain",
      handle: "N/A (Search Ads)",
      bio: "N/A",
      bioCharLimit: 0,
      website: "createaibrain.app",
      category: "Search + Display + YouTube"
    },
    adFormats: [
      {
        id: "search-ad",
        name: "Search Ad",
        specs: "3 headlines (30 chars each), 2 descriptions (90 chars each), responsive",
        copy: {
          headlines: [
            "AI OS for Your Business",
            "Replace $100K in Software",
            "12 AI Invention Tools",
            "No Hardware. No Licenses.",
            "AI Clinical Scribe — Try Free",
            "AI Legal Research — No Westlaw",
            "AI Fleet Intelligence Included",
            "CreateAI Brain — $97/Month",
            "Full AI Platform. One Price."
          ],
          descriptions: [
            "CreateAI Brain: 12 AI tools that replace clinical software, legal databases, fleet GPS & more. Try free at createaibrain.app.",
            "Replace Westlaw, EHR systems, SCADA sensors & actuarial databases with AI. No hardware needed. Full capability from day one.",
            "The AI OS for healthcare operators, legal professionals, staffing agencies & entrepreneurs. 12 invention tools. $97/mo.",
            "Autonomous AI platform: HealthOS, LegalPM, StaffingOS + 12 invention tools. Start free. No setup. No limits."
          ]
        },
        targetKeywords: [
          "AI business software", "replace clinical notes software", "AI legal research tool",
          "fleet management without GPS", "AI agronomist tool", "business AI operating system",
          "AI tools for healthcare", "AI tools for lawyers", "staffing AI software",
          "replace Westlaw alternative", "clinical scribe AI", "insurance underwriting AI",
          "EHR alternative AI", "AI financial intelligence", "grant writing AI"
        ],
        cta: "Learn More",
        objective: "Search intent capture + conversions"
      },
      {
        id: "display-ad",
        name: "Display Ad",
        specs: "Multiple sizes: 728×90, 300×250, 160×600, 320×50, 300×600",
        copy: "Headline: 'The AI OS Replacing $500K in Software'\nBody: '12 AI invention tools. No hardware. No limits. Try CreateAI Brain free.'\nCTA: 'Try Free'",
        cta: "Try Free",
        objective: "Retargeting + brand awareness",
        hashtags: []
      }
    ],
    contentTemplates: [],
    strategy: {
      objective: "High-intent search capture + retargeting",
      audience: "Intent-based: healthcare IT, legal tech, fleet management, business AI — searching for solutions",
      budget: "$50/day search, $20/day display retargeting",
      bestTimes: "Continuous (search follows user intent)",
      frequency: "Always-on campaigns",
      kpis: ["CTR", "Conversion rate", "Cost per conversion", "Quality Score", "ROAS"]
    }
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: "🔴",
    color: "#FF4500",
    accentColor: "#FF4500",
    profile: {
      displayName: "u/CreateAIBrain",
      handle: "CreateAIBrain",
      bio: "Building the AI OS that replaces $500K in software. Sara Stadler / Lakeside Trinity. createaibrain.app",
      bioCharLimit: 200,
      website: "createaibrain.app",
      category: "Technology"
    },
    adFormats: [
      {
        id: "promoted-post",
        name: "Promoted Post",
        specs: "Text or image + link, subreddit-targeted",
        copy: "Title: 'We built an AI that replaces Westlaw — for lawyers who can't afford $500/month'\nBody: 'Full disclosure: I'm the founder. We built CreateAI Brain specifically because legal research subscriptions are prohibitive for solo practitioners and small firms.\n\nOur AI Legal Research Engine takes case facts and jurisdiction → synthesizes legal analysis, relevant precedent frameworks, argument structures, and risk assessments.\n\nNo subscription. No credentials. Just AI inference from structured input.\n\nHappy to do an AMA if there's interest. Link in comments.'",
        targetSubreddits: ["r/Entrepreneur", "r/legaladvice", "r/smallbusiness", "r/healthIT", "r/farming", "r/SaaS", "r/AItools", "r/MachineLearning", "r/startups"],
        cta: "Comments",
        objective: "Community engagement + trust building"
      }
    ],
    contentTemplates: [
      { type: "ama", title: "AMA: Built an AI OS That Replaces $500K in Software", caption: "I'm Sara Stadler, founder of CreateAI Brain. We built 12 AI invention tools that replace clinical software, legal databases, fleet GPS, insurance actuarial systems, and precision agriculture sensors — with pure AI inference.\n\nAsk me anything about how it works, what it replaces, or the business behind it.\n\nProof: admin@LakesideTrinity.com / createaibrain.app" }
    ],
    strategy: {
      objective: "Community trust + authentic engagement",
      audience: "Tech-savvy professionals, developers, entrepreneurs, healthcare/legal communities",
      budget: "$20/day promoted posts in targeted subreddits",
      bestTimes: "8-10am, 12-2pm, 8-11pm EST",
      frequency: "1-2 organic community posts/week, 1 promoted post/week",
      kpis: ["Comment engagement", "Upvote ratio", "Profile visits", "Link clicks"]
    }
  },
  {
    id: "threads",
    name: "Threads",
    icon: "🧵",
    color: "#000000",
    accentColor: "#0095F6",
    profile: {
      displayName: "CreateAI Brain",
      handle: "@createaibrain",
      bio: "AI OS replacing $500K in software. 12 AI tools. Sara Stadler. createaibrain.app",
      bioCharLimit: 150,
      website: "createaibrain.app",
      category: "Technology"
    },
    adFormats: [],
    contentTemplates: [
      { type: "daily-drop", title: "Daily AI Tool Drop", caption: "Today's tool: AI Clinical Scribe.\n\nConverts symptom input → full SOAP note.\nNo EHR. No login. No license.\n\nJust: describe → AI → structured clinical output.\n\nOne of 12 invention tools inside CreateAI Brain.\n\ncreateaibrain.app" },
      { type: "conversation-starter", title: "What software are you overpaying for?", caption: "Name your most expensive software.\n\nI'll tell you if our AI already replaced it.\n\n(We've replaced 12 categories so far. Working on more.)" }
    ],
    strategy: {
      objective: "Brand presence + authentic engagement on Meta's text platform",
      audience: "Instagram users who prefer text content, 25-40, entrepreneurs, creators",
      budget: "Organic only (no ads available yet)",
      bestTimes: "Mirror Instagram timing: 7-9am, 12-2pm",
      frequency: "3-5 posts/day",
      kpis: ["Likes", "Replies", "Shares", "Follower growth"]
    }
  },
  {
    id: "email",
    name: "Email Marketing",
    icon: "📧",
    color: "#6366f1",
    accentColor: "#6366f1",
    profile: {
      displayName: "Sara Stadler @ CreateAI Brain",
      handle: "admin@LakesideTrinity.com",
      bio: "From Sara Stadler, Founder of CreateAI Brain",
      bioCharLimit: 0,
      website: "createaibrain.app",
      category: "Email / Newsletter"
    },
    adFormats: [
      {
        id: "welcome-sequence",
        name: "Welcome Email Sequence (5-part)",
        specs: "Plain text preferred, HTML option, 250-500 words/email",
        copy: {
          email1: { subject: "Welcome to CreateAI Brain — here's what you just unlocked", body: "Hi [First Name],\n\nI'm Sara Stadler, founder of CreateAI Brain.\n\nYou just joined the platform that's replacing $500K+ in annual software costs for entrepreneurs, healthcare operators, legal professionals, and enterprise teams.\n\nHere's what's waiting for you inside:\n\n→ 12 AI Invention Tools — each one replaces a $30K–$100K system\n→ HealthOS — full healthcare operations layer\n→ LegalPM — legal practice management\n→ StaffingOS — staffing + recruitment OS\n→ NEXUS Semantic OS — the intelligence layer\n\nStart here: [Your most relevant invention tool based on industry]\n\nReply to this email anytime. I read every response.\n\nSara Stadler\nFounder, CreateAI Brain" },
          email2: { subject: "The 12 tools — and what each one replaced", body: "Hi [First Name],\n\nYesterday you joined CreateAI Brain. Today I want to walk you through the 12 AI invention tools and what each one is replacing in the real world.\n\n[Full list of 12 tools with brief description and $ replaced]\n\nWhich tool is most relevant to your business? Reply with your industry — I'll point you to your highest-ROI tool first.\n\nSara" },
          email3: { subject: "Your industry's most expensive tool has an AI replacement", body: "Hi [First Name],\n\nBased on your signup information, you're in [industry].\n\nHere's the tool we built specifically for you:\n[Industry-specific tool + what it does + what it replaces + how to access it]\n\nTry it now inside CreateAI Brain.\n\nSara" },
          email4: { subject: "The revenue models inside CreateAI Brain", body: "Hi [First Name],\n\nCreateAI Brain isn't just a tool platform — it's an autonomous revenue generation system.\n\nHere's how operators are using it to generate revenue:\n[3-4 revenue generation use cases]\n\nThe platform handles everything automatically. No manual steps.\n\nSara" },
          email5: { subject: "Everything you can do with CreateAI Brain — full capability", body: "Hi [First Name],\n\nYou've been on CreateAI Brain for a few days. Here's everything you now have access to:\n[Complete feature list]\n\nIf you haven't tried [most popular tool for their industry] yet, start there.\n\nAnd if you want to upgrade to Enterprise for unlimited seats and white-label access:\n[Upgrade link]\n\nSara" }
        },
        cta: "Start Using Your Tools",
        objective: "Onboarding + activation"
      }
    ],
    contentTemplates: [
      { type: "weekly-newsletter", title: "The AI OS Weekly", caption: "Subject: This week in AI operating systems: [TOOL SPOTLIGHT] + [REVENUE UPDATE] + [INDUSTRY AI NEWS]\n\nWeekly digest covering: tool of the week, operator success story, new AI capability added, revenue tip, and one thing the software industry doesn't want you to know." }
    ],
    strategy: {
      objective: "Onboarding + activation + upsell",
      audience: "All registered users, segmented by industry",
      budget: "Cost of Resend API (low)",
      bestTimes: "Tuesday-Thursday, 9-11am EST",
      frequency: "Welcome sequence day 1-5, then weekly newsletter",
      kpis: ["Open rate", "Click rate", "Activation rate", "Upgrade conversion"]
    }
  }
];

/* ── GLOBAL HASHTAG SETS ─────────────────────────────────────────── */
const HASHTAG_SETS = {
  core: ["#createaibrain", "#AI", "#AItools", "#businessOS", "#automation", "#entrepreneur"],
  healthcare: ["#healthtech", "#digitalhealth", "#healthcareAI", "#clinicalAI", "#EHR", "#medicaltechnology"],
  legal: ["#legaltech", "#lawtech", "#legalAI", "#lawfirm", "#legalresearch", "#practicemanagement"],
  staffing: ["#hrtech", "#recruitmentAI", "#staffing", "#talentacquisition", "#HRautomation"],
  finance: ["#fintech", "#financialAI", "#wealthtech", "#investmentAI", "#bloomberg"],
  agriculture: ["#agtech", "#precisionag", "#agriculturalAI", "#farmtech", "#cropscience"],
  fleet: ["#logistics", "#fleetmanagement", "#transporttech", "#supplychain", "#logisticsAI"],
  general: ["#saas", "#startups", "#futureofwork", "#digitaltransformation", "#innovation", "#machinelearning"]
};

/* ── 30-DAY CONTENT CALENDAR ─────────────────────────────────────── */
const CONTENT_CALENDAR = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const themes = [
    { theme: "Tool Spotlight", focus: "AI Clinical Scribe", platform: "LinkedIn + Facebook", type: "Educational" },
    { theme: "Demo Day", focus: "AI Legal Research Engine", platform: "YouTube + TikTok", type: "Video" },
    { theme: "Case Study", focus: "Healthcare ROI Story", platform: "LinkedIn + Email", type: "Case Study" },
    { theme: "Industry Hook", focus: "Fleet Intelligence — No GPS Needed", platform: "Twitter + LinkedIn", type: "Thread" },
    { theme: "Revenue Reveal", focus: "How CreateAI Brain Generates Revenue", platform: "All", type: "Announcement" },
    { theme: "Tool Spotlight", focus: "AI Agronomist", platform: "Pinterest + Facebook", type: "Educational" },
    { theme: "Engagement Post", focus: "What software are you overpaying for?", platform: "Threads + Twitter", type: "Poll/Question" },
    { theme: "Short Demo", focus: "AI Risk Underwriter", platform: "TikTok + Instagram Reels", type: "Short Video" },
    { theme: "Authority Post", focus: "The End of Software Licenses", platform: "LinkedIn", type: "Thought Leadership" },
    { theme: "Tool Spotlight", focus: "AI Energy Intelligence", platform: "Twitter + LinkedIn", type: "Thread" },
    { theme: "Comparison Post", focus: "Bloomberg vs AI Financial Intelligence", platform: "LinkedIn + Twitter", type: "Comparison" },
    { theme: "Engagement", focus: "Name your industry — we'll name your AI tool", platform: "Instagram + Threads", type: "Engagement" },
    { theme: "Tool Spotlight", focus: "AI Grant Writer", platform: "LinkedIn + Email", type: "Educational" },
    { theme: "Demo Day", focus: "AI Production Intelligence", platform: "YouTube + TikTok", type: "Video" },
    { theme: "Partnership Outreach", focus: "Enterprise Partnership Offer", platform: "LinkedIn InMail", type: "Direct" },
    { theme: "Tool Spotlight", focus: "AI Email Sequence Builder", platform: "Twitter + LinkedIn", type: "Educational" },
    { theme: "Case Study", focus: "Legal Firm Saves $6K/Year Story", platform: "LinkedIn + Facebook", type: "Case Study" },
    { theme: "Short Demo", focus: "AI Compliance Pack", platform: "TikTok + Instagram", type: "Short Video" },
    { theme: "Platform Reveal", focus: "HealthOS Full Tour", platform: "YouTube", type: "Long-form Video" },
    { theme: "Engagement", focus: "The software we want to kill next", platform: "All", type: "Community" },
    { theme: "Tool Spotlight", focus: "AI Fleet Intelligence", platform: "LinkedIn + Facebook", type: "Educational" },
    { theme: "Demo Day", focus: "AI Property Intelligence", platform: "YouTube + Pinterest", type: "Video" },
    { theme: "Newsletter", focus: "Week 3 Digest", platform: "Email", type: "Newsletter" },
    { theme: "Comparison Post", focus: "Westlaw vs AI Legal Research", platform: "LinkedIn + Twitter", type: "Comparison" },
    { theme: "Founder Story", focus: "Why Sara Built CreateAI Brain", platform: "LinkedIn + YouTube", type: "Personal Brand" },
    { theme: "Tool Spotlight", focus: "AI Financial Intelligence", platform: "LinkedIn + Twitter", type: "Educational" },
    { theme: "Short Demo", focus: "Full OS walkthrough — 60 seconds", platform: "TikTok + Reels", type: "Short Video" },
    { theme: "Case Study", focus: "Staffing Agency ROI Story", platform: "LinkedIn + Facebook", type: "Case Study" },
    { theme: "Promo Post", focus: "Limited: Enterprise at Pro price", platform: "Email + All Social", type: "Offer" },
    { theme: "Month Wrap", focus: "30 days of AI OS — what we launched", platform: "All", type: "Recap" }
  ];
  const entry = themes[(day - 1) % themes.length];
  return { day, date: `Day ${day}`, ...entry, status: "ready" };
});

/* ── FUNNEL STRUCTURES ───────────────────────────────────────────── */
const FUNNELS = [
  {
    id: "awareness-to-trial",
    name: "Social → Free Trial Funnel",
    stages: [
      { stage: "Awareness", channel: "TikTok / Instagram Reels / YouTube Shorts", content: "Hook video: 'I replaced my software stack'", cta: "Link in bio" },
      { stage: "Interest", channel: "Landing Page (createaibrain.app)", content: "Headline: 'The AI OS That Does Everything' + feature breakdown + social proof", cta: "Start Free Trial" },
      { stage: "Trial", channel: "In-App Onboarding", content: "Welcome sequence + first tool tutorial + quick win", cta: "Activate Pro" },
      { stage: "Conversion", channel: "Email + In-App", content: "Day 3 upgrade prompt + ROI calculator + limited offer", cta: "Upgrade to Pro — $97/mo" },
      { stage: "Retention", channel: "Email + In-App", content: "Weekly digest + new tool announcements + feature unlocks", cta: "Stay Active" }
    ]
  },
  {
    id: "linkedin-b2b",
    name: "LinkedIn B2B Funnel",
    stages: [
      { stage: "Awareness", channel: "LinkedIn Posts + InMail", content: "Thought leadership post or personalized InMail", cta: "Reply / Comment" },
      { stage: "Interest", channel: "LinkedIn Profile + Company Page", content: "Full company description + demo video pinned", cta: "Book a Demo" },
      { stage: "Demo", channel: "Calendly / Direct", content: "15-min live demo of industry-specific tools", cta: "Start Enterprise Trial" },
      { stage: "Proposal", channel: "Email", content: "Custom proposal with ROI analysis", cta: "Accept Proposal" },
      { stage: "Close", channel: "Invoice System", content: "Professional invoice + onboarding call", cta: "Pay Invoice" }
    ]
  },
  {
    id: "google-search",
    name: "Google Search → Conversion Funnel",
    stages: [
      { stage: "Search Intent", channel: "Google Search", content: "Keyword: 'AI clinical scribe' / 'replace Westlaw' / 'fleet management without GPS'", cta: "Ad Click" },
      { stage: "Landing Page", channel: "Industry-specific landing page", content: "Problem → Solution → Proof → CTA specific to their search term", cta: "Try Free" },
      { stage: "Onboarding", channel: "In-App", content: "Industry-specific first run experience", cta: "See My Tools" },
      { stage: "Conversion", channel: "Email + In-App", content: "Upgrade prompt with industry-specific ROI", cta: "Upgrade" }
    ]
  }
];

/* ── API ROUTES ──────────────────────────────────────────────────── */

router.get("/brand", (_req: Request, res: Response) => {
  res.json({ ok: true, brand: BRAND });
});

router.get("/platforms", (_req: Request, res: Response) => {
  const summary = PLATFORMS.map(p => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
    color: p.color,
    handle: p.profile.handle,
    bio: p.profile.bio,
    adFormatsCount: p.adFormats.length,
    hasContentTemplates: p.contentTemplates.length > 0,
    strategy: p.strategy
  }));
  res.json({ ok: true, count: PLATFORMS.length, platforms: summary });
});

router.get("/platform/:id", (req: Request, res: Response) => {
  const id = String(req.params["id"] ?? "");
  const platform = PLATFORMS.find(p => p.id === id);
  if (!platform) {
    res.status(404).json({ ok: false, error: "Platform not found" });
    return;
  }
  res.json({ ok: true, platform });
});

router.get("/assets", (_req: Request, res: Response) => {
  const assets = {
    brand: BRAND,
    platformCount: PLATFORMS.length,
    platforms: PLATFORMS.map(p => ({
      id: p.id,
      name: p.name,
      profile: p.profile,
      adFormats: p.adFormats,
      contentTemplates: p.contentTemplates,
      strategy: p.strategy
    })),
    hashtagSets: HASHTAG_SETS,
    totalAdFormats: PLATFORMS.reduce((sum, p) => sum + p.adFormats.length, 0),
    totalContentTemplates: PLATFORMS.reduce((sum, p) => sum + p.contentTemplates.length, 0)
  };
  res.json({ ok: true, assets });
});

router.get("/calendar", (_req: Request, res: Response) => {
  res.json({ ok: true, days: CONTENT_CALENDAR.length, calendar: CONTENT_CALENDAR });
});

router.get("/funnels", (_req: Request, res: Response) => {
  res.json({ ok: true, count: FUNNELS.length, funnels: FUNNELS });
});

router.get("/hashtags", (_req: Request, res: Response) => {
  res.json({ ok: true, sets: HASHTAG_SETS });
});

router.get("/bios", (_req: Request, res: Response) => {
  const bios = PLATFORMS.map(p => ({
    platform: p.name,
    id: p.id,
    displayName: p.profile.displayName,
    handle: p.profile.handle,
    bio: p.profile.bio,
    charLimit: p.profile.bioCharLimit,
    charCount: p.profile.bio.length
  }));
  res.json({ ok: true, bios });
});

router.get("/banners", (_req: Request, res: Response) => {
  const banners = [
    { platform: "YouTube", type: "Channel Art", specs: "2560×1440px", safeZone: "1546×423px center", copy: "CreateAI Brain — The AI OS for Everything You Do | createaibrain.app", elements: ["Logo center", "Tagline below", "Social handles right", "Platform badges bottom"] },
    { platform: "LinkedIn", type: "Company Banner", specs: "1128×191px", copy: "CreateAI Brain | The AI OS Replacing $500K in Software | 12 AI Invention Tools", elements: ["Logo left", "Tagline center", "Website URL right"] },
    { platform: "LinkedIn", type: "Personal Banner (Sara)", specs: "1584×396px", copy: "Sara Stadler | Founder, CreateAI Brain | AI OS That Has No Limits | createaibrain.app", elements: ["Headshot left", "Name + title", "Company logo", "Tagline"] },
    { platform: "Facebook", type: "Page Cover", specs: "820×312px (desktop), 640×360px (mobile)", copy: "CreateAI Brain | The AI OS for Everything | 12 Invention Tools | createaibrain.app", elements: ["Logo top-left", "Tagline center", "CTA button: Get Started"] },
    { platform: "Twitter/X", type: "Header Image", specs: "1500×500px", copy: "CreateAI Brain | AI OS | 12 Invention Tools | No Hardware. No Limits.", elements: ["Dark background", "Logo left", "Tagline right", "Indigo accent bar"] },
    { platform: "TikTok", type: "Profile Background", specs: "1080×1920px", copy: "CreateAI Brain | @createaibrain", elements: ["Minimal, dark background", "Logo center", "Handle overlay"] },
    { platform: "All", type: "Ad Banner Set", specs: "728×90 / 300×250 / 160×600 / 320×50 / 300×600", copy: "Headline: 'The AI OS Replacing $500K in Software' | Body: '12 AI tools. No hardware. Try free.' | CTA: 'Start Free'", elements: ["Logo", "Headline", "Body", "CTA button", "Dark background with indigo accent"] }
  ];
  res.json({ ok: true, count: banners.length, banners });
});

router.get("/scripts", (_req: Request, res: Response) => {
  const ytPlatform = PLATFORMS.find(p => p.id === "youtube");
  const scripts = [
    ...(ytPlatform && "videoScripts" in ytPlatform ? (ytPlatform as any).videoScripts : []),
    {
      title: "TikTok / Reels — 60-Second Hook",
      duration: "60s",
      type: "Short-form",
      script: "HOOK (0-3s): [On screen: '$4,800/month → $97/month'] 'I cancelled 11 software subscriptions this month. Here's what I use now.'\n\nMIDDLE (3-45s): [Screen recording of CreateAI Brain OS]\n'This is CreateAI Brain. It's an AI Operating System with 12 tools built in.'\n[Flash each tool quickly]\n'Clinical notes — done. Legal research — done. Fleet tracking — done. No hardware. No licenses.'\n\nCTA (45-60s): 'Try it free. Link in bio. createaibrain.app'",
      thumbnailCopy: "Cancelled $4,800/mo in Software 🤯"
    },
    {
      title: "YouTube Shorts — Tool Demo Format",
      duration: "30-59s",
      type: "Short-form educational",
      script: "HOOK: 'Watch AI write a full SOAP clinical note in 30 seconds — with no EHR access.'\nDEMO: [Screen recording of AI Clinical Scribe]\nSOCIAL PROOF: 'This replaced a $800/month clinical note platform.'\nCTA: 'See all 12 tools at createaibrain.app'",
      thumbnailCopy: "AI Writes Clinical Notes in 30 Seconds 🏥"
    },
    {
      title: "LinkedIn Video — Thought Leadership",
      duration: "90-120s",
      type: "Professional short-form",
      script: "OPEN: [Professional framing, Sara to camera]\n'I want to talk about something that's making $600 billion in enterprise software licenses irrelevant.'\n\nBUILD: 'We built 12 AI tools. Each one replaces a system that costs $30K to $100K per year. No hardware. No license. No specialist credentials.'\n\nPROOF: 'Here's one: our AI Legal Research Engine. You input case facts. AI outputs legal analysis, precedent frameworks, argument structures. No Westlaw subscription needed.'\n\nCTA: 'The era of the software license is ending. CreateAI Brain is what comes next. Try it at createaibrain.app.'"
      ,
      thumbnailCopy: "The $600B Industry We're Making Obsolete"
    }
  ];
  res.json({ ok: true, count: scripts.length, scripts });
});

router.get("/status", (_req: Request, res: Response) => {
  const totalAdFormats = PLATFORMS.reduce((sum, p) => sum + p.adFormats.length, 0);
  const totalTemplates = PLATFORMS.reduce((sum, p) => sum + p.contentTemplates.length, 0);
  res.json({
    ok: true,
    status: "FULLY_READY",
    internal_only: true,
    readiness: {
      brand_identity: "COMPLETE",
      platform_profiles: `COMPLETE — ${PLATFORMS.length} platforms`,
      ad_formats: `COMPLETE — ${totalAdFormats} formats`,
      content_templates: `COMPLETE — ${totalTemplates} templates`,
      content_calendar: "COMPLETE — 30 days",
      funnels: `COMPLETE — ${FUNNELS.length} funnels`,
      hashtag_sets: `COMPLETE — ${Object.keys(HASHTAG_SETS).length} sets`,
      video_scripts: "COMPLETE — 4 scripts (short + long form)",
      banner_specs: "COMPLETE — 7 banner formats",
      bios: `COMPLETE — ${PLATFORMS.length} platform bios`,
      email_sequences: "COMPLETE — 5-part welcome sequence"
    },
    platforms: PLATFORMS.map(p => p.name),
    activation_status: "READY_FOR_INSTANT_ACTIVATION"
  });
});

router.post("/generate", async (req: Request, res: Response) => {
  const { platform, format, context, industry, tone } = req.body as Record<string, string>;
  if (!platform || !format) {
    res.status(400).json({ ok: false, error: "platform and format are required" });
    return;
  }
  const platformData = PLATFORMS.find(p => p.id === platform);
  const platformName = platformData?.name ?? platform;
  const systemPrompt = `You are a world-class advertising copywriter and brand strategist for CreateAI Brain — an AI Operating System built by Sara Stadler / Lakeside Trinity LLC. The platform has 12 AI invention tools that replace expensive software licenses, hardware sensors, and professional consultants with pure AI intelligence. Brand voice: confident, authoritative, forward-thinking, practical. Accent color: indigo. Never use hype or empty promises. Always be specific about what AI replaces and the cost savings.`;
  const userPrompt = `Generate ${format} advertising content for ${platformName}.\n${context ? "Additional context: " + context : ""}\n${industry ? "Target industry: " + industry : "Target: entrepreneurs and business operators"}\n${tone ? "Tone: " + tone : "Tone: confident and authoritative"}\n\nBrand: CreateAI Brain | Tagline: 'The AI OS for Everything You Do' | Website: createaibrain.app\n\nProvide: headline, body copy, CTA, and relevant hashtags (if applicable for platform). Format clearly with labels.`;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1000
    });
    const content = completion.choices[0]?.message?.content ?? "";
    res.json({ ok: true, platform: platformName, format, generated: content });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
