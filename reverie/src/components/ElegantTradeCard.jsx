import { useState, useEffect } from "react";
import { useWriteContract, useAccount } from "wagmi";
import { parseUnits } from "viem";

// The DreamDEX BinaryMarketsModule contract ABI (simplified for the hackathon)
const BINARY_MARKETS_MODULE_ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "marketId", type: "bytes32" },
      { internalType: "enum OrderType", name: "orderType", type: "uint8" },
      { internalType: "enum OrderSide", name: "side", type: "uint8" },
      { internalType: "uint256", name: "quantity", type: "uint256" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "enum TimeInForce", name: "tif", type: "uint8" }
    ],
    name: "createOrder",
    outputs: [{ internalType: "uint256", name: "orderId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  }
];

const CONTRACT_ADDRESS = "0x3ecC694Cef705358864a646142ac17A90E29e388";

export default function ElegantTradeCard({ market }) {
  const { isConnected } = useAccount();
  const { writeContract, isPending, isSuccess, error } = useWriteContract();
  
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

  const handleTrade = (sideName) => {
    if (!isConnected) {
      alert("Please connect your wallet first using the black button below.");
      return;
    }

    // Prepare IOC Order parameters
    const sideEnum = sideName === "up" ? 0 : 1; // 0=Buy(Up), 1=Sell(Down)
    const price = sideName === "up" ? market.bestAsk : 1 - market.bestBid;
    const priceUnits = parseUnits(price.toString(), 6); // 6 decimals for tUSDC
    const qtyUnits = parseUnits("1", 6); // Buy 1 contract

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: BINARY_MARKETS_MODULE_ABI,
      functionName: "createOrder",
      args: [
        market.id,
        0, // OrderType.MARKET
        sideEnum,
        qtyUnits,
        priceUnits,
        2 // TimeInForce.IOC
      ],
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      
      {/* Question Header */}
      <div style={{ marginBottom: "var(--space-sm)" }}>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", color: "var(--text-primary)" }}>
          {market.question}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Window: {market.cadence}
          </span>
          <span style={{ fontSize: "0.75rem", color: isClosing ? "var(--color-down)" : "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {timeStr} REMAINING
          </span>
        </div>
      </div>

      {/* Up / Down Swap UI (Styled like the reference image input rows) */}
      
      {/* UP ROW */}
      <div className="input-group">
        <div className="input-label">
          <span>Current Probability</span>
          <span className="text-up">{(market.upProb * 100).toFixed(1)}%</span>
        </div>
        <div className="input-row">
          <input type="text" className="input-value" value="1.0" readOnly />
          <div style={{ display: "flex", gap: "8px" }}>
            <div className="asset-badge">
              <span style={{ color: "var(--color-up)", fontSize: "1.2rem" }}>▲</span> UP
            </div>
            <button 
              className="btn-connect btn-connect--sm"
              onClick={() => handleTrade("up")}
              disabled={!isTrading || isPending}
              style={{ backgroundColor: "var(--bg-inverse)" }}
            >
              {isPending ? "SIGNING..." : "BUY UP"}
            </button>
          </div>
        </div>
      </div>

      <div className="swap-divider">
        <div className="swap-icon">↕</div>
      </div>

      {/* DOWN ROW */}
      <div className="input-group">
        <div className="input-label">
          <span>Current Probability</span>
          <span className="text-down">{(market.downProb * 100).toFixed(1)}%</span>
        </div>
        <div className="input-row">
          <input type="text" className="input-value" value="1.0" readOnly />
          <div style={{ display: "flex", gap: "8px" }}>
            <div className="asset-badge">
              <span style={{ color: "var(--color-down)", fontSize: "1.2rem" }}>▼</span> DOWN
            </div>
            <button 
              className="btn-connect btn-connect--sm"
              onClick={() => handleTrade("down")}
              disabled={!isTrading || isPending}
              style={{ backgroundColor: "var(--bg-inverse)" }}
            >
              {isPending ? "SIGNING..." : "BUY DOWN"}
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {isSuccess && (
        <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--color-up)", textAlign: "center" }}>
          Transaction signed successfully!
        </div>
      )}
      {error && (
        <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--color-down)", textAlign: "center" }}>
          {error.shortMessage || error.message}
        </div>
      )}

    </div>
  );
}
