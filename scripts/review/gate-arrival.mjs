#!/usr/bin/env node
/* ── The arrival, in motion ─────────────────────────────────────────
   The greeting draws itself the first time: the mark one square a day in
   date order, then the sentence, the doors, the signature. A stylesheet
   cannot be asked whether that happened in that order at those times, and
   a screenshot cannot be asked whether it happened once. This opens the
   desktop in real Chrome and samples the computed opacity of five elements
   through the first two seconds; then again under reduced motion, where
   everything must simply be there; then reopens the note, which must not
   replay. --falsify switches the animations off and requires the first
   assertion to fail.
   usage: node scripts/review/gate-arrival.mjs [http://127.0.0.1:4716/] [--falsify] */
import { chromium } from '/Users/rickt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith('http')) || 'http://127.0.0.1:4716/';
const FALSIFY = args.includes('--falsify');
const OUT = join(tmpdir(), 'gate-arrival'); mkdirSync(OUT, { recursive: true });
const results = [];
const check = (ok, what, detail = '') => { results.push({ ok, what }); console.log(`${ok ? '  ✓' : '  ✗'} ${what}${detail ? `  (${detail})` : ''}`); return ok; };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const PROBE = `(() => { const w = document.querySelector('.window-notes'); if (!w) return null;
  const q = (s) => w.querySelector(s); const rects = [...w.querySelectorAll('.welcome-mark rect')];
  const op = (el) => el ? Number(getComputedStyle(el).opacity) : null;
  return { arriving: w.classList.contains('is-arriving'), cells: rects.length,
    first: op(rects[0]), firstInk: rects[0] ? Number(rects[0].getAttribute('opacity')) : null,
    last: op(rects.at(-1)), lastInk: rects.at(-1) ? Number(rects.at(-1).getAttribute('opacity')) : null,
    h1: op(q('h1')), h1t: q('h1') && getComputedStyle(q('h1')).transform, door3: op(w.querySelectorAll('.welcome-path button')[2]), sig: op(q('.note-signature')) }; })()`;
async function enter(page) {
  await page.goto(BASE + 'workspace/desktop.html?_=' + Date.now(), { waitUntil: 'load' });
  await page.waitForSelector('[data-enter]', { timeout: 30000 });
  await page.click('[data-enter]');
  await page.waitForSelector('.window-notes', { timeout: 20000 });
}
const near = (a, b, tol = 0.08) => a !== null && Math.abs(a - b) <= tol;
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  if (FALSIFY) await page.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '.window-notes.is-arriving *{animation:none!important}'; document.head.append(s); }); });
  await enter(page);
  /* Sampled every 50ms rather than probed at instants: a busy main thread
     can start the sequence a few hundred milliseconds late, and a gate that
     fails on that is measuring the machine, not the design. What is asserted
     is the order of events, each event's own window, and the end state. */
  const t0 = Date.now(); const trail = [];
  while (Date.now() - t0 < 2400) { trail.push({ t: Date.now() - t0, ...(await page.evaluate(PROBE)) }); await page.waitForTimeout(50); }
  const firstAt = (pred) => { const r = trail.find(pred); return r ? r.t : null; };
  const s0 = trail[0], sEnd = trail.at(-1);
  check(s0 && s0.arriving && s0.cells > 90, `first arrival: the note is arriving with ${s0?.cells} squares`);
  check(s0.h1 < 0.2 && s0.sig < 0.2 && s0.last < 0.05, `t=${s0.t}ms: the sentence, the signature and the last square are not there yet`, `h1 ${s0.h1} sig ${s0.sig} last ${s0.last}`);
  const firstDone = firstAt((r) => near(r.first, r.firstInk, 0.03)), lastStart = firstAt((r) => r.last > 0.02), h1Done = firstAt((r) => r.h1 > 0.98), door3Start = firstAt((r) => r.door3 > 0.02), sigDone = firstAt((r) => r.sig > 0.98), spent = firstAt((r) => !r.arriving);
  console.log(`    first square landed ${firstDone}ms · last square began ${lastStart}ms · sentence landed ${h1Done}ms · third door began ${door3Start}ms · signature landed ${sigDone}ms · spent ${spent}ms`);
  check(firstDone !== null && firstDone >= 250 && firstDone <= 800, 'the first square lands in its own window (250 to 800ms)', `${firstDone}ms`);
  check(lastStart !== null && lastStart > firstDone + 500, 'the mark is drawn one day at a time: the last square begins long after the first has landed', `${lastStart}ms`);
  const lastDone = firstAt((r) => near(r.last, r.lastInk, 0.03));
  check(h1Done !== null && lastStart !== null && lastDone !== null && lastStart < h1Done && h1Done < lastDone, 'the sentence lands while the last squares are still coming in', `last began ${lastStart}, sentence landed ${h1Done}, last landed ${lastDone}`);
  check(door3Start !== null && h1Done < door3Start && sigDone !== null && door3Start < sigDone, 'then the doors, then the signature, in that order', `${h1Done} < ${door3Start} < ${sigDone}`);
  check(sigDone !== null && sigDone < 2300, 'the whole arrival is over inside 2.3 seconds', `${sigDone}ms`);
  check(near(sEnd.first, sEnd.firstInk) && near(sEnd.last, sEnd.lastInk) && sEnd.h1 === 1 && sEnd.door3 === 1 && sEnd.sig === 1, `t=${sEnd.t}ms: everything on the page at its final opacity`, `last ${sEnd.last}/${sEnd.lastInk} door3 ${sEnd.door3} sig ${sEnd.sig}`);
  check(spent !== null && !sEnd.arriving, 'the arrival class has come off once the signature landed, so the delight is spent once', `${spent}ms`);
  await page.screenshot({ path: join(OUT, 'arrival-end.png') });
  /* Reopen from the Apple menu: the finished page, no replay. */
  await page.click('.apple-menu'); await page.click('[data-welcome]');
  const r = await page.evaluate(PROBE);
  check(r && !r.arriving && r.h1 === 1 && near(r.last, r.lastInk), 'reopened from the Apple menu: no replay', `h1 ${r?.h1} last ${r?.last}`);
  await page.close();
}
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await enter(page);
  const s = await page.evaluate(PROBE);
  check(s && s.h1 === 1 && s.sig === 1 && near(s.last, s.lastInk) && near(s.first, s.firstInk), 'reduced motion: the whole page is simply there at once', `h1 ${s?.h1} sig ${s?.sig} last ${s?.last}`);
  await page.close();
}
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await enter(page);
  const t0 = Date.now(); const trail = [];
  while (Date.now() - t0 < 2400) { trail.push({ t: Date.now() - t0, ...(await page.evaluate(PROBE)) }); await page.waitForTimeout(50); }
  check(trail[0] && trail[0].h1 < 0.2, `phone t=${trail[0]?.t}ms: the sequence runs on a phone too`, `h1 ${trail[0]?.h1}`);
  const e = trail.at(-1);
  check(e.h1 === 1 && e.sig === 1 && !e.arriving, `phone t=${e.t}ms: finished and spent`);
  await page.screenshot({ path: join(OUT, 'arrival-phone.png') });
  await page.close();
}
await browser.close();
const failed = results.filter((r) => !r.ok).length;
if (FALSIFY) { console.log(`\ngate-arrival: falsification run, ${failed} of ${results.length} checks failed with the animations switched off`); process.exit(failed >= 4 ? 0 : 1); }
console.log(`\ngate-arrival: ${results.length - failed} of ${results.length} checks passed`);
process.exit(failed ? 1 : 0);
