import { useState, useEffect } from 'react';
import { exchangeClient } from '../lib/dreamdexClient.js';

export function useLiveMarket(poolAddress) {
  const [orderbook, setOrderbook] = useState({ bids: [], asks: [] });
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    if (!poolAddress) return;

    let unwatch = () => {};
    let interval;

    const setup = async () => {
      try {
        const handle = await exchangeClient.client.watchMarket(poolAddress);
        unwatch = handle.unwatch;
        
        interval = setInterval(() => {
          const book = exchangeClient.client.getLiveBinaryOrderBook(poolAddress);
          if (book) {
            setOrderbook({ bids: book.bids || [], asks: book.asks || [] });
          }
          
          const fills = exchangeClient.client.getLiveFills(poolAddress);
          if (fills) {
            setTrades(fills);
          }
        }, 1000);
      } catch (err) {
        console.error("Failed to watch market:", err);
      }
    };
    setup();

    return () => {
      clearInterval(interval);
      unwatch();
    };
  }, [poolAddress]);

  return { orderbook, trades };
}
