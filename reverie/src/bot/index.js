#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                        R E V E R I E                        ║
 * ║        Automated DreamDEX Event Contracts Trading Bot       ║
 * ║                  Somnia Testnet (Chain 50312)                ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node src/index.js --task <task-name>
 *
 * Tasks:
 *   dreamdex-faucet   — Claim testnet tUSDC (up to 10,000 per call)
 *   dreamdex-markets  — List all live binary prediction markets
 *   dreamdex-trade    — Run IOC taker trading bot
 *   dreamdex-redeem   — Redeem winning positions from settled markets
 *   dreamdex-mint     — Mint complete sets (1 tUSDC → 1 Up + 1 Down)
 *   dreamdex          — Run full cycle: faucet → trade → redeem
 */

import { runFaucet } from "./tasks/dreamdex-faucet.js";
import { runMarkets } from "./tasks/dreamdex-markets.js";
import { runTrade } from "./tasks/dreamdex-trade.js";
import { runRedeem } from "./tasks/dreamdex-redeem.js";
import { runMint } from "./tasks/dreamdex-mint.js";
import { runCreateMarkets } from "./tasks/dreamdex-create-markets.js";
import { runMarketMaker } from "./tasks/dreamdex-market-maker.js";
import {
  ENABLE_FAUCET,
  ENABLE_TRADE,
  ENABLE_REDEEM,
} from "./dreamdex/config.js";

// ─── Parse CLI args ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const taskIdx = args.indexOf("--task");
const task = taskIdx !== -1 ? args[taskIdx + 1] : null;

const BANNER = `
╔══════════════════════════════════════════════════════════════╗
║                        R E V E R I E                        ║
║        Automated DreamDEX Event Contracts Trading Bot       ║
║                  Somnia Testnet · Chain 50312                ║
╚══════════════════════════════════════════════════════════════╝
`;

async function main() {
  console.log(BANNER);

  if (!task) {
    console.log("Usage: node src/index.js --task <task-name>\n");
    console.log("Available tasks:");
    console.log("  dreamdex-faucet   — Claim testnet tUSDC");
    console.log("  dreamdex-markets  — List live binary markets");
    console.log("  dreamdex-trade    — IOC taker trading bot");
    console.log("  dreamdex-redeem   — Redeem winning positions");
    console.log("  dreamdex-mint     — Mint complete sets");
    console.log("  dreamdex-market-maker — Dynamic CLOB Market Maker bot");
    console.log("  dreamdex-create-markets — Create custom prediction markets");
    console.log("  dreamdex          — Full cycle: faucet → trade → redeem");
    process.exit(0);
  }

  const startTime = Date.now();
  console.log(`⏱️  Task: ${task}`);
  console.log(`📅 Started: ${new Date().toISOString()}\n`);

  switch (task) {
    case "dreamdex-faucet":
      await runFaucet();
      break;

    case "dreamdex-markets":
      await runMarkets();
      break;

    case "dreamdex-trade":
      await runTrade();
      break;

    case "dreamdex-redeem":
      await runRedeem();
      break;

    case "dreamdex-mint":
      await runMint();
      break;

    case "dreamdex-market-maker":
      await runMarketMaker();
      break;

    case "dreamdex-create-markets":
      await runCreateMarkets();
      break;

    case "dreamdex":
      // Full cycle: faucet → markets → trade → redeem
      console.log("🔄 Running full Reverie cycle...\n");

      if (ENABLE_FAUCET) {
        console.log("═".repeat(60));
        console.log("  STEP 1/3 — FAUCET");
        console.log("═".repeat(60));
        await runFaucet();
        console.log("");
      }

      if (ENABLE_TRADE) {
        console.log("═".repeat(60));
        console.log("  STEP 2/3 — TRADE");
        console.log("═".repeat(60));
        await runTrade();
        console.log("");
      }

      if (ENABLE_REDEEM) {
        console.log("═".repeat(60));
        console.log("  STEP 3/3 — REDEEM");
        console.log("═".repeat(60));
        await runRedeem();
        console.log("");
      }
      break;

    default:
      console.error(`❌ Unknown task: "${task}"`);
      console.log("\nRun without --task to see available tasks.");
      process.exit(1);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✨ Reverie finished in ${elapsed}s.`);
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err.message || err);
  process.exit(1);
});
