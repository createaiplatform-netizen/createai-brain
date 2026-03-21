import app from "./app";
import { bootstrapServices }     from "./container/bootstrap";
import { expandPlatform }        from "./services/expansionEngine";
import { finalizeConfiguration } from "./services/systemConfigurator";
import { brainEngine }           from "./engine/BrainEnforcementEngine.js";
import { notifyFamily }          from "./utils/notifications.js";
import { startupAutoExecutor }   from "./BrainAutoExecutor.js";
import { startAboveTranscendEngine }    from "./services/aboveTranscend/engine.js";
import {
  initFamilyAgents,
  ensureStripeCustomers,
  ensureStripeConnectedAccounts,
  attachPrimaryBankAccount,
} from "./services/familyAgents.js";
import { initRealStripeIntegration }   from "./services/aboveTranscend/realStripeIntegration.js";
import { startAdaptiveEngine, globalTranscend } from "./services/realMarket.js";
import { startUltraTranscendPersonalEngine }   from "./services/ultraTranscendPersonalEngine.js";
import { zeroTouchSuperLaunch, resolveFamilyStripeId } from "./services/zeroTouchLaunch.js";
import { startHybridEngine }                           from "./services/hybridEngine.js";
import { startWealthMultiplier }                       from "./services/wealthMultiplier.js";
import { startPlatformAudit }                         from "./services/platformAudit.js";
import { startMetaTranscendentLaunch, triggerMetaCycle } from "./services/metaTranscend.js";
import { startWealthMaximizer, enforceMaxGrowth }       from "./services/wealthMaximizer.js";
import { startEnforcer }                              from "./services/platform100Enforcer.js";
import { startUltimateLaunch }                        from "./services/ultimateTranscend.js";
import { startPayoutCycle, pushRevenueToBankImmediately } from "./services/payoutService.js";
import { UltraInteractionEngine }                        from "./services/ultraInteractionEngine.js";
import { generateAllCreatives }                          from "./services/adCreativeEngine.js";

// Wire all DI services before the server binds. All factories are lazy —
// nothing is instantiated here, just registered.
bootstrapServices();

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);

  // Boot sequence — runs in the background, non-blocking:
  //   1. expandPlatform()         — populates registry, persists run to DB
  //   2. finalizeConfiguration()  — self-heal, verify, lock, persist to organizations table
  //   3. brainEngine.start()      — continuous 60-second self-audit loop
  //   4. notifyFamily()           — email + SMS to all family members (if BRAIN_NOTIFY_ON_START=true)
  //   5. startupAutoExecutor()    — infinite task execution sequence (if BRAIN_AUTO_START=true)
  void (async () => {
    await expandPlatform();
    await finalizeConfiguration();
    brainEngine.start();

    if (process.env.BRAIN_NOTIFY_ON_START === "true") {
      await notifyFamily();
    } else {
      console.log("[Brain:notify] Startup notifications skipped (set BRAIN_NOTIFY_ON_START=true to enable)");
    }

    await ensureStripeCustomers();
    await ensureStripeConnectedAccounts();
    await attachPrimaryBankAccount();
    initFamilyAgents();
    startAboveTranscendEngine();
    initRealStripeIntegration();
    startAdaptiveEngine({
      cycleInterval:         10_000,
      maxSpeed:              100,            // spec: full-throttle
      autoPublish:           true,
      marketplaces:          ["Shopify", "Etsy", "WooCommerce", "Amazon", "eBay", "CreativeMarket"],
      realProducts:          true,
      autoAllocate:          true,
      businessName:          "Lakeside Trinity Care and Wellness LLC",
      allDigital:            true,           // all digital formats per product
      dynamicPricing:        true,           // demand-adaptive pricing
      demandAdaptive:        true,           // speed adapts to demand signals
      generateVisualAssets:  true,           // auto-generate image URLs per product
      enforceMinimumPercent: 100,            // 100%+ growth enforced per cycle
    });
    zeroTouchSuperLaunch(resolveFamilyStripeId()).catch(err =>
      console.error("[ZeroTouchAI] Launch error:", (err as Error).message)
    );
    startHybridEngine();
    startWealthMultiplier();
    startPlatformAudit();
    startMetaTranscendentLaunch();
    startWealthMaximizer();
    startEnforcer();
    startUltimateLaunch();
    startPayoutCycle();   // ACH payout to Huntington every 60 s

    // Spec chain per micro-revenue event: instant payout → enforceMaxGrowth → triggerMetaCycle → globalTranscend
    UltraInteractionEngine.on("microRevenue", (event) => {
      void (async () => {
        await pushRevenueToBankImmediately(event.amount);
        await enforceMaxGrowth({ minPercent: 100 });
        triggerMetaCycle().catch(() => {});
        globalTranscend({ event: { userId: event.userId, eventAmount: event.amount } }).catch(() => {});
      })();
    });
    console.log("[PayoutService] ⚡ Instant payout listener active — microRevenue → Huntington instant → enforceMaxGrowth → triggerMetaCycle → globalTranscend");

    startUltraTranscendPersonalEngine(); // per-user hyper-personalization loop

    // Auto-generate GPT-4o ad creatives for all 15 campaigns on first boot (cached; skips if already generated)
    generateAllCreatives(false).then(r => {
      if (r.generated > 0) console.log(`[AdCreatives] ✅ Auto-generated ${r.generated} campaign creatives (${r.skipped} cached, ${r.errors.length} errors)`);
      else console.log(`[AdCreatives] ✓ All ${r.skipped} creatives already cached`);
    }).catch(err => console.error("[AdCreatives] Creative generation error:", (err as Error).message));

    // Log public market page URL (spec: launchFullFamilyMarket — Step 5)
    const domain = process.env.REPLIT_DEV_DOMAIN ?? "localhost";
    console.log(
      `[RealMarket] 🌐 Live market page: https://${domain}/createai-brain/real-market`
    );

    if (process.env.BRAIN_AUTO_START === "true") {
      console.log("[AutoExecutor] BRAIN_AUTO_START=true — launching auto-execution sequence…");
      startupAutoExecutor().catch(err => {
        console.error("[AutoExecutor] Fatal error during auto-execution:", err);
      });
    } else {
      console.log("[AutoExecutor] Auto-execution skipped (set BRAIN_AUTO_START=true to enable)");
    }
  })();
});
