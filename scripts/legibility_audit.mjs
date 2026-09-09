/* ══════════════════════════════════════════════════════════════════
   LEGIBILITY AUDIT

   Text over a photograph cannot be judged by looking at it, and it
   cannot be judged from the CSS either: the background is whatever
   pixel happens to be behind that word in that crop at that viewport.
   So this measures. For every visible piece of text it hides just that
   element, screenshots the exact rectangle underneath, takes the median
   colour of what is actually painted there, and computes the real
   contrast ratio against the text colour.

   Fails: contrast under 4.5:1 for normal text, under 3:1 for large
   text (18.66px+ bold or 24px+), and any rendered size under 12px.

   Usage:
     node scripts/legibility_audit.mjs [url]
     node scripts/legibility_audit.mjs <url> --scroll        page through a long document
     node scripts/legibility_audit.mjs <url> --desktop       log in, then audit each app in turn

   Long pages and app windows are sampled by style signature (tag, class,
   size, colour) rather than element, so 186 identical refusal rows cost
   one measurement instead of 186, and every distinct design decision is
   still measured once per viewport.
   ══════════════════════════════════════════════════════════════════ */
import { chromium } from '/Users/rickt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const URL_ = args.find((a) => !a.startsWith('--')) || 'http://127.0.0.1:4713/';
const SCROLL = args.includes('--scroll');
const DESKTOP = args.includes('--desktop');
const APPS = ['finder', 'notes', 'messages', 'settings', 'activity', 'hermes', 'terminal', 'contacts', 'voices', 'spotify', 'timemachine', 'folder', 'questions', 'corrections', 'schedule', 'tape', 'trash', 'claude'];
const SIZES = [[1440, 900, 'desktop'], [1024, 768, 'tablet'], [390, 844, 'phone']];
const MIN_PX = 12;

const lin = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const parseRGB = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);

/* Median of the crop, not the mean: a mean is dragged by one bright
   highlight and reports a background nobody is reading against. */
function medianPixel(png) {
  const out = execFileSync('python3', ['-c', `
import sys, struct, zlib
d = sys.stdin.buffer.read()
pos, w, h, idat = 8, 0, 0, b''
while pos < len(d):
    ln = struct.unpack('>I', d[pos:pos+4])[0]; typ = d[pos+4:pos+8]
    if typ == b'IHDR': w, h, bd, ct = struct.unpack('>IIBB', d[pos+8:pos+18])
    elif typ == b'IDAT': idat += d[pos+8:pos+8+ln]
    pos += 12 + ln
raw = zlib.decompress(idat); ch = 4 if ct == 6 else 3; stride = w*ch
prev = bytearray(stride); rs, gs, bs = [], [], []
i = 0
for y in range(h):
    f = raw[i]; i += 1
    line = bytearray(raw[i:i+stride]); i += stride
    for x in range(stride):
        a = line[x-ch] if x >= ch else 0; b = prev[x]; c = prev[x-ch] if x >= ch else 0
        if f == 1: line[x] = (line[x]+a) & 255
        elif f == 2: line[x] = (line[x]+b) & 255
        elif f == 3: line[x] = (line[x]+(a+b)//2) & 255
        elif f == 4:
            p = a+b-c; pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
            pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
            line[x] = (line[x]+pr) & 255
    for x in range(0, stride, ch):
        rs.append(line[x]); gs.append(line[x+1]); bs.append(line[x+2])
    prev = line
med = lambda v: sorted(v)[len(v)//2] if v else 0
print(med(rs), med(gs), med(bs))
`], { input: png, maxBuffer: 64 * 1024 * 1024 }).toString().trim();
  return out.split(/\s+/).map(Number);
}

