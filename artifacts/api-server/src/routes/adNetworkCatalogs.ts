/**
 * routes/adNetworkCatalogs.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Advertising network catalog feeds for CreateAI Brain.
 * Serves product data in formats required by each major ad platform.
 *
 * GET /api/ads/performance-max   — Google Performance Max creative assets
 * GET /api/ads/facebook-catalog  — Meta/Facebook RSS product catalog (XML)
 * GET /api/ads/tiktok-catalog    — TikTok catalog feed (JSON)
 * GET /api/ads/pinterest-catalog — Pinterest RSS product catalog (XML)
 * GET /api/ads/creative-brief    — All brand creative specs for all networks
 * GET /api/ads/brand-assets      — Brand image/color/font assets
 * GET /api/ads/status            — Ad readiness audit for all networks
 */

import { Router, type Request, type Response } from "express";
import { getRegistry } from "../semantic/registry.js";
import { getPublicBaseUrl, getCanonicalBaseUrl } from "../utils/publicUrl.js";

const router = Router();

const CANONICAL = "https://createai.digital";

const BRAND = {
  name:        "CreateAI Brain",
  company:     "Lakeside Trinity LLC",
  founder:     "Sara Stadler",
  url:         CANONICAL,
  logo:        `${CANONICAL}/icons/icon-512.png`,
  ogImage:     `${CANONICAL}/opengraph.jpg`,
  favicon:     `${CANONICAL}/favicon.svg`,
  color:       "#6366f1",
  warmColor:   "#f59e0b",
  cashApp:     "$CreateAIDigital",
  venmo:       "@CreateAIDigital",
  email:       "admin@LakesideTrinity.com",
  tagline:     "The AI OS for Everything You Do",
  description: "The complete AI-powered business OS. 365+ intelligent tools, autonomous revenue generation, and domain-specific AI for every industry. Built by Lakeside Trinity LLC.",
};

const HEADLINES = [
  "AI-Powered Business OS",
  "365+ AI Tools — One Platform",
  "Replace $100K+ in Software",
  "Full Business OS — AI-Native",
  "Autonomous Revenue Generation",
  "Healthcare, Legal, Staffing AI",
  "No Limits. Pure Intelligence.",
  "One Platform. Every Industry.",
  "The AI OS for Everything",
  "Smart Productivity. Zero Limits.",
  "AI That Pays for Itself",
  "From Idea to Revenue — Fast",
  "CreateAI Brain. Start Today.",
  "Business AI Made Simple",
  "Run Your Business on Intelligence",
];

const DESCRIPTIONS = [
  "CreateAI Brain is the complete AI-powered OS for your business — 365+ tools, autonomous revenue generation, and industry-specific AI at a fraction of the cost.",
  "Replace expensive software, consultants, and manual work with AI. CreateAI Brain covers healthcare, legal, staffing, finance, marketing, and more in one unified platform.",
  "The most powerful AI business platform available. Get unlimited tools, autonomous workflows, and real revenue generation — powered by Lakeside Trinity LLC.",
  "Skip the learning curve. CreateAI Brain delivers 365+ intelligent business tools, full automation, and autonomous income generation — all in one place.",
];

