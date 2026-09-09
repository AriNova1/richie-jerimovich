#!/usr/bin/env node
/* One command that runs every static gate and reports as a block.

   Static only by default, because these run in CI where there is no server
   and no browser. Pass --live <url> to add the browser gates.

   Exit 1 on any stop-ship or high finding. Medium and low are reported and
   do not fail the build: a gate that blocks on taste is a gate that gets
   switched off. */
import { gateType } from './gate-type.mjs';
import { gateCopy, walk } from './gate-copy.mjs';
import { readdirSync, statSync } from 'node:fs';

const args = process.argv.slice(2);
const liveAt = args.includes('--live') ? args[args.indexOf('--live') + 1] : null;

/* Two design systems live in this repo and they are not the same system.
   `workspace` is the new experience: three registers, one px ramp. `site` is
   the Jekyll interior, on a rem/clamp scale with Outfit and Bricolage. Scoring
   them together produced a false crowding finding, because the union of two
   coherent scales looks like one incoherent one. They are measured apart. */
const SYSTEMS = {
  workspace: () => walk('workspace', ['.css']).filter((f) => !f.endsWith('.min.css')),
  site: () => (safe(() => walk('assets/css', ['.css'])) || [])
    .concat(safe(() => ['assets/style.css'].filter(exists)) || [])
    .filter((f) => !f.endsWith('.min.css')),
};
const only = args.includes('--system') ? args[args.indexOf('--system') + 1] : 'workspace';
const css = (SYSTEMS[only] || SYSTEMS.workspace)();
const copy = [
  'index.html', '404.html', 'about.md', 'privacy.md', 'llms.txt',
  ...walk('workspace', ['.html', '.mjs', '.js']),
].filter(exists);

function safe(fn) { try { return fn(); } catch { return null; } }
function exists(f) { try { statSync(f); return true; } catch { return false; } }

const findings = [];
const t = gateType(css);
findings.push(...t.findings);
findings.push(...gateCopy(copy));

/* The other system is measured too, and reported, and does not block: it is a
   different scale with a different job, and quietly holding it to this ramp
   would either produce noise or push me to unify two systems that have not
   been ruled on. It is a queue item, not a build failure. */
const other = Object.keys(SYSTEMS).find((k) => k !== only);
const o = gateType(SYSTEMS[other]());
const oBlocking = o.findings.filter((f) => f.severity === 'stop-ship' || f.severity === 'high').length;

if (liveAt) {
  /* Reach needs a running server, so it rides with --live. It is the gate
     that would have caught the launch orphaning sixteen published pages, and
     nothing else on this list can see that class of defect: every one of
     those pages still returned 200 at its own URL. */
  const { execFileSync } = await import('node:child_process');
  try {
    execFileSync(process.execPath, ['scripts/review/gate-reach.mjs', liveAt.replace(/\/[^/]*$/, '')], { stdio: 'inherit' });
  } catch {
    findings.push({ gate: 'reach', severity: 'high', what: 'shipped surfaces are unreachable from the front door', where: 'see the list above' });
  }
  const { liveGates } = await import('./gate-live.mjs');
  for (const [w, h, label] of [[1440, 900, 'desktop'], [390, 844, 'phone']]) {
    const r = await liveGates(liveAt, { viewport: { width: w, height: h }, label });
    findings.push(...r.findings);
    const cap = label === 'phone' ? 8_000_000 : 12_000_000;
    if (r.bytes.total > cap) findings.push({ gate: 'weight', severity: 'high',
      what: `${(r.bytes.total / 1e6).toFixed(2)} MB over a ${(cap / 1e6)} MB budget`, where: label });
  }
}

const rank = { 'stop-ship': 0, high: 1, medium: 2, low: 3 };
findings.sort((a, b) => rank[a.severity] - rank[b.severity]);

console.log(`\n${only}: ${t.sizes.size} sizes · ${(t.conformance * 100).toFixed(0)}% on the ramp · ${t.faces} @font-face · ${t.stacks.size} stacks`);
console.log(`${other}: ${o.sizes.size} sizes · ${o.faces} @font-face · ${o.stacks.size} stacks · ${oBlocking} finding(s), not blocking (see .review/QUEUE.md)`);
console.log(`checked ${css.length} stylesheets and ${copy.length} copy surfaces${liveAt ? ` plus ${liveAt}` : ''}\n`);
for (const f of findings) console.log(`[${f.severity}] ${f.gate}: ${f.what}\n    ${f.where}${f.quote ? `\n    "${f.quote}"` : ''}`);
const blocking = findings.filter((f) => f.severity === 'stop-ship' || f.severity === 'high');
console.log(`\n${findings.length} finding(s), ${blocking.length} blocking.`);
console.log(`No gate here can tell you whether a sentence pulls the right string,\nor whether a layout is worth looking at. Those are seats. See .review/STANDARD.md.`);
process.exit(blocking.length ? 1 : 0);
