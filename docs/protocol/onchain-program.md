---
title: On-Chain Program
description: Settled Vault program on Solana — 24 instructions for market creation, trading, resolution, and vault management
sidebar_position: 4
---

# On-Chain Program

Program ID: `7rLM8d27AgkbFjQfJJpHzD4A5pMttD7PzMrqDiMNf7AW`

The Settled Vault program is an Anchor-based Solana program that handles all on-chain operations: market creation, LMSR trading, permissionless resolution via Switchboard oracle, and USDC vault management. All 24 instructions are grouped into four categories.

## Account Layout

### VaultState

The global vault account, initialized once. Controls all USDC custody and acts as mint authority for YES/NO tokens.

- Seeds: `["vault_state"]`
- Authority: program deployer (admin operations only)
- Holds references to the USDC mint and vault token account

### MarketState

One per market. Stores all LMSR state, timestamps, outcome, and token mint references.

- Seeds: `["market", market_id]`
- Fields:
  - `market_id` — UUID as bytes
  - `yes_shares`, `no_shares` — current LMSR quantities (i64, 6 decimals)
  - `b_param` — LMSR liquidity parameter
  - `status` — enum: Pending (0), Open (1), Closed (2), Resolving (3), Settled (4), Voided (5)
  - `outcome` — enum: None, Yes, No
  - `settlement_ts` — Unix timestamp for resolution
  - `open_ts`, `close_ts` — trading window
  - `yes_mint`, `no_mint` — Token-2022 mint pubkeys
  - `feed_hash` — Switchboard oracle feed hash (32 bytes)
  - `total_volume`, `total_fees`, `trade_count`

### UserPosition

Tracks a user's shares in a specific market (used for claim calculations alongside token balances).

- Seeds: `["user_position", market_id, user_pubkey]`
- Fields: `yes_shares`, `no_shares`, `total_cost`, `total_fees`

## PDA Derivation

| Account | Seeds | Program |
|---------|-------|---------|
| VaultState | `["vault_state"]` | Settled Vault |
| MarketState | `["market", market_id_bytes]` | Settled Vault |
| UserPosition | `["user_position", market_id_bytes, user_pubkey]` | Settled Vault |
| YES Mint | `["yes_mint", market_id_bytes]` | Settled Vault |
| NO Mint | `["no_mint", market_id_bytes]` | Settled Vault |
| Vault USDC ATA | Associated Token Account of VaultState for USDC mint | Associated Token Program |

## Instructions

### Admin (4)

#### `initialize_vault`

Creates the global VaultState PDA and the vault's USDC token account. Called once during deployment.

- **Signer:** deployer (becomes vault authority)
- **Accounts:** vault_state (init), vault_usdc_ata (init), usdc_mint, system_program, token_program, associated_token_program

#### `update_vault_authority`

Transfers admin authority to a new pubkey.

- **Signer:** current authority
- **Args:** `new_authority: Pubkey`

#### `set_market_params`

Updates global parameters (default b value, fee rate, trading window offsets).

- **Signer:** authority
- **Args:** `default_b: Option<i64>`, `fee_bps: Option<u16>`, `close_offset_secs: Option<i64>`

#### `emergency_pause`

Pauses all trading across all markets. Markets can still be resolved and claimed.

- **Signer:** authority

### Market Lifecycle (8)

#### `create_market`

Creates a MarketState PDA, YES token mint (Token-2022), and NO token mint (Token-2022) with full on-chain metadata.

- **Signer:** authority
- **Args:** `market_id: [u8; 16]`, `settlement_ts: i64`, `open_ts: i64`, `close_ts: i64`, `b_param: i64`, `question: String`, `exchange: String`, `symbol: String`, `feed_hash: [u8; 32]`
- **Accounts:** market_state (init), yes_mint (init), no_mint (init), vault_state, token_2022_program, system_program

The YES and NO mints are initialized with Token-2022 metadata extension containing the market question, exchange, symbol, settlement time, and feed hash — all on-chain.

#### `open_market`

Transitions a market from Pending to Open. Trading begins.

- **Signer:** authority
- **Args:** `market_id: [u8; 16]`

#### `close_market`

Transitions a market from Open to Closed. Trading stops. Called automatically 5 minutes before settlement.

- **Signer:** authority
- **Args:** `market_id: [u8; 16]`

#### `resolve_market`

Authority-based resolution (legacy path). Sets outcome based on provided rate.

- **Signer:** authority
- **Args:** `market_id: [u8; 16]`, `outcome: Outcome`, `actual_rate: i64`

#### `resolve_market_permissionless`

Permissionless resolution via Switchboard oracle proof. **No authority key required.** See [Permissionless Resolution](/protocol/permissionless-resolution).

- **Signer:** resolver (anyone — pays gas, receives tip)
- **Args:** `market_id: [u8; 16]`, `secp_ix_index: u8`
- **Accounts:** market_state, oracle_feed, instructions_sysvar, resolver, vault_usdc_ata, resolver_usdc_ata, usdc_mint, token_program

