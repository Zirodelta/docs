---
title: Building a Trading Bot
description: Automate funding rate prediction with a Python or TypeScript bot
sidebar_position: 1
---

# Building a Trading Bot

This guide walks through building a bot that scans for mispriced markets and trades automatically.

## Strategy overview

1. Fetch all open series from the API
2. Compare the OU model's prior (opening price) to the current market price
3. When the gap exceeds a threshold, place a trade
4. Track positions and P&L

## Setup

**Python:**

```bash
pip install aiohttp
```

**TypeScript:**

```bash
npm install node-fetch
```

## Step 1: Fetch open markets

**Python:**

```python
import aiohttp

API = 'https://api.settled.pro/v1'
KEY = 'stld_YOUR_KEY'

async def get_open_series():
    async with aiohttp.ClientSession() as session:
        async with session.get(f'{API}/series?limit=100',
                               headers={'X-API-Key': KEY}) as res:
            data = await res.json()
            return [s for s in data['data']
                    if s.get('current_round', {}).get('status') == 'open']
```

**TypeScript:**

```typescript
const API = 'https://api.settled.pro/v1'
const KEY = 'stld_YOUR_KEY'

async function getOpenSeries() {
  const res = await fetch(`${API}/series?limit=100`, {
    headers: { 'X-API-Key': KEY }
  })
  const { data } = await res.json()
  return data.filter((s: any) => s.current_round?.status === 'open')
}
```

## Step 2: Score opportunities

The OU model sets the opening price. If the current price diverges from the OU prior, there may be edge.

```python
def score_opportunity(series):
    round = series['current_round']
    ou_prior = float(round['ou_prior'])
    current_yes = float(round['yes_price'])
    confidence = float(round['ou_confidence'])

    # Gap between model and market
    gap = ou_prior - current_yes

    # Only trade when model is confident and gap is meaningful
    if confidence < 0.65:
        return None
    if abs(gap) < 0.05:
        return None

    return {
        'slug': series['slug'],
        'market_id': round['id'],
        'side': 'yes' if gap > 0 else 'no',
        'gap': abs(gap),
        'confidence': confidence,
        'price': current_yes if gap > 0 else float(round['no_price'])
    }
```

## Step 3: Execute trades

```python
async def place_trade(session, market_id, side, amount_usdc):
    async with session.post(
        f'{API}/markets/{market_id}/trade',
        headers={'X-API-Key': KEY, 'Content-Type': 'application/json'},
        json={'side': side, 'usdc_amount': str(amount_usdc)}
    ) as res:
        result = await res.json()
        if result.get('error'):
            print(f"Trade failed: {result['error']['message']}")
            return None
        trade = result['data']
        print(f"Bought {trade['shares']} {side.upper()} shares at {trade['price_per_share']}")
        return trade
```

## Step 4: Main loop

```python
import asyncio

async def run_bot():
    async with aiohttp.ClientSession() as session:
        while True:
            series_list = await get_open_series()
            opportunities = []

            for s in series_list:
                opp = score_opportunity(s)
                if opp:
                    opportunities.append(opp)

            # Sort by gap (biggest mispricing first)
            opportunities.sort(key=lambda x: x['gap'], reverse=True)

            for opp in opportunities[:3]:  # Max 3 trades per cycle
                await place_trade(
                    session,
                    opp['market_id'],
                    opp['side'],
                    amount_usdc=10.0  # Fixed size per trade
                )

            # Wait 5 minutes before next scan
            await asyncio.sleep(300)

asyncio.run(run_bot())
```

## Position sizing

Start with fixed $10 per trade. Once profitable over 50+ trades, scale to 2% of bankroll per trade.

## Next steps

- Add WebSocket subscription for real-time price updates instead of polling
- Track P&L per series and stop trading series with negative ROI
- Implement cross-exchange divergence strategies
