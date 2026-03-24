---
title: Trading
description: Place on-chain trades against the LMSR automated market maker
sidebar_position: 4
---

# Trading

Trades on Settled execute on Solana via the program's `buy_shares` and `sell_shares` instructions. The backend co-signs market creation transactions. An on-chain indexer automatically syncs confirmed trades to Postgres — no manual confirmation step is needed.

All authenticated write endpoints require anti-replay headers (see below).

## Anti-Replay Headers

Every authenticated **write** endpoint (`POST`, `PUT`, `DELETE`) requires two additional headers:

| Header | Format | Notes |
|---|---|---|
| `X-Request-Nonce` | 32–64 hex chars or UUID | Unique per request; reuse rejected |
| `X-Request-Timestamp` | Unix timestamp (seconds) | Must be within ±5 min of server time |

```bash
X-Request-Nonce: a3f8b2c1d4e5f69702ab3c4d5e6f7081
X-Request-Timestamp: 1742298600
```

Generate a nonce in TypeScript:
```typescript
const nonce = crypto.randomUUID().replace(/-/g, '')
const timestamp = Math.floor(Date.now() / 1000).toString()
```

## On-Chain Trade Flow

The current trade flow uses Solana directly. The old `POST /v1/markets/{id}/trade` endpoint is deprecated and should not be used.

### Step 1: Ensure the market is on-chain

Before trading, lazily initialize the market's Program Derived Address (PDA) if it hasn't been created yet.

```bash
GET /v1/markets/{id}/ensure-onchain
```

```bash
curl -H "Authorization: Bearer <jwt>" \
  https://api.settled.pro/v1/markets/8166597e-.../ensure-onchain
```

**Response:**

```json
{
  "data": {
    "market_id": "8166597e-...",
    "pda": "FxMb3z7qHvTkLpWgNe4r...",
    "status": "ready"
  }
}
```

If the PDA doesn't exist yet, the backend creates the `create_market` transaction and co-signs it.

### Step 2: Get a quote

Fetch the exact cost and price impact before constructing your transaction:

```bash
curl "https://api.settled.pro/v1/markets/8166597e-.../quote?side=yes&amount=10"
```

See [Get Buy Quote](/api-reference/markets#get-buy-quote) for the full response shape.

### Step 3: Build and sign the transaction

Construct a Solana transaction calling the `buy_shares` instruction on the Settled program, then sign it with your wallet.

### Step 4: Co-sign the transaction (if required)

For `create_market` transactions, the backend must co-sign:

```bash
POST /v1/markets/{id}/co-sign
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `transaction` | string | Yes | Base64-encoded partially-signed Solana transaction |

```bash
curl -X POST https://api.settled.pro/v1/markets/8166597e-.../co-sign \
  -H "Authorization: Bearer <jwt>" \
  -H "X-Request-Nonce: a3f8b2c1d4e5f69702ab3c4d5e6f7081" \
  -H "X-Request-Timestamp: 1742298600" \
  -H "Content-Type: application/json" \
  -d '{"transaction": "<base64_tx>"}'
```

**Response:**

```json
{
  "data": {
    "transaction": "<base64_cosigned_tx>"
  }
}
```

Submit the returned transaction to the Solana RPC.

### Step 5: Done

Once your transaction confirms on Solana, the on-chain indexer automatically detects it and syncs the trade to Postgres (positions, trade history, leaderboard). No manual confirmation call is needed.

## How LMSR Pricing Works

There is no orderbook. You trade directly against the Logarithmic Market Scoring Rule (LMSR) automated market maker.

Every trade shifts the price. Buying 100 YES shares when YES is at 73 cents moves the price to approximately 76 cents. The more shares on one side, the more expensive that side becomes.

Always call the [quote endpoint](/api-reference/markets#get-buy-quote) before large orders to understand price impact.

## Trading Fee

1% of `usdc_amount` is charged as a fee on every trade. The fee is deducted from your balance separately and shown in `fee_usdc`.

## Selling Positions

To exit a position early, use the `sell_shares` Solana instruction with the same on-chain flow. First get a [sell quote](/api-reference/markets#get-sell-quote) to preview proceeds, then build, sign, and submit the transaction to Solana. The indexer syncs it automatically.

## Deprecated Endpoints

:::warning
The following endpoints are deprecated and will be removed. Do not use them in new integrations.

- `POST /v1/markets/{id}/trade` — old Postgres-only trade
- `POST /v1/markets/{id}/sell` — old Postgres-only sell

The frontend no longer calls these. Use the on-chain flow described above.
:::

## Errors

| Code | When |
|---|---|
| `MARKET_CLOSED` | Market is not `open` |
| `INSUFFICIENT_BALANCE` | Not enough USDC |
| `INVALID_INPUT` | Bad side or amount |
| `REPLAY_DETECTED` | Nonce already used or timestamp out of window |
| `PDA_NOT_FOUND` | Call `ensure-onchain` first |