#### `void_market`

Voids a market when oracle data is insufficient. All positions are refunded at cost.

- **Signer:** authority
- **Args:** `market_id: [u8; 16]`

#### `settle_market`

Final settlement step — transitions from Resolving to Settled. Enables claims.

- **Signer:** authority
- **Args:** `market_id: [u8; 16]`

#### `update_market_metadata`

Updates the Token-2022 metadata on YES/NO mints (e.g., status field after resolution).

- **Signer:** authority (VaultState PDA signs via CPI)
- **Args:** `market_id: [u8; 16]`, `field: String`, `value: String`

### Trading (8)

#### `buy_shares`

Transfers USDC from user to vault, computes shares via LMSR cost function, mints YES or NO Token-2022 tokens to user's ATA.

- **Signer:** user
- **Args:** `market_id: [u8; 16]`, `side: Side`, `usdc_amount: u64`
- **Accounts:** market_state, vault_state, vault_usdc_ata, user_usdc_ata, user_position (init_if_needed), yes_mint or no_mint, user_share_ata, token_program, token_2022_program

Market must be Open. Fee is deducted from `usdc_amount` before computing shares.

#### `sell_shares`

Burns YES or NO tokens from user's ATA, computes USDC proceeds via LMSR, transfers USDC from vault to user.

- **Signer:** user (signs the token burn)
- **Args:** `market_id: [u8; 16]`, `side: Side`, `shares: u64`
- **Accounts:** market_state, vault_state, vault_usdc_ata, user_usdc_ata, user_position, yes_mint or no_mint, user_share_ata, token_program, token_2022_program

#### `claim_position`

After resolution, burns winning tokens and transfers USDC payout. Fully trustless — no authority required.

- **Signer:** user
- **Args:** `market_id: [u8; 16]`
- **Accounts:** market_state, vault_state, vault_usdc_ata, user_usdc_ata, user_position, winning_mint, user_winning_ata, token_program, token_2022_program

Payout = `tokens_burned * (1 - fee)`. The program checks market status is Resolved and the user holds winning-side tokens.

#### `claim_voided`

Refunds positions at cost for voided markets.

- **Signer:** user
- **Args:** `market_id: [u8; 16]`

#### `ensure_onchain`

Lazily initializes a market's on-chain PDA if it hasn't been created yet. Called before first trade.

- **Signer:** user (pays rent)
- **Args:** `market_id: [u8; 16]`

#### `create_user_ata`

Creates a user's Associated Token Account for a YES or NO mint if it doesn't exist.

- **Signer:** user (pays rent)
- **Args:** `market_id: [u8; 16]`, `side: Side`

#### `close_user_position`

Closes a user's position account after claiming, reclaiming rent.

- **Signer:** user
- **Args:** `market_id: [u8; 16]`

#### `close_market_accounts`

Closes a settled/voided market's token mint accounts and reclaims rent. Only callable after all positions are claimed.

- **Signer:** authority
- **Args:** `market_id: [u8; 16]`

### Vault (4)

#### `deposit`

Transfers USDC from user's wallet to the vault. Credits the user's on-chain balance.

- **Signer:** user
- **Args:** `amount: u64`

#### `withdraw`

Transfers USDC from vault to user's wallet. Debits the user's on-chain balance.

- **Signer:** user
- **Args:** `amount: u64`

#### `vault_sweep`

Moves excess USDC from vault to a designated treasury account (protocol revenue).

- **Signer:** authority
- **Args:** `amount: u64`

#### `vault_stats`

Read-only instruction that emits vault statistics (total deposits, total fees collected, active markets) via program logs.

- **Signer:** anyone

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | `MarketNotOpen` | Market is not in Open status |
| 6001 | `MarketNotClosed` | Market is not in Closed status |
| 6002 | `MarketNotResolved` | Attempting to claim before resolution |
| 6003 | `InsufficientBalance` | Not enough USDC or shares |
| 6004 | `InvalidSide` | Side must be Yes or No |
| 6005 | `MathOverflow` | Arithmetic overflow in LMSR computation |
| 6006 | `InvalidOracleProof` | Switchboard signature verification failed |
| 6007 | `FeedHashMismatch` | Oracle feed doesn't match market's expected feed |
| 6008 | `MarketNotSettled` | Market settlement time has not passed |
| 6009 | `AlreadyResolved` | Market already has an outcome |
| 6010 | `NoPosition` | User has no position in this market |
| 6011 | `WrongSide` | User holds losing-side tokens |
| 6012 | `Paused` | Trading is paused by admin |

## IDL

The program IDL is available at:
- On-chain: `anchor idl fetch 7rLM8d27AgkbFjQfJJpHzD4A5pMttD7PzMrqDiMNf7AW`
- TypeScript types are generated by Anchor and used by the frontend SDK
