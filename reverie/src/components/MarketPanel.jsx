/**
 * Reverie — MarketPanel Component
 *
 * Right-side panel displaying all live DreamDEX binary prediction markets
 * for the currently selected asset.
 */

import TradeCard from "./TradeCard.jsx";

export default function MarketPanel({ markets, activeAsset }) {
  return (
    <div className="market-panel">
      <div className="market-panel__header">
        <h2 className="market-panel__title">
          {activeAsset} Event Contracts
        </h2>
        <div className="market-panel__live">
          <span className="live-dot" />
          <span>LIVE</span>
        </div>
      </div>

      <div className="market-list">
        {markets.length === 0 ? (
          <div className="empty-state glass-card">
            <span className="empty-state__icon">📭</span>
            <p>No live markets found</p>
            <p className="text-muted" style={{ fontSize: "0.75rem" }}>
              Waiting for DreamDEX data...
            </p>
          </div>
        ) : (
          markets.map((market) => (
            <TradeCard key={`${market.asset}-${market.cadence}`} market={market} />
          ))
        )}
      </div>
    </div>
  );
}
