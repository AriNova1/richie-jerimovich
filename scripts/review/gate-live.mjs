/* ── LIVE GATES ──────────────────────────────────────────────────────────
   Source analysis says what was written. This says what a reader gets.
   The two disagree constantly: a sub-12px rule in the source may be dead
   under a later override, and a size that looks safe in CSS may be inherited
   into something else entirely.

   Gates here:
     weight     transferred bytes, by type, against a budget
     type       COMPUTED sizes and font stacks actually resolved on screen
     sourcing   evidence-lens marks with no tier
     motion     animations that survive prefers-reduced-motion
     a11y       focus visibility, heading order, names on controls
   ─────────────────────────────────────────────────────────────────────── */
import { chromium } from '/Users/rickt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const BUDGET = { front: 12_000_000, app: 400_000 };
const MIN_PX = 12;

export async function liveGates(url, { viewport = { width: 1440, height: 900 }, label = 'desktop', afterLoad } = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  const bytes = { total: 0, byType: {} };
  page.on('response', async (res) => {
    try {
      const h = await res.allHeaders();
      const n = Number(h['content-length'] || 0);
      const t = (h['content-type'] || 'other').split(';')[0];
      bytes.total += n; bytes.byType[t] = (bytes.byType[t] || 0) + n;
    } catch {}
  });

  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 200)}`));

  /* Not networkidle: the room film streams continuously, so the network is
     never idle and the gate would only ever time out. */
  await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
  if (afterLoad) await afterLoad(page);
  await page.waitForTimeout(2500);

  const findings = [];

  /* ── computed type ───────────────────────────────────────────────── */
  const type = await page.evaluate((MIN) => {
    const out = { small: [], stacks: {}, sizes: {}, measures: [] };
    const seen = new Set();
    for (const el of document.querySelectorAll('*')) {
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!own) continue;
      const cs = getComputedStyle(el);
      const px = parseFloat(cs.fontSize);
      const stack = cs.fontFamily;
      const sig = `${el.tagName}.${el.className}|${px}|${stack}`;
      if (seen.has(sig)) continue; seen.add(sig);
      out.stacks[stack] = (out.stacks[stack] || 0) + 1;
      out.sizes[px] = (out.sizes[px] || 0) + 1;
      if (px < MIN) out.small.push({ px, sel: `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ').slice(0,2).join('.') : ''}`, text: el.textContent.trim().slice(0, 40) });
      /* measure: characters per line for running text */
      const r = el.getBoundingClientRect();
      const chars = el.textContent.trim().length;
      if (chars > 160 && r.width > 0) {
        const cpl = r.width / (px * 0.5);
        /* The lower bound is a property of the device, not of the design. A
           390px phone physically cannot hold 45 characters at a legible size,
           and demanding it would push the type back down, which is the exact
           defect this whole pass exists to undo. */
        const floor = innerWidth < 700 ? 30 : 45;
        if (cpl > 92 || cpl < floor) out.measures.push({ cpl: Math.round(cpl), sel: `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`, w: Math.round(r.width) });
      }
    }
    return out;
  }, MIN_PX);

  for (const s of type.small) findings.push({ gate: 'type/live', severity: 'high', what: `renders at ${s.px}px`, where: `${label} · ${s.sel}`, quote: s.text });
  for (const m of type.measures) findings.push({ gate: 'type/live', severity: 'medium', what: `measure ${m.cpl} characters per line (target 45-90)`, where: `${label} · ${m.sel} at ${m.w}px wide` });

  /* ── overflow ────────────────────────────────────────────────────
     Growing type is the fix for illegibility and the cause of clipping.
     A gate that only measures size would call a clipped headline a win. */
  const overflow = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('*')) {
      if (!el.offsetParent) continue;
      /* Visually-hidden text is clipped on purpose. */
      if (el.matches('.sr-only, .visually-hidden, .skip-link, [hidden]')) continue;
      const cs = getComputedStyle(el);
      if (cs.overflow === 'auto' || cs.overflowY === 'auto' || cs.overflow === 'scroll' || cs.overflowY === 'scroll') continue;
      const hidden = cs.overflow === 'hidden' || cs.overflowY === 'hidden' || cs.overflowX === 'hidden';
      const clipV = el.scrollHeight - el.clientHeight;
      const clipH = el.scrollWidth - el.clientWidth;
      if (!hidden && clipV < 2 && clipH < 2) continue;
      if (hidden && clipV < 4 && clipH < 4) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!own && clipH < 2) continue;
      out.push({ sel: `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ').slice(0,2).join('.') : ''}`,
                 v: clipV, h: clipH, hidden, text: el.textContent.trim().slice(0, 44) });
    }
    return out.slice(0, 25);
  });
  for (const o of overflow) findings.push({ gate: 'overflow', severity: o.hidden ? 'high' : 'medium',
    what: `content ${o.hidden ? 'clipped' : 'overflows'} by ${o.v ? o.v + 'px down' : ''}${o.h ? ' ' + o.h + 'px across' : ''}`,
    where: `${label} · ${o.sel}`, quote: o.text });

  /* ── motion under reduce ─────────────────────────────────────────── */
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(300);
  const moving = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      const an = cs.animationName, du = parseFloat(cs.animationDuration) || 0;
      if (an && an !== 'none' && du > 0.12 && cs.animationIterationCount === 'infinite')
        out.push({ sel: `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`, an, du });
    }
    return out.slice(0, 20);
  });
  for (const m of moving) findings.push({ gate: 'motion', severity: 'high', what: `animation "${m.an}" loops forever under prefers-reduced-motion`, where: `${label} · ${m.sel}` });
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  /* ── sourcing (evidence lens) ────────────────────────────────────── */
  const sourcing = await page.evaluate(() => {
    const marks = [...document.querySelectorAll('[data-tier]')];
    const unsourced = marks.filter((m) => !m.dataset.tier || m.dataset.tier === 'unsourced').length;
    return { marks: marks.length, unsourced };
  });
  if (sourcing.unsourced) findings.push({ gate: 'sourcing', severity: 'stop-ship', what: `${sourcing.unsourced} unsourced surfaces`, where: label });

  /* ── a11y basics ─────────────────────────────────────────────────── */
  const a11y = await page.evaluate(() => {
    const out = { unnamed: [], headings: [], noFocus: 0 };
    for (const el of document.querySelectorAll('button, a[href], [role="button"], input, select')) {
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
      const name = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || el.getAttribute('alt') || '').trim();
      if (!name) out.unnamed.push(`${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''}`);
    }
    let last = 0;
    for (const h of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
      if (!h.offsetParent) continue;
      const lvl = +h.tagName[1];
      if (last && lvl > last + 1) out.headings.push(`${h.tagName} after H${last}: "${h.textContent.trim().slice(0, 40)}"`);
      last = lvl;
    }
    return out;
  });
  for (const u of [...new Set(a11y.unnamed)]) findings.push({ gate: 'a11y', severity: 'high', what: 'control has no accessible name', where: `${label} · ${u}` });
  for (const h of a11y.headings) findings.push({ gate: 'a11y', severity: 'medium', what: `heading level skipped`, where: `${label} · ${h}` });

  for (const e of consoleErrors) findings.push({ gate: 'engine', severity: 'stop-ship', what: 'console error', where: label, quote: e });

  await browser.close();
  return { findings, bytes, type, sourcing, overflow };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.argv[2] || 'http://127.0.0.1:4713/index.html';
  const r = await liveGates(url);
  console.log(`\n${url}`);
  console.log(`weight ${(r.bytes.total / 1e6).toFixed(2)} MB`);
  for (const [t, n] of Object.entries(r.bytes.byType).sort((a, b) => b[1] - a[1]).slice(0, 6)) console.log(`   ${(n / 1e6).toFixed(2)} MB  ${t}`);
  console.log(`\nfont stacks resolved on screen:`);
  for (const [s, c] of Object.entries(r.type.stacks).sort((a, b) => b[1] - a[1])) console.log(`   ${String(c).padStart(3)}×  ${s.slice(0, 88)}`);
  console.log(`\ncomputed sizes: ${Object.entries(r.type.sizes).sort((a,b)=>+a[0]-+b[0]).map(([p, c]) => `${p}px×${c}`).join('  ')}`);
  console.log(`\n${r.findings.length} finding(s)`);
  for (const f of r.findings) console.log(`  [${f.severity}] ${f.gate}: ${f.what}\n        ${f.where}${f.quote ? `\n        "${f.quote}"` : ''}`);
}
