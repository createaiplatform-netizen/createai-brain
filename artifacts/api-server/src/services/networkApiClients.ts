/**
 * networkApiClients.ts — Real API launch clients for all 9 ad networks
 *
 * Each client:
 *  1. Reads credentials from adCredentials store
 *  2. Makes live HTTP API calls to create campaigns (status: PAUSED)
 *  3. Returns { ok, campaigns: [{id, name, networkCampaignId}], activateUrl, note }
 *
 * Campaigns are created PAUSED so Sara reviews before any spend begins.
 * Her single remaining action per network: open the dashboard, click Activate.
 *
 * Networks implemented with real REST API calls:
 *   Meta (Facebook + Instagram)   — Marketing API v18
 *   TikTok                         — Marketing API v1.3
 *   LinkedIn                       — Campaign Manager REST API
 *   Pinterest                      — Ads API v5
 *   Snapchat                       — Marketing API v1
 *   Reddit                         — Ads API v3
 *   Microsoft / Bing               — Advertising REST API
 *   Google Ads                     — REST API v15 (requires developer token approval)
 *   X / Twitter                    — Ads API v12 (OAuth 1.0a documented below)
 */

import { getAdCredential } from "./adsOrchestrator.js";
import { AD_NETWORKS, type AdNetworkDef, type PreBuiltCampaign } from "./adsOrchestrator.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATUS_PATH = path.resolve(__dirname, "../../campaignStatus.store.json");

// ─── Campaign Status Store ────────────────────────────────────────────────────

export interface CampaignDeployRecord {
  campaignId:        string;
  networkId:         string;
  networkCampaignId: string | null;
  name:              string;
  status:            "queued" | "created" | "active" | "error";
  error:             string | null;
  createdAt:         string;
  activateUrl:       string;
}

let statusStore: Record<string, CampaignDeployRecord> = {};

(function loadStatus() {
  if (!existsSync(STATUS_PATH)) return;
  try { statusStore = JSON.parse(readFileSync(STATUS_PATH, "utf8")); } catch { /* fresh */ }
})();

function saveStatus() {
  writeFileSync(STATUS_PATH, JSON.stringify(statusStore, null, 2));
}

export function recordCampaign(record: CampaignDeployRecord) {
  statusStore[record.campaignId] = record;
  saveStatus();
}

export function getCampaignStatus(campaignId: string): CampaignDeployRecord | null {
  return statusStore[campaignId] ?? null;
}

export function getAllCampaignStatuses(): CampaignDeployRecord[] {
  return Object.values(statusStore);
}

// ─── Launch Result Type ───────────────────────────────────────────────────────

export interface LaunchResult {
  networkId:    string;
  networkName:  string;
  ok:           boolean;
  launched:     number;
  failed:       number;
  campaigns:    { id: string; name: string; networkCampaignId: string | null; status: string; error: string | null }[];
  activateUrl:  string;
  nextStep:     string;
  error?:       string;
}

// ─── Shared HTTP helper ───────────────────────────────────────────────────────

async function postJSON(url: string, body: unknown, headers: Record<string, string>): Promise<{ ok: boolean; status: number; data: unknown }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.status >= 200 && res.status < 300, status: res.status, data };
  } catch (e: unknown) {
    return { ok: false, status: 0, data: { error: String(e) } };
  }
}

// ─── META MARKETING API v18 ───────────────────────────────────────────────────

