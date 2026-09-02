import { useEffect, useState } from "react";

const NEWS_ITEMS = [
  "BREAKING: Somnia Network TVL crosses $100M on testnet",
  "JUST IN: DreamDEX announces new $5,000 DoraHacks prize pool",
  "MARKET: BTC dominance surges as traders flock to event contracts",
  "NEWS: Institutional adoption of binary options on the rise",
  "ALPHA: New AI agents spotted trading IOC orders on DreamDEX",
];

export default function NewsTicker() {
  return (
    <div className="ticker-wrap" style={{ overflow: "hidden", whiteSpace: "nowrap", flex: 1, position: "relative" }}>
      <div className="ticker-move" style={{ display: "inline-block", paddingLeft: "100%" }}>
        {NEWS_ITEMS.map((item, i) => (
          <span key={i} style={{ 
            marginRight: "4rem", 
            fontFamily: "var(--font-mono)", 
            fontSize: "0.75rem", 
            color: "var(--text-primary)" 
          }}>
            <span style={{ color: "var(--color-accent)", marginRight: "8px" }}>//</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
