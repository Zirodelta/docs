---
title: Running a Resolver
description: Run a permissionless resolver daemon to earn USDC by resolving Settled prediction markets
sidebar_position: 6
---

# Running a Resolver

The Settled resolver is a standalone daemon that scans Solana for closed markets past their settlement time, submits `resolve_market_permissionless` transactions, and earns a 10 bps USDC tip per resolution.

The resolver is open-source and stateless — if it crashes, restart it. It re-scans on boot.

## Quick Start

### 1. Prerequisites

- Go 1.22+ (or Docker)
- A funded Solana keypair (needs SOL for gas + a USDC token account for tips)

### 2. Generate a Keypair

```bash
solana-keygen new -o resolver-keypair.json
# Fund with devnet SOL:
solana airdrop 2 $(solana-keygen pubkey resolver-keypair.json) --url devnet
```

### 3. Configure

```bash
cp .env.example .env
# Edit .env — set SOLANA_RPC_URL and RESOLVER_KEYPAIR at minimum
```

### 4. Run

**With Go:**
```bash
make run
```

**With Docker:**
```bash
docker compose up -d
```

**One-liner with Docker:**
```bash
docker run -d \
  -e SOLANA_RPC_URL=https://api.devnet.solana.com \
  -e RESOLVER_KEYPAIR=/keys/resolver-keypair.json \
  -v $(pwd)/resolver-keypair.json:/keys/resolver-keypair.json \
  ghcr.io/settled-pro/resolver:latest
```

### 5. Verify

Logs show scanned markets and submitted transactions:

```
INFO  starting settled resolver  {"program_id": "7rLM...", "resolver": "YourKey...", "poll_interval": "30s"}
INFO  found resolvable markets   {"count": 2}
INFO  transaction submitted      {"market_id": "abc123...", "signature": "5xK..."}
INFO  transaction confirmed      {"market_id": "abc123...", "signature": "5xK..."}
```

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SOLANA_RPC_URL` | Yes | — | Solana RPC endpoint (Helius, QuickNode, Triton, or public) |
| `RESOLVER_KEYPAIR` | Yes | — | Path to JSON keypair file or base58 private key |
| `PROGRAM_ID` | No | `7rLM8d27...` | Settled program ID |
| `POLL_INTERVAL` | No | `30s` | How often to scan for resolvable markets |
| `LOG_LEVEL` | No | `info` | `debug`, `info`, `warn`, `error` |
| `DRY_RUN` | No | `false` | Log resolvable markets without submitting transactions |
| `SWITCHBOARD_GATEWAY` | No | (default) | Override Switchboard gateway URL |
| `METRICS_PORT` | No | `9090` | Prometheus metrics endpoint |

## How It Works

```
┌──────────┐     ┌───────────────┐     ┌───────────┐
│ Scanner  │────▶│  Switchboard  │────▶│ Submitter │
│          │     │  Quote Fetch  │     │           │
│ Polls    │     │               │     │ Build TX  │
│ Solana   │     │ Oracle proof  │     │ Sign+Send │
│ every    │     │ for each      │     │           │
│ 30s      │     │ market        │     │           │
└──────────┘     └───────────────┘     └───────────┘
      ▲                                      │
      │            Solana RPC               │
      └──────────────────────────────────────┘
