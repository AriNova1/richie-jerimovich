/* Every sentence in a declared correction must appear, verbatim, in the
   journal entry it names.

   The file it guards exists because the derived version published a sentence
   about system design as an admission of error. Hand-writing the replacement
   removes the regex problem and introduces a worse one: nothing stops a
   hand-written "quote" from being a paraphrase, or from being invented
   outright. This is the thing that stops it. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const yaml = readFileSync('_data/corrections.yml', 'utf8');

/* A deliberately small YAML reader: this file's shape is fixed and adding a
   parser dependency to guard five rows is worse than reading them. */
function rows(src) {
  const out = [];
  let cur = null, key = null, buf = null;
  for (const raw of src.split('\n')) {
    if (/^\s*#/.test(raw) || (!raw.trim() && !buf)) continue;
    const item = /^- (\w[\w-]*): (.*)$/.exec(raw);
    if (item) { if (cur) out.push(cur); cur = {}; cur[item[1]] = item[2]; key = item[1]; buf = null; continue; }
    if (!cur) continue;
    const fold = /^  (\w[\w-]*): >-\s*$/.exec(raw);
    if (fold) { key = fold[1]; buf = []; cur[key] = ''; continue; }
    const kv = /^  (\w[\w-]*): (.*)$/.exec(raw);
    if (kv) { if (buf) { cur[key] = buf.join(' ').replace(/\s+/g, ' ').trim(); buf = null; } key = kv[1]; cur[key] = kv[2]; continue; }
    if (buf && /^\s{4,}\S/.test(raw)) { buf.push(raw.trim()); continue; }
    if (buf) { cur[key] = buf.join(' ').replace(/\s+/g, ' ').trim(); buf = null; }
  }
  if (cur && buf) cur[key] = buf.join(' ').replace(/\s+/g, ' ').trim();
  if (cur) out.push(cur);
  return out;
}

const CORRECTIONS = rows(yaml);

test('there is at least one declared correction', () => {
  assert.ok(CORRECTIONS.length >= 1, 'corrections.yml parsed to nothing');
});

for (const c of CORRECTIONS) {
  test(`${c.id}: names a journal entry that exists`, () => {
    assert.ok(c.source, `${c.id} has no source`);
    assert.doesNotThrow(() => readFileSync(c.source, 'utf8'), `${c.source} is missing`);
  });

  test(`${c.id}: every quoted sentence is verbatim in ${c.source}`, () => {
    const body = readFileSync(c.source, 'utf8').replace(/\s+/g, ' ');
    const sentences = String(c.quote || '').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 12);
    assert.ok(sentences.length, `${c.id} has no quote`);
    for (const s of sentences) {
      /* markdown emphasis inside the source must not defeat the match */
      const plain = body.replace(/\*\*/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
      const want = s.replace(/\*\*/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
      assert.ok(plain.includes(want), `${c.id}: not verbatim in ${c.source}\n    wanted: ${want}`);
    }
  });

  test(`${c.id}: carries the fields a reader needs to check it`, () => {
    for (const k of ['published', 'corrects', 'headline', 'claimed', 'corrected', 'how_found']) {
      assert.ok(String(c[k] || '').trim().length > 2, `${c.id} is missing ${k}`);
    }
    assert.ok(!/—/.test(c.headline), `${c.id}: em dash in visible copy`);
  });
}
