import { useState, useCallback, useMemo } from 'react';
import { useWalletClient } from 'wagmi';
import { SomniaMarkets, ORDER_TYPE } from '@somnia-chain/markets-sdk';

const INDEXER_URL = "https://prd.smk.somnia.host/v1/graphql";
const RPC_URL = "https://dream-rpc.somnia.network";

export function useTrader() {
  const { data: walletClient } = useWalletClient();
  const [isPending, setIsPending] = useState(false);

  // Initialize the exchange client.
  const exchange = useMemo(() => {
    if (!walletClient) return null;
    return new SomniaMarkets({
      rpcUrl: RPC_URL,
      wsRpcUrl: "wss://dream-rpc.somnia.network/ws",
      indexerUrl: INDEXER_URL,
      walletClient: walletClient,
      addresses: {
        binaryModule: "0x3ecC694Cef705358864a646142ac17A90E29e388"
      }
    });
  }, [walletClient]);

  const placeBinaryLimit = useCallback(async ({ marketId, side, size, price, type = "ioc" }) => {
    if (!walletClient || !exchange) throw new Error("Wallet not connected");
    setIsPending(true);
    
    try {
      // 1. Get onchain market details (gives us pool address and IDs)
      const onchain = await exchange.client.getMarketOnchain(marketId);
      
      // 2. The trader is already initialized inside SomniaMarkets via walletClient
      const trader = exchange.trader;
      
      // 3. Format inputs for Trader
      const decimals = 6;
      const one = 10n ** BigInt(decimals);
      
      // We pass the human string "up" or "down"
      const outcome = side === "up" ? "YES" : "NO";
      
      // If the user buys "up", it's a BUY_YES order.
      // If the user buys "down", it's a BUY_NO order.
      const orderSide = outcome === "YES" ? "BUY_YES" : "BUY_NO";
      
      // We convert human sizes and prices to raw bigints
      const quantity = BigInt(Math.floor(size * Number(one))); 
      
      // Price snapping (tick is usually 1, so we round it)
      const priceOwn = BigInt(Math.round(price * Number(one)));
      
      // The book is quoted in YES terms whichever leg you are on.
      // So if outcome is NO, priceYes = one - priceOwn.
      const priceYes = outcome === "YES" ? priceOwn : (one - priceOwn);

      // Orders must expire no later than the market itself.
      const nowSec = Math.floor(Date.now() / 1000);
      
      if (Number(onchain.expiry) <= nowSec) {
        throw new Error("Market has already expired on-chain.");
      }

      const expiresInSec = 300; // 5 mins
      const expiresAt = Math.min(nowSec + expiresInSec, Number(onchain.expiry));
      
      const orderTypeMap = {
        "post-only": 3, // ORDER_TYPE.POST_ONLY
        "ioc": 2, // ORDER_TYPE.MARKET
        "limit": 0 // ORDER_TYPE.LIMIT
      };

      const req = {
        pool: onchain.pool,
        side: orderSide,
        price: priceYes,
        quantity,
        outcomeToken: onchain.outcomeToken,
        yesId: onchain.yesId,
        noId: onchain.noId,
        orderType: orderTypeMap[type] !== undefined ? orderTypeMap[type] : 2,
        expireTimestampNs: BigInt(expiresAt) * 1_000_000_000n,
      };

      console.log("Submitting order via Somnia SDK:", req);

      const res = await trader.placeOrder(req);
      
      console.log("Order submitted successfully:", res.hash);
      return res.hash;
    } catch (err) {
      console.error("Order placement failed:", err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [exchange, walletClient]);

  return { placeBinaryLimit, isPending };
}
