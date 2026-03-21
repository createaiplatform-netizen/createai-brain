/**
 * credentialsBridge.ts — In-OS Credential Store
 *
 * Stores marketplace API tokens entered through the OS and injects them
 * directly into process.env so all existing services pick them up
 * without needing Replit Secrets navigation.
 *
 * Storage: JSON file (credentials.store.json) + AES-256-GCM encryption
 * when ENCRYPTION_KEY is set; plaintext dev fallback when not set.
 *
 * On server start, all persisted credentials are loaded and injected
 * into process.env so they are available to all services immediately.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname }                           from "path";
import { fileURLToPath }                           from "url";
import { encrypt, decrypt }                        from "./encryption.js";

const __dir       = dirname(fileURLToPath(import.meta.url));
const STORE_PATH  = join(__dir, "../../credentials.store.json");

// ─── Credential Definitions ───────────────────────────────────────────────────

export interface CredentialDef {
  key:          string;
  label:        string;
  channel:      string;
  description:  string;
  placeholder:  string;
  helpUrl:      string;
  testable:     boolean;
}

export const CREDENTIAL_DEFS: CredentialDef[] = [
  {
    key:         "SHOPIFY_ACCESS_TOKEN",
    label:       "Shopify Access Token",
    channel:     "Shopify",
    description: "Enables automatic product publishing to your Shopify store.",
    placeholder: "shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    helpUrl:     "https://help.shopify.com/en/manual/apps/custom-apps",
    testable:    false,
  },
  {
    key:         "ETSY_API_KEY",
    label:       "Etsy API Key",
    channel:     "Etsy",
    description: "Enables automatic listing creation on Etsy.",
    placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    helpUrl:     "https://www.etsy.com/developers/documentation/getting_started/api_basics",
    testable:    false,
  },
  {
    key:         "AMAZON_SP_ACCESS_TOKEN",
    label:       "Amazon SP-API Access Token",
    channel:     "Amazon",
    description: "Enables automatic product listings on Amazon Seller Central.",
    placeholder: "Atza|xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    helpUrl:     "https://developer-docs.amazon.com/sp-api/docs/sp-api-faq",
    testable:    false,
  },
  {
    key:         "EBAY_OAUTH_TOKEN",
    label:       "eBay OAuth Token",
    channel:     "eBay",
    description: "Enables automatic inventory listing on eBay.",
    placeholder: "v^1.1#i^1#f^0#I^3#r^1#....",
    helpUrl:     "https://developer.ebay.com/api-docs/static/oauth-tokens.html",
    testable:    false,
  },
  {
    key:         "CREATIVEMARKET_API_KEY",
    label:       "Creative Market API Key",
    channel:     "Creative Market",
    description: "Enables automatic product publishing on Creative Market.",
    placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    helpUrl:     "https://creativemarket.com/api",
    testable:    false,
  },
];

// ─── In-Memory Store ──────────────────────────────────────────────────────────

const store: Map<string, string> = new Map();

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadStore(): void {
  if (!existsSync(STORE_PATH)) return;
  try {
    const raw  = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Record<string, string>;
    for (const [k, v] of Object.entries(raw)) {
      const plain = decrypt(v);
      store.set(k, plain);
      if (!process.env[k]) {
        process.env[k] = plain;
      }
    }
    const count = store.size;
    if (count > 0) {
      console.log(`[CredentialsBridge] ✅ Loaded ${count} credential(s) from store — injected into process.env`);
    }
  } catch (err) {
    console.warn("[CredentialsBridge] Could not load credential store:", (err as Error).message);
  }
}

function saveStore(): void {
  try {
    const obj: Record<string, string> = {};
    for (const [k, v] of store.entries()) {
      obj[k] = encrypt(v);
    }
    writeFileSync(STORE_PATH, JSON.stringify(obj, null, 2), "utf8");
  } catch (err) {
    console.warn("[CredentialsBridge] Could not save credential store:", (err as Error).message);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function setCredential(key: string, value: string): void {
  const trimmed = value.trim();
  store.set(key, trimmed);
  process.env[key] = trimmed;
  saveStore();
  console.log(`[CredentialsBridge] ✅ Credential set: ${key} — injected into process.env`);
}

export function getCredential(key: string): string | undefined {
  return store.get(key) ?? process.env[key];
}

export function clearCredential(key: string): void {
  store.delete(key);
  delete process.env[key];
  saveStore();
  console.log(`[CredentialsBridge] 🗑 Credential cleared: ${key}`);
}

export function getCredentialStatus(): Array<{
  key:       string;
  label:     string;
  channel:   string;
  set:       boolean;
  source:    "bridge" | "env" | "none";
  helpUrl:   string;
}> {
  return CREDENTIAL_DEFS.map(def => {
    const inBridge = store.has(def.key);
    const inEnv    = !!process.env[def.key];
    return {
      key:     def.key,
      label:   def.label,
      channel: def.channel,
      set:     inBridge || inEnv,
      source:  inBridge ? "bridge" : inEnv ? "env" : "none",
      helpUrl: def.helpUrl,
    };
  });
}

// ─── Bootstrap — called once on server start ──────────────────────────────────

loadStore();
