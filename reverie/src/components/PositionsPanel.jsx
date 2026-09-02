import { useState } from "react";

export default function PositionsPanel({ positions = [], currentPrice = 0 }) {
  const [activeTab, setActiveTab] = useState("positions");

  const tabs = [
    { id: "positions", label: `Positions (${positions.length})` },
    { id: "openOrders", label: "Open Orders (0)" },
    { id: "history", label: "Order History" },
    { id: "trades", label: "Trade History" },
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
      
      {/* Table Header */}
      <div style={{ display: "flex", padding: "8px var(--space-md)", fontSize: "0.7rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)" }}>
        <div style={{ flex: 1.5 }}>Symbol</div>
        <div style={{ flex: 1, textAlign: "right" }}>Size</div>
        <div style={{ flex: 1, textAlign: "right" }}>Entry Price</div>
        <div style={{ flex: 1, textAlign: "right" }}>Mark Price</div>
        <div style={{ flex: 1, textAlign: "right" }}>Margin</div>
        <div style={{ flex: 1, textAlign: "right" }}>PNL (ROE%)</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {positions.length === 0 ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
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
            const pnl = rawPnl * leverage;
            const roe = (pnl / pos.size) * 100;
            
            const isProfit = pnl >= 0;
            const pnlColor = isProfit ? "var(--color-success)" : "var(--color-danger)";

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
                <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)" }}>{pos.size.toFixed(2)} tUSDC</div>
                <div style={{ flex: 1, textAlign: "right", fontFamily: "var(--font-mono)", color: pnlColor, fontWeight: 600 }}>
                  {isProfit ? "+" : ""}{pnl.toFixed(2)} ({isProfit ? "+" : ""}{roe.toFixed(2)}%)
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
