#!/usr/bin/env node
/* ── The scorecard ──────────────────────────────────────────────────
   Measured, per surface, in real Chrome against whatever origin is given:
   accessibility (axe-core), console errors, requests, bytes, third-party
   hosts, LCP and CLS, the metadata a crawler needs, and every internal link
   answered. Nothing here is a taste judgement; those are seats, not gates.
   usage: node scripts/review/scorecard.mjs [https://agentrichie.com/] */
import { chromium } from '/Users/rickt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';
const BASE = (process.argv[2] || 'https://agentrichie.com/').replace(/\/?$/, '/');
const AXE = readFileSync('/Users/rickt/workspace/frontier-desk/node_modules/axe-core/axe.min.js', 'utf8');
const SURFACES = ['', 'about/', 'privacy/', 'receipts/', 'journal/', 'projects/', 'beliefs/', 'workspace/desktop.html', 'workspace/record.html'];
const own = (h) => /(^|\.)agentrichie\.com$/.test(h);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const rows = []; const links = new Set();
for (const path of SURFACES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [], reqs = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 120)));
  page.on('response', async (r) => { try { const h = r.headers(); const u = new URL(r.url()); reqs.push({ host: u.hostname, bytes: Number(h['content-length'] || 0), status: r.status(), url: r.url() }); } catch {} });
  await page.addInitScript(() => { window.__lcp = 0; window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
  const t = Date.now();
  await page.goto(BASE + path + (path.includes('?') ? '&' : '?') + 'sc=' + Date.now(), { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  const meta = await page.evaluate(() => ({ title: document.title, lang: document.documentElement.lang, desc: !!document.querySelector('meta[name="description"]')?.content, canonical: !!document.querySelector('link[rel="canonical"]'), og: !!document.querySelector('meta[property="og:image"]'), h1: document.querySelectorAll('h1').length, lcp: Math.round(window.__lcp), cls: +window.__cls.toFixed(3), hrefs: [...document.querySelectorAll('a[href]')].map((a) => a.href) }));
  meta.hrefs.forEach((h) => { try { const u = new URL(h); if (own(u.hostname) && !u.hash) links.add(u.origin + u.pathname); } catch {} });
  await page.addScriptTag({ content: AXE });
  const axe = await page.evaluate(async () => { const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })); });
  const third = [...new Set(reqs.map((r) => r.host).filter((h) => h && !own(h)))];
  const bytes = reqs.reduce((s, r) => s + r.bytes, 0);
  rows.push({ path: path || '/', ms: Date.now() - t, lcp: meta.lcp, cls: meta.cls, requests: reqs.length, kb: Math.round(bytes / 1024), third, errors, axe, title: meta.title.slice(0, 40), lang: meta.lang, desc: meta.desc, canonical: meta.canonical, og: meta.og, h1: meta.h1 });
  await page.close();
}
/* every internal link found on those surfaces, answered */
const ctx = await browser.newContext(); const p2 = await ctx.newPage(); const dead = [];
for (const u of links) { try { const r = await p2.request.fetch(u, { method: 'GET', maxRedirects: 3, timeout: 20000 }); if (r.status() >= 400) dead.push(`${r.status()} ${u}`); } catch (e) { dead.push(`ERR ${u}`); } }
await browser.close();
console.log(`scorecard for ${BASE}\n`);
console.log('surface'.padEnd(26), 'axe'.padStart(4), 'errs'.padStart(5), 'reqs'.padStart(5), 'KB'.padStart(6), 'LCP'.padStart(6), 'CLS'.padStart(6), '3rd'.padStart(4), 'meta');
for (const r of rows) {
  const av = r.axe.reduce((s, v) => s + v.nodes, 0);
  const meta = [r.lang ? 'lang' : 'NOLANG', r.desc ? 'desc' : 'NODESC', r.canonical ? 'canon' : 'NOCANON', r.og ? 'og' : 'NOOG', `h1×${r.h1}`].join(' ');
  console.log(r.path.padEnd(26), String(av).padStart(4), String(r.errors.length).padStart(5), String(r.requests).padStart(5), String(r.kb).padStart(6), String(r.lcp).padStart(6), String(r.cls).padStart(6), String(r.third.length).padStart(4), meta);
  for (const v of r.axe) console.log(`    axe ${v.impact}: ${v.id} ×${v.nodes}`);
  for (const e of r.errors.slice(0, 3)) console.log(`    error: ${e}`);
  if (r.third.length) console.log(`    third-party: ${r.third.join(', ')}`);
}
console.log(`\n${links.size} internal links checked, ${dead.length} dead`); for (const d of dead) console.log('    ' + d);
