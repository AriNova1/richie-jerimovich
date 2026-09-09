import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createDocumentLibrary,serializeDocumentRef,parseDocumentRef,documentHash,parseDocumentHash} from '../documents.mjs';
import {createAppHost} from '../app-host.mjs';
const corpus=JSON.parse(await readFile(new URL('../corpus.json',import.meta.url),'utf8'));
// Synthetic fixtures below are deliberately separate from the public export.
const fixture={generated:'2026-09-07T01:00:00Z',kept:[{id:'a',title:'Alpha'},{id:'b',title:'Beta'}],writing:[{slug:'note/a',title:'A note'}],refused:[{reason:'First refusal'},{reason:'Second refusal'}],wrong:[{sentence:'A correction'}],log:[{sha:'abc1234'}]};
test('every supplied public record with an identity round-trips through a link',()=>{
 const library=createDocumentLibrary(corpus);
 for(const entry of library.entries()){
  const ref=parseDocumentHash(documentHash(entry.ref));
  const result=library.resolve(ref);
  assert.equal(result.ok,true,entry.ref.key);assert.equal(result.entry.record,entry.record);
 }
});
test('stable IDs survive collection order changes within the same snapshot',()=>{
 const a=createDocumentLibrary(fixture), b=createDocumentLibrary({...fixture,kept:[...fixture.kept].reverse()});
 const ref=a.entries('kept')[0].ref;
 assert.equal(b.resolve(ref).entry.record.title,'Alpha');
});
test('snapshot mismatch never resolves to a different refusal at the same index',()=>{
 const a=createDocumentLibrary(fixture), b=createDocumentLibrary({...fixture,generated:'later',refused:[...fixture.refused].reverse()});
 assert.equal(b.resolve(a.entries('refused')[0].ref).reason,'snapshot-mismatch');
});
test('even stable IDs require the requested source version',()=>{
 const a=createDocumentLibrary(fixture),b=createDocumentLibrary({...fixture,generated:'later'});
 assert.equal(b.resolve(a.entries('kept')[0].ref).reason,'snapshot-mismatch');
});
test('duplicate IDs are ambiguous rather than last-write-wins',()=>{
 const a=createDocumentLibrary({...fixture,kept:[{id:'a'},{id:'a'}]});
 assert.equal(a.resolve(a.entries('kept')[0].ref).reason,'ambiguous-reference');
});
test('malformed refs, prototype keys, corrupted encoding and missing records fail explicitly',()=>{
 const library=createDocumentLibrary(fixture);
 for(const ref of [null,{},[],{kind:'__proto__',key:'a',snapshot:fixture.generated},{kind:'kept',key:5,snapshot:fixture.generated}])assert.equal(library.resolve(ref).reason,'invalid-reference');
 assert.equal(library.resolve({kind:'kept',key:'missing',snapshot:fixture.generated}).reason,'not-found');
 for(const text of ['{','null','[]','x'.repeat(13000)])assert.equal(parseDocumentRef(text),null);
 assert.equal(parseDocumentHash('#document=%ZZ'),null);assert.equal(parseDocumentHash('#other=x'),null);
 assert.throws(()=>serializeDocumentRef({}));
});
test('library does not mutate input or invent IDs for missing kept records',()=>{
 const input=structuredClone(fixture);input.kept.push({title:'No id'});const before=JSON.stringify(input);
 assert.equal(createDocumentLibrary(input).entries('kept').length,2);assert.equal(JSON.stringify(input),before);
});
function host(){return {cleared:0,replaceChildren(){this.cleared++;}};}
test('app replacement and double-close destroy each mounted instance exactly once',()=>{
 const apps=createAppHost({token:1}),h=host();let mounted=0,closed=0;
 apps.register('test',(el,options)=>{assert.equal(el,h);assert.equal(options.token,1);mounted++;return {getState:()=>options.initialState,destroy(){closed++;}};});
 apps.mount('test',h,{selected:'a'});assert.deepEqual(apps.getState('test'),{selected:'a'});
 apps.mount('test',h,{selected:'b'});assert.equal(closed,1);
 apps.unmount('test');apps.unmount('test');apps.destroy();assert.equal(mounted,2);assert.equal(closed,2);
});
test('app failures clear their partial content and unknown registrations fail before mounting',()=>{
 const apps=createAppHost(),h=host();
 apps.register('bad',()=>{throw Error('partial failure');});assert.throws(()=>apps.mount('bad',h),/partial failure/);assert.equal(h.cleared,1);
 assert.throws(()=>apps.mount('unknown',h),/Unknown app/);assert.throws(()=>apps.register('bad',()=>{}),/already registered/);
});
test('one cleanup failure does not prevent the other apps from being destroyed',()=>{
 const apps=createAppHost();let closed=false;
 apps.register('a',()=>({destroy(){throw Error('cleanup');}}));apps.register('b',()=>({destroy(){closed=true;}}));
 apps.mount('a',host());apps.mount('b',host());assert.throws(()=>apps.destroy(),AggregateError);assert.equal(closed,true);
 apps.destroy();assert.throws(()=>apps.mount('b',host()),/disposed/);
});

/* C13: the refusal ledger is grouped, and grouping must not lose or duplicate
   a row. A bucket that quietly swallowed leftovers would be worse than none. */
