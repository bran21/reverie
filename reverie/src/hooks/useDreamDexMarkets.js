/**
 * Reverie — DreamDEX Markets Hook
 *
 * Provides simulated DreamDEX binary prediction market data derived
 * from the live Binance price feed.
 *
 * In production this would query the DreamDEX indexer or use the
 * @somnia-chain/markets-sdk React hooks. For the hackathon demo,
 * we derive realistic market states from actual price movement,
 * which is exactly what the event contracts track.
 *
 * The "Up" probability is modeled as: how likely is the price to
 * close above its opening value by the end of the window? We use
 * the current price trend (distance from the open) to calculate this.
 */

import { useState, useEffect, useRef, useCallback } from "react";

// Market window durations in seconds
const CADENCES = [
  { label: "5m", seconds: 300 },
  { label: "15m", seconds: 900 },
  { label: "1h", seconds: 3600 },
];

const ASSETS = ["BTC", "ETH"];

/**
 * Sigmoid function to convert a z-score into a (0, 1) probability.
 * Steepness controls how aggressively the probability swings.
 */
function sigmoid(z, steepness = 4) {
  return 1 / (1 + Math.exp(-steepness * z));
}

/**
 * Generate a realistic market ID.
 */
function makeMarketId(asset, cadence, windowIdx) {
  const hash = `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("")}`;
  return hash.slice(0, 66);
}

/**
 * Create a market object from an asset and cadence.
 */
function createMarket(asset, cadence, now) {
  const windowStart = Math.floor(now / cadence.seconds) * cadence.seconds;
  const windowEnd = windowStart + cadence.seconds;
  const elapsed = now - windowStart;
  const remaining = windowEnd - now;

  return {
    id: makeMarketId(asset, cadence.label, windowStart),
    asset,
    cadence: cadence.label,
    cadenceSeconds: cadence.seconds,
    question: `Will ${asset} close above its opening price?`,
    windowStart,
    windowEnd,
    elapsed,
    remaining,
    progress: elapsed / cadence.seconds,
    status: remaining > 30 ? "Trading" : remaining > 0 ? "Closing" : "Locked",
    openPrice: null,    // set from Binance data
    currentPrice: null, // set from Binance data
    upProb: 0.5,
    downProb: 0.5,
    bestBid: 0,
    bestAsk: 0,
    volume: 0,
    trades: 0,
  };
}

/**
 * @param {number|null} lastPrice - Current price from Binance
 * @param {Array} candles - Historical candles from Binance
 * @param {string} activeAsset - The active asset tab
 */
export function useDreamDexMarkets(lastPrice, candles, activeAsset = "BTC") {
  const [markets, setMarkets] = useState([]);
  const intervalRef = useRef(null);
  const openPrices = useRef({});

  const updateMarkets = useCallback(() => {
    if (!lastPrice || !candles || candles.length === 0) return;

    const now = Date.now() / 1000;

    const newMarkets = CADENCES.map((cadence) => {
      const market = createMarket(activeAsset, cadence, now);

      // Find the candle closest to the window start for the "opening price"
      const windowStartSec = market.windowStart;
      const key = `${activeAsset}-${cadence.label}-${windowStartSec}`;

      if (!openPrices.current[key]) {
        // Find the candle at or just after window start
        const openCandle = candles.find((c) => c.time >= windowStartSec);
        openPrices.current[key] = openCandle ? openCandle.open : lastPrice;
      }

      const openPrice = openPrices.current[key];
      market.openPrice = openPrice;
      market.currentPrice = lastPrice;

      // Calculate the z-score: how far has price moved relative to open?
      // Normalize by a reasonable volatility estimate (0.1% for short windows)
      const pctMove = (lastPrice - openPrice) / openPrice;
      const vol = cadence.seconds <= 300 ? 0.002 : cadence.seconds <= 900 ? 0.004 : 0.008;
      const zScore = pctMove / vol;

      // Convert to probability via sigmoid
      const upProb = Math.max(0.02, Math.min(0.98, sigmoid(zScore)));
      const downProb = 1 - upProb;

      market.upProb = Math.round(upProb * 1000) / 1000;
      market.downProb = Math.round(downProb * 1000) / 1000;

      // Simulate book prices (spread around the probability)
      const spread = 0.015;
      market.bestBid = Math.max(0.01, Math.round((upProb - spread / 2) * 1000) / 1000);
      market.bestAsk = Math.min(0.99, Math.round((upProb + spread / 2) * 1000) / 1000);

      // Simulate volume and trades based on time elapsed
      market.volume = Math.floor(market.progress * (500 + Math.random() * 2000));
      market.trades = Math.floor(market.progress * (10 + Math.random() * 50));

      return market;
    });

    setMarkets(newMarkets);
  }, [lastPrice, candles, activeAsset]);

  useEffect(() => {
    updateMarkets();
    intervalRef.current = setInterval(updateMarkets, 1000);
    return () => clearInterval(intervalRef.current);
  }, [updateMarkets]);

  return { markets };
}
