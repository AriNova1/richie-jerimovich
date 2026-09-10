#!/usr/bin/env node
/* ── The voice on the way in ───────────────────────────────────────
   The unit tests hold the track to the measurement and the lines to the
   export. They cannot answer the two questions that matter to a reader:
   is the dot on the machine in the RENDERED frame, at this viewport, with
   the browser's own cover crop; and did the card land where the rule says
   when the machine left. This opens the front door in Chrome (Chromium
   cannot decode the footage), walks the stops, and asks.

   Needs a server that answers Range requests: python's http.server does
   not, and Chrome cannot scrub a 20 MB all-intra file it is not allowed to
   seek inside. node scripts/review/serve.mjs 4716 serves the repo that way.

   --falsify moves the sampling point off the machine on purpose and
   requires every one of those to FAIL. A pixel test that passes on the
   wall beside the mini is not a test of anything.

   usage: node scripts/review/gate-voice.mjs [http://127.0.0.1:4716/] [--falsify] */
import { chromium } from '/Users/rickt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { miniAt, voiceAt, TRACK_END } from '../../workspace/mini-track.mjs';

const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith('http')) || 'http://127.0.0.1:4716/';
const FALSIFY = args.includes('--falsify');
const OUT = join(tmpdir(), 'gate-voice'); mkdirSync(OUT, { recursive: true });
const corpus = JSON.parse(readFileSync(new URL('../../workspace/corpus.json', import.meta.url), 'utf8'));
const results = [];
const check = (ok, what, detail = '') => { results.push({ ok, what, detail }); console.log(`${ok ? '  ✓' : '  ✗'} ${what}${detail ? `  (${detail})` : ''}`); return ok; };

/* Is there a Mac mini here? The box is warm grey under the lamp, and it
   stands on a dark desk: neutral to slightly warm, and at least half again
   as bright as the desk just below it. The wall behind it is warmer than
   that (red minus blue near 60) and the screens are blue; both fail. */
function looksLikeTheMachine(at, below) {
  const luma = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
  const [r, g, b] = at;
  const warmNeutral = r >= g - 4 && g >= b - 4 && r - b < 50;
  const standsOut = luma(at) / Math.max(1, luma(below)) > 1.5;
  return { ok: warmNeutral && standsOut, warmNeutral, standsOut, at, below };
}

async function settle(page, p) {
  await page.evaluate((p) => window.__spatial.go(p, { instant: true }), p);
  await page.waitForFunction(() => { const s = window.__spatial.snapshot(); return !s.projection.seekInFlight && Math.abs(s.projection.settledTime - s.projection.desiredTime) < 1 / 24; }, null, { timeout: 20000 });
  await page.waitForTimeout(650); /* the detach glide is .5s */
}
/* Everything the checks need, read from the page in one go. The frame
   coordinates come back through the browser's own rendered video rect, not
   through the page's maths, so a wrong cover calculation shows up here. */
