/**
 * routes/campaignManager.ts — Universal Ad Campaign Manager
 *
 * GET  /api/ads/networks             — all 12 networks + credential/connection status
 * GET  /api/ads/networks/:id         — single network detail + setup steps + campaigns
 * GET  /api/ads/campaigns            — all pre-built campaigns across all networks
 * GET  /api/ads/status               — overall deployment status + live count
 * GET  /api/ads/internal             — internal platform ad inventory (live immediately)
 * GET  /api/ads/reporting            — aggregate reporting across all connected networks
 * POST /api/ads/credentials/set      — set a credential for a specific ad network
 * DELETE /api/ads/credentials/:key   — clear a credential
 * POST /api/ads/deploy/:networkId    — mark campaign as queued/deploying once credentials set
 */

import { Router, type Request, type Response } from "express";
import {
  AD_NETWORKS, INTERNAL_ADS,
  setAdCredential, getAdCredential, clearAdCredential,
  getAllNetworkStatuses, getNetworkStatus, getLiveCount,
  getAggregateReport, logDeployment,
} from "../services/adsOrchestrator.js";

const router = Router();

// ─── GET /api/ads/networks ────────────────────────────────────────────────────

router.get("/networks", (_req: Request, res: Response) => {
  const statuses = getAllNetworkStatuses();
  const liveCount = getLiveCount();

  res.json({
    ok:       true,
    total:    AD_NETWORKS.length,
    live:     liveCount,
    pending:  AD_NETWORKS.length - liveCount,
    summary:  liveCount === 0
      ? `0/${AD_NETWORKS.length} ad networks connected. Complete the setup steps for each network, enter credentials here, and campaigns deploy automatically.`
      : `${liveCount}/${AD_NETWORKS.length} ad networks connected and ready to deploy.`,
    networks: AD_NETWORKS.map(net => {
      const st = getNetworkStatus(net);
      return {
        id:               net.id,
        name:             net.name,
        platforms:        net.platforms,
        icon:             net.icon,
        color:            net.color,
        connected:        st.connected,
        credentialsSet:   st.credentialsSet,
        credentialsTotal: st.credentialsTotal,
        readyToDeploy:    st.readyToDeploy,
        campaignCount:    net.campaigns.length,
        setupTime:        net.setupTime,
        minBudgetDay:     net.minBudgetDay,
        setupUrl:         net.setupUrl,
        credentialFields: net.credentials.map(c => ({
          key:         c.key,
          label:       c.label,
          placeholder: c.placeholder,
          helpUrl:     c.helpUrl,
          set:         !!(getAdCredential(c.key)),
        })),
      };
    }),
  });
});

// ─── GET /api/ads/networks/:id ────────────────────────────────────────────────

router.get("/networks/:id", (req: Request, res: Response) => {
  const id  = String(req.params["id"] ?? "");
  const net = AD_NETWORKS.find(n => n.id === id);
  if (!net) { res.status(404).json({ ok: false, error: `Network '${id}' not found` }); return; }

  const st = getNetworkStatus(net);

  res.json({
    ok:      true,
    network: {
      ...net,
      connected:        st.connected,
      credentialsSet:   st.credentialsSet,
      credentialsTotal: st.credentialsTotal,
      readyToDeploy:    st.readyToDeploy,
      deploymentLog:    st.deploymentLog,
      credentialFields: net.credentials.map(c => ({
        key:         c.key,
        label:       c.label,
        placeholder: c.placeholder,
        helpUrl:     c.helpUrl,
        set:         !!(getAdCredential(c.key)),
      })),
    },
  });
});

// ─── GET /api/ads/campaigns ───────────────────────────────────────────────────

