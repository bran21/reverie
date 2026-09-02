/**
 * Reverie — Markets Discovery Task
 *
 * Lists all live binary prediction markets on DreamDEX.
 * Gates on on-chain status (1 = Trading) and filters out markets
 * with less than MIN_EXPIRY_SECONDS remaining.
 *
 * Docs ref: recipes.md § Find a market worth trading
 * Gotcha #1: Always gate on on-chain status, not the indexer.
 * Gotcha #9: Skip markets with only a few minutes left.
 */

import { getExchange } from "../dreamdex/exchange.js";
import { MIN_EXPIRY_SECONDS } from "../dreamdex/config.js";

export async function runMarkets() {
  const exchange = await getExchange();

  console.log("🔍 Discovering live binary prediction markets...\n");

  try {
    const allMarkets = await exchange.client.listLiveBinaryMarkets({ limit: 50 });

    if (!allMarkets || allMarkets.length === 0) {
      console.log("📭 No live binary markets found.");
      return [];
    }

    console.log(`   Found ${allMarkets.length} live market(s). Validating on-chain...\n`);

    const now = Date.now() / 1000;
    const tradable = [];

    for (const m of allMarkets) {
      try {
        // Gate on on-chain status (Gotcha #1)
        const onchain = await exchange.client.getMarketOnchain(m.marketId);
        if (onchain.status !== 1) continue; // 1 = Trading

        const secondsLeft = Number(m.expiry) - now;
        if (secondsLeft < MIN_EXPIRY_SECONDS) continue; // Gotcha #9

        tradable.push({ market: m, onchain, secondsLeft });
      } catch {
        // Skip markets we can't validate
        continue;
      }
    }

    if (tradable.length === 0) {
      console.log("📭 No tradable markets (all expired, locked, or too close to expiry).");
      return [];
    }

    console.log(`✅ ${tradable.length} tradable market(s):\n`);
    console.log("─".repeat(80));

    for (const { market, secondsLeft } of tradable) {
      const [up, down] = market.outcomes ?? [];
      const minsLeft = Math.floor(secondsLeft / 60);

      console.log(`  📊 ${market.asset || "Unknown"} | ${market.question || market.marketId}`);
      console.log(`     Market ID:  ${market.marketId}`);
      console.log(`     Up Symbol:  ${up?.symbol || "N/A"}`);
      console.log(`     Down Symbol: ${down?.symbol || "N/A"}`);
      console.log(`     Cadence:    ${Number(market.intervalSec || 0) / 60}m`);
      console.log(`     Expires in: ${minsLeft} min`);
      console.log(`     Trades:     ${market.tradeCount || 0}`);
      console.log(`     Volume:     ${market.cumulativeQuoteVolume ? (Number(market.cumulativeQuoteVolume) / 1e6).toFixed(2) : "0"} tUSDC`);
      console.log("─".repeat(80));
    }

    return tradable;
  } catch (err) {
    console.error("❌ Failed to list markets:", err.message || err);
    return [];
  }
}
