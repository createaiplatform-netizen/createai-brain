/**
 * SemanticStorePage.tsx
 * ---------------------
 * The Semantic Product Layer — unified control dashboard.
 *
 * Shows all products indexed from Stripe, their channel readiness,
 * export download links, demand signals, and direct product page links.
 * All data is real — no simulated metrics.
 */

import React, { useEffect, useState } from "react";

interface SemanticProduct {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  priceCents: number;
  format: string;
  tags: string[];
  category: string;
  channels: {
    stripe: string;
    hostedPage: string;
    shopifyCsv: string;
    woocommerceCsv: string;
    googleShopping: string;
    amazonFeed: string;
  };
  createdAt: string;
}

interface DemandSignal {
  topFormats: Array<{ format: string; count: number; share: number }>;
  topTags: Array<{ tag: string; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
  totalProducts: number;
  totalRevenuePotential: string;
  activeChannels: number;
  catalogMaturity: string;
  opportunity: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  stripe: "Stripe",
  hostedPage: "Hosted Page",
  shopifyCsv: "Shopify CSV",
  woocommerceCsv: "WooCommerce CSV",
  googleShopping: "Google Shopping",
  amazonFeed: "Amazon Feed",
};

function ChannelPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    live: "bg-green-100 text-green-700 border-green-200",
    ready: "bg-blue-100 text-blue-700 border-blue-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    none: "bg-gray-100 text-gray-400 border-gray-200",
  };
  const dots: Record<string, string> = {
    live: "bg-green-500",
    ready: "bg-blue-500",
    pending: "bg-yellow-500",
    none: "bg-gray-300",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] ?? colors.none}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] ?? dots.none}`} />
      {status}
    </span>
  );
}

function MaturityBar({ maturity }: { maturity: string }) {
  const pct = maturity === "early" ? 25 : maturity === "scaling" ? 60 : 95;
  const color = maturity === "early" ? "bg-yellow-400" : maturity === "scaling" ? "bg-blue-500" : "bg-green-500";
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
      <div className={`${color} h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function SemanticStorePage() {
  const [products, setProducts] = useState<SemanticProduct[]>([]);
  const [signals, setSignals] = useState<DemandSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");

  async function loadData() {
    setError(null);
    try {
      const [prodRes, sigRes] = await Promise.all([
        fetch("/api/semantic/products"),
        fetch("/api/semantic/signals"),
      ]);
      const prodData = await prodRes.json();
      const sigData = await sigRes.json();
      if (prodData.ok) setProducts(prodData.products ?? []);
      if (sigData.ok) setSignals(sigData.signals ?? null);
    } catch (e) {
      setError("Failed to load semantic catalog. API server may be starting.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch("/api/semantic/products/refresh", { method: "POST" });
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const formats = Array.from(new Set(products.map(p => p.format))).sort();

  const filtered = products.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchFormat = formatFilter === "all" || p.format === formatFilter;
    return matchSearch && matchFormat;
  });

  const STORE_BASE = window.location.origin;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading Semantic Product Layer…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <h1 className="text-xl font-800 text-slate-900 font-bold">Semantic Product Layer</h1>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">Model 4</span>
            </div>
            <p className="text-sm text-slate-500">
              All products as channel-agnostic objects — emit to any marketplace simultaneously.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`${STORE_BASE}/api/semantic/store`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Live Store
            </a>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? "Syncing…" : "Sync Stripe"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
        )}

        {/* Signals + Export Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Catalog Intelligence */}
          {signals && (
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Catalog Intelligence</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-indigo-700">{signals.totalProducts}</div>
                  <div className="text-xs text-indigo-600 mt-1">Products Indexed</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-emerald-700">{signals.totalRevenuePotential}</div>
                  <div className="text-xs text-emerald-600 mt-1">Catalog Value</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-700">{signals.activeChannels}</div>
                  <div className="text-xs text-blue-600 mt-1">Active Channels</div>
                </div>
                <div className="bg-violet-50 rounded-xl p-4">
                  <div className="text-sm font-bold text-violet-700 capitalize">{signals.catalogMaturity}</div>
                  <div className="text-xs text-violet-600 mt-1">Catalog Maturity</div>
                  <MaturityBar maturity={signals.catalogMaturity} />
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">Signal: </span>{signals.opportunity}
              </div>
              {signals.topFormats.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-2 font-medium">FORMAT DISTRIBUTION</p>
                  <div className="space-y-2">
                    {signals.topFormats.slice(0, 5).map(f => (
                      <div key={f.format} className="flex items-center gap-3">
                        <span className="text-xs text-slate-600 w-20 shrink-0 capitalize">{f.format}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${f.share}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right">{f.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Export to Channels</h2>
            <p className="text-xs text-slate-500 mb-4">One-click export to any marketplace. All {products.length} products included.</p>
            <div className="space-y-2">
              {[
                { label: "Shopify CSV", path: "/api/semantic/export/shopify.csv", icon: "🛍️", desc: "Direct admin import" },
                { label: "WooCommerce CSV", path: "/api/semantic/export/woocommerce.csv", icon: "🏪", desc: "Standard WC format" },
                { label: "Google Shopping XML", path: "/api/semantic/export/google-shopping.xml", icon: "🔍", desc: "Merchant Center feed" },
                { label: "Amazon Feed", path: "/api/semantic/export/amazon.txt", icon: "📦", desc: "Flat file format" },
                { label: "Platform JSON", path: "/api/semantic/export/catalog.json", icon: "🗂️", desc: "Full semantic catalog" },
              ].map(({ label, path, icon, desc }) => (
                <a
                  key={path}
                  href={path}
                  download
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
                >
                  <span className="text-lg">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 group-hover:text-indigo-700">{label}</div>
                    <div className="text-xs text-slate-400">{desc}</div>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Semantic Product Registry</h2>
              <p className="text-xs text-slate-500 mt-0.5">{filtered.length} of {products.length} products</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 w-52 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
              <select
                value={formatFilter}
                onChange={e => setFormatFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
              >
                <option value="all">All formats</option>
                {formats.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">No products found. Run the ZeroTouch engine to generate products, then sync.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(p => (
                <div key={p.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded capitalize">
                          {p.format}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900 truncate">{p.title}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mb-3 line-clamp-1">{p.shortDescription}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(p.channels).map(([ch, status]) => (
                          <div key={ch} className="flex items-center gap-1">
                            <span className="text-xs text-slate-400">{CHANNEL_LABELS[ch] ?? ch}:</span>
                            <ChannelPill status={status as string} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold text-indigo-600 mb-2">
                        ${(p.priceCents / 100).toFixed(2)}
                      </div>
                      <a
                        href={`${STORE_BASE}/api/semantic/store/${p.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View Page
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
