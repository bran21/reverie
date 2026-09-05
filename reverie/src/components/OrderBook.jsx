import React, { useMemo } from 'react';
import { useLiveMarket } from '../hooks/useLiveMarket.js';

export default function OrderBook({ market }) {
  const { orderbook } = useLiveMarket(market?.pool);

  // Map real orderbook data from SDK or use fallback logic
  const { asks, bids, spread } = useMemo(() => {
    const basePrice = market ? (market.upProb || 0.50) : 0.50;
    // Map real SDK orderbook if it exists, otherwise fall back to synthetic
    if (orderbook.bids.length > 0 || orderbook.asks.length > 0) {
      let askTotal = 0;
      let bidTotal = 0;
      
      const realAsks = [...orderbook.asks].sort((a, b) => Number(a.price) - Number(b.price)).map(ask => {
        const sizeStr = (Number(ask.quantity) / 1e6).toFixed(0);
        askTotal += Number(sizeStr);
        return {
          price: (Number(ask.price) / 1e6).toFixed(2),
          size: sizeStr,
          total: askTotal.toString()
        };
      }).slice(0, 20).reverse(); // highest price at top

      const realBids = [...orderbook.bids].sort((a, b) => Number(b.price) - Number(a.price)).map(bid => {
        const sizeStr = (Number(bid.quantity) / 1e6).toFixed(0);
        bidTotal += Number(sizeStr);
        return {
          price: (Number(bid.price) / 1e6).toFixed(2),
          size: sizeStr,
          total: bidTotal.toString()
        };
      }).slice(0, 20);

      const lowestAsk = realAsks.length > 0 ? parseFloat(realAsks[realAsks.length - 1].price) : basePrice + 0.01;
      const highestBid = realBids.length > 0 ? parseFloat(realBids[0].price) : basePrice - 0.01;
      const calculatedSpread = Math.max(0.01, lowestAsk - highestBid).toFixed(2);

      return { asks: realAsks, bids: realBids, spread: calculatedSpread };
    }

    // Fallback: Generate synthetic asks and bids if no real data
    const generatedAsks = [];
    const generatedBids = [];
    
    let askTotal = 0;
    let bidTotal = 0;
    
    for (let i = 1; i <= 20; i++) {
      const price = basePrice + (i * 0.01);
      if (price > 0.99) break;
      const size = Number((Math.random() * 200 + 10).toFixed(0));
      askTotal += size;
      generatedAsks.push({
        price: price.toFixed(2),
        size: size.toString(),
        total: askTotal.toString()
      });
    }
    
    for (let i = 1; i <= 20; i++) {
      const price = basePrice - (i * 0.01);
      if (price < 0.01) break;
      const size = Number((Math.random() * 300 + 50).toFixed(0));
      bidTotal += size;
      generatedBids.push({
        price: price.toFixed(2),
        size: size.toString(),
        total: bidTotal.toString()
      });
    }

    const lowestAsk = generatedAsks.length > 0 ? parseFloat(generatedAsks[0].price) : basePrice + 0.01;
    const highestBid = generatedBids.length > 0 ? parseFloat(generatedBids[0].price) : basePrice - 0.01;
    const calculatedSpread = Math.max(0.01, lowestAsk - highestBid).toFixed(2);

    return {
      asks: generatedAsks.reverse(),
      bids: generatedBids,
      spread: calculatedSpread
    };
  }, [market, orderbook]);

  const displayPrice = market ? (market.upProb || 0.50) : 0.50;

  return (
    <>
      <style>{`
        .orderbook-row {
          display: flex;
          justifyContent: space-between;
          padding: 2px 12px;
          position: relative;
          cursor: pointer;
          transition: background 0.1s;
        }
        .orderbook-row:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .glow-text {
          text-shadow: 0 0 10px currentColor;
        }
        .pulse-spread {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 0.8; }
          50% { opacity: 1; }
          100% { opacity: 0.8; }
        }
      `}</style>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-panel)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px',
          borderBottom: '1px solid var(--border-light)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          fontSize: '0.75rem'
        }}>
          <span style={{ color: 'var(--color-accent)' }}>Order Book (UP)</span>
          <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='var(--text-primary)'} onMouseOut={e => e.target.style.color='var(--text-muted)'}>▤</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s', color: 'var(--color-down)' }} className="glow-text">▼</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s', color: 'var(--color-up)' }} className="glow-text">▲</span>
            <span style={{ cursor: 'pointer' }}>0.01</span>
          </div>
        </div>

        {/* Column Headers */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 12px',
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border-light)',
          fontSize: '0.65rem',
          textTransform: 'uppercase'
        }}>
          <div style={{ flex: 1 }}>Price ($)</div>
          <div style={{ flex: 1, textAlign: 'right' }}>Size</div>
          <div style={{ flex: 1, textAlign: 'right' }}>Total</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Asks (Red) */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0', flex: 1, justifyContent: 'flex-end' }}>
            {asks.map((ask, i) => (
              <div key={`ask-${i}`} className="orderbook-row">
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.min(100, (Number(ask.total) / 1000) * 100)}%`,
                  background: 'linear-gradient(270deg, rgba(239, 68, 68, 0.15) 0%, transparent 100%)',
                  zIndex: 0
                }} />
                <div style={{ flex: 1, color: 'var(--color-down)', zIndex: 1, fontWeight: 500 }}>{ask.price}</div>
                <div style={{ flex: 1, textAlign: 'right', color: 'var(--text-primary)', zIndex: 1 }}>{ask.size}</div>
                <div style={{ flex: 1, textAlign: 'right', color: 'var(--text-muted)', zIndex: 1 }}>{ask.total}</div>
              </div>
            ))}
          </div>

          {/* Current Price / Spread Indicator */}
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid rgba(239, 68, 68, 0.2)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
          }} className="pulse-spread">
            <div style={{ 
              color: 'var(--color-up)', 
              fontSize: '1.1rem', 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }} className="glow-text">
              ${displayPrice.toFixed(2)}
              <span style={{ fontSize: '0.8rem' }}>↑</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Spread {spread}
            </div>
          </div>

          {/* Bids (Green) */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0', flex: 1 }}>
            {bids.map((bid, i) => (
              <div key={`bid-${i}`} className="orderbook-row">
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.min(100, (Number(bid.total) / 1000) * 100)}%`,
                  background: 'linear-gradient(270deg, rgba(16, 185, 129, 0.15) 0%, transparent 100%)',
                  zIndex: 0
                }} />
                <div style={{ flex: 1, color: 'var(--color-up)', zIndex: 1, fontWeight: 500 }}>{bid.price}</div>
                <div style={{ flex: 1, textAlign: 'right', color: 'var(--text-primary)', zIndex: 1 }}>{bid.size}</div>
                <div style={{ flex: 1, textAlign: 'right', color: 'var(--text-muted)', zIndex: 1 }}>{bid.total}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