async function launchMeta(campaigns: PreBuiltCampaign[]): Promise<LaunchResult> {
  const token     = getAdCredential("META_ADS_ACCESS_TOKEN");
  const accountId = getAdCredential("META_AD_ACCOUNT_ID");

  if (!token || !accountId) {
    return { networkId: "meta", networkName: "Meta Ads", ok: false, launched: 0, failed: campaigns.length, campaigns: [], activateUrl: "https://business.facebook.com/adsmanager", nextStep: "Enter META_ADS_ACCESS_TOKEN and META_AD_ACCOUNT_ID in Credentials Hub", error: "Missing credentials" };
  }

  const clean = accountId.replace(/^act_/, "");
  const results: LaunchResult["campaigns"] = [];

  const OBJ_MAP: Record<string, string> = {
    awareness:   "BRAND_AWARENESS",
    traffic:     "LINK_CLICKS",
    leads:       "LEAD_GENERATION",
    conversions: "CONVERSIONS",
    retargeting: "CONVERSIONS",
  };

  for (const c of campaigns) {
    const url = `https://graph.facebook.com/v18.0/act_${clean}/campaigns`;
    const res = await postJSON(url, {
      name:                  c.name,
      objective:             OBJ_MAP[c.objective] ?? "BRAND_AWARENESS",
      status:                "PAUSED",
      special_ad_categories: [],
      daily_budget:          Math.round(c.dailyBudget * 100), // cents
    }, { Authorization: `Bearer ${token}` });

    const data = res.data as Record<string, unknown>;
    const networkId = res.ok ? String(data["id"] ?? "") : null;
    const err = res.ok ? null : (String((data["error"] as Record<string, unknown>)?.["message"] ?? JSON.stringify(data)));
    results.push({ id: c.id, name: c.name, networkCampaignId: networkId, status: res.ok ? "created" : "error", error: err });
    recordCampaign({ campaignId: c.id, networkId: "meta", networkCampaignId: networkId, name: c.name, status: res.ok ? "created" : "error", error: err, createdAt: new Date().toISOString(), activateUrl: "https://business.facebook.com/adsmanager" });
  }

  const launched = results.filter(r => r.status === "created").length;
  return {
    networkId:   "meta",
    networkName: "Meta Ads (Facebook + Instagram)",
    ok:          launched > 0,
    launched,
    failed:      results.length - launched,
    campaigns:   results,
    activateUrl: `https://business.facebook.com/adsmanager/manage/campaigns/?act=${clean}`,
    nextStep:    launched > 0
      ? `${launched} campaigns created in PAUSED state. Go to Meta Ads Manager → select campaigns → click Activate. Ads go live immediately upon activation.`
      : "Campaign creation failed — check your access token has ads_management permission and the ad account ID is correct.",
  };
}

// ─── TIKTOK MARKETING API v1.3 ────────────────────────────────────────────────

async function launchTikTok(campaigns: PreBuiltCampaign[]): Promise<LaunchResult> {
  const token        = getAdCredential("TIKTOK_ADS_ACCESS_TOKEN");
  const advertiserId = getAdCredential("TIKTOK_ADS_ADVERTISER_ID");

  if (!token || !advertiserId) {
    return { networkId: "tiktok", networkName: "TikTok Ads", ok: false, launched: 0, failed: campaigns.length, campaigns: [], activateUrl: "https://ads.tiktok.com", nextStep: "Enter TIKTOK_ADS_ACCESS_TOKEN and TIKTOK_ADS_ADVERTISER_ID", error: "Missing credentials" };
  }

  const OBJ_MAP: Record<string, string> = {
    awareness:   "REACH",
    traffic:     "TRAFFIC",
    leads:       "LEAD_GENERATION",
    conversions: "CONVERSIONS",
    retargeting: "CONVERSIONS",
  };

  const results: LaunchResult["campaigns"] = [];
  for (const c of campaigns) {
    const res = await postJSON("https://business-api.tiktok.com/open_api/v1.3/campaign/create/", {
      advertiser_id:  advertiserId,
      campaign_name:  c.name,
      objective_type: OBJ_MAP[c.objective] ?? "REACH",
      budget_mode:    "BUDGET_MODE_DAY",
      budget:         c.dailyBudget,
      operation_status: "DISABLE",
    }, { "Access-Token": token });

    const data = res.data as Record<string, unknown>;
    const inner = data["data"] as Record<string, unknown> | undefined;
    const networkId = res.ok ? String((inner?.["campaign_id"] ?? "") as string) : null;
    const err = res.ok ? null : String(data["message"] ?? JSON.stringify(data));
    results.push({ id: c.id, name: c.name, networkCampaignId: networkId, status: res.ok ? "created" : "error", error: err });
    recordCampaign({ campaignId: c.id, networkId: "tiktok", networkCampaignId: networkId, name: c.name, status: res.ok ? "created" : "error", error: err, createdAt: new Date().toISOString(), activateUrl: "https://ads.tiktok.com" });
  }

  const launched = results.filter(r => r.status === "created").length;
  return {
    networkId: "tiktok", networkName: "TikTok Ads", ok: launched > 0, launched, failed: results.length - launched, campaigns: results,
    activateUrl: "https://ads.tiktok.com/i18n/perf/campaign",
    nextStep: launched > 0 ? `${launched} campaigns created (disabled). Open TikTok Ads Manager → Campaigns → select each → Enable.` : "Check access token and advertiser ID.",
  };
}

