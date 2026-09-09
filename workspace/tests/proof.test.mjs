/* The checks in Run the Proof must be able to fail.

   The app's own claim is "every one of them can fail", which is a claim about
   the code and therefore checkable here. Each case corrupts one thing in a
   copy of the export and asserts the matching check goes red. A check that
   stays green under a corruption it is supposed to catch is a decoration
   wearing a tick. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildChecks } from '../apps/proof.mjs';

const text = await readFile(new URL('../corpus.json', import.meta.url), 'utf8');
const base = JSON.parse(text);
const journal = JSON.parse(await readFile(new URL('../data/journal.json', import.meta.url), 'utf8'));

/* The corrections check fetches journal.json; in node there is no fetch to a
   relative path, so serve it from memory. */
globalThis.fetch = async (u) => {
  if (String(u).includes('journal.json')) return { ok: true, json: async () => journal };
  throw new Error(`unexpected fetch: ${u}`);
};

const clone = () => JSON.parse(JSON.stringify(base));
const digest = async (s) => {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
};
const HASH = await digest(text);

async function runOne(id, corpus, corpusText = text, statedHash = HASH) {
  const c = buildChecks({ corpus, corpusText, statedHash }).find((x) => x.id === id);
  assert.ok(c, `no check called ${id}`);
  return c.run();
}

test('every check passes against the shipped export', async () => {
  const checks = buildChecks({ corpus: base, corpusText: text, statedHash: HASH });
  for (const c of checks) {
    const r = await c.run();
    assert.equal(r.ok, true, `${c.id} failed on the real export: ${r.detail}`);
  }
});

const CORRUPTIONS = [
  ['hash', (c) => c, 'a text that is not the export'],
  ['counts', (c) => { c.counts.refused = 999; return c; }],
  ['corrections', (c) => { c.corrections[0].quote = 'A sentence nobody ever wrote in this journal.'; return c; }],
  ['evidence', (c) => { c.kept[0].evidence = []; return c; }],
  ['refusals', (c) => { c.refused[0].commit = ''; return c; }],
  ['mark', (c) => { c.kept_by_date = {}; return c; }],
  ['sources', (c) => { c.writing[0].file = 'nowhere.txt'; return c; }],
];

for (const [id, corrupt, altText] of CORRUPTIONS) {
  test(`${id}: goes red when the thing it checks is wrong`, async () => {
    const c = corrupt(clone());
    const r = await runOne(id, c, altText || JSON.stringify(c));
    assert.equal(r.ok, false, `${id} stayed green under a corruption it exists to catch`);
    assert.ok(String(r.detail || '').length > 4, `${id} failed without saying why`);
  });
}

test('a check reports honestly when it has nothing to compare against', async () => {
  const r = await runOne('hash', base, text, null);
  assert.equal(r.ok, false);
  assert.match(r.detail, /digest/i);
});
