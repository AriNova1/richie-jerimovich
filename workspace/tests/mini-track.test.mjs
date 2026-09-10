import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TRACK, TRACK_END, miniAt, voiceAt, BANDS } from '../mini-track.mjs';

const record = JSON.parse(readFileSync(new URL('../data/mini-track.json', import.meta.url), 'utf8'));
const corpus = JSON.parse(readFileSync(new URL('../corpus.json', import.meta.url), 'utf8'));
const src = readFileSync(new URL('../spatial-video.mjs', import.meta.url), 'utf8');

test('the table in the module is the measurement on disk, row for row', () => {
  assert.equal(TRACK.length, record.length);
  record.forEach((r, i) => { for (const k of ['p', 'x', 'y', 'w', 'h']) assert.equal(TRACK[i][k], r[k], `${k} at row ${i}`); });
});

test('the record was measured, not typed: every row carries its correlation score and only the last row touches the edge', () => {
  assert.ok(record.every((r) => typeof r.ncc === 'number' && r.ncc > 0.5), 'a row without a score is a row somebody typed');
  assert.equal(record.at(-1).edge, true);
  assert.ok(record.slice(0, -1).every((r) => r.edge === false));
});

test('the camera only ever moves in: progress, position and size are monotonic', () => {
  for (let i = 1; i < TRACK.length; i++) {
    assert.ok(TRACK[i].p > TRACK[i - 1].p, `p at ${i}`);
    assert.ok(TRACK[i].x >= TRACK[i - 1].x, `x at ${i}`);
    assert.ok(TRACK[i].y >= TRACK[i - 1].y, `y at ${i}`);
    assert.ok(TRACK[i].w >= TRACK[i - 1].w, `w at ${i}`);
  }
});

test('frame 0 agrees with the August measurement of the same picture', () => {
  const k = miniAt(0);
  assert.ok(Math.abs(k.x - 0.540) < 0.01 && Math.abs(k.y - 0.606) < 0.01, JSON.stringify(k));
});

test('between keyframes the position is interpolated; past the end there is nothing to point at', () => {
  const a = TRACK[10], b = TRACK[11], mid = miniAt((a.p + b.p) / 2);
  assert.ok(Math.abs(mid.x - (a.x + b.x) / 2) < 1e-9);
  assert.ok(Math.abs(mid.y - (a.y + b.y) / 2) < 1e-9);
  const last = TRACK.at(-1);
  assert.deepEqual(miniAt(TRACK_END), { x: last.x, y: last.y, w: last.w, h: last.h });
  assert.equal(miniAt(TRACK_END + 0.001), null);
  assert.equal(miniAt(1), null);
  assert.equal(miniAt(-0.1), null);
  assert.equal(miniAt(NaN), null);
});

test('the machine leaves the frame after the desk stop and before the screen has filled it', () => {
  assert.ok(TRACK_END > 0.48 && TRACK_END < 0.6, String(TRACK_END));
});

test('the voice covers the whole walk in, one line at a time, no gaps and no overlaps', () => {
  assert.equal(BANDS[0].from, 0);
  for (let i = 1; i < BANDS.length; i++) assert.equal(BANDS[i].from, BANDS[i - 1].to);
  assert.ok(BANDS.at(-1).to >= 1);
  const keys = new Set();
  for (let p = 0; p <= 1; p += 0.01) { const v = voiceAt(p, corpus); assert.ok(v, `nothing said at ${p}`); keys.add(v.key); }
  assert.equal(keys.size, BANDS.length);
});

test('the second line begins exactly where the invitation has finished fading', () => {
  const m = /const intro=1-smooth\(\.025,(\.\d+),p\)/.exec(src);
  assert.ok(m, 'cannot find the invitation fade in spatial-video.mjs');
  assert.equal(BANDS[1].from, Number(m[1]));
  assert.equal(voiceAt(0.239, corpus).key, 'rest');
  assert.equal(voiceAt(0.24, corpus).key, 'desk');
});

test('the last line is still being said when the marker starts to fade, and the fade ends before the handover', () => {
  const m = /--mm-fade',String\(1-smooth\((\.\d+),(\.\d+),p\)\)/.exec(src);
  assert.ok(m, 'cannot find the marker fade');
  assert.ok(Number(m[1]) >= BANDS.at(-1).from, 'the fade begins before the last line does');
  assert.ok(Number(m[2]) <= 0.94, 'the marker is still visible when the desktop takes over');
});

test('every figure in the last line is read from the export, not typed', () => {
  const c = structuredClone(corpus);
  c.counts.kept = 1234; c.counts.refused = 99; c.corrections = [{}];
  const t = voiceAt(0.9, c).text;
  assert.match(t, /\b1234 receipts kept\b/);
  assert.match(t, /\b99 commits that earned none\b/);
  assert.match(t, /\b1 thing I published that was not true\b/);
  assert.equal(voiceAt(0.9, corpus).tier, 'derived');
  assert.match(voiceAt(0.9, corpus).text, new RegExp(`\\b${corpus.counts.kept} receipts kept\\b`));
});

test('the rest line describes the machine as the export does, in the first person', () => {
  const v = voiceAt(0, corpus), s = corpus.body.system;
  assert.equal(v.tier, 'export');
  assert.equal(v.text, `This is me. ${s.cores} cores, ${Math.round(s.mem_total_gb)} GB. ${corpus.identity.age_days} days in here so far.`);
  assert.equal(voiceAt(0, { identity: {}, body: {}, counts: {} }).text, 'This is me. This is where the record is written.');
});

test('no em dashes, one voice, and nothing in the room is his', () => {
  for (const b of BANDS) {
    const t = voiceAt(b.from, corpus).text;
    assert.ok(!t.includes('—'), `${b.key}: em dash`);
    assert.ok(!/\bmy (desk|room|chair|keyboard|monitor|screen|window)\b/i.test(t), `${b.key}: claims a thing in the room`);
    assert.ok(/\bI\b|\bme\b|\bmine\b/.test(t), `${b.key}: not first person`);
  }
});

test('the room, the desk and the box are all named as Rick\'s before the reader is told what is his', () => {
  assert.match(voiceAt(0.3, corpus).text, /Rick's/);
  assert.match(voiceAt(0.6, corpus).text, /Rick's/);
  assert.match(voiceAt(0.6, corpus).text, /no screen of its own/);
});

test('the lines fit the card', () => {
  for (const b of BANDS) { const t = voiceAt(b.from, corpus).text; assert.ok(t.length <= 140, `${b.key}: ${t.length} characters`); }
});

test('the controller reads the track and the voice from the module, and no longer keeps a hand-typed position', () => {
  assert.match(src, /import \{miniAt, voiceAt\} from '\.\/mini-track\.mjs'/);
  assert.ok(!/const MINI\s*=/.test(src), 'a typed MINI constant is back');
  assert.ok(!/miniCopy\(/.test(src), 'miniCopy is back: the rest line lives in the module now');
});
