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

export interface SemanticProduct {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  priceCents: number;
  currency: "usd";
  format: ProductFormat | string;
  tags: string[];
  category: string;
  coverImageUrl: string;

  stripeProductId: string;
  stripePriceId: string;
  stripePaymentLinkUrl?: string;

  channels: SemanticChannels;

  views: number;
  sales: number;
  revenueCents: number;

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
