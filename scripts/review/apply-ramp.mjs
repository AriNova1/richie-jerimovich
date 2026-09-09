/* Collapse the size smear onto the ramp.

   Ten distinct sizes lived in the 11-16px band across 285 declarations.
   This maps every one of them to a step and rewrites the stylesheets. It is
   mechanical on purpose: a hierarchy that needs 12.5px to work is not a
   hierarchy, and hand-picking each of 285 sites would reproduce the same
   drift with more effort.

   Sizes above the display threshold are left alone: those are real
   decisions about headline scale, not drift. */
import { readFileSync, writeFileSync } from 'node:fs';

const MAP = new Map([
  [8, 12], [9, 12], [9.5, 12], [10, 12], [10.5, 12], [11, 12], [11.5, 12],
  [12, 12], [12.5, 13], [13, 13], [13.5, 13],
  [14, 15], [14.5, 15], [15, 15],
  [16, 17], [17, 17],
  [18, 20], [19, 20], [20, 20], [21, 20],
  [22, 25], [24, 25], [25, 25], [26, 25], [28, 25],
  [30, 32], [32, 32], [34, 32],
]);
const VAR = new Map([[12, '--t-micro'], [13, '--t-fine'], [15, '--t-body'], [17, '--t-lead'],
  [20, '--t-sub'], [25, '--t-h2'], [32, '--t-h1']]);

const files = process.argv.slice(2);
const dry = files.includes('--dry');
let changed = 0, kept = 0;
const moves = new Map();

for (const file of files.filter((f) => f !== '--dry')) {
  const src = readFileSync(file, 'utf8');
  const out = src.replace(/font-size:\s*(\d+(?:\.\d+)?)px/g, (m, n) => {
    const px = parseFloat(n);
    const to = MAP.get(px);
    if (to === undefined) { kept++; return m; }
    if (to === px) { kept++; return m; }
    changed++;
    moves.set(`${px}→${to}`, (moves.get(`${px}→${to}`) || 0) + 1);
    return `font-size:var(${VAR.get(to)})`;
  });
  /* Sizes already on a step still become variables, so the ramp is the only
     place a size is written down. */
  const out2 = out.replace(/font-size:\s*(\d+(?:\.\d+)?)px/g, (m, n) => {
    const v = VAR.get(parseFloat(n));
    return v ? `font-size:var(${v})` : m;
  });
  if (!dry && out2 !== src) writeFileSync(file, out2);
}
console.log(`moved ${changed}, left alone ${kept}`);
for (const [k, v] of [...moves].sort((a, b) => b[1] - a[1])) console.log(`   ${String(v).padStart(3)}×  ${k}`);
