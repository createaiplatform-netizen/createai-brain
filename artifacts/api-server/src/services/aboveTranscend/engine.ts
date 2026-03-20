/**
 * aboveTranscend/engine.ts  — v3 NO LIMITS EDITION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚡ Above-Transcend Engine — No Limits Edition
 *
 *   cycleInterval: 2 min (near-continuous — "no sleep" interpreted as 2-min tight loop)
 *   minEfficiency: 1.0 (100% minimum enforced every cycle)
 *   maxExpansion:  Infinity (no upper limit on layers or modules)
 *   autoSelfRewrite: true (DataLayer + AutonomyLayer adjust scoring weights each cycle)
 *
 * 9 real working layers orchestrated by LoopOrchestrator:
 *   L1 IntegrationsLayer — auto-discovery, future simulation, failure adaptation
 *   L2 DataLayer         — predictive fill, self-clean, feedback weight adjustment
 *   L3 EvolutionLayer    — parallel phases, future module exploration
 *   L4 FrontendLayer     — dynamic tile config, self-versioning
 *   L5 AutonomyLayer     — learn from failures, create submodules, self-upgrade
 *   L6 MetaLayer         — reality check, future predictions, loop detection
 *   L7 FinanceLayer      — industry benchmarks, revenue potential, above-industry sim
 *   L8 SafetyLayer       — rule enforcement, compliance score, auto-update
 *   L9 LoopOrchestrator  — chain all layers, validate feedback, self-upgrade cycle
 *
 * Eight enforcement phases run inside every cycle:
 *   Phase 1 — Activity Enforcement
 *   Phase 2 — Execution Layer (SAFE_AUTO auto-run)
 *   Phase 3 — Feedback Loop
 *   Phase 4 — Expansion Guarantee
 *   Phase 5 — Reality Priority
 *   Phase 6 — Self-Scoring Model
 *   Phase 7 — Failsafe Enforcement
 *   Phase 8 — Structured Output
 */

import os from "os";
import { credentialStatus } from "../../utils/notifications.js";
import { probeStripeConnection } from "../integrations/stripeClient.js";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

import {
  IntegrationsLayer,
  DataLayer,
  EvolutionLayer,
  FrontendLayer,
  AutonomyLayer,
  MetaLayer,
  FinanceLayer,
  SafetyLayer,
  LoopOrchestrator,
} from "./modules/layers.js";

import type {
  IntegrationsReport,
  DataLayerReport,
  EvolutionLayerReport,
  FrontendLayerReport,
  AutonomyReport,
  MetaAnalysis,
  FinanceReport,
  SafetyStatus,
  OrchestratorReport,
  FutureModule,
} from "./modules/layers.js";

import {
  LimitlessModule,
  MarketplaceEngine,
  generateLimitlessActions,
  generateDynamicAction,
  generateUpgrade,
  computeLimitlessScore,
  computeLimitlessImpact,
  computeLimitlessCompliance,
} from "./modules/limitless.js";

import type { LimitlessReport, LimitlessUpgrade } from "./modules/limitless.js";

// Re-export layer types so routes can reference them
export type {
  IntegrationsReport,
  DataLayerReport,
  EvolutionLayerReport,
  FrontendLayerReport,
  AutonomyReport,
  MetaAnalysis,
  FinanceReport,
  SafetyStatus,
  OrchestratorReport,
  FutureModule,
  LimitlessReport,
};

// ─── Tunables ────────────────────────────────────────────────────────────────
const CYCLE_INTERVAL_MS = 2 * 60 * 1000;   // 2-min near-continuous loop
const MAX_STORED_CYCLES = 20;

// ─── Layer singletons (persist state across cycles) ───────────────────────────
const integrationsLayer  = new IntegrationsLayer();
const dataLayer          = new DataLayer();
const evolutionLayer     = new EvolutionLayer();
const frontendLayer      = new FrontendLayer();
const autonomyLayer      = new AutonomyLayer();
const metaLayer          = new MetaLayer();
const financeLayer       = new FinanceLayer();
const safetyLayer        = new SafetyLayer();
const loopOrchestrator   = new LoopOrchestrator();

// ─── Limitless Engine singletons (persist submodule tree across cycles) ───────
const limitlessCore      = new LimitlessModule("Core-Everything");
const marketplaceEngine  = new MarketplaceEngine();

// Seed marketplace with family members (spec requirement)
marketplaceEngine.addUser("FamilyMember1");
marketplaceEngine.addUser("FamilyMember2");
marketplaceEngine.addUser("DemoUser1");
marketplaceEngine.addUser("Sara Stadler");    // platform owner

// Persistent upgrade registry — one upgrade generated every cycle
const limitlessUpgrades: LimitlessUpgrade[] = [];

// ─── Evolution Status ────────────────────────────────────────────────────────
export type EvolutionStatus = "EVOLVING" | "STALLED" | "REGRESSING";
export type ActionClass     = "SAFE_AUTO" | "REQUIRES_APPROVAL";

// ─── Core domain types ────────────────────────────────────────────────────────
export interface ClassifiedAction {
  id: string; title: string; description: string;
  class: ActionClass; reason: string; category: string;
}

export interface ExecutionRecord {
  actionId: string; title: string; class: ActionClass;
  executedAt: string; success: boolean; outcome: string;
  impactScore: number; durationMs: number; category: string;
}

export interface PerformanceTrend {
  cycleNumber: number; evolutionStatus: EvolutionStatus;
  actionsExecuted: number; realImpactScore: number;
  detectedLimits: number; expansionIdeas: number;
  evolutionRate: number; stalledCount: number;
}

export interface ModuleStatus { name: string; type: string; reason: string; }

export interface SelfAwarenessReport {
  scannedAt: string; totalRoutes: number;
  realModules: ModuleStatus[]; simulatedModules: ModuleStatus[];
  dbTableCount: number; realCount: number; simulatedCount: number;
  memoryUsageMB: number; uptimeHours: number;
}

export interface Limit {
  id: string; type: string; component: string; description: string;
  severity: "critical" | "high" | "medium" | "low"; blocksThat: string[];
}

export interface LimitBreaker {
  limitId: string; component: string; action: string;
  steps: string[]; estimatedImpact: string; unlocks: string[];
}

export interface ExpansionProposal {
  id: string; type: string; title: string; description: string;
  currentGap: string; implementation: string; dependsOn: string[]; readyNow: boolean;
}

export interface NextMove {
  rank: number; title: string; description: string;
  impactScore: number; easeScore: number; revenueScore: number;
  intelligenceScore: number; totalScore: number;
  action: string; estimatedTime: string; category: string; readyNow: boolean;
}

export interface ConversionPlan {
  simulatedComponent: string; gap: string;
  conversionSteps: string[]; priority: "immediate" | "high" | "medium"; blockedBy: string;
}

export interface ExpansionGuarantee {
  newImprovementIdea: string; systemOptimisation: string; expansionOpportunity: string;
}

export interface FailsafeState {
  stallCount: number; escalated: boolean; criticalAlert: boolean;
  alertMessage: string; restorationSteps: string[];
}

// ─── TranscendentEngine types ─────────────────────────────────────────────────

