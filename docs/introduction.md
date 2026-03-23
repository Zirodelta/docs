---
title: Introduction
description: Build on Settled — the prediction market for crypto funding rates
slug: /
sidebar_position: 1
---

# Settled Developer Documentation

Settled is a prediction market platform for crypto funding rates on Solana. Markets auto-create before each funding settlement and auto-resolve using exchange API data.

## What you can build

- **Trading bots** that scan for mispriced markets and execute trades via REST API
- **Data pipelines** that consume real-time price updates via WebSocket
- **Analytics dashboards** using historical settlement and resolution data
- **Arbitrage strategies** across 19 series spanning Binance, Bybit, KuCoin, Gate, and Hyperliquid

## Base URL

```
https://api.settled.pro/v1
```

## Response format

Every endpoint returns JSON with this envelope:

```json
{
  "data": { ... },
  "meta": { "page": 1, "limit": 20 },
  "error": null
}
```

On error:

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

## Authentication

Two methods supported:

1. **Sign-In With Solana (SIWS)** — for browser-based apps. Request a challenge, sign with wallet, receive JWT.
2. **API Keys** — for bots and scripts. Generate from your account, pass via `X-API-Key` header.

See [Authentication](/authentication) for the full flow.

## Rate limits

| Endpoint type | Limit |
|---|---|
| Public | 60 req/min per IP |
| Authenticated | 300 req/min per key |
| Trading | 10 req/sec per user |
| WebSocket | 5 connections per IP |

[Quickstart — Place your first trade in under 5 minutes](/quickstart)
