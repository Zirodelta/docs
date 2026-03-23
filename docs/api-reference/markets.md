---
title: Markets
description: Query individual markets (rounds) by status, ID, or trades
sidebar_position: 3
---

# Markets

Each market is a single binary question tied to one settlement event. Markets are rounds within a series.

## List Markets

```bash
GET /v1/markets
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `status` | string | — | Filter by status: `open`, `closed`, `settled`, `pending`, `voided` |
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Max results (max 100) |

```bash
curl https://api.settled.pro/v1/markets?status=open&limit=20
```

**Response:**

```json
{
  "data": [
    {
      "id": "8166597e-...",
      "symbol": "WILDUSDT",
      "exchange": "kucoin",
      "question": "Will WILDUSDT funding rate on kucoin at 2026-03-18 04:00 UTC be POSITIVE?",
      "settlement_ts": "2026-03-18T04:00:00Z",
      "open_ts": "2026-03-18T03:00:00Z",
      "close_ts": "2026-03-18T03:55:00Z",
      "status": "pending",
      "tier": 3,
      "yes_price": "0.489000",
      "no_price": "0.511000",
      "total_volume": "0.000000",
      "trade_count": 0,
      "ou_prior": "0.4890",
      "ou_confidence": "0.7244"
    }
  ]
}
```

### Market Status Lifecycle

```
pending → open → closed → resolving → settled
                                    → voided
```

- **pending** — created by scheduler, not yet tradeable
- **open** — trading is live
- **closed** — trading stops 5 min before settlement
- **resolving** — oracle is fetching rates
- **settled** — outcome confirmed, winners paid
- **voided** — insufficient data, all positions refunded

## Get Market

```bash
GET /v1/markets/{id}
```

Returns the same shape as a single item from List Markets, plus resolution fields when settled:

```json
{
  "data": {
    "id": "8166597e-...",
    "outcome": "yes",
    "actual_rate": "0.00041339",
    "settled_at": "2026-03-17T16:00:17Z"
  }
}
```

## Get Market Trades

```bash
GET /v1/markets/{id}/trades
```

Returns recent trades for a specific market.

```json
{
  "data": [
    {
      "trade_id": "f1a2b3c4-...",
      "side": "yes",
      "shares": "13.698630",
      "price_usdc": "0.730000",
      "fee_usdc": "0.100000",
      "created_at": "2026-03-18T09:15:32Z"
    }
  ]
}
```

## Get Market Orderbook

```bash
GET /v1/markets/{id}/orderbook
```

Returns the current orderbook snapshot for the market.

```json
{
  "data": {
    "market_id": "8166597e-...",
    "yes_price": "0.730000",
    "no_price": "0.270000",
    "bids": [],
    "asks": []
  }
}
```

## Get Buy Quote

Returns the exact LMSR cost and price impact **before** placing a trade. The frontend calls this before every trade to show the user exactly what they'll pay.

```bash
GET /v1/markets/{id}/quote?side=yes&amount=100
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `side` | string | Yes | `yes` or `no` |
| `amount` | number | Yes | USDC amount you want to spend |

```bash
curl "https://api.settled.pro/v1/markets/8166597e-.../quote?side=yes&amount=100"
```

**Response:**

```json
{
  "data": {
    "side": "yes",
    "usdc_amount": "100.00",
    "shares": "128.205128",
    "avg_price": "0.780000",
    "price_after": "0.812000",
    "price_impact": "0.032000"
  }
}
```

| Field | Description |
|---|---|
| `shares` | Number of shares you'd receive |
| `avg_price` | Average price per share for this order |
| `price_after` | YES price after this trade executes |
| `price_impact` | How much this order moves the price |

Always fetch a quote before large trades to understand slippage. The `price_impact` field tells you how much your order moves the market.

## Get Sell Quote

Returns the expected USDC proceeds **before** selling shares.

```bash
GET /v1/markets/{id}/sell-quote?side=yes&shares=50
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `side` | string | Yes | `yes` or `no` — which side you're selling |
| `shares` | number | Yes | Number of shares you want to sell |

```bash
curl "https://api.settled.pro/v1/markets/8166597e-.../sell-quote?side=yes&shares=50"
```

**Response:**

```json
{
  "data": {
    "side": "yes",
    "shares": "50.000000",
    "usdc_proceeds": "36.500000",
    "avg_price": "0.730000",
    "price_after": "0.698000",
    "price_impact": "0.032000"
  }
}
```
