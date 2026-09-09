/* ── REACH GATE ──────────────────────────────────────────────────────────
   Declared in .review/STANDARD.md and not built until now, which is the kind
   of thing this harness exists to stop me doing.

   The launch commit deleted nothing. What it removed was reachability: the
   new front door is a bare HTML file with <base href="/workspace/">, so it
   never loads _layouts/default.html, which is where the site's entire
   navigation lives. Eleven surfaces stopped being reachable from the front
   door on the same day, and no test noticed, because every one of them still
   returns 200 at its own URL.

   This walks outward from the front door, following real links and the
   desktop's own app registry, and reports how many clicks each shipped
   surface is from the entrance. A surface nothing links to is a surface only
   Google can find.
   ─────────────────────────────────────────────────────────────────────── */
import { chromium } from '/Users/rickt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readdirSync, statSync, readFileSync } from 'node:fs';

const ORIGIN = process.argv[2] || 'http://127.0.0.1:4713';
const MAX_DEPTH = Number(process.env.REACH_DEPTH || 3);

/** Every surface the build actually publishes. */
const excluded = (() => {
  try {
    /* Read the block line by line. A regex with $ under /m stopped at the
       end of the first line and reported one exclusion out of thirty. */
    const out = new Set();
    let inside = false;
    for (const line of readFileSync('_config.yml', 'utf8').split('\n')) {
      if (/^exclude:\s*$/.test(line)) { inside = true; continue; }
      if (!inside) continue;
      if (/^\S/.test(line)) break;
      const m = /^\s*-\s*(\S+)/.exec(line);
      if (m) out.add(m[1]);
    }
    return out;
  } catch { return new Set(); }
})();

function shipped() {
  const out = new Set(['/']);
  const walk = (dir, base) => {
    for (const name of readdirSync(dir)) {
      const p = `${dir}/${name}`;
      /* Only what Jekyll publishes. .concept-preview, trader-desk, tools and
         content are gitignored or excluded in _config.yml, and counting them
         as unreachable surfaces would bury the real orphans in noise. */
      if (/node_modules|\.git|assets|_site|\.jekyll|\.concept-preview|trader-desk|\.venv|__pycache__|\/tools|second-shift|writing-workshop|memory-setup-doctor|\/docs|\/reports|\/content|\.design|\.review|\.impeccable|\.agents|\.firecrawl|worker|scripts|tests|_journal|_data|_includes|_layouts|_receipts/.test(p)) continue;
      const st = statSync(p);
      if (st.isDirectory()) { walk(p, `${base}${name}/`); continue; }
      /* workspace/index.html is a redirect stub into desktop.html, not a
         destination. Counting it as an orphan says a surface is unreachable
         when what is unreachable is a doorway to a room already reached. */
      if (name === 'index.html') { if (base !== 'workspace/') out.add(base || '/'); continue; }
      if (/\.(md|markdown)$/.test(name)) {
        const src = readFileSync(p, 'utf8').slice(0, 800);
        const perm = /^permalink:\s*(\S+)/m.exec(src);
        /* A page Jekyll is told to exclude is not shipped, so it is not an
           orphan. talk.md is excluded until the Worker behind it is deployed;
           counting it would mean the gate can never reach zero and a gate
           that can never pass gets ignored. */
        if (perm && !excluded.has(name)) out.add(perm[1].replace(/^["']|["']$/g, ''));
      }
    }
  };
  walk('.', '');
  return [...out];
}

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const seen = new Map();          // url -> depth
const queue = [[`${ORIGIN}/`, 0]];
seen.set('/', 0);

while (queue.length) {
  const [url, depth] = queue.shift();
  if (depth >= MAX_DEPTH) continue;
  const p = await ctx.newPage();
  try {
    await p.goto(url, { waitUntil: 'load', timeout: 30_000 });
    await p.waitForTimeout(1200);
    /* The desktop is a real destination: entering it is one click, and every
       app registered on it is one more. Counting only <a href> would score the
       whole workspace unreachable, which is false. */
    await p.evaluate(() => { document.querySelector('[data-skip-boot]')?.click(); }).catch(() => {});
    await p.waitForTimeout(300);
    await p.evaluate(() => { document.querySelector('[data-enter]')?.click(); }).catch(() => {});
    await p.waitForTimeout(900);
    /* Opening every app the desktop registers, so links that only exist inside
       an app window are counted. An app is a click, same as a hyperlink. */
    const apps = await p.evaluate(() => [...new Set([...document.querySelectorAll('[data-app]')].map((b) => b.dataset.app))]).catch(() => []);
    for (const a of apps) {
      await p.evaluate((x) => window.__desk?.open(x), a).catch(() => {});
      await p.waitForTimeout(260);
    }
    await p.waitForTimeout(400);
    const links = await p.evaluate((origin) => {
      const out = new Set();
      for (const a of document.querySelectorAll('a[href]')) {
        /* a.href, not getAttribute: the front door sets <base href="/workspace/">,
           so resolving the raw attribute against location.href produced
           /desktop.html and the crawl died at the first hop. */
        try { const u = new URL(a.href);
          if (u.origin === origin) out.add(u.pathname + (u.pathname.endsWith('/') || /\.[a-z]+$/.test(u.pathname) ? '' : ''));
        } catch {}
      }
      return [...out];
    }, ORIGIN);
    for (const path of links) {
      if (seen.has(path)) continue;
      seen.set(path, depth + 1);
      queue.push([`${ORIGIN}${path}`, depth + 1]);
    }
  } catch {}
  await p.close();
}
await b.close();

const norm = (p) => (p.endsWith('/') || /\.[a-z0-9]+$/i.test(p) ? p : `${p}/`);
const reached = new Map([...seen].map(([k, v]) => [norm(k), v]));
const all = shipped().map(norm);
const orphans = all.filter((p) => !reached.has(p));

console.log(`\nreach from ${ORIGIN}/ within ${MAX_DEPTH} clicks\n`);
for (const [p, d] of [...reached].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))) {
  if (!p.endsWith('/') && !/\.html$/.test(p)) continue;
  console.log(`  ${d}  ${p}`);
}
console.log(`\n${orphans.length} shipped surface(s) NOT reachable in ${MAX_DEPTH} clicks:`);
for (const p of orphans.sort()) console.log(`  ✗  ${p}`);
console.log(`\n${reached.size} reached · ${all.length} shipped`);
process.exit(orphans.length ? 1 : 0);
