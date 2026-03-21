/**
 * Store Submission Engine — CreateAI Brain API
 * Automated submission to multiple app distribution channels.
 * Route: /api/store
 */

import { Router, Request, Response } from "express";
import { createReadStream, existsSync, readdirSync, statSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { workspaceRoot } from "../utils/serverPaths.js";

const execAsync = promisify(exec);
const router = Router();

const BASE_DIR = join(workspaceRoot(), "artifacts", "createai-brain");
const EXT_DIR = join(BASE_DIR, "chrome-extension");
const ICONS_DIR = join(BASE_DIR, "public", "icons");
const DIST_DIR = join(BASE_DIR, "dist", "public");

// ── GET /api/store — Distribution channel status dashboard ─────────────────
router.get("/", (_req: Request, res: Response) => {
  const channels = [
    {
      id: "pwa",
      name: "Progressive Web App",
      type: "web",
      status: "ACTIVE",
      description: "Installable on any device via browser. No approval required.",
      installUrl: "/install.html",
      iconUrl: "/icons/icon-192.png",
      notes: [
        "iOS: Safari → Share → Add to Home Screen",
        "Android: Chrome → Menu → Add to Home Screen",
        "Desktop: Chrome/Edge install button in address bar",
      ],
    },
    {
      id: "chrome",
      name: "Chrome Web Store",
      type: "browser-extension",
      status: process.env.CHROME_WS_EXTENSION_ID ? "CONFIGURED" : "READY_TO_SUBMIT",
      description: "Chrome Extension + Side Panel app. 3B+ Chrome users worldwide.",
      storeUrl: process.env.CHROME_WS_EXTENSION_ID
        ? `https://chrome.google.com/webstore/detail/${process.env.CHROME_WS_EXTENSION_ID}`
        : null,
      requiredSecrets: ["CHROME_WS_CLIENT_ID", "CHROME_WS_CLIENT_SECRET", "CHROME_WS_REFRESH_TOKEN", "CHROME_WS_EXTENSION_ID"],
    },
    {
      id: "apple",
      name: "Apple App Store",
      type: "native",
      status: process.env.APPLE_ID ? "CONFIGURED" : "AWAITING_CREDENTIALS",
      description: "Native iOS/iPadOS app via Capacitor. Requires Mac + Xcode for build.",
      storeUrl: null,
      bundleId: "com.lakesidetrinity.createaibrain",
      requiredSecrets: ["APPLE_ID", "APPLE_APP_SPECIFIC_PASS", "APPLE_TEAM_ID", "MATCH_GIT_URL", "MATCH_PASSWORD"],
      buildTool: "fastlane",
    },
    {
      id: "google-play",
      name: "Google Play Store",
      type: "native",
      status: process.env.GOOGLE_PLAY_KEY_JSON ? "CONFIGURED" : "AWAITING_CREDENTIALS",
      description: "Android native app via Capacitor + AAB. Requires JDK 17 for build.",
      storeUrl: null,
      packageId: "com.lakesidetrinity.createaibrain",
      requiredSecrets: ["GOOGLE_PLAY_KEY_JSON", "ANDROID_KEYSTORE_BASE64", "ANDROID_KEYSTORE_PASS", "ANDROID_KEY_PASS"],
      buildTool: "fastlane",
    },
    {
      id: "samsung-galaxy",
      name: "Samsung Galaxy Store",
      type: "pwa",
      status: "READY_TO_SUBMIT",
      description: "PWA submission to Samsung Galaxy Store. Accepts hosted web apps directly.",
      submissionUrl: "https://seller.samsungapps.com",
      requiredSecrets: ["SAMSUNG_SELLER_ID", "SAMSUNG_SELLER_SECRET"],
      notes: [
        "1. Register at seller.samsungapps.com",
        "2. Add New App → Web App → Enter your production URL",
        "3. Upload icons (512x512) and screenshots",
        "4. Submit for review (typically 1-3 days)",
      ],
    },
    {
      id: "amazon-appstore",
      name: "Amazon Appstore",
      type: "webapp",
      status: "READY_TO_SUBMIT",
      description: "Amazon Web App Tester accepts hosted PWAs. Reaches Amazon Fire devices + Android.",
      submissionUrl: "https://developer.amazon.com/apps-and-games/console/apps/list.html",
      requiredSecrets: ["AMAZON_CLIENT_ID", "AMAZON_CLIENT_SECRET"],
      notes: [
        "1. Register at developer.amazon.com ($0 free)",
        "2. Create new app → Web App → Enter your production URL",
        "3. Amazon tests compatibility automatically",
        "4. Submit for review (1-5 business days)",
      ],
    },
    {
      id: "microsoft-store",
      name: "Microsoft Store",
      type: "pwa",
      status: "READY_TO_SUBMIT",
      description: "PWA submission to Microsoft Store via PWABuilder. Reaches all Windows 10/11 users.",
      submissionUrl: "https://www.microsoft.com/en-us/p/createai-brain",
      notes: [
        "1. Go to pwabuilder.com → Enter production URL",
        "2. Download Windows package",
        "3. Submit to Microsoft Partner Center (free for PWAs)",
        "4. Review typically 1-2 business days",
      ],
    },
  ];

  const active = channels.filter((c) => c.status === "ACTIVE" || c.status === "CONFIGURED").length;

  res.json({
    platform: "CreateAI Brain Distribution Engine v1.0",
    totalChannels: channels.length,
    activeChannels: active,
    productionUrl: process.env.BRAND_DOMAIN || "Deploy to get production URL",
    channels,
    automationStatus: {
      githubActions: existsSync(join(BASE_DIR, "..", "..", ".github", "workflows", "app-store-submit.yml")),
      fastlane: existsSync(join(BASE_DIR, "fastlane", "Fastfile")),
      capacitorConfig: existsSync(join(BASE_DIR, "capacitor.config.ts")),
      twaManifest: existsSync(join(BASE_DIR, "twa-manifest.json")),
      chromeExtension: existsSync(join(EXT_DIR, "manifest.json")),
      pwaManifest: existsSync(join(BASE_DIR, "public", "manifest.json")),
      serviceWorker: existsSync(join(BASE_DIR, "public", "sw.js")),
      allIcons: existsSync(ICONS_DIR) ? readdirSync(ICONS_DIR).filter((f) => f.endsWith(".png")).length : 0,
      allSplashScreens: existsSync(join(BASE_DIR, "public", "splash"))
        ? readdirSync(join(BASE_DIR, "public", "splash")).length : 0,
    },
  });
});

// ── POST /api/store/build-extension — Build Chrome extension zip ──────────
router.post("/build-extension", async (req: Request, res: Response) => {
  try {
    const { stdout, stderr } = await execAsync(
      "node scripts/build-chrome-extension.js",
      { cwd: BASE_DIR, timeout: 30000 }
    );
    res.json({
      success: true,
      message: "Chrome extension packaged",
      output: stdout,
      zipPath: join(BASE_DIR, "createai-brain-chrome-extension.zip"),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/store/submit-chrome — Submit to Chrome Web Store API ─────────
router.post("/submit-chrome", async (req: Request, res: Response) => {
  const clientId = process.env.CHROME_WS_CLIENT_ID;
  const clientSecret = process.env.CHROME_WS_CLIENT_SECRET;
  const refreshToken = process.env.CHROME_WS_REFRESH_TOKEN;
  const extensionId = process.env.CHROME_WS_EXTENSION_ID;

  if (!clientId || !clientSecret || !refreshToken || !extensionId) {
    return res.status(400).json({
      success: false,
      error: "Chrome Web Store credentials not configured",
      required: ["CHROME_WS_CLIENT_ID", "CHROME_WS_CLIENT_SECRET", "CHROME_WS_REFRESH_TOKEN", "CHROME_WS_EXTENSION_ID"],
      instructions: "Add these as Replit Secrets, then call this endpoint again",
    });
  }

  try {
    // Get OAuth token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const { access_token, error } = await tokenRes.json() as any;
    if (!access_token) {
      return res.status(401).json({ success: false, error: "OAuth failed", details: error });
    }

    // Build the extension zip first
    await execAsync("node scripts/build-chrome-extension.js", {
      cwd: BASE_DIR, timeout: 30000
    });

    const zipPath = join(BASE_DIR, "createai-brain-chrome-extension.zip");
    if (!existsSync(zipPath)) {
      return res.status(500).json({ success: false, error: "Extension zip not found after build" });
    }

    const { readFileSync } = await import("fs");
    const zipData = readFileSync(zipPath);

    // Upload to Chrome Web Store
    const uploadRes = await fetch(
      `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${extensionId}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "x-goog-api-version": "2",
        },
        body: zipData,
      }
    );
    const uploadData = await uploadRes.json() as any;

    if (uploadData.uploadState === "FAILURE") {
      return res.status(400).json({ success: false, error: "Upload failed", details: uploadData });
    }

    // Publish to all users
    const publishRes = await fetch(
      `https://www.googleapis.com/chromewebstore/v1.1/items/${extensionId}/publish`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "x-goog-api-version": "2",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target: "default" }),
      }
    );
    const publishData = await publishRes.json() as any;

    res.json({
      success: true,
      channel: "Chrome Web Store",
      extensionId,
      uploadState: uploadData.uploadState,
      publishStatus: publishData.status,
      storeUrl: `https://chrome.google.com/webstore/detail/${extensionId}`,
      message: "✅ Chrome extension uploaded and submitted for publication",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/store/pwa-audit — PWA compliance audit ──────────────────────
router.get("/pwa-audit", (_req: Request, res: Response) => {
  const checks = [
    { check: "manifest.json exists",     pass: existsSync(join(BASE_DIR, "public", "manifest.json")) },
    { check: "service worker (sw.js)",   pass: existsSync(join(BASE_DIR, "public", "sw.js")) },
    { check: "offline page",             pass: existsSync(join(BASE_DIR, "public", "offline.html")) },
    { check: "install page",             pass: existsSync(join(BASE_DIR, "public", "install.html")) },
    { check: "privacy policy",           pass: existsSync(join(BASE_DIR, "public", "privacy-policy.html")) },
    { check: "terms of service",         pass: existsSync(join(BASE_DIR, "public", "terms.html")) },
    { check: "icon-192.png",             pass: existsSync(join(ICONS_DIR, "icon-192.png")) },
    { check: "icon-512.png",             pass: existsSync(join(ICONS_DIR, "icon-512.png")) },
    { check: "maskable icon",            pass: existsSync(join(ICONS_DIR, "icon-maskable-512.png")) },
    { check: "apple-touch-icon (180)",   pass: existsSync(join(ICONS_DIR, "icon-180.png")) },
    { check: "assetlinks.json (TWA)",    pass: existsSync(join(BASE_DIR, "public", ".well-known", "assetlinks.json")) },
    { check: "AASA (iOS universal)",     pass: existsSync(join(BASE_DIR, "public", ".well-known", "apple-app-site-association")) },
    { check: "capacitor.config.ts",      pass: existsSync(join(BASE_DIR, "capacitor.config.ts")) },
    { check: "twa-manifest.json",        pass: existsSync(join(BASE_DIR, "twa-manifest.json")) },
    { check: "fastlane/Fastfile",        pass: existsSync(join(BASE_DIR, "fastlane", "Fastfile")) },
    { check: "github actions workflow",  pass: existsSync(join(BASE_DIR, "..", "..", ".github", "workflows", "app-store-submit.yml")) },
    { check: "chrome extension",         pass: existsSync(join(EXT_DIR, "manifest.json")) },
    { check: "splash screens (11)",      pass: existsSync(join(BASE_DIR, "public", "splash")) && readdirSync(join(BASE_DIR, "public", "splash")).length >= 11 },
    { check: "browserconfig.xml",        pass: existsSync(join(BASE_DIR, "public", "browserconfig.xml")) },
    { check: "app store metadata",       pass: existsSync(join(BASE_DIR, "app-store-submission", "metadata.json")) },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  const grade = score >= 95 ? "A+" : score >= 85 ? "A" : score >= 75 ? "B" : score >= 65 ? "C" : "F";

  res.json({
    engine: "PWA & App Store Audit Engine v1.0",
    score: `${score}/100`,
    grade,
    passed,
    total: checks.length,
    checks,
    readyFor: {
      pwaInstall: passed >= 8,
      chromeWebStore: existsSync(join(EXT_DIR, "manifest.json")),
      googlePlay: existsSync(join(BASE_DIR, "twa-manifest.json")),
      appleAppStore: existsSync(join(BASE_DIR, "fastlane", "Fastfile")),
      samsungGalaxyStore: passed >= 8,
      amazonAppstore: passed >= 5,
      microsoftStore: passed >= 8,
    },
  });
});

// ── POST /api/store/trigger-github-action — Trigger GitHub Actions workflow ─
router.post("/trigger-github-action", async (req: Request, res: Response) => {
  const { target = "both", githubToken, repo } = req.body as any;
  const token = githubToken || process.env.GITHUB_TOKEN;
  const repoPath = repo || process.env.GITHUB_REPO;

  if (!token || !repoPath) {
    return res.status(400).json({
      success: false,
      error: "GitHub token and repo not configured",
      required: { githubToken: "Your GitHub personal access token", repo: "owner/repo-name" },
    });
  }

  try {
    const triggerRes = await fetch(
      `https://api.github.com/repos/${repoPath}/actions/workflows/app-store-submit.yml/dispatches`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: { target },
        }),
      }
    );

    if (triggerRes.status === 204) {
      res.json({
        success: true,
        message: `GitHub Actions workflow triggered for target: ${target}`,
        workflowUrl: `https://github.com/${repoPath}/actions`,
      });
    } else {
      const err = await triggerRes.text();
      res.status(400).json({ success: false, error: "Workflow trigger failed", details: err });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export { router as storeSubmissionRouter };
