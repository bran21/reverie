/**
 * Reverie — PriceChart Component
 *
 * Renders a real-time candlestick chart using TradingView's
 * lightweight-charts library, fed by the Binance WebSocket stream.
 */

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";

const INTERVALS = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1H", value: "1h" },
  { label: "4H", value: "4h" },
];

export default function PriceChart({
  candles,
  lastPrice,
  priceChange,
  symbol,
  interval,
  onIntervalChange,
  theme,
}) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  // Update chart layout when theme changes
  useEffect(() => {
    if (!chartRef.current) return;
    const isDark = theme === "dark";
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#0a0a0a" : "#f6f5f1" },
        textColor: isDark ? "#a3a3a3" : "#555555",
      },
      grid: {
        vertLines: { color: isDark ? "#262626" : "rgba(0,0,0,0.08)" },
        horzLines: { color: isDark ? "#262626" : "rgba(0,0,0,0.08)" },
      },
    });
  }, [theme]);

  // Create chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const isDark = theme === "dark";

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#0a0a0a" : "#f6f5f1" },
        textColor: isDark ? "#a3a3a3" : "#555555",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: isDark ? "#262626" : "rgba(0,0,0,0.08)" },
        horzLines: { color: isDark ? "#262626" : "rgba(0,0,0,0.08)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      crosshair: {
        mode: 0,
        vertLine: {
          color: "rgba(129, 140, 248, 0.3)",
          labelBackgroundColor: "#818cf8",
        },
        horzLine: {
          color: "rgba(129, 140, 248, 0.3)",
          labelBackgroundColor: "#818cf8",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    });

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    // Volume series (histogram overlay at bottom)
    const volumeSeries = chart.addHistogramSeries({
      color: "rgba(129, 140, 248, 0.15)",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Update data when candles change
  useEffect(() => {
    if (!seriesRef.current || !volumeSeriesRef.current) return;

    if (candles.length === 0) {
      seriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      return;
    }

    const candleData = candles.map((c) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = candles.map((c) => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
    }));

    seriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
    seriesRef.current.setMarkers([]);
  }, [candles]);

  const pair = symbol || "BTCUSDT";
  const displaySymbol = pair.replace("USDT", "/USDT");
  const changePositive = (priceChange || 0) >= 0;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px" }}>
        
        {/* Chart Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div>
              <span style={{ fontSize: "1.2rem", fontWeight: 700 }}>{displaySymbol}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "8px" }}>DreamDEX</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {lastPrice && (
              <>
                <span style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: changePositive ? "var(--color-up)" : "var(--color-down)" }}>
                  ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: "0.85rem", color: changePositive ? "var(--color-up)" : "var(--color-down)" }}>
                  {changePositive ? "+" : ""}{(priceChange || 0).toFixed(2)}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Lightweight Charts Container */}
        <div ref={chartContainerRef} style={{ flex: 1, width: "100%" }} />
      </div>
    </div>
  );
}
