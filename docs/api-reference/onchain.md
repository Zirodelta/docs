---
title: On-Chain Integration
description: Solana program integration — market PDAs, co-signing, and trade sync
sidebar_position: 5
---

# On-Chain Integration

Settled's core trading logic runs on a Solana program. The backend provides endpoints to bridge on-chain actions with the Postgres state layer.

## Architecture Overview

```
User Wallet
    │
    ├─ signs buy_shares / sell_shares instruction
    │
    ▼
Solana Program (Settled)
    │
    ├─ validates + executes trade on-chain
    │
    ▼
On-Chain Indexer   ← automatic, no user action needed
    │
    ▼
Postgres (positions, trade history, leaderboard)
```

The backend never holds a user's private key. It only:
1. Lazily creates market PDAs when needed
2. Co-signs `create_market` transactions with the program authority keypair
3. Runs an on-chain indexer that automatically syncs confirmed transactions to the database

## Market PDAs

Each market has a Program Derived Address (PDA) on Solana. PDAs are created lazily on first use.

### Ensure Market is On-Chain

```bash
GET /v1/markets/{id}/ensure-onchain
```

Checks if the market PDA exists. If not, creates it. Call this before constructing any trade transaction for a market.

Requires JWT.

```bash
curl https://api.settled.pro/v1/markets/8166597e-.../ensure-onchain \
  -H "Authorization: Bearer <jwt>"
```

**Response (PDA already exists):**

```json
{
  "data": {
    "market_id": "8166597e-...",
    "pda": "FxMb3z7qHvTkLpWgNe4r...",
    "status": "ready"
  }
}
```

**Response (PDA needs creation):**

```json
{
  "data": {
    "market_id": "8166597e-...",
    "status": "needs_cosign",
    "transaction": "<base64_unsigned_tx>"
  }
}
```

If `status` is `needs_cosign`, sign the transaction and submit it to `POST /v1/markets/{id}/co-sign`.

### Co-Sign Market Creation Transaction

```bash
POST /v1/markets/{id}/co-sign
```

The backend co-signs the `create_market` transaction with the program authority key. You provide your partial signature; the backend adds its signature and returns the fully-signed transaction for you to submit to Solana.

Requires JWT. Anti-replay headers required.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `transaction` | string | Yes | Base64-encoded partially-signed Solana transaction |

```bash
curl -X POST https://api.settled.pro/v1/markets/8166597e-.../co-sign \
  -H "Authorization: Bearer <jwt>" \
  -H "X-Request-Nonce: a3f8b2c1d4e5f69702ab3c4d5e6f7081" \
  -H "X-Request-Timestamp: 1742298600" \
  -H "Content-Type: application/json" \
  -d '{"transaction": "<base64_partial_tx>"}'
```

**Response:**

```json
{
  "data": {
    "transaction": "<base64_cosigned_tx>"
  }
}
```

Submit the returned transaction to Solana:

```typescript
const txBytes = Buffer.from(data.transaction, 'base64')
const tx = Transaction.from(txBytes)
const sig = await connection.sendRawTransaction(tx.serialize())
await connection.confirmTransaction(sig)
```

## Trade Sync

After your `buy_shares` or `sell_shares` transaction confirms on Solana, the **on-chain indexer** automatically detects it and syncs the trade to Postgres. No manual API call is needed.

The indexer subscribes to all program logs via WebSocket, parses each transaction, and updates:
- Trade history
- User positions
- Market LMSR state (q_yes, q_no, volume, trade count)
- Leaderboard stats

Typical sync latency is under 5 seconds after on-chain confirmation.

## Full Trade Flow (TypeScript)

```typescript
import { Connection, Transaction, PublicKey } from '@solana/web3.js'

const API = 'https://api.settled.pro/v1'
const connection = new Connection('https://api.mainnet-beta.solana.com')

async function buyShares(marketId: string, side: 'yes' | 'no', usdcAmount: number) {
  // 1. Ensure market is on-chain
  const ensureRes = await fetch(`${API}/markets/${marketId}/ensure-onchain`, {
    headers: { 'Authorization': `Bearer ${jwt}` }
  })
  const { data: ensureData } = await ensureRes.json()

  if (ensureData.status === 'needs_cosign') {
    // Sign and co-sign create_market tx
    const tx = Transaction.from(Buffer.from(ensureData.transaction, 'base64'))
    const signed = await wallet.signTransaction(tx)
    const b64 = signed.serialize({ requireAllSignatures: false }).toString('base64')

    const cosignRes = await fetch(`${API}/markets/${marketId}/co-sign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'X-Request-Nonce': nonce(),
        'X-Request-Timestamp': ts(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transaction: b64 })
    })
    const { data: cosignData } = await cosignRes.json()

    const finalTx = Transaction.from(Buffer.from(cosignData.transaction, 'base64'))
    const sig = await connection.sendRawTransaction(finalTx.serialize())
    await connection.confirmTransaction(sig)
  }

  // 2. Get a quote
  const quoteRes = await fetch(`${API}/markets/${marketId}/quote?side=${side}&amount=${usdcAmount}`)
  const { data: quote } = await quoteRes.json()
  console.log(`Expected: ${quote.shares} shares, price impact: ${quote.price_impact}`)

  // 3. Build and sign buy_shares instruction
  const tradeTx = buildBuySharesTx(ensureData.pda, side, usdcAmount)
  const signedTrade = await wallet.signTransaction(tradeTx)
  const tradeSig = await connection.sendRawTransaction(signedTrade.serialize())
  await connection.confirmTransaction(tradeSig)

  // Done — the on-chain indexer syncs the trade to Postgres automatically.
  // Positions and trade history update within seconds.
  return tradeSig
}

function nonce() { return crypto.randomUUID().replace(/-/g, '') }
function ts() { return Math.floor(Date.now() / 1000).toString() }
```