async function read(page, sample) {
  return page.evaluate(({ sample }) => {
    const m = document.getElementById('mini-marker'), line = m.querySelector('.mm-line'), dotEl = m.querySelector('.mm-dot');
    const card = m.querySelector('.mm-card').getBoundingClientRect(), dot = dotEl.getBoundingClientRect();
    const film = document.getElementById('room-film');
    const w = innerWidth, h = innerHeight, W = film.videoWidth, H = film.videoHeight;
    const sc = Math.max(w / W, h / H), dw = W * sc, dh = H * sc, pos = matchMedia('(max-width:650px)').matches ? 0.42 : 0.5;
    const cx = dot.left + dot.width / 2, cy = dot.top + dot.height / 2;
    const fx = (cx - (w - dw) * pos) / dw, fy = (cy - (h - dh) * 0.5) / dh;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d'); ctx.drawImage(film, 0, 0);
    const mean = (x, y) => { const d = ctx.getImageData(Math.round(x * W) - 2, Math.round(y * H) - 2, 5, 5).data; let r = 0, g = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; } const n = d.length / 4; return [r / n, g / n, b / n].map(Math.round); };
    const samples = sample.map(([dx, dy, belowDy]) => ({ dx, dy, at: mean(fx + dx, fy + dy), below: mean(fx + dx, fy + dy + belowDy) }));
    return {
      detached: m.classList.contains('detached'), speaking: m.classList.contains('speaking'), flip: m.classList.contains('flip'),
      text: line.textContent, tier: line.dataset.tier, lineDisplay: getComputedStyle(line).display,
      dotOpacity: Number(getComputedStyle(dotEl).opacity), markerOpacity: Number(getComputedStyle(m).opacity),
      fx, fy, card: { left: card.left, top: card.top, right: card.right, bottom: card.bottom, w: card.width, h: card.height }, vw: w, vh: h, samples,
      status: document.getElementById('spatial-status').textContent,
    };
  }, { sample });
}
function contrastOf(png, rect, text = '#f2ebdd') {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', png, '-vf', `crop=${Math.round(rect.w)}:${Math.round(rect.h)}:${Math.round(rect.left)}:${Math.round(rect.top)}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 26 });
  const b = r.stdout, hist = new Map();
  for (let i = 0; i < b.length; i += 3) { const k = `${b[i] >> 2},${b[i + 1] >> 2},${b[i + 2] >> 2}`; hist.set(k, (hist.get(k) || 0) + 1); }
  const ground = [...hist.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map((v) => (+v << 2) + 2);
  const lum = ([R, G, B]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(R) + 0.7152 * f(G) + 0.0722 * f(B); };
  const L1 = lum([1, 3, 5].map((i) => parseInt(text.slice(i, i + 2), 16))), L2 = lum(ground);
  return { ratio: (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05), ground };
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
async function open(vp) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1, isMobile: vp.width < 700, hasTouch: vp.width < 700 });
  page.on('pageerror', (e) => check(false, 'page error', e.message));
  await page.goto(BASE + '?gate=' + Date.now(), { waitUntil: 'load' });
  await page.waitForFunction(() => window.__spatial?.ready, null, { timeout: 30000 });
  await page.waitForFunction(() => document.body.classList.contains('video-ready') || document.body.classList.contains('graphics-failed'), null, { timeout: 45000 });
  const failed = await page.evaluate(() => document.body.classList.contains('graphics-failed'));
  check(!failed, `${vp.width}×${vp.height}: the room film loaded`, failed ? 'graphics-failed: the server must answer Range requests' : '');
  return page;
}