// ─── LINKEDIN MARKETING API ───────────────────────────────────────────────────

async function launchLinkedIn(campaigns: PreBuiltCampaign[]): Promise<LaunchResult> {
  const token     = getAdCredential("LINKEDIN_ADS_ACCESS_TOKEN");
  const accountId = getAdCredential("LINKEDIN_ADS_ACCOUNT_ID");
  const orgId     = getAdCredential("LINKEDIN_ADS_ORGANIZATION_ID");

  if (!token || !accountId) {
    return { networkId: "linkedin", networkName: "LinkedIn Ads", ok: false, launched: 0, failed: campaigns.length, campaigns: [], activateUrl: "https://www.linkedin.com/campaignmanager", nextStep: "Enter LinkedIn credentials", error: "Missing credentials" };
  }

  const OBJ_MAP: Record<string, string> = {
    awareness:   "BRAND_AWARENESS",
    traffic:     "WEBSITE_VISITS",
    leads:       "LEAD_GENERATION",
    conversions: "WEBSITE_CONVERSIONS",
    retargeting: "WEBSITE_CONVERSIONS",
  };

  const results: LaunchResult["campaigns"] = [];
  for (const c of campaigns) {
    const res = await postJSON("https://api.linkedin.com/rest/adCampaignGroups", {
      account:   `urn:li:sponsoredAccount:${accountId}`,
      name:      `${c.name} — Group`,
      status:    "DRAFT",
      runSchedule: { start: new Date().toISOString().split("T")[0] },
    }, { Authorization: `Bearer ${token}`, "LinkedIn-Version": "202311", "X-Restli-Protocol-Version": "2.0.0" });

    const data = res.data as Record<string, unknown>;
    const groupId = res.ok ? String(data["id"] ?? "") : null;
    const err = res.ok ? null : String(data["message"] ?? JSON.stringify(data));

    let networkCampaignId: string | null = null;
    if (groupId) {
      const campRes = await postJSON("https://api.linkedin.com/rest/adCampaigns", {
        account:       `urn:li:sponsoredAccount:${accountId}`,
        campaignGroup: groupId,
        name:          c.name,
        status:        "DRAFT",
        type:          "SPONSORED_CONTENT",
        objectiveType: OBJ_MAP[c.objective] ?? "BRAND_AWARENESS",
        costType:      "CPC",
        dailyBudget:   { amount: String(c.dailyBudget), currencyCode: "USD" },
        unitCost:      { amount: "1.00", currencyCode: "USD" },
        targetingCriteria: {
          include: { and: [{ or: { "urn:li:adTargetingFacet:locations": ["urn:li:geo:103644278"] } }] },
        },
      }, { Authorization: `Bearer ${token}`, "LinkedIn-Version": "202311", "X-Restli-Protocol-Version": "2.0.0" });

      const campData = campRes.data as Record<string, unknown>;
      networkCampaignId = campRes.ok ? String(campData["id"] ?? "") : null;
    }

    results.push({ id: c.id, name: c.name, networkCampaignId, status: networkCampaignId ? "created" : "error", error: networkCampaignId ? null : (err ?? "Campaign group creation failed") });
    recordCampaign({ campaignId: c.id, networkId: "linkedin", networkCampaignId, name: c.name, status: networkCampaignId ? "created" : "error", error: err, createdAt: new Date().toISOString(), activateUrl: `https://www.linkedin.com/campaignmanager/accounts/${accountId}/campaigns` });
  }

  const launched = results.filter(r => r.status === "created").length;
  return {
    networkId: "linkedin", networkName: "LinkedIn Ads", ok: launched > 0, launched, failed: results.length - launched, campaigns: results,
    activateUrl: `https://www.linkedin.com/campaignmanager/accounts/${accountId}/campaigns`,
    nextStep: launched > 0 ? `${launched} campaigns created as DRAFT. Go to Campaign Manager → select each campaign → click 'Set Live'.` : "Check LinkedIn access token and account ID.",
  };
}

// ─── PINTEREST ADS API v5 ─────────────────────────────────────────────────────

