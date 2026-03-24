---
title: Portfolio & Users
description: Query your balance, positions, trade history, and profile
sidebar_position: 6
---

# Portfolio & Users

All endpoints require a JWT in the `Authorization: Bearer` header.

## Get Your Profile

```bash
GET /v1/users/me
```

```bash
curl https://api.settled.pro/v1/users/me \
  -H "Authorization: Bearer <jwt>"
```

```json
{
  "data": {
    "id": "87299673-...",
    "wallet_address": "Dc5tRex7r3EYi7HVNNjr3FkfhytDksWFtT1CLjgVYCSU",
    "display_name": null,
    "created_at": "2026-03-17T08:00:00Z",
    "last_active_at": "2026-03-18T09:15:00Z"
  }
}
```

## Get Public User Profile

```bash
GET /v1/users/{id}/profile
```

Public endpoint. Returns display name and stats for any user by their ID.

```bash
curl https://api.settled.pro/v1/users/87299673-.../profile
```

```json
{
  "data": {
    "id": "87299673-...",
    "display_name": "beachboy4",
    "wallet_address": "Dc5tRex7r3EYi7HVNNjr3FkfhytDksWFtT1CLjgVYCSU",
    "total_trades": 612,
    "total_volume": "9837.945000",
    "win_rate": "0.72",
    "member_since": "2026-01-15T00:00:00Z"
  }
}
```

## Balance

Your USDC balance is read directly from your Solana wallet on-chain. There is no backend balance endpoint — use your wallet adapter or `getTokenAccountBalance` on the USDC associated token account.

## Get Your Positions

```bash
GET /v1/users/me/positions
```

Returns all open positions across active markets.

```bash
curl https://api.settled.pro/v1/users/me/positions \
  -H "Authorization: Bearer <jwt>"
```

```json
{
  "data": [
    {
      "market_id": "8166597e-...",
      "symbol": "LYNUSDT",
      "exchange": "binance",
      "side": "yes",
      "shares": "13.698630",
      "avg_price": "0.730000",
      "current_price": "0.742000",
      "unrealized_pnl": "0.164384",
      "settlement_ts": "2026-03-18T01:00:00Z"
    }
  ]
}
```

## Get Your Activity History

```bash
GET /v1/users/me/history
```

Returns a merged feed of trades, deposits, and withdrawals in reverse chronological order.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | 20 | Max results per page (max 100) |

```bash
curl "https://api.settled.pro/v1/users/me/history?limit=20" \
  -H "Authorization: Bearer <jwt>"
```

```json
{
  "data": [
    {
      "type": "trade",
      "id": "a1b2c3d4-...",
      "market_id": "8166597e-...",
      "side": "yes",
      "shares": "13.698630",
      "cost_usdc": "10.000000",
      "fee_usdc": "0.100000",
      "created_at": "2026-03-18T09:15:32Z"
    },
    {
      "type": "deposit",
      "id": "dep_x1y2z3-...",
      "amount": "100.000000",
      "status": "confirmed",
      "created_at": "2026-03-17T08:00:00Z"
    },
    {
      "type": "withdrawal",
      "id": "w1x2y3z4-...",
      "amount": "50.000000",
      "status": "confirmed",
      "destination": "Dc5tRex7...",
      "created_at": "2026-03-16T12:00:00Z"
    }
  ]
}
```

The `type` field distinguishes event kinds: `trade`, `deposit`, `withdrawal`.
