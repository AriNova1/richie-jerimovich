import test from 'node:test';
import assert from 'node:assert/strict';
import { STOPS, nextStop, shouldOffer, markSeen } from '../tour.mjs';

test('the tour ends rather than looping', () => {
  assert.equal(nextStop(0), 1);
  assert.equal(nextStop(STOPS.length - 1), null);
});

test('every stop names an app the desktop actually registers', async () => {
  const { readFileSync } = await import('node:fs');
  const mac = readFileSync(new URL('../mac.js', import.meta.url), 'utf8');
  for (const s of STOPS) {
    assert.ok(new RegExp(`appHost\\.register\\('${s.app}'|id === '${s.app}'|case '${s.app}'|'${s.app}':`).test(mac),
      `the tour opens "${s.app}", which nothing on the desktop mounts`);
  }
});

test('every stop says something, and says it without an em dash', () => {
  for (const s of STOPS) {
    assert.ok(s.title.length > 3 && s.line.length > 40, `${s.app} has no copy`);
    assert.ok(!/—/.test(s.title + s.line), `${s.app} has an em dash in visible copy`);
  }
});

test('a returning visitor is not offered the tour again', () => {
  const store = new Map();
  const fake = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  assert.equal(shouldOffer(fake), true);
  markSeen(fake);
  assert.equal(shouldOffer(fake), false);
});

test('a browser that refuses storage still offers it, and does not throw', () => {
  const hostile = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(shouldOffer(hostile), true);
  assert.doesNotThrow(() => markSeen(hostile));
});
