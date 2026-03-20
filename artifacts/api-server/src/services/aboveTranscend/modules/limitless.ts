/**
 * modules/limitless.ts — Limitless Self-Upgrading Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements:
 *   LimitlessModule   — self-expanding module tree (50% emergent growth per run)
 *   MarketplaceEngine — uniqueness-enforced creator marketplace (SHA-256 hashing)
 *   LimitlessReport   — per-cycle output shape
 */

import crypto from "node:crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LimitlessModuleResult {
  name: string;
  state:  Record<string, unknown>;
  hash:   string;
  submoduleCount:      number;
  totalSubmoduleCount: number;
  emergentCreated:     boolean;
  emergentName:        string | null;
  subResults:          LimitlessModuleResult[];
  runMs:               number;
}

export interface MarketplaceUser {
  id:        string;
  name:      string;
  earnings:  number;
  joinedAt:  string;
}

export interface MarketplaceItem {
  id:          string;
  creator:     string;
  creatorName: string;
  name:        string;
  description: string;
  price:       number;
  hash:        string;
  createdAt:   string;
  purchases:   number;
}

export interface MarketplaceDemoResult {
  perUser:          Record<string, number>;
  scaledTotal:      number;
  platformEarnings: number;
}

export interface LimitlessReport {
  cycleNumber:         number;
  score:               number;
  impact:              number;
  compliance:          number;
  actions:             string[];
  // LimitlessModule tree stats
  totalEmergentModules: number;
  coreSubmoduleCount:   number;
  emergentThisCycle:    boolean;
  newEmergentName:      string | null;
  coreHash:             string;
  coreRunMs:            number;
  // Marketplace
  marketplaceUsers:    MarketplaceUser[];
  marketplaceItems:    MarketplaceItem[];
  marketplaceDemo:     MarketplaceDemoResult;
  marketplaceStats: {
    userCount:         number;
    itemCount:         number;
    totalTransactions: number;
    platformEarnings:  number;
  };
}

// ─── LimitlessModule ──────────────────────────────────────────────────────────

export class LimitlessModule {
  readonly name: string;
  private submodules: LimitlessModule[] = [];
  private state: Record<string, unknown> = {};
  readonly hash: string;
  private totalRuns = 0;
  private allEmergentCount = 0;         // all emergents created in this subtree

  constructor(name: string) {
    this.name = name;
    this.hash = crypto.createHash("sha256")
      .update(name + Date.now().toString())
      .digest("hex")
      .slice(0, 16);
  }

  async run(globalState: Record<string, unknown>): Promise<LimitlessModuleResult> {
    const t0 = Date.now();
    this.totalRuns++;
    this.state = { ...this.state, ...globalState, totalRuns: this.totalRuns };

    // 50% chance — create a new emergent submodule
    const emergentCreated = Math.random() < 0.5;
    let emergentName: string | null = null;
    if (emergentCreated) {
      const eName = `Emergent-${this.name}-${Date.now()}`;
      this.submodules.push(new LimitlessModule(eName));
      this.allEmergentCount++;
      emergentName = eName;
    }

    const subResults = await Promise.all(
      this.submodules.map(m => m.run(globalState))
    );

    return {
      name:                this.name,
      state:               this.state,
      hash:                this.hash,
      submoduleCount:      this.submodules.length,
      totalSubmoduleCount: this.totalSubmoduleCount(),
      emergentCreated,
      emergentName,
      subResults,
      runMs:               Date.now() - t0,
    };
  }

  totalSubmoduleCount(): number {
    return this.submodules.reduce((sum, m) => sum + 1 + m.totalSubmoduleCount(), 0);
  }

  getTotalEmergentCreated(): number {
    return this.allEmergentCount +
      this.submodules.reduce((sum, m) => sum + m.getTotalEmergentCreated(), 0);
  }
}

// ─── MarketplaceEngine ────────────────────────────────────────────────────────

