// CreateAI Brain Chrome Extension — Background Service Worker

const BASE_URL = "https://createaibrain.app";

// ── Install handler ──────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    // Open onboarding on first install
    await chrome.tabs.create({ url: BASE_URL + "/install.html" });

    // Set up periodic sync alarm (every 60 minutes)
    await chrome.alarms.create("sync", { periodInMinutes: 60 });

    // Store install timestamp
    await chrome.storage.local.set({ 
      installedAt: Date.now(),
      version: chrome.runtime.getManifest().version
    });
  }
});

// ── Keyboard commands ────────────────────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "open_strategy") {
    await chrome.tabs.create({ url: BASE_URL + "/?app=aiStrategy" });
  }
});

// ── Alarm handler (periodic sync) ───────────────────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "sync") {
    try {
      const res = await fetch(BASE_URL + "/api/status");
      const data = await res.json();
      await chrome.storage.local.set({ lastSync: Date.now(), platformStatus: data });
    } catch {
      // Offline — skip
    }
  }
});

// ── Notification click ───────────────────────────────────────────────────────
chrome.notifications.onClicked.addListener(async (notifId) => {
  await chrome.tabs.create({ url: BASE_URL });
});

// ── Message handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_STATUS") {
    chrome.storage.local.get(["lastSync", "platformStatus"]).then(sendResponse);
    return true;
  }
});
