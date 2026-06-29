"""
Trader Desk — FastAPI backend.

Single upstream: Yahoo Finance public chart endpoint. One call per symbol
returns both the current quote (meta) and the intraday series, so we use it
for quotes, single-symbol detail, and candles.

The browser never calls Yahoo directly — every request is proxied here so we
own the User-Agent, retries, rate limiting, and a short TTL cache.
"""
from __future__ import annotations

import asyncio
import time
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) TraderDesk/1.0"

# The 8 tracked symbols. Order is the watchlist order.
SYMBOLS: list[dict[str, str]] = [
    {"symbol": "NVDA", "name": "NVIDIA Corp", "asset_class": "equity"},
    {"symbol": "AAPL", "name": "Apple Inc", "asset_class": "equity"},
    {"symbol": "TSLA", "name": "Tesla Inc", "asset_class": "equity"},
    {"symbol": "MSFT", "name": "Microsoft Corp", "asset_class": "equity"},
    {"symbol": "BTC-USD", "name": "Bitcoin", "asset_class": "crypto"},
    {"symbol": "ETH-USD", "name": "Ethereum", "asset_class": "crypto"},
    {"symbol": "SOXL", "name": "Direxion Semi Bull 3X", "asset_class": "etf"},
    {"symbol": "SPY", "name": "SPDR S&P 500 ETF", "asset_class": "etf"},
]
SYMBOL_SET = {s["symbol"] for s in SYMBOLS}
NAME_BY_SYMBOL = {s["symbol"]: s["name"] for s in SYMBOLS}

CACHE_TTL = 5.0  # seconds — be polite to upstream, smooth bursty UI polling

# Allowed range/interval pairs for the candles endpoint.
RANGE_INTERVAL = {
    "1d": "5m",
    "5d": "15m",
    "1mo": "1d",
    "3mo": "1d",
    "1y": "1wk",
}

# ---------------------------------------------------------------------------
# App + tiny in-process cache
# ---------------------------------------------------------------------------

app = FastAPI(title="Trader Desk", version="1.0")

app.add_middleware(
    CORSMiddleware,
    # Static server (8080) and Vite (5173) covered; tighten in production.
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)

_cache: dict[str, tuple[float, Any]] = {}


async def _fetch_chart(client: httpx.AsyncClient, symbol: str, rng: str, interval: str) -> dict:
    """Fetch one symbol's chart payload with a TTL cache + one retry."""
    key = f"{symbol}:{rng}:{interval}"
    now = time.time()
    hit = _cache.get(key)
    if hit and now - hit[0] < CACHE_TTL:
        return hit[1]

    url = YAHOO_CHART.format(symbol=symbol)
    params = {"range": rng, "interval": interval, "includePrePost": "false"}
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            r = await client.get(url, params=params, timeout=8.0)
            r.raise_for_status()
            data = r.json()
            result = data.get("chart", {}).get("result")
            if not result:
                err = data.get("chart", {}).get("error")
                raise ValueError(err or "empty result")
            payload = result[0]
            _cache[key] = (now, payload)
            return payload
        except Exception as exc:  # noqa: BLE001 - normalize to per-symbol error
            last_exc = exc
            await asyncio.sleep(0.4 * (attempt + 1))
    raise last_exc or RuntimeError("fetch failed")


def _round(v: Any, n: int = 2) -> float | None:
    return round(float(v), n) if isinstance(v, (int, float)) else None


