/**
 * Reverie — Redeem Winning Positions Task
 *
 * Scans recently finalized (settled) markets for winning positions
 * and redeems them for collateral.
 *
 * Key design decisions from the docs:
 * - loadMarkets() skips finalized binaries entirely (Gotcha #10)
 * - Must use listBinaryMarkets({ status: "Finalized" }) instead
 * - Voided markets: redeem both sides at 0.5 each
 * - Resolved markets: only the winning side pays 1:1
 * - Redeeming a losing side succeeds but pays 0 (Gotcha #11)
 * - Settlement fee is 0 on DreamDEX
 *
 * Docs ref: recipes.md § Redeem after settlement
 */

import { getExchange } from "../dreamdex/exchange.js";

export async function runRedeem() {
  const exchange = await getExchange();

  console.log("💰 Scanning for redeemable positions in settled markets...\n");

  try {
    const me = exchange.walletAddress;
    if (!me) {
      console.error("❌ No wallet address found on the SDK instance.");
      return;
    }

    // Gotcha #10: loadMarkets() hides finalized binaries — use the binary tier
    const settled = await exchange.client.listBinaryMarkets({
      status: "Finalized",
      limit: 120,
    });

    if (!settled || settled.length === 0) {
      console.log("📭 No finalized markets found.");
      return;
    }

    // Sort newest-expired first and take the 40 most recent
    const recentSettled = settled
      .sort((a, b) => Number(b.expiry ?? 0) - Number(a.expiry ?? 0))
      .slice(0, 40);

    console.log(`   Found ${settled.length} finalized market(s), checking ${recentSettled.length} most recent...\n`);

    let redeemed = 0;

    for (const m of recentSettled) {
      try {
        const oc = await exchange.client.getMarketOnchain(m.marketId);

        // Only process resolved or voided markets
        if (!oc.isResolved && !oc.isVoided) continue;

        // Check holdings for both Up (0) and Down (1) outcomes
        const heldUp = await exchange.client.getOutcomeBalance(oc.outcomeToken, me, oc.yesId);
        const heldDown = await exchange.client.getOutcomeBalance(oc.outcomeToken, me, oc.noId);

        if (heldUp === 0n && heldDown === 0n) continue; // Nothing to claim

        // Determine which outcomes to redeem
        // Voided: both sides at 0.5  |  Resolved: only the winning side
        const toClaim = oc.isVoided
          ? [0, 1] // Both sides
          : [oc.winningOutcome === 0 ? 0 : 1]; // Winning side only

        for (const outcome of toClaim) {
          const amount = outcome === 0 ? heldUp : heldDown;
          if (amount === 0n) continue;

          const outcomeName = outcome === 0 ? "Up" : "Down";
          console.log(`   🎯 Redeeming ${outcomeName} on ${m.asset || m.marketId} (${amount} tokens)...`);

          const res = await exchange.trader.redeem({
            marketId: m.marketId,
            market: oc.marketAddress,
            outcomeToken: oc.outcomeToken,
            outcomeIdx: outcome,
            amount: amount,
          });

          if (res.receipt?.status === "reverted") {
            console.log(`   ⚠️  Redeem reverted for ${outcomeName} on ${m.marketId}`);
            continue;
          }

          const txHash = res.receipt?.transactionHash || "unknown";
          console.log(`   ✅ Redeemed ${outcomeName}! Tx: ${txHash}`);
          redeemed++;
        }
      } catch (err) {
        console.error(`   ❌ Error redeeming ${m.marketId}:`, err.message || err);
      }
    }

    console.log(`\n💵 Reverie redeemed ${redeemed} position(s).`);
  } catch (err) {
    console.error("❌ Redeem task failed:", err.message || err);
  }
}
