import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createFolder, resolveFolder, folderMarkdown, folderDocument, bodyOf, FOLDER_VERSION} from '../folder.mjs';
import {createDocumentLibrary} from '../documents.mjs';

const corpus = JSON.parse(await readFile(new URL('../corpus.json', import.meta.url), 'utf8'));
const documents = createDocumentLibrary(corpus);
const meta = {snapshot: corpus.generated, repository: 'https://github.com/AriNova1/richie-jerimovich', made: '2026-09-08'};
const someKept = documents.entries('kept')[0].ref;
const someRefused = documents.entries('refused')[0].ref;
const someCommit = documents.entries('commit')[0].ref;

function store() { const m = new Map(); return {getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k)}; }

test('the folder holds references in the order they were found, never twice, and never past its limit', () => {
  const f = createFolder({documents, storage: null});
  assert.equal(f.add(someKept, 'opened in Finder').ok, true);
  assert.equal(f.add(someRefused, 'investigated').ok, true);
  assert.equal(f.add(someKept).ok, false, 'the same record twice is one artifact');
  assert.deepEqual(f.read().items.map((i) => i.ref.key), [someKept.key, someRefused.key]);
  assert.equal(f.read().items[0].how, 'opened in Finder');
  f.move(1, 0);
  assert.deepEqual(f.read().items.map((i) => i.ref.key), [someRefused.key, someKept.key]);
  f.remove(someRefused);
  assert.equal(f.count(), 1);
  f.empty();
  assert.equal(f.count(), 0);
});

test('a reference the export cannot resolve is named, not silently dropped', () => {
  const {items, lost} = resolveFolder([
    {ref: someKept, how: 'opened'},
    {ref: {kind: 'kept', key: 'ar-not-a-real-receipt', snapshot: corpus.generated}, how: 'opened'},
    {ref: 'this is not a reference at all', how: 'opened'},
  ], documents);
  assert.equal(items.length, 1);
  assert.equal(lost.length, 2);
  assert.ok(lost.every((x) => x.why && x.why.length > 3), 'each loss says why');
});

test('nothing persists unless the visitor already opted into being remembered', () => {
  const s = store();
  const off = createFolder({documents, storage: s, persist: () => false});
  off.add(someKept);
  assert.equal(s.getItem('zoom.folder.v1'), null, 'a folder is session-only until the visitor opts in');
  const on = createFolder({documents, storage: s, persist: () => true});
  on.add(someKept);
  const saved = JSON.parse(s.getItem('zoom.folder.v1'));
  assert.equal(saved.v, FOLDER_VERSION);
  assert.equal(saved.items.length, 1);
  const back = createFolder({documents, storage: s, persist: () => true});
  back.load();
  assert.equal(back.count(), 1);
  s.setItem('zoom.folder.v1', JSON.stringify({v: 99, items: [{ref: 'x'}]}));
  const future = createFolder({documents, storage: s, persist: () => true});
  future.load();
  assert.equal(future.count(), 0, 'an unknown version restores nothing rather than guessing');
});

test('a record leaves in full: every exported field of a kept receipt survives the trip', () => {
  const entry = documents.resolve(someKept).entry;
  const rows = Object.fromEntries(bodyOf(entry));
  const r = entry.record;
  if (r.claim || r.summary) assert.equal(rows.Claim, r.claim || r.summary);
  if (r.verify_cmd) assert.equal(rows.Command, r.verify_cmd);
  if (r.limits?.length) for (const l of r.limits) assert.ok(rows.Limits.includes(l), 'a limit survives: ' + l);
  assert.ok(!Object.values(rows).some((v) => v.endsWith('…') || v.endsWith('...')), 'nothing is truncated');
});

test('the document names its export, refuses to call itself a publication, and carries no em dashes', () => {
  const f = createFolder({documents, storage: null});
  f.add(someKept, 'opened in Finder'); f.add(someRefused, 'investigated'); f.add(someCommit, 'sent from Time Machine');
  const resolved = f.read();
  const html = folderDocument(resolved, meta);
  const md = folderMarkdown(resolved, meta);
  for (const out of [html, md]) {
    assert.ok(out.includes(corpus.generated), 'names the export it was drawn from');
    assert.ok(/not a publication/.test(out), 'refuses to present itself as a publication');
    assert.ok(!out.includes('—'), 'no em dashes');
  }
  assert.ok(html.includes('<h1>3 artifacts'), 'the cover counts what is inside');
  assert.ok(html.includes('@page'), 'it is typeset for paper, not only for a screen');
  assert.equal((md.match(/^## /gm) || []).length, 4, 'three artifacts and a colophon');
});

test('a folder built against an older export names what it can no longer show', () => {
  const stale = {kind: 'kept', key: someKept.key, snapshot: '2020-01-01T00:00:00Z'};
  const resolved = resolveFolder([{ref: stale, how: 'opened'}], documents);
  assert.equal(resolved.items.length, 0);
  assert.equal(resolved.lost.length, 1);
  const html = folderDocument(resolved, meta);
  assert.ok(html.includes('Named but not shown'));
  assert.ok(html.includes(someKept.key), 'the missing artifact is named on the page');
});
