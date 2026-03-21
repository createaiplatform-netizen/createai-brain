/**
 * adCreativeEngine.ts — AI-Powered Ad Creative Generator
 *
 * Uses OpenAI GPT-4o to generate extended platform-specific ad creatives:
 * - Primary + A/B variant headlines
 * - Platform-specific body copy (character-limit aware)
 * - Hooks, hooks, power words
 * - Hashtag sets for social platforms
 * - Call-to-action variations
 *
 * Creatives are cached in adCreatives.store.json alongside campaign definitions.
 */

import { openai } from "@workspace/integrations-openai-ai-server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AD_NETWORKS, type PreBuiltCampaign } from "./adsOrchestrator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.resolve(__dirname, "../../adCreatives.store.json");

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdCreativeSet {
  campaignId:     string;
  networkId:      string;
  campaignName:   string;
  generatedAt:    string;
  headlines:      string[];   // 3 variants, platform-limit truncated
  bodies:         string[];   // 3 variants
  hooks:          string[];   // Opening hooks / scroll-stop lines
  ctas:           string[];   // 3 CTA variants
  hashtags:       string[];   // For social platforms
  keywords:       string[];   // Search campaign keywords (Google/Bing/Bing)
  longFormCopy:   string;     // Full ad script for video/native
  primaryHeadline: string;
  primaryBody:     string;
  primaryCta:      string;
}

// ── Store ─────────────────────────────────────────────────────────────────────

let creativeStore: Record<string, AdCreativeSet> = {};

function loadStore() {
  if (!existsSync(STORE_PATH)) return;
  try { creativeStore = JSON.parse(readFileSync(STORE_PATH, "utf8")); } catch { /* empty */ }
}

function saveStore() {
  writeFileSync(STORE_PATH, JSON.stringify(creativeStore, null, 2));
}

loadStore();

// ── Platform copy limits ───────────────────────────────────────────────────────

const HEADLINE_LIMITS: Record<string, number> = {
  meta: 40, google: 30, tiktok: 100, linkedin: 70,
  twitter: 70, pinterest: 100, snapchat: 34, reddit: 300,
  microsoft: 30,
};
const BODY_LIMITS: Record<string, number> = {
  meta: 125, google: 90, tiktok: 100, linkedin: 600,
  twitter: 280, pinterest: 500, snapchat: 160, reddit: 10000,
  microsoft: 90,
};

// ── Core generator ─────────────────────────────────────────────────────────────

export async function generateCreative(campaign: PreBuiltCampaign): Promise<AdCreativeSet> {
  const network = AD_NETWORKS.find(n => n.id === campaign.networkId);
  const networkName = network?.name ?? campaign.networkId;
  const headlineLimit = HEADLINE_LIMITS[campaign.networkId] ?? 50;
  const bodyLimit = BODY_LIMITS[campaign.networkId] ?? 125;
  const isSearch = campaign.networkId === "google" || campaign.networkId === "microsoft";
  const isSocial = ["tiktok", "snapchat", "reddit", "twitter", "pinterest"].includes(campaign.networkId);

  const prompt = `You are a world-class performance marketing copywriter. Generate ad creatives for the following campaign.

PLATFORM: ${networkName}
CAMPAIGN NAME: ${campaign.name}
OBJECTIVE: ${campaign.objective}
AUDIENCE: ${campaign.audience}
BASE HEADLINE: ${campaign.creative.headline}
BASE BODY: ${campaign.creative.body}
BASE CTA: ${campaign.creative.cta}

PLATFORM LIMITS: headline ≤ ${headlineLimit} chars, body ≤ ${bodyLimit} chars

PRODUCT: CreateAI Brain — an AI operating system platform for Lakeside Trinity LLC (Sara Stadler). Monthly plans from $97 (Pro) to $497 (Enterprise). Includes 12 AI invention tools, HealthOS, LegalPM, StaffingOS. Replaces $100K+ enterprise software stacks. Payment: Cash App $CreateAIDigital or Venmo @CreateAIDigital.

Generate ONLY valid JSON matching this schema exactly:
{
  "headlines": ["variant1", "variant2", "variant3"],
  "bodies": ["variant1", "variant2", "variant3"],
  "hooks": ["scroll-stopper1", "scroll-stopper2", "scroll-stopper3"],
  "ctas": ["CTA1", "CTA2", "CTA3"],
  "hashtags": ${isSocial ? '["tag1", "tag2", "tag3", "tag4", "tag5"]' : '[]'},
  "keywords": ${isSearch ? '["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8", "kw9", "kw10"]' : '[]'},
  "longFormCopy": "Full 300-word ad script or extended native ad copy"
}

Rules:
- Headlines: under ${headlineLimit} characters each, punchy, benefit-led
- Bodies: under ${bodyLimit} characters each, no fluff, specific benefits
- Hooks: designed to stop scrolling in first 3 words
- CTAs: action verbs, urgency or curiosity, 2-4 words
${isSearch ? "- Keywords: phrase match, high commercial intent, mix branded + non-branded" : ""}
${isSocial ? "- Hashtags: mix niche + broad, no spaces, include #createaibrain" : ""}
- longFormCopy: compelling, story-driven, ends with clear CTA`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.8,
    max_tokens: 1200,
  });

  const raw = JSON.parse(completion.choices[0].message.content ?? "{}");

  const creative: AdCreativeSet = {
    campaignId:      campaign.id,
    networkId:       campaign.networkId,
    campaignName:    campaign.name,
    generatedAt:     new Date().toISOString(),
    headlines:       (raw.headlines ?? [campaign.creative.headline]).slice(0, 3),
    bodies:          (raw.bodies ?? [campaign.creative.body]).slice(0, 3),
    hooks:           (raw.hooks ?? []).slice(0, 3),
    ctas:            (raw.ctas ?? [campaign.creative.cta]).slice(0, 3),
    hashtags:        raw.hashtags ?? [],
    keywords:        raw.keywords ?? [],
    longFormCopy:    raw.longFormCopy ?? campaign.creative.body,
    primaryHeadline: (raw.headlines?.[0] ?? campaign.creative.headline).slice(0, headlineLimit),
    primaryBody:     (raw.bodies?.[0] ?? campaign.creative.body).slice(0, bodyLimit),
    primaryCta:      raw.ctas?.[0] ?? campaign.creative.cta,
  };

  creativeStore[campaign.id] = creative;
  saveStore();
  return creative;
}

// ── Bulk generator — all campaigns ────────────────────────────────────────────

export async function generateAllCreatives(forceRegenerate = false): Promise<{ generated: number; skipped: number; errors: string[] }> {
  const allCampaigns: PreBuiltCampaign[] = AD_NETWORKS.flatMap(n => n.campaigns);
  let generated = 0, skipped = 0;
  const errors: string[] = [];

  for (const campaign of allCampaigns) {
    if (!forceRegenerate && creativeStore[campaign.id]) { skipped++; continue; }
    try {
      await generateCreative(campaign);
      generated++;
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      errors.push(`${campaign.id}: ${String(err).slice(0, 80)}`);
    }
  }

  return { generated, skipped, errors };
}

// ── Getters ────────────────────────────────────────────────────────────────────

export function getCreative(campaignId: string): AdCreativeSet | null {
  return creativeStore[campaignId] ?? null;
}

export function getAllCreatives(): AdCreativeSet[] {
  return Object.values(creativeStore);
}

export function getCreativesForNetwork(networkId: string): AdCreativeSet[] {
  return Object.values(creativeStore).filter(c => c.networkId === networkId);
}

export function getCreativeStore(): Record<string, AdCreativeSet> {
  return creativeStore;
}
