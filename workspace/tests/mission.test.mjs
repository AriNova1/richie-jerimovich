import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateEdition} from '../mission.mjs';
import {createDocumentLibrary} from '../documents.mjs';

const corpus = JSON.parse(await readFile(new URL('../corpus.json', import.meta.url), 'utf8'));
const editions = JSON.parse(await readFile(new URL('../data/editions.json', import.meta.url), 'utf8'));
const cases = JSON.parse(await readFile(new URL('../data/cases.json', import.meta.url), 'utf8'));
const documents = createDocumentLibrary(corpus);
const isKnownCase = (id) => cases.cases.some((c) => c.id === id);

test('every shipped edition resolves completely in the current export', () => {
  assert.equal(editions.snapshot, corpus.generated);
  for (const e of editions.editions) {
    const v = validateEdition({...e, snapshot: editions.snapshot}, documents, {isKnownCase});
    assert.equal(v.missing, 0, e.id);
    assert.equal(v.openable, true, e.id);
    assert.ok(v.artifacts.length >= 3 && v.artifacts.length <= 5, e.id + ' has 3 to 5 artifacts');
    assert.ok(v.takeaway?.ok, e.id + ' takeaway resolves');
    assert.ok(!/—/.test(JSON.stringify(e)), e.id + ' has no em dashes');
  }
});

test('an edition with a missing artifact is offered as blocked, not silently trimmed', () => {
  const e = structuredClone(editions.editions[0]);
  e.artifacts[0].ref.key = 'ar-not-here';
  e.arrangement[1].ref.key = 'ar-not-here';
  const v = validateEdition({...e, snapshot: editions.snapshot}, documents, {isKnownCase});
  assert.equal(v.missing, 1);
  assert.equal(v.artifacts[0].ok, false);
  assert.equal(v.openable, false);
});

test('an edition whose case is unknown cannot claim its takeaway', () => {
  const e = structuredClone(editions.editions[0]);
  e.takeaway.caseId = 'case-nope';
  const v = validateEdition({...e, snapshot: editions.snapshot}, documents, {isKnownCase});
  assert.equal(v.takeaway.ok, false);
  assert.equal(v.openable, true, 'the arrangement itself still opens');
});
