/* Screenshot a surface and print the type actually rendered on it, so the
   picture and the measurement arrive together. Looking at one without the
   other is how an 8px caption ships. */
import { chromium } from '/Users/rickt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const [url, out, w = 1440, h = 900] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 });
await p.goto(url, { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(3000);
if (process.env.SHOT_STEP) await p.evaluate(process.env.SHOT_STEP);
if (process.env.SHOT_STEP) await p.waitForTimeout(2000);
await p.screenshot({ path: out });
const rows = await p.evaluate(() => [...document.querySelectorAll('*')]
  .filter((e) => e.offsetParent && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1))
  .map((e) => { const c = getComputedStyle(e);
    return `${c.fontSize.padStart(6)} ${c.fontFamily.split(',')[0].replace(/"/g,'').padEnd(14)} ${(e.tagName + '.' + String(e.className).split(' ')[0]).slice(0, 26).padEnd(27)} ${e.textContent.trim().slice(0, 30)}`; }));
console.log(rows.join('\n'));
await b.close();
