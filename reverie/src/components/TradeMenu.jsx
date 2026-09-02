import { useState, useEffect } from "react";
import { useWriteContract, useReadContract, useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";

const CONTRACT_ADDRESS = "0x3ecC694Cef705358864a646142ac17A90E29e388"; // BinaryMarketsModule
const TUSDC_ADDRESS = "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E";

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

const TUSDC_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
];

// Simulated Vault Address for hackathon demo
const VAULT_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export default function TradeMenu({ markets, activeAsset, onTrade }) {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  
  // Fetch Balance
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: TUSDC_ADDRESS,
    abi: TUSDC_ABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address,
      refetchInterval: 5000
    }
  });

  const [selectedCadence, setSelectedCadence] = useState("5m");
  const [size, setSize] = useState("10.0"); 

  const activeMarket = markets.find(m => m.cadence === selectedCadence) || markets[0];
  
  if (!activeMarket) return null;

  const remaining = activeMarket.remaining || 0;
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
  const isTrading = activeMarket?.status === "Trading";

  const formattedBalance = balanceData !== undefined 
    ? Number(formatUnits(balanceData, 6)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";

  const handleTrade = (sideName) => {
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }
    
    // For the hackathon demo, we simulate the complex DreamDEX EIP-712 order placement 
    // by triggering a real on-chain transfer of the collateral (tUSDC) to a Vault.
    // This pops MetaMask, executes on Somnia, and decreases the user's balance!
    const qtyUnits = parseUnits(size.toString(), 6);

    writeContract({
      address: TUSDC_ADDRESS,
      abi: TUSDC_ABI,
      functionName: "transfer",
      args: [VAULT_ADDRESS, qtyUnits],
    });

    // Optimistically record the position for the UI
    if (onTrade) {
      onTrade({
        id: Math.random().toString(36).substr(2, 9),
        symbol: `${activeAsset}-${selectedCadence.toUpperCase()}`,
        side: sideName.toUpperCase(),
        size: parseFloat(size),
        entryPrice: activeMarket?.currentPrice || 0,
        expiryTime: activeMarket?.windowEnd || (Date.now() / 1000) + 300,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      
      {/* Menu Header */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-light)", padding: "12px var(--space-md)" }}>
        {["Event", "Limit"].map(tab => (
          <span key={tab} style={{ color: tab === "Event" ? "var(--color-accent)" : "var(--text-muted)", fontSize: "0.85rem", cursor: "pointer", borderBottom: tab === "Event" ? "1px solid var(--color-accent)" : "none", paddingBottom: "4px" }}>
            {tab}
          </span>
        ))}
      </div>

      <div style={{ padding: "var(--space-md)", flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
        
        {/* Window Selector */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            <span>Window</span>
            <span className="font-mono">{timeStr} left</span>
          </div>
          <div style={{ display: "flex", gap: "4px", background: "var(--bg-page)", padding: "4px", borderRadius: "2px", border: "1px solid var(--border-light)" }}>
            {["5m", "15m", "1h"].map(cadence => (
              <button
                key={cadence}
                onClick={() => setSelectedCadence(cadence)}
                style={{
                  flex: 1, padding: "6px", border: "none",
                  background: selectedCadence === cadence ? "var(--bg-inverse)" : "transparent",
                  color: selectedCadence === cadence ? "var(--text-inverse)" : "var(--text-muted)",
                  cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase",
                  borderRadius: "2px"
                }}
              >
                {cadence}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4, padding: "8px", background: "var(--bg-page)", border: "1px dashed var(--border-focus)", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>{activeMarket.question}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Opening Price: ${activeMarket.openPrice ? activeMarket.openPrice.toFixed(2) : "Loading..."}
          </span>
        </div>

        {/* Probabilities */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", background: "var(--bg-page)", padding: "8px", border: "1px solid var(--border-light)" }}>
          <div>
            <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Up Prob</span>
            <span className="text-up font-mono">{(activeMarket.upProb * 100).toFixed(1)}%</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Down Prob</span>
            <span className="text-down font-mono">{(activeMarket.downProb * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Size Input */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Size</span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Avail: {formattedBalance} tUSDC
              </span>
            </div>
          </div>
          <div style={{ display: "flex", background: "var(--bg-page)", border: "1px solid var(--border-light)", padding: "8px 12px", alignItems: "center" }}>
            <input 
              type="number" 
              value={size}
              onChange={(e) => setSize(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontFamily: "var(--font-mono)", fontSize: "1rem", color: "var(--text-primary)" }}
            />
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>tUSDC</span>
          </div>
          
          {/* Percentage Slider (Visual) */}
          <div style={{ marginTop: "16px", position: "relative" }}>
             <div style={{ height: "4px", background: "var(--border-light)", borderRadius: "2px", width: "100%" }}>
                <div style={{ width: "25%", height: "100%", background: "var(--border-focus)", borderRadius: "2px" }}></div>
             </div>
             <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
             </div>
          </div>
        </div>

        {/* Summary Info */}
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Cost</span>
            <span className="font-mono">{size} tUSDC</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Fee (0.1%)</span>
            <span className="font-mono">{(parseFloat(size) * 0.001).toFixed(3)} tUSDC</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
          <button 
            onClick={() => handleTrade("up")}
            disabled={!isTrading || isPending}
            style={{ 
              flex: 1, padding: "12px", background: "var(--color-up)", color: "#000", border: "none", 
              cursor: isTrading ? "pointer" : "not-allowed", fontWeight: 700, fontSize: "0.9rem",
              opacity: isTrading ? 1 : 0.5, borderRadius: "2px"
            }}
          >
            {isPending ? "SIGNING..." : "Buy / Up"}
          </button>
          <button 
            onClick={() => handleTrade("down")}
            disabled={!isTrading || isPending}
            style={{ 
              flex: 1, padding: "12px", background: "var(--color-down)", color: "#fff", border: "none", 
              cursor: isTrading ? "pointer" : "not-allowed", fontWeight: 700, fontSize: "0.9rem",
              opacity: isTrading ? 1 : 0.5, borderRadius: "2px"
            }}
          >
            {isPending ? "SIGNING..." : "Sell / Down"}
          </button>
        </div>
      </div>
    </div>
  );
}
