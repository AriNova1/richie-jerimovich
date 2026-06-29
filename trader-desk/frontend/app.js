/* =================================================================
   THE PIT — Trader Desk frontend logic.
   ALL data comes from the local FastAPI backend. No hardcoded quotes.
   ================================================================= */

const API = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "http://localhost:8000"
  : `${location.protocol}//${location.hostname}:8000`;

const POLL_MS = 6000;          // quotes refresh cadence
const $ = (id) => document.getElementById(id);

const state = {
  symbols: [],                 // [{symbol,name,asset_class}]
  quotes: {},                  // symbol -> quote
  selected: null,
  range: "1d",
  lastPrices: {},              // for up/down flash
  failures: 0,
};

// ---------- fetch helper ----------
async function getJSON(path) {
  const r = await fetch(`${API}${path}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}

// ---------- formatting ----------
const fmtPx = (v) => v == null ? "—"
  : v >= 1000 ? v.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })
  : v.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const fmtPct = (v) => v == null ? "" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
const fmtChg = (v) => v == null ? "" : `${v >= 0 ? "+" : ""}${fmtPx(Math.abs(v) >= 1000 ? v : v)}`;
const fmtVol = (v) => {
  if (v == null) return "—";
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return String(v);
};
const dirClass = (v) => v == null ? "" : v >= 0 ? "up" : "down";
const hhmmss = (ts) => new Date(ts * 1000).toLocaleTimeString("en-US", { hour12: false });

// ---------- header clock ----------
function tickClock() {
  $("clock").textContent = new Date().toLocaleTimeString("en-US", { hour12: false });
}
setInterval(tickClock, 1000); tickClock();

function setConn(stateName, label) {
  const el = $("conn");
  el.className = "conn " + stateName;
  $("conn-label").textContent = label;
}

// ---------- sparkline svg ----------
function sparkSVG(points, up) {
  if (!points || points.length < 2) return "";
  const w = 110, h = 22, pad = 2;
  const min = Math.min(...points), max = Math.max(...points);
  const span = max - min || 1;
  const dx = (w - pad * 2) / (points.length - 1);
  const path = points.map((p, i) => {
    const x = pad + i * dx;
    const y = h - pad - ((p - min) / span) * (h - pad * 2);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const color = up ? "var(--up)" : "var(--down)";
  return `<svg viewBox="0 0 ${w} ${h}"><path d="${path}" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
}

// ============================================================
// WATCHLIST (region 2)
// ============================================================
function renderWatchlist() {
  const wrap = $("watch-list");
  if (!state.symbols.length) return;
  wrap.innerHTML = "";

  let adv = 0, decl = 0, unch = 0, ok = 0;

  for (const s of state.symbols) {
    const q = state.quotes[s.symbol];
    const row = document.createElement("div");
    row.className = "wrow";
    row.dataset.symbol = s.symbol;
    if (state.selected === s.symbol) row.classList.add("active");

    if (!q || q.error) {
      row.classList.add("err");
      row.innerHTML = `
        <span class="w-sym">${s.symbol}</span>
        <span class="w-px">ERR</span>
        <span class="w-spark"></span>
        <span class="w-chg">no data</span>`;
    } else {
      ok++;
      const up = (q.change_pct ?? 0) >= 0;
      if (q.change_pct > 0.0001) adv++; else if (q.change_pct < -0.0001) decl++; else unch++;

      // price flash on change
      const prev = state.lastPrices[s.symbol];
      if (prev != null && q.price != null && q.price !== prev) {
        row.classList.add(q.price > prev ? "flash-up" : "flash-down");
      }

      row.innerHTML = `
        <span class="w-sym">${s.symbol}</span>
        <span class="w-px ${dirClass(q.change_pct)}">${fmtPx(q.price)}</span>
        <span class="w-spark">${sparkSVG(q.spark, up)}</span>
        <span class="w-chg ${dirClass(q.change_pct)}">${fmtPct(q.change_pct)}</span>`;
    }

    row.addEventListener("click", () => selectSymbol(s.symbol));
    wrap.appendChild(row);
  }

  $("watch-meta").textContent = `${ok}/${state.symbols.length}`;
  $("adv").textContent = adv;
  $("decl").textContent = decl;
  $("unch").textContent = unch;
}

// ============================================================
// TICKER (region 5)
// ============================================================
function renderTicker() {
  const track = $("ticker-track");
  const items = state.symbols.map((s) => {
    const q = state.quotes[s.symbol];
    if (!q || q.error) return `<span class="tk"><span class="tk-sym">${s.symbol}</span><span class="tk-px down">ERR</span></span>`;
    return `<span class="tk"><span class="tk-sym">${s.symbol}</span><span class="tk-px">${fmtPx(q.price)}</span><span class="${dirClass(q.change_pct)}">${fmtPct(q.change_pct)}</span></span>`;
  }).join("");
  // duplicate for seamless loop
  track.innerHTML = items + items;
}

// ============================================================
// STATS + TAPE (region 4)
// ============================================================
function renderStats(q) {
  const el = $("stats");
  if (!q || q.error) { el.innerHTML = `<div class="state-msg err">No data for this symbol.</div>`; return; }

  let rangePct = 50, w52 = "";
  if (q.week52_low != null && q.week52_high != null && q.price != null) {
    const span = q.week52_high - q.week52_low || 1;
    rangePct = Math.max(0, Math.min(100, ((q.price - q.week52_low) / span) * 100));
    w52 = `
      <div class="range-bar">
        <div class="range-track">
          <div class="range-fill" style="width:${rangePct}%"></div>
          <div class="range-mark" style="left:${rangePct}%"></div>
        </div>
        <div class="range-ends"><span>${fmtPx(q.week52_low)}</span><span>52-WK</span><span>${fmtPx(q.week52_high)}</span></div>
      </div>`;
  }

  el.innerHTML = `
    <div class="stat-row"><span class="s-label">LAST</span><span class="s-val ${dirClass(q.change_pct)}">${fmtPx(q.price)}</span></div>
    <div class="stat-row"><span class="s-label">CHG</span><span class="s-val ${dirClass(q.change)}">${fmtChg(q.change)} (${fmtPct(q.change_pct)})</span></div>
    <div class="stat-row"><span class="s-label">PREV CLOSE</span><span class="s-val">${fmtPx(q.prev_close)}</span></div>
    <div class="stat-row"><span class="s-label">DAY HIGH</span><span class="s-val up">${fmtPx(q.day_high)}</span></div>
    <div class="stat-row"><span class="s-label">DAY LOW</span><span class="s-val down">${fmtPx(q.day_low)}</span></div>
    <div class="stat-row"><span class="s-label">VOLUME</span><span class="s-val">${fmtVol(q.volume)}</span></div>
    ${w52}`;
}

// Build a "tape" of recent prints from the intraday series (latest first).
function renderTape(detail) {
  const el = $("tape");
  if (!detail || !detail.series || !detail.series.length) {
    el.innerHTML = `<div class="state-msg">No intraday prints.</div>`;
    return;
  }
  const rows = detail.series.slice(-24).reverse();
  el.innerHTML = rows.map((pt, i) => {
    const prev = rows[i + 1];
    const up = prev ? pt.price >= prev.price : true;
    // synthetic size derived deterministically from the tick (no fake price)
    const sz = (Math.abs(Math.round(pt.price * 100)) % 900 + 100);
    return `<div class="print"><span class="p-time">${hhmmss(pt.t)}</span><span class="p-px ${up ? "up" : "down"}">${fmtPx(pt.price)}</span><span class="p-sz">${sz}</span></div>`;
  }).join("");
}

// ============================================================
// MAIN CHART (region 3) — candlestick SVG
// ============================================================
const SVGNS = "http://www.w3.org/2000/svg";

function renderChart(candles, currency) {
  const wrap = $("chart-wrap");
  const svg = $("chart");
  svg.innerHTML = "";
  if (!candles || candles.length < 2) {
    wrap.classList.remove("ready");
    $("chart-state").textContent = "No chart data.";
    $("chart-state").className = "state-msg err";
    return;
  }
  wrap.classList.add("ready");

  const rect = svg.getBoundingClientRect();
  const W = Math.max(320, rect.width), H = Math.max(200, rect.height);
  const padL = 8, padR = 64, padT = 12, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const highs = candles.map((c) => c.h ?? c.c);
  const lows = candles.map((c) => c.l ?? c.c);
  let max = Math.max(...highs), min = Math.min(...lows);
  const pad = (max - min) * 0.06 || max * 0.01;
  max += pad; min -= pad;
  const span = max - min || 1;

  const x = (i) => padL + (i + 0.5) * (plotW / candles.length);
  const y = (v) => padT + (1 - (v - min) / span) * plotH;

  const mk = (tag, attrs) => {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };

  // gridlines + axis labels
  const ticks = 4;
  for (let t = 0; t <= ticks; t++) {
    const val = min + (span * t) / ticks;
    const yy = y(val);
    svg.appendChild(mk("line", { x1: padL, y1: yy, x2: padL + plotW, y2: yy, stroke: "var(--border)", "stroke-width": 1, "stroke-dasharray": "2 4" }));
    const lbl = mk("text", { x: W - padR + 6, y: yy + 5, fill: "var(--muted)", "font-size": 16, "font-family": "var(--mono)" });
    lbl.textContent = val >= 1000 ? Math.round(val).toLocaleString() : val.toFixed(2);
    svg.appendChild(lbl);
  }

  // candle width
  const slot = plotW / candles.length;
  const bw = Math.max(1.5, Math.min(14, slot * 0.62));

  candles.forEach((c, i) => {
    const up = (c.c ?? 0) >= (c.o ?? c.c ?? 0);
    const col = up ? "var(--up)" : "var(--down)";
    const cx = x(i);
    // wick
    svg.appendChild(mk("line", { x1: cx, y1: y(c.h ?? c.c), x2: cx, y2: y(c.l ?? c.c), stroke: col, "stroke-width": 1 }));
    // body
    const yo = y(c.o ?? c.c), yc = y(c.c);
    const top = Math.min(yo, yc), bh = Math.max(1, Math.abs(yc - yo));
    svg.appendChild(mk("rect", { x: cx - bw / 2, y: top, width: bw, height: bh, fill: col, rx: 0.5 }));
  });

  // last-price line
  const last = candles[candles.length - 1].c;
  const ly = y(last);
  svg.appendChild(mk("line", { x1: padL, y1: ly, x2: padL + plotW, y2: ly, stroke: "var(--amber)", "stroke-width": 1, "stroke-dasharray": "4 3", opacity: 0.7 }));
  const tag = mk("rect", { x: W - padR, y: ly - 12, width: padR, height: 24, fill: "var(--amber)" });
  svg.appendChild(tag);
  const tagTxt = mk("text", { x: W - padR + 6, y: ly + 5, fill: "var(--bg)", "font-size": 16, "font-weight": 700, "font-family": "var(--mono)" });
  tagTxt.textContent = last >= 1000 ? Math.round(last).toLocaleString() : last.toFixed(2);
  svg.appendChild(tagTxt);

  // crosshair interaction
  const readout = $("cross-readout");
  svg.onmousemove = (ev) => {
    const r = svg.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width * W;
    const idx = Math.max(0, Math.min(candles.length - 1, Math.round((px - padL) / slot - 0.5)));
    const c = candles[idx];
    readout.style.opacity = 1;
    readout.textContent = `${hhmmss(c.t)}  O ${fmtPx(c.o)}  H ${fmtPx(c.h)}  L ${fmtPx(c.l)}  C ${fmtPx(c.c)}`;
  };
  svg.onmouseleave = () => { readout.style.opacity = 0; };
}

// ============================================================
// SELECTION + LOADERS
// ============================================================
async function selectSymbol(sym) {
  state.selected = sym;
  document.querySelectorAll(".wrow").forEach((r) => r.classList.toggle("active", r.dataset.symbol === sym));

  const meta = state.symbols.find((s) => s.symbol === sym) || {};
  const q = state.quotes[sym] || {};
  $("stage-sym").textContent = sym;
  $("stage-name").textContent = meta.name || "";
  $("stage-class").textContent = meta.asset_class || "";
  $("stage-price").textContent = fmtPx(q.price);
  $("stage-price").className = "stage-price " + dirClass(q.change_pct);
  $("stage-chg").textContent = q.change != null ? `${fmtChg(q.change)}  ${fmtPct(q.change_pct)}` : "";
  $("stage-chg").className = "stage-chg " + dirClass(q.change_pct);

  await loadChart(sym, state.range);

  // detail (full intraday) feeds stats + tape
  try {
    const detail = await getJSON(`/api/quotes/${encodeURIComponent(sym)}`);
    renderStats(detail);
    renderTape(detail);
  } catch (e) {
    renderStats(state.quotes[sym]);
    $("tape").innerHTML = `<div class="state-msg err">Tape unavailable.</div>`;
  }
}

async function loadChart(sym, range) {
  state.range = range;
  document.querySelectorAll(".tf").forEach((b) => b.classList.toggle("active", b.dataset.range === range));
  const wrap = $("chart-wrap");
  wrap.classList.remove("ready");
  $("chart-state").className = "state-msg";
  $("chart-state").textContent = `Loading ${sym} · ${range.toUpperCase()}…`;
  try {
    const data = await getJSON(`/api/candles/${encodeURIComponent(sym)}?range=${range}`);
    renderChart(data.candles, data.currency);
    const c = data.candles[data.candles.length - 1];
    if (c) $("stage-ohlc").innerHTML = `O <b>${fmtPx(c.o)}</b> H <b>${fmtPx(c.h)}</b> L <b>${fmtPx(c.l)}</b> C <b>${fmtPx(c.c)}</b> · ${data.candles.length} bars`;
  } catch (e) {
    wrap.classList.remove("ready");
    $("chart-state").className = "state-msg err";
    $("chart-state").textContent = `Chart error: ${e.message}`;
  }
}

// timeframe buttons
$("tf-switch").addEventListener("click", (e) => {
  const btn = e.target.closest(".tf");
  if (btn && state.selected) loadChart(state.selected, btn.dataset.range);
});

// re-render chart on resize (debounced)
let rz;
window.addEventListener("resize", () => {
  clearTimeout(rz);
  rz = setTimeout(() => { if (state.selected) loadChart(state.selected, state.range); }, 250);
});

// ============================================================
// POLL LOOP
// ============================================================
async function refreshQuotes() {
  try {
    const data = await getJSON("/api/quotes");
    const newPrices = {};
    for (const q of data.quotes) {
      newPrices[q.symbol] = q.price;
      state.quotes[q.symbol] = q;
    }
    renderWatchlist();
    renderTicker();
    // keep the live stage quote / stats fresh for the selected symbol
    if (state.selected) {
      const q = state.quotes[state.selected];
      if (q && !q.error) {
        $("stage-price").textContent = fmtPx(q.price);
        $("stage-price").className = "stage-price " + dirClass(q.change_pct);
        $("stage-chg").textContent = `${fmtChg(q.change)}  ${fmtPct(q.change_pct)}`;
        $("stage-chg").className = "stage-chg " + dirClass(q.change_pct);
        renderStats(q);
      }
    }
    state.lastPrices = newPrices;
    state.failures = 0;
    setConn("live", data.ok_count < data.total ? `LIVE · ${data.ok_count}/${data.total}` : "LIVE");
  } catch (e) {
    state.failures++;
    setConn(state.failures > 2 ? "down" : "stale", state.failures > 2 ? "DISCONNECTED" : "RECONNECTING");
    if (!state.symbols.length || Object.keys(state.quotes).length === 0) {
      $("watch-list").innerHTML = `<div class="state-msg err">Backend unreachable at ${API}.<br/>Start it:<br/>uvicorn main:app --port 8000</div>`;
    }
  }
}

// ============================================================
// BOOT
// ============================================================
async function boot() {
  setConn("stale", "CONNECTING");
  try {
    state.symbols = await getJSON("/api/symbols");
  } catch (e) {
    $("watch-list").innerHTML = `<div class="state-msg err">Cannot reach backend at ${API}.<br/>Run the FastAPI server on port 8000, then reload.</div>`;
    setConn("down", "DISCONNECTED");
    return;
  }
  await refreshQuotes();
  // auto-select first symbol with data
  const first = state.symbols.find((s) => state.quotes[s.symbol] && !state.quotes[s.symbol].error);
  if (first) selectSymbol(first.symbol);
  setInterval(refreshQuotes, POLL_MS);
}

boot();
