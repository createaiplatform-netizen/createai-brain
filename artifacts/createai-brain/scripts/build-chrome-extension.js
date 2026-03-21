/**
 * build-chrome-extension.js
 * Packages the Chrome extension into a .zip ready for Chrome Web Store upload.
 * Run: node scripts/build-chrome-extension.js
 * 
 * Chrome Web Store Submission:
 * 1. Go to https://chrome.google.com/webstore/devconsole
 * 2. Register as developer ($5 one-time fee)
 * 3. Click "New Item" → Upload the generated .zip file
 * 4. Fill in store listing → Submit for review
 *    Average review time: 1-3 business days
 *
 * Or use the automated API submission below (requires CHROME_WS_CLIENT_ID, 
 * CHROME_WS_CLIENT_SECRET, CHROME_WS_REFRESH_TOKEN env vars)
 */

import { createWriteStream, existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from "fs";
import { join, relative, dirname } from "path";
import { fileURLToPath } from "url";
import { createGzip } from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EXT_SRC = join(ROOT, "chrome-extension");
const ICONS_SRC = join(ROOT, "public", "icons");
const DIST = join(ROOT, "dist-chrome-extension");
const ZIP_OUT = join(ROOT, "createai-brain-chrome-extension.zip");

// ── Copy icons into extension directory ──────────────────────────────────────
async function copyIcons() {
  const iconDir = join(EXT_SRC, "icons");
  if (!existsSync(iconDir)) mkdirSync(iconDir, { recursive: true });

  const iconSizes = [16, 32, 48, 128];
  for (const size of iconSizes) {
    const src = join(ICONS_SRC, `icon-${size}.png`);
    const dst = join(iconDir, `icon-${size}.png`);
    if (existsSync(src)) {
      copyFileSync(src, dst);
      console.log(`  ✅ Copied icon-${size}.png`);
    } else {
      // Fall back to any available icon
      const fallback = join(ICONS_SRC, "icon-192.png");
      if (existsSync(fallback)) {
        copyFileSync(fallback, dst);
        console.log(`  ⚠️ icon-${size}.png missing, using icon-192.png as fallback`);
      }
    }
  }
}

// ── Create zip using JSZip ───────────────────────────────────────────────────
async function createZip() {
  let JSZip;
  try {
    JSZip = (await import("jszip")).default;
  } catch {
    console.log("  Installing jszip...");
    const { execSync } = await import("child_process");
    execSync("npm install jszip", { stdio: "inherit" });
    JSZip = (await import("jszip")).default;
  }

  const zip = new JSZip();

  function addDirectory(dirPath, zipPath = "") {
    const entries = readdirSync(dirPath);
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules") continue;
      const fullPath = join(dirPath, entry);
      const zipEntry = zipPath ? `${zipPath}/${entry}` : entry;
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        addDirectory(fullPath, zipEntry);
      } else {
        const { readFileSync } = await import("fs").catch(() => { throw new Error("fs unavailable") });
        zip.file(zipEntry, readFileSync(fullPath));
        console.log(`  📦 ${zipEntry}`);
      }
    }
  }

  // Can't use async inside sync addDirectory — use simple readFileSync approach
  const { readFileSync } = await import("fs");
  
  function addDir(dirPath, zipPath = "") {
    const entries = readdirSync(dirPath);
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules") continue;
      const fullPath = join(dirPath, entry);
      const zipEntry = zipPath ? `${zipPath}/${entry}` : entry;
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        addDir(fullPath, zipEntry);
      } else {
        zip.file(zipEntry, readFileSync(fullPath));
        console.log(`  📦 ${zipEntry}`);
      }
    }
  }

  addDir(EXT_SRC);

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const { writeFileSync } = await import("fs");
  writeFileSync(ZIP_OUT, zipBuffer);
  console.log(`\n✅ Chrome Extension packaged: ${ZIP_OUT}`);
  console.log(`   Size: ${(zipBuffer.length / 1024).toFixed(1)}KB`);
}

// ── Automated Chrome Web Store API submission ─────────────────────────────────
async function submitToWebStore(zipPath) {
  const clientId     = process.env.CHROME_WS_CLIENT_ID;
  const clientSecret = process.env.CHROME_WS_CLIENT_SECRET;
  const refreshToken = process.env.CHROME_WS_REFRESH_TOKEN;
  const extensionId  = process.env.CHROME_WS_EXTENSION_ID;

  if (!clientId || !clientSecret || !refreshToken) {
    console.log("\n⚠️  Chrome Web Store API credentials not set.");
    console.log("   Set CHROME_WS_CLIENT_ID, CHROME_WS_CLIENT_SECRET, CHROME_WS_REFRESH_TOKEN, CHROME_WS_EXTENSION_ID");
    console.log("   to enable automated submission.\n");
    console.log("   Manual upload: https://chrome.google.com/webstore/devconsole");
    return;
  }

  console.log("\n🚀 Submitting to Chrome Web Store API...");

  // Step 1: Get access token
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
  const { access_token } = await tokenRes.json();
  if (!access_token) { console.error("❌ Failed to get access token"); return; }

  // Step 2: Upload new version
  const { readFileSync } = await import("fs");
  const zipData = readFileSync(zipPath);
  
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
  const uploadData = await uploadRes.json();
  
  if (uploadData.uploadState !== "SUCCESS" && uploadData.uploadState !== "IN_PROGRESS") {
    console.error("❌ Upload failed:", uploadData);
    return;
  }
  console.log("  ✅ Uploaded to Chrome Web Store");

  // Step 3: Publish
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
  const publishData = await publishRes.json();
  console.log("  📢 Publish result:", publishData.status?.join(", "));
  console.log("  ✅ Chrome Web Store submission complete!");
}

async function main() {
  console.log("📦 Building CreateAI Brain Chrome Extension...\n");
  await copyIcons();
  await createZip();
  
  const autoSubmit = process.argv.includes("--submit");
  if (autoSubmit) {
    await submitToWebStore(ZIP_OUT);
  } else {
    console.log("\n💡 To auto-submit to Chrome Web Store:");
    console.log("   node scripts/build-chrome-extension.js --submit");
  }
}

main().catch(console.error);