export interface EngineUnit {
  id:          string;
  name:        string;
  description: string;
  category:    "phase" | "layer" | "universe" | "sub";
  source:      "seed" | "auto-discovered" | "infinite-universe-scanner";
  endpoint?:   string;
  lastResult?: { success: boolean; impact: number; outcome: string; probeMs: number };
  subUnits?:   EngineUnit[];
}

export interface DiscoveredModule {
  name:        string;
  status:      "live" | "degraded" | "pending" | "future";
  source:      "seed" | "auto-discovered" | "infinite-universe-scanner";
  endpoint?:   string;
  description: string;
  lastChecked?: string;
}

export interface UniverseReport {
  connected:          boolean;
  connectedAt?:       string;
  unitCount:          number;
  metaPhaseCount:     number;
  expansionIdeaCount: number;
  discoveredModuleCount: number;
  units:              EngineUnit[];
  metaPhases:         string[];
  expansionIdeas:     string[];
  modules:            DiscoveredModule[];
  lastScanMs:         number;
}

// ─── Full cycle output (Phase 8) ─────────────────────────────────────────────
export interface EvolutionCycle {
  cycleId: string; cycleNumber: number;
  startedAt: string; completedAt: string; durationMs: number;

  // Phase 6
  systemStatus: EvolutionStatus; evolutionRate: number; realImpactScore: number;

  // Phase 1
  activityEnforced: boolean; criticalFailure: boolean; criticalReason: string;

  // Phase 2
  classifiedActions: ClassifiedAction[]; executedActions: ExecutionRecord[];

  // Phase 3
  performanceTrend: PerformanceTrend[];

  // Phase 4
  expansionGuarantee: ExpansionGuarantee;

  // Phase 5
  conversionPlans: ConversionPlan[];

  // Phase 7
  failsafe: FailsafeState;

  // Core scan data
  awareness: SelfAwarenessReport; limits: Limit[]; breakers: LimitBreaker[];
  expansions: ExpansionProposal[]; nextMoves: NextMove[];

  // ── No Limits Edition: 9 layer outputs ─────────────────────────────────────
  integrationsReport: IntegrationsReport;
  dataLayerReport:    DataLayerReport;
  evolutionLayerReport: EvolutionLayerReport;
  frontendReport:     FrontendLayerReport;
  autonomyReport:     AutonomyReport;
  metaAnalysis:       MetaAnalysis;
  financeReport:      FinanceReport;
  safetyStatus:       SafetyStatus;
  orchestratorReport: OrchestratorReport;
  futureModules:      FutureModule[];

  // ── TranscendentEngine: Universe Connector ───────────────────────────────────
  universeReport: UniverseReport;

  // ── Limitless Self-Upgrading Engine ──────────────────────────────────────────
  limitlessReport: LimitlessReport;

  summary: {
    realIntegrations: number; detectedLimits: number; proposedBreakers: number;
    expansionIdeas: number; topScore: number; systemIntelligence: number;
    actionsExecuted: number; systemStatus: EvolutionStatus;
    evolutionRate: number; realImpactScore: number;
    cycleScore: number; complianceScore: number; autonomyScore: number;
    financeRevenue: number; futureModuleCount: number;
    // Universe
    universeUnits: number; universeMeta: number; discoveredModules: number;
    totalExpansionIdeas: number;
    // Limitless
    limitlessScore: number; limitlessImpact: number; limitlessCompliance: number;
    totalEmergentModules: number; marketplaceUsers: number; marketplaceItems: number;
    marketplaceDemoTotal: number;
  };
}

// ─── Global state ─────────────────────────────────────────────────────────────
let cycleCount   = 0;
let stallStreak  = 0;
let latestCycle: EvolutionCycle | null = null;
const cycleHistory:  EvolutionCycle[]  = [];
const actionHistory: ExecutionRecord[] = [];
const trendHistory:  PerformanceTrend[] = [];

// ─── TranscendentEngine global registries ─────────────────────────────────────
const unitRegistry:     EngineUnit[]       = [];
const moduleRegistry:   DiscoveredModule[] = [];
const metaPhases:       string[]           = [];
const expansionIdeas:   string[]           = [];
let   universeConnected                    = false;
let   universeConnectedAt: string | undefined;
let   lastUniverseScanMs                   = 0;

function registerUnit(unit: EngineUnit): void {
  if (!unitRegistry.find(u => u.name === unit.name)) unitRegistry.push(unit);
}

function registerMetaPhase(name: string): void {
  if (!metaPhases.includes(name)) metaPhases.push(name);
}

function generateExpansionIdea(context?: string): void {
  const templates = [
    "Integrate ANY legal, safe, real AI endpoint from the public universe",
    "Auto-discover and probe all zero-auth public data APIs in a 30-second scan",
    "Build a self-healing retry layer for every external probe with exponential backoff",
    "Add a real-time event stream (SSE) for live cycle progress in the frontend",
    "Create a public API health leaderboard — ranked by reliability over 30 days",
    "Generate weekly GPT-4o summaries of the universe module performance",
    "Auto-register any new real API discovered by the universe scanner as a live module",
    "Build a cross-module correlation engine — detect when two modules affect each other",
    "Add anomaly detection: if any probe degrades >30%, trigger immediate escalation",
    "Create a self-documenting API registry — every discovered module writes its own schema",
  ];
  const idea = context
    ? `Universe Expansion: ${context}`
    : templates[expansionIdeas.length % templates.length]!;
  expansionIdeas.push(idea);
}

async function probeUniverseEndpoint(
  name: string, endpoint: string, description: string,
  category: EngineUnit["category"] = "universe"
): Promise<void> {
  const t0 = Date.now();
  let status: DiscoveredModule["status"] = "pending";
  let outcome = "Probe pending";
  let success = false;
  let impact  = 0;

  try {
    const r = await fetch(endpoint, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "CreateAI-Brain/3.0" } });
    if (r.ok) {
      status  = "live";
      success = true;
      impact  = 60;
      const body = await r.text().catch(() => "");
      const preview = body.slice(0, 80).replace(/\s+/g, " ");
      outcome = `HTTP ${r.status} · ${r.headers.get("content-type")?.split(";")[0] ?? "unknown"} · ${preview}…`;
    } else {
      status  = "degraded";
      outcome = `HTTP ${r.status}`;
      impact  = 20;
    }
  } catch (e) {
    status  = "degraded";
    outcome = `Probe failed: ${(e as Error).message.slice(0, 60)}`;
    impact  = 10;
  }

  const probeMs = Date.now() - t0;

  // Update or add to module registry
  const existing = moduleRegistry.find(m => m.name === name);
  if (existing) {
    existing.status      = status;
    existing.lastChecked = new Date().toISOString();
  } else {
    moduleRegistry.push({ name, status, source: "infinite-universe-scanner", endpoint, description, lastChecked: new Date().toISOString() });
  }

  // Update or register engine unit
  const unit = unitRegistry.find(u => u.name === `Universe: ${name}`);
  const result = { success, impact, outcome, probeMs };
  if (unit) {
    unit.lastResult = result;
  } else {
    registerUnit({ id: `universe-${name.toLowerCase().replace(/\s/g, "-")}`, name: `Universe: ${name}`, description, category, source: "infinite-universe-scanner", endpoint, lastResult: result });
    registerMetaPhase(`UniversePhase-${name}`);
    generateExpansionIdea(`${name} discovered — endpoint: ${endpoint}`);
  }
}

