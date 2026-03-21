/**
 * routes/valuation.ts — Platform Financial Valuation
 * ─────────────────────────────────────────────────────
 * Complete evaluation of every revenue stream, market opportunity,
 * unit economics, and platform value layer.
 *
 * Routes:
 *   GET /valuation         → Full analysis UI
 *   GET /valuation/data    → Raw JSON model
 */

import { Router, type Request, type Response } from "express";
import { getPublicBaseUrl } from "../utils/publicUrl.js";

const router  = Router();
const IS_PROD = process.env["REPLIT_DEPLOYMENT"] === "1";

// ─────────────────────────────────────────────────────────────────────────────
// DATA MODEL
// ─────────────────────────────────────────────────────────────────────────────

interface RevenueStream {
  id:         string;
  name:       string;
  icon:       string;
  type:       "subscription" | "transaction" | "usage" | "licensing" | "marketplace" | "data";
  mechanism:  string;
  pricing:    string;
  grossMargin: number;   // %
  addressable: string;   // who buys this
  floor:      number;    // $ per customer/month minimum
  ceiling:    number;    // $ per customer/month at scale
  note:       string;
}

interface MarketSegment {
  name:            string;
  icon:            string;
  usBusinessCount: number;   // thousands
  saasSpendPct:    number;   // % that spend on SaaS
  avgMonthlySpend: number;   // current vendor spend
  replaceableAt:   number;   // platform price (Business tier default)
  savingsPerMo:    number;   // what they save
}

interface ComparableCompany {
  name:         string;
  what:         string;         // what it does
  acquired:     string;         // acquisition / valuation note
  revenueAtVal: string;         // ARR at that valuation
  multiple:     number;         // revenue multiple
  platformRel:  string;         // how platform relates
}