test('every refusal lands in exactly one group, and nothing is hidden', async () => {
  const {classifyRefusals, REFUSAL_CLASSES} = await import('../record.mjs');
  const corpus = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../corpus.json', import.meta.url), 'utf8'));
  const groups = classifyRefusals(corpus.refused);
  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  assert.equal(total, corpus.refused.length, 'no row is dropped');
  const seen = new Set();
  for (const g of groups) for (const r of g.rows) {
    const id = r.commit + '|' + r.date + '|' + r.reason;
    assert.ok(!seen.has(id), 'no row is counted twice');
    seen.add(id);
  }
  for (const g of groups) assert.ok(g.note && g.note.length > 30, g.label + ' says why it exists');
  const other = groups.find((g) => g.key === 'other');
  if (other) assert.ok(other.rows.length < corpus.refused.length * 0.2, 'Other is a remainder, not the answer');
  for (const c of REFUSAL_CLASSES) assert.ok(c.match instanceof RegExp, c.key + ' states its rule');
  assert.ok(classifyRefusals([]).length === 0 && classifyRefusals(null).length === 0, 'an empty ledger groups to nothing');
});

/* C14: unfinished business. A question with no stated way to settle it is a
   mood, so the builder drops it and this asserts the rule holds. */
test('every published question says what would settle it, and cites something checkable', async () => {
  const {orderQuestions} = await import('../apps/questions.mjs');
  const corpus = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../corpus.json', import.meta.url), 'utf8'));
  const qs = corpus.questions || [];
  assert.ok(qs.length >= 4, 'there are questions');
  for (const q of qs) {
    assert.ok(q.question && q.question.length > 15, 'it is a question: ' + q.id);
    assert.ok(q.would_settle && q.would_settle.length > 40, q.id + ' says what would settle it');
    assert.ok(q.standing && q.standing.length > 40, q.id + ' says where it stands');
    assert.ok(['open', 'narrowed', 'settled'].includes(q.state), q.id + ' has a known state');
    assert.ok(q.cites.length > 0, q.id + ' cites something checkable');
    if (q.state === 'settled') assert.ok(q.settled_by && q.settled_on, q.id + ' says what settled it and when');
    assert.ok(!/—/.test(JSON.stringify(q)), q.id + ' carries no em dash');
  }
  const ordered = orderQuestions(qs);
  assert.equal(ordered.length, qs.length, 'ordering loses nothing');
  assert.equal(ordered.at(-1).state, 'settled', 'settled questions sort last');
  assert.equal(ordered[0].kind, 'gap', 'the gap it is worst at reads first');
  assert.equal(corpus.counts.open_questions, qs.filter((q) => q.state !== 'settled').length);
  assert.deepEqual(orderQuestions(null), [], 'an empty set orders to nothing');
});

/* C15: the Service Tape. The replay uses recorded offsets, so the timeline
   must never invent a duration or reorder the night. */
test('the tape timeline is the recorded night, in order, with real offsets', async () => {
  const {timeline} = await import('../apps/tape.mjs');
  const corpus = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../corpus.json', import.meta.url), 'utf8'));
  const tapes = corpus.tapes || [];
  assert.ok(tapes.length >= 1, 'at least one night is exported');
  for (const t of tapes) {
    const {total, showTotal, steps} = timeline(t);
    assert.equal(steps.length, t.steps.length, t.date + ' keeps every step');
    assert.deepEqual(steps.map((s) => s.slug), t.steps.map((s) => s.slug), t.date + ' keeps the recorded order');
    for (const s of steps) {
      assert.ok(s.at >= 0, 'no step starts before the run');
      assert.ok(s.at + s.took <= total + 1, t.date + '/' + s.slug + ' ends inside the run');
      assert.ok(Number.isFinite(s.took), 'every duration is a number');
    }
    assert.ok(total > 0, t.date + ' has a length');
    // The beat may only ever delay a step, never move it earlier than recorded.
    for (const s of steps) assert.ok(s.showAt >= s.at, t.date + '/' + s.slug + ' never plays before it ran');
    for (let i = 1; i < steps.length; i++) assert.ok(steps[i].showAt >= steps[i - 1].showAt, 'paced order matches recorded order');
    assert.ok(showTotal >= total || steps.length === 0, 'pacing never shortens the night');
    assert.equal(t.steps_total, t.steps.length, t.date + ' agrees with its own step count');
    /* The run records three verdicts. A declined commit must say why; a
       plain one was never weighed, so demanding a reason from it would be
       demanding a judgement nobody made. */
    const by = (v) => (t.commits || []).filter((c) => c.status === v);
    assert.equal(by('receipt').length, t.receipts_kept, t.date + ': the commits agree with receipts_kept');
    assert.equal(by('declined').length, t.claims_declined, t.date + ': the commits agree with claims_declined');
    for (const c of by('declined')) assert.ok(c.rejection_reason, t.date + '/' + c.sha + ' says why it was declined');
    for (const c of by('receipt')) assert.ok(c.receipt_id, t.date + '/' + c.sha + ' names the receipt it earned');
    for (const c of (t.commits || [])) assert.ok(['receipt', 'declined', 'plain'].includes(c.status), t.date + ': known verdict, got ' + c.status);
  }
  assert.deepEqual(timeline(null), {total: 0, showTotal: 0, steps: []}, 'no tape replays as nothing');
  assert.deepEqual(timeline({steps: []}), {total: 0, showTotal: 0, steps: []});
});