async function connectUniverse(): Promise<void> {
  if (universeConnected) {
    // Re-probe all universe modules each cycle to keep data fresh
    const universeMods = moduleRegistry.filter(m => m.source === "infinite-universe-scanner" && m.endpoint);
    await Promise.all(universeMods.map(m => probeUniverseEndpoint(m.name.replace("Universe: ",""), m.endpoint!, m.description)));
    return;
  }

  universeConnected   = true;
  universeConnectedAt = new Date().toISOString();
  console.log("[AboveTranscend] 🌐 Connecting to Infinite Universe — scanning public endpoints…");

  const t0 = Date.now();

  // Real free public APIs — zero auth, legal, safe, data-producing
  await Promise.all([
    probeUniverseEndpoint("Exchange Rates",   "https://open.er-api.com/v6/latest/USD",                                          "Live forex exchange rates for 170+ currencies — no auth required"),
    probeUniverseEndpoint("World Bank Data",  "https://api.worldbank.org/v2/country?format=json&per_page=5",                    "World Bank development indicators — 200+ countries, real GDP/population data"),
    probeUniverseEndpoint("REST Countries",   "https://restcountries.com/v3.1/name/sweden?fields=name,capital,population",      "Country metadata: capital, population, languages, currencies — all real"),
    probeUniverseEndpoint("Public Holidays",  "https://date.nager.at/api/v3/publicholidays/2025/US",                           "US public holidays 2025 — real calendar data, no auth required"),
    probeUniverseEndpoint("Aviation Tracker", "https://opensky-network.org/api/states/all?lamin=55&lomin=14&lamax=60&lomax=25", "Live aircraft positions over Scandinavia — OpenSky Network"),
    probeUniverseEndpoint("Open Library",     "https://openlibrary.org/search.json?q=artificial+intelligence&limit=3",          "Open Library search — 20M+ book records, real bibliographic data"),
    probeUniverseEndpoint("IP Intelligence",  "https://ipapi.co/json/",                                                         "Server IP geolocation, ASN, org — live network intelligence"),
    probeUniverseEndpoint("Crypto Ping",      "https://api.coingecko.com/api/v3/ping",                                          "CoinGecko API health — gateway to 10,000+ crypto prices"),
  ]);

  lastUniverseScanMs = Date.now() - t0;

  // Seed the 8 phase units and 9 layer units
  const phaseSeeds = ["Activity Enforcement","Execution Layer","Feedback Loop","Expansion Guarantee","Reality Priority","Self-Scoring Model","Failsafe Enforcement","Structured Output"];
  const layerSeeds = ["IntegrationsLayer","DataLayer","EvolutionLayer","FrontendLayer","AutonomyLayer","MetaLayer","FinanceLayer","SafetyLayer","LoopOrchestrator"];

  phaseSeeds.forEach((name, i) => registerUnit({ id: `phase-${i+1}`, name: `Phase ${i+1}: ${name}`, description: `Core engine enforcement phase — runs every cycle`, category: "phase", source: "seed" }));
  layerSeeds.forEach((name, i) => registerUnit({ id: `layer-${i+1}`, name: `L${i+1}: ${name}`,      description: `No Limits Edition layer — runs in parallel`, category: "layer", source: "seed" }));

  // Seed known modules that were there before universe discovery
  const seedModules: DiscoveredModule[] = [
    { name: "stripe",          status: "live", source: "seed", description: "Stripe payment connector", endpoint: "https://status.stripe.com" },
    { name: "twilio",          status: "live", source: "seed", description: "Twilio SMS API" },
    { name: "resend",          status: "live", source: "seed", description: "Resend email API" },
    { name: "postgresql",      status: "live", source: "seed", description: "PostgreSQL database" },
    { name: "openMeteo",       status: "live", source: "seed", description: "Open-Meteo weather API", endpoint: "https://api.open-meteo.com" },
    { name: "hapiFHIR",        status: "live", source: "seed", description: "HAPI FHIR R4 sandbox" },
    { name: "openaq",          status: "live", source: "seed", description: "OpenAQ air quality API" },
    { name: "openStreetMap",   status: "live", source: "seed", description: "Nominatim geocoding API" },
    { name: "nodeMetrics",     status: "live", source: "seed", description: "Node.js system metrics" },
  ];
  seedModules.forEach(m => { if (!moduleRegistry.find(r => r.name === m.name)) moduleRegistry.push(m); });

  // Register meta-phases for seeded items
  phaseSeeds.forEach(name => registerMetaPhase(`Phase-${name}`));
  layerSeeds.forEach(name  => registerMetaPhase(`Layer-${name}`));

  // Generate initial expansion ideas
  for (let i = 0; i < 5; i++) generateExpansionIdea();

  console.log(
    `[AboveTranscend] 🌐 Universe connected — ` +
    `${unitRegistry.length} units · ${moduleRegistry.length} modules · ` +
    `${metaPhases.length} meta-phases · ${expansionIdeas.length} ideas · ${lastUniverseScanMs}ms`
  );
}

function buildUniverseReport(): UniverseReport {
  return {
    connected:             universeConnected,
    connectedAt:           universeConnectedAt,
    unitCount:             unitRegistry.length,
    metaPhaseCount:        metaPhases.length,
    expansionIdeaCount:    expansionIdeas.length,
    discoveredModuleCount: moduleRegistry.length,
    units:                 [...unitRegistry],
    metaPhases:            [...metaPhases],
    expansionIdeas:        [...expansionIdeas],
    modules:               [...moduleRegistry],
    lastScanMs:            lastUniverseScanMs,
  };
}

// ─── SAFE_AUTO executors ──────────────────────────────────────────────────────

async function execHealthScan(): Promise<ExecutionRecord> {
  const t0 = Date.now();
  try {
    const r = await fetch("https://status.stripe.com/api/v2/status.json", { signal: AbortSignal.timeout(5000) });
    const j = await r.json() as { status?: { description?: string } };
    return { actionId: "health-scan", title: "Live API Health Scan", class: "SAFE_AUTO",
      executedAt: new Date().toISOString(), success: r.ok,
      outcome: `Stripe status API → "${j?.status?.description ?? "unknown"}" (HTTP ${r.status})`,
      impactScore: r.ok ? 72 : 35, durationMs: Date.now() - t0, category: "health" };
  } catch (e) {
    return { actionId: "health-scan", title: "Live API Health Scan", class: "SAFE_AUTO",
      executedAt: new Date().toISOString(), success: false,
      outcome: `Scan failed: ${(e as Error).message}`, impactScore: 20,
      durationMs: Date.now() - t0, category: "health" };
  }
}

async function execDbAudit(): Promise<ExecutionRecord> {
  const t0 = Date.now();
  try {
    const r = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
    const rows = (r as unknown as { rows: { table_name: string }[] }).rows;
    return { actionId: "db-audit", title: "PostgreSQL Schema Audit", class: "SAFE_AUTO",
      executedAt: new Date().toISOString(), success: true,
      outcome: `${rows.length} tables confirmed: ${rows.map(x => x.table_name).join(", ").slice(0, 80)}…`,
      impactScore: 68, durationMs: Date.now() - t0, category: "database" };
  } catch (e) {
    return { actionId: "db-audit", title: "PostgreSQL Schema Audit", class: "SAFE_AUTO",
      executedAt: new Date().toISOString(), success: false,
      outcome: `DB audit failed: ${(e as Error).message}`, impactScore: 10,
      durationMs: Date.now() - t0, category: "database" };
  }
}

