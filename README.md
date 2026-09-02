<p align="center">
  <img src="reverie/public/reverie.png" alt="Reverie Logo" width="300" />
</p>

# Reverie — DreamDEX Trading Terminal

---

## 📖 About the Project

**Reverie** is a two-part project consisting of a **Visual Trading Terminal** and an **Automated Trading Bot**. Built on **DreamDEX** and the high-performance **Somnia Layer 1**, Reverie provides a comprehensive environment for engaging with prediction markets and binary event contracts.

### Features
- **Trading Terminal (Web UI):** A sleek, dark-themed web interface that displays real-time price action from Binance alongside live DreamDEX binary markets. This setup enables users to make informed "Up" or "Down" predictions effortlessly.
- **Trading Bot (CLI):** A powerful command-line tool that automates critical interactions on the Somnia testnet, including:
  - Faucet claims (tUSDC) for trading capital.
  - Discovering live binary prediction markets.
  - Placing IOC (Immediate-or-Cancel) taker orders.
  - Minting complete outcome sets for sell-side inventory.
  - Redeeming winning positions from finalized markets.

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

## 🎓 Tutorial: Using Reverie

Here is a step-by-step tutorial on how to use both the Visual Trading Terminal and the Automated Trading Bot.

### Part 1: Visual Trading Terminal (Web UI)

1. **Start the Development Server**
   Run the following command to start the Web UI locally:
   ```bash
   npm run dev
   ```
2. **Access the Terminal**
   Open your browser and navigate to `http://localhost:5173` (or the port specified in your terminal).
3. **Trade on Markets**
   - View real-time asset prices (e.g., BTC/USDT) powered by Binance WebSocket streams.
   - Browse active DreamDEX prediction markets on the right panel.
   - Click **Buy Up** or **Buy Down** to place your predictions based on the live chart data.

### Part 2: Automated Trading Bot (CLI)

The CLI bot provides a set of tasks to automate your trading strategies. Ensure your `.env` file is configured correctly before running these commands.

1. **Fund Your Wallet (Faucet)**
   Claim testnet tUSDC to use for trading (can be called repeatedly):
   ```bash
   node src/index.js --task dreamdex-faucet
   ```

2. **Discover Live Markets**
   View a list of all currently active binary prediction markets:
   ```bash
   node src/index.js --task dreamdex-markets
   ```

3. **Run the Trading Bot**
   Execute the automated IOC taker bot, which will analyze markets and place orders automatically based on the `DREAMDEX_TRADE_SIZE` set in your `.env`:
   ```bash
   node src/index.js --task dreamdex-trade
   ```

4. **Redeem Winning Positions**
   After markets have settled, redeem any winning outcomes back into tUSDC:
   ```bash
   node src/index.js --task dreamdex-redeem
   ```

5. **Mint Complete Sets**
   Provide liquidity by minting complete sets (1 tUSDC → 1 Up + 1 Down) to sell on the order book:
   ```bash
   node src/index.js --task dreamdex-mint
   ```

6. **Run the Full Lifecycle**
   Execute the faucet, trade, and redeem steps continuously in a single run:
   ```bash
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

## 🔗 Resources

| Resource | Link |
|---|---|
| DreamDEX Docs | https://docs.dreamdex.io/developers/event-contracts |
| Recipes / Examples | https://docs.dreamdex.io/developers/event-contracts/recipes |
| Gotchas | https://docs.dreamdex.io/developers/event-contracts/gotchas |
| DreamDEX Bot Kit | https://github.com/somnia-chain/dreamdex-bot-kit |
| Bot Builder UI | https://dreambot-builder.vercel.app/ |
| Somnia Explorer | https://shannon-explorer.somnia.network |
| Telegram Dev Community | https://t.me/+XHq0F0JXMyhmMzM0 |
| npm SDK | https://www.npmjs.com/package/@somnia-chain/markets-sdk |
