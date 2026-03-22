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
import { launchNetwork, launchAllConnectedNetworks, getAllCampaignStatuses } from "../services/networkApiClients.js";
import { generateCreative, generateAllCreatives, getCreative, getAllCreatives, getCreativesForNetwork } from "../services/adCreativeEngine.js";
import { generateAllTrackingLinks, getTrackingLinksForNetwork, getOfferCatalog } from "../services/adTrackingLinks.js";

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

// ─── POST /api/ads/credentials/set  (auto-launches when network becomes connected)

router.post("/credentials/set", async (req: Request, res: Response) => {
  const { key, value } = req.body ?? {};
  if (!key || !value) { res.status(400).json({ ok: false, error: "key and value required" }); return; }

  const allCreds = AD_NETWORKS.flatMap(n => n.credentials);
  const credDef  = allCreds.find(c => c.key === key);
  if (!credDef) { res.status(400).json({ ok: false, error: `Unknown credential key: ${key}` }); return; }

  setAdCredential(key, value.trim());

  // Check if the network is now fully connected
  const net = AD_NETWORKS.find(n => n.credentials.some(c => c.key === key));
  let networkNowConnected = false;
  let launchResult: Awaited<ReturnType<typeof launchNetwork>> | null = null;

  if (net) {
    const st = getNetworkStatus(net);
    networkNowConnected = st.connected;
    if (networkNowConnected) {
      logDeployment(net.id, "credentials_set", "Primary credentials connected — auto-launching campaigns");
      // AUTO-LAUNCH: fire campaigns immediately without waiting for user input
      launchResult = await launchNetwork(net.id);
      const logMsg = launchResult.ok
        ? `Auto-launch: ${launchResult.launched} campaigns created (PAUSED) — activate at ${launchResult.activateUrl}`
        : `Auto-launch attempted but API returned error: ${launchResult.error ?? "unknown"}`;
      logDeployment(net.id, launchResult.ok ? "launched" : "launch_error", logMsg);
    }
  }

  res.json({
    ok:                true,
    message:           networkNowConnected && launchResult?.ok
      ? `${credDef.label} saved. ${net!.name} is CONNECTED — ${launchResult.launched} campaigns auto-created and PAUSED. Go to ${launchResult.activateUrl} and click Activate to begin ad spend.`
      : networkNowConnected
        ? `${credDef.label} saved. ${net!.name} connected — campaign launch attempted (${launchResult?.error ?? "check launch status"}).`
        : `${credDef.label} saved. Enter remaining credentials for full ${net?.name ?? ""} connectivity.`,
    networkId:          net?.id,
    networkConnected:   networkNowConnected,
    networkName:        net?.name,
    autoLaunched:       launchResult?.ok ?? false,
    launchResult:       launchResult ?? null,
  });
});

// ─── POST /api/ads/launch/:networkId  (manual launch trigger) ─────────────────

router.post("/launch/:networkId", async (req: Request, res: Response) => {
  const networkId = String(req.params["networkId"] ?? "");
  const net = AD_NETWORKS.find(n => n.id === networkId);
  if (!net) { res.status(404).json({ ok: false, error: `Network '${networkId}' not found` }); return; }

  const st = getNetworkStatus(net);
  if (!st.connected) {
    res.status(400).json({
      ok:    false,
      error: `${net.name} not connected. Enter primary credentials first.`,
      credentialFields: net.credentials.map(c => ({ key: c.key, label: c.label, set: !!(getAdCredential(c.key)) })),
    });
    return;
  }

  logDeployment(networkId, "manual_launch", `Manual launch triggered for ${net.campaigns.length} campaigns`);
  const result = await launchNetwork(networkId);
  logDeployment(networkId, result.ok ? "launched" : "launch_error", result.ok ? `${result.launched} campaigns created` : (result.error ?? "unknown error"));

  res.json({ ok: result.ok, ...result });
});