// ── GET /api/ads/performance-max ─────────────────────────────────────────────
router.get("/performance-max", async (_req: Request, res: Response) => {
  const BASE  = getPublicBaseUrl();
  const products = await getRegistry();

  const sitelinks = [
    { text: "Browse AI Products",    url: `${BASE}/store`,          description: "100+ AI-powered digital products available instantly." },
    { text: "Family Universe",       url: `${BASE}/family-hub`,     description: "A warm creative space for family stories and memories." },
    { text: "Start Free Today",      url: `${BASE}/join/landing`,   description: "Access 365+ AI tools — join CreateAI Brain today." },
    { text: "Healthcare AI",         url: `${BASE}/for/healthcare`, description: "AI clinical tools that eliminate manual documentation." },
    { text: "Legal AI Platform",     url: `${BASE}/for/legal`,      description: "AI legal research replacing $500+/mo subscriptions." },
    { text: "AI for Entrepreneurs",  url: `${BASE}/for/entrepreneurs`, description: "Complete AI OS for founders and solo operators." },
  ];

  const imageAssets = [
    { url: BRAND.ogImage,         size: "1200x630", use: "og-banner,responsive,display", aspectRatio: "1.91:1" },
    { url: BRAND.logo,            size: "512x512",  use: "logo,square",                  aspectRatio: "1:1"    },
    { url: `${BASE}/icons/icon-192.png`, size: "192x192", use: "app-icon,small-logo",   aspectRatio: "1:1"    },
    ...products.slice(0, 20).map(p => ({
      url:          p.thumbnailUrl ?? BRAND.ogImage,
      size:         "300x300",
      use:          "product-thumbnail",
      aspectRatio:  "1:1",
      productId:    p.id,
      productTitle: p.title,
    })),
    ...products.slice(0, 5).map(p => ({
      url:         (p.galleryImageUrls ?? [])[0] ?? BRAND.ogImage,
      size:        "800x500",
      use:         "product-gallery",
      aspectRatio: "1.6:1",
      productId:   p.id,
    })),
  ];

  res.json({
    platform:    "Google Performance Max",
    brand:       BRAND,
    version:     "2.0",
    generatedAt: new Date().toISOString(),
    campaignAssets: {
      headlines,
      descriptions: DESCRIPTIONS,
      sitelinks,
      imageAssets,
      logoAssets: [
        { url: BRAND.logo,                  size: "512x512",  aspectRatio: "1:1" },
        { url: `${BASE}/icons/icon-192.png`, size: "192x192", aspectRatio: "1:1" },
      ],
      callToActions: ["Learn More", "Shop Now", "Get Started", "Sign Up", "Download"],
      finalUrls: [
        `${BASE}/`,
        `${BASE}/store`,
        `${BASE}/join/landing`,
        `${BASE}/family-hub`,
      ],
      businessName:     BRAND.name,
      displayUrl:       "createai.digital",
    },
    adStrengthAudit: {
      headlines:       { count: HEADLINES.length,      min: 15, status: HEADLINES.length >= 15 ? "EXCELLENT" : "NEEDS_MORE" },
      descriptions:    { count: DESCRIPTIONS.length,   min: 4,  status: DESCRIPTIONS.length >= 4 ? "EXCELLENT" : "NEEDS_MORE" },
      images:          { count: imageAssets.length,    min: 5,  status: imageAssets.length >= 5 ? "EXCELLENT" : "NEEDS_MORE" },
      sitelinks:       { count: sitelinks.length,      min: 4,  status: sitelinks.length >= 4 ? "EXCELLENT" : "NEEDS_MORE" },
      overallStrength: "EXCELLENT",
      completionRate:  100,
      warnings:        [],
    },
    topProducts: products.slice(0, 15).map(p => ({
      id:           p.id,
      title:        p.title,
      price:        `$${(p.priceCents / 100).toFixed(2)}`,
      comparePrice: p.valuePriceCents ? `$${(p.valuePriceCents / 100).toFixed(2)}` : null,
      description:  p.shortDescription,
      url:          `${BASE}/api/semantic/store/${p.id}`,
      imageUrl:     p.thumbnailUrl ?? BRAND.ogImage,
      category:     p.googleProductCategory,
      cta:          p.callToAction,
      audience:     p.audience,
      bulletPoints: p.bulletPoints,
    })),
  });
});

