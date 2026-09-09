/* ── TYPE GATE ───────────────────────────────────────────────────────────
   Three questions the eye cannot answer on a minified stylesheet:

   1. Does a size ramp exist, or is it a smear? Seven distinct sizes inside a
      4px band is not a hierarchy. Nobody can perceive 12 against 12.5, so a
      reader gets no information from the difference and the designer gets to
      feel like they made a decision.

   2. Is anything below the floor? 12px minimum, and a phone gets LARGER type
      than a desktop, never smaller.

   3. Is the font a choice? `-apple-system` on a macOS simulation is defensible
      for the chrome. It is not defensible for editorial text, and on Windows
      and Android it silently becomes Segoe UI or Roboto, so the whole reason
      for choosing it evaporates for most of the audience.
   ─────────────────────────────────────────────────────────────────────── */
import { readRules, isPhoneMedia, PX } from './css-model.mjs';

const MIN_PX = 12;
const DISPLAY_PX = 17;   // at or below this, a phone must not shrink the type

/* A ramp with real steps. Anything not on it is an orphan that has to justify
   itself. Built on a ~1.2 minor-third-ish progression from a 13px base, with
   display sizes allowed to be fluid. */
export const RAMP = [12, 13, 15, 17, 20, 25, 32, 40, 48, 56, 64];
const nearestStep = (v) => RAMP.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));

/* The ramp lives in type.css as custom properties. A gate that cannot see
   through var() reports every conforming rule as an orphan, which is a gate
   lying about a defect that is not there. */
const RAMP_VARS = { '--t-micro': 12, '--t-fine': 13, '--t-body': 15, '--t-lead': 17, '--t-sub': 20, '--t-h2': 25, '--t-h1': 32 };
const resolveRamp = (v) => { const m = /^var\((--t-[a-z0-9]+)\)/.exec(v.trim()); return m ? RAMP_VARS[m[1]] ?? null : null; };
/* A clamp hides its own floor from every grep for a size. clamp(0.7rem, 1.6vw,
   0.85rem) renders at 11.2px on a narrow screen and reads as a considered
   fluid decision in the source. Read the minimum. */
