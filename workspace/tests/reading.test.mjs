/* The journal is the largest body of Richie's writing on the property, and in
   the workspace it was set at 12px running 132 characters to the line. This
   fixes the measure in place so nobody widens it back by tidying a stylesheet.

   It reads the rules rather than the render, because a browser is not
   available here; scripts/review measures the rendered result at three
   viewports and is the check that actually proves the number. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CSS = readFileSync('workspace/record.css', 'utf8');
const MJS = readFileSync('workspace/record.mjs', 'utf8');
const TYPE = readFileSync('workspace/type.css', 'utf8');

const rule = (selector) => {
  const m = new RegExp(`(^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(CSS);
  return m ? m[2] : null;
};
const stepPx = (name) => {
  const m = new RegExp(`--${name}:\\s*(\\d+)px`).exec(TYPE);
  return m ? Number(m[1]) : null;
};

test('the entry body is capped to a readable measure', () => {
  const r = rule('.record-read');
  assert.ok(r, '.record-read is gone; the journal has no measure');
  const m = /max-width:\s*(\d+)ch/.exec(r);
  assert.ok(m, `.record-read no longer caps its width: ${r}`);
  const ch = Number(m[1]);
  assert.ok(ch >= 45 && ch <= 75, `${ch}ch is outside the comfortable range for continuous reading`);
});

test('the entry body is set at a reading size, not the smallest step in the system', () => {
  const r = rule('.record-read > p,\n.record-read > ul,\n.record-read > ol,\n.record-read > blockquote')
    || /\.record-read > p,[\s\S]*?\{([^}]*)\}/.exec(CSS)?.[1];
  assert.ok(r, 'the entry body rule is gone');
  const m = /font-size:\s*var\(--t-([a-z]+)\)/.exec(r);
  assert.ok(m, `the entry body no longer uses a step from the ramp: ${r}`);
  const px = stepPx(`t-${m[1]}`);
  assert.ok(px >= 16, `the journal is set at ${px}px (--t-${m[1]}); prose at length needs 16 or more`);
});

test('a phone is never given smaller type than a desktop for the same prose', () => {
  /* The rule I wrote first dropped the phone to --t-body, which is a shrink.
     Phones get the same size or larger; that is the whole point of the rule. */
  const phone = /@media \(max-width:700px\)\{([\s\S]*?)\n\}/.exec(CSS);
  assert.ok(phone, 'the phone block for reading is gone');
  assert.ok(!/font-size/.test(phone[1]),
    `the phone block changes the reading size, which can only make it smaller: ${phone[1].trim()}`);
});

test('every entry ends with a way to the next one, in the markup and not only in script', () => {
  assert.ok(/data-read-go=/.test(MJS), 'the next-entry control is no longer rendered');
  assert.ok(/read-place/.test(MJS), 'the place marker is gone, so a reader cannot tell where they are');
  assert.ok(/This is the first entry\./.test(MJS), 'the oldest entry has no honest end state');
  assert.ok(/This is the most recent entry\./.test(MJS), 'the newest entry has no honest end state');
});

test('the notes above the list are wider than the prose, not narrower', () => {
  const note = /\.finder-records > \.record-note\{([^}]*)\}/.exec(CSS);
  assert.ok(note, 'the note cap is gone');
  const n = Number(/max-width:\s*(\d+)ch/.exec(note[1])[1]);
  const body = Number(/max-width:\s*(\d+)ch/.exec(rule('.record-read'))[1]);
  assert.ok(n > body, `notes at ${n}ch are not wider than the prose at ${body}ch`);
});