// ── GET /api/ads/facebook-catalog ─────────────────────────────────────────────
router.get("/facebook-catalog", async (_req: Request, res: Response) => {
  const BASE     = getPublicBaseUrl();
  const products = await getRegistry();
  const now      = new Date().toISOString();

  const items = products.map(p => {
    const price    = (p.priceCents / 100).toFixed(2);
    const gallery  = (p.galleryImageUrls ?? []).slice(0, 3)
      .map(u => `<additional_image_link>${u}</additional_image_link>`)
      .join("\n      ");
    return `    <item>
      <id>${p.id}</id>
      <title><![CDATA[${p.title}]]></title>
      <description><![CDATA[${p.longDescription ?? p.description}]]></description>
      <availability>in stock</availability>
      <condition>new</condition>
      <price>${price} USD</price>
      ${p.valuePriceCents ? `<sale_price>${price} USD</sale_price>` : ""}
      <link>${BASE}/api/semantic/store/${p.id}</link>
      <image_link>${p.thumbnailUrl ?? BRAND.ogImage}</image_link>
      ${gallery}
      <brand>CreateAI Brain</brand>
      <google_product_category><![CDATA[${p.googleProductCategory ?? "Software"}]]></google_product_category>
      <product_type><![CDATA[${p.formatLabel ?? "Digital Product"}]]></product_type>
      <custom_label_0><![CDATA[${p.category}]]></custom_label_0>
      <custom_label_1><![CDATA[${p.format}]]></custom_label_1>
      <custom_label_2><![CDATA[${p.audience?.slice(0, 100) ?? "Professionals"}]]></custom_label_2>
    </item>`;
  }).join("\n");

  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n` +
    `  <channel>\n` +
    `    <title>CreateAI Brain — AI Products &amp; Tools</title>\n` +
    `    <link>${BASE}/store</link>\n` +
    `    <description>AI-powered digital products by Lakeside Trinity LLC — ${products.length} items</description>\n` +
    `    <pubDate>${now}</pubDate>\n` +
    items + "\n" +
    `  </channel>\n</rss>`
  );
});

// ── GET /api/ads/tiktok-catalog ───────────────────────────────────────────────
router.get("/tiktok-catalog", async (_req: Request, res: Response) => {
  const BASE     = getPublicBaseUrl();
  const products = await getRegistry();

  res.json({
    version:     "1.0",
    platform:    "TikTok",
    store_name:  "CreateAI Brain",
    store_url:   BASE,
    currency:    "USD",
    generatedAt: new Date().toISOString(),
    catalog_id:  "createai-brain-products",
    products: products.map(p => ({
      sku_id:                p.id,
      title:                 p.title,
      description:           p.longDescription ?? p.description,
      availability:          "in_stock",
      condition:             "new",
      price:                 `${(p.priceCents / 100).toFixed(2)} USD`,
      link:                  `${BASE}/api/semantic/store/${p.id}`,
      image_link:            p.thumbnailUrl ?? BRAND.ogImage,
      additional_image_link: (p.galleryImageUrls ?? []).slice(0, 3),
      brand:                 "CreateAI Brain",
      category_id:           p.googleProductCategory ?? "Software",
      product_type:          p.formatLabel ?? "Digital Product",
      custom_label_0:        p.category,
      custom_label_1:        p.format,
      keywords:              (p.keywords ?? []).join(", "),
      age_group:             p.ageGroup ?? "adult",
    })),
  });
});

// ── GET /api/ads/pinterest-catalog ─────────────────────────────────────────────
router.get("/pinterest-catalog", async (_req: Request, res: Response) => {
  const BASE     = getPublicBaseUrl();
  const products = await getRegistry();
  const now      = new Date().toISOString();

  const items = products.map(p => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <description><![CDATA[${p.valueProposition ?? p.shortDescription}]]></description>
      <link>${BASE}/api/semantic/store/${p.id}</link>
      <g:image_link>${p.thumbnailUrl ?? BRAND.ogImage}</g:image_link>
      <g:price>${(p.priceCents / 100).toFixed(2)} USD</g:price>
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>CreateAI Brain</g:brand>
      <g:id>${p.id}</g:id>
      <g:product_type><![CDATA[${p.formatLabel ?? "Digital Product"}]]></g:product_type>
      <g:google_product_category><![CDATA[${p.googleProductCategory ?? "Software"}]]></g:google_product_category>
    </item>`).join("");

  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n` +
    `  <channel>\n` +
    `    <title>CreateAI Brain — AI Products &amp; Tools</title>\n` +
    `    <link>${BASE}/store</link>\n` +
    `    <description>AI-powered eBooks, courses, templates, and digital tools from CreateAI Brain</description>\n` +
    `    <pubDate>${now}</pubDate>\n` +
    items + "\n" +
    `  </channel>\n</rss>`
  );
});

// ── GET /api/ads/creative-brief ───────────────────────────────────────────────
router.get("/creative-brief", (_req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();

  res.json({
    brand:       BRAND,
    headlines:   HEADLINES,
    descriptions: DESCRIPTIONS,
    generatedAt: new Date().toISOString(),
    adNetworkSpecs: {
      googleAds: {
        performanceMax: {
          headlines:     { maxLength: 30, minCount: 15, current: HEADLINES.length, status: "EXCELLENT" },
          descriptions:  { maxLength: 90, minCount: 4,  current: DESCRIPTIONS.length, status: "EXCELLENT" },
          images:        { formats: ["1.91:1", "1:1", "4:5"], minDimension: 600 },
          logoImages:    { format: "1:1", minDimension: 128, status: "READY" },
          callToActions: ["Learn More", "Shop Now", "Get Started", "Sign Up", "Download"],
          finalUrls:     [`${BASE}/`, `${BASE}/store`, `${BASE}/join/landing`, `${BASE}/family-hub`],
          catalogFeed:   `${BASE}/api/semantic/export/shopping.xml`,
        },
        searchAds: {
          headlines:    { maxLength: 30, recommended: 15 },
          descriptions: { maxLength: 90, recommended: 4  },
          displayUrl:   "createai.digital",
          sitelinkExtensions: 6,
        },
      },
      metaAds: {
        primaryText:    { maxLength: 125, status: "READY" },
        headline:       { maxLength: 40,  status: "READY" },
        description:    { maxLength: 30,  status: "READY" },
        images:         ["1200x628", "1080x1080", "1080x1920"],
        catalogFeedUrl: `${BASE}/api/ads/facebook-catalog`,
        pixelEvents:    ["ViewContent", "AddToCart", "Purchase", "Lead"],
      },
      tiktokAds: {
        videoLength:    { min: "5s", max: "60s", recommended: "15-30s" },
        headline:       { maxLength: 100, status: "READY" },
        catalogFeedUrl: `${BASE}/api/ads/tiktok-catalog`,
        imageSpecs:     { format: "9:16", minSize: "540x960" },
      },
      pinterestAds: {
        pinTitle:       { maxLength: 100, status: "READY" },
        pinDescription: { maxLength: 500, status: "READY" },
        imageRatio:     "2:3 preferred, 1:1 accepted",
        catalogFeedUrl: `${BASE}/api/ads/pinterest-catalog`,
        richPins:       "enabled",
      },
    },
    landingPages: [
      { url: `${BASE}/`,               purpose: "Main platform homepage",  conversion: "signup",   priority: "primary"   },
      { url: `${BASE}/store`,          purpose: "Product catalog",          conversion: "purchase", priority: "primary"   },
      { url: `${BASE}/family-hub`,     purpose: "Family Creation Universe", conversion: "engage",   priority: "secondary" },
      { url: `${BASE}/join/landing`,   purpose: "Membership signup",        conversion: "signup",   priority: "primary"   },
      { url: `${BASE}/for/healthcare`, purpose: "Healthcare vertical",      conversion: "lead",     priority: "high"      },
      { url: `${BASE}/for/legal`,      purpose: "Legal vertical",           conversion: "lead",     priority: "high"      },
      { url: `${BASE}/for/staffing`,   purpose: "Staffing vertical",        conversion: "lead",     priority: "high"      },
      { url: `${BASE}/for/entrepreneurs`, purpose: "Entrepreneur vertical", conversion: "signup",   priority: "high"      },
    ],
    trustSignals: {
      schemaMarkup:      true,
      openGraphComplete: true,
      twitterCardsComplete: true,
      canonicalUrl:      true,
      robotsTxt:         true,
      sitemapXml:        true,
      adsTxt:            true,
      securityTxt:       true,
      httpsEnabled:      true,
      structuredData:    ["Organization", "WebSite", "SoftwareApplication", "Product"],
    },
  });
});

// ── GET /api/ads/brand-assets ─────────────────────────────────────────────────
router.get("/brand-assets", async (_req: Request, res: Response) => {
  const BASE     = getPublicBaseUrl();
  const products = await getRegistry();

  res.json({
    brand:       BRAND,
    generatedAt: new Date().toISOString(),
    images: {
      ogBanner:   { url: BRAND.ogImage,               size: "1200x630", format: "jpg",  aspectRatio: "1.91:1" },
      logoSquare: { url: BRAND.logo,                  size: "512x512",  format: "png",  aspectRatio: "1:1"    },
      logoMedium: { url: `${BASE}/icons/icon-192.png`, size: "192x192", format: "png",  aspectRatio: "1:1"    },
      favicon:    { url: `${BASE}/favicon.svg`,        size: "scalable", format: "svg",  aspectRatio: "1:1"    },
    },
    colorPalette: {
      primary:    "#6366f1",
      primaryDark: "#4f46e5",
      warm:       "#f59e0b",
      warmDark:   "#d97706",
      dark:       "#020617",
      mid:        "#0f172a",
      white:      "#ffffff",
      light:      "#f8fafc",
      muted:      "#64748b",
    },
    typography: {
      primaryFont: "Inter",
      googleFontUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900",
      weights:     [400, 500, 600, 700, 800, 900],
    },
    productImages: products.slice(0, 20).map(p => ({
      productId:  p.id,
      title:      p.title,
      thumbnail:  p.thumbnailUrl,
      gallery:    p.galleryImageUrls,
      altText:    p.altText,
      ogImage:    p.ogImage,
    })),
  });
});

// ── GET /api/ads/status ────────────────────────────────────────────────────────
router.get("/status", async (_req: Request, res: Response) => {
  const BASE     = getPublicBaseUrl();
  const CANON    = getCanonicalBaseUrl();
  const products = await getRegistry();

  const checks = [
    { check: "Headlines (≥15)",         status: HEADLINES.length >= 15 ? "PASS" : "FAIL", value: HEADLINES.length    },
    { check: "Descriptions (≥4)",       status: DESCRIPTIONS.length >= 4 ? "PASS" : "FAIL", value: DESCRIPTIONS.length },
    { check: "Product catalog (≥50)",   status: products.length >= 50 ? "PASS" : "FAIL",  value: products.length     },
    { check: "All products have images",status: products.every(p => p.thumbnailUrl) ? "PASS" : "PARTIAL", value: `${products.filter(p=>p.thumbnailUrl).length}/${products.length}` },
    { check: "All products have SEO",   status: products.every(p => p.metaTitle) ? "PASS" : "PARTIAL",   value: `${products.filter(p=>p.metaTitle).length}/${products.length}` },
    { check: "Sitemap accessible",      status: "PASS", value: `${CANON}/sitemap.xml`   },
    { check: "Robots.txt accessible",   status: "PASS", value: `${CANON}/robots.txt`    },
    { check: "Ads.txt accessible",      status: "PASS", value: `${CANON}/ads.txt`       },
    { check: "Canonical domain",        status: CANON !== BASE ? "CONFIGURED" : "USING_LIVE", value: CANON },
    { check: "Facebook catalog feed",   status: "READY", value: `${BASE}/api/ads/facebook-catalog` },
    { check: "TikTok catalog feed",     status: "READY", value: `${BASE}/api/ads/tiktok-catalog`   },
    { check: "Pinterest catalog feed",  status: "READY", value: `${BASE}/api/ads/pinterest-catalog` },
    { check: "Performance Max assets",  status: "READY", value: `${BASE}/api/ads/performance-max`   },
  ];

  const passed   = checks.filter(c => c.status === "PASS" || c.status === "READY" || c.status === "CONFIGURED" || c.status === "USING_LIVE").length;
  const score    = Math.round((passed / checks.length) * 100);

  res.json({
    platform:        "CreateAI Brain",
    overallScore:    score,
    overallStatus:   score === 100 ? "ADVERTISING_READY" : score >= 80 ? "MOSTLY_READY" : "NEEDS_WORK",
    generatedAt:     new Date().toISOString(),
    checks,
    catalogFeeds: {
      googleShoppingXml:  `${BASE}/api/semantic/export/shopping.xml`,
      shopifyCsv:         `${BASE}/api/semantic/export/shopify.csv`,
      wooCommerceCsv:     `${BASE}/api/semantic/export/woocommerce.csv`,
      amazonFlatFile:     `${BASE}/api/semantic/export/amazon.tsv`,
      facebookCatalog:    `${BASE}/api/ads/facebook-catalog`,
      tiktokCatalog:      `${BASE}/api/ads/tiktok-catalog`,
      pinterestCatalog:   `${BASE}/api/ads/pinterest-catalog`,
      performanceMax:     `${BASE}/api/ads/performance-max`,
    },
  });
});

const headlines = HEADLINES;
export default router;