export class MarketplaceEngine {
  private users: Map<string, MarketplaceUser>  = new Map();
  private items: Map<string, MarketplaceItem>  = new Map();
  private itemHashes: Set<string>              = new Set();
  private platformEarnings                     = 0;
  private totalTransactions                    = 0;

  /** Add a user by display name (idempotent — same name reuses existing id) */
  addUser(name: string): string {
    const id = `user-${name.toLowerCase().replace(/\s+/g, "-")}`;
    if (!this.users.has(id)) {
      this.users.set(id, { id, name, earnings: 0, joinedAt: new Date().toISOString() });
    }
    return id;
  }

  /** Create a marketplace item. Returns null if the name+description is not unique. */
  createItem(
    userId: string,
    name: string,
    description: string,
    price: number,
  ): MarketplaceItem | null {
    const hash = crypto.createHash("sha256").update(name + description).digest("hex");
    if (this.itemHashes.has(hash)) return null;   // Not unique

    const id = `item-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const user = this.users.get(userId);
    const item: MarketplaceItem = {
      id, creator: userId, creatorName: user?.name ?? userId,
      name, description, price, hash,
      createdAt: new Date().toISOString(), purchases: 0,
    };
    this.items.set(id, item);
    this.itemHashes.add(hash);
    return item;
  }

  /** Process a purchase — 75% creator / 25% platform split. */
  buyItem(buyerId: string, itemId: string): { creatorShare: number; platformShare: number } | null {
    const item    = this.items.get(itemId);
    if (!item) return null;
    const creator = this.users.get(item.creator);
    if (!creator) return null;

    const creatorShare  = item.price * 0.75;
    const platformShare = item.price * 0.25;
    creator.earnings   += creatorShare;
    this.platformEarnings += platformShare;
    item.purchases++;
    this.totalTransactions++;
    return { creatorShare, platformShare };
  }

  /** Per-user earnings simulation scaled to 1 million (spec requirement). */
  simulateDemo(): MarketplaceDemoResult {
    const perUser: Record<string, number> = {};
    this.users.forEach(u => { perUser[u.name] = Math.random() * 150 + 50; });
    const scaledTotal = Object.values(perUser).reduce((a, b) => a + b, 0) * 1_000_000;
    return { perUser, scaledTotal, platformEarnings: this.platformEarnings };
  }

  getStats() {
    return {
      userCount:         this.users.size,
      itemCount:         this.items.size,
      totalTransactions: this.totalTransactions,
      platformEarnings:  this.platformEarnings,
    };
  }

  getUsers():  MarketplaceUser[]  { return [...this.users.values()]; }
  getItems():  MarketplaceItem[]  { return [...this.items.values()]; }
}

// ─── Action generator ─────────────────────────────────────────────────────────

const ALL_ACTIONS = [
  "analyze", "simulate", "integrate", "evolve",
  "expand",  "transcend", "create",    "innovate",
] as const;

const WEIGHTED: Record<string, typeof ALL_ACTIONS[number][]> = {
  EVOLVING:    ["evolve", "expand", "transcend", "create", "innovate"],
  STALLED:     ["analyze", "integrate", "simulate", "innovate"],
  REGRESSING:  ["analyze", "simulate", "integrate", "evolve"],
};

export function generateLimitlessActions(status: string): string[] {
  const pool = WEIGHTED[status] ?? [...ALL_ACTIONS];
  const count = Math.floor(Math.random() * 3) + 3;   // 3-5 actions
  const out: string[] = [];
  while (out.length < count) {
    const a = pool[Math.floor(Math.random() * pool.length)];
    if (!out.includes(a)) out.push(a);
  }
  return out;
}

// ─── Score helpers (deterministic-ish off cycle state) ───────────────────────

export function computeLimitlessScore(cycleScore: number):   number { return Math.min(100, Math.round(cycleScore * 0.9 + Math.random() * 10)); }
export function computeLimitlessImpact(impactScore: number): number { return Math.min(100, Math.round(impactScore * 0.85 + Math.random() * 15)); }
export function computeLimitlessCompliance(comp: number):   number { return Math.min(100, Math.round(comp * 0.95 + Math.random() * 5)); }