/* ── Desktop ──────────────────────────────────────────────────────── */
{
  const page = await open({ width: 1440, height: 900 });
  for (const p of [0, 0.1, 0.3, 0.45, 0.5]) {
    await settle(page, p);
    const k = miniAt(p), r = await read(page, [[0, 0, k.h * 0.9]]);
    check(!r.detached, `p=${p}: attached while the machine is in frame`);
    const dx = Math.abs(r.fx - k.x), dy = Math.abs(r.fy - k.y);
    check(dx < 0.003 && dy < 0.003, `p=${p}: the rendered dot is where the track says`, `off by ${(dx * 1920).toFixed(1)}×${(dy * 1080).toFixed(1)}px of the frame`);
    const m = looksLikeTheMachine(r.samples[0].at, r.samples[0].below);
    check(m.ok, `p=${p}: there is a Mac mini under the dot`, `at ${m.at.join(',')} below ${m.below.join(',')}`);
    const v = voiceAt(p, corpus);
    check(r.text === v.text && r.tier === v.tier, `p=${p}: the card says what the module says`, r.text.slice(0, 40));
    check(r.card.left >= 8 && r.card.right <= r.vw - 8 && r.card.top >= 8 && r.card.bottom <= r.vh - 8, `p=${p}: the card is inside the viewport`, `${Math.round(r.card.left)},${Math.round(r.card.top)} to ${Math.round(r.card.right)},${Math.round(r.card.bottom)}`);
  }
  for (const p of [0.6, 0.8]) {
    await settle(page, p);
    const r = await read(page, []);
    check(r.detached && r.dotOpacity === 0, `p=${p}: detached once the machine has gone, dot and rule off`);
    check(Math.abs(r.card.right - (r.vw - 40)) <= 1 && Math.abs(r.card.bottom - (r.vh - 43)) <= 1, `p=${p}: the card rests 40px in and 43px up`, `right ${Math.round(r.card.right)} bottom ${Math.round(r.card.bottom)}`);
    const v = voiceAt(p, corpus);
    check(r.text === v.text, `p=${p}: the card says what the module says`, r.text.slice(0, 40));
    check(r.markerOpacity > 0.99, `p=${p}: the marker has not started to fade`, String(r.markerOpacity));
    const shot = join(OUT, `desk-${p}.png`); await page.screenshot({ path: shot });
    const c = contrastOf(shot, r.card);
    check(c.ratio >= 4.5, `p=${p}: line contrast against the rendered ground`, `${c.ratio.toFixed(2)}:1 on ${c.ground.join(',')}`);
  }
  await settle(page, 0.93);
  const r93 = await read(page, []);
  check(r93.markerOpacity < 0.05, 'p=0.93: the marker has faded before the desktop takes over', String(r93.markerOpacity));
  await settle(page, 0.45);
  const shot = join(OUT, 'desk-0.45.png'); await page.screenshot({ path: shot });
  const r45 = await read(page, []); const c45 = contrastOf(shot, r45.card);
  check(c45.ratio >= 4.5, 'p=0.45: line contrast against the desk', `${c45.ratio.toFixed(2)}:1`);
  check(r45.status.length > 0, 'the live region carries something');

  if (FALSIFY) {
    console.log('\n  falsification: sampling beside the machine on purpose');
    await settle(page, 0.3);
    const k = miniAt(0.3);
    const r = await read(page, [[0.12, 0, k.h * 0.9], [0, 0.10, k.h * 0.9], [-0.15, 0, k.h * 0.9], [0, -0.12, k.h * 0.9]]);
    let caught = 0;
    for (const s of r.samples) { const m = looksLikeTheMachine(s.at, s.below); const ok = !m.ok; caught += ok; console.log(`  ${ok ? '✓' : '✗'} shifted ${s.dx},${s.dy}: ${m.ok ? 'STILL PASSED' : 'failed as it should'} (at ${s.at.join(',')} below ${s.below.join(',')})`); }
    check(caught === r.samples.length, `gate can fail: ${caught} of ${r.samples.length} deliberate misses were caught`);
    const off = Math.abs(r.fx - (k.x + 0.01)) < 0.003;
    check(!off, 'gate can fail: a track shifted by 0.01 would be caught');
  }
  await page.close();
}
/* ── Phone ────────────────────────────────────────────────────────── */
{
  const page = await open({ width: 390, height: 844 });
  await settle(page, 0);
  const k = miniAt(0), r0 = await read(page, [[0, 0, k.h * 0.9]]);
  check(!r0.detached, 'phone p=0: attached');
  const m = looksLikeTheMachine(r0.samples[0].at, r0.samples[0].below);
  check(m.ok, 'phone p=0: there is a Mac mini under the dot', `at ${m.at.join(',')}`);
  check(Math.abs(r0.card.left - (390 - 18 - 206)) <= 1 && Math.abs(r0.card.top - 96) <= 1, 'phone p=0: the card is pinned under the header, right', `${Math.round(r0.card.left)},${Math.round(r0.card.top)}`);
  check(r0.lineDisplay === 'none', 'phone p=0: the line stays out of the way of the invitation');
  await settle(page, 0.3);
  const r3 = await read(page, []);
  check(r3.detached && r3.dotOpacity === 0, 'phone p=0.3: the machine has left the crop, dot and rule off');
  check(Math.abs(r3.card.left - 166) <= 1 && Math.abs(r3.card.top - 96) <= 1, 'phone p=0.3: the card has not moved', `${Math.round(r3.card.left)},${Math.round(r3.card.top)}`);
  check(r3.lineDisplay === 'block' && r3.text === voiceAt(0.3, corpus).text, 'phone p=0.3: the line shows once the invitation has gone');
  await settle(page, 0.8);
  const r8 = await read(page, []);
  check(r8.text === voiceAt(0.8, corpus).text, 'phone p=0.8: the last line');
  const shot = join(OUT, 'phone-0.8.png'); await page.screenshot({ path: shot });
  const c = contrastOf(shot, r8.card);
  check(c.ratio >= 4.5, 'phone p=0.8: line contrast against the rendered ground', `${c.ratio.toFixed(2)}:1`);
  await page.close();
}
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\ngate-voice: ${results.length - failed.length} of ${results.length} checks passed${FALSIFY ? ' (falsification run)' : ''}`);
process.exit(failed.length ? 1 : 0);
