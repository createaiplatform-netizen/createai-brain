/**
 * nexus/spaces.ts — Unified Space Registry
 * ──────────────────────────────────────────
 * A Space is the single primitive for everything that was previously a
 * SpaceNode (SSAP), IntentEntry (CORE), and Surface (CORE) — unified.
 *
 * Access model: hierarchical levels (not flat whitelists)
 *   owner=4 > creator=3 > customer=2 > visitor=1
 *   A space with minLevel=2 is accessible to customer, creator, owner.
 */

export type SpaceLevel = 1 | 2 | 3 | 4;

export type RoleName = "owner" | "creator" | "customer" | "visitor";

export const ROLE_LEVEL: Record<RoleName, SpaceLevel> = {
  owner:    4,
  creator:  3,
  customer: 2,
  visitor:  1,
};

export const LEVEL_ROLE: Record<SpaceLevel, RoleName> = {
  4: "owner",
  3: "creator",
  2: "customer",
  1: "visitor",
};

export interface SubSpace {
  id:          string;
  signal:      string;   // @launch/deliver
  verbs:       string[];
  concepts:    string[];
  description: string;
  urlSuffix:   string;   // appended to parent path
}

export interface Space {
  id:          string;       // sp_vault — stable, never changes
  // ── Addressing (unified SSAP + CORE) ────────────────────────────────────
  signal:      string;       // @vault — unique signal handle
  code:        string;       // ~V — opaque machine shortcode
  // ── Semantics (unified verbs + concepts + tags from both systems) ───────
  verbs:       string[];     // action words: earn, pay, withdraw
  concepts:    string[];     // noun space: balance, money, stripe, funds
  tags:        string[];     // classifier: finance, revenue, admin
  description: string;       // one human sentence
  // ── Routing ──────────────────────────────────────────────────────────────
  path:        string;       // canonical URL (absolute if external)
  external:    boolean;
  // ── Access control (level-based, not whitelist) ───────────────────────
  minLevel:    SpaceLevel;   // minimum level to access; 1 = everyone
  // ── Organization ─────────────────────────────────────────────────────────
  category:    string;       // Revenue | Commerce | Admin | System | Content | Public
  icon:        string;       // emoji
  // ── Relationships ────────────────────────────────────────────────────────
  related:     string[];     // IDs of related spaces
  subspaces?:  SubSpace[];   // tab-/state-level deep addresses
}

