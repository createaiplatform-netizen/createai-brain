/**
 * realMarket.ts — Adaptive AI Market Engine
 * Spec: realStripeSetup.ts (Pasted-import-Stripe...)
 *
 * Every 10 seconds:
 *  1. Creates AI products from trending niches
 *  2. Adapts generation speed based on sales performance
 *  3. Simulates publishing to Shopify / Etsy / WooCommerce
 *
 * Stripe checkout is handled per-product via the /api/real-market/checkout/:id route.
 */

import { randomUUID } from "crypto";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MarketProduct {
  id:          string;
  name:        string;
  description: string;
  price:       number;   // dollars (e.g. 19)
  views:       number;
  sales:       number;
  published:   boolean;
  createdAt:   Date;
  niche:       string;
}

interface EngineStats {
  salesCount:       number;
  generationSpeed:  number;
  totalProducts:    number;
  topProduct:       MarketProduct | null;
  cycleCount:       number;
  running:          boolean;
}

// ─── State ──────────────────────────────────────────────────────────────────

const products: MarketProduct[] = [];
let salesCount       = 0;
let generationSpeed  = 1;
let cycleCount       = 0;
let engineRunning    = false;

// ─── Trend Sources + Niches ─────────────────────────────────────────────────

const TREND_URLS = [
  "https://api.example.com/top-trending-products",
  "https://api.example.com/viral-keywords",
];

// Fallback niches used when trend APIs are unavailable (they're example URLs)
const FALLBACK_NICHES = [
  "AI Writing Assistant",    "Smart Productivity Suite",  "Automated Research Tool",
  "AI Video Script Writer",  "Social Media AI Manager",   "Smart Customer Support Bot",
  "AI SEO Optimizer",        "Automated Data Analyst",    "AI Code Reviewer",
  "Smart Business Dashboard","AI Language Tutor",          "Content Calendar AI",
  "AI Lead Generator",       "Smart Invoice Manager",     "AI Brand Identity Kit",
  "Automated Email Drafter", "AI Market Research Agent",  "Smart Goal Tracker",
  "AI Legal Document Helper","Smart Schedule Optimizer",
];

async function fetchTrendingNiche(): Promise<string> {
  for (const url of TREND_URLS) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      const res  = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json() as Array<{ name?: string }>;
        if (Array.isArray(data) && data[0]?.name) return data[0].name;
      }
    } catch { /* network unreachable — fall through to fallback */ }
  }
  // Rotate through fallback niches deterministically by cycle count
  return FALLBACK_NICHES[cycleCount % FALLBACK_NICHES.length];
}

// ─── Marketplace Publishers (simulated — no auth available) ─────────────────

const MARKETPLACES = [
  { name: "Shopify",      api: "https://api.shopify.com/v1/products" },
  { name: "Etsy",         api: "https://openapi.etsy.com/v3/application/listings" },
  { name: "WooCommerce",  api: "https://your-woocommerce-site.com/wp-json/wc/v3/products" },
];

function publishToMarketplaces(product: MarketProduct): void {
  for (const market of MARKETPLACES) {
    // Simulate push — real auth/endpoints would replace this log
    console.log(`[RealMarket] Publishing "${product.name}" → ${market.name}`);
  }
}

// ─── Product Creation ────────────────────────────────────────────────────────

export async function createProductFromTrend(): Promise<MarketProduct> {
  const niche = await fetchTrendingNiche();
  const price = Math.floor(Math.random() * 30) + 10; // $10–$39

  const product: MarketProduct = {
    id:          randomUUID(),
    name:        `AI Solution: ${niche}`,
    description: `Automated AI solution for ${niche}. Powered by CreateAI Brain.`,
    price,
    views:       0,
    sales:       0,
    published:   false,
    createdAt:   new Date(),
    niche,
  };

  products.push(product);

  // Auto-publish to all marketplaces
  publishToMarketplaces(product);
  product.published = true;

  return product;
}

// ─── Adaptive Engine ─────────────────────────────────────────────────────────

function getTopProduct(): MarketProduct | null {
  const withViews = products.filter(p => p.views > 0);
  if (withViews.length === 0) return null;
  return withViews.sort((a, b) =>
    (b.sales / (b.views || 1)) - (a.sales / (a.views || 1))
  )[0] ?? null;
}

async function runAdaptiveCycle(): Promise<void> {
  cycleCount++;
  console.log(`[RealMarket] 🔄 Adaptive cycle #${cycleCount} running… speed:${generationSpeed}`);

  // Generate `generationSpeed` products this cycle
  const count = Math.ceil(generationSpeed);
  for (let i = 0; i < count; i++) {
    await createProductFromTrend();
  }

  // Adapt speed based on sales performance
  if (salesCount > 0) {
    generationSpeed = Math.min(generationSpeed + 1, 50);
  } else {
    generationSpeed = Math.max(1, generationSpeed - 0.5);
  }

  const top = getTopProduct();
  if (top) console.log(`[RealMarket] 🔥 Top product: ${top.name} (conv:${((top.sales / (top.views || 1)) * 100).toFixed(1)}%)`);
  console.log(`[RealMarket] ⚡ Speed:${generationSpeed} · 💰 Sales:${salesCount} · 📦 Products:${products.length}`);
}

export function startAdaptiveEngine(): void {
  if (engineRunning) return;
  engineRunning = true;

  // Run first cycle immediately, then every 10 seconds
  runAdaptiveCycle().catch(err =>
    console.error("[RealMarket] Cycle error:", (err as Error).message)
  );

  setInterval(() => {
    runAdaptiveCycle().catch(err =>
      console.error("[RealMarket] Cycle error:", (err as Error).message)
    );
  }, 10_000);

  console.log("[RealMarket] 🚀 Real Market AI system live with marketplace auto-publishing");
}

// ─── Public Accessors ────────────────────────────────────────────────────────

export function getProducts(limit = 20): MarketProduct[] {
  return products.slice(-limit).reverse(); // most recent first
}

export function getProduct(id: string): MarketProduct | undefined {
  return products.find(p => p.id === id);
}

export function recordView(id: string): void {
  const p = products.find(p => p.id === id);
  if (p) p.views++;
}

export function recordSale(id: string): void {
  const p = products.find(p => p.id === id);
  if (p) { p.sales++; salesCount++; }
}

export function getEngineStats(): EngineStats {
  return {
    salesCount,
    generationSpeed,
    totalProducts: products.length,
    topProduct:    getTopProduct(),
    cycleCount,
    running:       engineRunning,
  };
}