export const clampFloor = (v) => {
  const m = /^clamp\(\s*([0-9.]+)(rem|px|em)/.exec(String(v).trim());
  if (!m) return null;
  return m[2] === 'px' ? parseFloat(m[1]) : parseFloat(m[1]) * 16;
};

const SYSTEM_ONLY = /^-apple-system|^BlinkMacSystemFont|^system-ui/i;

export function gateType(files) {
  const findings = [];
  const sizes = new Map();       // px -> [{file,selector,media}]
  const stacks = new Map();      // stack -> count
  let faces = 0;
  const baseSizes = new Map();
  const phoneSizes = [];

  for (const file of files) {
    for (const rule of readRules(file)) {
      if (rule.selector.startsWith('@font-face')) { faces++; continue; }
      for (const d of rule.decls) {
        if (d.prop === 'font-family') {
          stacks.set(d.value, (stacks.get(d.value) || 0) + 1);
        }
        if (d.prop === 'font-size' || (d.prop === 'font' && /\d+px/.test(d.value))) {
          const raw = d.prop === 'font-size' ? d.value : (/(\d+(?:\.\d+)?px)/.exec(d.value)?.[1] ?? '');
          const px = PX(raw) ?? resolveRamp(raw);
          const floor = clampFloor(raw);
          if (floor !== null && floor < MIN_PX) {
            findings.push({ gate: 'type', severity: 'high',
              what: `clamp() floor is ${floor.toFixed(1)}px, under the ${MIN_PX}px minimum. A clamp hides its floor from every grep for a size.`,
              where: `${file} · ${rule.selector.slice(0, 70)}` });
          }
          if (px === null) continue;
          if (PX(raw) !== null && px > 0 && px < DISPLAY_PX + 1 && !raw.includes('var(')) {
            findings.push({ gate: 'type', severity: 'medium',
              what: `${px}px written as a literal below the display threshold. Text sizes live on the ramp, not in the rule.`,
              where: `${file} · ${rule.selector.slice(0, 70)}` });
          }
          if (!sizes.has(px)) sizes.set(px, []);
          sizes.get(px).push({ file, selector: rule.selector, media: rule.media });

          if (px < MIN_PX) {
            findings.push({
              gate: 'type', severity: 'high',
              what: `${px}px is under the ${MIN_PX}px floor`,
              where: `${file} · ${rule.selector.slice(0, 70)}${rule.media ? ` @ ${rule.media}` : ''}`,
            });
          }
          /* A phone size is only a violation when it SHRINKS the desktop
             value for the same selector. Flagging every small phone size
             flagged rules that were already the base size, which is a gate
             lying about a defect that is not there. */
          if (isPhoneMedia(rule.media)) phoneSizes.push({ selector: rule.selector, px, file });
          else baseSizes.set(`${file}|${rule.selector}`, px);
        }
      }
    }
  }

  for (const ph of phoneSizes) {
    const base = baseSizes.get(`${ph.file}|${ph.selector}`);
    /* Display type legitimately scales DOWN on a phone: a 30px hero at 390px
       wide is too big, not too small. The rule Rick's correction produced was
       about body, UI and caption text being shrunk to 8px, not about
       headlines. Above DISPLAY_PX, shrinking is correct responsive
       typography, so the gate must not call it a defect. */
    if (base !== undefined && base > DISPLAY_PX) continue;
    if (base !== undefined && ph.px < base) {
      findings.push({
        gate: 'type', severity: 'high',
        what: `${ph.px}px on a phone, down from ${base}px on desktop. Phones get larger type, not smaller.`,
        where: `${ph.file} · ${ph.selector.slice(0, 70)}`,
      });
    }
  }

  /* Ramp conformance. */
  let onRamp = 0, total = 0;
  const orphans = [];
  for (const [px, uses] of sizes) {
    total += uses.length;
    if (RAMP.includes(px)) { onRamp += uses.length; continue; }
    orphans.push({ px, count: uses.length, nearest: nearestStep(px) });
  }
  orphans.sort((a, b) => b.count - a.count);
  const conformance = total ? onRamp / total : 1;
  if (conformance < 0.9) {
    findings.push({
      gate: 'type', severity: 'high',
      what: `${(conformance * 100).toFixed(0)}% of font sizes sit on the ramp. Target 90%.`,
      where: `${orphans.slice(0, 6).map((o) => `${o.px}px×${o.count}→${o.nearest}`).join('  ')}`,
    });
  }

  /* Crowding: distinct sizes inside one perceptual band. */
  const band = [...sizes.keys()].filter((p) => p >= 11 && p <= 16).sort((a, b) => a - b);
  if (band.length > 3) {
    const n = band.reduce((s, p) => s + sizes.get(p).length, 0);
    findings.push({
      gate: 'type', severity: 'high',
      what: `${band.length} distinct sizes (${band.join(', ')}) across ${n} declarations inside an 11-16px band. A reader cannot perceive these as levels.`,
      where: 'the whole type system',
    });
  }

  /* Font choice. */
  const systemOnly = [...stacks].filter(([s]) => SYSTEM_ONLY.test(s.trim()));
  if (faces === 0 && systemOnly.length) {
    findings.push({
      gate: 'type', severity: 'high',
      what: `No @font-face anywhere and ${systemOnly.length} system-only stack(s). Outside macOS this stack is Segoe UI or Roboto, so the one argument for it does not hold for most visitors.`,
      where: systemOnly.map(([s]) => s.slice(0, 60)).join(' | '),
    });
  }

  return { findings, sizes, stacks, faces, conformance, orphans, band };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = process.argv.slice(2);
  const r = gateType(files);
  console.log(`\nsizes: ${r.sizes.size} distinct · ramp conformance ${(r.conformance * 100).toFixed(0)}% · @font-face ${r.faces}`);
  console.log(`stacks:`); for (const [s, c] of r.stacks) console.log(`   ${String(c).padStart(3)}×  ${s.slice(0, 90)}`);
  console.log(`\ntop orphan sizes:`); for (const o of r.orphans.slice(0, 10)) console.log(`   ${String(o.count).padStart(3)}×  ${o.px}px  → nearest step ${o.nearest}px`);
  console.log(`\n${r.findings.length} finding(s)`);
  for (const f of r.findings) console.log(`  [${f.severity}] ${f.what}\n         ${f.where}`);
}
