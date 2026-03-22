/**
 * semantic/types.ts
 * -----------------
 * The Semantic Product Object — the core data structure of the Semantic Product Layer.
 *
 * A SemanticProduct is marketplace-agnostic. It is the single source of truth
 * from which ALL channel outputs are derived: Shopify CSV, WooCommerce CSV,
 * Google Shopping XML, Amazon feed, Stripe checkout, and hosted product page.
 *
 * No channel is privileged. Every channel is an output transform.
 */

export type ProductFormat =
  | "ebook"
  | "audiobook"
  | "video"
  | "course"
  | "template"
  | "software"
  | "graphic"
  | "music"
  | "photo"
  | "3D"
  | "plugin"
  | "digital";

export type ChannelStatus = "live" | "ready" | "pending" | "none";

export interface SemanticChannels {
  stripe: ChannelStatus;
  hostedPage: ChannelStatus;
  shopifyCsv: ChannelStatus;
  woocommerceCsv: ChannelStatus;
  googleShopping: ChannelStatus;
  amazonFeed: ChannelStatus;
}

// ── Advertising-Grade Product Fields ─────────────────────────────────────────

export interface SemanticProduct {
  // ── Core identity ──────────────────────────────────────────────────────────
  id: string;
  slug: string;
  title: string;

  // ── Descriptions (all tiers) ───────────────────────────────────────────────
  description: string;           // 1-2 sentences — used in cards & short blurbs
  shortDescription: string;      // ≤140 chars — used in feeds & og tags
  longDescription: string;       // 300-500 chars — used on product pages & Shopify body

  // ── Pricing ────────────────────────────────────────────────────────────────
  priceCents: number;
  currency: "usd";
  valuePriceCents?: number;      // "retail value" display price

  // ── Classification ─────────────────────────────────────────────────────────
  format: ProductFormat | string;
  formatLabel: string;           // Human-readable: "PDF eBook", "Video Course", etc.
  productType: string;           // "digital" | "physical" | "service"
  category: string;
  tags: string[];
  keywords: string[];            // 5-10 SEO-focused keyword phrases

  // ── Media ──────────────────────────────────────────────────────────────────
  coverImageUrl: string;         // Main product cover (landscape 600x400)
  thumbnailUrl: string;          // Square thumbnail for ad feeds (300x300)
  galleryImageUrls: string[];    // 3-5 additional product images
  videoPreviewUrl: string;       // Embed-ready video preview URL (YouTube/Vimeo or "")
  altText: string;               // Descriptive alt text for primary image

  // ── SEO & Ad Metadata ──────────────────────────────────────────────────────
  metaTitle: string;             // ≤60 chars — page <title> tag
  metaDescription: string;       // ≤160 chars — meta description
  ogImage: string;               // Open Graph image URL (1200x630 preferred)
  structuredDataType: string;    // schema.org @type: "Product" | "Book" | "Course" | etc.

  // ── Ad Network Fields ──────────────────────────────────────────────────────
  brand: string;                 // Brand name for Google Shopping / Amazon
  condition: "new" | "used" | "refurbished";
  availability: "in stock" | "out of stock" | "preorder";
  gtin?: string;                 // GTIN (not available for digital — omit)
  mpn: string;                   // Manufacturer part number (SKU)
  googleProductCategory: string; // Google taxonomy category ID/name
  ageGroup: string;              // "adult" | "all ages" etc.

  // ── Conversion Optimization ────────────────────────────────────────────────
  audience: string;              // Target audience description
  valueProposition: string;      // One-liner benefit statement
  callToAction: string;          // Primary CTA button text
  socialProof: string;           // Social proof / testimonial teaser
  bulletPoints: string[];        // 4-6 key feature bullets for product pages

  // ── Stripe ─────────────────────────────────────────────────────────────────
  stripeProductId: string;
  stripePriceId: string;
  stripePaymentLinkUrl?: string;

  // ── Channel readiness ──────────────────────────────────────────────────────
  channels: SemanticChannels;

  // ── Analytics ──────────────────────────────────────────────────────────────
  views: number;
  sales: number;
  revenueCents: number;

  // ── Timestamps ─────────────────────────────────────────────────────────────
  createdAt: string;
  updatedAt: string;
}

export interface SemanticCatalog {
  generated: string;
  platform: string;
  version: string;
  count: number;
  channels: string[];
  products: SemanticProduct[];
}

export interface DemandSignal {
  topFormats: Array<{ format: string; count: number; share: number }>;
  topTags: Array<{ tag: string; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
  totalProducts: number;
  totalRevenuePotential: string;
  activeChannels: number;
  catalogMaturity: "early" | "scaling" | "mature";
  opportunity: string;
}
