/* THE TWO DOORS MUST RENDER THE SAME ROOM.
 *
 * The workspace can be reached two ways: through the room at `/`, where it is
 * mounted inside a document that loads spatial.css, and directly at
 * /workspace/desktop.html, which does not load it. On 2026-09-10 those two
 * documents rendered the same window differently: spatial.css sets
 * `color-scheme: dark` on :root, so every form control without an explicit
 * background got the dark user-agent style. The note to Rick was two near-black
 * boxes inside a white pane, but only for people who walked in through the
 * front door.
 *
 * Every gate on this property audits desktop.html. None of them had ever seen
 * the document most visitors actually get.
 *
 * This opens both, walks the same apps, and reports any element whose computed
 * appearance differs between the two.
 *
 *   node scripts/review/gate-entry.mjs [origin]
 */
import { chromium } from '/Users/rickt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const ORIGIN = process.argv[2] || 'http://127.0.0.1:4713';
const APPS = ['finder', 'messages', 'notes', 'settings', 'schedule', 'proof', 'rate', 'corrections'];

/* Properties where a difference is visible to a reader. Geometry is excluded on
   purpose: the two documents legitimately size the stage differently. */
const PROPS = ['color', 'backgroundColor', 'borderTopColor', 'colorScheme', 'fontFamily', 'fontSize', 'fontWeight'];

async function snapshot(page, app) {
  /* Scoped to the window under test. The first version sampled all of #crt,
     which meant it compared the traffic lights of windows left open behind the
     current one: those are grey when unfocused and coloured when focused, so
     it reported 91 differences that were entirely about which window happened
     to have focus. A gate that reports focus state as a paint defect is noise,
     and noise is how a real finding gets missed. */
  return page.evaluate(({ props, app }) => {
    const out = {};
    const seen = new Map();
    const win = document.querySelector(`.mac-window[data-app-id="${app}"]`);
    if (!win) return out;
    for (const el of win.querySelectorAll('input, textarea, select, button, a, p, h1, h2, dd, code, summary')) {
      if (!el.getClientRects().length) continue;
      /* One sample per (app, tag, class) shape. Comparing every node makes the
         report unreadable and says the same thing many times. */
      const key = `${el.tagName}|${el.className || ''}`;
      const n = (seen.get(key) || 0) + 1;
      seen.set(key, n);
      if (n > 1) continue;
      const cs = getComputedStyle(el);
      out[key] = Object.fromEntries(props.map((p) => [p, cs[p]]));
    }
    return out;
  }, { props: PROPS, app });
}

async function open(browser, url, viaRoom) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(viaRoom ? 2600 : 900);
  if (viaRoom) {
    await page.locator('#direct-entry').click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(2600);
  }
  await page.evaluate(() => document.querySelector('[data-skip-boot]')?.click());
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('[data-enter]')?.click());
  await page.waitForTimeout(1600);
  await page.locator('.f5-banner .banner-dismiss').first().click({ timeout: 500 }).catch(() => {});
  const shots = {};
  for (const app of APPS) {
    await page.evaluate((a) => window.__desk?.open(a), app).catch(() => {});
    await page.waitForTimeout(700);
    if (app === 'messages') {
      await page.locator('.imsg-thread[data-thread="rutvik"]').first().click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(500);
    }
    shots[app] = await snapshot(page, app);
    await page.evaluate((a) => window.__desk?.close?.(a), app).catch(() => {});
    await page.waitForTimeout(200);
  }
  await page.close();
  return shots;
}

const browser = await chromium.launch();
const viaRoom = await open(browser, `${ORIGIN}/`, true);
const direct = await open(browser, `${ORIGIN}/workspace/desktop.html`, false);
await browser.close();

const findings = [];
for (const app of APPS) {
  const a = viaRoom[app] || {}, b = direct[app] || {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (!a[key] || !b[key]) continue;   // present in one document only: a layout difference, not a paint one
    for (const p of PROPS) {
      if (a[key][p] !== b[key][p]) {
        findings.push({ app, key, prop: p, room: a[key][p], direct: b[key][p] });
      }
    }
  }
}

if (!findings.length) {
  console.log('PASS  both doors render the same room');
  console.log(`\n${APPS.length} apps compared across ${Object.keys(viaRoom.finder || {}).length}+ element shapes.`);
} else {
  for (const f of findings) {
    console.log(`DIFF  ${f.app.padEnd(12)} ${f.prop.padEnd(16)} room: ${String(f.room).slice(0, 30).padEnd(32)} direct: ${String(f.direct).slice(0, 30)}`);
    console.log(`      ${f.key}`);
  }
}
console.log(`\n${findings.length} difference(s) between the two ways in.`);
process.exitCode = findings.length ? 1 : 0;