```

### 1. Scan

The scanner calls `getProgramAccounts` with memcmp filters to find MarketState accounts with `status = Closed` (byte offset 132, value 2).

```go
accounts := rpc.GetProgramAccountsWithOpts(programID, {
    Filters: []rpc.RPCFilter{
        // 8-byte Anchor discriminator for MarketState
        {Memcmp: &rpc.RPCFilterMemcmp{Offset: 0, Bytes: marketStateDiscriminator}},
        // Status byte = 2 (Closed)
        {Memcmp: &rpc.RPCFilterMemcmp{Offset: 132, Bytes: []byte{2}}},
    },
})
```

### 2. Filter

Only markets where the current time is past `settlement_ts` are eligible for resolution.

### 3. Resolve

For each eligible market, the daemon:
1. Reads the market's `feed_hash` to identify the Switchboard feed
2. Builds a `resolve_market_permissionless` instruction with the oracle feed account
3. Signs and submits the transaction
4. Waits for finalized confirmation

### 4. Repeat

Sleeps for `POLL_INTERVAL`, then scans again. Failed resolutions (already resolved, oracle unavailable) are logged and skipped.

## Architecture

```
cmd/resolver/main.go        — entry point, config, signal handling, main loop
internal/scanner/            — getProgramAccounts with memcmp filters
internal/resolver/           — TX building, signing, submission, confirmation
internal/switchboard/        — Switchboard feed interaction
pkg/pda/                     — PDA derivation (vault_state, market_state, ATAs)
pkg/state/                   — MarketState account deserialization
pkg/types/                   — constants, enums
```

### Design Principles

**No Postgres, no ClickHouse.** The resolver reads only from Solana RPC. `getProgramAccounts` is the entire "database."

**Stateless.** No local state file. If it crashes, restart it. Duplicate resolve attempts fail gracefully — the market is already resolved, the transaction reverts, the daemon logs and moves on.

**Minimal dependencies:**
- `github.com/gagliardetto/solana-go` — Solana RPC + TX building
- `go.uber.org/zap` — structured logging
- No web frameworks, no databases

## Economics

### Revenue

Resolvers earn 10 basis points (0.1%) of a market's accumulated trading fees per resolution.

| Market Volume | Fees (1%) | Resolver Tip (0.1% of fees) |
|--------------|-----------|---------------------------|
| $100 | $1.00 | $0.001 |
| $1,000 | $10.00 | $0.01 |
| $10,000 | $100.00 | $0.10 |

### Costs

| Cost | Amount |
|------|--------|
| SOL gas per resolution TX | ~0.000005 SOL (~$0.001) |
| RPC calls per scan cycle | ~1 `getProgramAccounts` call |
| Server (if running 24/7) | Minimal — single Go binary, under 50MB RAM |

### Profitability

At current volumes, running a resolver is primarily useful for:
- Ensuring markets resolve promptly (protocol health)
- Earning small USDC tips at scale across many markets
- Supporting the network as an operator

The Settled oracle daemon also resolves markets as a fallback, so resolvers compete with it and each other. First valid transaction wins.

## Monitoring

The resolver exposes Prometheus metrics on `METRICS_PORT` (default 9090):

| Metric | Type | Description |
|--------|------|-------------|
| `resolver_markets_scanned` | Counter | Total markets found in scan cycles |
| `resolver_markets_resolved` | Counter | Successfully resolved markets |
| `resolver_tx_failures` | Counter | Failed resolution attempts |
| `resolver_tips_earned_usdc` | Gauge | Total USDC tips earned |
| `resolver_scan_duration_ms` | Histogram | Time per scan cycle |

## FAQ

### What happens if multiple resolvers submit at the same time?

The first valid transaction confirmed on Solana wins. All other attempts revert with `AlreadyResolved` — the losing resolvers waste gas but no harm is done. The daemon logs these failures and moves on.

### What if Switchboard is down?

The resolution fails and is retried on the next scan cycle. The Settled oracle daemon can still resolve via the authority-based `resolve_market` instruction as a fallback.

### Do I need to run this 24/7?

No. The daemon scans on startup and finds all pending resolutions. You can run it intermittently. Markets that aren't resolved by any external resolver are resolved by the Settled daemon.

### What RPC provider should I use?

Any Solana RPC that supports `getProgramAccounts` with memcmp filters. Helius, QuickNode, and Triton all work. The public endpoint (`api.devnet.solana.com`) works for devnet but may be rate-limited on mainnet.

### Is the resolver open source?

Yes. Apache-2.0 license. Repository: `settled-pro/resolver` on GitHub.
