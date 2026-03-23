---
title: Crowd Positioning
description: Market-wide and per-symbol crowd positioning data from derivatives exchanges
sidebar_position: 10
---

# Crowd Positioning

The Crowd API exposes aggregate long/short positioning data from perpetuals exchanges. Use it to understand whether traders are net long or short on any given symbol — and where the crowd is most exposed.

All endpoints are public. No authentication required.

## Crowd Leaderboard

```bash
GET /v1/crowd/leaderboard
```

Returns symbols ranked by crowd positioning (most shorted or most longed).

| Parameter | Type | Default | Description |
|---|---|---|---|
| `sort` | string | `most_shorted` | Sort by: `most_shorted` or `most_longed` |
| `exchange` | string | — | Filter by exchange (e.g. `binance`, `bybit`) |
| `limit` | integer | 30 | Max results per page |
| `page` | integer | 0 | Page number (0-indexed) |
| `search` | string | — | Filter by symbol substring (e.g. `BTC`) |

```bash
curl "https://api.settled.pro/v1/crowd/leaderboard?sort=most_shorted&exchange=binance&limit=10"
```

**Response:**

```json
{
  "data": [
    {
      "rank": 1,
      "exchange": "binance",
      "symbol": "PEPEUSDT",
      "long_pct": "0.28",
      "short_pct": "0.72",
      "net_position": "-0.44",
      "updated_at": "2026-03-18T09:00:00Z"
    },
    {
      "rank": 2,
      "exchange": "binance",
      "symbol": "DOGEUSDT",
      "long_pct": "0.31",
      "short_pct": "0.69",
      "net_position": "-0.38",
      "updated_at": "2026-03-18T09:00:00Z"
    }
  ],
  "meta": {
    "page": 0,
    "limit": 10,
    "total": 312
  }
}
```

| Field | Description |
|---|---|
| `long_pct` | Fraction of open interest that is long (0–1) |
| `short_pct` | Fraction of open interest that is short (0–1) |
| `net_position` | `long_pct - short_pct` — positive means net long, negative means net short |

## Market-Wide Summary

```bash
GET /v1/crowd/summary
```

Returns aggregated crowd positioning across the entire market.

```bash
curl https://api.settled.pro/v1/crowd/summary
```

```json
{
  "data": {
    "total_symbols_tracked": 312,
    "avg_long_pct": "0.48",
    "avg_short_pct": "0.52",
    "most_longed": {
      "exchange": "binance",
      "symbol": "BTCUSDT",
      "long_pct": "0.68"
    },
    "most_shorted": {
      "exchange": "binance",
      "symbol": "PEPEUSDT",
      "short_pct": "0.72"
    },
    "updated_at": "2026-03-18T09:00:00Z"
  }
}
```

## Per-Symbol Positioning

```bash
GET /v1/crowd/{exchange}/{symbol}
```

Returns current long/short positioning for a specific symbol.

```bash
curl https://api.settled.pro/v1/crowd/binance/BTCUSDT
```

```json
{
  "data": {
    "exchange": "binance",
    "symbol": "BTCUSDT",
    "long_pct": "0.68",
    "short_pct": "0.32",
    "net_position": "0.36",
    "open_interest_usd": "1240300000",
    "history": [
      {
        "long_pct": "0.65",
        "short_pct": "0.35",
        "timestamp": "2026-03-18T08:00:00Z"
      },
      {
        "long_pct": "0.68",
        "short_pct": "0.32",
        "timestamp": "2026-03-18T09:00:00Z"
      }
    ],
    "updated_at": "2026-03-18T09:00:00Z"
  }
}
```
