/* A line drawn through a dead number.

   Activity Monitor drew "Facts held", "Connections between them" and
   "Summaries kept" as sparklines with a note reading "+317 across 28 snapshots
   over 82 days". Every word of that was accurate about the window and wrong
   about the fact: all 317 landed before 10 July, and the series has been
   flat ever since, because the store those numbers count was decommissioned on
   2026-07-02. The file has not been written since. The chart was drawing a
   plateau where the truth was a retirement, and nobody was told.

   This is the gate that would have caught it. Any field the workspace charts
   as growth has to have actually moved recently. If it has not, either the
   thing stopped and the page should say so, or the collector is reading
   something that is no longer running. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync('workspace/mac.js', 'utf8');
const corpus = JSON.parse(readFileSync('workspace/corpus.json', 'utf8'));
const history = [...(corpus.body?.history || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));

/** The fields the workspace is willing to draw a rising line through. */
const charted = () => {
  const block = /const GROWTH = \[([\s\S]*?)\];/.exec(SRC);
  assert.ok(block, 'the GROWTH list is gone from Activity Monitor');
  return [...block[1].matchAll(/\['([a-z_0-9]+)',/g)].map((m) => m[1]);
};

/** How many of the most recent snapshots this field has been unchanged for. */
const flatFor = (field) => {
  const pts = history.filter((r) => r[field] != null);
  if (pts.length < 2) return 0;
  const last = pts.at(-1)[field];
  let n = 0;
  for (let i = pts.length - 2; i >= 0; i -= 1) {
    if (pts[i][field] !== last) break;
    n += 1;
  }
  return n;
};

const STALE_AFTER = 8;   // snapshots without movement before a line is a lie

test('the export has a growth history to check', () => {
  assert.ok(history.length >= 5, `only ${history.length} snapshots`);
});

test('every field charted as growth has actually moved recently', () => {
  const dead = [];
  for (const field of charted()) {
    const flat = flatFor(field);
    if (flat >= STALE_AFTER) {
      const pts = history.filter((r) => r[field] != null);
      const since = pts[pts.length - 1 - flat]?.date;
      dead.push(`${field}: unchanged across the last ${flat} snapshots, since ${since}`);
    }
  }
  assert.deepEqual(dead, [],
    `a sparkline is being drawn through a number that stopped moving:\n  ${dead.join('\n  ')}`);
});

test('the memory counts say which store they measure and when it last moved', () => {
  const mem = corpus.body?.memory || {};
  assert.ok(mem.store, 'body.memory.store is missing, so no page can name what it is quoting');
  assert.match(String(mem.measured_at), /^\d{4}-\d{2}-\d{2}$/,
    'body.memory.measured_at is not a date read from the store itself');
});

test('the memory figures are not presented as current anywhere in the workspace', () => {
  assert.ok(
    !/Memory contents and store measurements are not included/.test(SRC),
    'the Hermes window still claims the export has no store measurements, which it does',
  );
});
