import { useState } from "react";

export default function PositionsPanel() {
  const [activeTab, setActiveTab] = useState("positions");

  const tabs = [
    { id: "positions", label: "Positions (0)" },
    { id: "openOrders", label: "Open Orders (0)" },
    { id: "history", label: "Order History" },
    { id: "trades", label: "Trade History" },
    { id: "txlog", label: "Transaction Log" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-page)" }}>
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
      
      {/* Table Header Mock */}
      <div style={{ display: "flex", padding: "8px var(--space-md)", fontSize: "0.7rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)" }}>
        <div style={{ flex: 1.5 }}>Symbol</div>
        <div style={{ flex: 1, textAlign: "right" }}>Size</div>
        <div style={{ flex: 1, textAlign: "right" }}>Entry Price</div>
        <div style={{ flex: 1, textAlign: "right" }}>Mark Price</div>
        <div style={{ flex: 1, textAlign: "right" }}>Margin</div>
        <div style={{ flex: 1, textAlign: "right" }}>PNL (ROE%)</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
        No open positions.
      </div>
    </div>
  );
}
