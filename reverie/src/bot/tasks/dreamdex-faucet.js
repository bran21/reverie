/**
 * Reverie — Faucet Task
 *
 * Claims testnet tUSDC from the on-chain faucet.
 * Each call mints up to 10,000 tUSDC to msg.sender.
 * Requesting more than the cap reverts with FaucetCapExceeded.
 *
 * Docs ref: contracts-and-addresses.md § Getting testnet collateral
 */

import { getExchange } from "../dreamdex/exchange.js";

export async function runFaucet() {
  const exchange = await getExchange();

  console.log("💧 Claiming testnet tUSDC from faucet...");

  try {
    // Default: 10,000 tUSDC (the per-call cap)
    const result = await exchange.trader.faucet();

    if (result?.receipt?.status === "reverted") {
      console.error("❌ Faucet transaction reverted on-chain.");
      return;
    }

    const txHash = result?.receipt?.transactionHash || result?.hash || "unknown";
    console.log(`✅ Faucet claimed successfully!`);
    console.log(`   Tx: ${txHash}`);
    console.log(`   Amount: 10,000 tUSDC (max per call)`);
    console.log(`   Explorer: https://shannon-explorer.somnia.network/tx/${txHash}`);
  } catch (err) {
    if (String(err).includes("FaucetCapExceeded")) {
      console.error("⚠️  Faucet cap exceeded — you may have already claimed recently.");
    } else {
      console.error("❌ Faucet failed:", err.message || err);
    }
  }
}
