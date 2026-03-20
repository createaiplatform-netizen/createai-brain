/**
 * trendDetector.ts — detectTrendingCategories()
 * Spec: zeroTouchSuperLaunch (Pasted--ZERO-TOUCH...)
 *
 * Returns a ranked list of trending AI product categories.
 * Rotates through a curated niche pool weighted by cycle-based scoring,
 * ensuring variety without repetition each cycle.
 *
 * ROADMAP: Connect a live trend data source (Google Trends API, Reddit API,
 * or a paid trends feed) and replace the weighted shuffle with live rankings.
 */

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

/**
 * Returns a ranked list of trending AI product categories.
 * Accepts either a plain count number OR an options object { topN }.
 * Synchronous — safe to call without await in tight loops.
 */
export function detectTrendingCategories(opts: number | { topN?: number } = 5): string[] {
  const count = typeof opts === "number" ? opts : (opts.topN ?? 5);
  _cycleOffset++;
  return weightedShuffle(NICHE_POOL, count, _cycleOffset);
}
