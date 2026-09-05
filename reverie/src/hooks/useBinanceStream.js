/**
 * Reverie — Binance WebSocket Hook
 *
 * Connects to Binance's public WebSocket for real-time kline (candlestick)
 * data. Also fetches historical candles via REST for the initial chart fill.
 *
 * No API key required. No rate limits on the WebSocket stream.
 *
 * Streams:
 *   wss://stream.binance.com:9443/ws/<symbol>@kline_<interval>
 *
 * REST (historical):
 *   https://api.binance.com/api/v3/klines?symbol=<SYMBOL>&interval=<interval>&limit=300
 */

import { useState, useEffect, useRef, useCallback } from "react";

const WS_BASE = "wss://stream.binance.com:9443/ws";
const REST_BASE = "https://data-api.binance.vision/api/v3/klines";

/**
 * Transform Binance REST kline array into lightweight-charts format.
 * [openTime, open, high, low, close, volume, closeTime, ...]
 */
function restKlineToCandle(k) {
  return {
    time: Math.floor(k[0] / 1000), // seconds
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  };
}

/**
 * Transform Binance WebSocket kline event into lightweight-charts format.
 */
function wsKlineToCandle(k) {
  return {
    time: Math.floor(k.t / 1000),
    open: parseFloat(k.o),
    high: parseFloat(k.h),
    low: parseFloat(k.l),
    close: parseFloat(k.c),
    volume: parseFloat(k.v),
  };
}

/**
 * @param {string} symbol - e.g. "BTCUSDT"
 * @param {string} interval - e.g. "1m", "5m", "15m", "1h"
 */
export function useBinanceStream(symbol = "BTCUSDT", interval = "1m") {
  const [candles, setCandles] = useState([]);
  const [lastPrice, setLastPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  // Fetch historical candles on mount / symbol change
  const fetchHistory = useCallback(async () => {
    // Clear old candles immediately when symbol/interval changes
    setCandles([]);
    setLastPrice(null);
    try {
      const url = `${REST_BASE}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=300`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const history = data.map(restKlineToCandle);
      setCandles(history);

      if (history.length >= 2) {
        const first = history[0].close;
        const last = history[history.length - 1].close;
        setLastPrice(last);
        setPriceChange(((last - first) / first) * 100);
      }
    } catch (err) {
      console.warn("[Binance] Failed to fetch history:", err.message);
    }
  }, [symbol, interval]);

  // WebSocket connection
  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const pair = symbol.toLowerCase();
    const ws = new WebSocket(`${WS_BASE}/${pair}@kline_${interval}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      if (wsRef.current !== ws) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.e !== "kline") return;

        const candle = wsKlineToCandle(msg.k);
        setLastPrice(candle.close);

        setCandles((prev) => {
          if (prev.length === 0) return [candle];

          const updated = [...prev];
          const lastIdx = updated.length - 1;

          // Update existing candle or add new one
          if (updated[lastIdx].time === candle.time) {
            updated[lastIdx] = candle;
          } else {
            updated.push(candle);
          }

          // Calculate price change from first candle
          const first = updated[0].close;
          setPriceChange(((candle.close - first) / first) * 100);

          return updated;
        });
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      if (wsRef.current !== ws) return;
      setIsConnected(false);
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      if (wsRef.current !== ws) return;
      ws.close();
    };
  }, [symbol, interval]);

  useEffect(() => {
    fetchHistory();
    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [fetchHistory, connect]);

  return { candles, lastPrice, priceChange, isConnected };
}
