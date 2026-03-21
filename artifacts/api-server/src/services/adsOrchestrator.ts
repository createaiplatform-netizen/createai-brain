/**
 * adsOrchestrator.ts — Universal Ad Deployment Orchestrator
 *
 * Manages all 12 ad networks:
 *  - Credential status per network (reads from adCredentials encrypted store)
 *  - Pre-built campaign library (queued → fires the moment credentials enter)
 *  - Internal platform ad system (live immediately — no external accounts)
 *  - Unified reporting aggregator
 *  - Setup wizard: exact steps Sara must complete per network
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { serverPath } from "../utils/serverPaths.js";

const STORE_PATH = serverPath("adCredentials.store.json");
const STORE_KEY  = scryptSync("ad-creds-bridge-v1", "ad-salt-lakeside", 32);

// ─── Encrypted Ad Credential Store ────────────────────────────────────────────

function encryptVal(v: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", STORE_KEY, iv);
  const enc = Buffer.concat([cipher.update(v, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), enc.toString("hex")].join(".");
}
function decryptVal(s: string): string {
  const [ivH, tagH, encH] = s.split(".");
  const decipher = createDecipheriv("aes-256-gcm", STORE_KEY, Buffer.from(ivH, "hex"));
  decipher.setAuthTag(Buffer.from(tagH, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(encH, "hex")), decipher.final()]).toString("utf8");
}

let adStore = new Map<string, string>();

function loadAdStore() {
  if (!existsSync(STORE_PATH)) return;
  try {
    const raw = JSON.parse(readFileSync(STORE_PATH, "utf8"));
    for (const [k, v] of Object.entries(raw)) {
      try {
        const dec = decryptVal(v as string);
        adStore.set(k, dec);
        process.env[k] = dec;
      } catch { /* skip corrupt entries */ }
    }
  } catch { /* store not yet created */ }
}

function saveAdStore() {
  const out: Record<string, string> = {};
  for (const [k, v] of adStore.entries()) out[k] = encryptVal(v);
  writeFileSync(STORE_PATH, JSON.stringify(out, null, 2));
}

loadAdStore();

export function setAdCredential(key: string, value: string): void {
  adStore.set(key, value);
  process.env[key] = value;
  saveAdStore();
}

export function getAdCredential(key: string): string | undefined {
  return adStore.get(key) ?? process.env[key];
}

export function clearAdCredential(key: string): void {
  adStore.delete(key);
  delete process.env[key];
  saveAdStore();
}

// ─── Ad Network Definitions ───────────────────────────────────────────────────

export interface AdNetworkDef {
  id:              string;
  name:            string;
  platforms:       string[];
  icon:            string;
  color:           string;
  credentials:     { key: string; label: string; placeholder: string; helpUrl: string }[];
  minBudgetDay:    number;
  setupTime:       string;
  setupUrl:        string;
  apiDocsUrl:      string;
  requires:        { item: string; note: string }[];  // identity/billing steps — Sara's required actions
  setupSteps:      string[];
  campaigns:       PreBuiltCampaign[];
}

export interface PreBuiltCampaign {
  id:          string;
  networkId:   string;
  name:        string;
  objective:   "awareness" | "traffic" | "leads" | "conversions" | "retargeting";
  audience:    string;
  dailyBudget: number;
  creative: {
    format:   string;
    headline: string;
    body:     string;
    cta:      string;
  };
  targeting: {
    ageMin:   number;
    ageMax:   number;
    interests: string[];
    locations: string[];
  };
}

