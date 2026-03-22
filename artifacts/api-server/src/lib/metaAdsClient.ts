/**
 * metaAdsClient.ts — Stub Meta Ads API client
 *
 * No real API calls are made. All functions log the payload and return
 * a fake success response. Wire up META_ADS_ACCESS_TOKEN and
 * META_ADS_ACCOUNT_ID env vars to activate when ready.
 */

export interface MetaCampaign {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
  daily_budget: number; // in cents
  objective: string;
  created_at: string;
}

export interface MetaAdGroup {
  id: string;
  campaign_id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DELETED";
  bid_amount: number; // in cents
  targeting: Record<string, unknown>;
}

export interface MetaAdResponse {
  ok: boolean;
  id?: string;
  error?: string;
  stub: true;
}

const BASE_URL = "https://graph.facebook.com/v19.0";
const accessToken = process.env.META_ADS_ACCESS_TOKEN;
const accountId   = process.env.META_ADS_ACCOUNT_ID;

export function isConfigured(): boolean {
  return !!(accessToken && accountId);
}

/**
 * Stub: Create a Meta Ads campaign.
 * When real credentials are added, replace body with actual Graph API call.
 */
export async function createCampaign(
  params: Pick<MetaCampaign, "name" | "objective" | "daily_budget">
): Promise<MetaAdResponse> {
  console.log("[MetaAdsClient] createCampaign — STUB", {
    endpoint: `${BASE_URL}/act_${accountId}/campaigns`,
    payload: params,
    note: "Set META_ADS_ACCESS_TOKEN and META_ADS_ACCOUNT_ID to go live",
  });
  return { ok: true, id: `stub_campaign_${Date.now()}`, stub: true };
}

/**
 * Stub: Pause a Meta Ads campaign.
 */
export async function pauseCampaign(campaignId: string): Promise<MetaAdResponse> {
  console.log("[MetaAdsClient] pauseCampaign — STUB", { campaignId });
  return { ok: true, id: campaignId, stub: true };
}

/**
 * Stub: Get campaign status.
 */
export async function getStatus(campaignId: string): Promise<MetaAdResponse & { status?: string }> {
  console.log("[MetaAdsClient] getStatus — STUB", { campaignId });
  return { ok: true, id: campaignId, status: "PAUSED", stub: true };
}
