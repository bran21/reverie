/**
 * Reverie — SDK Singleton Factory
 *
 * Initializes and caches a single SomniaMarkets instance.
 * Call `await getExchange()` from any task to get a ready-to-use SDK handle.
 *
 * Gotcha (docs #1): Always gate writes on the on-chain market status,
 * not the indexer — the indexer lags by seconds.
 */

import { SomniaMarkets } from "@somnia-chain/markets-sdk";
import {
  SOMNIA_RPC_URL,
  SOMNIA_WS_URL,
  INDEXER_URL,
  PRIVATE_KEY,
} from "./config.js";

let _exchange = null;

/**
 * Returns an initialized SomniaMarkets SDK instance.
 * Markets are loaded on first call; subsequent calls return the cached instance.
 */
export async function getExchange() {
  if (_exchange) return _exchange;

  if (!PRIVATE_KEY) {
    throw new Error(
      "❌ PRIVATE_KEY not set. Copy .env.example → .env and fill in your key."
    );
  }

  console.log("🔧 Initializing Reverie SDK...");
  console.log(`   RPC:     ${SOMNIA_RPC_URL}`);
  console.log(`   Indexer: ${INDEXER_URL}`);

  _exchange = new SomniaMarkets({
    rpcUrl: SOMNIA_RPC_URL,
    wsRpcUrl: SOMNIA_WS_URL,
    privateKey: PRIVATE_KEY,
    indexerUrl: INDEXER_URL,
    addresses: {
      binaryModule: "0x3ecC694Cef705358864a646142ac17A90E29e388"
    }
  });

  await _exchange.loadMarkets();
  console.log("✅ SDK ready — markets loaded.\n");

  return _exchange;
}
