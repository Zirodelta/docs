---
title: Funding Intervals
description: Track funding rate interval changes across exchanges and symbols
sidebar_position: 9
---

# Funding Intervals

The Intervals API tracks funding rate interval changes — when exchanges switch symbols between 8h and 4h (or other) funding periods. This data is useful for understanding when market dynamics shift.

All endpoints are public. No authentication required.

## List Interval Changes

```bash
GET /v1/intervals
```

Returns a list of all funding interval change events.

```bash
curl https://api.settled.pro/v1/intervals
```

```json
{
  "data": [
    {
      "id": "i1a2b3c4-...",
      "exchange": "binance",
      "symbol": "BTCUSDT",
      "from_interval": "8h",
      "to_interval": "4h",
      "changed_at": "2026-03-10T00:00:00Z"
    }
  ]
}
```

## Interval Change Stats

```bash
GET /v1/intervals/stats
```

Returns aggregate statistics about interval changes across all exchanges and symbols.

```bash
curl https://api.settled.pro/v1/intervals/stats
```

```json
{
  "data": {
    "total_changes": 1284,
    "exchanges": {
      "binance": 842,
      "bybit": 312,
      "okx": 130
    },
    "most_changed_symbols": [
      { "symbol": "BTCUSDT", "changes": 42 },
      { "symbol": "ETHUSDT", "changes": 38 }
    ]
  }
}
```

## Threaded Interval View

```bash
GET /v1/intervals/threaded
```

Returns a paginated, searchable, sortable view of interval changes grouped by symbol.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `exchange` | string | — | Filter by exchange (e.g. `binance`, `bybit`, `okx`) |
| `sort` | string | `changes` | Sort field: `changes` or `symbol` |
| `order` | string | `desc` | `asc` or `desc` |
| `page` | integer | 0 | Page number (0-indexed) |
| `limit` | integer | 30 | Max results per page |
| `search` | string | — | Filter by symbol substring (e.g. `BTC`) |

```bash
curl "https://api.settled.pro/v1/intervals/threaded?exchange=binance&sort=changes&order=desc&page=0&limit=30&search=BTC"
```

```json
{
  "data": [
    {
      "symbol": "BTCUSDT",
      "exchange": "binance",
      "change_count": 42,
      "current_interval": "4h",
      "last_changed_at": "2026-03-15T00:00:00Z"
    }
  ],
  "meta": {
    "page": 0,
    "limit": 30,
    "total": 148
  }
}
```

## Symbol Interval History

```bash
GET /v1/intervals/{exchange}/{symbol}
```

Returns the full interval change history for a specific symbol on an exchange.

```bash
curl https://api.settled.pro/v1/intervals/binance/BTCUSDT
```

```json
{
  "data": {
    "exchange": "binance",
    "symbol": "BTCUSDT",
    "current_interval": "4h",
    "history": [
      {
        "from_interval": "8h",
        "to_interval": "4h",
        "changed_at": "2026-03-10T00:00:00Z"
      },
      {
        "from_interval": "4h",
        "to_interval": "8h",
        "changed_at": "2025-11-01T00:00:00Z"
      }
    ]
  }
}
```

## Symbol Interval Analysis

```bash
GET /v1/intervals/{exchange}/{symbol}/analysis
```

Returns trend analysis and statistics for interval changes on a given symbol.

```bash
curl https://api.settled.pro/v1/intervals/binance/BTCUSDT/analysis
```

```json
{
  "data": {
    "exchange": "binance",
    "symbol": "BTCUSDT",
    "total_changes": 42,
    "avg_days_between_changes": 12.4,
    "most_common_direction": "8h_to_4h",
    "volatility_score": 0.74
  }
}
```
