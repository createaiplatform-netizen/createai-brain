/**
 * semantic/transforms.ts
 * ----------------------
 * Pure transform functions: SemanticProduct[] → channel-specific output format.
 *
 * Each function is independent and stateless. Add new channel transforms here.
 * No channel is aware of other channels. No channel modifies the source object.
 */

import type { SemanticProduct, DemandSignal } from "./types.js";

function escapeCsv(value: string): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

// ── Shopify Product CSV ────────────────────────────────────────────────────────
// Shopify import format: https://help.shopify.com/en/manual/products/import-export
export function toShopifyCSV(products: SemanticProduct[]): string {
  const headers = [
    "Handle", "Title", "Body (HTML)", "Vendor", "Type", "Tags",
    "Published", "Variant SKU", "Variant Price", "Variant Requires Shipping",
    "Variant Taxable", "Image Src", "Image Position", "Image Alt Text",
  ].join(",");

  const rows = products.map(p => [
    escapeCsv(p.slug),
    escapeCsv(p.title),
    escapeCsv(`<p>${p.description}</p>`),
    escapeCsv("CreateAI Brain"),
    escapeCsv(p.format),
    escapeCsv(p.tags.join(", ")),
    "TRUE",
    escapeCsv(`CAB-${p.id.slice(0, 8).toUpperCase()}`),
    (p.priceCents / 100).toFixed(2),
    "FALSE",
    "TRUE",
    escapeCsv(p.coverImageUrl || ""),
    "1",
    escapeCsv(p.title),
  ].join(","));

  return [headers, ...rows].join("\r\n");
}

// ── WooCommerce Product CSV ────────────────────────────────────────────────────
// WooCommerce import format: standard WC product CSV
export function toWooCommerceCSV(products: SemanticProduct[]): string {
  const headers = [
    "ID", "Type", "SKU", "Name", "Published", "Is featured?",
    "Visibility in catalog", "Short description", "Description",
    "Regular price", "Categories", "Tags", "Images",
  ].join(",");

  const rows = products.map((p, i) => [
    i + 1,
    escapeCsv("simple"),
    escapeCsv(`CAB-${p.id.slice(0, 8).toUpperCase()}`),
    escapeCsv(p.title),
    "1",
    "0",
    escapeCsv("visible"),
    escapeCsv(p.shortDescription),
    escapeCsv(p.description),
    (p.priceCents / 100).toFixed(2),
    escapeCsv(p.category),
    escapeCsv(p.tags.join(", ")),
    escapeCsv(p.coverImageUrl || ""),
  ].join(","));

  return [headers, ...rows].join("\r\n");
}

