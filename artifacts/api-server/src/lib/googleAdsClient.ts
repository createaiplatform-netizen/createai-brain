/**
 * googleAdsClient.ts — Stub Google Ads API client
 *
 * No real API calls are made. All functions log the payload and return
 * a fake success response. Wire up GOOGLE_ADS_DEVELOPER_TOKEN and
 * GOOGLE_ADS_CUSTOMER_ID env vars to activate when ready.
 */

export interface GoogleCampaign {
  id: string;
  name: string;
  status: "ENABLED" | "PAUSED" | "REMOVED";
  daily_budget_micros: number; // 1 USD = 1_000_000 micros
  advertising_channel_type: "SEARCH" | "DISPLAY" | "VIDEO" | "SHOPPING";
  start_date: string; // YYYY-MM-DD
  end_date?: string;
}

export interface GoogleAdGroup {
  id: string;
  campaign_id: string;
  name: string;
  status: "ENABLED" | "PAUSED" | "REMOVED";
  cpc_bid_micros: number;
  type: "SEARCH_STANDARD" | "DISPLAY_STANDARD";
}

export interface GoogleAdResponse {
  ok: boolean;
  resource_name?: string;
  error?: string;
  stub: true;
}

const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const customerId     = process.env.GOOGLE_ADS_CUSTOMER_ID;
const BASE_URL       = "https://googleads.googleapis.com/v16";

export function isConfigured(): boolean {
  return !!(developerToken && customerId);
}

/**
 * Stub: Create a Google Ads campaign.
 * When real credentials are added, replace body with actual Google Ads API call.
 */
export async function createCampaign(
  params: Pick<GoogleCampaign, "name" | "advertising_channel_type" | "daily_budget_micros">
): Promise<GoogleAdResponse> {
  console.log("[GoogleAdsClient] createCampaign — STUB", {
    endpoint: `${BASE_URL}/customers/${customerId}/campaigns:mutate`,
    payload: params,
    note: "Set GOOGLE_ADS_DEVELOPER_TOKEN and GOOGLE_ADS_CUSTOMER_ID to go live",
  });
  return { ok: true, resource_name: `customers/${customerId}/campaigns/stub_${Date.now()}`, stub: true };
}

/**
 * Stub: Pause a Google Ads campaign.
 */
export async function pauseCampaign(campaignId: string): Promise<GoogleAdResponse> {
  console.log("[GoogleAdsClient] pauseCampaign — STUB", { campaignId });
  return { ok: true, resource_name: `customers/${customerId}/campaigns/${campaignId}`, stub: true };
}

/**
 * Stub: Get campaign status.
 */
export async function getStatus(campaignId: string): Promise<GoogleAdResponse & { status?: string }> {
  console.log("[GoogleAdsClient] getStatus — STUB", { campaignId });
  return { ok: true, resource_name: `customers/${customerId}/campaigns/${campaignId}`, status: "PAUSED", stub: true };
}
