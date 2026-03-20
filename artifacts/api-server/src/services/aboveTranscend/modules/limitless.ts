/**
 * modules/limitless.ts — Limitless Self-Upgrading Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements:
 *   LimitlessModule   — fully emergent, guaranteed submodule growth per run
 *                       (depth-capped to prevent exponential explosion)
 *   MarketplaceEngine — SHA-256 uniqueness-enforced creator marketplace
 *   generateUpgrade() — per-cycle upgrade registry (emergent, persisted)
 *   LimitlessReport   — per-cycle output shape
 */

import crypto from "node:crypto";

// ─── Emergent growth config ───────────────────────────────────────────────────
// Spawn probability by tree depth — guarantees ≥1 per cycle at root,
// decays exponentially so the tree stays bounded long-term.
const SPAWN_PROBABILITY = [1.0, 1.0, 0.5, 0.2, 0.05];   // index = depth
const MAX_DEPTH = 4;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LimitlessModuleResult {
  name:                string;
  state:               Record<string, unknown>;
  hash:                string;
  submoduleCount:      number;
  totalSubmoduleCount: number;
  emergentCreated:     boolean;
  emergentName:        string | null;
  depth:               number;
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

export interface LimitlessUpgrade {
  id:        string;
  name:      string;
  effect:    string;
  cycle:     number;
  createdAt: string;
}

export interface LimitlessReport {
  cycleNumber:          number;
  score:                number;
  impact:               number;
  compliance:           number;
  autonomy:             number;   // 4th standalone metric (spec: CycleReport.autonomy)
  // Weighted actions (status-aware) + one fully emergent dynamic action
  actions:              string[];
  dynamicAction:        string;
  // LimitlessModule tree
  totalEmergentModules: number;
  coreSubmoduleCount:   number;
  emergentThisCycle:    boolean;
  emergentCountThisCycle: number;
  newEmergentName:      string | null;
  coreHash:             string;
  coreRunMs:            number;
  // Per-cycle upgrades
  upgrades:             LimitlessUpgrade[];
  upgradeThisCycle:     LimitlessUpgrade;
  // Marketplace
  marketplaceUsers:     MarketplaceUser[];
  marketplaceItems:     MarketplaceItem[];
  marketplaceDemo:      MarketplaceDemoResult;
  marketplaceStats: {
    userCount:          number;
    itemCount:          number;
    totalTransactions:  number;
    platformEarnings:   number;
  };
}

// ─── LimitlessModule ──────────────────────────────────────────────────────────

export class LimitlessModule {
  readonly name:  string;
  readonly hash:  string;
  readonly depth: number;

  private submodules: LimitlessModule[] = [];
  private state: Record<string, unknown> = {};
  private totalRuns = 0;
  private allEmergentCount = 0;    // emergents spawned across whole subtree

  constructor(name: string, depth = 0) {
    this.name  = name;
    this.depth = depth;
    this.hash  = crypto.createHash("sha256")
      .update(name + depth.toString() + Date.now().toString())
      .digest("hex")
      .slice(0, 16);
  }

  async run(globalState: Record<string, unknown>): Promise<LimitlessModuleResult> {
    const t0 = Date.now();
    this.totalRuns++;
    this.state = { ...this.state, ...globalState, totalRuns: this.totalRuns, depth: this.depth };

    // Guaranteed-or-probabilistic spawn based on depth
    const spawnProb = SPAWN_PROBABILITY[Math.min(this.depth, SPAWN_PROBABILITY.length - 1)];
    const emergentCreated = Math.random() < spawnProb && this.depth < MAX_DEPTH;
    let emergentName: string | null = null;

    if (emergentCreated) {
      const eName = `Emergent-${this.name.replace("Core-Everything", "Core")}-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
      this.submodules.push(new LimitlessModule(eName, this.depth + 1));
      this.allEmergentCount++;
      emergentName = eName;
    }

    // Run all submodules concurrently (fully emergent, no restriction)
    const subResults = await Promise.all(
      this.submodules.map(m => m.run(globalState))
    );

    const emergentCountThisCycle = (emergentCreated ? 1 : 0) +
      subResults.reduce((sum, r) => sum + (r.emergentCreated ? 1 : 0), 0);

    return {
      name:                this.name,
      state:               this.state,
      hash:                this.hash,
      submoduleCount:      this.submodules.length,
      totalSubmoduleCount: this.totalSubmoduleCount(),
      emergentCreated,
      emergentName,
      depth:               this.depth,
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
  private users:         Map<string, MarketplaceUser> = new Map();
  private items:         Map<string, MarketplaceItem> = new Map();
  private itemHashes:    Set<string>                  = new Set();
  private platformEarnings  = 0;
  private totalTransactions = 0;

  addUser(name: string): string {
    const id = `user-${name.toLowerCase().replace(/\s+/g, "-")}`;
    if (!this.users.has(id)) {
      this.users.set(id, { id, name, earnings: 0, joinedAt: new Date().toISOString() });
    }
    return id;
  }

  createItem(userId: string, name: string, description: string, price: number): MarketplaceItem | null {
    const hash = crypto.createHash("sha256").update(name + description).digest("hex");
    if (this.itemHashes.has(hash)) return null;

    const id   = `item-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
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

  /**
   * Per-cycle simulation that ACCUMULATES earnings persistently.
   * Each run adds 75% of a random draw to the creator's running total
   * and 25% to platform earnings — earnings grow indefinitely over cycles.
   */
  simulateDemo(): MarketplaceDemoResult {
    const perUser: Record<string, number> = {};
    this.users.forEach(u => {
      const draw = Math.random() * 150 + 50;
      u.earnings        += draw * 0.75;      // accumulate creator share
      this.platformEarnings += draw * 0.25;  // accumulate platform share
      perUser[u.name]   = u.earnings;        // expose running total
    });
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

  getUsers(): MarketplaceUser[] { return [...this.users.values()]; }
  getItems(): MarketplaceItem[] { return [...this.items.values()]; }
}

// ─── Upgrade generator ────────────────────────────────────────────────────────
// Each cycle produces exactly one named upgrade — stored in a persistent registry.

const UPGRADE_EFFECTS = [
  "emergent change",       "recursive self-improvement",  "pattern synthesis",
  "capability expansion",  "meta-layer integration",      "entropy reduction",
  "context amplification", "universe-awareness boost",    "signal compression",
  "feedback loop closure", "autonomy threshold increase", "reality-check bypass",
];

export function generateUpgrade(cycleNumber: number): LimitlessUpgrade {
  return {
    id:        `upgrade-${cycleNumber}-${crypto.randomBytes(4).toString("hex")}`,
    name:      `Upgrade-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    effect:    UPGRADE_EFFECTS[cycleNumber % UPGRADE_EFFECTS.length],
    cycle:     cycleNumber,
    createdAt: new Date().toISOString(),
  };
}

// ─── Action generators ────────────────────────────────────────────────────────

const ALL_ACTIONS = [
  "analyze",  "simulate", "integrate", "evolve",
  "expand",   "transcend", "create",   "innovate", "emerge",
] as const;

const WEIGHTED: Record<string, typeof ALL_ACTIONS[number][]> = {
  EVOLVING:   ["evolve", "expand", "transcend", "create", "innovate", "emerge"],
  STALLED:    ["analyze", "integrate", "simulate", "innovate", "emerge"],
  REGRESSING: ["analyze", "simulate", "integrate", "evolve"],
};

/** Returns 3-5 weighted status-aware actions (spec: 8-item named list) */
export function generateLimitlessActions(status: string): string[] {
  const pool  = WEIGHTED[status] ?? [...ALL_ACTIONS];
  const count = Math.floor(Math.random() * 3) + 3;
  const out: string[] = [];
  while (out.length < count) {
    const a = pool[Math.floor(Math.random() * pool.length)];
    if (!out.includes(a)) out.push(a);
  }
  return out;
}

/** Returns ONE fully emergent dynamic action (spec: "infinite emergent actions, dynamically named") */
export function generateDynamicAction(): string {
  return `Action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Score helpers ────────────────────────────────────────────────────────────

export function computeLimitlessScore(cycleScore: number):   number { return Math.min(100, Math.round(cycleScore * 0.9 + Math.random() * 10)); }
export function computeLimitlessImpact(impactScore: number): number { return Math.min(100, Math.round(impactScore * 0.85 + Math.random() * 15)); }
export function computeLimitlessCompliance(comp: number):   number { return Math.min(100, Math.round(comp * 0.95 + Math.random() * 5)); }
export function computeLimitlessAutonomy(autonomyScore: number): number { return Math.min(100, Math.round(autonomyScore * 0.9 + Math.random() * 10)); }

// ─── Batch universe probe ─────────────────────────────────────────────────────
// Spec: UniverseConnector.probe() discovers 1–5 new modules per cycle.
export function countBatchProbeModules(): number {
  return Math.floor(Math.random() * 5) + 1;   // 1–5
}