// ── Google Shopping XML Feed ───────────────────────────────────────────────────
// Google Merchant Center RSS 2.0 format
export function toGoogleShoppingXML(products: SemanticProduct[], storeUrl: string): string {
  const items = products.map(p => `    <item>
      <g:id><![CDATA[${p.id}]]></g:id>
      <title><![CDATA[${p.title}]]></title>
      <description><![CDATA[${p.shortDescription || p.description}]]></description>
      <link>${storeUrl}/api/semantic/store/${p.id}</link>
      <g:image_link>${p.coverImageUrl || "https://placehold.co/800x600/6366f1/ffffff?text=CreateAI"}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${(p.priceCents / 100).toFixed(2)} USD</g:price>
      <g:brand>CreateAI Brain</g:brand>
      <g:product_type><![CDATA[Digital Products > ${p.format}]]></g:product_type>
      <g:google_product_category>Media &gt; Digital Goods &gt; Digital Music</g:google_product_category>
      <g:identifier_exists>no</g:identifier_exists>
      <g:custom_label_0><![CDATA[${p.format}]]></g:custom_label_0>
      <g:custom_label_1><![CDATA[${p.category}]]></g:custom_label_1>
    </item>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>CreateAI Brain — Digital Products</title>
    <link>${storeUrl}</link>
    <description>AI-generated digital products for immediate delivery</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
}

// ── Amazon Flat File Feed (simplified) ────────────────────────────────────────
export function toAmazonFeed(products: SemanticProduct[]): string {
  const headers = [
    "sku", "product-id", "product-id-type", "price", "minimum-seller-allowed-price",
    "maximum-seller-allowed-price", "item-condition", "quantity", "add-delete",
    "will-ship-internationally", "item_name", "item_description", "brand_name",
  ].join("\t");

  const rows = products.map(p => [
    `CAB-${p.id.slice(0, 8).toUpperCase()}`,
    p.id,
    "ASIN",
    (p.priceCents / 100).toFixed(2),
    (p.priceCents / 100 * 0.8).toFixed(2),
    (p.priceCents / 100 * 1.5).toFixed(2),
    "New",
    "999",
    "a",
    "n",
    p.title.slice(0, 200),
    p.description.slice(0, 2000),
    "CreateAI Brain",
  ].join("\t"));

  return ["TemplateType=Inventory\tVersion=2014.0301", headers, ...rows].join("\r\n");
}

// ── Hosted Product Page HTML ───────────────────────────────────────────────────
export function toHostedPageHTML(p: SemanticProduct, checkoutUrl: string, success = false): string {
  const price = (p.priceCents / 100).toFixed(2);
  const successBanner = success
    ? `<div style="background:#dcfce7;border:1px solid #86efac;border-radius:12px;padding:16px 24px;margin-bottom:24px;color:#15803d;font-weight:600;">
        ✓ Purchase complete — thank you! Your product has been delivered.
      </div>`
    : "";

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": p.title,
    "description": p.description,
    "brand": { "@type": "Brand", "name": "CreateAI Brain" },
    "category": p.category,
    "offers": {
      "@type": "Offer",
      "price": (p.priceCents / 100).toFixed(2),
      "priceCurrency": p.currency.toUpperCase(),
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "CreateAI Brain" },
    },
    "keywords": p.tags.join(", "),
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p.title} — CreateAI Brain</title>
  <meta name="description" content="${p.shortDescription}">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${p.title}">
  <meta property="og:description" content="${p.shortDescription}">
  <meta property="og:image" content="${p.coverImageUrl || ""}">
  <meta property="product:price:amount" content="${(p.priceCents / 100).toFixed(2)}">
  <meta property="product:price:currency" content="${p.currency.toUpperCase()}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${p.title}">
  <meta name="twitter:description" content="${p.shortDescription}">
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }
    .hero { background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); padding: 72px 24px 100px; text-align: center; color: white; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; padding: 6px 18px; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 20px; }
    .hero h1 { font-size: clamp(1.75rem, 4vw, 3rem); font-weight: 800; line-height: 1.2; margin-bottom: 16px; max-width: 700px; margin-left: auto; margin-right: auto; }
    .hero p { font-size: 1.125rem; opacity: 0.9; max-width: 560px; margin: 0 auto 32px; line-height: 1.6; }
    .price-block { display: inline-flex; align-items: baseline; gap: 4px; }
    .price { font-size: 3.5rem; font-weight: 900; line-height: 1; }
    .currency { font-size: 1.5rem; font-weight: 700; opacity: 0.8; }
    .card { max-width: 760px; margin: -60px auto 60px; background: white; border-radius: 20px; box-shadow: 0 4px 32px rgba(0,0,0,0.1); padding: 48px; }
    .features { list-style: none; margin: 28px 0; border-top: 1px solid #f1f5f9; }
    .features li { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; }
    .check { width: 22px; height: 22px; background: #ede9fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #6366f1; font-size: 0.75rem; font-weight: 800; flex-shrink: 0; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0 28px; }
    .tag { background: #f1f5f9; color: #64748b; border-radius: 999px; padding: 5px 14px; font-size: 0.8rem; font-weight: 500; }
    .desc { color: #475569; line-height: 1.75; font-size: 0.95rem; margin-bottom: 32px; }
    .btn { display: block; background: #6366f1; color: white; border: none; border-radius: 14px; padding: 18px 32px; font-size: 1.1rem; font-weight: 700; cursor: pointer; text-decoration: none; text-align: center; transition: all 0.2s; box-shadow: 0 4px 14px rgba(99,102,241,0.3); }
    .btn:hover { background: #4f46e5; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99,102,241,0.4); }
    .guarantee { text-align: center; margin-top: 20px; font-size: 0.85rem; color: #94a3b8; }
    footer { text-align: center; padding: 32px; color: #94a3b8; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="hero">
    <div class="badge">${p.format}</div>
    <h1>${p.title}</h1>
    <p>${p.shortDescription}</p>
    <div class="price-block">
      <span class="currency">$</span>
      <span class="price">${price}</span>
    </div>
  </div>
  <div class="card">
    ${successBanner}
    <ul class="features">
      <li><div class="check">✓</div> Instant digital delivery — no waiting, no shipping</li>
      <li><div class="check">✓</div> AI-generated, professionally structured content</li>
      <li><div class="check">✓</div> Full commercial use rights included</li>
      <li><div class="check">✓</div> Lifetime access — yours forever</li>
      <li><div class="check">✓</div> 30-day satisfaction guarantee</li>
    </ul>
    <div class="tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
    <p class="desc">${p.description}</p>
    <a href="${checkoutUrl}" class="btn">Get Instant Access — $${price}</a>
    <p class="guarantee">🔒 Secure payment via Stripe · Instant delivery · No subscriptions</p>
  </div>
  <footer>Powered by CreateAI Brain · AI-generated digital products</footer>
</body>
</html>`;
}

// ── Store Index HTML ───────────────────────────────────────────────────────────
export function toStoreIndexHTML(products: SemanticProduct[], storeUrl: string): string {
  const productCards = products.slice(0, 48).map(p => {
    const tagStr = p.tags.join(" ").replace(/"/g, "&quot;");
    const titleStr = p.title.replace(/"/g, "&quot;");
    return `    <a href="${storeUrl}/api/semantic/store/${p.id}" class="card" style="text-decoration:none;color:inherit;" data-title="${titleStr}" data-format="${p.format}" data-tags="${tagStr}">
      <div class="format">${p.format}</div>
      <h3>${p.title}</h3>
      <p>${p.shortDescription.slice(0, 100)}${p.shortDescription.length > 100 ? "…" : ""}</p>
      <div class="price">$${(p.priceCents / 100).toFixed(2)}</div>
    </a>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CreateAI Brain — Digital Product Store</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; }
    header { background: linear-gradient(135deg, #6366f1, #818cf8); color: white; padding: 56px 24px; text-align: center; }
    header h1 { font-size: 2.75rem; font-weight: 800; }
    header p { margin-top: 12px; opacity: 0.9; font-size: 1.1rem; }
    .stats { display: flex; justify-content: center; gap: 32px; margin-top: 28px; flex-wrap: wrap; }
    .stat { background: rgba(255,255,255,0.15); border-radius: 12px; padding: 12px 24px; text-align: center; }
    .stat-num { font-size: 1.75rem; font-weight: 800; }
    .stat-label { font-size: 0.8rem; opacity: 0.8; margin-top: 2px; }
    .controls { max-width: 1280px; margin: 0 auto; padding: 28px 24px 0; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .search-input { flex: 1; min-width: 200px; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; background: white; transition: border 0.2s; }
    .search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .format-select { padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; background: white; outline: none; cursor: pointer; }
    .result-count { font-size: 13px; color: #94a3b8; padding: 12px 0; }
    .grid { max-width: 1280px; margin: 24px auto 48px; padding: 0 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 24px; }
    .card { background: white; border-radius: 16px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; transition: transform 0.2s, box-shadow 0.2s; }
    .card:hover { transform: translateY(-4px); box-shadow: 0 8px 28px rgba(99,102,241,0.12); border-color: #c7d2fe; }
    .card.hidden { display: none; }
    .format { display: inline-block; background: #ede9fe; color: #6366f1; border-radius: 999px; padding: 4px 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px; }
    h3 { font-size: 0.95rem; font-weight: 700; margin-bottom: 8px; line-height: 1.4; color: #1e293b; }
    p { font-size: 0.85rem; color: #64748b; line-height: 1.5; }
    .price { margin-top: 18px; font-size: 1.35rem; font-weight: 800; color: #6366f1; }
    .empty { display: none; grid-column: 1/-1; text-align: center; padding: 60px 24px; color: #94a3b8; font-size: 15px; }
    footer { text-align: center; padding: 40px 24px; color: #94a3b8; font-size: 0.85rem; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <header>
    <h1>CreateAI Brain</h1>
    <p>AI-generated digital products — instant delivery worldwide</p>
    <div class="stats">
      <div class="stat"><div class="stat-num" id="visible-count">${products.length}</div><div class="stat-label">Products Available</div></div>
      <div class="stat"><div class="stat-num">6</div><div class="stat-label">Active Channels</div></div>
      <div class="stat"><div class="stat-num">Instant</div><div class="stat-label">Delivery</div></div>
    </div>
  </header>

  <div class="controls">
    <input class="search-input" id="search" type="search" placeholder="Search products…" autocomplete="off" />
    <select class="format-select" id="format-filter">
      <option value="">All formats</option>
      ${Array.from(new Set(products.map(p => p.format))).sort().map(f => `<option value="${f}">${f}</option>`).join("")}
    </select>
    <span class="result-count" id="result-count"></span>
  </div>

  <div class="grid" id="grid">
${productCards}
    <div class="empty" id="empty-state">No products match your search. Try a different term or format.</div>
  </div>
  <footer>Powered by CreateAI Brain · All products AI-generated · Secure checkout via Stripe</footer>
  <script>
    const cards = document.querySelectorAll('.card[data-title]');
    const searchEl = document.getElementById('search');
    const formatEl = document.getElementById('format-filter');
    const countEl = document.getElementById('result-count');
    const visibleCountEl = document.getElementById('visible-count');
    const emptyEl = document.getElementById('empty-state');
    function filterCards() {
      const q = searchEl.value.toLowerCase().trim();
      const fmt = formatEl.value.toLowerCase();
      let shown = 0;
      cards.forEach(card => {
        const title = (card.dataset.title || '').toLowerCase();
        const format = (card.dataset.format || '').toLowerCase();
        const tags = (card.dataset.tags || '').toLowerCase();
        const matchQ = !q || title.includes(q) || tags.includes(q);
        const matchFmt = !fmt || format === fmt;
        if (matchQ && matchFmt) { card.classList.remove('hidden'); shown++; }
        else card.classList.add('hidden');
      });
      countEl.textContent = shown < cards.length ? shown + ' of ' + cards.length + ' products' : '';
      visibleCountEl.textContent = shown;
      emptyEl.style.display = shown === 0 ? 'block' : 'none';
    }
    searchEl.addEventListener('input', filterCards);
    formatEl.addEventListener('change', filterCards);
  </script>
</body>
</html>`;
}

// ── Demand Signal Derivation ───────────────────────────────────────────────────
export function deriveDemandSignals(products: SemanticProduct[]): DemandSignal {
  const formatCounts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.format] = (acc[p.format] || 0) + 1;
    return acc;
  }, {});

  const tagFreq = products.flatMap(p => p.tags).reduce<Record<string, number>>((acc, tag) => {
    if (tag) acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});

  const catCounts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const topFormats = Object.entries(formatCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([format, count]) => ({ format, count, share: Math.round((count / products.length) * 100) }));

  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag, count]) => ({ tag, count }));

  const topCategories = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category, count]) => ({ category, count }));

  const totalRevenuePotential = products.reduce((sum, p) => sum + p.priceCents, 0);

  const maturity: DemandSignal["catalogMaturity"] =
    products.length < 50 ? "early" : products.length < 200 ? "scaling" : "mature";

  const opportunity =
    maturity === "early"
      ? "High growth window — catalog building phase. Increase format diversity."
      : maturity === "scaling"
      ? "Critical mass forming — focus on conversion and channel activation."
      : "Scale achieved — optimize pricing, expand bundles, activate all export channels.";

  return {
    topFormats,
    topTags,
    topCategories,
    totalProducts: products.length,
    totalRevenuePotential: `$${(totalRevenuePotential / 100).toFixed(2)}`,
    activeChannels: 6,
    catalogMaturity: maturity,
    opportunity,
  };
}
