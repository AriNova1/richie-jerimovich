import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PLATE, litAt, plateOpacity } from '../plate.mjs';
import { TRACK_END, BANDS } from '../mini-track.mjs';

test('the record is written only once the machine has left the frame, and is complete before the handover', () => {
  assert.ok(PLATE.from > TRACK_END, `plate begins at ${PLATE.from}, the machine leaves at ${TRACK_END}`);
  assert.ok(PLATE.to < 0.94, 'the last square lands before the desktop takes over at .94');
});

test('none before, all by the end, monotonic and reversible in between', () => {
  const n = 111;
  assert.equal(litAt(0, n), 0); assert.equal(litAt(PLATE.from, n), 0); assert.equal(litAt(0.5, n), 0);
  assert.equal(litAt(PLATE.to, n), n); assert.equal(litAt(1, n), n);
  let last = 0;
  for (let p = 0; p <= 1; p += 0.005) { const v = litAt(p, n); assert.ok(v >= last, `not monotonic at ${p}`); last = v; }
  assert.equal(litAt(0.73, n), litAt(0.73, n), 'same progress, same squares');
  assert.equal(litAt(NaN, n), 0); assert.equal(litAt(0.7, 0), 0);
});

test('the voice is on its last line while the record is being written', () => {
  const inside = BANDS.find((b) => b.key === 'inside');
  const mid = (PLATE.from + PLATE.to) / 2;
  assert.ok(inside.from < PLATE.to, 'the last line begins before the writing ends');
  assert.ok(litAt(mid, 111) > 0 && litAt(mid, 111) < 111, 'halfway through the plate the record is half written');
});

test('the plate fades in over the first stretch and is gone at the handover', () => {
  assert.equal(plateOpacity(0.5), 0); assert.equal(plateOpacity(0.55), 0);
  assert.ok(plateOpacity(0.575) > 0 && plateOpacity(0.575) < 1);
  assert.equal(plateOpacity(0.7), 1); assert.equal(plateOpacity(1), 0);
});

test('the controller draws the plate from the export, not from a typed list, and never decides a square\'s ink', () => {
  const src = readFileSync(new URL('../spatial-video.mjs', import.meta.url), 'utf8');
  assert.match(src, /markSVG\(c,\{cols:27,indexed:true/);
  assert.match(src, /style\.opacity=i<lit\?'':'0'/, 'a lit square falls back to the ink the mark gave it');
  assert.match(src, /litAt\(p,plateRects\.length\)/);
});
