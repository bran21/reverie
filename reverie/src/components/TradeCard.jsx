/**
 * Reverie — TradeCard Component
 *
 * Displays a single DreamDEX binary prediction market with:
 * - Asset and cadence info
 * - Market question
 * - Countdown timer with progress bar
 * - Up/Down probability bar
 * - Best bid/ask touch prices
 * - Buy Up / Buy Down action buttons
 */

import { useState, useEffect } from "react";

export default function TradeCard({ market }) {
  const [remaining, setRemaining] = useState(market.remaining);

  // Countdown timer
  useEffect(() => {
    setRemaining(market.remaining);
    const timer = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [market.remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  const isClosing = remaining < 60;
  const isTrading = market.status === "Trading";

  const handleTrade = (side) => {
    const price = side === "up" ? market.bestAsk : 1 - market.bestBid;
    alert(
      `🚀 To execute this trade, run:\n\n` +
      `node src/bot/index.js --task dreamdex-trade\n\n` +
      `This would place an IOC ${side.toUpperCase()} order at ${price.toFixed(3)} ` +
      `on ${market.asset} ${market.cadence} window.\n\n` +
      `Connect your wallet or use the Reverie CLI bot.`
    );
  };

  return (
    <div className="trade-card glass-card fade-in">
      {/* Header */}
      <div className="trade-card__header">
        <span className="trade-card__asset">
          {market.asset}
        </span>
        <span className="trade-card__cadence">{market.cadence}</span>
      </div>

      {/* Question */}
      <p className="trade-card__question">{market.question}</p>

      {/* Countdown */}
      <div className="trade-card__expiry">
        <span style={{ color: isClosing ? "var(--color-down)" : "var(--text-muted)" }}>
          {isClosing ? "⚠" : "⏱"} {timeStr}
        </span>
        <div className="trade-card__expiry-bar">
          <div
            className="trade-card__expiry-fill"
            style={{ width: `${market.progress * 100}%` }}
          />
        </div>
      </div>

      {/* Probability bar */}
      <div className="trade-card__prob-bar">
        <div
          className="trade-card__prob-up"
          style={{ width: `${market.upProb * 100}%` }}
        />
        <div
          className="trade-card__prob-down"
          style={{ width: `${market.downProb * 100}%` }}
        />
      </div>

      {/* Touch prices */}
      <div className="trade-card__prices">
        <div>
          <div className="trade-card__price-label">Up Prob</div>
          <div className="trade-card__price-value text-up">
            {(market.upProb * 100).toFixed(1)}%
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div className="trade-card__price-label">Spread</div>
          <div className="trade-card__price-value text-muted" style={{ fontSize: "0.8rem" }}>
            {((market.bestAsk - market.bestBid) * 100).toFixed(1)}¢
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="trade-card__price-label">Down Prob</div>
          <div className="trade-card__price-value text-down">
            {(market.downProb * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Trade buttons */}
      <div className="trade-card__actions">
        <button
          className="trade-btn trade-btn--up"
          onClick={() => handleTrade("up")}
          disabled={!isTrading}
        >
          <span className="trade-btn__label">Buy</span>
          UP ▲
        </button>
        <button
          className="trade-btn trade-btn--down"
          onClick={() => handleTrade("down")}
          disabled={!isTrading}
        >
          <span className="trade-btn__label">Buy</span>
          DOWN ▼
        </button>
      </div>

      {/* Mini stats */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "var(--space-sm)",
          fontSize: "0.65rem",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span>Vol: {market.volume} tUSDC</span>
        <span>Trades: {market.trades}</span>
      </div>
    </div>
  );
}
