// CreateAI Brain Chrome Extension — Popup Script

const BASE_URL = "https://createaibrain.app";

// Open full OS
document.getElementById("open-full").addEventListener("click", () => {
  chrome.tabs.create({ url: BASE_URL });
  window.close();
});

// App quick-launch buttons
document.querySelectorAll(".app-btn[data-app]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const appId = btn.getAttribute("data-app");
    chrome.tabs.create({ url: `${BASE_URL}/?app=${appId}` });
    window.close();
  });
});

// Settings
document.getElementById("settings-btn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// Connection status check
async function checkStatus() {
  try {
    const res = await fetch(`${BASE_URL}/api/status`, { 
      signal: AbortSignal.timeout(3000) 
    });
    if (res.ok) {
      document.getElementById("status-dot").style.background = "#10b981";
      document.getElementById("status-text").textContent = "Platform Online";
    } else {
      throw new Error("not ok");
    }
  } catch {
    document.getElementById("status-dot").style.background = "#ef4444";
    document.getElementById("status-text").textContent = "Connecting...";
  }
}

checkStatus();
