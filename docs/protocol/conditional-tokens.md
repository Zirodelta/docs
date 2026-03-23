---
title: Conditional Tokens
description: Token-2022 YES/NO shares — mint, burn, and metadata lifecycle
sidebar_position: 3
---

# Conditional Tokens

Settled prediction market shares are real SPL tokens built on Solana's **Token-2022** program with the metadata extension. Every market creates two token mints — YES and NO — that users receive when they trade.

## Why Token-2022

Token-2022 has a built-in metadata extension that stores name, symbol, URI, and arbitrary key-value pairs directly on the mint account. No CPI to Metaplex. No separate metadata PDA. Cheaper and natively supported by Phantom, Solflare, and Solana Explorer.

| Feature | SPL Token + Metaplex | Token-2022 + Metadata Extension |
|---------|---------------------|-------------------------------|
| Metadata storage | Separate PDA (Metaplex program) | On the mint itself |
| Extra CPI calls | Yes | No |
| Cost per market | ~0.01 SOL (2 mints + 2 metadata) | ~0.006 SOL (2 mints with extension) |
| Additional fields | Requires off-chain JSON | `additional_metadata` key-value on-chain |

## What Each Market Creates

### MarketState PDA

- Seeds: `["market", market_id]`
- Stores LMSR state, timestamps, outcome, statistics
- References `yes_mint` and `no_mint` pubkeys
- Contains `feed_hash` for Switchboard oracle verification

### YES Token Mint

- Seeds: `["yes_mint", market_id]` → PDA mint
- Mint authority: VaultState PDA (only the program can mint/burn)
- Decimals: 6 (matches USDC scale)
- Symbol: `stYES`

**On-chain metadata:**

```
name:       "BTCUSDT Binance YES — Settled"
symbol:     "stYES"
uri:        "https://api.settled.pro/v1/tokens/{market_id}/yes"

additional_metadata (all on-chain):
  question:     "Will BTCUSDT funding rate on Binance at 2026-03-19 16:00 UTC be positive?"
  exchange:     "binance"
  symbol:       "BTCUSDT"
  settlement:   "2026-03-19T16:00:00Z"
  market_id:    "d270b1dc-716f-4b77-8747-0410c9be91c0"
  platform:     "https://settled.pro"
  feed_hash:    "994896360e3a6bf4..."
  status:       "open"
```

### NO Token Mint

Same structure as YES, with `name: "BTCUSDT Binance NO — Settled"`, `symbol: "stNO"`.

## Token Lifecycle

### Minting (Buy)

When a user buys YES shares:

1. User transfers USDC to the vault
2. Program computes shares via LMSR cost function
3. Program mints YES tokens to the user's Associated Token Account (ATA)
4. Mint authority is the VaultState PDA — only the program can mint

```rust
// Simplified — mint YES tokens to user's ATA
let mint_ix = spl_token_2022::instruction::mint_to(
    token_2022.key,
    yes_mint.key,
    user_yes_ata.key,
    vault_state.key,  // mint authority = vault PDA
    &[],
    shares_micro,     // 6 decimal places
)?;
invoke_signed(&mint_ix, &[...], vault_seeds)?;
```

### Burning (Sell)

When a user sells YES shares:

1. Program burns YES tokens from the user's ATA (user signs the burn)
2. Program computes USDC proceeds via LMSR
3. Program transfers USDC from vault to user

The user is the authority over their own token account, so they sign the burn — no `invoke_signed` needed.

### Burning (Claim)

After market resolution, holders of winning tokens can claim USDC:

1. Market must be in `Resolved` status
2. User burns winning-side tokens
3. Program transfers USDC payout: `tokens_burned * (1 - fee)`
4. No authority key involved — fully trustless

## Token Images

Every YES/NO token has a branded, dynamically rendered image served from:

```
https://api.settled.pro/v1/tokens/{market_id}/yes/image.png
https://api.settled.pro/v1/tokens/{market_id}/no/image.png
```

Images include the Settled logo, coin icon, exchange name, YES/NO badge with current price, and settlement time. They update as prices change and after resolution.

| Token | Background | Accent | Badge |
|-------|-----------|--------|-------|
| YES | `#0B0E11` (dark) | `#009B88` (Settled teal) | `#22c55e` (green) |
| NO | `#0B0E11` | `#009B88` | `#ef4444` (red) |

All data needed to reconstruct the image is available on-chain via `additional_metadata`, so positions remain readable even if the image server is unavailable.

## Metadata JSON

The URI in the token metadata serves standard JSON that wallets and indexers read:

```json
{
  "name": "BTCUSDT Binance YES — Settled",
  "symbol": "stYES",
  "description": "Will BTCUSDT funding rate on Binance at 2026-03-19 16:00 UTC be positive?",
  "image": "https://api.settled.pro/v1/tokens/d270b1dc.../yes/image.png",
  "external_url": "https://settled.pro/markets/binance-btcusdt",
  "attributes": [
    { "trait_type": "Platform", "value": "Settled" },
    { "trait_type": "Exchange", "value": "Binance" },
    { "trait_type": "Symbol", "value": "BTCUSDT" },
    { "trait_type": "Side", "value": "YES" },
    { "trait_type": "Settlement", "value": "2026-03-19T16:00:00Z" },
    { "trait_type": "Status", "value": "Open" },
    { "trait_type": "Oracle", "value": "Switchboard" }
  ]
}
```

After resolution, the metadata updates to include outcome, actual rate, and resolution transaction signature.

## What This Enables

- **Wallet-native** — positions visible in Phantom, Solflare, any Solana wallet
- **Explorer-readable** — question, exchange, settlement time, outcome all on-chain
- **Composable** — DEXes, aggregators, and portfolio trackers understand the tokens
- **Secondary markets** — YES/NO tokens tradeable on Jupiter or Raydium
- **Audit-friendly** — fully on-chain prediction market with oracle-verified resolution

## Costs

| Item | Cost per market |
|------|----------------|
| MarketState PDA | 0.003 SOL |
| YES Mint + metadata | 0.004 SOL |
| NO Mint + metadata | 0.004 SOL |
| **Total** | **0.011 SOL** |

User pays rent on first trade (lazy creation). Rent is reclaimable when the market is closed.
