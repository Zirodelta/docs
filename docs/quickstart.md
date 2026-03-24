---
title: Quickstart
description: Place your first trade in under 5 minutes
sidebar_position: 3
---

# Quickstart

This guide walks through placing your first trade. Trades on Settled execute on Solana — the backend co-signs market initialization and an on-chain indexer automatically syncs confirmed trades.

**What you'll need:** A Solana wallet and either test USDC from the faucet or real USDC.

## 1. Authenticate

Follow the [Authentication](/authentication) guide to get a JWT via Sign-In With Solana (SIWS).

## 2. Get test USDC (testnet only)

Claim $1,000 in test USDC from the faucet:

```bash
curl -X POST https://api.settled.pro/v1/faucet/claim \
  -H "Authorization: Bearer <jwt>" \
  -H "X-Request-Nonce: a3f8b2c1d4e5f69702ab3c4d5e6f7081" \
  -H "X-Request-Timestamp: 1742298600"
```

```json
{
  "data": {
    "amount": "1000.000000",
    "new_balance": "1000.000000"
  }
}
```

## 3. Find an open market

List open markets:

```bash
curl https://api.settled.pro/v1/markets?status=open&limit=5
```

Or browse series to find a symbol you want to trade:

```bash
curl https://api.settled.pro/v1/series?limit=5
```

Pick a market with `status: "open"`. Note the `id` — you'll use it throughout.

## 4. Get a price quote

Before trading, fetch the exact cost and price impact:

```bash
curl "https://api.settled.pro/v1/markets/MARKET_ID/quote?side=yes&amount=10"
```

```json
{
  "data": {
    "side": "yes",
    "usdc_amount": "10.00",
    "shares": "13.698630",
    "avg_price": "0.730000",
    "price_after": "0.742000",
    "price_impact": "0.012000"
  }
}
```

This tells you exactly what you'd get before committing. For small trades, price impact is minimal.

## 5. Ensure the market is on-chain

Markets are lazily initialized on Solana. Before your first trade:

```bash
curl https://api.settled.pro/v1/markets/MARKET_ID/ensure-onchain \
  -H "Authorization: Bearer <jwt>"
```

If `status` is `ready`, you're good to go. If it returns `needs_cosign`, follow the [On-Chain Integration](/api-reference/onchain) guide to co-sign the `create_market` transaction first.

## 6. Build, sign, and submit the trade transaction

Construct a Solana transaction calling `buy_shares` on the Settled program with your wallet, then submit it to the Solana RPC. For a full TypeScript example, see the [On-Chain Integration](/api-reference/onchain#full-trade-flow-typescript) page.

## 7. Done — trade syncs automatically

Once your transaction confirms on Solana, the on-chain indexer detects it and syncs your trade to Postgres within seconds. No additional API call needed.

You now hold 13.7 YES shares. If the funding rate is positive at settlement, each share pays $1. Your payout: $13.70. Your profit: $3.60 (after the $0.10 fee).

## 8. Check your position

```bash
curl https://api.settled.pro/v1/users/me/positions \
  -H "Authorization: Bearer <jwt>"
```

## 9. Wait for settlement

The market auto-resolves at the scheduled settlement time. The oracle fetches the actual funding rate from the exchange and pays winners automatically. Your USDC balance updates without any claim action needed.

```bash
curl https://api.settled.pro/v1/markets/MARKET_ID
```

## Subscribe to real-time updates

Connect via WebSocket to get live price updates and settlement notifications:

```javascript
const ws = new WebSocket('wss://api.settled.pro/ws')
ws.onopen = () => ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'market:MARKET_ID'
}))
ws.onmessage = e => console.log(JSON.parse(e.data))
```

[Full On-Chain Integration Guide — Complete TypeScript walkthrough of the on-chain trade flow](/api-reference/onchain)

[Build a Trading Bot — Automate your strategy with the full API](/guides/building-a-bot)
