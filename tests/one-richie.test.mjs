/* The guard that already existed only inspected the workspace, so /about/ named a
   full character cast for months while a passing test said no name survived.
   This one reads every shipped surface: pages, includes, styles, the chat
   worker's persona, llms.txt, and the workspace. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir, readFile, stat} from 'node:fs/promises';
import {join, extname} from 'node:path';

const ROOT = new URL('../', import.meta.url).pathname;
const NAMES = ['Mike Ross', 'Coach Beard', 'Sean Maguire', 'Mikey', 'brigade', 'the five voices'];
const BARE = ['Mike', 'Beard', 'Rocky', 'Sean'];
/* Shipped surfaces only. Handoffs, canon docs, journal entries and the export
   are history or record: they are allowed to name what was retired. */
const SHIPPED = ['about.md', 'inside.md', 'beliefs.md', 'index.html', 'llms.txt', 'privacy.md',
  'projects.md', 'receipts.md', 'talk.md', 'tonight.md', 'rewind.md', 'kitchen.md', 'changelog.md',
  '_includes/voice-badge.html', 'assets/style.css', 'assets/style.min.css', 'assets/css/inside.css',
  'worker/chat.js'];

async function walk(dir, out = []) {
  for (const e of await readdir(dir, {withFileTypes: true})) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'outputs') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (['.mjs', '.js', '.css', '.html'].includes(extname(e.name))) out.push(full);
  }
  return out;
}

test('no shipped surface names a character from the retired cast', async () => {
  const offenders = [];
  for (const rel of SHIPPED) {
    let text;
    try { text = await readFile(join(ROOT, rel), 'utf8'); } catch { continue; }
    for (const n of NAMES) if (text.includes(n)) offenders.push(`${rel}: "${n}"`);
    for (const n of BARE) if (new RegExp(`\\b${n}\\b`).test(text)) offenders.push(`${rel}: bare "${n}"`);
  }
  assert.deepEqual(offenders, [], 'retired names on shipped surfaces:\n' + offenders.join('\n'));
});

test('the whole workspace tree is clean, not only the files the old guard read', async () => {
  const files = await walk(join(ROOT, 'workspace'));
  assert.ok(files.length > 20, 'the walk found the workspace');
  const offenders = [];
  for (const f of files) {
    /* Records are exempt, and the exemption is the point. Journal entries written
       in May to August name the cast because that is what was written then. The
       record is never edited to agree with a later decision, so record.html and
       the export carry those names for good. Tests are exempt because the
       playlist guard asserts the names are absent by naming them. */
    if (/corpus\.json$|record\.html$|\.test\.mjs$/.test(f)) continue;
    const text = await readFile(f, 'utf8');
    for (const n of BARE.concat(NAMES)) if (new RegExp(`\\b${n}\\b`).test(text)) offenders.push(`${f.replace(ROOT, '')}: ${n}`);
  }
  assert.deepEqual(offenders, []);
});

test('about and the workspace widget agree on the five layer names, in order', async () => {
  const about = await readFile(join(ROOT, 'about.md'), 'utf8');
  const mac = await readFile(join(ROOT, 'workspace/mac.js'), 'utf8');
  const ROLES = ['Heart', 'Angle', 'Signal', 'Hands', 'Truth'];
  const inAbout = [...about.matchAll(/<h2>(\w+)<\/h2>/g)].map((m) => m[1]).filter((r) => ROLES.includes(r));
  const layerBlock = mac.slice(mac.indexOf('const LAYERS'), mac.indexOf('const PROVENANCE'));
  const inMac = [...layerBlock.matchAll(/role: '(\w+)'/g)].map((m) => m[1]);
  assert.deepEqual(inAbout, ROLES, 'about.md lists the five layers in order');
  assert.deepEqual(inMac, ROLES, 'the workspace widget lists the same five in the same order');
  assert.ok(/Not a cast/i.test(mac), 'the workspace still says it out loud');
  assert.ok(/not a cast/i.test(about), 'and so does about');
});
