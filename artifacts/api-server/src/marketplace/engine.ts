/**
 * marketplace/engine.ts
 * ---------------------
 * Dynamic Transcend Marketplace Engine
 *
 * Implements the exact scaling formula from the spec:
 *   activeUsersFactor  = 1 + users.length  × 0.02   (+2% per registered user)
 *   itemsSoldFactor    = 1 + totalSold      × 0.01   (+1% per item ever sold)
 *   scaledValue        = baseValue × activeUsersFactor × itemsSoldFactor
 *   userShare          = scaledValue × 0.75   (creator / participant)
 *   platformShare      = scaledValue × 0.25   (platform)
 *
 * State is in-memory for real-time demo; swap .users / .marketplace for DB
 * rows if you want persistence.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketUser {
  id:       number;
  name:     string;
  earnings: number;
}

export interface MarketItem {
  id:        number;
  creatorId: number;
  title:     string;
  price:     number;
  sold:      number;
}

export interface EarningsEvent {
  userId:        number;
  userName:      string;
  userShare:     number;
  platformShare: number;
  action:        string;
  scaledValue:   number;
  baseValue:     number;
}

export interface DemoSessionResult {
  events:        EarningsEvent[];
  finalEarnings: { name: string; earnings: number }[];
  platformTotal: number;
  totalItems:    number;
  totalSold:     number;
}

// ─── Module score table (mirrors spec + live scores from transcendAll) ────────

export const MODULE_SCORES: Record<string, { score: number; overachievement_pct: number }> = {
  Energy:     { score: 75,  overachievement_pct: 150 },
  Internet:   { score: 98,  overachievement_pct: 170 },
  Telecom:    { score: 92,  overachievement_pct: 160 },
  Finance:    { score: 97,  overachievement_pct: 165 },
  Media:      { score: 95,  overachievement_pct: 155 },
  Water:      { score: 90,  overachievement_pct: 148 },
  Healthcare: { score: 97,  overachievement_pct: 162 },
  Transport:  { score: 93,  overachievement_pct: 158 },
  Custom:     { score: 91,  overachievement_pct: 151 },
};

// ─── Engine class ─────────────────────────────────────────────────────────────

export class MarketplaceEngine {
  users:       MarketUser[] = [];
  marketplace: MarketItem[] = [];
  private platformEarnings  = 0;
  private earningsLog: EarningsEvent[] = [];

  constructor(initialUsers: MarketUser[] = []) {
    this.users = initialUsers.map(u => ({ ...u }));
  }

  // ── Core scaling formula ──────────────────────────────────────────────────

  private get activeUsersFactor(): number {
    return 1 + this.users.length * 0.02;
  }

  private get itemsSoldFactor(): number {
    const totalSold = this.marketplace.reduce((acc, i) => acc + i.sold, 0);
    return 1 + totalSold * 0.01;
  }

  private updateEarnings(userId: number, baseValue: number, action: string): EarningsEvent | null {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;

    const scaledValue     = baseValue * this.activeUsersFactor * this.itemsSoldFactor;
    const userShare       = scaledValue * 0.75;
    const platformShare   = scaledValue * 0.25;

    user.earnings        += userShare;
    this.platformEarnings += platformShare;

    const event: EarningsEvent = {
      userId, userName: user.name, userShare, platformShare, action, scaledValue, baseValue,
    };
    this.earningsLog.push(event);
    return event;
  }

  // ── Public actions (match spec exactly) ──────────────────────────────────

  /** User clicks the Transcend button — earns $0.75 base (scaled) */
  clickTranscend(userId: number): EarningsEvent | null {
    return this.updateEarnings(userId, 1, "clickTranscend");
  }

  /** User completes a module — earns based on module score × overachievement% */
  completeModule(userId: number, moduleName: string): EarningsEvent | null {
    const mod = MODULE_SCORES[moduleName];
    if (!mod) return null;
    const baseValue = (mod.score * mod.overachievement_pct) / 100;
    return this.updateEarnings(userId, baseValue, `completeModule:${moduleName}`);
  }

  /** Create a marketplace item */
  createItem(userId: number, title: string, price: number): MarketItem | null {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;
    const item: MarketItem = { id: this.marketplace.length + 1, creatorId: userId, title, price, sold: 0 };
    this.marketplace.push(item);
    return item;
  }

  /** Buy an item — creator earns 75% of price (scaled) */
  buyItem(buyerId: number, itemId: number): EarningsEvent | null {
    const item = this.marketplace.find(i => i.id === itemId);
    if (!item) return null;
    item.sold += 1;
    return this.updateEarnings(item.creatorId, item.price, `buyItem:${item.title}`);
  }

  /** Add a new user to the engine */
  addUser(user: MarketUser): void {
    if (!this.users.find(u => u.id === user.id)) this.users.push({ ...user });
  }

  // ── Snapshot ──────────────────────────────────────────────────────────────

  snapshot() {
    return {
      users:            this.users.map(u => ({ ...u })),
      marketplace:      this.marketplace.map(i => ({ ...i })),
      platformEarnings: this.platformEarnings,
      earningsLog:      [...this.earningsLog],
      scalingFactors: {
        activeUsersFactor: parseFloat(this.activeUsersFactor.toFixed(4)),
        itemsSoldFactor:   parseFloat(this.itemsSoldFactor.toFixed(4)),
      },
    };
  }

  reset(): void {
    this.users.forEach(u => { u.earnings = 0; });
    this.marketplace = [];
    this.platformEarnings = 0;
    this.earningsLog = [];
  }
}

// ─── Singleton engine (shared across API requests) ───────────────────────────

export const engine = new MarketplaceEngine([
  { id: 1, name: "FamilyMember1", earnings: 0 },
  { id: 2, name: "FamilyMember2", earnings: 0 },
  { id: 3, name: "DemoUser1",     earnings: 0 },
]);

// ─── Demo session (matches spec demoSession() exactly) ───────────────────────

export function runDemoSession(eng?: MarketplaceEngine): DemoSessionResult {
  const e = eng ?? engine;
  const events: EarningsEvent[] = [];

  const push = (ev: EarningsEvent | null) => { if (ev) events.push(ev); };

  // Clicks
  push(e.clickTranscend(1));
  push(e.clickTranscend(2));

  // Module completions
  push(e.completeModule(3, "Finance"));
  push(e.completeModule(1, "Media"));
  push(e.completeModule(2, "Healthcare"));

  // Marketplace creation
  e.createItem(1, "AI Workflow Template",        10);
  e.createItem(2, "Home Care Automation Script", 15);

  // Purchases
  push(e.buyItem(3, e.marketplace.at(-2)?.id ?? 1));
  push(e.buyItem(3, e.marketplace.at(-1)?.id ?? 2));

  const snap = e.snapshot();

  return {
    events,
    finalEarnings: snap.users.map(u => ({ name: u.name, earnings: u.earnings })),
    platformTotal: snap.platformEarnings,
    totalItems:    snap.marketplace.length,
    totalSold:     snap.marketplace.reduce((a, i) => a + i.sold, 0),
  };
}
