/**
 * Reverie — Mint Complete Sets Task
 *
 * Mints complete sets: 1 tUSDC → 1 Up + 1 Down outcome tokens.
 * This gives sell-side inventory so you can place sell orders.
 *
 * You don't need this to quote both sides — two opposite-side buyers
 * cross via mint-a-pair with no seller needed. But explicit minting
 * is useful for market-making strategies where you want to sell
 * individual outcomes.
 *
 * Docs ref: recipes.md § Get inventory so you can sell
 *           market-structure.md § Escrow and complete sets
 */

import { getExchange } from "../dreamdex/exchange.js";
import { TRADE_SIZE, MIN_EXPIRY_SECONDS } from "../dreamdex/config.js";

export async function runMint() {
  const exchange = await getExchange();

  console.log(`🏭 Minting complete sets (${TRADE_SIZE} tUSDC each)...\n`);

  try {
    const allMarkets = await exchange.client.listLiveBinaryMarkets({ limit: 50 });

    if (!allMarkets || allMarkets.length === 0) {
      console.log("📭 No live binary markets found.");
      return;
    }

    const now = Date.now() / 1000;
    let minted = 0;

    for (const m of allMarkets) {
      try {
        // Gate on on-chain status
        const onchain = await exchange.client.getMarketOnchain(m.marketId);
        if (onchain.status !== 1) continue; // 1 = Trading

        // Skip near-expiry
        const secondsLeft = Number(m.expiry) - now;
        if (secondsLeft < MIN_EXPIRY_SECONDS) continue;

        const [up] = m.outcomes ?? [];
        if (!up?.symbol) continue;

        console.log(`   🔄 Minting ${TRADE_SIZE} set(s) on ${m.asset || m.marketId}...`);

        // mintSet: collateral → 1 Up + 1 Down per unit
        const result = await exchange.mintSet(up.symbol, TRADE_SIZE);

        const receipt = result?.info?.receipt || result?.receipt;
        if (receipt?.status === "reverted") {
          console.log(`   ⚠️  Mint reverted for ${m.asset || m.marketId}`);
          continue;
        }

        const txHash = receipt?.transactionHash || "unknown";
        console.log(`   ✅ Minted! ${TRADE_SIZE} Up + ${TRADE_SIZE} Down | Tx: ${txHash}`);
        minted++;

        // Mint on the first valid market only (remove this to mint on all)
        break;
      } catch (err) {
        if (String(err).includes("InsufficientBalance") || String(err).includes("ERC20InsufficientBalance")) {
          console.error("   💸 Insufficient collateral — run faucet first.");
          break;
        }
        console.error(`   ❌ Mint error on ${m.marketId}:`, err.message || err);
      }
    }

    console.log(`\n🏭 Reverie minted ${minted} complete set(s).`);
  } catch (err) {
    console.error("❌ Mint task failed:", err.message || err);
  }
}