async function launchPinterest(campaigns: PreBuiltCampaign[]): Promise<LaunchResult> {
  const token     = getAdCredential("PINTEREST_ADS_ACCESS_TOKEN");
  const accountId = getAdCredential("PINTEREST_AD_ACCOUNT_ID");

  if (!token || !accountId) {
    return { networkId: "pinterest", networkName: "Pinterest Ads", ok: false, launched: 0, failed: campaigns.length, campaigns: [], activateUrl: "https://ads.pinterest.com", nextStep: "Enter Pinterest credentials", error: "Missing credentials" };
  }

  const OBJ_MAP: Record<string, string> = {
    awareness:   "AWARENESS",
    traffic:     "CONSIDERATION",
    leads:       "CONSIDERATION",
    conversions: "CONVERSIONS",
    retargeting: "CONVERSIONS",
  };

  const results: LaunchResult["campaigns"] = [];
  for (const c of campaigns) {
    const res = await postJSON(`https://api.pinterest.com/v5/ad_accounts/${accountId}/campaigns`, {
      name:              c.name,
      objective_type:    OBJ_MAP[c.objective] ?? "AWARENESS",
      status:            "PAUSED",
      daily_spend_cap:   Math.round(c.dailyBudget * 1000000),
    }, { Authorization: `Bearer ${token}` });

    const data = res.data as Record<string, unknown>;
    const items = (data["items"] as unknown[]) ?? [];
    const item = (items[0] ?? {}) as Record<string, unknown>;
    const networkId = item["id"] ? String(item["id"]) : null;
    const err = res.ok ? null : String(data["message"] ?? JSON.stringify(data));
    results.push({ id: c.id, name: c.name, networkCampaignId: networkId, status: networkId ? "created" : "error", error: err });
    recordCampaign({ campaignId: c.id, networkId: "pinterest", networkCampaignId: networkId, name: c.name, status: networkId ? "created" : "error", error: err, createdAt: new Date().toISOString(), activateUrl: `https://ads.pinterest.com/advertiser/${accountId}/campaigns/` });
  }

  const launched = results.filter(r => r.status === "created").length;
  return {
    networkId: "pinterest", networkName: "Pinterest Ads", ok: launched > 0, launched, failed: results.length - launched, campaigns: results,
    activateUrl: `https://ads.pinterest.com/advertiser/${accountId}/campaigns/`,
    nextStep: launched > 0 ? `${launched} campaigns created (PAUSED). Open Pinterest Ads → Campaigns → Activate.` : "Check Pinterest access token and ad account ID.",
  };
}

// ─── SNAPCHAT MARKETING API v1 ────────────────────────────────────────────────

async function launchSnapchat(campaigns: PreBuiltCampaign[]): Promise<LaunchResult> {
  const token     = getAdCredential("SNAPCHAT_ADS_ACCESS_TOKEN");
  const accountId = getAdCredential("SNAPCHAT_AD_ACCOUNT_ID");

  if (!token || !accountId) {
    return { networkId: "snapchat", networkName: "Snapchat Ads", ok: false, launched: 0, failed: campaigns.length, campaigns: [], activateUrl: "https://ads.snapchat.com", nextStep: "Enter Snapchat credentials", error: "Missing credentials" };
  }

  const OBJ_MAP: Record<string, string> = {
    awareness:   "REACH",
    traffic:     "WEB_VIEW",
    leads:       "LEAD_GENERATION",
    conversions: "PIXEL_PAGE_VIEW",
    retargeting: "PIXEL_PAGE_VIEW",
  };

  const results: LaunchResult["campaigns"] = [];
  for (const c of campaigns) {
    const res = await postJSON(`https://adsapi.snapchat.com/v1/adaccounts/${accountId}/campaigns`, {
      campaigns: [{
        name:             c.name,
        ad_account_id:    accountId,
        status:           "PAUSED",
        objective:        OBJ_MAP[c.objective] ?? "REACH",
        daily_budget_micro: Math.round(c.dailyBudget * 1_000_000),
        start_time:       new Date().toISOString(),
      }],
    }, { Authorization: `Bearer ${token}` });

    const data = res.data as Record<string, unknown>;
    const items = ((data["campaigns"] as unknown[]) ?? []) as Record<string, unknown>[];
    const item = (items[0] ?? {}) as Record<string, unknown>;
    const inner = item["campaign"] as Record<string, unknown> | undefined;
    const networkId = inner?.["id"] ? String(inner["id"]) : null;
    const err = res.ok ? null : String(data["request_status"] ?? JSON.stringify(data));
    results.push({ id: c.id, name: c.name, networkCampaignId: networkId, status: networkId ? "created" : "error", error: err });
    recordCampaign({ campaignId: c.id, networkId: "snapchat", networkCampaignId: networkId, name: c.name, status: networkId ? "created" : "error", error: err, createdAt: new Date().toISOString(), activateUrl: `https://ads.snapchat.com/v2/accounts/${accountId}/campaigns` });
  }

  const launched = results.filter(r => r.status === "created").length;
  return {
    networkId: "snapchat", networkName: "Snapchat Ads", ok: launched > 0, launched, failed: results.length - launched, campaigns: results,
    activateUrl: `https://ads.snapchat.com`,
    nextStep: launched > 0 ? `${launched} campaigns created (PAUSED). Open Snapchat Ads Manager → Campaigns → Activate.` : "Check Snapchat access token and account ID.",
  };
}

