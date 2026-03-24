---
title: Protocol Overview
description: End-to-end flow of the Settled prediction market protocol on Solana
sidebar_position: 1
---

# Protocol Overview

Settled is a prediction market protocol for crypto funding rates, built on Solana. Users trade binary YES/NO shares on whether a perpetual futures funding rate will be positive at settlement time. All trading, settlement, and payouts happen on-chain.

## End-to-End Flow

```
┌──────────┐    create     ┌──────────┐    trade     ┌──────────┐
│  Oracle   │─────────────▶│  Market   │◀───────────▶│   User   │
│  Daemon   │              │ (on-chain)│              │  Wallet  │
└──────────┘              └──────────┘              └──────────┘
                                │
                       resolve (permissionless)
                                │
                                ▼
                         ┌──────────┐
                         │ Resolved │
                         │  Market  │
                         └──────────┘
                                │
                       claim (permissionless)
                                │
                                ▼
                         ┌──────────┐
                         │   USDC   │
                         │  Payout  │
                         └──────────┘
```

### 1. Market Creation

The oracle daemon creates markets based on upcoming funding rate settlement times across exchanges (Binance, Bybit, KuCoin, Gate, and Hyperliquid). Each market is a binary question:

> *"Will BTCUSDT funding rate on Binance at 2026-03-19 16:00 UTC be positive?"*

On-chain, this creates:
- A **MarketState PDA** storing LMSR state, timestamps, and outcome
- A **YES token mint** (Token-2022 with on-chain metadata)
- A **NO token mint** (Token-2022 with on-chain metadata)

Market creation is centralized by design — Settled chooses which markets to list based on exchange data and the OU pricing model.

### 2. Trading

Users buy and sell YES/NO shares using USDC. Prices are determined by the [LMSR market maker](/protocol/lmsr-market-maker) — there is no order book.

- **Buying** transfers USDC to the vault and mints YES or NO tokens to the user's wallet
- **Selling** burns the user's tokens and transfers USDC back from the vault

Shares are real SPL tokens (Token-2022). They appear in wallets like Phantom and Solflare, and can be transferred or traded on any DEX.

### 3. Resolution

When the settlement time arrives, anyone can resolve the market by submitting a Switchboard oracle proof. No authority key is needed — the cryptographic proof from Switchboard IS the authorization.

The on-chain program:
1. Verifies the secp256k1 signature (Switchboard oracle proof)
2. Extracts the funding rate value from the signed message
3. Determines outcome: rate > 0 → YES wins, rate ≤ 0 → NO wins
4. Updates market status to Resolved

See [Permissionless Resolution](/protocol/permissionless-resolution) for details.

### 4. Claims

After resolution, holders of winning tokens burn them to receive USDC. This is fully trustless — the program checks that the market is resolved, burns the winning tokens, and transfers the payout. No authority involved.

## Market Lifecycle

```
pending → open → closed → resolving → settled
                                     → voided
```

| Status | Description |
|--------|-------------|
| `pending` | Created by scheduler, not yet tradeable |
| `open` | Trading is live |
| `closed` | Trading stops 5 minutes before settlement |
| `resolving` | Oracle proof submitted, awaiting confirmation |
| `settled` | Outcome confirmed, winners can claim USDC |
| `voided` | Insufficient oracle data, all positions refunded at cost |

## Key Properties

| Property | Implementation |
|----------|---------------|
| **USDC custody** | Program-controlled vault on Solana (not a hot wallet) |
| **AMM pricing** | LMSR with on-chain fixed-point arithmetic |
| **Positions** | Real SPL tokens (Token-2022) visible in any wallet |
| **Resolution** | Permissionless via Switchboard oracle proof |
| **Claims** | Burn winning tokens → receive USDC, no authority needed |
| **Data availability** | Market question, exchange, settlement time — all on-chain metadata |

## What Stays Centralized

| Component | Reason |
|-----------|--------|
| Market creation | Settled chooses markets based on its data moat (OU model, 9.4M+ historical settlements) |
| Token image rendering | Dynamic images from the API server (all data available on-chain as fallback) |
| Frontend | settled.pro is the official app — anyone can build against the on-chain data |

## Solana Program

Program ID: `7rLM8d27AgkbFjQfJJpHzD4A5pMttD7PzMrqDiMNf7AW`

The program has 24 instructions grouped into Admin, Market Lifecycle, Trading, and Vault operations. See [On-Chain Program](/protocol/onchain-program) for the full reference.