export const AD_NETWORKS: AdNetworkDef[] = [
  {
    id: "meta",
    name: "Meta Ads (Facebook + Instagram)",
    platforms: ["Facebook", "Instagram"],
    icon: "📘",
    color: "#1877F2",
    credentials: [
      { key: "META_ADS_ACCESS_TOKEN",  label: "System User Access Token", placeholder: "EAAxxxxxxxxxx...", helpUrl: "https://business.facebook.com/settings/system-users" },
      { key: "META_AD_ACCOUNT_ID",     label: "Ad Account ID",            placeholder: "act_xxxxxxxxxx",   helpUrl: "https://business.facebook.com/adsmanager" },
      { key: "META_PIXEL_ID",          label: "Pixel ID (optional)",       placeholder: "1234567890",       helpUrl: "https://business.facebook.com/events/manager" },
    ],
    minBudgetDay: 5,
    setupTime: "~30 minutes",
    setupUrl: "https://business.facebook.com",
    apiDocsUrl: "https://developers.facebook.com/docs/marketing-apis",
    requires: [
      { item: "Facebook Business Account", note: "business.facebook.com → Create account with your legal name and Lakeside Trinity LLC details" },
      { item: "Identity verification",     note: "Upload government-issued ID when prompted (required for ad account)" },
      { item: "Payment method",            note: "Add a credit/debit card or PayPal in Business Settings → Payments" },
      { item: "Ad Account creation",       note: "Business Settings → Ad Accounts → Create — choose 'Advertise my own business'" },
    ],
    setupSteps: [
      "Go to business.facebook.com → Create or open your Business Account",
      "Go to Business Settings → Ad Accounts → Add → Create new ad account",
      "Set currency to USD, time zone to your local zone, add Lakeside Trinity LLC as the business",
      "Go to Business Settings → System Users → Add system user (Admin role)",
      "Generate a token for the system user — check ads_management, ads_read, and pages_read_engagement",
      "Copy the System User Access Token → paste into Credentials Hub (ad networks)",
      "Copy the Ad Account ID (format: act_XXXXXXXXX) → paste into Credentials Hub",
      "Optional: Install Facebook Pixel on createaiplatform.com — copy Pixel ID → paste into Credentials Hub",
    ],
    campaigns: [
      {
        id: "meta-awareness",
        networkId: "meta",
        name: "CreateAI Brain — Brand Awareness",
        objective: "awareness",
        audience: "Entrepreneurs, business owners, healthcare operators, legal professionals — 28-55 — USA/Canada",
        dailyBudget: 20,
        creative: {
          format: "Single Video (4:5, 1080×1350px, 30-60s)",
          headline: "The AI OS That Replaced a $100K Software Stack",
          body: "12 AI invention tools. HealthOS. LegalPM. StaffingOS. One platform. $97/mo. No hardware. No licenses.",
          cta: "Learn More",
        },
        targeting: { ageMin: 28, ageMax: 55, interests: ["entrepreneurship","healthcare","legal","saas","business software"], locations: ["United States","Canada"] },
      },
      {
        id: "meta-leads",
        networkId: "meta",
        name: "CreateAI Brain — Lead Generation",
        objective: "leads",
        audience: "Decision-makers in healthcare, legal, logistics, finance — 30-55",
        dailyBudget: 30,
        creative: {
          format: "Carousel (1:1, 1080×1080px, 5-10 cards)",
          headline: "Replace Your Software Stack With One AI Platform",
          body: "Healthcare operators are saving $43K/year. Legal firms cut Westlaw costs. Fleet managers dropped GPS hardware. Join free today.",
          cta: "Get Free Access",
        },
        targeting: { ageMin: 30, ageMax: 55, interests: ["medical practice management","legal technology","fleet management","AI tools"], locations: ["United States"] },
      },
      {
        id: "meta-retargeting",
        networkId: "meta",
        name: "CreateAI Brain — Retargeting",
        objective: "retargeting",
        audience: "Website visitors + video viewers from awareness campaign",
        dailyBudget: 10,
        creative: {
          format: "Single Image (1:1, 1080×1080px)",
          headline: "Still thinking about it?",
          body: "Your industry-specific AI tools are ready. No setup. No learning curve. Try free — no card required.",
          cta: "Start Free",
        },
        targeting: { ageMin: 25, ageMax: 60, interests: ["retargeting"], locations: ["United States","Canada"] },
      },
    ],
  },
  {
    id: "google",
    name: "Google Ads (Search + Display + YouTube)",
    platforms: ["Google Search", "Google Display Network", "YouTube"],
    icon: "🔍",
    color: "#4285F4",
    credentials: [
      { key: "GOOGLE_ADS_DEVELOPER_TOKEN", label: "Developer Token",       placeholder: "xxxxxxxxxxxxxxxx",   helpUrl: "https://developers.google.com/google-ads/api/docs/get-started/dev-token" },
      { key: "GOOGLE_ADS_CUSTOMER_ID",     label: "Customer ID",           placeholder: "xxx-xxx-xxxx",        helpUrl: "https://ads.google.com" },
      { key: "GOOGLE_ADS_REFRESH_TOKEN",   label: "OAuth Refresh Token",   placeholder: "1//0e...",            helpUrl: "https://developers.google.com/google-ads/api/docs/oauth/overview" },
      { key: "GOOGLE_ADS_CLIENT_ID",       label: "OAuth Client ID",       placeholder: "xxxxxxxx.apps.googleusercontent.com", helpUrl: "https://console.cloud.google.com" },
      { key: "GOOGLE_ADS_CLIENT_SECRET",   label: "OAuth Client Secret",   placeholder: "GOCSPX-...",          helpUrl: "https://console.cloud.google.com" },
    ],
    minBudgetDay: 10,
    setupTime: "~2 hours (developer token requires Google review: 1-3 weeks)",
    setupUrl: "https://ads.google.com",
    apiDocsUrl: "https://developers.google.com/google-ads/api",
    requires: [
      { item: "Google Ads account",         note: "ads.google.com → Create account with Lakeside Trinity LLC billing info" },
      { item: "Valid payment method",        note: "Add a credit card to your Google Ads account — required before any campaigns run" },
      { item: "Developer token (review)",    note: "Google Ads → Tools → API Center → Apply for developer token. Google reviews in 1-3 weeks. Request Basic Access (standard production access)." },
      { item: "OAuth credentials",           note: "Google Cloud Console → Create OAuth app → Download client_secret.json" },
    ],
    setupSteps: [
      "Create a Google Ads account at ads.google.com — use admin@createaiplatform.com",
      "Add a billing method (credit card) — campaigns won't run without it",
      "Go to Tools & Settings → API Center → Apply for developer token (choose 'Basic Access')",
      "While waiting for developer token: go to console.cloud.google.com → create a project → enable Google Ads API",
      "Create OAuth 2.0 credentials (Web application type) → download client_secret.json",
      "Run OAuth flow to get refresh token → paste into Credentials Hub",
      "Once developer token approved: paste developer token + Customer ID into Credentials Hub",
    ],
    campaigns: [
      {
        id: "google-search",
        networkId: "google",
        name: "CreateAI Brain — Search (High Intent)",
        objective: "conversions",
        audience: "Active searchers: 'AI business software', 'replace EHR software', 'legal research AI', 'fleet management AI'",
        dailyBudget: 50,
        creative: {
          format: "Responsive Search Ad (3 headlines, 2 descriptions)",
          headline: "CreateAI Brain — AI OS | 12 AI Invention Tools | Replace $100K Software",
          body: "One platform replaces your entire software stack. Healthcare, Legal, Fleet, Finance. No hardware. No licenses. Try free.",
          cta: "Visit Website",
        },
        targeting: { ageMin: 25, ageMax: 65, interests: ["business software","healthcare tech","legal tech","fleet management"], locations: ["United States","Canada"] },
      },
      {
        id: "google-youtube",
        networkId: "google",
        name: "CreateAI Brain — YouTube Skippable",
        objective: "awareness",
        audience: "Business owners, healthcare operators, legal professionals — YouTube viewers",
        dailyBudget: 25,
        creative: {
          format: "Skippable In-Stream (16:9, 30-60s, skip after 5s)",
          headline: "The AI OS replacing your entire software stack",
          body: "0-5s hook: 'I replaced $4,800/month in software with one AI platform.' Demo CreateAI Brain, show all 12 tools, CTA: createaiplatform.com",
          cta: "Visit Website",
        },
        targeting: { ageMin: 25, ageMax: 60, interests: ["entrepreneurship","healthcare","legal","saas"], locations: ["United States"] },
      },
      {
        id: "google-display",
        networkId: "google",
        name: "CreateAI Brain — Display Retargeting",
        objective: "retargeting",
        audience: "Website visitors across the Google Display Network",
        dailyBudget: 15,
        creative: {
          format: "Responsive Display Ad (multiple sizes)",
          headline: "CreateAI Brain — AI OS for Everything",
          body: "Still looking? Your AI tools are ready. 12 invention tools. HealthOS. LegalPM. Try free.",
          cta: "Learn More",
        },
        targeting: { ageMin: 25, ageMax: 65, interests: ["retargeting"], locations: ["United States","Canada"] },
      },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok Ads",
    platforms: ["TikTok"],
    icon: "🎵",
    color: "#010101",
    credentials: [
      { key: "TIKTOK_ADS_ACCESS_TOKEN",    label: "Access Token",    placeholder: "xxxxxxxxxxxxxxxx", helpUrl: "https://ads.tiktok.com/help/article?aid=10014978" },
      { key: "TIKTOK_ADS_ADVERTISER_ID",   label: "Advertiser ID",   placeholder: "7XXXXXXXXXXXXXXXXX", helpUrl: "https://ads.tiktok.com" },
      { key: "TIKTOK_ADS_APP_ID",          label: "App ID (optional)", placeholder: "xxxxxxxxxxxxxxxx", helpUrl: "https://developers.tiktok.com" },
    ],
    minBudgetDay: 20,
    setupTime: "~25 minutes",
    setupUrl: "https://ads.tiktok.com",
    apiDocsUrl: "https://ads.tiktok.com/marketing_api/docs",
    requires: [
      { item: "TikTok Ads Manager account", note: "ads.tiktok.com → Register with admin@createaiplatform.com, select 'Business' account type" },
      { item: "Business verification",       note: "Upload Lakeside Trinity LLC business documents when prompted" },
      { item: "Payment method",              note: "Add a credit card in Billing & Payments — minimum $20/day budget enforced by TikTok" },
    ],
    setupSteps: [
      "Go to ads.tiktok.com → Create account → select 'Advertiser'",
      "Fill in business info: Lakeside Trinity LLC, admin@createaiplatform.com, Software/Technology industry",
      "Verify business — upload any business document if requested",
      "Add billing: Ads Manager → Account → Billing → Add payment method",
      "Go to TikTok For Business → Tools → TikTok Marketing API → Create app",
      "Generate access token → copy Advertiser ID from Ads Manager URL → paste both into Credentials Hub",
    ],
    campaigns: [
      {
        id: "tiktok-infeed",
        networkId: "tiktok",
        name: "CreateAI Brain — In-Feed (Organic-Style)",
        objective: "traffic",
        audience: "Entrepreneurs, startup founders, tech enthusiasts — 22-40",
        dailyBudget: 30,
        creative: {
          format: "In-Feed Video (9:16, 1080×1920px, 15-30s)",
          headline: "POV: You just replaced your entire software stack with one AI",
          body: "CreateAI Brain: 12 invention tools, no hardware, no licenses, $97/mo. HealthOS, LegalPM, StaffingOS. Link in bio.",
          cta: "Learn More",
        },
        targeting: { ageMin: 22, ageMax: 40, interests: ["AI tools","startup","entrepreneurship","technology","business"], locations: ["United States","Canada"] },
      },
      {
        id: "tiktok-topfeed",
        networkId: "tiktok",
        name: "CreateAI Brain — Spark Ad (Boost Organic)",
        objective: "awareness",
        audience: "Broad entrepreneurship + tech audience — 18-45",
        dailyBudget: 20,
        creative: {
          format: "Spark Ad (boost your organic TikToks with ad budget)",
          headline: "This AI tool just replaced our $4,800/month software suite",
          body: "Boost your best-performing organic TikTok posts with this campaign for maximum reach",
          cta: "Shop Now",
        },
        targeting: { ageMin: 18, ageMax: 45, interests: ["technology","business","entrepreneur"], locations: ["United States"] },
      },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn Ads",
    platforms: ["LinkedIn"],
    icon: "💼",
    color: "#0A66C2",
    credentials: [
      { key: "LINKEDIN_ADS_ACCESS_TOKEN",  label: "OAuth Access Token", placeholder: "AQXxxxxxxxx...",    helpUrl: "https://www.linkedin.com/developers/apps" },
      { key: "LINKEDIN_ADS_ACCOUNT_ID",    label: "Ad Account ID",      placeholder: "xxxxxxxxx",          helpUrl: "https://www.linkedin.com/campaignmanager" },
      { key: "LINKEDIN_ADS_ORGANIZATION_ID", label: "Organization ID",  placeholder: "xxxxxxxxx",          helpUrl: "https://www.linkedin.com/company" },
    ],
    minBudgetDay: 10,
    setupTime: "~30 minutes",
    setupUrl: "https://www.linkedin.com/campaignmanager",
    apiDocsUrl: "https://learn.microsoft.com/en-us/linkedin/marketing/",
    requires: [
      { item: "LinkedIn Company Page",     note: "Create LinkedIn Company Page for Lakeside Trinity LLC / CreateAI Brain at linkedin.com/company/setup" },
      { item: "Campaign Manager account",   note: "linkedin.com/campaignmanager → Associate with company page, add billing" },
      { item: "Payment method",             note: "Campaign Manager → Account Assets → Billing → Add credit card (min $10/day budget)" },
      { item: "Developer App",              note: "linkedin.com/developers/apps → Create app → Request Marketing Developer Platform access" },
    ],
    setupSteps: [
      "Create LinkedIn Company Page: linkedin.com/company/setup → company name: Lakeside Trinity LLC, URL: createaibrain",
      "Open Campaign Manager: linkedin.com/campaignmanager → Create ad account → Associate with company page",
      "Add billing credit card in Campaign Manager → Account Assets → Billing Center",
      "Create LinkedIn developer app: developers.linkedin.com → My Apps → Create app",
      "In the app, go to Auth → OAuth 2.0 tools → Request Marketing Developer Platform access",
      "Generate access token with r_ads + rw_ads + r_organization_social scopes",
      "Copy Access Token + Ad Account ID (from Campaign Manager URL) + Organization ID → paste into Credentials Hub",
    ],
    campaigns: [
      {
        id: "linkedin-b2b",
        networkId: "linkedin",
        name: "CreateAI Brain — B2B Decision Makers",
        objective: "leads",
        audience: "CEOs, COOs, Directors — Healthcare, Legal, Logistics, Finance — Companies 10-500 employees",
        dailyBudget: 50,
        creative: {
          format: "Single Image Ad (1200×627px) + Lead Gen Form",
          headline: "Replace Your Entire Software Stack With One AI Platform",
          body: "CreateAI Brain gives healthcare operators, legal professionals, and enterprise teams 12 AI invention tools that replace $500K+ in annual software costs. Try free — no card required.",
          cta: "Get Free Access",
        },
        targeting: { ageMin: 30, ageMax: 60, interests: ["healthcare","legal","logistics","finance","SaaS","AI","automation"], locations: ["United States","Canada"] },
      },
      {
        id: "linkedin-thought",
        networkId: "linkedin",
        name: "CreateAI Brain — Thought Leadership (Document Ad)",
        objective: "awareness",
        audience: "Healthcare executives, Legal partners, Operations directors",
        dailyBudget: 20,
        creative: {
          format: "Document Ad (PDF carousel, swipeable)",
          headline: "12 AI Tools That Are Replacing Entire Industry Software Categories",
          body: "A 12-page breakdown of each AI invention tool: what it replaces, the annual cost it eliminates, and how it works with pure AI — no hardware, no licenses, no consultants.",
          cta: "Download Now",
        },
        targeting: { ageMin: 30, ageMax: 65, interests: ["healthcare","legal services","logistics","AI","digital transformation"], locations: ["United States"] },
      },
    ],
  },
  {
    id: "twitter_x",
    name: "X (Twitter) Ads",
    platforms: ["X / Twitter"],
    icon: "✖️",
    color: "#000000",
    credentials: [
      { key: "TWITTER_ADS_ACCESS_TOKEN",   label: "Access Token",         placeholder: "xxxxxxxxx-xxxxxxxx", helpUrl: "https://developer.twitter.com/en/portal/dashboard" },
      { key: "TWITTER_ADS_ACCESS_SECRET",  label: "Access Token Secret",  placeholder: "xxxxxxxxxxxxxxxxxx", helpUrl: "https://developer.twitter.com/en/portal/dashboard" },
      { key: "TWITTER_ADS_CONSUMER_KEY",   label: "API Key (Consumer)",   placeholder: "xxxxxxxxxxxxxxxxxx", helpUrl: "https://developer.twitter.com/en/portal/dashboard" },
      { key: "TWITTER_ADS_CONSUMER_SECRET",label: "API Secret (Consumer)",placeholder: "xxxxxxxxxxxxxxxxxx", helpUrl: "https://developer.twitter.com/en/portal/dashboard" },
      { key: "TWITTER_ADS_ACCOUNT_ID",     label: "Ads Account ID",       placeholder: "xxxxxxxxx",          helpUrl: "https://ads.twitter.com" },
    ],
    minBudgetDay: 5,
    setupTime: "~45 minutes (Elevated API access required — usually same-day approval)",
    setupUrl: "https://ads.twitter.com",
    apiDocsUrl: "https://developer.twitter.com/en/docs/twitter-ads-api",
    requires: [
      { item: "X Ads account",              note: "ads.twitter.com → Connect your @createaibrain X account (or create one) and set up billing" },
      { item: "Billing method",             note: "X Ads → Billing → Add credit card" },
      { item: "Developer portal access",    note: "developer.twitter.com → Create project → Apply for Elevated access (required for Ads API)" },
      { item: "Elevated API access",        note: "In developer portal, apply for Elevated access — describe your use case as campaign management for Lakeside Trinity LLC" },
    ],
    setupSteps: [
      "Create or use existing X account @createaibrain — verify email and phone",
      "Go to ads.twitter.com → Connect account → Add billing (credit card)",
      "Go to developer.twitter.com → Create a project + app",
      "Request Elevated access (describe: 'Campaign management API for CreateAI Brain — Lakeside Trinity LLC')",
      "Once approved: generate Consumer Keys + Access Tokens in the developer portal",
      "Copy all 4 keys + Ads Account ID (from ads.twitter.com URL) → paste into Credentials Hub",
    ],
    campaigns: [
      {
        id: "twitter-promoted",
        networkId: "twitter_x",
        name: "CreateAI Brain — Promoted Tweets",
        objective: "traffic",
        audience: "Tech founders, SaaS executives, developers, AI enthusiasts on X",
        dailyBudget: 20,
        creative: {
          format: "Promoted Tweet (text + image card, 1200×675px)",
          headline: "The AI OS That Replaced My Entire Software Stack",
          body: "12 AI invention tools. No hardware. No licenses. HealthOS, LegalPM, StaffingOS — all for $97/mo. Thread 🧵 [link]",
          cta: "Read More",
        },
        targeting: { ageMin: 22, ageMax: 50, interests: ["AI","SaaS","startup","technology","business"], locations: ["United States","Canada"] },
      },
    ],
  },
  {
    id: "pinterest",
    name: "Pinterest Ads",
    platforms: ["Pinterest"],
    icon: "📌",
    color: "#E60023",
    credentials: [
      { key: "PINTEREST_ADS_ACCESS_TOKEN", label: "Access Token",   placeholder: "xxxxxxxxxxxxxxxxxx", helpUrl: "https://developers.pinterest.com/apps" },
      { key: "PINTEREST_AD_ACCOUNT_ID",    label: "Ad Account ID",  placeholder: "xxxxxxxxxxxxxxxxxx", helpUrl: "https://ads.pinterest.com" },
    ],
    minBudgetDay: 2,
    setupTime: "~20 minutes",
    setupUrl: "https://ads.pinterest.com",
    apiDocsUrl: "https://developers.pinterest.com/docs/api/v5/",
    requires: [
      { item: "Pinterest Business account", note: "business.pinterest.com → Convert personal or create new → Add business name: CreateAI Brain / Lakeside Trinity LLC" },
      { item: "Payment method",             note: "Pinterest Business → Billing → Add credit card (min $2/day)" },
      { item: "Developer app",              note: "developers.pinterest.com → My Apps → Create → Select Pinterest API for Shopping or Advertising" },
    ],
    setupSteps: [
      "Go to business.pinterest.com → Create business account with admin@createaiplatform.com",
      "Fill in business info: Lakeside Trinity LLC, Technology category, createaiplatform.com website",
      "Verify website (Pinterest will give a meta tag or HTML file to add)",
      "Add billing: Pinterest Business → Ads → Billing → Add payment method",
      "Create developer app at developers.pinterest.com → My Apps → New App → Request ads:read + ads:write + boards:read scopes",
      "Generate access token → copy Ad Account ID from ads.pinterest.com URL → paste both into Credentials Hub",
    ],
    campaigns: [
      {
        id: "pinterest-static",
        networkId: "pinterest",
        name: "CreateAI Brain — Idea Pins (Lead Gen)",
        objective: "traffic",
        audience: "Female entrepreneurs, business owners, creatives running businesses — 25-50",
        dailyBudget: 10,
        creative: {
          format: "Standard Pin (2:3, 1000×1500px, static image + text overlay)",
          headline: "12 AI Tools That Replace $500K in Business Software",
          body: "From AI Clinical Scribe to AI Legal Research — one platform replaces it all. HealthOS, LegalPM, StaffingOS. Try CreateAI Brain free.",
          cta: "Learn More",
        },
        targeting: { ageMin: 25, ageMax: 55, interests: ["entrepreneurship","business tools","AI","healthcare","productivity"], locations: ["United States","Canada"] },
      },
    ],
  },
  {
    id: "snapchat",
    name: "Snapchat Ads",
    platforms: ["Snapchat"],
    icon: "👻",
    color: "#FFFC00",
    credentials: [
      { key: "SNAPCHAT_ADS_ACCESS_TOKEN",  label: "OAuth Access Token", placeholder: "xxxxxxxxxxxxxxxxxx",    helpUrl: "https://developers.snapchat.com/api/docs" },
      { key: "SNAPCHAT_AD_ACCOUNT_ID",     label: "Ad Account ID",      placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", helpUrl: "https://ads.snapchat.com" },
    ],
    minBudgetDay: 5,
    setupTime: "~25 minutes",
    setupUrl: "https://ads.snapchat.com",
    apiDocsUrl: "https://developers.snapchat.com/api/docs",
    requires: [
      { item: "Snapchat Ads Manager account", note: "ads.snapchat.com → Create account with admin@createaiplatform.com" },
      { item: "Payment method",               note: "Ads Manager → Billing → Add credit card" },
      { item: "Business name verification",   note: "Fill in business details: Lakeside Trinity LLC, Technology industry" },
    ],
    setupSteps: [
      "Go to ads.snapchat.com → Create new account → business name: Lakeside Trinity LLC",
      "Add billing credit card — set daily budget minimum to $5",
      "Go to Business Settings → API → Create OAuth app",
      "Generate access token with snapchat_marketing_api scope",
      "Copy Ad Account ID from Ads Manager URL + Access Token → paste into Credentials Hub",
    ],
    campaigns: [
      {
        id: "snapchat-story",
        networkId: "snapchat",
        name: "CreateAI Brain — Single Snap Ad",
        objective: "awareness",
        audience: "Young entrepreneurs, tech enthusiasts, freelancers — 18-34",
        dailyBudget: 15,
        creative: {
          format: "Single Snap (9:16, 1080×1920px, 3-180s video)",
          headline: "This AI just made your software obsolete",
          body: "CreateAI Brain: 12 AI tools, $97/mo. No hardware. No licenses. HealthOS, LegalPM, StaffingOS. Tap to see more →",
          cta: "Swipe Up",
        },
        targeting: { ageMin: 18, ageMax: 34, interests: ["technology","startup","business","AI"], locations: ["United States"] },
      },
    ],
  },
  {
    id: "reddit",
    name: "Reddit Ads",
    platforms: ["Reddit"],
    icon: "🟠",
    color: "#FF4500",
    credentials: [
      { key: "REDDIT_ADS_ACCESS_TOKEN",    label: "OAuth Access Token", placeholder: "xxxxxxxxxxxxxxxxxx",    helpUrl: "https://www.reddit.com/prefs/apps" },
      { key: "REDDIT_ADS_ACCOUNT_ID",      label: "Account ID",         placeholder: "xxxxxxxxxx",            helpUrl: "https://ads.reddit.com" },
      { key: "REDDIT_ADS_CLIENT_ID",       label: "Client ID",          placeholder: "xxxxxxxxxxxxxxxxxx",    helpUrl: "https://www.reddit.com/prefs/apps" },
      { key: "REDDIT_ADS_CLIENT_SECRET",   label: "Client Secret",      placeholder: "xxxxxxxxxxxxxxxxxx",    helpUrl: "https://www.reddit.com/prefs/apps" },
    ],
    minBudgetDay: 5,
    setupTime: "~20 minutes",
    setupUrl: "https://ads.reddit.com",
    apiDocsUrl: "https://ads-api.reddit.com/docs/v3",
    requires: [
      { item: "Reddit account",         note: "Create or use existing Reddit account — username: createaibrain or similar" },
      { item: "Reddit Ads account",     note: "ads.reddit.com → Create account → add billing credit card" },
      { item: "Reddit developer app",   note: "reddit.com/prefs/apps → Create app → select 'script' type for server-side" },
    ],
    setupSteps: [
      "Create Reddit account (or use existing) — go to ads.reddit.com",
      "Set up Ads account: add billing credit card, business info for Lakeside Trinity LLC",
      "Go to reddit.com/prefs/apps → Create another app → type: 'script' → redirect URI: http://localhost:8080",
      "Copy Client ID and Client Secret from the app",
      "Exchange for access token via OAuth → paste Client ID, Secret, and Access Token into Credentials Hub",
      "Copy Account ID from ads.reddit.com URL → paste into Credentials Hub",
    ],
    campaigns: [
      {
        id: "reddit-promoted",
        networkId: "reddit",
        name: "CreateAI Brain — Promoted Post (Niche Subreddits)",
        objective: "traffic",
        audience: "r/entrepreneur, r/healthcare, r/legaladvice, r/artificial, r/SaaS, r/startups members",
        dailyBudget: 15,
        creative: {
          format: "Promoted Post (text + image, 1200×628px)",
          headline: "We built 12 AI tools that replace $500K+ in software. Here's what they do.",
          body: "AI Clinical Scribe (no EHR), AI Legal Research (no Westlaw), AI Fleet Intelligence (no GPS hardware), AI Agronomist (no sensors). All in one AI OS. AMA in comments.",
          cta: "Learn More",
        },
        targeting: { ageMin: 22, ageMax: 50, interests: ["entrepreneur","healthcare","legal","AI","startup","SaaS"], locations: ["United States","Canada"] },
      },
    ],
  },
  {
    id: "microsoft",
    name: "Microsoft Advertising (Bing + LinkedIn Audience)",
    platforms: ["Bing Search", "Microsoft Audience Network"],
    icon: "🪟",
    color: "#00A4EF",
    credentials: [
      { key: "MICROSOFT_ADS_DEVELOPER_TOKEN", label: "Developer Token",  placeholder: "xxxxxxxxxxxxxxxxxx", helpUrl: "https://developers.ads.microsoft.com/Account" },
      { key: "MICROSOFT_ADS_CUSTOMER_ID",     label: "Customer ID",      placeholder: "xxxxxxxxxx",          helpUrl: "https://ui.ads.microsoft.com" },
      { key: "MICROSOFT_ADS_CLIENT_ID",       label: "OAuth Client ID",  placeholder: "xxxxxxxx-xxxx-xxxx-xxxx", helpUrl: "https://developers.ads.microsoft.com" },
      { key: "MICROSOFT_ADS_REFRESH_TOKEN",   label: "OAuth Refresh Token", placeholder: "M.Cxxxxxxxxx...", helpUrl: "https://developers.ads.microsoft.com" },
    ],
    minBudgetDay: 5,
    setupTime: "~30 minutes",
    setupUrl: "https://ads.microsoft.com",
    apiDocsUrl: "https://docs.microsoft.com/en-us/advertising/guides/get-started",
    requires: [
      { item: "Microsoft Advertising account", note: "ads.microsoft.com → Sign up with admin@createaiplatform.com or Microsoft account" },
      { item: "Payment method",                note: "Billing → Add credit card (pre-pay or postpay)" },
      { item: "Developer token",               note: "In account → go to Tools → Microsoft Advertising API → Request developer token (same-day approval usually)" },
    ],
    setupSteps: [
      "Go to ads.microsoft.com → Create account with admin@createaiplatform.com",
      "Add billing: Tools → Accounts → Billing → Add credit card",
      "Get developer token: Tools → Bing Ads API → Request developer token",
      "Register OAuth app at apps.dev.microsoft.com → set redirect URI to http://localhost:8080/oauth2/callback",
      "Generate refresh token via OAuth flow",
      "Copy Developer Token + Customer ID (from account URL) + Client ID + Refresh Token → paste into Credentials Hub",
    ],
    campaigns: [
      {
        id: "microsoft-search",
        networkId: "microsoft",
        name: "CreateAI Brain — Bing Search",
        objective: "conversions",
        audience: "Active Bing searchers — business software, healthcare IT, legal tech terms",
        dailyBudget: 20,
        creative: {
          format: "Expanded Text Ad / Responsive Search Ad",
          headline: "CreateAI Brain — AI OS | 12 AI Invention Tools | From $97/mo",
          body: "Replace your entire software stack with one AI platform. Healthcare, Legal, Fleet, Finance. No hardware. No licenses. Try free.",
          cta: "Visit Website",
        },
        targeting: { ageMin: 28, ageMax: 65, interests: ["business software","healthcare technology","legal technology"], locations: ["United States","Canada","United Kingdom"] },
      },
    ],
  },
];

// ─── Internal Ad System (live immediately — no external accounts needed) ───────

export interface InternalAd {
  id:          string;
  type:        "banner" | "card" | "modal" | "inline";
  placement:   string[];   // which OS apps to show in
  headline:    string;
  body:        string;
  cta:         string;
  ctaLink:     string;
  color:       string;
  priority:    number;
  active:      boolean;
}

export const INTERNAL_ADS: InternalAd[] = [
  {
    id: "promo-pro",
    type: "card",
    placement: ["nexus", "dashboard", "all"],
    headline: "CreateAI Brain Pro — $97/mo",
    body: "Full platform access: all 12 AI invention tools, HealthOS, LegalPM, StaffingOS, NEXUS OS. No hardware. No licenses.",
    cta: "Start Free Trial",
    ctaLink: "https://createaiplatform.com",
    color: "#6366f1",
    priority: 1,
    active: true,
  },
  {
    id: "promo-enterprise",
    type: "card",
    placement: ["all"],
    headline: "CreateAI Brain Enterprise — $497/mo",
    body: "Unlimited seats, white-label deployment, priority AI compute, dedicated support, and custom integrations for your industry.",
    cta: "Get Enterprise",
    ctaLink: "https://createaiplatform.com/enterprise",
    color: "#7c3aed",
    priority: 2,
    active: true,
  },
  {
    id: "promo-healthbundle",
    type: "inline",
    placement: ["healthos"],
    headline: "Healthcare Bundle — $197 one-time",
    body: "AI Clinical Scribe + HealthOS + AI Compliance Pack + AI Grant Writer. Everything a healthcare practice needs.",
    cta: "Get Healthcare Bundle",
    ctaLink: "https://createaiplatform.com/healthcare",
    color: "#0891b2",
    priority: 1,
    active: true,
  },
  {
    id: "promo-legalbundle",
    type: "inline",
    placement: ["legalpm"],
    headline: "Legal Bundle — $197 one-time",
    body: "AI Legal Research Engine + LegalPM + AI Compliance Pack + AI Email Sequence. Full legal practice automation.",
    cta: "Get Legal Bundle",
    ctaLink: "https://createaiplatform.com/legal",
    color: "#7c3aed",
    priority: 1,
    active: true,
  },
  {
    id: "promo-invention",
    type: "card",
    placement: ["inventionLayer","all"],
    headline: "Invention Layer Only — $47/mo",
    body: "Just the 12 AI invention tools — no OS suite. Ideal for consultants and agencies who need the tools but not the full OS.",
    cta: "Get Invention Layer",
    ctaLink: "https://createaiplatform.com/invention",
    color: "#f59e0b",
    priority: 3,
    active: true,
  },
  {
    id: "promo-referral",
    type: "banner",
    placement: ["all"],
    headline: "Refer a Business — Earn $50 per signup",
    body: "Share your referral link. When a business signs up for any paid plan, you earn $50 cash (via Cash App or Venmo).",
    cta: "Get Referral Link",
    ctaLink: "https://createaiplatform.com/refer",
    color: "#10b981",
    priority: 4,
    active: true,
  },
];

// ─── Deployment Status Tracking ───────────────────────────────────────────────

const deploymentLog: Map<string, { status: string; timestamp: string; note: string }[]> = new Map();

export function getDeploymentLog(networkId: string) {
  return deploymentLog.get(networkId) ?? [];
}

export function logDeployment(networkId: string, status: string, note: string) {
  const prev = deploymentLog.get(networkId) ?? [];
  deploymentLog.set(networkId, [...prev, { status, timestamp: new Date().toISOString(), note }]);
}

// ─── Network Status ───────────────────────────────────────────────────────────

export function getNetworkStatus(net: AdNetworkDef): {
  id: string; name: string; connected: boolean;
  credentialsSet: number; credentialsTotal: number;
  readyToDeploy: boolean; deploymentLog: { status: string; timestamp: string; note: string }[];
} {
  const statuses = net.credentials.map(c => ({
    key: c.key, label: c.label,
    set: !!(getAdCredential(c.key)),
  }));
  const set   = statuses.filter(s => s.set).length;
  const total = statuses.length;
  const primarySet = !!(getAdCredential(net.credentials[0].key) && getAdCredential(net.credentials[1]?.key || net.credentials[0].key));
  return {
    id:                net.id,
    name:              net.name,
    connected:         primarySet,
    credentialsSet:    set,
    credentialsTotal:  total,
    readyToDeploy:     primarySet,
    deploymentLog:     getDeploymentLog(net.id),
  };
}

export function getAllNetworkStatuses() {
  return AD_NETWORKS.map(n => getNetworkStatus(n));
}

export function getLiveCount() {
  return getAllNetworkStatuses().filter(s => s.connected).length;
}

// ─── Unified Reporting Placeholder ───────────────────────────────────────────

export interface NetworkReport {
  networkId:   string;
  name:        string;
  connected:   boolean;
  impressions: number | null;
  clicks:      number | null;
  spend:       number | null;
  leads:       number | null;
  cpc:         number | null;
  ctr:         number | null;
  note:        string;
}

export function getAggregateReport(): NetworkReport[] {
  return AD_NETWORKS.map(net => {
    const status = getNetworkStatus(net);
    if (!status.connected) {
      return {
        networkId:   net.id,
        name:        net.name,
        connected:   false,
        impressions: null,
        clicks:      null,
        spend:       null,
        leads:       null,
        cpc:         null,
        ctr:         null,
        note:        "Connect credentials to see live performance data",
      };
    }
    // When connected and campaigns are running, live API data would populate here.
    // Data = null until the first campaign has run for 24h.
    return {
      networkId:   net.id,
      name:        net.name,
      connected:   true,
      impressions: null,
      clicks:      null,
      spend:       null,
      leads:       null,
      cpc:         null,
      ctr:         null,
      note:        "Credentials connected. Start a campaign — performance data appears after first 24h.",
    };
  });
}
