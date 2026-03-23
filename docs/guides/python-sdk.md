---
title: Python SDK
description: Python client library for the Settled API (under development)
sidebar_position: 3
---

# Python SDK

:::note
The Python SDK is under development. In the meantime, use the REST API directly with `requests` or `aiohttp`.
:::

## Planned features

- Typed dataclasses for all API models
- Async and sync client variants
- WebSocket consumer with auto-reconnect
- Built-in rate limit handling
- P&L calculation helpers

## Installation (coming soon)

```bash
pip install settled-sdk
```

## Preview

```python
from settled import SettledClient

client = SettledClient(api_key='stld_YOUR_KEY')

# Fetch open series
series = client.series.list(limit=20)

# Place a trade
trade = client.markets.trade('8166597e-...', side='yes', usdc_amount=10.0)

# Async variant
async with AsyncSettledClient(api_key='stld_YOUR_KEY') as client:
    series = await client.series.list(limit=20)
```

Want to contribute? The SDK will be open-source on [GitHub](https://github.com/Zirodelta/settled-sdk-python).
