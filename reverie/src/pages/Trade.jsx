import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWriteContract, useAccount } from "wagmi";
import { parseUnits } from "viem";
import ConnectButton from "../components/ConnectButton.jsx";
import PriceChart from "../components/PriceChart.jsx";
import TradeMenu from "../components/TradeMenu.jsx";
import PositionsPanel from "../components/PositionsPanel.jsx";
import NewsTicker from "../components/NewsTicker.jsx";
import Jumpscare from "../components/Jumpscare.jsx";
import { useBinanceStream } from "../hooks/useBinanceStream.js";
import { useDreamDexMarkets } from "../hooks/useDreamDexMarkets.js";
import { useTheme } from "../hooks/useTheme.js";

const ASSET_TO_BINANCE = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
};

const TUSDC_ADDRESS = "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E";
const TUSDC_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

export default function Trade() {
  const { theme, toggleTheme } = useTheme();
  const { isConnected, address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [activeAsset, setActiveAsset] = useState("BTC");
  const [interval, setInterval] = useState("5m");
  const [positions, setPositions] = useState(() => JSON.parse(localStorage.getItem("reverie_positions")) || []);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("reverie_history")) || []);
  const [txLogs, setTxLogs] = useState(() => JSON.parse(localStorage.getItem("reverie_txLogs")) || []);
  const [memeMode, setMemeMode] = useState(false);

  useEffect(() => {
    localStorage.setItem("reverie_positions", JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem("reverie_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("reverie_txLogs", JSON.stringify(txLogs));
  }, [txLogs]);

  const handleTxLog = (action, hash, wallet) => {
    setTxLogs(prev => [{ id: hash || Date.now().toString(), hash: hash || "Pending", action, wallet: wallet || address, timestamp: Date.now() }, ...prev]);
  };

  const binanceSymbol = ASSET_TO_BINANCE[activeAsset] || "BTCUSDT";

  const { candles, lastPrice, priceChange } = useBinanceStream(
    binanceSymbol,
    interval
  );

  const { markets } = useDreamDexMarkets(lastPrice, candles, activeAsset);

  const handleAddPosition = (pos) => {
    setPositions(prev => [...prev, pos]);
  };

  // Simulated Settlement Engine
  useEffect(() => {
    if (positions.length === 0 || !lastPrice) return;
    
    const nowSecs = Date.now() / 1000;
    const active = [];
    const settled = [];

    positions.forEach(pos => {
      if (nowSecs >= pos.expiryTime) {
        // Resolve Trade dynamically based on % move
        const diff = lastPrice - pos.entryPrice;
        const pct = diff / pos.entryPrice;
        
        let rawPnl = pos.side === "UP" ? pos.size * pct : pos.size * (-pct);
        const leverage = 10;
        let pnl = rawPnl * leverage;

        // Prevent losing more than the initial margin (liquidation)
        if (pnl < -pos.size) {
          pnl = -pos.size;
        }

        const isWin = pnl >= 0;

        settled.push({
          ...pos,
          settlementPrice: lastPrice,
          pnl,
          isWin,
          settledAt: Date.now()
        });
      } else {
        active.push(pos);
      }
    });

    if (settled.length > 0) {
      setPositions(active);
      setHistory(prev => [...settled, ...prev]);
    }
  }, [positions, lastPrice]);

  const handleClaim = (posId, amount) => {
    if (!isConnected) return;
    
    // MOCK: We use the faucet to mint the winnings back to the user!
    writeContract({
      address: TUSDC_ADDRESS,
      abi: TUSDC_ABI,
      functionName: "faucet",
      args: [parseUnits(amount.toFixed(2), 6)],
    }, {
      onSuccess(hash) {
        handleTxLog("Redeem Winnings", hash, address);
      }
    });

    // Optimistically mark as claimed
    setHistory(prev => prev.map(p => p.id === posId ? { ...p, isClaimed: true } : p));
  };

  const handleFaucet = () => {
    if (!isConnected) return;
    writeContract({
      address: TUSDC_ADDRESS,
      abi: TUSDC_ABI,
      functionName: "faucet",
      args: [parseUnits("10000", 6)],
    }, {
      onSuccess(hash) {
        handleTxLog("Faucet Claim", hash, address);
      }
    });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page)", color: "var(--text-primary)" }}>
      
      {/* Dynamic Backgrounds */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
        opacity: priceChange > 0 ? 1 : 0,
        transition: "opacity 1.5s ease"
      }} />
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.12) 0%, transparent 70%)",
        opacity: priceChange < 0 ? 1 : 0,
        transition: "opacity 1.5s ease"
      }} />

      <Jumpscare candles={candles} />

      {/* Top Navbar */}
      <header style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "center", 
        padding: "var(--space-sm) var(--space-md)", borderBottom: "1px solid var(--border-light)",
        background: "var(--bg-page)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xl)" }}>
          <Link to="/" className="logo-signature" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            Reverie
          </Link>
          
          <div style={{ display: "flex", gap: "var(--space-lg)", fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            <Link to="/trade" style={{ color: "var(--color-accent)", textDecoration: "none" }}>Trade</Link>
            <Link to="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>Portfolio</Link>
            <span style={{ cursor: "pointer" }}>History</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          {isConnected && (
            <button 
              onClick={handleFaucet} 
              disabled={isPending}
              style={{ background: "var(--color-accent)", color: "#000", border: "none", cursor: "pointer", padding: "6px 12px", fontSize: "0.8rem", fontWeight: 700, borderRadius: "2px", opacity: isPending ? 0.5 : 1 }}
            >
              + FAUCET
            </button>
          )}
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
                memeMode={memeMode}
              />
            </div>
          </div>

          {/* Positions Panel (30% height) */}
          <div style={{ flex: 3, borderTop: "1px solid var(--border-light)", overflow: "hidden", background: "var(--bg-panel)" }}>
            <PositionsPanel positions={positions} history={history} txLogs={txLogs} currentPrice={lastPrice} onClaim={handleClaim} />
          </div>

        </div>

        {/* Right Area (Order Entry / Trade Menu) */}
        <div style={{ overflowY: "auto", background: "var(--bg-panel)" }}>
          <TradeMenu markets={markets} activeAsset={activeAsset} onTrade={handleAddPosition} onTxLog={handleTxLog} />
        </div>
      </div>

      {/* Easter Egg Footer */}
      <footer style={{ 
        display: "flex", justifyContent: "flex-end", padding: "4px 16px", 
        background: "var(--bg-panel)", borderTop: "1px solid var(--border-light)",
        fontSize: "0.75rem", alignItems: "center"
      }}>
        <button 
          onClick={() => setMemeMode(!memeMode)}
          style={{
            background: "transparent",
            color: memeMode ? "var(--color-accent)" : "var(--text-muted)",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
            opacity: 0.6, fontFamily: "var(--font-mono)"
          }}
          title="Warning: Highly volatile visual experience"
        >
          ⚠️ {memeMode ? "MEME ON" : "MEME OFF"}
        </button>
      </footer>
    </div>
  );
}
