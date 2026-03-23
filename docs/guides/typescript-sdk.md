---
title: TypeScript SDK
description: TypeScript client library for the Settled API (under development)
sidebar_position: 2
---

# TypeScript SDK

:::note
The TypeScript SDK is under development. In the meantime, use the REST API directly with `fetch` or any HTTP client.
:::

## Planned features

- Full type definitions for all API responses
- SIWS authentication helper
- LMSR price calculation utilities
- WebSocket client with auto-reconnect
- Position and P&L tracking

## Installation (coming soon)

```bash
npm install @settled/sdk
```

## Preview

```typescript
import { SettledClient } from '@settled/sdk'

const client = new SettledClient({ apiKey: 'stld_YOUR_KEY' })

// Fetch open series
const series = await client.series.list({ limit: 20 })

// Place a trade
const trade = await client.markets.trade('8166597e-...', {
  side: 'yes',
  usdcAmount: 10.0
})

// Subscribe to real-time updates
client.ws.subscribe('market:8166597e-...', (msg) => {
  console.log('Price update:', msg.data.yes_price)
})
```

Want to contribute? The SDK will be open-source on [GitHub](https://github.com/Zirodelta/settled-sdk-ts).
