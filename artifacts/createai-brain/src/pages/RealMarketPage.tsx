import React, { useEffect, useState, useCallback } from "react";
import useSEO from "@/hooks/useSEO";

const INDIGO  = "#6366f1";
const PURPLE  = "#8b5cf6";

interface Product {
  id:          string;
  name:        string;
  description: string;
  price:       number;
  views:       number;
  sales:       number;
  published:   boolean;
  niche:       string;
  createdAt:   string;
}

interface Stats {
  salesCount:       number;
  generationSpeed:  number;
  totalProducts:    number;
  topProduct:       Product | null;
  cycleCount:       number;
  running:          boolean;
}

function Badge({ label, color = "#6366f1" }: { label: string; color?: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
      style={{ background: color }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
      <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "#94a3b8" }}>{label}</p>
      <p className="text-[22px] font-black" style={{ color: "#0f172a" }}>{value}</p>
      {sub && <p className="text-[11px]" style={{ color: "#64748b" }}>{sub}</p>}
    </div>
  );
}

function ProductCard({ product, onBuy, buying }: {
  product: Product;
  onBuy: (id: string) => void;
  buying: boolean;
}) {
  const conv = product.views > 0 ? ((product.sales / product.views) * 100).toFixed(1) : "0.0";
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 transition-shadow hover:shadow-md"
      style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[14px] leading-tight" style={{ color: "#0f172a" }}>{product.name}</p>
          <p className="text-[12px] mt-1 leading-snug" style={{ color: "#64748b" }}>{product.description}</p>
        </div>
        <div className="flex-shrink-0 text-[20px] font-black" style={{ color: INDIGO }}>
          ${product.price}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {product.published && <Badge label="Published" color="#10b981" />}
        <Badge label={product.niche} color={PURPLE} />
      </div>
      <div className="flex items-center gap-4 text-[11px]" style={{ color: "#94a3b8" }}>
        <span>{product.views} views</span>
        <span>{product.sales} sales</span>
        <span>{conv}% conv.</span>
      </div>
      <button
        onClick={() => onBuy(product.id)}
        disabled={buying}
        className="w-full py-2.5 rounded-xl font-bold text-[13px] text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)`,
          boxShadow: "0 4px 16px rgba(99,102,241,0.30)" }}>
        {buying ? "Opening checkout…" : `Buy Now — $${product.price}`}
      </button>
    </div>
  );
}

export default function RealMarketPage() {
  useSEO({
    title:       "Real Market — Live AI Products & Revenue Intelligence | CreateAI Brain",
    description: "Browse real AI products, live revenue data, and market intelligence on the CreateAI Brain platform. All data is live — no projections.",
    url:         "https://createai.digital/real-market",
    keywords:    "AI market, real revenue, live products, business intelligence, CreateAI Brain",
    jsonLD: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Real Market — CreateAI Brain",
      "url": "https://createai.digital/real-market",
      "description": "Live AI product market with real revenue data and business intelligence.",
      "isPartOf": { "@type": "WebSite", "url": "https://createai.digital" }
    }
  });

  const [products, setProducts]     = useState<Product[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [buyingId, setBuyingId]     = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch("/api/real-market/products", { credentials: "include" }),
        fetch("/api/real-market/stats",    { credentials: "include" }),
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (sRes.ok) setStats(await sRes.json());
      setLastRefresh(new Date());
      setError(null);
    } catch {
      setError("Could not connect to market engine.");
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5_000);
    return () => clearInterval(id);
  }, [load]);

  async function handleBuy(productId: string) {
    setBuyingId(productId);
    try {
      const res = await fetch(
        `/api/real-market/checkout/${productId}`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json() as { ok: boolean; url?: string; error?: string };
      if (data.ok && data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        setError(data.error ?? "Checkout failed — please try again.");
      }
    } catch {
      setError("Checkout request failed.");
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md"
            style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)` }}>
            🛒
          </div>
          <div>
            <h1 className="text-[24px] font-black tracking-tight" style={{ color: "#0f172a" }}>
              CreateAI Real Market Store
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "#64748b" }}>
              AI-powered products auto-created from live market trends · Updated every 10s
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {stats?.running && (
              <span className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full"
                style={{ background: "rgba(16,185,129,0.10)", color: "#059669" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Engine live
              </span>
            )}
            <button onClick={() => void load()}
              className="text-[12px] font-medium px-3 py-1.5 rounded-xl transition-all"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.09)", color: "#374151" }}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-12 max-w-5xl mx-auto space-y-6">
        {/* Error */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-[13px] font-medium"
            style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.15)" }}>
            {error}
          </div>
        )}

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Products"  value={stats.totalProducts}
              sub={`Cycle #${stats.cycleCount}`} />
            <StatCard label="Total Sales"     value={stats.salesCount}
              sub="from Stripe payments" />
            <StatCard label="Engine Speed"    value={`${stats.generationSpeed}×`}
              sub="products / cycle" />
            <StatCard label="Top Performer"   value={stats.topProduct ? `$${stats.topProduct.price}` : "—"}
              sub={stats.topProduct?.name ?? "No sales yet"} />
          </div>
        )}

        {/* Product grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-semibold" style={{ color: "#374151" }}>
              Latest {products.length} products
            </p>
            <p className="text-[11px]" style={{ color: "#94a3b8" }}>
              Last updated {lastRefresh.toLocaleTimeString()}
            </p>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl p-12 text-center"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="text-4xl mb-3">🔄</div>
              <p className="font-semibold" style={{ color: "#0f172a" }}>Engine starting…</p>
              <p className="text-[13px] mt-1" style={{ color: "#64748b" }}>
                Products will appear automatically within 10 seconds.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onBuy={handleBuy}
                  buying={buyingId === p.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Marketplace status */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-[13px] font-bold mb-3" style={{ color: "#0f172a" }}>Marketplace Auto-Publishing</p>
          <div className="flex flex-wrap gap-3">
            {["Shopify", "Etsy", "WooCommerce"].map(name => (
              <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium"
                style={{ background: "rgba(99,102,241,0.06)", color: "#4338ca",
                  border: "1px solid rgba(99,102,241,0.12)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                {name}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px]" style={{ color: "#94a3b8" }}>
            Every new product is automatically submitted to all connected marketplaces.
          </p>
        </div>
      </div>
    </div>
  );
}