// ─── REDDIT ADS API v3 ────────────────────────────────────────────────────────

async function launchReddit(campaigns: PreBuiltCampaign[]): Promise<LaunchResult> {
  const token     = getAdCredential("REDDIT_ADS_ACCESS_TOKEN");
  const accountId = getAdCredential("REDDIT_ADS_ACCOUNT_ID");

  if (!token || !accountId) {
    return { networkId: "reddit", networkName: "Reddit Ads", ok: false, launched: 0, failed: campaigns.length, campaigns: [], activateUrl: "https://ads.reddit.com", nextStep: "Enter Reddit credentials", error: "Missing credentials" };
  }

  const OBJ_MAP: Record<string, string> = {
    awareness:   "BRAND_AWARENESS_AND_REACH",
    traffic:     "TRAFFIC",
    leads:       "LEAD_GENERATION",
    conversions: "CONVERSIONS",
    retargeting: "CONVERSIONS",
  };

  const results: LaunchResult["campaigns"] = [];
  for (const c of campaigns) {
    const res = await postJSON(`https://ads-api.reddit.com/api/v3/campaigns`, {
      account_id:   accountId,
      name:         c.name,
      objective:    OBJ_MAP[c.objective] ?? "BRAND_AWARENESS_AND_REACH",
      status:       "PAUSED",
      daily_budget: Math.round(c.dailyBudget * 100),
    }, { Authorization: `Bearer ${token}`, "User-Agent": "CreateAIBrain/1.0" });

    const data = res.data as Record<string, unknown>;
    const networkId = res.ok ? String(data["id"] ?? "") : null;
    const err = res.ok ? null : String(data["message"] ?? JSON.stringify(data));
    results.push({ id: c.id, name: c.name, networkCampaignId: networkId, status: networkId ? "created" : "error", error: err });
    recordCampaign({ campaignId: c.id, networkId: "reddit", networkCampaignId: networkId, name: c.name, status: networkId ? "created" : "error", error: err, createdAt: new Date().toISOString(), activateUrl: "https://ads.reddit.com" });
  }

  const launched = results.filter(r => r.status === "created").length;
  return {
    networkId: "reddit", networkName: "Reddit Ads", ok: launched > 0, launched, failed: results.length - launched, campaigns: results,
    activateUrl: "https://ads.reddit.com",
    nextStep: launched > 0 ? `${launched} campaigns created (PAUSED). Open Reddit Ads → select campaigns → Enable.` : "Check Reddit access token and account ID.",
  };
}

// ─── MICROSOFT ADVERTISING (BING) ─────────────────────────────────────────────

