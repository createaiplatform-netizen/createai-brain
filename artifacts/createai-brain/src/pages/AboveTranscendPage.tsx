import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const BG     = "#f8fafc";
const CARD   = "#ffffff";
const BORDER = "rgba(0,0,0,0.07)";
const ACCENT = "#6366f1";
const GREEN  = "#10b981";
const ORANGE = "#f59e0b";
const RED    = "#ef4444";
const TEXT   = "#0f172a";
const DIM    = "#64748b";
const PURPLE = "#8b5cf6";
const TEAL   = "#06b6d4";

// ─── Types ─────────────────────────────────────────────────────────────────────
type EvolutionStatus = "EVOLVING" | "STALLED" | "REGRESSING";
type ActionClass     = "SAFE_AUTO" | "REQUIRES_APPROVAL";

interface NextMove        { rank:number;title:string;description:string;impactScore:number;easeScore:number;revenueScore:number;intelligenceScore:number;totalScore:number;action:string;estimatedTime:string;category:string;readyNow:boolean; }
interface Limit           { id:string;type:string;component:string;description:string;severity:"critical"|"high"|"medium"|"low";blocksThat:string[]; }
interface LimitBreaker    { limitId:string;component:string;action:string;steps:string[];estimatedImpact:string;unlocks:string[]; }
interface ExpansionProposal { id:string;type:string;title:string;description:string;currentGap:string;implementation:string;dependsOn:string[];readyNow:boolean; }
interface ModuleStatus    { name:string;type:string;reason:string; }
interface SelfAwareness   { scannedAt:string;totalRoutes:number;realCount:number;simulatedCount:number;realModules:ModuleStatus[];simulatedModules:ModuleStatus[];dbTableCount:number;memoryUsageMB:number;uptimeHours:number; }
interface ClassifiedAction{ id:string;title:string;description:string;class:ActionClass;reason:string;category:string; }
interface ExecutionRecord { actionId:string;title:string;class:ActionClass;executedAt:string;success:boolean;outcome:string;impactScore:number;durationMs:number;category:string; }
interface PerformanceTrend{ cycleNumber:number;evolutionStatus:EvolutionStatus;actionsExecuted:number;realImpactScore:number;detectedLimits:number;expansionIdeas:number;evolutionRate:number;stalledCount:number; }
interface ConversionPlan  { simulatedComponent:string;gap:string;conversionSteps:string[];priority:"immediate"|"high"|"medium";blockedBy:string; }
interface ExpansionGuarantee{ newImprovementIdea:string;systemOptimisation:string;expansionOpportunity:string; }
interface FailsafeState   { stallCount:number;escalated:boolean;criticalAlert:boolean;alertMessage:string;restorationSteps:string[]; }

// ── No Limits Layer types ─────────────────────────────────────────────────────
interface DiscoveredIntegration { name:string;status:string;type:string;autoAdapt:string; }
interface IntegrationsReport    { discovered:DiscoveredIntegration[];realCount:number;futureCount:number;autoAdapted:string[];newlyDetected:string[]; }
interface DataLayerReport       { predictedNextStatus:string;predictionConfidence:number;selfCleaned:string[];missingDataFilled:string[];feedbackAdjustments:Array<{field:string;old:number;new:number;reason:string}>;dataQualityScore:number; }
interface FutureModule          { id:string;name:string;category:string;description:string;effort:"low"|"medium"|"high";impact:number;prerequisite:string;simulatedCapabilities:string[];estimatedUnlockDate:string; }
interface EvolutionLayerReport  { parallelPhasesRan:number;futureModules:FutureModule[];explorationScore:number;newLimitsFound:number;limitsTrend:"increasing"|"stable"|"decreasing"; }
interface DynamicTile           { id:string;label:string;value:string|number;color:string;priority:number;blink:boolean; }
interface FrontendLayerReport   { uiVersion:number;dynamicTiles:DynamicTile[];alertBanners:string[];hiddenPanels:string[]; }
interface AutonomyReport        { failureLearnings:Array<{pattern:string;adjustment:string;confidence:number}>;dynamicSubmodules:Array<{id:string;name:string;trigger:string;action:string;priority:number}>;decisionsMade:number;autonomyScore:number;selfUpgradeApplied:boolean;upgradeDescription:string; }
interface FuturePrediction      { thirtyDay:string;sixtyDay:string;ninetyDay:string;nextUnlock:string;nextUnlockEstimate:string;unlockCost:string; }
interface MetaAnalysis          { cycleScore:number;realityCheck:{real:number;simulated:number;missing:string[];realRatio:number;trajectory:string};futurePrediction:FuturePrediction;infiniteLoopDetected:boolean;loopWarning:string;selfReflection:string;cycleInsight:string; }
interface IndustryBenchmarks    { avgSaasMrr:number;topDecileArr:number;avgConversionRate:number;avgChurnRate:number;avgCac:number;avgLtv:number;aiPlatformMrr:number; }
interface FinanceReport         { currentRevenue:number;revenueMode:string;revenueGap:number;monthlyPotential:number;annualPotential:number;industryBenchmarks:IndustryBenchmarks;aboveIndustryScenario:{description:string;projectedMrr:number;projectedArr:number;requiredActions:string[];timeToAchieve:string;vsIndustryAvg:string};revenueBlockers:string[];automationPotential:string;activationCost:string; }
interface SafetyStatus          { allRulesEnforced:boolean;totalRules:number;passedRules:number;violations:Array<{rule:string;severity:string;detail:string}>;autoUpdatedRules:string[];complianceScore:number; }
interface OrchestratorReport    { layersRan:number;feedbackValid:boolean;feedbackIssues:string[];selfUpgradeCycle:boolean;upgradeApplied:string;infiniteScaleMode:boolean;loopIteration:number; }
interface EngineUnit            { id:string;name:string;description:string;category:"phase"|"layer"|"universe"|"sub";source:string;endpoint?:string;lastResult?:{success:boolean;impact:number;outcome:string;probeMs:number};subUnits?:EngineUnit[]; }
interface DiscoveredModule      { name:string;status:"live"|"degraded"|"pending"|"future";source:string;endpoint?:string;description:string;lastChecked?:string; }
interface UniverseReport        { connected:boolean;connectedAt?:string;unitCount:number;metaPhaseCount:number;expansionIdeaCount:number;discoveredModuleCount:number;units:EngineUnit[];metaPhases:string[];expansionIdeas:string[];modules:DiscoveredModule[];lastScanMs:number; }
interface MarketplaceUser       { id:string;name:string;earnings:number;joinedAt:string; }
interface MarketplaceItem       { id:string;creator:string;creatorName:string;name:string;description:string;price:number;hash:string;createdAt:string;purchases:number; }
interface MarketplaceDemoResult { perUser:Record<string,number>;scaledTotal:number;platformEarnings:number; }
interface LimitlessUpgrade       { id:string;name:string;effect:string;cycle:number;createdAt:string; }
interface LimitlessReport       { cycleNumber:number;score:number;impact:number;compliance:number;autonomy:number;actions:string[];dynamicAction:string;totalEmergentModules:number;coreSubmoduleCount:number;emergentThisCycle:boolean;emergentCountThisCycle:number;newEmergentName:string|null;coreHash:string;coreRunMs:number;upgrades:LimitlessUpgrade[];upgradeThisCycle:LimitlessUpgrade;marketplaceUsers:MarketplaceUser[];marketplaceItems:MarketplaceItem[];marketplaceDemo:MarketplaceDemoResult;marketplaceStats:{userCount:number;itemCount:number;totalTransactions:number;platformEarnings:number}; }
interface CycleSummary          { realIntegrations:number;detectedLimits:number;proposedBreakers:number;expansionIdeas:number;topScore:number;systemIntelligence:number;actionsExecuted:number;systemStatus:EvolutionStatus;evolutionRate:number;realImpactScore:number;cycleScore:number;complianceScore:number;autonomyScore:number;financeRevenue:number;futureModuleCount:number;universeUnits:number;universeMeta:number;discoveredModules:number;totalExpansionIdeas:number;limitlessScore:number;limitlessImpact:number;limitlessCompliance:number;totalEmergentModules:number;marketplaceUsers:number;marketplaceItems:number;marketplaceDemoTotal:number; }

interface EvolutionCycle {
  cycleId:string;cycleNumber:number;startedAt:string;completedAt:string;durationMs:number;
  systemStatus:EvolutionStatus;evolutionRate:number;realImpactScore:number;
  activityEnforced:boolean;criticalFailure:boolean;criticalReason:string;
  classifiedActions:ClassifiedAction[];executedActions:ExecutionRecord[];
  performanceTrend:PerformanceTrend[];expansionGuarantee:ExpansionGuarantee;
  conversionPlans:ConversionPlan[];failsafe:FailsafeState;
  awareness:SelfAwareness;limits:Limit[];breakers:LimitBreaker[];
  expansions:ExpansionProposal[];nextMoves:NextMove[];
  // 9 layers
  integrationsReport:IntegrationsReport;dataLayerReport:DataLayerReport;
  evolutionLayerReport:EvolutionLayerReport;frontendReport:FrontendLayerReport;
  autonomyReport:AutonomyReport;metaAnalysis:MetaAnalysis;financeReport:FinanceReport;
  safetyStatus:SafetyStatus;orchestratorReport:OrchestratorReport;futureModules:FutureModule[];
  // Universe Connector
  universeReport:UniverseReport;
  // Limitless Engine
  limitlessReport:LimitlessReport;
  summary:CycleSummary;
}

// ─── API ───────────────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api/above-transcend${p}`;

async function fetchLatest(): Promise<{ ok:boolean;ready:boolean;cycle?:EvolutionCycle }> {
  const r = await fetch(api("/latest"), { credentials: "include" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function triggerRun() {
  const r = await fetch(api("/run"), { method: "POST", credentials: "include" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ─── Primitives ────────────────────────────────────────────────────────────────
function ScoreBar({ value, color = ACCENT }: { value:number; color?:string }) {
  return (
    <div style={{ height:4, borderRadius:9, background:"rgba(0,0,0,0.06)", overflow:"hidden", flex:1 }}>
      <div style={{ height:"100%", width:`${value}%`, background:color, borderRadius:9, transition:"width 0.6s ease" }} />
    </div>
  );
}
function Badge({ label, color }: { label:string; color:string }) {
  return <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:"0.04em", textTransform:"uppercase" as const, borderRadius:5, padding:"2px 7px", background:color+"18", color }}>{label}</span>;
}
function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:"20px 22px", ...style }}>{children}</div>;
}
function SectionTitle({ icon, children }: { icon:string; children:React.ReactNode }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
      <span style={{ fontSize:14 }}>{icon}</span>
      <h3 style={{ fontSize:11, fontWeight:700, color:DIM, letterSpacing:"0.08em", textTransform:"uppercase" as const, margin:0 }}>{children}</h3>
    </div>
  );
}
function StatTile({ label, value, color=ACCENT, sub }: { label:string; value:React.ReactNode; color?:string; sub?:string }) {
  return (
    <div style={{ background:color+"0d", border:`1px solid ${color}25`, borderRadius:12, padding:"14px 18px" }}>
      <div style={{ fontSize:22, fontWeight:800, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, fontWeight:600, color:TEXT, marginTop:4 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:DIM, marginTop:2 }}>{sub}</div>}
    </div>
  );
}
function EvolutionBadge({ status }: { status:EvolutionStatus }) {
  const c = status==="EVOLVING"?GREEN:status==="STALLED"?ORANGE:RED;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, background:c+"12", border:`1px solid ${c}30`, borderRadius:20, padding:"4px 12px" }}>
      <span style={{ fontSize:11 }}>{status==="EVOLVING"?"🟢":status==="STALLED"?"🟡":"🔴"}</span>
      <span style={{ fontSize:12, fontWeight:800, color:c, letterSpacing:"0.05em" }}>{status}</span>
    </div>
  );
}

