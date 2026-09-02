/**
 * Reverie — DreamDEX Bot Configuration
 *
 * Loads environment variables and exports typed config for the Somnia testnet.
 * Collateral is tUSDC (6 decimals) on testnet, USDso (18 decimals) on mainnet.
 */

import "dotenv/config";

// ─── Network ────────────────────────────────────────────────────────────────
export const SOMNIA_RPC_URL = process.env.SOMNIA_RPC_URL || "https://dream-rpc.somnia.network";
export const SOMNIA_WS_URL = process.env.SOMNIA_WS_URL || "wss://dream-rpc.somnia.network";
export const SOMNIA_CHAIN_ID = Number(process.env.SOMNIA_CHAIN_ID || 50312);
export const INDEXER_URL = process.env.DREAMDEX_INDEXER_URL || "https://markets-indexer.dreamdex.io";

// ─── Wallet ─────────────────────────────────────────────────────────────────
export const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ─── Collateral ─────────────────────────────────────────────────────────────
// Testnet tUSDC: 6 decimals  |  Mainnet USDso: 18 decimals
// Never hardcode the scale — derive it from the token's decimals().
export const TUSDC_ADDRESS = "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E";
export const COLLATERAL_DECIMALS = 6; // testnet

// ─── Contract addresses (identical on testnet 50312 and mainnet 50311) ──────
export const CONTRACTS = {
  BinaryMarketsModule: "0x3ecC694Cef705358864a646142ac17A90E29e388",
  MarketsCore: "0x2802504314685D89bF6C992CA5a8e7cC78bc0294",
  BinarySettlement: "0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23",
  OutcomeToken6909: "0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9",
  OracleHub: "0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b",
  CollateralRouter: "0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C",
};

// ─── Bot parameters ─────────────────────────────────────────────────────────
export const TRADE_SIZE = Number(process.env.DREAMDEX_TRADE_SIZE || 1);
export const MIN_EXPIRY_SECONDS = Number(process.env.DREAMDEX_MIN_EXPIRY_SECONDS || 300);
export const SLIPPAGE = Number(process.env.DREAMDEX_SLIPPAGE || 0.02);

// ─── Feature flags ──────────────────────────────────────────────────────────
export const ENABLE_FAUCET = process.env.DREAMDEX_ENABLE_FAUCET !== "false";
export const ENABLE_TRADE = process.env.DREAMDEX_ENABLE_TRADE !== "false";
export const ENABLE_REDEEM = process.env.DREAMDEX_ENABLE_REDEEM !== "false";
