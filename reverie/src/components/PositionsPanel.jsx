import { useState, useEffect } from "react";
import { playWinSound, playLossSound } from "../utils/audio.js";

export default function PositionsPanel({ positions = [], history = [], txLogs = [], currentPrice = 0, onClaim }) {
  const [activeTab, setActiveTab] = useState("positions");
  const [now, setNow] = useState(Date.now() / 1000);
  const [hoveredRow, setHoveredRow] = useState(null);

  // Force re-render every second to update the countdown timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { id: "positions", label: `Positions (${positions.length})` },
    { id: "openOrders", label: "Open Orders (0)" },
    { id: "history", label: `History (${history.length})` },
    { id: "txlog", label: "Transaction Log" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-page)", color: "var(--text-primary)" }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-light)", gap: "16px", padding: "0 var(--space-md)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 4px",
              border: "none",
              background: "transparent",
              color: activeTab === tab.id ? "var(--color-accent)" : "var(--text-secondary)",
              fontWeight: 500,
              fontSize: "0.8rem",
              cursor: "pointer",
              borderBottom: activeTab === tab.id ? "2px solid var(--color-accent)" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        
        {activeTab === "positions" && (
          <>
            <div style={{ display: "flex", padding: "8px var(--space-md)", fontSize: "0.7rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ flex: 1.5 }}>Symbol</div>
              <div style={{ flex: 1, textAlign: "right" }}>Size</div>
              <div style={{ flex: 1, textAlign: "right" }}>Entry Price</div>
              <div style={{ flex: 1, textAlign: "right" }}>Mark Price</div>
              <div style={{ flex: 1, textAlign: "right" }}>Expires In</div>
              <div style={{ flex: 1, textAlign: "right" }}>PNL (ROE%)</div>
            </div>
            
            {positions.length === 0 ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.8rem", padding: "32px 0" }}>
                No open positions.
              </div>
            ) : (
              positions.map(pos => {
                // Simulated PNL calculation
                const diff = currentPrice - pos.entryPrice;
                let rawPnl = 0;
                if (pos.entryPrice > 0) {
                  const pct = diff / pos.entryPrice;
                  rawPnl = pos.side === "UP" ? pos.size * pct : pos.size * (-pct);
                }
                
                // Boost PNL for visual hackathon effect (e.g. leverage effect)
                const leverage = 10;
                let pnl = rawPnl * leverage;

                // Prevent losing more than initial margin
                if (pnl < -pos.size) {
                  pnl = -pos.size;
                }

                const roe = (pnl / pos.size) * 100;
                
                const isProfit = pnl >= 0;
                const pnlColor = isProfit ? "var(--color-success)" : "var(--color-danger)";

                const timeLeft = Math.max(0, pos.expiryTime - now);
                const mins = Math.floor(timeLeft / 60);
                const secs = Math.floor(timeLeft % 60);
                const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

                return (
                  <div key={pos.id} style={{ display: "flex", padding: "12px var(--space-md)", fontSize: "0.8rem", borderBottom: "1px solid var(--border-light)", alignItems: "center" }}>
                    <div style={{ flex: 1.5, display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                      <span style={{ 
                        color: pos.side === "UP" ? "var(--color-success)" : "var(--color-danger)",
                        background: pos.side === "UP" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        padding: "2px 4px", borderRadius: "2px", fontSize: "0.65rem" 
                      }}>
                        {pos.side}
                      </span>
                      {pos.symbol}
                    </div>
                    <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)" }}>{pos.size.toFixed(2)}</div>
                    <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)" }}>${pos.entryPrice.toFixed(2)}</div>
                    <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-accent)" }}>${currentPrice.toFixed(2)}</div>
                    <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)" }}>{timeStr}</div>
                    <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)", color: pnlColor, fontWeight: 600 }}>
                      {isProfit ? "+" : ""}{pnl.toFixed(2)} ({isProfit ? "+" : ""}{roe.toFixed(2)}%)
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === "history" && (
          <>
            <div style={{ display: "flex", padding: "8px var(--space-md)", fontSize: "0.7rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ flex: 1.5 }}>Symbol</div>
              <div style={{ flex: 1, textAlign: "right" }}>Size</div>
              <div style={{ flex: 1, textAlign: "right" }}>Entry Price</div>
              <div style={{ flex: 1, textAlign: "right" }}>Settled Price</div>
              <div style={{ flex: 1, textAlign: "right" }}>Result</div>
              <div style={{ flex: 1, textAlign: "right" }}>Payout</div>
            </div>
            
            {history.length === 0 ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.8rem", padding: "32px 0" }}>
                No settled trades yet.
              </div>
            ) : (
              history.map(pos => {
                const payoutColor = pos.isWin ? "var(--color-success)" : "var(--color-danger)";
                const payoutText = pos.isWin ? `+${(pos.pnl + pos.size).toFixed(2)} tUSDC` : `-${pos.size.toFixed(2)} tUSDC`;
                const payoutAmount = pos.pnl + pos.size;

                return (
                  <div 
                    key={pos.id} 
                    onClick={() => pos.isWin ? playWinSound() : playLossSound()}
                    onMouseEnter={() => setHoveredRow(pos.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ 
                      display: "flex", 
                      padding: "12px var(--space-md)", 
                      fontSize: "0.8rem", 
                      borderBottom: "1px solid var(--border-light)", 
                      alignItems: "center",
                      cursor: "pointer",
                      background: hoveredRow === pos.id ? "var(--bg-inverse)" : "transparent",
                      transition: "background 0.2s"
                    }}
                    title="Click to play settlement sound"
                  >
                    <div style={{ flex: 1.5, display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                      <span style={{ 
                        color: pos.side === "UP" ? "var(--color-success)" : "var(--color-danger)",
                        background: pos.side === "UP" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        padding: "2px 4px", borderRadius: "2px", fontSize: "0.65rem" 
                      }}>
                        {pos.side}
                      </span>
                      <span style={{ color: hoveredRow === pos.id ? "var(--text-inverse)" : "inherit" }}>
                        {pos.symbol}
                      </span>
                    </div>
                    <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)", color: hoveredRow === pos.id ? "var(--text-inverse)" : "inherit" }}>{pos.size.toFixed(2)}</div>
                    <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)", color: hoveredRow === pos.id ? "var(--text-inverse)" : "inherit" }}>${pos.entryPrice.toFixed(2)}</div>
                    <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)", color: hoveredRow === pos.id ? "var(--text-inverse)" : "inherit" }}>${pos.settlementPrice.toFixed(2)}</div>
                    <div style={{ flex: 1, textAlign: "right", fontWeight: 700, color: hoveredRow === pos.id ? "var(--text-inverse)" : payoutColor }}>{pos.isWin ? "WIN" : "LOSS"}</div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", fontFamily: "var(--font-mono)", color: hoveredRow === pos.id ? "var(--text-inverse)" : payoutColor, fontWeight: 600 }}>
                      <span>{payoutText}</span>
                      {pos.isWin && !pos.isClaimed && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onClaim) onClaim(pos.id, payoutAmount);
                          }}
                          style={{
                            background: "var(--color-success)",
                            color: "#fff",
                            border: "none",
                            padding: "4px 8px",
                            borderRadius: "2px",
                            fontSize: "0.7rem",
                            cursor: "pointer",
                            fontWeight: "bold"
                          }}
                        >
                          CLAIM
                        </button>
                      )}
                      {pos.isWin && pos.isClaimed && (
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>CLAIMED</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
        {activeTab === "txlog" && (
          <>
            <div style={{ display: "flex", padding: "8px var(--space-md)", fontSize: "0.7rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ flex: 1.5 }}>Action</div>
              <div style={{ flex: 2 }}>Tx Hash</div>
              <div style={{ flex: 1.5 }}>Wallet</div>
              <div style={{ flex: 1, textAlign: "right" }}>Time</div>
            </div>
            
            {txLogs.length === 0 ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.8rem", padding: "32px 0" }}>
                No transactions yet.
              </div>
            ) : (
              txLogs.map(log => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString();
                const hashShort = log.hash ? `${log.hash.slice(0, 8)}...${log.hash.slice(-6)}` : "Pending...";
                const walletShort = log.wallet ? `${log.wallet.slice(0, 6)}...${log.wallet.slice(-4)}` : "Unknown";

                return (
                  <div 
                    key={log.id} 
                    style={{ 
                      display: "flex", 
                      padding: "12px var(--space-md)", 
                      fontSize: "0.8rem", 
                      borderBottom: "1px solid var(--border-light)", 
                      alignItems: "center"
                    }}
                  >
                    <div style={{ flex: 1.5, fontWeight: 600 }}>{log.action}</div>
                    <div style={{ flex: 2, fontFamily: "var(--font-mono)", color: "var(--color-accent)" }}>
                      <a 
                        href={`https://shannon-explorer.somnia.network/tx/${log.hash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {hashShort}
                      </a>
                    </div>
                    <div style={{ flex: 1.5, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{walletShort}</div>
                    <div style={{ flex: 1, textAlign: "right", color: "var(--text-muted)", fontSize: "0.75rem" }}>{timeStr}</div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