// ─── POST /api/ads/launch/all  (launch all connected networks at once) ─────────

router.post("/launch/all", async (req: Request, res: Response) => {
  const results = await launchAllConnectedNetworks();
  const launched = results.filter(r => r.ok).length;
  const totalCampaigns = results.reduce((s, r) => s + r.launched, 0);

  res.json({
    ok:              launched > 0,
    networksLaunched: launched,
    networksTotal:   results.length,
    totalCampaigns,
    results,
    nextStep:        launched > 0
      ? `${totalCampaigns} campaigns created across ${launched} networks. Visit each network dashboard to activate spend. Links provided per network in the results array.`
      : "No networks are fully connected yet. Enter credentials in the Networks tab.",
  });
});

// ─── GET /api/ads/campaigns/deployed  (deployment status of all campaigns) ────

router.get("/campaigns/deployed", (_req: Request, res: Response) => {
  const statuses  = getAllCampaignStatuses();
  const created   = statuses.filter(s => s.status === "created").length;
  const errored   = statuses.filter(s => s.status === "error").length;
  const queued    = AD_NETWORKS.reduce((s, n) => s + n.campaigns.length, 0) - statuses.length;

  res.json({
    ok:       true,
    created,
    errored,
    queued,
    campaigns: statuses,
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

// ─── GET /api/ads/creatives ───────────────────────────────────────────────────
// All pre-generated ad creatives across every campaign

router.get("/creatives", (_req: Request, res: Response) => {
  const creatives = getAllCreatives();
  res.json({ ok: true, total: creatives.length, creatives });
});

// ─── GET /api/ads/creatives/:networkId ────────────────────────────────────────

router.get("/creatives/:networkId", (req: Request, res: Response) => {
  const networkId = String(req.params["networkId"] ?? "");
  const creatives = getCreativesForNetwork(networkId);
  res.json({ ok: true, networkId, total: creatives.length, creatives });
});

// ─── POST /api/ads/creatives/generate ────────────────────────────────────────
// Trigger AI generation for one or all campaigns

router.post("/creatives/generate", async (req: Request, res: Response) => {
  const { campaignId, networkId, forceRegenerate } = req.body as { campaignId?: string; networkId?: string; forceRegenerate?: boolean };

  if (campaignId) {
    const allCampaigns = AD_NETWORKS.flatMap(n => n.campaigns);
    const campaign = allCampaigns.find(c => c.id === campaignId);
    if (!campaign) { res.status(404).json({ ok: false, error: `Campaign '${campaignId}' not found` }); return; }
    try {
      const creative = await generateCreative(campaign);
      res.json({ ok: true, creative });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err).slice(0, 200) });
    }
    return;
  }

  if (networkId) {
    const net = AD_NETWORKS.find(n => n.id === networkId);
    if (!net) { res.status(404).json({ ok: false, error: `Network '${networkId}' not found` }); return; }
    const results: { campaignId: string; ok: boolean; error?: string }[] = [];
    for (const campaign of net.campaigns) {
      if (!forceRegenerate && getCreative(campaign.id)) { results.push({ campaignId: campaign.id, ok: true }); continue; }
      try { await generateCreative(campaign); results.push({ campaignId: campaign.id, ok: true }); }
      catch (err) { results.push({ campaignId: campaign.id, ok: false, error: String(err).slice(0, 100) }); }
      await new Promise(r => setTimeout(r, 400));
    }
    res.json({ ok: true, networkId, results });
    return;
  }

  // Generate all
  try {
    const result = await generateAllCreatives(!!forceRegenerate);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err).slice(0, 200) });
  }
});

// ─── GET /api/ads/tracking-links ─────────────────────────────────────────────
// All UTM-tagged tracking links for every campaign + offer

router.get("/tracking-links", (_req: Request, res: Response) => {
  const links = generateAllTrackingLinks();
  const offers = getOfferCatalog();
  res.json({ ok: true, total: links.length, links, offers });
});

