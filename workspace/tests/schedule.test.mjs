import test from 'node:test';
import assert from 'node:assert/strict';
import { relTime, bandMarks, readState, doorBars, shouldDrawBars } from '../apps/schedule.mjs';

test('relTime never prints a bare zero for something that has not happened', () => {
  assert.equal(relTime(0), '0s');
  assert.equal(relTime(9), '9s');
  assert.equal(relTime(59), '59s');
  assert.equal(relTime(60), '1m');
  assert.equal(relTime(3599), '59m');
  assert.equal(relTime(3600), '1h');
  assert.equal(relTime(3660), '1h 1m');
  assert.equal(relTime(90000), '1d 1h');
  /* the "last finished" clock arrives negative and reads as elapsed */
  assert.equal(relTime(-2696), '44m');
});

test('bandMarks drops anything outside the window it claims to draw', () => {
  const marks = bandMarks([
    { in_seconds: 0, is_this_site: false },
    { in_seconds: 43200, is_this_site: true },
    { in_seconds: 86400, is_this_site: false },
    { in_seconds: 86401, is_this_site: false },   // past the horizon
    { in_seconds: -5, is_this_site: false },      // already fired
    { in_seconds: null, is_this_site: false },
  ]);
  assert.equal(marks.length, 3);
  assert.deepEqual(marks.map((m) => m.at), [0, 0.5, 1]);
  assert.equal(marks[1].site, true);
});

test('readState says only what the payload contains', () => {
  assert.equal(readState({ available: true, scheduled: 20, next: { in_seconds: 3574 }, last: { in_seconds: -2696 } }).line,
    '20 jobs on the schedule · next in 59m · last finished 44m ago');
  assert.equal(readState({ available: true, scheduled: 1 }).line, '1 job on the schedule');
  /* An endpoint that cannot answer must not be dressed as one that did. */
  const down = readState({ available: false, reason: 'The schedule could not be read.' });
  assert.equal(down.ok, false);
  assert.equal(down.line, 'The schedule could not be read.');
  assert.equal(readState(null).ok, false);
});

test('the published payload never carries a job name that is not this site', async () => {
  /* Guards the privacy rule in the endpoint: 20 of Rick's jobs are named in
     the schedule file and exactly one of them may be published. */
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../../scripts/vitals_server.py', import.meta.url), 'utf8');
  assert.ok(src.includes('PUBLIC_JOB = "nightly-richie-site-stewardship"'));
  assert.ok(src.includes('"name": PUBLIC_JOB if named else None'),
    'the endpoint must not publish an arbitrary job name');
  assert.ok(!/j\.get\("prompt"\)|j\.get\("last_error"\)|j\.get\("workdir"\)|j\.get\("deliver"\)/.test(src),
    'the endpoint must not read a prompt, an error string, a workdir or a delivery target');
});

/* The door bars. A chart of counts must not flatter a quiet week, and must not
   draw a real day as nothing or a zero as something. */
test('bar heights are relative to the busiest day in the window', () => {
  const bars = doorBars([{ date: 'a', count: 10 }, { date: 'b', count: 5 }, { date: 'c', count: 0 }]);
  assert.equal(bars[0].h, 1);
  assert.equal(bars[1].h, 0.5);
});

test('a day with opens is never drawn as nothing', () => {
  const bars = doorBars([{ date: 'a', count: 400 }, { date: 'b', count: 1 }]);
  assert.ok(bars[1].h >= 0.08, `a real day was drawn at ${bars[1].h}`);
});

test('a true zero is drawn as zero, not as the floor', () => {
  const bars = doorBars([{ date: 'a', count: 9 }, { date: 'b', count: 0 }]);
  assert.equal(bars[1].h, 0);
});

test('an all-quiet window draws flat rather than dividing by zero', () => {
  const bars = doorBars([{ date: 'a', count: 0 }, { date: 'b', count: 0 }]);
  assert.deepEqual(bars.map((b) => b.h), [0, 0]);
});

test('no data means no bars, never a shape', () => {
  assert.deepEqual(doorBars(null), []);
  assert.deepEqual(doorBars([]), []);
});

test('one day of history draws no chart', () => {
  assert.equal(shouldDrawBars([{ date: 'a', count: 6 }]), false);
  assert.equal(shouldDrawBars([{ date: 'a', count: 6 }, { date: 'b', count: 0 }]), false);
});

test('three days with opens is enough for a shape to mean something', () => {
  assert.equal(shouldDrawBars([{ date: 'a', count: 1 }, { date: 'b', count: 0 }, { date: 'c', count: 4 }, { date: 'd', count: 2 }]), true);
});

test('an empty window draws no chart', () => {
  assert.equal(shouldDrawBars([]), false);
  assert.equal(shouldDrawBars(null), false);
});
