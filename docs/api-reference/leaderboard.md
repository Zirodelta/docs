---
title: Leaderboard
description: Top traders ranked by real PnL, win rate, and open exposure
sidebar_position: 8
---

# Leaderboard

Public endpoint. No authentication required.

Leaderboard data is calculated from real Postgres trade history — not estimated. Timeframe filters apply to the actual PnL window.

## Get Leaderboard

```bash
GET /v1/leaderboard
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `period` | string | `all` | Time period: `24h`, `7d`, `30d`, `all` |
| `limit` | integer | 20 | Max results (max 100) |

```bash
curl "https://api.settled.pro/v1/leaderboard?period=7d&limit=10"
```

**Response:**

```json
{
  "data": [
    {
      "rank": 1,
      "wallet_address": "HorizonSplendidView...",
      "display_name": "HorizonSplendidView",
      "total_pnl": "4016.108000",
      "win_rate": "0.78",
      "total_trades": 847,
      "total_volume": "12394.130000",
      "open_exposure": "340.500000"
    },
    {
      "rank": 2,
      "wallet_address": "beachboy4...",
      "display_name": "beachboy4",
      "total_pnl": "2951.079000",
      "win_rate": "0.72",
      "total_trades": 612,
      "total_volume": "9837.945000",
      "open_exposure": "120.000000"
    }
  ]
}
```

| Field | Description |
|---|---|
| `total_pnl` | Realized PnL over the selected period (in USDC) |
| `win_rate` | Fraction of trades that ended profitably (0–1) |
| `open_exposure` | Current value locked in open positions |
