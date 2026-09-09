/* Proves a stylesheet edit changed nothing a reader can see.

   Loads the page, records every computed property that matters for every
   element, swaps one stylesheet's text for another, records again, diffs.
   Moving rules around is only safe if the paint is identical, and "I read it
   carefully" is not a measurement. */
import { chromium } from '/Users/rickt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';

const [url, sheetName, newPath] = process.argv.slice(2);
const replacement = readFileSync(newPath, 'utf8');
const PROPS = ['font-size','font-family','font-weight','line-height','letter-spacing','color','background-color',
  'display','position','top','right','bottom','left','width','height','max-width','margin','padding',
  'opacity','visibility','transform','z-index','text-align','border-radius','flex-direction','gap','translate'];
const SIZES = [[1440,900,'desktop'],[1024,768,'tablet'],[390,844,'phone']];

const snap = (p) => p.evaluate((PROPS) => {
  const out = {};
  const walk = (el, path) => {
    const cs = getComputedStyle(el);
    out[path] = PROPS.map((k) => cs.getPropertyValue(k)).join('|');
    [...el.children].forEach((c, i) => walk(c, `${path}>${c.tagName}${i}`));
  };
  walk(document.body, 'BODY');
  return out;
}, PROPS);

const b = await chromium.launch();
let total = 0;
for (const [w, h, label] of SIZES) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(url, { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(2000);
  const before = await snap(p);
  await p.evaluate(({ name, css }) => {
    for (const l of document.querySelectorAll('link[rel=stylesheet]')) {
      if (!l.href.includes(name)) continue;
      const s = document.createElement('style'); s.textContent = css;
      l.parentNode.insertBefore(s, l); l.remove();
    }
  }, { name: sheetName, css: replacement });
  await p.waitForTimeout(900);
  const after = await snap(p);

  const diffs = [];
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (before[k] !== after[k]) {
      const a = (before[k] || '').split('|'), z = (after[k] || '').split('|');
      const which = PROPS.filter((_, i) => a[i] !== z[i]).map((pr, ) => pr);
      const changed = PROPS.map((pr, i) => (a[i] !== z[i] ? `${pr}: ${a[i]} → ${z[i]}` : null)).filter(Boolean);
      diffs.push(`${k}\n      ${changed.join('\n      ')}`);
    }
  }
  total += diffs.length;
  console.log(`\n${label} ${w}x${h}: ${diffs.length} element(s) changed`);
  for (const d of diffs.slice(0, 14)) console.log('   ', d);
  await p.close();
}
await b.close();
console.log(`\n${total} total. Zero means the swap is invisible.`);
process.exit(total ? 1 : 0);
