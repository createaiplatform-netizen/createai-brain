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
export function toHostedPageHTML(p: SemanticProduct, checkoutUrl: string, success = false, related: SemanticProduct[] = []): string {
  const price = (p.priceCents / 100).toFixed(2);

  const successBanner = success
    ? `<div role="alert" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #86efac;border-radius:14px;padding:18px 24px;margin-bottom:28px;display:flex;align-items:center;gap:14px;">
        <span style="font-size:1.5rem;" aria-hidden="true">✅</span>
        <div>
          <div style="font-size:0.95rem;font-weight:800;color:#15803d;">Purchase complete — thank you!</div>
          <div style="font-size:0.82rem;color:#16a34a;margin-top:2px;">Your product has been delivered. Check your email for access details.</div>
        </div>
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

  const FORMAT_ICONS: Record<string, string> = {
    ebook: "📖", course: "🎓", template: "📋", audiobook: "🎧",
    video: "🎬", plugin: "🔌", software: "💻", graphic: "🎨",
    music: "🎵", photo: "📷",
  };
  const formatIcon = FORMAT_ICONS[p.format] ?? "📦";

  const relatedHTML = related.length > 0 ? `
<section style="max-width:860px;margin:0 auto 64px;padding:0 24px;" aria-labelledby="related-heading">
  <h2 id="related-heading" style="font-size:1.1rem;font-weight:800;color:#0f172a;margin-bottom:20px;letter-spacing:-0.02em;">You Might Also Like</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
    ${related.map(r => `
    <a href="/api/semantic/store/${r.id}" aria-label="${r.title} — $${(r.priceCents / 100).toFixed(2)}"
       style="display:block;background:white;border:1.5px solid #e8ecf2;border-radius:16px;padding:20px;text-decoration:none;color:inherit;transition:all 0.18s;"
       onmouseover="this.style.borderColor='#6366f1';this.style.boxShadow='0 8px 24px rgba(99,102,241,0.12)';this.style.transform='translateY(-2px)'"
       onmouseout="this.style.borderColor='#e8ecf2';this.style.boxShadow='none';this.style.transform='none'">
      <div style="display:inline-flex;align-items:center;gap:5px;background:#ede9fe;color:#6366f1;border-radius:999px;padding:3px 10px;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">${r.format}</div>
      <div style="font-size:0.875rem;font-weight:700;color:#0f172a;line-height:1.4;margin-bottom:10px;letter-spacing:-0.01em;">${r.title.slice(0, 55)}${r.title.length > 55 ? "…" : ""}</div>
      <div style="font-size:1.05rem;font-weight:900;color:#6366f1;letter-spacing:-0.02em;">$${(r.priceCents / 100).toFixed(2)}</div>
    </a>`).join("")}
  </div>
</section>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${p.title} — CreateAI Brain</title>
  <meta name="description" content="${p.shortDescription}">
  <link rel="canonical" href="/api/semantic/store/${p.id}">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${p.title} — CreateAI Brain">
  <meta property="og:description" content="${p.shortDescription}">
  <meta property="og:image" content="${p.coverImageUrl || ""}">
  <meta property="product:price:amount" content="${(p.priceCents / 100).toFixed(2)}">
  <meta property="product:price:currency" content="${p.currency.toUpperCase()}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${p.title}">
  <meta name="twitter:description" content="${p.shortDescription}">
  <script type="application/ld+json">${jsonLd}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth;scroll-padding-top:70px}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#0f172a;-webkit-font-smoothing:antialiased;line-height:1.5}
    a{color:inherit}

    /* Skip link */
    .skip-link{position:absolute;top:-100%;left:8px;z-index:9999;background:#6366f1;color:#fff;padding:10px 18px;border-radius:0 0 10px 10px;font-size:14px;font-weight:700;text-decoration:none;transition:top 0.15s}
    .skip-link:focus{top:0}
    .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}

    /* Nav */
    .nav{background:rgba(255,255,255,0.97);backdrop-filter:blur(16px);border-bottom:1px solid rgba(226,232,240,0.8);padding:0 28px;position:sticky;top:0;z-index:50;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
    .nav-inner{max-width:1000px;margin:0 auto;display:flex;align-items:center;height:62px;gap:16px}
    .logo{font-size:1.05rem;font-weight:900;letter-spacing:-0.04em;text-decoration:none;color:#0f172a}
    .logo span{color:#6366f1}
    .breadcrumb{display:flex;align-items:center;gap:6px;font-size:0.8rem;color:#94a3b8;margin-left:4px;overflow:hidden}
    .breadcrumb a{color:#6366f1;text-decoration:none;font-weight:600;white-space:nowrap}
    .breadcrumb a:hover{text-decoration:underline}
    .breadcrumb-sep{color:#cbd5e1}
    .breadcrumb-current{color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px}
    .nav-cta{margin-left:auto;display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-radius:9px;padding:8px 18px;font-size:0.8rem;font-weight:700;text-decoration:none;white-space:nowrap;box-shadow:0 2px 8px rgba(99,102,241,0.3);flex-shrink:0}
    .nav-cta:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(99,102,241,0.4);color:white}

    /* Hero */
    .hero{background:linear-gradient(135deg,#0c0e1a 0%,#1e1b4b 60%,#0d1228 100%);padding:64px 28px 110px;text-align:center;position:relative;overflow:hidden}
    .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(99,102,241,0.2) 0%,transparent 65%);pointer-events:none}
    .hero-inner{max-width:720px;margin:0 auto;position:relative}
    .format-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.12);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);border-radius:999px;padding:6px 18px;font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.9);margin-bottom:24px}
    .hero h1{font-size:clamp(1.8rem,4.5vw,3rem);font-weight:900;color:white;line-height:1.1;margin-bottom:18px;letter-spacing:-0.04em}
    .hero-desc{font-size:1.05rem;color:rgba(203,213,225,0.82);line-height:1.7;margin-bottom:36px;max-width:540px;margin-left:auto;margin-right:auto}
    .price-display{display:inline-flex;align-items:baseline;gap:3px}
    .price-currency{font-size:1.75rem;font-weight:700;color:rgba(255,255,255,0.7);line-height:1}
    .price-amount{font-size:4rem;font-weight:900;color:white;line-height:1;letter-spacing:-0.05em}
    .price-note{font-size:0.85rem;color:rgba(203,213,225,0.55);margin-top:6px}

    /* Card */
    .card{max-width:860px;margin:-70px auto 0;background:white;border-radius:24px;box-shadow:0 8px 48px rgba(0,0,0,0.12),0 1px 4px rgba(0,0,0,0.06);padding:0;overflow:hidden}
    .card-body{padding:40px 48px}
    .card-cta{padding:28px 48px;border-top:1px solid #f1f5f9;background:#fafbff}

    /* Features */
    .features{list-style:none;border-radius:14px;overflow:hidden;border:1.5px solid #e8ecf2;margin:0 0 28px}
    .features li{display:flex;align-items:center;gap:14px;padding:14px 18px;font-size:0.88rem;color:#374151;border-bottom:1px solid #f1f5f9;background:white}
    .features li:last-child{border-bottom:none}
    .features li:hover{background:#fafaff}
    .feat-check{width:24px;height:24px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:white;font-size:0.7rem;font-weight:900;flex-shrink:0}

    /* Tags */
    .tags{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:24px}
    .tag{background:#f1f5f9;color:#64748b;border-radius:999px;padding:5px 13px;font-size:0.77rem;font-weight:600;border:1px solid #e2e8f0}

    /* Description */
    .desc-section{margin-bottom:32px}
    .desc-label{font-size:0.7rem;font-weight:800;color:#6366f1;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px}
    .desc-text{color:#475569;line-height:1.78;font-size:0.92rem}

    /* CTA area */
    .buy-btn{display:flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;border-radius:16px;padding:20px 32px;font-size:1.1rem;font-weight:800;cursor:pointer;text-decoration:none;text-align:center;transition:all 0.18s;box-shadow:0 4px 20px rgba(99,102,241,0.35);width:100%;letter-spacing:-0.02em}
    .buy-btn:hover,.buy-btn:focus-visible{background:linear-gradient(135deg,#4f46e5,#7c3aed);transform:translateY(-2px);box-shadow:0 8px 32px rgba(99,102,241,0.50);color:white;outline:none;text-decoration:none}
    .buy-btn:active{transform:translateY(0)}
    .trust-row{display:flex;justify-content:center;align-items:center;gap:20px;margin-top:16px;flex-wrap:wrap}
    .trust-item{display:flex;align-items:center;gap:5px;font-size:0.78rem;color:#94a3b8;font-weight:500}

    /* Payment methods */
    .pay-section{margin-top:24px;padding-top:20px;border-top:1px solid #f1f5f9}
    .pay-label{font-size:0.68rem;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;text-align:center}
    .pay-methods{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
    .pay-pill{display:inline-flex;align-items:center;gap:6px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:999px;padding:7px 16px;font-size:0.78rem;font-weight:700;color:#475569}

    /* Guarantee */
    .guarantee{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #bbf7d0;border-radius:14px;padding:16px 20px;display:flex;align-items:flex-start;gap:12px;margin-top:20px}
    .guar-icon{font-size:1.4rem;flex-shrink:0;margin-top:1px}
    .guar-title{font-size:0.85rem;font-weight:800;color:#15803d;margin-bottom:3px}
    .guar-sub{font-size:0.78rem;color:#16a34a;line-height:1.5}

    /* Preview links */
    .preview-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
    .preview-link{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;font-size:0.8rem;font-weight:600;color:#475569;text-decoration:none;transition:all 0.15s}
    .preview-link:hover,.preview-link:focus-visible{border-color:#6366f1;background:#ede9fe;color:#6366f1;outline:none}

    /* Footer */
    footer{background:#0a0f1e;color:rgba(255,255,255,0.35);padding:36px 28px;text-align:center;font-size:0.8rem;margin-top:64px}
    footer a{color:rgba(255,255,255,0.45);text-decoration:none;margin:0 12px}
    footer a:hover{color:white}
    .footer-links{margin-bottom:12px}

    /* Responsive */
    @media(max-width:640px){
      .card-body{padding:24px 20px}
      .card-cta{padding:20px}
      .hero{padding:48px 16px 90px}
      .hero h1{font-size:clamp(1.6rem,6vw,2.5rem)}
      .price-amount{font-size:3rem}
      .nav{padding:0 16px}
      .breadcrumb-current{max-width:120px}
      .trust-row{gap:12px}
    }
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}
    @media print{.nav,.buy-btn,.preview-links,footer{display:none!important}body{color:#000!important;background:#fff!important}}
  </style>
</head>
<body>

<a class="skip-link" href="#product-main">Skip to main content</a>

<header>
  <nav class="nav" aria-label="Product navigation">
    <div class="nav-inner">
      <a class="logo" href="/" aria-label="CreateAI Brain home">CreateAI <span>Brain</span></a>
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/api/semantic/store">Store</a>
        <span class="breadcrumb-sep" aria-hidden="true">›</span>
        <span class="breadcrumb-current" aria-current="page">${p.title}</span>
      </nav>
      <a href="${checkoutUrl}" class="nav-cta" aria-label="Buy ${p.title} now for $${price}">Buy Now — $${price}</a>
    </div>
  </nav>
</header>

<main id="product-main">
  <div class="hero" aria-label="Product hero">
    <div class="hero-inner">
      <div class="format-badge" aria-label="Product format: ${p.format}">
        <span aria-hidden="true">${formatIcon}</span> ${p.format.charAt(0).toUpperCase() + p.format.slice(1)}
      </div>
      <h1>${p.title}</h1>
      <p class="hero-desc">${p.shortDescription}</p>
      <div class="price-display" aria-label="Price: $${price}">
        <span class="price-currency" aria-hidden="true">$</span>
        <span class="price-amount">${price}</span>
      </div>
      <p class="price-note">One-time purchase · Lifetime access · Instant delivery</p>
    </div>
  </div>

  <div class="card" role="region" aria-label="Product details and purchase">
    <div class="card-body">
      ${successBanner}

      <ul class="features" aria-label="What's included">
        <li><div class="feat-check" aria-hidden="true">✓</div> Instant digital delivery — no waiting, no shipping</li>
        <li><div class="feat-check" aria-hidden="true">✓</div> AI-generated, professionally structured content</li>
        <li><div class="feat-check" aria-hidden="true">✓</div> Full commercial use rights included</li>
        <li><div class="feat-check" aria-hidden="true">✓</div> Lifetime access — yours forever, no expiry</li>
        <li><div class="feat-check" aria-hidden="true">✓</div> Formatted PDF + raw text + web preview included</li>
        <li><div class="feat-check" aria-hidden="true">✓</div> 30-day satisfaction guarantee</li>
      </ul>

      <div class="desc-section">
        <div class="desc-label">Product Description</div>
        <p class="desc-text">${p.description}</p>
      </div>

      ${p.tags.length > 0 ? `<div class="tags" aria-label="Tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>` : ""}

      <div class="preview-links" role="group" aria-label="Preview options">
        <a href="/api/semantic/content/${p.id}/html" target="_blank" class="preview-link" aria-label="Preview content for ${p.title}">
          <span aria-hidden="true">👁</span> Preview Content
        </a>
        <a href="/api/semantic/content/${p.id}/text" class="preview-link" aria-label="Download text sample for ${p.title}">
          <span aria-hidden="true">↓</span> Download Sample
        </a>
        <a href="/api/semantic/portal/me" class="preview-link" aria-label="View my purchases">
          <span aria-hidden="true">📦</span> My Purchases
        </a>
      </div>
    </div>

    <div class="card-cta">
      <a href="${checkoutUrl}" class="buy-btn" role="button" aria-label="Get instant access to ${p.title} for $${price}">
        <span aria-hidden="true">⚡</span> Get Instant Access — $${price}
      </a>

      <div class="trust-row" role="list" aria-label="Trust signals">
        <span class="trust-item" role="listitem"><span aria-hidden="true">🔒</span> Secure via Stripe</span>
        <span class="trust-item" role="listitem"><span aria-hidden="true">⚡</span> Instant delivery</span>
        <span class="trust-item" role="listitem"><span aria-hidden="true">♾️</span> Lifetime access</span>
        <span class="trust-item" role="listitem"><span aria-hidden="true">✅</span> 30-day guarantee</span>
      </div>

      <div class="pay-section">
        <div class="pay-label">Also accepting</div>
        <div class="pay-methods" role="list" aria-label="Alternative payment methods">
          <span class="pay-pill" role="listitem"><span aria-hidden="true">💵</span> Cash App: $CreateAIDigital</span>
          <span class="pay-pill" role="listitem"><span aria-hidden="true">📲</span> Venmo: @CreateAIDigital</span>
        </div>
      </div>

      <div class="guarantee" role="note" aria-label="30-day money-back guarantee">
        <span class="guar-icon" aria-hidden="true">🛡️</span>
        <div>
          <div class="guar-title">30-Day Money-Back Guarantee</div>
          <div class="guar-sub">Not satisfied? We'll refund your purchase within 30 days — no questions asked. Your satisfaction is our promise.</div>
        </div>
      </div>
    </div>
  </div>

  ${relatedHTML}
</main>

<footer>
  <div class="footer-links">
    <a href="/api/semantic/store">All Products</a>
    <a href="/">Platform Home</a>
    <a href="/api/semantic/portal/me">My Downloads</a>
  </div>
  <div>© ${new Date().getFullYear()} CreateAI Brain · Lakeside Trinity LLC · Powered by Stripe · AI-generated digital products</div>
</footer>

</body>
</html>`;
}

// ── Store Index HTML ───────────────────────────────────────────────────────────
export function toStoreIndexHTML(products: SemanticProduct[], storeUrl: string): string {
  const FORMAT_ICONS: Record<string, string> = {
    ebook: "📖", course: "🎓", template: "📋", audiobook: "🎧",
    video: "🎬", plugin: "🔌", software: "💻", graphic: "🎨",
    music: "🎵", photo: "📷",
  };
  const FORMAT_COLORS: Record<string, string> = {
    ebook: "#4f46e5", course: "#0891b2", template: "#059669",
    audiobook: "#7c3aed", video: "#dc2626", plugin: "#ea580c",
    software: "#0f766e", graphic: "#be185d", music: "#ca8a04", photo: "#64748b",
  };

  const formats = Array.from(new Set(products.map(p => p.format))).sort();
  const formatCounts: Record<string, number> = {};
  for (const p of products) formatCounts[p.format] = (formatCounts[p.format] ?? 0) + 1;

  const productCards = products.slice(0, 96).map(p => {
    const tagStr = p.tags.join(" ").replace(/"/g, "&quot;");
    const titleStr = p.title.replace(/"/g, "&quot;");
    const descStr = p.shortDescription.slice(0, 90).replace(/"/g, "&quot;");
    const icon = FORMAT_ICONS[p.format] ?? "📦";
    const color = FORMAT_COLORS[p.format] ?? "#6366f1";
    const tagHTML = p.tags.slice(0, 2).map(t => `<span style="display:inline-block;background:#f1f5f9;border-radius:999px;padding:2px 8px;font-size:0.65rem;font-weight:600;color:#64748b;">${t}</span>`).join(" ");
    return `<a href="${storeUrl}/api/semantic/store/${p.id}" class="pcard" style="text-decoration:none;color:inherit;" data-title="${titleStr}" data-format="${p.format}" data-tags="${tagStr}" aria-label="${titleStr} — $${(p.priceCents / 100).toFixed(2)}">
      <div class="pcard-inner">
        <div class="pfmt" style="background:${color}15;color:${color};border:1px solid ${color}25;">${icon} ${p.format.charAt(0).toUpperCase() + p.format.slice(1)}</div>
        <h3 class="ptitle">${p.title}</h3>
        <p class="pdesc">${p.shortDescription.slice(0, 90)}${p.shortDescription.length > 90 ? "…" : ""}</p>
        <div class="pfoot">
          <div class="ptags">${tagHTML}</div>
          <div class="pprice">$${(p.priceCents / 100).toFixed(2)}</div>
        </div>
        <div class="pcta">Get Access →</div>
      </div>
    </a>`;
  }).join("\n");

  const formatChips = formats.map(f => {
    const color = FORMAT_COLORS[f] ?? "#6366f1";
    const icon = FORMAT_ICONS[f] ?? "📦";
    const count = formatCounts[f] ?? 0;
    return `<button class="fmt-chip" data-fmt="${f}" onclick="setFormat('${f}')" style="color:${color};border-color:${color}40;" aria-label="Filter by ${f} (${count} products)">${icon} ${f.charAt(0).toUpperCase() + f.slice(1)} <span style="opacity:0.6;font-size:0.8em;">(${count})</span></button>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Digital Product Store — CreateAI Brain</title>
  <meta name="description" content="${products.length}+ AI-generated digital products. Ebooks, courses, templates, software, and more. Instant delivery, lifetime access.">
  <link rel="canonical" href="${storeUrl}/api/semantic/store">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#0f172a;-webkit-font-smoothing:antialiased;line-height:1.5}
    a{color:inherit}
    .skip-link{position:absolute;top:-100%;left:8px;z-index:9999;background:#6366f1;color:#fff;padding:10px 18px;border-radius:0 0 10px 10px;font-size:14px;font-weight:700;text-decoration:none;transition:top .15s}
    .skip-link:focus{top:0}
    .nav{background:rgba(255,255,255,.97);backdrop-filter:blur(16px);border-bottom:1px solid #e2e8f0;padding:0 28px;position:sticky;top:0;z-index:50;box-shadow:0 1px 3px rgba(0,0,0,.04)}
    .nav-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;height:62px;gap:20px}
    .logo{font-size:1.05rem;font-weight:900;letter-spacing:-.04em;text-decoration:none;color:#0f172a}
    .logo span{color:#6366f1}
    .nav-links{display:flex;gap:24px;align-items:center;margin-left:auto}
    .nav-links a{font-size:.875rem;font-weight:600;color:#475569;text-decoration:none;transition:color .15s}
    .nav-links a:hover{color:#6366f1}
    .nav-cta{background:linear-gradient(135deg,#6366f1,#8b5cf6)!important;color:white!important;border-radius:9px;padding:8px 18px;box-shadow:0 2px 8px rgba(99,102,241,.3)}
    .hero{background:linear-gradient(135deg,#0c0e1a,#1e1b4b 55%,#0d1228);padding:64px 28px 80px;text-align:center;position:relative;overflow:hidden}
    .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(99,102,241,.2) 0%,transparent 65%);pointer-events:none}
    .hero-inner{max-width:720px;margin:0 auto;position:relative}
    .hero h1{font-size:clamp(2rem,4.5vw,3.2rem);font-weight:900;color:white;line-height:1.08;margin-bottom:14px;letter-spacing:-.05em}
    .hero h1 span{background:linear-gradient(90deg,#818cf8,#c4b5fd);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .hero p{font-size:1.05rem;color:rgba(203,213,225,.8);line-height:1.7;margin-bottom:0}
    .stats-bar{background:white;border-bottom:1px solid #e2e8f0;padding:22px 28px}
    .stats-inner{max-width:1280px;margin:0 auto;display:flex;justify-content:center;gap:48px;flex-wrap:wrap}
    .stat{text-align:center}
    .stat-num{font-size:1.75rem;font-weight:900;color:#6366f1;letter-spacing:-.03em;line-height:1}
    .stat-lbl{font-size:.68rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-top:3px}
    .controls{max-width:1280px;margin:0 auto;padding:28px 24px 0}
    .search-wrap{display:flex;align-items:center;gap:10px;background:white;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px 16px;transition:all .15s;margin-bottom:18px}
    .search-wrap:focus-within{border-color:#6366f1;box-shadow:0 0 0 4px rgba(99,102,241,.10)}
    .search-icon{color:#94a3b8;font-size:1.05rem;flex-shrink:0}
    .search-input{flex:1;background:none;border:none;outline:none;font-size:.9rem;font-family:inherit;color:#0f172a}
    .search-input::placeholder{color:#94a3b8}
    .fmt-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
    .fmt-chip{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:6px 14px;font-size:.78rem;font-weight:700;text-decoration:none;border:1.5px solid;background:transparent;cursor:pointer;transition:all .15s;font-family:inherit}
    .fmt-chip:hover,.fmt-chip.active{color:white!important}
    .fmt-chip-all{border-color:#6366f1;color:#6366f1;}
    .fmt-chip-all.active,.fmt-chip-all:hover{background:#6366f1!important;color:white!important}
    .controls-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px}
    .result-count{font-size:.8rem;color:#94a3b8;font-weight:500}
    .sort-select{padding:7px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.8rem;background:white;outline:none;cursor:pointer;font-family:inherit;color:#475569}
    .grid{max-width:1280px;margin:0 auto 64px;padding:0 24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
    .pcard{display:block;background:white;border-radius:18px;border:1.5px solid #e8ecf2;transition:all .18s;position:relative;overflow:hidden}
    .pcard:hover,.pcard:focus-visible{border-color:#6366f1;box-shadow:0 10px 36px rgba(99,102,241,.15),0 2px 8px rgba(0,0,0,.04);transform:translateY(-3px);outline:none}
    .pcard.hidden{display:none}
    .pcard-inner{padding:22px 22px 18px}
    .pfmt{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:4px 12px;font-size:.7rem;font-weight:700;margin-bottom:12px;letter-spacing:.01em}
    .ptitle{font-size:.9rem;font-weight:800;color:#0f172a;line-height:1.35;margin-bottom:8px;letter-spacing:-.01em}
    .pdesc{font-size:.78rem;color:#64748b;line-height:1.55;margin-bottom:14px}
    .pfoot{display:flex;align-items:flex-end;justify-content:space-between;gap:6px;margin-bottom:12px}
    .ptags{display:flex;flex-wrap:wrap;gap:4px;flex:1}
    .pprice{font-size:1.1rem;font-weight:900;color:#6366f1;letter-spacing:-.02em;flex-shrink:0}
    .pcta{font-size:.72rem;font-weight:700;color:#6366f1;border-top:1px solid #f1f5f9;padding-top:10px}
    .pcard:hover .pcta,.pcard:focus-visible .pcta{text-decoration:underline}
    .empty{display:none;grid-column:1/-1;text-align:center;padding:64px 24px;color:#94a3b8}
    .empty-icon{font-size:2.5rem;margin-bottom:12px}
    .empty-title{font-size:1rem;font-weight:700;color:#475569;margin-bottom:6px}
    .empty-sub{font-size:.85rem}
    footer{background:#0a0f1e;color:rgba(255,255,255,.35);padding:36px 24px;text-align:center;font-size:.8rem}
    footer a{color:rgba(255,255,255,.45);text-decoration:none;margin:0 12px}
    footer a:hover{color:white}
    .footer-links{margin-bottom:10px}
    @media(max-width:640px){.nav{padding:0 16px}.hero{padding:48px 16px 60px}.controls{padding:20px 16px 0}.grid{padding:0 16px}.stats-inner{gap:24px}.stat-num{font-size:1.5rem}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
  </style>
</head>
<body>

<a class="skip-link" href="#store-main">Skip to main content</a>

<header>
  <nav class="nav" aria-label="Store navigation">
    <div class="nav-inner">
      <a class="logo" href="/" aria-label="CreateAI Brain home">CreateAI <span>Brain</span></a>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/api/semantic/portal/me">My Downloads</a>
        <a href="/api/semantic/store" class="nav-cta">Store</a>
      </div>
    </div>
  </nav>
</header>

<main id="store-main">
  <section class="hero" aria-label="Store introduction">
    <div class="hero-inner">
      <h1>Digital Product <span>Store</span></h1>
      <p>${products.length}+ AI-generated products — ebooks, courses, templates, software &amp; more. Instant delivery, lifetime access.</p>
    </div>
  </section>

  <div class="stats-bar" aria-label="Store statistics">
    <div class="stats-inner">
      <div class="stat"><div class="stat-num" id="visible-count" aria-live="polite" aria-atomic="true">${products.length}</div><div class="stat-lbl">Products</div></div>
      <div class="stat"><div class="stat-num">${formats.length}</div><div class="stat-lbl">Formats</div></div>
      <div class="stat"><div class="stat-num">⚡</div><div class="stat-lbl">Instant Delivery</div></div>
      <div class="stat"><div class="stat-num">∞</div><div class="stat-lbl">Lifetime Access</div></div>
    </div>
  </div>

  <div class="controls">
    <label for="search" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">Search products</label>
    <div class="search-wrap" role="search">
      <span class="search-icon" aria-hidden="true">🔍</span>
      <input class="search-input" id="search" type="search" placeholder="Search ${products.length} products…" autocomplete="off" spellcheck="false" aria-label="Search products">
    </div>
    <div class="fmt-row" role="group" aria-label="Filter by format">
      <button class="fmt-chip fmt-chip-all active" data-fmt="" onclick="setFormat('')" aria-pressed="true">All (${products.length})</button>
      ${formatChips}
    </div>
    <div class="controls-bar">
      <span class="result-count" id="result-count" aria-live="polite" aria-atomic="true"></span>
      <select class="sort-select" id="sort-select" aria-label="Sort products">
        <option value="default">Sort: Default</option>
        <option value="price-asc">Price: Low → High</option>
        <option value="price-desc">Price: High → Low</option>
        <option value="name-asc">Name: A → Z</option>
      </select>
    </div>
  </div>

  <div class="grid" id="grid" aria-label="Product catalog">
    ${productCards}
    <div class="empty" id="empty-state" role="status" aria-live="polite">
      <div class="empty-icon" aria-hidden="true">🔍</div>
      <div class="empty-title">No products match your search</div>
      <div class="empty-sub">Try a different keyword or select "All" to see every product.</div>
    </div>
  </div>
</main>

<footer>
  <div class="footer-links">
    <a href="/">Platform Home</a>
    <a href="/api/semantic/portal/me">My Downloads</a>
    <a href="/api/semantic/export/shopify.csv">Export (Shopify)</a>
  </div>
  <div>© ${new Date().getFullYear()} CreateAI Brain · Lakeside Trinity LLC · All products AI-generated · Secure checkout via Stripe</div>
</footer>

<script>
(function() {
  var cards = Array.from(document.querySelectorAll('.pcard'));
  var searchEl = document.getElementById('search');
  var countEl = document.getElementById('result-count');
  var visibleCountEl = document.getElementById('visible-count');
  var emptyEl = document.getElementById('empty-state');
  var sortEl = document.getElementById('sort-select');
  var activeFormat = '';

  function getPriceCents(card) {
    var priceEl = card.querySelector('.pprice');
    if (!priceEl) return 0;
    return Math.round(parseFloat(priceEl.textContent.replace('$','')) * 100);
  }

  function filterAndSort() {
    var q = searchEl.value.toLowerCase().trim();
    var fmt = activeFormat.toLowerCase();
    var shown = 0;
    cards.forEach(function(card) {
      var title = (card.dataset.title || '').toLowerCase();
      var format = (card.dataset.format || '').toLowerCase();
      var tags = (card.dataset.tags || '').toLowerCase();
      var matchQ = !q || title.includes(q) || tags.includes(q) || format.includes(q);
      var matchFmt = !fmt || format === fmt;
      if (matchQ && matchFmt) { card.classList.remove('hidden'); shown++; }
      else card.classList.add('hidden');
    });
    countEl.textContent = shown < cards.length ? shown + ' of ' + cards.length + ' products' : '';
    visibleCountEl.textContent = shown;
    emptyEl.style.display = shown === 0 ? 'block' : 'none';
    var sort = sortEl.value;
    var grid = document.getElementById('grid');
    var visible = cards.filter(function(c) { return !c.classList.contains('hidden'); });
    if (sort === 'price-asc') visible.sort(function(a,b){ return getPriceCents(a)-getPriceCents(b); });
    else if (sort === 'price-desc') visible.sort(function(a,b){ return getPriceCents(b)-getPriceCents(a); });
    else if (sort === 'name-asc') visible.sort(function(a,b){ return (a.dataset.title||'').localeCompare(b.dataset.title||''); });
    visible.forEach(function(c) { grid.appendChild(c); });
  }

  window.setFormat = function(fmt) {
    activeFormat = fmt;
    document.querySelectorAll('.fmt-chip').forEach(function(btn) {
      var active = btn.dataset.fmt === fmt;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active) {
        var color = btn.style.color;
        btn.style.background = color === 'rgb(99, 102, 241)' || !color ? '#6366f1' : color;
        btn.style.color = 'white';
        btn.style.borderColor = 'transparent';
      } else {
        btn.style.background = '';
        var origColor = btn.style.color;
        btn.style.borderColor = btn.getAttribute('style').match(/border-color:[^;]+/)?.[0]?.split(':')[1]?.trim() || '#e2e8f0';
      }
    });
    filterAndSort();
  };

  if (searchEl) { searchEl.addEventListener('input', filterAndSort); searchEl.addEventListener('keydown', function(e){ if(e.key==='Escape'){this.value='';filterAndSort();} }); }
  if (sortEl) sortEl.addEventListener('change', filterAndSort);
})();
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
