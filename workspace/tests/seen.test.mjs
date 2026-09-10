/* The rule that decides whether a person is counted lives in one pure
   function, so it can be argued with here rather than trusted in a browser. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldCount, count, lastDays, KEY } from '../seen.mjs';

const win = (over = {}) => {
  const store = new Map(Object.entries(over.stored || {}));
  return {
    navigator: over.navigator || {},
    doNotTrack: over.doNotTrack,
    sessionStorage: over.noStorage ? null : {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, v),
    },
    _store: store,
  };
};

test('a plain first visit is counted', () => {
  assert.equal(shouldCount(win()), true);
});

test('Do Not Track is honoured, in every spelling a browser has used', () => {
  assert.equal(shouldCount(win({ navigator: { doNotTrack: '1' } })), false);
  assert.equal(shouldCount(win({ doNotTrack: '1' })), false);
  assert.equal(shouldCount(win({ navigator: { doNotTrack: 'yes' } })), false);
  assert.equal(shouldCount(win({ navigator: { msDoNotTrack: '1' } })), false);
});

test('Global Privacy Control is honoured', () => {
  assert.equal(shouldCount(win({ navigator: { globalPrivacyControl: true } })), false);
});

test('a tab that has already been counted is not counted again', () => {
  assert.equal(shouldCount(win({ stored: { [KEY]: '1' } })), false);
});

test('a browser with storage switched off is not counted, rather than counted twice', () => {
  assert.equal(shouldCount(win({ noStorage: true })), false);
});

test('an opted-out reader makes no request at all, so the server cannot learn they opted out', async () => {
  let called = 0;
  const w = win({ navigator: { doNotTrack: '1' } });
  const got = await count(w, () => { called += 1; return Promise.resolve({ ok: true }); });
  assert.equal(called, 0);
  assert.equal(got, false);
});

test('counting marks the tab before the request, so a slow network cannot double count', async () => {
  const w = win();
  let seenMark = null;
  await count(w, () => { seenMark = w._store.get(KEY); return Promise.resolve({ ok: true }); });
  assert.equal(seenMark, '1');
});

test('a failed beacon is silent and does not throw', async () => {
  const got = await count(win(), () => Promise.reject(new Error('offline')));
  assert.equal(got, false);
});

test('a quiet day reads as zero, not as a gap', () => {
  const days = lastDays(
    { days: [{ date: '2026-09-07', count: 4 }, { date: '2026-09-09', count: 2 }] },
    3,
    new Date('2026-09-09T12:00:00'),
  );
  assert.deepEqual(days.map((d) => d.count), [4, 0, 2]);
});

test('no payload means no series, never an invented one', () => {
  assert.deepEqual(lastDays(null), []);
  assert.deepEqual(lastDays({}), []);
});