// ─── GET /api/ads/tracking-links/:networkId ───────────────────────────────────

router.get("/tracking-links/:networkId", (req: Request, res: Response) => {
  const networkId = String(req.params["networkId"] ?? "");
  const links = getTrackingLinksForNetwork(networkId);
  res.json({ ok: true, networkId, total: links.length, links });
});

// ─── GET /api/ads/dashboard — HTML campaign manager status surface ─────────────
router.get("/dashboard", (_req: Request, res: Response) => {
  void getAllNetworkStatuses(); // consumed by getNetworkStatus per-card
  const liveCount = getLiveCount();
  void getAggregateReport(); // available at /api/ads/reporting

  const networksHtml = AD_NETWORKS.map(net => {
    const st         = getNetworkStatus(net);
    const credsFilled = st.credentialsSet;
    const credsTotal  = st.credentialsTotal;
    const pct         = credsTotal > 0 ? Math.round((credsFilled / credsTotal) * 100) : 0;
    const statusColor = st.connected ? "#34d399" : pct > 0 ? "#fbbf24" : "#64748b";
    const statusLabel = st.connected ? "Live" : pct > 0 ? `${credsFilled}/${credsTotal} creds` : "Pending";

    return `<div class="net-card">
      <div class="nc-top">
        <span class="nc-icon">${net.icon}</span>
        <div class="nc-body">
          <div class="nc-name">${net.name}</div>
          <div class="nc-platforms">${net.platforms.join(" · ")}</div>
        </div>
        <span class="nc-badge" style="color:${statusColor};background:${statusColor}14;border:1px solid ${statusColor}30">${statusLabel}</span>
      </div>
      <div class="nc-bar-wrap" title="${pct}% credentials filled">
        <div class="nc-bar" style="width:${pct}%;background:${statusColor}"></div>
      </div>
      <div class="nc-meta">
        ${net.campaigns.length} pre-built campaigns · Min $${net.minBudgetDay}/day · ${net.setupTime}
        <a class="nc-link" href="${net.setupUrl}" target="_blank" rel="noopener">Setup →</a>
      </div>
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Campaign Manager — CreateAI Brain</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#020617;--s2:#111827;--s3:#1e293b;--line:#1e293b;
          --t1:#e2e8f0;--t2:#94a3b8;--t3:#64748b;--t4:#475569;--ind:#6366f1;--ind2:#818cf8;--g:#34d399;--w:#fbbf24;}
    html,body{background:var(--bg);color:var(--t1);font-family:'Inter',-apple-system,sans-serif;font-size:14px;min-height:100vh;-webkit-font-smoothing:antialiased}
    a{color:var(--ind2);text-decoration:none}
    .skip-link{position:absolute;top:-100px;left:1rem;background:var(--ind);color:#fff;padding:.4rem 1rem;border-radius:6px;font-weight:700;z-index:999;transition:top .2s}.skip-link:focus{top:1rem}
    .hdr{border-bottom:1px solid var(--line);padding:0 24px;background:rgba(2,6,23,.97);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
    .hdr-inner{max-width:1240px;margin:0 auto;height:52px;display:flex;align-items:center;gap:14px}
    .logo{font-size:.95rem;font-weight:900;letter-spacing:-.03em}.logo span{color:var(--ind2)}
    .bdg{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;background:rgba(99,102,241,.15);color:var(--ind2);border:1px solid rgba(99,102,241,.3);border-radius:99px;padding:3px 10px}
    .hdr-links{margin-left:auto;display:flex;gap:16px}.hdr-links a{color:var(--t3);font-size:.78rem;font-weight:600;transition:color .15s}.hdr-links a:hover{color:var(--t1)}
    .wrap{max-width:1240px;margin:0 auto;padding:32px 24px}
    .hero{margin-bottom:28px}.hero h1{font-size:1.6rem;font-weight:900;letter-spacing:-.04em;margin-bottom:4px}.hero h1 span{color:var(--ind2)}.hero p{font-size:.85rem;color:var(--t3)}
    .kpi-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:28px}
    .kpi{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:16px 20px}
    .kpi-lbl{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--t4);margin-bottom:6px}
    .kpi-val{font-size:1.5rem;font-weight:900;color:var(--ind2);letter-spacing:-.04em}
    .kpi.green .kpi-val{color:var(--g)}
    .step-note{padding:14px 18px;background:rgba(99,102,241,.06);border:1px solid rgba(99,102,241,.2);border-radius:12px;margin-bottom:24px;font-size:.8rem;color:var(--t3);line-height:1.6}
    .step-note strong{color:var(--t2)}
    .nets-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
    .net-card{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:18px;transition:border-color .2s}.net-card:hover{border-color:rgba(99,102,241,.3)}
    .nc-top{display:flex;align-items:center;gap:12px;margin-bottom:12px}
    .nc-icon{font-size:1.4rem;flex-shrink:0}
    .nc-body{flex:1}.nc-name{font-size:.88rem;font-weight:800;margin-bottom:2px}.nc-platforms{font-size:.68rem;color:var(--t3)}
    .nc-badge{font-size:.62rem;font-weight:700;border-radius:99px;padding:3px 10px;white-space:nowrap}
    .nc-bar-wrap{height:4px;background:var(--s3);border-radius:2px;margin-bottom:8px;overflow:hidden}
    .nc-bar{height:100%;border-radius:2px;transition:width .6s ease}
    .nc-meta{font-size:.68rem;color:var(--t4);display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .nc-link{color:var(--ind2);font-size:.68rem;margin-left:auto}
    footer{border-top:1px solid var(--line);padding:20px 24px;text-align:center;font-size:.68rem;color:var(--t4);margin-top:24px}
    @media(max-width:640px){.nets-grid{grid-template-columns:1fr}.wrap{padding:20px 16px}}
  </style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="hdr" role="banner">
  <div class="hdr-inner">
    <a class="logo" href="/hub">CreateAI <span>Brain</span></a>
    <span class="bdg">Campaign Manager</span>
    <nav class="hdr-links" aria-label="Navigation">
      <a href="/hub">Hub</a>
      <a href="/api/advertising/hub">Advertising Hub</a>
      <a href="/api/ads/networks">JSON</a>
    </nav>
  </div>
</header>
<main id="main" class="wrap">
  <div class="hero">
    <h1>Campaign <span>Manager</span></h1>
    <p>Universal ad campaign orchestrator — ${AD_NETWORKS.length} networks, ${AD_NETWORKS.reduce((s, n) => s + n.campaigns.length, 0)} pre-built campaigns. Connect credentials to auto-deploy.</p>
  </div>

  <div class="kpi-row" role="list" aria-label="Campaign metrics">
    <div class="kpi green" role="listitem"><div class="kpi-lbl">Live Networks</div><div class="kpi-val">${liveCount}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">Total Networks</div><div class="kpi-val">${AD_NETWORKS.length}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">Pre-Built Campaigns</div><div class="kpi-val">${AD_NETWORKS.reduce((s, n) => s + n.campaigns.length, 0)}</div></div>
    <div class="kpi" role="listitem"><div class="kpi-lbl">Connected</div><div class="kpi-val">${liveCount}/${AD_NETWORKS.length}</div></div>
  </div>

  <div class="step-note" role="note">
    <strong>To launch campaigns:</strong> Enter API credentials in the <a href="/api/credentials/dashboard">Credentials Hub</a> for each network.
    Once credentials are set, campaigns deploy automatically. Each network has setup instructions with direct links to ad dashboards.
  </div>

  <div class="nets-grid" role="list" aria-label="Ad networks">${networksHtml}</div>
</main>
<footer role="contentinfo">CreateAI Brain · Universal Campaign Manager · Lakeside Trinity LLC</footer>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.send(html);
});

export default router;
