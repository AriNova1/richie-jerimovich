import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkspaceMemory, WORKSPACE_VERSION} from '../workspace.mjs';
import {createDocumentLibrary} from '../documents.mjs';

// Synthetic fixture, deliberately not the public export.
const corpus = {generated:'2026-09-07T01:00:00Z', kept:[{id:'a',title:'Alpha'},{id:'b',title:'Beta'}], writing:[{slug:'note/a',title:'A note'}], refused:[{reason:'r0'}], wrong:[], log:[{sha:'abc1234'}]};
const documents = createDocumentLibrary(corpus);
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m }; };
const snapshot = corpus.generated;
const ref = (kind, key) => ({kind, key, snapshot});

test('disabled by default; nothing is written until the visitor opts in', () => {
  const s = mem(); const w = createWorkspaceMemory({storage: s, snapshot, documents});
  assert.equal(w.available, true); assert.equal(w.enabled(), false);
  assert.deepEqual(w.save({windows: []}), {ok: false, reason: 'disabled'});
  assert.equal(s._m.size, 0);
  assert.equal(w.load(), null);
});

test('opt in, save, load round-trips only references and visitor text', () => {
  const s = mem(); const w = createWorkspaceMemory({storage: s, snapshot, documents});
  assert.equal(w.enable(), true);
  const r = w.save({appearance: 'dark', finder: {folder: 'kept', view: 'gallery'}, selectedDocument: ref('kept', 'a'), drafts: {messages: 'hello'}, windows: [{id: 'finder', hidden: false, geometry: {rect: {x: 8, y: 36, w: 700, h: 700}, floating: {x: 300, y: 60, w: 900, h: 640}, tiled: 'left', zoomed: false}, state: null}, {id: 'preview', hidden: false, geometry: null, state: {ref: ref('kept', 'b')}}]});
  assert.equal(r.ok, true);
  const loaded = w.load();
  assert.equal(loaded.snapshotMatches, true);
  assert.deepEqual(loaded.stale, []);
  assert.equal(loaded.state.appearance, 'dark');
  assert.deepEqual(loaded.state.finder, {folder: 'kept', view: 'gallery'});
  assert.equal(loaded.state.selectedDocument.key, 'a');
  assert.equal(loaded.state.drafts.messages, 'hello');
  assert.equal(loaded.state.windows.length, 2);
  assert.equal(loaded.state.windows[0].geometry.tiled, 'left');
  assert.equal(loaded.state.windows[1].state.ref.key, 'b');
  assert.ok(!w.exportJSON().includes('Alpha'), 'the export carries references, not record content');
});

test('a reference that does not resolve is dropped and named, never replaced', () => {
  const s = mem(); const w = createWorkspaceMemory({storage: s, snapshot, documents}); w.enable();
  w.save({windows: [{id: 'preview', state: {ref: ref('kept', 'missing')}}, {id: 'comparison', state: {leftId: 'a', rightId: 'zzz'}}, {id: 'notes', state: {slug: 'note/nope', folder: 'journal'}}], selectedDocument: ref('kept', 'a')});
  const loaded = w.load();
  assert.deepEqual(loaded.state.windows.map((x) => x.id), ['comparison', 'notes']);
  assert.deepEqual(loaded.state.windows[0].state, {leftId: 'a', rightId: undefined});
  assert.equal(loaded.state.windows[1].state.slug, null);
  assert.deepEqual(loaded.stale.map((x) => [x.where, x.key]), [['Quick Look', 'missing'], ['Compare, right', 'zzz'], ['Notes', 'note/nope']]);
});

test('a different export snapshot still validates every reference against the current export', () => {
  const s = mem(); const w = createWorkspaceMemory({storage: s, snapshot: 'old-snapshot', documents}); w.enable();
  w.save({windows: [{id: 'preview', state: {ref: {kind: 'kept', key: 'a', snapshot: 'old-snapshot'}}}]});
  const w2 = createWorkspaceMemory({storage: s, snapshot, documents});
  const loaded = w2.load();
  assert.equal(loaded.snapshotMatches, false);
  assert.equal(loaded.state.windows.length, 0, 'a reference stamped with another snapshot is stale by definition');
  assert.equal(loaded.stale[0].reason, 'snapshot-mismatch');
});

test('an unknown storage version restores nothing', () => {
  const s = mem(); const w = createWorkspaceMemory({storage: s, snapshot, documents}); w.enable();
  s.setItem('zoom.workspace.v' + WORKSPACE_VERSION, JSON.stringify({version: 99, windows: [{id: 'finder'}]}));
  assert.equal(w.load(), null);
  s.setItem('zoom.workspace.v' + WORKSPACE_VERSION, '{not json');
  assert.equal(w.load(), null);
});

test('forget clears both the opt-in and the saved state; reset clears only the state', () => {
  const s = mem(); const w = createWorkspaceMemory({storage: s, snapshot, documents}); w.enable();
  w.save({windows: []}); assert.equal(w.hasSaved(), true);
  w.reset(); assert.equal(w.hasSaved(), false); assert.equal(w.enabled(), true);
  w.disable(); assert.equal(w.enabled(), false); assert.equal(s._m.size, 0);
});

test('quota errors are reported, not thrown; a broken storage is reported as unavailable', () => {
  const s = mem(); const w = createWorkspaceMemory({storage: s, snapshot, documents}); w.enable();
  s.setItem = () => { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; };
  assert.deepEqual(w.save({windows: []}), {ok: false, reason: 'quota'});
  const broken = { getItem() { throw new Error('no'); }, setItem() { throw new Error('no'); }, removeItem() { throw new Error('no'); } };
  const w2 = createWorkspaceMemory({storage: broken, snapshot, documents});
  assert.equal(w2.available, false); assert.equal(w2.enabled(), false); assert.equal(w2.enable(), false);
  const w3 = createWorkspaceMemory({storage: null, snapshot, documents});
  assert.equal(w3.available, false);
});