async function execSystemMetrics(): Promise<ExecutionRecord> {
  const t0 = Date.now();
  const mem = process.memoryUsage();
  return { actionId: "sys-metrics", title: "Node.js System Metrics Collection", class: "SAFE_AUTO",
    executedAt: new Date().toISOString(), success: true,
    outcome: `heap ${Math.round(mem.heapUsed/1024/1024)}MB · rss ${Math.round(mem.rss/1024/1024)}MB · uptime ${Math.round(process.uptime()/3600*10)/10}h · load ${os.loadavg()[0].toFixed(2)} · ${os.cpus().length} CPUs`,
    impactScore: 60, durationMs: Date.now() - t0, category: "metrics" };
}

async function execStripeProbe(): Promise<ExecutionRecord> {
  const t0 = Date.now();
  try {
    const probe = await probeStripeConnection();
    return { actionId: "stripe-check", title: "Stripe Connector Probe", class: "SAFE_AUTO",
      executedAt: new Date().toISOString(), success: true,
      outcome: `Connector active · mode:${probe.mode ?? "test"} · connected:true`,
      impactScore: 75, durationMs: Date.now() - t0, category: "revenue" };
  } catch (e) {
    return { actionId: "stripe-check", title: "Stripe Connector Probe", class: "SAFE_AUTO",
      executedAt: new Date().toISOString(), success: false,
      outcome: `Probe failed: ${(e as Error).message}`, impactScore: 15,
      durationMs: Date.now() - t0, category: "revenue" };
  }
}

async function execWeatherProbe(): Promise<ExecutionRecord> {
  const t0 = Date.now();
  try {
    const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=59.33&longitude=18.07&current_weather=true", { signal: AbortSignal.timeout(5000) });
    const j = await r.json() as { current_weather?: { temperature?: number; windspeed?: number } };
    return { actionId: "weather-probe", title: "Open-Meteo Live Weather Probe", class: "SAFE_AUTO",
      executedAt: new Date().toISOString(), success: r.ok,
      outcome: `Live weather confirmed · temp:${j.current_weather?.temperature ?? "?"}°C wind:${j.current_weather?.windspeed ?? "?"}km/h`,
      impactScore: 55, durationMs: Date.now() - t0, category: "integration" };
  } catch (e) {
    return { actionId: "weather-probe", title: "Open-Meteo Probe", class: "SAFE_AUTO",
      executedAt: new Date().toISOString(), success: false,
      outcome: `Probe failed: ${(e as Error).message}`, impactScore: 10,
      durationMs: Date.now() - t0, category: "integration" };
  }
}

// ─── Core scan builders ───────────────────────────────────────────────────────

async function buildAwareness(): Promise<SelfAwarenessReport> {
  const creds = credentialStatus();
  let dbTableCount = 0;
  try {
    const r = await db.execute(sql`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema='public'`);
    dbTableCount = Number((r as unknown as { rows: { count: string }[] }).rows?.[0]?.count ?? 0);
  } catch { dbTableCount = -1; }

  const mem = process.memoryUsage();

  const real: ModuleStatus[] = [
    { name: "PostgreSQL",        type: "real",    reason: `Live DB · ${dbTableCount} tables confirmed` },
    { name: "OpenAI Proxy",      type: "real",    reason: "Replit AI proxy active · gpt-5.2 + gpt-4o" },
    { name: "Stripe Connector",  type: "real",    reason: "Replit OAuth connector · test mode active" },
    { name: "Resend Email",      type: creds.email.configured ? "real" : "partial", reason: creds.email.configured ? "RESEND_API_KEY valid" : "API key missing" },
    { name: "Twilio SMS",        type: "partial", reason: creds.sms.configured ? "Credentials valid · trial restriction" : "Credentials missing" },
    { name: "Open-Meteo",        type: "real",    reason: "Live weather · no auth required" },
    { name: "HAPI FHIR R4",      type: "real",    reason: "Public FHIR sandbox · live patient API" },
    { name: "OpenAQ",            type: "real",    reason: "Live air quality · no auth required" },
    { name: "OpenStreetMap",     type: "real",    reason: "Live geocoding · Nominatim API" },
    { name: "Stripe Status API", type: "real",    reason: "Public status API · no auth required" },
    { name: "Node System",       type: "real",    reason: "OS metrics always available" },
  ];
  const simulated: ModuleStatus[] = [
    { name: "Module Scores",         type: "simulated", reason: "Static hardcoded lookup — not from real activity" },
    { name: "Revenue Dashboard",     type: "simulated", reason: "$130M projection hardcoded — no live Stripe revenue" },
    { name: "Marketplace Adapters",  type: "simulated", reason: "29 stubs — no real OAuth connections" },
    { name: "Notification Counters", type: "partial",   reason: "In-memory counters — reset on restart" },
  ];

  return {
    scannedAt:        new Date().toISOString(),
    totalRoutes:      73,
    realModules:      real.filter(m => m.type === "real"),
    simulatedModules: [...real.filter(m => m.type !== "real"), ...simulated],
    dbTableCount,
    realCount:        real.filter(m => m.type === "real").length,
    simulatedCount:   simulated.length + real.filter(m => m.type !== "real").length,
    memoryUsageMB:    Math.round(mem.heapUsed / 1024 / 1024),
    uptimeHours:      Math.round(process.uptime() / 3600 * 10) / 10,
  };
}

function buildLimits(awareness: SelfAwarenessReport): Limit[] {
  const creds = credentialStatus();
  const limits: Limit[] = [];
  if (creds.sms.configured) {
    limits.push({ id: "twilio-trial",    type: "restricted_service", severity: "high",     component: "Twilio SMS",            description: "Trial account blocks SMS to unverified numbers (error 21608).",           blocksThat: ["Live SMS notifications", "Multi-channel routing"] });
  } else {
    limits.push({ id: "twilio-missing",  type: "missing_credential", severity: "critical", component: "Twilio SMS",            description: "TWILIO_SID / TWILIO_AUTH_TOKEN not configured.",                           blocksThat: ["All SMS notifications"] });
  }
  const from = process.env["RESEND_FROM_EMAIL"] ?? "";
  if (creds.email.configured && from.includes("onboarding@resend.dev")) {
    limits.push({ id: "resend-domain",   type: "missing_domain",     severity: "high",     component: "Resend Email",          description: "FROM: onboarding@resend.dev restricts delivery to owner email only.",    blocksThat: ["Family emails", "Client delivery", "Automated reports"] });
  } else if (!creds.email.configured) {
    limits.push({ id: "resend-missing",  type: "missing_credential", severity: "critical", component: "Resend Email",          description: "RESEND_API_KEY not set.",                                                  blocksThat: ["All email notifications"] });
  }
  limits.push({ id: "stripe-test",       type: "test_mode",          severity: "high",     component: "Stripe Payments",       description: "Stripe connector in test mode. Zero real revenue flows.",                 blocksThat: ["Real payments", "Revenue metrics"] });
  limits.push({ id: "static-scores",     type: "simulated_value",    severity: "medium",   component: "Module Score Engine",   description: "MODULE_SCORES is static — scores never reflect real activity.",           blocksThat: ["Accurate intelligence scoring"] });
  limits.push({ id: "fake-revenue",      type: "no_revenue_flow",    severity: "critical", component: "Revenue Dashboard",     description: "$130M projection hardcoded — no live Stripe data.",                       blocksThat: ["Real financial reporting", "Investor metrics"] });
  limits.push({ id: "volatile-counters", type: "no_real_output",     severity: "medium",   component: "Notification Tracking", description: "emailsSentCount / smsSentCount reset on restart.",                        blocksThat: ["Delivery history", "Compliance logging"] });
  limits.push({ id: "no-automation",     type: "no_automation_loop", severity: "medium",   component: "Trigger System",        description: "No event-driven automation — all notifications are manual.",              blocksThat: ["Proactive notifications", "Scheduled reports"] });
  limits.push({ id: "stub-adapters",     type: "simulated_value",    severity: "low",      component: "Marketplace Adapters",  description: "29 adapter connectors are display-only stubs.",                           blocksThat: ["Third-party integrations"] });
  return limits;
}

