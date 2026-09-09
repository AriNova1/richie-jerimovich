import test from 'node:test';
import assert from 'node:assert/strict';
import { series, delta, sparkPath } from '../spark.mjs';

const H = [
  { date: '2026-07-01', facts: 100, ran_24h: 3 },
  { date: '2026-06-01', facts: 50, ran_24h: null },
  { date: '2026-08-01', facts: 150, ran_24h: 4 },
];

test('series sorts oldest first and drops rows the field is missing from', () => {
  assert.deepEqual(series(H, 'facts').map((p) => p.v), [50, 100, 150]);
  assert.deepEqual(series(H, 'ran_24h').map((p) => p.v), [3, 4]);
  assert.deepEqual(series(H, 'nope'), []);
  assert.deepEqual(series(null, 'facts'), []);
});

test('delta says how much changed and over how long, from real dates', () => {
  const d = delta(series(H, 'facts'));
  assert.equal(d.from, 50); assert.equal(d.to, 150);
  assert.equal(d.change, 100); assert.equal(d.samples, 3);
  assert.equal(d.days, 61);
  assert.equal(delta([]), null);
});

test('a flat series draws a flat line, not a divide by zero', () => {
  const d = sparkPath([{ date: 'a', v: 7 }, { date: 'b', v: 7 }], { w: 100, h: 20 });
  assert.match(d, /^M[\d.]+ 10\.0 L[\d.]+ 10\.0$/);
  assert.ok(!/NaN/.test(d));
});

test('a single sample is a point, never an invented trend', () => {
  const d = sparkPath([{ date: 'a', v: 3 }], { w: 100, h: 20 });
  assert.equal(d, 'M50.0 10.0');
});

test('the real export draws without NaN in any series', async () => {
  const { readFile } = await import('node:fs/promises');
  const C = JSON.parse(await readFile(new URL('../corpus.json', import.meta.url), 'utf8'));
  const h = C.body?.history || [];
  assert.ok(h.length > 3, 'the export carries no growth history');
  for (const f of ['facts', 'kg_edges', 'gists', 'commits', 'loops_active', 'ran_24h']) {
    const p = sparkPath(series(h, f));
    assert.ok(p.length > 10, `${f} produced no path`);
    assert.ok(!/NaN|Infinity/.test(p), `${f} produced ${p.slice(0, 40)}`);
  }
});
