# THE PIT — Trader Desk

A multi-panel trading terminal. **Python FastAPI backend** proxying real
market data + a **separate zero-build frontend** rendering an asymmetric
trading floor.

## Concept — "THE PIT" terminal

Not a card grid. An asymmetric, dense terminal modeled on a real trading
desk, with five functional regions:

| Region | What it does |
|--------|--------------|
| **1 · Header** | Desk identity, live clock, market **breadth** (advancers / decliners / unchanged), connection status dot |
| **2 · Watchlist rail** (left) | All 8 symbols as dense monospace rows — price, % change, inline sparkline. The navigation spine; click to drive the stage |
| **3 · Main stage** (center) | Large SVG **candlestick chart** for the selected symbol, timeframe switch (1D / 5D / 1M / 3M / 1Y), big price readout, crosshair OHLC readout |
| **4 · Stats + Tape** (right) | Session stats, a 52-week range bar, and a live **tape of prints** built from the intraday series |
| **5 · Ticker** (footer) | Scrolling marquee of every symbol |

Palette: amber-on-near-black, monospace numerics, all readable text ≥ 20px.

## Data

Single upstream — **Yahoo Finance public chart endpoint** — proxied entirely
through the backend. One upstream call per symbol yields both the live quote
and the intraday/OHLC series. The browser never calls Yahoo directly. See
[`backend/data_sources.json`](backend/data_sources.json).

Symbols: **NVDA, AAPL, TSLA, MSFT, BTC-USD, ETH-USD, SOXL, SPY**.

## API

| Route | Returns |
|-------|---------|
| `GET /health` | `{status, upstream, cached_keys}` |
| `GET /api/symbols` | tracked symbols + asset class |
| `GET /api/quotes` | live quote + sparkline for all 8 (per-symbol errors isolated) |
| `GET /api/quotes/{symbol}` | one symbol + full intraday `series[]` + 52-wk range |
| `GET /api/candles/{symbol}?range=1d\|5d\|1mo\|3mo\|1y` | OHLC candles for the chart |

## Run it

```bash
# terminal 1 — backend
cd trader-desk/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# terminal 2 — frontend (static, no build step)
cd trader-desk/frontend
python3 -m http.server 8080
```

Open **http://localhost:8080** — quotes load from the backend at
`http://localhost:8000`. (CORS is pre-configured for ports 8080 and 5173.)

### Quick backend check

```bash
curl localhost:8000/health
curl localhost:8000/api/quotes | python3 -m json.tool
```

## Notes

- **No fake/hardcoded prices.** All quotes come from the live upstream. If a
  single symbol's upstream fails it shows `ERR` in the watchlist while the rest
  keep working; if the whole backend is down the UI shows a connection-error
  state.
- Backend owns the upstream User-Agent, a 5s TTL cache, and one retry with
  backoff for rate-limit politeness.
- Tech: FastAPI + httpx (async, concurrent fetches). Frontend is plain
  HTML/CSS/JS — no framework, no build.
