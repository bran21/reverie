/**
 * Reverie — Header Component
 */

export default function Header({ activeAsset, onAssetChange, isConnected }) {
  const assets = ["BTC", "ETH", "SOL"];

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo">⟡ REVERIE</span>
        <span className="app-header__tag">DreamDEX Terminal</span>
      </div>

      <div className="asset-tabs">
        {assets.map((asset) => (
          <button
            key={asset}
            className={`asset-tab ${activeAsset === asset ? "asset-tab--active" : ""}`}
            onClick={() => onAssetChange(asset)}
          >
            {asset}
          </button>
        ))}
      </div>

      <div className="app-header__nav">
        <span
          className="app-header__tag"
          style={{
            color: isConnected ? "var(--color-up)" : "var(--color-down)",
            borderColor: isConnected
              ? "rgba(16,185,129,0.3)"
              : "rgba(239,68,68,0.3)",
          }}
        >
          {isConnected ? "● LIVE" : "○ OFFLINE"}
        </span>
        <a
          href="https://docs.dreamdex.io/developers/event-contracts"
          target="_blank"
          rel="noopener noreferrer"
          className="asset-tab"
        >
          Docs ↗
        </a>
      </div>
    </header>
  );
}
