/* THE RATE argues with the front door, so its arithmetic has to be the part
   nobody has to take on trust. Everything here is checked against handmade
   fixtures rather than the shipped export, so a change in the export cannot
   quietly make a broken function look correct. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { monthlyRate, spread, bars, monthName, reasonsContaining } from '../apps/rate.mjs';

/* A tiny world: two months, known commits, known verdicts. */
const fixture = {
  log: [
    { sha: 'aaa1', date: '2026-01-04' }, { sha: 'aaa2', date: '2026-01-05' },
    { sha: 'aaa3', date: '2026-01-06' }, { sha: 'aaa4', date: '2026-01-31' },
    { sha: 'bbb1', date: '2026-02-02' }, { sha: 'bbb2', date: '2026-02-03' },
  ],
  kept: [{ commit: 'aaa1', date: '2026-01-04' }, { commit: 'aaa2', date: '2026-01-05' }],
  refused: [
    { commit: 'aaa3', date: '2026-02-01', commit_date: '2026-01-06', reason: 'Journal only.' },
    { commit: 'bbb1', date: '2026-02-04', commit_date: '2026-02-02', reason: 'Nothing visitor facing.' },
  ],
};

test('a month is a month: kept, refused and commits all land in the right one', () => {
  const rows = monthlyRate(fixture);
  assert.deepEqual(rows.map((r) => r.month), ['2026-01', '2026-02']);
  assert.deepEqual(rows[0], { month: '2026-01', kept: 2, refused: 1, commits: 4, rate: 0.5 });
  assert.deepEqual(rows[1], { month: '2026-02', kept: 0, refused: 1, commits: 2, rate: null });
});

test('a refusal is filed under its commit, not the day the judgment was typed', () => {
  /* aaa3 was committed on 6 January and judged on 1 February. The whole
     defect this instrument was built on top of was filing it in February. */
  const rows = monthlyRate(fixture);
  assert.equal(rows[0].refused, 1, 'the January commit was counted in February');
  assert.equal(rows[1].refused, 1);
});

test('the commit log outranks any date written on the row', () => {
  /* Written after the falsification run. The first version of the test above
     could not tell the difference: both the row and the log said January, so
     breaking the log lookup changed nothing and the mutation passed. The log
     is the authority, and a row that disagrees with it must lose. */
  const lying = {
    ...fixture,
    refused: [{ commit: 'aaa3', date: '2026-09-09', commit_date: '2026-09-09', reason: 'x' }],
    kept: [{ commit: 'aaa1', date: '2026-12-25' }],
  };
  const rows = monthlyRate(lying);
  const jan = rows.find((r) => r.month === '2026-01');
  assert.equal(jan.refused, 1, 'a refusal followed the date typed on the row instead of its commit');
  assert.equal(jan.kept, 1, 'a receipt followed the date typed on the row instead of its commit');
  assert.ok(!rows.some((r) => r.month === '2026-09' || r.month === '2026-12'),
    'a month was invented from a date the log contradicts');
});

test('a row whose commit is not in the log falls back to its own date, and says so by landing there', () => {
  const orphan = {
    ...fixture,
    refused: [{ commit: 'zzz9', date: '2026-03-01', commit_date: '2026-03-01', reason: 'x' }],
  };
  const mar = monthlyRate(orphan).find((r) => r.month === '2026-03');
  assert.ok(mar && mar.refused === 1, 'a refusal with no commit in the log vanished from the chart');
});

test('a month with no receipts has no rate, rather than a rate of zero', () => {
  const feb = monthlyRate(fixture)[1];
  assert.equal(feb.rate, null, 'dividing by no receipts produced a number');
});

test('the spread reports the real extremes and the factor between them', () => {
  const rows = [
    { month: '2026-01', kept: 10, refused: 10, commits: 20, rate: 1 },
    { month: '2026-02', kept: 2, refused: 30, commits: 40, rate: 15 },
    { month: '2026-03', kept: 5, refused: 20, commits: 30, rate: 4 },
  ];
  const sp = spread(rows);
  assert.equal(sp.lo.month, '2026-01');
  assert.equal(sp.hi.month, '2026-02');
  assert.equal(sp.factor, 15);
  assert.equal(sp.kept, 17);
  assert.equal(sp.refused, 60);
  assert.ok(Math.abs(sp.avg - 60 / 17) < 1e-9, 'the average is not the average of the totals');
});

test('two months is not a range', () => {
  assert.equal(spread([{ rate: 1, kept: 1, refused: 1 }, { rate: 9, kept: 1, refused: 9 }]), null);
  assert.equal(spread([]), null);
  assert.equal(spread(null), null);
});

test('a column is every commit that month, including the ones never judged', () => {
  const b = bars([{ month: '2026-01', kept: 2, refused: 1, commits: 10, rate: 0.5 }]);
  assert.equal(b[0].unjudged, 7);
  assert.equal(b[0].keptH + b[0].refusedH + b[0].unjudgedH, 1,
    'the three bands do not add up to the column');
});

test('a month whose judged rows exceed its commits still draws inside the axis', () => {
  /* Should not happen, and if the ledgers ever disagree with the log the
     chart must not draw a bar taller than its own scale. */
  const b = bars([
    { month: '2026-01', kept: 9, refused: 9, commits: 2, rate: 1 },
    { month: '2026-02', kept: 0, refused: 0, commits: 4, rate: null },
  ]);
  for (const r of b) {
    assert.ok(r.keptH + r.refusedH + r.unjudgedH <= 1.000001, `${r.month} overflows the axis`);
  }
});

test('reasonsContaining counts a literal word and does not classify', () => {
  const got = reasonsContaining(fixture, '2026-01', 'journal');
  assert.equal(got.total, 1);
  assert.equal(got.hits, 1);
  const none = reasonsContaining(fixture, '2026-02', 'journal');
  assert.equal(none.total, 1);
  assert.equal(none.hits, 0, 'a reason without the word was counted as having it');
});

test('months read as a person would say them', () => {
  assert.equal(monthName('2026-08'), 'August 2026');
  assert.equal(monthName('nonsense'), 'nonsense');
});

test('no corpus means no rows, never an invented month', () => {
  assert.deepEqual(monthlyRate(null), []);
  assert.deepEqual(monthlyRate({}), []);
  assert.deepEqual(bars(null), []);
});

/* One check against the real export: the instrument must not disagree with the
   headline it is arguing with. If these ever diverge, one of them is wrong. */
test('the months add up to the counts the front door publishes', () => {
  const corpus = JSON.parse(readFileSync('workspace/corpus.json', 'utf8'));
  const rows = monthlyRate(corpus);
  const kept = rows.reduce((a, r) => a + r.kept, 0);
  const refused = rows.reduce((a, r) => a + r.refused, 0);
  assert.equal(kept, corpus.counts.kept, `months hold ${kept} receipts, the front door says ${corpus.counts.kept}`);
  assert.equal(refused, corpus.counts.refused, `months hold ${refused} refusals, the front door says ${corpus.counts.refused}`);
});