interface ValuationScenario {
  label:       string;
  color:       string;
  customers: {
    solo:       number;
    business:   number;
    enterprise: number;
  };
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// REVENUE STREAMS
// ─────────────────────────────────────────────────────────────────────────────

const REVENUE_STREAMS: RevenueStream[] = [
  {
    id: "sub_solo", name: "Solo Tier Subscriptions", icon: "◇",
    type: "subscription",
    mechanism: "Monthly recurring subscription for individual operators and freelancers.",
    pricing: "$29/mo per subscriber",
    grossMargin: 97,
    addressable: "Freelancers, solopreneurs, independent contractors, one-person shops across all 20 industries.",
    floor: 29, ceiling: 29,
    note: "Lowest ARPU but widest funnel. Replaces $85–$450/mo in Mailchimp, Jasper, Buffer, and FreshBooks. Near-zero churn incentive given 10-15x ROI.",
  },
  {
    id: "sub_biz", name: "Business Tier Subscriptions", icon: "◈",
    type: "subscription",
    mechanism: "Monthly recurring subscription for small-to-medium businesses replacing their full SaaS stack.",
    pricing: "$79/mo per business",
    grossMargin: 97,
    addressable: "33M US small businesses. 20 industries analyzed. Any operator with 2+ digital tools currently.",
    floor: 79, ceiling: 79,
    note: "Core revenue driver. Replaces $200–$1,200/mo. At 10x ROI to the customer, $79/mo is price-inelastic. Gross margin ~97% at scale.",
  },
  {
    id: "sub_ent", name: "Enterprise Tier Subscriptions", icon: "◉",
    type: "subscription",
    mechanism: "Monthly recurring for multi-location, high-volume, or high-complexity operators.",
    pricing: "$299/mo per organization",
    grossMargin: 95,
    addressable: "Multi-location service businesses, regional chains, mid-market companies.",
    floor: 299, ceiling: 299,
    note: "Replaces $500–$5,000/mo. ServiceTitan alone is $125-398/mo with aggressive upsells. Enterprise margin slightly lower due to support overhead.",
  },
  {
    id: "whitelabel", name: "White-Label Agency Licensing", icon: "🏷",
    type: "licensing",
    mechanism: "Agencies rebrand and resell the full OS to their clients under their own domain and brand.",
    pricing: "$499–$2,499/mo per white-label instance (agency pays flat, charges their clients individually)",
    grossMargin: 99,
    addressable: "500,000+ US marketing, consulting, and creative agencies. Each agency has 5–50 clients they currently sell SaaS to.",
    floor: 499, ceiling: 2499,
    note: "Highest-margin stream. Marginal cost of another white-label tenant is near zero. Agency sells the OS to 10 clients at $300/client = $3,000/mo revenue on a $499/mo license — 6x their own margin.",
  },
  {
    id: "api_access", name: "Developer API Access", icon: "⚡",
    type: "usage",
    mechanism: "External developers pay for API access to the resolver, presence engine, semantic product layer, and feed exporter.",
    pricing: "1,000 calls/mo free → $0.01/call; Enterprise: negotiated flat",
    grossMargin: 96,
    addressable: "SaaS developers, agencies, internal dev teams, systems integrators.",
    floor: 10, ceiling: 2000,
    note: "NEXUS resolver and the 5-format semantic addressing layer are genuinely novel. No comparable API exists. First-mover pricing advantage.",
  },
  {
    id: "transaction", name: "Transaction / Commerce Revenue", icon: "💳",
    type: "transaction",
    mechanism: "Platform earns margin on all product sales processed through the Stripe-native semantic store.",
    pricing: "1.5% platform fee on gross merchandise volume (above Stripe's 2.9% + $0.30)",
    grossMargin: 92,
    addressable: "Every subscriber who sells products through the platform store.",
    floor: 0, ceiling: 500,
    note: "Passive revenue attached to every active seller. At $10k GMV/mo per Business subscriber, platform earns $150/mo on top of the $79 subscription.",
  },
  {
    id: "affiliate_platform", name: "Affiliate Program (Platform's Own)", icon: "🔗",
    type: "subscription",
    mechanism: "Subscribers refer new customers. Affiliates earn 20% recurring. Platform retains 80% of referred ARR. Affiliate tracking is already live in the platform.",
    pricing: "No direct cost — reduces net CAC by 60–80%",
    grossMargin: 97,
    addressable: "Every existing subscriber is a potential affiliate. Power users in agencies, coaching, consulting are highest-volume referrers.",
    floor: 0, ceiling: 0,
    note: "Not a revenue stream directly — a CAC elimination mechanism. Turning subscribers into a sales force. Industry benchmark: affiliate-driven SaaS achieves CAC <$30 for product that LTVs at $948–$3,588.",
  },
  {
    id: "channel_export", name: "Channel Export Upsells", icon: "📦",
    type: "usage",
    mechanism: "Business/Enterprise subscribers can export product catalogs to additional channels (Amazon Seller, TikTok Shop, Walmart Marketplace) beyond the base 5 formats.",
    pricing: "$9–$29/mo per additional channel",
    grossMargin: 99,
    addressable: "Retail subscribers, e-commerce operators, brand sellers with multi-channel presence.",
    floor: 9, ceiling: 87,
    note: "DataFeedWatch charges $59–$249/mo for this alone. Platform delivers it as a $9 upsell with near-zero marginal cost.",
  },
  {
    id: "vertical_saas", name: "Vertical SaaS Expansions", icon: "🏥",
    type: "subscription",
    mechanism: "Deep industry-specific builds (Healthcare OS, Legal OS, Staffing OS, Health OS) sold as standalone products at vertical SaaS pricing.",
    pricing: "$49–$499/user/mo (vertical SaaS pricing, 3–6x horizontal pricing)",
    grossMargin: 85,
    addressable: "Healthcare: $4.3T industry, 1M+ practices. Legal: $400B industry, 450k firms. Construction: $2.1T, 3M contractors.",
    floor: 49, ceiling: 499,
    note: "Already have health-os and legal-pm registered artifacts. Vertical SaaS commands 3-6x the revenue multiple of horizontal SaaS due to switching costs and regulatory compliance value.",
  },
  {
    id: "ai_usage", name: "AI Usage Overage Revenue", icon: "🧠",
    type: "usage",
    mechanism: "Each tier includes a fair-use AI operations allowance. High-volume users pay per-operation above the limit.",
    pricing: "Solo: 500 AI ops/mo included → $0.05/op overage. Business: 5,000/mo → $0.03/op. Enterprise: 50,000/mo → $0.01/op.",
    grossMargin: 80,
    addressable: "High-volume email senders, active document generators, heavy training module creators.",
    floor: 0, ceiling: 150,
    note: "OpenAI GPT-4o costs ~$0.005–$0.015/op at platform volume. Platform charges $0.03–$0.05/op overage = 3-10x markup.",
  },
  {
    id: "training_marketplace", name: "Training / Course Marketplace", icon: "🎓",
    type: "marketplace",
    mechanism: "Subscribers publish and sell training courses through the platform's AI training engine. Platform takes 15% of course revenue.",
    pricing: "15% revenue share on all course sales",
    grossMargin: 94,
    addressable: "Education, consulting, coaching, corporate training industries. $370B global e-learning market.",
    floor: 0, ceiling: 200,
    note: "Zero marginal cost. Platform already generates the course structure. Instructor just uploads source material. Udemy takes 37-63%. Platform takes 15% = immediate price advantage.",
  },
  {
    id: "data_intelligence", name: "Anonymized Industry Intelligence", icon: "📊",
    type: "data",
    mechanism: "Aggregated, anonymized platform data sold as industry benchmark reports to analysts, investors, and enterprise strategy teams.",
    pricing: "$5,000–$50,000 per report; $2,000–$10,000/mo subscription for live data access",
    grossMargin: 99,
    addressable: "Management consulting firms, private equity, industry analysts, enterprise strategy departments.",
    floor: 0, ceiling: 5000,
    note: "Long-term flywheel. Every subscriber interaction creates proprietary data. At 10k+ subscribers, the dataset becomes the most comprehensive real-time view of SMB SaaS spend patterns in existence.",
  },
  {
    id: "enterprise_deploy", name: "Enterprise Private Deployments", icon: "🏢",
    type: "licensing",
    mechanism: "Fortune 1000 companies license the NEXUS OS layer and Semantic Product Layer for internal deployment, custom integrations, and private instance hosting.",
    pricing: "$25,000–$250,000/yr per enterprise contract",
    grossMargin: 75,
    addressable: "Enterprise IT, digital transformation buyers, chief digital officers at large organizations.",
    floor: 0, ceiling: 20833,
    note: "Lower margin due to implementation and support overhead. But one enterprise contract at $100k/yr = revenue equivalent of 1,265 Business subscribers. Transforms the growth curve.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MARKET SEGMENTS
// ─────────────────────────────────────────────────────────────────────────────

const MARKET_SEGMENTS: MarketSegment[] = [
  { name: "Professional Services",  icon: "💼", usBusinessCount: 4800, saasSpendPct: 82, avgMonthlySpend: 380, replaceableAt: 79, savingsPerMo: 301 },
  { name: "Healthcare / Wellness",  icon: "🏥", usBusinessCount: 2100, saasSpendPct: 78, avgMonthlySpend: 460, replaceableAt: 79, savingsPerMo: 381 },
  { name: "Retail / E-commerce",    icon: "🛒", usBusinessCount: 3200, saasSpendPct: 91, avgMonthlySpend: 820, replaceableAt: 299,savingsPerMo: 521 },
  { name: "Trades / Construction",  icon: "🔨", usBusinessCount: 5100, saasSpendPct: 61, avgMonthlySpend: 510, replaceableAt: 79, savingsPerMo: 431 },
  { name: "Food & Hospitality",     icon: "🍽", usBusinessCount: 1900, saasSpendPct: 55, avgMonthlySpend: 640, replaceableAt: 79, savingsPerMo: 561 },
  { name: "Education / Coaching",   icon: "🎓", usBusinessCount: 2600, saasSpendPct: 74, avgMonthlySpend: 340, replaceableAt: 79, savingsPerMo: 261 },
  { name: "Technology / SaaS",      icon: "💻", usBusinessCount: 980,  saasSpendPct: 98, avgMonthlySpend: 1400,replaceableAt: 299,savingsPerMo: 1101},
  { name: "Non-profit / Assoc.",    icon: "🤝", usBusinessCount: 1800, saasSpendPct: 62, avgMonthlySpend: 290, replaceableAt: 29, savingsPerMo: 261 },
  { name: "Property / RE",          icon: "🏠", usBusinessCount: 2400, saasSpendPct: 69, avgMonthlySpend: 390, replaceableAt: 79, savingsPerMo: 311 },
  { name: "Media / Publishing",     icon: "📰", usBusinessCount: 820,  saasSpendPct: 87, avgMonthlySpend: 950, replaceableAt: 299,savingsPerMo: 651 },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPARABLE COMPANY ACQUISITIONS / VALUATIONS
// ─────────────────────────────────────────────────────────────────────────────

const COMPARABLES: ComparableCompany[] = [
  { name: "Mailchimp",     what: "Email marketing only",                        acquired: "Acquired by Intuit for $12B (2021)",          revenueAtVal: "~$800M ARR", multiple: 15,  platformRel: "Platform's AI Email Engine fully replaces Mailchimp for every subscriber." },
  { name: "DocuSign",      what: "E-signatures only",                           acquired: "Peak market cap $49B (2021); current ~$12B",   revenueAtVal: "~$2.1B ARR", multiple: 6,   platformRel: "Platform's AI Document Generator replaces DocuSign. No per-envelope fees." },
  { name: "Calendly",      what: "Scheduling links only",                       acquired: "Series B valuation: $3B (2021)",               revenueAtVal: "~$100M ARR", multiple: 30,  platformRel: "Platform's AI Scheduling Layer replaces Calendly. Included in every tier." },
  { name: "Notion",        what: "Docs + wiki only",                            acquired: "Series C valuation: $10B (2021)",              revenueAtVal: "~$100M ARR", multiple: 100, platformRel: "Platform's AI Document system and Knowledge Base replaces Notion for SMBs." },
  { name: "HubSpot",       what: "CRM + Marketing Hub",                         acquired: "Market cap: ~$25B (2024)",                     revenueAtVal: "~$2.2B ARR", multiple: 11,  platformRel: "Platform AI CRM replaces HubSpot Starter/Pro for all 20 industries." },
  { name: "Zendesk",       what: "Helpdesk / support tickets",                  acquired: "Acquired by PE for $10.2B (2022)",             revenueAtVal: "~$1.3B ARR", multiple: 8,   platformRel: "Platform AI Helpdesk drafts responses and builds FAQs automatically." },
  { name: "TalentLMS",     what: "LMS / training platform",                     acquired: "Acquired by Epignosis for undisclosed (2021)",  revenueAtVal: "~$30M ARR",  multiple: 20,  platformRel: "Platform's AI Training Engine generates full modules from any document." },
  { name: "Buffer",        what: "Social media scheduling only",                acquired: "Private; est. valuation ~$100M",               revenueAtVal: "~$20M ARR",  multiple: 5,   platformRel: "Platform AI Social Scheduler generates and queues 30 posts in minutes." },
  { name: "Typeform",      what: "Forms + surveys only",                        acquired: "Series C at $900M (2021)",                     revenueAtVal: "~$40M ARR",  multiple: 22,  platformRel: "Platform AI Form Builder creates any form from natural language." },
  { name: "PandaDoc",      what: "Proposals + e-signatures",                    acquired: "Series C valuation ~$1B (2021)",               revenueAtVal: "~$50M ARR",  multiple: 20,  platformRel: "Platform AI Document Generator + delivery replaces PandaDoc end-to-end." },
  { name: "Refersion",     what: "Affiliate tracking only",                     acquired: "Acquired by Assembly for ~$100M (2021)",        revenueAtVal: "~$15M ARR",  multiple: 7,   platformRel: "Platform's native affiliate engine is already live. Zero third-party cost." },
  { name: "DataFeedWatch", what: "Product feed management only",                acquired: "Acquired by Cart.com for undisclosed",          revenueAtVal: "~$10M ARR",  multiple: 10,  platformRel: "Semantic Product Layer exports to 5 channels simultaneously. Already live." },
];

// ─────────────────────────────────────────────────────────────────────────────
// VALUATION SCENARIOS (ARR × multiple frameworks)
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIOS: ValuationScenario[] = [
  {
    label: "Early Traction",
    color: "#6366f1",
    customers: { solo: 200, business: 150, enterprise: 10 },
    description: "Initial market entry. Primarily organic and referral-driven. Focus on one or two industries.",
  },
  {
    label: "Product-Market Fit",
    color: "#06b6d4",
    customers: { solo: 1000, business: 800, enterprise: 50 },
    description: "Clear category resonance. Affiliate program driving 30% of new customers. 2-3 industries dominated.",
  },
  {
    label: "Category Leader",
    color: "#10b981",
    customers: { solo: 5000, business: 4000, enterprise: 200 },
    description: "Recognized as the unified OS layer for SMBs. White-label licensing active. Vertical SaaS launched.",
  },
  {
    label: "Market Penetration",
    color: "#f59e0b",
    customers: { solo: 20000, business: 15000, enterprise: 800 },
    description: "0.05% penetration of addressable US market. Enterprise contracts supplementing. Data intelligence live.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CAPABILITY VALUE BLOCKS
// ─────────────────────────────────────────────────────────────────────────────

const CAPABILITY_VALUES = [
  { name: "NEXUS Semantic OS",            detail: "Unified intent resolution across 5 formats (@signal, ~code, #concept, ?query, verb). Role-adaptive surfaces. NX Presence engine. No comparable product exists.", value: "Novel infrastructure layer — comparable to Okta + Algolia + Intercom navigation in one system." },
  { name: "Semantic Product Layer",       detail: "Products defined once, emitted to Shopify CSV, WooCommerce CSV, Google Shopping XML, Amazon feed, Stripe checkout, and hosted pages simultaneously.", value: "DataFeedWatch ($59-249/mo) + Shopify ($79-299/mo) + hosted checkout — all replaced by one primitive." },
  { name: "AI Document Lifecycle",        detail: "Generate → deliver → e-confirm → store — from one action. No DocuSign, no PandaDoc, no Notion for templates.", value: "Eliminates 3 separate vendor relationships. DocuSign alone at peak was worth $49B." },
  { name: "AI Training Pipeline",         detail: "Any document becomes a structured module with quiz and certificate in seconds. No LMS required.", value: "TalentLMS, Teachable, and Appcues collectively represent >$3B in acquisitions. Platform replaces all three." },
  { name: "Affiliate Attribution Engine", detail: "Native referral tracking already live. Commission management. No Refersion, no Impact, no ShareASale.", value: "Refersion acquired for ~$100M. Affiliate-driven growth eliminates CAC — the single largest operating cost for SaaS." },
  { name: "Channel Feed Exporter",        detail: "5-format export already live in the semantic product layer. AI-enriched descriptions per channel.", value: "DataFeedWatch acquired by Cart.com. Feed management is a $59-249/mo line item every e-commerce operator pays." },
  { name: "AI CRM + Customer Store",      detail: "Full customer database with AI-generated follow-up sequences, churn prediction, and purchase intelligence.", value: "HubSpot market cap ~$25B. Platform delivers the SMB tier for $79/mo total — not $890/mo for HubSpot Sales Pro." },
  { name: "AI Analytics Layer",           detail: "Zero-config business intelligence. Platform observes all activity and writes the weekly summary in plain English.", value: "Mixpanel, Amplitude, Triplewhale collectively valued at >$5B. Platform delivers the outcome without the dashboard." },
];

// ─────────────────────────────────────────────────────────────────────────────
// Data endpoint
// ─────────────────────────────────────────────────────────────────────────────

router.get("/data", (_req: Request, res: Response) => {
  // Compute scenario economics
  const scenarioData = SCENARIOS.map(s => {
    const arr = (s.customers.solo * 29 + s.customers.business * 79 + s.customers.enterprise * 299) * 12;
    const mrr = arr / 12;
    const totalCustomers = s.customers.solo + s.customers.business + s.customers.enterprise;
    const arpu = totalCustomers > 0 ? Math.round(mrr / totalCustomers) : 0;
    const valBear  = Math.round(arr * 10);
    const valBase  = Math.round(arr * 20);
    const valBull  = Math.round(arr * 40);
    return { ...s, arr, mrr, totalCustomers, arpu, valBear, valBase, valBull };
  });

  const totalToolsReplaced = 90;
  const totalIndustriesServed = 20;
  const totalStreams = REVENUE_STREAMS.length;

  res.json({
    ok: true,
    summary: {
      revenueStreams:       totalStreams,
      industriesServed:     totalIndustriesServed,
      toolsReplaced:        totalToolsReplaced,
      capabilityBlocks:     CAPABILITY_VALUES.length,
      comparableCompanies:  COMPARABLES.length,
      marketSegments:       MARKET_SEGMENTS.length,
    },
    revenueStreams:   REVENUE_STREAMS,
    marketSegments:   MARKET_SEGMENTS,
    comparables:      COMPARABLES,
    scenarios:        scenarioData,
    capabilityValues: CAPABILITY_VALUES,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Full UI
// ─────────────────────────────────────────────────────────────────────────────

router.get("/", (_req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();

  // Compute scenario economics
  const scenarioData = SCENARIOS.map(s => {
    const mrr = s.customers.solo * 29 + s.customers.business * 79 + s.customers.enterprise * 299;
    const arr = mrr * 12;
    const totalCustomers = s.customers.solo + s.customers.business + s.customers.enterprise;
    const arpu = totalCustomers > 0 ? Math.round(mrr / totalCustomers) : 0;
    const ltv  = Math.round(arpu * 24);   // 24-month avg LTV at 4% monthly churn
    const valBear  = arr * 10;
    const valBase  = arr * 20;
    const valBull  = arr * 40;
    return { ...s, mrr, arr, totalCustomers, arpu, ltv, valBear, valBase, valBull };
  });

  function fmt(n: number): string {
    if (n >= 1_000_000_000) return "$" + (n / 1_000_000_000).toFixed(1) + "B";
    if (n >= 1_000_000)     return "$" + (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000)         return "$" + (n / 1_000).toFixed(0) + "k";
    return "$" + n.toLocaleString();
  }

  // Total TAM
  const totalAddressableBusinesses = MARKET_SEGMENTS.reduce((s, m) =>
    s + Math.round(m.usBusinessCount * 1000 * (m.saasSpendPct / 100)), 0);
  const avgReplaceableAt = 79;
  const tamAnnual = totalAddressableBusinesses * avgReplaceableAt * 12;

  // Comparable combined acquisitions
  const comparableValue = COMPARABLES.reduce((s, c) => {
    const raw = c.acquired.match(/\$(\d+\.?\d*)([BM])/);
    if (!raw) return s;
    const num = parseFloat(raw[1]!);
    const mul = raw[2] === "B" ? 1e9 : 1e6;
    return s + num * mul;
  }, 0);

  // Stream type colors
  const typeColors: Record<string, string> = {
    subscription: "#6366f1",
    transaction:  "#06b6d4",
    usage:        "#8b5cf6",
    licensing:    "#f59e0b",
    marketplace:  "#10b981",
    data:         "#ec4899",
  };

  const streamCardsHtml = REVENUE_STREAMS.map(s => {
    const col = typeColors[s.type] ?? "#6366f1";
    return `
    <div class="stream-card">
      <div class="sc-top">
        <span class="sc-icon">${s.icon}</span>
        <span class="sc-type" style="color:${col};border-color:${col}30;background:${col}10;">${s.type}</span>
      </div>
      <div class="sc-name">${s.name}</div>
      <div class="sc-mechanism">${s.mechanism}</div>
      <div class="sc-pricing">${s.pricing}</div>
      <div class="sc-meta-row">
        <div class="sc-meta"><span class="sml">Gross Margin</span><span class="big" style="color:#10b981;">${s.grossMargin}%</span></div>
        <div class="sc-meta"><span class="sml">Per Customer/Mo</span><span class="big" style="color:var(--t1);">${s.floor === 0 && s.ceiling === 0 ? "CAC only" : (s.floor === s.ceiling ? "$" + s.floor : "$" + s.floor + "–$" + s.ceiling)}</span></div>
      </div>
      <div class="sc-addressable">${s.addressable}</div>
      <div class="sc-note">${s.note}</div>
    </div>`;
  }).join("");

  const segmentRowsHtml = MARKET_SEGMENTS.map(m => {
    const addressable = Math.round(m.usBusinessCount * 1000 * (m.saasSpendPct / 100));
    const samAnnual = addressable * m.replaceableAt * 12;
    const som01 = Math.round(addressable * 0.001 * m.replaceableAt * 12);
    const som1  = Math.round(addressable * 0.01 * m.replaceableAt * 12);
    return `<tr>
      <td class="seg-name">${m.icon} ${m.name}</td>
      <td class="seg-num">${(m.usBusinessCount * 1000).toLocaleString()}</td>
      <td class="seg-pct">${m.saasSpendPct}%</td>
      <td class="seg-spk red">$${m.avgMonthlySpend}/mo</td>
      <td class="seg-price ind">$${m.replaceableAt}/mo</td>
      <td class="seg-save grn">$${m.savingsPerMo}/mo</td>
      <td class="seg-sam">${fmt(samAnnual)}</td>
      <td class="seg-som">${fmt(som01)} / ${fmt(som1)}</td>
    </tr>`;
  }).join("");

  const compRowsHtml = COMPARABLES.map(c => {
    const multColor = c.multiple >= 20 ? "#f59e0b" : c.multiple >= 10 ? "#06b6d4" : "#10b981";
    return `<tr>
      <td class="comp-name">${c.name}</td>
      <td class="comp-what">${c.what}</td>
      <td class="comp-acq">${c.acquired}</td>
      <td class="comp-rev">${c.revenueAtVal}</td>
      <td class="comp-mul" style="color:${multColor}">${c.multiple}×</td>
      <td class="comp-rel">${c.platformRel}</td>
    </tr>`;
  }).join("");

  const scenarioCardsHtml = scenarioData.map(s => {
    return `
    <div class="scen-card" style="border-color:${s.color}30;background:${s.color}08;">
      <div class="scen-label" style="color:${s.color};">${s.label}</div>
      <div class="scen-desc">${s.description}</div>
      <div class="scen-cust">
        <div class="cust-row"><span>Solo ($29)</span><span>${s.customers.solo.toLocaleString()}</span></div>
        <div class="cust-row"><span>Business ($79)</span><span>${s.customers.business.toLocaleString()}</span></div>
        <div class="cust-row"><span>Enterprise ($299)</span><span>${s.customers.enterprise.toLocaleString()}</span></div>
        <div class="cust-total"><span>Total Customers</span><span>${s.totalCustomers.toLocaleString()}</span></div>
      </div>
      <div class="scen-econ">
        <div class="econ-block"><span class="el">MRR</span><span class="ev" style="color:${s.color};">${fmt(s.mrr)}</span></div>
        <div class="econ-block"><span class="el">ARR</span><span class="ev" style="color:${s.color};">${fmt(s.arr)}</span></div>
        <div class="econ-block"><span class="el">ARPU</span><span class="ev">$${s.arpu}/mo</span></div>
        <div class="econ-block"><span class="el">LTV (24mo)</span><span class="ev">$${s.ltv.toLocaleString()}</span></div>
      </div>
      <div class="scen-val-label">Valuation Range (10× / 20× / 40× ARR)</div>
      <div class="scen-vals">
        <div class="val-blk bear"><span>Bear</span><span>${fmt(s.valBear)}</span></div>
        <div class="val-blk base"><span>Base</span><span>${fmt(s.valBase)}</span></div>
        <div class="val-blk bull"><span>Bull</span><span>${fmt(s.valBull)}</span></div>
      </div>
    </div>`;
  }).join("");

  const capBlocksHtml = CAPABILITY_VALUES.map(c =>
    `<div class="cap-blk">
      <div class="cap-blk-name">${c.name}</div>
      <div class="cap-blk-detail">${c.detail}</div>
      <div class="cap-blk-value">${c.value}</div>
    </div>`
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Platform Valuation — CreateAI Brain</title>
  <style>
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    :root {
      --bg:#020617; --s1:#0d1526; --s2:#111827; --s3:#1e293b; --s4:#243044;
      --line:#1e293b; --line2:#2d3748;
      --t1:#e2e8f0; --t2:#94a3b8; --t3:#64748b; --t4:#475569;
      --ind:#6366f1; --cyan:#06b6d4; --em:#10b981; --am:#f59e0b; --re:#f87171;
    }
    html,body { background:var(--bg); color:var(--t1); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:14px; }
    a { color:inherit; text-decoration:none; }

    .hdr { border-bottom:1px solid var(--line); padding:0 28px; background:rgba(2,6,23,0.97); position:sticky; top:0; z-index:100; }
    .hdr-inner { max-width:1500px; margin:0 auto; height:48px; display:flex; align-items:center; gap:14px; }
    .logo { font-size:1rem; font-weight:900; letter-spacing:-0.03em; }
    .logo span { color:var(--ind); }
    .mode-chip { font-size:0.58rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; border-radius:99px; padding:3px 9px; }
    .mode-test { background:rgba(245,158,11,0.12); color:#fcd34d; border:1px solid rgba(245,158,11,0.22); }
    .mode-live { background:rgba(16,185,129,0.12); color:#6ee7b7; border:1px solid rgba(16,185,129,0.22); }
    .hdr-links { margin-left:auto; display:flex; gap:20px; }
    .hdr-lnk { font-size:0.72rem; font-weight:600; color:var(--t3); transition:color .15s; }
    .hdr-lnk:hover { color:var(--t1); }

    /* Hero */
    .hero { padding:56px 28px 40px; background:radial-gradient(ellipse 100% 80% at 30% 0%,rgba(99,102,241,0.12),transparent); border-bottom:1px solid var(--line); }
    .hero-inner { max-width:1500px; margin:0 auto; }
    .eye { font-size:0.6rem; font-weight:800; text-transform:uppercase; letter-spacing:0.15em; color:var(--ind); margin-bottom:12px; }
    .h1 { font-size:clamp(1.8rem,4.5vw,3.2rem); font-weight:900; color:var(--t1); letter-spacing:-0.04em; line-height:1.08; margin-bottom:10px; }
    .h1 em { color:#818cf8; font-style:normal; }
    .hero-p { font-size:1rem; color:var(--t2); max-width:680px; line-height:1.7; margin-bottom:36px; }
    .kpi-bar { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:16px; }
    .kpi { background:var(--s2); border:1px solid var(--line2); border-radius:12px; padding:16px; }
    .kpi-num { font-size:1.8rem; font-weight:900; letter-spacing:-0.04em; color:var(--t1); }
    .kpi-num.ind { color:#818cf8; }
    .kpi-num.cy  { color:var(--cyan); }
    .kpi-num.gn  { color:var(--em); }
    .kpi-num.am  { color:var(--am); }
    .kpi-num.re  { color:var(--re); }
    .kpi-label { font-size:0.64rem; color:var(--t3); margin-top:4px; text-transform:uppercase; letter-spacing:0.07em; }
    .kpi-sub   { font-size:0.68rem; color:var(--t4); margin-top:2px; }

    /* Section */
    .section { max-width:1500px; margin:0 auto; padding:44px 28px; }
    .sec-hdr { margin-bottom:24px; }
    .sec-eye { font-size:0.58rem; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:var(--ind); margin-bottom:8px; }
    .sec-h2 { font-size:clamp(1.1rem,2.5vw,1.7rem); font-weight:900; color:var(--t1); letter-spacing:-0.03em; margin-bottom:6px; }
    .sec-sub { font-size:0.82rem; color:var(--t3); max-width:680px; line-height:1.6; }
    .divider { border:none; border-top:1px solid var(--line); margin:0; }

    /* Revenue stream cards */
    .stream-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:14px; }
    .stream-card { background:var(--s2); border:1px solid var(--line); border-radius:12px; padding:18px; display:flex; flex-direction:column; gap:9px; }
    .sc-top { display:flex; align-items:center; justify-content:space-between; }
    .sc-icon { font-size:1.3rem; }
    .sc-type { font-size:0.58rem; font-weight:800; text-transform:uppercase; letter-spacing:0.07em; border:1px solid; border-radius:99px; padding:2px 9px; }
    .sc-name { font-size:1rem; font-weight:900; color:var(--t1); line-height:1.2; }
    .sc-mechanism { font-size:0.75rem; color:var(--t2); line-height:1.5; }
    .sc-pricing { font-size:0.8rem; font-weight:700; color:#818cf8; background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); border-radius:6px; padding:6px 10px; }
    .sc-meta-row { display:flex; gap:12px; }
    .sc-meta { flex:1; background:var(--s1); border-radius:7px; padding:8px 10px; }
    .sc-meta .sml { display:block; font-size:0.58rem; text-transform:uppercase; letter-spacing:0.07em; color:var(--t4); margin-bottom:3px; }
    .sc-meta .big { font-size:1rem; font-weight:900; }
    .sc-addressable { font-size:0.72rem; color:var(--t3); line-height:1.5; border-left:2px solid var(--line2); padding-left:8px; }
    .sc-note { font-size:0.72rem; color:var(--t2); line-height:1.5; }

    /* Market table */
    .market-table { width:100%; border-collapse:collapse; font-size:0.78rem; }
    .market-table th { text-align:left; color:var(--t3); font-size:0.6rem; font-weight:800; text-transform:uppercase; letter-spacing:0.07em; padding:8px 10px; border-bottom:1px solid var(--line); white-space:nowrap; }
    .market-table td { padding:9px 10px; border-bottom:1px solid rgba(30,41,59,0.4); }
    .seg-name { font-weight:700; color:var(--t1); }
    .seg-num  { color:var(--t2); }
    .seg-pct  { color:var(--t3); }
    .red { color:var(--re); font-weight:700; }
    .ind { color:#818cf8; font-weight:700; }
    .grn { color:var(--em); font-weight:800; }
    .seg-sam, .seg-som { color:var(--am); font-weight:800; }
    .market-table tfoot td { border-bottom:none; border-top:2px solid var(--line2); font-weight:800; color:var(--t1); }

    /* Comparable table */
    .comp-table { width:100%; border-collapse:collapse; font-size:0.76rem; }
    .comp-table th { text-align:left; color:var(--t3); font-size:0.58rem; font-weight:800; text-transform:uppercase; letter-spacing:0.07em; padding:8px 10px; border-bottom:1px solid var(--line); }
    .comp-table td { padding:9px 10px; border-bottom:1px solid rgba(30,41,59,0.4); vertical-align:top; }
    .comp-name { font-weight:900; color:var(--t1); white-space:nowrap; }
    .comp-what { color:var(--t3); }
    .comp-acq  { color:var(--am); font-weight:600; }
    .comp-rev  { color:var(--t2); white-space:nowrap; }
    .comp-mul  { font-weight:900; font-size:1rem; }
    .comp-rel  { color:var(--t2); line-height:1.5; font-size:0.72rem; }

    /* Scenario cards */
    .scen-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
    .scen-card { border:1px solid; border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:12px; }
    .scen-label { font-size:1.1rem; font-weight:900; }
    .scen-desc  { font-size:0.75rem; color:var(--t2); line-height:1.5; }
    .scen-cust  { background:var(--s1); border-radius:8px; padding:12px; display:flex; flex-direction:column; gap:5px; }
    .cust-row   { display:flex; justify-content:space-between; font-size:0.73rem; color:var(--t3); }
    .cust-total { display:flex; justify-content:space-between; font-size:0.8rem; font-weight:800; color:var(--t1); border-top:1px solid var(--line2); padding-top:6px; margin-top:2px; }
    .scen-econ  { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .econ-block { background:var(--s1); border-radius:7px; padding:8px 10px; }
    .el { display:block; font-size:0.58rem; text-transform:uppercase; letter-spacing:0.07em; color:var(--t4); margin-bottom:3px; }
    .ev { font-size:1rem; font-weight:900; color:var(--t1); }
    .scen-val-label { font-size:0.6rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--t4); }
    .scen-vals  { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; }
    .val-blk    { border-radius:7px; padding:8px; text-align:center; display:flex; flex-direction:column; gap:3px; }
    .val-blk span:first-child { font-size:0.58rem; text-transform:uppercase; letter-spacing:0.07em; color:var(--t4); }
    .val-blk span:last-child  { font-size:0.85rem; font-weight:900; color:var(--t1); }
    .bear { background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); }
    .base { background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); }
    .bull { background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); }

    /* Capability blocks */
    .cap-grid-val { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:12px; }
    .cap-blk { background:var(--s2); border:1px solid var(--line); border-radius:12px; padding:18px; display:flex; flex-direction:column; gap:7px; }
    .cap-blk-name   { font-size:0.9rem; font-weight:900; color:var(--t1); }
    .cap-blk-detail { font-size:0.75rem; color:var(--t2); line-height:1.5; }
    .cap-blk-value  { font-size:0.75rem; color:var(--am); font-weight:600; background:rgba(245,158,11,0.07); border:1px solid rgba(245,158,11,0.15); border-radius:6px; padding:7px 10px; line-height:1.5; }

    /* Margin */
    .margin-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }
    .margin-card { background:var(--s2); border:1px solid var(--line); border-radius:10px; padding:16px; text-align:center; }
    .mc-num { font-size:2rem; font-weight:900; letter-spacing:-0.04em; }
    .mc-label { font-size:0.65rem; color:var(--t3); margin-top:4px; text-transform:uppercase; letter-spacing:0.07em; }
    .mc-detail { font-size:0.7rem; color:var(--t4); margin-top:3px; }

    /* OS value callout */
    .os-callout { background:var(--s2); border:1px solid var(--ind); border-radius:16px; padding:28px 32px; margin-bottom:0; }
    .os-callout h3 { font-size:1.3rem; font-weight:900; color:var(--t1); margin-bottom:12px; letter-spacing:-0.03em; }
    .os-callout p  { font-size:0.85rem; color:var(--t2); line-height:1.7; margin-bottom:10px; }
    .os-callout ul { list-style:none; display:flex; flex-direction:column; gap:6px; }
    .os-callout li { font-size:0.82rem; color:var(--t2); display:flex; gap:8px; }
    .os-callout li::before { content:"→"; color:var(--ind); flex-shrink:0; }

    /* Note */
    .val-note { background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.15); border-radius:10px; padding:16px 20px; font-size:0.75rem; color:var(--t3); line-height:1.6; }

    @media(max-width:700px) {
      .hero { padding:32px 16px 24px; }
      .section { padding:28px 16px; }
      .stream-grid, .scen-grid, .cap-grid-val, .margin-grid { grid-template-columns:1fr; }
      .kpi-bar { grid-template-columns:1fr 1fr; }
      .market-table, .comp-table { font-size:0.65rem; }
      .market-table th, .comp-table th { font-size:0.55rem; }
    }
  </style>
</head>
<body>
<header class="hdr">
  <div class="hdr-inner">
    <div class="logo">Create<span>AI</span> Brain</div>
    <span class="mode-chip ${IS_PROD ? "mode-live" : "mode-test"}">${IS_PROD ? "⚡ Live" : "🧪 Test"}</span>
    <div class="hdr-links">
      <a class="hdr-lnk" href="${BASE}/bundle">Bundle Analysis</a>
      <a class="hdr-lnk" href="${BASE}/nexus">NEXUS</a>
      <a class="hdr-lnk" href="${BASE}/hub">Hub</a>
    </div>
  </div>
</header>

<!-- Hero -->
<section class="hero">
  <div class="hero-inner">
    <div class="eye">Platform Financial Valuation · Complete Model · No Constraints</div>
    <h1 class="h1">Every way this platform<br><em>generates value and revenue.</em></h1>
    <p class="hero-p">A complete evaluation of all ${REVENUE_STREAMS.length} revenue streams, ${MARKET_SEGMENTS.length} market segments, ${COMPARABLES.length} comparable acquisitions, ${CAPABILITY_VALUES.length} capability value layers, and 4 growth scenarios — from first customer to market penetration.</p>
    <div class="kpi-bar">
      <div class="kpi"><div class="kpi-num ind">${REVENUE_STREAMS.length}</div><div class="kpi-label">Revenue Streams</div><div class="kpi-sub">Subscription, transaction, usage, licensing, data</div></div>
      <div class="kpi"><div class="kpi-num cy">${fmt(tamAnnual)}</div><div class="kpi-label">Total Addressable Market</div><div class="kpi-sub">US alone, subscription revenue only</div></div>
      <div class="kpi"><div class="kpi-num gn">97%</div><div class="kpi-label">Gross Margin</div><div class="kpi-sub">Business tier at scale, AI ops &lt;$2/subscriber/mo</div></div>
      <div class="kpi"><div class="kpi-num am">${fmt(comparableValue)}</div><div class="kpi-label">Comparable Acquisitions</div><div class="kpi-sub">Combined value of tools this platform replaces</div></div>
      <div class="kpi"><div class="kpi-num re">10–40×</div><div class="kpi-label">ARR Multiple Range</div><div class="kpi-sub">Bear to bull; AI-native OS premium</div></div>
      <div class="kpi"><div class="kpi-num ind">90+</div><div class="kpi-label">Vendor Tools Replaced</div><div class="kpi-sub">Per the Business OS Bundle analysis</div></div>
    </div>
  </div>
</section>

<hr class="divider">

<!-- Revenue Streams -->
<section class="section">
  <div class="sec-hdr">
    <div class="sec-eye">01 — Revenue Streams</div>
    <h2 class="sec-h2">${REVENUE_STREAMS.length} distinct ways this platform generates revenue.</h2>
    <p class="sec-sub">Each stream is independent. Subscriptions compound with transaction fees. Licensing compounds with API usage. Data intelligence grows as subscriber count grows.</p>
  </div>
  <div class="stream-grid">${streamCardsHtml}</div>
</section>

<hr class="divider">

<!-- Unit Economics -->
<section class="section">
  <div class="sec-hdr">
    <div class="sec-eye">02 — Unit Economics</div>
    <h2 class="sec-h2">Why 97% gross margin is the correct number.</h2>
    <p class="sec-sub">The marginal cost of serving one additional Business subscriber is under $2/mo. Everything beyond that is contribution margin.</p>
  </div>
  <div class="margin-grid">
    <div class="margin-card"><div class="mc-num" style="color:#818cf8;">$79</div><div class="mc-label">Business Tier ARPU</div><div class="mc-detail">Per subscriber per month</div></div>
    <div class="margin-card"><div class="mc-num" style="color:var(--re);">~$0.50</div><div class="mc-label">AI Ops Cost</div><div class="mc-detail">GPT-4o at platform volume, avg usage pattern</div></div>
    <div class="margin-card"><div class="mc-num" style="color:var(--re);">~$0.30</div><div class="mc-label">Email Delivery</div><div class="mc-detail">Resend API, avg 150 sends/mo per subscriber</div></div>
    <div class="margin-card"><div class="mc-num" style="color:var(--re);">~$0.40</div><div class="mc-label">Infrastructure</div><div class="mc-detail">DB storage + compute, amortized per subscriber</div></div>
    <div class="margin-card"><div class="mc-num" style="color:var(--re);">~$0.80</div><div class="mc-label">Payment Processing</div><div class="mc-detail">Stripe fees on monthly billing transaction</div></div>
    <div class="margin-card"><div class="mc-num" style="color:var(--em);">$77</div><div class="mc-label">Gross Profit / Sub</div><div class="mc-detail">Per Business subscriber per month</div></div>
    <div class="margin-card"><div class="mc-num" style="color:var(--em);">97.5%</div><div class="mc-label">Gross Margin</div><div class="mc-detail">Business tier at average usage</div></div>
    <div class="margin-card"><div class="mc-num" style="color:var(--am);">$1,848</div><div class="mc-label">LTV (24-month)</div><div class="mc-detail">Business tier at 4% monthly churn</div></div>
    <div class="margin-card"><div class="mc-num" style="color:var(--am);">10–15×</div><div class="mc-label">ROI to Customer</div><div class="mc-detail">$79/mo replaces $270–$1,200/mo in tools</div></div>
  </div>
  <div style="margin-top:16px;padding:14px 18px;background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.18);border-radius:10px;font-size:0.8rem;color:var(--t2);line-height:1.6;">
    <strong style="color:var(--em);">Why churn is structurally low:</strong> A subscriber who cancels at $79/mo immediately faces reinstating $270–$1,200/mo in vendor contracts. The switching cost is not the platform subscription — it is the re-subscription to every tool they cancelled when they joined. This creates an asymmetric retention dynamic that no traditional SaaS product enjoys.
  </div>
</section>

<hr class="divider">

<!-- Market Sizing -->
<section class="section">
  <div class="sec-hdr">
    <div class="sec-eye">03 — Market Sizing</div>
    <h2 class="sec-h2">TAM: ${fmt(tamAnnual)} (US alone, subscriptions only).</h2>
    <p class="sec-sub">Addresses every industry where digital SaaS spend currently exceeds the platform price. The 0.1% / 1% columns show SAM-attainable revenue at realistic penetration rates.</p>
  </div>
  <div style="overflow-x:auto;">
  <table class="market-table">
    <thead><tr>
      <th>Segment</th>
      <th>US Businesses</th>
      <th>SaaS Active</th>
      <th>Avg Spend/Mo</th>
      <th>Platform Price</th>
      <th>Saves/Mo</th>
      <th>SAM Annual</th>
      <th>0.1% / 1% SOM</th>
    </tr></thead>
    <tbody>${segmentRowsHtml}</tbody>
    <tfoot><tr>
      <td>TOTAL</td>
      <td>${(MARKET_SEGMENTS.reduce((s,m)=>s+m.usBusinessCount,0)*1000).toLocaleString()}</td>
      <td>—</td>
      <td>—</td>
      <td>—</td>
      <td>—</td>
      <td class="seg-sam">${fmt(tamAnnual)}</td>
      <td class="seg-som">${fmt(Math.round(tamAnnual * 0.001))} / ${fmt(Math.round(tamAnnual * 0.01))}</td>
    </tr></tfoot>
  </table>
  </div>
  <div class="val-note" style="margin-top:14px;">TAM figures represent US market only. International expansion (UK, Canada, Australia, EU) multiplies addressable market by 4-6×. No international operations costs are required — the platform is software.</div>
</section>

<hr class="divider">

<!-- Comparable Company Analysis -->
<section class="section">
  <div class="sec-hdr">
    <div class="sec-eye">04 — Comparable Acquisitions &amp; Valuations</div>
    <h2 class="sec-h2">This platform replaces ${fmt(comparableValue)} worth of acquired companies.</h2>
    <p class="sec-sub">Each row is a company that was acquired or valued purely for the single capability this platform provides as one of thirteen included features.</p>
  </div>
  <div style="overflow-x:auto;">
  <table class="comp-table">
    <thead><tr>
      <th>Company</th>
      <th>What It Does</th>
      <th>Acquisition / Valuation</th>
      <th>Revenue at Val.</th>
      <th>Multiple</th>
      <th>Platform Relationship</th>
    </tr></thead>
    <tbody>${compRowsHtml}</tbody>
  </table>
  </div>
  <div class="val-note" style="margin-top:14px;"><strong style="color:var(--am);">Aggregate insight:</strong> The ${COMPARABLES.length} companies listed were collectively valued at ${fmt(comparableValue)}. Each of them does one thing. This platform does all ${COMPARABLES.length} things simultaneously, for a single flat fee that is 5-15× lower than what any one of them charges individually.</div>
</section>

<hr class="divider">

<!-- Capability Value -->
<section class="section">
  <div class="sec-hdr">
    <div class="sec-eye">05 — Capability Value Layers</div>
    <h2 class="sec-h2">${CAPABILITY_VALUES.length} platform capabilities. Each independently defensible.</h2>
    <p class="sec-sub">These are the value layers that compound over time. Some are defensible infrastructure (NEXUS). Some are flywheel mechanisms (affiliate engine). Some create data moats (analytics).</p>
  </div>
  <div class="cap-grid-val">${capBlocksHtml}</div>
</section>

<hr class="divider">

<!-- OS-Level Value -->
<section class="section">
  <div class="sec-hdr">
    <div class="sec-eye">06 — OS-Level Platform Premium</div>
    <h2 class="sec-h2">Why this is an OS, not a SaaS product.</h2>
  </div>
  <div class="os-callout">
    <h3>The NEXUS Distinction</h3>
    <p>A SaaS product does one thing. An OS layer does everything underneath. The distinction matters for valuation because OS-level platforms command fundamentally different revenue multiples and strategic premiums.</p>
    <p>NEXUS is not a scheduling tool. It is not a CRM. It is not an analytics product. It is a semantic intent resolution layer with hierarchical identity, adaptive surfaces, and session-aware context — none of which exist as a combined primitive anywhere in the market. Platforms that build OS-level infrastructure attract acquisition interest from:</p>
    <ul>
      <li>Enterprise software companies seeking to add SMB distribution (Intuit, Salesforce, HubSpot, Shopify)</li>
      <li>Private equity platforms seeking to consolidate fragmented SMB SaaS verticals</li>
      <li>Large vertical SaaS players (ServiceTitan, Mindbody, Buildium) seeking a horizontal layer to expand their TAM</li>
      <li>AI companies (Anthropic, Google, Microsoft) seeking enterprise distribution channels for their models</li>
    </ul>
    <p style="margin-top:10px;">Horizontal SaaS companies trade at 8-15× ARR. AI-native infrastructure companies trade at 20-60× ARR. OS-level platform companies with network effects trade at acquisition premiums above their ARR multiple. This platform has characteristics of all three.</p>
  </div>
</section>

<hr class="divider">

<!-- Valuation Scenarios -->
<section class="section">
  <div class="sec-hdr">
    <div class="sec-eye">07 — Valuation Scenarios</div>
    <h2 class="sec-h2">Four growth stages. Three valuation cases each.</h2>
    <p class="sec-sub">Bear case applies a 10× ARR multiple (mature SaaS discount). Base case applies 20× (AI-native SaaS). Bull case applies 40× (OS-layer infrastructure premium). All revenue from subscriptions only — excludes transaction, licensing, and data streams.</p>
  </div>
  <div class="scen-grid">${scenarioCardsHtml}</div>
  <div class="val-note" style="margin-top:20px;">
    <strong style="color:#818cf8;">Revenue not included in these scenarios:</strong> Transaction fees (adds 1.5% of GMV), white-label licensing ($499-2,499/mo per agency), API access ($0.01/call above tier limit), channel export upsells ($9-29/mo), vertical SaaS premiums ($49-499/user/mo), training marketplace revenue share (15%), data intelligence reports ($5k-50k/report), and enterprise private deployments ($25k-250k/yr). These streams are additive to the subscription ARR base and are expected to add 20-80% revenue on top of the subscription baseline at scale.
  </div>
</section>

<hr class="divider">

<!-- Category Creation Value -->
<section class="section">
  <div class="sec-hdr">
    <div class="sec-eye">08 — Category Creation Value</div>
    <h2 class="sec-h2">The value that has no comparables.</h2>
    <p class="sec-sub">Some of what this platform creates does not exist yet as a purchasable product. That is the highest-value position in any market.</p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;">
    ${[
      { h:"Semantic Intent OS Layer", b:"No company currently sells a product that resolves @signal, ~code, #concept, ?query, and verb simultaneously into a role-adaptive surface. NEXUS is the first implementation. The category does not exist. When a category is created, the creator is the default category leader." },
      { h:"AI Document Lifecycle", b:"Proposal generation + e-signature + delivery + storage + retrieval has never been offered as a single-action primitive. Five companies were acquired for collectively billions to do those five things separately. The integrated version has no market comp." },
      { h:"Zero-Config Business Intelligence", b:"Every analytics tool requires configuration. Every dashboard requires setup. A system that observes all business activity and writes the weekly summary in plain English with no setup required is a fundamentally new product category." },
      { h:"Knowledge-to-Training Pipeline", b:"The ability to upload a document and receive a complete training module — with quiz, completion tracking, and certificate — in under 60 seconds across any industry has no direct market comp. LMSes require instructional design. This requires nothing." },
      { h:"Channel-Agnostic Product Primitive", b:"Products defined once and emitted to Shopify, WooCommerce, Google Shopping, Amazon, and Stripe simultaneously — with AI-enriched descriptions per channel — is not offered by any single product. DataFeedWatch handles feeds. Shopify handles checkout. Never both, plus AI, plus hosted pages." },
      { h:"OS-Level Affiliate Attribution", b:"Affiliate tracking that is native to the platform's identity system — meaning affiliates are platform users, links carry presence tokens, and commissions are tracked against the same customer store that handles billing — is a structural advantage no third-party affiliate tool can replicate." },
    ].map(c => `<div style="background:var(--s2);border:1px solid var(--line);border-radius:12px;padding:18px;"><div style="font-size:0.88rem;font-weight:900;color:var(--am);margin-bottom:8px;">${c.h}</div><div style="font-size:0.75rem;color:var(--t2);line-height:1.6;">${c.b}</div></div>`).join("")}
  </div>
</section>

</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});

export default router;
