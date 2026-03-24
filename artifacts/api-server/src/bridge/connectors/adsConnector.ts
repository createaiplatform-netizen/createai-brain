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
 * Implementation guide (once credentials are added):
 *   createAdCampaign:  POST https://graph.facebook.com/v19.0/act_{ACCOUNT_ID}/campaigns
 *   pauseCampaign:     POST https://graph.facebook.com/v19.0/{CAMPAIGN_ID} { status: "PAUSED" }
 *   getCampaignStats:  GET  https://graph.facebook.com/v19.0/{CAMPAIGN_ID}/insights
 *
 * No fake impressions. No fake spend. No fake campaign data — ever.
 */

import type { BridgeRequest, BridgeResponse } from "../types.js";
import { randomUUID }                          from "crypto";
import { OWNER_AUTHORIZATION_MANIFEST as _OAM } from "../../security/ownerAuthorizationManifest.js";

// ─── Owner Authorization ───────────────────────────────────────────────────────
console.log(`[Bridge:Ads] \uD83D\uDD10 Owner authorization confirmed \u2014 ${_OAM.owner} (${_OAM.ownerId}) \u00B7 status:NOT_CONFIGURED until credentials added`);

function notConfigured(action: BridgeRequest["type"], fnName: string): BridgeResponse {
  const msg = `[Bridge:Ads] \u26A0\uFE0F ${fnName}() \u2014 NOT_CONFIGURED. ` +
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
// Activation: POST https://graph.facebook.com/v19.0/act_{META_AD_ACCOUNT_ID}/campaigns
//   Body: { name, objective, status: "ACTIVE", special_ad_categories: [] }

export async function createAdCampaign(req: BridgeRequest): Promise<BridgeResponse> {
  return notConfigured(req.type, "createAdCampaign");
}

// ─── pauseCampaign ────────────────────────────────────────────────────────────
// Activation (Meta): POST https://graph.facebook.com/v19.0/{campaignId}
//   Body: { status: "PAUSED", access_token: META_ACCESS_TOKEN }

export async function pauseCampaign(req: BridgeRequest): Promise<BridgeResponse> {
  return notConfigured(req.type, "pauseCampaign");
}

// ─── getCampaignStats ─────────────────────────────────────────────────────────
// Activation (Meta): GET https://graph.facebook.com/v19.0/{campaignId}/insights
//   Params: fields=impressions,clicks,spend,reach&access_token=META_ACCESS_TOKEN
// Return ONLY real stats from the ad platform \u2014 no synthetic data.

export async function getCampaignStats(req: BridgeRequest): Promise<BridgeResponse> {
  return notConfigured(req.type, "getCampaignStats");
}