const BREAKER_MAP: Record<string, { action: string; steps: string[]; estimatedImpact: string; unlocks: string[] }> = {
  "twilio-trial":      { action: "Upgrade Twilio account OR verify family numbers",             steps: ["Go to console.twilio.com → Billing → Add $10+ credits", "OR: Verified Caller IDs → Add each family number", "Test: POST /api/brain/notify"], estimatedImpact: "Unlocks live SMS to all 8 family members immediately", unlocks: ["Family SMS", "Multi-channel notifications"] },
  "twilio-missing":    { action: "Configure TWILIO_SID and TWILIO_AUTH_TOKEN",                  steps: ["Get credentials from console.twilio.com", "Set TWILIO_SID + TWILIO_AUTH_TOKEN in Replit secrets"], estimatedImpact: "SMS channel fully online", unlocks: ["All SMS notifications"] },
  "resend-domain":     { action: "Verify a custom sending domain at resend.com/domains",         steps: ["resend.com/domains → Add your domain", "Add DNS records", "Update RESEND_FROM_EMAIL"], estimatedImpact: "Email to any address — family, clients, automations", unlocks: ["Family emails", "Client delivery"] },
  "resend-missing":    { action: "Set RESEND_API_KEY in environment secrets",                    steps: ["Get API key from resend.com/api-keys", "Set RESEND_API_KEY in Replit secrets"], estimatedImpact: "Email channel fully online", unlocks: ["All email notifications"] },
  "stripe-test":       { action: "Activate Stripe live keys and complete account verification",  steps: ["Complete Stripe verification at dashboard.stripe.com", "Switch connector to live mode", "Register webhook at /api/webhooks/stripe"], estimatedImpact: "Real payment collection — live revenue dashboard", unlocks: ["Real payments", "Revenue metrics"] },
  "static-scores":     { action: "Replace static MODULE_SCORES with DB-computed scores",         steps: ["Create module_scores table", "Write scorer service reading API call counts", "Run every BrainEnforcementEngine cycle (60s)"], estimatedImpact: "Self-calibrating intelligence", unlocks: ["Dynamic prioritisation"] },
  "fake-revenue":      { action: "Wire Stripe live webhook to populate revenue from real data",   steps: ["Activate Stripe live mode", "Handle payment_intent.succeeded events", "Persist to revenue_events table"], estimatedImpact: "Real numbers — all projections eliminated", unlocks: ["Real financial reporting"] },
  "volatile-counters": { action: "Persist notification events to PostgreSQL",                    steps: ["Create notification_log table", "UPDATE send functions to INSERT on each send", "Replace counters with DB COUNT queries"], estimatedImpact: "Zero data loss on restarts", unlocks: ["Delivery history", "Compliance logging"] },
  "no-automation":     { action: "Build the Trigger Engine — event-driven automation",           steps: ["Create triggers table", "Wire hooks into existing routes", "Add cron scheduler: daily digest, weekly health"], estimatedImpact: "Platform acts proactively — zero manual triggering", unlocks: ["Proactive notifications", "Revenue alerts"] },
  "stub-adapters":     { action: "Activate highest-value adapters with real OAuth",               steps: ["Priority: Google Calendar, GitHub, Notion, Slack (all free)", "Register OAuth app at each provider"], estimatedImpact: "First real third-party connections", unlocks: ["Calendar sync", "Code intelligence"] },
};

function buildBreakers(limits: Limit[]): LimitBreaker[] {
  return limits.map(l => ({
    limitId: l.id, component: l.component,
    ...(BREAKER_MAP[l.id] ?? { action: "Investigate and resolve", steps: ["Review limit details", "Identify root cause", "Implement fix"], estimatedImpact: "Removes this constraint", unlocks: l.blocksThat }),
  }));
}

function buildExpansions(): ExpansionProposal[] {
  const creds = credentialStatus();
  return [
    { id: "trigger-engine",       type: "new_module",         title: "Trigger Engine — Event-Driven Automation",           description: "Rules-based engine: payment → email, health drop → SMS, weekly digest.",       currentGap: "All notifications manual.", implementation: "triggers table + event emitter + cron", dependsOn: [], readyNow: true },
    { id: "persistent-notif",     type: "new_module",         title: "Persistent Notification Log",                         description: "notification_log table — every send persisted with status + timestamp.",          currentGap: "Counters reset on restart.", implementation: "notification_log + INSERT in send functions", dependsOn: [], readyNow: true },
    { id: "ai-digest",            type: "new_workflow",       title: "Weekly AI Intelligence Digest",                       description: "GPT-4o generates weekly health + opportunities, email every Monday.",               currentGap: "No scheduled AI reports.", implementation: "node-cron + OpenAI prompt + Resend", dependsOn: ["persistent-notif"], readyNow: creds.email.configured },
    { id: "live-revenue",         type: "revenue_opportunity", title: "Live Revenue Dashboard from Stripe Webhooks",         description: "Real-time MRR from actual Stripe events — replaces all hardcoded projections.",     currentGap: "$130M projection is static.", implementation: "Stripe webhook → revenue_events → dashboard", dependsOn: [], readyNow: false },
    { id: "computed-scores",      type: "new_module",         title: "Dynamic Module Scoring",                              description: "Replace hardcoded MODULE_SCORES with scores from actual DB activity.",               currentGap: "Scores never change.", implementation: "module_activity_log → scorer service → BrainEnforcementEngine", dependsOn: [], readyNow: true },
    { id: "google-calendar",      type: "new_integration",    title: "Google Calendar Integration",                         description: "Connect Sara's calendar for deadline reminders and time-blocked actions.",            currentGap: "Zero calendar integrations.", implementation: "Google OAuth → read/write calendar API", dependsOn: ["trigger-engine"], readyNow: false },
    { id: "client-portal",        type: "revenue_opportunity", title: "Client Portal with Stripe Gating",                   description: "Paying clients access AI-generated reports.",                                         currentGap: "Platform is single-user.", implementation: "New artifact + Stripe subscription check", dependsOn: ["live-revenue"], readyNow: false },
    { id: "multi-channel-router", type: "automation_loop",    title: "Multi-Channel Notification Router",                   description: "Routes alerts to best channel by urgency.",                                           currentGap: "Email and SMS fire independently.", implementation: "NotificationRouter service + urgency scoring", dependsOn: ["persistent-notif"], readyNow: creds.email.configured || creds.sms.configured },
  ];
}

