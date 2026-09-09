/* ── MOTION ──────────────────────────────────────────────────────────────
   The Motion Director is a seat in .review/STANDARD.md and until now the only
   thing anything measured about motion was whether an infinite animation
   survived prefers-reduced-motion. That is the correctness half. The other
   half is the question the seat is actually for: what does this movement
   mean, and would the reader lose information if it were static.

   A machine can measure the parts of that which are about system rather than
   taste: how many distinct durations exist, whether they cluster inside a
   band nobody can perceive, whether entering and exiting use opposite
   easings, and whether anything moves for longer than a reader will wait.
   ─────────────────────────────────────────────────────────────────────── */
import { readRules } from './css-model.mjs';

/* Perception, not preference. Under ~80ms a transition reads as a jump;
   over ~500ms a reader has moved on and is waiting for the interface. And
   two durations 20ms apart are the same duration to everyone. */
export const FLOOR_MS = 80;
export const CEILING_MS = 520;
export const BAND_MS = 40;      // durations this close are one duration

export const ms = (v) => {
  const m = /^([\d.]+)(ms|s)$/.exec(String(v).trim());
  if (!m) return null;
  return m[2] === 's' ? parseFloat(m[1]) * 1000 : parseFloat(m[1]);
};

/** Every duration in a transition or animation shorthand. */
export function durations(value) {
  return String(value).split(',').flatMap((part) =>
    part.trim().split(/\s+/).map(ms).filter((n) => n !== null && n > 0));
}

export function gateMotion(files) {
  const findings = [];
  const found = new Map();          // duration -> [where]
  const easings = new Map();
  let guarded = 0, keyframes = 0;

  for (const file of files) {
    for (const rule of readRules(file)) {
      if (rule.keyframes) { keyframes++; continue; }
      if (/prefers-reduced-motion/.test(rule.media || '')) { guarded++; continue; }
      for (const d of rule.decls) {
        if (d.prop === 'transition' || d.prop === 'animation'
            || d.prop === 'transition-duration' || d.prop === 'animation-duration') {
          for (const n of durations(d.value)) {
            if (!found.has(n)) found.set(n, []);
            found.get(n).push(`${file} · ${rule.selector.slice(0, 54)}`);
            /* Low, and worded as a question, because the gate cannot tell a
               slow interface from a deliberate reveal. The boot bar takes
               2200ms on purpose; the room fades in over 700ms on purpose. A
               gate that calls those defects is a gate somebody switches off. */
            if (n > CEILING_MS && !/infinite/.test(d.value)) {
              findings.push({ gate: 'motion', severity: 'low',
                what: `${n}ms. Longer than a reader waits for interface feedback, so this should be a reveal or a progress indicator rather than a response.`,
                where: `${file} · ${rule.selector.slice(0, 60)}` });
            }
            if (n < FLOOR_MS) {
              findings.push({ gate: 'motion', severity: 'low',
                what: `${n}ms reads as a jump, not a transition`,
                where: `${file} · ${rule.selector.slice(0, 60)}` });
            }
          }
        }
        if (/cubic-bezier|ease-in|ease-out|ease-in-out|steps\(/.test(d.value) && /transition|animation/.test(d.prop)) {
          const e = (/cubic-bezier\([^)]*\)|ease-in-out|ease-out|ease-in|steps\([^)]*\)/.exec(d.value) || [])[0];
          if (e) easings.set(e, (easings.get(e) || 0) + 1);
        }
      }
    }
  }

  /* Clustering: distinct durations inside one perceptual band. */
  const sorted = [...found.keys()].sort((a, b) => a - b);
  const clusters = [];
  let cur = [];
  for (const n of sorted) {
    if (!cur.length || n - cur[0] <= BAND_MS) cur.push(n);
    else { clusters.push(cur); cur = [n]; }
  }
  if (cur.length) clusters.push(cur);
  for (const c of clusters) {
    if (c.length < 3) continue;
    const uses = c.reduce((s, n) => s + found.get(n).length, 0);
    findings.push({ gate: 'motion', severity: 'medium',
      what: `${c.length} durations (${c.join(', ')}ms) inside a ${BAND_MS}ms band, across ${uses} declarations. A reader cannot tell them apart, so the difference carries nothing.`,
      where: 'the motion system' });
  }

  if (easings.size > 4) {
    findings.push({ gate: 'motion', severity: 'low',
      what: `${easings.size} distinct easing curves. A system needs one for entering, one for leaving, and one for moving.`,
      where: [...easings.keys()].join('  ') });
  }

  return { findings, found, easings, guarded, keyframes, clusters };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = gateMotion(process.argv.slice(2));
  console.log(`\n${r.found.size} distinct durations · ${r.easings.size} easings · ${r.keyframes} keyframe sets · ${r.guarded} rules inside a reduced-motion block\n`);
  for (const [n, w] of [...r.found].sort((a, b) => a[0] - b[0])) console.log(`  ${String(n).padStart(5)}ms  ${String(w.length).padStart(3)}×  ${w[0].slice(0, 62)}`);
  console.log(`\neasings:`); for (const [e, n] of [...r.easings].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}×  ${e}`);
  console.log(`\n${r.findings.length} finding(s)`);
  for (const f of r.findings) console.log(`  [${f.severity}] ${f.what}\n        ${f.where}`);
}
