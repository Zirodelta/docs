---
title: Push Notifications
description: Subscribe to web push notifications for market events
sidebar_position: 11
---

# Push Notifications

Subscribe to web push notifications to get alerted when markets settle, prices move, or your positions change. Uses the Web Push Protocol — works in any browser that supports service workers.

Both endpoints require JWT authentication and anti-replay headers.

## Subscribe

```bash
POST /v1/push/subscribe
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `endpoint` | string | Yes | The push endpoint URL from the browser's `PushSubscription` |
| `keys` | object | Yes | The `keys` object from `PushSubscription` — contains `p256dh` and `auth` |

```typescript
// Get a push subscription from the browser
const registration = await navigator.serviceWorker.ready
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY
})

// Send to the API
await fetch('https://api.settled.pro/v1/push/subscribe', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwt}`,
    'X-Request-Nonce': nonce,
    'X-Request-Timestamp': timestamp,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(subscription.toJSON())
})
```

```bash
curl -X POST https://api.settled.pro/v1/push/subscribe \
  -H "Authorization: Bearer <jwt>" \
  -H "X-Request-Nonce: a3f8b2c1d4e5f69702ab3c4d5e6f7081" \
  -H "X-Request-Timestamp: 1742298600" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BGm...",
      "auth": "a8f..."
    }
  }'
```

**Response:**

```json
{
  "data": {
    "subscribed": true
  }
}
```

## Unsubscribe

```bash
POST /v1/push/unsubscribe
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `endpoint` | string | Yes | The push endpoint URL to remove |

```bash
curl -X POST https://api.settled.pro/v1/push/unsubscribe \
  -H "Authorization: Bearer <jwt>" \
  -H "X-Request-Nonce: c5d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4" \
  -H "X-Request-Timestamp: 1742298700" \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "https://fcm.googleapis.com/fcm/send/..."}'
```

**Response:**

```json
{
  "data": {
    "unsubscribed": true
  }
}
```

## Notification Events

Once subscribed, you'll receive push notifications for:

| Event | When |
|---|---|
| Market settled | A market you hold positions in has resolved |
| Settlement payout | USDC credited to your balance from a win |
| Deposit confirmed | Incoming USDC deposit detected and confirmed |
| Withdrawal confirmed | Your withdrawal has been sent on-chain |