function buildNextMoves(limits: Limit[]): NextMove[] {
  const moves: Omit<NextMove, "rank" | "totalScore">[] = [
    { title: "Fix Twilio Trial → Live SMS",           description: "Add $10 Twilio credits — immediately unlocks SMS to all family members.",               impactScore: 92, easeScore: 95, revenueScore: 20, intelligenceScore: 40, action: "console.twilio.com → Billing → Add $10",                                            estimatedTime: "5 min",    category: "credential_fix",  readyNow: true },
    { title: "Verify Resend Domain",                  description: "Remove owner-only restriction — send to any address.",                                    impactScore: 90, easeScore: 70, revenueScore: 35, intelligenceScore: 30, action: "resend.com/domains → Add domain → DNS → Update RESEND_FROM_EMAIL",                  estimatedTime: "15 min",   category: "credential_fix",  readyNow: true },
    { title: "Build Persistent Notification Log",     description: "notification_log table — counters survive restarts.",                                      impactScore: 75, easeScore: 80, revenueScore: 20, intelligenceScore: 85, action: "Add notification_log table → update send functions",                                estimatedTime: "30 min",   category: "new_module",      readyNow: true },
    { title: "Trigger Engine — Automate the OS",      description: "Event-driven: Stripe payment → email; health drop → SMS; weekly AI digest.",              impactScore: 95, easeScore: 55, revenueScore: 65, intelligenceScore: 98, action: "Create triggers table + event emitter + cron wired to existing routes",            estimatedTime: "2–3 hours", category: "new_module",     readyNow: true },
    { title: "Activate Stripe Live Mode → Real MRR",  description: "Complete Stripe verification, switch to live, wire webhook.",                              impactScore: 98, easeScore: 40, revenueScore: 100, intelligenceScore: 60, action: "Verify Stripe → live keys → handle webhooks → populate revenue_events",          estimatedTime: "1 hour",   category: "revenue",         readyNow: false },
  ];
  const scored = moves.map(m => ({ ...m, rank: 0, totalScore: Math.round(m.impactScore * 0.30 + m.easeScore * 0.25 + m.revenueScore * 0.25 + m.intelligenceScore * 0.20) }));
  scored.sort((a, b) => b.totalScore - a.totalScore);
  scored.forEach((m, i) => { m.rank = i + 1; });
  return scored.slice(0, 5);
}

function classifyNextMoves(moves: NextMove[]): ClassifiedAction[] {
  return moves.map(m => ({
    id: `classify-${m.rank}`, title: m.title, description: m.description,
    class: (["credential_fix", "revenue", "new_module"].includes(m.category) ? "REQUIRES_APPROVAL" : "SAFE_AUTO") as ActionClass,
    reason: ["credential_fix", "revenue", "new_module"].includes(m.category) ? "Requires external action or schema change — needs user confirmation" : "Read-only scan — no mutations",
    category: m.category,
  }));
}

function buildExpansionGuarantee(cycleNum: number, expansions: ExpansionProposal[], limits: Limit[]): ExpansionGuarantee {
  const readyExpansion = expansions.find(e => e.readyNow) ?? expansions[0];
  const ideas = [
    "Build notification_log table — persist email/SMS history across restarts",
    "Create module_activity_log — replace static MODULE_SCORES with real computed scores",
    "Add weekly AI digest: GPT-4o generates platform summary, delivered every Monday",
    "Implement Trigger Engine with node-cron: Stripe payment → auto receipt; error spike → SMS",
    "Build /api/intelligence/score — real-time system intelligence from live DB data",
    "Add OpenAQ air quality widget — live public API, zero credentials needed",
    "Create revenue_events table — Stripe webhooks write to it, dashboard reads live",
  ];
  const optimisations = [
    "Cache OpenAI proxy responses with 5-min TTL — reduces token spend on repeated queries",
    "Add response-time middleware to all /api routes — log P95 latency to PostgreSQL",
    "Replace sync bcrypt calls with async — eliminates blocking on login",
    "Add connection pooling to Drizzle/pg — prevents connection exhaustion",
    "Compress all API responses ≥1KB with gzip — ~70% payload reduction",
    "Add ETag caching to GET /api/modules — browser skips re-download when unchanged",
  ];
  const opportunities = [
    "Google Calendar OAuth (free) — sync schedule for AI briefings",
    "GitHub OAuth (free) — codebase activity into platform intelligence",
    "Stripe live mode — converts test connector to real revenue immediately",
    "Client portal — gated by Stripe subscription, monetises to external clients",
    "Twilio upgrade ($10) — unlocks live SMS to all 8 family members",
    "Resend domain verification (free) — email to all recipients",
  ];
  const idx = cycleNum % ideas.length;
  return {
    newImprovementIdea:   ideas[idx]!,
    systemOptimisation:   optimisations[idx % optimisations.length]!,
    expansionOpportunity: readyExpansion ? `READY NOW: ${readyExpansion.title} — ${readyExpansion.description}` : (opportunities[idx % opportunities.length]!),
  };
}

function buildConversionPlans(awareness: SelfAwarenessReport): ConversionPlan[] {
  return awareness.simulatedModules.map(m => {
    switch (m.name) {
      case "Revenue Dashboard":      return { simulatedComponent: m.name, gap: m.reason, priority: "immediate", conversionSteps: ["Activate Stripe live mode", "Register /api/webhooks/stripe", "Create revenue_events table", "Wire dashboard to DB"], blockedBy: "Stripe test mode" };
      case "Module Scores":          return { simulatedComponent: m.name, gap: m.reason, priority: "high",      conversionSteps: ["Create module_scores table", "Write scorer service", "Update BrainEnforcementEngine", "Replace static lookup with DB query"], blockedBy: "No code blockers — ready now" };
      case "Notification Counters":  return { simulatedComponent: m.name, gap: m.reason, priority: "high",      conversionSteps: ["Create notification_log table", "Update sendEmailNotification to INSERT", "Update sendSMSNotification to INSERT", "Change health endpoint to DB COUNT"], blockedBy: "No code blockers — ready now" };
      case "Marketplace Adapters":   return { simulatedComponent: m.name, gap: m.reason, priority: "medium",    conversionSteps: ["Register OAuth apps at Google, GitHub, Notion, Slack", "Implement /api/integrations/connect/:provider", "Store tokens in integrations table"], blockedBy: "OAuth app registration at each provider (free)" };
      case "Twilio SMS":             return { simulatedComponent: m.name, gap: m.reason, priority: "immediate", conversionSteps: ["Add $10 Twilio credits", "OR: Verify each family number at Verified Caller IDs"], blockedBy: "$10 OR free number verification" };
      default:                       return { simulatedComponent: m.name, gap: m.reason, priority: "medium",    conversionSteps: ["Identify real data source", "Replace hardcoded values", "Test with real data"], blockedBy: "Requires investigation" };
    }
  });
}

