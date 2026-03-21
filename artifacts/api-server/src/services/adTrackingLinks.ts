/**
 * adTrackingLinks.ts — UTM Tracking Link Generator
 *
 * Generates fully-formed UTM-tagged URLs for every product/offer on the platform,
 * one set per ad network. Every link is ready to paste directly into campaign setup.
 *
 * UTM convention:
 *  utm_source   = network id (meta, google, tiktok, etc.)
 *  utm_medium   = cpc
 *  utm_campaign = campaign slug
 *  utm_content  = offer slug
 *  utm_term     = keyword (search networks only)
 */

import { AD_NETWORKS } from "./adsOrchestrator.js";

// ── Offer catalog — all monetizable products/pages on the platform ─────────────

export interface Offer {
  id:          string;
  name:        string;
  price:       string;
  baseUrl:     string;
  category:    string;
  paymentNote: string;
}

export const OFFERS: Offer[] = [
  {
    id: "pro-plan",
    name: "CreateAI Brain — Pro Plan",
    price: "$97/mo",
    baseUrl: "https://createaiplatform.com",
    category: "subscription",
    paymentNote: "Cash App $CreateAIDigital or Venmo @CreateAIDigital",
  },
  {
    id: "enterprise-plan",
    name: "CreateAI Brain — Enterprise Plan",
    price: "$497/mo",
    baseUrl: "https://createaiplatform.com",
    category: "subscription",
    paymentNote: "Cash App $CreateAIDigital or Venmo @CreateAIDigital",
  },
  {
    id: "healthcare-bundle",
    name: "HealthOS Healthcare Bundle",
    price: "$197/mo",
    baseUrl: "https://createaiplatform.com",
    category: "bundle",
    paymentNote: "Cash App $CreateAIDigital or Venmo @CreateAIDigital",
  },
  {
    id: "legal-bundle",
    name: "Legal Practice Manager Bundle",
    price: "$247/mo",
    baseUrl: "https://createaiplatform.com",
    category: "bundle",
    paymentNote: "Cash App $CreateAIDigital or Venmo @CreateAIDigital",
  },
  {
    id: "invention-layer",
    name: "AI Invention Layer — 12 Tools",
    price: "$47/mo",
    baseUrl: "https://createaiplatform.com",
    category: "addon",
    paymentNote: "Cash App $CreateAIDigital or Venmo @CreateAIDigital",
  },
  {
    id: "staffing-bundle",
    name: "StaffingOS — Global Staffing Platform",
    price: "$147/mo",
    baseUrl: "https://createaiplatform.com",
    category: "bundle",
    paymentNote: "Cash App $CreateAIDigital or Venmo @CreateAIDigital",
  },
  {
    id: "referral-program",
    name: "Referral Partner Program",
    price: "30% commission",
    baseUrl: "https://createaiplatform.com/referral",
    category: "affiliate",
    paymentNote: "Cash App $CreateAIDigital or Venmo @CreateAIDigital",
  },
  {
    id: "free-trial",
    name: "CreateAI Brain — Free Trial",
    price: "Free",
    baseUrl: "https://createaiplatform.com",
    category: "lead",
    paymentNote: "No payment required",
  },
];

// ── Campaign → Offer mapping ────────────────────────────────────────────────────

const CAMPAIGN_OFFER_MAP: Record<string, string> = {
  "meta-awareness":    "free-trial",
  "meta-leads":        "pro-plan",
  "meta-retargeting":  "pro-plan",
  "google-search":     "pro-plan",
  "google-display":    "free-trial",
  "google-youtube":    "enterprise-plan",
  "tiktok-awareness":  "free-trial",
  "tiktok-conversion": "invention-layer",
  "linkedin-b2b":      "enterprise-plan",
  "linkedin-leads":    "healthcare-bundle",
  "twitter-promoted":  "pro-plan",
  "pinterest-visual":  "pro-plan",
  "snapchat-gen-z":    "free-trial",
  "reddit-community":  "invention-layer",
  "microsoft-search":  "enterprise-plan",
};

// ── UTM Builder ────────────────────────────────────────────────────────────────

export interface TrackingLink {
  networkId:    string;
  networkName:  string;
  campaignId:   string;
  campaignName: string;
  offerId:      string;
  offerName:    string;
  offerPrice:   string;
  url:          string;
  shortParams:  string;
}

function buildUtmUrl(baseUrl: string, source: string, medium: string, campaign: string, content: string, term?: string): string {
  const u = new URL(baseUrl.includes("://") ? baseUrl : `https://${baseUrl}`);
  u.searchParams.set("utm_source", source);
  u.searchParams.set("utm_medium", medium);
  u.searchParams.set("utm_campaign", campaign);
  u.searchParams.set("utm_content", content);
  if (term) u.searchParams.set("utm_term", term);
  return u.toString();
}

export function generateAllTrackingLinks(): TrackingLink[] {
  const links: TrackingLink[] = [];

  for (const network of AD_NETWORKS) {
    for (const campaign of network.campaigns) {
      const offerId = CAMPAIGN_OFFER_MAP[campaign.id] ?? "free-trial";
      const offer = OFFERS.find(o => o.id === offerId) ?? OFFERS[0];
      const isSearch = network.id === "google" || network.id === "microsoft";

      const url = buildUtmUrl(
        offer.baseUrl,
        network.id,
        "cpc",
        campaign.id,
        offerId,
        isSearch ? offer.name.toLowerCase().replace(/\s+/g, "+") : undefined,
      );

      links.push({
        networkId:    network.id,
        networkName:  network.name,
        campaignId:   campaign.id,
        campaignName: campaign.name,
        offerId,
        offerName:    offer.name,
        offerPrice:   offer.price,
        url,
        shortParams:  `utm_source=${network.id}&utm_campaign=${campaign.id}&utm_content=${offerId}`,
      });
    }
  }

  return links;
}

export function getTrackingLinksForNetwork(networkId: string): TrackingLink[] {
  return generateAllTrackingLinks().filter(l => l.networkId === networkId);
}

export function getOfferCatalog(): Offer[] {
  return OFFERS;
}