// ─── Phase 1 ───────────────────────────────────────────────────────────────────
function Phase1Panel({ enforced, criticalFailure, criticalReason, actions }: { enforced:boolean; criticalFailure:boolean; criticalReason:string; actions:ExecutionRecord[] }) {
  const ok = actions.filter(a => a.success).length;
  const c  = criticalFailure ? RED : GREEN;
  return (
    <Card style={criticalFailure ? { borderColor:RED+"40", background:RED+"03" } : {}}>
      <SectionTitle icon="⚡">Phase 1 — Activity Enforcement</SectionTitle>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:criticalFailure?12:0 }}>
        <div style={{ fontSize:12, fontWeight:700, color:c, background:c+"10", border:`1px solid ${c}25`, borderRadius:8, padding:"5px 12px" }}>
          {criticalFailure ? "⚠️ BELOW 100% EVOLUTION" : "✅ 100% EVOLUTION MET"}
        </div>
        <span style={{ fontSize:12, color:DIM }}>{ok}/{actions.length} actions succeeded</span>
      </div>
      {criticalFailure && <div style={{ fontSize:12, color:RED, background:RED+"08", borderRadius:8, padding:"10px 14px", lineHeight:1.6 }}>{criticalReason}</div>}
    </Card>
  );
}

// ─── Phase 2 ───────────────────────────────────────────────────────────────────
function Phase2Panel({ classified, executed }: { classified:ClassifiedAction[]; executed:ExecutionRecord[] }) {
  const [tab, setTab] = useState<"executed"|"classified">("executed");
  return (
    <Card>
      <SectionTitle icon="🚀">Phase 2 — Execution Layer</SectionTitle>
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {(["executed","classified"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ fontSize:11, fontWeight:700, padding:"5px 12px", borderRadius:8, border:"none", cursor:"pointer", letterSpacing:"0.04em", textTransform:"uppercase" as const, background:tab===t?ACCENT:"rgba(0,0,0,0.05)", color:tab===t?"#fff":DIM, transition:"all 0.15s" }}>
            {t==="executed"?`Executed (${executed.length})`:`Classified (${classified.length})`}
          </button>
        ))}
      </div>
      {tab==="executed" && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {executed.map(a => (
            <div key={a.actionId} style={{ border:`1px solid ${a.success?GREEN:RED}30`, borderRadius:10, padding:"12px 14px", background:(a.success?GREEN:RED)+"04" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span>{a.success?"✅":"❌"}</span>
                <span style={{ fontSize:13, fontWeight:700, color:TEXT, flex:1 }}>{a.title}</span>
                <Badge label={a.class} color={a.class==="SAFE_AUTO"?GREEN:ORANGE} />
                <span style={{ fontSize:10.5, color:DIM }}>{a.durationMs}ms</span>
              </div>
              <div style={{ fontSize:11.5, color:DIM, lineHeight:1.5, marginBottom:8 }}>{a.outcome}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:10.5, color:DIM }}>Impact</span>
                <ScoreBar value={a.impactScore} color={a.success?GREEN:RED} />
                <span style={{ fontSize:11, fontWeight:700, color:a.success?GREEN:RED, width:26, textAlign:"right" as const }}>{a.impactScore}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab==="classified" && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {classified.map(a => (
            <div key={a.id} style={{ border:`1px solid ${a.class==="SAFE_AUTO"?GREEN:ORANGE}30`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <Badge label={a.class} color={a.class==="SAFE_AUTO"?GREEN:ORANGE} />
                <span style={{ fontSize:13, fontWeight:600, color:TEXT, flex:1 }}>{a.title}</span>
              </div>
              <div style={{ fontSize:11.5, color:DIM }}>{a.reason}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Phase 3 ───────────────────────────────────────────────────────────────────
function Phase3Panel({ trends }: { trends:PerformanceTrend[] }) {
  const sc = (s:EvolutionStatus) => s==="EVOLVING"?GREEN:s==="STALLED"?ORANGE:RED;
  return (
    <Card>
      <SectionTitle icon="🔄">Phase 3 — Feedback Loop ({trends.length} cycles tracked)</SectionTitle>
      {trends.length === 0 ? <div style={{ textAlign:"center" as const, color:DIM, fontSize:12, padding:"20px 0" }}>Trends accumulate after second cycle</div> : (
        <div style={{ overflowX:"auto" as const }}>
          <table style={{ width:"100%", borderCollapse:"collapse" as const, fontSize:11.5 }}>
            <thead><tr>{["Cycle","Status","Actions","Impact","Rate","Stalls"].map(h => (
              <th key={h} style={{ textAlign:"left" as const, padding:"6px 10px", color:DIM, fontWeight:700, fontSize:10, letterSpacing:"0.06em", textTransform:"uppercase" as const, borderBottom:`1px solid ${BORDER}` }}>{h}</th>
            ))}</tr></thead>
            <tbody>{trends.map(t => (
              <tr key={t.cycleNumber} style={{ borderBottom:`1px solid ${BORDER}` }}>
                <td style={{ padding:"8px 10px", fontWeight:700, color:TEXT }}>#{t.cycleNumber}</td>
                <td style={{ padding:"8px 10px" }}><span style={{ fontSize:10, fontWeight:700, color:sc(t.evolutionStatus), background:sc(t.evolutionStatus)+"12", borderRadius:5, padding:"2px 6px" }}>{t.evolutionStatus}</span></td>
                <td style={{ padding:"8px 10px", color:TEXT }}>{t.actionsExecuted}</td>
                <td style={{ padding:"8px 10px" }}><div style={{ display:"flex", alignItems:"center", gap:6 }}><ScoreBar value={t.realImpactScore} color={GREEN} /><span style={{ color:GREEN, fontWeight:700, width:26 }}>{t.realImpactScore}</span></div></td>
                <td style={{ padding:"8px 10px", color:ACCENT, fontWeight:600 }}>{t.evolutionRate}</td>
                <td style={{ padding:"8px 10px", color:t.stalledCount>0?RED:DIM }}>{t.stalledCount}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Phase 4 ───────────────────────────────────────────────────────────────────
function Phase4Panel({ guarantee, proposals }: { guarantee:ExpansionGuarantee; proposals:ExpansionProposal[] }) {
  const TC: Record<string,string> = { new_module:ACCENT, new_integration:PURPLE, new_workflow:GREEN, revenue_opportunity:ORANGE, automation_loop:TEAL };
  return (
    <Card>
      <SectionTitle icon="🌱">Phase 4 — Expansion Guarantee</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
        {[{label:"New Improvement Idea",value:guarantee.newImprovementIdea,color:ACCENT,icon:"💡"},{label:"System Optimisation",value:guarantee.systemOptimisation,color:GREEN,icon:"⚙️"},{label:"Expansion Opportunity",value:guarantee.expansionOpportunity,color:PURPLE,icon:"🚀"}].map(item => (
          <div key={item.label} style={{ background:item.color+"08", border:`1px solid ${item.color}25`, borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:13, marginBottom:6 }}>{item.icon}</div>
            <div style={{ fontSize:10, fontWeight:700, color:item.color, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:6 }}>{item.label}</div>
            <div style={{ fontSize:11.5, color:TEXT, lineHeight:1.5 }}>{item.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {proposals.map(p => { const c = TC[p.type] ?? ACCENT; return (
          <div key={p.id} style={{ border:`1px solid ${c}30`, borderRadius:10, padding:"14px 16px", background:c+"05" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
              <Badge label={p.type.replace(/_/g," ")} color={c} />
              {p.readyNow && <Badge label="Ready now" color={GREEN} />}
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:5 }}>{p.title}</div>
            <div style={{ fontSize:11.5, color:DIM, lineHeight:1.5, marginBottom:8 }}>{p.description}</div>
            <div style={{ fontSize:10.5, color:TEXT, background:"rgba(0,0,0,0.03)", borderRadius:7, padding:"6px 10px" }}><span style={{ fontWeight:600 }}>Gap: </span>{p.currentGap}</div>
          </div>
        );})}
      </div>
    </Card>
  );
}

// ─── Phase 5 ───────────────────────────────────────────────────────────────────
function Phase5Panel({ awareness, plans }: { awareness:SelfAwareness; plans:ConversionPlan[] }) {
  const [ex, setEx] = useState<string|null>(null);
  const pc = (p:string) => p==="immediate"?RED:p==="high"?ORANGE:ACCENT;
  return (
    <Card>
      <SectionTitle icon="🎯">Phase 5 — Reality Priority</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        <StatTile label="Real Modules"      value={awareness.realCount}      color={GREEN}  />
        <StatTile label="Simulated/Partial" value={awareness.simulatedCount} color={ORANGE} />
        <StatTile label="Memory"            value={`${awareness.memoryUsageMB}MB`} color={PURPLE} />
        <StatTile label="Uptime"            value={`${awareness.uptimeHours}h`}    color={TEAL} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:GREEN, marginBottom:8 }}>✅ Real & Live</div>
          {awareness.realModules.map(m => <div key={m.name} style={{ display:"flex", gap:8, marginBottom:7 }}>
            <span style={{ flexShrink:0, width:7, height:7, borderRadius:"50%", background:GREEN, marginTop:5, display:"block" }} />
            <div><div style={{ fontSize:12, fontWeight:600, color:TEXT }}>{m.name}</div><div style={{ fontSize:10.5, color:DIM }}>{m.reason}</div></div>
          </div>)}
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:ORANGE, marginBottom:8 }}>⚠️ Simulated / Partial</div>
          {awareness.simulatedModules.map(m => <div key={m.name} style={{ display:"flex", gap:8, marginBottom:7 }}>
            <span style={{ flexShrink:0, width:7, height:7, borderRadius:"50%", background:m.type==="partial"?ORANGE:RED, marginTop:5, display:"block" }} />
            <div><div style={{ fontSize:12, fontWeight:600, color:TEXT }}>{m.name}</div><div style={{ fontSize:10.5, color:DIM }}>{m.reason}</div></div>
          </div>)}
        </div>
      </div>
      <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:10 }}>Conversion Plans</div>
      {plans.map(p => (
        <div key={p.simulatedComponent} onClick={() => setEx(ex===p.simulatedComponent?null:p.simulatedComponent)} style={{ border:`1px solid ${ex===p.simulatedComponent?pc(p.priority)+"50":BORDER}`, borderRadius:10, padding:"12px 14px", cursor:"pointer", marginBottom:8, background:ex===p.simulatedComponent?pc(p.priority)+"04":"transparent", transition:"all 0.15s" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}><Badge label={p.priority} color={pc(p.priority)} /><span style={{ fontSize:13, fontWeight:600, color:TEXT, flex:1 }}>{p.simulatedComponent}</span><span style={{ fontSize:11, color:DIM }}>{ex===p.simulatedComponent?"▲":"▼"}</span></div>
          {ex===p.simulatedComponent && <div style={{ marginTop:10 }}>
            <div style={{ fontSize:11.5, color:DIM, lineHeight:1.5, marginBottom:8 }}>{p.gap}</div>
            {p.conversionSteps.map((s,i) => <div key={i} style={{ display:"flex", gap:8, marginBottom:5 }}><span style={{ fontSize:11, color:ACCENT, fontWeight:700, minWidth:16 }}>{i+1}.</span><span style={{ fontSize:11.5, color:TEXT }}>{s}</span></div>)}
            <div style={{ marginTop:8, fontSize:11, color:ORANGE, background:ORANGE+"0d", borderRadius:7, padding:"6px 10px" }}><span style={{ fontWeight:600 }}>Blocked by: </span>{p.blockedBy}</div>
          </div>}
        </div>
      ))}
    </Card>
  );
}

// ─── Phase 6 ───────────────────────────────────────────────────────────────────
function Phase6Panel({ status, rate, impact }: { status:EvolutionStatus; rate:number; impact:number }) {
  const c = status==="EVOLVING"?GREEN:status==="STALLED"?ORANGE:RED;
  const defs: Record<EvolutionStatus,string> = { EVOLVING:"≥3 actions, ≥2 success — at or above 100% evolution.", STALLED:"Below action/success threshold — below 100% evolution.", REGRESSING:"Impact dropped >10pts AND <2 successes — evolution moving backwards." };
  return (
    <Card>
      <SectionTitle icon="📊">Phase 6 — Self-Scoring Model</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"auto 1fr 1fr", gap:14, alignItems:"start" }}>
        <div style={{ background:c+"0d", border:`1px solid ${c}30`, borderRadius:12, padding:"16px 22px", textAlign:"center" as const }}>
          <div style={{ fontSize:28, fontWeight:900, color:c }}>{status}</div>
          <div style={{ fontSize:10, color:DIM, marginTop:4, fontWeight:600 }}>Evolution Status</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ background:GREEN+"08", border:`1px solid ${GREEN}25`, borderRadius:10, padding:"12px 16px" }}><div style={{ fontSize:20, fontWeight:800, color:GREEN }}>{rate}</div><div style={{ fontSize:10.5, color:DIM, fontWeight:600, marginTop:3 }}>Evolution Rate (actions/cycle)</div></div>
          <div style={{ background:ACCENT+"08", border:`1px solid ${ACCENT}25`, borderRadius:10, padding:"12px 16px" }}><div style={{ fontSize:20, fontWeight:800, color:ACCENT }}>{impact}</div><div style={{ fontSize:10.5, color:DIM, fontWeight:600, marginTop:3 }}>Real Impact Score (0–100)</div></div>
        </div>
        <div style={{ fontSize:12, color:DIM, lineHeight:1.7, background:c+"06", borderRadius:10, padding:"14px 16px", border:`1px solid ${c}20` }}><strong style={{ color:c }}>{status}: </strong>{defs[status]}</div>
      </div>
    </Card>
  );
}

// ─── Phase 7 ───────────────────────────────────────────────────────────────────
function Phase7Panel({ failsafe, limits }: { failsafe:FailsafeState; limits:Limit[] }) {
  const [op, setOp] = useState<string|null>(null);
  const c = failsafe.criticalAlert?RED:failsafe.escalated?ORANGE:GREEN;
  return (
    <Card style={failsafe.criticalAlert?{ borderColor:RED+"40", background:RED+"03" }:{}}>
      <SectionTitle icon="🛡️">Phase 7 — Failsafe Enforcement</SectionTitle>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:c, background:c+"10", border:`1px solid ${c}25`, borderRadius:8, padding:"6px 12px" }}>{failsafe.criticalAlert?"⚠️ CRITICAL":failsafe.escalated?"⬆️ ESCALATED":"✅ NOMINAL"}</div>
        <span style={{ fontSize:12, color:DIM }}>Stall streak: <strong style={{ color:failsafe.stallCount>0?RED:GREEN }}>{failsafe.stallCount}</strong></span>
      </div>
      {failsafe.alertMessage && <div style={{ fontSize:12, color:c, background:c+"08", borderRadius:8, padding:"10px 14px", marginBottom:14, border:`1px solid ${c}20` }}>{failsafe.alertMessage}</div>}
      {failsafe.restorationSteps.length>0 && <div style={{ marginBottom:14 }}>{failsafe.restorationSteps.map((s,i) => <div key={i} style={{ display:"flex", gap:8, marginBottom:5 }}><span style={{ fontSize:11, color:RED, fontWeight:700, minWidth:16 }}>{i+1}.</span><span style={{ fontSize:11.5, color:TEXT }}>{s}</span></div>)}</div>}
      <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:8 }}>Active Limits ({limits.length})</div>
      {limits.map(l => { const lc = l.severity==="critical"?RED:l.severity==="high"?ORANGE:l.severity==="medium"?ACCENT:DIM; return (
        <div key={l.id} onClick={() => setOp(op===l.id?null:l.id)} style={{ border:`1px solid ${op===l.id?lc+"50":BORDER}`, borderRadius:9, padding:"10px 12px", cursor:"pointer", marginBottom:6, background:op===l.id?lc+"04":"transparent", transition:"all 0.15s" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:10, fontWeight:700, color:lc, background:lc+"15", borderRadius:5, padding:"2px 6px", textTransform:"uppercase" as const }}>{l.severity}</span><span style={{ fontSize:12.5, fontWeight:600, color:TEXT, flex:1 }}>{l.component}</span><span style={{ fontSize:10, color:DIM }}>{op===l.id?"▲":"▼"}</span></div>
          {op===l.id && <div style={{ marginTop:8 }}><p style={{ fontSize:11.5, color:TEXT, lineHeight:1.6, margin:"0 0 6px" }}>{l.description}</p><div style={{ fontSize:11, color:DIM }}><span style={{ fontWeight:600 }}>Blocks: </span>{l.blocksThat.join(" · ")}</div></div>}
        </div>
      );})}
    </Card>
  );
}

// ─── Phase 8 ───────────────────────────────────────────────────────────────────
function Phase8Panel({ moves, breakers }: { moves:NextMove[]; breakers:LimitBreaker[] }) {
  const [bo, setBo] = useState<string|null>(null);
  const RC = ["#f59e0b","#94a3b8","#cd7f32",ACCENT,DIM];
  return (
    <>
      <Card>
        <SectionTitle icon="▲">Phase 8 — Top 5 Next Moves</SectionTitle>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {moves.map((m,i) => (
            <div key={m.rank} style={{ border:`1px solid ${i===0?ACCENT+"40":BORDER}`, borderRadius:12, padding:"16px 18px", background:i===0?ACCENT+"04":"transparent" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                <div style={{ flexShrink:0, width:32, height:32, borderRadius:10, background:RC[i]+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:RC[i] }}>#{m.rank}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" as const }}>
                    <span style={{ fontSize:14, fontWeight:700, color:TEXT }}>{m.title}</span>
                    {m.readyNow && <Badge label="Ready now" color={GREEN} />}
                    <Badge label={m.category.replace(/_/g," ")} color={ACCENT} />
                  </div>
                  <p style={{ fontSize:12, color:DIM, margin:"0 0 10px" }}>{m.description}</p>
                  {[{label:"Impact",value:m.impactScore,color:GREEN},{label:"Ease",value:m.easeScore,color:ACCENT},{label:"Revenue",value:m.revenueScore,color:ORANGE},{label:"Intelligence",value:m.intelligenceScore,color:PURPLE}].map(row => (
                    <div key={row.label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                      <span style={{ fontSize:10, fontWeight:600, color:DIM, width:76, flexShrink:0 }}>{row.label}</span>
                      <ScoreBar value={row.value} color={row.color} />
                      <span style={{ fontSize:11, fontWeight:700, color:row.color, width:30, textAlign:"right" as const }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", gap:10, marginTop:8 }}>
                    <div style={{ fontSize:11.5, color:TEXT, background:"rgba(0,0,0,0.03)", borderRadius:7, padding:"6px 10px", flex:1 }}><span style={{ fontWeight:600 }}>Action: </span>{m.action}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:ACCENT, background:ACCENT+"10", borderRadius:7, padding:"6px 10px", flexShrink:0 }}>⏱ {m.estimatedTime}</div>
                  </div>
                </div>
                <div style={{ flexShrink:0, textAlign:"right" as const }}><div style={{ fontSize:24, fontWeight:800, color:ACCENT }}>{m.totalScore}</div><div style={{ fontSize:9.5, color:DIM, fontWeight:600 }}>SCORE</div></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionTitle icon="🔓">Limit Breakers ({breakers.length})</SectionTitle>
        {breakers.map(b => (
          <div key={b.limitId} onClick={() => setBo(bo===b.limitId?null:b.limitId)} style={{ border:`1px solid ${bo===b.limitId?GREEN+"50":BORDER}`, borderRadius:10, padding:"12px 14px", cursor:"pointer", marginBottom:8, background:bo===b.limitId?GREEN+"04":"transparent", transition:"all 0.15s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}><span>🔓</span><span style={{ fontSize:13, fontWeight:600, color:TEXT, flex:1 }}>{b.component}</span><span style={{ fontSize:11, color:DIM }}>{bo===b.limitId?"▲":"▼"}</span></div>
            {bo===b.limitId && <div style={{ marginTop:10 }}>
              {b.steps.map((s,i) => <div key={i} style={{ display:"flex", gap:8, marginBottom:5 }}><span style={{ fontSize:11, color:ACCENT, fontWeight:700, minWidth:16 }}>{i+1}.</span><span style={{ fontSize:11.5, color:TEXT }}>{s}</span></div>)}
              <div style={{ marginTop:8, padding:"8px 12px", background:GREEN+"0d", borderRadius:8, border:`1px solid ${GREEN}22` }}><span style={{ fontSize:11, fontWeight:600, color:GREEN }}>Impact: </span><span style={{ fontSize:11, color:TEXT }}>{b.estimatedImpact}</span></div>
            </div>}
          </div>
        ))}
      </Card>
    </>
  );
}

// ─── L1 — Integrations Layer ──────────────────────────────────────────────────
function IntegrationsPanel({ report }: { report:IntegrationsReport }) {
  const real   = report.discovered.filter(d => d.type==="real");
  const future = report.discovered.filter(d => d.type==="planned");
  return (
    <Card>
      <SectionTitle icon="🔌">Layer 1 — Integrations (Auto-Discover + Future Simulation)</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        <StatTile label="Real Active"    value={report.realCount}   color={GREEN}  />
        <StatTile label="Future Planned" value={report.futureCount} color={PURPLE} />
        <StatTile label="Auto-Adapted"   value={report.autoAdapted.length}  color={ORANGE} />
        <StatTile label="Newly Detected" value={report.newlyDetected.length} color={TEAL} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:GREEN, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:10 }}>Real Integrations</div>
          {real.map(d => {
            const sc = d.status==="active"?GREEN:d.status==="degraded"?ORANGE:RED;
            return <div key={d.name} style={{ display:"flex", gap:10, marginBottom:9, alignItems:"flex-start" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:sc, marginTop:4, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:TEXT }}>{d.name}</span>
                  <Badge label={d.status} color={sc} />
                </div>
                <div style={{ fontSize:10.5, color:DIM, marginTop:2 }}>{d.autoAdapt}</div>
              </div>
            </div>;
          })}
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:PURPLE, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:10 }}>Future (Simulated)</div>
          {future.map(d => <div key={d.name} style={{ display:"flex", gap:10, marginBottom:9, alignItems:"flex-start" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:PURPLE, marginTop:4, flexShrink:0 }} />
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:TEXT }}>{d.name}</div>
              <div style={{ fontSize:10.5, color:DIM, marginTop:2 }}>{d.autoAdapt}</div>
            </div>
          </div>)}
          {report.autoAdapted.length>0 && (
            <div style={{ marginTop:10, padding:"10px 12px", background:ORANGE+"0a", border:`1px solid ${ORANGE}25`, borderRadius:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:ORANGE, marginBottom:6, textTransform:"uppercase" as const }}>Auto-Adapted This Cycle</div>
              {report.autoAdapted.map((a,i) => <div key={i} style={{ fontSize:11, color:TEXT, marginBottom:4 }}>• {a}</div>)}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── L2 — Data Layer ──────────────────────────────────────────────────────────
function DataLayerPanel({ report }: { report:DataLayerReport }) {
  const pc = report.predictionConfidence;
  const sc = report.predictedNextStatus==="EVOLVING"?GREEN:report.predictedNextStatus==="STALLED"?ORANGE:RED;
  return (
    <Card>
      <SectionTitle icon="🧠">Layer 2 — Data Layer (Predictive · Self-Clean · Feedback)</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:18 }}>
        <StatTile label="Predicted Status"   value={report.predictedNextStatus} color={sc} sub={`${pc}% confidence`} />
        <StatTile label="Data Quality Score" value={`${report.dataQualityScore}%`} color={ACCENT} />
        <StatTile label="Self-Cleaned"       value={report.selfCleaned.length}   color={GREEN}  sub="operations" />
        <StatTile label="Weight Adjustments" value={report.feedbackAdjustments.length} color={PURPLE} sub="this cycle" />
      </div>
      {report.feedbackAdjustments.length>0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:8 }}>Auto Self-Rewrite: Scoring Weight Changes</div>
          {report.feedbackAdjustments.map((a,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7, padding:"8px 12px", background:PURPLE+"06", border:`1px solid ${PURPLE}20`, borderRadius:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:TEXT }}>{a.field}</div>
                <div style={{ fontSize:11, color:DIM }}>{a.reason}</div>
              </div>
              <div style={{ textAlign:"right" as const, flexShrink:0 }}>
                <div style={{ fontSize:11, color:DIM }}>{a.old.toFixed(2)} → <strong style={{ color:PURPLE }}>{a.new.toFixed(2)}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {report.missingDataFilled.length>0 && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:8 }}>Missing Data Filled</div>
          {report.missingDataFilled.map((m,i) => <div key={i} style={{ fontSize:11.5, color:DIM, marginBottom:4 }}>• {m}</div>)}
        </div>
      )}
    </Card>
  );
}

// ─── L3 — Evolution Layer (Future Modules) ────────────────────────────────────
function FutureModulesPanel({ modules, report }: { modules:FutureModule[]; report:EvolutionLayerReport }) {
  const effortColor = (e:string) => e==="low"?GREEN:e==="medium"?ORANGE:RED;
  return (
    <Card>
      <SectionTitle icon="🔭">Layer 3 — Evolution (Future Module Explorer · {report.parallelPhasesRan} Parallel Phases)</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        <StatTile label="Future Modules"   value={modules.length}           color={PURPLE} />
        <StatTile label="Exploration Score" value={`${report.explorationScore}%`} color={ACCENT} />
        <StatTile label="Limits Trend"     value={report.limitsTrend}       color={report.limitsTrend==="decreasing"?GREEN:report.limitsTrend==="increasing"?RED:ORANGE} />
        <StatTile label="New Limits Found" value={report.newLimitsFound}    color={report.newLimitsFound>0?RED:GREEN} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {modules.map(m => (
          <div key={m.id} style={{ border:`1px solid ${PURPLE}20`, borderRadius:10, padding:"14px 16px", background:PURPLE+"04" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
              <Badge label={m.effort} color={effortColor(m.effort)} />
              <Badge label={m.category} color={ACCENT} />
              <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, color:ORANGE }}>Impact {m.impact}</span>
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:5 }}>{m.name}</div>
            <div style={{ fontSize:11.5, color:DIM, lineHeight:1.5, marginBottom:8 }}>{m.description}</div>
            <div style={{ fontSize:10.5, color:DIM, marginBottom:4 }}><span style={{ fontWeight:600, color:TEXT }}>Prerequisite: </span>{m.prerequisite}</div>
            <div style={{ fontSize:10.5, color:GREEN }}><span style={{ fontWeight:600 }}>Est. unlock: </span>{m.estimatedUnlockDate}</div>
            <div style={{ marginTop:8, display:"flex", flexWrap:"wrap" as const, gap:5 }}>
              {m.simulatedCapabilities.map(cap => <span key={cap} style={{ fontSize:9.5, color:PURPLE, background:PURPLE+"10", borderRadius:4, padding:"2px 6px" }}>{cap}</span>)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── L5 — Autonomy Layer ─────────────────────────────────────────────────────
function AutonomyPanel({ report }: { report:AutonomyReport }) {
  return (
    <Card>
      <SectionTitle icon="🤖">Layer 5 — Autonomy (Learn · Submodules · Self-Upgrade)</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        <StatTile label="Autonomy Score"    value={`${report.autonomyScore}%`} color={TEAL} />
        <StatTile label="Decisions Made"    value={report.decisionsMade}       color={ACCENT} sub="all-time" />
        <StatTile label="Active Submodules" value={report.dynamicSubmodules.length} color={PURPLE} />
        <StatTile label="Self-Upgrade"      value={report.selfUpgradeApplied?"Applied":"None"} color={report.selfUpgradeApplied?GREEN:DIM} />
      </div>
      {report.selfUpgradeApplied && (
        <div style={{ marginBottom:14, padding:"10px 14px", background:GREEN+"08", border:`1px solid ${GREEN}25`, borderRadius:8 }}>
          <div style={{ fontSize:10, fontWeight:700, color:GREEN, marginBottom:4, textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>Self-Upgrade Applied</div>
          <div style={{ fontSize:11.5, color:TEXT }}>{report.upgradeDescription}</div>
        </div>
      )}
      {report.failureLearnings.length>0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:10 }}>Failure Learnings</div>
          {report.failureLearnings.map((l,i) => (
            <div key={i} style={{ border:`1px solid ${ORANGE}25`, borderRadius:9, padding:"10px 12px", marginBottom:7, background:ORANGE+"04" }}>
              <div style={{ fontSize:12, fontWeight:600, color:TEXT, marginBottom:4 }}>{l.pattern}</div>
              <div style={{ fontSize:11.5, color:DIM, marginBottom:6 }}>{l.adjustment}</div>
              <div style={{ fontSize:10.5, color:ORANGE }}>Confidence: {l.confidence}%</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:10 }}>Dynamic Submodules</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {report.dynamicSubmodules.map(s => (
          <div key={s.id} style={{ border:`1px solid ${TEAL}25`, borderRadius:9, padding:"10px 12px", background:TEAL+"04" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
              <span style={{ fontSize:9.5, fontWeight:700, color:TEAL, background:TEAL+"15", borderRadius:4, padding:"2px 6px" }}>P{s.priority}</span>
              <span style={{ fontSize:12, fontWeight:700, color:TEXT }}>{s.name}</span>
            </div>
            <div style={{ fontSize:10.5, color:DIM, marginBottom:3 }}><span style={{ fontWeight:600 }}>Trigger: </span>{s.trigger}</div>
            <div style={{ fontSize:10.5, color:TEXT }}><span style={{ fontWeight:600 }}>Action: </span>{s.action}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── L6 — Meta Layer ─────────────────────────────────────────────────────────
function MetaPanel({ meta }: { meta:MetaAnalysis }) {
  const rr = Math.round(meta.realityCheck.realRatio * 100);
  const tc = meta.realityCheck.trajectory==="improving"?GREEN:meta.realityCheck.trajectory==="degrading"?RED:ORANGE;
  return (
    <Card>
      <SectionTitle icon="🔮">Layer 6 — Meta (Reality Check · Future Predictions · Loop Detection)</SectionTitle>
      {meta.infiniteLoopDetected && (
        <div style={{ marginBottom:14, padding:"10px 14px", background:RED+"08", border:`1px solid ${RED}30`, borderRadius:8 }}>
          <div style={{ fontSize:12, fontWeight:700, color:RED }}>{meta.loopWarning}</div>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        <StatTile label="Cycle Score"      value={meta.cycleScore}  color={meta.cycleScore>=70?GREEN:meta.cycleScore>=40?ORANGE:RED} sub="/100" />
        <StatTile label="Real Ratio"       value={`${rr}%`}         color={rr>=70?GREEN:ORANGE} />
        <StatTile label="Reality Trajectory" value={meta.realityCheck.trajectory.toUpperCase()} color={tc} />
        <StatTile label="Loop Detected"    value={meta.infiniteLoopDetected?"YES":"NO"} color={meta.infiniteLoopDetected?RED:GREEN} />
      </div>
      {/* Future predictions */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:12 }}>Future Predictions (if current priority actions executed)</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[{label:"30 Days",value:meta.futurePrediction.thirtyDay,color:GREEN},{label:"60 Days",value:meta.futurePrediction.sixtyDay,color:ACCENT},{label:"90 Days",value:meta.futurePrediction.ninetyDay,color:PURPLE}].map(item => (
            <div key={item.label} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"10px 14px", background:item.color+"06", border:`1px solid ${item.color}20`, borderRadius:9 }}>
              <div style={{ flexShrink:0, fontSize:11, fontWeight:800, color:item.color, minWidth:52 }}>{item.label}</div>
              <div style={{ fontSize:12, color:TEXT, lineHeight:1.6 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Next unlock */}
      <div style={{ marginBottom:16, padding:"12px 16px", background:ORANGE+"08", border:`1px solid ${ORANGE}25`, borderRadius:9 }}>
        <div style={{ fontSize:10, fontWeight:700, color:ORANGE, textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:6 }}>Next Unlock</div>
        <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:4 }}>{meta.futurePrediction.nextUnlock}</div>
        <div style={{ fontSize:11.5, color:DIM }}><span style={{ color:GREEN, fontWeight:600 }}>Time: </span>{meta.futurePrediction.nextUnlockEstimate} · <span style={{ color:ORANGE, fontWeight:600 }}>Cost: </span>{meta.futurePrediction.unlockCost}</div>
      </div>
      {/* Self-reflection */}
      <div style={{ padding:"12px 16px", background:ACCENT+"07", border:`1px solid ${ACCENT}20`, borderRadius:9 }}>
        <div style={{ fontSize:10, fontWeight:700, color:ACCENT, textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:6 }}>Self-Reflection</div>
        <div style={{ fontSize:12, color:TEXT, lineHeight:1.7, marginBottom:8 }}>{meta.selfReflection}</div>
        <div style={{ fontSize:11.5, color:DIM, fontStyle:"italic" }}>"{meta.cycleInsight}"</div>
      </div>
    </Card>
  );
}

// ─── L7 — Finance Layer ───────────────────────────────────────────────────────
function FinancePanel({ report }: { report:FinanceReport }) {
  const b = report.industryBenchmarks;
  const s = report.aboveIndustryScenario;
  const fmt = (n:number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n/1_000).toFixed(0)}k` : `$${n}`;
  return (
    <Card>
      <SectionTitle icon="💰">Layer 7 — Finance (Industry Benchmarks · Revenue Potential · Above-Industry)</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        <StatTile label="Current Revenue"    value={fmt(report.currentRevenue)} color={report.currentRevenue>0?GREEN:RED}       sub={report.revenueMode+" mode"} />
        <StatTile label="Monthly Potential"  value={fmt(report.monthlyPotential)} color={ACCENT} sub="if all limits resolved" />
        <StatTile label="Annual Potential"   value={fmt(report.annualPotential)}  color={PURPLE} sub="if all limits resolved" />
        <StatTile label="Revenue Gap"        value={fmt(report.revenueGap)}       color={ORANGE} sub="untapped/month" />
      </div>
      {/* Industry benchmarks */}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:12 }}>Industry Benchmarks (2025 SaaS)</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {[{label:"Avg SaaS MRR",value:fmt(b.avgSaasMrr)},{label:"AI Platform MRR",value:fmt(b.aiPlatformMrr)},{label:"Top Decile ARR",value:fmt(b.topDecileArr)},{label:"Avg Conversion",value:`${b.avgConversionRate}%`},{label:"Avg Churn",value:`${b.avgChurnRate}%`},{label:"Avg LTV",value:fmt(b.avgLtv)}].map(item => (
            <div key={item.label} style={{ background:"rgba(0,0,0,0.03)", borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:ACCENT }}>{item.value}</div>
              <div style={{ fontSize:10.5, color:DIM, marginTop:2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Above-industry scenario */}
      <div style={{ padding:"14px 16px", background:GREEN+"07", border:`1px solid ${GREEN}25`, borderRadius:10, marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:700, color:GREEN, textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:8 }}>Above-Industry Scenario</div>
        <div style={{ fontSize:12, color:DIM, lineHeight:1.6, marginBottom:10 }}>{s.description}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
          <div style={{ textAlign:"center" as const }}><div style={{ fontSize:18, fontWeight:800, color:GREEN }}>{fmt(s.projectedMrr)}</div><div style={{ fontSize:10, color:DIM }}>Projected MRR</div></div>
          <div style={{ textAlign:"center" as const }}><div style={{ fontSize:18, fontWeight:800, color:PURPLE }}>{fmt(s.projectedArr)}</div><div style={{ fontSize:10, color:DIM }}>Projected ARR</div></div>
          <div style={{ textAlign:"center" as const }}><div style={{ fontSize:14, fontWeight:800, color:ORANGE }}>{s.vsIndustryAvg}</div><div style={{ fontSize:10, color:DIM }}>vs Industry</div></div>
        </div>
        {s.requiredActions.map((a,i) => <div key={i} style={{ display:"flex", gap:8, marginBottom:5 }}><span style={{ fontSize:11, color:GREEN, fontWeight:700, minWidth:16 }}>{i+1}.</span><span style={{ fontSize:11.5, color:TEXT }}>{a}</span></div>)}
        <div style={{ marginTop:8, fontSize:11, color:DIM }}><span style={{ fontWeight:600 }}>Timeline: </span>{s.timeToAchieve}</div>
      </div>
      <div style={{ padding:"10px 14px", background:TEAL+"08", border:`1px solid ${TEAL}25`, borderRadius:8 }}>
        <div style={{ fontSize:11, color:TEXT, marginBottom:4 }}><span style={{ fontWeight:700, color:TEAL }}>Automation Potential: </span>{report.automationPotential}</div>
        <div style={{ fontSize:11, color:DIM }}><span style={{ fontWeight:600 }}>Activation Cost: </span>{report.activationCost}</div>
      </div>
    </Card>
  );
}

// ─── L8 — Safety Layer ────────────────────────────────────────────────────────
function SafetyPanel({ safety }: { safety:SafetyStatus }) {
  const c = safety.complianceScore>=80?GREEN:safety.complianceScore>=50?ORANGE:RED;
  return (
    <Card>
      <SectionTitle icon="✅">Layer 8 — Safety (Rule Enforcement · Compliance)</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        <StatTile label="Compliance Score" value={`${safety.complianceScore}%`}   color={c} />
        <StatTile label="Rules Passed"     value={`${safety.passedRules}/${safety.totalRules}`} color={GREEN} />
        <StatTile label="Violations"       value={safety.violations.length}       color={safety.violations.length>0?RED:GREEN} />
        <StatTile label="All Rules Enforced" value={safety.allRulesEnforced?"YES":"NO"} color={safety.allRulesEnforced?GREEN:RED} />
      </div>
      {safety.violations.length>0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:RED, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:8 }}>Violations</div>
          {safety.violations.map((v,i) => (
            <div key={i} style={{ border:`1px solid ${RED}30`, borderRadius:9, padding:"10px 12px", marginBottom:7, background:RED+"04" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                <Badge label={v.severity} color={v.severity==="critical"?RED:ORANGE} />
                <span style={{ fontSize:12, fontWeight:600, color:TEXT }}>{v.rule}</span>
              </div>
              <div style={{ fontSize:11.5, color:DIM }}>{v.detail}</div>
            </div>
          ))}
        </div>
      )}
      {safety.allRulesEnforced && (
        <div style={{ padding:"10px 14px", background:GREEN+"08", border:`1px solid ${GREEN}25`, borderRadius:8 }}>
          <div style={{ fontSize:12, fontWeight:700, color:GREEN }}>✅ All {safety.totalRules} safety rules enforced</div>
          <div style={{ fontSize:11, color:DIM, marginTop:2 }}>Engine operating within all defined safety bounds</div>
        </div>
      )}
    </Card>
  );
}

// ─── L9 — Loop Orchestrator ───────────────────────────────────────────────────
function OrchestratorPanel({ report }: { report:OrchestratorReport }) {
  return (
    <Card style={{ background:"linear-gradient(135deg, "+ACCENT+"08, "+PURPLE+"08)", border:`1px solid ${ACCENT}25` }}>
      <SectionTitle icon="♾️">Layer 9 — Loop Orchestrator (Infinite Scale · Self-Upgrade · {report.layersRan} Layers)</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        <StatTile label="Layers Ran"       value={report.layersRan}             color={ACCENT} />
        <StatTile label="Loop Iteration"   value={report.loopIteration}         color={PURPLE} />
        <StatTile label="Feedback Valid"   value={report.feedbackValid?"YES":"NO"} color={report.feedbackValid?GREEN:RED} />
        <StatTile label="Infinite Scale"   value={report.infiniteScaleMode?"ON":"OFF"} color={GREEN} />
      </div>
      {report.feedbackIssues.length>0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:ORANGE, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:8 }}>Feedback Issues</div>
          {report.feedbackIssues.map((f,i) => <div key={i} style={{ fontSize:12, color:TEXT, marginBottom:6, padding:"8px 12px", background:ORANGE+"08", borderRadius:7, border:`1px solid ${ORANGE}20` }}>⚠️ {f}</div>)}
        </div>
      )}
      <div style={{ padding:"12px 16px", background:"rgba(255,255,255,0.6)", borderRadius:10, border:`1px solid ${ACCENT}20` }}>
        <div style={{ fontSize:10, fontWeight:700, color:ACCENT, textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:6 }}>
          {report.selfUpgradeCycle ? "🔄 Self-Upgrade Applied" : "✓ No Upgrade Needed"}
        </div>
        <div style={{ fontSize:12, color:TEXT, lineHeight:1.6 }}>{report.upgradeApplied}</div>
      </div>
    </Card>
  );
}

// ─── Limitless Engine Panel ───────────────────────────────────────────────────
const ACTION_ICONS: Record<string, string> = {
  analyze:"🔍", simulate:"🔬", integrate:"🔗", evolve:"🧬",
  expand:"🌱", transcend:"🚀", create:"✨", innovate:"💡", emerge:"🌌",
};

function LimitlessPanel({ report }: { report: LimitlessReport }) {
  const [tab, setTab] = useState<"overview"|"modules"|"marketplace"|"demo"|"upgrades">("overview");

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <Card style={{ background:`linear-gradient(135deg, rgba(99,102,241,0.05), rgba(16,185,129,0.05))`, border:`1.5px solid rgba(99,102,241,0.25)` }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${ACCENT},${PURPLE})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🚀</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:TEXT }}>Limitless Self-Upgrading Engine</div>
          <div style={{ fontSize:11, color:DIM, marginTop:2 }}>
            Core-Everything · SHA-256 uniqueness enforced · emergent submodule growth · cycle #{report.cycleNumber} · {report.coreRunMs}ms
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {report.emergentThisCycle && (
            <div style={{ display:"flex", alignItems:"center", gap:5, background:GREEN+"12", border:`1px solid ${GREEN}30`, borderRadius:20, padding:"4px 12px" }}>
              <span style={{ fontSize:11, fontWeight:700, color:GREEN }}>+EMERGENT</span>
            </div>
          )}
          <div style={{ background:ACCENT+"10", border:`1px solid ${ACCENT}25`, borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700, color:ACCENT }}>
            LIMITLESS
          </div>
        </div>
      </div>

      {/* Score tiles — all 4 standalone metrics from spec CycleReport */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        <StatTile label="Score"      value={report.score}             color={report.score>=70?GREEN:ORANGE}    sub="/100" />
        <StatTile label="Impact"     value={report.impact}            color={ACCENT}                           sub="/100" />
        <StatTile label="Compliance" value={`${report.compliance}%`}  color={report.compliance>=80?GREEN:ORANGE} />
        <StatTile label="Autonomy"   value={`${report.autonomy}%`}    color={TEAL} />
      </div>
      {/* Secondary row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
        <StatTile label="Emergent Modules" value={report.totalEmergentModules} color={PURPLE} sub="total created" />
        <StatTile label="Upgrades"         value={report.upgrades.length}      color={ACCENT} sub="in registry" />
        <StatTile label="Actions"          value={report.actions.length + 1}   color={GREEN}  sub="this cycle" />
      </div>

      {/* Dynamic action + upgrade banner */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
        <div style={{ padding:"9px 14px", borderRadius:9, background:PURPLE+"0A", border:`1px solid ${PURPLE}25` }}>
          <div style={{ fontSize:9.5, fontWeight:700, color:PURPLE, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:4 }}>⚡ Emergent Action (this cycle)</div>
          <div style={{ fontSize:10.5, color:TEXT, fontFamily:"monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{report.dynamicAction}</div>
        </div>
        <div style={{ padding:"9px 14px", borderRadius:9, background:GREEN+"0A", border:`1px solid ${GREEN}25` }}>
          <div style={{ fontSize:9.5, fontWeight:700, color:GREEN, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:4 }}>🔧 Upgrade (this cycle)</div>
          <div style={{ fontSize:10.5, color:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{report.upgradeThisCycle.effect}</div>
        </div>
      </div>

      {/* Actions this cycle */}
      <div style={{ display:"flex", flexWrap:"wrap" as const, gap:8, marginBottom:18 }}>
        <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:"0.06em", textTransform:"uppercase" as const, width:"100%", marginBottom:2 }}>Actions this cycle</div>
        {report.actions.map(a => (
          <div key={a} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 14px", borderRadius:20, background:ACCENT+"0D", border:`1px solid ${ACCENT}30`, fontSize:12, fontWeight:700, color:ACCENT }}>
            <span>{ACTION_ICONS[a] ?? "⚡"}</span> {a}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" as const }}>
        {(["overview","modules","marketplace","demo","upgrades"] as const).map(t => (
          <button key={t} onClick={() => setTab(t as typeof tab)} style={{ fontSize:11, fontWeight:700, padding:"5px 14px", borderRadius:8, border:"none", cursor:"pointer", letterSpacing:"0.04em", textTransform:"uppercase" as const, background:tab===t?ACCENT:"rgba(0,0,0,0.05)", color:tab===t?"#fff":DIM, transition:"all 0.15s" }}>
            {t==="overview"?"Overview":t==="modules"?`Submodule Tree (${report.coreSubmoduleCount})`:t==="marketplace"?`Marketplace (${report.marketplaceStats.userCount} users)`:t==="demo"?"Demo Simulation":`Upgrades (${report.upgrades.length})`}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab==="overview" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div style={{ border:`1px solid ${ACCENT}20`, borderRadius:10, padding:"14px 16px", background:ACCENT+"04" }}>
            <div style={{ fontSize:11, fontWeight:700, color:ACCENT, marginBottom:8, letterSpacing:"0.04em" }}>🧠 CORE MODULE</div>
            <div style={{ fontSize:12, color:TEXT, marginBottom:4 }}><strong>Core-Everything</strong></div>
            <div style={{ fontSize:11, color:DIM, marginBottom:4 }}>Hash: <code style={{ fontFamily:"monospace", background:"rgba(0,0,0,0.05)", padding:"1px 5px", borderRadius:4 }}>{report.coreHash}</code></div>
            <div style={{ fontSize:11, color:DIM, marginBottom:4 }}>Submodule tree depth: {report.coreSubmoduleCount} nodes</div>
            <div style={{ fontSize:11, color:DIM, marginBottom:4 }}>Total emergent created: <strong style={{ color:PURPLE }}>{report.totalEmergentModules}</strong></div>
            {report.emergentThisCycle && report.newEmergentName && (
              <div style={{ fontSize:10.5, color:GREEN, marginTop:6, background:GREEN+"08", borderRadius:6, padding:"4px 8px" }}>
                ✨ New this cycle: {report.newEmergentName.replace("Emergent-","").slice(0,40)}
              </div>
            )}
          </div>
          <div style={{ border:`1px solid ${GREEN}20`, borderRadius:10, padding:"14px 16px", background:GREEN+"04" }}>
            <div style={{ fontSize:11, fontWeight:700, color:GREEN, marginBottom:8, letterSpacing:"0.04em" }}>🏪 MARKETPLACE SNAPSHOT</div>
            <div style={{ fontSize:12, color:TEXT, marginBottom:4 }}>{report.marketplaceStats.userCount} users · {report.marketplaceStats.itemCount} items</div>
            <div style={{ fontSize:11, color:DIM, marginBottom:4 }}>Total transactions: {report.marketplaceStats.totalTransactions}</div>
            <div style={{ fontSize:11, color:DIM, marginBottom:4 }}>Platform earnings: <strong style={{ color:GREEN }}>{fmt(report.marketplaceStats.platformEarnings)}</strong></div>
            <div style={{ fontSize:10, color:DIM, marginTop:6 }}>75% creator / 25% platform on each purchase</div>
          </div>
        </div>
      )}

      {/* Submodule tree */}
      {tab==="modules" && (
        <div>
          <div style={{ fontSize:11, color:DIM, marginBottom:12, lineHeight:1.6 }}>
            The <strong>Core-Everything</strong> module creates an emergent submodule on each run with 50% probability. Submodules also spawn their own children. The tree grows organically each 2-min cycle. <strong style={{ color:PURPLE }}>{report.totalEmergentModules} emergent modules</strong> have been created since boot.
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ border:`1px solid ${ACCENT}30`, borderRadius:10, padding:"12px 16px", background:ACCENT+"06" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:ACCENT, flexShrink:0 }} />
                <span style={{ fontSize:13, fontWeight:800, color:TEXT }}>Core-Everything</span>
                <Badge label="root" color={ACCENT} />
              </div>
              <div style={{ fontSize:11, color:DIM }}>Hash: <code style={{ fontFamily:"monospace" }}>{report.coreHash}</code></div>
              <div style={{ fontSize:11, color:DIM, marginTop:4 }}>Children: <strong>{report.coreSubmoduleCount}</strong> nodes in tree · Total emergent: <strong style={{ color:PURPLE }}>{report.totalEmergentModules}</strong></div>
              {report.emergentThisCycle && (
                <div style={{ marginTop:8, padding:"6px 10px", borderRadius:7, background:GREEN+"0A", border:`1px solid ${GREEN}25`, fontSize:11, color:GREEN }}>
                  ✨ New emergent spawned this cycle{report.newEmergentName ? `: ${report.newEmergentName.replace("Emergent-Core-Everything-","#")}` : ""}
                </div>
              )}
            </div>
            {report.totalEmergentModules===0 && (
              <div style={{ fontSize:11, color:DIM, textAlign:"center" as const, padding:16 }}>No emergent submodules yet. First run in progress — 50% chance on next cycle.</div>
            )}
            {report.totalEmergentModules>0 && (
              <div style={{ padding:"10px 16px", background:"rgba(0,0,0,0.03)", borderRadius:9, border:"1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:10, color:DIM, marginBottom:6, fontWeight:600 }}>EMERGENT GROWTH CHART</div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:60 }}>
                  {Array.from({ length: Math.min(report.totalEmergentModules, 20) }, (_, i) => {
                    const h = Math.max(8, Math.round((i + 1) / report.totalEmergentModules * 50));
                    return <div key={i} style={{ flex:1, background:`linear-gradient(to top, ${PURPLE}, ${ACCENT})`, borderRadius:3, height:h, opacity:0.6 + 0.4 * ((i+1)/report.totalEmergentModules) }} />;
                  })}
                </div>
                <div style={{ fontSize:10, color:DIM, marginTop:4 }}>{report.totalEmergentModules} modules · growing every cycle</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Marketplace */}
      {tab==="marketplace" && (
        <div>
          <div style={{ fontSize:11, color:DIM, marginBottom:12, lineHeight:1.6 }}>
            Creator marketplace with <strong>SHA-256 uniqueness enforcement</strong> — every item must be semantically unique. 75% of purchase revenue goes to the creator, 25% to the platform. {report.marketplaceStats.itemCount} items listed.
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:8 }}>Users ({report.marketplaceUsers.length})</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {report.marketplaceUsers.map(u => (
                <div key={u.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", border:`1px solid ${ACCENT}20`, borderRadius:9, background:ACCENT+"04" }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${ACCENT},${PURPLE})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13, flexShrink:0 }}>{u.name.charAt(0).toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:TEXT }}>{u.name}</div>
                    <div style={{ fontSize:10.5, color:DIM }}>Joined {new Date(u.joinedAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign:"right" as const }}>
                    <div style={{ fontSize:13, fontWeight:800, color:GREEN }}>{fmt(u.earnings)}</div>
                    <div style={{ fontSize:10, color:DIM }}>creator earnings</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {report.marketplaceItems.length > 0 && (
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:8 }}>Items ({report.marketplaceItems.length})</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {report.marketplaceItems.map(item => (
                  <div key={item.id} style={{ border:`1px solid ${GREEN}20`, borderRadius:9, padding:"10px 12px", background:GREEN+"04" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:TEXT, marginBottom:4 }}>{item.name}</div>
                    <div style={{ fontSize:10.5, color:DIM, marginBottom:6 }}>{item.description}</div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" as const }}>
                      <span style={{ fontSize:11, color:GREEN, fontWeight:700 }}>{fmt(item.price)}</span>
                      <span style={{ fontSize:10, color:DIM }}>{item.purchases} purchases</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {report.marketplaceItems.length === 0 && (
            <div style={{ textAlign:"center" as const, padding:16, fontSize:11, color:DIM }}>No items listed yet. Items can be created with uniqueness enforcement via the engine.</div>
          )}
        </div>
      )}

      {/* Demo simulation */}
      {tab==="demo" && (
        <div>
          <div style={{ fontSize:11, color:DIM, marginBottom:14, lineHeight:1.6 }}>
            Per-cycle simulation of earnings scaled to 1,000,000× — as specified by the Limitless Engine. This runs automatically every 2-minute cycle.
          </div>
          <div style={{ border:`2px solid ${GREEN}30`, borderRadius:12, padding:"18px 20px", background:GREEN+"06", marginBottom:16 }}>
            <div style={{ fontSize:11, color:DIM, marginBottom:4 }}>Simulated Scaled Total</div>
            <div style={{ fontSize:32, fontWeight:900, color:GREEN, letterSpacing:"-0.02em" }}>
              {fmt(report.marketplaceDemo.scaledTotal)}
            </div>
            <div style={{ fontSize:11, color:DIM, marginTop:4 }}>per-user base × 1,000,000 scaling factor</div>
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:10 }}>Per-User Simulation</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {Object.entries(report.marketplaceDemo.perUser).map(([name, val]) => (
                <div key={name} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ fontSize:12, color:TEXT, width:140, flexShrink:0 }}>{name}</div>
                  <div style={{ flex:1, height:8, background:"rgba(0,0,0,0.06)", borderRadius:4, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:4, background:`linear-gradient(90deg,${GREEN},${TEAL})`, width:`${Math.min(100,(val/200)*100)}%` }} />
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:GREEN, width:60, textAlign:"right" as const }}>{fmt(val)}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize:10, color:DIM, borderTop:`1px solid rgba(0,0,0,0.06)`, paddingTop:12 }}>
            Platform earnings (real): <strong style={{ color:ACCENT }}>{fmt(report.marketplaceDemo.platformEarnings)}</strong> · Simulation re-runs every cycle automatically
          </div>
        </div>
      )}

      {/* Upgrades tab */}
      {tab==="upgrades" && (
        <div>
          <div style={{ fontSize:11, color:DIM, marginBottom:14, lineHeight:1.6 }}>
            One named upgrade is generated every 2-minute cycle — stored permanently in the upgrade registry. Upgrades represent emergent self-improvement events applied to the engine. <strong style={{ color:ACCENT }}>{report.upgrades.length} total</strong> since boot.
          </div>

          {/* Upgrade this cycle — highlighted */}
          <div style={{ border:`2px solid ${GREEN}35`, borderRadius:12, padding:"14px 18px", background:GREEN+"07", marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:700, color:GREEN, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:8 }}>🔧 This cycle — Cycle #{report.upgradeThisCycle.cycle}</div>
            <div style={{ fontSize:15, fontWeight:800, color:TEXT, marginBottom:4 }}>{report.upgradeThisCycle.name}</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Badge label={report.upgradeThisCycle.effect} color={ACCENT} />
              <span style={{ fontSize:10, color:DIM }}>{new Date(report.upgradeThisCycle.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* All upgrades list */}
          <div style={{ display:"flex", flexDirection:"column", gap:7, maxHeight:360, overflowY:"auto" as const }}>
            {[...report.upgrades].reverse().map((u, i) => {
              const isCurrent = u.id === report.upgradeThisCycle.id;
              return (
                <div key={u.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", border:`1px solid ${isCurrent?GREEN:ACCENT}20`, borderRadius:9, background:isCurrent?GREEN+"06":ACCENT+"04" }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:isCurrent?GREEN:ACCENT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"#fff", flexShrink:0 }}>
                    {report.upgrades.length - i}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11.5, fontWeight:700, color:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{u.name}</div>
                    <div style={{ fontSize:10.5, color:DIM }}>{u.effect}</div>
                  </div>
                  <div style={{ textAlign:"right" as const, flexShrink:0 }}>
                    <div style={{ fontSize:10, color:DIM }}>Cycle #{u.cycle}</div>
                    <div style={{ fontSize:9.5, color:DIM }}>{new Date(u.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Universe Connector Panel ─────────────────────────────────────────────────
function UniversePanel({ report }: { report:UniverseReport }) {
  const [tab, setTab] = useState<"modules"|"units"|"ideas"|"phases">("modules");

  const bySource = (src:string) => report.modules.filter(m => m.source === src);
  const seedMods  = bySource("seed");
  const univMods  = bySource("infinite-universe-scanner");

  const byCategory = (cat:string) => report.units.filter(u => u.category === cat);

  const statusColor = (s:string) => s==="live"?GREEN:s==="degraded"?ORANGE:s==="pending"?DIM:PURPLE;
  const sourceColor = (s:string) => s==="infinite-universe-scanner"?PURPLE:s==="auto-discovered"?TEAL:ACCENT;
  const catColor    = (c:string) => c==="universe"?PURPLE:c==="layer"?ACCENT:c==="phase"?GREEN:TEAL;

  return (
    <Card style={{ background:`linear-gradient(135deg, ${PURPLE}07, ${TEAL}07)`, border:`1px solid ${PURPLE}30` }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${PURPLE},${TEAL})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🌐</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:TEXT }}>Infinite Universe Connector</div>
          <div style={{ fontSize:11, color:DIM, marginTop:2 }}>
            {report.connected ? `Connected ${report.connectedAt ? new Date(report.connectedAt).toLocaleTimeString() : ""} · ${report.lastScanMs.toLocaleString()}ms scan · auto-discovers legal, safe, real APIs` : "Not yet connected"}
          </div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {report.connected && <div style={{ display:"flex", alignItems:"center", gap:5, background:GREEN+"12", border:`1px solid ${GREEN}30`, borderRadius:20, padding:"4px 12px" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:GREEN, display:"inline-block", animation:"pulse 2s infinite" }} />
            <span style={{ fontSize:11, fontWeight:700, color:GREEN }}>CONNECTED</span>
          </div>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        <StatTile label="Engine Units"       value={report.unitCount}          color={ACCENT}  sub="registered" />
        <StatTile label="Discovered Modules" value={report.discoveredModuleCount} color={PURPLE} sub="all sources" />
        <StatTile label="Meta-Phases"        value={report.metaPhaseCount}     color={TEAL}    sub="dynamic" />
        <StatTile label="Expansion Ideas"    value={report.expansionIdeaCount} color={GREEN}   sub="generated" />
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {(["modules","units","ideas","phases"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ fontSize:11, fontWeight:700, padding:"5px 14px", borderRadius:8, border:"none", cursor:"pointer", letterSpacing:"0.04em", textTransform:"uppercase" as const, background:tab===t?PURPLE:"rgba(0,0,0,0.05)", color:tab===t?"#fff":DIM, transition:"all 0.15s" }}>
            {t==="modules"?`Modules (${report.discoveredModuleCount})`:t==="units"?`Units (${report.unitCount})`:t==="ideas"?`Ideas (${report.expansionIdeaCount})`:`Phases (${report.metaPhaseCount})`}
          </button>
        ))}
      </div>

      {/* Modules tab */}
      {tab==="modules" && (
        <div>
          {univMods.length>0 && (
            <>
              <div style={{ fontSize:10, fontWeight:700, color:PURPLE, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:10 }}>
                🌐 Universe-Discovered ({univMods.length})
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {univMods.map(m => (
                  <div key={m.name} style={{ border:`1px solid ${statusColor(m.status)}30`, borderRadius:10, padding:"12px 14px", background:statusColor(m.status)+"05" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:statusColor(m.status), flexShrink:0 }} />
                      <span style={{ fontSize:13, fontWeight:700, color:TEXT, flex:1 }}>{m.name}</span>
                      <Badge label={m.status} color={statusColor(m.status)} />
                    </div>
                    <div style={{ fontSize:11, color:DIM, lineHeight:1.5, marginBottom:6 }}>{m.description}</div>
                    {m.endpoint && <div style={{ fontSize:10, color:PURPLE, background:PURPLE+"08", borderRadius:5, padding:"3px 8px", fontFamily:"monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{m.endpoint}</div>}
                    {m.lastChecked && <div style={{ fontSize:9.5, color:DIM, marginTop:4 }}>Checked: {new Date(m.lastChecked).toLocaleTimeString()}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
          <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:10 }}>
            Seed Modules ({seedMods.length})
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {seedMods.map(m => (
              <div key={m.name} style={{ border:`1px solid ${GREEN}20`, borderRadius:9, padding:"10px 12px", background:GREEN+"04" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:GREEN, flexShrink:0 }} />
                  <span style={{ fontSize:12, fontWeight:700, color:TEXT }}>{m.name}</span>
                </div>
                <div style={{ fontSize:10.5, color:DIM }}>{m.description}</div>
                <div style={{ fontSize:9.5, color:ACCENT, marginTop:4 }}>{m.source}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Units tab */}
      {tab==="units" && (
        <div>
          {(["universe","layer","phase"] as const).map(cat => {
            const catUnits = byCategory(cat);
            if (catUnits.length===0) return null;
            return (
              <div key={cat} style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, fontWeight:700, color:catColor(cat), letterSpacing:"0.06em", textTransform:"uppercase" as const, marginBottom:10 }}>
                  {cat==="universe"?"🌐":cat==="layer"?"⚡":"⚙️"} {cat.charAt(0).toUpperCase()+cat.slice(1)} Units ({catUnits.length})
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {catUnits.map(u => (
                    <div key={u.id} style={{ border:`1px solid ${catColor(cat)}20`, borderRadius:9, padding:"10px 14px", background:catColor(cat)+"04" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:u.lastResult?6:0 }}>
                        <Badge label={u.source} color={sourceColor(u.source)} />
                        <span style={{ fontSize:12, fontWeight:700, color:TEXT, flex:1 }}>{u.name}</span>
                        {u.lastResult && <span style={{ fontSize:10, color:u.lastResult.success?GREEN:RED }}>{u.lastResult.success?"✓":"✗"} {u.lastResult.probeMs}ms</span>}
                      </div>
                      {u.lastResult && (
                        <div style={{ fontSize:10.5, color:DIM, lineHeight:1.5 }}>
                          {u.lastResult.outcome.slice(0, 120)}{u.lastResult.outcome.length>120?"…":""}
                        </div>
                      )}
                      {!u.lastResult && <div style={{ fontSize:10.5, color:DIM }}>{u.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expansion Ideas tab */}
      {tab==="ideas" && (
        <div>
          <div style={{ fontSize:11, color:DIM, marginBottom:12, lineHeight:1.6 }}>
            {report.expansionIdeaCount} expansion ideas generated by the engine — any legal, safe, real API or capability can be integrated. Ideas are generated automatically when evolution drops below 100% or when universe modules are discovered.
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {report.expansionIdeas.map((idea, i) => (
              <div key={i} style={{ display:"flex", gap:10, padding:"10px 14px", background:i<3?GREEN+"06":ACCENT+"06", border:`1px solid ${i<3?GREEN:ACCENT}20`, borderRadius:9 }}>
                <div style={{ flexShrink:0, width:22, height:22, borderRadius:7, background:i<3?GREEN:ACCENT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"#fff" }}>{i+1}</div>
                <div style={{ fontSize:12, color:TEXT, lineHeight:1.6, flex:1 }}>{idea}</div>
                {i<3 && <Badge label="top" color={GREEN} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta-Phases tab */}
      {tab==="phases" && (
        <div>
          <div style={{ fontSize:11, color:DIM, marginBottom:12 }}>
            {report.metaPhaseCount} meta-phases registered — each represents a functional layer, phase, or universe module tracked by the engine.
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
            {report.metaPhases.map((phase, i) => {
              const isUniverse = phase.startsWith("UniversePhase");
              const isLayer    = phase.startsWith("Layer");
              const c = isUniverse?PURPLE:isLayer?ACCENT:GREEN;
              return (
                <div key={i} style={{ border:`1px solid ${c}20`, borderRadius:8, padding:"8px 10px", background:c+"05" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:c, letterSpacing:"0.04em", marginBottom:3 }}>{isUniverse?"UNIVERSE":isLayer?"LAYER":"PHASE"}</div>
                  <div style={{ fontSize:11, color:TEXT, lineHeight:1.4 }}>{phase.replace(/^(Phase-|Layer-|UniversePhase-)/,"")}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AboveTranscendPage() {
  const qc = useQueryClient();

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey:       ["above-transcend"],
    queryFn:        fetchLatest,
    refetchInterval: 30_000,
    staleTime:       15_000,
  });

  const runMutation = useMutation({
    mutationFn: triggerRun,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["above-transcend"] }),
  });

  const cycle  = data?.cycle;
  const ready  = data?.ready ?? false;
  const lastMs = dataUpdatedAt ? Math.round((Date.now() - dataUpdatedAt) / 1000) : null;

  return (
    <div style={{ minHeight:"100vh", background:BG, padding:"28px 24px 60px" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
      <div style={{ maxWidth:1060, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:16, marginBottom:28 }}>
          <div style={{ width:48, height:48, borderRadius:14, flexShrink:0, background:`linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:`0 4px 14px ${ACCENT}40` }}>▲</div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" as const }}>
              <h1 style={{ fontSize:22, fontWeight:800, color:TEXT, margin:0 }}>Above-Transcend Engine</h1>
              <div style={{ display:"flex", alignItems:"center", gap:5, background:GREEN+"12", border:`1px solid ${GREEN}30`, borderRadius:20, padding:"3px 10px" }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:GREEN, display:"inline-block", animation:"pulse 2s infinite" }} />
                <span style={{ fontSize:11, fontWeight:700, color:GREEN }}>RUNNING</span>
              </div>
              <Badge label="NO LIMITS EDITION" color={PURPLE} />
              <Badge label="9 LAYERS ACTIVE" color={ACCENT} />
              {cycle && <EvolutionBadge status={cycle.systemStatus} />}
            </div>
            <p style={{ fontSize:12.5, color:DIM, margin:"5px 0 0", lineHeight:1.6 }}>
              9 real layers · <strong style={{ color:TEXT }}>cycleInterval:2min · minEfficiency:1.0 · maxExpansion:∞ · autoSelfRewrite:true</strong> · There is no completion state. Only continuous evolution.
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            {lastMs !== null && <span style={{ fontSize:11, color:DIM }}>Updated {lastMs}s ago</span>}
            <button onClick={() => runMutation.mutate()} disabled={runMutation.isPending} style={{ height:36, borderRadius:9, padding:"0 16px", border:"none", background:runMutation.isPending?DIM:ACCENT, color:"#fff", fontSize:13, fontWeight:700, cursor:runMutation.isPending?"not-allowed":"pointer" }}>
              {runMutation.isPending ? "Running…" : "▶ Run Now"}
            </button>
          </div>
        </div>

        {/* States */}
        {isLoading && <Card style={{ textAlign:"center" as const, padding:48 }}><div style={{ fontSize:32, marginBottom:12 }}>⚙️</div><div style={{ fontSize:15, fontWeight:700, color:TEXT }}>Booting 9-layer engine…</div><div style={{ fontSize:12, color:DIM, marginTop:6 }}>Running 5 SAFE_AUTO probes · scanning 9 layers in parallel · enforcing 8 phases</div></Card>}
        {error && <Card style={{ borderColor:RED+"40", background:RED+"05" }}><div style={{ fontSize:13, color:RED }}>Engine error: {(error as Error).message}</div></Card>}
        {!isLoading && ready===false && !error && <Card style={{ textAlign:"center" as const, padding:48 }}><div style={{ fontSize:32, marginBottom:12 }}>🔄</div><div style={{ fontSize:15, fontWeight:700, color:TEXT }}>Cycle in progress…</div><div style={{ fontSize:12, color:DIM, marginTop:6 }}>Auto-refreshes every 30s</div></Card>}

        {/* Main data */}
        {ready && cycle && (
          <>
            {cycle.criticalFailure && (
              <div style={{ marginBottom:20, padding:"14px 20px", background:RED+"08", border:`1px solid ${RED}30`, borderRadius:12, display:"flex", gap:12 }}>
                <span style={{ fontSize:18 }}>🚨</span>
                <div><div style={{ fontSize:13, fontWeight:800, color:RED, marginBottom:4 }}>CRITICAL FAILURE — System below 100% evolution</div><div style={{ fontSize:12, color:RED+"cc" }}>{cycle.criticalReason}</div></div>
              </div>
            )}

            {/* Summary — 8 tiles × 2 rows */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:8 }}>
              <StatTile label="Evolution Status"  value={cycle.systemStatus} color={cycle.systemStatus==="EVOLVING"?GREEN:cycle.systemStatus==="STALLED"?ORANGE:RED} />
              <StatTile label="Cycle Score"        value={cycle.summary.cycleScore}      color={cycle.summary.cycleScore>=70?GREEN:ORANGE} sub="/100" />
              <StatTile label="Compliance Score"   value={`${cycle.summary.complianceScore}%`} color={cycle.summary.complianceScore>=80?GREEN:ORANGE} />
              <StatTile label="Autonomy Score"     value={`${cycle.summary.autonomyScore}%`}   color={TEAL} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:8 }}>
              <StatTile label="Actions Executed"  value={cycle.summary.actionsExecuted} color={GREEN} sub="this cycle" />
              <StatTile label="Real Impact Score" value={cycle.summary.realImpactScore} color={ACCENT} sub="/100" />
              <StatTile label="Real Integrations" value={cycle.summary.realIntegrations} color={GREEN} />
              <StatTile label="Future Modules"    value={cycle.summary.futureModuleCount} color={PURPLE} sub="simulated" />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:8 }}>
              <StatTile label="Universe Units"     value={cycle.summary.universeUnits}       color={PURPLE} sub="registered" />
              <StatTile label="Discovered Modules" value={cycle.summary.discoveredModules}   color={TEAL}   sub="all sources" />
              <StatTile label="Meta-Phases"        value={cycle.summary.universeMeta}        color={ACCENT} sub="dynamic" />
              <StatTile label="Expansion Ideas"    value={cycle.summary.totalExpansionIdeas} color={GREEN}  sub="generated" />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:24 }}>
              <StatTile label="Limitless Score"    value={cycle.summary.limitlessScore}      color={cycle.summary.limitlessScore>=70?GREEN:ORANGE} sub="/100" />
              <StatTile label="Emergent Modules"   value={cycle.summary.totalEmergentModules} color={PURPLE} sub="auto-created" />
              <StatTile label="Marketplace Users"  value={cycle.summary.marketplaceUsers}    color={ACCENT} sub="creators" />
              <StatTile label="Demo Sim Total"     value={`$${Math.round(cycle.summary.marketplaceDemoTotal/1_000_000)}M`} color={GREEN} sub="scaled 1M×" />
            </div>

            {/* 8 Phase panels */}
            <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:24 }}>
              <Phase1Panel enforced={cycle.activityEnforced} criticalFailure={cycle.criticalFailure} criticalReason={cycle.criticalReason} actions={cycle.executedActions} />
              <Phase2Panel classified={cycle.classifiedActions} executed={cycle.executedActions} />
              <Phase3Panel trends={cycle.performanceTrend} />
              <Phase4Panel guarantee={cycle.expansionGuarantee} proposals={cycle.expansions} />
              <Phase5Panel awareness={cycle.awareness} plans={cycle.conversionPlans} />
              <Phase6Panel status={cycle.systemStatus} rate={cycle.evolutionRate} impact={cycle.realImpactScore} />
              <Phase7Panel failsafe={cycle.failsafe} limits={cycle.limits} />
              <Phase8Panel moves={cycle.nextMoves} breakers={cycle.breakers} />
            </div>

            {/* 9 Layer section header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, padding:"12px 18px", background:ACCENT+"08", border:`1px solid ${ACCENT}20`, borderRadius:12 }}>
              <span style={{ fontSize:18 }}>⚡</span>
              <div>
                <div style={{ fontSize:13, fontWeight:800, color:ACCENT }}>No Limits Edition — 9 Active Layers + Infinite Universe Connector</div>
                <div style={{ fontSize:11, color:DIM }}>
                  All layers ran in parallel · autoSelfRewrite:true · infiniteScaling:true · feedbackCycle:true · universeConnected:{cycle.universeReport.connected?"true":"false"}
                  {" "}· {cycle.universeReport.unitCount} units · {cycle.universeReport.discoveredModuleCount} modules · {cycle.universeReport.expansionIdeaCount} ideas
                </div>
              </div>
              <div style={{ marginLeft:"auto", textAlign:"right" as const }}>
                <div style={{ fontSize:11, color:DIM }}>Loop #{cycle.orchestratorReport.loopIteration}</div>
                <div style={{ fontSize:11, color:GREEN, fontWeight:600 }}>UI v{cycle.frontendReport.uiVersion}</div>
              </div>
            </div>

            {/* 9 Layer panels */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <IntegrationsPanel report={cycle.integrationsReport} />
              <DataLayerPanel    report={cycle.dataLayerReport} />
              <FutureModulesPanel modules={cycle.futureModules} report={cycle.evolutionLayerReport} />
              <AutonomyPanel     report={cycle.autonomyReport} />
              <MetaPanel         meta={cycle.metaAnalysis} />
              <FinancePanel      report={cycle.financeReport} />
              <SafetyPanel       safety={cycle.safetyStatus} />
              <OrchestratorPanel report={cycle.orchestratorReport} />
              <LimitlessPanel    report={cycle.limitlessReport} />
              <UniversePanel     report={cycle.universeReport} />
            </div>

            {/* Footer */}
            <div style={{ marginTop:24, padding:"14px 20px", background:ACCENT+"08", border:`1px solid ${ACCENT}20`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"space-between" as const }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:ACCENT }}>⚡ Above-Transcend Engine — No Limits Edition v3</div>
                <div style={{ fontSize:11, color:DIM, marginTop:2 }}>Cycle #{cycle.cycleNumber} · {new Date(cycle.completedAt).toLocaleTimeString()} · {cycle.durationMs}ms · 9 layers · 2-min loop</div>
              </div>
              <div style={{ fontSize:11, color:DIM, textAlign:"right" as const }}>
                <div>Next auto-cycle in ~2 min</div>
                <div style={{ marginTop:2 }}>Stall streak: <strong style={{ color:cycle.failsafe.stallCount>0?RED:GREEN }}>{cycle.failsafe.stallCount}</strong> · Score: <strong style={{ color:ACCENT }}>{cycle.metaAnalysis.cycleScore}/100</strong></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