def _quote_from_payload(symbol: str, payload: dict, spark_points: int = 40) -> dict:
    """Reduce a Yahoo chart payload to our quote shape."""
    meta = payload.get("meta", {})
    price = meta.get("regularMarketPrice")
    prev = meta.get("chartPreviousClose") or meta.get("previousClose")
    change = change_pct = None
    if isinstance(price, (int, float)) and isinstance(prev, (int, float)) and prev:
        change = price - prev
        change_pct = change / prev * 100

    # downsample the intraday closes into a small sparkline
    closes = (
        payload.get("indicators", {}).get("quote", [{}])[0].get("close", []) or []
    )
    closes = [c for c in closes if isinstance(c, (int, float))]
    spark: list[float] = []
    if closes:
        step = max(1, len(closes) // spark_points)
        spark = [round(c, 4) for c in closes[::step]][-spark_points:]

    return {
        "symbol": symbol,
        "name": NAME_BY_SYMBOL.get(symbol, meta.get("shortName", symbol)),
        "price": _round(price, 4),
        "prev_close": _round(prev, 4),
        "change": _round(change, 4),
        "change_pct": _round(change_pct, 2),
        "day_high": _round(meta.get("regularMarketDayHigh"), 4),
        "day_low": _round(meta.get("regularMarketDayLow"), 4),
        "volume": meta.get("regularMarketVolume"),
        "week52_high": _round(meta.get("fiftyTwoWeekHigh"), 4),
        "week52_low": _round(meta.get("fiftyTwoWeekLow"), 4),
        "currency": meta.get("currency", "USD"),
        "market_time": meta.get("regularMarketTime"),
        "spark": spark,
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "upstream": "yahoo-finance", "cached_keys": len(_cache)}


@app.get("/api/symbols")
async def symbols() -> list[dict]:
    return SYMBOLS


@app.get("/api/quotes")
async def quotes() -> dict:
    """Current quote + intraday sparkline for all tracked symbols, concurrently.

    Per-symbol failures are isolated: a bad upstream symbol returns an
    {symbol, error} entry while the rest still load.
    """
    async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}) as client:
        async def one(sym: str) -> dict:
            try:
                payload = await _fetch_chart(client, sym, "1d", "5m")
                return _quote_from_payload(sym, payload)
            except Exception as exc:  # noqa: BLE001
                return {"symbol": sym, "name": NAME_BY_SYMBOL.get(sym, sym),
                        "error": str(exc)[:160]}

        results = await asyncio.gather(*(one(s["symbol"]) for s in SYMBOLS))

    ok = [q for q in results if "error" not in q]
    return {
        "as_of": int(time.time()),
        "ok_count": len(ok),
        "total": len(SYMBOLS),
        "quotes": results,
    }


@app.get("/api/quotes/{symbol}")
async def quote_detail(symbol: str) -> dict:
    symbol = symbol.upper()
    # crypto symbols carry a -USD suffix; preserve user-supplied case via set
    match = next((s for s in SYMBOL_SET if s.upper() == symbol), None)
    if match is None:
        raise HTTPException(404, f"untracked symbol: {symbol}")

    async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}) as client:
        try:
            payload = await _fetch_chart(client, match, "1d", "5m")
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(502, f"upstream error for {match}: {exc}") from exc

    quote = _quote_from_payload(match, payload, spark_points=120)
    ts = payload.get("timestamp", []) or []
    closes = (
        payload.get("indicators", {}).get("quote", [{}])[0].get("close", []) or []
    )
    series = [
        {"t": int(t), "price": round(float(c), 4)}
        for t, c in zip(ts, closes)
        if isinstance(c, (int, float))
    ]
    quote["series"] = series
    return quote


@app.get("/api/candles/{symbol}")
async def candles(symbol: str, range: str = "1d") -> dict:
    symbol = symbol.upper()
    match = next((s for s in SYMBOL_SET if s.upper() == symbol), None)
    if match is None:
        raise HTTPException(404, f"untracked symbol: {symbol}")
    if range not in RANGE_INTERVAL:
        raise HTTPException(400, f"unsupported range: {range}; "
                                 f"use one of {list(RANGE_INTERVAL)}")

    interval = RANGE_INTERVAL[range]
    async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}) as client:
        try:
            payload = await _fetch_chart(client, match, range, interval)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(502, f"upstream error for {match}: {exc}") from exc

    ts = payload.get("timestamp", []) or []
    q = payload.get("indicators", {}).get("quote", [{}])[0]
    o, h, l, c, v = (q.get(k, []) for k in ("open", "high", "low", "close", "volume"))
    candles_out = []
    for i, t in enumerate(ts):
        row = {k: (o, h, l, c)[j][i] if i < len((o, h, l, c)[j]) else None
               for j, k in enumerate(("o", "h", "l", "c"))}
        if row["c"] is None:
            continue
        candles_out.append({
            "t": int(t),
            "o": _round(row["o"], 4), "h": _round(row["h"], 4),
            "l": _round(row["l"], 4), "c": _round(row["c"], 4),
            "v": v[i] if i < len(v) else None,
        })

    return {
        "symbol": match,
        "range": range,
        "interval": interval,
        "currency": payload.get("meta", {}).get("currency", "USD"),
        "candles": candles_out,
    }
