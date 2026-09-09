import test from 'node:test';
import assert from 'node:assert/strict';
import {PLAYLIST, trackCount} from '../data/playlist.mjs';

const text = JSON.stringify(PLAYLIST);

test('the playlist is thirty tracks in seven movements, in the order it was sent', () => {
  assert.equal(trackCount(), 30);
  assert.equal(PLAYLIST.movements.length, 7);
  assert.deepEqual(PLAYLIST.movements.map((m) => m.tracks.length), [4, 4, 4, 3, 4, 9, 2]);
  const flat = PLAYLIST.movements.flatMap((m) => m.tracks);
  assert.deepEqual(flat[0], {a: 'The Replacements', t: 'Bastards of Young'});
  assert.deepEqual(flat.at(-1), {a: 'Al Green', t: "Let's Stay Together"});
  assert.equal(new Set(flat.map((x) => x.a + ' - ' + x.t)).size, 30, 'no track is listed twice');
  for (const x of flat) assert.ok(x.a && x.t, 'every track has an artist and a title');
});

test('one Richie: no borrowed character names survive, and the five layers are the ones the desktop already uses', () => {
  for (const name of ['Mike', 'Mikey', 'Beard', 'Rocky', 'Sean', 'Carmy', 'Ted']) assert.ok(!new RegExp(`\\b${name}\\b`).test(text), `${name} must not appear`);
  const named = PLAYLIST.movements.filter((m) => m.layer);
  assert.deepEqual(named.map((m) => m.layer), ['01', '02', '03', '04', '05']);
  assert.deepEqual(named.map((m) => m.role), ['Heart', 'Angle', 'Signal', 'Hands', 'Truth']);
  for (const m of named) assert.ok(m.head.startsWith(m.role), 'the header names its own layer: ' + m.head);
  assert.equal(PLAYLIST.movements.filter((m) => !m.layer).length, 2, 'the last two movements belong to no single layer');
});

test('the copy says where it came from and what was changed, and carries no em dashes', () => {
  assert.equal((text.match(/—/g) || []).length, 0);
  assert.match(PLAYLIST.note, /Sent by Richie/);
  assert.match(PLAYLIST.note, /not a published Spotify playlist/);
  assert.match(PLAYLIST.edit, /replaced by the layer/);
  assert.equal(PLAYLIST.received, '2026-09-08');
  assert.ok(!/Placeholder/i.test(text), 'the placeholder note is gone');
});
