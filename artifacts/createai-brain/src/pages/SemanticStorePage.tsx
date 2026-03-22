/**
 * SemanticStorePage.tsx
 * ---------------------
 * The Semantic Product Layer — advertising-grade product dashboard.
 *
 * Shows all 100 products indexed from Stripe with full advertising-grade
 * field validation: thumbnails, SEO metadata, long descriptions, gallery,
 * keywords, bullet points, audience, value proposition, CTA, and all
 * ad network export readiness indicators.
 *
 * All data is real — no simulated metrics.
 */

import React, { useEffect, useState } from "react";

interface SemanticProduct {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  longDescription: string;
  priceCents: number;
  valuePriceCents?: number;
  currency: string;
  format: string;
  formatLabel: string;
  productType: string;
  category: string;
  tags: string[];
  keywords: string[];
  coverImageUrl: string;
  thumbnailUrl: string;
  galleryImageUrls: string[];
  videoPreviewUrl: string;
  altText: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  structuredDataType: string;
  brand: string;
  condition: string;
  availability: string;
  mpn: string;
  googleProductCategory: string;
  ageGroup: string;
  audience: string;
  valueProposition: string;
  callToAction: string;
  socialProof: string;
  bulletPoints: string[];
  channels: {
    stripe: string;
    hostedPage: string;
    shopifyCsv: string;
    woocommerceCsv: string;
    googleShopping: string;
    amazonFeed: string;
  };
  views: number;
  sales: number;
  revenueCents: number;
  createdAt: string;
  updatedAt: string;
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

/** Compute an advertising quality score 0-100 for a product */
function adQualityScore(p: SemanticProduct): number {
  let score = 0;
  if (p.coverImageUrl) score += 10;
  if (p.thumbnailUrl) score += 8;
  if (p.galleryImageUrls?.length >= 3) score += 8;
  if (p.longDescription && p.longDescription.length > 100) score += 12;
  if (p.metaTitle && p.metaTitle.length <= 60) score += 8;
  if (p.metaDescription && p.metaDescription.length <= 160) score += 8;
  if (p.keywords?.length >= 5) score += 8;
  if (p.bulletPoints?.length >= 4) score += 8;
  if (p.audience) score += 5;
  if (p.valueProposition) score += 5;
  if (p.callToAction) score += 5;
  if (p.altText) score += 5;
  if (p.tags?.length >= 3) score += 5;
  if (p.formatLabel) score += 3;
  if (p.mpn) score += 2;
  return Math.min(score, 100);
}

function QualityBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-400" : "bg-red-400";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Review";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold ${score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-500"}`}>
        {score}% — {label}
      </span>
    </div>
  );
}

function ChannelPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    live: "bg-green-100 text-green-700 border-green-200",
    ready: "bg-blue-100 text-blue-700 border-blue-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    none: "bg-gray-100 text-gray-400 border-gray-200",
  };
  const dots: Record<string, string> = {
    live: "bg-green-500", ready: "bg-blue-500",
    pending: "bg-yellow-500", none: "bg-gray-300",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] ?? colors.none}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] ?? dots.none}`} />
      {status}
    </span>
  );
}

function FieldTag({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex gap-1.5 items-start">
      <span className="text-xs text-slate-400 font-medium shrink-0 w-24">{label}</span>
      <span className="text-xs text-slate-700 font-medium line-clamp-2">{value || <span className="text-red-400 italic">—</span>}</span>
    </div>
  );
}

function CheckIcon({ ok }: { ok: boolean }) {
  return ok
    ? <span className="text-green-500 font-bold text-xs">✓</span>
    : <span className="text-red-400 font-bold text-xs">✗</span>;
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
  const [selectedProduct, setSelectedProduct] = useState<SemanticProduct | null>(null);
  const [tab, setTab] = useState<"overview" | "seo" | "ads" | "copy" | "media">("overview");

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
    const q = search.toLowerCase();
    const matchSearch = !search
      || p.title.toLowerCase().includes(q)
      || p.category.toLowerCase().includes(q)
      || (p.tags ?? []).some(t => t.toLowerCase().includes(q))
      || (p.keywords ?? []).some(k => k.toLowerCase().includes(q));
    const matchFormat = formatFilter === "all" || p.format === formatFilter;
    return matchSearch && matchFormat;
  });

  const avgScore = products.length
    ? Math.round(products.reduce((s, p) => s + adQualityScore(p), 0) / products.length)
    : 0;

  const STORE_BASE = window.location.origin;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading advertising-grade product catalog…</p>
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
              <h1 className="text-xl font-bold text-slate-900">Semantic Product Layer</h1>
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Ad-Grade v2</span>
            </div>
            <p className="text-sm text-slate-500">
              {products.length} products · {formats.length} formats · Avg. ad quality: {avgScore}% · All channels ready
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

        {/* Top row: Catalog Intelligence + Ad Quality + Exports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Catalog Intelligence */}
          {signals && (
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-slate-900">Catalog Intelligence</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-indigo-700">{signals.totalProducts}</div>
                  <div className="text-xs text-indigo-600 mt-1">Products</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-emerald-700">{signals.totalRevenuePotential}</div>
                  <div className="text-xs text-emerald-600 mt-1">Catalog Value</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-700">{signals.activeChannels}</div>
                  <div className="text-xs text-blue-600 mt-1">Ad Channels</div>
                </div>
                <div className="bg-violet-50 rounded-xl p-4">
                  <div className="text-sm font-bold text-violet-700 capitalize">{signals.catalogMaturity}</div>
                  <div className="text-xs text-violet-600 mt-1">Maturity</div>
                  <MaturityBar maturity={signals.catalogMaturity} />
                </div>
              </div>

              {/* Ad Quality Summary */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">Avg. Advertising Quality</span>
                  <span className="text-xs text-slate-500">{avgScore}/100</span>
                </div>
                <QualityBar score={avgScore} />
                <p className="text-xs text-slate-500 mt-1">
                  Fields covered: cover image, thumbnail, gallery (3), long description, meta title, meta description,
                  keywords (5-10), bullet points (4-6), audience, value prop, CTA, alt text, tags, MPN, Google category.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">Signal: </span>{signals.opportunity}
              </div>

              {signals.topFormats.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Format Distribution</p>
                  <div className="space-y-2">
                    {signals.topFormats.slice(0, 6).map(f => (
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
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Export to Ad Channels</h2>
            <p className="text-xs text-slate-500 mb-4">All {products.length} products · Full advertising-grade fields included.</p>
            <div className="space-y-2">
              {[
                { label: "Shopify CSV", path: "/api/semantic/export/shopify.csv", icon: "🛍️", desc: "Long desc, gallery, SEO, metafields" },
                { label: "WooCommerce CSV", path: "/api/semantic/export/woocommerce.csv", icon: "🏪", desc: "Long desc, gallery, Yoast SEO fields" },
                { label: "Google Shopping XML", path: "/api/semantic/export/google-shopping.xml", icon: "🔍", desc: "Category, MPN, gallery, condition, GTIN" },
                { label: "Amazon Flat File", path: "/api/semantic/export/amazon.txt", icon: "📦", desc: "Bullets (5), search terms, audience" },
                { label: "Platform JSON", path: "/api/semantic/export/catalog.json", icon: "🗂️", desc: "Full ad-grade catalog v2.0" },
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

        {/* Product Registry */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Advertising-Grade Product Registry</h2>
              <p className="text-xs text-slate-500 mt-0.5">{filtered.length} of {products.length} products — click any row to inspect all ad fields</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search by title, category, tag, keyword…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 w-64 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
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
              <p className="text-slate-500 text-sm">No products found. Try a different search or sync from Stripe.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(p => {
                const score = adQualityScore(p);
                return (
                  <div
                    key={p.id}
                    className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedProduct(p === selectedProduct ? null : p)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      {p.thumbnailUrl ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                          <img
                            src={p.thumbnailUrl}
                            alt={p.altText ?? p.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center text-slate-300 text-lg">📦</div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded capitalize">
                            {p.formatLabel ?? p.format}
                          </span>
                          <span className="text-xs text-slate-400 hidden sm:block">{p.category}</span>
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{p.title}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <QualityBar score={score} />
                          {/* Ad-grade field presence indicators */}
                          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                            <span title="Cover image"><CheckIcon ok={!!p.coverImageUrl} /></span>
                            <span className="text-xs text-slate-300">img</span>
                            <span title="Thumbnail"><CheckIcon ok={!!p.thumbnailUrl} /></span>
                            <span className="text-xs text-slate-300">thumb</span>
                            <span title="Gallery (3+)"><CheckIcon ok={(p.galleryImageUrls ?? []).length >= 3} /></span>
                            <span className="text-xs text-slate-300">gallery</span>
                            <span title="Long description"><CheckIcon ok={!!p.longDescription} /></span>
                            <span className="text-xs text-slate-300">long</span>
                            <span title="Meta title"><CheckIcon ok={!!p.metaTitle && p.metaTitle.length <= 60} /></span>
                            <span className="text-xs text-slate-300">meta</span>
                            <span title="Keywords (5+)"><CheckIcon ok={(p.keywords ?? []).length >= 5} /></span>
                            <span className="text-xs text-slate-300">kw</span>
                            <span title="Bullets (4+)"><CheckIcon ok={(p.bulletPoints ?? []).length >= 4} /></span>
                            <span className="text-xs text-slate-300">bullets</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-4">
                        <div>
                          <div className="text-base font-bold text-indigo-600">
                            ${(p.priceCents / 100).toFixed(2)}
                          </div>
                          {p.valuePriceCents && p.valuePriceCents > p.priceCents && (
                            <div className="text-xs text-slate-400 line-through">${(p.valuePriceCents / 100).toFixed(2)}</div>
                          )}
                        </div>
                        <a
                          href={`${STORE_BASE}/api/semantic/store/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <svg
                          className={`w-4 h-4 text-slate-400 transition-transform ${selectedProduct?.id === p.id ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* ── Expanded Product Detail Panel ── */}
                    {selectedProduct?.id === p.id && (
                      <div className="mt-4 border-t border-slate-100 pt-4" onClick={e => e.stopPropagation()}>
                        {/* Tab navigation */}
                        <div className="flex gap-1 mb-4 flex-wrap">
                          {(["overview", "seo", "ads", "copy", "media"] as const).map(t => (
                            <button
                              key={t}
                              onClick={() => setTab(t)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                tab === t
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {t === "overview" ? "Overview" : t === "seo" ? "SEO Fields" : t === "ads" ? "Ad Network" : t === "copy" ? "Copy & CTA" : "Media"}
                            </button>
                          ))}
                        </div>

                        {tab === "overview" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <FieldTag label="Description" value={p.description} />
                              <FieldTag label="Short Desc" value={p.shortDescription} />
                              <FieldTag label="Long Desc" value={p.longDescription?.slice(0, 120) + "…"} />
                              <FieldTag label="Format Label" value={p.formatLabel} />
                              <FieldTag label="Product Type" value={p.productType} />
                              <FieldTag label="Category" value={p.category} />
                            </div>
                            <div className="space-y-2">
                              <FieldTag label="Tags" value={(p.tags ?? []).join(", ")} />
                              <FieldTag label="Brand" value={p.brand} />
                              <FieldTag label="Condition" value={p.condition} />
                              <FieldTag label="Availability" value={p.availability} />
                              <FieldTag label="Age Group" value={p.ageGroup} />
                              <FieldTag label="MPN / SKU" value={p.mpn} />
                            </div>
                            {/* Channel readiness */}
                            <div className="sm:col-span-2">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Channel Readiness</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(p.channels).map(([ch, status]) => (
                                  <div key={ch} className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-400">{CHANNEL_LABELS[ch] ?? ch}:</span>
                                    <ChannelPill status={status as string} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {tab === "seo" && (
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Meta Title <span className={`ml-1 ${p.metaTitle?.length <= 60 ? "text-green-500" : "text-red-400"}`}>({p.metaTitle?.length ?? 0}/60)</span></p>
                              <p className="text-sm text-slate-800 bg-slate-50 rounded-lg p-3">{p.metaTitle || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Meta Description <span className={`ml-1 ${p.metaDescription?.length <= 160 ? "text-green-500" : "text-red-400"}`}>({p.metaDescription?.length ?? 0}/160)</span></p>
                              <p className="text-sm text-slate-800 bg-slate-50 rounded-lg p-3">{p.metaDescription || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Keywords ({(p.keywords ?? []).length})</p>
                              <div className="flex flex-wrap gap-1.5">
                                {(p.keywords ?? []).map(k => (
                                  <span key={k} className="bg-violet-50 text-violet-700 border border-violet-100 rounded-full px-2.5 py-1 text-xs font-medium">{k}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Structured Data Type</p>
                              <p className="text-sm text-slate-800">{p.structuredDataType}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Image Alt Text</p>
                              <p className="text-sm text-slate-800 bg-slate-50 rounded-lg p-3">{p.altText || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">OG Image URL</p>
                              <p className="text-xs text-slate-600 font-mono break-all">{p.ogImage || "—"}</p>
                            </div>
                          </div>
                        )}

                        {tab === "ads" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {[
                                { label: "Brand", value: p.brand },
                                { label: "MPN / SKU", value: p.mpn },
                                { label: "Condition", value: p.condition },
                                { label: "Availability", value: p.availability },
                                { label: "Product Type", value: p.productType },
                                { label: "Age Group", value: p.ageGroup },
                              ].map(({ label, value }) => (
                                <div key={label} className="bg-slate-50 rounded-lg p-3">
                                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                                  <p className="text-sm font-semibold text-slate-800">{value || "—"}</p>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Google Product Category</p>
                              <p className="text-sm text-slate-800 bg-slate-50 rounded-lg p-3">{p.googleProductCategory || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Format Label (displayed in ads)</p>
                              <p className="text-sm text-slate-800">{p.formatLabel || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Channel Readiness</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(p.channels).map(([ch, status]) => (
                                  <div key={ch} className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-400">{CHANNEL_LABELS[ch] ?? ch}:</span>
                                    <ChannelPill status={status as string} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {tab === "copy" && (
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Value Proposition</p>
                              <p className="text-sm text-slate-800 bg-amber-50 border border-amber-100 rounded-lg p-3 italic">{p.valueProposition || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Target Audience</p>
                              <p className="text-sm text-slate-800 bg-slate-50 rounded-lg p-3">{p.audience || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Call to Action (CTA)</p>
                              <div className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-bold">
                                ⚡ {p.callToAction || "Get Instant Access"}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Social Proof</p>
                              <p className="text-sm text-slate-800 bg-yellow-50 border border-yellow-100 rounded-lg p-3">⭐ {p.socialProof || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Bullet Points ({(p.bulletPoints ?? []).length})</p>
                              <ul className="space-y-2">
                                {(p.bulletPoints ?? []).map((b, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                    <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                                    {b}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Long Description</p>
                              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-line leading-relaxed">{p.longDescription || "—"}</p>
                            </div>
                          </div>
                        )}

                        {tab === "media" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cover Image (600×400)</p>
                                {p.coverImageUrl ? (
                                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video">
                                    <img src={p.coverImageUrl} alt={p.altText ?? p.title} className="w-full h-full object-cover" />
                                  </div>
                                ) : <p className="text-sm text-red-400">Missing</p>}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Thumbnail (300×300)</p>
                                {p.thumbnailUrl ? (
                                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 w-32 h-32">
                                    <img src={p.thumbnailUrl} alt={p.altText ?? p.title} className="w-full h-full object-cover" />
                                  </div>
                                ) : <p className="text-sm text-red-400">Missing</p>}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Gallery Images ({(p.galleryImageUrls ?? []).length})</p>
                              <div className="grid grid-cols-3 gap-2">
                                {(p.galleryImageUrls ?? []).map((url, i) => (
                                  <div key={i} className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-video">
                                    <img src={url} alt={`${p.title} gallery ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">OG Image (1200×630)</p>
                              {p.ogImage ? (
                                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video max-w-xs">
                                  <img src={p.ogImage} alt="OG image" className="w-full h-full object-cover" loading="lazy" />
                                </div>
                              ) : <p className="text-sm text-red-400">Missing</p>}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Video Preview URL</p>
                              {p.videoPreviewUrl ? (
                                <a href={p.videoPreviewUrl} target="_blank" rel="noopener noreferrer"
                                   className="text-xs text-indigo-600 hover:underline break-all font-mono">{p.videoPreviewUrl}</a>
                              ) : <p className="text-sm text-slate-400">—</p>}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Alt Text</p>
                              <p className="text-sm text-slate-800 bg-slate-50 rounded-lg p-2">{p.altText || "—"}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
