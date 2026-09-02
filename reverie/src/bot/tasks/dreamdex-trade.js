/**
 * Reverie — IOC Taker Trading Task
 *
 * Discovers live binary markets, reads the order book, and places
 * IOC (Immediate-or-Cancel) taker orders to buy Up positions.
 *
 * Key design decisions from the docs:
 * - IOC so unfilled remainder never rests silently (Gotcha #4)
 * - Gate on on-chain status, not indexer (Gotcha #1)
 * - Skip markets near expiry (Gotcha #9)
 * - Check receipt via order.info (Gotcha #2)
 * - SDK >= 0.28.0 snaps prices to tick grid (Gotcha #3)
 *
 * Docs ref: recipes.md § Take liquidity
 */

import { getExchange } from "../dreamdex/exchange.js";
import { TRADE_SIZE, SLIPPAGE, MIN_EXPIRY_SECONDS } from "../dreamdex/config.js";

export async function runTrade() {
  const exchange = await getExchange();

  console.log("🤖 Reverie IOC Taker Bot starting...");
  console.log(`   Trade size: ${TRADE_SIZE} tUSDC`);
  console.log(`   Slippage:   ${SLIPPAGE}\n`);

  try {
    const allMarkets = await exchange.client.listLiveBinaryMarkets({ limit: 50 });

    if (!allMarkets || allMarkets.length === 0) {
      console.log("📭 No live binary markets found.");
      return;
    }

    const now = Date.now() / 1000;
    let tradesPlaced = 0;

    for (const m of allMarkets) {
      try {
        // Gotcha #1: Gate on on-chain status
        const onchain = await exchange.client.getMarketOnchain(m.marketId);
        if (onchain.status !== 1) continue;

        // Gotcha #9: Skip near-expiry markets
        const secondsLeft = Number(m.expiry) - now;
        if (secondsLeft < MIN_EXPIRY_SECONDS) continue;

        const [up] = m.outcomes ?? [];
        if (!up?.symbol) continue;

        const upSymbol = up.symbol;

        // Read the order book (5 levels)
        const book = await exchange.fetchOrderBook(upSymbol, 5);
        const bestAsk = book.asks[0]?.[0];

        if (bestAsk === undefined) {
          console.log(`   ⏭️  ${m.asset || m.marketId}: no resting asks, skipping.`);
          continue;
        }

        console.log(`   📊 ${m.asset} | Best Ask: ${bestAsk.toFixed(4)} | Symbol: ${upSymbol}`);

        // Cross the touch with IOC — add slippage so partial fills still execute
        // SDK >= 0.28.0 auto-snaps to tick grid (Gotcha #3)
        const order = await exchange.createOrder(
          upSymbol,
          "limit",
          "buy",
          TRADE_SIZE,
          bestAsk + SLIPPAGE,
          { timeInForce: "IOC" }
        );

        // Gotcha #2: receipt lives on order.info, not order.receipt
        const info = order.info;
        const receipt = info?.receipt;

        if (receipt?.status === "reverted") {
          console.log(`   ⚠️  Order reverted on-chain for ${m.asset}.`);
          continue;
        }

        const txHash = receipt?.transactionHash || "unknown";
        const filled = order.filled || 0;
        const amount = order.amount || TRADE_SIZE;

        console.log(`   ✅ FILLED ${filled} of ${amount} | Tx: ${txHash}`);
        tradesPlaced++;
      } catch (err) {
        // ERC20InsufficientBalance = out of collateral (Gotcha #7)
        if (String(err).includes("InsufficientBalance") || String(err).includes("ERC20InsufficientBalance")) {
          console.error("   💸 Insufficient balance — run faucet first.");
          break;
        }
        console.error(`   ❌ Trade error on ${m.marketId}:`, err.message || err);
      }
    }

    console.log(`\n📈 Reverie placed ${tradesPlaced} trade(s) this cycle.`);
  } catch (err) {
    console.error("❌ Trade task failed:", err.message || err);
  }
}
