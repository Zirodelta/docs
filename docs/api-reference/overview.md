---
title: API Overview
description: REST API basics — base URL, response format, authentication, and error codes
sidebar_position: 1
---

# API Overview

## Base URL

```
https://api.settled.pro/v1
```

## Health Check

```bash
curl https://api.settled.pro/health
```

```json
{
  "status": "ok",
  "timestamp": "2026-03-18T09:30:00Z",
  "components": {
    "postgres": "ok",
    "redis": "ok"
  }
}
```

## Authentication

Public endpoints require no credentials. Authenticated endpoints accept a JWT in the `Authorization` header:

```
Authorization: Bearer <jwt>
```

See the [Authentication](/authentication) guide for how to obtain a JWT via Sign-In With Solana.

## Anti-Replay Headers

All authenticated **write** endpoints (`POST`, `PUT`, `DELETE`) require two additional headers to prevent replay attacks:

| Header | Format | Notes |
|---|---|---|
| `X-Request-Nonce` | 32–64 hex chars or UUID | Unique per request; reuse is rejected |
| `X-Request-Timestamp` | Unix timestamp (seconds) | Must be within ±5 minutes of server time |

```
X-Request-Nonce: a3f8b2c1d4e5f69702ab3c4d5e6f7081
X-Request-Timestamp: 1742298600
```

Example in TypeScript:

```typescript
const nonce = crypto.randomUUID().replace(/-/g, '')
const timestamp = Math.floor(Date.now() / 1000).toString()
```

## Response Envelope

Every endpoint returns this structure:

```json
{
  "data": { ... },
  "error": null
}
```

Paginated endpoints include a `meta` field:

```json
{
  "data": [ ... ],
  "meta": { "page": 0, "limit": 20, "total": 148 },
  "error": null
}
```

`data` contains the result. `error` is `null` on success.

## Error Format

```json
{
  "data": null,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Not enough USDC to place this trade",
    "status": 422
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `INVALID_INPUT` | 400 | Bad request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid auth |
| `NOT_FOUND` | 404 | Market or series not found |
| `MARKET_CLOSED` | 422 | Market is not in a tradeable state |
| `INSUFFICIENT_BALANCE` | 422 | Not enough USDC |
| `REPLAY_DETECTED` | 422 | Nonce already used or timestamp out of window |
| `PDA_NOT_FOUND` | 422 | Market PDA not initialized — call `ensure-onchain` first |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limits

| Endpoint type | Limit |
|---|---|
| Public | 60 req/min per IP |
| Authenticated | 300 req/min per key |
| Write (trading) | 10 req/sec per user |
| WebSocket | 5 connections per IP |

Rate limit headers on every response:

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 298
X-RateLimit-Reset: 1773800000
```
