# DreamDEX Event Contracts Hackathon - BUIDL Analysis

I have analyzed the submitted projects (BUIDLs) for the Somnia × DreamDEX Event Contracts Hackathon on DoraHacks. There are currently **13 projects** submitted. 

Here is a breakdown of the projects and the types of applications being built:

## 📊 Application Category Breakdown

The submissions can be broadly categorized into five main areas:

### 1. AI Agents & Safety / Guardrails (5 Projects)
This is the most popular category, focusing on using AI for trading, risk assessment, and market safety.
*   **Dreamdesk:** Makes autonomous AI trading auditable using an LLM council, risk gates, and hash chains on Somnia.
*   **Vitamin M:** Runs live Event Contracts through dual AI agents (audit + adversarial probe) to provide instant safety ratings (GREEN/YELLOW/RED).
*   **Rivo Intelligence:** Validates and proves the economic edge of autonomous AI trading agents through shadow testing.
*   **LevelField:** Scores the structural insider risk of event contracts deterministically from text, queryable by agents over MCP.
*   **QDS:** An AI-powered platform for predicting, analyzing, and trading on-chain Event Markets.

### 2. Quantitative Pricing, Derivative Chaining & Execution Logic (5 Projects)
These projects focus on advanced trading strategies, complex order types, and mathematical pricing models.
*   **Sigma:** Computes fair-value on-chain using closed-form Black-Scholes pricing to publish fair probability, edge, and Kelly fraction.
*   **Runs:** Chains single-window event contracts into continuous/multi-window instruments for one-click multi-order execution.
*   **Branch:** Enables conditional path execution where subsequent contract legs are signed only after the prior leg settles as predicted.
*   **Let It Ride:** Automatically rolls over winning positions within predefined user guardrails (cash-out, stop-loss).
*   **SLUICE MARKETS:** A risk policy engine that converts a user's maximum acceptable loss into the largest valid order supported by the live market.

### 3. Market Liquidity & Verification (1 Project)
*   **Rampart:** A verifiable order-book depth mechanism that locks resting quotes in the protocol to prove liquidity quality.

### 4. Consumer Apps & Regional Onboarding (1 Project)
*   **PredictNaija:** A consumer-first prediction market app designed for Nigerians to bet on football, reality TV, and FX rates without the complexities of crypto.

### 5. Gamification & GameFi (1 Project)
*   **Market Dungeon:** A fantasy roguelite game that uses DreamDEX Event Contracts as boss survival mechanics verified on-chain.

---

## 💡 Key Takeaways & Opportunities

Based on this analysis, here are some insights for our own project:

*   **High Competition in AI & Advanced Trading:** Many teams are building sophisticated AI agents and complex trading logic (like Black-Scholes pricing or conditional routing). Our automated trading bot (the `aura-auto-agent` module) falls into this competitive space.
*   **Focus on Verification & Auditability:** Several top projects emphasize proving their logic on-chain (e.g., Rampart, Dreamdesk, Rivo Intelligence). 
*   **Potential Gaps:** 
    *   **Social/Community Tools:** There are very few tools focused purely on community sentiment or social prediction, besides the localized PredictNaija.
    *   **Market Making/Liquidity Provision:** While Rampart verifies liquidity, there seem to be fewer pure automated market maker (AMM) bots specifically designed to provide liquidity to empty order books on DreamDEX. Our bot currently acts as a taker; adding market-making capabilities could be a differentiator.

This analysis shows a strong field of highly technical submissions focusing on AI, advanced financial engineering, and on-chain verification.
