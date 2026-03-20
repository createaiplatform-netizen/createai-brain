/**
 * ultraTranscendPersonalEngine.ts
 * Spec: ULTRA-TRANSCENDENT-PERSONAL-ENGINE
 *
 * Runs a 60-second loop that:
 *  1. Fetches all active users (Sara + family, expandable to global)
 *  2. For each user, detects 100 trending niches × 13 digital formats
 *  3. Generates personalized, visually-enriched products
 *  4. Publishes them to all 6 marketplaces
 *  5. Hyper-targets ads per user
 *  6. Fires a micro-revenue event → triggers instant payout chain
 *
 * All cycles are non-blocking; errors are caught per-user so one failure
 * never halts the loop.
 */

import { UltraInteractionEngine }        from "./ultraInteractionEngine.js";
import { detectTrendingCategories }      from "./trendDetector.js";
import { publishToMarketplaces }         from "./realMarket.js";
import { globalTranscend }              from "./realMarket.js";
import { getMetaProjections }            from "./metaTranscend.js";
import { getMaximizerStats }             from "./wealthMaximizer.js";
import { personalizeContentForUser,
         hyperTargetAds }               from "./personalizationEngine.js";

const CYCLE_INTERVAL_MS = 60_000;

const PERSONAL_FORMATS = [
  "ebook", "audiobook", "video", "pdf", "slides", "templates",
  "software", "graphic", "music", "ai-script", "course",
  "AR-filter", "VR-experience",
];

let _cycleCount = 0;
let _started    = false;

export function startUltraTranscendPersonalEngine(): void {
  if (_started) return;
  _started = true;

  console.log(
    "[UltraTranscendPersonal] 🚀 Starting — 60s cycle · 100 niches · " +
    `${PERSONAL_FORMATS.length} formats per user · global-universe scope`
  );

  setInterval(() => {
    void (async () => {
      _cycleCount++;
      const cycleLabel = `#${_cycleCount}`;

      try {
        const activeUsers = await UltraInteractionEngine.fetchAllUsers({
          minPercent: 100,
          geoScope:   "global-universe",
        });

        for (const user of activeUsers) {
          try {
            const topCategories = detectTrendingCategories({ topN: 100 });

            const personalizedContent: Record<string, unknown>[] = topCategories.flatMap(category =>
              PERSONAL_FORMATS.map(format => {
                const product: Record<string, unknown> = {
                  category,
                  format,
                  title:            `${category} ${format} for ${user.id}`,
                  customizedContent: personalizeContentForUser(user, { category, format, title: `${category} ${format}` }),
                  price:            Math.max(9.99, Math.random() * 49.99),
                  assets:           [`https://assets.createai.io/${category}/${format}/hero.jpg`],
                };
                return product;
              })
            );

            await publishToMarketplaces(
              personalizedContent.slice(0, 55) as Parameters<typeof publishToMarketplaces>[0]
            );
            await hyperTargetAds(user, personalizedContent);

            const totalRevenue = personalizedContent.reduce(
              (sum, p) => sum + (typeof p.price === "number" ? p.price : 0), 0
            );

            UltraInteractionEngine.fireMicroRevenue({
              amount: totalRevenue,
              type:   "ultraTranscendPersonal",
              userId: user.id,
              ts:     new Date().toISOString(),
            });

          } catch (userErr) {
            console.error(
              `[UltraTranscendPersonal] ⚠️ Cycle ${cycleLabel} error for user ${user.id}:`,
              (userErr as Error).message
            );
          }
        }

        // Dashboard log (spec: console.table equivalent)
        const [projections, maximizer] = await Promise.allSettled([
          getMetaProjections(),
          getMaximizerStats(),
        ]);

        console.log(
          `[UltraTranscendPersonal] ✅ Cycle ${cycleLabel} complete — ` +
          `${activeUsers.length} users · ${PERSONAL_FORMATS.length} formats · 100 niches`
        );
        console.table({
          users:          activeUsers.length,
          niches:         100,
          formats:        PERSONAL_FORMATS.length,
          metaProjections: projections.status === "fulfilled" ? projections.value : "—",
          wealthMaximizer: maximizer.status  === "fulfilled" ? maximizer.value  : "—",
        });

        await globalTranscend({ batchSize: activeUsers.length * PERSONAL_FORMATS.length });

      } catch (err) {
        console.error(
          `[UltraTranscendPersonal] ❌ Cycle ${cycleLabel} fatal:`,
          (err as Error).message
        );
      }
    })();
  }, CYCLE_INTERVAL_MS);
}
