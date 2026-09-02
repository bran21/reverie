# Somnia × DreamDEX — Event Contracts Hackathon

> **Hackathon:** [Event Contracts Hackathon on DoraHacks](https://dorahacks.io/hackathon/event-contracts/detail)  
> **Organizer:** Somnia Network × DreamDEX  
> **Deadline:** September 8–9, 2026  
> **Prize Pool:** $5,000 USD (USDso)  
> **Network:** Somnia Testnet (Chain ID: `50312`)

---

## 📌 Overview

Build the next generation of prediction market experiences on **DreamDEX** — an event contracts platform running on the Somnia high-performance EVM-compatible Layer 1.

**What we're building:** **Reverie** is a two-part project consisting of a **Visual Trading Terminal** and an **Automated Trading Bot**:
- **Trading Terminal (Web UI):** Displays real-time price action from Binance side-by-side with live DreamDEX binary markets to help users make informed "Up" or "Down" predictions.
- **Trading Bot (CLI):** Automates interactions with the Somnia testnet, including:
  - Faucet claims (tUSDC)
  - Discovering live binary prediction markets
  - Placing IOC (Immediate-or-Cancel) taker orders
  - Minting complete sets for sell-side inventory
  - Redeeming winning positions from finalized markets

---

## 🏆 Judging Criteria

| Criteria | Weight |
|---|---|
| Technical Implementation | 25% |
| Innovation & Originality | 20% |
| User Experience & Design | 20% |
| Business & Ecosystem Impact | 20% |
| Presentation & Demo | 15% |

---

## 🔧 Tech Stack

| Component | Details |
|---|---|
| Web Framework | React, Vite |
| Charting | TradingView `lightweight-charts` |
| SDK | `@somnia-chain/markets-sdk` (v0.28.0+) |
| Runtime | Node.js + `viem` |
| Network | Somnia Testnet |
| RPC | `https://dream-rpc.somnia.network` |
| Collateral | tUSDC at `0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E` (6 decimals) |
| Explorer | https://shannon-explorer.somnia.network |

---

## 📁 Project Structure

```
reverie/
├── src/
│   ├── components/            # React UI Components
│   │   ├── Header.jsx         # Branding & asset selection
│   │   ├── PriceChart.jsx     # TradingView chart wrapper
│   │   ├── MarketPanel.jsx    # DreamDEX markets list
│   │   └── TradeCard.jsx      # Individual market card
│   ├── hooks/                 # React Hooks
│   │   ├── useBinanceStream.js   # Live price action WebSocket
│   │   └── useDreamDexMarkets.js # Derived market data
│   ├── bot/                   # Automated CLI Bot
│   │   ├── dreamdex/          # Config & SDK instantiation
│   │   ├── tasks/             # Bot automation scripts
│   │   └── index.js           # CLI entrypoint
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css              # Custom dark-theme styling
├── .env                       # Private keys & config (gitignored)
├── .env.example               # Template
├── index.html                 # Vite HTML entry
└── package.json
```

---

## ⚙️ Setup

### 1. Install dependencies

```bash
npm install @somnia-chain/markets-sdk viem tsx
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```env
# Wallet
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# DreamDEX / Somnia Network
SOMNIA_RPC_URL=https://dream-rpc.somnia.network
SOMNIA_WS_URL=wss://dream-rpc.somnia.network
SOMNIA_CHAIN_ID=50312
DREAMDEX_INDEXER_URL=https://markets-indexer.dreamdex.io

# Bot config
DREAMDEX_TRADE_SIZE=1
DREAMDEX_ENABLE_FAUCET=true
DREAMDEX_ENABLE_TRADE=true
DREAMDEX_ENABLE_REDEEM=true
```

> **Get testnet STT tokens:** Join [Telegram Dev Community](https://t.me/+XHq0F0JXMyhmMzM0)

---

## 🚀 Usage

```bash
# Claim testnet tUSDC (up to 10,000 per call)
node src/index.js --task dreamdex-faucet

# List all live binary prediction markets
node src/index.js --task dreamdex-markets

# Run IOC taker trading bot
node src/index.js --task dreamdex-trade

# Redeem winning positions from settled markets
node src/index.js --task dreamdex-redeem

# Mint complete sets (1 tUSDC → 1 Up + 1 Down)
node src/index.js --task dreamdex-mint

# Run full cycle: faucet → trade → redeem
node src/index.js --task dreamdex
```

---

## 🔑 Core SDK Concepts

### SDK Initialization

```js
import { SomniaMarkets } from "@somnia-chain/markets-sdk";

const exchange = new SomniaMarkets({
  rpcUrl: process.env.SOMNIA_RPC_URL,
  privateKey: process.env.PRIVATE_KEY,
  indexerUrl: process.env.DREAMDEX_INDEXER_URL,
});
await exchange.loadMarkets();
```

### Three API Tiers

| Tier | Access | Use For |
|---|---|---|
| Unified | `exchange.*` | Trading by symbol in human units |
| Client (reads) | `exchange.client.*` | On-chain truth: market status, balances |
| Trader (writes) | `exchange.trader.*` | Redeem, mint, faucet |

### Key Operations

```js
// Discover live markets
const markets = await exchange.listLiveBinaryMarkets({ limit: 50 });

// Read order book
const book = await exchange.fetchOrderBook(symbol, 5);

// Place IOC order (buy Up @ market)
const result = await exchange.createOrder(symbol, "market", "buy", qty, null, {
  timeInForce: "ioc",
});

// Mint complete sets (1 tUSDC → 1 Up + 1 Down)
await exchange.mintSet(symbol, 10); // 10 tUSDC

// Redeem winning position
await exchange.trader.redeem({ market, outcome });

// Claim faucet
await exchange.trader.faucet();
```

> **Gotcha:** Use SDK v0.28.0+. Below v0.23.0 `loadMarkets()` fails; below v0.28.0 float prices are rejected by the pool.

---

## 📋 Contract Addresses (Somnia Testnet / Mainnet)

| Contract | Address |
|---|---|
| BinaryMarketsModule | `0x3ecC694Cef705358864a646142ac17A90E29e388` |
| MarketsCore | `0x2802504314685D89bF6C992CA5a8e7cC78bc0294` |
| tUSDC (Collateral) | `0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E` |

---

## 🗓️ Timeline

| Date | Event |
|---|---|
| August 18, 2026 | Pre-registration opens |
| August 25, 2026 | Submission window opens |
| **September 8–9, 2026** | **Submission deadline** |

---

## 📦 Deliverables Checklist

- [ ] Working prototype on Somnia Testnet
- [ ] Public GitHub repository link
- [ ] 2–3 minute demo video
- [ ] (Optional) Presentation deck
- [ ] (Optional) SDK feedback report

---

## 🔗 Resources

| Resource | Link |
|---|---|
| Hackathon Page | https://dorahacks.io/hackathon/event-contracts/detail |
| DreamDEX Docs | https://docs.dreamdex.io/developers/event-contracts |
| Recipes / Examples | https://docs.dreamdex.io/developers/event-contracts/recipes |
| Gotchas | https://docs.dreamdex.io/developers/event-contracts/gotchas |
| DreamDEX Bot Kit | https://github.com/somnia-chain/dreamdex-bot-kit |
| Bot Builder UI | https://dreambot-builder.vercel.app/ |
| Somnia Explorer | https://shannon-explorer.somnia.network |
| Telegram Dev Community | https://t.me/+XHq0F0JXMyhmMzM0 |
| npm SDK | https://www.npmjs.com/package/@somnia-chain/markets-sdk |
