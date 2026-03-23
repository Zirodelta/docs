---
title: LMSR Market Maker
description: Logarithmic Market Scoring Rule — the automated market maker behind Settled's pricing
sidebar_position: 2
---

# LMSR Market Maker

Settled uses the **Logarithmic Market Scoring Rule (LMSR)** as its automated market maker. There is no order book — prices are computed mathematically based on the current share quantities in the market.

## How LMSR Works

LMSR is a cost-function-based AMM designed for prediction markets. It was introduced by Robin Hanson and has strong theoretical properties: bounded loss for the market maker, continuous pricing, and guaranteed liquidity at all price levels.

### The Cost Function

The total cost of all shares in the market is:

```
C(q_yes, q_no) = b · ln(e^(q_yes/b) + e^(q_no/b))
```

Where:
- `q_yes` — total YES shares outstanding
- `q_no` — total NO shares outstanding
- `b` — the **liquidity parameter** (controls price sensitivity)

### Price Functions

The current price of a YES share is:

```
p_yes = e^(q_yes/b) / (e^(q_yes/b) + e^(q_no/b))
```

And symmetrically for NO:

```
p_no = e^(q_no/b) / (e^(q_yes/b) + e^(q_no/b))
```

Prices always satisfy `p_yes + p_no = 1`.

### Cost to Buy Shares

The cost to buy `Δq` additional YES shares is the difference in the cost function:

```
cost = C(q_yes + Δq, q_no) - C(q_yes, q_no)
```

This means buying shares gets progressively more expensive as the price moves toward 1 — providing natural slippage protection.

## The Liquidity Parameter (b)

The parameter `b` controls how sensitive the price is to trades:

| b value | Effect |
|---------|--------|
| **Small b** | Prices move quickly with small trades. Higher slippage. |
| **Large b** | Prices move slowly. Lower slippage but requires more capital. |

The maximum possible loss for the market maker is bounded by `b · ln(2)` — this is the worst case where all shares end up on one side.

Settled sets `b` per market based on the expected volume tier. Higher-volume pairs (BTC, ETH) get a larger `b` for tighter spreads.

## OU Model Prior

Each market starts with an initial price derived from the **Ornstein-Uhlenbeck (OU) model** — a mean-reverting stochastic process fitted to historical funding rate data.

The OU prior represents the probability that the funding rate will be positive at settlement time, based on:
- Current funding rate
- Historical mean reversion speed
- Volatility of the funding rate for that exchange/symbol pair

This prior is used as the initial `q_yes / q_no` ratio when the market opens, so the starting price reflects the statistically expected outcome rather than a naive 50/50.

The OU confidence score (0–1) indicates how reliable the prior is. Higher confidence means more historical data and a better-fit model.

## On-Chain Implementation

The LMSR math runs entirely on-chain using **fixed-point i64 arithmetic** (6 decimal places, matching USDC). The Solana program computes:

1. Current prices from share quantities
2. Cost for a given trade size
3. New share quantities after a trade
4. Fee deduction

No floating-point operations. All math uses integer multiplication and division with overflow checks (`checked_mul`, `checked_div`).

### Price Impact

Before placing a trade, you can query the price impact via the API:

```bash
GET /v1/markets/{id}/quote?side=yes&amount=100
```

Response includes:
- `shares` — number of shares you'd receive
- `avg_price` — average price per share
- `price_after` — YES price after the trade
- `price_impact` — how much your order moves the price

Always check the quote before large trades to understand slippage.

## Properties

| Property | Value |
|----------|-------|
| **Liquidity** | Guaranteed at all price levels — no empty order book |
| **Price range** | (0, 1) — approaches but never reaches 0 or 1 |
| **Bounded loss** | Maximum market maker loss = `b · ln(2)` |
| **Path independence** | Final cost depends only on final quantities, not order of trades |
| **Arbitrage-free** | YES + NO prices always sum to 1 |
