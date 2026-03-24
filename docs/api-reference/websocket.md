---
title: WebSocket
description: Real-time price updates, trades, and settlement notifications
sidebar_position: 12
---

# WebSocket

Connect to the WebSocket endpoint for real-time market data. The WebSocket is fully operational as of the latest backend deployment (Hijacker fix).

## Connection

```
wss://api.settled.pro/ws
```

```javascript
const ws = new WebSocket('wss://api.settled.pro/ws')

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'market:8166597e-...'
  }))
}

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  console.log(msg.type, msg.data)
}
```

## Subscribe to Channels

After connecting, send JSON messages to subscribe:

### Market updates (public)

```json
{ "type": "subscribe", "channel": "market:8166597e-..." }
```

### All series updates (public)

```json
{ "type": "subscribe", "channel": "series" }
```

### Your account updates (authenticated)

```json
{
  "type": "subscribe",
  "channel": "user:Dc5tRex7r3EYi7HVNNjr3FkfhytDksWFtT1CLjgVYCSU",
  "token": "<jwt>"
}
```

## Message Types

### Price Update

Sent when a trade moves the market price.

```json
{
  "type": "price_update",
  "channel": "market:8166597e-...",
  "data": {
    "yes_price": "0.742000",
    "no_price": "0.258000",
    "trade_count": 48,
    "total_volume": "1240.50"
  }
}
```

### Trade

Sent on every trade execution.

```json
{
  "type": "trade",
  "channel": "market:8166597e-...",
  "data": {
    "side": "yes",
    "shares": "13.70",
    "price": "0.73",
    "timestamp": "2026-03-18T09:15:32Z"
  }
}
```

### Settlement

Sent when a market resolves.

```json
{
  "type": "settlement",
  "channel": "market:8166597e-...",
  "data": {
    "slug": "binance-lynusdt",
    "market_id": "8166597e-...",
    "outcome": "yes",
    "actual_rate": "0.00041339",
    "round_number": 11
  }
}
```

## Unsubscribe

```json
{ "type": "unsubscribe", "channel": "market:8166597e-..." }
```

## Connection Limits

- 5 WebSocket connections per IP
- Idle connections closed after 5 minutes with no active subscriptions
- Heartbeat ping every 30 seconds — respond with `pong` to keep alive