async function launchMicrosoft(campaigns: PreBuiltCampaign[]): Promise<LaunchResult> {
  const devToken   = getAdCredential("MICROSOFT_ADS_DEVELOPER_TOKEN");
  const customerId = getAdCredential("MICROSOFT_ADS_CUSTOMER_ID");
  const clientId   = getAdCredential("MICROSOFT_ADS_CLIENT_ID");
  const refresh    = getAdCredential("MICROSOFT_ADS_REFRESH_TOKEN");

  if (!devToken || !customerId) {
    return { networkId: "microsoft", networkName: "Microsoft Advertising", ok: false, launched: 0, failed: campaigns.length, campaigns: [], activateUrl: "https://ads.microsoft.com", nextStep: "Enter Microsoft Advertising credentials", error: "Missing credentials" };
  }

  // Get fresh access token via OAuth2 token refresh
  let accessToken: string | null = null;
  if (refresh && clientId) {
    try {
      const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type:    "refresh_token",
          refresh_token: refresh,
          client_id:     clientId,
          scope:         "https://ads.microsoft.com/.default offline_access",
        }).toString(),
      });
      const tokenData = await tokenRes.json() as Record<string, unknown>;
      accessToken = String(tokenData["access_token"] ?? "");
    } catch { /* will fail gracefully */ }
  }

  if (!accessToken) {
    return { networkId: "microsoft", networkName: "Microsoft Advertising", ok: false, launched: 0, failed: campaigns.length, campaigns: [], activateUrl: "https://ads.microsoft.com", nextStep: "OAuth refresh token or client ID is missing/expired. Re-authorize at developers.ads.microsoft.com.", error: "Could not get access token from refresh token" };
  }

  const results: LaunchResult["campaigns"] = [];
  for (const c of campaigns) {
    const res = await postJSON("https://campaign.api.bingads.microsoft.com/api/advertiser/v13/bulk/campaigns", {
      Campaigns: [{
        BudgetType:    "DailyBudgetStandard",
        DailyBudget:   c.dailyBudget,
        Name:          c.name,
        Status:        "Paused",
        TimeZone:      "EasternTimeUSCanada",
      }],
    }, {
      Authorization:         `Bearer ${accessToken}`,
      DeveloperToken:        devToken,
      CustomerId:            customerId,
    });

    const data = res.data as Record<string, unknown>;
    const networkId = res.ok ? String(data["Id"] ?? "") : null;
    const err = res.ok ? null : String(JSON.stringify(data));
    results.push({ id: c.id, name: c.name, networkCampaignId: networkId, status: networkId ? "created" : "error", error: err });
    recordCampaign({ campaignId: c.id, networkId: "microsoft", networkCampaignId: networkId, name: c.name, status: networkId ? "created" : "error", error: err, createdAt: new Date().toISOString(), activateUrl: `https://ui.ads.microsoft.com/campaign/Campaigns?` });
  }

  const launched = results.filter(r => r.status === "created").length;
  return {
    networkId: "microsoft", networkName: "Microsoft Advertising", ok: launched > 0, launched, failed: results.length - launched, campaigns: results,
    activateUrl: "https://ui.ads.microsoft.com",
    nextStep: launched > 0 ? `${launched} Bing campaigns created (Paused). Open Microsoft Ads → Campaigns → Enable.` : "Check Microsoft developer token and customer ID.",
  };
}

// ─── GOOGLE ADS (REST API v15) ────────────────────────────────────────────────

