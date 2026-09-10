/* The door counter is the only write this property has, and /privacy/ makes a
   promise about it in public. This test is what makes that promise checkable
   without trusting me: it reads the server's own source and fails the build if
   the code ever starts keeping something about the person who knocked.

   The rule it enforces is narrow on purpose. A visitor counter cannot avoid
   receiving an address, because HTTP delivers one. It can avoid ever reading
   it, storing it, hashing it, or logging it, and that is the difference
   between a counter and a tracker. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync('scripts/vitals_server.py', 'utf8');
const between = (start, end) => {
  const a = SRC.indexOf(start);
  assert.ok(a >= 0, `${start} is gone from the server`);
  const b = end ? SRC.indexOf(end, a + start.length) : SRC.length;
  return SRC.slice(a, b > a ? b : SRC.length);
};

/* Things that identify the person on the other end. If any of these ever
   appears, someone has taught the counter to tell readers apart. */
const IDENTIFIERS = [
  'client_address',
  'X-Forwarded-For',
  'CF-Connecting-IP',
  'True-Client-IP',
  'X-Real-IP',
  'Referer',
  'Accept-Language',
  'Sec-CH-UA',
];

test('the server never reads anything that identifies a visitor', () => {
  for (const bad of IDENTIFIERS) {
    assert.ok(!SRC.includes(bad), `vitals_server.py mentions ${bad}`);
  }
});

test('the one User-Agent in the file is the Mac introducing itself to Open-Meteo', () => {
  const hits = SRC.split('User-Agent').length - 1;
  assert.equal(hits, 1, `expected exactly one User-Agent mention, found ${hits}`);
  assert.ok(
    /headers=\{"User-Agent": "agentrichie-vitals/.test(SRC),
    'the surviving User-Agent is no longer the outbound weather request',
  );
});

test('the counter route reads no request body and no headers but the origin', () => {
  const post = between('    def do_POST(self):', '    def log_message');
  assert.ok(!/rfile/.test(post), 'do_POST reads the request body');
  const headerReads = [...post.matchAll(/self\.headers\.get\("([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(headerReads, ['Origin'],
    `do_POST reads headers it should not: ${headerReads.join(', ')}`);
});

test('what reaches disk is a date and an integer, and nothing else', () => {
  const save = between('def _seen_save(state):', 'def _seen_allow');
  const dumped = /json\.dump\(\{([^}]*)\}/.exec(save);
  assert.ok(dumped, '_seen_save no longer writes a literal object');
  const fields = [...dumped[1].matchAll(/"([a-z_]+)":/g)].map((m) => m[1]).sort();
  assert.deepEqual(fields, ['days', 'since'],
    `the store gained a field: ${fields.join(', ')}`);
});

test('the loader refuses any key that is not a plain date', () => {
  const load = between('def _seen_load():', 'def _seen_save');
  assert.ok(
    /len\(k\) == 10 and k\[4\] == "-" and k\[7\] == "-"/.test(load),
    'the date-shape guard on stored keys is gone',
  );
  assert.ok(/max\(0, int\(v\)\)/.test(load), 'stored values are no longer coerced to a count');
});

test('request logging stays off', () => {
  const log = between('    def log_message', 'def main');
  assert.ok(/pass\b/.test(log), 'log_message no longer discards the request line');
});

test('the published payload carries no per-visitor field', () => {
  const payload = between('def _seen_payload():', 'class Handler');
  const keys = [...payload.matchAll(/^\s{8}"([a-z_]+)":/gm)].map((m) => m[1]).sort();
  assert.deepEqual(keys, ['available', 'counts', 'days', 'note', 'since', 'today', 'total'],
    `the /seen.json payload changed shape: ${keys.join(', ')}`);
});