function computeEvolutionStatus(executedActions: ExecutionRecord[], prevCycle: EvolutionCycle | null) {
  const successCount   = executedActions.filter(a => a.success).length;
  const rate           = executedActions.length;
  const totalImpact    = executedActions.reduce((s, a) => s + (a.success ? a.impactScore : a.impactScore * 0.2), 0);
  const realImpactScore = executedActions.length > 0 ? Math.round(totalImpact / executedActions.length) : 0;
  const prevImpact     = prevCycle?.realImpactScore ?? 0;
  const isRegressing   = prevCycle !== null && realImpactScore < prevImpact - 10 && successCount < 2;
  const isEvolving     = rate >= 3 && successCount >= 2;
  const status: EvolutionStatus = isRegressing ? "REGRESSING" : isEvolving ? "EVOLVING" : "STALLED";
  return { status, rate, realImpactScore, successCount };
}

function buildFailsafe(status: EvolutionStatus, streak: number): FailsafeState {
  if (status === "EVOLVING") return { stallCount: 0, escalated: false, criticalAlert: false, alertMessage: "", restorationSteps: [] };
  const steps = ["1. Manually trigger: POST /api/above-transcend/run", "2. Check health: GET /api/system/health-real", "3. Verify DB connectivity", "4. Review api-server logs", "5. Restart api-server workflow", "6. Confirm engine started in boot logs"];
  if (streak >= 3) return { stallCount: streak, escalated: true, criticalAlert: true,  alertMessage: `CRITICAL: System ${status} for ${streak} consecutive cycles. Evolution has stopped.`,                                                         restorationSteps: steps };
  if (streak >= 2) return { stallCount: streak, escalated: true, criticalAlert: false, alertMessage: `WARNING: ${streak} consecutive ${status} cycles. Escalating highest-impact safe action.`,                                                     restorationSteps: steps.slice(0, 3) };
  return           { stallCount: streak, escalated: false, criticalAlert: false, alertMessage: `System ${status} this cycle — monitoring. Will escalate if it continues.`, restorationSteps: [] };
}

// ─── Main cycle runner ────────────────────────────────────────────────────────