async function launchGoogle(campaigns: PreBuiltCampaign[]): Promise<LaunchResult> {
  const devToken   = getAdCredential("GOOGLE_ADS_DEVELOPER_TOKEN");
  const customerId = getAdCredential("GOOGLE_ADS_CUSTOMER_ID");
  const clientId   = getAdCredential("GOOGLE_ADS_CLIENT_ID");
  const secret     = getAdCredential("GOOGLE_ADS_CLIENT_SECRET");
  const refresh    = getAdCredential("GOOGLE_ADS_REFRESH_TOKEN");

  if (!devToken || !customerId) {
    return { networkId: "google", networkName: "Google Ads", ok: false, launched: 0, failed: campaigns.length, campaigns: [], activateUrl: "https://ads.google.com", nextStep: "Enter Google Ads developer token (requires 1-3 week review approval) and customer ID.", error: "Missing credentials" };
  }

  // Refresh OAuth access token
  let accessToken: string | null = null;
  if (refresh && clientId && secret) {
    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type:    "refresh_token",
          refresh_token: refresh,
          client_id:     clientId,
          client_secret: secret,
        }).toString(),
      });
      const data = await res.json() as Record<string, unknown>;
      accessToken = String(data["access_token"] ?? "");
    } catch { /* will fail gracefully */ }
  }

  if (!accessToken) {
    return {
      networkId: "google", networkName: "Google Ads", ok: false, launched: 0, failed: campaigns.length, campaigns: [],
      activateUrl: "https://ads.google.com",
      nextStep: "Google Ads requires: (1) Developer token approval from Google [1-3 weeks], (2) OAuth client credentials, (3) refresh token. Complete setup at developers.google.com/google-ads/api/docs/get-started/dev-token",
      error: "OAuth token not available — complete Google OAuth flow first",
    };
  }

  const cleanCustomerId = customerId.replace(/-/g, "");
  const OBJ_MAP: Record<string, string> = {
    awareness:   "REACH",
    traffic:     "WEBSITE_TRAFFIC",
    leads:       "LEAD_GENERATION",
    conversions: "SALES",
    retargeting: "SALES",
  };

  const results: LaunchResult["campaigns"] = [];
  for (const c of campaigns) {
    const isVideo = c.creative.format.toLowerCase().includes("video") || c.creative.format.toLowerCase().includes("youtube");
    const res = await postJSON(`https://googleads.googleapis.com/v15/customers/${cleanCustomerId}/campaigns:mutate`, {
      operations: [{
        create: {
          name:                c.name,
          advertisingChannelType: isVideo ? "VIDEO" : "SEARCH",
          status:              "PAUSED",
          campaignBudget:      `customers/${cleanCustomerId}/campaignBudgets/~`,
          manualCpc:           {},
          networkSettings: {
            targetGoogleSearch:        !isVideo,
            targetSearchNetwork:       !isVideo,
            targetContentNetwork:      false,
            targetPartnerSearchNetwork: false,
          },
        },
      }],
    }, {
      Authorization:    `Bearer ${accessToken}`,
      "developer-token": devToken,
    });

    const data = res.data as Record<string, unknown>;
    const results2 = (data["results"] as unknown[]) ?? [];
    const r0 = (results2[0] ?? {}) as Record<string, unknown>;
    const resourceName = String(r0["resourceName"] ?? "");
    const networkId = resourceName || null;
    const err = res.ok ? null : String(JSON.stringify(data));
    results.push({ id: c.id, name: c.name, networkCampaignId: networkId, status: networkId ? "created" : "error", error: err });
    recordCampaign({ campaignId: c.id, networkId: "google", networkCampaignId: networkId, name: c.name, status: networkId ? "created" : "error", error: err, createdAt: new Date().toISOString(), activateUrl: "https://ads.google.com" });
  }

  const launched = results.filter(r => r.status === "created").length;
  return {
    networkId: "google", networkName: "Google Ads", ok: launched > 0, launched, failed: results.length - launched, campaigns: results,
    activateUrl: "https://ads.google.com",
    nextStep: launched > 0 ? `${launched} Google campaigns created (PAUSED). Open Google Ads → Campaigns → Enable. Note: campaigns won't run until billing is confirmed in Google Ads.` : "Check developer token approval status and OAuth credentials.",
  };
}

// ─── X / TWITTER ADS API v12 ─────────────────────────────────────────────────
// X Ads requires OAuth 1.0a request signing — implemented below

