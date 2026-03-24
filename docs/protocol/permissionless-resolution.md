---
title: Permissionless Resolution
description: How Switchboard oracle proofs enable trustless market resolution without an authority key
sidebar_position: 5
---

# Permissionless Resolution

Settled markets are resolved permissionlessly using Switchboard oracle proofs. Anyone can submit a resolution transaction — no authority key is needed. The cryptographic proof from the oracle IS the authorization.

## How It Works

```
                     Switchboard Oracle
                           │
                    signed funding rate
                           │
                           ▼
┌──────────┐    submit   ┌──────────────────┐
│ Resolver │────────────▶│ resolve_market    │
│ (anyone) │             │ _permissionless  │
└──────────┘             └──────────────────┘
                                │
                    1. Verify secp256k1 signature
                    2. Extract funding rate value
                    3. Check feed_hash matches market
                    4. rate > 0 → YES, rate ≤ 0 → NO
                    5. Update market status
                                │
                                ▼
                         ┌──────────┐
                         │ Resolved │
                         │  Market  │
                         └──────────┘
```

### Step-by-Step

1. **Market closes** — trading stops 5 minutes before the settlement timestamp
2. **Settlement time passes** — the market is now eligible for resolution
3. **Resolver fetches oracle proof** — reads the Switchboard feed account for the market's exchange/symbol pair. The feed contains a signed funding rate value
4. **Resolver submits transaction** — calls `resolve_market_permissionless` with the market ID and a reference to the Switchboard oracle feed account. The transaction includes a secp256k1 signature verification instruction
5. **On-chain verification:**
   - The program reads the secp256k1 verify instruction from the instructions sysvar
   - Verifies the signature is from a valid Switchboard oracle
   - Extracts the funding rate value from the signed message
   - Checks that the feed hash matches the market's `feed_hash` field (set at creation)
   - Determines outcome: `rate > 0` → YES wins, `rate ≤ 0` → NO wins
6. **Market resolved** — status updated, token metadata updated, claims enabled

### What Changed from Authority-Based Resolution

**Before (authority required):**
```rust
// Only the vault authority could resolve
constraint = vault_state.authority == authority.key()
```

**After (permissionless):**
```rust
// No authority check. Instead:
// 1. Verify secp256k1 instruction exists in the TX
// 2. Extract signed message containing the funding rate
// 3. Verify feed hash matches the market's exchange+symbol
// 4. Determine outcome from the rate value
// The cryptographic proof IS the authorization.
```

The authority-based `resolve_market` instruction still exists as a fallback, but `resolve_market_permissionless` is the primary path.

## Switchboard Integration

[Switchboard](https://switchboard.xyz) is a decentralized oracle network on Solana. Settled uses Switchboard feeds that pull funding rate data from exchange APIs (Binance, Bybit, KuCoin, Gate, and Hyperliquid).

### Feed Hash

Each market stores a `feed_hash` — a 32-byte hash that identifies which Switchboard feed corresponds to this market's exchange/symbol pair. The on-chain program verifies that the oracle proof comes from the correct feed.

```
Market: "Will BTCUSDT funding rate on Binance be positive?"
Feed Hash: 994896360e3a6bf4... (Switchboard feed for Binance BTCUSDT funding rate)
```

This prevents someone from submitting an oracle proof for the wrong exchange or symbol.

### Signature Verification

Switchboard oracle responses include a secp256k1 signature. The resolution transaction includes a `Secp256k1Program` instruction that the Solana runtime verifies before the program executes. The program then reads this pre-verified instruction from the instructions sysvar to extract the signed data.

This is a standard Solana pattern — the secp256k1 verification is done at the runtime level, not inside the program, making it gas-efficient and secure.

## Resolver Incentive

Resolvers receive a USDC tip for submitting valid resolution transactions: **10 basis points (0.1%)** of the market's accumulated trading fees.

| Market fees | Resolver tip |
|-------------|-------------|
| 0 USDC | 0 USDC (market still resolves) |
| 10 USDC | 0.01 USDC |
| 100 USDC | 0.10 USDC |
| 1,000 USDC | 1.00 USDC |

The tip is paid from the vault's USDC to the resolver's USDC token account as part of the resolution transaction. The resolver also pays SOL gas for the transaction.

See [Running a Resolver](/protocol/running-a-resolver) for how to run your own resolver daemon.

## Claims After Resolution

Once a market is resolved, holders of winning tokens can claim USDC by calling `claim_position`. This is also permissionless:

1. Program checks market status is Resolved
2. User burns their winning-side tokens (YES or NO)
3. Program calculates USDC payout based on shares burned
4. Program transfers USDC from vault to user

No authority key is involved. The user signs the transaction to authorize burning their own tokens, and the VaultState PDA signs the USDC transfer.

## Failure Modes

| Scenario | What Happens |
|----------|-------------|
| Oracle feed unavailable | Resolution fails, retried later. Market stays Closed. |
| Wrong feed submitted | `FeedHashMismatch` error — transaction reverts |
| Market already resolved | `AlreadyResolved` error — transaction reverts, no harm done |
| Multiple resolvers race | First valid transaction wins. Others revert with `AlreadyResolved`. |
| Oracle data disputed | Not possible — Switchboard proof is cryptographically verified |

## Decentralization Scorecard

| Component | Before | After |
|-----------|--------|-------|
| Trading | On-chain | On-chain + real SPL tokens |
| Resolution | Authority key required | Switchboard proof, anyone can submit |
| Claims | On-chain | Burn tokens + receive USDC, fully trustless |
| Position visibility | Hidden in PDAs | Tokens visible in any wallet |
| Data availability | Postgres DB | On-chain metadata + token balances |

**Design philosophy:** The goal is not maximum decentralization. The goal is **minimum trust required**. Users can verify: their funds are in a program-controlled vault, the market outcome matches the actual funding rate (oracle proof), and their payout is computed correctly (burn tokens, receive USDC).
