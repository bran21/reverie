import { useState } from "react";
import { Link } from "react-router-dom";
import ConnectButton from "../components/ConnectButton.jsx";
import PriceChart from "../components/PriceChart.jsx";
import TradeMenu from "../components/TradeMenu.jsx";
import PositionsPanel from "../components/PositionsPanel.jsx";
import NewsTicker from "../components/NewsTicker.jsx";
import { useBinanceStream } from "../hooks/useBinanceStream.js";
import { useDreamDexMarkets } from "../hooks/useDreamDexMarkets.js";
import { useTheme } from "../hooks/useTheme.js";

const ASSET_TO_BINANCE = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
};

export default function Trade() {
  const { theme, toggleTheme } = useTheme();
  const [activeAsset, setActiveAsset] = useState("BTC");
  const [interval, setInterval] = useState("5m");

  const binanceSymbol = ASSET_TO_BINANCE[activeAsset] || "BTCUSDT";

  const { candles, lastPrice, priceChange, isConnected } = useBinanceStream(
    binanceSymbol,
    interval
  );

  const { markets } = useDreamDexMarkets(lastPrice, candles, activeAsset);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page)", color: "var(--text-primary)" }}>
      
      {/* Top Navbar */}
      <header style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "center", 
        padding: "var(--space-sm) var(--space-md)", borderBottom: "1px solid var(--border-light)",
        background: "var(--bg-page)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xl)" }}>
          <Link to="/" style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 700, color: "var(--color-accent)", textDecoration: "none" }}>
            REVERIE_TRADE
          </Link>
          
          <div style={{ display: "flex", gap: "var(--space-lg)", fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--color-accent)", cursor: "pointer" }}>Trade</span>
            <span style={{ cursor: "pointer" }}>Dashboard</span>
            <span style={{ cursor: "pointer" }}>Portfolio</span>
            <span style={{ cursor: "pointer" }}>History</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <button onClick={toggleTheme} style={{ background: "transparent", border: "1px solid var(--border-light)", color: "var(--text-primary)", cursor: "pointer", padding: "4px 8px", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <ConnectButton className="btn-connect--sm" />
        </div>
      </header>

      {/* Ticker Tape Bar */}
      <div style={{ display: "flex", padding: "8px var(--space-md)", borderBottom: "1px solid var(--border-light)", background: "var(--bg-page)", gap: "var(--space-xl)", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select 
            value={activeAsset} 
            onChange={(e) => setActiveAsset(e.target.value)}
            style={{ background: "transparent", border: "none", color: "var(--text-primary)", fontSize: "1.1rem", fontWeight: 700, outline: "none", cursor: "pointer" }}
          >
            <option value="BTC">BTC/USDT</option>
            <option value="ETH">ETH/USDT</option>
            <option value="SOL">SOL/USDT</option>
          </select>
          <span style={{ fontSize: "0.7rem", padding: "2px 4px", border: "1px solid var(--border-focus)", color: "var(--color-accent)" }}>Event</span>
        </div>
        
        <NewsTicker />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", minWidth: "100px" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Last Price</div>
          <div style={{ color: "var(--color-accent)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>${lastPrice ? lastPrice.toFixed(2) : "0.00"}</div>
        </div>
      </div>

      {/* Main Professional Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", flex: 1, overflow: "hidden" }}>
        
        {/* Left/Center Area (Chart + Positions) */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid var(--border-light)", overflow: "hidden" }}>
          
          {/* Chart Section (70% height) */}
          <div style={{ flex: 7, overflow: "hidden", background: "var(--bg-page)", position: "relative", display: "flex", flexDirection: "column" }}>
            {/* Minimal Chart Controls Overlay */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "4px 8px", borderBottom: "1px solid var(--border-light)", zIndex: 10, display: "flex", gap: "8px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
               <span>Time</span>
               {["1m", "5m", "15m", "1h"].map(i => (
                 <span key={i} onClick={() => setInterval(i)} style={{ color: interval === i ? "var(--color-accent)" : "inherit", cursor: "pointer" }}>{i}</span>
               ))}
            </div>
            
            <div style={{ flex: 1, width: "100%", paddingTop: "24px", display: "flex", flexDirection: "column" }}>
              <PriceChart
                candles={candles}
                lastPrice={lastPrice}
                priceChange={priceChange}
                symbol={binanceSymbol}
                interval={interval}
                onIntervalChange={setInterval}
                theme={theme}
              />
            </div>
          </div>

          {/* Positions Panel (30% height) */}
          <div style={{ flex: 3, borderTop: "1px solid var(--border-light)", overflow: "hidden", background: "var(--bg-panel)" }}>
            <PositionsPanel />
          </div>

        </div>

        {/* Right Area (Order Entry / Trade Menu) */}
        <div style={{ overflowY: "auto", background: "var(--bg-panel)" }}>
          <TradeMenu markets={markets} activeAsset={activeAsset} />
        </div>

      </div>
    </div>
  );
}
