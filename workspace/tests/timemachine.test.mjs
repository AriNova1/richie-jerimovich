import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildHistory, stateAt} from '../apps/timemachine.mjs';
import {createDocumentLibrary} from '../documents.mjs';

const corpus = JSON.parse(await readFile(new URL('../corpus.json', import.meta.url), 'utf8'));
const documents = createDocumentLibrary(corpus);
const H = buildHistory(corpus, documents);

test('the day index covers every dated record exactly once and ends at the export totals', () => {
  const dated = (list, f = (r) => r.date) => list.filter((r) => f(r)).length;
  /* corrections carry `published`, not `date`: they are dated by when the
     correction went out, which is sometimes a day after the claim. */
  const dateOf = (r) => r.published || r.date;
  assert.equal(H.dates.length, new Set([...corpus.kept, ...corpus.refused, ...corpus.log, ...corpus.writing, ...corpus.corrections].map(dateOf).filter(Boolean)).size);
  assert.equal(H.totals.kept, dated(corpus.kept)); assert.equal(H.totals.refused, dated(corpus.refused)); assert.equal(H.totals.commits, dated(corpus.log)); assert.equal(H.totals.writing, dated(corpus.writing)); assert.equal(H.totals.corrections, dated(corpus.corrections, dateOf));
  assert.deepEqual(H.days.get(H.last).asOf, H.totals);
  for (let i = 1; i < H.dates.length; i++) for (const k of Object.keys(H.totals)) assert.ok(H.days.get(H.dates[i]).asOf[k] >= H.days.get(H.dates[i - 1]).asOf[k], 'monotonic ' + k);
});

test('June 10 carries the CI story: four commits, one kept receipt, one refusal, one journal', () => {
  const d = H.days.get('2026-06-10');
  assert.ok(d);
  const shas = d.commits.map((c) => c.ref.key.slice(0, 7));
  for (const x of ['1617090', 'faf0352', 'aee05db', '8cf4da0']) assert.ok(shas.includes(x), x + ' is dated June 10 in the export');
  assert.ok(d.kept.some((k) => k.ref.key === 'ar-2026-06-10-control-room-homepage-ci-build-path'));
  assert.ok(d.refused.some((r) => r.record.commit === 'faf0352'));
  assert.ok(d.writing.some((w) => w.ref.key === '2026-06-10-the-site-learned-to-build-without-me'));
});

test('a day with no records answers "nothing" and carries the previous state, never an invented one', () => {
  // find a real gap: the first calendar day after H.first that has no records
  let gap = null, prev = null;
  for (const d of H.dates) { if (prev) { const n = new Date(prev + 'T00:00:00Z'); n.setUTCDate(n.getUTCDate() + 1); const cand = n.toISOString().slice(0, 10); if (cand !== d) { gap = cand; break; } } prev = d; }
  assert.ok(gap, 'the ledger has at least one silent day');
  const s = stateAt(H, gap);
  assert.equal(s.authored, null);
  assert.equal(s.lastRecordedDay, H.dates.filter((d) => d < gap).at(-1));
  assert.deepEqual(s.asOf, H.days.get(s.lastRecordedDay).asOf);
  const before = stateAt(H, '2000-01-01');
  assert.deepEqual(before.asOf, {kept: 0, refused: 0, commits: 0, writing: 0, corrections: 0});
  assert.equal(before.lastRecordedDay, null);
});
