/**
 * Reverie — Dynamic CLOB Market Maker
 *
 * Mints complete sets (1 tUSDC → 1 Up + 1 Down) and provides liquidity
 * by placing resting GTC limit sell orders on both sides of the book.
 *
 * Uses dynamic Up/Down pricing logic by fetching real-time Binance 
 * spot prices and comparing them against the candle's opening price.
 */

import { getExchange } from "../dreamdex/exchange.js";
import { TRADE_SIZE, MIN_EXPIRY_SECONDS, MM_SPREAD } from "../dreamdex/config.js";

async function fetchBinanceData(symbol, cadenceStr, windowStart) {
  try {
    const pair = symbol.toUpperCase() + "USDT";
    let interval = "5m";
    if (cadenceStr === "15m") interval = "15m";
    if (cadenceStr === "1h") interval = "1h";

    // 1. Fetch current price
    const tickerRes = await fetch(`https://data-api.binance.vision/api/v3/ticker/price?symbol=${pair}`);
    if (!tickerRes.ok) throw new Error("Ticker fetch failed");
    const ticker = await tickerRes.json();
    const currentPrice = parseFloat(ticker.price);

    // 2. Fetch candle for windowStart to get openPrice
    // Binance requires startTime in ms
    const startTimeMs = windowStart * 1000;
    const klineRes = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${pair}&interval=${interval}&startTime=${startTimeMs}&limit=1`);
    if (!klineRes.ok) throw new Error("Kline fetch failed");
    const klines = await klineRes.json();
    
    if (klines.length === 0) throw new Error("No kline found for windowStart");
    const openPrice = parseFloat(klines[0][1]);

    return { currentPrice, openPrice };
  } catch (err) {
    console.error(`     [Binance] Error fetching data for ${symbol}:`, err.message);
    return null;
  }
}

export async function runMarketMaker() {
  const exchange = await getExchange();

  console.log("🤖 Reverie Dynamic Market Maker starting...");
  console.log(`   Trade size: ${TRADE_SIZE} tUSDC`);
  console.log(`   Spread:     ${MM_SPREAD}\n`);

  try {
    const allMarkets = await exchange.client.listLiveBinaryMarkets({ limit: 50 });

    if (!allMarkets || allMarkets.length === 0) {
      console.log("📭 No live binary markets found.");
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    let marketsQuoted = 0;

    for (const m of allMarkets) {
      try {
        // Gate on on-chain status
        const onchain = await exchange.client.getMarketOnchain(m.marketId);
        if (onchain.status !== 1) continue; // 1 = Trading

        // Skip near-expiry
        const secondsLeft = Number(m.expiry) - now;
        if (secondsLeft < MIN_EXPIRY_SECONDS) continue;

        const [up, down] = m.outcomes ?? [];
        if (!up?.symbol || !down?.symbol) continue;

        // Parse asset and cadence (e.g. BTC, 5m)
        const assetMatch = m.asset?.match(/([A-Z]+)\//);
        const asset = assetMatch ? assetMatch[1] : (m.question?.includes("BTC") ? "BTC" : "ETH");
        
        let cadenceStr = "5m";
        const intervalSec = Number(m.intervalSec || 0);
        if (intervalSec === 900) cadenceStr = "15m";
        if (intervalSec === 3600) cadenceStr = "1h";

        const windowStart = Number(m.expiry) - intervalSec;

        console.log(`   📊 Evaluating ${asset}/USDT (${cadenceStr}) | ID: ${m.marketId.slice(0, 10)}...`);

        // Fetch Binance Data
        const binanceData = await fetchBinanceData(asset, cadenceStr, windowStart);
        if (!binanceData) {
          console.log(`     ⏭️  Skipping due to missing Binance data.`);
          continue;
        }

        const { currentPrice, openPrice } = binanceData;
        console.log(`     Open: $${openPrice.toFixed(2)} | Current: $${currentPrice.toFixed(2)}`);

        // Dynamic Pricing Logic
        let fairValueUp = 0.50;
        let fairValueDown = 0.50;

        if (currentPrice > openPrice) {
          fairValueUp = 0.80;
          fairValueDown = 0.20;
          console.log(`     📈 UP is favored.`);
        } else if (currentPrice < openPrice) {
          fairValueUp = 0.20;
          fairValueDown = 0.80;
          console.log(`     📉 DOWN is favored.`);
        } else {
          console.log(`     ⚖️  Price unchanged.`);
        }

        const upAsk = Math.min(0.99, fairValueUp + MM_SPREAD);
        const downAsk = Math.min(0.99, fairValueDown + MM_SPREAD);
        
        console.log(`     Quoting UP Sell   @ $${upAsk.toFixed(4)}`);
        console.log(`     Quoting DOWN Sell @ $${downAsk.toFixed(4)}`);

        // 1. Mint complete sets (Inventory)
        console.log(`     🔄 Minting ${TRADE_SIZE} complete sets...`);
        try {
          const mintResult = await exchange.mintSet(up.symbol, TRADE_SIZE);
          const receipt = mintResult?.info?.receipt || mintResult?.receipt;
          if (receipt?.status === "reverted") {
            console.log(`     ⚠️  Mint reverted. Skipping quoting.`);
            continue;
          }
        } catch (err) {
          if (String(err).includes("InsufficientBalance") || String(err).includes("ERC20InsufficientBalance")) {
             console.error("     💸 Insufficient tUSDC balance. Run faucet first.");
             return;
          }
          console.error(`     ❌ Mint error:`, err.message || err);
          continue;
        }

        // 2. Place resting limit sell orders (GTC)
        console.log(`     📝 Placing GTC asks on order book...`);
        
        await exchange.createOrder(up.symbol, "limit", "sell", TRADE_SIZE, upAsk, { timeInForce: "GTC" });
        await exchange.createOrder(down.symbol, "limit", "sell", TRADE_SIZE, downAsk, { timeInForce: "GTC" });

        console.log(`     ✅ Liquidity provided!\n`);
        marketsQuoted++;
        
      } catch (err) {
        console.error(`   ❌ MM error on ${m.marketId}:`, err.message || err);
      }
    }

    console.log(`\n📈 Reverie provided liquidity to ${marketsQuoted} market(s) this cycle.`);
  } catch (err) {
    console.error("❌ Market Maker task failed:", err.message || err);
  }
}
