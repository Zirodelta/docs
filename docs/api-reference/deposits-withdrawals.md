---
title: Deposits & Withdrawals
description: Deposit USDC and withdraw to your Solana wallet
sidebar_position: 7
---

# Deposits & Withdrawals

## Faucet (Testnet)

If you're on testnet, claim $1,000 in test USDC from the faucet. No authentication needed to check status, but claiming requires a JWT.

### Check Faucet Status

```bash
GET /v1/faucet/status
```

```bash
curl https://api.settled.pro/v1/faucet/status
```

```json
{
  "data": {
    "available": true,
    "amount": "1000.00",
    "cooldown_hours": 24
  }
}
```

### Claim Test USDC

```bash
POST /v1/faucet/claim
```

Requires JWT. Anti-replay headers required.

```bash
curl -X POST https://api.settled.pro/v1/faucet/claim \
  -H "Authorization: Bearer <jwt>" \
  -H "X-Request-Nonce: a3f8b2c1d4e5f69702ab3c4d5e6f7081" \
  -H "X-Request-Timestamp: 1742298600"
```

```json
{
  "data": {
    "amount": "1000.000000",
    "new_balance": "1000.000000",
    "next_claim_at": "2026-03-19T09:30:00Z"
  }
}
```

## Get Deposit Address

```bash
GET /v1/deposit/address
```

Returns your Solana USDC deposit address. Send SPL USDC to this address to fund your account.

```bash
curl https://api.settled.pro/v1/deposit/address \
  -H "Authorization: Bearer <jwt>"
```

```json
{
  "data": {
    "address": "7rLM8d27AgkbFjQfJJpHzD4A5pMttD7PzMrqDiMNf7AW",
    "chain": "solana",
    "token": "USDC",
    "min_deposit": "1.00"
  }
}
```

Deposits are detected automatically via Helius webhook. Typically confirmed within 30 seconds.

## Initiate Withdrawal

The withdrawal flow is a state machine: **initiate → sign on-chain → confirm → worker monitors**.

### Step 1: Initiate

```bash
POST /v1/withdraw/initiate
```

Requires JWT. Anti-replay headers required.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `amount` | string | Yes | USDC amount to withdraw (e.g. `"50.00"`) |
| `destination` | string | Yes | Solana wallet address to receive USDC |

```bash
curl -X POST https://api.settled.pro/v1/withdraw/initiate \
  -H "Authorization: Bearer <jwt>" \
  -H "X-Request-Nonce: a3f8b2c1d4e5f69702ab3c4d5e6f7081" \
  -H "X-Request-Timestamp: 1742298600" \
  -H "Content-Type: application/json" \
  -d '{"amount": "50.00", "destination": "Dc5tRex7r3EYi7HVNNjr3FkfhytDksWFtT1CLjgVYCSU"}'
```

```json
{
  "data": {
    "id": "w1x2y3z4-...",
    "amount": "50.000000",
    "destination": "Dc5tRex7r3EYi7HVNNjr3FkfhytDksWFtT1CLjgVYCSU",
    "status": "pending",
    "created_at": "2026-03-18T09:30:00Z"
  }
}
```

### Step 2: Sign the withdrawal on-chain

Build and sign the Solana transaction to authorize the withdrawal from the vault.

### Step 3: Confirm with transaction signature

```bash
POST /v1/withdraw/{id}/confirm
```

Requires JWT. Anti-replay headers required.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `tx_sig` | string | Yes | Confirmed Solana transaction signature |

```bash
curl -X POST https://api.settled.pro/v1/withdraw/w1x2y3z4-.../confirm \
  -H "Authorization: Bearer <jwt>" \
  -H "X-Request-Nonce: b4c9d3e2f1a0b5c6d7e8f9a0b1c2d3e4" \
  -H "X-Request-Timestamp: 1742298610" \
  -H "Content-Type: application/json" \
  -d '{"tx_sig": "5KtWMrqHv..."}'
```

```json
{
  "data": {
    "id": "w1x2y3z4-...",
    "status": "confirmed",
    "tx_sig": "5KtWMrqHv..."
  }
}
```

A background worker monitors the transaction and finalizes the withdrawal once confirmed on-chain.

## Check Withdrawal Status

```bash
GET /v1/withdrawals/{id}
```

```bash
curl https://api.settled.pro/v1/withdrawals/w1x2y3z4-... \
  -H "Authorization: Bearer <jwt>"
```

```json
{
  "data": {
    "id": "w1x2y3z4-...",
    "amount": "50.000000",
    "destination": "Dc5tRex7r3EYi7HVNNjr3FkfhytDksWFtT1CLjgVYCSU",
    "status": "confirmed",
    "solana_tx_sig": "5KtW...",
    "confirmed_at": "2026-03-18T09:30:45Z"
  }
}
```

### Withdrawal Statuses

| Status | Meaning |
|---|---|
| `pending` | Initiated, awaiting on-chain signature |
| `processing` | Confirmed with TX sig, worker monitoring |
| `confirmed` | On-chain confirmation received, funds sent |
| `failed` | Transaction failed, funds returned to balance |