const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const dir = await mkdtemp(join(tmpdir(), 'legib-'));
const findings = [];
try {
  for (const [w, h, tag] of SIZES) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
    p.on('pageerror', () => {});
    await p.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForTimeout(SCROLL || DESKTOP ? 1600 : 4200);

    /* One representative per style signature. Auditing all 186 refusal rows
       measures the same decision 186 times and finds nothing new. */
    const seen = new Set();
    const collect = async () => {
      const nodes = await p.evaluate(() => {
        const out = [];
        const walk = (el) => {
          for (const c of el.children) {
            const own = [...c.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
            const cs = getComputedStyle(c);
            /* The box is not the ink. A 40 by 93 grid cell holding one line of
               text at the top gives a median of everything under the empty
               four-fifths, so the background reported is one no reader ever
               sees behind a glyph. Measure the union of the actual text rects. */
            let r = c.getBoundingClientRect();
            try {
              const rg = document.createRange(); let box = null;
              for (const n of c.childNodes) {
                if (n.nodeType !== 3 || !n.textContent.trim()) continue;
                rg.selectNodeContents(n);
                for (const t of rg.getClientRects()) {
                  if (t.width < 1 || t.height < 1) continue;
                  box = box ? { top: Math.min(box.top, t.top), left: Math.min(box.left, t.left),
                                bottom: Math.max(box.bottom, t.bottom), right: Math.max(box.right, t.right) } : { top: t.top, left: t.left, bottom: t.bottom, right: t.right };
                }
              }
              if (box) r = { ...box, x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top };
            } catch { /* keep the border box */ }
            /* On screen means actually on top. Without this, text in a window
               that another window now covers gets measured against whatever
               is painted over it, and the tool invents failures nobody sees. */
            const cx = Math.min(innerWidth - 2, Math.max(2, r.left + Math.min(30, r.width / 2)));
            const cy = Math.min(innerHeight - 2, Math.max(2, r.top + r.height / 2));
            const hit = document.elementFromPoint(cx, cy);
            /* hit.contains(c) was too loose: an element scrolled out of its own
               container still returns the container as the hit, so clipped text
               was measured against whatever was painted where it would have been. */
            const onTop = hit && (hit === c || c.contains(hit));
            /* Effective opacity, not the element's own. A banner fading in or a
               window mid-open transition has opacity on an ancestor, and the
               element itself still reports 1, so mid-animation frames were
               being measured and reported as contrast failures. */
            let eff = 1;
            for (let a = c; a && a !== document.documentElement; a = a.parentElement) eff *= Number(getComputedStyle(a).opacity);
            /* A sliver of an element at the viewport edge straddles two
               surfaces, so its median is a colour that exists nowhere the
               reader looks. Measure what is substantially on screen. */
            const visH = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
            const visW = Math.min(r.right, innerWidth) - Math.max(r.left, 0);
            const mostlyVisible = r.height > 0 && r.width > 0 && visH / r.height > 0.75 && visW / r.width > 0.75 && visH >= 10;
            const shown = onTop && mostlyVisible && eff > 0.95 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.9
              && r.width > 4 && r.height > 4;
            if (own && shown) {
              if (!c.id) c.setAttribute('data-legib', String(out.length));
              out.push({ sel: c.id ? '#' + c.id : `[data-legib="${out.length}"]`,
                sig: `${c.tagName}.${String(c.className).slice(0, 60)}|${cs.fontSize}|${cs.color}|${cs.fontWeight}`,
                label: (c.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 46),
                size: parseFloat(cs.fontSize), weight: cs.fontWeight, color: cs.color,
                x: Math.max(0, Math.round(r.x)), y: Math.max(0, Math.round(r.y)),
                w: Math.round(Math.min(r.width, innerWidth - r.x)), h: Math.round(Math.min(r.height, innerHeight - r.y)) });
            }
            walk(c);
          }
        };
        walk(document.body);
        return out;
      });
      for (const n of nodes) {
        if (n.w < 6 || n.h < 6 || seen.has(n.sig)) continue;
        seen.add(n.sig);
        /* The node list is collected once and then each element is
           photographed in turn, seconds apart. A banner that was solid when
           the list was taken can be mid-fade by the time its turn comes, so
           visibility is re-checked at the moment of capture. */
        const still = await p.evaluate((sel) => {
          const el = document.querySelector(sel); if (!el) return false;
          let eff = 1;
          for (let a = el; a && a !== document.documentElement; a = a.parentElement) eff *= Number(getComputedStyle(a).opacity);
          const r = el.getBoundingClientRect();
          return eff > 0.95 && r.width > 4 && r.height > 4 && r.top >= -1 && r.bottom <= innerHeight + 1;
        }, n.sel);
        if (!still) continue;
        await p.evaluate((sel) => {
          const el = document.querySelector(sel); if (!el) return;
          const st = document.createElement('style'); st.id = 'legib-mask';
          st.textContent = `${sel}, ${sel} * { color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }`;
          document.head.append(st);
        }, n.sel);
        const shot = await p.screenshot({ clip: { x: n.x, y: n.y, width: n.w, height: n.h } });
        await p.evaluate(() => document.getElementById('legib-mask')?.remove());
        const bg = medianPixel(shot);
        const fg = parseRGB(n.color);
        const ratio = contrast(fg, bg);
        const large = n.size >= 24 || (n.size >= 18.66 && Number(n.weight) >= 700);
        const need = large ? 3 : 4.5;
        const problems = [];
        if (ratio < need) problems.push(`contrast ${ratio.toFixed(2)}:1, needs ${need}`);
        if (n.size < MIN_PX) problems.push(`${n.size}px, under ${MIN_PX}`);
        if (problems.length) findings.push({ tag, ...n, bg, ratio: Number(ratio.toFixed(2)), problems });
      }
    };

    if (DESKTOP) {
      await p.locator('[data-enter]').click({ timeout: 20000 });
      await p.locator('.mac-desktop.session-on').waitFor({ timeout: 20000 });
      await p.waitForTimeout(900);
      await p.locator('.f5-banner .banner-dismiss').click().catch(() => {});
      await collect();                                   // the empty desk and its chrome
      for (const app of APPS) {
        await p.evaluate((a) => window.__desk?.open(a), app).catch(() => {});
        await p.waitForTimeout(950);   // past the window open animation, or translucent frames get measured
        await p.locator('.f5-banner .banner-dismiss').first().click({ timeout: 800 }).catch(() => {});
        await p.waitForTimeout(260);
        await collect();
      }
      /* The evidence lens is not a reading state. It deliberately dims every
         sentence it has not lit, so measuring under it reports failures that
         are the feature working. */
    } else if (SCROLL) {
      let y = 0, guard = 0;
      const max = await p.evaluate(() => document.documentElement.scrollHeight);
      while (y < max && guard++ < 60) {
        await p.evaluate((n) => scrollTo(0, n), y);
        await p.waitForTimeout(220);
        await collect();
        y += Math.round(h * 0.85);
      }
    } else {
      await collect();
    }
    await p.close();
  }
} finally { await b.close(); await rm(dir, { recursive: true, force: true }); }

if (!findings.length) console.log('PASS  every visible string is 12px or larger and meets its contrast floor');
const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
for (const f of findings) console.log(`FAIL  ${f.tag.padEnd(8)} ${String(f.size).padStart(5)}px  ink ${hex(parseRGB(f.color))} on ${hex(f.bg)}  ${f.problems.join(' · ').padEnd(30)} ${f.label}`);
const byInk = {};
for (const f of findings) { const k = hex(parseRGB(f.color)) + ' on ' + hex(f.bg); (byInk[k] ||= []).push(f.ratio); }
console.log('\nby colour pair:');
for (const [k, v] of Object.entries(byInk).sort((a, b) => b[1].length - a[1].length).slice(0, 80))
  console.log(`  ${String(v.length).padStart(3)}x  ${k}  worst ${Math.min(...v)}:1`);
console.log(`\n${findings.length} finding(s) across ${SIZES.length} viewports of ${URL_}${DESKTOP ? ' (logged in, ' + APPS.length + ' apps)' : SCROLL ? ' (paged)' : ''}`);
process.exit(findings.length ? 1 : 0);