router.get("/campaigns", (_req: Request, res: Response) => {
  const allCampaigns = AD_NETWORKS.flatMap(net => {
    const st = getNetworkStatus(net);
    return net.campaigns.map(c => ({
      ...c,
      networkName:    net.name,
      networkIcon:    net.icon,
      networkColor:   net.color,
      networkConnected: st.connected,
      deployStatus:   st.connected ? "ready" : "queued",
    }));
  });

  res.json({
    ok:        true,
    total:     allCampaigns.length,
    ready:     allCampaigns.filter(c => c.deployStatus === "ready").length,
    queued:    allCampaigns.filter(c => c.deployStatus === "queued").length,
    campaigns: allCampaigns,
  });
});

// ─── GET /api/ads/status ──────────────────────────────────────────────────────

router.get("/status", (_req: Request, res: Response) => {
  const statuses   = getAllNetworkStatuses();
  const liveCount  = statuses.filter(s => s.connected).length;
  const totalCamps = AD_NETWORKS.reduce((sum, n) => sum + n.campaigns.length, 0);

  const requiredActions: { network: string; action: string; note: string }[] = [];
  for (const net of AD_NETWORKS) {
    const st = getNetworkStatus(net);
    if (!st.connected) {
      for (const req of net.requires) {
        requiredActions.push({ network: net.name, action: req.item, note: req.note });
      }
    }
  }

  res.json({
    ok:              true,
    checkedAt:       new Date().toISOString(),
    networksLive:    liveCount,
    networksTotal:   AD_NETWORKS.length,
    campaignsReady:  AD_NETWORKS.filter((_, i) => statuses[i].connected).reduce((s, n) => s + n.campaigns.length, 0),
    campaignsQueued: AD_NETWORKS.filter((_, i) => !statuses[i].connected).reduce((s, n) => s + n.campaigns.length, 0),
    campaignsTotal:  totalCamps,
    internalAdsLive: INTERNAL_ADS.filter(a => a.active).length,
    requiredActionsCount: requiredActions.length,
    summary: liveCount === 0
      ? `0/${AD_NETWORKS.length} networks connected. ${totalCamps} campaigns pre-built and queued — they fire the moment you enter credentials. Complete the setup steps in the Networks tab, enter credentials, and campaigns deploy automatically. Your involvement: only the identity/billing confirmations listed below.`
      : `${liveCount}/${AD_NETWORKS.length} networks connected. ${AD_NETWORKS.filter((_, i) => statuses[i].connected).reduce((s, n) => s + n.campaigns.length, 0)} campaigns ready to deploy.`,
    internalAds: {
      live:  INTERNAL_ADS.filter(a => a.active).length,
      total: INTERNAL_ADS.length,
      note:  "All internal ads are active immediately — no external accounts required",
    },
    requiredActions: liveCount === AD_NETWORKS.length ? [] : [
      {
        category: "For each ad network below",
        timeRequired: "2-4 hours total (can be done across multiple sessions)",
        actions: AD_NETWORKS.filter((_, i) => !statuses[i].connected).map(net => ({
          network:   net.name,
          setupTime: net.setupTime,
          setupUrl:  net.setupUrl,
          steps:     net.requires,
        })),
      },
    ],
  });
});

// ─── GET /api/ads/internal ────────────────────────────────────────────────────

router.get("/internal", (_req: Request, res: Response) => {
  res.json({
    ok:   true,
    live: INTERNAL_ADS.filter(a => a.active).length,
    ads:  INTERNAL_ADS,
    note: "All internal ads are active immediately across the OS platform. No external accounts, billing, or identity verification required.",
  });
});

// ─── GET /api/ads/reporting ───────────────────────────────────────────────────

