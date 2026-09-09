/* Open every app in turn and photograph it, so a sweep looks at the whole
   property in one pass instead of whichever window was already open. */
import { chromium } from '/Users/rickt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:4713/workspace/desktop.html';
const dir = process.argv[3] || '/tmp/sheet';
const apps = process.argv.slice(4);
mkdirSync(dir, { recursive: true });

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1.6 });
const errs = [];
p.on('pageerror', (e) => errs.push(`${String(e).slice(0, 160)}`));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
await p.goto(url, { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(900);
await p.evaluate(() => document.querySelector('[data-skip-boot]')?.click());
await p.waitForTimeout(350);
await p.evaluate(() => document.querySelector('[data-enter]')?.click());
await p.waitForTimeout(1400);

for (const app of apps) {
  const before = errs.length;
  await p.evaluate((a) => window.__desk?.open(a), app).catch(() => {});
  await p.waitForTimeout(1100);
  await p.locator('.f5-banner .banner-dismiss').first().click({ timeout: 600 }).catch(() => {});
  await p.waitForTimeout(250);
  const win = p.locator(`.mac-window[data-app-id="${app}"]`).first();
  const box = await win.boundingBox().catch(() => null);
  await p.screenshot({ path: `${dir}/${app}.png`, clip: box || undefined });
  const news = errs.slice(before);
  console.log(`${app.padEnd(14)} ${box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'NO WINDOW'}${news.length ? '  ERRORS: ' + news.join(' | ') : ''}`);
  await p.evaluate((a) => window.__desk?.close?.(a), app).catch(() => {});
  await p.waitForTimeout(200);
}
await b.close();
