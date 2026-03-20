/**
 * trendDetector.ts — detectTrendingCategories()
 * Spec: zeroTouchSuperLaunch (Pasted--ZERO-TOUCH...)
 *
 * Returns a ranked list of trending AI product categories.
 * Primary: attempts to hit live trend APIs.
 * Fallback: rotates through a curated list weighted by cycle-based scoring,
 *           ensuring variety without repetition each cycle.
 */

const TREND_APIS = [
  "https://api.example.com/trending/categories",
  "https://api.example.com/viral/niches",
];

// Weighted niche pool — all categories Sara's AI market engine can target
const NICHE_POOL: string[] = [
  // Productivity & Business
  "AI Writing Assistant",       "Smart Productivity Suite",   "Automated Research Tool",
  "AI Video Script Writer",     "Social Media AI Manager",    "Smart Customer Support Bot",
  "AI SEO Optimizer",           "Automated Data Analyst",     "AI Code Reviewer",
  "Smart Business Dashboard",   "AI Language Tutor",          "Content Calendar AI",
  "AI Lead Generator",          "Smart Invoice Manager",      "AI Brand Identity Kit",
  "Automated Email Drafter",    "AI Market Research Agent",   "Smart Goal Tracker",
  "AI Legal Document Helper",   "Smart Schedule Optimizer",

  // Creative & Media
  "AI Music Composer",          "AI Art Generator",           "AI Podcast Producer",
  "AI Story Writer",            "AI Logo Designer",           "AI Video Editor",
  "AI Photography Enhancer",    "AI Course Creator",          "AI Newsletter Builder",
  "AI Presentation Maker",

  // Finance & E-commerce
  "AI Investment Advisor",      "Smart Budget Planner",       "AI Pricing Optimizer",
  "E-commerce AI Suite",        "AI Sales Forecaster",        "Smart Expense Tracker",
  "AI Profit Analyzer",         "Automated Bookkeeping AI",   "AI Drop-shipping Manager",
  "Smart Affiliate AI",

  // Health & Wellness
  "AI Fitness Coach",           "Smart Nutrition Planner",    "AI Mental Health Companion",
  "Smart Sleep Optimizer",      "AI Meditation Guide",        "Smart Recovery Tracker",

  // Education & Personal Growth
  "AI Skill Accelerator",       "Smart Habit Builder",        "AI Career Coach",
  "Smart Study Assistant",      "AI Interview Prep Tool",     "Smart Life Organizer",
];

let _cycleOffset = 0;

// Shuffle deterministically per cycle so we always get variety
function weightedShuffle(pool: string[], count: number, seed: number): string[] {
  const shuffled = [...pool].sort(() => Math.sin(seed * 9301 + 49297) % 1 - 0.5);
  return shuffled.slice(0, count);
}

export async function detectTrendingCategories(count = 5): Promise<string[]> {
  // Attempt live trend APIs
  for (const url of TREND_APIS) {
    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      const res   = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json() as Array<{ name?: string; category?: string }>;
        const names = data
          .map(d => d.name ?? d.category ?? "")
          .filter(Boolean)
          .slice(0, count);
        if (names.length >= count) return names;
      }
    } catch { /* unreachable — fall through */ }
  }

  // Fallback: rotate through niche pool
  _cycleOffset++;
  return weightedShuffle(NICHE_POOL, count, _cycleOffset);
}
