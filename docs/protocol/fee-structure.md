---
title: Fee Structure
description: Trading fees and ZDLT token tier discounts on Settled
sidebar_position: 7
---

# Fee Structure

Settled charges a percentage fee on every trade. The base fee is 1% of the USDC amount, applied when buying or selling shares. Holding ZDLT tokens in your wallet reduces your fee tier.

## Fee Tiers

| Tier | ZDLT Required | Trading Fee |
|------|--------------|-------------|
| **None** | 0 | 1.00% |
| **Bronze** | 1,000 ZDLT | 0.75% |
| **Silver** | 5,000 ZDLT | 0.50% |
| **Gold** | 25,000 ZDLT | 0.35% |
| **Diamond** | 100,000 ZDLT | 0.25% |

Your tier is determined by the ZDLT balance in the connected wallet at the time of each trade. There is no staking or locking required — simply holding ZDLT qualifies you.

## ZDLT Token

**Token address:** `4PX31xRA1BaAyb2Js45ZKYp92VGWGp47yWeVs5CGVKbf` (Solana, fixed supply)

ZDLT is the utility token of the Zirodelta protocol. It is used exclusively for fee tier discounts on Settled. ZDLT is not a governance token and does not confer voting rights.

## How Fees Are Charged

Fees are deducted from the USDC amount on every `buy_shares` and `sell_shares` instruction:

1. User submits a trade for X USDC
2. Program reads user's ZDLT balance to determine tier
3. Fee = X * fee_rate (based on tier)
4. Net amount = X - fee
5. LMSR shares are computed from the net amount
6. Fee is retained in the vault

### Example

A Gold tier user buying $100 of YES shares:

| | Value |
|---|---|
| USDC amount | $100.00 |
| Fee rate (Gold) | 0.35% |
| Fee | $0.35 |
| Net for LMSR | $99.65 |
| Shares received | Computed by LMSR from $99.65 |

## Fee Distribution

Accumulated fees are distributed as follows:

| Allocation | Share | Description |
|-----------|-------|-------------|
| Operations | 50% | Infrastructure, exchange fees, gas, development |
| ZDLT buyback | 25% | Protocol buys ZDLT on Jupiter, with on-chain Memo proof |
| PBED credit pool | 25% | Distributed to PBED NFT holders by weight-based allocation |

### Resolver Tip

An additional 10 basis points (0.1%) of a market's accumulated fees are paid to the resolver who submits the permissionless resolution transaction. This comes from the vault's fee pool and is separate from the distribution above.

## Fee on the API

The fee amount is included in every trade response:

```json
{
  "data": {
    "trade_id": "a1b2c3d4-...",
    "side": "yes",
    "shares": "13.698630",
    "cost_usdc": "10.000000",
    "fee_usdc": "0.100000",
    "new_yes_price": "0.742000"
  }
}
```

The quote endpoints also show the fee so you know the exact cost before trading:

```bash
GET /v1/markets/{id}/quote?side=yes&amount=100
```

## Fee Properties

| Property | Value |
|----------|-------|
| **Minimum fee** | No minimum — proportional to trade size |
| **Maximum fee** | 1% (None tier) |
| **When charged** | On buy and sell |
| **Settlement claims** | No fee on claiming winning positions |
| **Voided markets** | No fee on refunds |
| **Fee visibility** | Shown in `fee_usdc` field on every trade and quote |
