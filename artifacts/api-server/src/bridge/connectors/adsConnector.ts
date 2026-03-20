/**
 * bridge/connectors/adsConnector.ts — Ads Connector (Meta / Google / TikTok)
 *
 * Status: NOT_CONFIGURED
 * No ad platform credentials are present in the environment.
 *
 * To activate:
 *   Meta Ads:    Set META_ACCESS_TOKEN + META_AD_ACCOUNT_ID
 *   Google Ads:  Set GOOGLE_ADS_DEVELOPER_TOKEN + GOOGLE_ADS_CUSTOMER_ID
 *   TikTok Ads:  Set TIKTOK_ADS_ACCESS_TOKEN + TIKTOK_ADS_APP_ID
 *
 * Once any credential is set, BRIDGE_CONFIG.ads.status becomes "ACTIVE"
 * and the functions below should be implemented against the real APIs.
 * No fake impressions. No fake spend. No fake campaign data.
 */

import type { BridgeRequest, BridgeResponse } from "../types.js";
import { randomUUID }                          from "crypto";

function notConfigured(action: BridgeRequest["type"], fnName: string): BridgeResponse {
  const msg = `[Bridge:Ads] ⚠️ ${fnName}() — NOT_CONFIGURED. ` +
    "No META_ACCESS_TOKEN, GOOGLE_ADS_DEVELOPER_TOKEN, or TIKTOK_ADS_ACCESS_TOKEN found. " +
    "No ad campaign was created. No external call was made.";
  console.log(msg);
  return {
    requestId:    randomUUID(),
    connectorKey: "ads",
    action,
    status:       "NOT_CONFIGURED",
    error:        "Ads connector not configured. Set META_ACCESS_TOKEN, " +
                  "GOOGLE_ADS_DEVELOPER_TOKEN, or TIKTOK_ADS_ACCESS_TOKEN to activate.",
    ts:           new Date().toISOString(),
  };
}

// ─── createAdCampaign ─────────────────────────────────────────────────────────

export async function createAdCampaign(req: BridgeRequest): Promise<BridgeResponse> {
  // TODO: When META_ACCESS_TOKEN is set, implement:
  //   POST https://graph.facebook.com/v19.0/act_{AD_ACCOUNT_ID}/campaigns
  //   { name, objective, status, special_ad_categories }
  return notConfigured(req.type, "createAdCampaign");
}

// ─── pauseCampaign ────────────────────────────────────────────────────────────

export async function pauseCampaign(req: BridgeRequest): Promise<BridgeResponse> {
  // TODO: When credentials set, implement platform-specific pause call
  return notConfigured(req.type, "pauseCampaign");
}

// ─── getCampaignStats ─────────────────────────────────────────────────────────

export async function getCampaignStats(req: BridgeRequest): Promise<BridgeResponse> {
  // TODO: When credentials set, implement stats fetch
  // Return ONLY real stats from the ad platform — no fake impressions or spend
  return notConfigured(req.type, "getCampaignStats");
}
