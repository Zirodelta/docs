---
title: Series
description: List and query market series — grouped by symbol + exchange
sidebar_position: 2
---

# Series

A series groups all rounds (markets) for the same symbol and exchange into one entity. Use series endpoints for the main market feed.

## List Series

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | 50 | Max results per page (max 200) |
| `page` | integer | 1 | Page number |

```bash
GET /v1/series?limit=20&page=1
```

**cURL:**

```bash
curl https://api.settled.pro/v1/series?limit=5
```

**TypeScript:**

```typescript
const res = await fetch('https://api.settled.pro/v1/series?limit=5')
const { data } = await res.json()
// data: SeriesCard[]
```

**Response:**

```json
{
  "data": [
    {
      "id": "01269537-...",
      "symbol": "LYNUSDT",
      "exchange": "binance",
      "slug": "binance-lynusdt",
      "display_name": "LYN/USDT",
      "tier": 3,
      "total_rounds": 11,
      "total_volume": "0.00",
      "yes_rate": "100.00",
      "avg_funding_rate": "0.00040464",
      "longest_yes_streak": 0,
      "longest_no_streak": 0,
      "last_outcome": "yes",
      "last_settled_at": "2026-03-17T16:00:17Z",
      "current_round": {
        "id": "59e25f81-...",
        "round_number": 11,
        "status": "open",
        "settlement_ts": "2026-03-18T01:00:00Z",
        "open_ts": "2026-03-18T00:00:00Z",
        "close_ts": "2026-03-18T00:55:00Z",
        "yes_price": "0.256000",
        "no_price": "0.744000",
        "total_volume": "0.000000",
        "trade_count": 0,
        "ou_prior": "0.2560",
        "ou_confidence": "0.7412"
      }
    }
  ],
  "meta": { "page": 1, "limit": 5 }
}
```

## Get Series by Slug

```bash
GET /v1/series/{slug}
```

The slug follows the pattern `{exchange}-{symbol}`, for example `binance-lynusdt`.

Returns the same shape as a single item from List Series.

## Get Settlement History

```bash
GET /v1/series/{slug}/rounds
```

Returns all past rounds for a series, ordered by settlement time descending.

```json
{
  "data": [
    {
      "id": "abc123-...",
      "round_number": 10,
      "status": "settled",
      "settlement_ts": "2026-03-17T16:00:00Z",
      "outcome": "yes",
      "actual_rate": "0.00041339",
      "yes_price": "0.890000",
      "no_price": "0.110000",
      "total_volume": "0.000000",
      "trade_count": 0,
      "settled_at": "2026-03-17T16:00:17Z"
    }
  ]
}
```