// ─────────────────────────────────────────────────────────────────────────────
// SPACE REGISTRY — built once at module load with the given base URL
// ─────────────────────────────────────────────────────────────────────────────
export function buildSpaces(BASE: string): Space[] {
  return [

    // ── REVENUE (minLevel 3 = creator+) ───────────────────────────────────

    {
      id: "sp_vault", signal: "@vault", code: "~V",
      verbs:    ["earn", "pay", "payout", "withdraw", "transfer", "money", "funds", "cash"],
      concepts: ["balance", "stripe", "bank", "available", "pending", "revenue", "earnings"],
      tags:     ["finance", "revenue", "cashflow"],
      description: "Balance, payouts, Move Money — your private payment command center.",
      path: `${BASE}/vault`, external: false, minLevel: 3, category: "Revenue", icon: "💰",
      related: ["sp_payouts", "sp_balance_ext", "sp_launch"],
      subspaces: [
        { id: "sp_vault_data", signal: "@vault/data", verbs: ["fetch", "api", "json"], concepts: ["api","data"], description: "Vault JSON data endpoint", urlSuffix: "/data" },
      ],
    },

    {
      id: "sp_launch", signal: "@launch", code: "~L",
      verbs:    ["sell", "launch", "deliver", "fulfill", "dispatch", "send", "ship"],
      concepts: ["payments", "delivery", "orders", "customers", "sales", "console", "live"],
      tags:     ["ops", "fulfillment", "revenue"],
      description: "Revenue Launch Console — live payments, one-click delivery, full product table.",
      path: `${BASE}/launch/`, external: false, minLevel: 3, category: "Revenue", icon: "🚀",
      related: ["sp_vault", "sp_store", "sp_payments_feed"],
      subspaces: [
        { id: "sp_launch_deliver", signal: "@launch/deliver", verbs: ["deliver","send","fulfill"], concepts: ["delivery","customer","email"], description: "Delivery panel — send product to buyer", urlSuffix: "" },
        { id: "sp_launch_payments", signal: "@launch/payments", verbs: ["track","payments","feed","live"], concepts: ["payments","stream","stripe","real-time"], description: "Live payment feed", urlSuffix: "payments" },
        { id: "sp_launch_products", signal: "@launch/products", verbs: ["list","products","catalog"], concepts: ["products","sku","all"], description: "All products table", urlSuffix: "" },
      ],
    },

    {
      id: "sp_payments_feed", signal: "@feed", code: "~F",
      verbs:    ["track", "monitor", "watch", "live", "realtime"],
      concepts: ["payments", "feed", "stream", "stripe", "real-time", "orders"],
      tags:     ["ops", "revenue", "live"],
      description: "Real-time Stripe session stream with delivery status.",
      path: `${BASE}/launch/payments`, external: false, minLevel: 3, category: "Revenue", icon: "⚡",
      related: ["sp_launch", "sp_vault"],
    },

    // ── COMMERCE (minLevel 1 = all) ───────────────────────────────────────

    {
      id: "sp_store", signal: "@store", code: "~S",
      verbs:    ["browse", "shop", "discover", "find", "explore", "search"],
      concepts: ["products", "catalog", "ebooks", "courses", "templates", "digital", "items"],
      tags:     ["commerce", "storefront", "public"],
      description: "Public product catalog — all 100 AI-generated digital products.",
      path: `${BASE}/store`, external: false, minLevel: 1, category: "Commerce", icon: "🛍",
      related: ["sp_join", "sp_portal", "sp_launch"],
    },

    {
      id: "sp_portal", signal: "@portal", code: "~P",
      verbs:    ["access", "login", "retrieve", "redownload", "check", "history"],
      concepts: ["customer", "purchases", "downloads", "account", "receipts", "orders"],
      tags:     ["customer", "self-service"],
      description: "Customer portal — email-gated purchase history and re-download links.",
      path: `${BASE}/portal/me`, external: false, minLevel: 1, category: "Commerce", icon: "📬",
      related: ["sp_store", "sp_join"],
    },

    {
      id: "sp_join", signal: "@join", code: "~J",
      verbs:    ["subscribe", "join", "upgrade", "become", "enroll", "member"],
      concepts: ["membership", "subscription", "plans", "tier", "monthly", "recurring"],
      tags:     ["subscriptions", "membership"],
      description: "Membership landing — subscription tiers at $29 / $79 / $299/mo.",
      path: `${BASE}/join/landing`, external: false, minLevel: 1, category: "Commerce", icon: "👑",
      related: ["sp_store", "sp_portal"],
    },

    {
      id: "sp_home", signal: "@home", code: "~M",
      verbs:    ["home", "start", "begin", "root", "front", "land"],
      concepts: ["homepage", "platform", "front", "entry", "index", "brand"],
      tags:     ["public", "entry"],
      description: "Platform homepage — public-facing brand entry with featured products.",
      path: `${BASE}/`, external: false, minLevel: 1, category: "Public", icon: "⬡",
      related: ["sp_store", "sp_join"],
    },

    // ── ADMIN (minLevel 4 = owner only) ──────────────────────────────────

    {
      id: "sp_hub", signal: "@hub", code: "~H",
      verbs:    ["admin", "overview", "directory", "navigate", "control", "manage"],
      concepts: ["admin", "directory", "platform", "surfaces", "all", "index"],
      tags:     ["admin", "navigation"],
      description: "Admin Hub — every platform surface in one directory.",
      path: `${BASE}/hub`, external: false, minLevel: 4, category: "Admin", icon: "⊞",
      related: ["sp_nexus", "sp_vault", "sp_launch"],
    },

    {
      id: "sp_analytics", signal: "@data", code: "~A",
      verbs:    ["analyze", "measure", "score", "health", "metrics", "monitor"],
      concepts: ["analytics", "score", "domains", "capability", "platform", "health"],
      tags:     ["analytics", "admin"],
      description: "Platform Score — 17/20 domain capability health dashboard.",
      path: `${BASE}/api/semantic/analytics/`, external: false, minLevel: 4, category: "Admin", icon: "📊",
      related: ["sp_hub", "sp_vault"],
    },

    // ── CONTENT (minLevel 3 = creator+) ──────────────────────────────────

    {
      id: "sp_content", signal: "@content", code: "~X",
      verbs:    ["create", "generate", "write", "produce", "make", "ai"],
      concepts: ["ai", "generation", "content", "copy", "text", "writing", "gpt"],
      tags:     ["ai", "content"],
      description: "AI Content Engine — generate product descriptions, emails, copy.",
      path: `${BASE}/api/semantic/content/`, external: false, minLevel: 3, category: "Content", icon: "✍",
      related: ["sp_store", "sp_launch"],
    },

    {
      id: "sp_shopify", signal: "@shopify", code: "~E",
      verbs:    ["export", "sync", "feed", "download", "import"],
      concepts: ["shopify", "csv", "export", "products", "woocommerce", "feed"],
      tags:     ["export", "commerce"],
      description: "Export feeds — Shopify CSV, WooCommerce CSV, Google XML, Amazon flat.",
      path: `${BASE}/export/shopify.csv`, external: false, minLevel: 3, category: "Content", icon: "📦",
      related: ["sp_store", "sp_analytics"],
    },

    // ── SYSTEM (minLevel 3) ───────────────────────────────────────────────

    {
      id: "sp_nexus", signal: "@nexus", code: "~N",
      verbs:    ["navigate", "nexus", "command", "control", "resolve", "find", "all"],
      concepts: ["nexus", "navigation", "identity", "presence", "ai", "addressing"],
      tags:     ["system", "meta", "ai-native"],
      description: "NEXUS — the unified platform operating intelligence.",
      path: `${BASE}/nexus`, external: false, minLevel: 1, category: "System", icon: "◉",
      related: ["sp_hub", "sp_core_legacy", "sp_ss_legacy"],
    },

    {
      id: "sp_core_legacy", signal: "@core", code: "~C",
      verbs:    ["core", "identity", "presence", "login", "enter"],
      concepts: ["core", "presence", "identity", "token", "role"],
      tags:     ["system", "legacy"],
      description: "CORE Console — legacy identity and intent navigation system.",
      path: `${BASE}/core`, external: false, minLevel: 1, category: "System", icon: "◎",
      related: ["sp_nexus"],
    },

    {
      id: "sp_ss_legacy", signal: "@ss", code: "~Z",
      verbs:    ["signal", "ssap", "address", "route"],
      concepts: ["signalspace", "ssap", "addressing", "signals", "nodes"],
      tags:     ["system", "legacy"],
      description: "SignalSpace — legacy semantic addressing console (SSAP/1.0).",
      path: `${BASE}/ss`, external: false, minLevel: 1, category: "System", icon: "⬡",
      related: ["sp_nexus"],
    },

    // ── EXTERNAL (minLevel 3) ─────────────────────────────────────────────

    {
      id: "sp_balance_ext", signal: "@balance", code: "~B",
      verbs:    ["view", "check", "see", "open"],
      concepts: ["balance", "stripe", "available", "pending", "dashboard"],
      tags:     ["stripe", "external"],
      description: "Stripe Balance — opens stripe.com balance overview directly.",
      path: "https://dashboard.stripe.com/balance/overview", external: true, minLevel: 3, category: "Revenue", icon: "🏦",
      related: ["sp_vault", "sp_payouts"],
    },

    {
      id: "sp_payouts", signal: "@payouts", code: "~T",
      verbs:    ["payout", "withdraw", "transfer", "bank"],
      concepts: ["payouts", "stripe", "bank", "transfer", "history"],
      tags:     ["stripe", "external"],
      description: "Stripe Payouts — bank transfer history and payout management.",
      path: "https://dashboard.stripe.com/payouts", external: true, minLevel: 3, category: "Revenue", icon: "➡",
      related: ["sp_vault", "sp_balance_ext"],
    },

  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function canAccess(space: Space, level: SpaceLevel): boolean {
  return level >= space.minLevel;
}

export function accessibleSpaces(spaces: Space[], level: SpaceLevel): Space[] {
  return spaces.filter(s => canAccess(s, level));
}

/** Find a space by any address (signal, code, id, verb, concept) — no scoring */
export function findExact(spaces: Space[], term: string): Space | undefined {
  const t = term.toLowerCase().replace(/^@|^~/, "");
  return spaces.find(s =>
    s.signal === `@${t}` ||
    s.code   === `~${t.toUpperCase()}` ||
    s.id     === term ||
    s.verbs.includes(t)
  );
}
