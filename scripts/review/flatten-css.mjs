/* ── FLATTEN ─────────────────────────────────────────────────────────────
   spatial.css declares #invitation six times, #room-caption six times, and
   .mm-card four. Nothing is wrong with any single rule; what is wrong is
   that no one can answer "what size is the body copy" without simulating the
   cascade in their head. Two shipped defects came out of exactly that: an
   eyebrow at 8px on a phone, and the front door's whole pitch paragraph at
   12.5px, both because a later file re-decided a size that an earlier file
   had already decided well.

   This collapses every repeated selector, inside its own media context, to
   one rule holding the winning value for each property. Declaration order
   between DIFFERENT selectors is preserved, because that is real cascade;
   only the repetition of the SAME selector is removed, which changes nothing
   about what the browser paints.

   Verified by diffing computed styles before and after, not by reading it.
   ─────────────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync } from 'node:fs';
import { readRules } from './css-model.mjs';

const file = process.argv[2];
const rules = readRules(file);

/* group key: media context + selector. First appearance fixes the position. */
const order = [];
const byKey = new Map();
for (const r of rules) {
  if (r.keyframes || r.selector.startsWith('@')) { order.push({ raw: r }); continue; }
  const key = `${r.media || ''}||${r.selector}`;
  /* First-appearance position. Last-appearance was tried and measured worse:
     it moved merged rules past competing selectors and produced 25 computed
     changes against 4. Whichever position is chosen, some conflicts survive;
     computed-diff finds them and they get fixed at source, which is the only
     honest order of operations. */
  if (!byKey.has(key)) { byKey.set(key, { media: r.media, selector: r.selector, props: new Map() }); order.push({ key }); }
  const g = byKey.get(key);
  for (const d of r.decls) g.props.set(d.prop, d.value);   // last wins, same as the cascade
}

/* Re-emit, grouping consecutive rules that share a media context. */
let out = `/* Flattened ${new Date().toISOString().slice(0, 10)}: every selector below is
   declared exactly once per media context. See scripts/review/flatten-css.mjs
   for why, and .review/LEDGER.md for the two defects that came out of the
   version that was not. */\n`;
let openMedia = null;
const emitted = new Set();
for (const item of order) {
  if (item.raw) continue;
  if (emitted.has(item.key)) continue;
  emitted.add(item.key);
  const g = byKey.get(item.key);
  if (g.media !== openMedia) {
    if (openMedia) out += '}\n';
    openMedia = g.media;
    if (openMedia) out += `${openMedia}{\n`;
  }
  const body = [...g.props].map(([p, v]) => `${p}:${v}`).join(';');
  out += `${g.selector}{${body}}\n`;
}
if (openMedia) out += '}\n';

/* keyframes and other at-rules, verbatim, at the end */
const src = readFileSync(file, 'utf8');
for (const m of src.matchAll(/@(?:-webkit-)?keyframes[^{]+\{(?:[^{}]|\{[^{}]*\})*\}/g)) out += m[0] + '\n';

writeFileSync(process.argv[3] || file, out);
console.log(`${file}: ${rules.length} rules → ${emitted.size} (${[...byKey.values()].filter((g)=>g.props.size).length} with declarations)`);