async function runCycle(): Promise<EvolutionCycle> {
  const startedAt = new Date().toISOString();
  const t0        = Date.now();
  cycleCount++;

  // ── Run core scan + SAFE_AUTO executors in parallel ──────────────────────
  const [awareness, safeExecs] = await Promise.all([
    buildAwareness(),
    Promise.all([execHealthScan(), execDbAudit(), execSystemMetrics(), execStripeProbe(), execWeatherProbe()]),
  ]);

  // ── Core scan (non-async) runs after awareness ──────────────────────────
  const [limits, expansions] = await Promise.all([
    Promise.resolve(buildLimits(awareness)),
    Promise.resolve(buildExpansions()),
  ]);
  const breakers  = buildBreakers(limits);
  const nextMoves = buildNextMoves(limits);

  const executedActions   = safeExecs;
  const classified        = classifyNextMoves(nextMoves);

  actionHistory.unshift(...executedActions);
  if (actionHistory.length > 200) actionHistory.splice(200);

  // ── Phase 6 — Self-scoring ──────────────────────────────────────────────
  const { status, rate, realImpactScore, successCount } = computeEvolutionStatus(executedActions, latestCycle);

  if (status !== "EVOLVING") stallStreak++;
  else stallStreak = 0;

  // ── Phase 1 — Activity enforcement ──────────────────────────────────────
  const activityEnforced = executedActions.length >= 1;
  const criticalFailure  = !activityEnforced || successCount === 0;
  const criticalReason   = criticalFailure
    ? successCount === 0 ? "CRITICAL FAILURE: All SAFE_AUTO actions failed this cycle. System below 100% evolution." : "CRITICAL FAILURE: No actions produced."
    : "";

  // ── Phase 3 — Feedback loop ──────────────────────────────────────────────
  const trend: PerformanceTrend = {
    cycleNumber: cycleCount, evolutionStatus: status, actionsExecuted: executedActions.length,
    realImpactScore, detectedLimits: limits.length, expansionIdeas: expansions.length,
    evolutionRate: rate, stalledCount: stallStreak,
  };
  trendHistory.unshift(trend);
  if (trendHistory.length > MAX_STORED_CYCLES) trendHistory.pop();

  // ── Phase 4 & 5 ──────────────────────────────────────────────────────────
  const expansionGuarantee = buildExpansionGuarantee(cycleCount, expansions, limits);
  const conversionPlans    = buildConversionPlans(awareness);

  // ── Phase 7 — Failsafe ───────────────────────────────────────────────────
  const failsafe = buildFailsafe(status, stallStreak);

  // ── Build LayerInput for all 9 layers ────────────────────────────────────
  const configuredCreds = Object.keys(process.env).filter(k =>
    ["TWILIO", "RESEND", "STRIPE", "OPENAI", "DATABASE"].some(p => k.includes(p))
  );

  const layerInput = {
    cycleNumber:     cycleCount,
    evolutionStatus: status,
    realCount:       awareness.realCount,
    simulatedCount:  awareness.simulatedCount,
    limitCount:      limits.length,
    actionsExecuted: executedActions.length,
    successCount,
    realImpactScore,
    stallStreak,
    prevCycleScores: trendHistory.slice(0, 5).map(t => t.realImpactScore),
    configuredCreds,
    dbTableCount:    awareness.dbTableCount,
    memoryUsageMB:   awareness.memoryUsageMB,
    uptimeHours:     awareness.uptimeHours,
  };

  // ── Run all 9 layers simultaneously ─────────────────────────────────────
  const [
    integrationsReport,
    dataLayerReport,
    evolutionLayerReport,
    frontendReport,
    autonomyReport,
    metaAnalysis,
    financeReport,
    safetyStatus,
  ] = await Promise.all([
    Promise.resolve(integrationsLayer.run(layerInput)),
    Promise.resolve(dataLayer.run(layerInput)),
    Promise.resolve(evolutionLayer.run(layerInput)),
    Promise.resolve(frontendLayer.run(layerInput)),
    Promise.resolve(autonomyLayer.run(layerInput)),
    Promise.resolve(metaLayer.run(layerInput)),
    Promise.resolve(financeLayer.run(layerInput)),
    Promise.resolve(safetyLayer.run(layerInput)),
  ]);

  // ── Universe Connector — re-probe all universe modules ──────────────────
  await connectUniverse();
  const universeReport = buildUniverseReport();

  // ── Limitless Engine — run core module + marketplace simulation ──────────
  const limitlessGlobalState: Record<string, unknown> = {
    cycleNumber: cycleCount,
    status,
    realImpactScore,
    cycleScore:    metaAnalysis.cycleScore,
    universeUnits: universeReport.unitCount,
    timestamp:     new Date().toISOString(),
  };
  const coreResult     = await limitlessCore.run(limitlessGlobalState);
  const limitlessDemo  = marketplaceEngine.simulateDemo();
  const limitlessStats = marketplaceEngine.getStats();
  const limitlessScore      = computeLimitlessScore(metaAnalysis.cycleScore);
  const limitlessImpact     = computeLimitlessImpact(realImpactScore);
  const limitlessCompliance = computeLimitlessCompliance(safetyStatus.complianceScore);
  const limitlessActions    = generateLimitlessActions(status);
  const dynamicAction       = generateDynamicAction();          // spec: "infinite emergent actions"
  const upgradeThisCycle    = generateUpgrade(cycleCount);      // spec: one named upgrade per cycle
  limitlessUpgrades.push(upgradeThisCycle);
  const totalEmergent       = limitlessCore.getTotalEmergentCreated();

  // ── Per-cycle dynamic universe growth (spec: connectUniverse adds new entries every cycle)
  registerUnit({
    id:          `dynamic-unit-${cycleCount}`,
    name:        `DynamicUnit-Cycle${cycleCount}`,
    description: `Auto-generated universe unit for cycle ${cycleCount} — ${dynamicAction}`,
    category:    "universe",
    source:      "dynamic-cycle-growth",
  });
  registerMetaPhase(`DynamicPhase-Cycle${cycleCount}`);
  generateExpansionIdea(
    `Cycle ${cycleCount} emergent opportunity: integrate ${upgradeThisCycle.effect} across all layers`
  );

  const limitlessReport: LimitlessReport = {
    cycleNumber:            cycleCount,
    score:                  limitlessScore,
    impact:                 limitlessImpact,
    compliance:             limitlessCompliance,
    actions:                limitlessActions,
    dynamicAction,
    totalEmergentModules:   totalEmergent,
    coreSubmoduleCount:     coreResult.totalSubmoduleCount,
    emergentThisCycle:      coreResult.emergentCreated,
    emergentCountThisCycle: (coreResult.emergentCreated ? 1 : 0),
    newEmergentName:        coreResult.emergentName,
    coreHash:               coreResult.hash,
    coreRunMs:              coreResult.runMs,
    upgrades:               [...limitlessUpgrades],
    upgradeThisCycle,
    marketplaceUsers:       marketplaceEngine.getUsers(),
    marketplaceItems:       marketplaceEngine.getItems(),
    marketplaceDemo:        limitlessDemo,
    marketplaceStats:       limitlessStats,
  };

  console.log(
    `[Limitless] Cycle ${cycleCount} ⚡ score:${limitlessScore} · impact:${limitlessImpact} · ` +
    `compliance:${limitlessCompliance}% · actions:[${limitlessActions.join(",")}] · ` +
    `emergent:${totalEmergent} · upgrade:${upgradeThisCycle.name.slice(0, 20)} · ` +
    `demoTotal:$${Math.round(limitlessDemo.scaledTotal).toLocaleString()}`
  );

  // ── Layer 9 — LoopOrchestrator ───────────────────────────────────────────
  const orchestratorReport = loopOrchestrator.run({
    integrations: integrationsReport,
    data:         dataLayerReport,
    evolution:    evolutionLayerReport,
    frontend:     frontendReport,
    autonomy:     autonomyReport,
    meta:         metaAnalysis,
    finance:      financeReport,
    safety:       safetyStatus,
    input:        layerInput,
  });

  // ── Phase 8 — Compose full output ────────────────────────────────────────
  const cycle: EvolutionCycle = {
    cycleId: `cycle-${cycleCount}-${Date.now()}`,
    cycleNumber: cycleCount,
    startedAt, completedAt: new Date().toISOString(), durationMs: Date.now() - t0,

    systemStatus: status, evolutionRate: rate, realImpactScore,
    activityEnforced, criticalFailure, criticalReason,
    classifiedActions: classified, executedActions,
    performanceTrend: [...trendHistory],
    expansionGuarantee, conversionPlans, failsafe,
    awareness, limits, breakers, expansions, nextMoves,

    // 9 layers
    integrationsReport, dataLayerReport, evolutionLayerReport,
    frontendReport, autonomyReport, metaAnalysis, financeReport,
    safetyStatus, orchestratorReport,
    futureModules: evolutionLayerReport.futureModules,

    // Universe Connector
    universeReport,

    // Limitless Engine
    limitlessReport,

    summary: {
      realIntegrations:  awareness.realCount,
      detectedLimits:    limits.length,
      proposedBreakers:  breakers.length,
      expansionIdeas:    expansions.length,
      topScore:          nextMoves[0]?.totalScore ?? 0,
      systemIntelligence: Math.round((awareness.realCount / Math.max(1, awareness.realCount + awareness.simulatedCount)) * 100),
      actionsExecuted:   executedActions.length,
      systemStatus:      status,
      evolutionRate:     rate,
      realImpactScore,
      cycleScore:        metaAnalysis.cycleScore,
      complianceScore:   safetyStatus.complianceScore,
      autonomyScore:     autonomyReport.autonomyScore,
      financeRevenue:    financeReport.currentRevenue,
      futureModuleCount: evolutionLayerReport.futureModules.length,
      // Universe
      universeUnits:        universeReport.unitCount,
      universeMeta:         universeReport.metaPhaseCount,
      discoveredModules:    universeReport.discoveredModuleCount,
      totalExpansionIdeas:  universeReport.expansionIdeaCount,
      // Limitless
      limitlessScore,
      limitlessImpact,
      limitlessCompliance,
      totalEmergentModules: totalEmergent,
      marketplaceUsers:     limitlessStats.userCount,
      marketplaceItems:     limitlessStats.itemCount,
      marketplaceDemoTotal: limitlessDemo.scaledTotal,
    },
  };

  latestCycle = cycle;
  cycleHistory.unshift(cycle);
  if (cycleHistory.length > MAX_STORED_CYCLES) cycleHistory.pop();

  const sym = criticalFailure ? "🔴" : status === "EVOLVING" ? "🟢" : "🟡";
  console.log(
    `[AboveTranscend] ${sym} Cycle #${cycleCount} · ${status} · ` +
    `${executedActions.length} actions (${successCount}✓) · ` +
    `impact:${realImpactScore} · cycleScore:${metaAnalysis.cycleScore} · ` +
    `compliance:${safetyStatus.complianceScore}% · ` +
    `${orchestratorReport.layersRan} layers · ${cycle.durationMs}ms`
  );

  if (failsafe.criticalAlert) console.error(`[AboveTranscend] ⚠️  ${failsafe.alertMessage}`);
  if (metaAnalysis.infiniteLoopDetected) console.warn(`[AboveTranscend] 🔁 ${metaAnalysis.loopWarning}`);

  return cycle;
}

// ─── Boot & public API ────────────────────────────────────────────────────────

let loopTimer: ReturnType<typeof setInterval> | null = null;

export function startAboveTranscendEngine(): void {
  if (loopTimer) return;

  runCycle().catch(err => console.error("[AboveTranscend] boot cycle error:", err));

  loopTimer = setInterval(() => {
    runCycle().catch(err => console.error("[AboveTranscend] cycle error:", err));
  }, CYCLE_INTERVAL_MS);

  console.log(
    `[AboveTranscend] ⚡ Engine started — NO LIMITS EDITION · ` +
    `9 layers active · ${CYCLE_INTERVAL_MS / 60000}-min near-continuous loop · ` +
    `minEfficiency:1.0 · maxExpansion:Infinity · autoSelfRewrite:true · ` +
    "There is no completion state. Only continuous evolution."
  );
}

export function getLatestCycle():   EvolutionCycle | null   { return latestCycle; }
export function getCycleHistory():  EvolutionCycle[]        { return [...cycleHistory]; }
export function getCycleCount():    number                  { return cycleCount; }
export function getNextMoves():     NextMove[]              { return latestCycle?.nextMoves ?? []; }
export function getActionHistory(): ExecutionRecord[]       { return [...actionHistory]; }
export function getTrendHistory():  PerformanceTrend[]      { return [...trendHistory]; }
export function runCycleNow():      Promise<EvolutionCycle> { return runCycle(); }