function signOAuth1(method: string, url: string, params: Record<string, string>, consumerKey: string, consumerSecret: string, token: string, tokenSecret: string): string {
  const ts    = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");

  const oauthParams: Record<string, string> = {
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp:        ts,
    oauth_token:            token,
    oauth_version:          "1.0",
  };

  const all = { ...params, ...oauthParams };
  const sorted = Object.keys(all).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(all[k])}`).join("&");
  const base   = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sorted)}`;
  const key    = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const sig    = crypto.createHmac("sha1", key).update(base).digest("base64");

  oauthParams["oauth_signature"] = sig;
  const header = "OAuth " + Object.keys(oauthParams).sort().map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`).join(", ");
  return header;
}

async function launchTwitterX(campaigns: PreBuiltCampaign[]): Promise<LaunchResult> {
  const accessToken   = getAdCredential("TWITTER_ADS_ACCESS_TOKEN");
  const accessSecret  = getAdCredential("TWITTER_ADS_ACCESS_SECRET");
  const consumerKey   = getAdCredential("TWITTER_ADS_CONSUMER_KEY");
  const consumerSec   = getAdCredential("TWITTER_ADS_CONSUMER_SECRET");
  const accountId     = getAdCredential("TWITTER_ADS_ACCOUNT_ID");

  if (!accessToken || !accessSecret || !consumerKey || !consumerSec || !accountId) {
    return { networkId: "twitter_x", networkName: "X (Twitter) Ads", ok: false, launched: 0, failed: campaigns.length, campaigns: [], activateUrl: "https://ads.twitter.com", nextStep: "Enter all 5 X/Twitter API credentials. X requires Elevated API access — apply at developer.twitter.com.", error: "Missing credentials" };
  }

  const OBJ_MAP: Record<string, string> = {
    awareness:   "REACH",
    traffic:     "WEBSITE_CLICKS",
    leads:       "LEAD_GENERATION",
    conversions: "WEBSITE_CONVERSIONS",
    retargeting: "WEBSITE_CONVERSIONS",
  };

  const results: LaunchResult["campaigns"] = [];
  for (const c of campaigns) {
    const url = `https://ads-api.twitter.com/12/accounts/${accountId}/campaigns`;
    const body = new URLSearchParams({
      name:              c.name,
      objective:         OBJ_MAP[c.objective] ?? "REACH",
      status:            "PAUSED",
      daily_budget_amount_local_micro: String(Math.round(c.dailyBudget * 1_000_000)),
      currency:          "USD",
    });

    const authHeader = signOAuth1("POST", url, Object.fromEntries(body.entries()), consumerKey, consumerSec, accessToken, accessSecret);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const data = await res.json() as Record<string, unknown>;
      const dataObj = (data["data"] as Record<string, unknown>) ?? {};
      const networkId = dataObj["id"] ? String(dataObj["id"]) : null;
      const err = res.ok ? null : String(JSON.stringify(data));
      results.push({ id: c.id, name: c.name, networkCampaignId: networkId, status: networkId ? "created" : "error", error: err });
      recordCampaign({ campaignId: c.id, networkId: "twitter_x", networkCampaignId: networkId, name: c.name, status: networkId ? "created" : "error", error: err, createdAt: new Date().toISOString(), activateUrl: `https://ads.twitter.com/accounts/${accountId}/campaigns` });
    } catch (e) {
      const err = String(e);
      results.push({ id: c.id, name: c.name, networkCampaignId: null, status: "error", error: err });
      recordCampaign({ campaignId: c.id, networkId: "twitter_x", networkCampaignId: null, name: c.name, status: "error", error: err, createdAt: new Date().toISOString(), activateUrl: `https://ads.twitter.com/accounts/${accountId}/campaigns` });
    }
  }

  const launched = results.filter(r => r.status === "created").length;
  return {
    networkId: "twitter_x", networkName: "X (Twitter) Ads", ok: launched > 0, launched, failed: results.length - launched, campaigns: results,
    activateUrl: `https://ads.twitter.com/accounts/${accountId}/campaigns`,
    nextStep: launched > 0 ? `${launched} X campaigns created (PAUSED). Open X Ads Manager → Campaigns → Resume.` : "Check all 5 X API credentials and ensure Elevated access is approved.",
  };
}

// ─── Master Dispatch ──────────────────────────────────────────────────────────

const CLIENTS: Record<string, (campaigns: PreBuiltCampaign[]) => Promise<LaunchResult>> = {
  meta:      launchMeta,
  tiktok:    launchTikTok,
  linkedin:  launchLinkedIn,
  pinterest: launchPinterest,
  snapchat:  launchSnapchat,
  reddit:    launchReddit,
  microsoft: launchMicrosoft,
  google:    launchGoogle,
  twitter_x: launchTwitterX,
};

export async function launchNetwork(networkId: string): Promise<LaunchResult> {
  const net = AD_NETWORKS.find(n => n.id === networkId);
  if (!net) {
    return { networkId, networkName: networkId, ok: false, launched: 0, failed: 0, campaigns: [], activateUrl: "", nextStep: "", error: `Unknown network: ${networkId}` };
  }

  const client = CLIENTS[networkId];
  if (!client) {
    return { networkId, networkName: net.name, ok: false, launched: 0, failed: net.campaigns.length, campaigns: [], activateUrl: net.setupUrl, nextStep: `API client for ${net.name} is building — check back shortly`, error: "Client not yet wired" };
  }

  return client(net.campaigns);
}

export async function launchAllConnectedNetworks(): Promise<LaunchResult[]> {
  const results: LaunchResult[] = [];
  for (const net of AD_NETWORKS) {
    const { getNetworkStatus } = await import("./adsOrchestrator.js");
    const status = getNetworkStatus(net);
    if (status.connected) {
      const result = await launchNetwork(net.id);
      results.push(result);
    }
  }
  return results;
}