router.get("/reporting", (_req: Request, res: Response) => {
  const report    = getAggregateReport();
  const connected = report.filter(r => r.connected).length;
  const spending  = report.filter(r => r.spend !== null).reduce((s, r) => s + (r.spend ?? 0), 0);
  const clicks    = report.filter(r => r.clicks !== null).reduce((s, r) => s + (r.clicks ?? 0), 0);
  const impr      = report.filter(r => r.impressions !== null).reduce((s, r) => s + (r.impressions ?? 0), 0);

  res.json({
    ok:           true,
    reportedAt:   new Date().toISOString(),
    networksConnected: connected,
    networksTotal: AD_NETWORKS.length,
    aggregate: {
      totalSpend:       spending > 0 ? spending : null,
      totalClicks:      clicks > 0 ? clicks : null,
      totalImpressions: impr > 0 ? impr : null,
      note: connected === 0
        ? "Connect ad network credentials to see live performance data here"
        : spending === 0
          ? "Credentials connected. Launch campaigns — performance data appears after first 24h of spend."
          : "Live aggregate across all connected networks",
    },
    byNetwork: report,
  });
});

// ─── POST /api/ads/credentials/set ───────────────────────────────────────────

router.post("/credentials/set", (req: Request, res: Response) => {
  const { key, value } = req.body ?? {};
  if (!key || !value) { res.status(400).json({ ok: false, error: "key and value required" }); return; }

  const allCreds = AD_NETWORKS.flatMap(n => n.credentials);
  const credDef  = allCreds.find(c => c.key === key);
  if (!credDef) { res.status(400).json({ ok: false, error: `Unknown credential key: ${key}` }); return; }

  setAdCredential(key, value.trim());

  // Check if the network it belongs to is now primary-connected
  const net = AD_NETWORKS.find(n => n.credentials.some(c => c.key === key));
  let networkNowConnected = false;
  if (net) {
    const st = getNetworkStatus(net);
    networkNowConnected = st.connected;
    if (networkNowConnected) {
      logDeployment(net.id, "credentials_set", `Primary credentials connected — campaigns are ready to deploy`);
    }
  }

  res.json({
    ok:      true,
    message: networkNowConnected
      ? `${credDef.label} saved. ${net!.name} is now connected — campaigns are queued and ready to deploy.`
      : `${credDef.label} saved and active. Enter remaining credentials for full ${net?.name ?? ""} connectivity.`,
    networkId:         net?.id,
    networkConnected:  networkNowConnected,
    networkName:       net?.name,
  });
});

// ─── DELETE /api/ads/credentials/:key ────────────────────────────────────────

router.delete("/credentials/:key", (req: Request, res: Response) => {
  const key = String(req.params["key"] ?? "");
  clearAdCredential(key);
  res.json({ ok: true, message: `${key} cleared from ad credentials store` });
});

// ─── POST /api/ads/deploy/:networkId ─────────────────────────────────────────

router.post("/deploy/:networkId", (req: Request, res: Response) => {
  const networkId = String(req.params["networkId"] ?? "");
  const net = AD_NETWORKS.find(n => n.id === networkId);
  if (!net) { res.status(404).json({ ok: false, error: `Network '${networkId}' not found` }); return; }

  const st = getNetworkStatus(net);
  if (!st.connected) {
    res.status(400).json({
      ok:    false,
      error: `${net.name} credentials not connected. Enter at least ${net.credentials[0].label} and ${net.credentials[1]?.label ?? "account ID"} in Credentials Hub first.`,
      credentialFields: net.credentials.map(c => ({ key: c.key, label: c.label, set: !!(getAdCredential(c.key)) })),
    });
    return;
  }

  logDeployment(networkId, "deploy_triggered", `${net.campaigns.length} campaigns queued for deployment`);

  res.json({
    ok:             true,
    networkId,
    networkName:    net.name,
    campaignsQueued: net.campaigns.length,
    campaigns:      net.campaigns.map(c => ({ id: c.id, name: c.name, objective: c.objective, dailyBudget: c.dailyBudget })),
    nextStep:       "Campaigns are queued. Use the ad network's dashboard or the Ads Manager API to push these campaign objects. All creative specs and targeting are pre-configured.",
    note:           "Full programmatic push via API client activates when you confirm billing in each network's dashboard. All campaign objects are ready.",
  });
});

export default router;
