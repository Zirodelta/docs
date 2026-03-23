---
title: Authentication
description: Authenticate with Solana wallet signatures or API keys
sidebar_position: 2
---

# Authentication

Settled supports two authentication methods. Use SIWS for browser apps. Use API keys for bots and scripts.

## Sign-In With Solana (SIWS)

Three-step flow: request challenge, sign with wallet, verify signature.

### Step 1: Request a challenge

**cURL:**

```bash
curl -X POST https://api.settled.pro/v1/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "Dc5tRex7r3EYi7HVNNjr3FkfhytDksWFtT1CLjgVYCSU"}'
```

**TypeScript:**

```typescript
const res = await fetch('https://api.settled.pro/v1/auth/challenge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet_address: publicKey.toBase58() })
})
const { data } = await res.json()
// data.nonce, data.message
```

**Python:**

```python
import requests

res = requests.post('https://api.settled.pro/v1/auth/challenge', json={
    'wallet_address': 'Dc5tRex7r3EYi7HVNNjr3FkfhytDksWFtT1CLjgVYCSU'
})
data = res.json()['data']
# data['nonce'], data['message']
```

**Response:**

```json
{
  "data": {
    "nonce": "a8f3b2c1d4e5f6...",
    "message": "settled.pro wants you to sign in with your Solana account:\nDc5tR...\n\nNonce: a8f3b2c1d4e5f6..."
  }
}
```

### Step 2: Sign the message

Sign `data.message` with your Solana wallet. In Phantom:

```typescript
const encodedMessage = new TextEncoder().encode(data.message)
const signedMessage = await window.solana.signMessage(encodedMessage)
const signature = bs58.encode(signedMessage.signature)
```

### Step 3: Verify and get JWT

**cURL:**

```bash
curl -X POST https://api.settled.pro/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "Dc5tRex7r3EYi7HVNNjr3FkfhytDksWFtT1CLjgVYCSU",
    "signature": "<base58_signature>",
    "nonce": "a8f3b2c1d4e5f6..."
  }'
```

**TypeScript:**

```typescript
const res = await fetch('https://api.settled.pro/v1/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet_address: publicKey.toBase58(),
    signature,
    nonce: data.nonce
  })
})
const { data: auth } = await res.json()
// auth.token — your JWT
```

**Response:**

```json
{
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "expires_at": "2026-03-19T09:30:00Z"
  }
}
```

Use the JWT in subsequent requests:

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

## API Keys

For bots and automated trading. Requires a JWT to create.

### Create a key

```bash
curl -X POST https://api.settled.pro/v1/api-keys \
  -H "Authorization: Bearer <jwt>"
```

```json
{
  "data": {
    "id": "7a3f1c2d-...",
    "key": "stld_02119e5f4e5ee6a8b9c3d4f5...",
    "key_prefix": "stld_02119e",
    "label": "",
    "created_at": "2026-03-18T09:00:00Z"
  }
}
```

:::warning
The full key is shown only once. Store it securely. Keys are stored as SHA-256 hashes — even a database breach will not leak raw keys.
:::

### Use the key

```
X-API-Key: stld_02119e5f4e5ee6a8b9c3d4f5...
```

### List and revoke keys

```bash
# List your keys (prefix only)
curl https://api.settled.pro/v1/api-keys -H "Authorization: Bearer <jwt>"

# Revoke a key
curl -X DELETE https://api.settled.pro/v1/api-keys/7a3f1c2d-... \
  -H "Authorization: Bearer <jwt>"
```
