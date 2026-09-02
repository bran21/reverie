import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { useQuery } from "@tanstack/react-query";
import ConnectButton from "../components/ConnectButton.jsx";
import { useTheme } from "../hooks/useTheme.js";

const TUSDC_ADDRESS = "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E";
const TUSDC_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

const mockNews = [
  { source: "Bloomberg", time: "10m ago", title: "SEC Signals Approval for Spot Ethereum ETFs by Mid-July" },
  { source: "Reuters", time: "45m ago", title: "Bitcoin Miner Reserves Hit 3-Year Low Amid Halving Squeeze" },
  { source: "CryptoNews", time: "2h ago", title: "Solana Network Congestion Eases Following Validator Patch Deployment" }
];

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const { isConnected, address } = useAccount();
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    const saved = localStorage.getItem("reverie_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const { data: balanceData } = useReadContract({
    address: TUSDC_ADDRESS,
    abi: TUSDC_ABI,
    functionName: "balanceOf",
    args: [address],
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  const usdcBalance = balanceData ? Number(formatUnits(balanceData, 6)) : 0;

  const { data: ethBalanceData } = useQuery({
    queryKey: ['somiBalance', address],
    queryFn: async () => {
      if (!address) return 0;
      const res = await fetch(`https://shannon-explorer.somnia.network/api?module=account&action=balance&address=${address}`);
      const data = await res.json();
      if (data.status === "1" && data.result) {
        return Number(formatUnits(BigInt(data.result), 18));
      }
      return 0;
    },
    enabled: !!address,
    refetchInterval: 5000
  });
  
  // Calculate PNL from history (unrealized or realized)
  // For simplicity, we just mock some stats if they have no balance, else use real.
  const somiBalance = ethBalanceData || 0; 
  const totalEquity = usdcBalance + somiBalance;
  const availableMargin = usdcBalance;
  
  const unrealizedPnl = history.reduce((acc, trade) => acc + (trade.pnl || 0), 0);
  const pnlColor = unrealizedPnl >= 0 ? "var(--color-success)" : "var(--color-danger)";

  const { data: newsData } = useQuery({
    queryKey: ['cryptoNews'],
    queryFn: async () => {
      const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss");
      const data = await res.json();
      return data.items || [];
    },
    refetchInterval: 60000
  });
  
  const newsList = newsData && newsData.length > 0 
    ? [
        {
          source: "Somnia",
          time: "Latest",
          title: "Somnia Network Surpasses 1 Million Testnet Transactions as DreamDEX Launches",
          link: "https://somnia.network"
        },
        ...newsData.slice(0, 2).map(item => ({
          source: "Cointelegraph",
          time: new Date(item.pubDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          title: item.title,
          link: item.link
        }))
      ]
    : mockNews;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page)", color: "var(--text-primary)" }}>
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
            <Link to="/trade" style={{ color: "inherit", textDecoration: "none" }}>Trade</Link>
            <Link to="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>Dashboard</Link>
            <Link to="/dashboard" style={{ color: "var(--color-accent)", textDecoration: "none", borderBottom: "2px solid var(--color-accent)", paddingBottom: "16px", marginBottom: "-16px" }}>Portfolio</Link>
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

      {/* Main Content */}
      <div style={{ padding: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-lg)", maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
        
        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[
            { label: "Total Equity", value: `$${totalEquity.toLocaleString(undefined, {minimumFractionDigits: 2})}`, sub: "+2.4% (24h)", subColor: "var(--color-success)" },
            { label: "Available Margin", value: `$${availableMargin.toLocaleString(undefined, {minimumFractionDigits: 2})}` },
            { label: "Margin Ratio", value: "Healthy", valueColor: "var(--color-success)", extra: "14.2%" },
            { label: "Unrealized PNL", value: `${unrealizedPnl >= 0 ? "+" : ""}$${unrealizedPnl.toLocaleString(undefined, {minimumFractionDigits: 2})}`, valueColor: pnlColor }
          ].map((card, i) => (
            <div key={i} style={{ background: "var(--bg-panel)", border: "1px solid var(--border-light)", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{card.label}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: card.valueColor || "inherit" }}>{card.value}</div>
                {card.extra && <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{card.extra}</div>}
              </div>
              {card.sub && <div style={{ fontSize: "0.75rem", color: card.subColor || "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{card.sub}</div>}
            </div>
          ))}
        </div>

        {/* 2-Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
          
          {/* Collateral Table */}
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border-light)", fontWeight: 600 }}>Collateral</div>
            <div style={{ padding: "12px 16px", display: "flex", fontSize: "0.75rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ flex: 2 }}>Asset</div>
              <div style={{ flex: 1, textAlign: "right" }}>Balance</div>
              <div style={{ flex: 1, textAlign: "right" }}>Value (USD)</div>
              <div style={{ flex: 1, textAlign: "right" }}>Action</div>
            </div>
            {[
              { symbol: "USDC", name: "USDC", balance: usdcBalance, value: usdcBalance, color: "#2775ca" },
              { symbol: "SOMI", name: "SOMI", balance: somiBalance, value: somiBalance, color: "#d946ef" }
            ].map((asset, i) => (
              <div key={i} style={{ padding: "16px", display: "flex", fontSize: "0.85rem", alignItems: "center", borderBottom: i < 2 ? "1px solid var(--border-light)" : "none" }}>
                <div style={{ flex: 2, display: "flex", alignItems: "center", gap: "8px", fontWeight: 500 }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: asset.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", color: "#fff", fontWeight: "bold" }}>
                    {asset.symbol.slice(0,3)}
                  </div>
                  {asset.name}
                </div>
                <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)" }}>{asset.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)" }}>${(asset.value).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <Link to="/trade" style={{ color: "var(--color-success)", fontSize: "0.75rem", cursor: "pointer", textDecoration: "none" }}>Trade</Link>
                </div>
              </div>
            ))}
          </div>

          {/* Market Intelligence */}
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border-light)", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "var(--color-success)" }}>▤</span> Market Intelligence
            </div>
            <div style={{ display: "flex", flexDirection: "column", padding: "16px", gap: "16px" }}>
              {newsList.map((news, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px", borderBottom: i < newsList.length -1 ? "1px solid var(--border-light)" : "none", paddingBottom: i < newsList.length -1 ? "16px" : "0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.65rem", padding: "2px 6px", background: "var(--bg-inverse)", color: "var(--text-inverse)", borderRadius: "2px" }}>{news.source}</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{news.time}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", lineHeight: 1.4 }}>{news.title}</div>
                  <a href={news.link || "#"} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "right", cursor: "pointer", textDecoration: "none" }}>Read More →</a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trade History */}
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: "16px", padding: "0 16px", borderBottom: "1px solid var(--border-light)" }}>
             <div style={{ padding: "12px 0", borderBottom: "2px solid var(--color-success)", color: "var(--color-success)", fontSize: "0.85rem", cursor: "pointer" }}>Trade History</div>
             <div style={{ padding: "12px 0", color: "var(--text-muted)", fontSize: "0.85rem", cursor: "pointer" }}>Funding Logs</div>
          </div>
          
          <div style={{ padding: "12px 16px", display: "flex", fontSize: "0.75rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ flex: 1.5 }}>Time</div>
            <div style={{ flex: 1 }}>Market</div>
            <div style={{ flex: 1 }}>Side</div>
            <div style={{ flex: 1, textAlign: "right" }}>Size</div>
            <div style={{ flex: 1.5, textAlign: "right" }}>Price</div>
            <div style={{ flex: 1, textAlign: "right" }}>Fee</div>
            <div style={{ flex: 1, textAlign: "right" }}>Realized PNL</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {history.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>No trade history available.</div>
            ) : (
              history.slice(0, 10).map((trade, i) => (
                <div key={i} style={{ padding: "12px 16px", display: "flex", fontSize: "0.8rem", alignItems: "center", borderBottom: "1px solid var(--border-light)" }}>
                  <div style={{ flex: 1.5, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                    {new Date(trade.settledAt || trade.timestamp).toLocaleString()}
                  </div>
                  <div style={{ flex: 1 }}>{trade.symbol}</div>
                  <div style={{ flex: 1, color: trade.side === "UP" ? "var(--color-success)" : "var(--color-danger)" }}>
                    {trade.side === "UP" ? "Long" : "Short"}
                  </div>
                  <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)" }}>{trade.size.toFixed(2)}</div>
                  <div style={{ flex: 1.5, textAlign: "right", fontFamily: "var(--font-mono)" }}>${(trade.settlementPrice || trade.entryPrice).toFixed(2)}</div>
                  <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)" }}>${(trade.size * 0.001).toFixed(2)}</div>
                  <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)", color: trade.pnl >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                    {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
