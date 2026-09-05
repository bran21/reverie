/**
 * Reverie — DreamDEX Markets Hook (v2)
 *
 * Fetches live binary prediction markets from the Somnia Indexer.
 * Supports BTC/USD and ETH/USD across 5m, 15m, and 1h cadences.
 *
 * Falls back to deterministic clock-aligned synthetic markets when
 * the indexer is unavailable or returns no matching markets.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { SomniaMarkets } from "@somnia-chain/markets-sdk";

const INDEXER_URL = "https://dev.smk.somnia.host/v1/graphql";

// Cadence config
const CADENCES = [
  { label: "1m",  seconds: 60   },
  { label: "5m",  seconds: 300  },
  { label: "15m", seconds: 900  },
  { label: "1h",  seconds: 3600 },
];

const ASSETS = ["BTC", "ETH", "SOL"];

/**
 * Build a deterministic synthetic market for a given asset + cadence.
 * Window aligns to the current clock interval (same as exchange does).
 */
function buildSyntheticMarket({ asset, cadence, seconds, lastPrice, candles, openPricesRef, now, testnetId }) {
  const windowStart = Math.floor(now / seconds) * seconds;
  const windowEnd   = windowStart + seconds;
  const secondsLeft = Math.max(0, windowEnd - now);

  const key = `${asset}-${cadence}-${windowStart}`;
  if (!openPricesRef.current[key]) {
    const openCandle = candles?.find((c) => c.time >= windowStart);
    openPricesRef.current[key] = openCandle?.open ?? lastPrice ?? 0;
  }

  // Create a valid bytes32 (66 chars) string for viem compatibility
  let hexId = '';
  for (let i = 0; i < key.length; i++) {
    hexId += key.charCodeAt(i).toString(16);
  }
  const bytes32Id = '0x' + hexId.padEnd(64, '0').slice(0, 64);

  return {
    id:           testnetId || bytes32Id,
    realMarketId: testnetId || null,
    asset,
    cadence,
    question:     `Will ${asset}/USD close above its opening price in ${cadence}?`,
    windowStart,
    windowEnd,
    remaining:    secondsLeft,
    status:       secondsLeft > 30 ? "Trading" : "Locked",
    openPrice:    openPricesRef.current[key],
    currentPrice: lastPrice ?? 0,
    upProb:       0.5,
    downProb:     0.5,
    bestBid:      0.48,
    bestAsk:      0.52,
    volume:       Math.floor(Math.random() * 50000) + 10000,
    trades:       Math.floor(Math.random() * 500) + 50,
    isSynthetic:  !testnetId, // If we inject a real ID, treat it as a real market
  };
}

/**
 * Map an intervalSec value to a cadence label string.
 */
function secondsToCadence(sec) {
  if (sec === 60)   return "1m";
  if (sec === 300)  return "5m";
  if (sec === 900)  return "15m";
  if (sec === 3600) return "1h";
  return null;
}

export function useDreamDexMarkets(lastPrice, candles, activeAsset = "BTC") {
  const [markets, setMarkets] = useState([]);
  const openPrices = useRef({});

  const buildMarkets = useCallback(async () => {
    const now = Date.now() / 1000;

    // ── 1. Try the indexer ────────────────────────────────────────────────────
    let indexerItems = [];
    try {
      const exchange = new SomniaMarkets({ indexerUrl: INDEXER_URL });
      indexerItems = await exchange.client.listLiveBinaryMarkets();
    } catch (err) {
      console.error("Indexer fetch failed:", err);
      // Silently fall back to synthetic markets if indexer is unreachable
    }

    // ── 2. Match indexer items to our 6 desired slots ────────────────────────
    // Key: `${asset}-${cadence}` → best (most-recent non-expired) indexer market
    const slotMap = {};

    for (const m of indexerItems) {
      const cadence = secondsToCadence(Number(m.intervalSec));
      if (!cadence) continue;

      // Detect asset — prefer explicit `asset` field, fallback to question text
      let asset = null;
      if (m.asset) {
        if (String(m.asset).toUpperCase().includes("BTC")) asset = "BTC";
        else if (String(m.asset).toUpperCase().includes("ETH")) asset = "ETH";
        else if (String(m.asset).toUpperCase().includes("SOL")) asset = "SOL";
      }
      if (!asset && m.question) {
        if (m.question.toUpperCase().includes("BTC")) asset = "BTC";
        else if (m.question.toUpperCase().includes("ETH")) asset = "ETH";
        else if (m.question.toUpperCase().includes("SOL")) asset = "SOL";
      }
      if (!asset) continue;
      if (!ASSETS.includes(asset)) continue;

      const secondsLeft = Number(m.expiry) - now;
      if (secondsLeft <= 0) continue; // skip expired

      const slotKey = `${asset}-${cadence}`;
      // Keep the one with the most time left (closest current window)
      if (!slotMap[slotKey] || secondsLeft > slotMap[slotKey]._secondsLeft) {
        slotMap[slotKey] = { ...m, _secondsLeft: secondsLeft, asset, cadence };
      }
    }

    // ── 3. Build the final 6 markets ─────────────────────────────────────────
    const result = [];

    for (const asset of ASSETS) {
      for (const { label: cadence, seconds } of CADENCES) {
        const slotKey = `${asset}-${cadence}`;
        const indexerItem = slotMap[slotKey];

        if (indexerItem) {
          // Real on-chain market from indexer
          const secondsLeft = indexerItem._secondsLeft;
          const windowStart = Number(indexerItem.expiry) - seconds;
          const key = `${asset}-${cadence}-${windowStart}`;

          if (!openPrices.current[key]) {
            const openCandle = candles?.find((c) => c.time >= windowStart);
            openPrices.current[key] = openCandle?.open ?? lastPrice ?? 0;
          }

          result.push({
            id:           indexerItem.marketId, // real bytes32
            realMarketId: indexerItem.marketId,
            pool:         indexerItem.pool,
            asset,
            cadence,
            question:     indexerItem.question || `Will ${asset}/USD close above its opening price in ${cadence}?`,
            windowStart,
            windowEnd:    Number(indexerItem.expiry),
            remaining:    Math.max(0, secondsLeft),
            status:       secondsLeft > 30 ? "Trading" : "Locked",
            openPrice:    openPrices.current[key],
            currentPrice: asset === activeAsset ? (lastPrice ?? 0) : (openPrices.current[key] ?? 0),
            upProb:       0.5,
            downProb:     0.5,
            bestBid:      0.48,
            bestAsk:      0.52,
            volume:       Number(indexerItem.cumulativeQuoteVolume ?? 0) / 1e6,
            trades:       indexerItem.tradeCount || 0,
            isSynthetic:  false,
          });
        } else {
          // Synthetic fallback
          // If this is the 15m BTC market, inject a real testnet ID we found on-chain
          let injectedId = undefined;

          result.push(
            buildSyntheticMarket({
              asset,
              cadence,
              seconds,
              lastPrice: asset === activeAsset ? lastPrice : null,
              candles:   asset === activeAsset ? candles : null,
              openPricesRef: openPrices,
              now,
              testnetId: injectedId,
            })
          );
        }
      }
    }

    setMarkets(result);
  }, [lastPrice, candles, activeAsset]);

  useEffect(() => {
    buildMarkets();
    const interval = setInterval(buildMarkets, 5000);
    return () => clearInterval(interval);
  }, [buildMarkets]);

  return { markets };
}
